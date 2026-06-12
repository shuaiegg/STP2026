"use server";

import { sendEmail } from "@/lib/email";
import { pingSystemeIo, getTags, type TagsResult } from "@/lib/email/systeme";
import { getIntegrationValue, setIntegrationValue, deleteIntegrationValue, isIntegrationConfigured } from "@/lib/integrations/config";
import { SYSTEME_TRIGGERS, type SystemeTriggerKey } from "@/lib/integrations/systeme-triggers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

type ActionResult = { success: boolean; message: string };

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error('无权限');
  }
  return session;
}

// ─── Email ────────────────────────────────────────────────────────────────────

export async function sendTestEmail(): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const result = await sendEmail({
      to: session.user.email,
      subject: '✅ ScaletoTop 测试邮件 — Resend 连接正常',
      html: `
        <div style="font-family:sans-serif;padding:32px;max-width:480px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="margin:0 0 16px;color:#111827;">测试邮件发送成功</h2>
          <p style="color:#6b7280;margin:0 0 12px;">Resend 邮件服务连接正常，此邮件发送至 <strong>${session.user.email}</strong>。</p>
          <p style="color:#9ca3af;font-size:12px;margin:0;">发送时间：${new Date().toLocaleString('zh-CN')}</p>
        </div>
      `,
    });
    if (result.success) return { success: true, message: `测试邮件已发送至 ${session.user.email}` };
    return { success: false, message: '发送失败，请检查 RESEND_API_KEY' };
  } catch (e: any) {
    return { success: false, message: e.message || '操作失败' };
  }
}

// ─── systeme.io ───────────────────────────────────────────────────────────────

export async function testSystemeIoConnection(): Promise<ActionResult> {
  try {
    await requireAdmin();
    const ok = await pingSystemeIo();
    if (ok) return { success: true, message: 'systeme.io API 连接正常' };
    return { success: false, message: '连接失败，请检查 API Key 是否正确' };
  } catch (e: any) {
    return { success: false, message: e.message || '操作失败' };
  }
}

export async function saveSystemeApiKey(apiKey: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const trimmed = apiKey.trim();
    if (!trimmed) return { success: false, message: 'API Key 不能为空' };
    if (trimmed.length < 20) return { success: false, message: 'API Key 格式不正确' };

    await setIntegrationValue('SYSTEME_IO_API_KEY', trimmed, session.user.id);
    revalidatePath('/dashboard/admin/integrations');
    return { success: true, message: 'API Key 已保存并加密存储' };
  } catch (e: any) {
    return { success: false, message: e.message || '保存失败' };
  }
}

export async function deleteSystemeApiKey(): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteIntegrationValue('SYSTEME_IO_API_KEY');
    revalidatePath('/dashboard/admin/integrations');
    return { success: true, message: 'API Key 已删除' };
  } catch (e: any) {
    return { success: false, message: e.message || '删除失败' };
  }
}

// ─── Tag configuration ────────────────────────────────────────────────────────

export async function fetchSystemeTags(): Promise<TagsResult> {
  try {
    await requireAdmin();
    return await getTags();
  } catch (e: any) {
    return { ok: false, status: 0, body: e?.message ?? '未知错误' };
  }
}

export async function saveTagRule(triggerKey: SystemeTriggerKey, tagName: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (!tagName.trim()) {
      // Empty string = clear
      await deleteIntegrationValue(triggerKey);
      revalidatePath('/dashboard/admin/integrations');
      return { success: true, message: '已清除标签规则' };
    }
    await setIntegrationValue(triggerKey, tagName.trim(), session.user.id);
    // Keep legacy key in sync for backward compat (register trigger)
    const trigger = SYSTEME_TRIGGERS.find((t) => t.key === triggerKey);
    if (trigger && 'legacyKey' in trigger && trigger.legacyKey) {
      await setIntegrationValue(trigger.legacyKey as string, tagName.trim(), session.user.id);
    }
    revalidatePath('/dashboard/admin/integrations');
    return { success: true, message: `已保存「${tagName}」` };
  } catch (e: any) {
    return { success: false, message: e.message || '保存失败' };
  }
}

export async function getTagRules(): Promise<Record<SystemeTriggerKey, string | null>> {
  const entries = await Promise.all(
    SYSTEME_TRIGGERS.map(async (t) => {
      const val = await getIntegrationValue(t.key);
      // Fallback to legacyKey for existing data
      const resolved = val ?? ('legacyKey' in t && t.legacyKey ? await getIntegrationValue(t.legacyKey as string) : null);
      return [t.key, resolved] as [SystemeTriggerKey, string | null];
    }),
  );
  return Object.fromEntries(entries) as Record<SystemeTriggerKey, string | null>;
}

// Kept for backward compatibility with existing page snapshots
export async function saveNewUserTag(tagName: string): Promise<ActionResult> {
  return saveTagRule('SYSTEME_TAG_ON_REGISTER', tagName);
}

export async function getNewUserTag(): Promise<string | null> {
  return getIntegrationValue('SYSTEME_TAG_ON_REGISTER') ?? getIntegrationValue('SYSTEME_NEW_USER_TAG');
}

// ─── Debug: inspect raw contact fields ───────────────────────────────────────

export async function debugFetchRawContact(email?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    await requireAdmin();
    const { getIntegrationValue } = await import('@/lib/integrations/config');
    const apiKey = await getIntegrationValue('SYSTEME_IO_API_KEY');
    if (!apiKey) return { ok: false, error: 'API Key 未配置' };

    const url = email
      ? `https://api.systeme.io/api/contacts?email=${encodeURIComponent(email)}&itemsPerPage=1`
      : `https://api.systeme.io/api/contacts?itemsPerPage=1`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': apiKey, 'X-API-Key': apiKey },
      cache: 'no-store',
    });
    const body = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${body.slice(0, 200)}` };
    return { ok: true, data: JSON.parse(body) };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

// ─── Read current config status (server-side) ─────────────────────────────────

export async function getSystemeKeyMasked(): Promise<string | null> {
  const value = await getIntegrationValue('SYSTEME_IO_API_KEY');
  if (!value) return null;
  // Return masked version: first 6 + ... + last 4
  if (value.length <= 12) return '••••••••';
  return value.slice(0, 6) + '••••••••' + value.slice(-4);
}

export async function isSystemeConfiguredInDb(): Promise<boolean> {
  return isIntegrationConfigured('SYSTEME_IO_API_KEY');
}
