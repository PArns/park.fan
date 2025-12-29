'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  X,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudFog,
  Sun,
  Snowflake,
} from 'lucide-react';
import type { CalendarEvent } from '@/lib/api/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatEventDescription, getCrowdLevelColor } from '@/lib/utils/calendar-utils';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface TicketPurchase {
  price: number;
}

interface LegacyWeather {
  weatherDescription: string;
  temperatureMin: number;
  temperatureMax: number;
}

interface CalendarEventTooltipProps {
  event: CalendarEvent;
  onClose: () => void;
}

export function CalendarEventTooltip({ event, onClose }: CalendarEventTooltipProps) {
  const t = useTranslations('parks.eventTypes');
  const tDetails = useTranslations('parks.calendarView.details');
  const locale = useLocale();
  const eventTypeLabel = t(event.resource.type);

  const renderContent = () => {
    switch (event.resource.type) {
      case 'schedule': {
        const schedule = event.resource.schedule;
        if (!schedule) return null;

        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{tDetails('schedule.title')}</h4>
            {schedule.scheduleType === 'CLOSED' ? (
              <p className="font-medium text-red-500">{tDetails('schedule.closed')}</p>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {tDetails('schedule.openingHours')}:
                  </span>
                  <span className="font-medium">
                    {format(new Date(schedule.openingTime || ''), 'HH:mm')} -{' '}
                    {format(new Date(schedule.closingTime || ''), 'HH:mm')}
                  </span>
                </div>
                {(schedule.purchases as unknown as TicketPurchase[])?.[0]?.price && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {tDetails('schedule.ticketPrice', {
                        price: (schedule.purchases as unknown as TicketPurchase[])[0].price,
                      })}
                    </span>
                  </div>
                )}
                {schedule.isBridgeDay && (
                  <p className="text-xs text-amber-600 italic">{tDetails('schedule.bridgeDay')}</p>
                )}
              </>
            )}
            {schedule.description && (
              <p className="text-muted-foreground mt-2 text-xs">{schedule.description}</p>
            )}
          </div>
        );
      }

      case 'weather': {
        const weather = event.resource.weather;
        if (!weather) return null;

        const isSummary = 'condition' in weather;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const wLegacy = weather as unknown as LegacyWeather;
        const condition = isSummary
          ? weather.condition
          : (weather as unknown as LegacyWeather).weatherDescription;
        const minFn = isSummary
          ? weather.tempMin
          : (weather as unknown as LegacyWeather).temperatureMin;
        const maxFn = isSummary
          ? weather.tempMax
          : (weather as unknown as LegacyWeather).temperatureMax;
        const rainChance = isSummary ? weather.rainChance : null;

        // Map weather icon code to Lucide icon
        const getWeatherIcon = (iconCode: number | string) => {
          const code = typeof iconCode === 'number' ? iconCode : 0;
          if (code === 0) return Sun;
          if (code >= 1 && code <= 3) return Cloud;
          if (code >= 45 && code <= 48) return CloudFog;
          if (code >= 51 && code <= 57) return CloudDrizzle;
          if (code >= 61 && code <= 67) return CloudRain;
          if (code >= 71 && code <= 77) return Snowflake;
          if (code >= 80 && code <= 82) return CloudRain;
          if (code >= 85 && code <= 86) return CloudSnow;
          if (code >= 95 && code <= 99) return CloudRain;
          return Cloud;
        };

        const WeatherIcon = weather.icon ? getWeatherIcon(weather.icon) : Cloud;

        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{tDetails('weather.title')}</h4>
            <div className="flex items-center gap-2">
              <WeatherIcon className="h-8 w-8 text-blue-500" />
              <span className="text-lg font-medium">{condition}</span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground block">{tDetails('weather.temp')}</span>
                <span>
                  {Math.round(Number(minFn))}°C - {Math.round(Number(maxFn))}°C
                </span>
              </div>
              {rainChance !== null && (
                <div>
                  <span className="text-muted-foreground block">
                    {tDetails('weather.rainChance')}
                  </span>
                  <span>{rainChance}%</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'crowd': {
        const crowd = event.resource.crowd;
        if (!crowd) return null;

        const crowdColor = getCrowdLevelColor(crowd.crowdLevel);

        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{tDetails('crowd.title')}</h4>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{tDetails('crowd.level')}:</span>
              <Badge
                style={{
                  backgroundColor: crowdColor,
                  color: '#fff',
                  borderColor: crowdColor,
                }}
              >
                {event.title.replace(/.*?\s/, '')}
              </Badge>
            </div>
            {crowd.confidencePercentage &&
              !isNaN(crowd.confidencePercentage) &&
              crowd.confidencePercentage > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{tDetails('crowd.confidence')}:</span>
                  <span>{Math.round(crowd.confidencePercentage)}%</span>
                </div>
              )}
            {crowd.recommendation && (
              <div className="mt-2 rounded bg-blue-50 p-2 text-sm dark:bg-blue-900/20">
                💡 {crowd.recommendation}
              </div>
            )}
          </div>
        );
      }

      case 'show': {
        const show = event.resource.show;
        if (!show) return null;
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{tDetails('show.title')}</h4>
            <p className="text-lg font-bold text-purple-700">{show.name}</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tDetails('show.startsAt')}:</span>
              <span className="font-mono">{format(event.start, 'HH:mm')}</span>
            </div>
            {show.endTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tDetails('show.duration')}:</span>
                <span className="font-mono">
                  {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                </span>
              </div>
            )}
          </div>
        );
      }

      case 'holiday': {
        const holiday = event.resource.holiday;
        if (!holiday) return null;
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{tDetails('holiday.title')}</h4>
            <p className="text-lg">{holiday.localName || holiday.name}</p>
            <Badge variant="outline">
              {holiday.isNationwide ? tDetails('holiday.nationwide') : tDetails('holiday.regional')}
            </Badge>
          </div>
        );
      }

      default:
        return (
          <div className="text-sm">
            <p className="font-medium">{formatEventDescription(event)}</p>
            {event.resource.details && (
              <p className="text-muted-foreground mt-2 text-xs">{event.resource.details}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Card
      className="animate-in fade-in zoom-in-95 fixed z-50 w-96 border-2 py-0 shadow-2xl duration-200"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <CardHeader className="bg-muted/40 border-b px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs tracking-wider uppercase">
              {eventTypeLabel}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="-mt-2 -mr-2 h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
          <span className="text-foreground font-medium">
            {format(event.start, 'EEEE, d. MMMM', {
              locale: locale === 'de' ? de : enUS,
            })}
          </span>
        </div>

        {renderContent()}
      </CardContent>
    </Card>
  );
}
