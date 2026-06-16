from pathlib import Path
import warnings
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ASSETS / "linkedin-featured-portfolio.png"


def font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError as error:
            warnings.warn(
                f"Font candidate unavailable: {candidate}: {error}",
                RuntimeWarning,
                stacklevel=2,
            )
            continue
    return ImageFont.load_default()


F_H1 = font(58, True)
F_H2 = font(30, True)
F_BODY = font(25)
F_SMALL = font(18, True)
F_TINY = font(16, True)


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, fill="#101828", fnt=F_BODY, anchor=None):
    draw.text(xy, value, fill=fill, font=fnt, anchor=anchor)


def pill(draw, xy, label, fill, ink="#ffffff"):
    x, y = xy
    bbox = draw.textbbox((0, 0), label, font=F_SMALL)
    w = bbox[2] - bbox[0] + 28
    rounded(draw, (x, y, x + w, y + 38), 8, fill)
    text(draw, (x + 14, y + 8), label, ink, F_SMALL)
    return x + w + 10


def cover_crop(path, size):
    img = Image.open(path).convert("RGB")
    target_w, target_h = size
    scale = max(target_w / img.width, target_h / img.height)
    resized = img.resize((int(img.width * scale), int(img.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = 0
    return resized.crop((left, top, left + target_w, top + target_h))


def browser_frame(base, xy, size, image_path, title):
    x, y = xy
    w, h = size
    draw = ImageDraw.Draw(base)
    rounded(draw, (x, y, x + w, y + h), 12, "#ffffff", "#d9e0ea", 2)
    draw.rectangle((x + 2, y + 2, x + w - 2, y + 42), fill="#f8fafc")
    for i, color in enumerate(["#cbd5e1", "#cbd5e1", "#cbd5e1"]):
        draw.ellipse((x + 18 + i * 18, y + 17, x + 28 + i * 18, y + 27), fill=color)
    text(draw, (x + w - 18, y + 13), title, "#7a8494", F_TINY, anchor="ra")
    shot = cover_crop(image_path, (w - 4, h - 44))
    base.paste(shot, (x + 2, y + 42))


def main():
    img = Image.new("RGB", (1200, 627), "#f4f6f8")
    draw = ImageDraw.Draw(img)

    draw.rectangle((0, 0, 1200, 627), fill="#f4f6f8")
    draw.polygon([(785, 0), (1200, 0), (1200, 627), (650, 627)], fill="#e7f6f3")
    draw.polygon([(930, 0), (1200, 0), (1200, 627), (1040, 627)], fill="#172033")

    rounded(draw, (52, 54, 112, 114), 12, "#172033")
    text(draw, (82, 72), "MF", "#ffffff", font(24, True), anchor="ma")
    text(draw, (132, 67), "Meidie Fei", "#101828", F_H2)

    rounded(draw, (58, 154, 384, 200), 8, "#e7f6f3")
    text(draw, (78, 166), "SECURITY ANALYST PORTFOLIO", "#0f766e", F_SMALL)

    text(draw, (58, 226), "Security projects", "#101828", F_H1)
    text(draw, (58, 288), "recruiters can open,", "#101828", F_H1)
    text(draw, (58, 350), "test, and review.", "#101828", F_H1)

    text(draw, (58, 436), "PayShield, PhishAnalyze, SecureVote,", "#344054", F_BODY)
    text(draw, (58, 472), "CryptoToolkit, AES Secure Vault, and", "#344054", F_BODY)
    text(draw, (58, 508), "evidence-based security documentation.", "#344054", F_BODY)

    x = 58
    x = pill(draw, (x, 560), "Detection", "#0f766e")
    x = pill(draw, (x, 560), "AppSec", "#2563b8")
    x = pill(draw, (x, 560), "Crypto", "#9a6a00")
    pill(draw, (x, 560), "Cloud", "#172033")

    browser_frame(
        img,
        (690, 80),
        (440, 250),
        ASSETS / "screenshot-payshield.png",
        "payshield.mdpstudio.com.au",
    )
    browser_frame(
        img,
        (610, 318),
        (380, 230),
        ASSETS / "screenshot-phishanalyze.png",
        "phishanalyze.mdpstudio.com.au",
    )
    browser_frame(
        img,
        (865, 365),
        (300, 190),
        ASSETS / "screenshot-cryptotoolkit.png",
        "ctool.mdpstudio.com.au",
    )

    OUT.parent.mkdir(exist_ok=True)
    img.save(OUT, quality=94, optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
