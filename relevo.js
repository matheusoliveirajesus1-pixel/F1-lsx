// ===================== RELEVO: SUBIDAS, DESCIDAS, INCLINAÇÃO LATERAL E ONDULAÇÕES =====================
// A pista deixa de ser plana. Para cada circuito há:
//  z     altura ao longo da volta [fração da volta, metros acima da linha de chegada], ancorada nas curvas do traçado
//  bank  curvas com inclinação lateral [fração inicial, fração final, graus] (o lado de dentro da curva fica mais baixo)
//  bump  ondulação do asfalto (0 = liso, 1 = muito ondulado), com trechos piores [f0, f1, nível]
//  alt   altitude do circuito em metros (o ar fica mais fino em cima: menos asa e menos arrasto; México é o extremo)
// Os perfis foram montados pelo que se sabe publicamente de cada pista (a descida para a Eau Rouge e a subida do Raidillon,
// o S do Senna descendo e a Subida dos Boxes, a subida da curva 1 de Austin, a escalada de Mônaco até o Cassino, as curvas
// inclinadas de Zandvoort). São aproximações de alguns metros, não levantamento topográfico.
//
// O que isso muda no carro (physics.js e dyn.js):
//  - subida segura a aceleração e ajuda a frear; descida faz o contrário (g·senθ)
//  - compressão (fundo de vale, Eau Rouge) aperta o carro no chão: mais carga, mais aderência; crista (topo do Raidillon,
//    curva 1 de Austin) alivia: o carro fica leve e perde aderência bem onde o piloto quer frear ou virar
//  - curva inclinada: parte da força para fazer a curva vem da gravidade, e o pneu é mais carregado (Hugenholtz, Arie Luyendyk)
//  - ondulação: a carga no pneu oscila e a aderência média cai um pouco
//  - altitude: densidade do ar menor (México ~23% menos asa e arrasto)
const RELEVO={
  spa:{alt:410,bump:.2,z:[[0,0],[.035,2],[.09,-18],[.142,-35],[.163,-14],[.185,2],[.26,28],[.326,45],[.36,40],[.415,22],[.449,12],[.522,-10],[.557,-16],[.621,-26],[.649,-34],[.689,-48],[.718,-52],[.765,-44],[.814,-32],[.868,-18],[.92,-8],[.952,-4],[1,0]]},
  interlagos:{alt:790,bump:.5,z:[[0,0],[.06,-6],[.097,-12],[.14,-16],[.22,-22],[.32,-28],[.362,-30],[.42,-26],[.461,-22],[.492,-18],[.536,-20],[.6,-22],[.634,-24],[.671,-32],[.75,-37],[.782,-30],[.849,-13],[.891,-4],[.921,2],[1,0]]},
  austin:{alt:160,bump:.6,z:[[0,0],[.03,12],[.062,28],[.085,22],[.115,12],[.189,4],[.254,2],[.338,-2],[.411,-6],[.52,-4],[.628,-2],[.67,0],[.722,0],[.779,2],[.819,2],[.859,0],[.914,-2],[1,0]],
    bu:[[.6,.75,1],[.0,.07,.8]]},
  spielberg:{alt:680,bump:.2,z:[[0,0],[.04,5],[.076,14],[.15,26],[.294,38],[.38,24],[.482,12],[.55,10],[.606,8],[.671,6],[.75,4],[.842,2],[.896,-2],[.95,-2],[1,0]]},
  suzuka:{alt:40,bump:.2,z:[[0,0],[.06,-3],[.104,-5],[.15,-1],[.196,4],[.237,9],[.267,16],[.304,20],[.355,22],[.384,20],[.462,12],[.509,14],[.586,10],[.617,8],[.644,8],[.719,10],[.815,3],[.889,-2],[1,0]]},
  monaco:{alt:20,bump:.6,z:[[0,0],[.076,1],[.12,10],[.162,20],[.242,38],[.282,41],[.353,30],[.392,20],[.444,5],[.507,3],[.55,1],[.65,0],[.727,0],[.773,0],[.89,0],[1,0]]},
  barcelona:{alt:120,bump:.2,z:[[0,0],[.08,-2],[.153,-4],[.223,0],[.338,-6],[.434,-12],[.489,-10],[.521,-6],[.597,6],[.66,0],[.724,-8],[.778,-4],[.802,0],[.854,4],[.918,3],[1,0]]},
  budapest:{alt:250,bump:.3,z:[[0,0],[.083,-10],[.132,-12],[.19,-14],[.241,-10],[.3,-2],[.352,4],[.405,2],[.482,-4],[.561,-2],[.654,2],[.744,-2],[.874,-4],[1,0]]},
  zandvoort:{alt:5,bump:.3,z:[[0,0],[.103,-2],[.177,0],[.216,2],[.306,8],[.349,4],[.417,-2],[.492,0],[.546,2],[.601,4],[.745,2],[.845,6],[.911,3],[1,0]],
    bank:[[.195,.24,19],[.88,.955,18]]},
  silverstone:{alt:150,bump:.3,z:[[0,0],[.053,-1],[.136,-3],[.325,-4],[.346,-4],[.418,-2],[.508,1],[.615,3],[.695,2],[.853,-1],[.963,0],[1,0]]},
  monza:{alt:180,bump:.3,z:[[0,0],[.114,-1],[.227,1],[.394,2],[.445,1],[.63,-1],[.836,0],[1,0]],bank:[[.815,.86,2]],bu:[[.38,.46,.7],[.82,.87,.6]]},
  mexico:{alt:2240,bump:.5,z:[[0,0],[.269,2],[.481,-1],[.637,1],[.745,2],[.879,0],[1,0]],bank:[[.94,.985,3]]},
  baku:{alt:0,bump:.5,z:[[0,0],[.335,0],[.4,2],[.434,8],[.463,16],[.53,22],[.566,18],[.605,12],[.664,6],[.738,1],[1,0]]},
  madrid:{alt:650,bump:.3,z:[[0,0],[.237,-3],[.37,-6],[.48,-4],[.6,2],[.692,4],[.771,0],[.866,-2],[1,0]],bank:[[.66,.72,13]]},
  melbourne:{alt:10,bump:.3,z:[[0,0],[.202,1],[.353,2],[.489,1],[.625,0],[.776,-1],[1,0]]},
  shanghai:{alt:5,bump:.2,z:[[0,0],[.024,2],[.075,0],[.219,-1],[.396,1],[.55,0],[.809,-1],[1,0]]},
  miami:{alt:2,bump:.4,z:[[0,0],[.207,1],[.455,0],[.58,2],[.637,1],[.881,-2],[.956,-1],[1,0]]},
  montreal:{alt:15,bump:.4,z:[[0,0],[.121,1],[.333,0],[.506,-1],[.665,0],[.94,1],[1,0]]},
  singapura:{alt:15,bump:.5,z:[[0,0],[.245,1],[.46,0],[.661,1],[.83,0],[1,0]]},
  lasvegas:{alt:610,bump:.4,z:[[0,0],[.229,1],[.412,0],[.496,1],[.81,0],[1,0]]},
  lusail:{alt:10,bump:.15,z:[[0,0],[.193,2],[.43,4],[.573,2],[.723,1],[1,0]]},
  abudhabi:{alt:5,bump:.15,z:[[0,0],[.136,2],[.478,1],[.752,-1],[.903,0],[1,0]]}};
