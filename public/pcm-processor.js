// AudioWorklet processor that resamples mic audio to 24 kHz PCM16
// for OpenAI Realtime API streaming.
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const float32 = input[0]; // mono channel
    if (!float32 || float32.length === 0) return true;

    // Accumulate samples — we'll resample in bulk
    for (let i = 0; i < float32.length; i++) {
      this._buffer.push(float32[i]);
    }

    // Resample from sampleRate → 24000 and convert to int16
    // Process in chunks when we have enough samples
    const ratio = sampleRate / 24000;
    const outputLen = Math.floor(this._buffer.length / ratio);

    if (outputLen < 1) return true;

    const pcm16 = new Int16Array(outputLen);
    for (let i = 0; i < outputLen; i++) {
      const srcIdx = i * ratio;
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, this._buffer.length - 1);
      const frac = srcIdx - lo;
      // Linear interpolation
      const sample = this._buffer[lo] * (1 - frac) + this._buffer[hi] * frac;
      // Clamp and convert to int16
      pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    }

    // Keep leftover samples for next round
    const consumed = Math.floor(outputLen * ratio);
    this._buffer = this._buffer.slice(consumed);

    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
