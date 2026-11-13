import { getLocale, getTranslations } from 'next-intl/server';
import { Snowflake } from 'lucide-react';
import { ParkyWinterNap } from '@/components/assistant/parky/winter-nap';
import { cn } from '@/lib/utils';
import { getRelativeTimeFormat } from '@/lib/utils/intl-format';
import { formatParkDay, weeksUntil } from '@/lib/utils/park-day';
import type { WinterBreak } from '@/lib/utils/winter-break';

/** The reopening as the headline writes it: weekday, day, month and year. */
const REOPENING_DAY: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

interface WinterBreakPanelProps {
  /** From `winterBreakOf(park, todayIso)`. Renders nothing when null, so callers need no guard. */
  winterBreak: WinterBreak | null;
  /** Which page is asking: the park page speaks of every ride, a ride page of its own. */
  scope: 'park' | 'ride';
  /** The ride's name, on a ride page. */
  rideName?: string;
  className?: string;
}

/**
 * The yellow glass panel for a park in its winter break: the day it opens again, how many weeks
 * that is away, and Parky asleep in the snow beside it. It sits where `NoLiveWaitTimesNotice` sits,
 * because it answers the same question the empty live panel raises, and it is the first thing a
 * visitor in winter needs.
 *
 * A server component with no client code: the break is decided on the server from the park's own
 * day, so the panel is in the first HTML at its full height and never moves the page, and its
 * strings live in their own namespace that never reaches the browser (`parks` does). Yellow because
 * no other notice uses it; the frost under the tint keeps text legible over any park photo. `data-nosnippet` as on `GlassNotice`: true only this winter.
 */
export async function WinterBreakPanel({
  winterBreak,
  scope,
  rideName,
  className,
}: WinterBreakPanelProps) {
  if (!winterBreak) return null;
  const t = await getTranslations('winterBreak');
  const locale = await getLocale();

  const { reopensOn, daysUntil } = winterBreak;
  const day = formatParkDay(locale, reopensOn, REOPENING_DAY);
  const countdown = getRelativeTimeFormat(locale, { numeric: 'always' }).format(
    weeksUntil(daysUntil),
    'week'
  );
  const date = (chunks: React.ReactNode) => <time dateTime={reopensOn}>{chunks}</time>;

  return (
    <section
      role="note"
      data-nosnippet
      className={cn(
        'relative overflow-hidden rounded-xl border border-yellow-500/50 shadow-sm dark:border-yellow-300/35',
        className
      )}
    >
      <div
        className="bg-background/70 dark:bg-background/75 pointer-events-none absolute inset-0 backdrop-blur-md"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-200/75 via-yellow-100/45 to-amber-200/65 dark:from-yellow-300/25 dark:via-yellow-400/10 dark:to-amber-400/20"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-3 p-3 sm:flex-row-reverse sm:items-stretch sm:gap-0">
        <ParkyWinterNap className="aspect-[2/1] w-full rounded-lg shadow-sm ring-1 ring-white/70 sm:aspect-auto sm:min-h-40 sm:w-72 sm:shrink-0 lg:min-h-48 lg:w-96 dark:ring-white/10" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-2 pb-2 sm:py-2 sm:pr-5 sm:pl-3">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.08em] text-amber-800 uppercase dark:text-yellow-300">
            <Snowflake className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('label')}
          </p>
          {/* A title line, not a heading, for `GlassNotice`'s reason: a note is no chapter. */}
          <p className="text-xl leading-tight font-bold text-balance sm:text-2xl lg:text-3xl">
            {t.rich(scope === 'park' ? 'reopensPark' : 'reopensRide', { day, date })}
          </p>
          <p>
            <span className="inline-flex items-center rounded-full bg-yellow-300/70 px-2.5 py-0.5 text-xs font-semibold text-amber-950 ring-1 ring-yellow-600/30 dark:bg-yellow-400/20 dark:text-yellow-100 dark:ring-yellow-300/30">
              {countdown}
            </span>
          </p>
          <p className="text-foreground/80 text-sm leading-relaxed">
            {scope === 'park' ? t('park') : t('ride', { ride: rideName ?? '' })}
          </p>
        </div>
      </div>
    </section>
  );
}
