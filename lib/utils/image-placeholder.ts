/**
 * Brand-matched blur placeholder for the full-bleed background photos (homepage hero, park &
 * attraction backgrounds). A 10×7 SVG gradient — sky-navy → teal → park-green → near-black —
 * inlined as a data URI, so it costs no request and paints in the same frame as the HTML.
 *
 * It stands in for the photo while the optimized rendition is in flight. It is deliberately
 * low-entropy (a 4-stop gradient), which keeps it out of the LCP candidate set: the browser still
 * measures LCP against the real photo, the placeholder only removes the flash of empty background.
 *
 * Passed as `blurDataURL` alongside `placeholder="blur"`; shared so the hero and the park/attraction
 * backgrounds can never drift apart.
 */
export const BACKGROUND_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PSc3Jz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2cnIHgxPScwJyB5MT0nMCcgeDI9JzAnIHkyPScxJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMWEzZjZmJy8+PHN0b3Agb2Zmc2V0PSc0MCUnIHN0b3AtY29sb3I9JyMxZTVmNzgnLz48c3RvcCBvZmZzZXQ9Jzc1JScgc3RvcC1jb2xvcj0nIzFlNWEzYScvPjxzdG9wIG9mZnNldD0nMTAwJScgc3RvcC1jb2xvcj0nIzBmMWUwZicvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPScxMCcgaGVpZ2h0PSc3JyBmaWxsPSd1cmwoI2cpJy8+PC9zdmc+';
