/**
 * The key requests from the developer portal, as `/admin/api-keys` reviews them: German labels for
 * what the form asked, the key dialog's starting values for a request, and the reply mails. The
 * requests live in this app's own store (`lib/developers/key-request-store.ts`), behind
 * `/api/admin/developer-requests`, owner only.
 */
import { SITE_URL } from '@/i18n/config';
import { DATA_TERMS_ANCHOR } from '@/lib/agents/licensing';
import { DEVELOPERS_PATH } from '@/lib/developers/paths';
import {
  isCommercialRequest,
  requestedScopes,
  suggestedRequestsPerHour,
  type KeyRequestRecord,
  type ProjectKind,
  type RequestVolume,
  type RevenueModel,
  type SourceModel,
} from '@/lib/developers/key-request';
import { apiKeyCurlExample, type ApiScope } from '@/lib/developers/scopes';
import { formatScopes, type DataApiKey, type DataApiKeyUsage } from './api-keys';

/** The proxy path of the request list, and of one request. */
export const KEY_REQUESTS_PATH = '/api/admin/developer-requests';
export function keyRequestPath(id: string): string {
  return `${KEY_REQUESTS_PATH}/${encodeURIComponent(id)}`;
}

/** The React Query key of the list. */
export const KEY_REQUESTS_QUERY_KEY = ['admin', 'developer-requests'] as const;

export const PROJECT_KIND_LABELS: Record<ProjectKind, string> = {
  'mobile-app': 'App für iOS oder Android',
  website: 'Website oder Blog',
  'smart-home': 'Smart Home, Widget, Anzeige',
  'chat-bot': 'Bot oder Assistent',
  research: 'Forschung, Studium, Schule',
  'internal-tool': 'Werkzeug der eigenen Firma',
  other: 'Etwas anderes',
};

export const SOURCE_MODEL_LABELS: Record<SourceModel, string> = {
  'open-source': 'Open Source',
  'closed-source': 'Quellcode nicht öffentlich',
};

export const REVENUE_MODEL_LABELS: Record<RevenueModel, string> = {
  none: 'kostenlos, ohne Werbung',
  donations: 'Spenden oder Sponsoring',
  ads: 'Werbung',
  affiliate: 'Affiliate- oder bezahlte Links',
  paid: 'Kaufpreis, Abo oder In-App-Käufe',
  'client-work': 'Auftragsarbeit',
  company: 'Produkt einer Firma',
};

export const REQUEST_VOLUME_LABELS: Record<RequestVolume, string> = {
  'under-1k': 'unter 1.000 pro Tag',
  'under-10k': '1.000 bis 10.000 pro Tag',
  'under-100k': '10.000 bis 100.000 pro Tag',
  more: 'mehr als 100.000 pro Tag',
};

/** What the key dialog starts with for a request; the admin can change every field. */
export interface KeyRequestPrefill {
  requestId: string;
  name: string;
  contact: string;
  usage: DataApiKeyUsage;
  note: string;
  /** Null for no per-key limit. */
  requestsPerHour: number | null;
  scopes: ApiScope[];
}

/**
 * The key dialog's starting values for a request: the project's name, the applicant's address,
 * commercial when a revenue model makes it so, the allowance its volume suggests, the scopes it
 * asked for, and a note that says where the key came from.
 */
export function keyRequestPrefill(request: KeyRequestRecord): KeyRequestPrefill {
  const parks = request.parks ? ` Parks laut Antrag: ${request.parks}.` : '';
  return {
    requestId: request.id,
    name: request.projectName,
    contact: request.email,
    usage: isCommercialRequest(request.revenue) ? 'commercial' : 'non-commercial',
    note: `Antrag vom ${request.createdAt.slice(0, 10)}, ${request.name}.${parks}`.slice(0, 500),
    requestsPerHour: suggestedRequestsPerHour(request.volume),
    scopes: requestedScopes(request),
  };
}

