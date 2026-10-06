/**
 * What a track figure does to you, used to colour the ride-profile rail. Presentation, so not part
 * of the API model. An unlisted id falls back to `other` and renders neutral, which is right for
 * the concept terms in `coaster-elements` (airtime, g-force): a sensation, not a place in the
 * layout.
 */
export type ElementKind = 'launch' | 'airtime' | 'inversion' | 'turn' | 'brake' | 'other';

const KINDS: Record<string, ElementKind> = {
  // — anything that accelerates you or hands you to gravity —
  launch: 'launch',
  'swing-launch': 'launch',
  lifthill: 'launch',
  'vertical-lift': 'launch',
  'first-drop': 'launch',
  'beyond-vertical-drop': 'launch',
  'dive-drop': 'launch',
  'drop-track': 'launch',
  predrop: 'launch',
  'scorpion-tail': 'launch',

  // — hills that lift you out of the seat —
  'airtime-hill': 'airtime',
  camelback: 'airtime',
  bunnyhop: 'airtime',
  's-hill': 'airtime',
  'double-down': 'airtime',
  'quad-down': 'airtime',
  'wave-turn': 'airtime',
  'stengel-dive': 'airtime',
  // A sensation rather than a shape, but curated profiles do use it as a step,
  // and when they do it is unambiguously airtime.
  'ejector-airtime': 'airtime',

  // — anything that puts you upside down, or most of the way there —
  'vertical-loop': 'inversion',
  corkscrew: 'inversion',
  immelmann: 'inversion',
  'dive-loop': 'inversion',
  'zero-g-roll': 'inversion',
  'zero-g-stall': 'inversion',
  'zero-g-winder': 'inversion',
  'heartline-roll': 'inversion',
  'inline-twist': 'inversion',
  'barrel-roll-drop': 'inversion',
  'banana-roll': 'inversion',
  'cobra-roll': 'inversion',
  batwing: 'inversion',
  sidewinder: 'inversion',
  'pretzel-loop': 'inversion',
  'pretzel-knot': 'inversion',
  'norwegian-loop': 'inversion',
  'sea-serpent': 'inversion',
  butterfly: 'inversion',
  bowtie: 'inversion',
  cutback: 'inversion',
  'flat-spin': 'inversion',
  'top-hat': 'inversion',
  'inclined-loop': 'inversion',
  'non-inverting-loop': 'inversion',
  'interlocking-loops': 'inversion',
  'step-up-under-flip': 'inversion',
  'twisted-horseshoe-roll': 'inversion',
  'celestial-spin': 'inversion',
  stall: 'inversion',
  'cobra-loop': 'inversion',
  'jojo-roll': 'inversion',
  'flying-snake-dive': 'inversion',

  // — direction changes —
  helix: 'turn',
  overbank: 'turn',
  'outerbanked-turn': 'turn',
  'raven-turn': 'turn',
  horseshoe: 'turn',
  'high-five': 'turn',
  'treble-clef': 'turn',
  turntable: 'turn',
  'switch-track': 'turn',

  // — slowing down —
  'brake-run': 'brake',
  'block-brake': 'brake',
  'trim-brake': 'brake',
  mcbr: 'brake',
  'anti-rollback': 'brake',
  splashdown: 'brake',
};

/**
 * Returns the colour group (launch, airtime, inversion, turn, brake) of a glossary track element
 * id, or `other` for an unlisted one.
 */
export function getElementKind(termId: string): ElementKind {
  return KINDS[termId] ?? 'other';
}
