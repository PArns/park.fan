/**
 * Shapes and formatters of Parky's admin pages. The API drops null fields, so anything that may
 * be null arrives as absent and is typed optional.
 */

/** The admin proxy prefix of every Parky endpoint. */
export const ASSISTANT_API = '/api/admin/assistant';

/** The public site, for links to the page a chat or feedback came from. */
export const SITE_ORIGIN = 'https://park.fan';

/** Parky's settings as `GET assistant/settings` returns them; the key only masked. */
export interface AssistantSettings {
  enabled: boolean;
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
  createdAt: string;
  firstQuestion?: string;
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
  createdAt: string;
}

/** Feedback a visitor sent from the widget. */
export interface FeedbackEntry {
  id: string;
  message: string;
  email?: string;
  locale: string;
  pagePath: string;
  conversationId?: string;
  status: FeedbackStatus;
  createdAt: string;
}

/** Where a piece of feedback stands. */
export type FeedbackStatus = 'new' | 'done' | 'archived';

/** A page of a list endpoint. */
export interface Page<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

/** One chat with everything stored about it. */
export interface ConversationDetail extends ConversationRow {
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
