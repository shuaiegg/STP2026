import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminOnlyLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const role = (session?.user as any)?.role;

    if (!session || role !== 'ADMIN') {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
