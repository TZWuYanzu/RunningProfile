import type { DayPlan } from '@/types/coach';
import DayCell from './DayCell';

export interface DaySlot {
  day: number;
  dateStr: string;
  plan?: DayPlan;
}

interface Props {
  days: Array<DaySlot | null>;
  todayDate: number | null;
  selectedDate: string | null;
  onDayClick: (dateStr: string) => void;
}

export default function WeekRow({ days, todayDate, selectedDate, onDayClick }: Props) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((slot, i) =>
        slot ? (
          <DayCell
            key={slot.dateStr}
            day={slot.day}
            plan={slot.plan}
            isToday={slot.day === todayDate}
            isSelected={slot.dateStr === selectedDate}
            onClick={() => onDayClick(slot.dateStr)}
          />
        ) : (
          <div key={`empty-${i}`} />
        )
      )}
    </div>
  );
}
