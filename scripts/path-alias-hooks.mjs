// ESM resolve hook: map the `@/*` tsconfig path alias to the project root so the
// standalone `node --experimental-strip-types` test scripts can import app modules
// (e.g. `@/lib/utils`) the same way the Next.js app does. No runtime dependencies.
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

// Mirrors TypeScript/Next module resolution order (file wins over directory).
const SUFFIXES = [
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.js',
  '.json',
  '/index.ts',
  '/index.tsx',
  '/index.js',
];

/** First existing file for `base` + one of the known suffixes, or null. */
function probe(base) {
  for (const candidate of [base, ...SUFFIXES.map((s) => base + s)]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const resolved = probe(join(projectRoot, specifier.slice(2)));
    if (resolved) return nextResolve(pathToFileURL(resolved).href, context);
  }

  // Extensionless RELATIVE imports (`./manifest`) resolve under TypeScript and
  // Next but not under bare Node ESM, so a module that uses them is unreachable
  // from these test scripts unless the same probing is applied to them too.
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL) {
    const resolved = probe(join(dirname(fileURLToPath(context.parentURL)), specifier));
    if (resolved) return nextResolve(pathToFileURL(resolved).href, context);
  }

  return nextResolve(specifier, context);
}
