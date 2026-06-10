import { useNavigate } from 'react-router-dom';
import type { RacePlan } from '@/types/coach';

interface Props {
  plans: RacePlan[];
}

export default function RaceCard({ plans }: Props) {
  const navigate = useNavigate();
  const plan = plans[0];

  if (!plan) {
    return (
      <div className="mx-5 mt-5">
        <div className="text-[9px] text-tertiary uppercase tracking-wider mb-3">目标赛事</div>
        <div className="text-center py-4">
          <p className="text-sm text-secondary">还没有目标赛事</p>
          <button
            onClick={() => navigate('/coach')}
            className="mt-2 text-sm text-accent font-bold"
          >
            和教练聊聊你的下一场比赛 →
          </button>
        </div>
      </div>
    );
  }

  const raceDate = new Date(plan.race_date);
  const daysLeft = Math.ceil((raceDate.getTime() - Date.now()) / 86400000);

  return (
    <div className="mx-5 mt-5">
      <div className="bg-invert p-4 flex items-center justify-between">
        <div>
          <div className="text-[9px] text-accent uppercase tracking-wider mb-1">目标赛事</div>
          <div className="text-sm font-bold text-invert-text">{plan.race_name}</div>
          <div className="text-[10px] text-invert-text/40 mt-0.5">
            {plan.race_type === 'trail' ? '越野' : '公路'} · {plan.race_date}
            {plan.total_weeks > 0 && ` · ${plan.total_weeks}周`}
            {plan.current_phase && ` · ${plan.current_phase}`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-invert-text tabular-nums">{daysLeft}</div>
          <div className="text-[9px] text-invert-text/40">天</div>
        </div>
      </div>
    </div>
  );
}
