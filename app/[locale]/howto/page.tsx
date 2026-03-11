/* eslint-disable react/no-unescaped-entities */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, generateAlternateLanguages, localeToOpenGraphLocale } from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { LocaleContent } from '@/components/common/locale-content';
import { getIntegratedCalendar } from '@/lib/api/integrated-calendar';
import type { CalendarDay } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { HeroSearchInput } from '@/components/search/hero-search-input';
import { NearbyParksCard } from '@/components/parks/nearby-parks-card';
import { TrendIndicator } from '@/components/parks/trend-indicator';
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
  Navigation,
  Snowflake,
  Wind,
  Sun,
  Info,
  Lightbulb,
} from 'lucide-react';

interface HowtoPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: HowtoPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'howto' });
  const ogImageUrl = getOgImageUrl([locale, 'howto']);

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `https://park.fan/${locale}/howto`,
      siteName: 'park.fan',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
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
    keywords: [
      'Freizeitpark Wartezeiten',
      'Freizeitpark App',
      'park.fan Anleitung',
      'Crowd-Kalender',
      'Besucherprognose',
      'Warteschlangen',
      'theme park wait times',
      'crowd calendar',
      'Disney Wartezeiten',
      'Europa-Park Wartezeiten',
      'Phantasialand Wartezeiten',
    ],
  };
}

// ─── Reusable layout helpers ──────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="border-border mb-6 border-b pb-3 text-3xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

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
}: {
  color: string;
  label: string;
  icon?: React.ElementType;
}) {
  return (
    <Badge className={cn('font-bold tracking-wide uppercase backdrop-blur-md text-white', color)}>
      {Icon && <Icon className="h-3 w-3 text-inherit" />}
      {label}
    </Badge>
  );
}

