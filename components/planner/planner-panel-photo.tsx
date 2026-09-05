'use client';

/**
 * The park's photo behind the panel — and, where there is none, a drawn ground.
 *
 * The panel used to get this for free: it is glass, and the park page's own
 * hero is a full-bleed `position: fixed` layer, so the photo simply read
 * through it. That stopped when the hero learned to respect the panel's inset —
 * it had to, because a fixed layer ignores the padding the page is inset by and
 * was painting the full window width behind an open panel — and what was left
 * was a blur with nothing to blur.
 *
 * So the panel carries its own now, and it is the same picture from the same
 * place: resolved server-side by the `/plan/day` proxy out of the media
 * database, with the focal point a curator set. `@/lib/media` is a 107 KB
 * catalogue and this is a Client Component in every page's layout, which is why
 * the path arrives on the payload rather than being looked up here.
 *
 * Two layers rather than one image with an opacity, because the panel is a
 * reading surface first. The first attempt got the wash backwards: it took the
 * photo to the panel's own ground at the FOOT and left the head clear, and the
 * head is where the text is — the park name, the crowd badge, the hours, the
 * weather line, all of it over the brightest part of a lit façade — while the
 * foot swallowed the headliner band whole. It is even now: 12 % of the picture
 * under a wash that never fully clears and never fully closes, so the photo
 * reads as a texture at every height and no row of the panel is fighting it.
 *
 * `aria-hidden` and `pointer-events-none`, and it must sit in a NEGATIVE
 * stacking layer. Being first in the DOM is not enough and the first version
 * shipped on the belief that it was: an absolutely positioned element paints in
 * the stacking context's positioned layer, which is ABOVE the inline content of
 * every in-flow sibling. So the whole chrome — the header, the context band,
 * the coach hint, the free-block row — was being drawn UNDER this wash rather
 * than over it, and the wash was thinning it. Only the grid looked right, and
 * only because its blocks are absolutely positioned too.
 *
 * Measured off the composited panel at Phantasialand, ink against ground:
 *
 *   Kopfzeile        1.89:1 → 18.10:1
 *   Kontextband      1.45:1 →  6.73:1
 *   Tier-Zeile       1.53:1 →  6.48:1
 *   Eigener Block    1.14:1 →  5.83:1
 *
 * `-z-10` puts it back where a background belongs: above the panel's own glass,
 * below everything the panel says. It stays inside the sheet because
 * `SheetContent` carries `isolate` — without a stacking context on the parent a
 * negative layer keeps going and would disappear behind the panel's own
 * background, which is a browser-dependent way of shipping no photo at all.
 *
 * `rounded-[inherit]` rather than a copy of the sheet's own radius: the phone's
 * bottom sheet is `max-sm:rounded-t-xl` and `SheetContent` clips nothing, so a
 * square inset-0 layer cut the two top corners back off. Inherited, so the day
 * somebody changes that radius there is nothing here to change with it.
 *
 * There is no photo for almost anybody, which is what this component used to
 * answer with `null` and a black rectangle — see {@link PlannerPanelGround}.
 * The two are an either/or rather than a stack: the four ratios above were
 * measured off the photo composite, and a tint underneath it would be a fourth
 * layer in a measurement nobody would re-take.
 */
export function PlannerPanelPhoto({ src, position }: { src?: string | null; position?: string }) {
  if (!src) return <PlannerPanelGround />;

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 bg-cover bg-no-repeat opacity-[0.12]"
        style={{ backgroundImage: `url(${src})`, backgroundPosition: position ?? '50% 0%' }}
      />
      <div className="from-background/75 via-background/55 to-background/90 absolute inset-0 bg-gradient-to-b" />
    </div>
  );
}

/**
 * The mark's upper edge, as a percentage of the panel's height: it is `h-[54%]`
 * hung off the foot with a `-6%` bleed. Percentages rather than fractions,
 * because these numbers end up in a CSS string and `0.72 * 100` in JavaScript
 * is `72.00000000000001`.
 */
const MARK_TOP_PCT = 100 + 6 - 54;
/** L1's ellipse — `<width> <height> at <x> <y>`, in percentages of the panel. */
const LIGHT_HEIGHT_PCT = 72;
const LIGHT_CENTER_Y_PCT = -8;
/**
 * A radial gradient is transparent from `centre + stop × radius` onwards, so
 * the stop that lands L1's zero exactly on {@link MARK_TOP_PCT} falls out of
 * the ellipse rather than being typed next to it.
 */
const LIGHT_STOP_PCT = ((MARK_TOP_PCT - LIGHT_CENTER_Y_PCT) / LIGHT_HEIGHT_PCT) * 100;

