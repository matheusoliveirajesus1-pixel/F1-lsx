// ===================== DANO POR PEÇA DO CARRO 3D =====================
// Cada batida machuca as peças do modelo 3D que estão perto do ponto do impacto, na medida da força:
//  - amassado (0 a 1): a peça deforma e aparece arranhada, com a fibra de carbono à mostra
//  - pendurada (1 a 1,6): a peça cede e cai para perto do chão (asa raspando, endplate solto)
//  - solta (2): a peça sai do carro (vira um pedaço na pista na etapa das peças soltas)
// Peças presas a outras caem junto (sem a asa principal, os flapes e o endplate vão embora; sem o bico, a asa dianteira).
// O dano visual e o dano de desempenho (c.dmg: asas, bico, assoalho, rodas) andam juntos nos dois sentidos: o que o
// carro perdeu na tela ele perdeu na pista, e o que a física quebrou aparece quebrado.
const D3={
  K:{aerodinamica:1.5,carroceria:.8,suspensao:.9,freio:.7,roda:.12,chassi:.1,estrutura:.15,cockpit:0,piloto:0},// fragilidade por tipo de peça
  SOLTA:1.6,// a partir daqui a peça se solta
  E0:1.5,// abaixo desta velocidade de impacto (m/s) só risca
  RAIO:200,RAIO_E:24// alcance do impacto (mm) e quanto cresce por m/s
};
// peças que levam outras junto quando saem
const D3_GRUPOS=[
  ["Nose.Cone",["Nose.Tip","FrontWing."]],
  ["FrontWing.MainPlane.E",["FrontWing.Flap1.E","FrontWing.Flap2.E","FrontWing.Endplate.E","FrontWing.Footplate.E"]],
  ["FrontWing.MainPlane.D",["FrontWing.Flap1.D","FrontWing.Flap2.D","FrontWing.Endplate.D","FrontWing.Footplate.D"]],
  ["FrontWing.Flap1.E",["FrontWing.Flap2.E"]],["FrontWing.Flap1.D",["FrontWing.Flap2.D"]],
  ["RearWing.MainPlane",["RearWing.Flap","RearWing.Endplate","RearWing.Pylon"]],
  ["RearWing.Endplate.E",["RearWing.EndplatePanel.E","RearWing.EndplateStripe.E"]],["RearWing.Endplate.D",["RearWing.EndplatePanel.D","RearWing.EndplateStripe.D"]],
  ["Mirrors.E.Stalk",["Mirrors.E.Housing"]],["Mirrors.D.Stalk",["Mirrors.D.Housing"]],
  ["Wheels.FrontLeft.Tyre",["Wheels.FrontLeft."]],["Wheels.FrontRight.Tyre",["Wheels.FrontRight."]],["Wheels.RearLeft.Tyre",["Wheels.RearLeft."]],["Wheels.RearRight.Tyre",["Wheels.RearRight."]],
  ["Floor.EdgeWing.E",["Floor.EdgeFin.E"]],["Floor.EdgeWing.D",["Floor.EdgeFin.D"]]
];
// catálogo das peças (o mesmo modelo do desenho, sem precisar de tela): índice fixo por id
function d3Meta(){if(D3._m)return D3._m;if(typeof CARRO==="undefined"||!CARRO.construir)return null;const D=CARRO.construir({lod:.05}),L=D.pecas.lista,P=D.mesh.p;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(let k=0;k<P.length;k+=3){x0=Math.min(x0,P[k]);x1=Math.max(x1,P[k]);y0=Math.min(y0,P[k+1]);y1=Math.max(y1,P[k+1])}
  const lista=L.map((p,i)=>({i,id:p.id,cat:p.categoria,destr:!!p.destrutivel,danif:p.danificavel!==false,cx:p.caixa,tri:p.triangulos||0,nome:p.nome,lado:p.lado}));const idx={};for(const p of lista)idx[p.id]=p.i;
  const grupos=D3_GRUPOS.map(([pai,fil])=>[idx[pai],lista.filter(p=>fil.some(f=>f.endsWith(".")?p.id.startsWith(f):(p.id===f||p.id.startsWith(f+"."))&&p.id!==pai)).map(p=>p.i)]).filter(g=>g[0]!=null);
  /* o modelo (mm) tem o tamanho da caixa da física (5,6 × 2,0 m): mesma conta do desenho */
  return D3._m={lista,idx,n:lista.length,cx:(x0+x1)/2,kx:(x1-x0)/(CARL*.97),ky:(y1-y0)/(CARW*.97),grupos}}
