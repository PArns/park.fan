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
 * Resolves a curated ride profile's glossary term ids into names, links, definitions and rail
 * metadata. One shared function, so the header's figure count and the rail agree: ids this app has
 * no glossary entry for are dropped. Order and repeats are kept, because the list is the layout
 * walkthrough; see docs/rules/ride-and-glossary-link.md.
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

  // A ride that launches twice is a multi-launch coaster, read off the figures rather than a
  // second curated field. It still links `launch-coaster`: multi-launch is a count of launches,
  // not a different piece of engineering.
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
 * Whether the profile has anything for the facts grid (manufacturer, year, inversions, stats).
 * Exported so the section's grid and {@link rideProfileRendersFrom} ask the same question.
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
 * Whether <RideProfileSection> renders anything for this profile, given what its ids resolved to,
 * so the ride page's chapter row never offers a `#ride-profile` jump into nothing.
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
