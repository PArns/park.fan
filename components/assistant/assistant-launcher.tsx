'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assistantGate } from '@/lib/assistant/config';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';
import dynamic from 'next/dynamic';
import { ParkyLogo, type ParkyCue } from './parky-logo';
import { PARKY_LAYER } from './parky-layer';
import { trackSiteEvent, type AssistantOpenSource } from '@/lib/analytics/site-analytics';
import { stopTeasers } from '@/lib/assistant/teaser-store';
import { ENTRANCE_MS, pageEntrance, type ParkyEntrance } from '@/lib/assistant/entrance';
import { parkySwitch } from '@/lib/assistant/easter-eggs';
import { isRide } from '@/lib/assistant/parky-rides';
import { isReactionAct } from '@/lib/assistant/reactions';
import { onParkyOpen, takeReopen } from '@/lib/assistant/open';
import { usePageLocked } from '@/lib/hooks/use-page-locked';
import { useSearchOpen } from '@/lib/analytics/search-presence';
import { PARKY_FALL_MS, useScrollFling } from '@/lib/assistant/use-scroll-fling';
import type { ParkyFling } from '@/lib/assistant/fling-tracker';
import { PARKY_CORNER_ATTR, parkyDockHop, parkyJumpMs } from '@/lib/assistant/parky-jump';
import { parkyDock, parkyInDock } from '@/lib/assistant/parky-dock';

// Must stay in step with this file's entry in `LAZY_MESSAGE_BOUNDARIES`
// (`lib/i18n/route-namespaces.mjs`).
// The others are the site's badges and weather labels on the cards Parky shows. They add nothing
// to the download: the one lazy chunk already carries all of `parks` and `attractions`.
/** How long after the page Parky's button shows; a slot on the page has answered by then. */
const SHOW_DELAY_MS = 150;

const ASSISTANT_NAMESPACES = [
  'assistant',
  'parks.status',
  'parks.crowdLevels',
  'parks.seasonal',
  'parks.weather',
  'parks.worksPeriod',
  'attractions.meta',
  'attractions.ropeDrop',
] as const;

// Loaded apart, like the window: its lines would otherwise put `assistant` into every page's chrome.
const AssistantTeaser = dynamic(
  () => import('./assistant-teaser').then((mod) => mod.AssistantTeaser),
  { ssr: false }
);

/** An act asked for by `?parky=` waits for the longest entrance to end. */
const ASKED_ACT_AFTER_MS = 2_600;

const loadPanel = () => import('./assistant-panel').then((mod) => mod.AssistantPanel);
type PanelComponent = Awaited<ReturnType<typeof loadPanel>>;

/** What an entrance strews about: speed lines behind a scurry, dust on landing, sparkles. */
function EntranceEffects({ entrance }: { entrance: ParkyEntrance }) {
  if (entrance === 'scurry') {
    return (
      <span aria-hidden="true" className="parky-trail">
        <span />
        <span />
        <span />
      </span>
    );
  }
  if (entrance === 'drop') {
    return (
      <>
        <span aria-hidden="true" className="parky-dust parky-dust-left" />
        <span aria-hidden="true" className="parky-dust parky-dust-right" />
      </>
    );
  }
  if (entrance === 'pop') {
    return (
      <span aria-hidden="true" className="parky-sparkles">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
    );
  }
  return null;
}

/** The last path `assistant_shown` counted, so a closed and reopened window counts no second view. */
let countedPath: string | null = null;

/**
 * Counts the button as seen, once per page view; the first carries the entrance it made. A leaf of
 * its own, so following the path re-renders nothing else.
 */
function ShownCounter({ entrance }: { entrance: ParkyEntrance | null }) {
  const pathname = usePathname();
  useEffect(() => {
    if (countedPath === pathname) return;
    const first = countedPath === null;
    countedPath = pathname;
    trackSiteEvent('assistant_shown', { entrance: first ? (entrance ?? 'none') : 'none' });
  }, [pathname, entrance]);
  return null;
}

/**
 * The round button; its label comes from the layout's `navigation` namespace. With an `entrance`
 * it arrives that way (`app/parky.css`, `.parky-enter-*`); a `cue` makes Parky act at once.
 */
