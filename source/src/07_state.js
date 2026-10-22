/* ================= state ================= */
let state='menu', levelIdx=0, deaths=0, gears=0, levelTime=0, totalTime=0, exitHold=0, deathTimer=0, shake=0, clock=0;
let portals=[], crumb={}, winds=[];
let movers=[], curTimer=3.6, darkLvl=false, lamps=[];
const firstDark=()=>solo?12:14;
function isDarkLevel(n){ return n>=firstDark()&&(n===firstDark()||[4,5,6].includes(n%10)); }
const darkCv=document.createElement('canvas');
function updateLamps(){ if(!darkLvl) return;
  for(const l of lamps){ if(l.lit) continue; let hit=players.some(p=>!p.absent&&!p.dead&&Math.hypot(p.x+p.w/2-l.x,p.y+p.h/2-l.y)<46)||bullets.some(b=>Math.hypot(b.x+b.w/2-l.x,b.y+b.h/2-l.y)<26);
    if(hit){ l.lit=1; sfx('pk_shield'); burst(l.x,l.y,18,['#ffe9a8','#fff'],220,.6); rings.push({x:l.x,y:l.y,r:6,max:120,life:.5,c:'#ffd166',w:4}); if(lamps.every(q=>q.lit)){ texts.push({x:VW/2,y:VH*.3,t:'ВСЁ ОСВЕЩЕНО! +200',life:2,c:'#ffd166',big:true}); addScore(200); } } } }
