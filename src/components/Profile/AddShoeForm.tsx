import { useState } from 'react';

const TRAIT_OPTIONS = ['抓地', '缓震', '竞速', '防水', '保护', '轻量'];

interface Props {
  onSubmit: (data: { name: string; brand: string; usage: string; traits: string[]; initial_km: number }) => void;
  onClose: () => void;
}

export default function AddShoeForm({ onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [usage, setUsage] = useState('trail');
  const [traits, setTraits] = useState<string[]>([]);
  const [initialKm, setInitialKm] = useState(0);

  const toggleTrait = (t: string) => {
    setTraits((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), brand: brand.trim(), usage, traits, initial_km: initialKm });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-lg bg-app p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-primary">添加跑鞋</h3>
          <button onClick={onClose} className="text-tertiary text-lg">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[9px] text-tertiary uppercase tracking-wider mb-1 block">鞋子名称 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如 Speedcross 6"
              className="w-full h-10 border-b-2 border-strong px-1 text-sm text-primary bg-transparent focus:outline-none placeholder:text-muted"
            />
          </div>

          <div>
            <label className="text-[9px] text-tertiary uppercase tracking-wider mb-1 block">品牌</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="如 Salomon"
              className="w-full h-10 border-b-2 border-strong px-1 text-sm text-primary bg-transparent focus:outline-none placeholder:text-muted"
            />
          </div>

          <div>
            <label className="text-[9px] text-tertiary uppercase tracking-wider mb-1 block">用途</label>
            <div className="flex gap-2">
              {[['trail', '越野'], ['road', '路跑'], ['both', '兼用']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setUsage(val)}
                  className={`px-3 py-1.5 text-sm border ${
                    usage === val ? 'border-strong bg-surface text-primary font-bold' : 'border-subtle text-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] text-tertiary uppercase tracking-wider mb-1 block">特性</label>
            <div className="flex flex-wrap gap-2">
              {TRAIT_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTrait(t)}
                  className={`px-3 py-1.5 text-sm border ${
                    traits.includes(t) ? 'border-strong bg-surface text-primary font-bold' : 'border-subtle text-secondary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] text-tertiary uppercase tracking-wider mb-1 block">已有里程 (km)</label>
            <input
              type="number"
              value={initialKm}
              onChange={(e) => setInitialKm(Number(e.target.value))}
              className="w-full h-10 border-b-2 border-strong px-1 text-sm text-primary bg-transparent focus:outline-none placeholder:text-muted"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full py-2.5 bg-accent text-invert-text text-sm font-bold disabled:opacity-30"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
