import { DEFAULT_KEY_REQUESTS_PER_HOUR, sortPermissions, type ApiPermission } from './permissions';

/**
 * A request for a data key, as the developer dashboard's form fills it in and the API stores it
 * (`api_key_requests`, `CreateApiKeyRequestDto` in v4.api.park.fan). Every request is decided by
 * hand; the answers decide which key the terms allow (`requestTier`).
 */

/** What the project is. */
export const PROJECT_KINDS = [
  'mobile-app',
  'website',
  'smart-home',
  'chat-bot',
  'research',
  'internal-tool',
  'other',
] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

/** Where the project runs. */
export const PLATFORMS = ['ios', 'android', 'web', 'desktop', 'server', 'other'] as const;
export type Platform = (typeof PLATFORMS)[number];

/** Whether its source is public. */
export const SOURCE_MODELS = ['open-source', 'closed-source'] as const;
export type SourceModel = (typeof SOURCE_MODELS)[number];

/** How the project earns money, several at once; `none` stands alone. */
export const REVENUE_MODELS = [
  'none',
  'donations',
  'ads',
  'affiliate',
  'paid',
  'client-work',
  'company',
] as const;
export type RevenueModel = (typeof REVENUE_MODELS)[number];

/** What a free key allows besides earning nothing: donations and sponsorship. */
export const FREE_REVENUE: ReadonlySet<RevenueModel> = new Set(['none', 'donations']);

/** Requests per day the project expects. */
export const REQUEST_VOLUMES = ['under-1k', 'under-10k', 'under-100k', 'more'] as const;
export type RequestVolume = (typeof REQUEST_VOLUMES)[number];

/** Which key the terms allow: free, or paid under a written agreement. */
export type RequestTier = 'free' | 'paid';

/** Where a request stands. */
export type KeyRequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

/** Field lengths, the backend's `REQUEST_LIMITS`. */
export const KEY_REQUEST_LIMITS = {
  projectName: 80,
  url: 300,
  languages: 200,
  descriptionMin: 40,
  description: 3000,
  license: 80,
  endpoints: 2000,
  parks: 500,
  caching: 1000,
  message: 2000,
  reason: 2000,
} as const;

/** What the form sends to `POST /v1/developer/requests`. */
export interface KeyRequestInput {
  projectName: string;
  website?: string;
  kind: ProjectKind;
  platforms: Platform[];
  languages?: string;
  description: string;
  source: SourceModel;
  repository?: string;
  license?: string;
  revenue: RevenueModel[];
  permissions: ApiPermission[];
  endpoints?: string;
  volume: RequestVolume;
  parks?: string;
  serverSide: boolean;
  caching?: string;
  attributionUrl: string;
  message?: string;
  locale: string;
  terms: true;
}

/** A stored request, as the API answers it. Fields the API left null are absent. */
export interface KeyRequestRecord extends Omit<KeyRequestInput, 'terms'> {
  id: string;
  userId: string;
  status: KeyRequestStatus;
  tier: RequestTier;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  /** Why it was turned down, or the owner's message beside the approval. */
  decisionNote?: string;
  keyId?: string;
  /** The account that asked; the admin list only. */
  applicant?: { email: string; displayName: string } | null;
}

/**
 * Which key the terms allow: free only for an open-source project that earns nothing but
 * donations; any other use is a paid key. The backend's `requestTier`.
 */
export function requestTier(input: {
  source: SourceModel | null;
  revenue: readonly RevenueModel[];
}): RequestTier {
  const earnsNothing =
    input.revenue.length > 0 && input.revenue.every((model) => FREE_REVENUE.has(model));
  return input.source === 'open-source' && earnsNothing ? 'free' : 'paid';
}

/** The revenue checkboxes after one was toggled: `none` clears the others, any other clears it. */
export function toggleRevenue(
  current: readonly RevenueModel[],
  model: RevenueModel,
  checked: boolean
): RevenueModel[] {
  if (!checked) return current.filter((value) => value !== model);
  if (model === 'none') return ['none'];
  return [...current.filter((value) => value !== 'none' && value !== model), model];
}

/**
 * The hourly allowance to start the approval with: about four times the hourly average of the
 * expected daily volume, so a morning peak fits, never below the API's default. Null for the open
 * bracket, where the admin decides.
 */
export function suggestedRequestsPerHour(volume: RequestVolume): number | null {
  switch (volume) {
    case 'under-1k':
    case 'under-10k':
      return DEFAULT_KEY_REQUESTS_PER_HOUR;
    case 'under-100k':
      return 20_000;
    case 'more':
      return null;
  }
}

/** The permissions a request asked for, in the catalog's order. */
export function requestedPermissions(
  request: Pick<KeyRequestInput, 'permissions'>
): ApiPermission[] {
  return sortPermissions(request.permissions);
}

/** An http(s) URL as the API accepts it, a bare host read as https; null for anything else. */
export function normalizeUrl(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  const withScheme = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes('.') ? url.toString() : null;
  } catch {
    return null;
  }
}
