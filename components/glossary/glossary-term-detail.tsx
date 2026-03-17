import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Card } from '@/components/ui/card';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import type { GlossaryTerm } from '@/lib/glossary/types';
import type { Breadcrumb } from '@/lib/api/types';
import type { Locale } from '@/i18n/config';
import { ArrowLeft, Tag } from 'lucide-react';

interface GlossaryTermDetailProps {
  term: GlossaryTerm;
  relatedTerms: GlossaryTerm[];
  breadcrumbs: Breadcrumb[];
  locale: Locale;
  segment: string;
  labels: {
    backToGlossary: string;
    relatedTerms: string;
    category: string;
    termH1Suffix: string;
  };
}

export function GlossaryTermDetail({
  term,
  relatedTerms,
  breadcrumbs,
  locale,
  segment,
  labels,
}: GlossaryTermDetailProps) {
  return (
    <div>
      {/* Breadcrumb — floats above the grid */}
      <div className="mb-5">
        <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={term.name} variant="pill" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        {/* ── Left column ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Header card: title → short definition → category badge */}
          <Card className="border-primary/20 shadow-md">
            <div className="px-6 pt-4 pb-4">
              <h1 className="mb-3 text-3xl leading-tight font-bold">
                {term.name}{' '}
                <span className="text-muted-foreground text-xl font-normal">{labels.termH1Suffix}</span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                <GlossaryInject locale={locale}>{term.shortDefinition}</GlossaryInject>
              </p>
            </div>
            {/* Category footer strip */}
            <div className="border-primary/10 flex items-center gap-1.5 border-t px-6 py-3">
              <Tag className="text-primary h-3.5 w-3.5 shrink-0" />
              <span className="text-primary text-xs font-medium">{labels.category}</span>
            </div>
          </Card>

          {/* Definition card */}
          <Card className="border-primary/10 px-6 py-4 shadow-sm">
            <div className="text-foreground/85 space-y-3 leading-relaxed">
              {term.definition.split('\n\n').map((para, i) => (
                <p key={i}>
                  <GlossaryInject locale={locale}>{para}</GlossaryInject>
                </p>
              ))}
            </div>
          </Card>

          {/* Back button */}
          <div className="pb-2">
            <Button asChild variant="default" size="sm">
              <Link href={`/${locale}/${segment}`}>
                <ArrowLeft className="h-4 w-4" />
                {labels.backToGlossary}
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Sidebar: Related terms ────────────────────────────────────── */}
        {relatedTerms.length > 0 && (
          <aside aria-label={labels.relatedTerms}>
            {/* Sidebar wrapped in its own glass card so the heading is readable */}
            <Card className="border-primary/15 shadow-sm">
              <div className="border-primary/10 border-b px-4 py-2">
                <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                  {labels.relatedTerms}
                </p>
              </div>
              <div className="divide-border divide-y">
                {relatedTerms.map((related) => (
                  <Link
                    key={related.id}
                    href={`/${locale}/${segment}/${related.slug}`}
                    className="hover:bg-primary/5 group block px-4 py-2.5 transition-colors"
                  >
                    <p className="text-sm font-medium">{related.name}</p>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                      {related.shortDefinition}
                    </p>
                  </Link>
                ))}
              </div>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}
