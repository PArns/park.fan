'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ASSISTANT_PHONE_QUERY } from '@/components/assistant/parky-layer';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerStore } from '@/lib/planner/store';
import { plannerUi } from '@/lib/planner/ui-store';
import {
  clearDay,
  moveEntry,
  moveEntryToIndex,
  openDay,
  removeEntry,
  reserveDays,
  setActive,
  setCustomBlock,
  setDayPrefs,
  setEntryDone,
} from '@/lib/planner/actions';
import { entriesFor, hasAnyPlan, type PlannerState } from '@/lib/planner/types';
import { planDayQuery } from '@/lib/hooks/use-plan-day';
import { showDayHours, showLinesFor } from '@/lib/planner/shows';
import { formatGridTime } from '@/lib/planner/park-time';
import { trackPlannerDayCleared } from '@/lib/analytics/planner-funnel';
import {
  assistantPlannerSnapshot,
  rememberParkyChange,
  undoParkyChange,
  type ParkyUndoOutcome,
} from '@/lib/assistant/planner-context';
import {
  alertTarget,
  removalOutcome,
  type AssistantActionOutcome,
  type AssistantAlertTarget,
} from '@/lib/assistant/alerts-context';
import { readPushState, writeAssistantAlert } from '@/lib/assistant/alert-writes';
import { listRideAlertsLocal, listShowFollowsLocal } from '@/lib/push/push-follows-store';
import { removeRideAlert, unfollowShow } from '@/lib/push/push-follows';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { isFavorite, toggleFavorite } from '@/lib/utils/favorites';
import { safeAssistantHref } from '@/lib/assistant/links';
import { localizedPath } from '@/lib/i18n/localized-path';
import { hreflangPath } from '@/lib/i18n/hreflang';
import { useRouter as useLocaleRouter } from '@/i18n/navigation';
import { localeSwitchPath } from '@/lib/assistant/switch-locale';
import { reopenAfterSwitch } from '@/lib/assistant/open';
import {
  type AssistantAction,
  type AssistantActionChip,
  type AssistantPlannerPark,
} from '@/lib/assistant/actions';

let promptIds = 0;

/** `HH:MM` as park-local minutes; the action check has already read the shape. */
const minuteOf = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));

/**
 * The planner's share row: the bell's popover in the panel, which holds the share link while push
 * is on and the switch that turns it on otherwise. Opened, never pressed: sharing stays the
 * visitor's tap.
 */
