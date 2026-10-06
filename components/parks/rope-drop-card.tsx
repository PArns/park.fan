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
import { ropeDropCardVariant, ropeDropDisplayWaits } from '@/lib/utils/rope-drop';
import { quietestWeekdays } from '@/lib/utils/typical-waits';
import { roundWaitTo5, roundWaitDeltaTo5 } from '@/lib/utils/wait-time';
import { weekdayName } from '@/lib/utils/intl-format';
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
   * Whether any attraction in this park carries a rope-drop or evening recommendation. It decides
   * only whether the `bestTime` panel prints the "no need to rush" note, which makes sense only as
   * a contrast to recommended neighbours.
   */
  parkHasRecommendations?: boolean;
  /**
   * The ride's typical waits, when the page has them, read by the `bestTime` panel for the quietest
   * weekday: the one answer to the chapter's heading that survives a no. The same object
   * `AttractionTypicalWaits` draws next door, so it costs no request. `quietestWeekdays` carries
   * the rules that keep the sentence and the bars in agreement, and the sentence's adverb
   * („normalerweise") matches the card's P50 label in all six locales.
   */
  typicalWaits?: TypicalWaits | null;
  /**
   * Drop the card's own glass and padding, for a `PANEL_CELL` that already draws the box. The
   * tinted border goes too, so the tier must be legible from the badge and the icon, which both say
   * it.
   */
  bare?: boolean;
  className?: string;
}

/**
 * The card's frame when it is already inside a box: a plain `<div>` with the `GlassCard` signature,
 * so the call sites pick their frame with one ternary. `variant` is accepted and ignored.
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

interface StatTile {
  icon: LucideIcon;
  label: string;
  value: number;
  highlight: boolean;
  /** Sign in front of the value, where the number is a difference rather than a wait. */
  prefix?: string;
}

