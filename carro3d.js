// Paddock 3D — carro, pintura, render e pistas
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

// ---------- PEÇAS DO CARRO: identificação, hierarquia e metadados (preparação para danos localizados)
// Cada peça é um conjunto de triângulos da malha (faixas contínuas do índice). A malha em si não muda: o carro é desenhado igual.
// Lado: E = esquerda (y < 0 no modelo), D = direita. Rodas no padrão do jogo: 0 dianteira esq., 1 dianteira dir., 2 traseira esq., 3 traseira dir.
function centroTri(M,t){const I=M.i,P=M.p;let x=0,y=0,z=0;for(let j=0;j<3;j++){const v=I[t*3+j]*3;x+=P[v];y+=P[v+1];z+=P[v+2]}return[x/3,y/3,z/3]}
const LADO={E:"esquerda",D:"direita",Left:"esquerda",Right:"direita"};
const CANTOS={FrontLeft:{n:"dianteira esquerda",roda:0,eixo:"dianteiro",s:-1},FrontRight:{n:"dianteira direita",roda:1,eixo:"dianteiro",s:1},RearLeft:{n:"traseira esquerda",roda:2,eixo:"traseiro",s:-1},RearRight:{n:"traseira direita",roda:3,eixo:"traseiro",s:1}};
// informação de cada peça: nome, categoria, se pode ser arrancada/destruída, conjunto mecânico, ligações e ponto de fixação (mm)
function PECAS_INFO(id,G){const p=id.split("."),sd=p[p.length-1],lado=LADO[sd]||null,s=sd==="E"?-1:sd==="D"?1:0;
  const I=(nome,cat,o)=>({id,nome,categoria:cat,lado,destrutivel:true,danificavel:true,conjunto:p[0],conecta:[],fixacao:null,...o});
  const WB=G.WB,YF=G.YF,YR=G.YR;
  switch(p[0]){
  case"Nose":return p[1]==="Tip"?I("Ponta do bico","carroceria",{conjunto:"Nose",posicao:"frente",conecta:["Nose.Cone"],fixacao:[-650,0,180]})
    :I("Bico (estrutura de impacto)","carroceria",{conjunto:"Nose",posicao:"frente",conecta:["Nose.Tip","Chassis.Monocoque","FrontWing.Pylon.E","FrontWing.Pylon.D"],fixacao:[-60,0,240]});
  case"FrontWing":{const el=p[1],L=lado?" ("+lado+")":"";const nomes={MainPlane:"Plano principal da asa dianteira",Flap1:"Flap 1 da asa dianteira",Flap2:"Flap 2 da asa dianteira",Endplate:"Endplate da asa dianteira",Footplate:"Placa inferior da asa dianteira",Pylon:"Suporte da asa no bico"};
    const con={MainPlane:["FrontWing.Pylon.E","FrontWing.Pylon.D","FrontWing.Flap1."+sd,"FrontWing.Endplate."+sd,"FrontWing.Footplate."+sd,"FrontWing.MainPlane."+(sd==="E"?"D":"E")],Flap1:["FrontWing.MainPlane."+sd,"FrontWing.Flap2."+sd,"FrontWing.Endplate."+sd],Flap2:["FrontWing.Flap1."+sd,"FrontWing.Endplate."+sd],
      Endplate:["FrontWing.MainPlane."+sd,"FrontWing.Flap1."+sd,"FrontWing.Flap2."+sd,"FrontWing.Footplate."+sd],Footplate:["FrontWing.Endplate."+sd,"FrontWing.MainPlane."+sd],Pylon:["Nose.Cone","FrontWing.MainPlane.E","FrontWing.MainPlane.D"]}[el];
    const fx={Pylon:[-880,s*45,100],Endplate:[-850,s*866,160],Footplate:[-875,s*820,55]}[el]||[-900,s*430,110];
    return I(nomes[el]+L,"aerodinamica",{conjunto:"FrontWing",posicao:"frente",conecta:con,fixacao:fx})}
  case"RearWing":{const el=p[1],L=lado?" ("+lado+")":"";const nomes={MainPlane:"Plano principal da asa traseira",Flap:"Flap móvel da asa traseira",BeamWing:"Beam wing",Endplate:"Endplate da asa traseira",EndplatePanel:"Painel pintado do endplate",EndplateStripe:"Faixa do endplate",Pylon:"Pilone central (pescoço de cisne)"};
    const con={MainPlane:["RearWing.Endplate.E","RearWing.Endplate.D","RearWing.Pylon","RearWing.Flap"],Flap:["RearWing.Endplate.E","RearWing.Endplate.D","RearWing.MainPlane"],BeamWing:["RearWing.Endplate.E","RearWing.Endplate.D","Chassis.Gearbox"],
      Endplate:["RearWing.MainPlane","RearWing.Flap","RearWing.BeamWing","RearWing.EndplatePanel."+sd,"RearWing.EndplateStripe."+sd],EndplatePanel:["RearWing.Endplate."+sd],EndplateStripe:["RearWing.Endplate."+sd],Pylon:["Chassis.Gearbox","RearWing.MainPlane"]}[el];
    const fx={Pylon:[3600,0,355],Flap:[3995,0,818],BeamWing:[3850,0,410],MainPlane:[3880,0,740]}[el]||[4000,s*513,640];
    return I(nomes[el]+L,"aerodinamica",{conjunto:"RearWing",posicao:"traseira",conecta:con,fixacao:fx,movel:el==="Flap"})}
  case"Sidepods":{const sl=p[1];const sx=sl==="E"?-1:1;return p[2]==="Body"?I("Sidepod ("+LADO[sl]+")","carroceria",{lado:LADO[sl],conjunto:"Sidepods",posicao:"lateral",conecta:["Chassis.Monocoque","Chassis.PowerUnitBay","Floor.Plank","Sidepods."+sl+".InletLip","Mirrors."+sl+".Stalk"],fixacao:[1700,sx*300,300]})
    :I("Borda da entrada de ar do sidepod ("+LADO[sl]+")","carroceria",{lado:LADO[sl],conjunto:"Sidepods",posicao:"lateral",conecta:["Sidepods."+sl+".Body"],fixacao:[1146,sx*478,450]})}
  case"Mirrors":{const sl=p[1],sx=sl==="E"?-1:1;return p[2]==="Housing"?I("Retrovisor ("+LADO[sl]+")","carroceria",{lado:LADO[sl],conjunto:"Mirrors",posicao:"lateral",conecta:["Mirrors."+sl+".Stalk"],fixacao:[1120,sx*600,700]})
    :I("Haste do retrovisor ("+LADO[sl]+")","carroceria",{lado:LADO[sl],conjunto:"Mirrors",posicao:"lateral",conecta:["Mirrors."+sl+".Housing","Sidepods."+sl+".Body"],fixacao:[1170,sx*500,600]})}
  case"EngineCover":return p[1]==="SharkFin"?I("Barbatana do capô","carroceria",{conjunto:"EngineCover",posicao:"traseira",conecta:["EngineCover.Cover"],fixacao:[2700,0,700]})
    :I("Capô do motor (parte de cima)","carroceria",{conjunto:"EngineCover",posicao:"centro-traseira",conecta:["Chassis.Airbox","Chassis.PowerUnitBay","EngineCover.SharkFin","Sidepods.E.Body","Sidepods.D.Body"],fixacao:[2500,0,600]});
  case"Floor":if(p[1]==="Plank")return I("Assoalho","aerodinamica",{conjunto:"Floor",posicao:"baixo",conecta:["Chassis.Monocoque","Chassis.PowerUnitBay","Floor.EdgeWing.E","Floor.EdgeWing.D","Diffuser.Ramp","Sidepods.E.Body","Sidepods.D.Body"],fixacao:[1900,0,45]});
    return p[1]==="EdgeWing"?I("Borda levantada do assoalho ("+lado+")","aerodinamica",{conjunto:"Floor",posicao:"baixo-lateral",conecta:["Floor.Plank","Floor.EdgeFin."+sd],fixacao:[1900,s*720,60]})
      :I("Aleta da borda do assoalho ("+lado+")","aerodinamica",{conjunto:"Floor",posicao:"baixo-lateral",conecta:["Floor.EdgeWing."+sd],fixacao:[1550,s*715,100]});
  case"Diffuser":if(p[1]==="Ramp")return I("Rampa do difusor","aerodinamica",{conjunto:"Diffuser",posicao:"traseira-baixo",conecta:["Floor.Plank","Diffuser.Strake.E1","Diffuser.Strake.E2","Diffuser.Strake.E3","Diffuser.Strake.D1","Diffuser.Strake.D2","Diffuser.Strake.D3"],fixacao:[3150,0,54]});
    {const k=sd.slice(1),sl=sd[0];return I("Aleta do difusor "+k+" ("+LADO[sl]+")","aerodinamica",{lado:LADO[sl],conjunto:"Diffuser",posicao:"traseira-baixo",conecta:["Diffuser.Ramp"],fixacao:[3450,(sl==="E"?-1:1)*[0,120,300,525][+k],120]})}
  case"Chassis":{const nm={Monocoque:"Monocoque (célula de sobrevivência)",PowerUnitBay:"Carenagem da unidade de potência",Gearbox:"Câmbio e estrutura traseira",CockpitOpening:"Abertura do cockpit",CockpitRim:"Acolchoado do cockpit",Airbox:"Tomada de ar / santantônio",AirboxInlet:"Tomada lateral do santantônio",TCam:"Câmera T",RainLight:"Luz de chuva",Halo:"Halo"};
    const e=p[1],nome=nm[e]+(e==="Halo"?(p[2]==="Hoop"?" (arco)":" (pilar central)"):lado?" ("+lado+")":"");
    const fixo=["Monocoque","CockpitOpening","CockpitRim","Halo"].includes(e);
    const con={Monocoque:["Nose.Cone","Chassis.PowerUnitBay","Chassis.Halo.Hoop","Chassis.Halo.Pillar","Chassis.Airbox","Sidepods.E.Body","Sidepods.D.Body","Floor.Plank"],PowerUnitBay:["Chassis.Monocoque","Chassis.Gearbox","EngineCover.Cover","Floor.Plank"],Gearbox:["Chassis.PowerUnitBay","RearWing.Pylon","RearWing.BeamWing","Chassis.RainLight","Diffuser.Ramp"],
      Airbox:["Chassis.Monocoque","EngineCover.Cover","Chassis.TCam","Chassis.AirboxInlet.E","Chassis.AirboxInlet.D"],AirboxInlet:["Chassis.Airbox"],TCam:["Chassis.Airbox"],RainLight:["Chassis.Gearbox"],Halo:["Chassis.Monocoque"],CockpitOpening:["Chassis.Monocoque"],CockpitRim:["Chassis.Monocoque"]}[e]||[];
    return I(nome,e==="Gearbox"||e==="PowerUnitBay"?"estrutura":"chassi",{conjunto:"Chassis",posicao:"centro",destrutivel:!fixo&&e!=="Gearbox"&&e!=="PowerUnitBay",danificavel:e!=="Halo",conecta:con,mecanico:e==="Gearbox"})}
  case"Cockpit":return I({SteeringWheel:"Volante",SteeringColumn:"Coluna de direção"}[p[1]]+(p[2]?{Body:"",Display:" (tela)",ShiftLights:" (luzes de troca)",Grip:" (manopla "+lado+")"}[p[2]]:""),"cockpit",{conjunto:"Cockpit",posicao:"cockpit",destrutivel:false,danificavel:false,conecta:p[1]==="SteeringColumn"?["Chassis.Monocoque","Cockpit.SteeringWheel.Body"]:["Cockpit.SteeringColumn"]});
  case"Driver":return I("Capacete do piloto","piloto",{conjunto:"Driver",posicao:"cockpit",destrutivel:false,danificavel:false});
  case"Suspension":{const C=CANTOS[p[1]],fr=C.eixo==="dianteiro",S=C.s,el=p[2];const YW=fr?YF-150:YR-195,X0=fr?0:WB;
    // pontos de fixação (mm): no chassi e na manga de eixo (lado da roda); são os mesmos pontos usados para desenhar os braços
    const pts=fr?{UpperWishbone:{chassi:[[-230,S*170,470],[260,S*180,490]],roda:[0,S*YW,455]},LowerWishbone:{chassi:[[-280,S*120,250],[330,S*130,265]],roda:[15,S*YW,225]},TrackRod:{chassi:[[-120,S*150,345]],roda:[-105,S*YW,330]},Pushrod:{chassi:[[150,S*190,520]],roda:[40,S*(YF-160),235]},
        Rocker:{chassi:[[150,S*120,545]]},Damper:{chassi:[[330,S*60,560]]},Spring:{chassi:[[330,S*60,560]]},Upright:{roda:[0,S*YF,RF_(G)]}}
      :{UpperWishbone:{chassi:[[WB-260,S*150,470],[WB+250,S*140,490]],roda:[WB,S*YW,480]},LowerWishbone:{chassi:[[WB-300,S*140,250],[WB+270,S*120,250]],roda:[WB,S*YW,225]},ToeLink:{chassi:[[WB+200,S*130,340]],roda:[WB+190,S*YW,340]},Pullrod:{chassi:[[WB-180,S*120,240]],roda:[WB+20,S*(YR-205),440]},
        Rocker:{chassi:[[WB-180,S*90,225]]},Damper:{chassi:[[WB-420,S*60,230]]},Spring:{chassi:[[WB-420,S*60,230]]},Upright:{roda:[WB,S*YR,G.RR]}};
    const nm={UpperWishbone:"Braço superior",LowerWishbone:"Braço inferior",TrackRod:"Barra de direção",ToeLink:"Barra de convergência",Pushrod:"Pushrod",Pullrod:"Pullrod",Rocker:"Rocker (balancim)",Damper:"Amortecedor",Spring:"Mola (barra de torção)",Upright:"Manga de eixo"}[el];
    const virt=["Rocker","Damper","Spring","Upright"].includes(el);const base="Suspension."+p[1]+".";const rod=fr?(el==="Pushrod"?"Pushrod":null):(el==="Pullrod"?"Pullrod":null);
    const con={UpperWishbone:["Chassis.Monocoque",base+"Upright"],LowerWishbone:["Chassis.Monocoque",base+"Upright"],TrackRod:["Chassis.Monocoque",base+"Upright"],ToeLink:["Chassis.Gearbox",base+"Upright"],Pushrod:[base+"Upright",base+"Rocker"],Pullrod:[base+"Upright",base+"Rocker"],
      Rocker:[base+(fr?"Pushrod":"Pullrod"),base+"Damper",base+"Spring",fr?"Chassis.Monocoque":"Chassis.Gearbox"],Damper:[base+"Rocker",fr?"Chassis.Monocoque":"Chassis.Gearbox"],Spring:[base+"Rocker",fr?"Chassis.Monocoque":"Chassis.Gearbox"],
      Upright:[base+"UpperWishbone",base+"LowerWishbone",base+(fr?"TrackRod":"ToeLink"),base+(fr?"Pushrod":"Pullrod"),"Wheels."+p[1]+".Hub"]}[el];
    return I(nm+" ("+C.n+")","suspensao",{lado:S<0?"esquerda":"direita",conjunto:"Suspension."+p[1],posicao:C.n,canto:p[1],roda:C.roda,eixo:C.eixo,conecta:con,pontos:pts[el],fixacao:(pts[el].roda||pts[el].chassi[0]),
      virtual:virt,interno:el==="Rocker"||el==="Damper"||el==="Spring",destrutivel:!virt||el==="Upright",mecanico:true,funcao:{UpperWishbone:"localiza a roda (cambagem)",LowerWishbone:"localiza a roda e recebe a carga vertical",TrackRod:"direção",ToeLink:"convergência",Pushrod:"leva a carga da roda ao rocker",Pullrod:"leva a carga da roda ao rocker",Rocker:"converte o movimento da haste para a mola e o amortecedor",Damper:"amortece compressão e extensão",Spring:"sustenta o carro (rigidez)",Upright:"liga braços, haste e direção ao cubo da roda"}[el]})}
  case"Wheels":{const C=CANTOS[p[1]],fr=C.eixo==="dianteiro",cx=fr?0:WB,cy=C.s*(fr?YF:YR),r=fr?G.RF:G.RR,el=p[2],base="Wheels."+p[1]+".";
    const nm={Tyre:"Pneu",Rim:"Aro",Hub:"Cubo e porca",RimInner:"Face interna do aro (cobre disco e pinça)",BrakeDuct:"Duto de freio"}[el];
    const con={Tyre:[base+"Rim"],Rim:[base+"Tyre",base+"Hub",base+"RimInner"],Hub:[base+"Rim","Suspension."+p[1]+".Upright"],RimInner:[base+"Rim",base+"Hub"],BrakeDuct:["Suspension."+p[1]+".Upright"]}[el];
    return I(nm+" ("+C.n+")",el==="BrakeDuct"?"freio":"roda",{lado:C.s<0?"esquerda":"direita",conjunto:"Wheels."+p[1],posicao:C.n,canto:p[1],roda:C.roda,eixo:C.eixo,conecta:con,fixacao:[cx,cy,r],eixoGiro:[0,1,0],mecanico:true})}}
  return I(id,"outro",{})}
function RF_(G){return G.RF}
// peças sem malha (ficam dentro da carroceria): existem para a física da suspensão ter onde se apoiar
const VIRTUAIS=["Rocker","Damper","Spring","Upright"];
function montaPecas(M,DONO,G){const nT=M.i.length/3,mapa={},lista=[];const nova=id=>{if(!mapa[id]){const p=PECAS_INFO(id,G);p.faixas=[];p.triangulos=0;p.vertices=0;p.caixa=null;mapa[id]=p;lista.push(p)}return mapa[id]};
  let semDono=0;for(let t=0;t<nT;){const id=DONO[t];let u=t+1;while(u<nT&&DONO[u]===id)u++;if(id==null)semDono+=u-t;else{const p=nova(id);p.faixas.push([t*3,u*3]);p.triangulos+=u-t}t=u}
  // caixa e vértices de cada peça
  for(const p of lista){const vs=new Set();const I=M.i,P=M.p;let a=[1e9,1e9,1e9],b=[-1e9,-1e9,-1e9];for(const[i0,i1]of p.faixas)for(let k=i0;k<i1;k++){const v=I[k];if(vs.has(v))continue;vs.add(v);for(let j=0;j<3;j++){const q=P[v*3+j];if(q<a[j])a[j]=q;if(q>b[j])b[j]=q}}
    p.vertices=vs.size;p.caixa={min:a.map(Math.round),max:b.map(Math.round)};p.centro=a.map((q,j)=>Math.round((q+b[j])/2));if(!p.fixacao)p.fixacao=p.centro}
  // peças internas da suspensão (sem malha)
  for(const c of Object.keys(CANTOS))for(const e of VIRTUAIS){const p=nova("Suspension."+c+"."+e);p.virtual=true}
  // ligações valem nos dois sentidos (se A liga em B, B liga em A)
  for(const p of lista)for(const q of p.conecta){const o=mapa[q];if(o&&!o.conecta.includes(p.id))o.conecta.push(p.id)}
  // número de peça por vértice (o primeiro dono; vértices na emenda entre duas peças ficam com a primeira)
  const g=new Int16Array(M.p.length/3).fill(-1);lista.forEach((p,n)=>{p.n=n;for(const[i0,i1]of p.faixas)for(let k=i0;k<i1;k++){const v=M.i[k];if(g[v]<0)g[v]=n}});M.g=g;
  // massa suspensa ou não, por vértice (o desenho usa): 0 = carro (suspenso), 1 = roda, cubo, aro e duto de freio (acompanham o chão), 2 = braços e hastes (a ponta do chassi sobe e desce com o carro, a da roda fica)
  const gc=new Float32Array(g.length);for(let v=0;v<g.length;v++){const id=g[v]>=0?lista[g[v]].id:"";gc[v]=id.startsWith("Wheels.")?1:id.startsWith("Suspension.")?2:0}M.gc=gc;
  return{mapa,lista,semDono,triangulos:nT,arvore:arvoreDe(lista)}}
// hierarquia: CarroF1 → Chassi, Cockpit, Carroceria, Suspension, Wheels; MechanicalComponents e DestructibleParts são índices (referências às mesmas peças)
function arvoreDe(lista){const T={CarroF1:{Chassi:{},Cockpit:{},Carroceria:{Nose:[],FrontWing:[],RearWing:[],Sidepods:[],EngineCover:[],Floor:[],Diffuser:[],Mirrors:[]},Suspension:{FrontLeft:[],FrontRight:[],RearLeft:[],RearRight:[]},Wheels:{FrontLeft:[],FrontRight:[],RearLeft:[],RearRight:[]},
  MechanicalComponents:{PowerUnit:["Chassis.PowerUnitBay"],Gearbox:["Chassis.Gearbox"],Steering:[],Uprights:[],SpringsDampers:[]},DestructibleParts:{FrontWingParts:[],RearWingParts:[],BodyParts:[],SuspensionParts:[],WheelParts:[],Mirrors:[]}}};const C=T.CarroF1;
  for(const p of lista){const q=p.id.split(".");
    if(q[0]==="Chassis"){(C.Chassi[q[1]]=C.Chassi[q[1]]||[]).push(p.id)}
    else if(q[0]==="Cockpit"||q[0]==="Driver"){(C.Cockpit[q[0]==="Driver"?"Driver":q[1]]=C.Cockpit[q[0]==="Driver"?"Driver":q[1]]||[]).push(p.id)}
    else if(C.Carroceria[q[0]])C.Carroceria[q[0]].push(p.id);
    else if(q[0]==="Suspension")C.Suspension[q[1]].push(p.id);
    else if(q[0]==="Wheels")C.Wheels[q[1]].push(p.id);
    const MC=C.MechanicalComponents;if(/TrackRod|SteeringColumn|SteeringWheel\.Body/.test(p.id))MC.Steering.push(p.id);if(/\.Upright$/.test(p.id))MC.Uprights.push(p.id);if(/\.(Damper|Spring|Rocker)$/.test(p.id))MC.SpringsDampers.push(p.id);
    if(p.destrutivel){const DP=C.DestructibleParts;const g=q[0]==="FrontWing"?"FrontWingParts":q[0]==="RearWing"?"RearWingParts":q[0]==="Suspension"?"SuspensionParts":q[0]==="Wheels"?"WheelParts":q[0]==="Mirrors"?"Mirrors":"BodyParts";DP[g].push(p.id)}}
  return T}
function indicesPecas(D,ids,dentro){const set=new Set();for(const id of ids)for(const p of D.pecas.lista)if(p.id===id||p.id.startsWith(id+"."))set.add(p);const I=D.mesh.i,out=[];
  if(dentro){for(const p of set)for(const[a,b]of p.faixas)for(let k=a;k<b;k++)out.push(I[k]);return new Uint32Array(out)}
  const fora=[];for(const p of set)fora.push(...p.faixas);fora.sort((x,y)=>x[0]-y[0]);let k=0;for(const[a,b]of fora){for(;k<a;k++)out.push(I[k]);k=Math.max(k,b)}for(;k<I.length;k++)out.push(I[k]);return new Uint32Array(out)}
function submalhaPeca(D,id){const p=D.pecas.mapa[id];if(!p||!p.triangulos)return null;const M=D.mesh,o=p.fixacao||p.centro,map=new Map(),S={p:[],n:[],c:[],m:[],k:[],i:[],fixacao:o};
  for(const[a,b]of p.faixas)for(let k=a;k<b;k++){const v=M.i[k];let w=map.get(v);if(w==null){w=S.p.length/3;map.set(v,w);S.p.push(M.p[v*3]-o[0],M.p[v*3+1]-o[1],M.p[v*3+2]-o[2]);S.n.push(M.n[v*3],M.n[v*3+1],M.n[v*3+2]);S.c.push(M.c[v*3],M.c[v*3+1],M.c[v*3+2]);S.m.push(M.m[v]);S.k.push(M.k[v])}S.i.push(w)}
  return S}
