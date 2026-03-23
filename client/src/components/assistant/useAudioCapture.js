import { useState, useRef, useCallback } from "react";

// Gemini Live expects 16 kHz mono PCM Int16.
// We capture via AudioWorklet (resampling from device rate) with a
// gain=0 sink to keep the Web Audio graph alive without echo.
const TARGET_SAMPLE_RATE = 16000;

export function useAudioCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const audioCtxRef = useRef(null);
  const workletNodeRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const onChunkRef = useRef(null);

  const startCapture = useCallback(async (onChunk) => {
    onChunkRef.current = onChunk;

    if (!window.AudioWorklet) {
      setPermissionError("AudioWorklet not supported in this browser");
      return;
    }

    if (audioCtxRef.current) {
      console.log("[useAudioCapture] already capturing, updated onChunk ref");
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: TARGET_SAMPLE_RATE,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (err) {
      // Fallback: try without constraints if the above fails
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err2) {
        console.error("[useAudioCapture] getUserMedia failed:", err2);
        setPermissionError(
          err2.name === "NotAllowedError"
            ? "Microphone permission denied"
            : `Mic error: ${err2.message}`
        );
        return;
      }
    }

    // Log actual track settings to see what the browser gave us
    const track = stream.getAudioTracks()[0];
    const settings = track.getSettings();
    console.log("[useAudioCapture] track settings:", JSON.stringify(settings));

    // Create AudioContext at the device's native rate — we'll resample in the worklet
    const audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") await audioCtx.resume();

    console.log(
      `[useAudioCapture] AudioContext: sampleRate=${audioCtx.sampleRate}, state=${audioCtx.state}`
    );

    try {
      await audioCtx.audioWorklet.addModule(
        new URL("./pcm-processor.js", import.meta.url)
      );
    } catch (err) {
      console.error("[useAudioCapture] Failed to load worklet:", err);
      setPermissionError("Failed to load audio processor");
      stream.getTracks().forEach((t) => t.stop());
      await audioCtx.close();
      return;
    }

    const workletNode = new AudioWorkletNode(audioCtx, "pcm-processor", {
      processorOptions: { targetSampleRate: TARGET_SAMPLE_RATE },
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });

    const source = audioCtx.createMediaStreamSource(stream);

    // gain=0 sink keeps the graph alive without playing mic audio through speakers
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0;
    source.connect(workletNode);
    workletNode.connect(silentGain);
    silentGain.connect(audioCtx.destination);

    workletNode.port.onmessage = (event) => {
      if (!(event.data instanceof ArrayBuffer) || event.data.byteLength === 0) return;
      onChunkRef.current?.(event.data);
    };

    workletNode.port.onmessageerror = (err) => {
      console.error("[useAudioCapture] worklet port error:", err);
    };

    audioCtxRef.current = audioCtx;
    workletNodeRef.current = workletNode;
    mediaStreamRef.current = stream;

    setIsCapturing(true);
    setPermissionError(null);
    console.log(
      `[useAudioCapture] capture started — ctx state: ${audioCtx.state}, sampleRate: ${audioCtx.sampleRate}`
    );
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
    onChunkRef.current = null;
    setIsCapturing(false);
    console.log("[useAudioCapture] capture stopped");
  }, []);

  return { startCapture, stopCapture, isCapturing, permissionError };
}
