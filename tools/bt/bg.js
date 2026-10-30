/* ===== ФОНЫ ИСПЫТАНИЙ: у каждого уровня свой задник по названию ===== (вставляется build.py после bt.js; «Труба» и «Заводской двор» не трогаем)
   Устройство: BG[имя] = {h (оттенок стен/пола), s (насыщенность), st(g,R) — рисуется один раз в слой фона, lv(c,t,Q) — лёгкая анимация каждый кадр}.
   Рисуем приглушённо (прозрачность низкая), чтобы герои, враги и платформы читались лучше фона. */
const BGX=(()=>{
const TAU=Math.PI*2, W=VW, Hh=VH;
const hs=(h,s,l,a)=>`hsla(${h},${s}%,${l}%,${a==null?1:a})`;
const circ=(g,x,y,r)=>{ g.beginPath(); g.arc(x,y,r,0,TAU); };
const glow=(g,x,y,r,c0,c1)=>{ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,c0); gr.addColorStop(1,c1||'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); };
const vgrad=(g,y0,y1,c0,c1,x0=0,w=W)=>{ const gr=g.createLinearGradient(0,y0,0,y1); gr.addColorStop(0,c0); gr.addColorStop(1,c1); g.fillStyle=gr; g.fillRect(x0,Math.min(y0,y1),w,Math.abs(y1-y0)); };
const cone=(g,x,y0,w0,w1,y1,c0,c1)=>{ const gr=g.createLinearGradient(0,y0,0,y1); gr.addColorStop(0,c0); gr.addColorStop(1,c1||'rgba(0,0,0,0)'); g.fillStyle=gr; g.beginPath(); g.moveTo(x-w0/2,y0); g.lineTo(x+w0/2,y0); g.lineTo(x+w1/2,y1); g.lineTo(x-w1/2,y1); g.closePath(); g.fill(); };
const line=(g,x0,y0,x1,y1,c,w)=>{ g.strokeStyle=c; g.lineWidth=w||2; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); };
const bricks=(g,x0,y0,w,h,c,bw=46,bh=20)=>{ g.strokeStyle=c; g.lineWidth=1.5; for(let y=y0,r=0;y<y0+h;y+=bh,r++){ g.beginPath(); g.moveTo(x0,y); g.lineTo(x0+w,y); g.stroke(); for(let x=x0+(r%2?bw/2:0);x<x0+w;x+=bw){ g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+bh); g.stroke(); } } };
const gear=(g,x,y,r,teeth,c,lw,rot)=>{ g.strokeStyle=c; g.lineWidth=lw||4; g.beginPath(); for(let k=0;k<=teeth*2;k++){ const a=k/(teeth*2)*TAU+(rot||0), rr=k%2?r:r*1.14; g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); } g.closePath(); g.stroke(); circ(g,x,y,r*.35); g.stroke(); };
const stars=(g,R,n,ymax,a)=>{ for(let i=0;i<n;i++){ g.fillStyle=`rgba(255,255,255,${(a||.5)*(.25+R()*.75)})`; circ(g,R()*W,R()*ymax,.5+R()*1.4); g.fill(); } };
const hills=(g,R,y,amp,c,step=40,ph=0)=>{ g.fillStyle=c; g.beginPath(); g.moveTo(0,Hh); for(let x=0;x<=W+step;x+=step) g.lineTo(x,y+Math.sin(x/(130+ph*17)+ph)*amp+Math.sin(x/47+ph*2)*amp*.35+(R()-.5)*amp*.2); g.lineTo(W,Hh); g.closePath(); g.fill(); };
const hazard=(g,x,y,w,h,c1,c2)=>{ g.save(); g.beginPath(); g.rect(x,y,w,h); g.clip(); g.fillStyle=c2; g.fillRect(x,y,w,h); g.fillStyle=c1; for(let k=-h;k<w+h;k+=34){ g.beginPath(); g.moveTo(x+k,y+h); g.lineTo(x+k+17,y+h); g.lineTo(x+k+17+h,y); g.lineTo(x+k+h,y); g.fill(); } g.restore(); };
const crate=(g,x,y,s,c,e)=>{ g.fillStyle=c; g.fillRect(x,y,s,s); g.strokeStyle=e; g.lineWidth=2; g.strokeRect(x+1,y+1,s-2,s-2); g.beginPath(); g.moveTo(x,y); g.lineTo(x+s,y+s); g.moveTo(x+s,y); g.lineTo(x,y+s); g.stroke(); };
const stalac=(g,R,top,n,minH,maxH,c,wMin=26,wMax=70)=>{ g.fillStyle=c; for(let i=0;i<n;i++){ const x=(i+R()*.9)*W/n, w=wMin+R()*(wMax-wMin), h=minH+R()*(maxH-minH), y=top?0:Hh; g.beginPath(); g.moveTo(x-w/2,y); g.lineTo(x+(R()-.5)*8,top?h:Hh-h); g.lineTo(x+w/2,y); g.fill(); } };
const lamp=(g,x,y,len,c,r)=>{ line(g,x,0,x,y+len,'rgba(190,200,220,.22)',2); g.fillStyle=c; circ(g,x,y+len,r||7); g.fill(); glow(g,x,y+len,(r||7)*9,c.replace(/[\d.]+\)$/,'.22)')); };

const BG={};
/* ---- общие переименования (по имени уровня) ---- */
BG['Вдвоём']={h:20,st(g,R){ // два прожектора: тёплый и бирюзовый сходятся на полу
  for(const [x,c,x2] of [[W*.3,'255,170,90',W*.45],[W*.7,'110,230,220',W*.55]]){ cone(g,x,0,40,420,Hh,`rgba(${c},.20)`,`rgba(${c},0)`); g.save(); g.translate(x2-x,0); g.restore(); g.fillStyle=`rgba(${c},.35)`; g.fillRect(x-30,0,60,12); }
  glow(g,W*.5,Hh-30,300,'rgba(255,200,140,.12)'); for(let i=0;i<5;i++){ gear(g,R()*W,Hh*(.3+R()*.5),50+R()*50,10,'rgba(200,210,230,.06)',4); } },
  lv(c,t,Q){ for(const q of Q.motes){ const x=(q.x+t*10*q.s)%W; c.globalAlpha=.25*(.5+.5*Math.sin(t+q.p)); c.fillStyle='#ffe6b8'; c.fillRect(x,(q.y+t*6)%Hh,1.6,1.6); } c.globalAlpha=1; }};

BG['Разгон']={h:24,st(g,R){ // паровой коридор: световые полосы потолка, решётки, полосы скорости
  vgrad(g,0,Hh,'rgba(255,150,60,.10)','rgba(255,150,60,0)');
  for(let x=60;x<W;x+=210){ g.fillStyle='rgba(255,220,170,.22)'; g.fillRect(x,18,110,7); cone(g,x+55,25,110,260,Hh*.7,'rgba(255,210,150,.10)'); }
  for(let i=0;i<5;i++){ const y=120+i*105; for(let x=(i%2)*50;x<W;x+=100){ g.fillStyle='rgba(20,10,5,.18)'; g.fillRect(x,y,70,30); g.strokeStyle='rgba(255,190,120,.10)'; g.lineWidth=1.5; g.strokeRect(x,y,70,30); for(let k=1;k<5;k++){ line(g,x+k*14,y,x+k*14,y+30,'rgba(255,190,120,.08)',1); } } }
  hazard(g,0,Hh-18,W,18,'rgba(255,190,60,.20)','rgba(20,15,10,.35)'); },
  lv(c,t,Q){ c.lineWidth=2; for(let i=0;i<9;i++){ const q=Q.items[i%8], sp=500+q.s*500, x=((q.x*2-t*sp)%(W+300)+W+300)%(W+300)-150, y=60+((q.y*.9+i*83)%(Hh-140)); c.globalAlpha=.16; c.strokeStyle='#ffe2bd'; c.beginPath(); c.moveTo(x,y); c.lineTo(x+90+q.s*90,y); c.stroke(); } c.globalAlpha=1; }};

