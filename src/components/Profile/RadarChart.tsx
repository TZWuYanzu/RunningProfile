import type { AthleteProfile } from '@/types/coach';

interface Props {
  profile: AthleteProfile;
}

const DIMENSIONS = [
  { key: 'aerobic_base_score', label: '有氧基础' },
  { key: 'climbing_ability_score', label: '爬升能力' },
  { key: 'descent_ability_score', label: '下坡能力' },
  { key: 'trail_efficiency_score', label: '越野效率' },
  { key: 'endurance_score', label: '耐力' },
  { key: 'load_risk_score', label: '负荷风险' },
] as const;

const CX = 100;
const CY = 100;
const R = 70;
const LEVELS = [0.25, 0.5, 0.75, 1.0];

function polarToXY(angle: number, radius: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)];
}

function getPoints(scores: number[], radius: number): string {
  return scores
    .map((s, i) => {
      const angle = (360 / scores.length) * i;
      const r = (s / 100) * radius;
      const [x, y] = polarToXY(angle, r);
      return `${x},${y}`;
    })
    .join(' ');
}

function estimateItraPI(profile: AthleteProfile): number | null {
  const scores = DIMENSIONS.map(
    (d) => (profile[d.key] as number | null) ?? 0
  );
  if (scores.every((s) => s === 0)) return null;
  const weighted =
    scores[0] * 0.3 + scores[4] * 0.25 + scores[1] * 0.2 +
    scores[3] * 0.15 + scores[2] * 0.1;
  return Math.round(weighted * 6);
}

export default function RadarChart({ profile }: Props) {
  const scores = DIMENSIONS.map(
    (d) => (profile[d.key] as number | null) ?? 0
  );
  const allZero = scores.every((s) => s === 0);
  const itraPI = estimateItraPI(profile);

  return (
    <div className="mx-5 mt-5">
      <div className="h-px bg-accent mb-5" />
      <div className="text-[9px] text-tertiary uppercase tracking-wider mb-3">能力画像</div>

      {allZero ? (
        <div className="text-center py-6 text-sm text-tertiary">
          暂无评估数据，和教练对话触发评估
        </div>
      ) : (
        <>
          <svg viewBox="0 0 200 200" className="w-full max-w-[280px] mx-auto">
            {LEVELS.map((level) => (
              <polygon
                key={level}
                points={Array.from({ length: 6 }, (_, i) => {
                  const angle = (360 / 6) * i;
                  const [x, y] = polarToXY(angle, R * level);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="var(--color-border-subtle)"
                strokeWidth="0.5"
              />
            ))}

            {DIMENSIONS.map((_, i) => {
              const angle = (360 / 6) * i;
              const [x, y] = polarToXY(angle, R);
              return (
                <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--color-border-subtle)" strokeWidth="0.5" />
              );
            })}

            <polygon
              points={getPoints(scores, R)}
              fill="rgba(239, 68, 68, 0.15)"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
            />

            {DIMENSIONS.map((d, i) => {
              const angle = (360 / 6) * i;
              const [x, y] = polarToXY(angle, R + 16);
              return (
                <text
                  key={d.key}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[8px]"
                  fill="var(--color-text-secondary)"
                >
                  {d.label}
                </text>
              );
            })}

            {scores.map((s, i) => {
              if (s === 0) return null;
              const angle = (360 / 6) * i;
              const [x, y] = polarToXY(angle, (s / 100) * R);
              return (
                <circle key={i} cx={x} cy={y} r="2.5" fill="var(--color-text-primary)" />
              );
            })}
          </svg>

          <div className="text-center mt-2 space-y-0.5">
            {itraPI && (
              <div className="text-sm text-secondary">
                ITRA PI (估算): <span className="font-black text-primary">{itraPI}</span>
              </div>
            )}
            {profile.updated_at && (
              <div className="text-[10px] text-muted">
                评估时间: {profile.updated_at.slice(0, 10)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
