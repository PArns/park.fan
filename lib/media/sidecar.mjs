/**
 * Sidecar normalization — the ONE place that turns the hand-authored
 * `<name>.json` next to an image into the shape the rest of the app consumes.
 *
 * Plain JS on purpose: it is imported both by `scripts/generate-media-manifest.mjs`
 * (Node, at build time) and by the admin write path (`app/api/admin/media`), so a
 * sidecar saved from the admin browser and one hand-edited in the repo go through
 * exactly the same normalization. Same reasoning as `lib/blog/derive.mjs`.
 *
 * Types for the values produced here live in `lib/media/types.ts`.
 */

import { auditTags } from './tags.mjs';

/** Keep in sync with `i18n/config.ts` — validated by the generator, which warns on unknown keys. */
export const MEDIA_LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'es'];

/** Authoring language: text falls back to this before anything else. */
export const MEDIA_BASE_LOCALE = 'de';

export const MEDIA_ROLES = ['park-background', 'ride-card', 'hero'];

export const MEDIA_LICENSES = [
  'all-rights-reserved',
  'cc-by-4.0',
  'cc-by-sa-4.0',
  'cc-by-nc-4.0',
  'cc0-1.0',
  'public-domain',
  'unknown',
];

export const MEDIA_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'];

/** Aspect-ratio crops cut by `generate:image-crops` — never database rows of their own. */
export const ASPECT_SUFFIX_RE = /-(?:16x9|4x3|1x1)$/;

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function asString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asSlug(value, issues, field) {
  const str = asString(value);
  if (str === null) return null;
  if (!SLUG_RE.test(str)) {
    issues.push(`${field}: "${str}" is not a slug (expected lower-case a-z, 0-9 and dashes)`);
    return null;
  }
  return str;
}

/**
 * Slug list, deduplicated, invalid entries dropped with an issue each. Used by
 * `alsoRides`, where a typo must be as loud as it is in `ride` — nothing else
 * validates an attraction slug, so a silent drop would just take the photo off
 * that ride's page again.
 */
function asSlugList(value, issues, field) {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) {
    issues.push(`${field}: expected an array of slugs`);
    return [];
  }
  const out = [];
  for (const entry of value) {
    const slug = asSlug(entry, issues, field);
    if (slug !== null && !out.includes(slug)) out.push(slug);
  }
  return out;
}

function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const entry of value) {
    const str = asString(entry);
    if (str !== null && !out.includes(str)) out.push(str);
  }
  return out;
}

/** Keep only known locale keys with non-empty strings; `null` when nothing survives. */
function normalizeText(value, issues, field) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    // A bare string is accepted as the base locale — the shorthand most sidecars use.
    const str = value.trim();
    return str ? { [MEDIA_BASE_LOCALE]: str } : null;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    issues.push(`${field}: expected a string or an object of locale → string`);
    return null;
  }
  const out = {};
  for (const [locale, text] of Object.entries(value)) {
    if (!MEDIA_LOCALES.includes(locale)) {
      issues.push(`${field}: unknown locale "${locale}"`);
      continue;
    }
    const str = asString(text);
    if (str !== null) out[locale] = str;
  }
  return Object.keys(out).length ? out : null;
}

function normalizeCredit(value, issues) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};

  let license = asString(raw.license);
  if (license !== null) license = license.toLowerCase();
  if (license !== null && !MEDIA_LICENSES.includes(license)) {
    issues.push(`credit.license: unknown license "${license}"`);
    license = null;
  }

  let year = null;
  if (raw.year !== null && raw.year !== undefined) {
    const parsed = Number(raw.year);
    if (Number.isInteger(parsed) && parsed >= 1800 && parsed <= 2200) year = parsed;
    else issues.push(`credit.year: "${raw.year}" is not a plausible year`);
  }

  return {
    author: asString(raw.author),
    // An image whose rights nobody has established is `unknown`, not silently free.
    license: license ?? 'unknown',
    source: asString(raw.source),
    sourceUrl: asString(raw.sourceUrl),
    year,
  };
}

