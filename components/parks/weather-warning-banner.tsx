'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertTriangle,
  ChevronDown,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  Snowflake,
  ThermometerSnowflake,
  ThermometerSun,
  TriangleAlert,
  Waves,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TitleRowToggle } from '@/components/parks/title-row-toggle';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { useMounted } from '@/lib/hooks/use-mounted';
import { warningsInOpeningHours } from '@/lib/utils/warnings-in-opening-hours';
import type { ParkWithAttractions, WeatherWarning } from '@/lib/api/types';

interface WeatherWarningBannerProps {
  /** The warnings to show; the park page takes them from {@link useParkWeatherWarnings}. */
  warnings: WeatherWarning[];
  /** IANA timezone for formatting validity times (defaults to the viewer's). */
  timezone?: string;
  /** Id of the list, for the toggle that opens it (`aria-controls`). */
  id?: string;
  /**
   * The level of each warning's headline: 2 where the list opens the card, 3 under the card's own
   * „Heute im Park" heading, so the outline never skips a level.
   */
  headingLevel?: 2 | 3;
  /**
   * Whether the cards open with their text shown: the list a press in the title row opened, where
   * a second press for the text would be one too many.
   */
  openDetails?: boolean;
  className?: string;
}

type SeverityKey = 'minor' | 'moderate' | 'severe' | 'extreme';

interface SeverityStyle {
  bg: string;
  border: string;
  text: string;
  iconColor: string;
  badge: string;
}

/** MeteoAlarm-style awareness colours, severest first. */
const SEVERITY_STYLES: Record<SeverityKey, SeverityStyle> = {
  extreme: {
    bg: 'bg-red-600/10 dark:bg-red-600/20',
    border: 'border-red-600/50',
    text: 'text-red-950 dark:text-red-100',
    iconColor: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-600/15 text-red-700 dark:text-red-300',
  },
  severe: {
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    border: 'border-red-500/40',
    text: 'text-red-900 dark:text-red-100',
    iconColor: 'text-red-500 dark:text-red-400',
    badge: 'bg-red-500/15 text-red-700 dark:text-red-300',
  },
  moderate: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    border: 'border-orange-500/40',
    text: 'text-orange-900 dark:text-orange-100',
    iconColor: 'text-orange-500 dark:text-orange-400',
    badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  },
  minor: {
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/15',
    border: 'border-yellow-500/40',
    text: 'text-yellow-900 dark:text-yellow-100',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
  },
};

const SEVERITY_RANK: Record<SeverityKey, number> = {
  extreme: 4,
  severe: 3,
  moderate: 2,
  minor: 1,
};

const severityKey = (severity?: string | null): SeverityKey => {
  const s = (severity ?? '').toLowerCase();
  if (s === 'extreme') return 'extreme';
  if (s === 'severe') return 'severe';
  if (s === 'moderate') return 'moderate';
  return 'minor';
};

type EventIconKey =
  'heat' | 'thunder' | 'hail' | 'wind' | 'ice' | 'snow' | 'fog' | 'flood' | 'rain' | 'default';

/** Static icon references (property-access lookup keeps them stable per render). */
const EVENT_ICONS: Record<EventIconKey, LucideIcon> = {
  heat: ThermometerSun,
  thunder: CloudLightning,
  hail: CloudHail,
  wind: Wind,
  ice: ThermometerSnowflake,
  snow: Snowflake,
  fog: CloudFog,
  flood: Waves,
  rain: CloudRain,
  default: TriangleAlert,
};

/** Map the (localized) event text to a static icon key. */
const eventIconKey = (event: string): EventIconKey => {
  const e = event.toLowerCase();
  if (/hitze|heat|hot|warm/.test(e)) return 'heat';
  if (/gewitter|thunder|lightning/.test(e)) return 'thunder';
  if (/hagel|hail/.test(e)) return 'hail';
  if (/sturm|storm|wind|orkan|böen|boen|gale|gust/.test(e)) return 'wind';
  if (/glätte|glaette|frost|ice|kälte|kaelte|cold/.test(e)) return 'ice';
  if (/schnee|snow|blizzard/.test(e)) return 'snow';
  if (/nebel|fog|sicht|visib/.test(e)) return 'fog';
  if (/hochwasser|flood|überflut|ueberflut|flut/.test(e)) return 'flood';
  if (/regen|rain|nieder|precip/.test(e)) return 'rain';
  return 'default';
};

