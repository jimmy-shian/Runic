import React, { useState, useRef } from 'react';

interface EdgeAdBannerProps {
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const EdgeAdBanner: React.FC<EdgeAdBannerProps> = ({ position }) => {
  const isBypassed = typeof window !== 'undefined' && localStorage.getItem('yesolve_ad_bypass') === 'true';
  const [dismissed, setDismissed] = useState(false);
  const clickTimestampsRef = useRef<number[]>([]);

  if (isBypassed || dismissed) return null;

  const isHorizontal = position === 'left' || position === 'right';

  // Secret 5-click backdoor within 3000ms
  const handleBackdoorClick = () => {
    const now = Date.now();
    clickTimestampsRef.current = clickTimestampsRef.current.filter((t) => now - t <= 3000);
    clickTimestampsRef.current.push(now);

    if (clickTimestampsRef.current.length >= 5) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('yesolve_ad_bypass', 'true');
      }
      setDismissed(true);
    }
  };

  return (
    <div
      onClick={handleBackdoorClick}
      className={`bg-[#0D1527]/95 border border-blue-500/30 rounded-xl flex items-center justify-center relative overflow-hidden select-none shrink-0 shadow-lg shadow-blue-950/30 cursor-default ${
        isHorizontal
          ? 'w-full h-24 my-2 flex-col p-2 text-center'
          : 'w-full max-w-sm h-12 my-1.5 px-3'
      }`}
    >
      <div className="absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] bg-slate-800 text-slate-400 font-mono border border-slate-700">
        AD
      </div>

      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: isHorizontal ? '60px' : '36px' }}
        data-ad-client="ca-pub-2415998114933157"
        data-ad-slot="(待補)"
        data-ad-format="auto"
      ></ins>

      <div className="flex items-center space-x-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
        <span className="text-[10px] text-blue-400 font-bold">yesolve studio</span>
        <span className="text-[9px] text-amber-300 font-medium">奧術贊助展示</span>
      </div>
    </div>
  );
};
