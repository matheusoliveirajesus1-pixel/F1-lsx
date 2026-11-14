// ===================== MECÂNICA: TEMPERATURAS, DESGASTE E QUEBRAS PELO USO; EQUIPE DE BOX; MEDIDOR DE RISCO =====================
// Motor, freios e câmbio têm temperatura e saúde. Quebra é consequência: calor por muito tempo, zebras, câmbio maltratado,
// e quase sempre dá sinal antes (o engenheiro avisa). Só a parte elétrica/hidráulica ainda quebra raramente sem aviso.
const DEV_SIDE={cool:{eng:4,d:"Efeito colateral: o motor trabalha uns 4 °C mais quente; cuidado nas corridas de calor."},
  lowdrag:{brk:45,d:"Efeito colateral: menos arrasto ajuda menos a frear; freios uns 45 °C mais quentes."},
  floor:{kerb:1.35,d:"Efeito colateral: assoalho mais baixo sofre mais nas zebras."},
  weight:{gbx:1.15,d:"Efeito colateral: peças mais leves; o câmbio se desgasta um pouco mais."},
  brakes:{brk:-60,d:"Bônus: freios uns 60 °C mais frios."},relp:{rel:1,d:""}};
function sideOf(t,k){let v=k==="kerb"||k==="gbx"?1:0;for(const id of(t.inst||[])){const s=DEV_SIDE[id];if(!s||s[k]==null)continue;if(k==="kerb"||k==="gbx")v*=s[k];else v+=s[k]}return v}
// nível de realismo (só mexe no seu carro): casual perdoa, simulação cobra mais
const REAL={casual:{n:"Casual",d:"Seu piloto erra bem menos, danos e quebras pesam menos. Para curtir sem sustos.",risk:.5,dmg:.6,fail:.4},
  real:{n:"Realista",d:"Como a F1 de verdade: erros, toques e quebras na medida das estatísticas reais.",risk:1,dmg:1,fail:1},
  sim:{n:"Simulação",d:"Mais exigente: o carro escapa mais fácil e cobra cada exagero de temperatura e zebra.",risk:1.2,dmg:1.15,fail:1.3}};
function realK(c,k){if(!c||!c.isP||(typeof G!=="undefined"&&G&&G.mp))return 1;const r=REAL[(G&&G.settings&&G.settings.real)||"real"]||REAL.real;return r[k]}
function mcInit(c){const rel=(c.t.car&&c.t.car.rel)||85;c.mc={tEng:98,tBrk:420,hEng:clamp(1-rr(0,.08)-(95-rel)*.004,.6,1),hGbx:clamp(1-rr(0,.08)-(95-rel)*.004,.6,1),hBrk:1,warn:{},acc:0,relK:clamp(1.55-rel/100,.5,1)};const m=c.mc;
  // de vez em quando uma peça já sai da fábrica fraca: a telemetria mostra e o engenheiro avisa logo no começo
  if(rnd()<.03*m.relK)m.hEng=rr(.15,.4);if(rnd()<.02*m.relK)m.hGbx=rr(.15,.34)}
// a cada ~0,25 s
function mcTick(c,dt0,ph){const m=c.mc;if(!m)return;m.acc+=dt0;if(m.acc<.25)return;const dt=m.acc;m.acc=0;const t=c.t,f=realK(c,"fail");
  const heat=(TRK_HEAT[R.C.id]||1),sc=!!R.sc||!!R.red;
  // motor: ambiente, ritmo, energia, ar sujo, upgrade
  const tgtE=sc?96:104+(heat-1)*22+({attack:4,normal:0,save:-4}[c.mode]||0)+({attack:3,save:-2}[c.ers]||0)+(c.heat||0)*9+sideOf(t,"eng")+(c.dmg.body||0)*4;
  m.tEng+=(tgtE-m.tEng)*Math.min(1,dt/22);
  // freios: esquentam na freada, esfriam nas retas (menos atrás de outro carro)
  if(ph===1&&!sc)m.tBrk+=dt*c.v*(3.2+sideOf(t,"brk")/80)*(1+(c.heat||0)*.25)*(c.mode==="attack"?1.1:1)*(R.w>.4?.8:1);else m.tBrk+=(300-m.tBrk)*Math.min(1,dt*.12*(1-(c.heat||0)*.3));
  m.tBrk=clamp(m.tBrk,300,1350);c.brakeHot=m.tBrk>1060?1:0;
  // desgaste pelo uso
  // corridas curtas concentram o desgaste de uma corrida inteira (como os erros)
  const rk=m.relK*f*(R.riskK||1);m.hEng-=dt*rk*(.00007*({attack:1.3,normal:1,save:.6}[c.mode]||1)+Math.pow(Math.max(0,m.tEng-124),1.6)*.00011);
  m.hBrk-=dt*rk*Math.pow(Math.max(0,m.tBrk-980),1.3)*.000005;
  const ex=m.lph===2&&ph===0;m.lph=ph;
  if(ex)m.hGbx-=rk*.0011*(1.45-(c.d.a.gear||75)/100)*(c.dmg.gear?2:1)*sideOf(t,"gbx");
  // zebras no modo ataque: pancadas no assoalho e na suspensão
  if(ex&&c.mode==="attack"&&rnd()<.03*(1.5-(c.d.a.kerb||75)/100)*sideOf(t,"kerb")){kerbHit(c,.6)}
  mcSymptoms(c);mcWarn(c)}