/** A `mailto:` link with subject and body, for the admin's own mail program. */
function mailto(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** German for an applicant who wrote from the German page, English for everybody else. */
function replyLocale(request: Pick<KeyRequestRecord, 'locale'>): 'de' | 'en' {
  return request.locale === 'de' ? 'de' : 'en';
}

const SCOPE_NAMES_EN: Record<ApiScope, string> = {
  forecasts: 'forecasts',
  planner: 'day and trip planner',
  statistics: 'statistics',
  curated: 'curated park data',
  travel: 'travel data',
};

/**
 * The approval mail with the key in it, in the applicant's language: what the key opens, its
 * allowance, how to send it, where it must not go, the credit, and the links. `scopes` is null
 * when the API does not store scopes yet, and the mail leaves the line out.
 */
export function keyApprovalMailto(
  request: KeyRequestRecord,
  key: string,
  item: Pick<DataApiKey, 'requestsPerHour'>,
  scopes: readonly ApiScope[] | null,
  signature: string
): string {
  const lang = replyLocale(request);
  const portal = `${SITE_URL}/${lang}${DEVELOPERS_PATH}`;
  const terms = `${SITE_URL}/${lang}/impressum#${DATA_TERMS_ANCHOR}`;
  if (lang === 'de') {
    const limit =
      item.requestsPerHour === null
        ? 'ohne eigenes Stundenlimit'
        : `${item.requestsPerHour.toLocaleString('de-DE')} Anfragen pro Stunde`;
    const lines = [
      `Hallo ${request.name},`,
      '',
      `dein Antrag für ${request.projectName} ist bewilligt. Hier ist dein API-Key:`,
      '',
      key,
      '',
      ...(scopes ? [`Er öffnet: ${formatScopes(scopes)}.`] : []),
      `Limit: ${limit}.`,
      '',
      'So schickst du ihn mit:',
      apiKeyCurlExample(key),
      '',
      'Der Key gehört auf deinen Server, nicht in eine App oder in das JavaScript einer Webseite. Nenn park.fan bitte als Quelle, mit einem Link auf die Seite des Parks oder der Attraktion.',
      '',
      `Alles zur API: ${portal}`,
      `Nutzungsbedingungen: ${terms}`,
      '',
      'Viele Grüße',
      signature,
    ];
    return mailto(request.email, `Dein API-Key für ${request.projectName}`, lines.join('\n'));
  }
  const limit =
    item.requestsPerHour === null
      ? 'no hourly limit of its own'
      : `${item.requestsPerHour.toLocaleString('en-GB')} requests an hour`;
  const lines = [
    `Hi ${request.name},`,
    '',
    `your request for ${request.projectName} is approved. Here is your API key:`,
    '',
    key,
    '',
    ...(scopes ? [`It opens: ${scopes.map((scope) => SCOPE_NAMES_EN[scope]).join(', ')}.`] : []),
    `Limit: ${limit}.`,
    '',
    'Send it like this:',
    apiKeyCurlExample(key),
    '',
    "The key belongs on your server, not in an app or a web page's JavaScript. Please name park.fan as the source, with a link to the page of the park or attraction.",
    '',
    `Everything about the API: ${portal}`,
    `Terms of use: ${terms}`,
    '',
    'Best regards',
    signature,
  ];
  return mailto(request.email, `Your API key for ${request.projectName}`, lines.join('\n'));
}

/** The reply to a request that was turned down, with the reason when the admin gave one. */
export function keyRejectionMailto(request: KeyRequestRecord, signature: string): string {
  const reason = request.decision?.reason;
  if (replyLocale(request) === 'de') {
    const lines = [
      `Hallo ${request.name},`,
      '',
      `danke für deinen Antrag für ${request.projectName}. Einen API-Key kann ich dafür nicht ausstellen.`,
      ...(reason ? ['', reason] : []),
      '',
      'Viele Grüße',
      signature,
    ];
    return mailto(request.email, `Dein Antrag für ${request.projectName}`, lines.join('\n'));
  }
  const lines = [
    `Hi ${request.name},`,
    '',
    `thank you for your request for ${request.projectName}. I cannot issue an API key for it.`,
    ...(reason ? ['', reason] : []),
    '',
    'Best regards',
    signature,
  ];
  return mailto(request.email, `Your request for ${request.projectName}`, lines.join('\n'));
}
