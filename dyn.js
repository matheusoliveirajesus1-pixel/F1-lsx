// ===================== DINÂMICA DO CARRO: NÚCLEO ÚNICO DE MOVIMENTO =====================
// Este arquivo é a ÚNICA autoridade que move os carros (posição, velocidade, direção e rotação).
// A IA, o jogador, o box, a largada, os erros e os toques só mandam comandos (velocidade desejada, linha desejada,
// erros de comando, impulsos) e o carro responde pelas leis abaixo. O desenho só lê o resultado.
//
// Coordenadas da pista (Frenet): s = distância ao longo da linha central, y = afastamento lateral (m, + à esquerda).
//   ds/dt = v·cos(χ)/(1−κ·y)     dy/dt = v·sin(χ)     dχ/dt = a_lat/v − κ·v·cos(χ)/(1−κ·y)
//   χ = direção do movimento em relação à pista; β = ângulo de deriva (carroceria − movimento); ψ = χ + β (direção da carroceria)
// Pneus (modelo de dois eixos): cada eixo tem um "círculo de aderência" G·b, com G = μ·gk·(g + kd·v²/m), o mesmo que o perfil
// de velocidade usa. Frear e virar dividem a mesma aderência.
// A carroceria tem giro próprio (dynBici): cada eixo faz força lateral pelo seu ângulo de deriva, com pico do pneu em ~5°;
// a diferença entre frente e traseira gira o carro contra a sua inércia. O piloto põe o volante (d.delta, o ângulo real das rodas)
// para a curvatura que vem logo à frente e contra-esterça quando a traseira escapa, na rapidez da sua habilidade.
// Dianteira no limite: subesterço (abre a trajetória). Traseira no limite: sobresterço (β cresce; passando de ~35° o carro roda).
// Frear além do limite trava as rodas (perde frenagem e direção); acelerar além da tração patina (perde a traseira).
const DYN={BETA_SPIN:.62,KC:4.2,KC_EM:6.5,KOS:2.2,CR:.9,GK:1.08,SLIDE:.8,MARKS:3200,WHL:[[1.75,.8],[1.75,-.8],[-1.65,.82],[-1.65,-.82]]};
// Transferência de carga e downforce por eixo (equações de veículo de pista; parâmetros de um F1 moderno):
// entre-eixos 3,6 m, centro de gravidade a 0,30 m, 45,3% do peso na frente, 44% do downforce na frente, bitola 1,6 m.
// Pneu sensível à carga: cada newton a mais rende um pouco menos de aderência (por isso a carga desigual entre as rodas
// tira aderência do eixo). Freando, a carga vai para a frente (a dianteira morde, a traseira fica leve); acelerando, volta
// para trás (a dianteira alivia e o carro abre na saída). Na curva, a carga passa para as rodas de fora; a divisão entre
// frente e trás segue a rigidez de rolagem (RF, fração na frente): mais rígido na frente = mais subesterço.
// A suspensão leva ~0,12 s para assentar (d.ax e d.ay filtrados), e o desenho usa os mesmos valores para inclinar o carro.
// (constantes LOAD ficam em physics.js, que o perfil de velocidade também usa)
function axleCap(Fz,dL){const s=LOAD.S,a=Fz/2+dL,b=Fz/2-dL,f=x=>x>0?x*(1+s*(x-LOAD.FZ0)):0;return f(a)+f(b)}
function dynLoad(c,v,dt){const d=c.dyn,m=(c.ph&&c.ph.mass)||PH.mass,kd=.5*PH.rho*relRhoR()*PH.cla*((c.ph&&c.ph.cl)||1)*(typeof aeroK==="function"?aeroK(c):1),g=PH.g,L=LOAD,AF=c._aero?c._aero.af:L.AF;
  const down=kd*v*v,ax=clamp(d.ax||0,-60,20)*L.WT,ay=Math.abs(d.ay||0);const dLx=m*ax*L.H/L.L,lat=m*ay*L.H/L.TR;
  const Ff=m*g*L.WF+down*AF,Fr=m*g*(1-L.WF)+down*(1-AF),dF=lat*L.RF/2,dR=lat*(1-L.RF)/2;
  // capacidade de cada eixo por unidade da massa que ele carrega na curva, normalizada pelo eixo mais fraco sem frear/acelerar
  const nF=axleCap(Ff,dF)/L.WF,nR=axleCap(Fr,dR)/(1-L.WF),n0=Math.min(nF,nR)||1;
  const kF=axleCap(Math.max(60,Ff-dLx),dF)/L.WF/n0,kR=axleCap(Math.max(60,Fr+dLx),dR)/(1-L.WF)/n0;
  d.fz=[Ff-dLx,Fr+dLx];
  /* suspensão física (suspfis.js): zebras, ondulação e chão irregular fazem a carga de cada roda oscilar; carga que oscila rende
     menos (sensibilidade do pneu) e roda no ar não segura nada */
  let rF=1,rR=1;if(dt&&typeof susPasso==="function"){const fz0=susCargas(Math.max(60,Ff-dLx),Math.max(60,Fr+dLx),dF,dR,d.ay||0),st=susPasso(c,dt,v,fz0),q=st.dF;
    const f=x=>x>0?x*(1+L.S*(x-L.FZ0)):0;rF=(f(fz0[0]+q[0])+f(fz0[1]+q[1]))/Math.max(1,f(fz0[0])+f(fz0[1]));rR=(f(fz0[2]+q[2])+f(fz0[3]+q[3]))/Math.max(1,f(fz0[2])+f(fz0[3]));d.fz4=fz0.map((x,i)=>x+q[i])}
  return{kF:clamp(kF*rF,.3,1.6),kR:clamp(kR*rR,.3,1.6)}}
