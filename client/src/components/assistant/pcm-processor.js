/**
 * PcmProcessor — AudioWorkletProcessor
 *
 * Runs at the AudioContext's actual sample rate (whatever the hardware uses).
 * Downsamples to 16 kHz using linear interpolation, converts to Int16,
 * and accumulates samples until we have ~100 ms worth (1600 samples = 3200 bytes)
 * before posting to the main thread.
 *
 * Gemini Live's VAD needs a meaningful chunk size to detect speech onset —
 * the raw worklet quantum (128 frames → ~42 samples at 16 kHz) is too small.
 *
 * Target rate is passed via processorOptions.targetSampleRate (default 16000).
 */
// Flush every ~50 ms of 16 kHz audio = 800 samples = 1600 bytes.
// Small enough for low latency, large enough for Gemini's VAD to work.
const FLUSH_SAMPLES = 800;

class PcmProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this._targetRate = (options.processorOptions && options.processorOptions.targetSampleRate) || 16000;
    // Accumulate downsampled float32 samples until we have enough to flush
    this._pending = new Float32Array(FLUSH_SAMPLES * 2); // pre-allocate with headroom
    this._pendingLen = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;

    const float32 = input[0];

    const sourceRate = sampleRate; // AudioWorkletGlobalScope global

    // Downsample to target rate via linear interpolation
    let samples;
    if (sourceRate === this._targetRate) {
      samples = float32;
    } else {
      const ratio = sourceRate / this._targetRate;
      const outLength = Math.floor(float32.length / ratio);
      samples = new Float32Array(outLength);
      for (let i = 0; i < outLength; i++) {
        const srcIdx = i * ratio;
        const lo = Math.floor(srcIdx);
        const hi = Math.min(lo + 1, float32.length - 1);
        const frac = srcIdx - lo;
        samples[i] = float32[lo] * (1 - frac) + float32[hi] * frac;
      }
    }

    // Grow pending buffer if needed
    if (this._pendingLen + samples.length > this._pending.length) {
      const grown = new Float32Array((this._pendingLen + samples.length) * 2);
      grown.set(this._pending.subarray(0, this._pendingLen));
      this._pending = grown;
    }
    this._pending.set(samples, this._pendingLen);
    this._pendingLen += samples.length;

    // Flush in FLUSH_SAMPLES-sized chunks
    while (this._pendingLen >= FLUSH_SAMPLES) {
      const chunk = this._pending.subarray(0, FLUSH_SAMPLES);
      this._postInt16(chunk);
      // Shift remaining samples to front
      this._pending.copyWithin(0, FLUSH_SAMPLES, this._pendingLen);
      this._pendingLen -= FLUSH_SAMPLES;
    }

    return true;
  }

  _postInt16(float32) {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 32768 : s * 32767;
    }
    this.port.postMessage(int16.buffer, [int16.buffer]);
  }
}

registerProcessor("pcm-processor", PcmProcessor);
