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
import { WaitSign } from './_chrome';
import {
  buildDemoFixtures,
  DEMO_CALENDAR_DAYS,
  DEMO_TIMEZONE,
  OFF_SEASON_CARD,
  HOURLY_SHAPES,
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
        {/* The same sign the hero shows, so the page opens and re-opens on one
            object rather than two panels that merely resemble each other. */}
        <div className="flex min-h-[220px] flex-1 items-center justify-center">
          <WaitSign value={TARON_WAIT_NOW} unit={unit} size="md" className="w-full" />
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
 * The same day at two rides, as a pair of curves.
 *
 * `HourlyP90Sparkline` is the production line (the attraction history grid
 * mounts one per day) and takes its height from its container — hence the
 * explicit box, the same arrangement `/ui` uses. The spread label under each is
 * the whole comparison: one ride's queue moves by a few minutes across the day,
 * the other's by more than half.
 */
export function HourlyShapeDemo({
  spreadLabel,
  unit,
  hoursLabel,
}: {
  spreadLabel: string;
  unit: string;
  hoursLabel: string;
}) {
  // One scale for both charts. Each sparkline otherwise fits its own maximum,
  // which draws a 7-minute band with the same amplitude as a 22-minute one and
  // inverts the comparison this figure exists to make.
  const sharedMax = Math.max(...HOURLY_SHAPES.flatMap((s) => s.points.map((p) => p.value)));
  return (
    <div className="not-prose grid gap-5 sm:grid-cols-2">
      {HOURLY_SHAPES.map((s) => {
        const lo = Math.min(...s.points.map((p) => p.value));
        const hi = Math.max(...s.points.map((p) => p.value));
        return (
          <figure key={s.name} className="bg-card/60 rounded-xl border p-4">
            <figcaption className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">{s.name}</span>
              <span className="text-muted-foreground text-[11px] tabular-nums">
                {lo}–{hi} {unit}
              </span>
            </figcaption>
            <div className="h-28">
              <HourlyP90Sparkline hourlyP90={s.points} yMax={sharedMax} className="text-primary" />
            </div>
            <div className="text-muted-foreground/80 mt-1 flex justify-between text-[10px] tabular-nums">
              {s.points.map((p) => (
                <span key={p.hour}>{p.hour.slice(0, 2)}</span>
              ))}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              {spreadLabel} <strong className="text-foreground tabular-nums">{s.spread}</strong>{' '}
              {unit}
            </p>
          </figure>
        );
      })}
      <p className="text-muted-foreground text-xs leading-relaxed sm:col-span-2">{hoursLabel}</p>
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
