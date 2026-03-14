import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // 3.7 Server-side role check (ADMIN or EDITOR)
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const role = (session?.user as any)?.role;

    if (!session || (role !== 'ADMIN' && role !== 'EDITOR')) {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
