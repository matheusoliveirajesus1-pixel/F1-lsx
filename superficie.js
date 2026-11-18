// ===================== MAPA DE SUPERFÍCIES =====================
// Cada pista tem um mapa do que existe em cada lugar: pista, zebra, grama, brita, asfalto de escape e pit lane.
// O mapa é montado a partir do MESMO cenário que a tela desenha (zebras, caixas de brita, áreas de escape e muros de scene.js/render.js):
// onde você vê brita, o carro sente brita. Cada roda lê a superfície em que está; a física (dyn.js) usa as quatro.
//
// Coordenadas: índice do traçado (i, a cada DS metros) e afastamento lateral em metros (+ = esquerda), como no resto do jogo.
// Por índice e por lado guardamos faixas: zebra, caixa (brita ou asfalto de escape), pit lane e muro. Fora delas: grama
// (circuito permanente) ou calçada/asfalto (circuito de rua).
//
// Comportamento de cada material (k = aderência relativa à pista seca; arrasto em m/s² de desaceleração; suja = quanto
// a borracha pega de terra/grama e perde aderência nas curvas seguintes; vib = trepidação, para som e desenho):
const SUP_MAT={
  pista:  {n:"Pista",            k:1,   drag:0,   suja:0,   vib:0,   molhado:1},
  zebra:  {n:"Zebra",            k:.93, drag:.5,  suja:0,   vib:.35, molhado:.72},// pintura lisa: na chuva escorrega muito
  asfalto:{n:"Asfalto de escape",k:.95, drag:0,   suja:.15, vib:.05, molhado:.95},// asfalto mais áspero e sujo (fora da linha)
  pit:    {n:"Pit lane",         k:.97, drag:0,   suja:0,   vib:0,   molhado:1},
  calcada:{n:"Calçada",          k:.85, drag:.4,  suja:.2,  vib:.25, molhado:.85},
  grama:  {n:"Grama",            k:.5,  drag:2.8, suja:.6,  vib:.5,  molhado:.6},// grama molhada quase não segura
  brita:  {n:"Brita",            k:.42, drag:9,   suja:1,   vib:1,   molhado:.95,atola:1}};
const SUP_KERB=[6.05,7.65];
const SUP_BORDA=.3;// a linha branca é pintada no asfalto: ainda há ~30 cm de asfalto depois dela antes da grama// faixa lateral da zebra (m do centro): a mesma do desenho 3D (TW − 0,55 m ± 0,8 m)
// ---------- montagem do mapa a partir do cenário
function supBuild(TG){if(!TG||!TG.scn||!TG.M)return null;const M=TG.M,S=TG.scn,street=!!(TG.geo&&TG.geo.C&&TG.geo.C.street),mW=1/WS;
  const lado=()=>({kerb:new Uint8Array(M),g0:new Float32Array(M).fill(NaN),g1:new Float32Array(M).fill(NaN),gm:new Uint8Array(M),p0:new Float32Array(M).fill(NaN),p1:new Float32Array(M).fill(NaN),wall:new Float32Array(M).fill(99)});
  const L={1:lado(),[-1]:lado()};const W=i=>((i%M)+M)%M;
  // zebras: os mesmos trechos que o desenho pinta
  for(const k of S.kerbs||[]){const o=L[k.s>0?1:-1];for(let q=k.a;q<k.b;q++)o.kerb[W(q)]=1}
  // caixas: brita ou asfalto de escape (a mesma forma do polígono desenhado: borda de dentro e de fora em cada índice)
  const MATI=["brita","asfalto"];
  for(const gr of TG.gravel||[]){const o=L[gr.o>0?1:-1],a=S.wl[gr.o>0?1:-1],sp=gr.i-gr.i0-2,mat=gr.ro==="brita"&&!street?0:1;
    /* bordas do polígono desenhado (scene.js), já cortadas por muro, pit lane, prédios e água */if(gr.faixa){for(const[ii,a0,a1]of gr.faixa){if(a1<=a0+.2*WS)continue;const i=W(ii),g0=a0*mW,g1=a1*mW;const novo=isNaN(o.g0[i]);if(novo||g0<o.g0[i])o.g0[i]=g0;if(novo||g1>o.g1[i])o.g1[i]=g1;o.gm[i]=novo?mat:(o.gm[i]===0||mat===0?0:1)}continue}
    for(let k=-sp;k<=sp+6;k++){const i=W(gr.i+k),lim=a?a[i]-.6*WS:1e9,w=Math.abs(k-3)<sp*.6?(street?30:80):(street?26:52);
      const g0=Math.min(TW+3.5*WS,lim)*mW,g1=Math.max(TW+.5*WS,Math.min(TW+(w-17)*WS/2.3,lim))*mW;
      const novo=isNaN(o.g0[i]);if(novo||g0<o.g0[i])o.g0[i]=g0;if(novo||g1>o.g1[i])o.g1[i]=g1;o.gm[i]=novo?mat:(o.gm[i]===0||mat===0?0:1)}}
  // muro (o mesmo que a física usa para bater)
  for(const sg of[1,-1]){const a=S.wl[sg];if(a)for(let i=0;i<M;i++)L[sg].wall[i]=a[i]*mW}
  // pit lane: faixa de asfalto em volta do desenho da pit lane (largura do traço da tela: 30 U)
  if(TG.pit&&TG.pit.length&&TG.pl){const iE=Math.round(TG.pl.fe*M),n=TG.pit.length,hw=15*U*mW;
    for(let k=0;k<n;k++){const i=W(iE+k),p=TG.path[i],h=TG.heading[i],q=TG.pit[k];const lat=((q.x-p.x)*-Math.sin(h)+(q.y-p.y)*Math.cos(h))*mW,o=L[lat>=0?1:-1],a=Math.abs(lat);
      o.p0[i]=Math.max(0,a-hw);o.p1[i]=a+hw}}
  return{M,L,street,id:TG.id}}
