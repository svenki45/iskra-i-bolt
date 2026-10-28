/* ===== ИСПЫТАНИЯ (тестовая Steam-сборка desktop-bt): уровни-аттракционы в духе старых аркад =====
   Вставляется сборщиком tools/bt/build.py внутрь кода игры (перед const GAME_VER) — только в копию desktop-bt.
   Основная игра этот файл не видит. Механики свои: доска, трос, пресс, змеи, канал, драка, ракета, погоня за Механиком. */
/*BT_N=41*/
var BTX={z:0,lx:0,ly:0,fy:null};   // подсказки камере (читаются в draw)
const BT=(()=>{
const S={on:false,kind:null,L:null,cp:null,v:0,boost:0,freeze:0,banner:null,warnBeep:-1,hintT:0,padCd:{}};
const FL=17, TOP=6;        // гонка: ряд пола и последний ряд потолка тоннеля
const H0={spark:30,bolt:56}, HD={spark:15,bolt:20};   // рост стоя / пригнувшись
const RJ=1400;   // прыжок с волны-трамплина (серфинг)
const JV=760, JV2=700, GX=0.45;   // гонка: скорость прыжка и добавка к тяжести (прыжок короче и резче)
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// темп растёт от уровня к уровню: 1-е испытание спокойное (×0.9), дальше плавно до ×1.35 к последним
let PACE=0.9;
const paceFor=i=>0.9+0.45*Math.min(1,Math.max(0,(typeof ORD!=='undefined'&&ORD[i]!=null?ORD[i]:0))/Math.max(1,DEFS.length-1));
const paceRamp=()=>clamp((PACE-0.9)/0.45,0,1);
const speedMul=()=>{ const D=diffLv(); return PACE*(D<0?0.86:D===0?1:D===1?1.08:1.15); };
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
  {kind:'lift',name:'Лифт-шахта',desc:'платформа едет вверх · пилы и шипы',motif:'Масляный подвал',hue:265,par:75,dur:60,
   hint:'Лифт поднимается по шахте. Низкие пилы — прыгай, высокие — не прыгай, красные шипы на полу и стенах — отойди заранее. Болт: способность на земле сбивает пилы и прикрывает Искру.'},
  {kind:'boss',name:'Кузнец',desc:'босс-робот · три фазы, смэш и огонь',motif:'Литейная',hue:8,par:100,
   hint:'Огромный робот-Кузнец. Топот — волны по полу (перепрыгни), ракеты — уходи с красных полос, в ярости летят пилы. Болт: способность вблизи — смэш. Искра: стреляй и рывком жги. Три фазы!'},
  {kind:'cart',name:'Ритм',desc:'гонка по бит · прыжок, пригибание, выстрел',motif:'Ржавый цех',hue:300,par:55,base:400,top:400,boost:0,lead:15,rhythm:true,beats:84,
   hint:'Всё идёт в такт: пульс внизу — это удар. Жёлтая стрелка — прыжок, красная — пригнись (способность), мишень-ящик — СТРЕЛЯЙ (держи огонь). Попадай в ритм!'},
  {kind:'mag',name:'Магнит',desc:'гравитация вверх-вниз · потолок и пол',motif:'Масляный подвал',hue:190,par:65,
   hint:'Способность — перевернуть гравитацию: падаешь вверх и бежишь по потолку. Шипы на полу — беги по потолку, на потолке — по полу. Стены с щелью: проходи с той стороны, где щель. Прыжок — оттолкнуться.'},
  {kind:'relay',name:'Эстафета',desc:'вдвоём · несите друг друга · общий таймер',motif:'Литейная',hue:30,par:90,time:90,
   hint:'Способность рядом с напарником — ВЗЯТЬ его на плечи; ещё раз — БРОСИТЬ вперёд. Бросьте напарника через пропасть или на стену: он нажмёт кнопку и откроет мост или лифт. Время общее!'},
  {kind:'cart',name:'Погоня за Механиком',desc:'гонка на доске · сбей Механика до финиша',motif:'Ржавый цех',hue:20,par:50,base:330,top:420,boost:130,lead:16,rival:12,
   hint:'Механик удирает на своей доске и бросает мины. Стреляй в него и сбей до финиша! Мины перепрыгивай.',
   track:'r14 w r12 g r12 w r10 p2 r12 g r12 f r10 w r12 g r10 b r18 w r10 p2 r12 g r12 h w r12 f r10 g r12 w r10 p3 r12 g r10 w r12 b r18 w r12 g r12 w r14'},
  {kind:'cart',name:'Серфинг',desc:'доска по волнам · буи-мины, медузы, волны-трамплины',motif:'Масляный подвал',hue:195,par:50,base:340,top:440,boost:130,lead:14,water:true,surf:true,
   hint:'Волны несут сами. Прыжок — через буи-мины и скалы, способность (S / ↓) — пригнуться под медуз. На волне-трамплине (бирюзовая полоса) ПРЫГНИ — взлетишь высоко и соберёшь шестерёнки в воздухе.',
   track:'r10 m r9 m r9 w r10 g r9 m r10 f r8 m r6 m r10 v r26 b r14 w r12 m r12 g r12 m r12 f r8 g r8 m r8 h w r10 v r26 m r9 g r8 b r14 m r12 w r12 m r12 g r12 f r8 m r6 m r8 g r8 w r10 v r26 m r8 g r8 w r8 m r12'},
  {kind:'wire',name:'Колесо на проводе',desc:'три провода · шар-преследователь · смена проводов',motif:'Паровой коридор',hue:215,par:55,base:340,top:440,
   hint:'Едешь на колесе по проводу, сзади гонится электрошар. Прыжок (W / ↑) — на провод выше, способность (S / ↓) — на провод ниже. Искры на проводе обходи. Врежешься — замедлишься, и шар нагонит!'},
  {kind:'maze',name:'Лабиринт',desc:'три этажа, лифты, три рычага · охотник-шар',motif:'Паровой коридор',hue:285,par:85,
   hint:'Нажми три рычага (встань на светящиеся плиты) — откроется выход. Лифты возят между этажами. Охотник-шар летит сквозь стены: кусается, но его можно оглушить выстрелом, смэшем Болта или рывком Искры.'},
  {kind:'ice',name:'Лёд',desc:'скользкие острова · ямы с шипами · льдины · лавина',motif:'Склад пружин',hue:195,par:80,
   hint:'Пол скользкий: разгоняешься и тормозишь не сразу. Прыжок — через шипы и ямы с шипами. Широкие ямы — на плывущей льдине. Сзади сходит лавина — не отставай!',
   track:'g10 f12 s1 f9 s1 f8 s2 f8 k f4 f6 p2 f8 p3 f7 p2 f9 s1 f6 s2 f8 k f4 f8 m7 f9 p3 f10 m8 f10 h f5 s2 f6 s1 f6 s1 f8 k f4 f8 p3 f6 p3 f6 p3 f6 s2 f6 s2 f6 s1 f10 m9 f8 s2 f7 p3 f6 s2 f8 k f4 f10 p2 f6 p3 f6 p2 f6 p3 f10 m8 f10 s2 f6 s2 f6 p3 f6 s1 f6 s1 f12'},
  {kind:'rot',name:'Вращающаяся комната',desc:'ветряки с лопастями · пережди и беги',motif:'Часовой механизм',hue:35,par:55,len:216,flags:[36,64,104,146,198],
   hint:'Огромные ветряки с лопастями. Лопасть бьёт — подожди, пока она пройдёт, и беги дальше. Между ветряками можно стоять спокойно. Пары ветряков рядом — подгадывай окно. Флажки сохраняют место.',
   mills:[{x:22,n:2,w:0.8,L:8.5,dir:1,ph:0},{x:50,n:2,w:0.9,L:8.5,dir:-1,ph:0.5},{x:78,n:2,w:0.9,L:8.5,dir:1,ph:0},{x:90,n:2,w:0.9,L:8.5,dir:-1,ph:1.57},
          {x:120,n:2,w:0.9,L:8.5,dir:1,ph:0.3},{x:132,n:2,w:0.9,L:8.5,dir:-1,ph:1.0},{x:162,n:2,w:0.85,L:8.5,dir:1,ph:0},{x:174,n:2,w:0.9,L:8.5,dir:-1,ph:0.8},{x:186,n:2,w:0.9,L:8.5,dir:1,ph:1.9}]},
  {kind:'iso',name:'Заводской двор',desc:'драка в глубину · враги со всех сторон',motif:'Литейная',hue:25,par:110,
   hint:'Двор, враги идут со всех сторон. Ходи не только вправо-влево, но и в глубину — вверх-вниз по двору. Бей врагов, прыгай, уходи с линии бросков. Победи все волны и иди вправо к выходу.'},
];

function rhythmTrack(D){
  const R=rng(909), N=D.beats, pat=[]; let last=-9, lastT='';
  for(let i=0;i<N;i++){ pat.push('.'); }
  const gapNeed=(a,b)=>b==='T'||a==='T'?1:(a==='D'&&b==='D'?1:2);
  for(let i=3;i<N-3;i++){ const pr=i/N, chance=0.34+0.3*pr; if(R()>chance) continue;
    const opts=['J','D','T']; if(pr>.25) opts.push('P'); if(pr>.5) opts.push('J','D'); const t=opts[Math.floor(R()*opts.length)];
    if(i-last<gapNeed(lastT,t)) continue; pat[i]=t; last=i; lastT=t; }
  for(let i=14;i<N-4;i+=22){ if(pat[i]==='.'&&pat[i+1]==='.') pat[i]='f'; }
  for(const x of [31,63]) if(pat[x]==='.') pat[x]='h';
  const out=[]; for(let i=0;i<N;i++){ const c=pat[i];
    if(c==='J') out.push('w1','r4'); else if(c==='D') out.push('g','r4'); else if(c==='T') out.push('T','r4'); else if(c==='P') out.push('p2','r3');
    else if(c==='f'){ out.push('f','r5'); } else if(c==='h'){ out.push('h','r5'); } else out.push('r5'); }
  return out.join(' ');
}
function cartLevel(D){
  if(D.rhythm&&!D.track) D.track=rhythmTrack(D);
  const rows=18, cols=[], obs=[], strips=[], pads=[], flags=[], pick=[], fish=[], shoots=[], buoys=[], ramps=[];
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
    else if(k==='T'){ obs.push({t:'shoot',x0:cols.length,x1:cols.length}); shoots.push({x:cols.length,dead:false}); cols.push(col()); }
    else if(k==='m'){ obs.push({t:'jump',x0:cols.length,x1:cols.length,buoy:true}); buoys.push({x:cols.length}); cols.push(col()); }
    else if(k==='v'){ const x0=cols.length; ramps.push({x:x0}); for(const dx of [7,12,17]) for(const ty of [8,10,12]) pick.push({type:'gear',tx:x0+dx,ty}); }   // волна-трамплин: прыжок с неё — высоко, а шестерёнки висят в воздухе
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
    bt:{kind:'cart',obs,strips,pads,flags,spots,finishX,exitC:(ex0+1.5)*T,base:D.base,top:D.top,boost:D.boost,len:W,fish,shoots,buoys,ramps,surf:!!D.surf,rhythm:!!D.rhythm,water:!!D.water,rival:D.rival||0}};
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
const PLATF={chase:1,snake:1,brawl:1,lift:1,boss:1,maze:1,ice:1,rot:1};
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
  const B=L.bt; BTX.z=1.6; BTX.ly=VH*0.2/1.6; for(const f of B.flags) f.on=!!(S.cp&&S.cp.i>=f.i);
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
    P.y+=v*PACE*dt; if(Math.random()<dt*3) shake=Math.max(shake,1.5); }
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
  if(!(S.on&&S.kind==='snake')){ _updateMovers(h); if(S.on&&(S.kind==='maze'||S.kind==='ice')) mazeAssist(); return; }
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
  const block=(x,y,w,h)=>{ for(let i=0;i<w;i++) for(let j=0;j<h;j++) g[y+j][x+i]='#'; obs.push([x,x+w-1,y,h]); };
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
    bt:{kind:'rocket',obsList:obs,finishX,spots,flags,prof,base:D.base,top:D.top}};
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

