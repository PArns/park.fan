import { SITE_URL } from '@/i18n/config';

/**
 * Where the developer portal lives. Its own module, free of the request schema, so a document an
 * agent reads (the MCP tool descriptions ship to the browser too) can name the portal without
 * bundling zod.
 */

/** The portal's path below the locale, and the request form's anchor on it. */
export const DEVELOPERS_PATH = '/developers';
export const KEY_REQUEST_ANCHOR = 'request';

/**
 * The portal in English, as the machine-facing documents name it (`auth.md`, `llms.txt`, the
 * skills, the MCP tools), whose reader is a developer or an agent rather than a park visitor.
 */
export const DEVELOPER_PORTAL_URL = `${SITE_URL}/en${DEVELOPERS_PATH}`;
