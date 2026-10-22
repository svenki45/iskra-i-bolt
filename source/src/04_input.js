/* ================= input ================= */
const down=new Set(), pressed=new Set();
const META_KEYS=['Tab','KeyF','BracketLeft','BracketRight','PageUp','PageDown','KeyR','KeyM','Escape','KeyP','Enter','Space'];
const RESERVED=new Set(['Escape','Enter','KeyR','KeyM','KeyP','BracketLeft','BracketRight','PageUp','PageDown','Tab','MetaLeft','MetaRight','F5','F11','F12']);
let capture=null; // {kind, action, type:'kb'|'pad', msg}
const isGameKey=code=>META_KEYS.includes(code)||Object.values(binds).some(b=>Object.values(b.kb).includes(code));
addEventListener('keydown',e=>{
  if(capture&&capture.type==='kb'){
    e.preventDefault(); e.stopPropagation();
    if(e.code==='Escape'){ capture=null; setState('controls'); return; }
    if(RESERVED.has(e.code)){ capture.msg=`Клавиша ${keyLabel(e.code)} занята под меню. Выберите другую.`; setState('controls'); return; }
    assignKey(capture.kind,capture.action,e.code); capture=null; setState('controls'); return;
  }
  if(!e.repeat&&!(e.target&&e.target.tagName==='INPUT')&&e.code){ cheatBuf=(cheatBuf+(/^Key[A-Z]$/.test(e.code)?e.code[3].toLowerCase():'#')).slice(-8); if(cheatBuf.endsWith('bebrik')){ unlockCheatMenu(); if(state==='cheats'){ e.preventDefault(); return; } } }
  if(!overlay.hidden&&state!=='play'&&state!=='dying'){
    const dir={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'}[e.code];
    const t=e.target, isRange=t&&t.type==='range', isNum=t&&t.type==='number';
    if(dir&&!(t&&t.tagName==='INPUT'&&t.type==='text')&&!(isRange&&(dir==='left'||dir==='right')&&e.code.startsWith('Arrow'))&&!(isNum&&(dir==='up'||dir==='down')&&e.code.startsWith('Arrow'))){
      e.preventDefault(); document.body.classList.add('kbnav');
      if(isRange&&(dir==='left'||dir==='right')) adjustInput(t,dir==='left'?-1:1); else navMove(dir);
      return;
    }
    if(e.code==='Enter'&&t&&t.type==='checkbox'){ e.preventDefault(); t.click(); return; }
    if(e.code==='Tab') document.body.classList.add('kbnav');
  }
  const typing=e.target&&e.target.tagName==='INPUT';
  if(typing) return;
  // Enter/Space on a focused button already clicks it: don't also treat it as a game key
  if((e.code==='Enter'||e.code==='NumpadEnter'||e.code==='Space')&&e.target&&e.target.tagName==='BUTTON') return;
  if(isGameKey(e.code)){ const soft=e.code==='Enter'||e.code==='Space'||e.code==='Tab'||e.code==='KeyQ'||e.code==='KeyF'; if(!soft||state==='play'||state==='dying') e.preventDefault(); }
  if(!down.has(e.code)) pressed.add(e.code);
  down.add(e.code); audioInit();
},true);
addEventListener('keyup',e=>down.delete(e.code));
addEventListener('mousemove',()=>document.body.classList.remove('kbnav'));
function focusables(){ return [...overlay.querySelectorAll('button,input,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&el.getClientRects().length); }
function scrollNav(dir,force){
  if(!(force||state==='ach'||state==='help')||(dir!=='up'&&dir!=='down')) return false;
  const els=[...overlay.querySelectorAll('*'),overlay].filter(e=>{ const cs=getComputedStyle(e); return /(auto|scroll)/.test(cs.overflowY)&&e.scrollHeight>e.clientHeight+4; });
  for(const e of els){ const before=e.scrollTop; e.scrollTop+=dir==='down'?110:-110; if(e.scrollTop!==before) return true; }
  return false;
}
function navMove(dir){
  if(scrollNav(dir)) return;
  const list=focusables(); if(!list.length) return;
  const cur=document.activeElement;
  if(!list.includes(cur)){ const f=overlay.querySelector('.primary')||list[0]; f.focus(); return; }
  const r=cur.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  let best=null, bs=1e9;
  for(const el of list){
    if(el===cur) continue;
    const q=el.getBoundingClientRect(), ex=q.left+q.width/2, ey=q.top+q.height/2, dx=ex-cx, dy=ey-cy;
    let main, cross;
    if(dir==='up'){ if(dy>-6) continue; main=-dy; cross=Math.abs(dx); }
    else if(dir==='down'){ if(dy<6) continue; main=dy; cross=Math.abs(dx); }
    else if(dir==='left'){ if(dx>-6||Math.abs(dy)>Math.max(r.height,q.height)) continue; main=-dx; cross=Math.abs(dy); }
    else { if(dx<6||Math.abs(dy)>Math.max(r.height,q.height)) continue; main=dx; cross=Math.abs(dy); }
    const s=main+cross*(dir==='up'||dir==='down'?0.6:3);
    if(s<bs){ bs=s; best=el; }
  }
  if(best){ const q=best.getBoundingClientRect(), far=Math.abs((q.top+q.height/2)-cy)>window.innerHeight*.6;
    if(far&&scrollNav(dir,true)) return; best.focus({preventScroll:true}); best.scrollIntoView({block:'nearest',inline:'nearest'}); sfx('nav'); }
  else scrollNav(dir,true);
}
function adjustInput(el,d){
  if(el.type==='range'){ el.value=Math.max(+el.min||0,Math.min(+el.max||100,(+el.value)+d*5)); el.dispatchEvent(new Event('input',{bubbles:true})); }
  else if(el.type==='number'){ el.value=Math.max(+el.min||1,Math.min(+el.max||100,(+el.value||0)+d)); }
}
const padNav={hold:null,t:0,prevA:true,prevB:true,prevS:true,prevSp:[true,true]};
let pauseOwner=null;
const PNAME=['Искра','Болт'], PKEY=['Esc','P'];
function tryPause(who){ // who: 0/1 player, null = anyone
  if(state==='play'){ pauseOwner=solo?null:who; setState('pause'); return; }
  if(state!=='pause') return;
  if(pauseOwner==null||who===pauseOwner||solo){ pauseOwner=null; setState('play'); return; }
  sfx('off'); const n=document.getElementById('pauseNote'); if(n){ n.textContent='Пауза у игрока «'+PNAME[pauseOwner]+'»: снять её может только '+PNAME[pauseOwner]+' ('+PKEY[pauseOwner]+' или Start на своём геймпаде).'; n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake'); }
}
function pollPadNav(dt){
  const list=pads(); if(!list.length) return;
  let dir=null, A=false, B=false, S=false;
  const navList=(state==='pause'&&pauseOwner!=null&&!solo)?[padFor(pauseOwner)].filter(Boolean):list;
  for(let pi=0;pi<2;pi++){ const g=padFor(pi), st=!!(g&&g.buttons[9]&&g.buttons[9].pressed); if(st&&!padNav.prevSp[pi]) tryPause(solo?null:pi); padNav.prevSp[pi]=st; }
  for(const gp of navList){
    const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed), ax=gp.axes[0]||0, ay=gp.axes[1]||0;
    if(!dir){ if(b(12)||ay<-0.55) dir='up'; else if(b(13)||ay>0.55) dir='down'; else if(b(14)||ax<-0.55) dir='left'; else if(b(15)||ax>0.55) dir='right'; }
    A=A||b(0); B=B||b(1); S=S||b(9);
  }
  const menuOpen=!overlay.hidden&&state!=='play'&&state!=='dying'&&!capture;
  if(menuOpen){
    const el=document.activeElement, inOv=el&&overlay.contains(el);
    const step=d=>{ document.body.classList.add('kbnav'); if(inOv&&(el.type==='range'||el.type==='number')&&(d==='left'||d==='right')) adjustInput(el,d==='left'?-1:1); else navMove(d); };
    if(dir){ if(dir!==padNav.hold){ padNav.hold=dir; padNav.t=0.35; step(dir); } else { padNav.t-=dt; if(padNav.t<=0){ padNav.t=0.11; step(dir); } } }
    else padNav.hold=null;
    if(A&&!padNav.prevA){ if(inOv&&!(el.type==='range'||el.type==='number')) el.click(); else { const p=overlay.querySelector('.primary'); if(p) p.click(); } }
    if(B&&!padNav.prevB) pressed.add('Escape');
  } else padNav.hold=null;
  padNav.prevA=A; padNav.prevB=B; padNav.prevS=S;
}
addEventListener('blur',()=>{down.clear(); if(state==='play'){ pauseOwner=null; setState('pause'); }});
const prevPad=[{},{}];
function pads(){ try{ return [...(navigator.getGamepads?navigator.getGamepads():[])].filter(Boolean).sort((a,b)=>a.index-b.index); }catch(e){ return []; } }
function padFor(pi){ const list=pads(); return list[swapPads?1-pi:pi]||null; }
function padType(gp){
  const id=(gp&&gp.id||'').toLowerCase();
  if(/xbox|xinput|045e/.test(id)) return 'xbox';
  if(/playstation|dualshock|dualsense|054c|wireless controller|ps4|ps5/.test(id)) return 'ps';
  if(/nintendo|switch|pro controller|057e|joy-con/.test(id)) return 'switch';
  return 'generic';
}
function glyphType(pi){
  const st=(typeof settings!=='undefined'&&settings.padStyle)||'auto';
  if(st!=='auto') return st;
  const gp=padFor(pi)||padFor(1-pi); const t=gp?padType(gp):'xbox'; return t==='generic'?'xbox':t;
}
function padDiagram(kind,type,AC){
  const P=PADN[type]||PADN.xbox, b=binds[kind].pad, id='pd'+kind;
  const FACE={xbox:['#5dc35a','#e5484d','#3b8ff0','#f2c230'],ps:['#7fb2ff','#ff6b6b','#ff8fd0','#3fd6a0'],switch:['#f1f4fa','#f1f4fa','#f1f4fa','#f1f4fa']}[type]||['#f1f4fa','#f1f4fa','#f1f4fa','#f1f4fa'];
  const ring=i=>{ for(const a of ['jump','ability','fire','use','next']) if(b[a]===i) return AC[a]; return null; };
  const ps=type==='ps';
  const LS=ps?[122,118]:[90,84], DP=ps?[90,84]:[124,118], RS=[196,118], FC=[232,86];
  const lab=(x,y,t,sz=9,c='#cfd8e6')=>`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${c}" style="font:700 ${sz}px Rubik,'Segoe UI',sans-serif">${t}</text>`;
  // shoulder shapes (left side; right side mirrored)
  const LTp='M70 40C72 22 88 11 106 11C116 11 120 17 118 30L116 38Z', LBp='M52 58C60 41 82 31 112 30C121 30 124 37 119 42C94 43 76 50 64 62C59 66 50 64 52 58Z';
  const sh=(path,i,lx,ly,mirror)=>{ const r=ring(i), tf=mirror?' transform="matrix(-1 0 0 1 320 0)"':'';
    return `<path d="${path}"${tf} fill="url(#${id}s)" stroke="${r||'rgba(156,195,255,.35)'}" stroke-width="${r?3:1.2}"/>${lab(mirror?320-lx:lx,ly,P[i],9)}`; };
  const face=i=>{ const off=[[0,20],[20,0],[-20,0],[0,-20]][i], x=FC[0]+off[0], y=FC[1]+off[1], c=FACE[i], r=ring(i);
    let inner;
    if(ps){ inner=i===0?`<path d="M${x-4} ${y-4}l8 8M${x+4} ${y-4}l-8 8" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`:i===1?`<circle cx="${x}" cy="${y}" r="4.4" fill="none" stroke="${c}" stroke-width="2"/>`:i===2?`<rect x="${x-4.2}" y="${y-4.2}" width="8.4" height="8.4" fill="none" stroke="${c}" stroke-width="2"/>`:`<path d="M${x} ${y-5}l5 8.6H${x-5}z" fill="none" stroke="${c}" stroke-width="1.9" stroke-linejoin="round"/>`; }
    else inner=lab(x,y+0.5,P[i],11,c);
    return `${r?`<circle cx="${x}" cy="${y}" r="13.6" fill="none" stroke="${r}" stroke-width="2.6"/>`:''}<circle cx="${x}" cy="${y+1.5}" r="11" fill="#05080e"/><circle cx="${x}" cy="${y}" r="11" fill="url(#${id}b)" stroke="rgba(255,255,255,.12)"/>${inner}`; };
  const stick=(i,[x,y])=>{ const r=ring(i); return `${r?`<circle cx="${x}" cy="${y}" r="22" fill="none" stroke="${r}" stroke-width="3"/>`:''}<circle cx="${x}" cy="${y}" r="19" fill="#070a10" stroke="rgba(156,195,255,.25)"/><circle cx="${x}" cy="${y+1.5}" r="13" fill="#05080e"/><circle cx="${x}" cy="${y}" r="13" fill="url(#${id}k)"/><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1.5"/>${lab(x,y,P[i],7.5,'#8fa6c8')}`; };
  const small=(i,x,y)=>{ const r=ring(i); return `${r?`<rect x="${x-13}" y="${y-8}" width="26" height="16" rx="8" fill="none" stroke="${r}" stroke-width="2.5"/>`:''}<rect x="${x-9}" y="${y-4.5}" width="18" height="9" rx="4.5" fill="#070a10" stroke="rgba(156,195,255,.3)"/>${lab(x,y+14,P[i],7,'#8fa6c8')}`; };
  const dpad=([x,y])=>`<circle cx="${x}" cy="${y}" r="21" fill="#0d121c"/><path d="M${x-6} ${y-17}h12v11h11v12h-11v11h-12v-11h-11v-12h11z" fill="url(#${id}k)" stroke="rgba(255,255,255,.1)"/>${lab(x,y+31,'ходить',7.5,'#8fa6c8')}`;
  const center=ps?`<rect x="128" y="46" width="64" height="32" rx="7" fill="#121826" stroke="rgba(156,195,255,.25)"/>${lab(160,62,'touchpad',7,'#5f7393')}`
    :`<circle cx="160" cy="58" r="10" fill="#0d121c" stroke="rgba(156,195,255,.3)"/><circle cx="160" cy="58" r="5" fill="none" stroke="${type==='xbox'?'#5dc35a':'#cfd8e6'}" stroke-width="2"/>`;
  const legend=['jump','ability','fire','use','next'].map(a=>`<span><i class="dot" style="background:${AC[a]}"></i>${a==='jump'?'Прыжок':a==='fire'?'Огонь':a==='use'?'Бонус':a==='next'?'След. бонус':(kind==='spark'?'Рывок':'Подброс / удар')}</span>`).join('');
  return `<div class="paddiag"><svg viewBox="0 0 320 186" role="img" aria-label="Схема геймпада">
    <defs>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#323d55"/><stop offset=".55" stop-color="#1d2536"/><stop offset="1" stop-color="#141a27"/></linearGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a465f"/><stop offset="1" stop-color="#1b2232"/></linearGradient>
      <radialGradient id="${id}b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#2c3548"/><stop offset="1" stop-color="#121826"/></radialGradient>
      <radialGradient id="${id}k" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#3a4560"/><stop offset="1" stop-color="#171d2b"/></radialGradient>
    </defs>
    ${sh(LTp,6,96,24,false)}${sh(LTp,7,96,24,true)}
    ${sh(LBp,4,88,45,false)}${sh(LBp,5,88,45,true)}
    <path d="M104 46C132 40 188 40 216 46C246 51 266 61 280 86C291 106 301 134 297 152C293 170 266 175 250 162C238 152 229 138 213 132C190 124 130 124 107 132C91 138 82 152 70 162C54 175 27 170 23 152C19 134 29 106 40 86C54 61 74 51 104 46Z" fill="url(#${id}g)" stroke="rgba(156,195,255,.45)" stroke-width="1.6"/>
    <path d="M108 52C134 47 186 47 212 52" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2" stroke-linecap="round"/>
    <circle cx="${FC[0]}" cy="${FC[1]}" r="37" fill="rgba(5,8,14,.45)"/>
    ${center}${small(8,138,84)}${small(9,182,84)}
    ${dpad(DP)}${stick(10,LS)}${stick(11,RS)}
    ${[0,1,2,3].map(face).join('')}
  </svg><div class="plegend">${legend}</div></div>`;
}
const PAD_TYPE_NAME={xbox:'Xbox',ps:'PlayStation',switch:'Nintendo Switch',generic:'(обычный)'};
const PADN={xbox:['A','B','X','Y','LB','RB','LT','RT','View','Menu','LS','RS','↑','↓','←','→','Home'],
  ps:['✕','○','□','△','L1','R1','L2','R2','Share','Options','L3','R3','↑','↓','←','→','PS'],
  switch:['B','A','Y','X','L','R','ZL','ZR','−','+','LS','RS','↑','↓','←','→','Home'],
  generic:['1','2','3','4','5','6','7','8','9','10','11','12','↑','↓','←','→','13']};
function padGlyph(type,i){
  type=PADN[type]?type:'generic';
  const label=PADN[type][i]??String(i+1);
  const F="font-family:Rubik,'Segoe UI',system-ui,sans-serif;font-weight:700";
  if(i<4){
    const XB=['#5dc35a','#e5484d','#3b8ff0','#f2c230'], PSC=['#7fb2ff','#ff6b6b','#ff8fd0','#3fd6a0'];
    let inner='';
    if(type==='ps'){
      const c=PSC[i];
      if(i===0) inner=`<path d="M7.5 7.5l9 9M16.5 7.5l-9 9" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`;
      else if(i===1) inner=`<circle cx="12" cy="12" r="5" fill="none" stroke="${c}" stroke-width="2.2"/>`;
      else if(i===2) inner=`<rect x="7.3" y="7.3" width="9.4" height="9.4" rx="1" fill="none" stroke="${c}" stroke-width="2.2"/>`;
      else inner=`<path d="M12 6.6l5.6 9.6H6.4z" fill="none" stroke="${c}" stroke-width="2.1" stroke-linejoin="round"/>`;
    } else {
      const c=type==='xbox'?XB[i]:'#f1f4fa';
      inner=`<text x="12" y="12.6" text-anchor="middle" dominant-baseline="middle" fill="${c}" style="${F};font-size:12px">${label}</text>`;
    }
    return `<svg class="padsvg" width="22" height="22" viewBox="0 0 24 24" role="img" aria-label="${label}"><circle cx="12" cy="12" r="11" fill="#1b2232" stroke="rgba(156,195,255,.45)" stroke-width="1"/>${inner}</svg>`;
  }
  const w=Math.max(28,10+label.length*7.5);
  return `<svg class="padsvg" width="${w}" height="20" viewBox="0 0 ${w} 20" role="img" aria-label="${label}"><rect x=".5" y=".5" width="${w-1}" height="19" rx="${i<8?9.5:5}" fill="#1b2232" stroke="rgba(156,195,255,.45)"/><text x="${w/2}" y="10.6" text-anchor="middle" dominant-baseline="middle" fill="#f1f4fa" style="${F};font-size:10.5px">${label}</text></svg>`;
}
const KEY_NAMES={Escape:'Esc',Enter:'Enter',ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',Slash:'/',Period:'.',Comma:',',Semicolon:';',Quote:"'",Backquote:'`',Minus:'-',Equal:'=',Backslash:'\\',Space:'Пробел',ShiftLeft:'Л.Shift',ShiftRight:'П.Shift',ControlLeft:'Л.Ctrl',ControlRight:'П.Ctrl',AltLeft:'Л.Alt',AltRight:'П.Alt',Backspace:'Backspace',CapsLock:'Caps',Insert:'Ins',Delete:'Del',Home:'Home',End:'End',NumpadEnter:'Num Enter',NumpadAdd:'Num +',NumpadSubtract:'Num −',NumpadMultiply:'Num *',NumpadDivide:'Num /',NumpadDecimal:'Num .'};
function keyLabel(code){
  if(!code) return '—';
  if(KEY_NAMES[code]) return KEY_NAMES[code];
  let m=code.match(/^Key([A-Z])$/); if(m) return m[1];
  m=code.match(/^Digit(\d)$/); if(m) return m[1];
  m=code.match(/^Numpad(\d)$/); if(m) return 'Num'+m[1];
  return code;
}
const kbd=code=>`<kbd>${keyLabel(code)}</kbd>`;
let lastSolo=null, solo=false, soloHero='spark', active=0, follow=false, soloPrev={sw:true,fl:true};
try{ const m=localStorage.getItem('iskra-bolt-mode'); solo=m==='spark'||m==='bolt'; if(solo) soloHero=m; }catch(e){}
const modeSuffix=()=>solo?'-'+soloHero:'';
function setMode(one,hero){ const prevMode=solo?soloHero:'2'; solo=!!one; if(hero) soloHero=hero; if(typeof activeSlot!=='undefined'&&activeSlot>=0&&slots[activeSlot]&&slots[activeSlot].mode!==(solo?soloHero:'2')){ activeSlot=-1; store.set('iskra-bolt-slot',-1); } try{ localStorage.setItem('iskra-bolt-mode',solo?soloHero:'2'); }catch(e){} legendSig=''; loadModeProgress(); }
function loadModeProgress(){
  try{ best=parseInt(localStorage.getItem('iskra-bolt-sheet'+modeSuffix())||'0',10)||0; }catch(e){ best=0; }
  run=Object.assign({score:0,wallet:0,up:{},offer:[],refresh:0,reward:null},store.get('iskra-bolt-run'+modeSuffix(),{}));
  const se=document.getElementById('score'); if(se) se.textContent=run.score.toLocaleString('ru-RU');
}
function soloInput(){
  // both keyboard layouts + any gamepad drive the active hero
  const out={dir:0,jump:false,jp:false,ab:false,ap:false,fire:false,use:false,nx:false};
  for(const kind of ['spark','bolt']){ const k=binds[kind].kb; out.use=out.use||pressed.has(k.use); out.nx=out.nx||pressed.has(k.next);
    if(down.has(k.left)) out.dir-=1; if(down.has(k.right)) out.dir+=1;
    out.jump=out.jump||down.has(k.jump); out.jp=out.jp||pressed.has(k.jump); out.ab=out.ab||down.has(k.ability); out.ap=out.ap||pressed.has(k.ability); out.fire=out.fire||down.has(k.fire); }
  const gp=padFor(0)||padFor(1);
  if(gp){ const pb=binds.spark.pad, b=i=>!!(gp.buttons[i]&&(gp.buttons[i].pressed||gp.buttons[i].value>0.5)), ax=gp.axes[0]||0, pv=prevPad[0];
    if(ax<-0.35||b(14)) out.dir-=1; if(ax>0.35||b(15)) out.dir+=1;
    const gj=b(pb.jump), ga=b(pb.ability); out.jump=out.jump||gj; out.ab=out.ab||ga; out.fire=out.fire||b(pb.fire); out.jp=out.jp||(gj&&!pv.j); out.ap=out.ap||(ga&&!pv.a); prevPad[0]={j:gj,a:ga};
    const gu=b(pb.use), gn=b(pb.next); if(gu&&!soloPrev.u) out.use=true; if(gn&&!soloPrev.n) out.nx=true; soloPrev={u:gu,n:gn}; }
  out.dir=Math.max(-1,Math.min(1,out.dir));
  if(pressed.has('KeyF')) out.follow=true;
  return out;
}
function aiInput(p,leader){
  const inp={dir:0,jump:false,jp:false,ab:false,ap:false,fire:false};
  if(p.down||p.dead) return inp;
  const cx=p.x+p.w/2, cy=p.y+p.h/2;
  if(follow&&!leader.down){
    const dx=(leader.x+leader.w/2)-cx;
    if(Math.abs(dx)>64) inp.dir=Math.sign(dx);
    if(inp.dir){
      const fx=cx+inp.dir*(p.w/2+14), footRow=Math.floor((p.y+p.h-2)/T), col=Math.floor(fx/T);
      const here=grid[footRow]&&grid[footRow][col], below=grid[footRow+1]&&grid[footRow+1][col];
      const danger=here==='^'||here==='L'||below==='^'||below==='L';
      const wall=tileHit(p.x+inp.dir*10,p.y,p.w,p.h-6);
      const cliff=p.wasGround&&!solidPx(fx,p.y+p.h+6)&&!solidPx(fx,p.y+p.h+T*2.5)&&leader.y+leader.h<=p.y+p.h+4;
      if(danger&&p.wasGround){ if(leader.y+leader.h<p.y+p.h-4||Math.abs(dx)>120){ inp.jp=inp.jump=true; } else inp.dir=0; }
      else if(wall&&p.wasGround){ inp.jp=inp.jump=true; }
      else if(cliff){ inp.jp=inp.jump=true; }
      if(p.wasGround&&leader.wasGround&&leader.y+leader.h<p.y+p.h-30&&Math.abs(dx)<150){ inp.jp=inp.jump=true; }
      if(!p.wasGround&&p.vy<0) inp.jump=true;
    }
  }
  // helper fire: shoot at the nearest enemy or boss roughly in line
  let tg=null, td=640;
  for(const en of enemies){ if(en.hp<=0) continue; const dy=Math.abs(en.y+en.h/2-cy), d=Math.abs(en.x+en.w/2-cx); if(dy<70&&d<td){ td=d; tg=en; } }
  if(boss&&!boss.dead&&!intro){ const dy=Math.abs(boss.y+boss.h/2-cy), d=Math.abs(boss.x+boss.w/2-cx); if(dy<160&&d<900) tg=tg||boss; }
  if(tg){ if(!inp.dir) p.face=Math.sign(tg.x+tg.w/2-cx)||p.face; inp.fire=true; }
  return inp;
}
function readInput(pi){
  if(demo&&players) return pi===0?demoLead(players[0]):aiInput(players[1],players[0]);
  if(NET.role==='host'&&pi===1){ const r=NET.rin, out=Object.assign({},r); r.jp=false; r.ap=false; r.use=false; r.nx=false; return out; }
  if(solo){ if(players&&players[pi]&&players[pi].absent) return {dir:0,jump:false,jp:false,ab:false,ap:false,fire:false}; return soloInput(); }
  const kind=pi===0?'spark':'bolt', k=binds[kind].kb, pb=binds[kind].pad;
  let left=down.has(k.left), right=down.has(k.right), jump=down.has(k.jump), ab=down.has(k.ability), fire=down.has(k.fire), jp=pressed.has(k.jump), ap=pressed.has(k.ability), use=pressed.has(k.use), nx=pressed.has(k.next);
  const gp=padFor(pi);
  if(gp){
    const b=i=>!!(gp.buttons[i]&&(gp.buttons[i].pressed||gp.buttons[i].value>0.5)), ax=gp.axes[0]||0;
    const gl=ax<-0.35||b(14), gr=ax>0.35||b(15), gj=b(pb.jump), ga=b(pb.ability), gf=b(pb.fire), pv=prevPad[pi];
    const gu=b(pb.use), gn=b(pb.next);
    left=left||gl; right=right||gr; jump=jump||gj; ab=ab||ga; fire=fire||gf; jp=jp||(gj&&!pv.j); ap=ap||(ga&&!pv.a); use=use||(gu&&!pv.u); nx=nx||(gn&&!pv.n);
    prevPad[pi]={j:gj,a:ga,u:gu,n:gn};
  }
  return {dir:(right?1:0)-(left?1:0), jump, jp, ab, ap, fire, use, nx};
}

