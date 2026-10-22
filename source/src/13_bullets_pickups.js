/* ================= bullets & pickups ================= */
function bulletHit(b,cx,cy){
  if(b.kind==='spark'){ if(b.boom) sparkBoom(cx,cy); else burst(cx,cy,6,['#ffd166','#ff8a3d'],150,.22); }
  else { burst(cx,cy,7,['#c7d3dd','#ffffff','#7f909e'],200,.25); noise(3000,.05,.04,'bandpass'); }
}
function updateBullets(dt){
  for(const b of bullets){
    b.life-=dt; b.age=(b.age||0)+dt; b.x+=b.vx*dt; b.y+=b.vy*dt;
    if(b.kind==='bolt') b.rot+=dt*(b.vx>0?18:-18);
    const seek=U('seeker'); if((b.kind==='bolt'&&U('homing'))||seek){ let tg=null,td=seek?520:340; for(const en of enemies){ if(en.hp<=0) continue; const d=Math.hypot(en.x+en.w/2-b.x,en.y+en.h/2-b.y); if(d<td&&(seek||Math.sign(en.x-b.x)===Math.sign(b.vx))){ td=d; tg=en; } }
      if(!tg&&boss&&!boss.dead){ const d=Math.hypot(boss.x+boss.w/2-b.x,boss.y+boss.h/2-b.y); if(d<(seek?900:520)) tg=boss; }
      if(tg){ const sp=Math.hypot(b.vx,b.vy), want=Math.atan2(tg.y+tg.h/2-(b.y+b.h/2),tg.x+tg.w/2-(b.x+b.w/2)); let a=Math.atan2(b.vy,b.vx); let da=((want-a+Math.PI*3)%(Math.PI*2))-Math.PI; const tr=seek?7:3; a+=Math.max(-tr*dt,Math.min(tr*dt,da)); b.vx=Math.cos(a)*sp; b.vy=Math.sin(a)*sp; } }
    if(b.kind==='wave'){ b.x+=0; }
    if(b.kind==='spark'&&settings.trails&&Math.random()<.6) addP({x:b.x+b.w/2,y:b.y+b.h/2+Math.sin(b.age*30+b.ph)*3,vx:-b.vx*.05+(Math.random()-.5)*30,vy:-20-Math.random()*40,life:.28,max:.28,c:Math.random()<.5?'#ff8a3d':'#ffd166',s:2.5,g:-.02});
    const cx=b.x+b.w/2, cy=b.y+b.h/2, tx=Math.floor(cx/T), ty=Math.floor(cy/T);
    { // friendly shots: generous hitbox for breakable blocks, so shooting mid-jump still connects
      let hitB=null; const ax=Math.floor((cx+Math.sign(b.vx||1)*6)/T);
      for(const dy of [0,-16,16,-26,26]){ const yy=Math.floor((cy+dy)/T), c=grid[yy]&&grid[yy][ax]; if(c==='x'||c==='S'){ hitB=[ax,yy,c]; break; } }
      if(hitB&&!solid(tx,ty)){ const [hx,hy,c]=hitB; let clear=true; const y0=Math.min(ty,hy), y1=Math.max(ty,hy); for(let yy=y0;yy<=y1;yy++) if(yy!==hy&&grid[yy]&&grid[yy][ax]==='#') clear=false;
        if(clear){ if(c==='x') breakCrack(hx,hy,false); else hitSecret(hx,hy); b.life=0; bulletHit(b,cx,cy); continue; } }
    }
    if(solid(tx,ty)){
      if(grid[ty]&&grid[ty][tx]==='x') breakCrack(tx,ty,false);
      else if(grid[ty]&&grid[ty][tx]==='S') hitSecret(tx,ty);
      b.life=0; bulletHit(b,cx,cy); continue;
    }
    if(crates.some(c=>overlap(b,c))){ b.life=0; bulletHit(b,cx,cy); continue; }
    for(const en of enemies){ if(en.hp>0&&!b.hit.has(en)&&overlap(b,en)){ lastHitDir=Math.sign(b.vx); damageEnemy(en,b.dmg,false,srcOf(b)); b.hit.add(en); if(b.kind==='bolt') en.x+=Math.sign(b.vx)*6; if(!b.pierce){ b.life=0; bulletHit(b,cx,cy); break; } } }
    if(b.life>0&&boss&&!boss.dead&&!b.hit.has(boss)&&overlap(b,boss)){ hitBoss(b.dmg,srcOf(b)); b.hit.add(boss); if(!b.pierce){ b.life=0; bulletHit(b,cx,cy); } else burst(cx,cy,5,b.c,160,.25); }
  }
  bullets=bullets.filter(b=>b.life>0);
  for(const e of ebullets){
    e.life-=dt;
    if(e.wave){ e.x+=e.vx*dt; if(e.x<T||e.x+e.w>VW-T) e.life=0; }
    else { e.vy+=(e.g||0)*dt; e.x+=e.vx*dt; e.y+=e.vy*dt; if(solidPx(e.x,e.y)){ e.life=0; burst(e.x,e.y,3,'#ff6b6b',100,.2); } }
    if(e.life<=0) continue;
    const r=e.wave?e:{x:e.x-e.r+2,y:e.y-e.r+2,w:e.r*2-4,h:e.r*2-4};
    for(const p of players) if(!p.down&&overlap(p,r)){ hurt(p); if(!e.wave) e.life=0; }
  }
  ebullets=ebullets.filter(e=>e.life>0);
}
const BAG_MAX=3;
function applyBonus(p,type){
  if(type==='heart') p.hp=Math.min(Math.max(5,3+U('hearts')),p.hp+1);
  else if(type==='shield') p.shield=true;
  else { p.pw[type]=(p.pw[type]||0)+25*(1+0.5*U('longPw')); if(!stats.pw.includes(type)){ stats.pw.push(type); saveStats(); checkStatAch(); } }
}
function useBag(p){
  if(p.down||p.dead) return;
  if(!p.bag.length){ texts.push({x:p.x+p.w/2,y:p.y-30,t:'рюкзак пуст',life:.9,c:'#8fa6c8'}); return; }
  const type=p.bag.splice(p.sel,1)[0]; if(p.sel>=p.bag.length) p.sel=Math.max(0,p.bag.length-1);
  applyBonus(p,type); collectFx(p,type); p.bagPop=1;
}
function collectFx(p,type){
  const c=PICK_INFO[type].c, cx=p.x+p.w/2, cy=p.y+p.h/2;
  sfx('pk_'+type);
  flash(c,.16); hitstop=Math.max(hitstop,0.07); shake=Math.max(shake,3);
  rings.push({x:cx,y:cy,r:8,max:110,life:.45,c,w:5}); rings.push({x:cx,y:cy,r:4,max:60,life:.3,c:'#ffffff',w:3});
  for(let i=0;i<18;i++){ const a=i/18*Math.PI*2; addP({x:cx+Math.cos(a)*70,y:cy+Math.sin(a)*70,vx:-Math.cos(a)*260,vy:-Math.sin(a)*260,life:.26,max:.26,c,s:3.5,g:0}); }
  burst(cx,cy,16,[c,'#ffffff'],260,.6);
  p.sx=1.35; p.sy=.75; p.pwPop=Object.assign(p.pwPop||{},{[type]:1}); p.aura=1; p.auraC=c;
  texts.push({x:cx,y:p.y-30,t:PICK_INFO[type].big,life:1.4,c,pop:true});
}
const PICK_INFO={relic:{c:'#ff5fa2',t:'Реликвия',big:'РЕЛИКВИЯ!'},gear:{c:'#e7b54a',t:'',big:''},heart:{c:'#ff6b81',t:'+1 сердце',big:'+1 СЕРДЦЕ!'},shield:{c:'#9cc3ff',t:'Щит',big:'ЩИТ!'},triple:{c:'#ffd166',t:'Тройной выстрел',big:'ТРОЙНОЙ ВЫСТРЕЛ!'},rapid:{c:'#7fe08a',t:'Скорострел',big:'СКОРОСТРЕЛ!'},power:{c:'#c79bff',t:'Мощный выстрел',big:'МОЩНЫЙ ВЫСТРЕЛ!'}};
function updatePickups(dt){
  for(const pk of pickups){
    pk.t+=dt; if(pk.hidden) continue;
    if(pk.type!=='gear'||true){ let bp=null,bd=1e9; for(const p of players){ if(p.down) continue; const d=Math.hypot(p.x+p.w/2-(pk.x+T/2),p.y+p.h/2-(pk.y+T/2)); if(d<bd){bd=d;bp=p;} }
      const MR=U('magnet')?200:95; if(bp&&bd<MR){ const k=Math.min(1,dt*(6+(MR-bd)/10)); pk.x+=(bp.x+bp.w/2-T/2-pk.x)*k; pk.y+=(bp.y+bp.h/2-T/2-pk.y)*k; pk.mag=true; } }
    const r={x:pk.x+8,y:pk.y+6,w:24,h:28};
    for(const p of players){
      if(p.down||pk.taken||!overlap(p,r)) continue;
      pk.taken=true;
      if(pk.type==='gear'){ addScore(10); gears++; stats.gears++; checkStatAch(); if(stats.gears%5===0) saveStats(); $('gears').textContent=gears; sfx('gear'); burst(pk.x+T/2,pk.y+T/2,6,'#e7b54a',140,.3); continue; }
      if(pk.type==='relic'){ run.relics=run.relics||{}; const a=run.relics[pk.bossN]=run.relics[pk.bossN]||[]; if(!a.includes(pk.ri)) a.push(pk.ri); saveRun(); collectFx(p,'relic');
        const bt=bossTypeAt(pk.bossN); texts.push({x:p.x+p.w/2,y:p.y-60,t:RELICS[bt][pk.ri]+': '+BOSS_NAMES[bt]+' '+RELIC_FX[pk.ri],life:3,c:'#ff5fa2'}); texts.push({x:p.x+p.w/2,y:p.y-84,t:'Реликвии босса '+a.length+'/3',life:3,c:'#ffd166'}); updHint(); continue; }
      if(p.bag.length<BAG_MAX){ p.bag.push(pk.type); p.sel=p.bag.length-1; p.bagPop=1; collectFx(p,pk.type); texts.push({x:p.x+p.w/2,y:p.y-56,t:'в рюкзак '+p.bag.length+'/'+BAG_MAX,life:1.2,c:'#c792ff'}); }
      else { applyBonus(p,pk.type); collectFx(p,pk.type); }
    }
  }
  pickups=pickups.filter(p=>!p.taken);
  if(boss&&!boss.dead){
    heartTimer-=dt;
    if(heartTimer<=0){ heartTimer=13; if(!pickups.some(p=>p.type==='heart')){ const spots=[[6,14],[25,14],[10,12],[21,12],[15,10],[16,10]]; const s=(arena&&arena.spots.length?arena.spots:spots)[Math.floor(Math.random()*(arena&&arena.spots.length?arena.spots.length:spots.length))]; pickups.push({type:Math.random()<.7?'heart':['triple','rapid','power','shield'][Math.floor(Math.random()*4)],x:s[0]*T,y:s[1]*T,t:0}); } }
  }
}

