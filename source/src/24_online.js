/* ================= online co-op (PeerJS, host-authoritative) ================= */
const NET={role:null,peer:null,conn:null,code:'',status:'',rin:{dir:0,jump:false,jp:false,ab:false,ap:false,fire:false,use:false,nx:false},acc:{},snapT:0,lastG:'',hostState:'',ping:0};
// --- online via public MQTT brokers (works through any router/mobile network, no direct connection needed) ---
const NET_VER=3, MQTT_BROKERS=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt','wss://test.mosquitto.org:8081/mqtt'];
const te=new TextEncoder(), td=new TextDecoder();
function mqttStr(s){ const b=te.encode(s); return [b.length>>8,b.length&255,...b]; }
function mqttLen(n){ const o=[]; do{ let d=n%128; n=Math.floor(n/128); if(n>0) d|=128; o.push(d); }while(n>0); return o; }
function mqttPkt(h,body){ return new Uint8Array([h,...mqttLen(body.length),...body]); }
function mqttClient(onMsg,onUp,onErr){
  let bi=0, ws=null, ping=null, buf=new Uint8Array(0), up=false, dead=false;
  const tryNext=()=>{ if(dead) return; if(bi>=MQTT_BROKERS.length){ onErr('Нет связи с онлайн-сервером. Проверьте интернет.'); return; }
    const url=MQTT_BROKERS[bi++]; NET.status='Подключаемся к онлайн-серверу'+(bi>1?' (запасной '+bi+')':'')+'…'; if(state==='net') setState('net');
    try{ ws=new WebSocket(url,'mqtt'); }catch(e){ return tryNext(); } ws.binaryType='arraybuffer';
    const to=setTimeout(()=>{ if(!up){ try{ ws.close(); }catch(e){} } },6000);
    ws.onopen=()=>{ const id='ib'+Math.random().toString(36).slice(2,12); ws.send(mqttPkt(0x10,[...mqttStr('MQTT'),4,2,0,60,...mqttStr(id)])); };
    ws.onmessage=e=>{ const a=new Uint8Array(e.data), n=new Uint8Array(buf.length+a.length); n.set(buf); n.set(a,buf.length); buf=n;
      while(buf.length>=2){ let m=1,len=0,i=1,b; do{ b=buf[i++]; len+=(b&127)*m; m*=128; }while(b&128&&i<buf.length); if(buf.length<i+len) break;
        const t=buf[0]>>4, p=buf.slice(i,i+len); buf=buf.slice(i+len);
        if(t===2){ clearTimeout(to); if(p[1]===0){ up=true; ping=setInterval(()=>{ try{ ws.send(new Uint8Array([0xC0,0])); }catch(_){} },25000); onUp(); } else { try{ ws.close(); }catch(_){} } }
        else if(t===3){ const tl=(p[0]<<8)|p[1], topic=td.decode(p.slice(2,2+tl)); let pl=p.slice(2+tl); if(buf.length===0&&false) pl=pl; try{ onMsg(topic,JSON.parse(td.decode(pl))); }catch(_){} } } };
    ws.onclose=()=>{ clearInterval(ping); if(dead) return; if(!up) tryNext(); else { up=false; onErr('Связь с онлайн-сервером прервалась.'); } };
    ws.onerror=()=>{};
  };
  tryNext();
  let pid=1;
  return { sub:t=>{ try{ ws.send(mqttPkt(0x82,[0,(pid++)&255||1,...mqttStr(t),0])); }catch(e){} },
    pub:(t,o)=>{ try{ if(ws&&ws.readyState===1) ws.send(mqttPkt(0x30,[...mqttStr(t),...te.encode(JSON.stringify(o))])); }catch(e){} },
    close:()=>{ dead=true; clearInterval(ping); try{ ws.send(new Uint8Array([0xE0,0])); ws.close(); }catch(e){} } };
}
// --- direct P2P upgrade (lowest lag); MQTT stays as signalling + fallback ---
const ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}];
function rtcGathered(pc){ return new Promise(res=>{ if(pc.iceGatheringState==='complete') return res(); const t=setTimeout(res,2500); pc.addEventListener('icegatheringstatechange',()=>{ if(pc.iceGatheringState==='complete'){ clearTimeout(t); res(); } }); }); }
function rtcWire(ch){ NET.dcs=NET.dcs||{}; ch.onopen=()=>{ NET.dcs[ch.label]=ch; if(ch.label!=='g') return; NET.dc=ch; NET.direct=true; toastQ.push({small:'Онлайн',title:'⚡ Прямое соединение — без задержек',icon:'first'}); showToast(); };
  ch.onmessage=e=>{ let d; try{ d=JSON.parse(e.data); }catch(_){ return; } NET.onMsg&&NET.onMsg(null,d); };
  ch.onclose=()=>{ if(NET.dcs) delete NET.dcs[ch.label]; if(NET.dc===ch){ NET.dc=null; NET.direct=false; } }; }
