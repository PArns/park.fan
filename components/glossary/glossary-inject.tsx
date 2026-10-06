import { getLocale } from 'next-intl/server';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import type { Locale } from '@/i18n/config';
import { parseGlossarySegments } from '@/lib/glossary/parse-segments';
import { GlossarySegments } from './glossary-segments';

/**
 * Async server component that links the first occurrence of each glossary term or alias in its
 * text to a dashed-underline tooltip. `locale` defaults to the request's locale.
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
    <GlossarySegments
      segments={segments}
      locale={locale}
      segment={segment}
      noUnderline={noUnderline}
    />
  );
}
