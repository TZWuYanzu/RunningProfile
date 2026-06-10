import { API_TOKEN } from './client';

export interface TranscribeResult {
  text: string;
  language?: string;
  error?: string;
}

export async function transcribeAudio(audioBlob: Blob): Promise<TranscribeResult> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');

  const res = await fetch('/api/coach/transcribe', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Transcribe API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
