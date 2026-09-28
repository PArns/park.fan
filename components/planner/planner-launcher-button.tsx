'use client';

import { memo } from 'react';
import { PlannerFlyout } from './planner-flyout';

/**
 * The panel, on the far side of the lazy-message import.
 *
 * Its own file, and that is structural rather than tidiness. `planner-launcher`
 * is a lazy message boundary, and the generator counts a boundary's OWN
 * `useTranslations` calls while stopping the walk at its imports — so a boundary
 * that reads the namespace itself puts it straight back into the layout chrome
 * of every page. Everything that reads `planner` therefore sits on this side of
 * the import.
 *
 * It used to hold the floating button as well, which is where the name comes
 * from. The way in is `PlannerEdgeTab` now, and that one is deliberately on the
 * OTHER side of this boundary: it is drawn on every page, so it may only read
 * what the chrome already carries.
 *
 * `memo`, because the launcher re-renders for things the panel does not draw —
 * the plan's count on the tab, an open request it answers by setting `open` —
 * and its four props are two booleans and two `useState` setters, so they
 * change exactly when the panel has something new to show. The panel reads the
 * plan and its other stores itself.
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
