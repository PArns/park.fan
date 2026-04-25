'use client';

import { useState, useEffect, startTransition } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trackThemeToggled } from '@/lib/analytics/umami';

export function ThemeToggle() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const t = useTranslations('theme');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  const isDark = resolvedTheme === 'dark';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          {mounted ? (
            isDark ? (
              <Moon className="size-3.5 shrink-0" />
            ) : (
              <Sun className="size-3.5 shrink-0" />
            )
          ) : (
            <span className="size-3.5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            setTheme('light');
            trackThemeToggled('light');
          }}
          className="flex items-center gap-2"
        >
          <Sun className="size-4 shrink-0" />
          {t('light')}
          {theme === 'light' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme('dark');
            trackThemeToggled('dark');
          }}
          className="flex items-center gap-2"
        >
          <Moon className="size-4 shrink-0" />
          {t('dark')}
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme('system');
            trackThemeToggled('system');
          }}
          className="flex items-center gap-2"
        >
          <Monitor className="size-4 shrink-0" />
          {t('system')}
          {theme === 'system' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
