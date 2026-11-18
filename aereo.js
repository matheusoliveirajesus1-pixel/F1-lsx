// ===================== CARRO NO AR: DECOLAGEM RODA COM RODA, VOO, CAPOTAGEM E ATERRISSAGEM =====================
// Até aqui o carro vivia no plano da pista. Agora, quando a física leva a isso, o carro ganha três graus de liberdade a mais
// (altura, rolagem e arfagem) e vira uma caixa rígida de verdade (5,6 × 2,0 × 0,95 m, centro de massa a 0,45 m do chão):
//  - roda com roda numa batida de traseira: o pneu de trás do carro da frente gira para cima na face que encosta e o pneu
//    da frente do carro de trás gira para baixo; borracha contra borracha, o atrito joga a roda dianteira de quem bate para
//    cima (é o que fez o Webber decolar em Valência 2010). Só acontece com roda encostando em roda e muita diferença de
//    velocidade; num toque comum o peso e a pressão aerodinâmica seguram o carro no chão
//  - de bico para cima em alta velocidade, o assoalho vira asa: a pressão vira sustentação e o carro pode dar uma cambalhota
//  - de lado na brita, as rodas do lado que vai na frente cavam e o carro tropeça; abaixo de ~100 km/h de lado ele só
//    levanta as rodas e cai de volta, acima disso pode capotar
//  - no chão, cada quina da caixa que encosta recebe um impulso (quique pequeno + atrito): o carro rola sobre a quina, cai
//    de lado, desliza de cabeça para baixo, ou cai sobre as rodas e segue
// Sem sorteio: tudo sai do impulso, da gravidade, da aerodinâmica e do contato com o chão.
const AEREO={
  MU_PNEU:.6,// atrito borracha contra borracha (as duas rodas girando em sentidos opostos na face do contato)
  H0:.45,HB:.45,HT:.5,// centro de massa acima do chão; caixa: 0,45 m abaixo dele (assoalho/rodas) e 0,5 m acima (santantônio)
  IX:.35,IY:1.3,// inércia de rolagem e de arfagem (por massa, m²): carro baixo, massa concentrada no meio
  E:.2,// quique no chão
  MU_CHAO:.55,// carroceria raspando no asfalto ou na brita
  AF:3.4,// área do assoalho que vira asa (m²) quando o bico sobe
  BRACO_SUST:.55,// a sustentação do assoalho age à frente do centro de massa (m): empina mais
  TRIP_V:16,// velocidade de lado na brita (m/s) a partir da qual as rodas cavam
  TRIP_K:.3,// giro de rolagem por m/s acima disso
  INICIO:3.5,FECHA:10,JMAX:8,// o pneu deforma: no máximo 8 m/s de impulso vertical por massa
  // impulso vertical mínimo (m/s) e diferença de velocidade mínima (m/s) para o carro sair do plano (abaixo disso é só um solavanco)
  SUB:.005// passo da simulação no ar (s)
};
// ---------- geometria da caixa: cantos no corpo e no mundo
const AER_CANTOS=(()=>{const o=[];for(const x of[2.8,-2.8])for(const y of[1,-1])for(const z of[-AEREO.HB,AEREO.HT])o.push([x,y,z]);return o})();
// rolagem (ro > 0: lado esquerdo sobe) e depois arfagem (pi > 0: bico sobe)
function aerGira(p,ro,pi){const cr=Math.cos(ro),sr=Math.sin(ro),cp=Math.cos(pi),sp=Math.sin(pi);const y1=p[1]*cr-p[2]*sr,z1=p[1]*sr+p[2]*cr;return[p[0]*cp-z1*sp,y1,p[0]*sp+z1*cp]}
function aerEmPe(a){return Math.cos(a.ro)*Math.cos(a.pi)}
// o carro sai do plano: guarda o estado 3D (z = altura do centro de massa)
function aerInicia(c,o){if(c.air||c.pit||!running(c))return null;if(!c.dyn)dynInit(c);const d=c.dyn;
  c.air={zc:AEREO.H0,vz:0,ro:0,pi:0,wr:0,wp:0,t0:R.t,zMax:AEREO.H0,quieto:0,rodou:0,why:o&&o.why||"toque",avisou:false,pancada:0,v0:+(c.v||0).toFixed(0),r:d.spin?(d.r||0):(d.wz||0)};
  if(typeof exStatus==="function")exStatus(c,"crash",{dir:Math.sign(c.y||1),cause:o&&o.cause||"toque"});return c.air}
