// ===================== PEÇAS SOLTAS: CADA PEÇA QUE SAI DO CARRO VIRA UM PEDAÇO DE VERDADE =====================
// Antes, toda batida jogava os mesmos 8 retângulos coloridos voando e alguns cacos fixos no chão, do mesmo jeito para
// um toque de asa ou para um acidente forte. Agora só sai o que quebrou (dano3d.js), com a forma da própria peça do
// modelo 3D: o endplate é um endplate, a roda é uma roda. Cada pedaço é um corpo pequeno:
//  - sai com a velocidade do carro mais o empurrão da batida (peça leve voa mais, roda pesada quica e rola)
//  - gravidade, quique no chão (fibra de carbono quica pouco, pneu quica mais), atrito do asfalto, da grama e da brita
//    (na brita para logo), muro e barreira
//  - deita no chão quando para (de face, como uma placa)
//  - carro que passa por cima chuta o pedaço
//  - os fiscais recolhem: na pista em ~80 s (antes, com safety car), fora da pista depois de uns minutos
// O sorteio da corrida não é usado aqui: a variação de cada pedaço vem de um embaralhamento fixo do nome da peça, para
// não mudar a corrida (a mesma batida sempre solta os pedaços do mesmo jeito).
const PED={
  G:9.81,MAX:70,
  E_CARBONO:.28,E_PNEU:.55,
  MU:{pista:.45,zebra:.5,asfalto:.45,grama:.7,brita:3},
  AR:{aerodinamica:.035,carroceria:.03,suspensao:.03,freio:.05,roda:.01,chassi:.02},// arrasto por massa (1/m): placa leve de fibra freia muito no ar
  RETIRA_PISTA:80,RETIRA_FORA:200,RETIRA_SC:25
};
function pedHash(s,k){let h=2166136261^k;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return((h>>>0)%10000)/10000}
// medidas da peça (m) pelo catálogo do modelo
function pedMedidas(M,i){const b=M.lista[i].cx;return[(b.max[0]-b.min[0])/1000,(b.max[1]-b.min[1])/1000,(b.max[2]-b.min[2])/1000]}
// transforma os eventos de peça solta (dano3d.js) em pedaços
function pedNovos(){const E=R.pecasSoltas;if(!E||!E.length)return;/* online: o anfitrião manda o começo de cada pedaço para os outros (mp.js) */if(R.mpHost){const o=R.pcOut||(R.pcOut=[]);for(const e of E)if(o.length<40)o.push(e)}const M=typeof d3Meta==="function"?d3Meta():null;if(!M){E.length=0;return}const P=R.pedacos||(R.pedacos=[]);
  for(const e of E){const c=R.cars.find(x=>x.id===e.car);const p=M.lista[e.i];if(!c||!p)continue;const b=p.cx,dim=pedMedidas(M,e.i);
    // onde a peça estava no carro (corpo: l para a frente, w para a esquerda) → pista
    const cxm=(b.min[0]+b.max[0])/2,cym=(b.min[1]+b.max[1])/2,czm=(b.min[2]+b.max[2])/2,l=(M.cx-cxm)/M.kx,w=-cym/M.ky,ps=e.psi||0;
    const ds=l*Math.cos(ps)-w*Math.sin(ps),dy=l*Math.sin(ps)+w*Math.cos(ps);
    const roda=p.cat==="roda",grande=Math.max(...dim),leve=clamp(1.35-grande*.45,.35,1.25)*(roda?.75:1),Ek=Math.min(16,e.E||4);
    const h1=pedHash(p.id,Math.round(e.t*10)),h2=pedHash(p.id,7+Math.round(e.t*10)),h3=pedHash(p.id,13);
    // velocidade: a do carro (direção do movimento) + o empurrão da batida (para fora do lado da peça, para cima, um pouco para trás)
    const v=e.v||0,ch=e.chi||0,lado=Math.sign(w)||(h1<.5?-1:1);
    const vs=v*Math.cos(ch)*(.82+.12*h2)-Ek*.25*leve*Math.sign(l||1)*.4,vy=v*Math.sin(ch)+lado*(.8+Ek*.22*leve)*(.6+.8*h1),vz=(1+Ek*.28*leve)*(.6+.7*h2);
    P.push({car:c.id,id:p.id,i:e.i,cat:p.cat,roda,dim,prog:(e.prog||c.prog)+ds/R.geo.len,y:(e.y||0)+dy,z:czm/1000,vs,vy,vz,
      ya:ps+(h3-.5)*.6,ro:0,pi:0,wy:(h1-.5)*Ek*1.2*leve,wr:(h2-.5)*Ek*2*leve,wp:(h3-.5)*Ek*2*leve,t0:R.t,parado:false,chao:false,col:c.col,col2:c.col2})}
  E.length=0;if(P.length>PED.MAX){/* muitos pedaços: os fiscais já levaram os mais antigos parados */P.sort((a,b)=>(b.parado-a.parado)||(a.t0-b.t0));P.splice(0,P.length-PED.MAX)}}
