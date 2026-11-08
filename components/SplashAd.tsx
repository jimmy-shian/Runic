import adResetConfig from '../ad-reset-config.json';
import React, { useState, useEffect, useRef } from 'react';
import { showNativeAdInSlot, hideNativeAdInSlot } from '../src/lib/startup-ad';
import { AdSenseSlot } from './AdSenseSlot';
import { RuneMarqueeShowcase } from './RuneMarqueeShowcase';

interface SplashAdProps {
  onFinish: () => void;
  appName?: string;
  loadedCount: number;
  totalCount: number;
  failedCount: number;
  onRetryAssets: () => void;
}

/** 統一倒數長度（秒） */
const AD_DURATION = 5;
/** 後門略過：5 秒內累計 5 次點擊 */
const BACKDOOR_WINDOW = 5000;
const BACKDOOR_CLICKS = 5;

/**
 * Runic 開場載入與廣告整合系統（R-01, R-04, R-05, R-AD01）：
 * - 中央主視覺改為「跑馬燈全覽版面」：25 張符文同場滾動 + 5 秒內 25 連閃（不再一張張輪播趕不完）
 * - 上下方導覽列（系統狀態列 / 手勢列）以 safe-area 明確預留，中央內容不再吃掉其空間
 * - 分離廣告生命週期與資源載入生命週期
 * - 廣告倒數結束且資源就緒後直接進入遊戲
 */
export const SplashAd: React.FC<SplashAdProps> = ({
  onFinish,
  loadedCount,
  totalCount,
  failedCount,
  onRetryAssets,
}) => {
  if (
    typeof window !== 'undefined' &&
    adResetConfig.token &&
    localStorage.getItem('yesolve_ad_bypass_reset_token') !== adResetConfig.token
  ) {
    localStorage.setItem('yesolve_ad_bypass', 'false');
    localStorage.setItem('yesolve_ad_bypass_reset_token', adResetConfig.token);
  }
  const isBypassed =
    typeof window !== 'undefined' && localStorage.getItem('yesolve_ad_bypass') === 'true';

  const [countdown, setCountdown] = useState(AD_DURATION);
  const [adFinished, setAdFinished] = useState(false);
  const clickTimestampsRef = useRef<number[]>([]);
  const adSlotRef = useRef<HTMLDivElement | null>(null);

  // 原生廣告掛載
  useEffect(() => {
    if (isBypassed) return;
    showNativeAdInSlot(adSlotRef.current);
    return () => hideNativeAdInSlot();
  }, [isBypassed]);

  // 倒數計時（生命週期獨立）
  useEffect(() => {
    if (isBypassed) {
      setAdFinished(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAdFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBypassed]);

  // 當廣告已完成（且若資源已齊備）自動進入遊戲
  const assetsReady = loadedCount >= totalCount && failedCount === 0;
  useEffect(() => {
    if (adFinished && assetsReady) {
      onFinish();
    }
  }, [adFinished, assetsReady, onFinish]);

  if (isBypassed) return null;

  // 後門略過：5 秒內累計 5 次點擊
  const handleBackdoorClick = () => {
    const now = Date.now();
    clickTimestampsRef.current = clickTimestampsRef.current.filter(
      (t) => now - t <= BACKDOOR_WINDOW
    );
    clickTimestampsRef.current.push(now);

    if (clickTimestampsRef.current.length >= BACKDOOR_CLICKS) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('yesolve_ad_bypass', 'true');
      }
      setAdFinished(true);
      onFinish();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999999] pointer-events-auto flex flex-col items-center bg-[#040816] px-4 select-none overflow-y-auto"
      style={{
        // 上下方導覽列區預留：以系統 safe-area 為底再加基本內距，中央內容不得吃掉此區
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 頂部操作/倒數欄（shrink-0：永不被壓縮） */}
      <div className="w-full max-w-[440px] shrink-0 flex items-center justify-between pt-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-slate-400 tracking-wider">
            {assetsReady ? '資源已就緒' : '素材準備中'}
          </span>
        </div>

        <div
          onClick={handleBackdoorClick}
          className="cursor-default flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono"
        >
          <span className="text-slate-400 text-[10px]">倒數</span>
          <span className="text-amber-400 font-bold">{countdown}s</span>
        </div>
      </div>

      {/* 中央主視覺：跑馬燈全覽版面（min-h-0 讓中央自適應，不擠壓上下導覽列） */}
      <div className="w-full max-w-[440px] flex-1 min-h-0 flex items-center justify-center py-1">
        <RuneMarqueeShowcase
          loadedCount={loadedCount}
          totalCount={totalCount}
          failedCount={failedCount}
          onRetry={onRetryAssets}
        />
      </div>

      {/* 底部：贊助廣告卡片（乾淨單層邊框，無重複標籤與大黑框；shrink-0：永不被壓縮） */}
      <div className="w-full max-w-[440px] shrink-0 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden mb-2">
        <div
          onClick={handleBackdoorClick}
          className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800/80 bg-slate-800/30 text-xs cursor-default"
        >
          <span className="font-bold text-slate-300 tracking-wide">
            贊助內容
          </span>
          <span className="text-[10px] text-slate-500 font-mono tracking-wider">
            SPONSORED
          </span>
        </div>
        {/* 鎖定的廣告容器：容器高度用 inline style 釘死；內容改為 absolute 定位，
            AdSense 無論自己怎麼重排 / 搬走 <ins>，都動不了這個容器的高度與版面 */}
        <div
          className="relative"
          style={{ height: 112, overflow: 'hidden' }}
          ref={adSlotRef}
        >
          <div className="absolute inset-2.5">
            <AdSenseSlot slotKey="splash" fixed fixedHeight={92} />
          </div>
        </div>
      </div>

      <div className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-slate-600 pb-1">
        YESOLVE STUDIO
      </div>
    </div>
  );
};
