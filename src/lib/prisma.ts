import { PrismaClient } from '@prisma/client';

// Refreshed at: 2026-01-15T19:49:00
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
