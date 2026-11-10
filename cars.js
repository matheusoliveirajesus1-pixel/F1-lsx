// ===================== CARROS 2026 DETALHADOS =====================
// Modelo em peças (assoalho, rodas com faixa do composto, asa dianteira com placas laterais, bico, cockpit com halo e capacete,
// sidepods com entrada de ar, cobertura do motor com barbatana, asa traseira ativa e difusor), luz de chuva, freios em brasa
// e o ar: linhas do vácuo atrás do carro da frente e o ar sujo nas curvas.
function helmetCol(c){const h=hashS((c.code||"")+"cap")%360;return`hsl(${h},85%,${55+(hashS(c.code||"x")%20)}%)`}
function carAero(c){if(!R||!R.geo||!R.geo.ai||!c.prog&&c.prog!==0)return false;const i=Math.floor(fr(c.prog)*R.geo.N)%R.geo.N;return R.geo.ai.ph[i]===0&&(c.v||0)>45&&!!(R.geo.zoneMask&&R.geo.zoneMask[i])&&!R.sc}
function drawCar(ctx,cw,ch,c,p,detail,o){const Z=CAM.z,h=p.h,co=Math.cos(h),si=Math.sin(h),zb=(o&&o.z)||0;
  const pt=(u,v,z)=>{u*=CSC;v*=CSC;return toScreen(p.x+u*co-v*si,p.y+u*si+v*co,z*CSC+zb,cw,ch)};
  {const s0=pt(0,0,0);if(s0[0]<-90||s0[0]>cw+90||s0[1]<-90||s0[1]>ch+90)return}// fora da tela: nada a desenhar
  if(!detail||Z<.5){const s=pt(0,0,0);ctx.fillStyle=c.col;ctx.strokeStyle=c.isP?"#FFF":"#0A0C10";ctx.lineWidth=c.isP?2:1.2;ctx.beginPath();ctx.arc(s[0],s[1],c.isP?5:3.8,0,7);ctx.fill();ctx.stroke();return}
  if(c.sc){drawSafetyCar(ctx,c,pt,co,si,Z);return}
  const col=c.col,c2=c.col2||"#222",wreck=!!c.wreck,dm=c.dmg||{},night=R&&R.C&&R.C.night;
  const hi=Z>1.05;// detalhes finos só de perto
  // luz: faces voltadas para +x ficam mais claras
  const lit=(nu,nv)=>{const nx=nu*co-nv*si,ny=nu*si+nv*co;return{vis:nx+ny>-.02,b:.7+.16*(nx-ny)/1.4142}};
  const quad=(a,fill)=>{poly(ctx,a);ctx.fillStyle=fill;ctx.fill()};
  // sólido: contorno de cima (u,v,z) descendo até z0; lados visíveis e tampa
  const solid=(top,z0,cTop,cSide,noTop)=>{let A=0;for(let i=0;i<top.length;i++){const a=top[i],b=top[(i+1)%top.length];A+=a[0]*b[1]-b[0]*a[1]}const sg=A>0?1:-1;
    for(let i=0;i<top.length;i++){const a=top[i],b=top[(i+1)%top.length];const du=b[0]-a[0],dv=b[1]-a[1];const L=Math.hypot(du,dv)||1;const nu=dv/L*sg,nv=-du/L*sg;const l=lit(nu,nv);if(!l.vis)continue;
      quad([pt(a[0],a[1],z0),pt(b[0],b[1],z0),pt(b[0],b[1],b[2]),pt(a[0],a[1],a[2])],shade(cSide,l.b))}
    if(!noTop)quad(top.map(q=>pt(q[0],q[1],q[2])),cTop)};
  const depth=(u,v)=>(u*co-v*si)+(u*si+v*co);// maior = mais perto da câmera
  const frontNear=depth(1,0)>depth(-1,0);
  const aero=!wreck&&carAero(c);
  // sombra
  ctx.fillStyle="rgba(0,0,0,.32)";poly(ctx,[pt(-12.4,-4.6,-zb/CSC),pt(9,-5.2,-zb/CSC),pt(12.8,-5.6,-zb/CSC),pt(12.8,5.6,-zb/CSC),pt(9,5.2,-zb/CSC),pt(-12.4,4.6,-zb/CSC)].map(s=>[s[0]+1.2*Z,s[1]+.8*Z]));ctx.fill();
  // assoalho
  solid([[-10.6,-3.9,.7],[5.6,-3.9,.7],[8.2,-1.2,.7],[8.2,1.2,.7],[5.6,3.9,.7],[-10.6,3.9,.7]],.35,"#17191C","#0E0F11");
  // rodas
  const steer=(()=>{if(!R||!R.geo||c.wreck)return 0;if(c.dyn&&c.dyn.steer!=null&&!(typeof MP!=="undefined"&&MP.inRace&&MP.role!=="h"))return c.dyn.steer;/* volante real do núcleo de dinâmica */const g=TRACKGEO;if(!g)return 0;const i=Math.floor(fr(c.prog||0)*g.M)%g.M;return clamp((g.scurv[i]||0)*5.5,-.32,.32)})();
  const wheels=[{u:7.6,v:4.5,r:1.6,w:1.6,f:1,k:0},{u:7.6,v:-4.5,r:1.6,w:1.6,f:1,k:1},{u:-8.3,v:4.7,r:1.8,w:2,k:2},{u:-8.3,v:-4.7,r:1.8,w:2,k:3}].filter(w=>dm.off!==w.k);// roda arrancada some
  if(!wreck&&dm.wing>=.5)wheels.length=wheels.length;
  const comp=c.tyre&&COMP[c.tyre.c]?COMP[c.tyre.c].c:"#DDD",pun=c.tyre&&c.tyre.punct;
  const hot=c.mc?clamp(((c.mc.tBrk||300)-480)/520,0,1):0,glow=!wreck&&c._brake&&hot>0?hot:0;
  const drawWheel=w=>{// roda torta (dano na suspensão daquele canto): convergência errada; suspensão quebrada: roda caída para dentro
    const wd=(!wreck||c.dmg)&&dm.whl?(dm.whl[w.k]||0):0,toe=wd>.3?(wd-.3)*.6*(w.k%2?1:-1):0,broke=wd>.75||(w.f?0:(dm.susp||0)>.85&&w.k===3);
    const a=(w.f?steer:0)+toe,ca=Math.cos(a),sa=Math.sin(a);const wv=broke?w.v*.84:w.v;const L=(du,dv,z)=>pt(w.u+du*ca-dv*sa,wv+du*sa+dv*ca,z);const r=w.r,hw=w.w/2,zc=r;
    const flat=pun&&(c.tyre.pw!=null?w.k===c.tyre.pw:(w.f&&w.v<0));const zr=flat||broke?r*.74:r;
    const out=Math.sign(w.v);const ax=-(Math.sin(h+a))*out,ay=Math.cos(h+a)*out;const outVis=ax+ay>0;// eixo da roda apontando para fora
    if(!hi){// de longe: caixa simples
      const top=[[-r*.92,-hw],[r*.92,-hw],[r*.92,hw],[-r*.92,hw]];quad(top.map(q=>L(q[0],q[1],0)).concat([]),"#141518");
      quad([L(-r*.92,-hw,zr*1.84),L(r*.92,-hw,zr*1.84),L(r*.92,hw,zr*1.84),L(-r*.92,hw,zr*1.84)],"#2C2E33");
      for(const sv of[-1,1]){if((sv===out)!==outVis)continue;quad([L(-r*.92,sv*hw,0),L(r*.92,sv*hw,0),L(r*.92,sv*hw,zr*1.84),L(-r*.92,sv*hw,zr*1.84)],"#1D1F23")}
      const a1=L(-r*.5,out*hw,zr*1.9),b1=L(r*.5,out*hw,zr*1.9);ctx.strokeStyle=comp;ctx.lineWidth=Math.max(.6,.7*Z);ctx.beginPath();ctx.moveTo(a1[0],a1[1]);ctx.lineTo(b1[0],b1[1]);ctx.stroke()}
    else{const N=16,inn=[],outr=[];for(let k=0;k<N;k++){const t=k/N*Math.PI*2;inn.push(L(Math.cos(t)*r,-out*hw,zr+Math.sin(t)*zr));outr.push(L(Math.cos(t)*r,out*hw,zr+Math.sin(t)*zr))}
      const back=outVis?inn:outr,front=outVis?outr:inn;quad(back,"#111214");
      const uxw=Math.cos(h+a),uyw=Math.sin(h+a);
      for(let k=0;k<N;k++){const t=(k+.5)/N*Math.PI*2;const f=Math.cos(t)*(uxw+uyw)*.7+Math.sin(t);if(f<-.05)continue;const j=(k+1)%N;quad([inn[k],inn[j],outr[j],outr[k]],shade("#2B2D31",.75+.35*clamp(f,0,1)))}
      quad(front,"#18191C");
      if(outVis){const ring=[],rim=[];for(let k=0;k<14;k++){const t=k/14*Math.PI*2;ring.push(L(Math.cos(t)*r*.8,out*hw*1.01,zr+Math.sin(t)*zr*.8));rim.push(L(Math.cos(t)*r*.48,out*hw*1.02,zr+Math.sin(t)*zr*.48))}
        ctx.strokeStyle=wreck?"#555":comp;ctx.lineWidth=Math.max(.8,.55*Z);poly(ctx,ring);ctx.stroke();quad(rim,"#3A3D42");
        if(glow&&w.f){const cc=L(0,out*hw,zr);ctx.fillStyle=`rgba(255,${120+glow*60|0},40,${.25+glow*.6})`;ctx.beginPath();ctx.arc(cc[0],cc[1],Math.max(1.5,r*.5*CSC*Z),0,7);ctx.fill()}}}
    // disco em brasa visto por dentro da roda
    if(glow){const cc=L(0,-out*hw*.6,zr);ctx.fillStyle=`rgba(255,${110+glow*70|0},30,${.2+glow*.55})`;ctx.beginPath();ctx.arc(cc[0],cc[1],Math.max(1.4,r*.55*CSC*Z),0,7);ctx.fill()}};
  const far=wheels.filter(w=>depth(w.u,w.v)<depth(w.u,0)),near=wheels.filter(w=>depth(w.u,w.v)>=depth(w.u,0));
  // asa traseira ou dianteira que fica longe da câmera: desenhar antes do corpo
  const frontWing=()=>{// cada lado da asa quebra separado; bico destruído leva a asa toda
    const gone=(dm.nose||0)>=.6||(dm.wing>=.95&&!dm.wingL&&!dm.wingR);if(!wreck&&gone){quad([pt(10.8,-.6,.9),pt(12.6,-.6,.9),pt(13.4,3.6,.4),pt(11.6,4.2,.4)],c2);return}
    const vL=(dm.wingL||0)>=.6?.9:(dm.wingL||0)>=.3?3.6:5.7,vR=-((dm.wingR||0)>=.6?.9:(dm.wingR||0)>=.3?3.6:5.7);const fz=aero?.95:1.25;
    quad([pt(10.6,vR,.75),pt(12.8,vR*.95,.75),pt(12.8,vL*.95,.75),pt(10.6,vL,.75)],"#1D1F23");// plano principal
    quad([pt(10.1,vR+.2,fz),pt(11.0,vR+.4,fz+.25),pt(11.0,vL-.2,fz+.25),pt(10.1,vL-.2,fz)],c2);// flap
    if(hi)quad([pt(9.6,vR+.4,fz+.35),pt(10.2,vR+.6,fz+.6),pt(10.2,vL-.4,fz+.6),pt(9.6,vL-.4,fz+.35)],col);
    for(const sv of[vR,vL]){if(Math.abs(sv)<5)continue;quad([pt(9.4,sv,.5),pt(12.9,sv,.5),pt(12.9,sv,1.6),pt(9.4,sv,2.0)],shade(c2,.8))}
    // pedaço pendurado (peça solta)
    if(dm.loose&&!wreck){const sv=(dm.wingL||0)>(dm.wingR||0)?1:-1;quad([pt(11.2,sv*1.2,.4),pt(12.6,sv*1.4,.2),pt(13.2,sv*3.6,.05),pt(11.8,sv*3.4,.2)],c2)}};
  const rearWing=()=>{const broken=dm.rwing>=.5;const ez=broken?4.2:5.9;
    for(const sv of[-4.3,4.3])quad([pt(-12.8,sv,1.3),pt(-10.0,sv,1.6),pt(-10.0,sv,ez),pt(-12.8,sv,ez)],shade(c2,.85));
    quad([pt(-12.0,-1.4,1.0),pt(-10.4,-1.2,1.0),pt(-10.4,-1.2,2.4),pt(-12.0,-1.4,2.4)],"#202226");// pilar
    if(broken){quad([pt(-13,-4.3,ez),pt(-10.6,-4.3,ez),pt(-10.2,3.6,ez-1.8),pt(-12.6,3.6,ez-1.8)],c2);return}
    quad([pt(-12.7,-4.2,4.7),pt(-11.2,-4.2,5.0),pt(-11.2,4.2,5.0),pt(-12.7,4.2,4.7)],c2);// plano principal
    if(aero)quad([pt(-11.0,-4.2,5.9),pt(-10.4,-4.2,5.95),pt(-10.4,4.2,5.95),pt(-11.0,4.2,5.9)],col);// flap aberto (modo reta)
    else quad([pt(-11.1,-4.2,5.1),pt(-10.2,-4.2,5.75),pt(-10.2,4.2,5.75),pt(-11.1,4.2,5.1)],col);
    if(hi)quad([pt(-12.4,-3.6,2.3),pt(-11.4,-3.6,2.4),pt(-11.4,3.6,2.4),pt(-12.4,3.6,2.3)],"#26292E");// beam wing
    // luz de chuva
    const blink=(R&&R.w>.25)||c.clip||(night&&!wreck);if(!wreck&&blink&&Math.floor(performance.now()/260)%2===0){const q=pt(-12.9,0,2.7);ctx.fillStyle="#FF2A2A";ctx.fillRect(q[0]-1.6,q[1]-1.2,3.2,2.4);ctx.fillStyle="rgba(255,40,40,.25)";ctx.beginPath();ctx.arc(q[0],q[1],5*Math.max(.8,Z*.8),0,7);ctx.fill()}};
  if(!frontNear)frontWing();else rearWing();
  far.forEach(drawWheel);
  // difusor
  quad([pt(-10.6,-3.5,.7),pt(-12.6,-3.2,1.4),pt(-12.6,3.2,1.4),pt(-10.6,3.5,.7)],"#121315");
  // sidepods com rebaixo (downwash) e entrada de ar
  const dark=shade(col,.55);
  for(const sv of[1,-1]){const sp=[[3.6,1.3*sv,2.3],[3.6,3.75*sv,2.15],[.5,4.0*sv,2.0],[-3.6,3.6*sv,1.6],[-7.4,2.1*sv,1.25],[-7.6,1.2*sv,1.4]];solid(sv>0?sp:sp.slice().reverse(),.7,col,col);
    const inl=[pt(3.62,1.6*sv,2.15),pt(3.62,3.5*sv,2.0),pt(3.62,3.4*sv,1.35),pt(3.62,1.7*sv,1.4)];quad(inl,"#0B0C0E");
    if(hi){quad([pt(2.6,2.2*sv,2.24),pt(-2.2,2.5*sv,1.95),pt(-2.2,3.1*sv,1.85),pt(2.6,3.0*sv,2.15)],c2)}}
  // monocoque e bico
  solid([[-1.4,-1.45,2.9],[4.4,-1.35,2.75],[4.4,1.35,2.75],[-1.4,1.45,2.9]],.7,col,col);
  solid([[4.3,-1.25,2.7],[11.2,-.42,1.55],[11.2,.42,1.55],[4.3,1.25,2.7]],1.0,shade(col,1.08),col);
  quad([pt(4.4,-.35,2.76),pt(10.8,-.15,1.62),pt(10.8,.15,1.62),pt(4.4,.35,2.76)],c2);// faixa no bico
  // cobertura do motor com entrada de ar sobre o piloto e barbatana
  solid([[-1.3,-1.3,3.75],[-1.3,1.3,3.75],[-5,1.25,3.0],[-9.4,.6,2.1],[-9.4,-.6,2.1],[-5,-1.25,3.0]].reverse(),1.6,shade(col,1.12),col);
  quad([pt(-1.25,-.55,3.85),pt(-1.25,.55,3.85),pt(-1.25,.5,3.2),pt(-1.25,-.5,3.2)],"#08090A");
  if(hi){quad([pt(-2.6,0,3.7),pt(-9.6,0,2.4),pt(-9.6,0,3.4),pt(-4.2,0,4.2)],c2)}
  // cockpit, halo, capacete, retrovisores
  quad([pt(-.9,-1.0,2.95),pt(2.9,-.85,2.85),pt(2.9,.85,2.85),pt(-.9,1.0,2.95)],"#0A0B0C");
  if(!c.wreck){const hc=helmetCol(c);const hp=pt(.5,0,3.45);const hr=Math.max(1.2,1.0*CSC*Z);ctx.fillStyle=hc;ctx.beginPath();ctx.arc(hp[0],hp[1],hr,0,7);ctx.fill();
    if(hi){ctx.fillStyle="#111";ctx.beginPath();const vz=pt(1.2,0,3.5);ctx.ellipse(vz[0],vz[1],hr*.7,hr*.35,Math.atan2(pt(2,0,3.5)[1]-vz[1],pt(2,0,3.5)[0]-vz[0]),0,7);ctx.fill()}}
  {ctx.strokeStyle="#2B2E33";ctx.lineWidth=Math.max(.9,.75*Z);ctx.beginPath();const a=pt(3.1,0,2.9),b=pt(2.2,0,3.85),l1=pt(1.4,-1.0,3.8),l2=pt(-.7,-1.1,3.5),l3=pt(-1.2,-1.15,2.95),r1=pt(1.4,1.0,3.8),r2=pt(-.7,1.1,3.5),r3=pt(-1.2,1.15,2.95);
    ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.moveTo(l3[0],l3[1]);ctx.quadraticCurveTo(l2[0],l2[1],l1[0],l1[1]);ctx.quadraticCurveTo(b[0],b[1],r1[0],r1[1]);ctx.quadraticCurveTo(r2[0],r2[1],r3[0],r3[1]);ctx.stroke()}
  if(hi)for(const sv of[1,-1]){quad([pt(2.2,2.0*sv,2.8),pt(2.8,2.0*sv,2.8),pt(2.8,2.9*sv,3.1),pt(2.2,2.9*sv,3.1)],"#15171A")}
  near.forEach(drawWheel);
  if(!frontNear)rearWing();else frontWing();
  // luz de freio
  // faíscas do assoalho raspando (assoalho quebrado, roda arrancada ou andando no aro): só desenho, com ruído do relógio de tela
  if(!wreck&&(c.v||0)>18&&((dm.floor||0)>.55||dm.off>=0||(c.tyre&&c.tyre.rim))){const now=performance.now()/1000,n=6;for(let j=0;j<n;j++){const ph=(now*7.3+j*.618)%1;const u=-11-ph*7*Math.min(1,(c.v||0)/60),sv=((j*37)%9-4)*.5;const A=pt(-10.5,sv*.6,.1),B=pt(u,sv*(1+ph),.1+ph*.6);ctx.strokeStyle=`rgba(255,${190+j*9},80,${.85*(1-ph)})`;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke()}}
  if(c._brake&&!wreck){ctx.fillStyle="#FF3030";[-2.4,2.4].forEach(v=>{const q=pt(-12.9,v,3.0);ctx.fillRect(q[0]-1.1,q[1]-1.1,2.2,2.2)})}
  if(wreck){ctx.fillStyle="rgba(20,20,20,.35)";poly(ctx,[pt(-12,-4,3),pt(12,-4,3),pt(12,4,3),pt(-12,4,3)]);ctx.fill()}
  if(c.isP&&!wreck){const s=pt(0,0,0);ctx.strokeStyle="rgba(255,255,255,.85)";ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(s[0],s[1],15*CSC*Z,8*CSC*Z,0,0,7);ctx.stroke()}
  if(c._stopped&&detail){for(let k=0;k<6;k++){const u=k<2?8:k<4?-8:0,v=k%2?7:-7;const q=pt(u*1.1,v*1.1,0);ctx.fillStyle=c.col;ctx.fillRect(q[0]-1.4*Z,q[1]-5*Z,2.8*Z,5*Z);ctx.fillStyle="#222";ctx.beginPath();ctx.arc(q[0],q[1]-6*Z,1.4*Z,0,7);ctx.fill()}}}
