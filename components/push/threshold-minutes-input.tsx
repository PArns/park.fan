'use client';

import { Input } from '@/components/ui/input';
import {
  DEFAULT_THRESHOLD_MIN,
  MIN_THRESHOLD_MIN,
  MAX_THRESHOLD_MIN,
  parseThresholdMinutes,
} from '@/lib/push/threshold-minutes';

export { DEFAULT_THRESHOLD_MIN, MIN_THRESHOLD_MIN, MAX_THRESHOLD_MIN, parseThresholdMinutes };

interface ThresholdMinutesInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel: string;
  autoFocus?: boolean;
}

/**
 * The "notify below N minutes" field both ride-alert dialogs render.
 * Deliberately dumb — it hands the raw text up rather than parsing it
 * itself, so the caller decides what an invalid value means for its own
 * submit button (see `parseThresholdMinutes`, in `lib/push/` rather than
 * here so it stays importable from a plain test script).
 */
export function ThresholdMinutesInput({
  value,
  onChange,
  className,
  ariaLabel,
  autoFocus,
}: ThresholdMinutesInputProps) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      min={MIN_THRESHOLD_MIN}
      max={MAX_THRESHOLD_MIN}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
    />
  );
}