function LauncherButton({
  open,
  onToggle,
  entrance,
  cue,
  away,
  fling,
  hopping,
  onLanded,
}: {
  open: boolean;
  onToggle: () => void;
  /** Parky is up in the chat window or on his way back: the button keeps its place, unseen. */
  away: boolean;
  entrance: ParkyEntrance | null;
  cue: ParkyCue | null;
  /** A fast scroll moving Parky: carried up or pressed flat. */
  fling: ParkyFling | null;
  /** Parky is hopping between his corner and the page's slot: the glow waits in the corner. */
  hopping: boolean;
  /** Parky has dropped back from a fast scroll and hit the corner. */
  onLanded: () => void;
}) {
  // `navigation`, which the layout ships anyway: a key of `assistant` read in this file would put
  // the whole namespace into every page's chrome (docs/rules/translations-are-routed-not-bundled.md).
  const t = useTranslations('navigation');
  // A button that came in with an entrance has arrived; it must not fade in a second time after.
  // Set on the entrance's first render, not the mount: the button mounts unseen before it has one.
  const [entered, setEntered] = useState(entrance !== null);
  if (entrance && !entered) setEntered(true);
  // A modal dialog has the screen (the planner's wizard, an alert): Parky ducks below the edge
  // rather than sit on its buttons, and comes back up once it closes. Not for the search palette,
  // where it searches along. `translate`, not `transform`, which an entrance's fill still holds.
  const locked = usePageLocked();
  const searching = useSearchOpen();
  // Whether the lock began with the search: the palette lets go of the page only once its close
  // animation has run, after it said it is shut, and Parky would duck for that moment.
  const [lockedBySearch, setLockedBySearch] = useState(false);
  const [wasLocked, setWasLocked] = useState(locked);
  if (wasLocked !== locked) {
    setWasLocked(locked);
    setLockedBySearch(locked && searching);
  }
  const dodging = locked && !searching && !lockedBySearch;
  const hanging = fling === 'down';
  const hung = useRef(false);
  useEffect(() => {
    if (hanging) {
      hung.current = true;
      return;
    }
    if (!hung.current) return;
    hung.current = false;
    const timer = setTimeout(onLanded, PARKY_FALL_MS);
    return () => clearTimeout(timer);
  }, [hanging, onLanded]);
  return (
    <button
      type="button"
      onClick={onToggle}
      style={
        entrance
          ? ({ '--parky-enter': `${ENTRANCE_MS[entrance]}ms` } as React.CSSProperties)
          : undefined
      }
      aria-expanded={open}
      inert={dodging || away}
      aria-label={open ? t('assistantClose') : t('assistantOpen')}
      title={open ? undefined : t('assistantOpen')}
      className={cn(
        'group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] grid size-14 cursor-pointer place-items-center rounded-full sm:size-16',
        PARKY_LAYER,
        'planner-wide:right-[calc(var(--planner-inset,0px)+1rem)]',
        entrance ? `parky-enter-${entrance}` : !entered && 'animate-in fade-in zoom-in-90',
        'transition-transform duration-300 hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none',
        dodging && 'pointer-events-none translate-y-[calc(100%+2.5rem)]',
        away && 'invisible',
        'focus-visible:ring-primary focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        open && 'from-primary to-status-operating bg-gradient-to-br text-white shadow-xl'
      )}
    >
      {open ? (
        <X className="size-6" />
      ) : (
        // Carried up by a fast scroll, dropped back once it stops: the glow and the trail go along.
        <span
          data-fling={fling ?? undefined}
          style={{ '--parky-fall': `${PARKY_FALL_MS}ms` } as React.CSSProperties}
          className="parky-hang absolute inset-0 grid place-items-center"
        >
          {/* A soft glow of the brand colours behind the bubble, stronger on hover. */}
          <span
            aria-hidden="true"
            className={cn(
              'from-primary/40 to-status-operating/40 absolute inset-1 rounded-full bg-gradient-to-br opacity-70 blur-lg transition-opacity group-hover:opacity-100',
              hopping && 'opacity-0 transition-none group-hover:opacity-0'
            )}
          />
          {entrance && <EntranceEffects entrance={entrance} />}
          <span aria-hidden="true" className="parky-drop">
            <span />
            <span />
            <span />
          </span>
          {/* The bob moves this wrapper, not the drawing: Safari clips an SVG that is animated and
              has a filter to its own box, and the hat and the rides reach beyond it. */}
          <span
            {...{ [PARKY_CORNER_ATTR]: '' }}
            className="parky-bob relative grid size-14 sm:size-16"
          >
            <span className="parky-shake grid size-full">
              <ParkyLogo
                idle
                mood={fling === 'down' ? 'scared' : fling === 'up' ? 'squashed' : null}
                cue={cue}
                className="size-full drop-shadow-[0_6px_14px_rgb(0_0_0/0.35)]"
              />
            </span>
          </span>
        </span>
      )}
    </button>
  );
}

