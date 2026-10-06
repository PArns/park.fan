import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'medium' | 'strong' | 'heavy' | 'tile';
}

/**
 * The `heavy` recipe as a bare class string, for surfaces that are not a `GlassCard`: the park
 * page's stacked title card and „Heute im Park" panel take one material because they are one
 * object.
 */
export const HEAVY_GLASS = 'bg-background/62 backdrop-blur-xl dark:bg-[oklch(0.13_0.02_241_/_0.6)]';

/**
 * The same glass one grade more solid, for the entry tiles. A small tile has too little structure
 * of its own to stay legible over a bright photo at 62 %, and its muted hint fails AA there; 75 %
 * and `backdrop-blur-2xl` fix that while the photo still shows in the gaps between tiles.
 */
export const TILE_GLASS =
  'bg-background/75 backdrop-blur-2xl dark:bg-[oklch(0.13_0.02_241_/_0.75)]';

/**
 * {@link TILE_GLASS}'s fill without its blur, for a panel that blurs its own photograph instead of
 * the backdrop: the homepage compass, whose moving arrows would make a `backdrop-filter` flicker.
 * 75 % for the tile's reason, since its list is small print.
 */
export const PHOTO_GLASS_FILL = 'bg-background/75 dark:bg-[oklch(0.13_0.02_241_/_0.75)]';

/**
 * The same panel where there is no photograph behind it. {@link TILE_GLASS} over a plain page sinks
 * into it in the dark theme, so this uses `--muted`, the token that separates from `--background`
 * in both themes (`--card` is the same white in light). No blur, with nothing behind to blur.
 */
export const PANEL_FLAT = 'bg-muted/30';

/**
 * Glass card for headers and content cards over a photo. `heavy` is the homepage hero's glass,
 * lighter in light mode and markedly darker in dark mode, so a panel over the hero photo reads as
 * one pane. `tile` ({@link TILE_GLASS}) is the park page's, whose backdrop is whatever photo the
 * park has. The blur is moderate on purpose: much more and the photo behind stops reading as one.
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
    tile: TILE_GLASS,
  };

  return (
    <div
      ref={ref}
      data-glass-card=""
      className={cn('rounded-xl border p-6 shadow-sm', variantClasses[variant], className)}
      {...rest}
    >
      {children}
    </div>
  );
}
