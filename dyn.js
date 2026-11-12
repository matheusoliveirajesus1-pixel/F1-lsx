// ===================== DINÂMICA DO CARRO: NÚCLEO ÚNICO DE MOVIMENTO =====================
// Este arquivo é a ÚNICA autoridade que move os carros (posição, velocidade, direção e rotação).
// A IA, o jogador, o box, a largada, os erros e os toques só mandam comandos (velocidade desejada, linha desejada,
// erros de comando, impulsos) e o carro responde pelas leis abaixo. O desenho só lê o resultado.
//
// Coordenadas da pista (Frenet): s = distância ao longo da linha central, y = afastamento lateral (m, + à esquerda).
//   ds/dt = v·cos(χ)/(1−κ·y)     dy/dt = v·sin(χ)     dχ/dt = a_lat/v − κ·v·cos(χ)/(1−κ·y)
//   χ = direção do movimento em relação à pista; β = ângulo de deriva (carroceria − movimento); ψ = χ + β (direção da carroceria)
// Pneus (modelo de dois eixos): cada eixo tem um "círculo de aderência" G·b, com G = μ·gk·(g + kd·v²/m), o mesmo que o perfil
// de velocidade usa. Frear e virar dividem a mesma aderência. Se a dianteira satura: subesterço (abre a trajetória).
// Se a traseira satura: sobresterço (β cresce; o piloto corrige conforme a habilidade; passando de ~35° o carro roda).
// Frear além do limite trava as rodas (perde frenagem e direção); acelerar além da tração patina (perde a traseira).
const DYN={BETA_SPIN:.62,KC:4.2,KC_EM:6.5,KOS:2.2,CR:.9,GK:1.08,SLIDE:.8,MARKS:3200,WHL:[[1.75,.8],[1.75,-.8],[-1.65,.82],[-1.65,-.82]]};
function dynWrap(a){a=(a+Math.PI)%(2*Math.PI);if(a<0)a+=2*Math.PI;return a-Math.PI}
// curvatura da linha central (1/m) a partir da geometria já existente (TRACKGEO.path/heading); nada da pista é alterado
function dynPrep(){if(R._dynK&&R._dynKid===TRACKGEO)return;const g=TRACKGEO,M=g.M,raw=new Float32Array(M),k=new Float32Array(M);
  // geometria exata do desenho (trackPos): em cada trecho i a normal gira exatamente Δh_i e o centro anda o comprimento do trecho.
  // kn = Δh_i por metro nominal (prog·len) e sig = comprimento real / DS; com isso a posição desenhada anda na mesma velocidade e
  // na mesma direção que o estado físico (antes a curvatura era suavizada e diferia da que o desenho percorre)
  const sig=new Float32Array(M);for(let i=0;i<M;i++){const a=g.path[i],b=g.path[(i+1)%M];const d=Math.hypot(b.x-a.x,b.y-a.y)/WS;sig[i]=Math.max(.5,d)/DS;raw[i]=dynWrap(g.heading[(i+1)%M]-g.heading[i])/DS;k[i]=raw[i]/sig[i]}
  // afastamento lateral do pit lane, lido do próprio desenho TRACKGEO.pit (mesma geometria, sem criar outra)
  const P=g.pit,pl=[];if(P&&P.length){const iE=Math.round(g.pl.fe*M);for(let j=0;j<P.length;j++){const i=(iE+j)%M,p=g.path[i],h=g.heading[i];pl.push(((P[j].x-p.x)*-Math.sin(h)+(P[j].y-p.y)*Math.cos(h))/WS)}}
  R._dynK=k;R._dynKn=raw;R._dynSig=sig;R._dynKid=TRACKGEO;R._pitLat=pl;R._pitIE=Math.round(g.pl.fe*M);R.marks=R.marks||{x1:new Float32Array(DYN.MARKS),y1:new Float32Array(DYN.MARKS),x2:new Float32Array(DYN.MARKS),y2:new Float32Array(DYN.MARKS),a:new Float32Array(DYN.MARKS),t:new Float32Array(DYN.MARKS),n:0,i:0}}
// curvatura real (1/m) e métrica da curva desenhada (trackFrame): ds_nominal/dt = v·cosχ/(sig − kn·y), dχ/dt = a_lat/v − kn·ds_nominal/dt
function kapAt(f){if(typeof trackFrame==="function"){const F=trackFrame(f),sp2=F.dx*F.dx+F.dy*F.dy;return (F.dx*F.ddy-F.dy*F.ddx)/Math.pow(sp2,1.5)*WS}const k=R._dynK,M=k.length;return k[Math.floor(fr(f)*M)%M]}
function dynMetric(f,y){if(typeof trackFrame==="function"){const F=trackFrame(f),sp2=F.dx*F.dx+F.dy*F.dy,sp=Math.sqrt(sp2)||1,sig=sp/WS/DS,kn=(F.dx*F.ddy-F.dy*F.ddx)/sp2/DS;return{kn,den:Math.max(.3*sig,sig-kn*y)}}
  const M=R._dynKn.length,i=Math.floor(fr(f)*M)%M,kn=R._dynKn[i];return{kn,den:Math.max(.3*R._dynSig[i],R._dynSig[i]-kn*y)}}
