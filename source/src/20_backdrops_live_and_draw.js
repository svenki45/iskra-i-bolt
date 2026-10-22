/* ================= living backdrops ================= */
function makeLive(TH,name){
  const R=rng((levelIdx+1)*4241+11), m=NAME_MOTIF[name]||'gears', pts=n=>Array.from({length:n},()=>({x:R()*VW,y:R()*VH,s:R(),p:R()*Math.PI*2}));
  return {m,mode:TH.m,h:TH.h,motes:pts(26),items:pts(8),pipes:Array.from({length:5},()=>60+R()*(VH-120)),cols:Array.from({length:6},()=>R()*VW)};
}
function drawLive(){
  const L=LIVE, t=clock, c=ctx; c.save();
  const acc=a=>`rgba(${hslRgb(L.h,85,70)},${a})`, warm=L.mode==='spark', cool=L.mode==='bolt';
  // drifting motes everywhere (colour by mode)
  for(const q of L.motes){ const x=(q.x+t*(8+q.s*14))%VW, y=(q.y+Math.sin(t*.6+q.p)*18-t*(warm?14:4)*q.s+VH*4)%VH;
    c.globalAlpha=.18+.25*Math.sin(t*1.3+q.p)**2; c.fillStyle=warm?'#ffb347':cool?'#7fe8e0':(q.s>.5?'#ffb347':'#7fe8e0'); c.beginPath(); c.arc(x,y,1+q.s*1.6,0,Math.PI*2); c.fill(); }
  c.globalAlpha=1;
  // slow light sweep
  const sx=((t*40)%(VW+600))-300; const gr=c.createLinearGradient(sx-120,0,sx+120,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.5,acc(.035)); gr.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=gr; c.fillRect(sx-120,0,240,VH);
  const m=L.m;
  if(m==='molten'||m==='rust'){ for(const q of L.items){ const y=VH-((t*(30+q.s*40)+q.p*100)%(VH*.7)); c.globalAlpha=.5*(y/VH); c.fillStyle='#ff9a3d'; c.beginPath(); c.arc(q.x+Math.sin(t*2+q.p)*10,y,2+q.s*2,0,Math.PI*2); c.fill(); }
    c.globalAlpha=.10+.06*Math.sin(t*2); const g2=c.createLinearGradient(0,VH*.7,0,VH); g2.addColorStop(0,'rgba(255,90,20,0)'); g2.addColorStop(1,'rgba(255,90,20,1)'); c.fillStyle=g2; c.fillRect(0,VH*.7,VW,VH*.3); }
  else if(m==='steam'||m==='boiler'){ for(const q of L.items){ const x=(q.x+t*25*(.5+q.s))%(VW+200)-100, y=q.y-((t*12)%60); c.globalAlpha=.05+.04*Math.sin(t+q.p); c.fillStyle='#dfe8f2'; for(let k=0;k<3;k++){ c.beginPath(); c.arc(x+k*26,y+(k%2)*8,26+q.s*18,0,Math.PI*2); c.fill(); } } }
  else if(m==='electric'){ const ph=t%3.2; if(ph<.12||(ph>.25&&ph<.3)){ const q=L.items[Math.floor(t/3.2)%L.items.length]; c.globalAlpha=.55; c.strokeStyle='#bfe8ff'; c.lineWidth=2; c.shadowColor='#7fd0ff'; c.shadowBlur=14*GLOW; let x=q.x,y=0; c.beginPath(); c.moveTo(x,y); while(y<VH*.75){ x+=(Math.random()-.5)*40; y+=20+Math.random()*25; c.lineTo(x,y); } c.stroke(); c.shadowBlur=0; c.globalAlpha=.06; c.fillStyle='#bfe8ff'; c.fillRect(0,0,VW,VH); } }
  else if(m==='night'){ for(const q of L.items.concat(L.motes)){ c.globalAlpha=.15+.6*Math.max(0,Math.sin(t*2+q.p*3)); c.fillStyle='#fff'; c.fillRect(q.x,q.y*.75,1.6,1.6); }
    const sp=t%7; if(sp<.9){ const x0=VW*.8-sp*700, y0=60+sp*240; c.globalAlpha=1-sp; c.strokeStyle='#ffffff'; c.lineWidth=2; c.beginPath(); c.moveTo(x0,y0); c.lineTo(x0+60,y0-20); c.stroke(); } }
  else if(m==='welding'){ for(const q of L.items.slice(0,4)){ const on=Math.sin(t*9+q.p*7)>.6; if(!on) continue; c.globalAlpha=.6; c.strokeStyle='#e8f6ff'; c.lineWidth=1.5; for(let k=0;k<8;k++){ const a=Math.random()*Math.PI*2,l=12+Math.random()*34; c.beginPath(); c.moveTo(q.x,q.y); c.lineTo(q.x+Math.cos(a)*l,q.y+Math.sin(a)*l); c.stroke(); } const gg=c.createRadialGradient(q.x,q.y,0,q.x,q.y,70); gg.addColorStop(0,'rgba(170,220,255,.35)'); gg.addColorStop(1,'rgba(170,220,255,0)'); c.globalAlpha=1; c.fillStyle=gg; c.fillRect(q.x-70,q.y-70,140,140); } }
  else if(m==='gears'||m==='clock'||m==='lathe'||m==='valves'){ for(const q of L.items.slice(0,5)){ const r=36+q.s*60; c.save(); c.translate(q.x,q.y); c.rotate(t*(q.s>.5?.3:-.4)); c.globalAlpha=.10; c.strokeStyle=acc(1); c.lineWidth=4; c.beginPath(); for(let k=0;k<=20;k++){ const a=k/20*Math.PI*2, rr2=k%2?r:r*1.12; c.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2); } c.stroke();
      if(m==='clock'){ c.globalAlpha=.25; c.lineWidth=3; c.beginPath(); c.moveTo(0,0); c.lineTo(0,-r*.7); c.stroke(); } c.restore(); } }
  else if(m==='conveyor'){ c.globalAlpha=.16; c.fillStyle=acc(1); for(const y of [VH*.32+4,VH*.62+4]) for(let x=-(t*60)%46;x<VW;x+=46) c.fillRect(x,y,20,4); }
  else if(m==='oil'){ for(const q of L.items){ const y=((t*90*(.6+q.s))+q.p*200)%(VH+40)-20; c.globalAlpha=.45; c.fillStyle='#120c06'; c.beginPath(); c.ellipse(q.x,y,3,6,0,0,Math.PI*2); c.fill(); } }
  else if(m==='lamps'){ for(let i=0;i<5;i++){ const x=(i+.5)*VW/5, sw=Math.sin(t*1.1+i)*.12, f=.7+.3*Math.sin(t*17+i*3)*(Math.sin(t*.7+i)>.9?1:0); c.save(); c.translate(x,0); c.rotate(sw); c.globalAlpha=.09*f+.03; const g3=c.createLinearGradient(0,80,0,460); g3.addColorStop(0,'rgba(255,220,140,1)'); g3.addColorStop(1,'rgba(255,220,140,0)'); c.fillStyle=g3; c.beginPath(); c.moveTo(-6,80); c.lineTo(-130,460); c.lineTo(130,460); c.lineTo(6,80); c.fill(); c.restore(); } }
  else if(m==='pipes'||m==='copper'||m==='pipesV'){ c.setLineDash([10,26]); c.lineDashOffset=-t*60; c.lineWidth=3; c.globalAlpha=.22; c.strokeStyle=acc(1);
      if(m==='pipesV') for(const x of L.cols){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,VH); c.stroke(); } else for(const y of L.pipes){ c.beginPath(); c.moveTo(0,y); c.lineTo(VW,y); c.stroke(); } c.setLineDash([]); }
  else if(m==='dust'){ for(const q of L.items.concat(L.motes)){ c.globalAlpha=.25; c.fillStyle='#e8dcc0'; c.fillRect((q.x+Math.sin(t*.4+q.p)*30+VW)%VW,(q.y+Math.cos(t*.3+q.p)*20+VH)%VH,1.5,1.5); } }
  else if(m==='blueprint'){ const y=(t*70)%VH; c.globalAlpha=.12; c.fillStyle=acc(1); c.fillRect(0,y,VW,2); c.globalAlpha=.05; c.fillRect(0,y-30,VW,30); }
  else if(m==='springs'||m==='hammers'||m==='bolts'||m==='rivets'||m==='files'){ for(const q of L.items.slice(0,6)){ const b=Math.abs(Math.sin(t*2.2+q.p)); c.globalAlpha=.12; c.strokeStyle=acc(1); c.lineWidth=2; c.beginPath(); for(let k=0;k<=10;k++) c.lineTo(q.x+(k%2?10:-10),q.y+k*(5+b*3)); c.stroke(); } }
  c.restore(); c.globalAlpha=1;
}
function renderStatic(){
  staticLayer.width=VW*2; staticLayer.height=VH*2;
  let g=staticLayer.getContext('2d'); g.setTransform(2,0,0,2,0,0);
  const TH=arena?null:levelTheme();
  LIVE=null; if(TH){ try{ LIVE=makeLive(TH,getLevel(levelIdx).name); }catch(e){ LIVE=null; } }
  const AR=arena?ARENAS[arena.type]:{paper:TH.paper,wall:TH.wall,grid:TH.grid,hatch:TH.hatch,edge:TH.edge}, GC=AR.grid;
  g.fillStyle=AR.paper; g.fillRect(0,0,VW,VH);
  if(TH){ drawThemeDecor(g,TH); try{ drawNameMotif(g,getLevel(levelIdx).name,rng((levelIdx+1)*977+3)); }catch(e){} }
  g.lineWidth=1; const STP=TH?TH.step:T/2;
  for(let x=0;x<=VW;x+=STP){ g.strokeStyle=x%(T*4)===0?`rgba(${GC},.13)`:x%T===0?`rgba(${GC},.07)`:`rgba(${GC},.03)`; g.beginPath(); g.moveTo(x+.5,0); g.lineTo(x+.5,VH); g.stroke(); }
  for(let y=0;y<=VH;y+=STP){ g.strokeStyle=y%(T*4)===0?`rgba(${GC},.13)`:y%T===0?`rgba(${GC},.07)`:`rgba(${GC},.03)`; g.beginPath(); g.moveTo(0,y+.5); g.lineTo(VW,y+.5); g.stroke(); }
  wallLayer.width=VW*2; wallLayer.height=VH*2; g=wallLayer.getContext('2d'); g.setTransform(2,0,0,2,0,0); g.clearRect(0,0,VW,VH);
  g.save(); g.beginPath();
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(grid[y][x]==='#'||grid[y][x]==='S') g.rect(x*T,y*T,T,T);
  g.fillStyle=AR?AR.wall:'#08162c'; g.fill(); g.clip();
  g.strokeStyle=AR?AR.hatch:'rgba(156,195,255,.16)'; g.lineWidth=1.2;
  for(let d=-VH;d<VW;d+=11){ g.beginPath(); g.moveTo(d,VH); g.lineTo(d+VH,0); g.stroke(); }
  g.restore();
  g.strokeStyle=AR?AR.edge:'rgba(190,215,255,.9)'; g.lineWidth=2; g.lineCap='square'; g.beginPath();
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
    if(grid[y][x]!=='#'&&grid[y][x]!=='S') continue; const X=x*T, Y=y*T;
    if(!isWall(x,y-1)){g.moveTo(X,Y+1);g.lineTo(X+T,Y+1);}
    if(!isWall(x,y+1)){g.moveTo(X,Y+T-1);g.lineTo(X+T,Y+T-1);}
    if(!isWall(x-1,y)){g.moveTo(X+1,Y);g.lineTo(X+1,Y+T);}
    if(!isWall(x+1,y)){g.moveTo(X+T-1,Y);g.lineTo(X+T-1,Y+T);}
  }
  g.stroke();
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(grid[y][x]==='^'){
    for(let i=0;i<3;i++){ const bx=x*T+i*T/3; g.beginPath(); g.moveTo(bx+1,y*T+T); g.lineTo(bx+T/6,y*T+T*0.42); g.lineTo(bx+T/3-1,y*T+T); g.closePath(); g.fillStyle='#ff6b6b'; g.fill(); g.strokeStyle='#ffc2c2'; g.lineWidth=1; g.stroke(); }
  }
  g.font="700 11px Unbounded, 'Arial Black', sans-serif"; g.textBaseline='middle';

  staticDirty=false; staticGen++;
}
function drawCracks(){
  { const t=performance.now()/1000;
    const _a=tilesOf()['S']||[]; for(let _i=0;_i<_a.length;_i+=2){ const x=_a[_i], y=_a[_i+1]; if(grid[y][x]!=='S') continue;
      const X=x*T,Y=y*T, ph=t*1.6+x*1.7+y, a=0.16+0.2*Math.max(0,Math.sin(ph)), d=Math.sin(ph*0.5);
      if(Math.random()<0.03) addP({x:X+4+Math.random()*(T-8),y:Y+4+Math.random()*(T-8),vx:(Math.random()-.5)*20,vy:-20-Math.random()*20,life:.7,max:.7,c:'#fff3cf',s:3,g:-.02,sh:'spk'});
      ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#ffe2a0'; ctx.fillRect(X+5,Y+5,T-10,T-10);
      ctx.globalAlpha=Math.min(1,a*2.4); ctx.strokeStyle='#ffe9a8'; ctx.lineWidth=1.6; ctx.shadowColor='#ffd166'; ctx.shadowBlur=10*GLOW; ctx.strokeRect(X+3.5,Y+3.5,T-7,T-7); ctx.shadowBlur=0;
      ctx.globalAlpha=a*2.2*Math.max(0,d); ctx.fillStyle='#fff3cf'; ctx.beginPath(); ctx.arc(X+T/2,Y+T/2,2,0,Math.PI*2); ctx.fill(); ctx.restore(); } }
  for(const k in secretHits){ const [x,y]=k.split(',').map(Number); if(grid[y][x]!=='S') continue; const X=x*T,Y=y*T;
    ctx.strokeStyle='rgba(231,181,74,.85)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(X+8,Y+3); ctx.lineTo(X+18,Y+17); ctx.lineTo(X+14,Y+29); ctx.moveTo(X+18,Y+17); ctx.lineTo(X+32,Y+14); ctx.stroke(); }
  const _xa=tilesOf()['x']||[]; for(let _i=0;_i<_xa.length;_i+=2){ const x=_xa[_i], y=_xa[_i+1]; if(grid[y][x]!=='x') continue;
    const X=x*T,Y=y*T;
    ctx.fillStyle='#2e2115'; ctx.fillRect(X,Y,T,T);
    ctx.strokeStyle='#e7b54a'; ctx.lineWidth=2; ctx.strokeRect(X+1,Y+1,T-2,T-2);
    ctx.lineWidth=1.6; ctx.beginPath();
    ctx.moveTo(X+6,Y+4); ctx.lineTo(X+16,Y+16); ctx.lineTo(X+12,Y+26); ctx.lineTo(X+20,Y+36);
    ctx.moveTo(X+16,Y+16); ctx.lineTo(X+30,Y+12); ctx.lineTo(X+36,Y+22);
    ctx.moveTo(X+12,Y+26); ctx.lineTo(X+28,Y+30);
    ctx.stroke();
  }
}
function drawMovers(){
  for(const m of movers){
    const pw=moverPowered(m), kc=m.key?KEYC[m.key]:'#9cc3ff';
    ctx.save(); ctx.strokeStyle='rgba(156,195,255,.28)'; ctx.setLineDash([5,6]); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(m.ax+m.w/2,m.ay+7); ctx.lineTo(m.bx+m.w/2,m.by+7); ctx.stroke(); ctx.setLineDash([]);
    for(const [x,y] of [[m.ax,m.ay],[m.bx,m.by]]){ ctx.fillStyle='rgba(156,195,255,.35)'; ctx.beginPath(); ctx.arc(x+m.w/2,y+7,3,0,Math.PI*2); ctx.fill(); }
    const gr=ctx.createLinearGradient(0,m.y,0,m.y+m.h); gr.addColorStop(0,'#c7d3dd'); gr.addColorStop(1,'#6f8191');
    ctx.fillStyle=gr; rr(ctx,m.x,m.y,m.w,m.h,4); ctx.fill(); ctx.strokeStyle='#33465c'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='#33465c'; for(let x=m.x+8;x<m.x+m.w-4;x+=16){ ctx.beginPath(); ctx.arc(x,m.y+7,1.8,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle='rgba(255,209,102,.9)'; for(let x=m.x+4;x<m.x+m.w-6;x+=12) ctx.fillRect(x,m.y+m.h-3,6,2);
    if(m.key){ ctx.save(); ctx.fillStyle=pw?kc:'rgba(80,90,110,.9)'; if(pw){ ctx.shadowColor=kc; ctx.shadowBlur=10*GLOW; } ctx.beginPath(); ctx.arc(m.x+m.w/2,m.y+m.h+5,4.5,0,Math.PI*2); ctx.fill(); ctx.restore();
      if(solo&&m.timer>0&&!plates.some(p=>p.key===m.key&&p.on)){ ctx.font="400 14px 'Russo One', Unbounded, sans-serif"; ctx.textAlign='center'; ctx.fillStyle=kc; ctx.fillText(Math.ceil(m.timer),m.x+m.w/2,m.y-10); } }
    ctx.restore();
  }
}
function drawPlates(){
  for(const p of plates){
    const c=KEYC[p.key], h=p.on?5:9, X=p.x*T+4, Y=p.y*T+T-h;
    ctx.save(); if(p.on){ ctx.shadowColor=c; ctx.shadowBlur=16*GLOW; }
    ctx.fillStyle=c; rr(ctx,X,Y,T-8,h,2); ctx.fill(); ctx.restore();
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(X+4,Y+h-2,T-16,2);
  }
}
function drawCrawl(){ // low tunnel under gap doors: only Spark fits
  for(const k in doors){ const d=doors[k]; if(d.bridge) continue; let maxY=-1,cx=null; for(const [x,y] of d.cells) if(y>maxY){ maxY=y; cx=x; }
    if(maxY<0||maxY>=16||!grid[maxY+1]||grid[maxY+1][cx]!=='.') continue;
    const X=cx*T, Y=(maxY+1)*T; ctx.save(); ctx.fillStyle='rgba(4,8,18,.55)'; ctx.fillRect(X-6,Y,T+12,T);
    ctx.strokeStyle='rgba(255,138,61,.75)'; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.strokeRect(X-6,Y+1,T+12,T-2); ctx.setLineDash([]);
    ctx.fillStyle='#ff8a3d'; ctx.globalAlpha=.6+.4*Math.sin(clock*4); ctx.beginPath(); ctx.moveTo(X+T/2-6,Y+T/2+4); ctx.lineTo(X+T/2,Y+T/2-8); ctx.lineTo(X+T/2+6,Y+T/2+4); ctx.closePath(); ctx.fill(); ctx.restore(); } }
function drawDoors(){ drawCrawl();
  for(const k in doors){
    const d=doors[k], c=KEYC[d.key];
    if(solo&&d.timer>0&&!plates.some(p=>p.key===d.key&&p.on)&&!d.bridge){ const [x,y]=d.cells[0]; ctx.save(); ctx.font="400 18px 'Russo One', Unbounded, sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=4; ctx.strokeStyle='#04070f'; const t=Math.ceil(d.timer); ctx.strokeText(t,x*T+T/2,y*T-14); ctx.fillStyle=t<=1?'#ff6b6b':c; ctx.fillText(t,x*T+T/2,y*T-14); ctx.restore(); }
    if(d.bridge){
      for(const [x,y] of d.cells){
        const X=x*T, Y=y*T;
        ctx.strokeStyle=c; ctx.globalAlpha=.35; ctx.setLineDash([4,4]); ctx.lineWidth=1; ctx.strokeRect(X+.5,Y+.5,T-1,12); ctx.setLineDash([]);
        ctx.globalAlpha=Math.max(0,d.vis);
        ctx.fillStyle=c; ctx.fillRect(X,Y,T,6); ctx.fillStyle='rgba(8,22,44,.6)'; ctx.fillRect(X+4,Y+6,T-8,6);
        ctx.fillStyle=c; ctx.fillRect(X+2,Y+6,3,8); ctx.fillRect(X+T-5,Y+6,3,8);
        ctx.globalAlpha=1;
      }
      continue;
    }
    const cols={}; for(const [x,y] of d.cells){ (cols[x]=cols[x]||[]).push(y); }
    for(const x in cols){
      const ys=cols[x], top=Math.min(...ys)*T, bot=(Math.max(...ys)+1)*T, H=bot-top, X=x*T;
      ctx.strokeStyle=c; ctx.globalAlpha=.35; ctx.setLineDash([4,4]); ctx.lineWidth=1; ctx.strokeRect(X+.5,top+.5,T-1,H-1); ctx.setLineDash([]); ctx.globalAlpha=1;
      const vis=H*d.vis; if(vis<1) continue;
      ctx.fillStyle='rgba(8,22,44,.85)'; ctx.fillRect(X+3,top,T-6,vis);
      ctx.fillStyle=c;
      for(let i=0;i<3;i++) ctx.fillRect(X+7+i*11,top,4,vis);
      ctx.fillRect(X+3,top+vis-5,T-6,5);
    }
  }
}
function drawExit(){
  const r=exitRect, pulse=.5+.5*Math.sin(clock*3);
  ctx.save();
  ctx.fillStyle=exitLocked?'rgba(255,107,107,.08)':`rgba(156,195,255,${.06+.05*pulse})`; ctx.fillRect(r.x,r.y,r.w,r.h);
  ctx.strokeStyle=exitLocked?'rgba(255,150,150,.8)':'rgba(190,215,255,.85)'; ctx.lineWidth=2; ctx.setLineDash([6,5]); ctx.lineDashOffset=-clock*12; ctx.strokeRect(r.x+1,r.y+1,r.w-2,r.h-2); ctx.setLineDash([]);
  ctx.font="700 10px Unbounded, 'Arial Black', sans-serif"; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillStyle='rgba(220,235,255,.9)';

  if(exitLocked){ ctx.fillStyle='rgba(255,107,107,.7)'; for(let i=0;i<4;i++) ctx.fillRect(r.x+8+i*(r.w-16)/3-2,r.y,4,r.h); }
  const cx=r.x+r.w/2, cy=r.y+12;
  [['#ff8a3d',-10],['#62c7c1',10]].forEach(([c,o],i)=>{
    if(players[i]&&players[i].absent) return; const on=players[i]&&players[i].inExit; ctx.beginPath(); ctx.arc(cx+o,cy,5,0,Math.PI*2);
    ctx.fillStyle=on?c:'rgba(8,22,44,.9)'; ctx.fill(); ctx.strokeStyle=c; ctx.lineWidth=1.5; ctx.stroke();
  });
  ctx.restore();
}
function drawCrate(c){
  const {x,y,w,h}=c;
  ctx.fillStyle='#a8713a'; rr(ctx,x,y,w,h,3); ctx.fill();
  ctx.strokeStyle='#5a3a1c'; ctx.lineWidth=2; rr(ctx,x+1,y+1,w-2,h-2,3); ctx.stroke();
  ctx.strokeStyle='#d8a466'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x+6,y+6); ctx.lineTo(x+w-6,y+h-6); ctx.moveTo(x+w-6,y+6); ctx.lineTo(x+6,y+h-6); ctx.stroke();
  ctx.strokeStyle='#5a3a1c'; ctx.lineWidth=1.5; ctx.strokeRect(x+5,y+5,w-10,h-10);
}
function eyes(dx,y,gap,r,face,blink,white,pupil){
  for(const s of [-1,1]){
    const ex=dx+s*gap+face*2;
    if(blink){ ctx.strokeStyle=pupil; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ex-r,y); ctx.lineTo(ex+r,y); ctx.stroke(); continue; }
    ctx.fillStyle=white; ctx.beginPath(); ctx.ellipse(ex,y,r*.85,r,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=pupil; ctx.beginPath(); ctx.arc(ex+face*1.4,y+.5,r*.5,0,Math.PI*2); ctx.fill();
  }
}
function drawEyeStyle(kind,y,gap,face,body){
  const bolt=kind==='bolt', S=skinOf(kind), r=bolt?4:3.6, ink=bolt?S.eye:'#2a1308', st=looks[kind].eyes;
  ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
  if(bolt){ ctx.shadowColor=S.eye; ctx.shadowBlur=8*GLOW; }
  for(const s of [-1,1]){
    const x=s*gap+face*(bolt?3:2)+(bolt?s*0:0);
    if(st==='happy'){ ctx.strokeStyle=bolt?ink:'#2a1308'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.arc(x,y+r*.6,r*.95,Math.PI*1.1,Math.PI*1.9); ctx.stroke(); }
    else if(st==='stars'){ ctx.fillStyle=bolt?ink:'#ffd166'; ctx.beginPath(); for(let i=0;i<10;i++){ const a=i/10*Math.PI*2-Math.PI/2+clock*1.5, rr2=i%2?r*.42:r*1.15; ctx.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2); } ctx.closePath(); ctx.fill(); }
    else if(st==='sleepy'){ ctx.fillStyle=bolt?ink:'#fff'; ctx.beginPath(); ctx.ellipse(x,y+.5,r*.85,r*.5,0,0,Math.PI); ctx.fill();
      if(!bolt){ ctx.fillStyle='#2a1308'; ctx.beginPath(); ctx.arc(x+face*1.2,y+1.2,r*.4,0,Math.PI); ctx.fill(); }
      ctx.strokeStyle=bolt?ink:'#2a1308'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x-r,y+.5); ctx.lineTo(x+r,y+.5); ctx.stroke(); }
    else if(st==='angry'){ ctx.fillStyle=bolt?ink:'#fff'; ctx.beginPath(); ctx.ellipse(x,y+.8,r*.85,r*.8,0,0,Math.PI*2); ctx.fill();
      if(!bolt){ ctx.fillStyle='#2a1308'; ctx.beginPath(); ctx.arc(x+face*1.2,y+1.3,r*.48,0,Math.PI*2); ctx.fill(); }
      // slanted lid cuts the inner-top of the eye
      ctx.shadowBlur=0; ctx.fillStyle=body; ctx.beginPath(); ctx.moveTo(x-s*r*1.3,y-r*1.6); ctx.lineTo(x+s*r*1.3,y-r*1.6); ctx.lineTo(x-s*r*1.3,y+r*.1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle=bolt?ink:'#2a1308'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(x+s*r*1.2,y-r*1.25); ctx.lineTo(x-s*r*1.2,y-r*.05); ctx.stroke(); if(bolt){ ctx.shadowBlur=8*GLOW; } }
  }
  ctx.restore();
}
function drawHat(id,top,w,face,eyeY,gap){
  if(id==='none') return;
  ctx.save();
  if(id==='cap'){
    ctx.fillStyle='#e2574c'; ctx.beginPath(); ctx.ellipse(0,top+4,w*.42,8,0,Math.PI,0); ctx.fill();
    ctx.fillRect(face>0?0:-w*.42-10,top+2,w*.42+10,4);
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,top-4,2,0,Math.PI*2); ctx.fill();
  } else if(id==='bow'){
    const bx=-face*w*.28, by=top+3; ctx.fillStyle='#ff5fa2';
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx-9,by-6); ctx.lineTo(bx-9,by+6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx+9,by-6); ctx.lineTo(bx+9,by+6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffc1dc'; ctx.beginPath(); ctx.arc(bx,by,3,0,Math.PI*2); ctx.fill();
  } else if(id==='glasses'){
    ctx.fillStyle='rgba(10,10,14,.9)'; ctx.strokeStyle='#111'; ctx.lineWidth=1.5;
    for(const s of [-1,1]){ rr(ctx,s*gap+face*2-5.5,eyeY-4,11,8,3); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(-gap+face*2+5,eyeY-1); ctx.lineTo(gap+face*2-5,eyeY-1); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.55)'; for(const s of [-1,1]) ctx.fillRect(s*gap+face*2-3,eyeY-3,3,1.5);
  } else if(id==='headphones'){
    ctx.strokeStyle='#2b2f3a'; ctx.lineWidth=3.5; ctx.beginPath(); ctx.arc(0,eyeY-2,w*.52,Math.PI*1.08,Math.PI*1.92); ctx.stroke();
    ctx.fillStyle='#ff6b6b'; for(const s of [-1,1]){ rr(ctx,s*w*.5-4,eyeY-7,8,13,3); ctx.fill(); }
  } else if(id==='crown'){
    ctx.fillStyle='#e7b54a'; ctx.strokeStyle='#9a6f1c'; ctx.lineWidth=1.2; ctx.beginPath();
    const cw=w*.36; ctx.moveTo(-cw,top+3); ctx.lineTo(-cw,top-6); ctx.lineTo(-cw/2,top-1); ctx.lineTo(0,top-10); ctx.lineTo(cw/2,top-1); ctx.lineTo(cw,top-6); ctx.lineTo(cw,top+3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#ff6b6b'; ctx.beginPath(); ctx.arc(0,top-1,2,0,Math.PI*2); ctx.fill();
  } else if(id==='horns'){
    ctx.fillStyle='#d8343f'; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(s*w*.18,top+4); ctx.quadraticCurveTo(s*w*.46,top-2,s*w*.42,top-12); ctx.quadraticCurveTo(s*w*.3,top-3,s*w*.05,top+4); ctx.closePath(); ctx.fill(); }
  } else if(id==='halo'){
    ctx.save(); ctx.shadowColor='#ffe08a'; ctx.shadowBlur=10*GLOW; ctx.strokeStyle='#ffe08a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(0,top-10+Math.sin(clock*3)*1.5,w*.36,4,0,0,Math.PI*2); ctx.stroke(); ctx.restore();
  } else if(id==='flower'){
    const fx=face*w*.25, fy=top+1; ctx.fillStyle='#ff9ecb'; for(let i=0;i<5;i++){ const a=i/5*Math.PI*2+clock; ctx.beginPath(); ctx.arc(fx+Math.cos(a)*4.5,fy+Math.sin(a)*4.5,3.2,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.arc(fx,fy,2.6,0,Math.PI*2); ctx.fill();
  } else if(id==='beanie'){
    ctx.fillStyle='#4f8dff'; ctx.beginPath(); ctx.ellipse(0,top+4,w*.44,11,0,Math.PI,0); ctx.fill();
    ctx.fillStyle='#e8f0ff'; ctx.fillRect(-w*.46,top+1,w*.92,5); ctx.beginPath(); ctx.arc(0,top-9,4,0,Math.PI*2); ctx.fill();
  } else if(id==='antenna'){
    ctx.strokeStyle='#9aa8b6'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,top+2); ctx.lineTo(face*3,top-14); ctx.stroke();
    ctx.save(); ctx.fillStyle=Math.floor(clock*3)%2?'#ff6b6b':'#7fe08a'; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=8*GLOW; ctx.beginPath(); ctx.arc(face*3,top-15,3.2,0,Math.PI*2); ctx.fill(); ctx.restore();
  } else if(id==='pirate'){
    ctx.fillStyle='#111'; ctx.strokeStyle='#111'; ctx.lineWidth=1.6; const ex=-gap+face*2;
    ctx.beginPath(); ctx.ellipse(ex,eyeY,5.5,5,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-w*.5,eyeY-6); ctx.lineTo(w*.5,eyeY-2); ctx.stroke();
  } else if(id==='tophat'){
    ctx.fillStyle='#16181f'; ctx.fillRect(-w*.42,top,w*.84,4); ctx.fillRect(-w*.27,top-16,w*.54,17);
    ctx.fillStyle='#e2574c'; ctx.fillRect(-w*.27,top-4,w*.54,3);
  }
  ctx.restore();
}
function playerAlpha(p){ return p.down?.55:(p.inv>0&&Math.floor(clock*18)%2)?.35:1; }
function drawDown(p){
  const R=22, cx=p.x+p.w/2, cy=p.y-14;
  if(p.reviveT>0){ ctx.strokeStyle='#7fe08a'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,R/2,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,p.reviveT/1.2)); ctx.stroke(); }
  ctx.fillStyle='#ff6b6b'; ctx.font="900 14px Unbounded, 'Arial Black', sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
  if(p.bleed!=null&&!solo){ ctx.fillText(Math.ceil(Math.max(0,p.bleed)),cx,cy-18); } if(Math.floor(clock*3)%2===0) ctx.fillText('!',cx,cy);
}
function drawLimbs(p,kind){
  if(looks[kind].limbs===false||looks[kind].limbs==='off') return;
  const bolt=kind==='bolt', w=p.w, h=p.h, S=skinOf(kind), LG=bolt?8:6;
  const col=p.down?'#5c5450':mixHex(S.body,'#000000',.32), shoe=p.down?'#4a4440':mixHex(S.body,'#000000',.55);
  const vx=p.vx||0, moving=Math.abs(vx)>30&&(p.wasGround!==false), air=p.wasGround===false&&!p.down&&p.vx!==undefined;
  const t=p.vx===undefined?clock*2.2:(p.x||0)*(bolt?.09:.13), sw=moving?Math.sin(t):0, idle=p.vx===undefined?Math.sin(clock*2)*.3:0;
  ctx.save(); ctx.lineCap='round'; ctx.strokeStyle=col; ctx.lineWidth=bolt?5:3.4;
  // legs
  for(const s of [-1,1]){
    const hx=s*w*(bolt?.24:.2), step=air?(s*-2):sw*s*(bolt?5:4), lift=air?3:Math.max(0,-sw*s)*3;
    ctx.beginPath(); ctx.moveTo(hx,-LG-2); ctx.lineTo(hx+step,-lift-1.5); ctx.stroke();
    ctx.fillStyle=shoe; ctx.beginPath(); ctx.ellipse(hx+step+p.face*1.5,-lift-1.2,bolt?5:3.6,bolt?2.6:2,0,0,Math.PI*2); ctx.fill();
  }
  // arms (behind body, poke out to the sides)
  const ay=-LG-(h)*(bolt?.48:.42), shoot=p.shootCd>0.05;
  for(const s of [-1,1]){
    const front=s===p.face, ex=s*(w/2+ (bolt?7:6)), swing=(moving?-sw*s*4:0)+idle*s*2;
    const tx=front&&shoot?s*(w/2+11):ex, ty=front&&shoot?ay:ay+(bolt?10:8)+swing*.4;
    ctx.beginPath(); ctx.moveTo(s*w*.3,ay); ctx.quadraticCurveTo(ex,ay+(front&&shoot?0:2+swing*.5),tx,ty+(front&&shoot?0:swing*.3)); ctx.stroke();
    ctx.fillStyle=bolt?'#c7d3dd':col; ctx.beginPath(); ctx.arc(tx,ty+(front&&shoot?0:swing*.3),bolt?3.4:2.4,0,Math.PI*2); ctx.fill();
  }
  ctx.restore(); ctx.translate(0,-LG);
}
function drawSpark(p){
  if(p.dead) return;
  const w=p.w,h=p.h; ctx.save(); ctx.globalAlpha=playerAlpha(p); ctx.translate(p.x+w/2,p.y+h);
  if(p.down){ ctx.rotate(p.face*Math.PI/2*.9); }
  ctx.scale(p.sx,p.sy); drawLimbs(p,'spark');
  const f=Math.sin(clock*20)*2.5, f2=Math.cos(clock*15)*2, S=skinOf('spark');
  if(!p.down){
    ctx.fillStyle=S.flame; ctx.beginPath(); ctx.moveTo(-9,-h+6); ctx.quadraticCurveTo(-6+f2,-h-10,0+f,-h-17); ctx.quadraticCurveTo(7+f2,-h-6,9,-h+6); ctx.fill();
    ctx.fillStyle=S.core; ctx.beginPath(); ctx.moveTo(-4,-h+5); ctx.quadraticCurveTo(-2,-h-4,1+f*.6,-h-9); ctx.quadraticCurveTo(4,-h-2,4,-h+5); ctx.fill();
  }
  ctx.fillStyle=p.down?'#7d6a62':S.body; rr(ctx,-w/2,-h,w,h,10); ctx.fill();
  ctx.fillStyle=p.down?'#9a8a82':S.belly; rr(ctx,-w/2+5,-h+15,w-10,h-19,6); ctx.fill();
  ctx.fillStyle='rgba(255,90,60,.55)'; ctx.beginPath(); ctx.arc(-7+p.face*2,-h+17,2.4,0,Math.PI*2); ctx.arc(7+p.face*2,-h+17,2.4,0,Math.PI*2); ctx.fill();
  if(looks.spark.eyes&&looks.spark.eyes!=='normal'&&!(p.blinkT<0)&&!p.down) drawEyeStyle('spark',-h+11,5,p.face,S.body); else eyes(0,-h+11,5,3.6,p.face,p.blinkT<0||p.down,'#fff','#2a1308');
  drawHat(hatOf('spark'),-h+3,w,p.face,-h+11,5);
  if(p.shield){ ctx.strokeStyle='rgba(156,195,255,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,-h/2,w*.95,h*.85,0,0,Math.PI*2); ctx.stroke(); }
  ctx.restore();
  if(p.down) drawDown(p);
}
function drawBolt(p){
  if(p.dead) return;
  const w=p.w,h=p.h; ctx.save(); ctx.globalAlpha=playerAlpha(p); ctx.translate(p.x+w/2,p.y+h);
  if(p.down){ ctx.translate(0,-6); ctx.rotate(p.face*Math.PI/2*.9); ctx.translate(0,h/2-w/2); }
  ctx.scale(p.sx,p.sy); drawLimbs(p,'bolt');
  if(p.slam){ ctx.strokeStyle='rgba(156,195,255,.6)'; ctx.lineWidth=2; ctx.beginPath(); for(const o of [-10,0,10]){ ctx.moveTo(o,-h-6); ctx.lineTo(o,-h-24); } ctx.stroke(); }
  ctx.fillStyle='#c7d3dd'; ctx.strokeStyle='#6f8191'; ctx.lineWidth=2; ctx.beginPath();
  for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3; ctx.lineTo(Math.cos(a)*12,-h+7+Math.sin(a)*8); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='#6f8191'; ctx.beginPath(); ctx.moveTo(-6,-h+7); ctx.lineTo(6,-h+7); ctx.stroke();
  const S=skinOf('bolt');
  ctx.fillStyle=p.down?'#5c6a70':S.body; rr(ctx,-w/2,-h+11,w,h-11,8); ctx.fill();
  ctx.strokeStyle=S.line; ctx.lineWidth=2; rr(ctx,-w/2+1,-h+12,w-2,h-13,7); ctx.stroke();
  ctx.strokeStyle=S.line; ctx.globalAlpha*=.7; ctx.lineWidth=1.5; ctx.beginPath();
  for(let yy=-18;yy>-h+38;yy-=7){ ctx.moveTo(-w/2+4,yy); ctx.lineTo(w/2-4,yy-3); } ctx.stroke(); ctx.globalAlpha=playerAlpha(p);
  ctx.fillStyle='#0b2230'; rr(ctx,-w/2+4,-h+19,w-8,14,7); ctx.fill();
  if(looks.bolt.eyes&&looks.bolt.eyes!=='normal'&&!(p.blinkT<0)&&!p.down) drawEyeStyle('bolt',-h+26,6,p.face,'#0b2230');
  else if(p.blinkT<0||p.down){ ctx.fillStyle=S.eye; ctx.fillRect(-9+p.face*3,-h+26,6,1.5); ctx.fillRect(3+p.face*3,-h+26,6,1.5); }
  else { ctx.save(); ctx.shadowColor=S.eye; ctx.shadowBlur=8*GLOW; ctx.fillStyle=S.eye; rr(ctx,-9+p.face*3,-h+22,6,8,2); ctx.fill(); rr(ctx,3+p.face*3,-h+22,6,8,2); ctx.fill(); ctx.restore(); }
  drawHat(hatOf('bolt'),-h-1,w,p.face,-h+26,6);
  if(p.shield){ ctx.strokeStyle='rgba(156,195,255,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,-h/2,w*.9,h*.7,0,0,Math.PI*2); ctx.stroke(); }
  ctx.restore();
  if(p.down) drawDown(p);
}
function drawEnemy(en){
  if(en.charge>0){ const k=1-en.charge/0.45, ex=en.x+en.w/2, ey=en.y+(en.big?en.h*.3:en.h*.45); ctx.save(); ctx.globalAlpha=.4+.6*k; ctx.fillStyle='#ff6b6b'; ctx.shadowColor='#ff3b4e'; ctx.shadowBlur=14*GLOW; ctx.beginPath(); ctx.arc(ex,ey,3+k*5,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  if(en.trait){ const cx=en.x+en.w/2, top=en.y-6; ctx.save();
    if(en.trait==='bomb'){ const k=.5+.5*Math.sin(clock*8); ctx.globalAlpha=.25+.35*k; ctx.fillStyle='#ff8a3d'; ctx.beginPath(); ctx.arc(cx,en.y+en.h/2,en.w*.75,0,Math.PI*2); ctx.fill(); }
    if(en.trait==='shield'){ const f=Math.sign(en.vx)||1; ctx.strokeStyle='#9cc3ff'; ctx.lineWidth=4; ctx.shadowColor='#9cc3ff'; ctx.shadowBlur=8*GLOW; ctx.beginPath(); ctx.arc(cx,en.y+en.h*.55,en.w*.62,f>0?-1:Math.PI-1+.0,f>0?1:Math.PI+1); ctx.stroke(); }
    if(en.trait==='split'){ ctx.fillStyle='#7fe08a'; for(const o of [-6,0,6]){ ctx.beginPath(); ctx.arc(cx+o,top,2.4,0,Math.PI*2); ctx.fill(); } }
    if(en.trait==='jumper'){ ctx.strokeStyle='#ffd166'; ctx.lineWidth=2; ctx.beginPath(); for(let i=0;i<5;i++) ctx.lineTo(cx-6+(i%2)*12,top-6+i*3); ctx.stroke(); }
    if(en.trait==='diver'){ ctx.fillStyle='#ff4d5e'; ctx.beginPath(); ctx.moveTo(cx-5,top-6); ctx.lineTo(cx+5,top-6); ctx.lineTo(cx,top+2); ctx.fill(); }
    ctx.restore(); }
  ctx.save(); ctx.translate(en.x+en.w/2,en.y+en.h); if(en.mini) ctx.scale(.6,.6);
  const fl=en.flash>0;
  if(en.type==='crawler'&&en.big){
    const dir=Math.sign(en.vx)||1, step=Math.sin(en.t*10)*4;
    ctx.strokeStyle='#2a1a3a'; ctx.lineWidth=3.2; ctx.lineCap='round'; ctx.beginPath();
    for(const lx of [-10,10]){ ctx.moveTo(lx,-20); ctx.lineTo(lx+step*(lx<0?1:-1),0); } ctx.stroke();
    ctx.fillStyle=fl?'#fff':'#7b4bc4'; ctx.beginPath(); ctx.ellipse(0,-30,17,16,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=fl?'#fff':'#5a3394'; ctx.beginPath(); ctx.ellipse(0,-26,13,9,0,0,Math.PI); ctx.fill();
    ctx.strokeStyle='#3b2066'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-46); ctx.lineTo(0,-20); ctx.stroke();
    ctx.fillStyle='#d9c2ff'; ctx.beginPath(); ctx.moveTo(dir*6,-42); ctx.quadraticCurveTo(dir*18,-52,dir*20,-40); ctx.quadraticCurveTo(dir*14,-42,dir*10,-38); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(dir*9,-33,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a0a06'; ctx.beginPath(); ctx.arc(dir*10.5,-33,2,0,Math.PI*2); ctx.fill();
  } else if(en.type==='crawler'){
    const dir=Math.sign(en.vx)||1, step=Math.sin(en.t*14)*3;
    ctx.strokeStyle='#3a1610'; ctx.lineWidth=2; ctx.beginPath();
    for(const lx of [-9,0,9]){ ctx.moveTo(lx,-6); ctx.lineTo(lx-4+step*(lx===0?-1:1),0); } ctx.stroke();
    ctx.fillStyle=fl?'#fff':'#c2553f'; ctx.beginPath(); ctx.ellipse(0,-11,15,11,0,Math.PI,0); ctx.lineTo(15,-6); ctx.lineTo(-15,-6); ctx.fill();
    ctx.strokeStyle='#7a2a1e'; ctx.beginPath(); ctx.moveTo(0,-21); ctx.lineTo(0,-7); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(dir*9,-13,3.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a0a06'; ctx.beginPath(); ctx.arc(dir*10,-13,1.7,0,Math.PI*2); ctx.fill();
  } else if(en.type==='flyer'){
    const wing=Math.sin(en.t*40)*5;
    ctx.fillStyle='rgba(220,240,255,.6)'; ctx.beginPath(); ctx.ellipse(-5,-18-wing*.4,8,4+wing*.3,-.4,0,Math.PI*2); ctx.ellipse(5,-18-wing*.4,8,4+wing*.3,.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=fl?'#fff':'#e7c84a'; rr(ctx,-13,-15,26,13,6); ctx.fill();
    ctx.fillStyle='#2a2208'; ctx.fillRect(-4,-15,3,13); ctx.fillRect(3,-15,3,13);
    ctx.beginPath(); ctx.moveTo(en.dir*-13,-9); ctx.lineTo(en.dir*-19,-8); ctx.lineTo(en.dir*-13,-6); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(en.dir*9,-10,2.6,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle=fl?'#fff':'#8a98a8'; rr(ctx,-14,-18,28,18,4); ctx.fill();
    ctx.strokeStyle='#4a5866'; ctx.lineWidth=2; rr(ctx,-13,-17,26,16,4); ctx.stroke();
    ctx.save(); ctx.translate(0,-20); ctx.rotate(en.aim); ctx.fillStyle='#4a5866'; ctx.fillRect(0,-3,18,6); ctx.restore();
    ctx.fillStyle=fl?'#fff':'#c7d3dd'; ctx.beginPath(); ctx.arc(0,-20,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff6b6b'; ctx.beginPath(); ctx.arc(0,-20,3,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
function drawBoss(b){
  if(b.dead&&b.deadT<=0) return;
  ctx.save(); ctx.translate(b.x+b.w/2,b.y+b.h/2);
  if(b.dead){ ctx.globalAlpha=Math.max(0,b.deadT/1.5); ctx.rotate(Math.sin(clock*30)*.05); }
  const SC=b.sc||1; ctx.scale(SC,SC);
  const fl=b.flash>0, w=b.w/SC, h=b.h/SC, V=b.v||1;
  if(V>=2&&GLOW){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(0,0,w*.9,V===3?'#ffd166':'#ff4d5e',.10+.04*Math.sin(clock*5)); ctx.restore(); }
  const n=nearestPlayer(b.x+b.w/2,b.y+b.h/2);
  const look=n?Math.atan2(n.p.y-b.y-b.h/2,n.p.x-b.x-b.w/2):0;
  if(b.type==='toad'){
    const sq=b.state==='air'?1.08:1;
    ctx.scale(1/sq,sq);
    ctx.fillStyle='#4a5866'; rr(ctx,-w/2+8,-h/2-10,w-16,12,3); ctx.fill();
    ctx.fillStyle='#c7d3dd'; ctx.fillRect(-6,-h/2-22,12,14);
    ctx.fillStyle=fl?'#fff':['','#6fae5b','#4f8a3f','#3c6e30'][V]; ctx.beginPath(); ctx.ellipse(0,6,w/2,h/2-2,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=fl?'#fff':'#a8d48f'; ctx.beginPath(); ctx.ellipse(0,18,w/2-14,h/3-6,0,0,Math.PI*2); ctx.fill();
    for(const s of [-1,1]){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s*22,-14,11,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#1a2a12'; ctx.beginPath(); ctx.arc(s*22+Math.cos(look)*4,-14+Math.sin(look)*4,5,0,Math.PI*2); ctx.fill(); }
    ctx.strokeStyle='#2a4a1e'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,6,22,0.2,Math.PI-0.2); ctx.stroke();
  } else if(b.type==='eye'){
    ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.moveTo(-10,h/2-4); ctx.lineTo(0,h/2+14+Math.sin(clock*30)*5); ctx.lineTo(10,h/2-4); ctx.fill();
    ctx.fillStyle='#4a5866'; ctx.beginPath(); ctx.arc(0,0,w/2,0,Math.PI*2); ctx.fill();
    for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+clock*.5; ctx.fillStyle='#c7d3dd'; ctx.beginPath(); ctx.arc(Math.cos(a)*(w/2-5),Math.sin(a)*(w/2-5),3,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle=fl?'#ffd0d0':'#f4f6fb'; ctx.beginPath(); ctx.arc(0,0,w/2-11,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=b.hp<b.max/2?'#ff6b6b':'#62c7c1'; ctx.beginPath(); ctx.arc(Math.cos(look)*12,Math.sin(look)*12,14,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#0b1830'; ctx.beginPath(); ctx.arc(Math.cos(look)*15,Math.sin(look)*15,6,0,Math.PI*2); ctx.fill();
  } else if(b.type==='gear'){
    ctx.save(); ctx.rotate(b.rot);
    ctx.fillStyle=fl?'#fff':'#b98c3c'; ctx.beginPath();
    const teeth=10, R1=w/2, R0=w/2-11;
    for(let i=0;i<teeth*2;i++){ const a=i/(teeth*2)*Math.PI*2, r=i%2?R0:R1; const a2=a+Math.PI/(teeth*2); ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); ctx.lineTo(Math.cos(a2)*r,Math.sin(a2)*r); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='#6e4f1e'; ctx.beginPath(); ctx.arc(0,0,R0-10,0,Math.PI*2); ctx.fill();
    for(let i=0;i<4;i++){ const a=i*Math.PI/2; ctx.fillStyle='#b98c3c'; ctx.fillRect(Math.cos(a)*20-3,Math.sin(a)*20-3,6,6); }
    ctx.restore();
    for(const s of [-1,1]){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s*11,-4,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#1a0a06'; ctx.beginPath(); ctx.arc(s*11+Math.cos(look)*3,-4+Math.sin(look)*3,3.5,0,Math.PI*2); ctx.fill(); }
    ctx.strokeStyle='#1a0a06'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-18,-16); ctx.lineTo(-5,-11); ctx.moveTo(18,-16); ctx.lineTo(5,-11); ctx.stroke();
  } else if(b.type==='queen'){
    const dir=b.face||1, step=Math.sin(b.t*(b.state==='charge'?30:10))*4;
    ctx.strokeStyle='#3a1020'; ctx.lineWidth=3; ctx.beginPath();
    for(const lx of [-40,-20,0,20,40]){ ctx.moveTo(lx,h/2-14); ctx.lineTo(lx-6+step*(lx%40?1:-1),h/2); } ctx.stroke();
    ctx.fillStyle=fl?'#fff':'#9b3d5a'; ctx.beginPath(); ctx.ellipse(-dir*6,4,w/2-6,h/2-6,0,Math.PI,0); ctx.lineTo(w/2-12,h/2-12); ctx.lineTo(-w/2+12,h/2-12); ctx.fill();
    ctx.strokeStyle='#5a1e33'; ctx.lineWidth=2; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.arc(-dir*6,4,(w/2-6)*(0.3+Math.abs(i)*0.15),Math.PI,0); ctx.stroke(); }
    ctx.fillStyle=fl?'#fff':'#7a2a44'; ctx.beginPath(); ctx.arc(dir*(w/2-14),2,18,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#e7b54a'; ctx.beginPath(); const hx=dir*(w/2-14); ctx.moveTo(hx-14,-12); ctx.lineTo(hx-10,-26); ctx.lineTo(hx-4,-16); ctx.lineTo(hx,-30); ctx.lineTo(hx+4,-16); ctx.lineTo(hx+10,-26); ctx.lineTo(hx+14,-12); ctx.fill();
    ctx.fillStyle=b.state==='tele'?'#ff6b6b':'#ffd166'; ctx.beginPath(); ctx.arc(hx+dir*6,0,4,0,Math.PI*2); ctx.arc(hx+dir*12,4,3,0,Math.PI*2); ctx.fill();
  } else {
    for(let i=3;i>=1;i--){ ctx.save(); ctx.rotate(clock*(i%2?.6:-.8)*i); ctx.strokeStyle=i===3?'#4a5866':i===2?'#b98c3c':'#c79bff'; ctx.lineWidth=7; ctx.setLineDash([14,8]); ctx.beginPath(); ctx.arc(0,0,w/2-(3-i)*14,0,Math.PI*2); ctx.stroke(); ctx.restore(); }
    ctx.setLineDash([]);
    ctx.save(); ctx.shadowColor='#ff6b6b'; ctx.shadowBlur=24*GLOW; ctx.fillStyle=fl?'#fff':(b.hp<b.max/2?'#ff3b4e':'#ff6b6b'); ctx.beginPath(); ctx.arc(0,0,20+Math.sin(clock*6)*2,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.fillStyle='#0b1830'; ctx.beginPath(); ctx.arc(Math.cos(look)*8,Math.sin(look)*8,7,0,Math.PI*2); ctx.fill();
  }
  if(V>=2) drawUpgrades(b,w,h,V,look,fl);
  ctx.restore();
  if(b.laser) drawLaser(b);
}
function weld(x1,y1,x2,y2){ ctx.save(); ctx.strokeStyle='#ff9a3d'; ctx.lineWidth=2.2; ctx.shadowColor='#ff9a3d'; ctx.shadowBlur=8*GLOW; ctx.beginPath(); const n=6; for(let i=0;i<=n;i++){ const x=x1+(x2-x1)*i/n, y=y1+(y2-y1)*i/n+(i%2?2.5:-2.5); i?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.stroke(); ctx.restore(); }
function rivet(x,y,r=2.4){ ctx.fillStyle='#dfe7ee'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(x+.6,y+.6,r*.5,0,Math.PI*2); ctx.fill(); }
function drawUpgrades(b,w,h,V,look,fl){
  const steel=fl?'#fff':(V===3?'#e7b54a':'#8a98a8'), dark=V===3?'#9a6f1c':'#4a5866';
  if(b.type==='toad'){
    ctx.fillStyle=steel; ctx.beginPath(); ctx.ellipse(0,-6,w/2+2,h/2-8,0,Math.PI*1.05,Math.PI*1.95); ctx.lineTo(w*.42,-2); ctx.lineTo(-w*.42,-2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=dark; ctx.lineWidth=2; ctx.stroke();
    for(let i=-3;i<=3;i++) rivet(i*12,-h/2+12+Math.abs(i)*2.4);
    for(const s of [-1,1]){ ctx.fillStyle=dark; ctx.beginPath(); ctx.moveTo(s*w*.42,-4); ctx.lineTo(s*(w*.5+14),-20); ctx.lineTo(s*w*.5,4); ctx.fill(); }
    for(const s of [-1,1]){ ctx.strokeStyle='#ff4d5e'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(s*22,-14,12.5,0,Math.PI*2); ctx.stroke(); }
    weld(-30,14,-8,24); weld(10,22,32,10);
    if(V===3){ ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.moveTo(-16,-h/2-2); ctx.lineTo(-10,-h/2-16); ctx.lineTo(-3,-h/2-4); ctx.lineTo(0,-h/2-20); ctx.lineTo(3,-h/2-4); ctx.lineTo(10,-h/2-16); ctx.lineTo(16,-h/2-2); ctx.fill();
      for(let i=0;i<6;i++){ const a=clock*3+i; ctx.fillStyle=`rgba(255,${120+i*20},60,.55)`; ctx.beginPath(); ctx.arc(Math.cos(a)*(w*.55),Math.sin(a*1.3)*h*.45,3+Math.sin(clock*9+i)*1.5,0,Math.PI*2); ctx.fill(); } }
  } else if(b.type==='eye'){
    for(let i=0;i<10;i++){ const a=i/10*Math.PI*2+clock*.3; ctx.fillStyle=steel; ctx.beginPath(); ctx.moveTo(Math.cos(a-.12)*(w/2-2),Math.sin(a-.12)*(w/2-2)); ctx.lineTo(Math.cos(a)*(w/2+14),Math.sin(a)*(w/2+14)); ctx.lineTo(Math.cos(a+.12)*(w/2-2),Math.sin(a+.12)*(w/2-2)); ctx.fill(); }
    ctx.strokeStyle=dark; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(0,0,w/2-3,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle=dark; rr(ctx,-9,h/2-6,18,14,4); ctx.fill(); ctx.fillStyle='#ff4d5e'; ctx.beginPath(); ctx.arc(0,h/2+8,4+Math.sin(clock*12),0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#ff4d5e'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(Math.cos(look)*12,Math.sin(look)*12,17,0,Math.PI*2); ctx.stroke();
    weld(-w*.3,-h*.32,-w*.12,-h*.4);
  } else if(b.type==='gear'){
    ctx.save(); ctx.rotate(b.rot); const teeth=10, R1=w/2;
    for(let i=0;i<teeth;i++){ const a=i/teeth*Math.PI*2+Math.PI/(teeth*2); ctx.fillStyle='#d9dee5'; ctx.beginPath(); ctx.moveTo(Math.cos(a-.09)*R1,Math.sin(a-.09)*R1); ctx.lineTo(Math.cos(a)*(R1+11),Math.sin(a)*(R1+11)); ctx.lineTo(Math.cos(a+.09)*R1,Math.sin(a+.09)*R1); ctx.fill(); }
    ctx.fillStyle=steel; ctx.beginPath(); ctx.arc(0,0,R1-22,0,Math.PI*2); ctx.fill(); ctx.strokeStyle=dark; ctx.lineWidth=2; ctx.stroke();
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; rivet(Math.cos(a)*(R1-27),Math.sin(a)*(R1-27)); }
    ctx.restore();
    for(const s of [-1,1]){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s*11,-4,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ff2d3d'; ctx.beginPath(); ctx.arc(s*11+Math.cos(look)*3,-4+Math.sin(look)*3,4,0,Math.PI*2); ctx.fill(); }
    ctx.strokeStyle='#1a0a06'; ctx.lineWidth=3.5; ctx.beginPath(); ctx.moveTo(-20,-17); ctx.lineTo(-4,-10); ctx.moveTo(20,-17); ctx.lineTo(4,-10); ctx.stroke();
    weld(-12,10,12,14);
  } else if(b.type==='queen'){
    const dir=b.face||1;
    ctx.fillStyle=steel; for(let i=-2;i<=1;i++){ ctx.beginPath(); ctx.ellipse(-dir*6+i*20+10,-h*.18,13,9,0,Math.PI,0); ctx.fill(); }
    ctx.strokeStyle=dark; ctx.lineWidth=1.5; for(let i=-2;i<=1;i++){ ctx.beginPath(); ctx.ellipse(-dir*6+i*20+10,-h*.18,13,9,0,Math.PI,0); ctx.stroke(); rivet(-dir*6+i*20+10,-h*.18-4,1.8); }
    for(let i=0;i<4;i++){ ctx.fillStyle='#ff4d5e'; const x=-dir*6+(i-1.5)*22; ctx.beginPath(); ctx.moveTo(x-5,-h*.3); ctx.lineTo(x,-h*.3-14); ctx.lineTo(x+5,-h*.3); ctx.fill(); }
    const hx=dir*(w/2-14); ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.moveTo(hx-16,-14); ctx.lineTo(hx-12,-32); ctx.lineTo(hx-5,-20); ctx.lineTo(hx,-38); ctx.lineTo(hx+5,-20); ctx.lineTo(hx+12,-32); ctx.lineTo(hx+16,-14); ctx.fill();
    ctx.fillStyle='#ff4d5e'; ctx.beginPath(); ctx.arc(hx,-24,3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff2d3d'; ctx.beginPath(); ctx.arc(hx+dir*6,0,4.5,0,Math.PI*2); ctx.arc(hx+dir*12,4,3.5,0,Math.PI*2); ctx.fill();
    weld(-w*.3,h*.05,-w*.05,h*.12);
  }
}
function drawLaser(b){
  const L=b.laser, cx=b.x+b.w/2, cy=b.y+b.h/2+b.h*0.45, len=1800, ex=cx+Math.cos(L.ang)*len, ey=cy+Math.sin(L.ang)*len;
  ctx.save();
  if(L.state==='aim'){ ctx.strokeStyle=`rgba(255,77,94,${.4+.4*(Math.floor(L.t*14)%2)})`; ctx.lineWidth=2; ctx.setLineDash([10,8]); ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ex,ey); ctx.stroke(); ctx.setLineDash([]); }
  else { ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(255,77,94,.35)'; ctx.lineWidth=26; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ex,ey); ctx.stroke();
    ctx.strokeStyle='rgba(255,180,120,.8)'; ctx.lineWidth=10; ctx.stroke(); ctx.strokeStyle='#ffffff'; ctx.lineWidth=3; ctx.stroke(); }
  ctx.restore();
}
function drawPickup(pk){
  const bob=Math.sin(pk.t*3)*3, cx=pk.x+T/2, cy=pk.y+T/2+bob+(pk.y%T===0?4:0), c=PICK_INFO[pk.type].c;
  ctx.save(); ctx.translate(cx,cy);
  if(pk.type==='gear'){
    ctx.rotate(pk.t*2); ctx.fillStyle=c; ctx.beginPath();
    for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, r=i%2?6:9; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); ctx.fill();
    ctx.fillStyle='#0f2547'; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
  } else {
    ctx.shadowColor=c; ctx.shadowBlur=14*GLOW; ctx.fillStyle='rgba(8,22,44,.85)'; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.strokeStyle=c; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=c;
    if(pk.type==='relic'){ ctx.beginPath(); for(let i=0;i<10;i++){ const a=i/10*Math.PI*2-Math.PI/2, r=i%2?3.6:9; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); ctx.fill(); }
    else if(pk.type==='heart') heart(0,1,8);
    else if(pk.type==='shield'){ ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(7,-5); ctx.lineTo(6,3); ctx.lineTo(0,8); ctx.lineTo(-6,3); ctx.lineTo(-7,-5); ctx.closePath(); ctx.fill(); }
    else if(pk.type==='triple'){ for(const a of [-.4,0,.4]){ ctx.save(); ctx.rotate(a); ctx.fillRect(-1,-1.5,9,3); ctx.restore(); } ctx.beginPath(); ctx.arc(-4,0,3,0,Math.PI*2); ctx.fill(); }
    else if(pk.type==='rapid'){ ctx.beginPath(); ctx.moveTo(2,-9); ctx.lineTo(-5,1); ctx.lineTo(0,1); ctx.lineTo(-2,9); ctx.lineTo(5,-1); ctx.lineTo(0,-1); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#0f2547'; ctx.beginPath(); ctx.arc(0,0,2.5,0,Math.PI*2); ctx.fill(); }
  }
  ctx.restore();
}
function drawSecretGlint(){
  const t=performance.now()/1000;
  for(const pk of pickups){ if(!pk.hidden) continue; const ph=(t*0.9+pk.x*0.013)%3; if(ph>0.5) continue; const a=Math.sin(ph/0.5*Math.PI), x=pk.x+T/2+Math.sin(pk.x)*10, y=pk.y-T+12;
    ctx.save(); ctx.globalAlpha=a*.85; ctx.fillStyle='#ffe9a8'; ctx.translate(x,y); ctx.rotate(ph*2); ctx.beginPath(); for(let i=0;i<8;i++){ const r=i%2?1.5:6; const an=i/8*Math.PI*2; ctx.lineTo(Math.cos(an)*r,Math.sin(an)*r);} ctx.closePath(); ctx.fill(); ctx.restore(); }
}
function heart(x,y,s){ ctx.beginPath(); ctx.moveTo(x,y+s*.7); ctx.bezierCurveTo(x-s*1.3,y-s*.2,x-s*.6,y-s*1.1,x,y-s*.35); ctx.bezierCurveTo(x+s*.6,y-s*1.1,x+s*1.3,y-s*.2,x,y+s*.7); ctx.fill(); }
function drawBag(p,x0,dir){
  p.bagPop=Math.max(0,(p.bagPop||0)-1/30);
  const y=T*1.3, sz=26;
  for(let i=0;i<BAG_MAX;i++){
    const cx=x0+dir*(i*(sz+6)+sz/2+6), it=p.bag[i], on=i===p.sel&&it;
    ctx.save(); ctx.translate(cx,y); if(on) ctx.scale(1+p.bagPop*.25,1+p.bagPop*.25);
    ctx.fillStyle='rgba(8,22,44,.85)'; rr(ctx,-sz/2,-sz/2,sz,sz,6); ctx.fill();
    ctx.strokeStyle=on?'#c792ff':'rgba(156,195,255,.25)'; ctx.lineWidth=on?2.2:1; ctx.stroke();
    if(it){ ctx.scale(.62,.62); drawPickup({type:it,x:-T/2,y:-T/2-.5,t:0}); }
    ctx.restore();
  }
}
const RELIC_SHORT=['−20% здоровья','+25% урона','−15% скорости'];
function drawRelicHud(){
  if(intro) return; const n=levelIdx+1, d=n%10;
  if(!(boss||d>=7)) return;
  const N=boss?n:Math.ceil(n/10)*10, bt=boss?boss.type:bossTypeAt(N), got=(run.relics||{})[N]||[];
  ctx.save(); ctx.textBaseline='middle';
  ctx.font="700 10px Unbounded, 'Arial Black', sans-serif"; const title=(boss?'ОСЛАБЛЕН: ':'ПРОТИВ БОССА: ')+BOSS_NAMES[bt].toUpperCase();
  ctx.font="500 11px Rubik, system-ui, sans-serif"; const ws=RELIC_SHORT.map(t=>ctx.measureText(t).width+30);
  const W=Math.max(ws.reduce((a,b)=>a+b,0)+16, 0), x0=VW/2-W/2, y0=boss?VH-T*1.55:T*1.05+30;
  ctx.fillStyle='rgba(8,18,38,.78)'; rr(ctx,x0,y0-4,W,40,10); ctx.fill(); ctx.strokeStyle=got.length===3?'#ff5fa2':'rgba(255,95,162,.45)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.font="700 9px Unbounded, 'Arial Black', sans-serif"; ctx.textAlign='center'; ctx.fillStyle='#ff9ccb'; ctx.fillText(title+'  '+got.length+'/3',VW/2,y0+6);
  let x=x0+8; ctx.font="500 11px Rubik, system-ui, sans-serif"; ctx.textAlign='left';
  for(let i=0;i<3;i++){ const on=got.includes(i), cy=y0+23;
    ctx.save(); ctx.translate(x+8,cy); ctx.fillStyle=on?'#ff5fa2':'transparent'; ctx.strokeStyle=on?'#ffd1e6':'rgba(200,210,230,.45)'; ctx.lineWidth=1.3;
    if(on){ ctx.shadowColor='#ff5fa2'; ctx.shadowBlur=8*GLOW; }
    ctx.beginPath(); for(let k=0;k<10;k++){ const a=k/10*Math.PI*2-Math.PI/2, r=k%2?2.8:7; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); if(on) ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle=on?'#ffe3f0':'rgba(190,200,220,.5)'; ctx.fillText(RELIC_SHORT[i],x+20,cy+1); x+=ws[i]; }
  ctx.restore();
}
function drawHud(){
  drawRelicHud();

  const rows=[[players[0],'#ff8a3d',T,1],[players[1],'#62c7c1',VW-T,-1]];
  ctx.font="700 11px Unbounded, 'Arial Black', sans-serif"; ctx.textBaseline='middle';
  for(const [p,c,x0,dir] of (intro?[]:rows.filter(r=>!r[0].absent))){
    let x=x0+dir*6;
    drawBag(p,x0,dir); ctx.font="700 11px Unbounded, 'Arial Black', sans-serif"; ctx.textBaseline='middle';
    ctx.fillStyle=c; ctx.textAlign=dir>0?'left':'right'; const name=p.kind==='spark'?'ИСКРА':'БОЛТ';
    ctx.fillText(name,x,T/2); x+=dir*(ctx.measureText(name).width+12);
    for(let i=0;i<Math.max(Math.max(1,3+U('hearts')+(diffId()==='easy'?2:diffId()==='nightmare'?-2:0)),p.hp);i++){ ctx.fillStyle=i<p.hp?'#ff6b81':'rgba(255,107,129,.2)'; heart(x+dir*8,T/2+1,7); x+=dir*20; }
    if(p.shield){ ctx.fillStyle='#9cc3ff'; ctx.beginPath(); ctx.arc(x+dir*8,T/2,6,0,Math.PI*2); ctx.fill(); x+=dir*20; }
    for(const k of ['triple','rapid','power']){
      if(p.pw[k]<=0) continue;
      const lab={triple:'×3',rapid:'>>',power:'x2'}[k]+' '+Math.ceil(p.pw[k]);
      ctx.font="500 11px Rubik, system-ui, sans-serif"; const tw=ctx.measureText(lab).width+12;
      const bx=dir>0?x:x-tw, pop=(p.pwPop&&p.pwPop[k])||0, low=p.pw[k]<4&&Math.floor(clock*6)%2;
      ctx.save(); ctx.translate(bx+tw/2,T/2); ctx.scale(1+pop*.5,1+pop*.5); ctx.translate(-(bx+tw/2),-T/2);
      ctx.fillStyle=pop>0?PICK_INFO[k].c:'rgba(8,22,44,.9)'; rr(ctx,bx,T/2-9,tw,18,9); ctx.fill(); ctx.strokeStyle=PICK_INFO[k].c; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle=pop>0?'#0b1830':PICK_INFO[k].c; ctx.globalAlpha=low?.4:1; ctx.textAlign='left'; ctx.fillText(lab,bx+6,T/2+1); ctx.globalAlpha=1; ctx.textAlign=dir>0?'left':'right'; ctx.restore();
      x+=dir*(tw+6); ctx.font="700 11px Unbounded, 'Arial Black', sans-serif";
    }
  }
  if(anyCheat()){ ctx.font="700 10px Unbounded, 'Arial Black', sans-serif"; ctx.textAlign='left'; ctx.fillStyle='#7fe08a'; ctx.fillText('ЧИТЫ: '+[cheatGod&&'бессмертие',cheatOne&&'один выстрел',cheat&&'[ ] уровни'].filter(Boolean).join(' · '),T+6,VH-T/2); }
  if(boss&&!boss.dead&&!(intro&&intro.t<INTRO_P)){
    const w=460, h=22, x=VW/2-w/2, y=T/2-h/2;
    const fill=intro?Math.max(0,Math.min(1,(intro.t-INTRO_P-0.2)/1.1)):boss.hp/boss.max;
    const lag=intro?fill:Math.max(fill,(boss.lag??boss.hp)/boss.max);
    const shownHp=intro?Math.round(boss.max*fill):Math.max(0,Math.ceil(boss.hp));
    ctx.fillStyle='rgba(4,8,18,.95)'; rr(ctx,x-3,y-3,w+6,h+6,7); ctx.fill();
    ctx.strokeStyle=fill<0.5?'rgba(255,77,94,.9)':'rgba(255,150,160,.5)'; ctx.lineWidth=1.5; rr(ctx,x-3,y-3,w+6,h+6,7); ctx.stroke();
    if(lag>fill){ ctx.fillStyle='#ffe08a'; rr(ctx,x,y,w*lag,h,5); ctx.fill(); }
    const gr=ctx.createLinearGradient(0,y,0,y+h); gr.addColorStop(0,fill<0.5?'#ff7a85':'#ff8f8f'); gr.addColorStop(1,fill<0.5?'#c41f33':'#d8404d');
    if(fill>0){ ctx.fillStyle=gr; rr(ctx,x,y,Math.max(6,w*fill),h,5); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.22)'; ctx.fillRect(x+3,y+2,Math.max(0,w*fill-6),4); }
    ctx.fillStyle='rgba(4,8,18,.55)'; for(let i=1;i<10;i++) ctx.fillRect(x+w*i/10-0.5,y+3,1,h-6);
    ctx.fillStyle='#ffd166'; ctx.fillRect(x+w/2-1,y-5,2,h+10);
    ctx.textBaseline='middle'; ctx.lineJoin='round'; ctx.lineWidth=4; ctx.strokeStyle='rgba(4,8,18,.9)';
    ctx.textAlign='left'; ctx.font="700 11px Unbounded, 'Arial Black', sans-serif"; ctx.strokeText(boss.name.toUpperCase(),x+8,y+h/2+0.5); ctx.fillStyle='#fff'; ctx.fillText(boss.name.toUpperCase(),x+8,y+h/2+0.5);
    ctx.textAlign='right'; ctx.font="400 15px 'Russo One', Unbounded, sans-serif"; const hpTxt=`${shownHp} / ${boss.max}`;
    ctx.strokeText(hpTxt,x+w-8,y+h/2+1); ctx.fillStyle='#fff'; ctx.fillText(hpTxt,x+w-8,y+h/2+1);
    ctx.textAlign='left'; ctx.font="400 13px 'Russo One', Unbounded, sans-serif"; const pct=Math.ceil(fill*100)+'%';
    ctx.lineWidth=3; ctx.strokeText(pct,x+w+10,y+h/2+1); ctx.fillStyle=fill<0.5?'#ff6b6b':'#ffd166'; ctx.fillText(pct,x+w+10,y+h/2+1);
    if(fill<0.5&&!intro){ ctx.font="700 9px Unbounded, sans-serif"; ctx.fillStyle='#ff4d5e'; ctx.textAlign='center'; ctx.globalAlpha=.6+.4*Math.sin(clock*8); ctx.fillText('ЯРОСТЬ',x+w/2,y+h+11); ctx.globalAlpha=1; }
  }
}
function draw(){
  if(!grid) return;
  if(staticDirty) renderStatic();
  let r3=R3D.active(); ctx.setTransform(1,0,0,1,0,0); if(r3) ctx.clearRect(0,0,cv.width,cv.height); else { R3D.hide(); ctx.fillStyle='#0b1830'; ctx.fillRect(0,0,cv.width,cv.height); }
  GLOW=settings.glow?1:0;
  const sk=settings.shake?shake:0, sx=(Math.random()-.5)*sk, sy=(Math.random()-.5)*sk;
  let z=1, ox=0, oy=0;
  if(intro&&boss){
    const t=intro.t, D=intro.dur, ease=k=>k<0?0:k>1?1:k*k*(3-2*k);
    z=1+0.3*ease((t-INTRO_P-0.15)/0.5)*(1-ease((t-(D-1.0))/0.7));
    const cx=boss.x+boss.w/2, cy=Math.max(boss.y+boss.h/2,VH*0.35);
    ox=Math.min(0,Math.max(VW-VW*z,VW/2-cx*z)); oy=Math.min(0,Math.max(VH-VH*z,VH*0.55-cy*z));
  } else if(!outro&&touchLayout.cam&&(touchLayout.field||1)>1&&document.body.classList.contains('touch')&&(state==='play'||state==='dying'||state==='pause')&&players){
    z=touchLayout.field; const live=players.filter(p=>!p.absent&&!p.dead);
    const me=NET.role==='guest'?NET.me:NET.role==='host'?players[0]:null, tg=me?[me]:live;
    if(tg.length){ const tx=tg.reduce((a,p)=>a+p.x+p.w/2,0)/tg.length, ty=tg.reduce((a,p)=>a+p.y+p.h/2,0)/tg.length;
      const C=draw.cam||(draw.cam={x:tx,y:ty}); C.x+=(tx-C.x)*.12; C.y+=(ty-C.y)*.12;
      ox=Math.min(0,Math.max(VW-VW*z,VW/2-C.x*z)); oy=Math.min(0,Math.max(VH-VH*z,VH*0.55-C.y*z)); }
  } else if(outro){
    const O=outro, ease=k=>k<0?0:k>1?1:k*k*(3-2*k);
    z=1+(O.mk?.45:.3)*ease(O.t/(O.boomAt*.8))*(1-ease((O.t-O.boomAt-.2)/.8));
    ox=Math.min(0,Math.max(VW-VW*z,VW/2-O.cx*z)); oy=Math.min(0,Math.max(VH-VH*z,VH*0.5-O.cy*z));
  }
  if(r3&&!intro&&!outro&&players&&(state==='play'||state==='dying')){ const live=players.filter(p=>!p.absent&&!p.dead); if(live.length){
      let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const p of live){ x0=Math.min(x0,p.x); x1=Math.max(x1,p.x+p.w); y0=Math.min(y0,p.y); y1=Math.max(y1,p.y+p.h); }
      const want=Math.max(1,Math.min(1.45,VW/(x1-x0+620),VH/(y1-y0+380)));
      const C=draw.c3||(draw.c3={x:(x0+x1)/2,y:(y0+y1)/2,z:want}); C.x+=((x0+x1)/2-C.x)*.08; C.y+=((y0+y1)/2-C.y)*.08; C.z+=(want-C.z)*.05;
      z=C.z; ox=Math.min(0,Math.max(VW-VW*z,VW/2-C.x*z)); oy=Math.min(0,Math.max(VH-VH*z,VH*0.58-C.y*z)); } }
  ctx.setTransform(scale*z,0,0,scale*z,(sx+ox)*scale,(sy+oy)*scale);
  let r3ok=r3; if(r3){ try{ R3D.render(z,ox+sx,oy+sy); }catch(err){ R3D.fail(err); r3ok=false; } } if(!r3ok){ if(r3){ r3=false; R3D.hide(); ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#0b1830'; ctx.fillRect(0,0,cv.width,cv.height); ctx.setTransform(scale*z,0,0,scale*z,(sx+ox)*scale,(sy+oy)*scale); }
  ctx.drawImage(staticLayer,0,0,VW,VH);
  if(LIVE&&state!=='title'&&settings.ambient) drawLive();
  if(state!=='title') ctx.drawImage(wallLayer,0,0,VW,VH); }
  if(state==='title'){ drawTitleScene(); return; }
  if(state==='ending'){ drawEnding(); return; }
  if(state==='prologue'){ drawPrologue(); return; }
  if(settings.ambient) drawAmbient();
  drawCracks(); if(arena) drawArena(); drawExit(); drawDoors(); drawPlates(); if(!r3) drawMovers(); drawMech();
  for(const pk of pickups) if(!pk.hidden) drawPickup(pk);
  if(!r3) for(const c of crates) drawCrate(c);
  for(const en of enemies) drawEnemy(en);
  if(boss&&!boss.gone) drawBoss(boss);
  if(outro) drawOutroWorld();
  if(settings.glow) drawLights();
  drawDark();
  drawBolt(players[1]); drawSpark(players[0]);
  if(false){ const p=players[active], bob=Math.sin(clock*6)*3, x=p.x+p.w/2, y=p.y-(p.kind==='spark'?30:14)+bob;
    ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.moveTo(x-7,y-10); ctx.lineTo(x+7,y-10); ctx.lineTo(x,y-2); ctx.closePath(); ctx.fill();
    const o=players[1-active]; if(follow&&!o.down){ ctx.globalAlpha=.7; ctx.fillStyle='#9cc3ff'; ctx.font="700 9px Unbounded, sans-serif"; ctx.textAlign='center'; ctx.fillText('ЗА МНОЙ',o.x+o.w/2,o.y-(o.kind==='spark'?26:10)); ctx.globalAlpha=1; } }
  for(const r of rings){ ctx.globalAlpha=Math.max(0,r.life*2.5); ctx.strokeStyle=r.c; ctx.lineWidth=r.w*Math.max(.3,r.life*2); ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,Math.PI*2); ctx.stroke(); } ctx.globalAlpha=1;
  for(const b of bullets) drawBullet(b);
  for(const b of []){ if(settings.trails){ ctx.strokeStyle=b.c; ctx.globalAlpha=.35; ctx.lineWidth=b.h*.7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(b.x+b.w/2,b.y+b.h/2); ctx.lineTo(b.x+b.w/2-b.vx*.035,b.y+b.h/2-b.vy*.035); ctx.stroke(); ctx.globalAlpha=1; } ctx.fillStyle=b.c; ctx.save(); ctx.shadowColor=b.c; ctx.shadowBlur=8*GLOW; rr(ctx,b.x,b.y,b.w,b.h,b.h/2); ctx.fill(); ctx.restore(); }
  for(const e of ebullets){
    if(e.wave){ ctx.fillStyle='rgba(255,107,107,.85)'; ctx.beginPath(); ctx.moveTo(e.x,e.y+e.h); ctx.quadraticCurveTo(e.x+e.w/2,e.y-8,e.x+e.w,e.y+e.h); ctx.fill(); }
    else { ctx.fillStyle=e.spark?'#ff9a3d':'#ff6b6b'; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill(); ctx.fillStyle=e.spark?'#fff3c4':'#ffe0e0'; ctx.beginPath(); ctx.arc(e.x,e.y,e.r*.45,0,Math.PI*2); ctx.fill(); }
  }
  for(const q of particles){ ctx.globalAlpha=Math.max(0,q.life/q.max); ctx.fillStyle=q.c; if(q.sh) drawShape(q.sh,q.x,q.y,q.s,q.c); else ctx.fillRect(q.x-q.s/2,q.y-q.s/2,q.s,q.s); }
  ctx.globalAlpha=1;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const t of texts){
    if(t.pop){ const age=1.4-t.life, s=age<.12?0.3+age/.12*1.1:1.4-Math.min(.4,(age-.12)*2.2); ctx.save(); ctx.translate(t.x,t.y-age*18); ctx.scale(s,s); ctx.globalAlpha=Math.min(1,t.life*2);
      ctx.font="400 24px 'Russo One', Unbounded, sans-serif"; ctx.lineJoin='round'; ctx.lineWidth=6; ctx.strokeStyle='#0a0612'; ctx.strokeText(t.t,0,0); ctx.fillStyle=t.c; ctx.fillText(t.t,0,0); ctx.restore(); ctx.globalAlpha=1; continue; }
    ctx.font=t.big?"900 40px Unbounded, 'Arial Black', sans-serif":t.small?"700 12px Unbounded, 'Arial Black', sans-serif":"900 16px Unbounded, 'Arial Black', sans-serif";
    ctx.globalAlpha=Math.min(1,t.life*2); ctx.fillStyle=t.c; ctx.fillText(t.t,t.x,t.y);
  }
  ctx.globalAlpha=1;
  drawDmgNums();
  ctx.setTransform(scale,0,0,scale,sx*scale,sy*scale);
  drawOverlays();
  if(intro&&boss) drawIntro();
  if(outro) drawOutroScreen();
  drawHud();
}
const PORTRAIT={toad:{bg:'#0d2010',a:'#6fae5b',b:'#2c5a22'},eye:{bg:'#1c1004',a:'#ffb347',b:'#5a3410'},gear:{bg:'#1d1405',a:'#e0a84a',b:'#5a4010'},queen:{bg:'#1d0918',a:'#d65a8a',b:'#4a1532'},core:{bg:'#1c0407',a:'#ff4d5e',b:'#4a0c14'}};
function hash(n){ const x=Math.sin(n*127.1)*43758.5453; return x-Math.floor(x); }
function drawPortrait(t){
  const b=boss, C=PORTRAIT[b.type], ease=k=>k<0?0:k>1?1:k*k*(3-2*k), cx=VW*0.34, cy=VH*0.54;
  ctx.save();
  ctx.fillStyle=C.bg; ctx.fillRect(0,0,VW,VH);
  // ---- unique backdrop
  ctx.save(); ctx.translate(cx,cy);
  if(b.type==='toad'){
    ctx.rotate(t*0.25); for(let i=0;i<16;i++){ ctx.fillStyle=i%2?'rgba(111,174,91,.10)':'rgba(111,174,91,.03)'; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,1600,i/16*Math.PI*2,(i+1)/16*Math.PI*2); ctx.fill(); }
  } else if(b.type==='eye'){
    for(let i=0;i<6;i++){ const r=((t*180+i*90)%540); ctx.strokeStyle=`rgba(255,179,71,${.25*(1-r/540)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke(); }
  } else if(b.type==='gear'){
    ctx.rotate(-t*1.6); ctx.strokeStyle='rgba(224,168,74,.12)'; ctx.lineWidth=18; ctx.beginPath(); const n=36;
    for(let i=0;i<=n;i++){ const a=i/n*Math.PI*2, r=i%2?330:380, a2=a+Math.PI/n; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); ctx.lineTo(Math.cos(a2)*r,Math.sin(a2)*r); } ctx.stroke();
  } else if(b.type==='queen'){
    ctx.strokeStyle='rgba(214,90,138,.14)'; ctx.lineWidth=2;
    for(let gy=-8;gy<=8;gy++) for(let gx=-12;gx<=12;gx++){ const x=gx*52+(gy%2?26:0), y=gy*45, pul=.5+.5*Math.sin(t*3-Math.hypot(x,y)/90); ctx.globalAlpha=.4+.6*pul; ctx.beginPath(); for(let k=0;k<6;k++){ const a=Math.PI/6+k*Math.PI/3; ctx.lineTo(x+Math.cos(a)*24,y+Math.sin(a)*24); } ctx.closePath(); ctx.stroke(); }
    ctx.globalAlpha=1;
  } else {
    for(let i=1;i<=7;i++){ ctx.save(); ctx.rotate(t*(i%2?.5:-.7)*(1+i*.1)); ctx.setLineDash([22+i*4,12]); ctx.strokeStyle=`rgba(255,77,94,${.08+.03*Math.sin(t*6+i)})`; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(0,0,i*70,0,Math.PI*2); ctx.stroke(); ctx.restore(); }
    ctx.setLineDash([]);
  }
  ctx.restore();
  // speed lines toward the boss
  ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.lineWidth=2;
  for(let i=0;i<40;i++){ const a=hash(i)*Math.PI*2, r0=260+((t*600+hash(i+9)*900)%900); ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0); ctx.lineTo(cx+Math.cos(a)*(r0+90),cy+Math.sin(a)*(r0+90)); ctx.stroke(); }
  // glow behind boss
  const gg=ctx.createRadialGradient(cx,cy,10,cx,cy,320); gg.addColorStop(0,C.a+'66'); gg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=gg; ctx.fillRect(0,0,VW,VH);
  // eye: welding sparks
  if(b.type==='eye'){ for(let i=0;i<70;i++){ const life=(t*1.4+hash(i))%1, a=-Math.PI/2+(hash(i+3)-.5)*2.2, v=500*hash(i+5)+200; const x=cx+Math.cos(a)*v*life, y=cy+120+Math.sin(a)*v*life+700*life*life; ctx.fillStyle=`rgba(255,${180+60*hash(i)|0},90,${1-life})`; ctx.fillRect(x,y,3,3); } }
  // ---- boss close-up with unique entrance
  const S=Math.min(4.2,300/b.h), f=Object.assign({},b,{x:-b.w/2,y:-b.h/2,t:clock,flash:0,dead:false,state:'idle'});
  let px=cx, py=cy, sx=S, sy=S, rot=0, alpha=1;
  const k=ease((t-0.45)/0.55);
  if(b.type==='toad'){ const fall=Math.min(1,Math.max(0,(t-0.45)/0.45)); py=-300+(cy+300)*fall*fall; if(t>0.9){ const sq=Math.max(0,1-(t-0.9)*4); sx=S*(1+.25*sq); sy=S*(1-.25*sq); } }
  else if(b.type==='eye'){ sy=S*Math.max(0.02,k); }
  else if(b.type==='gear'){ px=VW+300-(VW+300-cx)*k; f.rot=-(1-k)*8+t*0.6; }
  else if(b.type==='queen'){ px=-300+(cx+300)*k; f.face=1; }
  else { sx=sy=S*k; alpha=k; }
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(px,py); ctx.scale(sx,sy); ctx.rotate(rot);
  if(b.type==='core'&&t<1.4&&Math.random()<.35){ ctx.translate((Math.random()-.5)*8,0); }
  const saved=boss; drawBoss(f); boss=saved;
  ctx.restore();
  if(b.type==='toad'&&t>0.9&&t<1.0) shake=Math.max(shake,14);
  // ---- "work on mistakes" stamp for upgraded bosses
  if((b.v||1)>1&&t>1.0){
    const k3=Math.min(1,(t-1.0)/0.18), s3=1+(1-k3)*1.8;
    ctx.save(); ctx.globalAlpha=Math.min(1,k3*1.3); ctx.translate(cx+40,cy-205); ctx.rotate(-0.12); ctx.scale(s3,s3);
    ctx.strokeStyle='#ff4d5e'; ctx.lineWidth=4; rr(ctx,-150,-34,300,68,8); ctx.stroke(); ctx.lineWidth=1.5; rr(ctx,-143,-27,286,54,6); ctx.stroke();
    ctx.fillStyle='#ff4d5e'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font="900 20px Unbounded, 'Arial Black', sans-serif"; ctx.fillText(b.v===3?'МОДЕЛЬ 3.0':'МОДЕЛЬ 2.0',0,-8);
    ctx.font="700 12px Unbounded, 'Arial Black', sans-serif"; ctx.fillText('РАБОТА НАД ОШИБКАМИ',0,14);
    ctx.restore();
    if(k3<1&&t<1.05) shake=Math.max(shake,5);
  }
  // ---- name panel
  if(t>1.25){
    const kk=Math.min(1,(t-1.25)/0.25), sc=1+(1-kk)*1.2, x0=VW*0.62;
    ctx.globalAlpha=Math.min(1,kk*1.5); ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillStyle=C.a; ctx.font="700 14px Unbounded, 'Arial Black', sans-serif"; ctx.fillText(`БОСС ${Math.round(b.tier)} ИЗ 10 · УРОВЕНЬ ${levelIdx+1}`,x0,VH*0.36);
    ctx.save(); ctx.translate(x0,VH*0.48); ctx.scale(sc,sc);
    const words=BOSS_NAMES[b.type].toUpperCase().split('-').join('-\n').split(/[ \n]/);
    ctx.font="900 54px Unbounded, 'Arial Black', sans-serif"; ctx.lineWidth=8; ctx.strokeStyle='#04070f';
    words.forEach((w,i)=>{ ctx.strokeText(w,0,i*60); ctx.fillStyle='#ffffff'; ctx.fillText(w,0,i*60); });
    if((b.v||1)>1){ const lw=ctx.measureText(words[words.length-1]).width, tag=b.v===3?'MK III':'MK II'; ctx.font="900 26px Unbounded, 'Arial Black', sans-serif"; const tw=ctx.measureText(tag).width+18, tx=lw+14, ty=(words.length-1)*60-34; ctx.fillStyle='#ff4d5e'; rr(ctx,tx,ty,tw,40,8); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillText(tag,tx+9,ty+31); }
    ctx.restore();
    const ly=VH*0.48+words.length*60-12;
    ctx.fillStyle=C.a; ctx.fillRect(x0,ly,Math.min(380,(t-1.25)*900),5);
    ctx.fillStyle='#e8effa'; ctx.font="500 18px Rubik, system-ui, sans-serif"; ctx.fillText(bossEpithet(b),x0,ly+34);
    ctx.fillStyle='rgba(232,239,250,.6)'; ctx.font="500 14px Rubik, system-ui, sans-serif"; ctx.fillText(`Здоровье ${b.max} · арена «${ARENAS[b.type].name}»`,x0,ly+60);
    if((b.v||1)>1){ const cl=CHANGELOG[b.type][b.v]; ctx.font="700 12px Unbounded, 'Arial Black', sans-serif"; ctx.fillStyle='#ffd166'; ctx.fillText('ИСПРАВЛЕНО:',x0,ly+90);
      ctx.font="500 14px Rubik, system-ui, sans-serif"; cl.forEach((s,i)=>{ const kk2=Math.max(0,Math.min(1,(t-1.6-i*0.25)/0.2)); ctx.globalAlpha=kk2; ctx.fillStyle='#7fe08a'; ctx.fillText(s,x0+(1-kk2)*20,ly+112+i*20); }); ctx.globalAlpha=1; }
    ctx.globalAlpha=1;
  }
  ctx.restore();
}
function drawBullet(b){
  const cx=b.x+b.w/2, cy=b.y+b.h/2;
  if(b.kind==='wave'){ ctx.save(); ctx.globalAlpha=Math.min(1,b.life*2); ctx.fillStyle='rgba(95,227,217,.75)'; ctx.beginPath(); ctx.moveTo(b.x,b.y+b.h); ctx.quadraticCurveTo(cx,b.y-10,b.x+b.w,b.y+b.h); ctx.fill(); ctx.strokeStyle='#e8ffff'; ctx.lineWidth=2; ctx.stroke(); ctx.restore(); return; }
  if(b.kind==='spark'){
    const wob=Math.sin(b.age*30+b.ph)*3, r=b.boom?8:4.5, fl=1+Math.sin(b.age*60+b.ph)*.18, dir=Math.sign(b.vx)||1;
    ctx.save(); ctx.translate(cx,cy+wob);
    if(settings.trails) for(let i=3;i>=1;i--){ ctx.globalAlpha=.18*(4-i); ctx.fillStyle=i>1?'#ff5a2a':'#ff8a3d'; ctx.beginPath(); ctx.arc(-dir*i*r*1.1,Math.sin(b.age*30+b.ph-i)*2,r*(1-i*.15),0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1; if(GLOW){ ctx.shadowColor='#ff8a3d'; ctx.shadowBlur=14; }
    ctx.fillStyle='#ff8a3d'; ctx.beginPath(); ctx.arc(0,0,r*1.25*fl,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.arc(dir*1,0,r*.85*fl,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fffbe8'; ctx.beginPath(); ctx.arc(dir*1.5,-0.5,r*.42,0,Math.PI*2); ctx.fill();
    ctx.restore();
  } else if(b.kind==='bolt'){
    const R=b.w/2; ctx.save(); ctx.translate(cx,cy);
    if(settings.trails){ ctx.strokeStyle='rgba(199,211,221,.35)'; ctx.lineWidth=2; for(const o of [-R*.5,0,R*.5]){ ctx.beginPath(); ctx.moveTo(-Math.sign(b.vx)*R*1.2,o); ctx.lineTo(-Math.sign(b.vx)*R*2.6,o); ctx.stroke(); } }
    ctx.rotate(b.rot); if(GLOW&&b.pierce){ ctx.shadowColor='#c79bff'; ctx.shadowBlur=14; }
    ctx.fillStyle=b.pierce?'#d9c7ff':'#c7d3dd'; ctx.strokeStyle=b.pierce?'#6a4fb0':'#55636f'; ctx.lineWidth=2;
    ctx.beginPath(); for(let i=0;i<6;i++){ const a=i*Math.PI/3; ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur=0; ctx.fillStyle='#1b2232'; ctx.beginPath(); ctx.arc(0,0,R*.38,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillRect(-R*.6,-R*.75,R*.5,R*.25);
    ctx.restore();
  } else { ctx.fillStyle=b.c; rr(ctx,b.x,b.y,b.w,b.h,b.h/2); ctx.fill(); }
}
let titleLast=0;
let titleFocus=null, titleMix=[0,0], titleMouse=null, titleClick=null;
function titleXY(e){ const r=cv.getBoundingClientRect(); if(!r.width) return null; return {x:(e.clientX-r.left)/r.width*VW,y:(e.clientY-r.top)/r.height*VH}; }
addEventListener('pointermove',e=>{ if(state==='title') titleMouse=titleXY(e); });
addEventListener('pointerdown',e=>{ if(state==='prologue'&&proT>1) proT=Math.max(proT,PRO_LEN); if(state==='ending'&&endT>1.5) endT=Math.max(endT,END_LEN); });
addEventListener('pointerdown',e=>{ if(state==='title'&&!(e.target.closest&&e.target.closest('button'))) titleClick=titleXY(e); });
