import { cacheLife } from 'next/cache';
import { api } from './client';
import type { MLDashboardDto, ModelMetricsHistoryResponse } from './types';

/**
 * Get ML model dashboard — accuracy, coverage, model health.
 *
 * Changes only on model retraining (once daily at 06:00 UTC), and it's server-rendered into the
 * homepage <Suspense> seed with no client refresh — so a 30-min cacheLife was both needless (the
 * data moves daily) and the MIN that pinned the (6-locale) homepage shell to a 30-min ISR-write
 * cadence. Cached 1d to match the data's real cadence and lift that floor.
 */
export async function getMLDashboard(): Promise<MLDashboardDto> {
  'use cache';
  cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 * 2 });
  return api.get<MLDashboardDto>('/v1/ml/dashboard');
}

/**
 * Get ML model metrics history for sparklines (oldest first, up to `limit`).
 * Cached 1d — training runs once daily at 06:00 UTC (see {@link getMLDashboard}).
 */
export async function getMLMetricsHistory(limit = 50): Promise<ModelMetricsHistoryResponse> {
  'use cache';
  cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 * 2 });
  return api.get<ModelMetricsHistoryResponse>('/v1/ml/models/metrics-history', {
    params: { limit },
  });
}
