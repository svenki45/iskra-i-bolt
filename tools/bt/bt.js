/* ===== ИСПЫТАНИЯ (тестовая Steam-сборка desktop-bt): уровни-аттракционы в духе старых аркад =====
   Вставляется сборщиком tools/bt/build.py внутрь кода игры (перед const GAME_VER) — только в копию desktop-bt.
   Основная игра этот файл не видит. Механики свои: гонка на реактивной доске и спуск на тросе. */
/*BT_N=3*/
var BTX={z:0,lx:0,ly:0};   // подсказки камере (читаются в draw)
const BT=(()=>{
const S={on:false,kind:null,L:null,cp:null,v:0,boost:0,freeze:0,banner:null,warnBeep:-1,hintT:0,padCd:{}};
const FL=17, TOP=6;        // гонка: ряд пола и последний ряд потолка тоннеля
const H0={spark:30,bolt:56}, HD={spark:15,bolt:20};   // рост стоя / пригнувшись
const JV=760, JV2=700, GX=0.45;   // гонка: скорость прыжка и добавка к тяжести (прыжок короче и резче)
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const speedMul=()=>{ const D=diffLv(); return D<0?0.86:D===0?1:D===1?1.08:1.15; };
const warnTime=()=>{ const D=diffLv(); return D<0?2.1:D===0?1.6:D===1?1.25:1.0; };
const live=()=>(players||[]).filter(p=>!p.absent&&!p.dead);
const pidx=p=>players.indexOf(p);
function gp(pi){ try{ return solo?(padFor(0)||padFor(1)):padFor(pi); }catch(e){ return null; } }
function padDn(pi){ const g=gp(pi); return !!g&&((g.axes[1]||0)>0.5||!!(g.buttons[13]&&g.buttons[13].pressed)); }
function padUp(pi){ const g=gp(pi); return !!g&&((g.axes[1]||0)<-0.5||!!(g.buttons[12]&&g.buttons[12].pressed)); }
function banner(t,c,life){ S.banner={t,c:c||'#ffd166',life:life||1.2,max:life||1.2}; }
function worldText(p,t,c){ texts.push({x:p.x+p.w/2,y:p.y-26,t,life:1.1,c:c||'#ffd166',pop:true}); }

/* ---------------- уровни ---------------- */
// трасса: rN бег, w/w2 стенка (прыгать), g ворота с разрядом (пригнуться), pN яма, b турбо-полоса, f флажок, h сердце, k шестерёнки
const DEFS=[
  {kind:'cart',name:'Разгон',desc:'гонка на реактивной доске · учебная',motif:'Паровой коридор',hue:24,par:42,base:290,top:360,boost:120,lead:14,
   hint:'Доска едет сама. Прыжок — через стенки и ямы. Способность (S / ↓) — пригнуться под ворота с разрядом, а в прыжке — резко вниз.',
   track:'r10 w r12 w r12 g r12 g r10 f r8 w r9 w r12 p2 r12 b r18 w r10 g r8 w r12 h w r12 f r8 p2 r8 g r10 w r8 g r12 b r18 w r8 w r8 w r12 g r8 p2 r14'},
  {kind:'cart',name:'Турбо-трасса',desc:'гонка на доске · быстро и плотно',motif:'Литейная',hue:350,par:46,base:350,top:450,boost:140,lead:14,
   hint:'Быстрее и плотнее. Знак справа подсказывает, что впереди: ▲ — прыгай, ▼ — пригнись. После прыжка перед воротами жми ↓ — резко вниз.',
   track:'r10 w r9 g r9 w r8 w r10 p3 r9 g r7 w r10 f r8 b r18 w r7 g r10 g r6 w r10 p2 r8 w r12 h w r9 f r8 b r18 g r6 p3 r8 w r8 w r8 w r10 g r6 g r10 f r8 p2 r7 g r7 w r10 b r18 w r8 p2 r7 g r7 w r7 g r14'},
  {kind:'rope',name:'Спуск в шахту',desc:'спуск на тросе · раскачка и разряды',motif:'Ржавый цех',hue:265,par:60,
   hint:'Вы висите на тросе. ← → раскачка, способность (S / ↓) — спускаться быстрее, прыжок (W / ↑) — подтянуться вверх. Ждите, пока разряд погаснет. Стреляйте по летунам и турелям.'}
];

function cartLevel(D){
  const rows=18, cols=[], obs=[], strips=[], pads=[], flags=[], pick=[];
  const col=()=>{ const c=Array(rows).fill('.'); for(let y=0;y<=TOP;y++) c[y]='#'; c[FL]='#'; return c; };
  cols.push(Array(rows).fill('#'));
  const run=n=>{ for(let i=0;i<n;i++) cols.push(col()); };
  run(D.lead);
  for(const tok of D.track.trim().split(/\s+/)){
    const k=tok[0], n=+tok.slice(1)||0;
    if(k==='r') run(n);
    else if(k==='w'){ const m=n||1; obs.push({t:'jump',x0:cols.length,x1:cols.length+m-1}); for(let i=0;i<m;i++){ const c=col(); c[16]='#'; cols.push(c); } }
    else if(k==='g'){ obs.push({t:'duck',x0:cols.length,x1:cols.length}); const c=col(); for(let y=TOP+1;y<=15;y++) c[y]='#'; strips.push(cols.length); cols.push(c); }
    else if(k==='p'){ const m=n||2; obs.push({t:'jump',x0:cols.length,x1:cols.length+m-1,pit:true}); for(let i=0;i<m;i++){ const c=col(); c[FL]='.'; cols.push(c); } }
    else if(k==='b') pads.push({x:cols.length,cd:0});
    else if(k==='f') flags.push({x:cols.length,on:false});
    else if(k==='h') pick.push({type:'heart',tx:cols.length,ty:14});
    else if(k==='k') for(let i=0;i<3;i++) pick.push({type:'gear',tx:cols.length+i,ty:i===1?13:14});
  }
  run(6); const finishX=cols.length; run(3);
  const ex0=cols.length; for(let i=0;i<3;i++){ const c=col(); c[15]='E'; c[16]='E'; cols.push(c); }
  run(4); cols.push(Array(rows).fill('#'));
  cols[3][16]='1'; cols[5][16]='2';
  const W=cols.length, map=[]; for(let y=0;y<rows;y++){ let s=''; for(let x=0;x<W;x++) s+=cols[x][y]; map.push(s); }
  // безопасные места для возврата после аварии: ровный пол, ничего рядом, до следующего препятствия ≥ 8 клеток
  const spots=[]; for(let x=2;x<finishX;x++){ let ok=true; for(let d=0;d<4&&ok;d++){ const c=cols[x+d]; if(!c||c[FL]!=='#'||c[16]==='#'||c[15]==='#') ok=false; }
    if(!ok) continue; if(obs.some(o=>o.x1>=x-1&&o.x0<x+8)) continue; spots.push(x); }
  for(const f of flags){ const s=spots.filter(x=>x<=f.x).pop(); f.spot=s!=null?s:3; }
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map,enemies:[],pickups:pick,movers:[],winds:[],checkpoints:[],pz:[],tier:0,hand:true,decor:[],darkA:.94,openBottom:true,par:D.par,
    bt:{kind:'cart',obs,strips,pads,flags,spots,finishX,exitC:(ex0+1.5)*T,base:D.base,top:D.top,boost:D.boost,len:W}};
}

function ropeLevel(D){
  const W=32, H=88, A=6, B=25;          // шахта: свободные столбцы A..B
  const g=[...Array(H)].map((_,y)=>{ const r=Array(W).fill('.'); for(let x=0;x<W;x++) if(x<A||x>B) r[x]='#'; return r; });
  for(let x=0;x<W;x++){ g[0][x]='#'; g[H-1][x]='#'; g[H-2][x]='#'; }
  const zaps=[], flags=[], en=[], pick=[];
  const ledge=(y,side,len,spikes)=>{ for(let i=0;i<len;i++){ const x=side==='L'?A+i:B-i; g[y][x]='#'; if(spikes) g[y-1][x]='^'; } };
  const zap=(y,x0,x1,on,off,ph)=>zaps.push({y,x0,x1,on,off,ph});
  // A: учимся качаться
  ledge(11,'R',13,false); ledge(17,'L',13,true);
  pick.push({type:'gear',tx:A+1,ty:12},{type:'gear',tx:A+2,ty:12},{type:'gear',tx:B-1,ty:19});
  // B: разряды и летуны
  zap(24,A,B,1.3,1.9,0); pick.push({type:'heart',tx:A,ty:28}); en.push({type:'flyer',tx:12,ty:30,min:A*T,max:(B+1)*T});
  zap(35,A,B,1.2,1.7,1.1); flags.push({y:38,on:false});
  // C: зигзаг с шипами и турели
  ledge(42,'R',12,true); ledge(45,'L',2,false); en.push({type:'turret',tx:A,ty:44});
  ledge(48,'L',12,true); ledge(51,'R',2,false); en.push({type:'turret',tx:B,ty:50});
  ledge(54,'R',12,true); en.push({type:'flyer',tx:10,ty:57,min:A*T,max:(B+1)*T});
  pick.push({type:'triple',tx:A+1,ty:52}); flags.push({y:60,on:false});
  // D: два разряда по очереди и постоянные полузаборы
  zap(64,A,B,1.4,1.6,0.4); zap(68,A,B,1.4,1.6,1.9);
  en.push({type:'flyer',tx:18,ty:71,min:A*T,max:(B+1)*T});
  zap(75,A,17,0,1,0); zap(80,14,B,0,1,0); pick.push({type:'heart',tx:B,ty:77});
  // дно и выход
  for(let x=13;x<=18;x++){ g[H-3][x]='E'; g[H-4][x]='E'; }
  g[2][15]='1'; g[2][16]='2';
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:en,pickups:pick,movers:[],winds:[],checkpoints:[],pz:[],tier:1,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'rope',zaps,flags,floorY:(H-2)*T,ay:T,A,B,H}};
}
const LEVELS=DEFS.map(D=>D.kind==='cart'?cartLevel(D):ropeLevel(D));

