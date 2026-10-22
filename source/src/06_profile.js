/* ================= profile: achievements & looks ================= */
const ACH_IC={"shopper":["#e7b54a","<path d=\"M4 7h16l-1.5 12h-13z\"/><path d=\"M9 7a3 3 0 0 1 6 0\"/>"],"upgraded5":["#5fe3d9","<path d=\"M12 3v18M5 10l7-7 7 7\"/><path d=\"M5 16l7-7 7 7\"/>"],"first": ["#e7b54a", "<path d=\"M6 21V4\"/><path d=\"M6 4h11l-2.5 4L17 12H6\"/>"], "boost": ["#ff8a3d", "<rect x=\"6\" y=\"15\" width=\"12\" height=\"6\" rx=\"2\"/><path d=\"M12 12V3M8 7l4-4 4 4\"/>"], "slam": ["#62c7c1", "<path d=\"M12 2v8M8.5 6.5L12 10l3.5-3.5\"/><path d=\"M3 14h18\"/><path d=\"M8 14l-2 7M12 14l1 3-1 4M16 14l2 7\"/>"], "crate": ["#d8a466", "<rect x=\"5\" y=\"4\" width=\"14\" height=\"13\" rx=\"1.5\"/><path d=\"M5 4l14 13M19 4L5 17\"/><path d=\"M3 21h18\"/>"], "bridge": ["#c79bff", "<path d=\"M3 10h18\"/><path d=\"M6 10v3M18 10v3M12 10v3\"/><path d=\"M3 21l2-5 2 5 2-5 2 5 2-5 2 5 2-5 2 5 2-5 1 3\"/>"], "revive": ["#7fe08a", "<path d=\"M12 20s-7.5-4.5-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.5 12 20 12 20z\"/><path d=\"M12 10v6M9 13h6\"/>"], "stomp10": ["#ff6b81", "<path d=\"M6 21h12\"/><path d=\"M8 18l8-1.8-8-1.8 8-1.8-8-1.8 8-1.8\"/><path d=\"M12 2.5v4M9.5 4.5L12 7l2.5-2.5\"/>"], "kills100": ["#ff6b6b", "<circle cx=\"12\" cy=\"12\" r=\"7\"/><path d=\"M12 2v5M12 17v5M2 12h5M17 12h5\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"currentColor\"/>"], "gears100": ["#e7b54a", "<circle cx=\"12\" cy=\"12\" r=\"3\"/><circle cx=\"12\" cy=\"12\" r=\"6.5\"/><path d=\"M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1\"/>"], "gears500": ["#b98c3c", "<path d=\"M3 21V9.5L12 4l9 5.5V21\"/><rect x=\"6.5\" y=\"14\" width=\"5\" height=\"5\"/><rect x=\"12.5\" y=\"14\" width=\"5\" height=\"5\"/><rect x=\"9.5\" y=\"9\" width=\"5\" height=\"5\"/>"], "arsenal": ["#ffd166", "<rect x=\"3\" y=\"4.5\" width=\"10\" height=\"4\" rx=\"2\"/><rect x=\"3\" y=\"10\" width=\"14\" height=\"4\" rx=\"2\"/><rect x=\"3\" y=\"15.5\" width=\"10\" height=\"4\" rx=\"2\"/><path d=\"M19.5 12h2M16 6.5h2M16 17.5h2\"/>"], "speed": ["#8fd3ff", "<path d=\"M13.5 2L5 14h6.5L10 22l9-12.5h-6.5z\"/>"], "boss1": ["#e7b54a", "<path d=\"M8 3.5h8v5.5a4 4 0 0 1-8 0z\"/><path d=\"M8 5.5H5a3 3 0 0 0 3 4.2M16 5.5h3a3 3 0 0 1-3 4.2\"/><path d=\"M12 13v4M8.5 21h7M10 17h4\"/>"], "clean": ["#9cc3ff", "<path d=\"M12 2.8l7.5 3v5.4c0 5-3.6 8.3-7.5 10-3.9-1.7-7.5-5-7.5-10V5.8z\"/><path d=\"M8.5 12l2.5 2.5 4.5-5\"/>"], "boss_all": ["#ffd166", "<path d=\"M4 17.5L3 7l5 4 4-6.5 4 6.5 5-4-1 10.5z\"/><path d=\"M4 21h16\"/><circle cx=\"12\" cy=\"13\" r=\"1.4\" fill=\"currentColor\"/>"], "flawless10": ["#c79bff", "<path d=\"M12 2.8l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L3 9.4l6.2-.9z\"/>"], "lv50": ["#62c7c1", "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3a9 9 0 0 1 0 18z\" fill=\"currentColor\"/>"], "final": ["#ff6b6b", "<circle cx=\"12\" cy=\"9\" r=\"6\"/><path d=\"M8.5 13.8L7 22l5-3 5 3-1.5-8.2\"/><path d=\"M12 5.8l1 2h2.2l-1.7 1.4.7 2.1L12 10l-2.2 1.3.7-2.1-1.7-1.4H11z\" fill=\"currentColor\" stroke=\"none\"/>"], "stylist": ["#ff5fa2", "<path d=\"M3.5 18.5h17\"/><path d=\"M7 18.5V5.5h10v13\"/><path d=\"M7 14.5h10\"/>"], "cheater": ["#7fe08a", "<path d=\"M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/><circle cx=\"13\" cy=\"11\" r=\".9\" fill=\"currentColor\"/>"]};
const LOCK_SVG='<svg class="lk" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
function achIcon(id,got){
  const [c,ic]=ACH_IC[id]||['#e7b54a','<circle cx="12" cy="12" r="6"/>'];
  return `<span class="medal ic ${got?'got':''}" style="--mc:${c}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg>${got?'':LOCK_SVG}</span>`;
}
const ACH=[
  {id:'first',n:'Первый уровень',d:'Пройдите первый уровень.'},
  {id:'boost',n:'Подсади меня',d:'Подбросьте Искру с головы Болта.'},
  {id:'slam',n:'Сквозь пол',d:'Проломите треснувший пол ударом Болта.'},
  {id:'crate',n:'Грузчики',d:'Поставьте ящик на кнопку.'},
  {id:'bridge',n:'Мостостроители',d:'Включите мост над шипами.'},
  {id:'revive',n:'Не бросай своих',d:'Поднимите упавшего напарника.'},
  {id:'portal',n:'Сквозь стены',d:'Пройдите через портал.'},
  {id:'wind',n:'Попутный ветер',d:'Взлетите на восходящем потоке.'},
  {id:'combo5',n:'Мясорубка',d:'Сделайте комбо ×5.'},
  {id:'charge',n:'Под напряжением',d:'Искра рывком заряжает Болта.',coop:true},
  {id:'stomp10',n:'Прыг-скок',d:'Раздавите 10 врагов прыжком сверху.'},
  {id:'kills100',n:'Санитары цеха',d:'Победите 100 врагов.'},
  {id:'gears100',n:'Копилка',d:'Соберите 100 шестерёнок за всё время.'},
  {id:'gears500',n:'Склад запчастей',d:'Соберите 500 шестерёнок за всё время.'},
  {id:'arsenal',n:'Арсенал',d:'Подберите тройной, скорострел и мощный выстрел.'},
  {id:'speed',n:'Вжух',d:'Пройдите обычный уровень быстрее 20 секунд.'},
  {id:'boss1',n:'Первый трофей',d:'Победите любого босса.'},
  {id:'clean',n:'Без единой царапины',d:'Победите босса так, чтобы никто не упал.'},
  {id:'boss_all',n:'Коллекция механизмов',d:'Победите всех четырёх разных боссов.'},
  {id:'flawless10',n:'Чистый чертёж',d:'Пройдите уровни 1–10 подряд без падений.'},
  {id:'lv50',n:'Полпути',d:'Доберитесь до 50-го уровня.'},
  {id:'final',n:'Главный механизм',d:'Пройдите все 100 уровней.'},
  {id:'stylist',n:'Модники',d:'Поменяйте внешний вид героя в мастерской.'},
  {id:'shopper',n:'Первая покупка',d:'Купите улучшение в Лавке Механика.'},
  {id:'upgraded5',n:'Тюнинг',d:'Соберите 5 разных улучшений за один забег.'},
  {id:'cheater',n:'Я только посмотреть',d:'Включите любой чит. Пока читы включены, другие достижения не выдаются.'}
];
const SKINS={
  spark:[{id:'orange',n:'Огонёк',body:'#ff8a3d',belly:'#ffb070',flame:'#ffd166',core:'#fff3c4'},
         {id:'pink',n:'Фуксия',body:'#ff5fa2',belly:'#ffa3c9',flame:'#ffc1dc',core:'#fff0f7'},
         {id:'blue',n:'Газовая горелка',body:'#4f8dff',belly:'#9cc0ff',flame:'#8fd3ff',core:'#e8f7ff'},
         {id:'green',n:'Изумруд',body:'#3fbf6e',belly:'#93e2ae',flame:'#c8ff8a',core:'#f2ffe0'},
         {id:'violet',n:'Аметист',body:'#9a6bff',belly:'#c9b1ff',flame:'#e3c6ff',core:'#fbf2ff'},
         {id:'gold',n:'Золото',body:'#e7b54a',belly:'#f6d88f',flame:'#fff3c4',core:'#ffffff',req:'boss_all'}],
  bolt:[{id:'teal',n:'Бирюза',body:'#62c7c1',line:'#2c7a76',eye:'#bffcff'},
        {id:'steel',n:'Сталь',body:'#9aa8b6',line:'#55636f',eye:'#d8f0ff'},
        {id:'red',n:'Рубин',body:'#e2574c',line:'#8a2a22',eye:'#ffe0a0'},
        {id:'yellow',n:'Каска',body:'#f2c94c',line:'#a07a1a',eye:'#ffffff'},
        {id:'night',n:'Ночная смена',body:'#3c4a63',line:'#1c2536',eye:'#7fe08a'},
        {id:'gold',n:'Золото',body:'#e7b54a',line:'#9a6f1c',eye:'#ffffff',req:'boss_all'}]
};
const HATS=[{id:'none',n:'Без шапки'},{id:'cap',n:'Кепка'},{id:'bow',n:'Бантик'},{id:'glasses',n:'Тёмные очки'},
  {id:'headphones',n:'Наушники',req:'gears100'},{id:'crown',n:'Корона',req:'boss1'},{id:'tophat',n:'Цилиндр',req:'lv50'},
  {id:'horns',n:'Рожки'},{id:'halo',n:'Нимб'},{id:'flower',n:'Цветочек'},{id:'beanie',n:'Шапка с помпоном'},{id:'antenna',n:'Антенна'},{id:'pirate',n:'Пиратская повязка'}];
