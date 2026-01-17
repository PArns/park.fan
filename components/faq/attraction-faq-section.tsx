'use client';

import { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { ChevronDown, MapPin, Clock, Users, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AttractionFAQSectionProps {
  attraction: ParkAttraction;
  park: ParkWithAttractions;
}

export function AttractionFAQSection({ attraction, park }: AttractionFAQSectionProps) {
  const t = useTranslations('seo.faq.attraction');

  const faqs = [];

  // Question 1: Location
  if (park.name) {
    faqs.push({
      icon: MapPin,
      question: t('locationQ', { attraction: attraction.name }),
      answer: t('locationA', {
        attraction: attraction.name,
        park: park.name,
        land: attraction.land ? t('inLand', { land: attraction.land }) : '',
      }),
    });
  }

  // Question 2: Wait Time
  faqs.push({
    icon: Clock,
    question: t('waitTimeQ', { attraction: attraction.name }),
    answer: t('waitTimeA', { attraction: attraction.name }),
  });

  // Question 3: Single Rider
  const singleRiderQueue = attraction.queues?.find((q) => q.queueType === 'SINGLE_RIDER');
  if (singleRiderQueue) {
    faqs.push({
      icon: Users,
      question: t('singleRiderQ', { attraction: attraction.name }),
      answer: t('singleRiderA', { attraction: attraction.name }),
    });
  }

  // Question 4: Paid Queue / Premier Access
  const paidQueue = attraction.queues?.find(
    (q) => q.queueType === 'PAID_RETURN_TIME' || q.queueType === 'PAID_STANDBY'
  );

  if (paidQueue) {
    const typeName = 'Express Pass / Premier Access';
    faqs.push({
      icon: Zap,
      question: t('paidQueueQ', { attraction: attraction.name }),
      answer: t('paidQueueA', {
        attraction: attraction.name,
        type: typeName,
      }),
    });
  }

  if (faqs.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">{t('title', { attraction: attraction.name })}</h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const Icon = faq.icon;
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
                <div className="text-muted-foreground border-t px-4 pt-2 pb-4">{faq.answer}</div>
              </details>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
