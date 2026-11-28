/**
 * The runners the `scripts/test-*.mjs` files share: a table of cases compared against an expected
 * value, named blocks of assertions, and checks that are counted instead of thrown. One copy, so a
 * thrown case reads the same in every script and `pnpm test:unit` can rely on the exit code.
 */
import assert from 'node:assert/strict';

/** A thrown case becomes a value, so it fails against its expectation instead of ending the run. */
async function resultOf(testCase) {
  const actual = 'actual' in testCase ? testCase.actual : testCase.run;
  try {
    return typeof actual === 'function' ? await actual() : actual;
  } catch (error) {
    return `THREW: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Runs a table of `{ name, actual | run, expected }` and ends the process with 0 or 1. `actual`
 * may be a value, a function or an async function. `json` compares the serialised values, for
 * cases that expect an object; `same` is a comparison of the script's own (`Object.is` where NaN
 * and -0 matter); `quiet` prints the failures only.
 *
 * @param {readonly { name: string, expected: unknown, actual?: unknown, run?: unknown }[]} testCases
 * @param {{ json?: boolean, quiet?: boolean, same?: (actual: unknown, expected: unknown) => boolean }} [options]
 * @returns {Promise<never>}
 */
export async function runCases(testCases, { json = false, quiet = false, same } = {}) {
  const equal =
    same ?? (json ? (a, b) => JSON.stringify(a) === JSON.stringify(b) : (a, b) => a === b);
  let failed = 0;
  for (const testCase of testCases) {
    const result = await resultOf(testCase);
    if (equal(result, testCase.expected)) {
      if (!quiet) console.log(`✅ PASS: ${testCase.name}`);
      continue;
    }
    failed++;
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(
    `\n📊 Results: ${testCases.length - failed}/${testCases.length} passed, ${failed} failed\n`
  );
  console.log(failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed.');
  process.exit(failed === 0 ? 0 : 1);
}

let passed = 0;

function pass(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

/**
 * Runs one named block of assertions. A failed assertion throws out of the script, which is the
 * failure `pnpm test:unit` reads; an async block returns its promise for the caller to await.
 *
 * @param {string} name
 * @param {() => void | Promise<void>} fn
 * @returns {void | Promise<void>}
 */
export function test(name, fn) {
  const pending = fn();
  if (pending instanceof Promise) return pending.then(() => pass(name));
  pass(name);
}

/**
 * One assertion outside a `test` block, counted with them: for a script that is a long run of
 * comparisons and stops at the first that fails.
 *
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} label
 */
export function expectEqual(actual, expected, label) {
  assert.deepEqual(actual, expected, `${label}: got ${JSON.stringify(actual)}`);
  passed++;
}

/**
 * `expectEqual` for a condition the script works out itself, such as a pattern found in a source.
 *
 * @param {unknown} condition
 * @param {string} label
 */
export function expectThat(condition, label) {
  assert.ok(condition, label);
  passed++;
}

/** Prints how many `test` blocks and `expect…` assertions ran, as the last line of a script. */
export function reportPassed() {
  console.log(`\n${passed} passed`);
}

let checksPassed = 0;
/** @type {string[]} */
const checksFailed = [];
let checksQuiet = false;

/** Prints the failed checks only, for a script with one check per file or message it reads. */
export function quietChecks() {
  checksQuiet = true;
}

function record(name, ok, detail) {
  if (ok) {
    checksPassed++;
    if (!checksQuiet) console.log(`✅ ${name}`);
    return;
  }
  checksFailed.push(name);
  console.log(`❌ ${name}${detail ? `\n   ${detail}` : ''}`);
}

/**
 * A comparison that is counted and not thrown, so one script reports every failure of a run. The
 * values are compared serialised, as the tables are with `json`.
 *
 * @param {string} name
 * @param {unknown} actual
 * @param {unknown} expected
 */
export function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  record(name, a === e, `expected ${e}\n   got      ${a}`);
}

/**
 * `check` for a condition the script works out itself; `detail` says what it saw.
 *
 * @param {string} name
 * @param {unknown} condition
 * @param {string} [detail]
 */
export function checkThat(name, condition, detail = '') {
  record(name, Boolean(condition), detail);
}

/**
 * A named block whose failed assertion is counted with the checks instead of ending the script.
 * Like `test`, a synchronous block is settled on return and an async one returns its promise.
 *
 * @param {string} name
 * @param {() => void | Promise<void>} fn
 * @returns {void | Promise<void>}
 */
export function attempt(name, fn) {
  const passed = () => record(name, true, '');
  const failed = (error) =>
    record(name, false, error instanceof Error ? error.message.split('\n').join('\n   ') : error);
  try {
    const pending = fn();
    if (pending instanceof Promise) return pending.then(passed, failed);
    passed();
  } catch (error) {
    failed(error);
  }
}

/**
 * Closes a script of `check`, `checkThat` and `attempt`: the tally, the names that failed, and exit
 * code 1 when any did. A script that passed runs on, so it can print a last line of its own.
 */
export function finishChecks() {
  console.log(`\n📊 ${checksPassed} passed, ${checksFailed.length} failed\n`);
  if (checksFailed.length === 0) return;
  console.log(checksFailed.map((name) => `  · ${name}`).join('\n'));
  process.exit(1);
}
