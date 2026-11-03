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
  // колесо на проводе: заранее уходим на свободный провод
  function wireIn(p,pi){
    const S=BT.S,B=S.L.bt,W=p.wire,inp=Object.assign({},N); if(p.absent||p.down) return inp; if(!W){ inp.dir=1; return inp; } if(S.freeze>0) return inp;
    const v=Math.max(S.v,200), obs=B.obs.filter(o=>!o.dead&&o.x*T+44>p.x).sort((a,b)=>a.x-b.x), o=obs[0], o2=obs[1];
    let want=W.lane;
    if(o&&(o.x*T-(p.x+p.w))/v<0.8){
      const fr=[0,1,2].filter(l=>!o.lanes.includes(l)), both=o2&&(o2.x*T-(p.x+p.w))/v<1.3?fr.filter(l=>!o2.lanes.includes(l)):fr, pool=both.length?both:fr;
      if(!pool.includes(W.lane)||!fr.includes(W.lane)){ pool.sort((a,b)=>Math.abs(a-W.lane)-Math.abs(b-W.lane)); want=pool[0]; }
    }
    if(want<W.lane){ inp.jump=true; inp.jp=true; } else if(want>W.lane){ inp.ab=true; inp.ap=true; }
    return inp;
  }
  // лабиринт: рычаги → лифты → выход; прыгает через шипы, Болт бьёт смэшем охотника рядом, Искра стреляет в сторону охотника
  const MZ=[{t:'plate',x:43.5,k:0},{t:'lift',m:0,xc:8.5,bot:25,top:17,off:13.5},{t:'plate',x:25.5,k:1},{t:'lift',m:1,xc:39.5,bot:17,top:9,off:36},{t:'plate',x:22.5,k:2},{t:'exit',x:2.5}];
  const ms=[{i:0},{i:0}];
  function mazeIn(p,pi){
    const S=BT.S,B=S.L.bt,inp=Object.assign({},N); if(p.absent||p.down||p.dead) return inp;
    const st=ms[pi], tk=MZ[Math.min(st.i,MZ.length-1)], c=(p.x+p.w/2)/T; let tx=tk.x;
    if(tk.t==='lift'){ const m=movers[tk.m]; tx=tk.xc;
      if(st.ph==='off'){ tx=tk.off; if(Math.abs(c-tx)<0.5){ st.i++; st.ph=null; } }
      else if(p.ground===m){ tx=tk.xc; if(m.y<=tk.top*T+3){ st.ph='off'; } }
    } else if(tk.t==='plate'&&B.plates[tk.k].on){ st.i++; return inp; }
    const dx=tx-c; if(Math.abs(dx)>0.15) inp.dir=dx>0?1:-1;
    // шипы впереди
    if(inp.dir&&p.onGround){ const ty=Math.floor((p.y+p.h-2)/T); for(let k=0;k<3;k++){ const x=Math.floor(c+inp.dir*(0.4+k*0.8)); if(grid[ty]&&grid[ty][x]==='^'&&k<2){ inp.jump=true; inp.jp=true; jt[pi]=8; break; } } }
    if(jt[pi]>0){ jt[pi]--; inp.jump=true; }
    // охотник
    const h=S.hunt; if(h&&h.stun<=0){ const d=Math.hypot(p.x+p.w/2-h.x,p.y+p.h/2-h.y);
      if(p.kind==='bolt'&&d<115&&p.onGround&&(p.smashCd||0)<=0){ inp.ap=true; inp.ab=true; }
      if(p.kind==='spark'&&d<340){ inp.fire=true; if(Math.abs(h.x-(p.x+p.w/2))>30&&!inp.dir) inp.dir=h.x>p.x?1:-1; } }
    return inp;
  }
  // лёд: бежит вправо, прыгает через шипы и ямы, у широкой ямы ждёт льдину и тормозит заранее (лёд скользкий)
  function iceIn(p,pi){
    const S=BT.S,B=S.L.bt,inp=Object.assign({},N); if(p.absent||p.down||p.dead) return inp;
    const IFL=14, cx=p.x+p.w/2, c=Math.floor(cx/T), A=[900,520,380,260][Math.max(-1,Math.min(2,diffLv()))+1], front=p.x+p.w;
    if(jt[pi]>0){ jt[pi]--; inp.jump=true; }
    const gnd=p.onGround||p.wasGround, vx=Math.max(0,p.vx);
    if(c>=B.finishX-3){ const tx=(p.kind==='spark'?B.finishX+0.8:B.finishX+2.1)*T, dx=tx-cx; inp.dir=Math.abs(dx)<5?0:Math.sign(dx); return inp; }   // в выходе встаём на своё место
    const fl=B.floes.find(f=>cx<(f.x1+1)*T);
    if(fl&&c>=fl.x0-1&&cx<(fl.x1+1)*T){            // на льдине или на самом краю ямы
      const m=movers[fl.m];
      if(p.ground===m){ inp.dir=(m.x+m.w>=(fl.x1+1)*T-4)?1:0; return inp; }
      if(cx<fl.x0*T){ const d=fl.x0*T-front-4;
        if(m.x<fl.x0*T+4){ inp.dir=1; return inp; }
        inp.dir=(vx*vx/(2*A)>=d-6||d<6)?0:1; if(d<0&&vx>40) inp.dir=-1; return inp; }
    }
    if(fl&&c<fl.x0-1&&(fl.x0-c)<10){               // подходим к широкой яме: сбрасываем скорость заранее
      const d=fl.x0*T-front-4; inp.dir=(vx*vx/(2*A)>=d-6)?0:1; if(d<0) inp.dir=0; return inp; }
    inp.dir=1;
    { const o=players.find(q=>q!==p&&!q.absent&&!q.dead&&!q.down); if(gnd&&p.kind==='spark'&&o&&o.kind==='bolt'&&o.x>p.x&&o.x-p.x<4.5*T) inp.dir=0; }   // Искра быстрее — не наезжаем на Болта
    if(!gnd){   // в воздухе: если приземлимся в опасность — убираем направление, скорость падает
      const G0=2200, hh=IFL*T-(p.y+p.h), tl=hh<=0?0:(-p.vy+Math.sqrt(p.vy*p.vy+2*G0*hh))/G0, lx=front+vx*tl;
      for(let k=0;k<=10;k++){ const x=c+k, bad=(grid[IFL-1]&&grid[IFL-1][x]==='^')||(grid[IFL]&&grid[IFL][x]==='.'&&!B.floes.some(f=>x>=f.x0&&x<=f.x1)); if(!bad) continue;
        let e=x; while(grid[IFL-1]&&(grid[IFL-1][e+1]==='^'||(grid[IFL][e+1]==='.'))) e++;
        if(x*T-front>1.7*T&&lx>x*T-10&&lx<(e+1)*T+p.w+12) inp.dir=0; break; }
      return inp; }
    for(let k=1;k<=9;k++){ const x=c+k, spike=grid[IFL-1]&&grid[IFL-1][x]==='^', pit=grid[IFL]&&grid[IFL][x]==='.'&&!B.floes.some(f=>x>=f.x0&&x<=f.x1);
      if(!spike&&!pit) continue;
      const d=x*T-front;
      if(d<=(pit?10+vx*0.05:16+vx*0.10)){ inp.jump=true; inp.jp=true; jt[pi]=22; }
      break; }
    return inp;
  }
  // вращающаяся комната (барабан): прыгает через шипы, широкие ряды проезжает на платформе, не прыгает под лопастью
  function rotIn(p,pi){
    const S=BT.S,inp=Object.assign({},N); if(p.absent||p.down||p.dead||!S.arm) return inp;
    const v=S.rv||0, sg=Math.sign(v)||1, cx=p.x+p.w/2, E=window.BT_ROT;
    if(S.opened){ const tx=24.6*T+(p.kind==='bolt'?30:0)-p.w/2; inp.dir=Math.abs(tx-cx)<6?0:Math.sign(tx-cx); return inp; }
    const onPl=p.ground&&p.ground.kind==='mover';
    if(onPl){ inp.dir=sg; return inp; }   // на платформе идём против хода — платформа уезжает из-под ног уже за шипами
    let tt=9, wide=false;
    E.SP.forEach((g,i)=>{ if(S.arm[i]<1) return; const x=E.X(g.s,S.off), x1=x+g.n*T; const d=sg>0?(x-(p.x+p.w)):(p.x-x1); if(d<-g.n*T) return; const t=Math.max(0,d)/Math.max(30,Math.abs(v)); if(t<tt){ tt=t; wide=g.n>=5; } });
    let pt=9; E.PL.forEach((pl,i)=>{ if(S.parm[i]<1) return; const x=E.X(pl.s,S.off), x1=x+pl.w*T; const d=sg>0?(x-(p.x+p.w)):(p.x-x1); if(d<-20) return; pt=Math.min(pt,Math.max(0,d)/Math.max(30,Math.abs(v))); });
    const a=E.A(cx), bl=S.bladeA; let near=false; if(S.rtm>=34) for(const b of [bl,bl+Math.PI]){ const d=((a-b)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI; if(d>-.18&&d<.62) near=true; }   // лопасть пройдёт над героем в ближайшие ~0.6 с
    if(wide&&pt<.12&&p.onGround&&!near){ inp.jump=inp.jp=true; jt[pi]=10; return inp; }
    if(near&&tt<.6&&p.onGround){ inp.dir=-sg; return inp; }   // под лопастью не прыгаем — отходим вместе с ободом
    if(!wide&&tt<.16&&p.onGround&&!near){ inp.jump=inp.jp=true; jt[pi]=14; inp.dir=sg; return inp; }
    if(jt[pi]>0){ jt[pi]--; inp.jump=true; inp.dir=sg; return inp; }
    if(!p.onGround&&!onPl){ let over=false; E.SP.forEach((g,i)=>{ if(S.arm[i]<1) return; const x=E.X(g.s,S.off); if(p.x<x+g.n*T+4&&p.x+p.w>x-4) over=true; }); inp.dir=over?sg:0; return inp; }   // в воздухе: пока над шипами — против хода, потом не бежим
    const home=640+(p.kind==='bolt'?50:-50); if(tt>.3){ const lo=Math.min(cx,home)-50, hi=Math.max(cx,home)+50; const blk=E.SP.some((g,i)=>{ if(S.arm[i]<1) return false; const x=E.X(g.s,S.off); return x<hi&&x+g.n*T>lo; }); if(!blk) inp.dir=Math.abs(home-cx)<20?0:Math.sign(home-cx); }
    return inp;
  }
  function magIn(p,pi){
    const S=BT.S, B=S.L.bt, inp=Object.assign({},N); if(S.freeze>0||p.absent||p.dead||p.down||!p.mag) return inp; inp.dir=1;
    const M=p.mag, cx=p.x+p.w/2; let tg=null; for(const sg of B.segs){ if(sg.need===0) continue; if(sg.x1*T+T>p.x&&sg.x0*T-cx<(window.MAGLA||110)){ tg=sg.need; break; } }
    if(p.x>B.finishX*T-T) tg=1;
    if(tg!=null&&M.g!==tg&&M.cd<=0) inp.ap=true;
    for(const q of B.saws){ const dx=q.x-cx; if(dx<-30||dx>110) continue; const py=p.y+p.h/2; let danger=false;
      for(let k=0;k<=8;k++){ const tt=S.lt+k*0.06, y=q.mid+q.A*Math.sin(tt*6.2832/q.per+q.ph), xx=cx+235*k*0.06; if(Math.abs(xx-q.x)<16+p.w/2+6&&Math.abs(y-py)<16+p.h/2+8){ danger=true; break; } }
      if(danger&&dx>12) inp.dir=0; }
    return inp;
  }
  function play(kind,maxSec,tr){
    BT.S.log=[]; const P=players, log=[]; let f=0, hp0=P.map(p=>p.hp), t0=levelTime;
    const B=BT.S.L.bt, DT=window.__DT||1/60, maxF=Math.round((maxSec||150)/DT);   // __DT — шаг кадра (проверка на высоком FPS)
    for(;f<maxF;f++){
      if(state!=='play') break;
      for(let i=0;i<2;i++) cur[i]=(kind==='cart')?cartIn(P[i],i):(kind==='wire')?wireIn(P[i],i):(kind==='maze')?mazeIn(P[i],i):(kind==='ice')?iceIn(P[i],i):(kind==='rot')?rotIn(P[i],i):(kind==='mag')?magIn(P[i],i):Object.assign({},N);
      __T.step(DT);
      if(tr){ const q=P[tr.pi], x=q.x/T; if(x>tr.lo&&x<tr.hi) (BOT.tr=BOT.tr||[]).push([f,+x.toFixed(2),Math.round(q.y),Math.round(q.vy),Math.round(BT.S.v),q.onGround?1:0,cur[tr.pi].jump?1:0]); }
      P.forEach((p,i)=>{ if(p.hp<hp0[i]){ log.push(p.kind+'@'+(p.x/T).toFixed(1)+' t='+(f/60).toFixed(1)); } hp0[i]=p.hp; });
    }
    return {crash:BT.S.log.slice(0,6),state,frames:f,sec:+(f/60).toFixed(1),hits:log,x:+(Math.max(...P.filter(p=>!p.absent).map(p=>p.x))/T).toFixed(1),fin:B.finishX||null};
  }
  return {play,ms,rotIn};
})();
