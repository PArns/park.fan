import { cn } from '@/lib/utils';

interface PhotoCreditProps {
  /**
   * Ready-to-render attribution line, e.g. `© 2026 Anakin (hampter)`. Renders
   * nothing when absent — an own shoot never reaches this component with a
   * line set (see `needsAttribution` in `@/lib/media/text`), so the caller
   * never needs to gate the render itself.
   */
  credit: string | null | undefined;
  className?: string;
}

/**
 * Small on-image credit badge for a photo that isn't ours — stock, press, a
 * contribution. Own shoots stay quiet; the sidecar already carries their
 * credit and nobody needs to be told the picture is park.fan's own.
 *
 * Needs a `relative` ancestor to place against — drop it inside the same
 * wrapper as the `<Image>` it credits.
 */
export function PhotoCredit({ credit, className }: PhotoCreditProps) {
  if (!credit) return null;

  return (
    <span
      className={cn(
        'pointer-events-none absolute right-1.5 bottom-1.5 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[10px] leading-none whitespace-nowrap text-white/90 backdrop-blur-sm',
        className
      )}
    >
      {credit}
    </span>
  );
}
