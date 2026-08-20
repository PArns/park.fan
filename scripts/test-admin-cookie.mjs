// Regression tests for reading the admin session cookie out of a header.
//
// This is the one hostile string in the admin's auth path: a `Cookie` header
// arrives from the browser and is parsed before anything has been authenticated.
// The failures worth guarding against are a cookie whose name merely ends in
// ours (a loosely anchored regex matches it), a value that is not valid
// percent-encoding (decodeURIComponent throws), and the ordinary case of the
// session sitting behind three other cookies.
import { readCookie } from '../lib/admin/cookie.ts';

const NAME = 'parkfan_admin_session';
const TOKEN = 'aZ09-_abcdefghijklmnopqrstuvwxyz0123456789xy';

const testCases = [
  {
    name: 'the only cookie',
    actual: () => readCookie(`${NAME}=${TOKEN}`, NAME),
    expected: TOKEN,
  },
  {
    name: 'behind other cookies, with the usual "; " separator',
    actual: () => readCookie(`NEXT_LOCALE=de; theme=dark; ${NAME}=${TOKEN}; other=x`, NAME),
    expected: TOKEN,
  },
  {
    name: 'first, with others after it',
    actual: () => readCookie(`${NAME}=${TOKEN}; NEXT_LOCALE=de`, NAME),
    expected: TOKEN,
  },
  {
    name: 'separated without a space',
    actual: () => readCookie(`a=1;${NAME}=${TOKEN};b=2`, NAME),
    expected: TOKEN,
  },
  {
    name: 'a cookie whose name ENDS in ours is not ours',
    actual: () => readCookie(`x_${NAME}=attacker-token`, NAME),
    expected: null,
  },
  {
    name: 'a cookie whose name STARTS with ours is not ours',
    actual: () => readCookie(`${NAME}_old=stale-token`, NAME),
    expected: null,
  },
  {
    name: 'the real one still wins when a look-alike sits in front of it',
    actual: () => readCookie(`x_${NAME}=attacker-token; ${NAME}=${TOKEN}`, NAME),
    expected: TOKEN,
  },
  {
    name: 'a percent-encoded value is decoded',
    actual: () => readCookie(`${NAME}=a%2Bb`, NAME),
    expected: 'a+b',
  },
  {
    name: 'a malformed percent-escape yields null rather than throwing',
    actual: () => readCookie(`${NAME}=%E0%A4%A`, NAME),
    expected: null,
  },
  {
    name: 'an empty value is no session',
    actual: () => readCookie(`${NAME}=`, NAME),
    expected: null,
  },
  {
    name: 'a header with no cookies at all',
    actual: () => readCookie('', NAME),
    expected: null,
  },
  {
    name: 'a null header',
    actual: () => readCookie(null, NAME),
    expected: null,
  },
  {
    name: 'a valueless flag among real cookies is skipped',
    actual: () => readCookie(`flag; ${NAME}=${TOKEN}`, NAME),
    expected: TOKEN,
  },
  {
    name: 'a value containing "=" survives (base64url never emits one, but padding might)',
    actual: () => readCookie(`${NAME}=abc==`, NAME),
    expected: 'abc==',
  },
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
  const result = testCase.actual();
  if (result === testCase.expected) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
