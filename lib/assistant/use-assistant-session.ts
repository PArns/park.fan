'use client';

import { useCallback, useState } from 'react';
import { ASSISTANT_API } from './use-assistant-chat';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';

const STORE_KEY = 'parkfan:assistant-session';
/** A minute's margin, so a token is not sent in the second it expires. */
const MARGIN_MS = 60_000;

interface Session {
  token: string;
  expiresAt: number;
}

function load(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    const session = raw ? (JSON.parse(raw) as Session) : null;
    return session && session.expiresAt - MARGIN_MS > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function store(session: Session | null): void {
  try {
    if (session) window.sessionStorage.setItem(STORE_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(STORE_KEY);
  } catch {
    // Without storage the challenge is solved once per page load.
  }
}

/** Where the challenge stands for the window: solved, being checked, or failed. */
export type AssistantSessionState = 'ready' | 'checking' | 'failed';

/**
 * Parky's challenge-response from the browser's side: a solved Turnstile token is traded at the API
 * for a session token, which every chat, rating and feedback carries. Kept for the session, so the
 * challenge is solved once per visit; `drop` forgets it when the API refuses it.
 */
export function useAssistantSession() {
  const [session, setSession] = useState<Session | null>(() =>
    typeof window === 'undefined' ? null : load()
  );
  const [failed, setFailed] = useState(false);

  const solve = useCallback(async (turnstileToken: string) => {
    setFailed(false);
    try {
      const response = await fetch(`${ASSISTANT_API}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnstileToken }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const body = (await response.json()) as { sessionToken: string; expiresInSeconds: number };
      const next = {
        token: body.sessionToken,
        expiresAt: Date.now() + body.expiresInSeconds * 1000,
      };
      store(next);
      setSession(next);
    } catch {
      trackSiteEvent('assistant_challenge_failed', {});
      setFailed(true);
    }
  }, []);

  const drop = useCallback(() => {
    store(null);
    setSession(null);
  }, []);

  const fail = useCallback(() => {
    trackSiteEvent('assistant_challenge_failed', {});
    setFailed(true);
  }, []);
  const retry = useCallback(() => setFailed(false), []);

  const state: AssistantSessionState = session ? 'ready' : failed ? 'failed' : 'checking';
  return { token: session?.token ?? null, state, solve, drop, fail, retry };
}
