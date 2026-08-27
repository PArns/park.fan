/**
 * Holiday-name localization (`lib/utils/holiday-names.ts`).
 *
 * The cases here are the ones that decide whether the table is worth having. Three groups:
 *
 * 1. The **spelling variants** the OpenHolidays feed actually produces for one break. `Summer
 *    Holidays`, `Summer holidays` and `summer holidays` all appear in the same year across
 *    DE/AT/CH/ES/IT, and a literal table keyed on the string would translate one of the three.
 * 2. The **public/school collision**: `All Saints' Day` is a public holiday and `All Saints
 *    Holidays` is the school break around it. They must not resolve to each other.
 * 3. The **passthrough**. An unknown name has to come back unchanged, in the API's English, with
 *    no throw and no empty string — the chip is more useful in the wrong language than absent.
 */

import assert from 'node:assert/strict';
import { translateHolidayName, genericSchoolHolidayName } from '@/lib/utils/holiday-names.ts';

let passed = 0;
function check(actual, expected, label) {
  assert.equal(actual, expected, `${label}: got "${actual}", want "${expected}"`);
  passed++;
}

// 1. Spelling variants of one break reduce to one entry.
for (const variant of ['Summer Holidays', 'Summer holidays', 'summer holidays', 'Summer Break']) {
  check(translateHolidayName(variant, 'de'), 'Sommerferien', `de / ${variant}`);
  check(translateHolidayName(variant, 'nl'), 'zomervakantie', `nl / ${variant}`);
  check(translateHolidayName(variant, 'fr'), "vacances d'été", `fr / ${variant}`);
  check(translateHolidayName(variant, 'it'), 'vacanze estive', `it / ${variant}`);
  check(translateHolidayName(variant, 'es'), 'vacaciones de verano', `es / ${variant}`);
}
for (const variant of ['Easter Holidays', 'Easter holidays', 'Easter break']) {
  check(translateHolidayName(variant, 'de'), 'Osterferien', `de / ${variant}`);
}
for (const variant of ['Christmas Holidays', 'Christmas holidays', 'Christmas Break']) {
  check(translateHolidayName(variant, 'nl'), 'kerstvakantie', `nl / ${variant}`);
}
check(translateHolidayName('Autumn holidays', 'de'), 'Herbstferien', 'de / autumn');
check(translateHolidayName('Winter Holidays', 'fr'), "vacances d'hiver", 'fr / winter');
check(translateHolidayName('Spring Holidays', 'nl'), 'voorjaarsvakantie', 'nl / spring');
check(translateHolidayName('Carnival Holidays', 'it'), 'vacanze di Carnevale', 'it / carnival');
check(translateHolidayName('Pentecost Holidays', 'de'), 'Pfingstferien', 'de / pentecost');
check(translateHolidayName('Semester Holidays', 'de'), 'Semesterferien', 'de / semester');

// 2. The public holiday and the school break named after it stay apart.
check(translateHolidayName("All Saints' Day", 'de'), 'Allerheiligen', 'de / All Saints public');
check(translateHolidayName('All Saints Holidays', 'de'), 'Allerheiligenferien', 'de / break');
check(translateHolidayName('Christmas Day', 'de'), 'Weihnachten', 'de / Christmas public');
check(translateHolidayName('Christmas Holidays', 'de'), 'Weihnachtsferien', 'de / Christmas break');
check(translateHolidayName('Easter Monday', 'nl'), 'tweede paasdag', 'nl / Easter Monday');
check(translateHolidayName('Corpus Christi', 'de'), 'Fronleichnam', 'de / Corpus Christi');
check(translateHolidayName('Ascension Day', 'nl'), 'Hemelvaartsdag', 'nl / Ascension');
// The case that says why `localName` from the API would not have been enough: a German reader
// gets the German name for a Dutch holiday, not the Dutch one.
check(translateHolidayName("King's Day", 'de'), 'Königstag', 'de / Dutch King’s Day');
check(translateHolidayName("King's Day", 'nl'), 'Koningsdag', 'nl / Dutch King’s Day');

// 3. Passthrough and edges.
check(translateHolidayName('Gold Cup Parade Day', 'de'), 'Gold Cup Parade Day', 'unknown name');
check(translateHolidayName('Näfels procession', 'fr'), 'Näfels procession', 'unknown, accented');
check(translateHolidayName('', 'de'), '', 'empty string');
check(translateHolidayName(null, 'de'), '', 'null');
check(translateHolidayName(undefined, 'de'), '', 'undefined');
// An unknown locale falls back to English rather than to `undefined`.
check(translateHolidayName('Summer Holidays', 'pt'), 'Summer holidays', 'unknown locale');

// The boolean-only fallback (`isSchoolVacation` with no name) is the same wording as a named
// break, per locale.
check(genericSchoolHolidayName('de'), 'Schulferien', 'de / generic');
check(genericSchoolHolidayName('nl'), 'schoolvakantie', 'nl / generic');
check(genericSchoolHolidayName('fr'), 'vacances scolaires', 'fr / generic');
check(genericSchoolHolidayName('xx'), 'School holidays', 'unknown locale / generic');

console.log(`✅ holiday names: ${passed} assertions passed`);
