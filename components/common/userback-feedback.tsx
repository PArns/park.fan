'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import type { UserbackWidget, UserbackWidgetSettings } from '@userback/widget';
import { Button } from '@/components/ui/button';
import { trackEvent, UMAMI_EVENTS } from '@/lib/analytics/umami';

// Public token (safe to expose). Feature is disabled when unset — same gate
// pattern as the Umami integration.
const USERBACK_TOKEN = process.env.NEXT_PUBLIC_USERBACK_TOKEN;

// park.fan's locales map 1:1 onto Userback's supported widget languages.
const LOCALE_TO_USERBACK_LANGUAGE: Record<string, UserbackWidgetSettings['language']> = {
  en: 'en',
  de: 'de',
  nl: 'nl',
  fr: 'fr',
  es: 'es',
  it: 'it',
};

interface Props {
  locale: string;
}

/**
 * Floating "Feedback" button that loads Userback on demand.
 *
 * Consent by action: the Userback SDK is NOT loaded on page load. Nothing is
 * fetched and no personal data (IP, geo, device, localStorage) is processed
 * until the visitor actively clicks this button to send feedback. This keeps
 * the site free of an always-on third-party tool — Umami stays the only script
 * that loads automatically (cookieless/anonymous, needs no consent banner).
 *
 * We render our own trigger and drive Userback purely via its API
 * (`trigger_type: 'api'`) so Userback's native launcher never appears.
 */
export function UserbackFeedback({ locale }: Props) {
  const t = useTranslations('feedback');
  const widgetRef = useRef<UserbackWidget | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    trackEvent(UMAMI_EVENTS.FEEDBACK_OPENED);

    // Already initialised → just reopen the form.
    if (widgetRef.current) {
      widgetRef.current.open();
      return;
    }
    if (!USERBACK_TOKEN || loading) return;

    setLoading(true);
    try {
      // Lazy-load the SDK only on first interaction.
      const { default: Userback } = await import('@userback/widget');
      const widget = await Userback(USERBACK_TOKEN, {
        is_live: process.env.NODE_ENV === 'production',
        widget_settings: {
          language: LOCALE_TO_USERBACK_LANGUAGE[locale] ?? 'en',
          // We provide the trigger button ourselves; keep the native launcher hidden.
          trigger_type: 'api',
        },
      });
      widgetRef.current = widget;
      widget.open();
    } catch (error) {
      console.error('[Userback] Failed to initialise feedback widget:', error);
    } finally {
      setLoading(false);
    }
  }, [locale, loading]);

  // No token configured → feature disabled.
  if (!USERBACK_TOKEN) return null;

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={t('aria')}
      className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg"
    >
      {loading ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <MessageSquarePlus aria-hidden="true" />
      )}
      <span>{t('label')}</span>
    </Button>
  );
}
