/**
 * Proxy Manager for STP2026 Crawler
 * Integration with WebShare API for automatic proxy rotation and health management.
 */

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'socks5';
  id?: string;
}

export class ProxyManager {
  private static instance: ProxyManager;
  private proxies: ProxyConfig[] = [];
  private lastFetchTime: number = 0;
  private currentIndex: number = 0;
  private failures: Map<string, number> = new Map();
  
  // Cache expiry: 30 minutes
  private readonly CACHE_EXPIRY = 30 * 60 * 1000;
  // Maximum failures before blacklisting a proxy
  private readonly MAX_FAILURES = 3;

  private constructor() {}

  public static getInstance(): ProxyManager {
    if (!ProxyManager.instance) {
      ProxyManager.instance = new ProxyManager();
    }
    return ProxyManager.instance;
  }

  /**
   * Fetches proxy list from WebShare API
   */
  private async fetchProxies(): Promise<ProxyConfig[]> {
    const apiKey = process.env.WEBSHARE_API_KEY;
    if (!apiKey) {
      console.warn('[ProxyManager] No WEBSHARE_API_KEY found in environment.');
      return [];
    }

    try {
      console.log('[ProxyManager] Refreshing proxy list from WebShare...');
      // WebShare API v2 requires mode=direct or other parameters for list
      const response = await fetch('https://proxy.webshare.io/api/v2/proxy/list/?page_size=100&mode=direct', {
        headers: {
          'Authorization': `Token ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`WebShare API error: ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.results || [];
      
      const newProxies: ProxyConfig[] = results.map((p: any) => ({
        host: p.proxy_address,
        port: p.port,
        username: p.username,
        password: p.password,
        protocol: 'http',
        id: `${p.proxy_address}:${p.port}`
      }));

      this.lastFetchTime = Date.now();
      this.failures.clear(); // Reset failures on fresh fetch
      return newProxies;
    } catch (error) {
      console.error('[ProxyManager] Failed to fetch proxies:', error);
      return [];
    }
  }

  /**
   * Gets the next available proxy in the pool using round-robin
   */
  public async getNextProxy(): Promise<ProxyConfig | null> {
    // 1. Logic for Local Development: Use Clash if configured
    if (process.env.NODE_ENV === 'development' && process.env.CRAWLER_PROXY_HOST) {
      return {
        host: process.env.CRAWLER_PROXY_HOST,
        port: parseInt(process.env.CRAWLER_PROXY_PORT || '7897'),
        protocol: 'http'
      };
    }

    // 2. Production Logic: WebShare Pool
    if (this.proxies.length === 0 || (Date.now() - this.lastFetchTime > this.CACHE_EXPIRY)) {
      this.proxies = await this.fetchProxies();
    }

    if (this.proxies.length === 0) return null;

    // Filter out failed proxies
    const activeProxies = this.proxies.filter(p => (this.failures.get(p.id!) || 0) < this.MAX_FAILURES);
    
    if (activeProxies.length === 0) {
      console.warn('[ProxyManager] All proxies in pool have failed. Retrying fetch...');
      this.proxies = await this.fetchProxies();
      return this.proxies.length > 0 ? this.proxies[0] : null;
    }

    const proxy = activeProxies[this.currentIndex % activeProxies.length];
    this.currentIndex++;
    return proxy;
  }

  /**
   * Reports a failure for a specific proxy
   */
  public reportFailure(proxy: ProxyConfig): void {
    if (!proxy.id) return;
    const count = (this.failures.get(proxy.id) || 0) + 1;
    this.failures.set(proxy.id, count);
    if (count >= this.MAX_FAILURES) {
      console.warn(`[ProxyManager] Proxy ${proxy.id} blacklisted after ${count} failures.`);
    }
  }

  /**
   * Utility to format proxy for Axios/Fetch
   */
  public formatProxyUrl(proxy: ProxyConfig): string {
    if (proxy.username && proxy.password) {
      return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    }
    return `http://${proxy.host}:${proxy.port}`;
  }
}
