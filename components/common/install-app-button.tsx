'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';
import {
  dismissInstall,
  getInstallMode,
  getServerInstallMode,
  promptInstall,
  subscribeToInstall,
} from '@/lib/pwa/install-store';

/**
 * Offers the installable manifest (`app/manifest.ts`) to the visitor, in the footer's brand block
 * under the Google source button.
 *
 * It draws nothing until the browser can act on it: Chromium has handed over
 * `beforeinstallprompt`, or this is Safari on iOS, where the only route is the Share sheet and
 * the button shows a hint instead. No modal, nothing above the fold, so nothing in the page
 * moves. A dismissal is remembered for 30 days (`lib/pwa/install-store.ts`).
 */
export function InstallAppButton({ className }: { className?: string }) {
  const t = useTranslations('footer.install');
  const mode = useSyncExternalStore(subscribeToInstall, getInstallMode, getServerInstallMode);
  const [hintOpen, setHintOpen] = useState(false);

  if (mode === 'none') return null;

  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={mode === 'ios' ? hintOpen : undefined}
          onClick={() => (mode === 'ios' ? setHintOpen((open) => !open) : void promptInstall())}
          className={cn(
            'text-muted-foreground hover:text-foreground border-foreground/20 hover:border-foreground/40 bg-foreground/[0.03] hover:bg-foreground/[0.08] inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
            PHONE_HIT_AREA
          )}
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('label')}</span>
        </button>
        <button
          type="button"
          aria-label={t('dismiss')}
          onClick={dismissInstall}
          className={cn(
            'text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-full transition-colors',
            PHONE_HIT_AREA
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {mode === 'ios' && hintOpen && (
        <p role="status" className="text-muted-foreground text-sm leading-normal">
          {t('iosHint')}
        </p>
      )}
    </div>
  );
}
