import type { AbstractIntlMessages } from 'next-intl';

/**
 * Which message namespaces are handed to `<NextIntlClientProvider>` — i.e. serialized into the
 * RSC payload (and thus the HTML) of EVERY page, in every one of the 6 locales.
 *
 * The full bundle is ~55 KB of JSON per page. Server Components read their translations through
 * `getTranslations` on the server and never need them shipped, so anything only they use is pure
 * payload. This trims ~11 KB (≈20 %) off every single page response — the same reasoning that
 * already drives `leanParkForShell` in `lib/api/parks.ts`.
 *
 * ── Maintenance ──────────────────────────────────────────────────────────────────────────────
 * A namespace missing here does NOT crash: next-intl reports a MISSING_MESSAGE error and renders
 * the key. To stop that being discovered in production, `scripts/check-client-messages.mjs`
 * (wired into `pnpm release:check`) scans every `'use client'` file for `useTranslations('…')`
 * and fails when a namespace it needs isn't reachable from this allowlist. Add the namespace here
 * when a Server Component becomes a Client Component.
 *
 * Entries are either a top-level namespace (whole subtree kept) or `'parent.child'` (only that
 * subtree kept, under its original path).
 */
export const CLIENT_MESSAGE_NAMESPACES: readonly string[] = [
  // Whole namespaces — used pervasively by client components.
  'attractions',
  'blog',
  'common',
  'explore',
  'favorites',
  'feedback',
  'footer',
  'geo',
  'glossary',
  'home',
  'navigation',
  'nearby',
  'parkCard',
  'parks',
  'search',
  'share',
  'stats',
  'theme',

  // Partial namespaces — the rest of these subtrees is server-only.
  // `seo` (~8 KB) is generateMetadata territory; only the park/attraction FAQ copy is
  // rendered by the client FAQ tree.
  'seo.faq',
  // The contribute page's hero/rights/success/meta copy renders on the server; only the
  // interactive upload widgets are client components.
  'contribute.dropzone',
  'contribute.error',
  'contribute.form',
  'contribute.picker',
  // The privacy page is server-rendered apart from the analytics opt-out toggle.
  'datenschutz.analyticsOptOut',
];

/**
 * Narrows a locale's messages to {@link CLIENT_MESSAGE_NAMESPACES}, preserving key paths so
 * `useTranslations('seo.faq')` and friends keep resolving unchanged.
 */
export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const picked: Record<string, unknown> = {};

  for (const namespace of CLIENT_MESSAGE_NAMESPACES) {
    const segments = namespace.split('.');
    let source: unknown = messages;
    for (const segment of segments) {
      if (typeof source !== 'object' || source === null) {
        source = undefined;
        break;
      }
      source = (source as Record<string, unknown>)[segment];
    }
    if (source === undefined) continue;

    // Re-create the path inside the picked object.
    let target = picked;
    for (const segment of segments.slice(0, -1)) {
      const existing = target[segment];
      target[segment] =
        typeof existing === 'object' && existing !== null
          ? existing
          : ({} as Record<string, unknown>);
      target = target[segment] as Record<string, unknown>;
    }
    target[segments[segments.length - 1]] = source;
  }

  return picked as AbstractIntlMessages;
}
