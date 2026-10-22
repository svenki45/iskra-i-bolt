/* ===== touch polish: fit menus to screen, drop keyboard hints ===== */
const isTouchUI=()=>document.body.classList.contains('touch');
function fitOverlay(){ if(!overlay) return; const c=overlay.querySelector(':scope > .card'); if(!c) return; c.style.transform=''; c.style.marginBottom=''; c.style.zoom='';
  if(overlay.hidden) return;
  const cs=getComputedStyle(overlay), avH=Math.min(overlay.clientHeight,innerHeight)-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)-6, avW=Math.min(overlay.clientWidth,innerWidth)-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-6, h=c.offsetHeight, w=c.offsetWidth; if(!h||!w) return;
  const r=Math.min(1,avH/h,avW/w); if(r<.7&&!overlay.querySelector('.ctabs')&&overlay.querySelector('.shop')){ customTabs(overlay); if(overlay.querySelector('.ctabs')) return fitOverlay(); } if(r<.99){ const k=Math.max(isTouchUI()?.4:.5,r); c.style.transformOrigin='top center'; c.style.transform='scale('+k.toFixed(3)+')'; c.style.marginBottom=(-h*(1-k)).toFixed(1)+'px'; } }
const KEYHINT=/\s*·\s*(Enter|Esc|Tab|Пробел|Space)(?=\s*$)/g;
const tabMem={};
function customTabs(root){ if(!root.querySelectorAll) return; root.querySelectorAll('.shop').forEach(sh=>{ const hs=[...sh.children].filter(c=>c.classList.contains('hero')); if(hs.length!==2||sh.previousElementSibling&&sh.previousElementSibling.classList.contains('ctabs')) return;
  const names=hs.map(h=>{ const t=h.querySelector('h3'); return t?(t.firstChild&&t.firstChild.nodeType===3?t.firstChild.data:t.textContent).trim():''; }); if(names.some(n=>!n)) return;
  const key=names.join('|'); let cur=tabMem[key]||0;
  const t=document.createElement('div'); t.className='opts ctabs'; t.innerHTML=names.map(n=>`<button type="button" class="opt">${n}</button>`).join(''); sh.before(t); sh.style.gridTemplateColumns='1fr';
  const apply=()=>{ hs.forEach((h,i)=>h.hidden=i!==cur); [...t.children].forEach((b,i)=>b.classList.toggle('on',i===cur)); requestAnimationFrame(fitOverlay); };
  [...t.children].forEach((b,i)=>b.onclick=()=>{ cur=tabMem[key]=i; apply(); }); apply(); }); }
function touchClean(root){ if(!isTouchUI()) return; customTabs(root);
  const w=document.createTreeWalker(root,4); let n; const fix=[];
  while(n=w.nextNode()) if(KEYHINT.test(n.data)){ KEYHINT.lastIndex=0; fix.push(n); }
  for(const t of fix) t.data=t.data.replace(KEYHINT,'');
  root.querySelectorAll&&root.querySelectorAll('.padst,.keys,.hint').forEach(p=>{ if(/WASD|Стрелк|клавиш|Enter|Esc\b|\[ \]/.test(p.textContent)&&!p.closest('.helpbody')) p.style.display='none'; });
}
const refit=()=>{ requestAnimationFrame(fitOverlay); setTimeout(fitOverlay,250); setTimeout(fitOverlay,900); };
try{ document.fonts&&document.fonts.ready.then(refit); document.fonts&&document.fonts.addEventListener&&document.fonts.addEventListener('loadingdone',refit); }catch(e){}
addEventListener('orientationchange',()=>setTimeout(refit,300));
{ const ob=new MutationObserver(()=>{ touchClean(overlay); refit(); }); ob.observe(overlay,{childList:true,subtree:true}); addEventListener('resize',()=>requestAnimationFrame(fitOverlay)); }
{ const f=CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText=function(t,...a){ if(typeof t==='string'&&isTouchUI()){ if(t==='Enter — пропустить'||t==='прыжок — пропустить') t='Коснитесь — пропустить'; } return f.call(this,t,...a); }; }