/* ---------------- перехваты движка ---------------- */
const _getLevel=getLevel;
getLevel=function(i){ if(edTest&&edLevel) return edLevel; return LEVELS[i]||LEVELS[LEVELS.length-1]; };

const _loadLevel=loadLevel;
loadLevel=function(i,keepHp){
  _loadLevel(i,keepHp);
  const L=getLevel(i); S.L=L; S.on=!!(L&&L.bt&&!edTest); S.kind=S.on?L.bt.kind:null;
  BTX.z=0; BTX.lx=0; BTX.ly=0; S.banner=null; S.boost=0; S.v=0; S.freeze=0; S.hintT=0;
  if(!S.on) return;
  tutMarks=[];
  if(S.cp&&S.cp.lvl!==i) S.cp=null;
  for(const p of players){ p.duck=false; p.rope=null; p.h0=H0[p.kind]; }
  if(S.kind==='cart') setupCart(L); else setupRope(L);
};
const _tutorInit=tutorInit;
tutorInit=function(i){ _tutorInit(i); if(getLevel(i)&&getLevel(i).bt) tutMarks=[]; };

function placeCart(x){ for(const p of players){ if(p.absent) continue; setDuck(p,false,true);
  const off=solo?0:(p.kind==='bolt'?2:0); p.x=(x+off)*T+(T-p.w)/2; p.y=FL*T-p.h; p.vx=0; p.vy=0; p.dash=0; p.slam=false; p.onGround=true; p.wasGround=true; } }
