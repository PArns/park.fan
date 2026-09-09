'use client';

/**
 * The HUD: the chrome around a running park.
 *
 * Four clusters and nothing loose. Top left is **when** — the day, the clock, the day strip and
 * the speed control. Top right is **how it is going** — the figures, drawn from the stat registry
 * rather than from a list in this file, and the rail that opens panels. Bottom centre is the build
 * bar, which belongs to `tools`; the notice stack hangs off its top left edge.
 *
 * ## Every cluster is a tray, and what is in it is either raised or sunk
 *
 * A tray says its contents belong together; inside it a key is raised because you can press it and
 * a readout is sunk because it is telling you something. So the clock is a groove with the four
 * speed keys beside it, the four figures are four grooves in one tray, and the rail is a row of
 * keys — and a reader can tell which of the three does something before reading any of them. The
 * skin before this one drew the stat row and the tool row in the same flat material.
 *
 * ## The two scrims are load-bearing, not decoration
 *
 * A glass chip blurs what is behind it and does nothing for the sky between two chips, and the
 * top row of this HUD is two clusters with a kilometre of bright noon sky between them. The
 * gradients at the top and bottom edges give every element in those rows a floor of contrast, so
 * the same panel is legible over a white cloud at 13:00 and over a lit midway at 23:00 without
 * being a slab of black at either.
 *
 * ## What re-renders, and when
 *
 * Nothing in here subscribes to "the game changed". The clock cluster reads the minute, the stat
 * cluster reads its own stat's value, the rail reads its badges — each through a cached selector
 * over the 4 Hz telemetry publish, so a component re-renders when the number it draws moves and
 * not before. Core's store is read the same way: the host writes `environment` on every quarter
 * park minute, which at speed 3 is twelve writes a second for a value the top bar does not draw.
 *
 * That is measured rather than asserted: every subscribing component calls `useCommitTally()` and
 * the running total is on `window.__parkfan_hud`, so the figure in the report is one anybody can
 * reproduce. `<Profiler>` was the first attempt and had to come out — see the docblock on
 * {@link HUD_METRICS}.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronsRight,
  FastForward,
  Info,
  Menu as MenuIcon,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameStore, GameState, Notice } from '../core/store';
import type { GameHandle } from '../core/host';
import type { Speed } from '../core/types';
import { BuildBar } from '../tools/build-bar';
import type { GameLocale, GameStringKey, Translate } from '../i18n';
import type { PanelDef, StatDef } from './api';
import { clockTime, noticeText } from './format';
import { shallowEqual, useChrome, useCommitTally, useGame, useNarrow, useTelemetry } from './hooks';
import { GameMenu } from './menu';
import { PanelHost } from './panel-host';
import { DayStrip } from './panels/park';
import { FigureTile, HudIconButton, StatusDot } from './parts';
import type { UiRuntime } from './runtime';
import { HUD_METRICS, type ParkTelemetry } from './telemetry';
import {
  BELT_RULE,
  HUD_LABEL,
  HUD_VALUE,
  SCRIM_BOTTOM,
  SCRIM_TOP,
  SINK,
  TONE_TEXT,
  TRAY,
  type Tone,
} from './surface';

export interface GameHudProps {
  store: GameStore;
  t: Translate;
  locale: GameLocale;
  getHandle: () => GameHandle | null;
}

const SPEEDS: { speed: Speed; key: GameStringKey; icon: typeof Play }[] = [
  { speed: 0, key: 'hud.speed.pause', icon: Pause },
  { speed: 1, key: 'hud.speed.play', icon: Play },
  { speed: 3, key: 'hud.speed.fast', icon: FastForward },
  { speed: 5, key: 'hud.speed.fastest', icon: ChevronsRight },
];

const selectPhase = (s: GameState) => s.phase;
const selectNotices = (s: GameState) => s.notices;

export function GameHud({ store, t, locale, getHandle }: GameHudProps) {
  const phase = useGame(store, selectPhase);
  const runtime = useUiRuntime(getHandle, phase);
  const narrow = useNarrow();

  useEffect(() => {
    const w = window as unknown as {
      __parkfan_hud?: { commits: number; publishes: number; since: number; reset(): void };
    };
    HUD_METRICS.since = performance.now();
    w.__parkfan_hud = Object.assign(HUD_METRICS, {
      reset() {
        HUD_METRICS.commits = 0;
        HUD_METRICS.publishes = 0;
        HUD_METRICS.since = performance.now();
      },
    });
  }, []);

  if (phase === 'booting' || phase === 'failed') return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col" data-game-hud="">
      <div className={SCRIM_TOP} data-hud-scrim="" aria-hidden />
      <div className={SCRIM_BOTTOM} data-hud-scrim="" aria-hidden />
      {runtime ? (
        <HudBody
          runtime={runtime}
          store={store}
          t={t}
          locale={locale}
          narrow={narrow}
          getHandle={getHandle}
        />
      ) : (
        <FallbackBar t={t} />
      )}
    </div>
  );
}

function HudBody({
  runtime,
  store,
  t,
  locale,
  narrow,
  getHandle,
}: {
  runtime: UiRuntime;
  store: GameStore;
  t: Translate;
  locale: GameLocale;
  narrow: boolean;
  getHandle: () => GameHandle | null;
}) {
  const openIds = useChrome(
    runtime,
    useCallback(() => runtime.openPanels().join('|'), [runtime])
  );
  const menuOpen = useChrome(
    runtime,
    useCallback(() => runtime.menuOpen(), [runtime])
  );
  // The registry hands back a fresh array every call, so the comparison is what makes this
  // stable — not a revision counter, which would have to be bumped by hand and eventually
  // would not be.
  const allPanels = useChrome(
    runtime,
    useCallback(() => runtime.panels(), [runtime]),
    shallowEqual
  );
  const openPanels = useMemo(
    () =>
      openIds
        .split('|')
        .filter(Boolean)
        .map((id) => allPanels.find((p) => p.id === id))
        .filter((p): p is PanelDef => !!p),
    [openIds, allPanels]
  );

  useHudKeys(runtime, narrow);
  useCommitTally();

  // Whether the dock column is occupied, which is what the bottom cluster's right padding is
  // for. It is the panel host's own answer rather than `openPanels.length > 0`, because a panel
  // dragged out of the column frees the column and the cluster should have it back.
  const [dockOccupied, setDockOccupied] = useState(false);

  return (
    <>
      {/* Below `sm` the top row becomes three: the clock, the figures, the rail. The desktop
          arrangement needs 415 px of chrome in the 366 a 390 px phone leaves and lays the rail
          across the clock. */}
      <div
        className={cn(
          // `shrink-0`, because the clock is the one thing that may never be pushed off screen.
          // On a phone the bottom stack holds a panel sheet AND the build cluster, and a build
          // tray with five item rows in it is 512 px on its own: without this the column
          // overflowed upward and took the clock, the figures and the whole rail with it,
          // measured at 390 x 844 with the rail's top edge at -115 px.
          'flex shrink-0 gap-2 p-3',
          narrow ? 'flex-col' : 'items-start justify-between'
        )}
        data-hud-top=""
      >
        <div className={cn('flex min-w-0 items-start gap-2', narrow && 'w-full')}>
          <MenuButton runtime={runtime} t={t} />
          <ClockCluster runtime={runtime} t={t} narrow={narrow} />
        </div>
        {narrow ? (
          // Three rows on a phone, and the figures get one of their own. They used to ride at the
          // end of the clock's row, which fitted while the clock was a line of `text-sm` and 32 px
          // keys; a 44 px key and a sunk clock well put that row at 478 px in the 366 a 390 px
          // phone leaves, and what hung off the right edge was the money.
          <>
            <div className="flex w-full items-start">
              <StatCluster runtime={runtime} t={t} narrow />
            </div>
            <Rail runtime={runtime} panels={allPanels} openIds={openIds} narrow />
          </>
        ) : (
          <div className="flex min-w-0 flex-col items-end gap-2">
            <StatCluster runtime={runtime} t={t} narrow={false} />
            <Rail runtime={runtime} panels={allPanels} openIds={openIds} narrow={false} />
          </div>
        )}
      </div>

      {narrow ? null : (
        <PanelHost
          ui={runtime}
          store={store}
          t={t}
          locale={locale}
          panels={openPanels}
          narrow={false}
          onDockedChange={setDockOccupied}
        />
      )}

      {narrow ? <NoticeStack store={store} runtime={runtime} t={t} narrow /> : null}

      <div
        className="relative mt-auto flex min-h-0 flex-col items-center gap-2 p-3"
        data-hud-bottom=""
      >
        {narrow ? (
          <PanelHost ui={runtime} store={store} t={t} locale={locale} panels={openPanels} narrow />
        ) : (
          <NoticeStack store={store} runtime={runtime} t={t} narrow={false} />
        )}
        {/*
          ## The build cluster MOVES out of the dock's way. It may not be RESIZED out of it.

          The cluster is `tools`' and its two objects are `w-[min(64rem,100%)]` — a percentage of
          whatever box this line hands them. The version before this padded the box by the dock's
          width only while a panel was docked, so every panel a player opened or closed changed
          the palette's width, at every viewport under 64rem + the dock: 1024 px of tray became
          644 and five columns of tiles relaid out under the pointer.

          That is also the likeliest cause of the round-1 paint break, and the evidence is in the
          widths rather than in the heights the critique named: it reproduced at 1024, 1152 and
          1366 — every width where the tray's own `min()` resolves to the box rather than to
          64rem, i.e. exactly where the toggle resizes it — and not at 1440 or 1920, where the
          tray is 1024 in both states and the toggle only moves it. The DOM was right in the same
          run the pixels were wrong (`overflow: hidden`, box 339..696, every tile below 660
          clipped in layout), so nothing was mislaid out; a strip of the composited HUD layer over
          the WebGL canvas was simply never repainted after the resize.

          So the box has ONE width per viewport — `min(64rem, the row minus the dock)` — and the
          only thing the dock's state changes is a margin, which translates the cluster instead of
          reflowing it. `DOCK_RESERVE` is 300: the 288 px column plus the 12 px gap, measured
          inside this row's own padding.
        */}
        <div
          className={cn(
            'flex flex-col items-center',
            narrow ? 'w-full' : 'w-[min(64rem,calc(100%_-_300px))]',
            !narrow && dockOccupied && 'mr-[300px]'
          )}
        >
          <BuildBar t={t} locale={locale} getHandle={getHandle} />
        </div>
      </div>

      {menuOpen ? <MenuLayer runtime={runtime} t={t} locale={locale} /> : null}
    </>
  );
}

