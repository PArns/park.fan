import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading placeholder for <AttractionHistorySections>. Mirrors the 30-day history grid card so the
 * layout stays stable (no CLS) while the client-side detail fetch resolves — the same pattern as
 * <ParkStatsSectionSkeleton> on the park page. (The daily "Wartezeiten heute" chart now lives in the
 * unified live card, which renders its own skeleton.)
 */
export function AttractionHistorySectionsSkeleton() {
  return (
    <div aria-hidden="true">
      {/* History calendar grid card */}
      <section className="mb-8">
        <Card className="space-y-4 p-6">
          <Skeleton className="h-7 w-64 max-w-full" />
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-md" />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
