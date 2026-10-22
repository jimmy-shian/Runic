import { RuneLevel, RuneType } from './types';

export const getRuneImageUrl = (type: RuneType, level: RuneLevel) =>
  `${import.meta.env.BASE_URL}runes/${type.toLowerCase()}-lv${level}.png`;

export const ALL_RUNE_IMAGE_URLS = Object.values(RuneType).flatMap(type =>
  [1, 2, 3, 4, 5].map(level => getRuneImageUrl(type, level)));

export const preloadRuneImages = (onEach: (loaded: number, total: number, failed: number) => void) => {
  let loaded = 0;
  let failed = 0;
  let disposed = false;
  const pending = new Set<() => void>();
  const images = ALL_RUNE_IMAGE_URLS.map(url => {
    const image = new Image();
    const settle = (ok: boolean) => {
      if (!pending.delete(timeout)) return;
      image.onload = image.onerror = null;
      if (ok) loaded++; else failed++;
      if (!disposed) onEach(loaded, ALL_RUNE_IMAGE_URLS.length, failed);
    };
    const timeout = () => settle(false);
    pending.add(timeout);
    image.onload = () => settle(true);
    image.onerror = timeout;
    image.src = url;
    return image;
  });
  const timer = setTimeout(() => [...pending].forEach(expire => expire()), 10_000);
  return () => {
    disposed = true;
    clearTimeout(timer);
    images.forEach(image => { image.onload = image.onerror = null; });
    pending.clear();
  };
};
