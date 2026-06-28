"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  setIntegrationValue,
  getProviderApiKey,
  getProviderKeyMask,
} from "@/lib/integrations/config";

type ActionResult = { success: boolean; message: string };

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('无权限');
  return session;
}

// ─── Provider status ──────────────────────────────────────────────────────────

export interface ProviderStatus {
  name: string;
  label: string;
  configured: boolean;
  source: 'env' | 'db' | 'none';
  keyMask: string | null;
  note?: string;
}

export async function getProviderStatuses(): Promise<ProviderStatus[]> {
  const [claudeMask, geminiMask, deepseekMask, openaiMask] = await Promise.all([
    getProviderKeyMask('claude'),
    getProviderKeyMask('gemini'),
    getProviderKeyMask('deepseek'),
    getProviderKeyMask('openai'),
  ]);

  const hasDbClaude = !!claudeMask;
  const hasDbGemini = !!geminiMask;
  const hasDbDeepseek = !!deepseekMask;
  const hasDbOpenai = !!openaiMask;

  return [
    {
      name: 'vps',
      label: 'CLIProxy (VPS)',
      configured: !!(process.env.VPS_PROXY_URL && process.env.VPS_PROXY_KEY),
      source: process.env.VPS_PROXY_KEY ? 'env' : 'none',
      keyMask: null,
      note: process.env.VPS_PROXY_URL ?? '未配置',
    },
    {
      name: 'claude',
      label: 'Anthropic Claude',
      configured: hasDbClaude || !!process.env.ANTHROPIC_API_KEY,
      source: hasDbClaude ? 'db' : process.env.ANTHROPIC_API_KEY ? 'env' : 'none',
      keyMask: claudeMask,
    },
    {
      name: 'gemini',
      label: 'Google Gemini',
      configured: hasDbGemini || !!(process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY),
      source: hasDbGemini ? 'db' : (process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) ? 'env' : 'none',
      keyMask: geminiMask,
    },
    {
      name: 'deepseek',
      label: 'DeepSeek',
      configured: hasDbDeepseek || !!process.env.DEEPSEEK_API_KEY,
      source: hasDbDeepseek ? 'db' : process.env.DEEPSEEK_API_KEY ? 'env' : 'none',
      keyMask: deepseekMask,
    },
    {
      name: 'openai',
      label: 'OpenAI',
      configured: hasDbOpenai || !!process.env.OPENAI_API_KEY,
      source: hasDbOpenai ? 'db' : process.env.OPENAI_API_KEY ? 'env' : 'none',
      keyMask: openaiMask,
    },
  ];
}

// ─── API Key management ───────────────────────────────────────────────────────

export async function saveProviderKey(provider: string, apiKey: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (!['claude', 'gemini', 'deepseek', 'openai'].includes(provider))
      return { success: false, message: '不支持的 Provider' };
    if (!apiKey.trim()) return { success: false, message: 'API Key 不能为空' };
    await setIntegrationValue(`PROVIDER_KEY_${provider}`, apiKey.trim(), session.user.id);
    revalidatePath('/dashboard/admin/models');
    return { success: true, message: 'API Key 已加密保存' };
  } catch (e: any) {
    return { success: false, message: e?.message ?? '保存失败' };
  }
}

export interface TestResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

export async function testProviderConnection(provider: string): Promise<TestResult> {
  try {
    await requireAdmin();
    const start = Date.now();

    if (provider === 'vps') {
      const res = await fetchVpsModels();
      return res.ok
        ? { ok: true, latencyMs: Date.now() - start }
        : { ok: false, error: res.error };
    }

    const key = await getProviderApiKey(provider);
    if (!key) return { ok: false, error: 'API Key 未配置' };

    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=1`,
        { cache: 'no-store', signal: AbortSignal.timeout(10000) },
      );
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      return { ok: true, latencyMs: Date.now() - start };
    }

    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      return { ok: true, latencyMs: Date.now() - start };
    }

    if (provider === 'deepseek') {
      const res = await fetch('https://api.deepseek.com/models', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      return { ok: true, latencyMs: Date.now() - start };
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      return { ok: true, latencyMs: Date.now() - start };
    }

    return { ok: false, error: '不支持的 Provider' };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? '连接失败' };
  }
}

export async function verifyModelAccess(provider: string, modelId: string): Promise<TestResult> {
  try {
    await requireAdmin();
    const start = Date.now();

    if (provider === 'vps') {
      const base = (process.env.VPS_PROXY_URL ?? '').replace(/\/v1\/?$/, '');
      const key = process.env.VPS_PROXY_KEY;
      if (!base || !key) return { ok: false, error: 'VPS 未配置' };
      const res = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      return { ok: true, latencyMs: Date.now() - start };
    }

    const key = await getProviderApiKey(provider);
    if (!key) return { ok: false, error: 'API Key 未配置' };

    if (provider === 'gemini') {
      const safeName = modelId.startsWith('models/') ? modelId : `models/${modelId}`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${safeName}?key=${key}`,
        { cache: 'no-store', signal: AbortSignal.timeout(10000) },
      );
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      return { ok: true, latencyMs: Date.now() - start };
    }

    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      return { ok: true, latencyMs: Date.now() - start };
    }

    if (provider === 'deepseek') {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      return { ok: true, latencyMs: Date.now() - start };
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      return { ok: true, latencyMs: Date.now() - start };
    }

    return { ok: false, error: '不支持的 Provider' };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? '验证失败' };
  }
}

