/* ================= touch controls ================= */
const touchUI={el:null,sig:'',on:false};
function isTouchDev(){ return (window.matchMedia&&matchMedia('(pointer:coarse)').matches)||('ontouchstart' in window); }
function setTouch(on){ touchUI.on=on; document.body.classList.toggle('touch',on); buildTouch(true); try{ fit(); }catch(e){} }
addEventListener('touchstart',()=>{ if(!touchUI.on) setTouch(true); audioInit(); },{passive:true,capture:true});
// no pinch / double-tap zoom while playing
for(const ev of ['gesturestart','gesturechange','dblclick']) document.addEventListener(ev,e=>{ if(document.body.classList.contains('touch')) e.preventDefault(); },{passive:false});
document.addEventListener('touchstart',e=>{ if(e.target.closest&&e.target.closest('#touch')) e.preventDefault(); },{passive:false});
document.addEventListener('touchmove',e=>{ if(document.body.classList.contains('playing')&&document.body.classList.contains('touch')) e.preventDefault(); },{passive:false});
document.addEventListener('touchend',e=>{ if(e.target.closest&&e.target.closest('#touch')) e.preventDefault(); },{passive:false});
addEventListener('keydown',e=>{ if(e.target&&e.target.tagName==='INPUT') return; if(touchUI.on&&!e.repeat&&e.isTrusted&&e.key&&e.key.length>0&&!/^(Unidentified|Process)$/.test(e.key)){ if(window.MOBILE_BUILD) setPadMode(true); else setTouch(false); } },true);
function setPadMode(on){ if(document.body.classList.contains('padmode')===on) return; document.body.classList.toggle('padmode',on); try{ fit(); }catch(e){} }
addEventListener('touchstart',()=>setPadMode(false),{passive:true,capture:true});
const TICON={left:'<svg viewBox="0 0 24 24"><path d="M15 4L7 12l8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right:'<svg viewBox="0 0 24 24"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  jump:'<svg viewBox="0 0 24 24"><path d="M12 20V5M5 11l7-7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
function touchSide(){ return Math.round(Math.min(210,Math.max(118,innerWidth*0.165))); }
var touchLayout=(()=>{ try{ return Object.assign({b:{},field:1,over:false},JSON.parse(localStorage.getItem('iskra-bolt-touchlayout')||'{}')); }catch(e){ return {b:{},field:1,over:false}; } })();
function saveTouchLayout(){ try{ localStorage.setItem('iskra-bolt-touchlayout',JSON.stringify(touchLayout)); }catch(e){} buildTouch(true); fit(); }
let editSel=null, editBack='pause';
function wireEdit(el){
  el.querySelectorAll('[data-id]').forEach(b=>{
    if(b.dataset.id===editSel) b.classList.add('sel');
    b.addEventListener('pointerdown',e=>{ e.preventDefault(); editSel=b.dataset.id; el.querySelectorAll('.sel').forEach(x=>x.classList.remove('sel')); b.classList.add('sel');
      const r=b.getBoundingClientRect(), ox=e.clientX-r.left, oy=e.clientY-r.top; try{ b.setPointerCapture(e.pointerId); }catch(_){}
      const mv=ev=>{ b.style.left=(ev.clientX-ox)+'px'; b.style.top=(ev.clientY-oy)+'px'; };
      const up=()=>{ b.removeEventListener('pointermove',mv); b.removeEventListener('pointerup',up); const q=b.getBoundingClientRect(), o=touchLayout.b[b.dataset.id]||{s:1};
        o.x=(q.left+q.width/2)/innerWidth; o.y=(q.top+q.height/2)/innerHeight; touchLayout.b[b.dataset.id]=o; saveTouchLayout(); };
      b.addEventListener('pointermove',mv); b.addEventListener('pointerup',up); });
  });
}
function editSize(d){ if(!editSel){ toastQ.push({small:'Кнопки',title:'Сначала нажмите на кнопку',icon:'first'}); showToast(); return; }
  const b=touchUI.el.querySelector(`[data-id="${editSel}"]`); if(!b) return; const q=b.getBoundingClientRect(), o=touchLayout.b[editSel]||{s:1};
  o.x=(q.left+q.width/2)/innerWidth; o.y=(q.top+q.height/2)/innerHeight; o.s=Math.max(.5,Math.min(2.2,(o.s||1)+d)); touchLayout.b[editSel]=o; saveTouchLayout(); }
const tHeld=new Map();
function tRelease(pid){ const h=tHeld.get(pid); if(!h) return; tHeld.delete(pid); if(![...tHeld.values()].some(o=>o.c===h.c)) down.delete(h.c); h.b.classList.remove('on'); }
function tReleaseAll(){ for(const pid of [...tHeld.keys()]) tRelease(pid); }
for(const ev of ['pointerup','pointercancel']) addEventListener(ev,e=>tRelease(e.pointerId),true);
addEventListener('touchend',e=>{ if(!e.touches.length) tReleaseAll(); },true);
addEventListener('touchcancel',()=>tReleaseAll(),true);
addEventListener('blur',()=>tReleaseAll()); document.addEventListener('visibilitychange',()=>{ if(document.hidden) tReleaseAll(); });
function buildTouch(force){
  if(!touchUI.el){ touchUI.el=document.createElement('div'); touchUI.el.id='touch'; touchUI.el.hidden=true; document.body.appendChild(touchUI.el);
    const r=document.createElement('div'); r.id='rotate'; r.innerHTML='<div><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffd166" stroke-width="1.6"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M20 8a8 8 0 0 1 0 8M4 16a8 8 0 0 1 0-8"/></svg><b>Поверните телефон</b>Играть удобнее горизонтально</div>'; document.body.appendChild(r); }
  const sig=[JSON.stringify(touchLayout),solo,soloHero,NET.role,innerWidth>innerHeight,Math.round(innerWidth/50)].join();
  if(!force&&sig===touchUI.sig) return; touchUI.sig=sig; tReleaseAll();
  const W=innerWidth,H=innerHeight, S=touchSide(), m=8, el=touchUI.el;
  const LK=(solo||NET.role)?'one':'two';
  const btn=(kind,act,x,y,sz,label,sub)=>{ const id=LK+'|'+kind+'|'+act, o=(touchLayout.b||{})[id]; if(o){ sz=sz*(o.s||1); x=o.x*W-sz/2; y=o.y*H-sz/2; } return `<button type="button" class="tb ${kind==='spark'?'s':'b'}" data-id="${id}" data-k="${kind}" data-a="${act}" style="left:${Math.round(x)}px;top:${Math.round(y)}px;width:${Math.round(sz)}px;height:${Math.round(sz)}px">${TICON[act]||label}${sub?`<small>${sub}</small>`:''}</button>`; };
  let html='';
  const abN=k=>k==='spark'?'рывок':'удар';
  // buttons live only in the side columns next to the playfield, never on top of it
  const a=Math.max(40,Math.min((S-m*2-8)/2,H*0.2)), bot=H-a-m-4;
  const col=(x0,k,mirror)=>{ const L=x0+m, R=x0+S-m-a;
    let h2=''; h2+=btn(k,mirror?'right':'left',mirror?R:L,bot,a,'')+btn(k,mirror?'left':'right',mirror?L:R,bot,a,'');
    return h2; };
  if(solo||NET.role){ const k=solo?soloHero:(NET.role==='guest'?'bolt':'spark');
    html+=col(0,k,false);
    const x0=W-S, J=Math.min(S-m*2,a*1.35);
    html+=btn(k,'jump',x0+S-m-J,H-J-m-4,J,'');
    html+=btn(k,'fire',x0+m,bot-a*1.05,a,'✦','огонь')+btn(k,'ability',x0+S-m-a,H-J-m-4-a-8,a,'➤',abN(k));
    html+=btn(k,'use',x0+m,bot-a*2.2,a*.85,'★','бонус');
  } else {
    for(const [x0,k,mir] of [[0,'spark',false],[W-S,'bolt',true]]){
      html+=col(x0,k,mir);
      const L=x0+m, R=x0+S-m-a;
      html+=btn(k,'jump',mir?L:R,bot-a-8,a,'')+btn(k,'ability',mir?R:L,bot-a-8,a,'➤',abN(k));
      html+=btn(k,'fire',mir?L:R,bot-2*a-16,a,'✦','огонь')+btn(k,'use',mir?R:L,bot-2*a-16,a*.85,'★','');
    }
  }
  html+=`<button type="button" class="tb" data-pause="1" style="left:${Math.round(S/2-20)}px;top:8px;width:40px;height:40px;border-radius:12px">II</button>`;
  el.innerHTML=html;
  el.querySelectorAll('[data-a]').forEach(b=>{
    const code=()=>binds[b.dataset.k].kb[b.dataset.a];
    const press=e=>{ if(state==='touchedit') return; const c=code(); if(!c) return; const prev=tHeld.get(e.pointerId); if(prev&&prev.c!==c) tRelease(e.pointerId); if(!down.has(c)) pressed.add(c); down.add(c); tHeld.set(e.pointerId,{c,b}); b.classList.add('on'); };
    b.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ b.releasePointerCapture(e.pointerId); }catch(_){} press(e); });
    b.addEventListener('pointerenter',e=>{ if(e.pointerType==='touch'&&e.buttons) press(e); });
    b.addEventListener('pointerleave',e=>{ const h=tHeld.get(e.pointerId); if(h&&h.b===b) tRelease(e.pointerId); });
    b.addEventListener('contextmenu',e=>e.preventDefault());
  });
  el.querySelector('[data-pause]').addEventListener('pointerup',e=>{ e.preventDefault(); e.stopPropagation(); if(state==='touchedit') return; if(NET.role==='guest'){ guestPause(); return; } if(state==='play'){ pauseOwner=null; setState('pause'); } });
  if(state==='touchedit') wireEdit(el);
}
const pauseBtn=(()=>{ const b=document.createElement('button'); b.type='button'; b.id='pauseBtn'; b.title='Пауза (Esc)'; b.setAttribute('aria-label','Пауза');
  b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18"><rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>';
  b.addEventListener('click',e=>{ e.stopPropagation(); if(NET.role==='guest'){ guestPause(); b.blur(); return; } if(state==='play'){ pauseOwner=null; setState('pause'); } b.blur(); });
  $('screen').appendChild(b); return b; })();
