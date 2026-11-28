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

import { translateHolidayName, genericSchoolHolidayName } from '@/lib/utils/holiday-names.ts';
import { expectEqual, reportPassed } from './lib/run-cases.mjs';

// 1. Spelling variants of one break reduce to one entry.
for (const variant of ['Summer Holidays', 'Summer holidays', 'summer holidays', 'Summer Break']) {
  expectEqual(translateHolidayName(variant, 'de'), 'Sommerferien', `de / ${variant}`);
  expectEqual(translateHolidayName(variant, 'nl'), 'zomervakantie', `nl / ${variant}`);
  expectEqual(translateHolidayName(variant, 'fr'), "vacances d'été", `fr / ${variant}`);
  expectEqual(translateHolidayName(variant, 'it'), 'vacanze estive', `it / ${variant}`);
  expectEqual(translateHolidayName(variant, 'es'), 'vacaciones de verano', `es / ${variant}`);
}
for (const variant of ['Easter Holidays', 'Easter holidays', 'Easter break']) {
  expectEqual(translateHolidayName(variant, 'de'), 'Osterferien', `de / ${variant}`);
}
for (const variant of ['Christmas Holidays', 'Christmas holidays', 'Christmas Break']) {
  expectEqual(translateHolidayName(variant, 'nl'), 'kerstvakantie', `nl / ${variant}`);
}
expectEqual(translateHolidayName('Autumn holidays', 'de'), 'Herbstferien', 'de / autumn');
expectEqual(translateHolidayName('Winter Holidays', 'fr'), "vacances d'hiver", 'fr / winter');
expectEqual(translateHolidayName('Spring Holidays', 'nl'), 'voorjaarsvakantie', 'nl / spring');
expectEqual(
  translateHolidayName('Carnival Holidays', 'it'),
  'vacanze di Carnevale',
  'it / carnival'
);
expectEqual(translateHolidayName('Pentecost Holidays', 'de'), 'Pfingstferien', 'de / pentecost');
expectEqual(translateHolidayName('Semester Holidays', 'de'), 'Semesterferien', 'de / semester');

// 2. The public holiday and the school break named after it stay apart.
expectEqual(
  translateHolidayName("All Saints' Day", 'de'),
  'Allerheiligen',
  'de / All Saints public'
);
expectEqual(translateHolidayName('All Saints Holidays', 'de'), 'Allerheiligenferien', 'de / break');
expectEqual(translateHolidayName('Christmas Day', 'de'), 'Weihnachten', 'de / Christmas public');
expectEqual(
  translateHolidayName('Christmas Holidays', 'de'),
  'Weihnachtsferien',
  'de / Christmas break'
);
expectEqual(translateHolidayName('Easter Monday', 'nl'), 'tweede paasdag', 'nl / Easter Monday');
expectEqual(translateHolidayName('Corpus Christi', 'de'), 'Fronleichnam', 'de / Corpus Christi');
expectEqual(translateHolidayName('Ascension Day', 'nl'), 'Hemelvaartsdag', 'nl / Ascension');
// The case that says why `localName` from the API would not have been enough: a German reader
// gets the German name for a Dutch holiday, not the Dutch one.
expectEqual(translateHolidayName("King's Day", 'de'), 'Königstag', 'de / Dutch King’s Day');
expectEqual(translateHolidayName("King's Day", 'nl'), 'Koningsdag', 'nl / Dutch King’s Day');

// 3. Passthrough and edges.
expectEqual(
  translateHolidayName('Gold Cup Parade Day', 'de'),
  'Gold Cup Parade Day',
  'unknown name'
);
expectEqual(
  translateHolidayName('Näfels procession', 'fr'),
  'Näfels procession',
  'unknown, accented'
);
expectEqual(translateHolidayName('', 'de'), '', 'empty string');
expectEqual(translateHolidayName(null, 'de'), '', 'null');
expectEqual(translateHolidayName(undefined, 'de'), '', 'undefined');
// An unknown locale falls back to English rather than to `undefined`.
expectEqual(translateHolidayName('Summer Holidays', 'pt'), 'Summer holidays', 'unknown locale');

// The boolean-only fallback (`isSchoolVacation` with no name) is the same wording as a named
// break, per locale.
expectEqual(genericSchoolHolidayName('de'), 'Schulferien', 'de / generic');
expectEqual(genericSchoolHolidayName('nl'), 'schoolvakantie', 'nl / generic');
expectEqual(genericSchoolHolidayName('fr'), 'vacances scolaires', 'fr / generic');
expectEqual(genericSchoolHolidayName('xx'), 'School holidays', 'unknown locale / generic');

reportPassed();
