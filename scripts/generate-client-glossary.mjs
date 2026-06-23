#!/usr/bin/env node
/**
 * Generate client-side glossary data from content/glossary/{locale}.ts files.
 * This ensures CLIENT_GLOSSARY_TERMS is always in sync with source translations.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'es'];
const GLOSSARY_DIR = resolve(rootDir, 'content/glossary');
const DATA_FILE = resolve(rootDir, 'lib/glossary/data.ts');
// Legacy monolithic output (all terms × all locales, ~80 KB gzip) — replaced by the
// per-locale files below so GlossaryTermLink can lazily load only the active locale.
const OUTPUT_FILE = resolve(rootDir, 'lib/glossary/client-data.ts');
const OUTPUT_DIR = resolve(rootDir, 'lib/glossary/client-data');

/**
 * Parse lib/glossary/data.ts and extract the per-locale URL slugs for each term,
 * so client components can build glossary links without importing the full
 * GLOSSARY_TERMS data set.
 * Returns: { 'term-id': { en: 'slug', de: 'slug', ... } }
 */
function parseSlugsFromData() {
  const content = readFileSync(DATA_FILE, 'utf-8');
  const slugsByTerm = {};

  const termRe = /\{\s*id:\s*'([^']+)'[\s\S]*?slugs:\s*\{([\s\S]*?)\}/g;
  let match;
  while ((match = termRe.exec(content)) !== null) {
    const [, termId, slugsBlock] = match;
    const slugs = {};
    const slugRe = /([a-z]+):\s*'([^']+)'/g;
    let slugMatch;
    while ((slugMatch = slugRe.exec(slugsBlock)) !== null) {
      slugs[slugMatch[1]] = slugMatch[2];
    }
    const missing = LOCALES.filter((l) => !slugs[l]);
    if (missing.length > 0) {
      throw new Error(`Term '${termId}' in data.ts is missing slugs for: ${missing.join(', ')}`);
    }
    slugsByTerm[termId] = slugs;
  }

  if (Object.keys(slugsByTerm).length === 0) {
    throw new Error('No term slugs found in data.ts — parser out of sync with file format?');
  }

  return slugsByTerm;
}

/**
 * Parse a TypeScript glossary file and extract term data.
 * Robust parser using a state machine to handle multiline strings correctly.
 */
function parseGlossaryFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const terms = {};
  let pos = 0;

  function skipWhitespace() {
    while (pos < content.length && /\s/.test(content[pos])) pos++;
  }

  function extractString() {
    const quote = content[pos];
    pos++; // Skip opening quote
    let result = '';
    while (pos < content.length && content[pos] !== quote) {
      if (content[pos] === '\\' && pos + 1 < content.length) {
        result += content[pos] + content[pos + 1];
        pos += 2;
      } else {
        result += content[pos];
        pos++;
      }
    }
    if (content[pos] === quote) pos++; // Skip closing quote
    // Unescape and clean up newlines
    return result.replace(/\n\s+/g, ' ').trim();
  }

  // Find all term objects
  while (pos < content.length) {
    skipWhitespace();
    if (content[pos] !== '{') {
      pos++;
      continue;
    }

    pos++; // Skip opening brace
    const termData = {};

    // Parse object properties
    while (pos < content.length && content[pos] !== '}') {
      skipWhitespace();

      // Read property name
      const nameStart = pos;
      while (pos < content.length && /[a-zA-Z0-9_]/.test(content[pos])) pos++;
      const propName = content.substring(nameStart, pos);

      skipWhitespace();
      if (content[pos] === ':') pos++; // Skip colon
      skipWhitespace();

      // Read property value
      if (content[pos] === '"' || content[pos] === "'" || content[pos] === '`') {
        const value = extractString();
        termData[propName] = value;
      } else {
        // Skip non-string values
        while (pos < content.length && content[pos] !== ',' && content[pos] !== '}') {
          pos++;
        }
      }

      skipWhitespace();
      if (content[pos] === ',') pos++;
    }

    if (content[pos] === '}') pos++; // Skip closing brace

    // Store if we have required fields
    if (termData.id && termData.name && termData.shortDefinition) {
      terms[termData.id] = {
        name: termData.name,
        shortDefinition: termData.shortDefinition,
      };
    }
  }

  return terms;
}

/**
 * Load all glossary translations and build a combined map.
 * Returns: { 'term-id': { name: { en: '...', de: '...', ... }, shortDefinition: { ... } } }
 */
function loadAllGlossaryData() {
  const allTerms = {};

  for (const locale of LOCALES) {
    const filePath = resolve(GLOSSARY_DIR, `${locale}.ts`);
    const terms = parseGlossaryFile(filePath);

    for (const [termId, termData] of Object.entries(terms)) {
      if (!allTerms[termId]) {
        allTerms[termId] = { name: {}, shortDefinition: {} };
      }
      allTerms[termId].name[locale] = termData.name;
      allTerms[termId].shortDefinition[locale] = termData.shortDefinition;
    }
  }

  return allTerms;
}

/**
 * Generate a per-locale client-data file. Each file holds only one locale's flat
 * { termId: { name, shortDefinition, slug } } map (~13 KB gzip) so GlossaryTermLink
 * can lazily load just the active locale instead of all six (~80 KB gzip).
 */
function generatePerLocaleFile(locale, allTerms, slugsByTerm) {
  const entries = Object.entries(allTerms)
    .filter(([, data]) => data.name[locale] && data.shortDefinition[locale])
    .map(([termId, data]) => {
      const slug = slugsByTerm[termId]?.[locale];
      if (!slug) {
        throw new Error(`Term '${termId}' has translations but no '${locale}' slug in data.ts`);
      }
      // JSON.stringify produces a safely-escaped double-quoted string literal.
      return `  ${JSON.stringify(termId)}: { name: ${JSON.stringify(data.name[locale])}, shortDefinition: ${JSON.stringify(data.shortDefinition[locale])}, slug: ${JSON.stringify(slug)} },`;
    })
    .join('\n');

  return `/**
 * Client-side glossary data (${locale}) for tooltip + link support.
 * Lazily loaded by GlossaryTermLink via ../client-data-loader.
 * Auto-generated from content/glossary/${locale}.ts — do NOT edit manually.
 * Run: npm run generate:client-glossary
 */
import type { ClientTerm } from '../client-data-loader';

export const TERMS: Record<string, ClientTerm> = {
${entries}
};
`;
}

try {
  console.log('📝 Generating per-locale client glossary data...');
  const allTerms = loadAllGlossaryData();
  const slugsByTerm = parseSlugsFromData();
  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const locale of LOCALES) {
    writeFileSync(
      resolve(OUTPUT_DIR, `${locale}.ts`),
      generatePerLocaleFile(locale, allTerms, slugsByTerm),
      'utf-8'
    );
  }
  // Remove the obsolete monolithic file (replaced by the per-locale lazy chunks).
  if (existsSync(OUTPUT_FILE)) rmSync(OUTPUT_FILE);
  console.log(`✅ Generated ${LOCALES.length} per-locale files in ${OUTPUT_DIR}`);
  console.log(`   Found ${Object.keys(allTerms).length} glossary terms`);
} catch (error) {
  console.error('❌ Error generating client glossary data:', error.message);
  process.exit(1);
}
