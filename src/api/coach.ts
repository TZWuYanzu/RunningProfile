import { apiFetch } from './client';
import type { GreetingResponse } from '@/types/coach';

export function getGreeting(userId = 'default'): Promise<GreetingResponse> {
  return apiFetch(`/api/coach/greeting?user_id=${userId}`);
}

export function runOnboarding(userId = 'default') {
  return apiFetch<{ status: string; greeting?: string }>(
    `/api/coach/onboarding?user_id=${userId}`,
    { method: 'POST' }
  );
}
