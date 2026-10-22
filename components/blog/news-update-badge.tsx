import { useFormatter, useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The pill in front of a news headline whose post got an `[!UPDATE]` box after it was published,
 * so a reader who saw the first version knows there is more. The date is in the tooltip, not the
 * pill: the age line above already carries a date. Hook-only, so the header menu (a client tree)
 * and the server-rendered listings draw the same pill.
 */
export function NewsUpdateBadge({ date, className }: { date: string; className?: string }) {
  const t = useTranslations('navigation');
  const format = useFormatter();
  const label = t('newsUpdated');
  return (
    <span
      title={`${label} · ${format.dateTime(new Date(date), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`}
      className={cn(
        'bg-primary/15 text-primary inline-flex items-center gap-1 rounded-full px-1.5 py-px align-[1px] text-[10px] leading-4 font-bold tracking-wider uppercase',
        className
      )}
    >
      <RefreshCw className="size-2.5" aria-hidden="true" />
      {label}
    </span>
  );
}
