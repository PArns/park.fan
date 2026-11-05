/**
 * Parky's outfits (`lib/assistant/parky-look.ts`): the season a date falls in, the look for the
 * park's weather, what an act puts aside, the showy pool a look adds to, where a scene fits, and
 * the `?parky=` switch.
 *
 * Run: pnpm test:parky-look
 */
import assert from 'node:assert/strict';
import {
  lookSwitch,
  NO_LOOK,
  outfitFor,
  sceneFits,
  seasonOn,
  showyPool,
  WEATHER_ACT,
  weatherLook,
  WEATHERS,
} from '@/lib/assistant/parky-look.ts';

const on = (month, day) => new Date(2026, month - 1, day, 12);

// Seasons, at their edges.
assert.equal(seasonOn(on(9, 30)), null);
assert.equal(seasonOn(on(10, 1)), 'halloween');
assert.equal(seasonOn(on(10, 31)), 'halloween');
assert.equal(seasonOn(on(11, 1)), null);
assert.equal(seasonOn(on(12, 1)), 'christmas');
assert.equal(seasonOn(on(12, 26)), 'christmas');
assert.equal(seasonOn(on(12, 27)), null);
assert.equal(seasonOn(on(12, 31)), 'newyear');
assert.equal(seasonOn(on(1, 1)), 'newyear');
assert.equal(seasonOn(on(1, 2)), 'winter');
assert.equal(seasonOn(new Date(2028, 1, 29, 12)), 'winter');
assert.equal(seasonOn(on(3, 1)), null);

// The weather, most striking state first.
const calm = { code: 1, temperatureC: 18, windKmh: 10, gustsKmh: 20 };
assert.equal(weatherLook(calm), null);
assert.equal(weatherLook({ ...calm, code: 95, gustsKmh: 80 }), 'storm');
assert.equal(weatherLook({ ...calm, code: 73, temperatureC: -2 }), 'snow');
assert.equal(weatherLook({ ...calm, code: 61, temperatureC: 30 }), 'rain');
assert.equal(weatherLook({ ...calm, code: 53 }), 'rain');
assert.equal(weatherLook({ ...calm, gustsKmh: 50 }), 'windy');
assert.equal(weatherLook({ ...calm, windKmh: 35, gustsKmh: null }), 'windy');
assert.equal(weatherLook({ ...calm, code: 45 }), 'fog');
assert.equal(weatherLook({ ...calm, temperatureC: 28 }), 'hot');
assert.equal(weatherLook({ ...calm, temperatureC: 4.9 }), 'cold');
assert.equal(weatherLook({ ...calm, temperatureC: 5 }), null);
assert.equal(weatherLook({ code: null, temperatureC: null, windKmh: null, gustsKmh: null }), null);

// What an act puts aside.
const christmasRain = { season: 'christmas', weather: 'rain' };
assert.deepEqual(outfitFor(christmasRain, null), {
  hat: 'tree',
  scarf: false,
  umbrella: true,
  sky: 'rain',
});
assert.equal(outfitFor(christmasRain, 'wink').umbrella, true);
assert.equal(outfitFor(christmasRain, 'nightcap').hat, null, 'the nightcap takes the hat’s place');
assert.equal(outfitFor(christmasRain, 'lights').hat, null, 'the lights need the wheel');
assert.equal(outfitFor(christmasRain, 'nightcap').umbrella, true);
for (const doing of [
  'coaster',
  'launch',
  'hills',
  'tower',
  'dizzy',
  'read',
  'plan',
  'looking',
  'search',
]) {
  const outfit = outfitFor(christmasRain, doing);
  assert.equal(outfit.umbrella, false, `${doing} puts the umbrella aside`);
  assert.equal(outfit.hat, 'tree', `${doing} keeps the hat`);
}
assert.equal(outfitFor({ season: 'winter', weather: null }, null).hat, 'beanie');
assert.equal(outfitFor({ season: 'winter', weather: null }, null).scarf, true);
assert.equal(
  outfitFor({ season: null, weather: 'cold' }, null).scarf,
  true,
  'the cold brings the scarf'
);
assert.equal(outfitFor({ season: null, weather: 'storm' }, null).umbrella, true);
assert.deepEqual(outfitFor(NO_LOOK, null), { hat: null, scarf: false, umbrella: false, sky: null });

// The showy pool only ever grows.
const base = ['ride', 'hop', 'shades'];
assert.deepEqual(showyPool(base, NO_LOOK), base);
const hot = showyPool(base, { season: null, weather: 'hot' });
assert.deepEqual(hot.slice(0, base.length), base, 'the base acts stay');
assert.equal(hot.filter((act) => act === 'shades').length, 3, 'the heat brings the shades out');
assert.ok(hot.includes('fan'));
const winterSnow = showyPool(base, { season: 'winter', weather: 'snow' });
assert.equal(winterSnow.filter((act) => act === 'snowman').length, 4);
assert.ok(showyPool(base, { season: 'halloween', weather: null }).includes('ghost'));
assert.ok(showyPool(base, { season: 'newyear', weather: 'rain' }).includes('fireworks'));
assert.ok(showyPool(base, { season: 'newyear', weather: 'rain' }).includes('brolly'));
for (const weather of WEATHERS) assert.ok(WEATHER_ACT[weather], `${weather} has an act`);

// A scene beside him needs the room.
assert.equal(sceneFits('snowman', { left: 100, top: 100, width: 48 }), true);
assert.equal(sceneFits('snowman', { left: 8, top: 100, width: 48 }), false);
assert.equal(sceneFits('fireworks', { left: 100, top: 10, width: 48 }), false);
assert.equal(sceneFits('wink', { left: 0, top: 0, width: 48 }), true);

// The switch.
assert.deepEqual(lookSwitch('christmas,rain'), { season: 'christmas', weather: 'rain' });
assert.deepEqual(lookSwitch('snow'), { weather: 'snow' });
assert.deepEqual(lookSwitch('egg'), {});
assert.deepEqual(lookSwitch(null), {});

console.log('parky-look: all tests passed');
