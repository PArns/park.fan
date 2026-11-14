'use client';

import { memo, useMemo, useSyncExternalStore } from 'react';
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
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { translateCountry } from '@/lib/i18n/helpers';
import { spansFor, estimateFor } from '@/lib/planner/estimate';
import { todayInZone } from '@/lib/planner/park-time';
import { PLANNER_START_ID } from '@/lib/planner/segments';
import { plannerStore } from '@/lib/planner/store';
import {
  isPlannedDay,
  type PlannerEntry,
  type PlannerGeo,
  type PlannerState,
} from '@/lib/planner/types';
import { plannerUi } from '@/lib/planner/ui-store';
import { quickStartClick, type PlannerQuickStart } from '@/lib/planner/quick-start';
import { waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
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
 * the trip planner's link; the crowd calendar is the large card's and the hub's.
 */
function RegionTile({ region, height }: { region: PlannerMenuRegion; height: string }) {
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
        <PlannerRegionArt regionId={region.id} photo={region.photo} />
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

/** The day the band reports from this browser's plan, with what drawing it takes. */
export interface PlanSummary {
  parkSlug: string;
  park: string;
  geo: PlannerGeo;
  date: string;
  entries: PlannerEntry[];
  /** Planned days from today on, every park's in its own zone. */
  days: number;
}

/**
 * The plan the band reports: the next planned day from today on (the active one where it is
 * among them), and how many such days there are. A plan whose days are all over reports nothing.
 * `now` is the browser's clock, never the server's.
 */
export function planSummary(state: PlannerState, now: number): PlanSummary | null {
  const upcoming: { slug: string; date: string }[] = [];
  for (const park of Object.values(state.parks)) {
    const today = todayInZone(park.timezone, now);
    for (const day of Object.values(park.days)) {
      if (isPlannedDay(day) && day.date >= today)
        upcoming.push({ slug: park.slug, date: day.date });
    }
  }
  if (upcoming.length === 0) return null;
  const active = upcoming.find(
    (day) => day.slug === state.activeParkSlug && day.date === state.activeDate
  );
  const next =
    active ??
    upcoming.reduce((first, day) =>
      day.date < first.date || (day.date === first.date && day.slug < first.slug) ? day : first
    );
  const park = state.parks[next.slug];
  return {
    parkSlug: park.slug,
    park: park.name,
    geo: park.geo,
    date: next.date,
    entries: park.days[next.date].entries,
    days: upcoming.length,
  };
}

/** A planned day as `YYYY-MM-DD`, written short in the reader's language: „Sa., 21. Nov.". */
export function formatPlanDay(date: string, locale: string): string {
  return getDateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

/**
 * This browser's plan, summed up: nothing on the server and during hydration, where neither the
 * plan nor the clock is known.
 */
export function usePlanSummary(): PlanSummary | null {
  const state = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot
  );
  const now = useBrowserNow();
  return useMemo(() => (now ? planSummary(state, now.getTime()) : null), [state, now]);
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
          <PlanDayStrip plan={plan} locale={locale} />
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
          <DrawnDay locale={locale} />
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

/** A block on a strip: where it starts and ends, in park-local minutes, and how busy it is. */
interface StripBlock {
  from: number;
  to: number;
  level: keyof typeof BLOCK_INK;
}

const BLOCK_INK = {
  low: 'bg-crowd-low/15 border-crowd-low dark:bg-crowd-low/20',
  moderate: 'bg-crowd-moderate/15 border-crowd-moderate dark:bg-crowd-moderate/20',
  high: 'bg-crowd-high/20 border-crowd-high dark:bg-crowd-high/25',
  /** A block of the visitor's own, or a ride with no wait to go on. */
  none: 'bg-muted border-muted-foreground/50',
};

/**
 * A day drawn the way the planner draws one, as a strip: blocks on an hour axis, coloured by how
 * busy the hour is, a dot for each walk between them. Drawn from the band's first opening, while
 * the box it fills holds its height from the start, so neither the drawn day nor the plan's own
 * ever shifts the card. The hours follow the reader's clock (1, 2 … in English); a long day labels
 * every other hour. `aria-hidden`: what it says is in the line above it.
 */
function DayStrip({
  locale,
  from,
  to,
  blocks,
}: {
  locale: string;
  /** The axis, in park-local minutes: a whole hour before the first block to one after the last. */
  from: number;
  to: number;
  blocks: StripBlock[] | null;
}) {
  const hour = getDateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' });
  const label = (h: number) =>
    hour.formatToParts(Date.UTC(2026, 0, 1, h % 24)).find((part) => part.type === 'hour')?.value ??
    '';
  const at = (minute: number) => ((minute - from) / (to - from)) * 100;
  const hours = Array.from({ length: (to - from) / 60 - 1 }, (_, i) => from / 60 + 1 + i);
  const step = hours.length > 10 ? 2 : 1;
  return (
    <div className="relative mt-3 h-14" aria-hidden="true">
      {blocks && (
        <>
          {hours.map((h, i) => (
            <span key={h}>
              {i % step === 0 && (
                <span
                  className="text-muted-foreground absolute top-0 -translate-x-1/2 text-[10px] tabular-nums"
                  style={{ left: `${at(h * 60)}%` }}
                >
                  {label(h)}
                </span>
              )}
              <span
                className="bg-border/70 absolute top-4 bottom-0 w-px"
                style={{ left: `${at(h * 60)}%` }}
              />
            </span>
          ))}
          {blocks.map((block, i) => {
            const next = blocks[i + 1];
            return (
              <span key={`${block.from} ${i}`}>
                <span
                  className={cn(
                    'absolute top-5 h-7 rounded-[5px] border-l-2',
                    BLOCK_INK[block.level]
                  )}
                  style={{
                    left: `${at(block.from)}%`,
                    width: `calc(${at(block.to) - at(block.from)}% - 1px)`,
                  }}
                />
                {next && next.from > block.to && (
                  <span
                    className="bg-muted-foreground/40 absolute top-[2.05rem] size-1 -translate-x-1/2 rounded-full"
                    style={{ left: `${at((block.to + next.from) / 2)}%` }}
                  />
                )}
              </span>
            );
          })}
        </>
      )}
    </div>
  );
}

/** The drawn day: ten to six, eight rides between quiet and busy hours. */
const DRAWN_BLOCKS: StripBlock[] = [
  { from: 555, to: 585, level: 'low' },
  { from: 600, to: 645, level: 'low' },
  { from: 660, to: 720, level: 'moderate' },
  { from: 744, to: 816, level: 'high' },
  { from: 840, to: 876, level: 'moderate' },
  { from: 900, to: 966, level: 'high' },
  { from: 984, to: 1020, level: 'moderate' },
  { from: 1038, to: 1068, level: 'low' },
];

/** A picture of the tool, not anybody's plan, on the band's first opening. */
function DrawnDay({ locale }: { locale: string }) {
  const opened = useMenuBandOpened();
  return <DayStrip locale={locale} from={540} to={1140} blocks={opened ? DRAWN_BLOCKS : null} />;
}

/** The busyness a ride's expected wait reads as, in the strip's three inks. */
function stripLevel(wait: number | null): StripBlock['level'] {
  if (wait === null) return 'none';
  const tier = waitTimeCrowdTier(wait);
  if (tier === 'very_low' || tier === 'low') return 'low';
  if (tier === 'moderate') return 'moderate';
  return 'high';
}

/**
 * The plan's own day: its rides and hours in a line, its blocks on the strip, from the planner's
 * `/plan/day` for that park and date (the same query and cache as the panel), asked for once the
 * band has opened. Until it answers the line keeps its height with nothing in it, because the
 * hours depend on the waits.
 */
function PlanDayStrip({ plan, locale }: { plan: PlanSummary; locale: string }) {
  const t = useTranslations('navigation');
  const opened = useMenuBandOpened();
  const { data: day, isSuccess } = usePlanDay({
    ...plan.geo,
    parkSlug: plan.parkSlug,
    date: plan.date,
    enabled: opened,
  });
  const strip = useMemo(() => {
    if (!isSuccess || plan.entries.length === 0) return null;
    const sorted = [...plan.entries].sort((a, b) => a.startMinute - b.startMinute);
    const spans = spansFor(day, sorted);
    const blocks: StripBlock[] = sorted.map((entry, i) => ({
      from: spans[i].startMinute,
      to: spans[i].startMinute + spans[i].spanMinutes,
      level:
        entry.attractionSlug && !entry.custom ? stripLevel(estimateFor(day, entry).wait) : 'none',
    }));
    const first = Math.min(...blocks.map((block) => block.from));
    const last = Math.max(...blocks.map((block) => block.to));
    return {
      blocks,
      first,
      last,
      from: Math.floor(first / 60) * 60 - 60,
      to: Math.ceil(last / 60) * 60 + 60,
    };
  }, [isSuccess, day, plan.entries]);
  const rides = plan.entries.filter((entry) => entry.attractionSlug && !entry.custom).length;
  const clock = getDateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
  const time = (minute: number) => new Date(Date.UTC(2026, 0, 1, 0, minute));

  return (
    <>
      <div className="text-muted-foreground min-h-4 text-xs tabular-nums">
        {strip &&
          `${t('planRides', { count: rides })} · ${clock.formatRange(time(strip.first), time(strip.last))}`}
      </div>
      <DayStrip
        locale={locale}
        from={strip?.from ?? 540}
        to={strip?.to ?? 1140}
        blocks={strip?.blocks ?? null}
      />
    </>
  );
}
