import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading placeholder for <ParkBestDaysSection> (non-compact). Mirrors the section
 * header + the three-column card grid (quietest weekdays · best weekend day ·
 * upcoming quiet days) so the layout doesn't jump when the streamed data arrives.
 */
export function ParkBestDaysSectionSkeleton() {
  // chip counts per card, roughly matching the real content (3 weekdays · 1 weekend · 5 dates)
  const cards: { chips: number; chipClass: string }[] = [
    { chips: 3, chipClass: 'h-7 w-12' },
    { chips: 1, chipClass: 'h-7 w-12' },
    { chips: 5, chipClass: 'h-7 w-24' },
  ];

  return (
    <section className="mt-8 space-y-4" aria-hidden="true">
      <div className="bg-background/70 rounded-xl px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-64 max-w-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-36" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: card.chips }).map((_, j) => (
                  <Skeleton key={j} className={`${card.chipClass} rounded-md`} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
