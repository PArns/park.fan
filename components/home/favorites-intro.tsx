import { getTranslations } from 'next-intl/server';
import { Menu, Star } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import { versionedPath } from '@/lib/media/focus';
import type { Locale } from '@/i18n/config';
import { ShotStop, StopLink } from './home-stop';

/**
 * The favourites, explained to a visitor who has none yet, in two phone stops after the parks near
 * them: how a park or a ride becomes one (a park page with its star just pressed) and where they
 * show from then on (the menu, open). A visitor with favourites sees the favourites themselves
 * under the news instead: `.home-favorites-intro` in globals.css hides this once the layout's
 * inline script has set `data-has-favorites`, before paint. The screenshots are per locale, from
 * `scripts/capture-home-shots.mjs`.
 */
export async function FavoritesIntro({ locale }: { locale: Locale }) {
  const [t, tHome] = await Promise.all([
    getTranslations('homeStory.favoritesIntro'),
    getTranslations('home'),
  ]);

  return (
    <div className="home-favorites-intro" {...linkBlockAttributes('nav')}>
      <ShotStop
        // Runs on from the nearby parks, whose stop keeps its room below.
        flushTop
        src={versionedPath(`/media/home/${locale}/favorite.webp`)}
        alt={t('star.alt')}
        heading={
          <ChapterHeading
            variant="stop"
            icon={Star}
            kicker={t('star.kicker')}
            title={t('star.title')}
            hint={t('star.lead')}
            action={<StopLink href="/parks">{tHome('hero.cta')}</StopLink>}
          />
        }
      />
      <ShotStop
        reverse
        src={versionedPath(`/media/home/${locale}/favorites-menu.webp`)}
        alt={t('menu.alt')}
        heading={
          <ChapterHeading
            variant="stop"
            icon={Menu}
            kicker={t('menu.kicker')}
            title={t('menu.title')}
            hint={t('menu.lead')}
          />
        }
      />
    </div>
  );
}
