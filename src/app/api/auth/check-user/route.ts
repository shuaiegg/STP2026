import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * API to check if a user exists by email
 * Used for dynamic registration flow (Unified Auth)
 */
export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, name: true }
        });

        return NextResponse.json({ 
            exists: !!user,
            name: user?.name || null
        });
    } catch (error) {
        console.error('Check user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
