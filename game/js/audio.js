// audio.js - Web Audio API サウンド管理

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function resumeAudio() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

function playTone(freq, duration, type = 'square', vol = 0.15) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

function playNoise(duration, vol = 0.1) {
  const c = getCtx();
  const bufSize = c.sampleRate * duration;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = buf;
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(gain);
  gain.connect(c.destination);
  src.start();
}

export function playSound(name) {
  resumeAudio();
  switch (name) {
    case 'coin':
      playTone(880, 0.1, 'square', 0.1);
      setTimeout(() => playTone(1320, 0.15, 'square', 0.1), 60);
      break;
    case 'poop':
      playTone(150, 0.3, 'sawtooth', 0.12);
      break;
    case 'eat':
      playTone(400, 0.1, 'square', 0.1);
      setTimeout(() => playTone(500, 0.1, 'square', 0.1), 80);
      break;
    case 'knife':
      playTone(1200, 0.05, 'sawtooth', 0.15);
      setTimeout(() => playTone(800, 0.1, 'sawtooth', 0.1), 50);
      break;
    case 'cut':
      playNoise(0.15, 0.2);
      playTone(200, 0.1, 'sawtooth', 0.15);
      break;
    case 'brainrot':
      playTone(100, 0.5, 'sawtooth', 0.2);
      setTimeout(() => playTone(80, 0.5, 'sawtooth', 0.15), 200);
      break;
    case 'bike':
      playTone(120, 0.1, 'sawtooth', 0.08);
      break;
    case 'explode':
      playNoise(0.8, 0.3);
      playTone(60, 0.6, 'sawtooth', 0.2);
      break;
    case 'ghost':
      playTone(300, 0.3, 'sine', 0.1);
      setTimeout(() => playTone(250, 0.3, 'sine', 0.08), 150);
      break;
    case 'friend':
      playTone(523, 0.1, 'square', 0.1);
      setTimeout(() => playTone(659, 0.1, 'square', 0.1), 100);
      setTimeout(() => playTone(784, 0.15, 'square', 0.1), 200);
      break;
    case 'fly':
      playTone(600, 0.05, 'sine', 0.05);
      break;
    case 'magic':
      [0, 100, 200, 300, 400].forEach((d, i) =>
        setTimeout(() => playTone(500 + i * 200, 0.2, 'sine', 0.08), d)
      );
      break;
    case 'transform':
      playTone(400, 0.15, 'sine', 0.1);
      setTimeout(() => playTone(800, 0.2, 'sine', 0.12), 100);
      break;
    case 'news':
      playTone(440, 0.15, 'square', 0.08);
      setTimeout(() => playTone(550, 0.15, 'square', 0.08), 150);
      setTimeout(() => playTone(660, 0.2, 'square', 0.1), 300);
      break;
    case 'clear':
      [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.3, 'square', 0.12), i * 150)
      );
      break;
    case 'tap':
      playTone(600, 0.05, 'square', 0.08);
      break;
    case 'hit':
      playNoise(0.05, 0.15);
      playTone(200, 0.08, 'square', 0.1);
      break;
    case 'bigExplode':
      playNoise(1.5, 0.35);
      playTone(40, 1.0, 'sawtooth', 0.25);
      setTimeout(() => playTone(30, 0.8, 'sawtooth', 0.2), 300);
      break;
    case 'chime':
      [523, 659, 784, 659].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.2, 'sine', 0.1), i * 200)
      );
      break;
    case 'horror':
      playTone(80, 1.0, 'sine', 0.06);
      playTone(83, 1.0, 'sine', 0.06);
      break;
    default:
      playTone(440, 0.1, 'square', 0.08);
  }
}

let bgmInterval = null;

export function startBGM(world) {
  stopBGM();
  const patterns = {
    w1: () => { playTone(130, 0.1, 'square', 0.04); setTimeout(() => playTone(165, 0.1, 'square', 0.04), 150); },
    w2day: () => { playTone(440, 0.15, 'sine', 0.03); setTimeout(() => playTone(550, 0.15, 'sine', 0.03), 200); },
    w2night: () => { playTone(100, 0.5, 'sine', 0.03); playTone(103, 0.5, 'sine', 0.03); },
    w2fly: () => { playTone(330, 0.1, 'sine', 0.03); setTimeout(() => playTone(392, 0.1, 'sine', 0.03), 150); },
    w3: () => { playTone(392, 0.2, 'sine', 0.04); setTimeout(() => playTone(494, 0.2, 'sine', 0.04), 250); },
    tv: () => { playTone(440, 0.1, 'square', 0.03); setTimeout(() => playTone(554, 0.1, 'square', 0.03), 120); },
  };
  const fn = patterns[world];
  if (fn) bgmInterval = setInterval(fn, 2000);
}

export function stopBGM() {
  if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
}
