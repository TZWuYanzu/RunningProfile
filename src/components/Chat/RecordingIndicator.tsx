interface Props {
  duration: number;
  onStop: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RecordingIndicator({ duration, onStop }: Props) {
  return (
    <div className="flex items-center gap-3 px-5 py-2 bg-app border-t border-subtle">
      <div className="w-2.5 h-2.5 bg-accent animate-pulse" />
      <span className="text-sm font-black text-primary tabular-nums tracking-wider flex-1">
        {formatTime(duration)}
      </span>
      <button
        onClick={onStop}
        className="w-10 h-10 bg-invert text-invert-text flex items-center justify-center text-sm font-bold"
      >
        ■
      </button>
    </div>
  );
}
