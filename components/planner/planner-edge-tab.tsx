'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PANEL_WIDTH_DEFAULT, clampPanelWidth, plannerPanelWidth } from '@/lib/planner/panel-width';

/**
 * The planner's tab, on the right edge of the window.
 *
 * It replaces the floating pill in the corner and it is one control doing two
 * jobs, which is the point rather than a compromise: closed it is the way in,
 * open it is the panel's own edge and drags to resize. A separate launcher and a
 * separate resize grip were two objects for one relationship, and the launcher
 * had the worse half of it — a panel that slides out from the right edge, opened
 * by a button in the bottom corner it has nothing to do with.
 *
 * **It reads `navigation` and nothing else, and that is load-bearing.** The
 * planner's own namespace is fetched lazily (see `planner-launcher.tsx`), so a
 * control that renders on every page before that chunk exists may only use what
 * the layout chrome already carries. `navigation.planner` is the word the
 * header, the footer and the parks menu all print, so it costs zero bytes here
 * and is by construction the same label. Anything from `planner` would render as
 * a raw key on every page of the site until somebody opened the panel.
 *
 * Two geometry decisions. The `right` offset is the panel's own width while it
 * is open, so the tab travels with the panel instead of being covered by it —
 * animated to match the sheet's own 500 ms opening and 300 ms close, and with
 * the transition switched OFF during a resize drag, where it has to sit under
 * the pointer rather than chase it. And the vertical centring is a full-height
 * wrapper with `items-center` rather than a `-translate-y-1/2`: a transform on
 * an element with a `backdrop-filter` makes it a backdrop root and flattens its
 * own blur, and the label's height varies by locale so a fixed margin cannot do
 * the job either.
 *
 * On a phone it disappears while the panel is open: there the panel is a modal
 * bottom sheet with a grab handle of its own, and a tab clinging to the right
 * edge would be a second handle for the same object, over the overlay.
 */
