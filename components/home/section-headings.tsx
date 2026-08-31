import { getTranslations } from 'next-intl/server';
import { BarChart3, Database, Globe } from 'lucide-react';
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
