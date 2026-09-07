'use client';

/**
 * The two operating lists: every machine, and every counter.
 *
 * ## What is in a row, and what is not
 *
 * The ride rows are assembled from the `rides.state` and `rides.motion` frame buffers — the state
 * byte, the riders on board and the queue length — plus the machine's nameplate figures from
 * `RidesMainApi.profile()`. That is genuinely everything the main thread is given. The sim knows
 * each ride's measured throughput, its utilisation, its satisfaction and the wait a guest joining
 * now would face (`RideView`), and publishes none of it; `docs/game/requests/ui.md` asks for a
 * projection and this list gets those columns the day it lands. Until then the rated throughput is
 * shown and labelled as the rated one, because `capacity / cycleMinutes * 60` is arithmetic on
 * figures the main thread holds, and a wait time computed from a queue length would not be.
 *
 * ## The two controls that write
 *
 * `rides:close` and `shops:price` / `shops:close` are commands the sim already accepts, and they
 * are the only writes in this file. Neither is echoed back — the sim keeps `closedByPlayer` in its
 * own runtime and writes the shop's price into the entity's data bag in the worker's copy of the
 * world — so the row mirrors the value optimistically and the runtime holds the mirror. That is a
 * real gap rather than a shortcut: reload the page and the mirror is gone while the sim's flag is
 * not.
 */

import { useMemo, useState } from 'react';
import { Crosshair, Minus, Plus, Power, Users, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PanelBodyProps } from '../api';
import { count, money, queuePressure } from '../format';
import { useTelemetry, useTelemetrySnapshot } from '../hooks';
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
import { HUD_LABEL, HUD_ROW, HUD_ROW_ACTIVE, rideTone } from '../surface';
import type { GameStringKey } from '../../i18n';
import type { UiRuntime } from '../runtime';
import type { RideRow, ShopRow } from '../telemetry';

type RideSort = 'queue' | 'name' | 'state';

