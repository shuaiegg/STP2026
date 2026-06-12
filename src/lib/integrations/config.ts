import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const ALGORITHM = 'aes-256-gcm';

function getDerivedKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('BETTER_AUTH_SECRET is required for integration config encryption');
  // Derive a 32-byte key from the secret using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(plaintext: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12) + tag(16) + ciphertext, all hex-encoded
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(ciphertext: string): string {
  const key = getDerivedKey();
  const [ivHex, tagHex, dataHex] = ciphertext.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Invalid ciphertext format');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString('utf8') + decipher.final('utf8');
}

export async function getIntegrationValue(key: string): Promise<string | null> {
  try {
    const row = await prisma.integrationConfig.findUnique({ where: { key } });
    if (!row) return null;
    return decrypt(row.value);
  } catch {
    return null;
  }
}

export async function setIntegrationValue(key: string, value: string, updatedBy: string): Promise<void> {
  const encrypted = encrypt(value);
  await prisma.integrationConfig.upsert({
    where: { key },
    update: { value: encrypted, updatedBy },
    create: { key, value: encrypted, updatedBy },
  });
}

export async function deleteIntegrationValue(key: string): Promise<void> {
  await prisma.integrationConfig.deleteMany({ where: { key } });
}

// Returns true/false — does not expose the raw value
export async function isIntegrationConfigured(key: string): Promise<boolean> {
  const count = await prisma.integrationConfig.count({ where: { key } });
  return count > 0;
}

// ─── Provider API Key helpers ─────────────────────────────────────────────────

const PROVIDER_ENV_KEYS: Record<string, string[]> = {
  claude: ['ANTHROPIC_API_KEY'],
  gemini: ['GOOGLE_API_KEY', 'GOOGLE_AI_API_KEY', 'GEMINI_API_KEY'],
  deepseek: ['DEEPSEEK_API_KEY'],
};

/** Returns the API key for a provider: DB (decrypted) → env var fallback */
export async function getProviderApiKey(provider: string): Promise<string | undefined> {
  try {
    const dbKey = await getIntegrationValue(`PROVIDER_KEY_${provider}`);
    if (dbKey) return dbKey;
  } catch {
    // DB unavailable — fall through to env
  }
  const envKeys = PROVIDER_ENV_KEYS[provider] ?? [];
  for (const k of envKeys) {
    const v = process.env[k];
    if (v) return v;
  }
  return undefined;
}

/** Returns last-4 chars masked string for UI display, or null if no key saved in DB */
export async function getProviderKeyMask(provider: string): Promise<string | null> {
  try {
    const raw = await getIntegrationValue(`PROVIDER_KEY_${provider}`);
    if (!raw || raw.length < 4) return null;
    return `••••••••${raw.slice(-4)}`;
  } catch {
    return null;
  }
}
