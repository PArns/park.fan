#!/usr/bin/env node
/**
 * Generate client-side glossary data from content/glossary/{locale}.ts files.
 * This ensures CLIENT_GLOSSARY_TERMS is always in sync with source translations.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'es'];
const GLOSSARY_DIR = resolve(rootDir, 'content/glossary');
const OUTPUT_FILE = resolve(rootDir, 'lib/glossary/client-data.ts');

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
 * Generate TypeScript source code for client data.
 */
function generateClientDataFile(allTerms) {
  const termsObject = Object.entries(allTerms)
    .map(([termId, data]) => {
      const nameObj = Object.entries(data.name)
        .map(([locale, name]) => `      ${locale}: '${name.replace(/'/g, "\\'")}'`)
        .join(',\n');

      const defObj = Object.entries(data.shortDefinition)
        .map(([locale, def]) => `      ${locale}: '${def.replace(/'/g, "\\'")}'`)
        .join(',\n');

      return `  '${termId}': {
    name: {
${nameObj}
    },
    shortDefinition: {
${defObj}
    },
  }`;
    })
    .join(',\n');

  return `/**
 * Client-side glossary data for Tooltip support.
 * Auto-generated from content/glossary/{locale}.ts files.
 * Do NOT edit manually — run: npm run generate:client-glossary
 */

import type { Locale } from '@/i18n/config';

export interface ClientGlossaryTerm {
  name: Record<Locale, string>;
  shortDefinition: Record<Locale, string>;
}

export const CLIENT_GLOSSARY_TERMS: Record<string, ClientGlossaryTerm> = {
${termsObject}
};
`;
}

try {
  console.log('📝 Generating client glossary data...');
  const allTerms = loadAllGlossaryData();
  const output = generateClientDataFile(allTerms);
  writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`✅ Generated ${OUTPUT_FILE}`);
  console.log(`   Found ${Object.keys(allTerms).length} glossary terms`);
} catch (error) {
  console.error('❌ Error generating client glossary data:', error.message);
  process.exit(1);
}
