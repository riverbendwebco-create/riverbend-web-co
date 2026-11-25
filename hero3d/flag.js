/* Riverbend hero: realistic 3D U.S. flag with a real bald eagle soaring around it.
   Flag: high-resolution cloth mesh, layered travelling waves with a fluttering fly end, woven-fabric
   texture with mipmaps, cloth sheen, fold occlusion and light passing through the fabric.
   Eagle: a full wingbeat cycle (22 frames) keyed from a green-screen bald eagle clip on Pixabay
   (Pixabay Content License), played on a card inside the 3D scene: it flaps, glides on descents,
   banks, turns and is depth-tested against the flag so it passes behind and in front of it.
   Plain WebGL, no libraries. Decorative (aria-hidden); hides itself if WebGL is unavailable. */
(function(){
  'use strict';
  var box=document.querySelector('.h3-flag'); if(!box) return;
  var canvas=box.querySelector('canvas');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  var gl;
  try{ gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,depth:true}); }catch(e){}
  if(!gl){ box.classList.add('no-gl'); return; }
  var dpr=Math.min(window.devicePixelRatio||1,2);
  var aniso=gl.getExtension('EXT_texture_filter_anisotropic')||gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');

  /* ---------- flag texture: official layout at 2048x1024 (power of two for mipmaps) ---------- */
  function flagTexture(){
    var W=2048,H=1024,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');
    var sh=H/13,i;
    for(i=0;i<13;i++){x.fillStyle=i%2?'#F4F1EA':'#B0213A';x.fillRect(0,Math.round(i*sh),W,Math.ceil(sh)+1);}
    x.globalAlpha=.18;x.fillStyle='#3a0a12';for(i=1;i<13;i++)x.fillRect(0,Math.round(i*sh)-1,W,2);x.globalAlpha=1;   // seams
    var cw=W*.4,ch=sh*7;                                    // canton: 0.76 of the hoist on a 1.9:1 flag = 40% of the width
    x.fillStyle='#2E2D5E';x.fillRect(0,0,cw,ch);
    x.globalAlpha=.25;x.fillStyle='#000';x.fillRect(0,ch-2,cw,3);x.fillRect(cw-2,0,3,ch);x.globalAlpha=1;
    var ry=H*.0616/2,rx=ry*(W/(H*1.9));
    function star(cx,cy){
      for(var pass=0;pass<2;pass++){              // soft shadow, then the embroidered star
        x.beginPath();for(var k=0;k<10;k++){var a=-Math.PI/2+k*Math.PI/5,f=k%2?.382:1;x.lineTo(cx+rx*f*Math.cos(a)+(pass?0:1.5),cy+ry*f*Math.sin(a)+(pass?0:2));}
        x.closePath();x.fillStyle=pass?'#F7F5EF':'rgba(0,0,0,.35)';x.fill();
      }
    }
    for(var row=0;row<9;row++){var n=row%2?5:6;for(var j=0;j<n;j++)star(cw*(row%2?(2*j+2):(2*j+1))/12,ch*(row+1)/10);}
    // woven fabric: a small tiled pattern overlaid on the whole flag (cheap, no per-pixel loop)
    var pc=document.createElement('canvas');pc.width=pc.height=8;var px=pc.getContext('2d'),seed=11;
    function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647;}
    for(var yy=0;yy<8;yy++)for(var xx=0;xx<8;xx++){var v=((xx&2)^(yy&2))?150:105;v+=(rnd()-.5)*30;px.fillStyle='rgb('+v+','+v+','+v+')';px.fillRect(xx,yy,1,1);}
    x.globalCompositeOperation='overlay';x.globalAlpha=.22;x.fillStyle=x.createPattern(pc,'repeat');x.fillRect(0,0,W,H);
    x.globalAlpha=1;x.globalCompositeOperation='source-over';
    return c;
  }

  function sh(t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function prog(v,f){var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('link');return p;}
  var P='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';

  /* ---------- cloth: height field with layered waves; normals by finite differences ---------- */
  var FVS='attribute vec2 aG;uniform mat4 uPV;uniform float uT;uniform float uWind;varying vec2 vUV;varying vec3 vN;varying vec3 vW;varying float vZ;'+
    'float hz(vec2 g){float u=g.x,v=g.y,t=uT,w=uWind;'+
    'float A=(.1+.08*w)*pow(u,.95);float s=3.2+2.4*w;'+
    'float z=A*sin(u*6.2-t*s+v*.8+.3*sin(t*.7));'+
    'z+=A*.45*sin(u*10.5-t*s*1.4+v*2.6+1.7);'+
    'z+=A*.22*sin(u*17.-t*s*2.+v*-3.4+.4);'+
    'z+=(.012+.02*w)*pow(u,3.)*sin(u*30.-t*13.+v*7.);'+
    'z+=A*.14*sin(v*4.+t*1.3+u*3.)*u;'+
    'return z;}'+
    'vec3 pos(vec2 g){float u=g.x,v=g.y;'+
    'float pull=.04*(1.+uWind)*u*(.6+.4*sin(u*6.2-uT*(3.6+2.4*uWind)+v*.8));'+
    'return vec3(u*1.9-pull,v-.06*u*u*(1.-.55*uWind)+.012*sin(u*9.-uT*4.)*u,hz(g));}'+
    'void main(){vec2 e=vec2(.004,0.);vec3 p=pos(aG);'+
    'vec3 du=pos(aG+e.xy)-pos(aG-e.xy),dv=pos(aG+e.yx)-pos(aG-e.yx);'+
    'vN=normalize(cross(du,dv));vUV=vec2(aG.x,1.-aG.y);vW=p;vZ=p.z;gl_Position=uPV*vec4(p,1.);}';
  var FFS=P+'varying vec2 vUV;varying vec3 vN;varying vec3 vW;varying float vZ;uniform sampler2D uTex;uniform vec3 uL;uniform vec3 uCam;uniform float uAmp;'+
    'void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;'+
    'vec3 L=normalize(uL),V=normalize(uCam-vW),H=normalize(L+V);'+
    'vec3 c=pow(texture2D(uTex,vUV).rgb,vec3(2.2));'+
    'float nl=dot(N,L),nv=max(dot(N,V),0.);'+
    'float ao=.76+.24*smoothstep(-uAmp,uAmp*.8,vZ);'+
    'vec3 sky=mix(vec3(.12,.16,.26),vec3(.32,.4,.58),N.y*.5+.5);'+
    'vec3 col=c*(sky*.42*ao+vec3(1.,.96,.9)*max(nl,0.)*1.3*mix(.7,1.,ao));'+
    'col+=c*vec3(1.,.92,.85)*max(-nl,0.)*.32;'+
    'float wv=sin(vUV.x*2600.)*sin(vUV.y*1400.);'+
    'col+=vec3(.9,.92,1.)*pow(max(dot(N,H),0.),36.)*(.10+.05*wv);'+
    'col+=vec3(.55,.62,.8)*pow(1.-nv,4.)*.18;'+
    'col=col/(col+vec3(.85))*1.55;col=pow(col,vec3(1./2.2));'+
    'gl_FragColor=vec4(col,1.);}';

  /* ---------- smooth-shaded pole, gold ball, halyard ---------- */
  var MVS='attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;uniform mat4 uPV;varying vec3 vN;varying vec4 vC;varying vec3 vW;'+
    'void main(){vN=aN;vC=aC;vW=aP;gl_Position=uPV*vec4(aP,1.);}';
  var MFS=P+'varying vec3 vN;varying vec4 vC;varying vec3 vW;uniform vec3 uL;uniform vec3 uCam;'+
    'void main(){vec3 N=normalize(vN);vec3 L=normalize(uL),V=normalize(uCam-vW),H=normalize(L+V);'+
    'float d=max(dot(N,L),0.);vec3 base=pow(vC.rgb,vec3(2.2));'+
    'vec3 env=mix(vec3(.05,.07,.12),vec3(.5,.58,.75),smoothstep(-.3,.8,reflect(-V,N).y));'+
    'vec3 col=base*(.18+.9*d)+mix(vec3(.04),base,vC.a)*env*vC.a*1.2+vec3(1.)*pow(max(dot(N,H),0.),mix(20.,120.,vC.a))*(.1+vC.a*1.4);'+
    'col=col/(col+vec3(.85))*1.55;gl_FragColor=vec4(pow(col,vec3(1./2.2)),1.);}';

  /* ---------- the eagle: real photo on a flexible card, depth-tested in the scene ---------- */
  var EVS='attribute vec2 aQ;uniform mat4 uPV;uniform vec3 uC;uniform vec3 uR;uniform vec3 uU;uniform vec4 uCell;varying vec2 vQ;'+
    'void main(){float lx=aQ.x-.5,ly=.5-aQ.y;vQ=uCell.xy+aQ*uCell.zw;gl_Position=uPV*vec4(uC+uR*lx+uU*ly,1.);}';
  var EFS=P+'varying vec2 vQ;uniform sampler2D uTex;uniform float uLit;'+
    'void main(){vec4 t=texture2D(uTex,vQ);if(t.a<.03)discard;'+
    'vec3 c=t.rgb/max(t.a,.001);c=pow(c,vec3(.8))*uLit;'+
    'gl_FragColor=vec4(c*t.a,t.a);}';
  var AT={n:22,cols:6,cw:336,ch:380,pad:8,w:320,h:364,size:2048};

  var fp,mp,ep,F={},M={},E={},tex,etex=null,flagIdx,flagN,meshBuf,eB,eI,eN,poleCount;
  try{
    fp=prog(FVS,FFS);mp=prog(MVS,MFS);ep=prog(EVS,EFS);
    F.aG=gl.getAttribLocation(fp,'aG');['uPV','uT','uWind','uTex','uL','uCam','uAmp'].forEach(function(n){F[n]=gl.getUniformLocation(fp,n);});
    M.aP=gl.getAttribLocation(mp,'aP');M.aN=gl.getAttribLocation(mp,'aN');M.aC=gl.getAttribLocation(mp,'aC');['uPV','uL','uCam'].forEach(function(n){M[n]=gl.getUniformLocation(mp,n);});
    E.aQ=gl.getAttribLocation(ep,'aQ');['uPV','uC','uR','uU','uCell','uTex','uLit'].forEach(function(n){E[n]=gl.getUniformLocation(ep,n);});
    var GX=110,GY=58,g=[],ix=[],i,j,a;
    for(j=0;j<=GY;j++)for(i=0;i<=GX;i++)g.push(i/GX,j/GY);
    for(j=0;j<GY;j++)for(i=0;i<GX;i++){a=j*(GX+1)+i;ix.push(a,a+1,a+GX+1,a+1,a+GX+2,a+GX+1);}
    F.vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,F.vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g),gl.STATIC_DRAW);
    flagIdx=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,flagIdx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ix),gl.STATIC_DRAW);flagN=ix.length;
    tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,flagTexture());gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(aniso)gl.texParameterf(gl.TEXTURE_2D,aniso.TEXTURE_MAX_ANISOTROPY_EXT,8);
    var q=[],qi=[],QX=1,QY=1;for(j=0;j<=QY;j++)for(i=0;i<=QX;i++)q.push(i/QX,j/QY);
    for(j=0;j<QY;j++)for(i=0;i<QX;i++){a=j*(QX+1)+i;qi.push(a,a+1,a+QX+1,a+1,a+QX+2,a+QX+1);}
    eB=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,eB);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(q),gl.STATIC_DRAW);
    eI=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,eI);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(qi),gl.STATIC_DRAW);eN=qi.length;
    meshBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,meshBuf);var pd=poleMesh();gl.bufferData(gl.ARRAY_BUFFER,pd,gl.STATIC_DRAW);poleCount=pd.length/10;
  }catch(e){ box.classList.add('no-gl'); return; }

  function poleMesh(){
    var out=[];function v(p,n,c){out.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],c[3]);}
    function cyl(X,Z,R,Y0,Y1,n,col){for(var i=0;i<n;i++){var a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
      var A=[X+R*c0,Y0,Z+R*s0],B=[X+R*c1,Y0,Z+R*s1],C=[X+R*c1,Y1,Z+R*s1],D=[X+R*c0,Y1,Z+R*s0],nA=[c0,0,s0],nB=[c1,0,s1];
      v(A,nA,col);v(B,nB,col);v(C,nB,col);v(A,nA,col);v(C,nB,col);v(D,nA,col);}}
    var X=-.038,Y1=1.1;
    cyl(X,0,.021,-1.3,Y1,24,[.82,.84,.88,.85]);          // brushed aluminium pole
    cyl(X,0,.026,Y1-.01,Y1+.012,24,[.7,.72,.76,.85]);    // truck
    cyl(X+.03,.012,.0045,-1.3,Y1-.02,8,[.62,.6,.56,.05]); // halyard rope
    var Cn=[X,Y1+.058,0],r=.052,GOLD=[.93,.72,.3,1],la=14,lo=24;
    function sp(t,p){var nn=[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)];return [[Cn[0]+r*nn[0],Cn[1]+r*nn[1],Cn[2]+r*nn[2]],nn];}
    for(var a=0;a<la;a++)for(var b=0;b<lo;b++){var t0=a/la*Math.PI,t1=(a+1)/la*Math.PI,q0=b/lo*Math.PI*2,q1=(b+1)/lo*Math.PI*2;
      var p00=sp(t0,q0),p10=sp(t1,q0),p11=sp(t1,q1),p01=sp(t0,q1);
      v(p00[0],p00[1],GOLD);v(p10[0],p10[1],GOLD);v(p11[0],p11[1],GOLD);v(p00[0],p00[1],GOLD);v(p11[0],p11[1],GOLD);v(p01[0],p01[1],GOLD);}
    return new Float32Array(out);
  }

  var eimg=new Image();eimg.decoding='async';
  eimg.onload=function(){try{etex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,etex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,eimg);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);kick();}catch(e){etex=null;}};
  eimg.src='/hero3d/img/eagle-flap.webp';

  /* ---------- matrices ---------- */
  function persp(f,a,n,fa){var t=1/Math.tan(f/2);return [t/a,0,0,0, 0,t,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0];}
  function lookAt(e,t){var fx=t[0]-e[0],fy=t[1]-e[1],fz=t[2]-e[2],fl=Math.hypot(fx,fy,fz);fx/=fl;fy/=fl;fz/=fl;
    var rx=-fz,rz=fx,rl=Math.hypot(rx,rz);rx/=rl;rz/=rl;var ux=-rz*fy,uy=rz*fx-rx*fz,uz=rx*fy;
    return {m:[rx,ux,-fx,0, 0,uy,-fy,0, rz,uz,-fz,0, -(rx*e[0]+rz*e[2]),-(ux*e[0]+uy*e[1]+uz*e[2]),(fx*e[0]+fy*e[1]+fz*e[2]),1],r:[rx,0,rz],u:[ux,uy,uz]};}
  function mul(a,b){var o=new Array(16);for(var c=0;c<4;c++)for(var r=0;r<4;r++){o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];}return o;}

  /* ---------- eagle flight: a wide soaring loop that passes behind and in front of the flag ---------- */
  var CX=.95,CY=.5,RX=1.55,RZ=1.15;
  function fpos(th){return [CX+RX*Math.cos(th),CY+.16*Math.sin(2*th+.6)+.05*Math.sin(th*3.1),RZ*Math.sin(th)];}

  /* ---------- interaction ---------- */
  var wind=.4,windT=.4,gust=0,mx=0,my=0,tmx=0,tmy=0;
  if(fine && !reduce){
    box.addEventListener('pointerenter',function(){windT=1;});
    box.addEventListener('pointerleave',function(){windT=.4;tmx=0;tmy=0;});
    box.addEventListener('pointermove',function(e){var r=box.getBoundingClientRect();tmx=((e.clientX-r.left)/r.width-.5)*2;tmy=((e.clientY-r.top)/r.height-.5)*2;});
  }
  box.addEventListener('pointerdown',function(){gust=1.3;kick();});

  /* ---------- render ---------- */
  var vis=true,raf=0,t0=performance.now(),T=reduce?2.2:0,th=reduce?-.6:-.9,flapT=8,frameI=8;
  if('IntersectionObserver' in window) new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis)kick();}).observe(box);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)kick();});
  function kick(){if(!raf)raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0;var dt=Math.min(.05,(now-t0)/1000);t0=now;
    if(document.hidden||!vis)return;
    if(!reduce){T+=dt;th+=dt*.42;}
    gust*=Math.pow(.3,dt);wind+=(windT-wind)*Math.min(1,dt*2.2);mx+=(tmx-mx)*.06;my+=(tmy-my)*.06;
    var w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
    var eye=[CX-.55+mx*.9,.66-my*.35,3.25],cam=lookAt(eye,[CX,.42,0]),PV=mul(persp(31*Math.PI/180,w/h,.1,30),cam.m);
    var L=[-.95,.6,.5],WIND=Math.min(2,wind+gust);
    // flag
    gl.useProgram(fp);gl.uniformMatrix4fv(F.uPV,false,PV);gl.uniform1f(F.uT,T);gl.uniform1f(F.uWind,WIND);gl.uniform1f(F.uAmp,.1+.08*WIND);
    gl.uniform3fv(F.uL,L);gl.uniform3fv(F.uCam,eye);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(F.uTex,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,F.vb);gl.enableVertexAttribArray(F.aG);gl.vertexAttribPointer(F.aG,2,gl.FLOAT,false,8,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,flagIdx);gl.drawElements(gl.TRIANGLES,flagN,gl.UNSIGNED_SHORT,0);gl.disableVertexAttribArray(F.aG);
    // pole
    gl.useProgram(mp);gl.uniformMatrix4fv(M.uPV,false,PV);gl.uniform3fv(M.uL,L);gl.uniform3fv(M.uCam,eye);
    gl.bindBuffer(gl.ARRAY_BUFFER,meshBuf);
    gl.enableVertexAttribArray(M.aP);gl.vertexAttribPointer(M.aP,3,gl.FLOAT,false,40,0);
    gl.enableVertexAttribArray(M.aN);gl.vertexAttribPointer(M.aN,3,gl.FLOAT,false,40,12);
    gl.enableVertexAttribArray(M.aC);gl.vertexAttribPointer(M.aC,4,gl.FLOAT,false,40,24);
    gl.drawArrays(gl.TRIANGLES,0,poleCount);gl.disableVertexAttribArray(M.aN);gl.disableVertexAttribArray(M.aC);gl.disableVertexAttribArray(M.aP);
    // eagle
    if(etex){
      var p=fpos(th),q=fpos(th+.02),vx=q[0]-p[0],vy=q[1]-p[1],vz=q[2]-p[2],vl=Math.hypot(vx,vy,vz);
      var sr=(vx*cam.r[0]+vz*cam.r[2])/vl, su=(vx*cam.u[0]+vy*cam.u[1]+vz*cam.u[2])/vl;   // heading on screen
      var hs=sr>=0?1:-1, turn=Math.max(.5,Math.min(1,Math.abs(sr)*1.5));            // narrows as it turns toward or away
      var ang=Math.atan2(su,Math.abs(sr))*.45, ca=Math.cos(ang), sa=Math.sin(ang);     // nose follows the climb
      var size=.66,Wd=size*turn,Hd=size*AT.h/AT.w;
      // the clip's eagle faces left: image +x points away from the heading; mirrored when heading right
      var R=[(-hs*ca*cam.r[0]-sa*cam.u[0])*Wd,(-sa*cam.u[1])*Wd,(-hs*ca*cam.r[2]-sa*cam.u[2])*Wd];
      var U=[(-hs*sa*cam.r[0]+ca*cam.u[0])*Hd,(ca*cam.u[1])*Hd,(-hs*sa*cam.r[2]+ca*cam.u[2])*Hd];
      // wingbeat: 22 frames at 30 fps; on descents finish the stroke, then hold the level-wing frame and glide
      var glide=su<-.18;
      if(!(glide&&frameI===8)&&!reduce)flapT+=dt*30;
      frameI=Math.floor(flapT)%AT.n;
      var col=frameI%AT.cols,row=Math.floor(frameI/AT.cols);
      gl.useProgram(ep);gl.uniformMatrix4fv(E.uPV,false,PV);gl.uniform3fv(E.uC,p);gl.uniform3fv(E.uR,R);gl.uniform3fv(E.uU,U);
      gl.uniform4f(E.uCell,(col*AT.cw+AT.pad)/AT.size,(row*AT.ch+AT.pad)/AT.size,AT.w/AT.size,AT.h/AT.size);
      gl.uniform1f(E.uLit,p[2]<0?1.05:1.22);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,etex);gl.uniform1i(E.uTex,0);
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.bindBuffer(gl.ARRAY_BUFFER,eB);gl.enableVertexAttribArray(E.aQ);gl.vertexAttribPointer(E.aQ,2,gl.FLOAT,false,8,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,eI);gl.drawElements(gl.TRIANGLES,eN,gl.UNSIGNED_SHORT,0);gl.disableVertexAttribArray(E.aQ);
      gl.disable(gl.BLEND);
    }
    box.classList.add('on');
    if(!reduce||gust>.01||!etex)raf=requestAnimationFrame(frame);
  }
  if(document.readyState==='complete')kick();else window.addEventListener('load',kick);
})();
