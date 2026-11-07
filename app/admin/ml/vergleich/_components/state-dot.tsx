import { cn } from '@/lib/utils';
import type { ModelCellState, ModelCheckState } from '@/lib/api/admin-model-comparison';
import { CELL_STATE_META } from '@/lib/admin/model-comparison';
import type { ChipTone } from '../../../_ui/primitives';

const DOT_CLASS: Record<ModelCellState, string> = {
  today: 'ring-2 ring-inset ring-foreground text-[9px] tracking-wide',
  better: 'bg-emerald-500 text-emerald-950',
  worse: 'bg-red-500 text-red-950',
  pending: 'bg-amber-500/15 text-amber-400',
  unclear: '',
};

/** The fill of each state where a bar draws it instead of a dot: the dot colours, unclear faint. */
export const STATE_FILL: Record<Exclude<ModelCellState, 'today'>, string> = {
  better: 'oklch(69.6% 0.17 162.48)',
  pending: 'oklch(76.9% 0.188 70.08)',
  worse: 'oklch(63.7% 0.237 25.331)',
  unclear: 'oklch(55.6% 0 0 / 0.45)',
};

/** The `Chip` tone a state's pill takes in the detail panel. */
export const STATE_TONE: Record<ModelCellState, ChipTone> = {
  today: 'primary',
  better: 'success',
  pending: 'warning',
  worse: 'danger',
  unclear: 'muted',
};

const RING_R = 12;
const RING_C = 2 * Math.PI * RING_R;

/**
 * One matrix circle: better a filled tick, worse a filled cross, pending a ring that fills with
 * `progress` (0 to 1) toward the live rule, unclear a faint ring, today an outlined „App“. `sm` is
 * the legend size, without the ring's progress or the word.
 */
export function StateDot({
  state,
  progress = 0,
  size = 'md',
  selected = false,
}: {
  state: ModelCellState;
  progress?: number;
  size?: 'sm' | 'md';
  selected?: boolean;
}) {
  const small = size === 'sm';
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-grid shrink-0 place-items-center rounded-full leading-none font-bold transition-transform',
        small ? 'h-3.5 w-3.5 text-[8px]' : 'h-7 w-7 text-xs',
        DOT_CLASS[state],
        small && state === 'pending' && 'ring-[1.5px] ring-amber-500 ring-inset',
        selected && 'outline-primary outline-2 outline-offset-3'
      )}
    >
      {state === 'pending' && !small && (
        <svg viewBox="0 0 28 28" className="absolute inset-0">
          <circle
            cx={14}
            cy={14}
            r={RING_R}
            fill="none"
            strokeWidth={2.5}
            className="stroke-amber-500/30"
          />
          <circle
            cx={14}
            cy={14}
            r={RING_R}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={`${RING_C * Math.max(0.04, Math.min(1, progress))} ${RING_C}`}
            transform="rotate(-90 14 14)"
            className="stroke-amber-500"
          />
        </svg>
      )}
      {state === 'unclear' && (
        <span
          className={cn(
            'ring-muted-foreground/70 rounded-full ring-[1.5px] ring-inset',
            small ? 'h-2 w-2' : 'h-2.5 w-2.5'
          )}
        />
      )}
      {!(small && state === 'today') && CELL_STATE_META[state].symbol}
    </span>
  );
}

const CHECK_CLASS: Record<ModelCheckState, string> = {
  yes: 'bg-emerald-500 text-emerald-950',
  no: 'bg-red-500 text-red-950',
  running: 'ring-2 ring-inset ring-amber-500',
  open: 'ring-[1.5px] ring-inset ring-muted-foreground/60',
};

/** A small round mark for one of the three checks: tick, cross, running ring or open ring. */
export function CheckDot({ state }: { state: ModelCheckState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[9px] font-bold',
        CHECK_CLASS[state]
      )}
    >
      {state === 'yes' ? '✓' : state === 'no' ? '×' : ''}
    </span>
  );
}
