import { api } from './client';
import type { MLDashboardDto, ModelMetricsHistoryResponse } from './types';

/**
 * Get the ML model dashboard (accuracy, coverage, model health), cached a day because training
 * runs once a day. This fetch sets the ISR window of the pages that render `MLStatsSection`,
 * including the homepage. See docs/rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md.
 */
export function getMLDashboard(): Promise<MLDashboardDto> {
  return api.get<MLDashboardDto>('/v1/ml/dashboard', {
    next: { revalidate: 86400, tags: ['ml'] },
  });
}

/** Get ML metrics history for sparklines (oldest first, up to `limit`), cached a day likewise. */
export function getMLMetricsHistory(limit = 50): Promise<ModelMetricsHistoryResponse> {
  return api.get<ModelMetricsHistoryResponse>('/v1/ml/models/metrics-history', {
    params: { limit },
    next: { revalidate: 86400, tags: ['ml'] },
  });
}
