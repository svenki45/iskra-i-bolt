/* ===== ИСПЫТАНИЯ (тестовая Steam-сборка desktop-bt): уровни-аттракционы в духе старых аркад =====
   Вставляется сборщиком tools/bt/build.py внутрь кода игры (перед const GAME_VER) — только в копию desktop-bt.
   Основная игра этот файл не видит. Механики свои: доска, трос, пресс, змеи, канал, драка, ракета, погоня за Механиком. */
/*BT_N=10*/
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
   hint:'Вы висите на тросе. ← → раскачка, способность (S / ↓) — спускаться быстрее, прыжок (W / ↑) — подтянуться вверх. Ждите, пока разряд погаснет. Стреляйте по летунам и турелям.'},
  {kind:'chase',name:'Пресс',desc:'погоня вниз · сверху опускается пресс',motif:'Котельная',hue:5,par:70,
   hint:'Сверху опускается огромный пресс! Беги к дыре в полу и прыгай вниз, этаж за этажом. Перепрыгивай шипы, жуков дави или бей. Болт: способность на земле — СМЭШ.'},
  {kind:'snake',name:'Змеиный мост',desc:'езда на механических змеях над шипами',motif:'Сборочный конвейер',hue:140,par:70,
   hint:'Внизу шипы. По кругу ездят механические змеи — запрыгивай на спину и катайся, а наверху прыгай на следующую опору. Упал — минус сердце и назад на опору.'},
  {kind:'cart',name:'Канал',desc:'доска по воде · рыбы-роботы и водовороты',motif:'Масляный подвал',hue:200,par:46,base:320,top:410,boost:130,lead:14,water:true,
   hint:'Доска скользит по воде. Водовороты и выпрыгивающих рыб-роботов перепрыгивай, под балками пригибайся.',
   track:'r12 F r12 w r10 g r10 p2 r10 F r9 F r12 f r8 g r9 F r10 p3 r10 w r8 b r18 F r8 g r10 F r9 h p2 r10 F r8 w r10 f r8 g r8 F r10 p2 r9 F r8 g r10 F r8 F r10 b r18 w r8 F r14'},
  {kind:'brawl',name:'Драка в цеху',desc:'арена · 5 волн врагов, смэш Болта',motif:'Литейная',hue:330,par:90,
   hint:'Пять волн врагов. Болт: способность на земле — СМЭШ, враги отлетают и бьются о стены. Искра: рывок обжигает врагов. Победите всех — откроется выход.'},
  {kind:'rocket',name:'Ракета',desc:'полёт по пещере · топливо и дроны',motif:'Медный тоннель',hue:180,par:50,base:300,top:380,
   hint:'Ракета летит сама. Прыжок (W / ↑) — вверх, способность (S / ↓) — вниз. Не задевай стены, сбивай дронов, собирай шестерёнки — это топливо.'},
  {kind:'tube',name:'Труба',desc:'скольжение по трубе · заслонки с «окошком»',motif:'Медный тоннель',hue:160,par:55,base:290,top:380,
   hint:'Вы скользите по извилистой трубе. Прыжок (W / ↑) — вверх, способность (S / ↓) — вниз. В заслонках ходит «окошко» — подгадай и пролети через него.'},
  {kind:'cart',name:'Погоня за Механиком',desc:'гонка на доске · сбей Механика до финиша',motif:'Ржавый цех',hue:20,par:50,base:330,top:420,boost:130,lead:16,rival:12,
   hint:'Механик удирает на своей доске и бросает мины. Стреляй в него и сбей до финиша! Мины перепрыгивай.',
   track:'r14 w r12 g r12 w r10 p2 r12 g r12 f r10 w r12 g r10 b r18 w r10 p2 r12 g r12 h w r12 f r10 g r12 w r10 p3 r12 g r10 w r12 b r18 w r12 g r12 w r14'}
];

function cartLevel(D){
  const rows=18, cols=[], obs=[], strips=[], pads=[], flags=[], pick=[], fish=[];
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
    else if(k==='F'){ obs.push({t:'jump',x0:cols.length,x1:cols.length,fish:true}); fish.push({x:cols.length,t:-1}); cols.push(col()); }
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
    bt:{kind:'cart',obs,strips,pads,flags,spots,finishX,exitC:(ex0+1.5)*T,base:D.base,top:D.top,boost:D.boost,len:W,fish,water:!!D.water,rival:D.rival||0}};
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

/* ================= испытания 4–9 ================= */
const PLATF={chase:1,snake:1,brawl:1};
// ---------- погоня вниз: пресс сверху ----------
function chaseLevel(D){
  const W=32, H=104, A=3, B=28;
  const g=[...Array(H)].map(()=>{ const r=Array(W).fill('.'); for(let x=0;x<W;x++) if(x<A||x>B) r[x]='#'; return r; });
  for(let x=0;x<W;x++){ g[0][x]='#'; g[H-1][x]='#'; g[H-2][x]='#'; }
  const R=rng(4242), en=[], pick=[], layers=[]; let side=1, prevGap=[A,A+2];
  for(let y=7,k=0;y<=H-8;y+=6,k++){
    for(let x=A;x<=B;x++) g[y][x]='#';
    const gx=side>0?B-4-Math.floor(R()*3):A+2+Math.floor(R()*3);
    for(let x=gx;x<gx+3;x++) g[y][x]='.';
    if(k>0&&R()<.65){ const sx=side>0?A+8+Math.floor(R()*5):B-13+Math.floor(R()*5); for(let x=sx;x<sx+2;x++) g[y-1][x]='^'; }
    if(k>1&&R()<.38) en.push({type:'crawler',tx:side>0?B-9:A+9,ty:y-1,min:A*T,max:(B+1)*T,trait:null});
    if(k%4===3) pick.push({type:'heart',tx:side>0?A+1:B-1,ty:y-2});
    layers.push({y,land:k?prevGap:[A+1,A+4],gap:[gx,gx+2]}); prevGap=[gx,gx+2]; side=-side;
  }
  for(let x=13;x<=18;x++){ g[H-3][x]='E'; g[H-4][x]='E'; }
  g[6][A+1]='1'; g[6][A+3]='2';
  const flags=[4,8,12].filter(i=>i<layers.length).map(i=>({i,on:false}));
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:en,pickups:pick,movers:[],winds:[],checkpoints:[],pz:[],tier:2,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'chase',H,A,B,layers,flags}};
}
function setupChase(L){
  const B=L.bt; BTX.z=1; BTX.ly=VH*0.12; for(const f of B.flags) f.on=!!(S.cp&&S.cp.i>=f.i);
  let top=7;
  if(S.cp){ const ly=B.layers[S.cp.i]; top=ly.y; for(const p of players){ if(p.absent) continue; const x=(ly.land[0]+(p.kind==='bolt'&&!solo?2:0))*T+4; p.x=x; p.y=ly.y*T-p.h; p.vx=p.vy=0; } }
  S.press={y:(top-8)*T,t:0,wait:S.cp?1.2:2.2}; S.hintT=S.cp?0:5; banner(S.cp?'С ФЛАЖКА':'БЕГИ ВНИЗ!','#ff9a8a',1.2);
}
function chasePost(dt){
  const B=S.L.bt, L=live(), P=S.press; if(!L.length) return;
  S.hintT=Math.max(0,S.hintT-dt);
  if(P.wait>0){ P.wait-=dt; if(P.wait<=0){ sfx('slam'); shake=Math.max(shake,8); banner('ПРЕСС ПОШЁЛ!','#ff6b6b',1); } }
  else { P.t+=dt; const top=Math.min(...L.map(p=>p.y));
    const D=diffLv(); const cm=D<0?0.8:1+0.05*D; let v=Math.min(72*cm,38+P.t*0.5)*cm; const gap=top-P.y; if(gap>9*T) v+=Math.min((gap-9*T)*0.5,v*0.3);
    P.y+=v*dt; if(Math.random()<dt*3) shake=Math.max(shake,1.5); }
  for(const p of L){ if(p.y<P.y-4&&state==='play'){ burst(p.x+p.w/2,p.y+p.h/2,24,['#ff6b6b','#fff'],380,.6); texts.push({x:p.x+p.w/2,y:p.y-20,t:'РАЗДАВИЛО!',life:1.2,c:'#ff6b6b',pop:true}); die(p,'crush'); return; } }
  for(const f of B.flags){ if(f.on) continue; const ly=B.layers[f.i]; if(L.some(p=>p.y>ly.y*T)){ f.on=true; S.cp={lvl:levelIdx,i:f.i+1<B.layers.length?f.i+1:f.i}; sfx('pk_shield'); texts.push({x:VW/2,y:ly.y*T+40,t:'ФЛАЖОК!',life:1.4,c:'#7fe08a',pop:true}); } }
  platformPost(dt);
}