// passo da física dos pedaços
function pedTick(dt){pedNovos();const P=R.pedacos;if(!P||!P.length)return;const L=R.geo.len;
  for(const q of P){if(q.parado)continue;const sub=Math.max(1,Math.ceil(dt/.02)),h=dt/sub;
    for(let k=0;k<sub;k++){const f=fr(q.prog);
      // chão: altura do pedaço deitado (metade da menor medida)
      const hz=q.roda?Math.max(q.dim[0],q.dim[2])/2*(Math.abs(Math.cos(q.ro))):Math.min(q.dim[0],q.dim[1],q.dim[2])/2+.01;
      {/* arrasto: peça leve e chata freia rápido no ar (girando, mais ainda) */const v3=Math.hypot(q.vs,q.vy,q.vz),kd=(PED.AR[q.cat]||.04)*(1+.04*Math.min(20,Math.abs(q.wr)+Math.abs(q.wp))),f=1/(1+kd*v3*h);q.vs*=f;q.vy*=f;q.vz*=f}
      q.vz-=PED.G*h;q.z+=q.vz*h;
      if(q.z<=hz){q.z=hz;const sup=typeof supAt==="function"?supAt(f,q.y):"pista",mu=PED.MU[sup]||.6;
        if(q.vz<-.6){q.vz=-q.vz*(q.roda?PED.E_PNEU:PED.E_CARBONO)*(sup==="brita"?.3:1);q.wr*=.6;q.wp*=.6}else{q.vz=0;q.chao=true}
        // atrito: roda rola (pouco atrito na direção em que aponta), o resto escorrega
        const sp=Math.hypot(q.vs,q.vy);if(sp>1e-3){const a=(q.roda&&sup!=="brita"?.08:mu)*PED.G*h,k2=Math.max(0,sp-a)/sp;q.vs*=k2;q.vy*=k2}
        const amr=Math.exp(-(q.roda?1.5:5)*h);q.wy*=amr;
        // deita: placa cai de face (0 ou π), roda de lado (π/2) quando para de rolar
        const alvoR=q.roda&&sp>2?Math.round(q.ro/Math.PI)*Math.PI:Math.round(q.ro/(Math.PI/2))*(Math.PI/2),alvoP=Math.round(q.pi/Math.PI)*Math.PI;
        q.wr=q.wr*Math.exp(-6*h)+(alvoR-q.ro)*8*h;q.wp=q.wp*Math.exp(-6*h)+(alvoP-q.pi)*8*h}
      else q.chao=false;
      q.ro+=q.wr*h;q.pi+=q.wp*h;q.ya+=q.wy*h;
      // anda na pista (a pista curva por baixo: o pedaço segue reto no mundo)
      const mt=typeof dynMetric==="function"?dynMetric(f,q.y):{den:1,kn:0},sp=Math.hypot(q.vs,q.vy);
      if(sp>1e-3){let chi=Math.atan2(q.vy,q.vs);chi-=mt.kn*q.vs/mt.den*h;q.vs=sp*Math.cos(chi);q.vy=sp*Math.sin(chi)}
      q.prog+=q.vs/mt.den*h/L;q.y+=q.vy*h;
      // muro e barreira
      const s=Math.sign(q.y)||1,wl=typeof wallM==="function"?wallM({prog:q.prog,y:q.y},s):TRK_H+12;if(Math.abs(q.y)>wl-.15){q.y=s*(wl-.15);q.vy=-q.vy*.3;q.vs*=.7;q.wy+=(q.vs>0?1:-1)*2}}
    if(q.chao&&Math.hypot(q.vs,q.vy)<.25&&Math.abs(q.vz)<.1&&Math.abs(q.wr)<.3&&Math.abs(q.wp)<.3){q.parado=true;q.vs=q.vy=q.vz=0;q.paradoT=R.t}}
  // carro passando por cima chuta o pedaço
  for(const c of R.phys||[]){if(!running(c)||c.pit||(c.v||0)<4)continue;const fc=fr(c.prog);
    for(const q of P){let d=(fr(q.prog)-fc)*L;if(d>L/2)d-=L;if(d<-L/2)d+=L;if(Math.abs(d)>CARL/2+.3||Math.abs(q.y-(c.y||0))>CARW/2+.2||q.z>1.2)continue;
      const h1=pedHash(q.id,Math.round(R.t*20));q.vs=Math.max(q.vs,(c.v||0)*(.35+.3*h1));q.vy+=(q.y-(c.y||0)>=0?1:-1)*(1+3*h1);q.vz=Math.max(q.vz,1+2*h1);q.wy+=(h1-.5)*10;q.wr+=(h1-.5)*12;q.parado=false;q.chao=false}}
  // os fiscais recolhem
  for(let k=P.length-1;k>=0;k--){const q=P[k],naPista=Math.abs(q.y)<TRK_H+1.5,age=R.t-q.t0;
    if(age>(naPista?PED.RETIRA_PISTA:PED.RETIRA_FORA)||(naPista&&R.sc&&age>PED.RETIRA_SC&&q.parado))P.splice(k,1)}}
// pose para o desenho
