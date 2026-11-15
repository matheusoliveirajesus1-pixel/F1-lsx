// Paddock P26 — modelo 3D do carro, visualizador e teste de carros 3D na corrida
// Paddock P26 — modelo procedural de carro de F1 (unidades em mm)
// x: para trás a partir do eixo dianteiro (eixo traseiro em x=3400) · y: lateral · z: para cima (chão = 0)
(function(G){
let Q=1;
const MAT={pintura:0,carbono:1,pneu:2,roda:3,metal:4,escuro:5,capacete:6,viseira:7,branco:8};
function Mesh(){this.p=[];this.n=[];this.c=[];this.m=[];this.i=[];this.k=[]}
Mesh.prototype.v=function(x,y,z,col,mat){this.p.push(x,y,z);this.n.push(0,0,0);this.c.push(col[0],col[1],col[2]);this.m.push(mat);this.k.push(col.k||0);return this.p.length/3-1};
Mesh.prototype.t=function(a,b,c){this.i.push(a,b,c)};
Mesh.prototype.normais=function(){const P=this.p,N=this.n,I=this.i;for(let k=0;k<I.length;k+=3){const a=I[k]*3,b=I[k+1]*3,c=I[k+2]*3;
  const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(const q of[a,b,c]){N[q]+=nx;N[q+1]+=ny;N[q+2]+=nz}}
  for(let q=0;q<N.length;q+=3){const L=Math.hypot(N[q],N[q+1],N[q+2])||1;N[q]/=L;N[q+1]/=L;N[q+2]/=L}};
const hex=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
const lerp=(a,b,t)=>a+(b-a)*t;
// spline Catmull-Rom sobre chaves [{x,...}] → valores interpolados em x
function interp(keys,x,f){let i=0;while(i<keys.length-2&&keys[i+1].x<x)i++;const k0=keys[Math.max(0,i-1)],k1=keys[i],k2=keys[i+1],k3=keys[Math.min(keys.length-1,i+2)];
  const t=Math.min(1,Math.max(0,(x-k1.x)/(k2.x-k1.x)));const p0=k0[f],p1=k1[f],p2=k2[f],p3=k3[f];const t2=t*t,t3=t2*t;
  return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3)}
// anel de superelipse: base mais plana, topo mais redondo
function anel(x,yc,hw,zb,zt,N,nT,nB,hb=1){N=Math.max(12,Math.round(N*Q/4)*4);const out=[],zc=(zb+zt)/2,hh=(zt-zb)/2;for(let k=0;k<N;k++){const a=k/N*Math.PI*2;const c=Math.cos(a),s=Math.sin(a);const n=s>=0?nT:nB;
  const w=s<0?hw*(1-(1-hb)*Math.pow(-s,1.5)):hw;out.push([x,yc+w*Math.sign(c)*Math.pow(Math.abs(c),2/n),zc+hh*Math.sign(s)*Math.pow(Math.abs(s),2/n)])}return out}
// loft: anéis com o mesmo número de pontos; tampas opcionais com vértices próprios (aresta viva)
function loft(M,rings,colF,mat,capA,capB,aberto){const R=rings.length,N=rings[0].length;const base=M.p.length/3;
  for(const r of rings)for(const q of r)M.v(q[0],q[1],q[2],colF(q),mat);
  const E=aberto?N-1:N;
  for(let a=0;a<R-1;a++)for(let k=0;k<E;k++){const k2=(k+1)%N;const i0=base+a*N+k,i1=base+a*N+k2,i2=base+(a+1)*N+k,i3=base+(a+1)*N+k2;M.t(i0,i2,i1);M.t(i1,i2,i3)}
  const cap=(r,inv,col,mt)=>{let cx=0,cy=0,cz=0;for(const q of r){cx+=q[0];cy+=q[1];cz+=q[2]}cx/=N;cy/=N;cz/=N;const c0=M.v(cx,cy,cz,col||colF([cx,cy,cz]),mt??mat);const b=M.p.length/3;
    for(const q of r)M.v(q[0],q[1],q[2],col||colF(q),mt??mat);for(let k=0;k<N;k++){const k2=(k+1)%N;inv?M.t(c0,b+k2,b+k):M.t(c0,b+k,b+k2)}};
  if(capA)cap(rings[0],true,capA.col,capA.mat);if(capB)cap(rings[R-1],false,capB.col,capB.mat)}
// tubo ao longo de uma polilinha; seção elíptica (rw lateral, rh "vertical" relativo ao up)
function tubo(M,pts,rw,rh,col,mat,N=14,up=[0,0,1]){N=Math.max(6,Math.round(N*Q));const rings=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];
  let t=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];let L=Math.hypot(...t);t=t.map(v=>v/L);let u=up;if(Math.abs(t[0]*u[0]+t[1]*u[1]+t[2]*u[2])>.95)u=[1,0,0];
  let s=[t[1]*u[2]-t[2]*u[1],t[2]*u[0]-t[0]*u[2],t[0]*u[1]-t[1]*u[0]];L=Math.hypot(...s);s=s.map(v=>v/L);const w=[s[1]*t[2]-s[2]*t[1],s[2]*t[0]-s[0]*t[2],s[0]*t[1]-s[1]*t[0]];
  const p=pts[i],r=[];for(let k=0;k<N;k++){const an=k/N*Math.PI*2,c=Math.cos(an)*rw,d=Math.sin(an)*rh;r.push([p[0]+s[0]*c+w[0]*d,p[1]+s[1]*c+w[1]*d,p[2]+s[2]*c+w[2]*d])}rings.push(r)}
  loft(M,rings,()=>col,mat,{},{})}
// torno em volta de um eixo paralelo a y: perfil [[raio,dy,cor?]]
function torno(M,cx,cy,cz,perfil,col,mat,S=72,sinal=1){S=Math.max(16,Math.round(S*Q));const base=M.p.length/3,P=perfil.length;
  for(const [r,dy,cc] of perfil)for(let k=0;k<S;k++){const a=k/S*Math.PI*2;M.v(cx+Math.cos(a)*r,cy+dy*sinal,cz+Math.sin(a)*r,cc||col,mat)}
  for(let j=0;j<P-1;j++)for(let k=0;k<S;k++){const k2=(k+1)%S;const a=base+j*S+k,b=base+j*S+k2,c=base+(j+1)*S+k,d=base+(j+1)*S+k2;sinal>0?(M.t(a,b,c),M.t(b,d,c)):(M.t(a,c,b),M.t(b,c,d))}}
