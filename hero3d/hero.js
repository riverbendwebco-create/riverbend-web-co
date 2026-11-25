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

  /* ---------------- WebGL river ----------------
     A flat river surface seen from above at an angle, running the full width of the hero with a bend
     under the devices. Water: flowing ripples, sky reflection by fresnel, deep-to-shallow colour,
     caustic light, glints along the current and soft banks. No textures, no libraries. */
  var canvas=hero.querySelector('.h3-river');
  var G=null, glOK=false, dpr=Math.min(window.devicePixelRatio||1, small?1.25:1.5);
  var lowPower=small || (navigator.hardwareConcurrency||8)<=4 || (navigator.deviceMemory||8)<=4;
  if(lowPower) dpr=Math.min(dpr,1);
  if(STILL){ lowPower=false; dpr=2; }

  var VS='attribute vec3 aP;attribute vec2 aU;uniform mat4 uPV;varying vec3 vW;varying vec2 vU;'+
    'void main(){vW=aP;vU=aU;gl_Position=uPV*vec4(aP,1.);}';
  var FS='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n'+
    'varying vec3 vW;varying vec2 vU;uniform vec3 uCam;uniform vec3 uL;uniform float uT;uniform vec2 uRes;uniform float uLeft;'+
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'+
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}'+
    'vec3 sky(vec3 r){float up=r.y;vec3 c=mix(vec3(.006,.016,.06),vec3(.04,.13,.4),smoothstep(0.,.55,up));'+
    'c+=vec3(.5,.72,1.)*smoothstep(.4,.9,up)*.6;return c;}'+
    'void main(){'+
    'float fl=uT;vec2 q=vec2(vU.x*4.2,vU.y*7.);'+
    /* analytic travelling waves (flow along +x of the river) */
    'vec2 g=vec2(1.,.4)*cos(q.x+q.y*.4-fl*2.)*.5'+
    '+vec2(1.6,-.9)*cos(q.x*1.6-q.y*.9-fl*2.7+1.3)*.32'+
    '+vec2(2.7,1.5)*cos(q.x*2.7+q.y*1.5-fl*3.6+2.1)*.18'+
    '+vec2(4.4,-2.2)*cos(q.x*4.4-q.y*2.2-fl*4.6+.7)*.1;'+
    'vec2 nq=vec2(q.x*3.4-fl*5.,q.y*2.6);float n0=noise(nq),nx=noise(nq+vec2(.05,0.)),ny=noise(nq+vec2(0.,.05));'+
    'g+=vec2(nx-n0,ny-n0)/.05*.06;'+
    'vec3 N=normalize(vec3(-g.x*.16,1.,-g.y*.16));'+
    'vec3 V=normalize(uCam-vW);float nv=max(dot(N,V),0.);float F=.02+.98*pow(1.-nv,5.);'+
    'float ac=1.-abs(vU.y-.5)*2.;'+
    'vec3 body=mix(vec3(.05,.3,.85),vec3(.006,.045,.18),smoothstep(.0,.8,ac));'+
    'float c1=noise(vec2(q.x*.7-fl*1.1,q.y*.9)*2.4),c2=noise(vec2(q.x*.9-fl*1.5+5.2,q.y*1.1+2.)*2.4);'+
    'float caus=pow(clamp(1.-abs(c1-c2)*2.4,0.,1.),9.);body+=vec3(.25,.55,1.)*caus*.28*ac;'+
    'vec3 col=mix(body,sky(reflect(-V,N)),F);'+
    'vec3 L=normalize(uL);float rl=max(dot(reflect(-L,N),V),0.);'+
    'col+=vec3(.95,.98,1.)*pow(rl,300.)*2.6+vec3(.3,.58,1.)*pow(rl,40.)*.45;'+
    'float w1=sin(vU.x*26.-fl*5.+3.*sin(vU.y*19.+vU.x*2.)),w2=sin(vU.y*55.+vU.x*7.-fl*1.2);'+
    'float msk=smoothstep(.55,.85,noise(vec2(vU.x*1.6-fl*.8,vU.y*3.)));'+
    'float spk=pow(max(0.,w1*w2),18.)*msk;col+=vec3(.85,.93,1.)*spk*(.15+pow(rl,6.)*1.3)*ac;'+
    'float st=noise(vec2(vU.x*9.-fl*3.,vU.y*16.));col+=vec3(.6,.8,1.)*smoothstep(.76,.95,st)*.22*ac;'+
    'float ed=1.-smoothstep(.0,.3,ac);float fo=.6*noise(vec2(vU.x*11.-fl*2.6,vU.y*22.))+.4*noise(vec2(vU.x*24.-fl*4.,vU.y*46.));'+
    'float foam=ed*smoothstep(.5,.82,fo)*.55;col=mix(col,vec3(.75,.88,1.),foam);'+
    'col=1.-exp(-col*1.4);'+
    'vec2 sc=gl_FragCoord.xy/uRes;'+
    'float a=smoothstep(0.,.2,ac)*(.78+F*.25)+foam*.3;'+
    'a*=mix(uLeft,1.,smoothstep(.18,.52,sc.x));'+       /* calmer behind the headline side */
    'a*=smoothstep(1.,.86,sc.y);'+                       /* fade into the distance at the top of the band */
    'a=clamp(a,0.,1.);gl_FragColor=vec4(col*a,a);}';
  var PVS='attribute vec3 aP;attribute float aS;uniform mat4 uPV;uniform float uT;uniform float uPx;varying float vA;'+
    'void main(){vec3 p=aP;p.x=mod(p.x+uT*.12*(.4+aS)+9.,18.)-9.;p.y+=sin(uT*.6+aS*20.)*.05;vec4 c=uPV*vec4(p,1.);gl_Position=c;'+
    'gl_PointSize=uPx*(1.+aS*2.)*(6./c.w);vA=(.2+.5*aS);}';
  var PFS='precision mediump float;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d);float a=smoothstep(.25,0.,r)*vA;gl_FragColor=vec4(vec3(.6,.8,1.)*a,a);}';

  function sh(gl,t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function prog(gl,v,f){var p=gl.createProgram();gl.attachShader(p,sh(gl,gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('link');return p;}

  /* river path on the ground plane (y=0): runs past both screen edges, bends toward the viewer under the devices */
  function pathZ(x){ var E=Math.exp; return -1.3+1.9*E(-Math.pow((x+3.4)/2.3,2))-.6*E(-Math.pow((x+.2)/1.1,2))+1.5*E(-Math.pow((x-1.9)/2.1,2))-1.4*E(-Math.pow((x-7)/3,2)); }
  function buildRiver(){
    var SEG=small?160:260, X0=-13, X1=13, W=2.5, verts=[], idx=[], len=0, px=X0, pz=pathZ(X0);
    for(var i=0;i<=SEG;i++){
      var x=X0+(X1-X0)*i/SEG, z=pathZ(x), dx=.01, tx=1, tz=(pathZ(x+dx)-pathZ(x-dx))/(2*dx), tl=Math.hypot(tx,tz);
      tx/=tl; tz/=tl; len+=Math.hypot(x-px,z-pz); px=x; pz=z;
      var k=Math.min(1,Math.max(0,(x+3)/4));var w=W*(.72+.38*k*k*(3-2*k))*(1+.14*Math.sin(x*.7+1.)+.08*Math.sin(x*1.9));     // natural width changes
      var sx=-tz, sz=tx;                                          // across-river direction
      verts.push(x+sx*w*.5,0,z+sz*w*.5,len,0, x-sx*w*.5,0,z-sz*w*.5,len,1);
      if(i<SEG){var b=i*2;idx.push(b,b+1,b+2,b+1,b+3,b+2);}
    }
    return {v:new Float32Array(verts),i:new Uint16Array(idx)};
  }
  function lookAt(e,t){
    var fx=t[0]-e[0],fy=t[1]-e[1],fz=t[2]-e[2],fl=Math.hypot(fx,fy,fz);fx/=fl;fy/=fl;fz/=fl;
    var rx=fy*0-fz*1,ry=fz*0-fx*0,rz=fx*1-fy*0,rl=Math.hypot(rx,ry,rz);rx/=rl;ry/=rl;rz/=rl;
    var ux=ry*fz-rz*fy,uy=rz*fx-rx*fz,uz=rx*fy-ry*fx;
    return [rx,ux,-fx,0, ry,uy,-fy,0, rz,uz,-fz,0, -(rx*e[0]+ry*e[1]+rz*e[2]),-(ux*e[0]+uy*e[1]+uz*e[2]),(fx*e[0]+fy*e[1]+fz*e[2]),1];
  }
  function persp(f,a,n,fa){var t=1/Math.tan(f/2);return [t/a,0,0,0, 0,t,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0];}
  function mul(a,b){var o=new Array(16);for(var c=0;c<4;c++)for(var r=0;r<4;r++){o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];}return o;}

  function setup(){
    var gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:!lowPower,depth:false,powerPreference:lowPower?'low-power':'default',failIfMajorPerformanceCaveat:true,preserveDrawingBuffer:STILL});
    if(!gl) throw new Error('no webgl');
    var o={gl:gl,p:prog(gl,VS,FS)};
    o.loc={aP:gl.getAttribLocation(o.p,'aP'),aU:gl.getAttribLocation(o.p,'aU')};
    ['uPV','uCam','uL','uT','uRes','uLeft'].forEach(function(n){o.loc[n]=gl.getUniformLocation(o.p,n);});
    var m=buildRiver();
    o.vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.vb);gl.bufferData(gl.ARRAY_BUFFER,m.v,gl.STATIC_DRAW);
    o.ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,m.i,gl.STATIC_DRAW);o.n=m.i.length;
    if(!STILL){
      var NP=lowPower?40:110, pd=new Float32Array(NP*4);
      for(var j=0;j<NP;j++){pd[j*4]=(Math.random()*2-1)*9;pd[j*4+1]=.08+Math.random()*1.4;pd[j*4+2]=-4.5+Math.random()*5.5;pd[j*4+3]=Math.random();}
      o.pp=prog(gl,PVS,PFS);o.pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.pb);gl.bufferData(gl.ARRAY_BUFFER,pd,gl.STATIC_DRAW);o.np=NP;
      o.pl={aP:gl.getAttribLocation(o.pp,'aP'),aS:gl.getAttribLocation(o.pp,'aS'),uPV:gl.getUniformLocation(o.pp,'uPV'),uT:gl.getUniformLocation(o.pp,'uT'),uPx:gl.getUniformLocation(o.pp,'uPx')};
    }
    canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();fail();});
    return o;
  }
  function draw(o,t){
    var gl=o.gl, w=Math.max(1,Math.round(canvas.clientWidth*dpr)), h=Math.max(1,Math.round(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    var asp=w/h, portrait=asp<1.2;
    // camera: on wide screens the whole river crosses the frame; on phones we look at the bend under the devices
    var eye=portrait?[1.6+mx*.2,1.9,6.2]:[mx*.45,1.5-my*.12,6];
    var tgt=portrait?[1.6,-.2,-.4]:[0,.65,-1];
    var PV=mul(persp((portrait?44:34)*Math.PI/180,asp,.1,60),lookAt(eye,tgt));
    gl.useProgram(o.p);
    gl.uniformMatrix4fv(o.loc.uPV,false,PV);gl.uniform3fv(o.loc.uCam,eye);
    gl.uniform3fv(o.loc.uL,[-.25+(lx-.5)*.8,.55+(.4-ly)*.3,-1]);   // light low behind the river: a glint path on the water
    gl.uniform1f(o.loc.uT,t);gl.uniform2f(o.loc.uRes,w,h);gl.uniform1f(o.loc.uLeft,portrait?1:.55);
    gl.bindBuffer(gl.ARRAY_BUFFER,o.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.ib);
    gl.enableVertexAttribArray(o.loc.aP);gl.vertexAttribPointer(o.loc.aP,3,gl.FLOAT,false,20,0);
    gl.enableVertexAttribArray(o.loc.aU);gl.vertexAttribPointer(o.loc.aU,2,gl.FLOAT,false,20,12);
    gl.drawElements(gl.TRIANGLES,o.n,gl.UNSIGNED_SHORT,0);
    gl.disableVertexAttribArray(o.loc.aU);
    if(o.pp){
      gl.useProgram(o.pp);gl.bindBuffer(gl.ARRAY_BUFFER,o.pb);
      gl.enableVertexAttribArray(o.pl.aP);gl.vertexAttribPointer(o.pl.aP,3,gl.FLOAT,false,16,0);
      gl.enableVertexAttribArray(o.pl.aS);gl.vertexAttribPointer(o.pl.aS,1,gl.FLOAT,false,16,12);
      gl.uniformMatrix4fv(o.pl.uPV,false,PV);gl.uniform1f(o.pl.uT,t);gl.uniform1f(o.pl.uPx,dpr);
      gl.drawArrays(gl.POINTS,0,o.np);gl.disableVertexAttribArray(o.pl.aS);
    }
  }
  function fail(){ glOK=false; G=null; hero.classList.remove('gl-on'); }
  function startGL(){
    try{ G=setup(); glOK=true; requestAnimationFrame(function(){ hero.classList.add('gl-on'); }); }catch(e){ fail(); }
  }

  /* ---------------- loop ---------------- */
  var raf=0, t0=performance.now(), simT=reduce?6:0, frames=0, acc=0, slowStreak=0;
  function kick(){ if(!raf) raf=requestAnimationFrame(loop); }
  function loop(now){
    raf=0;
    var dt=Math.min(64,now-t0); t0=now;
    if(document.hidden || !onScreen) return;
    mx+=(tx-mx)*.06; my+=(ty-my)*.06; lx+=(tlx-lx)*.08; ly+=(tly-ly)*.08;
    hero.style.setProperty('--mx',mx.toFixed(4)); hero.style.setProperty('--my',my.toFixed(4));
    hero.style.setProperty('--lx',(lx*100).toFixed(2)+'%'); hero.style.setProperty('--ly',(ly*100).toFixed(2)+'%');
    if(!reduce && now-last>SLIDE_MS){ last=now; go(cur+1); }
    if(glOK){
      if(!reduce) simT+=dt/1000;
      draw(G,simT);
      frames++; acc+=dt;
      if(frames>=45 && !STILL){ var avg=acc/frames; frames=0; acc=0;
        if(avg>24 && dpr>.75){ dpr=Math.max(.75,dpr-.25); }
        else if(avg>40){ if(++slowStreak>=2){ fail(); } }
        else slowStreak=0;
      }
    }
    var moving=Math.abs(tx-mx)>.001 || Math.abs(ty-my)>.001;
    if(!reduce || moving) raf=requestAnimationFrame(loop);
  }

  function boot(){
    var hasGL=false;
    try{ hasGL=!!document.createElement('canvas').getContext('webgl'); }catch(e){}
    if(hasGL) startGL();
    kick();
    if(STILL){ window.__h3still=function(){ return canvas.toDataURL('image/png'); }; }
  }
  if(document.readyState==='complete') setTimeout(boot,60);
  else window.addEventListener('load',function(){ (window.requestIdleCallback||setTimeout)(boot,{timeout:900}); });
  window.addEventListener('resize',function(){ kick(); },{passive:true});
})();
