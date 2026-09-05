import { BrandLockup } from '@/components/layout/brand-lockup';
import { cn } from '@/lib/utils';

interface GameShellProps {
  title: string;
  tagline: string;
  step?: string;
  progress?: number;
  error?: string | null;
  errorHint?: string;
  retryLabel?: string;
  onRetry?: () => void;
  /** Server-rendered variant has no store; it paints the same box at progress 0. */
  className?: string;
}

/**
 * The loading shell: server-rendered on the first paint so `/game` shows the park.fan lockup and
 * a progress line before a single byte of Babylon arrives, and reused by the client until
 * `world:ready`. Same box, same geometry — no shift when the client takes over.
 */
export function GameShell({
  title,
  tagline,
  step,
  progress = 0,
  error,
  errorHint,
  retryLabel,
  onRetry,
  className,
}: GameShellProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[radial-gradient(80rem_50rem_at_50%_-10rem,oklch(0.25_0.06_241)_0%,oklch(0.11_0.02_241)_60%)]',
        className
      )}
      data-game-shell=""
      aria-live="polite"
    >
      <div className="pointer-events-auto w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-(--game-hud) p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <BrandLockup forceLight />
        </div>
        <h1 className="text-foreground text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{tagline}</p>
        {error ? (
          <div className="mt-5">
            <p className="text-sm font-medium text-(--game-danger)">{error}</p>
            {errorHint ? (
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{errorHint}</p>
            ) : null}
            {onRetry && retryLabel ? (
              <button
                type="button"
                onClick={onRetry}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
              >
                {retryLabel}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-(--game-accent) transition-[width] duration-300 ease-out"
                style={{ width: `${Math.round(Math.max(0.04, progress) * 100)}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-2 h-4 text-xs tabular-nums">{step ?? ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}
