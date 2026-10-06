# Pluralization Usage Examples

## ICU Message Format Pluralization

next-intl uses ICU message format for pluralization.

### New Keys Added:

```json
{
  "common": {
    "minute": "{count, plural, =1 {Minute} other {Minuten}}", // DE
    "minute": "{count, plural, =1 {minute} other {minutes}}", // EN
    "hour": "{count, plural, =1 {Stunde} other {Stunden}}", // DE
    "hour": "{count, plural, =1 {hour} other {hours}}" // EN
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
      <span>
        {minutes} {t('minutes')}
      </span>
      {/* → "5 minutes" for all numbers */}

      {/* New method - with pluralization */}
      <span>
        {minutes} {t('minute', { count: minutes })}
      </span>
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
      <p>
        {waitTime} {t('minute', { count: waitTime })}
      </p>
    </div>
  );
}
```

---

## Helper Functions

A wait time is a number and a unit, and no helper does both. The number goes through
`roundWaitTo5` (`lib/utils/wait-time.ts`) before it is shown, and the unit comes from
`t('minute', { count })` or the short `tCommon('min')`:

```tsx
import { roundWaitTo5 } from '@/lib/utils/wait-time';

const wait = roundWaitTo5(attraction.waitTime);
<span>
  {wait} {tCommon('minute', { count: wait })}
</span>;
```

A span of time in milliseconds has two formatters in `lib/i18n/time.ts`, both reading the
`common` namespace:

```tsx
import { formatDuration, formatDurationShort } from '@/lib/i18n/time';

formatDuration(5_400_000, tCommon); // "1 hour 30 minutes" (EN) / "1 Stunde 30 Minuten" (DE)
formatDurationShort(5_400_000, tCommon); // "1 h 30 min" (EN) / "1 Std. 30 Min." (DE)
```

---

## Migration Example

**Before:**

```tsx
<span>
  {avgWait} {tCommon('minutes')}
</span>
// Problem: "1 minutes" ❌
```

**After:**

```tsx
<span>
  {avgWait} {tCommon('minute', { count: avgWait })}
</span>
// ✅ "1 minute"
// ✅ "5 minutes"
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
t('items', { count: 0 }); // "no items"
t('items', { count: 1 }); // "one item"
t('items', { count: 5 }); // "5 items"
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
t('parkCount', { count: parks.length });
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
4. **Round a wait time with `roundWaitTo5()`** before it is displayed

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
