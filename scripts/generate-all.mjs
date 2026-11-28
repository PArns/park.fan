/**
 * Writes the generated files a build, a typecheck or the unit tests need, in the order each needs
 * them. The three lists stand side by side here so a new generator is added once, with the reason
 * it belongs to a list or stays out of it.
 *
 * Run: node scripts/generate-all.mjs --for=build|typecheck|test [--dry-run]
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/** The most-read seed imports TypeScript, so its node needs the flag. */
const MOST_READ_SEED = ['--experimental-strip-types', 'scripts/generate-most-read-seed.mjs'];

/**
 * One list per caller, each step the arguments of one `node` call.
 *
 * - `build` is everything a deployment needs and the three content checks that must stop one. The
 *   image crops run before the media manifest, which records what is on disk.
 * - `typecheck` writes only what `tsc` imports: no crops, no OG cards, no checks. Its seed is
 *   written offline and only when missing, so a typecheck never waits on the API.
 * - `test` writes only what the unit tests import, and keeps an existing build info: the tests
 *   never ask the API, and rewriting the file would race the scripts that read it.
 *
 * @type {Record<'build' | 'typecheck' | 'test', { steps: string[][], env?: Record<string, string> }>}
 */
export const GENERATOR_PLANS = {
  build: {
    steps: [
      ['scripts/generate-build-info.mjs'],
      ['scripts/generate-message-chunks.mjs'],
      ['scripts/check-client-messages.mjs'],
      ['scripts/check-untranslated.mjs'],
      ['scripts/check-blog-updated-at.mjs'],
      ['scripts/generate-client-glossary.mjs'],
      ['scripts/generate-blog-manifest.mjs'],
      MOST_READ_SEED,
      ['scripts/generate-image-crops.mjs'],
      ['scripts/generate-og-assets.mjs'],
      ['scripts/generate-media-manifest.mjs'],
    ],
  },
  typecheck: {
    steps: [
      ['scripts/generate-build-info.mjs'],
      ['scripts/generate-message-chunks.mjs'],
      ['scripts/generate-client-glossary.mjs'],
      ['scripts/generate-blog-manifest.mjs'],
      [...MOST_READ_SEED, '--offline', '--if-missing'],
      ['scripts/generate-media-manifest.mjs'],
    ],
  },
  test: {
    steps: [
      ['scripts/generate-build-info.mjs', '--offline', '--if-missing'],
      ['scripts/generate-blog-manifest.mjs'],
      ['scripts/generate-media-manifest.mjs'],
      [...MOST_READ_SEED, '--offline', '--if-missing'],
    ],
    // Keeps the media generator off the live catalog, so no test result depends on api.park.fan.
    env: { MEDIA_VERIFY: '0' },
  },
};

/**
 * Runs one list, stopping at the first step that fails. `quiet` holds a step's output back unless
 * it fails, for a caller that prints a result line of its own.
 *
 * @param {keyof typeof GENERATOR_PLANS} mode
 * @param {{ quiet?: boolean }} [options]
 * @returns {number} the exit code of the failed step, or 0
 */
export function runGenerators(mode, { quiet = false } = {}) {
  const { steps, env = {} } = GENERATOR_PLANS[mode];
  for (const argv of steps) {
    const result = spawnSync(process.execPath, argv, {
      cwd: root,
      env: { ...process.env, ...env },
      ...(quiet ? { encoding: 'utf8' } : { stdio: 'inherit' }),
    });
    if (result.status !== 0) {
      const file = argv.find((arg) => arg.endsWith('.mjs'));
      if (quiet)
        console.error(`${file} failed (exit ${result.status})\n${result.stdout}${result.stderr}`);
      return result.status ?? 1;
    }
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv.find((arg) => arg.startsWith('--for='))?.slice(6);
  if (!mode || !(mode in GENERATOR_PLANS)) {
    console.error(
      `Usage: node scripts/generate-all.mjs --for=${Object.keys(GENERATOR_PLANS).join('|')}`
    );
    process.exit(2);
  }
  if (process.argv.includes('--dry-run')) {
    const { steps, env = {} } = GENERATOR_PLANS[mode];
    const prefix = Object.entries(env)
      .map(([key, value]) => `${key}=${value} `)
      .join('');
    for (const argv of steps) console.log(`${prefix}node ${argv.join(' ')}`);
    process.exit(0);
  }
  process.exit(runGenerators(mode));
}
