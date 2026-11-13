'use client';

import { memo, useMemo, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CalendarClock, CalendarDays, CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { PlannerRegionArt } from '@/components/layout/planner-region-art';
import { translateCountry } from '@/lib/i18n/helpers';
import { PLANNER_START_ID } from '@/lib/planner/segments';
import { plannerStore } from '@/lib/planner/store';
import { isPlannedDay, plannedParks, type PlannerState } from '@/lib/planner/types';
import { plannerUi } from '@/lib/planner/ui-store';
import { quickStartClick, type PlannerQuickStart } from '@/lib/planner/quick-start';
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

/** The band's two pill links, the filled one and the quiet one beside it. */
const PILL =
  'focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none';
const PILL_PRIMARY = `${PILL} bg-primary text-primary-foreground hover:bg-primary/90 shadow-md`;
const PILL_QUIET = `${PILL} border-border/60 bg-background/75 text-foreground hover:border-primary border font-medium backdrop-blur-sm`;

/**
 * The planner band: the trip planner per region (a card each, its Parky scene behind it), the day
 * planner, and the locale's popular parks as quick starts into the day planner. Everything here is
 * in every page's HTML (`hidden`, NavMenu rule 1); a region's scene alone loads on the first
 * opening. The data and the click behaviour live elsewhere (`lib/navigation/trip-regions.ts`,
 * `lib/navigation/planner-menu.ts`, `lib/planner/quick-start.ts`). Memoised for the same reason as
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

  return (
    <div className="grid grid-cols-12 gap-x-8">
      {regions.length > 0 && (
        <section data-menu-stagger className="col-span-7 flex min-w-0 flex-col">
          <MenuSectionHeading label={t('tripPlanner')} />
          <div className={cn('grid gap-3', regions.length > 1 && 'grid-cols-2')}>
            {regions.map((region) => (
              <RegionCard key={region.id} region={region} compact={regions.length > 1} />
            ))}
          </div>
        </section>
      )}

      <section
        className={cn(
          'flex min-w-0 flex-col gap-5',
          regions.length > 0 ? 'col-span-5' : 'col-span-12'
        )}
      >
        <div data-menu-stagger>
          <MenuSectionHeading label={t('dayPlanner')} />
          <DayPlannerCard href={dayPlannerHref} />
        </div>

        {parks.length > 0 && (
          <div data-menu-stagger>
            <MenuSectionHeading label={t('planDayIn')} />
            <ul aria-label={t('planDayIn')} className="grid grid-cols-2 gap-x-5 gap-y-0.5">
              {parks.map((park) => (
                <li key={park.href} className="min-w-0">
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
                        {[
                          park.city,
                          park.countrySlug && translateCountry(tGeo, park.countrySlug, locale),
                        ]
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
          </div>
        )}
      </section>
    </div>
  );
});

/**
 * One region's trip planner: its scene filling the card, and on the left, over a fade into the
 * band, where it is, its name, one line, two facts and the two ways in. The card is the trip
 * planner's link (the first pill stretches over it); the crowd calendar is the second pill, above
 * that cover. `isolate` keeps the picture's `-z-10` inside the card.
 */
function RegionCard({ region, compact }: { region: PlannerMenuRegion; compact: boolean }) {
  const t = useTranslations('navigation');
  const facts = [
    t('tripParks', { count: region.parkCount }),
    t('tripMaxDays', { days: region.maxDays }),
  ];
  return (
    <div
      className={cn(
        'group bg-muted relative isolate overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10 dark:ring-white/10',
        compact ? 'h-60' : 'h-[21rem]'
      )}
    >
      <div className="absolute inset-0 -z-10">
        <PlannerRegionArt regionId={region.id} photo={region.photo} />
      </div>
      <span
        aria-hidden="true"
        className="from-background/95 via-background/70 absolute inset-y-0 left-0 -z-10 w-[64%] bg-gradient-to-r via-55% to-transparent"
      />
      <div className="flex h-full w-[48%] flex-col justify-center gap-1.5 pl-6">
        <span className="text-primary text-[11px] font-semibold tracking-widest uppercase">
          {region.area}
        </span>
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
            className={cn(PILL_PRIMARY, 'h-9 px-4 text-sm after:absolute after:inset-0')}
          >
            {t('planTrip')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={region.calendarHref as '/'}
            prefetch={false}
            className={cn(PILL_QUIET, 'relative z-10 h-9 px-3.5 text-xs')}
          >
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {t('crowdCalendar')}
          </Link>
        </span>
      </div>
    </div>
  );
}

/** The plan the band reports: the active day where it is a planned one, else the first. */
export function planSummary(
  state: PlannerState,
  locale: string
): { park: string; date: string; days: number } | null {
  const parks = plannedParks(state.parks, locale);
  const days = parks.reduce((sum, park) => sum + park.days.length, 0);
  if (days === 0) return null;
  const active = state.activeParkSlug ? state.parks[state.activeParkSlug] : undefined;
  const activeDay = active && state.activeDate ? active.days[state.activeDate] : undefined;
  if (active && activeDay && isPlannedDay(activeDay)) {
    return { park: active.name, date: state.activeDate as string, days };
  }
  return { park: parks[0].name, date: parks[0].days[0].date, days };
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

/** This browser's plan, summed up; nothing on the server, where the plan is never known. */
export function usePlanSummary(locale: string) {
  const state = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot
  );
  return useMemo(() => planSummary(state, locale), [state, locale]);
}

/**
 * The day planner's card. Without a plan (and on the server): what it does, a drawn day for a
 * picture, and „Tag planen" into the planner page's start. With one, read from this browser after
 * hydration: the plan's park and day, how many days are planned, „Meinen Plan öffnen" on the open
 * signal and „Neuer Tag" into the page's start. The band is hidden on the first paint, so the swap
 * shifts nothing on screen.
 */
function DayPlannerCard({ href }: { href: string }) {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const plan = usePlanSummary(locale);
  const startHref = `${href}#${PLANNER_START_ID}`;

  return (
    <div className="border-border/60 bg-card/50 rounded-xl border p-4">
      {plan ? (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <div className="text-primary text-[11px] font-semibold tracking-wide uppercase">
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => plannerUi.requestOpen('menu-plan')}
              className={cn(PILL_PRIMARY, 'h-8 cursor-pointer px-3.5 text-xs')}
            >
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {t('openMyPlan')}
            </button>
            <Link
              href={startHref as '/'}
              prefetch={false}
              className={cn(PILL_QUIET, 'h-8 px-3.5 text-xs')}
            >
              <CalendarPlus className="size-3.5" aria-hidden="true" />
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
              className={cn(PILL_PRIMARY, 'h-8 px-3.5 text-xs')}
            >
              <CalendarPlus className="size-3.5" aria-hidden="true" />
              {t('planDay')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/** The drawn day's hours, 10 to 18. */
const DRAWN_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18];

/** Its blocks: where each starts and ends, as a share of the axis, and how busy the hour is. */
const DRAWN_BLOCKS = [
  [2.5, 7.5, 'low'],
  [10, 17.5, 'low'],
  [20, 30, 'moderate'],
  [34, 46, 'high'],
  [50, 56, 'moderate'],
  [60, 71, 'high'],
  [74, 80, 'moderate'],
  [83, 88, 'low'],
] as const;

const BLOCK_INK = {
  low: 'bg-crowd-low/15 border-crowd-low dark:bg-crowd-low/20',
  moderate: 'bg-crowd-moderate/15 border-crowd-moderate dark:bg-crowd-moderate/20',
  high: 'bg-crowd-high/20 border-crowd-high dark:bg-crowd-high/25',
};

/**
 * A day drawn the way the planner draws one: rides on an hour axis, coloured by how busy the hour
 * is, a dot for each walk between them. A picture of the tool, not anybody's plan, so it is
 * hidden from assistive technology. The hours follow the reader's clock (1, 2 … in English).
 */
function DrawnDay({ locale }: { locale: string }) {
  const hour = getDateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' });
  const label = (h: number) =>
    hour.formatToParts(Date.UTC(2026, 0, 1, h)).find((part) => part.type === 'hour')?.value ?? '';
  return (
    <div className="relative mt-3 h-14 opacity-80" aria-hidden="true">
      {DRAWN_HOURS.map((h, i) => {
        const left = `${(i + 1) * 10}%`;
        return (
          <span key={h}>
            <span
              className="text-muted-foreground/70 absolute top-0 -translate-x-1/2 text-[10px] tabular-nums"
              style={{ left }}
            >
              {label(h)}
            </span>
            <span className="bg-border/70 absolute top-4 bottom-0 w-px" style={{ left }} />
          </span>
        );
      })}
      {DRAWN_BLOCKS.map(([from, to, level], i) => {
        const next = DRAWN_BLOCKS[i + 1];
        return (
          <span key={from}>
            <span
              className={cn('absolute top-5 h-7 rounded-[5px] border-l-2', BLOCK_INK[level])}
              style={{ left: `${from}%`, width: `calc(${to - from}% - 1px)` }}
            />
            {next && (
              <span
                className="bg-muted-foreground/40 absolute top-[2.05rem] size-1 -translate-x-1/2 rounded-full"
                style={{ left: `${(to + next[0]) / 2}%` }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
