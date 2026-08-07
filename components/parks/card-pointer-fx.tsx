'use client';

import { useEffect } from 'react';

/**
 * How much of the photo's own headroom the drift is allowed to use, at the card's edge.
 *
 * NOT a pixel constant. The headroom is `(PHOTO_SCALE - 1) / 2` of each dimension, and on the
 * real card that is 12.1 px across but only 6.0 px down — a flat 7 px drift slid the picture 1 px
 * past its own top edge and exposed the bleed layer underneath it, reflection and all. Deriving
 * the limit per axis from the measured box makes it correct at any card size, and keeps it
 * correct if somebody retunes the scale.
 */
const DRIFT_FRACTION = 0.85;
/**
 * The photo's own zoom while a card is hovered. It exists to give the drift somewhere to go:
 * without headroom, sliding the picture inside its clipped box would expose the edge. Separate
 * from `pk-photo-zoom`'s 1.04 on the PARENT — CSS owns the transform there, this owns it on the
 * `<img>`, and keeping them on different elements is what stops the two composing into one
 * runaway scale.
 */
const PHOTO_SCALE = 1.05;

type Setter = (value: number) => void;

interface Active {
  card: HTMLElement;
  img: HTMLElement | null;
  setX: Setter | null;
  setY: Setter | null;
  frame: number | null;
  /** Per-axis drift limit, derived from the photo's headroom at this card's size. */
  driftX: number;
  driftY: number;
  /**
   * The card's box, measured ONCE when the pointer arrives.
   *
   * Reading it per frame instead cost 20 ms a frame at 6× CPU throttle (53.1 against a 33.6 ms
   * baseline over the same card): `getBoundingClientRect()` forces a synchronous layout, and
   * doing that inside a rAF that then writes styles is the textbook layout thrash. Scrolling
   * invalidates it, which is the only thing that can move a card under a stationary pointer.
   */
  box: DOMRect;
}

/**
 * Pointer depth on the cards: the photo drifts against the pointer while the glass panels stay
 * put, and a soft highlight follows the pointer across the whole card.
 *
 * The drift is the point. Moving the picture while the panels hold still is what makes them read
 * as floating above it rather than printed on it — and it is the one thing here CSS cannot do,
 * because it needs the pointer's position.
 *
 * Three rules it works under, all of them paid for elsewhere in this codebase:
 *
 * - **Never a transform on the CARD.** The card carries two `backdrop-filter` panels, and a
 *   transform on it would make it a backdrop root for as long as the pointer was inside — the
 *   glass would go flat exactly while somebody is looking at it. The drift goes on the photo,
 *   which sits behind the panels and filters nothing. (Tailwind's `hover:-translate-y-1` on the
 *   card is safe: v4 compiles it to the standalone `translate` property, which Chromium does not
 *   treat as a backdrop root — measured, the panel's backdrop detail holds at 26.96 → 26.84.)
 * - **One listener, not one per card.** `pointerover` is delegated on the document and finds the
 *   card with `closest()`; the per-frame work is bound only while a card is actually hovered and
 *   torn down on the way out. A grid of twenty cards costs the same as one.
 * - **The highlight is two custom properties**, not an element and not a filter. The card's
 *   `::after` reads them (see `.pk-card-fx` in globals.css), so nothing is added to the DOM and
 *   nothing relayouts.
 *
 * Skipped entirely for reduced motion and for coarse pointers — on a touch screen there is no
 * hover to track, and the listener would only cost battery.
 */
export function CardPointerFx() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let active: Active | null = null;
    let gsap: typeof import('gsap').gsap | null = null;
    let disposed = false;

    const release = () => {
      if (!active) return;
      const { card, img, frame, setX, setY } = active;
      if (frame !== null) cancelAnimationFrame(frame);
      // Both listeners come off here. `pointerleave` is `once`, but `pointermove` is not, and
      // leaving it bound would stack another one on every entry.
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', release);
      card.style.removeProperty('--fx-o');
      // The way home goes through the SAME setters, never a fresh gsap.to on x/y.
      //
      // `quickTo` keeps one persistent tween per property and holds its last target. A second
      // tween aiming at 0 does not replace it — they both write every frame, the return looks
      // right, and then the moment it finishes the quickTo re-asserts the old hover offset. That
      // is the photo snapping back a beat after the pointer has gone: traced frame by frame, a
      // clean glide to 0,0 and then a 5.95 px step back to 4.48,3.92 on the twelfth frame.
      //
      // `scale` is not driven by quickTo, so it has no second owner and a plain tween is fine.
      setX?.(0);
      setY?.(0);
      if (img && gsap) gsap.to(img, { scale: 1, duration: 0.4, ease: 'power2.out' });
      active = null;
    };

    const onMove = (event: PointerEvent) => {
      if (!active) return;
      if (active.frame !== null) return;
      active.frame = requestAnimationFrame(() => {
        if (!active) return;
        active.frame = null;
        const { box } = active;
        const px = event.clientX - box.left;
        const py = event.clientY - box.top;
        // −1 … 1 from the card's centre
        const nx = (px / box.width) * 2 - 1;
        const ny = (py / box.height) * 2 - 1;
        active.setX?.(-nx * active.driftX);
        active.setY?.(-ny * active.driftY);
        active.card.style.setProperty('--fx-x', `${px}px`);
        active.card.style.setProperty('--fx-y', `${py}px`);
      });
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const card = target?.closest?.('[data-card-fx]') as HTMLElement | null;
      if (!card || card === active?.card) return;

      release();
      const img = card.querySelector<HTMLElement>('[data-card-photo="frame"] img');
      const photo = img?.getBoundingClientRect();
      const headroom = (PHOTO_SCALE - 1) / 2;
      active = {
        card,
        img,
        setX: null,
        setY: null,
        frame: null,
        driftX: photo ? photo.width * headroom * DRIFT_FRACTION : 0,
        driftY: photo ? photo.height * headroom * DRIFT_FRACTION : 0,
        box: card.getBoundingClientRect(),
      };
      card.style.setProperty('--fx-o', '1');
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', release, { once: true });

      if (!img) return;
      const attach = (lib: typeof import('gsap').gsap) => {
        if (disposed || active?.img !== img) return;
        active.setX = lib.quickTo(img, 'x', { duration: 0.5, ease: 'power3.out' });
        active.setY = lib.quickTo(img, 'y', { duration: 0.5, ease: 'power3.out' });
        lib.to(img, { scale: PHOTO_SCALE, duration: 0.35, ease: 'power2.out' });
      };
      if (gsap) attach(gsap);
      else
        import('gsap')
          .then((m) => {
            gsap = m.gsap;
            attach(m.gsap);
          })
          .catch(() => {
            // The card still lifts and zooms in CSS; there is nothing to recover.
          });
    };

    // Scrolling is the only thing that moves a card out from under a stationary pointer, so it
    // is the only thing that has to re-measure. Passive: this never blocks the scroll.
    const remeasure = () => {
      if (active) active.box = active.card.getBoundingClientRect();
    };

    document.addEventListener('pointerover', onOver);
    window.addEventListener('scroll', remeasure, { passive: true });
    window.addEventListener('resize', remeasure);
    return () => {
      disposed = true;
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('scroll', remeasure);
      window.removeEventListener('resize', remeasure);
      release();
    };
  }, []);

  return null;
}
