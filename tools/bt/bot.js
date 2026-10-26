/* Бот-проходчик для испытаний (только проверка, в игру не вставляется). Подключается тестовой копией: tools/bt/test.py.
   Гонка на доске: смотрит ближайшее препятствие и в нужный момент прыгает / пригибается / стреляет. */
window.BOT=(function(){
  const T=40, N={dir:0,jump:false,jp:false,ab:false,ap:false,fire:false,use:false,nx:false};
  const G=2200*1.45, JV=760;
  let cur=[Object.assign({},N),Object.assign({},N)], jt=[0,0];
  window.BOTIN=pi=>Object.assign({},cur[pi]);
  window.__noLoop=true;
  function cartIn(p,pi){
    const S=BT.S, B=S.L.bt, inp=Object.assign({},N);
    if(S.freeze>0||p.absent||p.dead||p.down) return inp;
    if(jt[pi]>0){ jt[pi]--; inp.jump=true; }
    const v=Math.max(S.v,200), cx=p.x+p.w/2, L=v*2*JV/G;
    const o=B.obs.concat(S.dyn||[]).filter(o=>(o.x1+1)*T+p.w>cx).sort((a,b)=>a.x0-b.x0)[0]; if(!o) return inp;
    const x0=o.x0*T, x1=(o.x1+1)*T;
    if(o.t==='duck'){ if(cx>x0-90&&cx<x1+p.w+6) inp.ab=true; return inp; }
    if(o.t==='shoot'){ inp.fire=true; return inp; }
    if(!(p.onGround||p.wasGround)) return inp;
    if(o.ramp){ if(cx>=x0+10&&cx<=x0+4*T-10){ inp.jump=true; inp.jp=true; jt[pi]=8; } return inp; }
    const xt=Math.min((x0+x1)/2-L/2,x0+4);
    if(cx>=xt&&cx<x1){ inp.jump=true; inp.jp=true; jt[pi]=8; }
    return inp;
  }
  function play(kind,maxSec,tr){
    BT.S.log=[]; const P=players, log=[]; let f=0, hp0=P.map(p=>p.hp), t0=levelTime;
    const B=BT.S.L.bt, maxF=Math.round((maxSec||150)*60);
    for(;f<maxF;f++){
      if(state!=='play') break;
      for(let i=0;i<2;i++) cur[i]=(kind==='cart')?cartIn(P[i],i):Object.assign({},N);
      __T.step(1/60);
      if(tr){ const q=P[tr.pi], x=q.x/T; if(x>tr.lo&&x<tr.hi) (BOT.tr=BOT.tr||[]).push([f,+x.toFixed(2),Math.round(q.y),Math.round(q.vy),Math.round(BT.S.v),q.onGround?1:0,cur[tr.pi].jump?1:0]); }
      P.forEach((p,i)=>{ if(p.hp<hp0[i]){ log.push(p.kind+'@'+(p.x/T).toFixed(1)+' t='+(f/60).toFixed(1)); } hp0[i]=p.hp; });
    }
    return {crash:BT.S.log.slice(0,6),state,frames:f,sec:+(f/60).toFixed(1),hits:log,x:+(Math.max(...P.filter(p=>!p.absent).map(p=>p.x))/T).toFixed(1),fin:B.finishX||null};
  }
  return {play};
})();
