import React, { useEffect, useState } from 'react';
import { requestAdFill, useAdSenseSlot, type AdSlotKey } from '../src/lib/adsense';

interface AdSenseSlotProps {
  slotKey: AdSlotKey;
  /** 緊湊模式（邊緣橫幅等狹窄容器）：單行佔位板。 */
  compact?: boolean;
  /** 固定尺寸模式：不讓 AdSense 自動 responsive 重排（auto+responsive 會被 script 搬走 DOM） */
  fixed?: boolean;
  /** fixed 模式下的高度（px） */
  fixedHeight?: number;
}

/**
 * 廣告載體（R-AD02）
 * - 網頁版且 slot id 已設定、且 AdSense script 載入完成 → 渲染 <ins> 並 push() 填充
 * - fixed 模式：明確寬高 + data-ad-format="fixed"，Google 保守對待尺寸、不進行容器重排
 * - 載入中 → 渲染低對比 Skeleton 骨架
 * - 失敗或無填充 → 不持續佔用大塊空間，平滑收合或微縮
 */
export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotKey,
  compact = false,
  fixed = false,
  fixedHeight = 100,
}) => {
  const { client, slot, layout, format, renderable } = useAdSenseSlot(slotKey);
  const [failed, setFailed] = useState(false);

  // <ins> 動態掛載後進入填充佇列
  useEffect(() => {
    if (renderable) {
      try {
        requestAdFill();
      } catch (err) {
        setFailed(true);
      }
    }
  }, [renderable]);

  if (failed) return null;

  if (!renderable) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" />
          <span>贊助資訊準備中</span>
        </div>
      );
    }
    return (
      <div className="w-full flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-900/60 p-3 min-h-[90px]">
        <div className="w-3/4 h-2.5 rounded bg-slate-800 animate-pulse" />
        <div className="w-1/2 h-2 rounded bg-slate-800/60 animate-pulse" />
      </div>
    );
  }

  return fixed ? (
    <ins
      className="adsbygoogle"
      style={{ display: 'inline-block', textAlign: 'center', width: '100%', height: fixedHeight }}
      data-ad-layout={layout}
      data-ad-format="fixed"
      data-ad-client={client}
      data-ad-slot={slot}
    />
  ) : (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', textAlign: 'center', width: '100%' }}
      data-ad-layout={layout}
      data-ad-format={format ?? 'auto'}
      data-ad-client={client}
      data-ad-slot={slot}
      data-full-width-responsive="true"
    />
  );
};
