import { agentSkillsIndex } from '@/lib/agents/skills';
import { agentDocumentHeaders } from '@/lib/agents/http';

/**
 * The Agent Skills discovery index (Agent Skills Discovery RFC v0.2.0), at the path an agent looks
 * for. Static: the skills are files in this repository, and the digests are computed from the same
 * bytes the artifact route serves.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(`${JSON.stringify(agentSkillsIndex(), null, 2)}\n`, {
    headers: agentDocumentHeaders('application/json; charset=utf-8'),
  });
}
