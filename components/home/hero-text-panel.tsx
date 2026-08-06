import { cn } from '@/lib/utils';

/**
 * The plate the hero's left column sits on.
 *
 * Without it the headline, search and pills float loose on the photo while the world map to
 * their right is a defined panel, and the two halves read as unrelated. This gives the left
 * side the same footprint — matching corner radius, border and vertical extent — so the hero
 * is one composition of two panels.
 *
 * It carries a real `backdrop-blur`, matching the map panel — the two plates read as one
 * material. That is not free: a backdrop filter this large over the ken-burns photo is
 * re-filtered on every animation frame (see the measurements in docs/features/homepage-hero.md).
 * Small things ON the plate still must not blur — they would each re-filter the same moving
 * backdrop for no visual gain.
 */
export function HeroTextPanel({ children, className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      {...rest}
      className={cn(
        // min-w-0: the scrollable pill row inside must not widen this box past its grid column.
        'border-border/40 bg-background/55 dark:bg-background/45 w-full max-w-2xl min-w-0 rounded-3xl border p-6 shadow-xl backdrop-blur-2xl sm:p-8',
        // While the search field has focus its dropdown covers the nearby pills. Fading them
        // out is what lets that dropdown be real glass: through 75% translucency the pills'
        // high-contrast text ghosts straight through the blur, and the only alternative was to
        // make the dropdown nearly opaque. `:has()` keeps this in CSS — no shared open state
        // between two sibling components — and browsers without it just keep the pills.
        '[&:has(input:focus)_[data-hero-bubbles]]:pointer-events-none [&:has(input:focus)_[data-hero-bubbles]]:opacity-0',
        // No forced height: the two columns are offset against each other rather than aligned,
        // so each is as tall as its own content.
        'xl:flex xl:flex-col',
        className
      )}
    >
      {children}
    </div>
  );
}
