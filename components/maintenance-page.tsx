'use client';

import { useTranslations } from 'next-intl';

export function MaintenancePage() {
  const t = useTranslations('common');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-100 px-4 dark:bg-slate-950">
      {/* Living gradient: slowly drifting, blurred aurora blobs in the theme color */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-primary/80 dark:bg-primary/55 absolute -top-32 -left-24 h-[42rem] w-[42rem] animate-[maintenance-drift-1_18s_ease-in-out_infinite] rounded-full blur-3xl motion-reduce:animate-none" />
        <div className="bg-primary/60 dark:bg-primary/40 absolute -right-24 -bottom-32 h-[40rem] w-[40rem] animate-[maintenance-drift-2_22s_ease-in-out_infinite] rounded-full blur-3xl motion-reduce:animate-none" />
        <div className="bg-primary/50 dark:bg-primary/30 absolute top-1/2 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 animate-[maintenance-drift-3_26s_ease-in-out_infinite] rounded-full blur-3xl motion-reduce:animate-none" />
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
        <p className="text-muted-foreground text-base">{t('maintenanceDescription')}</p>
      </div>
    </div>
  );
}