function InfoBox({ children, label = 'Hinweis' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="bg-primary/5 border-primary/20 rounded-lg border px-3 py-2.5 text-sm leading-relaxed !mt-6">
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-primary">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

function TipBox({ children, label = 'Tipp' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="border-yellow-500/20 bg-yellow-500/5 rounded-lg border px-3 py-2.5 text-sm leading-relaxed !mt-6">
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-yellow-600 dark:text-yellow-400">
        <Lightbulb className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      {children}
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
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
  try {
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const to = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const calendar = await getIntegratedCalendar(
      'europe',
      'germany',
      'bruehl',
      'phantasialand',
      { from, to, includeHourly: 'none' }
    );

    const days = calendar.days.slice(0, 7);
    if (days.length === 0) return <MockCalendar locale={locale} />;

    const dtFmt = new Intl.DateTimeFormat(locale === 'de' ? 'de' : 'en', {
      weekday: 'short',
    });
    const dateFmt = new Intl.DateTimeFormat(locale === 'de' ? 'de' : 'en', {
      day: 'numeric',
      month: 'short',
    });

    // Find the best day (lowest crowd, operating)
    const bestIdx = days.reduce((best, d, i) => {
      if (d.status === 'CLOSED') return best;
      const order = ['very_low', 'low', 'moderate', 'high', 'very_high', 'extreme', 'closed'];
      const cur = order.indexOf(d.crowdLevel);
      const bestCur = order.indexOf(days[best]?.crowdLevel ?? 'closed');
      return cur < bestCur ? i : best;
    }, -1);

    const bestLabel = locale === 'de' ? '✓ Bester Tag' : '✓ Best Day';
    const avgLabel = locale === 'de' ? 'Ø' : 'avg';

    return (
      <div className="not-prose space-y-2">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => {
            const d = new Date(day.date + 'T12:00:00');
            const wd = dtFmt.format(d);
            const dateStr = dateFmt.format(d);
            const isBest = i === bestIdx;
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
            const hoursStr =
              day.hours ? `${day.hours.openingTime}–${day.hours.closingTime}` : '—';
            const tempStr = day.weather ? `${Math.round(day.weather.tempMax)}°C` : '';
            const avgStr = day.avgWaitTime ? `${day.avgWaitTime} min` : '—';

            const scheduleIcon = (day.isSchoolVacation || day.isSchoolHoliday)
              ? <Backpack className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
              : (day.isHoliday || day.isPublicHoliday)
              ? <PartyPopper className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              : day.isBridgeDay
              ? <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              : null;

            return (
              <Card
                key={day.date}
                className={`relative flex h-full flex-col gap-1 p-2 border-2 ${border} ${day.status === 'CLOSED' ? 'bg-gray-100/50 dark:bg-gray-800/30' : ''}`}
              >
                {isBest && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white bg-crowd-low rounded px-1 py-0.5 z-10">
                    {bestLabel}
                  </div>
                )}
                {/* Header: weekday + date + schedule icon */}
                <div className="mb-1 flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs leading-tight font-medium">{wd}</span>
                    <span className="text-xs font-semibold mt-0.5 leading-tight">{dateStr}</span>
                  </div>
                  {scheduleIcon}
                </div>
                {/* Crowd badge */}
                <div
                  className={`text-[9px] font-bold tracking-wide uppercase text-white rounded w-full text-center px-0.5 py-0.5 leading-tight ${crowdColor}`}
                >
                  {crowdLabel}
                </div>
                {/* Hours */}
                {hoursStr !== '—' && (
                  <div className="text-muted-foreground flex items-center justify-center gap-1 text-[9px]">
                    <Clock className="h-2.5 w-2.5" />
                    <span className="font-medium hidden sm:inline">{hoursStr}</span>
                  </div>
                )}
                {/* Weather */}
                {tempStr && (
                  <div className="text-muted-foreground flex items-center justify-center gap-0.5 text-[9px]">
                    <Sun className="h-2.5 w-2.5" />
                    <span>{tempStr}</span>
                  </div>
                )}
                {/* Avg wait */}
                <div className="text-muted-foreground text-center text-[9px]">
                  {avgLabel} {avgStr}
                </div>
              </Card>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          Phantasialand · {locale === 'de' ? 'Live-Daten der nächsten 7 Tage' : 'Live data – next 7 days'}
        </p>
      </div>
    );
  } catch {
    return <MockCalendar locale={locale} />;
  }
}

// ─── Mock example components ──────────────────────────────────────────────────

type MockLocale = 'de' | 'en';

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

function MockSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 200;
  const H = 36;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-9" preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
        vsTypical: '15% Höher vs typisch',
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
        vsTypical: '15% Higher vs typical',
        minutes: 'Minutes',
        operating2: 'operating',
      };

  return (
    <div className="not-prose relative overflow-hidden rounded-xl">
      <BackgroundOverlay imageSrc="/images/parks/phantasialand/background.jpg" alt="Phantasialand" intensity="medium" />
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
          <Star className="h-6 w-6 text-muted-foreground shrink-0" />
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
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-muted rounded-full p-2">
                  <Sun className="h-8 w-8 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">23°</span>
                    <span className="text-muted-foreground text-sm">/ 16°</span>
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">{t.weatherDesc}</p>
                </div>
              </div>
              <div className="text-muted-foreground space-y-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span>☂</span><span>0mm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="h-3 w-3" /><span>12 km/h</span>
                </div>
              </div>
            </div>
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
              <span className="font-bold">78%</span>
            </div>
            <Progress value={78} className="h-1.5" />
            <p className="text-xs font-medium text-trend-up">{t.vsTypical}</p>
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
                45{' '}
                <span className="text-sm font-normal text-muted-foreground">{t.minutes}</span>
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

function MockAttractionCards({ locale }: { locale: MockLocale }) {
  const isDE = locale === 'de';
  const cards = [
    {
      name: 'Taron',
      wait: 55,
      trend: 'up' as const,
      crowd: 'high',
      favorited: true,
      spark: [15, 22, 28, 38, 47, 55],
      extra: 'Single Rider',
    },
    {
      name: 'Black Mamba',
      wait: 12,
      trend: 'down' as const,
      crowd: 'low',
      favorited: true,
      spark: [40, 33, 26, 20, 15, 12],
    },
    {
      name: 'Klugheim',
      wait: 30,
      trend: 'stable' as const,
      crowd: 'moderate',
      favorited: false,
      spark: [28, 32, 30, 33, 29, 30],
    },
  ];

  return (
    <div className="not-prose grid gap-3 sm:grid-cols-3">
      {cards.map(({ name, wait, trend, crowd, favorited, spark, extra }) => (
        <Card key={name} className="relative overflow-hidden">
          {/* Favorite star — top right, matching real attraction card */}
          <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
            <Star
              className={`h-4 w-4 ${favorited ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
            />
          </div>
          <CardContent className="relative z-10 flex h-full flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              {/* Left: name + wait time + queue type */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate leading-tight font-medium pr-6">{name}</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="flex items-center gap-1.5 text-lg font-bold">
                    <Clock className="h-4 w-4" />
                    {wait} min
                  </div>
                  <TrendIndicator trend={trend} />
                </div>
                {extra && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <DemoBadge
                      color="bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40"
                      label={extra}
                      icon={User}
                    />
                  </div>
                )}
              </div>
              {/* Right: status + crowd badges */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <DemoBadge
                  color="bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40"
                  label={isDE ? 'GEÖFFNET' : 'OPERATING'}
                  icon={Clock}
                />
                <CrowdBadge level={crowd} locale={locale} />
              </div>
            </div>
            {/* Sparkline — bottom, matching opacity-50 style */}
            <div className="mt-auto h-16 w-full overflow-hidden pt-4 opacity-50">
              <MockSparkline data={spark} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MockShowCards() {
  const shows = [
    { name: 'Mia and Me – Live', times: ['09:00', '11:00', '13:00', '15:00'], nextIdx: 1, pastIdx: [0] },
    { name: 'F.L.Y. Pre-Show', times: ['10:30', '12:30', '14:30', '16:30'], nextIdx: 2, pastIdx: [0, 1] },
    { name: 'Mystery Castle Show', times: ['18:00'], nextIdx: 0, pastIdx: [] },
  ];
  return (
    <div className="not-prose grid gap-3 sm:grid-cols-3">
      {shows.map(({ name, times, nextIdx, pastIdx }) => (
        <Card key={name} className="relative">
          <div className="absolute top-2 right-2 z-20">
            <Star className="h-4 w-4 text-muted-foreground" />
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

function MockNearbyCards({ locale }: { locale: MockLocale }) {
  const isDE = locale === 'de';
  return (
    <div className="not-prose grid gap-3 sm:grid-cols-2">
      {/* Card 1: favorited, nearest open — matches ParkCardNearby structure */}
      <article className="bg-card relative overflow-hidden rounded-xl border py-4 md:py-6">
        <BackgroundOverlay imageSrc="/images/parks/phantasialand/background.jpg" alt="Phantasialand" intensity="medium" hoverEffect />
        <div className="absolute top-2 right-2 z-20">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 drop-shadow" />
        </div>
        <div className="absolute top-2 left-2 z-20">
          <Badge className="border-0 bg-primary text-primary-foreground text-xs font-medium shadow-md">
            {isDE ? 'Nächster geöffneter Park' : 'Nearest Open Park'}
          </Badge>
        </div>
        <div className="relative z-10 flex h-full flex-col p-3 md:p-4">
          <div className="bg-background/20 mt-6 flex flex-1 flex-col justify-between rounded-xl p-3 shadow-sm backdrop-blur-md md:p-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-base font-semibold">Phantasialand</h3>
                <ChevronRight className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
              </div>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                Brühl, {isDE ? 'Deutschland' : 'Germany'}
              </p>
            </div>
            <div className="mt-3 flex flex-1 flex-col justify-end space-y-2 md:space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Navigation className="h-4 w-4" />
                  <span className="font-medium">8.4 km</span>
                </div>
                <DemoBadge
                  color="bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40"
                  label={isDE ? 'GEÖFFNET' : 'OPERATING'}
                  icon={Clock}
                />
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <span className="text-sm font-semibold">{isDE ? 'Ø 45 min' : 'avg 45 min'}</span>
                <CrowdBadge level="high" locale={locale} />
              </div>
              <div className="border-border/50 mt-2 flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{isDE ? 'Schließt heute um 22:00' : 'Closes today at 22:00'}</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Card 2: not favorited, offseason closed */}
      <article className="bg-card relative overflow-hidden rounded-xl border py-4 md:py-6">
        <BackgroundOverlay imageSrc="/images/parks/efteling/background.jpg" alt="Europa-Park" intensity="medium" />
        <div className="absolute top-2 right-2 z-20">
          <Star className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="relative z-10 flex h-full flex-col p-3 md:p-4">
          <div className="bg-background/20 flex flex-1 flex-col justify-between rounded-xl p-3 shadow-sm backdrop-blur-md md:p-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-base font-semibold">Europa-Park</h3>
                <ChevronRight className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
              </div>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                Rust, {isDE ? 'Deutschland' : 'Germany'}
              </p>
            </div>
            <div className="mt-3 flex flex-1 flex-col justify-end space-y-2 md:space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Navigation className="h-4 w-4" />
                  <span className="font-medium">124 km</span>
                </div>
                <DemoBadge
                  color="bg-status-closed/65 border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40"
                  label={isDE ? 'GESCHLOSSEN' : 'CLOSED'}
                  icon={XCircle}
                />
              </div>
              <div className="h-5" />
              <div className="border-border/50 mt-2 flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
                <Snowflake className="h-3.5 w-3.5" />
                <span>
                  {isDE
                    ? 'OffSeason (Öffnet am 28. März – in 3 Wochen)'
                    : 'OffSeason (Opens March 28 – in 3 weeks)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
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
  { wd: ['Sa', 'Sat'], date: '14. Jun', crowd: 'extreme', tag: 'school', border: 'border-yellow-500 dark:border-yellow-400', hours: '09:00–22:00', temp: '24°C', avg: 72 },
  { wd: ['So', 'Sun'], date: '15. Jun', crowd: 'very_high', tag: 'school', border: 'border-yellow-500 dark:border-yellow-400', hours: '09:00–21:00', temp: '21°C', avg: 60 },
  { wd: ['Mo', 'Mon'], date: '16. Jun', crowd: 'low', border: 'border-border', hours: '10:00–20:00', temp: '20°C', avg: 18 },
  { wd: ['Di', 'Tue'], date: '17. Jun', crowd: 'very_low', border: 'border-border', best: true, hours: '10:00–19:00', temp: '21°C', avg: 10 },
  { wd: ['Mi', 'Wed'], date: '18. Jun', crowd: 'low', border: 'border-border', hours: '10:00–20:00', temp: '22°C', avg: 15 },
  { wd: ['Do', 'Thu'], date: '19. Jun', crowd: 'moderate', border: 'border-border', hours: '09:00–20:00', temp: '24°C', avg: 30 },
  { wd: ['Fr', 'Fri'], date: '20. Jun', crowd: 'high', tag: 'holiday', border: 'border-orange-500 dark:border-orange-400', hours: '09:00–22:00', temp: '26°C', avg: 55 },
];

function MockCalendar({ locale }: { locale: MockLocale }) {
  const li = locale === 'de' ? 0 : 1;
  const bestLabel = locale === 'de' ? '✓ Bester Tag' : '✓ Best Day';
  const avgLabel = locale === 'de' ? 'Ø' : 'avg';

  return (
    <div className="not-prose space-y-2">
      <div className="grid grid-cols-7 gap-2">
        {CALENDAR_DAYS.map(({ wd, date, crowd, tag, border, best, hours, temp, avg }) => (
          <Card
            key={date}
            className={`relative flex h-full flex-col gap-1 p-2 border-2 ${border}`}
          >
            {best && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white bg-crowd-low rounded px-1 py-0.5 z-10">
                {bestLabel}
              </div>
            )}
            {/* Header: weekday + date + schedule icon */}
            <div className="mb-1 flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs leading-tight font-medium">{wd[li]}</span>
                <span className="text-xs font-semibold mt-0.5 leading-tight">{date}</span>
              </div>
              {tag === 'school' && <Backpack className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
              {tag === 'holiday' && <PartyPopper className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
            </div>
            {/* Crowd badge */}
            <div
              className={`text-[9px] font-bold tracking-wide uppercase text-white rounded w-full text-center px-0.5 py-0.5 leading-tight ${CROWD_COLORS[crowd]}`}
            >
              {CROWD_LABELS[locale][crowd]}
            </div>
            {/* Hours */}
            <div className="text-muted-foreground flex items-center justify-center gap-1 text-[9px]">
              <Clock className="h-2.5 w-2.5" />
              <span className="font-medium hidden sm:inline">{hours}</span>
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
      <p className="text-[11px] text-muted-foreground text-center">
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
      <p className="text-sm font-semibold mb-4">
        Taron ·{' '}
        {isDE ? 'Prognostizierter Wartezeit-Verlauf (Samstag)' : 'Predicted wait times (Saturday)'}
      </p>
      <div className="flex items-end gap-1 h-32">
        {HOURLY_WAITS.map((w, i) => (
          <div key={HOURLY_LABELS[i]} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-muted-foreground leading-none">{w}</span>
            <div
              className={`w-full rounded-t transition-all ${barColor(w)}`}
              style={{ height: `${(w / maxWait) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1.5">
        {HOURLY_LABELS.map((h) => (
          <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
            {h}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
        <TrendingDown className="h-3.5 w-3.5 text-trend-down shrink-0" />
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
            Das Ziel ist einfach: <strong>Nimm das Rätselraten aus deinem Freizeitpark-Besuch.</strong>{' '}
            Plane mit dem Crowd-Kalender den richtigen Tag, navigiere mit Live-Wartezeiten durch den
            Park und verlasse dich auf KI-Prognosen, die dir sagen, wann welche Attraktion am
            ruhigsten ist. Diese Seite erklärt alle Funktionen im Detail.
          </p>
        </div>
        {/* TOC */}
        <nav
          aria-label="Inhaltsverzeichnis"
          className="bg-muted/40 rounded-xl border p-5 not-prose"
        >
          <p className="mb-3 font-semibold">Inhaltsverzeichnis</p>
          <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
            {[
              ['#suche', '1. Suche'],
              ['#parkseite', '2. Die Park-Seite'],
              ['#badges', '3. Badges & Anzeigen'],
              ['#kalender', '4. Crowd-Kalender'],
              ['#prognosen', '5. KI-Prognosen'],
              ['#favoriten', '6. Favoriten'],
              ['#standort', '7. Standort & Nearby'],
              ['#personas', '8. Für wen?'],
              ['#faq', '9. FAQ'],
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
              <strong>Mobil & Desktop:</strong> Klicke auf das{' '}
              <Search className="inline h-4 w-4" />-Symbol in der Kopfzeile oder in das
              Suchfeld auf der Startseite.
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

      {/* ── 2. Park-Seite ───────────────────────────────────────────────────────── */}
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
            Alle Zeiten werden in der <strong>Zeitzone des Parks</strong> angezeigt – egal wo du dich
            gerade befindest. Ein Park in Florida zeigt z.&nbsp;B. Eastern Time, Europa-Park Mitteleuropäische Zeit.
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
      </Section>

      {/* ── 3. Badges ───────────────────────────────────────────────────────── */}
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
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Crowd Level */}
        <SubSection title="Auslastungsstufen (Crowd Level)">
          <p className="text-muted-foreground mb-3 text-sm">
            Das Crowd Level zeigt, wie voll ein Park oder wie stark eine Attraktion ausgelastet ist –
            im Verhältnis zum historischen Median (P50), also dem typischen Wert für diese
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
                <div className="flex min-w-[120px] flex-col gap-1">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{desc}</p>
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
                <span
                  className={`flex w-24 items-center gap-1 font-semibold text-sm ${color}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">{desc}</p>
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
                <p className="text-muted-foreground text-sm">{desc}</p>
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
                color:
                  'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Single Rider',
                desc: 'Einzelfahrer-Schlange. Oft deutlich kürzer als die reguläre Schlange, aber du kannst nicht mit Begleitern fahren.',
              },
              {
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                icon: Zap,
                label: 'Lightning Lane',
                desc: 'Kostenpflichtiger Express-Pass (z. B. bei Disney). Zeigt den aktuellen Preis und die Rückkehrzeit.',
              },
              {
                color:
                  'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Rückkehrzeit',
                desc: 'Kostenlose virtuelle Schlange – du holst dir einen Zeitslot und kehrst zur angezeigten Uhrzeit zurück.',
              },
              {
                color:
                  'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Boarding Group',
                desc: 'Virtuelle Warteschlange mit Gruppenummer. Beliebt bei sehr gefragten neuen Attraktionen.',
              },
            ].map(({ color, icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} />
                <p className="text-muted-foreground text-sm">{desc}</p>
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

      {/* ── 4. Kalender ─────────────────────────────────────────────────────── */}
      <Section id="kalender" title="Der Crowd-Kalender">
        <p className="text-muted-foreground mb-4">
          Der Kalender ist das mächtigste Werkzeug auf park.fan, wenn du deinen Besuch im Voraus
          planst. Er zeigt für jeden Tag der nächsten 30+ Tage eine KI-Prognose mit Crowd-Level,
          Öffnungszeiten, Wetter und besonderen Ereignissen – alles auf einen Blick.
        </p>

        <SubSection title="Was steht in jeder Kalender-Karte?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="font-semibold mb-2">Eine typische Kalender-Karte zeigt:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>📅 <strong>Datum und Wochentag</strong></li>
              <li>🎯 <strong>Crowd-Level-Badge</strong> (z. B. „Sehr Hoch") – die KI-Prognose für den Gesamtandrang</li>
              <li>🕐 <strong>Öffnungszeiten</strong> – oder „Est." wenn noch nicht offiziell bestätigt (s. u.)</li>
              <li>🌤️ <strong>Wettervorhersage</strong> mit Min-/Max-Temperatur</li>
              <li>⌚ <strong>Ø Wartezeit</strong> – prognostizierte durchschnittliche Wartezeit aller Attraktionen</li>
              <li>🎟️ <strong>Ticketpreis</strong>, wenn vom Park veröffentlicht</li>
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
                Suche dir einen Dienstag oder Mittwoch <em>ohne</em> Ferienicon – diese zeigen
                oft <strong>„Niedrig"</strong> oder <strong>„Normal"</strong>. Öffnungszeiten und
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
          <LiveCalendarExample locale="de" />
        </SubSection>

        <SubSection title="Attraktion-Kalender">
          <p className="text-muted-foreground text-sm">
            Auf der Detailseite einer Attraktion gibt es ebenfalls einen Verlaufs-Kalender. Er zeigt
            für jeden vergangenen Tag, wie stark die Attraktion ausgelastet war – und ob sie in
            Betrieb war oder nicht. Das ist ideal, um wiederkehrende Muster zu erkennen: Hatte
            Taron in den letzten vier Wochen immer donnerstags kurze Wartezeiten? Dann könnte das
            auch nächste Woche so sein.
          </p>
        </SubSection>

        <TipBox>
          Die besten Besuchstage sind frühe Wochentage außerhalb der Schulferien –
          Dienstag bis Donnerstag zeigen oft die niedrigsten Crowd-Level. Vermeide insbesondere
          Schulferienwochen der bevölkerungsreichen Bundesländer NRW, Bayern und Baden-Württemberg.
        </TipBox>
      </Section>

      {/* ── 5. KI-Prognosen ─────────────────────────────────────────────────────── */}
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
                <p className="text-muted-foreground text-sm">{desc}</p>
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
            Du bist an einem Samstag in den Herbstferien in Phantasialand. Der Kalender zeigt
            „Sehr Hoch" für den Tag. So nutzt du die Prognosen:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>Morgens beim Betreten:</strong> Der Stoßzeit-Badge zeigt „Stoßzeit in ca.
                2 Std." – du hast also bis ca. 11:30 Uhr Zeit für die ersten Highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Taron-Seite aufrufen:</strong> Die Prognosekurve zeigt heute 9:30 Uhr ≈ 15
                Min., 12:00 Uhr ≈ 65 Min., 15:00 Uhr ≈ 40 Min. → Du weißt: direkt nach Öffnung
                oder Mitte des Nachmittags sind die besten Slots.
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
            Attraktionsdetailseite wird die Prognose-Genauigkeit für jede Attraktion angezeigt –
            von <strong>Schlecht</strong> bis <strong>Exzellent</strong>. Je mehr historische Daten
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

      {/* ── 6. Favoriten ────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favoriten">
        <p className="text-muted-foreground mb-4">
          Markiere Parks, Attraktionen, Shows und Restaurants als Favoriten, um sie jederzeit
          schnell zur Hand zu haben – direkt auf der Startseite.
        </p>

        <SubSection title="Favorit hinzufügen">
          <div className="space-y-2 text-sm">
            <p>
              Klicke auf den <Star className="inline h-4 w-4 text-yellow-500" />-Stern auf jeder
              Park- oder Attraktionskarte. Der Stern leuchtet auf – der Favorit ist gespeichert.
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
              { icon: '🌴', label: 'Parks', desc: 'Status, Öffnungszeiten, Auslastung auf einen Blick' },
              { icon: '🎢', label: 'Attraktionen', desc: 'Live-Wartezeit und Trend direkt in der Übersicht' },
              { icon: '🎭', label: 'Shows', desc: 'Nächste Showtime immer im Blick' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Küche und aktueller Status' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
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

      {/* ── 7. Standort ─────────────────────────────────────────────────────── */}
      <Section id="standort" title="Standort & Nearby-Parks">
        <p className="text-muted-foreground mb-4">
          Mit deinem Standort wird park.fan noch smarter: Du siehst Parks und Attraktionen in deiner
          Nähe – sortiert nach Entfernung.
        </p>

        <SubSection title="Standort aktivieren">
          <p className="text-muted-foreground text-sm">
            Beim ersten Besuch erscheint ein Banner, das dich um Standortzugriff bittet. Die
            Zustimmung ist vollständig freiwillig. park.fan speichert deinen Standort nicht –
            er wird ausschließlich für die Nearby-Funktion genutzt und nicht an Dritte weitergegeben.
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

        <NearbyParksCard />
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
              Crowd-Kalender: Welcher Tag hat die kürzesten Warteschlangen? Perfekt um den Urlaub
              zu planen.
            </Li>
            <Li>
              Wetter im Kalender: Plant ihr für einen Regentag? Indoor-Attraktionen prüfen!
            </Li>
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
              Crowd Level (P50-Basis): Verstehe, ob eine Attraktion gerade wirklich überdurchschnittlich
              voll ist – oder nur "normal".
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
            <Li>
              Suche: Finde deinen Park schnell – auch wenn du den genauen Namen nicht weißt.
            </Li>
            <Li>
              Park-Karte: Orientiere dich mit der interaktiven Karte, bevor und während du im Park
              bist.
            </Li>
            <Li>
              Status-Badges: Grün = läuft, Orange = kurze Störung, Grau = heute nicht, Lila =
              längere Wartung. Einfach und klar.
            </Li>
            <Li>
              Crowd-Kalender: Welcher Tag ist der beste? Die Farben sagen alles – Grün ist gut,
              Rot ist stressig.
            </Li>
            <Li>
              Öffnungszeiten: Immer aktuell – inklusive Sonderöffnungszeiten an Feiertagen.
            </Li>
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
            <Li>
              Trend-Indikatoren: Warteschlange fällt gerade? Perfekter Moment zum Anstellen.
            </Li>
            <Li>
              Favoriten: Wenn du den Park schon kennst, hast du deine Top-Attraktionen schon
              gespeichert.
            </Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. FAQ ──────────────────────────────────────────────────────────── */}
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
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-90" />
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
          Sound familiar? You're standing in an 80-minute queue for Taron – and just ten metres
          away another ride has no wait at all. Or: you book your holiday and discover that every
          school in the country is on break that exact week.
        </p>
        <p className="text-muted-foreground">
          park.fan was built out of exactly that frustration. What started as a small side
          project – "let me just track some wait times" – has grown into a platform with live
          data from 150+ parks, over 5,000 attractions and millions of queue data points
          processed every day.
        </p>
        <p className="text-muted-foreground">
          The goal is simple:{' '}
          <strong>take the guesswork out of your theme park visit.</strong> Use the crowd calendar
          to pick the right day, navigate with live wait times, and rely on AI predictions to know
          when each ride will be at its quietest. This page explains every feature in detail.
        </p>
      </div>
      <nav aria-label="Table of Contents" className="bg-muted/40 rounded-xl border p-5 not-prose">
        <p className="mb-3 font-semibold">Table of Contents</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Search'],
            ['#parkseite', '2. The Park Page'],
            ['#badges', '3. Badges & Indicators'],
            ['#kalender', '4. Crowd Calendar'],
            ['#prognosen', '5. AI Predictions'],
            ['#favoriten', '6. Favorites'],
            ['#standort', '7. Location & Nearby'],
            ['#personas', '8. Who is it for?'],
            ['#faq', '9. FAQ'],
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
          plataforma con datos en directo de más de 150 parques, más de 5.000 atracciones y
          millones de registros de colas procesados cada día.
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
        className="bg-muted/40 rounded-xl border p-5 not-prose"
      >
        <p className="mb-3 font-semibold">Índice de contenidos</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Búsqueda'],
            ['#parkseite', '2. La página del parque'],
            ['#badges', '3. Insignias y estados'],
            ['#kalender', '4. Calendario de afluencia'],
            ['#prognosen', '5. Predicciones IA'],
            ['#favoriten', '6. Favoritos'],
            ['#standort', '7. Ubicación'],
            ['#personas', '8. ¿Para quién?'],
            ['#faq', '9. Preguntas frecuentes'],
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
          Ça te parle ? 80 minutes de queue pour Taron — et à dix mètres de là, une autre
          attraction sans attente. Ou encore : tu réserves tes vacances et tu découvres que c&apos;est
          exactement la semaine des congés scolaires dans toute la région.
        </p>
        <p className="text-muted-foreground">
          park.fan est né de cette frustration. Ce qui a commencé comme un petit projet personnel –
          &quot;je vais juste suivre quelques temps d&apos;attente&quot; – est devenu une plateforme
          avec des données en direct de plus de 150 parcs, plus de 5 000 attractions et des
          millions de points de données traités chaque jour.
        </p>
        <p className="text-muted-foreground">
          L&apos;objectif est simple :{' '}
          <strong>éliminer les approximations lors de ta visite en parc d&apos;attractions.</strong>{' '}
          Utilise le calendrier d&apos;affluence pour choisir le bon jour, navigue avec des temps
          d&apos;attente en direct et compte sur les prédictions IA pour savoir quand chaque
          attraction sera la moins fréquentée. Cette page explique chaque fonctionnalité en détail.
        </p>
      </div>
      <nav
        aria-label="Table des matières"
        className="bg-muted/40 rounded-xl border p-5 not-prose"
      >
        <p className="mb-3 font-semibold">Table des matières</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Recherche'],
            ['#parkseite', '2. La page du parc'],
            ['#badges', '3. Badges et statuts'],
            ['#kalender', "4. Calendrier d'affluence"],
            ['#prognosen', '5. Prédictions IA'],
            ['#favoriten', '6. Favoris'],
            ['#standort', '7. Localisation'],
            ['#personas', '8. Pour qui ?'],
            ['#faq', '9. FAQ'],
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
      <nav aria-label="Indice" className="bg-muted/40 rounded-xl border p-5 not-prose">
        <p className="mb-3 font-semibold">Indice</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Ricerca'],
            ['#parkseite', '2. La pagina del parco'],
            ['#badges', '3. Badge e stati'],
            ['#kalender', '4. Calendario affluenza'],
            ['#prognosen', '5. Previsioni IA'],
            ['#favoriten', '6. Preferiti'],
            ['#standort', '7. Posizione'],
            ['#personas', '8. Per chi?'],
            ['#faq', '9. FAQ'],
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
          Het doel is eenvoudig:{' '}
          <strong>neem het giswerk weg uit je pretparkbezoek.</strong> Gebruik de drukte-kalender
          om de juiste dag te kiezen, navigeer met live wachttijden en vertrouw op
          AI-voorspellingen om te weten wanneer elke attractie het rustigst is. Deze pagina legt
          elke functie in detail uit.
        </p>
      </div>
      <nav aria-label="Inhoudsopgave" className="bg-muted/40 rounded-xl border p-5 not-prose">
        <p className="mb-3 font-semibold">Inhoudsopgave</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Zoeken'],
            ['#parkseite', '2. De parkpagina'],
            ['#badges', '3. Badges & statussen'],
            ['#kalender', '4. Drukte-kalender'],
            ['#prognosen', '5. AI-voorspellingen'],
            ['#favoriten', '6. Favorieten'],
            ['#standort', '7. Locatie'],
            ['#personas', '8. Voor wie?'],
            ['#faq', '9. FAQ'],
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
              or{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
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
          The search uses smart full-text search that works even with typos. Search for &quot;fantasia&quot; and
          you&apos;ll find &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>

      {/* ── 2. Park Page ────────────────────────────────────────────────────── */}
      <Section id="parkseite" title="The Park Page">
        <p className="text-muted-foreground mb-4">
          Every park has its own page with live data, opening hours, an interactive calendar and a
          map.
        </p>
        <InfoBox label="Note">
          All times are displayed in the <strong>park&apos;s local timezone</strong> — regardless of
          where you are. A park in Florida shows Eastern Time, Europa-Park shows Central European Time.
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
      </Section>

      {/* ── 3. Badges ───────────────────────────────────────────────────────── */}
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
                <p className="text-muted-foreground text-sm">{desc}</p>
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
                <div className="flex min-w-[120px] flex-col gap-1">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{desc}</p>
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
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Queue Types">
          <div className="space-y-3">
            {[
              {
                color:
                  'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Single Rider',
                desc: "Often much shorter than regular queue – but you can't ride with your group.",
              },
              {
                color:
                  'bg-status-down/65 border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
                icon: Zap,
                label: 'Lightning Lane',
                desc: 'Paid express pass (e.g. at Disney). Shows current price and return time.',
              },
              {
                color:
                  'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Return Time',
                desc: 'Free virtual queue – reserve a time slot and return later.',
              },
              {
                color:
                  'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Boarding Group',
                desc: 'Virtual queue with group number – popular for highly demanded new rides.',
              },
            ].map(({ color, icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} />
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 4. Calendar ─────────────────────────────────────────────────────── */}
      <Section id="kalender" title="The Crowd Calendar">
        <p className="text-muted-foreground mb-4">
          The calendar is the most powerful planning tool on park.fan. It shows an AI-powered
          forecast for each of the next 30+ days – crowd level, opening hours, weather and special
          events, all at a glance.
        </p>

        <SubSection title="What's on each calendar card?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="font-semibold mb-2">A typical calendar card shows:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>📅 <strong>Date and weekday</strong></li>
              <li>🎯 <strong>Crowd Level badge</strong> (e.g. "Very High") – the AI forecast for overall busyness</li>
              <li>🕐 <strong>Opening hours</strong> – or "Est." if not yet officially confirmed (see below)</li>
              <li>🌤️ <strong>Weather forecast</strong> with min/max temperature</li>
              <li>⌚ <strong>Avg. wait time</strong> – predicted average wait across all attractions</li>
              <li>🎟️ <strong>Ticket price</strong>, when published by the park</li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>What does "Est." mean?</strong> Opening hours marked "Est." (Estimated) have
            not yet been officially confirmed by the park. park.fan derives them from historical
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
              <span>Open the park page and switch to the <strong>Calendar</strong> tab.</span>
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
                Look for a Tuesday or Wednesday <em>without</em> a holiday icon – these often
                show <strong>"Low"</strong> or <strong>"Moderate"</strong>. Opening hours and the
                weather forecast help you make the final call.
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
          <LiveCalendarExample locale="en" />
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

      {/* ── 5. AI Predictions ───────────────────────────────────────────────────── */}
      <Section id="prognosen" title="AI-Powered Predictions">
        <p className="text-muted-foreground mb-4">
          park.fan uses machine learning to predict crowd levels and wait times days in advance.
          The model is continuously trained on new data and considers four key factors:
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
                <p className="text-muted-foreground text-sm">{desc}</p>
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
                <strong>Lunch during peak:</strong> Instead of queuing at noon, you grab lunch.
                Live trends confirm: by 15:00 the wait is dropping – perfect moment to ride.
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
            last few hours. You can instantly see whether queues are building up, holding steady
            or shrinking.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Tip">
          Combine calendar and predictions: pick a green day from the calendar, then check the
          hourly forecast on the attraction page to find the quietest slot. You&apos;ll always arrive
          at the shortest queue.
        </TipBox>
      </Section>

      {/* ── 6. Favorites ────────────────────────────────────────────────────── */}
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
              { icon: '🌴', label: 'Parks', desc: 'Status, opening hours and crowd level at a glance' },
              { icon: '🎢', label: 'Attractions', desc: 'Live wait time and trend directly in the overview' },
              { icon: '🎭', label: 'Shows', desc: 'Next showtime always visible' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Kitchen status and location' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox label="Tip">
          Save your 5–10 favorite attractions at your target park. On the day of your visit,
          you&apos;ll instantly see which ones have short wait times – great for on-the-fly decisions.
        </TipBox>
      </Section>

      {/* ── 7. Location ─────────────────────────────────────────────────────── */}
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

      {/* ── 8. Personas ─────────────────────────────────────────────────────── */}
      <Section id="personas" title="Who is park.fan for?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard emoji="👨‍👩‍👧‍👦" title="Families" subtitle="Planning a perfect day out for everyone">
            <Li>Crowd calendar: which day has the shortest queues?</Li>
            <Li>Weather in the calendar: planning for a rainy day? Check indoor rides!</Li>
            <Li>Favorites: save the 10 must-do rides for kids.</Li>
            <Li>Live wait times: decide on the fly which ride to do next.</Li>
          </PersonaCard>

          <PersonaCard emoji="🎢" title="Theme Park Enthusiasts" subtitle="Every minute must be optimised">
            <Li>Crowd level (P50 baseline): understand if a ride is genuinely above average – or just "normal".</Li>
            <Li>Historical trends: when does Taron typically have short waits?</Li>
            <Li>Trend indicators: queue rising? Wait 20 minutes and it might be shorter.</Li>
            <Li>Single Rider / Lightning Lane: all queue types shown with times and prices.</Li>
          </PersonaCard>

          <PersonaCard emoji="🌟" title="First-Time Visitors" subtitle="First time at a major theme park">
            <Li>Search: find your park quickly, even if you don't know the exact name.</Li>
            <Li>Park map: get oriented before and during your visit.</Li>
            <Li>Status badges: green = running, orange = brief issue, grey = closed today.</Li>
            <Li>Crowd calendar: colours tell everything – green is good, red is stressful.</Li>
          </PersonaCard>

          <PersonaCard emoji="⚡" title="Spontaneous Visitors" subtitle="Last-minute decision, maximum efficiency">
            <Li>Location: park.fan automatically finds your nearest park.</Li>
            <Li>Live wait times: instantly see what's open and how long the wait is.</Li>
            <Li>Trend indicators: queue falling? Perfect moment to join.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. FAQ ──────────────────────────────────────────────────────────── */}
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
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-90" />
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
      <ContentENSections />
    </div>
  );
}

function ContentFR() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroFR />
      <ContentENSections />
    </div>
  );
}

function ContentIT() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroIT />
      <ContentENSections />
    </div>
  );
}

function ContentNL() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroNL />
      <ContentENSections />
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
      <div className="mx-auto max-w-4xl">
        <LocaleContent
          locale={locale as Locale}
          de={
            <>
              <h1 className="mb-2 text-4xl font-bold">Wie funktioniert park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                Die vollständige Anleitung für Freizeitpark-Besucher – von der Suche über den
                Crowd-Kalender bis zu allen Badges und KI-Prognosen.
              </p>
              <ContentDE />
            </>
          }
          en={
            <>
              <h1 className="mb-2 text-4xl font-bold">How does park.fan work?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                The complete guide for theme park visitors – from search and favorites to the crowd
                calendar, AI predictions and all badges explained.
              </p>
              <ContentEN />
            </>
          }
          es={
            <>
              <h1 className="mb-2 text-4xl font-bold">¿Cómo funciona park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                La guía completa para visitar parques temáticos – desde la búsqueda y los
                favoritos hasta el calendario de afluencia, las predicciones IA y todos los
                indicadores explicados.
              </p>
              <ContentES />
            </>
          }
          fr={
            <>
              <h1 className="mb-2 text-4xl font-bold">Comment fonctionne park.fan ?</h1>
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
              <h1 className="mb-2 text-4xl font-bold">Come funziona park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                La guida completa per i visitatori dei parchi divertimento – dalla ricerca ai
                preferiti, passando per il calendario dell&apos;affluenza, le previsioni IA e
                tutti gli indicatori spiegati.
              </p>
              <ContentIT />
            </>
          }
          nl={
            <>
              <h1 className="mb-2 text-4xl font-bold">Hoe werkt park.fan?</h1>
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
