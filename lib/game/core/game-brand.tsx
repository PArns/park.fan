'use client';

/**
 * The park.fan lockup, in the corner, while the park is running.
 *
 * It lives in **core** rather than in the `ui` module, and that is the whole reason this file
 * exists as its own thing: the HUD is a module a builder owns and rewrites, and a brand mark that
 * sits inside somebody's build bar disappears the first time that build bar is redesigned. Chrome
 * that identifies the product is not a HUD widget — `GameShell` already treats it that way on the
 * boot screen, and this is the same mark on the same terms once the shell is gone.
 *
 * It is {@link BrandLockup}, not a copy of it. The repo has exactly one component that draws the
 * pin and the wordmark together, with their sizes and the gap between them measured off the ink
 * rather than off an artboard (see the docblock in `components/layout/brand-lockup.tsx`), and a
 * second lockup assembled here from the same two SVGs would be that geometry stored twice with
 * nothing comparing the copies.
 *
 * `forceLight` because the world behind it is dark at every hour: the light-ink artwork is the
 * right one at noon over grass and at midnight over a lit midway, and the theme-swapped variant
 * would flip to dark ink on `light` — a theme this route never renders but which the shared
 * component still answers.
 *
 * Placement is bottom-**right**. Bottom-left is where the browser puts a link target preview and
 * where the site's feedback widget sits, top-left and top-right are the HUD's, and the bottom
 * centre is the notice line. It is also the corner a build tool is least likely to want.
 *
 * And it is **not drawn below `sm`**. Measured at 390×844: the bottom row holds the feedback
 * widget on the left, the graphics-preset notice in the middle and this mark on the right, and
 * there is not room for the three of them — the notice came out clipped at both ends with the
 * wordmark sitting on its last word. On a phone the screen IS the game, and a watermark that
 * collides with a message the reader needs is worse than no watermark. Same instinct as the blog
 * card, which drops its photo below `sm` rather than squeezing it.
 */

import Link from 'next/link';
import { BrandLockup } from '@/components/layout/brand-lockup';

export interface GameBrandMarkProps {
  /** Hidden while the boot shell is up (it draws its own lockup) and in photo mode. */
  hidden?: boolean;
  /** Screen-reader label; the visible mark is decorative twice over. */
  label: string;
}

export function GameBrandMark({ hidden = false, label }: GameBrandMarkProps) {
  if (hidden) return null;
  return (
    // The wrapper is pointer-transparent so a drag that ends over the mark still reaches the
    // canvas; only the link itself takes the pointer back.
    <div
      className="pointer-events-none absolute right-3 bottom-3 z-20 hidden select-none sm:block"
      data-game-chrome="brand"
    >
      <Link
        href="/"
        aria-label={label}
        title={label}
        className="pointer-events-auto flex items-center gap-2 rounded-lg px-2 py-1.5 opacity-55 transition-opacity duration-200 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-(--game-accent)/50"
      >
        <BrandLockup forceLight />
      </Link>
    </div>
  );
}
