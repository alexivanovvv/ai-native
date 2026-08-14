#!/usr/bin/env python3
"""
Standalone cover image generator for social posts.
Usage:
  python3 make_image.py \
    --main "синергист" \
    --sub "этап ego development theory" \
    --top "@ponchiknews" \
    --bottom "ego dev · алексей иванов" \
    --out /path/to/image.png
    [--bg "#EAE2D5"] [--accent "#CC785C"] [--text "#191919"] [--desc "#666663"] [--labels "#777777"]
"""
import argparse, os
from PIL import Image, ImageDraw, ImageFont

SKILL_DIR = os.path.dirname(os.path.abspath(__file__))

def lf(name, size):
    for path in [
        os.path.join(SKILL_DIR, name),
        f"/tmp/jbmono/fonts/ttf/{name}",
        "/System/Library/Fonts/Menlo.ttc",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()

def tw(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2]-bb[0], bb[3]-bb[1], bb[0], bb[1]

def fit_font(draw, text, max_w, max_size=180, min_size=48):
    size = max_size
    while size >= min_size:
        f = lf("JetBrainsMono-Bold.ttf", size)
        w, _, _, _ = tw(draw, text, f)
        if w <= max_w:
            return f
        size -= 4
    return lf("JetBrainsMono-Bold.ttf", min_size)

def make_image(main, sub, top_label, bottom_label, out,
               bg="#EAE2D5", accent="#CC785C", text_col="#191919",
               desc_col="#666663", label_col="#777777",
               width=1280, height=720):

    W, H = width, height
    img  = Image.new("RGB", (W, H), bg)
    draw = ImageDraw.Draw(img)

    font_desc   = lf("JetBrainsMono-Regular.ttf", 36)
    font_footer = lf("JetBrainsMono-Regular.ttf", 20)

    # split slash from the rest of main
    if main.startswith("/"):
        slash_str = "/"
        slug_str  = main[1:]
    else:
        slash_str = ""
        slug_str  = main

    full = slash_str + slug_str
    font_nm = fit_font(draw, full, int(W * 0.88))

    if slash_str:
        sw, sh, sox, soy = tw(draw, slash_str, font_nm)
    else:
        sw, sh, sox, soy = 0, 0, 0, 0
    nw, nh, nox, noy = tw(draw, slug_str, font_nm)
    total_w = sw + nw
    text_h  = sh if slash_str else nh   # actual rendered height

    dw, dh, dox, doy = tw(draw, sub, font_desc)

    gap1, gap2 = 30, 26
    block_h   = text_h + gap1 + 2 + gap2 + dh
    block_top = (H - block_h) // 2

    base_x = (W - total_w) // 2

    if slash_str:
        draw.text((base_x - sox, block_top - soy), slash_str, font=font_nm, fill=accent)
        draw.text((base_x + sw - nox, block_top - noy), slug_str, font=font_nm, fill=text_col)
    else:
        draw.text((base_x - nox, block_top - noy), slug_str, font=font_nm, fill=text_col)

    rule_y = block_top + text_h + gap1
    rule_w = min(total_w, int(W * 0.44))
    draw.line([(W//2 - rule_w//2, rule_y), (W//2 + rule_w//2, rule_y)], fill=accent, width=2)

    draw.text(((W - dw)//2 - dox, rule_y + gap2 - doy), sub, font=font_desc, fill=desc_col)

    if top_label:
        tlw, tlh, tlox, tloy = tw(draw, top_label, font_footer)
        draw.text(((W - tlw)//2 - tlox, 40 - tloy), top_label, font=font_footer, fill=label_col)

    if bottom_label:
        blw, blh, blox, bloy = tw(draw, bottom_label, font_footer)
        draw.text(((W - blw)//2 - blox, H - 50 - bloy), bottom_label, font=font_footer, fill=label_col)

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    img.save(out, "PNG", optimize=True)
    print(f"Saved: {out}")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--main",    required=True,  help="Main word/phrase (use / prefix for command style)")
    p.add_argument("--sub",     required=True,  help="Subtitle / descriptor")
    p.add_argument("--top",     default="",     help="Top label (e.g. @channel)")
    p.add_argument("--bottom",  default="",     help="Bottom label (e.g. brand name)")
    p.add_argument("--out",     required=True,  help="Output path (.png)")
    p.add_argument("--bg",      default="#EAE2D5")
    p.add_argument("--accent",  default="#CC785C")
    p.add_argument("--text",    default="#191919")
    p.add_argument("--desc",    default="#666663")
    p.add_argument("--labels",  default="#777777")
    p.add_argument("--width",   type=int, default=1280)
    p.add_argument("--height",  type=int, default=720)
    a = p.parse_args()
    make_image(a.main, a.sub, a.top, a.bottom, a.out,
               a.bg, a.accent, a.text, a.desc, a.labels, a.width, a.height)
