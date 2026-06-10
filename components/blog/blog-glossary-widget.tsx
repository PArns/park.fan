import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookOpen } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import type { Locale } from '@/i18n/config';

interface BlogGlossaryWidgetProps {
  /** Localized term slug or the stable term id. */
  slug: string;
  locale: Locale;
}

/**
 * Embeds a glossary term's name and full definition into a post via:
 *   ```glossary-widget slug=single-rider
 *   ```
 *
 * The text is pulled from the shared glossary dataset for the current locale —
 * authors only reference the term (by its localized slug or stable id), never
 * copy the explanation. Matches by slug first, then falls back to id so the
 * same reference works across translated posts.
 */
export async function BlogGlossaryWidget({ slug, locale }: BlogGlossaryWidgetProps) {
  const tBlog = await getTranslations('blog');
  const terms = await getGlossaryTerms(locale);
  const term = terms.find((t) => t.slug === slug) ?? terms.find((t) => t.id === slug) ?? null;

  if (!term) {
    return (
      <GlassCard variant="light" className="not-prose my-8">
        <p className="text-muted-foreground text-sm">{tBlog('widget.termNotFound', { slug })}</p>
      </GlassCard>
    );
  }

  const href = `/${locale}/${GLOSSARY_SEGMENTS[locale]}/${term.slug}`;

  return (
    <GlassCard variant="light" className="not-prose border-primary/20 my-8">
      <div className="flex flex-col gap-3" itemScope itemType="https://schema.org/DefinedTerm">
        <span className="text-primary inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          {tBlog('widget.glossary')}
        </span>
        <div>
          <h3 className="text-foreground text-lg font-bold" itemProp="name">
            {term.name}
          </h3>
          {term.alternateNames && term.alternateNames.length > 0 && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {term.alternateNames.join(' · ')}
            </p>
          )}
        </div>
        <div className="text-foreground/90 space-y-3 leading-relaxed" itemProp="description">
          {term.definition.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <Link
          href={href}
          prefetch={false}
          itemProp="url"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium"
        >
          {tBlog('widget.glossaryMore')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </GlassCard>
  );
}
