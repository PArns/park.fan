import { cn } from '@/lib/utils';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';

interface WaitTimeValueProps {
  minutes: number;
  className?: string;
}

export function WaitTimeValue({ minutes, className }: WaitTimeValueProps) {
  return (
    <span
      className={cn(CROWD_TEXT_CLASS[waitTimeCrowdTier(minutes)], className)}
      style={{ filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.3))' }}
    >
      {minutes}
    </span>
  );
}
