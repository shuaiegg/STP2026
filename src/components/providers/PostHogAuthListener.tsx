'use client';

import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { authClient } from "@/lib/auth-client";

export function PostHogAuthListener() {
    const posthog = usePostHog();
    const { data: session } = authClient.useSession();

    useEffect(() => {
        if (session?.user && posthog) {
            posthog.identify(session.user.id, {
                email: session.user.email,
                name: session.user.name,
                role: session.user.role,
                is_admin: session.user.role === 'ADMIN',
            });
        } else if (!session && posthog) {
            posthog.reset();
        }
    }, [session, posthog]);

    return null;
}
