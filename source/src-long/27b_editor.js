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
#editor .edpal{width:210px;overflow:auto;padding:6px;background:#0d1628;border-right:1px solid #22324f}
#editor .edgrp>span{display:block;font:700 10px Unbounded,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#9cc3ff;margin:8px 2px 4px}
#editor .edt{display:flex;gap:6px;align-items:center;width:100%;text-align:left;background:transparent;border:1px solid transparent;color:#e8effa;border-radius:6px;padding:3px 5px;font:inherit;cursor:pointer}
#editor .edt i{flex:none;width:20px;height:20px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font:700 11px system-ui;color:#0b1220;font-style:normal}
#editor .edt.on{border-color:#ffd166;background:#1b2a48}
#editor .edwrap{flex:1;overflow:auto;padding:6px}
#editor canvas{display:block;cursor:crosshair;width:auto!important;height:auto!important}
#editor button.primary,#editor button.secondary,#editor .edimp{padding:6px 12px;font-size:13px;cursor:pointer}
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
    <div class="edmain"><div class="edpal">${TOOLS.map(([gn,ts])=>`<div class="edgrp"><span>${gn}</span>${ts.map(([id,n,c])=>`<button type="button" class="edt ${id===tool?'on':''}" data-tool="${id}" title="${n}"><i style="background:${c}">${id.startsWith('@')?'':id==='.'?'':id}</i>${n}</button>`).join('')}</div>`).join('')}</div>
      <div class="edwrap"><canvas id="edCv"></canvas></div></div>
    <div class="edbot">
      <label>Подсказка уровня <input id="edHint" value="${(L.hint||'').replace(/"/g,'&quot;')}" placeholder="Что нужно сделать на уровне"></label>
      <button type="button" class="primary" id="edPlay2">▶ Тест вдвоём</button><button type="button" class="secondary" id="edPlayS">▶ Тест Искрой</button><button type="button" class="secondary" id="edPlayB">▶ Тест Болтом</button>
      <button type="button" class="secondary" id="edSave">Сохранить</button>
      <select id="edList"><option value="">Мои уровни (${Object.keys(mine).length})</option>${Object.keys(mine).map(k=>`<option>${k}</option>`).join('')}</select>
      <button type="button" class="secondary" id="edLoad">Открыть</button><button type="button" class="secondary" id="edDel">Удалить</button>
      <button type="button" class="secondary" id="edNew">Новый</button><button type="button" class="secondary" id="edExp">Экспорт файла</button><label class="secondary edimp">Импорт<input id="edImp" type="file" accept=".json,application/json" hidden></label>
      <button type="button" class="secondary" id="edExit">Выход · Esc</button>
      <span class="edhelp">ЛКМ — рисовать, ПКМ — стереть, колесо — прокрутка. Края уровня — стены.</span></div>`;
    cv2=el.querySelector('#edCv'); g2=cv2.getContext('2d');
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
    q('#edExit').onclick=close;
    const wrap=q('.edwrap'); wrap.addEventListener('wheel',e=>{ if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){ wrap.scrollLeft+=e.deltaY; e.preventDefault(); } },{passive:false});
    cv2.oncontextmenu=e=>e.preventDefault();
    cv2.onpointerdown=e=>{ painting=e.button===2?2:1; apply(e); }; cv2.onpointermove=e=>{ if(painting&&!tool.startsWith('@')&&tool!=='E'&&tool!=='1'&&tool!=='2') apply(e); hover=cellAt(e); paint(); };
    addEventListener('pointerup',()=>painting=0);
    requestAnimationFrame(()=>{ fitCell(); paint(); });
  }
  let hover=null;
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
    for(let y=0;y<ROWS;y++) for(let x=0;x<W;x++){ const ch=L.map[y][x]; if(ch==='.') continue; const X=x*c, Y=y*c, col=COLOR[ch]||'#888';
      if(ch==='^'){ g.fillStyle=col; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(X+i*c/3+1,Y+c); g.lineTo(X+i*c/3+c/6,Y+c*.4); g.lineTo(X+(i+1)*c/3-1,Y+c); g.fill(); } continue; }
      if('pqrabc'.includes(ch)){ g.fillStyle=col; g.fillRect(X+3,Y+c-8,c-6,8); continue; }
      if('UVW'.includes(ch)){ g.strokeStyle=col; g.setLineDash([4,3]); g.strokeRect(X+2,Y+c*.35,c-4,c*.3); g.setLineDash([]); continue; }
      if(ch==='['||ch===']'||ch==='g'){ g.strokeStyle=col; g.lineWidth=2; g.strokeRect(X+2,Y+2,c-4,c-4); g.lineWidth=1; g.fillStyle=col; g.globalAlpha=.4; g.fillRect(X+2,Y+2,c-4,c-4); g.globalAlpha=1; continue; }
      g.fillStyle=col; g.fillRect(X+1,Y+1,c-2,c-2); if(!'#'.includes(ch)){ g.fillStyle='#0b1220'; g.fillText(ch==='E'?'':ch,X+c/2,Y+c/2+1); } }
    const dot=(x,y,col,lab)=>{ g.fillStyle=col; g.beginPath(); g.arc(x*c+c/2,y*c+c/2,c*.38,0,Math.PI*2); g.fill(); g.fillStyle='#0b1220'; g.fillText(lab,x*c+c/2,y*c+c/2+1); };
    for(const e of L.enemies) dot(e.tx,e.ty,COLOR['@'+e.t],({crawler:'ж',big:'Ж',flyer:'л',turret:'т',shield:'щ'})[e.t]);
    for(const p of L.pickups) dot(p.tx,p.ty,COLOR['@'+p.t],({gear:'⚙',heart:'♥',pshield:'щ',triple:'3',rapid:'»',power:'!'})[p.t]);
    for(const m of L.movers){ g.strokeStyle='#cfd8e6'; g.lineWidth=3; g.beginPath(); g.moveTo(m.ax*c+c,m.ay*c+c/2); g.lineTo(m.bx*c+c,m.by*c+c/2); g.stroke(); g.lineWidth=1; g.fillStyle='#cfd8e6'; g.fillRect(m.ax*c,m.ay*c+c*.3,c*2,c*.4); g.globalAlpha=.4; g.fillRect(m.bx*c,m.by*c+c*.3,c*2,c*.4); g.globalAlpha=1; }
    if(moverA){ g.strokeStyle='#ffd166'; g.strokeRect(moverA[0]*c,moverA[1]*c,c*2,c); }
    for(const w of L.winds){ g.fillStyle='rgba(207,232,255,.18)'; g.fillRect(w.tx*c,3*c,3*c,14*c); }
    for(const x of L.flags){ g.strokeStyle='#cfd8e6'; g.lineWidth=2; g.beginPath(); g.moveTo(x*c,17*c); g.lineTo(x*c,14*c); g.stroke(); g.fillStyle='#7fe08a'; g.beginPath(); g.moveTo(x*c,14*c); g.lineTo(x*c+c,14.4*c); g.lineTo(x*c,14.9*c); g.fill(); g.lineWidth=1; }
    if(L.trapX!=null){ g.strokeStyle='#ff3b4e'; g.setLineDash([5,5]); g.lineWidth=2; g.beginPath(); g.moveTo(L.trapX*c,c); g.lineTo(L.trapX*c,17*c); g.stroke(); g.setLineDash([]); g.lineWidth=1; }
    if(hover){ g.strokeStyle='#ffd166'; g.lineWidth=2; g.strokeRect(hover[0]*c+1,hover[1]*c+1,c-2,c-2); g.lineWidth=1; }
  }
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
