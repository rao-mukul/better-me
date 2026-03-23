import { useState, useRef, useCallback } from "react";

export function useAudioCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const audioCtxRef = useRef(null);
  const workletNodeRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const startCapture = useCallback(async (onChunk) => {
    if (!window.AudioWorklet) {
      setPermissionError("AudioWorklet not supported in this browser");
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermissionError("Microphone permission denied");
      return;
    }

    const audioCtx = new AudioContext({ sampleRate: 16000 });
    await audioCtx.audioWorklet.addModule(
      new URL("./pcm-processor.js", import.meta.url)
    );

    const workletNode = new AudioWorkletNode(audioCtx, "pcm-processor");
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(workletNode);

    workletNode.port.onmessage = (event) => {
      onChunk(event.data);
    };

    audioCtxRef.current = audioCtx;
    workletNodeRef.current = workletNode;
    mediaStreamRef.current = stream;

    setIsCapturing(true);
    setPermissionError(null);
  }, []);

  const stopCapture = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  return { startCapture, stopCapture, isCapturing, permissionError };
}
