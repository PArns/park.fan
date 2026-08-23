/**
 * The derived size of a build-time crop, checked against the files actually on disk.
 *
 * Run: pnpm test:crop-box
 *
 * `lib/media/crop-box.mjs` is imported by two sides that must agree: the generator CUTS the crops
 * with it, and the runtime STATES their dimensions with it so an inline blog image can reserve its
 * box before the bytes arrive. They share one function precisely so they cannot drift — this test
 * guards the other half of that contract, that the shared function still describes what sharp
 * actually wrote. A `resize`/`extract` behaviour change upstream would otherwise surface as
 * articles quietly reflowing again, with a green build.
 *
 * Two parts:
 *   - pure assertions on the geometry, including the asymmetry that makes it non-obvious
 *     (a 4:3 source loses HEIGHT for 16:9 but WIDTH for 1:1)
 *   - a sweep over every crop the manifest lists, compared to its real pixel size
 *
 * The crops are gitignored and regenerated on every build, so the sweep SKIPS rather than fails
 * when they are absent (a fresh clone, or CI before `pnpm generate:image-crops`).
 */

import { existsSync } from 'node:fs';
import { cropBox, cropDimensionsForPath, cropSuffixForPath } from '../lib/media/crop-box.mjs';
import { MEDIA_IMAGES } from '../lib/media/manifest.ts';

let failures = 0;

const check = (label, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`  ❌ ${label}\n       expected ${e}\n       got      ${a}`);
    failures++;
  }
};

// ── Geometry ────────────────────────────────────────────────────────────────
// A 1024×768 source (4:3). Widening to 16:9 keeps the width and crops height; squaring to 1:1
// keeps the height and crops width. Getting that backwards is the whole reason this is shared.
check('4:3 source → 16:9', cropBox(1024, 768, 16, 9), { w: 1024, h: 576 });
check('4:3 source → 4:3 (identity)', cropBox(1024, 768, 4, 3), { w: 1024, h: 768 });
check('4:3 source → 1:1', cropBox(1024, 768, 1, 1), { w: 768, h: 768 });

// A portrait source sits on the other side of every target, so every crop loses width.
check('portrait → 16:9', cropBox(768, 1024, 16, 9), { w: 768, h: 432 });
check('portrait → 1:1', cropBox(768, 1024, 1, 1), { w: 768, h: 768 });

// Never upscales: a source already wider than the target keeps its full height.
check('panorama → 16:9', cropBox(3000, 1000, 16, 9), { w: 1778, h: 1000 });

// ── Path parsing ────────────────────────────────────────────────────────────
check('suffix of a crop', cropSuffixForPath('/media/x/taron-16x9.jpg'), '16x9');
check('suffix survives ?v=', cropSuffixForPath('/media/x/taron-4x3.jpg?v=abc'), '4x3');
check('base image has none', cropSuffixForPath('/media/x/taron.jpg'), null);
check('a ratio mid-name is not a suffix', cropSuffixForPath('/media/x/taron-16x9-final.jpg'), null);
check('non-string', cropSuffixForPath(undefined), null);
check('unknown source size', cropDimensionsForPath('/media/x/a-1x1.jpg', 0, 0), null);

// ── Against the real files ──────────────────────────────────────────────────
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  sharp = null;
}

const variants = MEDIA_IMAGES.flatMap((img) =>
  (img.variants ?? []).map((v) => ({ v, w: img.width, h: img.height }))
);
const present = variants.filter(({ v }) => existsSync(`public${v.split('?')[0]}`));

let swept = 0;
if (!sharp) {
  console.log('ℹ️  sharp unavailable — skipped the on-disk sweep.');
} else if (present.length === 0) {
  console.log('ℹ️  no crops on disk (gitignored) — run `pnpm generate:image-crops` to sweep them.');
} else {
  for (const { v, w, h } of present) {
    const file = `public${v.split('?')[0]}`;
    const meta = await sharp(file).metadata();
    const derived = cropDimensionsForPath(v, w, h);
    swept++;
    if (!derived || derived.width !== meta.width || derived.height !== meta.height) {
      console.error(
        `  ❌ ${v}\n       derived ${derived ? `${derived.width}x${derived.height}` : 'null'}` +
          `, on disk ${meta.width}x${meta.height}`
      );
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`\n❌ crop-box: ${failures} failure(s).`);
  console.error(
    'The generator and the runtime read the same module, so a mismatch here means what sharp\n' +
      'wrote no longer matches what crop-box.mjs describes. Blog articles will reflow on every\n' +
      'inline image again until the two agree.'
  );
  process.exit(1);
}

console.log(
  `✅ crop-box geometry holds — ${swept} of ${variants.length} crops verified against their real ` +
    `pixel size${swept < variants.length ? ' (rest not generated)' : ''}.`
);
