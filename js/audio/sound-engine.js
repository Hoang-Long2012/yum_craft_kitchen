import { state } from '../core/state.js';

let audioCtx = null;

/**
 * Lazily initialize and resume the Web Audio API context when sound effects are enabled.
 */
export function ensureAudioContext() {
  if (!state.sfxEnabled) return null;
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
    Promise.resolve(audioCtx.resume()).catch(() => {});
  }
  return audioCtx;
}

/**
 * Play external audio file from sounds/ with optional wait Promise & Web Audio fallback.
 */
export function playExternalAudio(filename, wait = false, fallbackSfx = null) {
  if (!state.sfxEnabled) return Promise.resolve();
  return new Promise((resolve) => {
    let fallbackTriggered = false;
    const triggerFallback = () => {
      if (!fallbackTriggered && fallbackSfx) {
        fallbackTriggered = true;
        playSoundEffect(fallbackSfx);
      }
    };
    try {
      const encodedName = encodeURI(filename);
      const audio = new Audio(`sounds/${encodedName}`);
      audio.volume = typeof state.sfxVolume === 'number' ? Math.max(0, Math.min(1, state.sfxVolume)) : 0.9;

      if (!wait) {
        audio.play().catch((e) => {
          console.warn('Audio play error (no-wait):', e);
          triggerFallback();
        });
        resolve();
        return;
      }

      let isResolved = false;
      const complete = () => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(safetyTimer);
          audio.removeEventListener('ended', complete);
          audio.removeEventListener('error', onError);
          resolve();
        }
      };

      const onError = (e) => {
        console.warn(`Lỗi tải âm thanh sounds/${filename}:`, e);
        triggerFallback();
        complete();
      };

      audio.addEventListener('ended', complete);
      audio.addEventListener('error', onError);

      // Timeout dự phòng an toàn 12s nếu trình duyệt chặn autoplay hoặc file lỗi
      const safetyTimer = setTimeout(() => {
        complete();
      }, 12000);

      audio.play().catch((err) => {
        console.warn(`Lỗi phát âm thanh sounds/${filename}:`, err);
        triggerFallback();
        complete();
      });
    } catch (err) {
      console.warn('playExternalAudio exception:', err);
      triggerFallback();
      resolve();
    }
  });
}

/**
 * Play procedural Web Audio foley effect.
 */
export function playSoundEffect(type, _fromResume = false) {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended' && !_fromResume && typeof ctx.resume === 'function') {
    Promise.resolve(ctx.resume())
      .then(() => {
        if (ctx.state === 'running') playSoundEffect(type, true);
      })
      .catch(() => {});
    return;
  }
  const now = ctx.currentTime;

  if (type === 'pick') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'door') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  } else if (type === 'chop') {
    [0, 0.11, 0.22].forEach((offset) => {
      const t = now + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.06);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    });
  } else if (type === 'roll' || type === 'stuff') {
    const dur = 0.28;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = type === 'stuff' ? 1400 : 2200;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.28;
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);

    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const t = now + 0.1 + idx * 0.07;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  } else if (type === 'sizzle' || type === 'deep_fry' || type === 'grill') {
    const duration = 0.65;
    const bufSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i * 0.03));
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = type === 'deep_fry' ? 2800 : 1900;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.005, now + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  } else if (type === 'boil') {
    [0, 0.1, 0.2, 0.32, 0.44].forEach((offset) => {
      const t = now + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const baseFreq = 230 + Math.random() * 160;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.0, t + 0.07);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    });
  } else if (type === 'blend') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.3);
    osc.frequency.linearRampToValueAtTime(140, now + 0.55);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 750;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.58);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  } else if (type === 'oven') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.56);
  } else if (type === 'microwave') {
    [0, 0.18].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + offset);
      gain.gain.setValueAtTime(0.16, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  } else if (type === 'spice') {
    const bufSize = Math.floor(ctx.sampleRate * 0.07);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    noise.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    noise.start(now);
  } else if (type === 'drink') {
    [0, 0.12, 0.24].forEach((offset, idx) => {
      const t = now + offset;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(290 + idx * 60, t);
      osc.frequency.exponentialRampToValueAtTime(540 + idx * 60, t + 0.09);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    });
  } else if (type === 'react_love') {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.27);
    });
  } else if (type === 'react_good') {
    [440, 554.37, 659.25].forEach((freq, idx) => {
      const t = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.21);
    });
  } else if (type === 'mix_bowl') {
    [0, 0.14, 0.28, 0.42].forEach((offset, idx) => {
      const t = now + offset;
      const bufSize = Math.floor(ctx.sampleRate * 0.1);
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.6));
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 650 + idx * 140;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.005, t + 0.1);
      noise.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      noise.start(t);
    });
  } else if (type === 'knead_dough') {
    [0, 0.22, 0.44].forEach((offset) => {
      const t = now + offset;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.14);
      g.gain.setValueAtTime(0.26, t);
      g.gain.exponentialRampToValueAtTime(0.002, t + 0.16);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  } else if (type === 'whisk_batter') {
    [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach((offset, idx) => {
      const t = now + offset;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420 + (idx % 2) * 180, t);
      osc.frequency.exponentialRampToValueAtTime(760, t + 0.07);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.002, t + 0.08);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    });
  } else if (type === 'react_bad') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.43);
  }
}
