# Build: src/*.js (in name order) -> game.js -> iskra-i-bolt.html (PC) and iskra-i-bolt-mobile.html
import glob,sys
parts=sorted(glob.glob('src/*.js'))
s=''.join(open(f).read() for f in parts)
open('game.js','w').write(s)          # assembled source (also used by build/rebuild.sh for the exe)
h=open('head.html').read();L=open('levels.json').read();I=open('i18n.json').read()
s=open('/home/claude/game3d/three.min.js').read()+'\n'+s.replace('/*LEVELS*/',L).replace('/*I18N*/',I)
open('iskra-i-bolt.html','w').write(h+'<script>'+s+'</script></body></html>')
if '--pc-only' not in sys.argv:
    hm=h.replace('<title>Искра и Болт</title>','<title>Искра и Болт · телефон</title>',1)
    open('iskra-i-bolt-mobile.html','w').write(hm+'<script>window.MOBILE_BUILD=true;</script><script>'+s+'</script></body></html>')
print('built from',len(parts),'parts')
