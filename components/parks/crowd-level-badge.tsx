import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CrowdLevel } from '@/lib/api/types';
import { CROWD_BADGE_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { CrowdLevelScaleTooltip } from './crowd-level-scale-tooltip';

import { User, Users, AlertCircle, Ban, HelpCircle } from 'lucide-react';

const crowdLevelConfig: Record<string, { colorClass: string; Icon: typeof User }> = {
  very_low: { colorClass: CROWD_BADGE_CLASS.very_low, Icon: User },
  low: { colorClass: CROWD_BADGE_CLASS.low, Icon: User },
  moderate: { colorClass: CROWD_BADGE_CLASS.moderate, Icon: Users },
  high: { colorClass: CROWD_BADGE_CLASS.high, Icon: Users },
  very_high: { colorClass: CROWD_BADGE_CLASS.very_high, Icon: Users },
  extreme: { colorClass: CROWD_BADGE_CLASS.extreme, Icon: AlertCircle },
  closed: { colorClass: 'badge-status-closed', Icon: Ban },
  // Neutral "no forecast": park not ratable yet (< 30 operating days of data).
  unknown: { colorClass: 'bg-slate-400 dark:bg-slate-600', Icon: HelpCircle },
};

interface CrowdLevelBadgeProps {
  // `'closed'` is accepted too — calendar days can be closed, and the config below
  // renders it as a distinct "closed" chip (used e.g. in the header forecast panel).
  level: CrowdLevel | 'closed' | null | undefined;
  showLabel?: boolean;
  className?: string;
  /**
   * Wrap the badge in the crowd-scale tooltip (hover on a pointer, tap on a phone).
   *
   * Off by default: most badges sit inside a link or a button already, and a tooltip trigger is
   * itself a `<button>`. Opt in where nothing interactive encloses the badge, and keep
   * `showLabel`, because the label is what names the button.
   */
  withScale?: boolean;
}

/**
 * Badge for a crowd level (very low to extreme, plus `closed` and `unknown`), with a colour and an
 * icon per tier. Renders nothing without a level; `withScale` wraps it in the crowd-scale tooltip.
 */
export function CrowdLevelBadge({
  level,
  showLabel = true,
  className,
  withScale = false,
}: CrowdLevelBadgeProps) {
  const t = useTranslations('parks.crowdLevels');

  if (!level) return null;

  const config = crowdLevelConfig[level] || { colorClass: 'bg-muted' };

  const badge = (
    <Badge className={cn(config.colorClass, className)}>
      {config.Icon && <config.Icon className="h-3 w-3 text-white" />}
      {showLabel ? t(level) : null}
    </Badge>
  );

  if (!withScale) return badge;

  // `closed` and `unknown` are not tiers of the scale, so neither highlights a row —
  // the six-step ruler is still what explains the badge next to them.
  return (
    <CrowdLevelScaleTooltip level={isColoredCrowdLevel(level) ? level : null}>
      {badge}
    </CrowdLevelScaleTooltip>
  );
}