// ---------- мост из змей ----------
const SNAKES=[{pts:[[7,13],[21,13],[21,8],[7,8]],n:6,sp:105},{pts:[[29,10],[41,10],[41,5],[29,5]],n:6,sp:112},{pts:[[49,7],[61,7],[61,12],[49,12]],n:6,sp:112}];
const PILLARS=[[1,6,13],[24,27,10],[44,47,7],[63,70,13]];
function snakeLevel(D){
  const W=72, H=18, g=[...Array(H)].map(()=>Array(W).fill('.'));
  for(let x=0;x<W;x++){ g[0][x]='#'; g[17][x]='#'; g[16][x]='^'; }
  for(let y=0;y<H;y++){ g[y][0]='#'; g[y][W-1]='#'; }
  for(const [a,b,t] of PILLARS) for(let x=a;x<=b;x++) for(let y=t;y<=16;y++) g[y][x]='#';
  for(let x=67;x<=69;x++){ g[11][x]='E'; g[12][x]='E'; }
  g[12][2]='1'; g[12][4]='2';
  const pick=[{type:'heart',tx:26,ty:9},{type:'gear',tx:14,ty:6},{type:'gear',tx:15,ty:6},{type:'gear',tx:35,ty:3},{type:'gear',tx:36,ty:3},{type:'triple',tx:46,ty:6},{type:'gear',tx:55,ty:5}];
  const en=[{type:'flyer',tx:35,ty:2,min:30*T,max:42*T,trait:null},{type:'flyer',tx:55,ty:4,min:50*T,max:61*T,trait:null}];
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:en,pickups:pick,movers:[],winds:[],checkpoints:[],pz:[],tier:1,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'snake'}};
}
function snakePath(s){ if(s.segs) return; s.segs=[]; s.len=0; const P=s.pts.map(([x,y])=>[x*T,y*T]);
  for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], l=Math.hypot(b[0]-a[0],b[1]-a[1]); s.segs.push({a,b,l,s0:s.len}); s.len+=l; } }
function snakeAt(s,d){ d=((d%s.len)+s.len)%s.len; for(const q of s.segs) if(d<=q.s0+q.l){ const k=(d-q.s0)/q.l; return [q.a[0]+(q.b[0]-q.a[0])*k,q.a[1]+(q.b[1]-q.a[1])*k]; } return s.segs[0].a; }
function setupSnake(L){
  BTX.z=0; S.safe={}; S.snakes=SNAKES.map((s,k)=>{ const o={pts:s.pts,n:s.n,sp:s.sp}; snakePath(o); o.head=k*170; return o; });
  for(const s of S.snakes) for(let tr=0;tr<3;tr++) for(let i=0;i<s.n;i++){ const m={snake:s,i,tr,x:0,y:0,w:T,h:22,dx:0,dy:0,kind:'mover',key:null,u:0,dir:1,hold:0,pause:0,timer:0,sp:s.sp}; movers.push(m); }
  placeSnakes(0);
  const pl=S.cp?PILLARS[S.cp.i]:PILLARS[0];
  if(S.cp) for(const p of players){ if(p.absent) continue; p.x=(pl[0]+(p.kind==='bolt'&&!solo?2:1))*T; p.y=pl[2]*T-p.h; p.vx=p.vy=0; }
  for(const p of players) if(!p.absent) S.safe[p.kind]={x:p.x,y:p.y};
  S.hintT=S.cp?0:6; S.pillar=S.cp?S.cp.i:0;
}
function placeSnakes(h){ for(const m of movers){ const s=m.snake; if(!s) continue; const [x,y]=snakeAt(s,s.head-m.i*T-m.tr*s.len/3); m.dx=x-m.x; m.dy=y-m.y; if(!h){ m.dx=0; m.dy=0; } m.x=x; m.y=y; } }
const _updateMovers=updateMovers;
updateMovers=function(h){
  if(!(S.on&&S.kind==='snake')) return _updateMovers(h);
  const mul=speedMul(); for(const s of S.snakes) s.head+=s.sp*mul*h;
  placeSnakes(h);
  for(const m of movers) if(m.dx||m.dy) for(const o of players){ if(o.ground!==m||o.absent) continue; if(m.dx) moveX(o,m.dx); if(m.dy<0) moveY(o,m.dy); else if(m.dy>0) o.y+=m.dy; }
};
function snakePost(dt){
  const L=live(); S.hintT=Math.max(0,S.hintT-dt);
  for(const p of L){
    if(p.onGround&&!p.ground){ for(let i=0;i<PILLARS.length;i++){ const [a,b,t]=PILLARS[i]; if(p.x+p.w/2>=a*T&&p.x+p.w/2<=(b+1)*T&&Math.abs(p.y+p.h-t*T)<2){ S.safe[p.kind]={x:p.x,y:p.y};
          if(i>S.pillar&&i<PILLARS.length-1){ S.pillar=i; S.cp={lvl:levelIdx,i}; sfx('pk_shield'); texts.push({x:p.x+p.w/2,y:p.y-40,t:'ФЛАЖОК!',life:1.4,c:'#7fe08a',pop:true}); } } } }
    if(p.y+p.h>16*T+6){ const s=S.safe[p.kind]||{x:2*T,y:12*T}; burst(p.x+p.w/2,p.y+p.h,16,['#ff6b6b','#fff'],260,.5); if(p.inv<=0) hurt(p); if(state!=='play') return;
      p.x=s.x; p.y=s.y; p.vx=0; p.vy=0; p.inv=Math.max(p.inv,1.2); texts.push({x:p.x+p.w/2,y:p.y-24,t:'ОБРАТНО!',life:1,c:'#ff9a8a'}); } }
  platformPost(dt);
}

