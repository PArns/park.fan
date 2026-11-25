/**
 * Parky's token statistic in the admin (`GET assistant/stats/tokens`): its shapes, where a chat
 * came from, and the days of a window as the chart draws them. The API drops null fields, so
 * anything that may be null arrives as absent and is typed optional.
 */

/** Where a chat came from: the site's widget, or park.fan's app through its data key. */
export type ChatSource = 'web' | 'app';

/** The admin's word for a {@link ChatSource}. */
export const CHAT_SOURCE_LABEL: Record<ChatSource, string> = { web: 'Website', app: 'App' };

/** A chat's source as stored; a chat from an API older than the column is the website's. */
export function chatSource(source: string | undefined | null): ChatSource {
  return source === 'app' ? 'app' : 'web';
}

/** Chats, messages, tokens by kind and cost: one cell of the statistic. */
export interface TokenUsage {
  chats: number;
  messages: number;
  /** Fresh input and cache writes. */
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  /** Every token; more than the three kinds add up to on days older than the kinds were kept. */
  totalTokens: number;
  costUsd: number;
}

/** What a top consumer adds up to. */
interface ConsumerSums {
  chats: number;
  messages: number;
  totalTokens: number;
  costUsd: number;
}

/** The token statistic of a window of UTC days. */
export interface TokenStats {
  from: string;
  to: string;
  /** How many days back chats are kept: the visitors and chats below reach no further. */
  keptDays: number;
  days: Array<TokenUsage & { day: string; source?: string }>;
  totals: { all: TokenUsage; web: TokenUsage; app: TokenUsage };
  /** A visitor is one address on one UTC day, named by a hash that tells nothing else. */
  topVisitors: Array<ConsumerSums & { visitorKey: string; source?: string; day: string }>;
  /** Per data key over the whole window; `name` is absent once the key is deleted. */
  topApiKeys: Array<ConsumerSums & { apiKeyId: string; name?: string }>;
  topConversations: Array<{
    id: string;
    createdAt: string;
    source?: string;
    apiKeyId?: string;
    visitorKey?: string;
    messages: number;
    totalTokens: number;
    costUsd: number;
  }>;
}

/** The windows the token page offers, in days; the API takes 1 to 90. */
export const TOKEN_WINDOWS = [7, 30, 90] as const;

/**
 * Every UTC day of the window, oldest first, with the tokens each source spent on it: a day
 * without a chat is a zero, so the chart's line runs through the whole window.
 */
export function tokenSeries(stats: Pick<TokenStats, 'from' | 'to' | 'days'>): {
  days: string[];
  web: number[];
  app: number[];
} {
  const days: string[] = [];
  const last = Date.parse(`${stats.to}T00:00:00Z`);
  for (let at = Date.parse(`${stats.from}T00:00:00Z`); at <= last; at += 86_400_000) {
    days.push(new Date(at).toISOString().slice(0, 10));
  }
  const index = new Map(days.map((day, i) => [day, i]));
  const web = days.map(() => 0);
  const app = days.map(() => 0);
  for (const row of stats.days) {
    const i = index.get(row.day);
    if (i === undefined) continue;
    (chatSource(row.source) === 'app' ? app : web)[i] += row.totalTokens;
  }
  return { days, web, app };
}
