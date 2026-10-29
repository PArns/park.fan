'use client';

import { Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useMostRead } from '@/lib/hooks/use-most-read';
import { mostReadLeader, type MostReadKind } from '@/lib/blog/most-read-config';
import { cn } from '@/lib/utils';

/**
 * „Meistgelesen" on the one article and the one news post that clearly lead this locale's ranking
 * (`mostReadLeader`), wherever that post is listed, and on its own page. Nothing for every other
 * post, and nothing until the ranking has arrived after load, so the caller lays it over a cover
 * or positions it out of the flow: its arrival must not move anything. `icon` is for a cover too
 * small for the word, `auto` for one that is too small on a phone only.
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
  if (mostReadLeader(data, kind) !== postKey) return null;

  const label = t('mostReadBadge');
  return (
    <Badge
      variant="default"
      title={variant === 'icon' ? label : undefined}
      className={cn(
        'text-[10px] leading-none font-bold tracking-[0.06em] uppercase shadow-sm transition-opacity duration-300 starting:opacity-0',
        // An icon alone stays in the middle of its circle.
        variant === 'icon' && 'badge-icon:ml-0 p-1',
        variant === 'auto' && 'badge-icon:ml-0 sm:badge-icon:-ml-1 p-1 sm:px-2 sm:py-0.5',
        className
      )}
    >
      <Flame aria-hidden="true" />
      {variant === 'label' ? (
        label
      ) : (
        <span className={variant === 'auto' ? 'sr-only sm:not-sr-only' : 'sr-only'}>{label}</span>
      )}
    </Badge>
  );
}