// ---------- лифт-шахта: арена, лифт «едет вверх», с боков вылетают пилы и шипы ----------
const LX0=6*T, LX1=26*T, LFL=17*T;
function liftLevel(D){
  const W=32,H=18,g=[...Array(H)].map(()=>Array(W).fill('.'));
  for(let x=0;x<W;x++){ g[0][x]='#'; g[17][x]='#'; } for(let y=0;y<H;y++){ for(let x=0;x<6;x++){ g[y][x]='#'; g[y][W-1-x]='#'; } }
  for(let x=8;x<=11;x++) g[13][x]='#'; for(let x=20;x<=23;x++) g[13][x]='#';
  for(let x=14;x<=17;x++){ g[15][x]='E'; g[16][x]='E'; }
  g[16][10]='1'; g[16][21]='2';
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:[],pickups:[],movers:[],winds:[],checkpoints:[],pz:[],tier:3,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'lift',dur:D.dur}};
}
function genHaz(dur){
  const R=rng(4242), D=diffLv(), out=[]; let t=3.6; const v0=(250+25*D)*PACE, g0=D<0?2.6:D===0?2.3:D===1?2.0:1.8, gk=1/1.25, order=['low','floor','high','wall','pair','low','floor','wall','high','pair'];
  let i=0; while(t<dur-5){ const k=order[i++%order.length], pr=t/dur, v=v0*(1+0.25*pr), side=R()<.5?-1:1, mk=(sd,hi,tt)=>({k:'saw',hi,x0:sd<0?LX0-18:LX1+18,vx:(sd<0?1:-1)*v,y:LFL-(hi?100:17),t0:tt-0.9,t1:tt,side:sd});
    if(k==='low') out.push(mk(side,false,t)); else if(k==='high') out.push(mk(side,true,t));
    else if(k==='pair'){ out.push(mk(side,false,t)); out.push(mk(-side,true,t+0.8)); }
    else if(k==='floor'){ const cx=(8+R()*16)*T; out.push({k:'floor',cx,w:3.4*T,t0:t-0.9,t1:t,t2:t+0.9}); if(pr>.45){ const c2=cx+(cx>16*T?-1:1)*7*T; out.push({k:'floor',cx:c2,w:3.4*T,t0:t-0.9,t1:t,t2:t+0.9}); } }
    else out.push({k:'wall',side,w:3.4*T,t0:t-0.9,t1:t,t2:t+1.0});
    t+=g0*gk*(1-0.3*pr); }
  return out;
}
function setupLift(L){ BTX.z=1.5; S.lt=0; S.haz=genHaz(L.bt.dur); S.pidle=new Map(); exitLocked=true; S.opened=false; S.hintT=7; banner('ПОДЪЁМ!','#c79bff',1.3); }
function hazRect(h){
  if(h.k==='saw') return {x:h.x-15,y:h.y-15,w:30,h:30};
  if(h.k==='floor') return {x:h.cx-h.w/2,y:LFL-28,w:h.w,h:28};
  if(h.k==='col') return {x:h.cx-h.w/2,y:3*T,w:h.w,h:LFL-3*T};
  return {x:h.side<0?LX0:LX1-h.w,y:3*T,w:h.w,h:LFL-3*T};
}
function liftPost(dt){
  S.hintT=Math.max(0,S.hintT-dt); S.lt+=dt; const dur=S.L.bt.dur;
  for(const h of S.haz){ if(h.k==='saw'){ if(S.lt<h.t1) continue; h.x=h.x0+h.vx*(S.lt-h.t1); if(h.dead) continue; if(h.x<LX0-60||h.x>LX1+60) h.dead=true; } }
  for(const p of live()){ const fy=p.y+p.h, hi=!p.down&&fy<LFL-T*2&&p.onGround, c=p.x+p.w/2; let q=S.pidle.get(p); if(!q){ q={a:c,t:0}; S.pidle.set(p,q); }
    if(!hi||Math.abs(c-q.a)>T*1.2){ q.a=c; q.t=0; } else { q.t+=dt; if(q.t>2.2){ q.t=-0.6; S.haz.push({k:'col',cx:c,w:T*2.6,t0:S.lt,t1:S.lt+0.9,t2:S.lt+1.8}); } } }
  for(const p of live()){ if(p.down||p.inv>0) continue; for(const h of S.haz){ if(h.dead) continue;
      const act=h.k==='saw'?S.lt>=h.t1:(S.lt>=h.t1&&S.lt<=h.t2); if(!act) continue; const r=hazRect(h);
      if(h.k==='saw'?(h.hi?(p.y<h.y+15&&p.y+p.h>h.y-15):true)&&overlap(p,r):overlap(p,r)){ _hurt(p); p.vy=-360; p.vx=(p.x+p.w/2<(r.x+r.w/2)?-1:1)*260; texts.push({x:p.x+p.w/2,y:p.y-30,t:h.k==='saw'?'ПИЛА!':'ШИПЫ!',life:1,c:'#ff6b6b',pop:true}); sfx('hit'); shake=Math.max(shake,6); break; } } }
  if(S.lt>=dur&&!S.opened){ S.opened=true; exitLocked=false; banner('ПРИЕХАЛИ! ВЫХОД ОТКРЫТ','#7fe08a',1.6); sfx('win'); }
  platformPost(dt);
}
function drawLift(){
  const t=S.lt||0, off=(t*220)%80; ctx.save();
  for(const sx of [0,LX1]){ ctx.fillStyle='rgba(120,140,160,.22)'; for(let y=-80+off;y<LFL;y+=80) ctx.fillRect(sx+6,y,LX0-12,6); ctx.fillStyle='rgba(255,209,102,.18)'; ctx.fillRect(sx+(sx?T*0.5:LX0-T*0.7),0,6,LFL); }
  ctx.fillStyle='rgba(199,155,255,.14)'; for(let k=0;k<7;k++){ const x=LX0+60+k*(LX1-LX0-120)/6, y=((t*320+k*173)%(LFL+120))-60; ctx.fillRect(x,y,3,50); }
  const dur=S.L.bt.dur, fl=Math.floor(clock*8)%2;
  for(const h of S.haz||[]){ if(h.dead) continue;
    if(h.k==='saw'){
      if(t>=h.t0&&t<h.t1){ const x=h.side<0?LX0+22:LX1-22; ctx.globalAlpha=fl?1:.45; ctx.fillStyle=h.hi?'#7fd3ff':'#ffd166'; ctx.beginPath(); if(h.side<0){ ctx.moveTo(x-10,h.y-14); ctx.lineTo(x+16,h.y); ctx.lineTo(x-10,h.y+14); } else { ctx.moveTo(x+10,h.y-14); ctx.lineTo(x-16,h.y); ctx.lineTo(x+10,h.y+14); } ctx.closePath(); ctx.fill(); ctx.globalAlpha=1; label(h.hi?'ВЫСОКАЯ':'ПРЫГАЙ',x+(h.side<0?44:-44),h.y-24,10,ctx.fillStyle); }
      else if(t>=h.t1){ ctx.save(); ctx.translate(h.x,h.y); ctx.rotate(t*14*(h.vx>0?1:-1)); ctx.fillStyle='#cfd8e0'; ctx.beginPath(); for(let k=0;k<16;k++){ const a=k/16*Math.PI*2, r=k%2?12:19; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); ctx.fill(); ctx.fillStyle='#5b6b7a'; ctx.beginPath(); ctx.arc(0,0,6,0,7); ctx.fill(); ctx.restore(); if(h.hi){ ctx.strokeStyle='rgba(207,216,224,.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(h.x0,h.y); ctx.lineTo(h.x,h.y); ctx.stroke(); } }
    } else if(t>=h.t0&&t<=h.t2){ const r=hazRect(h), warn=t<h.t1;
      if(warn){ ctx.globalAlpha=fl?.5:.25; ctx.fillStyle='#ff4d5e'; ctx.fillRect(r.x,h.k==='floor'?LFL-8:r.y,r.w,h.k==='floor'?8:r.h); ctx.globalAlpha=1; label('ШИПЫ!',r.x+r.w/2,h.k==='floor'?LFL-40:LFL-120,12,'#ff6b6b'); }
      else if(h.k==='col'){ ctx.fillStyle='#e6edf3'; const n=Math.round(r.w/22); for(let k=0;k<n;k++){ const x=r.x+k*r.w/n; ctx.beginPath(); ctx.moveTo(x,r.y); ctx.lineTo(x+r.w/n/2,r.y+r.h); ctx.lineTo(x+r.w/n,r.y); ctx.closePath(); ctx.fill(); } }
      else { ctx.fillStyle='#e6edf3'; const n=Math.round(r.w/22); if(h.k==='floor'){ for(let k=0;k<n;k++){ const x=r.x+k*r.w/n; ctx.beginPath(); ctx.moveTo(x,LFL); ctx.lineTo(x+r.w/n/2,LFL-28); ctx.lineTo(x+r.w/n,LFL); ctx.closePath(); ctx.fill(); } }
        else { const m=Math.round(r.h/26); for(let k=0;k<m;k++){ const y=r.y+k*r.h/m; ctx.beginPath(); if(h.side<0){ ctx.moveTo(r.x,y); ctx.lineTo(r.x+r.w,y+r.h/m/2); ctx.lineTo(r.x,y+r.h/m); } else { ctx.moveTo(r.x+r.w,y); ctx.lineTo(r.x,y+r.h/m/2); ctx.lineTo(r.x+r.w,y+r.h/m); } ctx.closePath(); ctx.fill(); } } } } }
  ctx.restore();
}

// ---------- босс «Кузнец»: арена, три фазы ----------
const BGY=(h)=>LFL-h;
function bossLevel(D){ const L=brawlLevel(D); L.bt={kind:'boss'}; return L; }
function setupBoss(L){ BTX.z=1; const D=diffLv(), mx=Math.round(300*(D<0?0.75:1+0.2*D)); S.haz=null;
  S.bo={x:15*T-50,y:BGY(112),w:100,h:112,vy:0,hp:mx,max:mx,ph:1,st:'intro',t:1.8,cd:2.2,face:-1,flash:0,atk:null,dead:0};
  S.waves=[]; S.rk=[]; S.sawz=[]; S.hintT=8; exitLocked=true; S.opened=false; banner('КУЗНЕЦ!','#ff6b6b',1.6); sfx('boost'); }
function damageBoss(d,src){ const b=S.bo; if(!b||b.hp<=0||b.st==='intro'||b.st==='roar') return; b.hp=Math.max(0,b.hp-d); b.flash=.1; sfx('hit'); try{ dmgNum(b.x+b.w/2+(Math.random()*40-20),b.y-6,d,src||'spark',false,true); }catch(e){}
  if(b.hp<=0){ b.dead=0.01; b.st='dead'; S.waves=[]; S.rk=[]; S.sawz=[]; shake=Math.max(shake,14); flash('#ffffff',.5); banner('КУЗНЕЦ ПОБЕЖДЁН!','#7fe08a',1.8); sfx('kill'); return; }
  const k=b.hp/b.max, np=k<=0.34?3:k<=0.67?2:1;
  if(np>b.ph){ b.ph=np; b.st='roar'; b.t=1.3; b.atk=null; S.waves=[]; S.rk=[]; S.sawz=[]; shake=Math.max(shake,12); flash('#ff3b4e',.4); banner(np===2?'ФАЗА 2: РАКЕТЫ':'ФАЗА 3: ЯРОСТЬ!','#ff9a8a',1.6); sfx('slam'); } }
function bossRect(){ const b=S.bo; return {x:b.x+8,y:b.y+6,w:b.w-16,h:b.h-6}; }
function bossHurt(p,kx){ if(p.down||p.inv>0) return false; _hurt(p); p.vy=-380; p.vx=kx; shake=Math.max(shake,6); sfx('hit'); return true; }
function bossPost(dt){
  const b=S.bo, L=live(); S.hintT=Math.max(0,S.hintT-dt); if(!b) return; b.flash=Math.max(0,b.flash-dt);
  if(b.st==='dead'){ b.dead+=dt; if(Math.random()<dt*20) burst(b.x+Math.random()*b.w,b.y+Math.random()*b.h,10,['#ffd166','#ff8a3d','#fff'],300,.5); if(b.dead>1.6&&!S.opened){ S.opened=true; exitLocked=false; banner('ВЫХОД ОТКРЫТ!','#7fe08a',1.6); sfx('win'); } return; }
  const near=L.length?L.reduce((a,q)=>Math.abs(q.x-b.x)<Math.abs(a.x-b.x)?q:a):null, gy=BGY(b.h);
  b.t-=dt; const sp=[0,62,78,98][b.ph], D=diffLv();
  if(b.st==='intro'||b.st==='roar'){ if(b.t<=0){ b.st='walk'; b.cd=1.2; } }
  else if(b.st==='walk'){ if(near){ const dx=near.x+near.w/2-(b.x+b.w/2); b.face=Math.sign(dx)||b.face; if(Math.abs(dx)>30) b.x+=Math.sign(dx)*sp*dt; } b.x=Math.max(T,Math.min(31*T-b.w,b.x)); b.cd-=dt;
    if(b.cd<=0){ const opts=['stomp']; if(b.ph>=2) opts.push('rocket','rocket'); if(b.ph>=3) opts.push('saws'); b.atk=opts[Math.floor(Math.random()*opts.length)]; b.st='wind'; b.t=b.atk==='stomp'?0.75:0.9; if(b.atk==='saws') b.t=0.7; sfx('pk_shield'); } }
  else if(b.st==='wind'){ if(b.t<=0){
      if(b.atk==='stomp'){ b.st='jump'; b.vy=-760; sfx('jump'); }
      else if(b.atk==='rocket'){ const n=2+b.ph; for(let i=0;i<n;i++){ const tgt=L.length?L[i%L.length]:null; const x=tgt?tgt.x+tgt.w/2+(i>=L.length?(Math.random()*160-80):0):(8+Math.random()*16)*T; S.rk.push({x:Math.max(2*T,Math.min(30*T,x)),t:-i*0.18,warn:1.0,boom:.4}); } sfx('slam'); b.st='rest'; b.t=1.3; }
      else { for(const hi of [false,true]) S.sawz.push({x:b.x+b.w/2,y:LFL-(hi?100:17),vx:(hi?-1:1)*(300+30*D),hi,born:S.lt0||0}); S.sawz.push({x:b.x+b.w/2,y:LFL-17,vx:-(300+30*D),hi:false}); sfx('slam'); b.st='rest'; b.t=1.4; } } }
  else if(b.st==='jump'){ b.y+=b.vy*dt; b.vy+=1900*dt; if(b.y>=gy){ b.y=gy; b.vy=0; b.st='rest'; b.t=0.9; shake=Math.max(shake,12); hitstop=Math.max(hitstop,.05); sfx('slam'); const sv=300+50*b.ph; S.waves.push({x:b.x+b.w/2,vx:-sv},{x:b.x+b.w/2,vx:sv}); rings.push({x:b.x+b.w/2,y:LFL-6,r:8,max:120,life:.4,c:'#ffb347',w:6}); burst(b.x+b.w/2,LFL-6,24,['#ffd166','#ff8a3d','#fff'],400,.5); } }
  else if(b.st==='rest'){ if(b.t<=0){ b.st='walk'; b.cd=[0,2.4,1.9,1.5][b.ph]; } }
  for(const w of S.waves){ w.x+=w.vx*dt; if(w.x<T||w.x>31*T) w.dead=true; }
  S.waves=S.waves.filter(w=>!w.dead);
  for(const r of S.rk){ r.t+=dt; } S.rk=S.rk.filter(r=>r.t<r.warn+r.boom);
  for(const z of S.sawz){ z.x+=z.vx*dt; if(z.x<T||z.x>31*T) z.dead=true; } S.sawz=S.sawz.filter(z=>!z.dead);
  // урон героям
  const br=bossRect();
  for(const p of L){ if(p.down||p.inv>0) continue;
    if(overlap(p,br)&&b.st!=='intro'){ if(bossHurt(p,(p.x+p.w/2<b.x+b.w/2?-1:1)*320)){ texts.push({x:p.x+p.w/2,y:p.y-30,t:'БАХ!',life:.9,c:'#ff6b6b',pop:true}); continue; } }
    for(const w of S.waves) if(overlap(p,{x:w.x-16,y:LFL-34,w:32,h:34})){ if(bossHurt(p,Math.sign(w.vx)*200)) texts.push({x:p.x+p.w/2,y:p.y-30,t:'ВОЛНА!',life:.9,c:'#ff6b6b',pop:true}); break; }
    if(p.inv>0) continue;
    for(const r of S.rk) if(r.t>=r.warn&&overlap(p,{x:r.x-30,y:0,w:60,h:LFL})){ if(bossHurt(p,0)) texts.push({x:p.x+p.w/2,y:p.y-30,t:'РАКЕТА!',life:.9,c:'#ff6b6b',pop:true}); break; }
    if(p.inv>0) continue;
    for(const z of S.sawz) if(overlap(p,{x:z.x-15,y:z.y-15,w:30,h:30})){ if(bossHurt(p,Math.sign(z.vx)*200)) texts.push({x:p.x+p.w/2,y:p.y-30,t:'ПИЛА!',life:.9,c:'#ff6b6b',pop:true}); break; } }
  for(const r of S.rk) if(r.t>=r.warn&&!r.bang){ r.bang=true; burst(r.x,LFL-20,22,['#ffd166','#ff8a3d','#fff'],420,.5); shake=Math.max(shake,5); sfx('hit'); }
  // урон боссу: выстрелы и рывок Искры
  if(b.st!=='intro'&&b.st!=='roar'){
    for(const bl of bullets){ if(bl.life<=0||!bl.hit||bl.hit.has('boss')) continue; if(overlap(bl,br)){ bl.hit.add('boss'); damageBoss(Math.max(1,Math.round((bl.dmg||1)*2.2)),bl.owner==='bolt'?'slam':'spark'); if(!bl.pierce) bl.life=0; } }
    for(const p of L){ if(p.kind==='spark'&&p.dash>0&&b.dashHit!==p.dashN&&overlap({x:p.x-6,y:p.y-6,w:p.w+12,h:p.h+12},br)){ b.dashHit=p.dashN; damageBoss(4,'power'); burst(p.x+p.w/2,p.y+p.h/2,14,['#ffd166','#ff8a3d'],260,.4); texts.push({x:b.x+b.w/2,y:b.y-20,t:'ОГОНЬ!',life:.7,c:'#ffb347'}); } } }
  platformPost(dt);
}
function drawBoss(){
  const b=S.bo; if(!b) return; const t=clock, cx=b.x+b.w/2;
  // красные полосы ракет и волны
  for(const r of S.rk){ if(r.t<0) continue; if(r.t<r.warn){ ctx.save(); ctx.globalAlpha=(Math.floor(t*10)%2?.4:.2); ctx.fillStyle='#ff4d5e'; ctx.fillRect(r.x-30,0,60,LFL); ctx.globalAlpha=.9; ctx.fillStyle='#ff6b6b'; ctx.beginPath(); ctx.arc(r.x,LFL-14,10+r.t*14,0,7); ctx.fill(); ctx.restore(); }
    else { ctx.save(); const k=(r.t-r.warn)/r.boom; ctx.globalAlpha=1-k*.5; const gr=ctx.createLinearGradient(0,0,0,LFL); gr.addColorStop(0,'rgba(255,240,180,.1)'); gr.addColorStop(1,'#ffb347'); ctx.fillStyle=gr; ctx.fillRect(r.x-30*(1-k*.3),0,60*(1-k*.3),LFL); ctx.restore(); } }
  for(const w of S.waves){ ctx.save(); ctx.fillStyle='#ffb347'; ctx.beginPath(); ctx.moveTo(w.x-18,LFL); ctx.quadraticCurveTo(w.x,LFL-46,w.x+18,LFL); ctx.closePath(); ctx.fill(); ctx.fillStyle='rgba(255,240,180,.8)'; ctx.beginPath(); ctx.moveTo(w.x-9,LFL); ctx.quadraticCurveTo(w.x,LFL-26,w.x+9,LFL); ctx.closePath(); ctx.fill(); ctx.restore(); }
  for(const z of S.sawz){ ctx.save(); ctx.translate(z.x,z.y); ctx.rotate(t*14*Math.sign(z.vx)); ctx.fillStyle='#cfd8e0'; ctx.beginPath(); for(let k=0;k<16;k++){ const a=k/16*Math.PI*2, r=k%2?12:19; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); ctx.fill(); ctx.fillStyle='#5b6b7a'; ctx.beginPath(); ctx.arc(0,0,6,0,7); ctx.fill(); ctx.restore(); }
  // сам робот
  ctx.save(); const dead=b.st==='dead', wind=b.st==='wind', sq=wind?0.9:b.st==='jump'?1.08:1, sh=dead?Math.max(0,1-b.dead/1.6):1;
  ctx.translate(cx,b.y+b.h); ctx.scale(1,sq*sh); ctx.translate(-cx,-(b.y+b.h)); if(dead) ctx.globalAlpha=sh;
  const wob=b.st==='walk'?Math.sin(t*9)*3:0, shk=(wind||b.st==='roar')?Math.sin(t*50)*2:0, x0=b.x+shk;
  ctx.fillStyle='#3b4552'; ctx.fillRect(x0+14,b.y+b.h-30+wob,26,30); ctx.fillRect(x0+b.w-40,b.y+b.h-30-wob,26,30);
  const g=ctx.createLinearGradient(x0,0,x0+b.w,0); g.addColorStop(0,'#6b7886'); g.addColorStop(.5,'#9aa8b6'); g.addColorStop(1,'#5d6b78'); ctx.fillStyle=g; rr(ctx,x0+4,b.y+26,b.w-8,b.h-52,14); ctx.fill();
  ctx.fillStyle=b.flash>0?'#ffffff':(b.ph===3?'#ff4d5e':b.ph===2?'#ff9a3d':'#ffd166'); for(let k=0;k<5;k++){ ctx.beginPath(); ctx.moveTo(x0+14+k*16,b.y+58); ctx.lineTo(x0+26+k*16,b.y+58); ctx.lineTo(x0+14+k*16,b.y+74); ctx.lineTo(x0+2+k*16,b.y+74); ctx.closePath(); ctx.fill(); }
  const ay=wind?-18:wob; ctx.fillStyle='#46525f'; rr(ctx,x0-18,b.y+34+ay,24,56,8); ctx.fill(); rr(ctx,x0+b.w-6,b.y+34+ay,24,56,8); ctx.fill(); ctx.fillStyle='#2b333c'; ctx.beginPath(); ctx.arc(x0-6,b.y+96+ay,17,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(x0+b.w+6,b.y+96+ay,17,0,7); ctx.fill();
  ctx.fillStyle=g; rr(ctx,x0+22,b.y-6,b.w-44,38,10); ctx.fill(); ctx.fillStyle='#0b1220'; rr(ctx,x0+28,b.y+4,b.w-56,16,6); ctx.fill();
  const ex=x0+b.w/2+b.face*10; ctx.fillStyle=b.flash>0?'#fff':(b.ph>=3?'#ff3b4e':'#ff6b6b'); ctx.shadowColor='#ff3b4e'; ctx.shadowBlur=12; ctx.beginPath(); ctx.arc(ex-10,b.y+12,5,0,7); ctx.arc(ex+10,b.y+12,5,0,7); ctx.fill(); ctx.shadowBlur=0;
  ctx.strokeStyle='#46525f'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x0+b.w/2,b.y-6); ctx.lineTo(x0+b.w/2,b.y-24); ctx.stroke(); ctx.fillStyle=Math.floor(t*6)%2?'#ff4d5e':'#7a2630'; ctx.beginPath(); ctx.arc(x0+b.w/2,b.y-26,5,0,7); ctx.fill();
  if(b.flash>0){ ctx.globalAlpha=.45; ctx.fillStyle='#fff'; rr(ctx,x0+4,b.y+26,b.w-8,b.h-52,14); ctx.fill(); }
  ctx.restore();
}

// ---------- магнитный уровень: гравитация переключается способностью ----------
const MC=5*T, MF=13*T;     // потолок (низ плиток) и пол (верх плиток)
function magLevel(D){
  const H=20, types=['F','C','P','Q','M','F','C','P','Q','M','S','F','Q','S','M','P','C','S','F','Q','M','S'], R=rng(555);
  const segs=[], saws=[], flags=[]; let x=14; const rects=[];
  const place=[];
  for(const t of types){ const gap=10+Math.floor(R()*3); 
    if(t==='F'){ segs.push({k:'f',x0:x,x1:x+5,need:-1}); x+=6; }
    else if(t==='C'){ segs.push({k:'c',x0:x,x1:x+5,need:1}); x+=6; }
    else if(t==='P'){ segs.push({k:'p',x0:x,x1:x+1,need:-1}); x+=2; }
    else if(t==='Q'){ segs.push({k:'q',x0:x,x1:x+1,need:1}); x+=2; }
    else if(t==='M'){ segs.push({k:'f',x0:x,x1:x+3,need:-1}); segs.push({k:'c',x0:x+9,x1:x+12,need:1}); x+=13; }
    else { saws.push({x:(x+1)*T+20,mid:9*T,A:2.9*T,per:2.1+R()*0.5,ph:R()*6}); segs.push({k:'s',x0:x,x1:x+2,need:0}); x+=3; }
    x+=gap; if(segs.length%4===0) flags.push({x:x-5,on:false}); }
  const finishX=x+4, W=finishX+16, g=[...Array(H)].map(()=>Array(W).fill('.'));
  for(let xx=0;xx<W;xx++){ for(let y=0;y<=4;y++) g[y][xx]='#'; for(let y=13;y<H;y++) g[y][xx]='#'; }
  for(let y=0;y<H;y++){ g[y][0]='#'; g[y][W-1]='#'; }
  for(const sg of segs){ if(sg.k==='p') for(let xx=sg.x0;xx<=sg.x1;xx++) for(let y=8;y<=12;y++) g[y][xx]='#'; if(sg.k==='q') for(let xx=sg.x0;xx<=sg.x1;xx++) for(let y=5;y<=9;y++) g[y][xx]='#'; }
  for(let xx=finishX+4;xx<=finishX+6;xx++){ g[11][xx]='E'; g[12][xx]='E'; }
  g[12][3]='1'; g[12][5]='2';
  const spots=[]; for(let xx=3;xx<finishX-2;xx++){ if(segs.some(sg=>sg.x1>=xx-2&&sg.x0<=xx+11)) continue; spots.push(xx); }
  for(const f of flags) f.spot=spots.filter(q=>q<=f.x).pop()||3;
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:[],pickups:[],movers:[],winds:[],checkpoints:[],pz:[],tier:2,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'mag',segs,saws,flags,spots,finishX,len:W}};
}
function placeMag(sp){ for(const p of players){ if(p.absent) continue; p.mag={g:1,vx:0,vy:0,on:false,cd:0,dir:0,jp:false,flip:false,jwas:false,abwas:false}; p.x=(sp+(p.kind==='bolt'&&!solo?1.6:0))*T+4; p.y=MF-p.h-1; p.vx=p.vy=0; p.onGround=true; p.wasGround=true; } }
function setupMag(L){ const B=L.bt; BTX.z=1.7; BTX.lx=VW*0.2/1.7; BTX.fy=9*T; S.lt=0; S.freeze=S.cp?0.8:1.4; S.hintT=S.cp?0:8;
  for(const f of B.flags) f.on=!!(S.cp&&S.cp.x>=f.x); placeMag(S.cp?(B.flags.filter(f=>f.on).pop()||{spot:3}).spot:3); banner(S.cp?'С ФЛАЖКА':'ГОТОВЬСЯ…','#9cc3ff',S.freeze); }
function magPhys(p,h){
  const M=p.mag; M.cd=Math.max(0,M.cd-h);
  if(S.freeze>0){ p.vx=p.vy=0; return; }
  if(M.flip&&M.cd<=0){ M.g=-M.g; M.cd=0.3; M.vy=M.g*160; M.on=false; sfx('jump'); burst(p.x+p.w/2,p.y+p.h/2,10,['#9cf','#fff'],200,.35); } M.flip=false;
  M.vx=approach(M.vx,M.dir*235,3200*h);
  if(M.jp&&M.on){ M.vy=-M.g*740; M.on=false; sfx('jump'); } M.jp=false;
  M.vy+=M.g*2300*h; M.vy=clamp(M.vy,-900,900);
  const nx=p.x+M.vx*h; if(!tileHit(nx,p.y,p.w,p.h)) p.x=nx; else M.vx=0;
  const dy=M.vy*h; let hit=false;
  if(!tileHit(p.x,p.y+dy,p.w,p.h)) p.y+=dy; else { hit=true; const st=Math.sign(dy)||1; let n=0; while(n<Math.abs(dy)&&!tileHit(p.x,p.y+st,p.w,p.h)){ p.y+=st; n++; } }
  if(hit){ if(Math.sign(M.vy)===M.g) M.on=true; M.vy=0; } else if(Math.abs(M.vy)>40) M.on=false;
  p.vx=M.vx; p.vy=M.vy; p.onGround=M.on; p.wasGround=M.on; p.ground=null;
}
function sawY(q,t){ return q.mid+q.A*Math.sin(t*6.2832/q.per+q.ph); }
function magPost(dt){
  const B=S.L.bt, L=live(); if(!L.length) return; S.hintT=Math.max(0,S.hintT-dt);
  if(S.freeze>0){ S.freeze-=dt; if(S.freeze<=0){ banner('ВПЕРЁД!','#ffd166',.9); sfx('boost'); } return; }
  S.lt+=dt;
  for(const f of B.flags) if(!f.on&&L.some(p=>p.x>f.x*T)){ f.on=true; S.cp={lvl:levelIdx,x:f.x}; sfx('pk_shield'); const p=L[0]; texts.push({x:p.x,y:p.y-50,t:'ФЛАЖОК!',life:1.4,c:'#7fe08a',pop:true}); }
  const bad=[];
  for(const p of L){ if(p.down||p.inv>0) continue; let why=null;
    for(const sg of B.segs){ const x=sg.x0*T, w=(sg.x1-sg.x0+1)*T; if(sg.k==='f'&&overlap(p,{x,y:MF-24,w,h:24})) why='ШИПЫ!'; else if(sg.k==='c'&&overlap(p,{x,y:MC,w,h:24})) why='ШИПЫ!'; }
    for(const q of B.saws){ const y=sawY(q,S.lt); if(overlap(p,{x:q.x-16,y:y-16,w:32,h:32})) why='ПИЛА!'; }
    if(why){ bad.push(p); texts.push({x:p.x+p.w/2,y:p.y-30,t:why,life:1,c:'#ff6b6b',pop:true}); } }
  if(!bad.length) return;
  for(const p of bad){ burst(p.x+p.w/2,p.y+p.h/2,22,['#ff6b6b','#fff','#ffd166'],360,.55); p.inv=0; _hurt(p); if(p.down||p.hp<=0){ p.down=false; die(p,'down'); return; } }
  sfx('hit'); shake=Math.max(shake,8); flash('#ff3b4e',.3); hitstop=Math.max(hitstop,.1);
  const minX=Math.min(...bad.map(p=>p.x))/T, sp=B.spots.filter(q=>q+3<=minX).pop()||3;
  placeMag(sp); for(const p of players) if(!p.absent) p.inv=Math.max(p.inv,1.5); S.freeze=0.8; banner('ЕЩЁ РАЗ!','#ff9a8a',.8);
}
function drawMag(){
  const B=S.L.bt, V=viewRect(), t=clock; ctx.save();
  for(const sg of B.segs){ const x=sg.x0*T, w=(sg.x1-sg.x0+1)*T; if(x+w<V.x-40||x>V.x+V.w+40) continue;
    if(sg.k==='f'||sg.k==='c'){ const fl=sg.k==='f', y0=fl?MF:MC, dir=fl?-1:1, n=Math.round(w/20); ctx.fillStyle='#e6edf3'; for(let k=0;k<n;k++){ const xx=x+k*w/n; ctx.beginPath(); ctx.moveTo(xx,y0); ctx.lineTo(xx+w/n/2,y0+dir*26); ctx.lineTo(xx+w/n,y0); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha=.18+.1*Math.sin(t*6); ctx.fillStyle='#ff4d5e'; ctx.fillRect(x,fl?MF-70:MC,w,70); ctx.globalAlpha=1; } }
  for(const q of B.saws){ if(q.x<V.x-60||q.x>V.x+V.w+60) continue; const y=sawY(q,S.lt||0); ctx.strokeStyle='rgba(207,216,224,.25)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(q.x,MC); ctx.lineTo(q.x,MF); ctx.stroke();
    ctx.save(); ctx.translate(q.x,y); ctx.rotate(t*12); ctx.fillStyle='#cfd8e0'; ctx.beginPath(); for(let k=0;k<16;k++){ const a=k/16*Math.PI*2, r=k%2?13:21; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); ctx.fill(); ctx.fillStyle='#5b6b7a'; ctx.beginPath(); ctx.arc(0,0,6,0,7); ctx.fill(); ctx.restore(); }
  ctx.restore();
}

// ---------- эстафета: несите друг друга, общий таймер ----------
const THROW={vx:600,vy:1000}, LOB={vx:380,vy:1160}, RFR=13;
function relayLevel(D){
  const H=18, spec=['pit','wall','pit','wall'], gaps=[10,10], W0=4+spec.length*30+14, g=[...Array(H)].map(()=>Array(W0).fill('.'));
  for(let x=0;x<W0;x++){ g[0][x]='#'; for(let y=RFR;y<H;y++) g[y][x]='#'; } for(let y=0;y<H;y++){ g[y][0]='#'; g[y][W0-1]='#'; }
  const st=[], movers=[]; let x=5, pi=0;
  for(const t of spec){ const e={type:t,safeX:x+1};
    if(t==='pit'){ const G=gaps[pi++%gaps.length], gs=x+10, ge=gs+G; for(let xx=gs;xx<ge;xx++) for(let y=RFR;y<=H-2;y++) g[y][xx]='.'; e.gs=gs; e.ge=ge; e.plate={x:(ge+2.5)*T,y:RFR*T}; e.mi=movers.length; movers.push({ax:gs,ay:RFR,bx:gs,by:RFR,w:G,sp:0,pause:0}); e.endX=ge+4; x=ge+10; e.throwX=gs-1.1; }
    else { const ex=x+10, wx=ex+3; for(let xx=wx;xx<wx+4;xx++) for(let y=5;y<RFR;y++) g[y][xx]='#'; for(let xx=ex;xx<ex+3;xx++) for(let y=RFR;y<=H-2;y++) g[y][xx]='.'; e.ex=ex; e.wx=wx; e.plate={x:(wx+2)*T,y:5*T}; e.mi=movers.length; movers.push({ax:ex,ay:RFR,bx:ex,by:5,w:3,sp:0,pause:1.1}); e.endX=wx+5; x=wx+4+9; e.throwX=wx-4.8; }
    st.push(e); }
  const finishX=x+2; for(let xx=finishX+3;xx<=finishX+5;xx++){ g[RFR-1][xx]='E'; g[RFR-2][xx]='E'; }
  g[RFR-1][2]='1'; g[RFR-1][4]='2';
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:[],pickups:[],movers,winds:[],checkpoints:[],pz:[],tier:2,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'relay',st,finishX,time:D.time,len:W0}};
}
function relayActivate(e,quiet){ e.on=true; const m=movers[e.mi]; if(!m) return; if(e.type==='pit'){ m.ay=m.by=RFR*T; m.y=RFR*T; } else { m.sp=170; } if(!quiet){ sfx('win'); banner(e.type==='pit'?'МОСТ ВЫДВИНУТ!':'ЛИФТ ЕДЕТ!','#7fe08a',1.2); shake=Math.max(shake,4); } }
function setupRelay(L){ const B=L.bt; BTX.z=1.45; BTX.lx=VW*0.12/1.45; S.rt=B.time*(diffLv()<0?1.3:diffLv()>1?0.85:1); S.hintT=10; S.freeze=1.3; banner('ЭСТАФЕТА!','#ffb347',1.2);
  for(const e of B.st){ e.on=false; e.done=false; const m=movers[e.mi]; if(m){ if(e.type==='pit'){ m.ay=m.by=-4000; m.y=-4000; } else { m.sp=0; m.u=0; m.dir=1; m.hold=0; } } }
  if(solo) for(const e of B.st) relayActivate(e,true); }
