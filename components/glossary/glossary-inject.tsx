import { getLocale } from 'next-intl/server';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import type { Locale } from '@/i18n/config';
import { parseGlossarySegments } from '@/lib/glossary/parse-segments';
import { GlossaryInjectTerm } from './glossary-inject-term';

/**
 * Async server component — fetches glossary terms for the given (or current) locale and
 * replaces the first occurrence of each term (or alias) with a dashed-underline
 * tooltip link. No provider or wrapper needed.
 *
 * @param locale  Optional: the locale to use. If not provided, uses getLocale().
 * @param noUnderline  When true, suppress the dashed underline (e.g. inside headings).
 */
export async function GlossaryInject({
  children,
  locale: providedLocale,
  noUnderline = false,
}: {
  children: string;
  locale?: Locale;
  noUnderline?: boolean;
}) {
  if (!children) return <>{children}</>;

  const locale = (providedLocale ?? ((await getLocale()) as Locale)) as Locale;
  const terms = await getGlossaryTerms(locale);
  const segment = GLOSSARY_SEGMENTS[locale];

  const segments = parseGlossarySegments(children, terms);

  if (segments.every((s) => s.type === 'text')) {
    return <>{children}</>;
  }

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return seg.content;
        return (
          <GlossaryInjectTerm
            key={`${seg.id}-${i}`}
            matchedText={seg.matchedText}
            name={seg.name}
            slug={seg.slug}
            shortDefinition={seg.shortDefinition}
            locale={locale}
            segment={segment}
            noUnderline={noUnderline}
          />
        );
      })}
    </>
  );
}
