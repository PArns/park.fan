import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { AttractionCard } from '@/components/parks/attraction-card';
import { AttractionTypicalWaits } from '@/components/parks/attraction-typical-waits';
import { RopeDropCard } from '@/components/parks/rope-drop-card';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ComparisonBadge } from '@/components/parks/comparison-badge';
import { ParkCalendarDay } from '@/components/parks/park-calendar-day';
import { NoLiveWaitTimesNotice } from '@/components/parks/no-live-wait-times-notice';
import { HourlyP90Sparkline } from '@/components/parks/hourly-p90-sparkline';
import { getServerNowMs } from '@/lib/utils/server-time';
import {
  buildDemoFixtures,
  DEMO_CALENDAR_DAYS,
  DEMO_TIMEZONE,
  OFF_SEASON_CARD,
  TARON_HOURLY_P90,
  TARON_TYPICAL_WAITS,
  TARON_WAIT_NOW,
} from './_fixtures';

/**
 * Example UI for the guide.
 *
 * Every block below renders a **production** component with fixture props —
 * `AttractionCard`, `AttractionTypicalWaits`, `RopeDropCard`, `ParkCalendarDay`
 * and friends, the same ones a park page mounts. Nothing here redraws a
 * lookalike: a reader is being taught to read these exact cards, and a copy
 * would start lying the first time one of them is restyled.
 *
 * They also never touch the network. Each of these is prop-driven by design
 * (the fetching wrappers are `ParkStatsSection`, `ParkCalendarGrid` and so on,
 * and those are deliberately not used here), so the guide costs a park page's
 * worth of markup and zero API calls — which matters on a page linked from
 * every surface on the site.
 */

const PARK_PATH = '/parks/europe/germany/bruehl/phantasialand';
const PHOTOS: Record<string, string> = {
  taron: '/media/phantasialand/taron.jpg',
  'black-mamba': '/media/phantasialand/black-mamba.jpg',
};

/**
 * A frame around one example, so a card that looks exactly like the real thing
 * cannot be mistaken for live data. Says what to look at, and where the real
 * version of it lives.
 */
export function DemoFrame({
  label,
  note,
  href,
  hrefLabel,
  children,
  className,
}: {
  label: string;
  note?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('not-prose', className)}>
      <div className="border-border/70 rounded-2xl border border-dashed p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
            {label}
          </span>
          {href && hrefLabel && (
            <Link
              href={href}
              prefetch={false}
              className="text-primary text-xs font-medium hover:underline"
            >
              {hrefLabel}
            </Link>
          )}
        </div>
        {children}
      </div>
      {note && <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{note}</p>}
    </div>
  );
}

/**
 * The opening exhibit: the same 70 minutes, first as a sign at the entrance and
 * then as the park page renders it. Deliberately not a card on the left — a
 * sign is what the alternative actually looks like.
 */
export async function BareNumberVsCard({
  signLabel,
  signCaption,
  cardLabel,
  cardCaption,
  unit,
}: {
  signLabel: string;
  signCaption: string;
  cardLabel: string;
  cardCaption: string;
  unit: string;
}) {
  const { taron } = buildDemoFixtures(await getServerNowMs());
  return (
    <div className="not-prose grid gap-5 md:grid-cols-2">
      {/* Both halves are their own column-flex so the two captions sit on the
          same baseline whatever the card's photo row does to its height. */}
      <div className="flex flex-col">
        <div className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
          {signLabel}
        </div>
        {/* The entrance sign, near enough: black box, amber dot-matrix, one number. */}
        <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-900 shadow-inner">
          <div className="font-mono text-7xl leading-none font-bold text-amber-400 tabular-nums">
            {TARON_WAIT_NOW}
          </div>
          <div className="mt-3 font-mono text-xs tracking-[0.3em] text-amber-400/70 uppercase">
            {unit}
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{signCaption}</p>
      </div>

      <div className="flex flex-col">
        <div className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
          {cardLabel}
        </div>
        <div className="grid flex-1 [grid-template-rows:auto_2rem_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]">
          <AttractionCard
            attraction={taron}
            parkPath={PARK_PATH}
            parkStatus="OPERATING"
            backgroundImage={PHOTOS.taron}
            timezone={DEMO_TIMEZONE}
          />
        </div>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{cardCaption}</p>
      </div>
    </div>
  );
}

/** Taron's per-weekday level, as the ride page shows it. */
export function TypicalWaitsDemo({ className }: { className?: string }) {
  return <AttractionTypicalWaits typicalWaits={TARON_TYPICAL_WAITS} className={className} />;
}

/** The rope-drop panel, with the evening alternative it also carries. */
export async function RopeDropDemo({ className }: { className?: string }) {
  const { ropeDrop, closeUtc } = buildDemoFixtures(await getServerNowMs());
  return (
    <RopeDropCard
      ropeDrop={ropeDrop}
      timezone={DEMO_TIMEZONE}
      todayClosingUtc={closeUtc}
      className={className}
    />
  );
}

