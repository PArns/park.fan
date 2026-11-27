// Checks the Cloudflare purge a production deploy sends (lib/cloudflare/deploy-purge.ts): every
// route directory in `app/` is either purged or kept on purpose, the OG cards are never purged,
// and every call stays inside Cloudflare's per-call limit.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deployPurgeBodies,
  KEPT_API_DIRS,
  PURGE_BATCH_SIZE,
  PURGED_API_DIRS,
} from '../lib/cloudflare/deploy-purge.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
let failed = 0;
function check(name, ok, detail = '') {
  if (ok) console.log(`✅ ${name}`);
  else {
    failed++;
    console.error(`❌ ${name}${detail ? `: ${detail}` : ''}`);
  }
}

const apiDirs = readdirSync(join(root, 'app/api'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const listed = new Set([...PURGED_API_DIRS, ...KEPT_API_DIRS]);
const unlisted = apiDirs.filter((dir) => !listed.has(dir));
check('every app/api directory is purged or kept', unlisted.length === 0, unlisted.join(', '));
const stale = [...listed].filter((dir) => !apiDirs.includes(dir));
check('no listed directory is missing from app/api', stale.length === 0, stale.join(', '));

const bodies = deployPurgeBodies('park.fan');
const prefixes = bodies.flatMap((body) => body.prefixes ?? []);
const files = bodies.flatMap((body) => body.files ?? []);
const all = [...prefixes, ...files];

const keptPath = /^(https:\/\/)?park\.fan\/(api\/og|media|_next)(\/|$)/;
check(
  'OG cards, photos and Next assets are never purged',
  !all.some((target) => keptPath.test(target)),
  all.filter((target) => keptPath.test(target)).join(', ')
);
check(
  'no prefix covers the whole host',
  !prefixes.some((prefix) => prefix === 'park.fan' || prefix === 'park.fan/')
);
check(
  'the six locale prefixes are purged',
  ['de', 'en', 'nl', 'fr', 'es', 'it'].every((l) => prefixes.includes(`park.fan/${l}/`))
);
check(
  'each locale home page is purged',
  ['de', 'en', 'nl', 'fr', 'es', 'it'].every((l) => files.includes(`https://park.fan/${l}`))
);
check(
  'robots.txt and the sitemaps are purged',
  files.includes('https://park.fan/robots.txt') && prefixes.includes('park.fan/sitemap')
);
check(
  'prefixes carry no scheme',
  prefixes.every((prefix) => !prefix.includes('://'))
);
check(
  'files are absolute URLs',
  files.every((file) => file.startsWith('https://park.fan/'))
);
check(
  `every call stays within ${PURGE_BATCH_SIZE} items`,
  bodies.every((body) => (body.prefixes ?? body.files).length <= PURGE_BATCH_SIZE)
);
check(
  'a call never mixes prefixes and files',
  bodies.every((body) => !('prefixes' in body && 'files' in body))
);

// Root route files and directories outside [locale], api and admin must be covered by a root
// file or prefix, or a deploy would leave them stale.
const rootRoutes = readdirSync(join(root, 'app'), { withFileTypes: true })
  .map((entry) => entry.name)
  .filter((name) => !name.startsWith('[') && !['api', 'admin'].includes(name))
  .filter((name) => !/\.(tsx?|css)$/.test(name) && name !== 'favicon.ico');
const uncovered = rootRoutes.filter((name) => {
  const path = `/${name}`;
  return (
    !files.includes(`https://park.fan${path}`) &&
    !prefixes.some((prefix) => `park.fan${path}/`.startsWith(prefix))
  );
});
check('every root route in app/ is purged', uncovered.length === 0, uncovered.join(', '));

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