/**
 * `continent/country/city/park-slug` — the catalog's unambiguous park identity,
 * needed only for the handful of slugs that are not unique.
 */
function asParkPath(value, issues) {
  const str = asString(value);
  if (str === null) return null;
  const clean = str.replace(/^\/+|\/+$/g, '').replace(/^v1\/parks\//, '');
  const segments = clean.split('/');
  if (segments.length !== 4 || !segments.every((s) => SLUG_RE.test(s))) {
    issues.push(`parkPath: "${str}" is not a continent/country/city/park path`);
    return null;
  }
  return clean;
}

/**
 * The nine keyword shorthands, as focal points. `object-position` uses the same
 * percentages, so these read the way a designer would say them out loud.
 */
const FOCUS_KEYWORDS = {
  'top-left': { x: 0, y: 0 },
  top: { x: 0.5, y: 0 },
  'top-right': { x: 1, y: 0 },
  left: { x: 0, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  centre: { x: 0.5, y: 0.5 },
  middle: { x: 0.5, y: 0.5 },
  right: { x: 1, y: 0.5 },
  'bottom-left': { x: 0, y: 1 },
  bottom: { x: 0.5, y: 1 },
  'bottom-right': { x: 1, y: 1 },
};

/**
 * Normalize a focal point. Accepts `{ x, y }` in 0..1 or a keyword.
 *
 * Dead centre is stored as null, not as `{0.5,0.5}` — "nobody has looked at this
 * image yet" and "somebody decided centre is right" are the same rendering but
 * different facts, and the admin browser needs to tell them apart to show what
 * still needs attention.
 */
function normalizeFocus(value, issues) {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    const keyword = FOCUS_KEYWORDS[value.trim().toLowerCase()];
    if (!keyword) {
      issues.push(`focus: "${value}" is not a known keyword`);
      return null;
    }
    return keyword.x === 0.5 && keyword.y === 0.5 ? null : { ...keyword };
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    issues.push('focus: expected { x, y } in 0..1 or a keyword');
    return null;
  }

  const x = Number(value.x);
  const y = Number(value.y);
  if (!Number.isFinite(x) || x < 0 || x > 1 || !Number.isFinite(y) || y < 0 || y > 1) {
    issues.push(`focus: x and y must be between 0 and 1 (got ${value.x}, ${value.y})`);
    return null;
  }
  const rounded = { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
  return rounded.x === 0.5 && rounded.y === 0.5 ? null : rounded;
}

/** A manually authored GPS fix. EXIF is read by the generator, not here. */
function normalizeGps(value, issues) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    issues.push('gps: expected an object with lat and lon');
    return null;
  }
  const lat = Number(value.lat);
  const lon = Number(value.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    issues.push(`gps.lat: "${value.lat}" is not a latitude`);
    return null;
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    issues.push(`gps.lon: "${value.lon}" is not a longitude`);
    return null;
  }
  return { lat, lon, source: 'manual' };
}

/**
 * Normalize one raw sidecar object.
 *
 * Returns `{ sidecar, text, issues }`. `issues` are advisory: a malformed field
 * is dropped and reported, never fatal — a bad sidecar must not break the build.
 */
