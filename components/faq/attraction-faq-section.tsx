import Link from 'next/link';
import { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import type { Locale } from '@/i18n/config';
import { getPathname } from '@/i18n/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { MapPin, Clock, Users, Zap, HelpCircle } from 'lucide-react';
import { ChapterPanel } from '@/components/common/chapter-panel';
import { FaqAccordion } from '@/components/faq/faq-accordion';
import { stripNewPrefix } from '@/lib/utils';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { buildAttractionFaqItems, type AttractionFaqIconName } from '@/lib/faq/attraction-faq';
import { getGuideForTopic } from '@/lib/blog/country-guide';
import { postPath } from '@/lib/blog/paths';
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

/**
 * FAQ chapter on a ride page: questions built by `buildAttractionFaqItems`, answers with glossary
 * terms linked. Renders nothing when there are no questions.
 */
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

  // Only the visible answer gets the link: the JSON-LD answer is the plain string, which a guide
  // title would turn into a different claim.
  const singleRiderGuide = faqs.some((faq) => faq.key === 'singleRider')
    ? getGuideForTopic(locale as Locale, 'single-rider')
    : null;

  return (
    /* One box, and the questions are rows in it — see `FaqAccordion`, which every FAQ on the site
       now draws. The id is what the chapter row at the top of the page jumps to; `ChapterPanel`
       brings the sticky-header scroll offset with it. */
    <ChapterPanel
      icon={HelpCircle}
      title={t('title', { attraction: attractionName })}
      id="faq"
      bodyPadding="none"
    >
      <FaqAccordion
        items={faqs.map((faq) => ({
          icon: ICON_MAP[faq.iconName],
          question: faq.question,
          answer:
            faq.key === 'singleRider' && singleRiderGuide ? (
              <>
                <GlossaryInject>{faq.answer}</GlossaryInject>
                <p className="mt-2">
                  {t('singleRiderGuide')}{' '}
                  <Link
                    href={getPathname({
                      href: postPath(singleRiderGuide) as '/',
                      locale: locale as Locale,
                    })}
                    prefetch={false}
                    className="text-primary font-medium hover:underline"
                  >
                    {singleRiderGuide.frontmatter.title}
                  </Link>
                </p>
              </>
            ) : (
              <GlossaryInject>{faq.answer}</GlossaryInject>
            ),
        }))}
      />
    </ChapterPanel>
  );
}
