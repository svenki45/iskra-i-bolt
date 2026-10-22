/* ================= procedural levels ================= */
function rng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function blank(){
  const g=[...Array(ROWS)].map(()=>Array(COLS).fill('.'));
  for(let x=0;x<COLS;x++){ g[0][x]='#'; g[ROWS-1][x]='#'; }
  for(let y=0;y<ROWS;y++){ g[y][0]='#'; g[y][COLS-1]='#'; }
  return g;
}
const NAMES=['Ржавый цех','Тихая мастерская','Склад шестерёнок','Паровой коридор','Литейная','Сборочный конвейер','Чертёжная','Котельная','Цех пружин','Медный тоннель','Масляный подвал','Кладовая болтов','Сварочный пост','Токарный зал','Пыльный чердак','Насосная','Узел клапанов','Отдел заклёпок','Ламповая','Часовой механизм','Цех молотов','Трубный лабиринт','Электрощитовая','Испытательный стенд','Ночная смена','Цех напильников','Сушильня','Генераторная','Бойлерная','Чулан мастера','Кузня','Шлифовальная','Склад пружин','Отдел шурупов','Паровая будка'];
const COOP_ORDER=[['A',1],['B',2],['C',3],['D',3],['E',6],['F',7],['M',8],['L',11],['N',13],['ice',16],['portal',18],['crumble',21],['wind',23]];
const SPARK_ORDER=[['gap',1],['spikes',2],['climb',3],['ledge',4],['timer',5],['foes',6],['mover',7],['lift',9],['pmover',12],['ice',16],['portal',18],['crumble',21],['wind',23]];
const BOLT_ORDER=[['hop',1],['crate',2],['wall',3],['slam',4],['timer',5],['foes',6],['mover',7],['lift',9],['pmover',12],['ice',16],['portal',18],['crumble',21],['wind',23]];
const NEW_INFO={ice:'Лёд: на нём скользко, тормозите заранее.',portal:'Портал: войдите — выйдете с другой стороны стены.',crumble:'Ломкий мост: рассыпается под ногами, не стойте на месте!',wind:'Ветер из вентиляции поднимает вверх: долетите до уступа.',E:'Встаньте на кнопку — над шипами появится мост.',F:'Враги! Стреляйте или прыгайте сверху.',M:'Платформа летает над шипами: ловите момент для прыжка.',L:'Лифт сам ездит вверх-вниз: поднимитесь на уступ.',N:'Платформа едет, только пока напарник держит кнопку.',
  gap:'Узкую щель проходит только Искра.',spikes:'Шипы: перепрыгните или пролетите рывком.',climb:'Поднимайтесь по платформам.',ledge:'Кнопка на уступе открывает дверь.',timer:'Дверь с кнопкой открыта лишь несколько секунд — бегите!',foes:'Враги! Стреляйте или прыгайте сверху.',
  mover:'Платформа летает над шипами: ловите момент.',lift:'Лифт — единственный путь через стену.',pmover:'Кнопка запускает платформу на несколько секунд.',hop:'Перепрыгивайте препятствия.',crate:'Толкайте ящик на кнопку.',wall:'Треснувшую стену ломают выстрелы.',slam:'Удар сверху проламывает пол.'};
