import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

/**
 * The head of a locale 404. Without it the page inherited the `[locale]` layout's metadata: the
 * homepage title, the homepage canonical and an `index, follow` next to the `noindex` Next
 * injects for the status (SEO run, 2026-10-03). `alternates: null` drops the inherited canonical
 * and hreflang set.
 *
 * Used by `app/[locale]/not-found.tsx` and by the catch-all `app/[locale]/[...rest]/page.tsx`.
 * The catch-all needs it as well: the not-found file's metadata reaches the server HTML, but after
 * hydration the title falls back to the throwing page's own metadata, and the catch-all has none.
 */
export async function notFoundMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'notFound' });
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: true },
    alternates: null,
  };
}
