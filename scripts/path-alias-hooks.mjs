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

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const base = join(projectRoot, specifier.slice(2));
    for (const candidate of [base, ...SUFFIXES.map((s) => base + s)]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
  }
  // Extension-less relative imports (TS style, e.g. `./data`) from .ts modules.
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL) {
    const base = join(dirname(fileURLToPath(context.parentURL)), specifier);
    if (!existsSync(base) || !statSync(base).isFile()) {
      for (const candidate of SUFFIXES.map((s) => base + s)) {
        if (existsSync(candidate) && statSync(candidate).isFile()) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
    }
  }
  return nextResolve(specifier, context);
}
