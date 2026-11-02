import { Skeleton } from '@/components/ui/skeleton';
import { LiveDot } from '@/components/common/live-dot';
import { cn } from '@/lib/utils';

/**
 * Glass pill with a live dot: "N parks open right now". `label` is the finished sentence, `null`
 * while the count is pending. The shell renders either way and only its content swaps, since a
 * skeleton replaced by a badge shifts even at identical heights. `self-start w-fit`, or a flex
 * column would stretch it. Drawn in the hero's text column below xl and in the world-map panel's
 * header from xl, so the two cannot drift apart.
 */
export function OpenParksBadge({ label, className }: { label: string | null; className?: string }) {
  const pending = label == null;
  return (
    <span
      className={cn(
        'inline-flex h-[30px] w-fit shrink-0 items-center gap-2 self-start rounded-full border px-3.5 text-[11px] font-bold tracking-[0.14em] uppercase shadow-sm',
        pending
          ? 'border-border/50 bg-background/50'
          : 'border-status-operating/40 bg-status-operating/10 text-status-operating',
        className
      )}
      aria-busy={pending || undefined}
    >
      {pending ? (
        <Skeleton className="h-2.5 w-36" />
      ) : (
        <>
          <LiveDot color="bg-status-operating" pingColor="bg-status-operating opacity-60" />
          {label}
        </>
      )}
    </span>
  );
}