BG['ОП!']={h:48,st(g,R){ // пружины и стрелки вверх
  for(let i=0;i<9;i++){ const x=R()*W, y=Hh*(.3+R()*.6), s=.8+R()*.8; g.save(); g.translate(x,y); g.scale(s,s); g.strokeStyle='rgba(255,215,120,.14)'; g.lineWidth=4; g.beginPath(); for(let k=0;k<=10;k++) g.lineTo(k%2?16:-16,-k*9); g.stroke(); g.fillStyle='rgba(255,215,120,.12)'; g.fillRect(-26,0,52,8); g.restore(); }
  for(let i=0;i<10;i++){ const x=R()*W,y=R()*Hh*.8; g.strokeStyle='rgba(255,230,160,.12)'; g.lineWidth=5; g.beginPath(); g.moveTo(x-14,y+10); g.lineTo(x,y-6); g.lineTo(x+14,y+10); g.stroke(); } },
  lv(c,t,Q){ for(let i=0;i<8;i++){ const q=Q.items[i], y=Hh-((t*(40+q.s*40)+q.p*120)%(Hh+60)), x=q.x; c.globalAlpha=.20*(y/Hh); c.strokeStyle='#fff0b8'; c.lineWidth=4; c.beginPath(); c.moveTo(x-12,y+9); c.lineTo(x,y-5); c.lineTo(x+12,y+9); c.stroke(); } c.globalAlpha=1; }};

BG['Турбо-трасса']={h:340,st(g,R){ // неоновая трасса: полосы, шевроны, столбы с ореолом
  vgrad(g,Hh*.5,Hh,'rgba(255,60,140,0)','rgba(255,60,140,.14)');
  for(let i=0;i<4;i++){ const y=90+i*140; g.shadowColor='#ff3c8c'; g.shadowBlur=14; line(g,0,y,W,y,'rgba(255,90,160,.30)',3); g.shadowBlur=0; line(g,0,y+8,W,y+8,'rgba(90,220,255,.16)',1.5); }
  for(let x=40;x<W;x+=150){ g.strokeStyle='rgba(255,230,120,.12)'; g.lineWidth=6; g.beginPath(); g.moveTo(x,Hh*.3); g.lineTo(x+26,Hh*.3+22); g.lineTo(x,Hh*.3+44); g.stroke(); }
  for(let x=100;x<W;x+=320){ line(g,x,Hh*.55,x,Hh,'rgba(200,210,230,.14)',6); glow(g,x,Hh*.55,110,'rgba(255,120,190,.22)'); }
  g.fillStyle='rgba(255,255,255,.07)'; for(let i=0;i<24;i++) for(let j=0;j<2;j++) if((i+j)%2) g.fillRect(i*W/24,Hh-40+j*10,W/24,10); },
  lv(c,t,Q){ c.globalAlpha=.16; c.strokeStyle='#ffe678'; c.lineWidth=6; for(let k=0;k<7;k++){ const x=((k*210-t*420)%(W+200)+W+200)%(W+200)-100; c.beginPath(); c.moveTo(x,Hh*.3); c.lineTo(x+26,Hh*.3+22); c.lineTo(x,Hh*.3+44); c.stroke(); } c.globalAlpha=1; }};

BG['Разные пути']={h:195,st(g,R){ // развилки: указатели и разветвляющиеся пунктирные дорожки
  g.setLineDash([12,14]); g.lineWidth=5; g.strokeStyle='rgba(160,225,255,.16)';
  for(let i=0;i<4;i++){ const y=120+i*150; g.beginPath(); g.moveTo(0,y); g.bezierCurveTo(W*.3,y,W*.35,y-80,W*.55,y-80); g.bezierCurveTo(W*.8,y-80,W*.8,y+60,W,y+60); g.stroke(); g.beginPath(); g.moveTo(W*.35,y); g.bezierCurveTo(W*.5,y,W*.5,y+90,W*.7,y+90); g.stroke(); } g.setLineDash([]);
  for(let i=0;i<4;i++){ const x=120+R()*(W-240), y=100+R()*(Hh-260); line(g,x,y,x,y+90,'rgba(190,215,235,.22)',5); for(const d of [-1,1]){ g.save(); g.translate(x,y+ (d>0?10:34)); g.fillStyle='rgba(190,215,235,.18)'; g.beginPath(); g.moveTo(-d*40,-10); g.lineTo(d*24,-10); g.lineTo(d*40,0); g.lineTo(d*24,10); g.lineTo(-d*40,10); g.fill(); g.restore(); } } },
  lv(c,t){ c.setLineDash([12,14]); c.lineDashOffset=-t*30; c.lineWidth=3; c.strokeStyle='rgba(180,235,255,.18)'; c.beginPath(); c.moveTo(0,Hh*.5); c.bezierCurveTo(W*.3,Hh*.5,W*.35,Hh*.42,W*.55,Hh*.42); c.stroke(); c.setLineDash([]); }};

BG['Спуск в шахту']={h:262,st(g,R){ // рудничная шахта: пласты породы, крепь, фонари, тросы
  for(let i=0;i<9;i++){ g.fillStyle=hs(262+R()*20,18,10+R()*5,.35); g.beginPath(); g.moveTo(0,i*90+R()*30); for(let x=0;x<=W;x+=80) g.lineTo(x,i*90+Math.sin(x/90+i)*18+R()*14); g.lineTo(W,i*90+60); g.lineTo(0,i*90+60); g.fill(); }
  for(let x=140;x<W;x+=360){ g.fillStyle='rgba(120,80,50,.30)'; g.fillRect(x-70,0,14,Hh); g.fillRect(x+56,0,14,Hh); for(let y=60;y<Hh;y+=240){ g.fillRect(x-76,y,152,16); line(g,x-70,y+16,x-10,y+90,'rgba(120,80,50,.22)',9); line(g,x+70,y+16,x+10,y+90,'rgba(120,80,50,.22)',9); } }
  for(let i=0;i<4;i++){ const x=80+R()*(W-160), y=R()*(Hh-300); lamp(g,x,y,40+R()*60,'rgba(255,190,100,.9)',7); }
  g.font='700 22px Rubik, sans-serif'; g.fillStyle='rgba(255,220,160,.20)'; for(let i=0;i<4;i++) g.fillText('−'+(40+i*40+((R()*9)|0)*0)+' м',W-110,100+i*170); },
  lv(c,t,Q){ for(let i=0;i<8;i++){ const q=Q.items[i], y=((t*(70+q.s*60)+q.p*90)%(Hh+30))-15; c.globalAlpha=.30; c.fillStyle='#b9a58a'; c.fillRect(q.x,y,2+q.s*2,2+q.s*3); } for(let i=0;i<4;i++){ const q=Q.items[i]; c.globalAlpha=.06+.05*Math.sin(t*9+q.p*5); c.fillStyle='#ffc470'; c.beginPath(); c.arc(q.x,q.y,60,0,TAU); c.fill(); } c.globalAlpha=1; }};

BG['Затопленный склад']={h:200,st(g,R){ // стеллажи с ящиками и вода по пояс
  for(let i=0;i<5;i++){ const x=40+i*250+R()*60, y=Hh*.35; g.strokeStyle='rgba(150,170,190,.18)'; g.lineWidth=4; g.strokeRect(x,y,170,230); line(g,x,y+115,x+170,y+115,'rgba(150,170,190,.18)',4); crate(g,x+10,y+60,52,'rgba(90,70,50,.30)','rgba(200,170,120,.18)'); crate(g,x+70,y+62,50,'rgba(90,70,50,.30)','rgba(200,170,120,.18)'); crate(g,x+30,y+10,46,'rgba(90,70,50,.30)','rgba(200,170,120,.18)'); }
  vgrad(g,Hh*.72,Hh,'rgba(60,150,200,.22)','rgba(30,90,140,.38)'); line(g,0,Hh*.72,W,Hh*.72,'rgba(170,230,255,.30)',2);
  for(let i=0;i<18;i++){ const y=Hh*.74+R()*Hh*.24, x=R()*W; line(g,x,y,x+30+R()*70,y,'rgba(190,235,255,.12)',2); } },
  lv(c,t,Q){ c.lineWidth=2; c.strokeStyle='rgba(190,235,255,.28)'; c.beginPath(); for(let x=0;x<=W;x+=16){ const y=Hh*.72+Math.sin(x/38+t*1.6)*3; x?c.lineTo(x,y):c.moveTo(x,y); } c.stroke();
    for(let i=0;i<8;i++){ const q=Q.items[i], y=Hh-((t*(30+q.s*30)+q.p*100)%(Hh*.3)); c.globalAlpha=.3; c.strokeStyle='#cdeeff'; c.beginPath(); c.arc(q.x+Math.sin(t+q.p)*6,y,2+q.s*3,0,TAU); c.stroke(); } c.globalAlpha=1; }};

