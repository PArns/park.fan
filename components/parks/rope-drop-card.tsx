import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Sunrise,
  Clock,
  ChartColumn,
  TrendingDown,
  Moon,
  Info,
  CalendarDays,
  ArrowUpDown,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { GlassCard } from '@/components/common/glass-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { ParkTime } from '@/components/common/park-time';
import { cn } from '@/lib/utils';
import { ropeDropCardVariant, troughWait } from '@/lib/utils/rope-drop';
import { quietestWeekdays } from '@/lib/utils/typical-waits';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import type { RopeDropInfo, TypicalWaits } from '@/lib/api/types';

interface RopeDropCardProps {
  ropeDrop: RopeDropInfo;
  timezone: string;
  /**
   * Today's closing time (UTC ISO). Recommendations pooled from longer
   * historical days can resolve past today's closing — times after closing
   * are never shown.
   */
  todayClosingUtc?: string | null;
  /**
   * Whether any attraction in this park carries a rope-drop or evening
   * recommendation. The "no need to rush" note only makes sense as a contrast
   * to recommended neighbors — in parks without any recommendation it would
   * appear on every headliner as noise.
   */
  parkHasRecommendations?: boolean;
  /**
   * The ride's typical waits, when the page has them.
   *
   * Read by the „best time" panel only, for the quietest weekday — the one answer to the
   * chapter's own heading that survives when the recommendation itself is a no. It is the same
   * object `AttractionTypicalWaits` draws in the cell next door, so naming a day costs no second
   * request, nothing arrives after paint, and the two cannot disagree.
   */
  typicalWaits?: TypicalWaits | null;
  /**
   * Drop the card's own glass and padding.
   *
   * For a `PANEL_CELL`, which already draws the box, the padding and the hairline rules — a
   * `GlassCard` inside one is a second frame around the same content, and on the ride page it
   * was three boxes for one chapter. The tinted BORDER goes with it, so the tier the border used
   * to carry has to be legible from the badge and the icon; both already say it.
   */
  bare?: boolean;
  className?: string;
}

/**
 * Rope-drop recommendation panel for the attraction detail page. **Four** states, and the
 * component is total — it always returns an element, which its return type is what enforces
 * (see {@link ropeDropCardVariant} for the 183 empty half-cards the fourth one closes):
 *
 * * `worth` → full panel with the minutes saved by riding at park opening, the advantage window
 *   (concrete park time when the API resolved an opening time, minutes-after-open otherwise) and
 *   the quieter evening alternative when the day's trough isn't at opening.
 * * `evening` → inverse recommendation (long line right at opening, trough much later — ride
 *   late instead).
 * * `bestTime` → no recommendation anywhere in this park, so the "no need to rush" note has
 *   nothing to contrast against: the ride's own readings instead, and the quietest weekday.
 * * `note` → the muted "no need to rush" line, where neighbours in the park DO carry a
 *   recommendation and the contrast is the information.
 *
 * Server Component: only the embedded <ParkTime> islands (browser-timezone tooltip) hydrate on
 * the client.
 */
/**
 * The card's frame when it is already inside a box.
 *
 * A plain `<div>` with the `GlassCard` signature, so the three call sites below can pick their
 * frame with one ternary instead of duplicating their whole subtree. `variant` is accepted and
 * ignored — there is no glass to grade when the enclosing `PANEL_CELL` is the surface.
 */
