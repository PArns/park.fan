'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertTriangle,
  ChevronDown,
  CloudHail,
  CloudLightning,
  CloudRain,
  Wind,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { NowcastUpdateCountdown } from '@/components/parks/nowcast-update-countdown';
import { NowcastPrecipTimeline } from '@/components/parks/nowcast-precip-timeline';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { formatWindSpeed } from '@/lib/utils/temperature';
import { formatShortDuration } from '@/lib/utils/duration';
import type { WeatherNowcast } from '@/lib/api/types';

interface UseNowcastAlertParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  initialData: WeatherNowcast | null;
  /** Disable the polling query (e.g. on the /ui showcase page). */
  enabled?: boolean;
}

interface WeatherNowcastBannerProps extends UseNowcastAlertParams {
  className?: string;
}

type BannerKind = 'storm' | 'hail' | 'thunderstorm' | 'rain';

type BannerState = 'starting' | 'active';

interface BannerSpec {
  kind: BannerKind;
  state: BannerState;
  /** When the event starts. Used for "starting" state. */
  startsAt: string | null | undefined;
  /** When the event ends. Used for "active" state to show "ends in N min". */
  endsAt: string | null | undefined;
  /** Optional rain intensity (only for rain banner). */
  intensity?: 'light' | 'moderate' | 'heavy' | null;
}

const isInPast = (iso: string | null | undefined, now: number): boolean => {
  if (!iso) return false;
  const ts = Date.parse(iso);
  return !Number.isNaN(ts) && ts <= now;
};

const minutesUntil = (iso: string | null | undefined, now: number): number | null => {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.round((ts - now) / 60_000));
};

/** Park-local "HH:MM" for an end time — but only when it ends in the future AND on
 *  today's date in the park timezone (a carry-over to another day returns null). */
const endsTodayLabel = (
  iso: string | null | undefined,
  timezone: string,
  now: number,
  locale: string
): string | null => {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts) || ts <= now) return null;
  const dayKey = (ms: number) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(ms);
  if (dayKey(ts) !== dayKey(now)) return null;
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(ts);
};

/** How far ahead (minutes) to surface a rain pre-warning. Severe events
 *  (storm/hail/thunderstorm) have no gate and show as soon as they're forecast. */
const RAIN_LEAD_MINUTES = 60;

/** When a severe event (storm/hail/thunderstorm) is at most this many minutes
 *  away we escalate from a calm pre-warning to the urgent "seek shelter" wording.
 *  Beyond this lead time we keep it informational and drop the shelter advice. */
const WARNING_LEAD_MINUTES = 30;

/**
 * Pick the highest-priority warning to surface. Order (per spec):
 *  1. storm (gusts >= 75 km/h)
 *  2. hail
 *  3. thunderstorm
 *  4. rain — current or starting within RAIN_LEAD_MINUTES
 */
function pickBanner(data: WeatherNowcast, now: number): BannerSpec | null {
  if (data.stormStartsAt) {
    return {
      kind: 'storm',
      state: isInPast(data.stormStartsAt, now) ? 'active' : 'starting',
      startsAt: data.stormStartsAt,
      endsAt: data.stormEndsAt,
    };
  }
  if (data.hailStartsAt) {
    return {
      kind: 'hail',
      state: isInPast(data.hailStartsAt, now) ? 'active' : 'starting',
      startsAt: data.hailStartsAt,
      endsAt: data.hailEndsAt,
    };
  }
  if (data.thunderstormStartsAt) {
    return {
      kind: 'thunderstorm',
      state: isInPast(data.thunderstormStartsAt, now) ? 'active' : 'starting',
      startsAt: data.thunderstormStartsAt,
      endsAt: data.thunderstormEndsAt,
    };
  }

  // Live rain: the API only sets `rainStartsAt` while rain is still ahead (it's null once
  // rain is already falling), so a future start means it is NOT raining yet — no matter when
  // it ends. Without this guard, a forecast that ends hours from now reads as "raining now".
  const rainEndsTs = data.rainEndsAt ? Date.parse(data.rainEndsAt) : NaN;
  const rainStartsTs = data.rainStartsAt ? Date.parse(data.rainStartsAt) : NaN;
  const rainStartsInFuture = !Number.isNaN(rainStartsTs) && rainStartsTs > now;
  const rainEndsInFuture = !Number.isNaN(rainEndsTs) && rainEndsTs > now;

  const liveRaining = !rainStartsInFuture && (data.currentlyRaining || rainEndsInFuture);

  if (liveRaining) {
    return {
      kind: 'rain',
      state: 'active',
      startsAt: data.rainStartsAt,
      endsAt: data.rainEndsAt,
      // During active rain the API leaves rainStartsIntensity null, so prefer the
      // live currentRainIntensity to convey how hard it's actually coming down.
      intensity: data.currentRainIntensity ?? data.rainStartsIntensity,
    };
  }

  // Rain starting soon (within the pre-warning window)
  const minsToRain = minutesUntil(data.rainStartsAt, now);
  if (minsToRain !== null && minsToRain <= RAIN_LEAD_MINUTES) {
    return {
      kind: 'rain',
      state: 'starting',
      startsAt: data.rainStartsAt,
      endsAt: null,
      intensity: data.rainStartsIntensity,
    };
  }

  return null;
}