setInterval(()=>{
  pauseBtn.hidden=!(state==='play'&&!touchUI.on&&!intro);
  if(!touchUI.el) buildTouch(true);
  const playing=state==='play'||state==='dying';
  document.body.classList.toggle('playing',playing||state==='touchedit'); document.body.classList.toggle('tedit',state==='touchedit'); document.body.classList.toggle('titling',state==='title'); if(touchUI.lastPlay!==playing){ touchUI.lastPlay=playing; try{ fit(); }catch(e){} }
  document.body.classList.toggle('portrait',innerHeight>innerWidth);
  if(touchUI.on){ buildTouch(false); }
  touchUI.el.hidden=!(touchUI.on&&(playing||state==='touchedit'));
  if(!touchUI.el.hidden===false) touchUI.el.querySelectorAll('.on').forEach(b=>{ b.classList.remove('on'); });
},150);
if(isTouchDev()||window.MOBILE_BUILD) setTimeout(()=>setTouch(true),0);
// secret for phones: tap the game logo 6 times within 3 seconds
(()=>{ let taps=[]; const br=document.querySelector('.brand'); if(!br) return; br.style.cursor='default';
  br.addEventListener('pointerdown',()=>{ const t=performance.now(); taps=taps.filter(x=>t-x<3000); taps.push(t);
    if(taps.length>=6){ taps=[]; unlockCheatMenu(); } else if(taps.length>=3&&cheatMenu===false){ br.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:160}); } }); })();

