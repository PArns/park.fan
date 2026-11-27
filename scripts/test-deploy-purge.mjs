// Checks the Cloudflare purge a production deploy sends (lib/cloudflare/deploy-purge.ts): every
// route directory and route file in `app/` and every file at the root of `public/` is purged or
// kept on purpose, nothing under `/api/og/`, `/media/` or `/_next/` is purged under either reading
// of a prefix, and every call stays inside Cloudflare's per-call limit.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deployPurgeBodies,
  KEPT_API_DIRS,
  PUBLIC_ROOT_FILES,
  PURGE_BATCH_SIZE,
  PURGED_API_DIRS,
} from '../lib/cloudflare/deploy-purge.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const HOST = 'park.fan';
const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];
let failed = 0;
function check(name, ok, detail = '') {
  if (ok) console.log(`✅ ${name}`);
  else {
    failed++;
    console.error(`❌ ${name}${detail ? `: ${detail}` : ''}`);
  }
}

const bodies = deployPurgeBodies(HOST);
const prefixes = bodies.flatMap((body) => body.prefixes ?? []);
const files = bodies.flatMap((body) => body.files ?? []);

/** Whether a URL path is purged, if a prefix is compared as a string. */
const purgedAsString = (path) =>
  files.includes(`https://${HOST}${path}`) ||
  prefixes.some((prefix) => `${HOST}${path}`.startsWith(prefix));
/** Whether a URL path is purged, if a prefix only matches whole path segments. */
const purgedBySegment = (path) =>
  files.includes(`https://${HOST}${path}`) ||
  prefixes.some(
    (prefix) => `${HOST}${path}` === prefix || `${HOST}${path}`.startsWith(`${prefix}/`)
  );
const purgedEitherWay = (path) => purgedAsString(path) && purgedBySegment(path);

const apiDirs = readdirSync(join(root, 'app/api'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const listed = new Set([...PURGED_API_DIRS, ...KEPT_API_DIRS]);
const unlisted = apiDirs.filter((dir) => !listed.has(dir));
check('every app/api directory is purged or kept', unlisted.length === 0, unlisted.join(', '));
const stale = [...listed].filter((dir) => !apiDirs.includes(dir));
check('no listed directory is missing from app/api', stale.length === 0, stale.join(', '));

const apiMissed = PURGED_API_DIRS.flatMap((dir) => [`/api/${dir}`, `/api/${dir}/x`]).filter(
  (path) => !purgedEitherWay(path)
);
check(
  'an API route at and below its directory is purged',
  apiMissed.length === 0,
  apiMissed.join(', ')
);

const localeMissed = LOCALES.flatMap((l) => [`/${l}`, `/${l}/parks/x`]).filter(
  (path) => !purgedEitherWay(path)
);
check(
  'each locale home page and its pages are purged',
  localeMissed.length === 0,
  localeMissed.join(', ')
);

const kept = ['/api/og/de/parks/og.jpg', '/media/x/y.jpg', '/_next/static/x.js', '/_next/image'];
const keptPurged = kept.filter((path) => purgedAsString(path) || purgedBySegment(path));
check(
  'OG cards, photos and Next assets are never purged',
  keptPurged.length === 0,
  keptPurged.join(', ')
);
check('no prefix covers the whole host', !prefixes.some((p) => p === HOST || p === `${HOST}/`));
check(
  'prefixes carry no scheme',
  prefixes.every((prefix) => !prefix.includes('://'))
);
check(
  'files are absolute URLs',
  files.every((file) => file.startsWith(`https://${HOST}/`))
);
check(
  `every call stays within ${PURGE_BATCH_SIZE} items`,
  bodies.every((body) => (body.prefixes ?? body.files).length <= PURGE_BATCH_SIZE)
);
check(
  'a call never mixes prefixes and files',
  bodies.every((b) => !('prefixes' in b && 'files' in b))
);

// Every route at the root of app/, outside [locale], api and admin, by the URL it serves.
const routeUrl = (name) => {
  if (name === 'manifest.ts') return '/manifest.webmanifest';
  if (name === 'sitemap.ts') return '/sitemap.xml';
  return `/${name}`;
};
const rootRoutes = readdirSync(join(root, 'app'), { withFileTypes: true })
  .map((entry) => entry.name)
  .filter((name) => !name.startsWith('[') && !['api', 'admin'].includes(name))
  .filter((name) => !/\.css$/.test(name))
  .filter((name) => !['layout.tsx', 'not-found.tsx', 'global-error.tsx'].includes(name));
const rootMissed = rootRoutes
  .map(routeUrl)
  .filter((path) => !purgedEitherWay(path) && !purgedEitherWay(`${path}/de.xml`));
check('every root route in app/ is purged', rootMissed.length === 0, rootMissed.join(', '));
check(
  'the sitemap directories are purged below them',
  ['/sitemap-attractions/de.xml', '/sitemap-calendar/de.xml'].every(purgedEitherWay)
);

const publicFiles = readdirSync(join(root, 'public'), { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => `/${entry.name}`);
const publicMissed = publicFiles.filter((path) => !PUBLIC_ROOT_FILES.includes(path));
check(
  'every file at the root of public/ is purged',
  publicMissed.length === 0,
  publicMissed.join(', ')
);
const publicStale = PUBLIC_ROOT_FILES.filter((path) => !publicFiles.includes(path));
check('no listed public file is missing', publicStale.length === 0, publicStale.join(', '));

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
