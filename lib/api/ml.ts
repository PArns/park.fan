import { cacheLife } from 'next/cache';
import { api } from './client';
import type { MLDashboardDto, ModelMetricsHistoryResponse } from './types';

/**
 * Get ML model dashboard — accuracy, coverage, model health.
 * Changes only on model retraining; cached 30 min.
 */
export async function getMLDashboard(): Promise<MLDashboardDto> {
  'use cache';
  cacheLife({ stale: 1800, revalidate: 1800, expire: 7200 });
  return api.get<MLDashboardDto>('/v1/ml/dashboard');
}

/**
 * Get ML model metrics history for sparklines (oldest first, up to `limit`).
 * Cached 30 min — training runs once daily at 06:00 UTC.
 */
export async function getMLMetricsHistory(limit = 50): Promise<ModelMetricsHistoryResponse> {
  'use cache';
  cacheLife({ stale: 1800, revalidate: 1800, expire: 7200 });
  return api.get<ModelMetricsHistoryResponse>('/v1/ml/models/metrics-history', {
    params: { limit },
  });
}
