/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const fs = require('fs');
const path = require('path');

/**
 * Simple Translation Validator
 * Checks translation files for inconsistencies and missing keys
 */

// Load translation files
const de = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/de.json'), 'utf-8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/en.json'), 'utf-8'));

// Extract all keys from nested object
function extractKeys(obj, prefix = '') {
    const keys = new Set();

    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const nested = extractKeys(value, fullKey);
            nested.forEach(k => keys.add(k));
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
    const regex = /(?:t|tCommon|tParks|tGeo|tExplore|tHome|tSearch|tAttractions|tStatus|tCalendar|tAdmin|tFooter|tNavigation|tTheme|tSeo)\s*\(\s*['"`]([^'"`\)]+)['"`]/g;

    lines.forEach((line, index) => {
        let match;
        while ((match = regex.exec(line)) !== null) {
            usage.push({
                key: match[1],
                line: index + 1,
                file: filePath
            });
        }
    });

    return usage;
}

// Recursively find all .ts and .tsx files
function findTsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
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

// Get all keys from both languages
const deKeys = extractKeys(de);
const enKeys = extractKeys(en);

console.log(`📊 German translations: ${deKeys.size} keys`);
console.log(`📊 English translations: ${enKeys.size} keys\n`);

// Find mismatches
const onlyInDe = [...deKeys].filter(k => !enKeys.has(k));
const onlyInEn = [...enKeys].filter(k => !deKeys.has(k));

if (onlyInDe.length > 0) {
    console.log(`❌ Keys only in German (${onlyInDe.length}):`);
    onlyInDe.forEach(key => console.log(`   - ${key}`));
    console.log('');
}

if (onlyInEn.length > 0) {
    console.log(`❌ Keys only in English (${onlyInEn.length}):`);
    onlyInEn.forEach(key => console.log(`   - ${key}`));
    console.log('');
}

// Scan codebase
console.log('🔍 Scanning codebase for translation usage...\n');
const rootDir = path.join(__dirname, '..');
const tsFiles = findTsFiles(rootDir);

console.log(`📁 Found ${tsFiles.length} TypeScript files\n`);

const allUsages = [];
tsFiles.forEach(file => {
    const usages = findTranslationUsageInFile(file);
    allUsages.push(...usages);
});

console.log(`📊 Found ${allUsages.length} translation usages\n`);

// Group by key
const usageByKey = new Map();
allUsages.forEach(usage => {
    if (!usageByKey.has(usage.key)) {
        usageByKey.set(usage.key, []);
    }
    usageByKey.get(usage.key).push(usage);
});

console.log(`📊 Unique translation keys used: ${usageByKey.size}\n`);

// Check for missing translations
const namespaceMap = {
    'common': 'common',
    'tHome': 'home',
    'tFooter': 'footer',
    'tExplore': 'explore',
    'tNavigation': 'navigation',
    'tTheme': 'theme',
    'tParks': 'parks',
    'tAttractions': 'attractions',
    'tCalendar': 'calendar',
    'tGeo': 'geo',
    'tSearch': 'search',
    'tAdmin': 'admin',
    'tSeo': 'seo'
};

const missingKeys = [];

usageByKey.forEach((usages, key) => {
    // Check if key exists in either language
    const existsInDe = deKeys.has(key);
    const existsInEn = enKeys.has(key);

    if (!existsInDe && !existsInEn) {
        // Try with namespaces
        let found = false;

        for (const namespace of ['common', 'home', 'footer', 'explore', 'navigation', 'theme', 'parks', 'attractions', 'calendar', 'geo', 'stats', 'homepage', 'search', 'admin', 'seo']) {
            const fullKey = `${namespace}.${key}`;
            if (deKeys.has(fullKey) || enKeys.has(fullKey)) {
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
    console.log(`❌ Missing translation keys (${missingKeys.length}):\n`);
    missingKeys.forEach(({ key, usages }) => {
        console.log(`   🔸 "${key}"`);
        usages.slice(0, 3).forEach(usage => {
            const relativePath = path.relative(rootDir, usage.file);
            console.log(`      Used in: ${relativePath}:${usage.line}`);
        });
        if (usages.length > 3) {
            console.log(`      ... and ${usages.length - 3} more locations`);
        }
        console.log('');
    });
}

// List potentially unused keys
const allTranslationKeys = new Set([...deKeys, ...enKeys]);
const unusedKeys = [];

allTranslationKeys.forEach(key => {
    const parts = key.split('.');

    // Check direct usage or last part usage
    let isUsed = false;

    if (usageByKey.has(key)) {
        isUsed = true;
    } else if (parts.length > 1) {
        const shortKey = parts.slice(1).join('.');
        if (usageByKey.has(shortKey)) {
            isUsed = true;
        }
    }

    if (!isUsed) {
        unusedKeys.push(key);
    }
});

if (unusedKeys.length > 0) {
    console.log(`\n🗑️  Potentially unused translation keys (${unusedKeys.length}):`);
    console.log(`   (These might be used dynamically or in untested code)\n`);
    unusedKeys.slice(0, 30).forEach(key => {
        console.log(`   - ${key}`);
    });
    if (unusedKeys.length > 30) {
        console.log(`   ... and ${unusedKeys.length - 30} more`);
    }
}

// Summary
console.log('\n═══════════════════════════════════════════════════');
console.log('📋 SUMMARY');
console.log('═══════════════════════════════════════════════════\n');
console.log(`Total translation keys: ${allTranslationKeys.size}`);
console.log(`Keys only in DE: ${onlyInDe.length}`);
console.log(`Keys only in EN: ${onlyInEn.length}`);
console.log(`Missing keys: ${missingKeys.length}`);
console.log(`Potentially unused keys: ${unusedKeys.length}`);
console.log('');

if (onlyInDe.length === 0 && onlyInEn.length === 0 && missingKeys.length === 0) {
    console.log('✅ All translations are in sync!\n');
    process.exit(0);
} else {
    console.log('❌ Found translation issues that need to be fixed.\n');
    process.exit(1);
}
