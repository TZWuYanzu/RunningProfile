import type { Shoe } from '@/types/coach';

const OVERALL_COLORS: Record<string, string> = {
  '安全': 'text-primary',
  '注意': 'text-accent',
  '该换了': 'bg-accent text-invert-text px-1.5 py-0.5',
};

interface Props {
  shoes: Shoe[];
  latestOverall: Record<number, string>;
  onAdd: () => void;
  onSelect: (shoe: Shoe) => void;
}

export default function ShoeList({ shoes, latestOverall, onAdd, onSelect }: Props) {
  return (
    <div className="mx-5 mt-5">
      <div className="h-px bg-accent mb-5" />
      <div className="text-[9px] text-tertiary uppercase tracking-wider mb-3">我的装备</div>

      {shoes.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-tertiary">还没有添加跑鞋</p>
        </div>
      ) : (
        <div className="space-y-0">
          {shoes.map((shoe) => {
            const overall = latestOverall[shoe.id];
            const colorClass = overall ? (OVERALL_COLORS[overall] || 'text-tertiary') : '';
            return (
              <button
                key={shoe.id}
                onClick={() => onSelect(shoe)}
                className="w-full text-left py-3 border-b border-subtle"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-primary">{shoe.name}</span>
                    {shoe.brand && (
                      <span className="ml-1.5 text-xs text-muted">{shoe.brand}</span>
                    )}
                  </div>
                  {overall && (
                    <span className={`text-[10px] font-medium ${colorClass}`}>
                      {overall}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-tertiary">
                  <span>{shoe.usage === 'trail' ? '越野' : shoe.usage === 'road' ? '路跑' : '兼用'}</span>
                  <span>{Math.round(shoe.total_km)} km</span>
                  <span>{shoe.total_runs} 次</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={onAdd}
        className="w-full mt-3 py-2 text-sm text-accent font-bold border border-dashed border-accent"
      >
        + 添加跑鞋
      </button>
    </div>
  );
}