// curriculum: the newest mechanic dominates its debut level, recent ones appear more often, nothing appears before its debut
// more enemies the further you go
function addCrowd(g,enemies,n,R){
  const extra=Math.min(7,Math.floor(Math.max(0,n-6)/8)); let tries=0, added=0;
  while(added<extra&&tries<60){ tries++; const i=Math.floor(R()*3), c0=4+i*8, x=c0+1+Math.floor(R()*6);
    if(R()<.6){ if(g[16][x]==='.'&&g[15][x]==='.'&&g[17][x]==='#'&&!enemies.some(e=>Math.abs(e.tx-x)<2&&e.ty===16)){ enemies.push({type:'crawler',tx:x,ty:16,min:c0*T,max:(c0+7)*T}); added++; } }
    else { const y=6+Math.floor(R()*4); if(g[y][x]==='.'&&g[y+1][x]==='.'){ enemies.push({type:'flyer',tx:x,ty:y,min:c0*T,max:(c0+7)*T}); added++; } } }
}
function pickChunks(ORDER,n,R){
  const known=ORDER.filter(o=>o[1]<=n), debut=ORDER.find(o=>o[1]===n);
  const w=known.map((o,k)=>[o[0],1+(k>=known.length-3?2:0)+(n-o[1]<6?1:0)]);
  const pickW=()=>{ let tot=w.reduce((a,b)=>a+b[1],0), r=R()*tot; for(const [k,v] of w){ if((r-=v)<0) return k; } return w[0][0]; };
  const out=[];
  for(let i=0;i<3;i++){ let t,g=0; do{ t=pickW(); g++; } while(g<40&&((out.includes(t)&&R()<0.8)||((t==='F'||t==='foes')&&(out.includes('F')||out.includes('foes'))))); out.push(t); }
  if(debut){ out[0]=debut[0]; out[2]=debut[0]; if(out[1]===debut[0]) out[1]=known[Math.floor(R()*Math.max(1,known.length-1))][0]; }
  if(out.every(t=>t==='F')) out[1]=known[0][0];
  return out;
}
const MECH_LABEL={ice:'ледяной пол',portal:'портал сквозь стену',crumble:'ломкий мост',wind:'восходящий ветер'};
const CHUNK_LABEL={...MECH_LABEL,A:'дверь с двумя кнопками',B:'подброс на уступ',C:'ящик на кнопку',D:'узкая щель',E:'мост над шипами',F:'враги',M:'летающая платформа над шипами',N:'платформа от кнопки напарника',L:'лифт на уступ'};
const PICK_TABLE=[['heart',22],['shield',14],['triple',14],['rapid',14],['power',12],['gear',24]];
function mechChunk(t,c0,set,R,n,winds,pickups,enemies){
  const gx=c0+7, min=c0*T, max=(c0+8)*T;
  if(t==='ice'){ for(let x=c0;x<=c0+6;x++) set(x,17,'I'); set(c0+4,16,'^'); if(n>30) set(c0+2,16,'^'); for(let y=1;y<=9;y++) set(gx,y,'#'); if(R()<.6) pickups.push({type:'gear',tx:c0+4,ty:13}); return true; }
  if(t==='portal'){ for(let y=1;y<=16;y++) set(gx,y,'#'); set(c0+3,16,'O'); set(gx+1,16,'o'); if(n>25&&R()<.6) enemies.push({type:'crawler',tx:c0+5,ty:16,min,max:gx*T}); pickups.push({type:'gear',tx:c0+3,ty:13}); return true; }
  if(t==='crumble'){ for(let x=c0+1;x<=c0+6;x++){ set(x,16,'^'); set(x,15,'K'); } for(let y=1;y<=9;y++) set(gx,y,'#'); if(R()<.7) pickups.push({type:'gear',tx:c0+4,ty:13}); return true; }
  if(t==='wind'){ for(let x=c0+4;x<=gx;x++) set(x,8,'#'); for(let y=9;y<=16;y++) set(gx,y,'#'); winds.push({x:(c0+1)*T,y:3*T,w:3*T,h:14*T}); if(n>28) for(let x=c0+4;x<=c0+6;x++) set(x,16,'^'); pickups.push({type:'gear',tx:c0+2,ty:4}); return true; }
  return false;
}
function genLevel(n){
  const R=rng(n*7919+13), pick=a=>a[Math.floor(R()*a.length)], tier=Math.floor(n/10);
  const g=blank(), set=(x,y,c)=>{ g[y][x]=c; };
  const enemies=[], pickups=[], movers=[], winds=[], msp=70+Math.min(60,n*1.2);
  const weighted=()=>{ let tot=PICK_TABLE.reduce((s,a)=>s+a[1],0), r=R()*tot; for(const [k,w] of PICK_TABLE){ if((r-=w)<0) return k; } return 'gear'; };
  const chunks=pickChunks(COOP_ORDER,n,R);
  set(1,16,'1'); set(2,16,'2');
  const keys=['P','Q','R'], bridgeCh={P:'U',Q:'V',R:'W'};
  const gateDoor=(gx,K)=>{ for(let y=1;y<=13;y++) set(gx,y,'#'); for(let y=14;y<=16;y++) set(gx,y,K); };
  const gateGap=(gx,K)=>{ for(let y=1;y<=12;y++) set(gx,y,'#'); for(let y=13;y<=15;y++) set(gx,y,K); };
  const pillar=gx=>{ for(let y=1;y<=9;y++) set(gx,y,'#'); };
  chunks.forEach((t,i)=>{
    const c0=4+i*8, gx=c0+7, K=keys[i], k=K.toLowerCase(), next=c0+8;
    if(mechChunk(t,c0,set,R,n,winds,pickups,enemies)){}
    else if(t==='A'){
      const px=c0+3+Math.floor(R()*3);
      if(n>12&&R()<0.4){ set(px,16,'#'); set(px,15,k); } else set(px,16,k);
      if(n>9&&R()<0.55) set(c0+2,16,'^');
      gateDoor(gx,K); set(next,16,k);
    } else if(t==='B'){
      for(let x=c0+4;x<=c0+6;x++) set(x,8,'#');
      set(c0+5,7,k); gateDoor(gx,K); set(next,16,k);
      if(R()<0.7) pickups.push({type:'gear',tx:c0+4,ty:7});
    } else if(t==='C'){
      set(c0+2,16,'C'); set(c0+6,16,k); gateDoor(gx,K);
      if(n>14&&R()<0.4) for(let x=c0+3;x<=c0+5;x++) set(x,11,'#');
    } else if(t==='D'){
      gateGap(gx,K); set(next,16,k);
      if(n>10&&R()<0.5) set(c0+3,16,'^');
      if(R()<0.6){ for(let x=c0+2;x<=c0+4;x++) set(x,13,'#'); pickups.push({type:'gear',tx:c0+3,ty:12}); }
    } else if(t==='E'){
      for(let x=c0+1;x<=c0+5;x++){ set(x,16,'^'); set(x,15,bridgeCh[K]); }
      set(c0+6,16,k); pillar(gx);
    } else if(t==='M'){
      for(let x=c0+1;x<=c0+6;x++) set(x,16,'^');
      movers.push({ax:c0+1,ay:15,bx:c0+4,by:15-(n>20&&R()<.5?3:0),w:3,sp:msp});
      if(n>18&&R()<.5) enemies.push({type:'flyer',tx:c0+4,ty:10,min:c0*T,max:(c0+8)*T});
      pillar(gx);
    } else if(t==='N'){
      set(c0+1,16,k); for(let x=c0+2;x<=c0+6;x++) set(x,16,'^');
      movers.push({ax:c0+2,ay:15,bx:c0+5,by:15,w:2,sp:msp*.9,key:K});
      pillar(gx); set(c0+7,16,k);
    } else if(t==='L'){
      for(let x=c0+3;x<=c0+6;x++) set(x,8,'#');
      movers.push({ax:c0+1,ay:15,bx:c0+1,by:8,w:2,sp:msp*.8,pause:.6});
      set(c0+5,7,k); gateDoor(gx,K); set(next,16,k);
      if(n>15) set(c0+3,16,'^');
    } else if(t==='F'){
      const min=c0*T, max=(c0+8)*T;
      const xPillar=R()<0.5;
      if(xPillar) for(let y=13;y<=16;y++) set(c0+4,y,'x');
      const cnt=Math.min(3,1+Math.floor(tier/2)+(R()<0.5?1:0));
      const spots=xPillar?[c0+2,c0+6,c0+5]:[c0+2,c0+4,c0+6];
      for(let j=0;j<cnt;j++){ const sx=spots[j]; const lo=xPillar?(sx<c0+4?c0*T:(c0+5)*T):min, hi=xPillar?(sx<c0+4?(c0+4)*T:max):max; enemies.push({type:'crawler',tx:sx,ty:16,min:lo,max:hi}); }
      if(n>=20&&R()<0.65) enemies.push({type:'flyer',tx:c0+3,ty:10,min,max});
      if(n>=35&&R()<0.5) enemies.push({type:'turret',tx:c0+6,ty:16});
      pillar(gx);
    }
  });
  // late-game spice: extra hazards on simple rooms so later levels need more care
  chunks.forEach((t,i)=>{ const c0=4+i*8;
    if(n>=22&&['A','B','D'].includes(t)&&R()<Math.min(.75,(n-15)/60)&&g[16][c0+1]==='.'&&g[16][c0]!=='^') set(c0+1,16,'^');
    if(n>=30&&['A','C','D','E'].includes(t)&&R()<Math.min(.5,(n-25)/80)) enemies.push({type:'flyer',tx:c0+3,ty:9,min:c0*T,max:(c0+8)*T});
  });
  addCrowd(g,enemies,n,R);
  // floating gears over chunk floors (reachable by a jump)
  const gearCount=2+Math.floor(R()*3);
  for(let j=0;j<gearCount;j++){
    const x=4+Math.floor(R()*24);
    if(g[13][x]==='.'&&g[12][x]==='.'&&g[14][x]==='.') pickups.push({type:'gear',tx:x,ty:13});
  }
  addSecrets(g,pickups,enemies,R,n,weighted);
  set(28,16,g[16][28]==='.'?'.':g[16][28]);
  for(let y=15;y<=16;y++) for(let x=29;x<=30;x++) set(x,y,'E');
  const uniq=[...new Set(chunks)].map(c=>CHUNK_LABEL[c]);
  const deb=COOP_ORDER.find(o=>o[1]===n);
  return {newMech:deb?[CHUNK_LABEL[deb[0]],NEW_INFO[deb[0]]]:null, name:NAMES[(n*13+3)%NAMES.length], hint:(deb?'Новое: '+NEW_INFO[deb[0]]+' ':'')+'На уровне: '+uniq.join(', ')+'.', map:g.map(r=>r.join('')), enemies, pickups, movers, winds, tier};
}
const BOSS_TYPES=['toad','eye','gear','queen'];
const BOSS_NAMES={toad:'Пресс-Жаба',eye:'Око-Сварщик',gear:'Бешеная Шестерня',queen:'Королева Жуков',core:'Главный Механизм'};
const BOSS_EPITHET={toad:'Гроза литейного цеха',eye:'Надзиратель сварочного поста',gear:'Сорвавшаяся с оси',queen:'Владычица подвала',core:'Сердце мастерской'};
const BOSS_HINT={toad:'Прыгает и пускает волны по полу: перепрыгивайте их.',eye:'Летает под потолком и стреляет очередями. Держитесь порознь.',gear:'Скачет по арене и зовёт жуков. Не стойте на пути.',queen:'Таранит с разбега: когда мигает, уходите с линии.',core:'Финальный босс: всё сразу. Удачи вам двоим.'};
const ARENAS={
  toad:{name:'Литейный цех',paper:'#1b130d',wall:'#120904',hatch:'rgba(255,150,80,.15)',edge:'rgba(255,190,140,.85)',grid:'255,170,120',mote:'#ffb070',rule:'Не наступайте в расплавленный металл: он обжигает и подбрасывает.'},
  eye:{name:'Сварочный пост',paper:'#17140c',wall:'#0e0b05',hatch:'rgba(255,205,120,.13)',edge:'rgba(255,225,170,.8)',grid:'255,215,150',mote:'#ffd28a',rule:'Где на потолке мигает красная метка, оттуда посыплются раскалённые искры.'},
  gear:{name:'Часовая башня',paper:'#15120a',wall:'#0c0a04',hatch:'rgba(224,168,74,.16)',edge:'rgba(240,205,130,.85)',grid:'235,200,130',mote:'#e8c27a',rule:'Конвейеры на полу тянут к центру арены, прямо под Шестерню.'},
  queen:{name:'Улей Королевы',paper:'#1a0c17',wall:'#10050d',hatch:'rgba(214,90,138,.16)',edge:'rgba(255,175,205,.8)',grid:'255,160,200',mote:'#ffcf5a',rule:'Липкий мёд на полу сильно замедляет и мешает прыгать.'},
  core:{name:'Сердце мастерской',paper:'#190608',wall:'#0e0304',hatch:'rgba(255,77,94,.17)',edge:'rgba(255,150,160,.85)',grid:'255,120,130',mote:'#ff8a95',rule:'Пол по очереди бьёт током то слева, то справа. Прячьтесь в центре или на платформах.'}
};
function genBoss(n){
  const tier=n/10, type=n===TOTAL?'core':BOSS_TYPES[(tier-1)%4];
  const g=blank(), set=(x,y,c)=>{ g[y][x]=c; }, row=(y,x0,x1,c)=>{ for(let x=x0;x<=x1;x++) set(x,y,c); };
  if(type==='toad'){
    row(16,9,10,'L'); row(16,21,22,'L');
    row(15,4,6,'#'); row(15,25,27,'#'); row(12,13,18,'#');
    row(16,15,16,'#');
  } else if(type==='eye'){
    row(15,5,8,'#'); row(15,23,26,'#'); row(13,10,13,'#'); row(13,18,21,'#');
    row(11,5,8,'#'); row(11,23,26,'#'); row(9,13,18,'#');
  } else if(type==='gear'){
    row(17,4,14,'Z'); row(17,17,27,'Y');
    row(15,7,9,'#'); row(15,22,24,'#'); row(12,14,17,'#');
    for(let y=1;y<=4;y++){ set(1,y,'#'); set(30,y,'#'); }
  } else if(type==='queen'){
    row(16,10,12,'H'); row(16,19,21,'H');
    row(15,6,8,'#'); row(15,23,25,'#'); row(12,13,18,'#');
    row(1,4,27,'#'); for(const x of [6,12,19,25]) set(x,2,'#');
  } else {
    row(15,4,6,'#'); row(15,25,27,'#'); row(13,9,11,'#'); row(13,20,22,'#'); row(11,14,17,'#');
    set(14,16,'#'); set(17,16,'#');
  }
  // second lap (bosses 5–9): mirror the middle of the arena for a fresh layout
  if(tier>4&&type!=='core') for(let y=1;y<ROWS;y++){ const seg=g[y].slice(4,28).reverse().map(c=>c==='Z'?'Y':c==='Y'?'Z':c); for(let i=0;i<24;i++) g[y][4+i]=seg[i]; }
  { const vv=bossVer(type,tier); if(vv>=2){ const spots=vv>=3?[[7,8],[23,24],[12,12],[19,19]]:[[7,8],[23,24]];
      for(const [a,b2] of spots) for(let x=a;x<=b2;x++) if(g[16][x]==='.'&&g[17][x]==='#') set(x,16,'^'); } }
  set(2,16,'1'); set(3,16,'2');
  for(let y=15;y<=16;y++) for(let x=29;x<=30;x++) set(x,y,'E');
  const A=ARENAS[type];
  const v=bossVer(type,tier);
  return {name:BOSS_NAMES[type]+MK[v], arena:type, hint:`Босс!${v>1?' Доработанная версия: '+CHANGELOG[type][v].map(s=>s.slice(2)).join(', ')+'.':''} Арена «${A.name}». ${A.rule} ${BOSS_HINT[type]}`, map:g.map(r=>r.join('')), enemies:[], pickups:[], boss:type, tier};
}
const SOLO_LABEL={...MECH_LABEL,mover:'летающая платформа над шипами',lift:'лифт через стену',pmover:'платформа с таймером',gap:'узкая щель',spikes:'шипы',ledge:'уступ с кнопкой',climb:'подъём по платформам',foes:'враги',timer:'дверь с таймером',crate:'ящик на кнопку',slam:'пролом в подвал',wall:'треснувшая стена',hop:'короткие шипы'};
function genSolo(n,hero){
  const R=rng(n*4813+(hero==='spark'?7:91)), tier=Math.floor(n/10);
  const g=blank(), set=(x,y,c)=>{ g[y][x]=c; };
  const enemies=[], pickups=[], movers=[], winds=[], msp=70+Math.min(60,n*1.2);
  const weighted=()=>{ let tot=PICK_TABLE.reduce((s,a)=>s+a[1],0), r=R()*tot; for(const [k,w] of PICK_TABLE){ if((r-=w)<0) return k; } return 'gear'; };
  const pool0=hero==='spark'?['gap','spikes','ledge','climb','foes','timer','gap','spikes','ledge','climb']:['crate','slam','wall','hop','foes','timer','crate','slam','wall','hop'];
  const easy=n<=3, chunks=pickChunks(hero==='spark'?SPARK_ORDER:BOLT_ORDER,n,R);
  set(2,16,'1');
  const keys=['P','Q','R'];
  const door=(gx,K)=>{ for(let y=1;y<=13;y++) set(gx,y,'#'); for(let y=14;y<=16;y++) set(gx,y,K); };
  const pillar=gx=>{ for(let y=1;y<=9;y++) set(gx,y,'#'); };
  chunks.forEach((t,i)=>{
    const c0=4+i*8, gx=c0+7, K=keys[i], k=K.toLowerCase(), min=c0*T, max=(c0+8)*T;
    if(mechChunk(t,c0,set,R,n,winds,pickups,enemies)){}
    else if(t==='gap'){ for(let y=1;y<=15;y++) set(gx,y,'#'); if(!easy&&R()<.5) set(c0+3,16,'^'); if(R()<.6){ for(let x=c0+2;x<=c0+4;x++) set(x,13,'#'); pickups.push({type:'gear',tx:c0+3,ty:12}); } }
    else if(t==='spikes'){ const w=easy?3:Math.min(5,3+Math.floor(n/8)); for(let x=c0+1;x<c0+1+w;x++) set(x,16,'^'); pillar(gx); if(R()<.5) pickups.push({type:'gear',tx:c0+3,ty:12}); }
    else if(t==='ledge'){ for(let x=c0+3;x<=c0+6;x++) set(x,11,'#'); set(c0+5,10,k); door(gx,K); if(R()<.7) pickups.push({type:'gear',tx:c0+4,ty:10}); set(c0+1,14,'#'); }
    else if(t==='climb'){ set(c0+1,14,'#'); set(c0+2,14,'#'); set(c0+3,12,'#'); set(c0+4,12,'#'); set(c0+5,10,'#'); set(c0+6,10,'#'); for(let y=10;y<=16;y++) set(gx,y,'#'); if(!easy) for(let x=c0+3;x<=c0+6;x++) set(x,16,'^'); pickups.push({type:'gear',tx:c0+6,ty:9}); }
    else if(t==='timer'){ set(c0+(hero==='bolt'?2:3),16,k); door(gx,K); if(!easy&&hero==='spark') set(c0+5,16,'^'); if(!easy&&hero==='bolt') set(c0+5,16,'#'); }
    else if(t==='crate'){ set(c0+2,16,'C'); set(c0+6,16,k); door(gx,K); }
    else if(t==='slam'){ set(c0+1,15,'#'); set(c0+1,16,'#'); for(let x=c0+2;x<=c0+6;x++) set(x,14,'#'); set(c0+3,14,'x'); set(c0+4,14,'x'); for(let y=1;y<=14;y++) set(gx,y,'#'); pickups.push({type:'gear',tx:c0+5,ty:15}); }
    else if(t==='wall'){ for(let y=12;y<=16;y++) set(c0+4,y,'x'); pillar(gx); if(R()<.5) enemies.push({type:'crawler',tx:c0+6,ty:16,min:(c0+5)*T,max}); }
    else if(t==='mover'){ for(let x=c0+1;x<=c0+6;x++) set(x,16,'^'); movers.push({ax:c0+1,ay:15,bx:c0+4,by:15-(n>20&&R()<.5?3:0),w:3,sp:msp}); pillar(gx); if(n>15&&R()<.5) enemies.push({type:'flyer',tx:c0+4,ty:10,min,max}); }
    else if(t==='lift'){ for(let y=8;y<=16;y++) set(gx,y,'#'); set(c0+6,8,'#'); movers.push({ax:c0+4,ay:15,bx:c0+4,by:8,w:2,sp:msp*.8,pause:.6}); if(n>12) set(c0+2,16,'^'); }
    else if(t==='pmover'){ set(c0+1,16,k); for(let x=c0+2;x<=c0+6;x++) set(x,16,'^'); movers.push({ax:c0+2,ay:15,bx:c0+5,by:15,w:2,sp:msp*1.1,key:K}); pillar(gx); }
    else if(t==='hop'){ set(c0+2,16,'^'); set(c0+3,16,'^'); if(!easy) set(c0+5,16,'#'); pillar(gx); }
    else if(t==='foes'){ const cnt=Math.min(3,1+Math.floor(tier/2)+(R()<.5?1:0)); [c0+2,c0+4,c0+6].slice(0,cnt).forEach(sx=>enemies.push({type:'crawler',tx:sx,ty:16,min,max})); if(n>=20&&R()<.6) enemies.push({type:'flyer',tx:c0+3,ty:10,min,max}); if(n>=35&&R()<.5) enemies.push({type:'turret',tx:c0+6,ty:16}); pillar(gx); }
  });
  addCrowd(g,enemies,n,R);
  chunks.forEach((t,i)=>{ const c0=4+i*8;
    if(n>=22&&['ledge','timer','crate','hop'].includes(t)&&R()<Math.min(.7,(n-15)/60)&&g[16][c0+1]==='.') set(c0+1,16,'^');
    if(n>=30&&['gap','ledge','crate','wall'].includes(t)&&R()<Math.min(.5,(n-25)/80)) enemies.push({type:'flyer',tx:c0+3,ty:9,min:c0*T,max:(c0+8)*T});
  });
  const gc=2+Math.floor(R()*3);
  for(let j=0;j<gc;j++){ const x=4+Math.floor(R()*24); if(g[13][x]==='.'&&g[12][x]==='.'&&g[14][x]==='.') pickups.push({type:'gear',tx:x,ty:13}); }
  addSecrets(g,pickups,enemies,R,n,weighted);
  for(let y=15;y<=16;y++) for(let x=29;x<=30;x++) set(x,y,'E');
  const uniq=[...new Set(chunks)].map(c=>SOLO_LABEL[c]);
  const intro=n===1?(hero==='spark'?'Искра одна: прыжок в воздухе ещё раз, рывок вперёд, в узкие щели пролезает только она. ':'Болт один: толкает ящики, удар сверху в прыжке ломает треснувший пол, гайки бьют сильно. '):'';
  const deb=(hero==='spark'?SPARK_ORDER:BOLT_ORDER).find(o=>o[1]===n);
  return {newMech:deb?[SOLO_LABEL[deb[0]],NEW_INFO[deb[0]]]:null, name:NAMES[(n*11+(hero==='spark'?1:5))%NAMES.length], hint:(deb?'Новое: '+NEW_INFO[deb[0]]+' ':'')+intro+'На уровне: '+uniq.join(', ')+'. Дверь с кнопкой открывается на несколько секунд.', map:g.map(r=>r.join('')), enemies, pickups, movers, winds, tier};
}
const FIX_SECRET=['triple','heart','rapid','shield','power'];
const RELICS={toad:['Ржавая пружина','Треснувший поршень','Жабья смазка'],eye:['Мутная линза','Сгоревший предохранитель','Тёмный фильтр'],gear:['Сточенный зубец','Песок в подшипник','Погнутая ось'],queen:['Феромон-приманка','Сломанное жало','Тухлое желе'],core:['Схема механизма','Ключ от щитка','Последний болт']};
const RELIC_FX=['−20% здоровья','+25% урона по нему','медленнее на 15%'];
const bossTypeAt=N=>N>=TOTAL?'core':BOSS_TYPES[(N/10-1)%4];
function addSecrets(g,pickups,enemies,R,n,weighted){
  if(n%10<7) return;
  const want=1, cand=[], H=g.length, W=g[0].length;
  const near=(x,y)=>{ for(let yy=y-2;yy<=y+2;yy++) for(let xx=x-2;xx<=x+2;xx++){ const c=g[yy]&&g[yy][xx]; if(c&&'pqrPQRUVWE12Cx'.includes(c)) return true; } return false; };
  for(let y=10;y<=16;y++) for(let x=0;x<W;x++){
    if(g[y][x]!=='#'||near(x,y)||x>=25) continue; // keep clear of the exit area (right side)
    const L=g[y][x-1], Rt=g[y][x+1];
    if(x===0||x===W-1){ if(y>=12&&(g[y][x===0?1:W-2]==='.')) cand.push([x,y,'side']); continue; }
    let air=0; for(let yy=y+1;yy<=16&&g[yy][x]==='.';yy++) air++;
    if(y<=13&&air>=3&&g[y-1][x]==='#'&&L==='.'&&Rt==='.') cand.push([x,y,'hang']);
    else if(y<=14&&g[y+1][x]==='.'&&g[y-1][x]==='.'&&((L==='.'&&Rt==='#'&&g[y][x+2]==='#')||(Rt==='.'&&L==='#'&&g[y][x-2]==='#'))) cand.push([x,y,'plat']);
  }
  const used=[];
  const inner=cand.filter(c=>c[2]!=='side'), side=cand.filter(c=>c[2]==='side');
  while((inner.length||side.length)&&used.length<want){
    const pool=inner.length?inner:side; const [x,y]=pool.splice(Math.floor(R()*pool.length),1)[0];
    if(used.some(u=>Math.abs(u[0]-x)<6)) continue;
    g[y][x]='S'; const k=used.length, d=n%10, bossN=Math.ceil(n/10)*10;
    if(d>=7&&k===0) pickups.push({type:'relic',ri:d-7,bossN,tx:x,ty:y,secret:true});
    else pickups.push({type:FIX_SECRET[(n+k*2)%FIX_SECRET.length],tx:x,ty:y,secret:true});
    used.push([x,y]);
  }
}
const cache={};
const DIFFS={easy:{n:'Лёгкая',d:'Больше сердец, меньше врагов и шипов. Для знакомства и детей.',c:'#7fe08a',lv:-1},normal:{n:'Обычная',d:'Как задумано.',c:'#9cc3ff',lv:0},
  hard:{n:'Сложная',d:'Больше врагов и шипов, платформы быстрее, враги крепче.',c:'#ffb347',lv:1},nightmare:{n:'Кошмар',d:'Одно сердце, толпы врагов, шипы повсюду. Только для мастеров.',c:'#ff4d5e',lv:2}};
