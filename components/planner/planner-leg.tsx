'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/utils/distance-utils';
import { yFor, type DayGrid, type LanePlacement } from '@/lib/planner/day-grid';
import { TRANSFER_CHIP_CLASS, TRANSFER_RAIL_CLASS } from '@/lib/planner/leg-styles';
import { legDeficit, type Leg } from '@/lib/planner/leg';

interface PlannerLegProps {
  leg: Leg;
  grid: DayGrid;
  /** Where the previous block's queue ends, and where the next one starts. */
  fromMinute: number;
  toMinute: number;
  lane: LanePlacement;
  /** Offered on a broken leg. Moves ONE entry; never fires on its own. */
  onRepair?: () => void;
  onRepairCascade?: () => void;
}

/**
 * The space between two planned rides — and the object this whole view is built
 * around.
 *
 * A wait-time feed can tell somebody a queue is 45 minutes. What it cannot tell
 * them is that they will not make it from here to there, and that sentence is
 * what a planner is for. So the gap is not leftover whitespace: it carries the
 * distance, the allowance and the verdict.
 *
 * The chip is one line of `text-[10px]` in every state, including the states with
 * no distance in them, so the day a distance appears it lands in a box that was
 * already the right size.
 */
export function PlannerLeg({
  leg,
  grid,
  fromMinute,
  toMinute,
  lane,
  onRepair,
  onRepairCascade,
}: PlannerLegProps) {
  const t = useTranslations('planner');

  const top = yFor(grid, fromMinute);
  const height = Math.max(0, yFor(grid, toMinute) - top);

  const laneWidth = `calc((100% - ${(lane.columns - 1) * 2}px) / ${lane.columns})`;
  const laneLeft = `calc((${laneWidth} + 2px) * ${lane.column})`;

  const verdictLabel = t(`transfer.${leg.verdict}`);
  const broken = leg.verdict === 'broken';
  const gapLabel = t('transfer.gap', { minutes: Math.max(0, leg.gapMinutes) });
  // Against the CEILING, which is what every soft verdict is decided against —
  // `leg.ts` says so — so the number and the word cannot disagree. `null` on
  // `unknown`, where the whole point is that there is nothing to compare with.
  const slack = leg.verdict === 'unknown' ? null : leg.gapMinutes - leg.ceilingMinutes;

  // The title carries what the chip cannot: which parts of the arithmetic are
  // measured and which are allowances. `Luftlinie` is the reader's own
  // disclaimer on the distance, and it belongs next to it.
  const title = [
    leg.metres !== null ? t('transfer.distance', { distance: formatDistance(leg.metres) }) : null,
    t('transfer.minWalk', { minutes: leg.floorMinutes }),
    t('transfer.allowance'),
    leg.missing === 'no-spread' ? t('transfer.noSpread') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li
      data-planner-leg=""
      data-verdict={leg.verdict}
      className="pointer-events-none absolute"
      style={{ top, height, left: laneLeft, width: laneWidth, zIndex: 5 }}
    >
      {/* The rail. Dashed where there is no verdict to give. */}
      <div
        className={cn(
          'absolute top-0 bottom-0 left-3 w-0.5 rounded-full',
          TRANSFER_RAIL_CLASS[leg.verdict],
          leg.verdict === 'unknown' && 'opacity-60'
        )}
        aria-hidden="true"
      />

      <div
        className="pointer-events-auto absolute left-5 -translate-y-1/2"
        style={{ top: height < 18 ? 0 : '50%' }}
      >
        {broken && onRepair ? (
          <button
            type="button"
            onClick={onRepair}
            onDoubleClick={onRepairCascade}
            title={title}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] whitespace-nowrap tabular-nums transition-colors',
              TRANSFER_CHIP_CLASS.broken,
              'hover:bg-destructive/25'
            )}
          >
            <span>{t('transfer.brokenBy', { minutes: legDeficit(leg) })}</span>
            <span className="font-medium">{t('transfer.repair')}</span>
          </button>
        ) : (
          <span
            title={title}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] whitespace-nowrap tabular-nums',
              TRANSFER_CHIP_CLASS[leg.verdict]
            )}
          >
            {leg.metres !== null && (
              <span className="max-[399px]:hidden">↓ {formatDistance(leg.metres)}</span>
            )}
            {/* The number the verdict is ABOUT. The chip read "↓ 102 m ·
                Umstieg gut" — a distance and a judgement, with the quantity
                being judged nowhere on screen, so "gut" had to be taken on
                trust. This is how long the gap actually is. */}
            <span className="font-medium">{gapLabel}</span>
            {/* And by how much it clears. A verdict is a bucket; the slack is
                the figure that lets somebody decide the bucket is wrong for
                them — the same argument the ride list's height flag makes. */}
            {slack !== null && (
              <span className="opacity-70 max-[399px]:hidden">{signed(slack)}</span>
            )}
            <span>{verdictLabel}</span>
            {leg.missing === 'no-spread' && <span aria-hidden="true">°</span>}
          </span>
        )}
      </div>
    </li>
  );
}

/** `+5` / `−5`. A minus sign, not a hyphen: this is a number, not a compound. */
function signed(minutes: number): string {
  return minutes < 0 ? `−${Math.abs(minutes)}` : `+${minutes}`;
}
