"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
