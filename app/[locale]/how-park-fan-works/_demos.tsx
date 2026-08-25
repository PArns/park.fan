import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import {
  ParkHourlyProfileCard,
  type HourlyProfileLabels,
} from '@/components/parks/park-hourly-profile-card';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { cn } from '@/lib/utils';
import { AttractionCard } from '@/components/parks/attraction-card';
import { AttractionTypicalWaits } from '@/components/parks/attraction-typical-waits';
import { RopeDropCard } from '@/components/parks/rope-drop-card';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ComparisonBadge } from '@/components/parks/comparison-badge';
import { ParkCalendarDay } from '@/components/parks/park-calendar-day';
import { NoLiveWaitTimesNotice } from '@/components/parks/no-live-wait-times-notice';
import { getServerNowMs } from '@/lib/utils/server-time';
import { getAttractionBackgroundImage, getCardObjectPosition } from '@/lib/utils/park-assets';
import { WaitSign } from './_chrome';
import {
  buildDemoFixtures,
  DEMO_CALENDAR_DAYS,
  DEMO_TIMEZONE,
  OFF_SEASON_CARD,
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
 * Most of them never touch the network: the teaching figures are prop-driven so
 * the lesson holds still, because chapter 02's three steps are written around
 * specific readings. The two exceptions are at the bottom of this file and are
 * marked as such — where the point is "this is running right now", a frozen
 * copy would be the wrong exhibit.
 */

const PARK_PATH = '/parks/europe/germany/bruehl/phantasialand';
const DEMO_PARK = 'phantasialand';

/**
 * The card's photo through the media database, never a path typed out here.
 *
 * A literal `/media/phantasialand/taron.jpg` renders a different crop from the one
 * a park page shows: the sidecar's focal point drives `object-position` (Taron sits
 * at 0.55/0.58, Black Mamba at 0.5/0.38) and the `?v=` content hash is what lets a
 * retargeted focal point invalidate an unchanged URL. This page's whole claim is
 * that the card looks the same an hour later in the park.
 */
function photoProps(rideSlug: string) {
  return {
    backgroundImage: getAttractionBackgroundImage(DEMO_PARK, rideSlug),
    objectPosition: getCardObjectPosition(DEMO_PARK, rideSlug),
  };
}

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
      {/* Same edges as the frame above it and as every paragraph around it —
          the page runs one column at full width, so a capped caption would be
          the only element on it with a right edge of its own. */}
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
            timezone={DEMO_TIMEZONE}
            {...photoProps(taron.slug)}
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
 * Two rides, one minute, the same land. The reason a live number is worth
 * having at all — and the reason it is not the whole answer.
 */
export async function TwoRidesDemo() {
  const { taron, mamba } = buildDemoFixtures(await getServerNowMs());
  return (
    // One row template PER CARD, never one shared by both. `AttractionCard` is
    // `row-span-3` + subgrid, so two of them in a single three-row grid put the
    // second on implicit `auto` rows: measured at 390 px the shared version gave
    // card 1 the 32 px spacer row and card 2 a 0 px one, and its panels' -mb-4 /
    // -mt-4 then closed over each other. Same shape as the blog widgets.
    <div className="not-prose grid gap-4 sm:grid-cols-2">
      {[taron, mamba].map((attraction) => (
        <div
          key={attraction.id}
          className="grid h-full [grid-template-rows:auto_2rem_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]"
        >
          <AttractionCard
            attraction={attraction}
            parkPath={PARK_PATH}
            parkStatus="OPERATING"
            timezone={DEMO_TIMEZONE}
            {...photoProps(attraction.slug)}
          />
        </div>
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
 *
 * Each row is labelled, because unlabelled the block is an inventory of chips:
 * a reader cannot tell that the first row rates the park against every park and
 * the second rates a ride against itself. The labels are props rather than a
 * sentence in the caption, so the copy never has to say "the upper row".
 */
export function BadgeRowDemo({
  caption,
  crowdLabel,
  comparisonLabel,
}: {
  caption: string;
  /** Names the first row, e.g. "Auslastung: wie voll ist es". */
  crowdLabel: string;
  /** Names the second row, e.g. "Vergleich: voller als sonst?". */
  comparisonLabel: string;
}) {
  return (
    <div className="not-prose space-y-3">
      <div className="text-muted-foreground/80 text-[11px] font-semibold tracking-wide uppercase">
        {crowdLabel}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CrowdLevelBadge level="very_low" />
        <CrowdLevelBadge level="low" />
        <CrowdLevelBadge level="moderate" />
        <CrowdLevelBadge level="high" />
        <CrowdLevelBadge level="very_high" />
        <CrowdLevelBadge level="extreme" />
        <CrowdLevelBadge level="unknown" />
      </div>
      <div className="text-muted-foreground/80 pt-1 text-[11px] font-semibold tracking-wide uppercase">
        {comparisonLabel}
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

// ── Live blocks ──────────────────────────────────────────────────────────────
//
// The blocks above teach with frozen numbers, because chapter 02's three steps
// are written around specific readings and a lesson that reshapes itself
// overnight is not a lesson. These two are the opposite case: their whole point
// is that the thing being described is running right now, so they mount the
// real fetching components and show whatever the park's data says today.
//
// Both are safe to mount outside a park page. `useLoadLast` gates the heavy
// trip-planning queries behind a network-idle window and releases within ~300 ms
// here (nothing else on this page fetches), and `ParkStatsSection` already
// supports a caller with no park object — that is how the blog widgets use it.
// The prose beside them never quotes a figure they render.

const DEMO_GEO = {
  continent: 'europe',
  country: 'germany',
  city: 'bruehl',
  parkSlug: 'phantasialand',
} as const;

/** The park's real hourly table: one row per ride, each ride's peak hour bold. */
export async function LiveHourlyProfile({ locale }: { locale: Locale }) {
  const [t, tOverview] = await Promise.all([
    getTranslations({ locale, namespace: 'parks.stats' }),
    getTranslations({ locale, namespace: 'parks.overview' }),
  ]);
  const labels: HourlyProfileLabels = {
    title: t('hourlyProfileTitle'),
    ride: t('rideWaitsRide'),
    hour: t('hourlyProfileHour'),
    minutes: tOverview('minutesUnit'),
    peakNote: t('hourlyProfilePeakNote'),
    footnote: t('hourlyProfileFootnote'),
  };
  return (
    <ParkHourlyProfileCard
      {...DEMO_GEO}
      basePath={PARK_PATH}
      labels={labels}
      locale={locale}
      topN={6}
    />
  );
}

/** The park's real ranking: rank, ride, the live wait where there is one, typical and busy. */
export function LiveTopAttractions({ locale }: { locale: Locale }) {
  return <ParkStatsSection {...DEMO_GEO} locale={locale} show={['attractions']} hideHeading />;
}