// ---------- ракета в пещере ----------
function rocketLevel(D){
  const H=18, WP=[[0,3,14],[12,3,14],[30,5,13],[45,2,9],[60,6,15],[75,4,11],[90,8,15],[105,3,10],[120,5,12],[135,2,8],[150,7,15],[165,5,11],[180,3,9],[195,8,15],[210,4,10],[225,6,12],[238,4,14],[245,3,15]];
  const finishX=245, W=262, prof=[];
  for(let x=0;x<W;x++){ let t=3,b=15; if(x<finishX){ let i=0; while(i<WP.length-2&&WP[i+1][0]<=x) i++; const a=WP[i], c=WP[i+1], k=(x-a[0])/Math.max(1,c[0]-a[0]); t=Math.round(a[1]+(c[1]-a[1])*k); b=Math.round(a[2]+(c[2]-a[2])*k); } prof.push([t,b]); }
  const g=[...Array(H)].map(()=>Array(W).fill('.'));
  for(let x=0;x<W;x++){ const [t,b]=prof[x]; for(let y=0;y<H;y++) if(y<t||y>b) g[y][x]='#'; g[0][x]='#'; g[17][x]='#'; }
  for(let x=finishX;x<W;x++){ g[16][x]='#'; for(let y=1;y<3;y++) g[y][x]='#'; }
  for(let y=0;y<H;y++){ g[y][0]='#'; g[y][W-1]='#'; }
  const obs=[], R=rng(777);
  const block=(x,y,w,h)=>{ for(let i=0;i<w;i++) for(let j=0;j<h;j++) g[y+j][x+i]='#'; obs.push([x,x+w-1]); };
  for(const x of [52,82,112,142,172,202,230]){ const [t,b]=prof[x]; const up=R()<.5; block(x,up?t+1:b-2,2,2); }
  for(const x of [68,128,188]){ const [t]=prof[x]; block(x,t,1,3); }
  for(const x of [98,158,218]){ const [,b]=prof[x]; block(x,b-2,1,3); }
  const en=[40,88,120,160,200,226].map(x=>{ const [t,b]=prof[x]; return {type:'flyer',tx:x,ty:Math.round((t+b)/2),min:(x-4)*T,max:(x+5)*T,trait:null}; });
  const pick=[]; for(let x=20;x<finishX-4;x+=11){ const [t,b]=prof[x]; const y=Math.round((t+b)/2)+((x/11)%2?-1:1); if(g[y][x]==='.') pick.push({type:'gear',tx:x,ty:y}); }
  for(const x of [70,150]){ const [t,b]=prof[x]; pick.push({type:'heart',tx:x+3,ty:Math.round((t+b)/2)}); }
  for(let x=finishX+4;x<=finishX+10;x++){ g[14][x]='E'; g[15][x]='E'; }
  g[8][3]='1'; g[10][3]='2';
  const spots=[]; for(let x=4;x<finishX-2;x++){ const [t,b]=prof[x]; if(b-t<5) continue; let ok=true; for(let d=-1;d<=8&&ok;d++){ const c=x+d; if(obs.some(o=>c>=o[0]&&c<=o[1])) ok=false; for(let y=prof[c][0];y<=prof[c][1];y++) if(g[y][c]==='#') ok=false; } if(ok) spots.push({x,y:(prof[x][0]+prof[x][1])/2}); }
  const flags=[85,165].map(x=>({x,on:false}));
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:en,pickups:pick,movers:[],winds:[],checkpoints:[],pz:[],tier:2,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'rocket',finishX,spots,flags,prof,base:D.base,top:D.top}};
}

function gateGap(g,t){ const H=gapH(), c=g.mid+g.amp*Math.sin(t*6.2832/g.per+g.ph); return [(c-H/2)*T,(c+H/2)*T]; }
function gapH(){ const D=diffLv(); return D<0?4.7:D===0?4.3:D===1?4.0:3.8; }
function tubeLevel(D){
  const H=18, finishX=240, W=257, prof=[], cen=x=>9+3*Math.sin(x/17)+1.4*Math.sin(x/7.3);
  for(let x=0;x<W;x++){ if(x>=finishX){ prof.push([3,15]); continue; } const c=x<8||x>finishX-14?9:cen(x); prof.push([Math.round(c-4),Math.round(c+3.6)]); }
  const g=[...Array(H)].map(()=>Array(W).fill('.'));
  for(let x=0;x<W;x++){ const [t,b]=prof[x]; for(let y=0;y<H;y++) if(y<t||y>b) g[y][x]='#'; g[0][x]='#'; g[17][x]='#'; }
  for(let x=finishX;x<W;x++){ g[16][x]='#'; for(let y=1;y<3;y++) g[y][x]='#'; }
  for(let y=0;y<H;y++){ g[y][0]='#'; g[y][W-1]='#'; }
  const gates=[]; let i=0; for(let x=38;x<finishX-8;x+=15,i++){ const [t,b]=prof[x]; const mid=(t+b+1)/2, room=(b+1-t)/2; gates.push({x,t,b,mid,amp:Math.max(1,Math.min(2.1,room-2.4)),per:2.4+(i%3)*0.4,ph:i*1.9}); }
  const pick=[]; for(let x=22;x<finishX-4;x+=13){ if(gates.some(q=>Math.abs(q.x-x)<3)) continue; const [t,b]=prof[x]; const y=Math.round((t+b)/2); pick.push({type:'gear',tx:x,ty:y}); }
  for(const x of [72,156]){ const [t,b]=prof[x]; pick.push({type:'heart',tx:x+3,ty:Math.round((t+b)/2)}); }
  for(let x=finishX+4;x<=finishX+10;x++){ g[14][x]='E'; g[15][x]='E'; }
  g[8][3]='1'; g[10][3]='2';
  const spots=[]; for(let x=4;x<finishX-2;x++){ if(gates.some(q=>q.x>=x-1&&q.x<=x+9)) continue; spots.push({x,y:(prof[x][0]+prof[x][1]+1)/2}); }
  const flags=[85,165].map(x=>({x,on:false}));
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:[],pickups:pick,movers:[],winds:[],checkpoints:[],pz:[],tier:2,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'rocket',tube:true,gates,finishX,spots,flags,prof,base:D.base,top:D.top}};
}
function drawGates(B){
  for(const q of B.gates){ const [a,b]=gateGap(q,S.gt||0), x=q.x*T-10, w=T*1.5, y0=q.t*T, y1=(q.b+1)*T;
    ctx.save(); const gr=ctx.createLinearGradient(x,0,x+w,0); gr.addColorStop(0,'#5d6b78'); gr.addColorStop(.5,'#9fb0bf'); gr.addColorStop(1,'#5d6b78'); ctx.fillStyle=gr;
    ctx.fillRect(x,y0,w,a-y0); ctx.fillRect(x,b,w,y1-b);
    ctx.fillStyle='#ffd166'; for(let k=0;k<3;k++){ ctx.fillRect(x,a-8-k*0,w,4); ctx.fillRect(x,b+4,w,4); break; }
    ctx.globalAlpha=.25; ctx.fillStyle='#7fe08a'; ctx.fillRect(x,a,w,b-a); ctx.restore(); }
}
function tubeHits(){
  const B=S.L.bt; if(!B.gates||S.freeze>0) return;
  for(const p of live()){ if(!p.rocket) continue; for(const q of B.gates){ const x=q.x*T-10; if(p.x+p.w<x||p.x>x+T*1.5) continue; const [a,b]=gateGap(q,S.gt||0); if(p.y+3<a||p.y+p.h-3>b) p.rocket.crash=true; } }
}
function placeRocket(sp){ for(const p of players){ if(p.absent) continue; const off=solo?0:(p.kind==='spark'?-0.8:0.8); p.x=sp.x*T+4; p.y=(sp.y+off)*T-p.h/2; p.vx=p.vy=0; p.rocket={vy:0,crash:false}; p.onGround=false; } }
function setupRocket(L){
  const B=L.bt; BTX.z=1; BTX.lx=VW*0.22; for(const f of B.flags) f.on=!!(S.cp&&S.cp.x>=f.x);
  placeRocket(S.cp?B.spots.filter(s=>s.x<=S.cp.x).pop()||B.spots[0]:{x:3,y:9});
  S.fuel=100; S.gt=0; S.gateGap=gateGap; S.lastGears=gears; S.freeze=S.cp?0.9:1.4; S.hintT=S.cp?0:6; banner(S.cp?'С ФЛАЖКА':'ЗАВОДИМ РАКЕТУ…','#9cc3ff',S.freeze);
}
function rocketPre(dt){
  const B=S.L.bt, L=live(); if(!L.length) return;
  if(S.freeze>0){ S.freeze-=dt; S.v=0; if(S.freeze<=0){ banner('ПОЛЕТЕЛИ!','#ffd166',.9); sfx('boost'); } return; }
  const lead=Math.max(...L.map(p=>p.x)), prog=clamp(lead/T/B.finishX,0,1);
  S.v=approach(S.v,(B.base+(B.top-B.base)*prog)*speedMul(),500*dt); S.gt=(S.gt||0)+dt; if(B.tube) S.fuel=100;
  const D=diffLv(); S.fuel=Math.max(0,S.fuel-(D<0?2.4:D===0?3.2:D===1?3.8:4.4)*dt);
}
function rocketPhys(p,h){
  const R=p.rocket; p.x+=S.v*h;
  const ny=p.y+R.vy*h; if(!tileHit(p.x,ny,p.w,p.h)) p.y=ny; else R.crash=true;
  if(tileHit(p.x,p.y,p.w,p.h)) R.crash=true;
  p.vx=S.v; p.vy=R.vy; p.onGround=false; p.ground=null;
}
function rocketPost(dt){
  const B=S.L.bt, L=live(); if(!L.length) return; S.hintT=Math.max(0,S.hintT-dt);
  if(gears>S.lastGears){ S.fuel=Math.min(100,S.fuel+22*(gears-S.lastGears)); const p=L[0]; texts.push({x:p.x+p.w/2,y:p.y-36,t:B.tube?'+ШЕСТЕРЁНКА':'+ТОПЛИВО',life:.8,c:'#7fe08a'}); } S.lastGears=gears;
  for(const f of B.flags) if(!f.on&&L.some(p=>p.x>f.x*T)){ f.on=true; S.cp={lvl:levelIdx,x:f.x}; sfx('pk_shield'); const p=L[0]; texts.push({x:p.x,y:p.y-50,t:'ФЛАЖОК!',life:1.4,c:'#7fe08a',pop:true}); }
  for(const p of L) if(p.rocket&&p.x>B.finishX*T){ p.rocket=null; p.vx=S.v*0.4; p.vy=-120; sfx('jump'); worldText(p,'ПРИЗЕМЛЯЙСЯ!','#7fe08a'); }
  if(S.freeze>0) return;
  tubeHits();
  const hit=L.filter(p=>p.rocket&&p.rocket.crash); if(!hit.length) return;
  for(const p of hit){ burst(p.x+p.w/2,p.y+p.h/2,24,['#ffd166','#ff8a3d','#fff'],380,.6); p.inv=0; _hurt(p); texts.push({x:p.x+p.w/2,y:p.y-30,t:'БАХ!',life:1.1,c:'#ff6b6b',pop:true}); if(p.down||p.hp<=0){ p.down=false; die(p,'down'); return; } }
  sfx('hit'); shake=Math.max(shake,9); flash('#ff3b4e',.35); hitstop=Math.max(hitstop,.12);
  const minX=Math.min(...hit.map(p=>p.x))/T, sp=B.spots.filter(s=>s.x+6<=minX).pop()||B.spots[0];
  placeRocket(sp); for(const p of players) if(!p.absent) p.inv=Math.max(p.inv,1.6);
  S.fuel=Math.max(S.fuel,45); S.v=0; S.freeze=0.85; banner('ЕЩЁ РАЗ!','#ff9a8a',.85);
}

