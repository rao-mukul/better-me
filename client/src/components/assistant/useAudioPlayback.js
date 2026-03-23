import { useState, useRef, useCallback } from "react";

/**
 * Hook: PCM playback queue via Web Audio API
 * Accepts 24kHz Int16 PCM chunks, schedules them back-to-back,
 * and supports interruption (barge-in).
 *
 * @param {boolean} isMuted - When true, incoming chunks are silently discarded.
 * @returns {{ enqueueChunk, interrupt, isSpeaking }}
 */
export function useAudioPlayback(isMuted) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioCtxRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const activeNodesRef = useRef([]);

  /**
   * Lazily initialise the AudioContext on first use.
   */
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;
    }
    return audioCtxRef.current;
  }, []);

  /**
   * Decode an Int16 PCM ArrayBuffer and schedule it for playback.
   * @param {ArrayBuffer} arrayBuffer - Raw Int16 PCM at 24 kHz.
   */
  const enqueueChunk = useCallback(
    (arrayBuffer) => {
      if (isMuted) return;

      const audioCtx = getAudioCtx();

      // Convert Int16 → Float32
      const int16 = new Int16Array(arrayBuffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }

      // Build AudioBuffer
      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      // Create and connect source node
      const node = audioCtx.createBufferSource();
      node.buffer = audioBuffer;
      node.connect(audioCtx.destination);

      // Schedule back-to-back
      const startAt = Math.max(audioCtx.currentTime, nextStartTimeRef.current);
      node.start(startAt);
      nextStartTimeRef.current = startAt + audioBuffer.duration;

      activeNodesRef.current.push(node);
      setIsSpeaking(true);

      node.onended = () => {
        activeNodesRef.current = activeNodesRef.current.filter((n) => n !== node);
        if (activeNodesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };
    },
    [isMuted, getAudioCtx]
  );

  /**
   * Stop all scheduled audio immediately (barge-in / interruption).
   */
  const interrupt = useCallback(() => {
    for (const node of activeNodesRef.current) {
      try {
        node.stop();
        node.disconnect();
      } catch (_) {
        // Node may have already ended — safe to ignore
      }
    }
    activeNodesRef.current = [];
    nextStartTimeRef.current = audioCtxRef.current?.currentTime ?? 0;
    setIsSpeaking(false);
  }, []);

  return { enqueueChunk, interrupt, isSpeaking };
}