// perfil aerodinâmico invertido (NACA 4 dígitos), corda 1, bordo de ataque na origem, sucção para baixo
function perfil(m=.07,p=.42,t=.11,n=22){n=Math.max(8,Math.round(n*Q));const up=[],lo=[];for(let i=0;i<=n;i++){const x=(1-Math.cos(i/n*Math.PI))/2;
  const yt=5*t*(.2969*Math.sqrt(x)-.126*x-.3516*x*x+.2843*x**3-.1036*x**4);const yc=x<p?m/(p*p)*(2*p*x-x*x):m/((1-p)**2)*((1-2*p)+2*p*x-x*x);
  up.push([x,-yc+yt]);lo.push([x,-yc-yt])}
  const r=[];for(let i=n;i>=0;i--)r.push(up[i]);for(let i=1;i<n;i++)r.push(lo[i]);return r}
// asa: estações [{y,x,z,c,a(ângulo, + = bordo de fuga para cima),e(espessura relativa)}]
function asa(M,est,colF,mat,pf){if(Q<1){const st=Math.max(1,Math.round(1/Q));est=est.filter((s,i)=>i%st===0||i===est.length-1)}pf=pf||perfil();const rings=est.map(s=>pf.map(([u,w])=>{const ca=Math.cos(s.a),sa=Math.sin(s.a);const X=u*s.c,Z=w*s.c*(s.e||1);
  return[s.x+X*ca-Z*sa,s.y,s.z+X*sa+Z*ca]}));loft(M,rings,colF,mat,{},{})}
// placa: polígono no plano x-z, espessura em y
function placa(M,y,esp,poly,col,mat){const a=poly.map(([x,z])=>[x,y-esp/2,z]),b=poly.map(([x,z])=>[x,y+esp/2,z]);loft(M,[a,b],()=>col,mat,{},{})}
// placa no plano x-y (horizontal), espessura em z
function placaH(M,z,esp,poly,col,mat){const a=poly.map(([x,y])=>[x,y,z-esp/2]),b=poly.map(([x,y])=>[x,y,z+esp/2]);loft(M,[a,b],()=>col,mat,{},{})}
function esfera(M,c,r,colF,mat,S=48,T=32){S=Math.max(12,Math.round(S*Q));T=Math.max(8,Math.round(T*Q));const base=M.p.length/3;for(let j=0;j<=T;j++){const th=j/T*Math.PI;for(let k=0;k<S;k++){const ph=k/S*Math.PI*2;
  const d=[Math.sin(th)*Math.cos(ph),Math.sin(th)*Math.sin(ph),Math.cos(th)];M.v(c[0]+d[0]*r,c[1]+d[1]*r,c[2]+d[2]*r,colF(d),mat)}}
  for(let j=0;j<T;j++)for(let k=0;k<S;k++){const k2=(k+1)%S;const a=base+j*S+k,b=base+j*S+k2,cc=base+(j+1)*S+k,d=base+(j+1)*S+k2;M.t(a,cc,b);M.t(b,cc,d)}}

