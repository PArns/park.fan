// Regression tests for the 308 a path without a locale prefix gets in `proxy.ts`.
//
// Googlebot finds these paths as strings in the RSC payload (the locale-relative `href` props of
// `Link` from `@/i18n/navigation`) and requests them without `Accept-Language`. next-intl answered
// with a 307 to `/en/…`, which 404s when the path carries another locale's park sub-page segment
// (`/en/…/calendrier-temps-attente/…`). See lib/i18n/unprefixed-redirect.ts.
import { unprefixedPathRedirect } from '../lib/i18n/unprefixed-redirect.ts';

const park = '/parks/asia/china/guang-zhou-shi/chimelong-water-park';

const testCases = [
  { name: 'the root is left to next-intl', path: '/', accept: false, expected: null },
  {
    name: 'a prefixed path is not touched',
    path: `/de${park}/wartezeiten-kalender`,
    accept: false,
    expected: null,
  },
  {
    name: 'a French calendar month goes to /fr, whoever asks',
    path: `${park}/calendrier-temps-attente/2026/5`,
    accept: true,
    expected: `/fr${park}/calendrier-temps-attente/2026/5`,
  },
  {
    name: 'a German calendar hub goes to /de without Accept-Language too',
    path: `${park}/wartezeiten-kalender`,
    accept: false,
    expected: `/de${park}/wartezeiten-kalender`,
  },
  {
    name: 'an Italian stats page goes to /it',
    path: `${park}/tempi-di-attesa-medi`,
    accept: true,
    expected: `/it${park}/tempi-di-attesa-medi`,
  },
  {
    name: 'the English calendar segment goes to /en',
    path: `${park}/wait-time-calendar/2026/11`,
    accept: true,
    expected: `/en${park}/wait-time-calendar/2026/11`,
  },
  {
    name: 'a park page asked by a browser is negotiated by next-intl',
    path: park,
    accept: true,
    expected: null,
  },
  {
    name: 'a park page asked without Accept-Language goes to the default locale',
    path: park,
    accept: false,
    expected: `/en${park}`,
  },
  {
    name: 'a ride slug is not mistaken for a sub-page segment',
    path: `${park}/taron`,
    accept: true,
    expected: null,
  },
  {
    name: 'a blog post asked without Accept-Language goes to the default locale',
    path: '/blog/hansa-park-tips',
    accept: false,
    expected: '/en/blog/hansa-park-tips',
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = unprefixedPathRedirect(testCase.path, testCase.accept);
  if (result === testCase.expected) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got:      ${result}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
