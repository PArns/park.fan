import { SITE_URL } from '@/i18n/config';

/**
 * Where the developer portal lives. Its own module, free of the request schema, so a document an
 * agent reads (the MCP tool descriptions ship to the browser too) can name the portal without
 * bundling zod.
 */

/** The portal's path below the locale. */
export const DEVELOPERS_PATH = '/developers';

/** The developer dashboard: sign-in, keys, statistics, requests. */
export const DEVELOPER_DASHBOARD_PATH = '/developers/dashboard';

/** The portal's anchor for the attribution rules, which the dashboard's form links to. */
export const ATTRIBUTION_ANCHOR = 'attribution';

/**
 * The portal in English, as the machine-facing documents name it (`auth.md`, `llms.txt`, the
 * skills, the MCP tools), whose reader is a developer or an agent rather than a park visitor.
 */
export const DEVELOPER_PORTAL_URL = `${SITE_URL}/en${DEVELOPERS_PATH}`;
