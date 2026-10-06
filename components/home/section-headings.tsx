import { getTranslations } from 'next-intl/server';
import { BarChart3, Database, Globe, Star } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';

/**
 * The chapter headings of the three homepage sections that stream, plus the one
 * lookup that resolves their strings.
 *
 * Their own file for the reason `ParkBestDaysHeader` has one: the section is
 * behind a `<Suspense>`, and the heading is the part of it that needs **no**
 * data — so the fallback mounts the real heading rather than a stack of
 * `Skeleton` blocks shaped like one. That matters more since these became
 * `ChapterHeading` tiles, because the height now moves with how the title and
 * hint wrap, which is per locale and per breakpoint. A sized placeholder cannot
 * track that; the real node tracks it by being it.
 *
 * The components are **synchronous** and take resolved strings, which is the
 * whole trick. `ParkBestDaysHeader` gets there by being a Client Component with
 * `useTranslations`; these stay on the server and take a prop instead, because a
 * fallback that awaits anything suspends — and a suspending fallback is not a
 * fallback. The caller resolves the labels once with
 * {@link getSectionHeadingLabels} and hands the same object to the boundary and
 * to the section inside it.
 */

export interface SectionHeadingLabels {
  globalStats: { kicker: string; title: string; hint: string };
  platformStats: { kicker: string; title: string; hint: string };
  liveActivity: { kicker: string; title: string; hint: string };
}

/**
 * Resolves the kicker, title and hint of the homepage's global stats, platform stats and live
 * activity headings, once, for both the Suspense fallback and the section.
 */
export async function getSectionHeadingLabels(): Promise<SectionHeadingLabels> {
  const [tStats, tHome, tStory] = await Promise.all([
    getTranslations('stats'),
    getTranslations('home'),
    getTranslations('homeStory'),
  ]);
  return {
    globalStats: {
      kicker: tStory('platform.statsKicker'),
      title: tStats('globalStats'),
      hint: tStats('globalStatsIntro'),
    },
    platformStats: {
      kicker: tStory('platform.kicker'),
      title: tStats('platformStats'),
      hint: tStats('platformStatsDescription'),
    },
    liveActivity: {
      kicker: tStory('liveNow.kicker'),
      title: tHome('sections.liveNow'),
      hint: tHome('sections.liveNowIntro'),
    },
  };
}

/**
 * Chapter heading of the homepage's global stats section (anchor `#zahlen`). Synchronous, so a
 * Suspense fallback can render it.
 */
export function GlobalStatsHeading({ labels }: { labels: SectionHeadingLabels }) {
  return (
    <ChapterHeading
      variant="tile"
      icon={BarChart3}
      kicker={labels.globalStats.kicker}
      title={labels.globalStats.title}
      hint={labels.globalStats.hint}
      id="zahlen"
    />
  );
}

/**
 * Chapter heading of the homepage's platform stats section. Synchronous, so a Suspense fallback can
 * render it.
 */
export function PlatformStatsHeading({ labels }: { labels: SectionHeadingLabels }) {
  return (
    <ChapterHeading
      variant="tile"
      icon={Database}
      kicker={labels.platformStats.kicker}
      title={labels.platformStats.title}
      hint={labels.platformStats.hint}
    />
  );
}

/**
 * Chapter heading of the homepage's live activity section (anchor `#parks-weltweit`). Synchronous,
 * so a Suspense fallback can render it.
 */
export function LiveActivityHeading({ labels }: { labels: SectionHeadingLabels }) {
  return (
    <ChapterHeading
      variant="tile"
      icon={Globe}
      kicker={labels.liveActivity.kicker}
      title={labels.liveActivity.title}
      hint={labels.liveActivity.hint}
      id="parks-weltweit"
    />
  );
}

/** Title and intro of „Beliebte Parks" — the homepage and `PageBottomSections` both stream it. */
export interface FeaturedParksLabels {
  title: string;
  hint: string;
}

/** Resolves the title and intro of the featured parks heading for `FeaturedParksHeading`. */
export async function getFeaturedParksLabels(): Promise<FeaturedParksLabels> {
  const tHome = await getTranslations('home');
  return {
    title: tHome('sections.featuredParks'),
    hint: tHome('sections.featuredParksIntro'),
  };
}

/**
 * „Beliebte Parks", in the slot and in its fallback alike. `tile` on the homepage, where every
 * chapter opens with the plate; `watermark` (the default) under blog, news and glossary pages,
 * whose own chapters carry the watermark glyph on the plain page background. No kicker in either.
 */
export function FeaturedParksHeading({
  labels,
  variant = 'watermark',
}: {
  labels: FeaturedParksLabels;
  variant?: 'watermark' | 'tile';
}) {
  return <ChapterHeading variant={variant} icon={Star} title={labels.title} hint={labels.hint} />;
}
