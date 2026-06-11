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

/* ════════════════════════════════════════════════════════
   1. Activity History — 运动历史列表
   ════════════════════════════════════════════════════════ */

export function ActivityHistory(_: StyleDemoProps) {
  const timeTabs = ['周', '月', '年', '总'];
  const weekData = [
    { day: '一', km: 0 },
    { day: '二', km: 12.5 },
    { day: '三', km: 0 },
    { day: '四', km: 8.2 },
    { day: '五', km: 0 },
    { day: '六', km: 22.7 },
    { day: '日', km: 15.3 },
  ];
  const maxKm = Math.max(...weekData.map(d => d.km));

  const activities = [
    { type: '越野跑', icon: '🏔', date: '6月10日', title: '千岛湖越野 25K', distance: '25.3', unit: 'km', highlight: 'D+ 1,420m', time: '2:58:12' },
    { type: '路跑', icon: '🏃', date: '6月8日', title: '晨间恢复跑', distance: '10.0', unit: 'km', highlight: "5'12\"/km", time: '52:03' },
  ];

  return (
    <div className="bg-white min-h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-red-500 rounded-full" />
          <span className="text-sm font-bold text-black tracking-tight">历史</span>
        </div>
        <div className="flex gap-1">
          {timeTabs.map(t => (
            <span key={t} className={`text-[10px] px-2 py-0.5 ${
              t === '周' ? 'bg-black text-white' : 'text-gray-400'
            }`}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-14">
        {/* Trajectory Map Area */}
        <div className="mx-5 border-b border-gray-100" style={{ height: 110 }}>
          <svg viewBox="0 0 335 110" className="w-full h-full">
            {/* Grid dots */}
            {Array.from({ length: 7 }).map((_, i) =>
              Array.from({ length: 3 }).map((_, j) => (
                <circle key={`${i}-${j}`} cx={30 + i * 48} cy={20 + j * 30} r="0.6" fill="#d1d3d7" />
              ))
            )}
            {/* Trail paths */}
            <path d="M30,75 Q80,25 140,60 T250,35 T320,65" stroke="black" strokeWidth="1.5" fill="none" />
            <path d="M50,85 Q100,45 170,70 T280,50" stroke="black" strokeWidth="1" fill="none" opacity="0.15" />
            <path d="M20,55 Q90,90 180,45 T300,80" stroke="black" strokeWidth="0.8" fill="none" opacity="0.08" />
          </svg>
        </div>

        {/* Summary Stats */}
        <div className="mx-5 mt-4 grid grid-cols-3 gap-x-6">
          {[
            { label: '总里程', value: '2,225', unit: 'km' },
            { label: '总爬升', value: '63,630', unit: 'm' },
            { label: '总次数', value: '190', unit: '次' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-[9px] text-gray-400 uppercase tracking-wider">{s.label}</div>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-xl font-black text-black tabular-nums leading-none">{s.value}</span>
                <span className="text-[9px] text-gray-300">{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Red divider */}
        <div className="mx-5 mt-4 h-px bg-red-500" />

        {/* Weekly Bar Chart */}
        <div className="mx-5 mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider">本周跑量</span>
            <span className="text-lg font-black text-black tabular-nums leading-none">58.7<span className="text-[9px] text-gray-300 ml-0.5">km</span></span>
          </div>
          <div className="flex items-end gap-2 h-14 mt-2">
            {weekData.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div style={{
                  width: '100%',
                  height: d.km > 0 ? `${Math.max((d.km / maxKm) * 40, 3)}px` : '1px',
                  background: d.km > 0 ? '#000' : '#e5e5e5',
                }} />
                <span className="text-[8px] text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coach Insight — inverted block */}
        <div className="mx-5 mt-5 bg-black text-white p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1 h-3 bg-red-500 rounded-full" />
            <span className="text-[9px] text-red-400 uppercase tracking-wider">教练洞察</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            本周训练负荷 823 TRIMP，高于上周 12%。周六越野 25K 爬升较大，建议明天安排完全休息，下周初以 Z2 恢复跑过渡。
          </p>
        </div>

        {/* Recent Activities */}
        <div className="mx-5 mt-5 mb-4">
          <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-3">最近运动</div>
          <div className="space-y-0">
            {activities.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100">
                <div className="text-lg">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-black">{a.title}</span>
                  <div className="text-[10px] text-gray-400 mt-0.5">{a.date} · {a.time}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-baseline gap-0.5 justify-end">
                    <span className="text-lg font-black text-black tabular-nums leading-none">{a.distance}</span>
                    <span className="text-[9px] text-gray-300">{a.unit}</span>
                  </div>
                  <div className="text-[10px] text-black font-medium tabular-nums mt-0.5">{a.highlight}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TabBar active="历史" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   2. Activity Detail — 单次运动详情（越野跑）
   ════════════════════════════════════════════════════════ */

export function ActivityDetail(_: StyleDemoProps) {
  const segments = [
    { label: '0–10km', pace: "8'12\"", hr: '148', elev: '+680m' },
    { label: '10–20km', pace: "7'35\"", hr: '155', elev: '+520m' },
    { label: '20–30km', pace: "6'46\"", hr: '158', elev: '−440m' },
    { label: '30–48km', pace: "5'50\"", hr: '162', elev: '−680m' },
  ];

  return (
    <div className="bg-white min-h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Terrain Map */}
        <div className="bg-gray-50" style={{ height: 150 }}>
          <svg viewBox="0 0 375 150" className="w-full h-full">
            {/* Mountain silhouette */}
            <path d="M0,130 L40,85 L70,100 L110,45 L150,70 L190,30 L220,55 L260,25 L290,60 L330,50 L360,75 L375,85 L375,150 L0,150Z"
              fill="#f3f4f6" />
            <path d="M0,130 L40,85 L70,100 L110,45 L150,70 L190,30 L220,55 L260,25 L290,60 L330,50 L360,75 L375,85"
              stroke="#000" strokeWidth="0.5" fill="none" />
            {/* Route trail */}
            <path d="M30,115 Q80,70 130,85 Q180,45 230,50 Q280,38 345,65"
              stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Km markers */}
            {[{ x: 95, y: 72 }, { x: 175, y: 50 }, { x: 265, y: 42 }].map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="7" fill="#000" />
                <text x={p.x} y={p.y + 3} textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">
                  {(i + 1) * 10}
                </text>
              </g>
            ))}
            {/* Finish */}
            <circle cx="345" cy="65" r="4" fill="#ef4444" />
          </svg>
          {/* Back button */}
          <div className="absolute top-4 left-4">
            <span className="text-sm text-black font-bold">←</span>
          </div>
        </div>

        {/* Title */}
        <div className="px-5 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-black">黄山 100 越野跑</span>
            <span className="text-[8px] px-1.5 py-0.5 bg-black text-white font-bold">PB</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-1">2026年6月8日 07:03 · via COROS PACE 3</div>
        </div>

        {/* Red divider */}
        <div className="mx-5 mt-3 h-px bg-red-500" />

        {/* Core Data — extreme contrast */}
        <div className="mx-5 mt-4 grid grid-cols-2 gap-x-8">
          <div>
            <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">距离</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-black tabular-nums leading-none">48.3</span>
              <span className="text-xs text-gray-300">km</span>
            </div>
          </div>
          <div>
            <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">总用时</div>
            <div className="text-4xl font-black text-black tabular-nums leading-none">5:26</div>
            <div className="text-[10px] text-gray-400 tabular-nums">:55</div>
          </div>
        </div>

        {/* Metric Grid */}
        <div className="mx-5 mt-5 grid grid-cols-4 gap-x-4">
          {[
            { label: 'D+', value: '2,840', unit: 'm' },
            { label: 'D−', value: '2,920', unit: 'm' },
            { label: '配速', value: "6'46\"", unit: '' },
            { label: '心率', value: '155', unit: 'bpm' },
          ].map(m => (
            <div key={m.label}>
              <div className="text-[8px] text-gray-400 uppercase tracking-wider">{m.label}</div>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-lg font-black text-black tabular-nums leading-none">{m.value}</span>
                {m.unit && <span className="text-[8px] text-gray-300">{m.unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Elevation Profile */}
        <div className="mx-5 mt-5">
          <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">海拔剖面</div>
          <svg viewBox="0 0 310 50" className="w-full" style={{ height: 44 }}>
            <path d="M0,38 Q30,28 60,23 Q90,5 120,10 Q150,2 180,4 Q210,15 240,18 Q270,28 300,33 L310,35"
              stroke="#000" strokeWidth="1" fill="none" />
            <path d="M0,38 Q30,28 60,23 Q90,5 120,10 Q150,2 180,4 Q210,15 240,18 Q270,28 300,33 L310,35 L310,50 L0,50Z"
              fill="#f3f4f6" />
            <text x="0" y="48" fill="#9ca3af" fontSize="6">0</text>
            <text x="148" y="48" fill="#9ca3af" fontSize="6">24km</text>
            <text x="290" y="48" fill="#9ca3af" fontSize="6">48km</text>
            <text x="155" y="8" fill="#000" fontSize="6" fontWeight="bold">1,840m</text>
          </svg>
        </div>

        {/* Red divider */}
        <div className="mx-5 mt-4 h-px bg-red-500" />

        {/* Coach Comment — inverted block */}
        <div className="mx-5 mt-4 bg-black text-white p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1 h-3 bg-red-500 rounded-full" />
            <span className="text-[9px] text-red-400 uppercase tracking-wider">教练点评</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            配速策略优秀——前半段爬升保持心率在 Z3 以内，后半下坡段配速自然提升且未爆心率。D+ 2840m 表现预估 ITRA 分约 580，较上次提升 15 分。
          </p>
          <div className="mt-2">
            <span className="text-[9px] text-red-400">追问教练 →</span>
          </div>
        </div>

        {/* Segments */}
        <div className="mx-5 mt-4">
          <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">分段数据</div>
          {segments.map((s, i) => (
            <div key={i} className="flex items-baseline text-[10px] tabular-nums py-1.5 border-b border-gray-100">
              <span className="w-16 text-gray-400">{s.label}</span>
              <span className="w-14 font-black text-black">{s.pace}</span>
              <span className="w-16 text-black">{s.hr} bpm</span>
              <span className="flex-1 text-right font-medium text-black">{s.elev}</span>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="mx-5 mt-5 mb-4 flex gap-2">
          <button className="flex-1 py-2.5 bg-red-500 text-white text-[11px] font-bold">
            分享
          </button>
          <button className="flex-1 py-2.5 bg-white text-black text-[11px] font-bold border-2 border-black">
            导出
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   3. Share Cards — 分享卡片展示
   ════════════════════════════════════════════════════════ */

function TrailShareCard() {
  return (
    <div className="border-2 border-black overflow-hidden">
      {/* Terrain */}
      <div className="bg-gray-50" style={{ height: 100 }}>
        <svg viewBox="0 0 280 100" className="w-full h-full">
          <path d="M0,80 L30,50 L60,65 L100,25 L140,45 L180,15 L210,35 L250,12 L280,40 L280,100 L0,100Z"
            fill="#f3f4f6" />
          <path d="M0,80 L30,50 L60,65 L100,25 L140,45 L180,15 L210,35 L250,12 L280,40"
            stroke="#000" strokeWidth="0.5" fill="none" />
          <path d="M20,72 Q70,42 120,55 Q170,28 220,32 Q260,20 270,35"
            stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      <div className="p-4">
        <div className="text-base font-black text-black tracking-tight">黄山 100 越野跑</div>
        <div className="text-[9px] text-gray-400 mt-0.5">2026.06.08 · 黄山市</div>

        {/* Red divider */}
        <div className="h-px bg-red-500 mt-3 mb-3" />

        <div className="grid grid-cols-3 gap-x-4">
          <div>
            <div className="text-xl font-black text-black tabular-nums leading-none">48.3<span className="text-[8px] text-gray-300 ml-0.5 font-normal">km</span></div>
            <div className="text-[8px] text-gray-400 mt-0.5">距离</div>
          </div>
          <div>
            <div className="text-xl font-black text-black tabular-nums leading-none">+2,840<span className="text-[8px] text-gray-300 ml-0.5 font-normal">m</span></div>
            <div className="text-[8px] text-gray-400 mt-0.5">爬升</div>
          </div>
          <div>
            <div className="text-xl font-black text-black tabular-nums leading-none">5:26</div>
            <div className="text-[8px] text-gray-400 mt-0.5">用时</div>
          </div>
        </div>

        {/* ITRA — inverted badge */}
        <div className="mt-3 inline-block bg-black text-white px-2 py-1">
          <span className="text-[10px] font-black tabular-nums">ITRA 580</span>
          <span className="text-[8px] text-white/40 ml-1.5">预估表现分 · +15</span>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[8px] font-bold text-black tracking-widest uppercase">AI Coach</span>
          <span className="text-[8px] text-gray-400">每一步都有意义</span>
        </div>
      </div>
    </div>
  );
}

function RoadShareCard() {
  return (
    <div className="border-2 border-black overflow-hidden">
      {/* Route */}
      <div className="px-4 pt-3" style={{ height: 80 }}>
        <svg viewBox="0 0 260 65" className="w-full h-full">
          {/* Grid */}
          {Array.from({ length: 4 }).map((_, i) =>
            <line key={i} x1="0" y1={i * 20} x2="260" y2={i * 20} stroke="#f3f4f6" strokeWidth="0.8" />
          )}
          <path d="M30,40 Q50,12 90,25 Q120,35 140,18 Q160,5 190,22 Q210,35 240,30"
            stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="30" cy="40" r="3" fill="#000" />
          <circle cx="240" cy="30" r="3" fill="#ef4444" />
        </svg>
      </div>

      <div className="p-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-black">半程马拉松</span>
          <span className="text-[7px] px-1.5 py-0.5 bg-black text-white font-bold">PB</span>
        </div>
        <div className="text-[9px] text-gray-400 mt-0.5">2026.05.25 · 杭州</div>

        <div className="h-px bg-red-500 mt-3 mb-3" />

        <div className="grid grid-cols-3 gap-x-4">
          <div>
            <div className="text-xl font-black text-black tabular-nums leading-none">21.1<span className="text-[8px] text-gray-300 ml-0.5 font-normal">km</span></div>
            <div className="text-[8px] text-gray-400 mt-0.5">距离</div>
          </div>
          <div>
            <div className="text-xl font-black text-black tabular-nums leading-none">1:38:42</div>
            <div className="text-[8px] text-gray-400 mt-0.5">完赛</div>
          </div>
          <div>
            <div className="text-xl font-black text-black tabular-nums leading-none">4'40&quot;</div>
            <div className="text-[8px] text-gray-400 mt-0.5">配速</div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[8px] font-bold text-black tracking-widest uppercase">AI Coach</span>
          <span className="text-[8px] text-gray-400">每一步都有意义</span>
        </div>
      </div>
    </div>
  );
}

function WeeklyShareCard() {
  const bars = [0, 12.5, 0, 8.2, 0, 22.7, 15.3];
  const days = ['一', '二', '三', '四', '五', '六', '日'];
  const max = Math.max(...bars);

  return (
    <div className="border-2 border-black overflow-hidden p-4">
      <div className="text-base font-black text-black">训练周报</div>
      <div className="text-[9px] text-gray-400 mt-0.5">2026年6月第2周</div>

      <div className="h-px bg-red-500 mt-3 mb-3" />

      <div className="grid grid-cols-3 gap-x-4">
        <div>
          <div className="text-xl font-black text-black tabular-nums leading-none">58.7<span className="text-[8px] text-gray-300 ml-0.5 font-normal">km</span></div>
          <div className="text-[8px] text-gray-400 mt-0.5">周跑量</div>
        </div>
        <div>
          <div className="text-xl font-black text-black tabular-nums leading-none">+1,420<span className="text-[8px] text-gray-300 ml-0.5 font-normal">m</span></div>
          <div className="text-[8px] text-gray-400 mt-0.5">周爬升</div>
        </div>
        <div>
          <div className="text-xl font-black text-black tabular-nums leading-none">4<span className="text-[8px] text-gray-300 ml-0.5 font-normal">次</span></div>
          <div className="text-[8px] text-gray-400 mt-0.5">训练</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-12 mt-4">
        {bars.map((km, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div style={{
              width: '100%',
              height: km > 0 ? `${Math.max((km / max) * 32, 2)}px` : '1px',
              background: km > 0 ? '#000' : '#e5e5e5',
            }} />
            <span className="text-[7px] text-gray-400">{days[i]}</span>
          </div>
        ))}
      </div>

      {/* Coach quote — inverted block */}
      <div className="mt-4 bg-black text-white p-3">
        <p className="text-[9px] leading-relaxed text-white/60">
          "周六越野表现出色，训练负荷控制得当。下周进入减量周，建议总量降至 40km 以内。"
        </p>
        <div className="text-[8px] text-red-400 mt-1">— AI 教练</div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[8px] font-bold text-black tracking-widest uppercase">AI Coach</span>
        <span className="text-[8px] text-gray-400">每一步都有意义</span>
      </div>
    </div>
  );
}

export function ActivityShareCards(_: StyleDemoProps) {
  return (
    <div className="bg-white min-h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header */}
        <div className="px-5 pt-6 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-red-500 rounded-full" />
            <span className="text-sm font-bold text-black tracking-tight">分享卡片</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-1 ml-3.5">选择模板，自定义数据后导出</div>
        </div>

        {/* Card 1: Trail */}
        <div className="mx-5 mb-5">
          <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">越野数据卡</div>
          <TrailShareCard />
        </div>

        {/* Card 2: Road */}
        <div className="mx-5 mb-5">
          <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">路跑数据卡</div>
          <RoadShareCard />
        </div>

        {/* Card 3: Weekly */}
        <div className="mx-5 mb-5">
          <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">训练周报卡</div>
          <WeeklyShareCard />
        </div>
      </div>
    </div>
  );
}