export function PlannerEdgeTab({
  open,
  total,
  onToggle,
  panelWidth,
}: {
  open: boolean;
  /** Entries in the plan. No badge at zero — see below. */
  total: number;
  onToggle: () => void;
  panelWidth: number;
}) {
  const t = useTranslations('navigation');
  const [dragging, setDragging] = useState(false);

  /**
   * Dragging the tab sideways resizes the panel.
   *
   * Live rather than committed on release: there is one meaning and one axis
   * here, so the panel follows the pointer and the width is written down once,
   * at the end. A drag ALWAYS ends in a click, so the gesture records whether it
   * moved and the click handler reads that — otherwise every resize would be
   * undone by the click that followed it.
   */
  const startResize = (event: React.PointerEvent<HTMLElement>) => {
    if (!open || event.button !== 0) return;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = panelWidth;
    let moved = false;
    // The panel is anchored right, so a drag to the LEFT makes it wider.
    const widthAt = (clientX: number) => clampPanelWidth(startWidth + (startX - clientX));

    const onMove = (moveEvent: PointerEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > TAP_SLOP_PX) moved = true;
      if (moved) plannerPanelWidth.preview(widthAt(moveEvent.clientX));
    };
    const onUp = (upEvent: PointerEvent) => {
      if (moved) {
        plannerPanelWidth.commit(widthAt(upEvent.clientX));
        // Swallow the click this drag is about to produce.
        handle.addEventListener('click', (click) => click.stopPropagation(), { once: true });
      }
      detach();
    };
    const detach = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', detach);
      try {
        handle.releasePointerCapture(event.pointerId);
      } catch {
        // Already released — a cancelled gesture, or the element unmounted.
      }
      document.documentElement.style.removeProperty('--planner-inset-ms');
      setDragging(false);
    };
    setDragging(true);
    // The page beside the panel animates its inset over 300 ms, which is right
    // for an open and wrong under a pointer. Zero for the length of the drag.
    document.documentElement.style.setProperty('--planner-inset-ms', '0ms');
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', detach);
  };

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-y-0 z-[60] flex items-center',
        open && 'max-sm:hidden',
        // One clock for the three things that move together — the panel, the
        // page's inset and this tab. See the note in `components/ui/sheet.tsx`.
        !dragging && 'transition-[right] duration-300 ease-in-out'
      )}
      // Above `sm` the panel is a side sheet of exactly this width, so this puts
      // the tab against its edge. Below `sm` it is a bottom sheet and the tab is
      // hidden while open, so the offset is never seen there.
      style={{ right: open ? panelWidth : 0 }}
    >
      <button
        type="button"
        /* `detail > 1` is the SECOND click of a double-click, and it is skipped
           because the button carries a double-click gesture of its own (reset
           the width, below). Without this a double-click toggled the panel
           twice — closed and reopened it — which reset `showOverview` and the
           sheet's phone height as a side effect and billed a `planner_opened`
           for an opening nobody performed. */
        onClick={(event) => {
          if (event.detail > 1) return;
          onToggle();
        }}
        onPointerDown={startResize}
        onDoubleClick={() => open && plannerPanelWidth.commit(PANEL_WIDTH_DEFAULT)}
        aria-expanded={open}
        data-planner-edge-tab=""
        data-planner-resize-edge={open ? '' : undefined}
        className={cn(
          // Blue, and solid enough to be the loudest thing at the edge: this is
          // the one control that opens the feature, and a glass tab over a park
          // photo read as another panel edge rather than as a way in.
          //
          // `pr-2.5` is clearance, not padding taste: the tab sits at `right: 0`
          // when the panel is closed, which is where the page's own scrollbar
          // is, and at `pr-1` the word ran under it.
          'bg-primary text-primary-foreground ring-primary-foreground/25 pointer-events-auto flex flex-col items-center gap-2 rounded-l-xl py-4 pr-2.5 pl-2 shadow-lg ring-1',
          // A tier below `sm`, because this tab is drawn on EVERY page and on a
          // phone it is a permanent strip down the right edge: 34 × 130 px in
          // German, 136 in French, against a 390 px screen. Everything here is
          // one step down — the padding, the gaps, the icon and the word — for
          // a tab that still says what it is. It is deliberately not reduced to
          // the icon alone, which would halve it again and turn the one control
          // that opens the feature into a glyph nobody has seen before.
          'max-sm:gap-1 max-sm:py-2.5 max-sm:pr-2 max-sm:pl-1.5',
          'supports-[backdrop-filter]:bg-primary/90 backdrop-blur-md',
          'hover:bg-primary/95 transition-colors',
          open ? 'cursor-col-resize touch-none' : 'cursor-pointer'
        )}
      >
        <CalendarPlus className="size-4 shrink-0 max-sm:size-3.5" aria-hidden="true" />
        {/* `vertical-rl` plus a half turn, which is the pair that reads
            bottom-to-top — `vertical-rl` alone runs top-to-bottom and puts the
            first letter under the icon rather than beside the panel it names.
            This is also the button's accessible name, so there is no
            `aria-label` duplicating it. */}
        <span className="[transform:rotate(180deg)] text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase [writing-mode:vertical-rl] max-sm:text-[9px] max-sm:tracking-normal">
          {t('planner')}
        </span>
        {/* No badge at zero: opened from the calendar there is nothing planned
            yet, and a "0" beside the label reads as a count that failed. */}
        {total > 0 && (
          <span className="bg-primary-foreground/20 rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums max-sm:px-1 max-sm:text-[10px]">
            {total}
          </span>
        )}
        {/* Only while it is open, because only then is there anything to drag.
            Drawn when closed it would promise a gesture that does nothing. */}
        {open && (
          <GripVertical
            className="text-primary-foreground/70 size-4 shrink-0 max-sm:size-3.5"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}

/** Past this a press is a drag, and the click it ends in is swallowed. */
const TAP_SLOP_PX = 3;
