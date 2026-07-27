/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

/**
 * Simple Translation Validator
 * Checks translation files for inconsistencies and missing keys
 */

// Import locales from central config
// Note: We need to read from the compiled config since this is a JS file
const configPath = path.join(__dirname, '../i18n/config.ts');
const configContent = fs.readFileSync(configPath, 'utf-8');
const localesMatch = configContent.match(/locales\s*=\s*\[(.*?)\]/);
const locales = localesMatch
  ? localesMatch[1].replace(/['"\s]/g, '').split(',')
  : ['en', 'de', 'nl', 'fr', 'es'];
const masterLocale = 'en';

// Load translation files
const translations = {};
locales.forEach((originalLocale) => {
  try {
    const content = fs.readFileSync(
      path.join(__dirname, `../messages/${originalLocale}.json`),
      'utf-8'
    );
    translations[originalLocale] = JSON.parse(content);
  } catch (e) {
    console.warn(`⚠️ Could not load ${originalLocale}.json: ${e.message}`);
    translations[originalLocale] = {};
  }
});

// Extract all keys from nested object
function extractKeys(obj, prefix = '') {
  const keys = new Set();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nested = extractKeys(value, fullKey);
      nested.forEach((k) => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  }

  return keys;
}

// Scan files for translation usage
function findTranslationUsageInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const usage = [];

  // Regex to find t('key'), tCommon('key'), etc.
  const regex =
    /(?:t|tCommon|tParks|tGeo|tExplore|tHome|tSearch|tAttractions|tStatus|tCalendar|tAdmin|tFooter|tNavigation|tTheme|tSeo)\s*\(\s*['"`]([^'"`\)]+)['"`]/g;

  lines.forEach((line, index) => {
    let match;
    while ((match = regex.exec(line)) !== null) {
      usage.push({
        key: match[1],
        line: index + 1,
        file: filePath,
      });
    }
  });

  return usage;
}

// Recursively find all .ts and .tsx files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip certain directories
      if (!['node_modules', '.next', 'dist', '.git'].includes(file)) {
        findTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

console.log('🔍 Starting translation validation...\n');

// Get all keys from all languages
const keysByLocale = {};
locales.forEach((locale) => {
  keysByLocale[locale] = extractKeys(translations[locale]);
  console.log(`📊 ${locale.toUpperCase()} translations: ${keysByLocale[locale].size} keys`);
});
console.log('');

// Find mismatches relative to master (EN)
const masterKeys = keysByLocale[masterLocale];
let hasErrors = false;

locales
  .filter((l) => l !== masterLocale)
  .forEach((locale) => {
    const localeKeys = keysByLocale[locale];
    const missingInLocale = [...masterKeys].filter((k) => !localeKeys.has(k));
    const extraInLocale = [...localeKeys].filter((k) => !masterKeys.has(k));

    if (missingInLocale.length > 0) {
      console.log(
        `❌ Keys missing in ${locale.toUpperCase()} (vs ${masterLocale.toUpperCase()}) (${missingInLocale.length}):`
      );
      missingInLocale.forEach((key) => console.log(`   - ${key}`));
      console.log('');
      hasErrors = true;
    }

    if (extraInLocale.length > 0) {
      console.log(
        `⚠️ Keys extra in ${locale.toUpperCase()} (vs ${masterLocale.toUpperCase()}) (${extraInLocale.length}):`
      );
      extraInLocale.forEach((key) => console.log(`   - ${key}`));
      console.log('');
    }
  });

// Scan codebase
console.log('🔍 Scanning codebase for translation usage...\n');
const rootDir = path.join(__dirname, '..');
const tsFiles = findTsFiles(rootDir);

console.log(`📁 Found ${tsFiles.length} TypeScript files\n`);

const allUsages = [];
tsFiles.forEach((file) => {
  const usages = findTranslationUsageInFile(file);
  allUsages.push(...usages);
});

console.log(`📊 Found ${allUsages.length} translation usages\n`);

// Group by key
const usageByKey = new Map();
allUsages.forEach((usage) => {
  if (!usageByKey.has(usage.key)) {
    usageByKey.set(usage.key, []);
  }
  usageByKey.get(usage.key).push(usage);
});

console.log(`📊 Unique translation keys used: ${usageByKey.size}\n`);

// Check for missing translations (must exist in master locale)
const missingKeys = [];

usageByKey.forEach((usages, key) => {
  // Check if key exists in master language
  const existsInMaster = masterKeys.has(key);

  if (!existsInMaster) {
    // Try with namespaces
    let found = false;

    for (const namespace of [
      'common',
      'home',
      'footer',
      'explore',
      'navigation',
      'theme',
      'parks',
      'attractions',
      'calendar',
      'geo',
      'stats',
      'homepage',
      'search',
      'admin',
      'seo',
      'favorites',
      'impressum',
      'datenschutz',
    ]) {
      const fullKey = `${namespace}.${key}`;
      if (masterKeys.has(fullKey)) {
        found = true;
        break;
      }
    }

    if (!found) {
      missingKeys.push({ key, usages });
    }
  }
});

if (missingKeys.length > 0) {
  console.log(
    `❌ Missing translation keys in master (${masterLocale.toUpperCase()}) (${missingKeys.length}):\n`
  );
  missingKeys.forEach(({ key, usages }) => {
    console.log(`   🔸 "${key}"`);
    usages.slice(0, 3).forEach((usage) => {
      const relativePath = path.relative(rootDir, usage.file);
      console.log(`      Used in: ${relativePath}:${usage.line}`);
    });
    if (usages.length > 3) {
      console.log(`      ... and ${usages.length - 3} more locations`);
    }
    console.log('');
  });
  // We don't fail just for code usage missing in keys if they were already missing before
}

// ── languageBanner mirror check ─────────────────────────────────────────────
// lib/i18n/language-banner-messages.ts inlines the `languageBanner` strings for EVERY locale
// (the banner renders in the visitor's browser language, not the page's, so it can't read the
// page's provider messages — and downloading a whole message bundle for 3 strings was the
// alternative). messages/<locale>.json stays the source of truth, so fail loudly on drift.
{
  const bannerModulePath = path.join(__dirname, '../lib/i18n/language-banner-messages.ts');
  const bannerFields = ['message', 'switchButton', 'dismiss'];
  const drift = [];
  try {
    const source = fs.readFileSync(bannerModulePath, 'utf-8');
    for (const locale of locales) {
      const expected = translations[locale]?.languageBanner;
      if (!expected) continue;
      // Match the `<locale>: { … }` entry of LANGUAGE_BANNER_MESSAGES.
      const block = source.match(new RegExp(`\\b${locale}:\\s*\\{([\\s\\S]*?)\\n {2}\\}`));
      if (!block) {
        drift.push(`${locale}: missing from LANGUAGE_BANNER_MESSAGES`);
        continue;
      }
      for (const field of bannerFields) {
        // Values are single- or double-quoted string literals on one line.
        const valueMatch = block[1].match(new RegExp(`${field}:\\s*(['"])([\\s\\S]*?)\\1,`));
        const actual = valueMatch ? valueMatch[2].replace(/\\'/g, "'").replace(/\\"/g, '"') : null;
        if (actual !== expected[field]) {
          drift.push(
            `${locale}.${field}: expected ${JSON.stringify(expected[field])}, got ${JSON.stringify(actual)}`
          );
        }
      }
    }
  } catch (e) {
    drift.push(`could not read language-banner-messages.ts: ${e.message}`);
  }

  if (drift.length > 0) {
    hasErrors = true;
    console.log(`\n❌ lib/i18n/language-banner-messages.ts is out of sync with messages/*.json:\n`);
    drift.forEach((line) => console.log(`   🔸 ${line}`));
    console.log('');
  }
}

// List potentially unused keys
const unusedKeys = [];

masterKeys.forEach((key) => {
  const parts = key.split('.');
  let isUsed = false;

  if (usageByKey.has(key)) {
    isUsed = true;
  } else if (parts.length > 1) {
    const shortKey = parts.slice(1).join('.');
    if (usageByKey.has(shortKey)) {
      isUsed = true;
    }
  }

  // Also check for prefix usage (e.g. t("home.hero") might use "home.hero.title")
  if (!isUsed) {
    usageByKey.forEach((_, usageKey) => {
      if (key.startsWith(usageKey + '.')) {
        isUsed = true;
      }
    });
  }

  if (!isUsed) {
    unusedKeys.push(key);
  }
});

// Summary
console.log('\n═══════════════════════════════════════════════════');
console.log('📋 SUMMARY');
console.log('═══════════════════════════════════════════════════\n');
console.log(`Total translation keys (EN): ${masterKeys.size}`);
console.log(`Keys missing in locales: ${hasErrors ? 'YES' : 'NO'}`);
console.log(`Missing keys in code: ${missingKeys.length}`);
console.log('');

if (!hasErrors) {
  console.log('✅ All translations are synchronized with master!\n');
  process.exit(0);
} else {
  console.log('❌ Found translation issues that need to be fixed.\n');
  process.exit(1);
}
