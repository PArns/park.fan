import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_URL } from '@/i18n/config';

/**
 * The Agent Skills park.fan publishes at `/.well-known/agent-skills/`, read from
 * `content/agent-skills/<name>/SKILL.md`. The digest is computed from the served bytes, because an
 * agent may refuse an artifact that does not match it and a hand-kept digest would one day make
 * every skill look tampered with.
 */

/** Fixed by the Agent Skills Discovery RFC v0.2.0. */
export const AGENT_SKILLS_INDEX_PATH = '/.well-known/agent-skills/index.json';
const AGENT_SKILLS_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

const SKILLS_ROOT = path.join(process.cwd(), 'content', 'agent-skills');

export type AgentSkillName = 'park-wait-times' | 'plan-a-park-visit' | 'park-fan-data';

type AgentSkillDefinition = {
  name: AgentSkillName;
  /** One sentence, in the "what it does + when to use it" shape agents match against. */
  description: string;
  /** What this skill is good for, as somebody would actually ask. Feeds the ARD manifest. */
  representativeQueries: string[];
};

/**
 * Three skills for the three questions people arrive with: the queue right now, which day to go,
 * and the data itself. None of them mentions `/admin`, on purpose.
 */
export const AGENT_SKILLS: AgentSkillDefinition[] = [
  {
    name: 'park-wait-times',
    description:
      'Read live theme park wait times, ride status and queue history from park.fan. Use when someone asks how long the queue is at a park or for a specific ride right now.',
    representativeQueries: [
      'how long is the wait for Silver Star at Europa-Park',
      'is Taron open today',
      'which rides at Phantasialand have the shortest queues right now',
    ],
  },
  {
    name: 'plan-a-park-visit',
    description:
      'Pick a day for a theme park visit using park.fan crowd forecasts, best-day calendars, opening hours, school holidays and weather. Use when someone asks when to go rather than what the queue is now.',
    representativeQueries: [
      'when is the best time to visit Europa-Park',
      'is next Tuesday quieter than Saturday at Efteling',
      'which month has the shortest queues at Disneyland Paris',
    ],
  },
  {
    name: 'park-fan-data',
    description:
      'Fetch park.fan data as JSON or Markdown instead of scraping HTML — the public API, the page-level Markdown negotiation and the sitemaps. Use when building something on top of park.fan data.',
    representativeQueries: [
      'get park.fan wait times as JSON',
      'what is the park.fan OpenAPI description',
      'read a park.fan page as markdown',
    ],
  },
];

/** Returns the public path of an agent skill's `SKILL.md` under `/.well-known/agent-skills/`. */
export function skillArtifactPath(name: AgentSkillName): string {
  return `/.well-known/agent-skills/${name}/SKILL.md`;
}

/** The bytes served at `skillArtifactPath(name)`. Throws when a skill has no file. */
export function readSkillArtifact(name: AgentSkillName): string {
  return fs.readFileSync(path.join(SKILLS_ROOT, name, 'SKILL.md'), 'utf8');
}

/**
 * Returns the `sha256:` digest of the bytes served for an agent skill's `SKILL.md`, computed from
 * the file on every call.
 */
export function skillDigest(name: AgentSkillName): string {
  return `sha256:${createHash('sha256').update(readSkillArtifact(name), 'utf8').digest('hex')}`;
}

/** The discovery document itself. Absolute URLs: an index can be mirrored, a relative URL cannot. */
export function agentSkillsIndex() {
  return {
    $schema: AGENT_SKILLS_SCHEMA,
    skills: AGENT_SKILLS.map((skill) => ({
      name: skill.name,
      type: 'skill-md' as const,
      description: skill.description,
      url: `${SITE_URL}${skillArtifactPath(skill.name)}`,
      digest: skillDigest(skill.name),
    })),
  };
}
