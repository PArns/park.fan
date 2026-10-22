import { memo } from 'react';
import Link from 'next/link';
import { Rotate3d, RollerCoaster } from 'lucide-react';
import { LISTING_CARD_CLASS } from '@/components/blog/post-stream';
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
 * A glossary term as a card in the overview grid: the name, the short definition, the 3-D badge
 * and, at the foot, how many rides feature it. The surface is the blog and news stream's
 * (`LISTING_CARD_CLASS`), so the three overviews read as one. Memoised: the overview renders all of
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
    <Link
      href={`/${locale}/${segment}/${term.slug}`}
      prefetch={false}
      className={cn(
        LISTING_CARD_CLASS,
        'group focus-visible:ring-ring flex h-full flex-col focus-visible:ring-2 focus-visible:outline-none'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="group-hover:text-primary text-base leading-snug font-bold text-pretty transition-colors">
          {term.name}
        </h3>
        {term.player && (
          <span
            title={playerLabel}
            aria-label={playerLabel}
            className="bg-primary/10 text-primary inline-flex size-7 shrink-0 items-center justify-center rounded-full"
          >
            <Rotate3d className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="text-muted-foreground mt-1 line-clamp-3 text-sm leading-relaxed">
        {term.shortDefinition}
      </p>
      {/* `mt-auto`: the cards of a row share its height, so the line sits on every card's floor. */}
      {hasRides && (
        <p className="text-muted-foreground mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium tabular-nums">
          <RollerCoaster className="text-primary size-3.5 shrink-0" aria-hidden="true" />
          {rideCountLabel}
        </p>
      )}
    </Link>
  );
});
