# обзорная картинка уровней 1–3 по режимам (обычная сложность)
import json
from PIL import Image, ImageDraw, ImageFont
import importlib.util
spec=importlib.util.spec_from_file_location('lv','/tmp/claude-0/lv/levels.py'); lv=importlib.util.module_from_spec(spec); spec.loader.exec_module(lv)
L=lv.L; S=9
C={'~':(40,120,210),'*':(255,107,44),'S':(90,107,140),'G':(140,150,170),'a':(255,107,107),'b':(127,224,138),'c':(106,168,255),'#':(44,62,96),'^':(230,80,80),'x':(150,105,60),'C':(176,120,64),'E':(90,220,130),'k':(255,209,102),'X':(214,170,60),
   'p':(255,209,102),'P':(200,160,50),'q':(190,130,255),'Q':(150,100,210),'r':(120,220,140),'R':(80,170,100),'[':(230,70,70),']':(80,140,255),'h':(240,240,240),'1':(255,138,61),'2':(98,199,193),'.':(11,24,48)}
try: F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',22); f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
except: F=f2=None
modes=[('spark','Искра',(255,138,61)),('bolt','Болт',(98,199,193)),('duo','Вдвоём',(255,209,102))]
blocks=[]
import sys
KS=sys.argv[2].split(',') if len(sys.argv)>2 else ['1','2','3']
MS=[x for x in modes if len(sys.argv)<2 or x[0]==sys.argv[1]]
for m,mn,mc in MS:
  for k in KS:
    d=L[m][k]; mp=d['map']; H=len(mp); W=len(mp[0])
    im=Image.new('RGB',(W*S,H*S),(11,24,48)); g=ImageDraw.Draw(im)
    for y,row in enumerate(mp):
      for x,ch in enumerate(row):
        if ch=='.': continue
        c=C.get(ch,(200,200,200)); x0,y0=x*S,y*S
        if ch=='^': g.polygon([(x0,y0+S),(x0+S/2,y0+2),(x0+S,y0+S)],fill=c)
        elif ch in 'pqr': g.rectangle([x0+1,y0+S-3,x0+S-2,y0+S-1],fill=c)
        else: g.rectangle([x0,y0,x0+S-1,y0+S-1],fill=c)
    for e in d['enemies']: g.ellipse([e['tx']*S+1,e['ty']*S+1,e['tx']*S+S-2,e['ty']*S+S-2],fill=(200,80,255))
    for p in d['pickups']: g.ellipse([p['tx']*S+2,p['ty']*S+2,p['tx']*S+S-3,p['ty']*S+S-3],fill=(255,120,150) if p['t']=='heart' else (231,181,74))
    blocks.append((mn,mc,k,d['name'],d['hint'],im))
pad=16; Wmax=max(b[5].width for b in blocks)+2*pad
Ht=sum(b[5].height+70 for b in blocks)+80
out=Image.new('RGB',(max(Wmax,900),Ht),(6,13,28)); g=ImageDraw.Draw(out)
g.text((pad,18),'Уровни по режиму (обычная сложность)',fill=(232,239,250),font=F)
y=70
for mn,mc,k,name,hint,im in blocks:
  g.text((pad,y),f'{mn} · уровень {k} — «{name}»',fill=mc,font=F); g.text((pad,y+28),hint[:150],fill=(147,169,203),font=f2)
  out.paste(im,(pad,y+52)); y+=im.height+70
out.save('/tmp/claude-0/lv/ov_%s.png'%(sys.argv[1] if len(sys.argv)>1 else 'all')); print(out.size)
