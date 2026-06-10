import type { DailyHealthRecord } from '@/types/coach';
import StyleLinear from '@/components/DesignPreview/StyleLinear';
import StyleGlass from '@/components/DesignPreview/StyleGlass';
import StyleToss from '@/components/DesignPreview/StyleToss';
import StyleDarkPro from '@/components/DesignPreview/StyleDarkPro';
import StyleMonocraft from '@/components/DesignPreview/StyleMonocraft';
import StyleSwiss from '@/components/DesignPreview/StyleSwiss';
import StyleMidnight from '@/components/DesignPreview/StyleMidnight';
import StyleNord from '@/components/DesignPreview/StyleNord';
import { LinearChat, LinearCalendar, LinearOverview } from '@/components/DesignPreview/LinearFull';
import { SwissChat, SwissCalendar, SwissOverview } from '@/components/DesignPreview/SwissFull';

const MOCK_HEALTH: DailyHealthRecord = {
  date: '2026-06-10',
  resting_heart_rate: 48,
  hrv_rmssd: 62,
  hrv_baseline: 86,
  fatigue_rate: 18,
  training_load: 823,
  sleep_score: null,
  sleep_duration_min: 437,
  deep_sleep_min: 98,
  light_sleep_min: 215,
  rem_sleep_min: 124,
};

const NICKNAME = '糯金';

function PhoneFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="text-center mb-3">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="w-[375px] mx-auto rounded-[2.5rem] overflow-hidden shadow-xl border-[6px] border-gray-800 bg-gray-800">
        <div className="w-full h-[580px] overflow-hidden relative rounded-[2rem]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DesignPreviewPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-lg font-bold text-gray-800">设计风格对比</h1>
        <p className="text-sm text-gray-500 mt-1">选择一个方向，后续全部页面按此风格统一</p>
      </div>

      <PhoneFrame title="1. Linear / Notion 极简" subtitle="黑白灰 · 细边框 · 大留白">
        <StyleLinear nickname={NICKNAME} record={MOCK_HEALTH} />
      </PhoneFrame>

      <PhoneFrame title="2. Glassmorphism 运动风" subtitle="深色渐变 · 毛玻璃 · 科技感">
        <StyleGlass nickname={NICKNAME} record={MOCK_HEALTH} />
      </PhoneFrame>

      <PhoneFrame title="3. Toss / 韩系清新" subtitle="暖白底 · 柔和阴影 · 大圆角">
        <StyleToss nickname={NICKNAME} record={MOCK_HEALTH} />
      </PhoneFrame>

      <PhoneFrame title="4. Dark Pro 专业数据" subtitle="纯黑底 · 霓虹数据 · 等宽字体">
        <StyleDarkPro nickname={NICKNAME} record={MOCK_HEALTH} />
      </PhoneFrame>

      <div className="text-center my-10">
        <div className="inline-block px-4 py-1 bg-gray-200 rounded-full text-xs text-gray-500">前卫 · 潮流 · 简约</div>
      </div>

      <PhoneFrame title="5. Monocraft 机能风" subtitle="深灰底 · 单色荧光橙 · 竖排大数字 · 工业感">
        <StyleMonocraft nickname={NICKNAME} record={MOCK_HEALTH} />
      </PhoneFrame>

      <PhoneFrame title="6. Swiss 瑞士排版" subtitle="白底 · 超大黑字 · 红色强调 · 排版即设计">
        <StyleSwiss nickname={NICKNAME} record={MOCK_HEALTH} />
      </PhoneFrame>

      <PhoneFrame title="7. Midnight 暗夜渐变" subtitle="深蓝黑底 · 紫→青渐变 · 光晕氛围 · 高级感">
        <StyleMidnight nickname={NICKNAME} record={MOCK_HEALTH} />
      </PhoneFrame>

      <PhoneFrame title="8. Nord 北欧极简" subtitle="深灰蓝底 · 冰蓝强调 · 无边框 · 大间距">
        <StyleNord nickname={NICKNAME} record={MOCK_HEALTH} />
      </PhoneFrame>

      {/* ── Full Interface Demos ── */}
      <div className="text-center my-12">
        <div className="inline-block px-6 py-2 bg-gray-800 rounded-full text-sm text-white font-medium">
          完整交互界面 Demo
        </div>
      </div>

      {/* Linear Full */}
      <div className="text-center mb-6">
        <h2 className="text-base font-bold text-gray-800">方案 1 · Linear 极简 — 全页面</h2>
      </div>
      <div className="flex flex-wrap justify-center gap-6 mb-16">
        <PhoneFrame title="Profile 我的" subtitle="个人档案 + 健康数据">
          <StyleLinear nickname={NICKNAME} record={MOCK_HEALTH} />
        </PhoneFrame>
        <PhoneFrame title="Coach 教练" subtitle="AI 对话">
          <LinearChat nickname={NICKNAME} record={MOCK_HEALTH} />
        </PhoneFrame>
        <PhoneFrame title="Calendar 计划" subtitle="训练日历">
          <LinearCalendar nickname={NICKNAME} record={MOCK_HEALTH} />
        </PhoneFrame>
        <PhoneFrame title="Overview 概览" subtitle="数据 Dashboard">
          <LinearOverview nickname={NICKNAME} record={MOCK_HEALTH} />
        </PhoneFrame>
      </div>

      {/* Swiss Full */}
      <div className="text-center mb-6">
        <h2 className="text-base font-bold text-gray-800">方案 6 · Swiss 瑞士排版 — 全页面</h2>
      </div>
      <div className="flex flex-wrap justify-center gap-6 mb-16">
        <PhoneFrame title="Profile 我的" subtitle="个人档案 + 健康数据">
          <StyleSwiss nickname={NICKNAME} record={MOCK_HEALTH} />
        </PhoneFrame>
        <PhoneFrame title="Coach 教练" subtitle="AI 对话">
          <SwissChat nickname={NICKNAME} record={MOCK_HEALTH} />
        </PhoneFrame>
        <PhoneFrame title="Calendar 计划" subtitle="训练日历">
          <SwissCalendar nickname={NICKNAME} record={MOCK_HEALTH} />
        </PhoneFrame>
        <PhoneFrame title="Overview 概览" subtitle="数据 Dashboard">
          <SwissOverview nickname={NICKNAME} record={MOCK_HEALTH} />
        </PhoneFrame>
      </div>
    </div>
  );
}
