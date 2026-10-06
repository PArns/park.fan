'use client';

import { useMemo, type ReactNode } from 'react';
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
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { NowcastUpdateCountdown } from '@/components/parks/nowcast-update-countdown';
import { NowcastPrecipTimeline } from '@/components/parks/nowcast-precip-timeline';
import { formatTime } from '@/lib/utils/intl-format';
import { parkDayOf } from '@/lib/utils/park-day';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { formatWindSpeed } from '@/lib/utils/temperature';
import { formatShortDuration } from '@/lib/utils/duration';
import { isRainingNow, offersShelter } from '@/lib/utils/nowcast-shelter';
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
  if (parkDayOf(ts, timezone) !== parkDayOf(now, timezone)) return null;
  return formatTime(ts, locale, { hour: '2-digit', minute: '2-digit', timeZone: timezone });
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

  // Live rain — see `isRainingNow` for why a future start means it is not raining yet.
  const liveRaining = isRainingNow(data, now);

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
  /**
   * Rain or a thunderstorm now or within the shelter lead time (`offersShelter`), read off the
   * nowcast rather than off the picked warning, which a storm or hail may outrank.
   */
  offersShelter: boolean;
}

/**
 * The nowcast warning due right now, or `null`: the query, the clock, the pick and the wording,
 * without the box. The park header's one-line toggle and the full banner both read it, so they
 * cannot pick or word a warning differently.
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

  // The shared minute clock, `null` on the server and the hydration render, so no countdown text is
  // baked into the server markup. Everything derived from `now` is minute-granular, and a faster
  // tick re-rendered the component that owns a `backdrop-blur-md` layer, which re-rasterises the
  // backdrop and made „Heute im Park" flicker; only the mm:ss countdown ticks per second, in its
  // own component. No `useActiveOnScreen` here for the same reason: its state updates re-rendered
  // the backdrop owner too. See docs/rules/work-nobody-can-see-is-still-work.md.
  const now = useMinuteNow() ?? 0;

  // `now > 0` keeps the warning hidden until the clock mounts, so SSR and hydration agree.
  const banner = useMemo(() => (data && now > 0 ? pickBanner(data, now) : null), [data, now]);

  if (!data || !banner) return null;

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

  return {
    kind: banner.kind,
    heading,
    body,
    data,
    offersShelter: offersShelter(data, now),
  };
}

/**
 * The warning as one line, in the park header's title row where the weather reading otherwise sits;
 * a press opens the full {@link NowcastAlertBanner} under the row. `-my-[3px]` hands back the
 * pill's 6 px of padding and border, so it is exactly as tall as the row's own content and cannot
 * move the card when the nowcast lands.
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

/**
 * The full warning: heading, sentence, update countdown and the precipitation timeline — and,
 * under them, whatever the host adds as `children` (the park page's covered rides).
 */
export function NowcastAlertBanner({
  alert,
  id,
  className,
  children,
}: {
  alert: NowcastAlert;
  id?: string;
  className?: string;
  children?: ReactNode;
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
          {/* Stacked below `sm`, side by side above it. As a plain flex item the `<p>` shrinks by
              its max-content base while the `flex-1` timeline has a base of 0, so in a narrow row
              the chart rendered at zero width. `w-full`, because `flex-1` in a `flex-col` grows
              height, not width. */}
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
      {/* Under the icon column rather than inside the text column: at 360 px the text column is
          ~50 px narrower than the banner, and the rows put in here carry a name, a distance and
          two badges on one line. */}
      {children && <div className="relative">{children}</div>}
    </section>
  );
}

/** The banner on its own, for surfaces that show it outright (the /ui showcase, the guide page). */
export function WeatherNowcastBanner({ className, ...params }: WeatherNowcastBannerProps) {
  const alert = useNowcastAlert(params);
  if (!alert) return null;
  return <NowcastAlertBanner alert={alert} className={className} />;
}
