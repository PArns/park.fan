import type { Locale } from '@/i18n/config';

/** One glossary term's client-side data for a single locale. */
export interface ClientTerm {
  /** Tooltip title. Omitted when this locale has no translation yet — the link still renders. */
  name?: string;
  /** Tooltip body. Omitted when this locale has no translation yet. */
  shortDefinition?: string;
  slug: string;
}

export type ClientGlossaryTerms = Record<string, ClientTerm>;

/**
 * Lazy, per-locale loader for the client glossary data used by {@link GlossaryTermLink}: each
 * locale is its own chunk fetched after first paint, so the dataset never competes with the LCP
 * image. Cached per locale; a small subscription re-renders the mounted term links once their
 * locale resolves.
 */
const resolved = new Map<Locale, ClientGlossaryTerms>();
const inflight = new Map<Locale, Promise<void>>();
const subscribers = new Set<() => void>();

// One literal import per locale, so every bundler emits a discrete chunk and only the requested
// locale is fetched.
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
