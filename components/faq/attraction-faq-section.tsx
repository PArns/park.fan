import { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import type { Locale } from '@/i18n/config';
import { getLocale, getTranslations } from 'next-intl/server';
import { ChevronDown, MapPin, Clock, Users, Zap, HelpCircle } from 'lucide-react';
import { ChapterPanel } from '@/components/common/chapter-panel';
import { stripNewPrefix } from '@/lib/utils';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { buildAttractionFaqItems, type AttractionFaqIconName } from '@/lib/faq/attraction-faq';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<AttractionFaqIconName, LucideIcon> = {
  MapPin,
  Clock,
  Users,
  Zap,
};

interface AttractionFAQSectionProps {
  attraction: ParkAttraction;
  park: ParkWithAttractions;
}

export async function AttractionFAQSection({ attraction, park }: AttractionFAQSectionProps) {
  const t = await getTranslations('seo.faq.attraction');
  const locale = await getLocale();
  const attractionName = stripNewPrefix(attraction.name);
  const faqs = buildAttractionFaqItems(
    attraction,
    park,
    t as Parameters<typeof buildAttractionFaqItems>[2],
    locale as Locale
  );

  if (faqs.length === 0) return null;

  return (
    /* One box, and the questions are rows in it. They were a band with a stack of separate
       `Card`s under it — a chapter title floating over five smaller boxes, each drawing its own
       border over the ride's hero photo. `divide-y` gives the same separation the panel grids
       use, and the whole row stays the summary's click target. The id is what the chapter row at
       the top of the page jumps to; `ChapterPanel` brings the sticky-header scroll offset. */
    <ChapterPanel
      icon={HelpCircle}
      title={t('title', { attraction: attractionName })}
      id="faq"
      bodyClassName="divide-border/50 divide-y p-0"
    >
      {faqs.map((faq, index) => {
        const Icon = ICON_MAP[faq.iconName];
        return (
          <details key={index} className="group">
            <summary className="hover:bg-muted/40 flex cursor-pointer list-none items-center justify-between gap-3 p-4 transition-colors md:px-6">
              <div className="flex items-center gap-3">
                <Icon className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-left font-medium">{faq.question}</span>
              </div>
              <ChevronDown
                className="text-muted-foreground h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="text-muted-foreground border-border/50 border-t px-4 pt-3 pb-4 md:px-6">
              <GlossaryInject>{faq.answer}</GlossaryInject>
            </div>
          </details>
        );
      })}
    </ChapterPanel>
  );
}
