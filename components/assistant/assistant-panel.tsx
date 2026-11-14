'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from 'react';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useSheetViewport } from '@/lib/hooks/use-sheet-viewport';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import {
  CalendarCheck,
  CalendarX2,
  CircleAlert,
  ExternalLink,
  Languages,
  MessageSquareHeart,
  RotateCcw,
  BellOff,
  BellRing,
  Heart,
  HeartOff,
  SendHorizontal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Undo2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { localizedPath } from '@/lib/i18n/localized-path';
import {
  useAssistantChat,
  type AssistantChatMessage,
  type AssistantLookup,
} from '@/lib/assistant/use-assistant-chat';
import { useAssistantSession } from '@/lib/assistant/use-assistant-session';
import { drawOpener, sessionOpener } from '@/lib/assistant/opener';
import { parkPathOf } from '@/lib/assistant/parky/easter-eggs';
import { trackSiteEvent, type AssistantOpenSource } from '@/lib/analytics/site-analytics';
import { ParkyLogo } from './parky/parky-logo';
import { ASSISTANT_PHONE_QUERY, PARKY_LAYER } from './parky-layer';
import { parkyJump } from '@/lib/assistant/parky-jump';
import { AssistantMessageText } from './assistant-message-text';
import { AssistantFeedbackForm } from './assistant-feedback-form';
import { AssistantChallenge } from './assistant-challenge';
import { AssistantLocationAsk } from './assistant-location-ask';
import { AssistantAlertAsk } from './assistant-alert-ask';
import { usePushErrorMessage } from '@/components/push/use-push-error-message';
import { AssistantCardView } from './assistant-card';
import { useAssistantActions } from './use-assistant-actions';
import type { AssistantActionChip, AssistantReceipt } from '@/lib/assistant/actions';
import { AssistantReplies } from './assistant-replies';
import { AssistantReceipts, ASSISTANT_DONE_CHIP_CLASS } from './assistant-receipt';
import { AssistantInterviewBar } from './assistant-interview-bar';
import { interviewStore, takeInterviewKickoff } from '@/lib/assistant/interview';
import type { ParkyReactionAct } from '@/lib/assistant/parky/reactions';

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
  unclear: 'errorUnclear',
  ended: 'paused',
};

/** How long Parky's goodbye stays on screen before the window closes. */
const GOODBYE_MS = 2500;

const CHIP: Record<AssistantActionChip, { key: string; icon: typeof ExternalLink }> = {
  navigated: { key: 'chipNavigated', icon: ExternalLink },
  planned: { key: 'chipPlanned', icon: CalendarCheck },
  optimized: { key: 'chipOptimized', icon: Sparkles },
  language: { key: 'chipLanguage', icon: Languages },
  feedback: { key: 'chipFeedback', icon: MessageSquareHeart },
  alert: { key: 'chipAlert', icon: BellRing },
  alertRemoved: { key: 'chipAlertRemoved', icon: BellOff },
  favorite: { key: 'chipFavorite', icon: Heart },
  unfavorite: { key: 'chipUnfavorite', icon: HeartOff },
  undoStale: { key: 'chipUndoStale', icon: CalendarX2 },
  undone: { key: 'chipUndone', icon: Undo2 },
};

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
 * Whether a drag of `dx`, `dy` from where the finger came down can scroll something under it
 * inside `root`: a box between the touched element and `root` that overflows in the drag's main
 * direction and has room left that way. Outside `root` nothing may move.
 */
function scrollsWithin(
  target: EventTarget | null,
  root: HTMLElement | null,
  dx: number,
  dy: number
) {
  if (!root || !(target instanceof Node) || !root.contains(target)) return false;
  const vertical = Math.abs(dy) >= Math.abs(dx);
  for (
    let node = target instanceof HTMLElement ? target : target.parentElement;
    node && root.contains(node);
    node = node.parentElement
  ) {
    const style = getComputedStyle(node);
    if (vertical) {
      if (!/auto|scroll/.test(style.overflowY) || node.scrollHeight <= node.clientHeight) continue;
      if (dy > 0 ? node.scrollTop > 0 : node.scrollTop + node.clientHeight < node.scrollHeight - 1)
        return true;
    } else {
      if (!/auto|scroll/.test(style.overflowX) || node.scrollWidth <= node.clientWidth) continue;
      if (dx > 0 ? node.scrollLeft > 0 : node.scrollLeft + node.clientWidth < node.scrollWidth - 1)
        return true;
    }
  }
  return false;
}

/**
 * The window Parky opens in: the chat and, on its second tab, the feedback form. Mounted once
 * the launcher was first pressed and kept, so a closed and reopened chat is where it was.
 */
