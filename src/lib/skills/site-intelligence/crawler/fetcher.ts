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
): Promise<{ html: string; loadTime: number; status: number; error?: string }> {
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
        return {
            html: '',
            loadTime,
            status: error.response?.status || 500,
            error: errorMessage
        };
    }
}
