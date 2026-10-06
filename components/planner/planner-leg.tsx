'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/utils/distance-utils';
import { laneBox, yFor, type DayGrid, type LanePlacement } from '@/lib/planner/day-grid';
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
   * Where the previous block's box is drawn to, in `yFor` pixels: a short queue's box hangs into
   * the gap, so this is the edge the chip has to clear (see `leg-chip.ts`).
   */
  fromBottomPx: number;
  lane: LanePlacement;
  /**
   * A drag is under way, so this leg steps back with the blocks to the same 35 %, or it would be
   * the loudest thing on the grid that is not the ghost.
   */
  dimmed?: boolean;
  /** Offered on a broken leg. Moves ONE entry; never fires on its own. */
  onRepair?: () => void;
  onRepairCascade?: () => void;
}

/**
 * The space between two planned rides, the object this view is built around: not leftover
 * whitespace, but the distance, the allowance and the verdict.
 *
 * What the chip may say follows the room it has, measured against the drawn boxes (`leg-chip.ts`).
 * The short form keeps the minutes and the verdict and drops the distance (still in the `title`)
 * and the slack. See
 * docs/features/trip-planner.md#and-it-is-drawn-in-the-gap-a-reader-can-see-not-in-the-gap-between-two-queues.
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

  const { left: laneLeft, width: laneWidth } = laneBox(lane);

  const verdictLabel = t(`transfer.${leg.verdict}`);
  const broken = leg.verdict === 'broken';
  // The repair button keeps its size — it is a target, not a label.
  const { topPx, compact } = legChipPlacement(
    height,
    fromBottomPx - top,
    broken && Boolean(onRepair)
  );
  const gapLabel = t('transfer.gap', { minutes: Math.max(0, leg.gapMinutes) });
  // Against the ceiling, which every soft verdict is decided against (`leg.ts`), so the number and
  // the word agree. `null` on `unknown`, with nothing to compare.
  const slack = leg.verdict === 'unknown' ? null : leg.gapMinutes - leg.ceilingMinutes;

  // The title carries what the chip cannot: which parts are measured and which are allowances.
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
      {/* The rail, dashed where there is no verdict. */}
      <div
        className={cn(
          'absolute top-0 bottom-0 left-3 w-0.5 rounded-full',
          TRANSFER_RAIL_CLASS[leg.verdict],
          leg.verdict === 'unknown' && 'opacity-60'
        )}
        aria-hidden="true"
      />

      {/* `flex` is load-bearing: in a block wrapper the `inline-flex` chip would sit on a line
          box's baseline, offset by a leading that varies with its height. */}
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
              // A border on the full chip, an inset ring on the short one: a ring costs no height,
              // and `current` keeps the verdict's colour without a second map.
              compact
                ? 'px-1 py-0 leading-[12px] ring-1 ring-current/40 ring-inset'
                : 'border px-1.5 py-0.5',
              TRANSFER_CHIP_CLASS[leg.verdict]
            )}
          >
            {!compact && leg.metres !== null && (
              <span className="max-[399px]:hidden">↓ {formatDistance(leg.metres)}</span>
            )}
            {/* The gap's length, the number the verdict is about. */}
            <span className="font-medium">{gapLabel}</span>
            {/* And by how much it clears, so somebody can decide the verdict is wrong for them. */}
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
