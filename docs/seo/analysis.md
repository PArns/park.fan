# park.fan SEO Analysis

As of February 2026. Full-site analysis with concrete recommendations.

---

## Already Well Implemented

| Area | Status |
|------|--------|
| **Metadata** | `generateMetadata` on all relevant pages (Home, Parks, Park, Attraction, Continent, Country, City, Search, Impressum, Privacy) |
| **Canonical URLs** | Set everywhere, locale-specific |
| **hreflang / alternates** | `alternates.languages` + `x-default` in locale layout and subpages |
| **Open Graph** | title, description, url, locale, images (1200×630), siteName |
| **Twitter Cards** | summary_large_image with title, description, image |
| **Structured Data** | Organization, WebSite (with SearchAction), ThemePark, TouristAttraction, BreadcrumbList, FAQPage (Home + Park + Attraction), Event (Shows) |
| **Sitemap** | Dynamic from geo structure, all locales, priorities and changeFrequency set |
| **robots.txt** | Allow /, Disallow /api/ and /_next/, Sitemap URL specified |
| **Semantics** | H1 per page, nav with aria-label |
| **Viewport & Theme** | viewport, themeColor for Light/Dark |

---

## Recommended Optimizations

### 1. **Sitemap: Add Static Pages**

**Problem:** Impressum, Privacy, and the plain search URL (`/search`) are not in the sitemap.

**Recommendation:** Add in `app/sitemap.ts`:
- `${BASE_URL}/${locale}/impressum`
- `${BASE_URL}/${locale}/datenschutz`
- `${BASE_URL}/${locale}/search` (search page only, no query, e.g. priority 0.5, changeFrequency monthly)

**Benefit:** Important legal pages and search entry page become indexable and visible in sitemap.

---

### 2. **Search Pages with Query: Consider noindex**

**Problem:** Each search URL with `?q=...` gets its own canonical URL and could be treated as duplicate content.

**Recommendation:** For search pages with query parameter, set `robots` to `noindex, follow`:
- In `app/[locale]/search/page.tsx` in `generateMetadata`:  
  When `q` is present: `robots: { index: false, follow: true }`.
- Without query (`/search`) keep `index: true` (inherited from layout).

**Benefit:** Reduces duplicate content risk; search pages with empty or generic query are not indexed as separate "pages".

---

### 3. **hreflang: Absolute URLs (optional, Best Practice)**

**Problem:** Next.js uses relative paths for `alternates.languages` (e.g. `/de/parks`). Google accepts this but recommends absolute URLs for hreflang.

**Recommendation:** If you want to control the `<link rel="alternate" hreflang="...">` output, build absolute URLs in a central helper, e.g.:

```ts
const SITE_URL = 'https://park.fan';
export function getAlternateLanguages(pathTemplate: (locale: Locale) => string) {
  const result: Record<string, string> = {};
  for (const locale of locales) {
    result[locale] = `${SITE_URL}${pathTemplate(locale)}`;
  }
  result['x-default'] = `${SITE_URL}/en`;
  return result;
}
```

Then generate `canonical` and `languages` values with this base URL in all `generateMetadata`.  
**Note:** Next.js may already output absolute URLs from relative paths – check the rendered HTML first. If it already shows absolute URLs, no change needed.

---

### 4. **Check Title Length (especially Park/Attraction)**

**Problem:** Long titles (e.g. "{Park} {City} Live Wait Times, Crowd Calendar & Best Days to Visit") can be truncated in search results (~50–60 chars visible).

**Recommendation:**
- Adjust title templates in messages so the core (Park/Attraction + location) comes first and stays under ~55 chars, e.g.  
  `{park} – Wait Times & Crowd | park.fan` or  
  `{attraction} @ {park} – Wait Times | park.fan`.
- Consider shortening "… Live Wait Times, Crowd Calendar & Best Days to Visit" or moving it to meta description.

**Benefit:** Better SERP display, less truncation of important names.

---

### 5. **Meta Description Length**

**Problem:** Meta descriptions should ideally be ~150–160 characters.

**Recommendation:** In `messages/*.json`, measure values for `seo.*.metaDescriptionTemplate` and `seo.*.description` with typical placeholder values. Shorten overly long texts; keep core message and call-to-action at the front.

**Benefit:** Full display in SERP and clearer user messaging.

---

