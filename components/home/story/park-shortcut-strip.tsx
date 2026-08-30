'use client';

import { useMemo } from 'react';
import { ArrowRight, Route } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useLiveParksByRegion } from '@/lib/hooks/use-live-parks-by-region';
import { CROWD_DOT_CLASS, type ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import type { FeaturedCardStatic } from '@/components/home/featured-park-cards-live';
import { cn } from '@/lib/utils';

/**
 * The narrow "straight to a park" band under the hero.
 *
 * A returning visitor does not want an explanation, they want their park — so
 * the story page opens with one row of links before the first chapter argues
 * anything.
 *
 * It costs **no request of its own**. The regions come from the same featured
 * list the card grid further down renders, and `useLiveParksByRegion` keys its
 * query on the sorted region set, so both consumers share one cache entry and
 * one 5-min poll. Pass a different list and that stops being true — which is
 * why the parks arrive as a prop instead of being re-derived here.
 *
 * Until that poll resolves (and on the prerendered shell, where it never runs)
 * the dot renders in the neutral muted tone rather than disappearing: a pill
 * that grows a dot on hydration moves the label beside it.
 */
export function ParkShortcutStrip({ parks }: { parks: FeaturedCardStatic[] }) {
  const t = useTranslations('homeStory.shortcuts');

  const regions = useMemo(() => parks.map((p) => `${p.continentSlug}/${p.countrySlug}`), [parks]);
  const { liveByParkId } = useLiveParksByRegion(regions);

  if (parks.length === 0) return null;

  return (
    <section className="border-border bg-muted/30 border-y px-4 py-3.5">
      <div className="container mx-auto flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="text-muted-foreground inline-flex shrink-0 items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase">
          <Route className="h-3.5 w-3.5" aria-hidden="true" />
          {t('label')}
        </span>

        <div className="flex flex-1 flex-wrap gap-2">
          {parks.map((park) => {
            const level = liveByParkId?.[park.parkId]?.crowdLevel;
            const dot =
              level && level !== 'unknown'
                ? CROWD_DOT_CLASS[level as ColoredCrowdLevel]
                : 'bg-muted-foreground/40';
            return (
              <Link
                key={park.slug}
                href={park.href as '/'}
                prefetch={false}
                className="border-border bg-card/70 hover:border-primary/40 hover:bg-card inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors"
              >
                <span
                  aria-hidden="true"
                  className={cn('size-[7px] shrink-0 rounded-full transition-colors', dot)}
                />
                {park.name}
              </Link>
            );
          })}
        </div>

        <Link
          href="/parks"
          prefetch={false}
          className="text-primary inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold hover:underline"
        >
          {t('all')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
