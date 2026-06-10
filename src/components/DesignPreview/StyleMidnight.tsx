import { TABS, formatSleep, sleepPcts, type StyleDemoProps } from './types';

/**
 * Style 7: Midnight 暗夜渐变
 * 深蓝黑底 + 冷暖渐变强调色（紫→蓝→青） + 圆角卡片 + 光晕
 * 和 digrun 的区别：不用 neon 荧光，而是用渐变色营造高级感
 */
export default function StyleMidnight({ nickname, record }: StyleDemoProps) {
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
    <div className="min-h-full flex flex-col" style={{ background: '#0c0e1a' }}>
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />

      {/* Header */}
      <div className="px-5 pt-6 pb-2 relative z-10">
        <span className="text-sm font-medium text-white/80">我的</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-14 relative z-10">
        {/* Avatar with gradient ring */}
        <div className="mx-5 mt-3 flex items-center gap-4">
          <div className="p-[2px] rounded-2xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
            <div className="w-14 h-14 rounded-2xl bg-[#0c0e1a] text-white text-xl font-bold flex items-center justify-center">
              {initial}
            </div>
          </div>
          <div>
            <div className="text-base font-semibold text-white">{nickname}</div>
            <div className="text-[11px] text-white/30 mt-0.5">越野跑者</div>
          </div>
        </div>

        {/* Health Card */}
        <div className="mx-4 mt-5 p-4 rounded-2xl border border-white/[0.06]"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.05) 100%)' }}>
          <div className="text-[10px] text-white/30 mb-3">今日健康</div>
          <div className="grid grid-cols-4 gap-2">
            {metrics.map((m) => (
              <div key={m.label} className="text-center">
                <div className="text-lg font-bold text-white tabular-nums">
                  {m.value}
                  {m.unit && <span className="text-[10px] font-normal text-white/20 ml-0.5">{m.unit}</span>}
                </div>
                <div className="text-[10px] text-white/30 mt-1">{m.label}</div>
              </div>
            ))}
          </div>

          {sleep_duration_min && sleep_duration_min > 0 && (
            <div className="mt-3">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div style={{ width: `${pDeep}%`, background: '#7c3aed' }} />
                <div style={{ width: `${pLight}%`, background: 'rgba(124,58,237,0.35)' }} />
                <div style={{ width: `${pRem}%`, background: '#06b6d4' }} />
              </div>
              <div className="flex justify-between text-[10px] text-white/25 mt-1">
                <span>深睡 {deep_sleep_min}m</span>
                <span>浅睡 {light_sleep_min}m</span>
                <span>REM {rem_sleep_min}m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TabBar */}
      <div className="absolute bottom-0 left-0 right-0 h-13 flex justify-around items-center border-t border-white/[0.06]"
        style={{ background: 'rgba(12,14,26,0.9)', backdropFilter: 'blur(12px)' }}>
        {TABS.map((tab) => (
          <div key={tab.label} className="flex flex-col items-center gap-0.5">
            <span className={`text-base ${tab.active ? '' : 'text-white/20'}`}
              style={tab.active ? { background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : undefined}>
              {tab.icon}
            </span>
            <span className={`text-[9px] ${tab.active ? 'text-violet-400' : 'text-white/20'}`}>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
