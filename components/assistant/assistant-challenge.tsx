'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TurnstileWidget } from '@/components/common/turnstile-widget';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';
import type { AssistantSessionState } from '@/lib/assistant/use-assistant-session';
import { ParkyLogo } from './parky-logo';

/**
 * The challenge in Parky's window, drawn as part of it rather than as a bare Cloudflare box. Almost
 * always it passes unseen: Parky's mark turns and a line says it is checking. Only when Cloudflare
 * wants a click does the widget appear, framed in the same glass as the window.
 */
export function AssistantChallenge({
  state,
  onSolved,
  onFailed,
  onRetry,
}: {
  state: AssistantSessionState;
  onSolved: (token: string) => void;
  onFailed: () => void;
  onRetry: () => void;
}) {
  const t = useTranslations('assistant');
  const [interactive, setInteractive] = useState(false);
  // A new key mounts a fresh widget, the only way to start a failed challenge over.
  const [attempt, setAttempt] = useState(0);
  const failed = state === 'failed';

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-6 text-center">
      <div className="relative">
        <span
          aria-hidden="true"
          className={cn(
            'from-primary/30 to-status-operating/30 absolute -inset-3 rounded-full bg-gradient-to-br blur-xl transition-opacity duration-500',
            failed ? 'opacity-0' : 'animate-pulse opacity-100 motion-reduce:animate-none'
          )}
        />
        <ParkyLogo className="relative size-16 drop-shadow-lg" talking={!failed} />
      </div>

      <div className="space-y-1" role="status" aria-live="polite">
        <p className="flex items-center justify-center gap-1.5 text-sm font-semibold">
          <ShieldCheck className="text-status-operating size-4" />
          {failed
            ? t('challengeFailed')
            : interactive
              ? t('challengeInteract')
              : t('challengeChecking')}
        </p>
        <p className="text-muted-foreground text-xs">{t('challengeWhy')}</p>
      </div>

      {failed ? (
        <button
          type="button"
          onClick={() => {
            setInteractive(false);
            setAttempt((n) => n + 1);
            onRetry();
          }}
          className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium shadow-md transition-transform hover:scale-[1.02] active:scale-95"
        >
          <RotateCcw className="size-4" />
          {t('challengeRetry')}
        </button>
      ) : (
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
            interactive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            <div className="bg-background/60 border-border/60 rounded-2xl border p-2 shadow-inner backdrop-blur">
              <TurnstileWidget
                key={attempt}
                appearance="interaction-only"
                action={TURNSTILE_ACTIONS.assistantSession}
                onInteractive={setInteractive}
                onVerify={onSolved}
                onError={onFailed}
                onExpire={() => setInteractive(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
