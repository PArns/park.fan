'use client';

/**
 * The inspector: one panel, and whatever is selected decides what is in it.
 *
 * The selection is `tools`' — a bare entity id — and what to draw for it belongs to whichever
 * module owns the kind. So this panel looks the kind up in the inspector registry and renders
 * what it finds; `ui` ships the two for the kinds that exist today (`ride`, `shop`) and a generic
 * readout for everything else, and a module that adds a kind adds its inspector from its own
 * `main()` with no edit here:
 *
 * ```ts
 * ctx.module<UiMainApi>('ui')?.registerInspector({ kind: 'pool', icon: Waves, Body: PoolInspector });
 * ```
 *
 * The generic fallback is not a placeholder to be replaced later. A park is full of scenery and
 * buildings that will never want a bespoke panel, and "what is this, where is it, which pack is it
 * from" is the honest answer for all of them.
 */

import { useCallback, useMemo } from 'react';
import { Crosshair, MousePointerSquareDashed, Power, Wrench, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Entity } from '../../core/types';
import type { InspectorBodyProps, PanelBodyProps } from '../api';
import { count, money, queuePressure } from '../format';
import { useChrome, useTelemetry } from '../hooks';
import {
  Chip,
  DataRow,
  EmptyNote,
  HudButton,
  HudIconButton,
  Meter,
  Section,
  StatusDot,
} from '../parts';
import { HUD_WELL, rideTone } from '../surface';
import type { GameStringKey } from '../../i18n';
import type { UiRuntime } from '../runtime';
import type { ParkTelemetry, RideRow, ShopRow } from '../telemetry';
import { RideFacts } from './operations';

/** The selected entity id, re-read whenever the tool state changes. */
export function useSelected(runtime: UiRuntime): string | null {
  const selector = useCallback(() => runtime.selected(), [runtime]);
  return useChrome(runtime, selector);
}

export function InspectorPanel(props: PanelBodyProps) {
  const runtime = props.ui as UiRuntime;
  const id = useSelected(runtime);
  const entity = id ? (runtime.world().entities[id] ?? null) : null;

  if (!entity) {
    return <EmptyNote>{props.t('inspector.nothing')}</EmptyNote>;
  }

  const def = runtime.inspectorFor(entity.kind);
  const Body = def?.Body ?? GenericInspector;
  return (
    <div className="flex flex-col gap-3">
      {/* The two actions that apply to any selection sit in the header rather than under the body.
          A footer here is a footer at the bottom of a panel whose body scrolls, so it was the
          first thing to go off screen the moment a ride had more to say than the column was
          tall. */}
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white/95">
            {def?.title?.(entity, props.locale) ?? runtime.entityName(entity)}
          </h3>
          <p className="mt-0.5 truncate text-[10px] text-white/40">
            {entity.pack}:{entity.item}
          </p>
        </div>
        <HudIconButton
          label={props.t('inspector.focus')}
          dense
          onClick={() => runtime.focus(entity.id)}
        >
          <Crosshair className="size-3.5" />
        </HudIconButton>
        <HudIconButton
          label={props.t('inspector.deselect')}
          dense
          onClick={() => runtime.select(null)}
        >
          <X className="size-3.5" />
        </HudIconButton>
      </header>
      <Body {...props} entity={entity} />
    </div>
  );
}

// ── the generic one ───────────────────────────────────────────────────────────────────────
export function GenericInspector({ t, entity }: InspectorBodyProps) {
  return (
    <Section label={t('inspector.placed')}>
      <DataRow label={t('inspector.kind')} value={entity.kind} />
      <DataRow
        label={t('inspector.position')}
        value={`${entity.position[0].toFixed(0)}, ${entity.position[2].toFixed(0)} m`}
      />
      <DataRow
        label={t('inspector.rotation')}
        value={`${Math.round(((entity.yaw * 180) / Math.PI + 360) % 360)}°`}
      />
      <DataRow label={t('inspector.pack')} value={entity.pack} />
    </Section>
  );
}

// ── rides ─────────────────────────────────────────────────────────────────────────────────
function selectRide(id: string) {
  return (s: ParkTelemetry): RideRow | null => s.rides.find((r) => r.id === id) ?? null;
}

