'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMenuBandOverEdgeTab } from '@/lib/hooks/use-menu-band-over-edge-tab';
import { PANEL_WIDTH_DEFAULT, clampPanelWidth, plannerPanelWidth } from '@/lib/planner/panel-width';
import { capturePointer, isSamePointer, releasePointer } from '@/lib/planner/pointer-capture';

/**
 * The planner's tab on the right edge of the window: closed it is the way in, open it is the
 * panel's own edge and drags to resize.
 *
 * It reads only `navigation`: the `planner` namespace is fetched lazily (see
 * `planner-launcher.tsx`), and a key from it would render raw on every page until the panel opens.
 * Vertical centring uses a full-height `items-center` wrapper, because a transform on an element
 * with `backdrop-filter` flattens its blur. Not drawn on a phone, where `PlannerHeaderButton` is
 * the way in.
 */
export function PlannerEdgeTab({
  open,
  total,
  onToggle,
}: {
  open: boolean;
  /** Entries in the plan. No badge at zero — see below. */
  total: number;
  onToggle: () => void;
}) {
  const t = useTranslations('navigation');
  /**
   * The panel's width, read here rather than passed down by the launcher, so a resize drag
   * re-renders this tab and not the whole panel the launcher draws.
   */
  const panelWidth = useSyncExternalStore(
    plannerPanelWidth.subscribe,
    plannerPanelWidth.getSnapshot,
    plannerPanelWidth.getServerSnapshot
  );
  const bandOverTab = useMenuBandOverEdgeTab();
  const [dragging, setDragging] = useState(false);
  /**
   * Tear-down for a resize that is still running: {@link capturePointer} may put the listeners on
   * the `document`, where they would outlive the tab and keep `--planner-inset-ms` at `0ms`.
   */
  const liveResize = useRef<(() => void) | null>(null);
  useEffect(() => () => liveResize.current?.(), []);

  /**
   * Dragging the tab sideways resizes the panel live, and the width is committed once at the end. A
   * drag always ends in a click, so the gesture records whether it moved and the click is
   * swallowed.
   */
  const startResize = (event: React.PointerEvent<HTMLElement>) => {
    if (!open || event.button !== 0) return;
    const handle = event.currentTarget;
    const pointerId = event.pointerId;
    // `setPointerCapture` throws for a pointer id that is no longer active, which would abort the
    // gesture before it starts. See {@link capturePointer} for the fallback.
    const bus = capturePointer(handle, pointerId);
    const startX = event.clientX;
    const startWidth = panelWidth;
    let moved = false;
    // The panel is anchored right, so a drag to the LEFT makes it wider.
    const widthAt = (clientX: number) => clampPanelWidth(startWidth + (startX - clientX));

    const onMove = (moveEvent: PointerEvent) => {
      // This gesture's own pointer: on the document fallback every pointer on the page arrives.
      if (!isSamePointer(moveEvent, pointerId)) return;
      if (Math.abs(moveEvent.clientX - startX) > TAP_SLOP_PX) moved = true;
      if (moved) plannerPanelWidth.preview(widthAt(moveEvent.clientX));
    };
    const onUp = (upEvent: PointerEvent) => {
      if (!isSamePointer(upEvent, pointerId)) return;
      if (moved) {
        plannerPanelWidth.commit(widthAt(upEvent.clientX));
        // Swallow the click this drag is about to produce.
        handle.addEventListener('click', (click) => click.stopPropagation(), { once: true });
      }
      detach();
    };
    const onCancel = (cancelEvent: PointerEvent) => {
      if (!isSamePointer(cancelEvent, pointerId)) return;
      detach();
    };
    const detach = () => {
      bus.removeEventListener('pointermove', onMove as EventListener);
      bus.removeEventListener('pointerup', onUp as EventListener);
      bus.removeEventListener('pointercancel', onCancel as EventListener);
      releasePointer(handle, pointerId);
      document.documentElement.style.removeProperty('--planner-inset-ms');
      setDragging(false);
      if (liveResize.current === detach) liveResize.current = null;
    };
    liveResize.current?.();
    liveResize.current = detach;
    setDragging(true);
    // The page's inset animates over 300 ms, which is wrong under a pointer: zero while dragging.
    document.documentElement.style.setProperty('--planner-inset-ms', '0ms');
    bus.addEventListener('pointermove', onMove as EventListener);
    bus.addEventListener('pointerup', onUp as EventListener);
    bus.addEventListener('pointercancel', onCancel as EventListener);
  };

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-y-0 z-[60] flex items-center',
        // `planner-phone:hidden`, not `max-sm:hidden`: whether the panel is a bottom sheet is no
        // longer a question about width, and on a landscape phone the tab would sit behind the
        // sheet. Hidden while closed too, where `PlannerHeaderButton` is the way in; it asks the
        // same variant, so exactly one of the two exists at any size.
        'planner-phone:hidden',
        // One clock for the panel, the page's inset and this tab. See `components/ui/sheet.tsx`.
        !dragging && 'transition-[right,opacity,visibility] duration-300 ease-in-out',
        // A header menu band whose column runs under this tab is open: fade and `invisible` rather
        // than unmount, so it fades back and is no focus stop meanwhile. Never mid-drag.
        bandOverTab && !dragging && 'invisible opacity-0'
      )}
      // On the wide arrangement this puts the tab against the side sheet's edge.
      style={{ right: open ? panelWidth : 0 }}
    >
      <button
        type="button"
        /* `detail > 1` is the second click of a double-click, which has its own gesture (reset the
           width); without this a double-click would close and reopen the panel. */
        onClick={(event) => {
          if (event.detail > 1) return;
          onToggle();
        }}
        onPointerDown={startResize}
        onDoubleClick={() => open && plannerPanelWidth.commit(PANEL_WIDTH_DEFAULT)}
        aria-expanded={open}
        data-planner-edge-tab=""
        data-planner-launcher=""
        data-planner-resize-edge={open ? '' : undefined}
        className={cn(
          // Blue and solid, the loudest thing at the edge: it is the feature's way in. The width is
          // padding plus the widest child, so the badge is no wider than the icon. `pr-2` clears
          // the page's scrollbar at `right: 0`.
          'bg-primary text-primary-foreground ring-primary-foreground/25 pointer-events-auto flex flex-col items-center gap-2 rounded-l-xl py-4 pr-2 pl-1.5 shadow-lg ring-1',
          'supports-[backdrop-filter]:bg-primary/90 backdrop-blur-md',
          'hover:bg-primary/95 transition-colors',
          open ? 'cursor-col-resize touch-none' : 'cursor-pointer'
        )}
      >
        <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
        {/* `vertical-rl` plus a half turn reads bottom-to-top. Also the button's accessible name,
            so no `aria-label`. */}
        <span className="[transform:rotate(180deg)] text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase [writing-mode:vertical-rl]">
          {t('planner')}
        </span>
        {/* No badge at zero: a "0" beside the label reads as a count that failed. */}
        {total > 0 && (
          /* A circle the size of the icon, so the badge does not widen the tab; `min-w-*` so a
             three-digit total still fits. */
          <span className="bg-primary-foreground/20 flex min-w-4 items-center justify-center rounded-full px-0.5 py-0.5 font-mono text-[10px] tabular-nums">
            {total}
          </span>
        )}
        {/* Only while open, the only time there is anything to drag. */}
        {open && (
          <GripVertical className="text-primary-foreground/70 size-4 shrink-0" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/** Past this a press is a drag, and the click it ends in is swallowed. */
const TAP_SLOP_PX = 3;
