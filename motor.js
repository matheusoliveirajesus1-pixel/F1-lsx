// ===================== MOTOR, CÂMBIO E ENERGIA (unidade de potência 2026, simplificada) =====================
// Até aqui o carro "seguia" o perfil de velocidade: a potência só existia no planejamento (physics.js). Abaixo do perfil
// (depois de tirar o pé atrás de outro carro, numa disputa, saindo de uma rodada) o carro voltava a acelerar a até 16 m/s²
// em qualquer velocidade. Agora a aceleração passa pelo motor:
//  - motor a combustão com curva de potência pela rotação (8 marchas, troca no limite de giro): em marcha baixa e giro
//    baixo há menos potência; no giro de troca, a potência cheia
//  - MGU-K (elétrico, até 350 kW) com a bateria do carro: modo de energia do piloto, bateria vazia = só o motor a combustão
//    (o "clipping" no fim da reta sai daqui)
//  - arrasto aerodinâmico de verdade: a aceleração cai com o quadrado da velocidade; no vácuo o arrasto é menor e o carro
//    de trás ganha velocidade porque precisa de menos potência (não por um bônus)
//  - freio motor e recuperação de energia ao tirar o pé: a desaceleração vai para as rodas de trás (a traseira fica mais
//    solta quando o piloto alivia no meio da curva, como no carro real)
//  - câmbio avariado: trocas lentas e marchas puladas cortam a potência por um instante
const MOTOR={
  RPM_MAX:11800,// limite de giro (troca para cima)
  // curva de potência do motor a combustão pela fração do giro máximo (1 = potência máxima)
  curva(r){if(r>=.86)return Math.max(.9,1-3.2*(r-.96)*(r-.96));if(r>=.4)return .55+(r-.4)/(.46)*.42;return .55*Math.max(.15,r/.4)},
  TOW_ARR:.3,// redução de arrasto no vácuo cheio (−30%, colado; a 30 m ~−24%)
  MARG:1.05,// o carro real tem ~5% de folga sobre o que o piloto planeja (o perfil nunca fica fora do alcance do motor)
  CORTE:.05,// corte de potência numa troca normal (s): câmbio sem embreagem, quase imperceptível
  // fração do MGU-K (350 kW) despejada atacando ou no modo de ultrapassagem. Desligado (0): nos duelos de teste o carro chegava
  // rápido demais às freadas e ultrapassava menos; volta junto com a IA que busca o limite
  ATAQUE:0,
  FOLGA:5,// m/s² além da aceleração planejada naquele ponto, para recuperar pequenas perdas (ver motorFolga)
  // fração da desaceleração de alívio (sem pedal) que fica na dianteira; o resto é freio motor e MGU-K, nas rodas de trás.
  // Na freada de verdade o freio eletrônico (brake-by-wire) compensa e a divisão volta a seguir a carga
  FREIO_MOTOR:.55
};
// marcha e giro na velocidade v (m/s): a marcha mais curta que não passa do limite de giro
function motorMarcha(v){const kmh=v*3.6,G=PH.gears;let g=0;while(g<7&&kmh>G[g]*.985)g++;const rpm=Math.min(MOTOR.RPM_MAX,Math.max(4200,MOTOR.RPM_MAX*kmh/G[g]));return{gear:g+1,rpm}}
// fração da potência do motor a combustão disponível nessa velocidade (pela rotação na marcha engatada)
function motorCurvaV(v){return MOTOR.curva(motorMarcha(Math.max(1,v)).rpm/MOTOR.RPM_MAX)}
// potência total (W) disponível agora para o carro c na velocidade v
function motorPot(c,v){const ph=c.ph||{},d=c.dmg||{};const ice=PH.ice*(ph.pw||1)*motorCurvaV(v)*(1-.25*(d.power||0));
  // elétrico: a fração que o perfil planeja (c.dep) vezes o modo de energia de agora (c.depNow, de ai.js); bateria vazia: quase nada
  let fr_=(c.dep==null?.85:c.dep)*(c.depNow||1);
  /* modo de ultrapassagem (regra 2026: a menos de 1 s do carro da frente, energia extra) e ataque comprometido: o piloto despeja o elétrico nessa reta */
  // (2026: o carro que ataca despeja o elétrico e o que está colhendo energia fica para trás; a diferença chega a 20–30 km/h)
  if((c.ovMode||(c.att&&c.att.commit))&&(c.batt==null||c.batt>12)&&v>25){const fb=Math.max(fr_,MOTOR.ATAQUE);c._boost=fb-fr_;fr_=fb}else c._boost=0;
  let ers=PH.ers*Math.min(1,fr_)*(d.power?.4:1);if(c.batt!=null&&c.batt<4)ers*=.3;if(R&&(R.sc||R.red))ers*=.5;
  return ice+ers}