function relayPost(dt){
  const B=S.L.bt, L=live(); if(!L.length) return; S.hintT=Math.max(0,S.hintT-dt);
  if(S.freeze>0){ S.freeze-=dt; return; }
  S.rt-=dt; if(S.rt<=0){ S.rt=0; burst(L[0].x,L[0].y,20,['#ff6b6b','#fff'],300,.6); banner('ВРЕМЯ ВЫШЛО!','#ff6b6b',1.4); die(L[0],'down'); return; }
  for(const p of L) if(p.carrying){ const q=p.carrying; q.x=p.x+(p.w-q.w)/2; q.y=p.y-q.h-2; q.vx=0; q.vy=0; q.face=p.face; }
  for(const e of B.st){ if(!e.on&&L.some(p=>p.x+p.w>e.plate.x-24&&p.x<e.plate.x+24&&Math.abs(p.y+p.h-e.plate.y)<10)) relayActivate(e);
    if(!e.done&&L.every(p=>p.x>e.endX*T)){ e.done=true; S.rt+=20; texts.push({x:L[0].x,y:L[0].y-50,t:'+20 с',life:1.2,c:'#7fe08a',pop:true}); sfx('pk_shield'); } }
  for(const p of L){ if(p.down||p.carried) continue; const fell=p.y+p.h>(RFR+2.4)*T; if(!fell) continue;
    const e=B.st.filter(q=>q.safeX*T<p.x).pop()||B.st[0]; burst(p.x+p.w/2,p.y+p.h/2,18,['#ff6b6b','#fff'],320,.5); if(p.carrying){ p.carrying.carried=null; p.carrying=null; }
    p.inv=0; _hurt(p); texts.push({x:p.x+p.w/2,y:(RFR+1)*T,t:'ПРОВАЛ!',life:1,c:'#ff6b6b',pop:true}); sfx('hit'); if(p.down||p.hp<=0){ p.down=false; die(p,'down'); return; }
    p.x=e.safeX*T; p.y=RFR*T-p.h-1; p.vx=p.vy=0; p.thrown=0; p.inv=1.4; }
}
function drawRelay(){
  const B=S.L.bt, V=viewRect(), t=clock; ctx.save();
  for(const e of B.st){ if(e.type==='pit'){ const x=e.gs*T, w=(e.ge-e.gs)*T; if(x+w<V.x-40||x>V.x+V.w+40) continue; ctx.fillStyle='#e6edf3'; const n=Math.round(w/22); for(let k=0;k<n;k++){ const xx=x+k*w/n; ctx.beginPath(); ctx.moveTo(xx,17*T); ctx.lineTo(xx+w/n/2,17*T-24); ctx.lineTo(xx+w/n,17*T); ctx.closePath(); ctx.fill(); } if(!e.on){ ctx.globalAlpha=.5+.3*Math.sin(t*5); ctx.strokeStyle='#ffd166'; ctx.lineWidth=3; ctx.setLineDash([10,8]); ctx.strokeRect(x,RFR*T-2,w,12); ctx.setLineDash([]); ctx.globalAlpha=1; } }
    else if(!e.on){ const x=e.ex*T; ctx.globalAlpha=.5+.3*Math.sin(t*5); ctx.strokeStyle='#ffd166'; ctx.lineWidth=3; ctx.setLineDash([10,8]); ctx.strokeRect(x,RFR*T-2,3*T,12); ctx.setLineDash([]); ctx.globalAlpha=1; }
    const px=e.plate.x, py=e.plate.y; if(px<V.x-60||px>V.x+V.w+60) continue; ctx.fillStyle=e.on?'#7fe08a':'#ff6b6b'; rr(ctx,px-22,py-8,44,10,4); ctx.fill(); ctx.fillStyle='#2b333c'; ctx.fillRect(px-26,py,52,4);
    if(!e.on){ ctx.globalAlpha=.6+.4*Math.sin(t*8); label('КНОПКА',px,py-26,11,'#ffd166'); ctx.globalAlpha=1; } }
  for(const p of live()) if(p.carrying&&state==='play'){ const inpP=readInput?null:null; const up=!!(p.jumpHeld); let x=p.x+p.w/2, y=p.y-p.carrying.h-2, vx=(p.face||1)*(up?LOB.vx:THROW.vx), vy=-(up?LOB.vy:THROW.vy); ctx.fillStyle='rgba(255,255,255,.7)'; for(let k=1;k<=22;k++){ const tt=k*0.045, xx=x+vx*tt, yy=y+vy*tt+0.5*G*tt*tt; if(yy>(RFR+1)*T) break; ctx.beginPath(); ctx.arc(xx,yy,3.2,0,7); ctx.fill(); } }
  ctx.restore();
}
function placeRocket(sp){ for(const p of players){ if(p.absent) continue; const off=solo?0:(p.kind==='spark'?-0.8:0.8); p.x=sp.x*T+4; p.y=(sp.y+off)*T-p.h/2; p.vx=p.vy=0; p.rocket={vy:0,crash:false}; p.onGround=false; } }
function setupRocket(L){
  const B=L.bt; BTX.z=1.7; BTX.lx=VW*0.22/1.7; for(const f of B.flags) f.on=!!(S.cp&&S.cp.x>=f.x);
  placeRocket(S.cp?B.spots.filter(s=>s.x<=S.cp.x).pop()||B.spots[0]:{x:3,y:9});
  S.fuel=100; S.gt=0; S.gateGap=gateGap; S.lastGears=gears; S.freeze=S.cp?0.9:1.4; S.hintT=S.cp?0:6; banner(S.cp?'С ФЛАЖКА':'ЗАВОДИМ РАКЕТУ…','#9cc3ff',S.freeze);
}
function rocketPre(dt){
  const B=S.L.bt, L=live(); if(!L.length) return;
  if(S.freeze>0){ S.freeze-=dt; S.v=0; if(S.freeze<=0){ banner('ПОЛЕТЕЛИ!','#ffd166',.9); sfx('boost'); } return; }
  const lead=Math.max(...L.map(p=>p.x)), prog=clamp(lead/T/B.finishX,0,1);
  S.v=approach(S.v,(B.base+(B.top-B.base)*prog)*speedMul()/PACE*(1+0.25*paceRamp()),500*dt); S.gt=(S.gt||0)+dt; if(B.tube) S.fuel=100;
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

// ---------- колесо на проводе: три провода, шар сзади ----------
const LYW=[6*T,10*T,14*T], WHL=24;     // высота проводов (низ колеса) и подъём героя над проводом
function wireLevel(D){
  const H=18, R=rng(2024), obs=[], pick=[], flags=[]; let x=16, n=0;
  const pats=['0','1','2','01','12','02'];
  while(n<36){
    const pr=n/36; let sp=Math.round(10-3*pr); if(n%7===6) sp+=2;
    x+=sp-1; const two=R()<0.25+0.4*pr, one=['0','1','2'], pair=['01','12','02'];
    const pat=two?pair[Math.floor(R()*3)]:one[Math.floor(R()*3)], lanes=pat.split('').map(Number); obs.push({x,lanes,dead:false}); x+=1; n++;
    const free=[0,1,2].filter(l=>!lanes.includes(l));
    if(n%3===0){ const l=free[Math.floor(R()*free.length)]; for(let k=0;k<3;k++) pick.push({type:'gear',tx:x+3+k,ty:[6,10,14][l]/1-1}); }
    if(n===12||n===24){ const l=free[0]; pick.push({type:'heart',tx:x+4,ty:[6,10,14][l]-1}); }
    if(n===11||n===23) flags.push({x:x+5,on:false});
  }
  const finishX=x+8, W=finishX+20, g=[...Array(H)].map(()=>Array(W).fill('.'));
  for(let xx=0;xx<W;xx++){ g[0][xx]='#'; g[17][xx]='#'; } for(let y=0;y<H;y++){ g[y][0]='#'; g[y][W-1]='#'; }
  for(let xx=finishX;xx<W;xx++){ g[16][xx]='#'; for(let y=1;y<3;y++) g[y][xx]='#'; }
  for(let xx=finishX+4;xx<=finishX+10;xx++){ g[14][xx]='E'; g[15][xx]='E'; }
  g[8][3]='1'; g[10][3]='2';
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:[],pickups:pick,movers:[],winds:[],checkpoints:[],pz:[],tier:2,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'wire',obs,flags,finishX,base:D.base,top:D.top,len:W}};
}
const wireRect=(o,ln)=>({x:o.x*T+8,y:LYW[ln]-64,w:26,h:64});
function placeWire(col){ for(const p of players){ if(p.absent) continue; const lane=solo?1:(p.kind==='spark'?0:2); p.wire={lane,jw:false,aw:false}; p.x=col*T; p.y=LYW[lane]-WHL-p.h; p.vx=p.vy=0; p.onGround=false; p.ground=null; p.rocket=null; } }
function wireSpot(){ return S.cp?S.cp.x:4; }
function setupWire(L){
  const B=L.bt; BTX.z=1.3; BTX.lx=VW*0.2/1.3; S.v=0; S.v0=0; S.stun=0; for(const f of B.flags) f.on=!!(S.cp&&S.cp.x>=f.x);
  const c=wireSpot(); for(const o of B.obs) o.dead=o.x<=c+2; placeWire(c); S.ballX=(c-18)*T; S.freeze=S.cp?0.9:1.5; S.hintT=S.cp?0:7; S.warnT=0; banner(S.cp?'С ФЛАЖКА':'ВЫЕЗЖАЕМ…','#9cc3ff',S.freeze);
}
function wirePre(dt){
  const B=S.L.bt, L=live(); if(!L.length) return;
  if(S.freeze>0){ S.freeze-=dt; S.v=0; if(S.freeze<=0){ banner('ЕДЕМ!','#ffd166',.9); sfx('boost'); } return; }
  const lead=Math.max(...L.map(p=>p.x)), prog=clamp(lead/T/B.finishX,0,1);
  S.v0=(B.base+(B.top-B.base)*prog)*speedMul()/PACE*(1+0.25*paceRamp()); S.stun=Math.max(0,(S.stun||0)-dt);
  const tgt=S.stun>0?S.v0*0.35:S.v0; S.v=approach(S.v,tgt,(S.v<tgt?500:4000)*dt);
  if(lead<B.finishX*T) S.ballX+=S.v0*0.92*dt;
}
function wirePhys(p,h){
  const W=p.wire, ty=LYW[W.lane]-WHL-p.h, dy=ty-p.y, st=1100*h; p.y+=clamp(dy,-st,st); p.x+=S.v*h;
  p.vx=S.v; p.vy=clamp(dy*6,-700,700); p.onGround=false; p.ground=null;
}
function wirePost(dt){
  const B=S.L.bt, L=live(); if(!L.length) return; S.hintT=Math.max(0,S.hintT-dt);
  for(const p of L) if(p.wire&&p.x>B.finishX*T){ p.wire=null; p.vx=S.v*0.4; p.vy=-120; sfx('jump'); worldText(p,'СПРЫГИВАЙ!','#7fe08a'); }
  if(S.freeze>0) return;
  const lead=Math.max(...L.map(p=>p.x+p.w));
  for(const f of B.flags) if(!f.on&&lead>f.x*T){ f.on=true; S.cp={lvl:levelIdx,x:f.x}; sfx('pk_shield'); const p=L[0]; texts.push({x:p.x,y:p.y-50,t:'ФЛАЖОК!',life:1.4,c:'#7fe08a',pop:true}); }
  let hitAny=false;
  for(const o of B.obs){ if(o.dead) continue; for(const p of L){ if(!p.wire||p.inv>0||p.down) continue; if(o.lanes.some(ln=>overlap(p,wireRect(o,ln)))){ o.dead=true; hitAny=true;
        burst(o.x*T+20,p.y+p.h,22,['#bfefff','#fff','#62d6ff'],360,.6); p.inv=0; _hurt(p); texts.push({x:p.x+p.w/2,y:p.y-30,t:'РАЗРЯД!',life:1,c:'#9cf',pop:true}); if(p.down||p.hp<=0){ p.down=false; die(p,'down'); return; } break; } } }
  if(hitAny){ S.stun=0.7; sfx('hit'); shake=Math.max(shake,8); flash('#9cf',.3); hitstop=Math.max(hitstop,.08); }
  const back=Math.min(...L.filter(p=>p.wire).map(p=>p.x),1e9);
  if(back<S.ballX+10){   // шар догнал
    for(const p of L){ if(!p.wire) continue; burst(p.x+p.w/2,p.y+p.h/2,24,['#bfefff','#fff'],380,.6); p.inv=0; _hurt(p); texts.push({x:p.x+p.w/2,y:p.y-30,t:'ШАР!',life:1.1,c:'#ff6b6b',pop:true}); if(p.down||p.hp<=0){ p.down=false; die(p,'down'); return; } }
    sfx('hit'); shake=Math.max(shake,10); flash('#ff3b4e',.35); hitstop=Math.max(hitstop,.12);
    const c=wireSpot(); for(const o of B.obs) o.dead=o.x<=c+2; placeWire(c); S.ballX=(c-18)*T; S.v=0; S.stun=0; S.freeze=0.9; for(const p of players) if(!p.absent) p.inv=Math.max(p.inv,1.6); banner('ЕЩЁ РАЗ!','#ff9a8a',.85); }
}
function drawWire(B){
  const V=viewRect(), t=clock; ctx.save();
  const x0=Math.max(T,Math.floor(V.x/T)*T-T), x1=Math.min(B.finishX*T,V.x+V.w+T);
  for(let l=0;l<3;l++){ const y=LYW[l]; ctx.strokeStyle='#2b3448'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke(); ctx.strokeStyle='#8fa3b8'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x0,y-1); ctx.lineTo(x1,y-1); ctx.stroke(); }
  for(let c=Math.floor(x0/T/12)*12;c*T<x1;c+=12){ const x=c*T; ctx.fillStyle='#46525f'; ctx.fillRect(x-4,LYW[0]-30,8,LYW[2]-LYW[0]+60); ctx.fillStyle='#6b7886'; for(let l=0;l<3;l++) ctx.fillRect(x-14,LYW[l]-4,28,8); }
  for(const f of B.flags){ const x=f.x*T, y=LYW[0]-60; if(x<V.x-60||x>V.x+V.w+60) continue; ctx.strokeStyle='#c7d3dd'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+30); ctx.stroke(); ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+30,y+8); ctx.lineTo(x,y+18); ctx.closePath(); ctx.fill(); }
  for(const o of B.obs){ if(o.dead||o.x*T<V.x-60||o.x*T>V.x+V.w+60) continue; for(const ln of o.lanes){ const cx=o.x*T+21, cy=LYW[ln]-30, a=t*14+o.x;
      ctx.save(); const gr=ctx.createRadialGradient(cx,cy,2,cx,cy,26); gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(.5,'rgba(120,220,255,.6)'); gr.addColorStop(1,'rgba(60,140,255,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(cx,cy,26,0,7); ctx.fill();
      ctx.strokeStyle='#e8fbff'; ctx.lineWidth=2.4; ctx.shadowColor='#62d6ff'; ctx.shadowBlur=12*GLOW; for(let k=0;k<5;k++){ const an=a+k*1.257; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(an)*(14+Math.sin(a*3+k)*6),cy+Math.sin(an)*(14+Math.sin(a*3+k)*6)); ctx.stroke(); }
      ctx.restore(); } }
  { const x=B.finishX*T; for(let r=0;r<12;r++) for(let k=0;k<2;k++){ ctx.fillStyle=(r+k)%2?'#0b1830':'#e8effa'; ctx.fillRect(x+k*8,LYW[0]-60+r*16,8,16); } ctx.fillStyle='#ffd166'; ctx.font="900 14px Unbounded, 'Arial Black', sans-serif"; ctx.textAlign='center'; ctx.fillText('ФИНИШ',x+8,LYW[0]-70); }
  if(S.ballX!=null){ const bx=S.ballX-130, by=LYW[1], r=150+Math.sin(t*9)*6; if(bx+r>V.x-40){
      const gr=ctx.createRadialGradient(bx,by,10,bx,by,r); gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(.45,'rgba(140,225,255,.75)'); gr.addColorStop(1,'rgba(60,120,255,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(bx,by,r,0,7); ctx.fill();
      ctx.strokeStyle='#e8fbff'; ctx.lineWidth=3; ctx.shadowColor='#62d6ff'; ctx.shadowBlur=18*GLOW; for(let k=0;k<9;k++){ const an=t*5+k*0.7, len=r*(0.7+0.3*Math.sin(t*13+k*2)); ctx.beginPath(); ctx.moveTo(bx+Math.cos(an)*30,by+Math.sin(an)*30); let px=bx+Math.cos(an)*30, py=by+Math.sin(an)*30; for(let q=1;q<=5;q++){ const rr=30+(len-30)*q/5, jt=Math.sin(t*40+k*3+q*2)*12; px=bx+Math.cos(an)*rr-Math.sin(an)*jt; py=by+Math.sin(an)*rr+Math.cos(an)*jt; ctx.lineTo(px,py); } ctx.stroke(); } } }
  ctx.restore();
}
function drawWheel(p){
  const x=p.x+p.w/2, y=p.y+p.h+WHL-13, sp=S.v;
  ctx.save(); ctx.translate(x,y); ctx.strokeStyle='#e7b54a'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,13,0,7); ctx.stroke(); ctx.fillStyle='#22324d'; ctx.beginPath(); ctx.arc(0,0,4,0,7); ctx.fill();
  ctx.rotate(x*0.06); ctx.strokeStyle='#c9a46a'; ctx.lineWidth=2; for(let k=0;k<4;k++){ ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(12,0); ctx.stroke(); }
  ctx.restore(); if(sp>80&&state==='play'&&Math.random()<.5) addP({x:x-10,y:y+13,vx:-sp*.25,vy:-40-Math.random()*60,life:.3,max:.3,c:'#bfefff',s:2.2,g:.4});
}

// ---------- лабиринт: три этажа, лифты, три рычага, охотник ----------
function mazeLevel(D){
  const W=48,H=27,g=[...Array(H)].map(()=>Array(W).fill('.'));
  for(let x=0;x<W;x++){ g[0][x]='#'; g[1][x]='#'; for(const r of [9,10,17,18,25,26]) g[r][x]='#'; }
  for(let y=0;y<H;y++){ g[y][0]='#'; g[y][W-1]='#'; }
  for(const r of [17,18]) for(let x=7;x<=10;x++) g[r][x]='.';
  for(const r of [9,10]) for(let x=38;x<=41;x++) g[r][x]='.';
  for(const [fr,xs] of [[25,[30,36]],[17,[16,30]],[9,[14,30]]]) for(const x of xs){ g[fr-1][x]='^'; }
  for(let x=2;x<=3;x++){ g[7][x]='E'; g[8][x]='E'; }
  g[24][20]='1'; g[24][22]='2';
  const plates=[{x:43,y:25,on:false},{x:25,y:17,on:false},{x:22,y:9,on:false}];
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map:g.map(r=>r.join('')),enemies:[],pickups:[{type:'heart',tx:34,ty:24},{type:'heart',tx:44,ty:16},{type:'gear',tx:12,ty:15},{type:'gear',tx:13,ty:15},{type:'gear',tx:20,ty:7},{type:'gear',tx:21,ty:7}],
    movers:[{ax:7,ay:25,bx:7,by:17,w:4,sp:120,pause:1.3},{ax:38,ay:17,bx:38,by:9,w:4,sp:120,pause:1.3}],winds:[],checkpoints:[],pz:[],tier:3,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'maze',plates}};
}
function setupMaze(L){ const B=L.bt; BTX.z=0; for(const pl of B.plates) pl.on=false; S.nOn=0; S.hunt={x:44*T,y:5*T,stun:3.5,r:20,t:0}; exitLocked=true; S.opened=false; S.hintT=9; banner('ЛАБИРИНТ!','#c79bff',1.3); }
function stunHunt(t,fx){ const h=S.hunt; if(!h) return; h.stun=Math.max(h.stun,t); sfx('kill'); burst(h.x,h.y,16,['#c79bff','#fff','#ffd166'],300,.45); texts.push({x:h.x,y:h.y-30,t:'ОГЛУШЁН!',life:.8,c:'#c79bff',pop:true}); if(fx) { h.x+=fx; } }
function mazePost(dt){
  const B=S.L.bt, L=live(), h=S.hunt; S.hintT=Math.max(0,S.hintT-dt); h.t+=dt;
  if(L.length){
    if(h.stun>0) h.stun-=dt;
    else { let n=null, nd=1e9; for(const p of L){ const d=Math.hypot(p.x+p.w/2-h.x,p.y+p.h/2-h.y); if(d<nd){ nd=d; n=p; } }
      const D=diffLv(), v=[44,64,86,110][S.nOn]*(D<0?.8:1+.1*D); const dx=n.x+n.w/2-h.x, dy=n.y+n.h/2-h.y, dd=Math.hypot(dx,dy)||1; h.x+=dx/dd*v*dt; h.y+=dy/dd*v*dt+Math.sin(h.t*3)*20*dt; }
    for(const p of L){ if(p.down||p.inv>0) continue; if(Math.hypot(p.x+p.w/2-h.x,p.y+p.h/2-h.y)<h.r+Math.max(p.w,p.h)*0.45&&h.stun<=0){ _hurt(p); p.vy=-320; p.vx=(p.x+p.w/2<h.x?-1:1)*280; texts.push({x:p.x+p.w/2,y:p.y-30,t:'ОХОТНИК!',life:1,c:'#ff6b6b',pop:true}); sfx('hit'); shake=Math.max(shake,7); h.stun=2.6; h.x+=(h.x<p.x?-1:1)*-0+(p.x+p.w/2<h.x?60:-60); if(p.down||p.hp<=0){ p.down=false; die(p,'down'); return; } } }
    for(const bl of bullets){ if(bl.life<=0) continue; if(Math.hypot(bl.x-h.x,bl.y-h.y)<h.r+10){ bl.life=0; stunHunt(2.2); } }
    for(const p of L){ const d=Math.hypot(p.x+p.w/2-h.x,p.y+p.h/2-h.y); if(p.kind==='bolt'&&p.smashT>0.08&&d<125) stunHunt(2.6,p.face*70); else if(p.kind==='spark'&&p.dash>0&&d<70) stunHunt(2.6); }
  }
  for(const pl of B.plates){ if(pl.on) continue; if(L.some(p=>p.onGround&&overlap(p,{x:pl.x*T,y:pl.y*T-14,w:T,h:16}))){ pl.on=true; S.nOn++; sfx('pk_shield'); burst(pl.x*T+20,pl.y*T-6,22,['#7fe08a','#fff'],300,.5); banner(S.nOn<3?'РЫЧАГ '+S.nOn+' ИЗ 3':'ВСЕ РЫЧАГИ! ВЫХОД ОТКРЫТ','#7fe08a',1.4);
      if(S.nOn>=3){ S.opened=true; exitLocked=false; sfx('win'); } else { h.stun=Math.max(h.stun,0); } } }
  platformPost(dt);
}
function drawMaze(){
  const B=S.L.bt, t=clock; ctx.save();
  for(const pl of B.plates){ const x=pl.x*T, y=pl.y*T; ctx.fillStyle=pl.on?'#7fe08a':'#ff6b6b'; rr(ctx,x+2,y-8,T-4,8,3); ctx.fill(); ctx.fillStyle='#2b333c'; ctx.fillRect(x-2,y-2,T+4,4);
    if(!pl.on){ ctx.globalAlpha=.4+.3*Math.sin(t*6); ctx.fillStyle='#ff6b6b'; ctx.fillRect(x+4,y-70,T-8,62); ctx.globalAlpha=1; label('РЫЧАГ',x+T/2,y-80,11,'#ffd166'); } }
  const h=S.hunt; if(h){ const st=h.stun>0, bl=st&&Math.floor(t*10)%2; ctx.translate(h.x,h.y);
    const gr=ctx.createRadialGradient(0,0,2,0,0,h.r+14); gr.addColorStop(0,st?'rgba(200,200,220,.9)':'rgba(255,190,255,.95)'); gr.addColorStop(.6,st?'rgba(130,140,170,.6)':'rgba(190,90,230,.7)'); gr.addColorStop(1,'rgba(120,60,200,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,h.r+14,0,7); ctx.fill();
    ctx.strokeStyle=st?'#9aa5b8':'#f0c4ff'; ctx.lineWidth=2.5; for(let k=0;k<10;k++){ const a=k*0.628+t*(st?0.5:3), r1=h.r-2, r2=h.r+(st?3:9+Math.sin(t*12+k)*3); ctx.beginPath(); ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1); ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2); ctx.stroke(); }
    ctx.fillStyle=bl?'#fff':(st?'#5a6475':'#3a1850'); ctx.beginPath(); ctx.arc(0,0,h.r-3,0,7); ctx.fill(); ctx.fillStyle=st?'#ccd':'#ff4d5e'; ctx.beginPath(); ctx.arc(0,0,7,0,7); ctx.fill(); ctx.fillStyle='#0b1220'; ctx.beginPath(); ctx.arc(1,0,3,0,7); ctx.fill(); }
  ctx.restore();
}
// лифт вровень с полом: герой, стоящий на его уровне, считается стоящим на лифте (иначе он останется на полу и не поедет)
function mazeAssist(){ for(const o of players){ if(o.absent||o.dead||o.down||o.carried||o.vy<-50) continue; for(const m of movers){ if(o.ground===m) break; const fy=o.y+o.h; if(fy>=m.y-4&&fy<=m.y+8&&o.x+o.w>m.x+2&&o.x<m.x+m.w-2){ o.ground=m; o.y=m.y-o.h; o.onGround=true; o.vy=0; break; } } } }
function mazeArrow(){
  const h=S.hunt, V=draw.view; if(!h||!V) return; const z=V.z||1, sx=h.x*z+V.ox, sy=h.y*z+V.oy; if(sx>30&&sx<VW-30&&sy>30&&sy<VH-30) return;
  const cx=clamp(sx,36,VW-36), cy=clamp(sy,96,VH-60), a=Math.atan2(sy-VH/2,sx-VW/2); ctx.save(); ctx.translate(cx,cy); ctx.rotate(a); ctx.globalAlpha=.7+.3*Math.sin(clock*8); ctx.fillStyle=h.stun>0?'#9aa5b8':'#c79bff'; ctx.strokeStyle='#0b1220'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(-10,-11); ctx.lineTo(-10,11); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }

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
  if(S.bo&&S.bo.hp>0&&overlap({x:S.bo.x,y:S.bo.y,w:S.bo.w,h:S.bo.h},{x:zone.x-8,y:zone.y,w:zone.w+16,h:zone.h})) damageBoss(3,'slam');
  if(S.haz) for(const h of S.haz){ if(h.k==='saw'&&!h.dead&&S.lt>=h.t1&&overlap({x:h.x-16,y:h.y-16,w:32,h:32},zone)){ h.dead=true; burst(h.x,h.y,18,['#ffd166','#fff','#ff8a3d'],340,.5); texts.push({x:h.x,y:h.y-30,t:'СБИТА!',life:.8,c:'#62c7c1',pop:true}); sfx('kill'); } }
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
  for(const f of B.fish) f.t=-1; for(const c of B.shoots||[]) c.dead=false; S.beatN=null;
  if(B.rival){ const sx=(S.cp?S.cp.x:3)+14; S.R={x:sx*T,v:0,hp:B.rival,max:B.rival,cd:2.5,dead:false,flash:0,deadT:0}; exitLocked=true; } else { S.R=null; exitLocked=false; }
}
function cartExtraPost(dt,L){
  const B=S.L.bt, lead=Math.max(...L.map(p=>p.x+p.w));
  for(const c of B.shoots||[]){ if(c.dead) continue; const r={x:c.x*T,y:FL*T-80,w:40,h:80}; for(const bl of bullets){ if(bl.life<=0||!overlap(bl,r)) continue; c.dead=true; bl.life=0; burst(c.x*T+20,FL*T-40,16,['#ffd166','#ff8a3d','#fff'],300,.45); sfx('kill'); texts.push({x:c.x*T+20,y:FL*T-90,t:'ТАК!',life:.6,c:'#7fe08a',pop:true}); break; } }
  if(B.rhythm&&L.length){ const k=(lead/T-16)/5, b=Math.floor(k); if(S.beatN!==b){ S.beatN=b; S.beatT=0; if(S.freeze<=0&&b>=0) tone(b%4===0?300:200,b%4===0?260:180,.05,'square',.03); } S.beatT=(S.beatT||0)+dt; }
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
  for(const c of B.shoots||[]) if(!c.dead&&overlap(p,{x:c.x*T+4,y:FL*T-76,w:32,h:76})) return 'crate';
  for(const f of B.fish) if(fishUp(f)>18&&overlap(p,{x:f.x*T+13,y:FL*T-fishUp(f)+10,w:14,h:fishUp(f)-18})) return 'fish';
  for(const m of S.mines) if(overlap(p,{x:m.x,y:FL*T-16,w:28,h:16})) return 'mine';
  for(const b of B.buoys||[]) if(overlap(p,{x:b.x*T+7,y:FL*T-28,w:26,h:28})) return 'mine';
  return null;
}
function fishUp(f){ if(f.t<0) return 0; const t=f.t; return t<0.14?t/0.14*44:t<1.2?44:t<1.45?44*(1-(t-1.2)/0.25):0; }
function cartExtraRewind(spot){ S.mines=S.mines.filter(m=>m.x<spot*T-T||m.x>(spot+16)*T); for(const f of S.L.bt.fish) if(f.x>spot) f.t=-1; if(S.R&&!S.R.dead) S.R.x=(spot+12)*T; }

