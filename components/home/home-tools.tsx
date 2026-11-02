import { getTranslations } from 'next-intl/server';
import { ArrowRight, CalendarRange, Compass, MessageCircle, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { howtoPath } from '@/lib/howto/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { plannerPath } from '@/lib/planner/segments';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import type { Locale } from '@/i18n/config';
import { STORY_SECTION_RULED } from './section-chrome';

/** One tool: its messages under `homeStory.tools.<key>`, its icon and the page that explains it. */
interface Tool {
  key: 'live' | 'calendar' | 'planner' | 'parky';
  icon: LucideIcon;
  href: string;
}

/**
 * What park.fan does, in four cards of one sentence each, for a first visitor: the live waits, the
 * crowd calendar, the planner and Parky. Each card leads to the page that explains its tool at
 * length, so the homepage carries none of that explanation itself.
 */
export async function HomeTools({ locale }: { locale: Locale }) {
  const t = await getTranslations('homeStory.tools');
  const tools: Tool[] = [
    { key: 'live', icon: Timer, href: howtoPath(locale) },
    { key: 'calendar', icon: CalendarRange, href: `/${BEST_TIME_SEGMENTS[locale]}` },
    { key: 'planner', icon: Compass, href: plannerPath(locale) },
    { key: 'parky', icon: MessageCircle, href: '/parky' },
  ];

  return (
    <section className={STORY_SECTION_RULED} {...linkBlockAttributes('nav')}>
      <div className="container mx-auto">
        <Reveal containsGlass>
          <ChapterHeading
            variant="tile"
            icon={Compass}
            kicker={t('kicker')}
            title={t('title')}
            hint={t('lead')}
            id="werkzeuge"
          />
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(({ key, icon: Icon, href }) => (
            <li key={key} className="flex">
              <Link
                href={href as '/'}
                prefetch={false}
                className="group border-border bg-card hover:border-primary/40 flex w-full flex-col rounded-2xl border p-5 shadow-sm transition-colors sm:p-6"
              >
                <span className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-xl">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{t(`${key}.title`)}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {t(`${key}.text`)}
                </p>
                <span className="text-primary mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold group-hover:underline">
                  {t(`${key}.link`)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
