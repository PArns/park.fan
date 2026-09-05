import Link from 'next/link';
import { buttonLinkProps } from '@/components/ui/button';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Card } from '@/components/ui/card';
import { GlossaryRichText } from '@/components/glossary/glossary-rich-text';
import { GlossaryTermTracker } from '@/components/glossary/glossary-term-tracker';
import { CoasterPlayer, type CoasterPlayerLabels } from '@/components/glossary/coaster-player';
import type { GlossaryTerm } from '@/lib/glossary/types';
import type { Breadcrumb } from '@/lib/api/types';
import type { Locale } from '@/i18n/config';
import type { ReactNode } from 'react';
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
  /**
   * The rides that feature this term, as a slot rather than a sibling section.
   *
   * It used to render in its own full-width `PageContainer` below this
   * component, which put two page paddings plus a chapter margin between the
   * definition and the rides and made it a stripe wider than the card it
   * belongs to — it read as a different page. Passing it in keeps it in the
   * SAME grid column, one card-gap under the definition, still streamed
   * separately by the caller's `<Suspense>`.
   */
  rides?: ReactNode;
  /**
   * The blog posts that explain this term, as a slot for the same reason as {@link rides}: it
   * belongs in the definition's column, not in a full-width band under it. Renders nothing for
   * the 248 of 267 terms no post covers, so it reserves no height either.
   */
  posts?: ReactNode;
}

export function GlossaryTermDetail({
  term,
  relatedTerms,
  breadcrumbs,
  locale,
  segment,
  labels,
  playerLabels,
  rides,
  posts,
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
      {/* buttonLinkProps, not `<Button asChild>` — server component, see conventions §14. */}
      {/* prefetch off, matching the app-wide default in i18n/no-prefetch-link. This file reaches
          for plain next/link (the locale is already in the href), which bypasses that wrapper, so
          every Link here has to opt out by hand — the sibling glossary components do the same. */}
      <Link href={`/${locale}/${segment}`} prefetch={false} {...buttonLinkProps({ size: 'sm' })}>
        <ArrowLeft className="h-4 w-4" />
        {labels.backToGlossary}
      </Link>
    </div>
  );

  // Model / accuracy-metric terms get a CTA to the Fancast model page.
  const fancastCta = FANCAST_TERM_IDS.has(term.id) ? (
    <Card className="border-primary/30 from-primary/10 gap-0 bg-gradient-to-br to-transparent py-0 shadow-sm">
      <Link
        href={`/${locale}/fancast`}
        prefetch={false}
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
              prefetch={false}
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
      <GlossaryTermTracker termId={term.id} />
      {/* Breadcrumb — floats above the grid */}
      <div className="mb-5">
        <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={term.name} variant="pill" />
      </div>

      {hasPlayer ? (
        /* ── Player layout: the 3-D player sits full-bleed on top of one
              cohesive card, with the title + definition below it; related
              terms go in the sidebar. ── */
        <div className="grid gap-5 @min-[1024px]/page:grid-cols-[1fr_260px]">
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
            {rides}
            {posts}
            {backButton}
          </div>
          {sidebar}
        </div>
      ) : (
        /* ── Default layout: combined header + definition card with sidebar ── */
        <div className="grid gap-5 @min-[1024px]/page:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-4">
            <Card className="border-primary/20 gap-0 py-0 shadow-md">
              <div className="px-6 pt-5 pb-4">{headerBlock}</div>
              <div className="border-primary/10 border-t px-6 py-6">{definitionBlock}</div>
            </Card>
            {fancastCta}
            {rides}
            {posts}
            {backButton}
          </div>
          {sidebar}
        </div>
      )}
    </div>
  );
}
