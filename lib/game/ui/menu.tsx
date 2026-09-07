'use client';

/**
 * The pause menu, which is also the main menu: there is only one park running, so a separate
 * title screen would be a screen with nothing on it that the game does not already have.
 *
 * It pauses on open and restores the previous speed on close, because a menu that leaves the park
 * running is a menu that costs the player money while they read it. The speed it restores is the
 * one that was set when it opened, not a default — pausing to read the controls and coming back at
 * 1× when you were at 3× is the small annoyance this avoids.
 *
 * The lockup is {@link BrandLockup}, the repo's one component that draws the pin and the wordmark
 * together with their sizes measured off the ink. `game-brand.tsx` makes the same argument for the
 * corner mark, and a second assembly here would be that geometry stored twice.
 */

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Keyboard, Play, Save, Settings2, Sparkles } from 'lucide-react';
import { BrandLockup } from '@/components/layout/brand-lockup';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Speed } from '../core/types';
import type { GameLocale, Translate } from '../i18n';
import { clockTime } from './format';
import { HUD_PANEL } from './surface';
import type { UiRuntime } from './runtime';

export interface GameMenuProps {
  runtime: UiRuntime;
  t: Translate;
  locale: GameLocale;
  parkName: string;
  day: number;
  minute: number;
  speed: Speed;
}

export function GameMenu({ runtime, t, parkName, day, minute, speed }: GameMenuProps) {
  const resumeSpeed = useRef<Speed>(speed === 0 ? 1 : speed);

  useEffect(() => {
    // Capture the speed the player was running at, then stop the park.
    if (speed !== 0) resumeSpeed.current = speed;
    runtime.setSpeed(0);
    // Only on open: the effect must not fight the speed buttons behind the overlay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    runtime.setSpeed(resumeSpeed.current);
    runtime.setMenu(false);
  }, [runtime]);

  // Escape closes the menu here rather than in the HUD's key handler, because closing it also
  // restores the speed this component paused. A caller that only flipped `setMenu(false)` would
  // leave the park standing still.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code !== 'Escape') return;
      ev.preventDefault();
      close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const openPanel = (id: string) => {
    runtime.open(id);
    close();
  };

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={t('menu.title')}
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) close();
      }}
    >
      <div className={cn(HUD_PANEL, 'w-[21rem] max-w-full p-5')}>
        <div className="mb-4 flex items-center gap-2">
          <BrandLockup forceLight />
        </div>
        <h2 className="text-base font-semibold tracking-tight text-white/95">{parkName}</h2>
        <p className="mt-0.5 text-xs text-white/50 tabular-nums">
          {t('hud.day', { day })} · {clockTime(minute)}
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          <Button
            type="button"
            size="default"
            className="w-full justify-start gap-2"
            onClick={close}
          >
            <Play className="size-4" />
            {t('menu.resume')}
          </Button>
          <MenuRow icon={<Save className="size-4" />} onClick={() => openPanel('saves')}>
            {t('panel.saves')}
          </MenuRow>
          <MenuRow icon={<Settings2 className="size-4" />} onClick={() => openPanel('settings')}>
            {t('panel.settings')}
          </MenuRow>
          <MenuRow icon={<Keyboard className="size-4" />} onClick={() => openPanel('help')}>
            {t('panel.help')}
          </MenuRow>
          <MenuRow
            icon={<Sparkles className="size-4" />}
            onClick={() => {
              // A fresh flat park with a full purse. The seed comes from the wall clock, which is
              // fine here and nowhere near the simulation: this is a click handler on the main
              // thread, and the world it opens is seeded once and deterministic from then on.
              const url = new URL(window.location.href);
              url.searchParams.set('park', 'sandbox');
              url.searchParams.set('seed', String(Date.now() % 100000));
              url.searchParams.delete('showcase');
              window.location.assign(url.toString());
            }}
          >
            {t('menu.sandbox')}
          </MenuRow>
          <Button
            asChild
            variant="ghost"
            size="default"
            className="w-full justify-start gap-2 text-white/70"
          >
            <Link href="/">
              <ArrowLeft className="size-4" />
              {t('hud.back')}
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-white/40">{t('menu.note')}</p>
      </div>
    </div>
  );
}

function MenuRow({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="default"
      className="w-full justify-start gap-2 text-white/80 hover:text-white"
      onClick={onClick}
    >
      {icon}
      {children}
    </Button>
  );
}
