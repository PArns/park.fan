/* eslint-disable react/no-unescaped-entities */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, generateAlternateLanguages, localeToOpenGraphLocale } from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { LocaleContent } from '@/components/common/locale-content';
import { getIntegratedCalendar } from '@/lib/api/integrated-calendar';
import type { CalendarDay } from '@/lib/api/types';
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
  Sun,
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
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide text-white uppercase ${color}`}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {label}
    </span>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/5 border-primary/20 rounded-xl border p-4 text-sm leading-relaxed">
      {children}
    </div>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm leading-relaxed">
      <span className="mb-1 block font-bold text-yellow-600 dark:text-yellow-400">Tipp</span>
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
    <div className="bg-card rounded-xl border p-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      </div>
      <ul className="text-muted-foreground space-y-2 text-sm">{children}</ul>
    </div>
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
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
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
            const avgStr = day.avgWaitTime ? `${day.avgWaitTime}m` : '—';

            return (
              <div
                key={day.date}
                className={`relative rounded-lg border-2 ${border} bg-card p-1 sm:p-1.5 flex flex-col gap-0.5 text-center`}
              >
                {isBest && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white bg-crowd-low rounded px-1 py-0.5">
                    {bestLabel}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-muted-foreground">{wd}</span>
                  {(day.isSchoolVacation || day.isSchoolHoliday) && (
                    <Backpack className="h-2.5 w-2.5 text-yellow-500 shrink-0" />
                  )}
                  {(day.isHoliday || day.isPublicHoliday) &&
                    !day.isSchoolVacation &&
                    !day.isSchoolHoliday && (
                      <PartyPopper className="h-2.5 w-2.5 text-orange-500 shrink-0" />
                    )}
                  {day.isBridgeDay &&
                    !day.isHoliday &&
                    !day.isPublicHoliday &&
                    !day.isSchoolVacation &&
                    !day.isSchoolHoliday && (
                      <Calendar className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                    )}
                  {!day.isSchoolVacation &&
                    !day.isSchoolHoliday &&
                    !day.isHoliday &&
                    !day.isPublicHoliday &&
                    !day.isBridgeDay && <span className="h-2.5 w-2.5" />}
                </div>
                <p className="text-[9px] font-bold leading-tight">{dateStr}</p>
                <div
                  className={`text-[8px] font-bold tracking-wide uppercase text-white rounded px-0.5 py-0.5 leading-tight ${crowdColor}`}
                >
                  {crowdLabel}
                </div>
                <div className="text-[8px] text-muted-foreground leading-tight hidden sm:block">
                  {hoursStr}
                </div>
                {tempStr && <div className="text-[8px] text-muted-foreground">☀️ {tempStr}</div>}
                <div className="text-[8px] text-muted-foreground">
                  {avgLabel} {avgStr}
                </div>
              </div>
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
  const t =
    locale === 'de'
      ? {
          operating: 'Geöffnet',
          peakTime: 'Stoßzeit in 1 Std. 45 Min.',
          hours: '09:00 – 22:00',
          weather: '23°C, sonnig',
          remaining: 'Noch 6h 20m geöffnet',
          progress: '58 % des heutigen Öffnungstags vergangen',
          favLabel: 'Favorit',
          city: 'Brühl, NRW',
        }
      : {
          operating: 'Operating',
          peakTime: 'Peak in 1h 45m',
          hours: '09:00 – 22:00',
          weather: '23°C, sunny',
          remaining: '6h 20m remaining today',
          progress: '58% of today\'s opening hours elapsed',
          favLabel: 'Favorite',
          city: 'Brühl, NRW',
        };

  return (
    <div className="not-prose rounded-2xl border overflow-hidden shadow-sm">
      {/* Hero image area */}
      <div className="relative h-36 sm:h-44 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-end px-4 pb-4">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {/* Annotated favourite star */}
        <div className="absolute top-3 right-3 flex flex-col items-center gap-1 z-10">
          <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 drop-shadow" />
          <span className="text-[10px] font-bold text-yellow-300 bg-black/50 rounded px-1.5 py-0.5 whitespace-nowrap">
            {t.favLabel}
          </span>
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <DemoBadge
              color="bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40"
              label={t.operating}
              icon={Clock}
            />
            <CrowdBadge level="high" locale={locale} />
            <DemoBadge
              color="bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40"
              label={t.peakTime}
              icon={Clock}
            />
          </div>
          <div>
            <h3 className="text-white text-xl font-bold">Phantasialand</h3>
            <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {t.city}
            </p>
          </div>
        </div>
      </div>
      {/* Info row */}
      <div className="bg-muted/30 px-4 py-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm border-b">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {t.hours}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Sun className="h-3.5 w-3.5" />
          {t.weather}
        </span>
        <span className="text-muted-foreground">{t.remaining}</span>
      </div>
      {/* Progress bar */}
      <div className="px-4 py-2.5">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full w-[58%]" />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">{t.progress}</p>
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
        <div key={name} className="bg-card rounded-xl border p-4 relative flex flex-col gap-2.5">
          <div className="absolute top-3 right-3 flex flex-col items-center gap-0.5">
            <Star
              className={`h-4 w-4 ${favorited ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
            />
            {favorited && (
              <span className="text-[9px] text-yellow-500 font-medium">
                {isDE ? 'Favorit' : 'Fav'}
              </span>
            )}
          </div>
          <p className="font-semibold pr-8 text-sm">{name}</p>
          <div className="flex flex-wrap gap-1">
            <DemoBadge
              color="bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40"
              label={isDE ? 'Geöffnet' : 'Operating'}
              icon={Clock}
            />
            <CrowdBadge level={crowd} locale={locale} />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-2xl font-bold">{wait}</span>
            <span className="text-muted-foreground text-sm">min</span>
            {trend === 'up' && <TrendingUp className="ml-auto h-5 w-5 text-trend-up" />}
            {trend === 'down' && <TrendingDown className="ml-auto h-5 w-5 text-trend-down" />}
            {trend === 'stable' && <Minus className="ml-auto h-5 w-5 text-trend-stable" />}
          </div>
          {extra && (
            <DemoBadge
              color="bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40"
              label={extra}
              icon={User}
            />
          )}
          <div className="text-muted-foreground/50 mt-auto pt-1">
            <MockSparkline data={spark} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MockNearbyCards({ locale }: { locale: MockLocale }) {
  const isDE = locale === 'de';
  return (
    <div className="not-prose grid gap-3 sm:grid-cols-2">
      {/* Card 1: favorited, nearest open */}
      <div className="bg-card rounded-xl border overflow-hidden relative">
        <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
          {isDE ? 'Nächster geöffneter Park' : 'Nearest Open Park'}
        </div>
        <div className="p-4 pt-10">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold leading-tight">Phantasialand</h3>
              <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Brühl, NRW
              </p>
            </div>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-semibold text-yellow-500">
                {isDE ? 'Favorit' : 'Favorite'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
              <MapPin className="h-3 w-3" /> 8.4 km
            </span>
            <DemoBadge
              color="bg-status-operating/65 border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40"
              label={isDE ? 'Geöffnet' : 'Operating'}
              icon={Clock}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-semibold">{isDE ? 'Ø 45 min' : 'avg 45 min'}</span>
            <CrowdBadge level="high" locale={locale} />
          </div>
        </div>
      </div>

      {/* Card 2: not favorited, closed */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold leading-tight">Europa-Park</h3>
              <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Rust, Baden-Württemberg
              </p>
            </div>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <Star className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {isDE ? 'Hinzufügen' : 'Add fav'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
              <MapPin className="h-3 w-3" /> 124 km
            </span>
            <DemoBadge
              color="bg-status-closed/65 border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40"
              label={isDE ? 'Geschlossen' : 'Closed'}
              icon={XCircle}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {isDE ? 'Öffnet morgen um 10:00' : 'Opens tomorrow at 10:00'}
          </p>
        </div>
      </div>
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

  return (
    <div className="not-prose space-y-2">
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {CALENDAR_DAYS.map(({ wd, date, crowd, tag, border, best, hours, temp, avg }) => (
          <div
            key={date}
            className={`relative rounded-lg border-2 ${border} bg-card p-1 sm:p-1.5 flex flex-col gap-0.5 text-center`}
          >
            {best && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white bg-crowd-low rounded px-1 py-0.5">
                {bestLabel}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-muted-foreground">{wd[li]}</span>
              {tag === 'school' && <Backpack className="h-2.5 w-2.5 text-yellow-500 shrink-0" />}
              {tag === 'holiday' && <PartyPopper className="h-2.5 w-2.5 text-orange-500 shrink-0" />}
              {!tag && <span className="h-2.5 w-2.5" />}
            </div>
            <p className="text-[9px] font-bold leading-tight">{date}</p>
            <div
              className={`text-[8px] font-bold tracking-wide uppercase text-white rounded px-0.5 py-0.5 leading-tight ${CROWD_COLORS[crowd]}`}
            >
              {CROWD_LABELS[locale][crowd]}
            </div>
            <div className="text-[8px] text-muted-foreground leading-tight hidden sm:block">
              {hours}
            </div>
            <div className="text-[8px] text-muted-foreground">☀️ {temp}</div>
            <div className="text-[8px] text-muted-foreground">
              {locale === 'de' ? 'Ø' : 'avg'} {avg}m
            </div>
          </div>
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
          <ol className="text-muted-foreground grid gap-1.5 text-sm sm:grid-cols-2">
            {[
              ['#suche', '1. Suche'],
              ['#favoriten', '2. Favoriten'],
              ['#parkseite', '3. Die Park-Seite'],
              ['#badges', '4. Badges & Anzeigen'],
              ['#kalender', '5. Crowd-Kalender'],
              ['#prognosen', '6. KI-Prognosen'],
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
        </SubSection>

        <SubSection title="Was du suchen kannst">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parks', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attraktionen', desc: 'Taron, Silver Star, Space Mountain...' },
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
            Suche nach "Phantasia" und du findest "Phantasialand".
          </InfoBox>
        </SubSection>

        <SubSection title="Vollständige Suchergebnisse">
          <p className="text-muted-foreground text-sm">
            Klicke auf "Alle Ergebnisse anzeigen", um zur dedizierten Suchseite zu gelangen. Dort
            findest du alle Treffer nach Kategorie sortiert.
          </p>
        </SubSection>
      </Section>

      {/* ── 2. Favoriten ────────────────────────────────────────────────────── */}
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
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Parks', desc: 'Status, Öffnungszeiten, Auslastung auf einen Blick' },
              { label: 'Attraktionen', desc: 'Live-Wartezeit und Trend direkt in der Übersicht' },
              { label: 'Shows', desc: 'Nächste Showtime immer im Blick' },
              { label: 'Restaurants', desc: 'Küche und aktueller Status' },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold">{label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
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

      {/* ── 3. Park-Seite ───────────────────────────────────────────────────── */}
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
      </Section>

      {/* ── 4. Badges ───────────────────────────────────────────────────────── */}
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
            Das Crowd Level zeigt, wie voll ein Park oder wie lange die Warteschlange an einer
            Attraktion ist – im Verhältnis zum historischen 90. Perzentil (P90). Das bedeutet: Ein
            Wert von "Hoch" heißt, dass der Park heute voller ist als an 90 % der bisherigen
            Betriebstage.
          </p>
          <div className="space-y-3">
            {[
              {
                color:
                  'bg-crowd-very-low/65 border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
                label: 'Sehr Niedrig',
                icon: User,
                threshold: '< 20 % des P90',
                desc: 'Kaum Betrieb – kurze bis keine Warteschlangen. Idealer Besuchstag.',
              },
              {
                color:
                  'bg-crowd-low/65 border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
                label: 'Niedrig',
                icon: User,
                threshold: '20–40 % des P90',
                desc: 'Wenig los – die meisten Attraktionen laufen mit kurzen Wartezeiten.',
              },
              {
                color:
                  'bg-crowd-moderate/65 border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
                label: 'Normal',
                icon: Users,
                threshold: '40–60 % des P90',
                desc: 'Typischer Tag – angemessene Wartezeiten, nichts Ungewöhnliches.',
              },
              {
                color:
                  'bg-crowd-high/65 border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
                label: 'Hoch',
                icon: Users,
                threshold: '60–80 % des P90',
                desc: 'Viel los – beliebte Attraktionen haben 30–60 Minuten Wartezeit.',
              },
              {
                color:
                  'bg-crowd-very-high/65 border-crowd-very-high/80 dark:bg-crowd-very-high/25 dark:border-crowd-very-high/40',
                label: 'Sehr Hoch',
                icon: Users,
                threshold: '80–100 % des P90',
                desc: 'Sehr voll – Wartezeiten über 60 Minuten, früh anreisen lohnt sich.',
              },
              {
                color:
                  'bg-crowd-extreme/65 border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
                label: 'Extrem',
                icon: AlertTriangle,
                threshold: '> 100 % des P90',
                desc: 'Rekordbetrieb – Wartezeiten über 90 Minuten möglich. Schulferien-Wochenenden, Sondertage.',
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
            <strong>Was ist das 90. Perzentil (P90)?</strong> park.fan vergleicht die aktuelle
            Auslastung mit historischen Daten. Das P90 ist der Wert, den nur 10 % aller Tage
            überschreiten – quasi der "sehr volle Tag"-Wert. Liegt die Auslastung heute bei 50 % des
            P90, ist es nur halb so voll wie an den vollsten Tagen.
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

      {/* ── 5. Kalender ─────────────────────────────────────────────────────── */}
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

      {/* ── 6. KI-Prognosen ─────────────────────────────────────────────────── */}
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
              P90-Schwellwerte: Verstehe, ob eine Attraktion gerade wirklich voll ist – oder nur
              "normal".
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
        <ol className="text-muted-foreground grid gap-1.5 text-sm sm:grid-cols-2">
          {[
            ['#suche', '1. Search'],
            ['#favoriten', '2. Favorites'],
            ['#parkseite', '3. The Park Page'],
            ['#badges', '4. Badges & Indicators'],
            ['#kalender', '5. Crowd Calendar'],
            ['#prognosen', '6. AI Predictions'],
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
        <ol className="text-muted-foreground grid gap-1.5 text-sm sm:grid-cols-2">
          {[
            ['#suche', '1. Búsqueda'],
            ['#favoriten', '2. Favoritos'],
            ['#parkseite', '3. La página del parque'],
            ['#badges', '4. Insignias y estados'],
            ['#kalender', '5. Calendario de afluencia'],
            ['#prognosen', '6. Predicciones IA'],
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
        <ol className="text-muted-foreground grid gap-1.5 text-sm sm:grid-cols-2">
          {[
            ['#suche', '1. Recherche'],
            ['#favoriten', '2. Favoris'],
            ['#parkseite', '3. La page du parc'],
            ['#badges', '4. Badges et statuts'],
            ['#kalender', "5. Calendrier d'affluence"],
            ['#prognosen', '6. Prédictions IA'],
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
        <ol className="text-muted-foreground grid gap-1.5 text-sm sm:grid-cols-2">
          {[
            ['#suche', '1. Ricerca'],
            ['#favoriten', '2. Preferiti'],
            ['#parkseite', '3. La pagina del parco'],
            ['#badges', '4. Badge e stati'],
            ["#kalender", "5. Calendario affluenza"],
            ['#prognosen', '6. Previsioni IA'],
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
        <ol className="text-muted-foreground grid gap-1.5 text-sm sm:grid-cols-2">
          {[
            ['#suche', '1. Zoeken'],
            ['#favoriten', '2. Favorieten'],
            ['#parkseite', '3. De parkpagina'],
            ['#badges', '4. Badges & statussen'],
            ['#kalender', '5. Drukte-kalender'],
            ['#prognosen', '6. AI-voorspellingen'],
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
        </SubSection>

        <SubSection title="What you can search for">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parks', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attractions', desc: 'Taron, Silver Star, Space Mountain...' },
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

        <InfoBox>
          The search uses smart full-text search that works even with typos. Search for "Phantasia"
          and you'll find "Phantasialand".
        </InfoBox>
      </Section>

      {/* ── 2. Favorites ────────────────────────────────────────────────────── */}
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

        <TipBox>
          Save your 5–10 favorite attractions at your target park. On the day of your visit,
          you'll instantly see which ones have short wait times – great for on-the-fly decisions.
        </TipBox>
      </Section>

      {/* ── 3. Park Page ────────────────────────────────────────────────────── */}
      <Section id="parkseite" title="The Park Page">
        <p className="text-muted-foreground mb-4">
          Every park has its own page with live data, opening hours, an interactive calendar and a
          map.
        </p>
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
      </Section>

      {/* ── 4. Badges ───────────────────────────────────────────────────────── */}
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
            The crowd level shows how busy a park or attraction is relative to the historical 90th
            percentile (P90). A "High" value means the park is busier than 90% of typical days.
          </p>
          <div className="space-y-3">
            {[
              {
                color:
                  'bg-crowd-very-low/65 border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
                label: 'Very Low',
                icon: User,
                threshold: '< 20% of P90',
                desc: 'Almost no queues. Ideal visit day.',
              },
              {
                color:
                  'bg-crowd-low/65 border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
                label: 'Low',
                icon: User,
                threshold: '20–40% of P90',
                desc: 'Short wait times at most attractions.',
              },
              {
                color:
                  'bg-crowd-moderate/65 border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
                label: 'Moderate',
                icon: Users,
                threshold: '40–60% of P90',
                desc: 'Typical day – manageable wait times.',
              },
              {
                color:
                  'bg-crowd-high/65 border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
                label: 'High',
                icon: Users,
                threshold: '60–80% of P90',
                desc: 'Busy – popular rides have 30–60 min waits.',
              },
              {
                color:
                  'bg-crowd-very-high/65 border-crowd-very-high/80 dark:bg-crowd-very-high/25 dark:border-crowd-very-high/40',
                label: 'Very High',
                icon: Users,
                threshold: '80–100% of P90',
                desc: 'Very crowded – plan around peak hours.',
              },
              {
                color:
                  'bg-crowd-extreme/65 border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
                label: 'Extreme',
                icon: AlertTriangle,
                threshold: '> 100% of P90',
                desc: 'Record crowds – 90+ min waits possible. School holidays, special events.',
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
            <strong>What is the 90th percentile (P90)?</strong> park.fan compares current occupancy
            with historical data. The P90 is the value exceeded by only 10% of all days – essentially
            the "very busy day" benchmark. If occupancy is at 50% of P90 today, it's half as busy as
            the busiest days.
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

      {/* ── 5. Calendar ─────────────────────────────────────────────────────── */}
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

        <TipBox>
          Best visit days are typically early weekdays outside of school holidays – Tuesday through
          Thursday show the lowest crowd levels. Avoid school holiday weeks in densely populated
          regions.
        </TipBox>
      </Section>

      {/* ── 6. AI Predictions ───────────────────────────────────────────────── */}
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

        <TipBox>
          Combine calendar and predictions: pick a green day from the calendar, then check the
          hourly forecast on the attraction page to find the quietest slot. You'll always arrive
          at the shortest queue.
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
            <Li>P90 thresholds: understand if a ride is really busy or just "normal".</Li>
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
