import { useState } from 'react';
import type { ToolCallInfo } from '@/types/coach';

const TOOL_LABELS: Record<string, string> = {
  evaluate_ability: '能力评估',
  get_recent_activities: '查看最近训练',
  search_history: '搜索历史记录',
  get_profile: '查看档案',
  generate_plan: '生成训练计划',
  update_plan: '更新计划',
  get_weekly_summary: '周报汇总',
};

interface Props {
  toolCall: ToolCallInfo;
}

export default function ToolCallCard({ toolCall }: Props) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[toolCall.name] || toolCall.name;

  return (
    <div className="bg-surface border border-subtle overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left"
      >
        <span className={`w-2 h-2 rounded-full ${toolCall.status === 'calling' ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
        <span className="text-secondary font-medium">{label}</span>
        <span className="ml-auto text-tertiary">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <div className="px-2.5 pb-2 border-t border-subtle pt-1.5 space-y-1">
          <div className="text-secondary">
            <span className="font-medium">参数: </span>
            <code className="text-primary">{JSON.stringify(toolCall.args)}</code>
          </div>
          {toolCall.result && (
            <div className="text-secondary">
              <span className="font-medium">结果: </span>
              <pre className="text-primary whitespace-pre-wrap max-h-32 overflow-y-auto">
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