// safety car: carro esportivo fechado com barra de luzes
function drawSafetyCar(ctx,c,pt,co,si,Z){const quad=(a,f)=>{poly(ctx,a);ctx.fillStyle=f;ctx.fill()};
  ctx.fillStyle="rgba(0,0,0,.32)";poly(ctx,[pt(-11,-5,0),pt(11,-5,0),pt(11,5,0),pt(-11,5,0)]);ctx.fill();
  for(const[u,v]of[[-7,4.6],[-7,-4.6],[7,4.6],[7,-4.6]]){quad([pt(u-1.8,v-.9,0),pt(u+1.8,v-.9,0),pt(u+1.8,v+.9,2.6),pt(u-1.8,v+.9,2.6)],"#151515")}
  const body=[[-11,-4.4],[10,-4.3],[11.5,-3],[11.5,3],[10,4.3],[-11,4.4]];
  const sides=(z0,z1,pts,col)=>{for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];quad([pt(a[0],a[1],z0),pt(b[0],b[1],z0),pt(b[0],b[1],z1),pt(a[0],a[1],z1)],shade(col,.7))}quad(pts.map(q=>pt(q[0],q[1],z1)),col)};
  sides(1,3.4,body,"#F2A900");sides(3.4,5.6,[[-6,-3.6],[3,-3.4],[3,3.4],[-6,3.6]],"#1B1B1B");quad([pt(-5,-3.2,5.62),pt(2,-3,5.62),pt(2,3,5.62),pt(-5,3.2,5.62)],"#2A2A2A");
  const on=Math.floor(performance.now()/250)%2;quad([pt(-1.5,-2.6,5.8),pt(0,-2.6,5.8),pt(0,2.6,5.8),pt(-1.5,2.6,5.8)],on?"#FF9800":"#FFEB3B");
  if(c._brake){ctx.fillStyle="#FF3030";[-3,3].forEach(v=>{const q=pt(-11.2,v,2.6);ctx.fillRect(q[0]-1.2,q[1]-1.2,2.4,2.4)})}}
