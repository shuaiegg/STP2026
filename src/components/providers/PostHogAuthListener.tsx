'use client';

import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { authClient } from "@/lib/auth-client";

export function PostHogAuthListener() {
    const posthog = usePostHog();
    const { data: session } = authClient.useSession();

    useEffect(() => {
        if (session?.user && posthog) {
            // Use type assertion for custom fields injected by plugins
            const user = session.user as any;
            posthog.identify(user.id, {
                email: user.email,
                name: user.name,
                role: user.role,
                is_admin: user.role === 'ADMIN',
            });
        } else if (!session && posthog) {
            posthog.reset();
        }
    }, [session, posthog]);

    return null;
}