const diffId=()=>(typeof run!=='undefined'&&run&&DIFFS[run.diff])?run.diff:'normal';
const diffLv=()=>DIFFS[diffId()].lv+((typeof run!=='undefined'&&run&&run.ng)||0);
const diffKey=()=>diffId()+(run&&run.ng?'+'+run.ng:'');
function harden(L,n){
  const D=diffLv(); if(D===0) return L;
  const R=rng(n*977+D*31), g=L.map.map(r=>r.split('')), out=Object.assign({},L);
  const safe=(x)=>x>4&&x<27;
  if(D<0){ // easy: remove some spikes and enemies
    for(let x=0;x<32;x++) if(g[16][x]==='^'&&R()<.45&&!(g[16][x-1]==='^'&&g[16][x+1]==='^')) g[16][x]='.';
    out.enemies=(L.enemies||[]).filter((e,i)=>i%2===0);
  } else {
    // extra floor spikes on open ground (not next to doors/plates/spawn/exit)
    let want=D*3, tries=0;
    while(want>0&&tries++<80){ const x=5+Math.floor(R()*22); if(!safe(x)) continue;
      const ok=g[16][x]==='.'&&g[17][x]==='#'&&g[15][x]==='.'&&[x-1,x,x+1].every(c=>!'pqrPQRUVWE12COoK'.includes(g[16][c])&&g[15][c]!=='K'&&!'PQR'.includes(g[15][c]));
      if(ok&&!(L.movers||[]).some(m=>Math.abs(m.ax-x)<1)){ g[16][x]='^'; want--; } }
    // extra enemies
    const ens=(L.enemies||[]).slice(); let add=D*2; tries=0;
    while(add>0&&tries++<60){ const x=5+Math.floor(R()*22);
      if(R()<.55){ if(g[16][x]==='.'&&g[15][x]==='.'&&!ens.some(e=>Math.abs(e.tx-x)<2)){ const c0=Math.max(1,x-4); ens.push({type:'crawler',tx:x,ty:16,min:c0*T,max:Math.min(31,x+4)*T}); add--; } }
      else { const y=5+Math.floor(R()*5); if(g[y][x]==='.'){ ens.push({type:'flyer',tx:x,ty:y,min:Math.max(1,x-5)*T,max:Math.min(31,x+5)*T}); add--; } } }
    if(D>=2) for(let x=1;x<30;x++) if(g[16][x]==='o'){ const ex=Math.min(28,x+2); if(g[13][ex]==='.') ens.push({type:'flyer',tx:ex,ty:13,min:x*T,max:Math.min(30,x+5)*T}); }
    out.enemies=ens;
    out.movers=(L.movers||[]).map(m=>Object.assign({},m,{sp:m.sp*(1+.18*D)}));
  }
  out.map=g.map(r=>r.join('')); return out;
}
function getLevel(i){
  const ck=(solo?soloHero+i:i)+'|'+diffKey();
  if(cache[ck]) return cache[ck];
  let L;
  if(solo&&(i+1)%10!==0) L=genSolo(i+1,soloHero);
  else if(i<TUTORIAL.length) L=Object.assign({enemies:[],pickups:[],tier:0},TUTORIAL[i]);
  else L=((i+1)%10===0)?genBoss(i+1):genLevel(i+1);
  if(!L.boss&&i>=TUTORIAL.length) L=harden(L,i+1);
  return cache[ck]=L;
}

