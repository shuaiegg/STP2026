import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): void {
  try {
    getClient()?.capture({ distinctId, event, properties });
  } catch {
    // 追踪失败不影响业务
  }
}
