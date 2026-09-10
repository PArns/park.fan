/**
 * park.fan Coaster — do the machines in the demo park actually FIT the park?
 *
 * Every other harness in this project answers a question about the simulation or about a frame.
 * This one answers a question about world space, and it exists because nobody was asking it: the
 * plots in `lib/game/demo-park/plan.ts` were sized by the world factory, the layouts in
 * `lib/game/track/layouts.ts` and `lib/game/flumes/manifest.ts` were authored by their modules,
 * and the two were never compared. `docs/game/requests/rides.md` §5 proposed a coaster and a slide
 * with measured coordinates — and what it had measured was the STATION's distance to a footpath,
 * which is the reachability of the queue and says nothing about the other 200 m of the machine.
 * Taken as written, 24 % of that coaster was underground (-2.68 m into the ridge west of the
 * shelf) and it crossed two footpaths at 0.6 m and 2.5 m; the slide buried 16 % of its trough and
 * overhung its pad by 30 m. Both builds were green, both soaks passed, both machines took riders.
 *
 * So, per placed `coaster` and `flume` in the demo park:
 *
 *   samples below ground   0 required — the machine may not be inside the hill
 *   min clearance          the smallest gap between the track and the terrain under it
 *   over a footpath        the lowest the track passes over any path, MIN_HEADROOM required
 *   pad overhang           how far past its reserved plot the machine reaches (reported, not failed)
 *   dock to path           the queue's anchor against `paths`' 14 m service radius
 *
 * The overhang is reported rather than asserted on purpose: the plots really are smaller than the
 * machines the game ships (see STATUS.json), that is a plot-sizing decision and not a broken
 * frame, and a check that fails on it would be red for as long as the park is honest about it.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs scripts/game-fit-check.mjs
 *   … --seed=1 --samples=1500 --json=.game-render/fit.json
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Registry } from '@/lib/game/core/registry.ts';
import { buildWorld } from '@/lib/game/demo-park/index.ts';
import { sampleHeight } from '@/lib/game/terrain/index.ts';
import { buildTrack, buildOptionsFor } from '@/lib/game/track/index.ts';
import { attachFlumeContent, resolveFlume, buildFlume } from '@/lib/game/flumes/index.ts';
import { PADS, PATHS, PARK_HALF } from '@/lib/game/demo-park/plan.ts';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1'];
  })
);
const seed = Number(args.seed ?? 1);
const samples = Number(args.samples ?? 1500);
const jsonOut = args.json ?? null;

/** A train under a footbridge wants about this much air. Real parks build 3.5-4 m. */
const MIN_HEADROOM = 3.0;
/** `paths` serves this radius; a dock beyond it has a queue nobody can join. */
const SERVICE_RADIUS = 14;

const packs = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(
    readFileSync(new URL(`../lib/game/content/packs/${id}/pack.json`, import.meta.url), 'utf8')
  )
);
const registry = new Registry();
for (const pack of packs) registry.registerPack(pack);
attachFlumeContent(registry);
const world = buildWorld(seed, registry);

// ── path geometry, as segments with their own half-width ──────────────────────────────────────
const segments = [];
for (const plan of PATHS) {
  const p = plan.points;
  const n = p.length / 2;
  const last = plan.closed === true ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = (i % n) * 2;
    const b = ((i + 1) % n) * 2;
    segments.push([plan.id, p[a], p[a + 1], p[b], p[b + 1], (plan.width ?? 4) / 2]);
  }
}
function pointToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
/** Distance to the nearest path EDGE (negative means over the paving). */
function nearestPath(x, z) {
  let best = Infinity;
  let id = '';
  for (const s of segments) {
    const d = pointToSegment(x, z, s[1], s[2], s[3], s[4]) - s[5];
    if (d < best) {
      best = d;
      id = s[0];
    }
  }
  return { distance: best, id };
}

function sampleSpline(spline) {
  const length = spline.length();
  const out = [];
  for (let i = 0; i <= samples; i++) {
    const f = spline.frameAt((i / samples) * length);
    out.push([f.p[0], f.p[1], f.p[2]]);
  }
  return out;
}

