/* ================= boot ================= */
function start(data){
  data=data||{};
  if(typeof data.deaths==='number'){ deaths=data.deaths; totalTime=data.totalTime||0; gears=data.gears||0; $('deaths').textContent=deaths; $('gears').textContent=gears; }
  const i=Math.min(TOTAL-1,Math.max(0,data.levelIdx|0));
  fit(); loadLevel(i); renderLegend(true); { const se=document.getElementById('score'); if(se) se.textContent=run.score.toLocaleString('ru-RU'); }
  setState(data.state==='play'?'play':'title');
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ staticDirty=true; });
  requestAnimationFrame(t=>{ last=t; requestAnimationFrame(frame); });
}

