/* ===== вступительный ролик (показ один раз при первом запуске; повтор — в Настройках) ===== */
(function(){
  const KEY='ib-intro-seen-v1';
  const SUB={
    ru:[[0.3,1.9,'Тихая ночь в старой мастерской.'],[2.6,5.8,'Но что-то в глубине мастерской проснулось.'],[6.2,9.8,'Машины оживают одна за другой.'],[10.2,13.8,'Красная тревога! Огонь Искры вспыхивает.'],[14.4,21.6,'Вместе они включают старый механизм.'],[22.4,29.6,'Дальше путь лежит через цеха, полные ловушек.'],[30.4,35.6,'Главное — не бояться, пока вы вместе.'],[36.4,47.6,'Впереди огромный завод. И у него есть хозяева.'],[48.4,55.6,'Но вдали уже виден свет выхода.'],[56.2,60.6,'Бежать! Только вместе!'],[62.6,66.0,'Так начинается их история.']],
    uk:[[0.3,1.9,'Тиха ніч у старій майстерні.'],[2.6,5.8,'Але щось у глибині майстерні прокинулося.'],[6.2,9.8,'Машини оживають одна за одною.'],[10.2,13.8,'Червона тривога! Вогонь Іскри спалахує.'],[14.4,21.6,'Разом вони вмикають старий механізм.'],[22.4,29.6,'Далі шлях лежить через цехи, повні пасток.'],[30.4,35.6,'Головне — не боятися, поки ви разом.'],[36.4,47.6,'Попереду величезний завод. І в нього є господарі.'],[48.4,55.6,'Але вдалині вже видно світло виходу.'],[56.2,60.6,'Тікати! Тільки разом!'],[62.6,66.0,'Так починається їхня історія.']],
    en:[[0.3,1.9,'A quiet night in the old workshop.'],[2.6,5.8,'But something deep in the workshop has awoken.'],[6.2,9.8,'The machines come alive, one by one.'],[10.2,13.8,'Red alert! Iskra\'s flame flares up.'],[14.4,21.6,'Together they switch on the old machine.'],[22.4,29.6,'Ahead lies a path through workshops full of traps.'],[30.4,35.6,'Just don\'t be afraid while you\'re together.'],[36.4,47.6,'A huge factory lies ahead. And it has owners.'],[48.4,55.6,'But the exit light is already in sight.'],[56.2,60.6,'Run! Only together!'],[62.6,66.0,'This is where their story begins.']]
  };
  const UI={ru:{skip:'Пропустить',snd:'🔊 Нажмите — включить звук',replay:'🎬 Смотреть вступление'},uk:{skip:'Пропустити',snd:'🔊 Натисніть — увімкнути звук',replay:'🎬 Дивитись вступ'},en:{skip:'Skip',snd:'🔊 Tap to turn sound on',replay:'🎬 Watch the intro'}};
  const lang=(typeof LANG==='string'&&SUB[LANG])?LANG:'ru', SUB_MAIN=SUB[lang], ui=UI[lang];
  const END={ru:[[56.6,60.8,'Они справились. Вместе.'],[62.6,66.2,'Спасибо, что прошли этот путь с ними.']],uk:[[56.6,60.8,'Вони впоралися. Разом.'],[62.6,66.2,'Дякуємо, що пройшли цей шлях з ними.']],en:[[56.6,60.8,'They made it. Together.'],[62.6,66.2,'Thanks for walking this road with them.']]}[lang];
  window.__introUI=ui;
  document.head.insertAdjacentHTML('beforeend','<style>#introMovie{position:fixed;inset:0;z-index:10000;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .45s}#introMovie.on{opacity:1}#introMovie video{width:100%;height:100%;object-fit:contain;background:#000}#introMovie .isub{position:absolute;left:50%;bottom:7vh;transform:translateX(-50%);max-width:88vw;text-align:center;font-family:Unbounded,"Arial Black",sans-serif;font-weight:700;font-size:clamp(13px,2.5vw,28px);line-height:1.3;color:#fff;background:rgba(5,9,20,.6);padding:.45em 1em;border-radius:.7em;text-shadow:0 2px 8px #000;opacity:0;transition:opacity .35s;pointer-events:none}#introMovie .isub.on{opacity:1}#introMovie .iskip{position:absolute;right:16px;top:14px;border:1px solid rgba(255,255,255,.35);background:rgba(5,9,20,.55);color:#e8effa;font:600 13px Unbounded,"Arial Black",sans-serif;padding:8px 14px;border-radius:999px;cursor:pointer;opacity:.75}#introMovie .iskip:hover{opacity:1}#introMovie .isnd{position:absolute;left:50%;top:14px;transform:translateX(-50%);border:0;background:rgba(255,209,102,.92);color:#1a1200;font:700 13px Unbounded,"Arial Black",sans-serif;padding:8px 16px;border-radius:999px;cursor:pointer;display:none}</style>');
  let busy=false;
  function play(force,o){
    if(busy) return; busy=true; o=o||{}; const subs=o.subs||SUB_MAIN;
    const d=document.createElement('div'); d.id='introMovie';
    d.innerHTML='<video playsinline webkit-playsinline preload="auto" src="intro.mp4"></video><div class="isub notr"></div><button class="iskip notr" type="button"></button><button class="isnd notr" type="button"></button>';
    const v=d.querySelector('video'), sub=d.querySelector('.isub'), sk=d.querySelector('.iskip'), sn=d.querySelector('.isnd');
    sk.textContent=ui.skip+' ▸'; sn.textContent=ui.snd;
    document.body.appendChild(d); requestAnimationFrame(()=>d.classList.add('on'));
    let done=false, cur=-1, started=false;
    if(!o.start){ try{ localStorage.setItem(KEY,'1'); }catch(e){} }
    const EVS=['keydown','keyup','pointerdown','pointerup','click','touchstart','touchend','wheel','mousedown','mouseup'];
    function finish(){
      if(done) return; done=true; cancelAnimationFrame(gp);
      for(const ev of EVS) removeEventListener(ev,block,{capture:true});
      d.classList.remove('on'); try{ v.pause(); }catch(e){}
      setTimeout(()=>{ d.remove(); busy=false; try{ lastAct=performance.now(); }catch(e){} if(o.onEnd) try{ o.onEnd(); }catch(e){} },480);
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
    if(o.start){ v.addEventListener('loadedmetadata',()=>{ try{ v.currentTime=o.start; }catch(e){} },{once:true}); }
    v.muted=false;
    const p=v.play();
    if(p&&p.catch) p.catch(()=>{ v.muted=true; const q=v.play(); if(q&&q.catch) q.catch(()=>finish()); sn.style.display='block'; });
  }
  window.playIntro=play;
  // концовка: последние кадры ролика — герои выходят на свет и название
  window.playEnding=function(onEnd){ if(navigator.webdriver&&!window.__forceEnding){ onEnd&&onEnd(); return; } play(true,{start:56.2,subs:END,onEnd}); };
  // первый запуск: после заставки с авторами
  function auto(){
    try{ if(navigator.webdriver||localStorage.getItem(KEY)||/[?&]nointro/.test(location.search)) return; }catch(e){}
    const t0=performance.now();
    (function wait(){ if(document.getElementById('splash')&&performance.now()-t0<9000) return setTimeout(wait,150); play(); })();
  }
  if(document.readyState==='complete') setTimeout(auto,300); else addEventListener('load',()=>setTimeout(auto,300));
})();
