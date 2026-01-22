/**
 * Test script to verify URL building functions
 * Tests against actual 404 URLs from production logs
 */

// Import our URL utilities (we'll simulate them here for testing)
function convertApiUrlToFrontendUrl(apiUrl) {
  if (!apiUrl) return '#';

  // Convert /v1/parks/... URLs
  if (apiUrl.startsWith('/v1/parks/')) {
    let url = apiUrl.replace('/v1/parks/', '/parks/');
    url = url.replace('/attractions/', '/');

    if (url.includes('/shows/')) {
      const showsIndex = url.indexOf('/shows/');
      url = url.substring(0, showsIndex);
    }
    if (url.includes('/restaurants/')) {
      const restaurantsIndex = url.indexOf('/restaurants/');
      url = url.substring(0, restaurantsIndex);
    }
    return url;
  }

  // If already a frontend URL, clean it up
  if (apiUrl.startsWith('/parks/')) {
    let url = apiUrl;
    url = url.replace('/attractions/', '/');

    if (url.includes('/shows/')) {
      const showsIndex = url.indexOf('/shows/');
      url = url.substring(0, showsIndex);
    }
    if (url.includes('/restaurants/')) {
      const restaurantsIndex = url.indexOf('/restaurants/');
      url = url.substring(0, restaurantsIndex);
    }
    return url;
  }

  return '#';
}

function buildParkUrl(data) {
  // Method 1: Build from geographic data (PREFERRED)
  if (data.continent && data.country && data.city && data.slug) {
    return `/parks/${data.continent}/${data.country}/${data.city}/${data.slug}`;
  }

  // Method 2: Fallback to URL conversion if we have a URL
  if (data.url) {
    const converted = convertApiUrlToFrontendUrl(data.url);
    if (converted !== '#') {
      return converted;
    }
  }

  // Method 3: Failed - return fallback
  console.warn('[buildParkUrl] Incomplete geographic data and no valid URL:', data);
  return '#';
}

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
  } else {
    result = buildParkUrl(testCase.input);
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
