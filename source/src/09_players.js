/* ================= players ================= */
const approach=(v,t,a)=>v<t?Math.min(t,v+a):Math.max(t,v-a);
function trailColor(kind,tr,i){ if(tr==='rainbow') return `hsl(${(clock*240+i*40)%360},95%,65%)`; if(tr==='smoke') return 'rgba(200,210,225,.7)'; if(tr==='hearts') return '#ff6b9a'; if(tr==='stars') return '#ffd166'; if(tr==='notes') return skinOf(kind).body; return mixHex(skinOf(kind).body,'#ffffff',.6); }
const TRAIL_SH={sparkle:'spk',hearts:'heart',stars:'star',rainbow:'dot',notes:'note',smoke:'dot'};
function emitTrail(p,dt){
  const tr=looks[p.kind].trail; if(!tr||tr==='none'||p.down||p.dead||p.absent) return;
  const sp=Math.hypot(p.vx,p.vy); if(sp<70) return;
  p.trailAcc=(p.trailAcc||0)+dt*(tr==='rainbow'?40:tr==='smoke'?22:14);
  while(p.trailAcc>=1){ p.trailAcc--; const big=tr==='smoke';
    addP({x:p.x+p.w/2-Math.sign(p.vx||p.face)*p.w*.3+(Math.random()-.5)*8,y:p.y+p.h*(tr==='rainbow'?.55:.5)+(Math.random()-.5)*p.h*.4,vx:-p.vx*.08+(Math.random()-.5)*30,vy:(tr==='smoke'?-30:-10)-Math.random()*25,life:tr==='rainbow'?.45:.8,max:tr==='rainbow'?.45:.8,c:trailColor(p.kind,tr,Math.random()*9|0),s:big?7+Math.random()*4:(tr==='rainbow'?5:4),g:tr==='smoke'?-.03:-.01,sh:TRAIL_SH[tr]}); }
}
function control(p,inp,dt){
  emitTrail(p,dt);
  const sp=p.kind==='spark';
  p.inv=Math.max(0,p.inv-dt);
  for(const k in p.pw) p.pw[k]=Math.max(0,p.pw[k]-dt);
  p.shootCd-=dt; p.chargeCd=Math.max(0,(p.chargeCd||0)-dt);
  if(p.down){ p.vx=approach(p.vx,0,2000*dt); p.dash=0; p.slam=false; return; }
  if(p.wasGround){ p.coyote=0.1; p.airJumps=maxAir(p); p.dashesLeft=maxDash(); p.boosted=false; }
  else p.coyote-=dt;
  p.jumpBuf=inp.jp?0.13:p.jumpBuf-dt;
  if(inp.dir) p.face=inp.dir;
  if(p.dash>0){
    p.dash-=dt; p.vx=p.face*760; p.vy=0;
    if(sp&&!solo){ const b=players[1]; if(b&&!b.absent&&!b.down&&!(b.chargeCd>0)&&overlap(p,b)){ b.pw.power=Math.max(b.pw.power,5); b.chargeCd=6; b.pwPop=1; sfx('boost'); flash('#c79bff',.25); hitstop=Math.max(hitstop,.05); burst(b.x+b.w/2,b.y+b.h/2,20,['#c79bff','#ffd166'],300,.5); texts.push({x:b.x+b.w/2,y:b.y-30,t:'ЗАРЯЖЕН!',life:1.2,c:'#c79bff',pop:true}); unlock('charge'); } }
    if(Math.random()<.8) addP({x:p.x+p.w/2,y:p.y+p.h/2+(Math.random()-.5)*14,vx:-p.face*60,vy:0,life:.25,max:.25,c:'#ffd166',s:3,g:0});
  } else if(!p.slam){
    const honey=inHoney(p), ice=p.wasGround&&tileUnder(p)==='I'; p.vx=approach(p.vx,inp.dir*(sp?300:230)*(1+0.1*U('speed'))*(honey?0.42:ice?1.25:1),(ice?[900,520,380,260][mechD()+1]:p.wasGround?3600:2300)*dt);
  }
  if(p.jumpBuf>0){
    if(p.coyote>0){
      p.vy=(sp?-760:-680)*(inHoney(p)?0.78:1); p.coyote=0; p.jumpBuf=0; p.cut=false; p.wasGround=false; p.sx=.78; p.sy=1.25;
      sfx('jump'); dust(p.x+p.w/2,p.y+p.h,5,sp?'#ffd1a8':'#9cc3ff');
    } else if(p.airJumps>0&&inp.jp&&p.dash<=0&&!p.slam){
      p.vy=sp?-700:-640; p.airJumps--; p.jumpBuf=0; p.cut=false; p.sx=.8; p.sy=1.2; sfx('jump2');
      for(let i=0;i<8;i++) addP({x:p.x+p.w/2,y:p.y+p.h,vx:(Math.random()-.5)*160,vy:Math.random()*120,life:.4,max:.4,c:'#ffd166',s:2.5,g:.2});
    }
  }
  if(!inp.jump&&p.vy<-260&&!p.boosted&&!p.cut){ p.vy*=0.5; p.cut=true; }
  if(inp.ap){
    if(sp){ if(p.dashesLeft>0&&p.dash<=0){ p.dash=0.16*(U('dash')?1.4:1); p.dashesLeft--; p.cut=true; sfx('dash'); } }
    else {
      const s=players[0];
      if(!s.down&&s.wasGround&&s.ground===p){
        s.vy=-1150*(U('boost')?1.25:1); if(U('boost')){ s.inv=Math.max(s.inv,1.2); } s.boosted=true; s.airJumps=maxAir(s); s.dashesLeft=maxDash(); s.wasGround=false; s.onGround=false; s.ground=null; s.coyote=0; s.jumpBuf=0;
        p.sx=1.3; p.sy=.7; s.sx=.6; s.sy=1.5; sfx('boost'); shake=Math.max(shake,3);
        burst(p.x+p.w/2,p.y,16,['#ffd166','#62c7c1'],260,.5);
        texts.push({x:p.x+p.w/2,y:p.y-40,t:'ОП!',life:.7,c:'#ffd166'}); unlock('boost');
        if(solo&&active===1){ active=0; prevPad[0]={j:true,a:true}; }
      } else if(!p.wasGround&&!p.slam){ p.slam=true; p.vx=0; p.vy=1300; p.sx=.8; p.sy=1.2; }
    }
  }
  if(inp.fire&&p.shootCd<=0) shoot(p);
  if(inp.nx&&p.bag.length>1){ p.sel=(p.sel+1)%p.bag.length; p.bagPop=1; sfx('gear'); }
  if(inp.use) useBag(p);
  if(settings.trails&&p.wasGround&&Math.abs(p.vx)>200&&Math.random()<.35) addP({x:p.x+p.w/2-p.face*p.w/2,y:p.y+p.h-2,vx:-p.face*40,vy:-20,life:.3,max:.3,c:sp?'#ffd1a8':'#9cc3ff',s:2,g:0});
}
function shoot(p){
  const sp=p.kind==='spark';
  p.shootCd=(sp?0.22*(1-0.2*U('sparkRate')):0.42)*(p.pw.rapid>0?0.42:1);
  const power=p.pw.power>0, angles=p.pw.triple>0?(sp?[-0.22,0,0.22]:[-0.16,0,0.16]):[0];
  const ox=p.x+p.w/2+p.face*(p.w/2+2), oy=p.y+p.h*(sp?.5:.46);
  if(sp){
    // Искра: огненные искры — быстрые, извиваются, оставляют угольки; мощные взрываются
    const speed=power?640:780, dmg=(power?2:1)+U('sparkDmg'), w=power?18:10, h=power?16:8;
    for(const a of angles) bullets.push({kind:'spark',x:ox-w/2,y:oy-h/2,w,h,vx:Math.cos(a)*speed*p.face,vy:Math.sin(a)*speed,dmg,pierce:false,boom:power,hit:new Set(),life:1.05,age:0,ph:Math.random()*6,c:'#ffb347',owner:'spark'});
    for(let i=0;i<5;i++) addP({x:ox,y:oy,vx:p.face*(120+Math.random()*220),vy:(Math.random()-.5)*140,life:.14,max:.14,c:i%2?'#fff3c4':'#ff8a3d',s:3,g:0});
    p.vx-=p.face*8; sfx(power?'shotSP':'shotS');
  } else {
    // Болт: тяжёлые гайки — медленнее, крутятся, бьют сильнее, мощные пробивают насквозь
    const speed=power?520:590, dmg=(power?4:2)+U('boltDmg'), sz=power?24:15;
    for(const a of angles) bullets.push({kind:'bolt',x:ox-sz/2,y:oy-sz/2,w:sz,h:sz,vx:Math.cos(a)*speed*p.face,vy:Math.sin(a)*speed,dmg,pierce:power,hit:new Set(),life:1.25,age:0,rot:Math.random()*6,c:'#c7d3dd',owner:'bolt'});
    for(let i=0;i<6;i++) addP({x:ox-p.face*6,y:oy-4,vx:(Math.random()-.5)*60-p.face*30,vy:-40-Math.random()*90,life:.45,max:.45,c:'rgba(220,235,245,.7)',s:5+Math.random()*4,g:-0.05});
    p.vx-=p.face*(power?60:30); p.sx=1.12; p.sy=.9; shake=Math.max(shake,power?3:1.2); sfx(power?'shotBP':'shotB');
  }
}
function sparkBoom(x,y){
  sfx('boomS'); shake=Math.max(shake,4);
  burst(x,y,22,['#ffd166','#ff8a3d','#ff5a2a','#fff3c4'],320,.5);
  rings.push({x,y,r:6,max:70,life:.3,c:'#ffb347',w:4});
  const zone={x:x-60,y:y-60,w:120,h:120};
  for(const en of enemies) if(en.hp>0&&overlap(en,zone)) damageEnemy(en,1,false,'power');
  if(boss&&!boss.dead&&overlap(boss,zone)) hitBoss(1,'power');
}
function flash(c,a){ if(!settings.flash) return; flashC=c; flashA=Math.max(flashA,a); }
function swapHero(auto){
  active=1-active; sfx('nav'); tone(660,990,.08,'triangle',.05);
  const p=players[active]; p.jumpBuf=0; prevPad[0]={j:true,a:true};
  rings.push({x:p.x+p.w/2,y:p.y+p.h/2,r:6,max:46,life:.3,c:p.kind==='spark'?'#ff8a3d':'#62c7c1',w:3});
}
function hurt(p){
  if(p.inv>0||p.down||state!=='play'||cheatGod||demo) return;
  if(p.shield){ p.shield=false; p.inv=1; burst(p.x+p.w/2,p.y+p.h/2,14,'#9cc3ff',200,.4); sfx('hit'); return; }
  p.hp--; p.inv=1.3; levelHurt=true;
  if(p.hp<=0&&p.secondWind){ p.secondWind=false; p.hp=1; p.inv=2; sfx('revive'); burst(p.x+p.w/2,p.y+p.h/2,22,'#7fe08a',260,.6); texts.push({x:p.x+p.w/2,y:p.y-26,t:'ВТОРОЕ ДЫХАНИЕ!',life:1.4,c:'#7fe08a',pop:true}); return; } p.vy=-380; p.vx=-p.face*260; shake=Math.max(shake,5); sfx('hurt'); flash('#ff3b4e',.28);
  burst(p.x+p.w/2,p.y+p.h/2,12,p.kind==='spark'?'#ff8a3d':'#62c7c1',220,.5);
  if(p.hp<=0){
    p.hp=0; p.down=true; p.reviveT=0; p.slam=false; p.dash=0; levelDowned=true; runClean=false;
    texts.push({x:p.x+p.w/2,y:p.y-20,t:'ПОМОГИ!',life:1.2,c:'#ff6b6b'});
    const q=players.find(o=>o!==p&&!o.absent&&!o.down&&!o.dead);
    if(solo||!q) die(p,'down'); else { p.bleed=8; texts.push({x:q.x+q.w/2,y:q.y-30,t:'ПОДОЙДИ К НАПАРНИКУ!',life:1.6,c:'#ffd166'}); }
  }
}
function inHoney(p){ if(!arena||!p.wasGround) return false; const ty=Math.floor((p.y+p.h-4)/T); for(let tx=Math.floor(p.x/T);tx<=Math.floor((p.x+p.w-1)/T);tx++) if(grid[ty]&&grid[ty][tx]==='H') return true; return false; }
function physics(e,dt){
  if(!(e.dash>0)) e.vy=Math.min(e.vy+G*dt,e.slam?1300:950);
  if(e.slam) e.vy=1300;
  if(e.kind==='crate') e.vx=0;
  e.onGround=false; e.ground=null;
  moveX(e,e.vx*dt); moveY(e,e.vy*dt);
  if(e.onGround&&!e.ground&&arena&&arena.conv){ const c=grid[Math.floor((e.y+e.h+2)/T)]?.[Math.floor((e.x+e.w/2)/T)]; if(c==='Z'||c==='Y') moveX(e,(c==='Z'?1:-1)*arena.conv*dt); }
}

