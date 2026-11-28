/**
 * The two runners the `scripts/test-*.mjs` files share: a table of cases compared against an
 * expected value, and named blocks of assertions. One copy, so a thrown case reads the same in
 * every script and `pnpm test:unit` can rely on the exit code.
 */

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
 * cases that expect an object; `quiet` prints the failures only.
 *
 * @param {readonly { name: string, expected: unknown, actual?: unknown, run?: unknown }[]} testCases
 * @param {{ json?: boolean, quiet?: boolean }} [options]
 * @returns {Promise<never>}
 */
export async function runCases(testCases, { json = false, quiet = false } = {}) {
  let failed = 0;
  for (const testCase of testCases) {
    const result = await resultOf(testCase);
    const same = json
      ? JSON.stringify(result) === JSON.stringify(testCase.expected)
      : result === testCase.expected;
    if (same) {
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

/** Prints how many `test` blocks ran, as the last line of a script. */
export function reportPassed() {
  console.log(`\n${passed} passed`);
}
