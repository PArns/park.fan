'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { NearbyHeading } from '@/components/parks/nearby-heading';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';
import { HOME_NEARBY_LIMIT } from '@/lib/hooks/use-nearby-parks';
import { cn } from '@/lib/utils';
import { CHAPTER_GAP_COMPACT } from '@/components/common/chapter-spacing';

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
export function NearbyParksCardSkeleton({
  className,
  nested = false,
}: {
  className?: string;
  /** As on `NearbyParksCard`: the homepage, inside `NearbyChapter`. */
  nested?: boolean;
}) {
  const t = useTranslations('nearby');

  return (
    // CHAPTER_GAP_COMPACT mirrors NearbyParksCard's TOP_SPACING so the swap to the live parks list keeps the
    // same gap under the hero (no layout shift). The in-park banner is full-bleed and exempt.
    <section className={cn(CHAPTER_GAP_COMPACT, className)} aria-hidden="true">
      {/* The real heading, and the real TEXT, not a grey bar: the title needs no data, and a
          `<h2>` whose only child was a `Skeleton` put an empty heading into the document
          outline — twice, since the streamed HTML carries the fallback and the resolved copy
          side by side. Only the hint ("nearest open park: …") waits for data; its bar is a
          `text-sm` line box (20 px) inside the same `<p>` the live hint renders, so tag and
          height both match. `NearbyHeading` decides chapter or pill, here as in the card. */}
      <NearbyHeading
        nested={nested}
        title={t('title')}
        hint={<Skeleton as="span" className="block h-5 w-64" />}
        iconClassName="text-muted-foreground"
      />
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
        {/* The list's „Mehr anzeigen" button, on the same bet as the six cards: a German IP gets
            more than two parks, and below 768 px of page the button stood under the two cards
            unreserved, 60 px on a phone (`mt-4` + the `sm` button's 44 px there) landing under
            the reader on every blog post. */}
        <div className="mt-4 flex justify-center @min-[768px]/page:hidden">
          <Skeleton className="h-8 w-full rounded-md max-sm:h-11" />
        </div>
      </div>
    </section>
  );
}
