/* ===== HERO3D: 3D-модели героев (GLB внутри страницы) — ТОЛЬКО для роликов. В бою и на уровнях остаются 2D-спрайты. =====
   HERO3D.spark — после загрузки (HERO3D.ready) объект { group, play(имя|null, t), flame(t), update() }.
   Никаких зависимостей кроме THREE. Модель Искры: source/spark3d.b64 (подставляется при сборке в тестовые версии). */
const HERO3D=(()=>{
  const H={ready:false,failed:false,spark:null,_p:null};
  const B64={spark:/*SPARK3D*/''};
  const CT={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array}, NC={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
  async function build(b64,opt){
    const bin=atob(b64), buf=new ArrayBuffer(bin.length), u8=new Uint8Array(buf); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
    const dv=new DataView(buf), jl=dv.getUint32(12,true), J=JSON.parse(new TextDecoder().decode(u8.subarray(20,20+jl))), bo=20+jl+8;
    function acc(i){ const a=J.accessors[i], v=J.bufferViews[a.bufferView], T=CT[a.componentType], n=NC[a.type], base=bo+(v.byteOffset||0)+(a.byteOffset||0), cnt=a.count*n;
      if(a.componentType===5126&&!v.byteStride&&base%4===0) return new Float32Array(buf.slice(base,base+cnt*4));
      const out=new (a.componentType===5126?Float32Array:T)(cnt), stride=v.byteStride||T.BYTES_PER_ELEMENT*n;
      for(let k=0;k<a.count;k++) for(let c=0;c<n;c++){ const off=base+k*stride+c*T.BYTES_PER_ELEMENT; let val;
        switch(a.componentType){case 5126:val=dv.getFloat32(off,true);break;case 5121:val=dv.getUint8(off);break;case 5123:val=dv.getUint16(off,true);break;case 5125:val=dv.getUint32(off,true);break;case 5122:val=dv.getInt16(off,true);break;default:val=dv.getInt8(off);}
        if(a.normalized) val=a.componentType===5121?val/255:a.componentType===5123?val/65535:val; out[k*n+c]=val; }
      return out; }
    // --- скелет: узлы получают имена n0,n1,... чтобы дорожки анимации привязывались без путаницы
    const nodes=J.nodes.map((n,i)=>{ const b=n.mesh!==undefined?new THREE.Object3D():new THREE.Bone(); b.name='n'+i; b.userData.nm=n.name;
      if(n.translation) b.position.fromArray(n.translation); if(n.rotation) b.quaternion.fromArray(n.rotation); if(n.scale) b.scale.fromArray(n.scale); return b; });
    J.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>nodes[i].add(nodes[c])));
    const root=new THREE.Group(); J.scenes[0].nodes.forEach(i=>root.add(nodes[i]));
    const mi=J.nodes.findIndex(n=>n.mesh!==undefined), mn=J.nodes[mi], pr=J.meshes[mn.mesh].primitives[0], g=new THREE.BufferGeometry();
    const P=acc(pr.attributes.POSITION), SI=new Uint16Array(acc(pr.attributes.JOINTS_0)), SW=acc(pr.attributes.WEIGHTS_0);
    g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('normal',new THREE.BufferAttribute(acc(pr.attributes.NORMAL),3)); g.setAttribute('uv',new THREE.BufferAttribute(acc(pr.attributes.TEXCOORD_0),2));
    g.setIndex(new THREE.BufferAttribute(acc(pr.indices),1));
    // --- текстуры (jpeg внутри файла)
    const tex=async(i,srgb)=>{ const im=J.images[J.textures[i].source], v=J.bufferViews[im.bufferView];
      const bm=await createImageBitmap(new Blob([u8.subarray(bo+(v.byteOffset||0),bo+(v.byteOffset||0)+v.byteLength)],{type:im.mimeType}),{imageOrientation:'none'});
      const t=new THREE.Texture(bm); t.flipY=false; t.encoding=srgb?THREE.sRGBEncoding:THREE.LinearEncoding; t.anisotropy=4; t.needsUpdate=true; return t; };
    const mt=J.materials[0], mat=new THREE.MeshStandardMaterial({map:await tex(mt.pbrMetallicRoughness.baseColorTexture.index,true),roughness:.8,metalness:0,side:THREE.DoubleSide});
    // огонёк светится сам: основная текстура подмешивается как свечение, поэтому в тёмных сценах Искра не темнеет
    mat.emissiveMap=mat.map; mat.emissive=new THREE.Color(1,1,1); mat.emissiveIntensity=opt&&opt.glow!==undefined?opt.glow:.7;
    // --- кости
    const sk=J.skins[mn.skin], bones=sk.joints.map(j=>nodes[j]), ibm=acc(sk.inverseBindMatrices), inv=bones.map((_,i)=>new THREE.Matrix4().fromArray(ibm,i*16));
    const head=bones.find(b=>b.userData.nm==='mixamorig:Head'), headIdx=bones.indexOf(head);
    root.updateMatrixWorld(true);
    // --- отдельная кость пламени: плавный переход «голова → пламя» по высоте, чтобы пламя колыхалось само
    let fb=null;
    if(head){
      fb=new THREE.Bone(); fb.name='flame'; head.add(fb); fb.position.copy(head.worldToLocal(new THREE.Vector3(0,1.24,0))); root.updateMatrixWorld(true);
      bones.push(fb); inv.push(new THREE.Matrix4().copy(fb.matrixWorld).invert());
      const fi=bones.length-1, lo=1.22, hi=1.36;
      for(let v=0;v<P.length/3;v++){ const y=P[v*3+1]; if(y<=lo) continue; if(SI[v*4]!==headIdx||SW[v*4]<.9) continue;
        const k=Math.min(1,(y-lo)/(hi-lo)), s=k*k*(3-2*k); SI[v*4]=fi; SW[v*4]=s; SI[v*4+1]=headIdx; SW[v*4+1]=1-s; }
    }
    g.setAttribute('skinIndex',new THREE.BufferAttribute(SI,4)); g.setAttribute('skinWeight',new THREE.BufferAttribute(SW,4));
    const mesh=new THREE.SkinnedMesh(g,mat); mesh.frustumCulled=false; mesh.castShadow=true; mesh.receiveShadow=false; root.add(mesh);
    const skel=new THREE.Skeleton(bones,inv); mesh.bind(skel,new THREE.Matrix4());
    // --- анимации
    const clips={}; (J.animations||[]).forEach(a=>{ const tr=[]; a.channels.forEach(ch=>{ const s=a.samplers[ch.sampler], t=ch.target, times=acc(s.input), vals=acc(s.output), nm='n'+t.node;
      if(t.path==='translation') tr.push(new THREE.VectorKeyframeTrack(nm+'.position',times,vals)); else if(t.path==='rotation') tr.push(new THREE.QuaternionKeyframeTrack(nm+'.quaternion',times,vals)); else if(t.path==='scale') tr.push(new THREE.VectorKeyframeTrack(nm+'.scale',times,vals)); });
      clips[a.name]=new THREE.AnimationClip(a.name,-1,tr); });
    const mixer=new THREE.AnimationMixer(root), group=new THREE.Group(); group.add(root);
    let cur='';
    const qh=new THREE.Quaternion(), qw=new THREE.Quaternion(), qa=new THREE.Quaternion(), vp=new THREE.Vector3(), vs=new THREE.Vector3(), AX=new THREE.Vector3(1,0,0), AZ=new THREE.Vector3(0,0,1);
    return { group, clips, names:Object.keys(clips), duration:n=>clips[n]?clips[n].duration:0,
      // play(null,t) — стойка (поза по умолчанию); play('Walking'|'Running', t) — кадр анимации в момент t (зацикливается)
      play(name,t){ const key=name||''; if(key!==cur){ mixer.stopAllAction(); if(name&&clips[name]) mixer.clipAction(clips[name]).play(); else skel.pose(); cur=key; }
        if(name&&clips[name]){ const d=clips[name].duration; mixer.setTime(((t%d)+d)%d); } root.updateMatrixWorld(true); },
      // колыхание пламени: качаем кость пламени в мировых осях, поэтому оно живёт при любой позе головы
      flame(t,k){ if(!fb||!head) return; k=k===undefined?1:k; head.matrixWorld.decompose(vp,qh,vs);
        qw.setFromAxisAngle(AX,(.11*Math.sin(t*7.1)+.05*Math.sin(t*13.3))*k); qa.setFromAxisAngle(AZ,(.13*Math.sin(t*5.3+1)+.04*Math.sin(t*11.7))*k); qw.multiply(qa);
        fb.quaternion.copy(qh).invert().multiply(qw).multiply(qh); const s=1+.05*k*Math.sin(t*17); fb.scale.set(s,s,s); },
      height:1.7 };
  }
  H.load=function(opt){ if(H._p) return H._p; if(typeof THREE==='undefined'||!B64.spark||typeof createImageBitmap==='undefined') return Promise.resolve(false);
    H._p=build(B64.spark,opt).then(m=>{ H.spark=m; H.ready=true; return true; }).catch(e=>{ console.error('hero3d',e); H.failed=true; return false; }); return H._p; };
  H.load();
  return H;
})();