function dynWrap(a){a=(a+Math.PI)%(2*Math.PI);if(a<0)a+=2*Math.PI;return a-Math.PI}
// curvatura da linha central (1/m) a partir da geometria já existente (TRACKGEO.path/heading); nada da pista é alterado
function dynPrep(){if(R._dynK&&R._dynKid===TRACKGEO)return;if(typeof supZebraNaLinha==="function")supZebraNaLinha(R.geo);const g=TRACKGEO,M=g.M,raw=new Float32Array(M),k=new Float32Array(M);
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
function dynInit(c){c.dyn={ax:0,ay:0,chi:0,beta:0,r:0,satF:0,satR:0,lock:0,spin:false,cmd:[],wl:null,lockT:0,spinT:0,under:0,gravV:0,frozen:false,ev:{}};c.psi=0;c.yaw=0}
function dynReset(c){if(!c.dyn)dynInit(c);const d=c.dyn;d.chi=0;d.beta=0;d.r=0;d.wz=null;d.delta=0;d.ax=0;d.ay=0;d.spin=false;d.lock=0;d.cmd=[];d.wl=null;c.psi=0;c.yaw=0;c.vy=0}
// aderência total disponível por unidade de massa (m/s²) na velocidade v, sem dano (o dano entra por eixo)
function gripG(c,v){const kd=.5*PH.rho*relRhoR()*PH.cla*((c.ph&&c.ph.cl)||1)*(typeof aeroK==="function"?aeroK(c):1);/* altura do chão, arfagem, derrapagem e ar sujo (aero.js) */const mu=(c.muBase||c.mu||1.6)*R.geo.gk*DYN.GK;
  /* relevo: no fundo do vale o carro é apertado no chão, na crista fica leve; rampa e inclinação lateral mudam a parte da gravidade; ondulação tira um pouco */
  const r=c._rel;return mu*(typeof susPasso==="function"?1:relBumpK(r,v))/* a ondulação agora age pela suspensão física (suspfis.js); o perfil continua contando com ela */*(relGn(r,v)+kd*v*v/((c.ph&&c.ph.mass)||PH.mass))}
// densidade do ar da pista atual (altitude)
function relRhoR(){const g=R&&R.geo;if(!g)return 1;if(g._rho==null)g._rho=typeof relRho==="function"?relRho(g):1;return g._rho}
// fatores de aderência por eixo vindos do estado do carro (danos, furo, pneu quadrado não altera aderência)
function axleK(c){const d=c.dmg||{},w=d.whl||[0,0,0,0];let bf=(1-.34*(d.wing||0))*(1-.3*Math.max(w[0],w[1])),br=(1-.36*(d.rwing||0)-.24*(d.floor||0))*(1-.3*Math.max(w[2],w[3]));
  const p=c.tyre&&c.tyre.punct;if(p){const j=typeof p==="number"?p:2,k=c.tyre.rim?.3:.42;if(j<2)bf*=k;else br*=k}return{bf:Math.max(.2,bf),br:Math.max(.2,br)}}
// a mesma aderência entra no perfil de velocidade: o piloto conhece o próprio carro e anda dentro do que ele aguenta
function dynMuK(c){const a=axleK(c);return Math.min(a.bf,a.br)}
function surfKOld(s){return s==="pista"?{k:1,drag:0,s}:s==="zebra"?{k:.93,drag:.5,s}:s==="asfalto"?{k:.95,drag:0,s}:s==="grama"?{k:.5,drag:2.8,s}:{k:.42,drag:9,s}}
// superfície sob cada roda (superficie.js): a aderência de cada eixo é a média das suas duas rodas; o arrasto, a média das quatro.
// Duas rodas na grama = aquele lado e aquele eixo escorregam; a terra que gruda no pneu tira aderência por algumas curvas.
function surfK(c){const s=surfAt(c);if(c.pit||(c.pitExit!=null&&R.t-c.pitExit<10)||typeof supRodas!=="function"||!supMapa()){c._sw=null;return surfKOld(s)}
  const sw=supRodas(c);c._sw=sw;const w=R.w||0,P=sw.map(n=>supProp(n,w));const kF=(P[0].k+P[1].k)/2,kR=(P[2].k+P[3].k)/2,k=(kF+kR)/2||1;
  return{k,drag:(P[0].drag+P[1].drag+P[2].drag+P[3].drag)/4,s,kF:kF/k,kR:kR/k,suja:Math.max(P[0].suja,P[1].suja,P[2].suja,P[3].suja)}}
// ---------- erros de comando (o sistema de risco decide QUANDO; aqui está O QUE o piloto faz de errado)
// kinds: lateBrake (freia tarde), overspeed (entra rápido), earlyThrottle (acelera cedo), steerOut (perde o volante para fora),
// noCorrect (não corrige a traseira a tempo), gripLoss (perde aderência num eixo: zebra, faixa pintada, poça, roda travada)
function dynError(c,kind,o){if(!c.dyn)dynInit(c);o=o||{};c.dyn.cmd.push({kind,t:o.t||.5,t0:R.t,k:o.k||0,dir:o.dir||0,axle:o.axle||"r",why:o.why||"",ctx:o.ctx||null});return true}
function dynCmd(c,kind){for(const m of c.dyn.cmd)if(m.kind===kind&&R.t-m.t0<m.t)return m;return null}
// ---------- impulso de um toque (chamado pelos contatos): muda velocidade, direção e rotação conforme o ponto de contato
function dynImpulse(c,dvLong,dvLat,dr){if(!c.dyn)dynInit(c);const d=c.dyn;const vl=(c.v||0)*Math.cos(d.chi)+dvLong,vt=(c.v||0)*Math.sin(d.chi)+dvLat;c.v=Math.max(0,Math.hypot(vl,vt));{const c0=d.chi;d.chi=c.v>.3?clamp(Math.atan2(vt,Math.max(.1,vl)),-1.5,1.5):d.chi;d.beta+=c0-d.chi;d.r+=(d.chi-c0)*.5/.12/BICI.KICK}/* o empurrão muda o movimento; a carroceria gira metade disso logo em seguida (sem salto no desenho) */d.r+=dr||0;c.vy=c.v*Math.sin(d.chi)}
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
// ---------- modelo de dois eixos (bicicleta) com inércia de giro
// Unidades por massa (m/s²). a, b = distância do centro de gravidade aos eixos (pelo peso: 45,3% na frente); K2 = inércia de giro / massa.
// Pneu: força = pico·sen(C·atan(B·α)); o pico chega com ~5° de deriva e cai ~19% deslizando (por isso a traseira que escapa
// precisa de correção rápida). Cada eixo aguenta, na curva, a parte do carro que ele carrega (b/L e a/L) da capacidade AF ou AR.
// Abaixo de ~6 m/s o carro segue o volante sem deriva (manobra). Estado: d.beta (carroceria − movimento) e d.wz (giro, rad/s).
const BICI={KICK:.6,PREV:.15,L:3.4,A:3.4*(1-.453),B:3.4*.453,K2:1.45,C:1.4,AP:.088,DMAX:.33,H:.008};BICI.Bk=Math.tan(Math.PI/(2*BICI.C))/BICI.AP;
function AP_LIM(c){return clamp(.97-(sk(c,"ctrl")-40)*.0025,.82,.97)}
function pneuF(al,D){return -D*Math.sin(BICI.C*Math.atan(BICI.Bk*al))}
function pneuAl(f,D){const q=clamp(f/Math.max(D,1e-3),-1,1);return -Math.tan(Math.asin(q)/BICI.C)/BICI.Bk}// ângulo que dá a força f (até o pico)
function dynBici(c,d,v,aLatD,AF,AR,dt,noc,out,surpresa,aG,mz){aG=aG||0;mz=mz||0;/* mz: momento de guinada do diferencial (por massa) *//* aG: parte da aceleração lateral que a gravidade dá numa curva inclinada (os pneus fazem o resto) */const{A,B,L,K2}=BICI;const ffm=AF*B/L,frm=AR*A/L;
  if(d.r){d.wz=(d.wz||0)+d.r*BICI.KICK;d.r=0}// toques e zebras viram giro (os empurrões foram calibrados como giro que some em ~0,2 s; aqui viram giro de verdade)
  if(d.wz==null)d.wz=aLatD/Math.max(v,1);
  if(v<6){/* manobra: o carro vai para onde o volante aponta (raio mínimo ~4 m) */const w=clamp(aLatD/Math.max(v,1),-v/4,v/4);d.wz=w;/* rodando devagar, o movimento se alinha com a carroceria (os pneus não deixam o carro andar de lado); parado, nada gira */const t=d.beta*(1-Math.exp(-dt*1.2*v));d.beta-=t;d.chi+=t;d.delta=clamp(Math.atan(L*w/Math.max(v,1)),-BICI.DMAX,BICI.DMAX);return{ay:w*v,fSat:false}}
  // o piloto põe o volante no ângulo que a curva pede em regime (geometria + deriva de cada eixo) e corrige pelo giro que sente:
  // giro maior que o desejado = contra-esterço (mais rápido quanto mais controle de carro); com o erro "não corrigiu" a correção some
  const kr=noc?0:clamp(.35+(sk(c,"ctrl")-60)*.01,.2,.7)*(R.w>.4?.85:1);
  const n=Math.max(1,Math.ceil(dt/BICI.H)),h=dt/n;let bv=-d.beta,wz=d.wz,ay=0,dl=d.delta||0,fSat=false;
  const wd=aLatD/v,ffN=(aLatD-aG)*B/L,frN=(aLatD-aG)*A/L;if(Math.abs(ffN)>ffm)fSat=true;
  /* o volante é posto para o carro que o piloto espera ter: uma perda súbita de aderência (óleo, zebra, pneu frio) ele só sente depois */const frD=frm/(surpresa||1);
  const dSS=L*wd/v-pneuAl(clamp(ffN,-ffm,ffm),ffm)+pneuAl(clamp(frN,-frD,frD),frD);
  for(let q=0;q<n;q++){const vx=Math.max(v*Math.cos(bv),3),vy=v*Math.sin(bv);const ar=Math.atan2(vy-B*wz,vx),fr=pneuF(ar,frm);
    /* contra-esterço: só quando a traseira passa de ~80% do pico (escapando), na medida do que passou */const arX=Math.abs(ar)-.8*BICI.AP;let delta=dSS+kr*(wd-wz)*L/v*30+(noc||arX<=0?0:Math.sign(ar)*kr*3*arX);/* o piloto sente a frente no limite e não esterça além do pico do pneu (mais volante ali só faria a frente escorregar mais) */if(!out){const k0=Math.atan2(vy+A*wz,vx);delta=clamp(delta,k0-BICI.AP*1.05,k0+BICI.AP*1.05)}else delta=out.dir*.2;delta=clamp(delta,-BICI.DMAX,BICI.DMAX);
    dl+=(delta-dl)*Math.min(1,h/.06);const af=Math.atan2(vy+A*wz,vx)-dl,ff=pneuF(af,ffm);d.alF=af;d.alR=ar;/* ângulos de deriva (pneu.js usa para o aquecimento) */
    const ayq=(ff+fr)*Math.cos(bv);wz=clamp(wz+(A*ff-B*fr+mz)/K2*h,-3.4,3.4);bv+=((ayq+aG)/v-wz)*h;ay+=ayq+aG}
  d.wz=clamp(wz,-3.4,3.4);/* nenhum carro gira mais que ~3,4 rad/s (rodada de verdade) */d.beta=-bv;d.delta=dl;d._dbg=[aLatD,ay/n,ffm,frm];return{ay:ay/n,fSat}}
function dynStep(c,dt,vT,hard,brk,yT,o){if(!c.dyn)dynInit(c);o=o||{};/* fora do plano (aereo.js): no ar, rolando ou capotado, os pneus não mandam */if(c.air&&typeof aerPasso==="function"&&!c.pit){aerPasso(c,dt);return}const n=Math.max(1,Math.ceil(dt/.0501));for(let k=0;k<n;k++)dynSub(c,dt/n,vT,hard,brk,yT,o);if(typeof aerTropeco==="function"&&running(c))aerTropeco(c);
  /* encalhado: parado fora da pista (brita, grama, quina de muro) por ~25 s sem conseguir voltar = abandono, como na vida real
     (sem isso, uma bandeira vermelha esperava esse carro para sempre) */
  if(!c.pit&&R.started&&typeof running==="function"&&running(c)&&(c.v||0)<1.5&&Math.abs(c.y||0)>TRK_H+.5){const sAt=(c.prog||0)*R.geo.len;if(!c._presoRef)c._presoRef={s:sAt,y:c.y||0};c._preso=(c._preso||0)+dt;
    // quem ainda está saindo devagar (rastejando de volta para a pista) não conta: precisa ter andado menos de 3 m nesses 25 s
    if(c._preso>25){const mv=Math.abs(sAt-c._presoRef.s)+Math.abs((c.y||0)-c._presoRef.y);if(mv>3){c._preso=0;c._presoRef=null}}
    if(c._preso>25&&typeof dnf==="function"){const brita=typeof supAt==="function"&&supAt(c.prog,c.y)==="brita";if(typeof rcMsg==="function")rcMsg(`${c.code} ficou preso ${brita?"na brita":"fora da pista"} e abandona.`,"bad");dnf(c,brita?"Preso na brita":"Preso fora da pista","stop")}}else{c._preso=0;c._presoRef=null}}
function dynSub(c,dt,vT,hard,brk,yT,o){/* o piloto mira dentro da pista (rodas sobre a linha branca ou na zebra baixa, não na grama) */if(yT!=null&&!(o&&o.pit)&&!c.pit&&!c.ex&&!c.rev){const lim=typeof supLimY==="function"?supLimY(c.prog,yT):TRK_H-.95;yT=clamp(yT,-lim,lim)}const d=c.dyn,L=R.geo.len,f=fr(c.prog);dynPrep();const y=c.y||0,mt=dynMetric(f,y),kap=mt.kn,den=mt.den;
  /* relevo neste ponto (rampa, compressão/crista, inclinação lateral); no pit lane a pista é plana */const rl=c._rel=(!c.pit&&typeof relevoAt==="function")?relevoAt(R.geo,f):null;const gS=rl?PH.g*rl.sn:0,aBk=rl?PH.g*Math.sin(rl.ph):0;/* aerodinâmica deste instante; assoalho raspando solta faíscas */if(typeof aeroEstado==="function"){const ae=aeroEstado(c,c.v||0,rl);if(ae.raspa&&c.v>55&&R.fxq&&R.t-(c._raspaT||-9)>.3){c._raspaT=R.t;R.fxq.push({type:"sparks",f,lat:y,t0:R.t,peq:1})}}
  let v=Math.max(0,c.v||0);const vp=v;const sf=surfK(c);const ax=axleK(c);let G=gripG(c,Math.max(v,5))*sf.k;
  // erros de comando ativos
  const push=dynCmd(c,"pushOut"),late=dynCmd(c,"lateBrake"),ovs=dynCmd(c,"overspeed"),thr=dynCmd(c,"earlyThrottle"),out=dynCmd(c,"steerOut"),noc=dynCmd(c,"noCorrect"),gl=dynCmd(c,"gripLoss");
  if(ovs)vT*=1+ovs.k;if(late&&vT<v)vT=v;
  let bf=ax.bf*(sf.kF||1),br=ax.br*(sf.kR||1);G*=1-.08*((c.tyre&&c.tyre.suja)||0);if(!d.spin&&v>2){const lt=dynLoad(c,v,dt);bf*=lt.kF;br*=lt.kR;d.kF=lt.kF;d.kR=lt.kR}/* pneus (pneu.js): temperatura de superfície e carcaça, pressão, cambagem, granulação e bolhas de cada eixo */if(typeof pneuEixo==="function"&&!c.pit){bf*=pneuEixo(c,0);br*=pneuEixo(c,1)}if(gl){if(gl.axle==="f")bf*=gl.k||.5;else br*=gl.k||.5}
  // ---- o piloto planeja a freada com a frenagem que o carro tem agora (pneu, dano, chuva, tanque): olha até 160 m à frente
  if(!o.pit&&c.prof&&v>12&&!late&&!ovs){const N=R.geo.N,i0=Math.floor(f*N)%N,aPlan=Math.max(2,.86*Math.min(PH.decMax,PH.muBrake*((c.ph&&c.ph.bk)||1)*G*Math.min(1,(bf+br)/2))+gS);/* descendo, freia antes */
    // o perfil supõe a linha de corrida; fora dela (vácuo, defesa, disputa) o carro só muda de linha na velocidade lateral que tem,
    // e a curva que ele vai fazer de fato é a do traçado naquele afastamento: o piloto freia para essa curva
    const vyM=clamp(1.2+v*.045,1.2,4.8),lk=c.lineK||1,ln0=c.lineN||0;
    for(let k=2;k<=40;k+=2){const ix=(i0+k)%N,dist=Math.max(0,k*DS-2);let vp2=c.prof.v[ix]*(c.k||1);
      const yl=R.geo.line[ix]*lk+ln0,tk=dist/Math.max(v,10),yg=yT??y,yp=y+clamp(yg-y,-vyM*tk,vyM*tk),e=Math.abs(yp-yl);/* vai para onde o piloto está mirando agora (vácuo, defesa), não para a linha ideal */
      if(e>.8){const kp=kapAt(ix/N),kpar=Math.abs(kp)/Math.max(.3,1-kp*yp),kl=Math.abs(R.geo.k[ix]),ke=kl+Math.min(1,e/4)*Math.max(0,kpar-kl);if(ke>1e-4){const vl=Math.sqrt(.95*gripG(c,vp2)*sf.k*Math.min(bf,br)/ke);if(vl<vp2)vp2=vl}}
      const vMax=Math.sqrt(vp2*vp2+2*aPlan*dist);if(vMax<vT){vT=vMax;hard=true}}}
  // ---- longitudinal: o que o piloto pede, limitado pelos pneus
  const aMin=o.dmax!=null?-o.dmax:(hard||brk||v-vT>2.5?-PH.decMax:-1.6),aMaxCmd=o.amax!=null?o.amax:16;
  /* o piloto ajusta pequenas diferenças de velocidade aos poucos (~0,18 s), sem acelera-freia a cada passo; diferenças grandes (freada planejada) seguem imediatas */const dv0=vT-v,tau=(o.pit||o.sMax!=null||brk||Math.abs(dv0)>=4||dv0<0)?dt:.18/* frear por carro à frente, SC/VSC ou curva continua imediato */;/* motor (motor.js): potência pela marcha e rotação, elétrico pela bateria, menos o arrasto (menor no vácuo) */const mot=typeof motorPasso==="function"&&!o.pit&&!c.pit?motorPasso(c,v,dt):null,aEng=mot&&!globalThis.__SEMCAP?Math.max(motorAcel(c,v),motorFolga(c,f)):aMaxCmd;
  let aW=clamp(dv0/Math.max(dt,tau),aMin,aMaxCmd);if(thr)aW=aMaxCmd;/* o pé compensa a rampa: o pedido aos pneus inclui a gravidade */if(gS&&!thr)aW=clamp(aW+gS,aMin,aMaxCmd);if(aW>0)aW=Math.min(aW,Math.max(0,aEng+gS));
  // ---- lateral: linha desejada → direção desejada → aceleração lateral pedida
  const em=!!c.emerg||!!o.em;const vyMax=o.pit?5:em?6.2:c.coverY!=null?2.6:clamp(1.2+v*.045,1.2,4.8);
  if(push)yT=push.dir*(TRK_H+1.3);// espremido: obrigado a sair da linha
  // antecipação da trajetória: o piloto não persegue a linha, ele já esterça na direção em que a linha vai
  let slope=o.slope||0;if(!o.slope&&!push&&!c.pit){const N=R.geo.N,x=f*N,i0=Math.floor(x)%N,i1=(i0+1)%N,i2=(i0+2)%N,ln=R.geo.line,lk=c.lineK||1;const sl=((ln[i2]-ln[i0])/(2*DS))*lk;const ideal=(ln[i0]+(ln[i1]-ln[i0])*(x-Math.floor(x)))*lk+(c.lineN||0);const w=(c.alongs&&c.alongs.length)||c.bypass||em?0:clamp(1-Math.abs((yT??y)-ideal)/3,0,1);slope=sl*w}
  const ff=slope?Math.atan(slope/den):0;/* dy/ds = tanχ/den */
  const vyW=clamp(((yT??y)-y)*(em?3.2:2.4),-(push?4:vyMax),push?4:vyMax);
  let chiD=ff+Math.atan2(vyW,Math.max(v,4));if(out)chiD=out.dir*.55;
  // não esterça para cima de um carro que está ao lado: a velocidade lateral em direção a ele fica limitada pelo espaço que sobra
  if(c.alongs&&c.alongs.length&&!out&&!push){const Ls=R.geo.len;for(const q of c.alongs){if(!running(q)||q.pit)continue;let dsq=fr(q.prog)*Ls-f*Ls;if(dsq>Ls/2)dsq-=Ls;if(dsq<-Ls/2)dsq+=Ls;if(Math.abs(dsq)>CARL+1.5)continue;
      const side=Math.sign((q.y||0)-y)||1,gap=Math.abs((q.y||0)-y)-CARW;const vRel=v*Math.sin(chiD)-(q.vy||0);if(vRel*side>0){const allow=Math.max(0,gap-.25)*2.2;if(vRel*side>allow){const vyAllow=(q.vy||0)+side*allow;chiD=Math.asin(clamp(vyAllow/Math.max(v,4),-.9,.9))}}}}
  /* o volante leva ~0,1 s para virar curva no carro: o piloto já esterça para a curvatura de um pouco mais à frente */const kapP=v>=6?dynMetric(fr(c.prog+v*BICI.PREV/L),y).kn:kap,denP=v>=6?dynMetric(fr(c.prog+v*BICI.PREV/L),y).den:den;
  let aLatD=v*(em?DYN.KC_EM:DYN.KC)*(chiD-d.chi)+v*v*kapP*Math.cos(d.chi)/denP;
  // ---- pneus: círculo de aderência por eixo (frear carrega a dianteira; acelerar usa a traseira)
  const aBrMax=PH.muBrake*((c.ph&&c.ph.bk)||1)*G*Math.min(1,(bf+br)/2)+(v>20?.5*PH.rho*relRhoR()*1.42*((c.ph&&c.ph.cd)||1)*v*v/((c.ph&&c.ph.mass)||PH.mass):0);
  let aL=aW,lock=0,spinW=0;
  if(aL<0){// rápido demais para a curva: o piloto prioriza a freada (alivia o volante); no ritmo certo, a curva tem prioridade
    const over=v-vT>1.5;const latUse=over?0:Math.min(1,Math.abs(aLatD)/Math.max(1,G*bf));const avail=aBrMax*Math.sqrt(Math.max(.05,1-latUse*latUse));if(-aL>avail){// o piloto modula o freio no limite; só trava quando pede muito além (freou tarde, pânico)
      if(late||dynCmd(c,"stamp")){lock=clamp((-aL-avail)/avail+.4,0,1);aL=-avail*.84}else aL=-avail}}
  else if(aL>0){// na saída o piloto dosa o acelerador com a aderência que sobra da curva; acelerar cedo demais (erro) patina e solta a traseira
    const latR=Math.min(1,Math.abs(aLatD)/Math.max(1,G*br));let trac0=G*br*Math.sqrt(Math.max(.02,1-latR*latR));
    /* diferencial (rodas4.js): a roda de trás de dentro, leve, limita a tração; o autoblocante passa parte para a de fora */if(typeof rodasCargas==="function"){const cr=rodasCargas(d,1,aLatD);if(cr){const p=rodasParte(cr[0],cr[1]);trac0*=rodasTrac(p[0],p[1],RODAS4.LOCK_E);d.pR=p}}
    // fim de pista: se a saída está levando o carro para fora (velocidade lateral para a borda e pouca margem), o piloto alivia o acelerador
    // (a frente volta a carregar e segura a curva), como na vida real; quem erra de propósito (acelerar cedo) não alivia
    let trac=trac0;if(!thr&&!c.pit&&!c.ex){const sd=Math.sign(y)||1,vOut=(c.vy||0)*sd,marg=TRK_H-.9-Math.abs(y);if(vOut>.25&&marg<1.4){const tt=Math.max(0,marg)/vOut;if(tt<.9)trac=trac0*clamp((tt-.15)/.75,0,1)}}if(thr&&aL>trac*.9){spinW=clamp((aL-trac*.9)/Math.max(1,trac),.3,1);aL=trac*.85}else aL=Math.min(aL,trac*.9)}
  if(lock>.05){d.lockT+=dt;bf*=.38}else d.lockT=Math.max(0,d.lockT-dt*2);if(spinW>.05)br*=.62;d.spinW=spinW;
  /* divisão da freada entre os eixos acompanha a carga (o balanço de freio do piloto e a pressão no pedal fazem isso no carro real) */let shF=.62*(d.kF||1)/(.62*(d.kF||1)+.38*(d.kR||1));/* alívio (sem pedal de freio): freio motor e recuperação do MGU-K seguram pelas rodas de trás */if(aL<0&&aL>-4&&!hard&&!brk&&!(v-vT>2.5)&&typeof MOTOR!=="undefined")shF=Math.min(shF,MOTOR.FREIO_MOTOR+Math.max(0,(d.satR||0)-.8)*1.5);/* mapa de freio motor: com a traseira perto do limite, a eletrônica tira o freio motor de trás */
  /* rodas (rodas4.js): a dianteira de dentro trava primeiro numa freada em curva; o diferencial cria um momento de guinada */let mzD=0;d.lockW=d.lockW||[0,0,0,0];d.lockW.fill(0);
  if(typeof rodasCargas==="function"&&!c.pit&&v>8&&!d.spin){const sg=aLatD>=0?1:-1,kz=Math.min(1,RODAS4.TR*Math.abs(kapP)/.03);
    if(aL<-1){const cf=rodasCargas(d,0,aLatD);if(cf){const tv=rodasTravaDentro(cf[0],cf[1],G,bf,Math.abs(aLatD),aL,shF),capIn=tv.capIn;
      let li=tv.li;
      // o piloto sente a roda de dentro chegando no limite e alivia o pedal; só trava quem freou tarde, pisou de vez ou chegou rápido demais
      if(li>0&&!late&&!dynCmd(c,"stamp"))li=0;/* o piloto modula o pedal no limite da roda de dentro (nos testes, aliviar a freada fazia chegar rápido demais e bater mais) */if(li>0){d.lockW[cf[2]]=li;bf*=1-.22*li;d.lockInT=(d.lockInT||0)+dt;if(li>.5&&R.fxq&&R.t-(c._lkT||-9)>.3){c._lkT=R.t;R.fxq.push({type:"puff",f,lat:y,t0:R.t,peq:1})}/* fumaça da travada */if(c.tyre&&!c.tyre.flat&&li>.5&&rnd()<RODAS4.CHATO){c.tyre.flat=.3+.4*li;if(c.hum)radio(c,"Travei a dianteira de dentro! Ponto chato no pneu.",{k:"pneus"})}}else d.lockInT=0}}
    // diferencial: acelerando, o travamento puxa força para a roda de dentro (mais lenta) e o carro resiste a virar; se a de dentro
    // não aguenta, o excesso vai para a de fora e empurra a traseira para fora; aliviando/freando, segura a traseira (estabiliza)
    const pR=d.pR||[.5,.5];if(aL>0){const capIn=pR[0]*2*G*br,dl=aL*RODAS4.LOCK_E*RODAS4.BIAS*kz,aIn=Math.min(aL/2+dl,capIn),aOut=aL-aIn;mzD=(aOut-aIn)*RODAS4.TR/2*sg}
    else if(aL<0){const aRb=-aL*(1-shF),dl=aRb*RODAS4.LOCK_C*RODAS4.BIAS*kz;mzD=-2*dl*RODAS4.TR/2*sg}}
  /* travada do eixo (freou tarde, pisou de vez): em curva é a dianteira de dentro que trava; em reta, as duas */if(lock>.05&&d.lockW&&typeof rodasRodaTravada==="function")for(const j of rodasRodaTravada(aLatD))d.lockW[j]=Math.max(d.lockW[j],lock);
  d.mzD=mzD;
  const AF=Math.sqrt(Math.max(0,(G*bf)**2-(aL<0?aL*shF:aL*.1)**2)),AR=Math.sqrt(Math.max(0,(G*br)**2-(aL<0?aL*(1-shF):aL)**2));
  // ---- rodada: o piloto não controla mais; o carro desliza pela inércia e o atrito vai parando o giro
  let aLat=0,under=0;
  if(d.spin){const sl=DYN.SLIDE*G*(.62+.38*Math.abs(Math.sin(d.beta)))+sf.drag;v=Math.max(0,v-sl*dt);d.r*=Math.exp(-dt*(DYN.CR+(v<12?2.4:0)+sf.drag*.15));d.r=clamp(d.r,-3.6,3.6);d.beta+=d.r*dt;aLat=0;
    if(v<.6){v=0;d.spin=false;d.r=0;d.wz=null;const ex=exStatus(c,"spin");ex.ph="stop";const nerv=c.st?c.st.nerv:30;ex.until=R.t+1.2+nerv*.012}}
  else{
    // satura o eixo que chega primeiro ao limite
    // um piloto sem erro não pede ao carro mais curva do que a traseira aguenta: ele abre a trajetória em vez de rodar.
    // sobresterço só aparece com perda real de aderência (erro, zebra, toque, poça, pneu) ou acelerando cedo demais
    // os pneus só alinham a carroceria com o movimento quando o carro anda (parado, quem gira o carro é a manobra de volta)
    if(!gl&&!thr&&!noc&&!out&&AR<AF)aLatD=aBk+clamp(aLatD-aBk,-AR*.99,AR*.99);/* com inclinação lateral, parte da curva vem da gravidade */
    // ---- carroceria com giro próprio (modelo de dois eixos): cada eixo faz força lateral pelo seu ângulo de deriva, até o pico do pneu;
    // a diferença entre o que a frente e a traseira fazem gira o carro (inércia de giro). O piloto esterça o volante para conseguir o giro
    // que a curva pede e contra-esterça quando a traseira escapa, com a rapidez da sua habilidade. Subesterço e sobresterço saem daí.
    const bi=dynBici(c,d,v,aLatD,AF,AR,dt,noc,out,gl&&gl.axle!=="f"?(gl.k||.5):1,aBk,mzD);aLat=bi.ay;d.ayA=aLat;d.fSat=!!bi.fSat;/* uso de cada eixo (0 a 1+): quanto do pneu está sendo pedido — é o que esquenta a superfície (pneu.js) */{const gF=Math.max(1,G*bf),gR=Math.max(1,G*br);const pk=BICI.AP,lF=Math.abs(aLat)/gF,lR=Math.abs(aLat)/gR;/* metade pela força pedida, metade pelo ângulo de deriva (quem escorrega mais esquenta mais) */d.uF=Math.hypot(v>6?.5*lF+.5*Math.abs(d.alF||0)/pk:lF,aL<0?aL*shF/gF:0);d.uR=Math.hypot(v>6?.5*lR+.5*Math.abs(d.alR||0)/pk:lR,aL<0?aL*(1-shF)/gR:aL*.6/gR)}under=Math.max(0,Math.abs(aLatD)-Math.abs(bi.ay))*(bi.fSat?1:0);
    if(Math.abs(d.beta)>.28&&!d.saveT)d.saveT=R.t;
    if(Math.abs(d.beta)>DYN.BETA_SPIN&&v>6){d.spin=true;d.nSpin=(d.nSpin||0)+1;d.spinT=R.t;d.r=(d.wz!=null?d.wz:(d.beta-(d.lastBeta||0))/dt+v*kap);d.r=clamp(d.r,-3.2,3.2);d.wz=null;exStatus(c,"spin",{dir:Math.sign(d.beta)});dynEvent(c,"spin")}
    else if(d.saveT&&Math.abs(d.beta)<.1){if(R.t-d.saveT<3)dynEvent(c,"save");d.saveT=0}}
  // ângulo de volante resultante (desenho e telemetria): curva pedida pelo eixo dianteiro, mais o contra-esterço contra a deriva
  d.steer=d.spin?-Math.sign(d.beta)*.42:clamp(d.delta||0,-.5,.5);
  {const axN=d.spin?0:(aL||0);d.ax=(d.ax||0)+(axN-(d.ax||0))*Math.min(1,dt/LOAD.TAU_X);d.ay=(d.ay||0)+((d.spin?0:aLat)-(d.ay||0))*Math.min(1,dt/LOAD.TAU_Y)}
  d.lastBeta=d.beta;d.under=under;d.lock=lock;d.satF=AF>0?Math.min(1.5,Math.abs(aLat)/AF):1;d.satR=AR>0?Math.min(1.5,Math.abs(aLat)/AR):1;
  if(lock>.3&&d.lockT>.12)dynEvent(c,"lock");if(spinW>.35&&v>8)dynEvent(c,"spinwheel");
  // marca de pneu quadrado por travada longa
  if(d.lockT>.35&&v>30&&c.tyre&&!c.tyre.flat){c.tyre.flat=1;recalc(c);if(c.hum)radio(c,"Travei e marquei o pneu: está vibrando.",{k:"rodada"})}
  // ---- longitudinal efetivo (com atrito de superfície fora da pista)
  if(!d.spin){v=v+(aL-gS)*dt;v-=sf.drag*dt*(v>1?1:0);v=Math.max(0,v)}else if(gS&&v>1)v=Math.max(0,v-gS*dt);/* a rampa age sempre */
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
  {const c0=d.chi;d.chi=clamp(d.chi,-1.55,1.55);d.beta+=c0-d.chi}
  if(rev){ds=-1.6*dt;dy=rev.dir*1.6*dt}
  if(o.sMax!=null){const sm=(o.sMax-c.prog)*L;if(ds>sm){ds=Math.max(0,sm);v=Math.min(v,ds/dt)}}
  c.prog+=ds/L;let ny=y+dy;
  // o carro parado depois de rodar gira de volta para a direção da pista (manobra), sem andar
  if(c.ex&&c.ex.ph==="rejoin"&&Math.abs(d.beta)>.12&&v<4){const t=Math.sign(d.beta)*Math.min(Math.abs(d.beta),dt*1.6);d.beta-=t}
  // ---- muro ou barreira: impacto pela velocidade que vai contra o muro
  let s=Math.sign(ny)||1,wl=wallM(c,s),fixW=false;if(!d.quinaHit)d.quinaT=0;d.quinaHit=false;
  /* carro já do lado de fora do muro (empurrado num toque): volta para o lado de dentro sem "bater de frente" a cada passo (antes ficava preso ali para sempre) */
  if(!c.pit&&Math.abs(y)>wl-CARW/2+.4&&Math.sign(y)===s){const w0=wallM({prog:c.prog-ds/L,y},s);if(Math.abs(y)>w0-CARW/2+.4){ny=s*(Math.min(w0,wl)-CARW/2-.05);c.y=ny;fixW=true;s=Math.sign(ny)||1;wl=wallM(c,s)}}
  // o muro avança para dentro na frente do carro (quina, fim de área de escape): batida de frente, o carro para onde está (sem ser levado de lado)
  if(!c.pit&&!fixW&&Math.abs(ny)>=wl-CARW/2&&Math.abs(y)>wl-CARW/2+.4&&Math.sign(y)===s&&ds>0){c.prog-=ds/L;ny=Math.abs(y+dy)<Math.abs(y)?y+dy:y;/* devagar, encostado na quina: o piloto manobra para longe do muro (antes ficava batendo de frente para sempre; só depois de ~2 s encostado) */d.quinaT=(d.quinaT||0)+dt;d.quinaHit=true;if(v<3&&!d.spin&&d.quinaT>2&&Math.abs(ny)>=Math.abs(y)-.01)ny=y-s*dt*1.5;const imp=v*Math.abs(Math.cos(d.chi));v=v*.12;d.beta+=d.chi;d.chi=0;/* a carroceria não gira pelo muro mudar a direção do movimento */d.r+=-s*clamp(imp*.02,0,1.2);
    if(!c.ex)exStatus(c,imp>8?"crash":"off",{dir:s,ro:R.C.street?"muro":"barreira"});c.y=ny;c.v=v;c.vy=0;exWall(c,imp,v);if(!running(c)){d.frozen=v<.3;return}}
  else if(Math.abs(ny)>=wl-CARW/2&&!c.pit){const vyIn=Math.abs(v*Math.sin(d.chi));const imp=vyIn+v*.07*Math.min(1,Math.abs(Math.sin(d.beta))+.3);ny=s*(wl-CARW/2);
    const vl=v*Math.cos(d.chi)*.62,vt=-v*Math.sin(d.chi)*.25;v=Math.hypot(vl,vt);{const c0=d.chi;d.chi=v>.3?Math.atan2(vt,Math.max(.1,vl)):0;d.beta+=c0-d.chi}d.r+=-s*clamp(imp*.06,0,1.6);if(imp>3)d.beta+=-s*clamp(imp*.012,0,.5);
    if(!c.ex)exStatus(c,imp>8?"crash":"off",{dir:s,ro:R.C.street?"muro":"barreira"});c.y=ny;c.v=v;c.vy=v*Math.sin(d.chi);exWall(c,imp,v);if(!running(c)){d.frozen=v<.3;return}}
  /* velocidade nesta volta em cada ponto (comissários comparam com a volta anterior) */if(!c.pit&&!c.ex&&R.started&&!R.sc){const N=R.geo.N,ii=Math.floor(fr(c.prog)*N)%N;if(!c._vl||c._vl.length!==N)c._vl=new Float32Array(N);if(!(R.yellows&&R.yellows.length&&typeof inZone==="function"&&R.yellows.some(q=>q.until>R.t&&inZone(fr(c.prog),q.a-.02,q.b+.01))))c._vl[ii]=v}
  c.y=ny;c.v=v;c.vy=v*Math.sin(d.chi);c.acc=(v-vp)/dt;c.psi=dynWrap(d.chi+d.beta);c.yaw=d.beta;
  // brita: entrada rápida e parada no fundo da caixa = atolado (causa física, não sorteio)
  // terra e grama grudam no pneu e saem aos poucos (~350 m de pista)
  if(c.tyre){const su=c.tyre.suja||0;let nv=su*Math.exp(-v*dt/350);if(sf.suja&&v>4)nv=Math.max(nv,sf.suja*Math.min(1,v/25));c.tyre.suja=nv>.01?nv:0;
    if(c.hum&&nv>.45&&su<=.45&&R.t-(d.sujaT||-99)>30){d.sujaT=R.t;radio(c,`${G.engineer||"Engenheiro"}: "Pneus sujos de ${c._sw&&c._sw.includes("brita")?"brita":"grama"}. Cuidado nas próximas curvas até limpar."`)}}
  // poeira levantada pelas rodas na brita (só desenho)
  if(c._sw&&v>10&&c._sw.includes("brita")&&R.t-(d.poT||0)>.3){d.poT=R.t;R.fxq.push({type:"dust",f:fr(c.prog),lat:c.y||0,t0:R.t})}
  if(sf.s==="brita"){if(!d.gravV)d.gravV=vp;if(v<.4&&Math.abs(ny)>TRK_H+6&&d.gravV>34&&!c.pit){d.gravV=0;exStuck(c);return}}else d.gravV=0;
  // limites de pista pela posição real: centro do carro a mais de 1 m da linha branca (as quatro rodas fora) numa curva
  {const ay0=Math.abs(ny),gi=Math.floor(fr(c.prog)*R.geo.N)%R.geo.N;/* limites de pista como na F1: as quatro rodas inteiras além da linha branca, do mesmo lado */const ps=c.psi||0,cs=Math.cos(ps),sn=Math.sin(ps),sd=Math.sign(ny)||1,fora=DYN.WHL.every(([u,w])=>(ny+u*sn+w*cs)*sd>TRK_H+.19);
    if(!c.ex&&!c.pit&&!push&&R.started&&fora&&ay0<TRK_H+2.6&&R.geo.ai.ph[gi]!==0&&R.t-(d.tlT||0)>8){d.tlT=R.t;R.nTL=(R.nTL||0)+1;if(typeof trackLimit==="function")trackLimit(c)}}
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
