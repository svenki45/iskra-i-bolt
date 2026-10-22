/* ================= boss defeat cinematic ================= */
let outro=null;
function startOutro(b){
  const mk=b.v>1, cx=b.x+b.w/2, cy=b.y+b.h/2;
  const cracks=Array.from({length:mk?11:6},()=>{ const pts=[[0,0]]; let a=Math.random()*Math.PI*2, x=0, y=0; for(let k=0;k<6;k++){ a+=(Math.random()-.5)*1.1; x+=Math.cos(a)*b.w*.12; y+=Math.sin(a)*b.h*.12; pts.push([x,y]); } return pts; });
  outro={t:0,mk,dur:mk?6.4:4.4,boomAt:mk?2.9:1.7,cx,cy,cracks,next:0,boomed:false,name:b.name,type:b.type,v:b.v};
  b.deadT=1.5; hitstop=0;
}
function updateOutro(dt){
  const O=outro, b=boss; O.t+=dt;
  if(pressed.has('Enter')||pressed.has('Space')||pressed.has('Escape')){ if(O.t<O.boomAt-0.1) O.t=O.boomAt-0.1; else if(O.t>O.boomAt+1) O.t=O.dur; }
  if(!O.boomed){
    const k=O.t/O.boomAt; b.deadT=1.5;
    O.next-=dt; if(O.next<=0){ O.next=Math.max(.04,(O.mk?.22:.26)*(1-k*.8));
      const ex=b.x+Math.random()*b.w, ey=b.y+Math.random()*b.h; burst(ex,ey,10+(k*14|0),['#ff6b6b','#ffd166','#fff','#e7b54a'],200+k*220,.5);
      rings.push({x:ex,y:ey,r:4,max:30+k*50,life:.3,c:'#ffd166',w:3}); sfx(Math.random()<.5?'crack':'hit'); shake=Math.max(shake,3+k*(O.mk?12:7)); }
    if(O.mk&&Math.random()<.4) addP({x:b.x+Math.random()*b.w,y:b.y+Math.random()*b.h*.6,vx:(Math.random()-.5)*40,vy:-60-Math.random()*60,life:1.2,max:1.2,c:'rgba(60,60,70,.7)',s:8+Math.random()*8,g:-.05});
    if(O.t>=O.boomAt){ O.boomed=true; const cx=b.x+b.w/2, cy=b.y+b.h/2;
      flash('#ffffff',O.mk?1:.8); shake=O.mk?30:20; sfx('boss'); if(O.mk) setTimeout(()=>sfx('boss'),180);
      for(let r=0;r<(O.mk?4:2);r++) rings.push({x:cx,y:cy,r:10,max:(O.mk?520:340)+r*120,life:.8+r*.15,c:r%2?'#ffffff':(O.mk?'#ff4d5e':'#ffd166'),w:O.mk?10:7});
      burst(cx,cy,O.mk?140:80,['#ff6b6b','#ffd166','#ffffff','#e7b54a','#62c7c1'],O.mk?780:560,1.4);
      if(O.mk){ const cols=['#5a6b7d','#8a9aac','#c2553f','#e7b54a','#3a4656']; for(let i=0;i<46;i++){ const a=Math.random()*Math.PI*2, v=300+Math.random()*700; particles.push({x:cx+(Math.random()-.5)*b.w*.6,y:cy+(Math.random()-.5)*b.h*.6,vx:Math.cos(a)*v,vy:Math.sin(a)*v-300,life:2.4,max:2.4,c:cols[i%cols.length],s:6+Math.random()*12,g:1.1}); } }
      hitstop=O.mk?.25:.12; b.deadT=0; b.gone=true; }
  } else if(O.mk&&Math.random()<.35) addP({x:Math.random()*VW,y:-10,vx:(Math.random()-.5)*30,vy:60+Math.random()*80,life:3,max:3,c:Math.random()<.5?'#ff8a3d':'#ffd166',s:2.5,g:.02});
  if(O.t>=O.dur){ outro=null; b.deadT=0; }
}
function drawOutroWorld(){
  const O=outro, b=boss; if(!O||O.boomed) return;
  const k=Math.min(1,O.t/O.boomAt), cx=b.x+b.w/2, cy=b.y+b.h/2;
  ctx.save(); ctx.translate(cx,cy); ctx.lineCap='round';
  for(const c of O.cracks){ const n=Math.max(1,Math.floor(c.length*k)); ctx.strokeStyle=O.mk?'#fff2b0':'#ffe3a0'; ctx.shadowColor=O.mk?'#ff4d5e':'#ffd166'; ctx.shadowBlur=12*GLOW; ctx.lineWidth=2.5+k*2; ctx.beginPath(); c.slice(0,n).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke(); }
  ctx.restore();
  const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(b.w,b.h)*(.6+k)); g.addColorStop(0,`rgba(255,240,200,${.15+.5*k*k})`); g.addColorStop(1,'rgba(255,200,120,0)'); ctx.fillStyle=g; ctx.fillRect(cx-400,cy-400,800,800);
}
function drawOutroScreen(){
  const O=outro; if(!O) return;
  if(O.mk&&!O.boomed){ const a=(Math.sin(O.t*14)*.5+.5)*.18*Math.min(1,O.t/O.boomAt); ctx.fillStyle=`rgba(255,40,60,${a})`; ctx.fillRect(0,0,VW,VH); }
  const bars=Math.min(1,O.t/0.5)*(O.t>O.dur-.5?Math.max(0,(O.dur-O.t)/.5):1)*VH*.09; ctx.fillStyle='#000'; ctx.fillRect(0,0,VW,bars); ctx.fillRect(0,VH-bars,VW,bars);
  if(!O.boomed) return;
  const t=O.t-O.boomAt, a=Math.min(1,t/.35)*(O.t>O.dur-.6?Math.max(0,(O.dur-O.t)/.6):1);
  ctx.save(); ctx.globalAlpha=a; ctx.textAlign='center'; ctx.textBaseline='middle';
  const s=1+Math.max(0,.6-t)*1.2; ctx.translate(VW/2,VH*.42); ctx.scale(s,s);
  const word=O.mk?'УНИЧТОЖЕН':'ПОВЕРЖЕН';
  ctx.font="900 92px Unbounded, 'Arial Black', sans-serif";
  if(O.mk){ for(const [dx,c] of [[-4,'rgba(255,40,80,.8)'],[4,'rgba(60,220,255,.7)']]){ ctx.fillStyle=c; ctx.fillText(word,dx+(Math.random()<.15?(Math.random()-.5)*14:0),0); } }
  ctx.lineWidth=10; ctx.strokeStyle='#04070f'; ctx.strokeText(word,0,0); ctx.fillStyle=O.mk?'#ff4d5e':'#ffd166'; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=30*GLOW; ctx.fillText(word,0,0); ctx.shadowBlur=0;
  ctx.font="700 26px Unbounded, 'Arial Black', sans-serif"; ctx.fillStyle='#eaf2ff'; ctx.fillText(O.name.toUpperCase(),0,70);
  const w=ctx.measureText(O.name.toUpperCase()).width; const cut=Math.min(1,Math.max(0,(t-.5)/.4)); ctx.strokeStyle=O.mk?'#ff4d5e':'#ffd166'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-w/2-10,70); ctx.lineTo(-w/2-10+(w+20)*cut,70); ctx.stroke();
  ctx.font="500 17px Rubik, system-ui, sans-serif"; ctx.fillStyle='rgba(220,230,255,.85)';
  ctx.fillText(O.mk?'Работа над ошибками не помогла. Эта версия больше не вернётся.':'Механизм сломан. Путь к выходу открыт!',0,112);
  ctx.restore();
  if(t>1.2){ ctx.globalAlpha=Math.min(1,(t-1.2)*2)*.7; ctx.font="500 13px Rubik, system-ui, sans-serif"; ctx.fillStyle='#cfd8e6'; ctx.textAlign='center'; ctx.fillText('Enter — пропустить',VW/2,VH-VH*.09-14); ctx.globalAlpha=1; }
}
function hitBoss(d,src){
  if(boss&&boss.lag==null) boss.lag=boss.hp;
  const b=boss; if(!b||b.dead) return;
  const crit=Math.random()<0.12+0.1*U('crit'); if(crit){ d*=2; sfx('crit'); shake=Math.max(shake,4); }
  d=Math.max(1,Math.round(d*(b.dmgMul||1))); if(cheatOne) d=Math.max(d,Math.ceil(b.hp)); b.hp-=d; b.lagHold=0.45; b.flash=.08; sfx('hit'); dmgNum(b.x+b.w/2+(Math.random()-.5)*b.w*.7,b.y+b.h*.3,d,src||'spark',crit);
  if(b.hp<=0){
    b.hp=0; b.dead=true; b.deadT=1.5; exitLocked=false; sfx('boss'); shake=18; flash('#ffffff',.7);
    burst(b.x+b.w/2,b.y+b.h/2,60,['#ff6b6b','#e7b54a','#ffffff','#62c7c1'],500,1.1);
    for(const en of enemies) en.hp=0; enemies=[]; ebullets=[];
    gears+=10*b.tier; $('gears').textContent=gears;
    startOutro(b);
    for(const p of players) if(p.down){ p.down=false; p.hp=1; p.inv=1.5; }
    unlock('boss1'); if(!levelDowned) unlock('clean');
    if(!stats.bosses.includes(b.type)) stats.bosses.push(b.type); saveStats(); checkStatAch();
  }
}

