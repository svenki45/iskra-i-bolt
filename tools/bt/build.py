#!/usr/bin/env python3
"""Собирает тестовую Steam-версию «Испытания» (desktop-bt/index.html) из исходника игры.

Исходник игры не меняется: берётся mobile-app/www/index.html, в копии делаются точечные
замены и внутрь кода вставляется tools/bt/bt.js. Запуск из корня репозитория:
    python3 tools/bt/build.py
"""
import re, sys, pathlib, datetime
try:
    sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = pathlib.Path(__file__).resolve().parents[2]
src = (ROOT / 'mobile-app/www/index.html').read_text(encoding='utf-8')
bt = (ROOT / 'tools/bt/bt.js').read_text(encoding='utf-8')
n = int(re.search(r'/\*BT_N=(\d+)\*/', bt).group(1))

def sub(old, new):
    global src
    c = src.count(old)
    if c != 1:
        sys.exit(f'build.py: ожидалось 1 совпадение, найдено {c}: {old[:70]}')
    src = src.replace(old, new)

sub('<script>window.MOBILE_BUILD=true;</script>', '<script>window.MOBILE_BUILD=false;window.BT_BUILD=true;</script>')
try:
    from zoneinfo import ZoneInfo
    now = datetime.datetime.now(ZoneInfo('Europe/Kyiv'))
except Exception:
    now = datetime.datetime.utcnow() + datetime.timedelta(hours=2)
stamp = now.strftime('%d.%m %H:%M')
src, k = re.subn(r'const BUILD_STAMP="[^"]*";', f'const BUILD_STAMP="{stamp}";', src)
if k != 1:
    sys.exit('build.py: не найден BUILD_STAMP')
sub('<title>Искра и Болт</title>', '<title>Искра и Болт — испытания</title>')
sub('const TOTAL=100;', f'const TOTAL={n};')
# камера: испытания задают свой зум и сдвиг вперёд (BTX объявлен в bt.js через var)
sub('const want=Math.max(1,Math.min(1.45,VW/(x1-x0+620),VH/(y1-y0+380)));',
    'const want=BTX.z||Math.max(1,Math.min(1.8,VW/(x1-x0+440),VH/(y1-y0+270)));')
sub('const cx=live.reduce((a,p)=>a+p.x+p.w/2,0)/live.length;',
    'const cx=live.reduce((a,p)=>a+p.x+p.w/2,0)/live.length+BTX.lx;')
sub('const cy=live.reduce((a,p)=>a+p.y+p.h/2,0)/live.length;',
    'const cy=(BTX.fy!=null?BTX.fy:live.reduce((a,p)=>a+p.y+p.h/2,0)/live.length)+BTX.ly;')
sub('const starPar=L=>L.boss?150:(solo?35:40);', 'const starPar=L=>L.par||(L.boss?150:(solo?35:40));')
sub("v.textContent='v'+GAME_VER+' · сборка '", "v.textContent='Испытания (тест) · v'+GAME_VER+' · сборка '")
# длинные трассы (300–400 клеток): слои фона в 1×, иначе холст ~32000 px и сотни МБ памяти
sub("staticLayer.width=WW*2; staticLayer.height=WH*2;\n  let g=staticLayer.getContext('2d'); g.setTransform(2,0,0,2,0,0);",
    "const SS=WW>8200?1:2; staticLayer.width=WW*SS; staticLayer.height=WH*SS;\n  let g=staticLayer.getContext('2d'); g.setTransform(SS,0,0,SS,0,0);")
sub("wallLayer.width=WW*2; wallLayer.height=WH*2; g=wallLayer.getContext('2d'); g.setTransform(2,0,0,2,0,0);",
    "wallLayer.width=WW*SS; wallLayer.height=WH*SS; g=wallLayer.getContext('2d'); g.setTransform(SS,0,0,SS,0,0);")
sub("\nconst GAME_VER=",'\n' + bt + '\nconst GAME_VER=')

out = ROOT / 'desktop-bt/index.html'
out.write_text(src, encoding='utf-8')
print(f'desktop-bt/index.html готов: {len(src)//1024} КБ, испытаний: {n}')

# ---- веб-версия для телефона (iPhone/Android): страница bt/ на GitHub Pages, тот же код, что на ПК, + сенсорное управление ----
web = src.replace('window.MOBILE_BUILD=false;window.BT_BUILD=true;', 'window.MOBILE_BUILD=true;window.BT_BUILD=true;')
assert web != src
web = web.replace('<meta name="apple-mobile-web-app-title" content="Искра и Болт">', '<meta name="apple-mobile-web-app-title" content="Испытания">')
web = web.replace('<title>Искра и Болт — испытания</title>', '<title>Испытания — Искра и Болт</title>')
wd = ROOT / 'bt'; wd.mkdir(exist_ok=True)
(wd / 'index.html').write_text(web, encoding='utf-8')
(wd / 'manifest.webmanifest').write_text('{"name": "Искра и Болт — Испытания", "short_name": "Испытания", "start_url": "./", "scope": "./", "display": "fullscreen", "orientation": "landscape", "background_color": "#0b1830", "theme_color": "#0b1830", "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}', encoding='utf-8')
(wd / 'sw.js').write_text("const C='ib-bt-v1';self.addEventListener('install',e=>{self.skipWaiting();});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request)));});", encoding='utf-8')
import shutil
for f in ('icon-180.png', 'icon-192.png', 'icon-512.png'): shutil.copy(ROOT / f, wd / f)
print(f'bt/index.html готов (телефон): {len(web)//1024} КБ')