function setupCart(L){
  BTX.z=1; BTX.lx=VW*0.24;
  const B=L.bt; for(const f of B.flags) f.on=!!(S.cp&&f.spot<=S.cp.x); for(const pd of B.pads) pd.cd=0;
  if(S.cp) placeCart(S.cp.x);
  S.freeze=S.cp?0.9:1.5; banner(S.cp?'С ФЛАЖКА':'ГОТОВЬСЯ…','#9cc3ff',S.freeze);
}
function setupRope(L){
  BTX.z=1; BTX.ly=VH*0.16;
  const B=L.bt; for(const f of B.flags) f.on=!!(S.cp&&f.y*T<=S.cp.y);
  for(const p of players){ if(p.absent) continue;
    const ax=solo?16*T:(p.kind==='spark'?15*T:17*T);
    p.x=ax-p.w/2; p.y=S.cp?S.cp.y:2*T+8; p.vx=0; p.vy=0;
    p.rope={ax,ay:B.ay,vx:0,vy:0,in:{dir:0,up:false,dn:false}}; }
  S.hintT=S.cp?0:7;
}

// пригнуться: хитбокс ниже, ноги на месте; встать — только если над головой свободно
function setDuck(p,on,force){
  const h0=H0[p.kind], hd=HD[p.kind];
  if(on&&!p.duck){ p.y+=h0-hd; p.h=hd; p.duck=true; }
  else if(!on&&p.duck){ if(force||!tileHit(p.x,p.y-(h0-hd),p.w,h0-hd+1)){ p.y-=h0-hd; p.h=h0; p.duck=false; } }
}

const _control=control;
control=function(p,inp,dt){
  if(!S.on||p.absent) return _control(p,inp,dt);
  const pi=pidx(p);
  if(S.kind==='cart'){
    const dn=inp.ab||padDn(pi);
    if(p.down||p.dead) return _control(p,inp,dt);
    setDuck(p,dn&&p.wasGround&&!inp.jp);
    const q=Object.assign({},inp,{dir:0,ab:false,ap:false,use:inp.use,nx:inp.nx});
    if(p.duck){ q.jump=false; q.jp=false; }
    if(!p.wasGround&&p.vy<0) q.jump=true;          // прыжок на доске всегда полный (без «короткого»)
    const wg=p.wasGround, vy0=p.vy;
    _control(p,q,dt);
    if(p.vy<vy0-300&&p.vy<=-600) p.vy=wg?-JV:-JV2;   // одинаковая дуга прыжка у обоих героев
    p.face=1;
    if(dn&&!p.wasGround&&!p.onGround&&p.y+p.h<FL*T-4){   // ↓ в воздухе — резко вниз (успеть под ворота после прыжка)
      if(p.vy<900){ p.vy=900; p.cut=true; p.sx=.8; p.sy=1.25; }
      if(Math.random()<.6) addP({x:p.x+p.w/2+(Math.random()-.5)*p.w,y:p.y,vx:0,vy:-120,life:.2,max:.2,c:p.kind==='spark'?'#ffd1a8':'#9cc3ff',s:2.5,g:0}); }
    let v=S.v; const B=S.L.bt;
    if(p.x>B.finishX*T-T){ const stop=B.exitC-p.w/2+(solo?0:(p.kind==='bolt'?14:-14)); v=Math.min(v,Math.sqrt(2*1300*Math.max(0,stop-p.x))); }
    p.vx=v;
    return;
  }
  if(S.kind==='rope'&&p.rope){
    p.rope.in={dir:inp.dir,up:!!inp.jump||padUp(pi),dn:!!inp.ab||padDn(pi)};
    _control(p,{dir:inp.dir,jump:false,jp:false,ab:false,ap:false,fire:inp.fire,use:inp.use,nx:inp.nx},dt);
    return;
  }
  return _control(p,inp,dt);
};

const _physics=physics;
physics=function(e,h){ if(S.on&&S.kind==='rope'&&e.rope) return ropePhys(e,h); if(S.on&&S.kind==='cart'&&e.kind!=='crate'&&!e.slam) e.vy+=G*GX*h; return _physics(e,h); };
function ropePhys(p,h){
  const R=p.rope, B=S.L.bt;
  if(p.vy<-420){ R.vy=-300; }                     // отскок: прыжок на врага / шипы
  const L=Math.max(160,p.y-R.ay), dx=p.x+p.w/2-R.ax;
  R.vx+=(R.in.dir*1500-dx*(G/L)*0.5)*h; R.vx*=1-1.1*h; R.vx=clamp(R.vx,-430,430);
  let want=R.in.dn?300:R.in.up?-150:70;
  if(!solo){ const o=players.find(q=>q!==p&&!q.absent&&!q.dead); if(o&&want>0&&p.y>o.y+7*T) want=0; }
  R.vy=approach(R.vy,want,1500*h);
  const nx=p.x+R.vx*h;
  if(tileHit(nx,p.y,p.w,p.h)){ if(Math.abs(R.vx)>160){ sfx('on'); dust(R.vx>0?p.x+p.w:p.x,p.y+p.h/2,4,'#9cc3ff'); } R.vx=-R.vx*0.35; } else p.x=nx;
  const ny=p.y+R.vy*h;
  if(ny<R.ay+4){ p.y=R.ay+4; R.vy=Math.max(0,R.vy); }
  else if(tileHit(p.x,ny,p.w,p.h)){
    if(R.vy>0){ p.y=Math.floor((ny+p.h)/T)*T-p.h;
      if(p.y+p.h>=B.floorY-1){ p.rope=null; p.vx=0; p.vy=0; p.onGround=true; p.ground=null; sfx('jump'); dust(p.x+p.w/2,p.y+p.h,8,'#ffd1a8'); worldText(p,'ВНИЗУ!','#7fe08a'); return; } }
    R.vy=0;
  } else p.y=ny;
  p.vx=R.vx; p.vy=R.vy; p.onGround=false; p.ground=null;
}

