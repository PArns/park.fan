import { getTranslations } from 'next-intl/server';
import { BookOpen } from 'lucide-react';
import { badgeLinkProps } from '@/components/ui/badge';
import Link from 'next/link';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { TILE_GLASS } from '@/components/common/glass-card';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { buildGlossaryTermHref } from '@/lib/glossary/segments';
import { cn } from '@/lib/utils';
import type { BlogListItem } from '@/lib/blog/types';
import type { Locale } from '@/i18n/config';

/**
 * The words a first-timer meets on their first day, in the order they meet them: the arrival
 * (rope drop), the queue types that change how long a ride costs. Ids into `GLOSSARY_TERMS`; a
 * term the locale has no translation for is left out rather than shown untranslated.
 */
const FIRST_VISIT_TERM_IDS = ['rope-drop', 'single-rider', 'virtual-queue'] as const;

interface ParkFirstVisitGuideProps {
  locale: Locale;
  parkName: string;
  /** The park's visit guide, from `getGuideForPark`. */
  guide: BlogListItem;
  className?: string;
}

/**
 * "First visit?" — the park's own guide as the way in, with the glossary terms that guide leans on.
 *
 * This is the guide's slot on the park page and not a URL of its own: the guide already has one,
 * and a `/first-visit` sub-page would render the same posts under a second address
 * (`docs/seo/dedicated-landing-pages.md` §2). The park page renders nothing for a park without a
 * guide, so there is no empty shell to reserve or hide.
 *
 * Static content (the blog manifest and the glossary files), like the posts section it sits in.
 */
export async function ParkFirstVisitGuide({
  locale,
  parkName,
  guide,
  className,
}: ParkFirstVisitGuideProps) {
  const [t, glossary] = await Promise.all([
    getTranslations('parks.firstVisit'),
    getGlossaryTerms(locale),
  ]);
  const terms = FIRST_VISIT_TERM_IDS.flatMap((id) => glossary.find((term) => term.id === id) ?? []);

  return (
    <section className={className} data-first-visit-guide>
      <ChapterHeading
        icon={BookOpen}
        title={t('title', { park: parkName })}
        hint={t('intro', { park: parkName })}
        frosted
        className="mb-4"
      />

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-5 @min-[1024px]/page:grid-cols-3">
        <BlogPostCard post={guide} />
        {terms.length > 0 && (
          <div
            className={cn(
              TILE_GLASS,
              'rounded-[20px] p-4 max-sm:rounded-xl sm:p-5 @min-[1024px]/page:col-span-2'
            )}
          >
            <h3 className="text-base font-semibold">{t('termsTitle')}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{t('termsIntro')}</p>
            <ul className="mt-3 space-y-3">
              {terms.map((term) => (
                <li key={term.id}>
                  <Link
                    href={buildGlossaryTermHref(locale, term.slug)}
                    prefetch={false}
                    {...badgeLinkProps({ variant: 'outline', className: 'text-sm' })}
                  >
                    {term.name}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-sm">{term.shortDefinition}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
