// ===================== RISCO: ERROS DE PILOTAGEM PELO LIMITE =====================
// Em cada freada, entrada de curva e saída o piloto pode errar. A chance cresce com a margem que ele arrisca
// (ritmo, mergulho, defesa, lado a lado, ar sujo), com pneu frio ou gasto, pista molhada e danos, e cai com a habilidade.
// A gravidade depende da velocidade da curva, da área de escape (brita, asfalto, muro) e do controle do carro.
// Habilidades usadas (0 a 100). Enquanto não existem atributos próprios, saem dos atributos atuais do piloto.
function sk(c,k){const a=c.d.a;if(a[k]!=null)return a[k];
  switch(k){case"brk":return a.cons*.5+a.pace*.5;case"cor":return a.pace*.6+a.cons*.4;case"trc":return a.cons*.6+a.tyre*.2+a.pace*.2;
    case"ctrl":return a.wet*.35+a.mental*.3+a.cons*.35;case"craft":return a.ovt*.5+a.def*.5;default:return 75}}
// corridas curtas concentram os acontecimentos de uma corrida inteira
function riskK(){return clamp(1/Math.sqrt((G&&G.settings&&G.settings.dist)||.25),1,2)}
function riskCheck(c,ev,i){if(!R.started||c.pit||c.parked||c.vis||c.ex||c.lose>.5||!running(c))return;const AI=R.geo.ai,a=c.d.a,T=TYRES[c.tyre.c],w=wetAt(c);
  let push={attack:1.7,normal:1,save:.55}[c.mode]||1;
  if(ev==="brake"&&c.att&&c.att.commit)push*=(c.att.side===AI.insN[i]?2.3:1.5)*(c.att.go?1.25:1);// mergulho
  if(ev==="brake"&&c.defend)push*=1.4;
  if(c.goReq)push*=1.3;
  if(ev!=="brake"&&c.dirty)push*=1+.5*(c.dirtyK||0);
  if(ev==="brake"&&(c.tow||0)>.5)push*=1.15;// chega mais rápido na freada
  if(c.alongs&&c.alongs.length&&!R.sc)push*=1.3;// lado a lado
  let ty=1;const cold=T.opt-14-c.tyre.temp;if(cold>0)ty*=1+cold*.07;if(c.tyre.wear>.7)ty*=1+(c.tyre.wear-.7)*4;if(c.tyre.grain||c.tyre.blister)ty*=1.3;if(c.tyre.punct)ty*=3;if(c.tyre.flat)ty*=1.2;
  let wt=T.dry?1+w*w*40:(c.tyre.c==="I"?1+Math.abs(w-.45)*2.4:1+Math.max(0,.62-w)*2.6);if(!T.dry)wt*=1+w*.4;wt=Math.min(wt,9);
  const car=1+(c.dmg.wing||0)*.5+(c.dmg.floor||0)*.5+(c.dmg.susp||0)*.9+(c.dmg.rwing||0)*.5+(ev==="brake"&&c.brakeHot?1.5:0)+(ev==="exit"&&c.dmg.gear?.4:0);
  const sv=sk(c,ev==="brake"?"brk":ev==="apex"?"cor":"trc"),sw=sk(c,"wet");const skill=Math.exp((80-(sv*(1-w)+sw*w))/17);
  const B=c.behind,hunted=B&&running(B)&&c.dB<c.v*.8&&Math.abs(B.prog-c.prog)<.5&&B.t!==c.t;// rival colado atrás: mais chance de errar
  // cabeça do piloto (confiança, nervosismo, cansaço, frustração, foco), experiência e consistência
  const mind=(hunted?1.1+(1-(a.mental||75)/100)*.4:1)*(c.d.morale<40?1.15:1)*(c.d.trait==="agressivo"?1.12:c.d.trait==="cuidadoso"?.85:1)*stateRisk(c)*expRisk(c)*Math.exp((75-(a.cons||75))/45);
  const fat=1;
  if(contactRisk(c,ev,i,push))return;
  const p={brake:.0014,apex:.00106,exit:.00088}[ev]*(R.riskK||1)*push*ty*wt*car*skill*mind*fat*(R.sc||R.red?.12:1)*(inYellow(c)?.5:1)*(R.C.street?1.15:1)*(1+(c.spray||0)*.35)*offLineK(c,ev,i)*realK(c,"risk");
  if(rnd()<p)driverError(c,ev,i)}
