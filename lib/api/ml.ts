import { api } from './client';
import type { MLDashboardDto, ModelMetricsHistoryResponse } from './types';

/**
 * Get ML model dashboard — accuracy, coverage, model health.
 *
 * Cached for a DAY, because that is how often the number moves: training runs once at 06:00 UTC.
 * The hour it used to hold was not a freshness decision, it was a floor — the comment here said
 * "anything lower would pin the homepage shell's ISR window below its 3600s", which read the
 * dependency backwards. `MLStatsSection` is rendered on the homepage through the AI story chapter,
 * so this fetch WAS the homepage's ISR window, and it held 12 prerendered pages (home + /fancast,
 * six locales each) to 24 rebuilds a day for a figure that changes once.
 */
export function getMLDashboard(): Promise<MLDashboardDto> {
  return api.get<MLDashboardDto>('/v1/ml/dashboard', {
    next: { revalidate: 86400, tags: ['ml'] },
  });
}

/**
 * Get ML model metrics history for sparklines (oldest first, up to `limit`).
 * Cached a day, for the same reason as the dashboard above: training runs once daily at 06:00 UTC.
 */
export function getMLMetricsHistory(limit = 50): Promise<ModelMetricsHistoryResponse> {
  return api.get<ModelMetricsHistoryResponse>('/v1/ml/models/metrics-history', {
    params: { limit },
    next: { revalidate: 86400, tags: ['ml'] },
  });
}