/**
 * The ground for the panel that has no photo, which is nearly every panel.
 *
 * Counted against the real catalogue: **9 of 212 parks** carry a
 * `park-background` image, and there is nothing else to reach for — the media
 * database holds 18 collections in all, so 203 parks have no ride photograph
 * either. On top of that comes every page with no park behind it at all: the
 * homepage, `/tagesplaner`, the blog, the glossary. So the branch this
 * component sits in is not the exception, it is the case: without it the panel
 * opens as a flat rectangle of `--background` — reported, correctly, as "a
 * black rectangle".
 *
 * **It is not a photograph, and deliberately not.** The obvious repair is to
 * fall back to some other park's façade, and it is the one thing this panel may
 * not do: Disneyland Paris behind a Phantasialand plan is a claim about a park
 * the plan is not about, from the same house that will not print a wait time it
 * has not measured. So the fallback is drawn, and what it draws is the app
 * rather than a park — light from above and the park.fan pin, the same mark the
 * header shows on every page, oversized and bled off the foot. That is the
 * house's own move for a surface that has to be about itself:
 * `ChapterHeading` sets a chapter with an outsized translucent glyph, and the
 * coaster player signs its canvas with this pin.
 *
 * ## The ink is `--park-primary`, and that is a measurement rather than a taste
 *
 * A ground under a reading surface is bought with contrast, and the price is
 * luminance: every ink lifts a dark ground and lowers a light one. `--primary`
 * is the app's blue, but its lightness is fixed across the themes, so at the
 * contrast ceiling below it may only be spent at 5.8 % (dark) and 4.7 %
 * (light). `--park-primary` is the accent token that FLIPS — pale sky
 * `oklch(0.901 0.058 230.9)` on white, deep `oklch(0.391 0.09 240.9)` on black —
 * so it changes hue where the theme has room for it and buys 12.8 % / 18.6 %
 * for the same ratios. Same ceiling, roughly 2.5× the tint, and no `dark:`
 * utility anywhere: the token is what flips, which is the rule
 * `PlannerGridGround` already works to one file over.
 *
 * (The magnitude is an `opacity` on the layer rather than a `/8.5` on the
 * colour, which is also how `app/admin/layout.tsx` spends its glow. It had to
 * be: `--park-primary` was a hand-written utility in `globals.css` rather than
 * a `@theme` colour, so `bg-park-primary/5` matched no rule and compiled to
 * nothing at all. It is registered in `@theme inline` now and the modifier
 * works — these three layers keep the `opacity` they were measured with.)
 *
 * ## The budget
 *
 * The bar is the panel's own documented worst case, the photo composite
 * measured at Phantasialand: the head may not read under **18.10:1** and the
 * muted rows not under **6.73:1**. In the light theme a second bar binds first,
 * because `text-muted-foreground` on a white panel starts at 4.74:1 and AA is
 * 4.5:1 — 2.4 % of luminance, all of it.
 *
 * Composited over the panel's ground and read against `--foreground` /
 * `--muted-foreground`:
 *
 *                          dark rgb      fg      muted   light rgb       fg      muted
 *   bare panel (before)    10,10,10   18.97:1   7.66:1   255,255,255  19.80:1   4.74:1
 *   L1 light      5.5 %    10,14,16   18.63:1   7.53:1   251,254,255  19.49:1   4.67:1
 *   L2 ground     3.0 %    10,12,13   18.79:1   7.59:1   253,254,255  19.63:1   4.70:1
 *   L2+L3 mark   11.2 %     9,17,21   18.22:1   7.36:1   247,252,255  19.18:1   4.59:1
 *
 * L2+L3 is the worst any pixel of this panel can carry, and it clears both
 * bars in both themes.
 *
 * ## Which is a statement about geometry, so the geometry is the load-bearing part
 *
 * L1 and L3 never meet, and they may not: stacked they would come to 16.1 %,
 * where the head reads 17.82:1 and is under the 18.10 the photo case set. So
 * L1 reaches zero exactly at the mark's upper edge, and the two numbers are one
 * number — {@link MARK_TOP_PCT}, out of which L1's falloff stop is COMPUTED
 * rather than typed next to it, because a hand-typed pair is a pair that
 * drifts. L2 is under no such rule: it is free to run the whole panel, and
 * L1+L2 comes to 8.3 % (dark 18.44:1 / 7.45:1). (Even the forbidden overlap
 * reads 17.82:1, two and a half times the 7:1 AAA floor, so a mistake here
 * would be a design bug rather than a legibility one.)
 *
 * The light falls from the upper left and the mark sits in the lower right,
 * which is not a coin toss either: `--pk-panel-highlight-top` lights the park
 * card's glass from `0% 0%` and `--pk-panel-highlight-bot` shades it towards
 * `100% 100%`, and this panel sits on the same page as those cards.
 *
 * The mark is drawn with a **mask** rather than as one of the two artwork
 * files. The pin ships as a light-ink and a dark-ink file that draw the same
 * paths and differ in their fills, so a mask reads the one thing that is
 * identical — the alpha — and takes its colour from the token instead, which is
 * what keeps the budget above true in both themes from a single element. Where
 * `mask-image` is not honoured the layer degrades to a soft corner wash at the
 * same 8.5 %: no mark, no black rectangle either, and still inside the budget.
 */
function PlannerPanelGround() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
      aria-hidden="true"
    >
      {/* L1 — light from above, over the head of the panel and no further. */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            `radial-gradient(125% ${LIGHT_HEIGHT_PCT}% at 14% ${LIGHT_CENTER_Y_PCT}%, ` +
            `var(--park-primary) 0%, transparent ${LIGHT_STOP_PCT.toFixed(2)}%)`,
        }}
      />

      {/* L2 — the ground the mark stands in. Anchored past the lower right
          corner, and reaching up to a third of the panel so the two lights meet
          rather than leaving an untinted waist across the middle. Weak enough
          that the summary row and the push toggle sit on it without noticing. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_92%_104%,var(--park-primary)_0%,transparent_78%)] opacity-[0.03]" />

      {/* L3 — the mark. `aspect-[90.03/124.21]` is the pin's own viewBox, which
          is its measured ink box (see `BrandLockup`), so the element is exactly
          the shape the mask fills and `mask-contain` has nothing left to letterbox. */}
      <div className="bg-park-primary absolute right-[-11%] bottom-[-6%] aspect-[90.03/124.21] h-[54%] mask-[url(/logo-small.svg)] mask-contain mask-center mask-no-repeat opacity-[0.085]" />
    </div>
  );
}
