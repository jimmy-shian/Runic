import React, { useEffect } from 'react';
import { requestAdFill, useAdSenseSlot, type AdSlotKey } from '../src/lib/adsense';

interface AdSenseSlotProps {
  slotKey: AdSlotKey;
  /** 緊湊模式（邊緣橫幅等狹窄容器）：單行佔位板。 */
  compact?: boolean;
}

/**
 * 廣告載體。
 *
 * - 網頁版且 slot id 已設定、且 AdSense script 載入完成 → 渲染 <ins> 並 push() 填充
 * - 原生平台 / slot 未設定 / script 載入失敗或逾時 → 渲染品牌佔位板
 *
 * 兩者都不會出現「永遠空白的死 <ins> 框」，也不會曝露 ad unit id。
 * layout / format 由 adsense-config.json 的 slotOptions 提供，
 * 例如 in-article 多媒體廣告 → layout: "in-article", format: "fluid"。
 */
export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({ slotKey, compact = false }) => {
  const { client, slot, layout, format, renderable } = useAdSenseSlot(slotKey);

  // <ins> 動態掛載後再 push 一次，確保它進入 AdSense 的填充佇列
  useEffect(() => {
    if (renderable) requestAdFill();
  }, [renderable]);

  if (!renderable) {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600">
          <span className="h-1 w-6 rounded-full bg-slate-700" />
          廣告載位
        </div>
      );
    }
    return (
      <div className="flex min-h-[100px] w-full flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-[#1E293B] bg-[#0A1220] px-4 py-3 text-center">
        <div className="h-[3px] w-[120px] rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70" />
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">廣告載位 · 贊助支持</div>
      </div>
    );
  }

  return (
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