// ---------- o ar: vácuo e ar sujo
function carFxAll(items,ctx,cw,ch,WP,detail){if(!detail||CAM.z<.55||!R||!R.started)return;const now=performance.now()/1000;
  for(const c of R.cars){const p=WP[c.id];if(!p||!running(c)||c.pit)continue;
    const A=c.aheadO,pa=A&&WP[A.id];
    if((c.tow||0)>.18&&pa){items.push({d:p.x+p.y-2,draw:()=>drawTow(ctx,cw,ch,p,pa,c.tow,now)})}
    else if((c.dirtyK||0)>.3&&pa){items.push({d:p.x+p.y-2,draw:()=>drawDirty(ctx,cw,ch,p,pa,c.dirtyK,now)})}
    if(c.isP&&(c.v||0)>70)items.push({d:p.x+p.y+1,draw:()=>drawSpeedLines(ctx,cw,ch,p,c.v,now)})}}
// linhas de ar saindo da traseira do carro da frente e envolvendo o carro de trás
function drawTow(ctx,cw,ch,p,pa,k,now){const Z=CAM.z;const dx=p.x-pa.x,dy=p.y-pa.y,L=Math.hypot(dx,dy);if(L<8||L>WS*45)return;const ux=dx/L,uy=dy/L,nx=-uy,ny=ux;
  ctx.lineWidth=Math.max(1,.45*WS*Z*.5);ctx.lineCap="round";
  for(let j=0;j<3;j++){const off=(j-1)*1.6*WS;const ph=((now*2.2+j*.23)%1);ctx.strokeStyle=`rgba(225,240,255,${(.1+.22*k)*(1-Math.abs(j-1)*.25)})`;
    ctx.beginPath();for(let s=0;s<=14;s++){const t=s/14;const spread=Math.sin(t*Math.PI)*off*(1.4-t*.4)+off*t*.6;const x=pa.x+dx*(t*1.05)-ux*10*CSC+nx*spread,y=pa.y+dy*(t*1.05)-uy*10*CSC+ny*spread;const q=toScreen(x,y,(2+Math.sin(t*6+j)*.4)*CSC,cw,ch);s?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}
    ctx.setLineDash([6*Z,10*Z]);ctx.lineDashOffset=-ph*16*Z;ctx.stroke()}
  ctx.setLineDash([]);ctx.lineDashOffset=0}