function drawDark(){
  if(!darkLvl) return;
  const DS=.5; if(darkCv.width!==VW*DS){ darkCv.width=VW*DS; darkCv.height=VH*DS; }
  const g=darkCv.getContext('2d'); g.setTransform(DS,0,0,DS,0,0); g.globalCompositeOperation='source-over'; g.clearRect(0,0,VW,VH); g.fillStyle='rgba(2,4,10,.94)'; g.fillRect(0,0,VW,VH);
  g.globalCompositeOperation='destination-out';
  const hole=(x,y,r,a=1)=>{ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(0,0,0,${a})`); gr.addColorStop(.55,`rgba(0,0,0,${a*.85})`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); };
  const fl=Math.sin(clock*9)*6+Math.sin(clock*23)*3;
  for(const p of players){ if(p.absent||p.dead) continue; const cx=p.x+p.w/2, cy=p.y+p.h/2;
    if(p.kind==='spark') hole(cx,cy-6,(p.down?90:210)+fl); else hole(cx+p.face*30,cy-10,solo?150:85,solo?.95:.85); }
  for(const l of lamps) if(l.lit) hole(l.x,l.y+60,190+Math.sin(clock*2+l.x)*6);
  for(const b of bullets) if(b.kind==='spark') hole(b.x+b.w/2,b.y+b.h/2,46,.7);
  if(exitRect) hole(exitRect.x+exitRect.w/2,exitRect.y+exitRect.h/2,46,.6);
  for(const pl of plates) hole(pl.x*T+T/2,pl.y*T+T-6,26,.5);
  g.globalCompositeOperation='source-over';
  ctx.drawImage(darkCv,0,0,VW,VH);
  // glowing eyes of enemies + unlit lamps hint
  for(const en of enemies){ if(en.hp<=0) continue; const ex=en.x+en.w/2, ey=en.y+en.h*(en.big?.3:.45); ctx.fillStyle='rgba(255,90,80,.9)'; ctx.fillRect(ex-6,ey-2,3,3); ctx.fillRect(ex+3,ey-2,3,3); }
  for(const l of lamps){ ctx.save(); ctx.strokeStyle=l.lit?'#ffe9a8':'rgba(255,233,168,.35)'; ctx.fillStyle=l.lit?'#fff3cf':'rgba(255,233,168,'+(.15+.12*Math.sin(clock*3+l.x))+')'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(l.x,l.y-10); ctx.lineTo(l.x,l.y-4); ctx.stroke(); if(l.lit&&GLOW){ ctx.globalAlpha=.45; ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.arc(l.x,l.y+2,13,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; ctx.fillStyle='#fff3cf'; } ctx.beginPath(); ctx.arc(l.x,l.y+2,7,0,Math.PI*2); ctx.fill(); ctx.restore(); }
}
let grid, doors, doorAt, plates, exitRect, exitLocked=false, players, crates, enemies=[], boss=null, bullets=[], ebullets=[], pickups=[], particles=[], texts=[];
let staticGen=0, gridVer=0, tileCache=null;
function tilesOf(){ if(!tileCache||tileCache.v!==gridVer||tileCache.g!==grid){ const m={}; for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const c=grid[y][x]; if(c!=='.'&&c!=='#') (m[c]||(m[c]=[])).push(x,y); } tileCache={v:gridVer,g:grid,m}; } return tileCache.m; }
const INTRO_P=3.3; let arena=null, rings=[], hitstop=0, intro=null, lastIntro=-1, staticLayer=document.createElement('canvas'), wallLayer=document.createElement('canvas'), LIVE=null, staticDirty=true, heartTimer=0, curTier=0, GLOW=1, flashA=0, flashC='#fff', titleT=0, motes=[], bgGears=[], vignetteC=null;
let cheat=false, cheatBuf='', cheatGod=false, cheatOne=false, cheatMenu=false;
try{ cheat=localStorage.getItem('iskra-bolt-cheat')==='1'; const c=JSON.parse(localStorage.getItem('iskra-bolt-cheats')||'{}'); cheatGod=!!c.god; cheatOne=!!c.one; cheatMenu=!!c.menu||cheat; }catch(e){}
const anyCheat=()=>cheat||cheatGod||cheatOne;
function saveCheats(){ try{ localStorage.setItem('iskra-bolt-cheat',cheat?'1':'0'); localStorage.setItem('iskra-bolt-cheats',JSON.stringify({god:cheatGod,one:cheatOne,menu:cheatMenu})); }catch(e){} }
function unlockCheatMenu(){ cheatBuf='';
  if(cheatMenu){ cheatMenu=false; cheat=false; cheatGod=false; cheatOne=false; saveCheats(); sfx('off');
    texts.push({x:VW/2,y:VH/2,t:'МЕНЮ ЧИТОВ СКРЫТО',life:2,c:'#ff6b6b',big:true});
    if(state==='cheats'||state==='menu') setState('menu'); else if(state==='levels') setState('menu'); return; }
  const first=true; cheatMenu=true; saveCheats(); sfx('pick');
  texts.push({x:VW/2,y:VH/2,t:first?'МЕНЮ ЧИТОВ ОТКРЫТО':'ЧИТЫ',life:2,c:'#7fe08a',big:true});
  if(['menu','title'].includes(state)) setState('cheats'); }
let best=0; try{ best=parseInt(localStorage.getItem('iskra-bolt-sheet'+modeSuffix())||'0',10)||0; }catch(e){}
function saveBest(i){ if(demo) return; best=Math.max(best,i); try{ localStorage.setItem('iskra-bolt-sheet'+modeSuffix(),String(best)); }catch(e){} snapSlot(); }

function makePlayer(kind,tx,ty){
  const sp=kind==='spark', w=sp?24:34, h=sp?30:56;
  return {kind,w,h,x:tx*T+(T-w)/2,y:(ty+1)*T-h,vx:0,vy:0,onGround:false,ground:null,wasGround:true,
    coyote:0,jumpBuf:0,airJumps:1,dashesLeft:1,dash:0,face:1,slam:false,boosted:false,cut:false,sx:1,sy:1,inExit:false,blinkT:2+Math.random()*3,
    hp:Math.max(1,3+U('hearts')+(diffId()==='easy'?2:diffId()==='nightmare'?-2:0)),shield:!!U('armor'),secondWind:!!U('secondWind'),inv:0,down:false,reviveT:0,shootCd:0,pw:{triple:0,rapid:0,power:0},bag:[],sel:0,bagPop:0};
}
function makeCrate(tx,ty){ return {kind:'crate',w:38,h:38,x:tx*T+1,y:(ty+1)*T-38,vx:0,vy:0,onGround:false,ground:null}; }
const TRAIT_NAME={split:'делится',jumper:'прыгает',shield:'щит спереди',diver:'пикирует',bomb:'взрывается'};
function rollTrait(type){
  const n=levelIdx+1; if(n<10||Math.random()>Math.min(.8,(n-6)/45)) return null;
  const pool=[]; if(n>=10) pool.push('split'); if(n>=16&&type==='crawler') pool.push('jumper'); if(n>=22&&type==='crawler') pool.push('shield'); if(n>=28&&type==='flyer') pool.push('diver'); if(n>=36) pool.push('bomb');
  return pool.length?pool[Math.floor(Math.random()*pool.length)]:null;
}
function makeEnemy(d,tier){ const e=makeEnemy0(d,tier); if(e.type!=='turret'&&!(boss&&!boss.dead)) e.trait=d.trait!==undefined?d.trait:rollTrait(e.type); return e; }
function makeEnemy0(d,tier){
  if(d.type==='crawler'&&((solo&&soloHero==='bolt')||(!solo&&!(boss&&!boss.dead)&&d.tx%2===1))) return {type:'crawler',big:true,x:d.tx*T+3,y:(d.ty+1)*T-48,w:34,h:48,vx:(Math.random()<.5?-1:1)*(55+tier*6),vy:0,hp:3+Math.floor(tier/3),min:d.min||T,max:d.max||VW-T,flash:0,grounded:false,t:Math.random()*5};
  if(d.type==='crawler') return {type:'crawler',x:d.tx*T+5,y:(d.ty+1)*T-22,w:30,h:22,vx:(Math.random()<.5?-1:1)*(70+tier*7),vy:0,hp:2+Math.floor(tier/3),min:d.min||T,max:d.max||VW-T,flash:0,grounded:false,t:Math.random()*5};
  if(d.type==='flyer') return {type:'flyer',x:d.tx*T+7,y:d.ty*T+10,w:26,h:20,by:d.ty*T+10,t:Math.random()*6,hp:2+Math.floor(tier/4),min:d.min||T,max:d.max||VW-T,flash:0,dir:Math.random()<.5?-1:1,sp:60+tier*5};
  return {type:'turret',x:d.tx*T+6,y:(d.ty+1)*T-28,w:28,h:28,hp:4+Math.floor(tier/3),cd:1.5,flash:0,aim:0};
}
const bossVer=(type,tier)=>type==='core'?1:(tier<=4?1:tier<=8?2:3);
const MK=['','',' Mk II',' Mk III'];
const BOSS_EPI2={toad:['Гроза литейного цеха','Перекована. Без слабых мест','Окончательная версия'],eye:['Надзиратель сварочного поста','Теперь с лазером','—'],gear:['Сорвавшаяся с оси','Заточенные зубья','—'],queen:['Владычица подвала','Двойной таран','—'],core:['Сердце мастерской']};
const CHANGELOG={toad:{2:['+ стальной шлем','+ второй прыжок в воздухе','+ двойные волны по полу','+ камнепад при приземлении','+ шипы на арене'],3:['+ золотая броня','+ огненные плевки','+ самонаводящийся плевок в прыжке','+ ярость с 60% здоровья','+ всё, что было в Mk II']},
  eye:{2:['+ сварочный лазер','+ спиральные залпы','+ пикирующие летуны','+ шипы на арене']},gear:{2:['+ заточенные зубья','+ волна от каждого отскока','+ летящие пилы','+ больше жуков','+ шипы на арене']},
  queen:{2:['+ бронированный панцирь','+ двойной таран','+ ядовитые яйца на пути','+ прицельные плевки','+ шипы на арене']}};
const bossEpithet=b=>(BOSS_EPI2[b.type]||[])[(b.v||1)-1]||BOSS_EPITHET[b.type];
function makeBoss(type,tier){
  const v=bossVer(type,tier), sc=[1,1,1.2,1.35][v];
  const hp=Math.round((60+tier*25)*(type==='core'?1.5:1)*[1,1,1.35,1.6][v]);
  const sz0={toad:[96,72],eye:[84,84],gear:[92,92],queen:[120,64],core:[110,110]}[type], sz=[Math.round(sz0[0]*sc),Math.round(sz0[1]*sc)];
  const b={v,sc,laser:null,second:false,dbl:false,type,tier,hp,max:hp,w:sz[0],h:sz[1],t:0,flash:0,cd:2.2,cd2:5,cd3:7,state:'idle',st:1.4,vx:0,vy:0,face:-1,dead:false,jumps:0,bounces:0,atk:0,rot:0,name:BOSS_NAMES[type]+MK[v]};
  b.x=VW-T*4-b.w; b.y=(type==='eye'||type==='core')?110:FLOOR_Y-b.h;
  if(type==='gear'){ b.vx=-(250+tier*8); b.vy=-300; }
  return b;
}

function loadLevel(i,keepHp){
  levelIdx=i; const L=getLevel(i); curTier=L.tier||0;
  grid=L.map.map(r=>r.split('')); gridVer++; doors={}; doorAt=[...Array(ROWS)].map(()=>Array(COLS).fill(null));
  plates=[]; crates=[]; movers=(L.movers||[]).map(m=>({ax:m.ax*T,ay:m.ay*T,bx:m.bx*T,by:m.by*T,x:m.ax*T,y:m.ay*T,w:m.w*T,h:14,sp:m.sp,key:m.key||null,u:0,dir:1,hold:0,pause:m.pause||.35,timer:0,dx:0,dy:0,kind:'mover'})); particles=[]; texts=[]; dmgNums=[]; rings=[]; bullets=[]; ebullets=[]; const ex=[]; let s1=[2,16], s2=[4,16];
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
    const c=grid[y][x];
    if(c==='1'){s1=[x,y];grid[y][x]='.';}
    else if(c==='2'){s2=[x,y];grid[y][x]='.';}
    else if('pqr'.includes(c)){plates.push({key:c.toUpperCase(),x,y,on:false});grid[y][x]='.';}
    else if('PQRUVW'.includes(c)){
      const bridge=!!BRIDGE[c], key=BRIDGE[c]||c;
      const d=doors[c]||(doors[c]={key,bridge,cells:[],vis:bridge?0:1,solid:!bridge});
      d.cells.push([x,y]); doorAt[y][x]=d; grid[y][x]='.';
    }
    else if(c==='E'){ex.push([x,y]);grid[y][x]='.';}
    else if(c==='C'){crates.push(makeCrate(x,y));grid[y][x]='.';}
  }
  portals=[]; crumb={}; winds=(L.winds||[]).slice();
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(grid[y][x]==='O'||grid[y][x]==='o') portals.push({x,y,c:grid[y][x]});
  for(const P of portals){ P.to=P.c==='O'?portals.filter(q=>q.c==='o'&&q.x>P.x).sort((a,b)=>a.x-b.x)[0]:portals.filter(q=>q.c==='O'&&q.x<P.x).sort((a,b)=>b.x-a.x)[0]; }
  const xs=ex.map(e=>e[0]), ys=ex.map(e=>e[1]);
  exitRect={x:Math.min(...xs)*T,y:Math.min(...ys)*T,w:(Math.max(...xs)-Math.min(...xs)+1)*T,h:(Math.max(...ys)-Math.min(...ys)+1)*T};
  players=[makePlayer('spark',...s1), makePlayer('bolt',...(solo?s1:s2))];
  if(solo) for(const p of players) if(p.kind!==soloHero){ p.absent=true; p.dead=true; p.x=-5000; p.y=-5000; }
  { const D=diffLv(), mul=D<0?.7:1+.3*D; enemies=(L.enemies||[]).map(d=>{ const e=makeEnemy(d,curTier); e.hp=Math.max(1,Math.round(e.hp*mul)); return e; }); }
  const inv=run.inv||{}; for(const p of players) if(!p.absent){ p.bag=(inv[p.kind]||[]).slice(0,BAG_MAX); p.sel=0; }
  pickups=(L.pickups||[]).map(p=>({type:p.type,x:p.tx*T,y:p.ty*T,t:Math.random()*6,hidden:!!p.secret,secret:!!p.secret,ri:p.ri,bossN:p.bossN}));
  for(const p of pickups) if(p.type==='relic'&&((run.relics||{})[p.bossN]||[]).includes(p.ri)) p.type='heart';
  curTimer=solo?Math.max(2.4,3.8-i*0.014):3.6;
  if(L.newMech) setTimeout(()=>{ if(state==='play'||state==='loading') texts.push({x:VW/2,y:VH*0.28,t:'НОВОЕ: '+L.newMech[0].toUpperCase(),life:3.2,c:'#ffd166',big:true}); },350);
  darkLvl=!L.boss&&isDarkLevel(i+1); lamps=[];
  if(darkLvl){ const R=rng((i+1)*313+7); const cand=[]; for(let x=3;x<29;x++) for(let y=1;y<=8;y++) if(grid[y][x]==='.'&&grid[y-1][x]==='#') cand.push([x,y]);
    for(let k=0;k<5&&cand.length;k++){ const c=cand.splice(Math.floor(R()*cand.length),1)[0]; if(lamps.some(l=>Math.abs(l.tx-c[0])<5)) continue; lamps.push({tx:c[0],ty:c[1],x:c[0]*T+T/2,y:c[1]*T+10,lit:0}); }
    if(L.newMech==null&&i+1===firstDark()) setTimeout(()=>{ if(state==='play') texts.push({x:VW/2,y:VH*0.28,t:'НОВОЕ: ТЬМА',life:3.2,c:'#ffd166',big:true}); },350); }
  secretsTotal=pickups.filter(p=>p.secret).length; secretsFound=0; secretHits={}; levelHint=L.hint;
  if(carry&&!solo===!carry.solo){ for(const p of players){ const k=carry[p.kind]; if(!k||p.absent) continue; p.hp=Math.max(p.hp,k.hp); p.shield=p.shield||k.shield; for(const t in k.pw) p.pw[t]=Math.max(p.pw[t]||0,k.pw[t]); } } carry=null;
  levelDowned=false; levelHurt=false; combo=0; active=0; follow=!!L.boss; outro=null;
  boss=L.boss?makeBoss(L.boss,curTier):null;
  if(boss){ const D=diffLv(), mul=D<0?.75:1+.25*D; boss.hp=boss.max=Math.round(boss.max*mul); }
  if(boss){ const rl=(run.relics||{})[i+1]||[]; if(rl.includes(0)){ boss.hp=boss.max=Math.round(boss.max*0.8); } boss.dmgMul=rl.includes(1)?1.25:1; boss.slow=rl.includes(2)?0.85:1; boss.relics=rl.length; }
  arena=L.arena?{type:L.arena,t:0,rainCd:3,rains:[],shockCd:3.5,shock:null,side:Math.random()<.5?0:1,conv:L.arena==='gear'?95+curTier*4:0,spots:[]}:null;
  if(arena){ for(let y=3;y<=14;y++) for(let x=3;x<=28;x++) if(grid[y][x]==='.'&&grid[y+1]&&grid[y+1][x]==='#') arena.spots.push([x,y]); pickups=arena.spots.length?[0,1].map(i=>{ const s=arena.spots[Math.floor(arena.spots.length*(i?0.85:0.15))]; return {type:'heart',x:s[0]*T,y:s[1]*T,t:0}; }):[]; } exitLocked=!!boss; heartTimer=14;
  levelTime=0; exitHold=0; staticDirty=true; titleT=boss?0:2.2;
  if(boss){ const quick=lastIntro===i; lastIntro=i; intro={t:quick?INTRO_P:0,dur:INTRO_P+2.2,y0:boss.y,landed:false,named:false,go:false,rum:false};
    boss.y=(boss.type==='eye'||boss.type==='core')?-boss.h-20:-boss.h-40; } else intro=null;
  { const R=rng(i*31+7); bgGears=[...Array(3)].map(()=>({x:T*3+R()*(VW-T*6),y:T*3+R()*(VH-T*7),r:60+R()*110,teeth:10+Math.floor(R()*8),sp:(R()<.5?-1:1)*(0.05+R()*0.12)}));
    motes=[...Array(46)].map(()=>({x:Math.random()*VW,y:Math.random()*VH,v:6+Math.random()*16,s:1+Math.random()*1.8,ph:Math.random()*6})); }
  $('lvl').textContent=`Уровень ${i+1} из ${TOTAL} · ${L.name}`;
  updHint();
}
let secretsTotal=0,secretsFound=0,levelHint='',carry=null;
function updHint(){ let rh='';
  if(boss){ const rl=(run.relics||{})[levelIdx+1]||[]; rh=rl.length?'  ✦ Реликвии '+rl.length+'/3: '+rl.slice().sort().map(r=>RELIC_FX[r]).join(', '):'  ✦ Реликвий нет: босс в полной силе'; }
  else { const N=Math.ceil((levelIdx+1)/10)*10, d=(levelIdx+1)%10; if(d>=7){ const rl=(run.relics||{})[N]||[]; rh='  ✦ Здесь спрятана реликвия против босса ('+rl.length+'/3)'; } }
  $('hint').textContent=boss?(rh.replace(/^\s*✦\s*/,'✦ ')):levelHint+rh+(secretsTotal?'  ✦ Секреты: '+secretsFound+'/'+secretsTotal:''); }
let secretHits={};
function hitSecret(tx,ty){ const k=tx+','+ty; secretHits[k]=(secretHits[k]||0)+1; if(secretHits[k]>=2) return openSecret(tx,ty);
  sfx('crack'); shake=Math.max(shake,2); for(let i=0;i<5;i++) addP({x:tx*T+Math.random()*T,y:ty*T+Math.random()*T,vx:(Math.random()-.5)*200,vy:-Math.random()*200,life:.5,max:.5,c:'#bcd4ff',s:2.5,g:1});
  texts.push({x:tx*T+T/2,y:ty*T-10,t:'тук… пусто?',life:1,c:'#bcd4ff'}); }
function openSecret(tx,ty){
  const st=[[tx,ty]], cells=[];
  while(st.length){ const [x,y]=st.pop(); if(x<0||y<0||x>=COLS||y>=ROWS||grid[y][x]!=='S') continue; grid[y][x]='.'; gridVer++; cells.push([x,y]); st.push([x+1,y],[x-1,y],[x,y+1],[x,y-1],[x+1,y+1],[x-1,y+1],[x+1,y-1],[x-1,y-1]); }
  for(const [x,y] of cells) for(let i=0;i<8;i++) addP({x:x*T+Math.random()*T,y:y*T+Math.random()*T,vx:(Math.random()-.5)*380,vy:-Math.random()*420,life:.9,max:.9,c:Math.random()<.5?'#bcd4ff':'#08162c',s:3+Math.random()*4,g:1});
  staticDirty=true; let got=false;
  for(const pk of pickups) if(pk.hidden&&cells.some(([x,y])=>Math.abs(pk.x/T-x)<=1&&Math.abs(pk.y/T-y)<=1)){ pk.hidden=false; got=true;
    rings.push({x:pk.x+T/2,y:pk.y+T/2,r:6,max:130,life:.6,c:'#ffd166',w:5}); burst(pk.x+T/2,pk.y+T/2,26,['#ffd166','#ffffff'],300,.8); }
  shake=Math.max(shake,6); sfx('crack');
  if(got){ secretsFound++; addScore(100); sfx('boost'); flash('#ffd166',.2); hitstop=Math.max(hitstop,.08);
    const c=cells[0]; texts.push({x:c[0]*T+T/2,y:c[1]*T-30,t:'СЕКРЕТ! '+secretsFound+'/'+secretsTotal,life:1.8,c:'#ffd166',pop:true}); updHint(); }
}