// ---------- драка в цеху ----------
const WAVES=[
  [['crawler','L'],['crawler','R'],['crawler','L',null,.6],['crawler','R',null,.6]],
  [['crawler','L'],['crawler','R'],['flyer','T'],['flyer','T',null,.8],['crawler','R','jumper',1.2]],
  [['crawler','L','shield'],['crawler','R','shield'],['crawler','L',null,.8],['crawler','R',null,.8],['flyer','T','diver',1.2]],
  [['flyer','T','diver'],['flyer','T','diver',.6],['crawler','L','jumper',.3],['crawler','R','jumper',.3],['crawler','L',null,1.4],['crawler','R',null,1.4]],
  [['crawler','L','shield'],['crawler','R','shield'],['crawler','L','jumper',.7],['crawler','R','jumper',.7],['flyer','T','diver',1.2],['flyer','T',null,1.6],['crawler','L',null,2],['crawler','R',null,2]]
];
function brawlLevel(D){
  const W=32,H=18,g=[...Array(H)].map(()=>Array(W).fill('.'));
  for(let x=0;x<W;x++){ g[0][x]='#'; g[17][x]='#'; } for(let y=0;y<H;y++){ g[y][0]='#'; g[y][W-1]='#'; }
  for(let x=4;x<=9;x++) g[12][x]='#'; for(let x=22;x<=27;x++) g[12][x]='#'; for(let x=12;x<=19;x++) g[8][x]='#';
  for(let x=14;x<=17;x++){ g[15][x]='E'; g[16][x]='E'; }
  g[16][8]='1'; g[16][23]='2';
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:[],pickups:[],movers:[],winds:[],checkpoints:[],pz:[],tier:3,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'brawl'}};
}
function setupBrawl(L){ BTX.z=0; S.wave=0; S.waveT=1.8; S.queue=[]; S.qt=0; exitLocked=true; S.opened=false; S.hintT=7; banner('ДРАКА!','#ff6b6b',1.3); }
function spawnFoe(f){ const [type,side,trait]=f; let d;
  if(type==='flyer') d={type:'flyer',tx:6+Math.floor(Math.random()*20),ty:14,min:T,max:31*T,trait:trait||null};
  else d={type:'crawler',tx:side==='L'?2:29,ty:16,min:T,max:31*T,trait:trait||null};
  const e=makeEnemy(d,curTier); const D=diffLv(); e.hp=Math.max(1,Math.round(e.hp*(D<0?.7:1+.3*D))); enemies.push(e);
  burst(e.x+e.w/2,e.y+e.h/2,18,['#c79bff','#fff'],260,.5); rings.push({x:e.x+e.w/2,y:e.y+e.h/2,r:4,max:50,life:.35,c:'#c79bff',w:3}); }
function brawlPost(dt){
  S.hintT=Math.max(0,S.hintT-dt);
  if(S.queue.length){ S.qt+=dt; while(S.queue.length&&S.queue[0][3]<=S.qt) spawnFoe(S.queue.shift()); }
  else if(!enemies.length){
    if(S.wave<WAVES.length){ S.waveT-=dt; if(S.waveT<=0){ S.queue=WAVES[S.wave].map(f=>[f[0],f[1],f[2],f[3]||0]).sort((a,b)=>a[3]-b[3]); S.qt=0; S.wave++; banner('ВОЛНА '+S.wave+' ИЗ '+WAVES.length,'#ffd166',1.1); sfx('boost'); S.waveT=1.4;
        if(S.wave>=2) pickups.push({type:'heart',x:15*T,y:7*T,t:0}); } }
    else if(!S.opened){ S.opened=true; exitLocked=false; banner('ВЫХОД ОТКРЫТ!','#7fe08a',1.6); sfx('win'); }
  }
  for(const en of enemies) if(en.type==='crawler'&&en.grounded&&!en.kb){ const n=nearestPlayer(en.x+en.w/2,en.y+en.h/2); if(n){ const dx=n.p.x+n.p.w/2-(en.x+en.w/2); if(Math.abs(dx)>20) en.vx=Math.sign(dx)*Math.abs(en.vx||70); } }
  platformPost(dt);
}