function construir(opt){opt=opt||{};Q=opt.lod||1;
  const COR=hex(opt.cor||"#E5321E"),COR2=hex(opt.cor2||"#F4F4F2"),CARB=hex("#17181B"),PRETO=hex("#0B0B0D");
  const COMP=hex(opt.composto||"#F5C518");COR.k=1;COR2.k=2;COMP.k=3;
  const M=new Mesh();const D={entreEixos:3400,largura:1900};
  const WB=3400,RF=352,RR=356,WF=280,WR=375,YF=950-WF/2,YR=950-WR/2;D.rf=RF;D.rr=RR;D.yf=YF;D.yr=YR;D.wf=WF;D.wr=WR;
  // registro de peças: cada triângulo criado dentro de de(id,...) pertence àquela peça. Não muda vértices, triângulos nem a ordem
  // de desenho: o carro continua idêntico, só passa a saber de que peça é cada triângulo (ver PECAS_INFO e CARRO.pecas)
  const DONO=[];const de=(id,fn)=>{const t0=M.i.length/3;fn();const t1=M.i.length/3;for(let t=t0;t<t1;t++)if(DONO[t]===undefined)DONO[t]=typeof id==="function"?id(centroTri(M,t),t):id};// peça dentro de peça: a de dentro fica com os seus triângulos
  const LD=s=>s<0?"E":"D";// lado: E = esquerda (y < 0 no modelo), D = direita
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
  // bico (ponta e estrutura de impacto), monocoque, capô do motor (parte de cima), carenagem da unidade de potência (laterais de baixo) e câmbio/estrutura traseira
  const secCorpo=c=>{const x=c[0];if(x<-650)return"Nose.Tip";if(x<-60)return"Nose.Cone";if(x<1640)return"Chassis.Monocoque";if(x<3350){const zb=interp(K,x,"zb"),zt=interp(K,x,"zt");return c[2]>zb+(zt-zb)*.55?"EngineCover.Cover":"Chassis.PowerUnitBay"}return"Chassis.Gearbox"};
  de(secCorpo,()=>loft(M,rings,livery,MAT.pintura,{col:COR},{col:CARB,mat:MAT.carbono}));
  // faixa central branca no bico e no capô (decalque fino sobre a superfície)
  const faixa=(x0,x1,larg)=>{const rs=[];for(let x=x0;x<=x1;x+=20/Q){const zt=interp(K,x,"zt");rs.push([[x,-larg,zt+1.5],[x,larg,zt+1.5]])}
    const b=M.p.length/3;for(const r of rs)for(const q of r)M.v(q[0],q[1],q[2],COR2,MAT.pintura);for(let i=0;i<rs.length-1;i++){const a=b+i*2;M.t(a,a+2,a+1);M.t(a+1,a+2,a+3)}};
  de(secCorpo,()=>{faixa(-1000,700,26);faixa(2250,3500,22)});// a faixa pintada acompanha a peça em que está
  // abertura do cockpit
  de("Chassis.CockpitOpening",()=>{const N=Math.max(16,Math.round(60*Q)),rs=[];for(let k=0;k<N;k++){const a=k/N*Math.PI*2;const x=1330+Math.cos(a)*330,y=Math.sin(a)*190;rs.push([x,y,interp(K,x,"zt")+2])}
    const c0=M.v(1330,0,interp(K,1330,"zt")+2,PRETO,MAT.escuro);const b=M.p.length/3;for(const q of rs)M.v(q[0],q[1],q[2],PRETO,MAT.escuro);for(let k=0;k<N;k++)M.t(c0,b+k,b+(k+1)%N);
    // borda do cockpit (acolchoado)
    de("Chassis.CockpitRim",()=>tubo(M,[...rs,rs[0]].map(q=>[q[0],q[1],q[2]+6]),16,12,CARB,MAT.carbono,10))});
  // piloto: capacete
  de("Driver.Helmet",()=>esfera(M,[1420,0,700],128,d=>{if(d[0]<-.42&&d[2]>-.15&&d[2]<.32)return PRETO;if(d[2]>.55)return COR;if(Math.abs(d[1])<.12&&d[2]>0)return COR;return COR2},MAT.capacete));
  // ---------- volante com tela (visto da câmera onboard)
  {const VC=hex("#1A1C20"),TELA=hex("#1D5566"),LED=hex("#2BE07A");const xv=1215;
    de("Cockpit.SteeringWheel.Body",()=>loft(M,[anel(xv-14,0,140,505,615,32,3,3),anel(xv+14,0,140,505,615,32,3,3)],()=>VC,MAT.carbono,{col:VC},{col:VC}));
    de("Cockpit.SteeringWheel.Display",()=>loft(M,[anel(xv+15,0,56,535,590,20,4,4),anel(xv+19,0,56,535,590,20,4,4)],()=>TELA,MAT.branco,{col:TELA},{col:TELA}));
    de("Cockpit.SteeringWheel.ShiftLights",()=>loft(M,[anel(xv+15,0,86,598,606,20,6,6),anel(xv+19,0,86,598,606,20,6,6)],()=>LED,MAT.branco,{col:LED},{col:LED}));
    for(const s of[-1,1])de("Cockpit.SteeringWheel.Grip."+LD(s),()=>tubo(M,[[xv+10,s*140,515],[xv+20,s*155,560],[xv+10,s*140,610]],18,18,hex("#2F3A8C"),MAT.escuro,10));
    de("Cockpit.SteeringColumn",()=>tubo(M,[[xv-20,0,560],[1060,0,520]],14,14,VC,MAT.carbono,8))}
  // ---------- tomada de ar / santantônio
  {const KA=[{x:1640,hw:105,zt:905},{x:1720,hw:128,zt:930},{x:1900,hw:150,zt:900},{x:2250,hw:175,zt:760}];const rs=[];
    for(let x=1640;x<=2250;x+=18/Q){const zt=interp(KA,x,"zt"),hw=interp(KA,x,"hw");rs.push(anel(x,0,hw,interp(K,x,"zt")-60,zt,48,2.4,3,.9))}
    de("Chassis.Airbox",()=>loft(M,rs,()=>COR,MAT.pintura,{col:PRETO,mat:MAT.escuro},null));
    // câmera T (topo)
    de("Chassis.TCam",()=>{placaH(M,940,10,[[1690,-70],[1770,-70],[1770,70],[1690,70]],PRETO,MAT.escuro);placa(M,0,20,[[1700,920],[1760,920],[1755,936],[1705,936]],PRETO,MAT.escuro)});
    // tomadas laterais do santantônio
    for(const s of[-1,1])de("Chassis.AirboxInlet."+LD(s),()=>loft(M,[anel(1700,s*112,28,790,880,20,2,2),anel(1740,s*120,32,780,885,20,2,2)],()=>PRETO,MAT.escuro,{col:PRETO},{}))}
  // barbatana do capô
  de("EngineCover.SharkFin",()=>placa(M,0,10,[[2100,760],[2400,800],[3350,640],[3420,440],[3200,440],[2300,700]],COR,MAT.pintura));
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
    de("Sidepods."+LD(s)+".Body",()=>loft(M,rs,lv,MAT.pintura,{col:PRETO,mat:MAT.escuro},{col:CARB,mat:MAT.carbono}));
    // lábio da entrada
    de("Sidepods."+LD(s)+".InletLip",()=>tubo(M,[...rs[0],rs[0][0]].map(q=>[q[0]-4,q[1],q[2]]),12,12,CARB,MAT.carbono,10));
    // espelho
    const my=s*600,mx=1080,mz=700;de("Mirrors."+LD(s)+".Housing",()=>loft(M,[anel(mx-10,my,8,mz-5,mz+5,28,2,2),anel(mx,my,75,mz-28,mz+28,28,3,3),anel(mx+40,my,82,mz-32,mz+30,28,3,3),anel(mx+70,my,60,mz-22,mz+22,28,3,3)],()=>COR,MAT.pintura,{},{col:hex("#C9D2DA"),mat:MAT.metal}));
    de("Mirrors."+LD(s)+".Stalk",()=>tubo(M,[[mx+40,my-s*40,mz-25],[mx+90,s*500,600]],10,22,CARB,MAT.carbono,10));
    // defletores (bargeboard simplificado) à frente do sidepod
  }
  // ---------- assoalho
  {const F=[[520,300],[900,600],[1250,720],[2500,720],[2900,620],[3150,560],[3330,540]];
    const poly=[];for(const[x,y]of F)poly.push([x,y]);for(let i=F.length-1;i>=0;i--)poly.push([F[i][0],-F[i][1]]);
    // triangulação: faixa de quads entre os dois lados
    const z0=36,z1=54;de("Floor.Plank",()=>{const b=M.p.length/3;for(const[x,y]of F){M.v(x,y,z1,CARB,MAT.carbono);M.v(x,-y,z1,CARB,MAT.carbono)}
    for(let i=0;i<F.length-1;i++){const a=b+i*2;M.t(a,a+1,a+2);M.t(a+1,a+3,a+2)}
    const b2=M.p.length/3;for(const[x,y]of F){M.v(x,y,z0,PRETO,MAT.carbono);M.v(x,-y,z0,PRETO,MAT.carbono)}
    for(let i=0;i<F.length-1;i++){const a=b2+i*2;M.t(a,a+2,a+1);M.t(a+1,a+2,a+3)}});
    for(const s of[-1,1]){// borda lateral levantada (edge wing)
      const pts=F.map(([x,y])=>[x,s*y,45]);const rs=pts.map(p=>[[p[0],p[1],36],[p[0],p[1]+s*8,36],[p[0],p[1]+s*8,82],[p[0],p[1],82]]);de("Floor.EdgeWing."+LD(s),()=>loft(M,rs,()=>CARB,MAT.carbono,{},{}));
      // aleta da borda do assoalho
      de("Floor.EdgeFin."+LD(s),()=>asa(M,[{y:s*700,x:1500,z:96,c:200,a:.15},{y:s*730,x:1520,z:110,c:170,a:.25}],()=>CARB,MAT.carbono))}
    // difusor: rampa + paredes
    const rs=[];for(let x=3150;x<=3760;x+=30/Q){const t=(x-3150)/610;const z=54+Math.pow(t,1.6)*290;const hw=540-t*20;rs.push([[x,-hw,z],[x,hw,z]])}
    de("Diffuser.Ramp",()=>{const b3=M.p.length/3;for(const r of rs)for(const q of r)M.v(q[0],q[1],q[2],CARB,MAT.carbono);for(let i=0;i<rs.length-1;i++){const a=b3+i*2;M.t(a,a+2,a+1);M.t(a+1,a+2,a+3);M.t(a,a+1,a+2);M.t(a+1,a+3,a+2)}});
    for(const yy of[-525,-300,-120,120,300,525]){const P=[];for(let x=3150;x<=3760;x+=40/Q){const t=(x-3150)/610;P.push([x,54+Math.pow(t,1.6)*290])}
      de("Diffuser.Strake."+LD(yy)+(Math.abs(yy)>400?"3":Math.abs(yy)>200?"2":"1"),()=>placa(M,yy,10,[...P.map(([x,z])=>[x,z]),[3760,40],[3150,40]].reverse(),CARB,MAT.carbono))}
  }
  // ---------- asa dianteira
  {const HW=860;const ele=[];
    const pf=perfil(.065,.4,.10);
    const mk=(i,y)=>{const u=Math.abs(y)/HW;const lift=Math.pow(Math.max(0,(u-.25)/.75),1.7);
      if(i===0)return{y,x:-1080+u*30,z:72+lift*40,c:300-u*40,a:.05+lift*.1};
      if(i===1)return{y,x:-860+u*10-lift*30,z:120+lift*110,c:190-u*30,a:.42+lift*.25};
      return{y,x:-745-lift*60,z:185+lift*160,c:140-u*20,a:.78+lift*.3}};
    for(let i=0;i<3;i++){const st=[];for(let k=0;k<=60;k++){const y=-HW+k/60*2*HW;st.push(mk(i,y))}
      const el=["MainPlane","Flap1","Flap2"][i];de(c=>"FrontWing."+el+"."+(c[1]<0?"E":"D"),()=>asa(M,st,q=>{const u=Math.abs(q[1])/HW;return i===2&&u>.3?COR:(i===1&&u>.55?COR2:CARB)},MAT.carbono,pf))}
    for(const s of[-1,1]){de("FrontWing.Endplate."+LD(s),()=>placa(M,s*(HW+6),12,[[-1100,46],[-620,46],[-590,160],[-635,262],[-760,292],[-1000,205],[-1095,112]],COR,MAT.pintura));
      de("FrontWing.Footplate."+LD(s),()=>placa(M,s*(HW-40),8,[[-1050,40],[-700,40],[-700,70],[-1050,70]],CARB,MAT.carbono))}
    // suportes do bico
    for(const s of[-1,1])de("FrontWing.Pylon."+LD(s),()=>placa(M,s*45,10,[[-1000,90],[-760,110],[-760,180],[-960,170]],CARB,MAT.carbono))}
  // ---------- asa traseira
  {const HW=505;const pf=perfil(.08,.42,.11);
    const est=(x,z,c,a,curva)=>{const st=[];for(let k=0;k<=50;k++){const y=-HW+k/50*2*HW;const u=Math.abs(y)/HW;st.push({y,x,z:z-curva*(1-u*u),c,a})}return st};
    de("RearWing.MainPlane",()=>asa(M,est(3770,750,340,.18,26),()=>CARB,MAT.carbono,pf));
    de("RearWing.Flap",()=>asa(M,est(3995,815,230,.6,18),q=>COR,MAT.pintura,pf));// flap móvel (asa aberta nas retas)
    de("RearWing.BeamWing",()=>asa(M,est(3850,410,180,.2,0).map(s=>({...s,y:s.y*.82})),()=>CARB,MAT.carbono,pf));// beam wing
    for(const s of[-1,1]){de("RearWing.Endplate."+LD(s),()=>placa(M,s*(HW+8),12,[[3700,330],[4120,330],[4290,640],[4300,900],[4270,960],[3880,965],[3790,930],[3740,780]],CARB,MAT.carbono));de("RearWing.EndplatePanel."+LD(s),()=>placa(M,s*(HW+15),4,[[3800,880],[4295,880],[4300,900],[4270,948],[3880,950],[3790,920]],COR,MAT.pintura));
      de("RearWing.EndplateStripe."+LD(s),()=>placa(M,s*(HW+16),6,[[3770,850],[4292,850],[4293,866],[3778,866]],COR2,MAT.pintura))}
    // pilone central (pescoço de cisne)
    de("RearWing.Pylon",()=>placa(M,0,14,[[3560,360],[3650,350],[3880,700],[3920,815],[3850,820],[3790,760]],CARB,MAT.carbono));
    // luz de chuva
    de("Chassis.RainLight",()=>placa(M,0,60,[[3712,262],[3740,262],[3740,300],[3712,300]],hex("#FF2A2A"),MAT.escuro))}
  // ---------- halo
  {const pts=[];const hy=255,top=842;
    for(const [x,y,z] of[[1560,-265,640],[1520,-268,720],[1440,-262,800],[1330,-250,top]])pts.push([x,y,z]);
    for(let k=0;k<=24;k++){const a=Math.PI+k/24*Math.PI;pts.push([960+Math.sin(a+Math.PI/2)*0+ (1330-960)*(1-Math.abs(Math.sin(a))) ,Math.cos(a)*hy*-1*0+0,top])}
    // anel superior como meia-elipse
    const ring=[];for(let k=0;k<=30;k++){const a=-Math.PI/2+k/30*Math.PI;ring.push([1500-Math.cos(a)*430,Math.sin(a)*hy,top+Math.cos(a)*14])}
    const path=[[1680,-262,640],[1650,-264,740],[1590,-260,815],...ring,[1590,260,815],[1650,264,740],[1680,262,640]];
    de("Chassis.Halo.Hoop",()=>tubo(M,path,26,22,CARB,MAT.carbono,16));
    de("Chassis.Halo.Pillar",()=>tubo(M,[[1075,0,top+8],[1030,0,770],[960,0,690],[900,0,640]],20,14,CARB,MAT.carbono,16))}
  // ---------- suspensão (perfis aerodinâmicos achatados)
  const braco=(a,b,c)=>{tubo(M,[a,b],22,8,CARB,MAT.carbono,10);if(c)tubo(M,[c,b],22,8,CARB,MAT.carbono,10)};
  for(const s of[-1,1]){const F="Suspension.Front"+(s<0?"Left":"Right")+".",T="Suspension.Rear"+(s<0?"Left":"Right")+".";
    de(F+"UpperWishbone",()=>braco([-230,s*170,470],[0,s*(YF-150),455],[260,s*180,490]));
    de(F+"LowerWishbone",()=>braco([-280,s*120,250],[15,s*(YF-150),225],[330,s*130,265]));
    de(F+"TrackRod",()=>tubo(M,[[-120,s*150,345],[-105,s*(YF-150),330]],18,8,CARB,MAT.carbono,10));// barra de direção
    de(F+"Pushrod",()=>tubo(M,[[40,s*(YF-160),235],[150,s*190,520]],16,16,CARB,MAT.carbono,10));
    de(T+"UpperWishbone",()=>braco([WB-260,s*150,470],[WB,s*(YR-195),480],[WB+250,s*140,490]));
    de(T+"LowerWishbone",()=>braco([WB-300,s*140,250],[WB,s*(YR-195),225],[WB+270,s*120,250]));
    de(T+"ToeLink",()=>tubo(M,[[WB+200,s*130,340],[WB+190,s*(YR-195),340]],18,8,CARB,MAT.carbono,10));// barra de convergência
    de(T+"Pullrod",()=>tubo(M,[[WB+20,s*(YR-205),440],[WB-180,s*120,240]],16,16,CARB,MAT.carbono,10));
  }
  // ---------- rodas
  const roda=(cx,cy,R,W,s,id)=>{const w=W/2,RIM=229;
    // pneu: perfil do lado de dentro para fora
    const pf=[];const L=[[RIM,-w+6],[RIM+30,-w],[R-70,-w-4],[R-30,-w+4],[R-8,-w+30],[R,-w+70],[R,w-70],[R-8,w-30],[R-30,w-4],[R-70,w],[RIM+92,w+2],[RIM+92,w+2,COMP],[RIM+70,w+2,COMP],[RIM+70,w+2],[RIM+30,w],[RIM,w-6]];
    for(const q of L)pf.push(q);de(id+".Tyre",()=>torno(M,cx,cy,RR===R?RR:R,pf.map(([r,dy,c])=>[r,dy,c]),hex("#141416"),MAT.pneu,96,s));
    // aro (tampa de roda) e cubo
    de(c=>Math.hypot(c[0]-cx,c[2]-R)<55?id+".Hub":id+".Rim",()=>torno(M,cx,cy,R,[[RIM,w-6],[RIM-6,w-4],[200,w-14],[60,w-30],[40,w-28],[30,w-10],[0,w-10]],hex("#2A2C30"),MAT.roda,64,s));// aro e, no centro, o cubo com a porca
    de(id+".RimInner",()=>torno(M,cx,cy,R,[[RIM,-w+6],[RIM-10,-w+20],[150,-w+60],[0,-w+60]],hex("#1E1F22"),MAT.roda,48,-s));// face interna (cobre disco e pinça)
    // duto de freio
    de(id+".BrakeDuct",()=>tubo(M,[[cx-20,cy-s*(w+30),R+40],[cx-60,cy-s*(w+120),R+20]],70,60,CARB,MAT.carbono,16,[1,0,0]))};
  for(const s of[-1,1]){roda(0,s*YF,RF,WF,s,"Wheels.Front"+(s<0?"Left":"Right"));roda(WB,s*YR,RR,WR,s,"Wheels.Rear"+(s<0?"Left":"Right"))}
  // torno usa cz=R: corrigir — torno(M,cx,cy,cz,...)
  M.normais();D.mesh=M;
  D.pecas=montaPecas(M,DONO,{WB,RF,RR,WF,WR,YF,YR});M.pecas=D.pecas;D.arvore=D.pecas.arvore;return D}
G.CARRO={construir,MAT,PECAS_INFO,
  // acesso às peças (preparação para o sistema de danos; nada aqui muda o desenho atual)
  peca:(D,id)=>D.pecas.mapa[id]||null,
  lista:(D,filtro)=>D.pecas.lista.filter(p=>!filtro||Object.entries(filtro).every(([k,v])=>p[k]===v)),
  destrutiveis:D=>D.pecas.lista.filter(p=>p.destrutivel),
  doGrupo:(D,prefixo)=>D.pecas.lista.filter(p=>p.id===prefixo||p.id.startsWith(prefixo+".")),
  // índices de triângulo só das peças pedidas (ex.: desenhar ou soltar uma asa sozinha)
  indicesDe:(D,ids)=>indicesPecas(D,ids,true),
  // índices do carro sem as peças pedidas (ex.: carro sem a asa dianteira)
  indicesSem:(D,ids)=>indicesPecas(D,ids,false),
  // malha independente de uma peça (vértices copiados, posição relativa ao ponto de fixação): para soltar e voar
  submalha:(D,id)=>submalhaPeca(D,id)};
})(typeof window!=="undefined"?window:globalThis);

// ---------- Pintura com patrocinadores: textura com os logos + posições no carro (mm do modelo)
(function(G){
// eixo 0 = projeção lateral (x,z) · eixo 1 = projeção de cima (y,x) · eixo 2 = de cima ao longo do carro (x,|y|)
// a:[eixo,cx,cy,espelha] b:[meia-largura,meia-altura,limite min,limite max] s: área da textura
const DECAIS=[
  {a:[0,2030,415,1],b:[430,82,420,820],s:"m"},          // sidepods: patrocinador principal
  {a:[0,2470,603,1],b:[285,40,110,265],s:"s"},          // capô do motor: secundário
  {a:[0,4030,690,1],b:[235,46,512,545],s:"m"},          // placas da asa traseira (lado de fora)
  {a:[1,0,3985,0],b:[430,84,690,1100],s:"mw"},          // asa traseira vista de cima
  {a:[1,0,-430,0],b:[78,100,150,700],s:"n"},            // número no bico
  {a:[0,-835,200,1],b:[165,34,840,900],s:"s"},          // placas da asa dianteira
  {a:[0,2905,615,1],b:[92,68,0,14],s:"n"},              // número na barbatana
  {a:[0,1735,840,1],b:[80,26,110,160],s:"t"},
  {a:[2,1830,470,1],b:[330,64,380,720],s:"m"},          // topo dos sidepods: principal
  {a:[2,2640,0,0],b:[300,42,560,820],s:"s"}];           // topo do capô: secundário          // tomada de ar: nome da equipe
const GLSL=`
uniform sampler2D uDT;uniform int uDN;uniform vec4 uDA[12];uniform vec4 uDB[12];uniform vec4 uDR[12];
vec4 decal(vec3 p,vec3 n){vec4 acc=vec4(0.);for(int i=0;i<12;i++){if(i>=uDN)break;vec4 a=uDA[i],b=uDB[i],r=uDR[i];vec2 q;float dep,nc;
  if(a.x<.5){q=vec2(p.x,p.z);dep=abs(p.y);nc=abs(n.y);}else if(a.x<1.5){q=vec2(p.y,p.x);dep=p.z;nc=abs(n.z);}else{q=vec2(p.x,a.w>.5?abs(p.y):p.y);dep=p.z;nc=abs(n.z);}
  vec2 uv=(q-a.yz)/b.xy;if(a.x<.5){if(a.w>.5&&p.y>0.)uv.x=-uv.x;}else if(a.x<1.5){uv=vec2(uv.x,-uv.y);}else{if(a.w>.5&&p.y<0.)uv.x=-uv.x;}
  if(abs(uv.x)>1.||abs(uv.y)>1.||dep<b.z||dep>b.w||nc<.3)continue;
  vec2 t=vec2(mix(r.x,r.z,uv.x*.5+.5),mix(r.y,r.w,.5-uv.y*.5));vec4 c=texture(uDT,t);acc=c+acc*(1.-c.a);}
  return acc;}`;
// áreas da textura (0..1, y para baixo)
const AREA={m:[0,0,1,.37],mw:[0,0,1,.37],s:[0,.38,1,.66],n:[0,.68,.125,1],t:[.15,.7,.6,1]};
const imgs={};
function marca(sp,cb){if(!sp||typeof SP_MARK==="undefined")return null;const k=sp.id||sp.n;if(imgs[k])return imgs[k].complete?imgs[k]:null;
  const f=SP_MARK[sp.mk]||SP_MARK.diamond;const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96"><rect width="24" height="24" rx="5" fill="${sp.c}"/>${f(sp.c2)}</svg>`;
  const im=new Image();im.onload=()=>cb&&cb();im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);imgs[k]=im;return null}
const FONTE="'Titillium Web','Inter',system-ui,sans-serif";
function rr(x,c,X,Y,W,H,R){x.beginPath();x.moveTo(X+R,Y);x.arcTo(X+W,Y,X+W,Y+H,R);x.arcTo(X+W,Y+H,X,Y+H,R);x.arcTo(X,Y+H,X,Y,R);x.arcTo(X,Y,X+W,Y,R);x.closePath();x.fillStyle=c;x.fill()}
function logo(x,sp,X,Y,W,H,cb){if(!sp)return;const nome=String(sp.n).toUpperCase();
  // tamanho do texto para caber
  let fs=H*.6;x.font=`700 ${fs}px ${FONTE}`;const tw=()=>x.measureText(nome).width;const livre=W-H*1.25;while(tw()>livre&&fs>8){fs-=1;x.font=`700 ${fs}px ${FONTE}`}
  const lw=Math.min(W,H*1.25+tw()+H*.35),ox=X+(W-lw)/2;rr(x,sp.c2,ox,Y,lw,H,H*.16);
  const im=marca(sp,cb);const pad=H*.1;if(im)x.drawImage(im,ox+pad,Y+pad,H-2*pad,H-2*pad);else rr(x,sp.c,ox+pad,Y+pad,H-2*pad,H-2*pad,H*.14);
  x.fillStyle=sp.c;x.textBaseline="middle";x.textAlign="left";x.fillText(nome,ox+H*1.05,Y+H*.54)}
// monta a textura de uma equipe: {m,s} patrocinadores, num número, nome da equipe
function textura(o,W=1024,cb){const H=W/2;const cv=o.canvas||document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");x.clearRect(0,0,W,H);
  const ar=k=>{const a=AREA[k];return[a[0]*W,a[1]*H,(a[2]-a[0])*W,(a[3]-a[1])*H]};
  let r=ar("m");logo(x,o.m,r[0]+4,r[1]+4,r[2]-8,r[3]-8,cb);
  r=ar("s");logo(x,o.s||o.m,r[0]+4,r[1]+4,r[2]-8,r[3]-8,cb);
  r=ar("n");const num=String(o.num??"");if(num){let fs=r[3]*.92;x.font=`900 italic ${fs}px ${FONTE}`;while(x.measureText(num).width>r[2]*.92&&fs>8){fs-=2;x.font=`900 italic ${fs}px ${FONTE}`}
    x.textAlign="center";x.textBaseline="middle";x.lineJoin="round";x.lineWidth=fs*.12;x.strokeStyle="rgba(10,10,12,.9)";x.strokeText(num,r[0]+r[2]/2,r[1]+r[3]*.54);x.fillStyle="#FFFFFF";x.fillText(num,r[0]+r[2]/2,r[1]+r[3]*.54)}
  r=ar("t");if(o.equipe){let fs=r[3]*.8;const t=String(o.equipe).toUpperCase();x.font=`800 ${fs}px ${FONTE}`;while(x.measureText(t).width>r[2]*.95&&fs>8){fs-=1;x.font=`800 ${fs}px ${FONTE}`}
    x.textAlign="center";x.textBaseline="middle";x.fillStyle=o.corTexto||"#FFFFFF";x.fillText(t,r[0]+r[2]/2,r[1]+r[3]*.55)}
  return cv}
// uniforms dos decalques (arrays planos)
function uniforms(){const A=[],B=[],Rr=[];for(const d of DECAIS){A.push(...d.a);B.push(...d.b);const a=AREA[d.s];Rr.push(a[0],a[1],a[2],a[3])}return{A:new Float32Array(A),B:new Float32Array(B),R:new Float32Array(Rr),n:DECAIS.length}}
// patrocinadores de uma equipe (usa o catálogo do jogo quando existe)
function patrocinios(id,nome){if(typeof carSponsors==="function"){const t={id:id||nome,n:nome};const r=carSponsors(t);if(r&&r.m)return r}
  return{m:{id:"paddock",n:"Paddock GP",c:"#FF4D2E",c2:"#111216",mk:"diamond"},s:{id:"liga",n:"Liga Paddock",c:"#FFFFFF",c2:"#FF4D2E",mk:"play"}}}
G.DECAL={GLSL,textura,uniforms,patrocinios,DECAIS,logo};
})(typeof window!=="undefined"?window:globalThis);

