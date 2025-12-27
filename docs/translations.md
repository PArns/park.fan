# Translation System Documentation

## Overview

Das Translation System nutzt `next-intl` mit zusätzlichen Type-Safety Layers und Build-Time Validation.

## Adding New Translations

### 1. Add to Both Language Files

Füge neue Keys **immer in beide** Dateien hinzu:
- `/messages/de.json`
- `/messages/en.json`

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

Für **dynamische** Übersetzungen (z.B. Ländernamen basierend auf Slugs), nutze die **Type-Safe Helpers**:

### Country Names

```tsx
import { translateCountry } from '@/lib/i18n/helpers';
import { getTranslations } from 'next-intl/server';

const tGeo = await getTranslations('geo');
const locale = await getLocale();

// ❌ NICHT SO (nicht type-safe, kein Logging):
const country = tGeo(`countries.${slug}`);

// ✅ SO (type-safe, mit Fallback & Logging):
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

Fehlende Übersetzungen werden automatisch geloggt:

### Development
- Warnings in der Console
- Echtzeit-Feedback

### Production Build
- Alle fehlenden Keys werden in `translation-missing.json` gespeichert
- Kann via Crawler analysiert werden

## Validation & Testing

### 1. Linting During Development

```bash
# Validation script ausführen
node scripts/validate-translations.js
```

Zeigt:
- Keys die nur in DE existieren
- Keys die nur in EN existieren
- Keys die im Code verwendet aber nicht definiert sind
- Potentiell ungenutzte Keys

### 2. Build-Time Validation

```bash
# Build erstellen
npm run build

# Translation log checken
cat translation-missing.json
```

### 3. Post-Build Crawling

Der Crawler unterstützt **zwei Modi**:

**Static Mode (nach Build):**
```bash
npm run build
npm run crawl:translations
```
- Crawlt pre-built HTML files
- Schnell, offline
- Testet nur statisch generierte Pages

**Live Mode (gegen laufenden Server):**
```bash
npm run dev  # oder start für production
npm run crawl:translations:live
```
- Macht HTTP requests
- Testet auch SSR/dynamic routes
- Braucht laufenden Server

## Naming Conventions

### Namespace Structure

```
common         - Global verwendete Strings
  ├─ loading, error, retry, etc.
  ├─ crowd      - Crowd Level Translations
  └─ ...

parks          - Park-spezifische Strings
attractions    - Attraction-spezifische Strings
geo            - Geografische Begriffe
  ├─ continents
  ├─ countries
  └─ ...

search         - Suchfunktion
footer         - Footer
navigation     - Navigation
theme          - Theme Toggle
admin          - Admin Dashboard
seo            - SEO Meta Tags
```

### Key Naming

- **camelCase** für reguläre Keys: `avgWaitTime`, `crowdLevel`
- **kebab-case** für Slugs/IDs: `north-america`, `united-states`
- **UPPERCASE** für Status/Enums: `OPERATING`, `CLOSED`
- **Beschreibend**: `searchPlaceholderLong` statt `placeholder2`

## Static Generation

### Alle Dynamic Routes müssen staticParams definieren

```tsx
// ✅ GUT - generiert alle Continents statisch
export async function generateStaticParams() {
  const continents = await getContinents();
  return continents.map((c) => ({ continent: c.slug }));
}

// ❌ SCHLECHT - keine static generation
export default async function MyPage({ params }) {
  // ...
}
```

### Wichtig für Translation Validation!

Nur statisch generierte Pages können vom Crawler validiert werden.

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
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node scripts/validate-translations.js
      - run: npm run build
      - run: node scripts/crawl-translations.js
```

Dies stellt sicher dass:
1. DE/EN in sync bleiben
2. Keine fehlenden Keys committed werden
3. Alle Pages validiert werden

## Troubleshooting

### "Missing translation" Warning in Console

**Problem:** `[Translation Missing] de/geo.countries.xyz`

**Lösung:**
1. Prüfe ob Key in `messages/de.json` und `messages/en.json` existiert
2. Prüfe Namespace (muss `geo.countries.xyz` sein, nicht `countries.xyz`)
3. Nutze Helper-Funktion für dynamische Lookups

### Template String not Replaced

**Problem:** `${country}` wird im HTML angezeigt

**Lösung:**
- Nicht `` t(`countries.${slug}`) `` verwenden
- Stattdessen `translateCountry()` Helper nutzen

### Build Fails with Translation Errors

**Problem:** Build schlägt fehl wegen fehlender Translations

**Lösung:**
1. `node scripts/validate-translations.js` ausführen
2. Fehlende Keys hinzufügen
3. Erneut builden
4. `node scripts/crawl-translations.js` zur Validierung

## Best Practices

1. **Immer beide Sprachen updaten** - nie nur DE oder EN
2. **Type-Safe Helpers nutzen** für dynamische Übersetzungen
3. **generateStaticParams** für alle Dynamic Routes
4. **Validation Script** vor jedem Commit laufen lassen
5. **Crawler** nach jedem Build nutzen
6. **Beschreibende Keys** - nicht `label1`, `text2`, etc.
7. **Namespace logisch** - gruppiere verwandte Übersetzungen
8. **Fallbacks** - immer Fallback-Werte für dynamische Lookups angeben