// afastamento do pit lane no ponto f (m); fora do trecho do pit devolve null
function pitLatAt(f){const pl=R._pitLat;if(!pl||!pl.length)return null;const M=TRACKGEO.M;let j=fr(f)*M-R._pitIE;if(j<0)j+=M;if(j>pl.length-1)return null;const a=Math.floor(j),t=j-a;return pl[a]*(1-t)+pl[Math.min(pl.length-1,a+1)]*t}
function dynInit(c){c.dyn={chi:0,beta:0,r:0,satF:0,satR:0,lock:0,spin:false,cmd:[],wl:null,lockT:0,spinT:0,under:0,gravV:0,frozen:false,ev:{}};c.psi=0;c.yaw=0}
function dynReset(c){if(!c.dyn)dynInit(c);const d=c.dyn;d.chi=0;d.beta=0;d.r=0;d.spin=false;d.lock=0;d.cmd=[];d.wl=null;c.psi=0;c.yaw=0;c.vy=0}
// aderência total disponível por unidade de massa (m/s²) na velocidade v, sem dano (o dano entra por eixo)
function gripG(c,v){const kd=.5*PH.rho*PH.cla*((c.ph&&c.ph.cl)||1);const mu=(c.muBase||c.mu||1.6)*R.geo.gk*DYN.GK;return mu*(PH.g+kd*v*v/((c.ph&&c.ph.mass)||PH.mass))}
// fatores de aderência por eixo vindos do estado do carro (danos, furo, pneu quadrado não altera aderência)
function axleK(c){const d=c.dmg||{},w=d.whl||[0,0,0,0];let bf=(1-.34*(d.wing||0))*(1-.3*Math.max(w[0],w[1])),br=(1-.36*(d.rwing||0)-.24*(d.floor||0))*(1-.3*Math.max(w[2],w[3]));
  const p=c.tyre&&c.tyre.punct;if(p){const j=typeof p==="number"?p:2,k=c.tyre.rim?.3:.42;if(j<2)bf*=k;else br*=k}return{bf:Math.max(.2,bf),br:Math.max(.2,br)}}
// a mesma aderência entra no perfil de velocidade: o piloto conhece o próprio carro e anda dentro do que ele aguenta
function dynMuK(c){const a=axleK(c);return Math.min(a.bf,a.br)}
function surfK(c){const s=surfAt(c);return s==="pista"?{k:1,drag:0,s}:s==="zebra"?{k:.93,drag:.5,s}:s==="asfalto"?{k:.95,drag:0,s}:s==="grama"?{k:.5,drag:2.8,s}:{k:.42,drag:9,s}}
// ---------- erros de comando (o sistema de risco decide QUANDO; aqui está O QUE o piloto faz de errado)
// kinds: lateBrake (freia tarde), overspeed (entra rápido), earlyThrottle (acelera cedo), steerOut (perde o volante para fora),
// noCorrect (não corrige a traseira a tempo), gripLoss (perde aderência num eixo: zebra, faixa pintada, poça, roda travada)
function dynError(c,kind,o){if(!c.dyn)dynInit(c);o=o||{};c.dyn.cmd.push({kind,t:o.t||.5,t0:R.t,k:o.k||0,dir:o.dir||0,axle:o.axle||"r",why:o.why||"",ctx:o.ctx||null});return true}
function dynCmd(c,kind){for(const m of c.dyn.cmd)if(m.kind===kind&&R.t-m.t0<m.t)return m;return null}
// ---------- impulso de um toque (chamado pelos contatos): muda velocidade, direção e rotação conforme o ponto de contato
function dynImpulse(c,dvLong,dvLat,dr){if(!c.dyn)dynInit(c);const d=c.dyn;const vl=(c.v||0)*Math.cos(d.chi)+dvLong,vt=(c.v||0)*Math.sin(d.chi)+dvLat;c.v=Math.max(0,Math.hypot(vl,vt));d.chi=c.v>.3?clamp(Math.atan2(vt,Math.max(.1,vl)),-1.5,1.5):d.chi;d.r+=dr||0;c.vy=c.v*Math.sin(d.chi)}
// estado compatível c.ex (outros módulos leem): existe enquanto o piloto não tem o controle normal do carro
function exStatus(c,type,o){if(c.ex){if(o&&o.ph)c.ex.ph=o.ph;return c.ex}o=o||{};c.ex={type,dir:o.dir||Math.sign(c.y||1),t:0,t0:R.t,ph:o.ph||"slide",yaw:0,vy:c.vy||0,ro:o.ro||null,fast:o.fast||0,why:o.why||"",cause:o.cause||null,v0:c.v||0};c.att=null;c.cdAtt=8;c.lose=0;R.exN=(R.exN||0)+1;
  if(type!=="wide")addYellow(fr(c.prog),R.t+(type==="crash"?30:16));return c.ex}