// curvas com perfil mais detalhado (o resto tem só as variações principais)
const RELEVO_DETALHE=["spa","interlagos","austin","spielberg","suzuka","monaco","barcelona","budapest","zandvoort","baku"];

// interpolação monótona (PCHIP) pelos pontos: inclinação contínua, sem passar do valor dos pontos
function relPchip(P,f){const n=P.length;let i=0;while(i<n-2&&P[i+1][0]<f)i++;const x0=P[i][0],x1=P[i+1][0],y0=P[i][1],y1=P[i+1][1],h=x1-x0||1e-9,t=(f-x0)/h;
  const sl=j=>{if(j<=0||j>=n-1){// pista fechada: o primeiro e o último ponto são o mesmo lugar
      const a=P[n-2],b=P[1],d0=(P[n-1][1]-a[1])/(1-a[0]),d1=(b[1]-P[0][1])/(b[0]);return d0*d1<=0?0:2/(1/d0+1/d1)}
    const d0=(P[j][1]-P[j-1][1])/(P[j][0]-P[j-1][0]),d1=(P[j+1][1]-P[j][1])/(P[j+1][0]-P[j][0]);return d0*d1<=0?0:2/(1/d0+1/d1)};
  const m0=sl(i)*h,m1=sl(i+1)*h,t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*y0+(t3-2*t2+t)*m0+(-2*t3+3*t2)*y1+(t3-t2)*m1}