// ---------- общее для «пеших» испытаний: смэш Болта и огненный рывок Искры ----------
function smash(p){
  p.smashCd=0.7; p.smashT=0.22; sfx('slam'); shake=Math.max(shake,6); hitstop=Math.max(hitstop,.04);
  const cx=p.x+p.w/2+p.face*48, cy=p.y+p.h*0.55, zone={x:cx-62,y:p.y-24,w:124,h:p.h+34};
  rings.push({x:cx,y:cy,r:8,max:80,life:.3,c:'#62c7c1',w:5}); burst(cx,cy,16,['#9cc3ff','#62c7c1','#fff'],320,.4);
  let n=0; for(const en of enemies){ if(en.hp<=0||!overlap(en,zone)) continue; n++; damageEnemy(en,4,false,'slam'); knock(en,p.face*760,-420); }
  if(n) texts.push({x:cx,y:p.y-30,t:n>1?'СМЭШ ×'+n+'!':'СМЭШ!',life:.8,c:'#62c7c1',pop:true});
}
function knock(en,vx,vy){ en.kb={vx,t:.38}; if(en.type==='crawler'){ en.vy=vy; en.grounded=false; } }
function platformPost(dt){
  const L=live();
  for(const p of L){ p.smashT=Math.max(0,(p.smashT||0)-dt);
    if(p.kind==='spark'&&p.dash>0) for(const en of enemies){ if(en.hp<=0||en.dashHit===p.dashN||!overlap(p,{x:en.x-6,y:en.y-6,w:en.w+12,h:en.h+12})) continue;
      en.dashHit=p.dashN; damageEnemy(en,3,false,'power'); knock(en,p.face*560,-320); burst(en.x+en.w/2,en.y+en.h/2,14,['#ffd166','#ff8a3d'],260,.4); texts.push({x:en.x+en.w/2,y:en.y-24,t:'ОГОНЬ!',life:.7,c:'#ffb347'}); } }
  for(const en of enemies){ const k=en.kb; if(!k) continue; k.t-=dt; const nx=en.x+k.vx*dt;
    if(tileHit(nx,en.y,en.w,en.h-2)){ if(en.hp>0){ damageEnemy(en,2,false,'slam'); texts.push({x:en.x+en.w/2,y:en.y-20,t:'В СТЕНУ!',life:.8,c:'#ffd166',pop:true}); shake=Math.max(shake,4); } en.kb=null; en.vx=-Math.sign(k.vx)*Math.abs(en.vx||60); continue; }
    en.x=nx; if(en.type==='flyer') en.by=en.y; k.vx*=1-3*dt; if(k.t<=0) en.kb=null; }
}

// ---------- гонка: рыбы, мины и Механик ----------
function cartExtraSetup(L){
  const B=L.bt; S.dyn=[]; S.mines=[];
  for(const f of B.fish) f.t=-1;
  if(B.rival){ const sx=(S.cp?S.cp.x:3)+14; S.R={x:sx*T,v:0,hp:B.rival,max:B.rival,cd:2.5,dead:false,flash:0,deadT:0}; exitLocked=true; } else { S.R=null; exitLocked=false; }
}
function cartExtraPost(dt,L){
  const B=S.L.bt, lead=Math.max(...L.map(p=>p.x+p.w));
  for(const f of B.fish){ if(f.t<0){ if(lead>f.x*T-Math.max(S.v,200)*0.55&&lead<f.x*T) { f.t=0; burst(f.x*T+20,FL*T-4,14,['#9cf','#fff'],220,.4); sfx('jump'); } } else f.t+=dt; }
  const R=S.R;
  if(R){
    if(!R.dead){
      const gap=(R.x-lead)/T, k=(gap>14?0.8:gap>7?0.93:gap<2?1.25:gap<4?1.08:1.0)*(R.x>(B.finishX-35)*T?0.88:1), base=B.base*speedMul();
      R.v=S.freeze>0?0:Math.max(S.v,base*0.9)*k; R.x+=R.v*dt; R.cd-=dt; R.flash=Math.max(0,R.flash-dt);
      if(R.cd<=0&&gap<12&&gap>3){ const c=Math.floor(R.x/T)-1; R.cd=(diffLv()<0?2.6:diffLv()>0?1.4:1.9)+Math.random()*0.8;
        if(c<B.finishX-4&&!B.obs.some(o=>c>=o.x0-2&&c<=o.x1+3)&&solid(c,FL)&&solid(c+1,FL)){ S.mines.push({x:c*T+6,t:0}); tone(300,200,.06,'square',.03); } }
      for(const b of bullets){ if(b.life<=0||!overlap(b,{x:R.x-4,y:FL*T-110,w:54,h:104})) continue; b.life=0; R.hp-=(b.dmg>1)?2:1; R.flash=.12; sfx('hit'); burst(R.x+23,FL*T-34,10,['#ff6b6b','#fff'],220,.35);
        if(R.hp<=0){ R.dead=true; R.deadT=0; exitLocked=false; sfx('kill'); shake=Math.max(shake,10); flash('#ffffff',.35); burst(R.x+23,FL*T-34,40,['#ffd166','#ff6b6b','#fff','#62c7c1'],420,.9); banner('МЕХАНИК СБИТ!','#7fe08a',1.6); addScore(1000); break; } }
      if(!R.dead&&R.x>=B.finishX*T&&state==='play'){ banner('МЕХАНИК УШЁЛ!','#ff6b6b',1.5); die(L[0],'rival'); return; }
    } else R.deadT+=dt;
  }
  for(const m of S.mines) m.t+=dt;
  S.dyn=S.mines.map(m=>({t:'jump',x0:Math.floor(m.x/T),x1:Math.floor(m.x/T),mine:true}));
}
function cartExtraHit(p){
  const B=S.L.bt;
  for(const f of B.fish) if(fishUp(f)>18&&overlap(p,{x:f.x*T+13,y:FL*T-fishUp(f)+10,w:14,h:fishUp(f)-18})) return 'fish';
  for(const m of S.mines) if(overlap(p,{x:m.x,y:FL*T-16,w:28,h:16})) return 'mine';
  return null;
}
function fishUp(f){ if(f.t<0) return 0; const t=f.t; return t<0.14?t/0.14*44:t<1.2?44:t<1.45?44*(1-(t-1.2)/0.25):0; }
function cartExtraRewind(spot){ S.mines=S.mines.filter(m=>m.x<spot*T-T||m.x>(spot+16)*T); for(const f of S.L.bt.fish) if(f.x>spot) f.t=-1; if(S.R&&!S.R.dead) S.R.x=(spot+12)*T; }

const BUILD={cart:D=>cartLevel(D),rope:D=>ropeLevel(D),chase:D=>chaseLevel(D),snake:D=>snakeLevel(D),rocket:D=>rocketLevel(D),tube:D=>tubeLevel(D),brawl:D=>brawlLevel(D)};
const LEVELS=DEFS.map(D=>BUILD[D.kind](D));

/* ---------------- перехваты движка ---------------- */
const _getLevel=getLevel;
getLevel=function(i){ if(edTest&&edLevel) return edLevel; return LEVELS[i]||LEVELS[LEVELS.length-1]; };

const _loadLevel=loadLevel;
loadLevel=function(i,keepHp){
  _loadLevel(i,keepHp);
  const L=getLevel(i); S.L=L; S.on=!!(L&&L.bt&&!edTest); S.kind=S.on?L.bt.kind:null;
  BTX.z=0; BTX.lx=0; BTX.ly=0; S.banner=null; S.boost=0; S.v=0; S.freeze=0; S.hintT=0; S.R=null; S.press=null; S.snakes=null; S.mines=[]; S.dyn=[];
  if(!S.on) return;
  tutMarks=[];
  if(S.cp&&S.cp.lvl!==i) S.cp=null;
  for(const p of players){ p.duck=false; p.rope=null; p.rocket=null; p.smashCd=0; p.smashT=0; p.h0=H0[p.kind]; }
  if(S.kind==='cart'){ setupCart(L); cartExtraSetup(L); } else if(S.kind==='rope') setupRope(L); else if(S.kind==='chase') setupChase(L); else if(S.kind==='snake') setupSnake(L); else if(S.kind==='brawl') setupBrawl(L); else if(S.kind==='rocket') setupRocket(L);
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
  if(S.kind==='rocket'&&p.rocket){
    const up=inp.jump||padUp(pi), dn=inp.ab||padDn(pi); let want=up?-300:dn?300:0; if(S.fuel<=0) want=230; if(S.freeze>0) want=0;
    p.rocket.vy=approach(p.rocket.vy,want,1800*dt);
    _control(p,{dir:0,jump:false,jp:false,ab:false,ap:false,fire:inp.fire,use:inp.use,nx:inp.nx},dt); p.face=1; return;
  }
  if(PLATF[S.kind]&&!p.down){
    const wasDash=p.dash>0; p.smashCd=Math.max(0,(p.smashCd||0)-dt);
    if(p.kind==='bolt'&&inp.ap&&p.wasGround){ const s0=players[0], onHead=!s0.absent&&!s0.down&&s0.wasGround&&s0.ground===p;
      if(!onHead){ if(p.smashCd<=0) smash(p); inp=Object.assign({},inp,{ap:false}); } }
    _control(p,inp,dt); if(!wasDash&&p.dash>0) p.dashN=(p.dashN||0)+1; return;
  }
  if(S.kind==='rope'&&p.rope){
    p.rope.in={dir:inp.dir,up:!!inp.jump||padUp(pi),dn:!!inp.ab||padDn(pi)};
    _control(p,{dir:inp.dir,jump:false,jp:false,ab:false,ap:false,fire:inp.fire,use:inp.use,nx:inp.nx},dt);
    return;
  }
  return _control(p,inp,dt);
};