const _hurt=hurt;
hurt=function(p){
  const was=p.hp; _hurt(p);
  if(!S.on||state!=='play') return;
  if(S.log&&p.hp<was&&S.kind==='rope') S.log.push(p.kind+'@'+(p.x/T).toFixed(1)+','+(p.y/T).toFixed(1));
  if(p.rope&&p.hp<was){ p.rope.vy=-200; }
  if(p.down&&!p.dead) die(p,'down');
};

const _complete=complete;
complete=function(){ if(S.on) S.cp=null; return _complete(); };

const _step=step;
step=function(dt){
  if(!S.on) return _step(dt);
  if(S.kind==='cart') cartPre(dt);
  _step(dt);
  if(S.banner){ S.banner.life-=dt; if(S.banner.life<=0) S.banner=null; }
  if(state!=='play') return;
  if(S.kind==='cart') cartPost(dt); else ropePost(dt);
};

function cartPre(dt){
  const B=S.L.bt, L=live(); if(!L.length) return;
  const lead=Math.max(...L.map(p=>p.x));
  if(S.freeze>0){ S.freeze-=dt; S.v=0; if(S.freeze<=0){ banner('ВПЕРЁД!','#ffd166',0.9); sfx('boost'); tone(520,1040,.18,'square',.05); } return; }
  const prog=clamp(lead/T/B.finishX,0,1), mul=speedMul();
  const target=(B.base+(B.top-B.base)*prog)*mul+(S.boost>0?B.boost*mul:0);
  S.v=approach(S.v,target,(S.v<target?650:320)*dt); S.boost=Math.max(0,S.boost-dt);
}
function cartPost(dt){
  const B=S.L.bt, L=live(); if(!L.length) return;
  const lead=Math.max(...L.map(p=>p.x+p.w));
  // турбо-полосы
  for(const pd of B.pads){ pd.cd=Math.max(0,pd.cd-dt); if(pd.cd>0) continue;
    const r={x:pd.x*T,y:FL*T-12,w:2*T,h:14}; const p=L.find(q=>overlap(q,r)); if(p){ pd.cd=3; S.boost=1.8; sfx('boost'); flash('#ffb347',.18); shake=Math.max(shake,3); worldText(p,'ТУРБО!','#ffb347'); for(const q of L) burst(q.x,q.y+q.h,10,['#ffd166','#ff8a3d'],260,.4); } }
  // флажки
  for(const f of B.flags) if(!f.on&&lead>f.x*T){ f.on=true; S.cp={lvl:levelIdx,x:f.spot}; sfx('pk_shield'); const p=L[0]; texts.push({x:f.x*T,y:FL*T-120,t:'ФЛАЖОК!',life:1.4,c:'#7fe08a',pop:true}); burst(f.x*T+6,FL*T-80,18,['#7fe08a','#fff'],220,.5); }
  if(S.freeze>0) return;
  // аварии
  const hit=[];
  for(const p of L){ if(p.x>B.finishX*T) continue;
    let why=null;
    if(tileHit(p.x+2,p.y+3,p.w,p.h-6)) why='wall';
    else if(p.y>FL*T+4) why='pit';
    else for(const sx of B.strips){ if(overlap(p,{x:sx*T,y:FL*T-40,w:T,h:16})){ why='zap'; break; } }
    if(why) hit.push([p,why]); }
  if(hit.length) crash(hit);
}
function crash(hit){
  const B=S.L.bt; if(S.log) S.log.push(hit.map(h=>h[0].kind+':'+h[1]+'@'+(h[0].x/T).toFixed(1)+','+(h[0].y/T).toFixed(1)+(h[0].duck?'d':'')).join(' '));
  for(const [p,why] of hit){
    burst(p.x+p.w/2,p.y+p.h/2,22,why==='zap'?['#9cf','#fff','#62c7c1']:['#ffd166','#ff8a3d','#fff'],360,.6);
    p.inv=0; _hurt(p);
    texts.push({x:p.x+p.w/2,y:p.y-30,t:why==='pit'?'ПРОВАЛ!':why==='zap'?'РАЗРЯД!':'БАХ!',life:1.1,c:'#ff6b6b',pop:true});
    if(p.down||p.hp<=0){ p.down=false; die(p,'down'); return; }
  }
  sfx('hit'); shake=Math.max(shake,9); flash(hit[0][1]==='zap'?'#9cf':'#ff3b4e',.35); hitstop=Math.max(hitstop,.12);
  const minX=Math.min(...hit.map(h=>h[0].x))/T;
  const spot=B.spots.filter(x=>x+4<=minX).pop(); placeCart(spot!=null?spot:3);
  for(const p of players) if(!p.absent){ p.inv=Math.max(p.inv,1.6); }
  S.v=0; S.boost=0; S.freeze=0.85; banner('ЕЩЁ РАЗ!','#ff9a8a',0.85);
}

