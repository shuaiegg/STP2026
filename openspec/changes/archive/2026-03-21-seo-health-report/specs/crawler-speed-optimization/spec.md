## ADDED Requirements

### Requirement: Proxy-mode-aware concurrency
The crawler SHALL distinguish between three operating modes and apply different concurrency limits:

| Mode | Condition | Concurrency | Jitter |
|------|-----------|-------------|--------|
| Webshare pool | `WEBSHARE_API_KEY` set | 8 | none |
| Local single proxy | `CRAWLER_PROXY_HOST` set, no `WEBSHARE_API_KEY` | 2 | 400-800ms |
| Direct (no proxy) | neither env var set | 5 | none |

#### Scenario: Webshare pool mode
- **WHEN** `WEBSHARE_API_KEY` is set in the environment
- **THEN** `crawlWithConcurrency` SHALL start with a limit of 8 and SHALL NOT add any inter-request delay

#### Scenario: Local proxy mode
- **WHEN** `CRAWLER_PROXY_HOST` is set and `WEBSHARE_API_KEY` is not set
- **THEN** `crawlWithConcurrency` SHALL start with a limit of 2 and SHALL add 400-800ms random jitter between concurrent requests

#### Scenario: Error-based backoff still applies
- **WHEN** more than 2 errors are detected during a crawl session in any mode
- **THEN** `currentLimit` SHALL be reduced to 1 regardless of the starting mode

### Requirement: Reduced request timeout
The per-page HTTP fetch timeout SHALL be reduced from 30 seconds to 15 seconds to enable faster failure detection and proxy rotation.

#### Scenario: Timeout on slow response
- **WHEN** a target page does not respond within 15 seconds
- **THEN** the fetch SHALL be aborted and the page counted as an error, triggering proxy rotation on retry
