'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, CloudHail, CloudLightning, CloudRain, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { NowcastUpdateCountdown } from '@/components/parks/nowcast-update-countdown';
import { NowcastPrecipTimeline } from '@/components/parks/nowcast-precip-timeline';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { formatWindSpeed } from '@/lib/utils/temperature';
import { formatShortDuration } from '@/lib/utils/duration';
import type { WeatherNowcast } from '@/lib/api/types';

interface WeatherNowcastBannerProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  initialData: WeatherNowcast | null;
  className?: string;
  /** Disable the polling query (e.g. on the /ui showcase page). */
  enabled?: boolean;
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

/** How far ahead (minutes) to surface a rain pre-warning. Severe events
 *  (storm/hail/thunderstorm) have no gate and show as soon as they're forecast. */
const RAIN_LEAD_MINUTES = 60;

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

export function WeatherNowcastBanner({
  continent,
  country,
  city,
  parkSlug,
  initialData,
  className,
  enabled = true,
}: WeatherNowcastBannerProps) {
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

  // Live clock so countdowns recompute every second.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const banner = useMemo(() => (data ? pickBanner(data, now) : null), [data, now]);

  if (!data || !banner) return null;

  const styles = BANNER_STYLES[banner.kind];
  const Icon = styles.icon;

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
        body = t('storm.bodyInMin', { duration: formatShortDuration(mins, locale), gusts });
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
        body = t('hail.bodyInMin', { duration: formatShortDuration(mins, locale) });
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
        body = t('thunderstorm.bodyInMin', { duration: formatShortDuration(mins, locale) });
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
        const endsIn = minutesUntil(banner.endsAt, now);
        const intensityLabel = banner.intensity ? t(`intensity.${banner.intensity}`) : null;
        if (endsIn !== null && endsIn > 0) {
          body = intensityLabel
            ? t('rain.bodyEndsInMinIntensity', {
                duration: formatShortDuration(endsIn, locale),
                intensity: intensityLabel,
              })
            : t('rain.bodyEndsInMin', { duration: formatShortDuration(endsIn, locale) });
        } else {
          body = intensityLabel
            ? t('rain.bodyNowIntensity', { intensity: intensityLabel })
            : t('rain.bodyNow');
        }
      }
      break;
    }
  }

  return (
    <section
      className={cn(
        'relative rounded-xl border p-4 shadow-sm backdrop-blur-md',
        styles.border,
        styles.text,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Frosted surface + semantic tint, layered so the banner stays legible over
          any hero image — the bg tints alone are far too sheer on busy backgrounds. */}
      <div
        className="bg-background/85 pointer-events-none absolute inset-0 rounded-xl"
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
            <NowcastUpdateCountdown
              nextUpdateAt={data.nextUpdateAt}
              now={now}
              className="ml-auto"
            />
          </div>
          <div className="mt-1 flex items-start gap-4">
            <p className="text-sm leading-relaxed">{body}</p>
            <NowcastPrecipTimeline
              steps={data.steps}
              observedAt={data.observedAt}
              timezone={data.park.timezone}
              colorClass={styles.iconColor}
              className="min-w-0 flex-1"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