const SOURCE_LABEL: Record<string, string> = {
  brightsky: 'Deutscher Wetterdienst (DWD)',
  meteogate: 'MeteoAlarm',
};

/** Severest first, the earlier of two equal ones first. */
const bySeverity = (a: WeatherWarning, b: WeatherWarning): number =>
  SEVERITY_RANK[severityKey(b.severity)] - SEVERITY_RANK[severityKey(a.severity)] ||
  (a.onset ?? '').localeCompare(b.onset ?? '');

/**
 * Whether a warning is at the lowest awareness level, said in the park header's title row rather
 * than as a strip across the card. Only an explicit „Minor": a warning without a severity keeps
 * the strip, since nobody said it was harmless.
 */
export const isMinorWarning = (warning: WeatherWarning): boolean =>
  (warning.severity ?? '').toLowerCase() === 'minor';

/** A warning's texts in the page's language; DWD writes German, with an English copy. */
function localizedWarning(warning: WeatherWarning, locale: string) {
  const isDe = locale.startsWith('de');
  const event = isDe ? warning.event : warning.eventEn || warning.event;
  return {
    event,
    headline: (isDe ? warning.headline : warning.headlineEn || warning.headline) || event,
    description: isDe ? warning.description : warning.descriptionEn || warning.description,
    instruction: isDe ? warning.instruction : warning.instructionEn || warning.instruction,
  };
}

interface ParkWeatherWarnings {
  /** Moderate and up, severest first: the strip across the top of the card. */
  major: WeatherWarning[];
  /** Minor, earliest first: a line in the title row. */
  minor: WeatherWarning[];
}

const NO_WARNINGS: ParkWeatherWarnings = { major: [], minor: [] };

/**
 * The park's official warnings (DWD, MeteoAlarm) that touch its opening hours, off the shared
 * nowcast query, split by {@link isMinorWarning}. Empty until mounted: the warnings are live, and
 * their validity is worded against `Date.now()`, so the server and the first client render agree on
 * none.
 */
export function useParkWeatherWarnings({
  continent,
  country,
  city,
  parkSlug,
  openingHours,
}: {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Given, a warning that touches none of the park's hours is left out (`warningsInOpeningHours`). */
  openingHours?: Pick<ParkWithAttractions, 'schedule' | 'nextSchedule'>;
}): ParkWeatherWarnings {
  const mounted = useMounted();
  const { data } = useWeatherNowcast({ continent, country, city, parkSlug, initialData: null });
  const all = data?.warnings;

  return useMemo(() => {
    if (!mounted || !all?.length) return NO_WARNINGS;
    const inHours = openingHours ? warningsInOpeningHours(all, openingHours) : all;
    if (inHours.length === 0) return NO_WARNINGS;
    const sorted = [...inHours].sort(bySeverity);
    return {
      major: sorted.filter((w) => !isMinorWarning(w)),
      minor: sorted.filter(isMinorWarning),
    };
  }, [mounted, all, openingHours]);
}

/**
 * The minor warnings as one line in the park header's title row: the first one's headline, and how
 * many more there are. A press opens them under the row as a {@link WeatherWarningBanner}.
 */
export function MinorWarningToggle({
  warnings,
  expanded,
  onToggle,
  controls,
  className,
}: {
  /** At least one; see {@link useParkWeatherWarnings}. */
  warnings: WeatherWarning[];
  expanded: boolean;
  onToggle: () => void;
  /** Id of the list the toggle opens. */
  controls: string;
  className?: string;
}) {
  const locale = useLocale();
  const { event, headline } = localizedWarning(warnings[0], locale);
  const more = warnings.length - 1;

  return (
    <TitleRowToggle
      icon={EVENT_ICONS[eventIconKey(event)]}
      tone={SEVERITY_STYLES.minor}
      label={more > 0 ? `${headline} +${more}` : headline}
      title={headline}
      expanded={expanded}
      onToggle={onToggle}
      controls={controls}
      className={className}
    />
  );
}

