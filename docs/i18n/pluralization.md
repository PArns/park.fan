# Pluralization Usage Examples

## ICU Message Format Pluralization

next-intl uses ICU message format for pluralization.

### New Keys Added:

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

## Usage in Components

### Client Components

```tsx
import { useTranslations } from 'next-intl';

export function WaitTimeDisplay({ minutes }: { minutes: number }) {
  const t = useTranslations('common');
  
  return (
    <div>
      {/* Old method - no pluralization */}
      <span>{minutes} {t('minutes')}</span>  
      {/* → "5 minutes" for all numbers */}
      
      {/* New method - with pluralization */}
      <span>{minutes} {t('minute', { count: minutes })}</span>
      {/* → "1 minute" for 1, "5 minutes" for 5 */}
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

There are helpers for common use cases:

```tsx
import { formatWaitTime, formatHours } from '@/lib/i18n/time';

export function MyComponent() {
  const t = useTranslations('common');
  
  // Format wait time with count and unit
  const waitText = formatWaitTime(t, 15);  
  // → "15 minutes" (EN) / "15 Minuten" (DE)
  
  const waitSingle = formatWaitTime(t, 1);
  // → "1 minute" (EN) / "1 Minute" (DE)
  
  const hours = formatHours(t, 3);
  // → "3 hours" (EN) / "3 Stunden" (DE)
  
  return <div>{waitText}</div>;
}
```

---

## Migration Example

**Before:**
```tsx
<span>{avgWait} {tCommon('minutes')}</span>
// Problem: "1 minutes" ❌
```

**After:**
```tsx
<span>{avgWait} {tCommon('minute', { count: avgWait })}</span>
// ✅ "1 minute"
// ✅ "5 minutes"
```

Or with helper:
```tsx
import { formatWaitTime } from '@/lib/i18n/time';
<span>{formatWaitTime(tCommon, avgWait)}</span>
```

---

## ICU Plural Rules

The ICU format supports different plural categories:

```json
{
  "items": "{count, plural, =0 {no items} =1 {one item} other {# items}}"
}
```

- `=0` - Exact match for 0
- `=1` - Exact match for 1  
- `other` - All other numbers
- `#` - Replaced by the number

Example:
```tsx
t('items', { count: 0 })  // "no items"
t('items', { count: 1 })  // "one item"
t('items', { count: 5 })  // "5 items"
```

---

## Further Use Cases

### Parks Count

```json
{
  "parkCount": "{count, plural, =1 {1 park} other {# parks}}"
}
```

```tsx
t('parkCount', { count: parks.length })
```

### Countries Count

```json
{
  "countryCount": "{count, plural, =1 {1 country} other {# countries}}"
}
```

---

## Best Practices

1. **Use pluralization** for all countable units
2. **Use helpers** for recurring patterns
3. **`#` placeholder** to insert the number in the text
4. **Test both cases** - singular (1) and plural (>1)
5. **Consider edge cases** - What happens at 0?

---

## Migration Plan

1. **Identify all places** where `minutes`, `hours` etc. are used
2. **Replace gradually** with pluralized versions
3. **Test in both languages** (DE/EN)
4. **Use formatWaitTime()** for standard cases

Additional keys can be pluralized over time:
- `common.parks`
- `common.countries`  
- `common.rides`
- `explore.stats.park`
- `explore.stats.country`
- `explore.stats.city`

## Related

- [Internationalization](internationalization.md) – Locales and namespaces
- [Translation System](translations.md) – Adding keys, helpers, validation
