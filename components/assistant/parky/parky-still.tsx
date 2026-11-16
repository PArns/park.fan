import { FIGURE_BOX } from './drawing';
import { HolidayGround, HolidayParky } from './holiday-parky';

/**
 * Parky standing still and smiling, hat included, as one `<svg>` that needs no client code: the
 * live drawing's pieces with nothing moving, for a post's "Parky says" card and the share images.
 * `ground` is his gradient's id, unique on the page; `size` sets the pixel box where no class can
 * (the share images). Decoration, so `aria-hidden`.
 */
export function ParkyStill({
  ground,
  className,
  size,
}: {
  ground: string;
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox={FIGURE_BOX}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <HolidayGround id={ground} />
      </defs>
      <HolidayParky ground={ground} eyes={{ look: { x: 0, y: 0 } }} mouth="smile" />
    </svg>
  );
}
