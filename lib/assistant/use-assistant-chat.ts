'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ORIGIN } from '@/lib/api/client';
import { readSse } from './sse';
import {
  readAssistantAction,
  type AssistantAction,
  type AssistantActionChip,
  type AssistantCard,
} from './actions';
import { trackSiteEvent, type AssistantQuestionKind } from '@/lib/analytics/site-analytics';

/** A lookup Parky names while it runs, as the API's `status` event sends it. */
export type AssistantLookup =
  'parks' | 'wait-times' | 'rides' | 'forecast' | 'posts' | 'planner' | 'location' | 'weather';

/** One line of the chat as the widget draws it. */
export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** The API's id of an answer, once it is stored; needed to rate it. */
  messageId?: string;
  rating?: 1 | -1;
  /** What the answer did on the page, shown as chips under it. */
  chips?: AssistantActionChip[];
  /** Live cards Parky showed with the answer. */
  cards?: AssistantCard[];
  /** Parky asked for the visitor's position; the answer carries the share buttons. */
  asksLocation?: boolean;
  /** Set on an answer that failed; `text` is then empty. */
  error?: 'limit' | 'off' | 'upstream' | 'network' | 'session' | 'expired';
}

/** Where the widget stands: idle, waiting for the first word, or writing. */
export type AssistantChatPhase = 'idle' | 'waiting' | 'writing';

const STORE_KEY = 'parkfan:assistant-chat';
const SLUG_PATH = /^\/[a-z0-9\-/]*$/;

/** Parky is served by api.park.fan itself, never by a relay route, so a chat costs no function. */
export const ASSISTANT_API = `${API_ORIGIN}/v1/assistant`;

/** The page as the API accepts it: a path of slugs, else the locale's home. */
export function assistantPagePath(pathname: string, locale: string): string {
  const path = pathname.toLowerCase().slice(0, 300);
  return SLUG_PATH.test(path) ? path : `/${locale}`;
}

interface Stored {
  conversationId: string | null;
  messages: AssistantChatMessage[];
}

function load(): Stored {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Stored;
  } catch {
    // A broken or blocked copy starts a new chat.
  }
  return { conversationId: null, messages: [] };
}

function save(stored: Stored): void {
  try {
    window.sessionStorage.setItem(STORE_KEY, JSON.stringify(stored));
  } catch {
    // The chat then lasts as long as the page.
  }
}

let nextId = 0;
const localId = () => `m${Date.now()}-${nextId++}`;

/**
 * The chat with Parky: sends a question, reads the answer as it streams, and keeps the chat for the
 * session so it survives a navigation. The history lives on the API; only its id is sent along.
 */
