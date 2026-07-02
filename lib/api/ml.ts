import { api } from './client';
import type { MLDashboardDto, ModelMetricsHistoryResponse } from './types';

/**
 * Get ML model dashboard — accuracy, coverage, model health.
 * Changes only on model retraining (daily at 06:00 UTC); cached 1h in the Vercel Data
 * Cache — anything lower would pin the homepage shell's ISR window below its 3600s.
 */
export function getMLDashboard(): Promise<MLDashboardDto> {
  return api.get<MLDashboardDto>('/v1/ml/dashboard', {
    next: { revalidate: 3600, tags: ['ml'] },
  });
}

/**
 * Get ML model metrics history for sparklines (oldest first, up to `limit`).
 * Cached 1h — training runs once daily at 06:00 UTC.
 */
export function getMLMetricsHistory(limit = 50): Promise<ModelMetricsHistoryResponse> {
  return api.get<ModelMetricsHistoryResponse>('/v1/ml/models/metrics-history', {
    params: { limit },
    next: { revalidate: 3600, tags: ['ml'] },
  });
}
