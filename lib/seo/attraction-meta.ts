import { fitWithin, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/lib/utils/metadata';
import { parkArgs } from '@/lib/i18n/park-phrase';
import type { Locale } from '@/i18n/config';
import { formatRiderHeight } from '@/lib/utils/temperature';
import type { ParkAttraction } from '@/lib/api/types';

/** The subset of next-intl's `t` these builders need. */
type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Clauses beyond the third stop fitting in 160 characters alongside two names. */
const MAX_FACTS = 3;

/**
 * What distinguishes THIS ride from the next one, in the order it is worth
 * saying.
 *
 * All of it is read off the attraction `generateMetadata` already holds — the
 * same cached park fetch the page body issues — so this costs no request
 * (CLAUDE.md, API budget per page).
 *
 * Every clause is a noun phrase or a preposition the language owns outright:
 * nothing here has to agree with the gender of a park or a themed area, which
 * is the trap `im {park}` already navigates for the sentence around it.
 */
export function buildAttractionFacts(attraction: ParkAttraction, t: Translate): string[] {
  const facts: string[] = [];
  const profile = attraction.rideProfile;

  // `!= null`: the API strips null-valued keys, so an unknown value arrives as
  // a missing one and `!== null` would let `undefined` through.
  if (profile?.manufacturer) facts.push(t('factBy', { manufacturer: profile.manufacturer }));
  // String(): a bare number goes through ICU number formatting and 2002 comes
  // out as "2.002" in de/nl/es/it.
  if (profile?.openedYear != null)
    facts.push(t('factOpened', { year: String(profile.openedYear) }));
  if (attraction.minimumHeight != null) {
    facts.push(t('factMinHeight', { height: formatRiderHeight(attraction.minimumHeight, 'C') }));
  }
  if (attraction.land) facts.push(t('factLand', { land: attraction.land }));

  return facts.slice(0, MAX_FACTS);
}

/**
 * The ride title, shortened until it survives the ~60 characters Google shows.
 *
 * Measured over the whole catalogue (7,084 rides × 6 locales), the single
 * unconditional template this replaces fitted inside 60 characters for 33.2 %
 * of English rides, 29.9 % of German ones and 7.1 % of Italian — the rest were
 * cut, usually losing the wait-time keyword the template exists for. The ladder
 * puts every locale at 98.1–98.3 %. Same shape the park page has had all along.
 */
export function buildAttractionTitle(
  attractionName: string,
  parkName: string,
  t: Translate,
  /** Locale + the park's German article, for "{attraction} im/in der/in {park}". */
  phrase?: { locale: Locale; articleDe?: string | null }
): string {
  const park = phrase
    ? parkArgs(phrase.locale, parkName, phrase.articleDe)
    : { park: parkName, inPark: parkName, forPark: parkName, parkSubject: parkName, inParkLeading: parkName };
  return fitWithin(
    MAX_TITLE_LENGTH,
    t('titleTemplate', { attraction: attractionName, ...park }),
    t('titleTemplateShort', { attraction: attractionName, ...park }),
    t('titleTemplateBare', { attraction: attractionName })
  );
}

/**
 * The ride description, carrying whatever sets the ride apart when we know
 * anything, and the plain sentence when we do not.
 *
 * The plain sentence was the only one there: one skeleton with two names
 * substituted into it, on all 42,606 ride URLs.
 */
export function buildAttractionDescription(
  attractionName: string,
  parkName: string,
  facts: string[],
  t: Translate,
  phrase?: { locale: Locale; articleDe?: string | null }
): string {
  const park = phrase
    ? parkArgs(phrase.locale, parkName, phrase.articleDe)
    : { park: parkName, inPark: parkName, forPark: parkName, parkSubject: parkName, inParkLeading: parkName };
  const plain = t('metaDescriptionTemplate', { attraction: attractionName, ...park });
  if (!facts.length) return plain;

  // Drop the least important clause first, then fall back to the plain
  // sentence, rather than letting Google cut a fact in half.
  const withFacts = facts.map((_, i) =>
    t('metaDescriptionTemplateFacts', {
      attraction: attractionName,
      ...park,
      facts: endOfSentence(sentenceCase(facts.slice(0, facts.length - i).join(', '))),
    })
  );
  return fitWithin(MAX_DESCRIPTION_LENGTH, ...withFacts, plain);
}

/**
 * The template closes the sentence with its own full stop, so a clause that
 * already ends in one must not bring a second: Walt Disney World's themed areas
 * are named "Main Street, U.S.A." and "Springfield, U.S.A.", which rendered
 * "Bereich Main Street, U.S.A.." on 30 ride pages across five locales. English
 * escaped it only because its `factLand` reads "{land} area", putting the
 * abbreviation's period mid-clause.
 *
 * One period is also what the abbreviation and the sentence are supposed to
 * share — this drops the duplicate rather than the abbreviation's own.
 */
function endOfSentence(text: string): string {
  return text.endsWith('.') ? text.slice(0, -1) : text;
}

/**
 * The clause list opens a sentence of its own, so it starts with a capital —
 * otherwise the snippet reads ". built by Bolliger & Mabillard". Every locale
 * here is Latin script, so upper-casing the first character is the whole job.
 */
function sentenceCase(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
