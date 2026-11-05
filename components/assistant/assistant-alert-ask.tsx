'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, BellRing } from 'lucide-react';
import type { AssistantAlertPrompt } from '@/lib/assistant/alerts-context';
import { writeAssistantAlert } from '@/lib/assistant/alert-writes';
import { usePushErrorMessage } from '@/components/push/use-push-error-message';

/**
 * A reminder Parky asked for that could not be written mid-answer: notifications are not allowed
 * yet, or the write failed. The press is the visitor's, so the browser may ask for permission, and
 * it goes through the bells' own write, with their sentences for each failure.
 */
export function AssistantAlertAsk({
  prompt,
  onSettle,
}: {
  prompt: AssistantAlertPrompt;
  onSettle: (prompt: AssistantAlertPrompt) => void;
}) {
  const t = useTranslations('assistant');
  const errorMessage = usePushErrorMessage();
  const [pending, setPending] = useState(false);
  const { target } = prompt;

  const turnOn = async () => {
    setPending(true);
    const result = await writeAssistantAlert(target);
    setPending(false);
    onSettle(
      result.ok
        ? { id: prompt.id, target, state: 'set' }
        : { id: prompt.id, target, state: 'failed', error: result.error }
    );
  };

  const what =
    target.kind === 'show'
      ? t('alertShow', { name: target.name, time: target.start })
      : target.thresholdMinutes === null
        ? t('alertReopen', { name: target.name })
        : t('alertRide', { name: target.name, minutes: target.thresholdMinutes });
  const set = prompt.state === 'set';

  return (
    <div className="border-primary/30 bg-primary/5 mt-2 rounded-xl border p-3 text-xs">
      <p className="flex items-center gap-1.5 font-medium">
        {set ? (
          <BellRing className="text-status-operating size-4 shrink-0" />
        ) : (
          <Bell className="text-primary size-4 shrink-0" />
        )}
        {what}
      </p>
      {set ? (
        <p className="text-status-operating mt-1">{t('alertSet')}</p>
      ) : (
        <>
          {prompt.error && (
            <p className="text-destructive mt-1" role="alert">
              {errorMessage(prompt.error)}
            </p>
          )}
          <button
            type="button"
            onClick={() => void turnOn()}
            disabled={pending}
            className="bg-primary text-primary-foreground mt-2 rounded-full px-3 py-1.5 font-medium disabled:opacity-60"
          >
            {t('alertConfirm')}
          </button>
        </>
      )}
    </div>
  );
}
