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
print('Готово: source/out/pc.html, mobile.html, long.html')
