#!/usr/bin/env node
/**
 * Guards the two-level message split.
 *
 * The locale layout ships only the chrome namespaces; each route adds its own
 * delta through `<RouteMessages>` (see `i18n/client-messages.ts` for why). Both
 * lists are derived from the import graph and baked into
 * `i18n/route-namespaces.generated.ts`.
 *
 * Getting this wrong does not throw at runtime: next-intl logs a MISSING_MESSAGE
 * error and renders the raw key, which is exactly the kind of regression that
 * reaches production unnoticed. So this check fails when
 *
 *   1. the generated file has drifted from the current import graph — a
 *      component crossed the client boundary and nobody re-ran the generator, or
 *   2. a route that needs a delta does not render `<RouteMessages>`, or renders
 *      it with the wrong route key, or
 *   3. a route whose delta is empty renders one anyway (pure overhead).
 *
 * Run via `pnpm release:check`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeRouteNamespaces } from '../lib/i18n/route-namespaces.mjs';
import { renderModule, formatModule } from './generate-route-namespaces.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedFile = path.join(rootDir, 'i18n/route-namespaces.generated.ts');

const problems = [];

const analysis = analyzeRouteNamespaces({ root: rootDir });

// ── 1. Is the committed map current? ────────────────────────────────────────
const expected = await formatModule(renderModule(analysis));
const actual = fs.existsSync(generatedFile) ? fs.readFileSync(generatedFile, 'utf-8') : '';

if (actual !== expected) {
  problems.push(
    'i18n/route-namespaces.generated.ts is out of date with the import graph.\n' +
      '     Run `pnpm generate:route-namespaces` and commit the result.'
  );
}

// ── 2/3. Is every route wired to its delta? ─────────────────────────────────
/** @param {string} routeKey */
function pageFileFor(routeKey) {
  const rel = routeKey === '/' ? '' : routeKey.slice(1);
  return path.join(rootDir, 'app/[locale]', rel, 'page.tsx');
}

for (const [routeKey, namespaces] of Object.entries(analysis.routes)) {
  const file = pageFileFor(routeKey);
  const relative = path.relative(rootDir, file).split(path.sep).join('/');

  if (!fs.existsSync(file)) {
    problems.push(`${relative} is missing for route "${routeKey}".`);
    continue;
  }

  const source = fs.readFileSync(file, 'utf-8');
  const rendered = [...source.matchAll(/<RouteMessages\s+route="([^"]+)"/g)].map((m) => m[1]);

  if (namespaces.length === 0) {
    if (rendered.length > 0) {
      problems.push(
        `${relative} renders <RouteMessages> but route "${routeKey}" needs no extra namespaces —\n` +
          '     the layout set already covers it. Remove the wrapper.'
      );
    }
    continue;
  }

  if (rendered.length === 0) {
    problems.push(
      `${relative} does not render <RouteMessages route="${routeKey}">, but the route needs\n` +
        `     ${namespaces.join(', ')} on the client. Those messages will render as raw keys.`
    );
    continue;
  }

  const wrong = rendered.filter((key) => key !== routeKey);
  if (wrong.length > 0) {
    problems.push(
      `${relative} renders <RouteMessages route="${wrong[0]}"> but sits at "${routeKey}".`
    );
  }
}

if (problems.length > 0) {
  console.error('\n❌ Client message routing is out of sync:\n');
  for (const problem of problems) console.error(`   🔸 ${problem}`);
  console.error('');
  process.exit(1);
}

// ── Report what the split is worth, per locale-independent JSON bytes. ───────
const messages = JSON.parse(fs.readFileSync(path.join(rootDir, 'messages/en.json'), 'utf-8'));
/** @param {string} namespace */
function bytesOf(namespace) {
  let node = messages;
  for (const segment of namespace.split('.')) node = node?.[segment];
  return node === undefined ? 0 : Buffer.byteLength(JSON.stringify(node));
}

const layoutBytes = analysis.layout.reduce((sum, ns) => sum + bytesOf(ns), 0);
const routeTotals = Object.entries(analysis.routes).map(([key, namespaces]) => ({
  key,
  bytes: layoutBytes + namespaces.reduce((sum, ns) => sum + bytesOf(ns), 0),
}));
const heaviest = routeTotals.reduce((a, b) => (b.bytes > a.bytes ? b : a));
const lightest = routeTotals.reduce((a, b) => (b.bytes < a.bytes ? b : a));

console.log(
  `✅ Client messages are routed correctly — ` +
    `${analysis.layout.length} namespaces in the layout (${layoutBytes} B), ` +
    `${routeTotals.length} routes from ${lightest.bytes} B (${lightest.key}) ` +
    `to ${heaviest.bytes} B (${heaviest.key}).`
);
