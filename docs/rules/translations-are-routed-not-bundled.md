# Translations are routed, not bundled (REQUIREMENT)

The locale layout ships only the chrome's messages (`LAYOUT_MESSAGE_NAMESPACES`, ~6 KB), and each
route adds its own delta through `<RouteMessages route="…">` in its `page.tsx`. Both lists are
derived from the import graph by `pnpm generate:route-namespaces` into the committed
`i18n/route-namespaces.generated.ts`.

- **Never hand-edit `i18n/route-namespaces.generated.ts`.** After moving a component across the
  client boundary, re-run the generator.
- **The merge happens on the client** (`useMessages()` + `mergeMessages` in
  `i18n/route-messages-provider.tsx`), because a nested next-intl provider replaces messages instead
  of merging them, and shipping the union would serialize the chrome set twice per page.
- **Namespaces only a lazily loaded part needs** (`parks` and `attractions` for `FavoritesSection`,
  the planner's for its launcher) are declared in `LAZY_MESSAGE_BOUNDARIES`
  (`lib/i18n/route-namespaces.mjs`) and fetched as a per-locale chunk. The eager skeleton keeps
  reserving the same box, so the swap costs no CLS.
- **One `useTranslations('<namespace>')` in a component the layout renders puts that namespace on
  every page**, in all six locales. Ask for the narrowest sub-namespace the component reads.
- **Judge a change on the compressed number.** The old flat allowlist looked like it saved 10 KB of
  JSON and was worth 2.3 KB after brotli.

## Why

Everything handed to `NextIntlClientProvider` is serialized into the RSC payload, and so into the
HTML, of every page that renders it. A namespace a route needs but does not ship does not throw:
next-intl logs MISSING_MESSAGE and renders the raw key on the page.

## Check

`pnpm check:client-messages` (also in `prebuild`) fails on a stale map, a missing `RouteMessages`
wrapper, a wrong route key and a superfluous wrapper alike.

Background: [internationalization → which namespaces reach the client](../i18n/internationalization.md#which-namespaces-reach-the-client)
has the per-page byte tables.
