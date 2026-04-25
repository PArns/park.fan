/* eslint-disable react/no-unescaped-entities */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, generateAlternateLanguages, localeToOpenGraphLocale } from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { LocaleContent } from '@/components/common/locale-content';
import { Link } from '@/i18n/navigation';
import { PopularParksGridClient } from '@/components/home/featured-parks-section-client';

import { formatInTimeZone } from 'date-fns-tz';
import { getIntegratedCalendar } from '@/lib/api/integrated-calendar';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import type { CalendarDay } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { HeroSearchInput } from '@/components/search/hero-search-input';
import { NearbyParksCard } from '@/components/parks/nearby-parks-card';
import { ParkCard } from '@/components/parks/park-card';
import { AttractionCard } from '@/components/parks/attraction-card';
import type { FavoriteAttraction } from '@/lib/api/favorites';
import { TrendIndicator } from '@/components/parks/trend-indicator';
import { WeatherForecastStrip } from '@/components/parks/weather-forecast-strip';
import {
  Search,
  Star,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  XCircle,
  Wrench,
  User,
  Zap,
  Ticket,
  TrendingDown,
  Minus,
  Activity,
  PartyPopper,
  Backpack,
  Calendar,
  ChevronRight,
  MapPin,
  Snowflake,
  Wind,
  Sun,
  Leaf,
  EyeOff,
  Info,
  Lightbulb,
} from 'lucide-react';

interface HowtoPageProps {
  params: Promise<{ locale: string }>;
}

export const revalidate = 86400; // 1 day — static content; live parks via React Query

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: HowtoPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'howto' });
  const ogImageUrl = getOgImageUrl([locale, 'howto']);

  const fullTitle = `${t('title')} | park.fan`;

  return {
    title: { absolute: fullTitle },
    description: t('description'),
    openGraph: {
      title: fullTitle,
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `https://park.fan/${locale}/howto`,
      siteName: 'park.fan',
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://park.fan/${locale}/howto`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/howto`),
        'x-default': 'https://park.fan/en/howto',
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    keywords:
      locale === 'de'
        ? [
            'Freizeitpark Wartezeiten',
            'Freizeitpark App',
            'park.fan Anleitung',
            'Crowd-Kalender',
            'Besucherprognose',
            'Warteschlangen',
            'Disney Wartezeiten',
            'Europa-Park Wartezeiten',
            'Phantasialand Wartezeiten',
            'Heide Park Wartezeiten',
            'Efteling Wartezeiten',
            'Freizeitpark planen',
          ]
        : locale === 'es'
          ? [
              'tiempos de espera parque temático',
              'aplicación parque temático',
              'guía park.fan',
              'calendario de afluencia',
              'predicciones de visitantes',
              'colas atracciones',
              'tiempos de espera Disneyland',
              'PortAventura tiempos de espera',
              'Gardaland tiempos de espera',
            ]
          : locale === 'fr'
            ? [
                "temps d'attente parc d'attractions",
                "application parc d'attractions",
                'guide park.fan',
                "calendrier d'affluence",
                'prévisions visiteurs',
                "files d'attente attractions",
                "temps d'attente Disneyland Paris",
                "Europa-Park temps d'attente",
                "Parc Astérix temps d'attente",
              ]
            : locale === 'it'
              ? [
                  'tempi di attesa parco divertimenti',
                  'app parco divertimenti',
                  'guida park.fan',
                  'calendario affollamento',
                  'previsioni visitatori',
                  'code attrazioni',
                  'Gardaland tempi di attesa',
                  'Europa-Park tempi di attesa',
                ]
              : locale === 'nl'
                ? [
                    'wachttijden pretpark',
                    'pretpark app',
                    'park.fan handleiding',
                    'drukte-kalender',
                    'bezoekersvoorspellingen',
                    'wachtrijen attracties',
                    'wachttijden Disneyland Paris',
                    'Efteling wachttijden',
                    'Europa-Park wachttijden',
                    'Toverland wachttijden',
                  ]
                : [
                    'theme park wait times',
                    'theme park app',
                    'park.fan guide',
                    'crowd calendar',
                    'visitor predictions',
                    'ride queues',
                    'Disney wait times',
                    'Europa-Park wait times',
                    'Universal Studios wait times',
                    'Magic Kingdom wait times',
                    'theme park planning',
                  ],
  };
}

// ─── Reusable layout helpers ──────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="border-border mb-6 border-b pb-3 text-xl font-bold sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

// ─── Popular Parks (async RSC – fetches geoData via cache()) ──────────────────

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-xl font-semibold">{title}</h3>
      {children}
    </div>
  );
}

// Inline badge to illustrate how UI badges look without needing client hooks
function DemoBadge({
  color,
  label,
  icon: Icon,
  termId,
}: {
  color: string;
  label: string;
  icon?: React.ElementType;
  termId?: string;
}) {
  return (
    <Badge className={cn('font-bold tracking-wide text-white uppercase backdrop-blur-md', color)}>
      {Icon && <Icon className="h-3 w-3 text-inherit" />}
      {termId ? (
        <GlossaryTermLink
          termId={termId}
          className="cursor-help underline decoration-white/60 decoration-dashed underline-offset-2"
        >
          {label}
        </GlossaryTermLink>
      ) : (
        label
      )}
    </Badge>
  );
}

