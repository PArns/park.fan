import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Placeholder for one `<AttractionCard>`, at the height the real card measures.
 *
 * 324 px is an open-park card with its bottom panel: whether a ride has a live wait time is not
 * known when this renders, so it bets on what most readers see. One number rather than a `sm:`
 * split, because that card is the same height at both widths. `variant="stat"` is for the
 * homepage stat cards, which carry no land, history or trend and are knowably shorter.
 * Re-measure with `pnpm measure:cls --late` before changing either number.
 * See docs/rules/a-streamed-section-owes-the-page-its-height.md.
 */
export function AttractionCardSkeleton({
  variant = 'full',
  phoneRow = false,
}: {
  variant?: 'full' | 'stat';
  /**
   * Stands in for an `AttractionCard` with `phoneRow`: below `sm` it is that card's 72 px row and
   * draws no bottom panel. From `sm` up nothing changes.
   */
  phoneRow?: boolean;
}) {
  return (
    <article
      className={cn(
        variant === 'stat'
          ? 'relative isolate flex min-h-[232px] flex-col overflow-hidden rounded-[20px]'
          : 'relative isolate flex min-h-[324px] flex-col overflow-hidden rounded-[20px]',
        phoneRow && 'max-sm:min-h-[72px] max-sm:rounded-[16px]'
      )}
      style={{ boxShadow: 'var(--pk-card-shadow)' }}
    >
      <div className="absolute inset-0 z-0">
        <Skeleton className="h-full w-full" />
      </div>

      <div className="absolute top-3 right-3 z-[4]">
        <Skeleton className="h-[34px] w-[34px] rounded-full" />
      </div>

      <div
        className="relative z-[3] shrink-0 overflow-hidden"
        style={{
          padding: '14px 52px 13px 16px',
          background: 'var(--pk-panel)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          borderBottom: '1px solid var(--pk-panel-border)',
        }}
      >
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-[9px] flex gap-[6px]">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      <div className={cn('relative z-[2] flex-1', phoneRow && 'max-sm:hidden')} />

      <div
        className={cn('relative z-[3] shrink-0 overflow-hidden', phoneRow && 'max-sm:hidden')}
        style={{
          padding: '12px 14px 13px',
          background: 'var(--pk-panel)',
          backdropFilter: 'blur(28px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
          borderTop: '1px solid var(--pk-panel-border)',
        }}
      >
        <div className="flex gap-3">
          <div className="flex flex-col gap-1" style={{ width: 88 }}>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-1 h-2.5 w-full" />
          </div>
        </div>
        <div className="mt-2 h-px w-full" style={{ background: 'var(--pk-panel-border)' }} />
        <Skeleton className="mt-2 h-3 w-2/3" />
        <Skeleton className="mt-1.5 h-3 w-1/2" />
      </div>
    </article>
  );
}
