
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
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Simple synthesis based on type
    if (type === 'match' || type === 'levelup') {
        oscillator.type = 'sine';
        freqs.forEach((f, i) => {
            oscillator.frequency.setValueAtTime(f, now + i * 0.1);
        });
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
    } else if (type === 'move') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freqs[0], now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    } else if (type === 'discard') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(freqs[0], now);
        oscillator.frequency.linearRampToValueAtTime(freqs[1], now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    } else if (type === 'merge') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freqs[0], now);
        oscillator.frequency.exponentialRampToValueAtTime(freqs[1], now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

  }, [enabled, initAudio]);

  return { playSound };
};
