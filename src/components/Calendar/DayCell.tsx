import type { DayPlan } from '@/types/coach';

interface Props {
  day: number;
  plan?: DayPlan;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export default function DayCell({ day, plan, isToday, isSelected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={!plan}
      className={`h-16 text-center flex flex-col items-center justify-center gap-0.5 ${
        plan ? 'cursor-pointer' : ''
      } ${isToday && !isSelected ? 'bg-invert rounded-lg' : ''} ${
        isSelected ? 'border-b-2 border-accent' : ''
      }`}
    >
      <span className={`text-base font-bold ${
        isToday && !isSelected ? 'text-invert-text' : isSelected ? 'text-accent' : plan ? 'text-primary' : 'text-muted'
      }`}>
        {day}
      </span>
      {plan && (
        <span className={`text-[8px] uppercase tracking-wider truncate max-w-full ${
          isToday && !isSelected ? 'text-invert-text/60' : isSelected ? 'text-accent/60' : 'text-tertiary'
        }`}>
          {plan.title?.slice(0, 4) || plan.type}
        </span>
      )}
    </button>
  );
}
