R3D.on=settings.r3d!==false&&R3D.on; document.body.classList.toggle('b3d',R3D.on);
function paintRanges(root){ (root||document).querySelectorAll('.overlay input[type=range]').forEach(el=>{ const p=(el.value-el.min)/((el.max-el.min)||1)*100; el.style.setProperty('--p',p+'%'); }); }
addEventListener('input',e=>{ if(e.target&&e.target.type==='range') paintRanges(); },true);
new MutationObserver(()=>paintRanges(overlay)).observe(overlay,{childList:true,subtree:true});
const GAME_VER='1.15';
(()=>{ const v=document.createElement('div'); v.id='verTag'; v.textContent='v'+GAME_VER+' beta'; $('screen').appendChild(v); })();
window.__ib={proTest:()=>{proT=0;storyNext=null;setState("prologue");},endTest:()=>{endT=0;setState("ending");},net:{NET,netApply,netSnap},getLevel,startGame,dmgE:(e,d)=>damageEnemy(e,d),complete:()=>complete(),hurt:i=>hurt(players[i]),setState:x=>setState(x),startDemo:()=>startDemo(),stopDemo:()=>stopDemo(),get demo(){return demo},tr:x=>tr(x),demoAt:i=>{ lastIntro=-1; loadLevel(i); follow=true; demoT=0; setState('play'); },get combo(){return combo},openSecret,nextLevel,hitBoss:(d)=>hitBoss(d),get outro(){return outro},get state(){return {state,levelIdx,boss,players,enemies,pickups,arena,run,movers,grid,ebullets,bullets}}};
const hot=window.claude&&window.claude.hot;
if(hot&&hot.snapshot) hot.snapshot(()=>({levelIdx,deaths,totalTime,gears,state:(state==='play'||state==='dying')?'play':'menu'}));
if(hot&&hot.ready) hot.ready(start); else start((hot&&hot.data)||{});
})();