function BareCardFrame({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { variant?: string }) {
  const { variant: _variant, ...divProps } = rest as { variant?: string };
  return (
    <div className={className} {...divProps}>
      {children}
    </div>
  );
}

/** Locale-aware weekday name for an API `dayOfWeek` (0=Sun…6=Sat). */
function weekdayName(dayOfWeek: number, locale: string): string {
  // 2024-01-07 is a Sunday; + dayOfWeek lands on the right weekday.
  const d = new Date(Date.UTC(2024, 0, 7 + dayOfWeek));
  return getDateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(d);
}

interface StatTile {
  icon: LucideIcon;
  label: string;
  value: number;
  highlight: boolean;
  /** Sign in front of the value, where the number is a difference rather than a wait. */
  prefix?: string;
}

/**
 * The three-reading grid all four panels share.
 *
 * It was written out three times before the fourth panel existed, differing only in the accent
 * of the highlighted tile — and the whole point of the "best time" panel is that it carries the
 * same weight as the recommendation it stands in for, which is a promise a fourth copy of these
 * classes cannot keep.
 *
 * The `max-[380px]:` row form is the measured one and is unchanged. The German labels do not fit
 * three-up below ~380 px: measured on the guide page the grid is 204 px at 320 (60 px a tile,
 * 36 px of content inside `p-3`) and 244 at 360, against a „Tagespeak" of ~54 px and a `text-2xl`
 * value carrying a „min" after it — at 320 all three tiles overflow their box, at 360 one does, at
 * 390 none. So the gate is the width where it actually breaks rather than `sm`, which would
 * restack the whole 390–639 px range that measures clean. Below it each tile becomes a row, label
 * left and value right, where there is nothing left to overflow.
 */
function StatTiles({ tone, stats }: { tone: 'emerald' | 'indigo' | 'primary'; stats: StatTile[] }) {
  const accent = {
    emerald: {
      box: 'border-emerald-500/30 bg-emerald-500/10',
      ink: 'text-emerald-600 dark:text-emerald-300',
    },
    indigo: {
      box: 'border-indigo-500/30 bg-indigo-500/10',
      ink: 'text-indigo-500 dark:text-indigo-300',
    },
    primary: { box: 'border-primary/30 bg-primary/10', ink: 'text-primary' },
  }[tone];

  return (
    <div className="mb-4 grid grid-cols-3 gap-3 max-[380px]:grid-cols-1 max-[380px]:gap-2">
      {stats.map(({ icon: Icon, label, value, highlight, prefix }) => (
        <div
          key={label}
          className={cn(
            'rounded-lg border p-3 text-center max-[380px]:flex max-[380px]:items-center max-[380px]:justify-between max-[380px]:gap-3 max-[380px]:px-3 max-[380px]:py-2 max-[380px]:text-left',
            highlight ? accent.box : 'border-border/50 bg-background/40'
          )}
        >
          <div
            className={cn(
              'text-muted-foreground mx-auto mb-1 flex items-center justify-center gap-1 text-xs font-medium max-[380px]:mx-0 max-[380px]:mb-0 max-[380px]:justify-start',
              highlight && accent.ink
            )}
          >
            <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
            {label}
          </div>
          <div
            className={cn(
              'text-2xl font-bold tabular-nums max-[380px]:shrink-0 max-[380px]:text-xl',
              highlight && accent.ink
            )}
          >
            {prefix}
            {value}
            <span className="text-muted-foreground ml-1 text-xs font-medium">min</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RopeDropCard({
  ropeDrop,
  timezone,
  todayClosingUtc,
  parkHasRecommendations = true,
  typicalWaits,
  bare = false,
  className,
}: RopeDropCardProps): React.ReactElement {
  const t = useTranslations('attractions.ropeDrop');
  const locale = useLocale();

  // A best-slot instant past today's closing is an artifact of recommendations
  // computed on longer historical days — suppress it rather than show a time
  // the visitor can't act on.
  const closingMs = todayClosingUtc ? Date.parse(todayClosingUtc) : NaN;
  const bestSlotPlausible =
    !ropeDrop.bestSlotUtc ||
    !Number.isFinite(closingMs) ||
    Date.parse(ropeDrop.bestSlotUtc) <= closingMs;

  const timeTag = (iso: string) => {
    const tag = () => (
      <strong className="font-bold">
        <ParkTime isoTime={iso} parkTimezone={timezone} locale={locale} showSuffix />
      </strong>
    );
    return tag;
  };

  // Offset fallback when no concrete UTC instant is available: the trough is
  // often 10+ hours after opening, so switch to hours past 2 h for readability.
  const bestSlotOffsetNode = (key: 'bestSlotOffset' | 'eveningBestOffset'): ReactNode =>
    ropeDrop.bestSlotMinutesAfterOpen >= 120
      ? t(`${key}Hours`, { hours: Math.round(ropeDrop.bestSlotMinutesAfterOpen / 60) })
      : t(key, { minutes: ropeDrop.bestSlotMinutesAfterOpen });

  const variant = ropeDropCardVariant(ropeDrop, { parkHasRecommendations });

  if (variant !== 'worth') {
    if (variant === 'evening') {
      const eveningTroughWait = troughWait(ropeDrop);

      const eveningBestNode: ReactNode = ropeDrop.bestSlotUtc
        ? eveningTroughWait != null
          ? t.rich('eveningBestAtWait', {
              wait: eveningTroughWait,
              time: timeTag(ropeDrop.bestSlotUtc),
            })
          : t.rich('eveningBestAt', { time: timeTag(ropeDrop.bestSlotUtc) })
        : bestSlotOffsetNode('eveningBestOffset');

      const eveningStats =
        eveningTroughWait != null
          ? [
              { icon: Clock, label: t('atOpening'), value: ropeDrop.openWait, highlight: false },
              {
                icon: ChartColumn,
                label: t('dayPeak'),
                value: ropeDrop.busyPeak,
                highlight: false,
              },
              { icon: Moon, label: t('eveningWait'), value: eveningTroughWait, highlight: true },
            ]
          : null;

      const EveningFrame = bare ? BareCardFrame : GlassCard;
      return (
        <EveningFrame
          variant="medium"
          className={cn(!bare && 'border-indigo-500/30', className)}
          aria-label={t('eveningTitle')}
        >
          <SectionHeading
            icon={Moon}
            iconClassName="text-indigo-400"
            title={t('eveningTitle')}
            variant="plain"
            as="h3"
            className="mb-3"
          />
          <p className="text-muted-foreground mb-3 text-sm">
            {t.rich('eveningText', {
              openWait: ropeDrop.openWait,
              busyPeak: ropeDrop.busyPeak,
              term: (chunks) => <GlossaryTermLink termId="rope-drop">{chunks}</GlossaryTermLink>,
            })}
          </p>
          {eveningStats && <StatTiles tone="indigo" stats={eveningStats} />}
          {bestSlotPlausible && (
            <p className="flex items-center gap-2 text-sm font-medium">
              <Moon className="text-muted-foreground h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span suppressHydrationWarning>{eveningBestNode}</span>
            </p>
          )}
          {ropeDrop.confidence === 'low' && (
            <p className="text-muted-foreground mt-4 flex items-center gap-1 border-t pt-3 text-xs">
              <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
              {t('confidenceLow')}
            </p>
          )}
        </EveningFrame>
      );
    }

    if (variant === 'bestTime') {
      /*
       * The chapter is called „Beste Besuchszeit planen", so it owes an answer even where the
       * recommendation is a no. What it may say is bounded by what the shell already holds, and
       * the shape of that data decided the panel — measured over the 183 rides it is drawn for:
       *
       * * The **hour** is not the answer. Only 15 of 183 have a trough that is both later than
       *   opening and shorter than the wait at opening; 146 carry a trough wait equal to the
       *   opening wait and 89 place it at opening itself. So the "quieter later" line renders on
       *   the sixth of rides where it is true and nowhere else.
       * * The **weekday** is. 122 of 183 name one or two quiet days (see `quietestWeekdays`).
       * * The **day's own spread** is real everywhere: `busyPeak − openWait` runs 0 to 50 minutes
       *   with a median of 25. That is the fact the withheld rope-drop tip was standing on, and
       *   it is the one thing every one of these rides can state.
       *
       * No sentence explains why the recommendation is missing. The threshold that decides it
       * lives in the backend, this repo cannot cite it, and a reason invented here would be the
       * kind of claim that reads as measured and is not.
       */
      const quiet = quietestWeekdays(typicalWaits?.byDayOfWeek, roundWaitTo5);
      const bestTimeTrough = troughWait(ropeDrop);
      // Only where coming back later actually buys something: later than opening AND shorter.
      const troughIsBetter =
        bestTimeTrough != null &&
        ropeDrop.bestSlotMinutesAfterOpen > 0 &&
        bestTimeTrough < ropeDrop.openWait &&
        bestSlotPlausible;

      const BestTimeFrame = bare ? BareCardFrame : GlassCard;
      return (
        <BestTimeFrame
          variant="medium"
          className={cn(!bare && 'border-primary/30', className)}
          aria-label={t('bestTimeTitle')}
        >
          <SectionHeading
            icon={Clock}
            iconClassName="text-primary"
            title={t('bestTimeTitle')}
            variant="plain"
            as="h3"
            className="mb-3"
          />
          <p className="text-muted-foreground mb-3 text-sm">
            {t('bestTimeText', { openWait: ropeDrop.openWait, busyPeak: ropeDrop.busyPeak })}
          </p>
          <StatTiles
            tone="primary"
            stats={[
              { icon: Clock, label: t('atOpening'), value: ropeDrop.openWait, highlight: false },
              {
                icon: ChartColumn,
                label: t('dayPeak'),
                value: ropeDrop.busyPeak,
                highlight: false,
              },
              {
                icon: ArrowUpDown,
                label: t('spread'),
                value: ropeDrop.savings,
                highlight: true,
              },
            ]}
          />
          <div className="space-y-1.5 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CalendarDays
                className="text-muted-foreground h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>
                {quiet
                  ? quiet.days.length === 2
                    ? t('quietDays', {
                        first: weekdayName(quiet.days[0], locale),
                        second: weekdayName(quiet.days[1], locale),
                        wait: quiet.typical,
                      })
                    : t('quietDay', {
                        day: weekdayName(quiet.days[0], locale),
                        wait: quiet.typical,
                      })
                  : t('quietDayNone')}
              </span>
            </p>
            {troughIsBetter && (
              <p className="text-muted-foreground flex items-center gap-2">
                <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span suppressHydrationWarning>
                  {ropeDrop.bestSlotUtc
                    ? t.rich('bestSlotAtWait', {
                        wait: bestTimeTrough,
                        time: timeTag(ropeDrop.bestSlotUtc),
                      })
                    : bestSlotOffsetNode('bestSlotOffset')}
                </span>
              </p>
            )}
          </div>
          {ropeDrop.confidence === 'low' && (
            <p className="text-muted-foreground mt-4 flex items-center gap-1 border-t pt-3 text-xs">
              <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
              {t('confidenceLow')}
            </p>
          )}
        </BestTimeFrame>
      );
    }

    const NoteFrame = bare ? BareCardFrame : GlassCard;

    return (
      <NoteFrame variant="light" className={cn(!bare && 'p-4', className)}>
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Sunrise className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('notWorth', { openWait: ropeDrop.openWait })}
        </p>
      </NoteFrame>
    );
  }

  // The day's absolute trough is only worth calling out when it lies outside
  // the opening advantage window (in ~69% of cases it does, often the evening).
  const showBestSlot =
    ropeDrop.bestSlotMinutesAfterOpen > ropeDrop.rideByMinutesAfterOpen && bestSlotPlausible;

  // Always-busy flagships have no real advantage window (the wait already
  // exceeds half the peak in the first 15-min bin → rideBy = 0). "Within the
  // first 0 min" reads broken — say "right at opening" instead.
  const rideAtOpening = ropeDrop.rideByMinutesAfterOpen < 15;

  const rideByNode: ReactNode = rideAtOpening
    ? ropeDrop.rideByUtc
      ? t.rich('rideAtOpeningAt', { time: timeTag(ropeDrop.rideByUtc) })
      : t('rideAtOpening')
    : ropeDrop.rideByUtc
      ? t.rich('rideWithinUntil', {
          minutes: ropeDrop.rideByMinutesAfterOpen,
          time: timeTag(ropeDrop.rideByUtc),
        })
      : t('rideWithin', { minutes: ropeDrop.rideByMinutesAfterOpen });

  const worthTroughWait = troughWait(ropeDrop);
  const bestSlotNode: ReactNode = ropeDrop.bestSlotUtc
    ? worthTroughWait != null
      ? t.rich('bestSlotAtWait', {
          wait: worthTroughWait,
          time: timeTag(ropeDrop.bestSlotUtc),
        })
      : t.rich('bestSlotAt', { time: timeTag(ropeDrop.bestSlotUtc) })
    : bestSlotOffsetNode('bestSlotOffset');

  const stats = [
    { icon: Clock, label: t('atOpening'), value: ropeDrop.openWait, highlight: false },
    { icon: ChartColumn, label: t('dayPeak'), value: ropeDrop.busyPeak, highlight: false },
    {
      icon: TrendingDown,
      label: t('savings'),
      value: ropeDrop.savings,
      highlight: true,
      prefix: '−',
    },
  ];

  const Frame = bare ? BareCardFrame : GlassCard;
  return (
    <Frame
      variant="medium"
      className={cn(!bare && 'border-emerald-500/30', className)}
      aria-label={t('title')}
    >
      <SectionHeading
        icon={Sunrise}
        iconClassName="text-emerald-500"
        title={<GlossaryTermLink termId="rope-drop">{t('title')}</GlossaryTermLink>}
        badge={
          <Badge
            className={cn(
              'font-semibold',
              ropeDrop.strength === 'high'
                ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                : 'border border-teal-500/30 bg-teal-500/15 text-teal-600 dark:text-teal-300'
            )}
          >
            {ropeDrop.strength === 'high' ? t('strengthHigh') : t('strengthModerate')}
          </Badge>
        }
        variant="plain"
        as="h3"
        className="mb-3"
      />

      <p className="text-muted-foreground mb-4 text-sm">{t('explainer')}</p>

      {/* Open wait vs day peak vs savings */}
      <StatTiles tone="emerald" stats={stats} />

      <div className="space-y-1.5 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <Sunrise className="text-muted-foreground h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span suppressHydrationWarning>{rideByNode}</span>
        </p>
        {showBestSlot && (
          <p className="text-muted-foreground flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span suppressHydrationWarning>{bestSlotNode}</span>
          </p>
        )}
      </div>

      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs">
        <span>
          {t('byDaytype', {
            weekend: ropeDrop.byDaytype.weekend.savings,
            weekday: ropeDrop.byDaytype.weekday.savings,
          })}
        </span>
        {ropeDrop.confidence === 'low' && (
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
            {t('confidenceLow')}
          </span>
        )}
      </div>
    </Frame>
  );
}
