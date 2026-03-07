'use client';

import { cn } from '@/lib/utils';
import { LocalTimeRange } from '@/components/ui/local-time';

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
  if (timeZone) {
    return (
      <span className={cn('tabular-nums', className)}>
        <LocalTimeRange start={openingTime} end={closingTime} timeZone={timeZone} />
      </span>
    );
  }

  // Fallback: extract HH:mm directly from ISO string (e.g. "2025-06-01T09:00:00")
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
