/**
 * Unit tests for `/admin/assistant/tokens` (`lib/admin/parky-tokens.ts`): a chat without a source
 * is the website's, and the chart gets every day of the window with the tokens per source.
 *
 * Run: pnpm test:admin-parky-tokens
 */
import assert from 'node:assert/strict';
import { chatSource, tokenSeries } from '../lib/admin/parky-tokens.ts';
import { reportPassed, test } from './lib/run-cases.mjs';

const day = (name, source, totalTokens) => ({ day: name, source, totalTokens });

test('a chat from an API without the column, or with a source it does not know, is the website’s', () => {
  assert.equal(chatSource(undefined), 'web');
  assert.equal(chatSource(null), 'web');
  assert.equal(chatSource('web'), 'web');
  assert.equal(chatSource('kiosk'), 'web');
  assert.equal(chatSource('app'), 'app');
});

test('every day of the window has a point, a day without a chat a zero', () => {
  const series = tokenSeries({
    from: '2026-10-30',
    to: '2026-11-02',
    days: [day('2026-10-30', 'web', 1000), day('2026-11-01', 'app', 5000)],
  });
  assert.deepEqual(series, {
    days: ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
    web: [1000, 0, 0, 0],
    app: [0, 0, 5000, 0],
  });
});

test('both sources of one day stand side by side, a row without a source counts as website', () => {
  const series = tokenSeries({
    from: '2026-11-01',
    to: '2026-11-01',
    days: [
      day('2026-11-01', 'app', 300),
      day('2026-11-01', 'web', 200),
      day('2026-11-01', undefined, 50),
    ],
  });
  assert.deepEqual(series.web, [250]);
  assert.deepEqual(series.app, [300]);
});

test('an empty window draws zeros, and a row outside it is left out', () => {
  assert.deepEqual(tokenSeries({ from: '2026-11-01', to: '2026-11-02', days: [] }), {
    days: ['2026-11-01', '2026-11-02'],
    web: [0, 0],
    app: [0, 0],
  });
  const outside = tokenSeries({
    from: '2026-11-01',
    to: '2026-11-01',
    days: [day('2026-10-31', 'web', 9)],
  });
  assert.deepEqual(outside.web, [0]);
});

reportPassed();
