'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  ExternalLink,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAssistantChat,
  type AssistantChatMessage,
  type AssistantLookup,
} from '@/lib/assistant/use-assistant-chat';
import { useAssistantSession } from '@/lib/assistant/use-assistant-session';
import { drawOpener, sessionOpener } from '@/lib/assistant/opener';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { ParkyLogo } from './parky-logo';
import { AssistantMessageText } from './assistant-message-text';
import { AssistantFeedbackForm } from './assistant-feedback-form';
import { AssistantChallenge } from './assistant-challenge';
import { AssistantLocationAsk } from './assistant-location-ask';
import { AssistantCardView } from './assistant-card';
import { useAssistantActions } from './use-assistant-actions';
import type { AssistantActionChip } from '@/lib/assistant/actions';

const LOOKUP_KEY: Record<AssistantLookup, string> = {
  parks: 'lookupParks',
  'wait-times': 'lookupWaitTimes',
  planner: 'lookupPlanner',
  location: 'lookupLocation',
  weather: 'lookupWeather',
  glossary: 'lookupGlossary',
  rides: 'lookupRides',
  forecast: 'lookupForecast',
  posts: 'lookupPosts',
};

const ERROR_KEY: Record<NonNullable<AssistantChatMessage['error']>, string> = {
  limit: 'errorLimit',
  off: 'errorOff',
  upstream: 'errorUpstream',
  network: 'errorNetwork',
  session: 'errorSession',
  expired: 'errorExpired',
};

const CHIP: Record<AssistantActionChip, { key: string; icon: typeof ExternalLink }> = {
  navigated: { key: 'chipNavigated', icon: ExternalLink },
  planned: { key: 'chipPlanned', icon: CalendarCheck },
  optimized: { key: 'chipOptimized', icon: Sparkles },
};

/** A park's or ride's page, where the suggested questions are about "here". */
const PARK_PAGE = /\/parks\/[^/]+\/[^/]+\/[^/]+\/[^/]+/;

