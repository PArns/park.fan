import { getGlossaryTerms } from '@/lib/glossary/translations';
import { buildGlossaryTermHref } from '@/lib/glossary/segments';
import { hasCoasterElement } from '@/lib/three/coaster/elements';
import { getElementKind, type ElementKind } from './element-kinds';
import type { Locale } from '@/i18n/config';
import type { RideProfile } from '@/lib/api/types';

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
export async function resolveRideProfile(
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

  const types: ResolvedTypeTerm[] = [];
  for (const id of profile.types) {
    const term = byId.get(id);
    if (!term) continue;
    types.push({
      id,
      name: term.name,
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
}
