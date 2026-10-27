# A client-only preference may not decide server-rendered markup (REQUIREMENT)

A preference only the browser knows (the °C/°F pick lives in a cookie or comes from the visitor's
locale) may not branch markup the server renders, because the pages are statically cached. So
temperatures are server-rendered in **both** units, an inline script in `app/[locale]/layout.tsx`
sets `html[data-temp-unit]` before paint, and CSS shows one (`.u-metric` / `.u-imperial` in
`app/globals.css`).

- **Express it in CSS where you can.** The header's °C/°F button renders both labels and lets the
  attribute pick one, and its click reads `data-temp-unit` off the document, never the context, so
  what it flips is what the reader is looking at (`components/common/temperature-unit-toggle.tsx`).
- **Where you cannot, the guard belongs to the consumer, not the provider.** A non-class attribute
  that depends on the value (an `aria-pressed`, say) waits for the component's own mount.
  `useSyncExternalStore`'s server snapshot covers the hook's own hydration render, not a consumer
  that hydrates after the provider re-rendered.

## Why

The toggle once branched on the value during render, and that is a hydration bug, not a flash bug:
**hydration is not one pass**. Boundaries commit separately, so the provider had already resolved
the unit to `F` while a weather widget further down an article was still waiting to hydrate; that
widget was hydrated against `F` over server markup that said `C`, and React logged the subtree and
**patched nothing**, leaving the wrong value on screen.
