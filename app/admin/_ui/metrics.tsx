'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HealthTone } from '@/lib/admin/health';

/**
 * The overview's instruments: a card per figure with the chart that belongs to it underneath (a
 * meter, a strip of segments, a share, a line), and the small marks the area table draws. Colour
 * carries meaning only: green for fine, amber for waiting work, red for a fault, the brand blue for
 * something live.
 */

/** What a card's label colour says: nothing special, live, waiting work, or a fault. */
export type StatTone = 'neutral' | 'live' | 'warn' | 'bad';

const LABEL_TONE: Record<StatTone, string> = {
  neutral: 'text-muted-foreground',
  live: 'text-primary-ink',
  warn: 'text-amber-300',
  bad: 'text-red-400',
};

/** The fill of a bar, a segment or a dot in a health tone. */
export const HEALTH_FILL: Record<HealthTone, string> = {
  ok: 'bg-emerald-400/85',
  warn: 'bg-amber-400',
  bad: 'bg-red-500',
  unknown: 'bg-muted-foreground/35',
};

/** The text colour of a health tone. */
export const HEALTH_TEXT: Record<HealthTone, string> = {
  ok: 'text-emerald-400',
  warn: 'text-amber-300',
  bad: 'text-red-400',
  unknown: 'text-muted-foreground',
};

/**
 * A figure on the overview: icon and label, the number large with its unit, a line under it, and
 * its chart at the foot, so a row of cards lines up on the number and on the chart. The whole card
 * links to the page the figure comes from. While `loading` the number is a dash and the card keeps
 * its height.
 */
export function StatCard({
  href,
  icon: Icon,
  label,
  value,
  unit,
  note,
  tone = 'neutral',
  loading,
  children,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  note?: ReactNode;
  tone?: StatTone;
  loading?: boolean;
  /** The chart at the foot of the card. */
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group bg-card/70 relative flex min-h-[10.5rem] flex-col rounded-xl border border-white/[0.07] p-4 transition-[border-color,background-color] hover:border-white/[0.14] hover:bg-white/[0.035]"
    >
      <p className={cn('flex items-center gap-2 text-[13px] font-medium', LABEL_TONE[tone])}>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-3 flex min-w-0 items-baseline gap-1.5">
        <span className="text-[2rem] leading-none font-semibold tracking-tight tabular-nums">
          {loading ? '–' : value}
        </span>
        {unit && !loading && <span className="text-muted-foreground truncate text-sm">{unit}</span>}
      </p>
      {note && !loading && (
        <p className="text-muted-foreground mt-1.5 line-clamp-2 text-[13px] leading-snug">{note}</p>
      )}
      {children && !loading && <div className="mt-auto pt-4">{children}</div>}
    </Link>
  );
}

/** One labelled meter row: a short label, a thin bar filled to `percent`, the reading on the right. */
export function MeterRow({
  label,
  percent,
  tone,
  reading,
}: {
  label: string;
  /** 0 to 100; clamped. */
  percent: number;
  tone: HealthTone;
  reading: string;
}) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-3 text-[13px] tabular-nums">
      <span className="text-muted-foreground w-12 shrink-0 truncate">{label}</span>
      <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
        <span
          className={cn('block h-full rounded-full', HEALTH_FILL[tone])}
          // A sliver stays visible at a few percent, so "nearly nothing" does not read as "no data".
          style={{ width: `${Math.max(width, 2)}%` }}
        />
      </span>
      <span className="text-muted-foreground w-14 shrink-0 text-right">{reading}</span>
    </div>
  );
}

