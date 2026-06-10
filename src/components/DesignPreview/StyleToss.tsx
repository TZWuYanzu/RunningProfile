import { TABS, formatSleep, sleepPcts, type StyleDemoProps } from './types';

export default function StyleToss({ nickname, record }: StyleDemoProps) {
  const initial = nickname.charAt(0).toUpperCase();
  const { resting_heart_rate, hrv_rmssd, fatigue_rate, sleep_duration_min, deep_sleep_min, light_sleep_min, rem_sleep_min } = record;
  const { pDeep, pLight, pRem } = sleepPcts(record);
  const sleepStr = sleep_duration_min ? formatSleep(sleep_duration_min) : '--';

  const metrics = [
    { label: '静息心率', value: resting_heart_rate ?? '--', unit: 'bpm', color: 'text-rose-400' },
    { label: 'HRV', value: hrv_rmssd ? Math.round(hrv_rmssd) : '--', unit: 'ms', color: 'text-violet-500' },
    { label: '疲劳度', value: fatigue_rate ?? '--', unit: '%', color: 'text-amber-400' },
    { label: '睡眠', value: sleepStr, color: 'text-teal-500' },
  ];

  return (
    <div className="bg-[#f8f7f4] min-h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <span className="text-base font-semibold text-gray-800">我的</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-16">
        {/* Avatar */}
        <div className="mx-4 mt-2 p-5 bg-white rounded-3xl shadow-sm flex items-center">
          <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-600 text-2xl font-bold flex items-center justify-center">
            {initial}
          </div>
          <div className="ml-4">
            <div className="text-base font-semibold text-gray-800">{nickname}</div>
            <div className="text-xs text-gray-400 mt-0.5">跑步爱好者</div>
          </div>
        </div>

        {/* Health */}
        <div className="text-sm font-semibold text-gray-700 mx-5 mt-5 mb-2">今日健康</div>
        <div className="mx-4 bg-white rounded-3xl shadow-sm p-5">
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="bg-[#f8f7f4] rounded-2xl p-3 text-center">
                <div className={`text-xl font-bold ${m.color}`}>
                  {m.value}
                  {m.unit && <span className="text-[11px] font-normal text-gray-300 ml-0.5">{m.unit}</span>}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">{m.label}</div>
              </div>
            ))}
          </div>

          {sleep_duration_min && sleep_duration_min > 0 && (
            <div className="mt-4">
              <div className="flex h-3 rounded-full overflow-hidden">
                <div className="bg-violet-400" style={{ width: `${pDeep}%` }} />
                <div className="bg-violet-200" style={{ width: `${pLight}%` }} />
                <div className="bg-teal-300" style={{ width: `${pRem}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                <span>深睡 {deep_sleep_min}m</span>
                <span>浅睡 {light_sleep_min}m</span>
                <span>REM {rem_sleep_min}m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TabBar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl h-16 flex justify-around items-center"
        style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.04)' }}>
        {TABS.map((tab) => (
          <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.active ? 'text-violet-500' : 'text-gray-300'}`}>
            <span className={tab.primary ? 'text-xl' : 'text-base'}>{tab.icon}</span>
            <span className="text-[11px] font-medium mt-0.5">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
