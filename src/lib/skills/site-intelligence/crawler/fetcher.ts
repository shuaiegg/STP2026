import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ProxyManager, ProxyConfig } from './proxy-manager';

/**
 * Build an HttpsProxyAgent based on ProxyConfig
 */
const buildAgentFromConfig = (config: ProxyConfig | null) => {
    if (!config) return undefined;
    
    const manager = ProxyManager.getInstance();
    const proxyUrl = manager.formatProxyUrl(config);
    
    return new HttpsProxyAgent(proxyUrl, {
        keepAlive: true,
        maxSockets: 10,
    });
};

export const AXIOS_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
};

/**
 * 封装底层的网络抓取逻辑，使用 ProxyManager 进行自动代理轮询
 * 
 * @param attempt 当前尝试次数（用于重试逻辑）
 */
export async function fetchHtml(
    url: string,
    timeout = 15000,
    attempt = 1
): Promise<{ html: string; loadTime: number; status: number; error?: string; transport?: boolean }> {
    const startTime = Date.now();
    const proxyManager = ProxyManager.getInstance();
    
    // 获取当前请求的代理配置
    const proxyConfig = await proxyManager.getNextProxy();
    const agent = buildAgentFromConfig(proxyConfig);

    try {
        const response = await axios.get(url, {
            timeout,
            headers: AXIOS_HEADERS,
            // 禁用自带 proxy，使用 agent 实现 TLS 隧道支持
            proxy: false as const,
            httpsAgent: agent,
            httpAgent: agent,
            // 自动跟随重定向
            maxRedirects: 5,
            validateStatus: (status) => status < 400 || status === 404,
        });

        const loadTime = Date.now() - startTime;
        return { html: response.data, loadTime, status: response.status };
    } catch (error: any) {
        const loadTime = Date.now() - startTime;
        let errorMessage = error.message;

        // 如果发生了代理相关错误，向 ProxyManager 汇报以便拉黑
        if (proxyConfig && (
            error.code === 'ECONNREFUSED' || 
            error.code === 'EHOSTUNREACH' || 
            error.code === 'ECONNRESET' ||
            errorMessage.includes('proxy')
        )) {
            proxyManager.reportFailure(proxyConfig);
            errorMessage = `Proxy Error: ${error.code || 'Connection Failed'}`;
        }

        if (error.code === 'ECONNABORTED') errorMessage = 'Timeout';
        if (error.code === 'ENOTFOUND') errorMessage = 'DNS Not Found';

        // 针对特定网络抖动错误进行重试 (Socket Hangup, ECONNRESET, Proxy Failure)
        const isRetryable = 
            error.code === 'ECONNRESET' || 
            errorMessage.includes('socket hang up') || 
            errorMessage.includes('disconnected') ||
            errorMessage.includes('Proxy Error');

        if (isRetryable && attempt < 2) {
            console.log(`[Crawler Fetcher] Retrying ${url} with a different proxy (Attempt ${attempt + 1})...`);
            // 等待一小会儿再重试
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchHtml(url, timeout, attempt + 1);
        }

        console.error(`[Crawler Fetcher] Error fetching ${url}: ${errorMessage}`);

        // 区分两类失败：
        // - 服务器响应了错误状态(error.response 存在) → 站点可达，这是一条"坏页面"发现，status 为真实码
        // - 无任何响应(超时/DNS/连接拒绝/重置) → 传输失败，status:0 + transport:true，才计入熔断
        const httpStatus = error.response?.status;
        if (httpStatus) {
            return { html: '', loadTime, status: httpStatus, error: errorMessage };
        }
        return { html: '', loadTime, status: 0, error: errorMessage, transport: true };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GEO Readiness: Site-level signal fetchers (Tasks 1.1.1 – 1.1.3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Known AI crawler User-agent identifiers mapped to a friendly key.
 * Task 1.1.1: GPTBot / Google-Extended / ClaudeBot(anthropic-ai) / PerplexityBot / CCBot
 */
const AI_CRAWLERS: Record<string, string> = {
    'gptbot': 'GPTBot',
    'google-extended': 'Google-Extended',
    'claudebot': 'ClaudeBot',
    'anthropic-ai': 'ClaudeBot',   // alias — same bot
    'perplexitybot': 'PerplexityBot',
    'ccbot': 'CCBot',
};

/**
 * Parse a robots.txt string and determine the allow/block status for each
 * known AI crawler User-agent.
 *
 * Returns a map of friendly name → 'allowed' | 'blocked'
 */
export function parseRobotsTxtForAiCrawlers(robotsTxt: string): Record<string, 'allowed' | 'blocked'> {
    const lines = robotsTxt.split(/\r?\n/);
    const result: Record<string, 'allowed' | 'blocked'> = {};

    // Collect per-agent rules: { agentKey: { disallow: string[], allow: string[] } }
    const agentRules: Record<string, { disallow: string[]; allow: string[] }> = {};
    let currentAgents: string[] = [];
    // Bug fix #1 — multi-agent groups: consecutive `User-agent:` lines share the
    // following rule block. We only reset the group when a User-agent line follows
    // a directive (the previous group's rules ended). Tracking this flag lets
    // `User-agent: GPTBot` + `User-agent: CCBot` + `Disallow: /` block BOTH.
    let lastWasDirective = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const directive = line.slice(0, colonIdx).trim().toLowerCase();
        const value = line.slice(colonIdx + 1).trim();

        if (directive === 'user-agent') {
            // A User-agent after a rule line starts a NEW group; consecutive
            // User-agent lines accumulate into the SAME group.
            if (lastWasDirective) currentAgents = [];
            lastWasDirective = false;
            const agentLower = value.toLowerCase();
            const matchedKey = Object.keys(AI_CRAWLERS).find(k => agentLower === k) || (agentLower === '*' ? '*' : null);
            if (matchedKey) currentAgents.push(matchedKey);
        } else if (directive === 'disallow' && currentAgents.length > 0) {
            for (const agent of currentAgents) {
                if (!agentRules[agent]) agentRules[agent] = { disallow: [], allow: [] };
                if (value) agentRules[agent].disallow.push(value);
            }
            lastWasDirective = true;
        } else if (directive === 'allow' && currentAgents.length > 0) {
            for (const agent of currentAgents) {
                if (!agentRules[agent]) agentRules[agent] = { disallow: [], allow: [] };
                if (value) agentRules[agent].allow.push(value);
            }
            lastWasDirective = true;
        } else if (directive === 'disallow' || directive === 'allow') {
            // A rule line even for a non-matched group still ends the group.
            lastWasDirective = true;
        }
    }

    // Determine status per AI crawler (unique friendly names)
    const seenNames = new Set<string>();
    for (const [crawlerKey, friendlyName] of Object.entries(AI_CRAWLERS)) {
        if (seenNames.has(friendlyName)) continue;
        seenNames.add(friendlyName);

        const specificRules = agentRules[crawlerKey];
        const wildcardRules = agentRules['*'];
        const effectiveRules = specificRules || wildcardRules;

        if (!effectiveRules) {
            result[friendlyName] = 'allowed';
            continue;
        }

        // Bug fix #2 — only a full-site block (`Disallow: /`) counts as "blocked".
        // Partial disallows (`/admin`, `/private`) do NOT stop the bot from reading
        // content, so they must not trigger a false "you're blocking X" alarm.
        const isFullBlock = effectiveRules.disallow.some(d => d === '/');
        const hasRootAllow = effectiveRules.allow.some(a => a === '/');
        result[friendlyName] = (isFullBlock && !hasRootAllow) ? 'blocked' : 'allowed';
    }

    return result;
}

/**
 * Task 1.1.1 – 1.1.3: Fetch /robots.txt and /llms.txt for the given domain.
 *
 * Failures (timeout/404/network) degrade gracefully — never throw.
 *  - robots not found / fetch failed → treated as "unknown" per crawler
 *  - 404 → all crawlers treated as "allowed" (default)
 *  - llms.txt not found → hasLlmsTxt=false
 */
export async function fetchSiteSignals(normalizedDomain: string): Promise<{
    aiCrawlerStatus: Record<string, 'allowed' | 'blocked' | 'unknown'>;
    hasLlmsTxt: boolean | null;
    robotsFetchFailed: boolean;
    llmsTxtFetchFailed: boolean;
}> {
    const SITE_SIGNAL_TIMEOUT = 8000;
    const uniqueNames = [...new Set(Object.values(AI_CRAWLERS))];

    let aiCrawlerStatus: Record<string, 'allowed' | 'blocked' | 'unknown'> = {};
    let hasLlmsTxt: boolean | null = null;
    let robotsFetchFailed = false;
    let llmsTxtFetchFailed = false;

    const base = normalizedDomain.replace(/\/$/, '');

    // Fetch in parallel (Task 1.1.1 + 1.1.2)
    const [robotsResult, llmsResult] = await Promise.allSettled([
        fetchHtml(`${base}/robots.txt`, SITE_SIGNAL_TIMEOUT),
        fetchHtml(`${base}/llms.txt`, SITE_SIGNAL_TIMEOUT),
    ]);

    // ── robots.txt ────────────────────────────────────────────────────────────
    if (robotsResult.status === 'fulfilled') {
        const { html, status, transport } = robotsResult.value;
        if (transport || status === 0) {
            // True network failure → unknown per crawler (Task 1.1.3)
            robotsFetchFailed = true;
            aiCrawlerStatus = Object.fromEntries(uniqueNames.map(n => [n, 'unknown' as const]));
        } else if (status === 200 && html) {
            // Successful fetch — parse (Task 1.1.1)
            aiCrawlerStatus = parseRobotsTxtForAiCrawlers(html);
        } else {
            // 404 / other HTTP error → no robots.txt = default allow
            aiCrawlerStatus = Object.fromEntries(uniqueNames.map(n => [n, 'allowed' as const]));
        }
    } else {
        // Promise rejection (should not happen with our fetchHtml, but guard it)
        robotsFetchFailed = true;
        aiCrawlerStatus = Object.fromEntries(uniqueNames.map(n => [n, 'unknown' as const]));
    }

    // ── llms.txt ──────────────────────────────────────────────────────────────
    if (llmsResult.status === 'fulfilled') {
        const { status, transport } = llmsResult.value;
        if (transport || status === 0) {
            llmsTxtFetchFailed = true;
            hasLlmsTxt = null;
        } else {
            hasLlmsTxt = status === 200;
        }
    } else {
        llmsTxtFetchFailed = true;
        hasLlmsTxt = null;
    }

    return { aiCrawlerStatus, hasLlmsTxt, robotsFetchFailed, llmsTxtFetchFailed };
}
