/**
 * Rules a green build cannot enforce, over lib/game/** and app/game/**:
 *   - no `Math.random` (determinism; use Rng)
 *   - no barrel imports of @babylonjs/core, @babylonjs/gui, @babylonjs/loaders (bundle size)
 *   - no `window`/`document`/`navigator` at module scope in files that are not `'use client'`
 *     (the engine must be importable on the worker and on the server)
 *   - module index.ts files must not import Babylon statically (worker safety)
 *   - no TypeScript-only runtime syntax (parameter properties, enums, namespaces): the sim runs
 *     under node's strip-only mode in the soak harness and the tests
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const roots = ['lib/game', 'app/game'];
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|mjs)$/.test(p)) files.push(p);
  }
}
for (const r of roots) walk(r);

const problems = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const isClient = /^\s*['"]use client['"]/m.test(src);
  const isIndex =
    /(^|\/)index\.ts$/.test(file) && file.startsWith('lib/game/') && file.split('/').length === 4;
  lines.forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    if (/Math\.random\s*\(/.test(line) && !/eslint-disable|allow-random/.test(line))
      problems.push(`${where}: Math.random — use Rng`);
    if (/from\s+['"]@babylonjs\/(core|gui|loaders)['"]/.test(line))
      problems.push(
        `${where}: barrel import of ${line.match(/@babylonjs\/\w+/)[0]} — use a deep path`
      );
    if (isIndex && /from\s+['"]@babylonjs\//.test(line) && !/^\s*import\s+type/.test(line))
      problems.push(
        `${where}: module index imports Babylon statically — put it behind a dynamic import`
      );
    if (
      /^\s*(private|public|protected|readonly)\s+(readonly\s+)?\w+\s*[:,)]/.test(line) &&
      /^\s*(private|public|protected)/.test(line) &&
      !/[;=]/.test(line) &&
      !/\(/.test(line)
    ) {
      // a constructor parameter property looks like `private readonly x: T,` on its own line
      problems.push(
        `${where}: constructor parameter property — assign in the body instead (node strip-only mode)`
      );
    }
    if (
      /^\s*(export\s+)?(const\s+)?enum\s+\w+/.test(line) ||
      /^\s*(export\s+)?namespace\s+\w+/.test(line)
    )
      problems.push(`${where}: enum/namespace — use a union or an object`);
  });
  if (!isClient && !file.endsWith('.tsx')) {
    // crude module-scope check: a top-level statement (no indentation) touching the DOM globals
    lines.forEach((line, i) => {
      if (/^(const|let|var)\s+\w+\s*=\s*(window|document|navigator)\b/.test(line))
        problems.push(`${file}:${i + 1}: DOM global at module scope`);
    });
  }
}
if (problems.length) {
  console.error(`✗ game lint: ${problems.length} problem(s)`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`✓ game lint: ${files.length} files clean`);
