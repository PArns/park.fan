'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, History, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AdminApiError,
  adminFetch,
  adminKeys,
  useAdminQuery,
  useInvalidateAdmin,
} from '../../../_lib/api';
import { useSession } from '../../../_app/session';
import { Field, Switch, TextArea } from '../../../_ui/controls';
import {
  AdminPage,
  Chip,
  ErrorState,
  LoadingState,
  Meta,
  Panel,
  PanelBody,
  PanelHeader,
} from '../../../_ui/primitives';
import { useToast } from '../../../_ui/toast';
import {
  ASSISTANT_API,
  formatDateTime,
  KNOWLEDGE_LIMITS,
  type KnowledgeEdit,
  type KnowledgeTopicDetail,
} from '../../_lib/assistant';

const KNOWLEDGE_PATH = `${ASSISTANT_API}/knowledge`;

/** The audit actions' words in the history. */
const EDIT_LABEL: Record<string, string> = {
  'assistant.knowledge.create': 'angelegt',
  'assistant.knowledge.update': 'geändert',
  'assistant.knowledge.delete': 'gelöscht',
};

/**
 * One topic of Parky's knowledge base: its „Wann lesen“ line, the text he reads, whether it is on,
 * and every edit with the whole topic before and after. A name the base does not hold yet opens
 * an empty form, and saving creates the topic.
 */
export default function AssistantKnowledgeTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = use(params);
  const path = `${KNOWLEDGE_PATH}/${topic}`;
  const query = useAdminQuery<KnowledgeTopicDetail>(adminKeys.raw(path), path, { retry: false });
  const missing = query.error instanceof AdminApiError && query.error.status === 404;

  if (query.error && !missing) {
    return <ErrorState message={query.error.message} onRetry={query.refetch} />;
  }
  if (!query.data && !missing) return <LoadingState label="Lädt Thema…" />;
  // Remounting on a new save resets the form to what the API now holds.
  return (
    <TopicForm key={query.data?.updatedAt ?? 'new'} topic={topic} stored={query.data ?? null} />
  );
}

