# Сборка игры из исходников. Нужен только Python 3. Запуск:  python build_all.py
# Результат кладётся в папку source/out/ — живой сайт НЕ трогается.
# out/pc.html — основная версия (ПК), out/mobile.html — она же для телефона, out/long.html — тестовая (длинные уровни + конструктор).
# Проверили в браузере — тогда копируйте: out/long.html -> long/index.html, out/pc.html -> pc.html.
import glob, os
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(D, 'out')
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read()
def wr(p, s):
    p = os.path.join(R, p); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'w', encoding='utf-8').write(s)
H, LV, I18N, THREE = rd('head.html'), rd('levels.json'), rd('i18n.json'), rd('three.min.js')
def js(folder):
    s = ''.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(D, folder, '*.js'))))
    return THREE + '\n' + s.replace('/*LEVELS*/', LV).replace('/*I18N*/', I18N)
main, long_ = js('src-pc'), js('src-long')
wr('pc.html', H + '<script>' + main + '</script></body></html>')
wr('long.html', H.replace('<title>Искра и Болт</title>', '<title>Искра и Болт · длинные уровни</title>', 1) + '<script>' + long_ + '</script></body></html>')
wr('mobile.html', H + '<script>window.MOBILE_BUILD=true;</script><script>' + main + '</script></body></html>')
# Steam/офлайн-версия: шрифты внутри файла, без интернета -> копировать в desktop-app/index.html
import base64, re, datetime
F=[('Unbounded',500),('Unbounded',700),('Unbounded',900),('Rubik',400),('Rubik',500),('Rubik',700),('Russo One',400)]
ff=''.join("@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:block;src:url(data:font/woff;base64,%s) format('woff')}\n"%(fam,w,base64.b64encode(open(os.path.join(D,'fonts',fam.replace(' ','')+'-%d.woff'%w),'rb').read()).decode()) for fam,w in F)
h=re.sub(r'<link rel="preconnect"[^>]*>\n','',H); h=re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\n','',h)
h=h.replace('<style>\n','<style>\n'+ff+'[hidden]{display:none!important}\n',1)
pre='<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
stamp='const BUILD_STAMP="'+(datetime.datetime.utcnow()+datetime.timedelta(hours=3)).strftime('%d.%m %H:%M')+'";\n'
wr('steam.html', pre+h.replace('<div class="app">','</head>\n<body>\n<div class="app">',1)+'<script>\n'+stamp+main+'\n</script>\n</body>\n</html>\n')
# ТЕСТ 3D-героев в роликах (не для выпуска): steam_test3d.html — как steam.html, но с 3D-Искрой в прологе (автозапуск пролога с 14-й секунды); spark3d_preview.html — просмотр модели отдельно.
if os.path.exists(os.path.join(D,'spark3d.b64')):
    b64=open(os.path.join(D,'spark3d.b64')).read().strip(); PH="/*SPARK3D*/''"
    main_t=main.replace(PH,"'"+b64+"'")
    auto="<script>(function(){function go(){try{__ib.cine('pro');__ib.proAt(14.2);}catch(e){setTimeout(go,300);}}setTimeout(go,1500);setInterval(function(){try{if(__ib.state.state!=='prologue'){__ib.cine('pro');__ib.proAt(14.2);}}catch(e){}},1500);})();</script>\n"
    wr('steam_test3d.html', pre+h.replace('<div class="app">','</head>\n<body>\n<div class="app">',1)+'<script>window.__ibNoSplash=true;window.__hero3d=true;</script>\n<script>\n'+stamp+main_t+'\n</script>\n'+auto+'</body>\n</html>\n')
    hero=rd('src-pc/27b_hero3d.js').replace(PH,"'"+b64+"'")
    wr('spark3d_preview.html', rd('preview3d.html').replace('/*THREE*/',THREE).replace('/*HERO3D*/',hero))
    print('Тест 3D: out/steam_test3d.html, out/spark3d_preview.html')
# Android (APK): та же Steam-сборка, но с сенсорным управлением и мобильной подгонкой экрана
wr('android.html', pre+h.replace('<div class="app">','</head>\n<body>\n<div class="app">',1)+'<script>window.MOBILE_BUILD=true;</script>\n<script>\n'+stamp+main+'\n</script>\n</body>\n</html>\n')
print('Готово: source/out/pc.html, mobile.html, long.html, steam.html (-> desktop-app/index.html), android.html (-> android-app/www/index.html)')
