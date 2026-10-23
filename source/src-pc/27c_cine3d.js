/* ===== 3D story cutscenes (Three.js). Own WebGL canvas over the game screen; 2D captions are drawn on top. =====
   CINE3D.prologue(t) renders the prologue at time t (seconds) and returns true, or false if 3D is unavailable. */
const CINE3D=(()=>{
  const C={ok:typeof THREE!=='undefined', built:null};
  let R=null, glc=null, scene=null, cam=null, S={};
  const ease=k=>k<0?0:k>1?1:k*k*(3-2*k), lerp=(a,b,k)=>a+(b-a)*k, col=c=>new THREE.Color(c);
  function ensure(){
    if(!C.ok) return false; if(R) return true;
    try{
      glc=document.createElement('canvas'); glc.id='cv3dcine'; glc.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:none;z-index:1;pointer-events:none';
      cv.parentNode.insertBefore(glc,cv.nextSibling); cv.style.position='relative'; cv.style.zIndex='2';
      R=new THREE.WebGLRenderer({canvas:glc,antialias:true,powerPreference:'high-performance'}); R.shadowMap.enabled=true; R.shadowMap.type=THREE.PCFSoftShadowMap;
      R.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1)); R.outputEncoding=THREE.sRGBEncoding;
      glc.addEventListener('webglcontextlost',e=>{ e.preventDefault(); C.ok=false; hide(); });
      return true;
    }catch(e){ C.ok=false; return false; }
  }
  function hide(){ if(glc) glc.style.display='none'; if(cv) cv.style.background=''; }
  C.hide=hide;
  const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:col(c),roughness:.7,metalness:.2},o));
  const add=(g,m,x,y,z,p=scene)=>{ const me=new THREE.Mesh(g,m); me.position.set(x,y,z); me.castShadow=true; me.receiveShadow=true; p.add(me); return me; };
  // ---------- heroes ----------
  function makeSpark(){ const g=new THREE.Group();
    const body=add(new THREE.SphereGeometry(16,24,18),mat('#ff8a3d',{roughness:.5}),0,18,0,g); body.scale.set(1,1.15,.9);
    add(new THREE.SphereGeometry(10,18,14),mat('#ffc08a',{roughness:.6}),0,13,7,g).scale.set(1,1.1,.6);
    for(const s of [-1,1]){ add(new THREE.SphereGeometry(4.2,14,12),mat('#ffffff',{roughness:.3}),s*6,24,12,g); add(new THREE.SphereGeometry(2.2,10,8),mat('#2a1308'),s*6,24,15.5,g);
      add(new THREE.CylinderGeometry(1.6,1.6,8,8),mat('#8a3f14'),s*6,3,0,g); }
    const flame=add(new THREE.ConeGeometry(9,24,18),new THREE.MeshBasicMaterial({color:col('#ffd166')}),0,46,0,g); flame.castShadow=false;
    const core=add(new THREE.ConeGeometry(4.5,14,12),new THREE.MeshBasicMaterial({color:col('#fff3c4')}),0,42,2,g); core.castShadow=false;
    const light=new THREE.PointLight(0xff9a3d,2.2,420,1.8); light.position.set(0,40,10); light.castShadow=false; g.add(light);
    g.userData={flame,core,light}; return g; }
  function makeBolt(){ const g=new THREE.Group();
    add(new THREE.BoxGeometry(36,44,28),mat('#62c7c1',{metalness:.45,roughness:.35}),0,30,0,g);
    add(new THREE.BoxGeometry(26,16,2),mat('#0e1a24',{roughness:.2}),0,36,14.5,g);
    const eyes=[]; for(const s of [-1,1]) eyes.push(add(new THREE.BoxGeometry(6,8,1),new THREE.MeshBasicMaterial({color:col('#9ff6ff')}),s*6,36,15.8,g));
    add(new THREE.BoxGeometry(30,6,24),mat('#c7d3dd',{metalness:.6,roughness:.3}),0,55,0,g); add(new THREE.BoxGeometry(14,5,14),mat('#c7d3dd',{metalness:.6,roughness:.3}),0,60,0,g);
    for(const s of [-1,1]){ add(new THREE.CylinderGeometry(3.5,3.5,10,10),mat('#2f6b67'),s*9,4,0,g); add(new THREE.SphereGeometry(4,10,8),mat('#c7d3dd',{metalness:.6}),s*23,26,0,g); }
    g.userData={eyes}; return g; }
  // ---------- bosses (stylised) ----------
  function eyeGlow(p,x,y,z,r){ const m=add(new THREE.SphereGeometry(r,14,10),new THREE.MeshBasicMaterial({color:col('#ff3b3b')}),x,y,z,p); m.castShadow=false; return m; }
  function makeGuard(type){ const g=new THREE.Group(), eyes=[];
    if(type==='toad'){ add(new THREE.SphereGeometry(60,28,18,0,Math.PI*2,0,Math.PI/2),mat('#3d6b34',{roughness:.6}),0,0,0,g).scale.set(1.2,.9,1); add(new THREE.BoxGeometry(150,14,100),mat('#5a6474',{metalness:.6}),0,6,0,g);
      for(const s of [-1,1]){ add(new THREE.SphereGeometry(18,16,12),mat('#3d6b34'),s*34,58,20,g); eyes.push(eyeGlow(g,s*34,60,36,6)); } }
    else if(type==='gear'){ const t=add(new THREE.TorusGeometry(48,14,12,24),mat('#b8862e',{metalness:.7,roughness:.35}),0,62,0,g); g.userData.spin=t; for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; const tooth=add(new THREE.BoxGeometry(14,16,22),mat('#b8862e',{metalness:.7}),Math.cos(a)*62,Math.sin(a)*62,0,t); tooth.rotation.z=a; tooth.userData.a=a; }
      for(const s of [-1,1]) eyes.push(eyeGlow(g,s*14,66,10,6)); }
    else if(type==='eye'){ add(new THREE.SphereGeometry(50,28,20),mat('#2b2f3a',{metalness:.5,roughness:.3}),0,90,0,g); eyes.push(eyeGlow(g,0,90,46,14)); add(new THREE.CylinderGeometry(6,10,60,10),mat('#3a3f4a',{metalness:.6}),0,30,0,g); }
    else { add(new THREE.SphereGeometry(55,24,16),mat('#6a2448',{roughness:.5}),0,40,0,g).scale.set(1.3,.7,1); add(new THREE.SphereGeometry(24,18,14),mat('#7a2c55'),0,86,0,g);
      for(let i=0;i<5;i++){ const c=add(new THREE.ConeGeometry(5,18,8),mat('#ffd166',{metalness:.8,roughness:.2}),(i-2)*8,112,0,g); c.castShadow=false; }
      for(const s of [-1,1]) eyes.push(eyeGlow(g,s*9,88,21,4.5)); }
    g.userData.eyes=eyes; return g; }
  // ---------- the scene ----------
  function build(){
    scene=new THREE.Scene(); scene.background=col('#05070d'); scene.fog=new THREE.Fog(0x05070d,500,2600);
    cam=new THREE.PerspectiveCamera(40,VW/VH,5,8000);
    S.hemi=new THREE.HemisphereLight(0x7d93c8,0x120c1a,.35); scene.add(S.hemi);
    S.moon=new THREE.DirectionalLight(0x9db8ff,.55); S.moon.position.set(-500,900,600); S.moon.castShadow=true; S.moon.shadow.mapSize.set(2048,2048);
    const sc=S.moon.shadow.camera; sc.left=-900; sc.right=900; sc.top=900; sc.bottom=-300; sc.near=10; sc.far=3000; S.moon.shadow.bias=-.0006; scene.add(S.moon);
    // floor + walls
    const floor=add(new THREE.PlaneGeometry(4000,3000),mat('#151a26',{roughness:.85,metalness:.1}),0,0,0); floor.rotation.x=-Math.PI/2; floor.castShadow=false;
    const grid=new THREE.GridHelper(4000,80,0x2a3550,0x1a2132); grid.position.y=.5; grid.material.opacity=.35; grid.material.transparent=true; scene.add(grid);
    const back=add(new THREE.PlaneGeometry(4000,1600),mat('#0c1120',{roughness:.95}),0,800,-900); back.castShadow=false;
    // skylight window with rain
    add(new THREE.BoxGeometry(520,10,10),mat('#2a3142'),0,980,-880); add(new THREE.BoxGeometry(10,300,10),mat('#2a3142'),0,830,-880);
    const win=add(new THREE.PlaneGeometry(500,290),new THREE.MeshBasicMaterial({color:col('#1a2a4a')}),0,830,-890); win.castShadow=false; S.win=win;
    // machines, workbench, shelves
    const M=(x,z,w,h,d,c)=>add(new THREE.BoxGeometry(w,h,d),mat(c||'#232b3d',{metalness:.5,roughness:.45}),x,h/2,z);
    M(-620,-300,180,220,140); M(-420,-420,120,160,120,'#2b3247'); M(620,-320,200,260,160); M(840,-160,120,150,120,'#2b3247'); M(-760,120,160,120,120,'#262d40');
    M(-560,260,260,70,90,'#3a2c22'); // workbench
    S.welder=M(-620,260,60,50,50,'#4a5160'); // welding machine on the bench
    for(const [x,z] of [[-420,-80],[230,330],[420,-60]]){ const l=new THREE.PointLight(0xffd29a,0,500,1.8); l.position.set(x,420,z); scene.add(l); add(new THREE.ConeGeometry(30,24,16,1,true),mat('#2a3142',{side:THREE.DoubleSide}),x,440,z); (S.lamps=S.lamps||[]).push(l); }
    // the Main Mechanism
    const mech=new THREE.Group(); mech.position.set(0,0,-600); scene.add(mech); S.mech=mech;
    add(new THREE.CylinderGeometry(220,260,120,8),mat('#1e2230',{metalness:.6,roughness:.4}),0,60,0,mech);
    const ring=new THREE.Group(); ring.position.set(0,420,0); mech.add(ring); S.ring=ring;
    add(new THREE.TorusGeometry(230,40,16,48),mat('#3a2a2a',{metalness:.7,roughness:.35}),0,0,0,ring);
    for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, tooth=add(new THREE.BoxGeometry(50,60,70),mat('#3a2a2a',{metalness:.7,roughness:.35}),Math.cos(a)*280,Math.sin(a)*280,0,ring); tooth.rotation.z=a; }
    const disc=add(new THREE.CylinderGeometry(150,150,60,32),mat('#0b0d14',{metalness:.4}),0,420,0,mech); disc.rotation.x=Math.PI/2; disc.visible=false; ring.visible=false;
    S.mEyes=[eyeGlow(mech,-55,440,34,22),eyeGlow(mech,55,440,34,22)]; S.mEyes.forEach(e=>{ e.material.color=col('#330808'); e.visible=false; });
    S.mLight=new THREE.PointLight(0xff2030,0,1600,1.5); S.mLight.position.set(0,440,140); mech.add(S.mLight);
    // lightning
    S.flash=new THREE.PointLight(0xdfeaff,0,4000,1); S.flash.position.set(0,1100,-500); scene.add(S.flash);
    const bolt=new THREE.Mesh(new THREE.CylinderGeometry(6,6,600,6),new THREE.MeshBasicMaterial({color:0xeaf2ff,transparent:true,opacity:0})); bolt.position.set(30,950,-600); scene.add(bolt); S.bolt=bolt;
    // red waves
    S.waves=[0,1,2].map(()=>{ const w=new THREE.Mesh(new THREE.RingGeometry(1,1.06,64),new THREE.MeshBasicMaterial({color:0xff3344,transparent:true,opacity:0,side:THREE.DoubleSide})); w.rotation.x=-Math.PI/2; w.position.set(0,3,-600); scene.add(w); return w; });
    // guards
    S.guards=[['toad',-430,40],['gear',-200,-180],['eye',220,-180],['queen',450,40]].map(([t,x,z])=>{ const g=makeGuard(t); g.position.set(x,-200,z); g.lookAt(0,0,400); g.visible=false; scene.add(g); return g; });
    // heroes
    S.spark=makeSpark(); scene.add(S.spark); S.boltH=makeBolt(); scene.add(S.boltH);
    // rain
    const rg=new THREE.BufferGeometry(), N=900, pos=new Float32Array(N*6); for(let i=0;i<N;i++){ const x=(Math.random()-.5)*3000, y=Math.random()*1400, z=(Math.random()-.5)*2000; pos.set([x,y,z,x-6,y-30,z],i*6); }
    rg.setAttribute('position',new THREE.BufferAttribute(pos,3)); S.rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0x8fb0e0,transparent:true,opacity:.35})); scene.add(S.rain);
    // sparks particles from the welder
    const sg=new THREE.BufferGeometry(); S.spN=60; S.spP=new Float32Array(S.spN*3); S.spV=[]; for(let i=0;i<S.spN;i++){ S.spV.push([0,-999,0,0]); }
    sg.setAttribute('position',new THREE.BufferAttribute(S.spP,3)); S.sparks=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffd166,size:6,transparent:true,opacity:.95})); scene.add(S.sparks);
    C.built=true;
  }
  // camera keyframes: [t, camX,camY,camZ, lookX,lookY,lookZ]
  const KEYS=[[0,0,520,1500,0,300,-500],[5.4,0,420,1000,0,380,-600],[6.6,60,380,700,0,420,-600],[9.4,0,440,420,0,430,-600],[10.5,-260,320,900,-250,80,-100],[13,260,320,900,250,80,-100],[16,0,300,1000,0,120,0],
    [17.4,-80,100,640,-40,40,300],[19.5,30,90,600,0,40,300],[21.4,0,140,760,0,60,300],[24.5,0,250,1000,0,170,-600],[30,0,230,900,0,210,-600]];
  function camAt(t){ let i=0; while(i<KEYS.length-2&&t>KEYS[i+1][0]) i++; const a=KEYS[i], b=KEYS[i+1], k=ease((t-a[0])/(b[0]-a[0]));
    return [1,2,3,4,5,6].map(j=>lerp(a[j],b[j],k)); }
  let lastT=0;
  C.prologue=function(t){
    if(!ensure()) return false;
    try{
      if(!C.built) build();
      const dt=Math.max(0,Math.min(.05,t-lastT)); lastT=t;
      // size
      const w=glc.clientWidth|0, h=glc.clientHeight|0; if(w&&h&&(glc.width!==Math.round(w*R.getPixelRatio())||glc.height!==Math.round(h*R.getPixelRatio()))){ R.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix(); }
      glc.style.display='block';
      const awake=ease((t-6.2)/1.2);
      // rain & window
      S.rain.visible=t<10; const rp=S.rain.geometry.attributes.position; for(let i=0;i<rp.count;i+=2){ let y=rp.getY(i)-dt*1400; if(y<0) y+=1400; rp.setY(i,y); rp.setY(i+1,y-30); } rp.needsUpdate=true;
      // lightning
      const fl=t>5.6&&t<6.4?(Math.sin(t*60)*.5+.5):0; S.flash.intensity=fl*6; S.bolt.material.opacity=fl; S.win.material.color=col(fl>.3?'#cfe0ff':'#1a2a4a');
      // mechanism wakes
      S.ring.rotation.z=-t*.25*awake; const eg=awake*(.6+.4*Math.sin(t*6)); S.mEyes.forEach(e=>e.material.color.setRGB(.2+.8*eg,.03+.1*eg,.03)); S.mLight.intensity=3.2*awake*(.7+.3*Math.sin(t*6));
      S.hemi.color.setRGB(.49+.4*awake*.3,.58-.3*awake,.78-.4*awake);
      S.lamps.forEach((l,i)=>l.intensity=t>16?Math.min(1.4,(t-16-i*.3)*1.2)*(Math.sin(t*13+i*5)>.97?.3:1):0);
      // red waves
      S.waves.forEach((w,i)=>{ if(t>9.5&&t<16){ const r=((t-9.5)*420+i*360)%1300; w.scale.set(r,r,r); w.material.opacity=.7*(1-r/1300); } else w.material.opacity=0; });
      // guards rise
      S.guards.forEach((g,i)=>{ const k=ease((t-10.3-i*.9)/1); g.visible=false; (S.gk=S.gk||[])[i]=k>0&&t<17?k:0; g.position.y=-200+200*k; const eye=g.userData.eyes; eye.forEach(e=>e.material.color.setRGB(1,.25,.2)); if(g.userData.spin) g.userData.spin.rotation.z=t*1.5; });
      // shake on awakening / waves
      const shk=(t>6.2&&t<7.4?8:0)+(t>9.5&&t<10.2?6:0);
      // heroes
      const sp=S.spark, bo=S.boltH; sp.visible=t>16; bo.visible=false; sp.traverse(o=>{ if(o.isMesh) o.visible=false; });
      const sy=t<17.4?lerp(170,0,ease((t-16)/1.4)):0; sp.position.set(-45,sy+(t>17.4?Math.abs(Math.sin(t*3))*3:0),300); sp.rotation.y=t<21?.3:Math.PI*0.9;
      const fu=sp.userData; fu.flame.scale.set(1+Math.sin(t*20)*.12,1+Math.sin(t*17)*.2,1); fu.core.scale.y=1+Math.sin(t*23)*.25; fu.light.intensity=2+Math.sin(t*19)*.4;
      const bx=t<19?lerp(320,45,ease((t-17)/2)):45; bo.position.set(bx,0+(t<19?Math.abs(Math.sin(t*9))*4:0),300); bo.rotation.y=t<19?-Math.PI/2:t<21?-.4:Math.PI; bo.userData.eyes.forEach(e=>e.scale.y=(t%3.1)<.12?.15:1);
      // welder sparks while Spark is born
      for(let i=0;i<S.spN;i++){ const v=S.spV[i]; if(t>15.6&&t<17.6&&v[1]<0&&Math.random()<.3){ v[0]=-45;v[1]=170;v[2]=300; v[3]=0; v.vx=(Math.random()-.5)*300; v.vy=Math.random()*250; v.vz=(Math.random()-.5)*200; }
        if(v[1]>=0){ v.vy-=900*dt; v[0]+=v.vx*dt; v[1]+=v.vy*dt; v[2]+=v.vz*dt; } S.spP.set([v[0],v[1],v[2]],i*3); } S.sparks.geometry.attributes.position.needsUpdate=true;
      // camera
      const c=camAt(t); cam.position.set(c[0]+(Math.random()-.5)*shk,c[1]+(Math.random()-.5)*shk,c[2]); cam.lookAt(c[3],c[4],c[5]);
      R.render(scene,cam);
      // 2D actors: where to draw the game's own sprites over the 3D world
      cam.updateMatrixWorld(); const pr=(x,y,z,hgt)=>{ const v=new THREE.Vector3(x,y,z).project(cam), v2=new THREE.Vector3(x,y+hgt,z).project(cam); return {x:(v.x*.5+.5)*VW,y:(-v.y*.5+.5)*VH,px:Math.abs(v2.y-v.y)*.5*VH,front:v.z<1}; };
      const A=[]; const mp=S.mech.position; A.push(Object.assign({kind:'core',k:1,awake},pr(mp.x,150,mp.z,520)));
      S.guards.forEach((g,i)=>{ if(S.gk[i]>0) A.push(Object.assign({kind:'boss',type:['toad','gear','eye','queen'][i],k:S.gk[i]},pr(g.position.x,0,g.position.z,140))); });
      if(t>16) A.push(Object.assign({kind:'spark',k:1,face:1},pr(sp.position.x,sp.position.y,sp.position.z,48)));
      if(t>17) A.push(Object.assign({kind:'bolt',k:1,face:t<19?-1:-1,walk:t<19},pr(bo.position.x,bo.position.y,bo.position.z,62)));
      C.actors=A.sort((a,b)=>b.px-a.px).reverse(); return true;
    }catch(e){ console.error('cine3d',e); C.ok=false; hide(); return false; }
  };
  return C;
})();
