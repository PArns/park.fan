'use client';

import { useEffect, useId, useRef } from 'react';
import { useTheme } from 'next-themes';

/**
 * Cloudflare Turnstile widget (explicit render).
 *
 * Loads the Turnstile script once, renders into our container, and surfaces the
 * solved token via `onVerify`. The token is then POSTed to /api/contribute, where
 * the server verifies it with the secret key (lib/contribute/turnstile.ts).
 *
 * Site key comes from NEXT_PUBLIC_TURNSTILE_SITE_KEY; when unset we fall back to
 * Cloudflare's official always-passes TEST key so the prototype renders in dev.
 */

const TEST_SITE_KEY = '1x00000000000000000000AA';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
    }
  ) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onloadTurnstileCallback?: () => void;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  className?: string;
}

export function TurnstileWidget({ onVerify, onExpire, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const { resolvedTheme } = useTheme();
  const reactId = useId();

  // Keep the latest callbacks without re-rendering the widget. Updated in an effect
  // (not during render) so the Turnstile widget instance stays stable.
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    let cancelled = false;
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
          callback: (token) => onVerifyRef.current(token),
          'expired-callback': () => onExpireRef.current?.(),
          'error-callback': () => onExpireRef.current?.(),
        });
      })
      .catch((err) => console.error('[turnstile]', err));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* widget already gone */
        }
        widgetIdRef.current = null;
      }
    };
    // Re-render the widget when the theme flips so it matches light/dark.
  }, [resolvedTheme, reactId]);

  return <div ref={containerRef} className={className} />;
}