function driverError(c,ev,i){const AI=R.geo.ai,w=wetAt(c);const cn=cornerAt(R.geo,i);const ro=(cn&&cn.ro)||(R.C.street?"muro":"asfalto");
  const vk=AI.vref[cn?cn.i:i]||40,fast=clamp((vk-28)/50,0,1);const ctrl=Math.exp((sk(c,"ctrl")-75)/22);
  const W={minor:1,off:(.17+fast*.15)*(ro==="muro"?.45:1),spin:(.042+w*.15+(ev==="exit"?.05:0)+(w>.3&&ev!=="brake"?w*.05:0))/ctrl,crash:(.016+fast*.035+w*.015)*({muro:2.3,brita:1,asfalto:.5}[ro]||1)/ctrl};
  let r=rnd()*(W.minor+W.off+W.spin+W.crash);let kind=(r-=W.minor)<0?"minor":(r-=W.off)<0?"off":(r-=W.spin)<0?"spin":"crash";
  // controle do carro e experiência: o piloto pode segurar o carro e o erro fica um nível menor
  let saved=false;if(kind!=="minor"&&rnd()<saveChance(c)){saved=true;kind={off:"save",spin:"off",crash:"spin"}[kind]}
  c.errs=(c.errs||0)+1;R.errLog=R.errLog||{minor:0,off:0,spin:0,crash:0,dnf:0,fire:0,beach:0};R.errLog[kind]=(R.errLog[kind]||0)+1;if(saved)R.errLog.saved=(R.errLog.saved||0)+1;if(c.isP){R.errMe=R.errMe||{};R.errMe[kind]=(R.errMe[kind]||0)+1}
  stEv(c,"err",kind==="save"?"minor":kind);if(saved)stEv(c,"save");errorOutcome(c,ev,kind,ro,fast,cn,saved)}
// disputa colada: erro de julgamento de espaço (fecha a porta e encosta) ou freada calculada errado atrás de outro carro
function contactRisk(c,ev,i,push){if(R.sc||R.red||inYellow(c)||!R.started)return false;
  const kc=Math.exp((70-sk(c,"craft"))/18)*(.6+c.aggr)*(R.riskK||1)*(c.lap<1?2.6:1)*(1+R.w*.8)*Math.min(push,2.5)*realK(c,"risk");
  if(ev!=="brake"&&c.alongs&&c.alongs.length){const L=R.geo.len;for(const o of c.alongs){if(!running(o)||o.pit||o.t===c.t&&rnd()<.6)continue;let ds=o.fs-c.fs;if(ds>L/2)ds-=L;if(ds<-L/2)ds+=L;
      if(Math.abs(ds)<CARL*.95&&Math.abs((o.y||0)-(c.y||0))<3.6){if(rnd()<.075*kc){c.squeeze={id:o.id,until:R.t+rr(.45,.85)};R.nSqz=(R.nSqz||0)+1;return true}break}}}
  if(ev==="brake"){const A=c.aheadO,dA=c.dAO;if(A&&running(A)&&!A.pit&&dA<CARL*2.2&&dA>CARL*.9&&Math.abs((A.y||0)-(c.y||0))<1.5&&rnd()<.05*kc*(c.dirty?1.3:1)*(c.att&&c.att.commit?1.5:1)){c.lateBrake={id:A.id,until:R.t+1.2};R.nLate=(R.nLate||0)+1;return true}}
  return false}
// fora da linha no fim da corrida tem sujeira (marbles): escorrega mais
function offLineK(c,ev,i){if(ev==="brake"||(R.marb||0)<.25)return 1;const off=Math.abs((c.y||0)-R.geo.line[i]*(c.lineK||1))>2.2;return off?1+R.marb*.6:1}
function crowdEv(f,a){if(!R)return;R.crowd=R.crowd||[];R.crowd.push({f:fr(f),t:R.t,a});if(R.crowd.length>30)R.crowd.shift()}
function trackLimit(c){if(R.sc)return;c.warn=(c.warn||0)+1;if(c.warn===3&&c.hum)radio(c,"Terceira advertência por limite de pista. Mais uma e vem punição!",{pause:false});
  if(c.warn>=4){c.warn=0;c.pen+=5;rcMsg(`${c.code}: 5s de punição por limites de pista.`,"warn","limites");if(c.hum)radio(c,"Recebemos 5 segundos por limites de pista.",{k:"limites"})}}
