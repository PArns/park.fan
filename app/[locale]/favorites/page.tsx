import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Star } from 'lucide-react';
import { SITE_URL } from '@/i18n/config';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { FavoritesSection } from '@/components/parks/favorites-section';
import { FavoritesHowTo } from '@/components/parks/favorites-how-to';
import { countFavorites, FAVORITES_COOKIE_NAME, parseFavoritesCookie } from '@/lib/utils/favorites';

/**
 * Everything this browser has starred, the destination of the header band's "Meine Favoriten"
 * link (`FavoritesPageMenuLink`) and the footer's. Like `/alerts` it reports state that lives in
 * one browser, so it is `noindex`, in no sitemap, and has no localized slug.
 *
 * It reads the favorites cookie and renders per request, so the first HTML is the size of the
 * list and `FavoritesSection` paints the skeleton the cards land in; a prerendered page could
 * only paint the empty state and grow after hydration. `FavoritesSection` is imported directly,
 * not through `next/dynamic`, because here it is the page. No `<RouteMessages>`: the client
 * components need only `favorites` and `navigation`, which the locale layout ships.
 */
interface FavoritesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FavoritesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isServableRoute(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'favoritesPage' });
  return {
    // `metaTitle`, not `title`: the locale layout's template is `%s`, so the page carries its own
    // brand suffix, and `title` is also the `<h1>` below, which must not.
    title: t('metaTitle'),
    // A cookie in one browser — nothing here is the same page twice.
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/${locale}/favorites` },
  };
}

export default async function FavoritesPage({ params }: FavoritesPageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);
  const t = await getTranslations('favoritesPage');
  const favorites = parseFavoritesCookie((await cookies()).get(FAVORITES_COOKIE_NAME)?.value);
  const initialCounts = favorites ? countFavorites(favorites) : null;

  return (
    <>
      {/* `px-4` outside, `container mx-auto` inside: the band's own geometry. `PageContainer`
          pads inside the container, which from 1440 px up would start this text 16 px right
          of the band's. */}
      <div className="px-4 pt-8">
        <div className="container mx-auto flex items-center gap-3">
          <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Star className="text-primary size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* `standalone`: the heading is the `<h1>` above and the instructions are the block
          below, in every state — the band would otherwise draw both a second time, and in the
          empty state the three steps would stand twice under each other. */}
      <FavoritesSection standalone initialCounts={initialCounts} />

      <div className="px-4 py-8">
        <div className="container mx-auto">
          <h2 className="mb-4 text-lg font-semibold">{t('howToTitle')}</h2>
          <FavoritesHowTo />
        </div>
      </div>
    </>
  );
}