function construir(opt){opt=opt||{};Q=opt.lod||1;
  const COR=hex(opt.cor||"#E5321E"),COR2=hex(opt.cor2||"#F4F4F2"),CARB=hex("#17181B"),PRETO=hex("#0B0B0D");
  const COMP=hex(opt.composto||"#F5C518");COR.k=1;COR2.k=2;COMP.k=3;
  const M=new Mesh();const D={entreEixos:3400,largura:1900};
  const WB=3400,RF=352,RR=356,WF=280,WR=375,YF=950-WF/2,YR=950-WR/2;D.rf=RF;D.rr=RR;D.yf=YF;D.yr=YR;D.wf=WF;D.wr=WR;
  // ---------- corpo central (bico + monocoque + capô do motor + caixa de câmbio)
  const K=[
    {x:-1010,hw:50, zb:122,zt:200},
    {x:-900, hw:66, zb:118,zt:232},
    {x:-650, hw:96, zb:120,zt:300},
    {x:-330, hw:130,zb:128,zt:400},
    {x:0,    hw:158,zb:138,zt:505},
    {x:380,  hw:192,zb:110,zt:590},
    {x:760,  hw:228,zb:60,zt:632},
    {x:1100, hw:250,zb:52,zt:640},
    {x:1500, hw:258,zb:52,zt:646},
    {x:1700, hw:250,zb:52,zt:700},
    {x:2000, hw:225,zb:52,zt:745},
    {x:2500, hw:172,zb:60,zt:640},
    {x:2950, hw:122,zb:120,zt:530},
    {x:3350, hw:84, zb:205,zt:440},
    {x:3620, hw:52, zb:228,zt:370},
    {x:3720, hw:30, zb:245,zt:330}];
  const livery=q=>{const[x,y,z]=q;const zbot=interp(K,x,"zb"),ztop=interp(K,x,"zt");const h=(z-zbot)/(ztop-zbot);
    const zz=z-Math.max(zbot,100);const hh=zz/(ztop-Math.max(zbot,100));if(hh<.30)return CARB;if(hh<.33)return COR2;return COR};
  const rings=[];for(let x=-1010;x<=3720;x+=22/Q){rings.push(anel(x,0,interp(K,x,"hw"),interp(K,x,"zb"),interp(K,x,"zt"),72,3.2,5,.72))}
  loft(M,rings,livery,MAT.pintura,{col:COR},{col:CARB,mat:MAT.carbono});
  // faixa central branca no bico e no capô (decalque fino sobre a superfície)
  const faixa=(x0,x1,larg)=>{const rs=[];for(let x=x0;x<=x1;x+=20/Q){const zt=interp(K,x,"zt");rs.push([[x,-larg,zt+1.5],[x,larg,zt+1.5]])}
    const b=M.p.length/3;for(const r of rs)for(const q of r)M.v(q[0],q[1],q[2],COR2,MAT.pintura);for(let i=0;i<rs.length-1;i++){const a=b+i*2;M.t(a,a+2,a+1);M.t(a+1,a+2,a+3)}};
  faixa(-1000,700,26);faixa(2250,3500,22);
  // abertura do cockpit
  {const N=Math.max(16,Math.round(60*Q)),rs=[];for(let k=0;k<N;k++){const a=k/N*Math.PI*2;const x=1330+Math.cos(a)*330,y=Math.sin(a)*190;rs.push([x,y,interp(K,x,"zt")+2])}
    const c0=M.v(1330,0,interp(K,1330,"zt")+2,PRETO,MAT.escuro);const b=M.p.length/3;for(const q of rs)M.v(q[0],q[1],q[2],PRETO,MAT.escuro);for(let k=0;k<N;k++)M.t(c0,b+k,b+(k+1)%N);
    // borda do cockpit (acolchoado)
    tubo(M,[...rs,rs[0]].map(q=>[q[0],q[1],q[2]+6]),16,12,CARB,MAT.carbono,10)}
  // piloto: capacete
  esfera(M,[1420,0,700],128,d=>{if(d[0]<-.42&&d[2]>-.15&&d[2]<.32)return PRETO;if(d[2]>.55)return COR;if(Math.abs(d[1])<.12&&d[2]>0)return COR;return COR2},MAT.capacete);
  // ---------- tomada de ar / santantônio
  {const KA=[{x:1640,hw:105,zt:905},{x:1720,hw:128,zt:930},{x:1900,hw:150,zt:900},{x:2250,hw:175,zt:760}];const rs=[];
    for(let x=1640;x<=2250;x+=18/Q){const zt=interp(KA,x,"zt"),hw=interp(KA,x,"hw");rs.push(anel(x,0,hw,interp(K,x,"zt")-60,zt,48,2.4,3,.9))}
    loft(M,rs,()=>COR,MAT.pintura,{col:PRETO,mat:MAT.escuro},null);
    // câmera T (topo)
    placaH(M,940,10,[[1690,-70],[1770,-70],[1770,70],[1690,70]],PRETO,MAT.escuro);placa(M,0,20,[[1700,920],[1760,920],[1755,936],[1705,936]],PRETO,MAT.escuro);
    // tomadas laterais do santantônio
    for(const s of[-1,1])loft(M,[anel(1700,s*112,28,790,880,20,2,2),anel(1740,s*120,32,780,885,20,2,2)],()=>PRETO,MAT.escuro,{col:PRETO},{})}
  // barbatana do capô
  placa(M,0,10,[[2100,760],[2400,800],[3350,640],[3420,440],[3200,440],[2300,700]],COR,MAT.pintura);
  // ---------- sidepods (downwash)
  for(const s of[-1,1]){const KS=[
      {x:1150,yc:478,hw:190,zb:300,zt:600},
      {x:1350,yc:492,hw:205,zb:250,zt:612},
      {x:1750,yc:480,hw:205,zb:225,zt:575},
      {x:2200,yc:420,hw:180,zb:205,zt:480},
      {x:2650,yc:340,hw:140,zb:200,zt:380},
      {x:2980,yc:265,hw:92, zb:200,zt:300},
      {x:3150,yc:220,hw:55, zb:205,zt:255}];
    const rs=[];for(let x=1150;x<=3150;x+=20/Q){rs.push(anel(x,s*interp(KS,x,"yc"),interp(KS,x,"hw"),interp(KS,x,"zb"),interp(KS,x,"zt"),56,4.2,2.6,.35))}
    const lv=q=>{const x=q[0],zb=interp(KS,x,"zb"),zt=interp(KS,x,"zt");const h=(q[2]-zb)/(zt-zb);if(h<.30)return CARB;if(h<.33)return COR2;return COR};
    loft(M,rs,lv,MAT.pintura,{col:PRETO,mat:MAT.escuro},{col:CARB,mat:MAT.carbono});
    // lábio da entrada
    tubo(M,[...rs[0],rs[0][0]].map(q=>[q[0]-4,q[1],q[2]]),12,12,CARB,MAT.carbono,10);
    // espelho
    const my=s*600,mx=1080,mz=700;loft(M,[anel(mx-10,my,8,mz-5,mz+5,28,2,2),anel(mx,my,75,mz-28,mz+28,28,3,3),anel(mx+40,my,82,mz-32,mz+30,28,3,3),anel(mx+70,my,60,mz-22,mz+22,28,3,3)],()=>COR,MAT.pintura,{},{col:hex("#C9D2DA"),mat:MAT.metal});
    tubo(M,[[mx+40,my-s*40,mz-25],[mx+90,s*500,600]],10,22,CARB,MAT.carbono,10);
    // defletores (bargeboard simplificado) à frente do sidepod
  }
  // ---------- assoalho
  {const F=[[520,300],[900,600],[1250,720],[2500,720],[2900,620],[3150,560],[3330,540]];
    const poly=[];for(const[x,y]of F)poly.push([x,y]);for(let i=F.length-1;i>=0;i--)poly.push([F[i][0],-F[i][1]]);
    // triangulação: faixa de quads entre os dois lados
    const z0=36,z1=54;const b=M.p.length/3;for(const[x,y]of F){M.v(x,y,z1,CARB,MAT.carbono);M.v(x,-y,z1,CARB,MAT.carbono)}
    for(let i=0;i<F.length-1;i++){const a=b+i*2;M.t(a,a+1,a+2);M.t(a+1,a+3,a+2)}
    const b2=M.p.length/3;for(const[x,y]of F){M.v(x,y,z0,PRETO,MAT.carbono);M.v(x,-y,z0,PRETO,MAT.carbono)}
    for(let i=0;i<F.length-1;i++){const a=b2+i*2;M.t(a,a+2,a+1);M.t(a+1,a+2,a+3)}
    for(const s of[-1,1]){// borda lateral levantada (edge wing)
      const pts=F.map(([x,y])=>[x,s*y,45]);const rs=pts.map(p=>[[p[0],p[1],36],[p[0],p[1]+s*8,36],[p[0],p[1]+s*8,82],[p[0],p[1],82]]);loft(M,rs,()=>CARB,MAT.carbono,{},{});
      // aleta da borda do assoalho
      asa(M,[{y:s*700,x:1500,z:96,c:200,a:.15},{y:s*730,x:1520,z:110,c:170,a:.25}],()=>CARB,MAT.carbono)}
    // difusor: rampa + paredes
    const rs=[];for(let x=3150;x<=3760;x+=30/Q){const t=(x-3150)/610;const z=54+Math.pow(t,1.6)*290;const hw=540-t*20;rs.push([[x,-hw,z],[x,hw,z]])}
    const b3=M.p.length/3;for(const r of rs)for(const q of r)M.v(q[0],q[1],q[2],CARB,MAT.carbono);for(let i=0;i<rs.length-1;i++){const a=b3+i*2;M.t(a,a+2,a+1);M.t(a+1,a+2,a+3);M.t(a,a+1,a+2);M.t(a+1,a+3,a+2)}
    for(const yy of[-525,-300,-120,120,300,525]){const P=[];for(let x=3150;x<=3760;x+=40/Q){const t=(x-3150)/610;P.push([x,54+Math.pow(t,1.6)*290])}
      placa(M,yy,10,[...P.map(([x,z])=>[x,z]),[3760,40],[3150,40]].reverse(),CARB,MAT.carbono)}
  }
  // ---------- asa dianteira
  {const HW=860;const ele=[];
    const pf=perfil(.065,.4,.10);
    const mk=(i,y)=>{const u=Math.abs(y)/HW;const lift=Math.pow(Math.max(0,(u-.25)/.75),1.7);
      if(i===0)return{y,x:-1080+u*30,z:72+lift*40,c:300-u*40,a:.05+lift*.1};
      if(i===1)return{y,x:-860+u*10-lift*30,z:120+lift*110,c:190-u*30,a:.42+lift*.25};
      return{y,x:-745-lift*60,z:185+lift*160,c:140-u*20,a:.78+lift*.3}};
    for(let i=0;i<3;i++){const st=[];for(let k=0;k<=60;k++){const y=-HW+k/60*2*HW;st.push(mk(i,y))}
      asa(M,st,q=>{const u=Math.abs(q[1])/HW;return i===2&&u>.3?COR:(i===1&&u>.55?COR2:CARB)},MAT.carbono,pf)}
    for(const s of[-1,1]){placa(M,s*(HW+6),12,[[-1100,46],[-620,46],[-590,160],[-635,262],[-760,292],[-1000,205],[-1095,112]],COR,MAT.pintura);
      placa(M,s*(HW-40),8,[[-1050,40],[-700,40],[-700,70],[-1050,70]],CARB,MAT.carbono)}
    // suportes do bico
    for(const s of[-1,1])placa(M,s*45,10,[[-1000,90],[-760,110],[-760,180],[-960,170]],CARB,MAT.carbono)}
  // ---------- asa traseira
  {const HW=505;const pf=perfil(.08,.42,.11);
    const est=(x,z,c,a,curva)=>{const st=[];for(let k=0;k<=50;k++){const y=-HW+k/50*2*HW;const u=Math.abs(y)/HW;st.push({y,x,z:z-curva*(1-u*u),c,a})}return st};
    asa(M,est(3770,750,340,.18,26),()=>CARB,MAT.carbono,pf);
    asa(M,est(3995,815,230,.6,18),q=>COR,MAT.pintura,pf);
    asa(M,est(3850,410,180,.2,0).map(s=>({...s,y:s.y*.82})),()=>CARB,MAT.carbono,pf);// beam wing
    for(const s of[-1,1]){placa(M,s*(HW+8),12,[[3700,330],[4120,330],[4290,640],[4300,900],[4270,960],[3880,965],[3790,930],[3740,780]],CARB,MAT.carbono);placa(M,s*(HW+15),4,[[3800,880],[4295,880],[4300,900],[4270,948],[3880,950],[3790,920]],COR,MAT.pintura);
      placa(M,s*(HW+16),6,[[3770,850],[4292,850],[4293,866],[3778,866]],COR2,MAT.pintura)}
    // pilone central (pescoço de cisne)
    placa(M,0,14,[[3560,360],[3650,350],[3880,700],[3920,815],[3850,820],[3790,760]],CARB,MAT.carbono);
    // luz de chuva
    placa(M,0,60,[[3712,262],[3740,262],[3740,300],[3712,300]],hex("#FF2A2A"),MAT.escuro)}
  // ---------- halo
  {const pts=[];const hy=255,top=842;
    for(const [x,y,z] of[[1560,-265,640],[1520,-268,720],[1440,-262,800],[1330,-250,top]])pts.push([x,y,z]);
    for(let k=0;k<=24;k++){const a=Math.PI+k/24*Math.PI;pts.push([960+Math.sin(a+Math.PI/2)*0+ (1330-960)*(1-Math.abs(Math.sin(a))) ,Math.cos(a)*hy*-1*0+0,top])}
    // anel superior como meia-elipse
    const ring=[];for(let k=0;k<=30;k++){const a=-Math.PI/2+k/30*Math.PI;ring.push([1500-Math.cos(a)*430,Math.sin(a)*hy,top+Math.cos(a)*14])}
    const path=[[1680,-262,640],[1650,-264,740],[1590,-260,815],...ring,[1590,260,815],[1650,264,740],[1680,262,640]];
    tubo(M,path,26,22,CARB,MAT.carbono,16);
    tubo(M,[[1075,0,top+8],[1030,0,770],[960,0,690],[900,0,640]],30,20,CARB,MAT.carbono,16)}
  // ---------- suspensão (perfis aerodinâmicos achatados)
  const braco=(a,b,c)=>{tubo(M,[a,b],22,8,CARB,MAT.carbono,10);if(c)tubo(M,[c,b],22,8,CARB,MAT.carbono,10)};
  for(const s of[-1,1]){
    braco([-230,s*170,470],[0,s*(YF-150),455],[260,s*180,490]);
    braco([-280,s*120,250],[15,s*(YF-150),225],[330,s*130,265]);
    tubo(M,[[-120,s*150,345],[-105,s*(YF-150),330]],18,8,CARB,MAT.carbono,10);
    tubo(M,[[40,s*(YF-160),235],[150,s*190,520]],16,16,CARB,MAT.carbono,10);
    braco([WB-260,s*150,470],[WB,s*(YR-195),480],[WB+250,s*140,490]);
    braco([WB-300,s*140,250],[WB,s*(YR-195),225],[WB+270,s*120,250]);
    tubo(M,[[WB+200,s*130,340],[WB+190,s*(YR-195),340]],18,8,CARB,MAT.carbono,10);
    tubo(M,[[WB+20,s*(YR-205),440],[WB-180,s*120,240]],16,16,CARB,MAT.carbono,10);
  }
  // ---------- rodas
  const roda=(cx,cy,R,W,s)=>{const w=W/2,RIM=229;
    // pneu: perfil do lado de dentro para fora
    const pf=[];const L=[[RIM,-w+6],[RIM+30,-w],[R-70,-w-4],[R-30,-w+4],[R-8,-w+30],[R,-w+70],[R,w-70],[R-8,w-30],[R-30,w-4],[R-70,w],[RIM+92,w+2],[RIM+92,w+2,COMP],[RIM+70,w+2,COMP],[RIM+70,w+2],[RIM+30,w],[RIM,w-6]];
    for(const q of L)pf.push(q);torno(M,cx,cy,RR===R?RR:R,pf.map(([r,dy,c])=>[r,dy,c]),hex("#141416"),MAT.pneu,96,s);
    // aro (tampa de roda) e cubo
    torno(M,cx,cy,R,[[RIM,w-6],[RIM-6,w-4],[200,w-14],[60,w-30],[40,w-28],[30,w-10],[0,w-10]],hex("#2A2C30"),MAT.roda,64,s);
    torno(M,cx,cy,R,[[RIM,-w+6],[RIM-10,-w+20],[150,-w+60],[0,-w+60]],hex("#1E1F22"),MAT.roda,48,-s);
    // duto de freio
    tubo(M,[[cx-20,cy-s*(w+30),R+40],[cx-60,cy-s*(w+120),R+20]],70,60,CARB,MAT.carbono,16,[1,0,0])};
  for(const s of[-1,1]){roda(0,s*YF,RF,WF,s);roda(WB,s*YR,RR,WR,s)}
  // torno usa cz=R: corrigir — torno(M,cx,cy,cz,...)
  M.normais();D.mesh=M;return D}
