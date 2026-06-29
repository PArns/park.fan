import Link from 'next/link';
import { Rotate3d } from 'lucide-react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GlossaryTerm } from '@/lib/glossary/types';
import type { Locale } from '@/i18n/config';

interface GlossaryTermCardProps {
  term: GlossaryTerm;
  locale: Locale;
  segment: string;
  /** Label for the 3-D-player badge shown on terms that carry an interactive animation. */
  playerLabel?: string;
}

export function GlossaryTermCard({ term, locale, segment, playerLabel }: GlossaryTermCardProps) {
  return (
    <Link href={`/${locale}/${segment}/${term.slug}`} prefetch={false} className="group block">
      <Card className="border-primary/10 group-hover:border-primary/30 h-full transition-all group-hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{term.name}</CardTitle>
          {term.player && (
            <CardAction>
              <span
                title={playerLabel}
                aria-label={playerLabel}
                className="bg-primary/10 text-primary group-hover:bg-primary/20 inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors"
              >
                <Rotate3d className="h-3.5 w-3.5" />
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
