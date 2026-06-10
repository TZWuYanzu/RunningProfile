import { useState, useRef } from 'react';

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setText('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 px-5 py-2 bg-app border-t border-subtle">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="输入消息..."
        disabled={disabled}
        className="flex-1 h-10 border-b-2 border-strong px-1 text-sm text-primary bg-transparent focus:outline-none placeholder:text-muted disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="w-10 h-10 bg-accent text-invert-text flex items-center justify-center text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ↑
      </button>
    </div>
  );
}
