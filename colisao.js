// ===================== COLISÃO ENTRE CARROS: CORPOS RÍGIDOS =====================
// Antes, num toque o jogo tirava a média das velocidades (o carro da frente "ganhava" velocidade do nada e saía como
// catapulta) e a rodada vinha de um sorteio. Agora cada carro é uma caixa com massa e inércia de giro, e o choque é
// resolvido no ponto exato do contato, como num motor de física de jogo:
//  - impulso na direção do contato, com um pouco de quique (fibra de carbono e pneu quicam pouco) e atrito na direção
//    do raspão: a quantidade de movimento dos dois carros se conserva
//  - o impulso fora do centro gira cada carro conforme o braço de alavanca (toque na quina traseira = rodada; de raspão
//    na lateral = só um tranco)
//  - a sobreposição que sobrar é desfeita aos poucos, sem salto no desenho
// O método é o de impulsos sequenciais do Box2D Lite (Erin Catto, github.com/erincatto/box2d-lite, licença zlib),
// reescrito para as coordenadas da pista do jogo (s ao longo da pista, y lateral, + = esquerda).
const COLI={
  E_CORPO:.12,// coeficiente de restituição carroceria contra carroceria
  E_RODA:.2,// pneu contra pneu quica mais
  MU:.3,// atrito no contato (carbono raspando)
  MU_RODA:.3,// pneu raspando em pneu (as duas rodas girando: escorregam uma na outra)
  SEP:.12,// separação máxima por passo (m)
  WMAX:6,// giro máximo que um toque pode dar (rad/s)
  GIRO_RODA:2.6// acima deste giro (rad/s) depois do toque, os pneus não seguram: rodada
};
// caixa de um carro: centro (s, y), rumo da carroceria (psi em relação à pista), meias medidas
function colCaixa(c,s){const ps=c.psi||0;return{s,y:c.y||0,ps,co:Math.cos(ps),si:Math.sin(ps),hl:CARL/2,hw:CARW/2}}
function colCantos(b){const o=[];for(const[a,w]of[[1,1],[1,-1],[-1,-1],[-1,1]])o.push([b.s+a*b.hl*b.co-w*b.hw*b.si,b.y+a*b.hl*b.si+w*b.hw*b.co]);return o}
// teste de eixos separadores (SAT) entre duas caixas giradas: devolve a menor sobreposição e a normal (de A para B)
function colSAT(A,B,rel){const ax=[[A.co,A.si],[-A.si,A.co],[B.co,B.si],[-B.si,B.co]],cA=colCantos(A),cB=colCantos(B);let best=1e9,n=null,bestOv=0;
  for(const u of ax){let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;for(const p of cA){const q=p[0]*u[0]+p[1]*u[1];a0=Math.min(a0,q);a1=Math.max(a1,q)}for(const p of cB){const q=p[0]*u[0]+p[1]*u[1];b0=Math.min(b0,q);b1=Math.max(b1,q)}
    const ov=Math.min(a1,b1)-Math.max(a0,b0);if(ov<=0)return null;const d=(B.s-A.s)*u[0]+(B.y-A.y)*u[1],nu=d>=0?u:[-u[0],-u[1]];
    // eixo do choque: o que entrou em contato por último (sobreposição ÷ velocidade de aproximação naquele eixo); sem velocidade, o de menor sobreposição
    const ap=rel?-(rel[0]*nu[0]+rel[1]*nu[1]):0,score=ap>.3?ov/ap:1e3+ov;if(score<best){best=score;n=nu;bestOv=ov}}
  // ponto de contato: média dos cantos de cada caixa que estão dentro da outra (quina que entrou); sem nenhum, o meio
  const dentro=(p,b)=>{const ds=p[0]-b.s,dy=p[1]-b.y,l=ds*b.co+dy*b.si,w=-ds*b.si+dy*b.co;return Math.abs(l)<=b.hl+.02&&Math.abs(w)<=b.hw+.02};
  const pts=[...cA.filter(p=>dentro(p,B)),...cB.filter(p=>dentro(p,A))];let pt;if(pts.length){pt=[0,0];for(const p of pts){pt[0]+=p[0];pt[1]+=p[1]}pt[0]/=pts.length;pt[1]/=pts.length}else pt=[(A.s+B.s)/2,(A.y+B.y)/2];
  return{pen:bestOv,n,pt}}
