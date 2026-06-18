/**
 * check-i18n-nav — guards the two routing universes from cross-wiring.
 *
 *   Universe A  [locale]/(public)/*  → locale-prefixed (/ and /zh). Internal links
 *               MUST preserve the prefix → use @/i18n/navigation (Link/useRouter).
 *   Universe B  (protected)/dashboard/*, /admin/*  → NOT locale-routed. Links here
 *               MUST NOT get a prefix → use next/link, next/navigation, or window.location.
 *
 * Two bug classes this catches (both shipped to prod before this check existed):
 *   A. i18n nav → "/dashboard" | "/admin"  ⇒ becomes "/zh/dashboard…" ⇒ 404
 *   B. plain nav (next/link|next/navigation) inside [locale]/(public) → a LOCALED
 *      route (e.g. "/login") ⇒ drops the prefix ⇒ wrong-language page
 *
 * Name-aware: it resolves the LOCAL identifier each nav tool is bound to (e.g. i18n
 * `Link` vs `NextLink` from next/link) so `<NextLink href="/dashboard">` (correct) is
 * NOT confused with `<Link href="/dashboard">` (the bug). Heuristic/regex like
 * check-cjk — silence a false positive with a trailing `// i18n-nav-ok` comment.
 */
import fs from 'fs';
import { globSync } from 'glob';

const LOCALED_ROUTES = [
    'about', 'blog', 'case-studies', 'consultation', 'contact', 'forgot-password',
    'login', 'preview', 'pricing', 'privacy', 'refund', 'register',
    'reset-password', 'terms', 'tools',
];
const NON_LOCALED = ['dashboard', 'admin'];

const localedAlt = LOCALED_ROUTES.join('|');
const nonLocaledAlt = NON_LOCALED.join('|');

interface Violation { file: string; lineNum: number; line: string; rule: 'A' | 'B'; }

/** local name bound to a named import: `import { Link as X } from 'mod'` → X; `Link` → Link */
function namedImport(content: string, mod: string, exported: string): string | null {
    const m = content.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${mod.replace(/\//g, '\\/')}['"]`));
    if (!m) return null;
    for (const part of m[1].split(',')) {
        const seg = part.trim();
        if (seg === exported) return exported;
        const alias = seg.match(new RegExp(`^${exported}\\s+as\\s+(\\w+)$`));
        if (alias) return alias[1];
    }
    return null;
}

/** local name of a default import: `import X from 'mod'` → X */
function defaultImport(content: string, mod: string): string | null {
    const m = content.match(new RegExp(`import\\s+(\\w+)\\s+from\\s*['"]${mod.replace(/\//g, '\\/')}['"]`));
    return m ? m[1] : null;
}

function pushReplaceRe(alt: string) {
    return new RegExp(`\\.(?:push|replace)\\(\\s*[\`'"]\\/(?:${alt})(?:[\\/?#\`'"]|$)`);
}
function linkHrefRe(linkName: string, alt: string) {
    return new RegExp(`<${linkName}\\b[^>]*href=[\`'"]\\/(?:${alt})(?:[\\/?#\`'"]|$)`);
}

function checkFile(filePath: string): Violation[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const violations: Violation[] = [];

    const i18nLink = namedImport(content, '@/i18n/navigation', 'Link');
    const i18nRouter = namedImport(content, '@/i18n/navigation', 'useRouter');
    const plainLink = defaultImport(content, 'next/link');
    const plainRouter = namedImport(content, 'next/navigation', 'useRouter');

    const isLocaledPublic = filePath.includes('/app/[locale]/(public)/');

    const reA_router = pushReplaceRe(nonLocaledAlt);
    const reA_link = i18nLink ? linkHrefRe(i18nLink, nonLocaledAlt) : null;
    const reB_router = pushReplaceRe(localedAlt + '|'); // trailing | also matches "/" root
    const reB_link = plainLink ? linkHrefRe(plainLink, localedAlt + '|') : null;

    content.split('\n').forEach((line, idx) => {
        if (line.includes('i18n-nav-ok')) return;
        const lineNum = idx + 1;

        // Rule A — i18n nav → non-localed route (/dashboard|/admin)
        if (i18nRouter && reA_router.test(line)) {
            violations.push({ file: filePath, lineNum, line: line.trim(), rule: 'A' });
        } else if (reA_link && reA_link.test(line)) {
            violations.push({ file: filePath, lineNum, line: line.trim(), rule: 'A' });
        }

        // Rule B — plain nav inside [locale]/(public) → a localed route
        if (isLocaledPublic) {
            if (plainRouter && reB_router.test(line)) {
                violations.push({ file: filePath, lineNum, line: line.trim(), rule: 'B' });
            } else if (reB_link && reB_link.test(line)) {
                violations.push({ file: filePath, lineNum, line: line.trim(), rule: 'B' });
            }
        }
    });

    return violations;
}

const files = globSync('src/**/*.{ts,tsx}', { ignore: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'] });
const all: Violation[] = [];
for (const f of files) all.push(...checkFile(f));

if (all.length === 0) {
    console.log('✅ check-i18n-nav: no cross-universe navigation found.');
    process.exit(0);
}

console.error(`\n❌ check-i18n-nav found ${all.length} suspicious navigation(s):\n`);
const RULE_MSG = {
    A: 'i18n nav → non-localed route (/dashboard|/admin) — use next/link or window.location (avoids /zh/dashboard 404)',
    B: 'plain nav inside [locale]/(public) → a localed route — use @/i18n/navigation (preserves /zh prefix)',
} as const;
for (const v of all) {
    console.error(`  [${v.rule}] ${v.file}:${v.lineNum}\n      ${v.line}\n      → ${RULE_MSG[v.rule]}`);
}
console.error('\n  (false positive? append `// i18n-nav-ok` to the line)\n');
process.exit(1);
