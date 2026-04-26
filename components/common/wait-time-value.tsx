import { cn } from '@/lib/utils';

function colorClass(minutes: number): string {
  if (minutes <= 5) return 'text-crowd-very-low';
  if (minutes <= 15) return 'text-crowd-low';
  if (minutes <= 30) return 'text-crowd-moderate';
  if (minutes <= 40) return 'text-crowd-high';
  if (minutes <= 60) return 'text-crowd-very-high';
  return 'text-crowd-extreme';
}

interface WaitTimeValueProps {
  minutes: number;
  className?: string;
}

export function WaitTimeValue({ minutes, className }: WaitTimeValueProps) {
  return (
    <span
      className={cn(colorClass(minutes), className)}
      style={{ filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.3))' }}
    >
      {minutes}
    </span>
  );
}
