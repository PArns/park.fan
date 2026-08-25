import { agentSkillsIndex } from '@/lib/agents/skills';
import { agentDocumentHeaders } from '@/lib/agents/http';

/**
 * The Agent Skills discovery index (Agent Skills Discovery RFC v0.2.0) — what park.fan can
 * teach an agent, listed at the path an agent looks for rather than in a README a human has to
 * find first.
 *
 * Static: the skills are files in this repository, so the index is settled at build time, and
 * the digests in it are computed from the same bytes the artifact route serves.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(`${JSON.stringify(agentSkillsIndex(), null, 2)}\n`, {
    headers: agentDocumentHeaders('application/json; charset=utf-8'),
  });
}
