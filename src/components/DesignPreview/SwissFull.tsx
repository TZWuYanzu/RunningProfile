import { TABS, type StyleDemoProps } from './types';

function TabBar({ active }: { active: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-black h-12 flex justify-around items-center">
      {TABS.map((tab) => (
        <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.label === active ? 'text-red-500' : 'text-gray-300'}`}>
          <span className="text-base">{tab.icon}</span>
          <span className="text-[9px] font-medium">{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

export function SwissChat(_: StyleDemoProps) {
  const messages = [
    { role: 'assistant', text: '早上好！昨天的越野跑数据已同步，爬升 620m，配速控制得不错。今天建议做一组轻松恢复跑。' },
    { role: 'user', text: '腿有点酸，可以改成休息日吗？' },
    { role: 'assistant', text: '完全可以。连续两天爬升训练后休息是合理的。建议做 15 分钟泡沫轴放松，明天再安排轻松跑。' },
    { role: 'user', text: '好的，明天跑哪条路线？' },
    { role: 'assistant', text: '推荐千岛湖环湖绿道东段，平路为主，10km 左右，心率控制在 Z2 区间。天气预报明天多云 22°C，适合恢复跑。' },
  ];

  return (
    <div className="bg-white min-h-full flex flex-col">
      <div className="px-5 pt-6 pb-2 flex items-center gap-2">
        <div className="w-1 h-4 bg-red-500 rounded-full" />
        <span className="text-sm font-bold text-black tracking-tight">教练</span>
      </div>
      <div className="flex-1 overflow-y-auto pb-24 px-5 pt-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] text-sm leading-relaxed px-4 py-3 ${
              m.role === 'user'
                ? 'bg-black text-white rounded-2xl rounded-br-none'
                : 'bg-gray-50 text-black rounded-2xl rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      {/* Input */}
      <div className="absolute bottom-12 left-0 right-0 px-5 py-2 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 border-b-2 border-black px-1 flex items-center text-sm text-gray-300">输入消息...</div>
          <div className="w-10 h-10 bg-red-500 flex items-center justify-center text-white text-sm font-bold">↑</div>
        </div>
      </div>
      <TabBar active="教练" />
    </div>
  );
}

export function SwissCalendar(_: StyleDemoProps) {
  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
  const days = [
    { d: 9, type: '轻松跑', done: true },
    { d: 10, type: '休息', done: false, today: true },
    { d: 11, type: '恢复跑', done: false },
    { d: 12, type: '间歇', done: false },
    { d: 13, type: '轻松跑', done: false },
    { d: 14, type: '长距离', done: false },
    { d: 15, type: '休息', done: false },
  ];

  return (
    <div className="bg-white min-h-full flex flex-col">
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-red-500 rounded-full" />
          <span className="text-sm font-bold text-black tracking-tight">计划</span>
        </div>
        <span className="text-3xl font-black text-black">6</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-14 px-5">
        {/* Week header */}
        <div className="grid grid-cols-7 gap-1 mt-2 mb-1">
          {weekdays.map((d) => (
            <div key={d} className="text-center text-[10px] text-gray-300 py-1 font-medium">{d}</div>
          ))}
        </div>
        {/* Week row */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {days.map((day) => (
            <div key={day.d} className={`text-center py-2 ${day.today ? 'bg-black rounded-lg' : ''}`}>
              <div className={`text-base font-bold ${day.today ? 'text-white' : day.done ? 'text-gray-300' : 'text-black'}`}>{day.d}</div>
              <div className={`text-[8px] mt-0.5 uppercase tracking-wider ${day.today ? 'text-white/60' : day.done ? 'text-gray-300 line-through' : 'text-gray-400'}`}>
                {day.type}
              </div>
            </div>
          ))}
        </div>

        {/* Red divider */}
        <div className="h-px bg-red-500 mb-4" />

        {/* Today */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-black text-black leading-none">10</span>
            <span className="text-xs text-gray-400">六月 · 今天</span>
          </div>
          <div className="bg-gray-50 p-4">
            <div className="text-base font-bold text-black mb-1">休息日</div>
            <div className="text-xs text-gray-500 leading-relaxed">
              昨日越野跑后恢复。建议做 15 分钟泡沫轴放松 + 拉伸。
            </div>
          </div>
        </div>

        {/* Tomorrow */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-black text-black leading-none">11</span>
            <span className="text-xs text-gray-400">六月 · 明天</span>
          </div>
          <div className="bg-gray-50 p-4">
            <div className="text-base font-bold text-black mb-1">恢复跑</div>
            <div className="text-xs text-gray-500 leading-relaxed mb-3">
              千岛湖环湖绿道东段，平路为主，心率保持 Z2。
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">配速</div>
                <div className="text-lg font-black text-black">6:30</div>
              </div>
              <div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">距离</div>
                <div className="text-lg font-black text-black">10km</div>
              </div>
              <div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">心率</div>
                <div className="text-lg font-black text-black">Z2</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TabBar active="计划" />
    </div>
  );
}

export function SwissOverview(_: StyleDemoProps) {
  return (
    <div className="bg-white min-h-full flex flex-col">
      <div className="px-5 pt-6 pb-2 flex items-center gap-2">
        <div className="w-1 h-4 bg-red-500 rounded-full" />
        <span className="text-sm font-bold text-black tracking-tight">概览</span>
      </div>
      <div className="flex-1 overflow-y-auto pb-14 px-5">
        {/* Hero number */}
        <div className="mt-4 mb-6">
          <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">本周跑量</div>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black text-black leading-none tabular-nums">32.5</span>
            <span className="text-sm text-gray-300">km</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-8 mb-6">
          <div>
            <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">爬升</div>
            <div className="text-2xl font-black text-black tabular-nums">1,240<span className="text-xs text-gray-300 ml-0.5">m</span></div>
          </div>
          <div>
            <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">训练</div>
            <div className="text-2xl font-black text-black tabular-nums">4<span className="text-xs text-gray-300 ml-0.5">次</span></div>
          </div>
        </div>

        {/* Red divider */}
        <div className="h-px bg-red-500 mb-5" />

        {/* 7-day bars */}
        <div className="mb-6">
          <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-3">近 7 天</div>
          <div className="flex items-end justify-between h-24 gap-2">
            {[8, 0, 12, 6, 0, 15, 0].map((km, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                {km > 0 && <span className="text-[9px] font-bold text-black">{km}</span>}
                <div className="w-full rounded-none" style={{ height: `${Math.max(km * 4, 1)}px`, background: km > 0 ? 'black' : '#f0f0f0' }} />
                <span className="text-[9px] text-gray-300 font-medium">{['一','二','三','四','五','六','日'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="mb-6">
          <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-3">身体状态</div>
          <div className="space-y-3">
            {[
              { label: '静息心率', value: '48', unit: 'bpm' },
              { label: 'HRV', value: '62', unit: 'ms' },
              { label: '疲劳度', value: '18', unit: '%' },
              { label: '睡眠', value: '7h17m', unit: '' },
            ].map((item) => (
              <div key={item.label} className="flex items-baseline justify-between border-b border-gray-100 pb-2">
                <span className="text-xs text-gray-400">{item.label}</span>
                <span className="text-lg font-black text-black tabular-nums">
                  {item.value}{item.unit && <span className="text-[10px] text-gray-300 ml-0.5">{item.unit}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Race */}
        <div className="bg-black p-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] text-red-400 uppercase tracking-wider mb-1">目标赛事</div>
            <div className="text-sm font-bold text-white">莫干山越野 50K</div>
            <div className="text-[10px] text-white/40 mt-0.5">2026-09-20 · D+2800m</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white tabular-nums">102</div>
            <div className="text-[9px] text-white/40">天</div>
          </div>
        </div>
      </div>
      <TabBar active="概览" />
    </div>
  );
}
