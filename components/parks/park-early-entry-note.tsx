'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useParkOpenings } from './park-openings-context';

/**
 * „Early Entry" under the park's opening hours, where a human has confirmed that hotel guests get
 * in before the gates open (`hasEarlyEntry`). The minutes are printed only when the API has a
 * value; without one the sentence makes no claim about how early. Draws nothing until today's plan
 * has landed, and for the parks nobody has confirmed, which includes every park nobody checked.
 */
export function ParkEarlyEntryNote({ className }: { className?: string }) {
  const t = useTranslations('parks.earlyEntry');
  const earlyEntry = useParkOpenings()?.earlyEntry;
  if (!earlyEntry) return null;
  return (
    <span className={cn('text-muted-foreground text-xs', className)}>
      <span className="text-foreground font-semibold">{t('title')}</span>
      {' · '}
      {earlyEntry.minutes !== null
        ? t('detailMinutes', { minutes: earlyEntry.minutes })
        : t('detail')}
    </span>
  );
}
