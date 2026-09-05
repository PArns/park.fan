'use client';

import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassSectionTitle } from '@/components/parks/glass-section-title';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';
import { HOME_NEARBY_LIMIT } from '@/lib/hooks/use-nearby-parks';
import { cn } from '@/lib/utils';

/**
 * Placeholder that mirrors the NearbyParksCard "nearby parks" layout 1:1 — heading + subtitle +
 * the same responsive card grid, including the collapse to 2 cards in a narrow column
 * (`hidden @min-[768px]/page:block`). Reusing this for the `next/dynamic` loading fallback AND
 * the component's own not-yet-mounted / loading state keeps every placeholder identical and
 * reserves the real grid height, so the swap
 * to live parks doesn't shift layout (the previous `min-h-[200px]` box under-reserved by ~1000px
 * on mobile, where 6 skeleton cards collapsed to 2 real cards).
 *
 * What it cannot mirror is the card height, and that is where the remaining gap is: the live
 * cards measure ~380 px from a German IP and ~146 px from a US one, because the height follows
 * the park's photo, wait time and status. `min-h-[340px]` sits between the two. Measure with
 * `pnpm measure:cls`, which sends a real `x-forwarded-for` — from localhost the API geolocates
 * nothing, the list comes back empty, and every placeholder here looks far too big.
 */
export function NearbyParksCardSkeleton({ className }: { className?: string }) {
  const t = useTranslations('nearby');

  return (
    // mt-8 mirrors NearbyParksCard's TOP_SPACING so the swap to the live parks list keeps the
    // same gap under the hero (no layout shift). The in-park banner is full-bleed and exempt.
    <section className={cn('mt-8', className)} aria-hidden="true">
      {/* The real heading is a frosted pill, not a bare h2: `px-4 py-2.5` around a `text-xl`
          line is 48 px, where the bare row this used to draw was 24. Rendering the real
          component is the only way that stays true when the pill's padding changes.

          And the real TEXT, not a grey bar: the title needs no data, and a `<h2>` whose only
          child was a `Skeleton` put an empty heading into the document outline — twice, since
          the streamed HTML carries the fallback and the resolved copy side by side. The
          project's own rule says a fallback renders whatever needs no data rather than a box
          shaped like it; this one was the exception nobody had noticed. The height is
          unchanged (a `text-xl` line is the 28 px the `h-7` bar reserved). */}
      <GlassSectionTitle icon={MapPin} iconClassName="text-muted-foreground">
        {t('title')}
      </GlassSectionTitle>
      {/* Subtitle line ("nearest open park: …") — present in the live layout, so reserve it.
          A real <p> around a 20 px bar, not a bare 16 px block: the tag and the height both
          have to match, or a diff of the two layouts pairs this with the grid wrapper below
          and reports a 727 px insertion that nobody can find. */}
      <p className="mb-8">
        <Skeleton as="span" className="block h-5 w-64" />
      </p>
      {/* The live view wraps its grid in a plain <div> (it holds the "show all" button too),
          so this one does as well — same depth, same nesting. */}
      <div>
        <ul className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
          {Array.from({ length: HOME_NEARBY_LIMIT }).map((_, i) => (
            // Match the live grid's collapse: only the first two cards show below 768 px
            // of page.
            <li key={i} className={cn(i >= 2 && 'hidden @min-[768px]/page:block')}>
              <ParkCardNearbySkeleton />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
