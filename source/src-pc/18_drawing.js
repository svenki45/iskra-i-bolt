/* ================= drawing ================= */
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const isWall=(x,y)=>x<0||y<0||x>=COLS||y>=ROWS||grid[y][x]==='#'||grid[y][x]==='S'||grid[y][x]==='Z'||grid[y][x]==='Y';
function hslRgb(h,sat,l){ sat/=100; l/=100; const k=n=>(n+h/30)%12, a=sat*Math.min(l,1-l), f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1))); return [f(0),f(8),f(4)].map(v=>Math.round(v*255)).join(','); }
function levelTheme(){
  const m=solo?soloHero:'duo', n=levelIdx+1, R=rng(n*131+(m==='spark'?7:m==='bolt'?29:53));
  const base=m==='spark'?8:m==='bolt'?186:222, spread=m==='spark'?26:m==='bolt'?30:60;
  let h=(base+(R()-.5)*spread+360)%360; if(m==='duo'&&n%3===0) h=(h+40)%360;
  { const LL=getLevel(levelIdx); if(LL&&LL.hue!=null) h=LL.hue; }
  const sat=m==='bolt'?42+R()*18:50+R()*20;
  return {m,R,h,paper:`rgb(${hslRgb(h,sat,m==='spark'?11:12)})`,wall:`rgb(${hslRgb(h,sat+5,6.5)})`,grid:hslRgb(h,70,80),hatch:`rgba(${hslRgb(h,70,80)},.16)`,edge:`rgba(${hslRgb(h,80,88)},.9)`,step:R()<.3?T/3:T/2,variant:Math.floor(R()*3)};
}
function drawThemeDecor(g,TH){
  const R=TH.R, acc=(a)=>`rgba(${hslRgb(TH.h,85,65)},${a})`;
  g.save();
  if(TH.m==='spark'){
    for(let i=0;i<4;i++){ const x=R()*VW, y=VH*.5+R()*VH*.5, r=120+R()*220, gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(255,120,40,.16)'); gr.addColorStop(1,'rgba(255,120,40,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
    g.strokeStyle='rgba(255,170,90,.07)'; g.lineWidth=2;
    for(let i=0;i<7;i++){ const y0=VH*(.15+R()*.8); g.beginPath(); for(let x=0;x<=VW;x+=20){ const y=y0+Math.sin(x/(60+i*9)+i)*8; x?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
    if(TH.variant===2) for(let i=0;i<40;i++){ g.fillStyle=`rgba(255,${150+R()*80|0},80,${.15+R()*.25})`; g.beginPath(); g.arc(R()*VW,R()*VH,1+R()*2,0,Math.PI*2); g.fill(); }
  } else if(TH.m==='bolt'){
    g.strokeStyle=acc(.11); g.fillStyle=acc(.18); g.lineWidth=2;
    for(let i=0;i<14;i++){ let x=Math.round(R()*VW/20)*20, y=Math.round(R()*VH/20)*20; g.beginPath(); g.moveTo(x,y);
      for(let k=0;k<4;k++){ if(R()<.5) x+=(R()<.5?-1:1)*(40+R()*120|0); else y+=(R()<.5?-1:1)*(40+R()*100|0); g.lineTo(x,y); } g.stroke(); g.beginPath(); g.arc(x,y,4,0,Math.PI*2); g.fill(); }
    if(TH.variant!==1){ g.strokeStyle=acc(.07); for(let i=0;i<5;i++){ const x=R()*VW, y=R()*VH, r=18+R()*30; g.beginPath(); for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } g.closePath(); g.stroke(); g.beginPath(); g.arc(x,y,r*.45,0,Math.PI*2); g.stroke(); } }
  } else {
    const glow=(x,y,r,c)=>{ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,c); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); };
    glow(R()*VW*.4,R()*VH,260+R()*120,'rgba(255,138,61,.13)'); glow(VW*.6+R()*VW*.4,R()*VH,260+R()*120,'rgba(98,199,193,.14)');
    g.strokeStyle=acc(.06); g.lineWidth=1.5; g.setLineDash([3,9]);
    for(let i=0;i<4;i++){ g.beginPath(); g.arc(R()*VW,R()*VH,80+R()*200,0,Math.PI*2); g.stroke(); }
    g.setLineDash([]);
    if(TH.variant===0) for(let i=0;i<30;i++){ g.fillStyle=i%2?'rgba(255,138,61,.25)':'rgba(98,199,193,.25)'; g.beginPath(); g.arc(R()*VW,R()*VH,1.5,0,Math.PI*2); g.fill(); }
  }
  g.restore();
}

