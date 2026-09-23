'use client';

import { useFormatter, useLocale } from 'next-intl';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';

/** Up to this many days a news post counts as new and its age is drawn in the accent colour. */
const NEW_DAYS = 7;

/**
 * A news post's date, and — once the page has hydrated — how old it is.
 *
 * With news the age is the point: "Traumatica starts on Friday" means something else three
 * months later. The relative half ("vor 3 Tagen") is computed in the browser, not on the server,
 * because the pages that carry it are cached for up to a day (the homepage) or longer (the header
 * menu on a static page): a server-side "heute" would still say "heute" tomorrow. The absolute
 * date is rendered on the server and stays, so the line has its text from the first byte and
 * only grows by the relative half after hydration — on the same line, so the height does not move.
 */
export function NewsAge({ date, className }: { date: string; className?: string }) {
  const format = useFormatter();
  const locale = useLocale();
  // One-shot: a day-granular label does not need a ticking clock.
  const now = useBrowserNow(null);

  // Date-only ISO strings parse as UTC midnight on server and client alike, which keeps the
  // server-rendered date and the hydrated one identical (the same call `BlogMenuPanel` makes).
  const published = new Date(date);
  const absolute = format.dateTime(published, { day: 'numeric', month: 'short', year: 'numeric' });

  let relative: string | null = null;
  let isNew = false;
  if (now && !Number.isNaN(published.getTime())) {
    // The reader's calendar day, as UTC midnight, against the post's — both day-aligned.
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.max(0, Math.round((today - published.getTime()) / 86_400_000));
    isNew = days <= NEW_DAYS;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    relative =
      days < 7
        ? rtf.format(-days, 'day')
        : days < 60
          ? rtf.format(-Math.round(days / 7), 'week')
          : rtf.format(-Math.round(days / 30), 'month');
  }

  return (
    <span className={cn('block truncate text-[11px] tabular-nums', className)}>
      {relative && (
        <span className={cn('font-semibold', isNew ? 'text-primary' : 'text-muted-foreground')}>
          {relative}
          {' · '}
        </span>
      )}
      <time dateTime={date} className="text-muted-foreground/80">
        {absolute}
      </time>
    </span>
  );
}