// ---------- eventos que saem da física (mensagens, bandeira, marcas)
function dynEvent(c,kind){const d=c.dyn,f=fr(c.prog),cn=typeof nextCorner==="function"?nextCorner(c):null,nm=cn?cn.n:"curva",say=(t,o)=>{if(c.hum)radio(c,t,o||{})};
  if(d.ev[kind]&&R.t-d.ev[kind]<4)return;d.ev[kind]=R.t;const pp=pos(c);
  if(kind==="spin"){bubble(c,"Rodou!","bad",3.5);R.fxq.push({type:"puff",f,lat:c.y||0,t0:R.t});if(c.tyre&&!c.tyre.flat&&c.v>25){c.tyre.flat=1;recalc(c)}c.tyre.wear=Math.min(1,c.tyre.wear+.04);
    rcMsg(`${c.code} rodou na ${nm}! Bandeira amarela no local.`,"warn","amarela");if(pp<=8||c.hum){narr(`${c.code} RODOU na ${nm}!`,2);hlight("spin",[c],`${c.code} roda`,c.isP?3:2)}say(`Rodei na ${nm}!`,{k:"rodada",pause:true});crowdEv(f,.8);if(typeof stEv==="function")stEv(c,"err","spin")}
  else if(kind==="off"){const br=surfAt(c)==="brita";bubble(c,br?"Foi para a brita!":"Passou reto!","bad",3);if(br)R.fxq.push({type:"dust",f,lat:c.y||0,t0:R.t});rcMsg(`${c.code} passou reto na ${nm}${br?" e foi para a brita":""}.`,"warn","escape");
    if(pp<=8||c.hum){narr(`${c.code} passa reto na ${nm}!`,2);hlight("spin",[c],`${c.code} escapa na ${nm}`,2)}say(`Passei reto na ${nm}.`,{k:"escape"});crowdEv(f,.6)}
  else if(kind==="wide"){bubble(c,"Alargou!","bad",2.4);say(`Alarguei na ${nm}.`,{me:1})}
  else if(kind==="save"){bubble(c,"Segurou!","pass",2.4);say(`A traseira escapou na ${nm}, mas eu segurei!`,{me:1,k:"limite"});if(pp<=8||c.hum)crowdEv(f,.55)}
  else if(kind==="lock"){bubble(c,"Travou!","bad",2.4);R.fxq.push({type:"puff",f,lat:c.y||0,t0:R.t});say(`Travei a roda na ${nm}.`,{me:1})}
  else if(kind==="spinwheel"){bubble(c,"Patinou!","bad",2)}}
// marcas de pneu: segmentos em coordenadas do mundo, gerados pelas rodas que escorregam (buffer circular de tamanho fixo)
function markAdd(x1,y1,x2,y2,a){const M=R.marks;if(!M)return;const i=M.i;M.x1[i]=x1;M.y1[i]=y1;M.x2[i]=x2;M.y2[i]=y2;M.a[i]=a;M.t[i]=R.t;M.i=(i+1)%DYN.MARKS;M.n=Math.min(DYN.MARKS,M.n+1)}
function dynWheels(c,slip){const d=c.dyn,p=trackPos(c.prog,(c.y||0)*WS),h=p.h+(c.psi||0),co=Math.cos(h),si=Math.sin(h);const cur=DYN.WHL.map(([a,b])=>[p.x+(co*a-si*b)*WS,p.y+(si*a+co*b)*WS]);
  if(d.wl&&slip)for(let w=0;w<4;w++){const s=slip[w];if(s>.25&&Math.abs(cur[w][0]-d.wl[w][0])+Math.abs(cur[w][1]-d.wl[w][1])<8*WS)markAdd(d.wl[w][0],d.wl[w][1],cur[w][0],cur[w][1],Math.min(1,s))}d.wl=cur}