/** Stacked {@link MeterRow}s. */
export function Meters({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

/** A segment of a {@link SegmentBar}: one queue, one model, one check. */
export interface Segment {
  key: string;
  tone: HealthTone;
  /** Shown on hover. */
  title: string;
}

/**
 * One thin segment per member of a set, each in its own tone: fifteen queues, seven models. Reads
 * as "all green" at a glance and shows which one is not.
 */
export function SegmentBar({ segments }: { segments: readonly Segment[] }) {
  return (
    <div
      className="flex h-1.5 gap-1"
      role="img"
      aria-label={segments.map((s) => s.title).join(', ')}
    >
      {segments.map((segment) => (
        <span
          key={segment.key}
          title={segment.title}
          className={cn('h-full min-w-0 flex-1 rounded-full', HEALTH_FILL[segment.tone])}
        />
      ))}
    </div>
  );
}

const SHARE_FILL = {
  brand: 'bg-primary',
  good: 'bg-emerald-400/85',
  warn: 'bg-amber-400',
} as const;

/** A share of a whole as one track, filled from the left: parks curated of all parks. */
export function ShareTrack({
  value,
  of,
  tone = 'brand',
}: {
  value: number;
  of: number;
  tone?: keyof typeof SHARE_FILL;
}) {
  const share = of > 0 ? Math.min(1, value / of) : 0;
  return (
    <div className="flex items-center gap-3 text-[13px] tabular-nums">
      <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
        <span
          className={cn('block h-full rounded-full', SHARE_FILL[tone])}
          style={{ width: `${Math.max(share * 100, share > 0 ? 1.5 : 0)}%` }}
        />
      </span>
      <span className="text-muted-foreground shrink-0">{Math.round(share * 100)} %</span>
    </div>
  );
}

/**
 * Bars of the last minutes or days, side by side and bottom-aligned, without axes: the shape of
 * the recent past. A zero keeps a stub, so a quiet minute reads as quiet rather than missing.
 */
export function TickStrip({
  values,
  className,
}: {
  values: readonly number[];
  className?: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <div aria-hidden="true" className={cn('flex h-8 items-end gap-[3px]', className)}>
      {values.map((value, index) => (
        <span
          key={index}
          className={cn(
            'min-w-0 flex-1 rounded-[2px]',
            value > 0 ? 'bg-primary/80' : 'bg-white/[0.08]'
          )}
          style={{ height: `${value > 0 ? Math.max(12, (value / max) * 100) : 8}%` }}
        />
      ))}
    </div>
  );
}

/**
 * The last `days` days as counts, zero where `perDay` has no row, oldest first and ending on the
 * UTC day of `now`.
 */
export function dailyBuckets(
  perDay: ReadonlyArray<{ day: string; count: number }>,
  days: number,
  now: number
): number[] {
  const counts = new Map(perDay.map((row) => [row.day, row.count]));
  return Array.from({ length: days }, (_, index) => {
    const key = new Date(now - (days - 1 - index) * 86_400_000).toISOString().slice(0, 10);
    return counts.get(key) ?? 0;
  });
}

/**
 * A ring for "n of m checks passed": the arc is the share that passed, in the area's tone. The
 * figure beside it carries the count.
 */
export function CheckRing({
  passed,
  total,
  tone,
}: {
  passed: number;
  total: number;
  tone: HealthTone;
}) {
  const radius = 7;
  const circumference = 2 * Math.PI * radius;
  const share = total > 0 ? passed / total : 0;
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 shrink-0 -rotate-90">
      <circle
        cx="10"
        cy="10"
        r={radius}
        fill="none"
        strokeWidth="2.5"
        className="stroke-white/10"
      />
      <circle
        cx="10"
        cy="10"
        r={radius}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - share)}
        className={cn(
          tone === 'ok' && 'stroke-emerald-400',
          tone === 'warn' && 'stroke-amber-400',
          tone === 'bad' && 'stroke-red-500',
          tone === 'unknown' && 'stroke-muted-foreground/50'
        )}
      />
    </svg>
  );
}

/** One bar per check, in the check's tone: an area's checks at a glance, named on hover. */
export function CheckBars({
  checks,
}: {
  checks: ReadonlyArray<{ id: string; label: string; tone: HealthTone; value: string }>;
}) {
  return (
    <div className="flex h-5 items-stretch gap-[3px]">
      {checks.map((check) => (
        <span
          key={check.id}
          title={`${check.label}: ${check.value}`}
          className={cn('w-1.5 rounded-[2px]', HEALTH_FILL[check.tone])}
        />
      ))}
    </div>
  );
}
