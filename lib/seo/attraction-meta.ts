import { fitWithin, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/lib/utils/metadata';
import { parkArgs } from '@/lib/i18n/park-phrase';
import type { Locale } from '@/i18n/config';
import { formatRiderHeight } from '@/lib/utils/temperature';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import type { ParkAttraction } from '@/lib/api/types';

/** The subset of next-intl's `t` these builders need. */
type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Clauses beyond the third stop fitting in 160 characters alongside two names. */
const MAX_FACTS = 3;

/**
 * What distinguishes this ride from the next one, in the order it is worth saying. Read off the
 * attraction `generateMetadata` already holds, so it costs no request. Every clause is a noun
 * phrase or a preposition the language owns, so nothing has to agree with a park's gender.
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
 * The ride title, stepped down a ladder of templates until it fits the ~60 characters Google
 * shows, so the wait-time keyword is not the part that gets cut.
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
    : {
        park: parkName,
        inPark: parkName,
        forPark: parkName,
        parkSubject: parkName,
        inParkLeading: parkName,
      };
  return fitWithin(
    MAX_TITLE_LENGTH,
    t('titleTemplate', { attraction: attractionName, ...park }),
    t('titleTemplateShort', { attraction: attractionName, ...park }),
    t('titleTemplateBare', { attraction: attractionName })
  );
}

/**
 * The ride description, carrying whatever sets the ride apart when we know anything, and the
 * plain sentence when we do not.
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
    : {
        park: parkName,
        inPark: parkName,
        forPark: parkName,
        parkSubject: parkName,
        inParkLeading: parkName,
      };
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
 * The title of a ride that closed for good: its name, the park and that it is closed, and no
 * promise of a live wait time the page cannot keep. Same ladder as {@link buildAttractionTitle}.
 */
export function buildClosedRideTitle(
  attractionName: string,
  parkName: string,
  t: Translate,
  phrase: { locale: Locale; articleDe?: string | null }
): string {
  const park = parkArgs(phrase.locale, parkName, phrase.articleDe);
  return fitWithin(
    MAX_TITLE_LENGTH,
    t('retiredTitleTemplate', { attraction: attractionName, ...park }),
    t('retiredTitleTemplateBare', { attraction: attractionName })
  );
}

/**
 * The description of a ride that closed for good: since when, what a normal weekday cost in the
 * queue before that, and who built it and when. Every clause is a fact about this ride, so the
 * closed rides do not share one sentence (docs/blog.md §5.3).
 *
 * The page prints the same text as its intro, so the snippet and the page cannot disagree.
 *
 * `weekdayPeak` is the typical weekday's peak (`typicalWaits.weekday.typical`, the median of the
 * daily peaks), passed only when the API marks the figures `displayable`, and rounded to five
 * minutes like every wait time this site shows.
 */
export function buildClosedRideDescription(
  attractionName: string,
  parkName: string,
  closedOn: string,
  input: {
    weekdayPeak: number | null;
    manufacturer?: string | null;
    openedYear?: number | null;
  },
  t: Translate,
  phrase: { locale: Locale; articleDe?: string | null }
): string {
  const park = parkArgs(phrase.locale, parkName, phrase.articleDe);
  const lead = t('retiredLead', { attraction: attractionName, ...park, date: closedOn });
  const waits =
    input.weekdayPeak != null
      ? t('retiredWaits', { minutes: String(roundWaitTo5(input.weekdayPeak)) })
      : null;

  const facts: string[] = [];
  if (input.manufacturer) facts.push(t('factBy', { manufacturer: input.manufacturer }));
  // String(): see buildAttractionFacts — ICU would print 2002 as "2.002".
  if (input.openedYear != null) facts.push(t('factOpened', { year: String(input.openedYear) }));
  const factSentence = facts.length ? `${endOfSentence(sentenceCase(facts.join(', ')))}.` : null;

  const join = (...parts: (string | null)[]) => parts.filter(Boolean).join(' ');
  return fitWithin(
    MAX_DESCRIPTION_LENGTH,
    join(lead, waits, factSentence),
    join(lead, waits),
    join(lead, factSentence),
    lead
  );
}

/**
 * Drops a clause's trailing period, because the template closes the sentence with its own: an
 * area named "Main Street, U.S.A." would otherwise end in two.
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