function kerbHit(c,k){const f=realK(c,"dmg");c.dmg.floor=Math.min(1,(c.dmg.floor||0)+.035*k*f*sideOf(c.t,"kerb"));c.dmg.susp=Math.min(1,(c.dmg.susp||0)+.015*k*f);if(c.mc)c.mc.hGbx-=.01*k;
  if(c.hum&&rnd()<.5)radio(c,pick(["Pancada forte na zebra!","Peguei a zebra com tudo, sentiu o assoalho?"]),{me:1,k:"zebras"})}
// sintomas antes da quebra: perda de potência, câmbio falhando, freio fraco
function mcSymptoms(c){const m=c.mc;
  if(m.hEng<.3&&!c.dmg.power){c.dmg.power=clamp((.3-m.hEng)*2.2,.15,.6);recalc(c);if(c.hum)radio(c,"Estou perdendo potência! O motor não está entregando tudo.",{pause:true,k:"motor"})}
  if(m.hGbx<.22&&!c.dmg.gear){c.dmg.gear=.5;recalc(c);if(c.hum)radio(c,"O câmbio está pulando marchas!",{pause:true,k:"cambio"})}
  const fh=(h,lim)=>h<lim?(lim-h)*.12:0;// risco de quebra por segundo
  const pE=fh(m.hEng,.1),pG=fh(m.hGbx,.07),pB=fh(m.hBrk,.12);
  if(pE>0&&rnd()<pE*.25){c.mcFail="Motor";mechFail(c,"Motor");return}
  if(pG>0&&rnd()<pG*.25){c.mcFail="Câmbio";mechFail(c,"Câmbio");return}
  if(pB>0&&rnd()<pB*.25){brakeFail(c);return}}
function brakeFail(c){const f=fr(c.prog);rcMsg(`${c.code} perdeu os freios!`,"bad","freios");c.crashRo=R.C.street?"muro":"brita";c.crashFire=false;c.crashFast=.5;
  if(c.hum)radio(c,"PERDI O FREIO!",{pause:true,k:"freios"});narr(`${c.code} fica sem freio e vai reto!`,3);hlight("crash",[c],`${c.code} sem freios`,3);dnf(c,"Freios","crash");crowdEv(f,1);triggerSC(rnd()<.5?"sc":"vsc")}
// o engenheiro avisa antes (com tempo para você agir)
function mcWarn(c){if(!c.hum)return;const m=c.mc,w=m.warn,L=c.lap;const ok=(k,g)=>!(w[k]!=null&&L-w[k]<g);const eng=(G&&G.engineer)||"Engenheiro";
  if(m.tEng>127&&ok("eng",3)){w.eng=L;radio(c,`${eng}: "Motor a ${Math.round(m.tEng)} °C. Saia da esteira do carro da frente ou alivie: calor demais desgasta o motor."`,{k:"motor",sug:"save"})}
  else if(m.tBrk>1060&&ok("brk",3)){w.brk=L;radio(c,`${eng}: "Freios a ${Math.round(m.tBrk)} °C! Tire o pé mais cedo nas freadas por uma volta."`,{k:"freios"})}
  else if(m.hEng<.45&&ok("hEng",99)){w.hEng=L;radio(c,`${eng}: "Os dados mostram o motor sofrendo. Modo Poupar e nada de vácuo colado para chegar ao fim."`,{pause:true,k:"motor"})}
  else if(m.hGbx<.35&&ok("hGbx",99)){w.hGbx=L;radio(c,`${eng}: "Câmbio dando sinais: trocas mais lentas. Evite as zebras."`,{k:"cambio"})}
  else if(m.hBrk<.3&&ok("hBrk",99)){w.hBrk=L;radio(c,`${eng}: "Desgaste alto nos freios. Lift and coast nas freadas fortes."`,{k:"freios"})}}
// quebra elétrica/hidráulica: rara e sem aviso (a única que ainda é sorte)
function mcLap(c){const m=c.mc;if(!m)return;if(rnd()<.00022*m.relK*realK(c,"fail")*(R.riskK||1)){c.pendFail=Math.floor(c.prog)+rr(.05,.95)}}

// ---------- equipe de box
function crewOf(t){if(t.crew==null)t.crew=clamp(Math.round(72+(t.rep||70)/4+(t.rookieTeam?-6:0)+rr(-2,2)),70,97);return t.crew}
function pitTime(c,dbl){const cr=crewOf(c.t);const sig=.12+(100-cr)*.006;let t=2+(100-cr)*.022+Math.abs(gauss())*sig+(dbl?.3:0)+(R.sc?.15:0)+(R.w>.4?.2:0);let note="";
  // o piloto precisa parar exatamente na marca
  const a=c.d.a,prec=((a.brk||75)+(a.ctrl||75))/2,nv=c.st?c.st.nerv:25;if(rnd()<.03+(75-prec)/400+nv/800){const x=rr(.4,1.1);t+=x;note=`passou da marca (+${x.toFixed(1)}s)`}
  if(rnd()<(.006+(100-cr)*.0011)*(dbl?1.5:1)*(R.w>.4?1.3:1)){const x=rr(3,8);t+=x;note+=(note?", ":"")+`porca de roda travada (+${x.toFixed(1)}s)`}
  return{t,note}}
