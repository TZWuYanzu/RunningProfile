import type { DayPlan } from '@/types/coach';
import WeekRow, { type DaySlot } from './WeekRow';

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

interface Props {
  year: number;
  month: number;
  plans: DayPlan[];
  selectedDate: string | null;
  onDayClick: (date: string) => void;
}

function buildWeeks(year: number, month: number, planMap: Map<string, DayPlan>): Array<Array<DaySlot | null>> {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const slots: Array<DaySlot | null> = [];
  for (let i = 0; i < startOffset; i++) slots.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    slots.push({ day, dateStr, plan: planMap.get(dateStr) });
  }
  while (slots.length % 7 !== 0) slots.push(null);

  const weeks: Array<Array<DaySlot | null>> = [];
  for (let i = 0; i < slots.length; i += 7) {
    weeks.push(slots.slice(i, i + 7));
  }
  return weeks;
}

function findWeekIndex(weeks: Array<Array<DaySlot | null>>, dateStr: string): number {
  return weeks.findIndex((week) => week.some((s) => s?.dateStr === dateStr));
}

export default function MonthGrid({ year, month, plans, selectedDate, onDayClick }: Props) {
  const planMap = new Map<string, DayPlan>();
  for (const p of plans) planMap.set(p.date, p);

  const weeks = buildWeeks(year, month, planMap);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = isCurrentMonth ? today.getDate() : null;

  const selectedWeekIdx = selectedDate ? findWeekIndex(weeks, selectedDate) : -1;

  return (
    <div className="px-5">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-muted py-1 font-medium">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, i) => {
        if (selectedDate != null && i !== selectedWeekIdx) return null;
        return (
          <WeekRow
            key={i}
            days={week}
            todayDate={todayDate}
            selectedDate={selectedDate}
            onDayClick={onDayClick}
          />
        );
      })}
    </div>
  );
}