// ── the clock ─────────────────────────────────────────────────────────────────────────────
const selectClock = (s: ParkTelemetry) => ({
  day: s.day,
  minute: Math.floor(s.minute),
  speed: s.speed,
});

function clockEqual(a: ReturnType<typeof selectClock>, b: ReturnType<typeof selectClock>) {
  return a.day === b.day && a.minute === b.minute && a.speed === b.speed;
}

function ClockCluster({
  runtime,
  t,
  narrow,
}: {
  runtime: UiRuntime;
  t: Translate;
  narrow: boolean;
}) {
  const clock = useTelemetry(runtime, selectClock, clockEqual);
  useCommitTally();
  return (
    <div className={cn(TRAY, 'pointer-events-auto flex items-center gap-2 p-1.5')}>
      {/* The clock is a readout, so it is sunk, and the four speeds are keys, so they are raised.
          Told apart at a glance and before either is read: that is the whole point of the two
          materials, and the pair sits in one tray to say they belong to each other. */}
      <div className={cn(SINK, 'min-w-0 px-2.5 pt-1.5 pb-1.5', narrow ? 'w-[7rem]' : 'w-[9.5rem]')}>
        <div className={cn(HUD_VALUE, 'text-[21px] leading-none tracking-[0.01em]')}>
          {clockTime(clock.minute)}
        </div>
        <div className="mt-[3px] flex items-baseline gap-1.5 text-[11px] text-white/62">
          <span className="truncate tabular-nums">{t('hud.day', { day: clock.day })}</span>
          {clock.speed === 0 ? (
            <span className="ml-auto inline-flex items-center gap-1 text-(--game-warning)">
              <span className="size-1.5 animate-pulse rounded-full bg-(--game-warning)" />
              <span className={cn(HUD_LABEL, 'text-(--game-warning)')}>{t('hud.paused')}</span>
            </span>
          ) : null}
        </div>
        <DayStrip minute={clock.minute} className="mt-[6px]" />
      </div>
      <div className="flex items-center gap-1">
        {SPEEDS.filter((s) => !narrow || s.speed !== 5).map(({ speed, key, icon: Icon }) => (
          <HudIconButton
            key={speed}
            label={t(key)}
            density="chrome"
            active={clock.speed === speed}
            onClick={() => runtime.setSpeed(speed)}
          >
            <Icon className="size-4" />
          </HudIconButton>
        ))}
      </div>
    </div>
  );
}

