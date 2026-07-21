'use client';

import { useTranslations } from 'next-intl';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ParkWithAttractions } from '@/lib/api/types';

interface ParkTabsListProps {
  park: ParkWithAttractions;
  showsAvailable: boolean | undefined;
  restaurantsAvailable: boolean | undefined;
}

/**
 * The park page tab bar (attractions / calendar / map / shows / restaurants).
 *
 * Single source for markup that TabsWithHash renders twice — once pre-mount (SSR + first
 * client render) and once post-mount. The two renders were byte-identical; the only real
 * difference lives on the surrounding <Tabs> element (uncontrolled `defaultValue` vs.
 * controlled `activeTab` + onValueChange), which stays in TabsWithHash.
 */
export function ParkTabsList({ park, showsAvailable, restaurantsAvailable }: ParkTabsListProps) {
  const t = useTranslations('parks');

  return (
    <TabsList className="border-border/50 bg-background/60 mb-6 flex h-auto w-full flex-wrap justify-start border backdrop-blur-md">
      <TabsTrigger
        value="attractions"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        {t('attractions')} ({park.attractions?.length || 0})
      </TabsTrigger>
      <TabsTrigger
        value="calendar"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        {t('calendar')}
      </TabsTrigger>
      <TabsTrigger
        value="map"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        {t('map')}
      </TabsTrigger>
      {showsAvailable && (
        <TabsTrigger
          value="shows"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          {t('shows')} ({park.shows?.length || 0})
        </TabsTrigger>
      )}
      {restaurantsAvailable && (
        <TabsTrigger
          value="restaurants"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          {t('restaurants')} ({park.restaurants?.length || 0})
        </TabsTrigger>
      )}
    </TabsList>
  );
}