/** Three bouncing dots: Parky is thinking or looking something up. */
function TypingDots({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1" role="status" aria-label={label}>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="bg-muted-foreground/70 size-1.5 animate-bounce rounded-full motion-reduce:animate-pulse"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

/**
 * The window Parky opens in: the chat and, on its second tab, the feedback form. Mounted once
 * the launcher was first pressed and kept, so a closed and reopened chat is where it was.
 */
export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const session = useAssistantSession();
  const act = useAssistantActions(onClose);
  const chat = useAssistantChat(locale, session, act);
  const [tab, setTab] = useState<'chat' | 'feedback'>('chat');
  const [draft, setDraft] = useState('');
  // One greeting and set of suggestions per chat, kept for the session; a new chat draws again.
  const [opener, setOpener] = useState(sessionOpener);
  const input = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const parkPage = PARK_PAGE.test(usePathname());

  /**
   * One `assistant_opened` per closed to open edge and one `assistant_closed` with the questions
   * asked in between, so the report can tell a look from a conversation.
   */
  const askedAtOpen = useRef(0);
  const asked = chat.messages.filter((m) => m.role === 'user').length;
  const askedNow = useRef(asked);
  useEffect(() => {
    askedNow.current = asked;
  }, [asked]);
  useEffect(() => {
    if (!open) return;
    askedAtOpen.current = askedNow.current;
    trackSiteEvent('assistant_opened', {});
    return () =>
      trackSiteEvent('assistant_closed', { questions: askedNow.current - askedAtOpen.current });
  }, [open]);

  /**
   * On a phone the open window takes the screen, so the page behind it must not move: its scroll
   * is locked while the window is open, and the chat keeps its own scroll to itself.
   */
  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 639px)').matches) return;
    const { body, documentElement: html } = document;
    const before = { overflow: body.style.overflow, overscroll: html.style.overscrollBehavior };
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    return () => {
      body.style.overflow = before.overflow;
      html.style.overscrollBehavior = before.overscroll;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const last = chat.messages[chat.messages.length - 1];
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [chat.messages.length, last?.text, last?.messageId, last?.cards?.length, chat.lookup]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    // While Parky answers, Enter keeps the draft rather than dropping it.
    if (!draft.trim() || chat.phase !== 'idle') return;
    void chat.send(draft);
    setDraft('');
  };

  const suggestions = (parkPage ? opener.park : opener.site).map((key) => t(key));

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label={t('title')}
      aria-hidden={!open}
      inert={!open}
      className={cn(
        // Not `overflow-hidden`: Parky's face sits half outside the window's top edge.
        // A frame in the theme's blue, so the window reads as Parky's over any page.
        'bg-background/90 border-primary/60 ring-primary/15 fixed z-[45] flex flex-col rounded-2xl border-2 shadow-2xl ring-4 backdrop-blur-xl',
        // The launcher hides while the window is open, so the window takes its corner.
        'inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] h-[calc(100dvh-4.5rem)] sm:h-[min(clamp(560px,72dvh,720px),calc(100dvh-6rem))]',
        // Clear of the planner's edge tab, which sits on the right edge at mid height.
        'sm:inset-x-auto sm:right-12 sm:bottom-4 sm:w-[clamp(380px,32vw,480px)]',
        'planner-wide:right-[calc(var(--planner-inset,0px)+3rem)]',
        'origin-bottom-right transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
        open
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-3 scale-95 opacity-0'
      )}
    >
      <header className="border-border/60 from-primary/15 to-status-operating/10 relative flex touch-none items-center gap-3 rounded-t-2xl border-b bg-gradient-to-r py-1 pr-2 pl-[4.75rem] sm:py-2 sm:pr-3 sm:pl-24">
        {/* On a desktop Parky floats large over the window's top edge, where it is seen. */}
        <ParkyLogo
          className="absolute -top-7 left-1 size-16 drop-shadow-[0_8px_16px_rgb(0_0_0/0.35)] sm:-top-11 sm:size-20"
          // The closed window stays mounted; only an open one keeps Parky's idle life going.
          idle={open}
          mood={
            chat.phase === 'writing'
              ? 'talking'
              : chat.phase === 'waiting'
                ? chat.lookup
                  ? 'looking'
                  : 'thinking'
                : null
          }
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm leading-tight font-semibold">{t('title')}</h2>
        </div>
        {tab === 'chat' && chat.messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              chat.reset();
              setOpener(drawOpener(opener));
            }}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-1.5"
            aria-label={t('newChat')}
            title={t('newChat')}
          >
            <RotateCcw className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-1.5"
          aria-label={t('close')}
        >
          <X className="size-4" />
        </button>
      </header>

      <div
        role="tablist"
        className="border-border/60 flex touch-none gap-1 border-b px-3 py-1.5 text-xs font-medium"
      >
        {(['chat', 'feedback'] as const).map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              tab === name
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t(name === 'chat' ? 'tabChat' : 'tabFeedback')}
          </button>
        ))}
      </div>

      {session.state !== 'ready' ? (
        <AssistantChallenge
          state={session.state}
          onSolved={(token) => void session.solve(token)}
          onFailed={session.fail}
          onRetry={session.retry}
        />
      ) : tab === 'feedback' ? (
        <AssistantFeedbackForm
          conversationId={chat.conversationId}
          sessionToken={session.token}
          onSessionRejected={session.drop}
        />
      ) : (
        <>
          <div
            ref={scroller}
            // `overscroll-contain`: reaching the end does not scroll the page behind.
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 text-sm"
            aria-live="polite"
          >
            <div className="bg-muted/60 w-fit max-w-[92%] rounded-2xl rounded-tl-sm px-3 py-2">
              {t(opener.greeting)}
            </div>
            {chat.messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void chat.send(suggestion, 'suggestion')}
                    className="border-primary/30 text-primary hover:bg-primary/10 rounded-full border px-3 py-1 text-xs"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {chat.messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <p className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 whitespace-pre-wrap">
                    {message.text}
                  </p>
                </div>
              ) : (
                <div key={message.id} className="max-w-[92%]">
                  {/* As wide as its text, not the window: the dots alone are a small bubble. */}
                  <div className="bg-muted/60 w-fit rounded-2xl rounded-tl-sm px-3 py-2">
                    {message.error ? (
                      <p className="text-muted-foreground">{t(ERROR_KEY[message.error])}</p>
                    ) : message.text ? (
                      <AssistantMessageText text={message.text} />
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-2 text-xs">
                        <TypingDots label={t('typing')} />
                        {chat.lookup && t(LOOKUP_KEY[chat.lookup])}
                      </span>
                    )}
                  </div>
                  {message.cards?.map((card, index) => (
                    <AssistantCardView key={`${card.kind}-${index}`} card={card} />
                  ))}
                  {message.chips && message.chips.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 pl-1">
                      {message.chips.map((chip, index) => {
                        const { key, icon: Icon } = CHIP[chip];
                        return (
                          <span
                            key={`${chip}-${index}`}
                            className="bg-status-operating/15 text-status-operating inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          >
                            <Icon className="size-3" />
                            {t(key)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {message.asksLocation && (
                    <AssistantLocationAsk
                      onShare={(position) =>
                        chat.shareLocation(message.id, t('locationShared'), position)
                      }
                    />
                  )}
                  {message.messageId && (
                    <div className="text-muted-foreground mt-1 flex items-center gap-1 pl-1 text-xs">
                      {message.rating ? (
                        <span>{t('rated')}</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => chat.rate(message, 1)}
                            className="hover:text-foreground rounded p-1"
                            aria-label={t('rateUp')}
                          >
                            <ThumbsUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => chat.rate(message, -1)}
                            className="hover:text-foreground rounded p-1"
                            aria-label={t('rateDown')}
                          >
                            <ThumbsDown className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
          <form onSubmit={submit} className="border-border/60 border-t px-3 pt-2 pb-2">
            <div className="bg-muted/50 focus-within:ring-primary/40 flex items-end gap-2 rounded-2xl px-3 py-1.5 focus-within:ring-2">
              <textarea
                ref={input}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) submit(event);
                }}
                rows={1}
                maxLength={1000}
                placeholder={t('placeholder')}
                aria-label={t('placeholder')}
                className="max-h-28 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-base outline-none sm:text-sm"
              />
              <button
                type="submit"
                disabled={!draft.trim() || chat.phase !== 'idle'}
                className="bg-primary text-primary-foreground mb-0.5 rounded-full p-2 transition-opacity disabled:opacity-40"
                aria-label={t('send')}
              >
                <SendHorizontal className="size-4" />
              </button>
            </div>
            <p className="text-muted-foreground mt-1.5 text-center text-[11px]">
              {t('disclaimer')}
            </p>
          </form>
        </>
      )}
    </section>
  );
}
