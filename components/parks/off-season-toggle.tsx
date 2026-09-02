'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FilterToggle } from '@/components/parks/filter-toggle';

interface OffSeasonToggleProps {
  /** Number of hidden off-season items (attractions or shows). */
  count: number;
  /** Whether off-season items are currently revealed. */
  shown: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

/**
 * Glass "N off season" toggle — reveals/hides off-season attractions or shows.
 * Only rendered when `count > 0` (callers guard).
 *
 * The odd one out among the panel's three pills, and deliberately: the other two
 * narrow the list, this one widens it, which is why it is the only one whose icon
 * is an eye rather than the thing it filters for.
 */
export function OffSeasonToggle({ count, shown, onToggle, size = 'sm' }: OffSeasonToggleProps) {
  const t = useTranslations('parks');

  return (
    <FilterToggle
      icon={EyeOff}
      activeIcon={Eye}
      label={t('offSeasonCount', { count })}
      pressed={shown}
      onToggle={onToggle}
      size={size}
    />
  );
}
