'use client';

import { memo, useId } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays, CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import { HubBanner } from '@/components/layout/hub-banner';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { PlannerRegionArt } from '@/components/layout/planner-region-art';
import { translateCountry } from '@/lib/i18n/helpers';
import { quickStartClick, type PlannerQuickStart } from '@/lib/planner/quick-start';
import { plannerUi } from '@/lib/planner/ui-store';
import { cn } from '@/lib/utils';
import type { PlannerMenuRegion } from '@/lib/navigation/planner-menu';

/** What the planner band draws; the header resolves all three. */
interface PlannerMenuPanelProps {
  /** The day planner's page, locale-relative; the header derives it for the bar and the sheet. */
  dayPlannerHref: string;
  regions: PlannerMenuRegion[];
  parks: PlannerQuickStart[];
}

/** The row shape of the other bands' lists, so the planner's parks read as the same surface. */
const ROW =
  'text-muted-foreground hover:text-foreground hover:bg-muted/60 -mx-2 flex items-center gap-2.5 rounded-md px-2 py-1 text-sm transition-colors';

/**
 * The planner band: the trip planner per region, the day planner, and the locale's popular parks
 * as quick starts into the day planner. Everything here is in every page's HTML (`hidden`, NavMenu
 * rule 1); the region scenes alone load on the first opening. The data and the click behaviour
 * live elsewhere (`lib/navigation/trip-regions.ts`, `lib/navigation/planner-menu.ts`,
 * `lib/planner/quick-start.ts`), so this file is only the look. Memoised for the same reason as
 * `ParksMenuPanel`. See docs/features/header-navigation.md.
 */
export const PlannerMenuPanel = memo(function PlannerMenuPanel({
  dayPlannerHref,
  regions,
  parks,
}: PlannerMenuPanelProps) {
  const t = useTranslations('navigation');
  const tGeo = useTranslations('geo');
  const locale = useLocale();
  const quickStartHintId = useId();

  return (
    <div className="grid grid-cols-3 gap-x-8 gap-y-5">
      {/* The trip planner, one tile per region. One region is one tile, never a grid with gaps. */}
      {regions.length > 0 && (
        <div data-menu-stagger className="flex min-w-0 flex-col">
          <MenuSectionHeading label={t('tripPlanner')} />
          <div className={cn('grid gap-3', regions.length > 1 && 'grid-cols-2')}>
            {regions.map((region) => (
              <HubBanner
                key={region.id}
                href={region.href}
                icon={CalendarDays}
                label={region.name}
                hint={t('tripPlannerHint')}
                photo={region.photo}
                art={<PlannerRegionArt regionId={region.id} photo={region.photo} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* The day planner: its page, what it does, and the open signal for a plan in progress. */}
      <div data-menu-stagger className="flex min-w-0 flex-col">
        <MenuSectionHeading label={t('dayPlanner')} href={dayPlannerHref} />
        <p className="text-muted-foreground text-sm leading-snug text-pretty">
          {t('dayPlannerHint')}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 self-start"
          onClick={() => plannerUi.requestOpen('menu-plan')}
        >
          <CalendarPlus aria-hidden="true" />
          {t('openMyPlan')}
        </Button>
      </div>

      {/* The popular parks, each its own page's link that also starts the day planner on it. */}
      {parks.length > 0 && (
        <div data-menu-stagger className="flex min-w-0 flex-col">
          <MenuSectionHeading label={t('popularParks')} />
          <p id={quickStartHintId} className="text-muted-foreground mb-1.5 text-xs leading-snug">
            {t('quickStartHint')}
          </p>
          <ul aria-label={t('popularParks')} className="space-y-px">
            {parks.map((park) => (
              <li key={park.href}>
                <Link
                  href={park.href as '/'}
                  prefetch={false}
                  aria-describedby={quickStartHintId}
                  onClick={quickStartClick(park, 'menu-park')}
                  className={ROW}
                >
                  <span className="relative block size-8 shrink-0 overflow-hidden rounded-md">
                    {park.image ? (
                      <Image
                        src={park.image}
                        alt=""
                        width={32}
                        height={32}
                        style={
                          park.imagePosition ? { objectPosition: park.imagePosition } : undefined
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BlogCoverFallback slug={park.slug} mark="none" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block truncate font-medium">{park.name}</span>
                    <span className="block truncate text-xs">
                      {[
                        park.city,
                        park.countrySlug && translateCountry(tGeo, park.countrySlug, locale),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <CalendarPlus className="text-primary size-3.5 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
