import { useState, useRef } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/api/transcribe';
import RecordingIndicator from './RecordingIndicator';

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isRecording, duration, startRecording, stopRecording, error } = useVoiceRecorder();

  const handleSend = () => {
    const msg = text.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setText('');
    inputRef.current?.focus();
  };

  const handleMicTap = async () => {
    await startRecording();
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    if (blob.size === 0) return;
    setTranscribing(true);
    try {
      const result = await transcribeAudio(blob);
      if (result.text) {
        setText(result.text);
        inputRef.current?.focus();
      }
    } catch {
      // transcription failed silently
    } finally {
      setTranscribing(false);
    }
  };

  if (isRecording) {
    return <RecordingIndicator duration={duration} onStop={handleStop} />;
  }

  return (
    <div className="flex flex-col">
      {error && (
        <div className="px-5 py-1 text-[10px] text-accent">{error}</div>
      )}
      <div className="flex items-center gap-2 px-5 py-2 bg-app border-t border-subtle">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入消息..."
          disabled={disabled || transcribing}
          className="flex-1 h-10 border-b-2 border-strong px-1 text-sm text-primary bg-transparent focus:outline-none placeholder:text-muted disabled:opacity-50"
        />
        {transcribing ? (
          <div className="w-10 h-10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-accent animate-pulse" />
          </div>
        ) : text.trim() ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="w-10 h-10 bg-accent text-invert-text flex items-center justify-center text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ↑
          </button>
        ) : (
          <button
            onClick={handleMicTap}
            disabled={disabled}
            className="w-10 h-10 bg-accent text-invert-text flex items-center justify-center text-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            🎤
          </button>
        )}
      </div>
    </div>
  );
}
