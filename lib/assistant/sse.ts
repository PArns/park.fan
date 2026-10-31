/** One server-sent event: its name and its `data` lines joined. */
export interface SseEvent {
  event: string;
  data: string;
}

/**
 * Reads a `text/event-stream` body event by event. A hand-written reader rather than
 * `EventSource`, which can only GET and so cannot send the question as a body.
 */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let end: number;
    while ((end = buffer.search(/\r?\n\r?\n/)) >= 0) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end).replace(/^\r?\n\r?\n/, '');
      const parsed = parseBlock(block);
      if (parsed) yield parsed;
    }
  }
  const last = parseBlock(buffer);
  if (last) yield last;
}

function parseBlock(block: string): SseEvent | null {
  let event = 'message';
  const data: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
  }
  return data.length > 0 ? { event, data: data.join('\n') } : null;
}
