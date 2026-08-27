import { cache } from 'react';
import { getTranslations } from 'next-intl/server';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { buildGlossaryTermHref } from '@/lib/glossary/segments';
import { hasCoasterElement } from '@/lib/three/coaster/elements';
import { getElementKind, type ElementKind } from './element-kinds';
import type { Locale } from '@/i18n/config';
import type { RideProfile } from '@/lib/api/types';

/**
 * Figures that are a powered acceleration of the train.
 *
 * The `launch` element KIND is not the same question: it groups everything that
 * hands the train its energy, lift hills and first drops included, because that
 * is what the rail needs to colour. A lift hill is not a launch, so counting
 * kinds here would call every coaster with a lift and a drop a multi-launch.
 */
const LAUNCH_ELEMENT_IDS = new Set(['launch', 'swing-launch']);

/** A launch coaster with more than one launch is a multi-launch coaster. */
const MULTI_LAUNCH_MIN = 2;
const LAUNCH_COASTER_TERM_ID = 'launch-coaster';

export interface ResolvedElement {
  id: string;
  name: string;
  href: string;
  shortDefinition: string;
  kind: ElementKind;
  /** Coaster-element id for the 3-D player, or null when the term has no scene. */
  playerElement: string | null;
}

export interface ResolvedTypeTerm {
  id: string;
  name: string;
  href: string;
}

export interface ResolvedRideProfile {
  elements: ResolvedElement[];
  types: ResolvedTypeTerm[];
  /** Link for the manufacturer name, or null when no glossary term matches it. */
  manufacturerHref: string | null;
}

/**
 * Resolves a curated ride profile's glossary term ids into everything the UI
 * needs: names, links, definitions and rail metadata.
 *
 * This exists as ONE shared function on purpose. The page header claims a
 * figure count while the profile section renders the figures, and the two are
 * built from the same list only if they resolve it the same way — ids this app
 * has no glossary entry for are dropped (the API is free to be seeded with a
 * term before the glossary entry lands here), so counting `profile.elements`
 * directly would promise nine figures where the rail shows seven.
 *
 * Element ORDER and REPEATS are preserved. The list is the layout walkthrough,
 * so two corkscrews in a row must read as two steps — never dedupe or sort it.
 */
export const resolveRideProfile = cache(async function resolveRideProfile(
  profile: RideProfile,
  locale: Locale
): Promise<ResolvedRideProfile> {
  const terms = await getGlossaryTerms(locale);
  const byId = new Map(terms.map((term) => [term.id, term]));

  const elements: ResolvedElement[] = [];
  for (const id of profile.elements) {
    const term = byId.get(id);
    if (!term) continue;
    const player = term.player?.element;
    elements.push({
      id,
      name: term.name,
      href: buildGlossaryTermHref(locale, term.slug),
      shortDefinition: term.shortDefinition,
      kind: getElementKind(id),
      // A term can name a scene the renderer does not know — check both.
      playerElement: player && hasCoasterElement(player) ? player : null,
    });
  }

  // "Launch Coaster" undersells a ride that launches you twice, and the seed
  // does not carry the distinction — but the layout does, so read it off the
  // figures rather than asking curators to keep a second field in sync. The
  // term it links to stays `launch-coaster`: the glossary explains launches,
  // and multi-launch is a count of them, not a different piece of engineering.
  const launchCount = elements.filter((element) => LAUNCH_ELEMENT_IDS.has(element.id)).length;
  const isMultiLaunch = launchCount >= MULTI_LAUNCH_MIN;
  const t = await getTranslations({ locale, namespace: 'attraction.rideProfile' });

  const types: ResolvedTypeTerm[] = [];
  for (const id of profile.types) {
    const term = byId.get(id);
    if (!term) continue;
    types.push({
      id,
      name: isMultiLaunch && id === LAUNCH_COASTER_TERM_ID ? t('multiLaunchCoaster') : term.name,
      href: buildGlossaryTermHref(locale, term.slug),
    });
  }

  const manufacturerTerm = profile.manufacturerTermId
    ? byId.get(profile.manufacturerTermId)
    : undefined;

  return {
    elements,
    types,
    manufacturerHref: manufacturerTerm
      ? buildGlossaryTermHref(locale, manufacturerTerm.slug)
      : null,
  };
});

/**
 * Has the profile anything for the facts grid — manufacturer, year, inversions, stats?
 *
 * The half of "does this render" that needs no term resolution. Exported because the section
 * draws that grid conditionally and used to carry its own copy of this expression: the predicate
 * below was single-sourced while the expression inside it was not, which is the same drift one
 * step down.
 */
export function hasRideProfileFacts(profile: RideProfile): boolean {
  return (
    Boolean(profile.manufacturer) ||
    profile.openedYear != null ||
    profile.inversions != null ||
    (profile.stats ?? null) !== null
  );
}

/**
 * Does <RideProfileSection> render anything for this profile, given what its ids resolved to?
 *
 * The section returns null when the curated ids resolve to no elements and no types and the
 * profile carries no facts either — so the ride page's chapter row has to ask before offering a
 * jump to `#ride-profile`. One definition, so the row cannot offer an anchor the section declines
 * to render: the first version of the row used `!!attraction.rideProfile` and pointed into nothing
 * whenever a rename left a profile with no resolvable ids in it.
 *
 * Takes the resolved value rather than fetching it, for the caller that has one already.
 */
export function rideProfileRendersFrom(
  profile: RideProfile,
  resolved: Pick<ResolvedRideProfile, 'elements' | 'types'>
): boolean {
  return resolved.elements.length > 0 || resolved.types.length > 0 || hasRideProfileFacts(profile);
}

/** The same question for a caller holding only the profile — e.g. the ride page's chapter row. */
export async function rideProfileRenders(profile: RideProfile, locale: Locale): Promise<boolean> {
  return rideProfileRendersFrom(profile, await resolveRideProfile(profile, locale));
}