// ---------- passo do carro: comando (velocidade e linha desejadas) → pneus → movimento
// o: {amax, dmax, pit, slope (inclinação lateral conhecida do caminho, m/m), em (emergência), sMax (não passar deste prog)}
function dynStep(c,dt,vT,hard,brk,yT,o){if(!c.dyn)dynInit(c);o=o||{};const n=Math.max(1,Math.ceil(dt/.0501));for(let k=0;k<n;k++)dynSub(c,dt/n,vT,hard,brk,yT,o)}
function dynSub(c,dt,vT,hard,brk,yT,o){const d=c.dyn,L=R.geo.len,f=fr(c.prog);dynPrep();const y=c.y||0,mt=dynMetric(f,y),kap=mt.kn,den=mt.den;
  let v=Math.max(0,c.v||0);const vp=v;const sf=surfK(c);const ax=axleK(c);let G=gripG(c,Math.max(v,5))*sf.k;
  // erros de comando ativos
  const push=dynCmd(c,"pushOut"),late=dynCmd(c,"lateBrake"),ovs=dynCmd(c,"overspeed"),thr=dynCmd(c,"earlyThrottle"),out=dynCmd(c,"steerOut"),noc=dynCmd(c,"noCorrect"),gl=dynCmd(c,"gripLoss");
  if(ovs)vT*=1+ovs.k;if(late&&vT<v)vT=v;
  let bf=ax.bf,br=ax.br;if(gl){if(gl.axle==="f")bf*=gl.k||.5;else br*=gl.k||.5}
  // ---- o piloto planeja a freada com a frenagem que o carro tem agora (pneu, dano, chuva, tanque): olha até 160 m à frente
  if(!o.pit&&c.prof&&v>12&&!late&&!ovs){const N=R.geo.N,i0=Math.floor(f*N)%N,aPlan=.86*Math.min(PH.decMax,PH.muBrake*((c.ph&&c.ph.bk)||1)*G*Math.min(1,(bf+br)/2));
    // o perfil supõe a linha de corrida; fora dela (vácuo, defesa, disputa) o carro só muda de linha na velocidade lateral que tem,
    // e a curva que ele vai fazer de fato é a do traçado naquele afastamento: o piloto freia para essa curva
    const vyM=clamp(1.2+v*.045,1.2,4.8),lk=c.lineK||1,ln0=c.lineN||0;
    for(let k=2;k<=40;k+=2){const ix=(i0+k)%N,dist=Math.max(0,k*DS-2);let vp2=c.prof.v[ix]*(c.k||1);
      const yl=R.geo.line[ix]*lk+ln0,tk=dist/Math.max(v,10),yg=yT??y,yp=y+clamp(yg-y,-vyM*tk,vyM*tk),e=Math.abs(yp-yl);/* vai para onde o piloto está mirando agora (vácuo, defesa), não para a linha ideal */
      if(e>.8){const kp=kapAt(ix/N),kpar=Math.abs(kp)/Math.max(.3,1-kp*yp),kl=Math.abs(R.geo.k[ix]),ke=kl+Math.min(1,e/4)*Math.max(0,kpar-kl);if(ke>1e-4){const vl=Math.sqrt(.95*gripG(c,vp2)*sf.k*Math.min(bf,br)/ke);if(vl<vp2)vp2=vl}}
      const vMax=Math.sqrt(vp2*vp2+2*aPlan*dist);if(vMax<vT){vT=vMax;hard=true}}}
  // ---- longitudinal: o que o piloto pede, limitado pelos pneus
  const aMin=o.dmax!=null?-o.dmax:(hard||brk||v-vT>2.5?-PH.decMax:-1.6),aMaxCmd=o.amax!=null?o.amax:16;
  /* o piloto ajusta pequenas diferenças de velocidade aos poucos (~0,18 s), sem acelera-freia a cada passo; diferenças grandes (freada planejada) seguem imediatas */const dv0=vT-v,tau=(o.pit||o.sMax!=null||brk||Math.abs(dv0)>=4||dv0<0)?dt:.18/* frear por carro à frente, SC/VSC ou curva continua imediato */;let aW=clamp(dv0/Math.max(dt,tau),aMin,aMaxCmd);if(thr)aW=aMaxCmd;
  // ---- lateral: linha desejada → direção desejada → aceleração lateral pedida
  const em=!!c.emerg||!!o.em;const vyMax=o.pit?5:em?6.2:c.coverY!=null?2.6:clamp(1.2+v*.045,1.2,4.8);
  if(push)yT=push.dir*(TRK_H+1.3);// espremido: obrigado a sair da linha
  // antecipação da trajetória: o piloto não persegue a linha, ele já esterça na direção em que a linha vai
  let slope=o.slope||0;if(!o.slope&&!push&&!c.pit){const N=R.geo.N,x=f*N,i0=Math.floor(x)%N,i1=(i0+1)%N,i2=(i0+2)%N,ln=R.geo.line,lk=c.lineK||1;const sl=((ln[i2]-ln[i0])/(2*DS))*lk;const ideal=(ln[i0]+(ln[i1]-ln[i0])*(x-Math.floor(x)))*lk+(c.lineN||0);const w=(c.alongs&&c.alongs.length)||c.bypass||em?0:clamp(1-Math.abs((yT??y)-ideal)/3,0,1);slope=sl*w}
  const ff=slope?Math.atan(slope/den):0;/* dy/ds = tanχ/den */const vyW=clamp(((yT??y)-y)*(em?3.2:2.4),-(push?4:vyMax),push?4:vyMax);
  let chiD=ff+Math.atan2(vyW,Math.max(v,4));if(out)chiD=out.dir*.55;
  // não esterça para cima de um carro que está ao lado: a velocidade lateral em direção a ele fica limitada pelo espaço que sobra
  if(c.alongs&&c.alongs.length&&!out&&!push){const Ls=R.geo.len;for(const q of c.alongs){if(!running(q)||q.pit)continue;let dsq=fr(q.prog)*Ls-f*Ls;if(dsq>Ls/2)dsq-=Ls;if(dsq<-Ls/2)dsq+=Ls;if(Math.abs(dsq)>CARL+1.5)continue;
      const side=Math.sign((q.y||0)-y)||1,gap=Math.abs((q.y||0)-y)-CARW;const vRel=v*Math.sin(chiD)-(q.vy||0);if(vRel*side>0){const allow=Math.max(0,gap-.25)*2.2;if(vRel*side>allow){const vyAllow=(q.vy||0)+side*allow;chiD=Math.asin(clamp(vyAllow/Math.max(v,4),-.9,.9))}}}}
  let aLatD=v*(em?DYN.KC_EM:DYN.KC)*(chiD-d.chi)+v*v*kap*Math.cos(d.chi)/den;
  // ---- pneus: círculo de aderência por eixo (frear carrega a dianteira; acelerar usa a traseira)
  const aBrMax=PH.muBrake*((c.ph&&c.ph.bk)||1)*G*Math.min(1,(bf+br)/2)+(v>20?.5*PH.rho*1.42*((c.ph&&c.ph.cd)||1)*v*v/((c.ph&&c.ph.mass)||PH.mass):0);
  let aL=aW,lock=0,spinW=0;
  if(aL<0){// rápido demais para a curva: o piloto prioriza a freada (alivia o volante); no ritmo certo, a curva tem prioridade
    const over=v-vT>1.5;const latUse=over?0:Math.min(1,Math.abs(aLatD)/Math.max(1,G*bf));const avail=aBrMax*Math.sqrt(Math.max(.05,1-latUse*latUse));if(-aL>avail){// o piloto modula o freio no limite; só trava quando pede muito além (freou tarde, pânico)
      if(late||dynCmd(c,"stamp")){lock=clamp((-aL-avail)/avail+.4,0,1);aL=-avail*.84}else aL=-avail}}
  else if(aL>0){// na saída o piloto dosa o acelerador com a aderência que sobra da curva; acelerar cedo demais (erro) patina e solta a traseira
    const latR=Math.min(1,Math.abs(aLatD)/Math.max(1,G*br));const trac=G*br*Math.sqrt(Math.max(.02,1-latR*latR));if(thr&&aL>trac*.9){spinW=clamp((aL-trac*.9)/Math.max(1,trac),.3,1);aL=trac*.85}else aL=Math.min(aL,trac*.9)}
  if(lock>.05){d.lockT+=dt;bf*=.38}else d.lockT=Math.max(0,d.lockT-dt*2);if(spinW>.05)br*=.62;
  const AF=Math.sqrt(Math.max(0,(G*bf)**2-(aL<0?aL*.62:aL*.1)**2)),AR=Math.sqrt(Math.max(0,(G*br)**2-(aL<0?aL*.38:aL)**2));
  // ---- rodada: o piloto não controla mais; o carro desliza pela inércia e o atrito vai parando o giro
  let aLat=0,under=0;
  if(d.spin){const sl=DYN.SLIDE*G*(.62+.38*Math.abs(Math.sin(d.beta)))+sf.drag;v=Math.max(0,v-sl*dt);d.r*=Math.exp(-dt*(DYN.CR+(v<12?2.4:0)+sf.drag*.15));d.r=clamp(d.r,-3.6,3.6);d.beta+=d.r*dt;aLat=0;
    if(v<.6){v=0;d.spin=false;d.r=0;const ex=exStatus(c,"spin");ex.ph="stop";const nerv=c.st?c.st.nerv:30;ex.until=R.t+1.2+nerv*.012}}
  else{
    // satura o eixo que chega primeiro ao limite
    // um piloto sem erro não pede ao carro mais curva do que a traseira aguenta: ele abre a trajetória em vez de rodar.
    // sobresterço só aparece com perda real de aderência (erro, zebra, toque, poça, pneu) ou acelerando cedo demais
    // os pneus só alinham a carroceria com o movimento quando o carro anda (parado, quem gira o carro é a manobra de volta)
    const vk=clamp((v-1)/14,0,1);
    if(!gl&&!thr&&!noc&&!out&&AR<AF)aLatD=clamp(aLatD,-AR*.99,AR*.99);
    const need=Math.abs(aLatD),sg=Math.sign(aLatD)||1;
    if(need<=Math.min(AF,AR)){aLat=aLatD;const bss=sg*.04*need/Math.max(1,G);d.beta+=(bss-d.beta)*Math.min(1,dt*6*vk)}
    else if(AF<=AR){aLat=sg*AF;under=need-AF;d.beta+=(sg*.03-d.beta)*Math.min(1,dt*5*vk)}
    else{aLat=sg*AR;const ex=Math.min(need,AF)-AR;/* o momento de guinada vem da força que a dianteira consegue fazer menos a da traseira (não do quanto o piloto pede) */d.beta+=sg*DYN.KOS*ex/Math.max(v,6)*dt}
    // rotação recebida (toque, zebra): vira deriva; os pneus amortecem a guinada quando não saturados
    if(d.r){d.beta+=d.r*dt;d.r*=Math.exp(-dt*5)}
    // o piloto corrige a traseira (contra-esterço) com rapidez proporcional ao controle de carro
    const ctrl=noc?0:clamp(2.2+(sk(c,"ctrl")-60)*.075,1.4,5.2)*(R.w>.4?.8:1);if(Math.abs(d.beta)>.06)d.beta-=d.beta*Math.min(1,ctrl*dt*vk*(Math.abs(d.beta)>.3?.75:1));
    if(Math.abs(d.beta)>.28&&!d.saveT)d.saveT=R.t;
    if(Math.abs(d.beta)>DYN.BETA_SPIN&&v>6){d.spin=true;d.nSpin=(d.nSpin||0)+1;d.spinT=R.t;d.r=(d.beta-(d.lastBeta||0))/dt+v*kap;d.r=clamp(d.r,-3.2,3.2);exStatus(c,"spin",{dir:Math.sign(d.beta)});dynEvent(c,"spin")}
    else if(d.saveT&&Math.abs(d.beta)<.1){if(R.t-d.saveT<3)dynEvent(c,"save");d.saveT=0}}
  // ângulo de volante resultante (desenho e telemetria): curva pedida pelo eixo dianteiro, mais o contra-esterço contra a deriva
  d.steer=d.spin?-Math.sign(d.beta)*.42:clamp(Math.atan(3.6*aLat/Math.max(v*v,16))-d.beta*.9+(under>0?Math.sign(aLatD)*Math.min(.12,under*.004):0),-.5,.5);
  d.lastBeta=d.beta;d.under=under;d.lock=lock;d.satF=AF>0?Math.min(1.5,Math.abs(aLat)/AF):1;d.satR=AR>0?Math.min(1.5,Math.abs(aLat)/AR):1;
  if(lock>.3&&d.lockT>.12)dynEvent(c,"lock");if(spinW>.35&&v>8)dynEvent(c,"spinwheel");
  // marca de pneu quadrado por travada longa
  if(d.lockT>.35&&v>30&&c.tyre&&!c.tyre.flat){c.tyre.flat=1;recalc(c);if(c.hum)radio(c,"Travei e marquei o pneu: está vibrando.",{k:"rodada"})}
  // ---- longitudinal efetivo (com atrito de superfície fora da pista)
  if(!d.spin){v=v+aL*dt;v-=sf.drag*dt*(v>1?1:0);v=Math.max(0,v)}
  // ---- marcha à ré (comando de contornar carro parado)
  let rev=null;if(c.rev&&(c.ex||c.pit))c.rev=null;if(c.rev){rev=c.rev;v=0}
  // ---- integração no sistema da pista: subpassos de até 0,6 m que param nos pontos do traçado (onde a curvatura da curva desenhada
  // muda de expressão), cada um pelo ponto médio. Assim a posição desenhada anda exatamente o que a velocidade física manda.
  const chi0=d.chi;let ds=0,dy=0;
  if(v>.5){/* devagar, a curva fica limitada pelo esterço máximo (raio mínimo ~4 m): a direção não gira sem o carro andar */const aL2=d.spin?0:clamp(aLat,-v*v*.25,v*v*.25)/Math.max(v,1),M=R.geo.N;let pr=c.prog,yy=y,ch=d.chi,left=dt;
    for(let q=0;q<48&&left>1e-6;q++){const m1=dynMetric(fr(pr),yy),vs=Math.max(.05,v*Math.cos(ch)/m1.den);const x=fr(pr)*M,toNode=(Math.floor(x)+1-x)*DS+1e-4;
      const h=Math.min(left,.6/Math.max(v,1),toNode/vs);const chm=ch+(aL2-m1.kn*v*Math.cos(ch)/m1.den)*h/2;
      const m2=dynMetric(fr(pr+Math.min(v*Math.cos(chm)/m1.den*h/2,toNode*.5)/L),yy+v*Math.sin(chm)*h/2);
      const dss=v*Math.cos(chm)/m2.den*h,dyy=v*Math.sin(chm)*h;ch+=(aL2-m2.kn*v*Math.cos(chm)/m2.den)*h;pr+=dss/L;yy+=dyy;ds+=dss;dy+=dyy;left-=h}
    d.chi=ch}
  else if(!d.spin){d.chi*=Math.exp(-dt*3);d.beta+=chi0-d.chi}// parado: a direção de movimento não existe; a carroceria não gira por isso
  d.chi=clamp(d.chi,-1.55,1.55);
  if(rev){ds=-1.6*dt;dy=rev.dir*1.6*dt}
  if(o.sMax!=null){const sm=(o.sMax-c.prog)*L;if(ds>sm){ds=Math.max(0,sm);v=Math.min(v,ds/dt)}}
  c.prog+=ds/L;let ny=y+dy;
  // o carro parado depois de rodar gira de volta para a direção da pista (manobra), sem andar
  if(c.ex&&c.ex.ph==="rejoin"&&Math.abs(d.beta)>.12&&v<4){const t=Math.sign(d.beta)*Math.min(Math.abs(d.beta),dt*1.6);d.beta-=t}
  // ---- muro ou barreira: impacto pela velocidade que vai contra o muro
  const s=Math.sign(ny)||1,wl=wallM(c,s);
  // o muro avança para dentro na frente do carro (quina, fim de área de escape): batida de frente, o carro para onde está (sem ser levado de lado)
  if(!c.pit&&Math.abs(ny)>=wl-CARW/2&&Math.abs(y)>wl-CARW/2+.4&&Math.sign(y)===s&&ds>0){c.prog-=ds/L;ny=Math.abs(y+dy)<Math.abs(y)?y+dy:y;const imp=v*Math.abs(Math.cos(d.chi));v=v*.12;d.chi=0;d.r+=-s*clamp(imp*.02,0,1.2);
    if(!c.ex)exStatus(c,imp>8?"crash":"off",{dir:s,ro:R.C.street?"muro":"barreira"});c.y=ny;c.v=v;c.vy=0;exWall(c,imp,v);if(!running(c)){d.frozen=v<.3;return}}
  else if(Math.abs(ny)>=wl-CARW/2&&!c.pit){const vyIn=Math.abs(v*Math.sin(d.chi));const imp=vyIn+v*.07*Math.min(1,Math.abs(Math.sin(d.beta))+.3);ny=s*(wl-CARW/2);
    const vl=v*Math.cos(d.chi)*.62,vt=-v*Math.sin(d.chi)*.25;v=Math.hypot(vl,vt);d.chi=v>.3?Math.atan2(vt,Math.max(.1,vl)):0;d.r+=-s*clamp(imp*.06,0,1.6);if(imp>3)d.beta+=-s*clamp(imp*.012,0,.5);
    if(!c.ex)exStatus(c,imp>8?"crash":"off",{dir:s,ro:R.C.street?"muro":"barreira"});c.y=ny;c.v=v;c.vy=v*Math.sin(d.chi);exWall(c,imp,v);if(!running(c)){d.frozen=v<.3;return}}
  c.y=ny;c.v=v;c.vy=v*Math.sin(d.chi);c.acc=(v-vp)/dt;c.psi=dynWrap(d.chi+d.beta);c.yaw=d.beta;
  // brita: entrada rápida e parada no fundo da caixa = atolado (causa física, não sorteio)
  if(sf.s==="brita"){if(!d.gravV)d.gravV=vp;if(v<.4&&Math.abs(ny)>TRK_H+6&&d.gravV>34&&!c.pit){d.gravV=0;exStuck(c);return}}else d.gravV=0;
  // limites de pista pela posição real: centro do carro a mais de 1 m da linha branca (as quatro rodas fora) numa curva
  {const ay0=Math.abs(ny),gi=Math.floor(fr(c.prog)*R.geo.N)%R.geo.N;if(!c.ex&&!c.pit&&!push&&R.started&&ay0>TRK_H+1&&ay0<TRK_H+2.6&&R.geo.ai.ph[gi]!==0&&R.t-(d.tlT||0)>8){d.tlT=R.t;R.nTL=(R.nTL||0)+1;if(typeof trackLimit==="function")trackLimit(c)}}
  // estado de escapada (compatível com quem lê c.ex)
  const ay=Math.abs(ny);if(!c.ex&&!c.pit&&!push&&ay>TRK_H+2.6&&!d.spin){exStatus(c,under>2||lock>.2||late||ovs?"off":"wide",{dir:Math.sign(ny),ro:sf.s});dynEvent(c,c.ex.type)}
  if(c.ex){const ex=c.ex;ex.t+=dt;ex.vy=c.vy;ex.yaw=d.beta;
    if(ex.ph==="stop"){if(R.t>=(ex.until||0)&&exSafe(c)){ex.ph="rejoin";ex.wt=R.t}}
    else if(ex.ph==="slide"&&!d.spin&&(v<1&&ay>TRK_H||ay<=TRK_H)){ex.ph="rejoin";ex.wt=R.t}
    if(ex.ph==="rejoin"&&!d.spin&&ay<=YMAX+.05&&Math.abs(d.beta)<.1&&(v>6||R.t-ex.wt>1.5)){c.ex=null}}
  dynWheels(c,[d.lock*1.2+d.under*.02+(d.spin?.9:0),d.lock*1.2+d.under*.02+(d.spin?.9:0),Math.abs(d.beta)*2.2+spinW+(d.spin?.9:0),Math.abs(d.beta)*2.2+spinW+(d.spin?.9:0)]);
  d.cmd=d.cmd.filter(m=>R.t-m.t0<m.t)}
