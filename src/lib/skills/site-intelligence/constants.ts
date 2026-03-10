/**
 * Site Intelligence Constants & Helpers
 */

export const TOPIC_BLACKLIST = [
    'privacy',
    'terms',
    'legal',
    'contact',
    'about',
    'policy',
    'cookie',
    'disclaimer',
    'agreement',
    'support',
    'help',
    'faq',
    'login',
    'signin',
    'signup',
    'register',
    'cart',
    'checkout',
    'account',
    'profile',
    'settings',
    'search',
    '404',
    'not found',
    'error',
    'loading',
    'untitled'
];

/**
 * Checks if a topic name matches any blacklisted boiler-plate terms.
 */
export function isBlacklistedTopic(topic: string): boolean {
    if (!topic) return true;
    const normalized = topic.toLowerCase().trim();

    // 1. Exact or partial match against the blacklist
    if (TOPIC_BLACKLIST.some(term => normalized.includes(term))) {
        return true;
    }

    // 2. Length check (too short topics are usually junk like "a", "of")
    if (normalized.length < 2) {
        return true;
    }

    return false;
}