function zapOn(z){ if(!z.on) return 'on'; const t=(levelTime+z.ph)%(z.on+z.off); return t<z.off?(t>z.off-0.6?'warn':'off'):'on'; }
function ropePost(dt){
  const B=S.L.bt, L=live(); S.hintT=Math.max(0,S.hintT-dt);
  for(const z of B.zaps){ if(zapOn(z)!=='on') continue; const r={x:z.x0*T,y:z.y*T+T/2-6,w:(z.x1-z.x0+1)*T,h:12};
    for(const p of L) if(!p.down&&p.inv<=0&&overlap(p,r)){ burst(p.x+p.w/2,p.y+p.h/2,16,['#9cf','#fff'],300,.5); flash('#9cf',.3); texts.push({x:p.x+p.w/2,y:p.y-26,t:'РАЗРЯД!',life:1,c:'#9cf',pop:true}); hurt(p); if(p.rope) p.rope.vy=-260; } }
  for(const f of B.flags){ if(f.on) continue; const p=L.find(q=>q.y>f.y*T); if(p){ f.on=true; S.cp={lvl:levelIdx,y:f.y*T}; sfx('pk_shield'); texts.push({x:B.A*T+60,y:f.y*T-20,t:'ФЛАЖОК!',life:1.4,c:'#7fe08a',pop:true}); } }
}

