import { apiFetch } from './client';
import type { AthleteProfile, Shoe, ShoeLog, DailyHealthRecord } from '@/types/coach';

export function getProfile(userId = 'default'): Promise<{ profile: AthleteProfile | null; summary: string }> {
  return apiFetch(`/api/memory/profile/${userId}`);
}

export function getShoes(userId = 'default'): Promise<{ shoes: Shoe[] }> {
  return apiFetch(`/api/equipment/shoes?user_id=${userId}`);
}

export function createShoe(data: {
  name: string;
  brand: string;
  usage: string;
  traits: string[];
  initial_km: number;
  user_id?: string;
}): Promise<{ status: string; id: number }> {
  return apiFetch('/api/equipment/shoes', {
    method: 'POST',
    body: JSON.stringify({ user_id: 'default', ...data }),
  });
}

export function getShoeDetail(shoeId: number): Promise<{ shoe: Shoe; logs: ShoeLog[] }> {
  return apiFetch(`/api/equipment/shoes/${shoeId}`);
}

export function createShoeLog(
  shoeId: number,
  data: {
    terrain: string;
    grip: string;
    cushion: string;
    stability: string;
    overall: string;
    activity_run_id?: number;
    notes?: string;
  }
): Promise<{ status: string; id: number }> {
  return apiFetch(`/api/equipment/shoes/${shoeId}/log`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function retireShoe(shoeId: number): Promise<{ status: string }> {
  return apiFetch(`/api/equipment/shoes/${shoeId}`, { method: 'DELETE' });
}

export function getHealthDaily(
  userId = 'default',
  start = '',
  end = ''
): Promise<{ records: DailyHealthRecord[] }> {
  const params = new URLSearchParams({ user_id: userId });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  return apiFetch(`/api/health/daily?${params}`);
}
