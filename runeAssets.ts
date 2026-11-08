import { RuneLevel, RuneType } from './types';

// Bump whenever sprite artwork changes so existing WebViews cannot reuse old PNGs.
export const RUNE_ASSET_VERSION = '20261108-v2-full-evolution';

export const getRuneImageUrl = (type: RuneType, level: RuneLevel): string => {
  let base = import.meta.env.BASE_URL || '/';
  if (!base.endsWith('/')) {
    base += '/';
  }
  return `${base}runes/${type.toLowerCase()}-lv${level}.png?v=${RUNE_ASSET_VERSION}`;
};

export interface RuneAssetInfo {
  type: RuneType;
  level: RuneLevel;
  url: string;
}

export const ORDERED_ELEMENTS: RuneType[] = [
  RuneType.Water,
  RuneType.Fire,
  RuneType.Wood,
  RuneType.Earth,
  RuneType.Lightning,
];

export const ELEMENT_NAMES: Record<RuneType, string> = {
  [RuneType.Water]: '水元素',
  [RuneType.Fire]: '火元素',
  [RuneType.Wood]: '木元素',
  [RuneType.Earth]: '土元素',
  [RuneType.Lightning]: '雷元素',
};

export const LEVEL_TITLES: Record<RuneLevel, string> = {
  [RuneLevel.Drop]: '滴露 (Drop)',
  [RuneLevel.Gem]: '結晶 (Gem)',
  [RuneLevel.Crystal]: '典籍 (Tome)',
  [RuneLevel.Tome]: '神劍 (Blade)',
  [RuneLevel.Blade]: '終極神龍 (Ultimate)',
};

export const ALL_RUNE_ASSETS: RuneAssetInfo[] = ORDERED_ELEMENTS.flatMap((type) =>
  ([1, 2, 3, 4, 5] as RuneLevel[]).map((level) => ({
    type,
    level,
    url: getRuneImageUrl(type, level),
  }))
);

export const ALL_RUNE_IMAGE_URLS = ALL_RUNE_ASSETS.map((asset) => asset.url);

// 資源狀態快取
const assetCache = new Map<string, { img: HTMLImageElement; status: 'loading' | 'loaded' | 'failed' }>();

export const isRuneAssetLoaded = (type: RuneType, level: RuneLevel): boolean => {
  const url = getRuneImageUrl(type, level);
  return assetCache.get(url)?.status === 'loaded';
};

export const areAllRuneAssetsLoaded = (): boolean => {
  return ALL_RUNE_ASSETS.every((asset) => assetCache.get(asset.url)?.status === 'loaded');
};

export type PreloadProgressCallback = (
  loaded: number,
  total: number,
  failed: number,
  failedUrls: string[]
) => void;

/**
 * 預載 25 張正式符文 PNG 圖片。
 * 真正成功解碼 (decode/load) 才計入 loaded；
 * 失敗時記錄失敗清單，不與成功加總掩蓋問題。
 */
export const preloadRuneImages = (onProgress?: PreloadProgressCallback) => {
  let loaded = 0;
  let failed = 0;
  const failedUrls: string[] = [];
  let disposed = false;
  const total = ALL_RUNE_ASSETS.length;

  const notify = () => {
    if (!disposed && onProgress) {
      onProgress(loaded, total, failed, [...failedUrls]);
    }
  };

  const loadSingle = (asset: RuneAssetInfo) => {
    const existing = assetCache.get(asset.url);
    if (existing?.status === 'loaded') {
      loaded++;
      notify();
      return;
    }

    const image = new Image();
    assetCache.set(asset.url, { img: image, status: 'loading' });

    image.onload = () => {
      if (disposed) return;
      assetCache.set(asset.url, { img: image, status: 'loaded' });
      loaded++;
      notify();
    };

    image.onerror = () => {
      if (disposed) return;
      assetCache.set(asset.url, { img: image, status: 'failed' });
      failed++;
      failedUrls.push(asset.url);
      notify();
    };

    image.src = asset.url;
  };

  ALL_RUNE_ASSETS.forEach(loadSingle);

  // 初次回報
  notify();

  return () => {
    disposed = true;
  };
};

/**
 * 重試載入失敗的資源
 */
export const retryPreloadRuneImages = (onProgress?: PreloadProgressCallback) => {
  // 清理 failed 項目
  ALL_RUNE_ASSETS.forEach((asset) => {
    if (assetCache.get(asset.url)?.status === 'failed') {
      assetCache.delete(asset.url);
    }
  });
  return preloadRuneImages(onProgress);
};
