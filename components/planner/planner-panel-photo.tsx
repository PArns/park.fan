'use client';

/**
 * The park's photo behind the panel.
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
 * `aria-hidden`, `pointer-events-none`, and first in the DOM so every sibling
 * paints over it without needing a stacking context of its own — a `z-index`
 * here would trap the popovers that already fought their way to `z-[80]`.
 */
export function PlannerPanelPhoto({ src, position }: { src?: string | null; position?: string }) {
  if (!src) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat opacity-[0.12]"
        style={{ backgroundImage: `url(${src})`, backgroundPosition: position ?? '50% 0%' }}
      />
      <div className="from-background/75 via-background/55 to-background/90 absolute inset-0 bg-gradient-to-b" />
    </div>
  );
}
