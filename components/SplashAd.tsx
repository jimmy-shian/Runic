import adResetConfig from '../ad-reset-config.json';
import React, { useState, useEffect, useRef } from 'react';
import { Flame, Droplets, Leaf, Mountain, Zap } from 'lucide-react';
import { showNativeAdInSlot, hideNativeAdInSlot } from '../src/lib/startup-ad';
import { AdSenseSlot } from './AdSenseSlot';

interface SplashAdProps {
  onFinish: () => void;
  appName?: string;
}

/** 統一倒數長度（秒） */
const AD_DURATION = 5;
/** 後門略過：5 秒內累計 5 次點擊 */
const BACKDOOR_WINDOW = 5000;
const BACKDOOR_CLICKS = 5;

/**
 * 符文磚定義：直接取自 constants.tsx 的 TYPE_CONFIG（Fire/Water/Wood/Earth/Lightning），
 * 圖示與顏色都和遊戲棋盤上的磚完全一致。
 */
const RUNES = [
  { key: 'Fire', Icon: Flame, glyph: 'ᚠ', label: '火', from: '#ef4444', to: '#f97316', glow: 'rgba(239,68,68,0.45)' },
  { key: 'Water', Icon: Droplets, glyph: 'ᚢ', label: '水', from: '#3b82f6', to: '#06b6d4', glow: 'rgba(59,130,246,0.45)' },
  { key: 'Wood', Icon: Leaf, glyph: 'ᚦ', label: '木', from: '#10b981', to: '#22c55e', glow: 'rgba(16,185,129,0.45)' },
  { key: 'Earth', Icon: Mountain, glyph: 'ᚨ', label: '土', from: '#facc15', to: '#fbbf24', glow: 'rgba(250,204,21,0.45)' },
  { key: 'Lightning', Icon: Zap, glyph: 'ᛃ', label: '雷', from: '#a855f7', to: '#d946ef', glow: 'rgba(168,85,247,0.45)' },
];

/** 棋盤空格樣式（取自 GameBoard 的空格漸層） */
const EMPTY_CELL =
  'bg-gradient-to-br from-indigo-950/90 via-blue-950/85 to-slate-950/95 border border-indigo-500/30';

export const SplashAd: React.FC<SplashAdProps> = ({ onFinish, appName = 'RUNIC Synthesis' }) => {
  if (typeof window !== 'undefined' && adResetConfig.token && localStorage.getItem('yesolve_ad_bypass_reset_token') !== adResetConfig.token) {
    localStorage.setItem('yesolve_ad_bypass', 'false');
    localStorage.setItem('yesolve_ad_bypass_reset_token', adResetConfig.token);
  }
  const isBypassed = typeof window !== 'undefined' && localStorage.getItem('yesolve_ad_bypass') === 'true';

  const [countdown, setCountdown] = useState(AD_DURATION);
  const clickTimestampsRef = useRef<number[]>([]);
  /** 廣告槽：原生平台上由 StartupAdPlugin 在這個位置放真正的 AdMob 原生進階廣告 */
  const adSlotRef = useRef<HTMLDivElement | null>(null);

  // 原生平台：廣告槽位置由 StartupAdPlugin 放真正的 AdMob 原生進階廣告。
  // 只在略過狀態變更時掛載／卸載，不隨父層重繪重新請求廣告。
  useEffect(() => {
    if (isBypassed) return;
    showNativeAdInSlot(adSlotRef.current);
    return () => hideNativeAdInSlot();
  }, [isBypassed]);

  useEffect(() => {
    if (isBypassed) {
      onFinish();
      return;
    }

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

  // 後門略過：5 秒內累計 5 次點擊（計分面板 / 贊助符文卡標頭）
  const handleBackdoorClick = () => {
    const now = Date.now();
    clickTimestampsRef.current = clickTimestampsRef.current.filter((t) => now - t <= BACKDOOR_WINDOW);
    clickTimestampsRef.current.push(now);

    if (clickTimestampsRef.current.length >= BACKDOOR_CLICKS) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('yesolve_ad_bypass', 'true');
      }
      onFinish();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999999] pointer-events-auto flex flex-col items-center justify-center gap-3 bg-[#020617] p-4 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 計分面板列（= App 的 分數 / 步數 面板） */}
      <div className="flex w-full max-w-[420px] gap-2">
        <div className="flex-1 rounded-2xl bg-slate-900/80 p-2.5 border border-slate-800 shadow-lg backdrop-blur-sm">
          <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">分數</span>
          <span className="block text-xl font-mono font-bold text-emerald-400 drop-shadow-sm">
            {(AD_DURATION * 100).toLocaleString()}
          </span>
        </div>
        <div className="flex-1 rounded-2xl bg-slate-900/80 p-2.5 border border-slate-800 shadow-lg backdrop-blur-sm">
          <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">步數</span>
          <span className="block text-xl font-mono font-bold text-blue-400 drop-shadow-sm">
            {AD_DURATION - countdown}
          </span>
        </div>
        <div
          onClick={handleBackdoorClick}
          className="cursor-default flex-1 rounded-2xl bg-slate-900/80 p-2.5 border border-amber-500/40 shadow-lg backdrop-blur-sm active:opacity-90"
        >
          <span className="block text-[10px] text-amber-400/80 uppercase font-bold tracking-wider">倒數</span>
          <span className="block text-xl font-mono font-bold text-amber-400 drop-shadow-sm">{countdown}</span>
        </div>
      </div>

      {/* 符文棋盤（= GameBoard 的棋盤 + 符文磚） */}
      <div className="w-full max-w-[420px] rounded-2xl bg-slate-900 shadow-2xl border border-slate-800 p-3">
        <div className="grid grid-cols-3 gap-2">
          {RUNES.map((rune) => (
            <div
              key={rune.key}
              className="relative flex aspect-square items-center justify-center rounded-xl border-2"
              style={{
                background: `linear-gradient(135deg, ${rune.from}, ${rune.to})`,
                borderColor: 'rgba(255,255,255,0.28)',
                boxShadow: `0 0 22px ${rune.glow}, inset 0 2px 8px rgba(255,255,255,0.25)`,
              }}
            >
              <rune.Icon size={30} className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]" strokeWidth={2.2} />
              <span
                className="absolute -bottom-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider"
              >
                {rune.label}
              </span>
            </div>
          ))}
          <div className={`relative flex aspect-square items-center justify-center rounded-xl ${EMPTY_CELL}`} />
          <div className={`relative flex aspect-square items-center justify-center rounded-xl ${EMPTY_CELL}`}>
            <span className="font-mono text-3xl text-slate-700">ᚱ</span>
          </div>
          <div className={`relative flex aspect-square items-center justify-center rounded-xl ${EMPTY_CELL}`} />
        </div>
      </div>

      {/* 贊助符文卡（= CollectionModal 的面板語言） */}
      <div className="w-full max-w-[420px] rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden">
        <div
          onClick={handleBackdoorClick}
          className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-800/40 cursor-default"
        >
          <span className="font-bold text-sm tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200">
            贊助符文
          </span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">SPONSORED</span>
        </div>
        <div className="bg-[#020617] p-3" ref={adSlotRef}>
          <AdSenseSlot slotKey="splash" />
        </div>
      </div>

      <div className="font-mono text-[11px] tracking-[0.18em] text-slate-600">yesolve studio</div>
    </div>
  );
};
