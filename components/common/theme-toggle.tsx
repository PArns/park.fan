'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { runThemeWipe } from '@/lib/theme/theme-wipe';
import { trackThemeToggled } from '@/lib/analytics/umami';
import { cn } from '@/lib/utils';

/**
 * Dark ⇄ light, as a switch.
 *
 * park.fan is a **dark site**: dark is the default for everyone, on every device, and light is
 * something a visitor opts into. There is therefore no "system" option any more — following the
 * OS would mean the site is dark for some visitors and light for others by accident, which is
 * the opposite of a default. Anyone whose browser still remembers `system` from the old
 * three-way menu is moved to dark on their next visit (see the effect below).
 *
 * Motion is split the same way it is everywhere else in this codebase:
 *
 * - **CSS owns the state.** The knob's position is a class, transitioned in CSS. If the GSAP
 *   chunk never loads, the switch still visibly switches.
 * - **GSAP owns the flourish.** The icon spins through the change, and the new theme opens out
 *   of the switch as a disc that covers the page before the colours flip (`runThemeWipe`). Both
 *   are loaded on the click that needs them — nobody who never touches the switch pays for it.
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const t = useTranslations('theme');
  const [mounted, setMounted] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  // One-time migration off the retired three-way menu. `system` is no longer one of the themes,
  // so a browser still holding it would resolve to nothing sensible; dark is the new default.
  useEffect(() => {
    if (!mounted || theme !== 'system') return;
    setTheme('dark');
    // next-themes wrote `system` onto <html> as if it were a theme name before this ran, and
    // adding `dark` does not take it back off.
    document.documentElement.classList.remove('system');
  }, [mounted, theme, setTheme]);

  const isDark = resolvedTheme !== 'light';

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? 'light' : 'dark';
    const box = event.currentTarget.getBoundingClientRect();

    // The icon spins out and back while the disc travels. Purely decorative, so it is fire and
    // forget: no await, no state, and a failed import leaves an icon that simply swaps.
    const icon = iconRef.current;
    if (icon && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      import('gsap')
        .then(({ gsap }) => {
          gsap.fromTo(
            icon,
            { rotate: 0, scale: 1 },
            {
              rotate: next === 'dark' ? -180 : 180,
              scale: 0.4,
              duration: 0.22,
              ease: 'power2.in',
              onComplete: () =>
                gsap.fromTo(
                  icon,
                  { rotate: next === 'dark' ? 180 : -180, scale: 0.4 },
                  { rotate: 0, scale: 1, duration: 0.34, ease: 'back.out(2)', clearProps: 'all' }
                ),
            }
          );
        })
        .catch(() => {
          // The icon still changes with the theme; there is nothing to recover.
        });
    }

    void runThemeWipe({ x: box.left + box.width / 2, y: box.top + box.height / 2 }, next, () => {
      setTheme(next);
      trackThemeToggled(next);
    });
  };

  return (
    <button
      type="button"
      role="switch"
      // Before mount there is no answer yet — `false` would announce "light" on a dark page.
      aria-checked={mounted ? !isDark : undefined}
      // Named for what switching it ON does, which is what `aria-checked` then reports: "Hell,
      // switch, off" on a dark page. `theme.toggle` would leave "checked" meaning nothing.
      aria-label={t('light')}
      title={t('toggle')}
      onClick={toggle}
      className={cn(
        'border-border/60 bg-muted/60 relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border',
        'hover:border-primary/50 focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none'
      )}
    >
      {/* The knob. `left`, not a translate: Tailwind compiles `translate-x-*` to the standalone
          `translate` property, and the icon inside is tweened with `transform` — keeping the two
          on separate properties is what stops them composing into a double offset. */}
      <span
        className={cn(
          'bg-background absolute top-1/2 flex h-5.5 w-5.5 -translate-y-1/2 items-center justify-center rounded-full shadow-sm',
          'transition-[left] duration-300 ease-out motion-reduce:transition-none',
          mounted && !isDark ? 'left-[calc(100%-1.5rem)]' : 'left-[0.125rem]'
        )}
      >
        <span ref={iconRef} className="flex items-center justify-center">
          {mounted ? (
            isDark ? (
              <Moon className="size-3 shrink-0" />
            ) : (
              <Sun className="size-3 shrink-0" />
            )
          ) : (
            <span className="size-3" />
          )}
        </span>
      </span>
    </button>
  );
}
