/* ===== 2.5D renderer prototype (Three.js) — draws the world in 3D under the 2D canvas.
   Game logic is untouched: this only reads grid/players/enemies/boss/crates/movers each frame. ===== */
const R3D=(()=>{
  const R={on:true, ready:false};
  if(typeof THREE==='undefined') { R.on=false; return R; }
  let renderer, scene, cam, glc, backMat, backTex, lightDir, sparkLight, hemi;
  let tileKey='', tileGroup=null, lastLevel=-1, lastStaticGen=-1;
  const FOV=38, DEPTH=T*1.5, FRONT=T*0.45, CZ=0;   // blocks span z∈[FRONT-DEPTH,FRONT]; characters (2D overlay) live at z=0, in the middle of the floor          // blocks span z∈[-DEPTH,0]; characters stand at z=CZ
  const DIST=(VH/2)/Math.tan(FOV*Math.PI/360);   // camera distance so plane z=0 covers 1280×720 exactly
  const pool={en:[],crate:[],mover:[]};
  let sparkG, boltG, bossG=null, bossType='';
  const col=c=>new THREE.Color(c);
  function init(){
    glc=document.createElement('canvas'); glc.id='cv3d';
    glc.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block';
    cv.parentNode.insertBefore(glc,cv); cv.style.position='relative'; cv.style.background='transparent';
    renderer=new THREE.WebGLRenderer({canvas:glc,antialias:true,alpha:false,powerPreference:'high-performance'});
    glc.addEventListener('webglcontextlost',e=>{ e.preventDefault(); R.fail('WebGL context lost'); });
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
    scene=new THREE.Scene();
    cam=new THREE.PerspectiveCamera(FOV,VW/VH,10,6000);
    hemi=new THREE.HemisphereLight(0xcfe0ff,0x2a2040,0.9); scene.add(hemi);
    lightDir=new THREE.DirectionalLight(0xfff1dc,0.85); lightDir.position.set(VW*0.25,-VH*0.1+900,900); lightDir.target.position.set(VW/2,-VH/2,0);
    lightDir.castShadow=true; lightDir.shadow.mapSize.set(window.MOBILE_BUILD?1024:2048,window.MOBILE_BUILD?512:1024); renderer.setPixelRatio(1);
    const sc=lightDir.shadow.camera; sc.left=-VW*0.8; sc.right=VW*0.8; sc.top=VH*0.9; sc.bottom=-VH*0.9; sc.near=100; sc.far=3000; lightDir.shadow.bias=-0.0008;
    scene.add(lightDir); scene.add(lightDir.target);
    sparkLight=new THREE.PointLight(0xff9a3d,1.3,420,1.6); scene.add(sparkLight);
    backTex=new THREE.CanvasTexture(staticLayer);
    backMat=new THREE.MeshBasicMaterial({map:backTex});
    const k=(DIST+DEPTH)/DIST*1.15;
    const back=new THREE.Mesh(new THREE.PlaneGeometry(VW*k*1.02,VH*k*1.02),backMat); back.position.set(VW/2,-VH/2,FRONT-DEPTH-1); back.receiveShadow=false; scene.add(back); R.back=back;
    // shadow catcher on the back wall
    const sh=new THREE.Mesh(new THREE.PlaneGeometry(VW*k,VH*k),new THREE.ShadowMaterial({opacity:.35})); sh.position.set(VW/2,-VH/2,FRONT-DEPTH+0.5); sh.receiveShadow=true; scene.add(sh); R.sh=sh;
    sparkG=makeSpark(); boltG=makeBolt(); scene.add(sparkG); scene.add(boltG); shadowOnly(sparkG); shadowOnly(boltG);
    R.ready=true;
  }
  // ---------- tiles ----------
  function themeCols(){ try{ const TH=arena?null:levelTheme(); if(TH){ const m=TH.wall.match(/\d+/g).map(Number); const base=new THREE.Color(m[0]/255,m[1]/255,m[2]/255); const lift=base.clone().lerp(new THREE.Color(0x9cc3ff),.22); return {wall:lift, edge:new THREE.Color(TH.edge.replace(/rgba\(([^)]+),[^,]+\)/,'rgb($1)'))}; } }catch(e){} return {wall:new THREE.Color(0x3a3150),edge:new THREE.Color(0x9cc3ff)}; }
  function buildTiles(){
    if(tileGroup){ scene.remove(tileGroup); tileGroup.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
    tileGroup=new THREE.Group(); scene.add(tileGroup);
    const C=themeCols();
    const kinds={'#':{c:C.wall,r:.8,m:.1},S:{c:C.wall,r:.8,m:.1},x:{c:C.wall.clone().lerp(new THREE.Color(0x8a6a40),.35),r:.9,m:0},Z:{c:C.wall,r:.8,m:.1},Y:{c:C.wall,r:.8,m:.1},G:{c:new THREE.Color(0x5a6b80)},D:{c:new THREE.Color(0x3a3020)},X:{c:new THREE.Color(0xb88a2e)},I:{c:new THREE.Color(0x9fe4f5),r:.15,m:.1,t:.85},K:{c:new THREE.Color(0x9a6634),r:.95,m:0}};
    const box=new THREE.BoxGeometry(T,T,DEPTH);
    for(const ch in kinds){ const list=[]; for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(grid[y][x]===ch) list.push([x,y]); if(!list.length) continue;
      const K=kinds[ch], mat=new THREE.MeshLambertMaterial({color:K.c,roughness:K.r,transparent:!!K.t,opacity:K.t||1});
      const im=new THREE.InstancedMesh(box,mat,list.length); const M=new THREE.Matrix4();
      list.forEach(([x,y],i)=>{ M.makeTranslation(x*T+T/2,-(y*T+T/2),FRONT-DEPTH/2); im.setMatrixAt(i,M); });
      im.castShadow=ch!=='I'; im.receiveShadow=true; tileGroup.add(im);
      // bright front edge outline like the 2D blueprint
      if(ch==='#'||ch==='S'||ch==='x'){ const eg=new THREE.EdgesGeometry(new THREE.BoxGeometry(T,T,2)); const lm=new THREE.LineBasicMaterial({color:C.edge,transparent:true,opacity:.18});
        for(const [x,y] of list){ const n=(dx,dy)=>{ const g=grid[y+dy]&&grid[y+dy][x+dx]; return g==='#'||g==='S'||g==='x'; }; if(n(0,-1)&&n(0,1)&&n(-1,0)&&n(1,0)) continue; const l=new THREE.LineSegments(eg,lm); l.position.set(x*T+T/2,-(y*T+T/2),FRONT); tileGroup.add(l); } } }
    // spikes
    const sp=[]; for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(grid[y][x]==='^') sp.push([x,y]);
    if(sp.length){ const cone=new THREE.ConeGeometry(T/7,T*0.58,6); const mat=new THREE.MeshLambertMaterial({color:0xff6b6b,emissive:0x400808});
      const im=new THREE.InstancedMesh(cone,mat,sp.length*6); const M=new THREE.Matrix4(); let i=0;
      for(const [x,y] of sp) for(let a=0;a<3;a++) for(let b=0;b<2;b++){ M.makeTranslation(x*T+T/6+a*T/3,-(y*T+T-T*0.29),FRONT-T*0.25-b*T*0.8); im.setMatrixAt(i++,M); }
      im.castShadow=true; tileGroup.add(im); }
  }
  // ---------- characters (drawn in 2D; 3D proxies only cast shadows) ----------
  function shadowOnly(g){ g.traverse(o=>{ if(o.material){ o.material=o.material.clone(); o.material.colorWrite=false; o.material.depthWrite=false; o.castShadow=true; } }); }
  function eyes(g,y,gap,r,z){ const w=new THREE.MeshLambertMaterial({color:0xffffff}), p=new THREE.MeshLambertMaterial({color:0x14121c});
    for(const s of [-1,1]){ const e=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),w); e.position.set(s*gap,y,z); g.add(e); const pu=new THREE.Mesh(new THREE.SphereGeometry(r*.55,12,10),p); pu.position.set(s*gap,y,z+r*.6); pu.name='pupil'; g.add(pu); } }
  function makeSpark(){ const g=new THREE.Group(), inner=new THREE.Group(); g.add(inner); g.userData.inner=inner;
    const bodyM=new THREE.MeshLambertMaterial({color:0xff8a3d,emissive:0x5a2000}); g.userData.bodyM=bodyM;
    const body=new THREE.Mesh(new THREE.SphereGeometry(12,24,18),bodyM); body.scale.set(1,1.1,1); body.castShadow=true; inner.add(body);
    const flame=new THREE.Mesh(new THREE.ConeGeometry(7,16,16),new THREE.MeshLambertMaterial({color:0xffd166,emissive:0xffa020,emissiveIntensity:1.2})); flame.position.y=17; flame.name='flame'; flame.castShadow=true; inner.add(flame);
    eyes(inner,2,5,3.2,9);
    for(const s of [-1,1]){ const leg=new THREE.Mesh(new THREE.CapsuleGeometry(2.2,5,4,8),bodyM); leg.position.set(s*5,-14,0); leg.castShadow=true; inner.add(leg); const arm=new THREE.Mesh(new THREE.CapsuleGeometry(1.8,6,4,8),bodyM); arm.position.set(s*13,-1,0); arm.rotation.z=s*.8; inner.add(arm); }
    return g; }
  function makeBolt(){ const g=new THREE.Group(), inner=new THREE.Group(); g.add(inner); g.userData.inner=inner;
    const bodyM=new THREE.MeshLambertMaterial({color:0x5fc8c0}); g.userData.bodyM=bodyM;
    const body=new THREE.Mesh(new THREE.BoxGeometry(32,40,26,2,2,2),bodyM); body.position.y=-2; body.castShadow=true; inner.add(body);
    const head=new THREE.Mesh(new THREE.CylinderGeometry(10,13,6,16),new THREE.MeshLambertMaterial({color:0xcfd8e6})); head.position.y=21; head.castShadow=true; inner.add(head);
    const visor=new THREE.Mesh(new THREE.BoxGeometry(24,11,4),new THREE.MeshLambertMaterial({color:0x10202a})); visor.position.set(0,6,13.5); inner.add(visor);
    for(const s of [-1,1]){ const e=new THREE.Mesh(new THREE.SphereGeometry(2.6,12,10),new THREE.MeshLambertMaterial({color:0x9ff6ff,emissive:0x5fe3d9,emissiveIntensity:1.4})); e.position.set(s*5,6,16); inner.add(e);
      const leg=new THREE.Mesh(new THREE.BoxGeometry(7,8,9),new THREE.MeshLambertMaterial({color:0x2d4a55})); leg.position.set(s*8,-26,0); leg.castShadow=true; inner.add(leg);
      const arm=new THREE.Mesh(new THREE.SphereGeometry(4,10,8),new THREE.MeshLambertMaterial({color:0xcfd8e6})); arm.position.set(s*19,-2,0); inner.add(arm); }
    return g; }
  function placeHero(g,p){
    if(!p||p.absent||p.dead){ g.visible=false; return; }
    g.visible=!(p.inv>0&&Math.floor(clock*18)%2&&!p.down);
    const inner=g.userData.inner;
    g.position.set(p.x+p.w/2,-(p.y+p.h/2),CZ);
    inner.scale.set(p.sx||1,p.sy||1,1);
    const target=p.down?0:(p.face||1)*0.45; inner.rotation.y+=(target-inner.rotation.y)*0.25;
    inner.rotation.z=p.down?(p.kind==='spark'?1.2:-1.2):((p.vx||0)/-2400);
    try{ const sk=skinOf(p.kind); if(sk&&sk.body) g.userData.bodyM.color.set(sk.body); }catch(e){}
  }
  // ---------- enemies / boss / crates / movers ----------
  const ENC={crawler:0xff6b6b,flyer:0xc79bff,turret:0x9cc3ff,jumper:0x7fe08a};
  function enMesh(){ const g=new THREE.Group(); const m=new THREE.MeshLambertMaterial({color:0xff6b6b}); const b=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),m); b.castShadow=true; b.name='b'; g.add(b); g.userData.m=m; scene.add(g); shadowOnly(g); g.userData.m=b.material; return g; }
  function syncPool(arr,list,make,place){ while(arr.length<list.length) arr.push(make()); arr.forEach((g,i)=>{ const o=list[i]; if(!o){ g.visible=false; return; } g.visible=true; place(g,o); }); }
  function makeBoss(type){ const g=new THREE.Group(); const C={toad:0x6fae5b,eye:0xffb347,gear:0xe0a84a,queen:0xd65a8a,core:0xff4d5e}[type]||0xff4d5e;
    const m=new THREE.MeshLambertMaterial({color:C}); g.userData.m=m;
    let body; if(type==='gear'){ body=new THREE.Mesh(new THREE.TorusGeometry(.62,.3,10,14),m); const sh=new THREE.Shape(); } else if(type==='eye'){ body=new THREE.Mesh(new THREE.SphereGeometry(.6,28,20),m); } else if(type==='core'){ body=new THREE.Mesh(new THREE.IcosahedronGeometry(.6,1),m); } else { body=new THREE.Mesh(new THREE.SphereGeometry(.6,28,20),m); body.scale.set(1,.8,.9); }
    body.castShadow=true; body.name='b'; g.add(body);
    const w=new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x333333}); const n=type==='eye'?1:2; for(let i=0;i<n;i++){ const e=new THREE.Mesh(new THREE.SphereGeometry(type==='eye'?.26:.12,14,10),w); e.position.set(n===1?0:(i?.2:-.2),.12,.55); g.add(e); const p=new THREE.Mesh(new THREE.SphereGeometry(type==='eye'?.12:.06,10,8),new THREE.MeshLambertMaterial({color:0x111111})); p.position.set(e.position.x,.12,type==='eye'?.78:.66); g.add(p); }
    scene.add(g); shadowOnly(g); g.userData.m=body.material; return g; }
  // ---------- per frame ----------
  R.active=()=>R.on&&grid&&!['title','prologue','ending'].includes(state);
  R.render=(z,ox,oy)=>{
    if(!R.ready) init();
    glc.style.display='block'; document.body.classList.add('r3');
    const k=window.MOBILE_BUILD?Math.min(1,1.5*cv.clientWidth/Math.max(1,cv.width)):1, w=Math.round(cv.width*k),h=Math.round(cv.height*k); if(glc.width!==w||glc.height!==h){ renderer.setSize(w,h,false); }
    const lvlKey=levelIdx+'|'+(arena?arena.type:'')+'|'+gridVer;
    if(lvlKey!==tileKey){ tileKey=lvlKey; buildTiles(); for(const m of [R.back,R.sh]){ m.scale.x=WW/VW; m.position.x=WW/2; } }
    if(lastStaticGen!==staticGen){ lastStaticGen=staticGen; backTex.needsUpdate=true; }
    // camera matches the 2D transform: screen = game*z + o
    const cx=(VW/2-ox)/z, cy=(VH/2-oy)/z;
    cam.position.set(cx,-cy,DIST/z); cam.lookAt(cx,-cy,0); cam.updateProjectionMatrix();
    lightDir.position.set(cx-VW*0.25,-VH*0.1+900,900); lightDir.target.position.set(cx,-VH/2,0);
    placeHero(sparkG,players[0]); placeHero(boltG,players[1]);
    const s=players[0]; if(s&&!s.absent&&!s.dead){ sparkLight.visible=true; sparkLight.position.set(s.x+s.w/2,-(s.y),CZ+30); sparkLight.intensity=darkLvl?2.2:1.1; } else sparkLight.visible=false;
    const fl=sparkG.userData.inner.getObjectByName('flame'); if(fl){ fl.scale.set(1,1+Math.sin(clock*18)*.15,1); }
    hemi.intensity=darkLvl?0.3:0.9; lightDir.intensity=darkLvl?0.25:1.0;
    syncPool(pool.en,enemies.filter(e=>e.hp>0),enMesh,(g,e)=>{ g.position.set(e.x+e.w/2,-(e.y+e.h/2),CZ); g.scale.set(e.w/2,e.h/2,Math.min(e.w,e.h)/2); g.userData.m.color.setHex(e.flash>0?0xffffff:(ENC[e.type]||0xff6b6b)); g.rotation.y=(Math.sign(e.vx||e.dir||1))*0.35; });
    syncPool(pool.crate,crates,()=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xb07a42})); m.castShadow=true; m.receiveShadow=true; scene.add(m); return m; },(m,c)=>{ m.position.set(c.x+c.w/2,-(c.y+c.h/2),CZ); m.scale.set(c.w,c.h,Math.min(DEPTH*0.9,c.w*1.6)); });
    syncPool(pool.mover,movers,()=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xcfd8e6})); m.castShadow=true; m.receiveShadow=true; scene.add(m); return m; },(m,o)=>{ m.position.set(o.x+o.w/2,-(o.y+o.h/2),FRONT-DEPTH/2); m.scale.set(o.w,o.h,DEPTH*0.9); });
    if(boss&&!boss.gone){ if(!bossG||bossType!==boss.type){ if(bossG) scene.remove(bossG); bossG=makeBoss(boss.type); bossType=boss.type; }
      bossG.visible=true; bossG.position.set(boss.x+boss.w/2,-(boss.y+boss.h/2),CZ-10); const S=Math.max(boss.w,boss.h); bossG.scale.set(boss.w,boss.h,S*0.8);
      if(boss.type==='gear') bossG.rotation.z-=0.05; bossG.userData.m.emissive&&bossG.userData.m.emissive.setHex(boss.flash>0?0x666666:0x000000); }
    else if(bossG) bossG.visible=false;
    R.fr=(R.fr||0)+1; renderer.shadowMap.autoUpdate=false; renderer.shadowMap.needsUpdate=!window.MOBILE_BUILD||R.fr%2===0||R.moved;
    renderer.render(scene,cam);
    if(!R.checked){ R.checked=true; try{ const bad=(renderer.info.programs||[]).filter(p=>p.diagnostics&&!p.diagnostics.runnable); const gl=renderer.getContext(); const ge=gl.getError();
      if(bad.length) R.fail('шейдер не собрался: '+((bad[0].diagnostics.fragmentShader&&bad[0].diagnostics.fragmentShader.log)||(bad[0].diagnostics.vertexShader&&bad[0].diagnostics.vertexShader.log)||bad[0].diagnostics.programLog||'?'));
      else if(ge) console.warn('GL error',ge); }catch(e){} }
  };
  R.hide=()=>{ if(glc) glc.style.display='none'; document.body.classList.remove('r3'); };
  R.fail=err=>{ R.on=false; document.body.classList.remove('b3d'); try{ if(glc) glc.style.display='none'; }catch(e){} const msg=(err&&(err.message||err))+''; console.error('3D error',err);
    let box=document.getElementById('err3d'); if(!box){ box=document.createElement('div'); box.id='err3d'; box.style.cssText='position:fixed;left:8px;bottom:8px;z-index:9998;max-width:70vw;background:#3a0d14ee;color:#ffd6d6;font:12px/1.35 system-ui;padding:8px 10px;border-radius:8px;border:1px solid #ff6b6b'; document.body.appendChild(box); }
    box.textContent='3D не запустилось, показан 2D. Ошибка: '+msg.slice(0,220);  };
  return R;
})();