### 6. **Web App Manifest and Icons**

**Problem:** No `manifest.json` (or PWA manifest) and no explicit Apple Touch Icon references.

**Recommendation:**
- Create `app/manifest.ts` (or `manifest.json`) with:
  - `name`, `short_name`, `description`, `start_url` (e.g. `/en`), `display: 'standalone'` or `'browser'`, `theme_color`, `background_color`, `icons` (min. 192×192, 512×512).
- In `app/layout.tsx` or root layout:
  - `<link rel="icon" href="/favicon.ico" sizes="any" />` (if not already present)
  - Optional: `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` (180×180)

**Benefit:** Better behavior when adding to home screen, clear branding icons, possible positive signals for "complete" website.

---

### 7. **Structured Data: ItemList for List Pages (optional)**

**Problem:** Continent/Country/City pages list parks without ItemList schema.

**Recommendation:** Optionally add `ItemList` schema for Continent, Country, City:
- `@type: ItemList`
- `numberOfItems`, `itemListElement` (list of `ListItem` with `url` and `name` of parks)

**Benefit:** Search engines can better interpret the page as "list of parks in X"; potential for extended snippets.

---

### 8. **Image Alt Text and Lazy Loading**

**Status:** OG images already have translated alt texts (`seo.imageAlt`).

**Recommendation:** Ensure all content-relevant images (e.g. park backgrounds, attraction images) have an `alt` attribute (descriptive, with park/attraction name). Check `loading="lazy"` for below-the-fold images if needed (Next.js `Image` often does this already).

---

### 9. **Core Web Vitals & Performance**

**Note:** Not purely "SEO text", but a ranking factor.

**Recommendation:** Monitor LCP, INP/FID, CLS (e.g. Vercel Analytics, Search Console). Already positive: fonts with `display: 'swap'`, viewport set. For pages with many parks/attractions: keep dynamic imports (e.g. for maps/calendar).

---

### 10. **404 and Error Pages**

**Status:** `app/not-found.tsx` exists.

**Recommendation:** Ensure the 404 page:
- has clear, helpful text and link to homepage/search,
- does not get `noindex` (404 pages may be indexed, though Google often removes them),
- optionally add a simple breadcrumb or "You are here: park.fan → Page not found" for context.

---

### 11. **Internal Linking & Breadcrumbs**

**Status:** BreadcrumbNav and Breadcrumb structured data are present.

**Recommendation:** Keep as is. Optionally check on important pages (Park, Attraction) if 1–2 contextual links to "More parks in {City}" or "Attractions in {Park}" are set – supports discoverability and thematic grouping.

---

### 12. **Duplicate CSS Import (already fixed)**

**Problem:** `app/layout.tsx` imported `./globals.css` twice.

**Status:** Removed – only one import now.

---

## Prioritization

| Priority | Action | Effort | Benefit |
|----------|--------|--------|---------|
| High | Extend sitemap with Impressum, Privacy, /search | Low | Index legal pages + search entry |
| High | Set search pages with `?q=...` to noindex, follow | Low | Avoid duplicate content |
| Medium | Shorten title templates (Park/Attraction) | Medium | Better SERP display |
| Medium | Check/shorten meta description lengths | Low | Better SERP display |
| Medium | Web app manifest + icons | Low | Completeness, Add-to-Homescreen |
| Low | hreflang absolute URLs (only if currently relative) | Low | Best practice |
| Low | ItemList for Continent/Country/City | Medium | Optional better list interpretation |

---

## Quick Checklist Before Go-Live / After Major Changes

- [ ] Sitemap includes all important static pages (incl. Impressum, Privacy, /search).
- [ ] Search pages with query are noindex, follow.
- [ ] Title per page under ~60 characters (or core first).
- [ ] Meta description per page ~150–160 characters.
- [ ] One H1 per page, sensible H2 hierarchy.
- [ ] All locales have correct canonical + hreflang.
- [ ] robots.txt allows / and references sitemap.xml.
- [ ] Structured Data (Organization, WebSite, Park, Attraction, Breadcrumbs, FAQ) passes Google Rich Results Test.
- [ ] Manifest and Favicon/Apple Touch Icon set (optional but recommended).

---

## Related

- [Internationalization](../i18n/internationalization.md) – hreflang, locale
- [Development Scripts](../development/scripts.md)
