/**
 * Runs every `test:*` script of package.json that needs no server, browser, network or build
 * artifact, so a new test script joins CI by existing. A script stays out only through EXCLUDED,
 * with the reason beside it.
 *
 * Run: pnpm test:unit [--list] [--jobs=<n>]
 */
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts;

/** @type {Record<string, string>} */
const EXCLUDED = {
  'test:unit': 'this runner',
  'test:translations': 'runs `pnpm build` and crawls the built site',
};

const jobsArg = process.argv.find((a) => a.startsWith('--jobs='));
const jobs = Number(jobsArg?.slice(7)) || Math.max(2, availableParallelism());

const names = Object.keys(scripts).filter((n) => n.startsWith('test:'));
const excluded = names.filter((n) => n in EXCLUDED);
const runnable = names.filter((n) => !(n in EXCLUDED));
// A script that regenerates a shared file as its first step runs alone, after the pool.
const serial = runnable.filter((n) => scripts[n].includes('generate-'));
const queue = runnable.filter((n) => !serial.includes(n));

for (const name of Object.keys(EXCLUDED)) {
  if (!(name in scripts)) {
    console.error(`EXCLUDED names ${name}, which is not a script in package.json`);
    process.exit(1);
  }
}

if (process.argv.includes('--list')) {
  console.log(`run (${runnable.length}):\n  ${runnable.join('\n  ')}`);
  console.log(`excluded (${excluded.length}):`);
  for (const n of excluded) console.log(`  ${n}: ${EXCLUDED[n]}`);
  process.exit(0);
}

// The tests import generated files that are git-ignored. Writing them once here keeps the tests
// from racing each other over a half-written manifest. MEDIA_VERIFY=0 keeps the media generator off
// the live catalog, so no test result depends on api.park.fan.
const PRELUDE = ['scripts/generate-blog-manifest.mjs', 'scripts/generate-media-manifest.mjs'];
for (const file of PRELUDE) {
  const r = spawnSync(process.execPath, [file], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, MEDIA_VERIFY: '0' },
  });
  if (r.status !== 0) {
    console.error(`${file} failed (exit ${r.status})\n${r.stdout}${r.stderr}`);
    process.exit(1);
  }
}

const env = {
  ...process.env,
  PATH: [join(root, 'node_modules', '.bin'), process.env.PATH].join(delimiter),
};

/** @returns {Promise<{ name: string, code: number, ms: number, output: string }>} */
function run(name) {
  return new Promise((resolve) => {
    const start = Date.now();
    let output = '';
    const child = spawn(scripts[name], { cwd: root, env, shell: true });
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('close', (code) => resolve({ name, code: code ?? 1, ms: Date.now() - start, output }));
  });
}

const started = Date.now();
const results = [];
await Promise.all(
  Array.from({ length: jobs }, async () => {
    while (queue.length) {
      const name = queue.shift();
      const r = await run(name);
      results.push(r);
      console.log(`${r.code === 0 ? 'ok  ' : 'FAIL'} ${name} (${(r.ms / 1000).toFixed(1)} s)`);
    }
  })
);

for (const name of serial) {
  const r = await run(name);
  results.push(r);
  console.log(`${r.code === 0 ? 'ok  ' : 'FAIL'} ${name} (${(r.ms / 1000).toFixed(1)} s)`);
}

const failed = results.filter((r) => r.code !== 0);
for (const r of failed) console.log(`\n--- ${r.name} (exit ${r.code}) ---\n${r.output.trimEnd()}`);

console.log(
  `\n${results.length - failed.length} green, ${failed.length} red, ${excluded.length} excluded, ` +
    `${((Date.now() - started) / 1000).toFixed(1)} s`
);
if (failed.length) console.log(`red: ${failed.map((r) => r.name).join(', ')}`);
process.exit(failed.length ? 1 : 0);
