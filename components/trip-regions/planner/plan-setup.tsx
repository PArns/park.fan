import type { ReactNode } from 'react';

/**
 * `lg`, where the planner's result draws its panels inline; below it the same panels are sheets.
 * The questions themselves are the assistant's (`TripWizard`) at every width.
 */
export const PLAN_WIDE_QUERY = '(min-width: 64rem)';

/** What a region with bases adds to the planner: the Route, and its hotel rows per city. */
export interface PlanSetupRoute {
  /** The Route step itself (`PlanRoute`). */
  body: ReactNode;
  /** Its one line: the ends and the cities with their nights. */
  summary: string;
  /** The hotel per city and the hotel change's buffer. */
  options: ReactNode;
}
