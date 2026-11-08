#!/usr/bin/env python3
"""Turn a GPT species illustration on a plain light background into a transparent cut-out
that matches the existing art in public/species (fish facing left, about 370 px wide, webp).

Usage: python3 scripts/cutout_species.py <input image> <species-id> [--flip]
"""
import sys
from collections import deque
from PIL import Image, ImageFilter
import numpy as np

TARGET_W = 370


def cutout(src, out, flip=False):
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    # Background colour: median of the border pixels.
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    near = dist < 28
    # Flood fill from the edges through background-coloured pixels only, so pale bellies stay.
    mask = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not mask[y, x]:
                mask[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not mask[y, x]:
                mask[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not mask[ny, nx]:
                mask[ny, nx] = True; q.append((ny, nx))
    alpha = Image.fromarray(np.where(mask, 0, 255).astype(np.uint8))
    # Soften the edge a touch; fade pixels that are close to the background colour.
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    rgba = im.copy(); rgba.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 20 else 0).getbbox()
    rgba = rgba.crop(box)
    if flip:
        rgba = rgba.transpose(Image.FLIP_LEFT_RIGHT)
    r = TARGET_W / rgba.width
    rgba = rgba.resize((TARGET_W, max(1, round(rgba.height * r))), Image.LANCZOS)
    rgba.save(out, 'WEBP', quality=88, method=6)
    return rgba.size


if __name__ == '__main__':
    src, sid = sys.argv[1], sys.argv[2]
    print(cutout(src, f'public/species/{sid}.webp', flip='--flip' in sys.argv))
