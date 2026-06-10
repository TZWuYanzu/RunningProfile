import type { DayPlan } from '@/types/coach';
import DayCell from './DayCell';

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

interface Props {
  year: number;
  month: number;
  plans: DayPlan[];
  onDayClick: (date: string) => void;
}

export default function MonthGrid({ year, month, plans, onDayClick }: Props) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();

  const planMap = new Map<string, DayPlan>();
  for (const p of plans) {
    planMap.set(p.date, p);
  }

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const plan = planMap.get(dateStr);
    cells.push(
      <DayCell
        key={day}
        day={day}
        plan={plan}
        isToday={isCurrentMonth && day === todayDate}
        onClick={() => onDayClick(dateStr)}
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 px-5 mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-muted py-1 font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 px-5">{cells}</div>
    </div>
  );
}
