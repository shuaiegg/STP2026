import { getIntegrationValue } from '@/lib/integrations/config';

const BASE_URL = 'https://api.systeme.io/api';

// DB takes priority over env var
async function getApiKey(): Promise<string | undefined> {
  try {
    const dbKey = await getIntegrationValue('SYSTEME_IO_API_KEY');
    if (dbKey) return dbKey;
  } catch {
    // fall through
  }
  return process.env.SYSTEME_IO_API_KEY;
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
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.warn('[systeme.io] API key not configured — skipping contact sync');
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

export async function getContactByEmail(email: string): Promise<ContactResult> {
  const apiKey = await getApiKey();
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

export async function addTagToContact(contactId: number, tagId: number): Promise<{ ok: boolean; error?: string }> {
  const apiKey = await getApiKey();
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

// Resolve tag name → ID then add — used by automated trigger points
export async function addTagToContactByName(contactId: number, tagName: string, locale?: string): Promise<{ ok: boolean; error?: string }> {
  const tagsResult = await getTags();
  if (!tagsResult.ok) return { ok: false, error: '获取标签列表失败' };

  let targetTagName = tagName;
  if (locale === 'en') {
    const enTagName = `${tagName}_en`;
    if (tagsResult.tags.some((t) => t.name === enTagName)) {
      targetTagName = enTagName;
    }
  }

  const tag = tagsResult.tags.find((t) => t.name === targetTagName);
  if (!tag) return { ok: false, error: `标签「${targetTagName}」不存在` };
  return addTagToContact(contactId, tag.id);
}

export async function removeTagFromContact(contactId: number, tagId: number): Promise<{ ok: boolean; error?: string }> {
  const apiKey = await getApiKey();
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

export async function getContactFields(): Promise<SystemeContactField[]> {
  const apiKey = await getApiKey();
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

export async function getTags(): Promise<TagsResult> {
  const apiKey = await getApiKey();
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

export async function pingSystemeIo(): Promise<boolean> {
  const apiKey = await getApiKey();
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
