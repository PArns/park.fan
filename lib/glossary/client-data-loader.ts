import type { Locale } from '@/i18n/config';

/** One glossary term's client-side data for a single locale. */
export interface ClientTerm {
  name: string;
  shortDefinition: string;
  slug: string;
}

export type ClientGlossaryTerms = Record<string, ClientTerm>;

/**
 * Lazy, per-locale loader for the client glossary data used by {@link GlossaryTermLink}.
 *
 * The full dataset is ~80 KB gzip (all terms × 6 locales). Statically importing it put that
 * weight into the initial bundle of every park/ride page, where it competed for bandwidth with
 * the LCP hero image. Instead each locale lives in its own ~13 KB chunk that is fetched on demand
 * (after first paint), so the term links/tooltips "highlight in" asynchronously without the data
 * ever touching the critical path.
 *
 * Results are cached per locale and a tiny subscription lets the (already-mounted) term-link
 * instances re-render once their locale resolves — no full-page re-render.
 */
const resolved = new Map<Locale, ClientGlossaryTerms>();
const inflight = new Map<Locale, Promise<void>>();
const subscribers = new Set<() => void>();

// Static dynamic imports (one per locale) so every bundler emits a discrete chunk and only the
// requested locale is ever fetched. A template-literal import would work too but is fuzzier to trace.
function importLocale(locale: Locale): Promise<{ TERMS: ClientGlossaryTerms }> {
  switch (locale) {
    case 'de':
      return import('./client-data/de');
    case 'fr':
      return import('./client-data/fr');
    case 'it':
      return import('./client-data/it');
    case 'nl':
      return import('./client-data/nl');
    case 'es':
      return import('./client-data/es');
    case 'en':
    default:
      return import('./client-data/en');
  }
}

/** Synchronously read already-loaded terms for a locale, or `undefined` if not yet fetched. */
export function getLoadedGlossaryTerms(locale: Locale): ClientGlossaryTerms | undefined {
  return resolved.get(locale);
}

/** Kick off the (deduplicated) fetch for a locale's glossary data; notifies subscribers when ready. */
export function loadGlossaryTerms(locale: Locale): void {
  if (resolved.has(locale) || inflight.has(locale)) return;
  const p = importLocale(locale)
    .then((m) => {
      resolved.set(locale, m.TERMS);
    })
    .catch(() => {
      // Leave unresolved — term links simply stay plain text (graceful degradation).
    })
    .finally(() => {
      inflight.delete(locale);
      subscribers.forEach((cb) => cb());
    });
  inflight.set(locale, p);
}

/** Subscribe to "a locale's data became available" notifications. Returns an unsubscribe fn. */
export function subscribeGlossaryTerms(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}
