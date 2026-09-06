'use client';

/**
 * The HUD: the top bar (clock, cash, speed, engine badge), the build bar and the notice stack.
 *
 * Still the `ui` module's placeholder shell in everything except the build bar — panels, the
 * radial menu and the inspector are the ui builder's, on these same props. The `tools` builder was
 * granted this file for one edit and made exactly that one: `<BuildBar />` in the bottom row, above
 * the notices. Everything it draws lives in `lib/game/tools/`.
 */

import Link from 'next/link';
import { Pause, Play, FastForward, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GameStore } from '../core/store';
import { useGameStore } from '../core/use-game-store';
import type { GameHandle } from '../core/host';
import { BuildBar } from '../tools/build-bar';
import type { GameLocale, GameStringKey, Translate } from '../i18n';
import type { Speed } from '../core/types';

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
];

export function GameHud({ store, t, locale, getHandle }: GameHudProps) {
  const phase = useGameStore(store, (s) => s.phase);
  const clock = useGameStore(store, (s) => s.clock);
  const cash = useGameStore(store, (s) => s.cash);
  const metrics = useGameStore(store, (s) => s.metrics);
  const engine = useGameStore(store, (s) => s.engine);
  const notices = useGameStore(store, (s) => s.notices);
  if (phase === 'booting' || phase === 'failed') return null;
  const hh = String(Math.floor(clock.minute / 60)).padStart(2, '0');
  const mm = String(Math.floor(clock.minute % 60)).padStart(2, '0');
  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cash / 100);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col" data-game-hud="">
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-(--game-hud-radius) border border-white/10 bg-(--game-hud) px-3 py-2 shadow-lg backdrop-blur-xl">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
            title={t('hud.back')}
          >
            <ArrowLeft className="size-3.5" />
          </Link>
          <span className="text-sm font-semibold tabular-nums">
            {t('hud.day', { day: clock.day })}
          </span>
          <span className="text-muted-foreground text-sm tabular-nums">
            {hh}:{mm}
          </span>
          <div className="ml-1 flex items-center gap-0.5">
            {SPEEDS.map(({ speed, key, icon: Icon }) => (
              <Button
                key={speed}
                size="icon-sm"
                variant={clock.speed === speed ? 'default' : 'ghost'}
                className={cn(
                  'size-7 max-sm:size-8',
                  clock.speed === speed && 'shadow-[0_0_0_1px_var(--game-accent)]'
                )}
                title={t(key)}
                onClick={() => getHandle()?.setSpeed(speed)}
              >
                <Icon className="size-3.5" />
              </Button>
            ))}
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2 rounded-(--game-hud-radius) border border-white/10 bg-(--game-hud) px-3 py-2 shadow-lg backdrop-blur-xl">
          <span className="text-muted-foreground text-xs">{t('hud.cash')}</span>
          <span className="text-sm font-semibold tabular-nums">{money}</span>
          <span className="text-muted-foreground ml-2 text-xs">{t('hud.guests')}</span>
          <span className="text-sm font-semibold tabular-nums">{metrics.guests}</span>
          <Badge
            variant="outline"
            className="ml-2 border-white/15 text-[10px] tabular-nums"
            title={`${metrics.drawCalls} draw calls · ${metrics.triangles} tris · sim ${metrics.simTickMs.toFixed(1)} ms`}
          >
            {engine === 'webgpu' ? t('hud.engine.webgpu') : t('hud.engine.webgl2')} ·{' '}
            {Math.round(metrics.fps)} {t('hud.fps')}
          </Badge>
        </div>
      </div>
      <div className="mt-auto flex flex-col items-center gap-2 p-3">
        <BuildBar t={t} locale={locale} getHandle={getHandle} />
        {notices.map((n) => (
          <div
            key={n.id}
            className={cn(
              'pointer-events-auto rounded-md border border-white/10 bg-(--game-hud) px-3 py-1.5 text-xs backdrop-blur-xl',
              n.level === 'warning' && 'text-(--game-warning)',
              n.level === 'error' && 'text-(--game-danger)'
            )}
            onClick={() => store.dismiss(n.id)}
            role="status"
          >
            {t(`notice.${n.text}` as GameStringKey) === `notice.${n.text}`
              ? n.text
              : t(`notice.${n.text}` as GameStringKey)}
          </div>
        ))}
      </div>
    </div>
  );
}
