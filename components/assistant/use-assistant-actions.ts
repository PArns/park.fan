'use client';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerStore } from '@/lib/planner/store';
import { plannerUi } from '@/lib/planner/ui-store';
import { openDay } from '@/lib/planner/actions';
import { safeAssistantHref } from '@/lib/assistant/links';
import {
  localizedPath,
  type AssistantAction,
  type AssistantActionChip,
  type AssistantPlannerPark,
} from '@/lib/assistant/actions';

/** Below `sm` Parky's window covers the page, so it steps aside after acting on it. */
const PHONE = '(max-width: 639px)';

/**
 * Carries out what Parky asked for, through the site's own paths: the router for a page, the
 * planner's store and its open and optimise signals for the plan, so every write is counted and
 * undoable like a press of the planner's own buttons.
 */
export function useAssistantActions(closeWindow: () => void) {
  const router = useRouter();
  const locale = useLocale();
  const { addRide, addCustom } = usePlanner();

  return useCallback(
    (action: AssistantAction): AssistantActionChip | null => {
      const stepAside = () => {
        if (window.matchMedia(PHONE).matches) closeWindow();
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
          showDay(action.park, action.date);
          return 'planned';
        case 'planner_add_block':
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
          showDay(action.park, action.date);
          return 'planned';
        case 'planner_optimize':
          showDay(action.park, action.date);
          plannerUi.requestOptimize(action.park.slug, action.date, action.mode);
          return 'optimized';
        default:
          return null;
      }
    },
    [router, locale, addRide, addCustom, closeWindow]
  );
}
