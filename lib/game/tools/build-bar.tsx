'use client';

/**
 * The build bar: the HUD half of this module.
 *
 * Built from the site's own design system — `@/components/ui/button`, `@/components/ui/badge`,
 * `@/components/ui/tooltip`, `cn()` and Lucide, over the HUD's glass recipe (`bg-(--game-hud)` +
 * `backdrop-blur-xl` + a hairline `border-white/10`), which is what the clock and cash panels in
 * `ui/hud.tsx` already are. No second component library and no hand-rolled button.
 *
 * **The bar renders the palette, and the palette is the registry.** There is no list of things in
 * this file: `api.palette()` returns one group per entity kind with whatever the registered packs
 * declared, and the labels come from the manifests' own localized names. A pack that adds a bench
 * appears here with no change to this file — including its group, if the bench brings a new kind
 * with it, in which case the label falls back to the kind's own id rather than going missing.
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
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { GameHandle } from '../core/host';
import type { GameLocale, GameStringKey, Translate } from '../i18n';
import type { ToolsMainApi } from './main';
import type { PaletteGroup, PaletteItem, PlacementReason, ToolId, ToolsState } from './types';

export interface BuildBarProps {
  t: Translate;
  locale: GameLocale;
  getHandle: () => GameHandle | null;
}

/** Icon per entity kind. A kind nobody anticipated gets the box, and still works. */
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

