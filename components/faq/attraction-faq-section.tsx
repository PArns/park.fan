import { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import type { Locale } from '@/i18n/config';
import { getLocale, getTranslations } from 'next-intl/server';
import { MapPin, Clock, Users, Zap, HelpCircle } from 'lucide-react';
import { ChapterPanel } from '@/components/common/chapter-panel';
import { FaqAccordion } from '@/components/faq/faq-accordion';
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
    /* One box, and the questions are rows in it — see `FaqAccordion`, which every FAQ on the site
       now draws. The id is what the chapter row at the top of the page jumps to; `ChapterPanel`
       brings the sticky-header scroll offset with it. */
    <ChapterPanel
      icon={HelpCircle}
      title={t('title', { attraction: attractionName })}
      id="faq"
      bodyClassName="p-0"
    >
      <FaqAccordion
        items={faqs.map((faq) => ({
          icon: ICON_MAP[faq.iconName],
          question: faq.question,
          answer: <GlossaryInject>{faq.answer}</GlossaryInject>,
        }))}
      />
    </ChapterPanel>
  );
}