/**
 * Parky, bottom right: only the round icon until it is pressed, then a small chat window above it.
 * Nothing is drawn until the rollout gate says this browser sees Parky; the strings are fetched
 * then and the window's code on the first press, so a visitor outside the rollout pays nothing.
 */
export function AssistantLauncher() {
  const visible = useSyncExternalStore(
    assistantGate.subscribe,
    assistantGate.getSnapshot,
    assistantGate.getServerSnapshot
  );
  const [open, setOpen] = useState(false);
  const messages = useLazyMessages(ASSISTANT_NAMESPACES, visible);
  const [Panel, setPanel] = useState<PanelComponent | null>(null);
  const [arrived, setArrived] = useState(false);
  const [openedBy, setOpenedBy] = useState<AssistantOpenSource>('button');
  const [cue, setCue] = useState<ParkyCue | null>(null);

  useEffect(() => {
    if (!open || Panel) return;
    let live = true;
    loadPanel().then(
      (component) => {
        if (live) setPanel(() => component);
      },
      () => {
        // The button stays; the next press asks again.
        if (live) setOpen(false);
      }
    );
    return () => {
      live = false;
    };
  }, [open, Panel]);

  /**
   * The room Parky's button takes in the corner, for the location banner to sit above it. A
   * property on the document, like `--planner-inset`, so the banner reads it without a render.
   */
  const ready = visible && messages.ready;
  // Parky's slot on the page (the homepage hero's on a desktop), read here rather than below so
  // the button can wait for it.
  const docked = useSyncExternalStore(
    parkyDock.subscribe,
    parkyDock.getSnapshot,
    parkyDock.getServerSnapshot
  );
  // A beat after the page, or at once once a slot has said it is on screen: he shows where he
  // belongs instead of entering in the corner and hopping up from there.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setSettled(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready]);
  const shown = ready && (settled || docked);
  useEffect(() => {
    if (!shown) return;
    const root = document.documentElement;
    root.style.setProperty('--assistant-inset', '4.5rem');
    return () => {
      root.style.removeProperty('--assistant-inset');
    };
  }, [shown]);

  // Parky stands in a slot on the page while it is on screen (the homepage hero on a desktop,
  // `parkyDock`), and only in his corner otherwise. Already in the slot when the button first
  // shows, he makes no entrance: he never came in through the corner.
  const [skipEntrance, setSkipEntrance] = useState(false);
  if (docked && !skipEntrance && !arrived) setSkipEntrance(true);

  // Only in the browser once the button shows: `shown` is false on the server and while hydrating.
  const entrance = shown && !skipEntrance && !docked ? pageEntrance() : null;
  const entering = entrance !== null && !arrived;
  // Landed once the entrance has run its length. A timer, because `animationend` never reached
  // React's handler on the home page.
  useEffect(() => {
    if (!entering || !entrance) return;
    const timer = setTimeout(() => setArrived(true), ENTRANCE_MS[entrance]);
    return () => clearTimeout(timer);
  }, [entering, entrance]);

  // Back from the window, Parky lands in his corner before the button shows again.
  const [landing, setLanding] = useState(false);
  // Whether Parky has moved since the page loaded: once he has, he arrives in the slot by a hop or
  // a jump, handed over in one frame, and never fades in there again.
  const moved = useRef(false);
  const close = useCallback(() => {
    moved.current = true;
    setOpen(false);
    setLanding(true);
  }, []);
  useEffect(() => {
    if (!landing) return;
    const timer = setTimeout(() => setLanding(false), parkyJumpMs());
    return () => clearTimeout(timer);
  }, [landing]);
  const away = open || landing;

  // When the slot comes on screen or leaves it, Parky hops between it and his corner: the corner's
  // drawing flies, so it shows for the hop, then hides while he stands in the slot. Not while he is
  // up in the window or on his way: from there he lands wherever he belongs (`parkyJump`).
  const [prevDocked, setPrevDocked] = useState(docked);
  const [hop, setHop] = useState<'toSlot' | 'toCorner' | null>(null);
  if (prevDocked !== docked) {
    setPrevDocked(docked);
    // Not up from the corner while he is still making his entrance there: then the slot was
    // simply slow to say it is on screen, and he only belongs there.
    setHop(shown && !away && !(docked && entering) ? (docked ? 'toSlot' : 'toCorner') : null);
  }
  // Layout effects, both: the hop's first frame and the slot giving Parky up land in the same paint
  // as the button showing, and at the end the button hiding, the hop letting go and the slot
  // drawing him do too. Anything later shows him twice or not at all for a frame.
  useLayoutEffect(() => {
    if (!hop) return;
    moved.current = true;
    const corner = document.querySelector<HTMLElement>(`[${PARKY_CORNER_ATTR}]`);
    const slot = hop === 'toSlot' ? parkyDock.element() : parkyDock.lastElement();
    const done = () => setHop(null);
    const stop = corner && slot ? parkyDockHop(corner, slot, hop === 'toSlot', done) : null;
    // No hop to play (reduced motion, nothing measured): he is simply where he belongs.
    if (!stop) {
      const timer = setTimeout(done, 0);
      return () => clearTimeout(timer);
    }
    return stop;
  }, [hop]);
  const inSlot = docked && hop === null;
  useLayoutEffect(() => {
    parkyInDock.set(shown && inSlot && !away ? (moved.current ? 'landed' : 'appeared') : null);
    return () => parkyInDock.set(null);
  }, [shown, inSlot, away]);

  // Not while a dialog has Parky ducked below the edge (the search palette aside), nor while away
  // or standing in the slot.
  const locked = usePageLocked();
  const searching = useSearchOpen();
  const fling = useScrollFling(!away && !docked && !(locked && !searching));
  /** Opening Parky once ends the teaser lines for the session, and any entrance under way. */
  const openFrom = useCallback((source: AssistantOpenSource) => {
    stopTeasers();
    setArrived(true);
    setOpenedBy(source);
    setOpen(true);
  }, []);
  const openFromButton = useCallback(() => openFrom('button'), [openFrom]);
  const openFromLine = useCallback(() => openFrom('line'), [openFrom]);
  // Parky's own page and Parky in the homepage hero ask for the window from outside, each with its
  // own source; heard before the gate opens, so a press that comes first is not lost.
  useEffect(() => onParkyOpen(openFrom), [openFrom]);
  // Parky switched the site's language: the page came back in the other one, and the chat with it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- session storage, read once the button shows
    if (shown && takeReopen()) openFrom('language');
  }, [shown, openFrom]);
  const play = useCallback(
    (act: ParkyCue['act']) => setCue((last) => ({ act, id: (last?.id ?? 0) + 1 })),
    []
  );
  // A hard landing from a fast scroll leaves him seeing stars.
  const landedDizzy = useCallback(() => play('dizzy'), [play]);
  // `?parky=<ride>` or `?parky=<reaction>` plays that act once Parky has arrived, for trying each.
  useEffect(() => {
    const asked = shown ? parkySwitch() : null;
    if (!isRide(asked) && !isReactionAct(asked)) return;
    const timer = setTimeout(() => setCue({ act: asked, id: 1 }), ASKED_ACT_AFTER_MS);
    return () => clearTimeout(timer);
  }, [shown]);
  if (!visible || !messages.ready) return null;

  const content = (
    <>
      {Panel && <Panel open={open} onClose={close} openedBy={openedBy} onAct={play} />}
      {/* Unseen while the window is open, the window's own ✕ and Escape close it, and while Parky
          stands in the page's slot. Kept mounted, so Parky's jumps have the corner to start from
          and land on. */}
      <LauncherButton
        open={false}
        onToggle={openFromButton}
        entrance={entering ? entrance : null}
        cue={cue}
        away={away || inSlot || !shown}
        fling={fling}
        hopping={hop !== null}
        onLanded={landedDizzy}
      />
      {!open && <ShownCounter entrance={entrance} />}
      {!away && !docked && (
        <AssistantTeaser
          onOpen={openFromLine}
          onAct={play}
          entering={entering}
          arrival={arrived ? entrance : null}
          fling={fling}
        />
      )}
    </>
  );
  return messages.messages ? (
    <RouteMessagesProvider messages={messages.messages} namespaces={ASSISTANT_NAMESPACES}>
      {content}
    </RouteMessagesProvider>
  ) : (
    content
  );
}