// impulso vertical J (N·s) num ponto do corpo (x para a frente, y para a esquerda, z para cima)
function aerImpulso(c,J,x,y){const a=c.air,m=colMassa(c).m;const q=aerGira([x,y,-.12],a.ro,a.pi),dzdp=q[0],dzdr=Math.cos(a.pi)*q[1];
  a.vz+=J/m;a.wp=clamp(a.wp+J*dzdp/(m*AEREO.IY),-12,12);a.wr=clamp(a.wr+J*dzdr/(m*AEREO.IX),-12,12)}
// ---------- roda com roda numa batida de traseira (chamado por colResolve depois do impulso)
// rear/front: quem bate e quem é batido; Br/Bf: caixas; pt: ponto do contato; jn: impulso normal (N·s)
function aerRodaRoda(rear,front,Br,Bf,pt,jn,n,vc){if(!R.started||rear.pit||front.pit||(rear.v||0)<15||jn<=0)return false;
  // só a batida de traseira de verdade: os dois andando para a frente, alinhados, sem rodar, e o choque na direção do carro
  // (um carro rodando que varre o outro de lado empurra, não levanta)
  const rodando=c=>c.dyn&&c.dyn.spin&&c.dyn.spinT!==R.t;/* a rodada que começa neste mesmo toque não conta */if(rodando(rear)||rodando(front)||Math.abs(dynWrap((rear.psi||0)-(front.psi||0)))>.3)return false;
  /* os dois indo na mesma direção (não um atravessando na frente do outro) */const ch=x=>(x.dyn&&x.dyn.chi)||0;if(Math.abs(ch(rear)-ch(front))>.25||Math.abs(rear.dyn&&rear.dyn.beta||0)>.3)return false;
  if(n&&Math.abs(n[0]*Br.co+n[1]*Br.si)<.8)return false;if(vc!=null&&vc<AEREO.FECHA)return false;
  const loc=(b)=>{const ds=pt[0]-b.s,dy=pt[1]-b.y;return[ds*b.co+dy*b.si,-ds*b.si+dy*b.co]};const lr=loc(Br),lf=loc(Bf);
  // a roda dianteira de quem bate encostou na roda traseira de quem é batido (as rodas ficam nas quinas, fora da carroceria)
  if(!(lr[0]>1.1&&Math.abs(lr[1])>.5&&lf[0]<-1.1&&Math.abs(lf[1])>.5))return false;
  const m=colMassa(rear).m,mf=colMassa(front).m,J=AEREO.MU_PNEU*Math.min(jn,1.15*vc*m*mf/(m+mf));/* o atrito pneu contra pneu vem da batida em si (não do giro da carroceria) */if(J/m<AEREO.INICIO)return false;// pouca diferença de velocidade: a pressão segura o carro no chão
  if(rear.air)return false;/* já no ar: o pneu não empurra de novo */const a=aerInicia(rear,{why:"roda",cause:"toque"});if(!a)return false;aerImpulso(rear,Math.min(J,AEREO.JMAX*m),1.75,clamp(lr[1],-.85,.85));
  R.aerN=(R.aerN||0)+1;return true}
// ---------- tropeço na brita (chamado por dynStep depois do passo no plano)
function aerTropeco(c){if(c.air||c.pit||!R.started||(c.v||0)<12||typeof supAt!=="function")return;const d=c.dyn;if(!d)return;
  const vyb=-(c.v||0)*Math.sin(d.beta||0);if(Math.abs(vyb)<AEREO.TRIP_V)return;if(supAt(fr(c.prog),c.y||0)!=="brita")return;
  const wr=-Math.sign(vyb)*AEREO.TRIP_K*(Math.abs(vyb)-AEREO.TRIP_V);if(Math.abs(wr)<1)return;const a=aerInicia(c,{why:"brita",cause:c.ex&&c.ex.cause||null});if(!a)return;
  a.wr=wr;a.vz=Math.abs(wr)*.35;/* as rodas cavam: perde velocidade de lado */c.v*=.82;R.aerN=(R.aerN||0)+1}
