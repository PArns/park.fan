'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { PanelRightClose, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The third column, beside the page, so the context of an edit never means scrolling away from
 * the field. A slot: a page pushes content with `useInspector().show(...)`, and the shell docks it
 * on a wide screen and shows a sheet on a narrow one.
 */

export interface InspectorContent {
  title: string;
  subtitle?: string;
  body: ReactNode;
}

interface InspectorContextValue {
  content: InspectorContent | null;
  open: boolean;
  /** `trigger` gets the focus back on close; Safari does not focus a clicked button by itself. */
  show: (content: InspectorContent, trigger?: HTMLElement | null) => void;
  close: () => void;
  toggle: () => void;
  /** Drops the content, for a page that leaves, so the topbar toggle goes with it. */
  clear: () => void;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

/**
 * Returns the inspector slot: its current content and open state, plus `show`, `close`,
 * `toggle` and `clear`. Throws outside `<InspectorProvider>`.
 */
export function useInspector(): InspectorContextValue {
  const context = useContext(InspectorContext);
  if (!context) throw new Error('useInspector must be used inside <InspectorProvider>');
  return context;
}

/** Holds the inspector's content and open state, so any admin page can fill the right column. */
export function InspectorProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<InspectorContent | null>(null);
  const [open, setOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  const show = useCallback((next: InspectorContent, trigger?: HTMLElement | null) => {
    returnFocus.current =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setContent(next);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    returnFocus.current?.focus();
  }, []);

  const clear = useCallback(() => {
    setOpen(false);
    setContent(null);
  }, []);

  const value = useMemo<InspectorContextValue>(
    () => ({
      content,
      open,
      show,
      close,
      toggle: () => setOpen((current) => !current),
      clear,
    }),
    [content, open, show, close, clear]
  );

  return <InspectorContext.Provider value={value}>{children}</InspectorContext.Provider>;
}

/**
 * Right-hand inspector column showing what a page pushed with `show()`: docked beside the page
 * from `xl`, a sheet with a scrim below it. Renders nothing while closed or empty. New content takes
 * the focus, and Escape inside the panel closes it.
 */
export function InspectorPanel() {
  const { content, open, close } = useInspector();
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && content) closeButton.current?.focus();
  }, [open, content]);
  if (!content || !open) return null;

  return (
    <>
      {/* Narrow screens: a scrim, because the panel covers the content there
          and a tap outside is the fastest way back to it. Wide screens keep the
          content usable beside the panel, so no scrim. */}
      <button
        type="button"
        aria-label="Inspektor schließen"
        onClick={close}
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] xl:hidden"
      />
      <aside
        aria-label={content.title}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close();
        }}
        className={cn(
          'border-border/60 bg-card/95 fixed inset-y-0 right-0 z-40 flex w-[min(24rem,100vw)] flex-col border-l backdrop-blur-md',
          'xl:bg-card/40 xl:sticky xl:top-0 xl:z-auto xl:h-[100dvh] xl:w-80 xl:shrink-0'
        )}
      >
        <header className="border-border/50 flex items-start gap-2 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">{content.title}</h2>
            {content.subtitle && (
              <p className="text-muted-foreground truncate text-xs">{content.subtitle}</p>
            )}
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={close}
            aria-label="Schließen"
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 rounded p-1"
          >
            <X className="h-4 w-4 xl:hidden" />
            <PanelRightClose className="hidden h-4 w-4 xl:block" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{content.body}</div>
      </aside>
    </>
  );
}
