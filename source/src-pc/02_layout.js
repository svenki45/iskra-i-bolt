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
document.head.insertAdjacentHTML('beforeend','<style>body:not(.touch) #hint{display:none!important} .titlescr{padding-block:5% 2.5%!important} .tbtns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px} .tbtns button{display:flex;flex-direction:column;align-items:center;padding:8px 18px;min-width:200px} .tbtns small{margin:2px 0 0!important} body:not(.touch) .app{max-width:none!important;gap:4px!important;padding:4px 10px!important} body:not(.touch) .top{gap:2px 14px} body:not(.touch) .legend{font-size:12px;gap:2px 18px;line-height:1.2} body:not(.touch) .legend .tools button{padding:2px 10px;font-size:12px} .overlay button{transition:transform .14s ease,filter .14s ease,box-shadow .14s ease}  .overlay button:not(:disabled):hover,body.kbnav .overlay button:focus,.overlay button:focus-visible{outline:none!important;outline-offset:0!important;transform:perspective(700px) rotateX(8deg) translateY(-3px)!important;filter:brightness(1.14)!important;box-shadow:inset 0 0 0 2px #ffd166,inset 0 0 18px rgba(255,209,102,.28),0 3px 0 rgba(0,0,0,.35)!important}  .overlay button.primary:not(:disabled):hover,body.kbnav .overlay button.primary:focus,.overlay button.primary:focus-visible{box-shadow:inset 0 0 0 2px #fff6d6,inset 0 0 22px rgba(255,255,255,.35),0 3px 0 rgba(0,0,0,.35)!important}  body.kbnav .overlay input:focus{outline:2px solid #ffd166!important;outline-offset:1px!important;box-shadow:none!important} .logo .lt.s{animation:weld .55s cubic-bezier(.2,1.4,.4,1) both,float 3.2s ease-in-out infinite;animation-delay:inherit} .logo .lt.b{animation:screw .6s cubic-bezier(.25,1.3,.4,1) both,float 3.2s ease-in-out infinite;animation-delay:inherit} @keyframes weld{0%{opacity:0;transform:scale(1.8);filter:brightness(4) blur(6px);color:#fff}60%{opacity:1;filter:brightness(2.2) blur(0);color:#fff6d0}100%{opacity:1;transform:scale(1);filter:none}} @keyframes screw{0%{opacity:0;transform:rotate(-540deg) scale(.1)}70%{opacity:1;transform:rotate(12deg) scale(1.08)}100%{opacity:1;transform:rotate(0) scale(1)}} .logo.slam{animation:logoSlam .45s ease-out} @keyframes logoSlam{0%{transform:scale(1.12);filter:brightness(2.2)}100%{transform:scale(1);filter:none}} .logo{position:relative;transform:perspective(900px) rotateX(var(--rx,6deg)) rotateY(var(--ry,0deg));transform-style:preserve-3d;transition:transform .25s ease-out} .b3dbadge{position:absolute;right:-.35em;bottom:-.95em;font:900 .62em var(--display);perspective:500px;animation:b3dIn .7s cubic-bezier(.2,1.6,.4,1) both;z-index:2} .b3dbadge i{display:inline-block;font-style:normal;padding:.05em .28em;border-radius:.18em;background:linear-gradient(160deg,#e9f1ff 0%,#9fb4d6 45%,#5d6f8e 55%,#c9d6e8 100%);color:#16233a;text-shadow:0 1px 0 #fff;box-shadow:0 1px 0 #7b8aa6,0 2px 0 #6f7e99,0 3px 0 #63718b,0 4px 0 #57647e,0 5px 0 #4b5770,0 6px 0 #3f4a62,0 10px 18px rgba(0,0,0,.6),0 0 30px rgba(127,232,224,.45);transform:rotate(-12deg);animation:b3dSpin 6s ease-in-out 3.5s infinite} @keyframes b3dIn{0%{opacity:0;transform:scale(3) rotate(-40deg);filter:brightness(3)}100%{opacity:1;transform:none;filter:none}} @keyframes b3dSpin{0%,70%{transform:rotate(-12deg) rotateY(0)}85%{transform:rotate(-12deg) rotateY(360deg)}100%{transform:rotate(-12deg) rotateY(360deg)}} html,body,body *{-webkit-user-select:none;user-select:none;-webkit-user-drag:none} input,textarea,[contenteditable]{-webkit-user-select:text;user-select:text} ::selection{background:transparent}</style>');

// не браузер: без контекстного меню, перетаскивания картинок и выделения всего по Ctrl+A
addEventListener('contextmenu',e=>{ if(!(e.target&&e.target.closest&&e.target.closest('input,textarea,#editor canvas'))) e.preventDefault(); });
addEventListener('dragstart',e=>e.preventDefault());
addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&e.code==='KeyA'&&!(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))) e.preventDefault(); });
