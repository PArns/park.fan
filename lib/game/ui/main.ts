'use client';

/**
 * The `ui` module's main handle: it creates the runtime, registers what `ui` itself contributes,
 * and drives the telemetry publish off the render loop.
 *
 * It is reached through a dynamic import from `module.ts` for the same reason every other module
 * does it — `lib/game/modules.ts` is loaded on the worker, and this file pulls in React and nine
 * panels. The worker never runs the import; the bundler keeps them in their own chunk.
 *
 * ## The park panel opens on boot on a desktop, and does not on a phone
 *
 * A HUD whose panels are all shut is a HUD a first-time player has no reason to believe has
 * anything in it. The overview is the one panel that is right for every park at every minute, and
 * closing it is one click that sticks for the session. At 1920 x 1080 it costs 5.6 % of the frame
 * and the park still has two thirds of it.
 *
 * Below `sm` there is no column: the panel is a SHEET, 58svh of an 844 px phone, and opening it on
 * boot means the first thing a player sees on a phone is a wall of figures over the park they came
 * for. Measured at 390 x 844: 82.5 % of the frame with the sheet up against 68.4 % without it, and
 * the missing 14 points are the park. So the phone starts with the rail — nine lit keys with the
 * park's own among them — and the park.
 *
 * `matchMedia` here is a main-thread call inside `main()`, not module scope: `module.ts` reaches
 * this file through a dynamic import that only ever runs on the main thread.
 */

import { Coins, Hourglass, Smile, Users } from 'lucide-react';
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
  if (!matchesPhone()) runtime.open('park');

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

/** The same breakpoint `useNarrow()` watches, asked once, at boot. */
function matchesPhone(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(max-width: 639.98px)').matches;
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
      icon: Coins,
      order: 10,
      size: 'lg',
      value: (s) => ({ text: moneyWhole(s.totals.cash, locale) }),
    }),
    /**
     * Off the bar below `sm`, with the mood and the queue.
     *
     * Measured at 390 px: the menu button, the clock with its three speeds and a two-figure stat
     * chip come to 396 px of chrome in 378 px of usable width, and the guest count was the figure
     * hanging off the right edge. The money is the headline on a phone and the crowd is one tap
     * away in the park panel, which draws it four ways.
     */
    runtime.registerStat({
      id: 'guests',
      label: t('hud.guests'),
      icon: Users,
      order: 20,
      phone: false,
      value: (s) => ({ text: count(s.totals.guests, locale) }),
    }),
    runtime.registerStat({
      id: 'happiness',
      label: t('park.happiness'),
      icon: Smile,
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
      icon: Hourglass,
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
