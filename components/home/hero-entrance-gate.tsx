/**
 * How long the entrance window stays open, from the moment the hero's markup is parsed. Exported
 * for the ken-burns pan, which waits until it is over because every frame of the pan re-blurs
 * both glass panels (see `hero-background.tsx`).
 */
export const HERO_ENTRANCE_MS = 1700;

/** Duration of `hero-item-in` in globals.css. Kept here so the two cannot drift apart. */
export const HERO_ITEM_IN_MS = 850;

/**
 * Closes the hero's entrance window once it has played. The hero's content streams into a dynamic
 * hole, and the swapped-in elements are new, so they would replay their CSS entrance; on a slow
 * link the headline faded in twice and LCP moved to the second fade. The entrance is scoped to
 * `.hero-entering` and this drops the class.
 *
 * An inline script, not an effect: on a throttled phone hydration lands after the swap, so an
 * effect's timer starts too late. That is why the hero `<section>` carries
 * `suppressHydrationWarning`: the server ships the class and this script removes it, and the flag
 * silences only the development build's attribute warning on that element. If the script is
 * blocked the class stays and late content animates in, with nothing hidden.
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
