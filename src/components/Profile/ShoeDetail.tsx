import { useState, useEffect } from 'react';
import { getShoeDetail, createShoeLog, retireShoe } from '@/api/profile';
import type { Shoe, ShoeLog } from '@/types/coach';
import ShoeLogForm from './ShoeLogForm';

const OVERALL_DOT: Record<string, string> = {
  '安全': 'bg-primary',
  '注意': 'bg-accent',
  '该换了': 'bg-accent',
};

interface Props {
  shoe: Shoe;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ShoeDetail({ shoe, onClose, onUpdate }: Props) {
  const [logs, setLogs] = useState<ShoeLog[]>([]);
  const [showLogForm, setShowLogForm] = useState(false);

  useEffect(() => {
    getShoeDetail(shoe.id)
      .then((res) => setLogs(res.logs))
      .catch(() => {});
  }, [shoe.id]);

  const handleLog = async (data: { terrain: string; grip: string; cushion: string; stability: string; overall: string }) => {
    await createShoeLog(shoe.id, data);
    const res = await getShoeDetail(shoe.id);
    setLogs(res.logs);
    setShowLogForm(false);
    onUpdate();
  };

  const handleRetire = async () => {
    await retireShoe(shoe.id);
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-lg bg-app p-5 max-h-[75vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-primary">{shoe.name}</h3>
          <button onClick={onClose} className="text-tertiary text-lg">✕</button>
        </div>

        <div className="text-xs text-tertiary mb-3">
          {shoe.brand && `${shoe.brand} · `}
          {shoe.usage === 'trail' ? '越野' : shoe.usage === 'road' ? '路跑' : '兼用'}
          {' · '}{Math.round(shoe.total_km)} km · {shoe.total_runs} 次
        </div>

        {logs.length > 0 && (
          <div className="mb-4">
            <div className="text-[9px] text-tertiary uppercase tracking-wider mb-2">鞋况记录</div>
            <div className="space-y-0">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 py-2 border-b border-subtle text-xs">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${OVERALL_DOT[log.overall] || 'bg-muted'}`} />
                  <span className="text-primary font-medium">{log.overall}</span>
                  <span className="text-muted">·</span>
                  <span className="text-secondary">{log.terrain}</span>
                  <span className="text-muted">·</span>
                  <span className="text-secondary">抓地{log.grip}</span>
                  <span className="ml-auto text-muted">{log.logged_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => setShowLogForm(true)}
            className="w-full py-2 text-sm text-primary font-bold border border-strong"
          >
            记录鞋况
          </button>
          <button
            onClick={handleRetire}
            className="w-full py-2 text-sm text-accent font-bold border border-accent"
          >
            退役这双鞋
          </button>
        </div>
      </div>

      {showLogForm && (
        <ShoeLogForm
          shoeName={shoe.name}
          onSubmit={handleLog}
          onClose={() => setShowLogForm(false)}
        />
      )}
    </div>
  );
}
