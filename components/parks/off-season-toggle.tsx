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
}

/**
 * Glass "N off season" toggle button next to a section heading — reveals/hides
 * off-season attractions or shows. Only rendered when `count > 0` (callers guard).
 */
export function OffSeasonToggle({ count, shown, onToggle }: OffSeasonToggleProps) {
  const t = useTranslations('parks');

  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md transition-colors',
        shown
          ? 'border-primary/30 bg-primary/15 text-primary dark:bg-primary/10'
          : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground dark:bg-[oklch(0.12_0.025_241_/_0.55)]'
      )}
    >
      {shown ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {t('offSeasonCount', { count })}
    </button>
  );
}
