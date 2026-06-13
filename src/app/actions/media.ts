'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { uploadImageFile } from '@/lib/storage';

export async function uploadMediaAction(formData: FormData) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || (session.user as any).role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadImageFile(buffer, file.name, file.type);

        return { success: true, data: result };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: String(error) };
    }
}
