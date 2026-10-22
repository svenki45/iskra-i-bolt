/* ===== i18n: runtime translation layer (ru source → uk/en) ===== */
const I18N=/*I18N*/;
const LANG=(()=>{ try{ return localStorage.getItem('iskra-bolt-lang')||'ru'; }catch(e){ return 'ru'; } })();
const LI=LANG==='uk'?0:LANG==='en'?1:-1;
const I18_SEP=/( · |: |\. |! |\? |\n|, | — | – |…|  +)/;
const I18_EDGE=/^([\s.,:;!?·—()«»"'\/]*)([\s\S]*?)([\s.,:;!?·—()«»"'\/]*)$/;
const trCache=new Map();
const capF=x=>x.charAt(0).toUpperCase()+x.slice(1);
function trLook(key){
  let v=I18N[key]; if(v) return v[LI];
  const up=key===key.toUpperCase()&&key!==key.toLowerCase(), lo=key.toLowerCase();
  if(up){ v=I18N[capF(lo)]||I18N[lo]||I18N[lo.replace(/(^|[\s-])(\S)/g,(q,b,c)=>b+c.toUpperCase())]; if(v) return v[LI].toUpperCase(); }
  const f=key.charAt(0);
  if(f!==f.toUpperCase()){ v=I18N[capF(key)]; if(v){ const t=v[LI]; return t.charAt(0).toLowerCase()+t.slice(1); } }
  else { v=I18N[f.toLowerCase()+key.slice(1)]; if(v) return capF(v[LI]); }
  return null;
}
function trPart(part){
  const m=part.match(I18_EDGE); if(!m||!/[А-Яа-яЁёІіЇїЄє]/.test(m[2])) return null;
  const core=m[2], nums=core.match(/\d+/g)||[], key=core.replace(/\d+/g,'#');
  let t=trLook(key), extra='';
  if(t==null&&/ #$/.test(key)){ t=trLook(key.slice(0,-2)); if(t!=null){ extra=' '+nums[nums.length-1]; nums.pop(); } }
  if(t==null&&/^# /.test(key)){ t=trLook(key.slice(2)); if(t!=null) t='#'+' '+t; }
  if(t==null&&core.includes(' «')&&!I18_SEP.test(core.slice(0,core.indexOf(' «')))){ const i=core.indexOf(' «'), A=core.slice(0,i), B=core.slice(i+2); const ta=trPart(A), tb=trPart(B); if(ta!=null||tb!=null) return m[1]+(ta??A)+(LI===1?' “':' «')+(tb??B)+m[3].replace('»',LI===1?'”':'»'); }
  if(t==null){ const pm=core.match(/^(.*?)(\s*\([^()]*\)?)$/); if(pm&&pm[1]&&pm[1]!==core){ const a=trPart(pm[1]); if(a!=null) return m[1]+a+pm[2]+m[3]; } return null; }
  let k=0; t=t.replace(/#/g,()=>nums[k]!=null?nums[k++]:'#');
  return m[1]+t+extra+m[3];
}
function tr(text){
  if(LI<0||typeof text!=='string'||!/[А-Яа-яЁё]/.test(text)) return text;
  let r=trCache.get(text); if(r!=null) return r;
  r=trPart(text);
  if(r==null) r=text.split(I18_SEP).map((p,i)=>i%2?p:(trPart(p)??p)).join('');
  if(trCache.size>6000) trCache.clear(); trCache.set(text,r); return r;
}
if(LI>=0){
  for(const fn of ['fillText','strokeText','measureText']){ const o=CanvasRenderingContext2D.prototype[fn]; CanvasRenderingContext2D.prototype[fn]=function(t,...a){ return o.call(this,typeof t==='string'?tr(t):t,...a); }; }
  const done=new WeakMap();
  const trNode=n=>{ if(n.nodeType===3){ const p=n.parentNode; if(!p||p.nodeName==='SCRIPT'||p.nodeName==='STYLE'||(p.closest&&p.closest('.notr'))) return; if(done.get(n)===n.data) return; const o=tr(n.data); if(o!==n.data) n.data=o; done.set(n,n.data); }
    else if(n.nodeType===1){ if(n.nodeName==='SCRIPT'||n.nodeName==='STYLE') return; for(const at of ['title','placeholder','aria-label']){ const v=n.getAttribute&&n.getAttribute(at); if(v&&/[А-Яа-яЁё]/.test(v)){ const o=tr(v); if(o!==v) n.setAttribute(at,o); } }
      if((n.nodeName==='INPUT'||n.nodeName==='BUTTON')&&n.value&&/[А-Яа-яЁё]/.test(n.value)&&n.type!=='text') n.value=tr(n.value);
      for(const c of n.childNodes) trNode(c); } };
  const mo=new MutationObserver(ms=>{ for(const m of ms){ if(m.type==='characterData') trNode(m.target); else if(m.type==='attributes'){ const n=m.target, at=m.attributeName, v=n.getAttribute(at); if(v&&/[А-Яа-яЁё]/.test(v)){ const o=tr(v); if(o!==v) n.setAttribute(at,o); } } else for(const a of m.addedNodes) trNode(a); } });
  const go=()=>{ trNode(document.documentElement); mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label']}); document.title=tr(document.title); };
  if(document.body) go(); else addEventListener('DOMContentLoaded',go);
  document.documentElement.lang=LANG;
}
function setLang(l){ try{ localStorage.setItem('iskra-bolt-lang',l); sessionStorage.setItem('ib-nosplash','1'); }catch(e){} location.reload(); }

TUTORIAL[0].hint += ' Кнопки стрельбы и всего остального показаны внизу.';
const TOTAL=100;
const T=40, ROWS=18, VW=32*T, VH=ROWS*T, G=2200, FLOOR_Y=17*T;
let COLS=32, WW=VW;  // COLS/WW = width of the current level (long levels are wider than one screen)
const KEYC=new Proxy({P:'#e7b54a',Q:'#c79bff',R:'#7fe08a'},{get:(o,k)=>o[k]||o[String(k)[0]]});
const BRIDGE={U:'P',V:'Q',W:'R'};
const cv=document.getElementById('cv'); let ctx=cv.getContext('2d'); const mainCtx=ctx;
const $=id=>document.getElementById(id);
const overlay=$('overlay');
let scale=1;

