import { getLocale, getTranslations } from 'next-intl/server';
import { Leaf, Snowflake, Sprout } from 'lucide-react';
import { ParkyBreakScene } from '@/components/assistant/parky/break-scene';
import { getBreakLookbackSeed } from '@/lib/api/integrated-calendar';
import { cn } from '@/lib/utils';
import { getRelativeTimeFormat } from '@/lib/utils/intl-format';
import { formatParkDay, weeksUntil } from '@/lib/utils/park-day';
import {
  closedDaysBefore,
  parkBreakLookback,
  parkBreakOf,
  type ParkBreakFields,
  type ParkBreakScene,
} from '@/lib/utils/park-break';

/** The reopening as the headline writes it: weekday, day, month and year. */
const REOPENING_DAY: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

/** The kicker's icon, after the picture beside it. */
const SCENE_ICON: Record<ParkBreakScene, typeof Snowflake> = {
  winter: Snowflake,
  autumn: Leaf,
  spring: Sprout,
};

interface ParkBreakPanelProps {
  park: ParkBreakFields;
  /** The park's own day as `YYYY-MM-DD`, computed on the server. */
  todayIso: string;
  /** The park's path, for the calendar days a short closure is measured with. */
  geo: { continent: string; country: string; city: string; parkSlug: string };
  /** Which page is asking: the park page speaks of every ride, a ride page of its own. */
  scope: 'park' | 'ride';
  /** The ride's name, on a ride page. */
  rideName?: string;
  className?: string;
}

/**
 * The yellow glass panel for a park in a break: the day it opens again, how many weeks that is
 * away, and Parky asleep in a picture of the season, in his sled in winter, in the leaves in
 * autumn, among the tulips in spring. „Winterpause" for the winter break, „Saisonpause" for any
 * other closure of two weeks or more (`parkBreakOf`). It sits where
 * `NoLiveWaitTimesNotice` sits, because it answers the question the empty live panel raises.
 *
 * A server component with no client code: the break is decided on the server from the park's own
 * day, so the panel is in the first HTML at its full height and never moves the page, and its
 * strings live in their own namespace that never reaches the browser (`parks` does). A closure
 * with under two weeks to go asks the calendar how long it has run already; only then does the
 * panel fetch, from a day-long cache.
 *
 * Below `sm` the picture is a framed banner over the text; from `sm` it reaches the panel's top,
 * right and bottom edge and fades into the glass to its left, like the guide in a title card
 * (`WINDOW_EDGE_MASK`).
 */
export async function ParkBreakPanel({
  park,
  todayIso,
  geo,
  scope,
  rideName,
  className,
}: ParkBreakPanelProps) {
  const lookback = parkBreakLookback(park, todayIso);
  const past = lookback
    ? await getBreakLookbackSeed(geo.continent, geo.country, geo.city, geo.parkSlug, lookback)
    : null;
  const parkBreak = parkBreakOf(park, todayIso, closedDaysBefore(past?.days, todayIso));
  if (!parkBreak) return null;

  const [t, locale] = await Promise.all([getTranslations('parkBreak'), getLocale()]);
  const { reopensOn, daysUntil, winter, scene } = parkBreak;
  const day = formatParkDay(locale, reopensOn, REOPENING_DAY);
  const countdown = getRelativeTimeFormat(locale, { numeric: 'always' }).format(
    weeksUntil(daysUntil),
    'week'
  );
  const date = (chunks: React.ReactNode) => <time dateTime={reopensOn}>{chunks}</time>;
  const Icon = SCENE_ICON[scene];

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
      <div className="relative flex flex-col gap-3 p-3 sm:flex-row-reverse sm:items-stretch sm:gap-0 sm:p-0">
        <ParkyBreakScene
          scene={scene}
          className="aspect-[2/1] w-full rounded-lg shadow-sm ring-1 ring-white/70 sm:aspect-auto sm:min-h-44 sm:w-80 sm:shrink-0 sm:rounded-none sm:[mask-image:linear-gradient(to_right,transparent,black_35%)] sm:shadow-none sm:ring-0 lg:min-h-52 lg:w-[26rem] dark:ring-white/10"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-2 pb-2 sm:py-6 sm:pr-0 sm:pl-6">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.08em] text-amber-800 uppercase dark:text-yellow-300">
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t(winter ? 'label.winter' : 'label.season')}
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
            {scope === 'park' ? t('park') : t('ride', { ride: rideName ?? '' })}{' '}
            {t(`parky.${scene}`)}
          </p>
        </div>
      </div>
    </section>
  );
}
