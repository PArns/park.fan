'use client';

import { useCallback, useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  deriveAdminHealth,
  type AdminHealth,
  type HealthAreaId,
  type Reading,
} from '@/lib/admin/health';
import type { DataQualityReport, QueueStatusResponse, SystemHealthResponse } from '@/lib/api/admin';
import type { MlOverview } from '@/lib/api/admin-ml-overview';
import type { SubmissionSummary } from '@/lib/contribute/types';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { useCan } from '../_app/session';
import {
  ADMIN_PATHS,
  adminKeys,
  DATA_QUALITY_DEFAULT_WINDOW,
  useAdminQuery,
  type AdminApiError,
} from './api';

/** Host, feeds and queues move by the minute; the detectors and the models by the hour. */
const FAST_STALE_MS = 60_000;
const SLOW_STALE_MS = 5 * 60_000;

/** The monitoring answers as they arrived; `undefined` until one did. */
export interface AdminHealthData {
  system: SystemHealthResponse | undefined;
  queues: QueueStatusResponse | undefined;
  quality: DataQualityReport | undefined;
  ml: MlOverview | undefined;
  contributions: SubmissionSummary | undefined;
}

/** A query as the derivation reads it. Data from before a failed refetch still counts. */
function readingOf<T>(query: UseQueryResult<T, AdminApiError>): Reading<T> {
  if (query.data !== undefined) return { state: 'ok', data: query.data };
  if (query.isError) {
    return query.error.isForbidden
      ? { state: 'forbidden' }
      : { state: 'failed', message: query.error.message };
  }
  return { state: 'loading' };
}

/**
 * The admin's situation for the overview and the sidebar's dots: reads the five monitoring
 * answers under the keys their own pages use (so answering a data-quality card clears its count
 * here too) and folds them with `deriveAdminHealth`. `live` polls host and queues every minute
 * while the tab is in front; without it they refresh on focus. `retry` asks one area's source
 * again.
 */
export function useAdminHealth({ live = false }: { live?: boolean } = {}): {
  health: AdminHealth;
  /** The answers themselves, for the figures the overview draws beside the verdicts. */
  data: AdminHealthData;
  retry: (area: HealthAreaId) => void;
} {
  const canModerate = useCan('author');
  const now = useMinuteNow();
  const poll = live ? FAST_STALE_MS : false;

  const system = useAdminQuery<SystemHealthResponse>(
    adminKeys.raw(ADMIN_PATHS.systemHealth),
    ADMIN_PATHS.systemHealth,
    { staleTime: FAST_STALE_MS, refetchInterval: poll }
  );
  const queues = useAdminQuery<QueueStatusResponse>(
    adminKeys.raw(ADMIN_PATHS.queueStatus),
    ADMIN_PATHS.queueStatus,
    { staleTime: FAST_STALE_MS, refetchInterval: poll }
  );
  const quality = useAdminQuery<DataQualityReport>(
    adminKeys.dataQuality(DATA_QUALITY_DEFAULT_WINDOW),
    ADMIN_PATHS.dataQuality(DATA_QUALITY_DEFAULT_WINDOW),
    { staleTime: SLOW_STALE_MS }
  );
  const ml = useAdminQuery<MlOverview>(
    adminKeys.raw(ADMIN_PATHS.mlOverview),
    ADMIN_PATHS.mlOverview,
    { staleTime: SLOW_STALE_MS }
  );
  // The summary answers from `author` up; a viewer would only collect a 403.
  const contributions = useAdminQuery<SubmissionSummary>(
    adminKeys.contributionsSummary,
    ADMIN_PATHS.contributionsSummary,
    { enabled: canModerate, staleTime: SLOW_STALE_MS }
  );

  const health = useMemo(
    () =>
      deriveAdminHealth({
        system: readingOf(system),
        queues: readingOf(queues),
        quality: readingOf(quality),
        ml: readingOf(ml),
        contributions: canModerate ? readingOf(contributions) : { state: 'forbidden' },
        now: now ?? 0,
      }),
    // The query objects are new on every render; what the derivation reads is this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      system.data,
      system.error,
      queues.data,
      queues.error,
      quality.data,
      quality.error,
      ml.data,
      ml.error,
      contributions.data,
      contributions.error,
      canModerate,
      now,
    ]
  );

  const { refetch: refetchSystem } = system;
  const { refetch: refetchQueues } = queues;
  const { refetch: refetchQuality } = quality;
  const { refetch: refetchMl } = ml;
  const retry = useCallback(
    (area: HealthAreaId) => {
      if (area === 'queues') void refetchQueues();
      else if (area === 'models') void refetchMl();
      else if (area === 'quality') void refetchQuality();
      else void refetchSystem();
    },
    [refetchSystem, refetchQueues, refetchQuality, refetchMl]
  );

  return {
    health,
    data: {
      system: system.data,
      queues: queues.data,
      quality: quality.data,
      ml: ml.data,
      contributions: canModerate ? contributions.data : undefined,
    },
    retry,
  };
}
