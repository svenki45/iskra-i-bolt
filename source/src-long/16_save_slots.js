/* ================= save slots ================= */
var SLOT_N=3; var slots=(()=>{ const a=store.get('iskra-bolt-slots',null); return Array.isArray(a)?a.concat([null,null,null]).slice(0,SLOT_N):[null,null,null]; })();
var activeSlot=store.get('iskra-bolt-slot',-1), slotMode='load', slotDel=-1, newSlotTarget=-1;
var MODE_NAME=m=>m==='2'?'2 игрока':m==='spark'?'1 игрок · Искра':'1 игрок · Болт';
var sfxOf=m=>m==='2'?'':'-'+m;
function snapSlot(){
  if(typeof slots==='undefined') return;
  if(activeSlot<0){ const free=slots.findIndex(x=>!x); if(free<0||best<1) return; activeSlot=free; store.set('iskra-bolt-slot',activeSlot); }
  const prev=slots[activeSlot]||{};
  slots[activeSlot]={mode:solo?soloHero:'2',best,run:JSON.parse(JSON.stringify(run)),ach:Object.assign({},achGot),stats:JSON.parse(JSON.stringify(stats)),saved:Date.now(),created:prev.created||Date.now(),
    lvl:Math.min(TOTAL-1,best)};
  store.set('iskra-bolt-slots',slots);
}
function applySlot(i){
  const S=slots[i]; if(!S) return;
  try{ localStorage.setItem('iskra-bolt-sheet'+sfxOf(S.mode),String(S.best||0)); }catch(e){}
  store.set('iskra-bolt-run'+sfxOf(S.mode),S.run||{});
  activeSlot=-1; setMode(S.mode!=='2',S.mode!=='2'?S.mode:null);
  activeSlot=i; store.set('iskra-bolt-slot',i);
  achGot=Object.assign({},S.ach||{}); store.set('iskra-bolt-ach',achGot);
  stats=Object.assign({gears:0,kills:0,stomps:0,bosses:[],pw:[]},S.stats||{}); saveStats();
  for(const k in cache) delete cache[k];
  renderLegend(true);
}
function getLevelName(x){ try{ const sv=[solo,soloHero]; solo=x.mode!=='2'; if(solo) soloHero=x.mode; const n=getLevel(Math.min(TOTAL-1,x.best)).name; solo=sv[0]; soloHero=sv[1]; return n; }catch(e){ return ''; } }
const latestSlot=()=>{ let b=-1; slots.forEach((x,i)=>{ if(x&&(b<0||x.saved>slots[b].saved)) b=i; }); return b; };
// migrate old single save into slot 1
if(!slots.some(Boolean)&&best>0){ activeSlot=-1; snapSlot(); }
function fmtDate(t){ const d=new Date(t), p=n=>String(n).padStart(2,'0'); return p(d.getDate())+'.'+p(d.getMonth()+1)+' '+p(d.getHours())+':'+p(d.getMinutes()); }
const CHAPTERS=['Пробуждение','Литейный цех','Сварочный пост','Шестерёнчатый ад','Подвал Королевы','Ночная смена','Цех ошибок','Ржавые глубины','Последний конвейер','Сердце мастерской'];
const chapterOf=i=>Math.min(9,Math.floor(i/10));
const STORY=[['Старая мастерская','Ночью в заброшенной мастерской сам собой запустился Главный Механизм. Он собрал себе стражей и начал переделывать всё вокруг.'],
  ['Искра и Болт','Маленькая искорка из сварочного аппарата и упрямый болт с конвейера — единственные, кого Механизм не успел перепрошить.'],
  ['Вместе','Искра лёгкая и светит в темноте. Болт тяжёлый и сильный. Поодиночке им не пройти и одного цеха. Вместе — можно дойти до самого Сердца мастерской.']];
