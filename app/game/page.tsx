import { cookies, headers } from 'next/headers';
import { GameShell } from '@/lib/game/core/game-shell';
import { createTranslator, resolveGameLocale } from '@/lib/game/i18n';
import { GameClient } from './game-client';

/**
 * `/game` — a thin Server Component: metadata comes from the layout, the shell is server-rendered
 * so the first paint already shows the lockup and a progress bar, and the engine mounts behind
 * `next/dynamic(..., { ssr: false })`. Dynamic because the locale comes from a cookie.
 */
export default async function GamePage() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveGameLocale(
    cookieStore.get('NEXT_LOCALE')?.value ?? headerStore.get('accept-language')?.split(',')[0]
  );
  const t = createTranslator(locale);
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* Server-rendered shell: replaced by the client shell at hydration, same box, same place. */}
      <noscript>
        <GameShell
          title={t('app.title')}
          tagline={t('app.tagline')}
          error={t('boot.failed')}
          errorHint={t('boot.failed.hint')}
        />
      </noscript>
      <GameClient locale={locale} />
    </main>
  );
}
