import { useTranslations } from 'next-intl';
import { LayoutGrid } from 'lucide-react';
import { AttractionCard } from './attraction-card';
import { getAttractionImage } from '@/lib/attraction-images';
import type { ParkAttraction, AttractionStatus, ParkStatus } from '@/lib/api/types';

interface LandSectionProps {
  landName: string;
  attractions: ParkAttraction[];
  parkPath: string;
  parkSlug: string; // Added for background image lookup
  parkStatus?: ParkStatus;
}

function getStatus(attraction: ParkAttraction, parkStatus?: ParkStatus): AttractionStatus {
  if (parkStatus && parkStatus !== 'OPERATING') {
    return 'CLOSED';
  }
  const standbyQueue = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standbyQueue?.status ?? attraction.status ?? 'CLOSED';
}

export function LandSection({
  landName,
  attractions,
  parkPath,
  parkSlug,
  parkStatus,
}: LandSectionProps) {
  const t = useTranslations('parks');
  const operatingCount = attractions.filter((a) => getStatus(a, parkStatus) === 'OPERATING').length;

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <LayoutGrid className="text-primary h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{landName}</h2>
          <p className="text-muted-foreground text-sm">
            {t('operatingCount', { count: operatingCount, total: attractions.length })}
          </p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {attractions.map((attraction) => {
          // Get attraction background image with fallback to null
          const backgroundImage = getAttractionImage(parkSlug, attraction.slug);

          return (
            <li key={attraction.id}>
              <AttractionCard
                attraction={attraction}
                parkPath={parkPath}
                parkStatus={parkStatus}
                backgroundImage={backgroundImage}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