export function BuildBar({ t, locale, getHandle }: BuildBarProps) {
  const api = useToolsApi(getHandle);
  const state = useToolsState(api);
  const [openKind, setOpenKind] = useState<string | null>(null);

  if (!api || !state) return null;
  const groups = api.palette();
  if (groups.length === 0) return null;

  const openGroup = groups.find((g) => g.kind === openKind) ?? null;
  const activeItem = state.itemKey
    ? (groups.flatMap((g) => g.items).find((i) => i.key === state.itemKey) ?? null)
    : null;

  return (
    <div className="pointer-events-auto flex w-full flex-col items-center gap-2" data-build-bar="">
      {openGroup ? (
        <ItemPanel
          group={openGroup}
          t={t}
          locale={locale}
          activeKey={state.itemKey}
          onPick={(item) => {
            api.useTool('place', item.key);
            setOpenKind(null);
          }}
          onClose={() => setOpenKind(null)}
        />
      ) : null}

      <StatusLine t={t} locale={locale} state={state} item={activeItem} />

      <div className="flex max-w-[min(96vw,64rem)] flex-wrap items-center justify-center gap-1 rounded-(--game-hud-radius) border border-white/10 bg-(--game-hud) px-2 py-1.5 shadow-lg backdrop-blur-xl">
        {groups.map((group) => {
          const Icon = KIND_ICONS[group.kind] ?? Box;
          const usable = group.items.some((i) => i.available);
          const active = openKind === group.kind || activeItem?.kind === group.kind;
          return (
            <BarButton
              key={group.kind}
              label={`${groupLabel(group.kind, t)} · ${group.items.length}`}
              active={active}
              disabled={!usable}
              onClick={() => setOpenKind(openKind === group.kind ? null : group.kind)}
            >
              <Icon className="size-4" />
              <span className="hidden text-xs sm:inline">{groupLabel(group.kind, t)}</span>
            </BarButton>
          );
        })}

        <Divider />

        {(['select', 'move', 'delete'] as ToolId[]).map((tool) => {
          const Icon = TOOL_ICONS[tool];
          return (
            <BarButton
              key={tool}
              label={t(`tools.tool.${tool}` as GameStringKey)}
              active={state.tool === tool}
              disabled={tool === 'move' && !state.selected}
              onClick={() => api.useTool(tool)}
              iconOnly
            >
              <Icon className="size-4" />
            </BarButton>
          );
        })}

        <Divider />

        <BarButton
          label={t('tools.rotate.left')}
          onClick={() => api.rotateBy(-15)}
          disabled={!state.ghost && !state.selected}
          iconOnly
        >
          <RotateCcw className="size-4" />
        </BarButton>
        <BarButton
          label={t('tools.rotate.right')}
          onClick={() => api.rotateBy(15)}
          disabled={!state.ghost && !state.selected}
          iconOnly
        >
          <RotateCw className="size-4" />
        </BarButton>
        <BarButton
          label={t(state.snap.enabled ? 'tools.snap.on' : 'tools.snap.off', {
            grid: state.snap.grid,
            angle: state.snap.angle,
          })}
          active={state.snap.enabled}
          onClick={() => api.setSnap({ enabled: !state.snap.enabled })}
        >
          <Grid3x3 className="size-4" />
          <span className="hidden text-xs tabular-nums sm:inline">
            {state.snap.enabled
              ? `${state.snap.grid} m · ${state.snap.angle}°`
              : t('tools.snap.free')}
          </span>
        </BarButton>

        <Divider />

        <BarButton
          label={t('tools.undo')}
          disabled={state.undoDepth === 0}
          onClick={() => api.undo()}
          iconOnly
        >
          <Undo2 className="size-4" />
        </BarButton>
        <BarButton
          label={t('tools.redo')}
          disabled={state.redoDepth === 0}
          onClick={() => api.redo()}
          iconOnly
        >
          <Redo2 className="size-4" />
        </BarButton>
        {state.undoDepth > 0 ? (
          <Badge variant="outline" className="border-white/15 text-[10px] tabular-nums">
            {state.undoDepth}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function ItemPanel({
  group,
  t,
  locale,
  activeKey,
  onPick,
  onClose,
}: {
  group: PaletteGroup;
  t: Translate;
  locale: GameLocale;
  activeKey: string | null;
  onPick: (item: PaletteItem) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="max-h-[42vh] w-[min(94vw,44rem)] overflow-y-auto rounded-(--game-hud-radius) border border-white/10 bg-(--game-hud-strong) p-2 shadow-xl backdrop-blur-xl"
      data-build-panel={group.kind}
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-muted-foreground text-xs font-medium">
          {groupLabel(group.kind, t)}
        </span>
        <Button size="icon-sm" variant="ghost" className="size-6" onClick={onClose}>
          <X className="size-3.5" />
          <span className="sr-only">{t('tools.close')}</span>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
        {group.items.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={!item.available}
            data-item={item.key}
            onClick={() => onPick(item)}
            className={cn(
              'flex flex-col items-start gap-0.5 rounded-md border border-white/10 px-2 py-1.5 text-left transition-colors',
              'hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
              activeKey === item.key && 'border-(--game-accent) bg-white/10'
            )}
          >
            <span className="truncate text-xs font-medium">{localName(item, locale)}</span>
            <span className="text-muted-foreground text-[10px] tabular-nums">
              {item.available
                ? money(item.cost, locale, t)
                : t(
                    item.unavailableReason === 'route'
                      ? 'tools.unavailable.route'
                      : 'tools.unavailable.kind'
                  )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

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
  let text: string;
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
  } else {
    text = t('tools.status.idle');
  }
  return (
    <p
      data-build-status={tone}
      className={cn(
        'rounded-md border border-white/10 bg-(--game-hud) px-2 py-1 text-[11px] backdrop-blur-xl',
        tone === 'ok' && 'text-(--game-accent-2)',
        tone === 'bad' && 'text-(--game-danger)',
        tone === 'muted' && 'text-muted-foreground'
      )}
    >
      {text}
    </p>
  );
}

function BarButton({
  label,
  active,
  disabled,
  iconOnly,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  iconOnly?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size={iconOnly ? 'icon-sm' : 'sm'}
          variant={active ? 'default' : 'ghost'}
          disabled={disabled}
          onClick={onClick}
          data-tool-button={label}
          className={cn(
            'h-8 max-sm:h-9',
            iconOnly && 'size-8 max-sm:size-9',
            active && 'shadow-[0_0_0_1px_var(--game-accent)]'
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />;
}

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
