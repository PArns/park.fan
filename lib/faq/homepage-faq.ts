/**
 * The homepage FAQ — one list, read by the JSON-LD and by the section that renders it.
 *
 * These seven questions have been in the page's `FAQPage` structured data since it was written
 * and were never on the page. Google's own rule for the markup is that the content has to be
 * visible to the reader, so what shipped was seven answers a crawler could parse and nobody
 * could read — the worst of both, since it is also the only copy on the homepage phrased as the
 * questions people actually type.
 *
 * The list lives here rather than in either component for the reason the agent-facing surface
 * is built the way it is: two copies of one claim, one of them invisible, and the invisible one
 * rots first. Adding a question now adds it to both.
 */
export interface HomepageFaqEntry {
  /** Message key under `seo.homepage.faq` for the question. */
  q: string;
  /** …and for the answer. */
  a: string;
  /** Lucide icon name, resolved by the rendering component. */
  icon: 'Info' | 'MapPinned' | 'RadioTower' | 'BadgeEuro' | 'Star' | 'Layers' | 'Smartphone';
}

export const HOMEPAGE_FAQ: readonly HomepageFaqEntry[] = [
  { q: 'whatIsQ', a: 'whatIsA', icon: 'Info' },
  { q: 'whichParksQ', a: 'whichParksA', icon: 'MapPinned' },
  { q: 'liveDataQ', a: 'liveDataA', icon: 'RadioTower' },
  { q: 'freeQ', a: 'freeA', icon: 'BadgeEuro' },
  { q: 'favoritesQ', a: 'favoritesA', icon: 'Star' },
  { q: 'featuresQ', a: 'featuresA', icon: 'Layers' },
  { q: 'mobileQ', a: 'mobileA', icon: 'Smartphone' },
] as const;
