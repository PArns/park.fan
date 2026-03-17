import { escapeJsonLd } from './structured-data';
import { SITE_URL } from '@/i18n/config';
import type { GlossaryTerm } from '@/lib/glossary/types';
import type { Locale } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';

/** ISO date of last glossary content review — update when terms are added or changed */
const GLOSSARY_CONTENT_DATE = '2026-03-17';

/** Maps locale codes to BCP-47 language tags used in schema.org inLanguage */
const SCHEMA_LANGUAGE: Record<Locale, string> = {
  en: 'en',
  de: 'de',
  fr: 'fr',
  it: 'it',
  nl: 'nl',
  es: 'es',
};

/** Human-readable name for the DefinedTermSet per locale */
const TERM_SET_NAME: Record<Locale, string> = {
  en: 'Theme Park Glossary',
  de: 'Freizeitpark-Glossar',
  fr: 'Glossaire des Parcs à Thème',
  it: 'Glossario dei Parchi a Tema',
  nl: 'Pretpark Woordenlijst',
  es: 'Glosario de Parques Temáticos',
};

/** Short description for the DefinedTermSet per locale */
const TERM_SET_DESCRIPTION: Record<Locale, string> = {
  en: 'Definitions for theme park terms: wait times, crowd levels, roller coaster elements, virtual queues, and more.',
  de: 'Erklärungen zu Freizeitpark-Fachbegriffen: Wartezeiten, Besucherdichte, Achterbahnelemente, virtuelle Warteschlangen und mehr.',
  fr: "Définitions des termes des parcs à thème : temps d'attente, niveaux d'affluence, éléments de montagnes russes, files virtuelles et plus.",
  it: 'Definizioni dei termini dei parchi a tema: tempi di attesa, livelli di affluenza, elementi delle montagne russe, code virtuali e altro.',
  nl: 'Uitleg bij pretparkbegrippen: wachttijden, drukteniveaus, achtbaanelementen, virtuele wachtrijen en meer.',
  es: 'Definiciones de términos de parques temáticos: tiempos de espera, niveles de afluencia, elementos de montaña rusa, colas virtuales y más.',
};

interface GlossaryStructuredDataProps {
  locale: Locale;
  segment: string;
  variant: 'overview' | 'detail';
  terms?: GlossaryTerm[];
  term?: GlossaryTerm;
}

export function GlossaryStructuredData({
  locale,
  segment,
  variant,
  terms,
  term,
}: GlossaryStructuredDataProps) {
  const termSetUrl = `${SITE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale]}`;
  const lang = SCHEMA_LANGUAGE[locale] ?? locale;

  if (variant === 'overview' && terms) {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      '@id': termSetUrl,
      name: TERM_SET_NAME[locale],
      description: TERM_SET_DESCRIPTION[locale],
      url: termSetUrl,
      inLanguage: lang,
      dateModified: GLOSSARY_CONTENT_DATE,
      hasDefinedTerm: terms.map((t) => ({
        '@type': 'DefinedTerm',
        '@id': `${SITE_URL}/${locale}/${segment}/${t.slug}`,
        name: t.name,
        description: t.shortDefinition,
        url: `${SITE_URL}/${locale}/${segment}/${t.slug}`,
        inLanguage: lang,
      })),
    };

    return (
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }} />
    );
  }

  if (variant === 'detail' && term) {
    const termUrl = `${SITE_URL}/${locale}/${segment}/${term.slug}`;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      '@id': termUrl,
      name: term.name,
      description: term.definition,
      url: termUrl,
      inLanguage: lang,
      termCode: term.id,
      dateModified: GLOSSARY_CONTENT_DATE,
      inDefinedTermSet: {
        '@type': 'DefinedTermSet',
        '@id': termSetUrl,
        name: TERM_SET_NAME[locale],
        url: termSetUrl,
      },
    };

    return (
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }} />
    );
  }

  return null;
}