/**
 * Taron's day in 90th-percentile minutes per hour.
 *
 * `HourlyP90Sparkline` is the production curve (the attraction history grid
 * mounts one per day) and takes its height from the container — hence the
 * explicit `h-40`, the same arrangement `/ui` uses. The two callouts and the
 * hour ruler are the teaching part: the section's whole argument is *where* on
 * this curve the peak and the evening trough sit, and a bare line says neither.
 */
export function HourlyShapeDemo({
  peakLabel,
  troughLabel,
  unit,
}: {
  peakLabel: string;
  troughLabel: string;
  unit: string;
}) {
  const peak = TARON_HOURLY_P90.reduce((a, b) => (b.value > a.value ? b : a));
  const trough = TARON_HOURLY_P90[TARON_HOURLY_P90.length - 1];
  const first = TARON_HOURLY_P90[0];
  const span = TARON_HOURLY_P90.length - 1;
  const xOf = (hour: string) => (TARON_HOURLY_P90.findIndex((p) => p.hour === hour) / span) * 100;

  return (
    <div className="not-prose">
      {/* The height goes on the wrapper: `Sparkline` prepends its own `h-full`,
          and two height utilities on one element resolve by stylesheet order,
          not by the order they were written in. */}
      <div className="relative h-44">
        <HourlyP90Sparkline hourlyP90={TARON_HOURLY_P90} className="text-primary" />
        {/* Out of flow, so neither callout can change the figure's height. */}
        <span
          className="absolute -top-1 -translate-x-1/2 rounded-md bg-rose-500/90 px-1.5 py-0.5 text-[10px] leading-none font-semibold whitespace-nowrap text-white"
          style={{ left: `${xOf(peak.hour)}%` }}
        >
          {peakLabel} {peak.value} {unit}
        </span>
        <span className="absolute right-0 bottom-6 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] leading-none font-semibold whitespace-nowrap text-white">
          {troughLabel} {trough.value} {unit}
        </span>
      </div>
      <div className="text-muted-foreground/80 mt-1 flex justify-between text-[10px] tabular-nums">
        <span>{first.hour}</span>
        <span>{peak.hour}</span>
        <span>{trough.hour}</span>
      </div>
    </div>
  );
}

/**
 * Two rides, one minute, the same land. The reason a live number is worth
 * having at all — and the reason it is not the whole answer.
 */
export async function TwoRidesDemo() {
  const { taron, mamba } = buildDemoFixtures(await getServerNowMs());
  return (
    <div className="not-prose grid [grid-template-rows:auto_2rem_auto] gap-4 sm:grid-cols-2 sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]">
      {[taron, mamba].map((attraction) => (
        <AttractionCard
          key={attraction.id}
          attraction={attraction}
          parkPath={PARK_PATH}
          parkStatus="OPERATING"
          backgroundImage={PHOTOS[attraction.slug]}
          timezone={DEMO_TIMEZONE}
        />
      ))}
    </div>
  );
}

/** Four days of an autumn break, side by side. The real calendar cell. */
export function CalendarDaysDemo() {
  return (
    <div className="not-prose grid grid-cols-2 gap-2 sm:grid-cols-4">
      {DEMO_CALENDAR_DAYS.map((day) => (
        <ParkCalendarDay
          key={day.date}
          day={day}
          parkTimezone={DEMO_TIMEZONE}
          isToday={false}
          isBest={day.date === '2026-10-15'}
        />
      ))}
    </div>
  );
}

/**
 * The ride that is out of season, and the badge that says so in three words.
 *
 * Kept on the short row template at every width. The media database holds no
 * photo of an ice rink, and a card with no photo and no wait time takes the
 * `row-span-2` spacer — 300 px of empty grey next to two sentences of caption.
 * The badges are the whole exhibit here.
 */
export function OffSeasonDemo() {
  return (
    <div className="not-prose grid [grid-template-rows:auto_2rem_auto] sm:max-w-xs">
      <AttractionCard
        attraction={OFF_SEASON_CARD}
        parkPath={PARK_PATH}
        parkStatus="OPERATING"
        timezone={DEMO_TIMEZONE}
      />
    </div>
  );
}

/** What a park with no readable feed gets instead of invented numbers. */
export function NoWaitTimesDemo() {
  return <NoLiveWaitTimesNotice reason="in_park_app_only" scope="park" className="not-prose" />;
}

/**
 * The two badges that turn a reading into a statement. Rendered as the real
 * components so their colours match the ones on a park page exactly.
 */
export function BadgeRowDemo({ caption }: { caption: string }) {
  return (
    <div className="not-prose space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <CrowdLevelBadge level="very_low" />
        <CrowdLevelBadge level="low" />
        <CrowdLevelBadge level="moderate" />
        <CrowdLevelBadge level="high" />
        <CrowdLevelBadge level="very_high" />
        <CrowdLevelBadge level="extreme" />
        <CrowdLevelBadge level="unknown" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ComparisonBadge comparison="much_lower" />
        <ComparisonBadge comparison="lower" />
        <ComparisonBadge comparison="typical" />
        <ComparisonBadge comparison="higher" />
        <ComparisonBadge comparison="much_higher" />
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">{caption}</p>
    </div>
  );
}
