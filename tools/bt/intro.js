/* ===== вступительный ролик (показ один раз при первом запуске; повтор — в Настройках) ===== */
(function(){
  const KEY='ib-intro-seen-v1';
  const SUB={
    ru:[[1.8,4.8,'Тихая ночь в старой мастерской.'],[4.9,7.9,'Искра и Болт наконец-то отдыхают.'],[8.0,10.4,'Всё спокойно… слишком спокойно.'],[10.8,14.3,'Но что-то в глубине мастерской проснулось.'],[14.5,18.5,'Машины оживают одна за другой.'],[19.6,22.8,'Бежать! Только вместе!'],[23.0,26.2,'Так начинается их история.']],
    uk:[[1.8,4.8,'Тиха ніч у старій майстерні.'],[4.9,7.9,'Іскра і Болт нарешті відпочивають.'],[8.0,10.4,'Все спокійно… занадто спокійно.'],[10.8,14.3,'Але щось у глибині майстерні прокинулося.'],[14.5,18.5,'Машини оживають одна за одною.'],[19.6,22.8,'Тікати! Тільки разом!'],[23.0,26.2,'Так починається їхня історія.']],
    en:[[1.8,4.8,'A quiet night in the old workshop.'],[4.9,7.9,'Iskra and Bolt are finally resting.'],[8.0,10.4,'All is calm… too calm.'],[10.8,14.3,'But something deep in the workshop has awoken.'],[14.5,18.5,'The machines come alive, one by one.'],[19.6,22.8,'Run! Only together!'],[23.0,26.2,'This is where their story begins.']]
  };
  const UI={ru:{skip:'Пропустить',snd:'🔊 Нажмите — включить звук',replay:'🎬 Смотреть вступление'},uk:{skip:'Пропустити',snd:'🔊 Натисніть — увімкнути звук',replay:'🎬 Дивитись вступ'},en:{skip:'Skip',snd:'🔊 Tap to turn sound on',replay:'🎬 Watch the intro'}};
  const lang=(typeof LANG==='string'&&SUB[LANG])?LANG:'ru', subs=SUB[lang], ui=UI[lang];
  window.__introUI=ui;
  document.head.insertAdjacentHTML('beforeend','<style>#introMovie{position:fixed;inset:0;z-index:10000;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .45s}#introMovie.on{opacity:1}#introMovie video{width:100%;height:100%;object-fit:contain;background:#000}#introMovie .isub{position:absolute;left:50%;bottom:7vh;transform:translateX(-50%);max-width:88vw;text-align:center;font-family:Unbounded,"Arial Black",sans-serif;font-weight:700;font-size:clamp(13px,2.5vw,28px);line-height:1.3;color:#fff;background:rgba(5,9,20,.6);padding:.45em 1em;border-radius:.7em;text-shadow:0 2px 8px #000;opacity:0;transition:opacity .35s;pointer-events:none}#introMovie .isub.on{opacity:1}#introMovie .iskip{position:absolute;right:16px;top:14px;border:1px solid rgba(255,255,255,.35);background:rgba(5,9,20,.55);color:#e8effa;font:600 13px Unbounded,"Arial Black",sans-serif;padding:8px 14px;border-radius:999px;cursor:pointer;opacity:.75}#introMovie .iskip:hover{opacity:1}#introMovie .isnd{position:absolute;left:50%;top:14px;transform:translateX(-50%);border:0;background:rgba(255,209,102,.92);color:#1a1200;font:700 13px Unbounded,"Arial Black",sans-serif;padding:8px 16px;border-radius:999px;cursor:pointer;display:none}</style>');
  let busy=false;
  function play(force){
    if(busy) return; busy=true;
    const d=document.createElement('div'); d.id='introMovie';
    d.innerHTML='<video playsinline webkit-playsinline preload="auto" src="intro.mp4"></video><div class="isub notr"></div><button class="iskip notr" type="button"></button><button class="isnd notr" type="button"></button>';
    const v=d.querySelector('video'), sub=d.querySelector('.isub'), sk=d.querySelector('.iskip'), sn=d.querySelector('.isnd');
    sk.textContent=ui.skip+' ▸'; sn.textContent=ui.snd;
    document.body.appendChild(d); requestAnimationFrame(()=>d.classList.add('on'));
    let done=false, cur=-1, started=false;
    try{ localStorage.setItem(KEY,'1'); }catch(e){}
    const EVS=['keydown','keyup','pointerdown','pointerup','click','touchstart','touchend','wheel','mousedown','mouseup'];
    function finish(){
      if(done) return; done=true; cancelAnimationFrame(gp);
      for(const ev of EVS) removeEventListener(ev,block,{capture:true});
      d.classList.remove('on'); try{ v.pause(); }catch(e){}
      setTimeout(()=>{ d.remove(); busy=false; try{ lastAct=performance.now(); }catch(e){} },480);
    }
    function unmute(){ if(v.muted){ v.muted=false; } sn.style.display='none'; }
    function block(e){
      const inside=d.contains(e.target);
      if(e.type==='keydown'&&(e.code==='Escape'||e.code==='Enter'||e.code==='Space'||e.code==='NumpadEnter')){ e.preventDefault(); e.stopImmediatePropagation(); finish(); return; }
      if(inside&&(e.type==='click'||e.type==='pointerdown'||e.type==='touchstart')&&(e.target===sk)){ e.preventDefault(); e.stopImmediatePropagation(); if(e.type==='click') finish(); return; }
      if(inside&&(e.type==='click'||e.type==='touchend')){ unmute(); }
      e.preventDefault(); e.stopImmediatePropagation();
    }
    for(const ev of EVS) addEventListener(ev,block,{capture:true,passive:false});
    let prev=false, gp=0;
    (function poll(){ if(done) return; try{ const g=[...(navigator.getGamepads?navigator.getGamepads():[])].filter(Boolean); const pr=g.some(p=>p.buttons.some((b,i)=>b.pressed&&(i===0||i===1||i===9))); if(pr&&!prev&&started) finish(); prev=pr; }catch(e){} gp=requestAnimationFrame(poll); })();
    v.addEventListener('timeupdate',()=>{ const t=v.currentTime; let k=-1; for(let i=0;i<subs.length;i++) if(t>=subs[i][0]&&t<subs[i][1]){ k=i; break; } if(k!==cur){ cur=k; if(k<0) sub.classList.remove('on'); else { sub.textContent=subs[k][2]; sub.classList.add('on'); } } });
    v.addEventListener('ended',finish); v.addEventListener('error',finish);
    v.addEventListener('playing',()=>{ started=true; });
    v.muted=false;
    const p=v.play();
    if(p&&p.catch) p.catch(()=>{ v.muted=true; const q=v.play(); if(q&&q.catch) q.catch(()=>finish()); sn.style.display='block'; });
  }
  window.playIntro=play;
  // первый запуск: после заставки с авторами
  function auto(){
    try{ if(navigator.webdriver||localStorage.getItem(KEY)||/[?&]nointro/.test(location.search)) return; }catch(e){}
    const t0=performance.now();
    (function wait(){ if(document.getElementById('splash')&&performance.now()-t0<9000) return setTimeout(wait,150); play(); })();
  }
  if(document.readyState==='complete') setTimeout(auto,300); else addEventListener('load',()=>setTimeout(auto,300));
})();