function supMapa(){const TG=typeof TRACKGEO!=="undefined"?TRACKGEO:null;if(!TG)return null;if(TG._sup===undefined||TG._supScn!==TG.scn){TG._sup=supBuild(TG);TG._supScn=TG.scn}return TG._sup}
// material num ponto: f = fração da volta (prog), lat = afastamento lateral em metros (+ esquerda)
function supAt(f,lat){const S=supMapa(),a=Math.abs(lat);if(!S){return a<=TRK_H?"pista":"grama"}
  const x=fr(f)*S.M,i=Math.floor(x+1e-6)%S.M,o=S.L[lat>=0?1:-1];
  if(o.kerb[i]&&a>=SUP_KERB[0]&&a<=SUP_KERB[1])return"zebra";
  if(a<=TRK_H+SUP_BORDA)return"pista";
  if(!isNaN(o.p0[i])&&a>=o.p0[i]&&a<=o.p1[i])return"pit";
  if(!isNaN(o.g0[i])&&a>=o.g0[i]&&a<=o.g1[i])return o.gm[i]===0?"brita":"asfalto";
  return S.street?"calcada":"grama"}
// propriedades efetivas de um material com a pista molhada (w de 0 a 1)
function supProp(nome,w){const m=SUP_MAT[nome]||SUP_MAT.pista;if(!w)return m;const k=m.k*(1-(1-m.molhado)*Math.min(1,w*1.4));return{...m,k}}
// posição de cada roda (frente esq., frente dir., trás esq., trás dir.) em (prog, lateral), pelo ângulo da carroceria em relação à pista
const SUP_RODAS=[[1.75,.8],[1.75,-.8],[-1.65,.82],[-1.65,-.82]];
function supRodas(c){const L=R.geo.len,ps=c.psi||0,co=Math.cos(ps),si=Math.sin(ps),y=c.y||0,out=[];
  for(const[u,v]of SUP_RODAS)out.push(supAt(c.prog+(u*co-v*si)/L,y+u*si+v*co));return out}
// ---------- os pilotos usam a zebra baixa: onde a linha de corrida encosta na borda e há zebra daquele lado,
// a linha vai ~0,4 m mais para fora (o pneu de fora sobe na zebra, sem passar dela). Feito uma vez por pista.
function supZebraNaLinha(geo){const S=supMapa();if(!S||!geo||!geo.line||geo._zebraLinha)return;geo._zebraLinha=1;const N=geo.N,M=S.M,ln=geo.line,add=new Float32Array(N);
  for(let i=0;i<N;i++){const l=ln[i];if(Math.abs(l)<5.4)continue;const sg=l>0?1:-1,q=Math.floor(i/N*M)%M;if(S.L[sg].kerb[q])add[i]=sg*Math.min(.45,(Math.abs(l)-5.4)*.6)}
  // suaviza para a linha entrar e sair da zebra sem degrau
  for(let p=0;p<3;p++){const c=Float32Array.from(add);for(let i=0;i<N;i++)add[i]=(c[(i-1+N)%N]+2*c[i]+c[(i+1)%N])/4}
  for(let i=0;i<N;i++)ln[i]+=add[i]}
// limite lateral do piloto naquele ponto: com zebra, a roda de fora pode ficar sobre ela; sem zebra, para na linha branca
function supLimY(f,sg){const S=supMapa();if(!S)return TRK_H-.95;const q=Math.floor(fr(f)*S.M+1e-6)%S.M;return S.L[sg>=0?1:-1].kerb[q]?TRK_H-.75:TRK_H-.95}
