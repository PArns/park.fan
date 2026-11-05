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
import { plannerStore } from '@/lib/planner/store';
import { assistantPlannerSnapshot } from './planner-context';
import {
  assistantAlertsSnapshot,
  type AssistantActionOutcome,
  type AssistantAlertPrompt,
} from './alerts-context';
import { readPushState } from './alert-writes';
import { listRideAlertsLocal, listShowFollowsLocal } from '@/lib/push/push-follows-store';
import { getFavoritesFromCookies } from '@/lib/utils/favorites';
import { assistantFavoritesSnapshot } from './favorites-context';
import {
  breakMinutesFrom,
  breakStorage,
  isChatEnded,
  readBreakUntil,
  startBreak,
} from './chat-end';

/** A lookup Parky names while it runs, as the API's `status` event sends it. */
export type AssistantLookup =
  | 'parks'
  | 'wait-times'
  | 'rides'
  | 'forecast'
  | 'posts'
  | 'planner'
  | 'location'
  | 'weather'
  | 'glossary';

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
  /** Reminders Parky asked for that wait for the visitor's press, or failed. */
  alerts?: AssistantAlertPrompt[];
  /** Parky asked for the visitor's position; the answer carries the share buttons. */
  asksLocation?: boolean;
  /** Set on an answer that failed; `text` is then empty. */
  error?: 'limit' | 'off' | 'upstream' | 'network' | 'session' | 'expired' | 'unclear' | 'ended';
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

/** The browser's IANA zone, e.g. Europe/Berlin; undefined where the runtime does not say. */
function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
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
  /** Carries out an action Parky asked for; returns the chip or card to show, once it is done. */
  onAction: (action: AssistantAction) => AssistantActionOutcome | Promise<AssistantActionOutcome>,
  /** Parky ended the chat, by his goodbye or the API's refusal; called once the answer is in. */
  onEnded?: () => void
) {
  const { token: sessionToken, drop: dropSession } = session;
  const [stored, setStored] = useState<Stored>(() =>
    typeof window === 'undefined' ? { conversationId: null, messages: [] } : load()
  );
  const [phase, setPhase] = useState<AssistantChatPhase>('idle');
  const [lookup, setLookup] = useState<AssistantLookup | null>(null);
  /** The end of Parky's break; the input stays closed until then. */
  const [pausedUntil, setPausedUntil] = useState<number | null>(() =>
    readBreakUntil(breakStorage())
  );
  useEffect(() => {
    if (pausedUntil === null) return;
    const timer = setTimeout(() => setPausedUntil(null), Math.max(0, pausedUntil - Date.now()));
    return () => clearTimeout(timer);
  }, [pausedUntil]);
  const abort = useRef<AbortController | null>(null);
  /** A language switch, held until the answer is complete and stored. */
  const afterAnswer = useRef<AssistantAction | null>(null);

  useEffect(() => save(stored), [stored]);
  useEffect(() => () => abort.current?.abort(), []);
  // After the save above, in the same commit: the switch remounts the window, which would cut off
  // an answer still streaming and lose one not yet stored.
  useEffect(() => {
    const action = afterAnswer.current;
    if (phase !== 'idle' || !action) return;
    afterAnswer.current = null;
    void onAction(action);
  }, [phase, onAction]);

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
      if (readBreakUntil(breakStorage()) !== null) return;
      trackSiteEvent('assistant_question', { kind });
      let lookups = 0;
      let result: NonNullable<AssistantChatMessage['error']> | 'answered' = 'answered';
      let switchTo: AssistantAction | null = null;
      /** The break's end, once the chat was ended. */
      let endedUntil: number | null = null;
      const endChat = (minutes: number) => {
        endedUntil = startBreak(breakStorage(), minutes);
      };
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
        const alerts = assistantAlertsSnapshot(
          await readPushState().catch(() => 'unavailable' as const),
          listRideAlertsLocal(),
          listShowFollowsLocal()
        );
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
            // Parky gives every time in the reader's own clock; the API converts, not the model.
            timeZone: browserTimeZone(),
            // The plan lives in this browser alone; Parky reads it with every question.
            planner: assistantPlannerSnapshot(plannerStore.getSnapshot()),
            alerts,
            favorites: assistantFavoritesSnapshot(getFavoritesFromCookies()),
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
        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          if (isChatEnded((body as { code?: unknown } | null)?.code)) {
            endChat(breakMinutesFrom(body, response.headers.get('Retry-After')));
            fail('ended');
            return;
          }
        }
        if (!response.ok || !response.body) {
          // 422: the API took the message for junk and asked no model.
          const failed = { 422: 'unclear', 429: 'limit', 503: 'off' } as const;
          fail(failed[response.status as keyof typeof failed] ?? 'upstream');
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
            } else if (action?.type === 'chat_end') {
              endChat(action.cooldownMinutes);
            } else if (action?.type === 'switch_locale') {
              switchTo = action;
              patchLast((m) => ({ ...m, chips: [...(m.chips ?? []), 'language'] }));
            } else if (action) {
              const outcome = await onAction(action);
              if (typeof outcome === 'string') {
                patchLast((m) => ({ ...m, chips: [...(m.chips ?? []), outcome] }));
              } else if (outcome) {
                patchLast((m) => ({ ...m, alerts: [...(m.alerts ?? []), outcome] }));
              }
            }
          } else if (event === 'done') {
            patchLast((m) => ({ ...m, messageId: payload.messageId }));
          } else if (event === 'error') {
            if (isChatEnded(payload.code)) {
              endChat(breakMinutesFrom(payload));
              fail('ended');
            } else fail(payload.code === 'off' ? 'off' : 'upstream');
          }
        }
      } catch {
        if (!controller.signal.aborted) fail('network');
      } finally {
        if (!controller.signal.aborted) {
          trackSiteEvent('assistant_answer', { result, lookups });
          afterAnswer.current = switchTo;
        }
        setPhase('idle');
        setLookup(null);
        if (endedUntil !== null) {
          setPausedUntil(endedUntil);
          onEnded?.();
        }
      }
    },
    [locale, phase, stored.conversationId, patchLast, sessionToken, dropSession, onAction, onEnded]
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

  /** A reminder's card after the visitor's press: set, or failed with the reason. */
  const settleAlert = useCallback(
    (messageId: string, prompt: AssistantAlertPrompt) =>
      setStored((current) => ({
        ...current,
        messages: current.messages.map((m) =>
          m.id === messageId
            ? { ...m, alerts: m.alerts?.map((a) => (a.id === prompt.id ? prompt : a)) }
            : m
        ),
      })),
    []
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
    pausedUntil,
    send,
    shareLocation,
    settleAlert,
    rate,
    reset,
  };
}