// estado de movimento de um carro no plano da pista: velocidade (vs, vy), giro w
function colMov(c){const d=c.dyn||{},v=c.v||0,ch=d.chi||0;return{vs:v*Math.cos(ch),vy:v*Math.sin(ch),w:d.spin?(d.r||0):(d.wz!=null?d.wz:0)}}
function colMassa(c){const m=((c.ph&&c.ph.mass)||PH.mass)+((c.fuel||0)*.75);return{m,I:m*BICI.K2}}
// devolve o movimento corrigido ao núcleo de dinâmica: a carroceria não muda de rumo no instante do choque (o giro vem depois)
function colAplica(c,vs,vy,dw){if(!c.dyn)dynInit(c);const d=c.dyn,psi=c.psi||0;const v=Math.hypot(vs,vy);c.v=Math.max(0,v);
  if(v>.3){d.chi=clamp(Math.atan2(vy,Math.max(-v,vs)),-2.6,2.6);d.beta=psi-d.chi}c.vy=c.v*Math.sin(d.chi);
  if(dw){// o contato dura alguns centésimos: a carroceria já gira um pouco nele
    d.beta+=dw*.035;c.psi=(c.psi||0)+dw*.035;
    if(d.spin)d.r=clamp((d.r||0)+dw,-COLI.WMAX,COLI.WMAX);
    else{const w=(d.wz||0)+dw;// giro maior do que os pneus conseguem segurar (~50 rad/s² por alguns centésimos): o carro está rodando
      if(Math.abs(w)>COLI.GIRO_RODA&&c.v>6){d.spin=true;d.nSpin=(d.nSpin||0)+1;d.spinT=R.t;d.r=clamp(w,-COLI.WMAX,COLI.WMAX);d.wz=null;if(typeof exStatus==="function")exStatus(c,"spin",{dir:Math.sign(w),cause:"toque"})}
      else d.wz=clamp(w,-3.4,3.4)}}}
// resolve o contato entre a e b (ds = posição de b menos a, ao longo da pista, já sem a volta). Devolve null se não encostam.
function colResolve(a,b,ds,dt){const A=colCaixa(a,0),B=colCaixa(b,ds),ma=colMov(a),mb=colMov(b);
  // detecção um passo à frente: se pela velocidade relativa vão se tocar antes do próximo passo, já conta (sem atravessar)
  const rel=[mb.vs-ma.vs,mb.vy-ma.vy];let h=colSAT(A,B,rel);if(!h){const B2={...B,s:B.s+rel[0]*dt,y:B.y+rel[1]*dt};h=colSAT(A,B2,rel);if(h)h.pen=0}
  if(!h)return null;const n=h.n,pt=h.pt;
  const rA=[pt[0]-A.s,pt[1]-A.y],rB=[pt[0]-B.s,pt[1]-B.y],cr=(r,u)=>r[0]*u[1]-r[1]*u[0];
  const vel=(m,r)=>[m.vs-m.w*r[1],m.vy+m.w*r[0]];const va=vel(ma,rA),vb=vel(mb,rB),rv=[vb[0]-va[0],vb[1]-va[1]],vn=rv[0]*n[0]+rv[1]*n[1];
  const MA=colMassa(a),MB=colMassa(b);
  // roda com roda (contato perto do eixo de um dos dois, nas pontas): pneu quica e agarra mais
  const lA=Math.abs(rA[0]*A.co+rA[1]*A.si),lB=Math.abs(rB[0]*B.co+rB[1]*B.si),roda=(Math.abs(lA-1.75)<.55||Math.abs(lB-1.75)<.55);
  let jn=0,jt=0;
  if(vn<0){/* toque leve (abaixo de ~3 m/s): plástico, os carros seguem juntos (sem quique que vira novo toque) */const e=-vn<3?0:(roda?COLI.E_RODA:COLI.E_CORPO),ka=cr(rA,n),kb=cr(rB,n),k=1/MA.m+1/MB.m+ka*ka/MA.I+kb*kb/MB.I;jn=-(1+e)*vn/k;
    const t=[-n[1],n[0]],vt=rv[0]*t[0]+rv[1]*t[1],ta=cr(rA,t),tb=cr(rB,t),kt=1/MA.m+1/MB.m+ta*ta/MA.I+tb*tb/MB.I,mu=roda?COLI.MU_RODA:COLI.MU;jt=clamp(-vt/kt,-mu*jn,mu*jn);
    const J=[n[0]*jn+t[0]*jt,n[1]*jn+t[1]*jt];
    colAplica(a,ma.vs-J[0]/MA.m,ma.vy-J[1]/MA.m,-cr(rA,J)/MA.I);colAplica(b,mb.vs+J[0]/MB.m,mb.vy+J[1]/MB.m,cr(rB,J)/MB.I);
    /* quina com quina numa batida de traseira = roda com roda (os pneus ficam por fora da carroceria): o pneu da frente de quem bate pode subir pelo pneu de trás de quem é batido (aereo.js) */if(typeof aerRodaRoda==="function"&&-vn>3){const vl=-(rel[0]*n[0]+rel[1]*n[1]);/* aproximação só pelas velocidades dos carros (sem o giro) */if(!aerRodaRoda(a,b,A,B,pt,jn,n,vl))aerRodaRoda(b,a,B,A,pt,jn,n,vl)}}
  // desfaz a sobreposição aos poucos (pelo inverso da massa)
  if(h.pen>0){const p=Math.min(h.pen,COLI.SEP),wa=MB.m/(MA.m+MB.m),wb=1-wa,L=R.geo.len;
    a.prog-=n[0]*p*wa/L;a.y=(a.y||0)-n[1]*p*wa;b.prog+=n[0]*p*wb/L;b.y=(b.y||0)+n[1]*p*wb}
  return{vn:-vn,jn,jt,n,pt,roda,long:Math.abs(n[0])>=Math.abs(n[1]),rA,rB}}