G.CARRO={construir,MAT};
})(typeof window!=="undefined"?window:globalThis);

// Renderizador WebGL2 do Paddock P26: estúdio, reflexos, sombras suaves
(function(G){if(typeof document==="undefined")return;
const VS=`#version 300 es
in vec3 aP;in vec3 aN;in vec3 aC;in float aM;in float aK;uniform mat4 uVP;uniform mat4 uL;out vec3 vP;out vec3 vN;out vec3 vC;out float vM;out vec4 vL;flat out float vK;
void main(){vP=aP;vN=aN;vC=aC;vM=aM;vK=aK;vL=uL*vec4(aP,1.);gl_Position=uVP*vec4(aP,1.);}`;
const FS=`#version 300 es
precision highp float;in vec3 vP;in vec3 vN;in vec3 vC;in float vM;in vec4 vL;flat in float vK;uniform vec3 uCor;uniform vec3 uCor2;uniform vec3 uComp;uniform vec3 uEye;uniform int uOrtho;uniform vec3 uDir;uniform sampler2D uS;uniform int uChao;uniform vec3 uFundo;uniform float uEsc;out vec4 o;
float sombra(vec4 l,float r){vec3 p=l.xyz/l.w*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)return 1.;float s=0.,n=0.;vec2 t=1./vec2(textureSize(uS,0));
  for(int i=-3;i<=3;i++)for(int j=-3;j<=3;j++){vec2 o2=vec2(i,j)*r*t;float d=texture(uS,p.xy+o2).r;s+=p.z-.0012>d?0.:1.;n+=1.;}return s/n;}
vec3 amb(vec3 r){// estúdio: softbox em cima, faixas laterais, chão escuro
  float y=r.z;vec3 c=mix(vec3(.05),vec3(.20),smoothstep(-.2,.3,y));
  c+=vec3(2.2)*smoothstep(.86,.93,y)*(.6+.4*smoothstep(.2,.0,abs(r.y)));
  c+=vec3(1.3)*smoothstep(.09,.0,abs(y-.18))*smoothstep(.3,.8,abs(r.y));
  c+=vec3(.9,.92,1.)*smoothstep(.06,.0,abs(y-.42))*smoothstep(.5,.9,-r.x);
  return c;}
void main(){
  vec3 V=uOrtho==1?-uDir:normalize(uEye-vP);
  if(uChao==1){float s=sombra(vL,4.5);float s2=sombra(vL,12.);float k=mix(s,s2,.5);o=vec4(uFundo*(.55+.45*k),1.);return;}
  vec3 N=normalize(vN);if(dot(N,V)<0.)N=-N;
  int m=int(vM+.5);int k=int(vK+.5);vec3 base=k==1?uCor:k==2?uCor2:k==3?uComp:vC;float rough=.3,spec=.5,fres=.6,metal=0.;
  if(m==0){rough=.12;spec=1.;fres=1.;}// pintura brilhante com verniz
  else if(m==1){rough=.32;spec=.45;fres=.55;// fibra de carbono: trama sutil
    vec3 q=vP*.09;float w=step(.5,fract(q.x+q.y+q.z))*.5+step(.5,fract((q.x-q.y)*.5+q.z));base*=.85+.18*w;}
  else if(m==2){rough=.75;spec=.12;fres=.15;}
  else if(m==3){rough=.3;spec=.7;fres=.5;metal=.6;}
  else if(m==4){rough=.05;spec=1.4;fres=1.;metal=1.;}
  else if(m==5){rough=.4;spec=.3;fres=.3;}
  else if(m==6){rough=.1;spec=1.;fres=1.;}
  else if(m==8){rough=.15;spec=.8;fres=.8;}
  vec3 L1=normalize(vec3(-.22,-.3,1.)),L2=normalize(vec3(.6,.7,.45)),L3=normalize(vec3(.2,-.9,.25));
  float sh=sombra(vL,1.5);
  float d1=max(dot(N,L1),0.)*sh,d2=max(dot(N,L2),0.),d3=max(dot(N,L3),0.);
  float hemi=.5+.5*N.z;
  vec3 dif=base*(1.05*d1+.28*d2+.22*d3+.32*hemi+.06);
  float pw=mix(400.,12.,rough);vec3 H1=normalize(L1+V),H2=normalize(L2+V);
  float sp=pow(max(dot(N,H1),0.),pw)*sh+.3*pow(max(dot(N,H2),0.),pw);
  vec3 R=reflect(-V,N);float F=.04+.96*pow(1.-max(dot(N,V),0.),5.);
  vec3 env=amb(R);float ao=mix(.45,1.,smoothstep(20.,220.,vP.z));
  vec3 refl=env*mix(F*fres,1.,metal)*(1.-rough*.85)*mix(.6,1.,sh);
  vec3 col=dif*(1.-metal*.7)+refl*mix(vec3(1.),base*1.6,metal)+vec3(sp*spec);
  col*=ao;
  col=col/(1.+col*.18);col=pow(col,vec3(1./1.08));
  o=vec4(col*uEsc,1.);}`;
const SVS=`#version 300 es
in vec3 aP;uniform mat4 uL;void main(){gl_Position=uL*vec4(aP,1.);}`;
const SFS=`#version 300 es
precision highp float;out vec4 o;void main(){o=vec4(1.);}`;
// matrizes
const M4={
  mul(a,b){const o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o},
  look(e,t,u){const z=n3(s3(e,t)),x=n3(c3(u,z)),y=c3(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-d3(x,e),-d3(y,e),-d3(z,e),1])},
  persp(f,a,n,fa){const t=1/Math.tan(f/2);return new Float32Array([t/a,0,0,0,0,t,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0])},
  orto(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1])}};
