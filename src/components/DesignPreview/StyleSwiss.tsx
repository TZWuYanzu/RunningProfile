import { TABS, formatSleep, sleepPcts, type StyleDemoProps } from './types';

/**
 * Style 6: Swiss 瑞士排版
 * 白底 + 黑色大字 + 红色强调 + 网格对齐 + 强烈字号对比
 * 国际主义设计，Helvetica精神，高对比度排版驱动
 */
export default function StyleSwiss({ nickname, record }: StyleDemoProps) {
  const initial = nickname.charAt(0).toUpperCase();
  const { resting_heart_rate, hrv_rmssd, fatigue_rate, sleep_duration_min, deep_sleep_min, light_sleep_min, rem_sleep_min } = record;
  const { pDeep, pLight, pRem } = sleepPcts(record);
  const sleepStr = sleep_duration_min ? formatSleep(sleep_duration_min) : '--';

  const metrics = [
    { label: '静息心率', value: resting_heart_rate ?? '--', unit: 'bpm' },
    { label: 'HRV', value: hrv_rmssd ? Math.round(hrv_rmssd) : '--', unit: 'ms' },
    { label: '疲劳度', value: fatigue_rate ?? '--', unit: '%' },
    { label: '睡眠', value: sleepStr, unit: '' },
  ];

  return (
    <div className="bg-white min-h-full flex flex-col">
      {/* Header — 极简，左侧红色竖线 */}
      <div className="px-5 pt-6 pb-2 flex items-center gap-2">
        <div className="w-1 h-4 bg-red-500 rounded-full" />
        <span className="text-sm font-bold text-black tracking-tight">我的</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-14">
        {/* Avatar — 超大首字母 */}
        <div className="mx-5 mt-4 flex items-end gap-3">
          <span className="text-5xl font-black text-black leading-none">{initial}</span>
          <div className="pb-1">
            <div className="text-base font-bold text-black">{nickname}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">越野跑者</div>
          </div>
        </div>

        {/* Red divider */}
        <div className="mx-5 mt-5 mb-4 h-px bg-red-500" />

        {/* Health — 2x2 grid with strong hierarchy */}
        <div className="mx-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{m.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-black tabular-nums leading-none">{m.value}</span>
                  {m.unit && <span className="text-xs text-gray-300">{m.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sleep bar */}
        {sleep_duration_min && sleep_duration_min > 0 && (
          <div className="mx-5 mt-6">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">睡眠结构</div>
            <div className="flex h-1 overflow-hidden">
              <div className="bg-black" style={{ width: `${pDeep}%` }} />
              <div className="bg-red-500" style={{ width: `${pLight}%` }} />
              <div className="bg-gray-200" style={{ width: `${pRem}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1.5">
              <span>深睡 {deep_sleep_min}m</span>
              <span>浅睡 {light_sleep_min}m</span>
              <span>REM {rem_sleep_min}m</span>
            </div>
          </div>
        )}
      </div>

      {/* TabBar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-black h-12 flex justify-around items-center">
        {TABS.map((tab) => (
          <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.active ? 'text-red-500' : 'text-gray-300'}`}>
            <span className="text-base">{tab.icon}</span>
            <span className="text-[9px] font-medium">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
