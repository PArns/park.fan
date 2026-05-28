'use client';

import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaintenancePageProps {
  onRetry?: () => void;
}

export function MaintenancePage({ onRetry }: MaintenancePageProps) {
  const t = useTranslations('common');
  const handleRetry = onRetry ?? (() => window.location.reload());

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      {/* Hero logo – light/dark variant based on theme */}
      <div className="relative mb-8 h-24 w-24 sm:h-32 sm:w-32">
        {/* SVGs don't benefit from next/image optimization — use <img> directly */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-big.svg"
          alt="park.fan"
          className="h-full w-full object-contain dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-big-dark.svg"
          alt="park.fan"
          className="hidden h-full w-full object-contain dark:block"
        />
      </div>

      <h1 className="mb-2 text-2xl font-bold">{t('maintenanceTitle')}</h1>
      <p className="text-muted-foreground mb-8 max-w-md text-base">
        {t('maintenanceDescription')}
      </p>

      <Button onClick={handleRetry} variant="default" className="gap-2">
        <RotateCcw className="h-4 w-4" />
        {t('retry')}
      </Button>
    </div>
  );
}