// alvo de velocidade e linha durante a recuperação (depois de rodar ou escapar)
function dynRecover(c){const ex=c.ex,lim=speedAt(c,fr(c.prog))*(Math.abs(c.y)>TRK_H?.55:.8);
  if(ex.ph==="stop")return{v:0,y:c.y};const sgn=Math.sign(c.y||ex.dir||1);let yT=sgn*(YMAX-.4);
  // não entra em cima de um carro que está ao lado
  const L=R.geo.len;for(const o of c.alongs||[]){let ds=fr(o.prog)*L-fr(c.prog)*L;if(ds>L/2)ds-=L;if(ds<-L/2)ds+=L;const dy=((o.y||0)-(c.y||0))*Math.sign(yT-c.y);if(Math.abs(ds)<CARL+1&&dy>0&&dy<CARW+1.2){yT=c.y;break}}
  const v=Math.abs(c.dyn.beta)>.7?0:lim;return{v,y:yT}}
// carro abandonado: continua deslizando sem piloto até parar (é o mesmo carro, no mesmo lugar)
function dynCoast(c,dt){const d=c.dyn;if(!d||d.frozen)return;const v0=c.v||0;if(v0<.3){c.v=0;d.frozen=true;return}dynPrep();const f=fr(c.prog),mt=dynMetric(f,c.y||0),kap=mt.kn,den=mt.den;const G=gripG(c,v0)*surfK(c).k;
  const v=Math.max(0,v0-(.8*G+surfK(c).drag)*dt);d.chi+=(-kap*v*Math.cos(d.chi)/den)*dt;d.r*=Math.exp(-dt*2);d.beta+=d.r*dt;let ny=(c.y||0)+v*Math.sin(d.chi)*dt;
  const s=Math.sign(ny)||1,wl=wallM(c,s);let vv=v;if(Math.abs(ny)>=wl-CARW/2){if(Math.abs(c.y||0)>wl-CARW/2+.4){ny=c.y||0;vv=0;c.v=0;d.frozen=true;return}ny=s*(wl-CARW/2);vv=v*.4;d.chi*=-.2}
  c.prog+=vv*Math.cos(d.chi)/den*dt/R.geo.len;c.y=ny;c.v=vv;c.vy=vv*Math.sin(d.chi);c.psi=dynWrap(d.chi+d.beta);c.yaw=d.beta;dynWheels(c,[1,1,1,1].map(()=>vv>3?.8:0))}
