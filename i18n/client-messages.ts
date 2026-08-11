import type { AbstractIntlMessages } from 'next-intl';

/**
 * Narrowing helpers for the messages that reach the browser.
 *
 * ── The problem this solves ───────────────────────────────────────────────────
 * Everything handed to `<NextIntlClientProvider>` is serialized into the RSC
 * payload, and therefore into the HTML, of every page that renders it — in all
 * six locales. This module used to export ONE flat allowlist that the locale
 * layout applied regardless of route: 44 KB of JSON (EN) / 47 KB (DE) per page,
 * ~15 KB after brotli. Measured against the import graph, the layout chrome
 * needs ~6 KB of that; the rest belongs to one route group each.
 *
 * So the split is now two-level:
 *
 *   1. the locale layout ships {@link LAYOUT_MESSAGE_NAMESPACES} (chrome only),
 *   2. each route adds its own delta through `<RouteMessages>`, which merges on
 *      the CLIENT — so the shared set is serialized once, not once per level.
 *
 * Both lists are derived from the import graph by
 * `pnpm generate:route-namespaces` and live in `route-namespaces.generated.ts`.
 * Nothing here is hand-maintained; `pnpm check:client-messages` fails when the
 * generated file has drifted.
 *
 * Server Components read their translations through `getTranslations` and never
 * need anything shipped, which is why the analysis only counts `useTranslations`
 * calls inside a client boundary.
 */

/**
 * Narrows a message tree to the given namespaces, preserving key paths so
 * `useTranslations('seo.faq')` and friends keep resolving unchanged.
 *
 * Entries are either a top-level namespace (whole subtree kept) or a dotted path
 * such as `'contribute.form'` (only that subtree, still under its original path).
 * A namespace that does not exist is skipped rather than producing an empty
 * branch — `validate:translations` is what guards the message files themselves.
 */
export function pickMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly string[]
): AbstractIntlMessages {
  const picked: Record<string, unknown> = {};

  for (const namespace of namespaces) {
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

/**
 * Merges a delta onto a base message tree, returning a new object.
 *
 * A plain spread is not enough: the layout ships `parks.crowdLevels` and
 * `parks.status` for the card badges in the header/search results, while a park
 * route needs the whole `parks` namespace. Spreading would have one `parks` key
 * replace the other and silently drop half the tree, which next-intl reports as
 * MISSING_MESSAGE at render time rather than as a build failure.
 *
 * Leaves (strings, and arrays, which next-intl treats as opaque) are taken from
 * `delta` when both sides have one.
 */
export function mergeMessages(
  base: AbstractIntlMessages,
  delta: AbstractIntlMessages
): AbstractIntlMessages {
  const merged: Record<string, unknown> = { ...(base as Record<string, unknown>) };

  for (const [key, value] of Object.entries(delta as Record<string, unknown>)) {
    const existing = merged[key];
    const bothAreBranches =
      typeof existing === 'object' &&
      existing !== null &&
      !Array.isArray(existing) &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value);

    merged[key] = bothAreBranches
      ? mergeMessages(existing as AbstractIntlMessages, value as AbstractIntlMessages)
      : value;
  }

  return merged as AbstractIntlMessages;
}
