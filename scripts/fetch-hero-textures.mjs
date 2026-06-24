/**
 * fetch-hero-textures.mjs
 * -----------------------
 * One-shot asset generator for the homepage three.js hero park
 * (`lib/three/park-scene.ts`). Downloads CC0 PBR texture sets from ambientCG,
 * keeps only Color + Normal(GL) + Roughness, downscales them and re-encodes as
 * small WebP files into `public/textures/hero/<name>/`.
 *
 * The sources are CC0 (public domain, https://ambientcg.com/license) — no
 * attribution is legally required, but we record provenance in
 * `public/textures/hero/CREDITS.txt` as good practice. GPL-3.0 compatible.
 *
 * This is NOT part of the build pipeline (it hits the network) — run it
 * manually when you want to refresh the textures:
 *
 *     node scripts/fetch-hero-textures.mjs
 *     # or: pnpm generate:hero-textures
 *
 * Then commit the generated files under public/textures/hero/.
 */

import sharp from 'sharp';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const OUT_DIR = join(ROOT, 'public', 'textures', 'hero');
const TMP_DIR = '/tmp/hero-textures';

// Each set: ambientCG asset id + the output resolution. Color is sRGB; the
// normal + roughness maps stay linear (handled in the scene loader).
const ASSETS = [
  { name: 'grass', id: 'Grass004', size: 1024 }, // large ground plane — a touch sharper
  { name: 'paving', id: 'PavingStones070', size: 512 }, // plaza + paths
  { name: 'stone', id: 'Bricks066', size: 512 }, // castle walls (tinted in-scene)
  { name: 'wood', id: 'Planks016', size: 512 }, // stalls, fences, benches
];

const MAPS = [
  { key: 'color', suffix: 'Color', quality: 80 },
  { key: 'normal', suffix: 'NormalGL', quality: 82 },
  { key: 'roughness', suffix: 'Roughness', quality: 75 },
];

async function run() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });

  let totalBytes = 0;
  const creditLines = [];

  for (const asset of ASSETS) {
    const zipPath = join(TMP_DIR, `${asset.id}.zip`);
    const unzipDir = join(TMP_DIR, asset.id);
    const url = `https://ambientcg.com/get?file=${asset.id}_1K-JPG.zip`;

    if (!existsSync(zipPath)) {
      console.log(`↓ downloading ${asset.id} …`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Download failed for ${asset.id}: HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(zipPath, buf);
    }

    rmSync(unzipDir, { recursive: true, force: true });
    mkdirSync(unzipDir, { recursive: true });
    execSync(`unzip -o -q "${zipPath}" -d "${unzipDir}"`);

    const outSub = join(OUT_DIR, asset.name);
    mkdirSync(outSub, { recursive: true });

    for (const map of MAPS) {
      const inFile = join(unzipDir, `${asset.id}_1K-JPG_${map.suffix}.jpg`);
      if (!existsSync(inFile)) throw new Error(`Missing map: ${inFile}`);
      const outFile = join(outSub, `${map.key}.webp`);
      const info = await sharp(inFile)
        .resize(asset.size, asset.size, { fit: 'fill' })
        .webp({ quality: map.quality })
        .toFile(outFile);
      totalBytes += info.size;
      console.log(
        `  ${asset.name}/${map.key}.webp  ${asset.size}px  ${(info.size / 1024).toFixed(0)} KB`
      );
    }

    creditLines.push(
      `- ${asset.name}: ambientCG "${asset.id}" (CC0) — https://ambientcg.com/view?id=${asset.id}`
    );
  }

  // Written as .txt (not .md): the repo .gitignore excludes *.md, and CC0 needs
  // no attribution anyway — this file is committed purely for provenance.
  writeFileSync(
    join(OUT_DIR, 'CREDITS.txt'),
    `Hero park textures\n` +
      `==================\n\n` +
      `Procedurally downscaled CC0 PBR textures used by the homepage three.js\n` +
      `hero (lib/three/park-scene.ts). Regenerate with: pnpm generate:hero-textures\n\n` +
      `All sources are CC0 / public domain (https://ambientcg.com/license) —\n` +
      `no attribution required; listed here for provenance.\n\n` +
      creditLines.join('\n') +
      '\n'
  );

  console.log(`\n✅ Hero textures written to public/textures/hero/`);
  console.log(`   Total encoded size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
