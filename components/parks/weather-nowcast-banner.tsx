'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertTriangle,
  CloudHail,
  CloudLightning,
  CloudRain,
  ExternalLink,
  Wind,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
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

interface BannerSpec {
  kind: BannerKind;
  /** When the event starts. Null if it's already happening (currently raining). */
  startsAt: string | null;
  /** When the event ends (only set when it's already happening). */
  endsAt: string | null;
  /** Optional rain intensity (only for rain banner). */
  intensity?: 'light' | 'moderate' | 'heavy' | null;
}

const minutesUntil = (iso: string | null, now: number): number | null => {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.round((ts - now) / 60_000));
};

/**
 * Pick the highest-priority warning to surface. Order (per spec):
 *  1. storm (gusts >= 75 km/h)
 *  2. hail
 *  3. thunderstorm
 *  4. rain — current or starting within 30 min
 */
function pickBanner(data: WeatherNowcast, now: number): BannerSpec | null {
  if (data.stormStartsAt) {
    return { kind: 'storm', startsAt: data.stormStartsAt, endsAt: data.stormEndsAt };
  }
  if (data.hailStartsAt) {
    return { kind: 'hail', startsAt: data.hailStartsAt, endsAt: data.hailEndsAt };
  }
  if (data.thunderstormStartsAt) {
    return {
      kind: 'thunderstorm',
      startsAt: data.thunderstormStartsAt,
      endsAt: data.thunderstormEndsAt,
    };
  }

  // Live rain: derive from absolute timestamps to stay drift-free even when `currentlyRaining`
  // is up to 15 min stale.
  const rainEndsTs = data.rainEndsAt ? Date.parse(data.rainEndsAt) : NaN;
  const rainStartsTs = data.rainStartsAt ? Date.parse(data.rainStartsAt) : NaN;

  const liveRaining =
    (!Number.isNaN(rainEndsTs) && rainEndsTs > now) ||
    (!Number.isNaN(rainStartsTs) && rainStartsTs <= now) ||
    data.currentlyRaining;

  if (liveRaining) {
    return {
      kind: 'rain',
      startsAt: null,
      endsAt: data.rainEndsAt,
      intensity: data.rainStartsIntensity,
    };
  }

  // Rain starting soon (within 30 min)
  const minsToRain = minutesUntil(data.rainStartsAt, now);
  if (minsToRain !== null && minsToRain <= 30) {
    return {
      kind: 'rain',
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

function formatTime(iso: string, locale: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }
}

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

  const { data } = useWeatherNowcast({
    continent,
    country,
    city,
    parkSlug,
    initialData,
    enabled,
  });

  // Live clock so countdowns recompute every second (drives the mm:ss
  // "next update" countdown; the per-minute body text just re-renders harmlessly).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  if (!data) return null;

  const banner = pickBanner(data, now);
  if (!banner) return null;

  const styles = BANNER_STYLES[banner.kind];
  const Icon = styles.icon;
  const timezone = data.park.timezone;

  // Build heading + body per banner kind
  let heading: string;
  let body: string;

  switch (banner.kind) {
    case 'storm': {
      const mins = minutesUntil(banner.startsAt, now);
      heading = t('storm.heading');
      const gusts = data.peakWindGustsKmh;
      body =
        mins !== null && mins > 0
          ? t('storm.bodyInMin', { minutes: mins, gusts: gusts ?? '?' })
          : t('storm.bodyNow', { gusts: gusts ?? '?' });
      break;
    }
    case 'hail': {
      const mins = minutesUntil(banner.startsAt, now);
      heading = t('hail.heading');
      body = mins !== null && mins > 0 ? t('hail.bodyInMin', { minutes: mins }) : t('hail.bodyNow');
      break;
    }
    case 'thunderstorm': {
      const mins = minutesUntil(banner.startsAt, now);
      heading = t('thunderstorm.heading');
      body =
        mins !== null && mins > 0
          ? t('thunderstorm.bodyInMin', { minutes: mins })
          : t('thunderstorm.bodyNow');
      break;
    }
    case 'rain': {
      heading = t('rain.heading');
      if (banner.startsAt) {
        // Starting soon
        const mins = minutesUntil(banner.startsAt, now) ?? 0;
        const intensityKey = banner.intensity ?? 'light';
        body = t('rain.bodyStartsInMin', {
          minutes: mins,
          intensity: t(`intensity.${intensityKey}`),
        });
      } else if (banner.endsAt) {
        body = t('rain.bodyEndsAt', { time: formatTime(banner.endsAt, locale, timezone) });
      } else {
        body = t('rain.bodyNow');
      }
      break;
    }
  }

  // Live mm:ss countdown until the next backend refresh.
  let nextUpdateCountdown: string | null = null;
  if (data.nextUpdateAt) {
    const ms = Date.parse(data.nextUpdateAt) - now;
    if (!Number.isNaN(ms) && ms > 0) {
      const totalSec = Math.floor(ms / 1000);
      const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const ss = String(totalSec % 60).padStart(2, '0');
      nextUpdateCountdown = `${mm}:${ss}`;
    }
  }

  return (
    <section
      className={cn(
        'rounded-xl border p-4 shadow-sm',
        styles.bg,
        styles.border,
        styles.text,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 shrink-0', styles.iconColor)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', styles.iconColor)} aria-hidden="true" />
            <h3 className="text-sm font-semibold">{heading}</h3>
          </div>
          <p className="mt-1 text-sm leading-relaxed">{body}</p>
          {nextUpdateCountdown && (
            <p className="mt-1.5 font-mono text-[11px] opacity-60">
              {t('updateIn', { countdown: nextUpdateCountdown })}
            </p>
          )}
          <p className="mt-2 text-[10px] opacity-70">
            <a
              href={data.attribution.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
            >
              {data.attribution.attribution}
              <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
