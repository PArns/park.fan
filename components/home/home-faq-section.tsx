import { getTranslations } from 'next-intl/server';
import {
  HelpCircle,
  Info,
  MapPinned,
  RadioTower,
  BadgeEuro,
  Star,
  Layers,
  Smartphone,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { HOMEPAGE_FAQ, type HomepageFaqEntry } from '@/lib/faq/homepage-faq';

const ICONS: Record<HomepageFaqEntry['icon'], LucideIcon> = {
  Info,
  MapPinned,
  RadioTower,
  BadgeEuro,
  Star,
  Layers,
  Smartphone,
};

/**
 * The homepage FAQ, rendered — the same seven questions `HomepageFAQStructuredData` has been
 * emitting as `FAQPage` markup all along (see `lib/faq/homepage-faq.ts`).
 *
 * Same `<details>` shape as the park and attraction FAQs, so the three read as one thing; the
 * first entry is open, because a page whose FAQ is seven closed rows has added seven headings
 * and no text.
 *
 * A Server Component: nothing here is interactive beyond the browser's own disclosure widget,
 * which is why the answers can go through `GlossaryInject` and cost the client nothing.
 */
export async function HomeFaqSection() {
  const t = await getTranslations('seo.homepage.faq');
  const tHome = await getTranslations('home');

  return (
    <section className="px-4 py-16">
      <div className="container mx-auto">
        <ChapterHeading icon={HelpCircle} title={tHome('faq.title')} />
        <div className="mt-6 space-y-3">
          {HOMEPAGE_FAQ.map((entry, i) => {
            const Icon = ICONS[entry.icon];
            return (
              <Card key={entry.q} className="overflow-hidden">
                <details className="group" open={i === 0}>
                  <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center justify-between gap-3 p-4 transition-colors">
                    <h3 className="flex items-center gap-3 text-left text-base font-medium">
                      <Icon className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
                      {t(entry.q)}
                    </h3>
                    <ChevronDown
                      className="text-muted-foreground h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="text-muted-foreground border-t px-4 pt-3 pb-4 leading-relaxed">
                    <GlossaryInject>{t(entry.a)}</GlossaryInject>
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
