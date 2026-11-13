import type { ReactNode } from 'react';
import { HUB, RIM } from '@/lib/assistant/parky/rides';
import { A_FRAME, CABINS, CABIN_COLOURS, SPOKES, blue, frame } from './drawing';

/**
 * Parky's hat: a Ferris wheel on an A-frame, set into his head. `className` goes on the part that
 * turns (rim, spokes and cabins), and `glow` is drawn between the spokes and the cabins, for the
 * lights at night. The wheel, the frame and the hub come out side by side rather than in one
 * group, so a rule on the hat's direct children (`.parky-hat--dressed > …`) still reaches each.
 */
export function ParkyWheel({ className, glow }: { className?: string; glow?: ReactNode }) {
  return (
    <>
      <g className={className}>
        {/* A light edge under the rim keeps the wheel legible on any page. */}
        <circle
          cx={HUB.x}
          cy={HUB.y}
          r={RIM}
          fill="none"
          stroke="white"
          strokeOpacity=".8"
          strokeWidth="2.6"
        />
        <circle cx={HUB.x} cy={HUB.y} r={RIM} fill="none" stroke={blue} strokeWidth="1.3" />
        <path d={SPOKES} stroke={blue} strokeOpacity=".75" strokeWidth=".55" />
        {glow}
        {CABINS.map((cabin, i) => (
          <circle
            key={`${cabin.x} ${cabin.y}`}
            cx={cabin.x}
            cy={cabin.y}
            r="1.45"
            fill={CABIN_COLOURS[i % CABIN_COLOURS.length]}
            stroke="white"
            strokeWidth=".5"
          />
        ))}
      </g>
      <path d={A_FRAME} stroke={frame} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={HUB.x} cy={HUB.y} r="1.3" fill="white" stroke={frame} strokeWidth=".8" />
    </>
  );
}
