#!/bin/sh
# тестовая копия для бота: без игрового цикла, ввод героев — от бота, шаги физики вручную
sh /tmp/claude-0/mkcopy.sh >/dev/null
D=/tmp/claude-0/bwww; rm -rf $D; cp -r /tmp/claude-0/www $D
python3 - <<'PY'
p='/tmp/claude-0/bwww/index.html'; s=open(p,encoding='utf-8').read()
a="function frame(now){"; assert s.count(a)==1
s=s.replace(a,"function frame(now){ if(window.__noLoop){ requestAnimationFrame(frame); return; }")
a="function readInput(pi){"; assert s.count(a)==1
s=s.replace(a,"function readInput(pi){ if(window.BOTIN) return window.BOTIN(pi);")
s=s.replace("window.__T={setState,","window.__T={step:(dt)=>step(dt),draw:()=>draw(),setState,",1)
open(p,'w',encoding='utf-8').write(s)
PY
cp /tmp/claude-0/lv/runner.js $D/runner.js
python3 - <<'PY'
p='/tmp/claude-0/bwww/index.html'; s=open(p,encoding='utf-8').read()
s=s.replace('</body>','<script src="runner.js"></script></body>',1)
open(p,'w',encoding='utf-8').write(s)
PY
