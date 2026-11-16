import { ParkyStill } from '@/components/assistant/parky/parky-still';
import { forSatori } from './satori-svg';

/**
 * Parky for the share images, standing still at `size` pixels square, hat included: the same
 * `ParkyStill` a post's "Parky says" card draws, so he is the drawing and never a copy of it.
 */
export function OgParky({ size }: { size: number }) {
  return forSatori(<ParkyStill ground="og-parky" size={size} />);
}