const LIMBS=[{id:'on',n:'Ручки и ножки'},{id:'off',n:'Без них'}];
const TRAILS=[{id:'none',n:'Нет'},{id:'sparkle',n:'Блёстки'},{id:'hearts',n:'Сердечки'},{id:'stars',n:'Звёзды'},{id:'rainbow',n:'Радуга'},{id:'notes',n:'Ноты'},{id:'smoke',n:'Дымок'}];
const EYES=[{id:'normal',n:'Обычные'},{id:'happy',n:'Довольные'},{id:'angry',n:'Сердитые'},{id:'sleepy',n:'Сонные'},{id:'stars',n:'Звёздочки'}];
const DEF_SETTINGS={r3d:true,padStyle:'auto',master:0.8,music:0.6,sfx:0.8,mute:false,quality:'high',particles:1,shake:true,glow:true,ambient:true,vignette:true,trails:true,flash:true,retro:false};
const PRESETS={low:{particles:0.35,glow:false,ambient:false,vignette:false,trails:false},medium:{particles:0.7,glow:true,ambient:true,vignette:true,trails:false},high:{particles:1,glow:true,ambient:true,vignette:true,trails:true}};
let demo=false;
const store={get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, set(k,v){ if(demo) return; try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }};
let achGot=store.get('iskra-bolt-ach',{}), stats=Object.assign({gears:0,kills:0,stomps:0,bosses:[],pw:[]},store.get('iskra-bolt-stats',{}));
let looks=(()=>{ const d={spark:{skin:'orange',hat:'none',color:'#ff8a3d',trail:'none',eyes:'normal',limbs:'on'},bolt:{skin:'teal',hat:'none',color:'#62c7c1',trail:'none',eyes:'normal',limbs:'on'}}, s=store.get('iskra-bolt-looks',{}); for(const k of ['spark','bolt']) Object.assign(d[k],s[k]||{}); return d; })();
const saveStats=()=>store.set('iskra-bolt-stats',stats);
let settings=Object.assign({},DEF_SETTINGS,store.get('iskra-bolt-settings',{}));
const UPG=[
  {id:'triple',who:'spark',max:1,price:900,c:'#ff8a3d',n:'Тройной прыжок',d:['Искра прыгает в воздухе ещё два раза вместо одного.'],ic:'<path d="M6 21l6-4.5 6 4.5M6 14.5l6-4.5 6 4.5M6 8l6-4.5L18 8"/>'},
  {id:'dash',who:'spark',max:2,price:600,c:'#ffd166',n:'Длинный рывок',d:['Рывок Искры на 40% дальше.','Два рывка за один прыжок.'],ic:'<path d="M3 12h13M12 6l6 6-6 6"/><path d="M3 7h5M3 17h5"/>'},
  {id:'sparkDmg',who:'spark',max:2,price:700,c:'#ff5a2a',n:'Жаркие искры',d:['Искры Искры наносят +1 урона.','Ещё +1 урона искрам.'],ic:'<path d="M12 2.5c1 4 6.5 6 6.5 11.5a6.5 6.5 0 0 1-13 0c0-3.2 2-5.4 3.2-7.4 0 3.2 2 4.4 3.2 4.4 0-3.4-1-5.6.1-8.5z"/>'},
  {id:'sparkRate',who:'spark',max:2,price:650,c:'#ffb347',n:'Шквал',d:['Искра стреляет на 20% чаще.','Ещё на 20% чаще.'],ic:'<path d="M4 6.5l6 5.5-6 5.5M12 6.5l6 5.5-6 5.5"/>'},
  {id:'boltDouble',who:'bolt',max:1,price:900,c:'#62c7c1',n:'Реактивный Болт',d:['Болт может прыгнуть второй раз в воздухе.'],ic:'<path d="M12 22v-9M7.5 17l4.5-4.5 4.5 4.5M7.5 10L12 5.5 16.5 10"/><path d="M9 2.5h6"/>'},
  {id:'boost',who:'bolt',max:1,price:550,c:'#9cc3ff',n:'Супер-подброс',d:['Подброс Искры на 25% выше, и в полёте она под щитом.'],ic:'<path d="M6 21h12"/><path d="M8 18.2l8-1.8-8-1.8 8-1.8"/><path d="M12 10V3M8.5 6.5L12 3l3.5 3.5"/>'},
  {id:'slamWave',who:'bolt',max:1,price:800,c:'#5fe3d9',n:'Ударная волна',d:['Удар Болта сверху пускает по полу две волны, которые бьют врагов и боссов.'],ic:'<path d="M12 2.5v8M8.5 7.5L12 11l3.5-3.5"/><path d="M2 18c3-3 5-3 8 0s5 3 8 0c1.5-1.4 2.6-1.6 4-.6"/>'},
  {id:'boltDmg',who:'bolt',max:2,price:700,c:'#c7d3dd',n:'Тяжёлые гайки',d:['Гайки Болта наносят +1 урона.','Ещё +1 урона гайкам.'],ic:'<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><circle cx="12" cy="12" r="3.2"/>'},
  {id:'seeker',who:'both',max:1,price:3000,c:'#ff5fa2',n:'Самонаводка',d:['Пули обоих героев сами находят ближайшего врага или босса. Дорого, но мощно.'],ic:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>'},
  {id:'homing',who:'bolt',max:1,price:850,c:'#c79bff',n:'Магнитные гайки',d:['Гайки Болта подворачивают к ближайшей цели.'],ic:'<circle cx="18" cy="6" r="3"/><path d="M3 20c5-1 9-5 12.5-11.5"/><path d="M3 15c3 0 5-1 7-3"/>'},
  {id:'hearts',who:'both',max:2,price:750,c:'#ff6b81',n:'Запасное сердце',d:['Оба героя начинают уровень с 4 сердцами.','С 5 сердцами.'],ic:'<path d="M12 20s-7.5-4.5-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.5 12 20 12 20z"/><path d="M12 10v6M9 13h6"/>'},
  {id:'secondWind',who:'both',max:1,price:900,c:'#7fe08a',n:'Второе дыхание',d:['Раз за уровень каждый герой сам встаёт с 1 сердцем вместо падения.'],ic:'<path d="M3 8h10.5a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 18h7"/>'},
  {id:'longPw',who:'both',max:2,price:500,c:'#ffd166',n:'Долгие бонусы',d:['Усиления держатся на 50% дольше.','Вдвое дольше обычного.'],ic:'<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/>'},
  {id:'magnet',who:'both',max:1,price:400,c:'#e7b54a',n:'Магнит',d:['Шестерёнки и бонусы притягиваются издалека.'],ic:'<path d="M6 3v8a6 6 0 0 0 12 0V3"/><path d="M6 7.5h4M14 7.5h4"/>'},
  {id:'armor',who:'both',max:1,price:700,c:'#9cc3ff',n:'Броня',d:['Каждый уровень оба героя начинают со щитом.'],ic:'<path d="M12 2.8l7.5 3v5.4c0 5-3.6 8.3-7.5 10-3.9-1.7-7.5-5-7.5-10V5.8z"/>'},
  {id:'fastRevive',who:'both',max:1,price:450,c:'#7fe08a',n:'Быстрая помощь',d:['Поднять напарника можно вдвое быстрее.'],ic:'<path d="M12 20s-7.5-4.5-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.5 12 20 12 20z"/><path d="M13 8.5l-2.5 4h3l-2.5 4"/>'},
  {id:'crit',who:'both',max:2,price:650,c:'#ff3df2',n:'Крит-удача',d:['Шанс крита по боссам +10%.','Ещё +10% к шансу крита.'],ic:'<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/>'},
  {id:'speed',who:'both',max:2,price:550,c:'#8fd3ff',n:'Лёгкий шаг',d:['Оба героя бегают на 10% быстрее.','Ещё +10% к скорости.'],ic:'<path d="M4 17h9l3-5h4.5M6 13h5M8 9h5"/><circle cx="17.5" cy="7" r="1.6"/>'}
];
const WHO_NAME={spark:'Искра',bolt:'Болт',both:'Оба'};
let run=Object.assign({score:0,wallet:0,up:{},offer:[],refresh:0,reward:null},store.get('iskra-bolt-run'+(solo?'-'+soloHero:''),{}));
const saveRun=()=>{ store.set('iskra-bolt-run'+modeSuffix(),run); snapSlot(); };
const U=id=>run.up[id]||0;
const upPrice=d=>Math.round(d.price*Math.pow(1.8,U(d.id))/50)*50;
function addScore(n,x,y,big){
  run.score+=n; run.wallet+=n; const el=document.getElementById('score'); if(el) el.textContent=run.score.toLocaleString('ru-RU');
  if(x!=null) texts.push({x,y,t:'+'+n,life:big?1.3:.8,c:'#ffd166',small:!big,score:true});
}
const maxAir=p=>p.kind==='spark'?1+U('triple'):(U('boltDouble')?1:0);
const maxDash=()=>U('dash')>=2?2:1;
const saveSettings=()=>store.set('iskra-bolt-settings',settings);
const ACTIONS=['left','right','jump','ability','fire','use','next'];
const ACT_NAME={left:'Влево',right:'Вправо',jump:'Прыжок',ability:{spark:'Рывок',bolt:'Подброс / удар'},fire:'Огонь',use:'Применить бонус',next:'Следующий бонус'};
const DEFAULT_BINDS={spark:{kb:{left:'KeyA',right:'KeyD',jump:'KeyW',ability:'KeyS',fire:'KeyE',use:'KeyQ',next:'KeyC'},pad:{jump:0,ability:2,fire:1,use:3,next:5}},
                     bolt:{kb:{left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',ability:'ArrowDown',fire:'Slash',use:'Period',next:'Comma'},pad:{jump:0,ability:2,fire:1,use:3,next:5}}};
const clone=o=>JSON.parse(JSON.stringify(o));
let binds=(()=>{ const s=store.get('iskra-bolt-binds',null), d=clone(DEFAULT_BINDS); if(s) for(const k of ['spark','bolt']){ Object.assign(d[k].kb,(s[k]||{}).kb||{}); Object.assign(d[k].pad,(s[k]||{}).pad||{}); } return d; })();
let swapPads=!!store.get('iskra-bolt-swappads',false);
const saveBinds=()=>store.set('iskra-bolt-binds',binds);
function assignKey(kind,action,code){
  const old=binds[kind].kb[action];
  for(const k2 of ['spark','bolt']) for(const a2 of ACTIONS) if(!(k2===kind&&a2===action)&&binds[k2].kb[a2]===code) binds[k2].kb[a2]=old;
  binds[kind].kb[action]=code; saveBinds(); renderLegend();
}
function assignPad(kind,action,btn){
  const old=binds[kind].pad[action];
  for(const a2 of ['jump','ability','fire','use','next']) if(a2!==action&&binds[kind].pad[a2]===btn) binds[kind].pad[a2]=old;
  binds[kind].pad[action]=btn; saveBinds(); renderLegend();
}
function controlsLine(kind,pi){
  const gp=padFor(pi), ab=kind==='spark'?'рывок':'подброс / удар';
  if(gp){ const t=glyphType(pi), p=binds[kind].pad;
    return `<span class="chip">Геймпад ${PAD_TYPE_NAME[padType(gp)]}</span> стик или крестовина ходить · ${padGlyph(t,p.jump)} прыжок · ${padGlyph(t,p.ability)} ${ab} · ${padGlyph(t,p.fire)} огонь · ${padGlyph(t,p.use)} бонус · ${padGlyph(t,p.next)} выбор`; }
  const k=binds[kind].kb;
  return `${kbd(k.left)}${kbd(k.right)} ходить · ${kbd(k.jump)} прыжок · ${kbd(k.ability)} ${ab} · ${kbd(k.fire)} огонь · ${kbd(k.use)} бонус · ${kbd(k.next)} выбор`;
}
let legendSig='';
function renderLegend(force){
  const sig=JSON.stringify([pads().map(g=>g.id+g.index),swapPads,binds,solo,soloHero]);
  if(!force&&sig===legendSig) return; legendSig=sig;
  const s=document.getElementById('lgS'), b=document.getElementById('lgB');
  if(solo){ const gp=padFor(0)||padFor(1), t=glyphType(0), k=binds.spark.kb, pb=binds.spark.pad;
    const ab=soloHero==='spark'?'рывок':'удар сверху (в прыжке)';
    if(s) s.innerHTML=`<span class="who ${soloHero==='spark'?'s':'b'}">${soloHero==='spark'?'Искра':'Болт'}</span>`+(gp?`стик ходить · ${padGlyph(t,pb.jump)} прыжок · ${padGlyph(t,pb.ability)} ${ab} · ${padGlyph(t,pb.fire)} огонь`
      :`${kbd(k.left)}${kbd(k.right)} или ${kbd('ArrowLeft')}${kbd('ArrowRight')} ходить · ${kbd(k.jump)} или ${kbd('ArrowUp')} прыжок · ${kbd(k.ability)} или ${kbd('ArrowDown')} ${ab} · ${kbd(k.fire)} или ${kbd('Slash')} огонь`);
    if(b) b.innerHTML='';
  } else {
  if(s) s.innerHTML=`<span class="who s">Искра</span>${controlsLine('spark',0)}`;
  if(b) b.innerHTML=`<span class="who b">Болт</span>${controlsLine('bolt',1)}`; }
  if(state==='menu') setState('menu');
  else if(state==='controls'&&!capture) setState('controls');
  else if(state==='help') setState('help');
}
addEventListener('gamepadconnected',e=>{ if(window.MOBILE_BUILD||document.body.classList.contains('touch')) setPadMode(true);
  const list=pads(), idx=list.findIndex(g=>g.index===e.gamepad.index), pi=swapPads?1-idx:idx;
  if(pi===0||pi===1){ toastQ.push({small:'Геймпад подключён',title:`${PAD_TYPE_NAME[padType(e.gamepad)]} → ${pi===0?'Искра':'Болт'}`,medal:pi===0?'И':'Б'}); showToast(); }
  renderLegend();
});
addEventListener('gamepaddisconnected',()=>{ toastQ.push({small:'Геймпад',title:'Отключён',medal:'!'}); showToast(); renderLegend(); });
const achName=id=>{ const a=ACH.find(a=>a.id===id); return a?a.n:id; };
const reqOk=item=>!item.req||!!achGot[item.req];
let toastQ=[], toastBusy=false;
function showToast(){
  if(toastBusy||!toastQ.length) return; toastBusy=true;
  const a=toastQ.shift(), el=$('toast');
  el.innerHTML=`${a.icon?achIcon(a.icon,true):`<span class="medal">${a.medal}</span>`}<span><small>${a.small}</small><b>${a.title}</b></span>`;
  el.classList.add('show'); sfx('pick');
  setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>{ toastBusy=false; showToast(); },400); },2600);
}
function unlock(id){
  if(demo||achGot[id]) return; if(id!=='cheater'&&anyCheat()) return; const a=ACH.find(a=>a.id===id); if(!a) return;
  achGot[id]=Date.now(); store.set('iskra-bolt-ach',achGot); snapSlot(); toastQ.push({small:'Достижение',title:a.n,icon:a.id}); showToast();
}
function checkStatAch(){
  if(stats.gears>=100) unlock('gears100'); if(stats.gears>=500) unlock('gears500');
  if(stats.kills>=100) unlock('kills100'); if(stats.stomps>=10) unlock('stomp10');
  if(['triple','rapid','power'].every(k=>stats.pw.includes(k))) unlock('arsenal');
  if(['toad','eye','gear','queen'].every(k=>stats.bosses.includes(k))) unlock('boss_all');
}
function mixHex(a,b,t){ const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)), A=p(a), B=p(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join(''); }
function customSkin(kind){ const c=/^#[0-9a-f]{6}$/i.test(looks[kind].color)?looks[kind].color:'#ff8a3d';
  return kind==='spark'?{id:'custom',n:'Своя',body:c,belly:mixHex(c,'#ffffff',.38),flame:mixHex(c,'#ffe08a',.55),core:mixHex(c,'#ffffff',.88)}:{id:'custom',n:'Своя',body:c,line:mixHex(c,'#000000',.5),eye:mixHex(c,'#ffffff',.8)}; }
const skinOf=kind=>looks[kind].skin==='custom'?customSkin(kind):SKINS[kind].find(s=>s.id===looks[kind].skin&&reqOk(s))||SKINS[kind][0];
const hatOf=kind=>{ const h=HATS.find(h=>h.id===looks[kind].hat); return h&&reqOk(h)?h.id:'none'; };
let levelDowned=false, runClean=false, levelHurt=false, combo=0, comboT=0;