function crewAfterRace(){if(!G||!G.teams)return;for(const t of G.teams){const cr=crewOf(t);t.crew=clamp(+(cr+(t.rookieTeam?.45:.25)*(1-cr/100)*4+rr(-.15,.25)).toFixed(2),65,98)}}
// liberação: a equipe olha o pit lane; se vem carro, segura ou libera arriscando
function pitRelease(c){const PL=R.pitLane,P=c.pit;if(!P)return 0;const cr=crewOf(c.t);
  const near=R.cars.find(o=>o!==c&&o.pit&&o.pit.phase==="in"&&o.pit.s<P.gar&&P.gar-o.pit.s<26);
  if(!near)return 0;if(rnd()<(100-cr)/100*.55){c.pen+=5;c.penServe=true;rcMsg(`${c.code}: liberação insegura na frente de ${near.code}. Punição de 5 s.`,"warn","punicao");if(typeof stewReport==="function")stewReport(c,"5 s","liberação insegura no pit lane",`${near.code} vinha a ${Math.round(P.gar-near.pit.s)} m`);if(c.hum)radio(c,`Liberação insegura: soltaram o carro na frente do ${near.code}. 5 segundos de punição.`,{k:"punicao"});R.nUnsafe=(R.nUnsafe||0)+1;return 0}
  if(c.hum)radio(c,`Seguramos um instante para o ${near.code} passar no pit lane.`,{k:"pitlane"});return rr(.5,1.3)}

// ---------- medidor de risco (mesma conta do erro, sem o sorteio)
function riskInfo(c){if(!c||!R||!running(c)||c.pit)return{v:0,f:[]};const a=c.d.a,T=TYRES[c.tyre.c],w=wetAt(c);const f=[];
  const add=(k,x)=>{if(x>1.05)f.push([k,x])};
  const push={attack:1.7,normal:1,save:.55}[c.mode]||1;add(c.mode==="attack"?"ritmo de ataque":"",push);
  let ty=1;const cold=T.opt-14-c.tyre.temp;if(cold>0)ty*=1+cold*.07;if(c.tyre.wear>.7)ty*=1+(c.tyre.wear-.7)*4;if(c.tyre.grain||c.tyre.blister)ty*=1.3;if(c.tyre.punct)ty*=3;if(c.tyre.flat)ty*=1.2;add(cold>0?"pneus frios":"pneus gastos",ty);
  let wt=T.dry?1+w*w*40:(c.tyre.c==="I"?1+Math.abs(w-.45)*2.4:1+Math.max(0,.62-w)*2.6);if(!T.dry)wt*=1+w*.4;wt=Math.min(wt,9);add(T.dry&&w>.2?"pneu liso na pista molhada":"pista molhada",wt);
  const car=1+(c.dmg.wing||0)*.5+(c.dmg.floor||0)*.5+(c.dmg.susp||0)*.9+(c.dmg.rwing||0)*.5+(c.brakeHot?.5:0);add(c.brakeHot?"freios quentes":"carro danificado",car);
  const sv=(sk(c,"brk")+sk(c,"cor")+sk(c,"trc"))/3,sw=sk(c,"wet");const skill=Math.exp((80-(sv*(1-w)+sw*w))/17);
  const st=stateRisk(c),ex=expRisk(c);add("cabeça do piloto",st);add("pouca experiência",ex);
  const sp=1+(c.spray||0)*.35;add("spray",sp);const al=c.alongs&&c.alongs.length&&!R.sc?1.3:1;add("lado a lado",al);
  const v=push*ty*wt*car*skill*st*ex*sp*al*(R.sc||R.red?.12:1)*realK(c,"risk");f.sort((x,y)=>y[1]-x[1]);return{v,f:f.filter(x=>x[0]).slice(0,2).map(x=>x[0])}}
function riskLabel(v){return v<1.35?["Baixo","#21C55D"]:v<2.3?["Médio","#F5A524"]:v<4?["Alto","#FF7A00"]:["Muito alto","#FF4D4F"]}

// ---------- plano de energia
const EPLAN={norm:"Normal",main:"Na reta principal",end:"Tudo no fim"};
// multiplica a taxa de uso da bateria conforme o plano
function planK(c){const p=c.ersPlan;if(!p||p==="norm")return 1;const left=R.L-c.lap;
  if(p==="end")return left<=2?1.3:.9;
  const g=R.geo;if(!g.mainStr){let best=null;for(const cn of g.corners)if(!best||cn.pass>best.pass)best=cn;g.mainStr=best}
  const cn=nextCorner(c);return cn&&cn===g.mainStr?1.25:.88}
