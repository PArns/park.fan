import { getLocale, getTranslations } from 'next-intl/server';
import { ParkyBreakScene } from '@/components/assistant/parky/break-scene';
import { cn } from '@/lib/utils';
import { formatParkDay } from '@/lib/utils/park-day';
import { formatBreakCountdown, parkBreakOf, type ParkBreakFields } from '@/lib/utils/park-break';
import {
  PARK_BREAK_BORDER_CLASS,
  PARK_BREAK_ICON,
  PARK_BREAK_KICKER_CLASS,
  PARK_BREAK_PILL_CLASS,
} from '@/components/parks/park-break-style';

/** The reopening as the headline writes it: weekday, day, month and year. */
const REOPENING_DAY: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

interface ParkBreakPanelProps {
  park: ParkBreakFields;
  /** The park's own day as `YYYY-MM-DD`, computed on the server. */
  todayIso: string;
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
 * other closure with its reopening a week or more away (`parkBreakOf`). It sits where
 * `NoLiveWaitTimesNotice` sits, because it answers the question the empty live panel raises.
 *
 * A server component with no client code: the break is decided on the server from the park's own
 * day, so the panel is in the first HTML at its full height and never moves the page. Its strings
 * live in their own namespace, which reaches the browser on the homepage only, where the hero's
 * park cards draw a break too (`HeroRail`).
 *
 * Below `sm` the picture is a framed banner over the text; from `sm` it reaches the panel's top,
 * right and bottom edge and fades into the glass to its left, like the guide in a title card
 * (`WINDOW_PHOTO_BOX`).
 */
export async function ParkBreakPanel({
  park,
  todayIso,
  scope,
  rideName,
  className,
}: ParkBreakPanelProps) {
  const parkBreak = parkBreakOf(park, todayIso);
  if (!parkBreak) return null;

  const [t, locale] = await Promise.all([getTranslations('parkBreak'), getLocale()]);
  const { reopensOn, daysUntil, winter, scene } = parkBreak;
  const day = formatParkDay(locale, reopensOn, REOPENING_DAY);
  const countdown = formatBreakCountdown(locale, daysUntil);
  const date = (chunks: React.ReactNode) => <time dateTime={reopensOn}>{chunks}</time>;
  const Icon = PARK_BREAK_ICON[scene];

  return (
    <section
      role="note"
      data-nosnippet
      className={cn(
        'relative overflow-hidden rounded-xl border shadow-sm',
        PARK_BREAK_BORDER_CLASS,
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
          <p className={PARK_BREAK_KICKER_CLASS}>
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t(winter ? 'label.winter' : 'label.season')}
          </p>
          {/* A title line, not a heading, for `GlassNotice`'s reason: a note is no chapter. */}
          <p className="text-xl leading-tight font-bold text-balance sm:text-2xl lg:text-3xl">
            {t.rich(scope === 'park' ? 'reopensPark' : 'reopensRide', { day, date })}
          </p>
          <p>
            <span className={PARK_BREAK_PILL_CLASS}>{countdown}</span>
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
