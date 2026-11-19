'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MessagesSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParkyLogo } from '@/components/assistant/parky/parky-logo';
import { cn } from '@/lib/utils';
import { formatParkDay } from '@/lib/utils/park-day';
import { oneFullStop } from '@/lib/utils/metadata';
import { useAssistantGateStatus } from '@/lib/assistant/use-assistant-gate';
import { askParkyAboutIdea, type AssistantTripIdea } from '@/lib/assistant/trip-idea';
import {
  ideaFigure,
  ideaKey,
  ideaTravelDay,
  ideaTravelEnd,
  ideaVerb,
  shownIdeas,
  type PlanIdea,
} from '@/lib/trip-regions/plan-ideas';
import { connectIdeaCards, tripPlannerBridge } from '@/lib/trip-regions/planner-bridge';
import { tripWizardAnswered } from '@/lib/trip-regions/planner-ui';
import type { TripIdeaPlace } from '@/lib/analytics/site-analytics';
import { usePlanContext, useTripEvents } from './plan-context';
import { useHopperWord } from './plan-ticket-words';
import { usePlanIdeas } from './use-trip-plan';

/**
 * Parky's ideas for the plan on screen, as the planner shows them: the API's best single edits
 * (`usePlanIdeas`) less those that would overrule an answer the visitor gave in the assistant
 * (`shownIdeas`). Empty while the plan or its ideas are on their way.
 */
export function useShownIdeas(): PlanIdea[] {
  const { region } = usePlanContext();
  const ideas = usePlanIdeas();
  const answered = useSyncExternalStore(
    tripWizardAnswered.subscribe,
    () => tripWizardAnswered.get(region.slug),
    tripWizardAnswered.getServer
  );
  return shownIdeas(ideas.data?.ideas, answered);
}

