'use client';

import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { ParkTimeRange } from '@/components/common/park-time';

interface OperatingHoursDisplayProps {
  openingTime: string;
  closingTime: string;
  /** IANA timezone string (e.g. 'Europe/Berlin'). If omitted, displays raw HH:mm from ISO string. */
  timeZone?: string;
  className?: string;
}

export function OperatingHoursDisplay({
  openingTime,
  closingTime,
  timeZone,
  className,
}: OperatingHoursDisplayProps) {
  const locale = useLocale();

  if (timeZone) {
    return (
      <ParkTimeRange
        openingTime={openingTime}
        closingTime={closingTime}
        parkTimezone={timeZone}
        locale={locale}
        showSuffix
        className={cn('tabular-nums', className)}
      />
    );
  }

  // Fallback when no timezone: extract HH:mm directly from ISO string
  const openHHmm =
    openingTime.length >= 16 ? openingTime.substring(11, 16) : openingTime.substring(0, 5);
  const closeHHmm =
    closingTime.length >= 16 ? closingTime.substring(11, 16) : closingTime.substring(0, 5);

  return (
    <span className={cn('tabular-nums', className)}>
      {openHHmm} – {closeHHmm}
    </span>
  );
}