/**
 * The menu key, and it is a key on its own rather than a key in a tray.
 *
 * A one-button tray is a frame around nothing: the tray's job is to say that the things in it
 * belong together, and this one has nothing to belong to.
 */
function MenuButton({ runtime, t }: { runtime: UiRuntime; t: Translate }) {
  return (
    <div className="pointer-events-auto">
      <HudIconButton label={t('hud.menu')} density="chrome" onClick={() => runtime.setMenu(true)}>
        <MenuIcon className="size-4" />
      </HudIconButton>
    </div>
  );
}

// ── the figures ───────────────────────────────────────────────────────────────────────────
function StatCluster({
  runtime,
  t,
  narrow,
}: {
  runtime: UiRuntime;
  t: Translate;
  narrow: boolean;
}) {
  const stats = useChrome(
    runtime,
    useCallback(() => runtime.stats(), [runtime]),
    shallowEqual
  );
  const visible = narrow ? stats.filter((s) => s.phone !== false) : stats;
  if (visible.length === 0) return null;
  // Four figures in ONE tray, so the cluster reads as an instrument panel and the rail of keys
  // under it as a row of controls. Four separate chips read as four more buttons.
  return (
    <div className={cn(TRAY, 'pointer-events-auto flex items-stretch gap-1 p-1.5')}>
      {visible.map((def) => (
        <StatSlot key={def.id} runtime={runtime} def={def} />
      ))}
      <span className="sr-only">{t('hud.figures')}</span>
    </div>
  );
}

