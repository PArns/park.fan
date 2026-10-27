# Translations

How to add a UI string, translate a country or continent by slug, write plurals and durations, and
which checks catch a missing or untranslated string. Which strings reach the browser on which
route: [internationalization](internationalization.md). How the strings themselves are written:
[docs/writing/README.md](../writing/README.md).

## Adding a string

Every user-facing string is a key in `messages/<locale>.json`, added to **all six** files in the
same pull request, with no follow-up ticket (the requirement
[posts follow too](../rules/a-post-ships-in-six-languages-in-one-pull-request.md)). Copy is written
in German first; the other five are translations, not copies.

```tsx
// Client or shared component
const t = useTranslations('myNamespace');
t('myKey');

// Server component
const t = await getTranslations('myNamespace');
```

A client component's namespace has to reach the browser on its route: after adding a
`useTranslations('…')` to a component that crosses the client boundary, run
`pnpm generate:route-namespaces` ([why](internationalization.md#which-namespaces-reach-the-client)).

Key naming: `camelCase` for keys (`avgWaitTime`), kebab-case where the key is a slug
(`geo.countries.united-states`), the API's spelling for enums (`OPERATING`), and a name that says
what the string is (`searchPlaceholderLong`, not `placeholder2`).

## Countries and continents by slug

A key built from an API slug (``tGeo(`countries.${slug}`)``) prints the raw key when the slug is
new. `translateCountry` and `translateContinent` (`lib/i18n/helpers.ts`) fall back to the
prettified slug (or a fallback you pass) and log the missing key:

```tsx
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';

const tGeo = await getTranslations('geo');
const country = translateCountry((key) => tGeo(key), slug, locale, 'Fallback Name');
const continent = translateContinent((key) => tGeo(key), continentSlug, locale);
```

Missing keys go through `lib/i18n/logger.ts`: a console warning in development, and during
`next build` only a `translation-missing.json` in the project root (a write on the render path is
slow and fails on Vercel's read-only file system).

## Plurals and durations

Plurals use ICU syntax: `=0`, `=1`, `other`, and `#` for the number.

```json
{ "minute": "{count, plural, =1 {minute} other {minutes}}" }
```

```tsx
t('minute', { count: wait }); // "1 minute", "5 minutes"
```

`common.minutes` and `common.min` are the short unit ("min", "Min"), and `common.parks`,
`common.countries`, `common.rides` are plain words; pluralize a key when a count first stands next
to it. Test 0, 1 and many.

A wait time is a number and a unit, and no helper does both: round the number for display with
`roundWaitTo5` (`lib/utils/wait-time.ts`; the walk-on value and deltas are in
[the guide page rule](../rules/the-guide-page-teaches-the-real-cards-with-the-rides-real.md)), and
take the unit from `t('minute', { count })` or `tCommon('min')`. A span in milliseconds goes through
`lib/i18n/time.ts`:

```tsx
formatDuration(5_400_000, tCommon); // "1 hour 30 minutes" / "1 Stunde 30 Minuten"
formatDurationShort(5_400_000, tCommon); // "1 h 30 min" / "1 Std. 30 Min."
```

## Checks

`pnpm validate:translations` (key sets against `en`), `pnpm check:untranslated` (below) and
`pnpm check:client-messages` (both in `prebuild`), and two crawls for raw keys in the HTML; what each
one catches is in [scripts → translations](../development/scripts.md#translations). The static crawl
sees only prerendered pages; park, ride and other `force-dynamic` routes need the live crawl.

### A key can be present and still be German

`validate:translations` compares key sets, never values. Because copy is written in German first,
the recurring failure is a commit that rewrites `messages/de.json` and carries the German into the
other five files because the keys have to exist there; every structural check then passes. Six
German headings once reached the `/en` homepage that way.

`pnpm check:untranslated` reports a value only when it is identical to the German **and** reads as
German: a German function word that is not a word in en/nl/fr/es/it, an `ß`, or five words or
more. "Identical to the German" alone flags 113 correct translations (`Blog`, `Single Rider`,
`Rope Drop`, and Dutch that spells words the German way: `Morgen`, `Kalender`, `Minuten`). If a
genuine coincidence trips it, add the key to `ALLOWED` in `scripts/check-untranslated.mjs` with the
reason; do not widen the rule.

### Troubleshooting

- **`[Translation Missing] de/geo.countries.xyz`**: the key is missing in that locale, or the
  namespace is wrong (`geo.countries.xyz`, not `countries.xyz`); for slugs use the helpers above.
- **`${country}` in the HTML**: a template string was passed to `t()`; use `translateCountry()`.
- **A raw key such as `parks.status.open` on the page**: the namespace did not reach the client on
  that route; see [internationalization](internationalization.md#which-namespaces-reach-the-client).
