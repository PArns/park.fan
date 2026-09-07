'use client';

/**
 * The `ui` module's main handle: it creates the runtime, registers what `ui` itself contributes,
 * and drives the telemetry publish off the render loop.
 *
 * It is reached through a dynamic import from `module.ts` for the same reason every other module
 * does it — `lib/game/modules.ts` is loaded on the worker, and this file pulls in React and nine
 * panels. The worker never runs the import; the bundler keeps them in their own chunk.
 *
 * ## The park panel opens on boot, and the reason is not the screenshot
 *
 * A HUD whose panels are all shut is a HUD a first-time player has no reason to believe has
 * anything in it. The overview is the one panel that is right for every park at every minute, it
 * is 344 px of a 1920 px frame, and closing it is one click that sticks for the session. Every
 * other panel starts shut.
 */

import type { MainContext, MainHandle, SimFrame } from '../core/types';
import { createTranslator, resolveGameLocale } from '../i18n';
import { moneyWhole, count } from './format';
import { registerBuiltinPanels } from './panels';
import { UiRuntime } from './runtime';

export function createUiMain(ctx: MainContext): MainHandle {
  const locale = resolveGameLocale(ctx.locale);
  const t = createTranslator(locale);
  const runtime = new UiRuntime(ctx, t);
  const offPanels = registerBuiltinPanels(runtime, t);
  const offStats = registerBuiltinStats(runtime, t, locale);
  runtime.open('park');

  return {
    api: runtime,
    onFrame(frame: SimFrame) {
      runtime.onFrame(frame);
    },
    onEnvironment(env) {
      runtime.onEnvironment(env);
    },
    onRender() {
      runtime.pump(performance.now());
    },
    dispose() {
      offStats();
      offPanels();
      runtime.dispose();
    },
  };
}

/**
 * The figures in the top bar, registered through the same registry a module would use.
 *
 * There is no park rating among them and that is not an oversight: `DayLedger.rating` is written
 * as a zero by `core/module.ts` and computed by nobody, since `management` is a scaffold. When it
 * lands it registers one of these and appears in the bar with no edit here — which is the whole
 * argument for the registry, tested on the one figure that is actually missing.
 */
function registerBuiltinStats(
  runtime: UiRuntime,
  t: ReturnType<typeof createTranslator>,
  locale: string
): () => void {
  const offs = [
    runtime.registerStat({
      id: 'cash',
      label: t('hud.cash'),
      order: 10,
      size: 'lg',
      value: (s) => ({ text: moneyWhole(s.totals.cash, locale) }),
    }),
    runtime.registerStat({
      id: 'guests',
      label: t('hud.guests'),
      order: 20,
      value: (s) => ({ text: count(s.totals.guests, locale) }),
    }),
    runtime.registerStat({
      id: 'happiness',
      label: t('park.happiness'),
      order: 30,
      phone: false,
      value: (s) =>
        s.totals.happiness < 0
          ? null
          : {
              text: String(Math.round(s.totals.happiness)),
              tone: s.totals.happiness >= 65 ? 'good' : s.totals.happiness >= 40 ? 'warn' : 'bad',
              hint: t('park.happiness.hint'),
            },
    }),
    runtime.registerStat({
      id: 'queue',
      label: t('park.queueing'),
      order: 40,
      phone: false,
      value: (s) =>
        s.totals.queued > 0
          ? {
              text: count(s.totals.queued, locale),
              tone: s.totals.queued > s.totals.guests * 0.5 ? 'warn' : 'neutral',
            }
          : null,
    }),
  ];
  return () => {
    for (const off of offs) off();
  };
}
