import { getTranslations } from 'next-intl/server';
import { MessageCircle } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import type { Locale } from '@/i18n/config';
import { ShotStop } from './home-stop';
import { ParkyAskLink } from './parky-ask-link';
import { ParkyHello } from './parky-hello';
import { versionedPath } from '@/lib/media/focus';

/**
 * The tour's last stop on the homepage: whoever has not found what they came for, or does not quite know what
 * that is, can ask Parky. Its chat on a phone (`public/media/parky/<locale>/chat.webp`, from
 * `capture-parky-shots.mjs`) beside the heading, and a link that opens the chat where Parky shows
 * for the visitor ({@link ParkyAskLink}).
 */
export async function ParkyStop({ locale }: { locale: Locale }) {
  const [t, tParky] = await Promise.all([
    getTranslations('homeStory.parky'),
    getTranslations('parkyPage'),
  ]);

  return (
    <ParkyHello>
      <ShotStop
        reverse
        src={versionedPath(`/media/parky/${locale}/chat.webp`)}
        alt={tParky('chapters.ask.alt')}
        heading={
          <ChapterHeading
            variant="stop"
            icon={MessageCircle}
            kicker={t('kicker')}
            title={t('title')}
            hint={t('lead')}
            action={<ParkyAskLink>{t('link')}</ParkyAskLink>}
          />
        }
      />
    </ParkyHello>
  );
}
