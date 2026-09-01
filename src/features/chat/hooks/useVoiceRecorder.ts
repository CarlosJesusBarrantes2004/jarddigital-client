import { useCallback, useRef, useState } from "react";

interface VoiceRecorderState {
  isRecording: boolean;
  durationMs: number;
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    durationMs: 0,
  });
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const startedAt = useRef(0);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.start();
    mediaRef.current = recorder;
    startedAt.current = Date.now();
    setState({ isRecording: true, durationMs: 0 });
    timerRef.current = window.setInterval(() => {
      setState({ isRecording: true, durationMs: Date.now() - startedAt.current });
    }, 200);
  }, []);

  const stop = useCallback(async (): Promise<File | null> => {
    const recorder = mediaRef.current;
    if (!recorder || recorder.state === "inactive") {
      stopTracks();
      return null;
    }
    const file = await new Promise<File | null>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stopTracks();
        if (blob.size === 0) {
          resolve(null);
          return;
        }
        resolve(
          new File([blob], `nota-voz-${Date.now()}.webm`, {
            type: blob.type,
          }),
        );
      };
      recorder.stop();
    });
    if (timerRef.current) window.clearInterval(timerRef.current);
    mediaRef.current = null;
    setState({ isRecording: false, durationMs: 0 });
    return file;
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    try {
      mediaRef.current?.stop();
    } catch {
      // already stopped
    }
    stopTracks();
    mediaRef.current = null;
    chunksRef.current = [];
    setState({ isRecording: false, durationMs: 0 });
  }, []);

  return { ...state, start, stop, cancel };
}
