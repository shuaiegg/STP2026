## ADDED Requirements

### Requirement: Consecutive-failure circuit breaker
The crawler SHALL maintain a `consecutiveFailures` counter that increments on each request failure (network error, timeout, or HTTP 5xx) and resets to 0 on each successful response. When `consecutiveFailures` reaches the threshold of 5, the crawler SHALL immediately abort the crawl and throw a `CrawlerCircuitBreakerError` with a user-friendly Chinese message.

#### Scenario: Circuit breaker trips after 5 consecutive failures
- **WHEN** 5 consecutive page requests all result in network errors, timeouts, or HTTP 5xx responses
- **THEN** the crawler SHALL throw `CrawlerCircuitBreakerError` immediately without attempting further requests
- **AND** the SSE stream SHALL receive a `{ type: 'error', error: '站点无法访问，已停止扫描以保护您的积分' }` event

#### Scenario: Counter resets on success
- **WHEN** a page request succeeds after 4 consecutive failures
- **THEN** `consecutiveFailures` SHALL be reset to 0 and crawling SHALL continue normally

#### Scenario: HTTP 4xx does NOT trip the breaker
- **WHEN** a page returns HTTP 4xx (dead link)
- **THEN** it SHALL be recorded as a `DEAD_LINK` issue but SHALL NOT increment `consecutiveFailures`
- **REASON**: 4xx responses indicate content issues, not site unavailability

#### Scenario: Normal crawl unaffected
- **WHEN** the crawl completes with fewer than 5 consecutive failures at any point
- **THEN** the circuit breaker SHALL NOT interfere with the crawl result
