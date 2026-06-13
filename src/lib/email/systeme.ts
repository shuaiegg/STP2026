import { getIntegrationValue } from '@/lib/integrations/config';

const BASE_URL = 'https://api.systeme.io/api';

// 双账户：locale 决定联系人进哪个 systeme.io 账户
// - 'en' → SYSTEME_IO_API_KEY_EN（英文账户，独立营销序列）
// - 其他/未指定 → SYSTEME_IO_API_KEY（中文/默认账户）
// 标签按账户隔离，账户内用相同的基础标签名（无 _en 后缀）。
// 注意：locale='en' 但未配置英文账户 Key 时，跳过同步（不污染中文账户），
// 上线英文站前需在 /dashboard/admin/integrations 配置英文账户 Key。
export function systemeConfigKey(locale?: string): string {
  return locale === 'en' ? 'SYSTEME_IO_API_KEY_EN' : 'SYSTEME_IO_API_KEY';
}

async function getApiKey(locale?: string): Promise<string | undefined> {
  const configKey = systemeConfigKey(locale);
  const envKey = configKey as 'SYSTEME_IO_API_KEY' | 'SYSTEME_IO_API_KEY_EN';
  try {
    const dbKey = await getIntegrationValue(configKey);
    if (dbKey) return dbKey;
  } catch {
    // fall through to env
  }
  return process.env[envKey];
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Auth-Token': apiKey,
    'X-API-Key': apiKey,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SystemeTag {
  id: number;
  name: string;
}

export interface SystemeContact {
  id: number;
  email: string;
  tags: SystemeTag[];
}

export type TagsResult =
  | { ok: true; tags: SystemeTag[] }
  | { ok: false; status: number; body: string };

export type ContactResult =
  | { ok: true; contact: SystemeContact }
  | { ok: false; notFound: boolean; status: number; body: string };

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function addContact(email: string, name: string, tags: string[] = [], locale?: string): Promise<void> {
  const apiKey = await getApiKey(locale);
  if (!apiKey) {
    console.warn(`[systeme.io] API key for ${systemeConfigKey(locale)} not configured — skipping contact sync (locale=${locale ?? 'default'})`);
    return;
  }

  try {
    const fields = name.trim() ? [{ slug: 'first_name', value: name.trim() }] : [];

    const res = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: JSON.stringify({ email, fields }),
    });

    if (!res.ok) {
      if (res.status === 409 || res.status === 422) {
        // Contact already exists — apply tags to the existing one
        await applyTagsToExistingContact(email, tags, apiKey, locale);
        return;
      }
      console.error('[systeme.io] Failed to add contact:', res.status, await res.text());
      return;
    }

    // New contact created — apply tags separately (name→ID resolution)
    if (tags.length > 0) {
      await applyTagsToExistingContact(email, tags, apiKey, locale);
    }
  } catch (error) {
    console.error('[systeme.io] Network error:', error);
  }
}

export async function getContactByEmail(email: string, locale?: string): Promise<ContactResult> {
  const apiKey = await getApiKey(locale);
  if (!apiKey) return { ok: false, notFound: false, status: 0, body: 'API Key 未配置' };

  try {
    const res = await fetch(`${BASE_URL}/contacts?email=${encodeURIComponent(email)}`, {
      headers: authHeaders(apiKey),
      cache: 'no-store',
    });
    const body = await res.text();
    if (!res.ok) {
      return { ok: false, notFound: res.status === 404, status: res.status, body };
    }
    const data = JSON.parse(body);
    const items: any[] = data['hydra:member'] ?? data.items ?? [];
    if (items.length === 0) {
      return { ok: false, notFound: true, status: 404, body: '联系人不存在' };
    }
    const c = items[0];
    return {
      ok: true,
      contact: {
        id: Number(c.id),
        email: String(c.email),
        tags: (c.tags ?? []).map((t: any) => ({ id: Number(t.id), name: String(t.name) })),
      },
    };
  } catch (err: any) {
    return { ok: false, notFound: false, status: 0, body: err?.message ?? '网络错误' };
  }
}