function InfoBox({ children, label = 'Hinweis' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="bg-primary/5 border-primary/20 !mt-6 rounded-lg border px-3 py-2.5 text-sm leading-relaxed">
      <div className="text-primary mb-1 flex items-center gap-1.5 font-semibold">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

async function TipBox({ children, label = 'Tipp' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="!mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5 text-sm leading-relaxed">
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-yellow-600 dark:text-yellow-400">
        <Lightbulb className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      {typeof children === 'string' ? <GlossaryInject>{children}</GlossaryInject> : children}
    </div>
  );
}

function PersonaCard({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="text-muted-foreground space-y-2 text-sm">{children}</ul>
      </CardContent>
    </Card>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

// ─── Live calendar example (Phantasialand, next 7 days) ──────────────────────

function buildBorderColor(day: CalendarDay): string {
  if (day.status === 'CLOSED') return 'border-status-closed dark:border-status-closed';
  if (day.isSchoolVacation || day.isSchoolHoliday)
    return 'border-yellow-500 dark:border-yellow-400';
  if (day.isHoliday || day.isPublicHoliday) return 'border-orange-500 dark:border-orange-400';
  if (day.isBridgeDay) return 'border-blue-500 dark:border-blue-400';
  if (day.isToday) return 'border-primary';
  return 'border-border';
}

async function LiveCalendarExample({ locale }: { locale: MockLocale }) {
  // ── Fetch data only — JSX must not be constructed inside try/catch ─────────
  let days: CalendarDay[] = [];
  let dtFmt: Intl.DateTimeFormat | null = null;
  let dateFmt: Intl.DateTimeFormat | null = null;
  let timezone = 'Europe/Berlin';

  try {
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const to = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const calendar = await getIntegratedCalendar('europe', 'germany', 'bruehl', 'phantasialand', {
      from,
      to,
      includeHourly: 'none',
    });

    timezone = calendar.meta.timezone ?? 'Europe/Berlin';
    days = calendar.days.slice(0, 7);

    if (days.length > 0) {
      dtFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
      dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    }
  } catch {
    // Data fetch failed — fall through to MockCalendar
  }

  // ── Render outside try/catch ───────────────────────────────────────────────
  if (days.length === 0 || !dtFmt || !dateFmt) return <MockCalendar locale={locale} />;

  const bestLabel =
    locale === 'de'
      ? 'Empfohlen'
      : locale === 'es'
        ? 'Recomendado'
        : locale === 'fr'
          ? 'Recommandé'
          : locale === 'it'
            ? 'Consigliato'
            : locale === 'nl'
              ? 'Aanbevolen'
              : 'Recommended';
  const avgLabel = locale === 'de' ? 'Ø' : 'avg';

  const renderDay = (day: CalendarDay, _i: number) => {
    const d = new Date(day.date + 'T12:00:00');
    const wd = dtFmt!.format(d);
    const dateStr = dateFmt!.format(d);
    const isBest = day.recommendation === 'highly_recommended';
    const border = buildBorderColor(day);
    const crowd = day.status === 'CLOSED' ? 'closed' : day.crowdLevel;
    const crowdLabel =
      crowd === 'closed'
        ? locale === 'de'
          ? 'Geschlossen'
          : 'Closed'
        : (CROWD_LABELS[locale][crowd] ?? crowd);
    const crowdColor =
      crowd === 'closed'
        ? 'bg-status-closed/65 border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40'
        : (CROWD_COLORS[crowd] ?? 'bg-muted border-border');
    const hoursStr = day.hours
      ? `${formatInTimeZone(day.hours.openingTime, timezone, 'HH:mm')}–${formatInTimeZone(day.hours.closingTime, timezone, 'HH:mm')}`
      : '—';
    const tempStr = day.weather ? `${Math.round(day.weather.tempMax)}°C` : '';
    const avgStr = day.avgWaitTime ? `${day.avgWaitTime} min` : '—';
    const scheduleIcon =
      day.isSchoolVacation || day.isSchoolHoliday ? (
        <Backpack className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
      ) : day.isHoliday || day.isPublicHoliday ? (
        <PartyPopper className="h-3.5 w-3.5 shrink-0 text-orange-500" />
      ) : day.isBridgeDay ? (
        <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-500" />
      ) : null;

    return (
      <Card
        key={day.date}
        className={`flex h-full flex-col gap-1 border-2 p-2 ${border} ${day.status === 'CLOSED' ? 'bg-gray-100/50 dark:bg-gray-800/30' : ''}`}
      >
        {isBest && (
          <div className="flex w-full justify-center">
            <span className="flex items-center gap-1 rounded-full border border-green-500/80 bg-green-500/65 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase backdrop-blur-md dark:border-green-500/40 dark:bg-green-500/25">
              <Star className="h-2.5 w-2.5" />
              {bestLabel}
            </span>
          </div>
        )}
        <div className="mb-1 flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs leading-tight font-medium">{wd}</span>
            <span className="mt-0.5 text-xs leading-tight font-semibold">{dateStr}</span>
          </div>
          {scheduleIcon}
        </div>
        <div
          className={`w-full rounded px-0.5 py-0.5 text-center text-[9px] leading-tight font-bold tracking-wide text-white uppercase ${crowdColor}`}
        >
          {crowdLabel}
        </div>
        {hoursStr !== '—' && (
          <div className="text-muted-foreground flex items-center justify-center gap-1 text-[9px]">
            <Clock className="h-2.5 w-2.5" />
            <span className="font-medium">{hoursStr}</span>
          </div>
        )}
        {tempStr && (
          <div className="text-muted-foreground flex items-center justify-center gap-0.5 text-[9px]">
            <Sun className="h-2.5 w-2.5" />
            <span>{tempStr}</span>
          </div>
        )}
        {day.avgWaitTime && (
          <div className="text-muted-foreground text-center text-[9px]">
            {avgLabel} {avgStr}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="not-prose space-y-2">
      {/* Desktop: 7-column week grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-2">{days.map((day, i) => renderDay(day, i))}</div>
      </div>
      {/* Mobile: 2-column grid — same as real park page */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {days.map((day, i) => renderDay(day, i))}
      </div>
      <p className="text-muted-foreground text-center text-[11px]">
        Phantasialand ·{' '}
        {locale === 'de' ? 'Live-Daten der nächsten 7 Tage' : 'Live data – next 7 days'}
      </p>
    </div>
  );
}

// ─── Mock example components ──────────────────────────────────────────────────

type MockLocale = 'de' | 'en' | 'es' | 'fr' | 'it' | 'nl';

const CROWD_LABELS: Record<MockLocale, Record<string, string>> = {
  de: {
    very_low: 'Sehr Niedrig',
    low: 'Niedrig',
    moderate: 'Normal',
    high: 'Hoch',
    very_high: 'Sehr Hoch',
    extreme: 'Extrem',
  },
  en: {
    very_low: 'Very Low',
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    very_high: 'Very High',
    extreme: 'Extreme',
  },
  es: {
    very_low: 'Muy Bajo',
    low: 'Bajo',
    moderate: 'Moderado',
    high: 'Alto',
    very_high: 'Muy Alto',
    extreme: 'Extremo',
  },
  fr: {
    very_low: 'Très Bas',
    low: 'Bas',
    moderate: 'Modéré',
    high: 'Élevé',
    very_high: 'Très Élevé',
    extreme: 'Extrême',
  },
  it: {
    very_low: 'Molto Basso',
    low: 'Basso',
    moderate: 'Moderato',
    high: 'Alto',
    very_high: 'Molto Alto',
    extreme: 'Estremo',
  },
  nl: {
    very_low: 'Zeer Laag',
    low: 'Laag',
    moderate: 'Matig',
    high: 'Hoog',
    very_high: 'Zeer Hoog',
    extreme: 'Extreem',
  },
};

const CROWD_COLORS: Record<string, string> = {
  very_low:
    'bg-crowd-very-low/65 border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
  low: 'bg-crowd-low/65 border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
  moderate:
    'bg-crowd-moderate/65 border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
  high: 'bg-crowd-high/65 border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
  very_high:
    'bg-crowd-very-high/65 border-crowd-very-high/80 dark:bg-crowd-very-high/25 dark:border-crowd-very-high/40',
  extreme:
    'bg-crowd-extreme/65 border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
};

const CROWD_ICONS: Record<string, React.ElementType> = {
  very_low: User,
  low: User,
  moderate: Users,
  high: Users,
  very_high: Users,
  extreme: AlertTriangle,
};

function CrowdBadge({ level, locale }: { level: string; locale: MockLocale }) {
  const Icon = CROWD_ICONS[level] || Users;
  return (
    <DemoBadge
      color={CROWD_COLORS[level] || 'bg-muted border-border'}
      label={CROWD_LABELS[locale][level] || level}
      icon={Icon}
    />
  );
}

function MockParkHeader({ locale }: { locale: MockLocale }) {
  const isDE = locale === 'de';
  const t = isDE
    ? {
        suffix: 'Aktuelle Wartezeiten',
        operating: 'GEÖFFNET',
        city: 'Brühl',
        country: 'Deutschland',
        timezone: 'Europe/Berlin',
        todaySchedule: 'Heutige Öffnungszeiten',
        openingHours: 'Öffnungszeiten',
        hours: '09:00 – 22:00',
        closingIn: 'Schließt in 6 Stunden 20 Minuten',
        currentTime: 'Aktuelle Uhrzeit',
        time: '15:40',
        weatherLabel: 'Wetter',
        weatherDesc: 'Sonnig',
        occupancyLabel: 'Auslastung',
        avgWaitLabel: 'Ø Wartezeit',
        current: 'Aktuell',
        trend: 'Trend',
        parkPeak: 'Park-Höchststand',
        peakTime: 'Stoßzeit',
        peakBadge: 'IN 1 STD. 45 MIN.',
        attractionsLabel: 'Attraktionen',
        open: 'Geöffnet',
        closed: 'Geschlossen',
        vsTypical: '30% Höher vs typisch',
        minutes: 'Minuten',
        operating2: 'in Betrieb',
      }
    : {
        suffix: 'Current Wait Times',
        operating: 'OPERATING',
        city: 'Brühl',
        country: 'Germany',
        timezone: 'Europe/Berlin',
        todaySchedule: "Today's Hours",
        openingHours: 'Opening hours',
        hours: '09:00 – 22:00',
        closingIn: 'Closes in 6 hours 20 minutes',
        currentTime: 'Current time',
        time: '3:40 PM',
        weatherLabel: 'Weather',
        weatherDesc: 'Sunny',
        occupancyLabel: 'Occupancy',
        avgWaitLabel: 'Avg. wait',
        current: 'Currently',
        trend: 'Trend',
        parkPeak: 'Park peak today',
        peakTime: 'Peak time',
        peakBadge: 'IN 1H 45M',
        attractionsLabel: 'Attractions',
        open: 'Open',
        closed: 'Closed',
        vsTypical: '30% Higher vs typical',
        minutes: 'Minutes',
        operating2: 'operating',
      };

  return (
    <div className="not-prose relative overflow-hidden rounded-xl">
      <BackgroundOverlay
        imageSrc="/images/parks/phantasialand/background.jpg"
        alt="Phantasialand"
        intensity="medium"
      />
      <div className="relative z-10 space-y-3 p-3">
        {/* Park header — GlassCard style */}
        <GlassCard>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-bold">
                  Phantasialand
                  <span className="text-muted-foreground ml-2 text-lg font-normal">
                    – {t.suffix}
                  </span>
                </h3>
                <DemoBadge
                  color="bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40"
                  label={t.operating}
                  icon={Clock}
                />
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                <address className="flex items-center gap-1 not-italic">
                  <MapPin className="h-4 w-4" />
                  {t.city}, {t.country}
                </address>
                <Badge variant="outline" className="gap-1 font-mono text-xs">
                  <Clock className="h-3 w-3" />
                  {t.timezone}
                </Badge>
              </div>
            </div>
            <Star className="text-muted-foreground h-6 w-6 shrink-0" />
          </div>
        </GlassCard>

        {/* 2-col: opening hours + weather */}
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                {t.todaySchedule}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">{t.openingHours}</span>
                <span className="text-lg font-semibold tabular-nums">{t.hours}</span>
              </div>
              <div className="flex items-center justify-end">
                <Badge variant="secondary">{t.closingIn}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">{t.currentTime}</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="text-primary h-4 w-4" />
                  <time className="text-lg font-bold tabular-nums">{t.time}</time>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun className="h-4 w-4" />
                {t.weatherLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-muted rounded-full p-2">
                    <Sun className="h-8 w-8 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-3xl font-bold">21°</span>
                    <p className="text-muted-foreground text-xs">16° – 26°</p>
                    <p className="text-muted-foreground text-xs">Feels like 19°</p>
                    <p className="text-muted-foreground mt-0.5 text-sm font-medium">
                      {t.weatherDesc}
                    </p>
                  </div>
                </div>
                <div className="text-muted-foreground space-y-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>☂</span>
                    <span>0mm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind className="h-3 w-3" />
                    <span>12 km/h</span>
                  </div>
                </div>
              </div>
              <WeatherForecastStrip
                forecast={[
                  {
                    date: '2026-04-07',
                    dataType: 'forecast',
                    temperatureMax: '21',
                    temperatureMin: '14',
                    precipitationSum: '0',
                    rainSum: '0',
                    snowfallSum: '0',
                    weatherCode: 1,
                    weatherDescription: '',
                    windSpeedMax: '10',
                  },
                  {
                    date: '2026-04-08',
                    dataType: 'forecast',
                    temperatureMax: '18',
                    temperatureMin: '12',
                    precipitationSum: '0',
                    rainSum: '0',
                    snowfallSum: '0',
                    weatherCode: 3,
                    weatherDescription: '',
                    windSpeedMax: '14',
                  },
                  {
                    date: '2026-04-09',
                    dataType: 'forecast',
                    temperatureMax: '14',
                    temperatureMin: '9',
                    precipitationSum: '8',
                    rainSum: '8',
                    snowfallSum: '0',
                    weatherCode: 63,
                    weatherDescription: '',
                    windSpeedMax: '22',
                  },
                  {
                    date: '2026-04-10',
                    dataType: 'forecast',
                    temperatureMax: '17',
                    temperatureMin: '11',
                    precipitationSum: '1.5',
                    rainSum: '1.5',
                    snowfallSum: '0',
                    weatherCode: 2,
                    weatherDescription: '',
                    windSpeedMax: '12',
                  },
                  {
                    date: '2026-04-11',
                    dataType: 'forecast',
                    temperatureMax: '24',
                    temperatureMin: '15',
                    precipitationSum: '0',
                    rainSum: '0',
                    snowfallSum: '0',
                    weatherCode: 0,
                    weatherDescription: '',
                    windSpeedMax: '8',
                  },
                  {
                    date: '2026-04-12',
                    dataType: 'forecast',
                    temperatureMax: '26',
                    temperatureMin: '16',
                    precipitationSum: '0',
                    rainSum: '0',
                    snowfallSum: '0',
                    weatherCode: 0,
                    weatherDescription: '',
                    windSpeedMax: '7',
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        {/* 3-col: occupancy + avg wait + attractions */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                {t.occupancyLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CrowdBadge level="high" locale={locale} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.occupancyLabel}</span>
                <span className="font-bold">130%</span>
              </div>
              <Progress value={65} className="h-1.5" />
              <p className="text-trend-up text-xs font-medium">{t.vsTypical}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                {t.avgWaitLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.current}</span>
                <span className="text-xl font-bold">
                  45 <span className="text-muted-foreground text-sm font-normal">{t.minutes}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.trend}</span>
                <TrendIndicator trend="stable" variant="pill" label={isDE ? 'STABIL' : 'STABLE'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.parkPeak}</span>
                <span className="font-semibold">55 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.peakTime}</span>
                <DemoBadge
                  color="bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40"
                  label={t.peakBadge}
                  icon={Clock}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                {t.attractionsLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold">32</span>
                <span className="text-muted-foreground text-lg">/ 40</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">32</div>
                  <div className="text-muted-foreground text-xs">{t.open}</div>
                </div>
                <div className="bg-muted rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">8</div>
                  <div className="text-muted-foreground text-xs">{t.closed}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MockAttractionCards(_props: { locale: MockLocale }) {
  // Distribute 6 history points across today's park hours (10:00 → 17:30
  // Europe/Berlin) so the sparkline axis always renders a sensible daytime range,
  // independent of when the cached howto page is served.
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const HOUR_SLOTS = [10, 11.5, 13, 14.5, 16, 17.5] as const;
  const hist = (values: number[]) =>
    values.map((waitTime, i) => {
      const slot = HOUR_SLOTS[i] ?? 17.5;
      const h = Math.floor(slot);
      const min = Math.round((slot - h) * 60);
      return {
        timestamp: `${yyyy}-${mm}-${dd}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+02:00`,
        waitTime,
      };
    });

  // "Beste Zeit" anchored to today's date so the card reads as a real time
  // (e.g. "Beste Zeit: 11:30").
  const bestVisitAt = (hours: number, minutes: number): string => {
    const hh = String(hours).padStart(2, '0');
    const mmStr = String(minutes).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mmStr}:00+02:00`;
  };
  const statsTimestamp = `${yyyy}-${mm}-${dd}T17:30:00+02:00`;

  const phantasialand = {
    id: 'phantasialand',
    name: 'Phantasialand',
    slug: 'phantasialand',
    timezone: 'Europe/Berlin',
    continent: 'europe',
    country: 'Germany',
    city: 'Brühl',
  } as const;

  const attractions: FavoriteAttraction[] = [
    {
      id: 'mock-taron',
      name: 'Taron',
      slug: 'taron',
      url: '/europe/germany/bruhl/phantasialand/taron',
      latitude: null,
      longitude: null,
      park: { ...phantasialand },
      queues: [
        { queueType: 'STANDBY', waitTime: 55, status: 'OPERATING' },
        { queueType: 'SINGLE_RIDER', waitTime: 10, status: 'OPERATING' },
      ],
      crowdLevel: 'high',
      statistics: {
        avgWaitToday: 42,
        peakWaitToday: 60,
        peakWaitTimestamp: null,
        minWaitToday: 15,
        typicalWaitThisHour: null,
        percentile95ThisHour: null,
        currentVsTypical: null,
        dataPoints: 6,
        history: hist([15, 22, 28, 38, 47, 55]),
        timestamp: statsTimestamp,
      },
      bestVisitTimes: [{ time: bestVisitAt(11, 30), rating: 'optimal', predictedWaitTime: 20 }],
    },
    {
      id: 'mock-black-mamba',
      name: 'Black Mamba',
      slug: 'black-mamba',
      url: '/europe/germany/bruhl/phantasialand/black-mamba',
      latitude: null,
      longitude: null,
      park: { ...phantasialand },
      queues: [{ queueType: 'STANDBY', waitTime: 12, status: 'OPERATING' }],
      crowdLevel: 'low',
      statistics: {
        avgWaitToday: 25,
        peakWaitToday: 40,
        peakWaitTimestamp: null,
        minWaitToday: 8,
        typicalWaitThisHour: null,
        percentile95ThisHour: null,
        currentVsTypical: null,
        dataPoints: 6,
        history: hist([40, 33, 26, 20, 15, 12]),
        timestamp: statsTimestamp,
      },
      bestVisitTimes: [{ time: bestVisitAt(14, 45), rating: 'optimal', predictedWaitTime: 8 }],
    },
    {
      id: 'mock-raik',
      name: 'Raik',
      slug: 'raik',
      url: '/europe/germany/bruhl/phantasialand/raik',
      latitude: null,
      longitude: null,
      park: { ...phantasialand },
      queues: [{ queueType: 'STANDBY', waitTime: 30, status: 'OPERATING' }],
      crowdLevel: 'moderate',
      statistics: {
        avgWaitToday: 30,
        peakWaitToday: 35,
        peakWaitTimestamp: null,
        minWaitToday: 25,
        typicalWaitThisHour: null,
        percentile95ThisHour: null,
        currentVsTypical: null,
        dataPoints: 6,
        history: hist([28, 32, 30, 33, 29, 30]),
        timestamp: statsTimestamp,
      },
      bestVisitTimes: null,
    },
  ];

  const backgrounds: Record<string, string> = {
    taron: '/images/parks/phantasialand/taron.jpg',
    'black-mamba': '/images/parks/phantasialand/black-mamba.jpg',
    raik: '/images/parks/phantasialand/raik.jpg',
  };

  return (
    <div className="not-prose grid items-stretch gap-4 sm:grid-cols-3">
      {attractions.map((attraction) => (
        <AttractionCard
          key={attraction.id}
          attraction={attraction}
          parkStatus="OPERATING"
          backgroundImage={backgrounds[attraction.slug]}
        />
      ))}
    </div>
  );
}

function MockShowCards() {
  const shows = [
    {
      name: 'Mia and Me – Live',
      times: ['09:00', '11:00', '13:00', '15:00'],
      nextIdx: 1,
      pastIdx: [0],
    },
    {
      name: 'F.L.Y. Pre-Show',
      times: ['10:30', '12:30', '14:30', '16:30'],
      nextIdx: 2,
      pastIdx: [0, 1],
    },
    { name: 'Mystery Castle Show', times: ['18:00'], nextIdx: 0, pastIdx: [] },
  ];
  return (
    <div className="not-prose grid gap-3 sm:grid-cols-3">
      {shows.map(({ name, times, nextIdx, pastIdx }) => (
        <Card key={name} className="relative">
          <div className="absolute top-2 right-2 z-20">
            <Star className="text-muted-foreground h-4 w-4" />
          </div>
          <CardContent className="p-4">
            <h3 className="pr-6 font-semibold">{name}</h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {times.map((time, i) => {
                const isPast = pastIdx.includes(i);
                const isNext = i === nextIdx;
                return (
                  <Badge
                    key={time}
                    variant="outline"
                    className={cn(
                      'text-xs',
                      isPast && 'line-through opacity-40',
                      isNext &&
                        'border-status-operating/40 bg-status-operating/15 text-status-operating font-semibold',
                      !isPast && !isNext && 'text-muted-foreground'
                    )}
                  >
                    {time}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MockNearbyCards(_props: { locale: MockLocale }) {
  // Fixed hours (09:00 / 22:00) with today's date so the card always shows
  // clean, natural-looking times even though the page is cached for 24h.
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayOpening = `${yyyy}-${mm}-${dd}T09:00:00+02:00`;
  const todayClosing = `${yyyy}-${mm}-${dd}T22:00:00+02:00`;
  const futureOpening = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
  const fYyyy = futureOpening.getFullYear();
  const fMm = String(futureOpening.getMonth() + 1).padStart(2, '0');
  const fDd = String(futureOpening.getDate()).padStart(2, '0');
  const futureOpeningIso = `${fYyyy}-${fMm}-${fDd}T10:00:00+02:00`;
  const futureClosingIso = `${fYyyy}-${fMm}-${fDd}T18:00:00+02:00`;

  return (
    <div className="not-prose grid items-stretch gap-4 sm:grid-cols-2">
      <ParkCard
        parkId="howto-phantasialand"
        slug="phantasialand"
        name="Phantasialand"
        city="Brühl"
        country="Germany"
        translateCountry
        href={'/europe/germany/bruhl/phantasialand' as '/'}
        backgroundImage="/images/parks/phantasialand/background.jpg"
        status="OPERATING"
        crowdLevel="high"
        averageWaitTime={45}
        operatingAttractions={38}
        totalAttractions={42}
        distance={8400}
        timezone="Europe/Berlin"
        highlightAsNearestOpen
        hasOperatingSchedule
        todaySchedule={{
          openingTime: todayOpening,
          closingTime: todayClosing,
          scheduleType: 'OPERATING',
        }}
      />
      <ParkCard
        parkId="howto-europa-park"
        slug="europa-park"
        name="Europa-Park"
        city="Rust"
        country="Germany"
        translateCountry
        href={'/europe/germany/rust/europa-park' as '/'}
        backgroundImage="/images/parks/europa-park/background.jpg"
        status="CLOSED"
        distance={124000}
        timezone="Europe/Berlin"
        hasOperatingSchedule
        nextSchedule={{
          openingTime: futureOpeningIso,
          closingTime: futureClosingIso,
          scheduleType: 'OPERATING',
        }}
      />
    </div>
  );
}

interface MockCalendarDay {
  wd: [string, string];
  date: string;
  crowd: string;
  border: string;
  hours: string;
  temp: string;
  avg: number;
  tag?: 'school' | 'holiday';
  best?: boolean;
}

const CALENDAR_DAYS: MockCalendarDay[] = [
  {
    wd: ['Sa', 'Sat'],
    date: '14. Jun',
    crowd: 'extreme',
    tag: 'school',
    border: 'border-yellow-500 dark:border-yellow-400',
    hours: '09:00–22:00',
    temp: '24°C',
    avg: 72,
  },
  {
    wd: ['So', 'Sun'],
    date: '15. Jun',
    crowd: 'very_high',
    tag: 'school',
    border: 'border-yellow-500 dark:border-yellow-400',
    hours: '09:00–21:00',
    temp: '21°C',
    avg: 60,
  },
  {
    wd: ['Mo', 'Mon'],
    date: '16. Jun',
    crowd: 'low',
    border: 'border-border',
    hours: '10:00–20:00',
    temp: '20°C',
    avg: 18,
  },
  {
    wd: ['Di', 'Tue'],
    date: '17. Jun',
    crowd: 'very_low',
    border: 'border-border',
    best: true,
    hours: '10:00–19:00',
    temp: '21°C',
    avg: 10,
  },
  {
    wd: ['Mi', 'Wed'],
    date: '18. Jun',
    crowd: 'low',
    border: 'border-border',
    hours: '10:00–20:00',
    temp: '22°C',
    avg: 15,
  },
  {
    wd: ['Do', 'Thu'],
    date: '19. Jun',
    crowd: 'moderate',
    border: 'border-border',
    hours: '09:00–20:00',
    temp: '24°C',
    avg: 30,
  },
  {
    wd: ['Fr', 'Fri'],
    date: '20. Jun',
    crowd: 'high',
    tag: 'holiday',
    border: 'border-orange-500 dark:border-orange-400',
    hours: '09:00–22:00',
    temp: '26°C',
    avg: 55,
  },
];

function MockCalendar({ locale }: { locale: MockLocale }) {
  const li = locale === 'de' ? 0 : 1;
  const bestLabel =
    locale === 'de'
      ? 'Empfohlen'
      : locale === 'es'
        ? 'Recomendado'
        : locale === 'fr'
          ? 'Recommandé'
          : locale === 'it'
            ? 'Consigliato'
            : locale === 'nl'
              ? 'Aanbevolen'
              : 'Recommended';
  const avgLabel = locale === 'de' ? 'Ø' : 'avg';

  return (
    <div className="not-prose space-y-2">
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {CALENDAR_DAYS.map(({ wd, date, crowd, tag, border, best, hours, temp, avg }) => (
          <Card key={date} className={`flex h-full flex-col gap-1 border-2 p-2 ${border}`}>
            {best && (
              <div className="flex w-full justify-center">
                <span className="flex items-center gap-1 rounded-full border border-green-500/80 bg-green-500/65 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase backdrop-blur-md dark:border-green-500/40 dark:bg-green-500/25">
                  <Star className="h-2.5 w-2.5" />
                  {bestLabel}
                </span>
              </div>
            )}
            {/* Header: weekday + date + schedule icon */}
            <div className="mb-1 flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs leading-tight font-medium">
                  {wd[li]}
                </span>
                <span className="mt-0.5 text-xs leading-tight font-semibold">{date}</span>
              </div>
              {tag === 'school' && <Backpack className="h-3.5 w-3.5 shrink-0 text-yellow-500" />}
              {tag === 'holiday' && (
                <PartyPopper className="h-3.5 w-3.5 shrink-0 text-orange-500" />
              )}
            </div>
            {/* Crowd badge */}
            <div
              className={`w-full rounded px-0.5 py-0.5 text-center text-[9px] leading-tight font-bold tracking-wide text-white uppercase ${CROWD_COLORS[crowd]}`}
            >
              {CROWD_LABELS[locale][crowd]}
            </div>
            {/* Hours */}
            <div className="text-muted-foreground flex items-center justify-center gap-1 text-[9px]">
              <Clock className="h-2.5 w-2.5" />
              <span className="hidden font-medium sm:inline">{hours}</span>
            </div>
            {/* Weather */}
            <div className="text-muted-foreground flex items-center justify-center gap-0.5 text-[9px]">
              <Sun className="h-2.5 w-2.5" />
              <span>{temp}</span>
            </div>
            {/* Avg wait */}
            <div className="text-muted-foreground text-center text-[9px]">
              {avgLabel} {avg} min
            </div>
          </Card>
        ))}
      </div>
      <p className="text-muted-foreground text-center text-[11px]">
        Phantasialand · Juni · {locale === 'de' ? 'Beispieldaten' : 'Example data'}
      </p>
    </div>
  );
}

const HOURLY_WAITS = [15, 22, 38, 55, 70, 68, 52, 40, 30, 22, 14];
const HOURLY_LABELS = ['9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h'];

function MockHourlyChart({ locale }: { locale: MockLocale }) {
  const isDE = locale === 'de';
  const maxWait = Math.max(...HOURLY_WAITS);

  function barColor(w: number) {
    if (w < 20) return 'bg-crowd-very-low';
    if (w < 35) return 'bg-crowd-low';
    if (w < 50) return 'bg-crowd-moderate';
    if (w < 65) return 'bg-crowd-high';
    return 'bg-crowd-very-high';
  }

  return (
    <div className="not-prose bg-muted/30 rounded-xl border p-4">
      <p className="mb-4 text-sm font-semibold">
        Taron ·{' '}
        {isDE ? 'Prognostizierter Wartezeit-Verlauf (Samstag)' : 'Predicted wait times (Saturday)'}
      </p>
      {/* Value labels above bars */}
      <div className="mb-1 flex gap-1">
        {HOURLY_WAITS.map((w, i) => (
          <div
            key={HOURLY_LABELS[i]}
            className="text-muted-foreground flex-1 text-center text-[9px] leading-none"
          >
            {w}
          </div>
        ))}
      </div>
      {/* Bars: items-stretch so each column fills h-20, then justify-end pushes bar to bottom */}
      <div className="flex h-20 items-stretch gap-1">
        {HOURLY_WAITS.map((w, i) => (
          <div key={HOURLY_LABELS[i]} className="flex flex-1 flex-col justify-end">
            <div
              className={`w-full rounded-t ${barColor(w)}`}
              style={{ height: `${(w / maxWait) * 100}%` }}
            />
          </div>
        ))}
      </div>
      {/* Hour labels below */}
      <div className="mt-1 flex gap-1">
        {HOURLY_LABELS.map((h) => (
          <div key={h} className="text-muted-foreground flex-1 text-center text-[9px]">
            {h}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 flex items-center gap-1 text-[11px]">
        <TrendingDown className="text-trend-down h-3.5 w-3.5 shrink-0" />
        {isDE
          ? 'Beste Slots: direkt nach Öffnung (9–10 Uhr) oder ab 18:00 Uhr'
          : 'Best slots: right at opening (9–10h) or from 18:00'}
      </p>
    </div>
  );
}

// ─── German Content ────────────────────────────────────────────────────────────

function ContentDE() {
  return (
    <div className="space-y-16 text-base leading-7">
      {/* Intro */}
      <div className="space-y-4">
        <div className="space-y-4 text-base leading-relaxed">
          <p className="text-muted-foreground text-lg font-medium">
            Kennst du das? 80 Minuten Schlange für Taron – und zehn Meter weiter läuft eine andere
            Attraktion ohne Wartezeit. Oder: du buchst deinen Urlaub und ausgerechnet in dieser
            Woche sind alle Schulen in NRW in den Ferien.
          </p>
          <p className="text-muted-foreground">
            park.fan wurde aus genau dieser Frustration heraus entwickelt. Was als kleines
            Nebenprojekt begann – „ich tracke mal ein paar Wartezeiten" – ist heute eine Plattform
            mit Live-Daten aus 150+ Parks, mehr als 5.000 Attraktionen und Millionen von
            Warteschlangen-Datenpunkten, die täglich verarbeitet werden.
          </p>
          <p className="text-muted-foreground">
            Das Ziel ist einfach:{' '}
            <strong>Nimm das Rätselraten aus deinem Freizeitpark-Besuch.</strong> Plane mit dem
            Crowd-Kalender den richtigen Tag, navigiere mit Live-Wartezeiten durch den Park und
            verlasse dich auf KI-Prognosen, die dir sagen, wann welche Attraktion am ruhigsten ist.
            Diese Seite erklärt alle Funktionen im Detail.
          </p>
        </div>
        {/* TOC */}
        <nav
          aria-label="Inhaltsverzeichnis"
          className="bg-muted/40 not-prose rounded-xl border p-5"
        >
          <p className="mb-3 font-semibold">Inhaltsverzeichnis</p>
          <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
            {[
              ['#suche', '1. Suche'],
              ['#standort', '2. Standort & Nearby'],
              ['#favoriten', '3. Favoriten'],
              ['#parkseite', '4. Die Park-Seite'],
              ['#badges', '5. Badges & Anzeigen'],
              ['#kalender', '6. Crowd-Kalender'],
              ['#prognosen', '7. KI-Prognosen'],
              ['#personas', '8. Für wen?'],
              ['#glossar', '10. Glossar'],
              ['#faq', '11. FAQ'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="hover:text-primary transition-colors">
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* ── 1. Suche ────────────────────────────────────────────────────────── */}
      <Section id="suche" title="Die Suche">
        <p className="text-muted-foreground mb-4">
          Die globale Suche ist der schnellste Weg, um einen Park, eine Attraktion, eine Show oder
          ein Restaurant zu finden – egal ob du auf dem Desktop oder dem Smartphone unterwegs bist.
        </p>

        <SubSection title="Suche öffnen">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Desktop:</strong> Drücke{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Strg + K</kbd>{' '}
              oder{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac), um die Suche jederzeit zu öffnen.
            </p>
            <p>
              <strong>Mobil & Desktop:</strong> Klicke auf das <Search className="inline h-4 w-4" />
              -Symbol in der Kopfzeile oder in das Suchfeld auf der Startseite.
            </p>
            <p>
              <strong>Tipp:</strong> Du kannst einfach anfangen zu tippen – die Suche reagiert ab 3
              Zeichen sofort.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="Was du suchen kannst">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parks', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attraktionen', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Städte & Länder', desc: 'Orlando, Paris, Deutschland...' },
              { icon: '🎭', label: 'Shows', desc: 'Showtimes, Programm, Zeiten' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Gastronomie und Imbisse im Park' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Suchergebnisse verstehen">
          <p className="text-muted-foreground text-sm">
            Jedes Ergebnis zeigt sofort den aktuellen Status an – du siehst auf einen Blick, ob ein
            Park geöffnet ist und wie hoch der Besucherandrang gerade ist. Bei Attraktionen wird die
            aktuelle Wartezeit direkt angezeigt.
          </p>
          <InfoBox>
            Die Suche verwendet intelligente Volltextsuche, die auch bei Tippfehlern funktioniert.
            Suche nach "fantasia" und du findest "Phantasialand".
          </InfoBox>
        </SubSection>

        <SubSection title="Vollständige Suchergebnisse">
          <p className="text-muted-foreground text-sm">
            Klicke auf "Alle Ergebnisse anzeigen", um zur dedizierten Suchseite zu gelangen. Dort
            findest du alle Treffer nach Kategorie sortiert.
          </p>
        </SubSection>
      </Section>
      {/* ── 2. Standort ─────────────────────────────────────────────────────── */}
      <Section id="standort" title="Standort & Nearby-Parks">
        <p className="text-muted-foreground mb-4">
          Mit deinem Standort wird park.fan noch smarter: Du siehst Parks und Attraktionen in deiner
          Nähe – sortiert nach Entfernung.
        </p>

        <SubSection title="Standort aktivieren">
          <p className="text-muted-foreground text-sm">
            Beim ersten Besuch erscheint ein Banner, das dich um Standortzugriff bittet. Die
            Zustimmung ist vollständig freiwillig. park.fan speichert deinen Standort nicht – er
            wird ausschließlich für die Nearby-Funktion genutzt und nicht an Dritte weitergegeben.
          </p>
        </SubSection>

        <SubSection title="In-Park Navigation">
          <p className="text-muted-foreground text-sm">
            Bist du im Park? park.fan erkennt automatisch, in welchem Park du dich befindest, und
            zeigt auf der Startseite "Du bist im [Parkname]". Die Karte des Parks wird mit deinem
            aktuellen Standort angezeigt – perfekt für die Navigation.
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Deine favorisierten Attraktionen werden nach Entfernung zu dir sortiert – du siehst
            immer, welche Attraktion gerade am nächsten liegt und wie lange die Wartezeit ist.
          </p>
        </SubSection>

        <NearbyParksCard className="mt-4" />
      </Section>
      {/* ── 3. Favoriten ────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favoriten">
        <p className="text-muted-foreground mb-4">
          Markiere Parks, Attraktionen, Shows und Restaurants als Favoriten, um sie jederzeit
          schnell zur Hand zu haben – direkt auf der Startseite.
        </p>

        <SubSection title="Favorit hinzufügen">
          <div className="space-y-2 text-sm">
            <p>
              Klicke auf den <Star className="inline h-4 w-4 text-yellow-500" />
              -Stern auf jeder Park- oder Attraktionskarte. Der Stern leuchtet auf – der Favorit ist
              gespeichert.
            </p>
            <p>
              Favoriten werden <strong>lokal in deinem Browser</strong> gespeichert – keine
              Anmeldung notwendig. Sie bleiben erhalten, bis du sie manuell entfernst.
            </p>
          </div>
        </SubSection>

        <SubSection title="Favoriten auf der Startseite">
          <p className="text-muted-foreground text-sm">
            Sobald du mindestens einen Favoriten gesetzt hast, erscheint auf der Startseite ein
            eigener Bereich mit allen gespeicherten Parks, Attraktionen, Shows und Restaurants. Bei
            aktiviertem Standort werden sie nach Entfernung sortiert – der nächste Park zuerst.
          </p>
          <MockNearbyCards locale="de" />
        </SubSection>

        <SubSection title="Was wird als Favorit gespeichert?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parks',
                desc: 'Status, Öffnungszeiten, Auslastung auf einen Blick',
              },
              {
                icon: '🎢',
                label: 'Attraktionen',
                desc: 'Live-Wartezeit und Trend direkt in der Übersicht',
              },
              { icon: '🎭', label: 'Shows', desc: 'Nächste Showtime immer im Blick' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Küche und aktueller Status' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox>
          Plane deinen nächsten Besuch effizienter: Speichere die 5-10 Lieblingsattraktionen deines
          Zielparks als Favoriten. Auf der Startseite siehst du dann sofort, welche davon gerade
          kurze Wartezeiten haben – ideal für die spontane Entscheidung am Besuchstag.
        </TipBox>
      </Section>

      {/* ── 4. Park-Seite ───────────────────────────────────────────────────────── */}
      <Section id="parkseite" title="Die Park-Seite">
        <p className="text-muted-foreground mb-4">
          Jeder Park auf park.fan hat eine eigene Seite mit Live-Daten, Öffnungszeiten, einem
          interaktiven Kalender und einer Karte. Hier ist, was dich erwartet.
        </p>

        <SubSection title="Kopfbereich – Schnellübersicht">
          <p className="text-muted-foreground text-sm">
            Ganz oben findest du das Park-Hero-Bild mit dem aktuellen Status (offen/geschlossen),
            den heutigen Öffnungszeiten, der aktuellen Auslastung und dem Wetter. Eine
            Fortschrittsleiste zeigt, wie lange der Park heute noch offen ist.
          </p>
          <InfoBox>
            Alle Zeiten werden in der <strong>Zeitzone des Parks</strong> angezeigt – egal wo du
            dich gerade befindest. Ein Park in Florida zeigt z.&nbsp;B. Eastern Time, Europa-Park
            Mitteleuropäische Zeit.
          </InfoBox>
          <MockParkHeader locale="de" />
        </SubSection>

        <SubSection title="Tabs – Attraktionen, Shows, Kalender, Karte">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">🎢 Attraktionen</p>
              <p className="text-muted-foreground">
                Alle Fahrgeschäfte mit Live-Wartezeit, Status, Trend und Vergleich zum Durchschnitt.
                Filtere nach Name oder sortiere nach Wartezeit.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">🎭 Shows</p>
              <p className="text-muted-foreground">
                Alle Shows mit aktuellem Status und den nächsten Showzeiten des Tages.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 Kalender</p>
              <p className="text-muted-foreground">
                30-Tage-Vorausschau mit Crowd-Prognosen, Öffnungszeiten, Wetter, Feiertagen und
                Schulferien. Der beste Weg, den richtigen Besuchstag zu finden.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">🗺️ Karte</p>
              <p className="text-muted-foreground">
                Interaktive Karte mit allen Attraktionen, Shows und Restaurants. Bei aktiviertem
                Standort siehst du auch deinen eigenen Standort im Park.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Attraktionskarte im Detail">
          <p className="text-muted-foreground text-sm">
            Jede Attraktionskarte zeigt dir auf einen Blick: aktuelle Wartezeit, Trend (steigend /
            stabil / fallend), Vergleich zum typischen Wert, das heutige Tageshoch und einen
            Mini-Graphen (Sparkline) mit dem Wartezeit-Verlauf der letzten Stunden.
          </p>
          <MockAttractionCards locale="de" />
        </SubSection>

        <SubSection title="Show-Tab: Showzeiten auf einen Blick">
          <p className="text-muted-foreground text-sm">
            Der Shows-Tab listet alle Shows des Parks mit ihren heutigen Showzeiten. Vergangene
            Zeiten werden durchgestrichen, die <strong>nächste Showtime</strong> ist grün
            hervorgehoben – so siehst du auf einen Blick, wann du wo sein musst.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Saisonale Attraktionen & Shows">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Manche Attraktionen und Shows sind nur zu bestimmten Jahreszeiten in Betrieb – zum
              Beispiel Eislaufbahnen im Winter oder Wasserbahnen im Sommer. park.fan erkennt das
              automatisch und blendet diese saisonalen Attraktionen außerhalb ihrer Saison
              standardmäßig aus.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            {/* Badge examples */}
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Winter',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: 'Attraktion ist aktuell in Saison (z. B. Winter-Event). Badge erscheint auf der Karte.',
                },
                {
                  icon: Sun,
                  label: 'Sommer',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: 'Sommer-Attraktion – z. B. Wildwasserbahn. Aktiv von Mai bis September.',
                },
                {
                  icon: Leaf,
                  label: 'Saisonal',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Außerhalb der Saison: Badge gedimmt. Attraktion in den Tabs und auf der Karte standardmäßig ausgeblendet.',
                },
              ].map(({ icon: Icon, label, color, opacity, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md',
                      color,
                      opacity
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
            {/* Toggle button demo */}
            <div className="flex items-start gap-3">
              <button className="border-border/60 bg-background/60 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md">
                <EyeOff className="h-3 w-3" />3 außer Saison
              </button>
              <p className="text-muted-foreground text-sm">
                Wenn Off-Season-Einträge versteckt sind, erscheint dieser Button neben der
                Abschnittsüberschrift. Klick darauf, um sie einzublenden – z. B. um eine
                Winter-Attraktion im Sommer zu finden.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Badges ───────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badges & Status-Anzeigen">
        <p className="text-muted-foreground mb-4">
          park.fan nutzt ein einheitliches Farbsystem, um Informationen sofort verständlich zu
          machen. Hier erklärt du alle Badges im Detail.
        </p>

        {/* Park-Status */}
        <SubSection title="Park- & Attraktionsstatus">
          <p className="text-muted-foreground mb-3 text-sm">
            Jede Attraktion und jeder Park zeigt einen von vier Statuswerten:
          </p>
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color:
                  'bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40',
                label: 'Geöffnet',
                desc: 'Attraktion / Park ist in Betrieb. Wartezeiten werden live aktualisiert.',
              },
              {
                icon: AlertTriangle,
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                label: 'Störung',
                desc: 'Vorübergehend geschlossen – z. B. technische Störung oder Sicherheitspause. Meist kurzfristig, kann sich innerhalb von Minuten ändern.',
              },
              {
                icon: XCircle,
                color:
                  'bg-status-closed/65 border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40',
                label: 'Geschlossen',
                desc: 'Heute nicht in Betrieb – saisonale Schließung oder planmäßige Ruhezeit.',
              },
              {
                icon: Wrench,
                color:
                  'bg-status-refurbishment/65 border-status-refurbishment/80 dark:bg-status-refurbishment/25 dark:border-status-refurbishment/40',
                label: 'Wartung',
                desc: 'Längere Wartungsphase. Diese Attraktionen sind für mehrere Tage oder Wochen geschlossen.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Crowd Level */}
        <SubSection title="Auslastungsstufen (Crowd Level)">
          <p className="text-muted-foreground mb-3 text-sm">
            Das Crowd Level zeigt, wie voll ein Park oder wie stark eine Attraktion ausgelastet ist
            – im Verhältnis zum historischen Median (P50), also dem typischen Wert für diese
            Attraktion. 100 % bedeutet: genau so voll wie ein durchschnittlicher Tag.
          </p>
          <div className="space-y-3">
            {[
              {
                color:
                  'bg-crowd-very-low/65 border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
                label: 'Sehr Niedrig',
                icon: User,
                threshold: '≤ 60 % des P50',
                desc: 'Kaum Betrieb – kurze bis keine Warteschlangen. Idealer Besuchstag.',
              },
              {
                color:
                  'bg-crowd-low/65 border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
                label: 'Niedrig',
                icon: User,
                threshold: '61–89 % des P50',
                desc: 'Wenig los – die meisten Attraktionen laufen mit kurzen Wartezeiten.',
              },
              {
                color:
                  'bg-crowd-moderate/65 border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
                label: 'Normal',
                icon: Users,
                threshold: '90–110 % des P50',
                desc: 'Typischer Tag – Wartezeiten im erwarteten Rahmen (±10 % des Medians).',
              },
              {
                color:
                  'bg-crowd-high/65 border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
                label: 'Hoch',
                icon: Users,
                threshold: '111–150 % des P50',
                desc: 'Viel los – Wartezeiten spürbar über dem Durchschnitt.',
              },
              {
                color:
                  'bg-crowd-very-high/65 border-crowd-very-high/80 dark:bg-crowd-very-high/25 dark:border-crowd-very-high/40',
                label: 'Sehr Hoch',
                icon: Users,
                threshold: '151–200 % des P50',
                desc: 'Sehr voll – Wartezeiten fast doppelt so lang wie üblich. Früh anreisen lohnt sich.',
              },
              {
                color:
                  'bg-crowd-extreme/65 border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
                label: 'Extrem',
                icon: AlertTriangle,
                threshold: '> 200 % des P50',
                desc: 'Rekordbetrieb – mehr als doppelt so voll wie an einem typischen Tag. Schulferien-Wochenenden, Sondertage.',
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[100px] flex-col gap-1 sm:min-w-[120px]">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
          <InfoBox>
            <strong>Wie wird das Crowd Level berechnet?</strong> park.fan vergleicht die aktuelle
            durchschnittliche Wartezeit mit dem historischen Median (P50) – dem typischen Wert für
            diese Attraktion. Eine Auslastung von 100 % bedeutet: genau so voll wie ein
            durchschnittlicher Tag. Bei 60 % ist es deutlich ruhiger, bei 200 % doppelt so voll wie
            üblich.
          </InfoBox>
        </SubSection>

        {/* Trend */}
        <SubSection title="Trend-Indikatoren">
          <p className="text-muted-foreground mb-3 text-sm">
            Neben der aktuellen Wartezeit zeigt ein Pfeil den Trend der letzten 30 Minuten:
          </p>
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'Steigend',
                desc: 'Die Warteschlange wird länger. Jetzt anstellen lohnt sich noch.',
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Stabil',
                desc: 'Die Wartezeit bleibt konstant.',
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'Fallend',
                desc: 'Die Warteschlange wird kürzer – günstiger Moment zum Anstellen.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-24 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Vergleichs-Badge */}
        <SubSection title="Vergleichs-Badge (vs. Typisch)">
          <p className="text-muted-foreground mb-3 text-sm">
            Dieser Badge vergleicht die aktuelle Auslastung mit dem historischen Durchschnittswert
            für diesen Tag und diese Uhrzeit:
          </p>
          <div className="space-y-2">
            {[
              {
                color:
                  'bg-crowd-very-low/65 border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
                label: 'Viel Niedriger',
                icon: Activity,
                desc: 'Deutlich weniger los als typischerweise – ideale Bedingungen.',
              },
              {
                color:
                  'bg-crowd-low/65 border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
                label: 'Niedriger',
                icon: Activity,
                desc: 'Etwas weniger Betrieb als üblich.',
              },
              {
                color:
                  'bg-crowd-moderate/65 border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
                label: 'Typisch',
                icon: Activity,
                desc: 'Wie erwartet für diese Zeit – keine Überraschungen.',
              },
              {
                color:
                  'bg-crowd-high/65 border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
                label: 'Höher',
                icon: Activity,
                desc: 'Mehr los als normalerweise – Wartezeiten etwas länger.',
              },
              {
                color:
                  'bg-crowd-extreme/65 border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
                label: 'Viel Höher',
                icon: Activity,
                desc: 'Ungewöhnlich voll – außergewöhnliche Situation (Sonderevent, Schulferien-Peak).',
              },
            ].map(({ color, label, icon, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Warteschlangen-Typen */}
        <SubSection title="Warteschlangen-Typen">
          <p className="text-muted-foreground mb-3 text-sm">
            Viele Parks bieten neben der normalen Warteschlange zusätzliche Optionen:
          </p>
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Single Rider',
                termId: 'single-rider',
                desc: 'Einzelfahrer-Schlange. Oft deutlich kürzer als die reguläre Schlange, aber du kannst nicht mit Begleitern fahren.',
              },
              {
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: 'Kostenpflichtiger Express-Pass (z. B. bei Disney). Zeigt den aktuellen Preis und die Rückkehrzeit.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Rückkehrzeit',
                termId: 'virtual-queue',
                desc: 'Kostenlose virtuelle Schlange – du holst dir einen Zeitslot und kehrst zur angezeigten Uhrzeit zurück.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Boarding Group',
                termId: 'boarding-group',
                desc: 'Virtuelle Warteschlange mit Gruppenummer. Beliebt bei sehr gefragten neuen Attraktionen.',
              },
            ].map(({ color, icon, label, termId, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} termId={termId} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Stoßzeit-Badge */}
        <SubSection title="Stoßzeit-Badge">
          <div className="flex items-start gap-3">
            <DemoBadge
              color="bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40"
              label="in 1 Std. 30 Min."
              icon={Clock}
            />
            <p className="text-muted-foreground text-sm">
              Dieser Badge erscheint im Park-Kopfbereich und zeigt, wie lange es noch bis zur
              prognostizierten Stoßzeit des Tages dauert. Er verschwindet automatisch, wenn die
              Stoßzeit vorüber ist.
            </p>
          </div>
        </SubSection>
      </Section>

      {/* ── 6. Kalender ─────────────────────────────────────────────────────── */}
      <Section id="kalender" title="Der Crowd-Kalender">
        <p className="text-muted-foreground mb-4">
          Der Kalender ist das mächtigste Werkzeug auf park.fan, wenn du deinen Besuch im Voraus
          planst. Er zeigt für jeden Tag der nächsten 30+ Tage eine KI-Prognose mit Crowd-Level,
          Öffnungszeiten, Wetter und besonderen Ereignissen – alles auf einen Blick.
        </p>

        <SubSection title="Was steht in jeder Kalender-Karte?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">Eine typische Kalender-Karte zeigt:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Datum und Wochentag</strong>
              </li>
              <li>
                🎯 <strong>Crowd-Level-Badge</strong> (z. B. „Sehr Hoch") – die KI-Prognose für den
                Gesamtandrang
              </li>
              <li>
                🕐 <strong>Öffnungszeiten</strong> – oder „Est." wenn noch nicht offiziell bestätigt
                (s. u.)
              </li>
              <li>
                🌤️ <strong>Wettervorhersage</strong> mit Min-/Max-Temperatur
              </li>
              <li>
                ⌚ <strong>Ø Wartezeit</strong> – prognostizierte durchschnittliche Wartezeit aller
                Attraktionen
              </li>
              <li>
                🎟️ <strong>Ticketpreis</strong>, wenn vom Park veröffentlicht
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>Was bedeutet „Est."?</strong> Öffnungszeiten mit dem Zusatz „Est." (Estimated /
            Geschätzt) wurden noch nicht offiziell vom Park bestätigt. park.fan leitet sie aus
            historischen Mustern ab – sie können sich noch ändern.
          </p>
        </SubSection>

        <SubSection title="Legende – Icons in den Kalender-Karten">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Gesetzlicher Feiertag',
                desc: 'Parks sind oft länger geöffnet, aber auch voller. Prüfe die Prognose!',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'Schulferien',
                desc: 'Erfahrungsgemäß die vollsten Tage des Jahres – extreme Wartezeiten möglich.',
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Brückentag',
                desc: 'Voraussichtlicher Brückentag (z. B. zwischen Feiertag und Wochenende) – oft erhöhter Andrang.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Park geschlossen',
                desc: 'Kein Betrieb an diesem Tag – keine Prognose verfügbar.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Praxisbeispiel: Den besten Besuchstag finden">
          <p className="text-muted-foreground mb-3 text-sm">
            Du planst einen Besuch im Europa-Park im Oktober. So gehst du vor:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Öffne die Park-Seite und wechsle zum Tab <strong>Kalender</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Du siehst sofort: Die Ferienwochen in Baden-Württemberg und NRW haben viele Karten
                mit dem <Backpack className="inline h-4 w-4 text-yellow-500" />
                -Icon und dem Badge <strong>„Sehr Hoch"</strong> oder <strong>„Extrem"</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Suche dir einen Dienstag oder Mittwoch <em>ohne</em> Ferienicon – diese zeigen oft{' '}
                <strong>„Niedrig"</strong> oder <strong>„Normal"</strong>. Öffnungszeiten und
                Wetterprognose helfen dir, die finale Entscheidung zu treffen.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Merke dir den Tag und buche Tickets frühzeitig – besonders an prognostizierten
                grünen Tagen sind die Kontingente oft begrenzt.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="de" />
          </div>
        </SubSection>

        <SubSection title="Attraktion-Kalender">
          <p className="text-muted-foreground text-sm">
            Auf der Detailseite einer Attraktion gibt es ebenfalls einen Verlaufs-Kalender. Er zeigt
            für jeden vergangenen Tag, wie stark die Attraktion ausgelastet war – und ob sie in
            Betrieb war oder nicht. Das ist ideal, um wiederkehrende Muster zu erkennen: Hatte Taron
            in den letzten vier Wochen immer donnerstags kurze Wartezeiten? Dann könnte das auch
            nächste Woche so sein.
          </p>
        </SubSection>

        <TipBox>
          Die besten Besuchstage sind frühe Wochentage außerhalb der Schulferien – Dienstag bis
          Donnerstag zeigen oft die niedrigsten Crowd-Level. Vermeide insbesondere Schulferienwochen
          der bevölkerungsreichen Bundesländer NRW, Bayern und Baden-Württemberg.
        </TipBox>
      </Section>

      {/* ── 7. KI-Prognosen ─────────────────────────────────────────────────────── */}
      <Section id="prognosen" title="KI-gestützte Prognosen">
        <p className="text-muted-foreground mb-4">
          park.fan nutzt maschinelles Lernen, um Besucherandrang und Wartezeiten Tage im Voraus
          vorherzusagen. Das Modell wird kontinuierlich mit neuen Daten trainiert und berücksichtigt
          dabei vier Hauptfaktoren:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Historische Daten',
              desc: 'Millionen von Warteschlangen-Datenpunkten aus der Vergangenheit – pro Attraktion, Wochentag und Uhrzeit.',
            },
            {
              icon: '📅',
              title: 'Ferienkalender',
              desc: 'Schulferien aller deutschen Bundesländer sowie nationaler Feiertage in ganz Europa.',
            },
            {
              icon: '🌤️',
              title: 'Wetterprognosen',
              desc: 'Temperatur, Niederschlag und Sonnenstunden – Regen treibt mehr Besucher zu Indoorattraktionen.',
            },
            {
              icon: '🎉',
              title: 'Sonderevents',
              desc: 'Halloween-Nights, Winter-Events und andere Parksondertage erzeugen deutlich höheren Andrang.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            </div>
          ))}
        </div>

        <SubSection title="Wo finde ich die Prognosen?">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 Im Crowd-Kalender</p>
              <p className="text-muted-foreground mt-0.5">
                Jede Kalenderkarte enthält eine Tagesprognose: Crowd-Level, Ø Wartezeit und
                Öffnungszeiten – bis zu 30+ Tage im Voraus.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Stoßzeit-Badge auf der Park-Seite</p>
              <p className="text-muted-foreground mt-0.5">
                Im Park-Kopfbereich zeigt ein Badge, wann heute voraussichtlich die Stoßzeit ist –
                z. B. „Stoßzeit in 1 Std. 30 Min.". So kannst du eine Pause oder den Besuch einer
                weniger beliebten Attraktion genau dann einplanen.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📈 Stündliche Prognosekurve auf der Attraktions-Seite</p>
              <p className="text-muted-foreground mt-0.5">
                Jede Attraktion hat eine eigene Seite mit einer Kurve, die zeigt, wie sich die
                Wartezeit über den Tag verteilt – mit dem prognostizierten Verlauf für heute und
                morgen.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Praxisbeispiel: Prognose im Alltag nutzen">
          <p className="text-muted-foreground mb-3 text-sm">
            Du bist an einem Samstag in den Herbstferien in Phantasialand. Der Kalender zeigt „Sehr
            Hoch" für den Tag. So nutzt du die Prognosen:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>Morgens beim Betreten:</strong> Der Stoßzeit-Badge zeigt „Stoßzeit in ca. 2
                Std." – du hast also bis ca. 11:30 Uhr Zeit für die ersten Highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Taron-Seite aufrufen:</strong> Die Prognosekurve zeigt heute 9:30 Uhr ≈ 15
                Min., 12:00 Uhr ≈ 65 Min., 15:00 Uhr ≈ 40 Min. → Du weißt: direkt nach Öffnung oder
                Mitte des Nachmittags sind die besten Slots.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Mittagspause zur Stoßzeit:</strong> Statt um 12 Uhr in der Schlange zu
                stehen, gönnst du dir das Restaurant. Die Live-Trends zeigen: um 15 Uhr fällt die
                Wartezeit wieder – perfekter Moment für Taron.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="Wie genau sind die Prognosen?">
          <p className="text-muted-foreground text-sm">
            Die Genauigkeit variiert je nach Park und Vorhersagezeitraum. Auf der
            Attraktionsdetailseite wird die Prognose-Genauigkeit für jede Attraktion angezeigt – von{' '}
            <strong>Schlecht</strong> bis <strong>Exzellent</strong>. Je mehr historische Daten
            vorhanden sind, desto präziser die Prognose. Kurzfristige Vorhersagen (1–3 Tage) sind
            grundsätzlich zuverlässiger als langfristige (7–14 Tage).
          </p>
        </SubSection>

        <SubSection title="Wartezeit-Sparklines">
          <p className="text-muted-foreground text-sm">
            Auf jeder Attraktionskarte zeigt ein kleiner Liniengraph (Sparkline) den
            Wartezeit-Verlauf der letzten Stunden. So erkennst du sofort Trends: War es morgens
            ruhig und steigt die Wartezeit jetzt rapide an – oder fällt sie gerade?
          </p>
          <MockHourlyChart locale="de" />
        </SubSection>

        <TipBox>
          Kombiniere Kalender und Prognose: Suche dir im Kalender einen grünen Tag aus, dann schau
          auf der Attraktionsseite, zu welcher Stunde die Prognosekurve am tiefsten ist. So triffst
          du immer zum richtigen Moment auf die kürzeste Schlange.
        </TipBox>
      </Section>

      {/* ── 8. Personas ─────────────────────────────────────────────────────── */}
      <Section id="personas" title="Für wen eignet sich park.fan?">
        <p className="text-muted-foreground mb-6">
          park.fan ist für alle Freizeitpark-Fans gemacht – egal ob du mit der Familie, als
          leidenschaftlicher Enthusiast oder zum ersten Mal in einem Park bist.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Die Familie"
            subtitle="Plant einen unvergesslichen Ausflug für alle"
          >
            <Li>
              Crowd-Kalender: Welcher Tag hat die kürzesten Warteschlangen? Perfekt um den Urlaub zu
              planen.
            </Li>
            <Li>Wetter im Kalender: Plant ihr für einen Regentag? Indoor-Attraktionen prüfen!</Li>
            <Li>
              Favoriten: Speichere die 10 wichtigsten Attraktionen für Kinder – sieh sofort, welche
              gerade offen und kurz sind.
            </Li>
            <Li>
              Live-Wartezeiten: Entscheidet spontan, welches Fahrgeschäft als nächstes dran ist.
            </Li>
            <Li>
              Stoßzeit-Badge: Wisst ihr, wann es am vollsten wird – und könnt vorher eine Pause
              einplanen.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Der Freizeitparknerd"
            subtitle="Jede Minute im Park muss optimal genutzt werden"
          >
            <Li>
              Crowd Level (P50-Basis): Verstehe, ob eine Attraktion gerade wirklich
              überdurchschnittlich voll ist – oder nur "normal".
            </Li>
            <Li>
              Historischer Verlauf: Wann hatte Taron in den letzten Wochen typischerweise kurze
              Wartezeiten?
            </Li>
            <Li>
              Trend-Indikatoren: Steigt die Schlange gerade? Warte noch 20 Minuten und sie könnte
              kürzer sein.
            </Li>
            <Li>
              Single Rider / Lightning Lane: park.fan zeigt alle verfügbaren Warteschlangen-Typen
              mit aktuellen Zeiten und Preisen.
            </Li>
            <Li>
              Vergleichs-Badge: Ist heute wirklich "viel höher" als typisch? Dann ist es Zeit für
              Plan B.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Der Erstbesucher"
            subtitle="Zum ersten Mal in einem großen Freizeitpark"
          >
            <Li>Suche: Finde deinen Park schnell – auch wenn du den genauen Namen nicht weißt.</Li>
            <Li>
              Park-Karte: Orientiere dich mit der interaktiven Karte, bevor und während du im Park
              bist.
            </Li>
            <Li>
              Status-Badges: Grün = läuft, Orange = kurze Störung, Grau = heute nicht, Lila =
              längere Wartung. Einfach und klar.
            </Li>
            <Li>
              Crowd-Kalender: Welcher Tag ist der beste? Die Farben sagen alles – Grün ist gut, Rot
              ist stressig.
            </Li>
            <Li>Öffnungszeiten: Immer aktuell – inklusive Sonderöffnungszeiten an Feiertagen.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Der Spontanbesucher"
            subtitle="Kurz entschlossen – maximale Effizienz gewünscht"
          >
            <Li>
              Standort-Funktion: park.fan erkennt automatisch deinen nächsten Park – kein Suchen
              nötig.
            </Li>
            <Li>
              Live-Wartezeiten: Sofort sehen, was gerade offen ist und wie lange die Wartezeit ist.
            </Li>
            <Li>Trend-Indikatoren: Warteschlange fällt gerade? Perfekter Moment zum Anstellen.</Li>
            <Li>
              Favoriten: Wenn du den Park schon kennst, hast du deine Top-Attraktionen schon
              gespeichert.
            </Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Beliebte Parks ───────────────────────────────────────────────── */}
      <Section id="parks" title="Beliebte Parks">
        <p className="text-muted-foreground mb-6">
          park.fan deckt über 150 Freizeitparks weltweit ab – von Walt Disney World bis Europa-Park.
          Hier sind die meistbesuchten Parks in deiner Region mit aktuellen Live-Daten:
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Glossar ───────────────────────────────────────────────────── */}
      <Section id="glossar" title="Das Glossar & Fachbegriff-Hervorhebung">
        <p className="text-muted-foreground mb-4">
          park.fan pflegt ein vollständiges{' '}
          <Link href="/glossar" className="text-primary underline">
            Glossar der Freizeitpark-Fachbegriffe
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {
              'von Wartezeit über Besucherkalender bis zu Achterbahn-Elementen. Jeder Begriff enthält eine Kurzdefinition und eine ausführliche Erklärung mit praktischen Tipps.'
            }
          </GlossaryInject>
        </p>

        <SubSection title="Automatische Fachbegriff-Hervorhebung auf Attraktions-Seiten">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {
                'Auf Attraktions-Seiten werden Glossar-Begriffe im Text automatisch erkannt und mit einer gestrichelten Linie unterstrichen. Beim Hovern erscheint eine Kurzbeschreibung – ein Klick führt direkt zum vollständigen Glossar-Eintrag.'
              }
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Beispieltext (hover über die gestrichelten Begriffe)
            </p>
            <p>
              <GlossaryInject>
                {`Die beste Strategie für einen Freizeitpark-Besuch ist, vorab einen Blick in den Besucherkalender zu werfen. An einem Spitzentag können die Wartezeiten für beliebte Attraktionen 90 Minuten überschreiten. Wer einen Express Pass kauft oder die Einzelfahrer-Lane nutzt, spart wertvolle Zeit. Alternativ bietet eine virtuelle Warteschlange die Möglichkeit, die Schlange komplett zu umgehen – ideal, wenn die Besucherdichte hoch ist.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Tipp">
          Das vollständige Glossar ist unter{' '}
          <Link href="/glossar" className="text-primary font-medium underline">
            park.fan/glossar
          </Link>{' '}
          <GlossaryInject>
            {
              'erreichbar – mit Begriffen aus 7 Kategorien: Wartezeiten, Besucherdichte, Park-Betrieb, Planung, Attraktionen, Achterbahnen und Achterbahn-Elemente.'
            }
          </GlossaryInject>
        </TipBox>
      </Section>

      {/* ── 11. FAQ ─────────────────────────────────────────────────────────── */}
      <Section id="faq" title="Häufige Fragen">
        <div className="space-y-4">
          {[
            {
              q: 'Wie oft werden die Wartezeiten aktualisiert?',
              a: 'Die Wartezeiten werden minütlich aktualisiert. Bei manchen Parks erfolgt die Aktualisierung alle 2–5 Minuten, abhängig von der Datenverfügbarkeit.',
            },
            {
              q: 'Woher kommen die Daten?',
              a: 'park.fan bezieht Live-Daten von ThemeParks.wiki, Queue-Times.com und Wartezeiten.app – alles offizielle oder weit verbreitete Quellen für Freizeitpark-Daten.',
            },
            {
              q: 'Ist park.fan kostenlos?',
              a: 'Ja, park.fan ist vollständig kostenlos und erfordert keine Anmeldung.',
            },
            {
              q: 'Werden meine Favoriten auf anderen Geräten gespeichert?',
              a: 'Nein, Favoriten werden lokal im Browser gespeichert (localStorage). Sie sind auf dem Gerät verfügbar, auf dem du sie gesetzt hast.',
            },
            {
              q: 'Warum sehe ich keine Wartezeiten für meinen Park?',
              a: 'Nicht alle Parks bieten offizielle Live-Daten. Manche Parks übermitteln keine Echtzeitdaten – in diesem Fall zeigt park.fan den Betriebsstatus, aber keine konkreten Wartezeiten.',
            },
            {
              q: 'Was bedeutet "Öffnungszeit: Est."?',
              a: 'Est. (Estimated / Geschätzt) bedeutet, dass die Öffnungszeiten noch nicht offiziell vom Park bestätigt wurden. park.fan leitet sie aus historischen Mustern ab – sie können sich noch ändern.',
            },
            {
              q: 'Wie weit in die Zukunft reicht der Crowd-Kalender?',
              a: 'Der Kalender zeigt Prognosen für die nächsten 30+ Tage. Weiter entfernte Daten sind naturgemäß etwas weniger präzise als Prognosen für morgen oder übermorgen.',
            },
            {
              q: 'Wie viele Parks sind abgedeckt?',
              a: 'Aktuell deckt park.fan über 150 Parks mit mehr als 5.000 Attraktionen weltweit ab – von Walt Disney World über Europa-Park bis zu Parks in Asien und Australien.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  {q}
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── English Content ───────────────────────────────────────────────────────────

function IntroEN() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 text-base leading-relaxed">
        <p className="text-muted-foreground text-lg font-medium">
          Sound familiar? You're standing in an 80-minute queue for Taron – and just ten metres away
          another ride has no wait at all. Or: you book your holiday and discover that every school
          in the country is on break that exact week.
        </p>
        <p className="text-muted-foreground">
          park.fan was built out of exactly that frustration. What started as a small side project –
          "let me just track some wait times" – has grown into a platform with live data from 150+
          parks, over 5,000 attractions and millions of queue data points processed every day.
        </p>
        <p className="text-muted-foreground">
          The goal is simple: <strong>take the guesswork out of your theme park visit.</strong> Use
          the crowd calendar to pick the right day, navigate with live wait times, and rely on AI
          predictions to know when each ride will be at its quietest. This page explains every
          feature in detail.
        </p>
      </div>
      <nav aria-label="Table of Contents" className="bg-muted/40 not-prose rounded-xl border p-5">
        <p className="mb-3 font-semibold">Table of Contents</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Search'],
            ['#standort', '2. Location & Nearby'],
            ['#favoriten', '3. Favorites'],
            ['#parkseite', '4. The Park Page'],
            ['#badges', '5. Badges & Indicators'],
            ['#kalender', '6. Crowd Calendar'],
            ['#prognosen', '7. AI Predictions'],
            ['#personas', '8. Who is it for?'],
            ['#glossar', '10. Glossary'],
            ['#faq', '11. FAQ'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="hover:text-primary transition-colors">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

function IntroES() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 text-base leading-relaxed">
        <p className="text-muted-foreground text-lg font-medium">
          ¿Te resulta familiar? 80 minutos de cola para Taron y, a diez metros de distancia, otra
          atracción sin espera. O reservas tus vacaciones y descubres que esa semana hay vacaciones
          escolares en toda la región.
        </p>
        <p className="text-muted-foreground">
          park.fan nació de esa misma frustración. Lo que empezó como un pequeño proyecto personal –
          &quot;solo voy a rastrear algunos tiempos de espera&quot; – se ha convertido en una
          plataforma con datos en directo de más de 150 parques, más de 5.000 atracciones y millones
          de registros de colas procesados cada día.
        </p>
        <p className="text-muted-foreground">
          El objetivo es simple:{' '}
          <strong>elimina las conjeturas de tu visita al parque temático.</strong> Usa el calendario
          de afluencia para elegir el mejor día, navega con tiempos de espera en directo y aprovecha
          las predicciones de IA para saber cuándo cada atracción tendrá menos cola. Esta página
          explica cada función en detalle.
        </p>
      </div>
      <nav
        aria-label="Índice de contenidos"
        className="bg-muted/40 not-prose rounded-xl border p-5"
      >
        <p className="mb-3 font-semibold">Índice de contenidos</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Búsqueda'],
            ['#standort', '2. Ubicación'],
            ['#favoriten', '3. Favoritos'],
            ['#parkseite', '4. La página del parque'],
            ['#badges', '5. Insignias y estados'],
            ['#kalender', '6. Calendario de afluencia'],
            ['#prognosen', '7. Predicciones IA'],
            ['#personas', '8. ¿Para quién?'],
            ['#parks', '9. Parques populares'],
            ['#glossar', '10. Glosario'],
            ['#faq', '11. Preguntas frecuentes'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="hover:text-primary transition-colors">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

function IntroFR() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 text-base leading-relaxed">
        <p className="text-muted-foreground text-lg font-medium">
          Ça te parle ? 80 minutes de queue pour Taron — et à dix mètres de là, une autre attraction
          sans attente. Ou encore : tu réserves tes vacances et tu découvres que c&apos;est
          exactement la semaine des congés scolaires dans toute la région.
        </p>
        <p className="text-muted-foreground">
          park.fan est né de cette frustration. Ce qui a commencé comme un petit projet personnel –
          &quot;je vais juste suivre quelques temps d&apos;attente&quot; – est devenu une plateforme
          avec des données en direct de plus de 150 parcs, plus de 5 000 attractions et des millions
          de points de données traités chaque jour.
        </p>
        <p className="text-muted-foreground">
          L&apos;objectif est simple :{' '}
          <strong>éliminer les approximations lors de ta visite en parc d&apos;attractions.</strong>{' '}
          Utilise le calendrier d&apos;affluence pour choisir le bon jour, navigue avec des temps
          d&apos;attente en direct et compte sur les prédictions IA pour savoir quand chaque
          attraction sera la moins fréquentée. Cette page explique chaque fonctionnalité en détail.
        </p>
      </div>
      <nav aria-label="Table des matières" className="bg-muted/40 not-prose rounded-xl border p-5">
        <p className="mb-3 font-semibold">Table des matières</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Recherche'],
            ['#standort', '2. Localisation'],
            ['#favoriten', '3. Favoris'],
            ['#parkseite', '4. La page du parc'],
            ['#badges', '5. Badges et statuts'],
            ['#kalender', "6. Calendrier d'affluence"],
            ['#prognosen', '7. Prédictions IA'],
            ['#personas', '8. Pour qui ?'],
            ['#parks', '9. Parcs populaires'],
            ['#glossar', '10. Glossaire'],
            ['#faq', '11. FAQ'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="hover:text-primary transition-colors">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

function IntroIT() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 text-base leading-relaxed">
        <p className="text-muted-foreground text-lg font-medium">
          Ti suona familiare? 80 minuti di coda per Taron — e a dieci metri di distanza
          un&apos;altra attrazione senza attesa. Oppure: prenoti le vacanze e scopri che quella
          settimana ci sono le vacanze scolastiche in tutta la regione.
        </p>
        <p className="text-muted-foreground">
          park.fan è nato da questa stessa frustrazione. Quello che è iniziato come un piccolo
          progetto personale – &quot;voglio solo tracciare alcuni tempi di attesa&quot; – è
          diventato una piattaforma con dati in tempo reale da oltre 150 parchi, più di 5.000
          attrazioni e milioni di dati sulle code elaborati ogni giorno.
        </p>
        <p className="text-muted-foreground">
          L&apos;obiettivo è semplice:{' '}
          <strong>elimina le congetture dalla tua visita al parco divertimenti.</strong> Usa il
          calendario dell&apos;affluenza per scegliere il giorno migliore, naviga con i tempi di
          attesa in diretta e affidati alle previsioni IA per sapere quando ogni attrazione avrà
          meno coda. Questa pagina spiega ogni funzione in dettaglio.
        </p>
      </div>
      <nav aria-label="Indice" className="bg-muted/40 not-prose rounded-xl border p-5">
        <p className="mb-3 font-semibold">Indice</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Ricerca'],
            ['#standort', '2. Posizione'],
            ['#favoriten', '3. Preferiti'],
            ['#parkseite', '4. La pagina del parco'],
            ['#badges', '5. Badge e stati'],
            ['#kalender', '6. Calendario affluenza'],
            ['#prognosen', '7. Previsioni IA'],
            ['#personas', '8. Per chi?'],
            ['#parks', '9. Parchi popolari'],
            ['#glossar', '10. Glossario'],
            ['#faq', '11. FAQ'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="hover:text-primary transition-colors">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

function IntroNL() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 text-base leading-relaxed">
        <p className="text-muted-foreground text-lg font-medium">
          Klinkt dit bekend? 80 minuten in de rij voor Taron — en tien meter verderop staat er
          niemand bij een andere attractie. Of: je boekt je vakantie en ontdekt dat die week precies
          de schoolvakantie valt.
        </p>
        <p className="text-muted-foreground">
          park.fan is gebouwd vanuit precies die frustratie. Wat begon als een klein zijproject –
          &quot;ik ga gewoon wat wachttijden bijhouden&quot; – is uitgegroeid tot een platform met
          live data van 150+ parken, meer dan 5.000 attracties en miljoenen wachtrij-datapunten die
          dagelijks worden verwerkt.
        </p>
        <p className="text-muted-foreground">
          Het doel is eenvoudig: <strong>neem het giswerk weg uit je pretparkbezoek.</strong>{' '}
          Gebruik de drukte-kalender om de juiste dag te kiezen, navigeer met live wachttijden en
          vertrouw op AI-voorspellingen om te weten wanneer elke attractie het rustigst is. Deze
          pagina legt elke functie in detail uit.
        </p>
      </div>
      <nav aria-label="Inhoudsopgave" className="bg-muted/40 not-prose rounded-xl border p-5">
        <p className="mb-3 font-semibold">Inhoudsopgave</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Zoeken'],
            ['#standort', '2. Locatie'],
            ['#favoriten', '3. Favorieten'],
            ['#parkseite', '4. De parkpagina'],
            ['#badges', '5. Badges & statussen'],
            ['#kalender', '6. Drukte-kalender'],
            ['#prognosen', '7. AI-voorspellingen'],
            ['#personas', '8. Voor wie?'],
            ['#parks', '9. Populaire parken'],
            ['#glossar', '10. Woordenlijst'],
            ['#faq', '11. FAQ'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="hover:text-primary transition-colors">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

// Sections are shared across EN / ES / FR / IT / NL
function ContentENSections() {
  return (
    <>
      {/* ── 1. Search ───────────────────────────────────────────────────────── */}
      <Section id="suche" title="Search">
        <p className="text-muted-foreground mb-4">
          The global search is the fastest way to find a park, attraction, show or restaurant –
          whether you're on desktop or mobile.
        </p>

        <SubSection title="Opening the search">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Desktop:</strong> Press{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              or <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) to open the search at any time.
            </p>
            <p>
              <strong>Mobile & Desktop:</strong> Tap the <Search className="inline h-4 w-4" /> icon
              in the header or the search field on the homepage.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="What you can search for">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parks', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attractions', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Cities & Countries', desc: 'Orlando, Paris, Germany...' },
              { icon: '🎭', label: 'Shows', desc: 'Show schedules and times' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Dining options inside parks' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <InfoBox label="Note">
          The search uses smart full-text search that works even with typos. Search for
          &quot;fantasia&quot; and you&apos;ll find &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>
      {/* ── 2. Location ─────────────────────────────────────────────────────── */}
      <Section id="standort" title="Location & Nearby Parks">
        <p className="text-muted-foreground mb-4">
          With your location enabled, park.fan becomes smarter: see nearby parks and attractions
          sorted by distance. park.fan does not store your location.
        </p>
        <SubSection title="In-Park Navigation">
          <p className="text-muted-foreground text-sm">
            When you're in a park, park.fan automatically detects which park you're in and shows
            "You're in [Park Name]" on the homepage. The park map displays your live location –
            perfect for navigating between rides.
          </p>
        </SubSection>

        <NearbyParksCard />
      </Section>
      {/* ── 3. Favorites ────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favorites">
        <p className="text-muted-foreground mb-4">
          Save parks, attractions, shows and restaurants as favorites for quick access directly on
          the homepage.
        </p>

        <SubSection title="Adding a favorite">
          <p className="text-sm">
            Click the <Star className="inline h-4 w-4 text-yellow-500" /> star on any park or
            attraction card. Favorites are saved locally in your browser – no login required.
          </p>
        </SubSection>

        <SubSection title="Favorites on the homepage">
          <p className="text-muted-foreground text-sm">
            Once you have at least one favorite, a dedicated section appears on the homepage showing
            all saved parks, attractions, shows and restaurants. With location enabled, they are
            sorted by distance – nearest first.
          </p>
          <MockNearbyCards locale="en" />
        </SubSection>

        <SubSection title="What gets saved?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parks',
                desc: 'Status, opening hours and crowd level at a glance',
              },
              {
                icon: '🎢',
                label: 'Attractions',
                desc: 'Live wait time and trend directly in the overview',
              },
              { icon: '🎭', label: 'Shows', desc: 'Next showtime always visible' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Kitchen status and location' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox label="Tip">
          Save your 5–10 favorite attractions at your target park. On the day of your visit,
          you&apos;ll instantly see which ones have short wait times – great for on-the-fly
          decisions.
        </TipBox>
      </Section>

      {/* ── 4. Park Page ────────────────────────────────────────────────────── */}
      <Section id="parkseite" title="The Park Page">
        <p className="text-muted-foreground mb-4">
          Every park has its own page with live data, opening hours, an interactive calendar and a
          map.
        </p>
        <InfoBox label="Note">
          All times are displayed in the <strong>park&apos;s local timezone</strong> — regardless of
          where you are. A park in Florida shows Eastern Time, Europa-Park shows Central European
          Time.
        </InfoBox>
        <MockParkHeader locale="en" />

        <SubSection title="Tabs – Attractions, Shows, Calendar, Map">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Attractions',
                desc: 'All rides with live wait time, status, trend and comparison to average.',
              },
              {
                icon: '🎭',
                label: 'Shows',
                desc: 'All shows with current status and upcoming showtimes.',
              },
              {
                icon: '📅',
                label: 'Calendar',
                desc: '30+ day outlook with crowd predictions, weather, holidays and school vacations.',
              },
              {
                icon: '🗺️',
                label: 'Map',
                desc: 'Interactive map with all attractions, shows and restaurants.',
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold">
                  {icon} {label}
                </p>
                <p className="text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <MockAttractionCards locale="en" />
        </SubSection>

        <SubSection title="Shows Tab: Showtimes at a Glance">
          <p className="text-muted-foreground text-sm">
            The Shows tab lists all shows with their showtimes for today. Past times are struck
            through, the <strong>next showtime</strong> is highlighted in green — so you always know
            when and where to be.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Seasonal Attractions & Shows">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Some seasonal attractions and shows only operate during certain months — like ice
              rinks in winter or water rides in summer. park.fan detects this automatically and
              hides those entries outside their season by default.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Winter',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: 'Attraction is currently in season (e.g. a winter event). Badge appears on the card.',
                },
                {
                  icon: Sun,
                  label: 'Summer',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: 'Summer attraction – e.g. a water ride. Active from May to September.',
                },
                {
                  icon: Leaf,
                  label: 'Seasonal',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Off-season: badge is dimmed. Attraction hidden in tabs and on the map by default.',
                },
              ].map(({ icon: Icon, label, color, opacity, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md',
                      color,
                      opacity
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <button className="border-border/60 bg-background/60 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md">
                <EyeOff className="h-3 w-3" />3 off-season
              </button>
              <p className="text-muted-foreground text-sm">
                When off-season entries are hidden, this button appears next to the section heading.
                Click it to reveal them — useful if you want to find a winter attraction in summer,
                for example.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Badges ───────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badges & Status Indicators">
        <p className="text-muted-foreground mb-4">
          park.fan uses a consistent color system to make information immediately understandable.
        </p>

        <SubSection title="Park & Attraction Status">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color:
                  'bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40',
                label: 'Operating',
                desc: 'Attraction / park is running. Wait times are updated live.',
              },
              {
                icon: AlertTriangle,
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                label: 'Down',
                desc: 'Temporarily closed – e.g. technical issue or safety pause. Usually brief.',
              },
              {
                icon: XCircle,
                color:
                  'bg-status-closed/65 border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40',
                label: 'Closed',
                desc: 'Not operating today – seasonal closure or scheduled rest day.',
              },
              {
                icon: Wrench,
                color:
                  'bg-status-refurbishment/65 border-status-refurbishment/80 dark:bg-status-refurbishment/25 dark:border-status-refurbishment/40',
                label: 'Refurbishment',
                desc: 'Extended maintenance. Closed for days or weeks.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Crowd Levels">
          <p className="text-muted-foreground mb-3 text-sm">
            The crowd level shows how busy a park or attraction is relative to the historical median
            wait time (P50) – the typical value for that attraction. 100% means exactly as busy as
            an average day.
          </p>
          <div className="space-y-3">
            {[
              {
                color:
                  'bg-crowd-very-low/65 border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
                label: 'Very Low',
                icon: User,
                threshold: '≤ 60% of P50',
                desc: 'Noticeably quieter than usual. Almost no queues – ideal visit day.',
              },
              {
                color:
                  'bg-crowd-low/65 border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
                label: 'Low',
                icon: User,
                threshold: '61–89% of P50',
                desc: 'Below average – short wait times at most attractions.',
              },
              {
                color:
                  'bg-crowd-moderate/65 border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
                label: 'Moderate',
                icon: Users,
                threshold: '90–110% of P50',
                desc: 'Typical day – wait times within the expected range (±10% of median).',
              },
              {
                color:
                  'bg-crowd-high/65 border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
                label: 'High',
                icon: Users,
                threshold: '111–150% of P50',
                desc: 'Busier than average – noticeably longer wait times.',
              },
              {
                color:
                  'bg-crowd-very-high/65 border-crowd-very-high/80 dark:bg-crowd-very-high/25 dark:border-crowd-very-high/40',
                label: 'Very High',
                icon: Users,
                threshold: '151–200% of P50',
                desc: 'Very crowded – waits nearly twice as long as usual. Arrive early.',
              },
              {
                color:
                  'bg-crowd-extreme/65 border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
                label: 'Extreme',
                icon: AlertTriangle,
                threshold: '> 200% of P50',
                desc: 'Record crowds – more than twice as busy as a typical day. School holidays, special events.',
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[100px] flex-col gap-1 sm:min-w-[120px]">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
          <InfoBox label="Note">
            <strong>How is the crowd level calculated?</strong> park.fan compares the current
            average wait time with the historical median (P50) – the typical value for that
            attraction. 100% means exactly as busy as an average day; 60% is notably quieter, 200%
            means twice as crowded as usual.
          </InfoBox>
        </SubSection>

        <SubSection title="Trend Indicators">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'Rising',
                desc: 'Queue is getting longer. Queue up soon.',
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Stable',
                desc: 'Wait time remains constant.',
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'Falling',
                desc: 'Queue is getting shorter – good moment to join.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-24 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Queue Types">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Single Rider',
                termId: 'single-rider',
                desc: "Often much shorter than regular queue – but you can't ride with your group.",
              },
              {
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: 'Paid express pass (e.g. at Disney). Shows current price and return time.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Return Time',
                termId: 'virtual-queue',
                desc: 'Free virtual queue – reserve a time slot and return later.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Boarding Group',
                termId: 'boarding-group',
                desc: 'Virtual queue with group number – popular for highly demanded new rides.',
              },
            ].map(({ color, icon, label, termId, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} termId={termId} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 6. Calendar ─────────────────────────────────────────────────────── */}
      <Section id="kalender" title="The Crowd Calendar">
        <p className="text-muted-foreground mb-4">
          The calendar is the most powerful planning tool on park.fan. It shows an AI-powered
          forecast for each of the next 30+ days – crowd level, opening hours, weather and special
          events, all at a glance.
        </p>

        <SubSection title="What's on each calendar card?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">A typical calendar card shows:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Date and weekday</strong>
              </li>
              <li>
                🎯 <strong>Crowd Level badge</strong> (e.g. "Very High") – the AI forecast for
                overall busyness
              </li>
              <li>
                🕐 <strong>Opening hours</strong> – or "Est." if not yet officially confirmed (see
                below)
              </li>
              <li>
                🌤️ <strong>Weather forecast</strong> with min/max temperature
              </li>
              <li>
                ⌚ <strong>Avg. wait time</strong> – predicted average wait across all attractions
              </li>
              <li>
                🎟️ <strong>Ticket price</strong>, when published by the park
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>What does "Est." mean?</strong> Opening hours marked "Est." (Estimated) have not
            yet been officially confirmed by the park. park.fan derives them from historical
            patterns – they may still change.
          </p>
        </SubSection>

        <SubSection title="Calendar card icons">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Public Holiday',
                desc: 'Parks often open longer, but also busier. Check the forecast!',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'School Holidays',
                desc: 'Typically the busiest days of the year – extreme wait times possible.',
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Bridge Day',
                desc: 'Likely to be busier as many people extend long weekends.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Park Closed',
                desc: 'No operation on this day – no forecast available.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Practical example: finding the best visit day">
          <p className="text-muted-foreground mb-3 text-sm">
            You're planning a visit to Europa-Park in October. Here's how to use the calendar:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Open the park page and switch to the <strong>Calendar</strong> tab.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                You'll immediately spot the school holiday weeks – lots of cards with the{' '}
                <Backpack className="inline h-4 w-4 text-yellow-500" /> icon and badges showing{' '}
                <strong>"Very High"</strong> or <strong>"Extreme"</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Look for a Tuesday or Wednesday <em>without</em> a holiday icon – these often show{' '}
                <strong>"Low"</strong> or <strong>"Moderate"</strong>. Opening hours and the weather
                forecast help you make the final call.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Book tickets early – on forecast green days, ticket contingents can be limited.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="en" />
          </div>
        </SubSection>

        <SubSection title="Attraction calendar">
          <p className="text-muted-foreground text-sm">
            Each attraction's detail page also has a historical calendar showing how busy it was on
            every past day – and whether it was operating or not. This is perfect for spotting
            recurring patterns: did Taron consistently have short waits on Thursday afternoons over
            the past month? It might next week too.
          </p>
        </SubSection>

        <TipBox label="Tip">
          Best visit days are typically early weekdays outside of school holidays – Tuesday through
          Thursday show the lowest crowd levels. Avoid school holiday weeks in densely populated
          regions.
        </TipBox>
      </Section>

      {/* ── 7. AI Predictions ───────────────────────────────────────────────────── */}
      <Section id="prognosen" title="AI-Powered Predictions">
        <p className="text-muted-foreground mb-4">
          park.fan uses machine learning to predict crowd levels and wait times days in advance. The
          model is continuously trained on new data and considers four key factors:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Historical data',
              desc: 'Millions of queue data points per attraction, weekday and time of day.',
            },
            {
              icon: '📅',
              title: 'Holiday calendars',
              desc: 'School holidays and public holidays across Europe and worldwide.',
            },
            {
              icon: '🌤️',
              title: 'Weather forecasts',
              desc: 'Temperature, rain and sunshine – bad weather pushes crowds towards indoor rides.',
            },
            {
              icon: '🎉',
              title: 'Special events',
              desc: 'Halloween nights, Christmas events and other park-specific dates drive significantly higher attendance.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            </div>
          ))}
        </div>

        <SubSection title="Where to find predictions">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 In the crowd calendar</p>
              <p className="text-muted-foreground mt-0.5">
                Every calendar card contains a day-level forecast: crowd level, average wait time
                and opening hours – up to 30+ days ahead.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Peak-time badge on the park page</p>
              <p className="text-muted-foreground mt-0.5">
                The park header shows when today's crowd peak is expected – e.g. "Peak in 1h 30m".
                Plan a lunch break or a visit to a less popular ride for exactly that window.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📈 Hourly prediction chart on the attraction page</p>
              <p className="text-muted-foreground mt-0.5">
                Every attraction has its own page with a chart showing how wait times are forecast
                to evolve through the day – for today and tomorrow.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Practical example: using predictions on the day">
          <p className="text-muted-foreground mb-3 text-sm">
            You're visiting Phantasialand on a Saturday during school holidays. The calendar shows
            "Very High". Here's how predictions help:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>At the gate:</strong> The peak-time badge shows "Peak in ~2h" – you have
                until around 11:30 for your first highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Open the Taron page:</strong> The prediction chart shows 9:30 ≈ 15 min,
                12:00 ≈ 65 min, 15:00 ≈ 40 min → ride right after opening or mid-afternoon.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Lunch during peak:</strong> Instead of queuing at noon, you grab lunch. Live
                trends confirm: by 15:00 the wait is dropping – perfect moment to ride.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="How accurate are predictions?">
          <p className="text-muted-foreground text-sm">
            Accuracy varies by park and forecast window. Each attraction's detail page shows its
            prediction quality – from <strong>Poor</strong> to <strong>Excellent</strong>. More
            historical data means more precise forecasts. Short-term predictions (1–3 days) are
            inherently more reliable than longer-range ones (7–14 days).
          </p>
        </SubSection>

        <SubSection title="Wait time sparklines">
          <p className="text-muted-foreground text-sm">
            Every attraction card shows a small sparkline graph with the wait time trend over the
            last few hours. You can instantly see whether queues are building up, holding steady or
            shrinking.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Tip">
          Combine calendar and predictions: pick a green day from the calendar, then check the
          hourly forecast on the attraction page to find the quietest slot. You&apos;ll always
          arrive at the shortest queue.
        </TipBox>
      </Section>

      {/* ── 8. Personas ─────────────────────────────────────────────────────── */}
      <Section id="personas" title="Who is park.fan for?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Families"
            subtitle="Planning a perfect day out for everyone"
          >
            <Li>Crowd calendar: which day has the shortest queues?</Li>
            <Li>Weather in the calendar: planning for a rainy day? Check indoor rides!</Li>
            <Li>Favorites: save the 10 must-do rides for kids.</Li>
            <Li>Live wait times: decide on the fly which ride to do next.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Theme Park Enthusiasts"
            subtitle="Every minute must be optimised"
          >
            <Li>
              Crowd level (P50 baseline): understand if a ride is genuinely above average – or just
              "normal".
            </Li>
            <Li>Historical trends: when does Taron typically have short waits?</Li>
            <Li>Trend indicators: queue rising? Wait 20 minutes and it might be shorter.</Li>
            <Li>Single Rider / Lightning Lane: all queue types shown with times and prices.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="First-Time Visitors"
            subtitle="First time at a major theme park"
          >
            <Li>Search: find your park quickly, even if you don't know the exact name.</Li>
            <Li>Park map: get oriented before and during your visit.</Li>
            <Li>Status badges: green = running, orange = brief issue, grey = closed today.</Li>
            <Li>Crowd calendar: colours tell everything – green is good, red is stressful.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Spontaneous Visitors"
            subtitle="Last-minute decision, maximum efficiency"
          >
            <Li>Location: park.fan automatically finds your nearest park.</Li>
            <Li>Live wait times: instantly see what's open and how long the wait is.</Li>
            <Li>Trend indicators: queue falling? Perfect moment to join.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Popular Parks ────────────────────────────────────────────────── */}
      <Section id="parks" title="Popular Parks">
        <p className="text-muted-foreground mb-6">
          park.fan covers 150+ theme parks worldwide – from Walt Disney World to Universal Studios
          and Europa-Park. Here are the most-visited parks in your region with live data:
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Glossary ─────────────────────────────────────────────────── */}
      <Section id="glossar" title="The Glossary & Term Highlighting">
        <p className="text-muted-foreground mb-4">
          park.fan maintains a full{' '}
          <Link href="/glossary" className="text-primary underline">
            Theme Park Glossary
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {
              'covering everything from wait times and crowd levels to roller coaster elements and virtual queues. Each entry includes a short definition and a detailed explanation.'
            }
          </GlossaryInject>
        </p>

        <SubSection title="Automatic term highlighting on attraction pages">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {
                'On attraction pages, glossary terms are automatically detected in text and underlined with a dashed line. Hovering reveals a short definition tooltip – clicking takes you directly to the full glossary entry. This happens automatically with no manual linking required.'
              }
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Example text (hover over the dashed terms)
            </p>
            <p>
              <GlossaryInject>
                {`The best way to plan your visit is to check the crowd calendar before booking. On a peak day, wait times for popular rides can exceed 90 minutes – making rope drop strategy essential. A virtual queue lets you reserve a ride slot without standing in line, while a single rider lane can cut your wait by over half. When crowd levels are high, an express pass is often worth the cost.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Tip">
          The full glossary is available at{' '}
          <Link href="/glossary" className="text-primary font-medium underline">
            park.fan/glossary
          </Link>{' '}
          <GlossaryInject>
            {
              '– with terms organised across 7 categories: Wait Times, Crowd Levels, Park Operations, Planning, Attractions, Coasters and Coaster Elements.'
            }
          </GlossaryInject>
        </TipBox>
      </Section>

      {/* ── 11. FAQ ─────────────────────────────────────────────────────────── */}
      <Section id="faq" title="Frequently Asked Questions">
        <div className="space-y-4">
          {[
            {
              q: 'How often are wait times updated?',
              a: 'Wait times are updated every minute. For some parks, updates occur every 2–5 minutes depending on data availability.',
            },
            {
              q: 'Where does the data come from?',
              a: 'park.fan sources live data from ThemeParks.wiki, Queue-Times.com and Wartezeiten.app.',
            },
            {
              q: 'Is park.fan free?',
              a: 'Yes, park.fan is completely free and requires no registration.',
            },
            {
              q: 'Are favorites synced across devices?',
              a: "No, favorites are stored locally in your browser (localStorage). They're only available on the device where you saved them.",
            },
            {
              q: 'How far ahead does the crowd calendar forecast?',
              a: 'The calendar shows forecasts for 30+ days ahead. Forecasts for dates further away are naturally slightly less precise than near-term predictions.',
            },
            {
              q: 'How many parks are covered?',
              a: 'park.fan currently covers 150+ parks with 5,000+ attractions worldwide – from Walt Disney World and Universal to Europa-Park, Phantasialand and parks across Asia and Australia.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  {q}
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

function ContentESSections() {
  return (
    <>
      {/* ── 1. Búsqueda ───────────────────────────────────────────────────────── */}
      <Section id="suche" title="Búsqueda">
        <p className="text-muted-foreground mb-4">
          La búsqueda global es la forma más rápida de encontrar un parque, atracción, espectáculo o
          restaurante – ya sea en escritorio o móvil.
        </p>

        <SubSection title="Abrir la búsqueda">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Escritorio:</strong> Pulsa{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              o <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) para abrir la búsqueda en cualquier momento.
            </p>
            <p>
              <strong>Móvil y Escritorio:</strong> Toca el icono{' '}
              <Search className="inline h-4 w-4" /> en el encabezado o el campo de búsqueda en la
              página de inicio.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="Qué puedes buscar">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parques', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Atracciones', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Ciudades y Países', desc: 'Orlando, París, Alemania...' },
              { icon: '🎭', label: 'Espectáculos', desc: 'Horarios y programas de shows' },
              {
                icon: '🍽️',
                label: 'Restaurantes',
                desc: 'Opciones gastronómicas dentro del parque',
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <InfoBox label="Nota">
          La búsqueda utiliza texto completo inteligente que funciona incluso con erratas. Busca
          &quot;fantasia&quot; y encontrarás &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>

      {/* ── 2. Ubicación ─────────────────────────────────────────────────────── */}
      <Section id="standort" title="Ubicación y Parques Cercanos">
        <p className="text-muted-foreground mb-4">
          Con tu ubicación activada, park.fan se vuelve más inteligente: ve los parques y
          atracciones cercanas ordenados por distancia. park.fan no almacena tu ubicación.
        </p>
        <SubSection title="Navegación en el parque">
          <p className="text-muted-foreground text-sm">
            Cuando estás en un parque, park.fan detecta automáticamente en qué parque te encuentras
            y muestra &quot;Estás en [Nombre del Parque]&quot; en la página de inicio. El mapa del
            parque muestra tu ubicación en tiempo real – perfecto para moverte entre atracciones.
          </p>
        </SubSection>
        <NearbyParksCard />
      </Section>

      {/* ── 3. Favoritos ────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favoritos">
        <p className="text-muted-foreground mb-4">
          Guarda parques, atracciones, espectáculos y restaurantes como favoritos para acceder
          rápidamente desde la página de inicio.
        </p>

        <SubSection title="Añadir un favorito">
          <p className="text-sm">
            Haz clic en la estrella <Star className="inline h-4 w-4 text-yellow-500" /> de cualquier
            tarjeta de parque o atracción. Los favoritos se guardan localmente en tu navegador – sin
            necesidad de registro.
          </p>
        </SubSection>

        <SubSection title="Favoritos en la página de inicio">
          <p className="text-muted-foreground text-sm">
            Con al menos un favorito guardado, aparece una sección dedicada en la página de inicio
            con todos tus parques, atracciones, espectáculos y restaurantes guardados. Con la
            ubicación activada, se ordenan por distancia – el más cercano primero.
          </p>
          <MockNearbyCards locale="en" />
        </SubSection>

        <SubSection title="¿Qué se guarda?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parques',
                desc: 'Estado, horarios y nivel de afluencia de un vistazo',
              },
              {
                icon: '🎢',
                label: 'Atracciones',
                desc: 'Tiempo de espera en vivo y tendencia directamente en el resumen',
              },
              { icon: '🎭', label: 'Espectáculos', desc: 'El próximo horario siempre visible' },
              { icon: '🍽️', label: 'Restaurantes', desc: 'Estado de cocina y ubicación' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox label="Consejo">
          Guarda entre 5 y 10 atracciones favoritas del parque que vayas a visitar. El día de tu
          visita verás al instante cuáles tienen tiempos de espera cortos – ideal para decidir sobre
          la marcha.
        </TipBox>
      </Section>

      {/* ── 4. Página del Parque ─────────────────────────────────────────────── */}
      <Section id="parkseite" title="La Página del Parque">
        <p className="text-muted-foreground mb-4">
          Cada parque tiene su propia página con datos en tiempo real, horarios de apertura, un
          calendario interactivo y un mapa.
        </p>
        <InfoBox label="Nota">
          Todos los horarios se muestran en la <strong>zona horaria local del parque</strong> –
          independientemente de dónde te encuentres. Un parque en Florida muestra hora del Este,
          Europa-Park muestra hora de Europa Central.
        </InfoBox>
        <MockParkHeader locale="en" />

        <SubSection title="Pestañas – Atracciones, Shows, Calendario, Mapa">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Atracciones',
                desc: 'Todas las atracciones con tiempo de espera en vivo, estado, tendencia y comparación con la media.',
              },
              {
                icon: '🎭',
                label: 'Shows',
                desc: 'Todos los espectáculos con estado actual y próximos horarios.',
              },
              {
                icon: '📅',
                label: 'Calendario',
                desc: 'Previsión de más de 30 días con predicciones de afluencia, tiempo, festivos y vacaciones escolares.',
              },
              {
                icon: '🗺️',
                label: 'Mapa',
                desc: 'Mapa interactivo con todas las atracciones, shows y restaurantes.',
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold">
                  {icon} {label}
                </p>
                <p className="text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <MockAttractionCards locale="en" />
        </SubSection>

        <SubSection title="Pestaña Shows: Horarios de un vistazo">
          <p className="text-muted-foreground text-sm">
            La pestaña Shows lista todos los espectáculos con sus horarios para hoy. Los horarios
            pasados aparecen tachados, el <strong>próximo pase</strong> se resalta en verde – para
            que siempre sepas cuándo y dónde estar.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Atracciones y Shows de Temporada">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Algunas atracciones de temporada y shows solo funcionan en ciertas épocas del año –
              como pistas de hielo en invierno o atracciones acuáticas en verano. park.fan lo
              detecta automáticamente y oculta esas entradas fuera de temporada por defecto.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Invierno',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: 'La atracción está en temporada (p. ej. evento de invierno). El badge aparece en la tarjeta.',
                },
                {
                  icon: Sun,
                  label: 'Verano',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: 'Atracción de verano – p. ej. atracciones acuáticas. Activa de mayo a septiembre.',
                },
                {
                  icon: Leaf,
                  label: 'Temporada',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Fuera de temporada: badge atenuado. Atracción oculta en pestañas y mapa por defecto.',
                },
              ].map(({ icon: Icon, label, color, opacity, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md',
                      color,
                      opacity
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <button className="border-border/60 bg-background/60 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md">
                <EyeOff className="h-3 w-3" />3 fuera de temporada
              </button>
              <p className="text-muted-foreground text-sm">
                Cuando hay entradas fuera de temporada ocultas, este botón aparece junto al título
                de la sección. Haz clic para mostrarlas.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Insignias ─────────────────────────────────────────────────────── */}
      <Section id="badges" title="Insignias e Indicadores de Estado">
        <p className="text-muted-foreground mb-4">
          park.fan utiliza un sistema de colores consistente para que la información sea
          comprensible de un vistazo.
        </p>

        <SubSection title="Estado de Parques y Atracciones">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color:
                  'bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40',
                label: 'Operativo',
                desc: 'La atracción / el parque está en funcionamiento. Los tiempos de espera se actualizan en vivo.',
              },
              {
                icon: AlertTriangle,
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                label: 'Avería',
                desc: 'Cerrado temporalmente – p. ej. problema técnico o parada de seguridad. Normalmente breve.',
              },
              {
                icon: XCircle,
                color:
                  'bg-status-closed/65 border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40',
                label: 'Cerrado',
                desc: 'Sin operación hoy – cierre de temporada o día de descanso programado.',
              },
              {
                icon: Wrench,
                color:
                  'bg-status-refurbishment/65 border-status-refurbishment/80 dark:bg-status-refurbishment/25 dark:border-status-refurbishment/40',
                label: 'Renovación',
                desc: 'Mantenimiento prolongado. Cerrado durante días o semanas.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Niveles de Afluencia">
          <p className="text-muted-foreground mb-3 text-sm">
            El nivel de afluencia muestra lo concurrido que está un parque o atracción en relación
            con la mediana histórica de tiempo de espera (P50). El 100% significa exactamente tan
            concurrido como un día promedio.
          </p>
          <div className="space-y-3">
            {[
              {
                color:
                  'bg-crowd-very-low/65 border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
                label: 'Muy Baja',
                icon: User,
                threshold: '≤ 60% de P50',
                desc: 'Notablemente más tranquilo de lo habitual. Casi sin colas – día ideal para visitar.',
              },
              {
                color:
                  'bg-crowd-low/65 border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
                label: 'Baja',
                icon: User,
                threshold: '61–89% de P50',
                desc: 'Por debajo de la media – tiempos de espera cortos en la mayoría de atracciones.',
              },
              {
                color:
                  'bg-crowd-moderate/65 border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
                label: 'Moderada',
                icon: Users,
                threshold: '90–110% de P50',
                desc: 'Día típico – tiempos de espera dentro del rango esperado (±10% de la mediana).',
              },
              {
                color:
                  'bg-crowd-high/65 border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
                label: 'Alta',
                icon: Users,
                threshold: '111–150% de P50',
                desc: 'Más concurrido que la media – tiempos de espera notablemente más largos.',
              },
              {
                color:
                  'bg-crowd-very-high/65 border-crowd-very-high/80 dark:bg-crowd-very-high/25 dark:border-crowd-very-high/40',
                label: 'Muy Alta',
                icon: Users,
                threshold: '151–200% de P50',
                desc: 'Muy concurrido – esperas casi el doble de lo habitual. Llega temprano.',
              },
              {
                color:
                  'bg-crowd-extreme/65 border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
                label: 'Extrema',
                icon: AlertTriangle,
                threshold: '> 200% de P50',
                desc: 'Afluencia récord – más del doble de lo habitual. Vacaciones escolares, eventos especiales.',
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[100px] flex-col gap-1 sm:min-w-[120px]">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
          <InfoBox label="Nota">
            <strong>¿Cómo se calcula el nivel de afluencia?</strong> park.fan compara el tiempo de
            espera promedio actual con la mediana histórica (P50). El 100% significa igual de
            concurrido que un día promedio; el 60% es notablemente más tranquilo, el 200% significa
            el doble de afluencia que lo habitual.
          </InfoBox>
        </SubSection>

        <SubSection title="Indicadores de Tendencia">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'Subiendo',
                desc: 'La cola se alarga. Únete pronto.',
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Estable',
                desc: 'El tiempo de espera se mantiene constante.',
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'Bajando',
                desc: 'La cola se acorta – buen momento para unirse.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-24 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Tipos de Cola">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Fila Individual',
                termId: 'single-rider',
                desc: 'A menudo mucho más corta que la fila normal – pero no puedes ir con tu grupo.',
              },
              {
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: 'Pase exprés de pago (p. ej. en Disney). Muestra el precio actual y la hora de regreso.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Hora de Regreso',
                termId: 'virtual-queue',
                desc: 'Cola virtual gratuita – reserva un horario y regresa más tarde.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Grupo de Embarque',
                termId: 'boarding-group',
                desc: 'Cola virtual con número de grupo – popular para nuevas atracciones muy demandadas.',
              },
            ].map(({ color, icon, label, termId, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} termId={termId} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 6. Calendario ────────────────────────────────────────────────────── */}
      <Section id="kalender" title="El Calendario de Afluencia">
        <p className="text-muted-foreground mb-4">
          El calendario es la herramienta de planificación más potente de park.fan. Muestra una
          previsión basada en IA para cada uno de los próximos 30+ días – nivel de afluencia,
          horarios de apertura, tiempo y eventos especiales, todo de un vistazo.
        </p>

        <SubSection title="¿Qué muestra cada tarjeta del calendario?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">Una tarjeta típica del calendario muestra:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Fecha y día de la semana</strong>
              </li>
              <li>
                🎯 <strong>Insignia de Afluencia</strong> (p. ej. &quot;Muy Alta&quot;) – la
                previsión de IA para la concurrencia general
              </li>
              <li>
                🕐 <strong>Horario de apertura</strong> – o &quot;Est.&quot; si aún no está
                confirmado oficialmente
              </li>
              <li>
                🌤️ <strong>Previsión meteorológica</strong> con temperaturas mín./máx.
              </li>
              <li>
                ⌚ <strong>Tiempo de espera medio</strong> – espera media prevista en todas las
                atracciones
              </li>
              <li>
                🎟️ <strong>Precio de la entrada</strong>, cuando lo publica el parque
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>¿Qué significa &quot;Est.&quot;?</strong> Los horarios marcados como
            &quot;Est.&quot; (Estimado) aún no han sido confirmados oficialmente por el parque.
            park.fan los deriva de patrones históricos – pueden cambiar.
          </p>
        </SubSection>

        <SubSection title="Iconos de la tarjeta del calendario">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Festivo',
                desc: 'Los parques suelen abrir más, pero también están más concurridos. ¡Consulta la previsión!',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'Vacaciones escolares',
                desc: 'Normalmente los días más concurridos del año – posibles tiempos de espera extremos.',
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Puente',
                desc: 'Probablemente más concurrido, ya que mucha gente aprovecha el fin de semana largo.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Parque Cerrado',
                desc: 'Sin operación ese día – sin previsión disponible.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Ejemplo práctico: encontrar el mejor día de visita">
          <p className="text-muted-foreground mb-3 text-sm">
            Estás planeando visitar Europa-Park en octubre. Así se usa el calendario:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Abre la página del parque y cambia a la pestaña <strong>Calendario</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Verás de inmediato las semanas de vacaciones escolares – muchas tarjetas con el
                icono <Backpack className="inline h-4 w-4 text-yellow-500" /> e insignias de{' '}
                <strong>&quot;Muy Alta&quot;</strong> o <strong>&quot;Extrema&quot;</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Busca un martes o miércoles <em>sin</em> icono de festivo – estos suelen mostrar
                <strong> &quot;Baja&quot;</strong> o <strong>&quot;Moderada&quot;</strong>. Los
                horarios de apertura y la previsión del tiempo te ayudan a decidir.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Compra las entradas con antelación – en los días verdes del pronóstico, los cupos
                pueden ser limitados.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="es" />
          </div>
        </SubSection>

        <SubSection title="Calendario de atracciones">
          <p className="text-muted-foreground text-sm">
            La página de detalle de cada atracción también tiene un calendario histórico que muestra
            lo concurrida que estuvo cada día pasado – y si estaba en funcionamiento o no. Perfecto
            para detectar patrones recurrentes: ¿tuvo Taron sistemáticamente colas cortas los jueves
            por la tarde el mes pasado? Puede que también la próxima semana.
          </p>
        </SubSection>

        <TipBox label="Consejo">
          Los mejores días de visita son normalmente los días de semana fuera de las vacaciones
          escolares – martes, miércoles y jueves muestran los niveles de afluencia más bajos. Evita
          las semanas de vacaciones escolares en regiones densamente pobladas.
        </TipBox>
      </Section>

      {/* ── 7. Predicciones IA ───────────────────────────────────────────────── */}
      <Section id="prognosen" title="Predicciones con IA">
        <p className="text-muted-foreground mb-4">
          park.fan utiliza aprendizaje automático para predecir los niveles de afluencia y los
          tiempos de espera con días de antelación. El modelo se entrena continuamente con nuevos
          datos y tiene en cuenta cuatro factores clave:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Datos históricos',
              desc: 'Millones de datos de colas por atracción, día de la semana y hora del día.',
            },
            {
              icon: '📅',
              title: 'Calendarios de festivos',
              desc: 'Vacaciones escolares y días festivos en Europa y todo el mundo.',
            },
            {
              icon: '🌤️',
              title: 'Previsiones del tiempo',
              desc: 'Temperatura, lluvia y sol – el mal tiempo empuja a las multitudes hacia las atracciones interiores.',
            },
            {
              icon: '🎉',
              title: 'Eventos especiales',
              desc: 'Noches de Halloween, eventos navideños y otras fechas específicas del parque generan una asistencia significativamente mayor.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            </div>
          ))}
        </div>

        <SubSection title="Dónde encontrar las predicciones">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 En el calendario de afluencia</p>
              <p className="text-muted-foreground mt-0.5">
                Cada tarjeta del calendario contiene una previsión diaria: nivel de afluencia,
                tiempo de espera medio y horario de apertura – hasta 30+ días de antelación.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Insignia de hora punta en la página del parque</p>
              <p className="text-muted-foreground mt-0.5">
                La cabecera del parque muestra cuándo se espera el pico de afluencia de hoy – p. ej.
                &quot;Pico en 1h 30min&quot;. Planifica una pausa para comer o visita una atracción
                menos popular justo en ese intervalo.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">
                📈 Gráfico de predicción por horas en la página de la atracción
              </p>
              <p className="text-muted-foreground mt-0.5">
                Cada atracción tiene su propia página con un gráfico que muestra cómo se prevé que
                evolucionen los tiempos de espera a lo largo del día – para hoy y mañana.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Ejemplo práctico: usar las predicciones el día de la visita">
          <p className="text-muted-foreground mb-3 text-sm">
            Visitas Phantasialand un sábado durante las vacaciones escolares. El calendario muestra
            &quot;Muy Alta&quot;. Así te ayudan las predicciones:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>En la entrada:</strong> La insignia de hora punta muestra &quot;Pico en
                ~2h&quot; – tienes hasta las 11:30 aprox. para tus primeros highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Abre la página de Taron:</strong> El gráfico de predicción muestra 9:30 ≈ 15
                min, 12:00 ≈ 65 min, 15:00 ≈ 40 min → monta justo al abrir o a media tarde.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Come durante el pico:</strong> En lugar de hacer cola al mediodía,
                aprovechas para comer. Las tendencias en vivo confirman que a las 15:00 la espera
                baja – momento perfecto para montar.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="¿Qué precisión tienen las predicciones?">
          <p className="text-muted-foreground text-sm">
            La precisión varía según el parque y el horizonte de predicción. La página de detalle de
            cada atracción muestra su calidad de predicción – de <strong>Baja</strong> a{' '}
            <strong>Excelente</strong>. Más datos históricos significa previsiones más precisas. Las
            predicciones a corto plazo (1–3 días) son intrínsecamente más fiables que las de largo
            plazo (7–14 días).
          </p>
        </SubSection>

        <SubSection title="Minigráficos de tiempo de espera">
          <p className="text-muted-foreground text-sm">
            Cada tarjeta de atracción muestra un pequeño minigráfico con la tendencia del tiempo de
            espera en las últimas horas. Puedes ver al instante si las colas están aumentando,
            estables o disminuyendo.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Consejo">
          Combina calendario y predicciones: elige un día verde del calendario, luego consulta la
          previsión horaria en la página de la atracción para encontrar el momento más tranquilo.
          Siempre llegarás a la cola más corta.
        </TipBox>
      </Section>

      {/* ── 8. Para quién ────────────────────────────────────────────────────── */}
      <Section id="personas" title="¿Para quién es park.fan?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Familias"
            subtitle="Planificando el día perfecto para todos"
          >
            <Li>Calendario de afluencia: ¿qué día tiene las colas más cortas?</Li>
            <Li>Tiempo en el calendario: ¿día lluvioso? ¡Consulta las atracciones de interior!</Li>
            <Li>Favoritos: guarda las 10 atracciones imprescindibles para los niños.</Li>
            <Li>
              Tiempos de espera en vivo: decide sobre la marcha qué atracción visitar a
              continuación.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Entusiastas de Parques Temáticos"
            subtitle="Cada minuto debe estar optimizado"
          >
            <Li>
              Nivel de afluencia (base P50): entiende si una atracción está realmente por encima de
              la media.
            </Li>
            <Li>Tendencias históricas: ¿cuándo suele tener Taron tiempos de espera cortos?</Li>
            <Li>Indicadores de tendencia: ¿sube la cola? Espera 20 minutos y puede acortarse.</Li>
            <Li>
              Fila Individual / Lightning Lane: todos los tipos de cola con tiempos y precios.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Visitantes por Primera Vez"
            subtitle="Primera visita a un gran parque temático"
          >
            <Li>
              Búsqueda: encuentra tu parque rápidamente, incluso si no conoces el nombre exacto.
            </Li>
            <Li>Mapa del parque: oriéntate antes y durante tu visita.</Li>
            <Li>
              Insignias de estado: verde = en marcha, naranja = incidencia breve, gris = cerrado
              hoy.
            </Li>
            <Li>
              Calendario de afluencia: los colores lo dicen todo – verde es bueno, rojo es
              estresante.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Visitantes Espontáneos"
            subtitle="Decisión de última hora, máxima eficiencia"
          >
            <Li>Ubicación: park.fan encuentra automáticamente el parque más cercano.</Li>
            <Li>
              Tiempos de espera en vivo: ve al instante qué está abierto y cuánto hay que esperar.
            </Li>
            <Li>Indicadores de tendencia: ¿baja la cola? El momento perfecto para unirse.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Parques populares ────────────────────────────────────────────── */}
      <Section id="parks" title="Parques populares">
        <p className="text-muted-foreground mb-6">
          park.fan cubre más de 150 parques temáticos en todo el mundo. Aquí están los más visitados
          de tu región con datos en directo:
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Glosario ─────────────────────────────────────────────────── */}
      <Section id="glossar" title="El Glosario y Resaltado de Términos">
        <p className="text-muted-foreground mb-4">
          park.fan mantiene un{' '}
          <Link href="/glosario" className="text-primary underline">
            glosario completo de términos de parques temáticos
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {`desde tiempos de espera y niveles de afluencia hasta elementos de montaña rusa y colas virtuales. Cada entrada incluye una definición corta y una explicación detallada.`}
          </GlossaryInject>
        </p>

        <SubSection title="Resaltado automático de términos en páginas de atracciones">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {`En las páginas de atracciones, los términos del glosario se detectan automáticamente en el texto y se subrayan con una línea discontinua. Al pasar el cursor aparece una definición breve; al hacer clic accedes directamente a la entrada completa del glosario.`}
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Texto de ejemplo (pasa el cursor sobre los términos subrayados)
            </p>
            <p>
              <GlossaryInject>
                {`La mejor forma de planificar tu visita es revisar el calendario de afluencia antes de reservar. En un día pico, los tiempos de espera para las atracciones más populares pueden superar los 90 minutos. Una cola virtual te permite reservar tu turno sin hacer cola, mientras que el carril de single rider puede reducir la espera a la mitad. Si el nivel de afluencia es alto, un pase express suele merecer la pena.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Consejo">
          El glosario completo está disponible en{' '}
          <Link href="/glosario" className="text-primary font-medium underline">
            park.fan/glosario
          </Link>{' '}
          con términos organizados en 7 categorías.
        </TipBox>
      </Section>

      {/* ── 11. Preguntas Frecuentes ─────────────────────────────────────────── */}
      <Section id="faq" title="Preguntas Frecuentes">
        <div className="space-y-4">
          {[
            {
              q: '¿Con qué frecuencia se actualizan los tiempos de espera?',
              a: 'Los tiempos de espera se actualizan cada minuto. En algunos parques, las actualizaciones se producen cada 2–5 minutos según la disponibilidad de datos.',
            },
            {
              q: '¿De dónde provienen los datos?',
              a: 'park.fan obtiene datos en vivo de ThemeParks.wiki, Queue-Times.com y Wartezeiten.app.',
            },
            {
              q: '¿Es gratuito park.fan?',
              a: 'Sí, park.fan es completamente gratuito y no requiere registro.',
            },
            {
              q: '¿Los favoritos se sincronizan entre dispositivos?',
              a: 'No, los favoritos se guardan localmente en tu navegador (localStorage). Solo están disponibles en el dispositivo donde los guardaste.',
            },
            {
              q: '¿Con cuánta antelación hace previsiones el calendario de afluencia?',
              a: 'El calendario muestra previsiones para más de 30 días. Las previsiones para fechas más lejanas son naturalmente un poco menos precisas que las de corto plazo.',
            },
            {
              q: '¿Cuántos parques están incluidos?',
              a: 'park.fan cubre actualmente más de 150 parques con más de 5.000 atracciones en todo el mundo – desde Walt Disney World y Universal hasta Europa-Park, Phantasialand y parques en Asia y Australia.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  {q}
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

function ContentFRSections() {
  return (
    <>
      {/* ── 1. Recherche ─────────────────────────────────────────────────────── */}
      <Section id="suche" title="Recherche">
        <p className="text-muted-foreground mb-4">
          La recherche globale est le moyen le plus rapide de trouver un parc, une attraction, un
          spectacle ou un restaurant – sur ordinateur comme sur mobile.
        </p>

        <SubSection title="Ouvrir la recherche">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Ordinateur :</strong> Appuie sur{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              ou <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) pour ouvrir la recherche à tout moment.
            </p>
            <p>
              <strong>Mobile et Ordinateur :</strong> Tape sur l&apos;icône{' '}
              <Search className="inline h-4 w-4" /> dans l&apos;en-tête ou dans le champ de
              recherche de la page d&apos;accueil.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="Ce que tu peux rechercher">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parcs', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attractions', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Villes et Pays', desc: 'Orlando, Paris, Allemagne...' },
              { icon: '🎭', label: 'Spectacles', desc: 'Horaires et programmes des shows' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Options de restauration dans les parcs' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <InfoBox label="Note">
          La recherche utilise une recherche plein texte intelligente qui fonctionne même avec des
          fautes de frappe. Cherche &quot;fantasia&quot; et tu trouveras &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>

      {/* ── 2. Localisation ──────────────────────────────────────────────────── */}
      <Section id="standort" title="Localisation et Parcs à Proximité">
        <p className="text-muted-foreground mb-4">
          Avec ta localisation activée, park.fan devient plus intelligent : vois les parcs et
          attractions à proximité triés par distance. park.fan ne stocke pas ta position.
        </p>
        <SubSection title="Navigation dans le parc">
          <p className="text-muted-foreground text-sm">
            Lorsque tu es dans un parc, park.fan détecte automatiquement dans quel parc tu te
            trouves et affiche &quot;Tu es dans [Nom du Parc]&quot; sur la page d&apos;accueil. La
            carte du parc affiche ta position en temps réel – parfait pour te déplacer entre les
            attractions.
          </p>
        </SubSection>
        <NearbyParksCard />
      </Section>

      {/* ── 3. Favoris ───────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favoris">
        <p className="text-muted-foreground mb-4">
          Sauvegarde des parcs, attractions, spectacles et restaurants en favoris pour y accéder
          rapidement depuis la page d&apos;accueil.
        </p>

        <SubSection title="Ajouter un favori">
          <p className="text-sm">
            Clique sur l&apos;étoile <Star className="inline h-4 w-4 text-yellow-500" /> de
            n&apos;importe quelle carte de parc ou d&apos;attraction. Les favoris sont sauvegardés
            localement dans ton navigateur – aucune inscription requise.
          </p>
        </SubSection>

        <SubSection title="Favoris sur la page d'accueil">
          <p className="text-muted-foreground text-sm">
            Dès que tu as au moins un favori, une section dédiée apparaît sur la page d&apos;accueil
            avec tous tes parcs, attractions, spectacles et restaurants sauvegardés. Avec la
            localisation activée, ils sont triés par distance – le plus proche en premier.
          </p>
          <MockNearbyCards locale="en" />
        </SubSection>

        <SubSection title="Qu'est-ce qui est sauvegardé ?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parcs',
                desc: "Statut, horaires d'ouverture et niveau d'affluence en un coup d'œil",
              },
              {
                icon: '🎢',
                label: 'Attractions',
                desc: "Temps d'attente en direct et tendance directement dans la vue d'ensemble",
              },
              {
                icon: '🎭',
                label: 'Spectacles',
                desc: 'La prochaine représentation toujours visible',
              },
              { icon: '🍽️', label: 'Restaurants', desc: 'Statut de la cuisine et emplacement' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox label="Astuce">
          Sauvegarde 5 à 10 attractions favorites du parc que tu prévois de visiter. Le jour J, tu
          verras instantanément lesquelles ont de courtes files d&apos;attente – idéal pour décider
          à la volée.
        </TipBox>
      </Section>

      {/* ── 4. Page du Parc ──────────────────────────────────────────────────── */}
      <Section id="parkseite" title="La Page du Parc">
        <p className="text-muted-foreground mb-4">
          Chaque parc possède sa propre page avec des données en temps réel, les horaires
          d&apos;ouverture, un calendrier interactif et une carte.
        </p>
        <InfoBox label="Note">
          Tous les horaires sont affichés dans le <strong>fuseau horaire local du parc</strong> –
          indépendamment d&apos;où tu te trouves. Un parc en Floride affiche l&apos;heure de
          l&apos;Est, Europa-Park affiche l&apos;heure d&apos;Europe Centrale.
        </InfoBox>
        <MockParkHeader locale="en" />

        <SubSection title="Onglets – Attractions, Spectacles, Calendrier, Carte">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Attractions',
                desc: "Toutes les attractions avec temps d'attente en direct, statut, tendance et comparaison à la moyenne.",
              },
              {
                icon: '🎭',
                label: 'Spectacles',
                desc: 'Tous les spectacles avec statut actuel et prochains horaires.',
              },
              {
                icon: '📅',
                label: 'Calendrier',
                desc: "Prévision sur 30+ jours avec prédictions d'affluence, météo, jours fériés et vacances scolaires.",
              },
              {
                icon: '🗺️',
                label: 'Carte',
                desc: 'Carte interactive avec toutes les attractions, spectacles et restaurants.',
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold">
                  {icon} {label}
                </p>
                <p className="text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <MockAttractionCards locale="en" />
        </SubSection>

        <SubSection title="Onglet Spectacles : Horaires en un coup d'œil">
          <p className="text-muted-foreground text-sm">
            L&apos;onglet Spectacles liste tous les shows avec leurs horaires pour aujourd&apos;hui.
            Les horaires passés sont barrés, le <strong>prochain horaire</strong> est mis en
            évidence en vert – pour que tu saches toujours quand et où être.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Attractions et spectacles saisonniers">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Certaines attractions saisonnières et shows ne fonctionnent qu&apos;à certaines
              saisons — comme les patinoires en hiver ou les attractions aquatiques en été. park.fan
              le détecte automatiquement et masque ces entrées en dehors de leur saison par défaut.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Hiver',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: "L'attraction est actuellement en saison (ex. événement hivernal). Le badge s'affiche sur la carte.",
                },
                {
                  icon: Sun,
                  label: 'Été',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: 'Attraction estivale – ex. toboggan aquatique. Active de mai à septembre.',
                },
                {
                  icon: Leaf,
                  label: 'Saisonnier',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Hors saison : badge atténué. Attraction masquée dans les onglets et sur la carte par défaut.',
                },
              ].map(({ icon: Icon, label, color, opacity, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md',
                      color,
                      opacity
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <button className="border-border/60 bg-background/60 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md">
                <EyeOff className="h-3 w-3" />3 hors saison
              </button>
              <p className="text-muted-foreground text-sm">
                Quand des entrées hors saison sont masquées, ce bouton apparaît à côté du titre de
                la section. Clique dessus pour les afficher.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Badges ────────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badges et Indicateurs d'État">
        <p className="text-muted-foreground mb-4">
          park.fan utilise un système de couleurs cohérent pour rendre l&apos;information
          immédiatement compréhensible.
        </p>

        <SubSection title="Statut des Parcs et Attractions">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color:
                  'bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40',
                label: 'En service',
                desc: "L'attraction / le parc est en fonctionnement. Les temps d'attente sont mis à jour en direct.",
              },
              {
                icon: AlertTriangle,
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                label: 'En panne',
                desc: 'Fermé temporairement – p. ex. problème technique ou arrêt de sécurité. Généralement bref.',
              },
              {
                icon: XCircle,
                color:
                  'bg-status-closed/65 border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40',
                label: 'Fermé',
                desc: "Pas d'opération aujourd'hui – fermeture saisonnière ou jour de repos prévu.",
              },
              {
                icon: Wrench,
                color:
                  'bg-status-refurbishment/65 border-status-refurbishment/80 dark:bg-status-refurbishment/25 dark:border-status-refurbishment/40',
                label: 'Rénovation',
                desc: 'Maintenance prolongée. Fermé pendant des jours ou des semaines.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Niveaux d'Affluence">
          <p className="text-muted-foreground mb-3 text-sm">
            Le niveau d&apos;affluence indique à quel point un parc ou une attraction est fréquenté
            par rapport à la médiane historique des temps d&apos;attente (P50). 100% signifie
            exactement aussi fréquenté qu&apos;un jour moyen.
          </p>
          <div className="space-y-3">
            {[
              {
                color:
                  'bg-crowd-very-low/65 border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
                label: 'Très Faible',
                icon: User,
                threshold: '≤ 60% de P50',
                desc: "Nettement plus calme que d'habitude. Presque pas de files – jour idéal pour visiter.",
              },
              {
                color:
                  'bg-crowd-low/65 border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
                label: 'Faible',
                icon: User,
                threshold: '61–89% de P50',
                desc: "En dessous de la moyenne – courtes files d'attente pour la plupart des attractions.",
              },
              {
                color:
                  'bg-crowd-moderate/65 border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
                label: 'Modéré',
                icon: Users,
                threshold: '90–110% de P50',
                desc: "Jour typique – temps d'attente dans la plage attendue (±10% de la médiane).",
              },
              {
                color:
                  'bg-crowd-high/65 border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
                label: 'Élevé',
                icon: Users,
                threshold: '111–150% de P50',
                desc: "Plus fréquenté que la moyenne – temps d'attente nettement plus longs.",
              },
              {
                color:
                  'bg-crowd-very-high/65 border-crowd-very-high/80 dark:bg-crowd-very-high/25 dark:border-crowd-very-high/40',
                label: 'Très Élevé',
                icon: Users,
                threshold: '151–200% de P50',
                desc: "Très fréquenté – attentes presque deux fois plus longues que d'habitude. Arrive tôt.",
              },
              {
                color:
                  'bg-crowd-extreme/65 border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
                label: 'Extrême',
                icon: AlertTriangle,
                threshold: '> 200% de P50',
                desc: "Affluence record – plus du double d'un jour typique. Vacances scolaires, événements spéciaux.",
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[100px] flex-col gap-1 sm:min-w-[120px]">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
          <InfoBox label="Note">
            <strong>Comment le niveau d&apos;affluence est-il calculé ?</strong> park.fan compare le
            temps d&apos;attente moyen actuel à la médiane historique (P50). 100% signifie aussi
            fréquenté qu&apos;un jour moyen ; 60% est nettement plus calme, 200% signifie deux fois
            plus fréquenté que d&apos;habitude.
          </InfoBox>
        </SubSection>

        <SubSection title="Indicateurs de Tendance">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'En hausse',
                desc: "La file s'allonge. Rejoins-la bientôt.",
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Stable',
                desc: "Le temps d'attente reste constant.",
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'En baisse',
                desc: 'La file raccourcit – bon moment pour la rejoindre.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-28 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Types de File">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'File Individuelle',
                termId: 'single-rider',
                desc: 'Souvent bien plus courte que la file normale – mais tu ne peux pas y aller avec ton groupe.',
              },
              {
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: "Pass express payant (p. ex. chez Disney). Affiche le prix actuel et l'heure de retour.",
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Heure de Retour',
                termId: 'virtual-queue',
                desc: 'File virtuelle gratuite – réserve un créneau et reviens plus tard.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: "Groupe d'Embarquement",
                termId: 'boarding-group',
                desc: 'File virtuelle avec numéro de groupe – populaire pour les nouvelles attractions très demandées.',
              },
            ].map(({ color, icon, label, termId, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} termId={termId} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 6. Calendrier ────────────────────────────────────────────────────── */}
      <Section id="kalender" title="Le Calendrier d'Affluence">
        <p className="text-muted-foreground mb-4">
          Le calendrier est l&apos;outil de planification le plus puissant de park.fan. Il affiche
          une prévision basée sur l&apos;IA pour chacun des 30+ prochains jours – niveau
          d&apos;affluence, horaires d&apos;ouverture, météo et événements spéciaux, tout d&apos;un
          coup d&apos;œil.
        </p>

        <SubSection title="Que contient chaque carte du calendrier ?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">Une carte typique du calendrier affiche :</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Date et jour de la semaine</strong>
              </li>
              <li>
                🎯 <strong>Badge d&apos;Affluence</strong> (p. ex. &quot;Très Élevé&quot;) – la
                prévision IA de l&apos;affluence globale
              </li>
              <li>
                🕐 <strong>Horaires d&apos;ouverture</strong> – ou &quot;Est.&quot; si pas encore
                confirmés officiellement
              </li>
              <li>
                🌤️ <strong>Prévision météo</strong> avec températures min./max.
              </li>
              <li>
                ⌚ <strong>Temps d&apos;attente moyen</strong> – attente moyenne prévue sur toutes
                les attractions
              </li>
              <li>
                🎟️ <strong>Prix du billet</strong>, quand publié par le parc
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>Que signifie &quot;Est.&quot; ?</strong> Les horaires marqués &quot;Est.&quot;
            (Estimé) n&apos;ont pas encore été confirmés officiellement par le parc. park.fan les
            dérive de schémas historiques – ils peuvent encore changer.
          </p>
        </SubSection>

        <SubSection title="Icônes des cartes du calendrier">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Jour Férié',
                desc: 'Les parcs ouvrent souvent plus longtemps, mais sont aussi plus fréquentés. Consulte la prévision !',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'Vacances Scolaires',
                desc: "Généralement les jours les plus fréquentés de l'année – temps d'attente extrêmes possibles.",
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Pont',
                desc: 'Probablement plus fréquenté car beaucoup de gens prolongent les week-ends.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Parc Fermé',
                desc: "Pas d'opération ce jour-là – aucune prévision disponible.",
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Exemple pratique : trouver le meilleur jour de visite">
          <p className="text-muted-foreground mb-3 text-sm">
            Tu planifies une visite à Europa-Park en octobre. Voici comment utiliser le calendrier :
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Ouvre la page du parc et bascule sur l&apos;onglet <strong>Calendrier</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Tu repères immédiatement les semaines de vacances scolaires – beaucoup de cartes
                avec l&apos;icône <Backpack className="inline h-4 w-4 text-yellow-500" /> et des
                badges &quot;<strong>Très Élevé</strong>&quot; ou &quot;<strong>Extrême</strong>
                &quot;.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Cherche un mardi ou mercredi <em>sans</em> icône de jour férié – ils affichent
                souvent <strong>&quot;Faible&quot;</strong> ou <strong>&quot;Modéré&quot;</strong>.
                Les horaires d&apos;ouverture et la météo t&apos;aident à trancher.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Achète les billets à l&apos;avance – les jours verts du calendrier peuvent avoir des
                contingents limités.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="fr" />
          </div>
        </SubSection>

        <SubSection title="Calendrier des attractions">
          <p className="text-muted-foreground text-sm">
            La page de détail de chaque attraction possède également un calendrier historique
            montrant l&apos;affluence de chaque jour passé – et si l&apos;attraction était en
            service ou non. Parfait pour repérer les schémas récurrents : Taron avait-il constamment
            de courtes files le jeudi après-midi le mois dernier ? C&apos;est peut-être encore le
            cas la semaine prochaine.
          </p>
        </SubSection>

        <TipBox label="Astuce">
          Les meilleurs jours de visite sont généralement les jours de semaine en dehors des
          vacances scolaires – mardi, mercredi et jeudi affichent les niveaux d&apos;affluence les
          plus bas. Évite les semaines de vacances scolaires dans les régions très peuplées.
        </TipBox>
      </Section>

      {/* ── 7. Prédictions IA ────────────────────────────────────────────────── */}
      <Section id="prognosen" title="Prédictions par IA">
        <p className="text-muted-foreground mb-4">
          park.fan utilise l&apos;apprentissage automatique pour prédire les niveaux
          d&apos;affluence et les temps d&apos;attente plusieurs jours à l&apos;avance. Le modèle
          est continuellement entraîné sur de nouvelles données et tient compte de quatre facteurs
          clés :
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Données historiques',
              desc: 'Des millions de points de données par attraction, jour de la semaine et heure de la journée.',
            },
            {
              icon: '📅',
              title: 'Calendriers de vacances',
              desc: 'Vacances scolaires et jours fériés en Europe et dans le monde.',
            },
            {
              icon: '🌤️',
              title: 'Prévisions météo',
              desc: 'Température, pluie et soleil – le mauvais temps pousse les foules vers les attractions en intérieur.',
            },
            {
              icon: '🎉',
              title: 'Événements spéciaux',
              desc: "Nuits d'Halloween, événements de Noël et autres dates propres aux parcs génèrent une fréquentation nettement plus élevée.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            </div>
          ))}
        </div>

        <SubSection title="Où trouver les prédictions">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 Dans le calendrier d&apos;affluence</p>
              <p className="text-muted-foreground mt-0.5">
                Chaque carte du calendrier contient une prévision journalière : niveau
                d&apos;affluence, temps d&apos;attente moyen et horaires d&apos;ouverture –
                jusqu&apos;à 30+ jours à l&apos;avance.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Badge heure de pointe sur la page du parc</p>
              <p className="text-muted-foreground mt-0.5">
                L&apos;en-tête du parc indique quand le pic d&apos;affluence est prévu
                aujourd&apos;hui – p. ex. &quot;Pic dans 1h 30min&quot;. Planifie une pause déjeuner
                ou visite une attraction moins populaire pendant cette fenêtre.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">
                📈 Graphique de prédiction horaire sur la page de l&apos;attraction
              </p>
              <p className="text-muted-foreground mt-0.5">
                Chaque attraction a sa propre page avec un graphique montrant comment les temps
                d&apos;attente sont prévus d&apos;évoluer au cours de la journée – pour
                aujourd&apos;hui et demain.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Exemple pratique : utiliser les prédictions le jour de la visite">
          <p className="text-muted-foreground mb-3 text-sm">
            Tu visites Phantasialand un samedi pendant les vacances scolaires. Le calendrier affiche
            &quot;Très Élevé&quot;. Voici comment les prédictions t&apos;aident :
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>À l&apos;entrée :</strong> Le badge heure de pointe affiche &quot;Pic dans
                ~2h&quot; – tu as jusqu&apos;à environ 11h30 pour tes premiers highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Ouvre la page Taron :</strong> Le graphique de prédiction montre 9h30 ≈ 15
                min, 12h ≈ 65 min, 15h ≈ 40 min → monte juste à l&apos;ouverture ou en milieu
                d&apos;après-midi.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Déjeuner pendant le pic :</strong> Plutôt que de faire la queue à midi, tu
                en profites pour manger. Les tendances en direct confirment qu&apos;à 15h
                l&apos;attente baisse – moment parfait pour y aller.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="Quelle est la précision des prédictions ?">
          <p className="text-muted-foreground text-sm">
            La précision varie selon le parc et la fenêtre de prévision. La page de détail de chaque
            attraction affiche sa qualité de prédiction – de <strong>Faible</strong> à{' '}
            <strong>Excellente</strong>. Plus de données historiques signifie des prévisions plus
            précises. Les prédictions à court terme (1–3 jours) sont intrinsèquement plus fiables
            que celles à long terme (7–14 jours).
          </p>
        </SubSection>

        <SubSection title="Graphiques sparkline des temps d'attente">
          <p className="text-muted-foreground text-sm">
            Chaque carte d&apos;attraction affiche un petit graphique sparkline avec la tendance des
            temps d&apos;attente sur les dernières heures. Tu peux voir instantanément si les files
            augmentent, se stabilisent ou diminuent.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Astuce">
          Combine calendrier et prédictions : choisis un jour vert dans le calendrier, puis consulte
          la prévision horaire sur la page de l&apos;attraction pour trouver le créneau le plus
          calme. Tu arriveras toujours à la file la plus courte.
        </TipBox>
      </Section>

      {/* ── 8. Pour qui ──────────────────────────────────────────────────────── */}
      <Section id="personas" title="Pour qui est park.fan ?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Familles"
            subtitle="Planifier une journée parfaite pour tout le monde"
          >
            <Li>Calendrier d&apos;affluence : quel jour a les files les plus courtes ?</Li>
            <Li>
              Météo dans le calendrier : journée pluvieuse ? Consulte les attractions intérieures !
            </Li>
            <Li>Favoris : sauvegarde les 10 attractions incontournables pour les enfants.</Li>
            <Li>
              Temps d&apos;attente en direct : décide à la volée quelle attraction faire ensuite.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Passionnés de Parcs"
            subtitle="Chaque minute doit être optimisée"
          >
            <Li>
              Niveau d&apos;affluence (base P50) : comprends si une attraction est vraiment
              au-dessus de la moyenne.
            </Li>
            <Li>Tendances historiques : quand Taron a-t-il habituellement de courtes files ?</Li>
            <Li>
              Indicateurs de tendance : file en hausse ? Attends 20 minutes, elle pourrait
              raccourcir.
            </Li>
            <Li>
              File Individuelle / Lightning Lane : tous les types de file avec horaires et prix.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Primo-Visiteurs"
            subtitle="Première visite dans un grand parc à thème"
          >
            <Li>Recherche : trouve ton parc rapidement, même si tu ne connais pas le nom exact.</Li>
            <Li>Carte du parc : repère-toi avant et pendant ta visite.</Li>
            <Li>
              Badges de statut : vert = en marche, orange = bref incident, gris = fermé
              aujourd&apos;hui.
            </Li>
            <Li>
              Calendrier d&apos;affluence : les couleurs disent tout – vert c&apos;est bien, rouge
              c&apos;est stressant.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Visiteurs Spontanés"
            subtitle="Décision de dernière minute, efficacité maximale"
          >
            <Li>Localisation : park.fan trouve automatiquement ton parc le plus proche.</Li>
            <Li>
              Temps d&apos;attente en direct : vois instantanément ce qui est ouvert et combien de
              temps il faut attendre.
            </Li>
            <Li>Indicateurs de tendance : file en baisse ? Moment idéal pour la rejoindre.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Parcs populaires ─────────────────────────────────────────────── */}
      <Section id="parks" title="Parcs populaires">
        <p className="text-muted-foreground mb-6">
          park.fan couvre plus de 150 parcs d&apos;attractions dans le monde. Voici les plus visités
          de votre région avec des données en direct :
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Glossaire ────────────────────────────────────────────────── */}
      <Section id="glossar" title="Le Glossaire et la Mise en Évidence des Termes">
        <p className="text-muted-foreground mb-4">
          park.fan maintient un{' '}
          <Link href="/glossaire" className="text-primary underline">
            glossaire complet des termes des parcs à thème
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {`des temps d'attente et niveaux d'affluence aux éléments de montagnes russes et files d'attente virtuelles. Chaque entrée inclut une définition courte et une explication détaillée.`}
          </GlossaryInject>
        </p>

        <SubSection title="Mise en évidence automatique des termes sur les pages d'attractions">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {`Sur les pages d'attractions, les termes du glossaire sont automatiquement détectés dans le texte et soulignés en pointillés. En passant la souris, une définition courte apparaît ; un clic mène directement à l'entrée complète du glossaire.`}
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Texte d'exemple (passez la souris sur les termes soulignés)
            </p>
            <p>
              <GlossaryInject>
                {`La meilleure façon de planifier votre visite est de consulter le calendrier d'affluence avant de réserver. Un jour de pointe, les temps d'attente pour les attractions populaires peuvent dépasser 90 minutes. Une file d'attente virtuelle vous permet de réserver votre créneau sans faire la queue, tandis qu'un pass express vous donne accès à une file prioritaire. Vérifiez le niveau d'affluence avant d'acheter.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Conseil">
          Le glossaire complet est disponible sur{' '}
          <Link href="/glossaire" className="text-primary font-medium underline">
            park.fan/glossaire
          </Link>{' '}
          avec des termes organisés en 7 catégories.
        </TipBox>
      </Section>

      {/* ── 11. FAQ ─────────────────────────────────────────────────────────── */}
      <Section id="faq" title="Questions Fréquentes">
        <div className="space-y-4">
          {[
            {
              q: "À quelle fréquence les temps d'attente sont-ils mis à jour ?",
              a: "Les temps d'attente sont mis à jour chaque minute. Pour certains parcs, les mises à jour ont lieu toutes les 2 à 5 minutes selon la disponibilité des données.",
            },
            {
              q: "D'où proviennent les données ?",
              a: 'park.fan obtient des données en direct de ThemeParks.wiki, Queue-Times.com et Wartezeiten.app.',
            },
            {
              q: 'park.fan est-il gratuit ?',
              a: 'Oui, park.fan est entièrement gratuit et ne nécessite aucune inscription.',
            },
            {
              q: 'Les favoris sont-ils synchronisés entre les appareils ?',
              a: "Non, les favoris sont stockés localement dans ton navigateur (localStorage). Ils ne sont disponibles que sur l'appareil où tu les as sauvegardés.",
            },
            {
              q: "Jusqu'à quand le calendrier d'affluence fait-il des prévisions ?",
              a: 'Le calendrier affiche des prévisions pour plus de 30 jours. Les prévisions pour des dates plus éloignées sont naturellement un peu moins précises que celles à court terme.',
            },
            {
              q: 'Combien de parcs sont couverts ?',
              a: 'park.fan couvre actuellement plus de 150 parcs avec plus de 5 000 attractions dans le monde entier – de Walt Disney World et Universal à Europa-Park, Phantasialand et des parcs en Asie et en Australie.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  {q}
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

function ContentITSections() {
  return (
    <>
      {/* ── 1. Ricerca ───────────────────────────────────────────────────────── */}
      <Section id="suche" title="Ricerca">
        <p className="text-muted-foreground mb-4">
          La ricerca globale è il modo più rapido per trovare un parco, un&apos;attrazione, uno
          spettacolo o un ristorante – sia su desktop che su mobile.
        </p>

        <SubSection title="Aprire la ricerca">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Desktop:</strong> Premi{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              o <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) per aprire la ricerca in qualsiasi momento.
            </p>
            <p>
              <strong>Mobile e Desktop:</strong> Tocca l&apos;icona{' '}
              <Search className="inline h-4 w-4" /> nell&apos;intestazione o nel campo di ricerca
              nella pagina principale.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="Cosa puoi cercare">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parchi', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attrazioni', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Città e Paesi', desc: 'Orlando, Parigi, Germania...' },
              { icon: '🎭', label: 'Spettacoli', desc: 'Orari e programmi degli show' },
              {
                icon: '🍽️',
                label: 'Ristoranti',
                desc: "Opzioni ristorative all'interno dei parchi",
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <InfoBox label="Nota">
          La ricerca utilizza una ricerca full-text intelligente che funziona anche con errori di
          battitura. Cerca &quot;fantasia&quot; e troverai &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>

      {/* ── 2. Posizione ─────────────────────────────────────────────────────── */}
      <Section id="standort" title="Posizione e Parchi Vicini">
        <p className="text-muted-foreground mb-4">
          Con la posizione attivata, park.fan diventa più intelligente: vedi i parchi e le
          attrazioni nelle vicinanze ordinati per distanza. park.fan non memorizza la tua posizione.
        </p>
        <SubSection title="Navigazione nel parco">
          <p className="text-muted-foreground text-sm">
            Quando sei in un parco, park.fan rileva automaticamente in quale parco ti trovi e mostra
            &quot;Sei in [Nome del Parco]&quot; nella pagina principale. La mappa del parco
            visualizza la tua posizione in tempo reale – perfetta per muoverti tra le attrazioni.
          </p>
        </SubSection>
        <NearbyParksCard />
      </Section>

      {/* ── 3. Preferiti ─────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Preferiti">
        <p className="text-muted-foreground mb-4">
          Salva parchi, attrazioni, spettacoli e ristoranti come preferiti per accedervi rapidamente
          dalla pagina principale.
        </p>

        <SubSection title="Aggiungere un preferito">
          <p className="text-sm">
            Clicca sulla stella <Star className="inline h-4 w-4 text-yellow-500" /> su qualsiasi
            scheda di parco o attrazione. I preferiti vengono salvati localmente nel tuo browser –
            nessuna registrazione richiesta.
          </p>
        </SubSection>

        <SubSection title="Preferiti nella pagina principale">
          <p className="text-muted-foreground text-sm">
            Con almeno un preferito salvato, nella pagina principale appare una sezione dedicata con
            tutti i tuoi parchi, attrazioni, spettacoli e ristoranti salvati. Con la posizione
            attivata, vengono ordinati per distanza – il più vicino per primo.
          </p>
          <MockNearbyCards locale="en" />
        </SubSection>

        <SubSection title="Cosa viene salvato?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parchi',
                desc: "Stato, orari di apertura e livello di affluenza in un colpo d'occhio",
              },
              {
                icon: '🎢',
                label: 'Attrazioni',
                desc: 'Tempo di attesa in diretta e tendenza direttamente nel riepilogo',
              },
              { icon: '🎭', label: 'Spettacoli', desc: 'Il prossimo orario sempre visibile' },
              { icon: '🍽️', label: 'Ristoranti', desc: 'Stato cucina e posizione' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox label="Consiglio">
          Salva tra 5 e 10 attrazioni preferite del parco che intendi visitare. Il giorno della
          visita vedrai immediatamente quali hanno tempi di attesa brevi – ideale per decidere al
          volo.
        </TipBox>
      </Section>

      {/* ── 4. Pagina del Parco ──────────────────────────────────────────────── */}
      <Section id="parkseite" title="La Pagina del Parco">
        <p className="text-muted-foreground mb-4">
          Ogni parco ha la propria pagina con dati in tempo reale, orari di apertura, un calendario
          interattivo e una mappa.
        </p>
        <InfoBox label="Nota">
          Tutti gli orari sono visualizzati nel <strong>fuso orario locale del parco</strong> –
          indipendentemente da dove ti trovi. Un parco in Florida mostra l&apos;ora orientale,
          Europa-Park mostra l&apos;ora dell&apos;Europa Centrale.
        </InfoBox>
        <MockParkHeader locale="en" />

        <SubSection title="Schede – Attrazioni, Spettacoli, Calendario, Mappa">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Attrazioni',
                desc: 'Tutte le attrazioni con tempo di attesa in diretta, stato, tendenza e confronto con la media.',
              },
              {
                icon: '🎭',
                label: 'Spettacoli',
                desc: 'Tutti gli spettacoli con stato attuale e prossimi orari.',
              },
              {
                icon: '📅',
                label: 'Calendario',
                desc: 'Previsione su 30+ giorni con previsioni di affluenza, meteo, festività e vacanze scolastiche.',
              },
              {
                icon: '🗺️',
                label: 'Mappa',
                desc: 'Mappa interattiva con tutte le attrazioni, gli spettacoli e i ristoranti.',
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold">
                  {icon} {label}
                </p>
                <p className="text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <MockAttractionCards locale="en" />
        </SubSection>

        <SubSection title="Scheda Spettacoli: Orari in un colpo d'occhio">
          <p className="text-muted-foreground text-sm">
            La scheda Spettacoli elenca tutti gli show con i loro orari per oggi. Gli orari passati
            appaiono barrati, il <strong>prossimo spettacolo</strong> è evidenziato in verde – così
            sai sempre quando e dove essere.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Attrazioni e spettacoli stagionali">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Alcune attrazioni stagionali e show funzionano solo in certi periodi dell&apos;anno —
              come le piste di pattinaggio in inverno o le attrazioni acquatiche in estate. park.fan
              lo rileva automaticamente e nasconde queste voci fuori stagione per impostazione
              predefinita.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Inverno',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: "L'attrazione è attualmente in stagione (es. evento invernale). Il badge appare sulla scheda.",
                },
                {
                  icon: Sun,
                  label: 'Estate',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: "Attrazione estiva – es. scivolo d'acqua. Attiva da maggio a settembre.",
                },
                {
                  icon: Leaf,
                  label: 'Stagionale',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Fuori stagione: badge attenuato. Attrazione nascosta nei tab e nella mappa di default.',
                },
              ].map(({ icon: Icon, label, color, opacity, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md',
                      color,
                      opacity
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <button className="border-border/60 bg-background/60 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md">
                <EyeOff className="h-3 w-3" />3 fuori stagione
              </button>
              <p className="text-muted-foreground text-sm">
                Quando ci sono voci fuori stagione nascoste, questo pulsante appare accanto al
                titolo della sezione. Cliccaci sopra per mostrarle.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Badge ─────────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badge e Indicatori di Stato">
        <p className="text-muted-foreground mb-4">
          park.fan utilizza un sistema di colori coerente per rendere le informazioni immediatamente
          comprensibili.
        </p>

        <SubSection title="Stato di Parchi e Attrazioni">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color:
                  'bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40',
                label: 'In funzione',
                desc: "L'attrazione / il parco è operativo. I tempi di attesa vengono aggiornati in diretta.",
              },
              {
                icon: AlertTriangle,
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                label: 'Guasto',
                desc: 'Chiuso temporaneamente – p. es. problema tecnico o pausa di sicurezza. Di solito breve.',
              },
              {
                icon: XCircle,
                color:
                  'bg-status-closed/65 border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40',
                label: 'Chiuso',
                desc: 'Nessuna operazione oggi – chiusura stagionale o giorno di riposo programmato.',
              },
              {
                icon: Wrench,
                color:
                  'bg-status-refurbishment/65 border-status-refurbishment/80 dark:bg-status-refurbishment/25 dark:border-status-refurbishment/40',
                label: 'Ristrutturazione',
                desc: 'Manutenzione prolungata. Chiuso per giorni o settimane.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Livelli di Affluenza">
          <p className="text-muted-foreground mb-3 text-sm">
            Il livello di affluenza mostra quanto è affollato un parco o un&apos;attrazione rispetto
            alla mediana storica dei tempi di attesa (P50). Il 100% significa esattamente affollato
            come un giorno medio.
          </p>
          <div className="space-y-3">
            {[
              {
                color:
                  'bg-crowd-very-low/65 border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
                label: 'Molto Bassa',
                icon: User,
                threshold: '≤ 60% di P50',
                desc: 'Notevolmente più tranquillo del solito. Quasi nessuna coda – giorno ideale per visitare.',
              },
              {
                color:
                  'bg-crowd-low/65 border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
                label: 'Bassa',
                icon: User,
                threshold: '61–89% di P50',
                desc: 'Sotto la media – brevi tempi di attesa per la maggior parte delle attrazioni.',
              },
              {
                color:
                  'bg-crowd-moderate/65 border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
                label: 'Moderata',
                icon: Users,
                threshold: '90–110% di P50',
                desc: "Giorno tipico – tempi di attesa nell'intervallo previsto (±10% della mediana).",
              },
              {
                color:
                  'bg-crowd-high/65 border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
                label: 'Alta',
                icon: Users,
                threshold: '111–150% di P50',
                desc: 'Più affollato della media – tempi di attesa notevolmente più lunghi.',
              },
              {
                color:
                  'bg-crowd-very-high/65 border-crowd-very-high/80 dark:bg-crowd-very-high/25 dark:border-crowd-very-high/40',
                label: 'Molto Alta',
                icon: Users,
                threshold: '151–200% di P50',
                desc: 'Molto affollato – attese quasi il doppio del solito. Arriva presto.',
              },
              {
                color:
                  'bg-crowd-extreme/65 border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
                label: 'Estrema',
                icon: AlertTriangle,
                threshold: '> 200% di P50',
                desc: 'Affluenza record – più del doppio di un giorno tipico. Vacanze scolastiche, eventi speciali.',
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[100px] flex-col gap-1 sm:min-w-[120px]">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
          <InfoBox label="Nota">
            <strong>Come viene calcolato il livello di affluenza?</strong> park.fan confronta il
            tempo di attesa medio attuale con la mediana storica (P50). Il 100% significa affollato
            come un giorno medio; il 60% è notevolmente più tranquillo, il 200% significa il doppio
            dell&apos;affluenza normale.
          </InfoBox>
        </SubSection>

        <SubSection title="Indicatori di Tendenza">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'In aumento',
                desc: 'La coda si allunga. Unisciti presto.',
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Stabile',
                desc: 'Il tempo di attesa rimane costante.',
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'In calo',
                desc: 'La coda si accorcia – buon momento per unirsi.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-28 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Tipi di Coda">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Fila Singola',
                termId: 'single-rider',
                desc: 'Spesso molto più breve della fila normale – ma non puoi andarci con il tuo gruppo.',
              },
              {
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: "Pass express a pagamento (p. es. da Disney). Mostra il prezzo attuale e l'ora di ritorno.",
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Ora di Ritorno',
                termId: 'virtual-queue',
                desc: 'Coda virtuale gratuita – prenota uno slot orario e torna più tardi.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: "Gruppo d'Imbarco",
                termId: 'boarding-group',
                desc: 'Coda virtuale con numero di gruppo – popolare per le nuove attrazioni molto richieste.',
              },
            ].map(({ color, icon, label, termId, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} termId={termId} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 6. Calendario ────────────────────────────────────────────────────── */}
      <Section id="kalender" title="Il Calendario di Affluenza">
        <p className="text-muted-foreground mb-4">
          Il calendario è lo strumento di pianificazione più potente di park.fan. Mostra una
          previsione basata sull&apos;IA per ciascuno dei prossimi 30+ giorni – livello di
          affluenza, orari di apertura, meteo ed eventi speciali, tutto in un colpo d&apos;occhio.
        </p>

        <SubSection title="Cosa mostra ogni scheda del calendario?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">Una scheda tipica del calendario mostra:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Data e giorno della settimana</strong>
              </li>
              <li>
                🎯 <strong>Badge Affluenza</strong> (p. es. &quot;Molto Alta&quot;) – la previsione
                IA dell&apos;affollamento complessivo
              </li>
              <li>
                🕐 <strong>Orari di apertura</strong> – o &quot;Est.&quot; se non ancora confermati
                ufficialmente
              </li>
              <li>
                🌤️ <strong>Previsione meteo</strong> con temperature min./max.
              </li>
              <li>
                ⌚ <strong>Tempo di attesa medio</strong> – attesa media prevista su tutte le
                attrazioni
              </li>
              <li>
                🎟️ <strong>Prezzo del biglietto</strong>, quando pubblicato dal parco
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>Cosa significa &quot;Est.&quot;?</strong> Gli orari contrassegnati
            &quot;Est.&quot; (Stimato) non sono ancora stati confermati ufficialmente dal parco.
            park.fan li deriva da pattern storici – possono ancora cambiare.
          </p>
        </SubSection>

        <SubSection title="Icone della scheda del calendario">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Festività',
                desc: 'I parchi spesso aprono più a lungo, ma sono anche più affollati. Controlla la previsione!',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'Vacanze Scolastiche',
                desc: "Di solito i giorni più affollati dell'anno – possibili tempi di attesa estremi.",
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Ponte',
                desc: 'Probabilmente più affollato poiché molte persone prolungano i fine settimana lunghi.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Parco Chiuso',
                desc: 'Nessuna operazione quel giorno – nessuna previsione disponibile.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Esempio pratico: trovare il giorno di visita migliore">
          <p className="text-muted-foreground mb-3 text-sm">
            Stai pianificando una visita a Europa-Park in ottobre. Ecco come usare il calendario:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Apri la pagina del parco e passa alla scheda <strong>Calendario</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Vedrai subito le settimane di vacanze scolastiche – molte schede con l&apos;icona{' '}
                <Backpack className="inline h-4 w-4 text-yellow-500" /> e badge{' '}
                <strong>&quot;Molto Alta&quot;</strong> o <strong>&quot;Estrema&quot;</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Cerca un martedì o mercoledì <em>senza</em> icona di festività – mostrano spesso
                <strong> &quot;Bassa&quot;</strong> o <strong>&quot;Moderata&quot;</strong>. Gli
                orari di apertura e le previsioni meteo ti aiutano a decidere.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Acquista i biglietti in anticipo – nei giorni verdi del calendario, i posti possono
                essere limitati.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="it" />
          </div>
        </SubSection>

        <SubSection title="Calendario delle attrazioni">
          <p className="text-muted-foreground text-sm">
            La pagina di dettaglio di ogni attrazione ha anche un calendario storico che mostra
            quanto era affollata ogni giorno passato – e se era in funzione o meno. Perfetto per
            individuare pattern ricorrenti: Taron aveva costantemente brevi attese il giovedì
            pomeriggio nel mese scorso? Potrebbe essere così anche la prossima settimana.
          </p>
        </SubSection>

        <TipBox label="Consiglio">
          I giorni di visita migliori sono tipicamente i giorni feriali fuori dalle vacanze
          scolastiche – martedì, mercoledì e giovedì mostrano i livelli di affluenza più bassi.
          Evita le settimane di vacanze scolastiche nelle regioni densamente popolate.
        </TipBox>
      </Section>

      {/* ── 7. Previsioni IA ─────────────────────────────────────────────────── */}
      <Section id="prognosen" title="Previsioni con IA">
        <p className="text-muted-foreground mb-4">
          park.fan utilizza il machine learning per prevedere i livelli di affluenza e i tempi di
          attesa con giorni di anticipo. Il modello viene continuamente addestrato su nuovi dati e
          considera quattro fattori chiave:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Dati storici',
              desc: 'Milioni di punti dati per attrazione, giorno della settimana e ora del giorno.',
            },
            {
              icon: '📅',
              title: 'Calendari delle ferie',
              desc: 'Vacanze scolastiche e festività in Europa e nel mondo.',
            },
            {
              icon: '🌤️',
              title: 'Previsioni meteo',
              desc: 'Temperatura, pioggia e sole – il maltempo spinge le folle verso le attrazioni al coperto.',
            },
            {
              icon: '🎉',
              title: 'Eventi speciali',
              desc: "Notti di Halloween, eventi natalizi e altre date specifiche dei parchi generano un'affluenza significativamente maggiore.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            </div>
          ))}
        </div>

        <SubSection title="Dove trovare le previsioni">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 Nel calendario di affluenza</p>
              <p className="text-muted-foreground mt-0.5">
                Ogni scheda del calendario contiene una previsione giornaliera: livello di
                affluenza, tempo di attesa medio e orari di apertura – fino a 30+ giorni di
                anticipo.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Badge ora di punta sulla pagina del parco</p>
              <p className="text-muted-foreground mt-0.5">
                L&apos;intestazione del parco mostra quando è previsto il picco di affluenza di oggi
                – p. es. &quot;Picco tra 1h 30min&quot;. Pianifica una pausa pranzo o visita
                un&apos;attrazione meno popolare proprio in quella finestra.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">
                📈 Grafico di previsione oraria sulla pagina dell&apos;attrazione
              </p>
              <p className="text-muted-foreground mt-0.5">
                Ogni attrazione ha la propria pagina con un grafico che mostra come si prevede che i
                tempi di attesa evolvano nel corso della giornata – per oggi e domani.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Esempio pratico: usare le previsioni il giorno della visita">
          <p className="text-muted-foreground mb-3 text-sm">
            Stai visitando Phantasialand un sabato durante le vacanze scolastiche. Il calendario
            mostra &quot;Molto Alta&quot;. Ecco come le previsioni ti aiutano:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>All&apos;ingresso:</strong> Il badge ora di punta mostra &quot;Picco tra
                ~2h&quot; – hai fino alle 11:30 circa per i tuoi primi highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Apri la pagina di Taron:</strong> Il grafico di previsione mostra 9:30 ≈ 15
                min, 12:00 ≈ 65 min, 15:00 ≈ 40 min → vai subito all&apos;apertura o nel pomeriggio.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Pranzo durante il picco:</strong> Invece di fare la coda a mezzogiorno, ne
                approfitti per mangiare. Le tendenze in diretta confermano che alle 15:00
                l&apos;attesa scende – momento perfetto per andare.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="Quanto sono accurate le previsioni?">
          <p className="text-muted-foreground text-sm">
            La precisione varia in base al parco e all&apos;orizzonte di previsione. La pagina di
            dettaglio di ogni attrazione mostra la sua qualità predittiva – da{' '}
            <strong>Scarsa</strong> a <strong>Eccellente</strong>. Più dati storici significa
            previsioni più precise. Le previsioni a breve termine (1–3 giorni) sono intrinsecamente
            più affidabili di quelle a lungo termine (7–14 giorni).
          </p>
        </SubSection>

        <SubSection title="Grafici sparkline dei tempi di attesa">
          <p className="text-muted-foreground text-sm">
            Ogni scheda attrazione mostra un piccolo grafico sparkline con la tendenza dei tempi di
            attesa nelle ultime ore. Puoi vedere istantaneamente se le code stanno aumentando,
            rimanendo stabili o diminuendo.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Consiglio">
          Combina calendario e previsioni: scegli un giorno verde dal calendario, poi controlla la
          previsione oraria sulla pagina dell&apos;attrazione per trovare lo slot più tranquillo.
          Arriverai sempre alla coda più breve.
        </TipBox>
      </Section>

      {/* ── 8. Per chi ───────────────────────────────────────────────────────── */}
      <Section id="personas" title="A chi è rivolto park.fan?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Famiglie"
            subtitle="Pianificare una giornata perfetta per tutti"
          >
            <Li>Calendario di affluenza: quale giorno ha le code più brevi?</Li>
            <Li>Meteo nel calendario: giornata piovosa? Controlla le attrazioni al coperto!</Li>
            <Li>Preferiti: salva le 10 attrazioni imperdibili per i bambini.</Li>
            <Li>Tempi di attesa in diretta: decidi al volo quale attrazione fare dopo.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Appassionati di Parchi"
            subtitle="Ogni minuto deve essere ottimizzato"
          >
            <Li>
              Livello di affluenza (base P50): capisci se un&apos;attrazione è davvero sopra la
              media.
            </Li>
            <Li>Tendenze storiche: quando Taron ha di solito brevi attese?</Li>
            <Li>Indicatori di tendenza: la coda sale? Aspetta 20 minuti e potrebbe accorciarsi.</Li>
            <Li>Fila Singola / Lightning Lane: tutti i tipi di coda con tempi e prezzi.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Visitatori per la Prima Volta"
            subtitle="Prima visita in un grande parco a tema"
          >
            <Li>Ricerca: trova il tuo parco rapidamente, anche se non conosci il nome esatto.</Li>
            <Li>Mappa del parco: orientati prima e durante la visita.</Li>
            <Li>
              Badge di stato: verde = in funzione, arancione = breve problema, grigio = chiuso oggi.
            </Li>
            <Li>
              Calendario di affluenza: i colori dicono tutto – verde è bene, rosso è stressante.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Visitatori Spontanei"
            subtitle="Decisione dell'ultimo minuto, massima efficienza"
          >
            <Li>Posizione: park.fan trova automaticamente il parco più vicino a te.</Li>
            <Li>
              Tempi di attesa in diretta: vedi istantaneamente cosa è aperto e quanto si aspetta.
            </Li>
            <Li>Indicatori di tendenza: la coda scende? Il momento perfetto per unirsi.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Parchi popolari ──────────────────────────────────────────────── */}
      <Section id="parks" title="Parchi popolari">
        <p className="text-muted-foreground mb-6">
          park.fan copre oltre 150 parchi divertimento in tutto il mondo. Ecco i più visitati nella
          tua regione con dati in tempo reale:
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Glossario ────────────────────────────────────────────────── */}
      <Section id="glossar" title="Il Glossario e l'Evidenziazione dei Termini">
        <p className="text-muted-foreground mb-4">
          park.fan mantiene un{' '}
          <Link href="/glossario" className="text-primary underline">
            glossario completo dei termini dei parchi a tema
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {`dai tempi di attesa e livelli di affluenza agli elementi delle montagne russe e code virtuali. Ogni voce include una definizione breve e una spiegazione dettagliata.`}
          </GlossaryInject>
        </p>

        <SubSection title="Evidenziazione automatica dei termini nelle pagine delle attrazioni">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {`Nelle pagine delle attrazioni, i termini del glossario vengono rilevati automaticamente nel testo e sottolineati con una linea tratteggiata. Passando il cursore appare una definizione breve; cliccando si accede direttamente alla voce completa del glossario.`}
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Testo di esempio (passa il cursore sui termini sottolineati)
            </p>
            <p>
              <GlossaryInject>
                {`Il modo migliore per pianificare la tua visita è controllare il calendario dell'affluenza prima di prenotare. In un giorno di punta, i tempi di attesa per le attrazioni più popolari possono superare i 90 minuti. Una coda virtuale ti permette di prenotare il tuo slot senza fare la coda, mentre il single rider può ridurre l'attesa di oltre la metà. Quando il livello di affluenza è alto, il pass express vale spesso la pena.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Suggerimento">
          Il glossario completo è disponibile su{' '}
          <Link href="/glossario" className="text-primary font-medium underline">
            park.fan/glossario
          </Link>{' '}
          con termini organizzati in 7 categorie.
        </TipBox>
      </Section>

      {/* ── 11. FAQ ─────────────────────────────────────────────────────────── */}
      <Section id="faq" title="Domande Frequenti">
        <div className="space-y-4">
          {[
            {
              q: 'Con quale frequenza vengono aggiornati i tempi di attesa?',
              a: 'I tempi di attesa vengono aggiornati ogni minuto. Per alcuni parchi, gli aggiornamenti avvengono ogni 2–5 minuti in base alla disponibilità dei dati.',
            },
            {
              q: 'Da dove provengono i dati?',
              a: 'park.fan ottiene dati in diretta da ThemeParks.wiki, Queue-Times.com e Wartezeiten.app.',
            },
            {
              q: 'park.fan è gratuito?',
              a: 'Sì, park.fan è completamente gratuito e non richiede registrazione.',
            },
            {
              q: 'I preferiti vengono sincronizzati tra i dispositivi?',
              a: 'No, i preferiti vengono salvati localmente nel tuo browser (localStorage). Sono disponibili solo sul dispositivo in cui li hai salvati.',
            },
            {
              q: 'Fino a quanto tempo in anticipo il calendario di affluenza fa previsioni?',
              a: "Il calendario mostra previsioni per oltre 30 giorni. Le previsioni per date più lontane sono naturalmente un po' meno precise di quelle a breve termine.",
            },
            {
              q: 'Quanti parchi sono coperti?',
              a: 'park.fan copre attualmente oltre 150 parchi con più di 5.000 attrazioni in tutto il mondo – da Walt Disney World e Universal a Europa-Park, Phantasialand e parchi in Asia e Australia.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  {q}
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

function ContentNLSections() {
  return (
    <>
      {/* ── 1. Zoeken ────────────────────────────────────────────────────────── */}
      <Section id="suche" title="Zoeken">
        <p className="text-muted-foreground mb-4">
          De globale zoekfunctie is de snelste manier om een park, attractie, show of restaurant te
          vinden – zowel op desktop als mobiel.
        </p>

        <SubSection title="Zoeken openen">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Desktop:</strong> Druk op{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              of <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) om de zoekfunctie op elk moment te openen.
            </p>
            <p>
              <strong>Mobiel en Desktop:</strong> Tik op het <Search className="inline h-4 w-4" />
              -icoon in de koptekst of het zoekveld op de startpagina.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="Wat kun je zoeken?">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parken', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attracties', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Steden en Landen', desc: 'Orlando, Parijs, Duitsland...' },
              { icon: '🎭', label: 'Shows', desc: "Showschema's en tijden" },
              { icon: '🍽️', label: 'Restaurants', desc: 'Eetmogelijkheden in parken' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <InfoBox label="Opmerking">
          De zoekfunctie gebruikt slimme volledige tekstzoekopdrachten die ook werken bij
          typefouten. Zoek naar &quot;fantasia&quot; en je vindt &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>

      {/* ── 2. Locatie ───────────────────────────────────────────────────────── */}
      <Section id="standort" title="Locatie en Nabijgelegen Parken">
        <p className="text-muted-foreground mb-4">
          Met je locatie ingeschakeld wordt park.fan slimmer: zie nabijgelegen parken en attracties
          gesorteerd op afstand. park.fan slaat je locatie niet op.
        </p>
        <SubSection title="Navigatie in het park">
          <p className="text-muted-foreground text-sm">
            Wanneer je in een park bent, detecteert park.fan automatisch in welk park je bent en
            toont &quot;Je bent in [Parknaam]&quot; op de startpagina. De parkkaart toont je live
            locatie – perfect voor navigeren tussen attracties.
          </p>
        </SubSection>
        <NearbyParksCard />
      </Section>

      {/* ── 3. Favorieten ────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favorieten">
        <p className="text-muted-foreground mb-4">
          Sla parken, attracties, shows en restaurants op als favorieten voor snelle toegang direct
          vanaf de startpagina.
        </p>

        <SubSection title="Een favoriet toevoegen">
          <p className="text-sm">
            Klik op de <Star className="inline h-4 w-4 text-yellow-500" />
            -ster op een park- of attractiekaart. Favorieten worden lokaal opgeslagen in je browser
            – geen aanmelding vereist.
          </p>
        </SubSection>

        <SubSection title="Favorieten op de startpagina">
          <p className="text-muted-foreground text-sm">
            Zodra je minstens één favoriet hebt, verschijnt er een speciale sectie op de startpagina
            met al je opgeslagen parken, attracties, shows en restaurants. Met locatie ingeschakeld
            worden ze gesorteerd op afstand – dichtstbijzijnde eerst.
          </p>
          <MockNearbyCards locale="en" />
        </SubSection>

        <SubSection title="Wat wordt opgeslagen?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parken',
                desc: 'Status, openingstijden en drukte in één oogopslag',
              },
              {
                icon: '🎢',
                label: 'Attracties',
                desc: 'Live wachttijd en trend direct in het overzicht',
              },
              { icon: '🎭', label: 'Shows', desc: 'Volgende showtime altijd zichtbaar' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Keukenstatus en locatie' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox label="Tip">
          Sla 5–10 favoriete attracties op van het park dat je wilt bezoeken. Op de dag van je
          bezoek zie je direct welke korte wachttijden hebben – ideaal voor beslissingen ter plekke.
        </TipBox>
      </Section>

      {/* ── 4. Parkpagina ────────────────────────────────────────────────────── */}
      <Section id="parkseite" title="De Parkpagina">
        <p className="text-muted-foreground mb-4">
          Elk park heeft zijn eigen pagina met live data, openingstijden, een interactieve kalender
          en een kaart.
        </p>
        <InfoBox label="Opmerking">
          Alle tijden worden weergegeven in de <strong>lokale tijdzone van het park</strong> –
          ongeacht waar jij je bevindt. Een park in Florida toont Eastern Time, Europa-Park toont
          Midden-Europese Tijd.
        </InfoBox>
        <MockParkHeader locale="en" />

        <SubSection title="Tabbladen – Attracties, Shows, Kalender, Kaart">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Attracties',
                desc: 'Alle attracties met live wachttijd, status, trend en vergelijking met het gemiddelde.',
              },
              {
                icon: '🎭',
                label: 'Shows',
                desc: 'Alle shows met huidige status en komende tijden.',
              },
              {
                icon: '📅',
                label: 'Kalender',
                desc: 'Vooruitblik van 30+ dagen met druktevoorspellingen, weer, feestdagen en schoolvakanties.',
              },
              {
                icon: '🗺️',
                label: 'Kaart',
                desc: 'Interactieve kaart met alle attracties, shows en restaurants.',
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold">
                  {icon} {label}
                </p>
                <p className="text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <MockAttractionCards locale="en" />
        </SubSection>

        <SubSection title="Tabblad Shows: Tijden in één oogopslag">
          <p className="text-muted-foreground text-sm">
            Het tabblad Shows toont alle shows met hun tijden voor vandaag. Verstreken tijden zijn
            doorgestreept, de <strong>volgende showtime</strong> is groen gemarkeerd – zodat je
            altijd weet wanneer en waar je moet zijn.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Seizoensgebonden attracties & shows">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Sommige seizoensattracties en shows zijn alleen actief in bepaalde seizoenen — zoals
              ijsbanen in de winter of waterattracties in de zomer. park.fan detecteert dit
              automatisch en verbergt deze items buiten hun seizoen standaard.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Winter',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: 'Attractie is momenteel in seizoen (bijv. winterevenement). Badge verschijnt op de kaart.',
                },
                {
                  icon: Sun,
                  label: 'Zomer',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: 'Zomerattractie – bijv. wildwaterbaan. Actief van mei tot september.',
                },
                {
                  icon: Leaf,
                  label: 'Seizoensgebonden',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Buiten seizoen: badge gedempt. Attractie standaard verborgen in tabbladen en op de kaart.',
                },
              ].map(({ icon: Icon, label, color, opacity, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md',
                      color,
                      opacity
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <button className="border-border/60 bg-background/60 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md">
                <EyeOff className="h-3 w-3" />3 buiten seizoen
              </button>
              <p className="text-muted-foreground text-sm">
                Wanneer er verborgen items buiten seizoen zijn, verschijnt deze knop naast de
                sectietitel. Klik erop om ze te tonen.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Badges ────────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badges en Statusindicatoren">
        <p className="text-muted-foreground mb-4">
          park.fan gebruikt een consistent kleursysteem om informatie direct begrijpelijk te maken.
        </p>

        <SubSection title="Park- en Attractiestatus">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color:
                  'bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40',
                label: 'In bedrijf',
                desc: 'Attractie / park is in werking. Wachttijden worden live bijgewerkt.',
              },
              {
                icon: AlertTriangle,
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                label: 'Storing',
                desc: 'Tijdelijk gesloten – bijv. technisch probleem of veiligheidspauze. Meestal kort.',
              },
              {
                icon: XCircle,
                color:
                  'bg-status-closed/65 border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40',
                label: 'Gesloten',
                desc: 'Vandaag niet in bedrijf – seizoensluiting of geplande rustdag.',
              },
              {
                icon: Wrench,
                color:
                  'bg-status-refurbishment/65 border-status-refurbishment/80 dark:bg-status-refurbishment/25 dark:border-status-refurbishment/40',
                label: 'Onderhoud',
                desc: 'Uitgebreid onderhoud. Gesloten voor dagen of weken.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Drukteniveaus">
          <p className="text-muted-foreground mb-3 text-sm">
            Het drukteniveau toont hoe druk een park of attractie is ten opzichte van de historische
            mediaan van de wachttijd (P50). 100% betekent precies even druk als een gemiddelde dag.
          </p>
          <div className="space-y-3">
            {[
              {
                color:
                  'bg-crowd-very-low/65 border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
                label: 'Zeer Laag',
                icon: User,
                threshold: '≤ 60% van P50',
                desc: 'Merkbaar rustiger dan gewoonlijk. Bijna geen wachtrijen – ideale bezoekdag.',
              },
              {
                color:
                  'bg-crowd-low/65 border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
                label: 'Laag',
                icon: User,
                threshold: '61–89% van P50',
                desc: 'Onder gemiddeld – korte wachttijden bij de meeste attracties.',
              },
              {
                color:
                  'bg-crowd-moderate/65 border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
                label: 'Matig',
                icon: Users,
                threshold: '90–110% van P50',
                desc: 'Typische dag – wachttijden binnen het verwachte bereik (±10% van mediaan).',
              },
              {
                color:
                  'bg-crowd-high/65 border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
                label: 'Hoog',
                icon: Users,
                threshold: '111–150% van P50',
                desc: 'Drukker dan gemiddeld – merkbaar langere wachttijden.',
              },
              {
                color:
                  'bg-crowd-very-high/65 border-crowd-very-high/80 dark:bg-crowd-very-high/25 dark:border-crowd-very-high/40',
                label: 'Zeer Hoog',
                icon: Users,
                threshold: '151–200% van P50',
                desc: 'Zeer druk – wachttijden bijna twee keer zo lang als gewoonlijk. Kom vroeg aan.',
              },
              {
                color:
                  'bg-crowd-extreme/65 border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
                label: 'Extreem',
                icon: AlertTriangle,
                threshold: '> 200% van P50',
                desc: 'Recorddrukte – meer dan twee keer zo druk als een normale dag. Schoolvakanties, speciale evenementen.',
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[100px] flex-col gap-1 sm:min-w-[120px]">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
          <InfoBox label="Opmerking">
            <strong>Hoe wordt het drukteniveau berekend?</strong> park.fan vergelijkt de huidige
            gemiddelde wachttijd met de historische mediaan (P50). 100% betekent even druk als een
            gemiddelde dag; 60% is merkbaar rustiger, 200% betekent twee keer zo druk als normaal.
          </InfoBox>
        </SubSection>

        <SubSection title="Trendindicatoren">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'Stijgend',
                desc: 'Wachtrij wordt langer. Sluit snel aan.',
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Stabiel',
                desc: 'Wachttijd blijft constant.',
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'Dalend',
                desc: 'Wachtrij wordt korter – goed moment om aan te sluiten.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-24 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Wachtrij-typen">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Single Rider',
                termId: 'single-rider',
                desc: 'Vaak veel korter dan de gewone rij – maar je kunt niet met je groep meerijden.',
              },
              {
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: 'Betaald express-pas (bijv. bij Disney). Toont huidige prijs en terugtijdstip.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Terugtijdstip',
                termId: 'virtual-queue',
                desc: 'Gratis virtuele wachtrij – reserveer een tijdslot en kom later terug.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Boardinggroep',
                termId: 'boarding-group',
                desc: 'Virtuele wachtrij met groepsnummer – populair voor veelgevraagde nieuwe attracties.',
              },
            ].map(({ color, icon, label, termId, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} termId={termId} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 6. Drukte-kalender ───────────────────────────────────────────────── */}
      <Section id="kalender" title="De Drukte-Kalender">
        <p className="text-muted-foreground mb-4">
          De kalender is het krachtigste planningsinstrument op park.fan. Het toont een AI-gestuurde
          voorspelling voor elk van de komende 30+ dagen – drukteniveau, openingstijden, weer en
          speciale evenementen, alles in één oogopslag.
        </p>

        <SubSection title="Wat staat er op elke kalenderkaart?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">Een typische kalenderkaart toont:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Datum en weekdag</strong>
              </li>
              <li>
                🎯 <strong>Druktebadge</strong> (bijv. &quot;Zeer Hoog&quot;) – de AI-voorspelling
                van de algehele drukte
              </li>
              <li>
                🕐 <strong>Openingstijden</strong> – of &quot;Geschat&quot; als nog niet officieel
                bevestigd
              </li>
              <li>
                🌤️ <strong>Weersvoorspelling</strong> met min-/maxtemperatuur
              </li>
              <li>
                ⌚ <strong>Gem. wachttijd</strong> – voorspelde gemiddelde wachttijd over alle
                attracties
              </li>
              <li>
                🎟️ <strong>Entreeprijs</strong>, wanneer gepubliceerd door het park
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>Wat betekent &quot;Geschat&quot;?</strong> Openingstijden gemarkeerd als
            &quot;Geschat&quot; zijn nog niet officieel bevestigd door het park. park.fan leidt ze
            af uit historische patronen – ze kunnen nog veranderen.
          </p>
        </SubSection>

        <SubSection title="Kalenderkaart-iconen">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Feestdag',
                desc: 'Parken zijn vaak langer open, maar ook drukker. Bekijk de voorspelling!',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'Schoolvakantie',
                desc: 'Doorgaans de drukste dagen van het jaar – extreme wachttijden mogelijk.',
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Brugdag',
                desc: 'Waarschijnlijk drukker omdat veel mensen lange weekenden verlengen.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Park Gesloten',
                desc: 'Geen operatie op deze dag – geen voorspelling beschikbaar.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Praktisch voorbeeld: de beste bezoekdag vinden">
          <p className="text-muted-foreground mb-3 text-sm">
            Je plant een bezoek aan Europa-Park in oktober. Zo gebruik je de kalender:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Open de parkpagina en schakel naar het tabblad <strong>Kalender</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Je ziet meteen de schoolvakantieweken – veel kaarten met het{' '}
                <Backpack className="inline h-4 w-4 text-yellow-500" />
                -icoon en badges van <strong>&quot;Zeer Hoog&quot;</strong> of{' '}
                <strong>&quot;Extreem&quot;</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Zoek een dinsdag of woensdag <em>zonder</em> feestdagicoon – deze tonen vaak
                <strong> &quot;Laag&quot;</strong> of <strong>&quot;Matig&quot;</strong>.
                Openingstijden en weersvoorspelling helpen je de definitieve keuze te maken.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Koop tickets vooraf – op groene voorspellingsdagen kunnen tickets snel uitverkocht
                zijn.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="nl" />
          </div>
        </SubSection>

        <SubSection title="Attractiekalender">
          <p className="text-muted-foreground text-sm">
            De detailpagina van elke attractie heeft ook een historische kalender die toont hoe druk
            het was op elke afgelopen dag – en of de attractie in bedrijf was of niet. Perfect om
            terugkerende patronen te herkennen: had Taron de afgelopen maand consequent korte
            wachttijden op donderdagmiddag? Volgende week misschien ook.
          </p>
        </SubSection>

        <TipBox label="Tip">
          De beste bezoekdagen zijn doorgaans vroege weekdagen buiten schoolvakanties – dinsdag tot
          donderdag vertonen de laagste drukteniveaus. Vermijd schoolvakantieweken in dichtbevolkte
          regio&apos;s.
        </TipBox>
      </Section>

      {/* ── 7. AI-Voorspellingen ─────────────────────────────────────────────── */}
      <Section id="prognosen" title="AI-Voorspellingen">
        <p className="text-muted-foreground mb-4">
          park.fan gebruikt machine learning om drukteniveaus en wachttijden dagen van tevoren te
          voorspellen. Het model wordt continu getraind op nieuwe data en houdt rekening met vier
          sleutelfactoren:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Historische data',
              desc: 'Miljoenen wachtrij-datapunten per attractie, weekdag en tijdstip.',
            },
            {
              icon: '📅',
              title: 'Vakantiekalenders',
              desc: 'Schoolvakanties en feestdagen in Europa en wereldwijd.',
            },
            {
              icon: '🌤️',
              title: 'Weersvoorspellingen',
              desc: 'Temperatuur, regen en zonneschijn – slecht weer duwt bezoekers naar overdekte attracties.',
            },
            {
              icon: '🎉',
              title: 'Speciale evenementen',
              desc: 'Halloween-nachten, kerstevenementen en andere parkeigen data zorgen voor significant hogere bezoekersaantallen.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            </div>
          ))}
        </div>

        <SubSection title="Waar vind je voorspellingen?">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 In de drukte-kalender</p>
              <p className="text-muted-foreground mt-0.5">
                Elke kalenderkaart bevat een dagelijkse voorspelling: drukteniveau, gemiddelde
                wachttijd en openingstijden – tot 30+ dagen vooruit.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Piekmomenten-badge op de parkpagina</p>
              <p className="text-muted-foreground mt-0.5">
                De parkkoptekst toont wanneer de druktepiek van vandaag verwacht wordt – bijv.
                &quot;Piek over 1u 30min&quot;. Plan een lunchpauze of bezoek een minder populaire
                attractie precies in dat tijdvenster.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📈 Uursvoorspellingsgrafiek op de attractiepagina</p>
              <p className="text-muted-foreground mt-0.5">
                Elke attractie heeft zijn eigen pagina met een grafiek die laat zien hoe wachttijden
                naar verwachting verlopen door de dag – voor vandaag en morgen.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Praktisch voorbeeld: voorspellingen gebruiken op de dag zelf">
          <p className="text-muted-foreground mb-3 text-sm">
            Je bezoekt Phantasialand op een zaterdag tijdens schoolvakanties. De kalender toont
            &quot;Zeer Hoog&quot;. Zo helpen voorspellingen:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>Bij de ingang:</strong> De piekmomenten-badge toont &quot;Piek over
                ~2u&quot; – je hebt tot ongeveer 11:30 voor je eerste hoogtepunten.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Open de Taron-pagina:</strong> De voorspellingsgrafiek toont 9:30 ≈ 15 min,
                12:00 ≈ 65 min, 15:00 ≈ 40 min → rijd direct bij opening of midden in de middag.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Lunch tijdens de piek:</strong> In plaats van in de rij te staan om 12:00,
                ga je lunchen. Live trends bevestigen: om 15:00 daalt de wachttijd – perfect moment
                om te rijden.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="Hoe nauwkeurig zijn de voorspellingen?">
          <p className="text-muted-foreground text-sm">
            De nauwkeurigheid varieert per park en voorspellingsvenster. De detailpagina van elke
            attractie toont de voorspellingskwaliteit – van <strong>Slecht</strong> tot{' '}
            <strong>Uitstekend</strong>. Meer historische data betekent nauwkeurigere
            voorspellingen. Kortetermijnvoorspellingen (1–3 dagen) zijn van nature betrouwbaarder
            dan langetermijnvoorspellingen (7–14 dagen).
          </p>
        </SubSection>

        <SubSection title="Wachttijd-sparklines">
          <p className="text-muted-foreground text-sm">
            Elke attractiekaart toont een kleine sparkline-grafiek met de wachttijdtrend over de
            afgelopen uren. Je ziet direct of wachtrijen toenemen, stabiel blijven of afnemen.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Tip">
          Combineer kalender en voorspellingen: kies een groene dag uit de kalender, controleer dan
          de uursvoorspelling op de attractiepagina voor het rustigste tijdslot. Je arriveert altijd
          bij de kortste wachtrij.
        </TipBox>
      </Section>

      {/* ── 8. Voor wie ──────────────────────────────────────────────────────── */}
      <Section id="personas" title="Voor wie is park.fan?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Gezinnen"
            subtitle="Een perfecte dag plannen voor iedereen"
          >
            <Li>Drukte-kalender: welke dag heeft de kortste wachtrijen?</Li>
            <Li>Weer in de kalender: regenachtige dag? Bekijk overdekte attracties!</Li>
            <Li>Favorieten: sla de 10 must-do attracties voor kinderen op.</Li>
            <Li>Live wachttijden: beslis ter plekke welke attractie je als volgende doet.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Pretpark-enthousiastelingen"
            subtitle="Elke minuut moet geoptimaliseerd zijn"
          >
            <Li>Drukteniveau (P50-basis): begrijp of een attractie echt boven gemiddeld is.</Li>
            <Li>Historische trends: wanneer heeft Taron doorgaans korte wachttijden?</Li>
            <Li>Trendindicatoren: wachtrij stijgt? Wacht 20 minuten en het kan korter zijn.</Li>
            <Li>Single Rider / Lightning Lane: alle wachtrij-typen met tijden en prijzen.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Eerstebezoekende"
            subtitle="Eerste bezoek aan een groot pretpark"
          >
            <Li>Zoeken: vind je park snel, ook als je de exacte naam niet weet.</Li>
            <Li>Parkkaart: oriënteer je voor en tijdens je bezoek.</Li>
            <Li>
              Statusbadges: groen = in bedrijf, oranje = kort probleem, grijs = vandaag gesloten.
            </Li>
            <Li>Drukte-kalender: kleuren zeggen alles – groen is goed, rood is stressvol.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Spontane Bezoekers"
            subtitle="Last-minute beslissing, maximale efficiëntie"
          >
            <Li>Locatie: park.fan vindt automatisch je dichtstbijzijnde park.</Li>
            <Li>Live wachttijden: zie direct wat open is en hoe lang de wachttijd is.</Li>
            <Li>Trendindicatoren: wachtrij daalt? Perfect moment om aan te sluiten.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Populaire parken ─────────────────────────────────────────────── */}
      <Section id="parks" title="Populaire parken">
        <p className="text-muted-foreground mb-6">
          park.fan dekt 150+ pretparken wereldwijd. Hier zijn de meest bezochte parken in jouw regio
          met live data:
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Woordenlijst ─────────────────────────────────────────────── */}
      <Section id="glossar" title="De Woordenlijst & Termijn-Markering">
        <p className="text-muted-foreground mb-4">
          park.fan beheert een volledige{' '}
          <Link href="/woordenboek" className="text-primary underline">
            woordenlijst van pretparkbegrippen
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {`van wachttijden en drukte-niveaus tot achtbaanelementen en virtuele wachtrijen. Elke term bevat een korte definitie en een uitgebreide uitleg.`}
          </GlossaryInject>
        </p>

        <SubSection title="Automatische termijn-markering op attractiepagina's">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {`Op attractiepagina's worden woordenlijst-termen automatisch herkend in tekst en onderstreept met een stippellijn. Bij hover verschijnt een korte definitie; klikken brengt je direct naar het volledige woordenlijst-item.`}
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Voorbeeldtekst (hover over de gestippelde termen)
            </p>
            <p>
              <GlossaryInject>
                {`De beste manier om je bezoek te plannen is de druktekalender te bekijken voor je boekt. Op een piekdag kunnen wachttijden voor populaire attracties 90 minuten overschrijden. Een virtuele wachtrij laat je een tijdslot reserveren zonder in de rij te staan, terwijl de single rider-rij je wacht meer dan de helft kan verminderen. Als het drukte-niveau hoog is, is een express pas vaak de moeite waard.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Tip">
          De volledige woordenlijst is beschikbaar op{' '}
          <Link href="/woordenboek" className="text-primary font-medium underline">
            park.fan/woordenlijst
          </Link>{' '}
          met termen in 7 categorieën.
        </TipBox>
      </Section>

      {/* ── 11. Veelgestelde Vragen ──────────────────────────────────────────────────────────── */}
      <Section id="faq" title="Veelgestelde Vragen">
        <div className="space-y-4">
          {[
            {
              q: 'Hoe vaak worden wachttijden bijgewerkt?',
              a: 'Wachttijden worden elke minuut bijgewerkt. Voor sommige parken vinden updates elke 2–5 minuten plaats, afhankelijk van de databeschikbaarheid.',
            },
            {
              q: 'Waar komen de gegevens vandaan?',
              a: 'park.fan haalt live data op van ThemeParks.wiki, Queue-Times.com en Wartezeiten.app.',
            },
            {
              q: 'Is park.fan gratis?',
              a: 'Ja, park.fan is volledig gratis en vereist geen registratie.',
            },
            {
              q: 'Worden favorieten gesynchroniseerd tussen apparaten?',
              a: 'Nee, favorieten worden lokaal opgeslagen in je browser (localStorage). Ze zijn alleen beschikbaar op het apparaat waar je ze hebt opgeslagen.',
            },
            {
              q: 'Hoe ver vooruit doet de drukte-kalender voorspellingen?',
              a: 'De kalender toont voorspellingen voor 30+ dagen. Voorspellingen voor verdere datums zijn van nature iets minder nauwkeurig dan voorspellingen op korte termijn.',
            },
            {
              q: 'Hoeveel parken zijn er beschikbaar?',
              a: 'park.fan dekt momenteel 150+ parken met 5.000+ attracties wereldwijd – van Walt Disney World en Universal tot Europa-Park, Phantasialand en parken in Azië en Australië.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  {q}
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

function ContentEN() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroEN />
      <ContentENSections />
    </div>
  );
}

function ContentES() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroES />
      <ContentESSections />
    </div>
  );
}

function ContentFR() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroFR />
      <ContentFRSections />
    </div>
  );
}

function ContentIT() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroIT />
      <ContentITSections />
    </div>
  );
}

function ContentNL() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroNL />
      <ContentNLSections />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HowtoPage({ params }: HowtoPageProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }

  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <div>
        <LocaleContent
          locale={locale as Locale}
          de={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">Wie funktioniert park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                Die vollständige Anleitung für Freizeitpark-Besucher – von der Suche über den
                Crowd-Kalender bis zu allen Badges und KI-Prognosen.
              </p>
              <ContentDE />
            </>
          }
          en={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">How does park.fan work?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                The complete guide for theme park visitors – from search and favorites to the crowd
                calendar, AI predictions and all badges explained.
              </p>
              <ContentEN />
            </>
          }
          es={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">¿Cómo funciona park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                La guía completa para visitar parques temáticos – desde la búsqueda y los favoritos
                hasta el calendario de afluencia, las predicciones IA y todos los indicadores
                explicados.
              </p>
              <ContentES />
            </>
          }
          fr={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">Comment fonctionne park.fan ?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                Le guide complet pour les visiteurs de parcs d&apos;attractions – de la recherche
                aux favoris en passant par le calendrier d&apos;affluence, les prédictions IA et
                tous les indicateurs expliqués.
              </p>
              <ContentFR />
            </>
          }
          it={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">Come funziona park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                La guida completa per i visitatori dei parchi divertimento – dalla ricerca ai
                preferiti, passando per il calendario dell&apos;affluenza, le previsioni IA e tutti
                gli indicatori spiegati.
              </p>
              <ContentIT />
            </>
          }
          nl={
            <>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl">Hoe werkt park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                De complete gids voor pretparkbezoekers – van zoeken en favorieten tot de
                drukte-kalender, AI-voorspellingen en alle badges uitgelegd.
              </p>
              <ContentNL />
            </>
          }
        />
      </div>
    </div>
  );
}
