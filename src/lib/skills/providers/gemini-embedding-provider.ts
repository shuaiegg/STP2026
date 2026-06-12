import { GoogleGenerativeAI } from '@google/generative-ai';
import { getProviderApiKey } from '@/lib/integrations/config';

export class GeminiEmbeddingProvider {
  private async getClient(): Promise<GoogleGenerativeAI> {
    const key = await getProviderApiKey('gemini');
    if (!key) throw new Error('Gemini API Key 未配置（env 或 DB）');
    return new GoogleGenerativeAI(key);
  }

  async embedText(text: string, modelId = 'text-embedding-004'): Promise<number[]> {
    const genAI = await this.getClient();
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async embedBatch(texts: string[], modelId = 'text-embedding-004'): Promise<number[][]> {
    const genAI = await this.getClient();
    const model = genAI.getGenerativeModel({ model: modelId });
    const results = await Promise.all(texts.map((t) => model.embedContent(t)));
    return results.map((r) => r.embedding.values);
  }
}
