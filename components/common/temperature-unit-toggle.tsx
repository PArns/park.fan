'use client';

import { useEffect, useState } from 'react';
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
 *
 * **Which side looks pressed is CSS, not React state** (`.u-unit-c` / `.u-unit-f`
 * under `html[data-temp-unit]`, next to the `.u-metric` / `.u-imperial` rules the
 * temperatures themselves use). Branching on `unit` during render made this the
 * one control on the page that disagreed with the values it governs until React
 * booted — and worse, a hydration mismatch: the provider syncs the unit in an
 * effect, so a weather widget hydrating after that effect ran was hydrated
 * against `F` while its server HTML said `C`, and React logged the subtree and
 * patched nothing. Static classes cannot mismatch, and the pre-paint attribute
 * has the answer before the first frame.
 *
 * `aria-pressed` is the one thing CSS cannot set, and it cannot come from the
 * context during hydration either: the provider commits before a widget this deep
 * does, so by the time this subtree hydrates the context already says `F` while
 * its own server markup says `C`. Fixing the provider does not reach here — a
 * server snapshot only covers the hook's own hydration render, not a consumer
 * that hydrates after the provider re-rendered. So the guard is local: state this
 * component owns is `false` through its own hydration whatever happened above it,
 * and the real value lands one tick later. Nobody sees the gap — which side looks
 * pressed was already decided by CSS before the first frame.
 */
export function TemperatureUnitToggle({ className }: TemperatureUnitToggleProps) {
  const { unit, setUnit } = useTemperatureUnit();
  const t = useTranslations('parks.weather');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Deferred, like the nowcast banner's clock — no synchronous set-state-in-effect.
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

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
        aria-pressed={mounted ? unit === 'C' : undefined}
        className="u-unit-btn u-unit-c rounded-full px-2 py-0.5 transition-colors"
      >
        °C
      </button>
      <button
        type="button"
        onClick={() => setUnit('F')}
        aria-pressed={mounted ? unit === 'F' : undefined}
        className="u-unit-btn u-unit-f rounded-full px-2 py-0.5 transition-colors"
      >
        °F
      </button>
    </div>
  );
}
