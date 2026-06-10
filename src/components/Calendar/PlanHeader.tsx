import type { RacePlan } from '@/types/coach';

interface Props {
  plan: RacePlan | null;
}

export default function PlanHeader({ plan }: Props) {
  if (!plan) return null;

  return (
    <div className="mx-5 mt-3 p-4 bg-invert">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] text-accent uppercase tracking-wider mb-1">目标赛事</div>
          <span className="text-sm font-bold text-invert-text">{plan.race_name}</span>
          <span className="ml-2 text-[10px] text-invert-text/40">
            {plan.race_type === 'trail' ? '越野' : '公路'}
          </span>
        </div>
        <span className="text-[10px] text-invert-text/40">
          {plan.status === 'active' ? '进行中' : plan.status}
        </span>
      </div>
      <div className="mt-1 text-[10px] text-invert-text/40">
        {plan.race_date} · {plan.total_weeks}周计划
        {plan.current_phase && ` · ${plan.current_phase}`}
      </div>
    </div>
  );
}
