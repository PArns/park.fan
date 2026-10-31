'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { ASSISTANT_API, assistantPagePath } from '@/lib/assistant/use-assistant-chat';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';

type State = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Feedback about the site, sent with the page it was written on and, when one is open, the chat,
 * so the admin can read both together. The e-mail is only for those who want an answer. It carries
 * the window's session token, so the challenge solved for the chat covers it too.
 */
export function AssistantFeedbackForm({
  conversationId,
  sessionToken,
  onSessionRejected,
}: {
  conversationId: string | null;
  sessionToken: string | null;
  onSessionRejected: () => void;
}) {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const pathname = usePathname();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (message.trim().length < 3 || state === 'sending' || !sessionToken) return;
    setState('sending');
    try {
      const response = await fetch(`${ASSISTANT_API}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          ...(email.trim() && { email: email.trim() }),
          locale,
          pagePath: assistantPagePath(pathname, locale),
          ...(conversationId && { conversationId }),
          sessionToken,
        }),
      });
      if (response.status === 401) onSessionRejected();
      setState(response.ok ? 'sent' : 'error');
      if (response.ok) {
        trackSiteEvent('assistant_feedback_sent', { email: email.trim().length > 0 });
        setMessage('');
      }
    } catch {
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm">
        <CheckCircle2 className="text-status-operating size-10" />
        <p>{t('feedbackSent')}</p>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="text-primary text-xs underline underline-offset-2"
        >
          {t('feedbackAnother')}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-3 text-sm"
    >
      <p className="text-muted-foreground">{t('feedbackIntro')}</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">{t('feedbackLabel')}</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          minLength={3}
          maxLength={2000}
          required
          placeholder={t('feedbackPlaceholder')}
          className="bg-background/60 border-border focus:ring-primary/40 resize-none rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 sm:text-sm"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">{t('emailLabel')}</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={254}
          autoComplete="email"
          className="bg-background/60 border-border focus:ring-primary/40 rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 sm:text-sm"
        />
        <span className="text-muted-foreground text-xs">{t('emailHint')}</span>
      </label>
      {state === 'error' && <p className="text-destructive text-xs">{t('feedbackError')}</p>}
      <button
        type="submit"
        disabled={message.trim().length < 3 || state === 'sending'}
        className="bg-primary text-primary-foreground mt-auto rounded-full px-4 py-2 font-medium transition-opacity disabled:opacity-40"
      >
        {t('feedbackSend')}
      </button>
    </form>
  );
}