// ---------- лёд: ледяные острова, ямы с шипами, льдины и лавина ----------
// трасса: fN лёд, gN обычная земля, sN шипы на льду, pN яма (перепрыгнуть), mN широкая яма с льдиной, k флажок, h сердце
const IFL=14;   // ряд поверхности: верх пола на высоте IFL*T
function iceLevel(D){
  const H=18, cols=[], flags=[], pick=[], movers=[], floes=[];
  const surf=ice=>{ const c=Array(H).fill('.'); c[0]='#'; c[IFL]=ice?'I':'#'; c[15]='#'; c[16]='#'; c[17]='#'; return c; };
  const pit=()=>{ const c=Array(H).fill('.'); c[0]='#'; c[16]='^'; c[17]='#'; return c; };
  cols.push(Array(H).fill('#'));
  for(const tok of D.track.trim().split(/\s+/)){
    const k=tok[0], n=+tok.slice(1)||1;
    if(k==='f'||k==='g'){ for(let i=0;i<n;i++) cols.push(surf(k==='f')); }
    else if(k==='s'){ const x0=cols.length; for(let i=0;i<n;i++){ const c=surf(true); c[IFL-1]='^'; cols.push(c); } for(let i=0;i<n;i++) pick.push({type:'gear',tx:x0+i,ty:IFL-3}); }
    else if(k==='p'){ const x0=cols.length; for(let i=0;i<n;i++) cols.push(pit()); pick.push({type:'gear',tx:x0+Math.floor(n/2),ty:IFL-3}); }
    else if(k==='m'){ const x0=cols.length; for(let i=0;i<n;i++) cols.push(pit());
      movers.push({ax:x0,ay:IFL,bx:x0+n-4,by:IFL,w:4,sp:110,pause:1.0}); floes.push({x0,x1:x0+n-1,m:movers.length-1});
      pick.push({type:'gear',tx:x0+Math.floor(n/2)-1,ty:IFL-3},{type:'gear',tx:x0+Math.floor(n/2),ty:IFL-3}); }
    else if(k==='k') flags.push({x:cols.length,on:false});
    else if(k==='h') pick.push({type:'heart',tx:cols.length+1,ty:IFL-1});
  }
  for(let i=0;i<4;i++) cols.push(surf(false));
  const finishX=cols.length;
  for(let i=0;i<3;i++){ const c=surf(false); c[IFL-1]='E'; c[IFL-2]='E'; cols.push(c); }
  for(let i=0;i<4;i++) cols.push(surf(false));
  cols.push(Array(H).fill('#'));
  cols[3][IFL-1]='1'; cols[5][IFL-1]='2';
  const W=cols.length, map=[]; for(let y=0;y<H;y++){ let s=''; for(let x=0;x<W;x++) s+=cols[x][y]; map.push(s); }
  // безопасные клетки: ровный пол без шипов в соседних столбцах (сюда возвращаем после падения)
  const safe=[]; for(let x=1;x<W-1;x++){ let ok=true; for(let d=-1;d<=1&&ok;d++){ const c=cols[x+d]; if(c[IFL]!=='I'&&c[IFL]!=='#') ok=false; if(c[IFL-1]==='^') ok=false; } safe[x]=ok; }
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map,enemies:[],pickups:pick,movers,winds:[],checkpoints:[],pz:[],tier:2,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'ice',flags,finishX,floes,safe,len:W}};
}
// на льду в прыжке сохраняется скорость, набранная на земле (инерция), пока держишь направление
function iceMomentum(p,inp){ if(p.onGround||p.wasGround){ p.iv=p.vx; return; } if(p.iv&&inp.dir&&Math.sign(p.iv)===inp.dir&&Math.abs(p.vx)<Math.abs(p.iv)) p.vx=p.iv; }
function placeIce(x){ for(const p of players){ if(p.absent) continue;
  const off=solo?0:(p.kind==='bolt'?2:0); p.x=(x+off)*T+(T-p.w)/2; p.y=IFL*T-p.h; p.vx=0; p.vy=0; p.dash=0; p.slam=false; p.onGround=true; p.wasGround=true; } }
function setupIce(L){
  const B=L.bt; BTX.z=1.5; BTX.lx=VW*0.2/1.5;
  for(const f of B.flags) f.on=!!(S.cp&&S.cp.x>=f.x);
  const sx=S.cp?S.cp.x:4; if(S.cp) placeIce(sx);
  for(const p of players) p.iv=0; S.snowX=(sx-17)*T; S.wait=S.cp?1.4:3.2; S.safe={}; for(const p of players) if(!p.absent) S.safe[p.kind]={x:p.x,y:p.y};
  S.hintT=S.cp?0:8; banner(S.cp?'С ФЛАЖКА':'ЛЁД!','#9fe4f5',1.4);
}
function icePost(dt){
  const B=S.L.bt, L=live(); if(!L.length) return; S.hintT=Math.max(0,S.hintT-dt);
  const lead=Math.max(...L.map(p=>p.x+p.w));
  for(const f of B.flags) if(!f.on&&lead>f.x*T+10){ f.on=true; S.cp={lvl:levelIdx,x:f.x}; sfx('pk_shield'); const p=L[0]; texts.push({x:p.x,y:p.y-50,t:'ФЛАЖОК!',life:1.4,c:'#7fe08a',pop:true}); }
  for(const p of L){
    if(p.onGround&&!p.ground&&Math.abs(p.y+p.h-IFL*T)<3&&B.safe[Math.floor((p.x+p.w/2)/T)]) S.safe[p.kind]={x:p.x,y:p.y};
    if(p.y+p.h>(IFL+1.5)*T){   // упал в яму с шипами: сердце минус и назад на безопасное место
      const s=S.safe[p.kind]||{x:4*T,y:IFL*T-p.h}; burst(p.x+p.w/2,p.y+p.h,16,['#bfefff','#fff'],260,.5); hurt(p); if(state!=='play') return;
      p.x=s.x; p.y=s.y; p.vx=0; p.vy=0; p.inv=Math.max(p.inv,1.2); S.snowX=Math.min(S.snowX,s.x-10*T); texts.push({x:p.x+p.w/2,y:p.y-24,t:'ОБРАТНО!',life:1,c:'#9fe4f5'}); } }
  if(S.wait>0){ S.wait-=dt; if(S.wait<=0){ banner('ЛАВИНА!','#ff9a8a',1); sfx('slam'); shake=Math.max(shake,6); } }
  else { const prog=clamp(lead/T/B.finishX,0,1), D=diffLv(), k=D<0?0.85:1+0.07*D; S.snowX=Math.min(S.snowX+(105+55*prog)*k*dt,(B.finishX-5)*T); }
  for(const p of L){ if(p.x>S.snowX+10) continue;   // лавина накрыла: сердце минус, лавина откатывается назад
    burst(p.x+p.w/2,p.y+p.h/2,24,['#e8fbff','#fff','#9fe4f5'],380,.6); p.inv=0; _hurt(p); texts.push({x:p.x+p.w/2,y:p.y-30,t:'ЛАВИНА!',life:1.1,c:'#ff6b6b',pop:true});
    sfx('hit'); shake=Math.max(shake,10); flash('#e8fbff',.3); hitstop=Math.max(hitstop,.1); S.snowX=p.x-14*T;
    if(p.down||p.hp<=0){ p.down=false; die(p,'down'); return; } }
  platformPost(dt);
}
function drawIce(B){
  const t=clock, x=S.snowX, Hh=18*T; ctx.save();
  for(const f of B.flags){ const fx=f.x*T+6, fy=IFL*T; ctx.strokeStyle='#c7d3dd'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(fx,fy-86); ctx.stroke();
    ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.beginPath(); ctx.moveTo(fx,fy-86); ctx.quadraticCurveTo(fx+18,fy-80+Math.sin(t*6)*3,fx+30,fy-76); ctx.lineTo(fx,fy-64); ctx.closePath(); ctx.fill(); }
  const w=560, gr=ctx.createLinearGradient(x-w,0,x+30,0); gr.addColorStop(0,'rgba(232,248,255,0)'); gr.addColorStop(.6,'rgba(226,246,255,.82)'); gr.addColorStop(1,'rgba(250,254,255,.97)');
  ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(x-w,-60); ctx.lineTo(x+30,-60);
  for(let y=-60,k=0;y<=Hh+60;y+=34,k++) ctx.lineTo(x+30+Math.sin(t*6+k*1.3)*12+(k%2?14:-6),y);
  ctx.lineTo(x-w,Hh+60); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(159,228,245,.9)'; ctx.lineWidth=3; ctx.beginPath(); for(let y=-60,k=0;y<=Hh+60;y+=34,k++){ const xx=x+30+Math.sin(t*6+k*1.3)*12+(k%2?14:-6); k?ctx.lineTo(xx,y):ctx.moveTo(xx,y); } ctx.stroke();
  if(state==='play'&&Math.random()<.6) addP({x:x+10,y:Math.random()*Hh,vx:80+Math.random()*120,vy:(Math.random()-.5)*90,life:.5,max:.5,c:'#ffffff',s:2.5+Math.random()*2,g:0});
  ctx.restore();
}
function iceHud(B,L){
  const w=520, x=VW/2-w/2, y=VH-26;
  ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-8,y-10,w+16,20,10); ctx.fill(); ctx.fillStyle='rgba(159,228,245,.25)'; rr(ctx,x,y-3,w,6,3); ctx.fill();
  for(const f of B.flags){ ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.fillRect(x+w*f.x/B.finishX-1,y-8,3,16); }
  ctx.fillStyle='#e8fbff'; ctx.beginPath(); ctx.arc(x+w*clamp(S.snowX/T/B.finishX,0,1),y,6,0,7); ctx.fill();
  for(const p of L){ const k=clamp(p.x/T/B.finishX,0,1); ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.arc(x+w*k,y,6,0,Math.PI*2); ctx.fill(); }
  if(L.length){ const gap=(Math.min(...L.map(p=>p.x))-S.snowX)/T, near=gap<6; label('лавина: '+Math.max(0,Math.round(gap*1.5))+' м',VW-T*1.2,VH-28,18,near&&Math.floor(clock*6)%2?'#ff6b6b':'#e8effa','right'); }
  if(S.wait>0) label('лавина сойдёт через '+Math.ceil(S.wait),VW/2,VH*0.2,18,'#9fe4f5');
  if(S.hintT>0){ hintCard('лёд скользкий: тормозишь не сразу · прыжок — через шипы и ямы · широкие ямы — на льдине · лавина догоняет',56); }
}

// ---------- вращающаяся комната: ветряки с вращающимися лопастями ----------
const ROTF=17, ROTY=8;   // ряд пола и ряд оси ветряков
const rotAng=(m,i,t)=>m.ph+m.dir*m.w*t+i*Math.PI*2/m.n;
function rotHit(m,t,r,pad){   // задевает ли какая-нибудь лопасть ветряка прямоугольник r в момент t
  const px=(m.x+0.5)*T, py=ROTY*T, Lp=m.L*T;
  if(r.x+r.w<px-Lp-20||r.x>px+Lp+20) return false;
  for(let i=0;i<m.n;i++){ const a=rotAng(m,i,t), ca=Math.cos(a), sa=Math.sin(a);
    for(let s=0;s<=Lp;s+=8){ const bx=px+ca*s, by=py+sa*s; if(bx>r.x-pad&&bx<r.x+r.w+pad&&by>r.y-pad&&by<r.y+r.h+pad) return true; } }
  return false;
}
function rotLevel(D){
  const H=18, W=D.len, cols=[], pick=[], flags=D.flags.map(x=>({x,on:false}));
  const surf=()=>{ const c=Array(H).fill('.'); c[0]='#'; c[ROTF]='#'; return c; };
  for(let x=0;x<W;x++) cols.push(x===0||x===W-1?Array(H).fill('#'):surf());
  const finishX=W-8;
  for(let x=finishX;x<finishX+3;x++){ cols[x][ROTF-1]='E'; cols[x][ROTF-2]='E'; }
  cols[3][ROTF-1]='1'; cols[5][ROTF-1]='2';
  for(const m of D.mills){ for(let i=0;i<5;i++) pick.push({type:'gear',tx:m.x-2+i,ty:13}); }
  for(const f of flags) pick.push({type:'heart',tx:f.x+4,ty:ROTF-1});
  const map=[]; for(let y=0;y<H;y++){ let s=''; for(let x=0;x<W;x++) s+=cols[x][y]; map.push(s); }
  return {name:D.name,motif:D.motif,hue:D.hue,dark:false,hint:D.hint,map,enemies:[],pickups:pick,movers:[],winds:[],checkpoints:[],pz:[],tier:2,hand:true,decor:[],darkA:.94,openBottom:false,par:D.par,
    bt:{kind:'rot',mills:D.mills,flags,finishX,len:W}};
}
function placeRot(x){ for(const p of players){ if(p.absent) continue;
  const off=solo?0:(p.kind==='bolt'?2:0); p.x=(x+off)*T+(T-p.w)/2; p.y=ROTF*T-p.h; p.vx=0; p.vy=0; p.dash=0; p.slam=false; p.onGround=true; p.wasGround=true; } }
function setupRot(L){
  const B=L.bt; BTX.z=1.5; BTX.lx=VW*0.15/1.5;
  for(const f of B.flags) f.on=!!(S.cp&&S.cp.x>=f.x);
  if(S.cp) placeRot(S.cp.x);
  const D=diffLv(); S.rm=D<0?0.85:1+0.06*D; S.rt=0; S.hintT=S.cp?0:8; banner(S.cp?'С ФЛАЖКА':'КОМНАТА!','#ffd166',1.4);
}
function rotPost(dt){
  const B=S.L.bt, L=live(); if(!L.length) return; S.hintT=Math.max(0,S.hintT-dt); S.rt+=dt*S.rm;
  const lead=Math.max(...L.map(p=>p.x+p.w));
  for(const f of B.flags) if(!f.on&&lead>f.x*T+10){ f.on=true; S.cp={lvl:levelIdx,x:f.x}; sfx('pk_shield'); const p=L[0]; texts.push({x:p.x,y:p.y-50,t:'ФЛАЖОК!',life:1.4,c:'#7fe08a',pop:true}); }
  for(const p of L){ if(p.down||p.inv>0) continue;
    for(const m of B.mills){ if(!rotHit(m,S.rt,p,6)) continue;
      const px=(m.x+0.5)*T; burst(p.x+p.w/2,p.y+p.h/2,22,['#ffd166','#ff8a3d','#fff'],360,.55); p.inv=0; _hurt(p); p.vy=-320; p.vx=(p.x+p.w/2<px?-1:1)*260;
      texts.push({x:p.x+p.w/2,y:p.y-30,t:'ЛОПАСТЬ!',life:1,c:'#ff6b6b',pop:true}); sfx('hit'); shake=Math.max(shake,8); hitstop=Math.max(hitstop,.08);
      if(p.down||p.hp<=0){ p.down=false; die(p,'down'); return; } break; } }
  platformPost(dt);
}
function drawRot(B){
  const t=clock; ctx.save();
  for(const f of B.flags){ const fx=f.x*T+6, fy=ROTF*T; ctx.strokeStyle='#c7d3dd'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(fx,fy-86); ctx.stroke();
    ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.beginPath(); ctx.moveTo(fx,fy-86); ctx.quadraticCurveTo(fx+18,fy-80+Math.sin(t*6)*3,fx+30,fy-76); ctx.lineTo(fx,fy-64); ctx.closePath(); ctx.fill(); }
  for(const m of B.mills){ const px=(m.x+0.5)*T, py=ROTY*T, Lp=m.L*T;
    ctx.globalAlpha=.12; ctx.strokeStyle='#ffd166'; ctx.lineWidth=2; ctx.setLineDash([6,8]); ctx.beginPath(); ctx.arc(px,py,Lp,0,7); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1;
    for(let i=0;i<m.n;i++){ const a=rotAng(m,i,S.rt||0), ex=px+Math.cos(a)*Lp, ey=py+Math.sin(a)*Lp;
      ctx.lineCap='round'; ctx.strokeStyle='#5a2a1c'; ctx.lineWidth=18; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(ex,ey); ctx.stroke();
      const g=ctx.createLinearGradient(px,py,ex,ey); g.addColorStop(0,'#e7b54a'); g.addColorStop(1,'#ff5a3d'); ctx.strokeStyle=g; ctx.lineWidth=12; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(ex,ey); ctx.stroke();
      ctx.shadowColor='#ff8a3d'; ctx.shadowBlur=14*GLOW; ctx.fillStyle='#ffe3a0'; ctx.beginPath(); ctx.arc(ex,ey,9,0,7); ctx.fill(); ctx.shadowBlur=0; }
    ctx.fillStyle='#3a4660'; ctx.beginPath(); ctx.arc(px,py,22,0,7); ctx.fill(); ctx.strokeStyle='#e7b54a'; ctx.lineWidth=3; ctx.stroke(); ctx.fillStyle='#e7b54a'; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.fill(); }
  ctx.restore();
}
function rotHud(B,L){
  const w=520, x=VW/2-w/2, y=VH-26;
  ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-8,y-10,w+16,20,10); ctx.fill(); ctx.fillStyle='rgba(255,209,102,.25)'; rr(ctx,x,y-3,w,6,3); ctx.fill();
  for(const m of B.mills){ ctx.fillStyle='rgba(255,138,61,.55)'; ctx.fillRect(x+w*(m.x-m.L)/B.finishX,y-3,w*2*m.L/B.finishX,6); }
  for(const f of B.flags){ ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.fillRect(x+w*f.x/B.finishX-1,y-8,3,16); }
  for(const p of L){ const k=clamp(p.x/T/B.finishX,0,1); ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.arc(x+w*k,y,6,0,Math.PI*2); ctx.fill(); }
  if(S.hintT>0){ hintCard('жди, пока лопасть пройдёт, и беги · между ветряками можно стоять · флажки сохраняют место',56); }
}

