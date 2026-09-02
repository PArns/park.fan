import { Skeleton } from '@/components/ui/skeleton';

/**
 * Placeholder for one `<AttractionCard>`, at the height the real card measures.
 *
 * It was a flat `min-h-[420px]` at every width and in every data state, and the real card is
 * never that tall. Measured off rendered cards (`pnpm build && pnpm start`, localhost):
 *
 *   park OPERATING, card has a bottom panel     362 px at 320 · 318 px from 360 up, desk included
 *   park CLOSED, no wait time so no bottom panel 122–180 px on a phone · 328–356 px on a desk
 *
 * So 420 over-reserved by 58 px in the best case and by ~300 in the worst, and it over-reserved in
 * ALL of them — every card that landed pulled the page up by the difference.
 *
 * **324 px is the open-park number, and that is the bet.** Two things vary and neither is known
 * when this renders: whether the ride has a live wait time (the bottom panel, ~196 px, and without
 * it the spacer takes `row-span-2` instead) and whether it has a photo (`sm:min-h-[220px]`, desk
 * only — which is why the closed case is short on a phone and tall on a desk). Betting on the open
 * park is betting on what most visitors are looking at: a park page read during opening hours, and
 * the homepage's longest/shortest-wait cards, which are rides WITH a wait time by definition.
 *
 * It is deliberately one number rather than a `sm:` split, and that is the difference from
 * `ParkCardNearbySkeleton` next door: a park card's photo row is the dominant term and splits 145
 * against 365, while an attraction card that HAS its bottom panel measures 318 on a phone and 318
 * on a desk. The breakpoint only matters in the state this does not bet on.
 *
 * **`variant` is for the one context where the card is knowably shorter.** The homepage's
 * longest/shortest-wait cards (`components/home/global-stats-section.tsx`) build their
 * `attraction` from a handful of stat fields — no land, no queue history, no trend — so they
 * settle at 197–231 px rather than 318, at BOTH widths. That is not a bet, the call site knows it,
 * so it says so, the way the nearby list passes `withPhoto={false}` where the data settles it.
 *
 * Re-measure before changing either number — `pnpm measure:cls --late`, both states, and read the
 * desktop number in the same run.
 */
export function AttractionCardSkeleton({ variant = 'full' }: { variant?: 'full' | 'stat' }) {
  return (
    <article
      className={
        variant === 'stat'
          ? 'relative isolate flex min-h-[232px] flex-col overflow-hidden rounded-[20px]'
          : 'relative isolate flex min-h-[324px] flex-col overflow-hidden rounded-[20px]'
      }
      style={{ boxShadow: 'var(--pk-card-shadow)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Favorite */}
      <div className="absolute top-3 right-3 z-[4]">
        <Skeleton className="h-[34px] w-[34px] rounded-full" />
      </div>

      {/* Top glass panel */}
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

      {/* Spacer */}
      <div className="relative z-[2] flex-1" />

      {/* Bottom glass panel */}
      <div
        className="relative z-[3] shrink-0 overflow-hidden"
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
