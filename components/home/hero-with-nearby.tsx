'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useHeroPark } from '@/lib/hooks/use-hero-park';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useGlobalStats } from '@/lib/hooks/use-global-stats';
import { useMounted } from '@/lib/hooks/use-mounted';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { HeroParkActions } from '@/components/home/hero-park-actions';
import { OpenParksBadge } from '@/components/home/open-parks-badge';
/** Sentence fallbacks when neither the SSR seed nor the live overlay has counts yet. */
const FALLBACK_COUNTS = { openParks: null, parks: 200, attractions: 7000 };

/** Seed for the live counts, baked into the static shell by <HeroStats>. */
export interface HeroInitialCounts {
  openParks: number;
  parks: number;
  attractions: number;
}

/**
 * The open-parks badge over the headline, where nothing else shows the count: not on a phone, whose
 * row went to the search list, and not where the page shows the world-map panel (`@container/page`
 * from 1280 px), whose header carries it. The newest news post stands in the search list's posts.
 */
function HeroBadgeRow({ openParks }: { openParks: number | null }) {
  const tHome = useTranslations('home');
  return (
    <OpenParksBadge
      label={openParks == null ? null : tHome('hero.openNow', { count: openParks })}
      className="max-md:hidden @min-[1280px]/page:hidden"
    />
  );
}

/**
 * The headline, with the detailed pin beside it on a wide page. The pin alone, not the full
 * lockup, which at a height that reads beside `text-5xl` would fold German and French to four
 * lines; `logo.svg` rather than `BrandPin`, whose flat silhouette is made for 26 px. 96 px (`h-24`)
 * is the two-line headline's own height. `mark` stays off for the welcome headline, which appears
 * only after mount and would otherwise move the intro and badge. The threshold asks the page
 * (`@container/page`): 1304 px is where the world map column stops squeezing the plate.
 */
function HeroHeadline({
  children,
  mark = false,
  as: Tag = 'h1',
}: {
  children: React.ReactNode;
  mark?: boolean;
  as?: 'h1' | 'p';
}) {
  return (
    // Margins do not collapse in a flex container, so `mt-4 mb-3` here spaces the headline as it
    // would on the <h1>. The top margin is the gap under the open-parks badge, so it goes wherever
    // the badge does not show and the headline opens the plate.
    <div className="mt-4 mb-3 flex items-center gap-4 max-md:mt-0 @min-[1280px]/page:mt-0">
      {mark && (
        <span className="hidden shrink-0 @min-[1304px]/page:block">
          <Image
            src="/logo-dark.svg"
            width={1562}
            height={1905}
            alt=""
            aria-hidden="true"
            className="hidden h-24 w-auto dark:block"
            loading="eager"
          />
          <Image
            src="/logo.svg"
            width={1562}
            height={1905}
            alt=""
            aria-hidden="true"
            className="block h-24 w-auto dark:hidden"
            loading="eager"
          />
        </span>
      )}
      {/* 28 px on a phone, where every line the headline takes is a line the search list under it
          loses. */}
      <Tag className="text-[1.75rem]/[1.15] font-extrabold tracking-tight text-balance sm:text-5xl">
        {children}
      </Tag>
    </div>
  );
}

/**
 * The hero's left column: live open-count badge, headline and the intro with live park/
 * attraction counts (SSR seed + 5-min client overlay). From `md` up, a visitor inside or right
 * next to a park gets the „Willkommen im …" variant with that park's block (`useHeroPark`); on a
 * phone that block sits in the search list (`HeroPhoneList`), so nothing above the field changes
 * and the list never moves.
 */
export function HeroWithNearby({
  initialCounts,
  isFallback = false,
}: {
  initialCounts: HeroInitialCounts | null;
  /**
   * Set where this is the Suspense fallback of the streamed hero. Both copies are in the
   * document until the stream swaps them, so the fallback's headline is a `<p>` with the same
   * box and a reader of the raw HTML finds one `<h1>`.
   */
  isFallback?: boolean;
}) {
  const headlineTag = isFallback ? 'p' : 'h1';
  const t = useTranslations('parks');
  const tHome = useTranslations('home');
  const locale = useLocale();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const heroPark = useHeroPark();
  const variant = isDesktop ? heroPark : null;
  /*
   * The seed counts in the first client render, for the same reason `GlobalStatsLiveCounts` gates
   * them: `useGlobalStats` can already hold data while this subtree hydrates, and the badge writes
   * the number into text the server has already committed. The homepage's HTML is prerendered and
   * served for hours, so by then the live count almost always differs.
   */
  const mounted = useMounted();
  const { data: liveStats } = useGlobalStats();
  const counts = (mounted ? liveStats?.counts : undefined) ?? initialCounts;
  const openParks = counts?.openParks ?? FALLBACK_COUNTS.openParks;
  const numberFormat = getNumberFormat(locale);
  const introValues = {
    parks: numberFormat.format(counts?.parks ?? FALLBACK_COUNTS.parks),
    attractions: numberFormat.format(counts?.attractions ?? FALLBACK_COUNTS.attractions),
    strong: (chunks: React.ReactNode) => (
      <strong className="text-foreground font-semibold">{chunks}</strong>
    ),
  };

  if (variant?.kind === 'in_park') {
    // No intro under the welcome: it stood between the welcome and what somebody in the park came
    // for, and this variant is client-only, so the crawlable HTML keeps the general intro. Three
    // children, like the general variant, so the entrance stagger counts alike.
    return (
      <>
        <HeroBadgeRow openParks={openParks} />
        <HeroHeadline as={headlineTag}>
          {t('heroWelcome', { parkName: variant.park.name })}
        </HeroHeadline>
        <HeroParkActions park={variant.park} className="mt-2" />
      </>
    );
  }

  return (
    <>
      <HeroBadgeRow openParks={openParks} />
      <HeroHeadline mark as={headlineTag}>
        {tHome('hero.title')}
      </HeroHeadline>
      {variant ? (
        <>
          <p className="text-foreground/80 max-w-xl text-base leading-relaxed md:text-lg">
            {t('heroNearPark', { parkName: variant.park.name })}
          </p>
          <HeroParkActions park={variant.park} className="mt-5" />
        </>
      ) : (
        // A phone gets the one-line version, since the full sentence would take the room of the
        // search list's rows. Both are in the HTML and CSS picks one, so the server's markup is
        // right on every viewport.
        <p className="text-foreground/80 max-w-xl text-base leading-relaxed md:text-lg">
          <span className="md:hidden">{tHome.rich('hero.introShort', introValues)}</span>
          <span className="hidden md:inline">{tHome.rich('hero.intro', introValues)}</span>
        </p>
      )}
    </>
  );
}
