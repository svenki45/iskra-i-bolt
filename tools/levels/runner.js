// бот-проходчик: команды по очереди, у каждой — ввод для героя и условие окончания
window.RUNLEVEL=function(cmds,opt){ opt=opt||{};
  const G=window.__T, N={dir:0,jump:false,jp:false,ab:false,ap:false,fire:false,use:false,nx:false};
  let cur=[Object.assign({},N),Object.assign({},N)];
  window.BOTIN=pi=>{ const o=Object.assign({},cur[pi]); return o; };
  window.__noLoop=true;
  const log=[]; let frames=0;
  const P=()=>G.go('players'), st=()=>G.go('state');
  const ev=e=>{ const s=P()[0], b=P()[1]; const tx=p=>(p.x+p.w/2)/40, ty=p=>(p.y+p.h)/40; return Function('s','b','tx','ty','return ('+e+')')(s,b,tx,ty); };
  for(let ci=0;ci<cmds.length;ci++){ const c=cmds[ci]; const max=c.frames||(c.until?900:1); let ok=!c.until, f=0;
    for(;f<max;f++){
      if(st()!=='play') break;
      cur=[Object.assign({},N),Object.assign({},N)];
      const set=(pi,cc)=>{ const I=cur[pi]; I.dir=cc.dir||0; I.jump=!!cc.jump; I.fire=!!cc.fire; I.ab=!!cc.ab; I.jp=!!(cc.jp&&f===0); I.ap=!!(cc.ap&&f===0); if(cc.jp&&f===0) I.jump=true; };
      set(c.p||0,c);
      if(c.also) set(c.also.p,c.also);
      const pre=P().map(p=>[p.x,p.y,p.absent]);
      G.step(1/60); frames++;
      const post=P(); for(let i=0;i<2;i++){ if(pre[i][2]||post[i].absent) continue; const d=Math.hypot(post[i].x-pre[i][0],post[i].y-pre[i][1]); if(d>120&&!post[i].dead&&!post[i].down){ window.__tele=(window.__tele||[]); window.__tele.push({i,frames,from:[+(pre[i][0]/40).toFixed(1),+(pre[i][1]/40).toFixed(1)],to:[+(post[i].x/40).toFixed(1),+(post[i].y/40).toFixed(1)]}); } }
      if(c.until&&ev(c.until)){ ok=true; f++; break; }
    }
    const s=P(); log.push({i:ci,ok,f,state:st(),pos:s.map(p=>[+((p.x+p.w/2)/40).toFixed(2),+((p.y+p.h)/40).toFixed(2),p.hp,p.keys||0])});
    if(!ok||st()!=='play') break;
  }
  // дожать ещё немного кадров для выхода
  cur=[Object.assign({},N),Object.assign({},N)];
  for(let k=0;k<120&&st()==='play';k++){ G.step(1/60); frames++; }
  return {state:st(),frames,log,tele:window.__tele||[]};
};