/**
 * Official weather warnings for a park (DWD, MeteoAlarm), severest first, one expandable card
 * each. Renders nothing until mounted, since the validity is worded against `Date.now()`.
 */
export function WeatherWarningBanner({
  warnings,
  timezone,
  id,
  headingLevel = 2,
  openDetails = false,
  className,
}: WeatherWarningBannerProps) {
  const locale = useLocale();
  const mounted = useMounted();
  const sorted = useMemo(() => [...warnings].sort(bySeverity), [warnings]);
  if (!mounted || sorted.length === 0) return null;

  return (
    <div id={id} className={cn('space-y-2', className)}>
      {sorted.map((w) => (
        <WarningCard
          key={w.alertId}
          warning={w}
          locale={locale}
          timezone={timezone}
          headingLevel={headingLevel}
          openDetails={openDetails}
        />
      ))}
    </div>
  );
}

function WarningCard({
  warning,
  locale,
  timezone,
  headingLevel,
  openDetails,
}: {
  warning: WeatherWarning;
  locale: string;
  timezone?: string;
  headingLevel: 2 | 3;
  openDetails: boolean;
}) {
  const t = useTranslations('parks.weatherWarnings');
  const [open, setOpen] = useState(openDetails);

  const { event, headline, description, instruction } = localizedWarning(warning, locale);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  const sev = severityKey(warning.severity);
  const styles = SEVERITY_STYLES[sev];
  const Icon = EVENT_ICONS[eventIconKey(event)];
  const validity = formatValidity(warning, timezone, locale, t);
  const hasDetails = Boolean(description || instruction);
  const sourceName = SOURCE_LABEL[warning.source] ?? warning.source;

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 shadow-sm',
        styles.border,
        styles.text
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Frosted surface + semantic tint so the banner stays legible over the hero. */}
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
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <AlertTriangle
              className={cn('h-3.5 w-3.5 shrink-0', styles.iconColor)}
              aria-hidden="true"
            />
            <Heading className="text-sm font-semibold">{headline}</Heading>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase',
                styles.badge
              )}
            >
              {t(`severity.${sev}`)}
            </span>
          </div>

          <p className="text-muted-foreground mt-1 text-xs">
            {validity}
            {warning.area ? (
              <>
                {validity ? ' · ' : ''}
                {warning.area}
              </>
            ) : null}
          </p>

          {hasDetails ? (
            <>
              {open ? (
                <div className="mt-2 space-y-2 text-sm leading-relaxed">
                  {description ? <p>{description}</p> : null}
                  {instruction ? (
                    <p className="text-muted-foreground">
                      <span className="font-medium">{t('instruction')}: </span>
                      {instruction}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className={cn(
                  'mt-2 inline-flex items-center gap-1 text-xs font-medium',
                  'hover:underline focus-visible:underline focus-visible:outline-none',
                  styles.iconColor
                )}
              >
                {open ? t('less') : t('more')}
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
            </>
          ) : null}

          <p className="text-muted-foreground/70 mt-2 text-[11px]">
            {t('source', { name: sourceName })}
          </p>
        </div>
      </div>
    </section>
  );
}

/** "until Sat, 17:00", or "Sat 09:00 – 17:00" when onset is in the future. */
function formatValidity(
  warning: WeatherWarning,
  timezone: string | undefined,
  locale: string,
  t: ReturnType<typeof useTranslations>
): string | null {
  const fmt = (iso?: string | null): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return getDateTimeFormat(locale, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    }).format(d);
  };

  const expires = fmt(warning.expires);
  const onsetTs = warning.onset ? Date.parse(warning.onset) : NaN;
  const startsInFuture = !Number.isNaN(onsetTs) && onsetTs > Date.now();

  if (startsInFuture) {
    const onset = fmt(warning.onset);
    if (onset && expires) return t('fromUntil', { start: onset, end: expires });
  }
  return expires ? t('until', { time: expires }) : null;
}
