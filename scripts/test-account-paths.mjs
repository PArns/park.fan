// Where the visitor sign-in sends somebody afterwards: a path on park.fan, without its locale, and
// never another site.
import { safeNextPath } from '../lib/account/paths.ts';
import { runCases } from './lib/run-cases.mjs';

const testCases = [
  {
    name: 'a path on the site is kept',
    actual: () => safeNextPath('/favorites'),
    expected: '/favorites',
  },
  {
    name: 'a leading locale is dropped',
    actual: () => safeNextPath('/de/impressum'),
    expected: '/impressum',
  },
  {
    name: 'other sites, protocol-relative and backslash paths go to the account',
    actual: () =>
      ['https://evil.example', '//evil.example', '/\\evil.example', '', null].map(safeNextPath),
    expected: ['/account', '/account', '/account', '/account', '/account'],
  },
];

console.log('\n🔐 Sign-in return path\n');
await runCases(testCases, { json: true });
