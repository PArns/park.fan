'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Check, Lightbulb, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AssistantTripIdea } from '@/lib/assistant/trip-idea';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import { tripPlannerBridge } from '@/lib/trip-regions/planner-bridge';

/**
 * A trip plan idea under Parky's answer, the one the visitor asked about or one he offered on his
 * own: the idea in one line, what it does in minutes, and its button, which applies it to the
 * planner on screen through the planner's bridge, as the strip over the plan does. Applied, it
 * reads „Im Plan: …“ with Undo, which takes back the planner's last edit. „Anderen Tag“ opens the
 * planner's swap mode for the idea's park instead; on a phone the chat steps aside for it
 * (`onStepAside`). Without the planner on screen the buttons stay off.
 */
export function AssistantTripIdeaCard({
  card,
  onStepAside,
}: {
  card: AssistantTripIdea;
  /** Makes room for the planner: the panel's close on a phone, outside an interview. */
  onStepAside?: () => void;
}) {
  const [applied, setApplied] = useState(false);
  const planner = usePlannerOn(card.region);
  const park = card.idea.park;
  useEffect(() => {
    trackTripEvent(card.region, 'trip_idea_shown', { kind: card.idea.kind, place: 'chat' });
  }, [card.region, card.idea.kind]);

  return (
    <div
      className="border-primary/30 bg-primary/5 mt-1.5 flex flex-col gap-2 rounded-xl border p-3"
      data-assistant-trip-idea={card.idea.kind}
    >
      <p className="flex gap-2 text-sm font-medium">
        <Lightbulb className="text-primary-ink mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {card.title}
      </p>
      {card.figure && <p className="text-muted-foreground pl-6 text-xs">{card.figure}</p>}
      {applied ? (
        <div className="flex flex-wrap items-center gap-2 pl-6" role="status">
          <span className="text-primary-ink inline-flex items-center gap-1 text-xs font-medium">
            <Check className="size-3.5" aria-hidden="true" />
            {card.applied}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (tripPlannerBridge.undo(card.region)) setApplied(false);
            }}
          >
            <Undo2 aria-hidden="true" />
            {card.undo}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!planner}
            onClick={() => {
              if (!tripPlannerBridge.applyIdea(card.region, card.idea, 'parky')) return;
              trackTripEvent(card.region, 'trip_idea_applied', {
                kind: card.idea.kind,
                place: 'chat',
              });
              setApplied(true);
            }}
          >
            {card.apply}
          </Button>
          {card.otherDay && park && (
            <Button
              size="sm"
              variant="outline"
              disabled={!planner}
              onClick={() => {
                if (tripPlannerBridge.openSwap(card.region, park, card.idea.from)) onStepAside?.();
              }}
            >
              <ArrowLeftRight aria-hidden="true" />
              {card.otherDay}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Whether the planner of `region` is on screen, told by the bridge as it comes and goes. */
function usePlannerOn(region: string): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn(tripPlannerBridge.current()?.region === region);
    read();
    return tripPlannerBridge.subscribe(read);
  }, [region]);
  return on;
}
