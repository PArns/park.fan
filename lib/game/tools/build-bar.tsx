'use client';

/**
 * The build bar: the HUD half of this module, in the Moulded skin.
 *
 * Built from the site's own design system — `@/components/ui/button`, `@/components/ui/tooltip`,
 * `cn()` and Lucide — over the materials in `lib/game/ui/surface.ts` (`raise()`, `SINK`, `TRAY`,
 * `TAB_TROUGH`), which are the only place allowed to decide what a raised control or a recessed
 * readout is made of. No second component library, no hand-rolled button and no local copy of the
 * skin: a material that exists twice is a material that will differ.
 *
 * **The bar renders the palette, and the palette is the registry.** There is no list of things in
 * this file: `api.palette()` returns one group per entity kind with whatever the registered packs
 * declared, and the labels come from the manifests' own localized names. A pack that adds a bench
 * appears here with no change to this file — including its group, if the bench brings a new kind
 * with it, in which case the label falls back to the kind's own id rather than going missing.
 *
 * ## Two objects, not one wrapping row
 *
 * Six category tabs plus a toolbelt is about 1140 px of content, and as one wrapping row it clipped
 * at 1024. It is a BUILD TRAY (the palette, with its tab strip along the bottom edge) and a
 * TOOLBELT under it, which also gives the tab metaphor something honest to do: a category belongs
 * to the palette and a tool does not.
 *
 * ## Raised means you can press it, sunk means it is telling you something
 *
 * The cost readout is a groove. The picture well is a groove. Everything else in here is a key. A
 * reader can tell a control from a readout in this bar before reading either, which is what the
 * flat version did not allow.
 *
 * ## `--game-accent` is ON, `--game-accent-2` is ARMED, and they never mean the same thing
 *
 * Blue is a state that persists: the active tool, snap, the open tab, the chosen tile. Cyan is what
 * the next click on the park does, and there is exactly one of it on screen — on the active tool
 * key, or, while placing, on the chosen tile, which then carries both. The cost readout's figure
 * takes the second accent too, because it names what that armed action costs.
 *
 * **It re-renders when the state it draws changes, not when the mouse moves.** `api.subscribe()`
 * only fires when the digest in `main.ts` changes, so hovering the ghost across a park at 60 Hz is
 * zero React renders until the validity flips.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Box,
  CupSoda,
  FerrisWheel,
  Grid3x3,
  Home,
  MousePointer2,
  Move,
  Redo2,
  RotateCcw,
  RotateCw,
  TrainFront,
  Trash2,
  TreePine,
  Undo2,
  Waves,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { GameHandle } from '../core/host';
import type { GameLocale, GameStringKey, Translate } from '../i18n';
import {
  BELT_RULE,
  MICRO_LABEL,
  SINK,
  SINK_STAGE,
  TAB_ACTIVE,
  TAB_TROUGH,
  TRAY,
  raise,
} from '../ui/surface';
import type { ToolsMainApi } from './main';
import type { PaletteGroup, PaletteItem, PlacementReason, ToolId, ToolsState } from './types';

export interface BuildBarProps {
  t: Translate;
  locale: GameLocale;
  getHandle: () => GameHandle | null;
}

/**
 * Icon per entity kind. A kind nobody anticipated gets the box, and still works.
 *
 * This is the tab's icon and the item tile's LAST RESORT. A tile draws a render of the thing it
 * places; the kind icon is what stands on the stage while that render is queued, and what stays
 * there for the kinds nothing can draw yet — a coaster and a flume are `route` items with no
 * `procedural` in the manifest, so there is no geometry to photograph until the track tool can
 * hand over a layout.
 */
const KIND_ICONS: Record<string, typeof Box> = {
  scenery: TreePine,
  shop: CupSoda,
  ride: FerrisWheel,
  coaster: TrainFront,
  flume: Waves,
  building: Home,
};

const TOOL_ICONS: Record<ToolId, typeof Box> = {
  select: MousePointer2,
  place: Box,
  move: Move,
  delete: Trash2,
};

