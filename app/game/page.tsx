import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { GameShell } from '@/lib/game/core/game-shell';
import { GAME_ENABLED } from '@/lib/config/features';
import { createTranslator, resolveGameLocale } from '@/lib/game/i18n';
import { GameClient } from './game-client';

/**
 * `/game` — a thin Server Component: metadata comes from the layout, the shell is server-rendered
 * so the first paint already shows the lockup and a progress bar, and the engine mounts behind
 * `next/dynamic(..., { ssr: false })`. Dynamic because the locale comes from a cookie.
 *
 * The kill switch is here rather than only on the header link, because a link is a suggestion and
 * a route is a fact: the URL is guessable, it will end up in somebody's history, and a preview
 * deploy's address outlives the pull request. `GAME_ENABLED` is a build-time constant, so with it
 * off this is a 404 that costs one comparison and never mounts the engine. See
 * `lib/config/features.ts` for what turns it on and why the default is not a single value.
 */
export default async function GamePage() {
  if (!GAME_ENABLED) notFound();
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
