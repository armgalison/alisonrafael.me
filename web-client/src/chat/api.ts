const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export type ChatStreamEvent =
  | { type: 'token'; delta: string }
  | { type: 'done'; stopReason: string }
  | { type: 'error'; message: string };

function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

async function streamSse<TEvent>(
  path: string,
  onEvent: (event: TEvent) => void,
  options: RequestInit = {},
): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error: ${res.status} ${error}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const line = frame.split('\n').find((l) => l.startsWith('data: '));
        if (!line) continue;
        try {
          onEvent(JSON.parse(line.slice('data: '.length)) as TEvent);
        } catch (e) {
          console.error('Failed to parse SSE event:', line, e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const chatApi = {
  createSession: async () => {
    const res = await fetch(`${API_URL}/chat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json() as Promise<{ sessionId: string }>;
  },

  getHistory: async (sessionId: string) => {
    const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/history`);
    if (!res.ok) throw new Error('Failed to get history');
    return res.json() as Promise<Array<{ role: string; content: string; createdAt: string }>>;
  },

  streamMessage: async (
    sessionId: string,
    content: string,
    onEvent: (event: ChatStreamEvent) => void,
  ) => {
    return streamSse<ChatStreamEvent>(
      '/chat/message',
      onEvent,
      {
        method: 'POST',
        body: JSON.stringify({ sessionId, content }),
      },
    );
  },
};
