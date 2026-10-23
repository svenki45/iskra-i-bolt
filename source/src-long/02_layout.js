/* ================= layout ================= */
function fit(){
  const r=$('stage').getBoundingClientRect(); const tch=document.body.classList.contains('touch')&&document.body.classList.contains('playing'), TL=(typeof touchLayout!=='undefined')?touchLayout:{};
  const pm=document.body.classList.contains('padmode'), side=tch&&!TL.over&&!pm?touchSide()*2:0;
  const s=Math.max(0.1,Math.min((r.width-side)/VW, r.height/VH))*(tch&&!pm?(TL.cam?Math.min(1,TL.field||1):(TL.field||1)):1);
  const w=Math.floor(VW*s), h=Math.floor(VH*s);
  $('screen').style.width=w+'px'; $('screen').style.height=h+'px';
  const dpr=(typeof settings!=='undefined'&&settings.quality==='low')?1:Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(w*dpr)); cv.height=Math.max(1,Math.round(h*dpr));
  scale=cv.width/VW;
}
addEventListener('resize',fit);
try{ new ResizeObserver(()=>fit()).observe($('stage')); }catch(e){}
let fsAuto=true;
function goFs(){ const el=document.documentElement; if(document.fullscreenElement||!el.requestFullscreen) return;
  el.requestFullscreen({navigationUI:'hide'}).then(()=>{ try{ navigator.keyboard&&navigator.keyboard.lock&&navigator.keyboard.lock(['Escape']); }catch(e){} }).catch(()=>{}); }
function fsLabel(){ const b=$('fsBtn'); if(b) b.textContent=document.fullscreenElement?'Выйти из полного экрана':'На весь экран'; }
$('fsBtn').addEventListener('click',e=>{ e.stopPropagation();
  try{ if(document.fullscreenElement){ fsAuto=false; try{ navigator.keyboard&&navigator.keyboard.unlock&&navigator.keyboard.unlock(); }catch(_){} document.exitFullscreen(); } else { fsAuto=true; goFs(); } }catch(e){} });
// open fullscreen right away: browsers allow it only after the first click/key, so we grab that first gesture
for(const ev of ['pointerdown','keydown']) addEventListener(ev,e=>{ if(fsAuto&&!document.fullscreenElement&&!(e.target&&e.target.id==='fsBtn')&&!/iPhone|iPad|iPod/.test(navigator.userAgent)) goFs(); },true);
document.addEventListener('fullscreenchange',fsLabel);
document.addEventListener('fullscreenchange',()=>setTimeout(fit,50));

// ПК: описание уровня над игрой скрыто — остаётся только название, поле игры больше
document.head.insertAdjacentHTML('beforeend','<style>body:not(.touch) #hint{display:none!important} .titlescr{padding-block:5% 2.5%!important} .tbtns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px} .tbtns button{display:flex;flex-direction:column;align-items:center;padding:8px 18px;min-width:200px} .tbtns small{margin:2px 0 0!important} body:not(.touch) .app{max-width:none!important;gap:4px!important;padding:4px 10px!important} body:not(.touch) .top{gap:2px 14px} body:not(.touch) .legend{font-size:12px;gap:2px 18px;line-height:1.2} body:not(.touch) .legend .tools button{padding:2px 10px;font-size:12px} .overlay .mlist button:focus,.overlay .mlist button:focus-visible,.overlay .tbtns button:focus,.overlay .tbtns button:focus-visible{outline:3px solid var(--brass)!important;outline-offset:-3px!important;box-shadow:inset 0 0 0 6px rgba(231,181,74,.18)!important;transform:none!important}</style>');
