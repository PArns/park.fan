'use client';

import { Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useMostRead } from '@/lib/hooks/use-most-read';
import { mostReadList, type MostReadKind } from '@/lib/blog/most-read-config';
import { useMounted } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';

/**
 * „Meistgelesen" on the one article and the one news post at the top of this locale's ranking,
 * wherever that post is listed, and on its own page. Nothing for every other post, and nothing until
 * the ranking has arrived after load, so the caller lays it over a cover or puts it on a line that
 * already exists: its arrival must not move anything. `icon` is for a cover too small for the word,
 * `auto` for a cover that is too small on a phone only.
 */
export function MostReadBadge({
  kind,
  postKey,
  variant = 'label',
  className,
}: {
  kind: MostReadKind;
  /** The post's `translationKey`. */
  postKey: string;
  variant?: 'label' | 'icon' | 'auto';
  className?: string;
}) {
  const t = useTranslations('navigation');
  const { data } = useMostRead(useAfterLoad());
  // Hydrated late, the ranking may already be in the shared cache; the server drew no badge.
  const mounted = useMounted();
  if (!mounted || mostReadList(data, kind)[0]?.key !== postKey) return null;

  const label = t('mostReadBadge');
  return (
    <span
      title={variant === 'icon' ? label : undefined}
      className={cn(
        'bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full text-[10px] font-bold tracking-[0.06em] uppercase shadow-sm transition-opacity duration-300 starting:opacity-0',
        variant === 'label' && 'px-2 py-0.5',
        variant === 'icon' && 'p-1',
        variant === 'auto' && 'p-1 sm:px-2 sm:py-0.5',
        className
      )}
    >
      <Flame className="size-3" aria-hidden="true" />
      {variant === 'label' ? (
        label
      ) : (
        <span className={variant === 'auto' ? 'sr-only sm:not-sr-only' : 'sr-only'}>{label}</span>
      )}
    </span>
  );
}
