import { TABS, formatSleep, sleepPcts, type StyleDemoProps } from './types';

/**
 * Style 8: Nord 北欧极简
 * 深灰蓝底 + 冰蓝/薄荷绿强调 + 极简无边框 + 大间距 + 轻量感
 * 斯堪的纳维亚设计：功能即美学，去除一切装饰
 */
export default function StyleNord({ nickname, record }: StyleDemoProps) {
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
    <div className="bg-[#2e3440] min-h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-7 pb-2">
        <span className="text-xs text-[#d8dee9]/50 tracking-widest uppercase">我的</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-14">
        {/* Avatar — 极简 */}
        <div className="mx-6 mt-3 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#88c0d0] text-[#2e3440] text-base font-bold flex items-center justify-center">
            {initial}
          </div>
          <div>
            <div className="text-base font-medium text-[#eceff4]">{nickname}</div>
            <div className="text-[10px] text-[#d8dee9]/30 mt-0.5">越野跑者</div>
          </div>
        </div>

        {/* Health — 无卡片，直接排列 */}
        <div className="mx-6 mt-8">
          <div className="text-[10px] text-[#d8dee9]/30 tracking-widest uppercase mb-5">今日健康</div>
          <div className="grid grid-cols-2 gap-6">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="text-[10px] text-[#d8dee9]/30 mb-1">{m.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-[#eceff4] tabular-nums">{m.value}</span>
                  {m.unit && <span className="text-[10px] text-[#d8dee9]/20">{m.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sleep bar */}
        {sleep_duration_min && sleep_duration_min > 0 && (
          <div className="mx-6 mt-8">
            <div className="text-[10px] text-[#d8dee9]/30 tracking-widest uppercase mb-3">睡眠结构</div>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-[#3b4252]">
              <div className="bg-[#88c0d0]" style={{ width: `${pDeep}%` }} />
              <div className="bg-[#88c0d0]/40" style={{ width: `${pLight}%` }} />
              <div className="bg-[#81a1c1]" style={{ width: `${pRem}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-[#d8dee9]/25 mt-2">
              <span>深睡 {deep_sleep_min}m</span>
              <span>浅睡 {light_sleep_min}m</span>
              <span>REM {rem_sleep_min}m</span>
            </div>
          </div>
        )}
      </div>

      {/* TabBar */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#2e3440] h-13 flex justify-around items-center">
        {TABS.map((tab) => (
          <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.active ? 'text-[#88c0d0]' : 'text-[#4c566a]'}`}>
            <span className="text-base">{tab.icon}</span>
            <span className="text-[9px]">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
