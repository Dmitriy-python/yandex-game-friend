// Web Audio API synthesized game sounds
let audioCtx: AudioContext | null = null;
let musicEnabled = true;
let sfxEnabled = true;
let musicGain: GainNode | null = null;
let musicOscillators: OscillatorNode[] = [];

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setMusicEnabled(enabled: boolean) {
  musicEnabled = enabled;
  if (musicGain) {
    musicGain.gain.setTargetAtTime(enabled ? 0.08 : 0, getCtx().currentTime, 0.1);
  }
  if (!enabled) stopMusic();
}

export function setSfxEnabled(enabled: boolean) {
  sfxEnabled = enabled;
}

export function isMusicEnabled() { return musicEnabled; }
export function isSfxEnabled() { return sfxEnabled; }

// --- SFX ---

export function playShoot() {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

export function playHit() {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

export function playKill() {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  // Noise burst
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  noise.connect(gain).connect(ctx.destination);
  noise.start();
}

export function playMeleeSwing() {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

export function playChestOpen() {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.3);
  });
}

export function playLevelUp() {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const notes = [440, 554, 659, 880];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.4);
  });
}

export function playBossSpawn() {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.8);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1);
}

export function playPlayerHit() {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.07, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

// --- Background Music ---
let musicPlaying = false;

export function startMusic() {
  if (musicPlaying || !musicEnabled) return;
  const ctx = getCtx();
  musicGain = ctx.createGain();
  musicGain.gain.setValueAtTime(0.08, ctx.currentTime);
  musicGain.connect(ctx.destination);

  // Simple dark ambient drone
  const baseNotes = [55, 82.5, 110]; // A1, E2, A2
  baseNotes.forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    // Slow LFO for movement
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.3 + Math.random() * 0.2, ctx.currentTime);
    lfoGain.gain.setValueAtTime(freq * 0.02, ctx.currentTime);
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start();
    
    osc.connect(musicGain!);
    osc.start();
    musicOscillators.push(osc, lfo);
  });

  // Add a pad layer
  const padOsc = ctx.createOscillator();
  padOsc.type = 'triangle';
  padOsc.frequency.setValueAtTime(220, ctx.currentTime);
  const padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0.03, ctx.currentTime);
  padOsc.connect(padGain).connect(musicGain);
  padOsc.start();
  musicOscillators.push(padOsc);

  musicPlaying = true;
}

export function stopMusic() {
  musicOscillators.forEach(osc => {
    try { osc.stop(); } catch {}
  });
  musicOscillators = [];
  musicPlaying = false;
}

export function playBossKill() {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  // Epic explosion
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start();
}

export function playBossAbility() {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

export function processGameEvents(events: GameEvent[]) {
  for (const e of events) {
    switch (e.type) {
      case 'shoot': playShoot(); break;
      case 'hit': playHit(); break;
      case 'kill': playKill(); break;
      case 'boss_kill': playBossKill(); break;
      case 'melee_swing': playMeleeSwing(); break;
      case 'chest_open': playChestOpen(); break;
      case 'level_up': playLevelUp(); break;
      case 'boss_spawn': playBossSpawn(); break;
      case 'player_hit': playPlayerHit(); break;
      case 'boss_ability': playBossAbility(); break;
    }
  }
}

// Import GameEvent type
import { GameEvent } from './types';
