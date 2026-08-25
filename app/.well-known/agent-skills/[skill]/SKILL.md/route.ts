import { AGENT_SKILLS, readSkillArtifact, type AgentSkillName } from '@/lib/agents/skills';
import { agentDocumentHeaders } from '@/lib/agents/http';

/**
 * The skill artifacts themselves. The index publishes a SHA-256 of each one, so what is served
 * here has to be the file on disk verbatim — no header, no footer, no locale, nothing computed.
 * An agent that checks the digest and finds it wrong is right to throw the skill away.
 */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return AGENT_SKILLS.map((skill) => ({ skill: skill.name }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ skill: string }> }
): Promise<Response> {
  const { skill } = await params;
  // `dynamicParams = false` already rules out anything not in the list; this is what turns that
  // guarantee into a type, so no path here can read a file the index does not name.
  if (!AGENT_SKILLS.some((known) => known.name === skill)) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(readSkillArtifact(skill as AgentSkillName), {
    headers: agentDocumentHeaders('text/markdown; charset=utf-8'),
  });
}