// ar sujo: redemoinhos atrás do carro da frente nas curvas
function drawDirty(ctx,cw,ch,p,pa,k,now){const Z=CAM.z;const dx=p.x-pa.x,dy=p.y-pa.y,L=Math.hypot(dx,dy);if(L<8)return;const ux=dx/L,uy=dy/L;
  ctx.lineWidth=Math.max(1,.35*WS*Z*.5);for(let j=0;j<6;j++){const t=(j+.5)/6;const cx=pa.x+dx*t,cy=pa.y+dy*t;const r=(1.5+t*3)*WS;const a0=now*4+j*1.3;const c=toScreen(cx,cy,2.2*CSC,cw,ch);
    ctx.strokeStyle=`rgba(255,215,170,${.12+k*.22})`;ctx.beginPath();ctx.ellipse(c[0],c[1],r*Z*.9,r*Z*.45,0,a0,a0+3.6);ctx.stroke()}}
function drawSpeedLines(ctx,cw,ch,p,v,now){const Z=CAM.z,co=Math.cos(p.h),si=Math.sin(p.h);const k=clamp((v-70)/25,0,1);ctx.lineWidth=1;
  for(let j=0;j<2;j++){const side=j%2?1:-1,lat=side*6*CSC;const ph=((now*3+j*.37)%1);const u0=(6-ph*26)*CSC,u1=u0-8*CSC;
    const a=toScreen(p.x+co*u0-si*lat,p.y+si*u0+co*lat,2*CSC,cw,ch),b=toScreen(p.x+co*u1-si*lat,p.y+si*u1+co*lat,2*CSC,cw,ch);ctx.strokeStyle=`rgba(255,255,255,${.16*k*(1-ph)})`;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}}
