// Publishes the park and ride card photos to the R2 bucket behind media.park.fan, for the native
// app (PAR-1080). The photo per park and per ride is the one the website's cards show: this
// script asks the same resolvers `getCardImageMap()` uses (`getParkBackground`, `getRideImage`).
//
// Every photo is encoded as WebP at WIDTHS (never upscaled) under `<id>/<version>-<w>.webp`.
// `version` changes only with the pixels or the focal point, so a key is immutable and an
// existing key is never uploaded twice. `index.json` maps parks and rides to their photo and
// carries focal point and credit; it is the only object that changes in place.
//
//   pnpm publish:media                    upload (needs R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)
//   pnpm publish:media --out <dir>        write the same files to a folder instead, no credentials
//
// Run `pnpm generate:media` first; the manifest is generated and gitignored.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { AwsClient } from 'aws4fetch';
import sharp from 'sharp';

import { getCreditLine, needsAttribution } from '../lib/media/credit.ts';
import { MEDIA_IMAGES, getParkBackground, getRideImage } from '../lib/media/index.ts';
import { MEDIA_PARK_PATH_BY_SLUG } from '../lib/media/manifest-parks.ts';

const WIDTHS = [400, 828, 1200, 1600];
const QUALITY = 78;
const IMMUTABLE = 'public, max-age=31536000, immutable';
// The index changes whenever a photo does; five minutes keeps the app at most that far behind.
const INDEX_CACHE = 'public, max-age=300';

const outArg = process.argv.indexOf('--out');
const outDir = outArg > 0 ? process.argv[outArg + 1] : null;

/** Park key: the API's geo path, unambiguous where two parks share a slug (`disneyland-park`). */
function parkKey(image) {
  return image.parkPath ?? MEDIA_PARK_PATH_BY_SLUG[image.park] ?? null;
}

const chosen = new Map(); // id → image
const parks = {};
const rides = {};
for (const image of MEDIA_IMAGES) {
  if (!image.park) continue;
  const path = parkKey(image);
  if (!path) continue;
  const background = getParkBackground(image.park);
  if (background && background.credit.license !== 'unknown') {
    parks[path] = background.id;
    chosen.set(background.id, background);
  }
  for (const rideSlug of image.ride ? [image.ride, ...image.alsoRides] : image.alsoRides) {
    const ride = getRideImage(image.park, rideSlug);
    // Rights not established: the website still shows it, the app leaves it out until they are.
    if (!ride || ride.credit.license === 'unknown') continue;
    rides[`${path}/${rideSlug}`] = ride.id;
    chosen.set(ride.id, ride);
  }
}

const images = {};
const files = []; // { key, body, contentType, cacheControl }
for (const image of chosen.values()) {
  const widths = WIDTHS.filter((w) => w <= image.width);
  if (widths.length === 0) widths.push(image.width);
  images[image.id] = {
    v: image.version,
    w: image.width,
    h: image.height,
    widths,
    focus: image.focus ?? null,
    credit: getCreditLine(image),
    attribution: needsAttribution(image),
  };
  for (const w of widths) {
    files.push({ key: `${image.id}/${image.version}-${w}.webp`, image, width: w });
  }
}

const index = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  base: 'https://media.park.fan',
  pattern: '{id}/{v}-{width}.webp',
  parks,
  rides,
  images,
};

async function encode({ image, width }) {
  return sharp(join('public', image.src))
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 5 })
    .toBuffer();
}

if (outDir) {
  for (const file of files) {
    const target = join(outDir, file.key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await encode(file));
  }
  await writeFile(join(outDir, 'index.json'), JSON.stringify(index));
  console.log(`✅ ${chosen.size} photos, ${files.length} files, index.json → ${outDir}`);
  process.exit(0);
}

const { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error(
    'R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set (or pass --out <dir>).'
  );
  process.exit(1);
}
const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: 's3',
  region: 'auto',
});
const url = (key) => `${R2_ENDPOINT.replace(/\/$/, '')}/${R2_BUCKET}/${key}`;

async function put(key, body, contentType, cacheControl) {
  const res = await r2.fetch(url(key), {
    method: 'PUT',
    body,
    headers: { 'Content-Type': contentType, 'Cache-Control': cacheControl },
  });
  if (!res.ok) throw new Error(`PUT ${key}: ${res.status} ${await res.text()}`);
}

let uploaded = 0;
for (const file of files) {
  const head = await r2.fetch(url(file.key), { method: 'HEAD' });
  if (head.ok) continue;
  if (head.status !== 404) throw new Error(`HEAD ${file.key}: ${head.status}`);
  await put(file.key, await encode(file), 'image/webp', IMMUTABLE);
  uploaded++;
}
// Last, so the index never names a file that is not there yet.
await put('index.json', JSON.stringify(index), 'application/json', INDEX_CACHE);
console.log(
  `✅ ${chosen.size} photos, ${files.length} files (${uploaded} new), index.json → ${R2_BUCKET}`
);
