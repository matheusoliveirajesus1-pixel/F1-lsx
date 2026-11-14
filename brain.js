// ===================== CÉREBRO DO PILOTO =====================
// Uma só função de decisão para todos os carros (IA e jogadores). Roda 1 vez por segundo de corrida e decide o que é
// operação do carro: ritmo, energia (gasto, recarga e onde usar), asa móvel, ataque (quando e por qual lado), defesa,
// vácuo, economia de combustível e ajustes de freio e diferencial.
// Não sorteia nada: pesa o que cada opção ganha e arrisca com o estado real da simulação (distâncias, bateria, pneus,
// combustível, temperaturas, clima, bandeiras, voltas restantes, pista). A personalidade e a experiência mudam os pesos.
// O jogador (e cada jogador no multiplayer) só dá intenções: Ritmo e Disputas. O acaso fica nos erros de pilotagem (risk.js).

const INT_PACE=[["tyres","Cuidar dos pneus"],["bal","Equilibrado"],["push","Forçar"]];
const INT_RISK=[["safe","Evitar risco"],["norm","Normal"],["all","Tudo ou nada"]];
function intentOf(c){if(!c.intent)c.intent={pace:"bal",risk:"norm"};return c.intent}
// "Disputas" desloca a agressividade efetiva do piloto (usada no ataque, na defesa e nas manobras)
function intRiskK(c){const r=c&&c.intent&&c.intent.risk;return r==="safe"?-.18:r==="all"?.18:0}
// muda a intenção do piloto (jogador local, outro jogador no multiplayer ou resposta ao engenheiro)
function setIntentC(c,k,v,quiet){if(!c||!running(c))return;const I=intentOf(c);
  if(k==="pace"&&INT_PACE.some(o=>o[0]===v)&&I.pace!==v){I.pace=v;c.brT=0;if(!quiet)radio(c,{tyres:"Copiado, vou cuidar dos pneus.",bal:"Ritmo equilibrado.",push:"Entendido, vou forçar."}[v],{me:1})}
  if(k==="risk"&&INT_RISK.some(o=>o[0]===v)&&I.risk!==v){I.risk=v;c.brT=0;if(!quiet)radio(c,{safe:"Sem riscos: só passo quando for limpo.",norm:"Disputas normais.",all:"Tudo ou nada: vou arriscar nas brigas."}[v],{me:1})}}

// o que o piloto está fazendo agora (selo na tela). No convidado do multiplayer não há c.br: deduz do ritmo e da energia recebidos.
function brainNow(c){if(!c||!running(c))return"";if(c.pit)return"No box";if(R.red)return"Bandeira vermelha";if(R.sc)return R.sc.type==="vsc"?"Ritmo de safety car virtual":"Atrás do safety car";if(!R.started)return"No grid";
  if(c.br&&c.br.what)return c.br.what;const i=R.order.indexOf(c),A=R.order[i-1],B=R.order[i+1];
  if(c.ers==="attack"&&A)return`Atacando ${A.code}`;if(c.ers==="defend"&&B)return`Defendendo de ${B.code}`;return c.mode==="save"?"Poupando pneus":c.mode==="attack"?"Forçando":c.ers==="save"?"Recarregando a bateria":"Ritmo de corrida"}

// ---------- ajustes do carro feitos pelo próprio piloto (o acerto depende da experiência)
function brainCar(c){if(typeof ccInit!=="function")return;const cc=ccInit(c);const e=typeof dExp==="function"?dExp(c.d):{starts:50};
  // quanto menos experiente e técnico, mais longe do ideal (sempre o mesmo lado para o mesmo piloto: é o "jeito" dele)
  const tech=clamp(((c.d.a.brk||75)+(c.d.a.craft||75))/2,40,99),errK=clamp((85-tech)/60,0,.35)*Math.exp(-(e.starts||0)/120);
  let hs=0;for(const ch of String(c.d.id||c.id))hs=(hs*31+ch.charCodeAt(0))>>>0;const sgn=hs&1?1:-1;
  cc.bb=Math.round((bbOpt(c)+sgn*errK*1.6)*2)/2;cc.diff=errK>.3?0:diffOpt();
  // recarga na freada: normal; máxima só com bateria baixa, fora de briga e para quem segura a traseira
  const fight=c.br&&(c.br.gA<1.2||c.br.gB<1.2);cc.harv=(c.batt<25&&!fight&&(c.d.a.ctrl||75)>=78)?2:1;
  cc.aeroOpen=cc.aeroOpen&&!R.sc}

