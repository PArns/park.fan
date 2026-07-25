import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Card } from '@/components/ui/card';
import { GlossaryRichText } from '@/components/glossary/glossary-rich-text';
import { GlossaryTermTracker } from '@/components/glossary/glossary-term-tracker';
import { CoasterPlayer, type CoasterPlayerLabels } from '@/components/glossary/coaster-player';
import type { GlossaryTerm } from '@/lib/glossary/types';
import type { Breadcrumb } from '@/lib/api/types';
import type { Locale } from '@/i18n/config';
import { ArrowLeft, ArrowRight, Sparkles, Tag } from 'lucide-react';

/** Glossary terms describing the prediction model or its accuracy metrics — each
 *  gets a CTA linking to the Fancast model page (where the live scorecard lives). */
const FANCAST_TERM_IDS = new Set([
  'ai-forecast',
  'ki',
  'crowd-forecast',
  'mae',
  'rmse',
  'mape',
  'r-squared',
]);

interface GlossaryTermDetailProps {
  term: GlossaryTerm;
  relatedTerms: GlossaryTerm[];
  breadcrumbs: Breadcrumb[];
  locale: Locale;
  segment: string;
  labels: {
    backToGlossary: string;
    relatedTerms: string;
    alsoKnownAs: string;
    category: string;
    termH1Suffix: string;
    fancastCta: string;
  };
  /** Localised strings for the 3-D player; only needed when `term.player` is set. */
  playerLabels?: CoasterPlayerLabels;
}

export function GlossaryTermDetail({
  term,
  relatedTerms,
  breadcrumbs,
  locale,
  segment,
  labels,
  playerLabels,
}: GlossaryTermDetailProps) {
  const hasPlayer = Boolean(term.player && playerLabels);

  // ── Reusable fragments — composed differently depending on whether the term
  //    carries a 3-D player (player on top, text below) or not (combined card).
  const headerBlock = (
    <>
      <div className="mb-1 flex items-center gap-2">
        <Tag className="text-primary h-3 w-3 shrink-0" />
        <span className="text-primary text-xs font-medium">{labels.category}</span>
      </div>
      <h1 className="mb-1.5 text-3xl leading-tight font-bold">
        {term.name}{' '}
        <span className="text-muted-foreground text-xl font-normal">{labels.termH1Suffix}</span>
      </h1>
      {term.alternateNames && term.alternateNames.length > 0 && (
        <p className="text-muted-foreground mt-1.5 text-sm">
          <span className="font-medium">{labels.alsoKnownAs}:</span>{' '}
          {term.alternateNames.join(' · ')}
        </p>
      )}
    </>
  );

  const definitionBlock = (
    <div className="text-foreground space-y-4 text-base leading-relaxed">
      {term.definition.split('\n\n').map((para, i) => (
        <p key={i}>
          <GlossaryRichText locale={locale}>{para}</GlossaryRichText>
        </p>
      ))}
    </div>
  );

  const backButton = (
    <div className="pb-2">
      <Button asChild variant="default" size="sm">
        <Link href={`/${locale}/${segment}`}>
          <ArrowLeft className="h-4 w-4" />
          {labels.backToGlossary}
        </Link>
      </Button>
    </div>
  );

  // Model / accuracy-metric terms get a CTA to the Fancast model page.
  const fancastCta = FANCAST_TERM_IDS.has(term.id) ? (
    <Card className="border-primary/30 from-primary/10 gap-0 bg-gradient-to-br to-transparent py-0 shadow-sm">
      <Link
        href={`/${locale}/fancast`}
        className="group flex items-center justify-between gap-3 px-4 py-3"
      >
        <span className="flex items-center gap-2.5">
          <span className="bg-primary/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Sparkles className="text-primary h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">{labels.fancastCta}</span>
        </span>
        <ArrowRight className="text-primary h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  ) : null;

  const sidebar = relatedTerms.length > 0 && (
    <aside aria-label={labels.relatedTerms}>
      {/* Sidebar wrapped in its own glass card so the heading is readable */}
      <Card className="border-primary/15 gap-0 py-0 shadow-sm">
        <div className="border-primary/10 border-b px-4 py-2.5">
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            {labels.relatedTerms}
          </p>
        </div>
        <div className="divide-border divide-y">
          {relatedTerms.map((related) => (
            <Link
              key={related.id}
              href={`/${locale}/${segment}/${related.slug}`}
              className="hover:bg-primary/5 group block px-4 py-2 transition-colors"
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
  );

  return (
    <div>
      <GlossaryTermTracker termId={term.id} locale={locale} />
      {/* Breadcrumb — floats above the grid */}
      <div className="mb-5">
        <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={term.name} variant="pill" />
      </div>

      {hasPlayer ? (
        /* ── Player layout: the 3-D player sits full-bleed on top of one
              cohesive card, with the title + definition below it; related
              terms go in the sidebar. ── */
        <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-4">
            <Card className="border-primary/20 gap-0 overflow-hidden py-0 shadow-md">
              <CoasterPlayer
                element={term.player!.element}
                labels={playerLabels!}
                className="rounded-none border-0 shadow-none"
              />
              <div className="px-6 pt-5 pb-4">{headerBlock}</div>
              <div className="border-primary/10 border-t px-6 py-6">{definitionBlock}</div>
            </Card>
            {fancastCta}
            {backButton}
          </div>
          {sidebar}
        </div>
      ) : (
        /* ── Default layout: combined header + definition card with sidebar ── */
        <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-4">
            <Card className="border-primary/20 gap-0 py-0 shadow-md">
              <div className="px-6 pt-5 pb-4">{headerBlock}</div>
              <div className="border-primary/10 border-t px-6 py-6">{definitionBlock}</div>
            </Card>
            {fancastCta}
            {backButton}
          </div>
          {sidebar}
        </div>
      )}
    </div>
  );
}
