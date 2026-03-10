import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// 从环境变量读取代理配置（生产环境留空即不走代理）
export const buildProxyAgent = () => {
    const host = process.env.CRAWLER_PROXY_HOST;
    const port = process.env.CRAWLER_PROXY_PORT || 7897;
    if (!host) {
        console.log('[Crawler Fetcher] No proxy host configured.');
        return undefined;
    }
    const proxyUrl = `http://${host}:${port}`;
    console.log(`[Crawler Fetcher] Initializing HttpsProxyAgent: ${proxyUrl}`);
    return new HttpsProxyAgent(proxyUrl, {
        keepAlive: true,
        maxSockets: 10, // 适度提升并行 Socket 数，配合 Worker Pool 使用
    });
};

// 后台持久化一个 Agent 实例
const proxyAgent = buildProxyAgent();

export const AXIOS_CONFIG = {
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
    },
    // 禁用自带的 proxy 选项，通过 agent 实现更好的 TLS 隧道支持
    proxy: false as const,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
};

/**
 * 封装底层的网络抓取逻辑，暴露统一的带耗时测量的接口
 * 
 * @param attempt 当前尝试次数（用于重试逻辑）
 */
export async function fetchHtml(url: string, timeout = 30000, attempt = 1): Promise<{ html: string; loadTime: number; status: number; error?: string }> {
    const startTime = Date.now();
    try {
        const response = await axios.get(url, {
            ...AXIOS_CONFIG,
            timeout,
            // 自动跟随重定向
            maxRedirects: 5,
            validateStatus: (status) => status < 400 || status === 404,
        });
        const loadTime = Date.now() - startTime;
        return { html: response.data, loadTime, status: response.status };
    } catch (error: any) {
        const loadTime = Date.now() - startTime;
        let errorMessage = error.message;

        if (error.code === 'ECONNABORTED') errorMessage = 'Timeout';
        if (error.code === 'ENOTFOUND') errorMessage = 'DNS Not Found';
        if (error.code === 'ECONNREFUSED' && !!process.env.CRAWLER_PROXY_HOST) errorMessage = 'Proxy Connection Refused';

        // 针对特定网络抖动错误进行一次重试 (Socket Hangup, ECONNRESET)
        const isRetryable = error.code === 'ECONNRESET' || errorMessage.includes('socket hang up') || errorMessage.includes('disconnected');

        if (isRetryable && attempt < 2) {
            console.log(`[Crawler Fetcher] Retrying ${url} due to network instability (Attempt ${attempt + 1})...`);
            // 等待一小会儿再重试
            await new Promise(resolve => setTimeout(resolve, 1500));
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