const s3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],c3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],d3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],n3=a=>{const l=Math.hypot(...a);return a.map(v=>v/l)};
function prog(gl,v,f){const p=gl.createProgram();for(const[t,s]of[[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p}
function Render(canvas,D){const gl=canvas.getContext("webgl2",{antialias:true,preserveDrawingBuffer:true});this.gl=gl;
  const P=prog(gl,VS,FS),SP=prog(gl,SVS,SFS);this.P=P;this.SP=SP;const M=D.mesh;
  const buf=(arr,loc,n,pr)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);const l=gl.getAttribLocation(pr,loc);if(l>=0){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,n,gl.FLOAT,false,0,0)}};
  const ibo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(M.i),gl.STATIC_DRAW);this.nI=M.i.length;
  this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);buf(M.p,"aP",3,P);buf(M.n,"aN",3,P);buf(M.c,"aC",3,P);buf(M.m,"aM",1,P);buf(M.k||new Array(M.m.length).fill(0),"aK",1,P);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);
  this.svao=gl.createVertexArray();gl.bindVertexArray(this.svao);buf(M.p,"aP",3,SP);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);
  // chão
  const S=60000,gp=[-S,-S,0,S,-S,0,S,S,0,-S,S,0];this.gvao=gl.createVertexArray();gl.bindVertexArray(this.gvao);buf(gp,"aP",3,P);buf([0,0,1,0,0,1,0,0,1,0,0,1],"aN",3,P);buf(new Array(12).fill(1),"aC",3,P);buf([9,9,9,9],"aM",1,P);buf([0,0,0,0],"aK",1,P);
  const gi=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gi);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array([0,1,2,0,2,3]),gl.STATIC_DRAW);
  // mapa de sombra
  const SZ=4096;this.SZ=SZ;this.st=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.st);gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT32F,SZ,SZ);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,this.st,0);
  const c=[1700,0,0],Ld=n3([-.22,-.3,1]);this.uL=M4.mul(M4.orto(-3400,3400,-3400,3400,100,9000),M4.look([c[0]+Ld[0]*5000,c[1]+Ld[1]*5000,c[2]+Ld[2]*5000],c,[1,0,0]));
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.fb);gl.viewport(0,0,SZ,SZ);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.useProgram(SP);
  gl.uniformMatrix4fv(gl.getUniformLocation(SP,"uL"),false,this.uL);gl.bindVertexArray(this.svao);gl.drawElements(gl.TRIANGLES,this.nI,gl.UNSIGNED_INT,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null)}
