'use client';

import { useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { plannerStore } from '@/lib/planner/store';
import { nextUp, shortDay } from '@/lib/assistant/parky/yours';

/** The nearest planned day as `date|park`, a string so the store's snapshot compares by value. */
function nextUpKey(): string | null {
  const next = nextUp(plannerStore.getSnapshot(), Date.now());
  return next ? `${next.date}|${next.park}` : null;
}

/**
 * The line under Parky's name in the window, where a messenger shows a status: the visitor's next
 * planned day („Als Nächstes: Efteling, Do., 19. Nov.“), else who he is to them („Dein
 * Park-Buddy“). Read from the day planner in this browser, so it follows a change at once.
 */
export function AssistantSubtitle() {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const next = useSyncExternalStore(plannerStore.subscribe, nextUpKey, () => null);
  const [date, park] = next ? [next.slice(0, 10), next.slice(11)] : [];
  return (
    <p className="text-muted-foreground truncate text-xs leading-tight">
      {date && park ? t('subtitleNext', { park, date: shortDay(date, locale) }) : t('subtitle')}
    </p>
  );
}
