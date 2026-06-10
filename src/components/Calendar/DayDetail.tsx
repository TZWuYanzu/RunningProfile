import type { DayDetail as DayDetailType } from '@/types/coach';

interface Props {
  detail: DayDetailType;
  onClose: () => void;
}

export default function DayDetail({ detail, onClose }: Props) {
  const { plan } = detail;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-app p-5 max-h-[75vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-primary leading-none">
              {detail.date.split('-')[2]?.replace(/^0/, '')}
            </span>
            <span className="text-xs text-tertiary">{detail.date}</span>
          </div>
          <button onClick={onClose} className="text-tertiary text-lg">✕</button>
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
    </div>
  );
}
