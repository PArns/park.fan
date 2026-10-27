import Link from 'next/link';
import { buttonLinkProps } from '@/components/ui/button';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Card } from '@/components/ui/card';
import { HeadKicker } from '@/components/common/head-kicker';
import { SidebarCard } from '@/components/common/sidebar-card';
import { GlossaryRichText } from '@/components/glossary/glossary-rich-text';
import { GlossaryTermTracker } from '@/components/glossary/glossary-term-tracker';
import { CoasterPlayer, type CoasterPlayerLabels } from '@/components/glossary/coaster-player';
import type { GlossaryTerm } from '@/lib/glossary/types';
import type { Breadcrumb } from '@/lib/api/types';
import type { Locale } from '@/i18n/config';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

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

/** The sidebar column, from the width where the definition keeps a readable measure beside it. */
const SIDEBAR_GRID =
  '@min-[1024px]/page:grid @min-[1024px]/page:grid-cols-[minmax(0,1fr)_16rem] @min-[1024px]/page:items-start @min-[1024px]/page:gap-10';

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
   * The rides that feature this term, as a slot so they open a chapter in the definition's column,
   * under the text they illustrate.
   */
  rides?: ReactNode;
  /**
   * The blog posts that explain this term, a slot for the same reason as {@link rides}. Renders
   * nothing for the many terms no post covers, so it reserves no height.
   */
  posts?: ReactNode;
}

/**
 * A glossary term page, laid out like a blog article on the plain page: the head (category kicker,
 * name, short definition, alternate names), then the 3-D player when the term has one, the
 * definition, and the `rides` and `posts` chapters, with the related terms in a sidebar. Model
 * terms get a link to the Fancast page.
 */
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
  // prefetch off on every Link here, matching the app-wide default in i18n/no-prefetch-link. This
  // file reaches for plain next/link (the locale is already in the href), which bypasses that
  // wrapper, so every Link has to opt out by hand — the sibling glossary components do the same.
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

  // An `<article>`, so the `<dfn>` in the heading and the definition under it share the section
  // the HTML spec asks a defining instance to share with its definition.
  return (
    <article>
      <GlossaryTermTracker termId={term.id} />
      <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={term.name} variant="plain" />

      <header className="mt-6 sm:mt-10">
        {/* The category is the overview's chapter of the same name, which its id anchors. */}
        <HeadKicker>
          <Link
            href={`/${locale}/${segment}#${term.category}`}
            prefetch={false}
            className="hover:text-primary transition-colors"
          >
            {labels.category}
          </Link>
        </HeadKicker>
        <h1 className="text-foreground max-w-4xl text-3xl font-black tracking-tight text-balance sm:text-5xl">
          <dfn className="not-italic">{term.name}</dfn>{' '}
          <span className="text-muted-foreground text-xl font-bold tracking-normal sm:text-3xl">
            {labels.termH1Suffix}
          </span>
        </h1>
        <p className="text-foreground/80 mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
          {term.shortDefinition}
        </p>
        {term.alternateNames && term.alternateNames.length > 0 && (
          <p className="text-muted-foreground mt-4 text-sm">
            <span className="font-medium">{labels.alsoKnownAs}:</span>{' '}
            {term.alternateNames.join(' · ')}
          </p>
        )}
      </header>

      <div className={`mt-8 sm:mt-10 ${SIDEBAR_GRID}`}>
        <div className="min-w-0 space-y-10">
          {term.player && playerLabels && (
            <CoasterPlayer element={term.player.element} labels={playerLabels} />
          )}
          {/* The blog article's paragraph, so a definition reads like the posts that link to it. */}
          <div className="text-foreground/90 space-y-5 leading-[1.75]">
            {term.definition.split('\n\n').map((para, i) => (
              <p key={i}>
                <GlossaryRichText locale={locale}>{para}</GlossaryRichText>
              </p>
            ))}
          </div>
          {fancastCta}
          {rides}
          {posts}
          <div>
            {/* buttonLinkProps, not `<Button asChild>` — server component, see
                docs/development/conventions.md#never-aschild-a-client-element-from-a-server-component. */}
            <Link
              href={`/${locale}/${segment}`}
              prefetch={false}
              {...buttonLinkProps({ variant: 'outline', size: 'sm', withIcon: true })}
            >
              <ArrowLeft className="h-4 w-4" />
              {labels.backToGlossary}
            </Link>
          </div>
        </div>

        {relatedTerms.length > 0 && (
          <aside
            aria-label={labels.relatedTerms}
            className="mt-10 @min-[1024px]/page:sticky @min-[1024px]/page:top-24 @min-[1024px]/page:mt-0"
          >
            <SidebarCard icon={BookOpen} title={labels.relatedTerms} contentClassName="px-2">
              <ul className="space-y-0.5">
                {relatedTerms.map((related) => (
                  <li key={related.id}>
                    <Link
                      href={`/${locale}/${segment}/${related.slug}`}
                      prefetch={false}
                      className="hover:bg-muted/60 group block rounded-lg px-2 py-2 transition-colors"
                    >
                      <span className="group-hover:text-primary block text-sm font-semibold transition-colors">
                        {related.name}
                      </span>
                      <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs leading-relaxed">
                        {related.shortDefinition}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SidebarCard>
          </aside>
        )}
      </div>
    </article>
  );
}
