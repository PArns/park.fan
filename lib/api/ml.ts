import { api } from './client';
import type { MLDashboardDto, ModelMetricsHistoryResponse } from './types';

/**
 * Get ML model dashboard — accuracy, coverage, model health.
 * Changes only on model retraining; cached 30 min in the Vercel Data Cache.
 */
export function getMLDashboard(): Promise<MLDashboardDto> {
  return api.get<MLDashboardDto>('/v1/ml/dashboard', {
    next: { revalidate: 1800, tags: ['ml'] },
  });
}

/**
 * Get ML model metrics history for sparklines (oldest first, up to `limit`).
 * Cached 30 min — training runs once daily at 06:00 UTC.
 */
export function getMLMetricsHistory(limit = 50): Promise<ModelMetricsHistoryResponse> {
  return api.get<ModelMetricsHistoryResponse>('/v1/ml/models/metrics-history', {
    params: { limit },
    next: { revalidate: 1800, tags: ['ml'] },
  });
}
