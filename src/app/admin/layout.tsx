import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // 1. Server-side Security Guard (Complimentary to Middleware)
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // Check if path is admin (but not the setup or login pages which handle their own logic)
    // Actually, Layout wraps everything in the folder.
    // If the path is /admin/login or /admin/setup, we allow it (though setup has its own check).
    
    // We can't easily check pathname here in a server layout without headers hack,
    // but the Client Layout already does the fine-grained path check.
    // Here we just ensure that IF a session exists, it MUST be ADMIN to proceed in this directory.
    if (session && (session.user as any).role !== 'ADMIN') {
        redirect("/dashboard");
    }

    return <AdminLayoutClient session={session}>{children}</AdminLayoutClient>;
}
