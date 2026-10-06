'use client';

import { useEffect } from 'react';

/**
 * How much of the photo's own headroom the drift is allowed to use, at the card's edge.
 *
 * A fraction, not pixels: the headroom is `(PHOTO_SCALE - 1) / 2` of each dimension and differs
 * per axis, so a flat pixel drift can slide the picture past its top edge and expose the bleed
 * layer. Derived per axis from the measured box, it holds at any card size and any scale.
 */
const DRIFT_FRACTION = 0.85;
/**
 * The photo's own zoom while a card is hovered, so the drift has headroom to use. Separate from
 * `pk-photo-zoom` on the PARENT: CSS owns the transform there and this owns it on the `<img>`, so
 * the two never compose into one runaway scale.
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
   * The card's box in DOCUMENT space, measured ONCE when the pointer arrives.
   *
   * Reading it per frame would force a synchronous layout inside a rAF that writes styles, and a
   * viewport box would need re-measuring on every scroll. A document box only moves on a resize
   * (handled) or a layout shift above the hovered card, which the next card re-measures.
   * See docs/rules/work-nobody-can-see-is-still-work.md.
   */
  box: { left: number; top: number; width: number; height: number };
}

/** The card's box in document space — invariant under scrolling, unlike a viewport rect. */
function documentBox(el: HTMLElement): Active['box'] {
  const r = el.getBoundingClientRect();
  return {
    left: r.left + window.scrollX,
    top: r.top + window.scrollY,
    width: r.width,
    height: r.height,
  };
}

/**
 * Pointer depth on the cards: the photo drifts against the pointer while the glass panels stay
 * put, and a soft highlight follows the pointer across the whole card.
 *
 * Never a transform on the CARD: it carries two `backdrop-filter` panels and would become a
 * backdrop root, flattening the glass while hovered. The drift goes on the photo, behind the
 * panels (Tailwind v4's `hover:-translate-y-1` compiles to the standalone `translate` property,
 * which Chromium does not treat as a backdrop root). One delegated `pointerover` listener, with
 * the per-frame work bound only while a card is hovered. The highlight is two custom properties
 * read by `.pk-card-fx`'s `::after`, so nothing is added to the DOM. Skipped for reduced motion
 * and coarse pointers.
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
      // The way home goes through the SAME setters, never a fresh gsap.to on x/y: `quickTo` holds
      // its last target, and once a second tween finished it would re-assert the hover offset.
      // `scale` is not driven by quickTo, so a plain tween is fine.
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
        // `pageX/pageY`, not `clientX/clientY`: the box is in document space, and the pointer has
        // to be read in the same one, without reading the scroll offset or the layout.
        const px = event.pageX - box.left;
        const py = event.pageY - box.top;
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
        box: documentBox(card),
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

    // A resize moves a card; scrolling does not, because the box is in document space (see
    // `Active['box']`), so there is deliberately no `scroll` listener.
    const remeasure = () => {
      if (active) active.box = documentBox(active.card);
    };

    document.addEventListener('pointerover', onOver);
    window.addEventListener('resize', remeasure);
    return () => {
      disposed = true;
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('resize', remeasure);
      release();
    };
  }, []);

  return null;
}
