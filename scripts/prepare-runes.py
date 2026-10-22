"""Build the 25 runtime sprites without modifying the supplied originals."""
from pathlib import Path
from collections import deque
import re
from io import BytesIO
import numpy as np
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parents[1]
names = {'01_Water': 'water', '02_Fire': 'fire', '03_Wood': 'wood',
         '04_Earth': 'earth', '05_DarkThunder': 'lightning'}
dest = root / 'public' / 'runes'
dest.mkdir(parents=True, exist_ok=True)
count = 0
def save_sprite(canvas, path):
    canvas.save(path, optimize=True)
    if path.stat().st_size > 100_000:
        for colors in (256, 128, 64, 32):
            buffer = BytesIO()
            canvas.quantize(colors=colors, method=Image.Quantize.FASTOCTREE).convert('RGBA').save(buffer, format='PNG', optimize=True)
            if buffer.tell() <= 100_000:
                path.write_bytes(buffer.getvalue())
                break

for folder, element in names.items():
    for source in sorted((root / 'RunicElements_25' / folder).glob('*.png')):
        level = int(re.search(r'_Lv(\d)_', source.name)[1])
        override = root / 'art' / f'runes-lv{level}' / f'{element}.png'
        if level in (1, 2) and override.exists():
            image = Image.open(override).convert('RGBA')
            image.thumbnail((226, 226), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', (256, 256))
            canvas.paste(image, ((256-image.width)//2, (256-image.height)//2))
            save_sprite(canvas, dest / f'{element}-lv{level}.png')
            count += 1
            continue
        image = Image.open(source).convert('RGBA')
        rgb = np.asarray(image)[:, :, :3].astype(float)
        # Only remove dark pixels connected to the outside. Enclosed dark detail survives.
        brightness = rgb.max(axis=2)
        candidate = brightness < (48 if element in ('water', 'earth') else 38)
        h, w = candidate.shape
        outside = np.zeros((h, w), dtype=bool)
        queue = deque([(0, x) for x in range(w)] + [(h-1, x) for x in range(w)] +
                      [(y, 0) for y in range(h)] + [(y, w-1) for y in range(h)])
        while queue:
            y, x = queue.popleft()
            if outside[y, x] or not candidate[y, x]:
                continue
            outside[y, x] = True
            for yy, xx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
                if 0 <= yy < h and 0 <= xx < w and not outside[yy, xx]:
                    queue.append((yy, xx))
        alpha = Image.fromarray(np.where(outside, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1))
        image.putalpha(alpha)
        image = image.crop(alpha.getbbox())
        image.thumbnail((226, 226), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (256, 256))
        canvas.paste(image, ((256-image.width)//2, (256-image.height)//2))
        save_sprite(canvas, dest / f'{element}-lv{level}.png')
        count += 1
assert count == 25, f'Expected 25 sprites, found {count}'
print(f'Prepared {count} sprites, {sum(p.stat().st_size for p in dest.glob("*.png")) / 1024:.0f} KiB')
