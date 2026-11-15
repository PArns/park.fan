'use client';

import { memo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CalendarClock, CalendarDays, CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import { Button, buttonLinkProps } from '@/components/ui/button';
import { useMenuBandOpened } from '@/components/layout/menu-band';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { PlannerRegionArt } from '@/components/layout/planner-region-art';
import {
  REGION_CARD,
  REGION_KICKER,
  REGION_PILL as PILL,
} from '@/components/trip-regions/region-card-classes';
import { DrawnDayStrip, PlanDayStrip } from '@/components/planner/day-strip';
import { translateCountry } from '@/lib/i18n/helpers';
import { formatPlanDay, usePlanSummary } from '@/lib/planner/plan-summary';
import { PLANNER_START_ID } from '@/lib/planner/segments';
import { plannerUi } from '@/lib/planner/ui-store';
import { quickStartClick, type PlannerQuickStart } from '@/lib/planner/quick-start';
import { cn } from '@/lib/utils';
import type { PlannerMenuRegion } from '@/lib/navigation/planner-menu';

/** What the planner band draws; the header resolves all three. */
interface PlannerMenuPanelProps {
  /** The day planner's page, locale-relative; the header derives it for the sheet too. */
  dayPlannerHref: string;
  regions: PlannerMenuRegion[];
  parks: PlannerQuickStart[];
}

/** The quiet pill over a picture: the outline button on a frosted ground. */
const PILL_QUIET = `${PILL} border-border/60 bg-background/75 hover:border-primary backdrop-blur-sm dark:bg-background/75`;

/**
 * Columns of the region row from two regions on: one each up to four, then rows of four, on the
 * header's own width (`@container`). The band opens from a 1024 px bar; narrower, as the fixture
 * draws it (`scripts/shoot-planner-regions.mjs`), the row keeps two to a line rather than squeeze
 * three or four names into a third of a phone.
 */
const REGION_COLUMNS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 @min-[1024px]:grid-cols-3',
};
const REGION_COLUMNS_MANY = 'grid-cols-2 @min-[1024px]:grid-cols-4';

/**
 * A tile's height by how many share the row: a wider tile gets taller, so the scene (2 : 1, cut
 * to fill) keeps Parky's wheel and the shore in view, as the four-region draft's tiles do.
 */
const TILE_HEIGHT: Record<number, string> = {
  2: 'h-44 @min-[768px]:h-60',
  3: 'h-44 @min-[1024px]:h-52',
};
const TILE_HEIGHT_MANY = 'h-44';

/**
 * The planner band: the trip planner per region, the day planner, and the locale's popular parks
 * as quick starts into the day planner. One region is a large card beside the day planner and the
 * parks; from two on, the regions are a row of smaller cards over the other two, as in the draft's
 * four-region layout. Everything here is in every page's HTML (`hidden`, NavMenu rule 1); a
 * region's scene, the drawn day and the plan's own day render from the first opening. The data and
 * the click behaviour live elsewhere (`lib/trip-regions/registry.ts`,
 * `lib/navigation/planner-menu.ts`, `lib/planner/quick-start.ts`). Memoised for the same reason as
 * `ParksMenuPanel`. See docs/features/header-navigation.md.
 */
