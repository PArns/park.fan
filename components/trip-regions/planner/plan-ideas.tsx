'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MessagesSquare } from 'lucide-react';
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
 * „Parky hat 3 Ideen für deinen Plan“ over the days: a card per idea, to swipe on a phone and in a
 * grid at a desk. Nothing without ideas.
 */
export function IdeasStrip({ ideas }: { ideas: readonly PlanIdea[] }) {
  const t = useTranslations('tripPlanner.ideas');
  if (ideas.length === 0) return null;
  return (
    <section className="flex flex-col gap-2" aria-label={t('label')} data-plan-ideas="">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <ParkyLogo className="size-6 shrink-0" calm framed />
        {t('title', { count: ideas.length })}
      </p>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
        {ideas.map((idea) => (
          <li key={ideaKey(idea)} className="w-[85%] shrink-0 snap-start sm:w-auto">
            <IdeaCard idea={idea} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One idea over the plan: its line, its figure, the verb that applies it and „Im Chat“. */
export function IdeaCard({ idea }: { idea: PlanIdea }) {
  const t = useTranslations('tripPlanner.ideas');
  const { title, figure, verb, apply, chat } = useIdea(idea, 'header');
  return (
    <div
      className="bg-card border-border/60 flex h-full flex-col gap-3 rounded-2xl border p-3.5 shadow-xs"
      data-plan-idea={idea.kind}
    >
      <div className="flex gap-2.5">
        <ParkyLogo className="size-9 shrink-0" calm framed />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm font-medium">{title}</p>
          {figure && <p className="text-muted-foreground text-xs tabular-nums">{figure}</p>}
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <Button size="sm" onClick={apply}>
          {verb}
        </Button>
        {chat && (
          <Button size="sm" variant="ghost" onClick={chat}>
            <MessagesSquare aria-hidden="true" />
            {t('chat')}
          </Button>
        )}
      </div>
    </div>
  );
}

/** The idea about one day, under its card: Parky's face, the line and the button that applies it. */
export function DayHint({ idea, className }: { idea: PlanIdea; className?: string }) {
  const t = useTranslations('tripPlanner.ideas');
  const { title, figure, verb, apply, chat } = useIdea(idea, 'day');
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)}>
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
      </div>
    </div>
  );
}
