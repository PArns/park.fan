/**
 * How long the entrance window stays open, measured from the moment the hero's markup is
 * parsed — which is roughly when the CSS animation clock for it starts.
 *
 * Exported because a second thing depends on it: the ken-burns pan on the hero photo, which is
 * held back until this is over (see `hero-background.tsx`). Every frame of that pan re-blurs
 * both glass panels, so running it *during* the entrance is what made the entrance choppy.
 */
export const HERO_ENTRANCE_MS = 1700;

/** Duration of `hero-item-in` in globals.css. Kept here so the two cannot drift apart. */
export const HERO_ITEM_IN_MS = 850;

/**
 * Closes the hero's entrance window once it has played.
 *
 * The hero's badge, headline and intro sit in a dynamic hole: the static shell paints a fallback
 * that renders the same markup without the live counts, and the real content is streamed in
 * afterwards. That replacement is a DOM swap, not a React re-render, so the incoming elements are
 * NEW elements — and a new element starts its CSS entrance animation from the top. On a fast link
 * that lands inside the entrance and nobody notices. On a slow one the hole resolved around two
 * and a half seconds in and the headline visibly faded a second time, which also handed the page
 * its LCP at that second fade instead of at first paint.
 *
 * So the entrance is scoped to `.hero-entering` on the hero section, and this drops the class once
 * the choreography is over. Anything streamed in after that is simply there.
 *
 * **It is an inline script, not an effect.** The window has to close before the swap, and the swap
 * has no fixed time — on a throttled phone hydration itself lands after it, so a `useEffect`
 * timer starts counting too late to ever win. Parsed inline, the timer starts at roughly the
 * moment the hero paints, which is the same clock the CSS animation runs on.
 *
 * **That is why the hero `<section>` carries `suppressHydrationWarning`.** Two owners write its
 * one `className`: the server ships `hero-entering` in the markup, and this script takes it off
 * 1700 ms later. Wherever hydration lands after that — the throttled phone above, a busy dev
 * server — the class list React expects and the one in the DOM disagree. Nothing renders wrongly:
 * React does not apply attributes during hydration at all, so the value that survives is the
 * DOM's, which is the one this gate wanted.
 *
 * What the attribute silences is therefore a console message, and **only in a development build**.
 * React 19 compares hydrated attributes in `react-dom-client.development.js` alone; the production
 * bundle carries neither that comparison nor the "A tree hydrated but some attributes …" string,
 * so a visitor never sees it and the flag is a no-op for them. Who does see it is whoever runs
 * `pnpm dev` — or `pnpm check:planner` against it, which used to waive this one message by class
 * name. React reads the flag one level deep, on this element's own attributes and text, so a real
 * mismatch inside the hero still reports. Measured at 20x CPU throttle on `/de`: 5 of 5 loads
 * warned without the attribute, 0 of 5 with it, the class removed either way.
 *
 * If the script is blocked the class stays and late content animates in, which is the behaviour
 * this replaces. Nothing is hidden that only JavaScript can reveal.
 */
export function HeroEntranceGate({ windowMs = HERO_ENTRANCE_MS }: { windowMs?: number }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `setTimeout(function(){var e=document.querySelector(".hero-entering");e&&e.classList.remove("hero-entering")},${windowMs})`,
      }}
    />
  );
}
