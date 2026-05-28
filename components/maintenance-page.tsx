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
    <div className="bg-background fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 text-center">
      {/* Hero logo – light/dark variant based on theme */}
      <div className="relative mb-10 h-40 w-40 sm:h-56 sm:w-56">
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

      <h1 className="mb-3 text-3xl font-bold">{t('maintenanceTitle')}</h1>
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
