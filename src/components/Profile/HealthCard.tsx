import type { DailyHealthRecord } from '@/types/coach';

interface Props {
  record: DailyHealthRecord;
}

function SleepBar({ deep, light, rem, total }: { deep: number; light: number; rem: number; total: number }) {
  if (!total) return null;
  const pDeep = (deep / total) * 100;
  const pLight = (light / total) * 100;
  const pRem = (rem / total) * 100;
  return (
    <div className="mt-3">
      <div className="flex h-2 overflow-hidden">
        <div className="bg-primary" style={{ width: `${pDeep}%` }} />
        <div className="bg-tertiary" style={{ width: `${pLight}%` }} />
        <div className="bg-accent" style={{ width: `${pRem}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-tertiary mt-1">
        <span>深睡 {deep}m</span>
        <span>浅睡 {light}m</span>
        <span>REM {rem}m</span>
      </div>
    </div>
  );
}

export default function HealthCard({ record }: Props) {
  const { resting_heart_rate, hrv_rmssd, fatigue_rate, sleep_duration_min, deep_sleep_min, light_sleep_min, rem_sleep_min } = record;

  const hasCardio = resting_heart_rate != null || hrv_rmssd != null;
  const hasSleep = sleep_duration_min != null && sleep_duration_min > 0;

  if (!hasCardio && !hasSleep) return null;

  const sleepHours = hasSleep ? `${Math.floor(sleep_duration_min! / 60)}h${sleep_duration_min! % 60 > 0 ? `${Math.round(sleep_duration_min! % 60)}m` : ''}` : '--';

  return (
    <div className="mx-5 mt-5">
      <div className="text-[9px] text-tertiary uppercase tracking-wider mb-3">今日健康 · {record.date}</div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        {resting_heart_rate != null && (
          <div>
            <div className="text-[9px] text-tertiary uppercase tracking-wider mb-1">静息心率</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-primary tabular-nums leading-none">{resting_heart_rate}</span>
              <span className="text-xs text-muted">bpm</span>
            </div>
          </div>
        )}
        {hrv_rmssd != null && (
          <div>
            <div className="text-[9px] text-tertiary uppercase tracking-wider mb-1">HRV</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-primary tabular-nums leading-none">{Math.round(hrv_rmssd)}</span>
              <span className="text-xs text-muted">ms</span>
            </div>
          </div>
        )}
        {fatigue_rate != null && (
          <div>
            <div className="text-[9px] text-tertiary uppercase tracking-wider mb-1">疲劳度</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-primary tabular-nums leading-none">{fatigue_rate}</span>
              <span className="text-xs text-muted">%</span>
            </div>
          </div>
        )}
        {hasSleep && (
          <div>
            <div className="text-[9px] text-tertiary uppercase tracking-wider mb-1">睡眠</div>
            <div className="text-3xl font-black text-primary tabular-nums leading-none">{sleepHours}</div>
          </div>
        )}
      </div>

      {hasSleep && (
        <SleepBar
          deep={deep_sleep_min || 0}
          light={light_sleep_min || 0}
          rem={rem_sleep_min || 0}
          total={sleep_duration_min!}
        />
      )}
    </div>
  );
}