function errorOutcome(c,ev,kind,ro,fast,cn,saved){const f=fr(c.prog),out=sideAt(f),nm=cn?cn.n:"curva",pp=pos(c);const say=(t,o)=>{if(c.hum)radio(c,t,o||{})};const kk=1.6-(c.d.a.kerb||75)/100;
  if(kind==="save"){bubble(c,"Segurou!","pass",2.4);R.fxq.push({type:"puff",f,lat:c.y||0,t0:R.t});R.fxq.push({type:"skid",f,lat:c.y||0,t0:R.t,turn:.8});c.lose+=rr(.4,1.1);say(pick([`A traseira escapou na ${nm}, mas eu segurei!`,`Quase rodei na ${nm}! Segurei o carro.`]),{me:1,k:"limite"});if(pp<=8||c.hum)crowdEv(f,.55);return}
  if(kind==="minor"){
    if(ev==="brake"){bubble(c,"Travou!","bad",2.5);R.fxq.push({type:"puff",f,lat:c.y||0,t0:R.t});R.fxq.push({type:"skid",f,lat:c.y||0,t0:R.t,turn:.3});c.lose+=rr(.25,.7);
      if(rnd()<.22&&!c.tyre.flat){c.tyre.flat=1;recalc(c);say(`Travei na ${nm} e marquei o pneu: está vibrando.`,{k:"rodada"})}else say(`Travei na ${nm}, perdi um pouco.`,{me:1})}
    else if(ev==="apex"){bubble(c,"Alargou!","bad",2.5);exStart(c,"wide",{dir:out});if(rnd()<.3*kk)trackLimit(c);if(rnd()<.25*kk)kerbHit(c,.5);say(`Alarguei na ${nm}.`,{me:1})}
    else{bubble(c,"Patinou!","bad",2.2);R.fxq.push({type:"puff",f,lat:c.y||0,t0:R.t});c.lose+=rr(.2,.55);c.tyre.wear=Math.min(1,c.tyre.wear+.004);say(`A traseira escapou na saída da ${nm}.`,{me:1})}
    if(pp<=6||c.hum)crowdEv(f,.35);return}
  if(kind==="off"){
    if(ro==="brita"){bubble(c,"Foi para a brita!","bad",3.5);exStart(c,"off",{dir:out,ro:"brita",fast});R.fxq.push({type:"dust",f,lat:out*12,t0:R.t});c.tyre.wear=Math.min(1,c.tyre.wear+.04);
      if(fast>.5){c.dmg.floor=Math.min(1,(c.dmg.floor||0)+.15);recalc(c)}
      addYellow(f,R.t+14);rcMsg(`${c.code} passou reto na ${nm} e foi para a brita.`,"warn","escape");say(`Fui para a brita na ${nm}! Voltei, mas perdi tempo.`,{k:"escape"})}
    else{bubble(c,"Passou reto!","bad",3);exStart(c,"off",{dir:out,ro:"asfalto"});R.fxq.push({type:"skid",f,lat:c.y||0,t0:R.t,turn:.6});if(ev==="brake"&&rnd()<.4*kk)trackLimit(c);say(saved?`A traseira escapou na ${nm}: segurei, mas passei reto pela área de escape.`:`Passei reto na ${nm} pela área de escape.`,{k:"escape"})}
    if(pp<=8||c.hum){narr(`${c.code} passa reto na ${nm}!`,2);hlight("spin",[c],`${c.code} escapa na ${nm}`,2)}crowdEv(f,.6);return}
  if(kind==="spin"){bubble(c,"Rodou!","bad",3.5);R.fxq.push({type:"puff",f,lat:c.y||0,t0:R.t});const d=rnd()<.5?1:-1;exStart(c,"spin",{dir:d});R.fxq.push({type:"skid",f,lat:c.y||0,t0:R.t,turn:d*4});
    c.tyre.flat=1;c.tyre.wear=Math.min(1,c.tyre.wear+.06);recalc(c);addYellow(f,R.t+18);
    const paint=R.w>.3&&ev!=="brake"&&rnd()<.4;if(paint&&c.hum)radio(c,`Pisei na faixa pintada molhada na ${nm} e a traseira foi embora.`,{me:1,k:"chuva"});
    rcMsg(`${c.code} rodou na ${nm}${paint?" ao pisar na faixa pintada molhada":""}! Bandeira amarela no local.`,"warn","amarela");narr(pick([`${c.code} RODOU na ${nm}!`,`Rodada de ${c.code}! Perdeu muito tempo.`]),2);hlight("spin",[c],`${c.code} roda`,c.isP?3:2);say(saved?`Rodei na ${nm}, mas por pouco não bati! Pneus marcados.`:`Rodei na ${nm}! Pneus marcados.`,{k:"rodada",pause:true});crowdEv(f,.8);return}
  // batida: o carro vai na direção do muro; a força do impacto decide se acaba ou se segue avariado
  bubble(c,"Perdeu o carro!","bad",3.5);R.fxq.push({type:"skid",f,lat:c.y||0,t0:R.t,turn:out*2});exStart(c,"crash",{dir:out,ro,fast});say(`Perdi o carro na ${nm}!`,{k:"rodada"});crowdEv(f,.8)}
