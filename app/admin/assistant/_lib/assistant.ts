/**
 * Shapes and formatters of Parky's admin pages. The API drops null fields, so anything that may
 * be null arrives as absent and is typed optional.
 */

/** The admin proxy prefix of every Parky endpoint. */
export const ASSISTANT_API = '/api/admin/assistant';

/** The public site, for links to the page a chat or feedback came from. */
const SITE_ORIGIN = 'https://park.fan';

/** Parky's settings as `GET assistant/settings` returns them; the key only masked. */
export interface AssistantSettings {
  enabled: boolean;
  /** False when Parky is off in park.fan's app alone; absent from an API older than the switch. */
  appEnabled?: boolean;
  rolloutPercent: number;
  dailyTokenBudget: number;
  apiKeyMasked?: string;
  secretConfigured: boolean;
  tokensToday: number;
  updatedBy?: string;
  updatedAt?: string;
  model: string;
  promptVersion: number;
}

/** One stored chat as the list shows it. */
export interface ConversationRow {
  id: string;
  locale: string;
  startPath: string;
  messageCount: number;
  totalTokens: number;
  costUsd: string;
  rating: number;
  /** The prompt version of the chat's latest answer; null for chats stored before it was kept. */
  promptVersion: number | null;
  createdAt: string;
  firstQuestion?: string;
  /** `web` or `app`; absent from an API older than the column, which `chatSource` reads as web. */
  source?: string;
  /** The data key whose session started an app chat. */
  apiKeyId?: string;
}

/** A tool Parky called while writing an answer. */
export interface ToolCall {
  name: string;
  input: unknown;
  error?: boolean;
}

/** One question or answer of a chat. */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  toolCalls?: ToolCall[];
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  costUsd: string;
  rating?: number;
  /** The prompt version an answer was written with; null on questions and older answers. */
  promptVersion: number | null;
  createdAt: string;
}

/**
 * Feedback a visitor sent from the widget's form, or Parky passed on from a chat (`source`
 * `chat`), whose `message` is then the visitor's words as typed.
 */
export interface FeedbackEntry {
  id: string;
  message: string;
  email?: string;
  locale: string;
  pagePath: string;
  conversationId?: string;
  status: FeedbackStatus;
  /** Absent from an API older than the column, which only knew the form. */
  source?: 'form' | 'chat';
  kind?: FeedbackKind;
  createdAt: string;
}

/** Where a piece of feedback stands. */
export type FeedbackStatus = 'new' | 'done' | 'archived';

/** What Parky took feedback from a chat for; mirrors the API's `FEEDBACK_KINDS`. */
export type FeedbackKind =
  'bug' | 'wrong_data' | 'missing_park_or_ride' | 'feature_wish' | 'praise' | 'criticism';

/** The admin's words for a {@link FeedbackKind}. */
export const FEEDBACK_KIND_LABEL: Record<FeedbackKind, string> = {
  bug: 'Fehler',
  wrong_data: 'Falsche Daten',
  missing_park_or_ride: 'Park oder Attraktion fehlt',
  feature_wish: 'Wunsch',
  praise: 'Lob',
  criticism: 'Kritik',
};

/**
 * Where a page a chat or a feedback names opens on the site, or null for anything but a path of
 * slugs. The API stores only those; checked again because the path is glued to the origin, where
 * `@host` or `//host` would lead off the site.
 */
export function sitePageUrl(path: string): string | null {
  return /^\/[a-z0-9-][a-z0-9\-/]*$|^\/$/.test(path) ? `${SITE_ORIGIN}${path}` : null;
}

/** One topic of Parky's knowledge base as `GET assistant/knowledge` lists it. */
export interface KnowledgeTopic {
  topic: string;
  /** What the topic holds and when Parky reads it: the line his prompt lists. */
  readWhen: string;
  text: string;
  enabled: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** One edit of a topic, from the audit log, with the whole topic before and after. */
export interface KnowledgeEdit {
  at: string;
  action: string;
  by?: string;
  before?: Partial<Pick<KnowledgeTopic, 'readWhen' | 'text' | 'enabled'>>;
  after?: Partial<Pick<KnowledgeTopic, 'readWhen' | 'text' | 'enabled'>>;
}

/** One topic with its edits, as `GET assistant/knowledge/:topic` answers. */
export interface KnowledgeTopicDetail extends KnowledgeTopic {
  history: KnowledgeEdit[];
}

/** A topic's name as the API takes it: lowercase words joined by "_", 2 to 40 characters. */
export const KNOWLEDGE_TOPIC_PATTERN = /^[a-z]+(?:_[a-z]+)*$/;

/** The API's bounds for a topic's two texts (`knowledgeWriteSchema`). */
export const KNOWLEDGE_LIMITS = {
  readWhen: { min: 20, max: 400 },
  text: { min: 40, max: 4000 },
} as const;

/** A page of a list endpoint. */
export interface Page<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

/** One chat with everything stored about it. */
export interface ConversationDetail extends ConversationRow {
  /** The data key's name; absent for a website chat and once the key is deleted. */
  apiKeyName?: string;
  messages: ConversationMessage[];
  feedback: FeedbackEntry[];
}

/** The overview's figures: 30 days per UTC day, ratings and open feedback. */
export interface AssistantStats {
  days: Array<{ day: string; chats: number; messages: number; tokens: string; costUsd: number }>;
  ratings: { up: number; down: number };
  openFeedback: number;
  tokensToday: number;
}

const usd = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 4,
});
const dateTime = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' });
const count = new Intl.NumberFormat('de-DE');

/** A cost in US dollars, to a hundredth of a cent: one answer costs fractions of a cent. */
export function formatUsd(value: number | string): string {
  return usd.format(Number(value));
}

/** A timestamp in the admin's own clock. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** A count with thousands separators. */
export function formatCount(value: number | string): string {
  return count.format(Number(value));
}
