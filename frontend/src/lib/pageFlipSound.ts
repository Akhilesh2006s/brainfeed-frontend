/**
 * Short paper-like flip sound using Web Audio (no external assets).
 * Reuses one AudioContext; resumes if suspended (browser autoplay policy).
 */
let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new AC();
  }
  return sharedCtx;
}

export async function playPageFlipSound(): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
  } catch {
    return;
  }

  const duration = 0.13;
  const t0 = ctx.currentTime;
  const sampleRate = ctx.sampleRate;
  const frames = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, sampleRate);
  const ch = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const env = Math.sin((i / frames) * Math.PI);
    ch[i] = (Math.random() * 2 - 1) * env * 0.4;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2200, t0);
  filter.frequency.exponentialRampToValueAtTime(900, t0 + duration);
  filter.Q.value = 0.7;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.22, t0);
  gain.gain.exponentialRampToValueAtTime(0.01, t0 + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(t0);
  noise.stop(t0 + duration);

  /* Soft “whoosh” layer */
  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(420, t0);
  osc.frequency.exponentialRampToValueAtTime(120, t0 + duration * 0.8);
  og.gain.setValueAtTime(0.04, t0);
  og.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(og);
  og.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration);
}
