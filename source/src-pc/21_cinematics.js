/* ================= ending cinematic ================= */
let proT=0, proLast=0, proBolt=false;
const PRO_LEN=30;
function drawPrologue(){
  const now=performance.now(), dt=Math.min(.05,(now-(proLast||now))/1000); proLast=now; proT+=dt;
  if(pressed.has('Enter')||pressed.has('Space')||pressed.has('Escape')) proT=Math.max(proT,PRO_LEN);
  const t=proT, c=ctx, W=VW, H=VH, ease=k=>k<0?0:k>1?1:k*k*(3-2*k), FY=H*.82;
  const awake=ease((t-6.2)/1.2), red=awake*(t<15?1:.8);
  c.fillStyle=`rgb(${8+20*red|0},${10|0},${22-6*red|0})`; c.fillRect(0,0,W,H);
  // rain + lightning (scene 1-2)
  if(t<9){ c.strokeStyle='rgba(160,190,230,.25)'; c.lineWidth=1; c.beginPath(); for(let i=0;i<70;i++){ const x=(i*97+t*900)%W, y=(i*53+t*1400)%H; c.moveTo(x,y); c.lineTo(x-6,y+18); } c.stroke(); }
  if(t>5.6&&t<6.4){ c.fillStyle=`rgba(230,240,255,${(Math.sin(t*60)*.5+.5)*.7})`; c.fillRect(0,0,W,H); c.strokeStyle='#eaf2ff'; c.lineWidth=4; c.shadowColor='#bfe2ff'; c.shadowBlur=30*GLOW; c.beginPath(); let x=W/2+40,y=0; c.moveTo(x,y); while(y<H*.42){ x+=(Math.random()-.5)*60; y+=30; c.lineTo(x,y); } c.stroke(); c.shadowBlur=0; if(!proBolt){ proBolt=true; shake=20; sfx('boss'); } }
  if(t<5.6) proBolt=false;
  // workshop interior: floor + machines
  c.fillStyle='#05060c'; c.fillRect(0,FY,W,H-FY);
  c.fillStyle='#0c1020'; for(const [x,w,h] of [[60,120,170],[230,90,120],[W-260,140,190],[W-110,80,130]]) c.fillRect(x,FY-h,w,h);
  // the Main Mechanism
  const mx=W/2, my=H*.42, R=120+awake*20;
  c.save(); c.translate(mx,my); c.rotate(t*.15*awake);
  c.fillStyle=`rgb(${30+40*awake|0},${30|0},${40|0})`; c.beginPath(); for(let i=0;i<=32;i++){ const a=i/32*Math.PI*2, r=i%2?R:R*1.15; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } c.fill(); c.restore();
  c.fillStyle='#090b14'; c.beginPath(); c.arc(mx,my,R*.62,0,Math.PI*2); c.fill();
  if(awake>0){ const e=.6+.4*Math.sin(t*6); c.fillStyle=`rgba(255,40,50,${awake*e})`; c.shadowColor='#ff2030'; c.shadowBlur=40*GLOW*awake; c.beginPath(); c.arc(mx-34,my-6,16,0,Math.PI*2); c.arc(mx+34,my-6,16,0,Math.PI*2); c.fill(); c.shadowBlur=0; }
  // red waves converting tools into guards (scene 3)
  if(t>9.5&&t<16){ const k=(t-9.5); for(let i=0;i<3;i++){ const r=((k*160+i*140)%520); c.strokeStyle=`rgba(255,50,60,${.5*(1-r/520)})`; c.lineWidth=4; c.beginPath(); c.arc(mx,my,r,0,Math.PI*2); c.stroke(); } }
  const guards=[['toad',W*.13,FY],['gear',W*.31,FY],['eye',W*.69,H*.3],['queen',W*.87,FY]];
  drawPrologue.bs=drawPrologue.bs||{};
  guards.forEach(([type,x,y],i)=>{ const k=ease((t-10.3-i*.9)/1); if(k<=0||t>16.5) return; const b=drawPrologue.bs[type]||(drawPrologue.bs[type]=makeBoss(type,1));
    const sc=.75; b.t=t; b.flash=0; b.dead=false; b.face=x<W/2?1:-1; b.x=0; b.y=0; c.save(); c.globalAlpha=k; c.translate(x-b.w*sc/2,(y===FY?FY-b.h*sc:y-b.h*sc/2)); c.scale(sc,sc);
    try{ drawBoss(b); }catch(e){} c.restore();
    c.save(); c.globalAlpha=k*.9; c.textAlign='center'; c.font="700 13px Unbounded, sans-serif"; c.fillStyle='#ff8a8a'; c.fillText(BOSS_NAMES[type],x,(y===FY?FY-b.h*sc-14:y+b.h*sc/2+18)); c.restore(); });
  if(t>14&&t<16.5){ const k=ease((t-14)/1)*(1-ease((t-16)/.5)); c.save(); c.globalAlpha=k; c.textAlign='center'; c.font="700 15px Unbounded, sans-serif"; c.fillStyle='#ff4d5e'; c.fillText('…а в самом сердце — '+BOSS_NAMES.core.toUpperCase(),W/2,my+R+40); c.restore(); }
  // two survivors (scene 4-5)
  if(t>16){ const k=ease((t-16)/1.5);
    const sy=t<17.5?H*.28+(FY-30-H*.28)*ease((t-16)/1.4):FY-30, bx=t<18.5?W*.85-(W*.85-W*.47)*ease((t-17)/1.6):W*.47;
    if(t>16&&t<17.5&&Math.random()<.5) addP({x:W*.42,y:sy+15,vx:(Math.random()-.5)*60,vy:-30,life:.4,max:.4,c:'#ffd166',s:3,g:0});
    if(settings.glow){ c.save(); c.globalCompositeOperation='lighter'; glowAt(W*.42+12,sy+4,140,'#ffb347',.3*k); c.restore(); }
    drawSpark({kind:'spark',w:24,h:30,x:W*.42,y:sy,sx:1,sy:1,face:1,blinkT:1,inv:0,down:false,shield:false,dead:false,vx:0});
    if(t>17) drawBolt({kind:'bolt',w:34,h:56,x:bx,y:FY-56,sx:1,sy:1,face:-1,blinkT:1,inv:0,down:false,shield:false,dead:false,slam:false,vx:t<18.5?-100:0}); }
  for(const q of particles){ c.globalAlpha=Math.max(0,q.life/q.max); c.fillStyle=q.c; c.fillRect(q.x-q.s/2,q.y-q.s/2,q.s,q.s); } c.globalAlpha=1;
  const cap=(txt,t0,t1,size,col,y,who)=>{ const a=Math.min(ease((t-t0)/.6),1-ease((t-t1+.6)/.6)); if(a<=0) return; drawPrologue.said=drawPrologue.said||{}; if(!drawPrologue.said[txt]&&t<t1-.5){ drawPrologue.said[txt]=1; babble(txt,who||'narr'); } c.save(); c.globalAlpha=a; c.textAlign='center'; c.textBaseline='middle'; c.font=`800 ${size}px Unbounded, 'Arial Black', sans-serif`; c.lineWidth=8; c.strokeStyle='rgba(0,0,0,.7)'; c.strokeText(txt,W/2,y||H*.1); c.fillStyle=col; c.fillText(txt,W/2,y||H*.1); c.restore(); };
  if(t<.3) drawPrologue.said={};
  cap('Старая мастерская давно закрыта. Мастер ушёл и не вернулся.',0.4,5.4,24,'#cfd8e6');
  cap('Но однажды ночью в крышу ударила молния…',5,7.6,26,'#eaf2ff');
  cap('…и Главный Механизм проснулся.',7.4,10,30,'#ff4d5e',null,'boss');
  cap('Он перепрошил станки и инструменты и сделал из них своих стражей.',10,16,22,'#ffb3b3');
  cap('Уцелели только двое: искорка из сварочного аппарата…',16,19,22,'#ffb347',null,'spark');
  cap('…и упрямый болт с конвейера.',18.6,21.4,24,'#7fe8e0',null,'bolt');
  cap('Впереди 100 цехов, 10 стражей и Сердце мастерской.',21.4,25,22,'#eaf2ff');
  cap('Остановить Механизм можно только вместе.',24.6,27.4,28,'#ffd166');
  if(t>27){ const k=ease((t-27)/.8); c.fillStyle=`rgba(0,0,0,${k*.7})`; c.fillRect(0,0,W,H); c.save(); c.globalAlpha=k; c.textAlign='center'; c.textBaseline='middle'; c.font="900 86px Unbounded, 'Arial Black', sans-serif";
    c.fillStyle='#ff8a3d'; c.fillText('ИСКРА',W/2-170,H/2); c.fillStyle='#eaf2ff'; c.font="900 44px Unbounded, sans-serif"; c.fillText('и',W/2+30,H/2+8); c.fillStyle='#62c7c1'; c.font="900 86px Unbounded, 'Arial Black', sans-serif"; c.fillText('БОЛТ',W/2+210,H/2); c.restore(); }
  if(t>1&&t<PRO_LEN){ c.save(); c.globalAlpha=.5; c.font="500 13px Rubik, sans-serif"; c.fillStyle='#cfd8e6'; c.textAlign='right'; c.fillText('Enter — пропустить',W-20,H-16); c.restore(); }
  if(t>=PRO_LEN){ particles=[]; const f=storyNext; storyNext=null; if(f) f(); else setState('menu'); }
}
let endT=0, endLast=0, endBoom=false;
const END_LEN=24;
function drawEnding(){
  const now=performance.now(); const dt=Math.min(.05,(now-(endLast||now))/1000); endLast=now; endT+=dt;
  if(pressed.has('Enter')||pressed.has('Space')||pressed.has('Escape')){ endT=Math.max(endT,END_LEN); }
  const t=endT, c=ctx, W=VW, H=VH, ease=k=>k<0?0:k>1?1:k*k*(3-2*k);
  const threat=ease((t-11)/2);              // 0 calm → 1 menace
  // sky
  const g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,`rgb(${20+40*(1-threat)|0},${30+60*(1-threat)|0},${70+40*(1-threat)-50*threat|0})`);
  g.addColorStop(1,`rgb(${60+120*(1-threat)+40*threat|0},${40+60*(1-threat)|0},${50|0})`);
  c.fillStyle=g; c.fillRect(0,0,W,H);
  // sunrise / red glow
  const sg=c.createRadialGradient(W/2,H*.78,10,W/2,H*.78,520); sg.addColorStop(0,threat>.5?'rgba(255,40,50,.55)':'rgba(255,209,102,.55)'); sg.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=sg; c.fillRect(0,0,W,H);
  // distant giant silhouette
  if(t>11.5){ const k=ease((t-11.5)/6), sc=.6+k*.7, x=W*.72, y=H*.74, sh=Math.sin(t*20)*k*2;
    c.save(); c.translate(x+sh,y); c.scale(sc,sc); c.globalAlpha=Math.min(1,k*1.4); c.fillStyle='#07060c';
    c.beginPath(); c.moveTo(-220,0); c.lineTo(-180,-260); c.lineTo(-90,-330); c.lineTo(-60,-420); c.lineTo(60,-420); c.lineTo(90,-330); c.lineTo(180,-260); c.lineTo(220,0); c.closePath(); c.fill();
    for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+t*.4; c.fillRect(Math.cos(a)*150-14,-200+Math.sin(a)*150-14,28,28); }
    const eye=.6+.4*Math.sin(t*5); c.fillStyle=`rgba(255,40,40,${eye})`; c.shadowColor='#ff2030'; c.shadowBlur=30*GLOW; c.beginPath(); c.arc(-40,-360,14,0,Math.PI*2); c.arc(40,-360,14,0,Math.PI*2); c.fill(); c.restore(); }
  // workshop skyline
  c.fillStyle='#0a0d18'; for(let i=0;i<14;i++){ const x=i*W/13-30, h=60+((i*37)%5)*28; c.fillRect(x,H*.8-h,W/13-6,h); if((i%3===0)&&t<11){ c.fillStyle='rgba(255,209,102,.6)'; c.fillRect(x+12,H*.8-h+14,10,10); c.fillStyle='#0a0d18'; } }
  c.fillStyle='#05060c'; c.fillRect(0,H*.8,W,H*.2);
  // fireworks while calm
  if(t>4&&t<10.5&&Math.random()<.07){ const fx=W*(.15+Math.random()*.5), fy=H*(.15+Math.random()*.3); burst(fx,fy,34,['#ff8a3d','#62c7c1','#ffd166','#ff5fa2'],320,1.1); sfx('gear'); }
  if(t>10.8&&!endBoom){ endBoom=true; shake=26; flash('#ff2030',.6); sfx('boss'); }
  if(t<10.8) endBoom=false;
  // heroes on the roof
  const fy=H*.8, look=t>12?1:-1, jump=t>4&&t<10.5?Math.abs(Math.sin(t*5))*26:0;
  const spark={kind:'spark',w:24,h:30,x:W*.32,y:fy-30-jump,sx:1,sy:1,face:look,blinkT:1,inv:0,down:false,shield:false,dead:false,vx:0};
  const bolt={kind:'bolt',w:34,h:56,x:W*.32+46,y:fy-56-(t>4&&t<10.5?Math.abs(Math.sin(t*5+1))*18:0),sx:1,sy:1,face:look,blinkT:1,inv:0,down:false,shield:false,dead:false,slam:false,vx:0};
  drawSpark(spark); drawBolt(bolt);
  for(const q of particles){ c.globalAlpha=Math.max(0,q.life/q.max); c.fillStyle=q.c; c.fillRect(q.x-q.s/2,q.y-q.s/2,q.s,q.s); } c.globalAlpha=1;
  // captions
  if(t<.3) drawEnding.said={};
  const cap=(txt,t0,t1,y,size,col)=>{ const a=Math.min(ease((t-t0)/.6),1-ease((t-t1+.6)/.6)); if(a<=0) return; drawEnding.said=drawEnding.said||{}; if(!drawEnding.said[txt]&&t<t1-.5){ drawEnding.said[txt]=1; babble(txt,/или нет|нечто/.test(txt)?'boss':'narr'); } c.save(); c.globalAlpha=a; c.textAlign='center'; c.textBaseline='middle'; c.font=`900 ${size}px Unbounded, 'Arial Black', sans-serif`; c.lineWidth=8; c.strokeStyle='rgba(0,0,0,.6)'; c.strokeText(txt,W/2,y); c.fillStyle=col; c.fillText(txt,W/2,y); c.restore(); };
  cap('Главный Механизм остановлен.',0.5,4.5,H*.2,34,'#eaf2ff');
  cap('Справедливость восстановлена.',4.5,8,H*.2,34,'#ffd166');
  cap('Теперь можно жить спокойно…',7.5,10.6,H*.2,30,'#eaf2ff');
  cap('…или нет?',11,13.5,H*.2,44,'#ff4d5e');
  cap('Далеко за стенами мастерской проснулось нечто куда большее.',13.5,18,H*.16,22,'#ffb3b3');
  if(t>18){ const k=ease((t-18)/1.2); c.fillStyle=`rgba(0,0,0,${k*.75})`; c.fillRect(0,0,W,H);
    c.save(); c.globalAlpha=k; c.textAlign='center'; c.textBaseline='middle'; const s2=1+Math.max(0,1-(t-18))*0.3; c.translate(W/2,H/2); c.scale(s2,s2);
    c.font="900 72px Unbounded, 'Arial Black', sans-serif"; c.lineWidth=10; c.strokeStyle='#000'; c.strokeText('ПРОДОЛЖЕНИЕ',0,-30); c.fillStyle='#ff4d5e'; c.shadowColor='#ff2030'; c.shadowBlur=24*GLOW; c.fillText('ПРОДОЛЖЕНИЕ',0,-30);
    c.shadowBlur=0; c.font="900 40px Unbounded, 'Arial Black', sans-serif"; c.fillStyle='#eaf2ff'; c.fillText('СЛЕДУЕТ…',0,40);
    c.font="500 16px Rubik, system-ui, sans-serif"; c.globalAlpha=k*.7; c.fillText('Искра и Болт вернутся',0,96); c.restore(); }
  if(t>1.5&&t<END_LEN){ c.save(); c.globalAlpha=.5; c.font="500 13px Rubik, sans-serif"; c.fillStyle='#cfd8e6'; c.textAlign='right'; c.fillText('Enter — пропустить',W-20,H-16); c.restore(); }
  if(t>=END_LEN){ particles=[]; setState('win'); }
}
/* ---------- epic title: welded logo, boss silhouettes on the horizon ---------- */
const titleIntro={t0:0,seen:false,timers:[]};
function startTitleIntro(){ for(const t of titleIntro.timers) clearTimeout(t); titleIntro.timers=[]; const fast=titleIntro.seen; titleIntro.t0=performance.now()-(fast?6000:0); titleIntro.roar=-1;
  const at=(ms,f)=>titleIntro.timers.push(setTimeout(()=>{ if(state==='title') try{ f(); }catch(_){} },ms));
  const letterXY=sel=>{ const sr=$('screen').getBoundingClientRect(); return [...document.querySelectorAll(sel)].map(el=>{ const r=el.getBoundingClientRect(); return [(r.left+r.width/2-sr.left)/sr.width*VW,(r.top+r.height/2-sr.top)/sr.height*VH]; }); };
  if(fast){ titleIntro.seen=true; return; }
  for(let i=0;i<5;i++) at(300+i*200+120,()=>{ const p=letterXY('.logo .lt.s')[i]; if(p){ burst(p[0],p[1],26,['#fff','#ffe9a8','#ffd166','#ff8a3d'],420,.6); sfx('gear'); } });
  for(let i=0;i<4;i++) at(1600+i*200+300,()=>{ const p=letterXY('.logo .lt.b')[i]; if(p){ burst(p[0],p[1],14,['#9cc3ff','#62c7c1','#fff'],260,.45); sfx('pick'); } });
  at(2650,()=>{ flash('#ffffff',.5); shake=Math.max(shake,9); sfx('boost'); const lg=document.querySelector('.logo'); if(lg){ lg.classList.remove('slam'); void lg.offsetWidth; lg.classList.add('slam'); } });
  for(let i=0;i<5;i++) at(3300+i*450,()=>{ titleIntro.roar=i; titleIntro.roarT=performance.now(); shake=Math.max(shake,3+i); tone(70-i*6,40,.7,'sawtooth',.06); });
  at(6000,()=>{ titleIntro.seen=true; });
}
const TITLE_BOSSES=[{t:'toad',x:.10,s:.62},{t:'eye',x:.27,s:.55},{t:'core',x:.5,s:.78},{t:'queen',x:.73,s:.6},{t:'gear',x:.90,s:.62}];
function drawBossSilhouettes(hz){ const el=(performance.now()-titleIntro.t0)/1000, A=Math.max(0,Math.min(1,(el-2.9)/1.6)); if(A<=0) return;
  ctx.save(); const fog=ctx.createLinearGradient(0,hz-300,0,hz); fog.addColorStop(0,'rgba(0,0,0,0)'); fog.addColorStop(1,`rgba(40,20,30,${.35*A})`); ctx.fillStyle=fog; ctx.fillRect(0,hz-300,VW,300);
  TITLE_BOSSES.forEach((B,i)=>{ const lit=Math.max(0,Math.min(1,(el-3.3-i*.45)/.3)), roar=titleIntro.roar===i?Math.max(0,1-(performance.now()-titleIntro.roarT)/700):0;
    const bob=Math.sin(clock*.6+i)*4, cx=VW*B.x, s=B.s*(1+roar*.04), base=hz+6;
    ctx.save(); ctx.translate(cx,base+bob); ctx.scale(s,s); ctx.globalAlpha=A*.72; ctx.fillStyle='#090b16'; ctx.strokeStyle=`rgba(255,120,90,${.18*A})`; ctx.lineWidth=2;
    const eye=(x,y,r)=>{ if(lit<=0) return; const blink=(Math.sin(clock*.9+i*2.1)>.985)?.15:1; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=lit*(.75+.25*Math.sin(clock*3+i))+roar*.3;
      const g=ctx.createRadialGradient(x,y,0,x,y,r*4); g.addColorStop(0,'rgba(255,60,40,.6)'); g.addColorStop(1,'rgba(255,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(x-r*4,y-r*4,r*8,r*8);
      ctx.fillStyle='#ffd0b0'; ctx.beginPath(); ctx.ellipse(x,y,r,r*blink,0,0,Math.PI*2); ctx.fill(); ctx.restore(); };
    ctx.beginPath();
    if(B.t==='toad'){ ctx.ellipse(0,-60,120,70,0,Math.PI,0); ctx.rect(-120,-62,240,62); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-55,-120,26,0,Math.PI*2); ctx.arc(55,-120,26,0,Math.PI*2); ctx.fill(); eye(-55,-122,7); eye(55,-122,7); }
    else if(B.t==='eye'){ ctx.arc(0,-150,85,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillRect(-14,-70,28,70); for(let k=0;k<8;k++){ const a=k/8*Math.PI*2+clock*.2; ctx.fillRect(Math.cos(a)*90-6,-150+Math.sin(a)*90-6,12,12); } eye(0,-150,18); }
    else if(B.t==='core'){ ctx.moveTo(-150,0); ctx.lineTo(-110,-200); ctx.lineTo(0,-260); ctx.lineTo(110,-200); ctx.lineTo(150,0); ctx.closePath(); ctx.fill(); ctx.stroke(); eye(-40,-170,9); eye(40,-170,9); eye(0,-215,12); }
    else if(B.t==='queen'){ ctx.ellipse(0,-70,110,60,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0,-150,40,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-30,-185); ctx.lineTo(-20,-215); ctx.lineTo(-5,-190); ctx.lineTo(5,-220); ctx.lineTo(15,-190); ctx.lineTo(30,-215); ctx.lineTo(30,-185); ctx.fill(); for(const d of [-1,1]){ ctx.beginPath(); ctx.moveTo(d*20,-180); ctx.quadraticCurveTo(d*60,-250,d*90,-235); ctx.lineWidth=5; ctx.strokeStyle='#07080f'; ctx.stroke(); } eye(-14,-152,6); eye(14,-152,6); }
    else { ctx.save(); ctx.translate(0,-130); ctx.rotate(clock*.25); const n=20,r=120; for(let k=0;k<=n;k++){ const a=k/n*Math.PI*2, rr=k%2?r*.84:r; ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); ctx.lineTo(Math.cos(a+Math.PI/n)*rr,Math.sin(a+Math.PI/n)*rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); eye(-30,-140,9); eye(30,-140,9); }
    ctx.restore(); });
  ctx.restore(); }
function drawTitleScene(){
  // opaque, alive backdrop that reacts to the highlighted mode
  const tgt=titleFocus==='one'?[1,0]:titleFocus==='two'?[0,1]:[0,0];
  titleMix=titleMix.map((v,i)=>v+(tgt[i]-v)*0.06);
  const [m1,m2]=titleMix;
  const bg=ctx.createLinearGradient(0,0,0,VH); bg.addColorStop(0,`rgb(${10+28*m1|0},${12+4*m2|0},${30-8*m1+6*m2|0})`); bg.addColorStop(1,`rgb(${6+14*m1|0},${8+10*m2|0},${18|0})`);
  ctx.fillStyle=bg; ctx.fillRect(0,0,VW,VH);
  // light rays from the logo
  ctx.save(); ctx.translate(VW/2,VH*0.3); ctx.globalCompositeOperation='lighter';
  for(let i=0;i<12;i++){ const a=i/12*Math.PI*2+clock*.05; ctx.rotate(Math.PI*2/12); ctx.fillStyle=`rgba(${m2>m1?160:255},${180+40*m2|0},${m2>m1?220:120},${.025+.02*Math.max(m1,m2)})`; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(900,-60); ctx.lineTo(900,60); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // hero-colour glows
  const glow=(x,y,r,c)=>{ const g2=ctx.createRadialGradient(x,y,0,x,y,r); g2.addColorStop(0,c); g2.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g2; ctx.fillRect(x-r,y-r,r*2,r*2); };
  glow(VW*0.22+Math.sin(clock*.4)*40,VH*0.55,420,`rgba(255,120,40,${.10+.22*m1+.12*m2})`);
  glow(VW*0.78+Math.cos(clock*.35)*40,VH*0.5,420,`rgba(70,200,190,${.10+.06*m1+.22*m2})`);
  // perspective floor grid
  ctx.save(); const hz=VH*0.64; ctx.beginPath(); ctx.rect(0,hz,VW,VH-hz); ctx.clip();
  const gc=m2>m1?'120,220,210':'255,170,90';
  ctx.strokeStyle=`rgba(${gc},${.10+.12*Math.max(m1,m2)})`; ctx.lineWidth=1.2;
  for(let i=-16;i<=16;i++){ ctx.beginPath(); ctx.moveTo(VW/2+i*14,hz); ctx.lineTo(VW/2+i*160,VH); ctx.stroke(); }
  const off=(clock*0.35)%1;
  for(let k=0;k<10;k++){ const t=(k+off)/10, y=hz+(VH-hz)*t*t; ctx.globalAlpha=t; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(VW,y); ctx.stroke(); }
  ctx.restore();
  // embers (1 player) / twin sparks (2 players)
  for(let i=0;i<26;i++){ const ph=(clock*.12+i*.137)%1, x=(i*97.3%VW)+Math.sin(clock+i)*12, y=VH*(1-ph);
    const two=i%2===0; ctx.globalAlpha=(1-ph)*(.25+.6*(two?m2:m1)+.15); ctx.fillStyle=two?'#7fe8e0':'#ffb347'; ctx.beginPath(); ctx.arc(x,y,1.6+(i%3),0,Math.PI*2); ctx.fill(); }
  ctx.globalAlpha=1;
  const gears=[[VW*0.16,VH*0.3,150,.25,'rgba(231,181,74,.14)'],[VW*0.86,VH*0.72,190,-.18,'rgba(156,195,255,.12)'],[VW*0.78,VH*0.18,90,.5,'rgba(255,138,61,.14)'],[VW*0.25,VH*0.85,110,-.35,'rgba(98,199,193,.13)']];
  for(const [x,y,r,sp,c] of gears){ ctx.save(); ctx.translate(x,y); ctx.rotate(clock*sp); ctx.strokeStyle=c; ctx.lineWidth=6; ctx.beginPath(); const n=24; for(let i=0;i<=n;i++){ const a=i/n*Math.PI*2, rr2=i%2?r*.86:r, a2=a+Math.PI/n; ctx.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2); ctx.lineTo(Math.cos(a2)*rr2,Math.sin(a2)*rr2); } ctx.closePath(); ctx.stroke(); ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,r*.5,0,Math.PI*2); ctx.stroke(); for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; ctx.beginPath(); ctx.moveTo(Math.cos(a)*r*.12,Math.sin(a)*r*.12); ctx.lineTo(Math.cos(a)*r*.5,Math.sin(a)*r*.5); ctx.stroke(); } ctx.restore(); }
  drawBossSilhouettes(VH*0.64);
  // spotlight
  const gr=ctx.createRadialGradient(VW/2,VH*0.68,10,VW/2,VH*0.68,360); gr.addColorStop(0,'rgba(255,209,102,.16)'); gr.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=gr; ctx.fillRect(0,0,VW,VH);
  // floor line
  const fy=VH*0.64; ctx.strokeStyle='rgba(190,215,255,.55)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(VW/2-220,fy); ctx.lineTo(VW/2+220,fy); ctx.stroke();
  // heroes: scene depends on the highlighted mode, and they watch the mouse
  const TS=drawTitleScene.ts||(drawTitleScene.ts={sx:VW/2+40,bx:VW/2-80,sy0:0,svy:0,by0:0,bvy:0,last:performance.now(),slamT:0,wave:0});
  const now=performance.now(), dt=Math.min(.05,(now-TS.last)/1000); TS.last=now;
  const mode=titleFocus==='two'?'duo':titleFocus==='one'?(soloHero==='bolt'?'bolt':'spark'):'idle';
  if(TS.lastMode!==mode){ if(TS.lastMode!==undefined&&mode!=='idle'){ const sx=TS.sx+12, bx=TS.bx+17; if(mode!=='bolt'){ burst(sx,VH*.64-20,22,['#fff','#ffd166','#ff8a3d'],320,.5); flash('#ff8a3d',.12); } if(mode!=='spark'){ burst(bx,VH*.64-30,18,['#fff','#9cc3ff','#62c7c1'],280,.5); shake=Math.max(shake,4); } sfx('pick'); } TS.lastMode=mode; }
  const M=titleMouse, near=(x,y)=>M&&Math.hypot(M.x-x,M.y-y)<90;
  let sTx, bTx, sY=fy-30, bY=fy-56, sSx=1, sSy=1, bSx=1, bSy=1, sFace=1, bFace=1, sTrail=false, bSlam=false;
  if(mode==='duo'){
    const cyc=1.9, ph=(clock%cyc)/cyc; sTx=VW/2-12; bTx=VW/2-17; sY=fy-56-30;
    if(ph<0.18){ const k=ph/0.18; bSx=1+0.25*k; bSy=1-0.25*k; }
    else { const k=(ph-0.18)/0.82; sY=fy-56-30-Math.sin(Math.PI*k)*230; if(k<0.15){ sSx=0.7; sSy=1.4; } if(k>0.92){ sSx=1.25; sSy=0.8; } }
    if(ph>0.18&&ph<0.21&&!drawTitleScene._fx){ drawTitleScene._fx=true; burst(VW/2,fy-56,14,['#ffd166','#62c7c1'],240,.5); }
    if(ph<0.1) drawTitleScene._fx=false;
  } else if(mode==='spark'){
    const t=clock*1.15; sTx=VW/2-12+Math.sin(t)*190; bTx=-120;
    const jp=(clock%1.3)/1.3; sY=fy-30-Math.abs(Math.sin(jp*Math.PI*2))*(jp<.5?80:115);
    sFace=Math.cos(t)>0?1:-1; sTrail=true; if(jp>.5&&jp<.53&&!drawTitleScene._dj){ drawTitleScene._dj=true; burst(TS.sx+12,sY+20,10,['#ffd166','#ff8a3d'],200,.4); } if(jp<.1) drawTitleScene._dj=false;
  } else if(mode==='bolt'){
    sTx=VW+120; bTx=VW/2-17; const cyc=1.7, ph=(clock%cyc)/cyc;
    if(ph<.15){ bSx=1+ph*1.6; bSy=1-ph*1.6; }
    else if(ph<.6){ const k=(ph-.15)/.45; bY=fy-56-Math.sin(k*Math.PI/2)*115; }
    else if(ph<.7){ const k=(ph-.6)/.1; bY=fy-56-115*(1-k*k); bSlam=true; }
    else { const k=(ph-.7)/.3; bSx=1.25-.25*k; bSy=.75+.25*k; if(!drawTitleScene._sl){ drawTitleScene._sl=true; shake=Math.max(shake,5); burst(VW/2,fy,22,['#9cc3ff','#62c7c1','#fff'],320,.6); rings.push({x:VW/2,y:fy,r:10,max:220,life:.5,c:'#62c7c1',w:5}); } }
    if(ph<.6) drawTitleScene._sl=false;
  } else { // idle: both stand and watch you
    sTx=VW/2+36; bTx=VW/2-70; const br=Math.sin(clock*2.4)*.03; sSx=1+br; sSy=1-br; bSx=1-br*.6; bSy=1+br*.6;
  }
  TS.sx+=(sTx-TS.sx)*Math.min(1,dt*5); TS.bx+=(bTx-TS.bx)*Math.min(1,dt*5);
  // hop physics for mouse reactions
  for(const k of ['s','b']){ const yo=k+'y0', vy=k+'vy'; TS[vy]+=2200*dt; TS[yo]+=TS[vy]*dt; if(TS[yo]>0){ TS[yo]=0; TS[vy]=0; } }
  const sCx=TS.sx+12, bCx=TS.bx+17;
  if(mode==='idle'&&near(sCx,fy-15)&&TS.sy0===0) TS.svy=-520;
  if(mode==='idle'&&near(bCx,fy-28)&&TS.by0===0) TS.bvy=-420;
  if(titleClick){ const c=titleClick; titleClick=null;
    if(Math.hypot(c.x-sCx,c.y-(sY+15))<70){ TS.svy=-900; burst(sCx,sY+15,16,['#ffd166','#ff8a3d','#fff'],260,.5); sfx('boost'); }
    else if(Math.hypot(c.x-bCx,c.y-(bY+28))<80){ TS.bvy=-760; burst(bCx,bY+28,16,['#62c7c1','#9cc3ff','#fff'],260,.5); sfx('boost'); }
    else burst(c.x,c.y,10,['#ffd166','#62c7c1'],200,.4); }
  if(M&&mode!=='spark'){ sFace=M.x>sCx?1:-1; } if(M) bFace=M.x>bCx?1:-1;
  if(titleIntro.roar>=0&&performance.now()-titleIntro.roarT<1400){ const bx=VW*TITLE_BOSSES[titleIntro.roar].x; if(mode!=='spark') sFace=bx>sCx?1:-1; bFace=bx>bCx?1:-1; if(mode==='idle'){ const k=Math.max(0,1-(performance.now()-titleIntro.roarT)/400); sSx*=1+.15*k; sSy*=1-.15*k; bSx*=1+.1*k; bSy*=1-.1*k; } }
  const bolt={kind:'bolt',w:34,h:56,x:TS.bx,y:bY+TS.by0,sx:bSx,sy:bSy,face:bFace,blinkT:(clock%3.3)<.12?-1:1,inv:0,down:false,shield:false,dead:false,slam:bSlam};
  const spark={kind:'spark',w:24,h:30,x:TS.sx,y:sY+TS.sy0,sx:sSx,sy:sSy,face:sFace,blinkT:(clock%2.7)<.12?-1:1,inv:0,down:false,shield:false,dead:false};
  if(sTrail&&Math.random()<.8) addP({x:spark.x+12-sFace*10,y:spark.y+15+(Math.random()-.5)*14,vx:-sFace*60,vy:-20,life:.35,max:.35,c:Math.random()<.5?'#ffd166':'#ff8a3d',s:3,g:0});
  if(settings.glow){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(spark.x+12,spark.y+4,120,skinOf('spark').flame,.2); ctx.restore(); }
  if(Math.random()<.5) addP({x:spark.x+12+(Math.random()-.5)*10,y:spark.y+4,vx:(Math.random()-.5)*30,vy:-40-Math.random()*40,life:.5,max:.5,c:Math.random()<.5?'#ffd166':'#ff8a3d',s:2.5,g:-.05});
  for(const r of rings){ ctx.strokeStyle=r.c; ctx.globalAlpha=Math.max(0,r.life*2); ctx.lineWidth=r.w; ctx.beginPath(); ctx.ellipse(r.x,r.y,r.r,r.r*.25,0,0,Math.PI*2); ctx.stroke(); } ctx.globalAlpha=1;
  drawBolt(bolt); drawSpark(spark);
  for(const q of particles){ ctx.globalAlpha=Math.max(0,q.life/q.max); ctx.fillStyle=q.c; if(q.sh) drawShape(q.sh,q.x,q.y,q.s,q.c); else ctx.fillRect(q.x-q.s/2,q.y-q.s/2,q.s,q.s); }
  ctx.globalAlpha=1;
  drawOverlays();
}
function drawDmgNums(){
  ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
  for(const n of dmgNums){
    const k=n.age/n.life, intro=Math.min(1,n.age/0.08);
    const sc=(0.5+0.8*intro-0.25*Math.min(1,Math.max(0,(n.age-0.08)/0.15)))*(1+n.pop*0.35);
    const a=k>0.7?1-(k-0.7)/0.3:1;
    ctx.save(); ctx.translate(n.x,n.y); ctx.rotate((n.vx/90)*0.12); ctx.scale(sc,sc); ctx.globalAlpha=a;
    const txt='-'+n.val+(n.crit?'!':'');
    ctx.font=`400 ${n.size}px 'Russo One', Unbounded, 'Arial Black', sans-serif`;
    if(n.crit){ ctx.font=`400 ${Math.round(n.size*0.42)}px 'Russo One', Unbounded, sans-serif`; ctx.lineWidth=4; ctx.strokeStyle='#1a0420'; ctx.strokeText('КРИТ',0,-n.size*0.62); ctx.fillStyle='#ffd166'; ctx.fillText('КРИТ',0,-n.size*0.62); ctx.font=`400 ${n.size}px 'Russo One', Unbounded, 'Arial Black', sans-serif`; }
    ctx.lineWidth=Math.max(4,n.size*0.2); ctx.strokeStyle='#0a0612'; ctx.strokeText(txt,0,0);
    const g=ctx.createLinearGradient(0,-n.size/2,0,n.size/2); g.addColorStop(0,'#ffffff'); g.addColorStop(0.45,n.c); g.addColorStop(1,n.c);
    ctx.fillStyle=g; ctx.fillText(txt,0,0);
    ctx.restore();
  }
  ctx.restore();
}
function drawIntro(){
  const I=intro, t=I.t, D=I.dur, P=INTRO_P, ease=k=>k<0?0:k>1?1:k*k*(3-2*k);
  if(t<P) drawPortrait(t);
  const bars=t<P?1:ease((t-P)/0.01)*(1-ease((t-(D-0.45))/0.45));
  const intoBars=ease(t/0.35), bh=86*Math.min(intoBars,bars);
  ctx.save();
  ctx.fillStyle='#04070f'; ctx.fillRect(0,0,VW,bh); ctx.fillRect(0,VH-bh,VW,bh);
  if(bh>4){
    ctx.save(); ctx.beginPath(); ctx.rect(0,bh-14,VW,10); ctx.rect(0,VH-bh+4,VW,10); ctx.clip();
    for(let x=-40+((t*160)%40);x<VW+40;x+=40){ ctx.fillStyle='#e7b54a'; ctx.beginPath(); ctx.moveTo(x,bh-14); ctx.lineTo(x+20,bh-14); ctx.lineTo(x+10,bh-4); ctx.lineTo(x-10,bh-4); ctx.fill(); ctx.beginPath(); ctx.moveTo(x,VH-bh+14); ctx.lineTo(x+20,VH-bh+14); ctx.lineTo(x+30,VH-bh+4); ctx.lineTo(x+10,VH-bh+4); ctx.fill(); }
    ctx.restore();
    ctx.globalAlpha=0.6+0.4*Math.sin(t*10); ctx.fillStyle='#ff6b6b'; ctx.font="700 13px Unbounded, 'Arial Black', sans-serif"; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText('▲ ВНИМАНИЕ · ОПАСНЫЙ МЕХАНИЗМ',T,bh/2-4); ctx.globalAlpha=1;
    ctx.globalAlpha=.6; ctx.fillStyle='#cfe2ff'; ctx.font="500 12px Rubik, sans-serif"; ctx.textAlign='right'; ctx.fillText('прыжок — пропустить',VW-T,bh/2-4); ctx.globalAlpha=1;
  }
  if(t>D-0.55){
    const k=(t-(D-0.55))/0.55, sc=0.6+k*0.8;
    ctx.globalAlpha=Math.max(0,1-Math.max(0,k-0.6)*2.5); ctx.translate(VW/2,VH/2); ctx.scale(sc,sc); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font="900 64px Unbounded, 'Arial Black', sans-serif"; ctx.lineWidth=8; ctx.strokeStyle='#04070f'; ctx.strokeText('В БОЙ!',0,0); ctx.fillStyle='#ffd166'; ctx.fillText('В БОЙ!',0,0);
  }
  ctx.restore();
}

