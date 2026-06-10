import type { DayDetail } from '@/types/coach';

interface Props {
  detail: DayDetail | null;
  loading: boolean;
}

export default function InlineDetail({ detail, loading }: Props) {
  if (loading) {
    return <div className="px-5 py-8 text-center text-sm text-tertiary">加载中...</div>;
  }

  if (!detail) return null;

  const { plan } = detail;
  const dayNum = detail.date.split('-')[2]?.replace(/^0/, '');

  return (
    <div className="px-5 py-4 flex-1 overflow-y-auto">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-4xl font-black text-primary leading-none">{dayNum}</span>
        <span className="text-xs text-tertiary">{detail.date}</span>
      </div>

      <div className="h-px bg-accent mb-4" />

      {!plan ? (
        <p className="text-sm text-secondary">当天无训练安排</p>
      ) : (
        <div className="space-y-4">
          <div>
            <span className="text-base font-bold text-primary">{plan.title}</span>
            {plan.intensity && (
              <span className="ml-2 text-[10px] text-tertiary uppercase tracking-wider">
                {plan.intensity}
              </span>
            )}
          </div>

          {plan.description && (
            <p className="text-xs text-secondary leading-relaxed whitespace-pre-wrap">{plan.description}</p>
          )}

          <div className="flex gap-6">
            {plan.target_distance_km && (
              <div>
                <div className="text-[9px] text-tertiary uppercase tracking-wider">距离</div>
                <div className="text-lg font-black text-primary">{plan.target_distance_km}<span className="text-[10px] text-muted ml-0.5">km</span></div>
              </div>
            )}
            {plan.target_duration_min && (
              <div>
                <div className="text-[9px] text-tertiary uppercase tracking-wider">时长</div>
                <div className="text-lg font-black text-primary">{plan.target_duration_min}<span className="text-[10px] text-muted ml-0.5">min</span></div>
              </div>
            )}
            {plan.target_elevation_m && (
              <div>
                <div className="text-[9px] text-tertiary uppercase tracking-wider">爬升</div>
                <div className="text-lg font-black text-primary">{plan.target_elevation_m}<span className="text-[10px] text-muted ml-0.5">m</span></div>
              </div>
            )}
            {plan.target_pace && (
              <div>
                <div className="text-[9px] text-tertiary uppercase tracking-wider">配速</div>
                <div className="text-lg font-black text-primary">{plan.target_pace}</div>
              </div>
            )}
            {plan.target_hr_zone && (
              <div>
                <div className="text-[9px] text-tertiary uppercase tracking-wider">心率</div>
                <div className="text-lg font-black text-primary">{plan.target_hr_zone}</div>
              </div>
            )}
          </div>

          {plan.status && (
            <div className="text-[10px] text-muted uppercase tracking-wider">
              {plan.status === 'pending' ? '待完成' : plan.status}
              {plan.completion_pct != null && ` · ${plan.completion_pct}%`}
            </div>
          )}

          {plan.coach_feedback && (
            <div className="bg-surface p-4 text-sm text-secondary leading-relaxed">
              {plan.coach_feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
