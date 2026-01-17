'use client';

import { useMemo, useState, useCallback, createElement } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO, addMinutes } from 'date-fns';
import { enUS, de } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import type {
  CalendarEvent,
  ParkWithAttractions,
  IntegratedCalendarResponse,
  HolidayType,
  WeatherSummary,
  CrowdLevel,
} from '@/lib/api/types';
import {
  getParkTime,
  getWeatherTranslationKey,
  getEventIcon,
  getWeatherIconFromCode,
} from '@/lib/utils/calendar-utils';
import { Card } from '@/components/ui/card';
import { CalendarEventTooltip } from './calendar-event-tooltip';
import { CalendarLegend } from './calendar-legend';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-overrides.css';

interface ParkCalendarProps {
  park: ParkWithAttractions;
  calendarData: IntegratedCalendarResponse;
}

// Custom Event Component
const CustomEventComponent = ({ event }: { event: CalendarEvent }) => {
  const Icon = getEventIcon(event.resource.icon || '');
  return (
    <div className="flex items-center gap-1 overflow-hidden">
      {createElement(Icon, { size: 14, className: 'shrink-0' })}
      <span className="truncate">{event.title}</span>
    </div>
  );
};

export function ParkCalendar({ park, calendarData }: ParkCalendarProps) {
  const locale = useLocale();
  const t = useTranslations('parks');

  // State for selected event tooltip
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Set up date-fns localizer with appropriate locale
  const dateLocale = locale === 'de' ? de : enUS;
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: dateLocale }),
    getDay,
    locales: { en: enUS, de: de },
  });

  // Transform integrated calendar data into react-big-calendar events
  const transformedEvents = useMemo(() => {
    if (!calendarData?.days) return [];

    const events: CalendarEvent[] = [];

    calendarData.days.forEach((day) => {
      const dayDate = parseISO(day.date);

      // Skip invalid dates
      if (isNaN(dayDate.getTime())) return;

      // 1. Schedule Event (Opening Hours)
      if (day.status === 'OPERATING' && day.hours) {
        events.push({
          id: `1-schedule-${day.date}`,
          title: day.hours.isInferred
            ? `${format(getParkTime(day.hours.openingTime, park.timezone), 'HH:mm')} - ${format(getParkTime(day.hours.closingTime, park.timezone), 'HH:mm')} (Est.)`
            : `${format(getParkTime(day.hours.openingTime, park.timezone), 'HH:mm')} - ${format(getParkTime(day.hours.closingTime, park.timezone), 'HH:mm')}`,
          start: dayDate,
          end: dayDate,
          allDay: true,
          resource: {
            type: 'schedule',
            timezone: park.timezone,
            schedule: {
              date: day.date,
              scheduleType: day.status,
              openingTime: day.hours.openingTime,
              closingTime: day.hours.closingTime,
              description: day.hours.isInferred ? 'Estimated hours' : null,
              purchases: day.ticket?.price ? [{ price: day.ticket.price }] : null,
              isHoliday: day.isHoliday,
              holidayName: day.events?.find((e) => e.type === 'holiday')?.name || null,
              isBridgeDay: day.isBridgeDay,
              isPublicHoliday: day.isPublicHoliday,
              isSchoolHoliday: day.isSchoolHoliday,
              isSchoolVacation: day.isSchoolVacation,
            },
            icon: 'Clock',
          },
        });
      } else if (day.status !== 'OPERATING') {
        events.push({
          id: `schedule-${day.date}`,
          title: t('closed'),
          start: dayDate,
          end: dayDate,
          allDay: true,
          resource: {
            type: 'schedule',
            timezone: park.timezone,
            schedule: {
              date: day.date,
              scheduleType: 'CLOSED',
              openingTime: null,
              closingTime: null,
              description: null,
              purchases: null,
              isHoliday: day.isHoliday,
              holidayName: null,
              isBridgeDay: false,
              isPublicHoliday: day.isPublicHoliday,
              isSchoolHoliday: day.isSchoolHoliday,
              isSchoolVacation: day.isSchoolVacation,
            },
            icon: 'Ban',
          },
        });
      }

      // 2. Crowd Prediction Event (MOVED UP FROM POSITION 3)
      if (day.crowdLevel && day.crowdLevel !== 'closed') {
        const crowdTitle = t(`crowdLevels.${day.crowdLevel}`);
        const avgWait = day.avgWaitTime ? ` (~${day.avgWaitTime} min)` : '';

        events.push({
          id: `2-crowd-${day.date}`,
          title: `${crowdTitle}${avgWait}`,
          start: dayDate,
          end: dayDate,
          allDay: true,
          resource: {
            type: 'crowd',
            timezone: park.timezone,
            crowd: {
              date: day.date,
              crowdLevel: day.crowdLevel as CrowdLevel,
              confidencePercentage: 0,
              recommendation: '',
              source: 'prediction',
              avgWaitTime: day.avgWaitTime,
            },
            icon: 'Users',
          },
        });
      }

      // 4. Weather Event (MOVED TO POSITION 4)
      if (day.weather) {
        // Construct weather summary
        const weatherSummary: WeatherSummary = {
          condition: day.weather.condition,
          icon: day.weather.icon,
          tempMin: day.weather.tempMin,
          tempMax: day.weather.tempMax,
          rainChance: day.weather.rainChance,
        };

        const weatherKey = getWeatherTranslationKey(day.weather.icon);
        // Type assertion to satisfy next-intl strict typing without any
        const translatedCondition = t(`weather.${weatherKey}` as Parameters<typeof t>[0]);

        // Format temperature range more clearly
        const tempMin = Math.round(day.weather.tempMin);
        const tempMax = Math.round(day.weather.tempMax);
        const tempDisplay = `${tempMin}° bis ${tempMax}°C`;

        events.push({
          id: `3-weather-${day.date}`,
          title: `${translatedCondition} | ${tempDisplay}`,
          start: dayDate,
          end: dayDate,
          allDay: true,
          resource: {
            type: 'weather',
            timezone: park.timezone,
            weather: weatherSummary,
            icon: getWeatherIconFromCode(day.weather.icon),
            details: `${translatedCondition} | ${day.weather.tempMin}°C-${day.weather.tempMax}°C`,
          },
        });
      }

      // 4. Holiday Events (MOVED UP FROM POSITION 5)
      day.events?.forEach((event) => {
        if (event.type === 'holiday') {
          events.push({
            id: `4-holiday-${day.date}-${event.name}`,
            title: `${event.name}`,
            start: dayDate,
            end: dayDate,
            allDay: true,
            resource: {
              type: 'holiday',
              timezone: park.timezone,
              holiday: {
                date: day.date,
                name: event.name,
                localName: event.name,
                country: park.country || '',
                region: park.region || '',
                holidayType: 'public' as HolidayType, // Fallback type
                isNationwide: event.isNationwide || false,
              },
              icon: 'PartyPopper',
            },
          });
        }
      });

      // 5. Show Times (MOVED UP FROM POSITION 6)
      day.showTimes?.forEach((show, idx) => {
        let showStart: Date;
        let showEnd: Date;

        try {
          const showStartTime = parseISO(show.time);
          showStart = getParkTime(showStartTime, park.timezone);

          if (show.endTime) {
            const showEndTime = parseISO(show.endTime);
            showEnd = getParkTime(showEndTime, park.timezone);
          } else {
            showEnd = addMinutes(showStart, 30); // Default duration if end time is not provided
          }

          const cleanName = show.name;

          events.push({
            id: `5-show-${day.date}-${idx}`,
            title: `${cleanName}`,
            start: showStart,
            end: showEnd,
            allDay: false, // Show as block in time grid
            resource: {
              type: 'show',
              timezone: park.timezone,
              show: {
                name: cleanName,
                time: show.time,
                endTime: show.endTime,
              },
              icon: 'Clapperboard',
            },
          });
        } catch (e) {
          console.error('Error parsing show time', e);
        }
      });
    });

    return events.filter((e) => !isNaN(e.start.getTime()));
  }, [calendarData, t, park]);

  // Calendar view state
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Filter events based on current view
  const visibleEvents = useMemo(() => {
    if (view === 'month') {
      // In month view, show opening hours, weather, and crowd predictions
      return transformedEvents.filter(
        (event) =>
          event.resource.type === 'schedule' ||
          event.resource.type === 'weather' ||
          event.resource.type === 'crowd'
      );
    }
    // In all other views, show all events
    return transformedEvents;
  }, [transformedEvents, view]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  // Custom event styling to match improved legend
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    // We use !important modifiers (e.g., !bg-...) to override react-big-calendar default inline styles/CSS
    let className = 'text-xs border !border-transparent !rounded-md ';
    const isClosed = event.title.toLowerCase().includes('closed');

    if (event.resource.type === 'schedule') {
      if (isClosed) {
        className += '!bg-red-100 !text-red-900 dark:!bg-red-900/50 dark:!text-white ';
      } else {
        className += '!bg-blue-100 !text-blue-900 dark:!bg-blue-900/50 dark:!text-white ';
      }
    } else if (event.resource.type === 'weather') {
      className += '!bg-amber-100 !text-amber-900 dark:!bg-amber-900/50 dark:!text-white ';
    } else if (event.resource.type === 'crowd') {
      const crowdLevel = event.resource.crowd?.crowdLevel;
      if (crowdLevel) {
        switch (crowdLevel) {
          case 'very_low':
            className += '!bg-green-100 !text-green-800 dark:!bg-green-600 dark:!text-white ';
            break;
          case 'low':
            className += '!bg-lime-100 !text-lime-800 dark:!bg-lime-600 dark:!text-white ';
            break;
          case 'moderate':
            className += '!bg-yellow-100 !text-yellow-800 dark:!bg-yellow-600 dark:!text-white ';
            break;
          case 'high':
            className += '!bg-orange-100 !text-orange-800 dark:!bg-orange-600 dark:!text-white ';
            break;
          case 'very_high':
            className += '!bg-red-100 !text-red-800 dark:!bg-red-600 dark:!text-white ';
            break;
          case 'extreme':
            className += '!bg-red-200 !text-red-900 dark:!bg-red-800 dark:!text-white ';
            break;
        }
      }
    } else if (event.resource.type === 'holiday') {
      className += '!bg-orange-100 !text-orange-900 dark:!bg-orange-900/50 dark:!text-white ';
    } else if (event.resource.type === 'show') {
      className += '!bg-pink-100 !text-pink-900 dark:!bg-pink-900/50 dark:!text-white ';
    }

    return { className };
  }, []);

  // Day cell style getter - for full-day background coloring
  const dayPropGetter = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayData = calendarData?.days?.find((d) => d.date === dateStr);
      const style: React.CSSProperties = {};
      let className = '!border-t-4 !border-transparent '; // reserve space for border

      if (!dayData) return { className };

      // Background color for crowd levels
      if (dayData.status !== 'OPERATING') {
        className += '!bg-red-50/50 dark:!bg-red-950/30 ';
      } else if (dayData.crowdLevel) {
        switch (dayData.crowdLevel) {
          case 'very_low':
            className += '!bg-green-50/50 dark:!bg-green-950/20 ';
            break;
          case 'low':
            className += '!bg-lime-50/50 dark:!bg-lime-950/20 ';
            break;
          case 'moderate':
            className += '!bg-yellow-50/50 dark:!bg-yellow-950/20 ';
            break;
          case 'high':
            className += '!bg-orange-50/50 dark:!bg-orange-950/20 ';
            break;
          case 'very_high':
            className += '!bg-red-50/50 dark:!bg-red-950/20 ';
            break;
          case 'extreme':
            className += '!bg-red-100/50 dark:!bg-red-900/30 ';
            break;
        }
      }

      // Priority: Public Holiday > School Vacation > Bridge Day
      if (dayData.isPublicHoliday) {
        className += '!border-t-orange-500 ';
      } else if (dayData.isSchoolHoliday || dayData.isSchoolVacation) {
        className += '!border-t-yellow-500 ';
      } else if (dayData.isBridgeDay) {
        className += '!border-t-blue-500 ';
      }

      return { className, style };
    },
    [calendarData]
  );

  return (
    <Card className="relative p-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold">{t('crowdCalendar')}</h2>
          <CalendarLegend />
        </div>

        <div style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={visibleEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            culture={locale}
            eventPropGetter={eventStyleGetter}
            dayPropGetter={dayPropGetter}
            onSelectEvent={handleSelectEvent}
            formats={{
              timeGutterFormat: (date, culture, localizer) =>
                localizer!.format(date, 'HH:mm', culture),
              eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                `${localizer!.format(start, 'HH:mm', culture)} - ${localizer!.format(end, 'HH:mm', culture)}`,
              agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
                `${localizer!.format(start, 'HH:mm', culture)} - ${localizer!.format(end, 'HH:mm', culture)}`,
              dayHeaderFormat: (date, culture, localizer) =>
                localizer!.format(date, 'eeee, d. MMMM', culture),
            }}
            messages={{
              today: t('calendarView.today'),
              previous: t('calendarView.previous'),
              next: t('calendarView.next'),
              month: t('calendarView.month'),
              week: t('calendarView.week'),
              day: t('calendarView.day'),
              agenda: t('calendarView.agenda'),
            }}
            components={{
              event: CustomEventComponent,
            }}
          />
        </div>
      </div>

      {selectedEvent && (
        <CalendarEventTooltip event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </Card>
  );
}
