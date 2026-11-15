'use client';

import { useMemo, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { estimateFor, spansFor } from '@/lib/planner/estimate';
import type { PlanSummary } from '@/lib/planner/plan-summary';
import { waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';

/** A block on a strip: where it starts and ends, in park-local minutes, and how busy it is. */
export interface StripBlock {
  from: number;
  to: number;
  level: keyof typeof STRIP_INK;
}

/** The strip's inks: a ride's busyness in three steps, and a block with no wait to go on. */
export const STRIP_INK = {
  low: 'bg-crowd-low/15 border-crowd-low dark:bg-crowd-low/20',
  moderate: 'bg-crowd-moderate/15 border-crowd-moderate dark:bg-crowd-moderate/20',
  high: 'bg-crowd-high/20 border-crowd-high dark:bg-crowd-high/25',
  /** A block of the visitor's own, or a ride with no wait to go on. */
  none: 'bg-muted border-muted-foreground/50',
};

/**
 * The strip's geometry per size: the header band's card (`sm`) and the homepage's day planner
 * (`lg`), whose strip is the picture of its stop. A walk's dot sits on the blocks' middle.
 */
const STRIP_SIZE = {
  sm: {
    box: 'mt-3 h-14',
    hour: 'text-[10px]',
    line: 'top-4',
    block: 'top-5 h-7',
    dot: 'top-[2.05rem]',
  },
  lg: {
    box: 'mt-2 h-20',
    hour: 'text-xs',
    line: 'top-5',
    block: 'top-7 h-11 rounded-md border-l-[3px]',
    dot: 'top-[3.05rem]',
  },
} as const;

/**
 * A day drawn the way the planner draws one, as a strip: blocks on an hour axis, coloured by how
 * busy the hour is, a dot for each walk between them. The box holds its height whether or not
 * there are blocks, so neither a drawn day nor a plan's own ever shifts what holds it. The hours
 * follow the reader's clock (1, 2 … in English); a long day labels every other hour.
 * `aria-hidden`: what it says is in the line above it. Each block and dot carries
 * `data-strip-block` and its place as `--strip-i`, which the homepage's fill-in reads.
 */
export function DayStrip({
  locale,
  from,
  to,
  blocks,
  size = 'sm',
}: {
  locale: string;
  /** The axis, in park-local minutes: a whole hour before the first block to one after the last. */
  from: number;
  to: number;
  blocks: StripBlock[] | null;
  size?: keyof typeof STRIP_SIZE;
}) {
  const geometry = STRIP_SIZE[size];
  const hour = getDateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' });
  const label = (h: number) =>
    hour.formatToParts(Date.UTC(2026, 0, 1, h % 24)).find((part) => part.type === 'hour')?.value ??
    '';
  const at = (minute: number) => ((minute - from) / (to - from)) * 100;
  const hours = Array.from({ length: (to - from) / 60 - 1 }, (_, i) => from / 60 + 1 + i);
  const step = hours.length > 10 ? 2 : 1;
  return (
    <div className={cn('relative', geometry.box)} aria-hidden="true">
      {blocks && (
        <>
          {hours.map((h, i) => (
            <span key={h}>
              {i % step === 0 && (
                <span
                  className={cn(
                    'text-muted-foreground absolute top-0 -translate-x-1/2 tabular-nums',
                    geometry.hour
                  )}
                  style={{ left: `${at(h * 60)}%` }}
                >
                  {label(h)}
                </span>
              )}
              <span
                className={cn('bg-border/70 absolute bottom-0 w-px', geometry.line)}
                style={{ left: `${at(h * 60)}%` }}
              />
            </span>
          ))}
          {blocks.map((block, i) => {
            const next = blocks[i + 1];
            return (
              <span key={`${block.from} ${i}`}>
                <span
                  data-strip-block=""
                  className={cn(
                    'absolute rounded-[5px] border-l-2',
                    geometry.block,
                    STRIP_INK[block.level]
                  )}
                  style={
                    {
                      left: `${at(block.from)}%`,
                      width: `calc(${at(block.to) - at(block.from)}% - 1px)`,
                      '--strip-i': i,
                    } as CSSProperties
                  }
                />
                {next && next.from > block.to && (
                  <span
                    data-strip-block=""
                    className={cn(
                      'bg-muted-foreground/40 absolute size-1 -translate-x-1/2 rounded-full',
                      geometry.dot
                    )}
                    style={
                      {
                        left: `${at((block.to + next.from) / 2)}%`,
                        '--strip-i': i + 0.6,
                      } as CSSProperties
                    }
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

/** The drawn day's axis, nine to seven, which a plan's strip also keeps until its day answers. */
const DRAWN_FROM = 540;
const DRAWN_TO = 1140;

/**
 * A picture of the tool, not anybody's plan: the drawn day on {@link DayStrip}, its blocks only
 * once `shown` (the header band draws it from its first opening).
 */
export function DrawnDayStrip({
  locale,
  shown = true,
  size,
}: {
  locale: string;
  shown?: boolean;
  size?: keyof typeof STRIP_SIZE;
}) {
  return (
    <DayStrip
      locale={locale}
      from={DRAWN_FROM}
      to={DRAWN_TO}
      blocks={shown ? DRAWN_BLOCKS : null}
      size={size}
    />
  );
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
 * A planned day's own strip: its rides and hours in a line, its blocks on {@link DayStrip}, from
 * the planner's `/plan/day` for that park and date (the same query and cache as the panel), asked
 * for once `enabled`. Until it answers the line keeps its height with nothing in it, because the
 * hours depend on the waits; where it fails, the blocks are drawn without them.
 */
export function PlanDayStrip({
  plan,
  locale,
  enabled,
  size,
}: {
  plan: PlanSummary;
  locale: string;
  enabled: boolean;
  size?: keyof typeof STRIP_SIZE;
}) {
  const t = useTranslations('navigation');
  const { data, isSuccess, isError } = usePlanDay({
    ...plan.geo,
    parkSlug: plan.parkSlug,
    date: plan.date,
    enabled,
  });
  // A day the API could not answer is drawn as one without a forecast, in the grey of a block
  // with no wait to go on, rather than left an empty box.
  const settled = isSuccess || isError;
  const day = data ?? null;
  const strip = useMemo(() => {
    if (!settled || plan.entries.length === 0) return null;
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
  }, [settled, day, plan.entries]);
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
        from={strip?.from ?? DRAWN_FROM}
        to={strip?.to ?? DRAWN_TO}
        blocks={strip?.blocks ?? null}
        size={size}
      />
    </>
  );
}
