import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionCall, SessionApiError } from '@/lib/admin/session-client';

/**
 * A member's own storage, for members-only features: one JSON value per key, kept by the API for
 * the signed-in account (`/v1/account/storage`, at most 64 KB per value and 100 keys). A feature
 * picks a key of `a-z0-9._-` for itself, such as `notes` or `planner.presets`.
 */

/** The React Query key of one stored value. */
export function accountValueQueryKey(key: string) {
  return ['account', 'storage', key] as const;
}

const path = (key: string) => `/api/account/storage/${encodeURIComponent(key)}`;

/** The keys the member stored, newest first, with their size in bytes. */
export function listAccountKeys(): Promise<{
  items: { key: string; bytes: number; updatedAt: string }[];
}> {
  return sessionCall('/api/account/storage');
}

/** The value under a key, or `undefined` when nothing is stored there. */
export async function readAccountValue<T>(key: string): Promise<T | undefined> {
  try {
    return (await sessionCall<{ value: T }>(path(key))).value;
  } catch (error) {
    if (error instanceof SessionApiError && error.status === 404) return undefined;
    throw error;
  }
}

/** Stores a value under a key, replacing what was there. */
export function writeAccountValue(key: string, value: unknown): Promise<void> {
  return sessionCall(path(key), { method: 'PUT', body: { value } });
}

/** Removes a key. */
export function removeAccountValue(key: string): Promise<void> {
  return sessionCall(path(key), { method: 'DELETE' });
}

/**
 * One stored value as React state: `value` is `fallback` until the API answered or when nothing is
 * stored; `save` writes it and shows the new value at once. Only for members: render it inside
 * `MembersOnly` or `MemberPage`.
 */
export function useAccountValue<T>(key: string, fallback: T) {
  const client = useQueryClient();
  const queryKey = accountValueQueryKey(key);
  const query = useQuery({
    queryKey,
    queryFn: () => readAccountValue<T>(key),
    staleTime: 60_000,
  });
  const mutation = useMutation({
    mutationFn: (value: T) => writeAccountValue(key, value),
    onMutate: (value) => {
      const previous = client.getQueryData<T | undefined>(queryKey);
      client.setQueryData(queryKey, value);
      return { previous };
    },
    onError: (_error, _value, context) => client.setQueryData(queryKey, context?.previous),
  });
  return {
    value: query.data ?? fallback,
    loading: query.isPending,
    saving: mutation.isPending,
    error: query.error ?? mutation.error,
    save: (value: T) => mutation.mutateAsync(value),
  };
}
