'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assistantGate } from '@/lib/assistant/config';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';
import dynamic from 'next/dynamic';
import { ParkyLogo } from './parky-logo';
import { stopTeasers } from '@/lib/assistant/teaser-store';
import { ENTRANCE_MS, sessionEntrance, type ParkyEntrance } from '@/lib/assistant/entrance';

// Must stay in step with this file's entry in `LAZY_MESSAGE_BOUNDARIES`
// (`lib/i18n/route-namespaces.mjs`).
// `parks.status` and `parks.crowdLevels` are the badges on the cards Parky shows.
const ASSISTANT_NAMESPACES = ['assistant', 'parks.status', 'parks.crowdLevels'] as const;

// Loaded apart, like the window: its lines would otherwise put `assistant` into every page's chrome.
const AssistantTeaser = dynamic(
  () => import('./assistant-teaser').then((mod) => mod.AssistantTeaser),
  { ssr: false }
);

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

/**
 * The round button; its label comes from the layout's `navigation` namespace. With an `entrance`
 * it arrives that way (`app/globals.css`, `.parky-enter-*`).
 */
function LauncherButton({
  open,
  onToggle,
  entrance,
}: {
  open: boolean;
  onToggle: () => void;
  entrance: ParkyEntrance | null;
}) {
  // `navigation`, which the layout ships anyway: a key of `assistant` read in this file would put
  // the whole namespace into every page's chrome (docs/rules/translations-are-routed-not-bundled.md).
  const t = useTranslations('navigation');
  // A button that came in with an entrance has arrived; it must not fade in a second time after.
  const [entered] = useState(entrance !== null);
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
      aria-label={open ? t('assistantClose') : t('assistantOpen')}
      title={open ? undefined : t('assistantOpen')}
      className={cn(
        'group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[45] grid size-14 place-items-center rounded-full sm:size-16',
        'planner-wide:right-[calc(var(--planner-inset,0px)+1rem)]',
        entrance ? `parky-enter-${entrance}` : !entered && 'animate-in fade-in zoom-in-90',
        'transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none',
        'focus-visible:ring-primary focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        open && 'from-primary to-status-operating bg-gradient-to-br text-white shadow-xl'
      )}
    >
      {open ? (
        <X className="size-6" />
      ) : (
        <>
          {/* A soft glow of the brand colours behind the bubble, stronger on hover. */}
          <span
            aria-hidden="true"
            className="from-primary/40 to-status-operating/40 absolute inset-1 rounded-full bg-gradient-to-br opacity-70 blur-lg transition-opacity group-hover:opacity-100"
          />
          {entrance && <EntranceEffects entrance={entrance} />}
          <ParkyLogo
            idle
            className="parky-bob relative size-14 drop-shadow-[0_6px_14px_rgb(0_0_0/0.35)] sm:size-16"
          />
        </>
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
  const shown = visible && messages.ready;
  useEffect(() => {
    if (!shown) return;
    const root = document.documentElement;
    root.style.setProperty('--assistant-inset', '4.5rem');
    return () => {
      root.style.removeProperty('--assistant-inset');
    };
  }, [shown]);

  // Only in the browser once the button shows: `shown` is false on the server and while hydrating.
  const entrance = shown ? sessionEntrance() : null;
  const entering = entrance !== null && !arrived;
  // Landed once the entrance has run its length. A timer, because `animationend` never reached
  // React's handler on the home page.
  useEffect(() => {
    if (!entering || !entrance) return;
    const timer = setTimeout(() => setArrived(true), ENTRANCE_MS[entrance]);
    return () => clearTimeout(timer);
  }, [entering, entrance]);

  const close = useCallback(() => setOpen(false), []);
  /** Opening Parky once ends the teaser lines for the session, and any entrance under way. */
  const openParky = useCallback(() => {
    stopTeasers();
    setArrived(true);
    setOpen(true);
  }, []);
  if (!visible || !messages.ready) return null;

  const content = (
    <>
      {Panel && <Panel open={open} onClose={close} />}
      {/* Hidden while the window is open: the window's own ✕ and Escape close it. */}
      {!open && (
        <LauncherButton open={false} onToggle={openParky} entrance={entering ? entrance : null} />
      )}
      {!open && (
        <AssistantTeaser
          onOpen={openParky}
          entering={entering}
          arrival={arrived ? entrance : null}
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
