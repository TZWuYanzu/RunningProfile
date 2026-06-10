import { apiFetch } from './client';
import type { MonthData, RacePlan, DayDetail } from '@/types/coach';

export function getMonth(month: string, userId = 'default'): Promise<MonthData> {
  return apiFetch(`/api/calendar?month=${month}&user_id=${userId}`);
}

export function getPlans(userId = 'default'): Promise<{ plans: RacePlan[] }> {
  return apiFetch(`/api/calendar/plans?user_id=${userId}`);
}

export function getDayDetail(date: string, userId = 'default'): Promise<DayDetail> {
  return apiFetch(`/api/calendar/${date}?user_id=${userId}`);
}