// monta as tabelas por índice do traçado (feito uma vez por pista e guardado no próprio traçado)
//  z (m), sn = seno da rampa (+ subida), kv = curvatura vertical (1/m, + vale/compressão, − crista), ph = inclinação lateral (rad, + a gravidade
//  empurra para +y, a esquerda), bu = ondulação (0..1), rho = fator da densidade do ar
function relevoGeo(geo){if(!geo||!geo.N)return null;if(geo._rel)return geo._rel;const N=geo.N,len=geo.len||N*DS,id=geo.id,D=RELEVO[id],street=!!(geo.C&&geo.C.street);
  const z=new Float32Array(N);
  if(D&&D.z)for(let i=0;i<N;i++)z[i]=relPchip(D.z,i/N);
  else if(!street)for(let i=0;i<N;i++){const f=i/N;z[i]=1.6*Math.sin(f*6.283*2+.7)+1.1*Math.sin(f*6.283*5+1.9)}// circuitos sem perfil: ondulação suave
  // suaviza ~40 m (nenhuma rampa muda de inclinação de um metro para o outro)
  const sm=(a,R)=>{const o=new Float32Array(N);let s=0;for(let k=-R;k<=R;k++)s+=a[((k%N)+N)%N];for(let i=0;i<N;i++){o[i]=s/(2*R+1);s+=a[(i+R+1)%N]-a[((i-R)%N+N)%N]}return o};
  const zs=sm(sm(z,5),5);
  const sn=new Float32Array(N),kv=new Float32Array(N);const h=3;
  for(let i=0;i<N;i++){const a=zs[(i-h+N)%N],b=zs[(i+h)%N],c=zs[i];sn[i]=Math.max(-.25,Math.min(.25,(b-a)/(2*h*DS)));kv[i]=(a+b-2*c)/((h*DS)*(h*DS))}
  const kvs=sm(kv,4);for(let i=0;i<N;i++)kvs[i]=.6*Math.max(-1/320,Math.min(1/320,kvs[i]));// a suspensão e os pneus filtram: nada mais apertado que ~320 m de raio,
  // e só ~60% da carga extra vira aderência (a suspensão comprime, o assoalho encosta, o pneu rende menos com carga alta)
  // inclinação lateral: entra e sai em ~30 m, para o lado de dentro da curva
  const ph=new Float32Array(N);
  if(D&&D.bank)for(const[f0,f1,deg]of D.bank){const i0=Math.round(f0*N),i1=Math.round(f1*N);let s=0;for(let i=i0;i<=i1;i++)s+=geo.kc?geo.kc[((i%N)+N)%N]:0;const sg=Math.sign(s)||1,ramp=Math.max(2,Math.round(30/DS));
    for(let i=i0-ramp;i<=i1+ramp;i++){const t=i<i0?(i-(i0-ramp))/ramp:i>i1?((i1+ramp)-i)/ramp:1,u=t*t*(3-2*t);const q=((i%N)+N)%N;ph[q]=sg*deg*Math.PI/180*u}}
  const bu=new Float32Array(N).fill(D?(D.bump||0):street?.4:.2);
  if(D&&D.bu)for(const[f0,f1,l]of D.bu)for(let i=Math.round(f0*N);i<=Math.round(f1*N);i++)bu[((i%N)+N)%N]=Math.max(bu[((i%N)+N)%N],l);
  const alt=D&&D.alt||0,rho=Math.exp(-alt/8400);
  return geo._rel={z,zs,sn,kv:kvs,ph,bu,rho,alt,id,detalhe:RELEVO_DETALHE.includes(id)}}
// valores num ponto da volta (interpolados entre os pontos do traçado)
function relevoAt(geo,f){const T=relevoGeo(geo);if(!T)return null;const N=geo.N,x=fr(f)*N,i=Math.floor(x)%N,j=(i+1)%N,k=x-Math.floor(x);
  return{z:T.zs[i]+(T.zs[j]-T.zs[i])*k,sn:T.sn[i]+(T.sn[j]-T.sn[i])*k,kv:T.kv[i]+(T.kv[j]-T.kv[i])*k,ph:T.ph[i]+(T.ph[j]-T.ph[i])*k,bu:T.bu[i]}}
// densidade do ar da pista (fator sobre PH.rho)
function relRho(geo){const T=relevoGeo(geo);return T?T.rho:1}
// aceleração "normal" (para o chão) por unidade de massa sem a asa: gravidade pela rampa e pela inclinação, mais a compressão/crista
function relGn(r,v){if(!r)return PH.g;return Math.max(PH.g*.35,PH.g*Math.cos(Math.asin(r.sn))*Math.cos(r.ph)+v*v*r.kv)}
// ondulação: a carga oscila e a aderência média cai um pouco (mais em alta)
function relBumpK(r,v){return r?1-.03*r.bu*Math.min(1,v/70):1}