/* ---------------- рисование ---------------- */
const _drawBolt=drawBolt, _drawSpark=drawSpark;
drawBolt=function(p){ if(S.on&&p===players[1]&&grid) { try{ drawWorld(); }catch(e){} } heroDraw(_drawBolt,p); };
drawSpark=function(p){ heroDraw(_drawSpark,p); };
function heroDraw(f,p){
  if(!S.on||!p||!players||(p!==players[0]&&p!==players[1])||p.absent||p.dead) return f(p);
  if(S.kind==='rope'&&p.rope){ drawRope(p); return f(p); }
  if(S.kind==='cart'){
    if(p.duck){ const h=p.h,y=p.y,sx=p.sx,sy=p.sy; p.y=y+h-H0[p.kind]; p.h=H0[p.kind]; p.sx=1.22; p.sy=HD[p.kind]/H0[p.kind]*1.08; ctx.save(); ctx.translate(0,-6); f(p); ctx.restore(); p.h=h; p.y=y; p.sx=sx; p.sy=sy; }
    else { ctx.save(); ctx.translate(0,-6); f(p); ctx.restore(); }
    drawBoard(p); return;
  }
  f(p);
}
function drawBoard(p){
  const x=p.x+p.w/2, y=p.y+p.h-5, L=p.kind==='bolt'?56:46, c=p.kind==='bolt'?'#62c7c1':'#ff8a3d', sp=S.v;
  ctx.save(); ctx.translate(x,y);
  if(sp>40){ const fl=10+sp/22+Math.sin(clock*40)*4+(S.boost>0?18:0);
    const gr=ctx.createLinearGradient(-L/2,0,-L/2-fl,0); gr.addColorStop(0,'#fff3c4'); gr.addColorStop(.4,S.boost>0?'#c79bff':'#ffb347'); gr.addColorStop(1,'rgba(255,90,40,0)');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(-L/2+2,-1); ctx.lineTo(-L/2-fl,3); ctx.lineTo(-L/2+2,7); ctx.closePath(); ctx.fill(); }
  ctx.globalAlpha=.35+.15*Math.sin(clock*9); ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(0,10,L*.45,3,0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
  ctx.fillStyle='#22324d'; ctx.beginPath(); ctx.moveTo(-L/2,0); ctx.lineTo(L/2-6,0); ctx.quadraticCurveTo(L/2+4,0,L/2+6,-6); ctx.lineTo(L/2,7); ctx.lineTo(-L/2+3,7); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#e7b54a'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle=c; ctx.fillRect(-L/2+6,2,L-16,2.5);
  ctx.restore();
}
function drawRope(p){
  const R=p.rope, tx=p.x+p.w/2, ty=p.y+(p.kind==='spark'?2:4);
  ctx.save(); ctx.strokeStyle='#4a3a26'; ctx.lineWidth=4; ctx.lineCap='round';
  const mx=(R.ax+tx)/2-R.vx*0.06, my=(R.ay+ty)/2;
  ctx.beginPath(); ctx.moveTo(R.ax,R.ay); ctx.quadraticCurveTo(mx,my,tx,ty); ctx.stroke();
  ctx.strokeStyle='#c9a46a'; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.lineDashOffset=-(p.y*0.5); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#e7b54a'; ctx.beginPath(); ctx.arc(tx,ty,4,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function drawWorld(){
  const B=S.L.bt;
  if(S.kind==='cart'){
    for(const sx of B.strips){ const x=sx*T, y=FL*T-40, a=.75+.25*Math.sin(clock*30+sx);
      ctx.save();
      for(let k=0;k<5;k++){ ctx.fillStyle=k%2?'#1d2638':'#ffd166'; ctx.beginPath(); ctx.moveTo(x+k*8,y-8); ctx.lineTo(x+k*8+8,y-8); ctx.lineTo(x+k*8+4,y); ctx.lineTo(x+k*8-4,y); ctx.closePath(); ctx.fill(); }
      const gl=ctx.createLinearGradient(0,y-4,0,y+22); gl.addColorStop(0,'rgba(98,214,255,.55)'); gl.addColorStop(1,'rgba(98,214,255,0)'); ctx.globalAlpha=a; ctx.fillStyle=gl; ctx.fillRect(x-6,y-2,T+12,24);
      ctx.strokeStyle='#e8fbff'; ctx.lineWidth=3; ctx.shadowColor='#62d6ff'; ctx.shadowBlur=14*GLOW;
      for(const off of [0,1]){ ctx.beginPath(); for(let k=0;k<=8;k++){ const xx=x-2+k*(T+4)/8, yy=y+5+off*5+((k+off)%2?-4:4)*(0.5+0.5*Math.sin(clock*55+k*1.3+off)); k?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy); } ctx.stroke(); ctx.lineWidth=1.6; }
      if(state==='play'&&Math.random()<.25) addP({x:x+Math.random()*T,y:y+8,vx:(Math.random()-.5)*120,vy:-30-Math.random()*60,life:.25,max:.25,c:'#bfefff',s:2,g:.6});
      ctx.restore(); }
    for(const pd of B.pads){ const x=pd.x*T, y=FL*T-6; ctx.save(); for(let k=0;k<4;k++){ const ph=(clock*4-k*.25)%1; ctx.globalAlpha=pd.cd>0?.25:.45+.55*(1-ph); ctx.fillStyle='#ffb347';
        const xx=x+8+k*18; ctx.beginPath(); ctx.moveTo(xx,y-3); ctx.lineTo(xx+12,y+2); ctx.lineTo(xx,y+7); ctx.lineTo(xx+5,y+2); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    for(const f of B.flags){ const x=f.x*T+6, y=FL*T; ctx.save(); ctx.strokeStyle='#c7d3dd'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y-86); ctx.stroke();
      ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.beginPath(); ctx.moveTo(x,y-86); ctx.quadraticCurveTo(x+18,y-80+Math.sin(clock*6)*3,x+30,y-76); ctx.lineTo(x,y-64); ctx.closePath(); ctx.fill(); ctx.restore(); }
    { const x=B.finishX*T; ctx.save(); for(let r=0;r<10;r++) for(let k=0;k<2;k++){ ctx.fillStyle=(r+k)%2?'#0b1830':'#e8effa'; ctx.fillRect(x+k*8,(TOP+1)*T+r*16,8,16); }
      ctx.fillStyle='#ffd166'; ctx.font="900 14px Unbounded, 'Arial Black', sans-serif"; ctx.textAlign='center'; ctx.fillText('ФИНИШ',x+8,(TOP+1)*T+176); ctx.restore(); }
  } else {
    const ax=solo?[16*T]:[15*T,17*T]; ctx.save(); for(const x of ax){ ctx.fillStyle='#6f8191'; ctx.beginPath(); ctx.arc(x,B.ay+2,9,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#22324d'; ctx.beginPath(); ctx.arc(x,B.ay+2,4,0,Math.PI*2); ctx.fill(); } ctx.restore();
    for(const z of B.zaps){ const st=zapOn(z), x0=z.x0*T, x1=(z.x1+1)*T, y=z.y*T+T/2;
      ctx.save(); ctx.fillStyle='#3a4660'; ctx.fillRect(x0-2,y-9,10,18); ctx.fillRect(x1-8,y-9,10,18);
      ctx.fillStyle=st==='on'?'#bfefff':st==='warn'?(Math.floor(clock*14)%2?'#ffd166':'#6f8191'):'#6f8191'; ctx.fillRect(x0+1,y-4,5,8); ctx.fillRect(x1-6,y-4,5,8);
      if(st==='on'){ ctx.strokeStyle='#bfefff'; ctx.lineWidth=2.6; ctx.shadowColor='#62d6ff'; ctx.shadowBlur=14*GLOW; ctx.beginPath();
        const n=Math.max(6,Math.round((x1-x0)/22)); for(let k=0;k<=n;k++){ const xx=x0+6+k*(x1-x0-12)/n, yy=y+(k%2?-5:5)*(0.5+0.5*Math.sin(clock*60+k*1.7)); k?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy); } ctx.stroke();
        ctx.globalAlpha=.25; ctx.fillStyle='#62d6ff'; ctx.fillRect(x0+6,y-6,x1-x0-12,12); }
      else { ctx.globalAlpha=st==='warn'?.6:.25; ctx.strokeStyle=st==='warn'?'#ffd166':'#9cc3ff'; ctx.lineWidth=1.5; ctx.setLineDash([4,6]); ctx.beginPath(); ctx.moveTo(x0+6,y); ctx.lineTo(x1-6,y); ctx.stroke(); ctx.setLineDash([]); }
      ctx.restore(); }
    for(const f of B.flags){ const x=B.A*T+4, y=f.y*T; ctx.save(); ctx.strokeStyle='#c7d3dd'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+40,y); ctx.stroke();
      ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.beginPath(); ctx.moveTo(x+40,y); ctx.lineTo(x+40,y+26); ctx.lineTo(x+16+Math.sin(clock*5)*3,y+13); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
}

const _drawHud=drawHud;
drawHud=function(){ _drawHud(); if(S.on&&players&&!intro&&(state==='play'||state==='dying'||state==='pause')) try{ hud(); }catch(e){} };
function label(t,x,y,sz,c,al){ ctx.font=`400 ${sz}px 'Russo One', Unbounded, sans-serif`; ctx.textAlign=al||'center'; ctx.textBaseline='middle'; ctx.lineJoin='round'; ctx.lineWidth=Math.max(3,sz/5); ctx.strokeStyle='rgba(6,10,22,.92)'; ctx.strokeText(t,x,y); ctx.fillStyle=c; ctx.fillText(t,x,y); }
function hud(){
  const B=S.L.bt, L=live();
  if(S.kind==='cart'){
    const w=520, x=VW/2-w/2, y=VH-26;
    ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-8,y-10,w+16,20,10); ctx.fill();
    ctx.fillStyle='rgba(156,195,255,.25)'; rr(ctx,x,y-3,w,6,3); ctx.fill();
    for(const f of B.flags){ ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.fillRect(x+w*f.x/B.finishX-1,y-8,3,16); }
    ctx.fillStyle='#ffd166'; ctx.fillRect(x+w-2,y-9,4,18);
    for(const p of L){ const k=clamp(p.x/T/B.finishX,0,1); ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.arc(x+w*k,y,6,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#0b1830'; ctx.lineWidth=2; ctx.stroke(); }
    const kmh=Math.round(S.v*0.62);
    label(kmh+' км/ч',VW-T*1.2,VH-28,20,S.boost>0?'#c79bff':'#e8effa','right');
    if(S.boost>0) label('ТУРБО',VW-T*1.2,VH-54,13,'#ffb347','right');
    // знак «что впереди»
    if(S.freeze<=0&&L.length){ const front=Math.max(...L.map(p=>p.x+p.w)), v=Math.max(S.v,180), wt=warnTime();
      const o=B.obs.find(o=>(o.x1+1)*T>front-8);
      if(o){ const tt=(o.x0*T-front)/v; if(tt<wt){
        const up=o.t==='jump', blink=Math.floor(clock*(tt<wt*.45?12:6))%2===0, cx=VW-T*2.6, cy=VH*0.42;
        if(S.warnBeep!==o){ S.warnBeep=o; tone(up?880:440,up?1320:330,.08,'square',.035); }
        ctx.save(); ctx.globalAlpha=blink?1:.45; ctx.fillStyle=up?'#ffd166':'#ff6b6b'; ctx.strokeStyle='#0b1830'; ctx.lineWidth=4;
        ctx.beginPath(); ctx.arc(cx,cy,34,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#0b1830'; ctx.beginPath(); if(up){ ctx.moveTo(cx,cy-20); ctx.lineTo(cx+18,cy+10); ctx.lineTo(cx-18,cy+10); } else { ctx.moveTo(cx,cy+20); ctx.lineTo(cx+18,cy-10); ctx.lineTo(cx-18,cy-10); } ctx.closePath(); ctx.fill();
        ctx.restore(); label(up?(o.pit?'ЯМА — ПРЫЖОК':'ПРЫЖОК'):'ПРИГНИСЬ',cx,cy+52,14,up?'#ffd166':'#ff6b6b'); } } }
  } else {
    const x=VW-T*0.9, y0=T*1.6, y1=VH-T*1.6, Hh=(B.H-3)*T;
    ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-9,y0-8,18,y1-y0+16,9); ctx.fill();
    ctx.fillStyle='rgba(156,195,255,.25)'; rr(ctx,x-3,y0,6,y1-y0,3); ctx.fill();
    for(const f of B.flags){ ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.fillRect(x-8,y0+(y1-y0)*f.y*T/Hh-1,16,3); }
    for(const p of L){ const k=clamp(p.y/Hh,0,1); ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.arc(x,y0+(y1-y0)*k,6,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#0b1830'; ctx.lineWidth=2; ctx.stroke(); }
    const d=L.length?Math.round(Math.max(...L.map(p=>p.y))/T*1.5):0; label(d+' м',x-16,y1+22,15,'#e8effa','right');
    if(S.hintT>0){ ctx.globalAlpha=Math.min(1,S.hintT); label('← → раскачка   ·   ↓ / S быстрее   ·   ↑ / W подтянуться',VW/2,VH-26,15,'#e8effa'); ctx.globalAlpha=1; }
  }
  if(S.banner){ const b=S.banner, a=Math.min(1,b.life*3), s=1+Math.max(0,(b.life-b.max+0.18))*2.5; ctx.save(); ctx.globalAlpha=a; ctx.translate(VW/2,VH*0.3); ctx.scale(s,s); label(b.t,0,0,46,b.c); ctx.restore(); }
}

/* ---------------- меню испытаний ---------------- */
const BEST_KEY='iskra-bolt-bt-best';
const bestOf=i=>{ const a=store.get(BEST_KEY+modeSuffix(),{}); return a[i]; };
const _complete2=complete;
complete=function(){ if(S.on&&!edTest&&!demo){ const a=store.get(BEST_KEY+modeSuffix(),{}); const o=a[levelIdx]; if(!o||levelTime<o) { a[levelIdx]=Math.round(levelTime*10)/10; store.set(BEST_KEY+modeSuffix(),a); } } return _complete2(); };
function modeName(){ return solo?('1 игрок · '+(soloHero==='spark'?'Искра':'Болт')):'2 игрока'; }
function startBt(i){ S.cp=null; cpSave=null; sfx('pick'); startGame(i,true); }
const DORDER=['easy','normal','hard','nightmare'];
const _setState=setState;
setState=function(s){
  if(s==='ending'){ _setState('btend');
    overlay.innerHTML=`<div class="card"><span class="eyebrow">Испытания пройдены</span><h2><span class="s">Искра</span> и <span class="b">Болт</span> справились!</h2>
      <p style="max-width:46ch">Это тестовая версия: три испытания в духе старых аркад. Напишите, что понравилось и что поправить — по ним будем решать, брать ли такие уровни в основную игру.</p>
      <p>Общее время <span class="big">${fmt(totalTime)}</span> · падений <span class="big">${deaths}</span></p>
      <div class="btns"><button class="primary" id="btAgain" type="button">К испытаниям</button></div></div>`;
    $('btAgain').onclick=()=>setState('menu'); setTimeout(()=>{ try{ $('btAgain').focus(); }catch(e){} },0); return; }
  if(s==='menu'){ _setState('menu');
    const df=diffId();
    overlay.innerHTML=`<div class="card menu">
      <h2 class="mlogo"><span class="s">Искра</span> и <span class="b">Болт</span><span class="beta sm">ТЕСТ</span></h2>
      <p class="padst" style="margin:-4px 0 10px">Испытания на скорость и реакцию — отдельная тестовая версия.</p>
      <div class="mlist">
        ${DEFS.map((D,i)=>{ const b=bestOf(i); return `<button class="${i===0?'primary mbig':'secondary'}" data-bt="${i}" type="button">${i+1}. ${D.name}<small>${D.desc}${b?' · рекорд '+b.toFixed(1)+' с':''}</small></button>`; }).join('')}
        <button class="secondary" id="btMode" type="button">Режим игры<small>${modeName()}</small></button>
        <button class="secondary" id="btDiff" type="button">Сложность<small style="color:${DIFFS[df].c}">${DIFFS[df].n}</small></button>
        <button class="secondary" id="btHelp" type="button">Как играть<small>управление в испытаниях</small></button>
        <button class="secondary" id="bSet" type="button">Настройки<small>звук, графика, управление</small></button>
      </div></div>`;
    overlay.querySelectorAll('[data-bt]').forEach(b=>b.onclick=()=>startBt(+b.dataset.bt));
    $('btMode').onclick=()=>{ modesBack='menu'; setState('modes'); };
    $('btDiff').onclick=()=>{ const k=DORDER[(DORDER.indexOf(diffId())+1)%DORDER.length]; run.diff=k; saveRun(); sfx('nav'); setState('menu'); setTimeout(()=>{ try{ $('btDiff').focus(); }catch(e){} },0); };
    $('btHelp').onclick=()=>setState('bthelp');
    $('bSet').onclick=()=>{ setBack='menu'; setCat=null; setState('settings'); };
    return; }
  if(s==='bthelp'){ _setState('bthelp');
    overlay.innerHTML=`<div class="card wide"><span class="eyebrow">Как играть</span><h2>Испытания</h2>
      <div style="text-align:left;max-width:62ch;margin:0 auto;line-height:1.5">
      <p><b style="color:#ffd166">Гонка на доске.</b> Доска едет вправо сама и разгоняется. <b>Прыжок</b> — через стенки и ямы. <b>Способность</b> (S, ↓ или кнопка X/□) — пригнуться под ворота с разрядом, а в воздухе — резко вниз. Знак справа заранее мигает: ▲ — прыгать, ▼ — пригнуться. Оранжевые стрелки на полу — турбо. Врезались — минус сердце и назад к безопасному месту; флажки сохраняют прогресс.</p>
      <p><b style="color:#62c7c1">Спуск на тросе.</b> Герой висит на тросе. ← → — раскачка, <b>способность</b> — спускаться быстрее, <b>прыжок</b> — подтянуться вверх. Синие разряды включаются и гаснут — ждите паузу. Шипы на уступах и турели ранят, летунов можно сбить выстрелом или прыжком сверху.</p>
      <p>Вдвоём каждый управляет своим героем; врезался один — оба возвращаются назад.</p></div>
      <div class="btns"><button class="primary" id="btHB" type="button">Назад · Esc</button></div></div>`;
    $('btHB').onclick=()=>setState('menu'); return; }
  if(s==='modes'){ _setState('modes');
    overlay.innerHTML=`<div class="card"><span class="eyebrow">Режим игры</span><h2>Как играем?</h2>
      <div class="mgrid">
        <button class="${solo?'primary':'secondary'}" id="bMOne" type="button">1 игрок<small>${solo?'сейчас: '+(soloHero==='spark'?'Искра':'Болт')+' · сменить героя':'выбрать героя'}</small></button>
        <button class="${!solo?'primary':'secondary'}" id="bMTwo" type="button">2 игрока<small>за одной клавиатурой или с геймпадами</small></button>
        <button class="secondary" id="bModesBack" type="button">Назад · Esc</button>
      </div></div>`;
    $('bMOne').onclick=()=>{ heroBack='modes'; setState('hero'); };
    $('bMTwo').onclick=()=>{ if(solo){ setMode(false); loadLevel(0); renderLegend(true); } sfx('pick'); setState('menu'); };
    $('bModesBack').onclick=()=>setState(modesBack); return; }
  _setState(s);
  if(s==='title'){ for(const id of ['bOnline','tArena','tEditor','tMyGame']){ const el=document.getElementById(id); if(el) el.remove(); }
    const two=document.getElementById('bTwo'); if(two){ const sm=two.querySelector('small'); if(sm) sm.textContent='за одной клавиатурой'; }
    const beta=overlay.querySelector('.logo .beta'); if(beta) beta.textContent='ИСПЫТАНИЯ'; }
  if(s==='done'){ const bx=overlay.querySelector('.btns'); if(bx&&!document.getElementById('btToMenu')){ bx.insertAdjacentHTML('beforeend','<button class="secondary" id="btToMenu" type="button">К испытаниям</button>'); $('btToMenu').onclick=()=>setState('menu'); }
    const eb=overlay.querySelector('.eyebrow'); if(eb) eb.textContent='Испытание '+(levelIdx+1)+' из '+TOTAL+' пройдено'; const nb=$('bNext'); if(nb) nb.firstChild.textContent='Следующее испытание · Enter'; }
  if(s==='loading'&&loadJob){ const ebs=overlay.querySelectorAll('.eyebrow'); if(ebs[0]) ebs[0].textContent='Испытание '+(loadJob.i+1)+' из '+TOTAL; if(ebs[1]) ebs[1].textContent=DIFFS[diffId()].n+' · '+modeName();
    const L=getLevel(loadJob.i); overlay.querySelectorAll('p').forEach(p=>{ if(p.textContent&&p.textContent.length>40) p.textContent=L.hint; }); }
};
const _handleMeta=handleMeta;
handleMeta=function(){ if((state==='bthelp'||state==='btend')&&pressed.has('Escape')){ setState('menu'); return; } return _handleMeta(); };

return {S,LEVELS,DEFS,setDuck,crash};
})();
/* ===== /ИСПЫТАНИЯ ===== */
