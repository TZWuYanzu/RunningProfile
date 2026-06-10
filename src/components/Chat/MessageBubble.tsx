import type { ChatMessage } from '@/types/coach';
import ToolCallCard from './ToolCallCard';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-invert text-invert-text rounded-br-none'
              : 'bg-surface text-primary rounded-bl-none'
          }`}
        >
          {message.content}
        </div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {message.toolCalls.map((tc, i) => (
              <ToolCallCard key={i} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
