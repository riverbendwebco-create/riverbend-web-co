/* Riverbend 3D hero: showcase slideshow, mouse depth, WebGL metallic ribbon.
   No dependencies. If WebGL is missing or too slow, the static ribbon image stays. */
(function(){
  'use strict';
  var hero=document.querySelector('.h3'); if(!hero) return;
  var Q=new URLSearchParams(location.search);
  var STILL=Q.has('h3still');                       // used once to export the static fallback image
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer=matchMedia('(hover: hover) and (pointer: fine)').matches;
  var small=matchMedia('(max-width: 980px)').matches;

  /* ---------------- showcase ---------------- */
  var SLIDES=[
    {k:'bar',     tag:'Sample design', name:'Tavern'},
    {k:'cypher',  tag:'Recent work',   name:'cypher-llc.com'},
    {k:'rest',    tag:'Sample design', name:'Restaurant'},
    {k:'ghost',   tag:'Recent work',   name:'ghostplatform.ai'},
    {k:'trade',   tag:'Sample design', name:'Contractor'},
    {k:'realty',  tag:'Sample design', name:'Real estate'},
    {k:'auto',    tag:'Sample design', name:'Auto dealer'}
  ];
  var lslot=hero.querySelector('[data-slot="l"]'), pslot=hero.querySelector('[data-slot="p"]');
  var label=hero.querySelector('.h3-label'), dotsEl=hero.querySelector('.h3-dots');
  var limgs=[],pimgs=[],dots=[],cur=-1;
  SLIDES.forEach(function(s,i){
    var a=document.createElement('img');
    a.alt=s.tag+': '+s.name+' on a laptop'; a.decoding='async'; a.width=1440; a.height=900;
    a.dataset.src=small?'/hero3d/img/'+s.k+'-s.webp':'/hero3d/img/'+s.k+'-l.webp';
    lslot.appendChild(a); limgs.push(a);
    var b=document.createElement('img');
    b.alt=s.tag+': '+s.name+' on a phone'; b.decoding='async'; b.width=390; b.height=844;
    b.dataset.src='/hero3d/img/'+s.k+'-p.webp';
    pslot.appendChild(b); pimgs.push(b);
    var d=document.createElement('button'); d.type='button';
    d.setAttribute('aria-label','Show '+s.name+' ('+s.tag.toLowerCase()+')');
    d.addEventListener('click',function(){go(i,true);});
    dotsEl.appendChild(d); dots.push(d);
  });
  function load(i){ i=(i+SLIDES.length)%SLIDES.length;
    [limgs[i],pimgs[i]].forEach(function(im){ if(!im.src) im.src=im.dataset.src; }); }
  function go(i,user){
    i=(i+SLIDES.length)%SLIDES.length; if(i===cur) return; cur=i;
    load(i); load(i+1);
    limgs.forEach(function(im,j){im.classList.toggle('on',j===i);});
    pimgs.forEach(function(im,j){im.classList.toggle('on',j===i);});
    dots.forEach(function(d,j){ if(j===i) d.setAttribute('aria-current','true'); else d.removeAttribute('aria-current'); });
    label.innerHTML='<b>'+SLIDES[i].tag+'</b> &middot; '+SLIDES[i].name;
    if(user) last=performance.now();
  }
  hero.querySelectorAll('.h3-nav').forEach(function(b){ b.addEventListener('click',function(){ go(cur+ +b.dataset.d,true); }); });
  var stage=hero.querySelector('.h3-stage');
  var sx=null;
  stage.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
  stage.addEventListener('touchend',function(e){ if(sx===null) return; var dx=e.changedTouches[0].clientX-sx; sx=null; if(Math.abs(dx)>40) go(cur+(dx<0?1:-1),true); },{passive:true});
  go(0);
  var last=performance.now(), SLIDE_MS=6000;

  /* ---------------- visibility ---------------- */
  var onScreen=true;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ onScreen=es[0].isIntersecting; if(onScreen) kick(); },{rootMargin:'80px'}).observe(hero);
  }
  document.addEventListener('visibilitychange',function(){ if(!document.hidden) kick(); });

  /* ---------------- mouse depth (damped) ---------------- */
  var tx=0,ty=0,mx=0,my=0,lx=.7,ly=.4,tlx=.7,tly=.4;
  if(finePointer && !reduce){
    hero.addEventListener('pointermove',function(e){
      var r=hero.getBoundingClientRect();
      tx=((e.clientX-r.left)/r.width-.5)*2; ty=((e.clientY-r.top)/r.height-.5)*2;
      var s=stage.getBoundingClientRect();
      tlx=(e.clientX-s.left)/s.width; tly=(e.clientY-s.top)/s.height;
      kick();
    });
    hero.addEventListener('pointerleave',function(){tx=0;ty=0;tlx=.7;tly=.4;});
  }

  /* ---------------- scroll handoff ---------------- */
  var sp=0;
  function onScroll(){
    var h=hero.offsetHeight; var p=Math.min(1,Math.max(0,window.scrollY/(h*.9)));
    if(Math.abs(p-sp)>.001){ sp=p; hero.style.setProperty('--sp',reduce?0:p.toFixed(3)); }
  }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* ---------------- WebGL ribbon ---------------- */
  var back=hero.querySelector('.h3-gl-back'), front=hero.querySelector('.h3-gl-front');
  var R=[], glOK=false, dpr=Math.min(window.devicePixelRatio||1, small?1.25:1.75);
  var lowPower=small || (navigator.hardwareConcurrency||8)<=4 || (navigator.deviceMemory||8)<=4;
  if(lowPower) dpr=Math.min(dpr,1);
  if(STILL){ lowPower=false; dpr=2; }

  var VS='attribute vec3 aP;attribute vec3 aN;attribute vec2 aU;uniform mat4 uPV;uniform mat4 uM;varying vec3 vW;varying vec3 vN;varying vec2 vU;'+
    'void main(){vec4 w=uM*vec4(aP,1.0);vW=w.xyz;vN=mat3(uM)*aN;vU=aU;gl_Position=uPV*w;}';
  var FS='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nvarying vec3 vW;varying vec3 vN;varying vec2 vU;uniform vec3 uCam;uniform vec3 uL;uniform vec3 uF0;uniform float uSide;uniform float uCut;uniform float uTint;'+
    'vec3 env(vec3 r){float up=r.y;vec3 c=mix(vec3(.003,.008,.03),vec3(.012,.045,.15),smoothstep(-.7,.6,up));'+
    'c+=vec3(.62,.8,1.)*smoothstep(.68,.8,up)*smoothstep(.9,.6,abs(r.x))*1.7;'+
    'c+=vec3(.08,.38,1.)*smoothstep(.6,.74,r.x)*1.8;'+
    'c+=vec3(.3,.56,1.)*smoothstep(.74,.86,-r.x)*smoothstep(-.3,.5,up)*1.1;'+
    'c+=vec3(.18,.45,1.)*exp(-abs(up+.08)*34.)*1.1;return c;}'+
    'void main(){'+
    'if(uSide>.5&&uSide<1.5){if(vW.z<uCut)discard;}else if(uSide<.5){if(vW.z>=uCut)discard;}'+
    'vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(uCam-vW);'+
    'float nv=max(dot(N,V),0.);vec3 F=uF0+(1.-uF0)*pow(1.-nv,5.);'+
    'vec3 col=env(reflect(-V,N))*F;'+
    'vec3 L=normalize(uL);col+=pow(max(dot(reflect(-L,N),V),0.),70.)*vec3(.9,.95,1.)*1.3;'+
    'col+=pow(max(dot(reflect(-normalize(vec3(-1.,.3,.6)),N),V),0.),30.)*vec3(.15,.4,1.)*.6;'+
    'col+=vec3(.02,.05,.14)*max(dot(N,L),0.);'+
    'float e=smoothstep(.40,.5,abs(vU.y-.5));col+=vec3(.25,.55,1.)*e*(.7+uTint);'+
    'col=mix(col,vec3(.55,.75,1.)*col.b*1.4,uTint*.35);'+
    'col=1.-exp(-col*1.2);'+
    'float a=smoothstep(0.,.07,vU.x)*smoothstep(1.,.9,vU.x);'+
    'gl_FragColor=vec4(col*a,a);}';
  var PVS='attribute vec3 aP;attribute float aS;uniform mat4 uPV;uniform float uT;uniform float uPx;varying float vA;'+
    'void main(){vec3 p=aP;p.y=mod(p.y+uT*.06*aS+3.,6.)-3.;p.x+=sin(uT*.2+aS*9.)*.15;vec4 c=uPV*vec4(p,1.);gl_Position=c;'+
    'gl_PointSize=uPx*(1.2+aS*2.2)*(7./c.w);vA=(.25+.55*aS)*smoothstep(3.,1.5,abs(p.y));}';
  var PFS='precision mediump float;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d);float a=smoothstep(.25,0.,r)*vA;gl_FragColor=vec4(vec3(.55,.75,1.)*a,a);}';

  function sh(gl,t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function prog(gl,v,f){var p=gl.createProgram();gl.attachShader(p,sh(gl,gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('link');return p;}

  /* ribbon geometry, rebuilt on the CPU each frame (cheap: ~1k vertices) */
  var SEG=small?120:220;
  function ribbonSpec(i){ return i===0
    ? {w:.62,yo:0,   ph:0,   z:1, f0:[.08,.3,1.], tint:0}
    : {w:.15,yo:-.3, ph:1.3, z:.9,f0:[.5,.7,1.],  tint:1}; }
  function center(u,t,s,o){
    o[0]=-2.2+5.4*u;
    var k=Math.min(1,Math.max(0,(u-.36)/.64));k=k*k*(3-2*k);
    o[1]=-1.5+2.45*k+(.1+.16*k)*Math.sin(u*5.6+t*.42+s.ph)+s.yo;
    o[2]=(.6*Math.sin(Math.PI*(u*2.05+.02))-.1+.12*Math.sin(t*.3+u*3.1+s.ph))*s.z;
  }
  function buildRibbon(buf,t,s){
    var A=[0,0,0],B=[0,0,0],C=[0,0,0],k=0;
    for(var i=0;i<=SEG;i++){
      var u=i/SEG; center(u,t,s,C); center(Math.min(1,u+.002),t,s,A); center(Math.max(0,u-.002),t,s,B);
      var Tx=A[0]-B[0],Ty=A[1]-B[1],Tz=A[2]-B[2],tl=Math.hypot(Tx,Ty,Tz);Tx/=tl;Ty/=tl;Tz/=tl;
      // B0 = T x Z, N0 = B0 x T
      var bx=Ty,by=-Tx,bz=0,bl=Math.hypot(bx,by)||1;bx/=bl;by/=bl;
      var nx=by*Tz-bz*Ty,ny=bz*Tx-bx*Tz,nz=bx*Ty-by*Tx;
      var ph=.15+u*2.3+.28*Math.sin(t*.25+u*4.+s.ph);
      var c=Math.cos(ph),sn=Math.sin(ph);
      var sx=bx*c+nx*sn,sy=by*c+ny*sn,sz=bz*c+nz*sn;
      var w=s.w*Math.pow(Math.sin(Math.PI*u),.55)*.5;
      // normal = T x side
      var Nx=Ty*sz-Tz*sy,Ny=Tz*sx-Tx*sz,Nz=Tx*sy-Ty*sx;
      for(var e=-1;e<=1;e+=2){
        buf[k++]=C[0]+sx*w*e;buf[k++]=C[1]+sy*w*e;buf[k++]=C[2]+sz*w*e;
        buf[k++]=Nx;buf[k++]=Ny;buf[k++]=Nz;buf[k++]=u;buf[k++]=e<0?0:1;
      }
    }
  }
  function mat4persp(f,a,n,fa){var t=1/Math.tan(f/2);return [t/a,0,0,0, 0,t,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0];}
  function mul(a,b){var o=new Array(16);for(var c=0;c<4;c++)for(var r=0;r<4;r++){o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];}return o;}
  function rotXY(rx,ry){var cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry);
    // M = Rx * Ry  (column-major)
    return [cy,sx*sy,-cx*sy,0, 0,cx,sx,0, sy,-sx*cy,cx*cy,0, 0,0,0,1];}

  function setup(canvas,side){
    var gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:!lowPower,depth:true,powerPreference:lowPower?'low-power':'high-performance',failIfMajorPerformanceCaveat:true,preserveDrawingBuffer:STILL});
    if(!gl) throw new Error('no webgl');
    var p=prog(gl,VS,FS), o={gl:gl,canvas:canvas,side:side,p:p,rib:[]};
    o.loc={aP:gl.getAttribLocation(p,'aP'),aN:gl.getAttribLocation(p,'aN'),aU:gl.getAttribLocation(p,'aU')};
    ['uPV','uM','uCam','uL','uF0','uSide','uCut','uTint'].forEach(function(n){o.loc[n]=gl.getUniformLocation(p,n);});
    var idx=[];for(var i=0;i<SEG;i++){var a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
    o.ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);o.n=idx.length;
    for(var r=0;r<2;r++){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,(SEG+1)*2*8*4,gl.DYNAMIC_DRAW);o.rib.push({b:b,data:new Float32Array((SEG+1)*2*8),s:ribbonSpec(r)});}
    if(side===0 && !STILL){
      var NP=lowPower?50:130, pd=new Float32Array(NP*4);
      for(var j=0;j<NP;j++){pd[j*4]=(Math.random()*2-1)*4.2;pd[j*4+1]=(Math.random()*2-1)*3;pd[j*4+2]=-3.2+Math.random()*3.4;pd[j*4+3]=Math.random();}
      o.pp=prog(gl,PVS,PFS);o.pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.pb);gl.bufferData(gl.ARRAY_BUFFER,pd,gl.STATIC_DRAW);o.np=NP;
      o.pl={aP:gl.getAttribLocation(o.pp,'aP'),aS:gl.getAttribLocation(o.pp,'aS'),uPV:gl.getUniformLocation(o.pp,'uPV'),uT:gl.getUniformLocation(o.pp,'uT'),uPx:gl.getUniformLocation(o.pp,'uPx')};
    }
    canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();fail();});
    return o;
  }
  function resize(o){
    var w=Math.max(1,Math.round(o.canvas.clientWidth*dpr)),h=Math.max(1,Math.round(o.canvas.clientHeight*dpr));
    if(o.canvas.width!==w||o.canvas.height!==h){o.canvas.width=w;o.canvas.height=h;}
  }
  function draw(o,t,PV,M,cam,L){
    var gl=o.gl;resize(o);gl.viewport(0,0,o.canvas.width,o.canvas.height);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    if(o.pp){
      gl.disable(gl.DEPTH_TEST);gl.useProgram(o.pp);gl.bindBuffer(gl.ARRAY_BUFFER,o.pb);
      gl.enableVertexAttribArray(o.pl.aP);gl.vertexAttribPointer(o.pl.aP,3,gl.FLOAT,false,16,0);
      gl.enableVertexAttribArray(o.pl.aS);gl.vertexAttribPointer(o.pl.aS,1,gl.FLOAT,false,16,12);
      gl.uniformMatrix4fv(o.pl.uPV,false,mul(PV,M));gl.uniform1f(o.pl.uT,t);gl.uniform1f(o.pl.uPx,dpr);
      gl.drawArrays(gl.POINTS,0,o.np);
      gl.disableVertexAttribArray(o.pl.aS);
    }
    gl.enable(gl.DEPTH_TEST);gl.useProgram(o.p);
    gl.uniformMatrix4fv(o.loc.uPV,false,PV);gl.uniformMatrix4fv(o.loc.uM,false,M);
    gl.uniform3fv(o.loc.uCam,cam);gl.uniform3fv(o.loc.uL,L);gl.uniform1f(o.loc.uSide,STILL?2:o.side);gl.uniform1f(o.loc.uCut,.05);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.ib);
    for(var r=o.rib.length-1;r>=0;r--){var rb=o.rib[r];
      buildRibbon(rb.data,t,rb.s);gl.bindBuffer(gl.ARRAY_BUFFER,rb.b);gl.bufferSubData(gl.ARRAY_BUFFER,0,rb.data);
      gl.enableVertexAttribArray(o.loc.aP);gl.vertexAttribPointer(o.loc.aP,3,gl.FLOAT,false,32,0);
      gl.enableVertexAttribArray(o.loc.aN);gl.vertexAttribPointer(o.loc.aN,3,gl.FLOAT,false,32,12);
      gl.enableVertexAttribArray(o.loc.aU);gl.vertexAttribPointer(o.loc.aU,2,gl.FLOAT,false,32,24);
      gl.uniform3fv(o.loc.uF0,rb.s.f0);gl.uniform1f(o.loc.uTint,rb.s.tint);
      gl.drawElements(gl.TRIANGLES,o.n,gl.UNSIGNED_SHORT,0);
    }
  }
  function fail(){ glOK=false; hero.classList.remove('gl-on'); R=[]; }

  function startGL(){
    try{
      R.push(setup(back,(STILL||small)?2:0));
      if(!small && !STILL) R.push(setup(front,1));   // phones: ribbon behind the devices only
      glOK=true; requestAnimationFrame(function(){ hero.classList.add('gl-on'); });
    }catch(e){ fail(); }
  }

  /* ---------------- loop ---------------- */
  var raf=0, t0=performance.now(), simT=reduce?18:0, frames=0, acc=0, slowStreak=0;
  function kick(){ if(!raf) raf=requestAnimationFrame(loop); }
  function loop(now){
    raf=0;
    var dt=Math.min(64,now-t0); t0=now;
    if(document.hidden || !onScreen) return;           // paused; kick() restarts
    // damping
    mx+=(tx-mx)*.06; my+=(ty-my)*.06; lx+=(tlx-lx)*.08; ly+=(tly-ly)*.08;
    hero.style.setProperty('--mx',mx.toFixed(4)); hero.style.setProperty('--my',my.toFixed(4));
    hero.style.setProperty('--lx',(lx*100).toFixed(2)+'%'); hero.style.setProperty('--ly',(ly*100).toFixed(2)+'%');
    if(!reduce && now-last>SLIDE_MS){ last=now; go(cur+1); }
    if(glOK){
      if(!reduce) simT+=dt/1000;
      var c=R[0].canvas, asp=c.clientWidth/Math.max(1,c.clientHeight);
      var PV=mat4persp(30*Math.PI/180,asp,.1,50);
      PV=mul(PV,[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,-.05,-8.4,1]);
      // match the CSS rig: rotateX(4deg - my*4deg) rotateY(-13deg + mx*7deg); GL x-rotation sign is flipped (y up)
      var rx=-(4-my*4)*Math.PI/180, ry=(-13+mx*7)*Math.PI/180;
      var M=rotXY(rx,ry);
      var L=[1.6+(lx-.5)*3,2.2-(ly-.4)*3,3.2];
      var t1=performance.now();
      for(var i=0;i<R.length;i++) draw(R[i],simT,PV,M,[0,.05,8.4],L);
      // adaptive quality: watch real frame time
      frames++; acc+=dt;
      if(frames>=45){ var avg=acc/frames; frames=0; acc=0;
        if(avg>24 && dpr>.75){ dpr=Math.max(.75,dpr-.25); }
        else if(avg>40){ if(++slowStreak>=2){ fail(); } }
        else slowStreak=0;
      }
    }
    var animating=!reduce || Math.abs(tx-mx)>.001 || Math.abs(ty-my)>.001;
    if(animating || glOK&&!reduce) raf=requestAnimationFrame(loop);
    else if(reduce && glOK && !drewOnce){ drewOnce=true; }
  }
  var drewOnce=false;

  // start WebGL after the page has painted, so text and CTAs are never held up
  function boot(){
    var hasGL=false;
    try{ var tc=document.createElement('canvas'); hasGL=!!(tc.getContext('webgl')); }catch(e){}
    if(hasGL) startGL();
    kick();
    if(STILL){ window.__h3still=function(){ return back.toDataURL('image/png'); }; }
  }
  if(document.readyState==='complete') setTimeout(boot,60);
  else window.addEventListener('load',function(){ (window.requestIdleCallback||setTimeout)(boot,{timeout:900}); });
  window.addEventListener('resize',function(){ kick(); },{passive:true});
})();
