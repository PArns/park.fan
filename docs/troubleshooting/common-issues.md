# Common Issues & Troubleshooting

Short guide for frequent problems and how to fix them.

## Broken links (404s from malformed URLs)

**Symptom:** URLs like `/parks/europe/germany/phantasialand` (missing city) return 404.

**Cause:** Old external links or Nearby Parks used `buildParkUrl()` with names instead of slugs.

**Fix:** Redirect logic in `lib/utils/redirect-utils.ts` looks up correct URLs via Geo Structure and redirects before 404. Ensure `convertApiUrlToFrontendUrl(url)` is used when API provides a URL – never build from `city`/`country` name fields.

**See:** [Routing & URLs](../architecture/routing-and-urls.md).

---

## Translations missing or showing key

**Symptom:** UI shows `parks.status` instead of "Open" / "Closed".

**Cause:** Missing key in `messages/{locale}.json` or typo in namespace/key.

**Fix:**
1. Run `pnpm validate:translations` to check keys
2. Run `pnpm crawl:translations:live` (with dev server) to find untranslated keys
3. Add missing keys to all `messages/*.json` files

---

## Search not working / CORS errors

**Symptom:** Search fails with CORS error when calling API directly.

**Cause:** Browser blocks cross-origin requests to api.park.fan.

**Fix:** Search uses `/api/search` proxy – ensure that route is used, not direct API calls from client.

---

## Wrong park timezone / "today" incorrect

**Symptom:** Schedule or "today" shows wrong day for parks in different timezone.

**Cause:** Using server or browser date instead of the park's timezone.

**Fix:** Derive "today" in the park timezone, e.g. `formatInTimeZone(new Date(), park.timezone, 'yyyy-MM-dd')` (date-fns-tz) or `new Date().toLocaleDateString('en-CA', { timeZone: park.timezone })`. Use that string to filter schedule (`s.date === todayStr`). Never compare schedule/calendar dates with `new Date(dateStr)` without timezone handling.

**See:** [Date & Time Handling](../development/datetime-handling.md).

---

## ARIA hidden / focusable element warnings

**Symptom:** Vercel Toolbar a11y check reports "ARIA hidden element must not contain focusable" when Search or mobile Sheet is open.

**Cause:** Radix Dialog sets `aria-hidden` on the rest of the page when open. Toolbar may flag header/footer.

**Fix:** Run a11y audit with all modals closed, or treat as known Radix/Toolbar interaction.

---

## Debug Geo Mode (Vercel Toolbar)

**Context:** Experiments like "Near Phantasialand" or "In Phantasialand" use Vercel Toolbar Flags Explorer.

**Setup:** Run `vercel link`, deploy or open preview, complete Flags Explorer setup. Use `vercel env pull` to get `FLAGS_SECRET` locally if needed for toolbar in dev.

**Note:** Flags are defined in `flags.ts` and `app/.well-known/vercel/flags/route.ts`. Do not build custom env switchers for experiments.

**See:** [Flags & Debug](../development/flags-and-debug.md).

---

## Related

- [Development Setup](../development/setup.md)
- [Date & Time Handling](../development/datetime-handling.md)
- [API Integration](../architecture/api-integration.md)
