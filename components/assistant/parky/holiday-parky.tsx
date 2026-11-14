import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BUBBLE, CHEEKS, EYES, GRIN, HAPPY_EYES, SMILE, blue, blush, green, ink } from './drawing';
import { ParkyEyeWhite, ParkyPupil } from './eyes';
import { ParkyShades } from './looks';
import { ParkyWheel } from './wheel';

/**
 * Parky on holiday, as the region scenes of the planner band draw him: the pieces of the live
 * drawing (`drawing.ts`, the wheel, the eyes, the shades) in his 48-unit space, with room for what
 * a region gives him. The Orlando scene (`orlando-scene.tsx`) came first and keeps its own copy.
 */

/**
 * How his eyes are drawn: open and looking somewhere (`look` is the pupils' offset, as in
 * `LOOK_GAZE`), screwed up into a happy squint, or behind his sunglasses.
 */
export type HolidayEyes = { look: { x: number; y: number } } | 'happy' | 'shades';

/** His mouth: the open grin, the smile, or a small round "oh" for something he marvels at. */
export type HolidayMouth = 'grin' | 'smile' | 'wonder';

/**
 * Parky in his 48-unit space, standing on the scene's ground: `behind` is drawn before him (a board
 * he leans on), `wear` right over his body (a necklace, a scarf, a sprig), `hands` last (what he
 * holds in front). `ground` names the scene's own gradient for his body, so no two pictures on one
 * page share an id.
 */
export function HolidayParky({
  ground,
  eyes,
  mouth,
  behind,
  wear,
  hands,
}: {
  ground: string;
  eyes: HolidayEyes;
  mouth: HolidayMouth;
  behind?: ReactNode;
  wear?: ReactNode;
  hands?: ReactNode;
}) {
  return (
    <>
      {behind}
      <ParkyWheel />
      <path d={BUBBLE} fill={`url(#${ground})`} />
      {wear}
      {eyes === 'shades' ? (
        <ParkyShades />
      ) : eyes === 'happy' ? (
        <path d={HAPPY_EYES} fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      ) : (
        EYES.map((x) => (
          <g key={x}>
            <ParkyEyeWhite x={x} />
            <ParkyPupil x={x} dx={eyes.look.x} dy={eyes.look.y} />
          </g>
        ))
      )}
      {CHEEKS.map((x) => (
        <ellipse key={x} cx={x} cy="31" rx="2.4" ry="1.4" fill={blush} opacity=".7" />
      ))}
      {mouth === 'grin' && <path d={GRIN} fill={ink} />}
      {mouth === 'smile' && (
        <path d={SMILE} fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
      )}
      {mouth === 'wonder' && <ellipse cx="24" cy="34" rx="2" ry="2.4" fill={ink} />}
      {hands}
    </>
  );
}

/**
 * A scene's stylesheet from its moves: they play once each time the band shows and only where the
 * reader allows motion, since the band is glass and nothing may run on under a `backdrop-filter`.
 * Without motion every piece keeps its own resting state, so the picture stands finished.
 */
export function motionOnce(css: string): string {
  return `@media (prefers-reduced-motion: no-preference) {${css}}`;
}

/** The centres of `count` cabins round a wheel's rim, the first at the top, as `CABINS` are. */
export function cabinsOnRim(
  { x, y, r }: { x: number; y: number; r: number },
  count = 8
): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    x: +(x + r * Math.sin((i * 2 * Math.PI) / count)).toFixed(2),
    y: +(y - r * Math.cos((i * 2 * Math.PI) / count)).toFixed(2),
  }));
}

/** One of his hands: a round mitten in his own colours, as the umbrella's in `looks.tsx`. */
export function HolidayMitten({ ground, x, y }: { ground: string; x: number; y: number }) {
  return <circle cx={x} cy={y} r="2.3" fill={`url(#${ground})`} />;
}

/** His body's gradient, blue to green, under the id a scene gives it. */
export function HolidayGround({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={blue} />
      <stop offset="1" stopColor={green} />
    </linearGradient>
  );
}

/**
 * A region scene's root: the 320 × 160 frame of `ParkyBreakScene` and the Orlando scene, filling
 * its box from the right edge (`xMaxYMid slice`), where Parky stands, and leaving the left to the
 * card's text. Decoration: `aria-hidden` and out of the tab order. `motion` is the scene's own
 * stylesheet: the moves it plays once, written under `prefers-reduced-motion: no-preference` so
 * without motion the picture stands finished.
 */
export function HolidaySceneSvg({
  className,
  motion,
  children,
}: {
  className?: string;
  motion: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 320 160"
      preserveAspectRatio="xMaxYMid slice"
      className={cn('block', className)}
      aria-hidden="true"
      focusable="false"
    >
      <style>{motion}</style>
      {children}
    </svg>
  );
}
