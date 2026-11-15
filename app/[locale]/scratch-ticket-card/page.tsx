// SCRATCH: the ticket card's two layouts for screenshots. Deleted once one is chosen.
import { setRequestLocale } from 'next-intl/server';
import { RouteMessages } from '@/i18n/route-messages';
import { getTripRegion, getTripRegionTickets } from '@/lib/trip-regions/api';
import { leanTicketCatalog } from '@/lib/trip-regions/plan-tickets';
import { TicketCardScratch } from '@/components/trip-regions/planner/ticket-card-scratch';

export const dynamic = 'force-dynamic';

export default async function ScratchTicketCard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [region, catalog] = await Promise.all([
    getTripRegion('orlando'),
    getTripRegionTickets('orlando'),
  ]);
  return (
    <RouteMessages route="/trip-regions/[region]/[[...date]]" region="orlando">
      <TicketCardScratch
        region={{ ...region, tickets: leanTicketCatalog(catalog.tickets) }}
        locale={locale}
      />
    </RouteMessages>
  );
}
