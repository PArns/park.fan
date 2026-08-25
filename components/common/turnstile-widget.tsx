'use client';

import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { useTheme } from 'next-themes';

/**
 * Cloudflare Turnstile widget (explicit render).
 *
 * Loads the Turnstile script once, renders into our container, and surfaces the
 * solved token via `onVerify`. The token is then POSTed to the route that acts
 * on it, where the server verifies it with the secret key
 * (`lib/security/turnstile.ts`).
 *
 * Site key comes from NEXT_PUBLIC_TURNSTILE_SITE_KEY; when unset we fall back to
 * Cloudflare's official always-passes TEST key so the form still renders in dev.
 *
 * Two things exist for the admin login and are worth stating, because both are
 * about a token being **single-use**:
 *
 *  - `ref.reset()`. A login is two round trips when the account has a second
 *    factor — password, then code — and the first one spends the token. Without
 *    a reset the code step would arrive with a token Cloudflare has already
 *    retired and every 2FA login would fail on its last step. The caller resets
 *    after every attempt, successful or not.
 *  - `theme`. `/admin` is hardcoded dark and mounts no next-themes provider, so
 *    `useTheme()` answers `undefined` there and the widget would render its
 *    light skin on a near-black panel. An explicit prop wins over the hook.
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
      action?: string;
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
    script.onerror = () => {
      // Forget the failed attempt, or the cached rejected promise makes every
      // later retry fail instantly without a request — which is the difference
      // between "the network blipped" and "this browser can never sign in".
      scriptPromise = null;
      script.remove();
      reject(new Error('Failed to load Turnstile'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  /** Discard the solved token and ask for a fresh challenge. */
  reset: () => void;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  /** Called when the challenge itself fails — a blocked script, a network drop. */
  onError?: () => void;
  /** Labels the solve in the Cloudflare dashboard, so two forms are tellable apart. */
  action?: string;
  /** Overrides the app theme. Required wherever no next-themes provider is mounted. */
  theme?: 'light' | 'dark';
  className?: string;
  ref?: Ref<TurnstileHandle>;
}

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  action,
  theme,
  className,
  ref,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const { resolvedTheme } = useTheme();
  const appliedTheme = theme ?? (resolvedTheme === 'dark' ? 'dark' : 'light');

  // Keep the latest callbacks without re-rendering the widget. Updated in an effect
  // (not during render) so the Turnstile widget instance stays stable.
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

  useImperativeHandle(ref, () => ({
    reset() {
      if (!widgetIdRef.current || !window.turnstile) return;
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        /* widget was torn down between the attempt and its answer */
      }
    },
  }));

  useEffect(() => {
    let cancelled = false;
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          theme: appliedTheme,
          ...(action ? { action } : {}),
          callback: (token) => onVerifyRef.current(token),
          'expired-callback': () => onExpireRef.current?.(),
          'error-callback': () => {
            onExpireRef.current?.();
            onErrorRef.current?.();
          },
        });
      })
      .catch((err) => {
        console.error('[turnstile]', err);
        onErrorRef.current?.();
      });

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
  }, [appliedTheme, action]);

  return <div ref={containerRef} className={className} />;
}
