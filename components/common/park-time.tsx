'use client';

import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useBrowserTimezone } from '@/lib/hooks/use-mounted';

interface ParkTimeProps {
  /** ISO datetime string from the API */
  isoTime: string;
  /** IANA timezone identifier for the park (e.g. "Europe/Berlin") */
  parkTimezone: string;
  /** BCP-47 locale code for formatting */
  locale?: string;
  className?: string;
  /** Append the locale-specific time suffix (e.g. " Uhr" in German) */
  showSuffix?: boolean;
}

/**
 * Renders a time in the park's local timezone.
 * When browser timezone differs from park timezone, a tooltip on hover
 * shows the equivalent time in the user's local timezone.
 */
export function ParkTime({
  isoTime,
  parkTimezone,
  locale = 'en',
  className,
  showSuffix = false,
}: ParkTimeProps) {
  const tCommon = useTranslations('common');
  const browserTimezone = useBrowserTimezone();

  const date = new Date(isoTime);
  const suffix = showSuffix ? tCommon('timeSuffix') : '';

  const parkTimeStr = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: parkTimezone,
  });

  const isSameZone = !browserTimezone || browserTimezone === parkTimezone;

  if (isSameZone) {
    return (
      <span className={className}>
        {parkTimeStr}
        {suffix}
      </span>
    );
  }

  const browserTimeStr = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const shortZone =
    new Intl.DateTimeFormat(locale, {
      timeZone: browserTimezone,
      timeZoneName: 'short',
    })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value ?? browserTimezone;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn('cursor-help underline decoration-dotted underline-offset-2', className)}
        >
          {parkTimeStr}
          {suffix}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>
          {browserTimeStr}
          {suffix} <span className="opacity-70">({shortZone})</span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

interface ParkTimeRangeProps {
  openingTime: string;
  closingTime: string;
  parkTimezone: string;
  locale?: string;
  /** Append the locale-specific time suffix after the closing time (e.g. " Uhr") */
  showSuffix?: boolean;
  className?: string;
}

/**
 * Renders an opening–closing time range in the park's local timezone.
 * Each time shows a browser-timezone tooltip on hover when timezones differ.
 */
export function ParkTimeRange({
  openingTime,
  closingTime,
  parkTimezone,
  locale,
  showSuffix = false,
  className,
}: ParkTimeRangeProps) {
  return (
    <span className={cn('tabular-nums', className)}>
      <ParkTime isoTime={openingTime} parkTimezone={parkTimezone} locale={locale} />
      {' – '}
      <ParkTime
        isoTime={closingTime}
        parkTimezone={parkTimezone}
        locale={locale}
        showSuffix={showSuffix}
      />
    </span>
  );
}
