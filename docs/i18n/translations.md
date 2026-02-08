# Translation System Documentation

## Overview

The translation system uses `next-intl` with additional type-safety layers and build-time validation.

## Adding New Translations

### 1. Add to All Language Files

Always add new keys **to all** language files:
- `/messages/en.json`
- `/messages/de.json`
- (and nl, fr, es if applicable)

```json
// messages/de.json
{
  "myNamespace": {
    "myKey": "Meine Übersetzung"
  }
}

// messages/en.json
{
  "myNamespace": {
    "myKey": "My Translation"
  }
}
```

### 2. Use in Components

```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('myNamespace');
  
  return <div>{t('myKey')}</div>;
}
```

### 3. Use in Server Components

```tsx
import { getTranslations } from 'next-intl/server';

export async function MyPage() {
  const t = await getTranslations('myNamespace');
  
  return <div>{t('myKey')}</div>;
}
```

## Dynamic Translations

For **dynamic** translations (e.g. country names based on slugs), use the **type-safe helpers**:

### Country Names

```tsx
import { translateCountry } from '@/lib/i18n/helpers';
import { getTranslations } from 'next-intl/server';

const tGeo = await getTranslations('geo');
const locale = await getLocale();

// ❌ NOT LIKE THIS (not type-safe, no logging):
const country = tGeo(`countries.${slug}`);

// ✅ LIKE THIS (type-safe, with fallback & logging):
const country = translateCountry(
  (key) => tGeo(key),
  slug,
  locale,
  "Fallback Name" // optional
);
```

### Continent Names

```tsx
import { translateContinent } from '@/lib/i18n/helpers';

const continent = translateContinent(
  (key) => tGeo(key),
  continentSlug,
  locale
);
```

## Translation Logging

Missing translations are logged automatically:

### Development
- Warnings in console
- Real-time feedback

### Production Build
- All missing keys are stored in `translation-missing.json`
- Can be analyzed via crawler

## Validation & Testing

### 1. Linting During Development

```bash
pnpm validate:translations
```

Shows:
- Keys that only exist in one language
- Keys used in code but not defined
- Potentially unused keys

### 2. Build-Time Validation

```bash
pnpm build

# Check translation log
cat translation-missing.json
```

### 3. Post-Build Crawling

The crawler supports **two modes**:

**Static Mode (after build):**
```bash
pnpm build
pnpm crawl:translations
```
- Crawls pre-built HTML files
- Fast, offline
- Tests only statically generated pages

**Live Mode (against running server):**
```bash
pnpm dev  # or start for production
pnpm crawl:translations:live
```
- Makes HTTP requests
- Tests SSR/dynamic routes too
- Requires running server

## Naming Conventions

### Namespace Structure

```
common         - Globally used strings
  ├─ loading, error, retry, etc.
  ├─ crowd      - Crowd level translations
  └─ ...

parks          - Park-specific strings
attractions    - Attraction-specific strings
geo            - Geographic terms
  ├─ continents
  ├─ countries
  └─ ...

search         - Search function
footer         - Footer
navigation     - Navigation
theme          - Theme toggle
admin          - Admin dashboard
seo            - SEO meta tags
```

### Key Naming

- **camelCase** for regular keys: `avgWaitTime`, `crowdLevel`
- **kebab-case** for slugs/IDs: `north-america`, `united-states`
- **UPPERCASE** for status/enums: `OPERATING`, `CLOSED`
- **Descriptive**: `searchPlaceholderLong` instead of `placeholder2`

## Static Generation

### All Dynamic Routes Must Define staticParams

```tsx
// ✅ GOOD - generates all continents statically
export async function generateStaticParams() {
  const continents = await getContinents();
  return continents.map((c) => ({ continent: c.slug }));
}

// ❌ BAD - no static generation
export default async function MyPage({ params }) {
  // ...
}
```

### Important for Translation Validation!

Only statically generated pages can be validated by the crawler.

## CI/CD Integration

### Recommended Workflow

```yaml
# .github/workflows/validate-translations.yml
name: Validate Translations

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: node scripts/validate-translations.js
      - run: pnpm build
      - run: node scripts/crawl-translations.js
```

This ensures:
1. All locales stay in sync
2. No missing keys are committed
3. All pages are validated

## Troubleshooting

### "Missing translation" Warning in Console

**Problem:** `[Translation Missing] de/geo.countries.xyz`

**Solution:**
1. Check if key exists in `messages/de.json` and `messages/en.json`
2. Check namespace (must be `geo.countries.xyz`, not `countries.xyz`)
3. Use helper function for dynamic lookups

### Template String Not Replaced

**Problem:** `${country}` is shown in HTML

**Solution:**
- Do not use `` t(`countries.${slug}`) ``
- Use `translateCountry()` helper instead

### Build Fails with Translation Errors

**Problem:** Build fails due to missing translations

**Solution:**
1. Run `node scripts/validate-translations.js`
2. Add missing keys
3. Build again
4. Run `node scripts/crawl-translations.js` for validation

## Best Practices

1. **Always update all languages** - never only one locale
2. **Use type-safe helpers** for dynamic translations
3. **generateStaticParams** for all dynamic routes
4. **Run validation script** before every commit
5. **Use crawler** after each build
6. **Descriptive keys** - not `label1`, `text2`, etc.
7. **Logical namespaces** - group related translations
8. **Fallbacks** - always provide fallback values for dynamic lookups

## Related

- [Internationalization](internationalization.md) – Locales, namespaces, usage
- [Pluralization](pluralization.md) – ICU plurals, `formatWaitTime`
- [Development Scripts](../development/scripts.md) – Validation and crawler