function d3Idx(id){const M=d3Meta();return M?M.idx[id]:undefined}
function d3Estado(c){const M=d3Meta();if(!M)return null;if(!c.pd||c.pd.length!==M.n)c.pd=new Float32Array(M.n);return c.pd}
// solta uma peça (e as que dependem dela); guarda o evento para os pedaços na pista
function d3Solta(c,i,o){const M=d3Meta(),pd=d3Estado(c);if(!pd||pd[i]>=2)return;pd[i]=2;const p=M.lista[i];
  (R.pecasSoltas||(R.pecasSoltas=[])).push({car:c.id,id:p.id,i,t:R.t,prog:c.prog,y:c.y||0,v:c.v||0,chi:(c.dyn&&c.dyn.chi)||0,psi:c.psi||0,E:o&&o.E||0,l:o&&o.l||0,w:o&&o.w||0});
  for(const[pai,fil]of M.grupos)if(pai===i)for(const j of fil)if(pd[j]<2)d3Solta(c,j,o)}
// impacto num ponto do carro: l para a frente e w para a esquerda a partir do centro (m), z altura (mm), E velocidade do impacto (m/s)
function d3Ponto(c,l,w,E,z){const M=d3Meta(),pd=d3Estado(c);if(!pd||!(E>D3.E0))return 0;z=z==null?300:z;
  const x=M.cx-l*M.kx,y=-w*M.ky,Rr=D3.RAIO+D3.RAIO_E*E,forca=Math.min(2.5,(E-D3.E0)/7);let n=0;
  for(const p of M.lista){if(!p.danif||!p.tri||pd[p.i]>=2)continue;const k=D3.K[p.cat]||0;if(!k)continue;const b=p.cx;
    const dx=Math.max(b.min[0]-x,0,x-b.max[0]),dy=Math.max(b.min[1]-y,0,y-b.max[1]),dz=Math.max(b.min[2]-z,0,z-b.max[2])*.5,d=Math.hypot(dx,dy,dz);if(d>=Rr)continue;
    const f=1-d/Rr,dd=f*f*k*forca;if(dd<.01)continue;const nv=pd[p.i]+dd;n++;
    if(nv>=D3.SOLTA&&p.destr&&p.cat!=="roda")d3Solta(c,p.i,{E,l,w});else pd[p.i]=Math.min(p.destr&&p.cat!=="roda"?D3.SOLTA-.01:1,nv)}
  if(n)d3ParaFisica(c);return n}
// impacto em coordenadas da pista (ponto pt = [s, y] com o carro em s0): converte para o corpo do carro
function d3PontoPista(c,s0,pt,E,z){const ps=c.psi||0,ds=pt[0]-s0,dy=pt[1]-(c.y||0);return d3Ponto(c,ds*Math.cos(ps)+dy*Math.sin(ps),-ds*Math.sin(ps)+dy*Math.cos(ps),E,z)}
// muro do lado s (+1 esquerda): a quina do carro mais para o lado do muro é a que bate
function d3Parede(c,s,imp){let best=null,bv=-1e9;const ps=c.psi||0,co=Math.cos(ps),si=Math.sin(ps);for(const[a,b]of[[2.8,1],[2.8,-1],[-2.8,1],[-2.8,-1],[0,1],[0,-1]]){const yy=a*si+b*co;if(s*yy>bv){bv=s*yy;best=[a,b]}}
  return d3Ponto(c,best[0]*.95,best[1],imp,280)}
// dano visual → desempenho: asa que saiu não dá pressão, bico que saiu também não
function d3ParaFisica(c){const M=d3Meta(),pd=c.pd;if(!pd||!c.dmg)return;if(typeof dmgInit==="function")dmgInit(c);const d=c.dmg,g=id=>{const i=M.idx[id];return i==null?0:pd[i]};
  for(const[L,k]of[["E","wingL"],["D","wingR"]]){const mp=g("FrontWing.MainPlane."+L),f1=g("FrontWing.Flap1."+L),f2=g("FrontWing.Flap2."+L);
    const v=mp>=2?.65:Math.max(f1>=2?.4:0,f2>=2?.25:0,Math.min(.5,(mp+f1+f2)/3*.45));if(v>(d[k]||0))d[k]=v}
  const nz=g("Nose.Cone")>=2?.8:g("Nose.Tip")>=2?.5:Math.min(.4,(g("Nose.Tip")+g("Nose.Cone"))*.2);if(nz>(d.nose||0))d.nose=nz;
  const rw=g("RearWing.MainPlane")>=2?.9:g("RearWing.Flap")>=2?.65:Math.min(.5,(g("RearWing.MainPlane")+g("RearWing.Flap"))*.25);if(rw>(d.rwing||0))d.rwing=rw;
  let fl=0;for(const id of["Floor.EdgeWing.E","Floor.EdgeWing.D","Floor.EdgeFin.E","Floor.EdgeFin.D","Diffuser.Ramp","Floor.Plank"])fl+=Math.min(2,g(id))*.06;if(fl>(d.floor||0))d.floor=Math.min(1,fl);if(typeof dmgSync==="function")dmgSync(c)}
