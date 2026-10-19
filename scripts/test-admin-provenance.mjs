// Regression tests for the optional reason and source an admin write carries into its audit row.
// The failures worth guarding against are an empty string sent as a value, a scheme the backend's
// @IsUrl rejects (or `javascript:`) getting through, and a reason over the 2,000-character limit.
import { provenanceBody } from '../lib/admin/provenance.ts';

const URL_OK = 'https://www.rcdb.com/16847.htm';

const testCases = [
  {
    name: 'both empty sends nothing',
    actual: () => provenanceBody('', ''),
    expected: { body: {} },
  },
  {
    name: 'whitespace only counts as empty',
    actual: () => provenanceBody('   ', '  \n'),
    expected: { body: {} },
  },
  {
    name: 'reason and url are trimmed and sent',
    actual: () => provenanceBody('  Maker confirmed ', ` ${URL_OK} `),
    expected: { body: { reason: 'Maker confirmed', sourceUrl: URL_OK } },
  },
  {
    name: 'a reason alone is sent alone',
    actual: () => provenanceBody('Duplicate', ''),
    expected: { body: { reason: 'Duplicate' } },
  },
  {
    name: 'http is accepted',
    actual: () => provenanceBody('', 'http://example.com/a'),
    expected: { body: { sourceUrl: 'http://example.com/a' } },
  },
  {
    name: 'ftp is rejected',
    actual: () => 'error' in provenanceBody('', 'ftp://example.com/a'),
    expected: true,
  },
  {
    name: 'javascript: is rejected',
    actual: () => 'error' in provenanceBody('', 'javascript:alert(1)'),
    expected: true,
  },
  {
    name: 'a host without a scheme is rejected',
    actual: () => 'error' in provenanceBody('', 'example.com'),
    expected: true,
  },
  {
    name: 'a reason of 2000 characters is sent',
    actual: () => 'body' in provenanceBody('x'.repeat(2000), ''),
    expected: true,
  },
  {
    name: 'a reason of 2001 characters is rejected',
    actual: () => 'error' in provenanceBody('x'.repeat(2001), ''),
    expected: true,
  },
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
  const result = testCase.actual();
  if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
