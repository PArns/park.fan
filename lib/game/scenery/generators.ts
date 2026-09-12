/**
 * The generator table: the one place a `procedural` name from a pack manifest becomes geometry.
 *
 * `catalog.ts` decides *which* name applies (including the fallback chain); this decides what that
 * name builds. Registering into `ctx.registry.registerProcedural` as well is deliberate: it is the
 * core-owned seam other modules and the tools use to ask "can this be drawn", and it means a
 * builder who adds a generator here does not also have to edit anything outside this folder.
 */

import type { Generator } from './gen-foliage';
import {
  flowers,
  grassTuft,
  hedge,
  shrub,
  treeBroadleaf,
  treeConifer,
  treePalm,
} from './gen-foliage';
import {
  bench,
  bin,
  entranceArch,
  fenceIron,
  flag,
  fountainTier,
  lampModern,
  lampVictorian,
  lightStrip,
  lounger,
  marker,
  neonPalm,
  parasol,
  planterRound,
  rock,
  signPost,
} from './gen-props';

export const GENERATOR_TABLE: Record<string, Generator> = {
  'tree-broadleaf': treeBroadleaf,
  'tree-conifer': treeConifer,
  'tree-palm': treePalm,
  shrub,
  hedge,
  flowers,
  'grass-tuft': grassTuft,
  rock,
  bench,
  bin,
  'lamp-victorian': lampVictorian,
  'lamp-modern': lampModern,
  'planter-round': planterRound,
  'fence-iron': fenceIron,
  flag,
  'entrance-arch': entranceArch,
  'sign-post': signPost,
  'fountain-tier': fountainTier,
  parasol,
  lounger,
  'light-strip': lightStrip,
  'neon-palm': neonPalm,
  marker,
};

export function generatorFor(name: string): Generator {
  return GENERATOR_TABLE[name] ?? marker;
}
