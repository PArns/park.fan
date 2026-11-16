import { z } from 'zod';
import { locales } from '@/i18n/config';
import { API_SCOPES, DEFAULT_KEY_REQUESTS_PER_HOUR, sortScopes, type ApiScope } from './scopes';

/**
 * A request for a data key, as the portal's form sends it and the admin reviews it. The form asks
 * for what decides the key: who to reach, what the project is, how it makes money and which
 * scopes it needs. Shared by the form, the public route that stores it and the admin's review.
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

/** Whether its source is public. */
export const SOURCE_MODELS = ['open-source', 'closed-source'] as const;
export type SourceModel = (typeof SOURCE_MODELS)[number];

/**
 * How the project earns money, several at once. `none` stands alone. The terms' examples of
 * commercial use (Impressum, `#data-use`) are each a value here, so the form can tell an applicant
 * before sending that the request needs an agreement.
 */
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

/** The revenue models that make a use commercial under the terms. */
export const COMMERCIAL_REVENUE: ReadonlySet<RevenueModel> = new Set([
  'ads',
  'affiliate',
  'paid',
  'client-work',
  'company',
]);

/** Requests per day the project expects, in brackets an applicant can estimate. */
export const REQUEST_VOLUMES = ['under-1k', 'under-10k', 'under-100k', 'more'] as const;
export type RequestVolume = (typeof REQUEST_VOLUMES)[number];

/** Field lengths, shared by the form's `maxLength` and the schema. */
export const KEY_REQUEST_LIMITS = {
  name: 80,
  email: 200,
  organisation: 120,
  /** The project's name becomes the key's name, which the API caps at 80. */
  projectName: 80,
  url: 200,
  descriptionMin: 40,
  description: 2000,
  parks: 300,
  message: 1000,
} as const;

const L = KEY_REQUEST_LIMITS;

/** An http(s) URL, or nothing. A bare host (`example.org`) is read as https. */
const optionalUrl = z
  .string()
  .trim()
  .max(L.url)
  .transform((value) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value))
  .refine((value) => value === '' || z.url({ protocol: /^https?$/ }).safeParse(value).success, {
    message: 'invalid-url',
  });

/** What the form sends, without the Turnstile token. */
export const keyRequestInputSchema = z
  .object({
    locale: z.enum(locales),
    name: z.string().trim().min(1).max(L.name),
    email: z.string().trim().max(L.email).pipe(z.email()),
    organisation: z.string().trim().max(L.organisation).default(''),
    projectName: z.string().trim().min(1).max(L.projectName),
    website: optionalUrl.default(''),
    kind: z.enum(PROJECT_KINDS),
    source: z.enum(SOURCE_MODELS),
    repository: optionalUrl.default(''),
    revenue: z
      .array(z.enum(REVENUE_MODELS))
      .min(1)
      .refine((values) => !values.includes('none') || values.length === 1, {
        message: 'none-stands-alone',
      }),
    scopes: z.array(z.enum(API_SCOPES)).min(1).transform(sortScopes),
    volume: z.enum(REQUEST_VOLUMES),
    parks: z.string().trim().max(L.parks).default(''),
    description: z.string().trim().min(L.descriptionMin).max(L.description),
    message: z.string().trim().max(L.message).default(''),
    /** The applicant accepts the terms, the credit with a link among them. */
    terms: z.literal(true),
  })
  .refine((input) => input.source !== 'open-source' || input.repository !== '', {
    message: 'repository-required',
    path: ['repository'],
  });

/** A validated request as the form sent it. */
export type KeyRequestInput = z.infer<typeof keyRequestInputSchema>;

/** Where a request stands. */
export type KeyRequestStatus = 'pending' | 'approved' | 'rejected';

/** The admin's decision on a request. */
export interface KeyRequestDecision {
  at: string;
  /** The admin's display name. */
  by: string;
  /** The key issued for it; approved requests only. */
  keyId?: string;
  /** Its first characters, as the key list shows them. */
  keyPrefix?: string;
  /** Why it was turned down, for the reply. */
  reason?: string;
}

/** A stored request. */
export interface KeyRequestRecord extends KeyRequestInput {
  id: string;
  createdAt: string;
  status: KeyRequestStatus;
  userAgent?: string;
  decision?: KeyRequestDecision;
}

/** The revenue models make the use commercial, so it needs a written agreement. */
export function isCommercialRequest(revenue: readonly RevenueModel[]): boolean {
  return revenue.some((model) => COMMERCIAL_REVENUE.has(model));
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
 * The hourly allowance to start the key dialog with: about four times the hourly average of the
 * expected daily volume, so a morning peak fits, never below the API's default of 1,000. Null for
 * the open bracket, where the admin decides.
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

/** The scopes a request asked for, in the catalog's order. */
export function requestedScopes(request: Pick<KeyRequestInput, 'scopes'>): ApiScope[] {
  return API_SCOPES.filter((scope) => request.scopes.includes(scope));
}

/** The path the form posts to. */
export const KEY_REQUEST_PATH = '/api/developers/key-request';