const BANNER_STYLES: Record<
  BannerKind,
  { icon: typeof CloudRain; bg: string; border: string; iconColor: string; text: string }
> = {
  storm: {
    icon: Wind,
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    border: 'border-red-500/40',
    iconColor: 'text-red-600 dark:text-red-400',
    text: 'text-red-900 dark:text-red-100',
  },
  hail: {
    icon: CloudHail,
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    border: 'border-orange-500/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
    text: 'text-orange-900 dark:text-orange-100',
  },
  thunderstorm: {
    icon: CloudLightning,
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/15',
    border: 'border-yellow-500/40',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    text: 'text-yellow-900 dark:text-yellow-100',
  },
  rain: {
    icon: CloudRain,
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    border: 'border-sky-500/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    text: 'text-sky-900 dark:text-sky-100',
  },
};

/** A nowcast warning that is due now, worded and ready to draw. */
export interface NowcastAlert {
  kind: BannerKind;
  heading: string;
  body: string;
  data: WeatherNowcast;
}

/**
 * The nowcast warning due right now, or `null` — the query, the clock, the pick and the wording,
 * without the box.
 *
 * Split out of {@link WeatherNowcastBanner} so the park header can say the same thing in one line
 * of its title row and open the full banner on a press. Both read this hook, so the one-line
 * version and the banner can never pick a different warning or word it differently.
 */
