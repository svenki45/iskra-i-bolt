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

