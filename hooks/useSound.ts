import { useCallback, useRef } from 'react';
import { SOUND_FREQS } from '../constants';
import { SoundType } from '../types';

export const useSound = (enabled: boolean = true) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return;
    initAudio();

    const ctx = audioContextRef.current;
    if (!ctx) return;

    const freqs = SOUND_FREQS[type];
    if (!freqs) return;

    const now = ctx.currentTime;

    // 通用 helper：播放單個 oscillator
    const playOscillator = (freq: number, duration: number, type: OscillatorType = 'sine', gainValue = 0.1, filterFreq?: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      let node: AudioNode = osc;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainValue, now);

      if (filterFreq) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, now);
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }

      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    };

    // --- 不同音效 ---
    switch (type) {
      case 'move': {
        // “shoow” 滑動聲：白噪音 + bandpass + 短淡出
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.6; // 白噪音
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now); // 中高頻，聽起來像摩擦
        filter.Q.setValueAtTime(3, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.15);
      }
      break;

      case 'discard': {
        // “don” 空洞敲擊
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now); // 低沉的主頻
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.10); // 微微下滑 → 更像“don”

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(150, now); // 中低頻腔體
        filter.Q.setValueAtTime(6, now);           // 彈性共鳴

        gain.gain.setValueAtTime(0.6, now);        // 強烈起始
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12); // 快速衰減 → “don”

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
      }
      break;

      case 'merge':
        // 上升弧線音，帶空間感
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          osc.frequency.exponentialRampToValueAtTime(f * 1.8, now + 0.3);

          gain.gain.setValueAtTime(0.15 / (i + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(f * 2, now);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.3);
        });
        break;

      case 'match':
      case 'levelup':
        // 層次感旋律音效
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.1);
          gain.gain.setValueAtTime(0.1, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + 0.4 + i * 0.05);
        });
        break;

      default:
        break;
    }

  }, [enabled, initAudio]);

  return { playSound };
};
