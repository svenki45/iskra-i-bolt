/* ================= audio ================= */
let actx=null;
let masterG=null, musicG=null, sfxG=null, noiseBuf=null;
function audioInit(){
  if(actx){ if(actx.state==='suspended') actx.resume().catch(()=>{}); return; }
  try{
    actx=new (window.AudioContext||window.webkitAudioContext)();
    masterG=actx.createGain(); musicG=actx.createGain(); sfxG=actx.createGain();
    const comp=actx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4;
    musicG.connect(masterG); sfxG.connect(masterG); masterG.connect(comp).connect(actx.destination);
    noiseBuf=actx.createBuffer(1,actx.sampleRate*0.5,actx.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    applyVolumes(true);
  }catch(e){ actx=null; }
}
addEventListener('pointerdown',()=>audioInit());
function applyVolumes(now){
  if(!actx) return;
  const t=actx.currentTime, m=settings.mute?0:settings.master;
  const mus=settings.music*(state==='pause'?0.35:1)*0.55;
  masterG.gain.setTargetAtTime(m,t,now?0.001:0.05); musicG.gain.setTargetAtTime(mus,t,now?0.001:0.15); sfxG.gain.setTargetAtTime(settings.sfx,t,now?0.001:0.05);
}
/* ---- chiptune engine ---- */
const mf=m=>440*Math.pow(2,(m-69)/12);
const CH={B:{b:47,a:[59,63,66,71]},D:{b:50,a:[57,62,66,69]},Bb:{b:46,a:[58,62,65,70]},A:{b:45,a:[57,61,64,69]},Cm:{b:48,a:[55,60,63,67]},Ab:{b:44,a:[56,60,63,68]},Gm:{b:43,a:[55,58,62,67]},Eb:{b:39,a:[55,58,63,67]},Am:{b:45,a:[57,60,64,69]},F:{b:41,a:[57,60,65,69]},C:{b:48,a:[55,60,64,67]},G:{b:43,a:[55,59,62,67]},E:{b:40,a:[56,59,64,68]},Dm:{b:50,a:[57,62,65,69]},Em:{b:40,a:[55,59,64,67]}};
const _=null;
const SONGS={
  menu:{bpm:92,prog:['Am','F','C','G','Am','F','Dm','E'],kick:[],snare:[],hat:[2,6,10,14],arpEvery:2,arpType:'triangle',bassType:'triangle',leadType:'triangle',swing:0,
    mel:[[76,_,_,_,74,_,72,_],[72,_,_,_,69,_,_,_],[67,_,72,_,76,_,_,_],[74,_,_,_,71,_,_,_],[76,_,_,79,_,76,74,_],[72,_,_,_,77,_,_,_],[74,_,72,_,69,_,_,_],[68,_,_,_,71,_,_,_]]},
  level:{bpm:128,prog:['Am','F','C','G','Am','F','C','G'],kick:[0,8,10],snare:[4,12],hat:[2,6,10,14,15],arpEvery:1,arpType:'square',bassType:'square',leadType:'square',
    mel:[[69,_,72,69,76,_,74,72],[72,_,69,72,77,76,74,_],[76,_,79,76,72,74,76,_],[74,71,67,71,74,_,79,_],[81,_,79,76,79,_,76,74],[77,76,72,_,72,74,77,_],[79,_,76,72,76,79,84,_],[83,_,79,_,74,76,79,_]]},
  bossOld:{bpm:152,prog:['Am','Am','F','E','Am','Am','Dm','E'],kick:[0,4,8,12,14],snare:[4,12],hat:[1,3,5,7,9,11,13,15],arpEvery:1,arpType:'sawtooth',bassType:'sawtooth',leadType:'square',
    mel:[[69,69,_,72,_,71,69,_],[76,_,74,72,71,_,72,74],[77,_,76,74,72,_,74,76],[68,_,71,_,76,_,80,_],[81,_,80,_,81,83,84,_],[83,81,80,_,76,_,_,_],[77,_,74,_,77,81,86,_],[80,_,76,_,71,_,68,_]]}
};
const music={song:null,step:0,next:0};
(()=>{ const B=SONGS.level, P=[['Am','F','C','G'],['Em','C','G','D'],['Dm','Bb','F','C'],['Cm','Ab','Eb','Bb'],['Am','Dm','E','Am'],['Gm','Eb','Bb','F'],['Em','Am','B','Em'],['Dm','Am','Bb','C'],['Cm','Gm','Ab','G'],['Am','F','Dm','E']],
  TY=['square','triangle','square','sawtooth','square','triangle','sawtooth','square','sawtooth','square'], BPM=[124,118,132,126,136,112,140,122,144,150],
  KK=[[0,8,10],[0,6,8],[0,4,8,12],[0,3,8,11],[0,8,10,14],[0,10],[0,4,8,12,14],[0,7,8],[0,3,6,8,11],[0,4,8,10,12]];
  for(let c=0;c<10;c++){ const r=c%8; SONGS['ch'+c]=Object.assign({},B,{bpm:BPM[c],prog:P[c].concat(P[c]),kick:KK[c],arpType:TY[c],leadType:c%3===1?'triangle':'square',bassType:c%2?'triangle':'square',arpEvery:c%4===1?2:1,mel:B.mel.slice(r).concat(B.mel.slice(0,r))}); } })();
SONGS.boss={bpm:138,custom:(st,t,s)=>epicStep(st,t,s)};
SONGS.boss_core=SONGS.boss;
/* epic boss theme: 16 bars, two sections, second phase adds layers */
const EPIC={bpm:138,
  prog:['Am','Am','F','F','G','G','E','E','Am','Am','F','F','Dm','Dm','E','E'],
  mel:[[69,_,_,_,72,_,71,_],[69,_,_,_,64,_,_,_],[65,_,_,_,69,_,72,_],[77,_,_,_,76,_,74,_],
       [74,_,_,_,71,_,74,_],[79,_,_,_,77,_,76,_],[76,_,_,_,_,_,_,_],[68,_,71,_,76,_,80,_],
       [81,_,79,_,76,_,72,_],[76,_,79,_,81,_,84,_],[84,_,81,_,77,_,81,_],[79,_,77,_,76,_,77,_],
       [74,_,77,_,81,_,77,_],[86,_,84,_,81,_,77,_],[80,_,_,_,83,_,_,_],[88,_,86,_,83,_,80,_]],
  ost:[0,0,12,0,0,12,0,7,0,0,12,0,0,12,7,12]};
function vox(freq,t,dur,o){
  // layered voice: n detuned oscillators, lowpass, attack
  const g=actx.createGain(), f=actx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=o.cut||20000; f.Q.value=o.q||0.7;
  const a=o.att||0.008, v=o.vol||0.1, n=o.n||1;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+a); g.gain.setValueAtTime(v,t+Math.max(a,dur*0.6)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  if(o.sweep){ f.frequency.setValueAtTime(o.cut*0.4,t); f.frequency.exponentialRampToValueAtTime(o.cut,t+Math.min(dur,0.25)); }
  for(let i=0;i<n;i++){ const os=actx.createOscillator(); os.type=o.type||'sawtooth'; os.frequency.setValueAtTime(freq,t); os.detune.value=(n>1?(i/(n-1)-0.5)*2:0)*(o.det||0); os.connect(f); os.start(t); os.stop(t+dur+0.05); }
  f.connect(g).connect(musicG);
}
function boom(kind,t){
  if(kind==='tom'||kind==='timp'){ const o=actx.createOscillator(), g=actx.createGain(); const f0=kind==='timp'?(o.__f||90):140; o.type='sine'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f0*0.55,t+0.25); g.gain.setValueAtTime(kind==='timp'?0.8:0.6,t); g.gain.exponentialRampToValueAtTime(0.0001,t+(kind==='timp'?0.6:0.3)); o.connect(g).connect(musicG); o.start(t); o.stop(t+0.65); return; }
  if(kind==='crash'){ const s=actx.createBufferSource(); s.buffer=noiseBuf; s.loop=true; const f=actx.createBiquadFilter(), g=actx.createGain(); f.type='highpass'; f.frequency.value=4500; g.gain.setValueAtTime(0.3,t); g.gain.exponentialRampToValueAtTime(0.0001,t+1.4); s.connect(f).connect(g).connect(musicG); s.start(t); s.stop(t+1.5); }
}
function tomAt(freq,t){ const o=actx.createOscillator(), g=actx.createGain(); o.type='sine'; o.frequency.setValueAtTime(freq,t); o.frequency.exponentialRampToValueAtTime(freq*0.6,t+0.2); g.gain.setValueAtTime(0.55,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.28); o.connect(g).connect(musicG); o.start(t); o.stop(t+0.3); }
function epicStep(step,t,s16){
  const L=EPIC.prog.length, bar=Math.floor(step/16)%L, st=step%16, ch=CH[EPIC.prog[bar]], rage=!!(boss&&!boss.dead&&boss.hp<boss.max/2), secB=bar>=8;
  const barLen=s16*16;
  // drums
  if(st===0&&bar%4===0) boom('crash',t);
  if([0,6,8].includes(st)||(rage&&[3,10,14].includes(st))) drum('kick',t);
  if(st===4||st===12) drum('snare',t);
  if(rage?true:st%2===0) drum('hat',t);
  if(st===0&&bar%2===0){ boom('timp',t); }
  if(bar%4===3&&st>=12){ tomAt([220,180,150,120][st-12],t); if(st===15) drum('snare',t+s16*0.5); }
  // ostinato bass (16ths, driving)
  vox(mf(ch.b+EPIC.ost[st]),t,s16*0.95,{type:'sawtooth',vol:0.11,cut:secB?1100:800,n:2,det:8});
  // low sub on beats
  if(st%4===0) vox(mf(ch.b-12),t,s16*3.8,{type:'triangle',vol:0.22});
  // string/choir pad: whole bar, slow attack
  if(st===0){ for(const n of ch.a.slice(0,3)) vox(mf(n),t,barLen*1.02,{type:'sawtooth',vol:0.035,cut:secB?2200:1400,n:3,det:14,att:0.25}); vox(mf(ch.a[0]-12),t,barLen*1.02,{type:'triangle',vol:0.06,att:0.3}); }
  // brass lead
  if(st%2===0){
    const row=EPIC.mel[bar], i=st/2, n=row[i];
    if(n!=null){ let len=1; while(i+len<8&&row[i+len]==null&&len<4) len++; const d=s16*2*len*0.97;
      vox(mf(n),t,d,{type:'sawtooth',vol:0.06,cut:2600,n:3,det:10,att:0.03,sweep:true,q:2});
      vox(mf(n-12),t,d,{type:'square',vol:0.03,cut:1500});
      if(rage||secB) vox(mf(n+12),t,d,{type:'triangle',vol:0.035}); }
  }
  // stabs on offbeats in section B
  if(secB&&(st===2||st===10)) for(const n of ch.a.slice(0,3)) vox(mf(n+12),t,s16*0.8,{type:'square',vol:0.02,cut:3000});
}
function clank(t,v=0.35){
  const s=actx.createBufferSource(); s.buffer=noiseBuf; const f=actx.createBiquadFilter(), g=actx.createGain(); f.type='bandpass'; f.frequency.value=3400; f.Q.value=6;
  g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.12); s.connect(f).connect(g).connect(musicG); s.start(t); s.stop(t+0.15);
  const o=actx.createOscillator(), g2=actx.createGain(); o.type='square'; o.frequency.setValueAtTime(1760,t); o.frequency.exponentialRampToValueAtTime(900,t+0.08); g2.gain.setValueAtTime(v*0.12,t); g2.gain.exponentialRampToValueAtTime(0.0001,t+0.09); o.connect(g2).connect(musicG); o.start(t); o.stop(t+0.1);
}
/* per-boss themes */
const THEMES={
  toad:{bpm:118,spb:16,prog:['Em','Em','C','C','D','D','B','B'],
    mel:[[64,_,_,67,_,_,66,_],[64,_,_,_,59,_,_,_],[60,_,_,64,_,_,67,_],[72,_,_,_,71,_,_,_],[69,_,_,66,_,_,62,_],[74,_,_,_,72,_,71,_],[71,_,_,_,_,_,75,_],[78,_,_,_,75,_,71,_]],
    ost:[0,_,0,0,12,0,0,_,0,_,0,0,7,0,12,_],kick:[0,3,8,11],rageKick:[6,14],snare:[4,12],clank:[4,12],hat:8,
    bass:{type:'square',vol:0.1,cut:600},lead:{type:'sawtooth',vol:0.07,cut:1800,n:3,det:12},leadLow:true,pad:{vol:0.03,cut:900},timp:true},
  eye:{bpm:150,spb:16,prog:['Dm','Dm','Bb','Bb','C','C','A','A'],
    mel:[[74,_,77,_,81,_,79,77],[76,_,74,_,72,_,74,_],[74,_,77,_,82,_,81,77],[77,_,_,_,74,_,_,_],[76,_,79,_,84,_,82,81],[79,_,77,_,76,_,72,_],[73,_,76,_,81,_,79,76],[73,_,_,_,69,_,_,_]],
    ost:[0,12,0,12,0,12,0,12,0,12,0,12,7,19,7,19],kick:[0,4,8,12],rageKick:[14],snare:[4,12],hat:'off',
    bass:{type:'sawtooth',vol:0.08,cut:1200},arp:{type:'sawtooth',vol:0.045,cut:4200,every:1,oct:12},lead:{type:'square',vol:0.07,cut:3800,n:2,det:6},pad:{vol:0.025,cut:1800}},
  gear:{bpm:168,spb:16,prog:['Cm','Ab','Bb','G','Cm','Ab','Bb','G'],
    mel:[[72,72,_,75,_,72,79,_],[80,_,79,_,75,_,72,_],[74,74,_,77,_,74,82,_],[79,_,77,_,74,_,71,_],[84,_,82,_,79,_,75,_],[80,_,84,_,87,_,84,_],[82,_,79,_,77,_,74,_],[79,_,74,_,71,_,67,_]],
    ost:[0,_,12,_,0,_,12,_,0,_,12,_,7,_,12,_],kick:[0,6,8,14],rageKick:[3,11],snare:[4,12],clank:[2,10],hat:8,
    bass:{type:'square',vol:0.1,cut:900},arp:{type:'square',vol:0.03,cut:3000,every:2,oct:12},lead:{type:'square',vol:0.08,cut:3200,stac:true}},
  queen:{bpm:138,spb:12,prog:['Gm','Gm','Eb','Eb','F','F','D','D'],
    mel:[[67,_,70,_,74,_],[72,70,69,_,67,_],[67,_,70,_,75,_],[74,_,72,_,70,_],[72,_,74,_,77,_],[75,74,72,_,70,_],[69,_,72,_,66,_],[69,_,_,_,62,_]],
    ost:[0,_,_,_,12,_,_,_,7,_,_,_],kick:[0],rageKick:[6],snare:[4,8],hat:[2,6,10],
    bass:{type:'triangle',vol:0.22},arp:{type:'square',vol:0.035,cut:2600,every:2,oct:12,harp:true},lead:{type:'sawtooth',vol:0.065,cut:2400,n:3,det:9},pad:{vol:0.035,cut:1600},timp:true}
};
function themeStep(th,step,t,s16){
  const TR=(boss&&boss.v>1)?boss.v-1:0, M=n=>mf(n+TR);
  const spb=th.spb, L=th.prog.length, bar=Math.floor(step/spb)%L, st=step%spb, ch=CH[th.prog[bar]];
  const rage=!!(boss&&!boss.dead&&boss.hp<boss.max/2), barLen=s16*spb, half=spb/2;
  if(st===0&&bar%4===0) boom('crash',t);
  if(th.timp&&st===0&&bar%2===0) boom('timp',t);
  if(th.kick.includes(st)||(rage&&th.rageKick.includes(st))) drum('kick',t);
  if(th.snare.includes(st)) drum('snare',t);
  if(th.clank&&th.clank.includes(st)) clank(t);
  const hat=th.hat; if(rage||(hat===8&&st%2===0)||(hat==='off'&&st%2===1)||(Array.isArray(hat)&&hat.includes(st))) drum('hat',t);
  if(spb===16&&bar%4===3&&st>=12) tomAt([220,180,150,120][st-12],t);
  const o=th.ost[st]; if(o!=null) vox(M(ch.b+o),t,s16*(th.ost[(st+1)%spb]==null?1.9:0.95),{type:th.bass.type,vol:th.bass.vol,cut:th.bass.cut});
  if(st%4===0) vox(M(ch.b-12),t,s16*3.6,{type:'triangle',vol:0.16});
  if(th.pad&&st===0) for(const n of ch.a.slice(0,3)) vox(M(n),t,barLen*1.02,{type:'sawtooth',vol:th.pad.vol,cut:th.pad.cut,n:2,det:12,att:0.2});
  if(th.arp&&st%th.arp.every===0){ const k=(st/th.arp.every)%ch.a.length; const n=ch.a[th.arp.harp?[0,1,2,3,2,1][k%6]:k]+th.arp.oct+(rage?12:0)*(th.arp.harp?0:1); vox(M(n),t,s16*th.arp.every*(th.arp.harp?1.6:0.9),{type:th.arp.type,vol:th.arp.vol,cut:th.arp.cut}); }
  if(st%2===0){
    const row=th.mel[bar], i=st/2, n=row[i];
    if(n!=null){ let len=1; while(i+len<half&&row[i+len]==null&&len<4) len++; const d=th.lead.stac?s16*1.2:s16*2*len*0.97;
      vox(M(n),t,d,{type:th.lead.type,vol:th.lead.vol,cut:th.lead.cut,n:th.lead.n||1,det:th.lead.det||0,att:0.02,sweep:!th.lead.stac,q:1.5});
      if(th.leadLow) vox(M(n-12),t,d,{type:'square',vol:0.03,cut:1200});
      if(rage) vox(M(n+12),t,d,{type:'triangle',vol:0.035}); }
  }
}
for(const k in THEMES) SONGS['boss_'+k]={bpm:THEMES[k].bpm,custom:(st,t,s)=>themeStep(THEMES[k],st,t,s)};
function voice(freq,t,dur,type,vol,cutoff){
  const o=actx.createOscillator(), g=actx.createGain(); o.type=type; o.frequency.setValueAtTime(freq,t);
  let out=o; if(cutoff){ const f=actx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=cutoff; o.connect(f); out=f; }
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.008); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  out.connect(g).connect(musicG); o.start(t); o.stop(t+dur+0.05);
}
function drum(kind,t){
  if(kind==='kick'){ const o=actx.createOscillator(), g=actx.createGain(); o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+0.12); g.gain.setValueAtTime(0.9,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.2); o.connect(g).connect(musicG); o.start(t); o.stop(t+0.22); return; }
  const s=actx.createBufferSource(); s.buffer=noiseBuf; const f=actx.createBiquadFilter(), g=actx.createGain();
  if(kind==='snare'){ f.type='bandpass'; f.frequency.value=1800; g.gain.setValueAtTime(0.45,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.14); }
  else { f.type='highpass'; f.frequency.value=7000; g.gain.setValueAtTime(0.16,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.04); }
  s.connect(f).connect(g).connect(musicG); s.start(t); s.stop(t+0.2);
}
function scheduleStep(S,step,t){
  const s16=60/S.bpm/4, bar=Math.floor(step/16)%S.prog.length, st=step%16, ch=CH[S.prog[bar]];
  if(S.kick.includes(st)) drum('kick',t);
  if(S.snare.includes(st)) drum('snare',t);
  if(S.hat.includes(st)) drum('hat',t);
  if(st%2===0){ const bn=ch.b+(st%8===4?12:0); voice(mf(bn),t,s16*1.8,S.bassType,0.22,S.bassType==='triangle'?0:700); }
  if(st%S.arpEvery===0){ const an=ch.a[(st/S.arpEvery)%ch.a.length]+12; voice(mf(an),t,s16*0.9,S.arpType,0.05,S.arpType==='triangle'?0:2600); }
  if(st%2===0){
    const row=S.mel[bar], i=st/2, n=row[i];
    if(n!=null){ let len=1; while(i+len<8&&row[i+len]==null&&len<3) len++; voice(mf(n),t,s16*2*len*0.95,S.leadType,0.11,S.leadType==='square'?3200:0); }
  }
}
setInterval(()=>{
  if(!actx||!music.song||actx.state!=='running') return;
  const S=SONGS[music.song], s16=60/(S.bpm*(S.custom&&boss&&boss.v>1?1+0.05*(boss.v-1):1))/4;
  if(music.next<actx.currentTime-0.2) music.next=actx.currentTime+0.05;
  while(music.next<actx.currentTime+0.15){ if(S.custom) S.custom(music.step,music.next,s16); else scheduleStep(S,music.step,music.next); music.next+=s16; music.step++; }
},25);
function playMusic(name){ if(music.song===name) return; if(name==null){ music.song=null; return; } music.song=name; music.step=0; if(actx) music.next=actx.currentTime+0.08; }
let previewSong=null;
function updateMusic(){
  if(state!=='settings') previewSong=null;
  const want=(state==='gameover'||state==='dying')?null:state==='settings'&&previewSong?previewSong:(state==='play'||state==='dying'||state==='pause'||state==='done')?(intro?null:(boss&&!boss.dead?'boss_'+boss.type:'ch'+chapterOf(levelIdx))):'menu';
  playMusic(want); applyVolumes(false);
}
function noise(freq,dur,vol,type='bandpass',delay=0){
  if(!actx||!noiseBuf) return;
  try{ const t=actx.currentTime+delay, s=actx.createBufferSource(), f=actx.createBiquadFilter(), g=actx.createGain();
    s.buffer=noiseBuf; f.type=type; f.frequency.value=freq; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f).connect(g).connect(sfxG); s.start(t); s.stop(t+dur+0.02); }catch(e){}
}
// --- made-up "Simlish"-style voice: formant-filtered syllables ---
const VOICES={narr:{f:120,rng:30,type:'sawtooth',rate:7.5,vol:.13},spark:{f:330,rng:90,type:'triangle',rate:10,vol:.12},bolt:{f:95,rng:20,type:'square',rate:6.5,vol:.07,robo:true},boss:{f:70,rng:15,type:'sawtooth',rate:5,vol:.14,growl:true}};
const VOWELS=[[730,1090],[270,2290],[530,1840],[570,840],[300,870],[660,1700]];
function babble(text,v='narr'){
  if(!actx||settings.mute) return 0; const V=VOICES[v]; const n=Math.max(3,Math.round(text.replace(/[^А-Яа-яЁёA-Za-z]/g,'').length/3.2));
  let t=actx.currentTime+.05; const q=/\?\s*$/.test(text);
  for(let i=0;i<n;i++){ const d=(.6+Math.random()*.6)/V.rate, o=actx.createOscillator(), g=actx.createGain(), [f1,f2]=VOWELS[Math.floor(Math.random()*VOWELS.length)];
    const b1=actx.createBiquadFilter(), b2=actx.createBiquadFilter(); b1.type=b2.type='bandpass'; b1.frequency.value=f1; b2.frequency.value=f2; b1.Q.value=b2.Q.value=6;
    o.type=V.type; let p=V.f+(Math.random()-.5)*V.rng*2; if(q&&i>=n-2) p*=1.25+(i-n+2)*.15; o.frequency.setValueAtTime(p,t); o.frequency.linearRampToValueAtTime(p*(.9+Math.random()*.25),t+d);
    if(V.robo){ const lfo=actx.createOscillator(), lg=actx.createGain(); lfo.frequency.value=38; lg.gain.value=12; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t+d); }
    if(V.growl){ const lfo=actx.createOscillator(), lg=actx.createGain(); lfo.frequency.value=22; lg.gain.value=18; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t+d); }
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(V.vol,t+.02); g.gain.setValueAtTime(V.vol,t+d*.7); g.gain.linearRampToValueAtTime(0,t+d);
    o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g); g.connect(sfxG); o.start(t); o.stop(t+d+.02);
    t+=d+(Math.random()<.18?.12:.02); }
  return t-actx.currentTime;
}
function tone(f1,f2,dur,type='square',vol=0.05,delay=0){
  if(!actx) return;
  try{
    const t=actx.currentTime+delay, o=actx.createOscillator(), g=actx.createGain();
    o.type=type; o.frequency.setValueAtTime(f1,t); o.frequency.exponentialRampToValueAtTime(Math.max(30,f2),t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g).connect(sfxG); o.start(t); o.stop(t+dur+0.03);
  }catch(e){}
}
const SFX={
  jump:()=>tone(380,720,.11,'square',.035), jump2:()=>tone(620,1150,.12,'triangle',.05),
  dash:()=>tone(900,260,.13,'sawtooth',.03), boost:()=>tone(180,950,.28,'square',.06),
  slam:()=>tone(170,40,.28,'sawtooth',.08), crack:()=>{tone(260,50,.32,'square',.06);tone(120,40,.4,'sawtooth',.04,.03)},
  on:()=>tone(520,780,.08,'triangle',.05), off:()=>tone(520,330,.08,'triangle',.035),
  die:()=>tone(520,70,.42,'sawtooth',.06),
  shotS:()=>{ noise(5200,.045,.05,'highpass'); tone(1900,900,.06,'triangle',.03); tone(2600,1400,.03,'square',.012); },
  shotSP:()=>{ noise(2400,.18,.09,'bandpass'); tone(500,1400,.12,'sawtooth',.04); tone(220,80,.25,'square',.04,.03); },
  shotB:()=>{ tone(240,85,.09,'square',.045); noise(2600,.06,.07,'bandpass'); tone(1300,700,.03,'square',.015,.01); },
  shotBP:()=>{ tone(150,45,.22,'sawtooth',.07); noise(1800,.14,.1,'bandpass'); tone(900,400,.08,'square',.02,.02); },
  boomS:()=>{ noise(900,.3,.12,'lowpass'); tone(160,40,.3,'sawtooth',.06); },
  pk_heart:()=>{ [523,659,784,1047].forEach((f,i)=>tone(f,f,.16,'triangle',.07,i*.07)); tone(2093,2093,.35,'sine',.04,.3); },
  pk_shield:()=>{ tone(300,1200,.35,'sine',.07); tone(1200,1260,.6,'triangle',.04,.3); tone(1800,1890,.5,'sine',.03,.36); },
  pk_triple:()=>{ [880,1175,1568].forEach((f,i)=>{ tone(f,f*1.02,.07,'square',.045,i*.07); }); tone(1568,3136,.18,'triangle',.04,.24); },
  pk_rapid:()=>{ for(let i=0;i<9;i++) tone(700+i*140,760+i*140,.04,'square',.035,i*.032); tone(2100,2600,.2,'triangle',.04,.3); },
  pk_power:()=>{ tone(70,420,.45,'sawtooth',.08); tone(140,840,.45,'square',.035); [392,523,659,784].forEach((f,i)=>tone(f,f,.22,'sawtooth',.035,.38+i*.02)); noise(800,.4,.06,'lowpass'); },
  hit:()=>tone(300,180,.05,'square',.03), hurt:()=>tone(240,90,.22,'sawtooth',.06),
  pick:()=>{tone(880,880,.06,'triangle',.05);tone(1320,1320,.08,'triangle',.05,.06)},
  gear:()=>{ tone(1500,1900,.05,'triangle',.035); tone(2250,2850,.06,'sine',.025,.04); },
  crit:()=>{tone(1500,2400,.08,'square',.04);tone(2400,3200,.1,'triangle',.04,.05);},
  nav:()=>tone(1100,1300,.03,'triangle',.025),
  kill:()=>tone(400,60,.18,'square',.04), boss:()=>{tone(110,55,.6,'sawtooth',.07);tone(165,80,.6,'square',.04,.1)},
  revive:()=>{tone(440,880,.18,'triangle',.06)},
  win:()=>{tone(523,523,.12,'triangle',.06);tone(659,659,.12,'triangle',.06,.11);tone(784,1046,.3,'triangle',.06,.22)}
};
let sfxGate={};
const sfx=n=>{ const now=performance.now(); if(sfxGate[n]&&now-sfxGate[n]<35) return; sfxGate[n]=now; if(SFX[n]) SFX[n](); };

