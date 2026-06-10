import { useState, useRef, useCallback, useEffect } from 'react';

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

const MAX_DURATION = 60;

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  error: string | null;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveRef = useRef<((blob: Blob) => void) | null>(null);
  const mimeTypeRef = useRef('');

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setDuration(0);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setError('浏览器不支持录音');
      return;
    }
    mimeTypeRef.current = mimeType;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        resolveRef.current?.(blob);
        resolveRef.current = null;
        cleanup();
      };

      recorder.start(100);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d + 1 >= MAX_DURATION) {
            recorder.stop();
            return MAX_DURATION;
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      setError('请允许麦克风权限');
      cleanup();
    }
  }, [cleanup]);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      } else {
        resolve(new Blob([], { type: mimeTypeRef.current }));
        cleanup();
      }
    });
  }, [cleanup]);

  return { isRecording, duration, startRecording, stopRecording, error };
}
