'use client';

import { memo } from 'react';
import { PlannerFlyout } from './planner-flyout';

/**
 * The panel, on the far side of the lazy-message import: `planner-launcher` is a boundary, and the
 * generator counts a boundary's own `useTranslations` calls, so everything that reads `planner`
 * sits in this file. `memo`, because the launcher re-renders for things the panel does not draw,
 * and these props change exactly when the panel has something new to show.
 */
export const PlannerFlyoutHost = memo(function PlannerFlyoutHost({
  open,
  onOpenChange,
  askingPastDay,
  onAskingPastDayChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  askingPastDay: boolean;
  onAskingPastDayChange: (asking: boolean) => void;
}) {
  return (
    <PlannerFlyout
      open={open}
      onOpenChange={onOpenChange}
      askingPastDay={askingPastDay}
      onAskingPastDayChange={onAskingPastDayChange}
    />
  );
});