// Renderizador WebGL2 do Paddock P26: estúdio, reflexos, sombras suaves
(function(G){if(typeof document==="undefined")return;
const VS=`#version 300 es
in vec3 aP;in vec3 aN;in vec3 aC;in float aM;in float aK;uniform mat4 uVP;uniform mat4 uL;uniform vec3 uCor;uniform vec3 uCor2;uniform vec3 uComp;out vec3 vP;out vec3 vN;out vec3 vC;out float vM;out vec4 vL;flat out float vK;
void main(){vP=aP;vN=aN;vC=aK>2.5?uComp:aK>1.5?uCor2:aK>.5?uCor:aC;vM=aM;vK=aK;vL=uL*vec4(aP,1.);gl_Position=uVP*vec4(aP,1.);}`;
const FS=`#version 300 es
precision highp float;in vec3 vP;in vec3 vN;in vec3 vC;in float vM;in vec4 vL;flat in float vK;uniform vec3 uCor;uniform vec3 uCor2;uniform vec3 uComp;`+(typeof DECAL!=="undefined"?DECAL.GLSL:"")+`uniform vec3 uEye;uniform int uOrtho;uniform vec3 uDir;uniform sampler2D uS;uniform int uChao;uniform vec3 uFundo;uniform float uEsc;out vec4 o;
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
  int m=int(vM+.5);int k=int(vK+.5);vec3 base=vC;float rough=.3,spec=.5,fres=.6,metal=0.;
  if(m==0){rough=.12;spec=1.;fres=1.;}// pintura brilhante com verniz
  else if(m==1){rough=.32;spec=.45;fres=.55;// fibra de carbono: trama sutil
    vec3 q=vP*.09;float w=step(.5,fract(q.x+q.y+q.z))*.5+step(.5,fract((q.x-q.y)*.5+q.z));base*=.85+.18*w;}
  else if(m==2){rough=.75;spec=.12;fres=.15;}
  else if(m==3){rough=.3;spec=.7;fres=.5;metal=.6;}
  else if(m==4){rough=.05;spec=1.4;fres=1.;metal=1.;}
  else if(m==5){rough=.4;spec=.3;fres=.3;}
  else if(m==6){rough=.1;spec=1.;fres=1.;}
  else if(m==8){rough=.15;spec=.8;fres=.8;}
  if(uDN>0&&(m==0||m==1||m==8)){vec4 dc=decal(vP,normalize(vN));base=mix(base,dc.rgb,dc.a);if(dc.a>.5){rough=.16;spec=.85;fres=.9;}}
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
  gl.uniform3fv(u("uFundo"),fundo);const cs=this.cores||{};if(this.dt){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.dt);gl.uniform1i(u("uDT"),1);const du=DECAL.uniforms();gl.uniform4fv(u("uDA"),du.A);gl.uniform4fv(u("uDB"),du.B);gl.uniform4fv(u("uDR"),du.R);gl.uniform1i(u("uDN"),du.n);gl.activeTexture(gl.TEXTURE0)}else gl.uniform1i(u("uDN"),0);gl.uniform3fv(u("uCor"),cs.cor||[.9,.2,.12]);gl.uniform3fv(u("uCor2"),cs.cor2||[.95,.95,.95]);gl.uniform3fv(u("uComp"),cs.comp||[.96,.77,.1]);gl.uniform1f(u("uEsc"),esc);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.st);gl.uniform1i(u("uS"),0);
  if(chao){gl.uniform1i(u("uChao"),1);gl.bindVertexArray(this.gvao);gl.depthMask(true);gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_INT,0)}
  gl.uniform1i(u("uChao"),0);gl.bindVertexArray(this.vao);gl.drawElements(gl.TRIANGLES,this.nI,gl.UNSIGNED_INT,0)};
Render.prototype.decal=function(cv){const gl=this.gl;if(!this.dt)this.dt=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.dt);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const ext=gl.getExtension("EXT_texture_filter_anisotropic");if(ext)gl.texParameterf(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT,8)};
G.Render3D=Render;
})(typeof window!=="undefined"?window:globalThis);

// ---------- gancho do 3D na cena do jogo, atalho de teste e medidor de desempenho (?medidor=1)
(function(){if(typeof window==="undefined"||typeof document==="undefined"||typeof location==="undefined")return;
const QS=new URLSearchParams(location.search);
const C3D=window.C3D={medidor:QS.get("medidor")==="1"||!!window.C3D_MED,fr:0,erro:null};
// Os carros só existem em 3D (P3D, abaixo). Aqui fica o gancho: a cena do jogo é desenhada pelo 3D em todas as telas.
function instala(){const ds=window.drawScene;if(C3D.inst||typeof ds!=="function"||ds._c3d)return false;C3D.inst=true;/* uma vez só (o medidor de desempenho embrulha a função depois) */
  {C3D.dsOrig=ds;window.drawScene=function(){if(window.P3D&&P3D.on&&arguments[0]&&arguments[0].canvas){try{P3D.desenha(...arguments);return}catch(e){/* erro no 3D: recria os contextos e tenta de novo no próximo quadro (sem trocar para os carros 2D) */if(P3D.falhou&&P3D.falhou(e))return;P3D.on=false;P3D.erro=String(e.message||e);console.error("3D desligado:",e);if(P3D.avisa)P3D.avisa()}}C3D.fr++;const t0=performance.now();const r=ds.apply(this,arguments);C3D.msCena=performance.now()-t0;C3D.amostra(C3D.msCena);return r};window.drawScene._c3d=true}
  return true}
// atalho: cria carreira e vai direto para a largada
async function atalho(){const cl=s=>{const v=[...document.querySelectorAll(s)].find(e=>e.offsetParent!==null);if(v){v.click();return true}return false};const w=ms=>new Promise(r=>setTimeout(r,ms));
  try{if(!cl('[data-act=newCareer]'))cl('[data-act=mnNew]');await w(500);const f=document.querySelector('#fname');if(f){f.value='Piloto Teste';f.dispatchEvent(new Event('input',{bubbles:true}));cl('[data-act=createGo]');await w(600)}
  cl('[data-act=goWeekend]');await w(600);for(let i=0;i<8&&cl('[data-act=answer]');i++)await w(400);
  for(const s of['[data-act=toPractice]','[data-act=practice]','[data-act=toQuali]']){cl(s);await w(450)}
  if(typeof doQuali==='function'){doQuali('normal');W.step='prerace';render();await w(600)}cl('[data-act=startRace]')}catch(e){C3D.erro='atalho: '+(e.message||e)}}
// medidor de desempenho
const AM=[];let fps=0,ult=performance.now(),qn=0,el=null;
C3D.amostra=ms=>{AM.push(ms);if(AM.length>120)AM.shift()};
function medidor(){if(!C3D.medidor)return;if(!el){el=document.createElement("div");el.id="c3dMed";el.style.cssText="position:fixed;left:8px;top:8px;z-index:99999;background:rgba(10,12,16,.86);color:#E8EAEE;font:600 12px/1.45 ui-monospace,Menlo,monospace;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.14);min-width:190px;pointer-events:auto";document.body.appendChild(el);
  el.addEventListener("click",e=>{const b=e.target.closest("[data-c3d]");if(!b)return;const a=b.dataset.c3d;if(a==="cam"){P3D.cam=(P3D.cam+1)%P3D.nomes.length;P3D._corte=true}if(a==="ver"){window.open(window.C3D_VISOR||"carro3d.html","_blank")}if(a==="ir")atalho()})}
  qn++;const t=performance.now();if(t-ult>=1000){fps=qn*1000/(t-ult);qn=0;ult=t;const m=AM.length?AM.reduce((a,b)=>a+b,0)/AM.length:0;const p95=AM.length?[...AM].sort((a,b)=>a-b)[Math.floor(AM.length*.95)]:0;
    el.innerHTML=`<div style="color:#FF6A4D;letter-spacing:.08em">DESEMPENHO 3D</div><div>FPS: <b>${fps.toFixed(0)}</b>${window.P3D&&P3D.on?` · pista ${((P3D.stat?P3D.stat.tris:P3D.tris||0)/1000).toFixed(0)}k de ${((P3D.tris||0)/1000).toFixed(0)}k tri desenhados · ${P3D.stat?P3D.stat.carros:P3D.nv||0} carros na tela · resolução ${Math.round((P3D.esc||1)*100)}%`:" · sem 3D: carros não aparecem"}</div><div>quadro: ${m.toFixed(1)} ms (p95 ${p95.toFixed(1)})</div>${window.P3D&&P3D.erro?`<div style="color:#f66">${P3D.erro}</div>`:""}`}
  }
(function loop(){try{instala();if(window.P3D)P3D.quadro();medidor()}catch(e){}requestAnimationFrame(loop)})();
})();

// ---------- PISTA 3D (TESTE): a corrida do jogo desenhada numa cena 3D com câmera em perspectiva
(function(){if(typeof window==="undefined"||typeof document==="undefined"||typeof location==="undefined")return;
const P3=window.P3D={on:true,cam:0,ms:0,tris:0,erro:null,esc:1};
const CAMS=["Isométrica","Perseguição","TV","Onboard","Aérea"];P3.nomes=CAMS;
const hex=h=>{h=String(h||"#888");if(h.length===4)h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];return[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255]};
const VS=`#version 300 es
in vec3 aP;in vec3 aN;in vec3 aC;in float aM;in float aK;in float aG;in float aPc;uniform vec4 uPD[30];out float vD;
uniform mat4 uVP;uniform mat4 uMod;uniform mat3 uNM;uniform vec3 uCor;uniform vec3 uCor2;uniform vec3 uComp;uniform float uT;uniform float uExc;uniform vec4 uVivo;uniform vec4 uRol;uniform vec4 uRoda;uniform vec4 uSusp;uniform vec4 uProj;uniform float uProjOn;
out vec3 vW;out vec3 vN;out vec3 vC;out float vM;out vec3 vMP;out vec3 vMN;
mat2 rot(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
void main(){vec3 P=aP;int mm=int(aM+.5);vD=0.;
  if(uVivo.w>.5){/* dano por peça (dano3d.js): amassa, cede para o chão ou some (solta) */int pq=int(aPc+.5)-1;if(pq>=0&&pq<120){float s=uPD[pq/4][pq%4];vD=s;
      if(s>1.95)P=vec3(0.,0.,-9000.);else if(s>.02){vec3 h=vec3(sin(P.x*.011+P.y*.007),sin(P.y*.013+P.z*.009),sin(P.z*.012+P.x*.005)+.4);P+=h*min(s,1.)*42.;if(s>1.)P.z=mix(P.z,max(18.,P.z-280.),clamp((s-1.)/.6,0.,1.));}}
    bool roda=(mm==2||mm==3);
    if(roda){float fr=P.x<1700.?1.:0.;float sd=P.y>0.?1.:0.;float perdeu=fr>.5?(sd>.5?uRoda.y:uRoda.x):(sd>.5?uRoda.w:uRoda.z);
      if(perdeu>.5)P=vec3(P.x,P.y,-900.);else if(fr>.5){vec2 c=vec2(0.,sd>.5?810.:-810.);P.xy=c+rot(uVivo.y)*(P.xy-c);}}
    else{if(P.x>3988.&&P.x<4265.&&P.z>790.&&abs(P.y)<507.){vec2 c=vec2(3995.,818.);P.xz=c+rot(-uVivo.z*.42)*(P.xz-c);}
      if(uRol.z>.5&&P.x<-560.&&P.z<450.&&abs(P.y)>230.)P=vec3(P.x,P.y*.3,-900.);
      if(uRol.w>.5&&P.x>3690.&&P.z>620.){P.z-=(P.y>0.?260.:120.);P.x+=60.;}
      // suspensão: cada canto afunda (uSusp, mm; + = desce) conforme a carga daquela roda; a carroceria segue o plano dos 4 cantos.
      // rodas, cubos e dutos ficam no chão; braços e hastes inclinam (a ponta do chassi acompanha o carro, a da roda não)
      float dz=mix(mix(uSusp.x,uSusp.y,(P.y+800.)/1600.),mix(uSusp.z,uSusp.w,(P.y+800.)/1600.),P.x/3400.);
      float wz=aG<.5?1.:aG<1.5?0.:clamp(((P.x<1700.?660.:567.)-abs(P.y))/((P.x<1700.?660.:567.)-140.),0.,1.);P.z-=dz*wz;}}
  vec4 w=uMod*vec4(P,1.);if(uProjOn>.5){vec3 L=uProj.xyz;float t=(w.z-uProj.w)/max(.2,L.z);w.xyz-=L*t;w.z=uProj.w+.12;}if(aM>19.5&&aM<20.5){float ph=(aK-4.)*6.2832;w.z+=max(0.,sin(uT*(8.+aK)+ph))*uExc;}vW=w.xyz;vN=uNM*aN;vC=aK>3.5?aC:aK>2.5?uComp:aK>1.5?uCor2:aK>.5?uCor:aC;vM=aM;vMP=P;vMN=aN;gl_Position=uVP*w;}`;
const FS=`#version 300 es
precision highp float;in vec3 vW;in vec3 vN;in vec3 vC;in float vM;in vec3 vMP;in vec3 vMN;in float vD;
uniform vec3 uEye;uniform vec3 uSol;uniform float uLuz;uniform vec3 uCeu;uniform float uNeb;uniform float uMolh;uniform sampler2D uGT;uniform vec2 uVS;uniform float uNoite;uniform float uT;uniform float uSobre;uniform float uOculta;uniform float uProjOn;uniform vec4 uVivo;uniform sampler2D uAT;uniform float uDbg;uniform sampler2D uSM;uniform vec4 uSMR;uniform float uSMon;out vec4 o;`+DECAL.GLSL+`
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ru(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*ru(p);p*=2.03;a*=.5;}return s;}
vec3 ceu(vec3 d){float y=d.z;float nt=uNoite;vec3 crep=vec3(1.,.55,.3)*smoothstep(.0,.5,nt)*smoothstep(1.,.5,nt)*smoothstep(.35,.0,abs(y));vec3 hor=mix(mix(vec3(.80,.86,.92),vec3(.70,.73,.76),uMolh),vec3(.07,.09,.14),nt),zen=mix(mix(vec3(.26,.48,.80),vec3(.45,.5,.56),uMolh),vec3(.01,.02,.05),nt);
  vec3 c=y<0.?hor*.92:mix(hor,zen,pow(smoothstep(0.,1.,y),.55));
  if(nt<.5)c+=vec3(1.,.93,.78)*(pow(max(dot(d,uSol),0.),300.)*2.+pow(max(dot(d,uSol),0.),10.)*.18)*(1.-uMolh*.8);
  if(y>.015){vec2 uv=d.xy/(d.z+.1)*1.3+vec2(uT*.004,0.);float n=fbm(uv*1.6);float cl=smoothstep(.5-.18*uMolh,.78,n)*smoothstep(.015,.22,y);c=mix(c,mix(vec3(.97,.97,.98),vec3(.55,.58,.62),uMolh)*(nt>.5?.12:1.),cl*.8);}
  if(nt>.5&&y>0.){float s=step(.9965,h21(floor(d.xy/(d.z+.2)*260.)));c+=vec3(s*.8)*(nt-.5)*2.;}return c+crep*.6;}
vec3 amb(vec3 r){float y=r.z;return mix(uCeu*.55,uCeu*1.25,smoothstep(-.1,.6,y))+vec3(1.4)*smoothstep(.92,.99,dot(r,uSol));}
void main(){int m=int(vM+.5);if(abs(float(m)-uDbg)<.5)discard;if(uProjOn>.5||m==24){o=vec4(0.,0.,0.,.36*(1.-uNoite*.75));return;}if(uOculta>.5&&(m==6||m==7))discard;if(uSobre>.5){if(((m>=10&&m<=16)||m==25||m==21)&&abs(normalize(vN).z)>.75){o=texture(uGT,gl_FragCoord.xy/uVS);}else{o=vec4(0.);}return;}if(m==22){o=vec4(ceu(normalize(vW-uEye)),1.);return;}if(m==19){o=vec4(0.,0.,0.,.38);return;}if(m==21){o=texture(uGT,gl_FragCoord.xy/uVS);return;}
  vec3 V=normalize(uEye-vW);vec3 N=normalize(vN);if(dot(N,V)<0.)N=-N;vec3 base=vC;float rough=.6,spec=.2,fres=.2,metal=0.;
  if(m==0||m==6){rough=.14;spec=.9;fres=1.;}else if(m==1){rough=.35;spec=.4;fres=.5;}else if(m==2){rough=.8;spec=.1;fres=.12;}else if(m==3){rough=.3;spec=.6;fres=.5;metal=.6;}else if(m==4){rough=.05;spec=1.2;fres=1.;metal=1.;}
  else if(m==10){float n=ru(vW.xy*.9)*.45+ru(vW.xy*4.)*.25+h21(floor(vW.xy*12.))*.15+h21(floor(vW.xy*38.))*.15;float rem=smoothstep(.55,.75,ru(vW.xy*.035));base*=(.8+.3*n)*(1.-.08*rem);float poca=uMolh*smoothstep(.5,.72,ru(vW.xy*.06+3.));base*=1.-.35*uMolh;rough=mix(.75,.12,max(uMolh*.6,poca));spec=mix(.12,.9,uMolh);fres=mix(.1,1.,max(uMolh*.7,poca));}
  else if(m==11){base*=(.9+.16*ru(vW.xy*.03))*(.95+.08*ru(vW.xy*.6));rough=.9;spec=.03;fres=.05;}
  else if(m==12){base*=.8+.35*h21(floor(vW.xy*6.));rough=.95;spec=.02;fres=.03;}
  else if(m==13||m==25){base*=.9+.12*ru(vW.xy*.3+vW.z);rough=.8;spec=.08;}
  else if(m==14){rough=.5;spec=.25;}else if(m==15){rough=.6;spec=.15;}
  else if(m==16){rough=.05;spec=1.;fres=1.;base*=.8+.2*ru(vW.xy*.02);}
  else if(m==17){base*=.78+.4*ru(vW.xy*.4+vW.z*.3);rough=.9;spec=.03;fres=.05;}
  else if(m==23){base=texture(uAT,vC.rg).rgb;rough=.45;spec=.25;fres=.25;}
  else if(m==3&&uVivo.w>.5){vec2 q=vec2(vMP.x-(vMP.x<1700.?0.:3400.),vMP.z-352.);float r=length(q);if(r<225.){float a=atan(q.y,q.x)+uVivo.x;base*=.65+.55*step(.5,fract(a*.8));}}
  else if(m==18){float w=step(.55,fract(vW.z*.08))*step(.3,fract((vW.x+vW.y)*.05));base*=mix(1.,.55,w*step(.2,abs(N.z-1.)));rough=.4;spec=.3;fres=.3;}
  if(m<=8){vec4 dc=decal(vMP,normalize(vMN));base=mix(base,dc.rgb,dc.a);if(dc.a>.5){rough=.16;spec=.85;fres=.9;}}
  /* peça machucada: tinta arrancada em manchas, fibra de carbono à mostra e riscos */if(vD>.03&&m<=8){float n=ru(vMP.xy*.012+vMP.z*.008)*.6+h21(floor(vMP.xy*.06+vMP.z*.03))*.4;float k=clamp(min(vD,1.)*1.3,0.,1.)*smoothstep(.62-min(vD,1.)*.45,.8,n);float tr=step(.82,fract((vMP.x+vMP.z*.7)*.045+n));base=mix(base,vec3(.045,.047,.05)*(.75+.5*tr),k*.9);rough=mix(rough,.75,k);spec=mix(spec,.1,k);fres=mix(fres,.1,k);}
  float d1=max(dot(N,uSol),0.),hemi=.5+.5*N.z;
  vec3 col=m>=10?base*(.5+.55*d1+.12*hemi):base*(1.05*d1+.42*hemi+.06)*(1.-metal*.6);
  vec3 H=normalize(uSol+V);col+=vec3(pow(max(dot(N,H),0.),mix(300.,12.,rough))*spec)*d1;
  vec3 R=reflect(-V,N);float F=.04+.96*pow(1.-max(dot(N,V),0.),5.);col+=amb(R)*mix(F*fres,1.,metal)*(1.-rough*.85)*mix(vec3(1.),base*1.5,metal);
  if(uNoite>.01){bool aceso=m<=8||m==10||m==14||m==15||m==20||m==23||m==17&&vW.z>2.||m==18;float k2=aceso?.92:.38;col=mix(col,col*k2*vec3(1.,.97,.9)+((m==10||m==14||m==15)?vec3(.025,.024,.02):vec3(0.)),uNoite);}
  // sombras fixas (arquibancadas, prédios, árvores): calculadas uma vez e gravadas num mapa visto de cima
  if(uSMon>.5&&(m==10||m==11||m==12||m==14||m==15||m==16||m==25)){float sh=texture(uSM,(vW.xy-uSMR.xy)*uSMR.zw).r;col*=1.-sh*.36*(1.-uNoite*.75);}
  col*=uLuz;col=col/(1.+col*.12);float dist=length(uEye-vW);if(uNeb>0.){vec3 dv=normalize(vW-uEye);dv.z=max(dv.z,.02);float f=1.-exp(-pow(dist*uNeb,1.6));col=mix(col,ceu(normalize(dv)),f);}o=vec4(col,1.);}`;
let gl,cv,P,UN={},car=null,pista=null,sombra=null;
function prog(v,f){const p=gl.createProgram();for(const[t,s]of[[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p}
function sobe(M){const vao=gl.createVertexArray();gl.bindVertexArray(vao);const b=(a,n,l)=>{const B=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,B);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(a),gl.STATIC_DRAW);const L=gl.getAttribLocation(P,l);if(L>=0){gl.enableVertexAttribArray(L);gl.vertexAttribPointer(L,n,gl.FLOAT,false,0,0)}};
  b(M.p,3,"aP");b(M.n,3,"aN");b(M.c,3,"aC");b(M.m,1,"aM");b(M.k,1,"aK");if(M.gc)b(M.gc,1,"aG");if(M.pc)b(M.pc,1,"aPc");const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(M.i),gl.STATIC_DRAW);gl.bindVertexArray(null);return{vao,n:M.i.length}}
// dois contextos: A (pista, e também os carros nas câmeras em perspectiva) e B (só carros, transparente, para a câmera isométrica)
const CX={};
function movel(){try{return matchMedia("(pointer:coarse)").matches||(navigator.deviceMemory||8)<=4}catch(e){return false}}
function semAA(){try{const q=new URLSearchParams(location.search).get("aa");if(q)return q==="0";return (window.devicePixelRatio||1)>=2&&matchMedia("(pointer:coarse)").matches}catch(e){return false}}
function criaCtx(id,alpha){const c=document.createElement("canvas");c.id=id;c.style.cssText="position:absolute;left:0;top:0;pointer-events:none;display:none";
  const g=c.getContext("webgl2",{antialias:!semAA(),alpha,premultipliedAlpha:true,stencil:true});if(!g)throw new Error("sem WebGL2");const o={cv:c,gl:g,UN:{},tex:new Map()};
  /* celular sem memória de vídeo: o navegador derruba o contexto (tela preta). Marca e, no próximo quadro, monta tudo de novo */
  c.addEventListener("webglcontextlost",e=>{e.preventDefault();o.lost=true;P3.perdas=(P3.perdas||[]).filter(t=>performance.now()-t<60000);P3.perdas.push(performance.now());P3.erro="o navegador derrubou o 3D (memória de vídeo)"},false);
  usa(o);o.P=P=prog(VS,FS);
  for(const n of["uVP","uMod","uNM","uCor","uCor2","uComp","uEye","uSol","uLuz","uCeu","uNeb","uMolh","uDT","uDN","uDA","uDB","uDR","uT","uExc","uGT","uVS","uNoite","uSobre","uOculta","uVivo","uRol","uRoda","uSusp","uPD","uProj","uProjOn","uAT","uDbg","uSM","uSMR","uSMon"])o.UN[n]=g.getUniformLocation(P,n);
  o.car=sobe(malhaCarro(.5));o.carM=sobe(malhaCarro(.2));o.carB=sobe(malhaCarro(.05));P3.trisCarro=malhaCarro(.5).i.length/3;
  const S=new MB();S.quad([-1150,-1000,4],[4350,-1000,4],[4350,1000,4],[-1150,1000,4],[0,0,0],19);o.sombra=sobe(S);const K=new MB();for(const t of ICO)for(const q of t){const b=K.p.length/3;}const Kc=new MB();Kc.copa(0,0,0,1,1,[1,1,1],22,0);o.ceu=sobe(Kc);return o}
function usa(o){CTX=o;gl=o.gl;P=o.P;UN=o.UN;cv=o.cv;car=o.car;sombra=o.sombra;TEXA=o.tex}
let TEXA=null,CTX=null;
// malhas do carro (feitas uma vez e reaproveitadas em todas as janelas 3D): perto 0,5 · médio 0,2 · longe 0,05
const MCAR={},MCARD={};function malhaCarro(l){if(!MCAR[l]){const D=CARRO.construir({lod:l,cor:"#FF0000",cor2:"#00FF00"});MCARD[l]=D;MCAR[l]=comPecas(D)}return MCAR[l]}
// cada vértice sabe de que peça é (índice do catálogo de dano3d.js + 1; 0 = nenhuma)
function comPecas(D){const M=D.mesh;if(typeof d3Idx!=="function")return M;const pc=new Float32Array(M.p.length/3),I=M.i;for(const p of D.pecas.lista){const k=d3Idx(p.id);if(k==null)continue;for(const[a,b]of p.faixas)for(let t=a;t<b;t++)pc[I[t]]=k+1}M.pc=pc;return M}
// ---------- só desenhar o que a câmera vê: a pista é dividida em blocos com caixa envolvente
const CUR={VP:null,eye:null,far:0,hpx:1,dpr:1,iso:true,stat:{tris:0,blocos:0,total:0,carros:0}};P3._cur=CUR;
function ladrilha(M,N){const p=M.p,I=M.i,nt=I.length/3;if(!nt)return{i:new Uint32Array(0),t:[]};let x0=1e18,y0=1e18,x1=-1e18,y1=-1e18;
  for(let k=0;k<p.length;k+=3){const x=p[k],y=p[k+1];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  const sx=(x1-x0)/N||1,sy=(y1-y0)/N||1,cel=new Int32Array(nt),cnt=new Int32Array(N*N);
  for(let t=0;t<nt;t++){const a=I[3*t]*3,b=I[3*t+1]*3,c=I[3*t+2]*3;const ix=Math.min(N-1,Math.max(0,(((p[a]+p[b]+p[c])/3-x0)/sx)|0)),iy=Math.min(N-1,Math.max(0,(((p[a+1]+p[b+1]+p[c+1])/3-y0)/sy)|0));
    // ordem em serpentina: blocos vizinhos ficam juntos no buffer e viram uma chamada só
    const k=iy*N+(iy&1?N-1-ix:ix);cel[t]=k;cnt[k]++}
  const off=new Int32Array(N*N+1);for(let k=0;k<N*N;k++)off[k+1]=off[k]+cnt[k];const pos=off.slice(0,N*N),out=new Uint32Array(I.length),bb=new Float32Array(N*N*6);
  for(let k=0;k<N*N;k++)bb.set([1e18,1e18,1e18,-1e18,-1e18,-1e18],k*6);
  for(let t=0;t<nt;t++){const k=cel[t],d=pos[k]++,B=k*6;for(let j=0;j<3;j++){const v=I[3*t+j];out[3*d+j]=v;const q=v*3;for(let e=0;e<3;e++){const w=p[q+e];if(w<bb[B+e])bb[B+e]=w;if(w>bb[B+3+e])bb[B+3+e]=w}}}
  const t=[];for(let k=0;k<N*N;k++)if(cnt[k])t.push({o:off[k]*3,n:cnt[k]*3,b:bb.subarray(k*6,k*6+6)});return{i:out,t}}
// caixa [x0,y0,z0,x1,y1,z1] dentro do campo de visão? (teste exato por plano, vale para câmera isométrica e em perspectiva)
function caixaVis(VP,b){let m=63;for(let c=0;c<8;c++){const x=b[c&1?3:0],y=b[c&2?4:1],z=b[c&4?5:2];
  const X=VP[0]*x+VP[4]*y+VP[8]*z+VP[12],Y=VP[1]*x+VP[5]*y+VP[9]*z+VP[13],Z=VP[2]*x+VP[6]*y+VP[10]*z+VP[14],W=VP[3]*x+VP[7]*y+VP[11]*z+VP[15];
  let f=0;if(X<-W)f|=1;if(X>W)f|=2;if(Y<-W)f|=4;if(Y>W)f|=8;if(Z<-W)f|=16;if(Z>W)f|=32;m&=f;if(!m)return true}return false}
function longe(b,e,far){if(!far||!e)return false;const dx=Math.max(b[0]-e[0],0,e[0]-b[3]),dy=Math.max(b[1]-e[1],0,e[1]-b[4]),dz=Math.max(b[2]-e[2],0,e[2]-b[5]);return dx*dx+dy*dy+dz*dz>far*far}
function desenhaMalha(M){gl.bindVertexArray(M.vao);CUR.stat.total+=M.n/3;if(!M.t||!CUR.VP||P3.semCorte){gl.drawElements(gl.TRIANGLES,M.n,gl.UNSIGNED_INT,0);CUR.stat.tris+=M.n/3;return}
  let a=-1,n=0;const go=()=>{gl.drawElements(gl.TRIANGLES,n,gl.UNSIGNED_INT,a*4);CUR.stat.tris+=n/3};
  for(const q of M.t){if(longe(q.b,CUR.eye,CUR.far)||!caixaVis(CUR.VP,q.b))continue;CUR.stat.blocos++;if(a>=0&&a+n===q.o)n+=q.n;else{if(a>=0)go();a=q.o;n=q.n}}if(a>=0)go()}
// joga fora os contextos 3D (perdidos ou com erro); o próximo quadro cria tudo de novo
function descartaCtx(){for(const k of["A","O"]){const o=CX[k];if(o&&o.cv&&o.cv.parentNode)o.cv.parentNode.removeChild(o.cv)}if(CX.G&&CX.G.parentNode)CX.G.parentNode.removeChild(CX.G);if(CX.B&&CX.B.cv&&CX.B.cv.parentNode)CX.B.cv.parentNode.removeChild(CX.B.cv);for(const k of Object.keys(CX))delete CX[k];CTX=null;pista=null;car=null;sombra=null;P3.geo=null;for(const k in CAMST)delete CAMST[k]}
P3.reinicia=descartaCtx;
// muitos contextos derrubados em pouco tempo: aparelho no limite. Primeiro alivia (resolução e sombra), só depois desiste
function aliviaGPU(){const n=(P3.perdas||[]).length;if(n>=2){P3.semMapa=true;P3.esc=Math.min(P3.esc||1,.75)}if(n>=3)P3.esc=Math.min(P3.esc,.6);return n<5}
P3.falhou=function(e){const t=performance.now();P3.falhas=(P3.falhas||[]).filter(x=>t-x<30000);P3.falhas.push(t);P3.erro=String(e&&e.message||e);try{console.error("3D:",e);localStorage.setItem("paddock-3d-erro",P3.erro.slice(0,200)+" · "+new Date().toISOString())}catch(_){}
  descartaCtx();if(P3.falhas.length<=3&&aliviaGPU())return true;P3.on=false;P3.desligado=P3.erro;return false};
// aviso visível quando o 3D desiste de vez (para o jogador saber o motivo e poder contar)
P3.avisa=function(){try{const st=document.getElementById("stage");if(!st||st.querySelector(".p3dAviso"))return;const d=document.createElement("div");d.className="p3dAviso";d.setAttribute("role","alert");
  d.style.cssText="position:absolute;left:50%;top:44px;transform:translateX(-50%);z-index:30;width:min(92%,440px);background:rgba(12,14,18,.94);color:#ECEEF1;border:1px solid #F5A52488;border-radius:10px;padding:10px 12px;font:600 12.5px/1.4 'Titillium Web',system-ui,sans-serif;text-align:center;display:grid;gap:8px;justify-items:center";
  const t=document.createElement("div");t.textContent="Os carros são desenhados só em 3D, e o 3D parou neste aparelho ("+(P3.erro||"erro")+"). A corrida continua, mas sem os carros na tela. Fechar outras abas ou apps ajuda.";
  const b=document.createElement("button");b.type="button";b.textContent="Tentar o 3D de novo";b.style.cssText="min-height:36px;padding:6px 14px;border-radius:8px;border:1px solid #F5A524;background:#3A2A0A;color:#FFD27A;font:700 13px 'Titillium Web',sans-serif;cursor:pointer";
  b.addEventListener("click",()=>{P3.falhas=[];P3.perdas=[];P3.erro=null;P3.desligado=null;P3.on=true;d.remove()});d.append(t,b);st.appendChild(d)}catch(e){}};
function init(){if((CX.A&&(CX.A.lost||CX.A.gl.isContextLost()))||(CX.O&&(CX.O.lost||CX.O.gl.isContextLost()))){if(!aliviaGPU()){descartaCtx();P3.on=false;P3.desligado=P3.erro;if(P3.avisa)P3.avisa();throw new Error("3D desligado: "+P3.erro)}descartaCtx()}if(CX.A)return true;CX.A=criaCtx("p3dA",false);CX.B={cv:document.createElement("canvas")};
  const G2=document.createElement("canvas");G2.id="p3dG";G2.style.cssText="position:absolute;left:0;top:0;pointer-events:none;display:none";CX.G=G2;return true}
const SOL=(()=>{const v=[-.35,-.5,.75],l=Math.hypot(...v);return v.map(x=>x/l)})();
const TWI={abudhabi:1};
// ---------- construção da malha
function MB(){this.p=[];this.n=[];this.c=[];this.m=[];this.k=[];this.i=[]}
MB.prototype.hz=function(x,y){return this.hf?this.hf(x,y):0};
MB.prototype.v=function(x,y,z,n,c,m){this.p.push(x,y,z);this.n.push(n[0],n[1],n[2]);this.c.push(c[0],c[1],c[2]);this.m.push(m);this.k.push(0);return this.p.length/3-1};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nz=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]};
MB.prototype.quad=function(a,b,c,d,col,m){const n=nz(cr(sub(b,a),sub(d,a)));const i=[a,b,c,d].map(q=>this.v(q[0],q[1],q[2],n,col,m));this.i.push(i[0],i[1],i[2],i[0],i[2],i[3])};
MB.prototype.tri=function(a,b,c,col,m){const n=nz(cr(sub(b,a),sub(c,a)));const i=[a,b,c].map(q=>this.v(q[0],q[1],q[2],n,col,m));this.i.push(...i)};
// faixa contínua no chão: A,B listas de [x,y]; fechada
MB.prototype.faixa=function(A,B,z,col,m,fechada){if(m===13)m=25;const up=[0,0,1],b=this.p.length/3;for(let k=0;k<A.length;k++){this.v(A[k][0],A[k][1],z+(A[k][2]!==undefined?A[k][2]:this.hz(A[k][0],A[k][1])),up,col,m);this.v(B[k][0],B[k][1],z+(B[k][2]!==undefined?B[k][2]:this.hz(B[k][0],B[k][1])),up,col,m)}
  const n=A.length,L=fechada?n:n-1;for(let k=0;k<L;k++){const a=b+k*2,c=b+((k+1)%n)*2;this.i.push(a,c,a+1,a+1,c,c+1)}};
// caixa orientada: centro x,y, ângulo, w (ao longo do ângulo), d, altura h a partir de z0
MB.prototype.caixa=function(x,y,ang,w,d,h,z0,col,colT,m){z0+=this.hz(x,y);if(this.somb&&h>2.2*WS&&m!==20)this.somb.projeta(x,y,ang,w,d,h,z0);const c=Math.cos(ang),s=Math.sin(ang);const P=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>[x+u*c-v*s,y+u*s+v*c]);
  for(let k=0;k<4;k++){const a=P[k],b=P[(k+1)%4];this.quad([a[0],a[1],z0],[b[0],b[1],z0],[b[0],b[1],z0+h],[a[0],a[1],z0+h],col,m)}this.quad([P[0][0],P[0][1],z0+h],[P[1][0],P[1][1],z0+h],[P[2][0],P[2][1],z0+h],[P[3][0],P[3][1],z0+h],colT||col,m)};
// sombra projetada de uma caixa (no chão, na direção oposta ao sol)
MB.prototype.projeta=function(x,y,ang,w,d,h,z0){const c=Math.cos(ang),s=Math.sin(ang);const P=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>[x+u*c-v*s,y+u*s+v*c]);const ox=-SOL[0]/SOL[2]*h,oy=-SOL[1]/SOL[2]*h,z=z0+.18,col=[0,0,0];
  this.quad([P[0][0]+ox,P[0][1]+oy,z],[P[1][0]+ox,P[1][1]+oy,z],[P[2][0]+ox,P[2][1]+oy,z],[P[3][0]+ox,P[3][1]+oy,z],col,24);
  for(let k=0;k<4;k++){const a=P[k],b=P[(k+1)%4];this.quad([a[0],a[1],z],[b[0],b[1],z],[b[0]+ox,b[1]+oy,z],[a[0]+ox,a[1]+oy,z],col,24)}};
MB.prototype.quadUV=function(a,b,c,d,r){const n=nz(cr(sub(b,a),sub(d,a)));const uv=[[r[0],r[3]],[r[2],r[3]],[r[2],r[1]],[r[0],r[1]]];const i=[a,b,c,d].map((q,k)=>this.v(q[0],q[1],q[2],n,[uv[k][0],uv[k][1],0],23));this.i.push(i[0],i[1],i[2],i[0],i[2],i[3])};
// atlas da pista: placas de frenagem e faixas de patrocinador
function atlasPista(){const cv=document.createElement("canvas");cv.width=1024;cv.height=1024;const x=cv.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,1024,1024);
  const nums=["150","100","50"];nums.forEach((t,i)=>{const X=i*170,Y=0;x.fillStyle="#FFFFFF";x.fillRect(X,Y,160,120);x.fillStyle="#111";x.font="900 86px 'Titillium Web',Arial,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(t,X+80,Y+64);x.strokeStyle="#111";x.lineWidth=6;x.strokeRect(X+3,Y+3,154,114)});
  let lista=[];try{if(typeof carSponsors==="function"&&typeof G!=="undefined"&&G.teams)for(const t of G.teams){const s=carSponsors(t);if(s&&s.m)lista.push(s.m);if(s&&s.s)lista.push(s.s)}}catch(e){}
  const vist=new Set();lista=lista.filter(s=>s&&!vist.has(s.n)&&vist.add(s.n)).slice(0,8);if(!lista.length)lista=[{n:"Paddock GP",c:"#FF4D2E",c2:"#111216",mk:"diamond"}];
  lista.forEach((sp,i)=>{const Y=140+i*110;x.fillStyle="#F3F4F6";x.fillRect(0,Y,1024,100);for(let k=0;k<3;k++)DECAL.logo(x,sp,8+k*340,Y+8,330,84)});
  return{cv,n:lista.length,num:i=>[i*170/1024,0,(i*170+160)/1024,120/1024],faixa:i=>[0,(140+(i%lista.length)*110)/1024,1,(140+(i%lista.length)*110+100)/1024]}}
// copa de árvore: octaedro subdividido
const ICO=(()=>{let f=[[[0,0,1],[1,0,0],[0,1,0]],[[0,0,1],[0,1,0],[-1,0,0]],[[0,0,1],[-1,0,0],[0,-1,0]],[[0,0,1],[0,-1,0],[1,0,0]],[[0,0,-1],[0,1,0],[1,0,0]],[[0,0,-1],[-1,0,0],[0,1,0]],[[0,0,-1],[0,-1,0],[-1,0,0]],[[0,0,-1],[1,0,0],[0,-1,0]]];
  const mid=(a,b)=>nz([(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]);const g=[];for(const[a,b,c]of f){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);g.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca])}return g})();
MB.prototype.copa=function(x,y,z,rx,rz,col,m,seed){const b=this.p.length/3;for(const t of ICO)for(const q of t){const j=1+.12*Math.sin(seed+q[0]*7+q[1]*5+q[2]*3);this.v(x+q[0]*rx*j,y+q[1]*rx*j,z+q[2]*rz*j,q,col,m)}for(let k=0;k<ICO.length*3;k++)this.i.push(b+k)};
const GEOC={g:null,d:null};P3._geoc=GEOC;
function retSombra(SB){const p=SB.p;if(!SB.i.length)return null;let x0=1e18,y0=1e18,x1=-1e18,y1=-1e18;for(let k=0;k<p.length;k+=3){const x=p[k],y=p[k+1];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  const px=(x1-x0)*.002+1,py=(y1-y0)*.002+1;x0-=px;y0-=py;x1+=px;y1+=py;return new Float32Array([x0,y0,1/(x1-x0),1/(y1-y0)])}
// desenha as sombras fixas vistas de cima numa textura 2048x2048 (uma vez por circuito e por janela 3D; leva poucos milissegundos)
function mapaSombraGPU(o,pv){const g=gl,N=movel()?1024:2048;try{if(!o.smP){const vs="#version 300 es\nin vec3 aP;uniform vec4 uR;void main(){gl_Position=vec4((aP.xy-uR.xy)*uR.zw*2.-1.,0.,1.);}",fs="#version 300 es\nprecision mediump float;out vec4 o;void main(){o=vec4(1.);}";
    const p=g.createProgram();for(const[t,c]of[[g.VERTEX_SHADER,vs],[g.FRAGMENT_SHADER,fs]]){const sh=g.createShader(t);g.shaderSource(sh,c);g.compileShader(sh);g.attachShader(p,sh)}const L=g.getAttribLocation(P,"aP");if(L>=0)g.bindAttribLocation(p,L,"aP");g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))return false;o.smP=p}
  if(!o.smT)o.smT=g.createTexture();g.activeTexture(g.TEXTURE3);g.bindTexture(g.TEXTURE_2D,o.smT);g.texImage2D(g.TEXTURE_2D,0,g.R8,N,N,0,g.RED,g.UNSIGNED_BYTE,null);
  g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.activeTexture(g.TEXTURE0);
  const fb=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,fb);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,o.smT,0);
  const ok=g.checkFramebufferStatus(g.FRAMEBUFFER)===g.FRAMEBUFFER_COMPLETE;if(ok){g.viewport(0,0,N,N);g.disable(g.DEPTH_TEST);g.disable(g.BLEND);g.disable(g.STENCIL_TEST);g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT);
    g.useProgram(o.smP);g.uniform4fv(g.getUniformLocation(o.smP,"uR"),pv.smR);g.bindVertexArray(pv.somb.vao);g.drawElements(g.TRIANGLES,pv.somb.n,g.UNSIGNED_INT,0);g.bindVertexArray(null)}
  g.bindFramebuffer(g.FRAMEBUFFER,null);g.deleteFramebuffer(fb);g.useProgram(P);return ok}catch(e){try{g.bindFramebuffer(g.FRAMEBUFFER,null);g.useProgram(P)}catch(e2){}return false}}
const f32=a=>a instanceof Float32Array?a:new Float32Array(a);
function geoPista(){if(GEOC.g!==TRACKGEO||!GEOC.d){const t0=performance.now();const r=montaPista();const L=ladrilha({p:r.B.p,i:r.B.i},16),LS=ladrilha({p:r.SB.p,i:r.SB.i},12);
    const pk=(M,Li)=>({p:f32(M.p),n:f32(M.n),c:f32(M.c),m:f32(M.m),k:f32(M.k),i:Li.i,t:Li.t});GEOC.d={B:pk(r.B,L),SB:pk(r.SB,LS),atlas:r.AT.cv,smR:retSombra(r.SB)};GEOC.g=TRACKGEO;P3.msMonta=Math.round(performance.now()-t0)}return GEOC.d}
function constroiPista(){const d=geoPista();const pv=sobe(d.B);pv.t=d.B.t;pv.somb=sobe(d.SB);pv.somb.t=d.SB.t;pv.atlas=d.atlas;pv.smR=d.smR;return pv}
P3.prepara=function(){try{if(typeof TRACKGEO!=="undefined"&&TRACKGEO&&TRACKGEO.path)geoPista();malhaCarro(.5);malhaCarro(.2);malhaCarro(.05)}catch(e){}};
function montaPista(){const g=TRACKGEO,S=g.scn||{},M=g.M,m=WS,th=S.th||{g:"park"};const B=new MB();const SB=new MB();B.somb=SB;const AT=atlasPista();const GC=(typeof GROUND!=="undefined"&&GROUND[th.g])||["#3D7A3B","#478A43","#4E9449"];
  const urb=/urban/i.test(th.g||"");const CI=typeof CIRCUITS!=="undefined"?CIRCUITS.find(c=>c.id===g.id):null;const street=!!(CI?CI.street:(typeof R!=="undefined"&&R&&R.C&&R.C.street));
  // relevo: altura da pista ao longo da volta (perfis aproximados dos circuitos reais; nos outros, ondulação suave)
  // relevo: a mesma altura que a física usa (relevo.js); sem a tabela, ondulação suave
  const RLg=typeof relevoGeo==="function"?relevoGeo(typeof R!=="undefined"&&R&&R.geo&&R.geo.id===g.id?R.geo:{...g,N:M,len:g.len,C:CI||{street}}):null;
  const elev=f=>{f=fr(f);if(RLg){const x=f*M,i=Math.floor(x)%M,k=x-Math.floor(x);return RLg.zs[i]*(1-k)+RLg.zs[(i+1)%M]*k}return(1.6*Math.sin(f*6.283*2+.7)+1.1*Math.sin(f*6.283*5+1.9))*(street?0:1)};
  // inclinação lateral (curvas inclinadas): o lado de dentro fica mais baixo; tb[i] = tangente, + quando a esquerda (+lado) é mais baixa
  const tb=new Float32Array(M);if(RLg)for(let i=0;i<M;i++)tb[i]=Math.tan(RLg.ph[i]);P3.tb=tb;
  const bnk=(i,L)=>{const Lc=Math.max(-(TW+5*U),Math.min(TW+5*U,L));return-Lc*tb[i]};P3.bnk=bnk;
  const ze=new Float32Array(M);for(let i=0;i<M;i++)ze[i]=elev(i/M)*m;P3.ze=ze;
  // terreno: grade de alturas; perto da pista acompanha a pista, longe sobe em morros e montanhas conforme o lugar
  const bb0=g.bb,E0=Math.max(bb0.x1-bb0.x0,bb0.y1-bb0.y0)*1.6+3000,gcx=(bb0.x0+bb0.x1)/2,gcy=(bb0.y0+bb0.y1)/2;const CEL=40,NX=Math.ceil(2*E0/CEL)+1,X0=gcx-E0,Y0=gcy-E0;
  const Dg=new Float32Array(NX*NX).fill(1e9),Eg=new Float32Array(NX*NX);const sem=(x,y,e)=>{const i=Math.round((x-X0)/CEL),j=Math.round((y-Y0)/CEL);if(i<0||j<0||i>=NX||j>=NX)return;const k=j*NX+i;const d=Math.hypot(x-(X0+i*CEL),y-(Y0+j*CEL));if(d<Dg[k]){Dg[k]=d;Eg[k]=e}};
  for(let i=0;i<M;i++){const q=g.path[i];sem(q.x,q.y,ze[i])}// a pit lane segue o terreno da reta mais próxima (antes ela semeava alturas de outro trecho e levantava o chão sobre a pista)
  {const s2=Math.SQRT2*CEL;for(let pass=0;pass<2;pass++){const fw=pass===0;for(let jj=0;jj<NX;jj++)for(let ii=0;ii<NX;ii++){const j=fw?jj:NX-1-jj,i=fw?ii:NX-1-ii,k=j*NX+i;
      for(const[di,dj,c]of fw?[[-1,0,CEL],[0,-1,CEL],[-1,-1,s2],[1,-1,s2]]:[[1,0,CEL],[0,1,CEL],[1,1,s2],[-1,1,s2]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=NX||b>=NX)continue;const kk=b*NX+a;if(Dg[kk]+c<Dg[k]){Dg[k]=Dg[kk]+c;Eg[k]=Eg[kk]}}}}}
  const amp=street||urb?0:th.mountains?1:th.hills?.45:/desert|dunes/.test(th.g||"")?.18:.22;
  const hsh=(i,j)=>{let h=i*374761393+j*668265263;h=(h^(h>>>13))*1274126177;return((h^(h>>>16))>>>0)/4294967296};
  const ruido=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return(hsh(i,j)*(1-u)+hsh(i+1,j)*u)*(1-v)+(hsh(i,j+1)*(1-u)+hsh(i+1,j+1)*u)*v};
  const fbm2=(x,y)=>{let s=0,a=.5;for(let o=0;o<5;o++){s+=a*ruido(x,y);x*=2.03;y*=2.03;a*=.5}return s};
  const Hn=new Float32Array(NX*NX);for(let j=0;j<NX;j++)for(let i=0;i<NX;i++){const k=j*NX+i,x=X0+i*CEL,y=Y0+j*CEL,D=Dg[k];
    const perto=Math.min(1,Math.max(0,(D-90*m)/(260*m)));const longe=Math.min(1,Math.max(0,(D-320*m)/(900*m)));
    const morro=(fbm2(x/(900*m),y/(900*m))-.35)*60*m*amp*perto,serra=Math.pow(fbm2(x/(2200*m)+7,y/(2200*m)+3),1.4)*560*m*amp*longe;
    Hn[k]=Eg[k]+Math.max(-4*m,morro)+serra-(D<TW+6*m?.6*m:0)}
  // o terreno nunca fica acima do asfalto: perto de qualquer trecho da pista, o chão fica abaixo da altura daquele trecho
  // (a malha do chão usa triângulos grandes; sem isso, um morro ou um trecho mais alto ao lado "invadia" a pista de baixo)
  {const Rc=TW+5*U+3*CEL*1.6,rr=Math.ceil(Rc/CEL);for(let i=0;i<M;i++){const q=g.path[i],lim=ze[i]-.45*m;const ci=Math.round((q.x-X0)/CEL),cj=Math.round((q.y-Y0)/CEL);
    for(let dj=-rr;dj<=rr;dj++){const j=cj+dj;if(j<0||j>=NX)continue;for(let di=-rr;di<=rr;di++){const ii=ci+di;if(ii<0||ii>=NX)continue;const x=X0+ii*CEL,y=Y0+j*CEL;if((x-q.x)*(x-q.x)+(y-q.y)*(y-q.y)>Rc*Rc)continue;const k=j*NX+ii;if(Hn[k]>lim)Hn[k]=lim}}}}
  const H=(x,y)=>{let fx=(x-X0)/CEL,fy=(y-Y0)/CEL;fx=Math.max(0,Math.min(NX-1.001,fx));fy=Math.max(0,Math.min(NX-1.001,fy));const i=Math.floor(fx),j=Math.floor(fy),u=fx-i,v=fy-j,k=j*NX+i;return(Hn[k]*(1-u)+Hn[k+1]*u)*(1-v)+(Hn[k+NX]*(1-u)+Hn[k+NX+1]*u)*v};
  const Dd=(x,y)=>{const i=Math.max(0,Math.min(NX-1,Math.round((x-X0)/CEL))),j=Math.max(0,Math.min(NX-1,Math.round((y-Y0)/CEL)));return Dg[j*NX+i]};
  P3.H=H;P3.Dd=Dd;P3.Hc=(x,y)=>H(x,y)+(Dd(x,y)<TW+6*m?.6*m:0);B.hf=H;SB.hf=null;
  // ponte (Suzuka): o trecho de cima sobe numa rampa suave até passar por cima da pista de baixo
  const zp=new Float32Array(M);P3.zp=zp;P3.ponte=null;
  if(typeof fichaOf==="function"&&fichaOf(g.id).ponte&&typeof bridgeCross==="function"){const Bc=bridgeCross(g);if(Bc){const seg=Math.hypot(g.path[1].x-g.path[0].x,g.path[1].y-g.path[0].y)||1;const sn=Math.max(.35,Math.abs(Math.sin(g.heading[Bc.hi]-g.heading[Bc.lo])));
    const C=(TW+3*m)/sn+3*m,F=120*m,Hb=Math.max(0,6.4*m+ze[Bc.lo]-ze[Bc.hi]),K=Math.ceil((C+F)/seg);for(let k=-K;k<=K;k++){const i=((Bc.hi+k)%M+M)%M,d=Math.abs(k)*seg;const t=Math.min(1,Math.max(0,(C+F-d)/F));zp[i]=Math.max(zp[i],Hb*t*t*(3-2*t))}P3.ponte={B:Bc,C,F,Hb,seg,K}}}
  for(let i=0;i<M;i++)zp[i]+=ze[i];
  const zAt=f=>{const x=fr(f)*M,i=Math.floor(x)%M,k=x-Math.floor(x);return zp[i]*(1-k)+zp[(i+1)%M]*k};P3.zAt=zAt;
  // água: espelho plano, abaixo da pista, com o fundo do lago escavado no terreno; triangulação de verdade (o leque a partir do centro
  // cobria a pista quando o lago tem forma côncava, como em Albert Park e no porto de Mônaco)
  for(const w of(S.water||[])){const poly=(Array.isArray(w)?w:w.pts||[]).map(q=>({x:q.x,y:q.y}));if(poly.length<3)continue;const col=hex(typeof WATER_C!=="undefined"?WATER_C:"#2F6D96");
    let lvl=1e9;for(const q of poly)lvl=Math.min(lvl,H(q.x,q.y));lvl-=.15*m;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const q of poly){x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y)}
    for(let i=0;i<M;i++){const q=g.path[i];if(q.x>x0-60*m&&q.x<x1+60*m&&q.y>y0-60*m&&q.y<y1+60*m)lvl=Math.min(lvl,zp[i]-.6*m)}
    const dentro=(x,y)=>{let c=false;for(let k=0,j=poly.length-1;k<poly.length;j=k++){const a=poly[k],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c}return c};
    {const i0=Math.max(0,Math.floor((x0-X0)/CEL)-1),i1=Math.min(NX-1,Math.ceil((x1-X0)/CEL)+1),j0=Math.max(0,Math.floor((y0-Y0)/CEL)-1),j1=Math.min(NX-1,Math.ceil((y1-Y0)/CEL)+1);
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){if(dentro(X0+i*CEL,Y0+j*CEL)){const k=j*NX+i;Hn[k]=Math.min(Hn[k],lvl-1.2*m)}}}
    // corte de orelhas
    const V=poly.slice();let area=0;for(let k=0;k<V.length;k++){const a=V[k],b=V[(k+1)%V.length];area+=a.x*b.y-b.x*a.y}if(area<0)V.reverse();
    const cruz=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);const noTri=(p,a,b,c)=>cruz(a,b,p)>=0&&cruz(b,c,p)>=0&&cruz(c,a,p)>=0;
    let guard=0;while(V.length>3&&guard++<5000){let cortou=false;for(let k=0;k<V.length;k++){const a=V[(k+V.length-1)%V.length],b=V[k],c=V[(k+1)%V.length];if(cruz(a,b,c)<=0)continue;
        let ok=true;for(const p of V){if(p===a||p===b||p===c)continue;if(noTri(p,a,b,c)){ok=false;break}}if(!ok)continue;B.tri([a.x,a.y,lvl],[b.x,b.y,lvl],[c.x,c.y,lvl],col,16);V.splice(k,1);cortou=true;break}if(!cortou)break}
    for(let k=1;k+1<V.length;k++)B.tri([V[0].x,V[0].y,lvl],[V[k].x,V[k].y,lvl],[V[k+1].x,V[k+1].y,lvl],col,16)/* o que sobrar (contorno com voltas estranhas) fecha em leque */}
  // chão
  const E=E0,cx=gcx,cy=gcy;{const ST=3,nn=Math.floor((NX-1)/ST)+1,b0=B.p.length/3;P3.terr={X0,Y0,CEL,ST,nn,NX};const cg=hex(GC[0]),cm=hex(th.mountains?"#2F5530":"#3C6A36"),cr=hex(th.mountains?"#7E7A72":"#6E7A5E");
    for(let j=0;j<nn;j++)for(let i=0;i<nn;i++){const x=X0+i*ST*CEL,y=Y0+j*ST*CEL;const z=H(x,y)-.3;const dx=H(x+CEL,y)-H(x-CEL,y),dy=H(x,y+CEL)-H(x,y-CEL);const n=nz([-dx,-dy,2*CEL]);const D=Dd(x,y);
      const t=Math.min(1,Math.max(0,(D-140*m)/(220*m))),rk=Math.min(1,Math.max(0,(z-Eg[0]-260*m)/(160*m)))*(1-n[2])*2;const c=[0,1,2].map(q=>cg[q]*(1-t)+cm[q]*t);const c2=c.map((v,q)=>v*(1-Math.min(1,rk))+cr[q]*Math.min(1,rk));B.v(x,y,z,n,c2,urb?13:11)}
    for(let j=0;j<nn-1;j++)for(let i=0;i<nn-1;i++){const a=b0+j*nn+i;B.i.push(a,a+1,a+nn,a+1,a+nn+1,a+nn)}}
  // água
  // áreas de escape (brita ou asfalto)
  for(const gr of(g.gravel||[])){const n=gr.pts.length/2|0;const A=[],Bq=[];for(let k=0;k<n;k++){A.push([gr.pts[k].x,gr.pts[k].y]);Bq.push([gr.pts[gr.pts.length-1-k].x,gr.pts[gr.pts.length-1-k].y])}
    if(gr.asphalt){for(let k=0;k<n-1;k++){const c=hex(k%4<2?"#2F8F5B":"#5E6268");const z=q=>B.hz(q[0],q[1])+.03;B.quad([A[k][0],A[k][1],z(A[k])],[A[k+1][0],A[k+1][1],z(A[k+1])],[Bq[k+1][0],Bq[k+1][1],z(Bq[k+1])],[Bq[k][0],Bq[k][1],z(Bq[k])],c,10)}}
    else B.faixa(A,Bq,.02,hex("#C9B38A"),12,false)}
  // muros de pneus no fim das áreas de escape (vermelho e branco)
  for(const gr of(g.gravel||[])){const wv=gr.wall||[];const hT=1*m;for(let k=0;k<wv.length-1;k++){const a=wv[k],b=wv[k+1];if(Math.hypot(b.x-a.x,b.y-a.y)>60*m)continue;const c=hex(k%2?"#F2F2F2":"#D32F2F");
    const ha=H(a.x,a.y),hb=H(b.x,b.y);B.quad([a.x,a.y,ha],[b.x,b.y,hb],[b.x,b.y,hT+hb],[a.x,a.y,hT+ha],c,14);const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,ox=-dy/L*1.1*m*gr.o,oy=dx/L*1.1*m*gr.o;const px=-oy/1.1*0,py=0;B.quad([a.x-ox*.95,a.y-oy*.95,hT+ha],[b.x-ox*.95,b.y-oy*.95,hT+hb],[b.x+ox*.95,b.y+oy*.95,hT+hb],[a.x+ox*.95,a.y+oy*.95,hT+ha],hex("#1D1D1D"),2);B.quad([a.x-ox*.45,a.y-oy*.45,hT+.05+ha],[b.x-ox*.45,b.y-oy*.45,hT+.05+hb],[b.x+ox*.45,b.y+oy*.45,hT+.05+hb],[a.x+ox*.45,a.y+oy*.45,hT+.05+ha],c,14)}}
  // asfalto e linhas brancas
  const N=M*2,pos=(f,L)=>{const p=trackPos(f,L),x=fr(f)*M,i=Math.floor(x)%M,k=x-Math.floor(x);return[p.x,p.y,zAt(f)+bnk(i,L)*(1-k)+bnk((i+1)%M,L)*k]};const lado=L=>Array.from({length:N},(_,k)=>pos(k/N,L));const plano=a=>a.map(q=>[q[0],q[1]]);
  B.faixa(lado(TW+5*U),lado(TW-.5*U),.0,hex(street?"#9AA1A9":"#2E7D32"),street?13:11,true);B.faixa(lado(-TW+.5*U),lado(-TW-5*U),.0,hex(street?"#9AA1A9":"#2E7D32"),street?13:11,true);
  {const cS=hex(street?"#8A9098":"#2A6B2E");for(const sg of[1,-1]){const Lb=sg*(TW+5*U),Pa=lado(Lb);for(let k=0;k<N;k++){const a=Pa[k],b=Pa[(k+1)%N];const d=4*m;
      if(sg>0)B.quad([a[0],a[1],a[2]-d],[b[0],b[1],b[2]-d],[b[0],b[1],b[2]],[a[0],a[1],a[2]],cS,street?13:11);else B.quad([b[0],b[1],b[2]-d],[a[0],a[1],a[2]-d],[a[0],a[1],a[2]],[b[0],b[1],b[2]],cS,street?13:11)}}}
  B.faixa(lado(TW),lado(-TW),.05,hex("#3B3E44"),10,true);
  B.faixa(lado(TW+.05*m),lado(TW-.32*m),.08,hex("#EDEDED"),15,true);B.faixa(lado(-TW+.32*m),lado(-TW-.05*m),.08,hex("#EDEDED"),15,true);
  // linha de largada (xadrez)
  {for(let a=0;a<12;a++)for(let b=0;b<2;b++){const f0=b*.6*m/g.len,f1=(b+1)*.6*m/g.len,L0=-TW+a*TW/6,L1=L0+TW/6;const c=(a+b)%2?hex("#111111"):hex("#F2F2F2");const p1=trackPos(f0,L0),p2=trackPos(f1,L0),p3=trackPos(f1,L1),p4=trackPos(f0,L1);
    {const z0=zAt(0)+.1;B.quad([p1.x,p1.y,z0],[p2.x,p2.y,z0],[p3.x,p3.y,z0],[p4.x,p4.y,z0],c,15)}}}
  // zebras
  for(const k of(S.kerbs||[])){const off=TW-.55*m;for(let q=k.a;q<k.b;q++){const i=(q%M+M)%M,j=(i+1)%M;const p=g.path[i],pp=g.path[j],h=g.heading[i],h2=g.heading[j];
    const at=(P,H,L)=>[P.x-Math.sin(H)*L*k.s,P.y+Math.cos(H)*L*k.s];const a0=at(p,h,off-.8*m),a1=at(p,h,off+.8*m),b0=at(pp,h2,off-.8*m),b1=at(pp,h2,off+.8*m);
    const c=q%2?hex("#F2F2F2"):hex(street?"#D84040":"#E53935");const za=zp[i]+bnk(i,k.s*off),zb2=zp[j]+bnk(j,k.s*off);B.quad([a0[0],a0[1],.12+za],[b0[0],b0[1],.12+zb2],[b1[0],b1[1],.12+.25*m+zb2],[a1[0],a1[1],.12+.25*m+za],c,14)}}
  // muros / barreiras
  const suav=a=>{const o=new Array(M),RW=20;for(let i=0;i<M;i++){const w=[];for(let k=-RW;k<=RW;k++){const v=a[((i+k)%M+M)%M];if(v!=null&&isFinite(v))w.push(v)}if(w.length<RW){o[i]=null;continue}w.sort((x,y)=>x-y);const md=w[w.length>>1];const v=a[i];o[i]=v==null||!isFinite(v)?null:Math.abs(v-md)>3*m?null:v}return o};
  // muro paralelo à pista por dentro de curva fechada: a linha "dobra" e forma um laço; tiramos os pontos que ficam mais perto da pista do que deveriam
  const laco=(a,sg)=>{const o=a.slice();for(let i=0;i<M;i++){const L=a[i];if(L==null)continue;const p0=g.path[i],h=g.heading[i];const x=p0.x-Math.sin(h)*sg*L,y=p0.y+Math.cos(h)*sg*L;
      for(let k=-120;k<=120;k+=2){const q=g.path[((i+k)%M+M)%M];if(Math.hypot(q.x-x,q.y-y)<L*.9){o[i]=null;break}}}return o};
  P3.wlVis={};for(const sg of[1,-1]){const a0=S.wl&&S.wl[sg];if(!a0)continue;const a=laco(Array.from(a0),sg);P3.wlVis[sg]=a;/* o muro desenhado é o mesmo da física (scene.js já tira as dobras) */const hW=(street?2.2:1)*m;let prev=null;
    for(let i=0;i<=M;i++){const ii=i%M,L=a[ii];if(L==null||!isFinite(L)){prev=null;continue}const p=g.path[ii],h=g.heading[ii];const x=p.x-Math.sin(h)*sg*L,y=p.y+Math.cos(h)*sg*L,zz=zp[ii]+bnk(ii,sg*L);
      if(prev&&Math.hypot(x-prev[0],y-prev[1])<12*m){const z0=prev[2];const c=(i>>1)%2?hex(street?"#C9CFD6":"#9AA3AD"):hex(street?"#B9C0C8":"#8E97A2");B.quad([prev[0],prev[1],z0],[x,y,zz],[x,y,hW+zz],[prev[0],prev[1],hW+z0],c,13);{const h2=g.heading[ii],ox=-Math.sin(h2)*sg*.7*m,oy=Math.cos(h2)*sg*.7*m;B.quad([prev[0],prev[1],hW+z0],[x,y,hW+zz],[x+ox,y+oy,hW+zz],[prev[0]+ox,prev[1]+oy,hW+z0],hex(street?"#E1E5EA":"#B7BEC6"),13)}
        if(!street&&i%2)B.quad([prev[0],prev[1],hW*.62+z0],[x,y,hW*.62+zz],[x,y,hW*.8+zz],[prev[0],prev[1],hW*.8+z0],hex(i%4<2?"#D92B2B":"#F1F1F1"),14)}prev=[x,y,zz]}}
  // estrutura da ponte: muretas, laterais do tabuleiro e pilares fora da pista de baixo
  if(P3.ponte){const Bc=P3.ponte.B,K=P3.ponte.K;const lowD=(x,y)=>{let b=1e9;for(let k=-90;k<=90;k++){const q=g.path[((Bc.lo+k)%M+M)%M];const d=Math.hypot(q.x-x,q.y-y);if(d<b)b=d}return b};
    for(const sg of[1,-1]){let prev=null;for(let k=-K;k<=K;k++){const i=((Bc.hi+k)%M+M)%M,z=zp[i];if(z<.25){prev=null;continue}const p=g.path[i],h=g.heading[i],nx=-Math.sin(h)*sg,ny=Math.cos(h)*sg;
      const q={x:p.x+nx*(TW+1.25*m),y:p.y+ny*(TW+1.25*m),ex:p.x+nx*(TW+1.7*m),ey:p.y+ny*(TW+1.7*m),z};
      if(prev){const hm=1.1*m;B.quad([prev.x,prev.y,prev.z],[q.x,q.y,q.z],[q.x,q.y,q.z+hm],[prev.x,prev.y,prev.z+hm],hex("#C9CDD2"),13);B.quad([prev.x,prev.y,prev.z+hm],[q.x,q.y,q.z+hm],[q.ex,q.ey,q.z+hm],[prev.ex,prev.ey,prev.z+hm],hex("#E6E8EB"),13);
        B.quad([prev.ex,prev.ey,Math.max(0,prev.z-1.5*m)],[q.ex,q.ey,Math.max(0,q.z-1.5*m)],[q.ex,q.ey,q.z+hm],[prev.ex,prev.ey,prev.z+hm],hex("#9EA3A9"),13);
        // asfalto do lado de fora do tabuleiro (entre a pista e a mureta)
        const ia=[p.x+nx*TW,p.y+ny*TW];const pp=g.path[((Bc.hi+k-1)%M+M)%M],hp=g.heading[((Bc.hi+k-1)%M+M)%M];const ib=[pp.x-Math.sin(hp)*sg*TW,pp.y+Math.cos(hp)*sg*TW];B.quad([ib[0],ib[1],prev.z+.05],[ia[0],ia[1],z+.05],[q.x,q.y,z+.05],[prev.x,prev.y,prev.z+.05],hex("#3B3E44"),10)}
      prev=q;if(z>3*m&&k%9===0){const px=p.x+nx*(TW-1.5*m),py=p.y+ny*(TW-1.5*m);if(lowD(px,py)>TW+4*m)B.caixa(px,py,h,2.2*m,1.6*m,Math.max(1,z-1.4*m-H(px,py)),0,hex("#B4B9BF"),hex("#B4B9BF"),13)}}}}
  // alambrado com postes e trilhos sobre os muros, e postes de luz
  if(!street)for(const sg of[1,-1]){const a0=S.wl&&S.wl[sg];if(!a0)continue;let prev=null;for(let i=0;i<M;i+=3){const L=a0[i];if(L==null||!isFinite(L)||L>60*m){prev=null;continue}const p0=g.path[i],h=g.heading[i];const x=p0.x-Math.sin(h)*sg*(L+.4*m),y=p0.y+Math.cos(h)*sg*(L+.4*m),z=zp[i]+1*m;
      let ok=true;for(let k=-60;k<=60;k+=4){const q=g.path[((i+k)%M+M)%M];if(Math.hypot(q.x-x,q.y-y)<L*.9){ok=false;break}}if(!ok){prev=null;continue}
      B.caixa(x,y,h,.12*m,.12*m,3.2*m,z-B.hz(x,y),hex("#8E959D"),hex("#8E959D"),4);
      if(prev&&Math.hypot(x-prev[0],y-prev[1])<20*m)for(const t of[1.4,3.1])B.quad([prev[0],prev[1],prev[2]+t*m],[x,y,z+t*m],[x,y,z+t*m+.07*m],[prev[0],prev[1],prev[2]+t*m+.07*m],hex("#B9C0C7"),4);
      if(i%54===0){const lx=p0.x-Math.sin(h)*sg*(L+3*m),ly=p0.y+Math.cos(h)*sg*(L+3*m);B.caixa(lx,ly,h,.35*m,.35*m,17*m,z-1*m-B.hz(lx,ly),hex("#9AA1A8"),hex("#9AA1A8"),4);B.caixa(lx+Math.sin(h)*sg*1.2*m,ly-Math.cos(h)*sg*1.2*m,h,2.6*m,.5*m,.9*m,z+15.5*m-B.hz(lx,ly),hex("#EEF3F7"),hex("#FFFFFF"),8)}
      prev=[x,y,z]}}
  // placas de frenagem 150/100/50 antes das curvas fortes, por fora
  if(S.props3d){const seg=g.len/M;for(const q of S.props3d.frenagem){const i=q.i,h=q.h,x=q.x,y=q.y,z=zp[i],out=q.out,n=q.n;const lx=-Math.sin(h)*out,ly=Math.cos(h)*out;const W=1.5*m,Hh=1.1*m,z0=z+.5*m;B.caixa(x,y,h,.1*m,.1*m,.6*m,z-B.hz(x,y),hex("#777"),hex("#777"),4);const a=[x-lx*W/2,y-ly*W/2],b=[x+lx*W/2,y+ly*W/2];B.quadUV([a[0],a[1],z0],[b[0],b[1],z0],[b[0],b[1],z0+Hh],[a[0],a[1],z0+Hh],AT.num(n));B.quadUV([b[0],b[1],z0],[a[0],a[1],z0],[a[0],a[1],z0+Hh],[b[0],b[1],z0+Hh],AT.num(n))}}
  else{const seg=g.len/M;let ult=-1e9;for(const cn of(g.corners||[])){const ci=cn.i;if(ci-ult<260*m/seg){ult=ci;continue}ult=ci;const hb=g.heading[(ci+M)%M],ha=g.heading[((ci-Math.round(60*m/seg))%M+M)%M];let dh=hb-ha;while(dh>Math.PI)dh-=2*Math.PI;while(dh<-Math.PI)dh+=2*Math.PI;if(Math.abs(dh)<.5)continue;const out=dh>0?-1:1;
    [150,100,50].forEach((dist,n)=>{const i=((ci-Math.round((dist*m+40*m)/seg))%M+M)%M;const p0=g.path[i],h=g.heading[i],L=TW+4.2*m;const x=p0.x-Math.sin(h)*out*L,y=p0.y+Math.cos(h)*out*L,z=zp[i];const ux=Math.cos(h),uy=Math.sin(h),lx=-Math.sin(h)*out,ly=Math.cos(h)*out;
      const W=1.5*m,Hh=1.1*m,z0=z+.5*m;B.caixa(x,y,h,.1*m,.1*m,.6*m,z-B.hz(x,y),hex("#777"),hex("#777"),4);const a=[x-lx*W/2,y-ly*W/2],b=[x+lx*W/2,y+ly*W/2];B.quadUV([a[0],a[1],z0],[b[0],b[1],z0],[b[0],b[1],z0+Hh],[a[0],a[1],z0+Hh],AT.num(n));B.quadUV([b[0],b[1],z0],[a[0],a[1],z0],[a[0],a[1],z0+Hh],[b[0],b[1],z0+Hh],AT.num(n))})}}
  // faixas de patrocinador por cima da pista, em retas
  const FX=S.props3d&&S.props3d.faixas;if(FX)FX.forEach((f,n)=>{const i=f.i,p0=g.path[i],h=g.heading[i],z=zp[i],lx=-Math.sin(h),ly=Math.cos(h);const a=[p0.x-lx*f.Lb,p0.y-ly*f.Lb],b=[p0.x+lx*f.La,p0.y+ly*f.La];
    for(const q of[a,b])B.caixa(q[0],q[1],h,.6*m,.6*m,9*m,z-B.hz(q[0],q[1]),hex("#3B4048"),hex("#3B4048"),4);const zb=z+7*m,zt=z+8.8*m,r=AT.faixa(n),fx=Math.cos(h)*.16*m,fy=Math.sin(h)*.16*m;
    B.quadUV([a[0]+fx,a[1]+fy,zb],[b[0]+fx,b[1]+fy,zb],[b[0]+fx,b[1]+fy,zt],[a[0]+fx,a[1]+fy,zt],r);B.quadUV([b[0]-fx,b[1]-fy,zb],[a[0]-fx,a[1]-fy,zb],[a[0]-fx,a[1]-fy,zt],[b[0]-fx,b[1]-fy,zt],r);
    B.caixa((a[0]+b[0])/2,(a[1]+b[1])/2,h+Math.PI/2,Math.hypot(b[0]-a[0],b[1]-a[1]),.2*m,1.8*m,zb-B.hz((a[0]+b[0])/2,(a[1]+b[1])/2),hex("#2A2E35"),hex("#2A2E35"),4)});
  if(!FX){const seg=g.len/M;let n=0;for(let i=Math.round(M*.06);i<M&&n<4;i+=Math.round(M*.07)){let reta=true;for(let k=-20;k<=20;k+=5){let d=g.heading[((i+k)%M+M)%M]-g.heading[i];while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;if(Math.abs(d)>.12){reta=false;break}}if(!reta||(P3.ponte&&Math.abs(i-P3.ponte.B.hi)<P3.ponte.K))continue;
    const p0=g.path[i],h=g.heading[i],z=zp[i],lx=-Math.sin(h),ly=Math.cos(h),L=TW+3*m;const a=[p0.x-lx*L,p0.y-ly*L],b=[p0.x+lx*L,p0.y+ly*L];for(const q of[a,b])B.caixa(q[0],q[1],h,.6*m,.6*m,9*m,z-B.hz(q[0],q[1]),hex("#3B4048"),hex("#3B4048"),4);
    const zb=z+7*m,zt=z+8.8*m,r=AT.faixa(n),fx=Math.cos(h)*.16*m,fy=Math.sin(h)*.16*m;B.quadUV([a[0]+fx,a[1]+fy,zb],[b[0]+fx,b[1]+fy,zb],[b[0]+fx,b[1]+fy,zt],[a[0]+fx,a[1]+fy,zt],r);B.quadUV([b[0]-fx,b[1]-fy,zb],[a[0]-fx,a[1]-fy,zb],[a[0]-fx,a[1]-fy,zt],[b[0]-fx,b[1]-fy,zt],r);/* cada face do lado certo: o texto lê direito para quem vem e para quem vai */B.caixa((a[0]+b[0])/2,(a[1]+b[1])/2,h+Math.PI/2,L*2,.2*m,1.8*m,zb-B.hz((a[0]+b[0])/2,(a[1]+b[1])/2),hex("#2A2E35"),hex("#2A2E35"),4);n++}}
  const DC=new Map(),DCS=60;for(let i=0;i<M;i++){const q=g.path[i];const k=Math.floor(q.x/DCS)+","+Math.floor(q.y/DCS);let l=DC.get(k);if(!l)DC.set(k,l=[]);l.push(i)}
  const dCentroI=(x,y)=>{let b=1e9,bi=-1;const gx=Math.floor(x/DCS),gy=Math.floor(y/DCS);for(let a=-2;a<=2;a++)for(let c=-2;c<=2;c++){const l=DC.get((gx+a)+","+(gy+c));if(l)for(const i of l){const q=g.path[i];const d=Math.hypot(q.x-x,q.y-y);if(d<b){b=d;bi=i}}}return[b,bi]};
  const dCentro=(x,y)=>dCentroI(x,y)[0];P3.dCentro=dCentro;
  // altura do chão onde um carro pode estar: em cima do asfalto e da faixa de grama, a altura da pista (sem a rampa da ponte, que o zPos soma);
  // mais longe, o terreno (que agora fica sempre abaixo da pista)
  {const borda=TW+5*U;P3.Hc=(x,y)=>{const r=dCentroI(x,y);const ht=H(x,y)-.25;if(r[1]<0)return ht;const zt=ze[r[1]];if(r[0]<=borda)return zt;const t=Math.min(1,(r[0]-borda)/(3*U));const s2=t*t*(3-2*t);return zt+(Math.max(ht,zt-6*m)-zt)*s2}}
  // pit lane, muro do pit, garagens e prédio
  const side=g.side;if(g.pit&&g.pit.length){const pts=g.pit;const A=[],Bq=[],W1=[];for(let k=0;k<pts.length;k++){const a=pts[Math.max(0,k-1)],b=pts[Math.min(pts.length-1,k+1)];const h=Math.atan2(b.y-a.y,b.x-a.x),nx=-Math.sin(h),ny=Math.cos(h);
      A.push([pts[k].x+nx*15*U,pts[k].y+ny*15*U]);Bq.push([pts[k].x-nx*15*U,pts[k].y-ny*15*U]);W1.push([pts[k].x-nx*side*16*U,pts[k].y-ny*side*16*U])}
    B.faixa(A,Bq,.04,hex("#5A6068"),10,false);const k0=Math.round(pts.length*.12),k1=Math.round(pts.length*.88);for(let k=k0;k<k1;k++){const a=W1[k],b=W1[k+1];if(dCentro(a[0],a[1])<TW+1.2*m||dCentro(b[0],b[1])<TW+1.2*m)continue;{const ha=H(a[0],a[1]),hb=H(b[0],b[1]);B.quad([a[0],a[1],ha],[b[0],b[1],hb],[b[0],b[1],.75*m+hb],[a[0],a[1],.75*m+ha],hex(k%6<3?"#D9DDE2":"#C5CAD0"),13)}}}
  const teams=(typeof G!=="undefined"&&G&&G.teams)||[];(g.garages||[]).forEach((ga,i)=>{const t=teams.find(x=>typeof garF==="function"&&Math.abs(garF(x)-ga.f)<.004)||teams[i];const c=t?t.c:"#888888";
    /* tamanho e lugar vêm do mapa de ocupação (ocupa.js): a garagem tem a fundura que cabe atrás da pit lane */const gd=ga.d||16*U,gw=ga.w||26*U,gx=ga.d?ga.x:ga.x-Math.sin(ga.h)*side*4*U,gy=ga.d?ga.y:ga.y+Math.cos(ga.h)*side*4*U;
    B.caixa(gx,gy,ga.h,gw,gd,14*U,0,hex("#D5D9DE"),hex("#BFC4CA"),18);const fr2=gd/2-.3*U;B.caixa(gx+Math.sin(ga.h)*side*fr2,gy-Math.cos(ga.h)*side*fr2,ga.h,gw*.85,.6*U,3*U,10*U,hex(c),hex(c),14)});
  if(g.building&&g.building.segs){for(const sg2 of g.building.segs)B.caixa(sg2.x,sg2.y,sg2.h,sg2.L,sg2.d,30*U,0,hex("#E4E7EB"),hex("#C9CED4"),18)}else if(g.building&&g.building.pts){const[a,b]=g.building.pts;const x=(a.x+b.x)/2,y=(a.y+b.y)/2,L=Math.hypot(b.x-a.x,b.y-a.y),h=Math.atan2(b.y-a.y,b.x-a.x);B.caixa(x,y,h,L,26*U,30*U,0,hex("#E4E7EB"),hex("#C9CED4"),18)}
  // arquibancadas: degraus subindo para longe da pista
  for(const st of(g.stands||[])){const c=Math.cos(st.h),s=Math.sin(st.h),nx=-s*st.o,ny=c*st.o;const D=26*U,n=5;
    for(let k=0;k<n;k++){const off=(k+.5)*D/n,x=st.x+nx*off,y=st.y+ny*off;const seed=Math.abs(Math.sin(st.seed*91+k*7));const cc=["#C62828","#1565C0","#F9A825","#2E7D32","#6A1B9A","#EF6C00"][Math.floor(seed*6)];
      B.caixa(x,y,st.h,st.w,D/n,(k+1)*4*U,0,hex("#8F969E"),hex(cc),17);
      const np=Math.floor(st.w/(1.7*m));for(let j=0;j<np;j++){const u=-st.w/2+(j+.5)*st.w/np+((j*7+k*3)%5-2)*.12*m,px=x+c*u,py=y+s*u;const r=Math.abs(Math.sin(st.seed*13+k*31+j*17));if(r<.12)continue;
        const v0=B.p.length/3;B.caixa(px,py,st.h,.55*m,.45*m,1.35*m,(k+1)*4*U,hex(["#E53935","#FFD54F","#42A5F5","#FFFFFF","#66BB6A","#FF8A00","#1B1B1B","#7E57C2"][Math.floor(r*8)%8]),hex("#E0B48F"),20);
        B.caixa(px,py,st.h,.32*m,.32*m,.32*m,(k+1)*4*U+1.35*m,hex("#E0B48F"),hex(r>.5?"#3B2A20":"#E8C39E"),20);const ph=4+((r*977)%1)*.999;for(let q=v0;q<B.p.length/3;q++)B.k[q]=ph}}
    B.caixa(st.x+nx*D*1.02,st.y+ny*D*1.02,st.h,st.w,1.2*U,n*4*U+8*U,0,hex("#7D848C"),hex("#7D848C"),13);B.caixa(st.x+nx*D*.8,st.y+ny*D*.8,st.h,st.w*1.02,D*.5,.8*U,n*4*U+8*U,hex("#DADDE1"),hex("#EEF0F2"),13);
  }
  // placas de patrocinadores e postos de fiscais
  for(const b of(g.boards||[])){const sp=typeof sponsorOf==="function"&&b.sp?sponsorOf(b.sp):null;B.caixa(b.x,b.y,b.h,22*U,1.2*U,4.5*U,0,hex(sp?sp.c2:b.c),hex(sp?sp.c:b.c),14)}
  for(const p of(g.posts||[]))B.caixa(p.x,p.y,0,7*U,7*U,7*U,0,hex("#AEB5BE"),hex("#F57C00"),13);
  // pórtico de largada
  {const PO=S.props3d&&S.props3d.portico;/* do lado do box, o pilar fica depois da pit lane */const a=trackPos(0,-(PO?PO.Lb:TW+6*U)),b=trackPos(0,PO?PO.La:TW+6*U);const h=34*U,hd=Math.atan2(b.y-a.y,b.x-a.x);for(const q of[a,b])B.caixa(q.x,q.y,hd,2.2*U,2.2*U,h,0,hex("#2B2F36"),hex("#2B2F36"),4);
    B.caixa((a.x+b.x)/2,(a.y+b.y)/2,hd,Math.hypot(b.x-a.x,b.y-a.y),2.6*U,4*U,h-4*U,hex("#2B2F36"),hex("#2B2F36"),4)}
  // árvores
  for(const t of(S.trees||[])){const sz=(t.s||1)*m*2.4,cc=hex(t.k==="palm"?"#5E8C3A":t.k==="pine"?"#2F5E36":["#3E7A35","#4A8A3E","#356B30"][Math.floor((t.c||0)*3)%3]);
    B.caixa(t.x,t.y,0,sz*.18,sz*.18,sz*1.1,0,hex("#5B4632"),hex("#5B4632"),13);const ht=H(t.x,t.y);if(t.k==="pine")B.copa(t.x,t.y,sz*2.1+ht,sz*.75,sz*1.6,cc,17,t.x);else B.copa(t.x,t.y,sz*1.9+ht,sz,sz*.9,cc,17,t.x)}
  // floresta nos morros (pinheiros simples, muitos)
  if(amp>0){const nF=th.mountains?9000:th.hills?4000:1200;let sd=hsh(7,g.id.length);const rnd=()=>{sd=hsh(Math.floor(sd*1e6),97);return sd};const cP=[hex("#244A2A"),hex("#2C5A30"),hex("#1E3F24"),hex("#35663A")];
    for(let n=0,t=0;n<nF&&t<nF*6;t++){const x=cx+(rnd()*2-1)*E*.92,y=cy+(rnd()*2-1)*E*.92;const D=Dd(x,y);if(D<150*m||D>Math.min(E*.9,1700*m))continue;if(S.isWater&&S.isWater(x,y,D))continue;/* nada de pinheiro no meio do lago */const dens=ruido(x/(400*m),y/(400*m));if(dens<.38)continue;n++;const hh=(9+rnd()*9)*m*(th.mountains?1.3:1),z=H(x,y);const c=cP[Math.floor(rnd()*4)];
      const b0=B.p.length/3,S6=6,rr=hh*.32;B.v(x,y,z+hh,[0,0,1],c,17);for(let q=0;q<S6;q++){const a=q/S6*6.283;B.v(x+Math.cos(a)*rr,y+Math.sin(a)*rr,z+hh*.12,[Math.cos(a),Math.sin(a),.5],c,17)}for(let q=0;q<S6;q++)B.i.push(b0,b0+1+q,b0+1+(q+1)%S6)}}
  // prédios da cidade e horizonte
  const pred=b=>B.caixa(b.x,b.y,b.ang||0,b.w,b.d,b.h,0,hex(b.c||"#B7BCC4"),hex(b.c||"#A8AEB7"),18);(S.bld||[]).forEach(pred);for(const l of(S.lms||[]))(l.list||[]).forEach(pred);
  P3.tris=B.i.length/3;const pv={B,SB,AT};
  // plano que recebe os efeitos 2D do chão (marcas de pneu, borracha, poças, tapetes): fica 30 cm acima do chão, só aparece onde o chão está visível
  return pv}
// ---------- matrizes
const mul=(a,b)=>{const o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o};
function look(e,t,u){const z=nz(sub(e,t)),x=nz(cr(u,z)),y=cr(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1])}
function persp(f,a,n,fa){const t=1/Math.tan(f/2);return new Float32Array([t/a,0,0,0,0,t,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0])}
const ID=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),ID3=new Float32Array([1,0,0,0,1,0,0,0,1]);
const S_MM=15.9/3400,XC=7.6;
function matCarro(p,E){const s=S_MM*CSC,c=Math.cos(p.h),si=Math.sin(p.h);const ax=-s*E[0],ay=-s*E[1],az=s*E[2],tx=XC*CSC*E[0];const ar=p.air;let pz=p.z||0;const pt=(p.pt||0)+(ar?ar.pi:0),cp=Math.cos(pt),sp=Math.sin(pt);
  // mundo = T·R·(diag(ax,ay,az)·m + (tx,0,0)); R inclui a inclinação da rampa
  const f=[c*cp,si*cp,sp],l0=[-si,c,0],u0=[-c*sp,-si*sp,cp];/* inclinação lateral da pista: o carro rola junto (lado de dentro mais baixo) */const rl=(p.rl||0)-(ar?ar.ro:0)/* rl > 0 abaixa o lado esquerdo; na física ro > 0 levanta */,cr=Math.cos(rl),sr=Math.sin(rl);
  const l=[l0[0]*cr-u0[0]*sr,l0[1]*cr-u0[1]*sr,l0[2]*cr-u0[2]*sr],u=[u0[0]*cr+l0[0]*sr,u0[1]*cr+l0[1]*sr,u0[2]*cr+l0[2]*sr];
  /* no ar ou capotando (aereo.js): gira em torno do centro de massa, não do chão */let ox=0,oy=0;if(ar){const k=WS;ox=-u[0]*ar.h0*k;oy=-u[1]*ar.h0*k;pz+=ar.zc*k-u[2]*ar.h0*k}
  const M=new Float32Array([f[0]*ax,f[1]*ax,f[2]*ax,0,l[0]*ay,l[1]*ay,l[2]*ay,0,u[0]*az,u[1]*az,u[2]*az,0,p.x+f[0]*tx+ox,p.y+f[1]*tx+oy,pz+f[2]*tx,1]);
  const N=new Float32Array([f[0]/ax*s,f[1]/ax*s,f[2]/ax*s,l[0]/ay*s,l[1]/ay*s,l[2]/ay*s,u[0]/az*s,u[1]/az*s,u[2]/az*s]);return[M,N]}
function posCarro(c){const p=carWorld(c);const o={x:p.x,y:p.y,h:p.h};if((c.air||c.pose3d)&&typeof aerPose==="function")o.air=aerPose(c);if(P3.zAt&&!c.pit&&c.prog!=null){const L=TRACKGEO.len,d=4*WS/L;o.z=P3.zAt(c.prog);o.pt=Math.atan2(P3.zAt(c.prog+d)-P3.zAt(c.prog-d),8*WS);if(P3.tb&&P3.bnk){const M=P3.tb.length,i=Math.floor(fr(c.prog)*M)%M;if(P3.tb[i]){o.z+=P3.bnk(i,(c.y||0)*WS);o.rl=Math.atan(P3.tb[i])*Math.cos((c.psi||0))}}const lat=Math.abs((c.y||0)*WS),borda=TW+5*U;if(lat>borda&&P3.H){const t=Math.min(1,(lat-borda)/(3*U)),s2=t*t*(3-2*t);o.z+=(Math.max(P3.H(p.x,p.y)-.25,o.z-6*WS)-o.z)*s2}}else if(P3.Hc)o.z=P3.Hc(p.x,p.y);return o}
// ---------- câmera isométrica: a mesma projeção do toScreen do jogo
function isoVP(cw,ch){const Z=CAM.z,A=2*Z/cw,Bc=2*Z/ch,ox=-CAM.x*Z+cw/2+(CAM.sx||0),oy=-CAM.y*Z+ch/2+(CAM.sy||0);const S=ISO_S,C=ISO_C;
  const dc=CAM.y/S,RG=(ch/Z)/S*1.6+600;
  return new Float32Array([A*C,-Bc*S,-1/RG,0, -A*C,-Bc*S,-1/RG,0, 0,Bc,-2*S/RG,0, 2*ox/cw-1,1-2*oy/ch,dc/RG,1])}
// ---------- câmera
const CAMST={};const MODO={chase:1,tv:2,onboard:3,aerea:4,grid:5};
function camera(c,p,dt,md,chave){const cam=CAMST[chave]||(CAMST[chave]={});const m=WS,dir=[Math.cos(p.h),Math.sin(p.h),0],z0=p.z||0;let e,t,fov=55;const k=CSC/.82;
  if(md===1){e=[p.x-dir[0]*9*m*k,p.y-dir[1]*9*m*k,3.1*m+z0];t=[p.x+dir[0]*7*m,p.y+dir[1]*7*m,.9*m+z0];fov=52}
  else if(md===2){const cs=TRACKGEO.cams||[];let best=null,bd=1e18;for(const q of cs){const d=Math.hypot(q.x-p.x,q.y-p.y);const ahead=(q.x-p.x)*dir[0]+(q.y-p.y)*dir[1];const sc=d-(ahead>0?d*.4:0);if(sc<bd){bd=sc;best=q}}
    if(best){e=[best.x,best.y,9*m];t=[p.x,p.y,.6*m+z0];const d=Math.hypot(best.x-p.x,best.y-p.y);fov=Math.max(7,Math.min(48,2*Math.atan(16*m/d)*180/Math.PI))}else{e=[p.x-dir[0]*30*m,p.y-dir[1]*30*m,12*m];t=[p.x,p.y,z0]}}
  else if(md===3){const sp=Math.sin(p.pt||0);e=[p.x+dir[0]*.2*m,p.y+dir[1]*.2*m,1.25*m+z0];t=[p.x+dir[0]*30*m,p.y+dir[1]*30*m,.7*m+z0+sp*30*m];fov=68}
  else if(md===5){const l=[-Math.sin(p.h),Math.cos(p.h)];e=[p.x+l[0]*5*m-dir[0]*2.5*m,p.y+l[1]*5*m-dir[1]*2.5*m,1.4*m+z0];t=[p.x+dir[0]*2.5*m,p.y+dir[1]*2.5*m,.45*m+z0];fov=46}
  else{e=[p.x-dir[0]*45*m,p.y-dir[1]*45*m,38*m+z0];t=[p.x+dir[0]*8*m,p.y+dir[1]*8*m,z0];fov=48}
  /* câmera livre para capturas de teste (tests/pistasshots.js) */if(P3.camForce){const F=P3.camForce;e=F.e;t=F.t;fov=F.fov||50}
  const corte=cam.alvo!==c||cam.md!==md||!cam.e||(cam.tt&&performance.now()-cam.tt>500);cam.alvo=c;cam.md=md;cam.tt=performance.now();const a=corte||md===3||md===2?1:1-Math.exp(-dt*7);
  if(corte){cam.e=e;cam.t=t;cam.f=fov}else{cam.e=cam.e.map((v,i)=>v+(e[i]-v)*a);cam.t=cam.t.map((v,i)=>v+(t[i]-v)*Math.min(1,a*1.6));cam.f=cam.f+(fov-cam.f)*Math.min(1,a*2)}
  return{e:cam.e,t:cam.t,f:cam.f}}
function texCarro(c){const k=(c.t&&c.t.id)+"|"+(c.num??"");let e=TEXA.get(k);if(e&&!e.suja)return e.tex;if(!e){e={cv:document.createElement("canvas"),tex:gl.createTexture(),suja:true};TEXA.set(k,e)}
  const sp=typeof carSponsors==="function"&&c.t?carSponsors(c.t):null;DECAL.textura({canvas:e.cv,m:sp&&sp.m,s:sp&&sp.s,num:c.num,equipe:c.t&&c.t.n},1024,()=>{e.suja=true});e.suja=false;
  gl.bindTexture(gl.TEXTURE_2D,e.tex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,e.cv);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const an=gl.getExtension("EXT_texture_filter_anisotropic");if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,8);return e.tex}
// ---------- etiquetas (posição e sigla) e marcação do seu carro, como no jogo
let lab=null;
function etiquetas(lista,VP,cw,ch,dpr){if(!lab){lab=document.createElement("canvas");lab.id="p3dLab";lab.style.cssText="position:absolute;left:0;top:0;pointer-events:none;z-index:5";cv.parentElement.appendChild(lab)}
  if(lab.parentElement!==cv.parentElement)cv.parentElement.appendChild(lab);lab.style.display=cv.style.display;lab.style.left=cv.style.left;lab.style.top=cv.style.top;lab.style.width=cw+"px";lab.style.height=ch+"px";
  const W2=Math.round(cw*dpr),H2=Math.round(ch*dpr);if(lab.width!==W2||lab.height!==H2){lab.width=W2;lab.height=H2}const x=lab.getContext("2d");x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,cw,ch);
  const proj=(X,Y,Zz)=>{const v=[X,Y,Zz,1];const o=[0,0,0,0];for(let i=0;i<4;i++)o[i]=VP[i]*v[0]+VP[4+i]*v[1]+VP[8+i]*v[2]+VP[12+i]*v[3];if(o[3]<=0)return null;return[(o[0]/o[3]*.5+.5)*cw,(1-(o[1]/o[3]*.5+.5))*ch]};
  const me=lista.find(q=>q.c.isP);const mp=me&&typeof pos==="function"?pos(me.c):0;const placed=[];
  if(me&&P3.cam===0){const s=proj(me.p.x,me.p.y,0);if(s){x.strokeStyle="rgba(255,255,255,.85)";x.lineWidth=1.4;x.beginPath();x.ellipse(s[0],s[1],15*CSC*CAM.z,8*CSC*CAM.z,0,0,7);x.stroke()}}
  lista.map(q=>({...q,s:proj(q.p.x,q.p.y,12*CSC)})).filter(q=>q.s).sort((a,b)=>(b.c.isP?1:0)-(a.c.isP?1:0)||b.s[1]-a.s[1]).forEach(({c,s})=>{const pp=typeof pos==="function"?pos(c):0;
    if(!(c.isP||c.hum||Math.abs(pp-mp)<=3||pp===1))return;if(s[0]<-30||s[0]>cw+30||s[1]<-30||s[1]>ch+30)return;const t=`P${pp} ${c.code}`;x.font=`700 ${c.isP?12:10.5}px "Titillium Web",sans-serif`;x.textAlign="center";const tw=x.measureText(t).width+10;
    s=[s[0],s[1]];for(let k=0;k<4;k++){const hit=placed.find(q=>Math.abs(q[0]-s[0])<(q[2]+tw)/2&&Math.abs(q[1]-s[1])<16);if(!hit)break;s[1]=hit[1]-17}placed.push([s[0],s[1],tw]);
    x.fillStyle=c.isP?"#FFFFFF":c.hum?"#FFD400":"rgba(12,14,18,.82)";x.fillRect(s[0]-tw/2,s[1]-14,tw,15);x.fillStyle=c.col;x.fillRect(s[0]-tw/2,s[1]-14,3,15);x.fillStyle=c.isP||c.hum?"#0A0C10":"#FFF";x.fillText(t,s[0]+1,s[1]-3);
    if(c._stopped){x.fillStyle="#FFD400";x.font="700 10px 'Titillium Web',sans-serif";x.fillText("PIT STOP",s[0],s[1]-18)}})}
// ---------- camadas: A pista 3D · G efeitos no chão (2D do jogo) · B carros 3D · rc efeitos por cima, etiquetas e chuva (2D do jogo)
function camadas(rc,iso){const par=rc.parentElement;if(par._p3dP!==1){if(getComputedStyle(par).position==="static")par.style.position="relative";par._p3dP=1}if(rc._p3dP!==1){if(getComputedStyle(rc).position==="static")rc.style.position="relative";rc._p3dP=1}
  // resolução da camada 3D: o ajuste automático de qualidade reduz aqui antes de tirar qualquer efeito
  const dpr=Math.min(movel()?1.5:2,window.devicePixelRatio||1)*(P3.esc||1),cw=rc.clientWidth,ch=rc.clientHeight,w=Math.round(cw*dpr),h=Math.round(ch*dpr);
  if(CX.B.cv.nextSibling!==rc)par.insertBefore(CX.B.cv,rc);if(CX.G.nextSibling!==CX.B.cv)par.insertBefore(CX.G,CX.B.cv);if(CX.A.cv.nextSibling!==CX.G)par.insertBefore(CX.A.cv,CX.G);
  [[CX.A.cv,1,true],[CX.G,2,false],[CX.B.cv,3,false]].forEach(([c,z,vis])=>{c.style.display=vis?"block":"none";c.style.left=rc.offsetLeft+"px";c.style.top=rc.offsetTop+"px";c.style.width=cw+"px";c.style.height=ch+"px";if(c.width!==w||c.height!==h){c.width=w;c.height=h}});
  if(lab)lab.style.display=iso?"none":"block";return{dpr,cw,ch,w,h}}
function noiteF(){if(R.C&&R.C.night)return 1;if(TWI[TRACKGEO.id]){const pr=Math.min(1,Math.max(0,(R.lead||0)/Math.max(1,R.laps||R.totalLaps||20)));return Math.min(1,Math.max(0,(pr-.3)/.6))}return 0}
function luzes(iso,C,VP){const nf=noiteF(),noite=nf>.5,molh=Math.min(1,(R.w||0)*1.2);const c0=molh>.3?[.62,.66,.7]:[.66,.79,.92],ceu=c0.map((v,i)=>v+([.05,.07,.12][i]-v)*nf);
  gl.uniformMatrix4fv(UN.uVP,false,VP);gl.uniform3fv(UN.uEye,C.e);gl.uniform3fv(UN.uSol,nz([-.35,-.5,noite?.9:.75]));gl.uniform1f(UN.uLuz,1);gl.uniform3fv(UN.uCeu,ceu);gl.uniform1f(UN.uNeb,P3.neb=(iso?0:noite?.0002:molh>.3?.00038:.000105));gl.uniform1f(UN.uMolh,molh);
  const du=DECAL.uniforms();gl.uniform4fv(UN.uDA,du.A);gl.uniform4fv(UN.uDB,du.B);gl.uniform4fv(UN.uDR,du.R);gl.uniform1i(UN.uDT,0);gl.activeTexture(gl.TEXTURE0);gl.uniform1f(UN.uNoite,nf);gl.uniform1f(UN.uSobre,0);gl.uniform1f(UN.uOculta,0);gl.uniform1f(UN.uProjOn,0);gl.uniform4f(UN.uVivo,0,0,0,0);gl.uniform4f(UN.uRol,0,0,0,0);gl.uniform4f(UN.uRoda,0,0,0,0);gl.uniform1i(UN.uAT,2);gl.uniform1f(UN.uDbg,P3.dbg==null?-9:P3.dbg);gl.uniform1f(UN.uT,performance.now()/1000);gl.uniform1f(UN.uExc,animo());return{ceu,du}}
function zPos(p){const P=P3.ponte;const base=P3.Hc?P3.Hc(p.x,p.y):0;if(!P||!P3.zp)return base;const g=TRACKGEO,M=g.M,B=P.B;let bh=1e18,ih=-1,bl=1e18;for(let k=-P.K;k<=P.K;k+=2){const i=((B.hi+k)%M+M)%M,q=g.path[i],d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<bh){bh=d;ih=i}const j=((B.lo+k)%M+M)%M,r=g.path[j],d2=(r.x-p.x)**2+(r.y-p.y)**2;if(d2<bl)bl=d2}
  if(ih<0||Math.sqrt(bh)>TW*2.2)return base;if(bl<bh&&Math.abs(Math.cos(p.h-g.heading[B.lo]))>Math.abs(Math.cos(p.h-g.heading[ih])))return base;return P3.zp[ih]}
P3.zCar=c=>{if(!P3.zAt||!P3.H||c.pit||c.prog==null)return 0;const w=c._w||carWorld(c);return Math.max(0,P3.zAt(c.prog)-P3.H(w.x,w.y))};
// o carro acidentado continua na pista como o próprio carro 3D (amassado, sem as peças, virado se capotou) até o guincho levar
function destroco(c){return c.status==="dnf"&&R.wrecks&&R.wrecks.some(w=>w.c===c&&w.real&&!w.removed)}P3.destroco=destroco;
function vivos(){return R.cars.filter(c=>(c.status!=="dnf"||destroco(c))&&c.status!=="dsq"&&!(c.status==="fin"&&R.over))}
function animo(){let e=.12;if(typeof crowdExc==="function"&&TRACKGEO.stands)for(const st of TRACKGEO.stands){const v=crowdExc(st.f,R.t)||0;if(v>e)e=v}return Math.min(1,e)*.55*WS}
function desenhaPista(){gl.uniform1i(UN.uDN,0);gl.uniformMatrix4fv(UN.uMod,false,ID);gl.uniformMatrix3fv(UN.uNM,false,ID3);gl.uniform3f(UN.uCor,1,1,1);gl.uniform3f(UN.uCor2,1,1,1);gl.uniform3f(UN.uComp,1,1,1);
  desenhaMalha(pista)}
// estado de cada carro para o desenho: rodas girando, esterço, asa ativa, rolagem e arfagem
const VIVO=new Map();P3.vivo=id=>VIVO.get(id);// leitura do estado de desenho de um carro (rodas, suspensão), para testes
function vivo(c,p,real){let s=VIVO.get(c.id);const t=performance.now()/1000;if(!s){s={t,h:p.h,v:c.v||0,gir:0,est:0,asa:0,rol:0,arf:0};VIVO.set(c.id,s)}
  const dt=Math.min(.1,Math.max(.001,t-s.t));if(real&&!UI.paused){const v=Math.max(0,c.v||0);let dh=p.h-s.h;while(dh>Math.PI)dh-=2*Math.PI;while(dh<-Math.PI)dh+=2*Math.PI;const w=dh/dt;
    s.gir+=v*dt/.36;const est=Math.max(-.32,Math.min(.32,w*3.4/Math.max(8,v)));s.est+=(est-s.est)*Math.min(1,dt*8);
    const lat=v*w,lon=(v-s.v)/dt;s.rol+=(Math.max(-.035,Math.min(.035,-lat*.0009))-s.rol)*Math.min(1,dt*5);s.arf+=(Math.max(-.025,Math.min(.025,lon*.0016))-s.arf)*Math.min(1,dt*5);
    const reta=Math.abs(w)<.04&&v>52;s.asa+=((reta?1:0)-s.asa)*Math.min(1,dt*3);
    // suspensão: aceleração da física (dyn.js) quando existe; nos clientes do multijogador, a estimada pela própria tela
    const dy=c.dyn||null;s.latE=lat;suspensao(s,c,v,dy?dy.ax||0:lon,dy?dy.ay||0:lat,dt);s.v=v}s.h=p.h;s.t=t;return s}
// carga em cada roda (estática + aerodinâmica + transferência na freada/aceleração e na curva; mesmas constantes do dyn.js)
// → quanto aquele canto afunda. A mola visual é mais macia que a real (um F1 quase não se mexe) e limitada pela altura do assoalho.
// A carroceria responde como massa e mola amortecida (assenta com um pequeno balanço depois da freada ou da curva).
// O downforce pesa no "heave" (mola central, bem mais dura): o carro abaixa nas retas sem esgotar o curso que sobra para rolar e mergulhar.
// Perto do fim do curso, o batente segura de forma progressiva (tanh).
const SUSP={KV:80,KA:260,DESCE:30,SOBE:40,HZ:2.4,ZETA:.55};
function suspensao(s,c,v,ax,ay,dt){const Lp=typeof LOAD!=="undefined"?LOAD:{L:3.6,H:.3,WF:.453,AF:.44,TR:1.6,RF:.52};const m=(c.ph&&c.ph.mass)||770,cl=(c.ph&&c.ph.cl)||1;
  const down=.5*1.2*4.2*cl*v*v,dx=m*Math.max(-60,Math.min(25,ax))*Lp.H/Lp.L/2,lat=m*Math.max(-60,Math.min(60,ay))*Lp.H/Lp.TR,dF=lat*Lp.RF/2,dR=lat*(1-Lp.RF)/2;
  const fa=down*Lp.AF/2,ra=down*(1-Lp.AF)/2;
  // ay > 0 = curva para a esquerda: carrega as rodas da direita (y > 0 no modelo). Ordem: dianteira esq., dianteira dir., traseira esq., traseira dir.
  const F=[-dx-dF,-dx+dF,dx-dR,dx+dR],A=[fa,fa,ra,ra];
  /* relevo: compressão (fundo de vale) afunda, crista estica */const rl=c._rel;if(rl&&v>3){const cz=m*v*v*rl.kv/4;for(let i=0;i<4;i++)F[i]+=cz}
  /* suspensão física (suspfis.js): o que zebras e ondulações fazem em cada roda */const su=c._sus;if(su&&su.dF)for(let i=0;i<4;i++)F[i]+=su.dF[i]*1.6;if(!s.sz){s.sz=[0,0,0,0];s.sv=[0,0,0,0]}const w=2*Math.PI*SUSP.HZ;
  for(let i=0;i<4;i++){const x=F[i]/SUSP.KV+A[i]/SUSP.KA;const alvo=x>0?SUSP.DESCE*Math.tanh(x/SUSP.DESCE):-SUSP.SOBE*Math.tanh(-x/SUSP.SOBE);let n=Math.ceil(dt/.016);const h=dt/n;
    while(n--){const a=w*w*(alvo-s.sz[i])-2*SUSP.ZETA*w*s.sv[i];s.sv[i]+=a*h;s.sz[i]+=s.sv[i]*h}
    s.sz[i]=Math.max(-SUSP.SOBE-8,Math.min(SUSP.DESCE+4,s.sz[i]))}}
function danos(c){const d=c.dmg||{},wh=d.whl||[];/* com o dano por peça (dano3d.js), as asas quebram peça a peça */const pp=!!c.pd;return{fw:!pp&&(d.wing||0)>.6?1:0,rw:!pp&&(d.rwing||0)>.6?1:0,r:[wh[0]>.97?1:0,wh[1]>.97?1:0,wh[2]>.97?1:0,wh[3]>.97?1:0]}}
// tamanho do carro 3D = tamanho do carro da física (5,6 m × 2,0 m): assim, quando dois carros se encostam na tela, se encostaram de verdade
function escalaFisica(){if(P3.E)return P3.E;const p=malhaCarro(.5).p;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(let k=0;k<p.length;k+=3){const x=p[k],y=p[k+1];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  const lu=(x1-x0)*S_MM*CSC,wu=(y1-y0)*S_MM*CSC,L=(typeof CARL!=="undefined"?CARL:5.6)*WS*.97,Wd=(typeof CARW!=="undefined"?CARW:2)*WS*.97;const e0=L/lu,e1=Wd/wu;P3.E=[e0,e1,(e0+e1)/2];return P3.E}
function desenhaCarros(lista,du,iso,C,pv){const E=escalaFisica();const real=!(P3._replay);
  const m=WS,CL=5.6*m*CSC;const est=[];for(const q of lista){const s=vivo(q.c,q.p,real),z=q.p.z||0;
    if(CUR.VP&&!caixaVis(CUR.VP,[q.p.x-3.4*m,q.p.y-3.4*m,z-.3*m,q.p.x+3.4*m,q.p.y+3.4*m,z+1.6*m]))continue;
    const px=iso?CAM.z*CL*CUR.dpr:CUR.hpx*CL/Math.max(1,Math.hypot(q.p.x-C.e[0],q.p.y-C.e[1],z-C.e[2]));
    est.push({...q,s,d:danos(q.c),M:px>260||!CTX.carM?car:px>95?CTX.carM:CTX.carB})}CUR.stat.carros=est.length;const setCarro=q=>{gl.uniform4f(UN.uVivo,q.s.gir,q.s.est,q.s.asa,1);gl.uniform4f(UN.uRol,q.s.rol,q.s.arf,q.d.fw,q.d.rw);gl.uniform4f(UN.uRoda,q.d.r[0],q.d.r[1],q.d.r[2],q.d.r[3]);const z=q.s.sz||[0,0,0,0];gl.uniform4f(UN.uSusp,z[0],z[1],z[2],z[3]);if(UN.uPD)gl.uniform4fv(UN.uPD,typeof d3Uniforme==="function"?d3Uniforme(q.c):new Float32Array(120))};
  // sombras: das construções (fixas) e dos carros (forma real do carro projetada no chão); o stencil evita escurecer duas vezes
  gl.enable(gl.STENCIL_TEST);gl.stencilFunc(gl.EQUAL,0,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.INCR);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.depthFunc(gl.LEQUAL);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-1,-4);
  gl.uniform1i(UN.uDN,0);if(pv&&pv.somb&&pv.somb.n&&(P3.semMapa||CTX.smGeo!==pv)){gl.uniform4f(UN.uVivo,0,0,0,0);gl.uniformMatrix4fv(UN.uMod,false,ID);desenhaMalha(pv.somb)}
  gl.uniform1f(UN.uProjOn,1);gl.bindVertexArray((CTX.carB||car).vao);for(const q of est){if(!iso&&Math.hypot(q.p.x-C.e[0],q.p.y-C.e[1])>500*WS)continue;const[Mm,Nm]=matCarro(q.p,E);gl.uniformMatrix4fv(UN.uMod,false,Mm);gl.uniform4f(UN.uProj,SOL[0],SOL[1],SOL[2],(q.p.z||0)+.05);setCarro(q);gl.drawElements(gl.TRIANGLES,(CTX.carB||car).n,gl.UNSIGNED_INT,0)}
  gl.uniform1f(UN.uProjOn,0);gl.disable(gl.POLYGON_OFFSET_FILL);gl.depthFunc(gl.LESS);gl.disable(gl.STENCIL_TEST);gl.depthMask(true);gl.disable(gl.BLEND);
  gl.uniform1i(UN.uDN,du.n);let nv=0;
  for(const q of est){const c=q.c,p=q.p;if(!iso&&Math.hypot(p.x-C.e[0],p.y-C.e[1])>1400*WS)continue;const[Mm,Nm]=matCarro(p,E);gl.uniformMatrix4fv(UN.uMod,false,Mm);gl.uniformMatrix3fv(UN.uNM,false,Nm);setCarro(q);
    gl.uniform3fv(UN.uCor,hex(c.col));gl.uniform3fv(UN.uCor2,hex(c.col2||"#F2F2F2"));gl.uniform3fv(UN.uComp,hex(c.tyre&&typeof COMP!=="undefined"&&COMP[c.tyre.c]?COMP[c.tyre.c].c:"#F5C518"));
    gl.bindTexture(gl.TEXTURE_2D,texCarro(c));const oc=P3._oculta&&P3._oculta===c;if(oc)gl.uniform1f(UN.uOculta,1);gl.bindVertexArray(q.M.vao);gl.drawElements(gl.TRIANGLES,q.M.n,gl.UNSIGNED_INT,0);if(oc)gl.uniform1f(UN.uOculta,0);nv++}
  gl.uniform4f(UN.uVivo,0,0,0,0);if(!P3._replay){try{desenhaSC(iso,C,E)}catch(e){P3.erroSC=String(e.message||e)}}gl.uniform1i(UN.uDN,du.n);gl.bindVertexArray(null);return nv}
// ---------- safety car (safety.js): carro de rua com barra de luzes, nas mesmas medidas do modelo (mm; frente em x pequeno)
function malhaSC(){const B=new MB(),Y=[.95,.66,.04],PR=[.07,.07,.08],VD=[.06,.08,.1],CI=[.62,.64,.68],BR=[1,.97,.9],VM=[.75,.05,.04];
  const q=(a,b,c,d,col,m)=>B.quad(a,b,c,d,col,m);
  // carroceria: seções ao longo do carro (x, meia largura, chão, topo)
  const S=[[420,880,300,560],[640,955,290,680],[1900,985,280,770],[3900,985,280,800],[4900,960,290,780],[5160,870,330,710]];
  for(let k=0;k<S.length-1;k++){const[a,wa,za,ta]=S[k],[b,wb,zb,tb]=S[k+1];
    for(const sd of[-1,1]){q([a,sd*wa,za],[b,sd*wb,zb],[b,sd*wb,tb],[a,sd*wa,ta],Y,0);/* faixa preta na lateral */q([a,sd*(wa+2),za+150],[b,sd*(wb+2),zb+150],[b,sd*(wb+2),zb+215],[a,sd*(wa+2),za+215],PR,0)}
    q([a,-wa,ta],[b,-wb,tb],[b,wb,tb],[a,wa,ta],Y,0);q([a,-wa,za],[b,-wb,zb],[b,wb,zb],[a,wa,za],PR,2)}
  {const[a,w,z,t]=S[0];q([a,-w,z],[a,w,z],[a,w,t],[a,-w,t],Y,0);const[b,w2,z2,t2]=S[S.length-1];q([b,-w2,z2],[b,w2,z2],[b,w2,t2],[b,-w2,t2],Y,0)}
  // cabine: para-brisa, teto, vidro traseiro e janelas (vidro escuro)
  const C0=[1900,890,770],C1=[2650,730,1140],C2=[3480,730,1150],C3=[4350,880,800];
  const P_=(c,sd)=>[c[0],sd*c[1],c[2]];
  q(P_(C0,-1),P_(C0,1),P_(C1,1),P_(C1,-1),VD,4);q(P_(C1,-1),P_(C1,1),P_(C2,1),P_(C2,-1),Y,0);q(P_(C2,-1),P_(C2,1),P_(C3,1),P_(C3,-1),VD,4);
  for(const sd of[-1,1]){q(P_(C0,sd),P_(C1,sd),P_(C2,sd),P_(C3,sd),VD,4)}
  // barra de luzes no teto: metade esquerda pisca com uCor, direita com uCor2 (aK 1 e 2)
  const lb=(x0,x1,y0,y1,z0,z1,k)=>{const i0=B.p.length/3;const v=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    const F=[[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]];for(const f of F)q(v[f[0]],v[f[1]],v[f[2]],v[f[3]],[1,1,1],6);for(let j=i0;j<B.p.length/3;j++)B.k[j]=k};
  lb(2820,3180,-620,-40,1150,1230,1);lb(2820,3180,40,620,1150,1230,2);lb(2880,3120,-40,40,1150,1215,4);
  // faróis e lanternas
  for(const sd of[-1,1]){q([425,sd*560,470],[425,sd*820,470],[425,sd*820,540],[425,sd*560,540],BR,0);q([5165,sd*560,600],[5165,sd*830,600],[5165,sd*830,670],[5165,sd*560,670],VM,0)}
  // rodas (pneu e roda de liga leve)
  const roda=(xc,yc)=>{const n=12,r=335,ri=230,hw=125;for(let k=0;k<n;k++){const a0=k/n*Math.PI*2,a1=(k+1)/n*Math.PI*2;const P0=[xc+Math.cos(a0)*r,0,335+Math.sin(a0)*r],P1=[xc+Math.cos(a1)*r,0,335+Math.sin(a1)*r];
    q([P0[0],yc-hw,P0[2]],[P1[0],yc-hw,P1[2]],[P1[0],yc+hw,P1[2]],[P0[0],yc+hw,P0[2]],[.05,.05,.05],2);
    const o=yc+Math.sign(yc)*hw;B.tri([xc,o,335],[xc+Math.cos(a0)*ri,o,335+Math.sin(a0)*ri],[xc+Math.cos(a1)*ri,o,335+Math.sin(a1)*ri],CI,4);
    q([xc+Math.cos(a0)*ri,o,335+Math.sin(a0)*ri],[xc+Math.cos(a0)*r,o,335+Math.sin(a0)*r],[xc+Math.cos(a1)*r,o,335+Math.sin(a1)*r],[xc+Math.cos(a1)*ri,o,335+Math.sin(a1)*ri],[.05,.05,.05],2)}};
  for(const x of[1230,4120])for(const sd of[-1,1])roda(x,sd*840);
  return B}
function desenhaSC(iso,C,E){const c=R.scCar;if(!c)return;const p=posCarro(c),m=WS,z=p.z||0;if(CUR.VP&&!caixaVis(CUR.VP,[p.x-3.4*m,p.y-3.4*m,z-.3*m,p.x+3.4*m,p.y+3.4*m,z+2*m]))return;
  if(!CTX.scM)CTX.scM=sobe(malhaSC());const M=CTX.scM;const[Mm,Nm]=matCarro(p,E);gl.uniform4f(UN.uVivo,0,0,0,0);gl.uniform1i(UN.uDN,0);gl.bindVertexArray(M.vao);gl.uniformMatrix4fv(UN.uMod,false,Mm);
  // sombra no chão
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.depthFunc(gl.LEQUAL);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-1,-4);gl.uniform1f(UN.uProjOn,1);gl.uniform4f(UN.uProj,SOL[0],SOL[1],SOL[2],z+.05);gl.drawElements(gl.TRIANGLES,M.n,gl.UNSIGNED_INT,0);
  gl.uniform1f(UN.uProjOn,0);gl.disable(gl.POLYGON_OFFSET_FILL);gl.depthFunc(gl.LESS);gl.depthMask(true);gl.disable(gl.BLEND);
  // carro: luzes piscando alternadas (laranja), apagadas quando ele vai entrar nos boxes
  const t=performance.now()/1000,ph=Math.floor(t*3.2)%2,ON=[1.6,.75,.05],OFF=[.32,.2,.05];gl.uniformMatrix3fv(UN.uNM,false,Nm);gl.uniform3fv(UN.uCor,c.luzes&&ph===0?ON:OFF);gl.uniform3fv(UN.uCor2,c.luzes&&ph===1?ON:OFF);gl.uniform3fv(UN.uComp,[.1,.1,.1]);
  gl.drawElements(gl.TRIANGLES,M.n,gl.UNSIGNED_INT,0)}
P3.malhaSC=malhaSC;
// ---------- peças soltas (pedacos.js): cada pedaço é a malha da própria peça, girando, quicando e deitada no chão
function vaoPeca(id){const cache=CTX.ped||(CTX.ped={});if(cache[id]!==undefined)return cache[id];malhaCarro(.2);const D=MCARD[.2],S=D&&CARRO.submalha(D,id);if(!S||!S.i.length)return cache[id]=null;
  const o=S.fixacao;for(let k=0;k<S.p.length;k+=3){S.p[k]+=o[0];S.p[k+1]+=o[1];S.p[k+2]+=o[2]}const b=D.pecas.mapa[id].caixa;const v=sobe(S);v.c=[(b.min[0]+b.max[0])/2,(b.min[1]+b.max[1])/2,(b.min[2]+b.max[2])/2];return cache[id]=v}
function matPeca(q,E){const s=S_MM*CSC,ax=-s*E[0],ay=-s*E[1],az=s*E[2];const p=posCarro({prog:q.prog,y:q.y,psi:0,pit:null});const h=p.h+q.ya;
  const ch=Math.cos(h),sh=Math.sin(h),cp=Math.cos(q.pi),sp=Math.sin(q.pi),cr=Math.cos(q.ro),sr=Math.sin(q.ro);
  // R = Rz(h)·Ry(pi)·Rx(ro): colunas
  const r0=[ch*cp,sh*cp,-sp],r1=[ch*sp*sr-sh*cr,sh*sp*sr+ch*cr,cp*sr],r2=[ch*sp*cr+sh*sr,sh*sp*cr-ch*sr,cp*cr];
  const A0=r0.map(x=>x*ax),A1=r1.map(x=>x*ay),A2=r2.map(x=>x*az),c=q._c;const pz=(p.z||0)+q.z*WS;
  const t=[p.x-(A0[0]*c[0]+A1[0]*c[1]+A2[0]*c[2]),p.y-(A0[1]*c[0]+A1[1]*c[1]+A2[1]*c[2]),pz-(A0[2]*c[0]+A1[2]*c[1]+A2[2]*c[2])];
  const M=new Float32Array([A0[0],A0[1],A0[2],0,A1[0],A1[1],A1[2],0,A2[0],A2[1],A2[2],0,t[0],t[1],t[2],1]);
  const N=new Float32Array([r0[0]/ax*s,r0[1]/ax*s,r0[2]/ax*s,r1[0]/ay*s,r1[1]/ay*s,r1[2]/ay*s,r2[0]/az*s,r2[1]/az*s,r2[2]/az*s]);return[M,N,pz]}
function desenhaPedacos(iso,C){const P=R.pedacos;if(!P||!P.length)return 0;const E=escalaFisica();const lst=[];
  for(const q of P){const v=vaoPeca(q.id);if(!v)continue;q._c=v.c;const[Mm,Nm,pz]=matPeca(q,E);if(!iso&&Math.hypot(Mm[12]-C.e[0],Mm[13]-C.e[1])>600*WS)continue;const c=R.cars.find(x=>x.id===q.car);lst.push({q,v,Mm,Nm,pz,c})}
  if(!lst.length)return 0;gl.uniform4f(UN.uVivo,0,0,0,0);gl.uniform4f(UN.uRol,0,0,0,0);gl.uniform4f(UN.uRoda,0,0,0,0);gl.uniform4f(UN.uSusp,0,0,0,0);
  // sombra no chão
  gl.enable(gl.STENCIL_TEST);gl.stencilFunc(gl.EQUAL,0,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.INCR);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.depthFunc(gl.LEQUAL);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-1,-4);gl.uniform1i(UN.uDN,0);gl.uniform1f(UN.uProjOn,1);
  for(const o of lst){gl.uniformMatrix4fv(UN.uMod,false,o.Mm);gl.uniform4f(UN.uProj,SOL[0],SOL[1],SOL[2],o.pz-o.q.z*WS+.04);gl.bindVertexArray(o.v.vao);gl.drawElements(gl.TRIANGLES,o.v.n,gl.UNSIGNED_INT,0)}
  gl.uniform1f(UN.uProjOn,0);gl.disable(gl.POLYGON_OFFSET_FILL);gl.depthFunc(gl.LESS);gl.disable(gl.STENCIL_TEST);gl.depthMask(true);gl.disable(gl.BLEND);
  for(const o of lst){gl.uniformMatrix4fv(UN.uMod,false,o.Mm);gl.uniformMatrix3fv(UN.uNM,false,o.Nm);const c=o.c||{col:o.q.col,col2:o.q.col2};gl.uniform3fv(UN.uCor,hex(c.col||"#888888"));gl.uniform3fv(UN.uCor2,hex(c.col2||"#F2F2F2"));gl.uniform3fv(UN.uComp,hex(c.tyre&&typeof COMP!=="undefined"&&COMP[c.tyre.c]?COMP[c.tyre.c].c:"#F5C518"));
    if(o.c)gl.bindTexture(gl.TEXTURE_2D,texCarro(o.c));gl.bindVertexArray(o.v.vao);gl.drawElements(gl.TRIANGLES,o.v.n,gl.UNSIGNED_INT,0)}
  gl.bindVertexArray(null);return lst.length}
P3.desenhaPedacos=desenhaPedacos;
// variantes do desenho 2D do jogo: só o que fica no chão (marcas, borracha, poças, DRS, setores) e só o que fica por cima (efeitos, etiquetas)
function cortaBloco(s,tok){const i=s.indexOf(tok);if(i<0)throw new Error("trecho não achado: "+tok.slice(0,40));let j=tok[0]==="{"?i:i+tok.length-1;const ab=s[j],fe=ab==="{"?"}":")";let n=0;
  for(;j<s.length;j++){const ch=s[j];if(ch===ab)n++;else if(ch===fe){n--;if(!n)break}}let k=j+1;if(s[k]===";")k++;return s.slice(0,i)+s.slice(k)}
function troca(s,a,b){const i=s.indexOf(a);if(i<0)throw new Error("trecho não achado: "+a.slice(0,40));return s.slice(0,i)+b+s.slice(i+a.length)}
function variantes(){if(P3.vars!==undefined)return P3.vars;try{let fo=C3D.dsOrig||drawScene;for(let k=0;k<6&&fo;k++){if(fo._orig)fo=fo._orig;else if(fo._c3d&&C3D.dsOrig&&fo!==C3D.dsOrig)fo=C3D.dsOrig;else break}const src=fo.toString();const iObj=src.indexOf("// objetos com profundidade"),iHead=src.indexOf("\n");if(iObj<0||iHead<0)throw new Error("drawScene mudou");
    let g=src.slice(0,iObj);const a=g.indexOf("if(g.scn)drawGround("),b=g.indexOf("ctx.fillRect(0,0,cw,ch)}",a);if(a<0||b<0)throw new Error("fundo");g=g.slice(0,a)+"ctx.clearRect(0,0,cw,ch);"+g.slice(b+"ctx.fillRect(0,0,cw,ch)}".length);
    g=cortaBloco(g,"g.gravel.forEach(");g=troca(g,'pathScreen(ctx,g.pit,cw,ch,false);ctx.strokeStyle="#5A6068";ctx.lineWidth=30*U*Z;ctx.stroke();',"");
    g=troca(g,'pathScreen(ctx,g.path,cw,ch,true);ctx.strokeStyle=street?"#9AA1A9":"#2E7D32";ctx.lineWidth=(TW*2+10*U)*Z;ctx.stroke();',"");
    g=cortaBloco(g,"{const E=trackEdges(g);");g=troca(g,'if(g.scn&&typeof drawBarriers==="function")drawBarriers(ctx,cw,ch,street);',"");g=troca(g,"if(detail&&g.scn)drawKerbs(ctx,cw,ch,street);","");
    g=cortaBloco(g,"for(let k=-8;k<8;k++)for(let r=0;r<2;r++){");try{g=troca(g,'if(R.geo&&typeof fichaOf==="function"&&fichaOf(R.geo.id).ponte)drawBridgeDeck(ctx,cw,ch,Z);',"")}catch(e){}g+="\n}";
    let t=src.slice(0,iHead+1)+src.slice(iObj);t=troca(t,"if(g.scn)sceneItems(items,spost,ctx,cw,ch,night,now,detail);","");
    try{const k0=t.indexOf('if(night){ctx.fillStyle="rgba(6,10,30,.5)"');if(k0>=0){const k1=k0+'if(night)'.length;let n=0,j=k1;for(;j<t.length;j++){if(t[j]==='{')n++;else if(t[j]==='}'){n--;if(!n)break}}t=t.slice(0,k0)+t.slice(j+1)}}catch(e){}
    try{t=troca(t,"const s=toScreen(WP[c.id].x,WP[c.id].y,12*CSC,cw,ch)","const s=toScreen(WP[c.id].x,WP[c.id].y,12*CSC+P3D.zCar(c),cw,ch)")}catch(e){}
    try{t=cortaBloco(t,'if(R.geo&&typeof fichaOf==="function"&&fichaOf(R.geo.id).ponte){')}catch(e){}
    for(const k of["g.stands.forEach(","g.boards.forEach(","g.garages.forEach(","g.posts.forEach(","{const PO=g.scn&&g.scn.props3d&&g.scn.props3d.portico,a=trackPos(0,"])t=cortaBloco(t,k);
    const ev=(0,eval);P3.vars={chao:ev("("+g+")"),topo:ev("("+t+")")}}catch(e){P3.vars=null;P3.erroVar=String(e.message||e)}return P3.vars}
// câmera isométrica: desenhado de dentro do desenho do jogo (mesmo quadro, mesma câmera)
function isoRelevo(){if(window.__isoOrig||typeof iso!=="function")return;const o=iso;window.__isoOrig=o;window.iso=function(x,y,z){return o(x,y,(z||0)+(P3.on&&P3.H?P3.H(x,y):0))}}
// ---------- desenho geral: tela da corrida, janelas, torre, replays e melhores momentos
function listaDe(opts){if(opts&&opts.S){const byId=new Map(R.cars.map(c=>[c.id,c]));const o=[];for(const s of opts.S.cars){const c=byId.get(s.id);if(!c||s.vis===0||s.vis===false)continue;const p={x:s.x,y:s.y,h:s.h};p.z=zPos(p);o.push({c,p})}return o}
  return vivos().map(c=>({c,p:posCarro(c)}))}
let ultPrincipal=0;
// janelinha e câmera da torre: desenha no máximo 20 vezes por segundo; nos quadros entre um e outro repete a última imagem
const JAN=new WeakMap();
function repete(ctx,k){const c=JAN.get(k);if(!c||performance.now()-c.t>=48||c.cv.width!==k.width||c.cv.height!==k.height)return false;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="copy";ctx.drawImage(c.cv,0,0);ctx.restore();return true}
function guardaJan(k){let c=JAN.get(k);if(!c){c={cv:document.createElement("canvas"),t:0};JAN.set(k,c)}if(c.cv.width!==k.width||c.cv.height!==k.height){c.cv.width=k.width;c.cv.height=k.height}const x=c.cv.getContext("2d");x.globalCompositeOperation="copy";x.drawImage(k,0,0);c.t=performance.now()}
P3.desenha=function(ctx,cw,ch,opts,cs){opts=opts||{};const principal=ctx.canvas&&ctx.canvas.id==="rc";const jan=!principal&&!opts.S&&ctx.canvas&&ctx.canvas.isConnected?ctx.canvas:null;if(jan&&repete(ctx,jan))return;cs=opts.cam3d||cs||{tipo:"iso"};
  if(principal&&!opts.cam3d&&!opts.S&&typeof UI!=="undefined"&&UI.cam==="tv"&&!R.started&&R.form&&R.form.phase==="lights"){if(!P3.gridT0)P3.gridT0=performance.now();const ord=(R.order||R.cars).filter(c=>c.status!=="dnf");const k=Math.min(1,(performance.now()-P3.gridT0)/9000);const c=ord[Math.max(0,Math.min(ord.length-1,Math.round((1-k)*(ord.length-1))))];if(c)cs={tipo:"grid",id:c.id,chave:"grid"}}else if(R.started)P3.gridT0=0;const iso=cs.tipo==="iso";const t0=performance.now();
  init();isoRelevo();const V=iso?variantes():null;if(iso&&!V)throw new Error("efeitos 2D: "+P3.erroVar);
  const o=principal?CX.A:(CX.O||(CX.O=criaCtx("p3dO",false)));usa(o);if(!o.pista||o.geo!==TRACKGEO){o.pista=constroiPista();o.geo=TRACKGEO}pista=o.pista;
  let L;if(principal){L=camadas(ctx.canvas,true);ultPrincipal=performance.now()}else{const tr=ctx.getTransform?ctx.getTransform():{a:1};const dpr=cw<720?Math.min(1,tr.a||1):(tr.a||1);L={dpr,cw,ch,w:Math.max(2,Math.round(cw*dpr)),h:Math.max(2,Math.round(ch*dpr))};if(o.cv.width!==L.w||o.cv.height!==L.h){o.cv.width=L.w;o.cv.height=L.h}}
  const lista=listaDe(opts);P3._replay=!!opts.S;const now=performance.now()/1000;let C,VP;
  if(pista.atlas&&o.atGeo!==pista){if(!o.atT)o.atT=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,o.atT);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,pista.atlas);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.activeTexture(gl.TEXTURE0);o.atGeo=pista}
  if(pista.smR&&!P3.semMapa&&o.smGeo!==pista&&o.smFalhou!==pista){if(mapaSombraGPU(o,pista))o.smGeo=pista;else o.smFalhou=pista}
  if(o.smT&&o.smGeo===pista&&!P3.semMapa){gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,o.smT);gl.activeTexture(gl.TEXTURE0);gl.useProgram(P);gl.uniform1i(UN.uSM,3);gl.uniform4fv(UN.uSMR,pista.smR);gl.uniform1f(UN.uSMon,1)}else{gl.useProgram(P);gl.uniform1f(UN.uSMon,0)}
  if(o.atT){gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,o.atT);gl.activeTexture(gl.TEXTURE0)}
  P3._oculta=null;if(iso){VP=isoVP(cw,ch);const v=nz([1,1,2*ISO_S]);const ref=lista[0]?lista[0].p:{x:0,y:0};C={e:[ref.x+v[0]*1e6,ref.y+v[1]*1e6,v[2]*1e6]}}
  else{const alvo=lista.find(q=>q.c.id===cs.id)||lista.find(q=>q.c.isP)||lista[0];if(!alvo)return;const ch2=(principal?"p":"o")+(cs.chave||"");const dt=Math.min(.1,now-(CAMST[ch2]&&CAMST[ch2].tn||now));C=camera(alvo.c,alvo.p,dt,MODO[cs.tipo]||1,ch2);P3._oculta=null;CAMST[ch2].tn=now;VP=mul(persp(C.f*Math.PI/180,L.w/L.h,.25*WS,90000),look(C.e,C.t,[0,0,1]))}
  CUR.VP=VP;CUR.iso=iso;CUR.eye=iso?null:C.e;CUR.dpr=L.dpr||1;CUR.hpx=iso?1:L.h/(2*Math.tan(C.f*Math.PI/360));CUR.stat={tris:0,blocos:0,total:0,carros:0};
  // efeitos 2D do chão (só na câmera isométrica, que é a mesma projeção do jogo)
  let Gc=null;if(iso){Gc=principal?CX.G:(CX.GO||(CX.GO=document.createElement("canvas")));const gs=Math.min(1,L.dpr),gw=Math.max(2,Math.round(cw*gs)),gh=Math.max(2,Math.round(ch*gs));if(Gc.width!==gw||Gc.height!==gh){Gc.width=gw;Gc.height=gh}const g2=Gc.getContext("2d");g2.setTransform(gs,0,0,gs,0,0);V.chao(g2,cw,ch,opts)}
  // 3D: pista → efeitos do chão → carros
  gl.viewport(0,0,L.w,L.h);gl.useProgram(P);const lz=luzes(iso,C,VP);CUR.far=P3.neb?3.1/P3.neb:0;gl.clearColor(lz.ceu[0],lz.ceu[1],lz.ceu[2],1);gl.clearStencil(0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
  if(!iso&&o.ceu){const Rr=40000;gl.depthMask(false);gl.disable(gl.DEPTH_TEST);gl.uniform1i(UN.uDN,0);gl.uniformMatrix4fv(UN.uMod,false,new Float32Array([Rr,0,0,0,0,Rr,0,0,0,0,Rr,0,C.e[0],C.e[1],C.e[2],1]));gl.uniformMatrix3fv(UN.uNM,false,ID3);gl.bindVertexArray(o.ceu.vao);gl.drawElements(gl.TRIANGLES,o.ceu.n,gl.UNSIGNED_INT,0);gl.depthMask(true);gl.enable(gl.DEPTH_TEST)}
  desenhaPista();
  if(Gc){if(!o.gt)o.gt=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,o.gt);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,Gc);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.uniform1i(UN.uGT,1);gl.uniform2f(UN.uVS,L.w,L.h);gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.depthFunc(gl.LEQUAL);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-2,-2);gl.uniform1f(UN.uSobre,1);gl.uniformMatrix4fv(UN.uMod,false,ID);desenhaMalha(pista);gl.uniform1f(UN.uSobre,0);gl.disable(gl.POLYGON_OFFSET_FILL);gl.depthMask(true);gl.disable(gl.BLEND);gl.depthFunc(gl.LESS)}
  const nv=desenhaCarros(lista,lz.du,iso,C,pista);if(principal)P3.nv=nv;if(!opts.S){try{P3.np=desenhaPedacos(iso,C)}catch(e){P3.erroPed=String(e.message||e)}}if(!iso&&!opts.S){try{particulas(o,VP,L.h/(2*Math.tan(C.f*Math.PI/360)))}catch(e){}}
  // 2D por cima: na tela da corrida a camada 3D fica embaixo do canvas; nas janelas, a imagem 3D é copiada para o canvas
  if(principal)ctx.clearRect(0,0,cw,ch);else ctx.drawImage(o.cv,0,0,cw,ch);
  if(iso){P3.topo=true;try{V.topo(ctx,cw,ch,opts)}finally{P3.topo=false}
    if(principal&&!opts.S){const me=lista.find(q=>q.c.isP);if(me){const s=toScreen(me.p.x,me.p.y,Math.max(0,(me.p.z||0)-(P3.H?P3.H(me.p.x,me.p.y):0)),cw,ch);ctx.strokeStyle="rgba(255,255,255,.85)";ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(s[0],s[1],15*CSC*CAM.z,8*CSC*CAM.z,0,0,7);ctx.stroke()}}}
  if(principal){P3.ms=performance.now()-t0;P3.stat=CUR.stat;C3D&&C3D.amostra&&C3D.amostra(P3.ms)}else if(jan)guardaJan(jan)};
// ---------- fotos automáticas (largada, chegada, melhores momentos, pódio)
P3.foto=function(rot,cam){try{if(!R||!R.cars)return;const cv=document.createElement("canvas");cv.width=1280;cv.height=720;const x=cv.getContext("2d");drawScene(x,1280,720,{pip:true,cam3d:cam});drawScene(x,1280,720,{pip:true,cam3d:cam});
  x.fillStyle="rgba(10,12,16,.75)";x.fillRect(24,24,420,64);x.fillStyle="#FF4D2E";x.fillRect(24,24,6,64);x.fillStyle="#fff";x.font="800 26px 'Titillium Web',sans-serif";x.fillText(rot,44,58);x.font="600 16px 'Titillium Web',sans-serif";x.fillStyle="#C9CDD3";x.fillText((R.C&&R.C.n||"")+" · Liga Paddock",44,80);
  (R.fotos||(R.fotos=[])).push({rot,url:cv.toDataURL("image/jpeg",.86)});if(R.fotos.length>8)R.fotos.shift()}catch(e){console.warn("foto",e)}};
function vigiaFotos(){if(typeof R==="undefined"||!R||!R.cars||!P3.on)return;const lid=(R.order&&R.order[0])||R.cars[0];
  if(R.started&&!R._fLarg&&R.t>(R.startT||0)+2.2){R._fLarg=1;P3.foto("Largada",{tipo:"tv",id:lid.id,chave:"fotoL"})}
  if(R.over&&!R._fCheg){R._fCheg=1;const v=R.cars.find(c=>c.status==="fin"&&(typeof pos!=="function"||pos(c)===1))||lid;P3.foto("Vitória de "+(v.code||v.n||""),{tipo:"tv",id:v.id,chave:"fotoC"})}
  if(R.clips&&R.clips.length>(R._fClip||0)){const q=R.clips[R.clips.length-1];R._fClip=R.clips.length;if((q.imp||q.w||0)>=2&&R.fotos&&R.fotos.filter(f=>/Lance/.test(f.rot)).length<3&&q.cars&&q.cars.length)setTimeout(()=>P3.foto("Lance: "+(q.lab||q.type||""),{tipo:"onboard",id:q.cars[0],chave:"fotoH"}),50)}}
P3.cardFotos=function(){if(!R||!R.fotos||!R.fotos.length)return"";return`<div class="card" style="grid-column:1/-1"><h3>Fotos da corrida <small class="muted">${R.fotos.length}</small></h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">${R.fotos.map((f,i)=>`<figure style="margin:0"><img src="${f.url}" style="width:100%;border-radius:10px;display:block" alt="${f.rot}"><figcaption style="display:flex;justify-content:space-between;gap:8px;margin-top:4px;font-size:12px"><span>${f.rot}</span><a href="${f.url}" download="paddock-foto-${i+1}.jpg">Salvar</a></figcaption></figure>`).join("")}</div></div>`};
// ---------- pódio 3D na tela de resultado
P3.cardPodio=function(){return(typeof WebGL2RenderingContext!=="undefined"&&P3.on)?`<div class="card" style="grid-column:1/-1;padding:0;overflow:hidden"><canvas id="p3dPodio" style="width:100%;height:340px;display:block;background:#0c0d10"></canvas></div>`:""};
let PD=null;
function podio(cv){try{const w=cv.clientWidth,h=cv.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);if(!w||!h)return;if(cv.width!==Math.round(w*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}
  if(!PD||PD.cv!==cv){const o={cv,gl:cv.getContext("webgl2",{antialias:true,stencil:true}),UN:{},tex:new Map()};if(!o.gl)return;usa(o);o.P=P=prog(VS,FS);for(const n of["uVP","uMod","uNM","uCor","uCor2","uComp","uEye","uSol","uLuz","uCeu","uNeb","uMolh","uDT","uDN","uDA","uDB","uDR","uT","uExc","uGT","uVS","uNoite","uSobre","uOculta","uVivo","uRol","uRoda","uSusp","uPD","uProj","uProjOn","uAT","uDbg","uSM","uSMR","uSMon"])o.UN[n]=o.gl.getUniformLocation(P,n);
    const D=CARRO.construir({lod:.5,cor:"#FF0000",cor2:"#00FF00"});o.car=sobe(comPecas(D));const S=new MB();S.quad([-1150,-1000,4],[4350,-1000,4],[4350,1000,4],[-1150,1000,4],[0,0,0],19);o.sombra=sobe(S);const K=new MB();K.copa(0,0,0,1,1,[1,1,1],22,0);o.ceu=sobe(K);
    const B=new MB();const m=WS;B.quad([-200*m,-200*m,0],[200*m,-200*m,0],[200*m,200*m,0],[-200*m,200*m,0],hex("#2B2F36"),13);
    [[0,0,1.6,"#E9ECEF"],[0,-6.4,1.1,"#D7DBE0"],[0,6.4,.7,"#D7DBE0"]].forEach(([x,y,hh,c])=>{B.caixa(x*m,y*m,0,7*m,6.2*m,hh*m,0,hex(c),hex("#FF4D2E"),13)});B.caixa(-8*m,0,0,.6*m,30*m,9*m,0,hex("#FF4D2E"),hex("#FF4D2E"),13);
    o.pod=sobe(B);PD=o}
  const o=PD;usa(o);const gl2=gl;const top=R.cars.slice().filter(c=>c.status!=="dsq").sort((a,b)=>(typeof pos==="function"?pos(a)-pos(b):0)).slice(0,3);const m=WS,tt=performance.now()/1000;
  const ang=.55+Math.sin(tt*.25)*.3,dist=17*m,e=[Math.cos(ang)*dist+3*m,Math.sin(ang)*dist,6.5*m],VP=mul(persp(.7,cv.width/cv.height,.5*m,6000*m),look(e,[0,0,2.6*m],[0,0,1]));
  gl2.viewport(0,0,cv.width,cv.height);gl2.useProgram(P);const C={e};const lz=luzes(false,C,VP);gl2.uniform1f(UN.uNeb,0);gl2.uniform1f(UN.uNoite,0);gl2.clearColor(.05,.06,.08,1);gl2.clear(gl2.COLOR_BUFFER_BIT|gl2.DEPTH_BUFFER_BIT|gl2.STENCIL_BUFFER_BIT);gl2.enable(gl2.DEPTH_TEST);
  {const Rr=3000*m;gl2.depthMask(false);gl2.disable(gl2.DEPTH_TEST);gl2.uniform1i(UN.uDN,0);gl2.uniformMatrix4fv(UN.uMod,false,new Float32Array([Rr,0,0,0,0,Rr,0,0,0,0,Rr,0,e[0],e[1],e[2],1]));gl2.uniformMatrix3fv(UN.uNM,false,ID3);gl2.bindVertexArray(o.ceu.vao);gl2.drawElements(gl2.TRIANGLES,o.ceu.n,gl2.UNSIGNED_INT,0);gl2.depthMask(true);gl2.enable(gl2.DEPTH_TEST)}
  gl2.uniformMatrix4fv(UN.uMod,false,ID);gl2.uniformMatrix3fv(UN.uNM,false,ID3);gl2.bindVertexArray(o.pod.vao);gl2.drawElements(gl2.TRIANGLES,o.pod.n,gl2.UNSIGNED_INT,0);
  const pz=[1.6,1.1,.7],py=[0,-6.4,6.4];const lista=top.map((c,i)=>({c,p:{x:0,y:py[i]*m,h:Math.PI/2+.6,z:pz[i]*m}}));desenhaCarros(lista,lz.du,true,C,null)}catch(e){console.warn("pódio",e)}}
// ---------- partículas nas câmeras 3D (fumaça, faíscas, poeira, spray de chuva)
const PVS=`#version 300 es
in vec4 aQ;in vec4 aK;uniform mat4 uVP;uniform float uH;out vec4 vK;void main(){gl_Position=uVP*vec4(aQ.xyz,1.);gl_PointSize=clamp(aQ.w*uH/gl_Position.w,1.,160.);vK=aK;}`;
const PFS=`#version 300 es
precision mediump float;in vec4 vK;out vec4 o;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;o=vec4(vK.rgb,vK.a*(1.-r*r));}`;
function particulas(o,VP,Hpx){if(!o.pp){o.pp=prog(PVS,PFS);o.pb=gl.createBuffer();o.pk=gl.createBuffer();o.pv=gl.createVertexArray()}const Q=[],K=[];const m=WS,t=performance.now()/1000;
  const add=(x,y,z,s,r,g,b,a)=>{Q.push(x,y,z,s);K.push(r,g,b,a)};const sh=(i,j)=>{const v=Math.sin(i*127.1+j*311.7)*43758.5;return v-Math.floor(v)};
  for(const c of R.cars){if(c.status==="dnf")continue;const p=posCarro(c),dx=Math.cos(p.h),dy=Math.sin(p.h),z0=p.z||0;
    if(c.smokeT&&c.smokeT>R.t)for(let k=0;k<14;k++){const d=(k*.9+((t*6)%.9))*m*2.2;add(p.x-dx*d+(sh(k,1)-.5)*m,p.y-dy*d+(sh(k,2)-.5)*m,z0+.6*m+k*.18*m,(1.6+k*.35)*m,.82,.82,.84,.5*(1-k/14))}
    if((R.w||0)>.3&&(c.v||0)>25)for(let k=0;k<10;k++){const d=(1.5+k*.8)*m*2;add(p.x-dx*d+(sh(k,3)-.5)*1.6*m,p.y-dy*d+(sh(k,4)-.5)*1.6*m,z0+.35*m+k*.08*m,(1.4+k*.3)*m,.86,.88,.9,.28*(1-k/10)*R.w)}}
  for(const e of(R.fxq||[])){const age=R.t-e.t0;if(age<0||age>1.6||e.f==null)continue;const q=trackPos(e.f,e.lat||0),z0=P3.H?P3.H(q.x,q.y):0;const fa=e.type==="sparks"?1:0;
    for(let k=0;k<(fa?40:18);k++){const a=sh(k,e.t0)*6.283,s=sh(k+5,e.t0);const r=(fa?6:3)*m*age*(.4+s);const zz=fa?Math.max(0,(3*s-4.9*age*age))*m:(.4+age*1.5)*m;add(q.x+Math.cos(a)*r,q.y+Math.sin(a)*r,z0+zz,fa?.22*m:(1.5+age*2)*m,fa?1:.66,fa?.7:.56,fa?.25:.42,fa?Math.max(0,1-age*1.4):.45*(1-age/1.6))}}
  if(!Q.length)return;gl.useProgram(o.pp);gl.bindVertexArray(o.pv);gl.bindBuffer(gl.ARRAY_BUFFER,o.pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(Q),gl.DYNAMIC_DRAW);let L=gl.getAttribLocation(o.pp,"aQ");gl.enableVertexAttribArray(L);gl.vertexAttribPointer(L,4,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,o.pk);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(K),gl.DYNAMIC_DRAW);L=gl.getAttribLocation(o.pp,"aK");gl.enableVertexAttribArray(L);gl.vertexAttribPointer(L,4,gl.FLOAT,false,0,0);
  gl.uniformMatrix4fv(gl.getUniformLocation(o.pp,"uVP"),false,VP);gl.uniform1f(gl.getUniformLocation(o.pp,"uH"),Hpx);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.POINTS,0,Q.length/4);gl.depthMask(true);gl.disable(gl.BLEND);gl.bindVertexArray(null);gl.useProgram(P)}
// some a camada 3D quando a corrida não está mais sendo desenhada
P3.quadro=function(){try{if(typeof TRACKGEO!=="undefined"&&TRACKGEO&&GEOC.g!==TRACKGEO&&!P3._prep){P3._prep=1;(window.requestIdleCallback||(f=>setTimeout(f,300)))(()=>{P3._prep=0;P3.prepara()},{timeout:2000})}}catch(e){}
  // (acima) carregamento antecipado: a pista 3D é montada nos momentos ociosos do fim de semana, não na largada
  try{vigiaFotos();const pc=document.getElementById("p3dPodio");if(pc)podio(pc)}catch(e){}if(CX.A&&performance.now()-ultPrincipal>400){[CX.A.cv,CX.G,CX.B.cv].forEach(c=>c&&(c.style.display="none"))}};
})();
