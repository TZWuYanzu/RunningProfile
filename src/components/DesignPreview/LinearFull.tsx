import { TABS, type StyleDemoProps } from './types';

function TabBar({ active }: { active: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white h-12 flex justify-around items-center">
      {TABS.map((tab) => (
        <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.label === active ? 'text-gray-900' : 'text-gray-300'}`}>
          <span className="text-base">{tab.icon}</span>
          <span className="text-[10px]">{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LinearChat(_: StyleDemoProps) {
  const messages = [
    { role: 'assistant', text: '早上好！昨天的越野跑数据已同步，爬升 620m，配速控制得不错。今天建议做一组轻松恢复跑。' },
    { role: 'user', text: '腿有点酸，可以改成休息日吗？' },
    { role: 'assistant', text: '完全可以。连续两天爬升训练后休息是合理的。建议做 15 分钟泡沫轴放松，明天再安排轻松跑。' },
    { role: 'user', text: '好的，明天跑哪条路线？' },
    { role: 'assistant', text: '推荐千岛湖环湖绿道东段，平路为主，10km 左右，心率控制在 Z2 区间。天气预报明天多云 22°C，适合恢复跑。' },
  ];

  return (
    <div className="bg-white min-h-full flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-900 tracking-tight">教练</span>
      </div>
      <div className="flex-1 overflow-y-auto pb-24 px-5 pt-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] text-sm leading-relaxed px-3 py-2.5 ${
              m.role === 'user'
                ? 'bg-gray-900 text-white rounded-2xl rounded-br-md'
                : 'border border-gray-200 text-gray-800 rounded-2xl rounded-bl-md'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      {/* Input */}
      <div className="absolute bottom-12 left-0 right-0 px-4 py-2 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-9 rounded-full border border-gray-200 px-4 flex items-center text-sm text-gray-300">输入消息...</div>
          <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm">↑</div>
        </div>
      </div>
      <TabBar active="教练" />
    </div>
  );
}

export function LinearCalendar(_: StyleDemoProps) {
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
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 tracking-tight">计划</span>
        <span className="text-xs text-gray-400">2026 年 6 月</span>
      </div>
      <div className="flex-1 overflow-y-auto pb-14 px-5">
        {/* Week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((d) => (
            <div key={d} className="text-center text-[10px] text-gray-300 py-1">{d}</div>
          ))}
        </div>
        {/* Week row */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {days.map((day) => (
            <div key={day.d} className={`text-center py-2 rounded-lg ${day.today ? 'ring-1 ring-gray-900' : ''}`}>
              <div className={`text-sm font-medium ${day.today ? 'text-gray-900' : 'text-gray-600'}`}>{day.d}</div>
              <div className={`text-[9px] mt-0.5 ${day.done ? 'text-gray-400 line-through' : 'text-gray-300'}`}>{day.type}</div>
            </div>
          ))}
        </div>

        {/* Today detail */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-400 mb-3">6月10日 · 今天</div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900 mb-1">休息日</div>
            <div className="text-xs text-gray-500 leading-relaxed">
              昨日越野跑后恢复。建议做 15 分钟泡沫轴放松 + 拉伸。关注腿部肌肉恢复状态。
            </div>
            <div className="mt-3 flex gap-4">
              <div className="text-center">
                <div className="text-[10px] text-gray-300">目标配速</div>
                <div className="text-sm font-medium text-gray-900">—</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-300">距离</div>
                <div className="text-sm font-medium text-gray-900">—</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-300">心率区间</div>
                <div className="text-sm font-medium text-gray-900">—</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tomorrow */}
        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-3">6月11日 · 明天</div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900 mb-1">恢复跑</div>
            <div className="text-xs text-gray-500 leading-relaxed">
              千岛湖环湖绿道东段，平路为主，心率保持 Z2。
            </div>
            <div className="mt-3 flex gap-4">
              <div className="text-center">
                <div className="text-[10px] text-gray-300">目标配速</div>
                <div className="text-sm font-medium text-gray-900">6:30</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-300">距离</div>
                <div className="text-sm font-medium text-gray-900">10km</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-300">心率区间</div>
                <div className="text-sm font-medium text-gray-900">Z2</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TabBar active="计划" />
    </div>
  );
}

export function LinearOverview(_: StyleDemoProps) {
  return (
    <div className="bg-white min-h-full flex flex-col">
      <div className="px-5 pt-5 pb-3">
        <span className="text-sm font-medium text-gray-900 tracking-tight">概览</span>
      </div>
      <div className="flex-1 overflow-y-auto pb-14 px-5">
        {/* Weekly summary */}
        <div className="mt-2 border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-3">本周训练</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-semibold text-gray-900 tabular-nums">32.5</div>
              <div className="text-[10px] text-gray-400 mt-0.5">公里</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900 tabular-nums">1,240</div>
              <div className="text-[10px] text-gray-400 mt-0.5">爬升 m</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900 tabular-nums">4</div>
              <div className="text-[10px] text-gray-400 mt-0.5">次训练</div>
            </div>
          </div>
        </div>

        {/* 7-day bar chart */}
        <div className="mt-4 border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-3">近 7 天跑量</div>
          <div className="flex items-end justify-between h-20 gap-1">
            {[8, 0, 12, 6, 0, 15, 0].map((km, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gray-100 rounded-sm" style={{ height: `${Math.max(km * 4, 2)}px` }}>
                  {km > 0 && <div className="w-full h-full bg-gray-900 rounded-sm" />}
                </div>
                <span className="text-[9px] text-gray-300">{['一','二','三','四','五','六','日'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body status */}
        <div className="mt-4 border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-3">身体状态</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">静息心率</span>
              <span className="text-sm font-medium text-gray-900 tabular-nums">48 bpm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">HRV</span>
              <span className="text-sm font-medium text-gray-900 tabular-nums">62 ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">疲劳度</span>
              <span className="text-sm font-medium text-gray-900 tabular-nums">18%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">睡眠</span>
              <span className="text-sm font-medium text-gray-900 tabular-nums">7h17m</span>
            </div>
          </div>
        </div>

        {/* Race countdown */}
        <div className="mt-4 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">目标赛事</div>
            <div className="text-sm font-medium text-gray-900">莫干山越野 50K</div>
            <div className="text-[10px] text-gray-400 mt-0.5">2026-09-20 · D+2800m</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-gray-900 tabular-nums">102</div>
            <div className="text-[10px] text-gray-400">天</div>
          </div>
        </div>
      </div>
      <TabBar active="概览" />
    </div>
  );
}