const REASON_KEYS: Record<PlacementReason, GameStringKey> = {
  'out-of-bounds': 'tools.reason.outOfBounds' as GameStringKey,
  'under-water': 'tools.reason.underWater' as GameStringKey,
  'too-steep': 'tools.reason.tooSteep' as GameStringKey,
  overlap: 'tools.reason.overlap' as GameStringKey,
  'no-ground': 'tools.reason.noGround' as GameStringKey,
  unavailable: 'tools.reason.unavailable' as GameStringKey,
  route: 'tools.reason.route' as GameStringKey,
};

/** Both objects are the same width, and it is the width the tab strip was measured at. */
const BAR_WIDTH = 'w-[min(64rem,100%)]';

export function BuildBar({ t, locale, getHandle }: BuildBarProps) {
  const api = useToolsApi(getHandle);
  const state = useToolsState(api);
  const [openKind, setOpenKind] = useState<string | null>(null);

  if (!api || !state) return null;
  const groups = api.palette();
  if (groups.length === 0) return null;

  const activeItem = state.itemKey
    ? (groups.flatMap((g) => g.items).find((i) => i.key === state.itemKey) ?? null)
    : null;
  // The open tab, in order of who has an opinion: the player, then whatever they last armed, then
  // the first group the registry offered. There is always one — a palette with no open category is
  // a tray with a hole in it.
  const openGroup =
    groups.find((g) => g.kind === openKind) ??
    groups.find((g) => g.kind === activeItem?.kind) ??
    groups[0];

  return (
    <div className="pointer-events-auto flex w-full flex-col items-center gap-2" data-build-bar="">
      <StatusLine t={t} locale={locale} state={state} item={activeItem} />
      <BuildTray
        api={api}
        groups={groups}
        group={openGroup}
        t={t}
        locale={locale}
        state={state}
        onOpen={setOpenKind}
      />
      <Toolbelt api={api} state={state} t={t} locale={locale} item={activeItem} />
    </div>
  );
}

// ── the build tray ───────────────────────────────────────────────────────────────────────────

function BuildTray({
  api,
  groups,
  group,
  t,
  locale,
  state,
  onOpen,
}: {
  api: ToolsMainApi;
  groups: PaletteGroup[];
  group: PaletteGroup;
  t: Translate;
  locale: GameLocale;
  state: ToolsState;
  onOpen: (kind: string) => void;
}) {
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  // Tell the studio what is on screen, after the tiles have asked for it — children's effects run
  // before the parent's, so by the time this fires the whole open group is in the queue and this
  // is a reorder rather than a race.
  const keys = group.items.map((item) => item.key).join(' ');
  useEffect(() => {
    api.focusThumbnails(keys.split(' '));
  }, [api, keys]);
  return (
    <section
      className={cn(TRAY, BAR_WIDTH, 'overflow-hidden px-[10px] pt-[10px]')}
      data-build-tray={group.kind}
    >
      <div className="flex items-baseline justify-between gap-3 px-0.5 pb-2">
        <h2 className="text-[13px] font-bold text-white/95 [text-shadow:var(--game-engrave)]">
          {groupLabel(group.kind, t)}
        </h2>
        <span className={cn(MICRO_LABEL, 'truncate')}>
          {t('tools.palette.count', { n: total })}
        </span>
      </div>

      {/* Capped and scrolling: at 720 px tall that is two rows and a peek, which is what keeps the
          cluster off the screen's throat. */}
      <div className="grid max-h-[min(38vh,320px)] grid-cols-1 gap-2 overflow-y-auto pb-[10px] sm:grid-cols-5">
        {group.items.map((item) => (
          <ItemTile
            key={item.key}
            api={api}
            item={item}
            locale={locale}
            t={t}
            selected={state.itemKey === item.key}
            placing={state.tool === 'place'}
          />
        ))}
      </div>

      <TabStrip groups={groups} open={group.kind} onOpen={onOpen} t={t} />
    </section>
  );
}