// desempenho → visual: o que a física quebrou (asa, bico, roda arrancada, assoalho) aparece quebrado
function d3DaFisica(c){const M=d3Meta(),pd=d3Estado(c);if(!pd||!c.dmg)return;const d=c.dmg,set=(id,v)=>{const i=M.idx[id];if(i==null)return;if(v>=2)d3Solta(c,i,{});else if(v>pd[i])pd[i]=Math.min(v,D3.SOLTA-.01)};
  for(const[L,k]of[["E","wingL"],["D","wingR"]]){const v=d[k]||0;if(v>=.6)set("FrontWing.MainPlane."+L,2);else if(v>=.4){set("FrontWing.Flap1."+L,2)}else if(v>.05)for(const p of["MainPlane","Flap1","Flap2","Endplate"])set(`FrontWing.${p}.${L}`,v*1.6)}
  if((d.nose||0)>=.7)set("Nose.Cone",2);else if((d.nose||0)>=.5)set("Nose.Tip",2);else if(d.nose>.05){set("Nose.Tip",d.nose*1.8);set("Nose.Cone",d.nose)}
  if((d.rwing||0)>=.85)set("RearWing.MainPlane",2);else if((d.rwing||0)>=.6)set("RearWing.Flap",2);else if(d.rwing>.05){set("RearWing.Flap",d.rwing*1.5);set("RearWing.MainPlane",d.rwing)}
  if(d.floor>.05)for(const id of["Floor.EdgeWing.E","Floor.EdgeWing.D","Floor.EdgeFin.E","Floor.EdgeFin.D","Diffuser.Ramp"])set(id,d.floor*1.4);
  if(d.side>.05)for(const id of["Sidepods.E.Body","Sidepods.D.Body"])set(id,d.side*1.2);
  const W=["FrontLeft","FrontRight","RearLeft","RearRight"],wh=d.whl||[];for(let i=0;i<4;i++){const v=wh[i]||0;if(v>.97){set(`Wheels.${W[i]}.Tyre`,2);for(const s of["UpperWishbone","LowerWishbone","TrackRod","Pushrod","ToeLink","Pullrod"])set(`Suspension.${W[i]}.${s}`,1.5)}else if(v>.2)for(const s of["UpperWishbone","LowerWishbone","TrackRod","Pushrod","ToeLink","Pullrod"])set(`Suspension.${W[i]}.${s}`,v)}}
// no box: o que os mecânicos trocaram volta inteiro (bico e asa dianteira novos, asa traseira, assoalho)
function d3Conserta(c){const M=d3Meta(),pd=c.pd;if(!M||!pd||!c.dmg)return;const d=c.dmg,zera=pre=>{for(const p of M.lista)if(p.id.startsWith(pre))pd[p.i]=0};
  if(!(d.nose>0)&&!(d.wingL>0)&&!(d.wingR>0)){zera("FrontWing.");zera("Nose.")}if(!(d.rwing>0))zera("RearWing.");if(!(d.floor>0)){zera("Floor.");zera("Diffuser.")}}
// para o desenho: estado de cada peça (vec4 × 30)
const D3_ZERO=new Float32Array(120);
function d3Uniforme(c){const pd=c&&c.pd;if(!pd)return D3_ZERO;const o=c._pdU||(c._pdU=new Float32Array(120));o.set(pd.subarray(0,Math.min(120,pd.length)));return o}
// lista legível (para o rádio, a tela do carro e os testes)
function d3Resumo(c){const M=d3Meta(),pd=c&&c.pd;if(!M||!pd)return{soltas:[],amassadas:[]};const s=[],a=[];for(const p of M.lista){if(pd[p.i]>=2)s.push(p.id);else if(pd[p.i]>.15)a.push(p.id)}return{soltas:s,amassadas:a}}
