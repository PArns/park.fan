'use client';

import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { ANALYTICS_OPT_OUT_KEY, privacySignal } from '@/lib/analytics/opt-out';

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function readIsOptedOut(): boolean | null {
  try {
    return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === '1';
  } catch {
    // Storage blocked: there is no flag to read or write, so the button stays disabled.
    return null;
  }
}

const unknownOnServer = () => null;
const subscribeToNothing = () => () => {};

/**
 * Privacy-page box that shows whether this browser is counted, by Umami and by our own page-view
 * counter, and toggles the `umami.disabled` localStorage flag both read to opt out or back in. A
 * browser sending Do Not Track or Global Privacy Control is told so, since it is not counted (or,
 * under GPC, not by our counter) whatever the switch says.
 */
export function AnalyticsOptOut() {
  const t = useTranslations('datenschutz.analyticsOptOut');
  const isOptedOut = useSyncExternalStore(subscribe, readIsOptedOut, unknownOnServer);
  const signal = useSyncExternalStore(subscribeToNothing, privacySignal, unknownOnServer);

  const handleToggle = () => {
    if (isOptedOut) localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
    else localStorage.setItem(ANALYTICS_OPT_OUT_KEY, '1');
    listeners.forEach((listener) => listener());
  };

  if (isOptedOut === null) {
    return (
      <div className="border-border bg-muted/30 mt-6 rounded-lg border p-4">
        <p className="text-muted-foreground mb-3 text-sm">{t('description')}</p>
        <Button variant="outline" size="sm" disabled>
          {t('loading')}
        </Button>
      </div>
    );
  }

  return (
    <div className="border-border bg-muted/30 mt-6 rounded-lg border p-4">
      <p className="text-muted-foreground mb-3 text-sm">{t('description')}</p>
      <p className="text-muted-foreground mb-3 text-xs">{t('scope')}</p>
      <p className="text-muted-foreground mb-3 text-xs">
        {isOptedOut
          ? t('statusExcluded')
          : signal === 'dnt'
            ? t('statusDnt')
            : signal === 'gpc'
              ? t('statusGpc')
              : t('statusIncluded')}
      </p>
      <Button variant="outline" size="sm" onClick={handleToggle}>
        {isOptedOut ? t('optIn') : t('optOut')}
      </Button>
    </div>
  );
}
