/* ================= level editor (конструктор уровней) ================= */
let edTest=false, edLevel=null, edSaved=null;
{ const st=document.createElement('style'); st.textContent=`
#editor{position:fixed;inset:0;z-index:9000;background:#0a1222;color:#e8effa;display:flex;flex-direction:column;font:13px/1.3 Rubik,system-ui,sans-serif}
#editor[hidden]{display:none}
#editor .edtop,#editor .edbot{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:8px 12px;background:#0f1a30;border-bottom:1px solid #22324f}
#editor .edbot{border-top:1px solid #22324f;border-bottom:0}
#editor .edlogo{font:900 15px Unbounded,'Arial Black',sans-serif;color:#ffd166;margin-right:8px}
#editor input:not([type]),#editor select{background:#0a1426;color:#e8effa;border:1px solid #33456a;border-radius:6px;padding:4px 6px;font:inherit}
#editor input#edHint{width:320px}
#editor .edmain{flex:1;display:flex;min-height:0}
#editor .edside{width:250px;display:flex;flex-direction:column;background:#0d1628;border-right:1px solid #22324f;min-height:0}
#editor #edSearch{margin:8px;padding:7px 9px;border-radius:8px;background:#0a1426;color:#e8effa;border:1px solid #33456a;font:inherit}
#editor .edpal{flex:1;overflow:auto;padding:0 6px 6px}
#editor .edinfo{position:fixed;z-index:9100;width:270px;padding:8px 10px;font-size:12.5px;line-height:1.4;background:#0f1a30f2;border:1px solid #ffd16688;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.5);pointer-events:none;display:none}
#editor .edinfo p{margin:4px 0;color:#cfd8ea}
#editor .edinfo .edcomb{color:#9cc3ff}
#editor .edih{display:flex;align-items:center;gap:8px;font-size:14px;color:#ffd166}
#editor .edt[hidden],#editor .edgrp[hidden]{display:none}
#editor .edt canvas{flex:none;width:28px!important;height:28px!important;background:#0a1222;border-radius:5px}
#editor .edgrp>span{display:block;font:700 10px Unbounded,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#9cc3ff;margin:8px 2px 4px}
#editor .edt{display:flex;gap:6px;align-items:center;width:100%;text-align:left;background:transparent;border:1px solid transparent;color:#e8effa;border-radius:6px;padding:3px 5px;font:inherit;cursor:pointer}
#editor .edt i{flex:none;width:20px;height:20px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font:700 11px system-ui;color:#0b1220;font-style:normal}
#editor .edt.on{border-color:#ffd166;background:#1b2a48}
#editor .edwrap{flex:1;overflow:auto;padding:6px}
#editor canvas{display:block;cursor:crosshair;width:auto!important;height:auto!important}
#editor button.primary,#editor button.secondary,#editor .edimp{padding:6px 12px;font-size:13px;cursor:pointer}
#editor #edRnd{position:fixed;right:16px;bottom:96px;z-index:9200;width:360px;max-height:70vh;overflow:auto;background:#0f1a30;border:1px solid #ffd16688;border-radius:12px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:8px}
#editor #edRnd>b{font:900 14px Unbounded,sans-serif;color:#ffd166}
#editor .rgrp span{display:block;font:700 10px Unbounded,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#9cc3ff;margin:4px 0}
#editor .rchk{display:inline-flex;gap:4px;align-items:center;margin:2px 10px 2px 0;font-size:12.5px}
#editor .rbtn{display:flex;gap:8px;margin-top:4px}
#editor .edhelp{color:#8fa3c0;font-size:12px}
body.editing #pauseBtn,body.editing #verTag{display:none}`; document.head.appendChild(st); }
const ED=(()=>{
  const E={on:false};
  const STORE='iskra-bolt-mylevels';
  const TOOLS=[
    ['Основа',[['.','Пусто','#0b1830'],['#','Стена','#5a6b85'],['^','Шипы','#ff6b6b'],['x','Треснувшая','#8a6a40'],['C','Ящик','#b07a42'],['1','Старт Искры','#ff8a3d'],['2','Старт Болта','#62c7c1'],['E','Выход 2×2','#7fe08a']]],
    ['Кнопки и двери',[['p','Кнопка жёлтая','#e7b54a'],['P','Дверь жёлтая','#e7b54a'],['U','Мост жёлтый','#e7b54a'],['q','Кнопка сиреневая','#c79bff'],['Q','Дверь сиреневая','#c79bff'],['V','Мост сиреневый','#c79bff'],['r','Кнопка зелёная','#7fe08a'],['R','Дверь зелёная','#7fe08a'],['W','Мост зелёный','#7fe08a']]],
    ['Задачки',[['a','Кнопка порядка: красная','#ff6b6b'],['b','Кнопка порядка: зелёная','#7fe08a'],['c','Кнопка порядка: синяя','#6aa8ff'],['G','Решётка (откроет порядок)','#8fa3b8'],['k','Ключ','#ffd166'],['X','Замок','#c8962e'],['h','Рычаг','#cfd8e6'],['[','Красная платформа','#ff6b6b'],[']','Синяя платформа','#6aa8ff'],['g','Решётка ловушки (захлопнется)','#5a6b80'],['@trap','Место срабатывания ловушки','#ff3b4e']]],
    ['Механики',[['I','Лёд','#9fe4f5'],['K','Ломкий мост','#9a6634'],['O','Портал вход','#c79bff'],['o','Портал выход','#5fe3d9'],['@wind','Ветер вверх','#cfe8ff'],['@mover','Летающая платформа (2 клика)','#cfd8e6'],['@flag','Флажок','#7fe08a']]],
    ['Враги и бонусы',[['@crawler','Жук','#ff6b6b'],['@big','Большой жук','#d65a5a'],['@flyer','Летун','#c79bff'],['@turret','Турель','#9cc3ff'],['@shield','Жук со щитом','#9cc3ff'],['@gear','Шестерёнка','#e7b54a'],['@heart','Сердце','#ff5fa2'],['@pshield','Щит','#9cc3ff'],['@triple','Тройной выстрел','#ffd166'],['@rapid','Скорострел','#ff8a3d'],['@power','Мощный выстрел','#c79bff']]],
  ];
  const COLOR={}; TOOLS.forEach(g=>g[1].forEach(t=>COLOR[t[0]]=t[2]));
  const DESC={
    '.':['Пустая клетка.','Стирает всё в клетке. То же делает правая кнопка мыши.',''],
    '#':['Стена или пол.','Рисуйте полы, платформы, стены. Герои стоят и прыгают по ним.','Всё. Платформы на высоте 2 клетки — Болт допрыгнет, выше — только Искра или с подбросом.'],
    '^':['Шипы.','Касание отнимает сердце. Ставьте на пол.','Мост (U/V/W) над шипами, летающая платформа, ломкий мост.'],
    'x':['Треснувшая стена или пол.','Ломается выстрелами или ударом Болта сверху.','Ловушка (выход из комнаты), секретный проход, пролом вниз.'],
    'C':['Ящик.','Толкает только Болт. Падает вниз, держит кнопку, на нём можно стоять.','Кнопки (p/q/r) — ящик держит дверь сам. Уступ — столкнуть ящик на кнопку.'],
    '1':['Старт Искры.','Где Искра появляется. Нужен на каждом уровне.','Ставьте рядом со стартом Болта.'],
    '2':['Старт Болта.','Где Болт появляется (в режиме вдвоём).','Ставьте рядом со стартом Искры.'],
    'E':['Выход 2×2.','Уровень пройден, когда оба героя в рамке выхода. Ставьте кликом по нижней левой клетке.','Обычно в конце уровня, за последней задачкой.'],
    'p':['Жёлтая кнопка.','Пока на ней стоит герой или ящик — жёлтые двери открыты, жёлтый мост виден.','Жёлтая дверь (P), жёлтый мост (U), летающая платформа (едет от кнопки), ящик.'],
    'P':['Жёлтая дверь.','Закрыта, пока не нажата жёлтая кнопка. Ставьте столбиком 3 клетки.','Жёлтая кнопка (p). Галочка «Двери на время» — дверь закроется через ~3 сек.'],
    'U':['Жёлтый мост.','Появляется, пока нажата жёлтая кнопка.','Над шипами. Жёлтая кнопка (p).'],
    'q':['Сиреневая кнопка.','Как жёлтая, но для сиреневых дверей и мостов.','Q, V.'],'Q':['Сиреневая дверь.','Открывается сиреневой кнопкой.','q, «Двери на время».'],'V':['Сиреневый мост.','Появляется от сиреневой кнопки.','q, шипы.'],
    'r':['Зелёная кнопка.','Для зелёных дверей и мостов.','R, W.'],'R':['Зелёная дверь.','Открывается зелёной кнопкой.','r, «Двери на время».'],'W':['Зелёный мост.','Появляется от зелёной кнопки.','r, шипы.'],
    'a':['Кнопка порядка (красная).','Нажимать по порядку, указанному вверху («Порядок кнопок»). Ошибка — сначала.','Нужны все три (a, b, c) и решётка G.'],
    'b':['Кнопка порядка (зелёная).','Часть задачки «порядок кнопок».','a, c, решётка G.'],'c':['Кнопка порядка (синяя).','Часть задачки «порядок кнопок».','a, b, решётка G.'],
    'G':['Решётка.','Исчезает, когда кнопки a-b-c нажаты в правильном порядке. Над ней в игре висит табличка с порядком.','Кнопки a, b, c.'],
    'k':['Ключ.','Герой подбирает ключ, касаясь его. Ключ виден над головой.','Замок X. Ключ в сундуке из замков — хорошая задачка.'],
    'X':['Замок.','Исчезает весь (все соседние клетки X), если коснуться его с ключом. Ключ тратится.','Ключ k. Сундук: бонус за замком.'],
    'h':['Рычаг.','Касание переключает красные и синие платформы.','Красные [ и синие ] платформы. Ставьте рычаги и внизу, и наверху.'],
    '[':['Красная платформа.','Твёрдая, пока рычаг в начальном положении.','Рычаг h, синие платформы ].'],
    ']':['Синяя платформа.','Твёрдая после переключения рычага.','Рычаг h, красные платформы [.'],
    'g':['Решётка ловушки.','Открыта, но захлопывается, когда оба героя пройдут «место срабатывания».','Место срабатывания (красная линия), треснувшая стена x как выход.'],
    '@trap':['Место срабатывания ловушки.','Красная линия. Когда все герои правее неё — решётки g захлопываются.','Решётка ловушки g.'],
    'I':['Лёд.','Скользкий пол — трудно затормозить.','Шипы после льда, узкие уступы.'],
    'K':['Ломкий мост.','Рассыпается через полсекунды под ногами, потом вырастает.','Над шипами — нельзя стоять на месте.'],
    'O':['Портал (вход).','Войти — выйдешь из ближайшего портала-выхода o справа.','Портал-выход o. Сквозь стену.'],
    'o':['Портал (выход).','Сюда переносит портал-вход O слева. Работает и обратно.','Портал-вход O.'],
    '@wind':['Ветер вверх.','Столб ветра шириной 3 клетки поднимает героев к высоким уступам.','Высокий уступ, шипы внизу.'],
    '@mover':['Летающая платформа.','Кликните, где начинается, потом — куда едет. Ездит туда-обратно.','Шипы или пропасть под ней.'],
    '@flag':['Флажок.','Контрольная точка: после падения герои появляются у него.','Длинные уровни — ставьте на границе экранов.'],
    '@crawler':['Жук.','Ползает по полу. Давится прыжком сверху или выстрелами.','Возле кнопок — мешает на них встать.'],
    '@big':['Большой жук.','Крепче обычного, ростом с Болта.','Узкие коридоры.'],
    '@flyer':['Летун.','Летает волнами в воздухе.','Над ямами и шипами.'],
    '@turret':['Турель.','Стоит и стреляет в ближайшего героя.','Укрытия из стен, двери.'],
    '@shield':['Жук со щитом.','Щит спереди — бейте в спину или прыгайте сверху.','Узкий проход, где его надо обойти.'],
    '@gear':['Шестерёнка.','Очки для Лавки.','Высокие уступы, тайники — награда за исследование.'],
    '@heart':['Сердце.','Восстанавливает здоровье.','Перед трудным местом или в сундуке.'],'@pshield':['Щит.','Гасит один удар.','Перед врагами.'],
    '@triple':['Тройной выстрел.','Три снаряда веером на время.','Много врагов.'],'@rapid':['Скорострел.','Стреляет чаще на время.','Турели, щиты.'],'@power':['Мощный выстрел.','Пробивает насквозь.','Толпа врагов, треснувшие стены.'],
  };
  function ico(g,id,X,Y,s){ const c=COLOR[id]||'#888', m=s*.1; g.save(); g.lineJoin='round'; g.lineCap='round';
    const box=(col,r=0)=>{ g.fillStyle=col; g.fillRect(X+m,Y+m,s-2*m,s-2*m); };
    switch(id){
      case '.': g.strokeStyle='#33456a'; g.setLineDash([3,3]); g.strokeRect(X+m,Y+m,s-2*m,s-2*m); break;
      case '#': box('#5a6b85'); g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=1; for(let i=-s;i<s;i+=s/4){ g.beginPath(); g.moveTo(X+m+Math.max(0,i),Y+s-m-Math.max(0,-i)); g.lineTo(X+Math.min(s-m,i+s),Y+m+Math.max(0,i+s-s+m)); g.stroke(); } break;
      case '^': g.fillStyle=c; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(X+i*s/3+1,Y+s-m); g.lineTo(X+i*s/3+s/6,Y+s*.35); g.lineTo(X+(i+1)*s/3-1,Y+s-m); g.fill(); } break;
      case 'x': box('#4a3622'); g.strokeStyle='#e7b54a'; g.lineWidth=Math.max(1,s*.06); g.beginPath(); g.moveTo(X+s*.3,Y+m); g.lineTo(X+s*.45,Y+s*.45); g.lineTo(X+s*.35,Y+s-m); g.moveTo(X+s*.45,Y+s*.45); g.lineTo(X+s*.75,Y+s*.6); g.stroke(); break;
      case 'C': box('#b07a42'); g.strokeStyle='#5a3a1c'; g.lineWidth=Math.max(1,s*.07); g.strokeRect(X+m*1.5,Y+m*1.5,s-3*m,s-3*m); g.beginPath(); g.moveTo(X+m*1.5,Y+m*1.5); g.lineTo(X+s-m*1.5,Y+s-m*1.5); g.moveTo(X+s-m*1.5,Y+m*1.5); g.lineTo(X+m*1.5,Y+s-m*1.5); g.stroke(); break;
      case '1': { g.fillStyle='#ffd166'; g.beginPath(); g.moveTo(X+s*.5,Y+m); g.lineTo(X+s*.62,Y+s*.42); g.lineTo(X+s*.38,Y+s*.42); g.fill(); g.fillStyle='#ff8a3d'; g.beginPath(); g.ellipse(X+s*.5,Y+s*.64,s*.26,s*.28,0,0,Math.PI*2); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(X+s*.42,Y+s*.6,s*.07,0,7); g.arc(X+s*.58,Y+s*.6,s*.07,0,7); g.fill(); break; }
      case '2': { g.fillStyle='#62c7c1'; g.fillRect(X+s*.22,Y+s*.3,s*.56,s*.6); g.fillStyle='#cfd8e6'; g.fillRect(X+s*.3,Y+s*.16,s*.4,s*.14); g.fillStyle='#10202a'; g.fillRect(X+s*.28,Y+s*.42,s*.44,s*.18); g.fillStyle='#9ff6ff'; g.fillRect(X+s*.34,Y+s*.46,s*.08,s*.1); g.fillRect(X+s*.58,Y+s*.46,s*.08,s*.1); break; }
      case 'E': g.strokeStyle='#cfd8e6'; g.setLineDash([3,2]); g.lineWidth=Math.max(1,s*.06); g.strokeRect(X+m,Y+m,s-2*m,s-2*m); g.setLineDash([]); g.strokeStyle='#ff8a3d'; g.beginPath(); g.arc(X+s*.38,Y+s*.32,s*.08,0,7); g.stroke(); g.strokeStyle='#62c7c1'; g.beginPath(); g.arc(X+s*.62,Y+s*.32,s*.08,0,7); g.stroke(); break;
      case 'p': case 'q': case 'r': case 'a': case 'b': case 'c': g.fillStyle='#3a4656'; g.fillRect(X+m,Y+s*.78,s-2*m,s*.12); g.fillStyle=c; g.fillRect(X+s*.2,Y+s*.62,s*.6,s*.18); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(X+s*.2,Y+s*.62,s*.6,s*.05); break;
      case 'P': case 'Q': case 'R': box('rgba(0,0,0,.25)'); g.strokeStyle=c; g.lineWidth=Math.max(1.5,s*.09); for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(X+i*s/4,Y+m); g.lineTo(X+i*s/4,Y+s-m); g.stroke(); } break;
      case 'U': case 'V': case 'W': g.strokeStyle=c; g.setLineDash([4,3]); g.lineWidth=Math.max(1.5,s*.08); g.strokeRect(X+m,Y+s*.4,s-2*m,s*.22); g.setLineDash([]); break;
      case 'G': box('#2a3445'); g.strokeStyle='#8fa3b8'; g.lineWidth=Math.max(1.5,s*.09); for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(X+i*s/4,Y+m); g.lineTo(X+i*s/4,Y+s-m); g.stroke(); } break;
      case 'g': g.strokeStyle='#8fa3b8'; g.globalAlpha=.6; g.setLineDash([3,3]); g.lineWidth=Math.max(1.5,s*.08); for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(X+i*s/4,Y+m); g.lineTo(X+i*s/4,Y+s-m); g.stroke(); } break;
      case 'k': g.strokeStyle='#ffd166'; g.lineWidth=Math.max(1.5,s*.1); g.beginPath(); g.arc(X+s*.32,Y+s*.5,s*.14,0,7); g.moveTo(X+s*.46,Y+s*.5); g.lineTo(X+s*.85,Y+s*.5); g.moveTo(X+s*.72,Y+s*.5); g.lineTo(X+s*.72,Y+s*.66); g.moveTo(X+s*.84,Y+s*.5); g.lineTo(X+s*.84,Y+s*.64); g.stroke(); break;
      case 'X': box('#8a6420'); g.strokeStyle='#ffd166'; g.lineWidth=1; g.strokeRect(X+m*1.5,Y+m*1.5,s-3*m,s-3*m); g.fillStyle='#2a1a04'; g.beginPath(); g.arc(X+s/2,Y+s*.42,s*.1,0,7); g.fill(); g.fillRect(X+s*.46,Y+s*.45,s*.08,s*.25); break;
      case 'h': g.fillStyle='#3a4656'; g.fillRect(X+s*.25,Y+s*.8,s*.5,s*.12); g.strokeStyle='#cfd8e6'; g.lineWidth=Math.max(1.5,s*.09); g.beginPath(); g.moveTo(X+s*.5,Y+s*.8); g.lineTo(X+s*.3,Y+s*.3); g.stroke(); g.fillStyle='#ff6b6b'; g.beginPath(); g.arc(X+s*.3,Y+s*.28,s*.11,0,7); g.fill(); break;
      case '[': case ']': g.fillStyle=c; g.fillRect(X+m,Y+s*.3,s-2*m,s*.4); g.fillStyle='rgba(255,255,255,.3)'; g.fillRect(X+m,Y+s*.3,s-2*m,s*.1); break;
      case 'I': { const gr=g.createLinearGradient(0,Y,0,Y+s); gr.addColorStop(0,'#e8fbff'); gr.addColorStop(1,'#4aa6c4'); g.fillStyle=gr; g.fillRect(X+m,Y+m,s-2*m,s-2*m); g.strokeStyle='#fff'; g.lineWidth=1; g.beginPath(); g.moveTo(X+s*.3,Y+s*.25); g.lineTo(X+s*.55,Y+s*.25); g.stroke(); break; }
      case 'K': g.fillStyle='#9a6634'; g.fillRect(X+m,Y+s*.25,s-2*m,s*.35); g.strokeStyle='#4a2c12'; g.lineWidth=1; g.beginPath(); g.moveTo(X+s*.4,Y+s*.25); g.lineTo(X+s*.5,Y+s*.45); g.lineTo(X+s*.42,Y+s*.6); g.stroke(); break;
      case 'O': case 'o': g.strokeStyle=c; g.lineWidth=Math.max(1.5,s*.1); g.beginPath(); g.ellipse(X+s/2,Y+s/2,s*.22,s*.38,0,0,7); g.stroke(); g.globalAlpha=.5; g.beginPath(); g.ellipse(X+s/2,Y+s/2,s*.1,s*.22,0,0,7); g.stroke(); break;
      case '@wind': g.strokeStyle='#cfe8ff'; g.lineWidth=Math.max(1.5,s*.08); for(const dx of [.3,.5,.7]){ g.beginPath(); g.moveTo(X+s*dx,Y+s*.85); g.lineTo(X+s*dx,Y+s*.2); g.moveTo(X+s*dx-s*.1,Y+s*.32); g.lineTo(X+s*dx,Y+s*.2); g.lineTo(X+s*dx+s*.1,Y+s*.32); g.stroke(); } break;
      case '@mover': g.fillStyle='#cfd8e6'; g.fillRect(X+m,Y+s*.42,s-2*m,s*.18); g.strokeStyle='#ffd166'; g.lineWidth=1; g.beginPath(); g.moveTo(X+s*.2,Y+s*.28); g.lineTo(X+s*.8,Y+s*.28); g.moveTo(X+s*.7,Y+s*.2); g.lineTo(X+s*.8,Y+s*.28); g.lineTo(X+s*.7,Y+s*.36); g.stroke(); break;
      case '@flag': g.strokeStyle='#cfd8e6'; g.lineWidth=Math.max(1.5,s*.07); g.beginPath(); g.moveTo(X+s*.3,Y+s*.9); g.lineTo(X+s*.3,Y+s*.12); g.stroke(); g.fillStyle='#7fe08a'; g.beginPath(); g.moveTo(X+s*.3,Y+s*.12); g.lineTo(X+s*.85,Y+s*.28); g.lineTo(X+s*.3,Y+s*.46); g.fill(); break;
      case '@trap': g.strokeStyle='#ff3b4e'; g.setLineDash([3,3]); g.lineWidth=Math.max(1.5,s*.08); g.beginPath(); g.moveTo(X+s/2,Y+m); g.lineTo(X+s/2,Y+s-m); g.stroke(); g.setLineDash([]); g.fillStyle='#ff3b4e'; g.beginPath(); g.moveTo(X+s*.5,Y+s*.3); g.lineTo(X+s*.7,Y+s*.5); g.lineTo(X+s*.5,Y+s*.7); g.fill(); break;
      case '@crawler': case '@big': case '@shield': { const b=id==='@big'; g.fillStyle=id==='@crawler'?'#e0533f':'#c0443a'; g.beginPath(); g.ellipse(X+s/2,Y+s*(b?.55:.66),s*(b?.36:.32),s*(b?.3:.2),0,Math.PI,0); g.fill(); g.fillRect(X+s*(b?.14:.18),Y+s*(b?.55:.66),s*(b?.72:.64),s*.08);
        g.fillStyle='#fff'; g.beginPath(); g.arc(X+s*.66,Y+s*(b?.42:.56),s*.07,0,7); g.fill(); g.strokeStyle='#2a1010'; g.lineWidth=1; for(const lx of [.3,.45,.6]){ g.beginPath(); g.moveTo(X+s*lx,Y+s*(b?.62:.74)); g.lineTo(X+s*(lx-.05),Y+s*.86); g.stroke(); }
        if(id==='@shield'){ g.strokeStyle='#9cc3ff'; g.lineWidth=Math.max(1.5,s*.08); g.beginPath(); g.arc(X+s*.6,Y+s*.6,s*.26,-1,1); g.stroke(); } break; }
      case '@flyer': g.fillStyle='#c79bff'; g.beginPath(); g.ellipse(X+s/2,Y+s*.55,s*.2,s*.16,0,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(X+s*.36,Y+s*.36,s*.14,s*.08,-.5,0,7); g.ellipse(X+s*.64,Y+s*.36,s*.14,s*.08,.5,0,7); g.fill(); break;
      case '@turret': g.fillStyle='#5a6b85'; g.fillRect(X+s*.22,Y+s*.55,s*.56,s*.35); g.fillStyle='#9cc3ff'; g.beginPath(); g.arc(X+s/2,Y+s*.55,s*.2,Math.PI,0); g.fill(); g.fillStyle='#cfd8e6'; g.fillRect(X+s*.5,Y+s*.4,s*.38,s*.1); break;
      case '@gear': { g.fillStyle='#e7b54a'; g.beginPath(); for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, r=i%2?s*.26:s*.36; g.lineTo(X+s/2+Math.cos(a)*r,Y+s/2+Math.sin(a)*r); } g.fill(); g.fillStyle='#0b1220'; g.beginPath(); g.arc(X+s/2,Y+s/2,s*.1,0,7); g.fill(); break; }
      case '@heart': g.fillStyle='#ff5fa2'; g.beginPath(); g.moveTo(X+s/2,Y+s*.82); g.bezierCurveTo(X+s*.05,Y+s*.5,X+s*.25,Y+s*.12,X+s/2,Y+s*.34); g.bezierCurveTo(X+s*.75,Y+s*.12,X+s*.95,Y+s*.5,X+s/2,Y+s*.82); g.fill(); break;
      case '@pshield': g.fillStyle='#9cc3ff'; g.beginPath(); g.moveTo(X+s/2,Y+s*.12); g.lineTo(X+s*.82,Y+s*.26); g.lineTo(X+s*.74,Y+s*.66); g.lineTo(X+s/2,Y+s*.88); g.lineTo(X+s*.26,Y+s*.66); g.lineTo(X+s*.18,Y+s*.26); g.fill(); break;
      case '@triple': g.fillStyle='#ffd166'; for(const a of [-.4,0,.4]){ g.beginPath(); g.arc(X+s*.3+Math.cos(a)*s*.4,Y+s/2+Math.sin(a)*s*.4,s*.09,0,7); g.fill(); } g.beginPath(); g.arc(X+s*.25,Y+s/2,s*.1,0,7); g.fill(); break;
      case '@rapid': g.fillStyle='#ff8a3d'; for(const dx of [.2,.45,.7]){ g.beginPath(); g.moveTo(X+s*dx,Y+s*.3); g.lineTo(X+s*(dx+.18),Y+s*.5); g.lineTo(X+s*dx,Y+s*.7); g.fill(); } break;
      case '@power': g.fillStyle='#c79bff'; g.beginPath(); g.arc(X+s*.42,Y+s/2,s*.22,0,7); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(X+s*.42,Y+s/2,s*.09,0,7); g.fill(); g.strokeStyle='#c79bff'; g.lineWidth=2; g.beginPath(); g.moveTo(X+s*.65,Y+s/2); g.lineTo(X+s*.92,Y+s/2); g.stroke(); break;
      default: box(c);
    }
    g.restore(); }
  let L=null, tool='#', cell=32, el=null, cv2=null, g2=null, moverA=null, dirty=false, painting=0;
  const blankLevel=(w=32)=>{ const map=[...Array(ROWS)].map((_,y)=>[...Array(w)].map((_,x)=>(y===0||y===ROWS-1||x===0||x===w-1)?'#':'.'));
    map[16][2]='1'; map[16][3]='2'; for(const [x,y] of [[w-3,15],[w-2,15],[w-3,16],[w-2,16]]) map[y][x]='E';
    return {name:'Мой уровень',motif:NAMES[0],hue:null,dark:false,hint:'',order:'abc',timed:{P:false,Q:false,R:false},map,enemies:[],pickups:[],movers:[],winds:[],flags:[],trapX:null}; };
  const list=()=>{ try{ return JSON.parse(localStorage.getItem(STORE)||'{}'); }catch(e){ return {}; } };
  const saveList=o=>{ try{ localStorage.setItem(STORE,JSON.stringify(o)); }catch(e){} };
  function resize(w){ const old=L.map; L.map=[...Array(ROWS)].map((_,y)=>[...Array(w)].map((_,x)=>{ if(y===0||y===ROWS-1||x===0||x===w-1) return '#'; const c=old[y]&&old[y][x]; return (c&&x<old[0].length-1)?c:'.'; }));
    for(const k of ['enemies','pickups','flags']) L[k]=L[k].filter(o=>(o.tx??o)<w-1); L.movers=L.movers.filter(m=>m.ax<w-1&&m.bx<w-1); L.winds=L.winds.filter(o=>o.tx<w-2); dirty=true; build(); }
  // ---------- build the game level object from the editor data ----------
  function toGame(){ const map=L.map.map(r=>r.slice()); const pz=[];
    const find=ch=>{ const o=[]; map.forEach((r,y)=>r.forEach((c,x)=>{ if(c===ch) o.push([x,y]); })); return o; };
    const A=find('a'),B=find('b'),Cc=find('c'),Gt=find('G');
    if(A.length&&B.length&&Cc.length&&Gt.length) pz.push({type:'order',order:(/^[abc]{3}$/.test(L.order)&&new Set(L.order).size===3)?L.order:'abc',cells:{a:[A[0]],b:[B[0]],c:[Cc[0]],gate:Gt}});
    const gT=find('g'); if(gT.length&&L.trapX!=null) pz.push({type:'trap',trigX:L.trapX*T,cells:{back:gT}});
    for(const K of 'PQR') if(L.timed[K]){ const d=find(K); if(d.length) pz.push({type:'timed',cells:{door:[d[0]]}}); }
    const en=L.enemies.map(e=>{ const base={tx:e.tx,ty:e.ty,min:Math.max(1,e.tx-4)*T,max:Math.min(map[0].length-1,e.tx+5)*T}; if(e.t==='turret') return {type:'turret',tx:e.tx,ty:e.ty};
      if(e.t==='flyer') return Object.assign(base,{type:'flyer',trait:null}); return Object.assign(base,{type:'crawler',trait:e.t==='shield'?'shield':null,bigForce:e.t==='big'}); });
    return {name:L.name||'Мой уровень',motif:L.motif,hue:L.hue,dark:!!L.dark,hint:L.hint||'Уровень из конструктора.',map:map.map(r=>r.join('')),enemies:en,
      pickups:L.pickups.map(p=>({type:p.t==='pshield'?'shield':p.t,tx:p.tx,ty:p.ty})),movers:L.movers.map(m=>Object.assign({w:2,sp:90},m)),
      winds:L.winds.map(w=>({x:w.tx*T,y:3*T,w:3*T,h:14*T})),checkpoints:L.flags.map(x=>x*T),pz,tier:0,custom:true}; }
  // ---------- UI ----------
  function build(){
    if(!el){ el=document.createElement('div'); el.id='editor'; document.body.appendChild(el); }
    const mine=list();
    el.innerHTML=`<div class="edtop">
      <b class="edlogo">Конструктор уровней</b>
      <label>Название <input id="edName" value="${(L.name||'').replace(/"/g,'&quot;')}"></label>
      <label>Длина <select id="edW">${[[32,'1 экран'],[62,'2 экрана'],[92,'3 экрана'],[122,'4 экрана']].map(([w,n])=>`<option value="${w}" ${L.map[0].length===w?'selected':''}>${n}</option>`).join('')}</select></label>
      <label>Задник <select id="edMotif">${NAMES.map(n=>`<option ${n===L.motif?'selected':''}>${n}</option>`).join('')}</select></label>
      <label>Цвет <input id="edHue" type="range" min="-1" max="359" value="${L.hue??-1}"></label>
      <label><input id="edDark" type="checkbox" ${L.dark?'checked':''}> Тьма</label>
      <label>Порядок кнопок <select id="edOrder">${['abc','acb','bac','bca','cab','cba'].map(o=>`<option value="${o}" ${o===L.order?'selected':''}>${[...o].map(c=>({a:'красная',b:'зелёная',c:'синяя'})[c]).join(' → ')}</option>`).join('')}</select></label>
      <label>Двери на время ${['P','Q','R'].map(K=>`<input type="checkbox" data-timed="${K}" ${L.timed[K]?'checked':''} title="${({P:'жёлтая',Q:'сиреневая',R:'зелёная'})[K]}">`).join('')}</label>
    </div>
    <div class="edmain"><div class="edside"><input id="edSearch" placeholder="🔍 Поиск объекта…" autocomplete="off"><div class="edpal">${TOOLS.map(([gn,ts])=>`<div class="edgrp"><span>${gn}</span>${ts.map(([id,n])=>`<button type="button" class="edt ${id===tool?'on':''}" data-tool="${id}" data-name="${(n+' '+(DESC[id]||[]).join(' ')).toLowerCase().replace(/"/g,'')}"><canvas width="28" height="28" data-ico="${id}"></canvas>${n}</button>`).join('')}</div>`).join('')}</div>
      <div class="edinfo" id="edInfo"></div></div>
      <div class="edwrap"><canvas id="edCv"></canvas></div></div>
    <div class="edbot">
      <label>Подсказка уровня <input id="edHint" value="${(L.hint||'').replace(/"/g,'&quot;')}" placeholder="Что нужно сделать на уровне"></label>
      <button type="button" class="primary" id="edPlay2">▶ Тест вдвоём</button><button type="button" class="secondary" id="edPlayS">▶ Тест Искрой</button><button type="button" class="secondary" id="edPlayB">▶ Тест Болтом</button>
      <button type="button" class="secondary" id="edSave">Сохранить</button>
      <select id="edList"><option value="">Мои уровни (${Object.keys(mine).length})</option>${Object.keys(mine).map(k=>`<option>${k}</option>`).join('')}</select>
      <button type="button" class="secondary" id="edLoad">Открыть</button><button type="button" class="secondary" id="edDel">Удалить</button>
      <button type="button" class="secondary" id="edNew">Новый</button><button type="button" class="secondary" id="edRndB">🎲 Случайный</button><button type="button" class="secondary" id="edExp">Экспорт файла</button><label class="secondary edimp">Импорт<input id="edImp" type="file" accept=".json,application/json" hidden></label>
      <button type="button" class="secondary" id="edExit">Выход · Esc</button>
      <span class="edhelp">ЛКМ — рисовать, ПКМ — стереть, колесо — прокрутка. Края уровня — стены.</span></div>`;
    cv2=el.querySelector('#edCv'); g2=cv2.getContext('2d');
    el.querySelectorAll('canvas[data-ico]').forEach(c=>ico(c.getContext('2d'),c.dataset.ico,0,0,28));
    const info=el.querySelector('#edInfo'), showInfo=id=>{ const d=DESC[id]; if(!d) return; const nm=(TOOLS.flatMap(g=>g[1]).find(t=>t[0]===id)||[])[1]||'';
      info.innerHTML=`<div class="edih"><canvas width="40" height="40" id="edIc"></canvas><b>${nm}</b></div><p>${d[0]} ${d[1]}</p>${d[2]?`<p class="edcomb"><b>Сочетается:</b> ${d[2]}</p>`:''}`; ico(info.querySelector('#edIc').getContext('2d'),id,0,0,40); };
    const place=e=>{ const w=info.offsetWidth||270, h=info.offsetHeight||120; let x=e.clientX+16, y=e.clientY+14; if(x+w>innerWidth-8) x=e.clientX-w-16; if(y+h>innerHeight-8) y=innerHeight-h-8; info.style.left=x+'px'; info.style.top=y+'px'; };
    const hideInfo=()=>{ info.style.display='none'; };
    el.querySelectorAll('[data-tool]').forEach(b=>{ b.onmouseenter=()=>{ showInfo(b.dataset.tool); info.style.display='block'; const r=b.getBoundingClientRect(), side=el.querySelector('.edside').getBoundingClientRect(), h=info.offsetHeight; info.style.left=(side.right+10)+'px'; info.style.top=Math.max(8,Math.min(innerHeight-h-8,r.top+r.height/2-h/2))+'px'; }; b.onmouseleave=hideInfo; });
    E.place=place; E.hideInfo=hideInfo;
    el.querySelector('#edSearch').oninput=e=>{ const v=e.target.value.trim().toLowerCase(); el.querySelectorAll('.edgrp').forEach(gp=>{ let any=false; gp.querySelectorAll('.edt').forEach(b=>{ const ok=!v||b.dataset.name.includes(v); b.hidden=!ok; any=any||ok; }); gp.hidden=!any; }); };
    const q=s=>el.querySelector(s);
    q('#edName').oninput=e=>{ L.name=e.target.value; dirty=true; }; q('#edHint').oninput=e=>{ L.hint=e.target.value; dirty=true; };
    q('#edW').onchange=e=>resize(+e.target.value); q('#edMotif').onchange=e=>{ L.motif=e.target.value; dirty=true; };
    q('#edHue').oninput=e=>{ const v=+e.target.value; L.hue=v<0?null:v; dirty=true; paint(); }; q('#edDark').onchange=e=>{ L.dark=e.target.checked; dirty=true; };
    q('#edOrder').onchange=e=>{ L.order=e.target.value; dirty=true; paint(); };
    el.querySelectorAll('[data-timed]').forEach(c=>c.onchange=()=>{ L.timed[c.dataset.timed]=c.checked; dirty=true; });
    el.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{ tool=b.dataset.tool; moverA=null; el.querySelectorAll('.edt').forEach(x=>x.classList.toggle('on',x===b)); });
    q('#edPlay2').onclick=()=>test(false); q('#edPlayS').onclick=()=>test('spark'); q('#edPlayB').onclick=()=>test('bolt');
    q('#edSave').onclick=()=>{ const o=list(); const nm=(L.name||'Мой уровень').trim(); o[nm]=L; saveList(o); dirty=false; toastQ.push({small:'Конструктор',title:'Сохранено: '+nm}); showToast(); build(); };
    q('#edLoad').onclick=()=>{ const k=q('#edList').value; if(!k) return; L=JSON.parse(JSON.stringify(list()[k])); build(); };
    q('#edDel').onclick=()=>{ const k=q('#edList').value; if(!k||!confirm('Удалить уровень «'+k+'»?')) return; const o=list(); delete o[k]; saveList(o); build(); };
    q('#edNew').onclick=()=>{ if(dirty&&!confirm('Начать новый уровень? Несохранённое пропадёт.')) return; L=blankLevel(); dirty=false; build(); };
    q('#edExp').onclick=()=>{ const data=JSON.stringify({iskraBoltLevel:1,level:L},null,1); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.download=(L.name||'level').replace(/[^\wа-яё -]/gi,'_')+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); };
    q('#edImp').onchange=e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ try{ const d=JSON.parse(t); L=Object.assign(blankLevel(),d.level||d); build(); }catch(err){ alert('Не удалось открыть файл уровня'); } }); };
    q('#edExit').onclick=close; q('#edRndB').onclick=rndDialog;
    const wrap=q('.edwrap'); wrap.addEventListener('wheel',e=>{ if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){ wrap.scrollLeft+=e.deltaY; e.preventDefault(); } },{passive:false});
    cv2.oncontextmenu=e=>e.preventDefault();
    cv2.onpointerdown=e=>{ painting=e.button===2?2:1; apply(e); }; cv2.onpointermove=e=>{ if(painting&&!tool.startsWith('@')&&tool!=='E'&&tool!=='1'&&tool!=='2') apply(e); hover=cellAt(e); paint(); const [hx,hy]=hover; if(e) place(e); const id=L.enemies.find(o=>o.tx===hx&&o.ty===hy)?'@'+L.enemies.find(o=>o.tx===hx&&o.ty===hy).t:L.pickups.find(o=>o.tx===hx&&o.ty===hy)?'@'+L.pickups.find(o=>o.tx===hx&&o.ty===hy).t:(L.map[hy]&&L.map[hy][hx]); if(id&&id!=='.'){ if(id!==lastHov){ lastHov=id; showInfo(id); } info.style.display='block'; } else { lastHov=null; hideInfo(); } };
    cv2.onpointerleave=()=>{ lastHov=null; hideInfo(); };
    addEventListener('pointerup',()=>painting=0);
    requestAnimationFrame(()=>{ fitCell(); paint(); });
  }
  let hover=null, lastHov=null;
  function fitCell(){ const wrap=el.querySelector('.edwrap'); cell=Math.max(14,Math.floor((wrap.clientHeight-14)/ROWS)); cv2.width=L.map[0].length*cell; cv2.height=ROWS*cell; }
  const cellAt=e=>{ const r=cv2.getBoundingClientRect(); return [Math.floor((e.clientX-r.left)/cell),Math.floor((e.clientY-r.top)/cell)]; };
  function apply(e){ const [x,y]=cellAt(e), W=L.map[0].length; if(x<0||y<0||x>=W||y>=ROWS) return; const erase=painting===2;
    const inner=x>0&&y>0&&x<W-1&&y<ROWS-1, at=(o)=>o.tx===x&&o.ty===y;
    if(erase){ if(inner) L.map[y][x]='.'; L.enemies=L.enemies.filter(o=>!at(o)); L.pickups=L.pickups.filter(o=>!at(o)); L.flags=L.flags.filter(f=>f!==x); L.winds=L.winds.filter(w=>!(x>=w.tx&&x<w.tx+3)); L.movers=L.movers.filter(m=>!((m.ax===x&&m.ay===y)||(m.bx===x&&m.by===y))); if(L.trapX===x) L.trapX=null; }
    else if(tool.startsWith('@')){ const t=tool.slice(1);
      if(['crawler','big','flyer','turret','shield'].includes(t)){ L.enemies=L.enemies.filter(o=>!at(o)); L.enemies.push({t,tx:x,ty:y}); }
      else if(['gear','heart','pshield','triple','rapid','power'].includes(t)){ L.pickups=L.pickups.filter(o=>!at(o)); L.pickups.push({t,tx:x,ty:y}); }
      else if(t==='flag'){ if(!L.flags.includes(x)) L.flags.push(x); }
      else if(t==='wind'){ L.winds=L.winds.filter(w=>Math.abs(w.tx-x)>=3); L.winds.push({tx:x}); }
      else if(t==='trap') L.trapX=x;
      else if(t==='mover'){ if(!moverA) moverA=[x,y]; else { L.movers.push({ax:moverA[0],ay:moverA[1],bx:x,by:y}); moverA=null; } } }
    else if(inner){ if(tool==='E'){ L.map.forEach(r=>r.forEach((c,i)=>{ if(c==='E') r[i]='.'; })); for(const [dx,dy] of [[0,0],[1,0],[0,-1],[1,-1]]) if(x+dx<W-1&&y+dy>0) L.map[y+dy][x+dx]='E'; }
      else { if(tool==='1'||tool==='2') L.map.forEach(r=>r.forEach((c,i)=>{ if(c===tool) r[i]='.'; })); L.map[y][x]=tool; } }
    dirty=true; paint(); }
  function paint(){ if(!g2) return; const W=L.map[0].length, c=cell, g=g2;
    const hue=L.hue; g.fillStyle=hue==null?'#0b1830':`hsl(${hue},45%,12%)`; g.fillRect(0,0,cv2.width,cv2.height);
    g.strokeStyle='rgba(156,195,255,.08)'; g.lineWidth=1; for(let x=0;x<=W;x++){ g.beginPath(); g.moveTo(x*c+.5,0); g.lineTo(x*c+.5,ROWS*c); g.stroke(); } for(let y=0;y<=ROWS;y++){ g.beginPath(); g.moveTo(0,y*c+.5); g.lineTo(W*c,y*c+.5); g.stroke(); }
    for(let s=1;s*32<W;s++){ g.strokeStyle='rgba(255,209,102,.35)'; g.setLineDash([6,6]); g.beginPath(); g.moveTo(s*31*c,0); g.lineTo(s*31*c,ROWS*c); g.stroke(); g.setLineDash([]); }
    g.font=`700 ${Math.floor(c*.5)}px system-ui`; g.textAlign='center'; g.textBaseline='middle';
    for(let y=0;y<ROWS;y++) for(let x=0;x<W;x++){ const ch=L.map[y][x]; if(ch==='.') continue; ico(g,ch,x*c,y*c,c); }
    { const ex=[]; L.map.forEach((r,y)=>r.forEach((ch,x)=>{ if(ch==='E') ex.push([x,y]); })); if(ex.length){ const x0=Math.min(...ex.map(e=>e[0])),y0=Math.min(...ex.map(e=>e[1])); g.fillStyle='#0a1222'; g.fillRect(x0*c,y0*c,2*c,2*c); ico(g,'E',x0*c,y0*c,2*c); } }
    for(const e of L.enemies) ico(g,'@'+e.t,e.tx*c,e.ty*c,c);
    for(const p of L.pickups) ico(g,'@'+p.t,p.tx*c,p.ty*c,c);
    for(const m of L.movers){ g.strokeStyle='#cfd8e6'; g.lineWidth=3; g.beginPath(); g.moveTo(m.ax*c+c,m.ay*c+c/2); g.lineTo(m.bx*c+c,m.by*c+c/2); g.stroke(); g.lineWidth=1; g.fillStyle='#cfd8e6'; g.fillRect(m.ax*c,m.ay*c+c*.3,c*2,c*.4); g.globalAlpha=.4; g.fillRect(m.bx*c,m.by*c+c*.3,c*2,c*.4); g.globalAlpha=1; }
    if(moverA){ g.strokeStyle='#ffd166'; g.strokeRect(moverA[0]*c,moverA[1]*c,c*2,c); }
    for(const w of L.winds){ g.fillStyle='rgba(207,232,255,.18)'; g.fillRect(w.tx*c,3*c,3*c,14*c); }
    for(const x of L.flags){ g.strokeStyle='#cfd8e6'; g.lineWidth=2; g.beginPath(); g.moveTo(x*c,17*c); g.lineTo(x*c,14*c); g.stroke(); g.fillStyle='#7fe08a'; g.beginPath(); g.moveTo(x*c,14*c); g.lineTo(x*c+c,14.4*c); g.lineTo(x*c,14.9*c); g.fill(); g.lineWidth=1; }
    if(L.trapX!=null){ g.strokeStyle='#ff3b4e'; g.setLineDash([5,5]); g.lineWidth=2; g.beginPath(); g.moveTo(L.trapX*c,c); g.lineTo(L.trapX*c,17*c); g.stroke(); g.setLineDash([]); g.lineWidth=1; }
    if(hover){ g.strokeStyle='#ffd166'; g.lineWidth=2; g.strokeRect(hover[0]*c+1,hover[1]*c+1,c-2,c-2); g.lineWidth=1; }
  }
  // ---------- random level from the game's generator ----------
  const RND_SETS=[['Задачки',['cdrop','detour','tdoor','order','trap','lever','key']],['Классика',['A','B','C','D','E','F','M','N','L']],['Механики',['ice','portal','crumble','wind']]];
  const rndLabel=t=>(PZ_LABEL[t]||CHUNK_LABEL[t]||t);
  let rndOpt={screens:2,lvl:5,foes:'mid',on:{cdrop:1,detour:1,tdoor:1,order:1,trap:1,lever:1,key:1,A:1,B:1,C:1,D:1,E:1,F:1,M:1,N:1,L:0,ice:0,portal:0,crumble:0,wind:0}};
  function randomize(){ const o=rndOpt, allowed=Object.keys(o.on).filter(k=>o.on[k]); if(!allowed.length){ alert('Отметьте хотя бы одну задачку.'); return; }
    const seed=Math.floor(Math.random()*1e6), Rr=rng(seed), pick=a=>a[Math.floor(Rr()*a.length)], n=o.lvl, once={order:0,trap:0};
    const parts=[]; for(let k=0;k<o.screens;k++){ const f=[]; for(let i=0;i<3;i++){ let t, g=0; do{ t=pick(allowed); g++; } while(g<30&&((once[t]!=null&&once[t]>0)||(f.includes(t)&&allowed.length>2))); if(once[t]!=null) once[t]++; f.push(t); } parts.push(genLevel(n,seed%997+k+1,f)); }
    const rows=[...Array(ROWS)].map(()=>[]), N={name:'Случайный уровень',motif:pick(NAMES),hue:null,dark:false,hint:'',order:'abc',timed:{P:false,Q:false,R:false},enemies:[],pickups:[],movers:[],winds:[],flags:[],trapX:null};
    parts.forEach((Lp,k)=>{ const gm=Lp.map.map(r=>r.split('')), x0=k?1:0, x1=k<parts.length-1?31:32, off=rows[0].length, dx=off-x0;
      if(k) N.flags.push(off+1);
      for(let y=0;y<ROWS;y++) for(let x=x0;x<x1;x++){ let c=gm[y][x]; if(k&&(c==='1'||c==='2')) c='.'; if(k<parts.length-1&&c==='E') c='.'; if(c==='S') c='#'; rows[y].push(c); }
      for(const e of Lp.enemies||[]) N.enemies.push({t:e.type==='flyer'?'flyer':e.type==='turret'?'turret':e.trait==='shield'?'shield':'crawler',tx:e.tx+dx,ty:e.ty});
      for(const pk of Lp.pickups||[]){ if(pk.secret||pk.type==='relic') continue; const t=pk.type==='shield'?'pshield':pk.type; if(['gear','heart','pshield','triple','rapid','power'].includes(t)) N.pickups.push({t,tx:pk.tx+dx,ty:pk.ty}); }
      for(const m of Lp.movers||[]) N.movers.push(Object.assign({},m,{ax:m.ax+dx,bx:m.bx+dx}));
      for(const w of Lp.winds||[]) N.winds.push({tx:Math.round(w.x/T)+dx});
      for(const z of Lp.pz||[]){ if(z.type==='order') N.order=z.order; if(z.type==='trap') N.trapX=Math.round(z.trigX/T)+dx; if(z.type==='timed'){ const [x,y]=z.cells.door[0]; const K=gm[y][x]; if('PQR'.includes(K)) N.timed[K]=true; } } });
    N.map=rows;
    if(o.foes==='few') N.enemies=N.enemies.filter((e,i)=>i%2===0);
    if(o.foes==='many'){ const W=rows[0].length; for(let i=0;i<o.screens*2;i++){ const x=6+Math.floor(Rr()*(W-12)); if(rows[16][x]==='.'&&rows[15][x]==='.'&&!N.enemies.some(e=>Math.abs(e.tx-x)<2)) N.enemies.push({t:Rr()<.7?'crawler':'flyer',tx:x,ty:Rr()<.7?16:9}); } }
    L=N; dirty=true; build(); toastQ.push({small:'Конструктор',title:'🎲 Готово! Жмите ещё раз или правьте.'}); showToast(); }
  function rndDialog(){ let d=el.querySelector('#edRnd'); if(d){ d.remove(); return; } d=document.createElement('div'); d.id='edRnd';
    d.innerHTML=`<b>🎲 Случайный уровень</b>
      <label>Длина <select id="rS">${[1,2,3,4].map(k=>`<option value="${k}" ${k===rndOpt.screens?'selected':''}>${k} экран${k>1?(k<5?'а':'ов'):''}</option>`).join('')}</select></label>
      <label>Сложность (как уровень игры) <input id="rL" type="range" min="1" max="60" value="${rndOpt.lvl}"><output id="rLo">${rndOpt.lvl}</output></label>
      <label>Врагов <select id="rF">${[['few','мало'],['mid','средне'],['many','много']].map(([k,n])=>`<option value="${k}" ${k===rndOpt.foes?'selected':''}>${n}</option>`).join('')}</select></label>
      ${RND_SETS.map(([gn,ts])=>`<div class="rgrp"><span>${gn}</span>${ts.map(t=>`<label class="rchk"><input type="checkbox" data-r="${t}" ${rndOpt.on[t]?'checked':''}>${rndLabel(t)}</label>`).join('')}</div>`).join('')}
      <div class="rbtn"><button type="button" class="primary" id="rGo">🎲 Сгенерировать</button><button type="button" class="secondary" id="rX">Закрыть</button></div>`;
    el.appendChild(d); const q=x=>d.querySelector(x);
    q('#rS').onchange=e=>rndOpt.screens=+e.target.value; q('#rL').oninput=e=>{ rndOpt.lvl=+e.target.value; q('#rLo').textContent=e.target.value; }; q('#rF').onchange=e=>rndOpt.foes=e.target.value;
    d.querySelectorAll('[data-r]').forEach(c=>c.onchange=()=>rndOpt.on[c.dataset.r]=c.checked?1:0);
    q('#rX').onclick=()=>d.remove(); q('#rGo').onclick=()=>{ if(dirty&&!confirm('Заменить текущий уровень случайным? Несохранённое пропадёт.')) return; randomize(); rndDialog(); }; }
  // ---------- test run ----------
  function test(hero){ const G=toGame(), m=G.map;
    if(!m.some(r=>r.includes('E'))){ alert('Поставьте выход (E).'); return; }
    if(!m.some(r=>r.includes('1'))){ alert('Поставьте старт Искры (1).'); return; }
    if(!hero&&!m.some(r=>r.includes('2'))){ alert('Поставьте старт Болта (2).'); return; }
    edSaved={solo,soloHero,levelIdx}; solo=!!hero; if(hero) soloHero=hero;
    if(hero) G.map=G.map.map(r=>r.replace('2','.'));
    edLevel=G; edTest=true; el.hidden=true; E.on=false; deaths=0;
    lastIntro=-1; loadLevel(0); setState('play'); }
  E.endTest=(won)=>{ if(!edTest) return; edTest=false; edLevel=null; if(edSaved){ solo=edSaved.solo; soloHero=edSaved.soloHero; } for(const k in cache) delete cache[k];
    loadLevel(edSaved?edSaved.levelIdx:0); open(); toastQ.push({small:'Конструктор',title:won?'Уровень пройден! 🎉':'Тест закончен'}); showToast(); };
  function open(){ if(!L){ L=blankLevel(); try{ const d=JSON.parse(localStorage.getItem(STORE+'-draft')||'null'); if(d) L=Object.assign(blankLevel(),d); }catch(e){} }
    E.on=true; overlay.hidden=true; state='editor'; build(); el.hidden=false; document.body.classList.add('editing'); }
  function close(){ try{ localStorage.setItem(STORE+'-draft',JSON.stringify(L)); }catch(e){} E.on=false; el.hidden=true; document.body.classList.remove('editing'); setState('menu'); pressed.clear(); }
  E.open=open; E.close=close;
  addEventListener('keydown',e=>{ if(!E.on) return; if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')){ e.stopImmediatePropagation(); return; } if(e.code==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); close(); } else e.stopImmediatePropagation(); },true);
  addEventListener('resize',()=>{ if(E.on){ fitCell(); paint(); } });
  setInterval(()=>{ if(E.on&&L) try{ localStorage.setItem(STORE+'-draft',JSON.stringify(L)); }catch(e){} },5000);
  return E;
})();
