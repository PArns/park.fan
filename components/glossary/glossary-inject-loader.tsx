import { type ReactNode } from 'react';
import { getGlossaryTerms, GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import type { Locale } from '@/i18n/config';
import type { GlossaryTerm } from '@/lib/glossary/types';
import { GlossaryInjectProvider } from './glossary-inject-context';

/**
 * Server component — fetches glossary terms for the given locale and wraps
 * children in a GlossaryInjectProvider so any <GlossaryInject> descendant
 * can automatically highlight + link glossary terms.
 *
 * Usage (server page):
 *   <GlossaryInjectLoader locale={locale}>
 *     {children}
 *   </GlossaryInjectLoader>
 */
export async function GlossaryInjectLoader({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const terms = await getGlossaryTerms(locale);
  const segment = GLOSSARY_SEGMENTS[locale];

  const minTerms = terms.map((t: GlossaryTerm) => ({
    id: t.id,
    name: t.name,
    shortDefinition: t.shortDefinition,
    slug: t.slug,
  }));

  return (
    <GlossaryInjectProvider terms={minTerms} locale={locale} segment={segment}>
      {children}
    </GlossaryInjectProvider>
  );
}
