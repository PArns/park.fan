import { formatInTimeZone } from 'date-fns-tz';
import { getIntegratedCalendar } from '@/lib/api/integrated-calendar';
import type { CalendarDay } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { Clock, Sun, Star, Backpack, PartyPopper, Calendar } from 'lucide-react';
import { MockCalendar, type MockLocale, CROWD_LABELS, CROWD_COLORS } from './_mock-components';

export function buildBorderColor(day: CalendarDay): string {
  if (day.status === 'CLOSED') return 'border-status-closed dark:border-status-closed';
  if (day.isSchoolVacation || day.isSchoolHoliday)
    return 'border-yellow-500 dark:border-yellow-400';
  if (day.isHoliday || day.isPublicHoliday) return 'border-orange-500 dark:border-orange-400';
  if (day.isBridgeDay) return 'border-blue-500 dark:border-blue-400';
  if (day.isToday) return 'border-primary';
  return 'border-border';
}

export async function LiveCalendarExample({ locale }: { locale: MockLocale }) {
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
        ? 'badge-status-closed'
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
