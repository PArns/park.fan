'use client';

import { useTranslations } from 'next-intl';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { cn } from '@/lib/utils';

interface TemperatureUnitToggleProps {
  className?: string;
}

/**
 * °C ⇄ °F as one button in the header beside the theme switch, the one row on every page. It shows
 * the active unit and switches on click, because the 360 px bar has no room for a two-segment pill.
 * Which unit is shown is CSS (`.u-metric` / `.u-imperial` under `html[data-temp-unit]`), not React
 * state, so it can never disagree with the temperatures it governs or cause a hydration mismatch;
 * the click reads the attribute for the same reason. See
 * docs/rules/a-client-only-preference-may-not-decide-server-rendered-markup.md.
 */
export function TemperatureUnitToggle({ className }: TemperatureUnitToggleProps) {
  const { setUnit } = useTemperatureUnit();
  const t = useTranslations('common');

  return (
    <button
      type="button"
      onClick={() =>
        setUnit(document.documentElement.getAttribute('data-temp-unit') === 'F' ? 'C' : 'F')
      }
      title={t('temperatureUnitToggle')}
      className={cn(
        // The theme switch's height and border, so the two read as one pair. The 44 px phone tier
        // is cancelled because the bar is `h-12`, see
        // docs/rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md.
        'border-border/60 bg-muted/60 text-muted-foreground inline-flex h-7 shrink-0 items-center',
        'justify-center rounded-full border px-1 text-[11px] font-medium',
        // The width may not depend on the active unit: `°F` is narrower than `°C`, and a button
        // that resized under the finger would slide its neighbours. `px-1` lets it grow rather than
        // clip if a reader's font is larger.
        'min-w-7 max-sm:min-w-6',
        'hover:border-primary/50 hover:text-foreground focus-visible:ring-ring transition-colors',
        'focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
    >
      <span className="u-metric">°C</span>
      <span className="u-imperial">°F</span>
      {/* Not `aria-label`: that would replace the content and hide the very thing the button
          reports. Appended, it reads as "°C, Temperatureinheit, Schaltfläche". */}
      <span className="sr-only">{t('temperatureUnit')}</span>
    </button>
  );
}
