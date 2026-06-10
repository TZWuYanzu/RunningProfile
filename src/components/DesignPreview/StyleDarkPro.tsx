import { TABS, formatSleep, sleepPcts, type StyleDemoProps } from './types';

export default function StyleDarkPro({ nickname, record }: StyleDemoProps) {
  const initial = nickname.charAt(0).toUpperCase();
  const { resting_heart_rate, hrv_rmssd, fatigue_rate, sleep_duration_min, deep_sleep_min, light_sleep_min, rem_sleep_min } = record;
  const { pDeep, pLight, pRem } = sleepPcts(record);
  const sleepStr = sleep_duration_min ? formatSleep(sleep_duration_min) : '--';

  const metrics = [
    { label: 'RHR', value: resting_heart_rate ?? '--', unit: 'bpm', color: 'text-lime-400' },
    { label: 'HRV', value: hrv_rmssd ? Math.round(hrv_rmssd) : '--', unit: 'ms', color: 'text-cyan-400' },
    { label: 'FATIGUE', value: fatigue_rate ?? '--', unit: '%', color: 'text-amber-400' },
    { label: 'SLEEP', value: sleepStr, color: 'text-gray-300' },
  ];

  return (
    <div className="bg-[#0a0a0a] min-h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-widest font-mono">Profile</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-14">
        {/* Avatar */}
        <div className="mx-3 mt-2 p-3 bg-[#141414] rounded-lg border border-[#222] flex items-center">
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#333] text-lime-400 text-sm font-mono font-bold flex items-center justify-center">
            {initial}
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-300 font-mono">{nickname}</div>
            <div className="text-[10px] text-gray-600 font-mono mt-0.5">TRAIL RUNNER</div>
          </div>
        </div>

        {/* Health */}
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mx-3 mt-4 mb-1.5">Daily Health</div>
        <div className="mx-3 bg-[#141414] rounded-lg border border-[#222] p-3">
          <div className="grid grid-cols-4 gap-1">
            {metrics.map((m) => (
              <div key={m.label} className="text-center">
                <div className={`text-lg font-bold font-mono tabular-nums ${m.color}`}>
                  {m.value}
                </div>
                <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mt-0.5">
                  {m.unit && <span className="text-gray-600">{m.unit} · </span>}
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {sleep_duration_min && sleep_duration_min > 0 && (
            <div className="mt-3">
              <div className="flex h-1.5 rounded-sm overflow-hidden">
                <div className="bg-lime-500" style={{ width: `${pDeep}%` }} />
                <div className="bg-lime-800" style={{ width: `${pLight}%` }} />
                <div className="bg-cyan-600" style={{ width: `${pRem}%` }} />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-gray-600 mt-1">
                <span>DEEP {deep_sleep_min}m</span>
                <span>LIGHT {light_sleep_min}m</span>
                <span>REM {rem_sleep_min}m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TabBar */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#222] h-12 flex justify-around items-center">
        {TABS.map((tab) => (
          <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.active ? 'text-lime-400' : 'text-gray-700'}`}>
            <span className="text-sm">{tab.icon}</span>
            <span className="text-[9px] font-mono uppercase tracking-wider">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
