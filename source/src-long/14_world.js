/* ================= world ================= */
function updateWorld(dt){
  for(const pl of plates){
    const r={x:pl.x*T+4,y:pl.y*T+T-12,w:T-8,h:12};
    const on=players.concat(crates).some(e=>overlap(e,r));
    if(on!==pl.on){ pl.on=on; sfx(on?'on':'off'); if(on&&crates.some(c=>overlap(c,r))) unlock('crate'); }
  }
  for(const k in doors){
    const d=doors[k], pressedNow=plates.some(p=>p.key===d.key&&p.on);
    if((solo||d.timed)&&!d.bridge){ if(pressedNow) d.timer=curTimer; else if(d.timer>0){ const before=Math.ceil(d.timer); d.timer=Math.max(0,d.timer-dt); if(Math.ceil(d.timer)!==before&&d.timer>0) tone(1200,1200,.04,'square',.03); } }
    const held=pressedNow||((solo||d.timed)&&d.timer>0), want=d.bridge?pressedNow:!held;
    if(!want) d.solid=false;
    else if(!d.solid){
      const busy=players.concat(crates).some(e=>d.cells.some(([x,y])=>overlap(e,{x:x*T,y:y*T,w:T,h:T})));
      if(!busy){ d.solid=true; if(d.bridge) unlock('bridge'); }
    }
    d.vis+=((d.solid?1:0)-d.vis)*Math.min(1,dt*12);
  }
  for(const p of players){
    const tx0=Math.floor(p.x/T), tx1=Math.floor((p.x+p.w-0.01)/T), ty0=Math.floor(p.y/T), ty1=Math.floor((p.y+p.h-0.01)/T);
    for(let ty=ty0;ty<=ty1;ty++) for(let tx=tx0;tx<=tx1;tx++)
      if(grid[ty]&&grid[ty][tx]==='^'&&overlap(p,{x:tx*T+7,y:ty*T+T*0.5,w:T-14,h:T*0.5})){ die(p,'spikes'); return; }
      else if(grid[ty]&&grid[ty][tx]==='L'&&!p.down&&overlap(p,{x:tx*T+4,y:ty*T+T*0.45,w:T-8,h:T*0.55})){ const had=p.inv<=0; hurt(p); if(had){ p.vy=-720; p.cut=true; burst(p.x+p.w/2,p.y+p.h,14,['#ffb347','#ff5a2a','#fff3c4'],260,.5); } }
    p.inExit=!p.down&&overlap(p,{x:exitRect.x+6,y:exitRect.y,w:exitRect.w-12,h:exitRect.h});
  }
  // revive
  for(const p of players){
    if(!p.down) continue;
    const q=players.find(o=>o!==p);
    const near=!q.down&&Math.hypot((q.x+q.w/2)-(p.x+p.w/2),(q.y+q.h/2)-(p.y+p.h/2))<56;
    p.reviveT=near?p.reviveT+dt:Math.max(0,p.reviveT-dt);
    if(!near){ p.bleed=(p.bleed==null?8:p.bleed)-dt; if(p.bleed<=0||q.down||q.dead){ die(p,'down'); return; } }
    if(p.reviveT>=1.2*(U('fastRevive')?0.5:1)){ p.down=false; p.hp=1; p.inv=1.5; p.reviveT=0; sfx('revive'); unlock('revive'); burst(p.x+p.w/2,p.y+p.h/2,16,'#7fe08a',220,.5); texts.push({x:p.x+p.w/2,y:p.y-20,t:'ВСТАЛ!',life:1,c:'#7fe08a'}); }
  }
  for(const c of checkpoints){ if(c.on) continue; if(players.some(p=>!p.absent&&!p.dead&&!p.down&&p.x+p.w/2>c.x)){ c.on=true; cpSave={lvl:levelIdx,x:c.x}; sfx('pk_shield'); burst(c.x+10,FLOOR_Y-66,22,['#7fe08a','#fff'],240,.6); texts.push({x:c.x,y:FLOOR_Y-100,t:'ФЛАЖОК!',life:1.4,c:'#7fe08a',pop:true}); } }
  if(!solo&&WW>VW){ const [a,b]=players; if(!a.absent&&!b.absent&&!a.dead&&!b.dead&&!a.down&&!b.down&&Math.abs(a.x-b.x)>VW*0.9){ const lead=a.x>b.x?a:b, lag=lead===a?b:a; burst(lag.x+lag.w/2,lag.y+lag.h/2,14,'#9cc3ff',200,.4); lag.x=lead.x-lag.w-10; lag.y=lead.y+lead.h-lag.h; lag.vx=0; lag.vy=0; burst(lag.x+lag.w/2,lag.y+lag.h/2,14,'#9cc3ff',200,.4); texts.push({x:lag.x+lag.w/2,y:lag.y-24,t:'ДОГНАЛ!',life:1,c:'#9cc3ff'}); } }
  if(!exitLocked&&players.filter(p=>!p.absent).every(p=>p.inExit)){ exitHold+=dt; if(exitHold>0.35) complete(); } else exitHold=0;
}
const BOSS_TIPS={
  toad:['Когда Жаба приземляется, по полу бегут красные волны. Перепрыгивайте их или стойте на низких платформах: волны проходят под ними.',
        'В прыжке Жаба не стреляет. Пока она в воздухе, отбегите от места, куда она падает, и стреляйте в спину.',
        'Прыжок Жабе на голову снимает 4 здоровья, а удар Болта сверху (способность в воздухе) снимает 8.'],
  eye:['Око бьёт очередью по ближайшему. Разбегитесь по разным сторонам арены: пока оно целится в одного, второй стреляет без помех.',
       'Кольцо пуль летит раз в несколько секунд. Ищите просвет между пулями и шагайте в него, а не убегайте от кольца.',
       'С верхних платформ по Оку попадать проще. Искра поднимется туда с подброса Болта.'],
  gear:['Шестерню не раздавить прыжком сверху, её берёт только стрельба.',
        'Шестерня отскакивает от пола всегда одинаково высоко. Пробегайте под ней, пока она в верхней точке.',
        'Каждые несколько секунд с краёв ползут жуки. Убирайте их сразу, иначе зажмут вас между собой и Шестернёй.'],
  queen:['Перед тараном Королева мигает красным. Уходите с её линии на платформы.',
         'После тарана она врезается в стену и почти секунду оглушена. Это лучший момент, чтобы стрелять в упор.',
         'Пусть один стреляет по осам, которых она зовёт, а второй держит огонь на Королеве.'],
  core:['Механизм повторяет атаки по кругу: очередь, кольцо, дождь сверху, подкрепление, волны по полу. Запомните порядок, и будете знать, что дальше.',
        'Во время дождя пули падают вертикально. Двигайтесь не переставая.',
        'Бонусы на платформах появляются каждые 13 секунд. Тройной и мощный выстрел сильно ускоряют бой, берите их.']
};
const BOSS_TIPS2={
  toad:['Mk II прыгает дважды: в верхней точке он перенацеливается. Не убегайте сразу, сначала дождитесь второго прыжка.','Теперь волн по две: быстрая и медленная. Перепрыгните первую и сразу готовьтесь ко второй.'],
  eye:['Лазер сначала показывает пунктир прицела, потом бьёт и медленно ведёт лучом в сторону. Уходите поперёк луча, а не вдоль.','Пока Око светит лазером, оно не стреляет очередями: самое время для урона.'],
  gear:['От каждого отскока Mk II по полу бегут волны. Держитесь на платформах и спрыгивайте только чтобы пройти.','Осы из подкрепления летают высоко, сбивайте их первыми.'],
  queen:['Mk II таранит дважды: врезавшись в стену, она тут же разворачивается. Не спрыгивайте с платформы после первого удара.','Оглушение наступает только после второго тарана, тогда и бейте.']
};
const BOSS_WON={toad:'ОДЕРЖАЛА ВЕРХ',eye:'ОДЕРЖАЛО ВЕРХ',gear:'ОДЕРЖАЛА ВЕРХ',queen:'ОДЕРЖАЛА ВЕРХ',core:'ОДЕРЖАЛ ВЕРХ'};
const TIPS={
  spikes:['Над шипами бывает мост. Он появляется, пока кто-то стоит на кнопке того же цвета.',
          'Искра перелетает длинные шипы двойным прыжком и рывком. Болту для этого нужен мост или другой путь.',
          'Перед прыжком через шипы остановитесь у края: с разбега легко не рассчитать.'],
  down:['Врагов можно давить прыжком сверху: это быстрее, чем стрелять.',
        'Упавшего напарника поднимают, постояв рядом, пока не заполнится зелёный круг.',
        'Щит из бонусов полностью гасит один удар. Отдайте его тому, кто идёт первым.'],
  any:['Болт подбрасывает Искру, если она стоит у него на голове и он жмёт способность.',
       'Ящик на кнопке держит дверь сам, и тогда никому не нужно стоять на кнопке.',
       'Треснувшие блоки ломаются выстрелом или ударом Болта сверху.']
};
let go=null; // game-over info
function die(p,cause){
  if(state!=='play') return;
  if(!edTest) lvlStat(levelIdx,'d',1);
  if((cheatGod||demo)&&p&&cause!=='down'){ p.vy=-950; p.inv=1; p.onGround=false; sfx('boost'); burst(p.x+p.w/2,p.y+p.h,10,'#7fe08a',200,.4); return; }
  const b=boss&&!boss.dead?boss:null;
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  go={t:10,cause,who:p.kind,bossType:b?b.type:null,bossName:b?b.name:null,bossPct:b?Math.max(1,Math.round(b.hp/b.max*100)):0,
      tip:b?pick((b.v>1&&BOSS_TIPS2[b.type])?BOSS_TIPS2[b.type].concat(BOSS_TIPS[b.type].slice(0,1)):BOSS_TIPS[b.type]):pick(((TIPS[cause]||[]).concat(TIPS.any)).filter(t=>!solo||!(soloHero==='bolt'?/Искр/:/Болт/).test(t)).concat(solo?['Не торопитесь: осмотрите уровень, прежде чем прыгать.']:[]))};
  deaths++; $('deaths').textContent=deaths; state='dying'; deathTimer=1.3; flash('#ff3b4e',.45); shake=Math.max(shake,8); sfx('die');
  burst(p.x+p.w/2,p.y+p.h/2,26,p.kind==='spark'?'#ff8a3d':'#62c7c1',420,.8);
  p.dead=true;
  texts.push({x:p.x+p.w/2,y:p.y-16,t:'ОЙ!',life:.9,c:'#ff6b6b'});
}
const starKey=()=>'iskra-bolt-stars'+modeSuffix();
function starsAll(){ return store.get(starKey(),{}); }
const starPar=L=>L.boss?150:(solo?35:40);
let lastStars=null;
function recordStars(L){ const all=starsAll(), o=all[levelIdx]||{s:0,bt:0}, got=[true,levelTime<=starPar(L),!levelHurt];
  const newRec=!o.bt||levelTime<o.bt; let m=o.s; got.forEach((g,i)=>{ if(g) m|=1<<i; }); all[levelIdx]={s:m,bt:newRec?Math.round(levelTime*10)/10:o.bt};
  store.set(starKey(),all); lastStars={got,newRec,bt:all[levelIdx].bt,par:starPar(L),prev:o.bt};
  const ch=chapterOf(levelIdx); let full=true; for(let i=ch*10;i<ch*10+10;i++){ const x=all[i]; if(!x||x.s!==7) full=false; }
  const fk='iskra-bolt-starch'+modeSuffix(), fd=store.get(fk,{}); if(full&&!fd[ch]&&!anyCheat()){ fd[ch]=1; store.set(fk,fd); addScore(3000); toastQ.push({small:'Все звёзды главы',title:'Глава '+(ch+1)+': +3000 очков'}); showToast(); } }
