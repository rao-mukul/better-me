import { useCallback, useRef } from 'react';
import useWaterStore from '../store/waterStore';

const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;

export function useSound() {
  const soundEnabled = useWaterStore((s) => s.soundEnabled);
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current && AudioCtx) {
      ctxRef.current = new AudioCtx();
    }
    return ctxRef.current;
  };

  const playDrop = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.12);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }, [soundEnabled]);

  const playSplash = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    // Deeper, richer drop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);

    // Add a secondary bubble
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.frequency.setValueAtTime(600, ctx.currentTime + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);
    osc2.type = 'sine';

    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.22);
  }, [soundEnabled]);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    // Two ascending notes
    [0, 0.12].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(i === 0 ? 880 : 1320, ctx.currentTime + delay);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
  }, [soundEnabled]);

  const playClick = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, [soundEnabled]);

  return { playDrop, playSplash, playChime, playClick };
}