export function AssistantPanel({
  open,
  onClose,
  openedBy,
  onAct,
}: {
  open: boolean;
  onClose: () => void;
  /** What opened the window, for `assistant_opened`. */
  openedBy: AssistantOpenSource;
  /** Plays one of Parky's acts on the button in the corner. */
  onAct?: (act: ParkyReactionAct) => void;
}) {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const session = useAssistantSession();
  const act = useAssistantActions(onClose);
  // The goodbye is read, then the window closes and Parky turns in for his break.
  const goodbye = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(goodbye.current), []);
  const ended = useCallback(() => {
    clearTimeout(goodbye.current);
    goodbye.current = setTimeout(() => {
      onClose();
      onAct?.('nightcap');
    }, GOODBYE_MS);
  }, [onClose, onAct]);
  const chat = useAssistantChat(locale, session, act, ended);
  const pushErrorMessage = usePushErrorMessage();
  const [tab, setTab] = useState<'chat' | 'feedback'>('chat');
  const [draft, setDraft] = useState('');
  // One greeting and set of suggestions per chat, kept for the session; a new chat draws again.
  const [opener, setOpener] = useState(sessionOpener);
  const input = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const phone = useMediaQuery(ASSISTANT_PHONE_QUERY);
  const face = useRef<HTMLDivElement>(null);
  const parkPage = parkPathOf(usePathname()) !== null;
  const interview = useSyncExternalStore(
    interviewStore.subscribe,
    interviewStore.getSnapshot,
    interviewStore.getServerSnapshot
  );

  // The planner's interview button: its first question goes out once the window can send it.
  const { send, phase } = chat;
  useEffect(() => {
    if (!open || session.state !== 'ready' || phase !== 'idle') return;
    const kind = takeInterviewKickoff();
    if (kind) void send(t(kind === 'trip' ? 'interview.kickoffTrip' : 'interview.kickoffDay'), 'interview');
  }, [open, session.state, phase, send, t]);

  /** A receipt's undo goes through Parky's own, which leaves a plan the visitor changed since. */
  const undo = async (messageId: string, receipt: AssistantReceipt) => {
    const outcome = await act(
      receipt.planner === 'trip'
        ? { type: 'trip_undo', region: receipt.region }
        : { type: 'planner_undo', park: receipt.park, date: receipt.date }
    );
    chat.settleReceipt(
      messageId,
      receipt.id,
      outcome === 'undoStale' ? 'stale' : outcome ? 'undone' : 'gone'
    );
  };

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
    trackSiteEvent('assistant_opened', { source: openedBy });
    return () =>
      trackSiteEvent('assistant_closed', { questions: askedNow.current - askedAtOpen.current });
  }, [open, openedBy]);

  // On a phone the window stands in what the browser shows: with the keyboard up iOS shows less
  // than the layout viewport and would let the visitor pan to the rest (`useSheetViewport`).
  useSheetViewport(open && phone, 'assistant');

  /**
   * On a phone the open window takes the screen, so the page behind it must not move: only the
   * chat scrolls. `overflow: hidden` on `<body>` alone does not stop iOS Safari from scrolling the
   * page under a finger, so the body is pinned in place (`position: fixed`, moved up by the scroll
   * it had) and put back where it was when the window closes. With the keyboard up iOS still pans
   * the view under a dragging finger, so a drag that no scroll area inside the window can take is
   * cancelled; a pinch still zooms.
   */
  useEffect(() => {
    if (!open || !phone) return;
    const { body, documentElement: html } = document;
    const scrollY = window.scrollY;
    const before = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
      overscroll: html.style.overscrollBehavior,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    let start = { x: 0, y: 0 };
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) start = { x: touch.clientX, y: touch.clientY };
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || event.touches.length > 1) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (!scrollsWithin(event.target, frame.current, dx, dy)) event.preventDefault();
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      body.style.position = before.position;
      body.style.top = before.top;
      body.style.left = before.left;
      body.style.right = before.right;
      body.style.overflow = before.overflow;
      html.style.overscrollBehavior = before.overscroll;
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    };
  }, [open, phone]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // The field grows with each line typed, up to its max-height, and scrolls only past that: at one
  // row a second line pushed the first out of sight.
  useLayoutEffect(() => {
    const field = input.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, [draft, tab, session.state]);

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

  // Parky jumps up from his corner as the window opens and back down as it closes. Not on the first
  // render of a closed window, which has nothing to jump from.
  const jumped = useRef(false);
  useLayoutEffect(() => {
    if (!face.current || (!open && !jumped.current)) return;
    jumped.current = true;
    const jump = parkyJump(face.current, open);
    return () => jump?.cancel();
  }, [open]);

  const suggestions = (parkPage ? opener.park : opener.site).map((key) => t(key));

  return (
    // The window's place; the window fades in it, and Parky's face, beside it rather than in it,
    // jumps without fading along.
    <div
      ref={frame}
      className={cn(
        'fixed',
        PARKY_LAYER,
        // The launcher hides while the window is open, so the window takes its corner. Parky and
        // his hat rise over its top edge; the window keeps them clear of the 48 px header, which
        // they would otherwise cover. On a phone it fills what the browser shows from 5.5rem below
        // its top to just above the keyboard (`--assistant-viewport*`, `useSheetViewport`), which
        // covers the home indicator, so the safe-area gap is not added on top of it; on a desktop
        // its height is capped.
        'inset-x-2 bottom-[calc(var(--assistant-viewport-lift,0px)+max(0.5rem,env(safe-area-inset-bottom)-var(--assistant-viewport-lift,0px)))] h-[calc(var(--assistant-viewport,100svh)-5.5rem-max(0.5rem,env(safe-area-inset-bottom)-var(--assistant-viewport-lift,0px)))] sm:h-[min(clamp(560px,72dvh,720px),calc(100dvh-10rem))]',
        // Clear of the planner's edge tab, which sits on the right edge at mid height.
        'sm:inset-x-auto sm:right-12 sm:bottom-4 sm:w-[clamp(380px,32vw,480px)]',
        'planner-wide:right-[calc(var(--planner-inset,0px)+3rem)]',
        !open && 'pointer-events-none'
      )}
    >
      <section
        role="dialog"
        aria-modal="false"
        aria-label={t('title')}
        aria-hidden={!open}
        inert={!open}
        className={cn(
          // Not `overflow-hidden`: Parky's face sits half outside the window's top edge.
          // A frame in the theme's blue, so the window reads as Parky's over any page.
          'bg-background/90 border-primary/60 ring-primary/15 absolute inset-0 flex flex-col rounded-2xl border-2 shadow-2xl ring-4 backdrop-blur-xl',
          'origin-bottom-right transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-3 scale-95 opacity-0'
        )}
      >
        <header className="border-border/60 from-primary/15 to-status-operating/10 relative flex touch-none items-center gap-3 rounded-t-2xl border-b bg-gradient-to-r py-1 pr-2 pl-[4.75rem] sm:py-2 sm:pr-3 sm:pl-24">
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

        {session.state === 'ready' && tab === 'chat' && <AssistantInterviewBar />}

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
                            <span key={`${chip}-${index}`} className={ASSISTANT_DONE_CHIP_CLASS}>
                              <Icon className="size-3" />
                              {t(key)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {message.receipts && message.receipts.length > 0 && (
                      <AssistantReceipts
                        receipts={message.receipts}
                        onUndo={(receipt) => void undo(message.id, receipt)}
                        // In an interview on a phone the window stays; this is the look behind it.
                        onShow={interview && phone ? onClose : undefined}
                      />
                    )}
                    {message.failures && message.failures.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5 pl-1" role="alert">
                        {message.failures.map((failure, index) => (
                          <span
                            key={`failure-${index}`}
                            className="bg-destructive/15 text-destructive inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          >
                            <CircleAlert className="size-3" />
                            {pushErrorMessage(failure)}
                          </span>
                        ))}
                      </div>
                    )}
                    {message.alerts?.map((prompt) => (
                      <AssistantAlertAsk
                        key={prompt.id}
                        prompt={prompt}
                        onSettle={(next) => chat.settleAlert(message.id, next)}
                      />
                    ))}
                    {message.asksLocation && (
                      <AssistantLocationAsk
                        onShare={(position) =>
                          chat.shareLocation(message.id, t('locationShared'), position)
                        }
                      />
                    )}
                    {message === last && message.replies && message.replies.length > 0 && (
                      <div className="mt-2">
                        <AssistantReplies
                          replies={message.replies}
                          disabled={chat.phase !== 'idle'}
                          onPick={(reply) => void chat.send(reply, 'chip')}
                        />
                      </div>
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
            {chat.pausedUntil !== null ? (
              <p
                className="border-border/60 text-muted-foreground border-t px-3 py-4 text-center text-sm"
                role="status"
                data-assistant-paused=""
              >
                {t('paused')}
              </p>
            ) : (
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
                  {t('disclaimer')}{' '}
                  {/* On a phone the window covers the page, so it closes for the policy to be read. */}
                  <NextLink
                    href={localizedPath('/datenschutz#parky', locale)}
                    onClick={phone ? onClose : undefined}
                    className="decoration-muted-foreground/40 hover:text-foreground underline underline-offset-2"
                  >
                    {t('privacy')}
                  </NextLink>
                </p>
              </form>
            )}
          </>
        )}
      </section>
      {/* On a desktop Parky floats large over the window's top edge, where it is seen. On a
          phone it keeps clear enough of the screen's edge for the loop to fit beside it. The
          offsets count the window's 2 px frame, which the header sits inside. */}
      <div
        ref={face}
        className={cn(
          'absolute top-[calc(2px-1.75rem)] left-[calc(0.5rem+2px)] size-16 sm:top-[calc(2px-2.75rem)] sm:left-[calc(0.25rem+2px)] sm:size-20',
          !open && 'opacity-0'
        )}
      >
        <ParkyLogo
          className="size-full drop-shadow-[0_8px_16px_rgb(0_0_0/0.35)]"
          // The closed window stays mounted; only an open one keeps Parky's idle life going, and a
          // calm one, so it does not pull the eye from the conversation.
          idle={open}
          calm
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
      </div>
    </div>
  );
}
