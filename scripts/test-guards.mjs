/**
 * The checks that stand between a request and something it must not reach: the admin role gate
 * (`adminGuardRefusal`, behind every `requireAdmin`), the shared-secret gate of the crons and
 * `/api/revalidate` (`bearerUnauthorized`), and the slug check every catch-all API route runs
 * before it builds a backend URL (`isSlugPath`). None of them shows anything when it breaks; a
 * broken one opens a door.
 *
 * Run: pnpm test:guards
 */
import { adminGuardRefusal } from '../lib/admin/roles.ts';
import { bearerUnauthorized } from '../lib/security/cron-auth.ts';
import { isSlugPath } from '../lib/utils/servable-route.ts';

let passed = 0;
let failed = 0;
function check(name, ok) {
  if (ok) {
    passed++;
  } else {
    failed++;
    console.log(`❌ FAIL: ${name}`);
  }
}

// --- adminGuardRefusal ---------------------------------------------------------------------------

const who = (role, mustChangePassword = false) => ({ role, mustChangePassword });

check('no identity is a 401', adminGuardRefusal(null, 'viewer')?.status === 401);
check(
  'an account owing a password change is a 403 even as owner',
  adminGuardRefusal(who('owner', true), 'viewer')?.status === 403
);
check(
  'a viewer on an author route is a 403',
  adminGuardRefusal(who('viewer'), 'author')?.status === 403
);
check(
  'an author on an editor route is a 403',
  adminGuardRefusal(who('author'), 'editor')?.status === 403
);
check('an author on an author route passes', adminGuardRefusal(who('author'), 'author') === null);
check('an owner passes everything', adminGuardRefusal(who('owner'), 'owner') === null);
check(
  'a role the frontend does not know is refused, not ranked as zero',
  adminGuardRefusal(who('superuser'), 'viewer')?.status === 403
);

// --- bearerUnauthorized --------------------------------------------------------------------------

const ENV = 'TEST_GUARD_SECRET';
const req = (authorization) =>
  new Request('https://park.fan/api/cron/x', {
    headers: authorization === undefined ? {} : { authorization },
  });

delete process.env[ENV];
check(
  'an unset secret disables the route with 503',
  bearerUnauthorized(req('Bearer x'), ENV)?.status === 503
);
check(
  'an unset secret does not accept "Bearer undefined"',
  bearerUnauthorized(req('Bearer undefined'), ENV)?.status === 503
);

process.env[ENV] = 's3cret';
check('the right bearer passes', bearerUnauthorized(req('Bearer s3cret'), ENV) === null);
check('no header is a 401', bearerUnauthorized(req(undefined), ENV)?.status === 401);
check('a wrong secret is a 401', bearerUnauthorized(req('Bearer s3creT'), ENV)?.status === 401);
check(
  'a prefix of the secret is a 401',
  bearerUnauthorized(req('Bearer s3cre'), ENV)?.status === 401
);
check(
  'the bare secret without "Bearer" is a 401',
  bearerUnauthorized(req('s3cret'), ENV)?.status === 401
);
delete process.env[ENV];

// --- isSlugPath ----------------------------------------------------------------------------------

check('geo slugs pass', isSlugPath(['europe', 'germany', 'rust', 'europa-park']));
check('".." is refused', !isSlugPath(['europe', '..']));
check('a decoded "/" inside a segment is refused', !isSlugPath(['a/b']));
check('a dot is refused', !isSlugPath(['x.y']));
check('an empty segment is refused', !isSlugPath(['']));
check('upper case is refused', !isSlugPath(['Europe']));

console.log(`\n📊 Results: ${passed}/${passed + failed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
