'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export type ConsultationStatus = 'PENDING' | 'REVIEWED' | 'CONTACTED';

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('无权限');
  return session;
}

export async function getConsultations(status?: ConsultationStatus) {
  await requireAdmin();
  return prisma.consultationRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateConsultationStatus(
  id: string,
  status: ConsultationStatus,
  adminNote?: string,
): Promise<{ success: boolean; message: string }> {
  await requireAdmin();
  try {
    await prisma.consultationRequest.update({
      where: { id },
      data: {
        status,
        ...(adminNote !== undefined ? { adminNote } : {}),
      },
    });
    return { success: true, message: '状态已更新' };
  } catch {
    return { success: false, message: '更新失败，请重试' };
  }
}
