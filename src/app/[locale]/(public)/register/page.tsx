"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
// i18n router preserves the current locale prefix (zh → /zh/login), so a Chinese
// visitor isn't dumped onto the English /login.
import { useRouter } from "@/i18n/navigation";

export default function RegisterRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const domain = searchParams.get("domain");
        if (domain) {
            router.replace(`/login?domain=${encodeURIComponent(domain)}`);
        } else {
            router.replace("/login");
        }
    }, [router, searchParams]);

    return null;
}
