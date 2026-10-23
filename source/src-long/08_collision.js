/* ================= collision ================= */
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function solid(tx,ty){
  if(tx<0||tx>=COLS||ty<0||ty>=ROWS) return true;
  const c=grid[ty][tx]; if(c==='#'||c==='S'||c==='x'||c==='Z'||c==='Y'||c==='I'||c==='K'||c==='G'||c==='X'||c==='D') return true; if(c==='[') return !leverOn; if(c===']') return leverOn;
  const d=doorAt[ty][tx]; return !!(d&&d.solid);
}
const solidPx=(x,y)=>solid(Math.floor(x/T),Math.floor(y/T));
function tileHit(x,y,w,h){
  const x0=Math.floor(x/T), x1=Math.floor((x+w-0.01)/T), y0=Math.floor(y/T), y1=Math.floor((y+h-0.01)/T);
  for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++) if(solid(tx,ty)) return true;
  return false;
}
function moveX(e,dx,depth=0){
  if(!dx) return 0;
  const x0=e.x; e.x+=dx;
  const ty0=Math.floor(e.y/T), ty1=Math.floor((e.y+e.h-0.01)/T);
  const tx=dx>0?Math.floor((e.x+e.w-0.01)/T):Math.floor(e.x/T);
  for(let ty=ty0;ty<=ty1;ty++) if(solid(tx,ty)){ e.x=dx>0?tx*T-e.w:(tx+1)*T; e.vx=0; break; }
  const blockers=e.kind==='crate'?crates.concat(players):crates;
  for(const o of blockers){
    if(o===e||!overlap(e,o)) continue;
    if(e.kind==='bolt'&&o.kind==='crate'&&depth===0){ moveX(o, dx>0?(e.x+e.w)-o.x : e.x-(o.x+o.w), 1); }
    if(overlap(e,o)){ e.x=dx>0?o.x-e.w:o.x+o.w; e.vx=0; }
  }
  return e.x-x0;
}
function moveY(e,dy){
  if(!dy) return 0;
  const y0=e.y, prevBottom=e.y+e.h; e.y+=dy; let landed=null;
  const tx0=Math.floor(e.x/T), tx1=Math.floor((e.x+e.w-0.01)/T);
  if(dy>0){
    const ty=Math.floor((e.y+e.h-0.01)/T);
    if(e.slam) for(let tx=tx0;tx<=tx1;tx++){ if(ty<ROWS&&grid[ty]&&grid[ty][tx]==='x') breakCrack(tx,ty,true); else if(ty<ROWS&&grid[ty]&&grid[ty][tx]==='S') openSecret(tx,ty); }
    for(let tx=tx0;tx<=tx1;tx++) if(solid(tx,ty)){ e.y=ty*T-e.h; landed='tile'; break; }
    if(!landed) for(const m of movers){ if(prevBottom<=m.y+1&&e.y+e.h>m.y&&e.x+e.w>m.x+2&&e.x<m.x+m.w-2){ e.y=m.y-e.h; landed=m; break; } }
  } else {
    const ty=Math.floor(e.y/T);
    for(let tx=tx0;tx<=tx1;tx++) if(solid(tx,ty)){ e.y=(ty+1)*T; e.vy=0; break; }
  }
  for(const o of crates.concat(players)){
    if(o===e||!overlap(e,o)) continue;
    const pair=e.kind!=='crate'&&o.kind!=='crate';
    if(dy>0){ if(pair&&prevBottom>o.y+0.5) continue; e.y=o.y-e.h; landed=o; }
    else { if(pair) continue; e.y=o.y+o.h; e.vy=0; }
  }
  if(landed){
    if(e.slam) onSlamLand(e);
    else if(!e.wasGround&&e.vy>500&&e.kind!=='crate'){ e.sx=1.2; e.sy=0.8; dust(e.x+e.w/2,e.y+e.h,6,e.kind==='bolt'?'#9cc3ff':'#ffd1a8'); }
    e.vy=0; e.onGround=true; e.ground=landed==='tile'?null:landed;
  }
  return e.y-y0;
}
function breakCrack(tx,ty,flood){
  const st=[[tx,ty]];
  while(st.length){
    const [x,y]=st.pop(); if(x<0||y<0||x>=COLS||y>=ROWS||grid[y][x]!=='x') continue;
    grid[y][x]='.'; gridVer++;
    for(let i=0;i<8;i++) addP({x:x*T+Math.random()*T,y:y*T+Math.random()*T,vx:(Math.random()-.5)*380,vy:-Math.random()*420,life:.9,max:.9,c:Math.random()<.5?'#e7b54a':'#5a4026',s:3+Math.random()*4,g:1});
    if(flood) st.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  shake=Math.max(shake,flood?10:4); sfx('crack'); if(flood) unlock('slam');
}
function onSlamLand(e){
  e.slam=false; shake=Math.max(shake,7); sfx('slam'); e.sx=1.35; e.sy=0.7;
  for(let i=0;i<14;i++){ const d=i<7?-1:1; addP({x:e.x+e.w/2,y:e.y+e.h,vx:d*(150+Math.random()*260),vy:-Math.random()*160,life:.45,max:.45,c:'#9cc3ff',s:3,g:1}); }
  const zone={x:e.x-50,y:e.y+e.h-30,w:e.w+100,h:34};
  for(const en of enemies) if(overlap(en,zone)) damageEnemy(en,4);
  if(e.kind==='bolt'&&U('slamWave')) for(const d of [-1,1]) bullets.push({kind:'wave',x:e.x+e.w/2-12,y:e.y+e.h-22,w:24,h:22,vx:d*520,vy:0,dmg:3,pierce:true,hit:new Set(),life:.9,age:0,c:'#5fe3d9',owner:'bolt'});
}
function addP(q){ if(particles.length>(window.MOBILE_BUILD?260:520)) return; if(Math.random()<settings.particles) particles.push(q); }
function dust(x,y,n,c){ for(let i=0;i<n;i++) addP({x,y,vx:(Math.random()-.5)*200,vy:-Math.random()*120,life:.35,max:.35,c,s:2.5,g:.4}); }
function burst(x,y,n,c,sp=300,life=.6){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, v=sp*(.3+Math.random()*.7); addP({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life,max:life,c:Array.isArray(c)?c[i%c.length]:c,s:3,g:.6}); } }