function TopicForm({ topic, stored }: { topic: string; stored: KnowledgeTopicDetail | null }) {
  const toast = useToast();
  const router = useRouter();
  const invalidate = useInvalidateAdmin();
  const { can } = useSession();
  const editable = can('editor');
  const [readWhen, setReadWhen] = useState(stored?.readWhen ?? '');
  const [text, setText] = useState(stored?.text ?? '');
  const [enabled, setEnabled] = useState(stored?.enabled ?? true);
  const [busy, setBusy] = useState<null | 'save' | 'delete'>(null);
  const path = `${KNOWLEDGE_PATH}/${topic}`;

  const readWhenError = lengthError(readWhen, KNOWLEDGE_LIMITS.readWhen);
  const textError = lengthError(text, KNOWLEDGE_LIMITS.text);
  const changed =
    !stored ||
    readWhen.trim() !== stored.readWhen ||
    text.trim() !== stored.text ||
    enabled !== stored.enabled;

  const save = async () => {
    setBusy('save');
    try {
      await adminFetch(path, {
        method: 'PUT',
        body: { readWhen: readWhen.trim(), text: text.trim(), enabled },
      });
      invalidate(adminKeys.raw(KNOWLEDGE_PATH), adminKeys.raw(path));
      toast.push({ title: stored ? 'Thema gespeichert' : 'Thema angelegt', tone: 'success' });
    } catch (error) {
      toast.push({
        title: 'Nicht gespeichert',
        description: (error as Error).message,
        tone: 'error',
      });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!confirm(`„${topic}“ löschen? Die Historie im Audit-Log behält den ganzen Text.`)) return;
    setBusy('delete');
    try {
      await adminFetch(path, { method: 'DELETE' });
      invalidate(adminKeys.raw(KNOWLEDGE_PATH), adminKeys.raw(path));
      toast.push({ title: 'Thema gelöscht', tone: 'success' });
      router.push('/admin/assistant/knowledge');
    } catch (error) {
      toast.push({
        title: 'Nicht gelöscht',
        description: (error as Error).message,
        tone: 'error',
      });
      setBusy(null);
    }
  };

  return (
    <AdminPage width="narrow">
      <Link
        href="/admin/assistant/knowledge"
        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs"
      >
        <ArrowLeft className="h-3 w-3" /> Alle Themen
      </Link>

      <Panel>
        <PanelHeader
          icon={BookOpen}
          title={<code>{topic}</code>}
          hint={
            stored
              ? 'Englisch, für Parky geschrieben, nie Besuchern gezeigt. Er gibt es in eigenen Worten wieder.'
              : 'Neues Thema: Es entsteht beim Speichern.'
          }
          action={
            stored && (
              <Chip tone={stored.enabled ? 'success' : 'muted'}>
                {stored.enabled ? 'an' : 'aus'}
              </Chip>
            )
          }
        />
        <PanelBody className="space-y-4">
          <Field
            label="Wann lesen"
            htmlFor="knowledge-read-when"
            hint={`Was das Thema enthält und wann Parky es liest. Steht so in seinem Prompt. ${readWhen.trim().length} / ${KNOWLEDGE_LIMITS.readWhen.max}`}
            error={readWhen && readWhenError}
          >
            <TextArea
              id="knowledge-read-when"
              rows={3}
              value={readWhen}
              disabled={!editable}
              onChange={(event) => setReadWhen(event.target.value)}
            />
          </Field>
          <Field
            label="Text"
            htmlFor="knowledge-text"
            hint={`Kommt nur in einen Chat, wenn Parky das Thema liest. ${text.trim().length} / ${KNOWLEDGE_LIMITS.text.max}`}
            error={text && textError}
          >
            <TextArea
              id="knowledge-text"
              rows={18}
              value={text}
              disabled={!editable}
              spellCheck={false}
              className="font-mono text-xs"
              onChange={(event) => setText(event.target.value)}
            />
          </Field>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={!editable}
            label="In Parkys Prompt (aus: bleibt gespeichert, wird aber nicht gelesen)"
          />
          {editable && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!changed || !!readWhenError || !!textError || busy !== null}
                onClick={save}
              >
                {busy === 'save' && <Loader2 className="animate-spin" />}
                {stored ? 'Speichern' : 'Anlegen'}
              </Button>
              {stored && (
                <Button size="sm" variant="outline" disabled={busy !== null} onClick={remove}>
                  {busy === 'delete' ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  Löschen
                </Button>
              )}
            </div>
          )}
        </PanelBody>
      </Panel>

      {stored && (
        <Panel>
          <PanelBody className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Meta label="Angelegt" value={formatDateTime(stored.createdAt)} />
            <Meta label="Geändert" value={formatDateTime(stored.updatedAt)} />
            <Meta label="Von" value={stored.updatedBy ?? '–'} />
          </PanelBody>
        </Panel>
      )}

      {stored && stored.history.length > 0 && (
        <Panel>
          <PanelHeader icon={History} title="Historie" hint="Aus dem Audit-Log, neueste zuerst" />
          <PanelBody className="p-0">
            <ul className="divide-border/40 divide-y">
              {stored.history.map((edit) => (
                <HistoryRow key={`${edit.at}-${edit.action}`} edit={edit} />
              ))}
            </ul>
          </PanelBody>
        </Panel>
      )}
    </AdminPage>
  );
}

/** One edit: when, who, what, and the texts before it, opened on demand. */
function HistoryRow({ edit }: { edit: KnowledgeEdit }) {
  const changedFields = (['readWhen', 'text', 'enabled'] as const).filter(
    (field) => edit.before && edit.after && edit.before[field] !== edit.after[field]
  );
  return (
    <li className="space-y-1 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{EDIT_LABEL[edit.action] ?? edit.action}</span>
        {changedFields.length > 0 && (
          <span className="text-muted-foreground text-xs">{changedFields.join(', ')}</span>
        )}
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {formatDateTime(edit.at)}
          {edit.by && ` · ${edit.by}`}
        </span>
      </div>
      {edit.before && (
        <details>
          <summary className="text-muted-foreground cursor-pointer text-xs">Stand davor</summary>
          <p className="text-muted-foreground mt-1 text-xs">{edit.before.readWhen}</p>
          <pre className="bg-muted/30 mt-1 max-h-64 overflow-auto rounded-lg p-2 text-xs whitespace-pre-wrap">
            {edit.before.text}
          </pre>
        </details>
      )}
    </li>
  );
}

/** The API's length bounds as the field's error, or null within them. */
function lengthError(value: string, limits: { min: number; max: number }): string | null {
  const length = value.trim().length;
  if (length < limits.min) return `Mindestens ${limits.min} Zeichen`;
  if (length > limits.max) return `Höchstens ${limits.max} Zeichen`;
  return null;
}
