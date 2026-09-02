'use client';

import { useTranslations } from 'next-intl';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { cn } from '@/lib/utils';

interface TemperatureUnitToggleProps {
  className?: string;
}

/**
 * °C ⇄ °F, as one button in the header beside the theme switch.
 *
 * It used to be a two-segment pill in the weather card's header, i.e. reachable on park pages
 * and nowhere else — while the unit governs temperatures in the calendar, in blog posts and on
 * the best-travel-time hub too. It sits next to the other two preferences now (language, theme),
 * which is also the only row that is on every page.
 *
 * **The bar decided the shape.** Measured at 360 px (the width most Android phones still report),
 * the header row carries 303 px of content in 328 px: 25 px of slack, and a two-segment pill is
 * 54 px wide. So the control shows the unit that is ACTIVE and switches to the other one on
 * click — 29 px, which fits beside the locale switcher once that drops its redundant country
 * code below `sm`. Above `sm` the extra clarity of both segments would be affordable and is
 * deliberately not taken: one control that looks the same everywhere beats two markups that
 * hydrate into each other.
 *
 * The `max-sm:px-1.5` is the last 4 px of that budget, and it is paid here because this is the
 * control that spends it: at 320 px, the smallest viewport still in the logs, the row was already
 * 15 px over its box before this button existed — absorbed by the container's own padding, so
 * nothing scrolled — and the button plus the header's tightened phone gaps have to land back
 * under that same 16 px. Measured: 320 px document, no sideways scroll, at every width from 320
 * to 768.
 *
 * **Which unit is shown is CSS, not React state** — the same `.u-metric` / `.u-imperial` pair
 * that every server-rendered temperature on the site uses, under the `html[data-temp-unit]` the
 * inline script writes before paint. Branching on the context during render made this the one
 * control on the page that disagreed with the values it governs until React booted — and worse,
 * a hydration mismatch: the provider resolves the unit outside React, so a weather widget
 * hydrating after that was hydrated against `F` while its server HTML said `C`, and React logged
 * the subtree and patched nothing. Static classes cannot mismatch, and the pre-paint attribute
 * has the answer before the first frame.
 *
 * For the same reason the click reads the attribute rather than the context: whatever the CSS is
 * currently showing is what the reader is looking at, so flipping that is always the right move,
 * with no render state to be stale.
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
        // Height and border are the theme switch's (`h-7`, same ring, same muted fill): the two
        // sit 4 px apart and read as one pair of preferences. The button scale's 44 px phone tier
        // is cancelled here like it is for the locale switcher, the search trigger and the
        // burger — the bar is `h-12` and 44 in 48 is the mistake that requirement exists to
        // prevent. This is the fourth and, unless the bar grows, the last opt-out.
        'border-border/60 bg-muted/60 text-muted-foreground inline-flex h-7 shrink-0 items-center',
        'justify-center rounded-full border px-2 text-[11px] font-medium max-sm:px-1.5',
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
