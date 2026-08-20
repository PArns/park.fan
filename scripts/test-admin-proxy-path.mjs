// Regression tests for the admin proxy's path guard.
//
// The attack this exists for: Next's route matcher splits the raw pathname on
// `/` and percent-decodes the pieces afterwards, so `%2F` and `%5C` reach the
// handler inside a single catch-all segment and only become separators once
// `new URL()` normalises the target. `auth%2F..%2F..%2Fparks` therefore
// resolved to /v1/parks — an anonymous caller could reach any path on the API
// through the admin proxy, carrying the deployment's `x-auth-key`.
//
// The segments below are what the handler receives, i.e. already decoded.
import { adminProxyPath, isSafeSegment } from '../lib/admin/proxy-path.ts';

const testCases = [
  {
    name: 'an ordinary admin path',
    actual: () => adminProxyPath(['content', 'parks', 'a3f1']),
    expected: 'content/parks/a3f1',
  },
  {
    name: 'a single segment',
    actual: () => adminProxyPath(['fields']),
    expected: 'fields',
  },
  {
    name: 'a decoded slash cannot become a separator again',
    actual: () => adminProxyPath(['auth/../../parks']),
    expected: null,
  },
  {
    name: 'a decoded backslash is refused too (WHATWG URL treats it as one)',
    actual: () => adminProxyPath(['auth\\..\\..\\parks']),
    expected: null,
  },
  {
    name: 'a bare traversal segment',
    actual: () => adminProxyPath(['content', '..', '..', 'parks']),
    expected: null,
  },
  {
    name: 'a single dot',
    actual: () => adminProxyPath(['content', '.', 'parks']),
    expected: null,
  },
  {
    name: 'an empty segment',
    actual: () => adminProxyPath(['content', '', 'parks']),
    expected: null,
  },
  {
    name: 'no segments at all',
    actual: () => adminProxyPath([]),
    expected: null,
  },
  {
    name: 'a decoded question mark cannot start a query string',
    actual: () => adminProxyPath(['parks?limit=500']),
    expected: null,
  },
  {
    name: 'a decoded hash cannot start a fragment',
    actual: () => adminProxyPath(['parks#x']),
    expected: null,
  },
  {
    name: 'a segment with a space is encoded, not refused',
    actual: () => adminProxyPath(['content', 'a b']),
    expected: 'content/a%20b',
  },
  {
    name: 'a plus stays a plus rather than becoming a space upstream',
    actual: () => adminProxyPath(['a+b']),
    expected: 'a%2Bb',
  },
  {
    name: 'a uuid survives untouched',
    actual: () => adminProxyPath(['content', 'parks', '9f8c1c1e-0b2a-4c3d-8e5f-1a2b3c4d5e6f']),
    expected: 'content/parks/9f8c1c1e-0b2a-4c3d-8e5f-1a2b3c4d5e6f',
  },
  { name: 'isSafeSegment: ordinary', actual: () => isSafeSegment('parks'), expected: true },
  { name: 'isSafeSegment: empty', actual: () => isSafeSegment(''), expected: false },
  { name: 'isSafeSegment: slash', actual: () => isSafeSegment('a/b'), expected: false },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  let result;
  try {
    result = testCase.actual();
  } catch (error) {
    result = `threw: ${error instanceof Error ? error.message : String(error)}`;
  }
  if (result === testCase.expected) {
    passed++;
    console.log(`  ✓ ${testCase.name}`);
  } else {
    failed++;
    console.log(`  ✗ ${testCase.name}`);
    console.log(`      expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`      actual:   ${JSON.stringify(result)}`);
  }
}

console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
console.log('🎉 All tests passed!');