function revealShare(): void {
  window.setTimeout(() => {
    const trigger = document.querySelector<HTMLElement>('[data-planner-push-trigger]');
    if (trigger) trigger.click();
    else
      document
        .querySelector('[data-planner-share], [data-planner-push]')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 400);
}

/**
 * Carries out what Parky asked for, through the site's own paths: the router for a page,
 * next-intl's router for the same page in another language, the planner's store and its open and
 * optimise signals for the plan, so every write is counted and undoable like a press of the
 * planner's own buttons.
 */
export function useAssistantActions(closeWindow: () => void) {
  const router = useRouter();
  const localeRouter = useLocaleRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { addRide, addCustom, addShow } = usePlanner();

  return useCallback(
    async (action: AssistantAction): Promise<AssistantActionOutcome> => {
      const stepAside = () => {
        if (window.matchMedia(ASSISTANT_PHONE_QUERY).matches) closeWindow();
      };
      const showDay = (park: AssistantPlannerPark, date: string) => {
        plannerStore.update((state) => openDay(state, park, date));
        plannerUi.requestOpen('assistant');
        stepAside();
      };
      const base = (park: AssistantPlannerPark, date: string) => ({
        parkSlug: park.slug,
        parkName: park.name,
        geo: park.geo,
        timezone: park.timezone,
        date,
      });

      /**
       * One change to a day in one store write, with the day as it was kept for `planner_undo`; a
       * change that changes nothing (ids not in the plan) keeps the earlier undo and shows no chip.
       */
      const edit = (
        park: AssistantPlannerPark,
        date: string,
        recipe: (state: PlannerState) => PlannerState
      ): AssistantActionChip | null => {
        const changed = withUndo(park, date, () => plannerStore.update(recipe));
        showDay(park, date);
        return changed ? 'planned' : null;
      };
      /**
       * Runs writes to one day and keeps the day before and after them for `planner_undo`; writes
       * that change nothing keep the earlier undo. Whether anything changed.
       */
      const withUndo = (park: AssistantPlannerPark, date: string, run: () => void) => {
        const before = plannerStore.getSnapshot();
        run();
        const after = plannerStore.getSnapshot();
        if (after === before) return false;
        rememberParkyChange(before, after, park.slug, date);
        return true;
      };

      /** Today's `/plan/day` of the park, through the planner's own cache entry. */
      const today = (park: AssistantPlannerPark) =>
        queryClient
          .fetchQuery(planDayQuery({ ...park.geo, parkSlug: park.slug }))
          .catch(() => null);
      /**
       * Written at once where push is ready; otherwise a card whose button is the visitor's press,
       * since a permission prompt needs one.
       */
      const setAlert = async (
        target: AssistantAlertTarget | null
      ): Promise<AssistantActionOutcome> => {
        if (!target) return null;
        const prompt = { id: `alert-${++promptIds}`, target };
        if ((await readPushState()) !== 'ready') return { ...prompt, state: 'confirm' };
        const result = await writeAssistantAlert(target);
        return result.ok ? 'alert' : { ...prompt, state: 'failed', error: result.error };
      };

      switch (action.type) {
        case 'navigate': {
          const path = safeAssistantHref(action.path);
          if (!path) return null;
          router.push(localizedPath(path, locale));
          stepAside();
          return 'navigated';
        }
        case 'planner_open_day':
          showDay(action.park, action.date);
          return 'planned';
        case 'planner_add_rides':
          withUndo(action.park, action.date, () => {
            plannerStore.update((state) => openDay(state, action.park, action.date));
            for (const ride of action.rides) {
              addRide(
                {
                  ...base(action.park, action.date),
                  attractionSlug: ride.slug,
                  attractionName: ride.name,
                },
                'assistant'
              );
            }
          });
          showDay(action.park, action.date);
          return 'planned';
        case 'planner_add_block':
          withUndo(action.park, action.date, () => {
            plannerStore.update((state) => openDay(state, action.park, action.date));
            addCustom(
              {
                ...base(action.park, action.date),
                label: action.block.label,
                icon: action.block.icon,
                durationMinutes: action.block.durationMinutes,
                startMinute: action.block.startMinute,
              },
              'assistant'
            );
          });
          showDay(action.park, action.date);
          return 'planned';
        // The optimise row keeps its own undo; the sorted day is written later, there.
        case 'planner_optimize':
          showDay(action.park, action.date);
          plannerUi.requestOptimize(action.park.slug, action.date, action.mode);
          return 'optimized';
        case 'planner_remove':
          return edit(action.park, action.date, (state) =>
            action.entryIds.reduce(
              (s, id) => removeEntry(s, action.park.slug, action.date, id),
              state
            )
          );
        case 'planner_move':
          return edit(action.park, action.date, (state) =>
            moveEntryToIndex(state, action.park.slug, action.date, action.entryId, action.toIndex)
          );
        case 'planner_update_block': {
          const { park, date, entryId, label, start, durationMinutes } = action;
          return edit(park, date, (state) => {
            const block = entriesFor(state, park.slug, date).find((e) => e.id === entryId);
            // A free block only: a show's time and length are the performance's.
            if (!block?.custom || block.showSlug) return state;
            const relabelled = setCustomBlock(state, park.slug, date, entryId, {
              ...(label !== undefined ? { label } : {}),
              ...(durationMinutes !== undefined ? { durationMinutes } : {}),
            });
            return start === undefined
              ? relabelled
              : moveEntry(relabelled, park.slug, date, entryId, minuteOf(start));
          });
        }
        case 'planner_add_show': {
          const { park, date, showSlug, start } = action;
          // The performance as the planner's own show picker lists it, or nothing.
          const day = await queryClient
            .fetchQuery(planDayQuery({ ...park.geo, parkSlug: park.slug, date }))
            .catch(() => null);
          const line = day
            ? showLinesFor(
                day.shows,
                showDayHours(day.context.openHour, day.context.closeHour)
              ).find((l) => l.slug === showSlug && formatGridTime(l.minute) === start)
            : undefined;
          if (!line) return null;
          const planned = entriesFor(plannerStore.getSnapshot(), park.slug, date);
          if (planned.some((e) => e.showSlug === showSlug && e.startMinute === line.minute)) {
            showDay(park, date);
            return null;
          }
          withUndo(park, date, () =>
            addShow(
              {
                ...base(park, date),
                showSlug,
                showName: line.name,
                startMinute: line.minute,
              },
              'assistant'
            )
          );
          showDay(park, date);
          return 'planned';
        }
        case 'planner_set_prefs':
          return edit(action.park, action.date, (state) => {
            const opened = openDay(state, action.park, action.date);
            const next = setDayPrefs(opened, action.park.slug, action.date, action.prefs);
            return next === opened ? state : next;
          });
        case 'planner_mark_done':
          return edit(action.park, action.date, (state) =>
            action.entryIds.reduce((s, id) => {
              const entry = entriesFor(s, action.park.slug, action.date).find((e) => e.id === id);
              return !entry || !!entry.done === action.done
                ? s
                : setEntryDone(s, action.park.slug, action.date, id, action.done);
            }, state)
          );
        case 'planner_clear_day': {
          const chip = edit(action.park, action.date, (state) =>
            entriesFor(state, action.park.slug, action.date).length > 0 ||
            state.parks[action.park.slug]?.days[action.date]?.reserved
              ? clearDay(state, action.park.slug, action.date)
              : state
          );
          if (chip) trackPlannerDayCleared(action.park.slug);
          return chip;
        }
        case 'planner_reserve_days': {
          const before = plannerStore.getSnapshot();
          plannerStore.update((state) =>
            reserveDays(
              state,
              action.dates.map((date) => ({ park: action.park, date }))
            )
          );
          const after = plannerStore.getSnapshot();
          if (after === before) return null;
          for (const date of action.dates) {
            if (
              after.parks[action.park.slug]?.days[date] !==
              before.parks[action.park.slug]?.days[date]
            ) {
              rememberParkyChange(before, after, action.park.slug, date);
            }
          }
          showDay(action.park, action.dates[0]);
          return 'planned';
        }
        case 'planner_undo': {
          let outcome: ParkyUndoOutcome = 'none';
          plannerStore.update((state) => {
            const undone = undoParkyChange(state, action.park, action.date);
            outcome = undone.outcome;
            return undone.state;
          });
          if (outcome === 'none') return null;
          showDay(action.park, action.date);
          // The visitor changed the day since: it stays as they left it, and Parky can say so.
          return outcome === 'undone' ? 'planned' : 'undoStale';
        }
        case 'planner_share': {
          const state = plannerStore.getSnapshot();
          if (!hasAnyPlan(state)) return null;
          // The bell is drawn only over a day with entries, so the panel opens on one.
          if (entriesFor(state, state.activeParkSlug, state.activeDate).length === 0) {
            const next = assistantPlannerSnapshot(state)?.days.find((d) => d.entries.length > 0);
            if (next) plannerStore.update((s) => setActive(s, next.park.slug, next.date));
          }
          plannerUi.requestOpen('assistant');
          stepAside();
          revealShare();
          return 'planned';
        }
        case 'alert_ride_set':
        case 'alert_show_set':
          return setAlert(alertTarget(action));
        case 'alert_remove': {
          const { park, rideSlug, showSlug } = action;
          // The mirror names what this browser set; today's day is the fallback for an older entry.
          const mine = (entry: { parkSlug?: string; slug?: string }, slug?: string) =>
            !!slug && entry.parkSlug === park.slug && entry.slug === slug;
          let rideId = listRideAlertsLocal().find((a) => mine(a, rideSlug))?.attractionId;
          let showId = listShowFollowsLocal().find((f) => mine(f, showSlug))?.showId;
          if ((rideSlug && !rideId) || (showSlug && !showId)) {
            const day = await today(park);
            rideId ??=
              day?.rides.find((r) => r.attractionSlug === rideSlug)?.attractionId ?? undefined;
            showId ??= day?.shows?.find((s) => s.showSlug === showSlug)?.showId ?? undefined;
          }
          // The action names exactly one; an id neither the mirror nor today's day knows is ignored.
          const result = rideId
            ? await removeRideAlert(rideId)
            : showId
              ? await unfollowShow(showId)
              : null;
          if (result?.ok) {
            trackSiteEvent(
              rideId ? 'ride_alert_removed' : 'show_follow_remove',
              {},
              (rideId ?? showId) as string
            );
          }
          return removalOutcome(result);
        }
        case 'favorite_set': {
          // Set, never toggled blindly: a star already in the asked state stays as it is.
          if (isFavorite(action.entity, action.id) === action.on) return null;
          toggleFavorite(action.entity, action.id);
          // Counted like a star's press, which is also what plays Parky's `love`.
          trackSiteEvent(
            action.on ? 'favorite_add' : 'favorite_remove',
            { type: action.entity },
            action.id
          );
          return action.on ? 'favorite' : 'unfavorite';
        }
        case 'switch_locale': {
          if (action.locale === locale) return null;
          const path = localeSwitchPath(
            window.location.pathname,
            action.locale,
            hreflangPath(action.locale)
          );
          if (!path) return null;
          // The window stays open: the new locale mounts the layout afresh, and the launcher there
          // opens it again with the chat from session storage.
          reopenAfterSwitch();
          localeRouter.replace(`${path}${window.location.search}`, { locale: action.locale });
          return 'language';
        }
        case 'feedback_sent':
          return 'feedback';
        default:
          return null;
      }
    },
    [router, localeRouter, locale, addRide, addCustom, addShow, queryClient, closeWindow]
  );
}
