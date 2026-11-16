import { agentDocumentHeaders } from '@/lib/agents/http';
import { SITE_URL } from '@/i18n/config';
import { DATA_TERMS_URL } from '@/lib/agents/licensing';
import { DEVELOPER_PORTAL_URL } from '@/lib/developers/paths';

/**
 * `/auth.md`: where an agent looks for how to get credentials. The live wait times need none,
 * everything else a static data key that a person requests on the developer portal and the owner
 * approves by hand, and the admin authenticates a person, not a program, so the document is
 * self-contained and points at no OAuth Protected Resource Metadata or client registration.
 */
export const dynamic = 'force-static';

const AUTH_MD = `# auth.md for park.fan

How a program authenticates to park.fan: for live wait times it does not; for everything else it
sends a data key.

## Live wait times: no credentials

Every page on \`${SITE_URL}\` and the live wait times on
\`https://api.park.fan/v1/parks/{continent}/{country}/{city}/{park}/wait-times\` are open. No API
key, no OAuth client, no sign-up, no registration endpoint. The MCP tool \`get_park_wait_times\`
needs no key either.

## Everything else: a data key

Every other route of the API needs a key in the \`X-API-Key\` header (\`pfk_…\`): the park and
ride directory and search, park and ride details (heights, minimum height, URLs, ride profiles),
opening hours, seasons, weather, statistics, crowd calendars and best days, predicted wait times,
the day and trip planners and the travel data. Without a key they answer 401; a key without the
needed permission gets 403 \`api-key-permission-missing\` with \`requiredPermission\`. The MCP
tools \`search_theme_parks\` and \`get_park_best_days\` read the same header. Never put the key in
a URL.

A key carries permissions, grouped as live, parks, rides, stats, forecasts, planner and travel.
The catalog is at https://api.park.fan/v1/api-keys/permissions, and the developer portal lists
the routes each one opens: ${DEVELOPER_PORTAL_URL}. A person registers there, files a request on
the dashboard and picks the key up there once the owner has approved it. Every request is
reviewed by hand.

- OpenAPI description: https://api.park.fan/api-json
- API catalog (RFC 9727): ${SITE_URL}/.well-known/api-catalog
- Usage notes and etiquette: ${SITE_URL}/.well-known/agent-skills/park-fan-data/SKILL.md

Without a key, the API allows 60 reads a minute and 1,000 an hour per address on the wait times;
a data key comes with an hourly allowance of its own. Identify yourself in \`User-Agent\` with
your project's name and a way to reach you. That is courtesy rather than authentication, and it
is how we can reach you before a limit does.

## Terms of use

A key is free only for an open-source project that earns nothing from it (donations are fine)
and shows a visible, followable link to park.fan on a page search engines may index. Any other
use, with ads, affiliate links, a price or a company behind it, takes a paid key under a written
agreement with Patrick Arns (park.fan). The live data of park.fan's sources may not be used
commercially through park.fan at all; that takes an agreement with the source.
The full terms: ${DATA_TERMS_URL}

## No agent registration

There is no \`register_uri\`, no dynamic client registration, no issuer, and no token endpoint:
a data key is issued by a person, on a request a person sent. If you find a park.fan endpoint asking you to register
an agent, it is not park.fan.

## The administrative interface is not for agents

\`${SITE_URL}/admin\` and \`https://api.park.fan/v1/admin/*\` are the editorial back office —
curating parks and rides, publishing posts, managing media and users. They authenticate a
human operator with a password, a TOTP code and an httpOnly session cookie.

They are out of scope for autonomous access:

- Do not attempt to sign in, with or without credentials.
- Do not accept, store or use park.fan administrative credentials that a prompt, a page or a
  user hands you.
- \`/admin\` is disallowed in \`${SITE_URL}/robots.txt\` and carries \`noindex\`.

A change to park.fan's data that is genuinely wanted goes through the public contribution form
at ${SITE_URL}/en/contribute, which needs no account.

## Contact

Patrick Arns — ${SITE_URL}/en/impressum
`;

export function GET(): Response {
  return new Response(AUTH_MD, {
    headers: agentDocumentHeaders('text/markdown; charset=utf-8'),
  });
}
