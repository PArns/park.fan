'use client';

/**
 * The HUD: the chrome around a running park.
 *
 * Four clusters and nothing loose. Top left is **when** — the day, the clock, the day strip and
 * the speed control. Top right is **how it is going** — the figures, drawn from the stat registry
 * rather than from a list in this file, and the rail that opens panels. Bottom centre is the build
 * bar, which belongs to `tools`. Bottom left is the notice stack, above the camera module's
 * compass and clear of the build bar.
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
 * The React Profiler around the tree is deliberate and stays: it is how the commit rate in the
 * report was measured, it costs one function call per commit, and a HUD over a 60 fps canvas is
 * exactly the kind of thing that regresses silently.
 */

import { Profiler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { clockTime } from './format';
import { shallowEqual, useChrome, useGame, useNarrow, useTelemetry } from './hooks';
import { GameMenu } from './menu';
import { PanelHost } from './panel-host';
import { DayStrip } from './panels/park';
import { HudIconButton, StatusDot } from './parts';
import type { UiRuntime } from './runtime';
import type { ParkTelemetry } from './telemetry';
import { HUD_CHIP, HUD_LABEL, SCRIM_BOTTOM, SCRIM_TOP, TONE_TEXT, type Tone } from './surface';

export interface GameHudProps {
  store: GameStore;
  t: Translate;
  locale: GameLocale;
  getHandle: () => GameHandle | null;
}

/**
 * Commit counter, read by the measurement run in the report.
 *
 * A number nobody can reproduce is not a number, so it is published on `window.__parkfan_hud`
 * beside core's own harness object rather than logged.
 */
const commits = { total: 0, actual: 0, since: 0 };

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
    const w = window as unknown as { __parkfan_hud?: typeof commits & { reset(): void } };
    w.__parkfan_hud = Object.assign(commits, {
      reset() {
        commits.total = 0;
        commits.actual = 0;
        commits.since = performance.now();
      },
    });
    commits.since = performance.now();
  }, []);

  const onRender = useCallback((_id: string, _phase: string, actual: number) => {
    commits.total += 1;
    commits.actual += actual;
  }, []);

  if (phase === 'booting' || phase === 'failed') return null;

  return (
    <Profiler id="game-hud" onRender={onRender}>
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col" data-game-hud="">
        <div className={SCRIM_TOP} aria-hidden />
        <div className={SCRIM_BOTTOM} aria-hidden />
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
    </Profiler>
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

  return (
    <>
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="flex min-w-0 items-start gap-2">
          <MenuButton runtime={runtime} t={t} />
          <ClockCluster runtime={runtime} t={t} narrow={narrow} />
        </div>
        <div className="flex min-w-0 flex-col items-end gap-2">
          <StatCluster runtime={runtime} t={t} narrow={narrow} />
          <Rail runtime={runtime} panels={allPanels} openIds={openIds} narrow={narrow} />
        </div>
      </div>

      <PanelHost
        ui={runtime}
        store={store}
        t={t}
        locale={locale}
        panels={openPanels}
        narrow={narrow}
      />

      <NoticeStack store={store} runtime={runtime} t={t} narrow={narrow} />

      <div className="mt-auto flex flex-col items-center gap-2 p-3">
        <BuildBar t={t} locale={locale} getHandle={getHandle} />
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
  return (
    <div className={cn(HUD_CHIP, 'pointer-events-auto px-3 py-1.5')}>
      <div className="flex items-center gap-2.5">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-white/95 tabular-nums">
              {clockTime(clock.minute)}
            </span>
            <span className="text-[11px] text-white/55 tabular-nums">
              {t('hud.day', { day: clock.day })}
            </span>
          </div>
          <DayStrip minute={clock.minute} className="mt-1 w-[5.5rem]" />
        </div>
        <div className="flex items-center gap-0.5 border-l border-white/10 pl-2">
          {SPEEDS.filter((s) => !narrow || s.speed !== 5).map(({ speed, key, icon: Icon }) => (
            <HudIconButton
              key={speed}
              label={t(key)}
              dense
              active={clock.speed === speed}
              onClick={() => runtime.setSpeed(speed)}
            >
              <Icon className="size-3.5" />
            </HudIconButton>
          ))}
        </div>
      </div>
      {clock.speed === 0 ? (
        <div className="mt-1 flex items-center gap-1.5 border-t border-white/10 pt-1">
          <span className="size-1.5 animate-pulse rounded-full bg-(--game-warning)" />
          <span className={cn(HUD_LABEL, 'text-(--game-warning)')}>{t('hud.paused')}</span>
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({ runtime, t }: { runtime: UiRuntime; t: Translate }) {
  return (
    <div className={cn(HUD_CHIP, 'pointer-events-auto p-1')}>
      <HudIconButton label={t('hud.menu')} dense onClick={() => runtime.setMenu(true)}>
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
  return (
    <div className={cn(HUD_CHIP, 'pointer-events-auto flex items-center gap-3 px-3 py-1.5')}>
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
  if (!value) return null;
  const tone: Tone = value.tone ?? 'neutral';
  const Icon = def.icon;
  return (
    <div className="flex min-w-0 items-center gap-1.5" title={value.hint ?? def.label}>
      {Icon ? <Icon className="size-3.5 shrink-0 text-white/35" /> : null}
      <div className="min-w-0">
        <div
          className={cn(
            'truncate tabular-nums',
            def.size === 'lg' ? 'text-sm font-semibold' : 'text-xs font-medium',
            TONE_TEXT[tone]
          )}
        >
          {value.text}
        </div>
        <div className={cn(HUD_LABEL, 'truncate')}>{def.label}</div>
      </div>
    </div>
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
        HUD_CHIP,
        'pointer-events-auto flex items-center gap-0.5 p-1',
        narrow && 'max-w-[calc(100vw-1.5rem)] overflow-x-auto'
      )}
      data-hud-rail=""
    >
      {groups.map((group, index) => {
        const members = railed.filter((p) => (p.group ?? 'park') === group);
        if (members.length === 0) return null;
        return (
          <div key={group ?? index} className="flex items-center gap-0.5">
            {index > 0 ? <span className="mx-1 h-5 w-px shrink-0 bg-white/10" /> : null}
            {members.map((def) => (
              <RailButton
                key={def.id}
                runtime={runtime}
                def={def}
                active={open.has(def.id)}
                narrow={narrow}
              />
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
  narrow,
}: {
  runtime: UiRuntime;
  def: PanelDef;
  active: boolean;
  narrow: boolean;
}) {
  const selector = useMemo(() => (s: ParkTelemetry) => def.badge?.(s) ?? null, [def]);
  const badge = useTelemetry(runtime, selector);
  const Icon = def.icon;
  return (
    <div className="relative shrink-0">
      <HudIconButton
        label={def.title}
        dense={!narrow}
        active={active}
        onClick={() => runtime.toggle(def.id)}
        className={narrow ? 'size-10' : undefined}
      >
        {Icon ? <Icon className="size-4" /> : <span className="text-[10px]">{def.title[0]}</span>}
      </HudIconButton>
      {badge != null ? (
        <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-(--game-warning) px-1 text-[9px] font-bold text-black tabular-nums">
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
  const timers = useRef(new Map<number, number>());

  useEffect(() => {
    runtime.ingestNotices(notices);
  }, [notices, runtime]);

  useEffect(() => {
    for (const notice of notices) {
      if (notice.level !== 'info' || timers.current.has(notice.id)) continue;
      const id = window.setTimeout(() => {
        timers.current.delete(notice.id);
        store.dismiss(notice.id);
      }, AUTO_DISMISS_MS);
      timers.current.set(notice.id, id);
    }
    const live = timers.current;
    return () => {
      for (const handle of live.values()) window.clearTimeout(handle);
      live.clear();
    };
  }, [notices, store]);

  if (notices.length === 0) return null;
  return (
    <div
      className={cn(
        'pointer-events-none absolute bottom-16 left-3 z-20 flex w-[19rem] max-w-[calc(100vw-1.5rem)] flex-col-reverse gap-1.5',
        narrow && 'bottom-28'
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
  const key = `notice.${notice.text}` as GameStringKey;
  const translated = t(key);
  const text = translated === key ? notice.text : translated;
  const tone: Tone =
    notice.level === 'error' ? 'bad' : notice.level === 'warning' ? 'warn' : 'neutral';
  return (
    <div
      className={cn(
        HUD_CHIP,
        'pointer-events-auto flex items-start gap-2 px-2.5 py-2 text-[11px] leading-snug'
      )}
      role="status"
    >
      {notice.level === 'info' ? (
        <Info className="mt-px size-3.5 shrink-0 text-white/40" />
      ) : (
        <AlertTriangle className={cn('mt-px size-3.5 shrink-0', TONE_TEXT[tone])} />
      )}
      <span className="min-w-0 flex-1 text-white/80">{text}</span>
      <button
        type="button"
        aria-label={t('panel.close')}
        onClick={onDismiss}
        className="-m-1 shrink-0 rounded p-1 text-white/35 transition-colors hover:text-white/80"
      >
        <X className="size-3" />
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
      <div className={cn(HUD_CHIP, 'pointer-events-auto flex items-center gap-2 px-3 py-2')}>
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
