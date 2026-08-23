'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The instrument row.
 *
 * A curation admin has one question that is genuinely a number — how much of
 * the catalogue has been touched — and the honest answer to it is currently
 * "two parks of 212". A ring says that faster than a sentence, and it says it
 * without flattering: an almost-empty ring is the point.
 *
 * Three rules hold this together and are worth writing down, because they are
 * what keeps a dashboard from becoming decoration:
 *
 *  - Every tile is a link to the list it counts. A number nobody can act on is
 *    a poster.
 *  - The ring is the share, the digits are the count. Percentages alone hide
 *    that 100 % of eight rides is not an achievement.
 *  - Colour carries meaning, never mood: brand blue for coverage, amber for a
 *    backlog worth a session, red for something that is wrong.
 */

export type MetricTone = 'brand' | 'good' | 'warn' | 'bad' | 'neutral';

const TONE_STROKE: Record<MetricTone, string> = {
  brand: 'stroke-primary',
  good: 'stroke-emerald-400',
  warn: 'stroke-amber-400',
  bad: 'stroke-red-400',
  neutral: 'stroke-muted-foreground',
};

const TONE_TEXT: Record<MetricTone, string> = {
  brand: 'text-primary',
  good: 'text-emerald-400',
  warn: 'text-amber-400',
  bad: 'text-red-400',
  neutral: 'text-muted-foreground',
};

/** A ring is drawn from a dash offset, so the geometry lives here once. */
function Ring({
  share,
  tone,
  children,
}: {
  share: number;
  tone: MetricTone;
  children: React.ReactNode;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, share));

  return (
    <div className="relative h-[72px] w-[72px] shrink-0">
      <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          strokeWidth="7"
          className="stroke-muted-foreground/12"
        />
        {/* A share below about 1.5 % draws as a dot and reads as a broken
            ring rather than as a small number, so the arc keeps a minimum
            length. The digits next to it carry the exact value; this only has
            to be legible as "barely any". */}
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.max(clamped > 0 ? 0.015 : 0, clamped))}
          className={cn(TONE_STROKE[tone], 'transition-[stroke-dashoffset] duration-700')}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function MetricTile({
  href,
  icon: Icon,
  label,
  value,
  of,
  suffix,
  tone = 'brand',
  note,
  loading,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  /** The count. The ring shows it against `of`, the digits show it as it is. */
  value: number | undefined;
  of?: number;
  suffix?: string;
  tone?: MetricTone;
  note?: string;
  loading?: boolean;
}) {
  const share = of && of > 0 && value !== undefined ? value / of : 0;
  const percent = of && of > 0 && value !== undefined ? Math.round(share * 100) : null;

  return (
    <Link
      href={href}
      className="border-border/60 bg-card/60 hover:border-primary/40 group flex items-center gap-3 rounded-xl border p-3 transition-colors"
    >
      <Ring share={share} tone={tone}>
        <span className={cn('text-sm font-semibold tabular-nums', TONE_TEXT[tone])}>
          {percent === null ? <Icon className="h-4 w-4" /> : `${percent}%`}
        </span>
      </Ring>

      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground group-hover:text-foreground flex items-center gap-1.5 truncate text-xs transition-colors">
          <span
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
              tone === 'brand' && 'bg-primary/15 text-primary',
              tone === 'good' && 'bg-emerald-400/15 text-emerald-400',
              tone === 'warn' && 'bg-amber-400/15 text-amber-400',
              tone === 'bad' && 'bg-red-400/15 text-red-400',
              tone === 'neutral' && 'bg-muted-foreground/15 text-muted-foreground'
            )}
          >
            <Icon className="h-3 w-3" />
          </span>
          {label}
        </p>
        <p className="flex items-baseline gap-1">
          <span className="text-2xl leading-tight font-bold tabular-nums">
            {loading ? '—' : (value?.toLocaleString('de-DE') ?? '—')}
          </span>
          {of !== undefined && (
            <span className="text-muted-foreground text-xs tabular-nums">
              / {of.toLocaleString('de-DE')}
            </span>
          )}
          {suffix && <span className="text-muted-foreground text-xs">{suffix}</span>}
        </p>
        {note && <p className="text-muted-foreground truncate text-[11px]">{note}</p>}
      </div>
    </Link>
  );
}

