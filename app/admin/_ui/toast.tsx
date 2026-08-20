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
import { AlertTriangle, CheckCircle2, Info, Loader2, X, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Toasts, written here rather than pulled in.
 *
 * `sonner` is not in this project's lockfile and is not worth adding for the
 * one behaviour the admin actually needs beyond a styled box: an **undo**
 * action attached to the message. Curation writes are reversible by design —
 * every one returns the id of its audit entry, and the API can put it back —
 * so the moment right after a save is the moment that affordance belongs, and
 * a toast that cannot carry a button would have pushed it into a menu nobody
 * opens.
 *
 * Deliberately not a portal: the admin shell already owns the whole viewport
 * and stacks nothing above `z-[80]`, so a fixed container inside it lands in
 * the same place with one fewer moving part.
 */

export type ToastTone = 'success' | 'error' | 'info' | 'pending';

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds. `null` keeps it until dismissed — used for `pending`. */
  duration?: number | null;
  action?: ToastAction;
}

interface Toast extends ToastInput {
  id: number;
}

interface ToastContextValue {
  push: (toast: ToastInput) => number;
  update: (id: number, toast: Partial<ToastInput>) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastHost>');
  return context;
}

const DEFAULT_DURATION: Record<ToastTone, number | null> = {
  success: 4000,
  info: 5000,
  // Errors stay until dismissed. An error that scrolls away before it is read
  // is an error that gets reported as "it just didn't save".
  error: null,
  pending: null,
};

let nextId = 1;

export function ToastHost({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number, duration: number | null | undefined, tone: ToastTone) => {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      const ms = duration === undefined ? DEFAULT_DURATION[tone] : duration;
      if (ms === null) return;
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), ms)
      );
    },
    [dismiss]
  );

  const push = useCallback(
    (input: ToastInput) => {
      const id = nextId++;
      const tone = input.tone ?? 'info';
      setToasts((current) => [...current, { ...input, tone, id }].slice(-4));
      schedule(id, input.duration, tone);
      return id;
    },
    [schedule]
  );

  const update = useCallback(
    (id: number, patch: Partial<ToastInput>) => {
      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, ...patch } : toast))
      );
      if (patch.tone || patch.duration !== undefined) {
        schedule(id, patch.duration, patch.tone ?? 'info');
      }
    },
    [schedule]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ push, update, dismiss }), [push, update, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        // Polite, not assertive: a save confirmation should not interrupt a
        // screen reader mid-sentence. Errors are announced by the same region
        // because splitting them into two live regions makes their order
        // unpredictable.
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onDismiss={() => dismiss(toast.id)}
            // A failed action turns its own toast into the error report, in
            // place: same position, the message where the button was, and no
            // auto-dismiss because `error` has no default duration.
            onActionError={(message) =>
              update(toast.id, {
                tone: 'error',
                description: message,
                action: undefined,
              })
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const TONE_STYLES: Record<ToastTone, { ring: string; icon: ReactNode }> = {
  success: {
    ring: 'border-emerald-500/30 bg-emerald-500/[0.07]',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  },
  error: {
    ring: 'border-destructive/40 bg-destructive/[0.08]',
    icon: <AlertTriangle className="text-destructive h-4 w-4" />,
  },
  info: {
    ring: 'border-border/60 bg-card',
    icon: <Info className="text-muted-foreground h-4 w-4" />,
  },
  pending: {
    ring: 'border-border/60 bg-card',
    icon: <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />,
  },
};

function ToastCard({
  toast,
  onDismiss,
  onActionError,
}: {
  toast: Toast;
  onDismiss: () => void;
  onActionError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const tone = TONE_STYLES[toast.tone ?? 'info'];

  async function runAction() {
    if (!toast.action || busy) return;
    setBusy(true);
    try {
      await toast.action.onClick();
      onDismiss();
    } catch (error) {
      // The undo in a save toast fails for reasons the person needs to hear:
      // the change was already undone, something else has changed the field
      // since, the session expired. Without this the promise rejected into
      // nothing, the spinner blinked, and the toast then auto-dismissed as
      // though the undo had worked.
      onActionError(error instanceof Error ? error.message : 'Aktion fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg backdrop-blur-md',
        'animate-in slide-in-from-bottom-2 fade-in duration-200',
        tone.ring
      )}
    >
      <span className="mt-0.5 shrink-0">{tone.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-tight font-medium">{toast.title}</p>
        {toast.description && (
          <p className="text-muted-foreground mt-1 text-xs leading-snug break-words">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={runAction}
            disabled={busy}
            className="text-primary hover:text-primary/80 mt-2 inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />}
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Schließen"
        className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 shrink-0 rounded p-1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