/** An idea in words: its line („DisneySea am Mo., 25. Jan. statt am Fr., 22. Jan.“) and its figure. */
export function useIdeaWords() {
  const t = useTranslations('tripPlanner.ideas');
  const { locale, parkName, state } = usePlanContext();
  const trip = state.from && state.to ? { from: state.from, to: state.to } : null;
  const hopperWord = useHopperWord();
  const day = (date: string | undefined) =>
    date ? formatParkDay(locale, date, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  return {
    title: (idea: PlanIdea) =>
      t(idea.kind, {
        park: idea.park ? parkName(idea.park) : '',
        with: idea.with ? parkName(idea.with) : '',
        from: day(idea.from),
        to: day(idea.to),
        date: day(idea.to),
        hopper: hopperWord(new URLSearchParams(idea.query).get('hopper')?.split(',').at(-1) ?? ''),
        end: ideaTravelEnd(idea.query),
        day: day((trip && ideaTravelDay(idea.query, trip)) ?? undefined),
      }),
    figure: (idea: PlanIdea) => {
      const figure = ideaFigure(idea);
      if (!figure) return '';
      return figure.before === null || figure.before === figure.after
        ? t('figure', { after: figure.after })
        : t('figureMoved', { after: figure.after, before: figure.before });
    },
    apply: (idea: PlanIdea) => t(`apply.${ideaVerb(idea.kind)}`),
  };
}

/**
 * An idea as the chat's card shows it (`AssistantTripIdeaCard`), in the planner's words: its line,
 * its figure and its buttons. „Im Chat“ sends it with the question, and the planner hands it to the
 * chat for an idea Parky offers on his own (`useIdeaCardBridge`).
 */
export function useIdeaCard(): (idea: PlanIdea) => AssistantTripIdea {
  const t = useTranslations('tripPlanner');
  const { region } = usePlanContext();
  const words = useIdeaWords();
  return (idea) => {
    const title = words.title(idea);
    return {
      region: region.slug,
      idea,
      title,
      figure: words.figure(idea),
      apply: t('ideas.inPlan'),
      applied: oneFullStop(t('ideas.applied', { idea: title })),
      undo: t('edit.undo'),
      otherDay: t('ideas.otherDay'),
    };
  };
}

/**
 * Lends the chat the planner's words for the ideas Parky offers on his own while this planner is
 * on screen (`tripPlannerBridge.ideaCard`). The words are read when a card arrives, so the latest
 * render's are used without connecting again on every one.
 */
export function useIdeaCardBridge(): void {
  const { region } = usePlanContext();
  const cardOf = useIdeaCard();
  const latest = useRef(cardOf);
  useEffect(() => {
    latest.current = cardOf;
  });
  useEffect(() => connectIdeaCards(region.slug, (idea) => latest.current(idea)), [region.slug]);
}

/** Ideas already counted as shown, per region, idea and place: a re-render is no new showing. */
const counted = new Set<string>();

/**
 * One idea's two buttons and its showing, shared by the strip's cards and the day's line: applying
 * goes through the planner's bridge, the edit the status band names and undoes; „Im Chat“ opens
 * Parky with a question about it and the idea's card under his answer.
 */
function useIdea(idea: PlanIdea, place: TripIdeaPlace) {
  const t = useTranslations('tripPlanner');
  const { region } = usePlanContext();
  const track = useTripEvents();
  const words = useIdeaWords();
  const cardOf = useIdeaCard();
  const parky = useAssistantGateStatus();
  const key = `${region.slug}|${ideaKey(idea)}|${place}`;
  useEffect(() => {
    if (counted.has(key)) return;
    counted.add(key);
    track('trip_idea_shown', { kind: idea.kind, place });
  }, [key, idea.kind, place, track]);
  const title = words.title(idea);
  return {
    title,
    figure: words.figure(idea),
    verb: words.apply(idea),
    apply: () => {
      if (tripPlannerBridge.applyIdea(region.slug, idea, 'visitor'))
        track('trip_idea_applied', { kind: idea.kind, place });
    },
    chat:
      parky === 'on'
        ? () => {
            track('trip_idea_chat', { kind: idea.kind });
            askParkyAboutIdea(t('ideas.ask', { idea: title }), cardOf(idea));
          }
        : null,
  };
}

/**
 * One idea over the plan, as a quiet note, so the plan keeps the first screen: the API's best one
 * the visitor has not hidden. The others stay under the days they change (`DayHint`). Nothing
 * without ideas.
 */
export function IdeaNote({ ideas }: { ideas: readonly PlanIdea[] }) {
  const t = useTranslations('tripPlanner.ideas');
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const idea = ideas.find((i) => !hidden.has(ideaKey(i)));
  if (!idea) return null;
  return (
    <aside
      aria-label={t('label')}
      className="border-border/60 rounded-xl border py-1.5 ps-3 pe-1 transition-opacity duration-200 starting:opacity-0"
      data-plan-ideas=""
    >
      <IdeaLine
        key={ideaKey(idea)}
        idea={idea}
        place="header"
        onDismiss={() => setHidden((set) => new Set(set).add(ideaKey(idea)))}
      />
    </aside>
  );
}

/** The idea about one day, under its card: Parky's face, the line and the button that applies it. */
export function DayHint({ idea, className }: { idea: PlanIdea; className?: string }) {
  return <IdeaLine idea={idea} place="day" className={className} />;
}

/** An idea in one line: Parky's face, the idea and its figure, apply, „Im Chat“ and a dismiss. */
function IdeaLine({
  idea,
  place,
  onDismiss,
  className,
}: {
  idea: PlanIdea;
  place: TripIdeaPlace;
  onDismiss?: () => void;
  className?: string;
}) {
  const t = useTranslations('tripPlanner.ideas');
  const { title, figure, verb, apply, chat } = useIdea(idea, place);
  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)}
      data-plan-idea={idea.kind}
    >
      <ParkyLogo className="size-6 shrink-0" calm framed />
      <p className="min-w-0 flex-1 text-xs">
        {title}
        {figure && <span className="text-muted-foreground tabular-nums"> · {figure}</span>}
      </p>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={apply}>
          {verb}
        </Button>
        {chat && (
          <Button size="sm" variant="ghost" onClick={chat} aria-label={`${t('chat')}: ${title}`}>
            <MessagesSquare aria-hidden="true" />
          </Button>
        )}
        {onDismiss && (
          <Button size="icon-sm" variant="ghost" onClick={onDismiss} aria-label={t('dismiss')}>
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
