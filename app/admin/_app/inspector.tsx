'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PanelRightClose, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The third column.
 *
 * An admin page is usually two things at once: the thing you are editing, and
 * the context you need to edit it — what upstream says, who changed this last,
 * which photo is attached, what the ride page looks like right now. Stacking
 * that below the form means scrolling away from the field you are filling in;
 * putting it in a modal means losing the form while you read it.
 *
 * So it lives beside them, and it is a slot rather than a component: any page
 * can push content into it with `useInspector().show(...)`, and the shell
 * decides how it is presented — a docked column on a wide screen, a sheet over
 * the content on a narrow one. The page does not have to know which.
 */

export interface InspectorContent {
  title: string;
  subtitle?: string;
  body: ReactNode;
}

interface InspectorContextValue {
  content: InspectorContent | null;
  open: boolean;
  show: (content: InspectorContent) => void;
  close: () => void;
  toggle: () => void;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

export function useInspector(): InspectorContextValue {
  const context = useContext(InspectorContext);
  if (!context) throw new Error('useInspector must be used inside <InspectorProvider>');
  return context;
}

export function InspectorProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<InspectorContent | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((next: InspectorContent) => {
    setContent(next);
    setOpen(true);
  }, []);

  const value = useMemo<InspectorContextValue>(
    () => ({
      content,
      open,
      show,
      close: () => setOpen(false),
      toggle: () => setOpen((current) => !current),
    }),
    [content, open, show]
  );

  return <InspectorContext.Provider value={value}>{children}</InspectorContext.Provider>;
}

export function InspectorPanel() {
  const { content, open, close } = useInspector();
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
