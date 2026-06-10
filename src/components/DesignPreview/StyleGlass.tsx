import { TABS, formatSleep, sleepPcts, type StyleDemoProps } from './types';

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.12)',
};

export default function StyleGlass({ nickname, record }: StyleDemoProps) {
  const initial = nickname.charAt(0).toUpperCase();
  const { resting_heart_rate, hrv_rmssd, fatigue_rate, sleep_duration_min, deep_sleep_min, light_sleep_min, rem_sleep_min } = record;
  const { pDeep, pLight, pRem } = sleepPcts(record);
  const sleepStr = sleep_duration_min ? formatSleep(sleep_duration_min) : '--';

  const metrics = [
    { label: '静息心率', value: resting_heart_rate ?? '--', unit: 'bpm', color: 'text-emerald-400' },
    { label: 'HRV', value: hrv_rmssd ? Math.round(hrv_rmssd) : '--', unit: 'ms', color: 'text-cyan-400' },
    { label: '疲劳度', value: fatigue_rate ?? '--', unit: '%', color: 'text-emerald-400' },
    { label: '睡眠', value: sleepStr, color: 'text-white' },
  ];

  return (
    <div
      className="min-h-full flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c4a6e 100%)' }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <span className="text-sm font-medium text-white/90 tracking-wide">我的</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-14">
        {/* Avatar */}
        <div className="mx-4 mt-2 p-4 rounded-2xl flex items-center" style={glassCard}>
          <div
            className="w-14 h-14 rounded-full bg-cyan-500 text-white text-xl font-bold flex items-center justify-center"
            style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)' }}
          >
            {initial}
          </div>
          <div className="ml-4">
            <div className="text-base font-medium text-white">{nickname}</div>
            <div className="text-xs text-white/40 mt-0.5">跑者</div>
          </div>
        </div>

        {/* Health */}
        <div className="text-xs text-cyan-300/70 mx-4 mt-4 mb-2">今日健康</div>
        <div className="mx-4 p-4 rounded-2xl" style={glassCard}>
          <div className="grid grid-cols-4 gap-2">
            {metrics.map((m) => (
              <div key={m.label} className="text-center">
                <div className={`text-lg font-bold ${m.color}`}>
                  {m.value}
                  {m.unit && <span className="text-[10px] font-normal text-white/30 ml-0.5">{m.unit}</span>}
                </div>
                <div className="text-[10px] text-white/40 mt-1">{m.label}</div>
              </div>
            ))}
          </div>

          {sleep_duration_min && sleep_duration_min > 0 && (
            <div className="mt-3">
              <div className="flex h-2.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500" style={{ width: `${pDeep}%` }} />
                <div className="bg-cyan-300/50" style={{ width: `${pLight}%` }} />
                <div className="bg-emerald-400/60" style={{ width: `${pRem}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mt-1">
                <span>深睡 {deep_sleep_min}m</span>
                <span>浅睡 {light_sleep_min}m</span>
                <span>REM {rem_sleep_min}m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TabBar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-14 flex justify-around items-center"
        style={{ ...glassCard, borderLeft: 'none', borderRight: 'none', borderBottom: 'none', borderRadius: 0 }}
      >
        {TABS.map((tab) => (
          <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.active ? 'text-cyan-400' : 'text-white/30'}`}>
            <span className={tab.primary ? 'text-xl' : 'text-base'}>{tab.icon}</span>
            <span className="text-[10px]">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
