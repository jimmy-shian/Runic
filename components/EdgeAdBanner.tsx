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
 * 邊緣橫幅（R-AD02）：
 * 手機直向位於棋盤上下邊緣，橫向位於兩側。
 * 若使用者略過或確定無廣告填充，回收佔位空間，不擠壓棋盤。
 */
export const EdgeAdBanner: React.FC<EdgeAdBannerProps> = ({ position }) => {
  const isBypassed = typeof window !== 'undefined' && localStorage.getItem('yesolve_ad_bypass') === 'true';
  const [dismissed, setDismissed] = useState(false);
  const clickTimestampsRef = useRef<number[]>([]);
  const adSlotRef = useRef<HTMLDivElement | null>(null);

  // 原生廣告槽接手
  useEffect(() => {
    const recover = () => {
      if (isBypassed || dismissed) return;
      showNativeAdInSlot(adSlotRef.current, 'banner');
    };
    return onNativeAdHidden(recover);
  }, [isBypassed, dismissed, position]);

  useEffect(() => {
    if (isBypassed || dismissed) return;
    showNativeAdInSlot(adSlotRef.current, 'banner');
    return () => hideNativeAdInSlot();
  }, [isBypassed, dismissed, position]);

  if (isBypassed || dismissed) return null;

  const isVertical = position === 'left' || position === 'right';

  // 後門略過
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
        'flex shrink-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 select-none cursor-default transition-all duration-300',
        isVertical ? 'my-1.5 h-20 w-full' : 'my-1 h-12 w-full max-w-sm mx-auto',
      ].join(' ')}
    >
      {/* 標頭 */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-800/40 px-2 py-0.5">
        <div className="flex items-center gap-1">
          <span className="font-mono text-[9px] font-bold text-amber-400">ᚱ</span>
          <span className="font-mono text-[8px] uppercase tracking-wider text-slate-400">
            贊助內容
          </span>
        </div>
        <span className="font-mono text-[7px] text-slate-600">
          yesolve studio
        </span>
      </div>

      {/* 廣告載體：fixed 格式避免 Google 對 responsive auto <ins> 做容器重排（會把外框撐爆成跑版） */}
      <div
        ref={adSlotRef}
        className="flex min-h-0 flex-1 items-center justify-center bg-slate-950/40 px-2 py-0.5"
      >
        <AdSenseSlot slotKey="banner" compact fixed fixedHeight={isVertical ? 48 : 32} />
      </div>
    </div>
  );
};