/**
 * Thirty days of the admin's own work.
 *
 * Deliberately without axes. The question it answers is "did anything happen
 * lately, and when" — a grid and a y-scale would dress that up as analysis.
 * The last bar is the one that matters, so it carries the label.
 */
export function CurationTrend({
  perDay,
  loading,
}: {
  perDay: Array<{ day: string; count: number }>;
  loading?: boolean;
}) {
  const days = 30;
  const today = new Date();
  const buckets: Array<{ day: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 86_400_000);
    const key = date.toISOString().slice(0, 10);
    buckets.push({ day: key, count: perDay.find((row) => row.day === key)?.count ?? 0 });
  }

  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((sum, b) => sum + b.count, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Kuratierungen</p>
          <p className="text-muted-foreground text-xs">letzte 30 Tage</p>
        </div>
        <p className="text-2xl font-bold tabular-nums">{loading ? '—' : total}</p>
      </div>

      {/* An area, not bars. Thirty days of curation work is mostly zeroes with
          a few spikes, and a row of bars at floor height reads as missing data
          where it means "nobody edited anything that day". A line makes the
          quiet stretches part of the shape instead of a defect in it. */}
      <svg viewBox="0 0 300 64" preserveAspectRatio="none" className="mt-3 h-16 w-full">
        <defs>
          <linearGradient id="curation-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="text-primary" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" className="text-primary" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath(buckets, max)} fill="url(#curation-fill)" />
        <path
          d={linePath(buckets, max)}
          fill="none"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          className="stroke-primary"
        />
      </svg>

      <div className="text-muted-foreground mt-1 flex justify-between text-[10px] tabular-nums">
        <span>vor 30 Tagen</span>
        <span>heute</span>
      </div>
    </div>
  );
}

/**
 * What is left to do, ranked by how much of it there is.
 *
 * The share bar is against the whole catalogue, not against the biggest row —
 * "746 of 7140 rides" is the useful proportion, and normalising to the largest
 * backlog would make every list look equally urgent.
 */
/** The 30 points as an SVG polyline, in a 300×64 box. */
function points(buckets: Array<{ count: number }>, max: number): Array<[number, number]> {
  const step = buckets.length > 1 ? 300 / (buckets.length - 1) : 300;
  return buckets.map((bucket, index) => [
    index * step,
    // 4 px of headroom so a peak is not clipped by the viewBox.
    60 - (bucket.count / max) * 56,
  ]);
}

function linePath(buckets: Array<{ count: number }>, max: number): string {
  return points(buckets, max)
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
}

function areaPath(buckets: Array<{ count: number }>, max: number): string {
  return `${linePath(buckets, max)} L300,64 L0,64 Z`;
}

export function BacklogBars({
  rows,
  loading,
}: {
  rows: Array<{
    key: string;
    label: string;
    value: number;
    of: number;
    href: string;
    tone: MetricTone;
  }>;
  loading?: boolean;
}) {
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const share = row.of > 0 ? row.value / row.of : 0;
        return (
          <li key={row.key}>
            <Link href={row.href} className="group block">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="group-hover:text-primary truncate transition-colors">
                  {row.label}
                </span>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {loading ? '—' : `${row.value.toLocaleString('de-DE')} / ${row.of.toLocaleString('de-DE')}`}
                </span>
              </div>
              <div className="bg-muted-foreground/10 mt-1 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-700',
                    row.tone === 'bad' && 'bg-red-400/80',
                    row.tone === 'warn' && 'bg-amber-400/80',
                    row.tone === 'good' && 'bg-emerald-400/80',
                    row.tone === 'brand' && 'bg-primary/80',
                    row.tone === 'neutral' && 'bg-muted-foreground/40'
                  )}
                  style={{ width: `${Math.max(1.5, share * 100)}%` }}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
