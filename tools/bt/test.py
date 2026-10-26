#!/usr/bin/env python3
"""Проверка испытания ботом: python3 tools/bt/test.py <номер испытания с 1> [duo|spark|bolt ...] [easy|normal|hard|nightmare ...]
Сначала: python3 tools/bt/build.py. Нужен Playwright + Chromium."""
import sys, time, pathlib, subprocess, json
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
args = sys.argv[1:]
lvl = int(args[0]) - 1
CAMP_RAW = any(a=='camp' for a in args[1:])
modes = [a for a in args[1:] if a in ('duo', 'spark', 'bolt')] or ['duo', 'spark', 'bolt']
diffs = [a for a in args[1:] if a in ('easy', 'normal', 'hard', 'nightmare')] or ['normal']
kind = 'cart'
for a in args[1:]:
    if a.startswith('kind='): kind = a[5:]
subprocess.run([sys.executable, str(HERE / 'mktest.py'), '/tmp/claude-0/bt/test.html'], check=True, stdout=subprocess.DEVNULL)
bot = (HERE / 'bot.js').read_text(encoding='utf-8')
CHROME = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'
bad = 0
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
    for m in modes:
        for d in diffs:
            pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto('file:///tmp/claude-0/bt/test.html'); time.sleep(1.5)
            CI = lvl if CAMP_RAW else pg.evaluate(f"__T.go('BT.CAMP.findIndex(e=>e.k===\"t\"&&e.t=={lvl})')")
            setm = "setMode(false)" if m == 'duo' else f"setMode(true,'{m}')"
            pg.evaluate(f"__T.go(\"{setm}; run.diff='{d}'; saveRun(); BT.S.cp=null; startGame({CI},true)\")")
            for _ in range(60):
                time.sleep(0.4)
                if pg.evaluate("__T.go('state')") == 'play': break
            pg.evaluate("src=>__T.go(src)", bot)
            r = pg.evaluate(f"__T.go(\"BOT.play('{kind}',170)\")")
            ok = r['state'] != 'play' and not r['hits'] and r['x'] >= (r['fin'] or 0) - 1
            print(f"{'OK ' if ok else 'BAD'} {m:5s} {d:9s} {json.dumps(r, ensure_ascii=False)} {errs[:2] if errs else ''}")
            bad += 0 if ok else 1; pg.close()
    b.close()
sys.exit(1 if bad else 0)