/**
 * The three-reading grid all three panels share, so the `bestTime` panel carries the same weight as
 * the recommendation it stands in for.
 *
 * Below 380 px of row each tile becomes a row, label left and value right. Measured on the
 * `@container/stattiles` wrapper, not the window, because the tiles sit in a `PANEL_CELL` whose
 * width does not follow the window. Above it every label must fit one line: a tile has 93 px inside
 * `p-3`, a budget on the strings, so a new or retranslated label wider than that wraps again.
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
    /* The wrapper is what carries `@container`: a container query styles descendants, so the grid
       cannot be both the container and the element the query restacks. */
    <div className="@container/stattiles mb-4">
      <div className="grid grid-cols-3 gap-3 @max-[380px]/stattiles:grid-cols-1 @max-[380px]/stattiles:gap-2">
        {stats.map(({ icon: Icon, label, value, highlight, prefix }) => (
          <div
            key={label}
            className={cn(
              'rounded-lg border p-3 text-center @max-[380px]/stattiles:flex @max-[380px]/stattiles:items-center @max-[380px]/stattiles:justify-between @max-[380px]/stattiles:gap-3 @max-[380px]/stattiles:px-3 @max-[380px]/stattiles:py-2 @max-[380px]/stattiles:text-left',
              highlight ? accent.box : 'border-border/50 bg-background/40'
            )}
          >
            <div
              className={cn(
                'text-muted-foreground mx-auto mb-1 flex items-center justify-center gap-1 text-xs font-medium @max-[380px]/stattiles:mx-0 @max-[380px]/stattiles:mb-0 @max-[380px]/stattiles:justify-start',
                highlight && accent.ink
              )}
            >
              <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
              {label}
            </div>
            <div
              className={cn(
                'text-2xl font-bold tabular-nums @max-[380px]/stattiles:shrink-0 @max-[380px]/stattiles:text-xl',
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
    </div>
  );
}

/**
 * Ride page card on when to ride: the minutes saved at park opening (`worth`), a later evening
 * trough (`evening`), or the ride's own readings and quietest weekday (`bestTime`). Always
 * returns an element; `ropeDropCardVariant` picks the state.
 */
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

  const variant = ropeDropCardVariant(ropeDrop);

  /*
   * Every wait this card prints, rounded once for the whole card. The raw block stays for the gates
   * that must not move onto the five-minute grid (`ropeDropCardVariant`) and for the offsets from
   * opening below, which are not waits.
   */
  const shown = ropeDropDisplayWaits(ropeDrop);

  if (variant !== 'worth') {
    if (variant === 'evening') {
      const eveningTroughWait = shown.trough;

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
              { icon: Clock, label: t('atOpening'), value: shown.openWait, highlight: false },
              {
                icon: ChartColumn,
                label: t('dayPeak'),
                value: shown.busyPeak,
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
              openWait: shown.openWait,
              busyPeak: shown.busyPeak,
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

    /*
     * The chapter is called „Beste Besuchszeit planen", so it owes an answer even when the
     * recommendation is a no, from what the shell already holds. The hour is rarely the answer (few
     * rides have a trough both later and shorter than the opening wait), so the "quieter later"
     * line renders only where it is true. The weekday usually is, and the day's own spread is real
     * for every ride.
     *
     * No sentence explains why the recommendation is missing: the threshold lives in the backend,
     * and a reason invented here would read as measured when it is not.
     */
    const quiet = quietestWeekdays(typicalWaits, roundWaitTo5);
    /*
     * Displayed, so rounded, like the weekday sentence under these tiles and the chart next door;
     * raw, the panel could read 23 beside „ca. 25 Min.". From the shared `shown`, so this trough
     * and the `worth` panel's best slot are one value rounded once.
     */
    const { openWait, busyPeak, trough: bestTimeTrough } = shown;
    /*
     * Only where coming back later buys something: later than opening and shorter. Tested on the
     * rounded figures, the two the reader compares; `roundWaitTo5` is monotone, so that is also the
     * stricter test.
     */
    const troughIsBetter =
      bestTimeTrough != null &&
      ropeDrop.bestSlotMinutesAfterOpen > 0 &&
      bestTimeTrough < openWait &&
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
          {t('bestTimeText', { openWait, busyPeak })}
        </p>
        <StatTiles
          tone="primary"
          stats={[
            { icon: Clock, label: t('atOpening'), value: openWait, highlight: false },
            {
              icon: ChartColumn,
              label: t('dayPeak'),
              value: busyPeak,
              highlight: false,
            },
            {
              icon: ArrowUpDown,
              label: t('spread'),
              // Recomputed rather than read from `savings`, so the tile is the arithmetic of the
              // two rounded numbers in the sentence above it. `savings` is a stored column, and
              // stale rows carry database defaults.
              value: busyPeak - openWait,
              highlight: true,
            },
          ]}
        />
        <div className="space-y-1.5 text-sm">
          {/* `unknown` renders no line: „Kein Wochentag sticht heraus" is a measurement and may
              only be printed where the week was measured. */}
          {quiet.verdict !== 'unknown' && (
            <p className="flex items-center gap-2 font-medium">
              <CalendarDays
                className="text-muted-foreground h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>
                {quiet.verdict === 'flat'
                  ? t('quietDayNone')
                  : quiet.days.length === 2
                    ? t('quietDays', {
                        first: weekdayName(quiet.days[0], locale),
                        second: weekdayName(quiet.days[1], locale),
                        wait: quiet.typical,
                      })
                    : t('quietDay', {
                        day: weekdayName(quiet.days[0], locale),
                        wait: quiet.typical,
                      })}
              </span>
            </p>
          )}
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
        {/* One hairline for both notes, the shape of the `worth` panel's footer. The footer says
            only what this branch knows: „not worth rope-dropping" is `worth === false`, and the
            contrast with the park's other rides is `parkHasRecommendations`. The size of the queue
            is left to the tiles, which measured it; a "manageable all day" clause would contradict
            them on the busiest rides. */}
        {(parkHasRecommendations || ropeDrop.confidence === 'low') && (
          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs">
            {parkHasRecommendations && (
              <span className="flex items-start gap-1">
                <Sunrise className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                {t('notWorth')}
              </span>
            )}
            {ropeDrop.confidence === 'low' && (
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
                {t('confidenceLow')}
              </span>
            )}
          </div>
        )}
      </BestTimeFrame>
    );
  }

  // The day's absolute trough is only worth calling out when it lies outside the opening advantage
  // window, often in the evening.
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

  const worthTroughWait = shown.trough;
  const bestSlotNode: ReactNode = ropeDrop.bestSlotUtc
    ? worthTroughWait != null
      ? t.rich('bestSlotAtWait', {
          wait: worthTroughWait,
          time: timeTag(ropeDrop.bestSlotUtc),
        })
      : t.rich('bestSlotAt', { time: timeTag(ropeDrop.bestSlotUtc) })
    : bestSlotOffsetNode('bestSlotOffset');

  const stats = [
    { icon: Clock, label: t('atOpening'), value: shown.openWait, highlight: false },
    { icon: ChartColumn, label: t('dayPeak'), value: shown.busyPeak, highlight: false },
    {
      icon: TrendingDown,
      label: t('savings'),
      // The API's stored column on the delta grid, not `busyPeak − openWait` — swapping the
      // figure for a local subtraction is out of this card's scope. The two can therefore differ
      // by five here where the `bestTime` panel's spread tile, which IS that subtraction, cannot.
      value: shown.savings,
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
          {/* Two more savings, rounded on the same delta grid as the tile above, or the footer
              would print 32 under a tile reading 30. Read here, not in `ropeDropDisplayWaits`,
              because only this panel draws them. */}
          {t('byDaytype', {
            weekend: roundWaitDeltaTo5(ropeDrop.byDaytype.weekend.savings),
            weekday: roundWaitDeltaTo5(ropeDrop.byDaytype.weekday.savings),
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
