/* ================= loop ================= */
function introStinger(type,phase){
  if(!actx) return;
  if(phase==='in'){
    if(type==='toad'){ tone(90,40,.9,'square',.08); tone(140,60,.5,'sawtooth',.05,.15); }
    else if(type==='eye'){ tone(1800,300,.6,'sawtooth',.04); tone(2400,900,.35,'square',.025,.1); tone(60,40,1,'sine',.1); }
    else if(type==='gear'){ for(let i=0;i<8;i++) tone(1400-i*90,900-i*60,.04,'square',.035,i*0.07); tone(70,45,1,'sawtooth',.07,.55); }
    else if(type==='queen'){ for(let i=0;i<10;i++) tone(330+(i%2)*25,330+(i%2)*25,.06,'sawtooth',.03,i*0.05); tone(196,196,.5,'square',.04,.55); tone(294,294,.5,'square',.04,.55); }
    else { tone(220,880,1.2,'sawtooth',.05); tone(880,220,1.2,'sawtooth',.05,1.2*0); tone(50,35,1.6,'sine',.12); }
  } else {
    tone(110,55,1.6,'sawtooth',.07); tone(165,82,1.6,'square',.04); tone(220,110,1.2,'triangle',.05,.05);
  }
}
function updateIntro(dt){
  const I=intro, b=boss, P=INTRO_P; I.t+=dt;
  const s=readInput(0), q=readInput(1);
  if((s.jp||q.jp||pressed.has('Enter')||pressed.has('Space'))&&I.t>0.3){ if(I.t<P-0.25) I.t=P-0.25; else if(I.t<I.dur-0.6) I.t=I.dur-0.6; }
  if(!I.rum&&I.t>0.05&&I.t<P){ I.rum=true; tone(55,38,1.4,'sawtooth',.05); }
  if(!I.sting&&I.t>=0.45&&I.t<P){ I.sting=true; introStinger(b.type,'in'); }
  if(!I.named&&I.t>=1.25&&I.t<P){ I.named=true; introStinger(b.type,'name'); shake=Math.max(shake,7); }
  if(!I.wipe&&I.t>=P-0.12){ I.wipe=true; flash('#ffffff',.8); tone(1200,200,.25,'sawtooth',.04); }
  const hover=b.type==='eye'||b.type==='core', top=hover?-b.h-20:-b.h-40;
  const fallStart=P+0.25, fallEnd=P+(hover?1.0:0.7);
  if(I.t<fallStart) b.y=top;
  else if(I.t<fallEnd){ const k=(I.t-fallStart)/(fallEnd-fallStart); const e=hover?1-Math.pow(1-k,3):k*k; b.y=top+(I.y0-top)*e; }
  else b.y=I.y0;
  if(!I.landed&&I.t>=fallEnd){ I.landed=true; shake=Math.max(shake,hover?8:18); sfx('slam'); tone(70,35,.7,'sawtooth',.09); flash('#ffffff',.25);
    burst(b.x+b.w/2,b.y+b.h,40,['#9cc3ff','#ff6b6b','#e7b54a'],420,.9); for(let i=0;i<20;i++){ const d=i<10?-1:1; addP({x:b.x+b.w/2,y:FLOOR_Y,vx:d*(200+Math.random()*400),vy:-Math.random()*200,life:.7,max:.7,c:'#cfe2ff',s:4,g:1}); } }
  if(!I.go&&I.t>=I.dur-0.55){ I.go=true; tone(440,880,.18,'square',.06); tone(660,1320,.25,'square',.05,.08); }
  if(I.t>=I.dur){ intro=null; }
}
function moverPowered(m){ if(!m.key) return true; const on=plates.some(p=>p.key===m.key&&p.on); return on||(solo&&m.timer>0); }
function updateMovers(h){
  for(const m of movers){
    if(m.key){ if(plates.some(p=>p.key===m.key&&p.on)) m.timer=curTimer; else m.timer=Math.max(0,m.timer-h); }
    const ox=m.x, oy=m.y, len=Math.hypot(m.bx-m.ax,m.by-m.ay)||1;
    if(m.hold>0) m.hold-=h;
    else if(moverPowered(m)){ m.u+=m.dir*m.sp*h/len; if(m.u>=1){ m.u=1; m.dir=-1; m.hold=m.pause; } else if(m.u<=0){ m.u=0; m.dir=1; m.hold=m.pause; } }
    const e=m.u<0.5?2*m.u*m.u:1-Math.pow(-2*m.u+2,2)/2, ee=m.u*.6+e*.4;
    m.x=m.ax+(m.bx-m.ax)*ee; m.y=m.ay+(m.by-m.ay)*ee; m.dx=m.x-ox; m.dy=m.y-oy;
    if(m.dx||m.dy) for(const o of players.concat(crates)){ if(o.ground!==m||o.absent) continue; if(m.dx) moveX(o,m.dx); if(m.dy<0) moveY(o,m.dy); else if(m.dy>0) o.y+=m.dy; }
  }
}
const mechD=()=>Math.max(-1,Math.min(2,diffLv()));
function tileUnder(p){ const ty=Math.floor((p.y+p.h+2)/T), tx=Math.floor((p.x+p.w/2)/T); return grid[ty]&&grid[ty][tx]; }
function updateMech(dt){
  for(const p of players){ if(p.absent||p.dead) continue;
    // wind
    for(const w of winds){ if(p.x+p.w>w.x&&p.x<w.x+w.w&&p.y+p.h>w.y&&p.y<w.y+w.h){ { const D=mechD(), gust=D>=2?.35+.65*Math.max(0,Math.sin(levelTime*1.7+w.x)):1; p.vy=approach(p.vy,[-680,-560,-500,-560][D+1]*gust,[6400,5600,4200,5600][D+1]*gust*dt); } p.onGround=false; p.wasGround=false; p.coyote=0; if(Math.random()<.3) addP({x:p.x+Math.random()*p.w,y:p.y+p.h,vx:0,vy:200,life:.3,max:.3,c:'#cfe8ff',s:2,g:0}); if(!p.windT){ p.windT=1; unlock('wind'); } } }
    // crumble
    if(p.onGround&&!p.ground){ const ty=Math.floor((p.y+p.h+2)/T); for(let tx=Math.floor(p.x/T);tx<=Math.floor((p.x+p.w-0.01)/T);tx++){ if(grid[ty]&&grid[ty][tx]==='K'&&!crumb[tx+','+ty]){ crumb[tx+','+ty]={tx,ty,t:[.8,.42,.32,.25][mechD()+1],ph:0}; sfx('crack'); } } }
    // portals
    const cx=Math.floor((p.x+p.w/2)/T), cy=Math.floor((p.y+p.h-6)/T), c=grid[cy]&&grid[cy][cx];
    if(c==='O'||c==='o'){ if(!p.portLock){ const P=portals.find(q=>q.x===cx&&q.y===cy); if(P&&P.to){ burst(p.x+p.w/2,p.y+p.h/2,18,['#c79bff','#5fe3d9'],260,.45); p.x=P.to.x*T+T/2-p.w/2; p.y=(P.to.y+1)*T-p.h; p.ground=null; p.portLock=true; sfx('boost'); flash('#c79bff',.15); burst(p.x+p.w/2,p.y+p.h/2,18,['#c79bff','#5fe3d9'],260,.45); unlock('portal'); } } }
    else p.portLock=false;
  }
  for(const k in crumb){ const q=crumb[k]; q.t-=dt; if(q.t>0) continue;
    if(q.ph===0){ grid[q.ty][q.tx]='~'; gridVer++; q.ph=1; q.t=[2,3,4,5][mechD()+1]; burst(q.tx*T+T/2,q.ty*T+T/2,10,['#a0703c','#5a3a1c'],180,.5); for(const p of players) if(p.ground==null&&p.onGround&&Math.floor((p.y+p.h+2)/T)===q.ty) p.onGround=false; }
    else { const r={x:q.tx*T,y:q.ty*T,w:T,h:T}; if(players.some(p=>!p.absent&&overlap(p,r))||crates.some(c=>overlap(c,r))){ q.t=.3; continue; } grid[q.ty][q.tx]='K'; gridVer++; delete crumb[k]; } }
}
function updatePz(dt){
  const live=players.filter(p=>!p.absent&&!p.dead);
  for(const z of pzList){
    if(z.type==='order'&&!z.done){ for(const ch of 'abc'){ const [x,y]=z.cells[ch][0], r={x:x*T+4,y:y*T+T-12,w:T-8,h:12}; const on=live.some(p=>overlap(p,r))||crates.some(c=>overlap(c,r));
        if(on&&!z.press[ch]){ if(z.lit[ch]){} else if(z.order[z.prog]===ch){ z.lit[ch]=true; z.prog++; sfx('on'); burst(x*T+T/2,y*T+T-6,10,'#ffd166',160,.4);
            if(z.prog===3){ z.done=true; for(const [gx,gy] of z.cells.gate){ grid[gy][gx]='.'; burst(gx*T+T/2,gy*T+T/2,10,['#cfd8e6','#ffd166'],200,.5); } gridVer++; sfx('boost'); texts.push({x:x*T,y:y*T-40,t:'ОТКРЫТО!',life:1.4,c:'#7fe08a',pop:true}); unlock('order'); } }
          else { z.prog=0; z.lit={}; sfx('hurt'); shake=Math.max(shake,4); texts.push({x:x*T+T/2,y:y*T-30,t:'НЕ ТОТ ПОРЯДОК',life:1.2,c:'#ff6b6b'}); } }
        z.press[ch]=on; } }
    if(z.type==='trap'&&!z.done&&live.length&&live.every(p=>p.x>z.trigX)){ z.done=true; for(const [x,y] of z.cells.back) grid[y][x]='G'; gridVer++; shake=Math.max(shake,8); sfx('crack'); flash('#ff3b4e',.2);
      texts.push({x:z.trigX,y:VH*.35,t:'ЛОВУШКА!',life:1.6,c:'#ff6b6b',pop:true}); }
  }
  for(const p of live){ const x0=Math.floor((p.x-3)/T), x1=Math.floor((p.x+p.w+3)/T), y0=Math.floor((p.y-3)/T), y1=Math.floor((p.y+p.h+2)/T); let lv=false;
    for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++){ const c=grid[ty]&&grid[ty][tx];
      if(c==='k'&&overlap(p,{x:tx*T+6,y:ty*T+6,w:T-12,h:T-12})){ grid[ty][tx]='.'; gridVer++; p.keys=(p.keys||0)+1; sfx('gear'); texts.push({x:tx*T+T/2,y:ty*T-10,t:'КЛЮЧ!',life:1,c:'#ffd166',pop:true}); }
      else if(c==='h'&&overlap(p,{x:tx*T+8,y:ty*T,w:T-16,h:T})) lv=true;
      else if(c==='X'&&(p.keys||0)>0){ const st=[[tx,ty]]; while(st.length){ const [x,y]=st.pop(); if(!grid[y]||grid[y][x]!=='X') continue; grid[y][x]='.'; burst(x*T+T/2,y*T+T/2,8,['#e7b54a','#fff3c4'],180,.4); st.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]); }
        gridVer++; p.keys--; sfx('boost'); texts.push({x:tx*T+T/2,y:ty*T-20,t:'ОТКРЫТО!',life:1.2,c:'#ffd166',pop:true}); unlock('key'); } }
    if(lv&&!p.lvTouch) toggleLever(); p.lvTouch=lv; }
}
function toggleLever(){ const nx=!leverOn, ch=nx?']':'[';
  const blocked=players.concat(crates).some(e=>!e.absent&&!e.dead&&(()=>{ for(let ty=Math.floor(e.y/T);ty<=Math.floor((e.y+e.h-.01)/T);ty++) for(let tx=Math.floor(e.x/T);tx<=Math.floor((e.x+e.w-.01)/T);tx++) if(grid[ty]&&grid[ty][tx]===ch) return true; return false; })());
  if(blocked){ sfx('hurt'); return; } leverOn=nx; gridVer++; sfx('on'); flash(nx?'#6aa8ff':'#ff6b6b',.12); }
