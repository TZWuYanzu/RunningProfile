import type { SSEEvent } from '@/types/coach';

export const API_TOKEN = 'dev-key-change-me';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function streamChat(
  message: string,
  userId: string,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch('/api/coach/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({ message, user_id: userId }),
    signal,
  });

  if (!res.ok) throw new Error(`Chat API ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop()!;
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data: ')) continue;
      const dataStr = line.slice(6);
      if (dataStr) {
        try {
          onEvent(JSON.parse(dataStr) as SSEEvent);
        } catch {
          // skip malformed events
        }
      }
    }
  }
}
