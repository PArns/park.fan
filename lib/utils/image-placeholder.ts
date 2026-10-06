/**
 * Brand-matched blur placeholder for the full-bleed background photos: a tiny four-stop SVG
 * gradient inlined as a data URI, so it paints with the HTML and costs no request. Low-entropy on
 * purpose, so it stays out of the LCP candidates and LCP is still measured on the real photo.
 * Shared so the hero and the park and ride backgrounds cannot drift apart.
 */
export const BACKGROUND_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PSc3Jz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2cnIHgxPScwJyB5MT0nMCcgeDI9JzAnIHkyPScxJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMWEzZjZmJy8+PHN0b3Agb2Zmc2V0PSc0MCUnIHN0b3AtY29sb3I9JyMxZTVmNzgnLz48c3RvcCBvZmZzZXQ9Jzc1JScgc3RvcC1jb2xvcj0nIzFlNWEzYScvPjxzdG9wIG9mZnNldD0nMTAwJScgc3RvcC1jb2xvcj0nIzBmMWUwZicvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPScxMCcgaGVpZ2h0PSc3JyBmaWxsPSd1cmwoI2cpJy8+PC9zdmc+';