async function rtcStart(isHost,pub){
  if(typeof RTCPeerConnection==='undefined') return;
  try{ const pc=new RTCPeerConnection({iceServers:ICE}); NET.pc=pc;
    if(isHost){ rtcWire(pc.createDataChannel('g',{ordered:false,maxRetransmits:0})); rtcWire(pc.createDataChannel('r',{ordered:true})); await pc.setLocalDescription(await pc.createOffer()); await rtcGathered(pc); pub({t:'rtc',sdp:pc.localDescription}); }
  }catch(e){}
}
async function rtcOnSig(d){
  try{ if(d.sdp.type==='offer'){ if(typeof RTCPeerConnection==='undefined') return; const pc=new RTCPeerConnection({iceServers:ICE}); NET.pc=pc; pc.ondatachannel=e=>rtcWire(e.channel);
      await pc.setRemoteDescription(d.sdp); await pc.setLocalDescription(await pc.createAnswer()); await rtcGathered(pc); NET.rtcPub&&NET.rtcPub({t:'rtc',sdp:pc.localDescription}); }
    else if(d.sdp.type==='answer'&&NET.pc) await NET.pc.setRemoteDescription(d.sdp); }catch(e){} }
function rtcSend(o){ const c=NET.dcs&&NET.dcs[o.t==='s'?'g':'r']; if(c&&c.readyState==='open'){ try{ const s=JSON.stringify(o); if(s.length<60000){ c.send(s); return true; } }catch(e){} } return false; }
function rtcClose(){ try{ for(const k in NET.dcs||{}) NET.dcs[k].close(); }catch(e){} NET.dcs={}; try{ NET.pc&&NET.pc.close(); }catch(e){} NET.dc=null; NET.pc=null; NET.direct=false; }
function netFail(msg){ NET.status='⚠ '+msg; try{ NET.mq&&NET.mq.close(); }catch(e){} NET.mq=null; NET.conn=null; NET.role=null; NET.waiting=false; clearInterval(NET.hello); clearInterval(NET.watch); if(['net','netwait','play','dying'].includes(state)) setState('net'); }
function netCode(){ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c=''; for(let i=0;i<5;i++) c+=A[Math.floor(Math.random()*A.length)]; return c; }
function netWatch(){ NET.lastRx=performance.now(); clearInterval(NET.watch); NET.watch=setInterval(()=>{ if(NET.role&&performance.now()-NET.lastRx>9000) netLost(NET.role==='host'?'Друг пропал из сети':'Хост пропал из сети'); },1000); }
function netHost(){
  NET.code=netCode(); const T='iskrabolt/'+NET.code; setState('net');
  const onH=(topic,d)=>{
      if(d.t==='rtc'){ rtcOnSig(d); return; }
      if(d.v!==NET_VER){ if(d.t==='hello') NET.mq.pub(T+'/h',{t:'oldver',v:NET_VER}); return; }
      if(d.t==='hello'&&!NET.role){ NET.mq.pub(T+'/h',{t:'welcome',v:NET_VER}); NET.role='host'; NET.waiting=false; NET.lastG='';
        NET.conn={open:true,send:o=>{ o.v=NET_VER; if(!rtcSend(o)) NET.mq.pub(T+'/h',o); },close:()=>{ rtcClose(); }}; netWatch(); NET.onMsg=onH; rtcStart(true,o=>NET.mq.pub(T+'/h',o));
        sfx('pick'); setMode(false); toastQ.push({small:'Онлайн',title:'Друг подключился — он играет за Болта',icon:'first'}); showToast(); startGame(Math.min(TOTAL-1,best)); }
      else if(d.t==='cmd'&&NET.role==='host'){ NET.lastRx=performance.now(); if(d.c==='pause'&&state==='play'){ pauseOwner=1; setState('pause'); } else if(d.c==='resume'&&state==='pause'&&pauseOwner===1){ pauseOwner=null; setState('play'); } }
      else if(d.t==='in'&&NET.role==='host'){ NET.lastRx=performance.now(); if(d.p&&d.lv===levelIdx) NET.rpos=d.p; const r=NET.rin, i=d.i; r.dir=i.dir; r.jump=i.jump; r.ab=i.ab; r.fire=i.fire; r.jp=r.jp||i.jp; r.ap=r.ap||i.ap; r.use=r.use||i.use; r.nx=r.nx||i.nx; }
      else if(d.t==='bye'&&NET.role==='host') netLost('Друг вышел из игры'); };
  NET.mq=mqttClient(onH,
    ()=>{ NET.mq.sub(T+'/g'); NET.waiting=true; NET.status='Комната создана. Скажите другу код и ждите подключения.'; if(state==='net') setState('net'); },
    e=>NET.role?netLost(e):netFail(e));
}
function netJoin(code){
  code=(code||'').trim().toUpperCase(); if(code.length<4){ NET.status='Введите код комнаты из 5 символов.'; setState('net'); return; }
  const T='iskrabolt/'+code; setState('net');
  const onG=(topic,d)=>{
      if(d.t==='rtc'){ rtcOnSig(d); return; }
      if(d.t==='oldver') return netFail('У друга другая версия игры. Обновите игру на обоих устройствах.');
      if(d.v!==NET_VER) return;
      if(d.t==='welcome'&&!NET.role){ clearInterval(NET.hello); NET.role='guest'; NET.code=code; NET.hostState='';
        NET.conn={open:true,send:o=>{ o.v=NET_VER; if(!rtcSend(o)) NET.mq.pub(T+'/g',o); },close:()=>{ NET.mq.pub(T+'/g',{t:'bye',v:NET_VER}); rtcClose(); }}; netWatch(); NET.onMsg=onG; NET.rtcPub=o=>NET.mq.pub(T+'/g',o); setMode(false); sfx('pick'); setState('netwait'); }
      else if(d.t==='s'&&NET.role==='guest'){ NET.lastRx=performance.now(); netApply(d); } };
  NET.mq=mqttClient(onG,
    ()=>{ NET.mq.sub(T+'/h'); NET.status='Ищем комнату '+code+'…'; if(state==='net') setState('net');
      let tries=0; clearInterval(NET.hello); NET.hello=setInterval(()=>{ if(NET.role){ clearInterval(NET.hello); return; } if(++tries>14){ clearInterval(NET.hello); netFail('Комната '+code+' не отвечает. Проверьте код: комната должна быть создана и открыта на втором устройстве.'); return; } NET.mq.pub(T+'/g',{t:'hello',v:NET_VER}); },800); },
    e=>NET.role?netLost(e):netFail(e));
}
function netLost(msg){ const was=NET.role; try{ NET.conn&&NET.conn.close(); }catch(e){} try{ NET.mq&&NET.mq.close(); }catch(e){} NET.conn=null; NET.mq=null; NET.role=null; NET.waiting=false; clearInterval(NET.watch); clearInterval(NET.hello);
  toastQ.push({small:'Онлайн',title:msg,icon:'first'}); showToast();
  if(was==='guest'){ NET.status=msg; setState('net'); } else if(was==='host'&&state==='play'){ pauseOwner=null; setState('pause'); } }
