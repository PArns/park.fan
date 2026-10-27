import { memo } from 'react';
import Link from 'next/link';
import { Rotate3d, RollerCoaster } from 'lucide-react';
import { CARD_WIDE_LINK_CLASS, LISTING_CARD_CLASS } from '@/components/blog/post-stream';
import { cn } from '@/lib/utils';
import type { GlossaryTermListItem } from '@/lib/glossary/types';
import type { Locale } from '@/i18n/config';

interface GlossaryTermCardProps {
  term: GlossaryTermListItem;
  locale: Locale;
  segment: string;
  /** Label for the 3-D-player badge shown on terms that carry an interactive animation. */
  playerLabel?: string;
  /** How many curated rides feature this term. Undefined or 0 renders no line. */
  rideCount?: number;
  /** Localised, pluralised label for `rideCount` (e.g. "151 Bahnen"). */
  rideCountLabel?: string;
}

/**
 * A glossary term as one term-and-definition group of the overview's `<dl>`: the name in the
 * `<dt>`, the short definition and, at the foot, how many rides feature it in `<dd>`s. The surface
 * is the blog and news stream's (`LISTING_CARD_CLASS`), so the three overviews read as one, and the
 * name's link covers the card (`CARD_WIDE_LINK_CLASS`). Memoised: the overview renders all of
 * them, and its props stay put while the visitor types.
 */
export const GlossaryTermCard = memo(function GlossaryTermCard({
  term,
  locale,
  segment,
  playerLabel,
  rideCount,
  rideCountLabel,
}: GlossaryTermCardProps) {
  const hasRides = Boolean(rideCount && rideCount > 0);

  return (
    <div className={cn(LISTING_CARD_CLASS, 'relative isolate flex h-full flex-col')}>
      <dt className="flex items-start justify-between gap-3 text-base leading-snug font-bold text-pretty">
        <Link
          href={`/${locale}/${segment}/${term.slug}`}
          prefetch={false}
          className={CARD_WIDE_LINK_CLASS}
        >
          {term.name}
        </Link>
        {term.player && (
          <span
            title={playerLabel}
            aria-label={playerLabel}
            className="bg-primary/10 text-primary inline-flex size-7 shrink-0 items-center justify-center rounded-full"
          >
            <Rotate3d className="size-4" aria-hidden="true" />
          </span>
        )}
      </dt>
      <dd className="text-muted-foreground mt-1 line-clamp-3 text-sm leading-relaxed">
        {term.shortDefinition}
      </dd>
      {/* `mt-auto`: the cards of a row share its height, so the line sits on every card's floor. */}
      {hasRides && (
        <dd className="text-muted-foreground mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium tabular-nums">
          <RollerCoaster className="text-primary size-3.5 shrink-0" aria-hidden="true" />
          {rideCountLabel}
        </dd>
      )}
    </div>
  );
});
