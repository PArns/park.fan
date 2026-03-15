import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GlossaryTerm } from '@/lib/glossary/types';
import type { Locale } from '@/i18n/config';

interface GlossaryTermCardProps {
  term: GlossaryTerm;
  locale: Locale;
  segment: string;
}

export function GlossaryTermCard({ term, locale, segment }: GlossaryTermCardProps) {
  return (
    <Link href={`/${locale}/${segment}/${term.slug}`} className="group block">
      <Card className="border-primary/10 group-hover:border-primary/30 h-full transition-all group-hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{term.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-3 text-sm">{term.shortDefinition}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
