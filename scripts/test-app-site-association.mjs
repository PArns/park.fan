/**
 * Unit tests for `/.well-known/apple-app-site-association` (`lib/apple-app-site-association.ts`):
 * which park.fan links iOS hands to the app. Apple takes the first component whose `/` pattern
 * matches the whole path (`*` any run of characters, `?` one), and a path no component matches
 * stays in Safari. The matcher below reads the file the way iOS does.
 *
 * Run: pnpm test:app-site-association
 */
import { appleAppSiteAssociation, IOS_APP_ID } from '../lib/apple-app-site-association.ts';
import { GET } from '../app/.well-known/apple-app-site-association/route.ts';

let failed = 0;
const check = (actual, expected, name) => {
  if (actual === expected) return console.log(`  ok  ${name}`);
  failed++;
  console.error(`FAIL  ${name}: expected ${expected}, got ${actual}`);
};

const [details] = appleAppSiteAssociation().applinks.details;
const glob = (pattern) =>
  new RegExp(
    `^${pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')}$`
  );
const opensApp = (path) => {
  const hit = details.components.find((c) => glob(c['/']).test(path));
  return hit !== undefined && hit.exclude !== true;
};

check(details.appIDs.join(), IOS_APP_ID, 'one app: the team id and the bundle id');

for (const path of [
  '/',
  '/de',
  '/de/parks/europe/germany/bruehl/phantasialand',
  '/parks/europe/germany/bruehl/phantasialand/taron',
  '/fr/parks/europe/germany/bruehl/phantasialand/calendrier-temps-attente/2026/12',
  '/de/parks/europe/germany/bruehl/phantasialand/mit-kindern',
  '/en/parks/europe/germany',
  '/de/news/europa-park-wintersaison',
  '/blog/freizeitpark-packliste',
  '/de/favorites',
  '/parky',
  '/de/trip-planner',
]) {
  check(opensApp(path), true, `the app opens ${path}`);
}

for (const path of [
  '/admin',
  '/admin/parks',
  '/api/assistant/chat',
  '/de/account',
  '/login',
  '/de/alerts',
  '/de/impressum',
  '/de/datenschutz',
  '/de/parks/europe/germany/longest-wait-times/2026',
  '/en/parks/longest-wait-times',
  '/de/parks/six-flags',
  '/de/news/page/2',
  '/de/blog/tag/coaster',
  '/de/trip-planner/shared',
  '/de/glossary/airtime',
]) {
  check(opensApp(path), false, `${path} stays in Safari`);
}

const response = GET();
check(response.headers.get('Content-Type'), 'application/json', 'served as application/json');
check(
  JSON.parse(await response.text()).applinks.details[0].appIDs[0],
  IOS_APP_ID,
  'the body is the file'
);

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
