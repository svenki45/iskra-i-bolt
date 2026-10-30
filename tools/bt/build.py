#!/usr/bin/env python3
"""Собирает единую версию игры «Искра и Болт» (кампания, ПК и телефон; desktop-bt/index.html) из исходника игры.

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
bt = (ROOT / 'tools/bt/bt.js').read_text(encoding='utf-8') + '\n' + (ROOT / 'tools/bt/bg.js').read_text(encoding='utf-8')
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
sub('<title>Искра и Болт</title>', '<title>Искра и Болт</title>')
sub('const TOTAL=100;', f'const TOTAL={n};')

# ===== АКТЫ: акт = уровни до очередного босса (I–III: Пресс-Жаба, Око-Сварщик, Бешеная Шестерня; IV: Кузнец) =====
src, k = re.subn(r"const CHAPTERS=\[[^\n]*\];\nconst chapterOf=i=>Math\.min\(9,Math\.floor\(i/10\)\);",
    "const CHAPTERS=['Пробуждение','Сварочный пост','Шестерёнчатый ад','Литейный цех'];\n"
    "const ACT_END=[9,19,29,40], ACT_ROM=['I','II','III','IV'], ACT_BOSS=['Пресс-Жаба','Око-Сварщик','Бешеная Шестерня','Кузнец'];\n"
    "const chapterOf=i=>{ for(let a=0;a<ACT_END.length;a++) if(i<=ACT_END[a]) return a; return ACT_END.length-1; };", src)
if k != 1:
    sys.exit('build.py: не найден CHAPTERS/chapterOf')
sub("Глава ${chapterOf(J.i)+1} · ${CHAPTERS[chapterOf(J.i)]}", "Акт ${ACT_ROM[chapterOf(J.i)]} · ${CHAPTERS[chapterOf(J.i)]}")
sub("for(let i=ch*10;i<ch*10+10;i++){", "for(let i=(ch?ACT_END[ch-1]+1:0);i<=ACT_END[ch];i++){")
sub("small:'Все звёзды главы',title:'Глава '+(ch+1)+': +3000 очков'", "small:'Все звёзды акта',title:'Акт '+ACT_ROM[ch]+': +3000 очков'")
a0 = src.index("${(()=>{ const open=Math.min(TOTAL,maxPick()), decs=")
a1 = src.index("}).join('')}</div>\n      <p class=\"padst\">", a0) + len("}).join('')}</div>")
levels_html = r"""${(()=>{ const open=Math.min(TOTAL,maxPick()), acts=ACT_END.map((e,a)=>a).filter(a=>(a?ACT_END[a-1]+1:0)<open), ph=phoneUI()&&acts.length>1;
        if(lvPage<0||lvPage>=acts.length) lvPage=acts.length-1;
        const tabs=ph?`<div class="opts lvtabs">${acts.map(a=>`<button type="button" class="opt ${lvPage===a?'on':''}" data-dec="${a}">Акт ${ACT_ROM[a]}</button>`).join('')}</div>`:'';
        const blocks=acts.filter(a=>!ph||a===lvPage).map(a=>{ const s0=a?ACT_END[a-1]+1:0, e0=Math.min(ACT_END[a],open-1);
          return `<div class="lvact"><div class="lvah"><b>Акт ${ACT_ROM[a]} · ${CHAPTERS[a]}</b><span>босс: ${ACT_BOSS[a]}</span></div><div class="lvgrid">${Array.from({length:e0-s0+1},(_,k)=>s0+k).map(i=>{ const st=starsAll()[i]; return `<button type="button" class="opt lvb ${i===ACT_END[a]?'bossb':''}" data-lv="${i}">${i===ACT_END[a]?'Б':''}${i+1}${starHtml(st?st.s:0)}</button>`; }).join('')}</div></div>`; }).join('');
        return tabs+blocks; })()}"""
src = src[:a0] + levels_html + src[a1:]
sub(".lvgrid{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:520px}",
    ".lvgrid{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:520px}.lvact{width:100%;display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:8px}.lvah{display:flex;gap:12px;align-items:baseline;justify-content:center;font-size:13px}.lvah b{font-family:var(--display);color:var(--brass);letter-spacing:.04em}.lvah span{color:var(--muted)}.lvact .lvgrid{max-height:none!important;overflow:visible!important}#lvTip{position:fixed;left:0;top:0;z-index:99990;width:max-content;max-width:300px;box-sizing:border-box;padding:11px 15px 12px;text-align:left;pointer-events:none;background:linear-gradient(180deg,#2b1d16,#170f0c);border:2px solid var(--brass);border-radius:10px;box-shadow:0 5px 0 rgba(5,10,24,.9),0 14px 26px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.14);opacity:0;transform:translateY(6px) scale(.97);transition:opacity .12s ease,transform .12s ease;display:flex;flex-direction:column;gap:5px}#lvTip.on{opacity:1;transform:none}#lvTip:after{content:'';position:absolute;left:var(--ax,50%);bottom:-9px;width:14px;height:14px;margin-left:-7px;transform:rotate(45deg);background:#170f0c;border:2px solid var(--brass);border-top:0;border-left:0;box-sizing:border-box}#lvTip.below:after{bottom:auto;top:-9px;border:2px solid var(--brass);border-bottom:0;border-right:0;background:#2b1d16}#lvTip .lvt-e{font-family:var(--display);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--line);opacity:.8}#lvTip .lvt-n{font-family:var(--display);font-weight:700;font-size:15px;line-height:1.2;color:var(--brass);letter-spacing:.02em}#lvTip .lvt-d{font-size:13px;line-height:1.35;color:var(--ink)}#lvTip .lvt-f{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin-top:3px;padding-top:7px;border-top:1px solid rgba(231,181,74,.28);font-size:12px;color:var(--muted)}#lvTip .lvt-f .stars{margin:0;font-size:12px}")
sub("if(levelIdx+1>=49) unlock('lv50');","if(levelIdx+1>=21) unlock('lv50');")
sub('Доберитесь до 50-го уровня.','Доберитесь до 21-го уровня.')
for _o in ('Пройдите все 100 уровней.','Открыты все 100 уровней','Все 100 уровней собраны'):
    sub(_o, _o.replace('100', str(n)))
# камера: испытания задают свой зум и сдвиг вперёд (BTX объявлен в bt.js через var)
sub('const want=Math.max(1,Math.min(1.45,VW/(x1-x0+620),VH/(y1-y0+380)));',
    'const want=BTX.z||Math.max(1,Math.min(1.8,VW/(x1-x0+440),VH/(y1-y0+270)));')
sub('const cx=live.reduce((a,p)=>a+p.x+p.w/2,0)/live.length;',
    'const cx=live.reduce((a,p)=>a+p.x+p.w/2,0)/live.length+BTX.lx;')
sub('const cy=live.reduce((a,p)=>a+p.y+p.h/2,0)/live.length;',
    'const cy=(BTX.fy!=null?BTX.fy:live.reduce((a,p)=>a+p.y+p.h/2,0)/live.length)+BTX.ly;')
sub('const starPar=L=>L.boss?150:(solo?35:40);', 'const starPar=L=>L.par||(L.boss?150:(solo?35:40));')
# длинные трассы (300–400 клеток): слои фона в 1×, иначе холст ~32000 px и сотни МБ памяти
sub("staticLayer.width=WW*2; staticLayer.height=WH*2;\n  let g=staticLayer.getContext('2d'); g.setTransform(2,0,0,2,0,0);",
    "const SS=WW>8200?1:2; staticLayer.width=WW*SS; staticLayer.height=WH*SS;\n  let g=staticLayer.getContext('2d'); g.setTransform(SS,0,0,SS,0,0);")
sub("wallLayer.width=WW*2; wallLayer.height=WH*2; g=wallLayer.getContext('2d'); g.setTransform(2,0,0,2,0,0);",
    "wallLayer.width=WW*SS; wallLayer.height=WH*SS; g=wallLayer.getContext('2d'); g.setTransform(SS,0,0,SS,0,0);")
sub("\nconst GAME_VER=",'\n' + bt + '\nconst GAME_VER=')

# вступительный ролик, концовка и кнопка «Смотреть вступление» — в ПК и в телефонной версии (одна версия игры)
intro = (ROOT / 'tools/bt/intro.js').read_text(encoding='utf-8')
sub('<button class="secondary" id="bReport" type="button">Отчёт для тестов</button>','<button class="secondary" id="bIntro" type="button">${(window.__introUI||{}).replay||\'🎬 Смотреть вступление\'}</button><button class="secondary" id="bReport" type="button">Отчёт для тестов</button>')
sub("if($('bReport')) $('bReport').onclick=()=>setState('report');","if($('bReport')) $('bReport').onclick=()=>setState('report'); if($('bIntro')) $('bIntro').onclick=()=>window.playIntro&&window.playIntro(true);")
sub("\nconst GAME_VER=",'\n' + intro + '\nconst GAME_VER=')
# новая игра: вместо старого пролога — наш ролик (в автотестах оставляем старый пролог)
sub("storyNext=()=>startGame(0); proT=0; setState('prologue');","storyNext=()=>startGame(0); proT=0; if(window.playIntro&&!(navigator.webdriver&&!window.__forceEnding)) window.playIntro(true,{onEnd:()=>{ const f=storyNext; storyNext=null; f&&f(); }}); else setState('prologue');")
import shutil
shutil.copy(ROOT / 'tools/intro.mp4', ROOT / 'desktop-bt/intro.mp4')
out = ROOT / 'desktop-bt/index.html'
out.write_text(src, encoding='utf-8')
print(f'desktop-bt/index.html готов: {len(src)//1024} КБ, испытаний: {n}')

# ---- веб-версия для телефона (iPhone/Android): страница bt/ на GitHub Pages, тот же код, что на ПК, + сенсорное управление ----
web = src.replace('window.MOBILE_BUILD=false;window.BT_BUILD=true;', 'window.MOBILE_BUILD=true;window.BT_BUILD=true;')
assert web != src
HEADX = '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Искра и Болт"><meta name="theme-color" content="#0b1830"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-180.png"><link rel="icon" href="icon-192.png">'
assert web.count('<meta charset="utf-8">') == 1
web = web.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + HEADX, 1)

BANNER = """<div id="a2hs" style="display:none;position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#0a1226;border-top:3px solid #ffd166;color:#eaf1ff;font:600 15px/1.35 -apple-system,Arial,sans-serif;padding:10px 16px calc(10px + env(safe-area-inset-bottom));text-align:center"><b style="color:#ffd166">Чтобы игра была на весь экран:</b> нажми «Поделиться» <span style="border:2px solid #6fb7ff;border-radius:5px;padding:0 5px;color:#6fb7ff">↑</span> → «На экран “Домой”» → «Добавить» и запускай с иконки. <button id="a2hsx" style="margin-left:10px;padding:5px 14px;border-radius:10px;border:0;background:#ffd166;color:#0b1830;font:800 14px Arial">Понятно</button></div><script>(function(){try{var ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);var sa=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);if(!ios||sa)return;var b=document.getElementById('a2hs');if(sessionStorage.getItem('a2hs'))return;b.style.display='block';setInterval(function(){ if(sessionStorage.getItem('a2hs')) return; b.style.display=document.body.classList.contains('playing')?'none':'block'; },400);document.getElementById('a2hsx').onclick=function(){b.style.display='none';try{sessionStorage.setItem('a2hs','1')}catch(e){}};}catch(e){}})();</script>"""
BANNER = BANNER.replace('Понятно</button>', 'Понятно</button><div style="opacity:.6;font-size:12px;margin-top:4px">версия страницы: ' + stamp + '</div>')
web = web.replace('</body>', BANNER + '</body>', 1)
wd = ROOT / 'bt'; wd.mkdir(exist_ok=True)
shutil.copy(ROOT / 'tools/intro.mp4', wd / 'intro.mp4')
(wd / 'index.html').write_text(web, encoding='utf-8')
(wd / 'manifest.webmanifest').write_text('{"name": "Искра и Болт", "short_name": "Искра и Болт", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "landscape", "background_color": "#0b1830", "theme_color": "#0b1830", "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}', encoding='utf-8')
(wd / 'sw.js').write_text("const C='ib-bt-v1';self.addEventListener('install',e=>{self.skipWaiting();});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request)));});", encoding='utf-8')
import shutil
for f in ('icon-180.png', 'icon-192.png', 'icon-512.png'): shutil.copy(ROOT / f, wd / f)
print(f'bt/index.html готов (телефон): {len(web)//1024} КБ')