// ─── VPS model list ───────────────────────────────────────────────────────────

export interface VpsModel {
  id: string;
  object?: string;
  owned_by?: string;
}

export async function fetchVpsModels(): Promise<{ ok: boolean; models?: VpsModel[]; error?: string }> {
  try {
    await requireAdmin();
    const base = (process.env.VPS_PROXY_URL ?? '').replace(/\/v1\/?$/, '');
    const key = process.env.VPS_PROXY_KEY;
    if (!base || !key) return { ok: false, error: 'VPS_PROXY_URL 或 VPS_PROXY_KEY 未配置' };

    const res = await fetch(`${base}/v1/models`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
    }
    const data = await res.json();
    const models: VpsModel[] = (data.data ?? data.models ?? []).map((m: any) => ({
      id: String(m.id),
      object: m.object,
      owned_by: m.owned_by,
    }));
    return { ok: true, models };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? '网络错误' };
  }
}

export async function fetchProviderModels(provider: string): Promise<{ ok: boolean; models?: { id: string; label: string }[]; error?: string }> {
  try {
    await requireAdmin();

    if (provider === 'vps') {
      const res = await fetchVpsModels();
      if (!res.ok) return { ok: false, error: res.error };
      return { ok: true, models: res.models?.map(m => ({ id: m.id, label: m.id })) };
    }

    const key = await getProviderApiKey(provider);
    if (!key) return { ok: false, error: 'API Key 未配置' };

    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
        { cache: 'no-store', signal: AbortSignal.timeout(10000) },
      );
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      const data = await res.json();
      const models = (data.models || [])
        // Optionally filter for generation models, but keeping it simple for now
        .map((m: any) => {
          const id = m.name.replace(/^models\//, '');
          return { id, label: m.displayName || id };
        });
      return { ok: true, models };
    }

    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      const data = await res.json();
      const models = (data.data || []).map((m: any) => ({ id: m.id, label: m.id }));
      return { ok: true, models };
    }

    if (provider === 'deepseek') {
      const res = await fetch('https://api.deepseek.com/models', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      const data = await res.json();
      const models = (data.data || []).map((m: any) => ({ id: m.id, label: m.id }));
      return { ok: true, models };
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status}: ${body.slice(0, 120)}` };
      }
      const data = await res.json();
      const models = (data.data || []).map((m: any) => ({ id: m.id, label: m.id }));
      return { ok: true, models };
    }

    return { ok: false, error: '不支持的 Provider' };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? '网络错误' };
  }
}

// ─── ModelConfig CRUD ─────────────────────────────────────────────────────────

export interface ModelConfigRow {
  context: string;
  provider: string;
  modelId: string;
  label: string | null;
  updatedAt: Date;
}

export async function getModelConfigs(): Promise<ModelConfigRow[]> {
  const rows = await prisma.modelConfig.findMany({ orderBy: { context: 'asc' } });
  return rows.map((r) => ({
    context: r.context,
    provider: r.provider,
    modelId: r.modelId,
    label: r.label,
    updatedAt: r.updatedAt,
  }));
}

export async function saveModelConfig(
  context: string,
  provider: string,
  modelId: string,
  label?: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (!context || !provider || !modelId) return { success: false, message: '参数不完整' };
    await prisma.modelConfig.upsert({
      where: { context },
      create: { context, provider, modelId, label: label ?? null, updatedBy: session.user.id },
      update: { provider, modelId, label: label ?? null, updatedBy: session.user.id },
    });
    revalidatePath('/dashboard/admin/models');
    return { success: true, message: `已保存「${context}」→ ${provider}/${modelId}` };
  } catch (e: any) {
    return { success: false, message: e?.message ?? '保存失败' };
  }
}

export async function deleteModelConfig(context: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.modelConfig.delete({ where: { context } });
    revalidatePath('/dashboard/admin/models');
    return { success: true, message: '已清除配置' };
  } catch (e: any) {
    return { success: false, message: e?.message ?? '删除失败' };
  }
}
