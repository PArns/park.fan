import { cn } from '@/lib/utils';

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
      <span className="relative flex h-2 w-2 shrink-0">
        {config.pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              config.dot
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', config.dot)} />
      </span>
      <span className="text-sm font-medium">{config.label}</span>
      {label && <span className="text-muted-foreground font-mono text-xs">{label}</span>}
    </span>
  );
}
