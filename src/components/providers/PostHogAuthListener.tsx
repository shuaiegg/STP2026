'use client';

import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { useSessionContext } from "@/components/providers/SessionProvider";

export function PostHogAuthListener() {
    const posthog = usePostHog();
    const { session } = useSessionContext();

    useEffect(() => {
        if (session?.user && posthog) {
            const user = session.user as {
                id: string;
                email: string;
                name?: string | null;
                role?: string;
                locale?: string;
            };
            posthog.identify(user.id, {
                email: user.email,
                name: user.name,
                role: user.role,
                is_admin: user.role === 'ADMIN',
                locale: user.locale,
                credits: (user as any).credits,
            });
        } else if (!session && posthog) {
            posthog.reset();
        }
    }, [session, posthog]);

    return null;
}
