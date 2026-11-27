'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { ArrowRight, Clock, MapPin, PenLine, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { LiveDot } from '@/components/common/live-dot';
import { BlogCoverFallback, slugFromPostPath } from '@/components/blog/blog-cover-fallback';
import {
  allPostsPathFor,
  eyebrowFor,
  fanFit,
  type LatestPost,
  type LatestPostsLabels,
} from '@/lib/blog/new-posts';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { getDateTimeFormat, getRelativeTimeFormat } from '@/lib/utils/intl-format';

/** Long enough to read a title twice; paused while a pointer, a finger or focus is on it. */
const AUTO_DISMISS_MS = 12_000;
/** How far a swipe has to travel (or how fast) before it counts as "away". */
const SWIPE_DISTANCE = 64;
/** px/s. */
const SWIPE_VELOCITY = 500;
/** How far a pointer moves before a press becomes a swipe; below it a tap stays a tap. */
const DRAG_SLOP = 6;
/** How much of the pointer's travel the card follows: freely towards the edge, barely back. */
const PULL_OUT = 0.9;
const PULL_IN = 0.05;
/** Longer than the exit transition, in case `transitionend` never fires (a hidden tab). */
const EXIT_FALLBACK_MS = 600;
const EASE_OUT = 'cubic-bezier(0.22,1,0.36,1)';
/** From `sm`, one fanned-out card (`h-16`) plus the gap above it. */
const FAN_ROW = 72;
/** Kept free under the last fanned-out card: the two peeking sheets (16 px) and a margin. */
const FAN_BOTTOM_GAP = 32;
/** The fan opens once the lead card has landed, one card after the other. */
const FAN_DELAY_MS = 350;
const FAN_STAGGER_MS = 70;
/**
 * Room kept free under the last fanned-out card for it to open into: a few lines of excerpt, the
 * meta line and the read link. Without it the bottom card would open past the window's edge.
 */
const PREVIEW_RESERVE = 112;
/** How long a pointer rests on a card before it opens, so a sweep across the stack opens nothing. */
const OPEN_INTENT_MS = 110;
/** Switching between cards is quicker: the reader is already looking. */
const SWITCH_INTENT_MS = 50;
/** Leaving the stack closes it after a beat, so crossing the gap between two cards is no leave. */
const CLOSE_DELAY_MS = 180;

/**
 * Where the card enters from and leaves to: up from the bottom edge on a phone, in from the right
 * under the header from `sm`. Spelled out twice because Tailwind only sees literal class names.
 */
const OFFSTAGE = 'opacity-0 translate-y-24 scale-96 sm:translate-x-12 sm:-translate-y-3';
const OFFSTAGE_AT_START =
  'starting:opacity-0 starting:translate-y-24 starting:scale-96 sm:starting:translate-x-12 sm:starting:-translate-y-3';
/** `prefers-reduced-motion`: the same fade, without the travel. */
const OFFSTAGE_REDUCED = 'opacity-0';
const OFFSTAGE_REDUCED_AT_START = 'starting:opacity-0';

interface SwipeState {
  pointerId: number;
  start: number;
  last: number;
  lastAt: number;
  /** px/s along the swipe axis, from the last two samples. */
  velocity: number;
  active: boolean;
}

interface NewPostsToastProps {
  labels: LatestPostsLabels;
  /** Newest first; the first one is the one the toast is about. */
  posts: LatestPost[];
  onDone: () => void;
}

/** From `sm`: the header's 48 px bar, its 1 px border, and a 15 px gap. */
const DESKTOP_TOP = 64;

/** Below Tailwind's `sm`, the same line the classes below switch on. */
const PHONE_QUERY = '(max-width: 639.98px)';

