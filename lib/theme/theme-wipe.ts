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

/**
 * The lockup shown in the middle of the disc, in the variant that reads on the INCOMING theme:
 * `-dark` is the light-ink artwork made for dark backgrounds, and vice versa. All four files are
 * already in the header on every page, so they come out of the browser cache — the overlay never
 * waits on a request.
 */
const WIPE_LOGO = {
  light: { mark: '/logo-small.svg', word: '/parkfan.svg' },
  dark: { mark: '/logo-small-dark.svg', word: '/parkfan-dark.svg' },
} as const;

const EXPAND_S = 0.55;
/** A beat with the disc fully covering, so the lockup is actually read rather than glimpsed. */
const HOLD_S = 0.26;
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
 * park.fan's lockup, centred in the VIEWPORT — not in the disc, whose centre is the switch in the
 * corner. Sized in `clamp()` so it stays a comfortable presence on a phone and does not turn into
 * a billboard on a wide desktop.
 */
function lockup(next: 'light' | 'dark') {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position:fixed',
    'inset:0',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    // No gap. `logo-small.svg` is a 150×150 square with a narrow pin drawn inside it, so at any
    // rendered height it brings roughly a third of that width along as empty space on either
    // side — the optical gap is already in the file. Adding a flex gap on top pushed the two
    // halves apart into two separate objects. Same reason the header's own lockup sits at
    // `gap-0.5`.
    'gap:0',
    'pointer-events:none',
    'z-index:2147483647',
    'opacity:0',
    'will-change:transform,opacity',
  ].join(';');
  const { mark, word } = WIPE_LOGO[next];
  el.innerHTML =
    `<img src="${mark}" alt="" style="height:clamp(56px,9vw,112px);width:auto">` +
    `<img src="${word}" alt="" style="height:clamp(38px,6vw,76px);width:auto">`;
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

  const logo = lockup(next);

  document.body.append(fill, ring, logo);
  const cleanup = () => {
    fill.remove();
    ring.remove();
    logo.remove();
  };

  let gsap: typeof import('gsap').gsap;
  try {
    ({ gsap } = await import('gsap'));
  } catch {
    // No animation is a fine outcome; the theme change is not optional.
    cleanup();
    apply();
    return;
  }

  // One timeline rather than nested callbacks: the lockup has to be placed against the disc's
  // clock (in while it is still growing, out with it), and that reads far better on a shared
  // timeline than as a chain of delays that have to be kept in sync by hand.
  gsap
    .timeline({ onComplete: cleanup })
    .to(fill, { scale: 1, duration: EXPAND_S, ease: 'power2.inOut' }, 0)
    .to(ring, { scale: 1.12, opacity: 0, duration: EXPAND_S + 0.12, ease: 'power2.out' }, 0)
    .fromTo(
      logo,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.42, ease: 'power2.out' },
      // Starts before the disc has finished covering: by the time the page is fully hidden the
      // lockup is already there, instead of appearing into a blank field.
      EXPAND_S * 0.45
    )
    // Covered — flip the theme where nobody can see it happen.
    .add(apply, EXPAND_S)
    .to([fill, logo], { opacity: 0, duration: REVEAL_S, ease: 'power1.out' }, EXPAND_S + HOLD_S)
    .to([logo], { scale: 1.04, duration: REVEAL_S, ease: 'power1.out' }, EXPAND_S + HOLD_S);
}