export function useNowcastAlert({
  continent,
  country,
  city,
  parkSlug,
  initialData,
  enabled = true,
}: UseNowcastAlertParams): NowcastAlert | null {
  const t = useTranslations('parks.weatherNowcast');
  const locale = useLocale();
  const { unit } = useTemperatureUnit();

  const { data } = useWeatherNowcast({
    continent,
    country,
    city,
    parkSlug,
    initialData,
    enabled,
  });

  // Live clock so countdowns recompute. Starts at 0 on BOTH the server and the hydration render
  // (a `typeof window` initializer would bake epoch-based countdown text into server-rendered
  // markup and mismatch on hydration); the effect below stamps the real time right after mount.
  const [now, setNow] = useState(0);

  // `now > 0` keeps the warning hidden until the clock mounts, so SSR and hydration agree.
  const banner = useMemo(() => (data && now > 0 ? pickBanner(data, now) : null), [data, now]);

  // No `useActiveOnScreen` here any more, and its absence is the point.
  //
  // It was left behind when the per-second tick became a flat 60-second one: nothing read its
  // `active` value, but the hook still mounted an IntersectionObserver and a `visibilitychange`
  // listener, and still called `setOnScreen`/`setTabVisible`. Every one of those re-rendered the
  // component that owns the full-bleed `backdrop-blur-md` layer below — so scrolling the banner
  // into view or switching tabs cost exactly the backdrop invalidation the tick had cost, just on
  // a different trigger. Which also fits „irregular and not reproducible" better than a timer
  // does. The interval checks `document.hidden` itself; nothing else needed it.
  useEffect(() => {
    // Deferred initial stamp (same pattern as useBrowserNow) — no synchronous
    // set-state-in-effect; the warning appears one tick after mount when applicable.
    const init = window.setTimeout(() => setNow(Date.now()), 0);
    // Sixty seconds, always. Everything derived from `now` is minute-granular — `minutesUntil`
    // rounds to whole minutes, `isInPast` and `dayKey` are coarser still — so a per-second tick
    // bought no accuracy anywhere on screen. What it bought was a re-render sixty times a minute
    // of a component that owns a full-bleed `backdrop-blur-md` layer. Chromium has to re-read what
    // is behind a backdrop filter whenever its subtree paints, so every one of those ticks was a
    // backdrop re-rasterisation; miss a frame and the blur flattens for exactly that frame, which
    // is the „Heute im Park" card going transparent for an instant, irregularly, and then sitting
    // still for seconds. The one thing that genuinely needs seconds is the mm:ss countdown, and it
    // keeps its own ticker — scoped to itself, gated on visibility, and painted in isolation.
    const id = window.setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, 60_000);
    // Re-stamp when the tab returns so countdowns don't show the pre-hide minute.
    const onVisibility = () => {
      if (!document.hidden) setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(init);
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (!data || !banner) return null;

  // Build heading + body per banner kind
  let heading: string;
  let body: string;

  switch (banner.kind) {
    case 'storm': {
      heading = t('storm.heading');
      const gusts =
        data.peakWindGustsKmh != null ? formatWindSpeed(data.peakWindGustsKmh, unit) : '?';
      if (banner.state === 'starting') {
        const mins = minutesUntil(banner.startsAt, now) ?? 0;
        const key = mins <= WARNING_LEAD_MINUTES ? 'storm.bodyInMinSoon' : 'storm.bodyInMin';
        body = t(key, { duration: formatShortDuration(mins, locale), gusts });
      } else {
        const endsIn = minutesUntil(banner.endsAt, now);
        body =
          endsIn !== null && endsIn > 0
            ? t('storm.bodyEndsInMin', { duration: formatShortDuration(endsIn, locale), gusts })
            : t('storm.bodyNow', { gusts });
      }
      break;
    }
    case 'hail': {
      heading = t('hail.heading');
      if (banner.state === 'starting') {
        const mins = minutesUntil(banner.startsAt, now) ?? 0;
        const key = mins <= WARNING_LEAD_MINUTES ? 'hail.bodyInMinSoon' : 'hail.bodyInMin';
        body = t(key, { duration: formatShortDuration(mins, locale) });
      } else {
        const endsIn = minutesUntil(banner.endsAt, now);
        body =
          endsIn !== null && endsIn > 0
            ? t('hail.bodyEndsInMin', { duration: formatShortDuration(endsIn, locale) })
            : t('hail.bodyNow');
      }
      break;
    }
    case 'thunderstorm': {
      heading = t('thunderstorm.heading');
      if (banner.state === 'starting') {
        const mins = minutesUntil(banner.startsAt, now) ?? 0;
        const key =
          mins <= WARNING_LEAD_MINUTES ? 'thunderstorm.bodyInMinSoon' : 'thunderstorm.bodyInMin';
        body = t(key, { duration: formatShortDuration(mins, locale) });
      } else {
        const endsIn = minutesUntil(banner.endsAt, now);
        body =
          endsIn !== null && endsIn > 0
            ? t('thunderstorm.bodyEndsInMin', { duration: formatShortDuration(endsIn, locale) })
            : t('thunderstorm.bodyNow');
      }
      break;
    }
    case 'rain': {
      heading = t('rain.heading');
      if (banner.state === 'starting') {
        const mins = minutesUntil(banner.startsAt, now) ?? 0;
        const intensityKey = banner.intensity ?? 'light';
        body = t('rain.bodyStartsInMin', {
          duration: formatShortDuration(mins, locale),
          intensity: t(`intensity.${intensityKey}`),
        });
      } else {
        const intensityLabel = banner.intensity ? t(`intensity.${banner.intensity}`) : null;
        // Append an absolute end time only when the rain is forecast to stop later
        // TODAY in the park's timezone; a carry-over to tomorrow stays "raining now".
        const endsAt = endsTodayLabel(banner.endsAt, data.park.timezone, now, locale);
        if (endsAt) {
          body = intensityLabel
            ? t('rain.bodyNowEndsAtIntensity', { intensity: intensityLabel, time: endsAt })
            : t('rain.bodyNowEndsAt', { time: endsAt });
        } else {
          body = intensityLabel
            ? t('rain.bodyNowIntensity', { intensity: intensityLabel })
            : t('rain.bodyNow');
        }
      }
      break;
    }
  }

  return { kind: banner.kind, heading, body, data };
}

/**
 * The warning as one line — the park header's title row carries it where the weather reading
 * otherwise sits, and a press opens the full {@link NowcastAlertBanner} under that row.
 *
 * The pill is exactly as tall as the row's own content: `py-0.5` plus the 1 px border is 6 px on
 * top of the `text-sm` line, and `-my-[3px]` hands those 6 px back. The row is what holds the
 * panel's header height, so a pill that grew it would move the whole card the moment the
 * nowcast landed — the shift this one-line form exists to avoid.
 */
export function NowcastAlertToggle({
  alert,
  expanded,
  onToggle,
  controls,
  className,
}: {
  alert: NowcastAlert;
  expanded: boolean;
  onToggle: () => void;
  /** Id of the banner the toggle opens. */
  controls: string;
  className?: string;
}) {
  const styles = BANNER_STYLES[alert.kind];
  const Icon = styles.icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controls}
      title={alert.body}
      className={cn(
        'relative -my-[3px] flex max-w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-full border py-0.5 pr-1.5 pl-2 text-sm font-medium transition-colors',
        styles.border,
        styles.bg,
        styles.text,
        'focus-visible:ring-primary hover:brightness-110 focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', styles.iconColor)} aria-hidden="true" />
      <span className="min-w-0 truncate">{alert.body}</span>
      <ChevronDown
        className={cn(
          'h-3.5 w-3.5 shrink-0 opacity-70 transition-transform',
          expanded && 'rotate-180'
        )}
        aria-hidden="true"
      />
    </button>
  );
}