BG['Пресс']={h:4,st(g,R){ // гидравлические прессы с потолка, предупреждающие полосы, красные лампы
  for(let i=0;i<4;i++){ const x=100+i*300+R()*40, h=130+R()*130; g.fillStyle='rgba(20,8,8,.35)'; g.fillRect(x-30,0,60,h); g.fillStyle='rgba(180,190,205,.16)'; g.fillRect(x-14,0,28,h+60); g.fillStyle='rgba(120,130,150,.22)'; g.fillRect(x-70,h+60,140,40); hazard(g,x-70,h+100,140,10,'rgba(255,200,60,.28)','rgba(30,20,10,.45)'); for(let k=0;k<4;k++){ g.fillStyle='rgba(230,240,255,.2)'; circ(g,x-60+k*40,h+80,3); g.fill(); } }
  for(let x=60;x<W;x+=240){ glow(g,x,28,70,'rgba(255,60,50,.35)'); g.fillStyle='rgba(255,90,80,.7)'; circ(g,x,28,6); g.fill(); }
  hazard(g,0,Hh-14,W,14,'rgba(255,60,50,.22)','rgba(20,10,10,.4)'); },
  lv(c,t,Q){ for(let x=60,k=0;x<W;x+=240,k++){ const on=Math.sin(t*5+k*1.7)>0; c.globalAlpha=on?.28:.06; c.fillStyle='#ff4a3a'; c.beginPath(); c.arc(x,28,30,0,TAU); c.fill(); } c.globalAlpha=1; }};

BG['Змеиный мост']={h:140,st(g,R){ // сборочный цех: кран-балки, силуэты механических змей, зелёное свечение ям
  for(let i=0;i<3;i++){ const y=70+i*30; g.fillStyle='rgba(150,170,160,.14)'; g.fillRect(0,y,W,10); for(let x=20;x<W;x+=60){ line(g,x,y+10,x+30,y+34,'rgba(150,170,160,.10)',3); line(g,x+30,y+34,x+60,y+10,'rgba(150,170,160,.10)',3); } }
  for(let i=0;i<3;i++){ g.strokeStyle='rgba(120,230,150,.16)'; g.lineWidth=18; g.lineCap='round'; g.beginPath(); const y0=Hh*(.3+i*.2), x0=R()*W*.3; g.moveTo(x0,y0); for(let k=1;k<=6;k++) g.lineTo(x0+k*80,y0+Math.sin(k*1.3+i)*40); g.stroke(); g.lineCap='butt'; g.fillStyle='rgba(120,230,150,.22)'; circ(g,x0+480,y0+Math.sin(7.8+i)*40,13); g.fill(); }
  vgrad(g,Hh*.72,Hh,'rgba(80,255,140,0)','rgba(80,255,140,.18)'); },
  lv(c,t,Q){ c.globalAlpha=.10+.06*Math.sin(t*2); vgrad(c,Hh*.7,Hh,'rgba(80,255,140,0)','rgba(80,255,140,1)'); for(let i=0;i<8;i++){ const q=Q.items[i], y=Hh-((t*(40+q.s*40)+q.p*100)%(Hh*.4)); c.globalAlpha=.28; c.fillStyle='#9dffb8'; c.fillRect(q.x,y,2,2); } c.globalAlpha=1; }};

BG['Тьма']={h:250,st(g,R){ // тёмный тоннель: паутина в углах, пары глаз во мгле, редкие лампочки
  for(let i=0;i<14;i++){ const x=R()*W,y=R()*Hh*.8; glow(g,x,y,70,'rgba(100,90,160,.10)'); }
  for(const [cx,cy,sx] of [[0,0,1],[W,0,-1]]){ g.strokeStyle='rgba(220,225,240,.14)'; g.lineWidth=1; for(let k=1;k<7;k++){ g.beginPath(); g.arc(cx,cy,k*30,sx>0?0:Math.PI/2,sx>0?Math.PI/2:Math.PI); g.stroke(); } for(let a=0;a<=Math.PI/2;a+=Math.PI/10){ line(g,cx,cy,cx+sx*Math.cos(a)*190,cy+Math.sin(a)*190,'rgba(220,225,240,.14)',1); } } },
  lv(c,t,Q){ for(let i=0;i<4;i++){ const q=Q.items[i], b=Math.sin(t*.7+q.p*9)>.92?0:1; if(!b) continue; c.globalAlpha=.5; c.fillStyle='#ffd060'; c.beginPath(); c.arc(q.x-9,q.y,2.3,0,TAU); c.arc(q.x+9,q.y,2.3,0,TAU); c.fill(); } c.globalAlpha=1; }};

BG['Канал']={h:200,st(g,R){ // кирпичный тоннель канала: арки, лампы, вода с отражениями
  bricks(g,0,0,W,Hh*.7,'rgba(150,170,190,.10)'); for(let x=60;x<W;x+=300){ g.strokeStyle='rgba(180,200,220,.16)'; g.lineWidth=10; g.beginPath(); g.arc(x+90,Hh*.7,110,Math.PI,0); g.stroke(); }
  for(let x=190;x<W;x+=300) lamp(g,x,20,80,'rgba(255,214,140,.9)',7);
  vgrad(g,Hh*.7,Hh,'rgba(40,120,180,.30)','rgba(20,70,120,.42)'); line(g,0,Hh*.7,W,Hh*.7,'rgba(170,230,255,.28)',2);
  for(let x=190;x<W;x+=300){ g.fillStyle='rgba(255,214,140,.10)'; g.fillRect(x-4,Hh*.72,8,Hh*.25); } },
  lv(c,t,Q){ c.strokeStyle='rgba(190,235,255,.28)'; c.lineWidth=2; c.beginPath(); for(let x=0;x<=W;x+=14){ const y=Hh*.7+Math.sin(x/30+t*1.8)*2.5; x?c.lineTo(x,y):c.moveTo(x,y); } c.stroke();
    for(let i=0;i<5;i++){ const q=Q.items[i], p=(t*.6+q.p)%2; if(p<1){ c.globalAlpha=.4*(1-p); c.fillStyle='#cdeeff'; c.beginPath(); c.arc(q.x,60+p*(Hh*.7-60),2,0,TAU); c.fill(); } } c.globalAlpha=1; }};

BG['Огонь и ящики']={h:18,st(g,R){ for(let i=0;i<12;i++){ const x=R()*W, s=40+R()*40, y=Hh-s-30-R()*30; crate(g,x,y,s,'rgba(80,50,30,.30)','rgba(220,160,100,.16)'); }
  for(let i=0;i<3;i++){ const x=150+i*420+R()*80, y=Hh*.55; g.fillStyle='rgba(60,50,45,.45)'; g.beginPath(); g.moveTo(x-30,y); g.lineTo(x+30,y); g.lineTo(x+20,y+50); g.lineTo(x-20,y+50); g.fill(); line(g,x,y+50,x,y+130,'rgba(60,50,45,.45)',8); glow(g,x,y-20,150,'rgba(255,130,40,.22)'); } },
  lv(c,t,Q){ for(let i=0;i<3;i++){ const x=150+i*420+(Q.items[i].x%80), y=Hh*.55; for(let k=0;k<3;k++){ const f=Math.sin(t*9+k*2+i)*.5+.5; c.globalAlpha=.55; c.fillStyle=['#ff6a1a','#ffa030','#ffe070'][k]; c.beginPath(); c.moveTo(x-18+k*6,y); c.quadraticCurveTo(x-10+k*5,y-30-f*18-k*8,x,y-48-f*22+k*12); c.quadraticCurveTo(x+10-k*5,y-24-k*8,x+18-k*6,y); c.fill(); } }
    for(let i=0;i<8;i++){ const q=Q.items[i], y=Hh*.5-((t*(30+q.s*30)+q.p*80)%(Hh*.45)); c.globalAlpha=.4; c.fillStyle='#ffb050'; c.fillRect(q.x,y,2,2); } c.globalAlpha=1; }};

