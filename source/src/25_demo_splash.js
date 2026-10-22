/* ===== attract mode (demo) and splash ===== */
let demoSave=null, demoBestD=1e9, demoProg=0, demoT=0, demoI=0, lastAct=performance.now();
const DEMO_POOL=[0,9,8,3,19,12,20,29,30,39];
function demoLead(p){
  const inp={dir:0,jump:false,jp:false,ab:false,ap:false,fire:false};
  if(!p||p.down) return inp;
  const cx=p.x+p.w/2, cy=p.y+p.h/2, fight=boss&&!boss.dead&&!intro;
  let tx=fight?Math.max(140,Math.min(VW-140,boss.x+boss.w/2+(Math.sin(levelTime*.35)>0?-260:260)+Math.sin(levelTime*.9)*120)):exitRect.x+exitRect.w/2;
  const dx=tx-cx; inp.dir=Math.abs(dx)>30?Math.sign(dx):0;
  if(inp.dir){ const fx=cx+inp.dir*(p.w/2+22), foot=Math.floor((p.y+p.h-2)/T), col=Math.floor(fx/T);
    const here=grid[foot]&&grid[foot][col], below=grid[foot+1]&&grid[foot+1][col];
    const danger=here==='^'||below==='^', wall=tileHit(p.x+inp.dir*12,p.y,p.w,p.h-6), cliff=p.wasGround&&!solidPx(fx,p.y+p.h+6);
    if(p.wasGround&&(danger||wall||cliff)){ inp.jp=inp.jump=true; }
    else if(!p.wasGround&&p.vy>60&&(danger||wall)){ inp.jp=inp.jump=true; }
    if(!p.wasGround&&p.vy<0) inp.jump=true; }
  if(Math.abs(p.x-(p.dLX||0))<.5) p.dSt=(p.dSt||0)+1/60; else p.dSt=0; p.dLX=p.x;
  if(p.dSt>.7&&p.wasGround){ inp.jp=inp.jump=true; p.dSt=0; }
  if(fight&&p.wasGround&&Math.random()<.025) inp.jp=inp.jump=true;
  if(Math.random()<.01) inp.ap=true;
  let tg=null, td=700;
  for(const en of enemies){ if(en.hp<=0) continue; const d=Math.abs(en.x+en.w/2-cx); if(Math.abs(en.y+en.h/2-cy)<80&&d<td){ td=d; tg=en; } }
  if(fight) tg=tg||boss;
  if(tg){ if(!inp.dir) p.face=Math.sign(tg.x+tg.w/2-cx)||p.face; inp.fire=true; }
  return inp;
}
function demoLoad(){ const i=DEMO_POOL[demoI++%DEMO_POOL.length]; lastIntro=-1; loadLevel(i); follow=true; demoT=0; demoBestD=1e9; demoProg=0; setState('play'); }
function demoNext(){ if(!demo) return; flash('#000000',.6); demoLoad(); }
function startDemo(){
  if(demo||NET.role) return;
  let ls={}; try{ for(let k=0;k<localStorage.length;k++){ const key=localStorage.key(k); ls[key]=localStorage.getItem(key); } }catch(e){}
  demoSave={ls,run:clone(run),stats:clone(stats),best,deaths,totalTime,gears,levelIdx,solo,soloHero,cheat,cheatGod,cheatOne,from:state};
  demo=true; solo=false; cheat=false; cheatGod=false; cheatOne=false; demoI=Math.floor(Math.random()*DEMO_POOL.length);
  document.body.classList.add('demo'); demoBanner(true); demoLoad();
}
function stopDemo(){
  if(!demo) return; const S=demoSave; demo=false; demoSave=null;
  try{ for(const k of Object.keys(localStorage)) if(!(k in S.ls)) localStorage.removeItem(k); for(const k in S.ls) if(localStorage.getItem(k)!==S.ls[k]) localStorage.setItem(k,S.ls[k]); }catch(e){}
  run=S.run; stats=S.stats; best=S.best; deaths=S.deaths; totalTime=S.totalTime; gears=S.gears; solo=S.solo; soloHero=S.soloHero; cheat=S.cheat; cheatGod=S.cheatGod; cheatOne=S.cheatOne;
  boss=null; intro=null; outro=null; loadLevel(S.levelIdx); $('deaths').textContent=deaths; $('gears').textContent=gears; { const se=$('score'); if(se) se.textContent=run.score.toLocaleString('ru-RU'); }
  toastQ=[]; document.body.classList.remove('demo'); demoBanner(false); lastAct=performance.now(); setState('title');
}
function demoBanner(on){ let b=document.getElementById('demoBan'); if(!on){ if(b) b.remove(); return; }
  if(!b){ b=document.createElement('div'); b.id='demoBan'; b.innerHTML='<b>ДЕМО</b><span>'+(document.body.classList.contains('touch')?'Коснитесь экрана, чтобы играть':'Нажмите любую кнопку, чтобы играть')+'</span>'; $('screen').appendChild(b); } }
function demoTick(dt){
  const anyPad=(()=>{ try{ for(const g of navigator.getGamepads?navigator.getGamepads():[]){ if(g&&(g.buttons.some(b=>b.pressed)||g.axes.some(a=>Math.abs(a)>.5))) return true; } }catch(e){} return false; })();
  if(anyPad&&document.body.classList.contains('touch')) setPadMode(true);
  if(anyPad){ if(demo){ stopDemo(); return; } lastAct=performance.now(); }
  if(demo){ demoT+=dt; const lim=boss?32:24;
    if(state==='dying'||state==='gameover'||state==='done'||state==='shop'){ demoNext(); return; }
    if(state==='play'&&!boss&&players&&exitRect){ const p=players[0], d=Math.abs(exitRect.x-p.x); if(demoT<0.1||d<demoBestD-20){ demoBestD=d; demoProg=demoT; } if(demoT-demoProg>6||(d<60&&demoT-demoProg>2)) { demoNext(); return; } }
    if(state==='play'&&demoT>lim) demoNext(); return; }
  if((state==='title'||state==='menu')&&performance.now()-lastAct>180000) startDemo();
}
const actEv=e=>{ lastAct=performance.now(); if(demo){ e.preventDefault(); e.stopImmediatePropagation(); stopDemo(); } };
addEventListener('keydown',actEv,true); addEventListener('pointerdown',actEv,true); addEventListener('mousemove',()=>{ if(!demo) lastAct=performance.now(); },true); addEventListener('wheel',()=>{ lastAct=performance.now(); },true);
(function splash(){ if(window.__ibNoSplash) return; const d=document.createElement('div'); d.id='splash';
  d.innerHTML='<div class="sp1">Игра разработана</div><div class="sp2 notr">Edward Dergachev</div><div class="sp3">при поддержке <b>Claude</b></div>';
  document.body.appendChild(d);
  const block=e=>{ e.preventDefault(); e.stopImmediatePropagation(); };
  for(const ev of ['keydown','keyup','pointerdown','pointerup','click','touchstart','wheel']) addEventListener(ev,block,{capture:true,passive:false});
  setTimeout(()=>{ for(const ev of ['keydown','keyup','pointerdown','pointerup','click','touchstart','wheel']) removeEventListener(ev,block,{capture:true}); d.classList.add('out'); lastAct=performance.now(); setTimeout(()=>d.remove(),600); },5000); })();
