'use client';

import dynamic from 'next/dynamic';
import type { GameLocale } from '@/lib/game/i18n';

/**
 * The engine never renders on the server: `ssr: false` keeps Babylon, the worker and every game
 * module out of the server bundle and out of the shared client chunks — they arrive as their own
 * dynamically imported chunks the first time this component mounts.
 */
const GameApp = dynamic(() => import('@/lib/game/core/game-app').then((m) => m.GameApp), {
  ssr: false,
});

export function GameClient({ locale }: { locale: GameLocale }) {
  return <GameApp locale={locale} />;
}