// força de arrasto (N) na velocidade v (com o vácuo do carro da frente e a asa móvel da reta)
function motorArrasto(c,v){const geo=R.geo,N=geo.N,i=Math.floor(fr(c.prog||0)*N)%N;const z=geo.zoneMask?geo.zoneMask[i]:0;const ph=c.ph||{};
  const cda=(z?PH.cdaStraight:PH.cdaCorner)*(ph.cd||1)*(1-MOTOR.TOW_ARR*Math.max(c.tow||0,c._towS||0));const rho=PH.rho*(typeof relRhoR==="function"?relRhoR():1);return .5*rho*cda*v*v}
// aceleração máxima que o motor dá agora (m/s², já descontado o arrasto; sem a rampa, que dyn.js trata à parte)
function motorAcel(c,v){const m=(c.ph&&c.ph.mass)||PH.mass,vv=Math.max(v,3);let P=motorPot(c,vv)*MOTOR.MARG;
  const s=c._mot;if(s&&s.corte>0)P*=s.corteK;return(P/vv-motorArrasto(c,vv))/m}
// estado de marcha por carro: detecta as trocas e aplica o corte (maior com câmbio avariado; às vezes pula marcha)
function motorPasso(c,v,dt){const s=c._mot||(c._mot={gear:1,rpm:4200,corte:0,corteK:1,trocas:0,puladas:0});const g=motorMarcha(Math.max(1,v));
  if(s.corte>0)s.corte-=dt;
  /* o vácuo não some no instante em que o carro sai de trás: o ar ainda está mexido por ~0,8 s (é aí que se completa a ultrapassagem) */c._towS=Math.max(c.tow||0,(c._towS||0)-dt/.8);
  if(g.gear>s.gear&&v>8){s.trocas++;const dg=(c.dmg&&c.dmg.gear)||0;let t=MOTOR.CORTE+.22*dg,k=.15;
    if(dg>.3&&rnd()<dg*.06){t=.45+.5*dg;k=0;s.puladas++;if(c.hum&&R.t-(s.avisoT||-99)>40){s.avisoT=R.t;radio(c,"O câmbio pulou marcha de novo!",{k:"cambio"})}}
    if(t>s.corte){s.corte=t;s.corteK=k}}
  /* a energia extra do ataque sai da bateria (4 MJ = 100%: 40 kJ por ponto) */if(c._boost>0&&c.batt!=null&&v>25)c.batt=Math.max(0,c.batt-c._boost*PH.ers/4e4*dt);
  s.gear=g.gear;s.rpm=g.rpm;return s}
// folga do piloto: o perfil é a volta que ele planeja; para recuperar pequenas perdas (uma saída de curva pior, um toque de
// freio atrás de outro carro) o carro tem até ~2,5 m/s² além da aceleração planejada naquele ponto — nunca os 16 m/s² de antes
function motorFolga(c,f){const p=c.prof;if(!p)return 0;const N=R.geo.N,i=Math.floor(fr(f)*N)%N,j=(i+1)%N,k=(c.k||1);const a=(p.v[j]*p.v[j]-p.v[i]*p.v[i])*k*k/(2*DS);return Math.max(0,a)+MOTOR.FOLGA}
