import { hourlyNotice } from '@/lib/admin/site-analytics';
import type { AnalyticsWindow } from '@/lib/api/admin-site-analytics';
import { cn } from '@/lib/utils';
import { Notice } from '../../_ui/primitives';

/**
 * The line under a panel's figures when the API could not read the hourly rows for the whole
 * window (`hourlyFrom` in its answer): from which day on they are complete. It is nothing at all
 * for an answer that covers its window, so a panel does not reserve room for it.
 */
export function HourlyNotice({
  data,
  className,
}: {
  data: Pick<AnalyticsWindow, 'from' | 'hourlyFrom'> | null | undefined;
  className?: string;
}) {
  const text = data ? hourlyNotice(data.hourlyFrom, data.from) : null;
  if (!text) return null;
  // Every panel of a filtered page can carry one, so it is a muted line and not the amber box.
  return (
    <Notice
      className={cn(
        'border-border/60 bg-muted/20 text-muted-foreground mt-3 px-2.5 py-2 text-xs',
        className
      )}
    >
      {text}
    </Notice>
  );
}
