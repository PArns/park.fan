'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminKeys, useAdminQuery } from '../../_lib/api';
import { useSession } from '../../_app/session';
import { Field, TextInput } from '../../_ui/controls';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
} from '../../_ui/primitives';
import {
  ASSISTANT_API,
  formatCount,
  formatDateTime,
  KNOWLEDGE_TOPIC_PATTERN,
  type KnowledgeTopic,
} from '../_lib/assistant';

const KNOWLEDGE_PATH = `${ASSISTANT_API}/knowledge`;

/**
 * Parky's knowledge base: the topics he reads only when a question needs one. His prompt lists
 * each enabled topic's „Wann lesen“; the text itself comes into a chat only when he reads it.
 */
export default function AssistantKnowledgePage() {
  const { data, error, refetch } = useAdminQuery<KnowledgeTopic[]>(
    adminKeys.raw(KNOWLEDGE_PATH),
    KNOWLEDGE_PATH
  );
  const { can } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return <LoadingState label="Lädt Wissen…" />;

  const taken = data.some((topic) => topic.topic === name);
  const nameValid = name.length >= 2 && name.length <= 40 && KNOWLEDGE_TOPIC_PATTERN.test(name);

  return (
    <AdminPage>
      <Panel>
        <PanelHeader
          icon={BookOpen}
          title="Parkys Wissen"
          hint="Hintergrund, den Parky nur liest, wenn eine Frage ihn braucht. Sein Prompt nennt pro Thema nur „Wann lesen“; Änderungen gelten ab dem nächsten Chat, spätestens nach einer Minute."
        />
        <PanelBody className="p-0">
          {data.length === 0 ? (
            <EmptyState icon={BookOpen} title="Noch kein Thema" />
          ) : (
            <ul className="divide-border/40 divide-y">
              {data.map((topic) => (
                <li key={topic.topic}>
                  <Link
                    href={`/admin/assistant/knowledge/${topic.topic}`}
                    className="hover:bg-muted/30 block space-y-1 px-4 py-3 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-sm font-semibold">{topic.topic}</code>
                      <Chip tone={topic.enabled ? 'success' : 'muted'}>
                        {topic.enabled ? 'an' : 'aus'}
                      </Chip>
                      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                        {formatCount(topic.text.length)} Zeichen · {formatDateTime(topic.updatedAt)}
                        {topic.updatedBy && ` · ${topic.updatedBy}`}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">{topic.readWhen}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PanelBody>
      </Panel>

      {can('editor') && (
        <Panel>
          <PanelHeader icon={Plus} title="Neues Thema" />
          <PanelBody>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (nameValid) router.push(`/admin/assistant/knowledge/${name}`);
              }}
            >
              <Field
                label="Name"
                htmlFor="knowledge-topic"
                hint="Kleinbuchstaben, Wörter mit _ verbunden, z. B. tickets oder express_passes"
                error={taken ? 'Das Thema gibt es schon' : null}
                className="min-w-60 flex-1"
              >
                <TextInput
                  id="knowledge-topic"
                  value={name}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(event) => setName(event.target.value.trim().toLowerCase())}
                  placeholder="express_passes"
                />
              </Field>
              <Button type="submit" size="sm" disabled={!nameValid || taken}>
                Anlegen
              </Button>
            </form>
          </PanelBody>
        </Panel>
      )}
    </AdminPage>
  );
}
