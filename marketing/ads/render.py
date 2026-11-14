import sys
from playwright.sync_api import sync_playwright
out = sys.argv[1]
jobs = [('gift',1200,630,'og-gift'),('app',1200,630,'og'),('gift',1080,1080,'ad-gift-square'),('gift',1080,1920,'ad-gift-story'),('app',1080,1080,'ad-app-square'),('app',1080,1920,'ad-app-story')]
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for k,w,h,name in jobs:
        p = b.new_page(viewport={'width':w,'height':h})
        p.goto(f'file://{out}/ad.html?k={k}&w={w}&h={h}'); p.wait_for_timeout(500)
        p.screenshot(path=f'{out}/{name}.png'); p.close()
    b.close()
