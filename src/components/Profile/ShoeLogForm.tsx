import { useState } from 'react';

const TERRAIN_OPTIONS = ['硬土', '碎石', '泥地', '岩石', '公路', '混合'];

interface Props {
  shoeName: string;
  onSubmit: (data: { terrain: string; grip: string; cushion: string; stability: string; overall: string }) => void;
  onClose: () => void;
}

function RatingRow({ label, options, value, onChange }: {
  label: string;
  options: [string, string, string];
  value: string;
  onChange: (v: string) => void;
}) {
  const selectedStyles = ['border-strong bg-surface text-primary font-bold', 'border-accent text-accent font-bold', 'bg-accent text-invert-text font-bold'];
  return (
    <div>
      <label className="text-[9px] text-tertiary uppercase tracking-wider mb-1 block">{label}</label>
      <div className="flex gap-2">
        {options.map((opt, i) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 py-1.5 text-sm border ${
              value === opt ? selectedStyles[i] : 'border-subtle text-secondary'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ShoeLogForm({ shoeName, onSubmit, onClose }: Props) {
  const [terrain, setTerrain] = useState('');
  const [grip, setGrip] = useState('');
  const [cushion, setCushion] = useState('');
  const [stability, setStability] = useState('');
  const [overall, setOverall] = useState('');

  const canSubmit = terrain && grip && cushion && stability && overall;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-lg bg-app p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-primary">鞋况评价 · {shoeName}</h3>
          <button onClick={onClose} className="text-tertiary text-lg">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[9px] text-tertiary uppercase tracking-wider mb-1 block">路况</label>
            <div className="flex flex-wrap gap-2">
              {TERRAIN_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTerrain(t)}
                  className={`px-3 py-1.5 text-sm border ${
                    terrain === t ? 'border-strong bg-surface text-primary font-bold' : 'border-subtle text-secondary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <RatingRow label="抓地力" options={['充足', '一般', '打滑']} value={grip} onChange={setGrip} />
          <RatingRow label="缓震" options={['充足', '一般', '偏硬']} value={cushion} onChange={setCushion} />
          <RatingRow label="稳定性" options={['稳定', '一般', '不稳']} value={stability} onChange={setStability} />
          <RatingRow label="总体感受" options={['安全', '注意', '该换了']} value={overall} onChange={setOverall} />

          <button
            onClick={() => canSubmit && onSubmit({ terrain, grip, cushion, stability, overall })}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-accent text-invert-text text-sm font-bold disabled:opacity-30"
          >
            提交
          </button>
        </div>
      </div>
    </div>
  );
}
