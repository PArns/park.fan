import { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import { getTranslations } from 'next-intl/server';
import { ChevronDown, MapPin, Clock, Users, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
  const attractionName = stripNewPrefix(attraction.name);
  const faqs = buildAttractionFaqItems(
    attraction,
    park,
    t as Parameters<typeof buildAttractionFaqItems>[2]
  );

  if (faqs.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">{t('title', { attraction: attractionName })}</h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const Icon = ICON_MAP[faq.iconName];
          return (
            <Card key={index} className="overflow-hidden">
              <details className="group">
                <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center justify-between p-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon className="text-primary h-5 w-5 flex-shrink-0" />
                    <span className="text-left font-medium">{faq.question}</span>
                  </div>
                  <ChevronDown className="text-muted-foreground h-5 w-5 flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="text-muted-foreground border-t px-4 pt-2 pb-4">
                  <GlossaryInject>{faq.answer}</GlossaryInject>
                </div>
              </details>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
