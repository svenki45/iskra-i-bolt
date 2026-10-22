/* ================= boss ================= */
function updateBoss(dt){
  const b=boss; if(!b) return; dt*=b.slow||1;
  if(b.dead){ b.deadT-=dt; if(Math.random()<.5) burst(b.x+Math.random()*b.w,b.y+Math.random()*b.h,6,['#ff6b6b','#e7b54a','#fff'],260,.5); return; }
  b.t+=dt; b.flash=Math.max(0,b.flash-dt);
  const mk=b.v>=2, rageAt=mk?0.6:0.5, raging=b.hp<b.max*rageAt;
  if(mk&&raging&&!b.raged){ b.raged=true; flash('#ff3b4e',.35); shake=Math.max(shake,12); sfx('boss'); texts.push({x:VW/2,y:VH*.3,t:'ЯРОСТЬ!',life:1.8,c:'#ff4d5e',big:true}); }
  const f=(1+b.tier*0.05)*[1,1,1.18,1.32][b.v||1], rage=raging?(mk?1.5:1.35):1, cx=b.x+b.w/2, cy=b.y+b.h/2;
  const floorY=FLOOR_Y-b.h, minX=T, maxX=VW-T-b.w;
  const minions=()=>enemies.length;
  if(b.type==='toad'){
    if(b.state==='idle'){ b.st-=dt; if(b.st<=0){
      const n=nearestPlayer(cx,cy); const tx=n?n.p.x+n.p.w/2:VW/2;
      b.vx=Math.max(-560,Math.min(560,(tx-cx)/0.95)); b.vy=-980; b.state='air'; b.face=Math.sign(b.vx)||b.face; } }
    else {
      if(b.v>=2&&!b.dbl&&b.vy>-60&&b.vy<200){ b.dbl=true; const n2=nearestPlayer(cx,cy); if(n2){ b.vx=Math.max(-520,Math.min(520,(n2.p.x+n2.p.w/2-cx)/0.6)); } b.vy=-620; burst(cx,b.y+b.h,12,['#c7d3dd','#ff4d5e'],200,.4); tone(260,520,.15,'square',.05); }
      if(b.v>=3&&!b.spit&&b.vy>-120&&b.vy<0){ b.spit=true; aimShot(cx,cy,330,0.18,3); sfx('shotB'); }
      b.vy+=2000*dt; b.x+=b.vx*dt; b.y+=b.vy*dt;
      if(b.x<minX){b.x=minX;b.vx=-b.vx;} if(b.x>maxX){b.x=maxX;b.vx=-b.vx;}
      if(b.y>=floorY){ b.y=floorY; b.vy=0; b.vx=0; b.state='idle'; b.st=1.15/(f*rage); b.jumps++;
        shake=Math.max(shake,9); sfx('slam');
        for(const d of [-1,1]) ebullets.push({wave:true,x:cx-13,y:FLOOR_Y-24,w:26,h:24,vx:d*(330*f),vy:0,life:5});
        b.dbl=false; b.spit=false;
        if(b.v>=2) for(const d of [-1,1]) ebullets.push({wave:true,x:cx-13+d*30,y:FLOOR_Y-20,w:22,h:20,vx:d*(190*f),vy:0,life:6});
        if(b.v>=3) for(let i=0;i<4;i++){ const a=-Math.PI/2+(i-1.5)*0.45; ebullets.push({x:cx,y:b.y+10,vx:Math.cos(a)*360,vy:Math.sin(a)*420,r:8,life:5,g:700,spark:true}); }
        if(b.v>=2){ const n3=nearestPlayer(cx,cy); for(let i=0;i<(b.v>=3?5:3);i++){ const x=(n3?n3.p.x:VW/2)+(i-1)*90+(Math.random()-.5)*60; ebullets.push({x:Math.max(T*2,Math.min(VW-T*2,x)),y:T+12,vx:0,vy:60,r:9,life:4,g:900,rock:true}); } }
        if(b.jumps%3===0){ for(let i=0;i<5;i++){ const a=-Math.PI/2+(i-2)*0.32; ebullets.push({x:cx,y:b.y,vx:Math.cos(a)*300*f,vy:Math.sin(a)*300*f,r:7,life:5,g:500}); } }
      }
    }
  } else if(b.type==='eye'||b.type==='core'){
    const amp=b.type==='core'?480:420;
    b.x=VW/2-b.w/2+Math.sin(b.t*0.5*f)*amp; b.y=(b.type==='core'?100:110)+Math.sin(b.t*1.3)*36;
    b.cd-=dt*rage; b.cd2-=dt*rage; b.cd3-=dt;
    if(b.type==='eye'){
      if(b.cd<=0){ aimShot(cx,cy+20,280*f,0.22,3); b.cd=1.5/f; sfx('shotB'); }
      if(b.cd2<=0){ ring(cx,cy,14,220*f,b.t); b.cd2=6/f; }
      if(rage>1&&b.cd3<=0&&minions()<(b.v>=2?4:3)){ enemies.push(makeEnemy({type:'flyer',tx:Math.floor(cx/T),ty:4,min:T,max:VW-T,trait:b.v>=2?'diver':null},b.tier)); b.cd3=b.v>=2?6:8; }
      if(b.v>=2){ b.cd5=(b.cd5??3)-dt*rage; if(b.cd5<=0){ b.cd5=5.5/f; for(let k=0;k<3;k++) setTimeout(()=>{ if(boss===b&&!b.dead) ring(b.x+b.w/2,b.y+b.h/2,10,200*f,k*0.21+b.t); },k*220); } }
      if(b.v>=2){
        const ox=cx, oy=cy+b.h*0.45;
        if(!b.laser){ b.cd4=(b.cd4??4)-dt*rage; if(b.cd4<=0){ const nn=nearestPlayer(ox,oy); if(nn){ b.laser={state:'aim',t:0,ang:Math.atan2(nn.p.y+nn.p.h/2-oy,nn.p.x+nn.p.w/2-ox),sweep:Math.random()<.5?-1:1}; tone(300,900,.8,'sawtooth',.035); } b.cd4=6.5/f; } }
        else { const L=b.laser; L.t+=dt;
          if(L.state==='aim'){ const nn=nearestPlayer(ox,oy); if(nn&&L.t<0.5){ const ta=Math.atan2(nn.p.y+nn.p.h/2-oy,nn.p.x+nn.p.w/2-ox); L.ang+=(ta-L.ang)*Math.min(1,dt*4); } if(L.t>=0.9){ L.state='fire'; L.t=0; noise(1500,.7,.08,'bandpass'); tone(120,90,.7,'sawtooth',.06); shake=Math.max(shake,5); } }
          else { L.ang+=L.sweep*0.55*dt; const dx=Math.cos(L.ang), dy=Math.sin(L.ang);
            for(const p of players){ if(p.down) continue; const px=p.x+p.w/2-ox, py=p.y+p.h/2-oy, along=px*dx+py*dy, perp=Math.abs(px*dy-py*dx); if(along>0&&perp<16+p.w/2) hurt(p); }
            if(Math.random()<.7){ const k=Math.random()*900; addP({x:ox+dx*k,y:oy+dy*k,vx:(Math.random()-.5)*120,vy:-Math.random()*120,life:.3,max:.3,c:'#ffb38a',s:3,g:.5}); }
            if(L.t>=0.75) b.laser=null; } }
      }
    } else {
      if(b.cd<=0){
        const k=b.atk++%5; b.cd=1.25/f;
        if(k===0) aimShot(cx,cy+30,300*f,0.2,5);
        else if(k===1) ring(cx,cy,18,230*f,b.t);
        else if(k===2) for(let i=0;i<7;i++) ebullets.push({x:T*2+Math.random()*(VW-T*4),y:T+10,vx:0,vy:240+Math.random()*120,r:7,life:5,g:0});
        else if(k===3){ if(minions()<4) enemies.push(makeEnemy({type:Math.random()<.5?'crawler':'flyer',tx:Math.random()<.5?4:27,ty:Math.random()<.5?16:6,min:T,max:VW-T},b.tier)); }
        else { for(const d of [-1,1]) ebullets.push({wave:true,x:VW/2-13,y:FLOOR_Y-24,w:26,h:24,vx:d*360*f,vy:0,life:5}); }
      }
    }
  } else if(b.type==='gear'){
    b.vy+=1800*dt; b.x+=b.vx*rage*dt; b.y+=b.vy*dt; b.rot+=b.vx*dt/46;
    if(b.x<minX){b.x=minX;b.vx=Math.abs(b.vx);} if(b.x>maxX){b.x=maxX;b.vx=-Math.abs(b.vx);}
    if(b.y>=floorY){ b.y=floorY; b.vy=-(800+Math.random()*250); b.bounces++; shake=Math.max(shake,5); sfx('slam');
      if(b.bounces%3===0) ring(cx,cy,b.v>=2?12:8,240*f,b.t);
      if(b.v>=2) for(const d of [-1,1]) ebullets.push({wave:true,x:cx-11,y:FLOOR_Y-20,w:22,h:20,vx:d*250*f,vy:0,life:4});
      if(b.v>=2&&b.bounces%2===0) for(const d of [-1,1]) ebullets.push({x:cx,y:cy,vx:d*(300+Math.random()*120)*f,vy:-420-Math.random()*200,r:10,life:4,g:900,saw:true}); }
    b.cd3-=dt; if(b.cd3<=0){ if(minions()<4){ enemies.push(makeEnemy({type:'crawler',tx:3,ty:16,min:T,max:VW-T},b.tier)); enemies.push(makeEnemy({type:'crawler',tx:28,ty:16,min:T,max:VW-T},b.tier)); if(b.v>=2&&minions()<5) enemies.push(makeEnemy({type:'flyer',tx:15,ty:5,min:T,max:VW-T},b.tier)); } b.cd3=6.5/f; }
  } else if(b.type==='queen'){
    b.y=floorY;
    const n=nearestPlayer(cx,cy);
    if(b.state==='idle'){
      if(n){ const d=Math.sign(n.p.x+n.p.w/2-cx); b.face=d||b.face; b.x+=d*110*f*dt; }
      b.cd-=dt*rage; if(b.cd<=0){ b.state='tele'; b.st=0.65; }
    } else if(b.state==='tele'){ b.st-=dt; b.flash=Math.max(b.flash,(Math.floor(b.t*16)%2)?.08:0); if(b.st<=0){ b.state='charge'; b.vx=b.face*640*f; sfx('dash'); } }
    else if(b.state==='charge'){ if(b.v>=2){ b.egg=(b.egg||0)-dt; if(b.egg<=0){ b.egg=.12; ebullets.push({x:cx-b.face*b.w*.4,y:FLOOR_Y-10,vx:0,vy:0,r:8,life:1.6,g:0,egg:true}); } } b.x+=b.vx*dt; if(b.x<=minX||b.x>=maxX){ b.x=Math.max(minX,Math.min(maxX,b.x)); shake=Math.max(shake,10); sfx('slam'); ring(cx,cy,b.v>=2?10:6,200*f,0);
        if(b.v>=2&&!b.second){ b.second=true; b.face=-b.face; b.state='tele'; b.st=0.35; } else { b.second=false; b.state='stun'; b.st=0.9; } } }
    else if(b.state==='stun'){ b.st-=dt; if(b.st<=0){ b.state='idle'; b.cd=4.2/f; if(b.v>=2){ aimShot(cx,b.y+10,300*f,0.25,3); sfx('shotB'); } } }
    b.x=Math.max(minX,Math.min(maxX,b.x));
    b.cd2-=dt; if(b.cd2<=0){ if(minions()<3){ enemies.push(makeEnemy({type:'flyer',tx:Math.floor(cx/T),ty:8,min:T,max:VW-T},b.tier)); } b.cd2=8/f; }
    b.cd3-=dt*rage; if(b.cd3<=0&&b.state==='idle'){ { const nL=b.v>=2?5:3; for(let i=0;i<nL;i++) ebullets.push({x:cx,y:b.y,vx:(i-(nL-1)/2)*150+b.face*120,vy:-560,r:7,life:5,g:900}); } b.cd3=3/f; }
  }
  for(const p of players){
    if(p.down||!overlap(p,b)) continue;
    if(p.vy>0&&(p.y+p.h)-b.y<18&&b.type!=='gear'){ hitBoss(p.slam?8:4,p.slam?'slam':'stomp'); p.vy=-600; p.cut=true; p.airJumps=maxAir(p); p.slam=false; }
    else hurt(p);
  }
}
function updateArena(dt){
  const A=arena; if(!A||!boss||boss.dead) return;
  A.t+=dt; const rage=boss.hp<boss.max/2, f=1+curTier*0.04;
  if(A.type==='eye'){
    A.rainCd-=dt*(rage?1.4:1);
    if(A.rainCd<=0){ A.rainCd=4.2/f; const n=rage?3:2; for(let i=0;i<n;i++){ const col=3+Math.floor(Math.random()*24); A.rains.push({x:col*T+T/2,warn:1.1,left:6,cd:0}); } sfx('nav'); }
    for(const r of A.rains){ if(r.warn>0){ r.warn-=dt; continue; } r.cd-=dt; if(r.cd<=0&&r.left>0){ r.left--; r.cd=0.09; ebullets.push({x:r.x+(Math.random()-.5)*18,y:T+6,vx:(Math.random()-.5)*30,vy:430*f,r:5,life:4,g:300,spark:true}); } }
    A.rains=A.rains.filter(r=>r.warn>0||r.left>0);
  } else if(A.type==='core'){
    if(!A.shock){ A.shockCd-=dt; if(A.shockCd<=0){ A.side=1-A.side; A.shock={warn:1.2,on:1.3,side:A.side}; } }
    else if(A.shock.warn>0){ A.shock.warn-=dt; if(A.shock.warn<=0){ tone(90,60,.5,'sawtooth',.06); noise(4000,.4,.06,'highpass'); shake=Math.max(shake,4); } }
    else { A.shock.on-=dt; const x0=A.shock.side?17*T:T, x1=A.shock.side?(COLS-1)*T:15*T;
      for(const p of players) if(!p.down&&p.wasGround&&!p.ground&&p.y+p.h>=FLOOR_Y-1&&p.x+p.w>x0&&p.x<x1){ const had=p.inv<=0; hurt(p); if(had) p.vy=-560; }
      if(Math.random()<.6) addP({x:x0+Math.random()*(x1-x0),y:FLOOR_Y-2,vx:0,vy:-60-Math.random()*120,life:.25,max:.25,c:Math.random()<.5?'#9cf0ff':'#ffffff',s:3,g:0});
      if(A.shock.on<=0){ A.shock=null; A.shockCd=(rage?3.2:4.6)/f; } }
  } else if(A.type==='toad'){
    if(Math.random()<dt*10){ const cells=[]; for(let x=1;x<COLS-1;x++) if(grid[16][x]==='L') cells.push(x); if(cells.length){ const x=cells[Math.floor(Math.random()*cells.length)]; addP({x:x*T+Math.random()*T,y:16*T+20,vx:(Math.random()-.5)*40,vy:-80-Math.random()*160,life:.6,max:.6,c:Math.random()<.5?'#ffb347':'#ff5a2a',s:3,g:.15}); } }
  }
}