// ---------- passo do carro fora do plano (substitui o passo da dinâmica de pneus enquanto durar)
function aerPasso(c,dt){const a=c.air,d=c.dyn,L=R.geo.len,m=colMassa(c).m,ph=c.ph||{};let v=Math.max(0,c.v||0);let t=dt;
  while(t>1e-6){const h=Math.min(AEREO.SUB,t);t-=h;
    const up=aerEmPe(a),vx=v*Math.cos(d.beta||0);
    // forças: gravidade, efeito solo (só perto do chão e em pé), assoalho como asa com o bico para cima
    const alt=Math.max(0,a.zc-AEREO.H0),ge=up>.7?Math.exp(-alt/.25)*up:0,q=.5*PH.rho*vx*vx;
    const down=q*PH.cla*(ph.cl||1)*ge,lift=a.pi>0&&a.pi<Math.PI/2?q*AEREO.AF*1.6*Math.sin(a.pi)*Math.cos(a.pi)*Math.max(0,Math.cos(a.ro)):0/* placa plana: máxima a 45°, nenhuma com o carro de pé */;
    a.vz+=(-PH.g-down/m+lift/m)*h;a.wp+=lift*AEREO.BRACO_SUST/(m*AEREO.IY)*h;
    // o ar amortece o giro; arrasto freia
    const am=Math.exp(-(.3+v*.006)*h);a.wp*=am;a.wr*=am;v=Math.max(0,v-(q*PH.cdaCorner*(ph.cd||1)/m)*h);
    a.zc+=a.vz*h;a.ro+=a.wr*h;a.pi+=a.wp*h;
    // chão: impulso em cada quina que entrou (quique pequeno, atrito da carroceria no asfalto)
    let low=1e9,toque=false,carroceria=false;const vz0=a.vz;for(let it=0;it<2;it++)for(const p0 of AER_CANTOS){const q3=aerGira(p0,a.ro,a.pi),zw=a.zc+q3[2];if(it===0)low=Math.min(low,zw);if(zw>0)continue;
      const dzdp=q3[0],dzdr=Math.cos(a.pi)*(p0[1]*Math.cos(a.ro)-p0[2]*Math.sin(a.ro)),vp=a.vz+dzdp*a.wp+dzdr*a.wr;if(vp>=0)continue;
      const k=1/m+dzdp*dzdp/(m*AEREO.IY)+dzdr*dzdr/(m*AEREO.IX),e=it===0&&vp<-2?AEREO.E:0,j=-(1+e)*vp/k;a.vz+=j/m;a.wp=clamp(a.wp+j*dzdp/(m*AEREO.IY),-12,12);a.wr=clamp(a.wr+j*dzdr/(m*AEREO.IX),-12,12);toque=true;
      // quina de baixo com o carro em pé = rodas (rolam); qualquer outra = carroceria raspando
      const roda=p0[2]<0&&up>.85;if(!roda){carroceria=true;v=Math.max(0,v-AEREO.MU_CHAO*j/m);/* a quina que bate no chão amassa (dano3d.js) */if(j/m>2.5&&typeof d3Ponto==="function")d3Ponto(c,p0[0]*.95,p0[1],j/m*1.5,(p0[2]+AEREO.H0)*1000)}else v=Math.max(0,v-.02*j/m);}
    if(low<0)a.zc-=low;// desfaz a penetração
    /* o chão não dá mais energia do que recebeu: quique no máximo proporcional à pancada */if(toque&&a.vz>0){const lim=Math.max(.5,-vz0*AEREO.E+.5,vz0);if(a.vz>lim)a.vz=lim}
    if(toque&&-vz0>a.pancada)a.pancada=-vz0;// força da pancada: velocidade vertical do centro de massa ao tocar
    if(toque){a.chao=true;const yr=Math.exp(-(carroceria?2.5:1.2)*h);a.r*=yr}else a.chao=false;
    a.zMax=Math.max(a.zMax,a.zc)}
  // movimento no plano da pista: sem pneus no chão o carro segue reto no mundo (a pista curva por baixo dele)
  const f=fr(c.prog),y=c.y||0,mt=dynMetric(f,y);let ch=d.chi||0;const ds=v*Math.cos(ch)/mt.den*dt,dy=v*Math.sin(ch)*dt;ch-=mt.kn*v*Math.cos(ch)/mt.den*dt;d.chi=clamp(ch,-1.55,1.55);
  c.prog+=ds/L;let ny=y+dy;c.psi=dynWrap((c.psi||0)+a.r*dt);d.beta=dynWrap(c.psi-d.chi);if(d.spin)d.r=a.r;else d.wz=clamp(a.r,-3.4,3.4);
  // muro ou barreira
  const s=Math.sign(ny)||1,wl=wallM(c,s);if(Math.abs(ny)>=wl-CARW/2){const imp=Math.abs(v*Math.sin(d.chi))+(a.zc>.9?6:0);ny=s*(wl-CARW/2);const vl=v*Math.cos(d.chi)*.62,vt=-v*Math.sin(d.chi)*.25;v=Math.hypot(vl,vt);d.chi=v>.3?Math.atan2(vt,Math.max(.1,vl)):0;a.wr*=.5;a.r+=-s*clamp(imp*.05,0,1.5);
    c.y=ny;c.v=v;c.vy=v*Math.sin(d.chi);exWall(c,imp,v);if(!running(c)){c.air=null;return}}
  c.y=ny;c.v=v;c.vy=v*Math.sin(d.chi);c.acc=0;
  // mensagens: decolou, capotou
  if(!a.avisou&&a.zMax>AEREO.H0+.6){a.avisou=true;const cn=typeof nextCorner==="function"?nextCorner(c):null,nm=cn?` na ${cn.n}`:"";if(typeof narr==="function")narr(`${c.code} DECOLA${nm}! O carro saiu do chão!`,3);if(typeof hlight==="function")hlight("crash",[c],`${c.code} decola`,3);if(typeof crowdEv==="function")crowdEv(f,1)}
  const inv=Math.abs(dynWrap(a.ro))>1.75||Math.abs(a.pi)>1.75;if(inv&&!a.virou){a.virou=true;if(typeof rcMsg==="function")rcMsg(`ACIDENTE: ${c.code} capotou!`,"bad","escape")}
  // fim: assentou nas rodas (volta para a dinâmica normal) ou parou de lado/de cabeça para baixo (abandono)
  const parado=Math.abs(a.vz)<.4&&Math.abs(a.wr)<.4&&Math.abs(a.wp)<.4&&a.chao;
  if(parado&&aerEmPe(a)>.98){a.quieto+=dt;if(a.quieto>.25)aerFim(c,true)}
  else if(parado&&v<1.5&&aerEmPe(a)<.6){a.quieto+=dt;if(a.quieto>.6)aerFim(c,false)}
  else a.quieto=0;
  if(c.air&&R.t-a.t0>25)aerFim(c,aerEmPe(a)>.6)}
