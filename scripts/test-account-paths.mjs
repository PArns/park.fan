// Where the visitor sign-in sends somebody afterwards: a path on park.fan, without its locale, and
// never another site.
import { safeNextPath } from '../lib/account/paths.ts';

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

let failed = 0;
console.log('\n🔐 Sign-in return path\n');
for (const testCase of testCases) {
  const result = testCase.actual();
  const ok = JSON.stringify(result) === JSON.stringify(testCase.expected);
  if (!ok) failed++;
  console.log(`  ${ok ? '✓' : '✗'} ${testCase.name}`);
  if (!ok)
    console.log(
      `      expected ${JSON.stringify(testCase.expected)}, got ${JSON.stringify(result)}`
    );
}
console.log(
  `\n📊 Results: ${testCases.length - failed}/${testCases.length} passed, ${failed} failed\n`
);
if (failed > 0) process.exit(1);