export const PlannerMenuPanel = memo(function PlannerMenuPanel({
  dayPlannerHref,
  regions,
  parks,
}: PlannerMenuPanelProps) {
  const t = useTranslations('navigation');

  const dayPlanner = (
    <div data-menu-stagger className="min-w-0">
      <MenuSectionHeading label={t('planner')} />
      <DayPlannerCard href={dayPlannerHref} />
    </div>
  );
  const quickStarts = (layout: QuickStartLayout) =>
    parks.length > 0 && (
      <div data-menu-stagger className="min-w-0">
        <MenuSectionHeading label={t('planDayIn')} />
        <QuickStartList parks={parks} layout={layout} />
      </div>
    );

  if (regions.length > 1) {
    return (
      <div className="flex flex-col gap-5">
        <section data-menu-stagger>
          <MenuSectionHeading
            label={t('tripPlanner')}
            count={regions.length}
            aside={
              <span className="text-muted-foreground min-w-0 truncate text-xs">
                {t('tripPlannerHint')}
              </span>
            }
          />
          <div className={cn('grid gap-3', REGION_COLUMNS[regions.length] ?? REGION_COLUMNS_MANY)}>
            {regions.map((region) => (
              <RegionTile
                key={region.id}
                region={region}
                height={TILE_HEIGHT[regions.length] ?? TILE_HEIGHT_MANY}
              />
            ))}
          </div>
        </section>
        <div className="grid grid-cols-1 gap-y-5 @min-[768px]:grid-cols-12 @min-[768px]:gap-x-8">
          <div className="min-w-0 @min-[768px]:col-span-7">{dayPlanner}</div>
          <div className="min-w-0 @min-[768px]:col-span-5">{quickStarts('narrow')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-x-8">
      {regions.length === 1 && (
        <section data-menu-stagger className="col-span-7 flex min-w-0 flex-col">
          <MenuSectionHeading label={t('tripPlanner')} />
          <RegionCard region={regions[0]} />
        </section>
      )}
      <section
        className={cn(
          'flex min-w-0 flex-col gap-5',
          regions.length === 1 ? 'col-span-5' : 'col-span-12'
        )}
      >
        {dayPlanner}
        {quickStarts('pairs')}
      </section>
    </div>
  );
});

/**
 * How the quick starts sit: two columns of six (`pairs`, beside the one region's card), or under a
 * row of regions one column of four below a 1280 px bar and two of six from there (`narrow`), so a
 * name like „LEGOLAND Deutschland" is not cut in the narrower column.
 */
type QuickStartLayout = 'pairs' | 'narrow';

/** The parks a one-column list shows; the rest wait for the two columns from a 1280 px bar. */
const NARROW_QUICK_STARTS = 4;

/** The quick starts: each the park's page, a plain click starting the planner on it. */
function QuickStartList({
  parks,
  layout,
}: {
  parks: PlannerQuickStart[];
  layout: QuickStartLayout;
}) {
  const t = useTranslations('navigation');
  const tGeo = useTranslations('geo');
  const locale = useLocale();
  const narrow = layout === 'narrow';
  return (
    <ul
      aria-label={t('planDayInList')}
      className={
        narrow
          ? 'grid grid-cols-1 gap-x-5 gap-y-0.5 @min-[1280px]:grid-cols-2'
          : 'grid grid-cols-2 gap-x-5 gap-y-0.5'
      }
    >
      {parks.map((park, i) => (
        <li
          key={park.href}
          className={cn('min-w-0', narrow && i >= NARROW_QUICK_STARTS && '@max-[1280px]:hidden')}
        >
          <Link
            href={park.href as '/'}
            prefetch={false}
            onClick={quickStartClick(park, 'menu-park')}
            className="group hover:bg-muted/60 focus-visible:ring-ring -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {/* The park mark rather than a photo: few of these parks have one, and a row of
                photos with gaps reads as loading. The hue follows the slug. */}
            <span className="relative block size-9 shrink-0 overflow-hidden rounded-md">
              <BlogCoverFallback slug={park.slug} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-foreground block truncate text-[13px] font-semibold">
                {park.name}
              </span>
              <span className="text-muted-foreground block truncate text-[11px]">
                {[park.city, park.countrySlug && translateCountry(tGeo, park.countrySlug, locale)]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <CalendarPlus
              className="text-primary/70 group-hover:text-primary size-3.5 shrink-0"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * A region's facts, the chips under its name: how many parks it plans, where the API has said, and
 * the longest trip.
 */
function useRegionFacts(region: PlannerMenuRegion): string[] {
  const t = useTranslations('navigation');
  return [
    ...(region.parkCount !== null ? [t('tripParks', { count: region.parkCount })] : []),
    t('tripMaxDays', { days: region.maxDays }),
  ];
}

/**
 * The one region's trip planner: its scene filling the card, and on the left, over a fade into the
 * band, where it is, its name, one line, two facts and the two ways in. The card is the trip
 * planner's link (the first pill stretches over it); the crowd calendar is the second pill, above
 * that cover. `isolate` keeps the picture's `-z-10` inside the card.
 */
function RegionCard({ region }: { region: PlannerMenuRegion }) {
  const t = useTranslations('navigation');
  const facts = useRegionFacts(region);
  return (
    <div className={cn(REGION_CARD, 'h-[21rem] shadow-lg')}>
      <div className="absolute inset-0 -z-10">
        <PlannerRegionArt regionId={region.id} photo={region.photo} />
      </div>
      <span
        aria-hidden="true"
        className="from-background/95 via-background/70 absolute inset-y-0 left-0 -z-10 w-[64%] bg-gradient-to-r via-55% to-transparent"
      />
      <div className="ml-6 flex h-full w-[48%] flex-col justify-center gap-1.5">
        <span className={REGION_KICKER}>{region.area}</span>
        <span className="text-foreground text-4xl leading-none font-bold tracking-tight">
          {region.name}
        </span>
        <span className="text-foreground/80 text-sm">{t('tripPlannerHint')}</span>
        <span className="mt-1 flex flex-wrap gap-1.5">
          {facts.map((fact) => (
            <span
              key={fact}
              className="border-border/60 bg-background/60 text-foreground/85 rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
            >
              {fact}
            </span>
          ))}
        </span>
        <span className="mt-3 flex flex-wrap items-center gap-3">
          <Link
            href={region.href as '/'}
            prefetch={false}
            {...buttonLinkProps({
              withIcon: true,
              className: cn(PILL, 'px-4 shadow-md after:absolute after:inset-0'),
            })}
          >
            {t('planTrip')}
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link
            href={region.calendarHref as '/'}
            prefetch={false}
            {...buttonLinkProps({
              variant: 'outline',
              withIcon: true,
              className: cn(PILL_QUIET, 'relative z-10 text-xs'),
            })}
          >
            <CalendarDays aria-hidden="true" />
            {t('crowdCalendar')}
          </Link>
        </span>
      </div>
    </div>
  );
}

/**
 * A region as one of several, from the four-region design: the scene above, and over a fade at its
 * foot where it is, its name and an arrow; the line every region shares („Welcher Park an welchem
 * Tag") stands once on the row's heading. A long name takes two balanced lines rather than being
 * cut: at a 1024 px bar a tile has 173 px beside the arrow, and "Southern California" needs 190.
 * The fade covers half the tile, so a scene's props under the text stay texture. The whole tile is
 * the trip planner's link; the crowd calendar is the large card's and the hub's. The homepage's
 * region stop draws the same tile with the scene a page loads (`art`).
 */
export function RegionTile({
  region,
  height,
  art,
}: {
  region: PlannerMenuRegion;
  height: string;
  /** The picture where the tile stands outside the band; in the band, the band's scene. */
  art?: React.ReactNode;
}) {
  return (
    <Link
      href={region.href as '/'}
      prefetch={false}
      className={cn(
        REGION_CARD,
        'focus-visible:ring-ring block focus-visible:ring-2 focus-visible:outline-none',
        height
      )}
    >
      <span className="absolute inset-0 -z-10">
        {art ?? <PlannerRegionArt regionId={region.id} photo={region.photo} />}
      </span>
      <span
        aria-hidden="true"
        className="from-background/95 via-background/70 absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t via-45% to-transparent"
      />
      <span className="absolute right-3 bottom-3 left-3.5 flex items-end justify-between gap-2">
        <span className="min-w-0">
          <span className={cn(REGION_KICKER, 'block text-[10px]')}>{region.area}</span>
          <span className="text-foreground block text-xl leading-[1.1] font-bold text-balance break-words hyphens-auto">
            {region.name}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full"
        >
          <ArrowRight className="size-4" />
        </span>
      </span>
    </Link>
  );
}

/**
 * The day planner's card. Without a plan (and on the server): what it does, a drawn day for a
 * picture, and „Tag planen" into the planner page's start. With one, read from this browser after
 * hydration: the next planned day's park and date, its rides and hours, its blocks on the strip,
 * how many days are planned, „Meinen Plan öffnen" on the open signal and „Neuer Tag" into the
 * page's start. The band is hidden on the first paint, so the swap shifts nothing on screen.
 */
function DayPlannerCard({ href }: { href: string }) {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const plan = usePlanSummary();
  const opened = useMenuBandOpened();
  const startHref = `${href}#${PLANNER_START_ID}`;

  return (
    <div className="border-border/60 bg-card/50 rounded-xl border p-4">
      {plan ? (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <div className="text-primary-ink text-[11px] font-semibold tracking-wide uppercase">
                {t('yourPlan')}
              </div>
              <div className="text-foreground mt-0.5 truncate text-sm font-semibold">
                {plan.park} · {formatPlanDay(plan.date, locale)}
              </div>
            </div>
            <span className="text-muted-foreground shrink-0 text-[11px]">
              {t('plannedDays', { count: plan.days })}
            </span>
          </div>
          <PlanDayStrip plan={plan} locale={locale} enabled={opened} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => plannerUi.requestOpen('menu-plan')}
              className={cn(PILL, 'text-xs shadow-md')}
            >
              <CalendarClock aria-hidden="true" />
              {t('openMyPlan')}
            </Button>
            <Link
              href={startHref as '/'}
              prefetch={false}
              {...buttonLinkProps({
                variant: 'outline',
                size: 'sm',
                withIcon: true,
                className: cn(PILL_QUIET, 'text-xs'),
              })}
            >
              <CalendarPlus aria-hidden="true" />
              {t('newDay')}
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
            <CalendarClock className="text-primary size-4 shrink-0" aria-hidden="true" />
            {t('dayPlannerTitle')}
          </div>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">{t('dayPlannerHint')}</p>
          <DrawnDayStrip locale={locale} shown={opened} />
          <div className="mt-3">
            <Link
              href={startHref as '/'}
              prefetch={false}
              {...buttonLinkProps({
                size: 'sm',
                withIcon: true,
                className: cn(PILL, 'text-xs shadow-md'),
              })}
            >
              <CalendarPlus aria-hidden="true" />
              {t('planDay')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