/**
 * The tab strip: a real tab, not a toggle.
 *
 * The strip is a 36 px trough along the tray's bottom edge with the tabs standing in it. The active
 * one grows UPWARD by `--game-tab-lip` while the row's own height stays 36, so it eats the trough's
 * top edge and merges into the palette above it — that overlap IS the tab metaphor, and it is why
 * the grid above carries the same 10 px of bottom padding the tab grows into.
 *
 * It scrolls horizontally inside the trough rather than wrapping, because "Achterbahnen" is twelve
 * characters against "Coasters" at eight and six tabs with their count pills already fill 720 px of
 * the 1004 available. The scroller is as tall as the tallest tab so the lip is not clipped by its
 * own overflow, which it was in the first version — `overflow-x` clips vertically too.
 */
function TabStrip({
  groups,
  open,
  onOpen,
  t,
}: {
  groups: PaletteGroup[];
  open: string;
  onOpen: (kind: string) => void;
  t: Translate;
}) {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [open]);

  return (
    <div className={cn(TAB_TROUGH, '-mx-[10px] h-9 max-sm:h-11')}>
      <div
        className={cn(
          'flex h-[calc(36px+var(--game-tab-lip))] items-end gap-1 overflow-x-auto px-2',
          'max-sm:h-[calc(44px+var(--game-tab-lip))]',
          'mt-[calc(0px-var(--game-tab-lip))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        )}
      >
        {groups.map((group) => {
          const Icon = KIND_ICONS[group.kind] ?? Box;
          const usable = group.items.some((i) => i.available);
          const active = open === group.kind;
          return (
            <button
              key={group.kind}
              ref={active ? activeRef : undefined}
              type="button"
              disabled={!usable}
              data-tab={group.kind}
              data-tab-active={active ? '' : undefined}
              onClick={() => onOpen(group.kind)}
              className={cn(
                raise({ on: active }),
                'flex shrink-0 items-center gap-1.5 rounded-b-none px-3 text-[12.5px] font-semibold',
                active
                  ? cn(
                      TAB_ACTIVE,
                      'h-[calc(36px+var(--game-tab-lip))] max-sm:h-[calc(44px+var(--game-tab-lip))]'
                    )
                  : 'h-9 max-sm:h-11',
                // An unavailable category is the inactive tab, dimmed and unreachable — never
                // hidden, because a pack that loaded and cannot be drawn must not look like a pack
                // that did not load.
                !usable && 'pointer-events-none opacity-40'
              )}
            >
              <Icon className="size-[15px]" />
              <span>{groupLabel(group.kind, t)}</span>
              <span
                className={cn(
                  SINK,
                  'min-w-5 px-1 py-px text-center text-[10.5px] font-semibold text-white/72 tabular-nums'
                )}
              >
                {group.items.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One item, and the owner's second ask is answered here.
 *
 * Three rows: a 66 px sunk picture well on a lit stage, the name, then cost left and footprint (or
 * "draws track") right. The second line is not decoration — five shops in the packs share the
 * `kiosk-round` generator and three share `kiosk-a`, so a render alone cannot separate `first-aid`
 * from `info`; the words can.
 *
 * The well reserves its height from the first frame whether or not a picture has arrived, or the
 * palette jumps under the pointer as the renders land.
 *
 * Below `sm` the tile is a ROW — the site's own "a blog card is a row on phones" rule and the same
 * reasoning: as a 2 × 2 grid these took 556 px of an 844 px phone.
 */
function ItemTile({
  api,
  item,
  locale,
  t,
  selected,
  placing,
}: {
  api: ToolsMainApi;
  item: PaletteItem;
  locale: GameLocale;
  t: Translate;
  selected: boolean;
  placing: boolean;
}) {
  const thumb = useThumbnail(api, item);
  const Icon = KIND_ICONS[item.kind] ?? Box;
  const meta =
    item.placement === 'route'
      ? t('tools.item.route')
      : item.footprint
        ? `${trim(item.footprint[0])} × ${trim(item.footprint[1])} m`
        : '';

  return (
    <button
      type="button"
      disabled={!item.available}
      data-item={item.key}
      data-thumb={thumb ? 'render' : 'icon'}
      onClick={() => api.useTool('place', item.key)}
      className={cn(
        raise({ on: selected, armed: selected && placing }),
        'flex flex-col gap-1 p-1.5 text-left',
        'max-sm:flex-row max-sm:items-center max-sm:gap-2.5 max-sm:p-2'
      )}
    >
      <span
        className={cn(
          SINK_STAGE,
          'relative block h-[66px] w-full shrink-0 overflow-hidden',
          'max-sm:h-14 max-sm:w-[88px]'
        )}
      >
        {/* The contact shadow every item grounds on, so a tall ride and a bench stand on the same
            floor rather than each floating at its own height. */}
        <span
          aria-hidden="true"
          className="absolute bottom-[7px] left-1/2 h-[6px] w-[46%] -translate-x-1/2 rounded-[50%] bg-black/20 blur-[2.5px]"
        />
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL rendered this frame; there is no file for `next/image` to optimise.
          <img
            src={thumb}
            alt=""
            draggable={false}
            // The height is a HEIGHT and the inset is padding, because an `<img>` is a replaced
            // element: with `height: auto` its used height is its intrinsic one, so `top` and
            // `bottom` together do not size it the way they size a `div`. Written that way it took
            // its width from the well, made itself square, and the well's `overflow-hidden` cut
            // the ferris wheel off at the axle — every tile a picture of the top third of
            // something. `object-bottom` then stands the model on the contact shadow.
            className="absolute inset-0 size-full object-contain object-bottom pt-0.5 pb-1.5"
          />
        ) : (
          <Icon className="absolute top-[46%] left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-black/40" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[12.5px] leading-tight font-bold">
          {localName(item, locale)}
        </span>
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[11.5px] text-white/72 tabular-nums">
            {money(item.cost, locale, t)}
          </span>
          <span className="shrink-0 truncate text-[10.5px] text-white/55">
            {item.available ? meta : t(unavailableKey(item))}
          </span>
        </span>
      </span>
    </button>
  );
}

// ── the toolbelt ─────────────────────────────────────────────────────────────────────────────

/**
 * The lower object: what the tools are, what the next click costs, and how to take it back.
 *
 * Below `sm` it sheds the two rotate keys — rotation is `R` and a drag — because eight 44 px keys
 * plus their gaps is 387 px in the 376 a 390 px phone leaves, and it is allowed to wrap, so the
 * document is never wider than the viewport.
 */
function Toolbelt({
  api,
  state,
  t,
  locale,
  item,
}: {
  api: ToolsMainApi;
  state: ToolsState;
  t: Translate;
  locale: GameLocale;
  item: PaletteItem | null;
}) {
  const armedCost = state.tool === 'place' && item ? item.cost : null;
  return (
    <div
      className={cn(
        TRAY,
        BAR_WIDTH,
        'flex h-[52px] items-center gap-2 px-2',
        'max-sm:h-auto max-sm:flex-wrap max-sm:gap-1.5 max-sm:py-2'
      )}
      data-build-belt=""
    >
      <div className={cn(SINK, 'flex h-9 shrink-0 flex-col justify-center px-2.5 max-sm:h-11')}>
        <span className={cn(MICRO_LABEL, 'leading-none')}>{t('tools.cost.label')}</span>
        <span className="text-[14px] leading-tight font-bold text-(--game-accent-2) tabular-nums">
          {armedCost == null ? t('tools.cost.idle') : money(armedCost, locale, t)}
        </span>
      </div>

      <span className={cn(BELT_RULE, 'h-6')} aria-hidden="true" />

      {(['select', 'move', 'delete'] as ToolId[]).map((tool) => {
        const Icon = TOOL_ICONS[tool];
        const active = state.tool === tool;
        return (
          <BeltKey
            key={tool}
            label={t(`tools.tool.${tool}` as GameStringKey)}
            // Both signals: the tool is switched ON, and it is what the next click on the park
            // will DO. While placing, neither is here — the chosen tile carries them instead.
            on={active}
            armed={active}
            danger={tool === 'delete'}
            disabled={tool === 'move' && !state.selected}
            onClick={() => api.useTool(tool)}
            iconOnly
          >
            <Icon className="size-4" />
          </BeltKey>
        );
      })}

      <span className={cn(BELT_RULE, 'h-6 max-sm:hidden')} aria-hidden="true" />

      <BeltKey
        label={t('tools.rotate.left')}
        onClick={() => api.rotateBy(-15)}
        disabled={!state.ghost && !state.selected}
        className="max-sm:hidden"
        iconOnly
      >
        <RotateCcw className="size-4" />
      </BeltKey>
      <BeltKey
        label={t('tools.rotate.right')}
        onClick={() => api.rotateBy(15)}
        disabled={!state.ghost && !state.selected}
        className="max-sm:hidden"
        iconOnly
      >
        <RotateCw className="size-4" />
      </BeltKey>
      <BeltKey
        label={t(state.snap.enabled ? 'tools.snap.on' : 'tools.snap.off', {
          grid: state.snap.grid,
          angle: state.snap.angle,
        })}
        on={state.snap.enabled}
        onClick={() => api.setSnap({ enabled: !state.snap.enabled })}
      >
        <Grid3x3 className="size-4" />
        <span className="text-[12px] tabular-nums max-sm:hidden">
          {state.snap.enabled
            ? `${state.snap.grid} m · ${state.snap.angle}°`
            : t('tools.snap.free')}
        </span>
      </BeltKey>

      <span className={cn(BELT_RULE, 'h-6')} aria-hidden="true" />

      <BeltKey
        label={t('tools.undo')}
        disabled={state.undoDepth === 0}
        onClick={() => api.undo()}
        iconOnly
      >
        <Undo2 className="size-4" />
      </BeltKey>
      <BeltKey
        label={t('tools.redo')}
        disabled={state.redoDepth === 0}
        onClick={() => api.redo()}
        iconOnly
      >
        <Redo2 className="size-4" />
      </BeltKey>

      {/* A watermark and not a control, at the one opacity in this bar that does not clear AA —
          which is the point: it is a signature, not a thing to read. */}
      <span
        className="ml-auto shrink-0 pr-1 text-[11px] font-semibold tracking-[0.04em] text-white/40 select-none max-sm:hidden"
        aria-hidden="true"
      >
        park.fan Coaster
      </span>
    </div>
  );
}

/**
 * A key on the belt.
 *
 * `Button` for the heights and nothing else: 36 px is the `default` step and 44 px is its phone
 * tier, both off `components/ui/button.tsx`, and neither is invented here. The variant's own fill
 * is cancelled because the body comes from `raise()` — a key has one body, and two `bg-[image:…]`
 * utilities on one element is a question about stylesheet order.
 */
function BeltKey({
  label,
  on,
  armed,
  danger,
  disabled,
  iconOnly,
  className,
  onClick,
  children,
}: {
  label: string;
  on?: boolean;
  armed?: boolean;
  danger?: boolean;
  disabled?: boolean;
  iconOnly?: boolean;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size={iconOnly ? 'icon' : 'default'}
          variant="ghost"
          disabled={disabled}
          onClick={onClick}
          data-tool-button={label}
          className={cn(
            raise({ on, armed, danger: danger && !on }),
            'hover:bg-transparent dark:hover:bg-transparent',
            'gap-1.5 px-2.5',
            iconOnly && 'px-0',
            className
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * What the park is about to refuse, and why.
 *
 * It is a third object in a cluster the spec keeps to two, so it exists only while there is
 * something to say: at rest the bar is the tray and the belt, and a refusal or a live instruction
 * puts one line above them rather than reserving a permanent strip for the times it is empty.
 */
function StatusLine({
  t,
  locale,
  state,
  item,
}: {
  t: Translate;
  locale: GameLocale;
  state: ToolsState;
  item: PaletteItem | null;
}) {
  const reason = state.ghost && !state.ghost.valid ? state.ghost.reasons[0] : null;
  let text: string | null = null;
  let tone: 'muted' | 'ok' | 'bad' = 'muted';
  if (reason) {
    text = t(REASON_KEYS[reason]);
    tone = 'bad';
  } else if (state.tool === 'place' && item) {
    text = t('tools.status.place', { item: localName(item, locale) });
    tone = state.ghost ? 'ok' : 'muted';
  } else if (state.tool === 'move') {
    text = t('tools.status.move');
    tone = state.ghost?.valid ? 'ok' : 'muted';
  } else if (state.tool === 'delete') {
    text = t('tools.status.delete');
  } else if (state.selected) {
    text = t('tools.status.selected', { id: state.selected });
  }
  if (!text) return null;
  return (
    <p
      data-build-status={tone}
      className={cn(
        TRAY,
        'max-w-[min(64rem,100%)] truncate px-3 py-1.5 text-[11.5px] font-medium',
        tone === 'ok' && 'text-(--game-accent-2)',
        tone === 'bad' && 'text-(--game-danger)',
        tone === 'muted' && 'text-white/72'
      )}
    >
      {text}
    </p>
  );
}

// ── plumbing ─────────────────────────────────────────────────────────────────────────────────

function localName(item: PaletteItem, locale: string): string {
  return item.name[locale] ?? item.name.en ?? item.item;
}

function money(cents: number, locale: string, t: Translate): string {
  if (cents <= 0) return t('tools.free');
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** `14 × 14 m`, and `2.4` rather than `2.40` — a footprint is a size, not an account. */
function trim(metres: number): string {
  return String(Math.round(metres * 100) / 100);
}

function unavailableKey(item: PaletteItem): GameStringKey {
  return (
    item.unavailableReason === 'route' ? 'tools.unavailable.route' : 'tools.unavailable.kind'
  ) as GameStringKey;
}

/**
 * A group's label. `tools.group.<kind>` when the table has one, and the kind's own id prettified
 * when it does not — a pack that brings a kind nobody translated shows "Water slide", not a
 * missing string and not nothing.
 */
function groupLabel(kind: string, t: Translate): string {
  const key = `tools.group.${kind}`;
  const translated = t(key as GameStringKey);
  if (translated !== key) return translated;
  const words = kind.replace(/[-_]/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * One tile's picture.
 *
 * The studio is asked once per item and answers from its cache for ever after, so this is a state
 * write on the first frame a tile is drawn and nothing at all on every frame after it. A tile that
 * unmounts while its render is queued does not write into a dead component — the queue still
 * finishes the render, because the next time that tab is opened the answer is already there.
 */
function useThumbnail(api: ToolsMainApi, item: PaletteItem): string | null {
  // Seeded from the cache during the first render rather than written by the effect: a tab
  // re-opened is a synchronous cache read, and a picture that is already there may not cost a
  // second render pass to appear.
  const [url, setUrl] = useState<string | null>(() => api.thumbnail(item.key));
  useEffect(() => {
    if (url) return;
    let live = true;
    void api.requestThumbnail(item.key).then((next) => {
      if (live && next) setUrl(next);
    });
    return () => {
      live = false;
    };
  }, [api, item.key, url]);
  return url;
}

/**
 * The tools api, once the engine has booted.
 *
 * `getHandle()` is null while the host is still starting, and the HUD renders before the boot
 * promise resolves — so this polls one animation frame at a time until the handle exists and then
 * stops. Not an interval: a frame is the only clock this file is allowed to have, and it stops on
 * the first success.
 */
function useToolsApi(getHandle: () => GameHandle | null): ToolsMainApi | null {
  const [api, setApi] = useState<ToolsMainApi | null>(null);
  // The ref is written in an effect rather than during render (the `react-hooks/refs` rule, and it
  // is right): `getHandle` is a fresh closure every render, and putting it in the effect's deps
  // would restart the search on every render instead of once.
  const getHandleRef = useRef(getHandle);
  useEffect(() => {
    getHandleRef.current = getHandle;
  });
  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    const look = () => {
      if (cancelled) return;
      const found = getHandleRef.current()?.module<ToolsMainApi>('tools') ?? null;
      if (found) {
        setApi(found);
        return;
      }
      frame = requestAnimationFrame(look);
    };
    look();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);
  return api;
}

function useToolsState(api: ToolsMainApi | null): ToolsState | null {
  const cache = useRef<ToolsState | null>(null);
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!api) return () => {};
      return api.subscribe((next) => {
        cache.current = next;
        onChange();
      });
    },
    [api]
  );
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!api) return null;
      // `useSyncExternalStore` compares snapshots by identity, so a fresh object per read would
      // loop forever. The subscription writes the cache; this only fills it the first time.
      if (!cache.current) cache.current = api.state();
      return cache.current;
    },
    () => null
  );
}
