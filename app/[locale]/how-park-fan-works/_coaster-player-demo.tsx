import { getTranslations } from 'next-intl/server';
import { CoasterPlayer } from '@/components/glossary/coaster-player';
import type { Locale } from '@/i18n/config';

/**
 * The glossary 3-D coaster player, embedded in the /howto guide as a live demo.
 * Always shows the celestial spin (its dual-track twist exercises every camera
 * view). Labels come from the same `glossary.player` messages the real player
 * uses, so the howto stays in sync with the feature.
 */
export async function CoasterPlayerDemo({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'glossary' });
  return (
    <CoasterPlayer
      element="celestial-spin"
      labels={{
        play: t('player.play'),
        pause: t('player.pause'),
        replay: t('player.replay'),
        view: t('player.view'),
        viewFront: t('player.viewFront'),
        viewFollow: t('player.viewFollow'),
        viewOnboard: t('player.viewOnboard'),
        loading: t('player.loading'),
        keys: t.raw('player.keys') as Record<string, string>,
      }}
    />
  );
}
