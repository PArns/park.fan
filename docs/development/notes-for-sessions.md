# Notes for Future Sessions

Reminders and context for AI or human sessions working on the codebase.

---

1. **Server Components by default** – Use `'use client'` only when necessary (theme, locale switcher, search, providers).

2. **Accessibility** – The Vercel Toolbar a11y check may report "ARIA hidden element must not contain focusable" when Search or the mobile Sheet is open (Radix Dialog). Run audits with all modals closed, or treat as known Radix/Toolbar behavior.  
   → [Troubleshooting – ARIA hidden](../troubleshooting/common-issues.md#aria-hidden--focusable-element-warnings)

3. **API proxy** – Search and other client-callable endpoints go via `/api/*` to avoid CORS.

4. **Geo routes** – API uses `/continent/country/city/park`; frontend mirrors this; **city is required**. Redirect logic handles malformed URLs before 404.  
   → [Routing & URLs – Redirect logic](../architecture/routing-and-urls.md#redirect-logic-404-prevention)

5. **ML predictions** – Feature to surface prominently; data comes from the API.

6. **Admin** – Cloudflare-protected; no custom auth, only UI. Query param for API auth.

7. **Cache** – Respect API cache headers; frontend TTLs in `lib/api/cache-config.ts`.  
   → [Caching Strategy](../architecture/caching-strategy.md)

8. **Translations** – All UI strings from `messages/`; add keys to all locale files.  
   → [Translation System](../i18n/translations.md)

9. **Flags / experiments** – Use Vercel Toolbar Flags Explorer and `flags.ts`; do not add env-based feature toggles.  
   → [Flags & Debug](flags-and-debug.md)

---

## Related

- [Conventions](conventions.md)
- [Troubleshooting](../troubleshooting/common-issues.md)
