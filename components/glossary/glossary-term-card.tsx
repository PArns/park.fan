import Link from 'next/link';
import { Rotate3d, RollerCoaster } from 'lucide-react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GlossaryTermListItem } from '@/lib/glossary/types';
import type { Locale } from '@/i18n/config';

interface GlossaryTermCardProps {
  term: GlossaryTermListItem;
  locale: Locale;
  segment: string;
  /** Label for the 3-D-player badge shown on terms that carry an interactive animation. */
  playerLabel?: string;
  /** How many curated rides feature this term. Undefined or 0 renders no badge. */
  rideCount?: number;
  /** Localised, pluralised label for `rideCount` (e.g. "151 Bahnen"). */
  rideCountLabel?: string;
}

export function GlossaryTermCard({
  term,
  locale,
  segment,
  playerLabel,
  rideCount,
  rideCountLabel,
}: GlossaryTermCardProps) {
  const hasRides = Boolean(rideCount && rideCount > 0);
  // Deep-link into the ride list when there is one. The badge cannot be its own
  // <a> — the whole card is already a link, and nesting anchors is invalid HTML
  // that breaks the outer one.
  const href = `/${locale}/${segment}/${term.slug}${hasRides ? '#rides' : ''}`;

  return (
    <Link href={href} prefetch={false} className="group block">
      <Card className="border-primary/10 group-hover:border-primary/30 h-full transition-all group-hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{term.name}</CardTitle>
          {(term.player || hasRides) && (
            <CardAction>
              <span className="inline-flex items-center gap-1.5">
                {hasRides && (
                  <span
                    title={rideCountLabel}
                    className="text-muted-foreground group-hover:text-primary inline-flex items-center gap-1 text-xs font-medium tabular-nums transition-colors"
                  >
                    <RollerCoaster className="h-3.5 w-3.5" aria-hidden="true" />
                    {rideCount}
                  </span>
                )}
                {term.player && (
                  <span
                    title={playerLabel}
                    aria-label={playerLabel}
                    className="bg-primary/10 text-primary group-hover:bg-primary/20 inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors"
                  >
                    <Rotate3d className="h-3.5 w-3.5" />
                  </span>
                )}
              </span>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-3 text-sm">{term.shortDefinition}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