// cam: {tipo:"orto",dir:[..],up:[..],centro:[..],meia:alturaMetade} ou {tipo:"persp",olho,alvo,fov}
Render.prototype.desenha=function(cam,fundo,chao=true,esc=1){const gl=this.gl,P=this.P,W=gl.canvas.width,H=gl.canvas.height;gl.viewport(0,0,W,H);
  gl.clearColor(fundo[0],fundo[1],fundo[2],chao?1:0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(P);
  let VP,eye=[0,0,0],dir=[0,0,-1];
  if(cam.tipo==="orto"){const d=n3(cam.dir),c=cam.centro,e=[c[0]-d[0]*12000,c[1]-d[1]*12000,c[2]-d[2]*12000];const h=cam.meia,w=h*W/H;VP=M4.mul(M4.orto(-w,w,-h,h,100,30000),M4.look(e,c,cam.up));dir=d;eye=e}
  else{eye=cam.olho;VP=M4.mul(M4.persp(cam.fov*Math.PI/180,W/H,200,60000),M4.look(cam.olho,cam.alvo,[0,0,1]))}
  const u=n=>gl.getUniformLocation(P,n);gl.uniformMatrix4fv(u("uVP"),false,VP);gl.uniformMatrix4fv(u("uL"),false,this.uL);gl.uniform3fv(u("uEye"),eye);gl.uniform3fv(u("uDir"),dir);gl.uniform1i(u("uOrtho"),cam.tipo==="orto"?1:0);
  gl.uniform3fv(u("uFundo"),fundo);const cs=this.cores||{};gl.uniform3fv(u("uCor"),cs.cor||[.9,.2,.12]);gl.uniform3fv(u("uCor2"),cs.cor2||[.95,.95,.95]);gl.uniform3fv(u("uComp"),cs.comp||[.96,.77,.1]);gl.uniform1f(u("uEsc"),esc);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.st);gl.uniform1i(u("uS"),0);
  if(chao){gl.uniform1i(u("uChao"),1);gl.bindVertexArray(this.gvao);gl.depthMask(true);gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_INT,0)}
  gl.uniform1i(u("uChao"),0);gl.bindVertexArray(this.vao);gl.drawElements(gl.TRIANGLES,this.nI,gl.UNSIGNED_INT,0)};
G.Render3D=Render;
})(typeof window!=="undefined"?window:globalThis);

