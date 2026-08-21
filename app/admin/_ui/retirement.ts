import { adminFetch } from '../_lib/api';

/**
 * Stilllegen und Zurückholen, an einer Stelle.
 *
 * Zwei Oberflächen stellen dieselbe Frage: die Arbeitsliste unter
 * `/admin/retirement`, die Kandidaten vorlegt, und die Seite einer einzelnen
 * Bahn, wo die Antwort oft erst entsteht — man schaut sich das Ride-Profil an,
 * sieht den Verlauf, und stellt dabei fest, dass es die Bahn nicht mehr gibt.
 * Der Weg dorthin war bis eben ein Umweg über eine Liste, in der sie nur steht,
 * solange der Detector sie vorlegt.
 *
 * Geteilt wird das, was nicht auseinanderlaufen darf: welcher Endpunkt, welche
 * Pflichtangaben, welche Caches danach ungültig sind. Das Layout nicht — eine
 * Zeile in einer Arbeitsliste und ein Kopfbereich sind verschiedene Dinge.
 */

/** Der Tag, den `<input type="date">` und die API gleichermaßen wollen. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Grund und Quelle sind Pflicht.
 *
 * Eine Stilllegung ist eine Behauptung über die Welt und lässt sich nicht
 * zurücknehmen, ohne dass jemand sie bemerkt: die Bahn verschwindet aus jeder
 * Liste und aus der Sitemap. Ohne aufgeschriebenen Grund steht später niemand
 * für die Entscheidung ein.
 */
export const RETIRE_REASON_REQUIRED =
  'Grund und Quelle sind Pflicht. Ohne sie steht später niemand für die Entscheidung ein.';

/** Query-Präfixe, die eine Stilllegung ungültig macht. */
export const RETIREMENT_KEYS = [
  ['admin', 'retirement-candidates'] as const,
  ['admin', 'retired-attractions'] as const,
];

export function retireAttraction(input: {
  attractionId: string;
  retiredAt: string;
  reason: string;
}): Promise<unknown> {
  return adminFetch('/api/admin/retire-attractions', {
    method: 'POST',
    body: { retirements: [input] },
  });
}

export function unretireAttraction(attractionId: string): Promise<unknown> {
  return adminFetch(`/api/admin/unretire-attraction/${attractionId}`, { method: 'POST' });
}