function drawPz(){
  const TM=tilesOf(), r3a=R3D.active(), t=clock, each=(ch,f)=>{ const a=TM[ch]; if(a) for(let i=0;i<a.length;i+=2){ const x=a[i], y=a[i+1]; if(grid[y][x]===ch) f(x*T,y*T,x,y); } };
  const PC={a:'#ff6b6b',b:'#7fe08a',c:'#6aa8ff'};
  for(const z of pzList) if(z.type==='order'){ for(const ch of 'abc'){ const [x,y]=z.cells[ch][0], X=x*T, Y=y*T, on=z.lit[ch]||z.done; ctx.fillStyle=PC[ch]; ctx.globalAlpha=on?1:.75; ctx.fillRect(X+4,Y+T-(on?5:9),T-8,on?5:9); ctx.globalAlpha=1; if(on&&GLOW){ ctx.globalAlpha=.25; ctx.beginPath(); ctx.arc(X+T/2,Y+T-4,18,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; } }
    if(!z.done){ const [gx,gy]=z.cells.gate[0], X=gx*T-44, Y=gy*T-80; ctx.fillStyle='rgba(10,16,30,.92)'; ctx.strokeStyle='#cfd8e6'; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect?ctx.roundRect(X,Y,88,30,6):ctx.rect(X,Y,88,30); ctx.fill(); ctx.stroke();
      [...z.order].forEach((ch,i)=>{ ctx.fillStyle=PC[ch]; ctx.beginPath(); ctx.arc(X+18+i*26,Y+15,8,0,Math.PI*2); ctx.fill(); if(i<2){ ctx.fillStyle='#cfd8e6'; ctx.fillRect(X+28+i*26,Y+14,6,2); } }); } }
  if(!r3a){ each('G',(X,Y)=>{ ctx.fillStyle='#2a3445'; ctx.fillRect(X,Y,T,T); ctx.strokeStyle='#8fa3b8'; ctx.lineWidth=3; for(let i=1;i<4;i++){ ctx.beginPath(); ctx.moveTo(X+i*T/4,Y); ctx.lineTo(X+i*T/4,Y+T); ctx.stroke(); } });
    each('X',(X,Y)=>{ ctx.fillStyle='#8a6420'; ctx.fillRect(X+1,Y+1,T-2,T-2); ctx.strokeStyle='#ffd166'; ctx.lineWidth=2; ctx.strokeRect(X+2,Y+2,T-4,T-4); ctx.fillStyle='#2a1a04'; ctx.beginPath(); ctx.arc(X+T/2,Y+T/2-3,4,0,Math.PI*2); ctx.fill(); ctx.fillRect(X+T/2-2,Y+T/2,4,8); }); }
  else each('X',(X,Y)=>{ ctx.fillStyle='#2a1a04'; ctx.beginPath(); ctx.arc(X+T/2,Y+T/2-3,4,0,Math.PI*2); ctx.fill(); ctx.fillRect(X+T/2-2,Y+T/2,4,8); });
  each('D',(X,Y)=>{ ctx.fillStyle='#232a3a'; ctx.fillRect(X,Y,T,T); ctx.strokeStyle='#ffd166'; ctx.lineWidth=2; ctx.strokeRect(X+2,Y+2,T-4,T-4); ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.arc(X+T/2,Y+T/2-3,7,0,7); ctx.fill(); ctx.fillRect(X+T/2-3,Y+T/2+3,6,5);
    if(lamps.length){ ctx.fillStyle='#fff3c4'; ctx.font="700 10px Rubik,sans-serif"; ctx.textAlign='center'; ctx.fillText(lamps.filter(l=>l.lit).length+'/'+lamps.length,X+T/2,Y+T-4); } });
  each('g',(X,Y)=>{ ctx.strokeStyle='rgba(143,163,184,.35)'; ctx.setLineDash([4,4]); ctx.lineWidth=2; ctx.strokeRect(X+3,Y+1,T-6,T-2); ctx.setLineDash([]); });
  for(const [ch,col,act] of [['[','#ff6b6b',!leverOn],[']','#6aa8ff',leverOn]]) each(ch,(X,Y)=>{ if(act){ ctx.fillStyle=col; ctx.fillRect(X+1,Y+1,T-2,T-2); ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(X+1,Y+1,T-2,5); ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=2; ctx.strokeRect(X+1,Y+1,T-2,T-2); } else { ctx.strokeStyle=col; ctx.globalAlpha=.5; ctx.setLineDash([5,4]); ctx.lineWidth=2; ctx.strokeRect(X+3,Y+3,T-6,T-6); ctx.setLineDash([]); ctx.globalAlpha=1; } });
  each('h',(X,Y)=>{ ctx.fillStyle='#3a4656'; ctx.fillRect(X+10,Y+T-8,T-20,8); ctx.save(); ctx.translate(X+T/2,Y+T-8); ctx.rotate(leverOn?.6:-.6); ctx.strokeStyle='#cfd8e6'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-22); ctx.stroke(); ctx.fillStyle=leverOn?'#6aa8ff':'#ff6b6b'; ctx.beginPath(); ctx.arc(0,-24,6,0,Math.PI*2); ctx.fill(); ctx.restore(); });
  each('k',(X,Y)=>{ const b=Math.sin(t*3+X)*3; ctx.save(); ctx.translate(X+T/2,Y+T/2+b); if(GLOW){ ctx.globalAlpha=.25; ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; } ctx.strokeStyle='#ffd166'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(-6,0,6,0,Math.PI*2); ctx.moveTo(0,0); ctx.lineTo(12,0); ctx.moveTo(8,0); ctx.lineTo(8,6); ctx.moveTo(12,0); ctx.lineTo(12,5); ctx.stroke(); ctx.restore(); });
  for(const p of players) if(!p.absent&&!p.dead&&p.keys>0) for(let i=0;i<p.keys;i++){ ctx.save(); ctx.translate(p.x+p.w/2-8+i*14,p.y-(p.kind==='spark'?34:18)); ctx.strokeStyle='#ffd166'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(-3,0,4,0,Math.PI*2); ctx.moveTo(1,0); ctx.lineTo(9,0); ctx.stroke(); ctx.restore(); }
}
function drawMech(){
  const t=clock;
  for(const w of winds){ ctx.save(); ctx.globalAlpha=mechD()>=2?.06+.16*Math.max(0,Math.sin(levelTime*1.7+w.x)):.16; const g=ctx.createLinearGradient(0,w.y+w.h,0,w.y); g.addColorStop(0,'#cfe8ff'); g.addColorStop(1,'rgba(207,232,255,0)'); ctx.fillStyle=g; ctx.fillRect(w.x,w.y,w.w,w.h); ctx.globalAlpha=.55; ctx.strokeStyle='#e6f3ff'; ctx.lineWidth=2;
    for(let i=0;i<9;i++){ const x=w.x+((i*37)%w.w)+6, y=w.y+w.h-((t*260+i*83)%w.h); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.sin(t*4+i)*4,y-26); ctx.stroke(); }
    ctx.globalAlpha=1; ctx.fillStyle='#3a4656'; ctx.fillRect(w.x+4,w.y+w.h-10,w.w-8,10); ctx.strokeStyle='#8fa3b8'; ctx.lineWidth=2; for(let x=w.x+12;x<w.x+w.w-8;x+=12){ ctx.beginPath(); ctx.moveTo(x,w.y+w.h-9); ctx.lineTo(x,w.y+w.h-1); ctx.stroke(); } ctx.restore(); }
  const TM=tilesOf(), r3a=R3D.active(), SPEC=[]; for(const ch of r3a?['~','O','o']:['I','K','~','O','o']){ const a=TM[ch]; if(a) for(let i=0;i<a.length;i+=2) SPEC.push(a[i],a[i+1]); }
  for(let si=0;si<SPEC.length;si+=2){ const x=SPEC[si], y=SPEC[si+1]; const c=grid[y][x]; if(r3a&&(c==='I'||c==='K')) continue; if(c==='I'){ const X=x*T, Y=y*T; const g=ctx.createLinearGradient(X,Y,X,Y+T); g.addColorStop(0,'#e8fbff'); g.addColorStop(.25,'#9fe4f5'); g.addColorStop(1,'#4aa6c4'); ctx.fillStyle=g; ctx.fillRect(X,Y,T,T); ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(X+6+((t*30+x*13)%24),Y+4); ctx.lineTo(X+12+((t*30+x*13)%24),Y+4); ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(X+8,Y+14); ctx.lineTo(X+20,Y+26); ctx.stroke(); }
    else if(c==='K'||c==='~'){ const q=crumb[x+','+y], X=x*T+(q&&q.ph===0?(Math.random()-.5)*4:0), Y=y*T;
      if(c==='~'){ ctx.save(); ctx.globalAlpha=.25+(q?Math.max(0,.5-q.t*.15):0); ctx.setLineDash([4,4]); ctx.strokeStyle='#c69a62'; ctx.lineWidth=1.5; ctx.strokeRect(X+2,Y+4,T-4,T-16); ctx.restore(); }
      else { ctx.fillStyle='#8a5a2e'; ctx.fillRect(X+1,Y+2,T-2,T-14); ctx.fillStyle='#b07a42'; ctx.fillRect(X+1,Y+2,T-2,5); ctx.strokeStyle='#4a2c12'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(X+12,Y+3); ctx.lineTo(X+17,Y+14); ctx.lineTo(X+13,Y+24); ctx.moveTo(X+28,Y+6); ctx.lineTo(X+24,Y+18); ctx.stroke(); } }
    else if(c==='O'||c==='o'){ const X=x*T+T/2, Y=y*T+T/2-8, col=c==='O'?'#c79bff':'#5fe3d9'; ctx.save(); ctx.translate(X,Y); ctx.shadowColor=col; ctx.shadowBlur=18; ctx.strokeStyle=col; ctx.lineWidth=4; ctx.beginPath(); ctx.ellipse(0,0,15,30,0,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0;
      for(let i=0;i<3;i++){ ctx.globalAlpha=.5-i*.13; ctx.rotate(t*2*(c==='O'?1:-1)); ctx.beginPath(); ctx.ellipse(0,0,10-i*3,24-i*7,0,0,Math.PI*1.3); ctx.stroke(); } ctx.restore(); } }
}
function step(dt){
  if(intro){ updateIntro(dt); updateBullets(0); return; }
  if(outro){ if(hitstop>0){ hitstop-=dt; return; } updateOutro(dt); return; }
  if(hitstop>0){ hitstop-=dt; return; }
  levelTime+=dt; totalTime+=dt;
  const [s,b]=players;
  if(solo){ const p=players.find(q=>!q.absent); control(p,readInput(players.indexOf(p)),dt); }
  else { control(s,readInput(0),dt); control(b,readInput(1),dt); }
  updateMech(dt); updatePz(dt);
  const N=Math.max(1,Math.ceil(dt*240)), h=dt/N;
  for(let k=0;k<N;k++){
    updateMovers(h);
    for(const c of crates) physics(c,h);
    const riding=!s.absent&&!b.absent&&!s.down&&s.onGround&&s.ground===b, bx=b.x, by=b.y;
    if(!b.absent) physics(b,h);
    if(riding){ moveX(s,b.x-bx); if(b.y<by) moveY(s,b.y-by); }
    if(!s.absent) physics(s,h);
  }
  if(NET.role==='host'&&NET.rpos&&b&&!b.absent&&!b.down){ const r=NET.rpos;
    if(Math.hypot(r[0]-b.x,r[1]-b.y)<260){ b.x=r[0]; b.y=r[1]; b.vx=r[2]; b.vy=r[3]; b.face=r[4]; } }
  for(const p of players) p.wasGround=p.onGround;
  updateLamps(dt); updateEnemies(dt); updateBoss(dt); updateArena(dt); updateBullets(dt); updatePickups(dt);
  if(state==='play') updateWorld(dt);
}
function tick(dt){
  clock+=dt;
  for(const p of players||[]){ p.sx+=(1-p.sx)*Math.min(1,dt*12); p.sy+=(1-p.sy)*Math.min(1,dt*12); p.blinkT-=dt; if(p.blinkT<-0.12) p.blinkT=2+Math.random()*3; }
  for(const q of particles){ q.life-=dt; q.vy+=G*q.g*dt; q.x+=q.vx*dt; q.y+=q.vy*dt; }
  particles=particles.filter(q=>q.life>0);
  if(particles.length>900) particles.splice(0,particles.length-900);
  for(const t of texts){ t.life-=dt; if(!t.big) t.y-=40*dt; } texts=texts.filter(t=>t.life>0);
  for(const r of rings){ r.life-=dt; r.r+=(r.max-r.r)*Math.min(1,dt*12); } rings=rings.filter(r=>r.life>0);
  for(const p of players||[]){ if(p.pwPop) for(const k in p.pwPop) p.pwPop[k]=Math.max(0,p.pwPop[k]-dt*3); p.aura=Math.max(0,(p.aura||0)-dt*2);
    const act=['power','rapid','triple'].find(k=>p.pw[k]>0); if(act&&!p.down&&!p.dead&&state==='play'&&Math.random()<dt*14){ const a=Math.random()*Math.PI*2; addP({x:p.x+p.w/2+Math.cos(a)*p.w*.8,y:p.y+p.h/2+Math.sin(a)*p.h*.6,vx:0,vy:-40,life:.4,max:.4,c:PICK_INFO[act].c,s:2.5,g:0}); } }
  for(const n of dmgNums){ n.age+=dt; n.x+=n.vx*dt; n.y+=n.vy*dt; n.vy+=520*dt; n.vx*=0.98; n.pop=Math.max(0,n.pop-dt*5); }
  dmgNums=dmgNums.filter(n=>n.age<n.life);
  if(boss&&boss.lag!=null){ if(boss.lag>boss.hp){ boss.lagHold=(boss.lagHold||0)-dt; if(boss.lagHold<=0) boss.lag=Math.max(boss.hp,boss.lag-boss.max*0.6*dt); } }
  shake=Math.max(0,shake-dt*30); flashA=Math.max(0,flashA-dt*2.2); titleT=Math.max(0,titleT-dt);
  for(const m of motes){ m.y-=m.v*dt; m.x+=Math.sin(clock*.6+m.ph)*6*dt; if(m.y<0){ m.y=VH; m.x=Math.random()*WW; } }
}
let last=performance.now(), hudT=0, padCheckT=0;
function frame(now){
  if(now-last<15.5&&last){ requestAnimationFrame(frame); return; }
  const dt=Math.min(0.05,Math.max(0,(now-last)/1000)); last=now;
  pollPadNav(dt);
  handleMeta();
  if(state==='play'){ if(NET.role==='guest'){ const gi=netGuestInput(); const me=NET.me;
      if(me&&!me.down&&!me.dead&&!intro&&!outro){ control(me,gi,dt); const N=Math.max(1,Math.ceil(dt*240)), h=dt/N; for(let k=0;k<N;k++){ updateMovers(0); physics(me,h); } me.wasGround=me.onGround; me.tx=me.x; me.ty=me.y; }
      netSmooth(dt); for(const p of players||[]) if(p.inv>0) p.inv-=dt; } else step(dt); }
  else if(state==='dying'){ runClean=false; deathTimer-=dt; if(deathTimer<=0){ setState('gameover'); tone(98,49,1.8,'sawtooth',.07); tone(147,73,1.8,'triangle',.06); tone(65,40,2.2,'sine',.12); } }
  else if(state==='gameover'&&go){
    go.t-=dt; const el=document.getElementById('goNum'), ring=document.getElementById('goRing');
    if(el){ const n=Math.max(0,Math.ceil(go.t)); if(el.textContent!==String(n)){ el.textContent=n; if(n<=3&&n>0) tone(880,880,.06,'square',.03); } }
    if(ring) ring.style.strokeDashoffset=String(188.5*(1-Math.max(0,go.t)/10));
    if(go&&go.t<=0){ go=null; loadLevel(levelIdx); setState('menu'); }
  }
  demoTick(dt);
  tick(dt); netSend(dt);
  hudT-=dt; if(hudT<=0){ hudT=.25; $('time').textContent=fmt(totalTime); }
  draw();
  if(state==='custom'||state==='hero'||state==='pause'||state==='story') drawPreviews();
  if(state==='controls') pollPadCapture();
  updateMusic();
  padCheckT-=dt; if(padCheckT<=0){ padCheckT=1; renderLegend(); }
  pressed.clear();
  requestAnimationFrame(frame);
}

