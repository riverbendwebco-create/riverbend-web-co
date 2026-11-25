/* Riverbend hero: 3D waving U.S. flag with a bald eagle circling it.
   Plain WebGL, no libraries. Decorative only (aria-hidden); hides itself if WebGL is unavailable. */
(function(){
  'use strict';
  var box=document.querySelector('.h3-flag'); if(!box) return;
  var canvas=box.querySelector('canvas');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  var small=matchMedia('(max-width: 980px)').matches;
  var gl;
  try{ gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,depth:true}); }catch(e){}
  if(!gl){ box.classList.add('no-gl'); return; }
  var dpr=Math.min(window.devicePixelRatio||1,2);

  /* ---------- flag texture (official proportions: 13 stripes, canton 7/13 tall and 0.76 of hoist wide, 50 stars) ---------- */
  function flagTexture(){
    var H=540, W=Math.round(H*1.9), c=document.createElement('canvas'); c.width=W; c.height=H;
    var x=c.getContext('2d'), sh=H/13;
    for(var i=0;i<13;i++){ x.fillStyle=i%2?'#FFFFFF':'#B22234'; x.fillRect(0,Math.round(i*sh),W,Math.ceil(sh)+1); }
    var cw=H*.76, ch=sh*7; x.fillStyle='#3C3B6E'; x.fillRect(0,0,cw,ch);
    var r=H*.0616/2; x.fillStyle='#FFFFFF';
    function star(cx,cy){ x.beginPath(); for(var k=0;k<10;k++){ var a=-Math.PI/2+k*Math.PI/5, rr=k%2?r*.382:r; x.lineTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a)); } x.closePath(); x.fill(); }
    for(var row=0;row<9;row++){ var n=row%2?5:6; for(var j=0;j<n;j++){ star(cw*(row%2?(2*j+2):(2*j+1))/12, ch*(row+1)/10); } }
    return c;
  }

  function sh(t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function prog(v,f){var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('link');return p;}
  var P='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';

  /* cloth: travelling waves pinned at the pole, analytic normals */
  var FVS='attribute vec2 aG;uniform mat4 uPV;uniform float uT;uniform float uWind;varying vec2 vUV;varying vec3 vN;varying vec3 vW;varying float vFold;'+
    'void main(){float u=aG.x,v=aG.y;float W=1.9,H=1.;'+
    'float A=(.05+.09*uWind)*u;float s=4.+2.5*uWind;'+
    'float p1=u*W*3.2-uT*s+v*.9,p2=u*W*5.9-uT*s*1.55+v*2.3;'+
    'float z=A*(sin(p1)+.32*sin(p2));'+
    'float dA=(.05+.09*uWind)/W;'+
    'float dzx=A*(3.2*cos(p1)+.32*5.9*cos(p2))+dA*(sin(p1)+.32*sin(p2));'+
    'float dzy=A*(.9*cos(p1)+.32*2.3*cos(p2))/H;'+
    'vec3 p=vec3(u*W-.035*u*(1.+uWind)*(1.-cos(p1)),v*H-.05*u*u*(1.-.6*uWind),z);'+
    'vN=normalize(vec3(-dzx,-dzy,1.));vUV=vec2(u,1.-v);vW=p;vFold=sin(p1);gl_Position=uPV*vec4(p,1.);}';
  var FFS=P+'varying vec2 vUV;varying vec3 vN;varying vec3 vW;varying float vFold;uniform sampler2D uTex;uniform vec3 uL;uniform vec3 uCam;'+
    'void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 L=normalize(uL),V=normalize(uCam-vW);'+
    'vec3 c=texture2D(uTex,vUV).rgb;float d=max(dot(N,L),0.);'+
    'vec3 col=c*(.42+.62*d)+vec3(1.)*pow(max(dot(reflect(-L,N),V),0.),22.)*.22;'+
    'col+=vec3(.25,.45,1.)*pow(1.-max(dot(N,V),0.),3.)*.18;'+
    'gl_FragColor=vec4(col,1.);}';
  /* faceted lit meshes: pole, finial, eagle */
  var MVS='attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;uniform mat4 uPV;varying vec3 vN;varying vec4 vC;varying vec3 vW;'+
    'void main(){vN=aN;vC=aC;vW=aP;gl_Position=uPV*vec4(aP,1.);}';
  var MFS=P+'varying vec3 vN;varying vec4 vC;varying vec3 vW;uniform vec3 uL;uniform vec3 uCam;'+
    'void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 L=normalize(uL),V=normalize(uCam-vW);'+
    'float d=max(dot(N,L),0.);vec3 col=vC.rgb*(.36+.7*d);'+
    'col+=vec3(1.)*pow(max(dot(reflect(-L,N),V),0.),mix(12.,60.,vC.a))*(.12+vC.a*.9);'+
    'col+=vec3(.2,.4,1.)*pow(1.-max(dot(N,V),0.),2.5)*.25;'+
    'gl_FragColor=vec4(col,1.);}';

  var fp,mp,F={},M={},tex,flagIdx,flagN,meshBuf;
  try{
    fp=prog(FVS,FFS); mp=prog(MVS,MFS);
    F.aG=gl.getAttribLocation(fp,'aG'); ['uPV','uT','uWind','uTex','uL','uCam'].forEach(function(n){F[n]=gl.getUniformLocation(fp,n);});
    M.aP=gl.getAttribLocation(mp,'aP');M.aN=gl.getAttribLocation(mp,'aN');M.aC=gl.getAttribLocation(mp,'aC');
    ['uPV','uL','uCam'].forEach(function(n){M[n]=gl.getUniformLocation(mp,n);});
    // flag grid
    var GX=48,GY=26,g=[],ix=[];
    for(var j=0;j<=GY;j++)for(var i=0;i<=GX;i++)g.push(i/GX,j/GY);
    for(j=0;j<GY;j++)for(i=0;i<GX;i++){var a=j*(GX+1)+i;ix.push(a,a+1,a+GX+1,a+1,a+GX+2,a+GX+1);}
    F.vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,F.vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g),gl.STATIC_DRAW);
    flagIdx=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,flagIdx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ix),gl.STATIC_DRAW);flagN=ix.length;
    tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,flagTexture());
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    meshBuf=gl.createBuffer();
  }catch(e){ box.classList.add('no-gl'); return; }

  /* ---------- mesh helpers (flat-shaded triangles: pos3 nor3 col4) ---------- */
  var out=[];
  function tri(a,b,c,col){
    var ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    var nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
    [a,b,c].forEach(function(p){out.push(p[0],p[1],p[2],nx,ny,nz,col[0],col[1],col[2],col[3]);});
  }
  function quad(a,b,c,d,col){tri(a,b,c,col);tri(a,c,d,col);}

  function pole(){
    var X=-.035,R=.022,Y0=-1.2,Y1=1.1,n=10,SIL=[.78,.82,.88,.85];
    for(var i=0;i<n;i++){var a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2;
      var p0=[X+R*Math.cos(a0),Y0,R*Math.sin(a0)],p1=[X+R*Math.cos(a1),Y0,R*Math.sin(a1)];
      quad(p0,p1,[p1[0],Y1,p1[2]],[p0[0],Y1,p0[2]],SIL);}
    // gold finial: low-poly sphere
    var C=[X,Y1+.055,0],r=.05,GOLD=[.96,.74,.24,.9],la=6,lo=10;
    function sp(t,p){return [C[0]+r*Math.sin(t)*Math.cos(p),C[1]+r*Math.cos(t),C[2]+r*Math.sin(t)*Math.sin(p)];}
    for(var a=0;a<la;a++)for(var b=0;b<lo;b++){var t0=a/la*Math.PI,t1=(a+1)/la*Math.PI,q0=b/lo*Math.PI*2,q1=(b+1)/lo*Math.PI*2;
      quad(sp(t0,q0),sp(t1,q0),sp(t1,q1),sp(t0,q1),GOLD);}
  }

  /* bald eagle, local frame: x forward, y up, z to the right wing. a1/a2 = shoulder/wrist flap angles */
  var BROWN=[.27,.17,.09,.15],DARK=[.16,.1,.06,.12],WING=[.22,.14,.08,.12],WHITE=[.96,.96,.93,.25],GOLD=[.98,.72,.16,.5];
  function eagleLocal(a1,a2){
    var parts=[];
    function T(a,b,c,col){parts.push([a,b,c,col]);}
    // body rings: x, half-height, half-width, y-offset, colour
    var rings=[[.30,.024,.02,.004,GOLD],[.25,.045,.04,.012,WHITE],[.19,.052,.05,.008,WHITE],[.12,.062,.066,.002,WHITE],
               [.05,.076,.08,-.004,BROWN],[-.06,.07,.075,-.01,BROWN],[-.16,.044,.05,0,BROWN],[-.22,.02,.03,.006,WHITE]];
    var K=6, ringPts=rings.map(function(r){var pts=[];for(var k=0;k<K;k++){var a=k/K*Math.PI*2;pts.push([r[0],r[3]+r[1]*Math.sin(a),r[2]*Math.cos(a)]);}return pts;});
    var tip=[.37,-.006,0];
    for(var k=0;k<K;k++)T(tip,ringPts[0][(k+1)%K],ringPts[0][k],GOLD);
    for(var i=0;i<rings.length-1;i++)for(k=0;k<K;k++){var A=ringPts[i][k],B=ringPts[i][(k+1)%K],C=ringPts[i+1][(k+1)%K],D=ringPts[i+1][k];
      var col=rings[i+1][4];T(A,B,C,col);T(A,C,D,col);}
    var last=ringPts[rings.length-1],tc=[-.22,.006,0];for(k=0;k<K;k++)T(tc,last[k],last[(k+1)%K],WHITE);
    // tail fan
    T([-.2,.012,.03],[-.42,0,.12],[-.45,.002,0],WHITE);T([-.2,.012,-.03],[-.45,.002,0],[-.42,0,-.12],WHITE);T([-.2,.012,.03],[-.45,.002,0],[-.2,.012,-.03],WHITE);
    // feet tucked under the tail
    T([-.14,-.04,.025],[-.24,-.03,.03],[-.2,-.05,.01],GOLD);T([-.14,-.04,-.025],[-.2,-.05,-.01],[-.24,-.03,-.03],GOLD);
    // wings
    [1,-1].forEach(function(sd){
      var Y0=.045,Z0=.07,ci=Math.cos(a1),si=Math.sin(a1),co=Math.cos(a1+a2),so=Math.sin(a1+a2);
      function inner(x,z){var s=z-Z0;return [x,Y0+s*si,sd*(Z0+s*ci)];}
      var E=[0,Y0+.23*si,Z0+.23*ci];
      function outer(x,z){var s=z-.30;return [x,E[1]+s*so,sd*(E[2]+s*co)];}
      var sL=inner(.1,.07),sT=inner(-.07,.07),eL=inner(.09,.30),eT=inner(-.13,.30);
      var oL=outer(.09,.30),oT=outer(-.13,.30),tL=outer(.04,.53),tT=outer(-.12,.5);
      T(sL,eL,eT,WING);T(sL,eT,sT,WING);
      T(oL,tL,tT,DARK);T(oL,tT,oT,DARK);
      // covert stripe for depth
      var mL=inner(.095,.2),mT=inner(.0,.2);T(sL,mL,mT,BROWN);
      // primary feathers (fingers)
      var tips=[[.03,.66],[0,.69],[-.035,.69],[-.07,.66],[-.1,.61]];
      for(var f=0;f<5;f++){var b0=outer(.04-(.16*f/5),.53-.03*f/5),b1=outer(.04-(.16*(f+1)/5),.53-.03*(f+1)/5),tp=outer(tips[f][0],tips[f][1]);T(b0,tp,b1,DARK);}
      // secondary feather trailing edge
      T(sT,eT,inner(-.17,.22),DARK);T(oT,tT,outer(-.17,.42),DARK);
    });
    return parts;
  }

  /* ---------- camera / matrices ---------- */
  function persp(f,a,n,fa){var t=1/Math.tan(f/2);return [t/a,0,0,0, 0,t,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0];}
  function lookAt(e,t){var fx=t[0]-e[0],fy=t[1]-e[1],fz=t[2]-e[2],fl=Math.hypot(fx,fy,fz);fx/=fl;fy/=fl;fz/=fl;
    var rx=-fz,ry=0,rz=fx,rl=Math.hypot(rx,rz);rx/=rl;rz/=rl;var ux=ry*fz-rz*fy,uy=rz*fx-rx*fz,uz=rx*fy-ry*fx;
    return [rx,ux,-fx,0, ry,uy,-fy,0, rz,uz,-fz,0, -(rx*e[0]+ry*e[1]+rz*e[2]),-(ux*e[0]+uy*e[1]+uz*e[2]),(fx*e[0]+fy*e[1]+fz*e[2]),1];}
  function mul(a,b){var o=new Array(16);for(var c=0;c<4;c++)for(var r=0;r<4;r++){o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];}return o;}

  /* ---------- eagle flight: an orbit around the flag that passes behind and in front of it ---------- */
  var CX=.95,CY=.52,RX=1.5,RZ=1.05;
  function flightPos(th){return [CX+RX*Math.cos(th),CY+.2*Math.sin(2*th+.6)+.06*Math.sin(th*3.),RZ*Math.sin(th)];}
  function eagleWorld(th,t){
    var p=flightPos(th),q=flightPos(th+.01),dx=q[0]-p[0],dy=q[1]-p[1],dz=q[2]-p[2],dl=Math.hypot(dx,dy,dz);dx/=dl;dy/=dl;dz/=dl;
    // right = forward x up, then bank into the turn
    var rx=dy*0-dz*1,ry=dz*0-dx*0,rz=dx*1-dy*0,rl=Math.hypot(rx,ry,rz);rx/=rl;ry/=rl;rz/=rl;
    var ux=ry*dz-rz*dy,uy=rz*dx-rx*dz,uz=rx*dy-ry*dx;
    var bank=.42,cb=Math.cos(bank),sb=Math.sin(bank);
    var Ux=ux*cb+rx*sb,Uy=uy*cb+ry*sb,Uz=uz*cb+rz*sb, Rx=rx*cb-ux*sb,Ry=ry*cb-uy*sb,Rz=rz*cb-uz*sb;
    // flap while climbing, glide while descending
    var climb=Math.max(0,Math.min(1,dy*6+.5)), ph=t*2*Math.PI*2.1;
    var a1=.14*(1-climb)+climb*(.55*Math.sin(ph)+.08), a2=-.06*(1-climb)+climb*(.38*Math.sin(ph-.8));
    var S=.62, parts=eagleLocal(a1,a2);
    function W(v){return [p[0]+S*(v[0]*dx+v[1]*Ux+v[2]*Rx),p[1]+S*(v[0]*dy+v[1]*Uy+v[2]*Ry),p[2]+S*(v[0]*dz+v[1]*Uz+v[2]*Rz)];}
    parts.forEach(function(t3){tri(W(t3[0]),W(t3[1]),W(t3[2]),t3[3]);});
  }

  /* ---------- interaction ---------- */
  var wind=.35,windT=.35,gust=0,mx=0,my=0,tmx=0,tmy=0;
  if(fine && !reduce){
    box.addEventListener('pointerenter',function(){windT=1;});
    box.addEventListener('pointerleave',function(){windT=.35;tmx=0;tmy=0;});
    box.addEventListener('pointermove',function(e){var r=box.getBoundingClientRect();tmx=((e.clientX-r.left)/r.width-.5)*2;tmy=((e.clientY-r.top)/r.height-.5)*2;});
  }
  box.addEventListener('pointerdown',function(){gust=1.4;kick();});

  /* ---------- render loop ---------- */
  var vis=true,raf=0,t0=performance.now(),T=reduce?2.2:0,th=reduce?-.7:-.9;
  if('IntersectionObserver' in window) new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis)kick();}).observe(box);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)kick();});
  function kick(){if(!raf)raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0; var dt=Math.min(.05,(now-t0)/1000); t0=now;
    if(document.hidden||!vis) return;
    if(!reduce){T+=dt;th+=dt*.5;}
    gust*=Math.pow(.25,dt); wind+=(windT-wind)*Math.min(1,dt*2.5); mx+=(tmx-mx)*.06; my+=(tmy-my)*.06;
    var w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
    var eye=[CX+mx*.9,.7-my*.35,3.3],PV=mul(persp(31*Math.PI/180,w/h,.1,30),lookAt(eye,[CX,.42,0]));
    var L=[.6,.9,.8];
    // flag
    gl.useProgram(fp);gl.uniformMatrix4fv(F.uPV,false,PV);gl.uniform1f(F.uT,T);gl.uniform1f(F.uWind,Math.min(2,wind+gust));
    gl.uniform3fv(F.uL,L);gl.uniform3fv(F.uCam,eye);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(F.uTex,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,F.vb);gl.enableVertexAttribArray(F.aG);gl.vertexAttribPointer(F.aG,2,gl.FLOAT,false,8,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,flagIdx);gl.drawElements(gl.TRIANGLES,flagN,gl.UNSIGNED_SHORT,0);
    gl.disableVertexAttribArray(F.aG);
    // pole + eagle
    out=[];pole();eagleWorld(th,T);
    var data=new Float32Array(out);
    gl.useProgram(mp);gl.uniformMatrix4fv(M.uPV,false,PV);gl.uniform3fv(M.uL,L);gl.uniform3fv(M.uCam,eye);
    gl.bindBuffer(gl.ARRAY_BUFFER,meshBuf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(M.aP);gl.vertexAttribPointer(M.aP,3,gl.FLOAT,false,40,0);
    gl.enableVertexAttribArray(M.aN);gl.vertexAttribPointer(M.aN,3,gl.FLOAT,false,40,12);
    gl.enableVertexAttribArray(M.aC);gl.vertexAttribPointer(M.aC,4,gl.FLOAT,false,40,24);
    gl.drawArrays(gl.TRIANGLES,0,data.length/10);
    gl.disableVertexAttribArray(M.aN);gl.disableVertexAttribArray(M.aC);
    box.classList.add('on');
    if(!reduce || gust>.01) raf=requestAnimationFrame(frame);
  }
  if(document.readyState==='complete') kick(); else window.addEventListener('load',kick);
})();
