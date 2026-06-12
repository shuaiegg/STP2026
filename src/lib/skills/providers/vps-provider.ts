import { BaseAIProvider } from './base-provider';
import { AIModel, AIResponse, AIGenerateOptions } from '../types';

// Static model definitions for the VPS proxy
// Actual available models are fetched dynamically via /v1/models in the admin UI
const VPS_MODELS: AIModel[] = [
  {
    id: 'claude-opus-4-5-20251101',
    provider: 'vps',
    displayName: 'Claude Opus 4.5 (VPS)',
    costPerKInput: 0,
    costPerKOutput: 0,
    maxTokens: 200000,
  },
  {
    id: 'gemini-3.1-pro-high',
    provider: 'vps',
    displayName: 'Gemini 3.1 Pro High (VPS)',
    costPerKInput: 0,
    costPerKOutput: 0,
    maxTokens: 128000,
  },
  {
    id: 'gpt-oss-120b-medium',
    provider: 'vps',
    displayName: 'GPT OSS 120B Medium (VPS)',
    costPerKInput: 0,
    costPerKOutput: 0,
    maxTokens: 128000,
  },
];

export class VPSProvider extends BaseAIProvider {
  name: 'vps' = 'vps';
  models: AIModel[] = VPS_MODELS;

  private get apiBase(): string {
    const url = process.env.VPS_PROXY_URL || 'http://127.0.0.1:8317';
    // Normalise: strip trailing /v1 if present so we control path construction
    return url.replace(/\/v1\/?$/, '');
  }

  protected getApiKey(): string | undefined {
    return process.env.VPS_PROXY_KEY;
  }

  // VPS proxy is self-hosted — cost is effectively 0
  estimateCost(_inputTokens: number, _outputTokens: number, _model: string): number {
    return 0;
  }

  async isAvailable(): Promise<boolean> {
    const apiKey = this.getApiKey();
    if (!apiKey) return false;
    try {
      const res = await fetch(`${this.apiBase}/v1/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generateContent(prompt: string, options?: AIGenerateOptions): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('[VPSProvider] VPS_PROXY_KEY not configured');

    // Model priority: options.model → first in list
    const preferredModel = options?.model ?? this.models[0].id;
    // Build failover list: preferred first, then remaining
    const failoverList = [
      preferredModel,
      ...this.models.map((m) => m.id).filter((id) => id !== preferredModel),
    ];

    let lastError: Error | null = null;
    for (const model of failoverList) {
      try {
        const response = await fetch(`${this.apiBase}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: options?.systemPrompt ?? 'You are a helpful assistant.' },
              { role: 'user', content: prompt },
            ],
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxOutputTokens ?? 4096,
            stream: false,
          }),
          signal: AbortSignal.timeout(120000),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`${response.status}: ${err.slice(0, 200)}`);
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        return {
          content: choice?.message?.content ?? '',
          inputTokens: data.usage?.prompt_tokens ?? 0,
          outputTokens: data.usage?.completion_tokens ?? 0,
          model,
          finishReason: choice?.finish_reason === 'stop' ? 'stop' : 'length',
        };
      } catch (err: any) {
        console.warn(`[VPSProvider] Model ${model} failed: ${err.message}`);
        lastError = err;
      }
    }

    throw lastError ?? new Error('[VPSProvider] All models failed');
  }
}
