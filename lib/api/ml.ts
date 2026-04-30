import { api } from './client';
import type { MLDashboardDto, ModelMetricsHistoryResponse } from './types';

/**
 * Get ML model dashboard — accuracy, coverage, model health.
 * The ML dashboard changes only on model retraining; cache for 1h.
 */
export async function getMLDashboard(): Promise<MLDashboardDto> {
  return api.get<MLDashboardDto>('/v1/ml/dashboard', {
    next: { revalidate: 1800 },
  });
}

/**
 * Get ML model metrics history for sparklines.
 * Returns up to `limit` snapshots, oldest first.
 * Cache for 1h — training runs once daily at 06:00 UTC.
 */
export async function getMLMetricsHistory(limit = 50): Promise<ModelMetricsHistoryResponse> {
  return api.get<ModelMetricsHistoryResponse>('/v1/ml/models/metrics-history', {
    params: { limit },
    next: { revalidate: 1800 },
  });
}
