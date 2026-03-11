
import { IAIProvider, AIRequestOptions, AIResponse } from './base-provider';

export class VPSProvider implements IAIProvider {
    private apiBase = process.env.VPS_PROXY_URL || "http://127.0.0.1:8317/v1";
    private apiKey = process.env.VPS_PROXY_KEY || "";

    // CASCADING MODELS (Priority Order)
    private models = [
        'gemini-3.1-pro-high',
        'claude-opus-4-5-20251101',
        'gpt-oss-120b-medium'
    ];

    async generateContent(prompt: string, options?: AIRequestOptions): Promise<AIResponse> {
        let lastError: Error | null = null;

        // Ensure we have a valid key before attempting
        if (!this.apiKey && !process.env.VPS_PROXY_KEY) {
            throw new Error("❌ [VPSProvider] Missing VPS_PROXY_KEY in environment variables.");
        }

        // AUTO-FAILOVER LOOP
        for (const model of this.models) {
            try {
                console.log(`📡 [VPSProvider] Attempting with model: ${model}`);
                
                const response = await fetch(`${this.apiBase}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: options?.system || 'You are an elite SEO/GEO growth expert.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: options?.temperature || 0.85,
                        stream: false
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Model ${model} failed: ${response.status} - ${JSON.stringify(errorData)}`);
                }

                const data = await response.json();
                console.log(`✅ [VPSProvider] Success with: ${model}`);
                return {
                    content: data.choices[0].message.content,
                    raw: data
                };
            } catch (error: any) {
                console.warn(`⚠️ [VPSProvider] Model ${model} failed. Trying next... Reason: ${error.message}`);
                lastError = error;
                continue; // Move to next model in the list
            }
        }

        // If all models in the list fail
        console.error("❌ [VPSProvider] All models failed.");
        throw lastError || new Error("All VPS models failed to respond.");
    }

    async isAvailable(): Promise<boolean> {
        if (!this.apiKey) return false;
        try {
            const res = await fetch(`${this.apiBase}/models`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return res.ok;
        } catch {
            return false;
        }
    }
}
