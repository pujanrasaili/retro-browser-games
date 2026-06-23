// Lightweight Web Audio sound engine — no external audio files needed.
// All sounds are synthesized as simple oscillator beeps/sweeps.

let audioCtx = null;
let muted = localStorage.getItem('rg_muted') === 'true';

function getCtx() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  localStorage.setItem('rg_muted', String(value));
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

function playTone({ freq = 440, duration = 0.1, type = 'square', volume = 0.15, sweepTo = null }) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  // Resume on user gesture if suspended (autoplay policies)
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (sweepTo !== null) {
    osc.frequency.exponentialRampToValueAtTime(sweepTo, ctx.currentTime + duration);
  }
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const sounds = {
  eat:       () => playTone({ freq: 440, duration: 0.08, type: 'square', volume: 0.12 }),
  move:      () => playTone({ freq: 220, duration: 0.04, type: 'square', volume: 0.05 }),
  rotate:    () => playTone({ freq: 330, duration: 0.05, type: 'triangle', volume: 0.08 }),
  drop:      () => playTone({ freq: 150, duration: 0.07, type: 'square', volume: 0.12, sweepTo: 60 }),
  lineClear: () => playTone({ freq: 600, duration: 0.18, type: 'sawtooth', volume: 0.12, sweepTo: 1200 }),
  levelUp:   () => playTone({ freq: 400, duration: 0.25, type: 'triangle', volume: 0.13, sweepTo: 900 }),
  flag:      () => playTone({ freq: 500, duration: 0.05, type: 'triangle', volume: 0.08 }),
  reveal:    () => playTone({ freq: 350, duration: 0.04, type: 'sine', volume: 0.06 }),
  win:       () => playTone({ freq: 523, duration: 0.3, type: 'triangle', volume: 0.14, sweepTo: 1046 }),
  explode:   () => playTone({ freq: 120, duration: 0.3, type: 'sawtooth', volume: 0.18, sweepTo: 40 }),
  gameOver:  () => playTone({ freq: 300, duration: 0.4, type: 'sawtooth', volume: 0.14, sweepTo: 80 }),
};
