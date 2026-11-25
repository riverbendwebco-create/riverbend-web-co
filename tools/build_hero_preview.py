#!/usr/bin/env python3
"""Swap the homepage hero for the 3D hero (hero3d/).

  python3 tools/build_hero_preview.py            -> writes hero-preview/index.html (noindex preview)
  python3 tools/build_hero_preview.py --apply    -> rewrites index.html itself (only after owner approval)
"""
import sys, os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
hero = open(os.path.join(root, 'hero3d', 'hero.html'), encoding='utf-8').read().strip()

start = src.find('<section class="hero">')
if start < 0:
    sys.exit('old hero not found (already applied?)')
end = src.find('</section>', start) + len('</section>')
out = src[:start] + hero + src[end:]

def once(a, b):
    global out
    assert out.count(a) == 1, a
    out = out.replace(a, b)

once('</head>', '<link rel="preload" as="image" href="/hero3d/img/bar-l.webp" fetchpriority="high" media="(min-width:981px)">\n'
                '<link rel="preload" as="image" href="/hero3d/img/bar-s.webp" fetchpriority="high" media="(max-width:980px)">\n'
                '<link rel="stylesheet" href="/hero3d/hero.css">\n</head>')
once('\n</body>', '\n<script src="/hero3d/hero.js" defer></script>\n<script src="/hero3d/flag.js" defer></script>\n</body>')
once("hero=$('.hero')", "hero=$('.hero,.h3')")

if '--apply' in sys.argv:
    open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(out)
    print('index.html updated')
else:
    once('<link rel="canonical"', '<meta name="robots" content="noindex,nofollow">\n<link rel="canonical"')
    os.makedirs(os.path.join(root, 'hero-preview'), exist_ok=True)
    open(os.path.join(root, 'hero-preview', 'index.html'), 'w', encoding='utf-8').write(out)
    print('hero-preview/index.html written')
