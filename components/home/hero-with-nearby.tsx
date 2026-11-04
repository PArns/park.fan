'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useHeroPark } from '@/lib/hooks/use-hero-park';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useGlobalStats } from '@/lib/hooks/use-global-stats';
import { useMounted } from '@/lib/hooks/use-mounted';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { HeroParkActions } from '@/components/home/hero-park-actions';
import { OpenParksBadge } from '@/components/home/open-parks-badge';
import { HeroParky } from '@/components/home/hero-parky';
/** Sentence fallbacks when neither the SSR seed nor the live overlay has counts yet. */
const FALLBACK_COUNTS = { openParks: null, parks: 200, attractions: 7000 };

/** The counts the hero renders with, from <HeroStats>; the open count is overlaid live after mount. */
export interface HeroInitialCounts {
  openParks: number;
  parks: number;
  attractions: number;
}

/**
 * The open-parks badge over the headline, from `md` up: a phone gives the photo the row.
 */
function HeroBadgeRow({ openParks }: { openParks: number | null }) {
  const tHome = useTranslations('home');
  return (
    <OpenParksBadge
      label={openParks == null ? null : tHome('hero.openNow', { count: openParks })}
      className="max-md:hidden"
    />
  );
}

/**
 * The headline, set as large as the tour's headings and larger: it stands on the photo's lower
 * edge (`HeroBackground`'s scrim) and is the one thing to read first. 36 px on a phone, 48 px from
 * 640 px and 60 px from 1280 px.
 */
function HeroHeadline({ children }: { children: React.ReactNode }) {
  return (
    // Margins do not collapse in a flex container, so `mt-4 mb-4` here spaces the headline as it
    // would on the <h1>. The top margin is the gap under the open-parks badge, which a phone does
    // not show.
    <div className="mt-4 mb-4 max-md:mt-0">
      <h1 className="text-4xl/[1.04] font-black tracking-tight text-balance sm:text-5xl/[1.02] xl:text-6xl/[1]">
        {children}
      </h1>
    </div>
  );
}

/**
 * The hero's text: live open-count badge, headline and the intro with live park/attraction counts
 * (SSR seed + 5-min client overlay). From `md` up, a visitor inside or right next to a park gets
 * the „Willkommen im …" variant with that park's block (`useHeroPark`); on a phone that block
 * stands under the card rail (`HeroRail`), so nothing above the field changes.
 */
export function HeroWithNearby({ initialCounts }: { initialCounts: HeroInitialCounts | null }) {
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
        <HeroHeadline>{t('heroWelcome', { parkName: variant.park.name })}</HeroHeadline>
        <HeroParkActions park={variant.park} className="mt-2" />
      </>
    );
  }

  return (
    <>
      <HeroBadgeRow openParks={openParks} />
      <HeroHeadline>{tHome('hero.title')}</HeroHeadline>
      {/* Parky under the question on a desktop; next to a park the park's block takes his place. */}
      {!variant && <HeroParky />}
      {variant ? (
        <>
          <p className="text-foreground/85 max-w-4xl text-base leading-relaxed md:text-lg">
            {t('heroNearPark', { parkName: variant.park.name })}
          </p>
          <HeroParkActions park={variant.park} className="mt-5" />
        </>
      ) : (
        // A phone gets the one-line version, so the photo above the text keeps its room. Both are
        // in the HTML and CSS picks one, so the server's markup is right on every viewport.
        <p className="text-foreground/85 max-w-4xl text-base leading-relaxed md:text-lg">
          <span className="md:hidden">{tHome.rich('hero.introShort', introValues)}</span>
          <span className="hidden md:inline">{tHome.rich('hero.intro', introValues)}</span>
        </p>
      )}
    </>
  );
}
