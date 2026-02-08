# Changelog / Recent Updates

Short log of notable changes; details live in the linked docs.

---

## 2.5.5 (2026-01-25) – 404 prevention

- Redirect logic for malformed URLs (e.g. missing city segment).
- Nearby Parks use `convertApiUrlToFrontendUrl(url)` instead of building from name fields.

→ [Routing & URLs](architecture/routing-and-urls.md), [Troubleshooting](troubleshooting/common-issues.md)

---

## 2.5.6 (2026-01-25) – Link prefetch

- Prefetch only when `status === 'OPERATING'` for park/attraction links.
- `prefetch={false}` for header/footer and discovery/geo cards.

→ [Routing & URLs – Link Prefetching](architecture/routing-and-urls.md#link-prefetching)

---

## P50 / "Normal" display

- API returns `moderate` for typical day (P50 baseline); frontend displays **"Normal"** (green) in all locales.

→ [Backend Integration – Crowd Levels](api/backend-integration.md#crowd-levels-p50--normal), [Backend P50 doc](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/p50-crowd-levels.md)

---

## Related

- [README](README.md) – Doc index
- [Conventions](development/conventions.md) – Key rules
