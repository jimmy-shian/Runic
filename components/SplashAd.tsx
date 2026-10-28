import adResetConfig from '../ad-reset-config.json';
import React, { useState, useEffect, useRef } from 'react';
import { showStartupAppOpenAd } from '../src/lib/startup-ad';

interface SplashAdProps {
  onFinish: () => void;
  appName?: string;
}

export const SplashAd: React.FC<SplashAdProps> = ({ onFinish, appName = "RUNIC Synthesis" }) => {
  if (typeof window !== 'undefined' && adResetConfig.token && localStorage.getItem('yesolve_ad_bypass_reset_token') !== adResetConfig.token) {
    localStorage.setItem('yesolve_ad_bypass', 'false');
    localStorage.setItem('yesolve_ad_bypass_reset_token', adResetConfig.token);
  }
  const isBypassed = typeof window !== 'undefined' && localStorage.getItem('yesolve_ad_bypass') === 'true';

  const [countdown, setCountdown] = useState(5);
  const clickTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    if (isBypassed) {
      onFinish();
      return;
    }

    showStartupAppOpenAd();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onFinish, isBypassed]);

  if (isBypassed) return null;

  const handleBackdoorClick = () => {
    const now = Date.now();
    clickTimestampsRef.current = clickTimestampsRef.current.filter((t) => now - t <= 3000);
    clickTimestampsRef.current.push(now);

    if (clickTimestampsRef.current.length >= 5) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('yesolve_ad_bypass', 'true');
      }
      onFinish();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[999999] pointer-events-auto bg-[#07090F] text-slate-200 flex flex-col justify-between p-6 select-none font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto">
        <div 
          onClick={handleBackdoorClick}
          className="flex items-center space-x-2.5 cursor-default select-none active:opacity-90"
        >
          <div className="w-7 h-7 rounded border border-amber-600/40 bg-[#121624] flex items-center justify-center text-amber-400 font-serif font-bold text-sm">
            ᚱ
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-100 tracking-wide">{appName}</div>
            <div className="text-[10px] text-amber-500/80 font-mono">SEAL_INITIALIZATION</div>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded bg-[#121624] border border-slate-800 text-[11px] font-mono text-slate-400">
          {countdown > 0 ? `0${countdown}s` : 'AWAKEN ›'}
        </div>
      </div>

      {/* Center: Ancient Obsidian Rune Grid Inscription */}
      <div 
        onClick={handleBackdoorClick}
        className="w-full max-w-md mx-auto my-auto bg-[#0E121E] border border-slate-800 rounded-lg p-5 cursor-default"
      >
        {/* Tablet Inscription Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3.5 text-xs font-mono">
          <div className="flex items-center space-x-2 text-amber-400/90">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>ALCHEMICAL_SANCTUM</span>
          </div>
          <span className="text-[10px] text-slate-500">SPONSORED</span>
        </div>

        {/* Ad Container */}
        <div className="w-full bg-[#07090F] rounded border border-slate-800/80 p-2 mb-3.5 overflow-hidden">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '120px' }}
            data-ad-client="ca-pub-2415998114933157"
            data-ad-slot="(待補)"
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
        </div>

        {/* Rune Element Alignment Matrix */}
        <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
          <div className="p-2 rounded bg-[#07090F] border border-slate-800/70">
            <div className="text-amber-400 text-sm">ᚠ</div>
            <div className="text-[9px] text-slate-500 mt-0.5">FIRE</div>
          </div>
          <div className="p-2 rounded bg-[#07090F] border border-slate-800/70">
            <div className="text-cyan-400 text-sm">ᚢ</div>
            <div className="text-[9px] text-slate-500 mt-0.5">WATER</div>
          </div>
          <div className="p-2 rounded bg-[#07090F] border border-slate-800/70">
            <div className="text-emerald-400 text-sm">ᚦ</div>
            <div className="text-[9px] text-slate-500 mt-0.5">EARTH</div>
          </div>
          <div className="p-2 rounded bg-[#07090F] border border-slate-800/70">
            <div className="text-indigo-400 text-sm">ᚨ</div>
            <div className="text-[9px] text-slate-500 mt-0.5">WIND</div>
          </div>
        </div>

        <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>RUNIC EQUILIBRIUM · TILE ENGINE</span>
          <span>AD · 5677764204</span>
        </div>
      </div>

      {/* Bottom Signature */}
      <div className="w-full max-w-md mx-auto text-center font-mono">
        <span className="text-[11px] text-slate-600">yesolve studio</span>
      </div>
    </div>
  );
};
