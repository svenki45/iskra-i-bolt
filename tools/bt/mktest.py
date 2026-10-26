#!/usr/bin/env python3
"""Тестовая копия desktop-bt для бота: ручной шаг физики, ввод героев от бота. Только для проверки, в игру не попадает."""
import sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
src = (ROOT / 'desktop-bt/index.html').read_text(encoding='utf-8')
def sub(a, b):
    global src
    assert src.count(a) == 1, a
    src = src.replace(a, b)
sub('function frame(now){', 'function frame(now){ if(window.__noLoop){ requestAnimationFrame(frame); return; }')
sub('function readInput(pi){', 'function readInput(pi){ if(window.BOTIN) return window.BOTIN(pi);')
sub('function toggleCheat(){', 'window.__T={step:(dt)=>step(dt),go:(js)=>eval(js)};\nfunction toggleCheat(){')
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/bt/test.html')
out.write_text(src, encoding='utf-8'); print(out)