// ---------- Carro 3D no jogo (TESTE): ?carro3d=1 liga os carros 3D na corrida; ?carro3d=0 mostra só o medidor
(function(){if(typeof window==="undefined"||typeof document==="undefined")return;
const QS=new URLSearchParams(location.search);const PARAM=QS.get("carro3d");
const C3D=window.C3D={on:PARAM==="1",medidor:PARAM!=null,lod:+(QS.get("lod")||.3),ok:false,n:0,tiles:new Map(),fr:0,quadro:-1,erro:null};
const hex=h=>{h=String(h||"#888");if(h.length===4)h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];return[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255]};
const VS=`#version 300 es
in vec3 aP;in vec3 aN;in vec3 aC;in float aM;in float aK;
uniform vec4 uCar;// x,y,zb,h
uniform vec4 uIso;// ISO_C,ISO_S,Z,escala(mm->mundo)
uniform vec4 uCam;// CAM.x,CAM.y,cw/2+sx,ch/2+sy
uniform vec4 uTile;// x0,y0,w,h (px CSS)
uniform vec2 uXC;// u do eixo dianteiro, profundidade de referência
out vec3 vN;out vec3 vC;out float vM;flat out float vK;out vec3 vW;
void main(){float s=uIso.w;float u=uXC.x-aP.x*s,v=aP.y*s,z=aP.z*s+uCar.z;float c=cos(uCar.w),si=sin(uCar.w);
  vec3 w=vec3(uCar.x+u*c-v*si,uCar.y+u*si+v*c,z);vW=w;
  vec3 n=vec3(-aN.x*c-aN.y*si,-aN.x*si+aN.y*c,aN.z);vN=n;vC=aC;vM=aM;vK=aK;
  float sx=((w.x-w.y)*uIso.x-uCam.x)*uIso.z+uCam.z,sy=((w.x+w.y)*uIso.y-w.z-uCam.y)*uIso.z+uCam.w;
  float d=(w.x+w.y+2.*uIso.y*w.z)-uXC.y;
  gl_Position=vec4((sx-uTile.x)/uTile.z*2.-1.,1.-(sy-uTile.y)/uTile.w*2.,-d/60.,1.);}`;
const FS=`#version 300 es
precision mediump float;in vec3 vN;in vec3 vC;in float vM;flat in float vK;in vec3 vW;uniform vec3 uCor;uniform vec3 uCor2;uniform vec3 uComp;uniform vec3 uV;uniform float uLuz;out vec4 o;
vec3 amb(vec3 r){float y=r.z;vec3 c=mix(vec3(.10),vec3(.32),smoothstep(-.2,.4,y));c+=vec3(1.6)*smoothstep(.8,.95,y);c+=vec3(.7)*smoothstep(.1,.0,abs(y-.25));return c;}
void main(){vec3 N=normalize(vN);vec3 V=uV;if(dot(N,V)<0.)N=-N;int m=int(vM+.5);int k=int(vK+.5);
  vec3 base=k==1?uCor:k==2?uCor2:k==3?uComp:vC;float rough=.3,spec=.5,fres=.6,metal=0.;
  if(m==0||m==6){rough=.14;spec=.9;fres=1.;}else if(m==1){rough=.35;spec=.4;fres=.5;}else if(m==2){rough=.8;spec=.1;fres=.12;}else if(m==3){rough=.3;spec=.6;fres=.5;metal=.6;}else if(m==4){rough=.05;spec=1.2;fres=1.;metal=1.;}
  vec3 L1=normalize(vec3(-.3,-.5,1.)),L2=normalize(vec3(.7,.3,.5));
  float d1=max(dot(N,L1),0.),d2=max(dot(N,L2),0.),hemi=.5+.5*N.z;
  vec3 col=base*(1.*d1+.3*d2+.38*hemi+.08)*(1.-metal*.6);
  vec3 H=normalize(L1+V);col+=vec3(pow(max(dot(N,H),0.),mix(300.,14.,rough))*spec);
  vec3 R=reflect(-V,N);float F=.04+.96*pow(1.-max(dot(N,V),0.),5.);col+=amb(R)*mix(F*fres,1.,metal)*(1.-rough*.85)*mix(vec3(1.),base*1.5,metal);
  col*=mix(.5,1.,smoothstep(.0,1.2,vW.z));col=col/(1.+col*.15);o=vec4(col*uLuz,1.);}`;
let gl,cv,P,vao,nI,U={};
function prog(v,f){const p=gl.createProgram();for(const[t,s]of[[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p}
function init(){if(C3D.ok||C3D.erro)return C3D.ok;try{cv=document.createElement("canvas");cv.width=1024;cv.height=1024;
  gl=cv.getContext("webgl2",{antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true,alpha:true});if(!gl)throw new Error("sem WebGL2");
  P=prog(VS,FS);const D=CARRO.construir({lod:C3D.lod,cor:"#FF0000",cor2:"#00FF00"});const M=D.mesh;C3D.tris=M.i.length/3;
  vao=gl.createVertexArray();gl.bindVertexArray(vao);const buf=(a,n,l)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(a),gl.STATIC_DRAW);const L=gl.getAttribLocation(P,l);if(L>=0){gl.enableVertexAttribArray(L);gl.vertexAttribPointer(L,n,gl.FLOAT,false,0,0)}};
  buf(M.p,3,"aP");buf(M.n,3,"aN");buf(M.c,3,"aC");buf(M.m,1,"aM");buf(M.k,1,"aK");const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(M.i),gl.STATIC_DRAW);nI=M.i.length;
  for(const n of["uCar","uIso","uCam","uTile","uXC","uCor","uCor2","uComp","uV","uLuz"])U[n]=gl.getUniformLocation(P,n);C3D.ok=true}catch(e){C3D.erro=String(e.message||e);C3D.on=false}return C3D.ok}
// escala: entre-eixos do desenho do jogo (u 7.6 → -8.3) = 3400 mm
const S_MM=15.9/3400,XC=7.6;
const caixa=(p,zb)=>{const co=Math.cos(p.h),si=Math.sin(p.h);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const k=CSC;
  for(const u of[-12.6,9.6])for(const v of[-5.4,5.4])for(const z of[0,4.9]){const s=toScreen(p.x+(u*co-v*si)*k,p.y+(u*si+v*co)*k,z*k+zb,0,0);if(s[0]<x0)x0=s[0];if(s[0]>x1)x1=s[0];if(s[1]<y0)y0=s[1];if(s[1]>y1)y1=s[1]}return[x0-2,y0-2,x1+2,y1+2]};
// prepara o atlas: desenha todos os carros visíveis deste quadro, cada um no seu retângulo
function prepara(cw,ch){const t0=performance.now();C3D.tiles.clear();if(!init())return;const dpr=(typeof qDpr==="function"?qDpr():1);const Z=CAM.z;
  const lista=[];for(const c of R.cars){const p=c._w;if(!p||c.sc||c.status==="dnf"||c.status==="dsq")continue;const zb=0;const b=caixa(p,zb);// caixa em coords sem o deslocamento do centro (cw=ch=0)
    const ox=cw/2,oy=ch/2,x0=b[0]+ox,y0=b[1]+oy,x1=b[2]+ox,y1=b[3]+oy;if(x1<-20||y1<-20||x0>cw+20||y0>ch+20)continue;lista.push({c,p,x0,y0,w:x1-x0,h:y1-y0})}
  // empacota em prateleiras
  let W=cv.width,H=cv.height,x=0,y=0,lh=0;const need=(w,h)=>{if(x+w>W){x=0;y+=lh+2;lh=0}const r=[x,y];x+=w+2;lh=Math.max(lh,h);return r};
  const pos=[];let maxW=0;for(const t of lista){const w=Math.ceil(t.w*dpr),h=Math.ceil(t.h*dpr);maxW=Math.max(maxW,w)}
  const alvoW=Math.min(4096,Math.max(1024,maxW+4));if(cv.width!==alvoW){cv.width=alvoW;W=alvoW}
  for(const t of lista){const w=Math.ceil(t.w*dpr),h=Math.ceil(t.h*dpr);pos.push(need(w,h))}const altura=Math.min(4096,Math.max(256,y+lh+4));if(cv.height<altura||cv.height>altura*2){cv.height=Math.ceil(altura/256)*256}H=cv.height;
  gl.viewport(0,0,cv.width,cv.height);gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.SCISSOR_TEST);gl.useProgram(P);gl.bindVertexArray(vao);
  const v=[1,1,2*ISO_S],vl=Math.hypot(...v);gl.uniform3f(U.uV,v[0]/vl,v[1]/vl,v[2]/vl);gl.uniform4f(U.uIso,ISO_C,ISO_S,Z,S_MM*CSC);gl.uniform4f(U.uCam,CAM.x,CAM.y,cw/2+(CAM.sx||0),ch/2+(CAM.sy||0));
  const noite=R&&R.C&&R.C.night;gl.uniform1f(U.uLuz,noite?.62:1);
  lista.forEach((t,i)=>{const[px,py]=pos[i];const w=Math.ceil(t.w*dpr),h=Math.ceil(t.h*dpr);if(py+h>cv.height)return;
    gl.viewport(px,cv.height-py-h,w,h);gl.scissor(px,cv.height-py-h,w,h);gl.clear(gl.DEPTH_BUFFER_BIT);
    const c=t.c,p=t.p;gl.uniform4f(U.uCar,p.x,p.y,0,p.h);gl.uniform4f(U.uTile,t.x0,t.y0,w/dpr,h/dpr);gl.uniform2f(U.uXC,XC*CSC,p.x+p.y);
    gl.uniform3fv(U.uCor,hex(c.col));gl.uniform3fv(U.uCor2,hex(c.col2||"#F2F2F2"));const cp=c.tyre&&typeof COMP!=="undefined"&&COMP[c.tyre.c]?COMP[c.tyre.c].c:"#F5C518";gl.uniform3fv(U.uComp,hex(cp));
    gl.drawElements(gl.TRIANGLES,nI,gl.UNSIGNED_INT,0);C3D.tiles.set(c,{p,sx:px,sy:py,sw:w,sh:h,x:t.x0,y:t.y0,w:w/dpr,h:h/dpr})});
  gl.disable(gl.SCISSOR_TEST);C3D.n=C3D.tiles.size;C3D.msGL=performance.now()-t0}
