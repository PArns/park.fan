'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/utils/distance-utils';
import { yFor, type DayGrid, type LanePlacement } from '@/lib/planner/day-grid';
import { TRANSFER_CHIP_CLASS, TRANSFER_RAIL_CLASS } from '@/lib/planner/leg-styles';
import { legChipPlacement } from '@/lib/planner/leg-chip';
import { legDeficit, type Leg } from '@/lib/planner/leg';

interface PlannerLegProps {
  leg: Leg;
  grid: DayGrid;
  /** Where the previous block's queue ends, and where the next one starts. */
  fromMinute: number;
  toMinute: number;
  /**
   * Where the previous block's BOX is drawn to, in the same pixels as `yFor`.
   *
   * Not the same thing as `fromMinute`: a queue under the 16.7-minute floor is
   * still drawn in a box a line of text fits in, so the block hangs into the gap
   * below it. This is the edge the chip has to clear — see `leg-chip.ts`.
   */
  fromBottomPx: number;
  lane: LanePlacement;
  /**
   * A drag is under way, so this leg steps back with the blocks.
   *
   * The chip is a bordered pill on the grid's flat ground and the rail is a
   * solid 2 px line — leave them at full strength while every block drops to
   * 35 % and they become the loudest thing that is not the ghost, which is the
   * opposite of what the dimming is for. Same 35 % and the same transition.
   */
  dimmed?: boolean;
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
 *
 * **What it may say follows the room it has**, and the room is measured against
 * the drawn boxes either side rather than against the minutes between the two
 * queues (`leg-chip.ts`). Since the optimiser started timing on the expected
 * wait the blocks stand close together, and the 21 px chip stopped fitting: the
 * short form drops the distance and the slack and keeps the two things the gap
 * is about, the minutes and the verdict. The distance is still in the `title`;
 * the slack is not, there or anywhere else, and that is the cost of the short
 * form rather than an oversight — the `title` has always carried the parts of
 * the arithmetic rather than its result.
 */
export function PlannerLeg({
  leg,
  grid,
  fromMinute,
  toMinute,
  fromBottomPx,
  lane,
  dimmed = false,
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
  // The repair button keeps its size — it is a target, not a label.
  const { topPx, compact } = legChipPlacement(
    height,
    fromBottomPx - top,
    broken && Boolean(onRepair)
  );
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
      className={cn(
        'pointer-events-none absolute transition-opacity duration-300',
        dimmed && 'opacity-35'
      )}
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

      {/* `flex`, and it is load-bearing: the chip is `inline-flex`, so in a block
          wrapper it is an inline box on a LINE box and sits on that line's
          baseline — measured at 1440×1000, a 12 px chip in a wrapper positioned
          at `top: 10px` painted at 18. The offset is the leading above the
          baseline, so it varies with the chip's height and silently undid a
          position computed in pixels. A flex item has no baseline to sit on. */}
      <div className="pointer-events-auto absolute left-5 flex" style={{ top: topPx }}>
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
            data-planner-leg-chip={compact ? 'compact' : 'full'}
            className={cn(
              'inline-flex items-center gap-1 rounded-full text-[10px] whitespace-nowrap tabular-nums',
              // The outline is a border on the full chip and an INSET RING on the
              // short one, which is the whole trick: a ring is a shadow, so it
              // costs no height, and `current` keeps it the verdict's own colour
              // without a second per-verdict map to drift from the first.
              compact
                ? 'px-1 py-0 leading-[12px] ring-1 ring-current/40 ring-inset'
                : 'border px-1.5 py-0.5',
              TRANSFER_CHIP_CLASS[leg.verdict]
            )}
          >
            {!compact && leg.metres !== null && (
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
            {!compact && slack !== null && (
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
