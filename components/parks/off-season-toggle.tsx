'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface OffSeasonToggleProps {
  /** Number of hidden off-season items (attractions or shows). */
  count: number;
  /** Whether off-season items are currently revealed. */
  shown: boolean;
  onToggle: () => void;
  /**
   * `sm` is the loose control the shows tab still puts above its grid.
   *
   * `md` is the filter panel's, where this sits in a cell of its own beside the
   * search box and the height slider: it takes the `h-9` those two resolve to,
   * because three controls in one row that are three different heights read as
   * three things that happen to be near each other.
   */
  size?: 'sm' | 'md';
}

/**
 * Glass "N off season" toggle button — reveals/hides off-season attractions or
 * shows. Only rendered when `count > 0` (callers guard).
 */
export function OffSeasonToggle({ count, shown, onToggle, size = 'sm' }: OffSeasonToggleProps) {
  const t = useTranslations('parks');

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={shown}
      className={cn(
        'flex items-center rounded-md border text-xs shadow-md backdrop-blur-md transition-colors',
        size === 'md' ? 'h-9 gap-2 px-3' : 'gap-1.5 px-2 py-1',
        shown
          ? 'border-primary/30 bg-primary/15 text-primary dark:bg-primary/10'
          : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground dark:bg-[oklch(0.12_0.025_241_/_0.55)]'
      )}
    >
      {shown ? (
        <Eye className={size === 'md' ? 'h-4 w-4' : 'h-3 w-3'} />
      ) : (
        <EyeOff className={size === 'md' ? 'h-4 w-4' : 'h-3 w-3'} />
      )}
      {t('offSeasonCount', { count })}
    </button>
  );
}