const _physics=physics;
physics=function(e,h){ if(S.on&&S.kind==='rope'&&e.rope) return ropePhys(e,h); if(S.on&&S.kind==='rocket'&&e.rocket) return rocketPhys(e,h); if(S.on&&S.kind==='cart'&&e.kind!=='crate'&&!e.slam) e.vy+=G*GX*h; return _physics(e,h); };
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
  if(S.kind==='cart') cartPre(dt); else if(S.kind==='rocket') rocketPre(dt);
  _step(dt);
  if(S.banner){ S.banner.life-=dt; if(S.banner.life<=0) S.banner=null; }
  if(state!=='play') return;
  ({cart:cartPost,rope:ropePost,chase:chasePost,snake:snakePost,brawl:brawlPost,rocket:rocketPost})[S.kind](dt);
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
  cartExtraPost(dt,L); if(state!=='play') return;
  if(S.freeze>0) return;
  // аварии
  const hit=[];
  for(const p of L){ if(p.x>B.finishX*T) continue;
    let why=null;
    if(tileHit(p.x+2,p.y+3,p.w,p.h-6)) why='wall';
    else if(p.y>FL*T+4) why='pit';
    else for(const sx of B.strips){ if(overlap(p,{x:sx*T,y:FL*T-40,w:T,h:16})){ why='zap'; break; } }
    if(!why) why=cartExtraHit(p);
    if(why) hit.push([p,why]); }
  if(hit.length) crash(hit);
}
function crash(hit){
  const B=S.L.bt; if(S.log) S.log.push(hit.map(h=>h[0].kind+':'+h[1]+'@'+(h[0].x/T).toFixed(1)+','+(h[0].y/T).toFixed(1)+(h[0].duck?'d':'')).join(' '));
  for(const [p,why] of hit){
    burst(p.x+p.w/2,p.y+p.h/2,22,why==='zap'?['#9cf','#fff','#62c7c1']:['#ffd166','#ff8a3d','#fff'],360,.6);
    p.inv=0; _hurt(p);
    texts.push({x:p.x+p.w/2,y:p.y-30,t:why==='pit'?(B.water?'БУЛЬ!':'ПРОВАЛ!'):why==='zap'?'РАЗРЯД!':why==='fish'?'РЫБА!':why==='mine'?'МИНА!':'БАХ!',life:1.1,c:'#ff6b6b',pop:true});
    if(p.down||p.hp<=0){ p.down=false; die(p,'down'); return; }
  }
  sfx('hit'); shake=Math.max(shake,9); flash(hit[0][1]==='zap'?'#9cf':'#ff3b4e',.35); hitstop=Math.max(hitstop,.12);
  const minX=Math.min(...hit.map(h=>h[0].x))/T;
  const spot=B.spots.filter(x=>x+4<=minX).pop(); placeCart(spot!=null?spot:3); cartExtraRewind(spot!=null?spot:3);
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
  if(S.kind==='rocket'&&p.rocket){ drawRocket(p); return f(p); }
  if(PLATF[S.kind]){ f(p); drawSmash(p); return; }
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
    drawCartExtra(B);
  } else if(S.kind==='rocket'&&B.gates) drawGates(B);
  else if(S.kind==='chase') drawChaseExtra(B);
  else if(S.kind==='snake') drawSnakeExtra();
  else if(S.kind==='rope'){
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
      const o=B.obs.concat(S.dyn||[]).filter(o=>(o.x1+1)*T>front-8).sort((a,b)=>a.x0-b.x0)[0];
      if(o){ const tt=(o.x0*T-front)/v; if(tt<wt){
        const up=o.t==='jump', blink=Math.floor(clock*(tt<wt*.45?12:6))%2===0, cx=VW-T*2.6, cy=VH*0.42;
        if(S.warnBeep!==o){ S.warnBeep=o; tone(up?880:440,up?1320:330,.08,'square',.035); }
        ctx.save(); ctx.globalAlpha=blink?1:.45; ctx.fillStyle=up?'#ffd166':'#ff6b6b'; ctx.strokeStyle='#0b1830'; ctx.lineWidth=4;
        ctx.beginPath(); ctx.arc(cx,cy,34,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#0b1830'; ctx.beginPath(); if(up){ ctx.moveTo(cx,cy-20); ctx.lineTo(cx+18,cy+10); ctx.lineTo(cx-18,cy+10); } else { ctx.moveTo(cx,cy+20); ctx.lineTo(cx+18,cy-10); ctx.lineTo(cx-18,cy-10); } ctx.closePath(); ctx.fill();
        ctx.restore(); label(up?(o.pit?'ЯМА — ПРЫЖОК':'ПРЫЖОК'):'ПРИГНИСЬ',cx,cy+52,14,up?'#ffd166':'#ff6b6b'); } } }
  } else if(S.kind==='rope'){
    const x=VW-T*0.9, y0=T*1.6, y1=VH-T*1.6, Hh=(B.H-3)*T;
    ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-9,y0-8,18,y1-y0+16,9); ctx.fill();
    ctx.fillStyle='rgba(156,195,255,.25)'; rr(ctx,x-3,y0,6,y1-y0,3); ctx.fill();
    for(const f of B.flags){ ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.fillRect(x-8,y0+(y1-y0)*f.y*T/Hh-1,16,3); }
    for(const p of L){ const k=clamp(p.y/Hh,0,1); ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.arc(x,y0+(y1-y0)*k,6,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#0b1830'; ctx.lineWidth=2; ctx.stroke(); }
    const d=L.length?Math.round(Math.max(...L.map(p=>p.y))/T*1.5):0; label(d+' м',x-16,y1+22,15,'#e8effa','right');
    if(S.hintT>0){ ctx.globalAlpha=Math.min(1,S.hintT); label('← → раскачка   ·   ↓ / S быстрее   ·   ↑ / W подтянуться',VW/2,VH-26,15,'#e8effa'); ctx.globalAlpha=1; }
  }
  hudExtra(B,L);
  if(S.banner){ const b=S.banner, a=Math.min(1,b.life*3), s=1+Math.max(0,(b.life-b.max+0.18))*2.5; ctx.save(); ctx.globalAlpha=a; ctx.translate(VW/2,VH*0.3); ctx.scale(s,s); label(b.t,0,0,46,b.c); ctx.restore(); }
}


