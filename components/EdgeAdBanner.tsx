import React, { useEffect, useState, useRef } from 'react';
import { AdSenseSlot } from './AdSenseSlot';
import { showNativeAdInSlot, hideNativeAdInSlot, onNativeAdHidden } from '../src/lib/startup-ad';

interface EdgeAdBannerProps {
  position: 'top' | 'bottom' | 'left' | 'right';
}

/** 後門略過：5 秒內累計 5 次點擊 */
const BACKDOOR_WINDOW = 5000;
const BACKDOOR_CLICKS = 5;

/**
 * 邊緣橫幅：長成棋盤旁的一塊符文石板，
 * 品牌列在上、廣告槽在下，避免與廣告槽在同一列互相擠壓。
 */
export const EdgeAdBanner: React.FC<EdgeAdBannerProps> = ({ position }) => {
  const isBypassed = typeof window !== 'undefined' && localStorage.getItem('yesolve_ad_bypass') === 'true';
  const [dismissed, setDismissed] = useState(false);
  const clickTimestampsRef = useRef<number[]>([]);
  /** 廣告槽：原生平台上由 StartupAdPlugin 在這個位置放真正的 AdMob 原生進階廣告 */
  const adSlotRef = useRef<HTMLDivElement | null>(null);

  // 原生層只有一個：開場 SplashAd 先用，這裡讓位；Splash 收掉派發事件後依目前可見狀態接手。
  useEffect(() => {
    const recover = () => {
      if (isBypassed || dismissed) return;
      showNativeAdInSlot(adSlotRef.current, 'banner');
    };
    return onNativeAdHidden(recover);
  }, [isBypassed, dismissed, position]);

  // 掛載時請求、關閉時釋放原生廣告層；不因父層重繪重複請求。
  useEffect(() => {
    if (isBypassed || dismissed) return;
    showNativeAdInSlot(adSlotRef.current, 'banner');
    return () => hideNativeAdInSlot();
  }, [isBypassed, dismissed, position]);

  if (isBypassed || dismissed) return null;

  const isVertical = position === 'left' || position === 'right';

  // 後門略過：5 秒內累計 5 次點擊
  const handleBackdoorClick = () => {
    const now = Date.now();
    clickTimestampsRef.current = clickTimestampsRef.current.filter((t) => now - t <= BACKDOOR_WINDOW);
    clickTimestampsRef.current.push(now);

    if (clickTimestampsRef.current.length >= BACKDOOR_CLICKS) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('yesolve_ad_bypass', 'true');
      }
      setDismissed(true);
    }
  };

  return (
    <div
      onClick={handleBackdoorClick}
      className={[
        'flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 select-none cursor-default',
        isVertical ? 'my-2 h-24' : 'my-1.5 h-14 max-w-sm',
      ].join(' ')}
    >
      {/* 品牌列：符文石板刻字 */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-800/40 px-2 py-1">
        <span className="font-mono text-[10px] font-black text-amber-400/90">ᚱ</span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber-300/80">
          贊助符文
        </span>
        <span className="ml-auto truncate font-mono text-[8px] tracking-[0.1em] text-slate-500">
          yesolve studio
        </span>
      </div>

      {/* 廣告載體 */}
      <div
        ref={adSlotRef}
        className="flex min-h-0 flex-1 items-center justify-center bg-slate-950/60 px-1.5 py-1"
      >
        <AdSenseSlot slotKey="banner" compact />
      </div>
    </div>
  );
};
