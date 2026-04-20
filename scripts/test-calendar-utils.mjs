import { getWeatherEmoji } from '../lib/utils/calendar-utils.ts';

const testCases = [
  // Numeric codes (WMO)
  { input: 0, expected: '☀️', name: 'Numeric: Clear sky' },
  { input: 1, expected: '⛅', name: 'Numeric: Mainly clear' },
  { input: 2, expected: '⛅', name: 'Numeric: Partly cloudy' },
  { input: 3, expected: '⛅', name: 'Numeric: Overcast' },
  { input: 45, expected: '🌫️', name: 'Numeric: Fog (45)' },
  { input: 48, expected: '🌫️', name: 'Numeric: Fog (48)' },
  { input: 51, expected: '🌦️', name: 'Numeric: Drizzle (51)' },
  { input: 57, expected: '🌦️', name: 'Numeric: Drizzle (57)' },
  { input: 61, expected: '🌧️', name: 'Numeric: Rain (61)' },
  { input: 67, expected: '🌧️', name: 'Numeric: Rain (67)' },
  { input: 71, expected: '🌨️', name: 'Numeric: Snow (71)' },
  { input: 77, expected: '🌨️', name: 'Numeric: Snow (77)' },
  { input: 80, expected: '🌧️', name: 'Numeric: Rain showers (80)' },
  { input: 82, expected: '🌧️', name: 'Numeric: Rain showers (82)' },
  { input: 85, expected: '❄️', name: 'Numeric: Snow showers (85)' },
  { input: 86, expected: '❄️', name: 'Numeric: Snow showers (86)' },
  { input: 95, expected: '⛈️', name: 'Numeric: Thunderstorm (95)' },
  { input: 99, expected: '⛈️', name: 'Numeric: Thunderstorm (99)' },
  { input: 100, expected: '☁️', name: 'Numeric: Unknown code' },

  // String codes
  { input: 'clear-day', expected: '☀️', name: 'String: clear-day' },
  { input: 'clear-night', expected: '🌙', name: 'String: clear-night' },
  { input: 'cloudy', expected: '☁️', name: 'String: cloudy' },
  { input: 'partly-cloudy-day', expected: '⛅', name: 'String: partly-cloudy-day' },
  { input: 'partly-cloudy-night', expected: '☁️', name: 'String: partly-cloudy-night' },
  { input: 'rain', expected: '🌧️', name: 'String: rain' },
  { input: 'drizzle', expected: '🌦️', name: 'String: drizzle' },
  { input: 'snow', expected: '❄️', name: 'String: snow' },
  { input: 'sleet', expected: '🌨️', name: 'String: sleet' },
  { input: 'wind', expected: '💨', name: 'String: wind' },
  { input: 'fog', expected: '🌫️', name: 'String: fog' },
  { input: 'thunderstorm', expected: '⛈️', name: 'String: thunderstorm' },
  { input: 'unknown-string', expected: '🌤️', name: 'String: Unknown icon' },
];

console.log('🧪 Testing getWeatherEmoji\n');
console.log('='.repeat(80) + '\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = getWeatherEmoji(testCase.input);
  const success = result === testCase.expected;

  if (success) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Input:    ${testCase.input}`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got:      ${result}`);
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
