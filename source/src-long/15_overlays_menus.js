/* ================= overlays ================= */
const fmt=s=>{ s=Math.floor(s); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
let ctlBack='menu', prevCapBtns=null;
function pollPadCapture(){
  if(!capture||capture.type!=='pad') return;
  const gp=padFor(capture.kind==='spark'?0:1); if(!gp){ return; }
  const now=gp.buttons.map(b=>!!(b&&(b.pressed||b.value>0.5)));
  if(prevCapBtns){ for(let i=0;i<Math.min(12,now.length);i++){ if(now[i]&&!prevCapBtns[i]){ assignPad(capture.kind,capture.action,i); capture=null; prevCapBtns=null; setState('controls'); return; } } }
  prevCapBtns=now;
}
const maxPick=()=>cheat?TOTAL:Math.min(TOTAL,best+1);
function focusKey(el){
  if(!el||!overlay.contains(el)) return null;
  if(el.id) return '#'+el.id;
  const ds=Object.entries(el.dataset).map(([k,v])=>`[data-${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}="${v}"]`).join('');
  return ds||null;
}
function gearSvg(c){ return `<svg viewBox="-50 -50 100 100"><path fill="${c}" d="${(()=>{let d='';for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=i%2?38:46;d+=(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(Math.sin(a)*r).toFixed(1);}return d+'Z';})()}M0 -16A16 16 0 1 0 0.01 -16Z" fill-rule="evenodd"/></svg>`; }
function decoBase(){ return `<div class="hbg s"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div><div class="hbg b"></div><div class="hbg d"></div><i class="g g1">${gearSvg('rgba(255,138,61,.16)')}</i><i class="g g2">${gearSvg('rgba(98,199,193,.14)')}</i><i class="g g3">${gearSvg('rgba(231,181,74,.12)')}</i><i class="g g4">${gearSvg('rgba(156,195,255,.10)')}</i>`+Array.from({length:14},(_,i)=>`<b class="sp" style="left:${(i*37)%100}%;animation-delay:${-(i*0.7)%6}s;animation-duration:${5+(i%5)}s"></b>`).join(''); }
function setState(s){
  if(edTest&&(s==='menu'||s==='title')){ ED.endTest(false); return; }
  const prevState=state, fk=focusKey(document.activeElement);
  if(s==='play'){ prevPad[0]={j:true,a:true}; prevPad[1]={j:true,a:true}; }
  document.body.classList.toggle('cine',s==='prologue'||s==='ending');
  state=s; overlay.hidden=(s==='play'||s==='dying'||s==='touchedit'||s==='ending'||s==='prologue'); { const tb=document.getElementById('tedbar'); if(tb&&s!=='touchedit') tb.hidden=true; }
  overlay.classList.toggle('clear',s==='title'); if(s!=='hero'){ overlay.classList.toggle('hs',solo&&soloHero==='spark'); overlay.classList.toggle('hb',solo&&soloHero==='bolt'); overlay.classList.toggle('hd',!solo); } else overlay.classList.remove('hd'); overlay.classList.toggle('pz',s!=='title'&&s!=='play'&&s!=='dying');
  if(s==='title'){
    const word=(w,cls,d0)=>[...w].map((ch,i)=>`<span class="lt ${cls}" style="animation-delay:${(d0+i*0.07).toFixed(2)}s">${ch}</span>`).join('');
    overlay.innerHTML=`<div class="titlescr">
      <div class="logo" aria-label="Искра и Болт">${word('ИСКРА','s',0.15)}<span class="lt amp" style="animation-delay:.6s">и</span>${word('БОЛТ','b',0.7)}<span class="beta">БЕТА</span></div>
      <p class="tag">Кооператив на двоих · 100 уровней · 10 боссов</p>
      <div class="startwrap"><div class="modes"><button class="${solo?'primary':'secondary'} start mode" id="bOne" type="button">1 ИГРОК<small>выбрать героя</small></button><button class="${solo?'secondary':'primary'} start mode" id="bTwo" type="button">2 ИГРОКА<small>${window.MOBILE_BUILD?"на одном телефоне":"за одной клавиатурой"}</small></button></div><button class="secondary" id="bOnline" type="button" style="margin-top:10px">🌐 ОНЛАЙН<small>${window.MOBILE_BUILD?"подключиться к другу на ПК":"играть с другом по интернету"}</small></button>${window.MOBILE_BUILD?'':'<div style="display:flex;gap:10px;justify-content:center;margin-top:10px"><button class="secondary" id="tEditor" type="button">🛠 КОНСТРУКТОР<small style="margin-left:8px">свои уровни</small></button><button class="secondary" id="tMyGame" type="button">📚 МОЯ ИГРА<small style="margin-left:8px">из моих уровней</small></button></div>'}
      <p class="press">Стрелки и Enter, или крестовина и A на геймпаде</p></div>
    </div>`;
    for(const [id,k] of [['bOne','one'],['bTwo','two']]){ const el=$(id); el.addEventListener('mouseenter',()=>titleFocus=k); el.addEventListener('focus',()=>titleFocus=k); }
    $('bOne').onclick=()=>{ audioInit(); sfx('nav'); heroBack='title'; setState('hero'); };
    $('bOnline').onclick=()=>{ audioInit(); sfx('nav'); NET.status=''; setState('net'); }; if($('tEditor')){ $('tEditor').onclick=()=>{ audioInit(); sfx('nav'); ED.open(); }; $('tMyGame').onclick=()=>{ audioInit(); sfx('nav'); ED.open(); ED.game(); }; } $('bTwo').onclick=()=>{ setMode(false); goMenuFromTitle(); };
    setTimeout(()=>{ try{ $(solo?'bOne':'bTwo').focus({preventScroll:true}); }catch(e){} },0);
  } else if(s==='menu'){
    const cont=best>0&&best<TOTAL, got=Object.keys(achGot).length, LS=latestSlot();
    overlay.innerHTML=`<div class="card menu">
      <h2 class="mlogo"><span class="s">Искра</span> и <span class="b">Болт</span><span class="beta sm">БЕТА</span></h2>
      <div class="mlist">
        ${LS>=0?`<button class="primary mbig" id="bCont" type="button">Продолжить<small>слот ${LS+1} · ${MODE_NAME(slots[LS].mode)} · ${(slots[LS].run&&DIFFS[slots[LS].run.diff]||DIFFS.normal).n}${slots[LS].run&&slots[LS].run.ng?' НИ+'+slots[LS].run.ng:''} · уровень ${Math.min(TOTAL,slots[LS].best+1)}</small></button>
        <button class="secondary" id="bNew" type="button">Новая игра<small>выбрать слот</small></button>
        <button class="secondary" id="bLoad" type="button">Загрузить<small>${slots.filter(Boolean).length} из ${SLOT_N} слотов</small></button>`:`<button class="primary mbig" id="bNew" type="button">Играть<small>новая игра</small></button>`}
        ${(best>0||cheat)?`<button class="secondary" id="bLv" type="button">Выбрать уровень</button>`:''}
        <button class="secondary" id="bNet" type="button">Онлайн<small>${NET.role?'идёт игра · '+NET.code:'2 игрока по сети'}</small></button>
        <button class="secondary" id="bMode" type="button">Режим<small>${solo?'1 игрок · '+(soloHero==='spark'?'Искра':'Болт'):'2 игрока'}</small></button>
        <button class="secondary" id="bShopM" type="button">Лавка<small>${run.wallet.toLocaleString('ru-RU')} очков</small></button>
        <button class="secondary" id="bShop" type="button">Внешний вид</button>
        <button class="secondary" id="bAch" type="button">Достижения<small>${got} из ${ACH.length}</small></button>
        <button class="secondary" id="bHelp" type="button">Помощь</button>
        <button class="secondary" id="bCtl" type="button">Кнопки</button>
        <button class="secondary" id="bSet" type="button">Настройки</button>
        ${window.MOBILE_BUILD?'':'<button class="secondary" id="bEditor" type="button">Конструктор<small>свои уровни</small></button><button class="secondary" id="bMyGame" type="button">Моя игра<small>собранная из моих уровней</small></button>'}<button class="secondary" id="bToTitle" type="button">На главный экран<small>выбор режима игры</small></button>
        ${cheatMenu?`<button class="secondary" id="bCheats" type="button">Читы<small>${anyCheat()?'включены':'выключены'}</small></button>`:''}
      </div>
      <p class="mfoot">Стрелки, WASD или геймпад · Enter / A выбрать · Esc / B назад</p>
    </div>`;
    $('bShop').onclick=()=>setState('custom'); $('bMode').onclick=()=>{ heroBack='menu'; if(solo){ setMode(false); loadLevel(Math.min(TOTAL-1,best)); renderLegend(true); setState('menu'); } else setState('hero'); }; $('bShopM').onclick=()=>{ shopFrom='menu'; setState('shop'); }; if($('bEditor')) $('bEditor').onclick=()=>ED.open(); $('bToTitle').onclick=()=>{ sfx('nav'); setState('title'); }; if($('bMyGame')) $('bMyGame').onclick=()=>{ ED.open(); ED.game(); }; $('bSet').onclick=()=>{ ctlBack='menu'; setState('settings'); }; $('bCtl').onclick=()=>{ if(touchUI.on){ editBack='menu'; setState('touchedit'); return; } ctlBack='menu'; setState('controls'); }; $('bAch').onclick=()=>setState('ach');
    $('bHelp').onclick=()=>{ helpBack='menu'; setState('help'); };
    $('bNet').onclick=()=>{ if(NET.role==='host'){ startGame(Math.min(TOTAL-1,best)); return; } setState('net'); };
    if(cheatMenu) $('bCheats').onclick=()=>setState('cheats');
    $('bNew').onclick=()=>{ if(!slots.some(Boolean)){ newSlotTarget=0; setState('diffpick'); return; } slotMode='new'; slotDel=-1; setState('slots'); };
    if($('bLoad')) $('bLoad').onclick=()=>{ slotMode='load'; slotDel=-1; setState('slots'); };
    if(LS>=0) $('bCont').onclick=()=>{ applySlot(LS); startGame(Math.min(TOTAL-1,best)); };
    if(best>0||cheat) $('bLv').onclick=()=>setState('levels');
  } else if(s==='hero'){
    overlay.innerHTML=`<div class="card wide"><span class="eyebrow">Один игрок</span><h2>Выберите героя</h2>
      <div class="shop">
        <button type="button" class="hero s pickhero" id="bHS"><h3>Искра</h3><canvas id="pvS" width="240" height="240" aria-hidden="true"></canvas>
          <ul><li>Прыгает второй раз в воздухе</li><li>Рывок через длинные шипы</li><li>Пролезает в узкие щели</li><li>Быстрые огненные искры</li></ul></button>
        <button type="button" class="hero b pickhero" id="bHB"><h3>Болт</h3><canvas id="pvB" width="240" height="240" aria-hidden="true"></canvas>
          <ul><li>Толкает ящики на кнопки</li><li>Удар сверху ломает пол и давит врагов</li><li>Тяжёлые гайки, вдвое больше урона</li><li>Прыгает ниже, зато крепкий</li></ul></button>
      </div>
      <p class="padst">Уровни собираются под умения героя. У каждого героя свой прогресс, очки и улучшения.</p>
      <div class="btns"><button class="secondary" id="bHBack" type="button">Назад · Esc</button></div></div>`;
    $('bHS').onclick=()=>{ setMode(true,'spark'); goMenuFromTitle(); };
    { const lay=`<div class="hbg s"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div><div class="hbg b"></div>`;
      const pick=k=>{ overlay.classList.toggle('hs',k==='s'); overlay.classList.toggle('hb',k==='b'); };
      for(const [id,k] of [['bHS','s'],['bHB','b']]){ const el=$(id); el.addEventListener('mouseenter',()=>pick(k)); el.addEventListener('focus',()=>pick(k)); } }
    $('bHB').onclick=()=>{ setMode(true,'bolt'); goMenuFromTitle(); };
    $('bHBack').onclick=()=>setState(heroBack);
    setTimeout(()=>{ try{ $(soloHero==='bolt'?'bHB':'bHS').focus({preventScroll:true}); }catch(e){} },0);
  } else if(s==='loading'){
    const J=loadJob||{i:levelIdx,name:'',tip:'',isBoss:false};
    overlay.innerHTML=`<div class="card load"><span class="eyebrow">Глава ${chapterOf(J.i)+1} · ${CHAPTERS[chapterOf(J.i)]}</span><span class="eyebrow" style="opacity:.7">${J.isBoss?'Уровень '+(J.i+1)+' · БОСС':'Уровень '+(J.i+1)+' из '+TOTAL}${isDarkLevel(J.i+1)&&!J.isBoss?' · 🌑 тьма':''} · ${DIFFS[diffId()].n}${run.ng?' НИ+'+run.ng:''}</span>
      <div class="ldgear">${gearSvg(J.isBoss?'#ff6b6b':'#e7b54a')}</div>
      <h2 class="${J.isBoss?'ldboss':''}">${J.name}</h2>
      <div class="ldtrack"><div class="ldbar" id="ldBar"></div></div>
      <div class="ldrow"><span id="ldStep">Загрузка…</span><span id="ldPc">0%</span></div>
      ${J.tip?`<p class="padst ldtip"><b>Совет:</b> ${J.tip}</p>`:''}</div>`;
  } else if(s==='net'){
    const hosting=NET.waiting&&NET.code;
    overlay.innerHTML=`<div class="card"><span class="eyebrow">2 игрока · по интернету</span><h2>Онлайн</h2>
      ${hosting?`<p>Код комнаты — скажите его другу:</p><div class="netcode">${NET.code}</div><p class="padst">Вы играете за <b style="color:#ff8a3d">Искру</b>, друг — за <b style="color:#62c7c1">Болта</b>. Игра начнётся сама, как только он подключится.</p>`
      :`<div class="btns col"><button class="primary" id="bHost" type="button">Создать комнату<small>вы — Искра, хост</small></button></div>
      <div class="pick" style="margin-top:6px"><label for="netIn">Код друга</label><input id="netIn" type="text" maxlength="5" autocomplete="off" placeholder="ABCDE" style="text-transform:uppercase;letter-spacing:.2em;width:9ch"><button class="secondary" id="bJoin" type="button">Войти</button></div>
      <p class="padst">Друг создаёт комнату и диктует код из 5 символов. Вы вводите его и играете за Болта. Нужен интернет у обоих.</p>`}
      ${NET.status?`<p class="padst" id="netSt">${NET.status}</p>`:''}
      <p class="padst" style="opacity:.5;font-size:11px">Версия онлайна: ${NET_VER}</p>
      <div class="btns"><button class="secondary" id="bNetBack" type="button">${hosting?'Отменить':'Назад'} · Esc</button></div></div>`;
    if($('bHost')) $('bHost').onclick=()=>{ NET.status=''; netHost(); };
    if($('bJoin')){ const go2=()=>netJoin($('netIn').value); $('bJoin').onclick=go2; $('netIn').addEventListener('keydown',e=>{ if(e.key==='Enter') go2(); }); }
    $('bNetBack').onclick=()=>{ if(NET.waiting){ try{ NET.mq&&NET.mq.close(); }catch(e){} NET.mq=null; NET.waiting=false; } NET.status=''; setState('menu'); };
  } else if(s==='netwait'){
    overlay.innerHTML=`<div class="card"><span class="eyebrow">Онлайн · комната ${NET.code}</span><h2>Вы — Болт</h2><div class="ldgear">${gearSvg('#62c7c1')}</div><p id="netHostSt">Ждём хоста…</p><p class="padst">Управление: любые клавиши героя (стрелки или WASD) или геймпад. Esc — выйти.</p></div>`;
  } else if(s==='touchedit'){
    overlay.hidden=true; let tb=document.getElementById('tedbar'); if(!tb){ tb=document.createElement('div'); tb.id='tedbar'; document.body.appendChild(tb); }
    const pct=Math.round((touchLayout.field||1)*100);
    tb.innerHTML=`<b>Настройка</b><span>Тяните кнопки пальцем. Выбранная — жёлтая.</span>
      <div><button data-t="s-">Кнопка −</button><button data-t="s+">Кнопка +</button></div>
      <div><button data-t="f-">Поле −</button><span class="v">${pct}%</span><button data-t="f+">Поле +</button><button data-t="ov" class="${touchLayout.over?'on':''}">Кнопки поверх поля</button><button data-t="cam" class="${touchLayout.cam?'on':''}">Камера за героем</button></div>
      <div><button data-t="rs">Сбросить</button><button data-t="ok" class="ok">Готово</button></div>`;
    tb.hidden=false;
    tb.querySelectorAll('[data-t]').forEach(x=>x.onclick=()=>{ const t=x.dataset.t;
      if(t==='s-') editSize(-.15); else if(t==='s+') editSize(.15);
      else if(t==='f-'){ touchLayout.field=Math.max(.6,(touchLayout.field||1)-.05); saveTouchLayout(); setState('touchedit'); }
      else if(t==='f+'){ touchLayout.field=Math.min(1.6,(touchLayout.field||1)+.05); saveTouchLayout(); setState('touchedit'); }
      else if(t==='cam'){ touchLayout.cam=!touchLayout.cam; saveTouchLayout(); setState('touchedit'); }
      else if(t==='ov'){ touchLayout.over=!touchLayout.over; saveTouchLayout(); setState('touchedit'); }
      else if(t==='rs'){ touchLayout={b:{},field:1,over:false}; editSel=null; saveTouchLayout(); setState('touchedit'); }
      else if(t==='ok'){ tb.hidden=true; editSel=null; buildTouch(true); setState(editBack); } });
    setTimeout(()=>{ buildTouch(true); fit(); },0); return;
  } else if(s==='netleave'){
    overlay.innerHTML=`<div class="card"><span class="eyebrow">Онлайн</span><h2>Пауза</h2><div class="btns col"><button class="primary" id="bStay" type="button">Продолжить · Esc</button>${touchUI.on?'<button class="secondary" id="bTedit2" type="button">Кнопки и размер экрана</button>':''}<button class="secondary" id="bLeave" type="button">Выйти в меню</button></div></div>`;
    $('bStay').onclick=()=>guestResume(); $('bLeave').onclick=()=>netLeave(); if($('bTedit2')) $('bTedit2').onclick=()=>{ editBack='netleave'; setState('touchedit'); };
  } else if(s==='diffpick'){
    overlay.innerHTML=`<div class="card wide"><span class="eyebrow">Новая игра</span><h2>Сложность</h2>
      <div class="diffs">${Object.entries(DIFFS).map(([k,d])=>`<button type="button" class="${k==='normal'?'primary':'secondary'} diffb" data-diff="${k}" style="--dc:${d.c}"><b style="color:${k==='normal'?'inherit':d.c}">${d.n}</b><small>${d.d}</small></button>`).join('')}</div>
      <p class="padst">Сложность влияет на шипы, количество и силу врагов, скорость платформ, сердца и здоровье боссов. Поменять её можно только новой игрой.</p>
      <div class="btns"><button class="secondary" id="bDiffBack" type="button">Назад · Esc</button></div></div>`;
    overlay.querySelectorAll('[data-diff]').forEach(b=>b.onclick=()=>{ pendingDiff=b.dataset.diff; if(slots[newSlotTarget]) setState('confirmNew'); else doNewGame(newSlotTarget); });
    $('bDiffBack').onclick=()=>setState(slots.some(Boolean)?'slots':'menu');
  } else if(s==='slots'){
    const card=(x,i)=>{ const col=x?(x.mode==='spark'?'#ff8a3d':x.mode==='bolt'?'#62c7c1':'#ffd166'):'#5f7393';
      const info=x?`<div class="slmode" style="color:${col}">${MODE_NAME(x.mode)}</div><div class="sllvl">${x.run&&x.run.diff&&DIFFS[x.run.diff]?`<span style="color:${DIFFS[x.run.diff].c};font-weight:700">${DIFFS[x.run.diff].n}${x.run.ng?' · НИ+'+x.run.ng:''}</span> · `:''}Уровень ${Math.min(TOTAL,x.best+1)} <span>· ${getLevelName(x)}</span></div>
        <div class="slmeta">Очки ${((x.run&&x.run.score)||0).toLocaleString('ru-RU')} · Достижения ${Object.keys(x.ach||{}).length}/${ACH.length}</div><div class="slmeta">Сохранено ${fmtDate(x.saved)}${i===activeSlot?' · <b>текущий</b>':''}</div>`
        :'<div class="slempty">Пусто</div>';
      let btns='';
      if(slotMode==='load') btns=x?`<button class="primary" data-load="${i}" type="button">Загрузить</button><button class="secondary sldel" data-del="${i}" type="button">${slotDel===i?'Точно удалить?':'Удалить'}</button>`:'';
      else btns=`<button class="${x?'secondary':'primary'}" data-new="${i}" type="button">${x?'Перезаписать':'Начать здесь'}</button>`;
      return `<div class="slot ${x?'':'empty'}" style="--sc:${col}"><div class="slnum">${i+1}</div><div class="slinfo">${info}</div><div class="slbtns">${btns}</div></div>`; };
    overlay.innerHTML=`<div class="card wide"><span class="eyebrow">${slotMode==='load'?'Сохранения':'Новая игра · '+MODE_NAME(solo?soloHero:'2')}</span><h2>${slotMode==='load'?'Загрузить игру':'Выберите слот'}</h2>
      <div class="slots">${slots.map(card).join('')}</div>
      <p class="padst">${slotMode==='load'?'Игра сохраняется сама после каждого уровня, покупки в Лавке и полученного достижения.':'Новая игра запишется в выбранный слот. Режим меняется в главном меню кнопкой «Режим».'}</p>
      <div class="btns"><button class="secondary" id="bSlBack" type="button">Назад · Esc</button></div></div>`;
    overlay.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.load; applySlot(i); sfx('pick'); startGame(Math.min(TOTAL-1,best)); });
    overlay.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.del; if(slotDel!==i){ slotDel=i; sfx('nav'); setState('slots'); return; } slots[i]=null; if(activeSlot===i){ activeSlot=-1; store.set('iskra-bolt-slot',-1); } store.set('iskra-bolt-slots',slots); slotDel=-1; sfx('off'); if(!slots.some(Boolean)) setState('menu'); else setState('slots'); });
    overlay.querySelectorAll('[data-new]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.new; newSlotTarget=i; setState('diffpick'); });
    $('bSlBack').onclick=()=>setState('menu');
  } else if(s==='report'){
    const rows=Object.entries(LVS).map(([k,o])=>({k,...o,avg:o.c?Math.round(o.t/o.c):0})).sort((a,b)=>b.d-a.d);
    const md=m=>m==='2'?'двое':m==='spark'?'Искра':'Болт';
    const txt=rows.map(r=>`${md(r.k.split(':')[0])}, ур. ${r.k.split(':')[1]}: падений ${r.d}, пройден ${r.c} раз, ср. время ${r.avg} с`).join('\n');
    overlay.innerHTML=`<div class="card wide"><span class="eyebrow">Для тестов</span><h2>Отчёт по уровням</h2>
      <p class="padst">Дайте поиграть друзьям, потом откройте этот отчёт: сверху — уровни, где падали чаще всего. Там слишком сложно или непонятно.</p>
      <div style="max-height:46vh;overflow:auto;width:100%"><table class="rep"><tr><th>Режим</th><th>Уровень</th><th>Падений</th><th>Пройден</th><th>Ср. время</th></tr>
      ${rows.slice(0,40).map(r=>`<tr class="${r.d>=5?'hot':''}"><td>${md(r.k.split(':')[0])}</td><td>${r.k.split(':')[1]}</td><td>${r.d}</td><td>${r.c}</td><td>${r.avg?r.avg+' с':'—'}</td></tr>`).join('')||'<tr><td colspan="5">Пока нет данных — сыграйте пару уровней.</td></tr>'}</table></div>
      <div class="btns"><button class="secondary" id="bRepCopy" type="button">Скопировать</button><button class="secondary" id="bRepClr" type="button">Очистить</button><button class="primary" id="bRepBack" type="button">Назад · Esc</button></div></div>`;
    $('bRepCopy').onclick=()=>{ try{ navigator.clipboard.writeText(txt); $('bRepCopy').textContent='Скопировано!'; }catch(e){} };
    $('bRepClr').onclick=()=>{ LVS={}; try{ localStorage.removeItem('iskra-bolt-lvlstats'); }catch(e){} setState('report'); };
    $('bRepBack').onclick=()=>setState('settings');
  } else if(s==='story'){
    const [h,t]=STORY[storyI];
    overlay.innerHTML=`<div class="card story"><span class="eyebrow">${storyI+1} / ${STORY.length}</span><h2>${h}</h2><p class="stxt">${t}</p>
      <div class="sheroes"><canvas id="pvS" width="160" height="160"></canvas><canvas id="pvB" width="160" height="160"></canvas></div>
      <div class="btns"><button class="secondary" id="bSkip" type="button">Пропустить</button><button class="primary" id="bNext" type="button">${storyI<STORY.length-1?'Дальше · Enter':'В путь! · Enter'}</button></div></div>`;
    $('bNext').onclick=()=>{ sfx('nav'); if(++storyI>=STORY.length){ const f=storyNext; storyNext=null; f&&f(); } else setState('story'); };
    $('bSkip').onclick=()=>{ const f=storyNext; storyNext=null; f&&f(); };
  } else if(s==='confirmNew'){
    const mode=solo?('1 игрок · '+(soloHero==='spark'?'Искра':'Болт')):'2 игрока';
    overlay.innerHTML=`<div class="card"><span class="eyebrow" style="color:#ff6b6b">Новая игра · ${mode}</span><h2>Вы уверены?</h2>
      <p style="max-width:44ch">Слот ${newSlotTarget+1} будет перезаписан${slots[newSlotTarget]?' ('+MODE_NAME(slots[newSlotTarget].mode)+', уровень '+(slots[newSlotTarget].best+1)+')':''}. Сбросятся пройденные уровни, очки, кошелёк, улучшения из Лавки, рюкзак, реликвии и все достижения будут сброшены. Это нельзя отменить.</p>
      <p class="padst">Внешний вид героев, кнопки и настройки останутся.</p>
      <div class="btns col"><button class="primary" id="bNo" type="button">Нет, вернуться · Esc</button><button class="secondary" id="bYes" type="button" style="border-color:#ff6b6b;color:#ff9a9a">Да, начать заново</button></div></div>`;
    $('bNo').onclick=()=>setState('slots'); $('bYes').onclick=()=>{ sfx('off'); doNewGame(); };
  } else if(s==='cheats'){
    const row=(id,on,n,d)=>`<button type="button" class="opt cheat ${on?'on':''}" id="${id}" style="display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 14px"><span><b>${n}</b><br><small style="opacity:.75">${d}</small></span><span style="font-weight:700;color:${on?'#7fe08a':'#8fa6c8'}">${on?'ВКЛ':'ВЫКЛ'}</span></button>`;
    overlay.innerHTML=`<div class="card"><span class="eyebrow" style="color:#7fe08a">Секретное меню</span><h2>Читы</h2>
      <div style="display:grid;gap:8px">
        ${row('cGod',cheatGod,'Бессмертие','Враги, шипы и лава не ранят.')}
        ${row('cOne',cheatOne,'Убийство с одного попадания','Любой враг и любой босс падают с первого выстрела.')}
        ${row('cLv',cheat,'Выбор уровней','Открыты все 100 уровней, в игре [ и ] переключают уровни.')}
        <button type="button" class="opt cheat" id="cScore" style="width:100%;text-align:left;padding:12px 14px"><b>+100 000 очков</b><br><small style="opacity:.75">Сразу в кошелёк для Лавки.</small></button>
        <button type="button" class="opt cheat" id="cZero" style="width:100%;text-align:left;padding:12px 14px"><b>Сбросить очки</b><br><small style="opacity:.75">Очки и кошелёк станут 0. Улучшения из Лавки останутся.</small></button>
      </div>
      <p class="padst" style="margin-top:12px">${anyCheat()?'<b style="color:#ff6b6b">Читы включены: новые достижения не выдаются.</b> Выключите все читы, чтобы снова их получать.':'Включение любого чита даёт достижение «Я только посмотреть». Пока читы включены, другие достижения не выдаются.'}</p>
      <div class="btns"><button class="primary" id="bChBack" type="button">Назад · Esc</button></div></div>`;
    const tog=f=>()=>{ unlock('cheater'); f(); saveCheats(); sfx('pick'); setState('cheats'); };
    $('cGod').onclick=tog(()=>cheatGod=!cheatGod); $('cOne').onclick=tog(()=>cheatOne=!cheatOne); $('cLv').onclick=tog(()=>cheat=!cheat);
    $('cScore').onclick=()=>{ unlock('cheater'); addScore(100000); saveRun(); sfx('gear'); setState('cheats'); };
    $('cZero').onclick=()=>{ run.score=0; run.wallet=0; saveRun(); const el=document.getElementById('score'); if(el) el.textContent='0'; sfx('off'); setState('cheats'); };
    $('bChBack').onclick=()=>setState('menu');
  } else if(s==='levels'){
    overlay.innerHTML=`<div class="card"><span class="eyebrow">${cheat?'Чит: открыты все 100 уровней':'Открыто уровней: '+maxPick()} · ★ ${starCount()} из 300</span><h2>Выбрать уровень</h2>
      <div class="pick"><label for="lvlPick">Номер уровня</label><input id="lvlPick" type="number" min="1" max="${maxPick()}" value="${Math.min(TOTAL,best+1)}"><button class="primary" id="bGo" type="button">Играть</button></div>
      <div class="lvgrid">${Array.from({length:Math.min(TOTAL,maxPick())},(_,i)=>i).map(i=>{ const st=starsAll()[i]; return `<button type="button" class="opt lvb ${(i+1)%10===0?'bossb':''}" data-lv="${i}" title="${st&&st.bt?'Рекорд '+st.bt.toFixed(1)+' с':''}">${(i+1)%10===0?'Б':''}${i+1}${starHtml(st?st.s:0)}</button>`; }).join('')}</div>
      <p class="padst">Стрелками ↑↓ в поле меняется номер, или нажмите на уровень. ★ — пройден, быстрее нормы, без урона.</p>
      <div class="btns"><button class="secondary" id="bLvBack" type="button">Назад · Esc</button></div></div>`;
    const go=()=>{ const v=Math.max(1,Math.min(maxPick(),parseInt($('lvlPick').value,10)||1)); startGame(v-1); };
    $('bGo').onclick=go; $('lvlPick').addEventListener('keydown',e=>{ if(e.key==='Enter') go(); });
    overlay.querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>startGame(+b.dataset.lv));
    $('bLvBack').onclick=()=>setState('menu');
  } else if(s==='help'){
    const tabs=[['ctl','Управление'],['mech','Механики'],['bonus','Бонусы'],['foes','Враги и боссы'],['score','Очки и лавка']];
    overlay.innerHTML=`<div class="card wide help"><span class="eyebrow">Помощь</span><h2>Как играть</h2>
      <div class="tabs" role="tablist">${tabs.map(([k,n])=>`<button type="button" role="tab" class="opt ${helpTab===k?'on':''}" data-tab="${k}" aria-selected="${helpTab===k}">${n}</button>`).join('')}</div>
      <div class="helpbody">${helpHTML(helpTab)}</div>
      <div class="btns">${helpTab==='ctl'&&!touchUI.on?`<button class="secondary" id="bRebind" type="button">Переназначить кнопки</button>`:''}<button class="secondary" id="bPro" type="button">Посмотреть пролог</button><button class="primary" id="bHelpBack" type="button">Назад · Esc</button></div></div>`;
    overlay.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ helpTab=b.dataset.tab; setState('help'); });
    if($('bRebind')) $('bRebind').onclick=()=>{ ctlBack='help'; setState('controls'); };
    $('bHelpBack').onclick=()=>setState(helpBack);
    $('bPro').onclick=()=>{ const back=helpBack; storyNext=()=>setState(back==='pause'?'pause':'menu'); proT=0; setState('prologue'); };
  } else if(s==='ach'){
    const got=Object.keys(achGot).length;
    overlay.innerHTML=`<div class="card wide"><span class="eyebrow">Открыто ${got} из ${ACH.length}</span><h2>Достижения</h2>
      <div class="achs">${ACH.map((a,i)=>`<div class="ach ${achGot[a.id]?'got':''}">${achIcon(a.id,!!achGot[a.id])}<div><h4>${a.n}</h4><p>${a.d}</p></div></div>`).join('')}</div>
      <p style="font-size:13px;margin:0">Всего: шестерёнок ${stats.gears} · врагов ${stats.kills} · разных боссов ${stats.bosses.length} из 4</p>
      <div class="btns"><button class="primary" id="bBack" type="button">Назад · Esc</button></div></div>`;
    $('bBack').onclick=()=>setState('menu');
  } else if(s==='custom'){
    const row=(kind,list,field,swatch)=>list.map(it=>{
      const ok=reqOk(it), on=looks[kind][field]===it.id;
      const tip=ok?'':` title="Откроется за достижение «${achName(it.req)}»"`;
      return `<button type="button" class="opt ${on?'on':''}" data-kind="${kind}" data-field="${field}" data-id="${it.id}" ${ok?'':'aria-disabled="true"'}${tip}>${swatch?`<span class="sw" style="background:${it.body}"></span>`:''}${it.n}${ok?'':' · закрыто'}</button>`;
    }).join('');
    const picker=kind=>{ const on=looks[kind].skin==='custom'; return `<label class="opt cpick ${on?'on':''}" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="color" data-cp="${kind}" value="${looks[kind].color}" style="width:26px;height:22px;border:0;padding:0;background:none;cursor:pointer">Своя</label>`; };
    overlay.innerHTML=`<div class="card wide"><span class="eyebrow">Мастерская</span><h2>Внешний вид</h2>
      <div class="shop">
        <div class="hero s"><h3>Искра</h3><canvas id="pvS" width="240" height="240" aria-label="Превью Искры"></canvas>
          <span class="lab">Цвет</span><div class="opts">${row('spark',SKINS.spark,'skin',true)}${picker('spark')}</div>
          <span class="lab">Шапка</span><div class="opts">${row('spark',HATS,'hat',false)}</div>
          <span class="lab">Тело</span><div class="opts">${row('spark',LIMBS,'limbs',false)}</div>
          <span class="lab">Глаза</span><div class="opts">${row('spark',EYES,'eyes',false)}</div>
          <span class="lab">След</span><div class="opts">${row('spark',TRAILS,'trail',false)}</div></div>
        <div class="hero b"><h3>Болт</h3><canvas id="pvB" width="240" height="240" aria-label="Превью Болта"></canvas>
          <span class="lab">Цвет</span><div class="opts">${row('bolt',SKINS.bolt,'skin',true)}${picker('bolt')}</div>
          <span class="lab">Шапка</span><div class="opts">${row('bolt',HATS,'hat',false)}</div>
          <span class="lab">Тело</span><div class="opts">${row('bolt',LIMBS,'limbs',false)}</div>
          <span class="lab">Глаза</span><div class="opts">${row('bolt',EYES,'eyes',false)}</div>
          <span class="lab">След</span><div class="opts">${row('bolt',TRAILS,'trail',false)}</div></div>
      </div>
      <p style="font-size:13px" id="shopNote">Закрытые вещи открываются достижениями. Нажмите на закрытую, чтобы узнать какими.</p>
      <div class="btns"><button class="primary" id="bBack" type="button">Готово · Esc</button></div></div>`;
    overlay.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
      if(!b.dataset.field) return;
      if(b.getAttribute('aria-disabled')){ const list=b.dataset.field==='hat'?HATS:SKINS[b.dataset.kind]; const it=list.find(x=>x.id===b.dataset.id); $('shopNote').textContent=`«${it.n}» откроется за достижение «${achName(it.req)}»: ${ACH.find(a=>a.id===it.req).d}`; return; }
      looks[b.dataset.kind][b.dataset.field]=b.dataset.id; store.set('iskra-bolt-looks',looks); unlock('stylist');
      const sc=overlay.querySelector('.card').parentElement.scrollTop; setState('custom'); overlay.scrollTop=sc;
    });
    overlay.querySelectorAll('[data-cp]').forEach(inp=>{ const k=inp.dataset.cp;
      inp.oninput=()=>{ looks[k].color=inp.value; looks[k].skin='custom'; store.set('iskra-bolt-looks',looks); overlay.querySelectorAll(`[data-kind="${k}"][data-field="skin"]`).forEach(x=>x.classList.remove('on')); inp.parentElement.classList.add('on'); };
      inp.onchange=()=>{ unlock('stylist'); }; });
    $('bBack').onclick=()=>setState('menu');
  } else if(s==='settings'){
    const sl=(id,label,val)=>`<div class="srow"><label for="${id}">${label}</label><input type="range" id="${id}" min="0" max="100" value="${Math.round(val*100)}"><output id="${id}O">${Math.round(val*100)}%</output></div>`;
    const tg=(id,label,hint)=>`<label class="tog"><input type="checkbox" id="${id}" ${settings[id]?'checked':''}><span><b>${label}</b><small>${hint}</small></span></label>`;
    const q=settings.quality;
    overlay.innerHTML=`<div class="card wide"><span class="eyebrow">Настройки</span><h2>Звук и графика</h2>
      <div class="langrow notr"><span class="lab">Язык · Мова · Language</span><div class="opts">${[['ru','Русский'],['uk','Українська'],['en','English']].map(([k,n])=>`<button type="button" class="opt ${LANG===k?'on':''}" data-lang="${k}">${n}</button>`).join('')}</div></div>
      <div class="shop">
        <div class="hero"><h3>Звук</h3>
          ${sl('master','Общая громкость',settings.master)}${sl('music','Музыка',settings.music)}${sl('sfx','Эффекты',settings.sfx)}
          ${tg('mute','Выключить звук',touchUI.on?'':'То же делает клавиша M')}
          <span class="lab">Послушать музыку</span>
          <div class="opts">${[['menu','Меню'],['level','Уровни'],['boss_toad','Жаба'],['boss_eye','Око'],['boss_gear','Шестерня'],['boss_queen','Королева'],['boss_core','Механизм']].map(([k,n])=>`<button type="button" class="opt ${(previewSong||'menu')===k?'on':''}" data-song="${k}">${n}</button>`).join('')}</div>
          <p class="padst">Музыка пишется прямо в игре. У каждого босса своя тема, а когда у него остаётся половина здоровья, она становится плотнее.</p>
        </div>
        <div class="hero"><h3>Графика</h3>
          <span class="lab">Качество</span>
          <div class="opts">${[['low','Низкое'],['medium','Среднее'],['high','Высокое']].map(([k,n])=>`<button type="button" class="opt ${q===k?'on':''}" data-q="${k}">${n}</button>`).join('')}</div>
          ${sl('particles','Частицы',settings.particles)}
          ${tg('glow','Свечение','Свет от Искры, кнопок, выхода')}
          ${tg('ambient','Фон мастерской','Шестерни и пыль на заднем плане')}
          ${tg('trails','Следы','Хвосты за пулями и пыль из-под ног')}
          ${tg('vignette','Виньетка','Затемнение по краям экрана')}
          ${tg('shake','Тряска экрана','При ударах и взрывах')}
          ${tg('flash','Вспышки экрана','При уроне и победе над боссом')}
          ${tg('r3d','3D-окружение','Объёмные стены, свет и тени (2.5D)')}
          ${tg('retro','Ретро-экран','Полосы как на старом мониторе')}
        </div>
      </div>
      ${touchUI.on?'<div class="btns"><button class="secondary" id="bTedit3" type="button">Кнопки и размер экрана</button></div>':''}<div class="btns"><button class="secondary" id="bReport" type="button">Отчёт для тестов</button></div><div class="btns"><button class="secondary" id="bDef" type="button">Сбросить</button><button class="primary" id="bBack" type="button">Готово · Esc</button></div></div>`;
    for(const id of ['master','music','sfx','particles']){ const el=$(id); el.oninput=()=>{ settings[id]=el.value/100; $(id+'O').textContent=el.value+'%'; if(id==='particles') settings.quality='custom'; saveSettings(); applyVolumes(); if(id==='sfx'||id==='master') sfx('gear'); }; }
    for(const id of ['mute','glow','ambient','trails','vignette','shake','flash','retro','r3d']){ const el=$(id); el.onchange=()=>{ settings[id]=el.checked; if(id==='r3d'){ R3D.on=el.checked; document.body.classList.toggle('b3d',el.checked); const eb=document.getElementById('err3d'); if(eb) eb.remove(); } if(!['mute','shake','flash','retro','r3d'].includes(id)) settings.quality='custom'; saveSettings(); applyVolumes(); const sc=overlay.scrollTop; setState('settings'); overlay.scrollTop=sc; }; }
    overlay.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{ settings.quality=b.dataset.q; Object.assign(settings,PRESETS[b.dataset.q]); saveSettings(); fit(); const sc=overlay.scrollTop; setState('settings'); overlay.scrollTop=sc; });
    overlay.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{ if(b.dataset.lang!==LANG) setLang(b.dataset.lang); });
    overlay.querySelectorAll('[data-song]').forEach(b=>b.onclick=()=>{ audioInit(); previewSong=b.dataset.song; const sc=overlay.scrollTop; setState('settings'); overlay.scrollTop=sc; });
    $('bReport').onclick=()=>setState('report');
    if($('bTedit3')) $('bTedit3').onclick=()=>{ editBack='settings'; setState('touchedit'); };
    $('bDef').onclick=()=>{ settings=Object.assign({},DEF_SETTINGS); saveSettings(); applyVolumes(); fit(); setState('settings'); };
    $('bBack').onclick=()=>setState(ctlBack);
  } else if(s==='controls'){
    const ACT_C={jump:'#ffd166',ability:'#5fe3d9',fire:'#ff6b6b',use:'#c792ff',next:'#8fa6c8'};
    const col=(kind,pi)=>{
      const gp=padFor(pi), t=glyphType(pi), cap=a=>capture&&capture.kind===kind&&capture.action===a;
      const rows=ACTIONS.map(a=>{
        const nm=typeof ACT_NAME[a]==='string'?ACT_NAME[a]:ACT_NAME[a][kind];
        const kbBtn=`<button type="button" class="opt ${cap(a)&&capture.type==='kb'?'on':''}" data-cap="kb" data-kind="${kind}" data-act="${a}">${cap(a)&&capture.type==='kb'?'Нажмите клавишу…':kbd(binds[kind].kb[a])}</button>`;
        const padBtn=(a==='left'||a==='right')?`<span class="muted">стик / крестовина</span>`:
          `<button type="button" class="opt padopt ${cap(a)&&capture.type==='pad'?'on':''}" data-cap="pad" data-kind="${kind}" data-act="${a}"><i class="dot" style="background:${ACT_C[a]}"></i>${cap(a)&&capture.type==='pad'?'Выберите…':padGlyph(t,binds[kind].pad[a])}</button>`;
        return `<div class="crow"><span>${nm}</span>${kbBtn}${padBtn}</div>`;
      }).join('');
      const picking=capture&&capture.kind===kind&&capture.type==='pad';
      const palette=picking?`<div class="palette"><span class="padst">Нажмите кнопку на геймпаде или выберите здесь:</span><div class="pgrid">${[3,2,1,0,4,5,6,7,8,9,10,11].map(i=>`<button type="button" class="opt pick1 ${binds[kind].pad[capture.action]===i?'on':''}" data-padpick="${i}">${padGlyph(t,i)}</button>`).join('')}</div></div>`:'';
      return `<div class="hero ${kind==='spark'?'s':'b'}"><h3>${kind==='spark'?'Искра':'Болт'} <span class="padst">· ${gp?`геймпад <b>${PAD_TYPE_NAME[padType(gp)]}</b>`:'геймпад не подключён'}</span></h3>
        ${padDiagram(kind,t,ACT_C)}
        <div class="crow head"><span>Действие</span><span>Клавиатура</span><span>Геймпад</span></div>${rows}${palette}</div>`;
    };
    overlay.innerHTML=`<div class="card wide ctl"><span class="eyebrow">Настройки</span><h2>Кнопки</h2>
      <div class="padstyle"><span class="lab">Значки геймпада</span>${[['auto','Авто'],['xbox','Xbox'],['ps','PlayStation'],['switch','Switch']].map(([k,n])=>`<button type="button" class="opt ${settings.padStyle===k?'on':''}" data-pstyle="${k}">${n}</button>`).join('')}</div>
      <div class="shop">${col('spark',0)}${col('bolt',1)}</div>
      <div class="crow mapctl" style="max-width:640px;margin:10px auto 0"><span>🗺 Карта уровня (держать)</span><button type="button" class="opt ${capture&&capture.kind==='map'&&capture.type==='kb'?'on':''}" data-cap="kb" data-kind="map" data-act="map">${capture&&capture.kind==='map'&&capture.type==='kb'?'Нажмите клавишу…':kbd(settings.mapKey||'Tab')}</button><button type="button" class="opt padopt ${capture&&capture.kind==='map'&&capture.type==='pad'?'on':''}" data-cap="pad" data-kind="map" data-act="map">${capture&&capture.kind==='map'&&capture.type==='pad'?'Выберите…':padGlyph(glyphType(0),settings.mapPad??8)}</button></div>
      ${capture&&capture.kind==='map'&&capture.type==='pad'?`<div class="palette"><span class="padst">Нажмите кнопку на геймпаде или выберите здесь:</span><div class="pgrid">${[3,2,1,0,4,5,6,7,8,9,10,11].map(i=>`<button type="button" class="opt pick1 ${(settings.mapPad??8)===i?'on':''}" data-padpick="${i}">${padGlyph(glyphType(0),i)}</button>`).join('')}</div></div>`:''}
      <p style="font-size:13px" id="ctlNote">${capture&&capture.msg?capture.msg:'Нажмите на клавишу или кнопку геймпада в таблице, затем новую. Если она уже занята, они поменяются местами. Esc отменяет.'}</p>
      <div class="btns"><button class="secondary" id="bSwap" type="button">Поменять геймпады местами</button><button class="secondary" id="bReset" type="button">Сбросить</button><button class="primary" id="bBack" type="button">Готово</button></div></div>`;
    overlay.querySelectorAll('[data-cap]').forEach(b=>b.onclick=()=>{
      capture={kind:b.dataset.kind,action:b.dataset.act,type:b.dataset.cap,t0:performance.now()}; prevCapBtns=null; setState('controls');
      if(capture&&capture.type==='pad'){ const f=overlay.querySelector('.pick1.on')||overlay.querySelector('.pick1'); if(f) setTimeout(()=>f.focus(),0); }
    });
    overlay.querySelectorAll('[data-padpick]').forEach(b=>b.onclick=()=>{ if(!capture) return; assignPad(capture.kind,capture.action,+b.dataset.padpick); capture=null; sfx('pick'); setState('controls'); });
    overlay.querySelectorAll('[data-pstyle]').forEach(b=>b.onclick=()=>{ settings.padStyle=b.dataset.pstyle; saveSettings(); legendSig=''; renderLegend(); setState('controls'); });
    $('bSwap').onclick=()=>{ swapPads=!swapPads; store.set('iskra-bolt-swappads',swapPads); renderLegend(); setState('controls'); };
    $('bReset').onclick=()=>{ delete settings.mapKey; delete settings.mapPad; saveSettings(); binds=clone(DEFAULT_BINDS); swapPads=false; store.set('iskra-bolt-swappads',false); saveBinds(); capture=null; renderLegend(); setState('controls'); };
    $('bBack').onclick=()=>{ capture=null; setState(ctlBack); };
  } else if(s==='gameover'&&go){
    const L=getLevel(levelIdx);
    const title=go.bossType?`${go.bossName.toUpperCase()}<br><span>${BOSS_WON[go.bossType]}</span>`:
      go.cause==='spikes'?(go.who==='spark'?'ИСКРА<br><span>ПОГАСЛА</span>':'БОЛТ<br><span>ОТКРУТИЛСЯ</span>'):'ВЫ<br><span>ПОВЕРЖЕНЫ</span>';
    const sub=go.bossType?`У босса осталось ${go.bossPct}% здоровья. `+(go.bossPct<30?'Ещё чуть-чуть!':go.bossPct<70?'Половина пути уже пройдена.':'Попробуйте тактику ниже.'):`Уровень ${levelIdx+1} · ${L.name} · падений за игру: ${deaths}`;
    overlay.innerHTML=`<div class="card go">
      <span class="eyebrow">${go.bossType?'Бой проигран':'Конец попытки'}</span>
      <h2 class="goT">${title}</h2>
      <p>${sub}</p>
      <div class="tip"><span class="tipH">${go.bossType?'Тактика против босса':'Подсказка'}</span><p>${go.tip}</p></div>
      <div class="goRow">
        <svg class="ring" viewBox="0 0 70 70" aria-hidden="true"><circle cx="35" cy="35" r="30" class="rb"/><circle cx="35" cy="35" r="30" class="rf" id="goRing" style="stroke-dashoffset:0"/></svg>
        <span class="goNum" id="goNum">10</span>
        <div class="btns"><button class="primary" id="bRetry" type="button">Ещё раз · Enter</button><button class="secondary" id="bGoMenu" type="button">В меню · Esc</button></div>
      </div>
      <p style="font-size:12.5px">Через 10 секунд игра вернётся в меню, прогресс сохранится.</p></div>`;
    $('bRetry').onclick=()=>retryLevel(); $('bGoMenu').onclick=()=>{ go=null; loadLevel(levelIdx); setState('menu'); };
  } else if(s==='pause'){
    const own=(!solo&&pauseOwner!=null)?pauseOwner:null;
    const deco=`<div class="pzdeco" aria-hidden="true">${decoBase()}
            <div class="rest s" ${solo&&soloHero!=='spark'?'hidden':''}><canvas id="pvS" width="160" height="160"></canvas><span>z</span><span>z</span><span>Z</span></div>
      <div class="rest b" ${solo&&soloHero!=='bolt'?'hidden':''}><canvas id="pvB" width="160" height="160"></canvas><span>z</span><span>z</span><span>Z</span></div></div>`;
    overlay.innerHTML=deco+`<div class="card"><span class="eyebrow">${own==null?'Пауза':'Пауза · поставил'+(own===1?'':'а')+' '+PNAME[own]}</span><h2>Перерыв</h2>
      ${own==null?'':`<p class="padst" id="pauseNote" style="color:${own?'#62c7c1':'#ff8a3d'}">Снять паузу может только ${PNAME[own]}: ${PKEY[own]} или Start на своём геймпаде.</p>`}
      <div class="btns col">${own==null?'<button class="primary" id="bRes" type="button">Продолжить · Esc</button>':''}<button class="secondary" id="bRe" type="button">Уровень заново</button>${touchUI.on?'<button class="secondary" id="bTedit" type="button">Кнопки и размер экрана</button>':''}<button class="secondary" id="bHelpP" type="button">Помощь</button><button class="secondary" id="bShopP" type="button">Лавка</button><button class="secondary" id="bSet2" type="button">Настройки</button><button class="secondary" id="bCtl2" type="button">${touchUI.on?'Геймпад':'Управление'}</button><button class="secondary" id="bMenu" type="button">В меню</button></div></div>`;
    if($('bTedit')) $('bTedit').onclick=()=>{ editBack='pause'; setState('touchedit'); };
    if($('bRes')) $('bRes').onclick=()=>{ pauseOwner=null; setState('play'); }; $('bCtl2').onclick=()=>{ ctlBack='pause'; setState('controls'); }; $('bSet2').onclick=()=>{ ctlBack='pause'; setState('settings'); }; $('bShopP').onclick=()=>{ shopFrom='pause'; setState('shop'); }; $('bHelpP').onclick=()=>{ helpBack='pause'; setState('help'); }; $('bRe').onclick=()=>{ loadingTo(levelIdx,true); }; $('bMenu').onclick=()=>{loadLevel(levelIdx);setState('menu');};
  } else if(s==='done'){
    const L=getLevel(levelIdx), nextBoss=(levelIdx+2)%10===0;
    overlay.innerHTML=`<div class="card"><span class="eyebrow">Уровень ${levelIdx+1} из ${TOTAL} готов</span><h2>${L.boss?'Босс повержен':L.name}</h2>
      ${lastStars?`<div class="starrow">${starHtml(lastStars.got.reduce((m,g,i)=>m|(g?1<<i:0),0),true)}<div class="starlbl"><span class="${lastStars.got[0]?'on':''}">Пройден</span><span class="${lastStars.got[1]?'on':''}">Быстрее ${fmt(lastStars.par)}</span><span class="${lastStars.got[2]?'on':''}">Без урона</span></div></div>`:''}
      <p>Время: <span class="big">${(Math.round(levelTime*10)/10).toFixed(1)} с</span>${lastStars&&lastStars.newRec&&lastStars.prev?' <span class="rec">НОВЫЙ РЕКОРД!</span>':''}${lastStars&&!lastStars.newRec?` · рекорд ${lastStars.bt.toFixed(1)} с`:''} · шестерёнок: <span class="big">${gears}</span></p>
      ${run.reward?`<div class="reward"><span>За уровень <b>+${run.reward.base}</b></span>${run.reward.speed?`<span>За скорость <b>+${run.reward.speed}</b></span>`:''}${run.reward.clean?`<span>Без падений <b>+${run.reward.clean}</b></span>`:''}<span class="tot">Очки <b>${run.score.toLocaleString('ru-RU')}</b></span></div>`:''}
      ${nextBoss?`<p style="color:#ff6b6b">Дальше босс: ${getLevel(levelIdx+1).name}</p>`:''}
      <div class="btns"><button class="primary" id="bNext" type="button">Следующий уровень · Enter</button></div></div>`;
    $('bNext').onclick=()=>nextLevel();
  } else if(s==='shop'){
    const rw=run.reward||{total:0,base:0,clean:0};
    const refreshCost=150+100*run.refresh;
    const full=shopFrom!=='boss';
    const cards=(full?UPG.filter(d=>!solo||d.who==='both'||d.who===soloHero).map(d=>d.id):run.offer).map(id=>{ const d=UPG.find(x=>x.id===id); if(!d) return ''; const lv=U(id), maxed=lv>=d.max, price=upPrice(d), can=run.wallet>=price;
      return `<div class="ucard ${maxed?'done':''}" data-card="${id}">${upIcon(d)}<span class="who ${d.who}">${WHO_NAME[d.who]}</span><h4>${d.n}</h4>
        <p>${maxed?d.d[d.max-1]:d.d[lv]}</p><div class="pips">${Array.from({length:d.max},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div>
        ${maxed?`<span class="owned">Куплено</span>`:`<button type="button" class="${can?'buy':'buy no'}" data-buy="${id}">${can?`Купить · ${price.toLocaleString('ru-RU')}`:`Не хватает ${(price-run.wallet).toLocaleString('ru-RU')}`}</button>`}</div>`; }).join('');
    const owned=UPG.filter(d=>U(d.id)>0);
    overlay.innerHTML=`<div class="card wide ${full?'shopfull':''}"><span class="eyebrow">${full?`Все улучшения · куплено ${UPG.filter(d=>U(d.id)>0).length} из ${UPG.length}`:`Босс повержен · награда +${rw.total.toLocaleString('ru-RU')}${rw.clean?' (с бонусом без падений)':''}`}</span><h2>Лавка Механика</h2>
      <p>${full?'Здесь весь ассортимент. Покупки действуют до конца текущего забега, а «Сначала» начинает новый забег без улучшений.':'Улучшения остаются до конца забега. Можно купить сколько хватит очков.'}</p>
      <div class="wallet">Очки к трате <b>${run.wallet.toLocaleString('ru-RU')}</b></div>
      <div class="ushop">${cards||'<p>Всё уже куплено. Вы собрали полный набор!</p>'}</div>
      ${owned.length&&!full?`<div class="owned-list">${owned.map(d=>`<span class="chip" style="color:${d.c};border-color:${d.c}66">${d.n}${d.max>1?' '+U(d.id)+'/'+d.max:''}</span>`).join('')}</div>`:''}
      <div class="btns">${full?`<button class="primary" id="bShopBack" type="button">Назад · Esc</button>`:`<button class="secondary" id="bReroll" type="button" ${run.wallet<refreshCost||!UPG.some(d=>U(d.id)<d.max)?'disabled':''}>Другой товар · ${refreshCost}</button><button class="primary" id="bShopNext" type="button">Дальше · уровень ${levelIdx+2}</button>`}</div></div>`;
    overlay.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{ if(b.classList.contains('no')){ sfx('off'); b.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:180}); return; } buyUpgrade(b.dataset.buy); });
    if(full){ $('bShopBack').onclick=()=>setState(shopFrom); }
    else $('bReroll').onclick=()=>{ if(run.wallet<refreshCost) return; run.wallet-=refreshCost; run.refresh++; run.offer=rollOffer(); saveRun(); sfx('pick'); setState('shop'); };
    if(!full) $('bShopNext').onclick=()=>nextLevel();
  } else if(s==='win'){
    overlay.innerHTML=`<div class="card"><span class="eyebrow">Все 100 уровней собраны</span><h2><span class="s">Искра</span> и <span class="b">Болт</span> победили механизм</h2>
      <p style="max-width:46ch">Сердце мастерской остановилось. Станки затихли, и впервые за долгое время в мастерской стало по-настоящему тихо. Искра светит над верстаком, Болт снова на своём месте — и теперь никто не перепрошьёт их друзей.</p>
      <p>Общее время <span class="big">${fmt(totalTime)}</span> · падений <span class="big">${deaths}</span> · шестерёнок <span class="big">${gears}</span></p>
      <p class="padst">Новая игра+ : всё сначала, но все улучшения из Лавки, очки и кошелёк остаются, а уровни становятся сложнее (сейчас НИ+${(run.ng||0)}).</p>
      <div class="btns"><button class="primary" id="bNGP" type="button">Новая игра + · Enter</button><button class="secondary" id="bAgain" type="button">В главное меню</button></div></div>`;
    $('bNGP').onclick=()=>startNGPlus(); $('bAgain').onclick=()=>setState('menu');
  }
  if(overlay.classList.contains('pz')&&!overlay.querySelector('.pzdeco')) overlay.insertAdjacentHTML('afterbegin',`<div class="pzdeco" aria-hidden="true">${decoBase()}</div>`);
  if(!overlay.hidden){ let b=(prevState===s&&fk)?overlay.querySelector(fk):null; if(!b||b.disabled) b=overlay.querySelector('.primary'); if(b) setTimeout(()=>{ try{b.focus({preventScroll:true});}catch(e){} },0); }
}
function toggleCheat(){
  cheat=!cheat; cheatBuf=''; if(cheat) unlock('cheater');
  try{ localStorage.setItem('iskra-bolt-cheat',cheat?'1':'0'); }catch(e){}
  sfx(cheat?'pick':'off');
  texts.push({x:VW/2,y:VH/2,t:cheat?'ЧИТ: ВСЕ УРОВНИ ОТКРЫТЫ':'ЧИТ ВЫКЛЮЧЕН',life:2,c:cheat?'#7fe08a':'#ff6b6b',big:true});
  if(state==='menu') setState('menu');
}
function retryLevel(){ go=null; loadingTo(levelIdx,true); }
let shopFrom='boss';
function rollOffer(){
  const avail=UPG.filter(d=>U(d.id)<d.max&&(!solo||d.who==='both'||d.who===soloHero)).map(d=>d.id);
  for(let i=avail.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [avail[i],avail[j]]=[avail[j],avail[i]]; }
  return avail.slice(0,3);
}
const upIcon=d=>`<span class="medal ic got" style="--mc:${d.c}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d.ic}</svg></span>`;
function buyUpgrade(id){
  const d=UPG.find(x=>x.id===id); if(!d||U(id)>=d.max) return;
  const price=upPrice(d); if(run.wallet<price){ sfx('off'); return; }
  run.wallet-=price; run.up[id]=U(id)+1; saveRun(); unlock('shopper'); if(Object.keys(run.up).length>=5) unlock('upgraded5');
  sfx('pk_power'); flash(d.c,.18);
  const sc=overlay.scrollTop; setState('shop'); overlay.scrollTop=sc;
  const card=overlay.querySelector(`[data-card="${id}"]`); if(card){ card.classList.add('bought'); }
}
let helpTab='ctl', helpBack='menu', heroBack='title';
function goMenuFromTitle(){ audioInit(); sfx('boost'); flash('#ffffff',.35); renderLegend(true); loadLevel(Math.min(TOTAL-1,best)); setState('menu'); }
const PICK_SVG={heart:'<path d="M12 20s-7.5-4.5-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.5 12 20 12 20z"/>',shield:'<path d="M12 2.8l7.5 3v5.4c0 5-3.6 8.3-7.5 10-3.9-1.7-7.5-5-7.5-10V5.8z"/>',triple:'<path d="M4 12h9M4 12l9-6M4 12l9 6"/><circle cx="16" cy="6" r="2"/><circle cx="17" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',rapid:'<path d="M13.5 2L5 14h6.5L10 22l9-12.5h-6.5z"/>',power:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/>',gear:'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>'};
const svgIc=(inner,c)=>`<span class="medal ic got" style="--mc:${c}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg></span>`;
function touchHelpHTML(){
  const ic=k=>`<span class="thic">${TICON[k]||({ability:'➤',fire:'✦',use:'★'})[k]||''}</span>`;
  const row=(k,n,d)=>`<tr><th scope="row">${ic(k)}</th><td><b>${n}</b></td><td>${d}</td></tr>`;
  return `<table class="ctl touchctl"><tbody>
    ${row('left','Ходить','Кнопки ‹ и › внизу')}
    ${row('jump','Прыжок','Нажмите ещё раз в воздухе — двойной прыжок')}
    ${row('ability','Рывок / удар','Искра делает рывок, Болт подбрасывает Искру или бьёт сверху в прыжке')}
    ${row('fire','Огонь','Держите — стреляет очередью')}
    ${row('use','Бонус','Применить бонус из рюкзака')}
  </tbody></table>
  <p class="padst">Кнопка ⏸ вверху — пауза. В паузе есть «Кнопки и размер экрана»: тяните кнопки пальцем, меняйте их размер и размер поля.</p>
  <p class="padst">Геймпад тоже работает: подключите его по Bluetooth, и игра сразу его поймёт.</p>`;
}
function helpHTML(tab){
  if(tab==='ctl'&&touchUI.on) return touchHelpHTML();
  if(tab==='ctl'){
    const pt=glyphType(0);
    const ks=binds.spark.kb, kb=binds.bolt.kb, pp=binds.spark.pad, pb=binds.bolt.pad;
    const row=(name,a,b,pad)=>`<tr><th scope="row">${name}</th><td>${a}</td><td>${b}</td><td>${pad}</td></tr>`;
    return `<table class="htable"><thead><tr><th></th><th class="s">Искра</th><th class="b">Болт</th><th>Геймпад (${PAD_TYPE_NAME[pt]})</th></tr></thead><tbody>
      ${row('Ходить',kbd(ks.left)+kbd(ks.right),kbd(kb.left)+kbd(kb.right),'левый стик или крестовина')}
      ${row('Прыжок',kbd(ks.jump),kbd(kb.jump),padGlyph(pt,pp.jump))}
      ${row('Способность',kbd(ks.ability)+' рывок',kbd(kb.ability)+' подброс / удар',padGlyph(pt,pp.ability))}
      ${row('Огонь',kbd(ks.fire),kbd(kb.fire),padGlyph(pt,pp.fire))}
      ${row('Пауза',solo?kbd('Escape')+' или '+kbd('KeyP'):'Искра '+kbd('Escape')+' · Болт '+kbd('KeyP')+' · снимает тот, кто поставил','',padGlyph(pt,9))}
      ${row('Уровень заново',kbd('KeyR'),'','')}
      ${row('Звук вкл/выкл',kbd('KeyM'),'','')}
    </tbody></table>
    <ul class="hlist">
      <li><b>Двойной прыжок Искры</b> — нажмите прыжок ещё раз в воздухе.</li>
      <li><b>Рывок Искры</b> — быстрый бросок вперёд, один за прыжок. Помогает перелетать длинные шипы.</li>
      <li><b>Подброс</b> — Искра встаёт Болту на голову, Болт жмёт способность. Искра взлетает очень высоко.</li>
      <li><b>Удар Болта</b> — способность в воздухе: Болт падает вниз, ломает треснувший пол и давит врагов.</li>
      <li><b>Стрельба</b> — держите кнопку огня. Стреляют в сторону, куда смотрит герой.</li>
      <li><b>Два геймпада</b> — первый управляет Искрой, второй Болтом. Поменять можно в «Кнопки».</li>
    </ul>
    <h4 class="hsub">Режим «1 игрок»</h4>
    <ul class="hlist">
      <li>На заставке выберите «1 игрок» и героя. На уровне будет только он, а задачки собираются под его умения.</li>
      <li><b>Искра</b>: двойной прыжок, рывок, пролезает в щели. Её уровни — шипы, уступы, подъёмы и узкие проходы.</li>
      <li><b>Болт</b>: толкает ящики, удар сверху в прыжке ломает треснувший пол и давит врагов, гайки бьют сильнее. Его уровни — ящики, проломы в подвал и треснувшие стены.</li>
      <li>Двери с кнопкой в одиночной игре остаются открытыми несколько секунд — над дверью идёт отсчёт.</li>
      <li>Играть можно и на WASD, и на стрелках. У каждого героя свой прогресс, очки и улучшения в лавке.</li>
    </ul>`;
  }
  if(tab==='mech') return `<ul class="hlist big">
      <li><b>Цветные кнопки и двери.</b> Дверь открыта, пока на кнопке того же цвета кто-то стоит: герой или ящик.</li>
      <li><b>Мост над шипами.</b> Появляется, пока нажата кнопка его цвета. Сойдёте с кнопки — мост исчезнет.</li>
      <li><b>Ящики.</b> Толкать их может только Болт. Ящик на кнопке держит дверь сам.</li>
      <li><b>Узкая щель.</b> Пролезает только маленькая Искра.</li>
      <li><b>Треснувший пол и блоки.</b> Ломаются ударом Болта сверху или выстрелом.</li>
      <li><b>Шипы.</b> Касание — и уровень начинается заново.</li>
      <li><b>Выход.</b> Уровень пройден, когда в рамке «ВЫХОД» стоят оба героя. На боссах он открывается после победы.</li>
      <li><b>Тьма.</b> На некоторых уровнях выключен свет. Искра светится сама, Болт видит только перед собой. Зажигайте лампы на потолке: подойдите или попадите в них выстрелом. Зажгли все — бонус.</li><li><b>Сердца и падение.</b> У каждого по 3 сердца. Если герой потерял все сердца и упал, уровень начинается заново.</li>
      <li><b>Арены боссов.</b> Лава обжигает, мёд замедляет, конвейеры тянут, пол может бить током, сверху могут сыпаться искры.</li>
    </ul>`;
  if(tab==='bonus'){
    const B=[['gear','Шестерёнка','+10 очков. Падают и из врагов.'],['heart','Сердце','+1 сердце.'],['shield','Щит','Полностью гасит один удар.'],['triple','Тройной выстрел','Три снаряда веером, 20 секунд.'],['rapid','Скорострел','Стрельба в 2,4 раза чаще, 20 секунд.'],['power','Мощный выстрел','Огненные шары Искры взрываются, гайки Болта пробивают насквозь. 20 секунд.']];
    return `<div class="hgrid">${B.map(([k,n,d])=>`<div class="hitem">${svgIc(PICK_SVG[k],PICK_INFO[k].c)}<div><h4>${n}</h4><p>${d}</p></div></div>`).join('')}</div>
      <p class="padst"><b>Рюкзак и секреты.</b> На обычных уровнях бонусы спрятаны внутри стен: в нижнем краю свисающих стен, на концах платформ и в боковых стенах у пола. Тайник выглядит как обычная стена: попадите в него, услышите «тук» и увидите трещину, второй выстрел его вскрывает (удар Болта сверху вскрывает сразу). Найденный бонус кладётся в рюкзак на 3 ячейки и ждёт, пока вы сами его примените (Искра: Q применить, C выбрать; Болт: . и ,; на геймпаде Y/△ и RB/R1). Рюкзак переходит между уровнями, в том числе к боссу. Если рюкзак полон, бонус срабатывает сразу.</p>
      <p class="padst">Бонусы подбирает тот, кто их коснулся, а усиления действуют только на него. Время усиления видно в верхней панели. Бонусы притягиваются, если подойти близко.</p>`;
  }
  if(tab==='foes') return `<div class="hgrid">
      <div class="hitem">${svgIc('<path d="M4 16a8 7 0 0 1 16 0z"/><path d="M6 16l-2 4M12 16v4M18 16l2 4"/>','#c2553f')}<div><h4>Жук</h4><p>Ползает по полу. Давите прыжком сверху или стреляйте.</p></div></div>
      <div class="hitem">${svgIc('<rect x="5" y="9" width="14" height="7" rx="3.5"/><path d="M8 9c-2-4 2-5 3-2M16 9c2-4-2-5-3-2"/>','#e7c84a')}<div><h4>Оса</h4><p>Летает волнами. Проще сбить выстрелом.</p></div></div>
      <div class="hitem">${svgIc('<rect x="5" y="13" width="14" height="7" rx="2"/><circle cx="12" cy="11" r="4"/><path d="M14 9l6-3"/>','#8a98a8')}<div><h4>Турель</h4><p>Стоит на месте и стреляет в ближайшего. Ей нужно 4+ попадания.</p></div></div>
    </div>
    <ul class="hlist">
      <li><b>Босс на каждом 10-м уровне.</b> Пресс-Жаба, Око-Сварщик, Бешеная Шестерня, Королева Жуков и финальный Главный Механизм.</li>
      <li><b>Mk II и Mk III.</b> На втором круге боссы возвращаются доработанными: с бронёй и новыми атаками.</li>
      <li><b>Ярость.</b> Когда у босса остаётся меньше половины здоровья, он атакует чаще.</li>
      <li><b>Криты.</b> 12% попаданий по боссу наносят двойной урон.</li>
      <li><b>Прыжок на босса</b> снимает 4 здоровья, удар Болта сверху — 8 (кроме Шестерни).</li>
      <li>После поражения игра подскажет тактику против конкретного босса.</li>
    </ul>`;
  return `<ul class="hlist big">
      <li><b>Очки</b> — за врагов (+25, прыжком сверху +40), шестерёнки (+10), уровень (+150, бонус за скорость до +300, без падений +100) и боссов (от +1300).</li>
      <li><b>Лавка Механика</b> открывается после каждого босса: три случайных улучшения. Весь ассортимент — в главном меню и в паузе.</li>
      <li><b>Улучшения</b> действуют до конца забега: «Продолжить» сохраняет их, «Новая игра» обнуляет их вместе с достижениями.</li>
      <li><b>Достижения</b> открывают цвета и шапки во «Внешнем виде».</li>
    </ul>`;
}