function guestPause(){ try{ NET.conn&&NET.conn.send({t:'cmd',c:'pause'}); }catch(e){} setState('netleave'); }
function guestResume(){ try{ NET.conn&&NET.conn.send({t:'cmd',c:'resume'}); }catch(e){} setState(NET.hostState==='play'||NET.hostState==='pause'?'play':'netwait'); }
function netLeave(){ netLost('Вы вышли из онлайн-игры'); setState('menu'); }
// host → guest snapshot
const NO_SET=(k,v)=>v instanceof Set?undefined:(k==='hit'?undefined:v);
function netSend(dt){
  if(NET.role!=='host'||!NET.conn||!NET.conn.open) return;
  NET.snapT-=dt; if(NET.snapT>0) return; NET.snapT=NET.direct?1/30:1/20;
  try{ NET.conn.send(netSnap()); }catch(e){}
}
function netSnap(){
  const gs=grid?grid.map(r=>r.join('')).join('|'):''; const gch=gs!==NET.lastG; NET.lastG=gs;
  const d={t:'s',LA:lamps.map(l=>l.lit),st:state,lv:levelIdx,g:gch?gs:null,P:players,E:enemies,B:bullets,EB:ebullets,PK:pickups,BO:boss,C:crates,M:movers&&movers.map(m=>[m.x,m.y,m.timer]),
    D:doors&&Object.fromEntries(Object.entries(doors).map(([k,v])=>[k,[v.vis,v.solid,v.timer||0]])),PL:plates&&plates.map(p=>p.on),IN:intro,OU:outro,SC:run.score,SF:[secretsFound,secretsTotal],XL:exitLocked,TX:texts.filter(t=>t.big||t.pop).slice(-4)};
  return JSON.parse(JSON.stringify(d,NO_SET));
}
// guest: apply snapshot
function netApply(d){
  NET.hostState=d.st;
  if(d.lv!==levelIdx||!grid){ loadLevel(d.lv); }
  if(d.g){ grid=d.g.split('|').map(r=>r.split('')); gridVer++; staticDirty=true; }
  const keep=(arr,old)=>{ (arr||[]).forEach((e,i)=>{ const o=old&&old[i]; e.tx=e.x; e.ty=e.y; if(o&&o.type===e.type&&o.kind===e.kind&&Math.hypot(o.x-e.x,o.y-e.y)<160){ e.x=o.x; e.y=o.y; } }); return arr||[]; };
  const myOld=NET.me;
  players=keep(d.P,players); enemies=keep(d.E,enemies); crates=keep(d.C,crates);
  if(players[1]){ const S=players[1];
    if(myOld&&myOld.lv===d.lv&&!S.down&&!S.dead&&Math.hypot(S.tx-myOld.x,S.ty-myOld.y)<220){
      for(const k of ['hp','shield','pw','bag','sel','down','dead','inv','secondWind','reviveT','bleed','pwPop','bagPop','absent']) myOld[k]=S[k];
      players[1]=myOld; }
    else { S.x=S.tx; S.y=S.ty; S.lv=d.lv; NET.me=S; } }
  if(d.BO){ const o=boss; d.BO.tx=d.BO.x; d.BO.ty=d.BO.y; if(o&&o.type===d.BO.type&&Math.hypot(o.x-d.BO.x,o.y-d.BO.y)<200){ d.BO.x=o.x; d.BO.y=o.y; } }
  bullets=(d.B||[]).map(b=>Object.assign(b,{hit:new Set()})); ebullets=d.EB||[]; pickups=d.PK||[]; boss=d.BO;
  if(d.M&&movers) d.M.forEach((m,i)=>{ if(movers[i]){ movers[i].tx=m[0]; movers[i].ty=m[1]; movers[i].timer=m[2]; } });
  if(d.D&&doors) for(const k in d.D){ if(doors[k]){ doors[k].vis=d.D[k][0]; doors[k].solid=d.D[k][1]; doors[k].timer=d.D[k][2]; } }
  if(d.PL&&plates) d.PL.forEach((on,i)=>{ if(plates[i]) plates[i].on=on; });
  if(d.LA) d.LA.forEach((v,i)=>{ if(lamps[i]) lamps[i].lit=v; });
  intro=d.IN; outro=d.OU; exitLocked=d.XL; secretsFound=d.SF[0]; secretsTotal=d.SF[1];
  const se=document.getElementById('score'); if(se) se.textContent=(d.SC||0).toLocaleString('ru-RU');
  if(d.TX) for(const t of d.TX){ if(!texts.some(x=>x.t===t.t&&Math.abs(x.life-t.life)<.5)) texts.push(t); }
  const live=d.st==='play'||d.st==='dying';
  if(live&&!['play','pause','netleave','touchedit'].includes(state)) setState('play');
  if(!live&&state==='play') setState('netwait');
  if(state==='netwait') { const el=document.getElementById('netHostSt'); if(el) el.textContent=NET_ST[d.st]||'Хост в меню'; }
}
const NET_ST={menu:'Хост в главном меню',pause:'Хост поставил паузу',done:'Уровень пройден! Хост смотрит итоги',shop:'Хост в Лавке',gameover:'Падение… хост решает, что дальше',loading:'Загружается уровень…',slots:'Хост выбирает сохранение',levels:'Хост выбирает уровень',custom:'Хост меняет внешний вид',settings:'Хост в настройках'};
function netSmooth(dt){
  const k=Math.min(1,dt*14);
  const sm=e=>{ if(!e||e.tx==null||e===NET.me) return; // predict forward with velocity, then ease toward the server position
    if(e.vx) e.tx+=e.vx*dt*0.6; if(e.vy&&!e.onGround) e.ty+=e.vy*dt*0.3;
    e.x+=(e.tx-e.x)*k; e.y+=(e.ty-e.y)*k; };
  for(const p of players||[]) sm(p); for(const en of enemies||[]) sm(en); for(const c of crates||[]) sm(c); sm(boss);
  for(const m of movers||[]) if(m.tx!=null){ m.x+=(m.tx-m.x)*k; m.y+=(m.ty-m.y)*k; }
  for(const b of bullets||[]){ b.x+=(b.vx||0)*dt; b.y+=(b.vy||0)*dt; }
  for(const b of ebullets||[]){ if(b.g) b.vy=(b.vy||0)+b.g*dt; b.x+=(b.vx||0)*dt; b.y+=(b.vy||0)*dt; }
  for(const pk of pickups||[]) pk.t=(pk.t||0)+dt;
  for(const en of enemies||[]) en.t=(en.t||0)+dt;
  if(boss) boss.t=(boss.t||0)+dt;
}
function netGuestInput(){
  const i=soloInput(); const a=NET.acc; const me=NET.me;
  a.jp=a.jp||i.jp; a.ap=a.ap||i.ap; a.use=a.use||i.use; a.nx=a.nx||i.nx;
  NET.inT=(NET.inT||0)+1; if(!NET.direct&&NET.inT%2) return i;
  if(NET.conn&&NET.conn.open){ try{ NET.conn.send({t:'in',lv:levelIdx,p:me?[Math.round(me.x*10)/10,Math.round(me.y*10)/10,Math.round(me.vx),Math.round(me.vy),me.face]:null,i:{dir:i.dir,jump:i.jump,ab:i.ab,fire:i.fire,jp:a.jp,ap:a.ap,use:a.use,nx:a.nx}}); }catch(e){} NET.acc={}; }
  return i;
}