function instala(){if(typeof drawCar!=="function"||drawCar._c3d)return false;const orig=drawCar;
  window.drawCar=function(ctx,cw,ch,c,p,detail,o){if(!C3D.on||!detail||CAM.z<.5||!c||c.sc||c.wreck||p!==c._w)return orig.apply(this,arguments);
    if(C3D.quadro!==C3D.fr){C3D.quadro=C3D.fr;try{prepara(cw,ch)}catch(e){C3D.erro=String(e.message||e);C3D.on=false;return orig.apply(this,arguments)}}
    const t=C3D.tiles.get(c);if(!t)return orig.apply(this,arguments);
    // sombra no chão
    const k=CSC,co=Math.cos(p.h),si=Math.sin(p.h),Z=CAM.z;const pts=[[-12.2,-4.6],[9,-5],[12.6,-5.4],[12.6,5.4],[9,5],[-12.2,4.6]].map(([u,v])=>{const s=toScreen(p.x+(u*co-v*si)*k,p.y+(u*si+v*co)*k,0,cw,ch);return[s[0]+1.2*Z,s[1]+.8*Z]});
    ctx.fillStyle="rgba(0,0,0,.3)";ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill();
    ctx.drawImage(cv,t.sx,t.sy,t.sw,t.sh,t.x,t.y,t.w,t.h);
    const pt=(u,v,z)=>toScreen(p.x+(u*co-v*si)*k,p.y+(u*si+v*co)*k,z*k,cw,ch);
    if(c._brake){ctx.fillStyle="#FF3030";[-1.6,1.6].forEach(v=>{const q=pt(-12.5,v,1.6);ctx.fillRect(q[0]-1.1,q[1]-1.1,2.2,2.2)})}
    if(c.isP){const s=pt(0,0,0);ctx.strokeStyle="rgba(255,255,255,.85)";ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(s[0],s[1],15*CSC*Z,8*CSC*Z,0,0,7);ctx.stroke()}};
  window.drawCar._c3d=true;
  const ds=window.drawScene;if(typeof ds==="function"&&!ds._c3d){window.drawScene=function(){C3D.fr++;const t0=performance.now();const r=ds.apply(this,arguments);C3D.msCena=performance.now()-t0;C3D.amostra(C3D.msCena);return r};window.drawScene._c3d=true}
  return true}
// medidor de desempenho
const AM=[];let fps=0,ult=performance.now(),qn=0,el=null;
C3D.amostra=ms=>{AM.push(ms);if(AM.length>120)AM.shift()};
function medidor(){if(!C3D.medidor)return;if(!el){el=document.createElement("div");el.id="c3dMed";el.style.cssText="position:fixed;left:8px;top:8px;z-index:99999;background:rgba(10,12,16,.86);color:#E8EAEE;font:600 12px/1.45 ui-monospace,Menlo,monospace;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.14);min-width:190px;pointer-events:auto";document.body.appendChild(el);
  el.addEventListener("click",e=>{const b=e.target.closest("[data-c3d]");if(!b)return;const a=b.dataset.c3d;if(a==="modo"){C3D.on=!C3D.on;AM.length=0}if(a==="lod"){const L=[.2,.3,.5];C3D.lod=L[(L.indexOf(C3D.lod)+1)%L.length];C3D.ok=false;C3D.erro=null;AM.length=0}if(a==="ver"){window.open("carro3d.html","_blank")}})}
  qn++;const t=performance.now();if(t-ult>=1000){fps=qn*1000/(t-ult);qn=0;ult=t;const m=AM.length?AM.reduce((a,b)=>a+b,0)/AM.length:0;const p95=AM.length?[...AM].sort((a,b)=>a-b)[Math.floor(AM.length*.95)]:0;
    el.innerHTML=`<div style="color:#FF6A4D;letter-spacing:.08em">TESTE CARRO 3D</div><div>modo: <b>${C3D.on?"3D":"2D (atual)"}</b>${C3D.erro?` <span style="color:#f66">erro: ${C3D.erro}</span>`:""}</div><div>FPS: <b>${fps.toFixed(0)}</b></div><div>cena: ${m.toFixed(1)} ms (p95 ${p95.toFixed(1)})</div>${C3D.on&&C3D.ok?`<div>carros 3D: ${C3D.n} · ${(C3D.tris/1000).toFixed(0)}k tri/carro</div><div>GL: ${(C3D.msGL||0).toFixed(1)} ms</div>`:""}
    <div style="display:flex;gap:6px;margin-top:6px"><button data-c3d="modo" style="flex:1;font:inherit;padding:4px;border-radius:6px;border:0;background:#FF4D2E;color:#fff">${C3D.on?"ver 2D":"ver 3D"}</button><button data-c3d="lod" style="font:inherit;padding:4px 6px;border-radius:6px;border:0;background:#2A2E36;color:#fff">detalhe ${C3D.lod}</button><button data-c3d="ver" style="font:inherit;padding:4px 6px;border-radius:6px;border:0;background:#2A2E36;color:#fff">girar</button></div>`}
  }
(function loop(){try{instala();medidor()}catch(e){}requestAnimationFrame(loop)})();
})();
