"""Export web and Android launcher assets from the generated master. Requires Pillow."""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art/app-icon/master.png"
BACKGROUND = "#080f20"
DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}


def resize(image, size):
    return image.resize((size, size), Image.Resampling.LANCZOS)


def main():
    with Image.open(SOURCE) as original:
        if original.width != original.height:
            raise ValueError("The icon master must be square")
        master = original.convert("RGB")

    web = ROOT / "public/icons"
    web.mkdir(parents=True, exist_ok=True)
    for name, size in {
        "favicon-16.png": 16,
        "favicon-32.png": 32,
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
    }.items():
        resize(master, size).save(web / name, optimize=True)
    resize(master, 256).save(
        ROOT / "public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (256, 256)]
    )

    res = ROOT / "android/app/src/main/res"
    # Android crops a 108dp adaptive layer to a launcher mask. Padding keeps
    # the complete emblem inside the central 66dp safe area, even in a circle.
    adaptive = Image.new("RGB", (1080, 1080), BACKGROUND)
    adaptive.paste(resize(master, 864), (108, 108))
    for density, scale in DENSITIES.items():
        folder = res / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)
        size = round(48 * scale)
        legacy = resize(master, size)
        legacy.save(folder / "ic_launcher.webp", lossless=True)
        # Antialias the circular legacy icon independently from the image.
        mask = Image.new("L", (size * 4, size * 4))
        ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
        rounded = legacy.convert("RGBA")
        rounded.putalpha(resize(mask, size))
        rounded.save(folder / "ic_launcher_round.webp", lossless=True)
        resize(adaptive, round(108 * scale)).save(
            folder / "ic_launcher_foreground.webp", lossless=True
        )
    resize(master, 512).save(
        ROOT / "android/app/src/main/ic_launcher-playstore.png", optimize=True
    )
    print("Exported web icons, 5 Android densities, adaptive layers and store icon.")


if __name__ == "__main__":
    main()