function subscribePhone(onChange: () => void): () => void {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function isPhoneNow(): boolean {
  return window.matchMedia(PHONE_QUERY).matches;
}

/** "today", "yesterday", "3 days ago" — in the page's locale, from a `YYYY-MM-DD` day. */
function relativeDay(date: string, locale: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000);
  try {
    const rtf = getRelativeTimeFormat(locale, { numeric: 'auto' });
    if (Math.abs(days) < 7) return rtf.format(days, 'day');
    if (Math.abs(days) < 35) return rtf.format(Math.round(days / 7), 'week');
    return getDateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
      new Date(Date.UTC(y, m - 1, d))
    );
  } catch {
    return date;
  }
}

/**
 * The "new on the blog" toast, headed by the kind of post it leads with (news, guide or any other).
 * Loaded on demand by `NewPostsWatcher`, which also decides whether there is anything to say —
 * this file only draws it.
 *
 * Phones: a sheet-like card along the bottom edge, clear of the home indicator, swiped down to
 * dismiss. From `sm`: a card in the top-right corner under the header, swiped right. It sits on
 * `z-40`, under the header's `z-50`, so a menu band opened from the bar covers it rather than the
 * other way round.
 */
export function NewPostsToast({ labels, posts, onDone }: NewPostsToastProps) {
  const locale = useLocale();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [lift, setLift] = useState(0);
  const [top, setTop] = useState(DESKTOP_TOP);
  const barRef = useRef<HTMLDivElement>(null);
  const countdown = useRef<Animation | null>(null);
  /** A swipe that ends over the link must not also open it. */
  const dragged = useRef(false);
  const swipe = useRef<SwipeState | null>(null);
  const finished = useRef(false);
  const paused = hovered || focused || tabHidden;

  const [lead, ...rest] = posts;
  const more = rest.length;
  const eyebrow = eyebrowFor(labels, lead);
  const leadRef = useRef<HTMLDivElement>(null);
  const leadPreviewRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0);
  // The card that is open: under a resting pointer, or holding keyboard focus.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const intent = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');

  const close = useCallback(() => setOpen(false), []);

  // Called once, when the exit transition ends or its fallback fires, whichever is first.
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (open) return;
    const fallback = setTimeout(finish, EXIT_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [open, finish]);

  // Phone or not decides the swipe axis and where the card enters from.
  const isPhone = useSyncExternalStore(subscribePhone, isPhoneNow, () => false);

  // On a phone the location banner owns the same bottom strip (homepage only). Stack above it
  // instead of covering its button, and drop back down when it is dismissed.
  useEffect(() => {
    if (!isPhone) return;
    const measure = () => {
      const banner = document.querySelector<HTMLElement>('[data-location-banner]');
      setLift(banner ? banner.getBoundingClientRect().height + 8 : 0);
    };
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isPhone]);

  // From `sm` the language banner (`fixed top-12`, `z-[45]`) can own the strip under the header.
  // Sit below it while it is up. `offsetTop`/`offsetHeight`, not the client rect: the banner
  // slides in with a transform, and a rect measured mid-slide would be short.
  useEffect(() => {
    if (isPhone) return;
    const measure = () => {
      const banner = document.querySelector<HTMLElement>('[data-language-banner]');
      setTop(banner ? banner.offsetTop + banner.offsetHeight + 4 : DESKTOP_TOP);
    };
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isPhone]);

  // From `sm` the further posts fan out under the lead card, as many as the window has room for;
  // the rest stay behind the count line. Measured on resize and whenever the lead card or the
  // strip it starts from moves.
  useEffect(() => {
    const card = leadRef.current;
    if (isPhone || more === 0 || !card) return;
    const measure = () => {
      // The lead card's own preview does not count: measured with it open, the fan would fold
      // away under the pointer the moment the card opens.
      const closedHeight = card.offsetHeight - (leadPreviewRef.current?.offsetHeight ?? 0);
      setFit(
        fanFit(
          window.innerHeight,
          top + closedHeight,
          more,
          FAN_ROW,
          FAN_BOTTOM_GAP + PREVIEW_RESERVE
        )
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isPhone, more, top]);

  // Escape closes it, like every other layer on the site.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  // A background tab does not count down.
  useEffect(() => {
    const sync = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  // The countdown is the bar itself: a Web Animation that can be paused where it stands and
  // resumed from there, and whose end is the dismissal. No timer to keep in step with it.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof bar.animate !== 'function') return;
    const animation = bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], {
      duration: AUTO_DISMISS_MS,
      easing: 'linear',
      fill: 'forwards',
    });
    animation.onfinish = close;
    countdown.current = animation;
    return () => animation.cancel();
  }, [close]);

  useEffect(() => {
    const animation = countdown.current;
    if (!animation || animation.playState === 'finished') return;
    if (paused) animation.pause();
    else animation.play();
  }, [paused]);

  useEffect(
    () => () => {
      if (intent.current) clearTimeout(intent.current);
    },
    []
  );

  const schedule = (next: string | null, delay: number) => {
    if (intent.current) clearTimeout(intent.current);
    intent.current = setTimeout(() => setOpenKey(next), delay);
  };

  // A mouse or a pen only: a finger has no hover, and on a phone the tap opens the post. The card
  // names itself through `data-post-key`.
  const onCardEnter = (event: React.PointerEvent<HTMLElement>) => {
    const key = event.currentTarget.dataset.postKey;
    if (!key || isPhone || !canHover || event.pointerType === 'touch') return;
    if (swipe.current?.active) return;
    schedule(key, openKey ? SWITCH_INTENT_MS : OPEN_INTENT_MS);
  };

  // Keyboard focus opens the card at once; a click's focus does not, the click is on its way out.
  const onCardFocus = (event: React.FocusEvent<HTMLElement>) => {
    const key = event.currentTarget.dataset.postKey;
    if (!key || isPhone || !event.currentTarget.matches(':focus-visible')) return;
    if (intent.current) clearTimeout(intent.current);
    setOpenKey(key);
  };

  // The swipe writes the card's transform directly, one style per pointer move, rather than
  // through state: a re-render per frame of the whole card would be the slow way to move a box.
  const along = (event: React.PointerEvent) => (isPhone ? event.clientY : event.clientX);
  const moveCard = (card: HTMLElement, offset: number, transition: string) => {
    const pulled = offset > 0 ? offset * PULL_OUT : offset * PULL_IN;
    card.style.transition = transition;
    card.style.transform =
      offset === 0 ? '' : isPhone ? `translateY(${pulled}px)` : `translateX(${pulled}px)`;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragged.current = false;
    if (event.button !== 0) return;
    const at = along(event);
    swipe.current = {
      pointerId: event.pointerId,
      start: at,
      last: at,
      lastAt: event.timeStamp,
      velocity: 0,
      active: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = swipe.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const at = along(event);
    const offset = at - state.start;
    if (!state.active) {
      if (Math.abs(offset) < DRAG_SLOP) return;
      // Captured only once it is a swipe: captured from the press, the click of a plain tap would
      // land on this element instead of the link under the finger.
      state.active = true;
      dragged.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const elapsed = event.timeStamp - state.lastAt;
    if (elapsed > 0) state.velocity = ((at - state.last) / elapsed) * 1000;
    state.last = at;
    state.lastAt = event.timeStamp;
    moveCard(event.currentTarget, offset, 'none');
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = swipe.current;
    if (!state || state.pointerId !== event.pointerId) return;
    swipe.current = null;
    if (!state.active) return;
    const offset = state.last - state.start;
    // Away: the card leaves from where the finger let go, the section's exit carries it out.
    if (offset > SWIPE_DISTANCE || state.velocity > SWIPE_VELOCITY) close();
    else moveCard(event.currentTarget, 0, `transform 300ms ${EASE_OUT}`);
  };

  const fanned = isPhone ? [] : rest.slice(0, fit);
  const hidden = more - fanned.length;
  const moreLabel =
    hidden > 0
      ? (hidden === 1 ? labels.moreOne : labels.moreOther).replace('{count}', String(hidden))
      : '';

  return (
    <section
      aria-label={eyebrow}
      role="status"
      aria-live="polite"
      data-nosnippet
      data-noindex
      onTransitionEnd={(event) => {
        if (!open && event.target === event.currentTarget && event.propertyName === 'opacity') {
          finish();
        }
      }}
      style={isPhone ? { bottom: lift } : { top }}
      className={cn(
        'fixed inset-x-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        'sm:inset-x-auto sm:right-4 sm:w-[25rem] sm:px-0 sm:pb-0',
        // Beside the open planner panel, not over it — the same inset the page is reflowed by.
        'planner-wide:right-[calc(var(--planner-inset,0px)+1rem)]',
        reduceMotion
          ? 'transition-opacity duration-200 ease-out'
          : 'transition-[opacity,translate,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        reduceMotion ? OFFSTAGE_REDUCED_AT_START : OFFSTAGE_AT_START,
        !open && 'pointer-events-none',
        !open && (reduceMotion ? OFFSTAGE_REDUCED : OFFSTAGE)
      )}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        // The browser keeps the other axis for scrolling and leaves this one to the swipe.
        style={{ touchAction: isPhone ? 'pan-x' : 'pan-y' }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => {
          setHovered(false);
          schedule(null, CLOSE_DELAY_MS);
        }}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setFocused(false);
          setOpenKey(null);
        }}
        className="relative select-none"
      >
        {/* The stack behind the card: one sheet per further post that is not on screen, up to
                two. It says "there is more than this one" before a word of it is read. It peeks
                out on the side away from the screen edge the card is anchored to: above it on a
                phone, below the last fanned-out card from `sm`. */}
        {hidden > 0 && (
          <div
            aria-hidden
            className="border-border/60 bg-card/90 absolute inset-x-4 -top-2 h-6 rounded-t-2xl border border-b-0 backdrop-blur-md sm:top-auto sm:-bottom-2 sm:rounded-t-none sm:rounded-b-2xl sm:border-t-0 sm:border-b"
          />
        )}
        {hidden > 1 && (
          <div
            aria-hidden
            className="border-border/50 bg-card/75 absolute inset-x-8 -top-4 h-6 rounded-t-2xl border border-b-0 backdrop-blur-md sm:top-auto sm:-bottom-4 sm:rounded-t-none sm:rounded-b-2xl sm:border-t-0 sm:border-b"
          />
        )}

        <div
          ref={leadRef}
          data-post-key={lead.key}
          onPointerEnter={onCardEnter}
          className={cn(
            'relative z-10 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl',
            // Near-opaque on purpose: page text under a toast has to be gone, not blurred, and a
            // backdrop-filter under the section's opacity entrance cannot be relied on.
            'border-primary/25 bg-card/[0.97] ring-1 ring-black/5 dark:ring-white/5',
            'shadow-primary/10 group/link cursor-pointer',
            stackMotion(reduceMotion),
            openKey === lead.key && openCard(reduceMotion),
            openKey !== null && openKey !== lead.key && STEPPED_BACK
          )}
        >
          {/* A soft wash of the accent colour from the corner the card came in from. */}
          <div
            aria-hidden
            className="from-primary/15 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent"
          />

          {/* The handle: on a phone this card is swiped away like a sheet. */}
          <div aria-hidden className="flex justify-center pt-2 sm:hidden">
            <span className="bg-muted-foreground/30 h-1 w-9 rounded-full" />
          </div>

          <div className="relative flex items-center gap-2 px-4 pt-2 sm:pt-3.5">
            <LiveDot color="bg-primary" showPing={false} />
            <span className="text-primary text-[11px] font-semibold tracking-wide uppercase">
              {eyebrow}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              // 24 px drawn, 44 px to a finger through the pseudo-element — the same pattern
              // (and the same reason) as the location banner's close button.
              // `z-10`: above the post link, which covers the whole card.
              className="text-muted-foreground hover:text-foreground hover:bg-muted relative z-10 -mr-1.5 ml-auto inline-flex items-center justify-center rounded-md p-1 transition-colors after:absolute after:top-1/2 after:left-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Link
            href={lead.path}
            prefetch={false}
            data-post-key={lead.key}
            onFocus={onCardFocus}
            onClick={(event) => {
              if (dragged.current) {
                event.preventDefault();
                return;
              }
              trackSiteEvent('blog_toast_opened', {});
              close();
            }}
            draggable={false}
            // The whole card is this link: the pseudo-element stretches it over the card (the
            // nearest positioned ancestor), so a tap anywhere opens the post. The close button
            // and "see all" sit above it with `z-10`. Not `relative` itself for that reason.
            className="focus-visible:after:ring-ring flex items-center gap-3 px-4 pt-2 pb-3 after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset"
          >
            <span className="bg-muted relative block aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
              {lead.image ? (
                <Image
                  src={lead.image}
                  alt=""
                  fill
                  sizes="112px"
                  draggable={false}
                  style={lead.imagePosition ? { objectPosition: lead.imagePosition } : undefined}
                  className={cn(
                    'object-cover transition-transform duration-700',
                    openKey === lead.key && !reduceMotion && 'scale-110'
                  )}
                />
              ) : (
                <BlogCoverFallback slug={slugFromPostPath(lead.path)} />
              )}
              <Sheen active={openKey === lead.key} reduceMotion={reduceMotion} />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'text-foreground text-sm leading-snug font-semibold text-pretty transition-colors',
                  openKey === lead.key ? 'text-primary line-clamp-none' : 'line-clamp-2'
                )}
              >
                {lead.title}
              </span>
              <span className="text-muted-foreground mt-1 block truncate text-xs">
                {lead.category ? `${lead.category} · ` : ''}
                {relativeDay(lead.date, locale)}
              </span>
            </span>
            <span className="sr-only">{labels.read}</span>
          </Link>

          <PostPreview
            ref={leadPreviewRef}
            post={lead}
            labels={labels}
            open={openKey === lead.key}
            reduceMotion={reduceMotion}
            className="px-4"
          />

          {/* Always drawn, so the card has the same shape whatever the count; only the count
                  line depends on there being more than one. Click-through: a tap on the count
                  text still opens the post, only the link stops it. */}
          <div className="border-border/50 pointer-events-none relative flex items-center gap-3 border-t px-4 py-2">
            {hidden > 0 && <span className="text-muted-foreground text-xs">{moreLabel}</span>}
            <Link
              href={allPostsPathFor(lead)}
              prefetch={false}
              onClick={(event) => {
                if (dragged.current) event.preventDefault();
                else close();
              }}
              draggable={false}
              className="text-primary hover:text-primary/80 pointer-events-auto relative z-10 ml-auto inline-flex min-h-8 items-center gap-1 text-xs font-semibold transition-colors"
            >
              {labels.allPosts}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* The countdown, as a line that drains. Stops while somebody is reading. */}
          <div
            ref={barRef}
            aria-hidden
            className="from-primary to-primary/40 pointer-events-none absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-to-r"
          />
        </div>

        {fanned.length > 0 && (
          <ul className="relative mt-2 flex flex-col gap-2">
            {fanned.map((post, index) => (
              <li
                key={post.key}
                // Each card slides out from under the one above it, after the lead card has landed.
                style={
                  {
                    '--fan-i': index,
                    transitionDelay: `${FAN_DELAY_MS + index * FAN_STAGGER_MS}ms`,
                  } as React.CSSProperties
                }
                className={cn(
                  'relative',
                  reduceMotion
                    ? 'transition-opacity duration-200 ease-out starting:opacity-0'
                    : 'transition-[opacity,translate,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] starting:translate-y-[calc((var(--fan-i)+1)*-100%)] starting:scale-95 starting:opacity-0'
                )}
              >
                <FanCard
                  post={post}
                  labels={labels}
                  eyebrow={eyebrowFor(labels, post)}
                  day={relativeDay(post.date, locale)}
                  open={openKey === post.key}
                  steppedBack={openKey !== null && openKey !== post.key}
                  reduceMotion={reduceMotion}
                  onEnter={onCardEnter}
                  onFocusVisible={onCardFocus}
                  onOpen={(event) => {
                    if (dragged.current) {
                      event.preventDefault();
                      return;
                    }
                    trackSiteEvent('blog_toast_opened', {});
                    close();
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** How a card in the stack moves when it opens or steps back. */
function stackMotion(reduceMotion: boolean): string {
  return reduceMotion
    ? 'transition-[opacity,border-color,box-shadow] duration-200'
    : 'transition-[opacity,scale,translate,filter,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';
}

/**
 * The open card, the lead card and a fanned-out one alike: accent border and glow, and a nudge
 * out of the stack towards the page.
 */
function openCard(reduceMotion: boolean): string {
  return cn(
    'border-primary/50 shadow-2xl shadow-primary/25 ring-primary/20',
    !reduceMotion && '-translate-x-1'
  );
}

/** Every card but the open one fades back, so the eye stays on the one being read. */
const STEPPED_BACK = 'scale-[0.98] brightness-[0.65] saturate-[0.6]';

/** Open: rows grow from nothing to their content. Closed: back, a little quicker. */
const PREVIEW_ROWS_OPEN = 'grid-rows-[1fr]';
const PREVIEW_ROWS_CLOSED = 'grid-rows-[0fr]';

interface PostPreviewProps {
  post: LatestPost;
  labels: LatestPostsLabels;
  open: boolean;
  reduceMotion: boolean;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * What an open card adds: the whole excerpt, reading time, park and author, and the read link.
 * Height through a grid row going from `0fr` to `1fr`, so it opens to its content without
 * measuring it; the lines inside rise in one after the other once there is room.
 *
 * `pointer-events-none`: the post link's pseudo-element covers the card, and the lines here sit
 * on their own layers while they move, which would otherwise catch the click.
 */
function PostPreview({ post, labels, open, reduceMotion, className, ref }: PostPreviewProps) {
  const metaItems = [
    post.readingMinutes && labels.readingTime
      ? {
          icon: Clock,
          text: labels.readingTime.replace('{minutes}', String(post.readingMinutes)),
        }
      : null,
    post.park ? { icon: MapPin, text: post.park } : null,
    post.author ? { icon: PenLine, text: post.author } : null,
  ].filter((item) => item !== null);
  if (!post.excerpt && metaItems.length === 0) return null;

  // Each line enters a beat after the one above it; on the way out they all go at once.
  const line = (index: number) => ({
    className: cn(
      reduceMotion
        ? 'transition-opacity duration-200'
        : 'transition-[opacity,translate,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
      open ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[3px]'
    ),
    style: { transitionDelay: open && !reduceMotion ? `${120 + index * 70}ms` : '0ms' },
  });

  return (
    <div
      ref={ref}
      aria-hidden={!open}
      className={cn(
        'pointer-events-none grid',
        reduceMotion
          ? ''
          : open
            ? 'transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
            : 'transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        open ? PREVIEW_ROWS_OPEN : PREVIEW_ROWS_CLOSED
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={cn('flex flex-col gap-2 pb-3', className)}>
          {post.excerpt && (
            <p
              {...line(0)}
              className={cn(
                'text-muted-foreground text-xs leading-relaxed text-pretty',
                line(0).className
              )}
            >
              {post.excerpt}
            </p>
          )}
          <div {...line(1)} className={cn('flex items-center gap-3', line(1).className)}>
            {metaItems.length > 0 && (
              <span className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                {metaItems.map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex min-w-0 items-center gap-1">
                    <Icon className="text-primary/80 h-3 w-3 shrink-0" />
                    <span className="truncate">{text}</span>
                  </span>
                ))}
              </span>
            )}
            <span className="text-primary ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold">
              {labels.read}
              <ArrowRight
                className={cn(
                  'h-3 w-3 transition-transform duration-500',
                  open && !reduceMotion && 'translate-x-0.5'
                )}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A streak of light across a cover as its card opens: once, on the way in only. */
function Sheen({ active, reduceMotion }: { active: boolean; reduceMotion: boolean }) {
  if (reduceMotion) return null;
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-y-0 -left-full w-full -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent',
        active
          ? 'translate-x-[250%] transition-transform delay-100 duration-1000 ease-out'
          : 'translate-x-0 transition-none'
      )}
    />
  );
}

interface FanCardProps {
  post: LatestPost;
  labels: LatestPostsLabels;
  eyebrow: string;
  day: string;
  open: boolean;
  /** Another card is open: this one fades back. */
  steppedBack: boolean;
  reduceMotion: boolean;
  onEnter: (event: React.PointerEvent<HTMLElement>) => void;
  onFocusVisible: (event: React.FocusEvent<HTMLElement>) => void;
  onOpen: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * One further post in the fan under the lead card: a one-line card that links to the post, and
 * opens into its preview while a pointer rests on it or it holds keyboard focus.
 */
function FanCard({
  post,
  labels,
  eyebrow,
  day,
  open,
  steppedBack,
  reduceMotion,
  onEnter,
  onFocusVisible,
  onOpen,
}: FanCardProps) {
  return (
    <Link
      href={post.path}
      prefetch={false}
      onClick={onOpen}
      draggable={false}
      data-post-key={post.key}
      onPointerEnter={onEnter}
      onFocus={onFocusVisible}
      className={cn(
        'group/fan focus-visible:ring-ring flex flex-col rounded-xl border px-4 shadow-lg backdrop-blur-xl focus-visible:ring-2 focus-visible:outline-none',
        'border-border/60 bg-card/[0.97] ring-1 ring-black/5 dark:ring-white/5',
        stackMotion(reduceMotion),
        open && openCard(reduceMotion),
        steppedBack && STEPPED_BACK
      )}
    >
      <span className="flex min-h-16 items-center gap-3 py-2.5">
        <span
          className={cn(
            'bg-muted relative block aspect-[16/10] shrink-0 overflow-hidden rounded-md',
            reduceMotion
              ? ''
              : 'transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            // Open, the cover grows to the lead card's size, so every open card looks the same.
            open ? 'h-[70px]' : 'h-11'
          )}
        >
          {post.image ? (
            <Image
              src={post.image}
              alt=""
              fill
              sizes="96px"
              draggable={false}
              style={post.imagePosition ? { objectPosition: post.imagePosition } : undefined}
              className={cn(
                'object-cover transition-transform duration-700',
                open && !reduceMotion && 'scale-110'
              )}
            />
          ) : (
            <BlogCoverFallback slug={slugFromPostPath(post.path)} />
          )}
          <Sheen active={open} reduceMotion={reduceMotion} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-muted-foreground block truncate text-[10px] font-semibold tracking-wide uppercase">
            <span className="text-primary">{eyebrow}</span> · {day}
          </span>
          <span
            className={cn(
              'text-foreground block text-sm leading-snug font-semibold transition-colors',
              open ? 'text-primary text-pretty' : 'truncate'
            )}
          >
            {post.title}
          </span>
        </span>
      </span>
      <PostPreview post={post} labels={labels} open={open} reduceMotion={reduceMotion} />
    </Link>
  );
}
