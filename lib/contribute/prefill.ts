import { assignedEntitySchema, type AssignedEntity } from './types';

/**
 * Helpers to pass a pre-selected park/ride to the contribution page via query
 * params, so the "Add your photos" button on a park or attraction page lands the
 * user on /contribute with that entity already assigned.
 */

export function buildContributeHref(entity: AssignedEntity, locale?: string): string {
  const params = new URLSearchParams();
  params.set('type', entity.type);
  params.set('id', entity.id);
  params.set('name', entity.name);
  params.set('slug', entity.slug);
  if (entity.url) params.set('url', entity.url);
  if (entity.country) params.set('country', entity.country);
  if (entity.parentParkName) params.set('parent', entity.parentParkName);
  const base = locale ? `/${locale}/contribute` : '/contribute';
  return `${base}?${params.toString()}`;
}

/** Parse a pre-assigned entity from contribute-page search params (null if absent/invalid). */
export function parseEntityFromParams(
  params: Record<string, string | string[] | undefined>
): AssignedEntity | null {
  const get = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const candidate = {
    type: get('type'),
    id: get('id'),
    name: get('name'),
    slug: get('slug'),
    url: get('url'),
    country: get('country'),
    parentParkName: get('parent'),
  };
  const result = assignedEntitySchema.safeParse(candidate);
  return result.success ? result.data : null;
}