BG['Драка в цеху']={h:335,st(g,R){ // арена: прожекторы, сетка-рабица, флажки, силуэты зрителей
  for(const [x,c] of [[W*.2,'255,90,140'],[W*.5,'255,220,120'],[W*.8,'90,200,255']]){ cone(g,x,0,24,300,Hh*.85,`rgba(${c},.20)`,`rgba(${c},0)`); g.fillStyle=`rgba(${c},.5)`; circ(g,x,6,9); g.fill(); }
  g.strokeStyle='rgba(200,210,225,.07)'; g.lineWidth=1.5; for(let d=-Hh;d<W;d+=34){ line(g,d,0,d+Hh,Hh,'rgba(200,210,225,.07)',1.5); line(g,d+Hh,0,d,Hh,'rgba(200,210,225,.07)',1.5); }
  g.strokeStyle='rgba(255,220,120,.22)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,40); g.quadraticCurveTo(W/2,110,W,40); g.stroke(); for(let k=1;k<26;k++){ const f=k/26, x=k*W/26, y=40+140*f*(1-f); g.fillStyle=k%3?'rgba(255,90,140,.35)':k%3===1?'rgba(255,220,120,.35)':'rgba(90,200,255,.35)'; g.beginPath(); g.moveTo(x-7,y); g.lineTo(x+7,y); g.lineTo(x,y+16); g.fill(); }
  g.fillStyle='rgba(10,5,15,.55)'; for(let x=-10;x<W+20;x+=26){ circ(g,x,Hh-30-R()*12,11); g.fill(); g.fillRect(x-12,Hh-30,24,40); } },
  lv(c,t,Q){ for(const [i,x] of [[0,W*.2],[1,W*.5],[2,W*.8]]){ const sw=Math.sin(t*.8+i*2)*120; c.globalAlpha=.06; c.fillStyle=['#ff5a8c','#ffdc78','#5ac8ff'][i]; c.beginPath(); c.moveTo(x-12,0); c.lineTo(x+12,0); c.lineTo(x+sw+80,Hh); c.lineTo(x+sw-80,Hh); c.fill(); } c.globalAlpha=1; }};

BG['Порядок вдвоём']={h:210,st(g,R){ // гигантский пульт: кнопки 1-2-3, провода
  for(let i=0;i<3;i++){ const x=W*(.2+i*.3), y=Hh*.38; g.strokeStyle='rgba(190,210,235,.22)'; g.lineWidth=6; circ(g,x,y,46); g.stroke(); g.fillStyle='rgba(190,210,235,.08)'; circ(g,x,y,38); g.fill(); g.font='800 44px Unbounded, Rubik, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='rgba(220,235,255,.22)'; g.fillText(String(i+1),x,y+2); }
  for(let i=0;i<4;i++){ g.strokeStyle=['rgba(255,130,100,.18)','rgba(110,220,200,.18)','rgba(255,210,100,.18)','rgba(150,160,255,.18)'][i]; g.lineWidth=5; g.beginPath(); g.moveTo(0,Hh*.7+i*20); g.bezierCurveTo(W*.3,Hh*.5+i*30,W*.6,Hh*.9,W,Hh*.6+i*18); g.stroke(); }
  for(let x=30;x<W;x+=60){ g.fillStyle='rgba(190,210,235,.12)'; circ(g,x,Hh*.88,4); g.fill(); } },
  lv(c,t){ for(let i=0;i<3;i++){ const on=Math.floor(t*1.2)%4===i; c.globalAlpha=on?.55:.12; c.fillStyle=['#ff8a64','#6ee0c8','#ffd264'][i]; c.beginPath(); c.arc(W*(.2+i*.3),Hh*.38,34,0,TAU); c.fill(); } c.globalAlpha=1; }};

BG['Ракета']={h:185,st(g,R){ // пещера: тёмные глыбы с бирюзовыми жилами, кристаллы, мерцающая пыль
  glow(g,W*.5,Hh*.5,560,'rgba(60,220,210,.13)');
  for(let i=0;i<7;i++){ const x=R()*W, y=Hh*(.28+R()*.5), rx=90+R()*130, ry=60+R()*90; g.fillStyle='rgba(0,14,18,.62)'; g.beginPath(); g.ellipse(x,y,rx,ry,(R()-.5)*.6,0,TAU); g.fill();
    g.strokeStyle='rgba(90,255,235,.30)'; g.lineWidth=3; g.beginPath(); g.moveTo(x-rx*.6,y+ry*.2); g.lineTo(x-rx*.2,y-ry*.25); g.lineTo(x+rx*.1,y+ry*.1); g.lineTo(x+rx*.55,y-ry*.3); g.stroke(); }
  stalac(g,R,true,10,90,260,'rgba(0,12,16,.80)',30,90); stalac(g,R,false,10,70,220,'rgba(0,12,16,.80)',30,90);
  for(let i=0;i<10;i++){ const x=R()*W, top=R()<.5, y=top?150+R()*60:Hh-150-R()*60, c=R()<.5?'110,255,235':'255,130,220'; glow(g,x,y,120,`rgba(${c},.22)`); g.fillStyle=`rgba(${c},.55)`; for(let k=0;k<3;k++){ g.beginPath(); g.moveTo(x+k*14-14,y); g.lineTo(x+k*14-7,y+(top?1:-1)*(46+R()*40)); g.lineTo(x+k*14,y); g.fill(); } } },
  lv(c,t,Q){ for(let i=0;i<8;i++){ const q=Q.items[i], x=((q.x-t*(60+q.s*80))%W+W)%W, y=q.y; c.globalAlpha=.25+.25*Math.sin(t*3+q.p*5); c.fillStyle='#9ff'; c.fillRect(x,y,2.4,2.4); } c.globalAlpha=1; }};
BG['Лифт']={h:35,st(g,R){ for(let x=120;x<W;x+=340){ g.fillStyle='rgba(160,170,185,.14)'; g.fillRect(x-4,0,8,Hh); g.fillRect(x+60,0,8,Hh); for(let y=0;y<Hh;y+=60) line(g,x+4,y,x+60,y+30,'rgba(160,170,185,.06)',2); }
  for(let y=70;y<Hh;y+=200){ g.fillStyle='rgba(20,15,10,.28)'; g.fillRect(0,y,W,14); g.font='700 20px Rubik'; g.fillStyle='rgba(255,210,140,.26)'; g.fillText(String(Math.round(8-y/200)),W-46,y-6); } },
  lv(c,t,Q){ c.setLineDash([8,12]); c.lineDashOffset=t*50; c.strokeStyle='rgba(255,220,160,.14)'; c.lineWidth=2; for(let x=164;x<W;x+=340){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,Hh); c.stroke(); } c.setLineDash([]); }};

BG['Лифт-шахта']={h:262,st(g,R){ // шахта лифта: направляющие, тросы, противовес, указатели этажей
  for(let x=100;x<W;x+=300){ g.fillStyle='rgba(170,175,210,.16)'; g.fillRect(x-5,0,10,Hh); g.fillRect(x+90,0,10,Hh); for(let y=0;y<Hh;y+=44){ line(g,x+5,y,x+90,y+22,'rgba(170,175,210,.07)',2); line(g,x+90,y,x+5,y+22,'rgba(170,175,210,.07)',2); } g.fillStyle='rgba(120,100,190,.22)'; g.fillRect(x+20,Hh*.25+R()*200,50,90); line(g,x+45,0,x+45,Hh*.3,'rgba(210,215,235,.22)',3); }
  for(let y=60;y<Hh;y+=180){ g.fillStyle='rgba(8,6,18,.35)'; g.fillRect(0,y,W,10); g.fillStyle='rgba(120,255,160,.5)'; circ(g,40,y-14,5); g.fill(); g.fillStyle='rgba(255,90,80,.5)'; circ(g,64,y-14,5); g.fill(); } },
  lv(c,t,Q){ c.setLineDash([10,14]); c.lineDashOffset=t*70; c.strokeStyle='rgba(215,220,250,.20)'; c.lineWidth=2; for(let x=145;x<W;x+=300){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,Hh); c.stroke(); } c.setLineDash([]); const ph=Math.floor(t*1.5)%3; for(let y=60,k=0;y<Hh;y+=180,k++){ c.globalAlpha=k%3===ph?.7:.15; c.fillStyle='#8dffb0'; c.beginPath(); c.arc(40,y-14,5,0,TAU); c.fill(); } c.globalAlpha=1; }};

