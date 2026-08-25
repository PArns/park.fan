import { SITE_URL } from '@/i18n/config';
import { API_CATALOG_PATH } from '@/lib/agents/api-catalog';
import { AGENT_SKILLS, skillArtifactPath } from '@/lib/agents/skills';

/**
 * The ARD capability manifest (agenticresourcediscovery.org, ai-catalog data model) — one
 * document that says what park.fan can do for an agent, as opposed to which pages it has.
 *
 * It is an index of indexes and holds no facts of its own: every entry points at a document
 * that already exists in this repository (the API catalog, the skills), so nothing in here can
 * drift away from what is actually served. The `representativeQueries` are the exception and
 * they are the point — a registry embeds them to decide whether park.fan is worth asking, so
 * they are written as somebody would type them, not as a description of the entry.
 */

export const AI_CATALOG_PATH = '/.well-known/ai-catalog.json';

/** Media type of an RFC 9727 catalog; the ARD entry for it must name what it points at. */
const LINKSET_MEDIA_TYPE = 'application/linkset+json';

type CatalogEntry = {
  identifier: string;
  displayName: string;
  description: string;
  type: string;
  url: string;
  representativeQueries: string[];
};

/** `urn:air:<fqdn>:<namespace>:<name>`, per ARD §3.4. */
function identifier(namespace: string, name: string): string {
  return `urn:air:park.fan:${namespace}:${name}`;
}

export function aiCatalog() {
  const entries: CatalogEntry[] = [
    {
      identifier: identifier('api', 'catalog'),
      displayName: 'park.fan API catalog',
      description:
        'RFC 9727 catalog naming the OpenAPI description, the reference docs and the health endpoint of the public park.fan API. No authentication.',
      type: LINKSET_MEDIA_TYPE,
      url: `${SITE_URL}${API_CATALOG_PATH}`,
      representativeQueries: [
        'where is the park.fan API documented',
        'get theme park wait times as JSON',
        'openapi description for park.fan',
      ],
    },
    ...AGENT_SKILLS.map((skill) => ({
      identifier: identifier('skill', skill.name),
      displayName: skill.name,
      description: skill.description,
      type: 'text/markdown',
      url: `${SITE_URL}${skillArtifactPath(skill.name)}`,
      representativeQueries: skill.representativeQueries,
    })),
  ];

  return {
    // The ai-catalog data model's version, not the ARD draft's.
    specVersion: '1.0',
    host: {
      displayName: 'park.fan',
      identifier: 'did:web:park.fan',
      description:
        'Live wait times, crowd forecasts and historical queue statistics for around 200 theme parks and 7,000 attractions worldwide, in six languages.',
    },
    entries,
  };
}
