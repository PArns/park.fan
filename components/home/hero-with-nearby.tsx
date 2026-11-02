'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowDown, Compass } from 'lucide-react';
import { useHeroPark } from '@/lib/hooks/use-hero-park';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useGlobalStats } from '@/lib/hooks/use-global-stats';
import { useMounted } from '@/lib/hooks/use-mounted';
import { PARK_COMPASS_ID, useCompassPresent } from '@/lib/home/compass-presence';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { HeroParkActions } from '@/components/home/hero-park-actions';
import { OpenParksBadge } from '@/components/home/open-parks-badge';
import { LatestNewsChip, type LatestNews } from '@/components/blog/latest-news-chip';
/** Sentence fallbacks when neither the SSR seed nor the live overlay has counts yet. */
const FALLBACK_COUNTS = { openParks: null, parks: 200, attractions: 7000 };

/** Seed for the live counts, baked into the static shell by <HeroStats>. */
export interface HeroInitialCounts {
  openParks: number;
  parks: number;
  attractions: number;
}

/**
 * The open-parks badge and, beside it, the newest news post as a chip that runs to the row's end.
 * The row's own width decides the layout, never the badge's, which changes after first paint: from
 * 34 rem (the widest badge plus 15 rem of chip) it is one line that never wraps and the chip
 * truncates; below that, badge above chip. Where the page shows the world-map panel
 * (`@container/page` from 1280 px, the column's own threshold) the badge sits in that panel's
 * header instead, and the chip has the row to itself. In a park, while the compass is on the
 * page, the chip's slot holds a pill that scrolls down to it, same height, so the swap moves
 * nothing.
 */
function HeroBadgeRow({
  openParks,
  latestNews,
}: {
  openParks: number | null;
  latestNews: LatestNews | null | undefined;
}) {
  const compass = useCompassPresent();
  const tHome = useTranslations('home');
  return (
    // Two elements because a container query styles the container's descendants, never the
    // container itself: the outer box is measured, the inner one is laid out.
    <div className="@container/badges w-full">
      <div className="flex flex-col items-start gap-2 @min-[34rem]/badges:flex-row @min-[34rem]/badges:items-center">
        {/* Not on a phone, where its row went to the search list; the map panel carries it from
            1280 px. */}
        <OpenParksBadge
          label={openParks == null ? null : tHome('hero.openNow', { count: openParks })}
          className="max-md:hidden @min-[1280px]/page:hidden"
        />
        {compass ? (
          <CompassPill />
        ) : (
          latestNews && <LatestNewsChip news={latestNews} className="w-full" />
        )}
      </div>
    </div>
  );
}

/**
 * „Zum Kompass": scrolls to the in-park compass under the hero and hands it the focus, so a
 * keyboard or screen reader lands where the eye does. A plain fragment link underneath, which is
 * what it does without JavaScript; the smooth scroll is dropped under reduced motion.
 */
function CompassPill() {
  const t = useTranslations('nearby.compass');
  const jump = (event: React.MouseEvent<HTMLAnchorElement>) => {
    trackSiteEvent('compass_pill_clicked', {});
    const target = document.getElementById(PARK_COMPASS_ID);
    if (!target) return;
    event.preventDefault();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };
  return (
    <a
      href={`#${PARK_COMPASS_ID}`}
      onClick={jump}
      data-hero-compass=""
      // 30 px to match the chip it stands in for; the `::after` makes the target 44 px tall.
      className="group border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15 relative inline-flex h-[30px] max-w-full min-w-0 items-center gap-2 rounded-full border pr-3 pl-1 text-xs font-semibold shadow-sm transition-colors after:absolute after:inset-x-0 after:-inset-y-[7px] after:content-['']"
    >
      <span className="bg-primary text-primary-foreground flex size-[22px] shrink-0 items-center justify-center rounded-full">
        <Compass className="size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate">{t('heroPill')}</span>
      <ArrowDown
        className="text-primary size-3.5 shrink-0 transition-transform group-hover:translate-y-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
    </a>
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
    // would on the <h1>.
    <div className="mt-4 mb-3 flex items-center gap-4">
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
  latestNews,
  isFallback = false,
}: {
  initialCounts: HeroInitialCounts | null;
  /** The newest news post, for the chip in the badge row. Resolved on the server. */
  latestNews?: LatestNews | null;
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
        <HeroBadgeRow openParks={openParks} latestNews={latestNews} />
        <HeroHeadline as={headlineTag}>
          {t('heroWelcome', { parkName: variant.park.name })}
        </HeroHeadline>
        <HeroParkActions park={variant.park} className="mt-2" />
      </>
    );
  }

  return (
    <>
      <HeroBadgeRow openParks={openParks} latestNews={latestNews} />
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