var LVS=(()=>{ try{ return JSON.parse(localStorage.getItem('iskra-bolt-lvlstats')||'{}'); }catch(e){ return {}; } })();
function lvlStat(i,k,v){ const key=(solo?soloHero:'2')+':'+(i+1); const o=LVS[key]||(LVS[key]={d:0,c:0,t:0}); o[k]+=v; try{ localStorage.setItem('iskra-bolt-lvlstats',JSON.stringify(LVS)); }catch(e){} }
var pendingDiff=null;
let storyI=0, storyNext=null;
function startNGPlus(){
  run.ng=(run.ng||0)+1; run.relics={}; run.inv={}; run.offer=[]; run.reward=null; saveRun();
  best=0; try{ localStorage.setItem('iskra-bolt-sheet'+modeSuffix(),'0'); }catch(e){} for(const k in cache) delete cache[k];
  snapSlot(); sfx('boss'); deaths=0; totalTime=0; gears=0;
  toastQ.push({small:'Новая игра +',title:'НИ+'+run.ng+': прокачка сохранена, враги злее',icon:'first'}); showToast();
  startGame(0,true);
}
function doNewGame(slotIdx){
  if(slotIdx==null) slotIdx=newSlotTarget>=0?newSlotTarget:Math.max(0,slots.findIndex(x=>!x));
  slots[slotIdx]=null; activeSlot=slotIdx; store.set('iskra-bolt-slot',slotIdx);
  achGot={}; store.set('iskra-bolt-ach',achGot); stats={gears:0,kills:0,stomps:0,bosses:[],pw:[]}; saveStats();
  best=0; try{ localStorage.setItem('iskra-bolt-sheet'+modeSuffix(),'0'); }catch(e){}
  for(const k in cache) delete cache[k];
  run={score:0,wallet:0,up:{},offer:[],refresh:0,reward:null,inv:{},diff:pendingDiff||'normal',ng:0};
  slots[slotIdx]={mode:solo?soloHero:'2',best:0,run,ach:{},stats,saved:Date.now(),created:Date.now(),lvl:0}; store.set('iskra-bolt-slots',slots);
  if(anyCheat()) unlock('cheater'); storyNext=()=>startGame(0); proT=0; setState('prologue');
}
let loadJob=null;
const LOAD_STEPS=['Чертим схему уровня','Раскладываем платформы','Заводим шестерёнки','Расставляем врагов','Прячем секреты','Смазываем двери','Проверяем кнопки'];
const LOAD_STEPS_BOSS=['Разогреваем арену','Чистим пол от масла','Будим босса','Босс точит инструменты','Включаем свет на арене'];
function loadingTo(i,quick){
  const L=getLevel(i), isBoss=!!L.boss;
  const steps=(isBoss?LOAD_STEPS_BOSS:LOAD_STEPS).slice();
  const marks=[]; let acc=0; for(let k=0;k<steps.length;k++){ acc+=0.6+Math.random()*1.2; marks.push(acc); } marks.forEach((m,k)=>marks[k]=m/acc);
  loadJob={i,t0:performance.now(),dur:quick?700:(isBoss?2600:1700)+Math.random()*700,steps,marks,isBoss,name:isBoss?BOSS_NAMES[L.boss]:L.name,
    tip:(()=>{ const pool=(TIPS.any||[]).concat(TIPS.down||[]).filter(t=>!solo||!(soloHero==='bolt'?/Искр/:/Болт/).test(t)); return pool[Math.floor(Math.random()*pool.length)]||''; })()};
  setState('loading'); requestAnimationFrame(loadTick);
}
function loadTick(){
  const J=loadJob; if(!J||state!=='loading') return;
  const raw=Math.min(1,(performance.now()-J.t0)/J.dur);
  // uneven, "real" progress: fast bursts with little stalls
  const p=Math.min(1,raw+Math.sin(raw*Math.PI*3)*.04*(1-raw));
  const bar=document.getElementById('ldBar'), pc=document.getElementById('ldPc'), st=document.getElementById('ldStep');
  if(bar) bar.style.width=(p*100).toFixed(1)+'%'; if(pc) pc.textContent=Math.floor(p*100)+'%';
  const k=J.marks.findIndex(m=>p<=m); if(st) st.textContent=(p>=1?'Готово!':J.steps[k<0?J.steps.length-1:k]+'…');
  if(raw>=1){ setTimeout(()=>{ if(state!=='loading'||loadJob!==J) return; loadJob=null; loadLevel(J.i); setState('play'); },220); return; }
  requestAnimationFrame(loadTick);
}
function startGame(i,keep){ lastIntro=-1; audioInit(); runClean=(i===0); if(i===0&&!keep){ const df=run&&run.diff; run={score:0,wallet:0,up:{},offer:[],refresh:0,reward:null,inv:{},diff:pendingDiff||df||'normal',ng:0}; pendingDiff=null; saveRun(); } const se=document.getElementById('score'); if(se) se.textContent=run.score.toLocaleString('ru-RU'); if(i===0){deaths=0;totalTime=0;gears=0;$('deaths').textContent=0;$('gears').textContent=0;} loadingTo(i); }
function nextLevel(){ lastIntro=-1; carry={solo}; run.inv=run.inv||{}; for(const p of players) if(!p.absent) run.inv[p.kind]=p.bag.slice(); saveRun(); for(const p of players) if(!p.absent) carry[p.kind]={hp:p.hp,shield:p.shield,pw:Object.assign({},p.pw)}; loadingTo(levelIdx+1); }
function handleMeta(){
  if(NET.role==='guest'&&(state==='play'||state==='netwait')&&pressed.has('Escape')){ guestPause(); pressed.clear(); return; }
  if(state==='netleave'&&pressed.has('Escape')){ guestResume(); pressed.clear(); return; }
  if(state==='net'&&pressed.has('Escape')){ if(NET.waiting){ try{ NET.mq&&NET.mq.close(); }catch(e){} NET.mq=null; NET.waiting=false; } setState('menu'); return; }
  if(pressed.has('KeyM')){ settings.mute=!settings.mute; saveSettings(); applyVolumes(); texts.push({x:VW/2,y:80,t:settings.mute?'ЗВУК ВЫКЛ':'ЗВУК ВКЛ',life:1,c:'#9cc3ff',small:true}); }
  if(state==='title'&&(pressed.has('Enter')||pressed.has('Space'))){ goMenuFromTitle(); pressed.clear(); return; }
  if(state==='menu'&&pressed.has('Escape')){ setState('title'); return; }
  if(state==='hero'&&pressed.has('Escape')){ setState(heroBack); return; }
  if((state==='cheats'||state==='slots')&&pressed.has('Escape')){ setState('menu'); return; }
  if(state==='diffpick'&&pressed.has('Escape')){ setState(slots.some(Boolean)?'slots':'menu'); return; }
  if(state==='report'&&pressed.has('Escape')){ setState('settings'); return; }
  if(state==='story'&&(pressed.has('Escape'))){ const f=storyNext; storyNext=null; f&&f(); return; }
  if(state==='confirmNew'&&pressed.has('Escape')){ setState('slots'); return; }
  if((state==='help'||state==='levels')&&pressed.has('Escape')){ setState(state==='help'?helpBack:'menu'); return; }
  if(state==='gameover'){
    if(pressed.has('Escape')){ go=null; loadLevel(levelIdx); setState('menu'); }
  }
  if(state==='play'||state==='dying'){
    if(state==='play'&&pressed.has('Escape')) tryPause(0);
    else if(state==='play'&&pressed.has('KeyP')) tryPause(solo?0:1);
    else if(pressed.has('KeyR')&&state==='play'&&NET.role!=='guest') loadLevel(levelIdx);
    else if(cheat&&(pressed.has('BracketRight')||pressed.has('PageDown'))&&levelIdx<TOTAL-1){ runClean=false; loadLevel(levelIdx+1); state='play'; }
    else if(cheat&&(pressed.has('BracketLeft')||pressed.has('PageUp'))&&levelIdx>0){ loadLevel(levelIdx-1); state='play'; }
  } else if(state==='pause'){
    if(pressed.has('Escape')) tryPause(0); else if(pressed.has('KeyP')) tryPause(solo?0:1);
  } else if(state==='ach'||state==='custom'){
    if(pressed.has('Escape')) setState('menu');
  } else if(state==='controls'){
    if(pressed.has('Escape')){ if(capture&&capture.type==='pad'){ capture=null; setState('controls'); } else if(!capture) setState(ctlBack); }
  } else if(state==='settings'){
    if(pressed.has('Escape')) setState(ctlBack);
  } else if(state==='shop'&&shopFrom!=='boss'){
    if(pressed.has('Escape')) setState(shopFrom);
  }
  const ae=document.activeElement, onBtn=ae&&(ae.tagName==='BUTTON'||ae.tagName==='INPUT');
  if(pressed.has('Enter')&&!onBtn){
    if(state==='menu') startGame(best>0&&best<TOTAL?best:0); else if(state==='done'||(state==='shop'&&shopFrom==='boss')) nextLevel(); else if(state==='gameover') retryLevel(); else if(state==='win') startNGPlus();
  }
}

