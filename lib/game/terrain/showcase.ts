/**
 * `/game?showcase=terrain` — one piece of landscape that has to answer for the whole module: the
 * escarpment in the north, the meadow and terrace in the middle, and the lake in the south with a
 * stone causeway running out into it.
 *
 * The sculpting happens here rather than in `main()` because `main()` also runs for a real park,
 * where the world arrives with its own heights. Core stages the showcase after the main handles are
 * created and before the worker is started, so writing straight into `ctx.world.terrain` reaches
 * the simulation's copy too; the renderer is told about it with the same `terrain:changed` event a
 * sculpt tool would send.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { MainContext, TerrainData } from '../core/types';
import { generateShowcaseLandscape } from './landscape';

export async function stageTerrainShowcase(ctx: MainContext): Promise<void> {
  const terrain = ctx.world.terrain as TerrainData;
  generateShowcaseLandscape(terrain, { seed: ctx.world.meta.seed, waterLevel: 0 });
  ctx.events.emit('terrain:changed', { rect: null });

  // A default framing for someone opening the page by hand. The harness overrides it with the
  // `overview` / `close` / `ground` presets, which this landscape is laid out around.
  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.35;
    camera.beta = Math.PI / 3.1;
    camera.radius = 300;
    camera.target.set(-10, 4, 20);
  }
}
