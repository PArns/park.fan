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
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-100 px-4 dark:bg-slate-950">
      {/* Living gradient: slowly drifting, blurred aurora blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 animate-[maintenance-drift-1_18s_ease-in-out_infinite] rounded-full bg-sky-400/45 blur-3xl motion-reduce:animate-none dark:bg-sky-500/30" />
        <div className="absolute top-1/3 right-1/4 h-[32rem] w-[32rem] translate-x-1/2 animate-[maintenance-drift-2_22s_ease-in-out_infinite] rounded-full bg-violet-500/45 blur-3xl motion-reduce:animate-none dark:bg-violet-600/30" />
        <div className="absolute bottom-1/4 left-1/3 h-[34rem] w-[34rem] animate-[maintenance-drift-3_26s_ease-in-out_infinite] rounded-full bg-fuchsia-400/40 blur-3xl motion-reduce:animate-none dark:bg-fuchsia-500/25" />
      </div>

      {/* Glass box with logo + text, centered */}
      <div className="relative z-10 flex max-w-md flex-col items-center rounded-3xl border border-white/30 bg-white/20 px-8 py-12 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        {/* Hero logo – light/dark variant based on theme */}
        <div className="relative mb-8 h-36 w-36 sm:h-44 sm:w-44">
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
        <p className="text-muted-foreground mb-8 text-base">{t('maintenanceDescription')}</p>

        <Button onClick={handleRetry} variant="default" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
