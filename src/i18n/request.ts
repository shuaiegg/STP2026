import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default getRequestConfig(async ({ requestLocale }) => {
    // [locale] 段内取 URL locale；段外（dashboard 等）回落到 session user locale 或默认语言
    const requested = await requestLocale;
    let locale = requested;

    if (!hasLocale(routing.locales, locale)) {
        // Outside of [locale] segment, try to get locale from session
        try {
            const session = await auth.api.getSession({
                headers: await headers()
            });
            if (session?.user?.locale && hasLocale(routing.locales, session.user.locale)) {
                locale = session.user.locale;
            }
        } catch (e) {
            // Fallback to default if session or headers are unavailable
        }
    }

    if (!hasLocale(routing.locales, locale)) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