export function useAssistantChat(
  locale: string,
  session: { token: string | null; drop: () => void },
  /** Carries out an action Parky asked for; returns the chip to show, if any. */
  onAction: (action: AssistantAction) => AssistantActionChip | null
) {
  const { token: sessionToken, drop: dropSession } = session;
  const [stored, setStored] = useState<Stored>(() =>
    typeof window === 'undefined' ? { conversationId: null, messages: [] } : load()
  );
  const [phase, setPhase] = useState<AssistantChatPhase>('idle');
  const [lookup, setLookup] = useState<AssistantLookup | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => save(stored), [stored]);
  useEffect(() => () => abort.current?.abort(), []);

  const patchLast = useCallback(
    (patch: (message: AssistantChatMessage) => AssistantChatMessage) =>
      setStored((current) => ({
        ...current,
        messages: current.messages.map((m, i) =>
          i === current.messages.length - 1 ? patch(m) : m
        ),
      })),
    []
  );

  const send = useCallback(
    async (
      text: string,
      kind: AssistantQuestionKind = 'typed',
      /** The position, only right after the visitor pressed „Standort teilen". */
      location?: { lat: number; lng: number }
    ) => {
      const question = text.trim().slice(0, 1000);
      if (!question || phase !== 'idle' || !sessionToken) return;
      trackSiteEvent('assistant_question', { kind });
      let lookups = 0;
      let result: NonNullable<AssistantChatMessage['error']> | 'answered' = 'answered';
      setStored((current) => ({
        ...current,
        messages: [
          ...current.messages,
          { id: localId(), role: 'user', text: question },
          { id: localId(), role: 'assistant', text: '' },
        ],
      }));
      setPhase('waiting');
      setLookup(null);
      const controller = new AbortController();
      abort.current = controller;

      const fail = (error: NonNullable<AssistantChatMessage['error']>) => {
        result = error;
        patchLast((m) => ({ ...m, error }));
      };
      try {
        const response = await fetch(`${ASSISTANT_API}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            ...(stored.conversationId && { conversationId: stored.conversationId }),
            locale,
            pagePath: assistantPagePath(window.location.pathname, locale),
            message: question,
            sessionToken,
            ...(location && { location }),
          }),
        });
        if (response.status === 401) {
          // The session expired or the address changed: the window asks for a new challenge.
          dropSession();
          fail('session');
          return;
        }
        if (response.status === 404 && stored.conversationId) {
          // The chat expired on the API: the next question starts a new one.
          setStored((current) => ({ ...current, conversationId: null }));
          fail('expired');
          return;
        }
        if (!response.ok || !response.body) {
          fail(response.status === 429 ? 'limit' : response.status === 503 ? 'off' : 'upstream');
          return;
        }
        for await (const { event, data } of readSse(response.body)) {
          const payload = JSON.parse(data) as Record<string, string>;
          if (event === 'start') {
            setStored((current) => ({ ...current, conversationId: payload.conversationId }));
          } else if (event === 'status') {
            lookups++;
            setLookup(payload.tool as AssistantLookup);
          } else if (event === 'delta') {
            setPhase('writing');
            setLookup(null);
            patchLast((m) => ({ ...m, text: m.text + payload.text }));
          } else if (event === 'action') {
            const action = readAssistantAction((payload as unknown as { action: unknown }).action);
            if (action?.type === 'card') {
              patchLast((m) => ({ ...m, cards: [...(m.cards ?? []), action.card] }));
            } else if (action?.type === 'request_location') {
              patchLast((m) => ({ ...m, asksLocation: true }));
            } else if (action) {
              const chip = onAction(action);
              if (chip) patchLast((m) => ({ ...m, chips: [...(m.chips ?? []), chip] }));
            }
          } else if (event === 'done') {
            patchLast((m) => ({ ...m, messageId: payload.messageId }));
          } else if (event === 'error') {
            fail(payload.code === 'off' ? 'off' : 'upstream');
          }
        }
      } catch {
        if (!controller.signal.aborted) fail('network');
      } finally {
        if (!controller.signal.aborted) trackSiteEvent('assistant_answer', { result, lookups });
        setPhase('idle');
        setLookup(null);
      }
    },
    [locale, phase, stored.conversationId, patchLast, sessionToken, dropSession, onAction]
  );

  const rate = useCallback(
    (message: AssistantChatMessage, rating: 1 | -1) => {
      if (!message.messageId || !stored.conversationId || message.rating || !sessionToken) return;
      setStored((current) => ({
        ...current,
        messages: current.messages.map((m) => (m.id === message.id ? { ...m, rating } : m)),
      }));
      trackSiteEvent('assistant_rated', { rating: rating === 1 ? 'up' : 'down' });
      void fetch(`${ASSISTANT_API}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: stored.conversationId,
          messageId: message.messageId,
          rating,
          sessionToken,
        }),
      }).catch(() => undefined);
    },
    [stored.conversationId, sessionToken]
  );

  /** The position was shared: the question's card goes, and the position rides on a new question. */
  const shareLocation = useCallback(
    (messageId: string, text: string, position: { lat: number; lng: number }) => {
      setStored((current) => ({
        ...current,
        messages: current.messages.map((m) =>
          m.id === messageId ? { ...m, asksLocation: false } : m
        ),
      }));
      void send(text, 'typed', position);
    },
    [send]
  );

  const reset = useCallback(() => {
    abort.current?.abort();
    setStored({ conversationId: null, messages: [] });
  }, []);

  return {
    messages: stored.messages,
    conversationId: stored.conversationId,
    phase,
    lookup,
    send,
    shareLocation,
    rate,
    reset,
  };
}