/* ---------- рисование испытаний 4–9 ---------- */
function drawCartExtra(B){
  const V=viewRect();
  if(B.water){ const y=FL*T-5, x0=Math.max(0,V.x-20), x1=V.x+V.w+20;
    ctx.save(); const gr=ctx.createLinearGradient(0,y-6,0,y+22); gr.addColorStop(0,'rgba(120,210,255,.55)'); gr.addColorStop(1,'rgba(40,120,200,.15)'); ctx.fillStyle=gr;
    ctx.beginPath(); ctx.moveTo(x0,y+24); for(let x=x0;x<=x1;x+=16) ctx.lineTo(x,y+Math.sin(x*0.05+clock*4)*3); ctx.lineTo(x1,y+24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(220,245,255,.7)'; ctx.lineWidth=2; ctx.beginPath(); for(let x=x0;x<=x1;x+=16){ const yy=y+Math.sin(x*0.05+clock*4)*3; x===x0?ctx.moveTo(x,yy):ctx.lineTo(x,yy); } ctx.stroke();
    for(const o of B.obs) if(o.pit){ const cx=(o.x0+o.x1+1)/2*T; if(cx<V.x-80||cx>V.x+V.w+80) continue; ctx.strokeStyle='rgba(20,60,120,.85)'; ctx.lineWidth=3;
      for(let r=6;r<(o.x1-o.x0+1)*T/2;r+=7){ ctx.beginPath(); ctx.ellipse(cx,FL*T+4,r,r*.28,0,clock*3+r,clock*3+r+4.2); ctx.stroke(); } }
    ctx.restore();
    if(state==='play'&&S.v>60) for(const p of live()) if(p.wasGround&&Math.random()<.7) addP({x:p.x,y:FL*T-6,vx:-S.v*.3-Math.random()*80,vy:-60-Math.random()*120,life:.4,max:.4,c:Math.random()<.5?'#bfefff':'#7fc7ff',s:3,g:.8}); }
  for(const f of B.fish){ const h=fishUp(f); if(h<=0) continue; const x=f.x*T+20, y=FL*T-h+12;
    ctx.save(); ctx.translate(x,y); ctx.rotate(Math.sin(clock*10)*.12); ctx.fillStyle='#8aa2b8'; ctx.beginPath(); ctx.ellipse(0,0,18,12,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#5c7186'; ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(26,-10); ctx.lineTo(26,10); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ff6b6b'; ctx.beginPath(); ctx.arc(-8,-3,4,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#e8effa'; for(let k=0;k<3;k++) ctx.fillRect(-16+k*5,4,3,4); ctx.restore(); }
  for(const m of S.mines||[]){ const x=m.x+14, y=FL*T-9, bl=Math.floor(clock*8+m.x)%2;
    ctx.save(); ctx.fillStyle='#2b3448'; ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#ffd166'; ctx.lineWidth=2; for(let k=0;k<6;k++){ const a=k*Math.PI/3; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*9,y+Math.sin(a)*9); ctx.lineTo(x+Math.cos(a)*14,y+Math.sin(a)*14); ctx.stroke(); }
    ctx.fillStyle=bl?'#ff4d5e':'#6a1a22'; ctx.beginPath(); ctx.arc(x,y-2,3.5,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  const R=S.R; if(R&&!(R.dead&&R.deadT>1.2)){ const x=R.x, y=FL*T-6, over=B.obs.find(o=>x+46>o.x0*T-T&&x<(o.x1+2)*T), hop=over&&!R.dead?(over.t==='duck'?-0:Math.sin(clamp((x-(over.x0-1)*T)/((over.x1-over.x0+3)*T),0,1)*Math.PI)*60):0, duck=over&&over.t==='duck';
    ctx.save(); ctx.translate(x+23,y-hop); if(R.dead){ ctx.rotate(R.deadT*6); ctx.globalAlpha=Math.max(0,1-R.deadT/1.2); }
    ctx.fillStyle='#3b2a2a'; rr(ctx,-30,-4,60,9,4); ctx.fill(); ctx.strokeStyle='#ff6b6b'; ctx.lineWidth=1.5; rr(ctx,-30,-4,60,9,4); ctx.stroke();
    if(!R.dead&&S.v>40){ ctx.fillStyle='rgba(255,120,80,.8)'; ctx.beginPath(); ctx.moveTo(-30,-2); ctx.lineTo(-48-Math.random()*10,1); ctx.lineTo(-30,4); ctx.closePath(); ctx.fill(); }
    ctx.scale(1,duck?.6:1); ctx.fillStyle=R.flash>0?'#ffffff':'#7a6a5a'; rr(ctx,-16,-50,32,46,7); ctx.fill();
    ctx.fillStyle='#2a1a1a'; rr(ctx,-12,-44,24,12,5); ctx.fill(); ctx.fillStyle='#ff4d5e'; ctx.fillRect(-9,-40,7,4); ctx.fillRect(3,-40,7,4);
    ctx.fillStyle='#4a3a2a'; ctx.fillRect(-14,-58,28,8); ctx.fillRect(-9,-70,18,13);
    ctx.strokeStyle='#c7d3dd'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(14,-26); ctx.lineTo(26,-36); ctx.stroke(); ctx.beginPath(); ctx.arc(28,-38,5,0,Math.PI*1.5); ctx.stroke();
    ctx.restore(); }
}
function drawChaseExtra(B){
  const P=S.press, V=viewRect(); if(!P) return; const x0=B.A*T, x1=(B.B+1)*T, y=P.y; if(y<V.y-40) return;
  ctx.save(); const top=Math.max(V.y-20,y-VH);
  const gr=ctx.createLinearGradient(0,y-160,0,y); gr.addColorStop(0,'#2a2f3d'); gr.addColorStop(1,'#4a5266'); ctx.fillStyle=gr; ctx.fillRect(x0,top,x1-x0,y-top);
  ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=2; for(let xx=x0+40;xx<x1;xx+=80){ ctx.beginPath(); ctx.moveTo(xx,top); ctx.lineTo(xx,y-14); ctx.stroke(); }
  for(let k=0;(x0+k*24)<x1;k++){ ctx.fillStyle=k%2?'#1d2638':'#ffd166'; ctx.fillRect(x0+k*24,y-16,24,8); }
  ctx.fillStyle='#c7d3dd'; for(let xx=x0;xx<x1;xx+=20){ ctx.beginPath(); ctx.moveTo(xx,y-8); ctx.lineTo(xx+10,y+8); ctx.lineTo(xx+20,y-8); ctx.closePath(); ctx.fill(); }
  const gl=ctx.createLinearGradient(0,y,0,y+70); gl.addColorStop(0,'rgba(255,77,94,.35)'); gl.addColorStop(1,'rgba(255,77,94,0)'); ctx.fillStyle=gl; ctx.fillRect(x0,y+8,x1-x0,70);
  ctx.restore();
}
function drawSnakeExtra(){
  for(const m of movers){ if(!m.snake||m.i!==0) continue; const s=m.snake, [nx,ny]=snakeAt(s,s.head-m.tr*s.len/3+8), dx=nx-m.x, dy=ny-m.y, a=Math.atan2(dy,dx);
    ctx.save(); ctx.translate(m.x+T/2,m.y+11); ctx.rotate(a); ctx.fillStyle='#e7b54a'; ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(8,-12); ctx.lineTo(8,12); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(10,-6,4,0,Math.PI*2); ctx.arc(10,6,4,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#0b1830'; ctx.beginPath(); ctx.arc(11.5,-6,2,0,Math.PI*2); ctx.arc(11.5,6,2,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  for(const m of movers){ if(!m.snake) continue; ctx.save(); ctx.globalAlpha=.8; ctx.fillStyle=(m.i%2)?'#e7b54a':'#c78a2a'; ctx.fillRect(m.x+4,m.y+2,T-8,4); ctx.restore(); }
}
function drawRocket(p){
  const x=p.x+p.w/2, y=p.y+p.h+6, c=p.kind==='bolt'?'#62c7c1':'#ff8a3d', on=S.v>30;
  ctx.save(); ctx.translate(x,y);
  if(on){ const fl=18+Math.random()*10+(p.rocket&&p.rocket.vy<-100?10:0); const gr=ctx.createLinearGradient(-30,0,-30-fl,0); gr.addColorStop(0,'#fff3c4'); gr.addColorStop(.5,'#ffb347'); gr.addColorStop(1,'rgba(255,90,40,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(-30,-5); ctx.lineTo(-30-fl,0); ctx.lineTo(-30,5); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle='#d8dfe8'; ctx.beginPath(); ctx.moveTo(-30,-7); ctx.lineTo(18,-7); ctx.quadraticCurveTo(34,0,18,7); ctx.lineTo(-30,7); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#6f8191'; ctx.lineWidth=1.5; ctx.stroke(); ctx.fillStyle=c; ctx.fillRect(-14,-7,8,14);
  ctx.fillStyle='#ff6b6b'; ctx.beginPath(); ctx.moveTo(-30,-7); ctx.lineTo(-38,-15); ctx.lineTo(-24,-7); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-30,7); ctx.lineTo(-38,15); ctx.lineTo(-24,7); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawSmash(p){ if(!(p.smashT>0)) return; const k=1-p.smashT/0.22, x=p.x+p.w/2+p.face*(20+k*50), y=p.y+p.h*0.5;
  ctx.save(); ctx.globalAlpha=1-k; ctx.strokeStyle='#bfefff'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(x,y,18+k*40,p.face>0?-1:Math.PI-1,p.face>0?1:Math.PI+1); ctx.stroke();
  ctx.fillStyle='#c7d3dd'; ctx.beginPath(); ctx.arc(x-p.face*10,y,10,0,Math.PI*2); ctx.fill(); ctx.restore(); }
function hudExtra(B,L){
  if(S.kind==='cart'&&S.R){ const R=S.R, w=520, x=VW/2-w/2, y=VH-26, k=clamp(R.x/T/B.finishX,0,1);
    if(!R.dead){ ctx.fillStyle='#ff4d5e'; ctx.beginPath(); ctx.moveTo(x+w*k,y-9); ctx.lineTo(x+w*k+7,y); ctx.lineTo(x+w*k,y+9); ctx.lineTo(x+w*k-7,y); ctx.closePath(); ctx.fill(); }
    const bw=220, bx=VW/2-bw/2, by=78; ctx.fillStyle='rgba(6,10,22,.85)'; rr(ctx,bx-8,by-12,bw+16,24,10); ctx.fill();
    label('МЕХАНИК',bx,by,12,'#ff9a8a','left'); for(let i=0;i<R.max;i++){ ctx.fillStyle=i<R.hp?'#ff4d5e':'rgba(255,77,94,.2)'; rr(ctx,bx+80+i*(bw-84)/R.max,by-6,(bw-84)/R.max-4,12,3); ctx.fill(); }
    if(R.dead) label('СБИТ!',VW/2,by+26,14,'#7fe08a'); }
  if(S.kind==='rocket'){ const w=520, x=VW/2-w/2, y=VH-26;
    ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-8,y-10,w+16,20,10); ctx.fill(); ctx.fillStyle='rgba(156,195,255,.25)'; rr(ctx,x,y-3,w,6,3); ctx.fill();
    for(const f of B.flags){ ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.fillRect(x+w*f.x/B.finishX-1,y-8,3,16); }
    for(const p of L){ const k=clamp(p.x/T/B.finishX,0,1); ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.arc(x+w*k,y,6,0,Math.PI*2); ctx.fill(); }
    if(!B.tube){ const fw=180, fx=VW-T*0.8-fw, fy=VH-30, low=S.fuel<25&&Math.floor(clock*6)%2;
    ctx.fillStyle='rgba(6,10,22,.85)'; rr(ctx,fx-8,fy-14,fw+16,28,10); ctx.fill(); ctx.fillStyle=low?'#ff4d5e':S.fuel<25?'#ffb347':'#7fe08a'; rr(ctx,fx,fy-6,fw*S.fuel/100,12,5); ctx.fill();
    label('ТОПЛИВО',fx,fy-24,12,'#e8effa','left'); if(S.fuel<=0) label('ТОПЛИВО КОНЧИЛОСЬ — ЛОВИ ШЕСТЕРЁНКИ!',VW/2,VH*0.2,18,'#ff6b6b'); }
    if(S.hintT>0){ ctx.globalAlpha=Math.min(1,S.hintT); label(B.tube?'↑ / W вверх   ·   ↓ / S вниз   ·   лети в зелёное окошко заслонки':'↑ / W вверх   ·   ↓ / S вниз   ·   огонь по дронам   ·   шестерёнки = топливо',VW/2,VH-56,15,'#e8effa'); ctx.globalAlpha=1; } }
  if(S.kind==='chase'&&S.press){ const x=VW-T*0.9, y0=T*1.6, y1=VH-T*1.6, Hh=(B.H-3)*T;
    ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-9,y0-8,18,y1-y0+16,9); ctx.fill();
    const py=y0+(y1-y0)*clamp(S.press.y/Hh,0,1); ctx.fillStyle='rgba(255,77,94,.5)'; rr(ctx,x-5,y0,10,Math.max(0,py-y0),4); ctx.fill(); ctx.fillStyle='#ff4d5e'; ctx.fillRect(x-9,py-2,18,4);
    for(const f of B.flags){ ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.fillRect(x-8,y0+(y1-y0)*B.layers[f.i].y*T/Hh-1,16,3); }
    for(const p of L){ ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.arc(x,y0+(y1-y0)*clamp(p.y/Hh,0,1),6,0,Math.PI*2); ctx.fill(); }
    if(L.length){ const d=Math.min(...L.map(p=>p.y))-S.press.y; label('пресс: '+Math.max(0,Math.round(d/T*1.5))+' м',x-16,y1+22,15,d<4*T?'#ff6b6b':'#e8effa','right'); }
    if(S.hintT>0){ ctx.globalAlpha=Math.min(1,S.hintT); label('Беги к дыре в полу и прыгай вниз · способность Болта на земле — СМЭШ',VW/2,VH-26,15,'#e8effa'); ctx.globalAlpha=1; } }
  if(S.kind==='snake'&&S.hintT>0){ ctx.globalAlpha=Math.min(1,S.hintT); label('Запрыгивай на змею и катайся · спрыгивай на следующую опору',VW/2,VH-26,15,'#e8effa'); ctx.globalAlpha=1; }
  if(S.kind==='brawl'){ label('ВОЛНА '+Math.max(1,S.wave)+' / '+WAVES.length+(S.opened?' · ВЫХОД ОТКРЫТ':' · врагов: '+(enemies.length+S.queue.length)),VW/2,80,15,S.opened?'#7fe08a':'#ffd166');
    if(S.hintT>0){ ctx.globalAlpha=Math.min(1,S.hintT); label('Болт: способность на земле — СМЭШ (враги летят в стены) · Искра: рывок жжёт врагов',VW/2,VH-26,15,'#e8effa'); ctx.globalAlpha=1; } }
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
      <p style="max-width:46ch">Это тестовая версия: девять испытаний в духе старых аркад. Напишите, что понравилось и что поправить — по ним будем решать, брать ли такие уровни в основную игру.</p>
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
      <p><b style="color:#ff6b6b">Пресс.</b> Сверху опускается пресс — бегите к дыре в полу и прыгайте вниз, этаж за этажом.</p>
      <p><b style="color:#e7b54a">Змеиный мост.</b> Запрыгивайте на ездящих змей и спрыгивайте на следующую опору. Внизу шипы.</p>
      <p><b style="color:#7fc7ff">Канал.</b> Гонка по воде: водовороты и рыб-роботов перепрыгивать, под балками пригибаться.</p>
      <p><b style="color:#62c7c1">Драка в цеху.</b> Пять волн врагов. Болт: способность на земле — <b>смэш</b>, враги отлетают в стены. Искра: рывок обжигает.</p>
      <p><b style="color:#c79bff">Ракета.</b> Прыжок — вверх, способность — вниз. Шестерёнки — топливо, без него ракета падает.</p>
      <p><b style="color:#5fd6a0">Труба.</b> Скользите по трубе: прыжок — вверх, способность — вниз. В заслонках гуляет зелёное окошко — пролетайте только через него.</p>
      <p><b style="color:#ff9a8a">Погоня за Механиком.</b> Стреляйте в Механика на доске и сбейте его до финиша, его мины перепрыгивайте.</p>
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
