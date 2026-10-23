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
document.head.insertAdjacentHTML('beforeend','<style>body:not(.touch) #hint{display:none!important} .titlescr{padding-block:5% 2.5%!important} .tbtns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px} .tbtns button{display:flex;flex-direction:column;align-items:center;padding:8px 18px;min-width:200px} .tbtns small{margin:2px 0 0!important} body:not(.touch) .app{max-width:none!important;gap:4px!important;padding:4px 10px!important} body:not(.touch) .top{gap:2px 14px} body:not(.touch) .legend{font-size:12px;gap:2px 18px;line-height:1.2} body:not(.touch) .legend .tools button{padding:2px 10px;font-size:12px} .overlay button{transition:transform .14s ease,filter .14s ease,box-shadow .14s ease}  .overlay button:not(:disabled):hover,body.kbnav .overlay button:focus,.overlay button:focus-visible{outline:none!important;outline-offset:0!important;transform:perspective(700px) rotateX(8deg) translateY(-3px)!important;filter:brightness(1.14)!important;box-shadow:inset 0 0 0 2px #ffd166,inset 0 0 18px rgba(255,209,102,.28),0 3px 0 rgba(0,0,0,.35)!important}  .overlay button.primary:not(:disabled):hover,body.kbnav .overlay button.primary:focus,.overlay button.primary:focus-visible{box-shadow:inset 0 0 0 2px #fff6d6,inset 0 0 22px rgba(255,255,255,.35),0 3px 0 rgba(0,0,0,.35)!important}  body.kbnav .overlay input:focus{outline:2px solid #ffd166!important;outline-offset:1px!important;box-shadow:none!important}</style>');