function drawShape(sh,x,y,s,c){
  ctx.fillStyle=c;
  if(sh==='heart'){ heart(x,y,s*.9); }
  else if(sh==='star'||sh==='spk'){ const n=sh==='star'?5:4, r1=sh==='star'?s:s*1.2, r2=sh==='star'?s*.45:s*.25; ctx.beginPath(); for(let i=0;i<n*2;i++){ const a=i/(n*2)*Math.PI*2-Math.PI/2, r=i%2?r2:r1; ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } ctx.closePath(); ctx.fill(); }
  else if(sh==='note'){ ctx.beginPath(); ctx.ellipse(x,y+s*.6,s*.6,s*.45,-.4,0,Math.PI*2); ctx.fill(); ctx.fillRect(x+s*.45,y-s*1.4,1.6,s*2); ctx.fillRect(x+s*.45,y-s*1.4,s*.9,1.6); }
  else { ctx.beginPath(); ctx.arc(x,y,s/2,0,Math.PI*2); ctx.fill(); }
}
function drawPreviews(){
  for(const [id,kind] of [['pvS','spark'],['pvB','bolt']]){
    const c=document.getElementById(id); if(!c) continue;
    const g=c.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,c.width,c.height);
    const sp=kind==='spark', w=sp?24:34, h=sp?30:56, view=sp?75:100, k=c.width/view, cx=view/2, by=sp?66:90;
    g.setTransform(k,0,0,k,0,0);
    const face=Math.sin(clock*.8)>0?1:-1;
    const fake={kind,w,h,x:cx-w/2,y:by-h,sx:1+Math.sin(clock*4)*.03,sy:1-Math.sin(clock*4)*.03,face,blinkT:(clock%3)<.12?-1:1,inv:0,down:false,shield:false,dead:false};
    g.fillStyle='rgba(156,195,255,.25)'; g.fillRect(cx-28,by,56,1.5);
    const saved=ctx; ctx=g; try{
      const tr=looks[kind].trail; if(tr&&tr!=='none') for(let i=0;i<8;i++){ const ph=(clock*.9+i/8)%1; ctx.globalAlpha=(1-ph)*.9;
        drawShape(TRAIL_SH[tr],cx-face*(w*.4+ph*30),by-h*.5-ph*(tr==='smoke'?18:6)+Math.sin(i*2.3+clock*3)*4,tr==='smoke'?5+ph*5:(tr==='rainbow'?3:2.6),trailColor(kind,tr,i)); }
      ctx.globalAlpha=1; sp?drawSpark(fake):drawBolt(fake); } finally { ctx=saved; }
  }
}

