import { TABS, formatSleep, sleepPcts, type StyleDemoProps } from './types';

/**
 * Style 5: Monocraft 机能风
 * 深灰底（非纯黑）+ 单色荧光橙强调 + 粗体大字 + 工业感间距
 * 区别于 digrun 的多彩霓虹，这里只用一个强调色，克制而有力
 */
export default function StyleMonocraft({ nickname, record }: StyleDemoProps) {
  const initial = nickname.charAt(0).toUpperCase();
  const { resting_heart_rate, hrv_rmssd, fatigue_rate, sleep_duration_min, deep_sleep_min, light_sleep_min, rem_sleep_min } = record;
  const { pDeep, pLight, pRem } = sleepPcts(record);
  const sleepStr = sleep_duration_min ? formatSleep(sleep_duration_min) : '--';

  const metrics = [
    { label: 'RHR', value: resting_heart_rate ?? '--', unit: 'BPM' },
    { label: 'HRV', value: hrv_rmssd ? Math.round(hrv_rmssd) : '--', unit: 'MS' },
    { label: 'FATIGUE', value: fatigue_rate ?? '--', unit: '%' },
    { label: 'SLEEP', value: sleepStr, unit: '' },
  ];

  return (
    <div className="bg-[#1a1a1a] min-h-full flex flex-col">
      {/* Header — 左对齐大标题 */}
      <div className="px-5 pt-6 pb-1">
        <span className="text-[10px] font-mono text-[#ff6b2b] uppercase tracking-[0.2em]">Profile</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-14">
        {/* Avatar — 横条布局 */}
        <div className="mx-5 mt-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#ff6b2b] text-white text-lg font-bold flex items-center justify-center">
            {initial}
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-tight">{nickname}</div>
            <div className="text-[10px] text-[#666] font-mono uppercase tracking-widest mt-0.5">Trail Runner</div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 mt-5 border-t border-[#2a2a2a]" />

        {/* Health — 竖排大数字 */}
        <div className="mx-5 mt-4">
          <div className="text-[10px] font-mono text-[#666] uppercase tracking-[0.15em] mb-4">Today&apos;s Status</div>
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-baseline justify-between">
                <span className="text-[11px] font-mono text-[#666] uppercase tracking-wider">{m.label}</span>
                <div>
                  <span className="text-2xl font-bold text-white tabular-nums tracking-tight">{m.value}</span>
                  {m.unit && <span className="text-[10px] font-mono text-[#444] ml-1">{m.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sleep bar */}
        {sleep_duration_min && sleep_duration_min > 0 && (
          <div className="mx-5 mt-5">
            <div className="text-[10px] font-mono text-[#666] uppercase tracking-[0.15em] mb-2">Sleep Phases</div>
            <div className="flex h-2 rounded-sm overflow-hidden">
              <div className="bg-[#ff6b2b]" style={{ width: `${pDeep}%` }} />
              <div className="bg-[#ff6b2b]/40" style={{ width: `${pLight}%` }} />
              <div className="bg-[#ff6b2b]/20" style={{ width: `${pRem}%` }} />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-[#555] mt-1.5">
              <span>DEEP {deep_sleep_min}m</span>
              <span>LIGHT {light_sleep_min}m</span>
              <span>REM {rem_sleep_min}m</span>
            </div>
          </div>
        )}
      </div>

      {/* TabBar */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] h-12 flex justify-around items-center">
        {TABS.map((tab) => (
          <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.active ? 'text-[#ff6b2b]' : 'text-[#444]'}`}>
            <span className="text-sm">{tab.icon}</span>
            <span className="text-[9px] font-mono">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