export function RideInspector({ t, locale, ui, entity }: InspectorBodyProps) {
  const runtime = ui as UiRuntime;
  const selector = useMemo(() => selectRide(entity.id), [entity.id]);
  const ride = useTelemetry(runtime, selector, rideEqual);

  if (!ride) {
    return <EmptyNote>{t('rides.notRunning')}</EmptyNote>;
  }
  const tone = rideTone(ride.state);
  return (
    <div className="flex flex-col gap-3">
      <div className={cn(HUD_WELL, 'flex items-center gap-2 px-2.5 py-2')}>
        <StatusDot tone={tone} />
        <span className="text-xs font-medium text-white/90">
          {t(`rides.state.${ride.state}` as GameStringKey)}
        </span>
        <Chip className="ml-auto">
          {ride.riders}/{ride.capacity}
        </Chip>
      </div>

      <Section label={t('rides.queue')}>
        <Meter
          fraction={queuePressure(ride.queue, ride.capacity)}
          value={count(ride.queue, locale)}
          label={t('rides.waiting')}
          tone={ride.queue > ride.capacity * 3 ? 'warn' : 'neutral'}
        />
      </Section>

      <RideFacts ride={ride} t={t} locale={locale} />

      <div className="flex flex-wrap gap-1">
        <HudButton
          variant={ride.shut ? 'default' : 'ghost'}
          onClick={() => runtime.setRideShut(ride.id, !ride.shut)}
        >
          <Power className="size-3" />
          {ride.shut ? t('rides.reopen') : t('rides.shut')}
        </HudButton>
        <HudButton
          onClick={() =>
            runtime.dispatch(ride.state === 'broken' ? 'rides:repair' : 'rides:service', {
              id: ride.id,
            })
          }
        >
          <Wrench className="size-3" />
          {ride.state === 'broken' ? t('rides.repair') : t('rides.service')}
        </HudButton>
      </div>
      <p className="text-[11px] leading-relaxed text-white/40">{t('rides.noWaitNote')}</p>
    </div>
  );
}

function rideEqual(a: RideRow | null, b: RideRow | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.state === b.state &&
    a.riders === b.riders &&
    a.queue === b.queue &&
    a.shut === b.shut &&
    a.capacity === b.capacity
  );
}

// ── shops ─────────────────────────────────────────────────────────────────────────────────
function selectShop(id: string) {
  return (s: ParkTelemetry): ShopRow | null => s.shops.find((r) => r.id === id) ?? null;
}

export function ShopInspector({ t, locale, ui, entity }: InspectorBodyProps) {
  const runtime = ui as UiRuntime;
  const selector = useMemo(() => selectShop(entity.id), [entity.id]);
  const shop = useTelemetry(runtime, selector, shopEqual);
  if (!shop) return <EmptyNote>{t('shops.notRunning')}</EmptyNote>;

  return (
    <div className="flex flex-col gap-3">
      <div className={cn(HUD_WELL, 'flex items-center gap-2 px-2.5 py-2')}>
        <StatusDot tone={shop.closed ? 'neutral' : 'good'} />
        <span className="text-xs font-medium text-white/90">
          {shop.closed ? t('shops.closed') : t('shops.open')}
        </span>
        <Chip className="ml-auto">{t(`shops.kind.${shop.kind}` as GameStringKey)}</Chip>
      </div>

      <Section label={t('shops.counter')}>
        <DataRow label={t('shops.answers')} value={shop.need === 'none' ? '–' : shop.need} />
        <DataRow label={t('shops.price')} value={money(shop.price, locale)} />
        <DataRow label={t('shops.sold')} value={shop.soldToday} hint={t('shops.soldNote')} />
        <DataRow label={t('shops.takings')} value={money(shop.takingsToday, locale)} />
      </Section>

      <div className="flex flex-wrap items-center gap-1">
        <HudButton
          onClick={() => runtime.setShopPrice(shop.id, Math.max(0, shop.price - 10))}
          disabled={shop.price <= 0}
        >
          −10 ct
        </HudButton>
        <HudButton onClick={() => runtime.setShopPrice(shop.id, shop.price + 10)}>+10 ct</HudButton>
        <HudButton
          variant={shop.closed ? 'default' : 'ghost'}
          onClick={() => runtime.setShopClosed(shop.id, !shop.closed)}
        >
          <Power className="size-3" />
          {shop.closed ? t('shops.reopen') : t('shops.shut')}
        </HudButton>
      </div>
      <p className="text-[11px] leading-relaxed text-white/40">{t('shops.soldNote')}</p>
    </div>
  );
}

function shopEqual(a: ShopRow | null, b: ShopRow | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.price === b.price &&
    a.closed === b.closed &&
    a.soldToday === b.soldToday &&
    a.takingsToday === b.takingsToday
  );
}

export const InspectorIcon = MousePointerSquareDashed;

/** Title for an entity, used by the inspector registry's defaults. */
export function defaultInspectorTitle(entity: Entity): string {
  return entity.item;
}