/* ---------------- «Заводской двор»: драка в глубину (как в beat'em-up) ---------------- */
const ISO={LEN:4200, HY:300, Z0:392, Z1:668};
const ISO_ENC=[
  {x:760, w:[['g','R'],['g','R',.7]]},
  {x:1760,w:[['g','R'],['g','L',.4],['g','R',1.1],['t','R',1.6]]},
  {x:2760,w:[['g','L'],['g','R',.3],['t','L',.9],['b','R',1.4],['g','R',2.2]]},
  {x:3560,w:[['b','L'],['b','R',.6],['g','L',1.4],['g','R',1.6],['t','R',2.4]]}
];
function isoLevel(D){ const L=brawlLevel(D); L.bt={kind:'iso'}; L.enemies=[]; return L; }
const isoZ=z=>ISO.Z0+z*(ISO.Z1-ISO.Z0), isoK=z=>0.78+0.34*z;
function setupIso(L){
  BTX.z=0; exitLocked=false; const I=S.iso={cam:0,lock:null,enc:0,act:null,foes:[],shots:[],drops:[],fx:[],t:0,go:0,done:false,seed:7};
  I.props=[]; { let s=11; const r=()=>((s=(s*16807)%2147483647)/2147483647);
    for(let x=300;x<ISO.LEN;x+=260+r()*220){ I.props.push({x,z:r()<.5?-.12:1.12,k:['crate','barrel','pipe','lamp'][Math.floor(r()*4)],r:r()}); } }
  let n=0; for(const p of players){ if(p.absent) continue; p.ix=120+n*60; p.iz=.35+n*.3; p.ih=0; p.ivh=0; p.iat=0; p.icd=0; p.ikick=false; p.ihit=0; p.ifc=1; p.imv=0; n++; p.hp=Math.max(p.hp,1); }
  S.hintT=8; banner('ЗАВОДСКОЙ ДВОР','#ffd166',1.4);
}
(()=>{ const st=document.createElement('style'); st.textContent='@keyframes hlp{0%,100%{box-shadow:0 0 0 0 rgba(255,209,102,.9),0 0 14px 4px rgba(255,209,102,.55);transform:scale(1)}50%{box-shadow:0 0 0 12px rgba(255,209,102,0),0 0 22px 8px rgba(255,209,102,.8);transform:scale(1.12)}} body[data-hl=jump] #touch .tb[data-a=jump],body[data-hl=ability] #touch .tb[data-a=ability],body[data-hl=fire] #touch .tb[data-a=fire]{animation:hlp .55s ease-in-out infinite;border-color:#ffd166!important;background:rgba(255,209,102,.28)!important}'; document.head.appendChild(st); })();
// сенсор: на «Заводском дворе» кнопки получают другие подписи (клавиши те же: вверх=«прыжок», вниз=«способность», удар=«огонь», прыжок=«бонус»)
const TG=(g,sub,sz)=>`<span style="font-size:${sz||1.5}em;line-height:1">${g}</span><small>${sub}</small>`;
const TLBL={
  cart:(a,k)=>({ability:TG('▼','пригнись'),fire:TG('✦','стреляй'),left:'dim',right:'dim',use:'dim'})[a],
  rope:(a,k)=>({left:TG('◀','раскачка'),right:TG('▶','раскачка'),jump:TG('▲','подтянись'),ability:TG('▼','быстрее'),fire:'dim',use:'dim'})[a],
  rocket:(a,k)=>({jump:TG('▲','вверх'),ability:TG('▼','вниз'),left:'dim',right:'dim',use:'dim',fire:S.L&&S.L.bt&&S.L.bt.tube?'dim':TG('✦','огонь')})[a],
  wire:(a,k)=>({jump:TG('▲','выше'),ability:TG('▼','ниже'),left:'dim',right:'dim',fire:'dim',use:'dim'})[a],
  lift:(a,k)=>({jump:TG('▲','прыжок')})[a],
  relay:(a,k)=>({jump:TG('▲','прыжок'),ability:TG('✋','взять / бросить',1.3)})[a],
  chase:(a,k)=>({jump:TG('▲','прыжок'),ability:TG('➤',k==='bolt'?'смэш':'рывок',1.4)})[a],
  brawl:(a,k)=>({jump:TG('▲','прыжок'),ability:TG('➤',k==='bolt'?'смэш':'рывок',1.4),fire:TG('✦','огонь',1.4)})[a],
  boss:(a,k)=>({jump:TG('▲','прыжок'),ability:TG('➤',k==='bolt'?'смэш':'рывок',1.4),fire:TG('✦','огонь',1.4)})[a],
  maze:(a,k)=>({jump:TG('▲','прыжок'),ability:TG('➤',k==='bolt'?'смэш':'рывок',1.4),fire:TG('✦','выстрел',1.4)})[a],
  snake:(a,k)=>({jump:TG('▲','прыжок')})[a],
  ice:(a,k)=>({jump:TG('▲','прыжок')})[a],
  rot:(a,k)=>({jump:TG('▲','прыжок')})[a],
  iso:(a,k)=>({jump:TG('▲','вглубь'),ability:TG('▼','к нам'),fire:TG('✊','удар',1.4),use:TG('⤒','прыжок',1.4)})[a]
};
// сенсор: в испытаниях с «вверх/вниз» стрелка ▲ должна стоять ВЫШЕ ▼ (раньше «вниз» стояла над «вверх» — путаница). Размер у обеих одинаковый.
const TVERT={cart:1,rope:1,rocket:1,wire:1,iso:1};
function touchVert(el,on){
  const R=b=>({l:parseFloat(b.style.left),t:parseFloat(b.style.top),w:parseFloat(b.style.width)});
  const put=(b,l,t,w)=>{ b.style.left=Math.round(l)+'px'; b.style.top=Math.round(t)+'px'; b.style.width=Math.round(w)+'px'; b.style.height=Math.round(w)+'px'; };
  for(const k of ['spark','bolt']){
    const q=a=>el.querySelector('.tb[data-a="'+a+'"][data-k="'+k+'"]'), J=q('jump'), A=q('ability'), F=q('fire'); if(!J||!A) continue;
    const bs=[J,A,F].filter(Boolean);
    if(!on){ for(const b of bs) if(b.dataset.vo){ const o=JSON.parse(b.dataset.vo); put(b,o.l,o.t,o.w); delete b.dataset.vo; } continue; }
    if(J.dataset.vo) continue;                                   // уже переставлено
    for(const b of bs) b.dataset.vo=JSON.stringify(R(b));
    const j=R(J), a=R(A), f=F?R(F):null;
    if(isNaN(j.l)||isNaN(a.l)||isNaN(j.w)){ for(const b of bs) delete b.dataset.vo; continue; }
    if(a.t<j.t-8){                                               // один игрок: «способность» стоит над «прыжком»
      const sz=Math.min(j.w,76), Rg=j.l+j.w, B=j.t+j.w;
      put(A,Rg-sz,B-sz,sz); put(J,Rg-sz,B-2*sz-6,sz);          // ▼ внизу, ▲ над ним
      if(F&&f.l+f.w>Rg-sz-4) put(F,f.l,f.t,Math.max(44,Rg-sz-4-f.l));
    } else {                                                     // вдвоём: кнопки рядом — ▼ на место «прыжка», ▲ выше, «огонь» на место «способности»
      const sz=Math.min(j.w,a.w);
      put(A,j.l,j.t,sz); put(J,j.l,j.t-sz-6,sz);
      if(F) put(F,a.l,a.t,Math.min(f.w,a.w));
    }
  }
}
// сенсор: подписи кнопок под тип испытания (ненужные кнопки гаснут)
setInterval(()=>{ try{
  const el=document.getElementById('touch'); if(!el) return; const f=S.on&&state==='play'?TLBL[S.kind]:null;
  touchVert(el,!!(f&&TVERT[S.kind]));
  el.querySelectorAll('.tb[data-a]').forEach(b=>{ const a=b.dataset.a; let w=f?f(a,b.dataset.k):null; const dim=w==='dim'; if(dim) w=null; if(b.dataset.dim!==(dim?'1':'')){ b.dataset.dim=dim?'1':''; b.style.opacity=dim?'.28':''; }
    if(w){ if(b.dataset.iso!=='1'){ b.dataset.orig=b.innerHTML; b.dataset.iso='1'; } if(b.dataset.cur!==w){ b.innerHTML=w; b.dataset.cur=w; } }
    else if(b.dataset.iso==='1'){ b.innerHTML=b.dataset.orig||b.innerHTML; b.dataset.iso='0'; b.dataset.cur=''; } });
}catch(e){} },250);
function isoInput(p){
  const pi=players.indexOf(p), k=(solo?['spark','bolt']:[p.kind]).map(n=>binds[n].kb), pk=(solo?['spark','bolt']:[p.kind]).map(n=>binds[n].pad);
  let L=0,R=0,U=0,D=0,J=0,A=0;
  for(const c of k){ if(down.has(c.left)) L=1; if(down.has(c.right)) R=1; if(down.has(c.jump)) U=1; if(down.has(c.ability)) D=1; if(pressed.has(c.use)) J=1; if(down.has(c.fire)) A=1; }
  const g=gp(pi); if(g){ const b=i=>!!(g.buttons[i]&&(g.buttons[i].pressed||g.buttons[i].value>.5)), ax=g.axes[0]||0, ay=g.axes[1]||0, pb=pk[0], bj=b(pb.jump), bf=b(pb.fire), bu=b(pb.use);
    if(ax<-.35||b(14)) L=1; if(ax>.35||b(15)) R=1; if(ay<-.35||b(12)) U=1; if(ay>.35||b(13)) D=1;
    const pv=p._ipad||(p._ipad={}); if((bj&&!pv.j)||(bu&&!pv.u)) J=1; pv.j=bj; pv.u=bu; if(bf) A=1; }
  const pv=p._iatk||0; const out={dx:R-L,dz:D-U,jump:!!J,atk:!!A&&!pv}; p._iatk=A; return out;
}
function isoSpawn(f){ const I=S.iso, t=f[0], L=f[1]==='L'; const D=diffLv(), hpm=D<0?.7:1+.25*D;
  const e={t,x:I.cam+(L?-50:VW+50),z:.1+Math.random()*.8,h:0,hp:Math.round((t==='b'?7:t==='t'?3:3)*hpm),face:L?1:-1,st:'walk',tm:0,cd:1+Math.random(),kx:0,fl:0,ph:Math.random()*6,sp:t==='b'?78:t==='t'?96:104};
  e.max=e.hp; I.foes.push(e); }
function isoDmg(e,d,p,kx){ if(e.hp<=0) return; e.hp-=d; e.fl=.15; e.st='hurt'; e.tm=.32; e.kx=kx; e.cd=Math.max(e.cd,.5); sfx('hit'); hitstop=Math.max(hitstop,.045); shake=Math.max(shake,3);
  const I=S.iso, sx=e.x-I.cam; for(let i=0;i<8;i++) I.fx.push({x:e.x,z:e.z,h:30+Math.random()*20,vx:(Math.random()-.5)*260+kx*.3,vh:200+Math.random()*250,l:.4,c:['#ffd166','#fff','#ff8a3d'][i%3]});
  texts.push({x:sx,y:isoZ(e.z)-e.h-70,t:d>1?'БАХ!':'ХЫ!',life:.5,c:'#ffd166',pop:true});
  if(e.hp<=0){ e.st='dead'; e.tm=.6; e.kx=kx*1.3; sfx('kill'); if(Math.random()<.34) I.drops.push({x:e.x,z:e.z}); } }
function isoStep(dt){
  const I=S.iso, L=live(); I.t+=dt; S.hintT=Math.max(0,S.hintT-dt); const D=diffLv();
  // герои
  for(const p of players){ if(p.absent||p.dead) continue;
    p.inv=Math.max(0,(p.inv||0)-dt); p.iat=Math.max(0,p.iat-dt); p.icd=Math.max(0,p.icd-dt); p.ihit=Math.max(0,p.ihit-dt);
    if(p.down){ if(p.bleed!=null){ p.bleed-=dt; const q=L.find(o=>o!==p); if(q&&Math.abs(q.ix-p.ix)<70&&Math.abs(q.iz-p.iz)<.2){ p.reviveT=(p.reviveT||0)+dt; if(p.reviveT>=1.2){ p.down=false; p.hp=1; p.inv=2; p.reviveT=0; p.bleed=null; levelDowned=true; sfx('revive'); texts.push({x:p.ix-I.cam,y:isoZ(p.iz)-90,t:'ЖИВОЙ!',life:1,c:'#7fe08a',pop:true}); } } else p.reviveT=0; if(p.bleed<=0&&state==='play') die(p,'down'); } continue; }
    const inp=S.freeze>0?{dx:0,dz:0,jump:false,atk:false}:isoInput(p), bolt=p.kind==='bolt', sp=bolt?215:255;
    const stuck=p.iat>0&&!p.ih;   // во время удара на земле почти стоишь
    const m=stuck?.25:1;
    p.ix+=inp.dx*sp*m*dt; p.iz=clamp(p.iz+inp.dz*.62*m*dt,0,1); if(inp.dx) p.ifc=inp.dx;
    p.imv=(inp.dx||inp.dz)&&!stuck?1:0; p.runPh=(p.runPh||0)+(p.imv?dt*13:0);
    if(inp.jump&&!p.ih&&!p.ivh){ p.ivh=640; sfx('jump'); }
    if(p.ivh||p.ih){ p.ivh-=2100*dt; p.ih+=p.ivh*dt; if(p.ih<=0){ p.ih=0; p.ivh=0; p.ikick=false; p.sx=1.15; p.sy=.86; } }
    if(inp.atk&&p.icd<=0){ const air=p.ih>2; p.iat=air?.4:.24; p.icd=air?.5:(bolt?.46:.3); p.ikick=air; p.ihitDone=false; p.ihit=0;
      p.combo=(p.iatC>0?(p.combo+1)%3:0); p.iatC=.7; sfx('shoot'); }
    p.iatC=Math.max(0,(p.iatC||0)-dt);
    if(p.iat>0&&!p.ihitDone&&p.iat<(p.ikick?.3:.15)){ p.ihitDone=true; let n=0; const reach=p.ikick?74:64, dmg=p.ikick?2:(bolt?2:1)+(p.combo===2?1:0);
      for(const e of I.foes){ if(e.hp<=0||e.st==='dead') continue; const dx=(e.x-p.ix)*p.ifc; if(dx>-14&&dx<reach&&Math.abs(e.z-p.iz)<.15&&Math.abs(e.h-p.ih)<60){ isoDmg(e,dmg,p,p.ifc*(p.combo===2||bolt||p.ikick?560:260)); n++; } }
      for(const s of I.shots){ const dx=(s.x-p.ix)*p.ifc; if(!s.dead&&dx>-14&&dx<reach&&Math.abs(s.z-p.iz)<.15){ s.dead=true; sfx('kill'); } }
      if(n&&texts.length<30) texts.push({x:p.ix-I.cam,y:isoZ(p.iz)-p.ih-90,t:p.combo===2?'КОМБО!':'',life:.5,c:'#7fe08a',pop:true}); }
    // границы: экран и мир
    const lo=(I.lock!=null?I.lock:I.cam)+34, hi=(I.lock!=null?I.lock+VW:I.cam+VW)-34;
    p.ix=clamp(p.ix,Math.max(40,lo),Math.min(ISO.LEN-40,hi));
    for(const d of I.drops.slice()){ if(Math.abs(d.x-p.ix)<36&&Math.abs(d.z-p.iz)<.14&&p.hp<4){ p.hp++; I.drops.splice(I.drops.indexOf(d),1); sfx('pk_shield'); texts.push({x:d.x-I.cam,y:isoZ(d.z)-60,t:'+ СЕРДЦЕ',life:.9,c:'#ff6b81',pop:true}); } }
  }
  // камера
  const ls=L.length?L:players.filter(q=>!q.absent); if(ls.length){ const mx=ls.reduce((a,q)=>a+q.ix,0)/ls.length;
    if(I.lock!=null) I.cam+=(I.lock-I.cam)*Math.min(1,dt*6); else { const want=clamp(mx-VW*.42,I.cam,ISO.LEN-VW); I.cam+=(want-I.cam)*Math.min(1,dt*5); } }
  // встречи
  const enc=ISO_ENC[I.enc];
  if(enc&&!I.act&&L.length&&Math.max(...L.map(q=>q.ix))>enc.x){ I.act={w:enc.w.map(f=>[f[0],f[1],f[2]||0]).sort((a,b)=>a[2]-b[2]),t:0}; I.lock=Math.max(I.cam,enc.x-VW*.55); banner('БЕЙ ИХ!','#ff6b6b',1); sfx('boost'); }
  if(I.act){ I.act.t+=dt; while(I.act.w.length&&I.act.w[0][2]<=I.act.t) isoSpawn(I.act.w.shift());
    if(!I.act.w.length&&!I.foes.some(e=>e.hp>0)){ I.act=null; I.lock=null; I.enc++; I.go=3.2; sfx('win'); banner(I.enc>=ISO_ENC.length?'ДВОР ЧИСТ! ВПЕРЁД!':'ВПЕРЁД! →','#7fe08a',1.3); } }
  // враги
  for(const e of I.foes){ e.tm=Math.max(0,e.tm-dt); e.fl=Math.max(0,e.fl-dt); e.cd=Math.max(0,e.cd-dt); e.ph+=dt*8;
    if(e.st==='dead'){ e.x+=e.kx*dt; e.kx*=1-4*dt; continue; }
    if(e.st==='hurt'){ e.x+=e.kx*dt; e.kx*=1-5*dt; if(e.tm<=0) e.st='walk'; continue; }
    const tg=L.length?L.reduce((b,q)=>{ const d=Math.abs(q.ix-e.x)+Math.abs(q.iz-e.z)*500; return !b||d<b.d?{q,d}:b; },null):null; if(!tg) continue; const q=tg.q;
    if(e.st==='wind'){ if(e.tm<=0){ e.st='walk'; e.cd=1.1;
        if(e.t==='t'){ I.shots.push({x:e.x,z:e.z,vx:e.face*330,h:36,dead:false}); sfx('shoot'); }
        else { const dx=(q.ix-e.x)*e.face; if(dx>-10&&dx<(e.t==='b'?78:62)&&Math.abs(q.iz-e.z)<.15&&q.ih<28) { const was=q.hp; hurt(q); if(q.hp<was){ q.ivh=q.ivh||0; I.fx.push({x:q.ix,z:q.iz,h:40,vx:e.face*200,vh:200,l:.3,c:'#ff6b6b'}); } } } } continue; }
    const dx=q.ix-e.x, dz=q.iz-e.z; e.face=dx>=0?1:-1;
    const want=e.t==='t'?300:(e.t==='b'?58:48); let mx=0,mz=0;
    if(e.t==='t'){ if(Math.abs(dx)<want-40) mx=-Math.sign(dx); else if(Math.abs(dx)>want+60) mx=Math.sign(dx); }
    else { if(Math.abs(dx)>want) mx=Math.sign(dx); }
    if(Math.abs(dz)>.05) mz=Math.sign(dz);
    const s=e.sp*(1+.12*Math.max(0,D))*(.9+.1*PACE);
    e.x+=mx*s*dt; e.z=clamp(e.z+mz*s*.0022*dt*60/3,0,1);
    for(const o of I.foes){ if(o===e||o.hp<=0) continue; const ddx=e.x-o.x, ddz=(e.z-o.z)*300; if(Math.abs(ddx)<40&&Math.abs(ddz)<22){ e.x+=Math.sign(ddx||Math.random()-.5)*60*dt; e.z=clamp(e.z+Math.sign(ddz||Math.random()-.5)*.25*dt,0,1); } }
    e.x=clamp(e.x,I.cam-70,I.cam+VW+70);
    if(e.cd<=0&&Math.abs(dz)<.12){ if(e.t==='t'?Math.abs(dx)>180:Math.abs(dx)<want+14){ e.st='wind'; e.tm=e.t==='t'?.6:(e.t==='b'?.7:.5); sfx('charge'); } } }
  I.foes=I.foes.filter(e=>!(e.st==='dead'&&e.tm<=0&&(e.dying=(e.dying||0)+dt)>.5));
  for(const s of I.shots){ s.x+=s.vx*dt; if(!s.dead) for(const q of L){ if(Math.abs(q.ix-s.x)<26&&Math.abs(q.iz-s.z)<.13&&q.ih<44){ s.dead=true; hurt(q); burst(q.ix-I.cam,isoZ(q.iz)-40,10,['#ff8a3d','#fff'],220,.4); } } if(s.x<I.cam-80||s.x>I.cam+VW+80) s.dead=true; }
  I.shots=I.shots.filter(s=>!s.dead);
  for(const f of I.fx){ f.l-=dt; f.x+=f.vx*dt; f.vh-=900*dt; f.h+=f.vh*dt; if(f.h<0){ f.h=0; f.vh*=-.3; f.vx*=.6; } } I.fx=I.fx.filter(f=>f.l>0);
  for(const p of players){ if(p.absent) continue; p.x=p.ix-I.cam-p.w/2; p.y=isoZ(p.iz)-p.ih-p.h; }
  // выход
  if(I.enc>=ISO_ENC.length&&!I.act&&L.length&&L.every(q=>q.ix>ISO.LEN-130)&&state==='play'&&!I.done){ I.done=true; complete(); }
  else if(I.enc>=ISO_ENC.length&&!I.act) I.lock=null;
}
// ----- рисование -----
function isoBack(I){
  const cam=I.cam, g=ctx.createLinearGradient(0,0,0,ISO.HY+30); g.addColorStop(0,'#2a1740'); g.addColorStop(.55,'#8a3b58'); g.addColorStop(1,'#f0a060'); ctx.fillStyle=g; ctx.fillRect(0,0,VW,ISO.HY+30);
  ctx.fillStyle='rgba(255,226,160,.9)'; ctx.beginPath(); ctx.arc(980-cam*.02,170,46,0,7); ctx.fill(); ctx.fillStyle='rgba(255,226,160,.18)'; ctx.beginPath(); ctx.arc(980-cam*.02,170,90,0,7); ctx.fill();
  const ridge=(par,base,amp,col,seed)=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,ISO.HY+30); for(let x=0;x<=VW+40;x+=40){ const wx=x+cam*par; ctx.lineTo(x,base-amp*(0.55+0.45*Math.sin(wx*.0042+seed)*Math.sin(wx*.0017+seed*2.3))-amp*.35*Math.abs(Math.sin(wx*.011+seed))); } ctx.lineTo(VW+40,ISO.HY+30); ctx.closePath(); ctx.fill(); };
  ridge(.08,ISO.HY-40,150,'#4a2a55',1); ridge(.18,ISO.HY-14,110,'#341d46',4); ridge(.32,ISO.HY+4,70,'#241435',9);
  // заводские трубы и дым вдали
  for(let i=0;i<7;i++){ const wx=i*620+180-cam*.45; const x=((wx%4000)+4000)%4000-300; if(x<-60||x>VW+60) continue; ctx.fillStyle='#1b1030'; ctx.fillRect(x,ISO.HY-70-(i%3)*18,26,100); ctx.fillStyle='rgba(60,40,70,.5)'; for(let k=0;k<3;k++){ ctx.beginPath(); ctx.arc(x+12+k*14+Math.sin(clock+i)*6,ISO.HY-80-(i%3)*18-k*22,14+k*5,0,7); ctx.fill(); } }
  // пол двора
  const f=ctx.createLinearGradient(0,ISO.HY+30,0,VH); f.addColorStop(0,'#5a3a4a'); f.addColorStop(1,'#2d2030'); ctx.fillStyle=f; ctx.fillRect(0,ISO.HY+30,VW,VH-ISO.HY-30);
  ctx.fillStyle='#1a1224'; ctx.fillRect(0,ISO.HY+26,VW,6);
  // плитка: линии глубины с лёгкой перспективой и вертикальные швы
  ctx.strokeStyle='rgba(255,210,160,.10)'; ctx.lineWidth=2; for(let i=0;i<=8;i++){ const y=ISO.Z0-30+(ISO.Z1-ISO.Z0+60)*Math.pow(i/8,1.2); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(VW,y); ctx.stroke(); }
  for(let wx=Math.floor(cam/120)*120;wx<cam+VW+120;wx+=120){ const x=wx-cam; ctx.beginPath(); ctx.moveTo(x+ (x-VW/2)*.0, ISO.HY+32); ctx.lineTo(x+(x-VW/2)*.38,VH); ctx.stroke(); }
  // жёлтая разметка у дальней кромки
  ctx.fillStyle='rgba(255,209,102,.5)'; for(let wx=Math.floor(cam/90)*90;wx<cam+VW+90;wx+=90) ctx.fillRect(wx-cam,ISO.Z0-26,48,5);
}
function isoShadow(x,z,w){ const y=isoZ(z), k=isoK(z); ctx.fillStyle='rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(x,y+2,w*k,w*.3*k,0,0,7); ctx.fill(); }
function isoProp(pr,I){ const x=pr.x-I.cam; if(x<-80||x>VW+80) return; const y=isoZ(pr.z), k=isoK(Math.max(0,Math.min(1,pr.z)));
  ctx.save(); ctx.translate(x,y); ctx.scale(k*1.5,k*1.5); isoShadow(0,0,0);
  ctx.restore(); ctx.save(); ctx.translate(x,y); ctx.scale(k*1.5,k*1.5);
  if(pr.k==='crate'){ ctx.fillStyle='#8a5a34'; ctx.fillRect(-20,-36,40,36); ctx.strokeStyle='#4a2d18'; ctx.lineWidth=3; ctx.strokeRect(-20,-36,40,36); ctx.beginPath(); ctx.moveTo(-20,-36); ctx.lineTo(20,0); ctx.moveTo(20,-36); ctx.lineTo(-20,0); ctx.stroke(); }
  else if(pr.k==='barrel'){ ctx.fillStyle='#3d6f8a'; rr(ctx,-15,-42,30,42,6); ctx.fill(); ctx.fillStyle='#ffd166'; ctx.fillRect(-15,-30,30,5); ctx.fillRect(-15,-12,30,5); }
  else if(pr.k==='pipe'){ ctx.fillStyle='#5b6b78'; rr(ctx,-34,-24,68,24,10); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(-30,-20,60,5); ctx.fillStyle='#34414c'; ctx.fillRect(-14,-24,6,24); ctx.fillRect(10,-24,6,24); }
  else { ctx.fillStyle='#2b2236'; ctx.fillRect(-3,-110,6,110); ctx.fillStyle='#ffe9a8'; ctx.shadowColor='#ffd166'; ctx.shadowBlur=18*GLOW; ctx.beginPath(); ctx.arc(0,-114,9,0,7); ctx.fill(); ctx.shadowBlur=0; }
  ctx.restore(); }
function isoFoe(e,I){
  const x=e.x-I.cam, y=isoZ(e.z)-e.h, k=isoK(e.z)*1.45, b=e.t==='b', t=e.t==='t', fl=e.fl>0, wk=Math.sin(e.ph)*3, face=e.face;
  isoShadow(x,e.z,b?30:22);
  ctx.save(); ctx.translate(x,y); ctx.scale(k,k); if(e.st==='dead'){ ctx.globalAlpha=Math.max(0,e.tm/.6); ctx.rotate(-face*.9*(1-Math.max(0,e.tm/.6))); }
  const body=fl?'#fff':(b?'#6d3a8a':t?'#3b7a63':'#b0463a'), dark=b?'#44235a':t?'#245041':'#7c2a22', W=b?24:18, H=b?44:34;
  ctx.strokeStyle=dark; ctx.lineWidth=4; ctx.lineCap='round'; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(s*W*.4,-10); ctx.lineTo(s*W*.4+(e.st==='walk'?s*wk:0),0); ctx.stroke(); }
  ctx.fillStyle=body; rr(ctx,-W,-H-6,W*2,H,b?9:8); ctx.fill(); ctx.fillStyle=dark; ctx.fillRect(-W+3,-H*.35,W*2-6,4);
  ctx.fillStyle=fl?'#fff':dark; rr(ctx,-W*.7,-H-14,W*1.4,14,6); ctx.fill();   // голова-шлем
  ctx.fillStyle='#ffe27a'; ctx.shadowColor='#ffd166'; ctx.shadowBlur=8*GLOW; ctx.fillRect(face*W*.15-2,-H-10,10,5); ctx.shadowBlur=0;   // глаз-полоска
  // руки
  const wind=e.st==='wind', ex=wind?-face*10:face*(e.st==='hurt'?-4:10);
  ctx.strokeStyle=body; ctx.lineWidth=b?8:6; ctx.beginPath(); ctx.moveTo(face*W*.7,-H*.7); ctx.lineTo(face*W*.7+ex+(wind&&e.tm<.18?face*34:0),-H*.55+(wind&&e.tm>.18?-14:0)); ctx.stroke();
  if(t){ ctx.fillStyle='#8a8f96'; ctx.fillRect(face*W*.7+ex-4,-H*.55-4,10,8); }
  if(wind){ ctx.fillStyle='#ff4d5e'; ctx.font="900 18px Unbounded, sans-serif"; ctx.textAlign='center'; ctx.fillText('!',0,-H-24); }
  ctx.restore();
  if(e.hp>0&&e.hp<e.max){ ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(x-22,y-(b?86:70)*k/1.45*1.45,44,5); ctx.fillStyle='#ff6b6b'; ctx.fillRect(x-22,y-(b?86:70)*k/1.45*1.45,44*e.hp/e.max,5); }
}
function isoHero(p,I){
  const x=p.ix-I.cam, k=isoK(p.iz)*1.55, base=isoZ(p.iz);
  isoShadow(x,p.iz,p.kind==='bolt'?22:16);
  const sv={x:p.x,y:p.y,face:p.face,vx:p.vx,wasGround:p.wasGround,shootCd:p.shootCd,hi5:p.hi5,w:p.w,h:p.h,sx:p.sx,sy:p.sy};
  p.x=-p.w/2; p.y=-p.h; p.face=p.ifc||1; p.vx=p.imv?260*p.face:0; p.wasGround=!(p.ih>2); p.shootCd=p.iat>0&&!p.ikick?.2:0; p.hi5=false;
  ctx.save(); ctx.translate(x,base-p.ih); ctx.scale(k,k);
  if(p.iat>0&&p.ikick){ ctx.translate(0,-p.h/2); ctx.rotate(p.face*.5); ctx.translate(0,p.h/2); }
  if(p.iat>0&&!p.ikick){ const a=1-p.iat/.24; ctx.translate(p.face*Math.sin(a*3.14)*7,0); }
  (p.kind==='bolt'?_drawBolt:_drawSpark)(p);
  // кулак/нога удара
  if(p.iat>0){ const a=1-p.iat/(p.ikick?.4:.24), r=Math.sin(Math.min(1,a)*Math.PI); ctx.fillStyle=p.kind==='bolt'?'#c7d3dd':'#ffd1a8'; ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(p.face*(p.w/2+10+r*(p.ikick?30:26)),-(p.ikick?p.h*.25:p.h*.5),p.kind==='bolt'?8:6,0,7); ctx.fill(); ctx.stroke();
    ctx.globalAlpha=.55*r; ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(p.face*(p.w/2+14),-(p.h*.45),26,p.face>0?-.8:Math.PI-.8+.4,p.face>0?.8:Math.PI+.8,false); ctx.stroke(); ctx.globalAlpha=1; }
  ctx.restore();
  Object.assign(p,sv);
}
function isoDraw(){
  const I=S.iso; if(!I) return; R3D.hide(); ctx.setTransform(scale,0,0,scale,0,0); ctx.clearRect(0,0,cv.width,cv.height); GLOW=settings.glow?1:0;
  const sk=settings.shake?shake:0; ctx.save(); ctx.translate((Math.random()-.5)*sk,(Math.random()-.5)*sk);
  isoBack(I);
  const items=[];
  for(const pr of I.props) items.push({z:pr.z,f:()=>isoProp(pr,I)});
  for(const d of I.drops) items.push({z:d.z,f:()=>{ const x=d.x-I.cam, y=isoZ(d.z)-26-Math.sin(clock*5)*4; isoShadow(x,d.z,12); ctx.fillStyle='#ff6b81'; heart(x,y,13); }});
  for(const e of I.foes) items.push({z:e.z,f:()=>isoFoe(e,I)});
  for(const s of I.shots) items.push({z:s.z,f:()=>{ const x=s.x-I.cam, y=isoZ(s.z)-s.h; isoShadow(x,s.z,10); ctx.save(); ctx.translate(x,y); ctx.rotate(clock*14); ctx.fillStyle='#c9ced6'; ctx.fillRect(-12,-3,24,6); ctx.fillRect(-4,-12,8,24); ctx.restore(); }});
  for(const p of players) if(!p.absent&&!p.dead) items.push({z:p.iz,f:()=>{ ctx.save(); if(p.down){ ctx.globalAlpha=.6; } if(p.inv>0&&!p.down&&Math.floor(clock*18)%2) ctx.globalAlpha=.4; isoHero(p,I); ctx.restore(); if(p.down){ ctx.fillStyle='#ff6b6b'; ctx.font="900 20px Unbounded, sans-serif"; ctx.textAlign='center'; ctx.fillText(p.bleed!=null?Math.ceil(Math.max(0,p.bleed))+' !':'!',p.ix-I.cam,isoZ(p.iz)-70); } }});
  items.sort((a,b)=>a.z-b.z); for(const it of items) it.f();
  for(const f of I.fx){ ctx.fillStyle=f.c; ctx.globalAlpha=Math.min(1,f.l*3); ctx.fillRect(f.x-I.cam-2,isoZ(f.z)-f.h-2,4,4); } ctx.globalAlpha=1;
  // частицы и надписи движка
  for(const q of particles){ ctx.globalAlpha=Math.max(0,q.life/q.max); ctx.fillStyle=q.c; ctx.fillRect(q.x-q.s/2,q.y-q.s/2,q.s,q.s); } ctx.globalAlpha=1;
  for(const t of texts){ ctx.save(); ctx.globalAlpha=Math.min(1,t.life*3); label(t.t,t.x,t.y,t.pop?24:18,t.c||'#fff'); ctx.restore(); }
  // стрелка «ВПЕРЁД»
  if(I.go>0&&!I.act){ I.go-=.016; if(Math.floor(clock*3)%2){ ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.moveTo(VW-120,360); ctx.lineTo(VW-60,400); ctx.lineTo(VW-120,440); ctx.lineTo(VW-120,420); ctx.lineTo(VW-150,420); ctx.lineTo(VW-150,380); ctx.lineTo(VW-120,380); ctx.closePath(); ctx.fill(); label('ВПЕРЁД',VW-100,460,16,'#ffd166'); } }
  ctx.restore();
  if(flashA>0){ ctx.globalAlpha=Math.min(.6,flashA); ctx.fillStyle=flashC||'#fff'; ctx.fillRect(0,0,VW,VH); ctx.globalAlpha=1; }
  drawHud();
  if(S.hintT>0){ hintCard(touchUI.on?'← →  ходить   ·   ▲▼  в глубину   ·   ✊  удар   ·   ⤒  прыжок':'← →  ходить   ·   W/S (↑/↓)  в глубину   ·   удар (E)   ·   прыжок (Q)',30); }
  if(S.banner){ const b=S.banner, a=Math.min(1,b.life*3,(b.max-b.life)*8+.2); ctx.globalAlpha=a; label(b.t,VW/2,150,46,b.c); ctx.globalAlpha=1; }
}