export async function addTagToContact(contactId: number, tagId: number, locale?: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = await getApiKey(locale);
  if (!apiKey) return { ok: false, error: 'API Key 未配置' };

  try {
    const res = await fetch(`${BASE_URL}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: JSON.stringify({ tagId }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[systeme.io] addTagToContact failed:', res.status, body);
      return { ok: false, error: `${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

// Resolve tag name → ID then add — used by automated trigger points.
// locale 决定账户；标签按账户隔离，两个账户内用相同的基础标签名（无 _en 后缀）。
export async function addTagToContactByName(contactId: number, tagName: string, locale?: string): Promise<{ ok: boolean; error?: string }> {
  const tagsResult = await getTags(locale);
  if (!tagsResult.ok) return { ok: false, error: '获取标签列表失败' };

  const tag = tagsResult.tags.find((t) => t.name === tagName);
  if (!tag) return { ok: false, error: `标签「${tagName}」不存在` };
  return addTagToContact(contactId, tag.id, locale);
}

export async function removeTagFromContact(contactId: number, tagId: number, locale?: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = await getApiKey(locale);
  if (!apiKey) return { ok: false, error: 'API Key 未配置' };

  try {
    const res = await fetch(`${BASE_URL}/contacts/${contactId}/tags/${tagId}`, {
      method: 'DELETE',
      headers: authHeaders(apiKey),
    });
    if (!res.ok && res.status !== 204) {
      const body = await res.text();
      return { ok: false, error: `${res.status}: ${body.slice(0, 100)}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

async function applyTagsToExistingContact(email: string, tagNames: string[], apiKey: string, locale?: string): Promise<void> {
  if (!tagNames.length) return;
  try {
    const res = await fetch(`${BASE_URL}/contacts?email=${encodeURIComponent(email)}`, {
      headers: authHeaders(apiKey),
      cache: 'no-store',
    });
    if (!res.ok) return;
    const data = await res.json();
    const contactId = Number((data['hydra:member'] ?? data.items ?? [])[0]?.id);
    if (!contactId) return;
    for (const tagName of tagNames) {
      await addTagToContactByName(contactId, tagName, locale);
    }
  } catch (error) {
    console.error('[systeme.io] Failed to apply tags to existing contact:', error);
  }
}

// ─── Contact Fields ───────────────────────────────────────────────────────────

export interface SystemeContactField {
  slug: string;
  name: string;
  type: string;
}

export async function getContactFields(locale?: string): Promise<SystemeContactField[]> {
  const apiKey = await getApiKey(locale);
  if (!apiKey) return [];
  try {
    const res = await fetch(`${BASE_URL}/contact-fields?itemsPerPage=100`, {
      headers: authHeaders(apiKey),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`[systeme.io] GET /contact-fields failed: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const items: any[] = data['hydra:member'] ?? data.items ?? [];
    return items.map((f) => ({ slug: String(f.slug), name: String(f.name), type: String(f.type ?? '') }));
  } catch (err) {
    console.error('[systeme.io] getContactFields error:', err);
    return [];
  }
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function getTags(locale?: string): Promise<TagsResult> {
  const apiKey = await getApiKey(locale);
  if (!apiKey) return { ok: false, status: 0, body: 'API Key 未配置' };

  try {
    const res = await fetch(`${BASE_URL}/tags?itemsPerPage=100`, {
      headers: authHeaders(apiKey),
      cache: 'no-store',
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`[systeme.io] GET /tags failed: ${res.status} ${body}`);
      return { ok: false, status: res.status, body };
    }
    const data = JSON.parse(body);
    const items: any[] = data['hydra:member'] ?? data.items ?? [];
    return { ok: true, tags: items.map((t) => ({ id: Number(t.id), name: String(t.name) })) };
  } catch (err: any) {
    console.error('[systeme.io] getTags error:', err);
    return { ok: false, status: 0, body: err?.message ?? '网络错误' };
  }
}

// ─── Connectivity ─────────────────────────────────────────────────────────────

export async function pingSystemeIo(locale?: string): Promise<boolean> {
  const apiKey = await getApiKey(locale);
  if (!apiKey) return false;
  try {
    const res = await fetch(`${BASE_URL}/tags?itemsPerPage=1`, {
      headers: authHeaders(apiKey),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}
