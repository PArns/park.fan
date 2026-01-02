'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getEventIcon } from '@/lib/utils/calendar-utils';
import { Backpack, PartyPopper, Calendar as CalendarIcon } from 'lucide-react'; // Import extra icons for special days

export function CalendarLegend() {
  const t = useTranslations('parks');
  const tEventTypes = useTranslations('parks.eventTypes');

  const legendItems = [
    {
      icon: 'Clock',
      label: tEventTypes('schedule'),
      color: '#3b82f6', // blue from eventStyleGetter
    },
    {
      icon: 'Sun',
      label: tEventTypes('weather'),
      color: '#e0e7ff', // light indigo from eventStyleGetter
      textColor: '#3730a3',
    },
    {
      icon: 'Users',
      label: tEventTypes('crowd'),
      note: t('crowdLevelsNote') || '(See below)',
    },
    {
      icon: 'PartyPopper',
      label: tEventTypes('holiday'),
      color: '#fef3c7', // light amber from eventStyleGetter
      textColor: '#92400e',
    },
    {
      icon: 'Clapperboard',
      label: tEventTypes('show') || 'Shows',
      color: '#f3e8ff', // light purple from eventStyleGetter
      textColor: '#6b21a8',
    },
  ];

  const crowdLevels = [
    {
      label: t('crowdLevels.very_low') || 'Sehr niedrig',
      color:
        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-100 dark:border-green-800',
    },
    {
      label: t('crowdLevels.low') || 'Niedrig',
      color:
        'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/50 dark:text-lime-100 dark:border-lime-800',
    },
    {
      label: t('crowdLevels.moderate') || 'Moderat',
      color:
        'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-100 dark:border-yellow-800',
    },
    {
      label: t('crowdLevels.high') || 'Hoch',
      color:
        'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-100 dark:border-orange-800',
    },
    {
      label: t('crowdLevels.very_high') || 'Sehr hoch',
      color:
        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-100 dark:border-red-800',
    },
    {
      label: t('crowdLevels.extreme') || 'Extrem',
      color:
        'bg-red-200 text-red-900 border-red-300 dark:bg-red-800/50 dark:text-red-50 dark:border-red-700',
    },
  ];

  const specialDays = [
    { label: t('schoolVacation') || 'Schulferien', borderColor: '#eab308', Icon: Backpack },
    { label: t('bridgeDay') || 'Brückentag', borderColor: '#3b82f6', Icon: CalendarIcon },
    { label: t('holiday') || 'Feiertag', borderColor: '#f97316', Icon: PartyPopper },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('calendarLegend')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Types */}
        <div>
          <h4 className="text-muted-foreground mb-2 text-sm font-medium">
            {t('eventTypesLabel') || 'Event-Typen'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {legendItems.map((item, index) => {
              const Icon = getEventIcon(item.icon || '');
              return (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${item.color || ''}`}
                  style={{ color: item.textColor }}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                  {item.note && (
                    <span className="text-muted-foreground ml-1 text-[10px]">{item.note}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Crowd Levels */}
        <div>
          <h4 className="text-muted-foreground mb-2 text-sm font-medium">
            {t('crowdLevelsLabel') || 'Auslastungsstufen'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {crowdLevels.map((level, index) => (
              <div
                key={index}
                className={`rounded-md border px-2.5 py-1.5 text-xs dark:border-gray-700 ${level.color}`}
              >
                {level.label}
              </div>
            ))}
          </div>
        </div>

        {/* Special Days */}
        <div>
          <h4 className="text-muted-foreground mb-2 text-sm font-medium">
            {t('specialDaysLabel') || 'Besondere Tage'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {specialDays.map((day, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
                style={{ borderTop: `4px solid ${day.borderColor}` }}
              >
                <day.Icon size={14} />
                <span>{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
