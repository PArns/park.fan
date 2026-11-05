/**
 * Unit tests for `reportCsv` (`lib/admin/report-csv.ts`), the CSV every admin traffic report saves:
 * the window and filters first, every list of the answer as rows under its path with the union of
 * the keys as columns, quoting where a cell needs it, and a text a spreadsheet would run as a
 * formula defused.
 *
 * Run: pnpm test:report-csv
 */
import assert from 'node:assert/strict';
import { csvNamePart, reportCsv } from '../lib/admin/report-csv.ts';

const csv = reportCsv(
  {
    total: { views: 12 },
    items: [
      { value: '/de/parks', views: 10, referrers: [{ referrer: 'a', views: 1 }] },
      { value: '=HYPERLINK("x")', views: 2, extra: 'a,b' },
    ],
  },
  [['Von', '2026-10-01']]
);
assert.ok(csv.startsWith('﻿'));
assert.deepEqual(csv.slice(1).trimEnd().split('\r\n'), [
  'Tabelle;Feld;Wert;value;views;referrers;extra',
  'Übersicht;Von;2026-10-01;;;;',
  'Übersicht;total.views;12;;;;',
  'items;;;/de/parks;10;"[{""referrer"":""a"",""views"":1}]";',
  `items;;;"'=HYPERLINK(""x"")";2;;"a,b"`,
]);
assert.equal(csvNamePart('Ohne Suchbesuch: Parks'), 'ohne-suchbesuch-parks');
console.log('report-csv: all assertions passed.');
