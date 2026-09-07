'use client';

/**
 * Settings, saves, the notification history and the controls sheet.
 *
 * ## The graphics preset restarts the park, and the panel says so
 *
 * The preset is chosen once, at boot, from the device's own capabilities (`core/capabilities.ts`)
 * and is baked into the engine, the shadow generator and every material's quality branch. There
 * is no live path to change it, and pretending otherwise with a dropdown that quietly does
 * nothing would be worse than the reload. So the four buttons navigate to `?quality=…`, which is
 * the override the boot query already understands, and the line under them says what that costs.
 * The seed and the park type travel with it, so the park that comes back is the same park.
 *
 * ## Saving is core's, not `persistence`'s, and this is the stopgap
 *
 * `handle.save()` asks the worker for a snapshot and `handle.load(json)` puts one back; both work
 * today. What does not exist is anywhere to keep it — `lib/game/persistence` is a scaffold — so
 * this panel exports and imports a file, copies the JSON, and keeps ONE slot in `localStorage`.
 * That is deliberately the smallest thing that makes the game finishable in a session, and the
 * request in `docs/game/requests/ui.md` names what should replace it: an IndexedDB slot list with
 * thumbnails and a save name, which is `persistence`'s job and not the HUD's.
 */

import { useCallback, useRef, useState } from 'react';
import { ClipboardCopy, Download, FolderOpen, Loader2, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Capabilities, QualityPreset } from '../../core/types';
import type { GameState } from '../../core/store';
import type { PanelBodyProps } from '../api';
import { clockTime, count, logAge, minutesSince } from '../format';
import { useGame, useTelemetrySnapshot } from '../hooks';
import { DataRow, EmptyNote, HudButton, Section, StatusDot } from '../parts';
import { HUD_LABEL, HUD_WELL } from '../surface';
import type { GameStringKey } from '../../i18n';
import type { UiRuntime } from '../runtime';

const PRESETS: QualityPreset[] = ['low', 'medium', 'high', 'ultra'];
const QUICK_SLOT = 'parkfan-coaster:quicksave';

const selectEngine = (s: GameState) => s.engine;
const selectPreset = (s: GameState) => s.preset;
const selectCaps = (s: GameState): Capabilities | null => s.capabilities;
const selectFailed = (s: GameState) => s.failedModules.join(',');
const selectMetrics = (s: GameState) => ({
  fps: Math.round(s.metrics.fps),
  drawCalls: s.metrics.drawCalls,
  triangles: s.metrics.triangles,
  simTickMs: Math.round(s.metrics.simTickMs * 100) / 100,
  activeMeshes: s.metrics.activeMeshes,
});

