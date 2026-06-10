import { useState, useEffect } from 'react';
import { getMonth, getPlans, getDayDetail } from '@/api/calendar';
import type { DayPlan, RacePlan, DayDetail as DayDetailType } from '@/types/coach';
import PlanHeader from './PlanHeader';
import MonthGrid from './MonthGrid';
import DayDetail from './DayDetail';

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function Calendar() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [activePlan, setActivePlan] = useState<RacePlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  const [year, mo] = month.split('-').map(Number);

  useEffect(() => {
    getPlans()
      .then((res) => setActivePlan(res.plans[0] || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getMonth(month)
      .then((res) => setPlans(res.plans))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, [month]);

  const handlePrev = () => {
    const d = new Date(year, mo - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNext = () => {
    const d = new Date(year, mo, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleDayClick = async (date: string) => {
    try {
      const detail = await getDayDetail(date);
      if (detail.plan) setSelectedDay(detail);
    } catch {}
  };

  return (
    <div className="h-full overflow-y-auto">
      <PlanHeader plan={activePlan} />

      <div className="flex items-center justify-between px-5 py-3">
        <button onClick={handlePrev} className="text-tertiary px-2 py-1">◀</button>
        <span className="text-sm font-bold text-primary">
          {year}年{mo}月
        </span>
        <button onClick={handleNext} className="text-tertiary px-2 py-1">▶</button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-tertiary">加载中...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-8 px-6">
          <p className="text-sm text-secondary">本月暂无训练计划</p>
          <p className="text-xs text-tertiary mt-1">和教练聊聊你的目标赛事，生成专属训练计划</p>
        </div>
      ) : (
        <MonthGrid year={year} month={mo} plans={plans} onDayClick={handleDayClick} />
      )}

      {selectedDay && (
        <DayDetail detail={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}
