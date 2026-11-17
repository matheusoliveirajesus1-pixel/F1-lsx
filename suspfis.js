// ===================== SUSPENSÃO FÍSICA: MOLAS, AMORTECEDORES E O CHÃO SOB CADA RODA =====================
// A carga em cada pneu não é mais só a média (peso + asa + transferência na curva e na freada): o carro é um corpo
// sobre quatro molas e amortecedores (pneu e mola em série), que sobe, desce, arfa e rola com o que está sob cada roda:
//  - zebra: degrau de ~2 cm na entrada e as "ondinhas" pintadas; zebra alta na saída da curva sacode o carro
//  - ondulação do asfalto (relevo.js, "bump"): cada pista tem a sua; Austin, Mônaco, Baku e Singapura são as piores
//  - grama e brita: chão irregular
// A carga que oscila rende menos aderência na média (o pneu perde rendimento com carga alta mais do que ganha com carga
// baixa), e uma roda que chega a sair do chão não segura nada naquele instante. O efeito vai para a capacidade de cada
// eixo no núcleo de dinâmica (dyn.js, dynLoad) e para o desenho 3D da suspensão (carro3d.js).
// Rodas: 0 dianteira esq., 1 dianteira dir., 2 traseira esq., 3 traseira dir. (esquerda = +y)
const SUSF={
  KM:[2.2e5,2.2e5,1.8e5,1.8e5],// mola (N/m) por roda (taxa na roda)
  KT:2.8e5,// pneu (N/m), em série com a mola
  ZETA:.38,// amortecimento (fração do crítico)
  M:800,IP:1150,IR:190,// massa, inércia de arfagem e de rolagem (kg, kg·m²)
  X:[1.75,1.75,-1.65,-1.65],Y:[.8,-.8,.8,-.8],// posição das rodas em relação ao centro (m)
  ZEBRA:.02,ONDA:.003,ONDA_L:1.25,// altura da zebra, das ondinhas pintadas (m) e o espaço entre elas
  BUMP:.0035,// amplitude da ondulação do asfalto com bump = 1 (m)
  GRAMA:.008,BRITA:.013,// irregularidade fora da pista (m)
  H:.004// passo interno de integração (s)
};
// altura do chão (m) sob uma roda: s = distância percorrida na volta (m), lat = afastamento lateral (m), mat = material
function susChao(s,lat,mat,bu){const S=SUSF;let z=0;
  if(bu>0)z+=bu*S.BUMP*(Math.sin(s/7.3*6.283+lat*.9)+.6*Math.sin(s/3.1*6.283+1.7+lat*.55)+.45*Math.sin(s/13.7*6.283+.3+lat*.2));
  if(mat==="zebra")z+=S.ZEBRA+S.ONDA*Math.max(0,Math.sin(s/S.ONDA_L*6.283));
  else if(mat==="grama")z+=S.GRAMA*(Math.sin(s*2.9+lat*3.1)*.6+Math.sin(s*7.7+lat*1.3)*.4);
  else if(mat==="brita")z+=S.BRITA*(Math.sin(s*5.3+lat*4.1)*.6+Math.sin(s*11.9+lat*2.7)*.4);
  else if(mat==="calcada")z+=.03;
  return z}
// estado por carro: corpo (z, arfagem th, rolagem ph) e velocidades; entrada filtrada em cada roda; carga extra em cada roda
function susInit(c){return c._sus={z:0,th:0,ph:0,vz:0,vth:0,vph:0,r:[0,0,0,0],dF:[0,0,0,0],no:[false,false,false,false],pico:0}}
// um passo da dinâmica (dt do núcleo); fz0 = cargas "em regime" de cada roda (N), para saber quando uma roda sai do chão
function susPasso(c,dt,v,fz0){const S=SUSF,st=c._sus||susInit(c);if(c.pit||!R||!R.geo){st.dF=[0,0,0,0];st.no=[false,false,false,false];return st}
  const L=R.geo.len,ps=c.psi||0,co=Math.cos(ps),si=Math.sin(ps),y=c.y||0,sw=c._sw||["pista","pista","pista","pista"],bu=c._rel?c._rel.bu:0;
  const n=Math.max(1,Math.ceil(dt/S.H)),h=dt/n,s0=fr(c.prog||0)*L,tau=Math.max(.004,.4/Math.max(v,5));// contato do pneu e borracha (~40 cm) suaviza o degrau
  const kE=S.KM.map(k=>1/(1/k+1/S.KT)),cE=kE.map((k,i)=>2*S.ZETA*Math.sqrt(k*S.M/4));
  let pico=0;
  for(let it=0;it<n;it++){const sd=s0+v*h*(it+1-n);// posição no fim deste subpasso (o carro já andou no núcleo)
    const F=[0,0,0,0];
    for(let i=0;i<4;i++){const u=S.X[i],w=S.Y[i];const alvo=susChao(sd+u*co-w*si,y+u*si+w*co,sw[i],bu);const dr=(alvo-st.r[i])*Math.min(1,h/tau);st.r[i]+=dr;
      const zb=st.z+S.X[i]*st.th+S.Y[i]*st.ph,vb=st.vz+S.X[i]*st.vth+S.Y[i]*st.vph;
      let f=kE[i]*(st.r[i]-zb)+cE[i]*(dr/h-vb);
      // a roda não puxa o carro para baixo: no máximo, sai do chão (carga total zero)
      const base=fz0?fz0[i]:S.M*9.81/4;st.no[i]=f<-base;if(f<-base)f=-base;F[i]=f;pico=Math.max(pico,Math.abs(f))}
    const Fz=F[0]+F[1]+F[2]+F[3],My=S.X[0]*(F[0]+F[1])+S.X[2]*(F[2]+F[3]),Mx=S.Y[0]*(F[0]+F[2])+S.Y[1]*(F[1]+F[3]);
    st.vz+=Fz/S.M*h;st.vth+=My/S.IP*h;st.vph+=Mx/S.IR*h;st.z+=st.vz*h;st.th+=st.vth*h;st.ph+=st.vph*h;st.dF=F}
  st.pico=pico;return st}
// cargas "em regime" de cada roda (N) a partir do eixo (Ff, Fr) e da transferência lateral (dF, dR) com o sinal da curva
function susCargas(Ff,Fr,dF,dR,ay){const s=ay>=0?-1:1;// curva para a esquerda (ay>0): carrega as rodas da direita
  return[Ff/2+s*dF,Ff/2-s*dF,Fr/2+s*dR,Fr/2-s*dR]}