export function normalizeSidecar(raw) {
  const issues = [];
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  if (raw !== null && raw !== undefined && source !== raw) {
    issues.push('sidecar: expected a JSON object');
  }

  const roles = [];
  for (const role of asStringArray(source.roles)) {
    if (MEDIA_ROLES.includes(role)) roles.push(role);
    else issues.push(`roles: unknown role "${role}"`);
  }

  const tags = asStringArray(source.tags).map((t) => t.toLowerCase());
  issues.push(...auditTags(tags));

  let shotAt = asString(source.shotAt);
  if (shotAt !== null && !ISO_DATE_RE.test(shotAt)) {
    issues.push(`shotAt: "${shotAt}" is not an ISO date (YYYY-MM-DD)`);
    shotAt = null;
  }

  let order = null;
  if (source.order !== null && source.order !== undefined) {
    const parsed = Number(source.order);
    if (Number.isFinite(parsed)) order = parsed;
    else issues.push(`order: "${source.order}" is not a number`);
  }

  return {
    sidecar: {
      park: asSlug(source.park, issues, 'park'),
      parkPath: asParkPath(source.parkPath, issues),
      ride: asSlug(source.ride, issues, 'ride'),
      alsoRides: asSlugList(source.alsoRides, issues, 'alsoRides'),
      area: asString(source.area),
      title: asString(source.title),
      tags,
      roles,
      credit: normalizeCredit(source.credit, issues),
      shotAt,
      order,
      gps: normalizeGps(source.gps, issues),
      focus: normalizeFocus(source.focus, issues),
    },
    text: {
      alt: normalizeText(source.alt, issues, 'alt'),
      caption: normalizeText(source.caption, issues, 'caption'),
    },
    issues,
  };
}

/**
 * Serialize a normalized sidecar back to the on-disk shape: stable key order,
 * empty values omitted. What the admin browser writes and what a human would
 * hand-author are then byte-identical, so saving from the UI produces a clean diff.
 */
export function serializeSidecar(sidecar, text) {
  const out = {};
  if (sidecar.title) out.title = sidecar.title;
  if (sidecar.park) out.park = sidecar.park;
  if (sidecar.parkPath) out.parkPath = sidecar.parkPath;
  if (sidecar.ride) out.ride = sidecar.ride;
  if (sidecar.alsoRides?.length) out.alsoRides = [...sidecar.alsoRides];
  if (sidecar.area) out.area = sidecar.area;
  if (sidecar.roles?.length) out.roles = [...sidecar.roles];
  if (sidecar.tags?.length) out.tags = [...sidecar.tags].sort();
  if (text?.alt && Object.keys(text.alt).length) out.alt = orderLocales(text.alt);
  if (text?.caption && Object.keys(text.caption).length) out.caption = orderLocales(text.caption);

  const credit = sidecar.credit ?? {};
  const creditOut = {};
  if (credit.author) creditOut.author = credit.author;
  if (credit.license) creditOut.license = credit.license;
  if (credit.source) creditOut.source = credit.source;
  if (credit.sourceUrl) creditOut.sourceUrl = credit.sourceUrl;
  if (credit.year) creditOut.year = credit.year;
  if (Object.keys(creditOut).length) out.credit = creditOut;

  if (sidecar.shotAt) out.shotAt = sidecar.shotAt;
  if (sidecar.order !== null && sidecar.order !== undefined) out.order = sidecar.order;
  // Only a MANUAL fix belongs on disk — an EXIF one is re-read from the file on
  // every build, and writing it back would freeze a copy that silently goes stale
  // if the image is ever replaced.
  if (sidecar.gps?.source === 'manual') {
    out.gps = { lat: sidecar.gps.lat, lon: sidecar.gps.lon };
  }
  if (sidecar.focus) out.focus = { x: sidecar.focus.x, y: sidecar.focus.y };

  return `${JSON.stringify(out, null, 2)}\n`;
}

/** Base locale first, then the rest alphabetically — readable diffs. */
function orderLocales(text) {
  const out = {};
  if (text[MEDIA_BASE_LOCALE]) out[MEDIA_BASE_LOCALE] = text[MEDIA_BASE_LOCALE];
  for (const locale of Object.keys(text).sort()) {
    if (locale !== MEDIA_BASE_LOCALE) out[locale] = text[locale];
  }
  return out;
}

/**
 * Resolve a localized field: requested locale → base locale → English → whatever
 * exists. Galleries carry German captions long before their translations land, so
 * falling through to *something* beats rendering an empty figcaption.
 */
export function pickText(text, locale) {
  if (!text) return null;
  return (
    text[locale] ??
    text[MEDIA_BASE_LOCALE] ??
    text.en ??
    Object.values(text).find((v) => typeof v === 'string' && v) ??
    null
  );
}