function metricsEqual(
  a: ReturnType<typeof selectMetrics>,
  b: ReturnType<typeof selectMetrics>
): boolean {
  return (
    a.fps === b.fps &&
    a.drawCalls === b.drawCalls &&
    a.triangles === b.triangles &&
    a.simTickMs === b.simTickMs &&
    a.activeMeshes === b.activeMeshes
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────────────────
export function SettingsPanel({ t, locale, store }: PanelBodyProps) {
  const engine = useGame(store, selectEngine);
  const preset = useGame(store, selectPreset);
  const caps = useGame(store, selectCaps);
  const failed = useGame(store, selectFailed);
  const metrics = useGame(store, selectMetrics, metricsEqual);

  const applyPreset = useCallback((next: QualityPreset) => {
    const url = new URL(window.location.href);
    url.searchParams.set('quality', next);
    window.location.assign(url.toString());
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <Section label={t('settings.renderer')}>
        <DataRow
          label={t('settings.engine')}
          value={engine === 'webgpu' ? t('hud.engine.webgpu') : t('hud.engine.webgl2')}
        />
        <DataRow
          label={t('settings.preset')}
          value={t(`settings.preset.${preset}` as GameStringKey)}
        />
        {caps ? (
          <>
            <DataRow label={t('settings.cores')} value={caps.cores} />
            <DataRow label={t('settings.dpr')} value={caps.dpr.toFixed(2)} />
            <DataRow
              label={t('settings.device')}
              value={caps.mobile ? t('settings.device.touch') : t('settings.device.desk')}
            />
          </>
        ) : null}
      </Section>

      <Section label={t('settings.quality')}>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((option) => (
            <HudButton
              key={option}
              variant={option === preset ? 'default' : 'ghost'}
              onClick={() => applyPreset(option)}
            >
              {t(`settings.preset.${option}` as GameStringKey)}
            </HudButton>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-white/45">{t('settings.qualityNote')}</p>
      </Section>

      <Section label={t('settings.metrics')}>
        <DataRow label={t('hud.fps')} value={metrics.fps} />
        <DataRow label={t('settings.drawCalls')} value={count(metrics.drawCalls, locale)} />
        <DataRow label={t('settings.triangles')} value={count(metrics.triangles, locale)} />
        <DataRow label={t('settings.meshes')} value={count(metrics.activeMeshes, locale)} />
        <DataRow label={t('settings.simTick')} value={`${metrics.simTickMs.toFixed(2)} ms`} />
      </Section>

      {failed ? (
        <Section label={t('settings.failed')}>
          <p className="text-[11px] leading-relaxed text-(--game-warning)">
            {t('settings.failedNote', { list: failed.split(',').join(', ') })}
          </p>
        </Section>
      ) : null}
    </div>
  );
}

// ── Saves ─────────────────────────────────────────────────────────────────────────────────
type SaveStatus = { kind: 'idle' | 'busy' | 'done' | 'error'; message?: string };

export function SavesPanel({ t, ui }: PanelBodyProps) {
  const runtime = ui as UiRuntime;
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });
  // Read once, lazily, rather than in an effect: the panel only ever renders on the client, and
  // an effect that immediately calls `setState` is a second render for a value that was already
  // available.
  const [slotAt, setSlotAt] = useState<string | null>(() => readSlotStamp());
  const fileInput = useRef<HTMLInputElement>(null);

  const snapshot = useCallback(async (): Promise<string | null> => {
    const handle = runtime.handle();
    if (!handle) return null;
    setStatus({ kind: 'busy' });
    try {
      return await handle.save();
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }, [runtime]);

  const download = useCallback(async () => {
    const json = await snapshot();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parkfan-coaster-day${runtime.telemetry().day}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ kind: 'done', message: t('saves.exported') });
  }, [snapshot, runtime, t]);

  const copy = useCallback(async () => {
    const json = await snapshot();
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      setStatus({ kind: 'done', message: t('saves.copied') });
    } catch {
      setStatus({ kind: 'error', message: t('saves.clipboardBlocked') });
    }
  }, [snapshot, t]);

  const quickSave = useCallback(async () => {
    const json = await snapshot();
    if (!json) return;
    try {
      const at = new Date().toISOString();
      window.localStorage.setItem(QUICK_SLOT, json);
      window.localStorage.setItem(`${QUICK_SLOT}:at`, at);
      setSlotAt(at);
      setStatus({ kind: 'done', message: t('saves.saved') });
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }, [snapshot, t]);

  const load = useCallback(
    (json: string) => {
      const handle = runtime.handle();
      if (!handle) return;
      try {
        handle.load(json);
        runtime.resetAfterLoad();
        setStatus({ kind: 'done', message: t('saves.loaded') });
      } catch (error) {
        setStatus({
          kind: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [runtime, t]
  );

  const quickLoad = useCallback(() => {
    try {
      const json = window.localStorage.getItem(QUICK_SLOT);
      if (!json) {
        setStatus({ kind: 'error', message: t('saves.slotEmpty') });
        return;
      }
      load(json);
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }, [load, t]);

  return (
    <div className="flex flex-col gap-3">
      <Section label={t('saves.slot')}>
        <div className={cn(HUD_WELL, 'flex items-center gap-2 px-2.5 py-2')}>
          <StatusDot tone={slotAt ? 'good' : 'neutral'} />
          <span className="min-w-0 flex-1 truncate text-xs text-white/75">
            {slotAt ? new Date(slotAt).toLocaleString() : t('saves.slotEmpty')}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          <HudButton onClick={quickSave}>
            <Save className="size-3" />
            {t('saves.quickSave')}
          </HudButton>
          <HudButton onClick={quickLoad} disabled={!slotAt}>
            <RotateCcw className="size-3" />
            {t('saves.quickLoad')}
          </HudButton>
        </div>
      </Section>

      <Section label={t('saves.file')}>
        <div className="flex flex-wrap gap-1">
          <HudButton onClick={download}>
            <Download className="size-3" />
            {t('hud.export')}
          </HudButton>
          <HudButton onClick={copy}>
            <ClipboardCopy className="size-3" />
            {t('saves.copy')}
          </HudButton>
          <HudButton onClick={() => fileInput.current?.click()}>
            <FolderOpen className="size-3" />
            {t('hud.import')}
          </HudButton>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (ev) => {
            const file = ev.target.files?.[0];
            ev.target.value = '';
            if (!file) return;
            load(await file.text());
          }}
        />
        <p className="text-[11px] leading-relaxed text-white/45">{t('saves.note')}</p>
      </Section>

      {status.kind !== 'idle' ? (
        <p
          className={cn(
            'flex items-center gap-1.5 text-[11px]',
            status.kind === 'error' ? 'text-(--game-danger)' : 'text-white/60'
          )}
        >
          {status.kind === 'busy' ? <Loader2 className="size-3 animate-spin" /> : null}
          {status.kind === 'busy' ? t('saves.working') : status.message}
        </p>
      ) : null}
    </div>
  );
}

// ── The notification history ──────────────────────────────────────────────────────────────
export function LogPanel({ t, ui }: PanelBodyProps) {
  const runtime = ui as UiRuntime;
  const s = useTelemetrySnapshot(runtime);
  if (s.log.length === 0) return <EmptyNote>{t('log.empty')}</EmptyNote>;
  return (
    <ul className="flex flex-col gap-1">
      {s.log.map((entry) => (
        <li
          key={entry.seq}
          className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5"
        >
          <StatusDot
            className="mt-1"
            tone={
              entry.kind === 'error'
                ? 'bad'
                : entry.kind === 'warning' || entry.kind === 'ride'
                  ? 'warn'
                  : 'neutral'
            }
          />
          <span className="min-w-0 flex-1 text-[11px] leading-snug text-white/75">
            {entry.text}
          </span>
          <span
            className="shrink-0 text-[10px] text-white/35 tabular-nums"
            title={`${t('hud.day', { day: entry.day })} · ${clockTime(entry.minute)}`}
          >
            {logAge(minutesSince(entry, { day: s.day, minute: s.minute }))}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Controls ──────────────────────────────────────────────────────────────────────────────
const KEY_ROWS: { keys: string; key: GameStringKey }[] = [
  { keys: 'W A S D', key: 'help.pan' },
  { keys: 'Q E', key: 'help.turn' },
  { keys: 'Page ↑ ↓', key: 'help.tilt' },
  { keys: '+ −', key: 'help.zoom' },
  { keys: 'RMB', key: 'help.orbit' },
  { keys: 'R', key: 'help.rotate' },
  { keys: 'G', key: 'help.snap' },
  { keys: 'Del', key: 'help.demolish' },
  { keys: 'Ctrl Z', key: 'help.undo' },
  { keys: 'Esc', key: 'help.cancel' },
  { keys: 'Space', key: 'help.pause' },
  { keys: '1 2 3 4', key: 'help.speed' },
  { keys: 'F1', key: 'help.help' },
];

export function HelpPanel({ t }: PanelBodyProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] leading-relaxed text-white/55">{t('help.intro')}</p>
      <ul className="flex flex-col gap-0.5">
        {KEY_ROWS.map((row) => (
          <li key={row.keys} className="flex items-center gap-2 py-0.5">
            <kbd className="min-w-[4.5rem] rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-center text-[10px] font-medium tracking-wide text-white/80">
              {row.keys}
            </kbd>
            <span className="min-w-0 flex-1 text-xs text-white/65">{t(row.key)}</span>
          </li>
        ))}
      </ul>
      <p className={cn(HUD_LABEL, 'pt-1')}>{t('help.more')}</p>
      <p className="text-[11px] leading-relaxed text-white/45">{t('help.moreNote')}</p>
    </div>
  );
}

function readSlotStamp(): string | null {
  try {
    return window.localStorage.getItem(`${QUICK_SLOT}:at`);
  } catch {
    return null;
  }
}
