import { TABS, formatSleep, sleepPcts, type StyleDemoProps } from './types';

export default function StyleLinear({ nickname, record }: StyleDemoProps) {
  const initial = nickname.charAt(0).toUpperCase();
  const { resting_heart_rate, hrv_rmssd, fatigue_rate, sleep_duration_min, deep_sleep_min, light_sleep_min, rem_sleep_min } = record;
  const { pDeep, pLight, pRem } = sleepPcts(record);
  const sleepStr = sleep_duration_min ? formatSleep(sleep_duration_min) : '--';

  const metrics = [
    { label: '静息心率', value: resting_heart_rate ?? '--', unit: 'bpm' },
    { label: 'HRV', value: hrv_rmssd ? Math.round(hrv_rmssd) : '--', unit: 'ms' },
    { label: '疲劳度', value: fatigue_rate ?? '--', unit: '%' },
    { label: '睡眠', value: sleepStr },
  ];

  return (
    <div className="bg-white min-h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <span className="text-sm font-medium text-gray-900 tracking-tight">我的</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-14">
        {/* Avatar */}
        <div className="mx-5 py-4 border-b border-gray-200 flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-900 text-white text-sm font-medium flex items-center justify-center">
            {initial}
          </div>
          <span className="text-sm text-gray-900 ml-3">{nickname}</span>
        </div>

        {/* Health */}
        <div className="mx-5 mt-5 mb-2">
          <span className="text-xs text-gray-400 tracking-wide">今日健康</span>
        </div>
        <div className="mx-5 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-4 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="text-center">
                <div className="text-base font-semibold text-gray-900 tabular-nums">
                  {m.value}
                  {m.unit && <span className="text-[11px] font-normal text-gray-300 ml-0.5">{m.unit}</span>}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">{m.label}</div>
              </div>
            ))}
          </div>

          {sleep_duration_min && sleep_duration_min > 0 && (
            <div className="mt-3">
              <div className="flex h-1.5 rounded-full overflow-hidden">
                <div className="bg-gray-900" style={{ width: `${pDeep}%` }} />
                <div className="bg-gray-400" style={{ width: `${pLight}%` }} />
                <div className="bg-gray-300" style={{ width: `${pRem}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>深睡 {deep_sleep_min}m</span>
                <span>浅睡 {light_sleep_min}m</span>
                <span>REM {rem_sleep_min}m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TabBar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white h-12 flex justify-around items-center">
        {TABS.map((tab) => (
          <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.active ? 'text-gray-900' : 'text-gray-300'}`}>
            <span className="text-base">{tab.icon}</span>
            <span className="text-[10px]">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