function measure(label, points, padId, dock) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const zs = points.map((p) => p[2]);
  let below = 0;
  let minClearance = Infinity;
  let minClearanceAt = null;
  let overPath = Infinity;
  let overPathId = '';
  let outside = 0;
  for (const p of points) {
    const ground = sampleHeight(world.terrain, p[0], p[2]);
    const clearance = p[1] - ground;
    if (clearance < 0) below++;
    if (clearance < minClearance) {
      minClearance = clearance;
      minClearanceAt = p;
    }
    if (Math.abs(p[0]) > PARK_HALF || Math.abs(p[2]) > PARK_HALF) outside++;
    const near = nearestPath(p[0], p[2]);
    if (near.distance < 0 && clearance < overPath) {
      overPath = clearance;
      overPathId = near.id;
    }
  }
  const pad = PADS.find((p) => p.id === padId) ?? null;
  let overhang = null;
  if (pad) {
    overhang = {
      west: +(pad.x - pad.halfX - Math.min(...xs)).toFixed(1),
      east: +(Math.max(...xs) - (pad.x + pad.halfX)).toFixed(1),
      south: +(pad.z - pad.halfZ - Math.min(...zs)).toFixed(1),
      north: +(Math.max(...zs) - (pad.z + pad.halfZ)).toFixed(1),
    };
  }
  const dockNear = dock ? nearestPath(dock.x, dock.z) : null;
  return {
    label,
    box: {
      x: [+Math.min(...xs).toFixed(1), +Math.max(...xs).toFixed(1)],
      y: [+Math.min(...ys).toFixed(1), +Math.max(...ys).toFixed(1)],
      z: [+Math.min(...zs).toFixed(1), +Math.max(...zs).toFixed(1)],
    },
    below,
    samples: points.length,
    minClearance: +minClearance.toFixed(2),
    minClearanceAt: minClearanceAt?.map((v) => +v.toFixed(1)) ?? null,
    overPath: overPath === Infinity ? null : +overPath.toFixed(2),
    overPathId: overPath === Infinity ? null : overPathId,
    outside,
    pad: padId,
    overhang,
    dock: dock ? { x: +dock.x.toFixed(1), z: +dock.z.toFixed(1) } : null,
    dockToPath: dockNear ? +dockNear.distance.toFixed(1) : null,
    dockPath: dockNear ? dockNear.id : null,
  };
}

const reports = [];
for (const entity of Object.values(world.entities)) {
  if (entity.kind === 'coaster') {
    const data = entity.data;
    const built = buildTrack(data, buildOptionsFor(registry, data));
    // The dock is the head of the station, which is where the first piece starts.
    const head = built.spline.frameAt(0).p;
    reports.push(
      measure(`coaster ${entity.pack}:${entity.item}`, sampleSpline(built.spline), 'coaster', {
        x: head[0],
        z: head[2],
      })
    );
    reports[reports.length - 1].closure = {
      position: +built.closure.position.toFixed(2),
      heading: +built.closure.heading.toFixed(1),
    };
    reports[reports.length - 1].warnings = built.warnings;
  }
  if (entity.kind === 'flume') {
    const ground = sampleHeight(world.terrain, entity.position[0], entity.position[2]);
    const resolved = resolveFlume(registry, entity, ground);
    if (!resolved) continue;
    const built = buildFlume(resolved);
    reports.push(
      measure(`flume ${entity.pack}:${entity.item}`, sampleSpline(built.spline), 'flumes', {
        x: entity.position[0],
        z: entity.position[2],
      })
    );
    reports[reports.length - 1].warnings = built.warnings;
  }
}

let failures = 0;
const check = (ok, text) => {
  console.log(`  ${ok ? '✓' : '✗'} ${text}`);
  if (!ok) failures++;
};

console.log(`demo park fit, seed ${seed}, ${samples} samples per machine\n`);
for (const r of reports) {
  console.log(r.label);
  console.log(
    `    box x ${r.box.x[0]}..${r.box.x[1]}  y ${r.box.y[0]}..${r.box.y[1]}  z ${r.box.z[0]}..${r.box.z[1]}`
  );
  if (r.overhang) {
    console.log(
      `    past the "${r.pad}" plot: W ${r.overhang.west} E ${r.overhang.east} ` +
        `S ${r.overhang.south} N ${r.overhang.north} m`
    );
  }
  check(
    r.below === 0,
    `nothing underground (${r.below}/${r.samples}, min clearance ${r.minClearance} m at ${r.minClearanceAt?.join(', ')})`
  );
  check(r.outside === 0, `inside the park (${r.outside} samples out)`);
  check(
    r.overPath === null || r.overPath >= MIN_HEADROOM,
    r.overPath === null
      ? 'crosses no footpath'
      : `${r.overPath} m over the "${r.overPathId}" path (needs ${MIN_HEADROOM})`
  );
  check(
    r.dockToPath !== null && r.dockToPath <= SERVICE_RADIUS,
    `dock ${r.dockToPath} m from the "${r.dockPath}" path (service radius ${SERVICE_RADIUS})`
  );
  if (r.closure)
    console.log(`    closure residual ${r.closure.position} m, heading ${r.closure.heading}°`);
  if (r.warnings?.length) console.log(`    warnings: ${r.warnings.join(' · ')}`);
  console.log();
}

if (!reports.length) {
  console.log('  ✗ the demo park contains no coaster and no flume');
  failures++;
}

console.log(failures === 0 ? 'fit check clean' : `fit check: ${failures} failed`);
if (jsonOut) {
  await mkdir(path.dirname(jsonOut), { recursive: true });
  await writeFile(jsonOut, JSON.stringify({ seed, samples, reports }, null, 2));
  console.log(`→ ${jsonOut}`);
}
process.exit(failures === 0 ? 0 : 1);