function drawArena(){
  const A=arena;
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
    const c=grid[y][x], X=x*T, Y=y*T;
    if(c==='L'){
      const gr=ctx.createLinearGradient(0,Y+12,0,Y+T); gr.addColorStop(0,'#ffd166'); gr.addColorStop(.35,'#ff7a2a'); gr.addColorStop(1,'#a3200f');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(X,Y+T);
      for(let i=0;i<=8;i++){ const xx=X+i*T/8; ctx.lineTo(xx,Y+14+Math.sin(clock*4+x*1.7+i)*3); } ctx.lineTo(X+T,Y+T); ctx.closePath(); ctx.fill();
      if(GLOW){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(X+T/2,Y+18,60,'#ff7a2a',.18); ctx.restore(); }
      const bub=(clock*1.3+x*.37)%1; ctx.fillStyle=`rgba(255,240,200,${.7*(1-bub)})`; ctx.beginPath(); ctx.arc(X+8+((x*13)%24),Y+30-bub*14,2+bub*2,0,Math.PI*2); ctx.fill();
    } else if(c==='Z'||c==='Y'){
      const dir=c==='Z'?1:-1;
      ctx.fillStyle='#2a2418'; ctx.fillRect(X,Y,T,T);
      ctx.fillStyle='#3d3422'; ctx.fillRect(X,Y,T,10);
      ctx.save(); ctx.beginPath(); ctx.rect(X,Y,T,10); ctx.clip(); ctx.fillStyle='#e7b54a';
      const off=((clock*(A?A.conv:90)*dir)%20+20)%20;
      for(let k=-1;k<3;k++){ const cx=X+k*20+off; ctx.beginPath(); ctx.moveTo(cx,Y+2); ctx.lineTo(cx+dir*6,Y+5); ctx.lineTo(cx,Y+8); ctx.lineTo(cx+dir*-2,Y+8); ctx.lineTo(cx+dir*4,Y+5); ctx.lineTo(cx+dir*-2,Y+2); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle='#8a7a55'; for(const cx of [X+10,X+30]){ ctx.save(); ctx.translate(cx,Y+24); ctx.rotate(clock*dir*4); ctx.fillRect(-6,-1.5,12,3); ctx.fillRect(-1.5,-6,3,12); ctx.restore(); }
      ctx.strokeStyle='rgba(240,205,130,.6)'; ctx.lineWidth=1; ctx.strokeRect(X+.5,Y+.5,T-1,T-1);
    } else if(c==='H'){
      ctx.fillStyle='rgba(255,190,60,.85)'; ctx.beginPath(); ctx.moveTo(X-2,Y+T);
      for(let i=0;i<=4;i++) ctx.lineTo(X+i*T/4,Y+T-14-Math.sin(clock*2+x+i)*2-(i%2?3:0)); ctx.lineTo(X+T+2,Y+T); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,240,180,.6)'; ctx.fillRect(X+6,Y+T-12,10,2);
    }
  }
  if(A&&A.type==='eye') for(const r of A.rains){ if(r.warn>0){ const on=Math.floor(r.warn*10)%2; ctx.fillStyle=on?'rgba(255,77,94,.9)':'rgba(255,77,94,.35)'; ctx.fillRect(r.x-18,T,36,8); ctx.fillStyle='rgba(255,77,94,.08)'; ctx.fillRect(r.x-18,T,36,FLOOR_Y-T); } }
  if(A&&A.type==='core'&&A.shock){
    const x0=A.shock.side?17*T:T, x1=A.shock.side?(COLS-1)*T:15*T;
    if(A.shock.warn>0){ ctx.fillStyle=`rgba(255,209,102,${.15+.2*(Math.floor(A.shock.warn*8)%2)})`; ctx.fillRect(x0,FLOOR_Y-10,x1-x0,10); ctx.fillStyle='#ffd166'; ctx.font="700 12px Unbounded, sans-serif"; ctx.textAlign='center'; ctx.fillText('⚠ ТОК',(x0+x1)/2,FLOOR_Y-22); }
    else { ctx.strokeStyle='#9cf0ff'; ctx.lineWidth=2; ctx.beginPath(); let y=FLOOR_Y-6; ctx.moveTo(x0,y); for(let x=x0;x<x1;x+=12){ ctx.lineTo(x,FLOOR_Y-4-Math.random()*16); } ctx.stroke(); ctx.fillStyle='rgba(156,240,255,.12)'; ctx.fillRect(x0,FLOOR_Y-30,x1-x0,30); }
  }
}
function drawAmbient(){
  ctx.save();
  for(const g of bgGears){
    ctx.save(); ctx.translate(g.x,g.y); ctx.rotate(clock*g.sp);
    ctx.strokeStyle=arena?`rgba(${ARENAS[arena.type].grid},.08)`:'rgba(156,195,255,.07)'; ctx.lineWidth=2; ctx.beginPath();
    const n=g.teeth*2;
    for(let i=0;i<=n;i++){ const a=i/n*Math.PI*2, r=i%2?g.r*.86:g.r, a2=a+Math.PI/n; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); ctx.lineTo(Math.cos(a2)*r,Math.sin(a2)*r); }
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,g.r*.55,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,g.r*.14,0,Math.PI*2); ctx.stroke();
    for(let i=0;i<5;i++){ const a=i/5*Math.PI*2; ctx.beginPath(); ctx.moveTo(Math.cos(a)*g.r*.14,Math.sin(a)*g.r*.14); ctx.lineTo(Math.cos(a)*g.r*.55,Math.sin(a)*g.r*.55); ctx.stroke(); }
    ctx.restore();
  }
  if(arena&&arena.type==='gear'){ ctx.save(); ctx.translate(VW/2,VH*0.42); ctx.strokeStyle='rgba(235,200,130,.10)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,170,0,Math.PI*2); ctx.stroke();
    for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; ctx.beginPath(); ctx.moveTo(Math.cos(a)*150,Math.sin(a)*150); ctx.lineTo(Math.cos(a)*165,Math.sin(a)*165); ctx.stroke(); }
    const sec=Math.floor(clock); ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(sec/60*Math.PI*2-Math.PI/2)*140,Math.sin(sec/60*Math.PI*2-Math.PI/2)*140); ctx.stroke();
    ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(clock/40-Math.PI/2)*90,Math.sin(clock/40-Math.PI/2)*90); ctx.stroke(); ctx.restore(); }
  if(arena&&arena.type==='queen'){ ctx.strokeStyle='rgba(255,160,200,.06)'; ctx.lineWidth=2; for(let gy=0;gy<9;gy++) for(let gx=0;gx<17;gx++){ const x=gx*80+(gy%2?40:0), y=gy*70+30; ctx.beginPath(); for(let k=0;k<6;k++){ const a=Math.PI/6+k*Math.PI/3; ctx.lineTo(x+Math.cos(a)*36,y+Math.sin(a)*36); } ctx.closePath(); ctx.stroke(); }
    for(let i=0;i<6;i++){ const x=T*4+i*T*4.6, len=10+((clock*20+i*37)%60); ctx.fillStyle='rgba(255,190,60,.55)'; ctx.fillRect(x,2*T,4,len); ctx.beginPath(); ctx.arc(x+2,2*T+len,4,0,Math.PI*2); ctx.fill(); } }
  if(arena&&arena.type==='core'){ ctx.strokeStyle=`rgba(255,77,94,${.08+.06*Math.sin(clock*3)})`; ctx.lineWidth=3; for(let i=0;i<8;i++){ const y=T*2+i*T*1.6; ctx.beginPath(); ctx.moveTo(T,y); ctx.lineTo(T*4,y); ctx.lineTo(T*5,y+T*.8); ctx.lineTo(VW-T*5,y+T*.8); ctx.lineTo(VW-T*4,y); ctx.lineTo(VW-T,y); ctx.stroke(); } }
  for(const m of motes){ ctx.globalAlpha=.25+.2*Math.sin(clock*2+m.ph); ctx.fillStyle=arena?ARENAS[arena.type].mote:'#cfe2ff'; ctx.fillRect(m.x,m.y,m.s,m.s); }
  ctx.restore();
}
function glowAt(x,y,r,c,a){ const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,c); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.globalAlpha=a; ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2); ctx.globalAlpha=1; }
function drawLights(){
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const s=players[0], b=players[1];
  if(!s.dead&&!s.down) glowAt(s.x+s.w/2,s.y+4,110+Math.sin(clock*9)*6,skinOf('spark').flame,.16);
  for(const p of players){ if(p.dead||p.down) continue; const act=['power','rapid','triple'].find(k=>p.pw[k]>0); if(act||p.aura>0) glowAt(p.x+p.w/2,p.y+p.h/2,70+30*(p.aura||0)+Math.sin(clock*7)*5,act?PICK_INFO[act].c:(p.auraC||'#ffffff'),.14+.25*(p.aura||0)); }
  if(!b.dead&&!b.down) glowAt(b.x+b.w/2,b.y+26,60,skinOf('bolt').eye,.08);
  for(const pl of plates) if(pl.on) glowAt(pl.x*T+T/2,pl.y*T+T-4,50,KEYC[pl.key],.18);
  if(!exitLocked) glowAt(exitRect.x+exitRect.w/2,exitRect.y+exitRect.h/2,90,'#9cc3ff',.08+.04*Math.sin(clock*3));
  if(boss&&!boss.dead&&(boss.type==='core'||boss.type==='eye')) glowAt(boss.x+boss.w/2,boss.y+boss.h/2,160,'#ff6b6b',.12);
  ctx.restore();
}
function drawOverlays(){
  if(settings.vignette){
    if(!vignetteC){ vignetteC=document.createElement('canvas'); vignetteC.width=640; vignetteC.height=360; const g=vignetteC.getContext('2d'); const gr=g.createRadialGradient(320,180,120,320,180,380); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(2,6,16,.55)'); g.fillStyle=gr; g.fillRect(0,0,640,360); }
    ctx.drawImage(vignetteC,0,0,VW,VH);
  }
  if(settings.retro){ ctx.fillStyle='rgba(0,0,0,.18)'; for(let y=0;y<VH;y+=4) ctx.fillRect(0,y,VW,1.6); }
  if(state==='gameover'||state==='dying'){ const k=state==='dying'?Math.min(1,(2.4-deathTimer)/2.4):1; ctx.fillStyle=`rgba(10,0,4,${.55*k})`; ctx.fillRect(0,0,VW,VH); const vg=ctx.createRadialGradient(VW/2,VH/2,VH*.25,VW/2,VH/2,VH*.85); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,`rgba(0,0,0,${.75*k})`); ctx.fillStyle=vg; ctx.fillRect(0,0,VW,VH); }
  if(flashA>0){ ctx.globalAlpha=flashA; ctx.fillStyle=flashC; ctx.fillRect(0,0,VW,VH); ctx.globalAlpha=1; }
  if(titleT>0&&state==='play'){
    const L=getLevel(levelIdx), a=Math.min(1,titleT*1.5, (2.2-titleT)*4);
    ctx.save(); ctx.globalAlpha=a; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(8,22,44,.75)'; ctx.fillRect(0,VH/2-70,VW,120);
    ctx.fillStyle=L.boss?'#ff6b6b':'#9cc3ff'; ctx.font="700 14px Unbounded, 'Arial Black', sans-serif"; ctx.fillText(L.boss?`УРОВЕНЬ ${levelIdx+1} · БОСС`:`УРОВЕНЬ ${levelIdx+1} ИЗ ${TOTAL}`,VW/2,VH/2-38);
    ctx.fillStyle='#e8effa'; ctx.font="900 44px Unbounded, 'Arial Black', sans-serif"; ctx.fillText(L.name,VW/2,VH/2+4);
    ctx.restore();
  }
}