function StatSlot({ runtime, def }: { runtime: UiRuntime; def: StatDef }) {
  const selector = useMemo(() => (s: ParkTelemetry) => def.value(s), [def]);
  const value = useTelemetry(runtime, selector, statEqual);
  useCommitTally();
  if (!value) return null;
  const tone: Tone = value.tone ?? 'neutral';
  const Icon = def.icon;
  return (
    <FigureTile
      className="min-w-[104px]"
      label={def.label}
      value={value.text}
      tone={tone}
      hint={value.hint ?? def.label}
      icon={Icon ? <Icon className="size-3.5" /> : undefined}
    />
  );
}

function statEqual(
  a: { text: string; tone?: string; hint?: string } | null,
  b: { text: string; tone?: string; hint?: string } | null
) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.text === b.text && a.tone === b.tone && a.hint === b.hint;
}

// ── the rail ──────────────────────────────────────────────────────────────────────────────
function Rail({
  runtime,
  panels,
  openIds,
  narrow,
}: {
  runtime: UiRuntime;
  panels: readonly PanelDef[];
  openIds: string;
  narrow: boolean;
}) {
  const railed = panels.filter((p) => p.rail !== false);
  if (railed.length === 0) return null;
  const open = new Set(openIds.split('|').filter(Boolean));
  const groups: PanelDef['group'][] = ['park', 'build', 'system'];
  return (
    <div
      className={cn(
        TRAY,
        'pointer-events-auto flex items-center gap-1 p-1.5',
        // On a phone the rail WRAPS rather than scrolls: a horizontal scroller hides half the
        // panels behind a gesture nobody is told about, and two rows of buttons hide nothing.
        narrow && 'max-w-full flex-wrap'
      )}
      data-hud-rail=""
    >
      {groups.map((group, index) => {
        const members = railed.filter((p) => (p.group ?? 'park') === group);
        if (members.length === 0) return null;
        return (
          <div key={group ?? index} className="flex items-center gap-1">
            {index > 0 ? <span className={cn(BELT_RULE, 'mx-1 h-6')} /> : null}
            {members.map((def) => (
              <RailButton key={def.id} runtime={runtime} def={def} active={open.has(def.id)} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function RailButton({
  runtime,
  def,
  active,
}: {
  runtime: UiRuntime;
  def: PanelDef;
  active: boolean;
}) {
  const selector = useMemo(() => (s: ParkTelemetry) => def.badge?.(s) ?? null, [def]);
  const badge = useTelemetry(runtime, selector);
  useCommitTally();
  const Icon = def.icon;
  return (
    <div className="relative shrink-0">
      <HudIconButton
        label={def.title}
        density="chrome"
        active={active}
        onClick={() => runtime.toggle(def.id)}
      >
        {Icon ? <Icon className="size-4" /> : <span className="text-[10px]">{def.title[0]}</span>}
      </HudIconButton>
      {/* The badge is a moulded cap on the key's corner, not a flat dot: it carries the same
          contour and the same top rim as everything else, so it reads as part of the object
          rather than as something drawn over it. */}
      {badge != null ? (
        <span className="pointer-events-none absolute -top-1 -right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-[9px] bg-[image:linear-gradient(180deg,var(--game-warning),var(--game-warning-deep))] px-1 text-[10.5px] font-bold text-[oklch(0.2_0.04_60)] tabular-nums shadow-[0_0_0_1.5px_var(--game-contour),0_1px_2px_rgb(0_0_0/0.5),inset_0_1px_0_rgb(255_255_255/0.35)]">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

// ── notices ───────────────────────────────────────────────────────────────────────────────
/**
 * The live notice stack, bottom left.
 *
 * An `info` notice puts itself away after twelve seconds; a warning or an error stays until it is
 * dismissed. Both are kept in the log panel either way, which is what makes the auto-dismiss safe
 * — the graphics-preset notice used to sit on screen for the whole session because nothing
 * remembered it once it was gone.
 */
const AUTO_DISMISS_MS = 12000;

/**
 * Notices that describe a condition rather than an event, and are retracted when it ends.
 *
 * `sim:timeout` is core's: the host gives the worker eight seconds to answer `ready` and warns
 * when it has not. On this project's own screenshot harness a boot takes twenty to thirty seconds
 * under SwiftShader, so the deadline passes on a park whose simulation is perfectly alive — and
 * the result is a notice reading "The simulation did not start. The park is shown, but guests and
 * rides are paused." sitting eight hundred pixels from a panel reporting 1,441 guests, 4/4 rides
 * running and 356 rides taken today. That frame is in the report.
 *
 * The HUD is the one place that can see both halves, so it retracts the notice the moment a frame
 * arrives. It is a repair, not the fix: core still leaves `phase` at `reduced` for the rest of the
 * session, and `docs/game/requests/ui.md` asks for the deadline to be re-armed and the notice
 * withdrawn where it was raised. The entry stays in the messages panel either way, so nothing is
 * hidden — it just stops claiming to be true.
 */
const RETRACTED_WHEN_LIVE = new Set(['sim:timeout']);

const selectLive = (s: ParkTelemetry) => s.live;

function NoticeStack({
  store,
  runtime,
  t,
  narrow,
}: {
  store: GameStore;
  runtime: UiRuntime;
  t: Translate;
  narrow: boolean;
}) {
  const notices = useGame(store, selectNotices);
  const live = useTelemetry(runtime, selectLive);
  useCommitTally();
  const timers = useRef(new Map<number, number>());

  useEffect(() => {
    runtime.ingestNotices(notices);
  }, [notices, runtime]);

  useEffect(() => {
    if (!live) return;
    for (const notice of notices) {
      if (RETRACTED_WHEN_LIVE.has(notice.text)) store.dismiss(notice.id);
    }
  }, [live, notices, store]);

  useEffect(() => {
    for (const notice of notices) {
      if (notice.level !== 'info' || timers.current.has(notice.id)) continue;
      const id = window.setTimeout(() => {
        timers.current.delete(notice.id);
        store.dismiss(notice.id);
      }, AUTO_DISMISS_MS);
      timers.current.set(notice.id, id);
    }
    const pending = timers.current;
    return () => {
      for (const handle of pending.values()) window.clearTimeout(handle);
      pending.clear();
    };
  }, [notices, store]);

  if (notices.length === 0) return null;
  return (
    <div
      className={cn(
        'pointer-events-none flex flex-col-reverse gap-1.5',
        // Bottom left on a desktop, and anchored to the TOP EDGE OF THE BUILD CLUSTER rather
        // than to the window: the cluster is a tray plus a toolbelt and its height changes when a
        // category opens, so a notice measured off the bottom of the screen ends up under the
        // palette on the frame it is most worth reading. `bottom-full` inside the cluster's own
        // box also means a notice never pushes the bar down, which a flow item would.
        //
        // On a phone the bottom belongs to the build bar and to whatever panel is open, so a
        // notice goes under the rail instead — and it goes there IN FLOW. It was `top-[6.75rem]`,
        // a number measured off the old chrome, and when the clock tray lost 10 px in this round
        // the notice landed on the figures. A measured offset into somebody else's stack is a
        // number that has to be re-measured every time that stack changes, and this is the second
        // time it was not.
        narrow
          ? 'mx-3 shrink-0'
          : 'absolute bottom-full left-3 z-20 mb-2 w-[19rem] max-w-[calc(100vw-1.5rem)]'
      )}
      data-hud-notices=""
    >
      {notices.map((notice) => (
        <NoticeLine
          key={notice.id}
          notice={notice}
          t={t}
          onDismiss={() => store.dismiss(notice.id)}
        />
      ))}
    </div>
  );
}

function NoticeLine({
  notice,
  t,
  onDismiss,
}: {
  notice: Notice;
  t: Translate;
  onDismiss: () => void;
}) {
  const text = noticeText(t, notice);
  const tone: Tone =
    notice.level === 'error' ? 'bad' : notice.level === 'warning' ? 'warn' : 'neutral';
  return (
    <div
      className={cn(
        TRAY,
        'pointer-events-auto flex items-start gap-2.5 px-3 py-2.5 text-xs leading-[1.42]'
      )}
      role="status"
    >
      {notice.level === 'info' ? (
        <Info className="mt-px size-4 shrink-0 text-white/45" />
      ) : (
        <AlertTriangle className={cn('mt-px size-4 shrink-0', TONE_TEXT[tone])} />
      )}
      <span className="min-w-0 flex-1 text-white/80">{text}</span>
      <button
        type="button"
        aria-label={t('panel.close')}
        onClick={onDismiss}
        className="-m-1 shrink-0 rounded p-1 text-white/45 transition-colors hover:text-white/90"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ── menu ──────────────────────────────────────────────────────────────────────────────────
const selectMenuClock = (s: ParkTelemetry) => ({
  day: s.day,
  minute: Math.floor(s.minute),
  speed: s.speed,
});

function MenuLayer({
  runtime,
  t,
  locale,
}: {
  runtime: UiRuntime;
  t: Translate;
  locale: GameLocale;
}) {
  const clock = useTelemetry(runtime, selectMenuClock, clockEqual);
  const parkName = runtime.world().meta.name || t('app.title');
  return (
    <GameMenu
      runtime={runtime}
      t={t}
      locale={locale}
      parkName={parkName}
      day={clock.day}
      minute={clock.minute}
      speed={clock.speed}
    />
  );
}

// ── the fallback ──────────────────────────────────────────────────────────────────────────
/**
 * What is drawn when the `ui` module itself did not start.
 *
 * Core wraps every `main()` in a try/catch and replaces a module that threw with a stub, so this
 * component's own engine half can be missing while the component is mounted. One line that says
 * so beats an empty screen that looks like a HUD nobody wrote.
 */
function FallbackBar({ t }: { t: Translate }) {
  return (
    <div className="flex items-start gap-2 p-3">
      <div className={cn(TRAY, 'pointer-events-auto flex items-center gap-2 px-3 py-2')}>
        <Link
          href="/"
          className="text-white/55 transition-colors hover:text-white"
          title={t('hud.back')}
        >
          <ArrowLeft className="size-3.5" />
        </Link>
        <StatusDot tone="warn" />
        <span className="text-[11px] text-white/75">{t('module.failed', { id: 'ui' })}</span>
      </div>
    </div>
  );
}

// ── plumbing ──────────────────────────────────────────────────────────────────────────────
/**
 * Reach the `ui` module's own handle.
 *
 * The HUD is mounted by `core/game-app.tsx` before the host has resolved, and the host is what
 * creates the module handles — so the runtime cannot be a prop. It is polled for until it appears
 * and then held; a `ui` module that failed to start never appears, and {@link FallbackBar} is what
 * the reader gets.
 */
function useUiRuntime(getHandle: () => GameHandle | null, phase: string): UiRuntime | null {
  const [runtime, setRuntime] = useState<UiRuntime | null>(null);

  useEffect(() => {
    if (phase === 'booting' || phase === 'failed') return;
    let timer = 0;
    const attach = (): boolean => {
      const api = getHandle()?.module<UiRuntime>('ui') ?? null;
      if (!api || typeof api.attachHost !== 'function') return false;
      api.attachHost(getHandle);
      setRuntime(api);
      return true;
    };
    if (attach()) return;
    timer = window.setInterval(() => {
      if (attach()) window.clearInterval(timer);
    }, 150);
    return () => window.clearInterval(timer);
  }, [phase, getHandle]);

  return runtime;
}

/**
 * The HUD's own keys, chosen to miss the ones `tools` and `camera` already take.
 *
 * `camera` holds WASD, QE, the arrows, PageUp/Down and +/−; `tools` holds R, G, Delete, Ctrl+Z/Y
 * and Escape. What is left and worth having is Space for the pause, the digits for the speeds and
 * F1 for the controls. Escape is shared on purpose: it closes whatever the HUD has open and, when
 * the HUD has nothing open, opens the menu — `tools` also sees it and clears its selection, which
 * is the same gesture meaning the same thing at two levels.
 */
function useHudKeys(runtime: UiRuntime, narrow: boolean): void {
  useEffect(() => {
    if (narrow) return;
    const typing = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el?.tagName) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    };
    const onKey = (ev: KeyboardEvent) => {
      if (typing(ev.target) || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      switch (ev.code) {
        case 'Space': {
          // Space also activates a focused button; only take it when nothing is focused.
          const active = document.activeElement;
          if (active && active !== document.body && active.tagName !== 'CANVAS') return;
          ev.preventDefault();
          const speed = runtime.telemetry().speed;
          runtime.setSpeed(speed === 0 ? 1 : 0);
          break;
        }
        case 'Digit1':
          runtime.setSpeed(0);
          break;
        case 'Digit2':
          runtime.setSpeed(1);
          break;
        case 'Digit3':
          runtime.setSpeed(3);
          break;
        case 'Digit4':
          runtime.setSpeed(5);
          break;
        case 'F1':
          ev.preventDefault();
          runtime.toggle('help');
          break;
        case 'Escape': {
          // The menu closes itself, because closing it also restores the speed it paused.
          if (runtime.menuOpen()) break;
          const open = runtime.openPanels();
          if (open.length > 0) runtime.close(open[open.length - 1]);
          else runtime.setMenu(true);
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runtime, narrow]);
}
