import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

const NOT_FOUND_HEAD = {
  robots: { index: false, follow: true },
  alternates: null,
} satisfies Metadata;

/**
 * The head of a locale 404. Without it the page inherits the `[locale]` layout's metadata: the
 * homepage title and canonical, and an `index, follow` beside the `noindex` Next injects.
 * `alternates: null` drops the inherited canonical and hreflang. The catch-all
 * `app/[locale]/[...rest]/page.tsx` needs it as well as `not-found.tsx`: after hydration the
 * title falls back to the throwing page's own metadata.
 */
export async function notFoundMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'notFound' });
  return { title: t('title'), description: t('description'), ...NOT_FOUND_HEAD };
}

/**
 * The same head with no locale, for `not-found.tsx`. Its `generateMetadata` gets no params, and
 * `getLocale()` there reads `headers()`: on a prerendered route (`/blog/[slug]`, `/parks/…`) that
 * turns an unknown slug into a 500 instead of a 404. The visible page still renders in the locale.
 */
export function notFoundMetadataWithoutLocale(): Metadata {
  return { title: '404 · park.fan', description: null, ...NOT_FOUND_HEAD };
}
