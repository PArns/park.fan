/**
 * Test script to verify URL building functions
 * Tests against actual 404 URLs from production logs
 */

import {
  convertApiUrlToFrontendUrl,
  buildParkUrl,
  buildAttractionUrl,
  buildAttractionUrlFromGeo,
} from '../lib/utils/url-utils.ts';

// Test cases from actual 404 logs
const test404Cases = [
  // ✅ FIXED: /v1/ URLs (should be converted to /parks/)
  {
    name: '/v1/ URL - Wild Waterval',
    input: {
      url: '/v1/parks/europe/netherlands/hellendoorn/avonturenpark-hellendoorn/attractions/wild-waterval',
    },
    expected: '/parks/europe/netherlands/hellendoorn/avonturenpark-hellendoorn/wild-waterval',
    test: 'convertApiUrlToFrontendUrl',
  },
  {
    name: '/v1/ URL - TNT Tren de la Mina',
    input: {
      url: '/v1/parks/europe/spain/madrid/parque-de-atracciones-de-madrid/attractions/tnt-tren-de-la-mina',
    },
    expected: '/parks/europe/spain/madrid/parque-de-atracciones-de-madrid/tnt-tren-de-la-mina',
    test: 'convertApiUrlToFrontendUrl',
  },

  // ✅ FIXED WITH GEO DATA: Incomplete URLs (can be rebuilt with geo data)
  {
    name: 'Incomplete URL - Six Flags Great Escape (with geo data)',
    input: {
      continent: 'north-america',
      country: 'united-states',
      city: 'queensbury',
      slug: 'six-flags-great-escape',
      url: '/v1/parks/north-america/united-states/six-flags-great-escape', // incomplete
    },
    expected: '/parks/north-america/united-states/queensbury/six-flags-great-escape',
    test: 'buildParkUrl',
  },
  {
    name: 'Incomplete URL - Six Flags Magic Mountain (with geo data)',
    input: {
      continent: 'north-america',
      country: 'united-states',
      city: 'valencia',
      slug: 'six-flags-magic-mountain',
      url: '/v1/parks/north-america/united-states/valencia/six-flags-magic-mountain', // actually complete
    },
    expected: '/parks/north-america/united-states/valencia/six-flags-magic-mountain',
    test: 'buildParkUrl',
  },
  {
    name: 'Incomplete URL - Dollywood (with geo data)',
    input: {
      continent: 'north-america',
      country: 'united-states',
      city: 'pigeon-forge',
      slug: 'dollywood',
      url: '/v1/parks/north-america/united-states/dollywood', // incomplete
    },
    expected: '/parks/north-america/united-states/pigeon-forge/dollywood',
    test: 'buildParkUrl',
  },

  // ⚠️ FALLBACK: Without geo data, can only convert what we have
  {
    name: 'Incomplete URL - No geo data (fallback to conversion)',
    input: {
      slug: 'six-flags-great-escape',
      url: '/v1/parks/north-america/united-states/six-flags-great-escape',
    },
    expected: '/parks/north-america/united-states/six-flags-great-escape', // Still incomplete, but /v1 removed
    test: 'buildParkUrl',
  },

  // Edge cases
  {
    name: 'Already clean URL',
    input: { url: '/parks/europe/germany/bruhl/phantasialand' },
    expected: '/parks/europe/germany/bruhl/phantasialand',
    test: 'convertApiUrlToFrontendUrl',
  },
  {
    name: 'Show URL',
    input: { url: '/v1/parks/europe/germany/bruhl/phantasialand/shows/mystic-winter-castle' },
    expected: '/parks/europe/germany/bruhl/phantasialand',
    test: 'convertApiUrlToFrontendUrl',
  },

  // 🧪 NEW: buildAttractionUrl tests
  {
    name: 'buildAttractionUrl - Basic API URL',
    input: {
      parkUrl: '/v1/parks/europe/germany/bruhl/phantasialand',
      slug: 'taron',
    },
    expected: '/parks/europe/germany/bruhl/phantasialand/taron',
    test: 'buildAttractionUrl',
  },
  {
    name: 'buildAttractionUrl - Clean Frontend URL',
    input: {
      parkUrl: '/parks/europe/germany/bruhl/phantasialand',
      slug: 'fly',
    },
    expected: '/parks/europe/germany/bruhl/phantasialand/fly',
    test: 'buildAttractionUrl',
  },
  {
    name: 'buildAttractionUrl - URL with attractions segment and trailing slash',
    input: {
      parkUrl: '/v1/parks/europe/germany/bruhl/phantasialand/attractions/',
      slug: 'black-mamba',
    },
    expected: '/parks/europe/germany/bruhl/phantasialand/black-mamba',
    test: 'buildAttractionUrl',
  },
  {
    name: 'buildAttractionUrl - URL with trailing slash (checks for double slash)',
    input: {
      parkUrl: '/parks/europe/germany/bruhl/phantasialand/',
      slug: 'taron',
    },
    expected: '/parks/europe/germany/bruhl/phantasialand/taron',
    test: 'buildAttractionUrl',
  },

  // 🧪 NEW: buildAttractionUrlFromGeo tests
  {
    name: 'buildAttractionUrlFromGeo - Complete data',
    input: {
      slug: 'taron',
      park: {
        continent: 'europe',
        country: 'germany',
        city: 'bruehl',
        slug: 'phantasialand',
      },
    },
    expected: '/parks/europe/germany/bruehl/phantasialand/taron',
    test: 'buildAttractionUrlFromGeo',
  },
  {
    name: 'buildAttractionUrlFromGeo - Fallback to URL',
    input: {
      slug: 'taron',
      url: '/v1/parks/europe/germany/bruehl/phantasialand/attractions/taron',
    },
    expected: '/parks/europe/germany/bruehl/phantasialand/taron',
    test: 'buildAttractionUrlFromGeo',
  },
  {
    name: 'buildAttractionUrlFromGeo - Incomplete park data, fallback to park URL',
    input: {
      slug: 'taron',
      park: {
        slug: 'phantasialand',
        url: '/v1/parks/europe/germany/bruehl/phantasialand',
      },
    },
    expected: '/parks/europe/germany/bruehl/phantasialand/taron',
    test: 'buildAttractionUrlFromGeo',
  },
];

// Run tests
console.log('🧪 Testing URL Building Functions\n');
console.log('='.repeat(80) + '\n');

let passed = 0;
let failed = 0;

test404Cases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input:`, testCase.input);

  let result;
  if (testCase.test === 'convertApiUrlToFrontendUrl') {
    result = convertApiUrlToFrontendUrl(testCase.input.url);
  } else if (testCase.test === 'buildParkUrl') {
    result = buildParkUrl(testCase.input);
  } else if (testCase.test === 'buildAttractionUrl') {
    result = buildAttractionUrl(testCase.input.parkUrl, testCase.input.slug);
  } else if (testCase.test === 'buildAttractionUrlFromGeo') {
    result = buildAttractionUrlFromGeo(testCase.input);
  }

  const success = result === testCase.expected;

  if (success) {
    console.log(`✅ PASS`);
    console.log(`   Result: ${result}`);
    passed++;
  } else {
    console.log(`❌ FAIL`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got:      ${result}`);
    failed++;
  }
  console.log('');
});

console.log('='.repeat(80));
console.log(`\n📊 Results: ${passed}/${test404Cases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed! URL building is working correctly.');
} else {
  console.log('⚠️  Some tests failed. Review the output above.');
  process.exit(1);
}