BG['Экзамен вдвоём']={h:150,st(g,R){ // классная доска с мелом
  g.fillStyle='rgba(10,40,25,.35)'; g.fillRect(60,60,W-120,Hh*.55); g.strokeStyle='rgba(150,110,70,.35)'; g.lineWidth=10; g.strokeRect(60,60,W-120,Hh*.55);
  g.strokeStyle='rgba(240,245,240,.26)'; g.lineWidth=3; g.font='600 34px Rubik, sans-serif'; g.fillStyle='rgba(240,245,240,.26)'; g.fillText('2 + 2 = ?',120,150); g.fillText('E = m·c²',W*.55,170); g.fillText('A+',W-220,Hh*.5);
  g.beginPath(); g.moveTo(130,240); g.lineTo(250,240); g.lineTo(190,330); g.closePath(); g.stroke(); circ(g,360,290,50); g.stroke(); g.beginPath(); g.moveTo(480,330); g.lineTo(640,250); g.lineTo(640,330); g.stroke();
  for(const x of [W*.25,W*.75]){ glow(g,x,Hh*.82,160,'rgba(255,230,170,.10)'); } },
  lv(c,t,Q){ for(let i=0;i<6;i++){ const q=Q.items[i], y=(q.y+t*14)%Hh; c.globalAlpha=.2; c.fillStyle='#f4f6f0'; c.fillRect(q.x,y,1.6,1.6); } c.globalAlpha=1; }};

BG['Ритм']={h:300,st(g,R){ // эквалайзер, диско-прожекторы, ноты
  for(let i=0;i<4;i++){ const x=W*(.12+i*.26); cone(g,x,0,20,240,Hh*.9,`hsla(${300+i*25},90%,65%,.14)`,'rgba(0,0,0,0)'); }
  for(let x=0;x<W;x+=26){ const h=40+R()*160; g.fillStyle=hs(300+x/W*80,80,60,.12); g.fillRect(x,Hh-h,18,h); }
  g.font='700 40px Rubik'; g.fillStyle='rgba(255,200,255,.14)'; for(let i=0;i<7;i++) g.fillText(['♪','♫','♩'][i%3],R()*W,100+R()*Hh*.5); },
  lv(c,t,Q){ for(let x=0,k=0;x<W;x+=26,k++){ const h=30+(Math.sin(t*5+k*.7)*.5+.5)*(40+Math.sin(k*1.9)*30+30); c.globalAlpha=.20; c.fillStyle=hs(300+x/W*80,85,62); c.fillRect(x,Hh-h,18,h); } c.globalAlpha=1; }};

BG['Утро в цеху']={h:38,st(g,R){ // рассвет в окнах, косые лучи, пыль
  vgrad(g,0,Hh,'rgba(255,190,110,.16)','rgba(255,120,80,.04)');
  for(let i=0;i<3;i++){ const x=100+i*400, y=60; g.fillStyle='rgba(255,200,130,.30)'; g.fillRect(x,y,170,230); g.fillStyle='rgba(20,10,5,.45)'; g.fillRect(x+82,y,6,230); g.fillRect(x,y+112,170,6); cone(g,x+85,y+230,170,380,Hh,'rgba(255,215,150,.16)'); glow(g,x+85,y+90,120,'rgba(255,220,150,.22)'); }
  g.fillStyle='rgba(30,20,10,.25)'; for(let x=0;x<W;x+=60){ g.fillRect(x,Hh-30,40,30); } },
  lv(c,t,Q){ for(const q of Q.motes){ const x=(q.x+t*9*q.s)%W, y=(q.y+Math.sin(t*.4+q.p)*20+VH)%Hh; c.globalAlpha=.30*(.5+.5*Math.sin(t+q.p)); c.fillStyle='#ffe2b0'; c.fillRect(x,y,1.8,1.8); } c.globalAlpha=1; }};

BG['Магнит']={h:190,st(g,R){ // силовые линии поля и подковы
  for(const x of [W*.25,W*.75]){ for(let k=1;k<=7;k++){ g.strokeStyle=`rgba(120,220,255,${.20-k*.02})`; g.lineWidth=2; g.beginPath(); g.ellipse(x,Hh*.5,k*52,k*78,0,0,TAU); g.stroke(); } }
  for(const [x,y,r] of [[W*.5,100,46],[W*.5,Hh-100,46]]){ g.strokeStyle='rgba(255,90,90,.28)'; g.lineWidth=22; g.beginPath(); g.arc(x,y,r,Math.PI,0); g.stroke(); g.strokeStyle='rgba(90,140,255,.28)'; g.beginPath(); g.arc(x,y,r,0,Math.PI); g.stroke(); }
  g.font='800 36px Rubik'; g.fillStyle='rgba(255,120,120,.18)'; for(let i=0;i<5;i++) g.fillText('+',R()*W,R()*Hh); g.fillStyle='rgba(120,160,255,.18)'; for(let i=0;i<5;i++) g.fillText('−',R()*W,R()*Hh); },
  lv(c,t,Q){ c.setLineDash([6,10]); c.lineDashOffset=-t*40; c.strokeStyle='rgba(150,235,255,.24)'; c.lineWidth=2; for(const x of [W*.25,W*.75]){ c.beginPath(); c.ellipse(x,Hh*.5,150,230,0,0,TAU); c.stroke(); } c.setLineDash([]); }};

BG['Трещины в стене']={h:22,st(g,R){ bricks(g,0,0,W,Hh,'rgba(220,190,160,.10)',64,28);
  for(let i=0;i<4;i++){ let x=R()*W,y=0; g.strokeStyle='rgba(8,5,3,.55)'; g.lineWidth=3; g.beginPath(); g.moveTo(x,y); while(y<Hh){ x+=(R()-.5)*60; y+=26+R()*30; g.lineTo(x,y); if(R()<.2){ g.moveTo(x,y); g.lineTo(x+(R()-.5)*90,y+30); g.moveTo(x,y); } } g.stroke(); }
  for(let i=0;i<10;i++){ g.fillStyle='rgba(170,140,110,.12)'; g.fillRect(R()*W,Hh-20-R()*20,12+R()*20,8+R()*12); } },
  lv(c,t,Q){ for(let i=0;i<6;i++){ const q=Q.items[i], y=((t*(40+q.s*40)+q.p*80)%(Hh+20))-10; c.globalAlpha=.28; c.fillStyle='#c9b79f'; c.fillRect(q.x,y,2,3); } c.globalAlpha=1; }};

