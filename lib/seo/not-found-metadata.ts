import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

/**
 * The head of a locale 404. Without it the page inherits the `[locale]` layout's metadata: the
 * homepage title and canonical, and an `index, follow` beside the `noindex` Next injects.
 * `alternates: null` drops the inherited canonical and hreflang. The catch-all
 * `app/[locale]/[...rest]/page.tsx` needs it as well as `not-found.tsx`: after hydration the
 * title falls back to the throwing page's own metadata.
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
