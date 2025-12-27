# Pluralization Usage Examples

## ICU Message Format Pluralization

next-intl nutzt ICU message format für Pluralisierung.

### Neue Keys hinzugefügt:

```json
{
  "common": {
    "minute": "{count, plural, =1 {Minute} other {Minuten}}",  // DE
    "minute": "{count, plural, =1 {minute} other {minutes}}",  // EN
    "hour": "{count, plural, =1 {Stunde} other {Stunden}}",    // DE  
    "hour": "{count, plural, =1 {hour} other {hours}}"         // EN
  }
}
```

---

## Verwendung in Components

### Client Components

```tsx
import { useTranslations } from 'next-intl';

export function WaitTimeDisplay({ minutes }: { minutes: number }) {
  const t = useTranslations('common');
  
  return (
    <div>
      {/* Alte Methode - keine Pluralisierung */}
      <span>{minutes} {t('minutes')}</span>  
      {/* → "5 Minuten" für alle Zahlen */}
      
      {/* Neue Methode - mit Pluralisierung */}
      <span>{minutes} {t('minute', { count: minutes })}</span>
      {/* → "1 Minute" für 1, "5 Minuten" für 5 */}
    </div>
  );
}
```

### Server Components

```tsx
import { getTranslations } from 'next-intl/server';

export async function ParkStats({ waitTime }: { waitTime: number }) {
  const t = await getTranslations('common');
  
  return (
    <div>
      <p>{waitTime} {t('minute', { count: waitTime })}</p>
    </div>
  );
}
```

---

## Helper Functions

Für häufige Use-Cases gibt es Helper:

```tsx
import { formatWaitTime, formatHours } from '@/lib/i18n/time';

export function MyComponent() {
  const t = useTranslations('common');
  
  // Format wait time with count and unit
  const waitText = formatWaitTime(t, 15);  
  // → "15 Minuten" (DE) / "15 minutes" (EN)
  
  const waitSingle = formatWaitTime(t, 1);
  // → "1 Minute" (DE) / "1 minute" (EN)
  
  const hours = formatHours(t, 3);
  // → "3 Stunden" (DE) / "3 hours" (EN)
  
  return <div>{waitText}</div>;
}
```

---

## Migration Beispiel

**Vorher:**
```tsx
<span>{avgWait} {tCommon('minutes')}</span>
// Problem: "1 Minuten" ❌
```

**Nachher:**
```tsx
<span>{avgWait} {tCommon('minute', { count: avgWait })}</span>
// ✅ "1 Minute"
// ✅ "5 Minuten"
```

Oder mit Helper:
```tsx
import { formatWaitTime } from '@/lib/i18n/time';
<span>{formatWaitTime(tCommon, avgWait)}</span>
```

---

## ICU Plural Rules

Das ICU Format unterstützt verschiedene Plural-Kategorien:

```json
{
  "items": "{count, plural, =0 {keine Items} =1 {ein Item} other {# Items}}"
}
```

- `=0` - Exact match für 0
- `=1` - Exact match für 1  
- `other` - Alle anderen Zahlen
- `#` - Wird durch die Zahl ersetzt

Beispiel:
```tsx
t('items', { count: 0 })  // "keine Items"
t('items', { count: 1 })  // "ein Item"
t('items', { count: 5 })  // "5 Items"
```

---

## Weitere Anwendungsfälle

### Parks Count

```json
{
  "parkCount": "{count, plural, =1 {1 Park} other {# Parks}}"
}
```

```tsx
t('parkCount', { count: parks.length })
```

### Countries Count

```json
{
  "countryCount": "{count, plural, =1 {1 Land} other {# Länder}}"
}
```

---

## Best Practices

1. **Nutze Pluralisierung** für alle zählbaren Einheiten
2. **Helpers verwenden** für wiederkehrende Patterns
3. **`#` Placeholder** um die Zahl in den Text einzufügen
4. **Teste beide Fälle** - Singular (1) und Plural (\u003e1)
5. **Edge Cases bedenken** - Was passiert bei 0?

---

## Migrationsplan

1. **Identifiziere alle Stellen** wo `minutes`, `hours` etc. verwendet werden
2. **Ersetze schrittweise** mit pluralisierten Versionen
3. **Teste in beiden Sprachen** (DE/EN)
4. **Nutze formatWaitTime()** für Standard-Fälle

Nach und nach können weitere Keys pluralisiert werden:
- `common.parks`
- `common.countries`  
- `common.rides`
- `explore.stats.park`
- `explore.stats.country`
- `explore.stats.city`