const starCount=()=>{ const a=starsAll(); let n=0; for(const k in a) for(let i=0;i<3;i++) if(a[k].s>>i&1) n++; return n; };
const starHtml=(m,big)=>'<span class="stars'+(big?' big':'')+'">'+[0,1,2].map(i=>`<i class="${m>>i&1?'on':''}">★</i>`).join('')+'</span>';
function complete(){
  if(edTest){ ED.endTest(true); return; }
  cpSave=null;
  if(demo){ demoNext(); return; }
  recordStars(getLevel(levelIdx));
  lvlStat(levelIdx,'c',1); lvlStat(levelIdx,'t',Math.round(levelTime));
  sfx('win'); saveBest(levelIdx+1); saveStats();
  const L=getLevel(levelIdx);
  if(levelIdx===0) unlock('first');
  if(!L.boss&&levelIdx>0&&levelTime<20) unlock('speed');
  if(levelIdx===9&&runClean&&deaths===0) unlock('flawless10');
  if(levelIdx+1>=49) unlock('lv50');
  if(levelIdx===TOTAL-1) unlock('final');
  const rw={base:L.boss?1000+300*Math.round(L.tier):150, speed:L.boss?0:Math.max(0,Math.round(300-levelTime*6)), clean:levelDowned?0:(L.boss?500:100)};
  rw.total=rw.base+rw.speed+rw.clean; run.reward=rw; addScore(rw.total);
  if(L.boss&&levelIdx<TOTAL-1){ run.offer=rollOffer(); run.refresh=0; saveRun(); shopFrom='boss'; setState('shop'); return; }
  saveRun();
  if(levelIdx===TOTAL-1){ endT=0; setState('ending'); } else setState('done');
}

