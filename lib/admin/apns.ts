/**
 * The admin's page for push to the iOS app (`/v1/admin/push/apns`): its shapes, what it reads off
 * the chosen key file before sending it, and how it tells a backend without these routes. The API
 * drops null fields, so anything that may be null arrives as absent and is typed optional.
 */

/** The admin proxy prefix of every APNs endpoint. */
export const APNS_API = '/api/admin/push/apns';

/** The two APNs environments: production for TestFlight and App Store builds, sandbox for Xcode's. */
export type ApnsEnvironment = 'production' | 'sandbox';

/** The admin's word for an {@link ApnsEnvironment}. */
export const APNS_ENVIRONMENT_LABEL: Record<ApnsEnvironment, string> = {
  production: 'Produktion',
  sandbox: 'Sandbox',
};

/** How an answer of Apple is to be read; the API decides it together with the sentence. */
export type ApnsAnswerState = 'ok' | 'warning' | 'error';

/** The chip colour of an {@link ApnsAnswerState}. */
export const APNS_STATE_TONE = {
  ok: 'success',
  warning: 'warning',
  error: 'danger',
} as const satisfies Record<ApnsAnswerState, string>;

/** Apple's answer to the last check of the key in one environment, in the API's German. */
export interface ApnsCheck {
  at: string;
  status: number;
  reason: string;
  state: ApnsAnswerState;
  text: string;
}

/** `GET push/apns`: the key in use without the key, Apple's answers, devices and refusals. */
export interface ApnsStatus {
  configured: boolean;
  /** Uploaded in the admin, or the API's `APNS_*` variables; absent without a key. */
  source?: 'database' | 'environment';
  keyId?: string;
  teamId?: string;
  bundleId?: string;
  /** The first 8 hex characters of the SHA-256 over the public key. */
  fingerprint?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  /** False when the API has no `ASSISTANT_SECRET_KEY` to seal a key with. */
  secretConfigured: boolean;
  /** True when a key is stored that the API's secret no longer opens. */
  storedKeyUnreadable: boolean;
  defaults: { teamId: string; bundleId: string };
  checks: Partial<Record<ApnsEnvironment, ApnsCheck>>;
  devices: {
    total: number;
    byEnvironment: Record<ApnsEnvironment | 'unknown', number>;
    byKind: Record<string, number>;
  };
  errors: { environment: string; reason: string; count: number }[];
}

/** One registered app install of `GET push/apns/devices`; of its token only the last characters. */
export interface ApnsDevice {
  id: string;
  tokenTail: string;
  kinds: string[];
  locale: string;
  timezone?: string;
  environment?: ApnsEnvironment;
  registeredAt: string;
  lastNotifiedAt?: string;
  lastError?: string;
}

/** `POST push/apns/test`: what Apple answered to the test notification. */
export interface ApnsTestResult {
  state: ApnsAnswerState;
  text: string;
  status: number;
  reason: string;
  environment: ApnsEnvironment;
}

/** The key id in Apple's file name `AuthKey_<KEYID>.p8`, also in a browser's `AuthKey_… (1).p8`. */
export function apnsKeyIdFromFilename(filename: string): string | null {
  return /AuthKey_([A-Z0-9]{10})(?![A-Z0-9])/.exec(filename)?.[1] ?? null;
}

/** True for an Apple key id or team id: ten capitals or digits. */
export function isAppleId(value: string): boolean {
  return /^[A-Z0-9]{10}$/.test(value);
}

/** A `.p8` holds about 260 bytes; a larger file is not read into the browser at all. */
export const APNS_KEY_FILE_MAX_BYTES = 4096;

/**
 * Why a chosen file is not sent, in the admin's German, or null when it may be: only the obvious
 * mix-ups, a certificate or a file far too large. Whether it is a key Apple accepts is the API's
 * check.
 */
export function apnsKeyFileProblem(file: { name: string; size: number }): string | null {
  if (/\.(p12|pfx|cer|crt|der)$/i.test(file.name)) {
    return 'Das ist ein Zertifikat, gebraucht wird der APNs-Schlüssel (.p8).';
  }
  if (file.size === 0) return 'Die Datei ist leer.';
  if (file.size > APNS_KEY_FILE_MAX_BYTES) {
    return 'Die Datei ist zu groß für einen APNs-Schlüssel (.p8).';
  }
  return null;
}

/**
 * The upload's body: the file's text and name, and each id only when it is set, so the API reads
 * the key id off the file name and falls back to the app's own team and bundle id.
 */
export function apnsUploadBody(
  file: { name: string; content: string },
  ids: { keyId: string; teamId: string; bundleId: string }
): Record<string, string> {
  const body: Record<string, string> = { content: file.content, filename: file.name };
  for (const [name, value] of Object.entries(ids)) {
    if (value.trim()) body[name] = value.trim();
  }
  return body;
}

/** True when the API answering is older than these routes: it deploys apart from the site. */
export function isApnsBackendMissing(error: { status: number } | null | undefined): boolean {
  return error?.status === 404;
}
