import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'medium' | 'strong' | 'heavy';
}

/**
 * The `heavy` recipe as a bare class string, for the surfaces that are not a `GlassCard`.
 *
 * The park page opens with three stacked boxes — the title card, the "Heute im Park" panel and
 * the entry-tile row — and each of them had invented its own glass: `bg-background/60` +
 * `blur-md`, `bg-background/60` + `blur-md` with `dark:oklch(0.12 0.025 241 / 0.55)`, and
 * `bg-background/85` + `blur-xl` with `dark:oklch(0.13 0.02 241 / 0.88)`. Three fills of the same
 * colour at 60 %, 55 % and 88 %, two blurs, and the most opaque of the three was the row of small
 * boxes at the bottom — so the page's own header read as glass, glass, then a strip of black
 * plastic underneath it.
 *
 * They are one object stacked, so they get one material, and it is this one because it is the
 * variant already written down for a panel over a photo (see the docblock above). The tile row
 * takes {@link TILE_GLASS}, which is this recipe one grade more solid for a reason that only
 * applies at tile size.
 */
export const HEAVY_GLASS = 'bg-background/62 backdrop-blur-xl dark:bg-[oklch(0.13_0.02_241_/_0.6)]';

/**
 * The same glass one grade more solid, for the entry tiles.
 *
 * They cannot take {@link HEAVY_GLASS} unchanged, and the reason is size rather than taste. The
 * park backdrop is a `fixed` strip, so scrolling slides the header stack up across the picture,
 * and a 400 px panel packed with rules, numbers and captions carries enough structure of its own
 * to stay legible with the photo showing through at 62 %. A 200 px tile is an icon chip and two
 * lines of `text-xs`.
 *
 * The constraint is the tile's HINT, not its label. Measured on the tiles scrolled over the
 * bright half of the Phantasialand carousel — screenshotting each tile and averaging the pixels
 * in its left padding column, because `backdrop-filter` output exists only in the framebuffer and
 * cannot be read from the DOM — the composited glass came out at rgb(48,51,51) at 62 % and
 * rgb(38,47,45) at 75 %. The near-white label clears AA either way (12:1 and up). The hint is
 * `text-muted-foreground`, rgb(161,161,161) in the dark theme, and that one lands at 4.69:1 at
 * 62 % against 5.04:1 at 75 % — so 62 % puts the second line of every tile within a rounding
 * error of failing, on exactly the parks whose photo is brightest.
 *
 * 75 % is where that stops without going back to the strip of black plastic the row used to be:
 * the same hue, the same blur family, one step of fill instead of the `/85` + `oklch(…/0.88)`
 * this replaced. `backdrop-blur-2xl` rather than `xl` for the same reason, and without the cost
 * the `heavy` docblock describes — flattening the picture behind a 200 px box is fine, because
 * the picture is still there in the 12 px gaps between the tiles.
 */
export const TILE_GLASS =
  'bg-background/75 backdrop-blur-2xl dark:bg-[oklch(0.13_0.02_241_/_0.75)]';

/**
 * Glassmorphism card component with standardized glass effects
 * Used for headers and content cards with backdrop blur
 *
 * `heavy` is the hero's glass and the only variant that parts from the shared `--background`
 * tint: it stays lighter than the other variants in light mode and goes markedly DARKER in dark
 * mode, so a panel laid over the hero photo (the world map, the search dropdown) reads as one
 * pane of glass rather than a washed-out rectangle with the photo bleeding through its text.
 *
 * It is deliberately NOT the biggest blur available. At 64 px over 75% fill the photo behind it
 * stopped being a photo — an even field of colour, with nothing left of the park behind the
 * panel. 24 px over 62% keeps shapes and light readable through the glass while the text on top
 * still measures far past AA (the hero copy clears 12:1 over the raw photo with no panel at all,
 * so the fill is not what is carrying legibility here). The radius is not a performance lever
 * either — 64 px, 24 px and 12 px all measured the same frame time.
 */
export function GlassCard({
  children,
  className,
  variant = 'medium',
  ref,
  ...rest
}: GlassCardProps & { ref?: React.Ref<HTMLDivElement> }) {
  const variantClasses = {
    light: 'bg-background/40 backdrop-blur-sm',
    medium: 'bg-background/60 backdrop-blur-md',
    strong: 'bg-background/80 backdrop-blur-lg',
    heavy: HEAVY_GLASS,
  };

  return (
    <div
      ref={ref}
      className={cn('rounded-xl border p-6 shadow-sm', variantClasses[variant], className)}
      {...rest}
    >
      {children}
    </div>
  );
}
