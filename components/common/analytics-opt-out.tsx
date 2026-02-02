'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const UMAMI_DISABLED_KEY = 'umami.disabled';

function getIsOptedOut(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(UMAMI_DISABLED_KEY) === '1';
}

export function AnalyticsOptOut() {
  const t = useTranslations('datenschutz.analyticsOptOut');
  const [isOptedOut, setIsOptedOut] = useState<boolean | null>(null);

  useEffect(() => {
    queueMicrotask(() => setIsOptedOut(getIsOptedOut()));
  }, []);

  const handleToggle = () => {
    if (isOptedOut) {
      localStorage.removeItem(UMAMI_DISABLED_KEY);
      setIsOptedOut(false);
    } else {
      localStorage.setItem(UMAMI_DISABLED_KEY, '1');
      setIsOptedOut(true);
    }
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
        {isOptedOut ? t('statusExcluded') : t('statusIncluded')}
      </p>
      <Button variant="outline" size="sm" onClick={handleToggle}>
        {isOptedOut ? t('optIn') : t('optOut')}
      </Button>
    </div>
  );
}
