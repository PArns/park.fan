import { CONTRIBUTE_PREFILL_FIELDS } from './prefill-keys';
import { assignedEntitySchema, type AssignedEntity } from './types';

/**
 * The /contribute link with a park or ride already assigned, for the "Add your photos" button on
 * its page. The values travel in the fragment, so every park and ride page links the same URL.
 */
export function buildContributeHref(entity: AssignedEntity, locale?: string): string {
  const params = new URLSearchParams();
  for (const [field, key] of CONTRIBUTE_PREFILL_FIELDS) {
    const value = entity[field];
    if (value) params.set(key, value);
  }
  const base = locale ? `/${locale}/contribute` : '/contribute';
  return `${base}#${params.toString()}`;
}

/** A pre-assigned entity from a /contribute fragment (`#type=park&id=…`), null if absent or invalid. */
export function parseEntityFromHash(hash: string): AssignedEntity | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const candidate = Object.fromEntries(
    CONTRIBUTE_PREFILL_FIELDS.map(([field, key]) => [field, params.get(key) ?? undefined])
  );
  const result = assignedEntitySchema.safeParse(candidate);
  return result.success ? result.data : null;
}
