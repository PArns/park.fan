import type { Locale } from '@/i18n/config';

/**
 * "im Phantasialand", "in der Efteling", "in Toverland" — the park name in a
 * sentence, with the article its name actually takes.
 *
 * German interpolation of a proper noun is not a substitution, it is an
 * inflection. The copy used to hard-code the preposition (`im {park}`), which
 * makes every park masculine or neuter: right for the Europa-Park and the
 * Phantasialand, wrong for the ~180 parks whose names take no article at all
 * ("im Cedar Point"), and wrong wherever the name is feminine, where German
 * refuses the contraction entirely ("in der …" and never "im …"). The calendar page showed the
 * other half of the same bug — "Ferien, die auf Phantasialand wirken", missing
 * the "das" that "auf" demands.
 *
 * The article comes from the API as `nameArticleDe` (a curated column), in the
 * nominative. Everything else is derived here, because the case is a property
 * of the sentence, not of the park.
 *
 * **Only German inflects.** The other five locales put a fixed preposition in
 * front of the name, which is what their strings did before — this function
 * keeps that behaviour so one call site serves all six. It is deliberately not
 * a gender field: the gender differs by language (die Efteling, *de* Efteling,
 * *l'*Efteling), so a second language needing this gets its own column.
 */

/**
 * Whatever the API sent for `nameArticleDe`.
 *
 * Deliberately `string` and not the three-value union: this is a value that
 * crossed a network boundary, and narrowing it is this module's job — see the
 * `key` lookup in `parkPhrase`, which treats anything else as "no article".
 * Typing it narrowly would only move the lie to the fetch layer.
 */
export type ParkArticle = string | null | undefined;

/** The case a sentence needs, named after what it is used for, not its grammar. */
export type ParkPhraseKind =
  /** Where something happens: "im Phantasialand", "at Phantasialand". */
  | 'in'
  /** Who it is for: "für das Phantasialand", "for Phantasialand". */
  | 'for'
  /** The subject at the start of a sentence: "Das Phantasialand …". */
  | 'subject';

const GERMAN: Record<ParkPhraseKind, Record<'der' | 'die' | 'das' | 'none', string>> = {
  // Dative. `in dem` contracts to `im`, `in der` does not — the contraction is
  // the reason this cannot be a simple prefix.
  in: { der: 'im', das: 'im', die: 'in der', none: 'in' },
  // Accusative.
  for: { der: 'für den', das: 'für das', die: 'für die', none: 'für' },
  // Nominative, capitalised: this one starts a sentence or it would not be here.
  subject: { der: 'Der', das: 'Das', die: 'Die', none: '' },
};

const OTHER: Record<Exclude<Locale, 'de'>, Record<ParkPhraseKind, string>> = {
  en: { in: 'at', for: 'for', subject: '' },
  nl: { in: 'in', for: 'voor', subject: '' },
  fr: { in: 'à', for: 'pour', subject: '' },
  es: { in: 'en', for: 'para', subject: '' },
  it: { in: 'a', for: 'per', subject: '' },
};

export function parkPhrase(
  locale: Locale,
  kind: ParkPhraseKind,
  name: string,
  article: ParkArticle
): string {
  if (locale === 'de') {
    const key = article === 'der' || article === 'die' || article === 'das' ? article : 'none';
    const prefix = GERMAN[kind][key];
    return prefix ? `${prefix} ${name}` : name;
  }

  const prefix = OTHER[locale as Exclude<Locale, 'de'>]?.[kind] ?? '';
  return prefix ? `${prefix} ${name}` : name;
}

/**
 * The interpolation arguments a message needs to name a park.
 *
 * Every variant at once, because which one a sentence needs differs per locale:
 * German's "Beste Reisezeit für das Phantasialand" wants `forPark`, English's
 * "Best Time to Visit Phantasialand" wants the bare `park`. ICU ignores the
 * arguments a string does not use, so passing all four costs nothing and keeps
 * the six translations free to be sentences rather than templates of each other.
 */
export function parkArgs(locale: Locale, name: string, article: ParkArticle) {
  return {
    park: name,
    inPark: parkPhrase(locale, 'in', name, article),
    forPark: parkPhrase(locale, 'for', name, article),
    parkSubject: parkPhrase(locale, 'subject', name, article),
  };
}
