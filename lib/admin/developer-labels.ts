/**
 * The German names the admin shows for the permissions and for the answers of a key request. The
 * admin has no next-intl provider, so they come straight from the German catalog the developer
 * portal reads (`developers.permissions`, `developers.form`), and both say the same.
 */
import messages from '@/messages/de.json';
import {
  API_PERMISSION_GROUP_IDS,
  sortPermissions,
  type ApiPermission,
  type ApiPermissionGroupId,
} from '@/lib/developers/permissions';
import type {
  Platform,
  ProjectKind,
  RequestTier,
  RequestVolume,
  RevenueModel,
  SourceModel,
} from '@/lib/developers/key-request';

type Entry = { title: string; description: string };

const PERMISSION_ITEMS = messages.developers.permissions.items as Record<
  string,
  Record<string, Entry>
>;

/** A permission's name and what it opens, as the portal words them. */
export function permissionLabel(permission: ApiPermission): Entry {
  const [group, item] = permission.split('.');
  return PERMISSION_ITEMS[group][item];
}

/** A group's name, as the portal words it. */
export const PERMISSION_GROUP_LABELS: Record<ApiPermissionGroupId, string> =
  messages.developers.permissions.groups;

/** The groups in catalog order, each with its name. */
export const PERMISSION_GROUP_OPTIONS = API_PERMISSION_GROUP_IDS.map((id) => ({
  id,
  label: PERMISSION_GROUP_LABELS[id],
}));

/** „Wartezeiten, Wetter, Parkdetails“, as one line; „keine Berechtigung“ for none. */
export function formatPermissions(permissions: readonly ApiPermission[]): string {
  return permissions.length === 0
    ? 'keine Berechtigung'
    : sortPermissions(permissions)
        .map((permission) => permissionLabel(permission).title)
        .join(', ');
}

const FORM = messages.developers.form;

/** What a request's answers are called in the form, for the admin's view of it. */
export const REQUEST_LABELS = {
  kind: FORM.kinds as Record<ProjectKind, string>,
  platform: FORM.platformNames as Record<Platform, string>,
  source: FORM.sources as Record<SourceModel, string>,
  revenue: FORM.revenue as Record<RevenueModel, string>,
  volume: FORM.volumes as Record<RequestVolume, string>,
} as const;

/** A request's tier, as the admin's chip shows it. */
export const REQUEST_TIER_LABELS: Record<RequestTier, string> = {
  free: 'kostenlos',
  paid: 'kostenpflichtig',
};
