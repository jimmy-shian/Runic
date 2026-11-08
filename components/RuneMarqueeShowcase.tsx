import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { RuneLevel, RuneType } from '../types';
import {
  ORDERED_ELEMENTS,
  ELEMENT_NAMES,
  LEVEL_TITLES,
  getRuneImageUrl,
} from '../runeAssets';
import { TYPE_CONFIG } from '../constants';

interface RuneMarqueeShowcaseProps {
  loadedCount: number;
  totalCount: number;
  failedCount: number;
  onRetry: () => void;
}

/** 每階閃爍停留時間（ms）：25 張 × 200ms = 5 秒，一輪正好對齊開場倒數 */
const FLASH_STEP_MS = 200;

/** 一輪閃爍順序：五元素 × Lv1→Lv5 = 25 連閃（進化順序） */
const FLASH_SEQUENCE: { type: RuneType; level: RuneLevel }[] = ORDERED_ELEMENTS.flatMap(
  (type) => ([1, 2, 3, 4, 5] as RuneLevel[]).map((level) => ({ type, level }))
);

/** 跑馬燈帶狀分割：上半帶 / 下半帶（各複製一份做無縫循環） */
const BANDS: {
  items: { type: RuneType; level: RuneLevel }[];
  direction: 'left' | 'right';
  seconds: number;
}[] = [
  { items: FLASH_SEQUENCE.slice(0, 13), direction: 'left', seconds: 26 },
  { items: FLASH_SEQUENCE.slice(13), direction: 'right', seconds: 24 },
];

interface MarqueeTileProps {
  type: RuneType;
  level: RuneLevel;
  active: boolean;
}

/** 單一符文走帶方塊：active 時依元素色發光放大（閃爍效果） */
const MarqueeTile: React.FC<MarqueeTileProps> = ({ type, level, active }) => {
  const solidColor = TYPE_CONFIG[type].solidColor;
  return (
    <div
      className={
        `relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl border overflow-hidden ` +
        `bg-slate-900/80 flex items-center justify-center transition-all duration-150 ` +
        (active ? 'scale-110 z-10' : 'border-slate-800/70 opacity-80')
      }
      style={
        active
          ? {
              borderColor: solidColor,
              boxShadow: `0 0 16px ${solidColor}B3, inset 0 0 10px ${solidColor}66`,
            }
          : undefined
      }
    >
      <img
        src={getRuneImageUrl(type, level)}
        alt={`符文 Lv.${level}`}
        draggable={false}
        className="w-[86%] h-[86%] object-contain pointer-events-none"
      />
      <span className="absolute bottom-0 right-0 px-1 text-[9px] font-mono font-bold leading-tight rounded-tl-md bg-slate-950/85 text-slate-400">
        {level}
      </span>
    </div>
  );
};

/**
 * 開場封面「跑馬燈全覽版面」（取代單張輪播）：
 * - 兩條反向跑馬燈帶，25 張符文同場滾動展示（而非一次一張）
 * - 內建 25 連閃序列：每 200ms 依進化順序點亮一張，5 秒熱完一輪（對齊廣告倒數）
 * - 不使用固定 min-height，避免擠壓上下導覽列區
 */
export const RuneMarqueeShowcase: React.FC<RuneMarqueeShowcaseProps> = ({
  loadedCount,
  totalCount,
  failedCount,
  onRetry,
}) => {
  const [flashIndex, setFlashIndex] = useState(0);

  // 25 連閃計時：FLASH_STEP_MS × 25 = 5 秒一輪
  useEffect(() => {
    const timer = setInterval(() => {
      setFlashIndex((prev) => (prev + 1) % FLASH_SEQUENCE.length);
    }, FLASH_STEP_MS);
    return () => clearInterval(timer);
  }, []);

  const active = FLASH_SEQUENCE[flashIndex];
  const activeConfig = TYPE_CONFIG[active.type];
  const ready = loadedCount >= totalCount && failedCount === 0;
  const percent = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;

  const bands = useMemo(() => BANDS, []);

  return (
    <div className="w-full flex flex-col items-center gap-2.5 select-none py-2">
      {/* 頂部：品牌標題 */}
      <div className="flex flex-col items-center shrink-0">
        <h2 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-300 to-amber-300">
          RUNIC SYNTHESIS
        </h2>
        <p className="text-[10px] text-slate-500 tracking-[0.25em] uppercase mt-0.5">
          五元素進化 · 25 張全覽跑馬燈
        </p>
      </div>

      {/* 中央：雙向跑馬燈帶（一次顯示多張，無縫循環） */}
      <div className="w-full flex flex-col gap-1.5">
        {bands.map((band) => (
          <div
            key={band.direction}
            className="relative w-full overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/70 py-1.5"
          >
            <div
              className="runic-marquee-track flex w-max items-center gap-2 will-change-transform"
              style={{
                animation: `${band.direction === 'left' ? 'runic-marquee-left' : 'runic-marquee-right'} ${band.seconds}s linear infinite`,
              }}
            >
              {/* 內容複製兩份 → 位移 -50% 形成無縫循環 */}
              {[0, 1].map((copy) =>
                band.items.map(({ type, level }, index) => (
                  <MarqueeTile
                    key={`${band.direction}-${copy}-${index}`}
                    type={type}
                    level={level}
                    active={active.type === type && active.level === level}
                  />
                ))
              )}
            </div>
            {/* 左右漸暈，讓走帶自然隱沒於版面邊緣 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#040816] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#040816] to-transparent" />
          </div>
        ))}
      </div>

      {/* 連閃字幕：同步顯示當前被點亮的符文進化階段 */}
      <div className="flex items-center justify-center gap-2 min-h-[26px] shrink-0">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: activeConfig.solidColor,
            boxShadow: `0 0 8px ${activeConfig.solidColor}`,
          }}
        />
        <span
          key={`${active.type}-${active.level}`}
          className="runic-caption text-xs font-medium text-slate-200"
        >
          正在凝聚 {ELEMENT_NAMES[active.type]} ·{' '}
          <span className="font-mono font-bold" style={{ color: activeConfig.solidColor }}>
            Lv.{active.level}
          </span>{' '}
          {LEVEL_TITLES[active.level]}
        </span>
        <span className="hidden sm:inline text-[9px] text-slate-500 font-mono shrink-0">
          25 連閃 / 5s
        </span>
      </div>

      {/* 底部：素材載入進度（緊湊列，不佔用固定高度） */}
      <div className="w-full max-w-[300px] shrink-0">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
          <span>符文素材</span>
          <span className={ready ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {ready ? '全部就緒' : `${loadedCount}/${totalCount} (${percent}%)`}
          </span>
        </div>
        <div className="h-1.5 mt-1 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        {failedCount > 0 && (
          <button
            onClick={onRetry}
            className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/60 rounded-lg px-2.5 py-1 mx-auto hover:text-amber-300 active:scale-95 transition"
          >
            <RotateCcw className="w-3 h-3" />
            {failedCount} 個素材受阻，點此重試
          </button>
        )}
      </div>
    </div>
  );
};