// ---------- decisão (1 vez por segundo)
function driverBrain(c){if(!running(c)||c.pit||R.over)return;const I=intentOf(c),a=c.d.a,P=c.d.pers||{aggr:50,disc:65},disc=P.disc/100;
  const i=R.order.indexOf(c),A=R.order[i-1],B=R.order[i+1];const ok=x=>x&&running(x)&&!x.pit;
  const gA=ok(A)?(A.prog-c.prog)*c.L:99,gB=ok(B)?(c.prog-B.prog)*c.L:99,left=R.L-c.lap;const ag=aggrEff(c,ok(A)?A:null);
  const advA=ok(A)?(A.Ls??A.L)-(c.Ls??c.L):0,advB=ok(B)?(c.Ls??c.L)-(B.Ls??B.L):0;// >0: eu sou mais rápido que A / B é mais rápido que eu
  const neutral=!!R.sc||!!R.red||!R.started||(R.yellows&&R.yellows.length&&typeof inYellow==="function"&&inYellow(c));
  const dry=COMP[c.tyre.c].dry,wetBad=dry&&R.w>.35;
  // projeção do pneu até a próxima parada prevista
  const st=c.plan&&c.plan.stops&&c.plan.stops[c.planIdx];const stintLeft=dry?(st?Math.max(1,st.lap-c.lap):left):left;const proj=c.tyre.wear+wearRate(c)*stintLeft;
  // combustível: sobra real (em voltas de consumo) até a bandeira, já descontando 1 kg para a amostra da FIA.
  // O carro larga com o justo: sobra perto de zero é o normal; só abaixo de zero é preciso tirar o pé.
  const perLap=c.fuel0/R.L,leftF=R.qMode?2:Math.max(0,R.L-c.prog),/* classificação: o tanque é para a saída, a volta rápida e a entrada */fm=(c.fuel-1-perLap*leftF)/Math.max(.01,perLap);// distância contínua até a bandeira
  const mc=c.mc||{},engHot=(mc.tEng||0)>124||(mc.hEng!=null&&mc.hEng<.45)||(mc.hGbx!=null&&mc.hGbx<.32),brkHot=(mc.tBrk||0)>960||c.brakeHot;
  const b=c.br||(c.br={});b.gA=gA;b.gB=gB;
  // 1ª volta: todos colados e com o pneu frio. O piloto larga no ritmo normal e com a energia no automático,
  // sem forçar ataque nem defesa (a briga natural da largada continua pela pilotagem)
  const lap1=c.lap<1||R.t-(R.go||0)<25;
  // ===== ritmo: ganho de forçar × custo para pneu, combustível e mecânica
  let uA=0,uS=0,why="";
  if(gA<2.5)uA+=(2.5-gA)/2.5*.45+clamp(advA,0,1)*.55;// chegando no carro da frente (vale mais se eu for mais rápido)
  if(gB<1.2)uA+=(1.2-gB)*.35*(.5+ag);// segurando quem vem atrás pelo ritmo
  if(left<=3&&(gA<2||gB<1.5))uA+=.5;// fim de corrida com briga
  if(c.inLap||(c.pitExit&&R.t-c.pitExit<c.L*1.1))uA+=1.2;// volta de entrada/saída do box
  if(proj>.8){uS+=(proj-.8)*5;uA-=(proj-.8)*4}// o pneu não chega até a parada
  if(fm<-.05){uS+=1.4;uA-=1.2;why="fuel"}else if(fm<.1&&left>2)uA-=.3;// faltaria combustível: tirar o pé antes das freadas
  if(engHot){uS+=1.2;uA-=.8}if(brkHot)uA-=.8;
  if(gA>4&&gB>4)uS+=.25+(disc-.6)*.6+(c.d.trait==="pneus"||c.d.trait==="cuidadoso"?.25:0)-(I.pace==="push"?.3:0);// ar limpo: administrar
  if(wetBad)uA-=.6;
  if(I.pace==="push"){uA+=.45;uS-=.45}else if(I.pace==="tyres"){uS+=.55;uA-=.45}
  uA+=(ag-.5)*.5;uS+=(disc-.65)*.3+((a.tyre||75)-75)/200;
  let mode=c.mode||"normal";const enter=.62,leave=.4;
  if(neutral||lap1)mode="normal";
  else if(mode==="attack"){if(uA<leave||uS>uA+.2)mode=uS>enter?"save":"normal"}
  else if(mode==="save"){if(uS<leave||uA>uS+.2)mode=uA>enter?"attack":"normal"}
  else mode=uA>enter+.08&&uA>=uS?"attack":uS>enter?"save":"normal";
  if(mode!==c.mode){c.mode=mode;recalc(c)}
  // ===== energia: gasto, recarga e onde usar
  const skE=clamp(((a.ers||75)-75)/100,-.3,.25);// quem entende a bateria guarda e solta na hora certa
  const threat=ok(B)&&gB<.9&&((B.batt||0)>(c.batt||0)-5||B.ovMode||(B.tow||0)>.3||advB>.1);
  const opp=ok(A)&&gA<.9&&!neutral;let ers="auto";
  if(neutral)ers=(c.batt<92)?"save":"auto";
  else if(lap1)ers="auto";
  else if(c.batt<12-skE*10&&!(opp&&left<=1))ers="save";
  else if(c.ers==="save"&&c.batt<45&&!opp&&!threat)ers="save";// termina a recarga
  else if(opp&&c.batt>28-skE*20)ers="attack";
  else if(threat&&c.batt>18)ers="defend";
  else if(c.batt<30&&gA>1.5&&gB>1.5)ers="save";
  if(ers!==c.ers){c.ers=ers;ersK(c)}
  let plan="norm";if(!neutral){if(left<=6&&left>2&&(gA<1.6||gB<1.6)&&(a.ers||75)>=68)plan="end";else if(gA<1.2||gB<1)plan="main"}c.ersPlan=plan;
  // ===== ataque: comprometer-se com a próxima chance
  // valor da tentativa = vantagem real (ritmo, modo de ultrapassagem, vácuo, bateria) × perfil de risco
  b.atk=0;if(ok(A)&&!neutral&&!lap1&&A.t!==c.t&&gA<.75&&!c.crippled){
    let v=.25+clamp(advA,0,1)*.6+(c.ovMode?.22:0)+((c.tow||0)>.2?.1:0)+((c.batt||0)>(A.batt||0)+10?.12:0)+(R.C.ovt||.5)*.15+(ag-.5)*.5+intRiskK(c)*1.4
      -(c.tyre.wear>.7?.25:0)-(R.w>.4?.15:0)-(c.batt<25?.2:0)-(left>R.L*.8&&disc>.7?.1:0)-((A.d.a.def||75)-75)/150;
    b.atk=v;if(v>.85&&!c.goReq&&R.t-(c.goT||-99)>40&&R.t-(c.goTry||-99)>30){c.goReq=true;c.goReqT=R.t;c.goTry=R.t}}
  // por qual lado: frustrado atrás de quem fecha a porta → por fora (se sabe fazer curva de média); "evitar risco" → espera o lugar certo
  if(I.risk==="safe"||(disc>.75&&left>5&&b.atk<.6))c.atkStyle="wait";
  else if(ok(A)&&c.st&&c.st.frus>45&&(a.cor||75)>=70)c.atkStyle="out";
  else c.atkStyle="auto";
  // ===== defesa
  const defV=threat?.3+(ag-.5)*.6+(left<=3?.3:0)+intRiskK(c)*1.4+(typeof rivals==="function"&&ok(B)&&rivals(c,B)?.2:0)-(c.tyre.wear>.75?.2:0):-1;
  c.defOrd=!neutral&&!lap1&&ok(B)&&B.t!==c.t&&gB<.6&&defV>.45;
  // ===== o que mostrar
  b.what=c.goReq&&ok(A)?`Atacando ${A.code}`:c.defOrd&&ok(B)?`Defendendo de ${B.code}`:why==="fuel"?"Economizando combustível":mode==="save"?(engHot?"Poupando o motor":"Poupando pneus"):mode==="attack"?(ok(A)&&gA<2.5?`Caçando ${A.code}`:"Forçando"):c.ers==="save"?"Recarregando a bateria":"Ritmo de corrida";
  if(c.isP||c.hum)brainCar(c)}

// roda para todos os carros dentro do passo da simulação (ordem fixa: determinístico)
function brainTick(){if(!R.started||R.over)return;for(let k=0;k<R.cars.length;k++){const c=R.cars[k];if(!running(c)||c.pit)continue;if(c.brT==null)c.brT=R.t+(k%20)*.05;if(R.t>=c.brT){c.brT=R.t+1;driverBrain(c)}}}

// devolver posição exigida pelos comissários: decisão do piloto (disciplina, ritmo e voltas restantes), sem sorteio
function gbBrain(B,A){const disc=((B.d.pers||{}).disc??65)/100,left=R.L-B.lap,faster=(A.L-B.L);const risk=intRiskK(B);
  if(risk<0)return"gb_now";
  if(faster*left>7&&disc+(-risk)<.72)return"gb_keep";// dá para abrir 5 s antes da punição
  if(disc<.3&&risk>0)return"gb_keep";
  return(B.d.a.craft||75)>=78&&fr(B.prog)<.75?"gb_line":"gb_now"}
