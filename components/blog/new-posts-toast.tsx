'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { ArrowRight, Newspaper, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { LatestPost, LatestPostsLabels } from '@/lib/blog/new-posts';
import { trackBlogToastOpened } from '@/lib/analytics/umami';

/** Long enough to read a title twice; paused while a pointer, a finger or focus is on it. */
const AUTO_DISMISS_MS = 12_000;
/** How far a swipe has to travel (or how fast) before it counts as "away". */
const SWIPE_DISTANCE = 64;
const SWIPE_VELOCITY = 500;

interface NewPostsToastProps {
  labels: LatestPostsLabels;
  /** Newest first; the first one is the one the toast is about. */
  posts: LatestPost[];
  onDone: () => void;
}

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
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (Math.abs(days) < 7) return rtf.format(days, 'day');
    if (Math.abs(days) < 35) return rtf.format(Math.round(days / 7), 'week');
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
      new Date(Date.UTC(y, m - 1, d))
    );
  } catch {
    return date;
  }
}

/**
 * The "new on the blog" toast. Loaded on demand by `NewPostsWatcher`, which also decides whether
 * there is anything to say — this file only draws it.
 *
 * Phones: a sheet-like card along the bottom edge, clear of the home indicator, swiped down to
 * dismiss. From `sm`: a card in the bottom-left corner, swiped left. The bottom-right corner is
 * taken by the location banner and the planner's edge tab sits on the right edge, so the left
 * side is the one nothing else claims.
 */
export function NewPostsToast({ labels, posts, onDone }: NewPostsToastProps) {
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [lift, setLift] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const countdown = useRef<Animation | null>(null);
  /** A swipe that ends over the link must not also open it. */
  const dragged = useRef(false);
  const paused = hovered || focused || tabHidden;

  const [lead, ...rest] = posts;
  const more = rest.length;

  const close = useCallback(() => setOpen(false), []);

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

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const offset = isPhone ? info.offset.y : -info.offset.x;
    const velocity = isPhone ? info.velocity.y : -info.velocity.x;
    // Below the threshold the zero constraints spring the card back on their own.
    if (offset > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY) close();
  };

  const moreLabel =
    more > 0
      ? (more === 1 ? labels.moreOne : labels.moreOther).replace('{count}', String(more))
      : '';

  const hidden = reduceMotion
    ? { opacity: 0 }
    : isPhone
      ? { opacity: 0, y: 96, scale: 0.96 }
      : { opacity: 0, x: -48, y: 12, scale: 0.96 };

  return (
    <AnimatePresence onExitComplete={onDone}>
      {open && (
        <motion.section
          key="new-posts-toast"
          aria-label={labels.eyebrow}
          role="status"
          aria-live="polite"
          data-nosnippet
          data-noindex
          initial={hidden}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={hidden}
          transition={
            reduceMotion ? { duration: 0.2 } : { type: 'spring', stiffness: 380, damping: 32 }
          }
          style={{ bottom: isPhone ? lift : 0 }}
          className={cn(
            'fixed inset-x-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            'sm:inset-x-auto sm:left-4 sm:w-[25rem] sm:px-0 sm:pb-4'
          )}
        >
          <motion.div
            drag={isPhone ? 'y' : 'x'}
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={isPhone ? { top: 0.05, bottom: 0.9 } : { left: 0.9, right: 0.05 }}
            onPointerDown={() => {
              dragged.current = false;
            }}
            onDragStart={() => {
              dragged.current = true;
            }}
            onDragEnd={onDragEnd}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                setFocused(false);
            }}
            className="relative"
          >
            {/* The stack behind the card: one sheet per further new post, up to two. It says
                "there is more than this one" before a word of it is read. */}
            {more > 0 && (
              <div
                aria-hidden
                className="border-border/60 bg-card/90 absolute inset-x-4 -top-2 h-6 rounded-t-2xl border border-b-0 backdrop-blur-md"
              />
            )}
            {more > 1 && (
              <div
                aria-hidden
                className="border-border/50 bg-card/75 absolute inset-x-8 -top-4 h-6 rounded-t-2xl border border-b-0 backdrop-blur-md"
              />
            )}

            <div
              className={cn(
                'relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl',
                // Near-opaque on purpose: page text under a toast has to be gone, not blurred, and a
                // backdrop-filter under framer-motion's opacity entrance cannot be relied on.
                'border-primary/25 bg-card/[0.97] ring-1 ring-black/5 dark:ring-white/5',
                'shadow-primary/10 group/link cursor-pointer'
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
                <span className="relative flex h-2 w-2">
                  {!reduceMotion && (
                    <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
                  )}
                  <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
                </span>
                <span className="text-primary text-[11px] font-semibold tracking-wide uppercase">
                  {labels.eyebrow}
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
                href={`/blog/${lead.slug}`}
                prefetch={false}
                onClick={(event) => {
                  if (dragged.current) {
                    event.preventDefault();
                    return;
                  }
                  trackBlogToastOpened();
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
                      className={cn(
                        'object-cover transition-transform duration-700',
                        !reduceMotion && 'group-hover/link:scale-110'
                      )}
                    />
                  ) : (
                    <span className="text-primary flex h-full w-full items-center justify-center">
                      <Newspaper className="h-6 w-6" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-foreground group-hover/link:text-primary line-clamp-2 text-sm leading-snug font-semibold text-pretty transition-colors">
                    {lead.title}
                  </span>
                  <span className="text-muted-foreground mt-1 block truncate text-xs">
                    {lead.category ? `${lead.category} · ` : ''}
                    {relativeDay(lead.date, locale)}
                  </span>
                </span>
                <span className="sr-only">{labels.read}</span>
              </Link>

              {more > 0 && (
                // Click-through: a tap on the count text still opens the post; only the link below stops it.
                <div className="border-border/50 pointer-events-none relative flex items-center justify-between gap-3 border-t px-4 py-2">
                  <span className="text-muted-foreground text-xs">{moreLabel}</span>
                  <Link
                    href="/blog"
                    prefetch={false}
                    onClick={(event) => {
                      if (dragged.current) event.preventDefault();
                      else close();
                    }}
                    draggable={false}
                    className="text-primary hover:text-primary/80 pointer-events-auto relative z-10 inline-flex min-h-8 items-center gap-1 text-xs font-semibold transition-colors"
                  >
                    {labels.allPosts}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* The countdown, as a line that drains. Stops while somebody is reading. */}
              <div
                ref={barRef}
                aria-hidden
                className="from-primary to-primary/40 pointer-events-none absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-to-r"
              />
            </div>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