// ── Rides ─────────────────────────────────────────────────────────────────────────────────
export function RidesPanel({ t, locale, ui }: PanelBodyProps) {
  const runtime = ui as UiRuntime;
  const s = useTelemetrySnapshot(runtime);
  const [sort, setSort] = useState<RideSort>('queue');
  const selected = runtime.selected();

  const rows = useMemo(() => sortRides(s.rides, sort), [s.rides, sort]);

  if (rows.length === 0) {
    return <EmptyNote>{s.live ? t('rides.none') : t('park.noSim')}</EmptyNote>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1">
        <span className={HUD_LABEL}>{t('rides.sortBy')}</span>
        <div className="ml-auto flex gap-0.5">
          {(['queue', 'name', 'state'] as RideSort[]).map((option) => (
            <HudButton
              key={option}
              variant={sort === option ? 'default' : 'ghost'}
              onClick={() => setSort(option)}
            >
              {t(`rides.sort.${option}` as GameStringKey)}
            </HudButton>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {rows.map((ride) => (
          <li key={ride.id}>
            <RideListRow
              ride={ride}
              active={selected === ride.id}
              locale={locale}
              t={t}
              runtime={runtime}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function sortRides(rides: readonly RideRow[], sort: RideSort): RideRow[] {
  const copy = [...rides];
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'state')
    return copy.sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));
  return copy.sort((a, b) => b.queue - a.queue || a.name.localeCompare(b.name));
}

function RideListRow({
  ride,
  active,
  locale,
  t,
  runtime,
}: {
  ride: RideRow;
  active: boolean;
  locale: string;
  t: PanelBodyProps['t'];
  runtime: UiRuntime;
}) {
  const tone = rideTone(ride.state);
  return (
    <div className={cn(active ? HUD_ROW_ACTIVE : HUD_ROW, 'px-2 py-1.5')}>
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left outline-none"
        onClick={() => {
          runtime.select(ride.id);
          runtime.focus(ride.id);
        }}
      >
        <StatusDot tone={tone} />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/90">
          {ride.name}
        </span>
        <span className="shrink-0 text-[10px] text-white/45 tabular-nums">
          {t(`rides.state.${ride.state}` as GameStringKey)}
        </span>
      </button>
      <div className="mt-1 flex items-center gap-2">
        <Meter
          className="min-w-0 flex-1"
          fraction={queuePressure(ride.queue, ride.capacity)}
          tone={ride.queue > ride.capacity * 3 ? 'warn' : 'neutral'}
        />
        <Chip tone={ride.queue > 0 ? 'warn' : 'neutral'}>
          <Users className="mr-1 size-2.5" />
          {ride.queue}
        </Chip>
        <span className="w-12 shrink-0 text-right text-[10px] text-white/50 tabular-nums">
          {ride.riders}/{ride.capacity}
        </span>
      </div>
      {active ? <RideActions ride={ride} t={t} locale={locale} runtime={runtime} /> : null}
    </div>
  );
}

function RideActions({
  ride,
  t,
  locale,
  runtime,
}: {
  ride: RideRow;
  t: PanelBodyProps['t'];
  locale: string;
  runtime: UiRuntime;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-white/10 pt-2">
      <span className="mr-auto text-[10px] text-white/45 tabular-nums">
        {t('rides.rated')} {count(ride.ratedThroughput, locale)}
      </span>
      <HudIconButton label={t('rides.focus')} dense onClick={() => runtime.focus(ride.id)}>
        <Crosshair className="size-3.5" />
      </HudIconButton>
      <HudIconButton
        label={ride.shut ? t('rides.reopen') : t('rides.shut')}
        dense
        active={ride.shut}
        onClick={() => runtime.setRideShut(ride.id, !ride.shut)}
      >
        <Power className="size-3.5" />
      </HudIconButton>
      <HudIconButton
        label={ride.state === 'broken' ? t('rides.repair') : t('rides.service')}
        dense
        onClick={() =>
          runtime.dispatch(ride.state === 'broken' ? 'rides:repair' : 'rides:service', {
            id: ride.id,
          })
        }
      >
        <Wrench className="size-3.5" />
      </HudIconButton>
    </div>
  );
}

// ── Shops ─────────────────────────────────────────────────────────────────────────────────
const selectShops = (s: { shops: readonly ShopRow[]; live: boolean }) => s.shops;

export function ShopsPanel({ t, locale, ui }: PanelBodyProps) {
  const runtime = ui as UiRuntime;
  const shops = useTelemetry(runtime, selectShops);
  const selected = runtime.selected();

  if (shops.length === 0) return <EmptyNote>{t('shops.none')}</EmptyNote>;

  return (
    <ul className="flex flex-col gap-1">
      {shops.map((shop) => (
        <li key={shop.id} className={cn(selected === shop.id ? HUD_ROW_ACTIVE : HUD_ROW, 'p-2')}>
          <div className="flex items-center gap-2">
            <StatusDot tone={shop.closed ? 'neutral' : 'good'} />
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-xs font-medium text-white/90 outline-none"
              onClick={() => {
                runtime.select(shop.id);
                runtime.focus(shop.id);
              }}
            >
              {shop.name}
            </button>
            <Chip>{t(`shops.kind.${shop.kind}` as GameStringKey)}</Chip>
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            <span className={cn(HUD_LABEL, 'mr-auto')}>{t('shops.price')}</span>
            <HudIconButton
              label={t('shops.priceDown')}
              dense
              disabled={shop.price <= 0}
              onClick={() => runtime.setShopPrice(shop.id, Math.max(0, shop.price - 10))}
            >
              <Minus className="size-3" />
            </HudIconButton>
            <span className="w-16 text-center text-xs font-semibold text-white/90 tabular-nums">
              {money(shop.price, locale)}
            </span>
            <HudIconButton
              label={t('shops.priceUp')}
              dense
              onClick={() => runtime.setShopPrice(shop.id, shop.price + 10)}
            >
              <Plus className="size-3" />
            </HudIconButton>
            <HudIconButton
              label={shop.closed ? t('shops.reopen') : t('shops.shut')}
              dense
              active={shop.closed}
              onClick={() => runtime.setShopClosed(shop.id, !shop.closed)}
            >
              <Power className="size-3.5" />
            </HudIconButton>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-white/45 tabular-nums">
            <span>
              {t('shops.sold')} {shop.soldToday}
            </span>
            <span>{money(shop.takingsToday, locale)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The shared summary block both operating panels put at the top of an inspector. */
export function RideFacts({
  ride,
  t,
  locale,
}: {
  ride: RideRow;
  t: PanelBodyProps['t'];
  locale: string;
}) {
  return (
    <Section label={t('rides.machine')}>
      <DataRow label={t('rides.capacity')} value={ride.capacity} />
      <DataRow
        label={t('rides.rated')}
        value={count(ride.ratedThroughput, locale)}
        hint={t('rides.rated.hint')}
      />
      <DataRow label={t('rides.excitement')} value={ride.excitement.toFixed(1)} />
      <DataRow label={t('rides.fear')} value={ride.fear.toFixed(1)} />
      <DataRow label={t('rides.nausea')} value={ride.nausea.toFixed(1)} />
      {ride.minHeightCm != null ? (
        <DataRow label={t('rides.minHeight')} value={`${ride.minHeightCm} cm`} />
      ) : null}
      <DataRow
        label={t('rides.ticket')}
        value={ride.price > 0 ? money(ride.price, locale) : t('rides.included')}
      />
      <DataRow label={t('rides.upkeep')} value={money(ride.upkeep, locale)} />
    </Section>
  );
}