const BUILD={iso:D=>isoLevel(D),cart:D=>cartLevel(D),rope:D=>ropeLevel(D),chase:D=>chaseLevel(D),snake:D=>snakeLevel(D),rocket:D=>rocketLevel(D),lift:D=>liftLevel(D),mag:D=>magLevel(D),relay:D=>relayLevel(D),boss:D=>bossLevel(D),tube:D=>tubeLevel(D),brawl:D=>brawlLevel(D),wire:D=>wireLevel(D),maze:D=>mazeLevel(D),ice:D=>iceLevel(D),rot:D=>rotLevel(D)};
const LEVELS=DEFS.map(D=>BUILD[D.kind](D));

/* ---------------- кампания: 40 уровней = логика + испытания + боссы ---------------- */
const CAMPAIGN=true;
// места логики пока занимают уровни старой игры (номера с 0); их заменят 17 новых
const PUZ=[0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17];
const ACT_T=[[0,1,2,3,4],[5,6,7,8,9],[11,12,13,14,15],[16,17,18,19,20]];   // какие испытания в каком акте
const CAMP=[], ORD=[];
{ let pz=0, nt=0;
  for(let a=0;a<4;a++){ const Tt=ACT_T[a]; let ti=0;
    for(const c of (a<3?'LTLTLTLTTB':'LTLTLTLTLTK')){
      if(c==='L') CAMP.push({k:'p',m:PUZ[pz++]});
      else if(c==='B') CAMP.push({k:'b',m:CAMP.length});
      else CAMP.push({k:'t',t:c==='K'?10:Tt[ti++]});
      ORD[CAMP.length-1]=CAMP[CAMP.length-1].k==='t'?nt++:0; } } }
/* ---------------- перехваты движка ---------------- */
const _getLevel=getLevel;
getLevel=function(i){ if(edTest&&edLevel) return edLevel; const e=CAMP[Math.max(0,Math.min(i,CAMP.length-1))]; return e.k==='t'?LEVELS[e.t]:_getLevel(e.m); };

const _loadLevel=loadLevel;
loadLevel=function(i,keepHp){
  _loadLevel(i,keepHp);
  const L=getLevel(i); S.L=L; S.on=!!(L&&L.bt&&!edTest); S.kind=S.on?L.bt.kind:null;
  PACE=paceFor(i); BTX.z=0; BTX.lx=0; BTX.ly=0; BTX.fy=null; S.banner=null; S.boost=0; S.v=0; S.freeze=0; S.hintT=0; S.R=null; S.press=null; S.snakes=null; S.mines=[]; S.dyn=[];
  if(!S.on) return;
  tutMarks=[];
  if(S.cp&&S.cp.lvl!==i) S.cp=null;
  for(const p of players){ p.duck=false; p.rope=null; p.rocket=null; p.wire=null; p.mag=null; p.carried=null; p.carrying=null; p.thrown=0; p.smashCd=0; p.smashT=0; p.h0=H0[p.kind]; }
  if(S.kind==='cart'){ setupCart(L); cartExtraSetup(L); } else if(S.kind==='rope') setupRope(L); else if(S.kind==='chase') setupChase(L); else if(S.kind==='snake') setupSnake(L); else if(S.kind==='brawl') setupBrawl(L); else if(S.kind==='rocket') setupRocket(L); else if(S.kind==='lift') setupLift(L); else if(S.kind==='boss') setupBoss(L); else if(S.kind==='mag') setupMag(L); else if(S.kind==='relay') setupRelay(L); else if(S.kind==='wire') setupWire(L); else if(S.kind==='maze') setupMaze(L); else if(S.kind==='ice') setupIce(L); else if(S.kind==='rot') setupRot(L); else if(S.kind==='iso') setupIso(L);
};
const _tutorInit=tutorInit;
tutorInit=function(i){ const e=CAMP[i]; _tutorInit(e&&e.k!=='t'?e.m:99); if(getLevel(i)&&getLevel(i).bt){ tutMarks=[]; djSpots=[]; } };

function placeCart(x){ for(const p of players){ if(p.absent) continue; setDuck(p,false,true);
  const off=solo?0:(p.kind==='bolt'?2:0); p.x=(x+off)*T+(T-p.w)/2; p.y=FL*T-p.h; p.vx=0; p.vy=0; p.dash=0; p.slam=false; p.onGround=true; p.wasGround=true; } }
function rampFx(p){ sfx('boost'); shake=Math.max(shake,3); burst(p.x+p.w/2,p.y+p.h,22,['#bfefff','#7fc7ff','#fff'],340,.6); texts.push({x:p.x+p.w/2,y:p.y-34,t:'ВОЛНА!',life:.9,c:'#7fe0ff',pop:true}); }
function setupCart(L){
  BTX.z=1.85; BTX.lx=VW*0.2/1.85;
  const B=L.bt; for(const f of B.flags) f.on=!!(S.cp&&f.spot<=S.cp.x); for(const pd of B.pads) pd.cd=0;
  if(S.cp) placeCart(S.cp.x);
  S.freeze=S.cp?0.9:1.5; banner(S.cp?'С ФЛАЖКА':'ГОТОВЬСЯ…','#9cc3ff',S.freeze);
}
function setupRope(L){
  BTX.z=1.6; BTX.ly=VH*0.2/1.6;
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
  if(S.kind==='iso') return;
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
    if(p.vy<vy0-300&&p.vy<=-600){   // одинаковая дуга прыжка у обоих героев
      if(wg){ const cx=p.x+p.w/2, R=(S.L.bt.ramps||[]).find(r=>cx>=r.x*T&&cx<=(r.x+4)*T); if(R){ p.vy=-RJ; rampFx(p); } else p.vy=-JV; } else p.vy=-JV2; }
    p.face=1;
    if(dn&&!p.wasGround&&!p.onGround&&p.y+p.h<FL*T-4){   // ↓ в воздухе — резко вниз (успеть под ворота после прыжка)
      if(p.vy<900){ p.vy=900; p.cut=true; p.sx=.8; p.sy=1.25; }
      if(Math.random()<.6) addP({x:p.x+p.w/2+(Math.random()-.5)*p.w,y:p.y,vx:0,vy:-120,life:.2,max:.2,c:p.kind==='spark'?'#ffd1a8':'#9cc3ff',s:2.5,g:0}); }
    let v=S.v; const B=S.L.bt;
    if(p.x>B.finishX*T-T){ const stop=B.exitC-p.w/2+(solo?0:(p.kind==='bolt'?14:-14)); v=Math.min(v,Math.sqrt(2*1300*Math.max(0,stop-p.x))); }
    p.vx=v;
    return;
  }
  if(S.kind==='relay'&&(p.kind==='spark'||p.kind==='bolt')){
    const q=players.find(o=>o!==p&&!o.absent&&!o.dead);
    if(p.carried){ _control(p,{dir:0,jump:false,jp:false,ab:false,ap:false,fire:false,use:false,nx:false},dt); p.vx=0; return; }
    if(inp.ap&&S.freeze<=0&&!p.down){
      p.jumpHeld=!!inp.jump; if(p.carrying){ const c=p.carrying; p.carrying=null; c.carried=null; const th=(inp.jump||inp.jp)?LOB:THROW; c.vx=(p.face||1)*th.vx; c.vy=-th.vy; c.thrown=1.6; c.tvx=c.vx; c.tvy=th.vy; c.tt=0; sfx('jump'); burst(c.x+c.w/2,c.y+c.h/2,12,['#ffd166','#fff'],260,.4); texts.push({x:p.x+p.w/2,y:p.y-40,t:'БРОСОК!',life:.7,c:'#ffd166',pop:true}); }
      else if(q&&!q.carried&&!(q.thrown>0)&&!q.down&&p.onGround&&q.onGround&&Math.abs(q.x+q.w/2-(p.x+p.w/2))<T*1.7&&Math.abs(q.y+q.h-(p.y+p.h))<T*0.9){ p.carrying=q; q.carried=p; q.vx=q.vy=0; sfx('pk_shield'); texts.push({x:p.x+p.w/2,y:p.y-40,t:'НА ПЛЕЧИ!',life:.7,c:'#7fe08a',pop:true}); } }
    _control(p,{dir:inp.dir,jump:inp.jump,jp:inp.jp,ab:false,ap:false,fire:false,use:inp.use,nx:inp.nx},dt);
    if(p.thrown>0){ p.thrown-=dt; p.tt+=dt; p.vx=p.tvx; p.vy=-p.tvy+G*p.tt; if(p.onGround&&p.tt>0.25) p.thrown=0; }
    return; }
  if(S.kind==='mag'&&p.mag){ const M=p.mag; M.dir=S.freeze>0?0:(inp.dir||0); M.jp=!!(inp.jp||(inp.jump&&!M.jwas)); M.jwas=!!inp.jump; if(inp.ap||(inp.ab&&!M.abwas)) M.flip=true; M.abwas=!!inp.ab; if(M.dir) p.face=M.dir;
    _control(p,{dir:0,jump:false,jp:false,ab:false,ap:false,fire:false,use:inp.use,nx:inp.nx},dt); return; }
  if(S.kind==='wire'&&p.wire){ const W=p.wire, jp=!!(inp.jp||((inp.jump||padUp(pi))&&!W.jw)), dp=!!(inp.ap||((inp.ab||padDn(pi))&&!W.aw)); W.jw=!!(inp.jump||padUp(pi)); W.aw=!!(inp.ab||padDn(pi));
    if(S.freeze<=0&&!p.down){ if(jp&&W.lane>0){ W.lane--; sfx('jump'); burst(p.x+p.w/2,p.y+p.h,8,['#bfefff','#fff'],220,.3); } else if(dp&&W.lane<2){ W.lane++; sfx('jump'); burst(p.x+p.w/2,p.y+p.h,8,['#bfefff','#fff'],220,.3); } }
    _control(p,{dir:0,jump:false,jp:false,ab:false,ap:false,fire:inp.fire,use:inp.use,nx:inp.nx},dt); p.face=1; return; }
  if(S.kind==='rocket'&&p.rocket){
    const up=inp.jump||padUp(pi), dn=inp.ab||padDn(pi); const VY=300*1.12; let want=up?-VY:dn?VY:0; if(S.fuel<=0) want=230; if(S.freeze>0) want=0;
    p.rocket.vy=approach(p.rocket.vy,want,1800*dt);
    _control(p,{dir:0,jump:false,jp:false,ab:false,ap:false,fire:inp.fire,use:inp.use,nx:inp.nx},dt); p.face=1; return;
  }
  if(PLATF[S.kind]&&!p.down){
    const wasDash=p.dash>0; p.smashCd=Math.max(0,(p.smashCd||0)-dt);
    if(p.kind==='bolt'&&inp.ap&&p.wasGround){ const s0=players[0], onHead=!s0.absent&&!s0.down&&s0.wasGround&&s0.ground===p;
      if(!onHead){ if(p.smashCd<=0) smash(p); inp=Object.assign({},inp,{ap:false}); } }
    _control(p,inp,dt); if(S.kind==='ice') iceMomentum(p,inp); if(!wasDash&&p.dash>0) p.dashN=(p.dashN||0)+1; return;
  }
  if(S.kind==='rope'&&p.rope){
    p.rope.in={dir:inp.dir,up:!!inp.jump||padUp(pi),dn:!!inp.ab||padDn(pi)};
    _control(p,{dir:inp.dir,jump:false,jp:false,ab:false,ap:false,fire:inp.fire,use:inp.use,nx:inp.nx},dt);
    return;
  }
  return _control(p,inp,dt);
};

