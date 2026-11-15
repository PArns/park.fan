'use client';

// SCRATCH: the two layouts of the ticket card's recommendation, for screenshots. Deleted once one
// is chosen.

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DEFAULT_PLAN_STATE,
  tripHotelKinds,
  type TripPlan,
  type TripPlanState,
} from '@/lib/trip-regions/plan';
import { requireTripRegion, type TripTicketStep } from '@/lib/trip-regions/registry';
import { shortParkName } from '@/lib/trip-regions/hub-data';
import { ticketCatalog } from '@/lib/trip-regions/plan-tickets';
import type { TicketLink, TripRegion } from '@/lib/trip-regions/types';
import { PlanContextProvider, type PlanContextValue } from './plan-context';
import { PlanTicketsCard, TicketsAsk, type TicketPickLayout } from './plan-tickets-card';
import { NO_EDITS } from './use-plan-state';
import { useStatePlan } from './use-trip-plan';

const NO_TICKET_STEP: TripTicketStep = { resorts: [], entries: [], hopperNames: {}, homeMarket: '' };
const noEdit = { tickets: () => {}, parks: () => {}, dates: () => {} };

/** The admin's partner switch as it would be set for Attraction Tickets. */
function sponsor(links: TicketLink[] | undefined): TicketLink[] | undefined {
  return links?.map((l) => (l.seller === 'Attraction Tickets' ? { ...l, sponsored: true } : l));
}

export function TicketCardScratch({ region, locale }: { region: TripRegion; locale: string }) {
  const params = useSearchParams();
  const sponsored = params.get('sponsored') !== '0';
  const [state, setState] = useState<TripPlanState>({
    ...DEFAULT_PLAN_STATE,
    from: params.get('from') ?? '2026-11-14',
    to: params.get('to') ?? '2026-11-30',
  });
  const context = useMemo<PlanContextValue>(() => {
    const parkBySlug = new Map(region.parks.map((p) => [p.slug, p]));
    const config = requireTripRegion(region.slug);
    const tickets = sponsored
      ? region.tickets?.map((p) => ({ ...p, links: sponsor(p.links) }))
      : region.tickets;
    return {
      region,
      config,
      ticketStep: config.tickets ?? NO_TICKET_STEP,
      hotels: tripHotelKinds(region, config.hotels),
      locale,
      timeZone: region.timezone,
      parkBySlug,
      parkName: (slug: string) => {
        const name = parkBySlug.get(slug)?.name;
        return name ? shortParkName(name) : slug;
      },
      venueByKey: new Map((region.venues ?? []).map((v) => [v.key, v])),
      groupByKey: new Map(region.groups.map((g) => [g.key, g])),
      headliners: region.parks.filter((p) => p.headliner).map((p) => p.slug),
      regionOrder: region.parks.map((p) => p.slug),
      areaKeys: new Set(region.hotelAreas.map((a) => a.key)),
      tickets: ticketCatalog(tickets),
      state,
      update: (recipe) => setState((s) => recipe(s)),
      edit: () => {},
      undo: () => false,
      edits: NO_EDITS,
      today: '2026-11-15',
      photos: {},
      live: true,
    };
  }, [region, locale, state, sponsored]);
  return (
    <PlanContextProvider value={context}>
      <Frame
        layout={(params.get('layout') as TicketPickLayout) ?? 'list'}
        width={Number(params.get('w') ?? 340)}
        sponsored={sponsored}
      />
    </PlanContextProvider>
  );
}

function Frame({
  layout,
  width,
  sponsored,
}: {
  layout: TicketPickLayout;
  width: number;
  sponsored: boolean;
}) {
  const plan = useStatePlan();
  if (!plan.data) return <p className="p-8">…</p>;
  const data: TripPlan = sponsored
    ? {
        ...plan.data,
        meta: {
          ...plan.data.meta,
          ticketSuggestion: plan.data.meta.ticketSuggestion?.map((s) => ({
            ...s,
            links: sponsor(s.links),
          })),
        },
      }
    : plan.data;
  return (
    <div className="mx-auto my-6 px-4" style={{ maxWidth: width + 32 }} data-scratch-frame="">
      <PlanTicketsCard
        plan={data}
        edit={noEdit}
        layout={layout}
        ask={<TicketsAsk onAsk={() => {}} />}
      />
    </div>
  );
}
