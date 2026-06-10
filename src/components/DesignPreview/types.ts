import type { DailyHealthRecord } from '@/types/coach';

export interface StyleDemoProps {
  nickname: string;
  record: DailyHealthRecord;
}

export const TABS = [
  { label: '概览', icon: '📊' },
  { label: '历史', icon: '🏃' },
  { label: '教练', icon: '💬', primary: true },
  { label: '计划', icon: '📅' },
  { label: '我的', icon: '👤', active: true },
];

export function formatSleep(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

export function sleepPcts(record: DailyHealthRecord) {
  const total = record.sleep_duration_min || 0;
  if (!total) return { pDeep: 0, pLight: 0, pRem: 0 };
  return {
    pDeep: ((record.deep_sleep_min || 0) / total) * 100,
    pLight: ((record.light_sleep_min || 0) / total) * 100,
    pRem: ((record.rem_sleep_min || 0) / total) * 100,
  };
}
