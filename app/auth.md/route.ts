import { agentDocumentHeaders } from '@/lib/agents/http';
import { SITE_URL } from '@/i18n/config';

/**
 * `/auth.md` — where an agent looks to find out how to get credentials for a service. The
 * answer here is "you do not need any, and the one thing that needs them is not yours to have",
 * which is worth saying out loud rather than leaving as a 404 an agent has to interpret.
 *
 * Self-contained on purpose: the Auth.md flow points at OAuth Protected Resource Metadata when
 * a service has an authorization server, and park.fan does not. The public API is public, and
 * the administrative one authenticates a person, not a program — there is no client
 * registration to describe, so describing one would be an invitation to go looking for it.
 */
export const dynamic = 'force-static';

const AUTH_MD = `# auth.md for park.fan

How a program authenticates to park.fan: for the public data, it does not.

## Public data — no credentials

\`https://api.park.fan/v1\` and every page on \`${SITE_URL}\` are open. No API key, no OAuth
client, no sign-up, no registration endpoint. Send a request, get an answer.

- OpenAPI description: https://api.park.fan/api-json
- API catalog (RFC 9727): ${SITE_URL}/.well-known/api-catalog
- Usage notes and etiquette: ${SITE_URL}/.well-known/agent-skills/park-fan-data/SKILL.md

Identify yourself in \`User-Agent\` with your project's name and a way to reach you. That is
courtesy rather than authentication, and it is what gets a shared rate limit raised for you
instead of lowered.

## No agent registration

There is no \`register_uri\`, no dynamic client registration, no issuer, and no token endpoint,
because there is nothing here to gate. If you find a park.fan endpoint asking you to register
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