// volta ao plano: em pé segue (com o dano da aterrissagem); virado é abandono
function aerFim(c,emPe){const a=c.air;if(!a)return;c.air=null;if(!emPe)c.pose3d={zc:a.zc,ro:a.ro,pi:a.pi,h0:AEREO.H0};/* virado: o carro parado fica como caiu */const f=fr(c.prog),pan=a.pancada||0;(R.aerLog||(R.aerLog=[])).push({code:c.code,why:a.why,alt:+(a.zMax-AEREO.H0).toFixed(2),pan:+pan.toFixed(1),emPe,virou:!!a.virou,t:+(R.t-a.t0).toFixed(1),v0:a.v0});
  if(emPe){// aterrissagem forte: suspensão e rodas sentem
    if(pan>3){dmgInit(c);const k=(pan-3)*.09;for(let i=0;i<4;i++)c.dmg.whl[i]=Math.min(1,(c.dmg.whl[i]||0)+k);c.dmg.floor=Math.min(1,(c.dmg.floor||0)+k*.8)}
    if(pan>8&&running(c)&&typeof dnf==="function"){if(typeof rcMsg==="function")rcMsg(`${c.code} caiu forte demais: suspensão destruída.`,"bad","escape");dnf(c,"Acidente (aterrissagem)","crash");if(typeof accFlag==="function")accFlag(c,pan*2.5);return}
    return}
  if(running(c)&&typeof dnf==="function"){const cn=typeof nextCorner==="function"?nextCorner(c):null,nm=cn?` na ${cn.n}`:"";
    if(typeof narr==="function")narr(`${c.code} parou de cabeça para baixo${nm}. O halo segurou!`,3);c.ex=null;dnf(c,"Acidente (capotou)","crash");
    if(typeof accFlag==="function")accFlag(c,26);else if(typeof triggerSC==="function")triggerSC("sc");if(typeof debrisAdd==="function")debrisAdd(c,f,c.y||0,4,true);if(typeof stEv==="function")stEv(c,"err","crash")}}
// para o desenho 3D: altura do centro de massa acima do normal e os ângulos
function aerPose(c){const a=c&&(c.air||c.pose3d);if(!a)return null;return{zc:a.zc,ro:a.ro,pi:a.pi,h0:AEREO.H0}}
