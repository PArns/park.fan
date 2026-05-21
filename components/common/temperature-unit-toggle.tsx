'use client';

import { useTranslations } from 'next-intl';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { cn } from '@/lib/utils';

interface TemperatureUnitToggleProps {
  className?: string;
}

/**
 * Compact two-state toggle: °C / °F.
 * Click the inactive side to switch — current pick stays visually solid.
 * The choice is persisted to a year-long cookie by the surrounding context.
 */
export function TemperatureUnitToggle({ className }: TemperatureUnitToggleProps) {
  const { unit, setUnit } = useTemperatureUnit();
  const t = useTranslations('parks.weather');

  return (
    <div
      role="group"
      aria-label={t('unitToggleLabel')}
      className={cn(
        'border-border/60 bg-background/40 inline-flex h-6 items-center rounded-full border p-0.5 text-[10px] font-medium',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setUnit('C')}
        aria-pressed={unit === 'C'}
        className={cn(
          'rounded-full px-2 py-0.5 transition-colors',
          unit === 'C'
            ? 'bg-foreground/10 text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        °C
      </button>
      <button
        type="button"
        onClick={() => setUnit('F')}
        aria-pressed={unit === 'F'}
        className={cn(
          'rounded-full px-2 py-0.5 transition-colors',
          unit === 'F'
            ? 'bg-foreground/10 text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        °F
      </button>
    </div>
  );
}
