/* ================= enemies ================= */
const DMG_STYLE={spark:{c:'#ffb347',s:24},bolt:{c:'#5fe3d9',s:27},power:{c:'#c79bff',s:31},stomp:{c:'#ff6b81',s:32},slam:{c:'#ff4d5e',s:38}};
let dmgNums=[];
function dmgNum(x,y,val,src,crit,small){
  const st=DMG_STYLE[src]||DMG_STYLE.spark;
  let size=(crit?st.s+14:st.s)*(small?0.72:1);
  // merge rapid hits from the same source into one growing number
  const near=dmgNums.find(n=>n.src===src&&!n.crit&&!crit&&n.small===!!small&&n.age<0.22&&Math.abs(n.x-x)<70);
  if(near){ near.val+=val; near.age=0.05; near.pop=1; return; }
  dmgNums.push({x,y,vx:(Math.random()-.5)*90,vy:-(crit?340:260),val,src,crit,small:!!small,c:crit?'#ff3df2':st.c,size,age:0,life:crit?1.15:0.9,pop:1});
}
function srcOf(b){ return (b.pierce||b.boom)?'power':b.owner; }
let lastHitDir=0;
function damageEnemy(en,d,stomp,src){
  if(en.hp<=0) return;
  if(en.trait==='shield'&&!stomp&&lastHitDir){ const f=Math.sign(en.vx)||1; if(lastHitDir===-f){ lastHitDir=0; sfx('crack'); burst(en.x+en.w/2+f*en.w/2,en.y+en.h/2,6,['#9cc3ff','#fff'],160,.25); texts.push({x:en.x+en.w/2,y:en.y-10,t:'ЩИТ!',life:.6,c:'#9cc3ff'}); return; } }
  lastHitDir=0;
  if(cheatOne) d=Math.max(d,en.hp);
  en.hp-=d; en.flash=.1; sfx('hit'); dmgNum(en.x+en.w/2,en.y-4,d,src||(stomp?'stomp':'spark'),false,true);
  if(en.hp<=0){
    addScore(stomp?40:25,en.x+en.w/2,en.y-18); stats.kills++; if(stomp) stats.stomps++; checkStatAch(); if(stats.kills%10===0) saveStats();
    if(levelTime-comboT<2.5) combo++; else combo=1; comboT=levelTime; hitstop=Math.max(hitstop,combo>=3?.06:.03); shake=Math.max(shake,2+Math.min(6,combo));
    if(combo>=2){ addScore(20*combo); texts.push({x:en.x+en.w/2,y:en.y-34,t:'КОМБО ×'+combo,life:1,c:combo>=5?'#ff5fa2':combo>=3?'#ffd166':'#7fe08a',pop:true}); if(combo>=5) unlock('combo5'); }
    sfx('kill'); burst(en.x+en.w/2,en.y+en.h/2,16,['#ff6b6b','#e7b54a','#ffffff'],280,.6);
    if(en.trait==='split'&&!en.mini){ for(const dir of [-1,1]){ const m=Object.assign({},en,{mini:true,trait:null,hp:1,w:Math.round(en.w*.6),h:Math.round(en.h*.6),flash:0,charge:0,scd:2+Math.random()*2});
        m.x=en.x+en.w/2-m.w/2+dir*6; m.y=en.y+en.h-m.h-(en.type==='flyer'?0:2); if(m.type==='crawler'){ m.vx=dir*Math.abs(en.vx||80)*1.5; m.vy=-320; } else { m.dir=dir; m.sp=(en.sp||70)*1.5; m.by=en.y; }
        enemies.push(m); } texts.push({x:en.x+en.w/2,y:en.y-14,t:'ДЕЛИТСЯ!',life:.8,c:'#7fe08a'}); }
    if(en.trait==='bomb'){ const cx=en.x+en.w/2, cy=en.y+en.h/2; ring(cx,cy,8,200,Math.random()); rings.push({x:cx,y:cy,r:6,max:70,life:.35,c:'#ff8a3d',w:5}); shake=Math.max(shake,5); }
    if(Math.random()<.5) pickups.push({type:'gear',x:Math.floor((en.x+en.w/2)/T)*T,y:Math.min(16,Math.floor((en.y+en.h/2)/T))*T,t:0});
  }
}
function nearestPlayer(x,y){
  let best=null,bd=1e9;
  for(const p of players){ if(p.down||p.absent) continue; const d=Math.hypot(p.x+p.w/2-x,p.y+p.h/2-y); if(d<bd){bd=d;best=p;} }
  return best?{p:best,d:bd}:null;
}
function aimShot(x,y,speed,spread=0,count=1){
  const n=nearestPlayer(x,y); if(!n) return;
  const a0=Math.atan2(n.p.y+n.p.h/2-y,n.p.x+n.p.w/2-x);
  for(let i=0;i<count;i++){ const a=a0+(count>1?(i-(count-1)/2)*spread:0); ebullets.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:6,life:5,g:0}); }
}
function ring(x,y,n,speed,off=0){ for(let i=0;i<n;i++){ const a=off+i/n*Math.PI*2; ebullets.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:6,life:5,g:0}); } }
function updateEnemies(dt){
  const f=1+curTier*0.06;
  for(const en of enemies){
    en.flash=Math.max(0,en.flash-dt); en.t=(en.t||0)+dt;
    if((en.type==='crawler'||en.type==='flyer')&&!(boss&&!boss.dead)&&state==='play'){
      if(en.scd==null) en.scd=1.5+Math.random()*2.5;
      if(en.charge>0){ en.charge-=dt; if(en.charge<=0){ const ex=en.x+en.w/2, ey=en.y+(en.big?en.h*.3:en.h*.45);
          aimShot(ex,ey,(en.type==='flyer'?210:190)+curTier*8,0.22,en.big?2:1); sfx('hit'); burst(ex,ey,5,'#ff6b6b',120,.25); } }
      else { en.scd-=dt; if(en.scd<=0){ const n=nearestPlayer(en.x+en.w/2,en.y+en.h/2); en.scd=Math.max(1.6,3.4-curTier*0.12)+Math.random()*1.4; if(n&&n.d<430) en.charge=0.45; } }
    }
    if(en.type==='crawler'){
      if(en.trait==='jumper'&&en.grounded){ en.jt=(en.jt==null?1+Math.random()*2:en.jt-dt); if(en.jt<=0){ en.vy=-560; en.grounded=false; en.jt=1.4+Math.random()*1.6; } }
      en.vy=Math.min(en.vy+G*dt,900);
      const nx=en.x+en.vx*dt;
      if(tileHit(nx,en.y,en.w,en.h-2)||nx<en.min||nx+en.w>en.max) en.vx*=-1;
      else { const fx=en.vx>0?nx+en.w+1:nx-1; if(en.grounded&&!solidPx(fx,en.y+en.h+4)) en.vx*=-1; else en.x=nx; }
      const ny=en.y+en.vy*dt;
      if(tileHit(en.x,ny,en.w,en.h)){ if(en.vy>0){ en.y=Math.floor((ny+en.h)/T)*T-en.h; en.grounded=true; } en.vy=0; }
      else { en.y=ny; en.grounded=false; }
    } else if(en.type==='flyer'){
      const nx=en.x+en.dir*en.sp*dt;
      if(tileHit(nx,en.y,en.w,en.h)||nx<en.min||nx+en.w>en.max) en.dir*=-1; else en.x=nx;
      if(en.trait==='diver'){
        if(!en.dive){ const n=nearestPlayer(en.x+en.w/2,en.y+en.h/2); en.dcd=(en.dcd||2)-dt; if(n&&en.dcd<=0&&Math.abs(n.p.x-en.x)<260&&n.p.y>en.y){ en.dive=1; en.tx=n.p.x+n.p.w/2-en.w/2; en.ty=n.p.y; en.dcd=3; } }
        if(en.dive===1){ en.x+=(en.tx-en.x)*Math.min(1,dt*3); en.y+=(en.ty-en.y)*Math.min(1,dt*3.2); if(Math.abs(en.ty-en.y)<12||tileHit(en.x,en.y+6,en.w,en.h)) en.dive=2; en._skip=true; }
        if(en.dive===2){ en.y+=(en.by-en.y)*Math.min(1,dt*2); if(Math.abs(en.by-en.y)<4) en.dive=0; en._skip=true; }
      }
      const ny=en.by+Math.sin(en.t*2.5)*34;
      if(!en._skip&&!tileHit(en.x,ny,en.w,en.h)) en.y=ny; en._skip=false;
    } else if(en.type==='turret'){
      en.cd-=dt;
      const n=nearestPlayer(en.x+en.w/2,en.y+6);
      if(n){ en.aim=Math.atan2(n.p.y+n.p.h/2-(en.y+6),n.p.x+n.p.w/2-(en.x+en.w/2)); }
      if(en.cd<=0&&n&&n.d<560){ aimShot(en.x+en.w/2,en.y+6,240*f); en.cd=Math.max(1.1,2.4-curTier*0.08); }
    }
    for(const p of players){
      if(p.down||en.hp<=0||!overlap(p,en)) continue;
      if(p.vy>0&&(p.y+p.h)-en.y<16){ damageEnemy(en,p.slam?8:3,true,p.slam?'slam':'stomp'); p.vy=-520; p.cut=true; p.airJumps=maxAir(p); if(p.slam){p.slam=false;} }
      else hurt(p);
    }
  }
  enemies=enemies.filter(e=>e.hp>0);
}

