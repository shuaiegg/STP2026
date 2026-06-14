import { PrismaClient } from '@prisma/client';

// Refreshed at: 2026-03-11T10:09:00
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
        ] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });

if (process.env.NODE_ENV === 'development' && !globalForPrisma.prisma) {
    (prisma as any).$on('query', (e: any) => {
        console.log(`[PRISMA QUERY] ${e.query}`);
        // Log a shortened stack trace to find the origin
        const stack = new Error().stack?.split('\n').slice(1, 5).join('\n');
        console.log(`[STACK]\n${stack}\n`);
    });
}

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;

/**
 * 瞬时连接错误重试：远程 DB 空闲连接被网络/代理关闭后，复用到死连接会抛
 * "Server has closed the connection" 等错误。Prisma 会在重连后恢复，
 * 故重连并重试一次即可，几乎必成。对本地（远程连库）和生产（连接池/网络抖动）都更稳健。
 */
export async function withDbRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
    try {
        return await fn();
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        const transient = /closed the connection|Can't reach database|Connection reset|ECONNRESET|terminating connection|connection pool/i.test(msg);
        if (retries > 0 && transient) {
            try { await prisma.$connect(); } catch { /* ignore; fn() will surface real error */ }
            return withDbRetry(fn, retries - 1);
        }
        throw e;
    }
}