// ---------- compatibilidade: quem ainda pede "escapada" pelo nome recebe a causa física equivalente
// (rodar = perder a traseira sem corrigir; passar reto = frear tarde; alargar = entrar rápido; bater = perder o volante para fora)
function exStart(c,type,o){if(!running(c)||c.pit||c.parked||(c.ex&&c.ex.ph!=="rejoin"))return false;o=o||{};const dir=o.dir||(sideAt(fr(c.prog))||1);if(!c.dyn)dynInit(c);
  if(o.cause){// toque: o impulso já veio do contato; aqui só a perda de aderência da traseira e a rotação do toque
    if(type==="spin"){dynError(c,"gripLoss",{axle:"r",k:.3,t:.5});dynError(c,"noCorrect",{t:.35});c.dyn.beta+=dir*.1}
    else if(type==="crash"){dynError(c,"steerOut",{dir,t:1});dynError(c,"gripLoss",{axle:"r",k:.35,t:.8})}
    else if(type==="off"){dynError(c,"steerOut",{dir,t:.6})}
    if(c.ex==null)exStatus(c,type,{dir,cause:o.cause,why:o.why});else c.ex.cause=o.cause;return true}
  if(type==="spin"){dynError(c,"gripLoss",{axle:"r",k:o.k||.32,t:.6});dynError(c,"noCorrect",{t:.45});c.dyn.beta+=dir*.12}
  else if(type==="off"){dynError(c,"lateBrake",{t:.55})}
  else if(type==="wide"){dynError(c,"overspeed",{k:.1,t:1.1})}
  else if(type==="crash"){dynError(c,"steerOut",{dir,t:1.1});dynError(c,"gripLoss",{axle:"r",k:.4,t:.9})}
  c.dyn.errWhy=o.why||"";return true}
