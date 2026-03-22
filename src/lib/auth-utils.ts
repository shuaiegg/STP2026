import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Check if the current user is an admin
 * Throws an error if not authorized.
 */
export async function checkAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || (session.user as any).role !== 'ADMIN') {
        throw new Error("Unauthorized: Admin access required");
    }

    return session;
}
