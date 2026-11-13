import { ink } from './drawing';

/**
 * One of Parky's open eyes, the white of it, round its centre on the x axis (`EYES`). The live
 * Parky and his pictures draw the same eye, so a picture of him never looks like somebody else.
 */
export function ParkyEyeWhite({ x }: { x: number }) {
  return <ellipse cx={x} cy="22.5" rx="5.4" ry="6.2" fill="white" />;
}

/**
 * The pupil of the eye at `x` with its glint, `dx` and `dy` off the middle: where a picture points
 * his gaze (`LOOK_GAZE`), while the live Parky moves the group round it instead.
 */
export function ParkyPupil({ x, dx = 0, dy = 0 }: { x: number; dx?: number; dy?: number }) {
  return (
    <>
      <circle cx={x + dx} cy={23 + dy} r="3" fill={ink} />
      <circle cx={x + 1.1 + dx} cy={21.7 + dy} r="1.05" fill="white" />
    </>
  );
}
