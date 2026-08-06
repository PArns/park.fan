'use client';

/** Page background of each theme — the wipe has to land on the colour the page will be. */
const WIPE_BACKGROUND = {
  light: 'oklch(1 0 0)',
  dark: 'oklch(0.145 0 0)',
} as const;

/**
 * The tint at the centre of the wipe: warm for the sunrise, deep blue for the night. Only a
 * suggestion of colour — the disc is the new page background everywhere else, so it hands over
 * to the real page without a step.
 */
const WIPE_ACCENT = {
  light: 'oklch(0.93 0.11 85)',
  dark: 'oklch(0.42 0.13 264)',
} as const;

const EXPAND_S = 0.55;
const REVEAL_S = 0.4;

/** Distance from the origin to the furthest corner — how big the disc has to grow. */
function coveringRadius(x: number, y: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return Math.max(
    Math.hypot(x, y),
    Math.hypot(w - x, y),
    Math.hypot(x, h - y),
    Math.hypot(w - x, h - y)
  );
}

function disc(x: number, y: number, r: number) {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position:fixed',
    `left:${x - r}px`,
    `top:${y - r}px`,
    `width:${r * 2}px`,
    `height:${r * 2}px`,
    'border-radius:50%',
    'pointer-events:none',
    'z-index:2147483646',
    'will-change:transform',
  ].join(';');
  return el;
}

/**
 * The theme change as a disc of the incoming theme opening out of the switch.
 *
 * The sequence is what makes it seamless: the disc grows until it covers the viewport, the theme
 * flips **underneath it** — nobody sees the page repaint — and the disc then fades off the newly
 * themed page. A shockwave ring runs slightly ahead of the fill so the wipe has an edge.
 *
 * A transform, not `clip-path`: the disc is a real element scaled from 0, which every browser
 * composites on the GPU and GSAP interpolates as a plain number. Animating a `circle()` radius
 * inside a `clip-path` string is neither.
 *
 * `apply` is always called exactly once, on every path through here — reduced motion, a failed
 * GSAP import, a broken origin. The theme changing is the feature; the animation is decoration,
 * and decoration is never allowed to swallow it.
 */
export async function runThemeWipe(
  origin: { x: number; y: number } | null,
  next: 'light' | 'dark',
  apply: () => void
) {
  const reduced =
    typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !origin) {
    apply();
    return;
  }

  const { x, y } = origin;
  const r = coveringRadius(x, y);

  const fill = disc(x, y, r);
  fill.style.background = `radial-gradient(circle, ${WIPE_ACCENT[next]} 0%, ${WIPE_BACKGROUND[next]} 42%)`;
  fill.style.transform = 'scale(0)';

  const ring = disc(x, y, r);
  ring.style.border = `2px solid ${WIPE_ACCENT[next]}`;
  ring.style.transform = 'scale(0)';

  document.body.append(fill, ring);

  let gsap: typeof import('gsap').gsap;
  try {
    ({ gsap } = await import('gsap'));
  } catch {
    // No animation is a fine outcome; the theme change is not optional.
    fill.remove();
    ring.remove();
    apply();
    return;
  }

  gsap.to(ring, {
    scale: 1.12,
    opacity: 0,
    duration: EXPAND_S + 0.12,
    ease: 'power2.out',
    onComplete: () => ring.remove(),
  });

  gsap.to(fill, {
    scale: 1,
    duration: EXPAND_S,
    ease: 'power2.inOut',
    onComplete: () => {
      // Covered — flip the theme where nobody can see it happen, then lift the disc off.
      apply();
      gsap.to(fill, {
        opacity: 0,
        duration: REVEAL_S,
        delay: 0.06,
        ease: 'power1.out',
        onComplete: () => fill.remove(),
      });
    },
  });
}