BG['Эстафета']={h:30,st(g,R){ // стадион: трибуны с болельщиками, прожекторные мачты, гирлянда флагов, дорожки
  for(let k=0;k<3;k++){ const y=Hh*(.36+k*.14); g.fillStyle='rgba(12,8,6,.55)'; g.fillRect(0,y,W,Hh*.14); for(let x=8;x<W;x+=22){ g.fillStyle=['rgba(255,120,90,.55)','rgba(255,215,100,.55)','rgba(110,220,200,.55)','rgba(180,160,255,.5)'][(x/22+k)%4|0]; circ(g,x+(k%2)*8,y+10+R()*20,5); g.fill(); } }
  for(const x of [100,W-100]){ g.fillStyle='rgba(150,155,170,.28)'; g.fillRect(x-7,Hh*.16,14,Hh*.7); g.fillStyle='rgba(255,240,200,.75)'; g.fillRect(x-48,Hh*.10,96,30); glow(g,x,Hh*.14,260,'rgba(255,240,200,.26)'); cone(g,x,Hh*.16,70,360,Hh,'rgba(255,240,200,.10)'); }
  g.fillStyle='rgba(255,255,255,.24)'; g.fillRect(W/2-6,Hh*.2,12,Hh*.5); for(let i=0;i<10;i++) for(let j=0;j<2;j++){ g.fillStyle=(i+j)%2?'rgba(255,255,255,.35)':'rgba(10,10,10,.5)'; g.fillRect(W/2-100+i*20,Hh*.2+j*20,20,20); }
  for(let i=0;i<4;i++){ const y=Hh-84+i*20; line(g,0,y,W,y,'rgba(255,255,255,.22)',2); }
  g.strokeStyle='rgba(255,220,140,.35)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,50); g.quadraticCurveTo(W/2,130,W,50); g.stroke(); for(let k=1;k<30;k++){ const f=k/30, y=50+160*f*(1-f)*.5; g.fillStyle=['rgba(255,110,90,.55)','rgba(255,215,100,.55)','rgba(110,220,200,.55)'][k%3]; g.beginPath(); g.moveTo(f*W-8,y); g.lineTo(f*W+8,y); g.lineTo(f*W,y+16); g.fill(); } },
  lv(c,t,Q){ c.globalAlpha=.12+.05*Math.sin(t*2); c.fillStyle='#fff0c8'; c.beginPath(); c.arc(100,Hh*.14,70,0,TAU); c.arc(W-100,Hh*.14,70,0,TAU); c.fill(); for(let i=0;i<14;i++){ const q=Q.motes[i], x=(q.x+t*20)%W; c.globalAlpha=.5*Math.max(0,Math.sin(t*3+q.p*9)); c.fillStyle='#ffd966'; c.fillRect(x,Hh*(.38+.3*q.s),2.5,2.5); } c.globalAlpha=1; }};
BG['Склад ящиков']={h:30,st(g,R){ for(let i=0;i<4;i++){ const x=20+i*320, y=Hh*.18; g.strokeStyle='rgba(150,165,185,.20)'; g.lineWidth=5; g.strokeRect(x,y,280,Hh*.7); for(let k=1;k<3;k++) line(g,x,y+k*Hh*.7/3,x+280,y+k*Hh*.7/3,'rgba(150,165,185,.20)',5); for(let k=0;k<3;k++) for(let j=0;j<3;j++) if(R()<.75) crate(g,x+14+j*88,y+k*Hh*.7/3+Hh*.7/3-62,56,'rgba(100,75,50,.30)','rgba(220,170,110,.16)'); }
  lamp(g,W*.3,0,70,'rgba(255,220,150,.9)',8); lamp(g,W*.75,0,70,'rgba(255,220,150,.9)',8); },
  lv(c,t,Q){ for(const x of [W*.3,W*.75]){ c.globalAlpha=.05+.02*Math.sin(t*3+x); c.fillStyle='#ffe0a8'; c.beginPath(); c.moveTo(x-6,80); c.lineTo(x-170,Hh); c.lineTo(x+170,Hh); c.lineTo(x+6,80); c.fill(); } c.globalAlpha=1; }};

BG['Погоня за Механиком']={h:15,st(g,R){ // ночной город: небоскрёбы в окнах, фонари
  vgrad(g,0,Hh,'rgba(255,90,60,.12)','rgba(255,90,60,0)'); stars(g,R,40,Hh*.3,.4);
  for(const [a,c] of [[.55,'rgba(40,20,35,.55)'],[.8,'rgba(25,12,25,.75)']]){ let x=0; while(x<W){ const w=60+R()*90, h=Hh*(.15+R()*.4)*(a); g.fillStyle=c; g.fillRect(x,Hh-h,w,h); for(let wy=Hh-h+12;wy<Hh-20;wy+=20) for(let wx=x+8;wx<x+w-10;wx+=16) if(R()<.35){ g.fillStyle='rgba(255,210,120,.35)'; g.fillRect(wx,wy,7,9); } x+=w+4; } }
  for(let x=60;x<W;x+=280){ line(g,x,Hh*.5,x,Hh,'rgba(30,20,25,.8)',5); glow(g,x,Hh*.5,110,'rgba(255,210,140,.22)'); } },
  lv(c,t,Q){ c.globalAlpha=.14; c.strokeStyle='#ffd8c0'; c.lineWidth=2; for(let i=0;i<8;i++){ const q=Q.items[i], x=((q.x*2-t*(700+q.s*400))%(W+300)+W+300)%(W+300)-150, y=40+q.y*.9; c.beginPath(); c.moveTo(x,y); c.lineTo(x+120,y); c.stroke(); } c.globalAlpha=1; }};

BG['Серфинг']={h:200,st(g,R){ // закат над морем
  vgrad(g,0,Hh*.6,'rgba(255,120,90,.30)','rgba(255,210,130,.18)'); glow(g,W*.7,Hh*.55,260,'rgba(255,230,160,.45)'); g.fillStyle='rgba(255,236,180,.55)'; circ(g,W*.7,Hh*.55,64); g.fill();
  vgrad(g,Hh*.6,Hh,'rgba(30,110,170,.35)','rgba(10,50,100,.55)');
  for(let k=0;k<5;k++){ const y=Hh*.62+k*Hh*.075; g.strokeStyle=`rgba(190,240,255,${.20-k*.025})`; g.lineWidth=2+k*.5; g.beginPath(); for(let x=0;x<=W;x+=20){ const yy=y+Math.sin(x/(70+k*10)+k)*(3+k*1.6); x?g.lineTo(x,yy):g.moveTo(x,yy); } g.stroke(); }
  g.strokeStyle='rgba(255,230,190,.35)'; g.lineWidth=4; for(let i=0;i<3;i++){ const x=100+R()*(W-200), y=60+R()*Hh*.25; g.beginPath(); g.moveTo(x-14,y); g.quadraticCurveTo(x-6,y-9,x,y); g.quadraticCurveTo(x+6,y-9,x+14,y); g.stroke(); } },
  lv(c,t,Q){ c.strokeStyle='rgba(200,245,255,.24)'; c.lineWidth=2; for(let k=0;k<4;k++){ c.beginPath(); for(let x=0;x<=W;x+=20){ const y=Hh*.66+k*Hh*.07+Math.sin(x/60+t*(1.4+k*.3)+k)*(3+k*1.5); x?c.lineTo(x,y):c.moveTo(x,y); } c.stroke(); }
    c.globalAlpha=.10+.05*Math.sin(t*1.5); c.fillStyle='#fff0c0'; for(let i=0;i<6;i++){ c.fillRect(W*.7-60+i*20+Math.sin(t+i)*4,Hh*.62+i*14,40-i*4,3); } c.globalAlpha=1; }};

BG['Кнопочная']={h:12,st(g,R){ for(let r=0;r<4;r++) for(let k=0;k<12;k++){ const x=70+k*100+(r%2)*30, y=80+r*150; g.strokeStyle='rgba(255,200,170,.16)'; g.lineWidth=4; circ(g,x,y,26); g.stroke(); g.fillStyle=['rgba(255,110,90,.16)','rgba(110,220,200,.16)','rgba(255,210,100,.16)'][(r+k)%3]; circ(g,x,y,18); g.fill(); }
  g.strokeStyle='rgba(255,200,170,.08)'; g.lineWidth=2; for(let i=0;i<7;i++){ g.beginPath(); let x=R()*W,y=R()*Hh; g.moveTo(x,y); for(let k=0;k<5;k++){ if(k%2) x+=(R()-.5)*300; else y+=(R()-.5)*240; g.lineTo(x,y); } g.stroke(); } },
  lv(c,t,Q){ for(let r=0;r<4;r++) for(let k=0;k<12;k++){ if(Math.sin(t*1.7+r*2.3+k*1.1)>.82){ c.globalAlpha=.4; c.fillStyle='#ffe0b0'; c.beginPath(); c.arc(70+k*100+(r%2)*30,80+r*150,16,0,TAU); c.fill(); } } c.globalAlpha=1; }};

BG['Колесо на проводе']={h:228,st(g,R){ // ночь, опоры ЛЭП и провисшие провода
  vgrad(g,0,Hh,'rgba(30,40,110,.30)','rgba(10,10,40,0)'); stars(g,R,90,Hh*.7,.6); glow(g,W*.2,90,110,'rgba(220,230,255,.16)'); g.fillStyle='rgba(230,236,255,.40)'; circ(g,W*.2,90,26); g.fill(); g.fillStyle='rgba(10,12,40,.55)'; circ(g,W*.2+10,84,24); g.fill();
  for(const x of [W*.15,W*.5,W*.85]){ g.strokeStyle='rgba(10,10,30,.75)'; g.lineWidth=6; g.beginPath(); g.moveTo(x-50,Hh); g.lineTo(x-10,Hh*.18); g.lineTo(x+10,Hh*.18); g.lineTo(x+50,Hh); g.stroke(); line(g,x-60,Hh*.28,x+60,Hh*.28,'rgba(10,10,30,.75)',6); line(g,x-45,Hh*.42,x+45,Hh*.42,'rgba(10,10,30,.75)',5); for(let y=Hh*.2;y<Hh*.9;y+=60) line(g,x-14-(y-Hh*.2)*.07,y,x+14+(y-Hh*.2)*.07,y+30,'rgba(10,10,30,.55)',3); }
  for(let k=0;k<3;k++){ g.strokeStyle='rgba(170,190,255,.22)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,Hh*.28+k*10); g.quadraticCurveTo(W*.325,Hh*.45+k*12,W*.5,Hh*.28+k*10); g.quadraticCurveTo(W*.675,Hh*.45+k*12,W,Hh*.28+k*10); g.stroke(); } },
  lv(c,t,Q){ const ph=t%2.6; if(ph<.14){ const x=((Math.floor(t/2.6)*397)%(W-200))+100; c.globalAlpha=.7; c.strokeStyle='#cfe4ff'; c.lineWidth=2; c.shadowColor='#7fb4ff'; c.shadowBlur=12; c.beginPath(); let y=Hh*.3; c.moveTo(x,y); for(let k=0;k<7;k++){ c.lineTo(x+(Math.random()-.5)*50,y+=22+Math.random()*10); } c.stroke(); c.shadowBlur=0; } for(let i=0;i<8;i++){ const q=Q.items[i]; c.globalAlpha=.2+.4*Math.max(0,Math.sin(t*2+q.p*4)); c.fillStyle='#fff'; c.fillRect(q.x,q.y*.5,1.6,1.6); } c.globalAlpha=1; }};

BG['Скрипучие ступени']={h:30,st(g,R){ // старая лестница, паутина, лунный свет в окне
  g.fillStyle='rgba(180,200,255,.20)'; g.fillRect(W*.7,60,150,200); g.fillStyle='rgba(8,5,12,.55)'; g.fillRect(W*.7+72,60,6,200); g.fillRect(W*.7,156,150,6); cone(g,W*.7+75,260,150,420,Hh,'rgba(180,200,255,.10)');
  g.fillStyle='rgba(60,40,28,.40)'; for(let i=0;i<9;i++){ g.fillRect(40+i*60,Hh*.45+i*28,70,14); g.fillRect(40+i*60,Hh*.45+i*28+14,10,Hh); }
  for(const [cx,cy,sx] of [[0,0,1],[W,0,-1]]){ g.strokeStyle='rgba(220,225,235,.14)'; g.lineWidth=1; for(let k=1;k<7;k++){ g.beginPath(); g.arc(cx,cy,k*30,sx>0?0:Math.PI/2,sx>0?Math.PI/2:Math.PI); g.stroke(); } for(let a=0;a<=Math.PI/2;a+=Math.PI/10) line(g,cx,cy,cx+sx*Math.cos(a)*190,cy+Math.sin(a)*190,'rgba(220,225,235,.14)',1); } },
  lv(c,t,Q){ for(const q of Q.motes){ const x=(q.x+t*5*q.s)%W,y=(q.y+t*7)%Hh; c.globalAlpha=.25*(.5+.5*Math.sin(t+q.p)); c.fillStyle='#cdd8ff'; c.fillRect(x,y,1.6,1.6); } c.globalAlpha=1; }};

BG['Лабиринт']={h:285,st(g,R){ // стены-лабиринт линиями и факелы
  g.strokeStyle='rgba(205,175,255,.26)'; g.lineWidth=12; g.lineCap='square'; for(let i=0;i<26;i++){ const x=Math.round(R()*W/80)*80, y=Math.round((Hh*.15+R()*Hh*.7)/80)*80, l=80+((R()*3)|0)*80; g.beginPath(); g.moveTo(x,y); if(R()<.5) g.lineTo(x+l,y); else g.lineTo(x,y+l); g.stroke(); } g.lineCap='butt';
  for(let i=0;i<6;i++){ const x=60+(i*203)%(W-120), y=Hh*(.3+.4*((i*37)%10)/10); g.fillStyle='rgba(60,40,20,.75)'; g.fillRect(x-5,y,10,34); g.strokeStyle='rgba(150,150,170,.5)'; g.lineWidth=3; g.strokeRect(x-9,y-4,18,8); glow(g,x,y-10,150,'rgba(255,160,70,.34)'); } },
  lv(c,t,Q){ for(let i=0;i<6;i++){ const f=Math.sin(t*10+i*3)*.5+.5, x=60+(i*203)%(W-120), y=Hh*(.3+.4*((i*37)%10)/10); c.globalAlpha=.7; c.fillStyle='#ffa43c'; c.beginPath(); c.moveTo(x-7,y-4); c.quadraticCurveTo(x-5,y-18-f*8,x,y-28-f*10); c.quadraticCurveTo(x+5,y-18,x+7,y-4); c.fill(); } c.globalAlpha=1; }};
BG['Ключник']={h:48,st(g,R){ for(let i=0;i<8;i++){ const x=R()*W, y=Hh*(.15+R()*.6), s=.7+R()*.9; g.save(); g.translate(x,y); g.rotate((R()-.5)*1.2); g.scale(s,s); g.strokeStyle='rgba(255,215,120,.22)'; g.lineWidth=5; circ(g,0,0,14); g.stroke(); g.beginPath(); g.moveTo(14,0); g.lineTo(70,0); g.moveTo(54,0); g.lineTo(54,14); g.moveTo(66,0); g.lineTo(66,12); g.stroke(); g.restore(); }
  for(let i=0;i<5;i++){ const x=R()*W, y=60+R()*Hh*.3; line(g,x,0,x,y,'rgba(190,200,215,.18)',3); g.fillStyle='rgba(255,215,120,.18)'; g.fillRect(x-16,y,32,26); g.strokeStyle='rgba(255,215,120,.24)'; g.lineWidth=5; g.beginPath(); g.arc(x,y,11,Math.PI,0); g.stroke(); g.fillStyle='rgba(10,8,4,.45)'; circ(g,x,y+11,4); g.fill(); } },
  lv(c,t,Q){ for(let i=0;i<4;i++){ const q=Q.items[i], g2=Math.max(0,Math.sin(t*1.3+q.p*8)); c.globalAlpha=.25*g2; c.fillStyle='#ffe9a0'; c.beginPath(); c.arc(q.x,q.y,26+g2*10,0,TAU); c.fill(); } c.globalAlpha=1; }};

BG['Лёд']={h:195,st(g,R){ // ледяная пещера: сияние, сосульки, ледяные кристаллы, иней
  vgrad(g,0,Hh*.7,'rgba(90,255,200,.16)','rgba(80,150,255,0)'); g.strokeStyle='rgba(120,255,210,.16)'; g.lineWidth=40; g.beginPath(); for(let x=0;x<=W;x+=30){ const y=Hh*.28+Math.sin(x/170)*50; x?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
  for(let i=0;i<7;i++){ const x=60+R()*(W-120), h=140+R()*200, w=34+R()*40, y=Hh; g.fillStyle='rgba(150,215,255,.20)'; g.beginPath(); g.moveTo(x-w,y); g.lineTo(x-w*.6,y-h*.8); g.lineTo(x,y-h); g.lineTo(x+w*.6,y-h*.8); g.lineTo(x+w,y); g.fill(); g.strokeStyle='rgba(220,245,255,.30)'; g.lineWidth=2; g.beginPath(); g.moveTo(x,y); g.lineTo(x,y-h); g.moveTo(x-w*.6,y-h*.8); g.lineTo(x,y); g.stroke(); }
  stalac(g,R,true,16,90,270,'rgba(170,225,255,.34)',22,56);
  for(let i=0;i<70;i++){ g.fillStyle=`rgba(255,255,255,${.12+R()*.35})`; circ(g,R()*W,R()*Hh,.8+R()*1.8); g.fill(); } },
  lv(c,t,Q){ for(const q of Q.motes){ const x=(q.x+Math.sin(t*.7+q.p)*20+t*8)%W, y=((q.y+t*(18+q.s*22))%(Hh+10)); c.globalAlpha=.7; c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,1+q.s*1.8,0,TAU); c.fill(); } c.globalAlpha=.09+.04*Math.sin(t*.8); c.fillStyle='#80ffd8'; c.fillRect(0,Hh*.2+Math.sin(t*.5)*16,W,110); c.globalAlpha=1; }};
BG['Рычаги и решётки']={h:210,st(g,R){ for(let i=0;i<5;i++){ const x=80+i*250+R()*40, y=Hh*.62; g.fillStyle='rgba(30,35,50,.5)'; g.fillRect(x-30,y+60,60,30); g.strokeStyle='rgba(210,220,235,.28)'; g.lineWidth=8; const a=(R()-.5)*1.4; g.beginPath(); g.moveTo(x,y+60); g.lineTo(x+Math.sin(a)*120,y+60-Math.cos(a)*120); g.stroke(); g.fillStyle=['rgba(255,110,90,.5)','rgba(110,220,200,.5)'][i%2]; circ(g,x+Math.sin(a)*120,y+60-Math.cos(a)*120,13); g.fill(); }
  g.strokeStyle='rgba(180,195,215,.16)'; g.lineWidth=6; for(let k=0;k<3;k++){ const x=60+k*420, y=30; g.strokeRect(x,y,240,Hh*.42); for(let b=1;b<8;b++) line(g,x+b*30,y,x+b*30,y+Hh*.42,'rgba(180,195,215,.16)',4); } },
  lv(c,t,Q){ c.globalAlpha=.4; for(let i=0;i<5;i++){ const on=Math.sin(t*1.4+i*2)>0; c.fillStyle=on?'#6ee0c8':'#ff6e5a'; c.beginPath(); c.arc(80+i*250+(Q.items[i].x%40)-18,60,5,0,TAU); c.fill(); } c.globalAlpha=1; }};

BG['Вращающаяся комната']={h:35,st(g,R){ g.strokeStyle='rgba(255,200,130,.07)'; g.lineWidth=2; for(let k=1;k<14;k++){ circ(g,W/2,Hh/2,k*60); g.stroke(); } for(let a=0;a<TAU;a+=TAU/16) line(g,W/2,Hh/2,W/2+Math.cos(a)*900,Hh/2+Math.sin(a)*900,'rgba(255,200,130,.07)',2);
  gear(g,W*.18,Hh*.3,95,14,'rgba(255,190,110,.18)',7); gear(g,W*.82,Hh*.7,120,16,'rgba(255,190,110,.18)',7); },
  lv(c,t,Q){ c.save(); c.translate(W/2,Hh/2); c.rotate(t*.18); for(let k=0;k<4;k++){ c.rotate(Math.PI/2); c.fillStyle='rgba(255,200,130,.07)'; c.beginPath(); c.moveTo(0,0); c.lineTo(520,-70); c.lineTo(520,70); c.fill(); } c.restore(); c.save(); c.translate(W*.18,Hh*.3); c.rotate(t*.35); c.globalAlpha=.22; c.strokeStyle='rgba(255,190,110,1)'; c.lineWidth=7; c.beginPath(); for(let k=0;k<=28;k++){ const a=k/28*TAU, rr=k%2?95:108; c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); } c.stroke(); c.restore(); c.save(); c.translate(W*.82,Hh*.7); c.rotate(-t*.3); c.globalAlpha=.22; c.beginPath(); for(let k=0;k<=32;k++){ const a=k/32*TAU, rr=k%2?120:137; c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); } c.stroke(); c.restore(); c.globalAlpha=1; }};

BG['Пружинный цех']={h:195,st(g,R){ for(let i=0;i<8;i++){ const x=60+i*150+R()*50, y=Hh*(.25+R()*.4), h=90+R()*120, w=20+R()*20; g.strokeStyle='rgba(190,215,240,.20)'; g.lineWidth=5; g.beginPath(); for(let k=0;k<=12;k++) g.lineTo(x+(k%2?w:-w),y+k*h/12); g.stroke(); g.fillStyle='rgba(190,215,240,.14)'; g.fillRect(x-w-10,y-8,w*2+20,10); g.fillRect(x-w-10,y+h,w*2+20,10); }
  for(let i=0;i<3;i++) gear(g,R()*W,R()*Hh,50+R()*40,10,'rgba(190,215,240,.08)',5); },
  lv(c,t,Q){ c.strokeStyle='rgba(210,235,255,.16)'; c.lineWidth=4; for(let i=0;i<4;i++){ const q=Q.items[i], b=Math.abs(Math.sin(t*2+q.p*5)); c.beginPath(); for(let k=0;k<=10;k++) c.lineTo(q.x+(k%2?16:-16),q.y+k*(7+b*5)); c.stroke(); } }};

BG['Кузнец']={h:8,st(g,R){ // кузня: печь с жаром, цепи, молоты, наковальня
  g.fillStyle='rgba(20,8,5,.45)'; g.beginPath(); g.moveTo(W*.35,Hh); g.lineTo(W*.35,Hh*.4); g.arc(W*.5,Hh*.4,W*.15,Math.PI,0); g.lineTo(W*.65,Hh); g.fill(); glow(g,W*.5,Hh*.55,360,'rgba(255,100,30,.40)'); glow(g,W*.5,Hh*.62,200,'rgba(255,200,90,.35)');
  for(let i=0;i<5;i++){ const x=R()*W; g.strokeStyle='rgba(150,150,165,.22)'; g.lineWidth=4; for(let y=0;y<60+R()*180;y+=18){ g.beginPath(); g.ellipse(x,y+8,5,9,0,0,TAU); g.stroke(); } }
  for(let i=0;i<4;i++){ const x=R()<.5?R()*W*.3:W*.7+R()*W*.3, y=Hh*.3+R()*Hh*.3, a=(R()-.5)*1.2; g.save(); g.translate(x,y); g.rotate(a); g.fillStyle='rgba(10,6,6,.45)'; g.fillRect(-4,-10,8,90); g.fillRect(-30,-30,60,24); g.restore(); }
  g.fillStyle='rgba(10,6,6,.5)'; g.beginPath(); g.moveTo(W*.1-40,Hh); g.lineTo(W*.1-30,Hh-40); g.lineTo(W*.1-60,Hh-52); g.lineTo(W*.1+70,Hh-52); g.lineTo(W*.1+40,Hh-40); g.lineTo(W*.1+30,Hh); g.fill(); },
  lv(c,t,Q){ c.globalAlpha=.08+.05*Math.sin(t*3); glow(c,W*.5,Hh*.6,360,'rgba(255,110,30,1)'); for(let i=0;i<8;i++){ const q=Q.items[i], y=Hh-((t*(50+q.s*60)+q.p*120)%(Hh*.9)); c.globalAlpha=.55*(y/Hh); c.fillStyle='#ffa84a'; c.fillRect(q.x+Math.sin(t*2+q.p)*12,y,2+q.s*2,2+q.s*2); } c.globalAlpha=1; }};

// пары «название → оттенок» нужны и для старых имён, которые у одного уровня могут повторяться
const BYNAME=BG;

/* ---- подключение к движку ---- */
const SKIP={'Труба':1,'Заводской двор':1};
const cur=()=>{ const L=getLevel(levelIdx); const n=L&&L.name; return (n&&BG[n]&&!SKIP[n]&&!arena)?BG[n]:null; };
const _dnm=drawNameMotif;
drawNameMotif=function(g,name,R){ const d=cur(); if(!d) return _dnm(g,name,R); const sd=Math.floor(R()*1e9);
  for(let k=0;k<(d.k||3);k++){ g.save(); try{ d.st(g,rng(sd)); }catch(e){ console.warn('bg',e); } g.restore(); } };   // два прохода = ярче без правки каждого рисунка
const _dtd=drawThemeDecor;
drawThemeDecor=function(g,TH){ if(cur()) return; return _dtd(g,TH); };
const _mkl=makeLive;
makeLive=function(TH,name){ const L=_mkl(TH,name), d=cur(); if(d){ L.m='bgx'; L.bgx=d; } return L; };
const _dl=drawLive;
drawLive=function(){ const L=LIVE; if(!L||!L.bgx) return _dl(); _dl(); const c=ctx, t=clock; c.save(); try{ L.bgx.lv(c,t,L); }catch(e){} c.restore(); c.globalAlpha=1; };
/* три красные лампы-тревога (как в вступительном ролике): перед боссом (уровни 7–9 каждого акта) мигают в углу экрана — «впереди босс». Рисуются поверх 3D */
const _dh=drawHud;
drawHud=function(){ _dh(); try{
  if(arena||intro||boss||!(state==='play'||state==='loading')) return; const n=levelIdx+1, d=n%10;
  if(!(d>=7&&d<=9)) return; const t=clock, c=ctx, k=.55+.45*Math.sin(t*5), x0=W-92, y0=84;
  c.save(); for(const [dx,dy] of [[0,0],[-15,24],[15,24]]){ const x=x0+dx, y=y0+dy;
    c.globalAlpha=k*.8; glow(c,x,y,30,'rgba(255,60,50,.9)'); c.globalAlpha=.55+.45*k; c.fillStyle='#ff4d44'; circ(c,x,y,5.5); c.fill(); c.fillStyle='rgba(255,225,215,.85)'; circ(c,x-1.6,y-1.6,1.7); c.fill(); }
  c.restore(); }catch(e){} };
const _lt=levelTheme;
levelTheme=function(){ const TH=_lt(), d=cur(); if(d&&d.h!=null){ const s=d.s||50; TH.h=d.h; TH.paper=`rgb(${hslRgb(d.h,s,11.5)})`; TH.wall=`rgb(${hslRgb(d.h,s+5,6.5)})`; TH.grid=hslRgb(d.h,70,80); TH.hatch=`rgba(${hslRgb(d.h,70,80)},.16)`; TH.edge=`rgba(${hslRgb(d.h,80,88)},.9)`; } return TH; };
return {BG};
})();
