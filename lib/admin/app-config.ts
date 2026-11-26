/**
 * The admin's page for the minimum app version (`/v1/admin/app-config`): its shapes, the platforms
 * it lists and what it reads off the form before sending it.
 */

/** The admin proxy prefix of the app-config endpoints. */
export const APP_CONFIG_API = '/api/admin/app-config';

/** The platforms the API lists, with the admin's words; a third one is one more entry. */
export const APP_PLATFORMS = [
  { id: 'ios', label: 'iOS', buildLabel: 'Mindest-Build', prepared: false },
  { id: 'android', label: 'Android', buildLabel: 'Mindest-versionCode', prepared: true },
] as const;

/** A platform's id as the API names it. */
export type AppPlatform = (typeof APP_PLATFORMS)[number]['id'];

/** The note languages of the block screen. */
export const APP_MESSAGE_LANGUAGES = ['de', 'en', 'nl', 'fr', 'es', 'it'] as const;

/** One platform's minimum version block; the API sends null for what is not set. */
export interface PlatformConfig {
  minVersion: string | null;
  minBuild: number | null;
  updateUrl: string | null;
  message: Partial<Record<(typeof APP_MESSAGE_LANGUAGES)[number], string>> | null;
}

/** `GET app-config` and the answer of every PUT: both platforms and what a sample app would meet. */
export interface AppConfigView {
  platforms: Record<AppPlatform, PlatformConfig>;
  updatedBy: string | null;
  updatedAt: string | null;
  samples: Record<AppPlatform, { text: string; blocked: boolean }>;
}

/** `1`, `1.0` or `1.0.1`, the only forms the API accepts. */
export const APP_VERSION_PATTERN = /^\d+(\.\d+){0,2}$/;

function parts(version: string): number[] {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
  return [major, minor, patch];
}

/**
 * True when saving `next` locks out apps that start today under `current`: a new minimum, a higher
 * version, or on the same version a higher build.
 */
export function raisesMinimum(
  current: Pick<PlatformConfig, 'minVersion' | 'minBuild'>,
  next: Pick<PlatformConfig, 'minVersion' | 'minBuild'>
): boolean {
  if (!next.minVersion) return false;
  if (!current.minVersion) return true;
  const have = parts(current.minVersion);
  const want = parts(next.minVersion);
  for (let i = 0; i < 3; i++) if (have[i] !== want[i]) return want[i] > have[i];
  return (next.minBuild ?? 0) > (current.minBuild ?? 0);
}

/** The form's strings as the API's body; empty means null, an empty note is left out. */
export function appConfigBody(form: {
  minVersion: string;
  minBuild: string;
  updateUrl: string;
  message: Record<string, string>;
}): PlatformConfig {
  const message = Object.fromEntries(
    Object.entries(form.message)
      .map(([language, text]) => [language, text.trim()])
      .filter(([, text]) => text)
  );
  return {
    minVersion: form.minVersion.trim() || null,
    minBuild: form.minBuild.trim() ? Number(form.minBuild) : null,
    updateUrl: form.updateUrl.trim() || null,
    message: Object.keys(message).length ? message : null,
  };
}

/** True when the API answering is older than these routes: it deploys apart from the site. */
export function isAppConfigBackendMissing(error: { status: number } | null | undefined): boolean {
  return error?.status === 404;
}
