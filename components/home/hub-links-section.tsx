import { getTranslations } from 'next-intl/server';
import { Compass, CalendarRange, BookOpen, Sparkles, LifeBuoy, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import type { Locale } from '@/i18n/config';

/**
 * The five hubs the homepage never linked to.
 *
 * Measured on the German homepage: 84 links in `<main>`, and `/beste-reisezeit` — a hub the
 * header links to on every page of the site — got none of them. Neither did `/glossar`, which
 * received 34 inbound links from `GlossaryInject` running over the body copy and not one to its
 * own index. `/so-funktioniert-park-fan` had one, `/fancast` two, both at the very bottom under
 * three consecutive dashboard bands.
 *
 * This is the cheapest internal-linking fix on the page and the least clever: five links, from
 * the strongest page on the site, to the five pages it is the entry point for. The labels come
 * from `navigation`, so the band and the header can never call the same hub two things.
 */
export async function HubLinksSection({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');
  const tNav = await getTranslations('navigation');

  const hubs = [
    { href: '/parks', icon: Compass, label: tNav('explore'), text: t('hubs.parks') },
    {
      href: `/${BEST_TIME_SEGMENTS[locale]}`,
      icon: CalendarRange,
      label: tNav('bestTime'),
      text: t('hubs.bestTime'),
    },
    {
      href: `/${GLOSSARY_SEGMENTS[locale]}`,
      icon: BookOpen,
      label: tNav('glossary'),
      text: t('hubs.glossary'),
    },
    { href: '/fancast', icon: Sparkles, label: 'Fancast', text: t('hubs.fancast') },
    {
      href: `/${HOWTO_SEGMENTS[locale]}`,
      icon: LifeBuoy,
      label: tNav('howto'),
      text: t('hubs.howto'),
    },
  ];

  return (
    <section className="px-4 py-16">
      <div className="container mx-auto">
        <ChapterHeading icon={Compass} title={t('hubs.title')} hint={t('hubs.intro')} />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hubs.map((hub) => (
            <li key={hub.href}>
              <Link
                href={hub.href}
                prefetch={false}
                className="group border-border/60 bg-card/60 hover:border-primary/50 flex h-full items-start gap-3 rounded-xl border p-4 transition-colors"
              >
                <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <hub.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="text-foreground group-hover:text-primary flex items-center gap-1.5 text-sm font-semibold transition-colors">
                    {hub.label}
                    <ArrowRight
                      className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
                    {hub.text}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