const _physics=physics;
physics=function(e,h){ if(S.on&&S.kind==='rope'&&e.rope) return ropePhys(e,h); if(S.on&&S.kind==='rocket'&&e.rocket) return rocketPhys(e,h); if(S.on&&S.kind==='mag'&&e.mag) return magPhys(e,h); if(S.on&&S.kind==='wire'&&e.wire) return wirePhys(e,h); if(S.on&&S.kind==='relay'&&e.carried) return; if(S.on&&S.kind==='cart'&&e.kind!=='crate'&&!e.slam) e.vy+=G*GX*h; return _physics(e,h); };
function ropePhys(p,h){
  const R=p.rope, B=S.L.bt;
  if(p.vy<-420){ R.vy=-300; }                     // отскок: прыжок на врага / шипы
  const L=Math.max(160,p.y-R.ay), dx=p.x+p.w/2-R.ax;
  R.vx+=(R.in.dir*1500-dx*(G/L)*0.5)*h; R.vx*=1-1.1*h; R.vx=clamp(R.vx,-430,430);
  let want=R.in.dn?300:R.in.up?-150:70*PACE;
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

window.BT_RESET=()=>{ S.cp=null; cpSave=null; };
const _complete=complete;
complete=function(){ if(S.on) S.cp=null; return _complete(); };

const _step=step;
step=function(dt){
  if(!S.on) return _step(dt);
  if(S.kind==='iso'){ if(intro) return _step(dt); if(hitstop>0){ hitstop-=dt; return; } levelTime+=dt; totalTime+=dt; if(S.banner){ S.banner.life-=dt; if(S.banner.life<=0) S.banner=null; } if(state==='play') isoStep(dt); return; }
  if(S.kind==='cart') cartPre(dt); else if(S.kind==='rocket') rocketPre(dt); else if(S.kind==='wire') wirePre(dt);
  _step(dt);
  if(S.banner){ S.banner.life-=dt; if(S.banner.life<=0) S.banner=null; }
  if(state!=='play') return;
  ({cart:cartPost,rope:ropePost,chase:chasePost,snake:snakePost,brawl:brawlPost,rocket:rocketPost,lift:liftPost,boss:bossPost,mag:magPost,relay:relayPost,wire:wirePost,maze:mazePost,ice:icePost,rot:rotPost})[S.kind](dt);
};

function cartPre(dt){
  const B=S.L.bt, L=live(); if(!L.length) return;
  const lead=Math.max(...L.map(p=>p.x));
  if(S.freeze>0){ S.freeze-=dt; S.v=0; if(S.freeze<=0){ banner('ВПЕРЁД!','#ffd166',0.9); sfx('boost'); tone(520,1040,.18,'square',.05); } return; }
  const prog=clamp(lead/T/B.finishX,0,1), mul=speedMul();
  const target=B.rhythm?B.base:(B.base+(B.top-B.base)*prog)*mul+(S.boost>0?B.boost*mul:0);
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


/* ---------------- водные уровни (Канал, Серфинг): 3D-вода без пола, труба, водный скутер ---------------- */
const W3={g:null,sc:[null,null],pipe:null,pipeLen:0};
const wet=()=>!!(S.on&&S.kind==='cart'&&S.L&&S.L.bt&&(S.L.bt.water||S.L.bt.surf));
const w3d=()=>wet()&&typeof R3D!=='undefined'&&R3D.on&&R3D.ready&&R3D.active();
// для 3D-сцены пол прячем (останется только вода), потолок убираем (в канале вместо него труба); балки-«пригибайся» остаются
window.BT_VGRID=function(g){ if(!wet()) return g; const W=g[0].length, o=g.map(r=>r.slice());
  for(let x=1;x<W-1;x++){ const pillar=o[TOP+1][x]==='#'; if(!pillar) for(let y=0;y<=TOP;y++) o[y][x]='.'; o[FL][x]='.'; }
  return o; };
function pipeTex(T3){
  const c=document.createElement('canvas'); c.width=256; c.height=256; const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,256,0); gr.addColorStop(0,'#1c2433'); gr.addColorStop(.28,'#46566e'); gr.addColorStop(.5,'#5d7088'); gr.addColorStop(.72,'#46566e'); gr.addColorStop(1,'#1c2433');
  g.fillStyle=gr; g.fillRect(0,0,256,256);
  let sd=7; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
  for(let i=0;i<70;i++){ g.fillStyle=`rgba(${rnd()<.5?255:0},${rnd()<.5?255:0},${rnd()<.5?255:0},${.025+rnd()*.03})`; g.fillRect(rnd()*256,rnd()*256,10+rnd()*40,10+rnd()*30); }
  for(let i=0;i<9;i++){ const x=rnd()*256, y=rnd()*256; const rg=g.createLinearGradient(x,y,x,y+80); rg.addColorStop(0,'rgba(120,70,30,.22)'); rg.addColorStop(1,'rgba(120,70,30,0)'); g.fillStyle=rg; g.fillRect(x,y,3+rnd()*4,80); }
  g.strokeStyle='#121824'; g.lineWidth=3; for(let k=1;k<6;k++){ g.beginPath(); g.moveTo(k*256/6,0); g.lineTo(k*256/6,256); g.stroke(); g.strokeStyle='rgba(255,255,255,.12)'; g.lineWidth=1; g.beginPath(); g.moveTo(k*256/6+2,0); g.lineTo(k*256/6+2,256); g.stroke(); g.strokeStyle='#121824'; g.lineWidth=3; }
  g.fillStyle='#8396b1'; g.fillRect(0,0,256,14); g.fillStyle='#202a3a'; g.fillRect(0,14,256,4); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(0,0,256,2);
  g.fillStyle='#2a3446'; for(let x=14;x<256;x+=28){ g.beginPath(); g.arc(x,7,3.2,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.arc(x-.8,6,1.2,0,7); g.fill(); g.fillStyle='#2a3446'; }
  const tx=new T3.CanvasTexture(c); tx.wrapS=tx.wrapT=T3.RepeatWrapping; tx.anisotropy=4; return tx;
}
function w3Hook(c){
  const {scene,THREE:T3,cx,R}=c;
  if(!wet()){ if(W3.g) W3.g.visible=false; if(R.back) R.back.visible=true; if(R.fx) R.fx.visible=true; if(R.sh) R.sh.visible=true; return; }
  const B=S.L.bt, LEN=B.len*T, WY=FL*T-4;
  if(!W3.g){ const g=new T3.Group(); scene.add(g); W3.g=g;
    const wm=new T3.MeshLambertMaterial({color:0x1f6fb0,emissive:0x061f3a,transparent:true,opacity:.78,depthWrite:false});
    W3.vol=new T3.Mesh(new T3.BoxGeometry(1,1,1),wm); W3.vol.renderOrder=3; g.add(W3.vol);
    const sg=new T3.PlaneGeometry(2600,100,160,5); sg.rotateX(-Math.PI/2); W3.sg=sg; W3.sbase=Float32Array.from(sg.attributes.position.array);
    W3.sf=new T3.Mesh(sg,new T3.MeshLambertMaterial({color:0x3aa6e6,emissive:0x0a2c4c,transparent:true,opacity:.72,depthWrite:false})); W3.sf.renderOrder=4; g.add(W3.sf);
  }
  W3.g.visible=true;
  // труба — только в Канале; в Серфинге остаётся обычный фон
  const pipeOn=!!(B.water&&!B.surf);
  if(pipeOn&&(!W3.pipe||W3.pipeLen!==LEN)){ if(W3.pipe){ scene.remove(W3.pipe); W3.pipe.geometry.dispose(); }
    const tx=pipeTex(T3); tx.repeat.set(1,LEN/320);
    const geo=new T3.CylinderGeometry(520,520,LEN+600,72,1,true,Math.PI/2,Math.PI);
    const mat=new T3.MeshLambertMaterial({map:tx,color:0x9aa8bc,emissive:0x04070d,side:T3.BackSide}); const m=new T3.Mesh(geo,mat); m.rotation.z=Math.PI/2; m.position.set(LEN/2,-470,-150); m.receiveShadow=false; scene.add(m); W3.pipe=m; W3.pipeLen=LEN; }
  if(W3.pipe) W3.pipe.visible=pipeOn;
  if(R.back) R.back.visible=!pipeOn; if(R.fx) R.fx.visible=!pipeOn; if(R.sh) R.sh.visible=!pipeOn;
  // вода: объём под линией героев + живая поверхность
  W3.vol.scale.set(LEN+800,520,150); W3.vol.position.set(LEN/2,-(WY+260),-45);
  const pa=W3.sg.attributes.position.array, base=W3.sbase, t=clock, ox=cx-1300;
  for(let i=0;i<pa.length;i+=3){ const wx=ox+base[i]+1300; pa[i+1]=Math.sin(wx*.05+t*3.6)*2.6+Math.sin(wx*.021-t*2.2)*2.2+Math.sin(wx*.13+base[i+2]*.2+t*5)*.9; }
  W3.sg.attributes.position.needsUpdate=true; W3.sg.computeVertexNormals(); W3.sf.position.set(cx,-WY,-45);
}
if(typeof R3D!=='undefined'&&R3D.hooks) R3D.hooks.push(w3Hook);
// 2D-скутер в духе Battletoads: герой пригнулся к рулю; в прыжке откидывается назад («супермен»), скутер задирает нос
function scooterPitch(p){ return clamp(p.vy*0.0005,-.34,.34); }
function drawScooterHull(p,pitch){
  const cx=p.x+p.w/2, deck=p.y+p.h-14, sp=S.v, hot=p.kind==='bolt'?'#62c7c1':'#ff8a3d', hot2=p.kind==='bolt'?'#cfd8e6':'#ffd166';
  ctx.save(); ctx.translate(cx,deck); ctx.rotate(pitch);
  if(sp>40){ ctx.fillStyle='rgba(255,255,255,.75)'; for(let k=0;k<7;k++){ const fx=-40-k*10-((clock*110)%10), fy=14+Math.sin(clock*10+k*1.3)*2.5; ctx.globalAlpha=.75-k*.1; ctx.beginPath(); ctx.arc(fx,fy,4.6-k*.4,0,7); ctx.fill(); } ctx.globalAlpha=1; }
  // корпус
  const gr=ctx.createLinearGradient(0,-4,0,18); gr.addColorStop(0,hot2); gr.addColorStop(.25,hot); gr.addColorStop(1,'#14202f');
  ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(-40,2); ctx.quadraticCurveTo(-42,-6,-30,-8); ctx.lineTo(18,-8); ctx.quadraticCurveTo(34,-8,46,-1); ctx.quadraticCurveTo(38,11,24,15); ctx.lineTo(-26,15); ctx.quadraticCurveTo(-40,15,-40,2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#0d1624'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#1d2735'; ctx.beginPath(); ctx.moveTo(-30,-8); ctx.lineTo(16,-8); ctx.lineTo(10,-3); ctx.lineTo(-28,-3); ctx.closePath(); ctx.fill();   // сиденье-площадка
  ctx.fillStyle=hot2; ctx.fillRect(-20,3,40,2.6); ctx.fillStyle='rgba(255,255,255,.45)'; ctx.fillRect(-26,-6,52,1.4);
  ctx.fillStyle='#0f1622'; ctx.beginPath(); ctx.ellipse(-43,5,5,6,0,0,7); ctx.fill();   // сопло
  ctx.fillStyle='#fff6c8'; ctx.shadowColor='#ffe27a'; ctx.shadowBlur=10*GLOW; ctx.beginPath(); ctx.arc(41,-2,3,0,7); ctx.fill(); ctx.shadowBlur=0;   // фара
  ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-34,17); for(let x=-34;x<=40;x+=6) ctx.lineTo(x,17+Math.sin(x*.2+clock*9)*1.6); ctx.stroke();   // пена у борта
  ctx.restore();
}
function drawScooterRider(f,p){
  const cx=p.x+p.w/2, deck=p.y+p.h-14, air=!(p.onGround||p.wasGround), pitch=scooterPitch(p), bolt=p.kind==='bolt';
  const lx=22, ly=-30, bx=cx+Math.cos(pitch)*lx-Math.sin(pitch)*ly, by=deck+Math.sin(pitch)*lx+Math.cos(pitch)*ly;
  p._lean=(p._lean||0)+(((air&&!p.duck)?1.15:.2)-(p._lean||0))*.22;
  drawScooterHull(p,pitch);
  const feetY=deck-14, hh=p.duck?HD[p.kind]*1.08:p.h, col=bolt?'#7f93a3':'#b8431f';
  ctx.save(); ctx.translate(bx,by); ctx.rotate(p._lean); ctx.translate(-bx,-by);
  // ноги: колени согнуты, ступни на палубе (рисуем за телом)
  ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=col; ctx.lineWidth=bolt?5:3.6;
  for(const o of [-5,6]){ ctx.beginPath(); ctx.moveTo(cx+o*.6,feetY-4); ctx.lineTo(cx+o+4,feetY+4); ctx.lineTo(cx+o-(air?10:2),deck-5); ctx.stroke(); }
  // тело: смотрит вперёд (вправо), без собственных рук — руки рисуем ниже, одну на руль
  const lim=looks[p.kind].limbs, fc=p.face, h0=p.h, y0=p.y, sx0=p.sx, sy0=p.sy;
  looks[p.kind].limbs='off'; p.face=1;
  if(p.duck){ p.y=y0+h0-H0[p.kind]; p.h=H0[p.kind]; p.sx=1.22; p.sy=HD[p.kind]/H0[p.kind]*1.08; }
  ctx.save(); ctx.translate(0,-14); f(p); ctx.restore();
  p.h=h0; p.y=y0; p.sx=sx0; p.sy=sy0; p.face=fc; looks[p.kind].limbs=lim;
  // одна рука: от плеча к рулю, кисть сжимает рукоять
  const shx=cx+p.w*.24, shy=feetY-hh*(bolt?.5:.46), ex=(shx+bx)/2-3, ey=(shy+by)/2+7;
  ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=(bolt?6.5:5.2); ctx.beginPath(); ctx.moveTo(shx,shy+1); ctx.quadraticCurveTo(ex,ey+1,bx,by+1); ctx.stroke();
  ctx.strokeStyle=col; ctx.lineWidth=(bolt?5:3.8); ctx.beginPath(); ctx.moveTo(shx,shy); ctx.quadraticCurveTo(ex,ey,bx,by); ctx.stroke();
  ctx.fillStyle=bolt?'#c7d3dd':col; ctx.beginPath(); ctx.arc(bx,by,bolt?4.2:3.2,0,Math.PI*2); ctx.fill();
  ctx.restore();
  // стойка и рукоять руля поверх корпуса
  ctx.save(); ctx.translate(cx,deck); ctx.rotate(pitch); ctx.strokeStyle='#2a3648'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(17,-6); ctx.lineTo(lx,ly+2); ctx.stroke(); ctx.restore();
  if(S.v>40&&!air&&Math.random()<.18) addP({x:cx-44,y:p.y+p.h,vx:-S.v*.35-Math.random()*90,vy:-30-Math.random()*70,life:.45,max:.45,c:Math.random()<.5?"#e8fbff":"#9fdcff",s:2,g:.6});
}

/* ---------------- рисование ---------------- */
const _draw=draw; draw=function(){ if(S.on&&S.kind==='iso'&&S.iso&&players&&(state==='play'||state==='pause'||state==='dying')){ isoDraw(); return; } return _draw(); };
const _drawBolt=drawBolt, _drawSpark=drawSpark;
drawBolt=function(p){ if(S.on&&p===players[1]&&grid) { try{ drawWorld(); }catch(e){} } heroDraw(_drawBolt,p); };
drawSpark=function(p){ heroDraw(_drawSpark,p); };
function heroDraw(f,p){
  if(!S.on||!p||!players||(p!==players[0]&&p!==players[1])||p.absent||p.dead) return f(p);
  if(S.kind==='rope'&&p.rope){ drawRope(p); return f(p); }
  if(S.kind==='rocket'&&p.rocket){ drawRocket(p); return f(p); }
  if(S.kind==='wire'&&p.wire){ drawWheel(p); return f(p); }
  if(S.kind==='mag'&&p.mag){ if(p.mag.g<0){ const cx=p.x+p.w/2, cy=p.y+p.h/2; ctx.save(); ctx.translate(cx,cy); ctx.scale(1,-1); ctx.translate(-cx,-cy); f(p); ctx.restore(); } else f(p); return; }
  if(PLATF[S.kind]){ f(p); drawSmash(p); return; }
  if(S.kind==='cart'){
    if(w3d()){ drawScooterRider(f,p); return; }
    if(p.duck){ const h=p.h,y=p.y,sx=p.sx,sy=p.sy; p.y=y+h-H0[p.kind]; p.h=H0[p.kind]; p.sx=1.22; p.sy=HD[p.kind]/H0[p.kind]*1.08; ctx.save(); ctx.translate(0,-6); f(p); ctx.restore(); p.h=h; p.y=y; p.sx=sx; p.sy=sy; }
    else { ctx.save(); ctx.translate(0,-6); f(p); ctx.restore(); }
    drawBoard(p); return;
  }
  f(p);
}
function drawSurf(p){
  const x=p.x+p.w/2, y=p.y+p.h-3, L=p.kind==='bolt'?58:50, c=p.kind==='bolt'?'#62c7c1':'#ff8a3d', sp=S.v;
  ctx.save(); ctx.translate(x,y);
  if(sp>40){ ctx.fillStyle='rgba(255,255,255,.6)'; for(let k=0;k<7;k++){ const fx=-L/2-6-k*10-((clock*90)%10), fy=5+Math.sin(clock*9+k*1.3)*2.5; ctx.globalAlpha=.7-k*.09; ctx.beginPath(); ctx.arc(fx,fy,4.2-k*.4,0,7); ctx.fill(); } ctx.globalAlpha=1; }
  ctx.rotate(clamp(p.vy*0.00028,-0.28,0.28));
  const gr=ctx.createLinearGradient(-L/2,0,L/2,0); gr.addColorStop(0,'#f2f6fb'); gr.addColorStop(.5,'#ffffff'); gr.addColorStop(1,'#dbe6f2');
  ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(-L/2,2); ctx.quadraticCurveTo(-L/2+8,-3,0,-3); ctx.quadraticCurveTo(L/2-4,-3,L/2+8,-1); ctx.quadraticCurveTo(L/2,7,L/2-12,7); ctx.lineTo(-L/2+4,7); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#1d2a40'; ctx.lineWidth=1.6; ctx.stroke(); ctx.fillStyle=c; ctx.fillRect(-L/2+8,0.5,L-26,3);
  ctx.fillStyle='#1d2a40'; ctx.beginPath(); ctx.moveTo(-L/2+6,7); ctx.lineTo(-L/2+2,13); ctx.lineTo(-L/2+14,7); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawBoard(p){
  if(S.L.bt.surf) return drawSurf(p);
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
    for(const sx of B.strips){ if(B.surf){ drawJelly(sx); continue; } const x=sx*T, y=FL*T-40, a=.75+.25*Math.sin(clock*30+sx);
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
  else if(S.kind==='lift') drawLift();
  else if(S.kind==='mag') drawMag();
  else if(S.kind==='relay') drawRelay();
  else if(S.kind==='wire') drawWire(B);
  else if(S.kind==='maze') drawMaze();
  else if(S.kind==='ice') drawIce(B);
  else if(S.kind==='rot') drawRot(B);
  else if(S.kind==='boss') drawBoss();
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

// ---------- указатели опасности: камера близко, поэтому опасность сначала показывается у правого края ----------
function drawWarn(B){
  const V=draw.view; if(!V||!players) return; const z=V.z||1, rightW=(VW-V.ox)/z, v=Math.max(S.v,220), reach=v*1.0, items=[];
  if(S.kind==='cart'){ return;
    const lead=Math.max(...live().map(p=>p.x+p.w)); const yW=(FL*T-34);
    for(const o of B.obs.concat(S.dyn||[])){ const wx=o.x0*T; const d=wx-rightW; if(d<-T*0.5||d>reach||wx<lead) continue;
      const duck=o.t==='duck'; items.push({d,wx,yW,txt:o.pit?(B.water?'ВИР':'ЯМА'):o.fish?'РЫБА':o.mine?'МИНА':duck?'ПРИГНИСЬ':'ПРЫЖОК',dir:duck?1:-1,c:duck?'#7fd3ff':'#ffd166'}); }
  } else if(S.kind==='rocket'){
    const lead=Math.max(...live().map(p=>p.x+p.w));
    if(B.gates){ for(const q of B.gates){ const wx=q.x*T-10, d=wx-rightW; if(d<-T*0.5||d>reach*1.3||wx<lead) continue; const tau=Math.max(0,(wx-lead)/v), g=gateGap(q,(S.gt||0)+tau); items.push({d,wx,yW:(g[0]+g[1])/2,txt:'ОКНО',dir:0,c:'#7fe08a'}); } }
    else for(const o of B.obsList||[]){ const wx=o[0]*T, d=wx-rightW; if(d<-T*0.5||d>reach*1.2||wx<lead) continue; items.push({d,wx,yW:(o[2]+o[3]/2)*T,txt:'СТЕНА',dir:0,c:'#ff6b6b'}); }
  } else if(S.kind==='mag'){ const lead=Math.max(...live().map(p=>p.x+p.w)); for(const sg of B.segs){ const wx=sg.x0*T, d=wx-rightW; if(d<-T*0.5||d>reach*1.4||wx<lead) continue; const k=sg.k; items.push({d,wx,yW:k==='f'||k==='q'?MF-30:k==='c'||k==='p'?MC+30:(MC+MF)/2,txt:k==='f'?'ПОЛ!':k==='c'?'ПОТОЛОК!':k==='p'?'СТЕНА С ПОЛА':k==='q'?'СТЕНА С ПОТОЛКА':'ПИЛА',dir:k==='f'?-1:k==='c'?1:0,c:k==='s'?'#ffd166':'#ff6b6b'}); } }
  else if(S.kind==='wire'){ const lead=Math.max(...live().map(p=>p.x+p.w)); for(const o of B.obs){ if(o.dead) continue; const wx=o.x*T, d=wx-rightW; if(d<-T*0.5||d>reach*1.1||wx<lead) continue; for(const ln of o.lanes) items.push({d,wx,yW:LYW[ln]-40,txt:'ШОК',dir:0,c:'#ff6b6b'}); } }
  else return;
  items.sort((a,b)=>a.d-b.d); const t=clock;
  for(let k=0;k<Math.min(3,items.length);k++){ const it=items[k], x=VW-38-k*58, y=clamp(it.yW*z+V.oy,70,VH-70), a=clamp(1-Math.max(0,it.d)/reach*0.4,.55,1), pul=1+0.12*Math.sin(t*14);
    ctx.save(); ctx.globalAlpha=a; ctx.translate(x,y); ctx.scale(pul,pul);
    ctx.fillStyle='rgba(6,10,22,.88)'; rr(ctx,-24,-26,48,52,10); ctx.fill(); ctx.strokeStyle=it.c; ctx.lineWidth=2.5; rr(ctx,-24,-26,48,52,10); ctx.stroke();
    ctx.fillStyle=it.c; ctx.beginPath(); if(it.dir<0){ ctx.moveTo(0,-16); ctx.lineTo(13,-1); ctx.lineTo(-13,-1); } else if(it.dir>0){ ctx.moveTo(0,-1); ctx.lineTo(13,-16); ctx.lineTo(-13,-16); } else { ctx.arc(0,-9,8,0,Math.PI*2); } ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.save(); ctx.globalAlpha=a; label(it.txt,x,y+16,10,it.c); ctx.restore(); }
}
// заметная, но компактная подсказка: яркая плашка со стрелкой и названием действия + кольцо вокруг нужной кнопки; чем ближе препятствие — тем резче
function keyName(act){ try{ const k=binds[(solo?soloHero:'spark')||'spark'].kb[act]||''; return k.replace(/^Key/,'').replace('Arrow','').replace('Up','↑').replace('Down','↓').replace('Left','←').replace('Right','→').replace('Slash','/'); }catch(e){ return ''; } }
function drawCue(cue,txt,k,col){
  const cx=VW-T*3.9, cy=VH*0.40, near=clamp(1-k,0,1), pul=1+.06*Math.sin(clock*(8+near*10)), W=232, H=84;
  ctx.save(); ctx.translate(cx,cy); ctx.scale(pul,pul);
  ctx.globalAlpha=.55*(1-((clock*1.4)%1)); ctx.strokeStyle=col; ctx.lineWidth=4; rr(ctx,-W/2-8-((clock*1.4)%1)*26,-H/2-8-((clock*1.4)%1)*14,W+16+((clock*1.4)%1)*52,H+16+((clock*1.4)%1)*28,26); ctx.stroke(); ctx.globalAlpha=1;
  ctx.fillStyle='rgba(6,10,22,.92)'; rr(ctx,-W/2,-H/2,W,H,22); ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=4; rr(ctx,-W/2,-H/2,W,H,22); ctx.stroke();
  ctx.fillStyle=col; ctx.beginPath(); const ax=-W/2+44;
  if(cue==='jump'){ ctx.moveTo(ax,-22); ctx.lineTo(ax+22,10); ctx.lineTo(ax-22,10); } else if(cue==='ability'){ ctx.moveTo(ax,22); ctx.lineTo(ax+22,-10); ctx.lineTo(ax-22,-10); } else { ctx.arc(ax,0,18,0,7); }
  ctx.closePath(); ctx.fill();
  ctx.restore();
  label(txt,cx+34,cy-8,txt.length>9?19:24,col); 
  const hint=touchUI&&touchUI.on?(cue==='jump'?'жми ▲':cue==='ability'?'жми ➤':'жми ✦'):('кнопка '+(keyName(cue)||'')); label(hint,cx+34,cy+22,15,'#e8effa');
}

// единая плашка-подсказка: стеклянные «чипсы» внизу, плавно появляются и тают; на сенсоре клавиши заменяются значками кнопок
function hintCard(txt,yo){
  if(S.hintT>(S._hp||0)+.5) S.hcT0=clock; S._hp=S.hintT;
  const a=Math.min(1,S.hintT*1.2,(clock-(S.hcT0||0))*2.2); if(a<=0.01) return;
  const tch=touchUI&&touchUI.on; if(tch) txt=txt.replace(/↑ \/ W/g,'▲').replace(/↓ \/ S/g,'▼').replace(/← →/g,'◀ ▶').replace(/W\/S \(↑\/↓\)/g,'▲▼').replace(/удар \(E\)/g,'✊ удар').replace(/прыжок \(Q\)/g,'⤒ прыжок');
  const parts=txt.split(/\s*·\s*/).map(x=>x.trim()).filter(Boolean); ctx.save(); ctx.font="600 15px Rubik,'Segoe UI',Arial,sans-serif"; ctx.textBaseline='middle'; ctx.textAlign='left';
  const padX=14, gap=8, H=32, ws=parts.map(x=>Math.ceil(ctx.measureText(x).width)+padX*2); const max=VW-60; const rows=[[]]; let cur=0;
  parts.forEach((x,i)=>{ if(cur+ws[i]>max&&rows[rows.length-1].length){ rows.push([]); cur=0; } rows[rows.length-1].push(i); cur+=ws[i]+gap; });
  const slide=(1-a)*14; let y=VH-(yo||40)-6-(rows.length-1)*(H+6)+slide;
  ctx.globalAlpha=a*.96;
  for(const row of rows){ const tw=row.reduce((q,i)=>q+ws[i]+gap,-gap); let x=VW/2-tw/2;
    for(const i of row){ const w=ws[i]; ctx.fillStyle='rgba(10,18,40,.84)'; rr(ctx,x,y-H/2,w,H,H/2); ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=i===0?'rgba(255,209,102,.8)':'rgba(156,195,255,.4)'; rr(ctx,x,y-H/2,w,H,H/2); ctx.stroke();
      ctx.fillStyle=i===0?'#ffe9a8':'#e8effa'; ctx.fillText(parts[i],x+padX,y+1); x+=w+gap; }
    y+=H+6; }
  ctx.restore();
}
function hud(){
  const B=S.L.bt, L=live();
  if(S.kind==='relay'){ const m=Math.floor(S.rt/60), sc=Math.floor(S.rt%60), low=S.rt<20; ctx.fillStyle='rgba(6,10,22,.85)'; rr(ctx,VW/2-70,70,140,32,12); ctx.fill(); label((m+':'+String(sc).padStart(2,'0')),VW/2,87,20,low&&Math.floor(clock*4)%2?'#ff6b6b':'#ffd166'); label('ОБЩЕЕ ВРЕМЯ',VW/2,64,10,'#e8effa');
    if(S.hintT>0){ hintCard('способность рядом с напарником — взять на плечи · ещё раз — бросить вперёд (с прыжком — подбросить вверх)',44); } }
  if(S.kind==='cart'&&B.rhythm&&L.length){ const lead=Math.max(...L.map(q=>q.x+q.w)), k=(lead/T-16)/5, ph=k-Math.floor(k), pu=Math.pow(1-ph,2), cx=VW/2, cy=VH-64; ctx.save(); ctx.globalAlpha=.35+.65*pu; ctx.strokeStyle=(Math.floor(k)%4===0)?'#ffd166':'#c79bff'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(cx,cy,12+26*pu,0,7); ctx.stroke(); ctx.fillStyle=ctx.strokeStyle; ctx.beginPath(); ctx.arc(cx,cy,7,0,7); ctx.fill(); ctx.restore(); }
  if(S.kind==='boss'&&S.bo){ const b=S.bo, bw=420, bx=VW/2-bw/2, by=78; ctx.fillStyle='rgba(6,10,22,.88)'; rr(ctx,bx-10,by-14,bw+20,30,12); ctx.fill(); label('КУЗНЕЦ',bx,by-26,12,'#ff9a8a','left'); ctx.fillStyle='rgba(255,77,94,.2)'; rr(ctx,bx,by-6,bw,12,5); ctx.fill(); ctx.fillStyle=b.ph===3?'#ff4d5e':b.ph===2?'#ff9a3d':'#ffd166'; rr(ctx,bx,by-6,Math.max(0,bw*b.hp/b.max),12,5); ctx.fill(); ctx.fillStyle='#0b1220'; for(const k of [0.34,0.67]) ctx.fillRect(bx+bw*k-1,by-8,3,16);
    if(S.hintT>0){ hintCard('Болт: способность вблизи — смэш · Искра: огонь и рывок',40); } }
  if(S.kind==='lift'){ const w=520, x=VW/2-w/2, y=VH-26, k=clamp((S.lt||0)/B.dur,0,1); ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-8,y-10,w+16,20,10); ctx.fill(); ctx.fillStyle='#c79bff'; rr(ctx,x,y-3,Math.max(6,w*k),6,3); ctx.fill(); label(S.opened?'ПРИЕХАЛИ':'ПОДЪЁМ '+Math.round(k*100)+'%',VW/2,y-22,12,'#e8effa');
    if(S.hintT>0){ hintCard('низкие пилы — прыжок · высокие — не прыгай · красное — отойди',62); } } if(S.freeze<=0&&!S.dead) try{ drawWarn(B); }catch(e){}
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
        const up=o.t==='jump', sh=o.t==='shoot', cue=sh?'fire':up?'jump':'ability';
        if(S.warnBeep!==o){ S.warnBeep=o; tone(up?880:440,up?1320:330,.08,'square',.035); }
        drawCue(cue,sh?'СТРЕЛЯЙ':up?(o.pit?'ЯМА — ПРЫЖОК':'ПРЫЖОК'):'ПРИГНИСЬ',tt/wt,sh?'#7fe08a':up?'#ffd166':'#ff6b6b');
        S.cueNow=cue; } } }
    if(S.cueNow!==S.cueSent){ S.cueSent=S.cueNow; document.body.dataset.hl=S.cueNow||''; } S.cueNow=null;
  } else if(S.kind==='rope'){
    const x=VW-T*0.9, y0=T*1.6, y1=VH-T*1.6, Hh=(B.H-3)*T;
    ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-9,y0-8,18,y1-y0+16,9); ctx.fill();
    ctx.fillStyle='rgba(156,195,255,.25)'; rr(ctx,x-3,y0,6,y1-y0,3); ctx.fill();
    for(const f of B.flags){ ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.fillRect(x-8,y0+(y1-y0)*f.y*T/Hh-1,16,3); }
    for(const p of L){ const k=clamp(p.y/Hh,0,1); ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.arc(x,y0+(y1-y0)*k,6,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#0b1830'; ctx.lineWidth=2; ctx.stroke(); }
    const d=L.length?Math.round(Math.max(...L.map(p=>p.y))/T*1.5):0; label(d+' м',x-16,y1+22,15,'#e8effa','right');
    if(S.hintT>0){ hintCard('← → раскачка   ·   ↓ / S быстрее   ·   ↑ / W подтянуться',26); }
  }
  hudExtra(B,L);
  if(S.banner){ const b=S.banner, a=Math.min(1,b.life*3), s=1+Math.max(0,(b.life-b.max+0.18))*2.5; ctx.save(); ctx.globalAlpha=a; ctx.translate(VW/2,VH*0.3); ctx.scale(s,s); label(b.t,0,0,46,b.c); ctx.restore(); }
}


/* ---------- рисование испытаний 4–9 ---------- */
function drawCartExtra(B){
  const V=viewRect();
  if(B.water){ const y=FL*T-5, x0=Math.max(0,V.x-20), x1=V.x+V.w+20;
    if(!w3d()){ ctx.save(); const gr=ctx.createLinearGradient(0,y-6,0,y+22); gr.addColorStop(0,'rgba(120,210,255,.55)'); gr.addColorStop(1,'rgba(40,120,200,.15)'); ctx.fillStyle=gr;
    ctx.beginPath(); ctx.moveTo(x0,y+24); for(let x=x0;x<=x1;x+=16) ctx.lineTo(x,y+Math.sin(x*0.05+clock*4)*3); ctx.lineTo(x1,y+24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(220,245,255,.7)'; ctx.lineWidth=2; ctx.beginPath(); for(let x=x0;x<=x1;x+=16){ const yy=y+Math.sin(x*0.05+clock*4)*3; x===x0?ctx.moveTo(x,yy):ctx.lineTo(x,yy); } ctx.stroke(); ctx.restore(); }
    ctx.save();
    for(const o of B.obs) if(o.pit){ const cx=(o.x0+o.x1+1)/2*T; if(cx<V.x-80||cx>V.x+V.w+80) continue; ctx.strokeStyle='rgba(20,60,120,.85)'; ctx.lineWidth=3;
      for(let r=6;r<(o.x1-o.x0+1)*T/2;r+=7){ ctx.beginPath(); ctx.ellipse(cx,FL*T+4,r,r*.28,0,clock*3+r,clock*3+r+4.2); ctx.stroke(); } }
    ctx.restore();
    if(state==='play'&&S.v>60) for(const p of live()) if(p.wasGround&&Math.random()<.7) addP({x:p.x,y:FL*T-6,vx:-S.v*.3-Math.random()*80,vy:-60-Math.random()*120,life:.4,max:.4,c:Math.random()<.5?'#bfefff':'#7fc7ff',s:3,g:.8}); }
  if(B.surf){
    ctx.save();
    if(!w3d()) for(let k=0;k<2;k++){ const yb=FL*T+8+k*10; ctx.fillStyle=k?'rgba(30,110,190,.18)':'rgba(120,210,255,.12)'; ctx.beginPath(); ctx.moveTo(V.x-20,yb+34); for(let x=V.x-20;x<=V.x+V.w+20;x+=18) ctx.lineTo(x,yb+Math.sin(x*0.018+clock*(2.2+k))*(7+k*3)); ctx.lineTo(V.x+V.w+20,yb+34); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    for(const r of B.ramps){ const x0=r.x*T, w=4*T; if(x0+w<V.x-60||x0>V.x+V.w+60) continue;
      ctx.save(); const gr=ctx.createLinearGradient(0,FL*T-32,0,FL*T); gr.addColorStop(0,'rgba(190,245,255,.95)'); gr.addColorStop(1,'rgba(60,170,230,.55)'); ctx.fillStyle=gr;
      ctx.beginPath(); ctx.moveTo(x0,FL*T); ctx.quadraticCurveTo(x0+w*0.62,FL*T-1,x0+w,FL*T-30); ctx.lineTo(x0+w,FL*T); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x0,FL*T); ctx.quadraticCurveTo(x0+w*0.62,FL*T-1,x0+w,FL*T-30); ctx.stroke();
      ctx.fillStyle='#0b3a5c'; for(let k=0;k<3;k++){ const xx=x0+14+k*34+((clock*60)%34)*0, ph=(clock*3-k*.3)%1; ctx.globalAlpha=.4+.6*(1-ph); ctx.beginPath(); ctx.moveTo(xx,FL*T-8-k*3); ctx.lineTo(xx+14,FL*T-12-k*4); ctx.lineTo(xx,FL*T-16-k*4); ctx.lineTo(xx+5,FL*T-12-k*4); ctx.closePath(); ctx.fill(); } ctx.globalAlpha=1;
      ctx.restore(); }
    for(const b of B.buoys){ const x=b.x*T+20; if(x<V.x-60||x>V.x+V.w+60) continue; const y=FL*T-15+Math.sin(clock*3+b.x)*2, bl=Math.floor(clock*6+b.x)%2;
      ctx.save(); ctx.translate(x,y); ctx.strokeStyle='#e8effa'; ctx.lineWidth=2; for(let k=0;k<8;k++){ const a=k*Math.PI/4; ctx.beginPath(); ctx.moveTo(Math.cos(a)*12,Math.sin(a)*12); ctx.lineTo(Math.cos(a)*18,Math.sin(a)*18); ctx.stroke(); }
      ctx.fillStyle='#d9322d'; ctx.beginPath(); ctx.arc(0,0,13,0,7); ctx.fill(); ctx.fillStyle='#f4f7fb'; ctx.fillRect(-13,-3,26,6); ctx.strokeStyle='#4b1311'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,13,0,7); ctx.stroke();
      ctx.fillStyle=bl?'#ffd166':'#7a5b1c'; ctx.beginPath(); ctx.arc(0,-17,3.5,0,7); ctx.fill(); ctx.restore(); }
  }
  for(const c of B.shoots||[]){ if(c.dead) continue; const x=c.x*T, y=FL*T-76; if(x<V.x-60||x>V.x+V.w+60) continue; ctx.save(); ctx.fillStyle='#8a5a2b'; ctx.fillRect(x+3,y,34,76); ctx.strokeStyle='#4b2f14'; ctx.lineWidth=3; ctx.strokeRect(x+3,y,34,76); ctx.beginPath(); ctx.moveTo(x+3,y); ctx.lineTo(x+37,y+76); ctx.moveTo(x+37,y); ctx.lineTo(x+3,y+76); ctx.stroke(); ctx.fillStyle='#7fe08a'; ctx.beginPath(); ctx.arc(x+20,y+20,10+Math.sin(clock*8)*1.5,0,7); ctx.fill(); ctx.fillStyle='#0b1830'; ctx.beginPath(); ctx.arc(x+20,y+20,5,0,7); ctx.fill(); ctx.restore(); }
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
function drawJelly(sx){
  const x=sx*T+T/2, y=FL*T-40, sw=Math.sin(clock*4+sx), a=.75+.25*Math.sin(clock*9+sx);
  ctx.save(); ctx.globalAlpha=a; const gr=ctx.createRadialGradient(x,y,2,x,y,22); gr.addColorStop(0,'rgba(255,170,230,.95)'); gr.addColorStop(1,'rgba(190,80,220,.55)'); ctx.fillStyle=gr;
  ctx.beginPath(); ctx.arc(x,y,19,Math.PI,0); ctx.quadraticCurveTo(x+22,y+6,x+16,y+6); ctx.quadraticCurveTo(x,y+2,x-16,y+6); ctx.quadraticCurveTo(x-22,y+6,x-19,y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(255,200,240,.9)'; ctx.lineWidth=2.4; ctx.shadowColor='#ff7ad9'; ctx.shadowBlur=12*GLOW;
  for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.moveTo(x+k*7,y+5); ctx.bezierCurveTo(x+k*7+sw*6,y+14,x+k*7-sw*6,y+22,x+k*7+sw*4,y+30); ctx.stroke(); }
  ctx.restore();
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
  if(S.kind==='ice') iceHud(B,L);
  if(S.kind==='rot') rotHud(B,L);
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
    if(S.hintT>0){ hintCard(B.tube?'↑ / W вверх   ·   ↓ / S вниз   ·   лети в зелёное окошко заслонки':'↑ / W вверх   ·   ↓ / S вниз   ·   огонь по дронам   ·   шестерёнки = топливо',56); } }
  if(S.kind==='wire'){ const w=520, x=VW/2-w/2, y=VH-26;
    ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-8,y-10,w+16,20,10); ctx.fill(); ctx.fillStyle='rgba(156,195,255,.25)'; rr(ctx,x,y-3,w,6,3); ctx.fill();
    for(const f of B.flags){ ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.fillRect(x+w*f.x/B.finishX-1,y-8,3,16); }
    ctx.fillStyle='#62d6ff'; ctx.beginPath(); ctx.arc(x+w*clamp(S.ballX/T/B.finishX,0,1),y,6,0,7); ctx.fill();
    for(const p of L){ const k=clamp(p.x/T/B.finishX,0,1); ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.arc(x+w*k,y,6,0,Math.PI*2); ctx.fill(); }
    if(L.length){ const gap=(Math.min(...L.map(p=>p.x))-S.ballX)/T, near=gap<7; label('шар: '+Math.max(0,Math.round(gap*1.5))+' м',VW-T*1.2,VH-28,18,near&&Math.floor(clock*6)%2?'#ff6b6b':'#e8effa','right'); }
    if(S.hintT>0){ hintCard('↑ / W — провод выше   ·   ↓ / S — провод ниже   ·   обходи искры, не дай шару догнать',56); } }
  if(S.kind==='maze'){ ctx.fillStyle='rgba(6,10,22,.85)'; rr(ctx,VW/2-80,70,160,30,12); ctx.fill(); label('РЫЧАГИ '+S.nOn+' / 3',VW/2,86,16,S.nOn>=3?'#7fe08a':'#ffd166'); mazeArrow();
    if(S.hintT>0){ hintCard('встань на красные плиты · лифты между этажами · охотника оглушай выстрелом, смэшем или рывком',30); } }
  if(S.kind==='chase'&&S.press){ const x=VW-T*0.9, y0=T*1.6, y1=VH-T*1.6, Hh=(B.H-3)*T;
    ctx.fillStyle='rgba(6,10,22,.8)'; rr(ctx,x-9,y0-8,18,y1-y0+16,9); ctx.fill();
    const py=y0+(y1-y0)*clamp(S.press.y/Hh,0,1); ctx.fillStyle='rgba(255,77,94,.5)'; rr(ctx,x-5,y0,10,Math.max(0,py-y0),4); ctx.fill(); ctx.fillStyle='#ff4d5e'; ctx.fillRect(x-9,py-2,18,4);
    for(const f of B.flags){ ctx.fillStyle=f.on?'#7fe08a':'#6f8191'; ctx.fillRect(x-8,y0+(y1-y0)*B.layers[f.i].y*T/Hh-1,16,3); }
    for(const p of L){ ctx.fillStyle=p.kind==='spark'?'#ff8a3d':'#62c7c1'; ctx.beginPath(); ctx.arc(x,y0+(y1-y0)*clamp(p.y/Hh,0,1),6,0,Math.PI*2); ctx.fill(); }
    if(L.length){ const d=Math.min(...L.map(p=>p.y))-S.press.y; label('пресс: '+Math.max(0,Math.round(d/T*1.5))+' м',x-16,y1+22,15,d<4*T?'#ff6b6b':'#e8effa','right'); }
    if(S.hintT>0){ hintCard('Беги к дыре в полу и прыгай вниз · способность Болта на земле — СМЭШ',26); } }
  if(S.kind==='snake'&&S.hintT>0){ hintCard('Запрыгивай на змею и катайся · спрыгивай на следующую опору',26); }
  if(S.kind==='brawl'){ label('ВОЛНА '+Math.max(1,S.wave)+' / '+WAVES.length+(S.opened?' · ВЫХОД ОТКРЫТ':' · врагов: '+(enemies.length+S.queue.length)),VW/2,80,15,S.opened?'#7fe08a':'#ffd166');
    if(S.hintT>0){ hintCard('Болт: способность на земле — СМЭШ (враги летят в стены) · Искра: рывок жжёт врагов',26); } }
}

/* ---------------- меню испытаний ---------------- */
const BEST_KEY='iskra-bolt-bt-best';
const bestOf=i=>{ const a=store.get(BEST_KEY+modeSuffix(),{}); return a[i]; };
const _complete2=complete;
complete=function(){ if(S.on&&!edTest&&!demo){ const a=store.get(BEST_KEY+modeSuffix(),{}); const o=a[levelIdx]; if(!o||levelTime<o) { a[levelIdx]=Math.round(levelTime*10)/10; store.set(BEST_KEY+modeSuffix(),a); } } return _complete2(); };
function modeName(){ return solo?('1 игрок · '+(soloHero==='spark'?'Искра':'Болт')):'2 игрока'; }
function startBt(i){ S.cp=null; cpSave=null; sfx('pick'); startGame(i,true); }
/* ---------------- вступление перед испытанием: что делать, «Играть», когда прочитал ---------------- */
const INTRO=[
 ['Доедь до финиша на доске.',['Доска едет сама и разгоняется.','Прыжок — через стенки и ямы.','Способность — пригнуться под ворота с разрядом. Знак ▲ впереди — прыгать, ▼ — пригнуться.','Врезался — минус сердце и назад; флажки сохраняют место.']],
 ['Та же гонка, только быстрее.',['Оранжевые стрелки на полу — турбо.','Прыжок и пригибание — как в «Разгоне».','Знаки впереди предупреждают заранее.']],
 ['Спустись по тросу вниз.',['← → — раскачка.','Способность — спускаться быстрее, прыжок — подтянуться вверх.','Синие разряды включаются и гаснут — жди паузу.','Шипы и турели ранят; летунов можно сбить выстрелом или прыжком сверху.']],
 ['Убеги от пресса.',['Сверху опускается пресс.','Беги к дыре в полу и прыгай вниз, этаж за этажом.','Болт: способность на земле — смэш.']],
 ['Перебирайся по ездящим змеям.',['Запрыгивай на змею и катайся.','Спрыгивай на следующую опору.','Внизу шипы.']],
 ['Гонка по воде.',['Водовороты и рыб-роботов перепрыгивай.','Под балками пригибайся (способность).']],
 ['Победи пять волн врагов.',['Болт: способность на земле — смэш, враги отлетают в стены.','Искра: рывок обжигает врагов.','Когда врагов не останется, откроется выход.']],
 ['Долети на ракете до финиша.',['Прыжок — вверх, способность — вниз.','Шестерёнки — топливо. Без него ракета падает.']],
 ['Проскользи по трубе.',['Прыжок — вверх, способность — вниз.','В заслонках гуляет зелёное окошко — пролетай только через него.']],
 ['Поднимись на лифте вверх.',['Платформа едет вверх сама.','Низкие пилы перепрыгивай, под высокими не прыгай.','От красных шипов отходи.','Болт: способность сбивает пилы.']],
 ['Победи босса — Кузнеца.',['Три фазы: топот (волны по полу — перепрыгни), ракеты (уходи с красных полос), ярость (ещё и пилы).','Болт бьёт смэшем вблизи.','Искра стреляет и жжёт рывком.']],
 ['Попадай в такт.',['Пульс внизу — удар.','Жёлтая стрелка — прыжок, красная — пригнись, ящик-мишень — стреляй.']],
 ['Дойди до финиша по потолку и полу.',['Способность переворачивает гравитацию.','Шипы на полу — иди по потолку, на потолке — по полу.','В стенах щель сверху или снизу.']],
 ['Перебрасывайте друг друга через препятствия.',['Способность рядом с напарником — взять его на плечи, ещё раз — бросить вперёд.','Брось друга на кнопку — появится мост или лифт.','Время общее; за каждый участок +20 секунд.']],
 ['Сбей Механика до финиша.',['Стреляй в Механика на доске.','Его мины перепрыгивай.']],
 ['Прокатись по волнам.',['Прыжок — через красные буи и скалы.','Способность — пригнуться под медуз.','Бирюзовая волна — трамплин: по желанию, наверху висят шестерёнки.']],
 ['Убеги от шара по проводам.',['Три провода: прыжок — на провод выше, способность — на провод ниже.','Искры на проводе обходи: врежешься — замедлишься.','Догонит шар — минус сердце и назад к флажку.']],
 ['Найди выход из лабиринта.',['Встаньте на три красные плиты — откроется выход.','Лифты возят между этажами.','Охотник-шар кусается: оглуши его выстрелом, смэшем Болта или рывком Искры.']],
 ['Пробеги по льду.',['Лёд скользкий: тормозишь не сразу.','Прыжок — через шипы и ямы; широкие ямы — на плывущей льдине.','Сзади сходит лавина — не отставай.']],
 ['Пройди между вращающимися лопастями.',['Жди, пока лопасть пройдёт, и беги.','Лопасть можно перепрыгнуть.','Флажки сохраняют место.']]
 ['Пробейся через двор.',['Ходи в глубину: W/S (↑/↓) — вверх-вниз по двору.','Удар — E (Болт: «/»), прыжок — Q (Болт: «.»). В прыжке удар — удар ногой.','Тройной удар подряд — комбо сильнее. Метательные ключи облетай по глубине.','Победи все волны и иди вправо к выходу.']],
];
const SEEN_KEY='iskra-bolt-bt-seen';
const seenIntro=()=>store.get(SEEN_KEY,{});
function btIntroHtml(t,idx){
  const D=DEFS[t], I=INTRO[t]; if(!I) return '';
  const kk=h=>binds[h].kb, kj=h=>kbd(kk(h).jump), ka=h=>kbd(kk(h).ability);
  const ctl=solo?`${kj(soloHero)} прыжок · ${ka(soloHero)} способность`:`<b style="color:#ff8a3d">Искра</b>: ${kj('spark')} прыжок · ${ka('spark')} способность &nbsp;·&nbsp; <b style="color:#62c7c1">Болт</b>: ${kj('bolt')} прыжок · ${ka('bolt')} способность`;
  return `<div class="card"><span class="eyebrow">Новое испытание · ${D.name}</span><h2>${I[0]}</h2>
    <ul style="text-align:left;max-width:56ch;margin:6px auto 12px;line-height:1.5;padding-left:20px">${I[1].map(x=>`<li>${x}</li>`).join('')}</ul>
    <p class="padst" style="margin:0 0 12px">${ctl}</p>
    <div class="btns"><button class="primary" id="btGo" type="button">Играть · Enter</button></div></div>`;
}
const DORDER=['easy','normal','hard','nightmare'];
const _setState=setState;
setState=function(s){
  if(CAMPAIGN&&s==='play'&&state==='loading'&&S.on&&settings.hints!==false&&!edTest){
    const e=CAMP[levelIdx], sn=seenIntro();
    if(e&&e.k==='t'&&INTRO[e.t]&&!sn[e.t]){
      _setState('btintro'); overlay.innerHTML=btIntroHtml(e.t,levelIdx);
      $('btGo').onclick=()=>{ const q=seenIntro(); q[e.t]=1; store.set(SEEN_KEY,q); sfx('pick'); setState('play'); };
      setTimeout(()=>{ try{ $('btGo').focus(); }catch(er){} },0); return; } }
  if(CAMPAIGN){ _setState(s);
    return; }
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
        <button class="secondary" id="btLook" type="button">Внешний вид<small>цвет, шапка, след</small></button>
        <button class="secondary" id="btHelp" type="button">Как играть<small>управление в испытаниях</small></button>
        <button class="secondary" id="bSet" type="button">Настройки<small>звук, графика, управление</small></button>
      </div></div>`;
    overlay.querySelectorAll('[data-bt]').forEach(b=>b.onclick=()=>startBt(+b.dataset.bt));
    $('btMode').onclick=()=>{ modesBack='menu'; setState('modes'); };
    $('btDiff').onclick=()=>{ const k=DORDER[(DORDER.indexOf(diffId())+1)%DORDER.length]; run.diff=k; saveRun(); sfx('nav'); setState('menu'); setTimeout(()=>{ try{ $('btDiff').focus(); }catch(e){} },0); };
    $('btLook').onclick=()=>setState('custom');
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
      <p><b style="color:#c79bff">Лифт-шахта.</b> Платформа едет вверх, из стен вылетают пилы и шипы. Низкие пилы перепрыгивай, под высокими не прыгай, от красных шипов отходи. Болт: способность сбивает пилы.</p>
      <p><b style="color:#ff8a7a">Кузнец.</b> Босс-робот в три фазы: топот (волны по полу — перепрыгни), ракеты (уходи с красных полос), ярость (ещё и пилы). Болт бьёт смэшем вблизи, Искра стреляет и жжёт рывком.</p>
      <p><b style="color:#ffb347">Эстафета.</b> Способность рядом с напарником — взять его на плечи, ещё раз — бросить вперёд (на экране точки показывают полёт). Бросьте друга через пропасть или на стену: он нажмёт кнопку, и появится мост или лифт. Время общее, за каждый участок +20 секунд.</p>
      <p><b style="color:#7fe0d0">Магнит.</b> Способность переворачивает гравитацию: бегаешь по потолку и полу. Шипы на полу — по потолку, на потолке — по полу; в стенах щель сверху или снизу.</p>
      <p><b style="color:#c79bff">Ритм.</b> Гонка по бит: пульс внизу — удар. Жёлтая стрелка — прыжок, красная — пригнись, ящик-мишень — стреляй. Всё в такт!</p>
      <p><b style="color:#7fe0ff">Серфинг.</b> Доска по волнам. Прыжок — через красные буи-мины и скалы, способность — пригнуться под медуз. На бирюзовой волне-трамплине можно прыгнуть особенно высоко — в воздухе висят шестерёнки. Это по желанию: волну можно и просто проехать.</p>
      <p><b style="color:#9cc3ff">Колесо на проводе.</b> Едешь по одному из трёх проводов, сзади гонится электрошар. <b>Прыжок</b> — на провод выше, <b>способность</b> — на провод ниже. Искры на проводе обходи: врежешься — замедлишься, и шар нагонит. Если догонит — минус сердце и назад к флажку.</p>
      <p><b style="color:#c79bff">Лабиринт.</b> Три этажа и два лифта. Встаньте на три красные плиты-рычага — откроется выход. Охотник-шар летит сквозь стены и кусается; оглушите его выстрелом, смэшем Болта или рывком Искры, чтобы выиграть время.</p>
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
  if(s==='gameover'&&S.cp&&!document.getElementById('btFromStart')){ const g=document.getElementById('bGoMenu'); if(g){ g.insertAdjacentHTML('beforebegin','<button class="secondary" id="btFromStart" type="button">С самого начала</button>'); document.getElementById('btFromStart').onclick=()=>{ window.BT_RESET(); go=null; loadingTo(levelIdx,true); }; } }
  if(s==='done'){ const bx=overlay.querySelector('.btns'); if(bx&&!document.getElementById('btToMenu')){ bx.insertAdjacentHTML('beforeend','<button class="secondary" id="btToMenu" type="button">К испытаниям</button>'); $('btToMenu').onclick=()=>setState('menu'); }
    const eb=overlay.querySelector('.eyebrow'); if(eb) eb.textContent='Испытание '+(levelIdx+1)+' из '+TOTAL+' пройдено'; const nb=$('bNext'); if(nb) nb.firstChild.textContent='Следующее испытание · Enter'; }
  if(s==='loading'&&loadJob){ const ebs=overlay.querySelectorAll('.eyebrow'); if(ebs[0]) ebs[0].textContent='Испытание '+(loadJob.i+1)+' из '+TOTAL; if(ebs[1]) ebs[1].textContent=DIFFS[diffId()].n+' · '+modeName();
    const L=getLevel(loadJob.i); overlay.querySelectorAll('p').forEach(p=>{ if(p.textContent&&p.textContent.length>40) p.textContent=L.hint; }); }
};
const _handleMeta=handleMeta;
handleMeta=function(){ if((state==='bthelp'||state==='btend')&&pressed.has('Escape')){ setState('menu'); return; } return _handleMeta(); };

return {S,LEVELS,DEFS,CAMP,setDuck,crash};
})();
/* ===== /ИСПЫТАНИЯ ===== */