/** The full warning: heading, sentence, update countdown and the precipitation timeline. */
export function NowcastAlertBanner({
  alert,
  id,
  className,
}: {
  alert: NowcastAlert;
  id?: string;
  className?: string;
}) {
  const { data, heading, body } = alert;
  const styles = BANNER_STYLES[alert.kind];
  const Icon = styles.icon;

  return (
    <section
      id={id}
      className={cn(
        'relative rounded-xl border p-4 shadow-sm',
        styles.border,
        styles.text,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Frosted surface + semantic tint, layered so the banner stays legible over
          any hero image — the bg tints alone are far too sheer on busy backgrounds.
          The blur lives on this layer (not the <section>) so the section isn't a
          backdrop-filter stacking context, which would hide the bars' hover tooltips. */}
      <div
        className="bg-background/85 pointer-events-none absolute inset-0 rounded-xl backdrop-blur-md"
        aria-hidden="true"
      />
      <div
        className={cn('pointer-events-none absolute inset-0 rounded-xl', styles.bg)}
        aria-hidden="true"
      />
      <div className="relative flex items-start gap-3">
        <div className={cn('mt-0.5 shrink-0', styles.iconColor)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn('h-3.5 w-3.5 shrink-0', styles.iconColor)}
              aria-hidden="true"
            />
            <h3 className="text-sm font-semibold">{heading}</h3>
            <NowcastUpdateCountdown nextUpdateAt={data.nextUpdateAt} className="ml-auto" />
          </div>
          {/* Stacked below `sm`, side by side above it — and the chart rendered at ZERO WIDTH
              before that. The `<p>` is a plain flex item, so its flex base size is its
              max-content width (the German active-rain sentence is ~350 px at `text-sm`); the
              timeline is `flex-1`, i.e. `flex: 1 1 0%`, base 0. Inside the panel the row has
              268 px at 390 px of viewport, so there is negative free space — and flexbox
              distributes shrinkage by base size × shrink factor, which is ~350 for the paragraph
              and exactly 0 for the chart. The paragraph absorbed the whole deficit and wrapped,
              the chart kept its 0 px basis, its `flex-1` bars each resolved to 0, and all that
              was left beside the sentence was a 40 px tall empty column with two clipped time
              labels. It only stopped being 0 px above ~490 px of viewport.

              `w-full` rather than keeping `flex-1` in the column: `flex-1` in a `flex-col`
              container is a VERTICAL grow factor and would say nothing about width. */}
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
            <p className="text-sm leading-relaxed">{body}</p>
            <NowcastPrecipTimeline
              steps={data.steps}
              observedAt={data.observedAt}
              timezone={data.park.timezone}
              colorClass={styles.iconColor}
              className="w-full sm:min-w-0 sm:flex-1"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** The banner on its own, for surfaces that show it outright (the /ui showcase, the guide page). */
export function WeatherNowcastBanner({ className, ...params }: WeatherNowcastBannerProps) {
  const alert = useNowcastAlert(params);
  if (!alert) return null;
  return <NowcastAlertBanner alert={alert} className={className} />;
}
