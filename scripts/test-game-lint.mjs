/**
 * Rules a green build cannot enforce, over lib/game/** and app/game/**:
 *   - no `Math.random` (determinism; use Rng)
 *   - no barrel imports of @babylonjs/core, @babylonjs/gui, @babylonjs/loaders (bundle size)
 *   - no `window`/`document`/`navigator` at module scope in files that are not `'use client'`
 *     (the engine must be importable on the worker and on the server)
 *   - module index.ts files must not import Babylon statically (worker safety)
 *   - no TypeScript-only runtime syntax (parameter properties, enums, namespaces): the sim runs
 *     under node's strip-only mode in the soak harness and the tests
 *   - no Babylon side-effect API called without the import that links it (see SIDE_EFFECT_APIS)
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

/**
 * Babylon APIs that throw at runtime unless a side-effect module is imported somewhere in the file.
 *
 * With the barrel import everything is linked and none of this matters; with deep imports — which
 * this repo requires, because the barrel is 956 KB gz against 271 — a call like
 * `camera.getForwardRay()` compiles, typechecks, passes every test, and then throws
 * "Ray needs to be imported before as it contains a side-effect required by your code" the first
 * time a frame renders.
 *
 * That is not hypothetical: it shipped in `environment/lighting.ts`, from inside `onRender`, so it
 * was thirteen console errors a second and a scene no other builder could screenshot against —
 * while typecheck, eslint and `pnpm test:game` were all green. A grep is the only thing that
 * catches it before a browser does.
 *
 * The check is per FILE, not per line: the import may sit at the top and the call three hundred
 * lines down. It is deliberately shallow — a call in one file and the import in another is not
 * caught — because the false negative is a runtime error somebody will see, while a false positive
 * would be a rule people learn to work around.
 */
const SIDE_EFFECT_APIS = [
  {
    name: 'getForwardRay/createPickingRay',
    call: /\.(getForwardRay|createPickingRay|createPickingRayToRef|createPickingRayInCameraSpace)\s*\(/,
    imports: ['@babylonjs/core/Culling/ray'],
  },
  {
    name: 'scene.pick/pickWithRay',
    call: /\b(scene|_scene|this\.scene)\s*\.\s*(pick|pickWithRay|multiPick|multiPickWithRay)\s*\(/,
    imports: ['@babylonjs/core/Culling/ray'],
  },
  {
    name: 'mesh.intersectsMesh',
    call: /\.intersectsMesh\s*\(/,
    imports: ['@babylonjs/core/Culling/ray'],
  },
  {
    name: 'AnimationGroup/animation helpers',
    call: /\b(beginAnimation|beginDirectAnimation|beginWeightedAnimation)\s*\(/,
    imports: ['@babylonjs/core/Animations/animatable'],
  },
  {
    name: 'physics impostor',
    call: /new\s+PhysicsImpostor\s*\(/,
    imports: ['@babylonjs/core/Physics/physicsEngineComponent'],
  },
];

const problems = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const isClient = /^\s*['"]use client['"]/m.test(src);
  const isIndex =
    /(^|\/)index\.ts$/.test(file) && file.startsWith('lib/game/') && file.split('/').length === 4;
  lines.forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    /**
     * Comments stripped before the side-effect match.
     *
     * The first version of this rule flagged its own docblock: the comment above the import in
     * `lighting.ts` names `camera.getForwardRay()` to say why the import is there, and the rule
     * read that as a call — right file, wrong line, and it would have fired on any file that
     * merely mentions the API. A rule that flags prose is one people learn to work around.
     *
     * Line comments and single-line block comments only. A call inside a multi-line block comment
     * is a false positive nobody has written yet, and tracking comment state across lines is more
     * machinery than the miss is worth.
     */
    const code = line
      .replace(/\/\*.*?\*\//g, '')
      .replace(/\/\/.*$/, '')
      .replace(/^\s*\*.*$/, '');
    for (const rule of SIDE_EFFECT_APIS) {
      if (!rule.call.test(code)) continue;
      if (rule.imports.some((mod) => src.includes(mod))) continue;
      problems.push(
        `${where}: ${rule.name} needs \`import '${rule.imports[0]}';\` — ` +
          `with deep imports the class it uses is not linked and the call throws at runtime`
      );
    }
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
