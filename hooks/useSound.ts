import { useCallback, useEffect, useRef } from 'react';
import { SOUND_FREQS } from '../constants';
import { SoundType } from '../types';

export const useSound = (enabled = true) => {
  const context = useRef<AudioContext | null>(null);
  const output = useRef<GainNode | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const initAudio = useCallback(() => {
    if (!enabledRef.current) return;
    const Constructor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Constructor) return;
    if (!context.current || context.current.state === 'closed') {
      context.current = new Constructor();
      output.current = context.current!.createGain();
      output.current.connect(context.current!.destination);
    }
    if (context.current.state !== 'running') void context.current.resume().catch(() => {});
  }, []);
  useEffect(() => {
    if (output.current && context.current) output.current.gain.setValueAtTime(enabled ? 1 : 0, context.current.currentTime);
  }, [enabled]);
  useEffect(() => () => {
    const previous = context.current;
    context.current = null;
    output.current = null;
    if (previous && previous.state !== 'closed') void previous.close().catch(() => {});
  }, []);
  const playSound = useCallback((type: SoundType, combo = 1) => {
    if ((type === 'invalid' || type === 'blast') && 'vibrate' in navigator) navigator.vibrate(type === 'blast' ? 20 : 14);
    if (!enabledRef.current) return;
    initAudio();
    const ctx = context.current;
    const destination = output.current;
    if (!ctx || !destination) return;
    destination.gain.setValueAtTime(1, ctx.currentTime);
    const now = ctx.currentTime;
    const tone = (frequency: number, duration: number, volume = .1, offset = 0, endFrequency = frequency, wave: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(frequency, now + offset);
      osc.frequency.exponentialRampToValueAtTime(endFrequency, now + offset + duration);
      gain.gain.setValueAtTime(volume, now + offset);
      gain.gain.exponentialRampToValueAtTime(.0001, now + offset + duration);
      osc.connect(gain); gain.connect(destination);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start(now + offset); osc.stop(now + offset + duration);
    };
    const noise = (frequency: number, duration: number, volume = .15) => {
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource(); const filter = ctx.createBiquadFilter(); const gain = ctx.createGain();
      source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = 3;
      gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      source.connect(filter); filter.connect(gain); gain.connect(destination);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(now); source.stop(now + duration);
    };
    switch (type) {
      case 'move': tone(480, .13, .18, 0, 820, 'triangle'); tone(820, .12, .13, .06, 560); noise(1600, .12, .12); break;
      case 'invalid': tone(170, .18, .09, 0, 120, 'triangle'); tone(120, .18, .06); break;
      case 'discard': tone(140, .15, .25, 0, 90); tone(420, .12, .06, .08, 760); break;
      case 'merge': SOUND_FREQS.merge.forEach((f, i) => tone(f, .3, .15 / (i + 1), 0, f * 1.8)); noise(3000, .08, .1); break;
      case 'match': SOUND_FREQS.match.forEach((f, i) => tone(f * 2 ** (Math.min(combo - 1, 12) * 2 / 12), .3, .1, i * .1)); break;
      case 'levelup': SOUND_FREQS.levelup.forEach((f, i) => tone(f, .4, .12, i * .07)); noise(2200, .3, .12); break;
      case 'blast': tone(60, .5, .4, 0, 30); noise(900, .4, .3); break;
      case 'click': tone(1200, .035, .05); tone(2000, .035, .04, .025); break;
    }
  }, [initAudio]);
  return { playSound, initAudio };
};
