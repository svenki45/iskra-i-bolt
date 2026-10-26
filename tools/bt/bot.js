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
  // вращающаяся комната: бежит вправо, но останавливается, если на пути (по расчёту вперёд) лопасть заденет
  function rotIn(p,pi){
    const S=BT.S,B=S.L.bt,inp=Object.assign({},N); if(p.absent||p.down||p.dead) return inp;
    const cx=p.x+p.w/2, c=cx/T;
    if(c>=B.finishX-3){ const tx=(p.kind==='spark'?B.finishX+0.8:B.finishX+2.1)*T, dx=tx-cx; inp.dir=Math.abs(dx)<5?0:Math.sign(dx); return inp; }
    const v=p.kind==='spark'?290:225, y=17*T-p.h;
    const hit=(x,t)=>{ const r={x,y,w:p.w,h:p.h}; for(const m of B.mills){ const px=(m.x+0.5)*T, py=8*T, Lp=m.L*T; if(r.x+r.w<px-Lp-20||r.x>px+Lp+20) continue;
        for(let i=0;i<m.n;i++){ const a=m.ph+m.dir*m.w*(S.rt+t*S.rm)+i*Math.PI*2/m.n, ca=Math.cos(a), sa=Math.sin(a);
          for(let s=0;s<=Lp;s+=8){ const bx=px+ca*s, by=py+sa*s; if(bx>r.x-18&&bx<r.x+r.w+18&&by>r.y-18&&by<r.y+r.h+18) return true; } } } return false; };
    // считаем путь только до конца ближайшей опасной зоны (между ветряками можно стоять)
    let xEnd=1e9; for(const m of B.mills){ const dz=Math.sqrt(m.L*m.L-7.2*7.2), ze=m.x+0.5+dz; if(ze>c&&(ze+1.2)*T<xEnd) xEnd=(ze+1.2)*T; }
    let bad=false; for(let t=0;t<=7;t+=1/30){ const x=p.x+v*t; if(hit(x,t)){ bad=true; break; } if(x>=xEnd) break; }
    inp.dir=1;
    if(bad){ let here=false; for(let t=0;t<=0.5;t+=1/30){ if(hit(p.x,t)){ here=true; break; } } if(!here) inp.dir=0; }
    return inp;
  }
  function play(kind,maxSec,tr){
    BT.S.log=[]; const P=players, log=[]; let f=0, hp0=P.map(p=>p.hp), t0=levelTime;
    const B=BT.S.L.bt, maxF=Math.round((maxSec||150)*60);
    for(;f<maxF;f++){
      if(state!=='play') break;
      for(let i=0;i<2;i++) cur[i]=(kind==='cart')?cartIn(P[i],i):(kind==='wire')?wireIn(P[i],i):(kind==='maze')?mazeIn(P[i],i):(kind==='ice')?iceIn(P[i],i):(kind==='rot')?rotIn(P[i],i):Object.assign({},N);
      __T.step(1/60);
      if(tr){ const q=P[tr.pi], x=q.x/T; if(x>tr.lo&&x<tr.hi) (BOT.tr=BOT.tr||[]).push([f,+x.toFixed(2),Math.round(q.y),Math.round(q.vy),Math.round(BT.S.v),q.onGround?1:0,cur[tr.pi].jump?1:0]); }
      P.forEach((p,i)=>{ if(p.hp<hp0[i]){ log.push(p.kind+'@'+(p.x/T).toFixed(1)+' t='+(f/60).toFixed(1)); } hp0[i]=p.hp; });
    }
    return {crash:BT.S.log.slice(0,6),state,frames:f,sec:+(f/60).toFixed(1),hits:log,x:+(Math.max(...P.filter(p=>!p.absent).map(p=>p.x))/T).toFixed(1),fin:B.finishX||null};
  }
  return {play,ms};
})();
