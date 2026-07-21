import { cn } from '@/lib/utils';
import { LiveDot } from '@/components/common/live-dot';

export type TrainingState = 'training' | 'idle' | 'error' | 'unknown';

interface TrainingStatusBadgeProps {
  state: TrainingState;
  /** Optional version label shown next to the state */
  label?: string;
  className?: string;
}

const stateConfig: Record<
  TrainingState,
  { dot: string; text: string; pulse: boolean; label: string }
> = {
  training: {
    dot: 'bg-blue-500',
    text: 'text-blue-400',
    pulse: true,
    label: 'Training',
  },
  idle: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
    pulse: false,
    label: 'Idle',
  },
  error: {
    dot: 'bg-red-500',
    text: 'text-red-400',
    pulse: false,
    label: 'Error',
  },
  unknown: {
    dot: 'bg-zinc-500',
    text: 'text-zinc-400',
    pulse: false,
    label: 'Unknown',
  },
};

/**
 * Animated status badge for ML training jobs and async background tasks.
 * Shows a pulsing dot when training is active.
 */
export function TrainingStatusBadge({ state, label, className }: TrainingStatusBadgeProps) {
  const config = stateConfig[state];

  return (
    <span className={cn('inline-flex items-center gap-1.5', config.text, className)}>
      <LiveDot
        color={config.dot}
        pingColor={cn(config.dot, 'opacity-75')}
        showPing={config.pulse}
        className="flex shrink-0"
      />
      <span className="text-sm font-medium">{config.label}</span>
      {label && <span className="text-muted-foreground font-mono text-xs">{label}</span>}
    </span>
  );
}
