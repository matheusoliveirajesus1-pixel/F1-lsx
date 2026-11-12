// ===================== ACIDENTES DE VERDADE, COMISSÁRIOS JUSTOS E REGRAS DA FIA =====================
// 1) Bandeiras pelo tamanho do acidente  2) carro quebrado fica onde parou (fumaça, fogo, guindaste)
// 3) desvio inteligente com ré  4) comissários: quem se mexeu para cima de quem, decisão na hora + pedido de revisão
// 5) regras: tempo máximo, pontos de corrida encurtada, classificado com 90%, desempate, advertências, multas,
//    bandeira preta e branca, bandeira preta, largada atrás do safety car na chuva, retardatários no safety car.
// ---------- 1) que bandeira o acidente pede
function accFlag(c,imp){const f=fr(c.prog),ay=Math.abs(c.y||0),onT=ay<TRK_H+1,block=ay<TRK_H-1.2;const live=(R.wrecks||[]).filter(w=>!w.removed&&Math.abs(w.lat||0)<TRK_H+1).length;
  // carro destruído conforme a força (aparece assim no lugar onde parou)
  dmgInit(c);const k=clamp((imp-8)/14,0,1);c.dmg.nose=Math.max(c.dmg.nose,.5+k*.5);const s=Math.sign(c.y||1);if(s>0)c.dmg.wingL=1;else c.dmg.wingR=1;if(k>.4){c.dmg.wingL=c.dmg.wingR=1}
  const wi=s>0?WHEEL.FL:WHEEL.FR;c.dmg.whl[wi]=1;if(k>.6&&c.dmg.off<0)c.dmg.off=wi;dmgSync(c);
  const big=imp>22||c.crashFire||(block&&imp>13)||live>=2;
  if(big){redFlag(`acidente de ${c.code}${c.crashFire?" com fogo":block?" bloqueando a pista":""}`);return}
  if(onT||imp>18||(R.C.street&&ay<TRK_H+3))triggerSC("sc");else if(ay<TRK_H+7||R.C.street)triggerSC("vsc");else addYellow(f,R.t+60,true)}
// ---------- 2) o carro quebrado fica exatamente onde parou
(function(){/* a criação do acidente agora é única (race.js makeWreck): o próprio carro, onde parou */
  if(typeof updWrecks==="function"){const uw=updWrecks;globalThis.updWrecks=function(){uw();for(const w of R.wrecks){if(w.removed||!w.smoke)continue;const age=R.t-w.t0;if(age>50||R.t<w.smokeT)continue;w.smokeT=R.t+.7;R.fxq.push({type:"smoke",f:w.f,lat:w.lat,t0:R.t})}}}})();
// ---------- 3) desvio: desvia se dá; se não, freia e desvia; se nem isso, freia tudo; bloqueado e parado: dá ré
(function(){if(typeof hazardAvoid!=="function")return;const base=hazardAvoid;
  globalThis.hazardAvoid=function(c){const r=base(c);if(!r||r.late)return r;const hz=c.hzSeen;
    if(r.yT!=null){// desvia, mas também tira velocidade se está perto
      const o=c.aheadO;let ttc=9,ttcOff=9;for(const x of R.phys||[]){if(x===c||!(x.ex||(x.v||0)<12))continue;const inPath=Math.abs((x.y||0)-r.yT)<=CARW+.6||Math.abs((x.y||0)-(c.y||0))<=CARW+.6;let d=fr(x.prog)*R.geo.len-fr(c.prog)*R.geo.len;if(d<0)d+=R.geo.len;if(d<60){const t=d/Math.max(1,(c.v||0)-(x.v||0));if(inPath)ttc=Math.min(ttc,t);else ttcOff=Math.min(ttcOff,t)}}
      // fora do caminho: tira o pé de leve (o carro rodado pode voltar para a pista), sem ir a passo de tartaruga
      if(ttcOff<1.8&&ttc>=1.8){const cap=Math.max(22,(c.v||0)*clamp(ttcOff/2,.75,.95));r.cap=r.cap!=null?Math.min(r.cap,cap):cap}
      if(ttc<1.8){const cap=Math.max(10,(c.v||0)*clamp(ttc/2,.45,.95));r.cap=r.cap!=null?Math.min(r.cap,cap):cap}c.emergT=R.t+1}
    else if(r.cap!=null){c.emergT=R.t+1;c.blockT=c.blockT||R.t}
    if(r.yT!=null){const Q=c.aheadO;const nose=Q&&((Q.v||0)<1||Q.ex)&&c.dAO<CARL+1.3&&(c.v||0)<.6;/* tem para onde ir, mas está de nariz encostado: precisa de ré para esterçar */c.blockT=nose?(c.blockT||R.t):0}return r}})();
function revStep(c,dt,v1){if(!R.started||c.pit||c.ex||!running(c)||R.sc||R.red){if(c.rev){c.rev=null;c.blockT=0}return null}/* a ré nunca fica ligada fora da pista, no box ou com bandeira (antes podia travar o carro para sempre) */
  if(c.rev){const a=R.t-c.rev.t0;if(a>2.2||fr(c.prog)<.004){c.rev=null;c.blockT=0;c.revCD=R.t+6;return null}return-1.6}// o movimento da ré é feito pelo núcleo de dinâmica (dyn.js lê c.rev)
  if(!c.blockT||(c.v||0)>1||R.t<(c.revCD||0)||R.t-c.blockT<1.4)return null;
  let near=null,nd=99;for(const o of R.phys||[]){if(o===c)continue;let d=fr(o.prog)*R.geo.len-fr(c.prog)*R.geo.len;if(d<0)d+=R.geo.len;if(d<nd&&d<12&&Math.abs((o.y||0)-(c.y||0))<CARW+1.2){nd=d;near=o}}
  if(!near)return null;const free=(c.y||0)>(near.y||0)?1:-1;c.rev={t0:R.t,dir:free};if(c.hum)radio(c,"Pista bloqueada! Dando ré para contornar.",{k:"escape"});rcMsg(`${c.code} dá ré para contornar o carro parado.`,"","escape");return-1.6}
// ---------- 4) comissários
(function(){if(typeof stewContact!=="function")return;const base=stewContact;
  globalThis.stewContact=function(rear,front,mode,E,g,sev){
    // carro rodado ou escapando: incidente de corrida (salvo quem volta à pista sem cuidado)
    const exA=rear.ex&&rear.ex.ph!=="rejoin",exB=front.ex&&front.ex.ph!=="rejoin";
    if(exA||exB){const avoider=exA?front:rear;const dbl=(R.yellows||[]).some(y=>y.dbl&&fr(avoider.prog)>=y.a&&fr(avoider.prog)<=y.b);
      if(dbl&&(avoider.v||0)>45&&!(avoider.emergT>R.t)){stewAdd({cul:avoider.id,vic:(exA?rear:front).id,clar:.8,why:"não reduzir sob bandeira amarela dupla",S:Math.max(1,sev[(exA?rear:front).id]||0),mode,E:+E.toFixed(1),at:R.t+18,kind:"contact",lap:Math.max(1,R.lead+1)});return}
      R.stewLog=R.stewLog||[];R.stewLog.push({cul:null,vic:null,clar:0,why:"carro rodado na pista",verdict:"Incidente de corrida",kind:"contact",lap:Math.max(1,R.lead+1)});return}
    // quem estava desviando de perigo não é culpado
    if((rear.emergT>R.t)&&mode==="long"&&(front.v||0)<15){R.stewLog=R.stewLog||[];R.stewLog.push({verdict:"Incidente de corrida",why:"desvio de emergência",kind:"contact"});return}
    const wasP=rear.isP||front.isP;const sv=R.mp;if(wasP)R.mp=true;// jogador também julgado na hora (não mais só no fim)
    try{base(rear,front,mode,E,g,sev)}finally{R.mp=sv}}})();
(function(){if(typeof stewAdd!=="function")return;const base=stewAdd;globalThis.stewAdd=function(inc){if(inc&&inc.kind==="contact"&&inc.clar!=null&&inc.clar<.58){R.stewLog=R.stewLog||[];R.stewLog.push(Object.assign(inc,{verdict:"Incidente de corrida"}));const c=R.cars.find(x=>x.id===inc.cul),v=R.cars.find(x=>x.id===inc.vic);
      if(c&&v&&(c.isP||v.isP))rcMsg(`Comissários: toque entre ${c.code} e ${v.code} analisado. Incidente de corrida, ninguém punido.`,"","punicao");return}return base(inc)}})();
(function(){if(typeof stewVerdict!=="function")return;const base=stewVerdict;
  globalThis.stewVerdict=function(s){const n0=(R.stewLog||[]).length;base(s);const c=R.cars.find(x=>x.id===s.cul),v=R.cars.find(x=>x.id===s.vic);if(!c)return;
    const why=s.why||"",ex=`Os comissários viram ${c.code} ${s.mode==="long"?"bater na traseira de":"se mover para cima de"} ${v?v.code:"outro carro"}${s.E?` (diferença de ${Math.round(s.E*3.6)} km/h)`:""}: ${why}.`;
    if(c.hum&&s.verdict&&s.verdict!=="Sem punição"){radio(c,`${G.engineer||"Engenheiro"}: "${ex} Decisão: ${s.verdict}."`,{k:"punicao"});
      if(c.isP&&!R.mp&&running(c)&&!s.reviewed)pushAsk({c,kind:"review",dur:14,inc:s,q:`${G.engineer||"Engenheiro"}: "Punição de ${s.verdict}. ${ex} Pedimos revisão aos comissários? Custa uma taxa de €2.000 e só muda se houver prova nova."`,opts:[["review","Pedir revisão"],["accept","Aceitar a punição"]],def:"accept"})}
    else if(v&&v.hum&&s.verdict==="Sem punição")radio(v,`${G.engineer||"Engenheiro"}: "${ex} Os comissários decidiram: sem punição."`,{k:"punicao"});
    // advertência conta para o ano (5 advertências, 4 de pilotagem = 10 posições no grid)
    if(s.verdict==="Sem punição"&&s.clar>.8&&c.d){c.d.repr=(c.d.repr||0)+1;if(c.d.repr>=5){c.d.repr=0;c.d.gridPen=(c.d.gridPen||0)+10;rcMsg(`${c.code} chegou à 5ª advertência do ano: perde 10 posições no grid da próxima corrida.`,"warn","punicao")}}}})();
(function(){if(typeof answerAskObj!=="function")return;const base=answerAskObj;
  globalThis.answerAskObj=function(a,k,auto){if(a&&a.kind==="review"){const s=a.inc;s.reviewed=1;if(k!=="review"){radio(a.c,"Entendido, aceitamos.",{me:1});return}
      if(G&&!G.mp)G.money=(G.money||0)-.002;const ok=s.clar<.78&&rnd()<.55;
      if(ok){const c=a.c;const pen=s.verdict==="10 s"?10:s.verdict==="5 s"?5:0;if(pen){c.pen=Math.max(0,c.pen-pen);s.verdict="Revogada na revisão"}rcMsg(`Comissários revisaram o lance de ${c.code} com as novas imagens: punição retirada.`,"good","punicao");radio(c,`${G.engineer||"Engenheiro"}: "Ganhamos a revisão! A punição foi retirada."`)}
      else{rcMsg(`Comissários: pedido de revisão de ${a.c.code} negado, não há prova nova.`,"","punicao");radio(a.c,`${G.engineer||"Engenheiro"}: "Revisão negada. A punição continua."`)}return}
    return base(a,k,auto)}})();
// ---------- 5) regras da FIA (rodadas a cada passo junto com as peças soltas)
function fiaInit(){if(R._fia)return;R._fia={L0:R.L,tLim:7200*clamp(R.L/Math.max(1,R.C.laps),.05,1),tTot:10800*clamp(R.L/Math.max(1,R.C.laps),.05,1),wetSC:false,unlap:null,bo:{}}}
function fiaTick(){if(!R||!R.started)return;fiaInit();const F=R._fia;if(!F.stall){F.stall=1;if(typeof ccStartStalls==="function")ccStartStalls()}
  // largada com chuva forte: corrida começa atrás do safety car
  if(!F.wetSC&&R.lead<1){F.wetSC=true;if(R.w>.68){triggerSC("sc");if(R.sc)R.sc.laps=2;rcMsg("Chuva forte: a corrida começa atrás do safety car.","warn","sc")}}
  // tempo máximo (2 h de corrida, 3 h no total com interrupção; proporcional à distância escolhida)
  const raceT=R.t-(R.go||0);if(!F.timeUp&&!R.finishing&&(raceT>F.tLim||raceT>F.tTot)){F.timeUp=true;R.L=Math.min(R.L,R.lead+1);rcMsg("Tempo máximo de corrida atingido: esta é a última volta.","warn","quadriculada")}
  // retardatários tiram a volta antes da relargada
  if(R.sc&&R.sc.type==="sc"&&!R.sc.unlap&&R.lead>=R.sc.start+R.sc.laps-1&&R.sc.laps>1){R.sc.unlap=1;const lead=R.order[0];if(lead){const run=R.order.filter(c=>running(c)&&!c.pit);
      const onLead=run.filter(c=>Math.floor(c.prog)>=Math.floor(lead.prog)-0);const tail=onLead[onLead.length-1];const lapped=run.filter(c=>Math.floor(c.prog)<Math.floor(lead.prog)&&c!==tail);
      // os retardatários andam de verdade: saem da fila pela esquerda, passam o pelotão e o safety car e dão a volta até o fim da fila (sem salto de posição)
      if(tail&&lapped.length){R.sc.unlapOn=true;R.sc.tailId=tail.id;lapped.forEach(c=>{c.unlap=R.t});
        rcMsg(`Retardatários liberados: ${lapped.map(c=>c.code).join(", ")} passam o safety car e vão para o fim da fila.`,"","sc")}}}
  if(R.sc&&R.sc.unlapOn){const tail=R.cars.find(x=>x.id===R.sc.tailId);let any=false;for(const c of R.cars){if(!c.unlap)continue;if(!running(c)||c.pit||!tail||!running(tail)||c.prog>=tail.prog-40/R.geo.len){c.unlap=null;continue}any=true}if(!any)R.sc.unlapOn=false}
  // bandeira preta e laranja ignorada vira bandeira preta (desclassificação)
  for(const c of R.cars){if(!running(c)||!c.bo)continue;F.bo[c.id]=F.bo[c.id]||c.lap;if(c.pit){c.bo=0;delete F.bo[c.id];continue}if(c.lap-F.bo[c.id]>=2){c.bo=0;c.status="dsq";c.why="bandeira preta (ignorou a preta e laranja)";rcMsg(`BANDEIRA PRETA para ${c.code}: não parou com a peça solta. Desclassificado.`,"bad","punicao");makeWreck(c,"stop")}}
  // detritos no radiador: o motor esquenta (encostar ao lado de outro carro ou ir ao box resolve)
  if(R.debris&&R.debris.length)for(const c of R.cars){if(!running(c)||c.pit||c.radBlk||rnd()>.0015)continue;const fs=fr(c.prog)*R.geo.len;if(R.debris.some(b=>{let d=b.fs-fs;if(d<0)d+=R.geo.len;return d<25&&Math.abs(b.y-(c.y||0))<2})){c.radBlk=R.t;dmgInit(c);c.dmg.cool=Math.min(1,c.dmg.cool+.25);if(c.hum)radio(c,`${G.engineer||"Engenheiro"}: "Pegamos um detrito na entrada do radiador! A temperatura sobe. Encoste ao lado de alguém para o vento tirar, ou vamos ao box."`,{k:"motor"})}}
  for(const c of R.cars){if(!c.radBlk||!running(c))continue;if(c.pit||((c.alongs||[]).length&&rnd()<.02)){c.radBlk=0;c.dmg.cool=Math.max(0,c.dmg.cool-.22);if(c.hum)radio(c,"Saiu! O detrito voou do radiador.",{k:"motor"})}}
  // refrigeração fechada demais em pista quente: o motor perde potência às vezes
  for(const c of R.cars){if(!c.hotK||!running(c)||c.pit)continue;if(rnd()<c.hotK*.0006){c.lose=Math.max(c.lose||0,.6);if(c.hum&&(!c._hotMsg||R.t-c._hotMsg>40)){c._hotMsg=R.t;radio(c,`${G.engineer||"Engenheiro"}: "Motor quente: está cortando potência. Poupe um pouco ou levante o pé no fim das retas."`,{k:"motor"})}}}
  // excesso de velocidade no pit lane: multa por km/h acima do limite
  for(const c of R.cars){if(!c.pit||c._pitSpd===c.pit)continue;c._pitSpd=c.pit;const disc=(c.d.pers||{}).disc??65;if(rnd()<(100-disc)*.0004){const kmh=ri(1,6);const eur=kmh*100;rcMsg(`${c.code}: excesso de velocidade no pit lane (${kmh} km/h acima). Multa de €${eur}.`,"","punicao");if(c.isP&&G&&!G.mp)G.money=(G.money||0)-eur/1e6}}}
(function(){if(typeof looseTick!=="function")return;const base=looseTick;globalThis.looseTick=function(){base();try{fiaTick()}catch(e){console.warn("fia",e)}}})();
// pontos de corrida encurtada, classificação com 90% e desempate (aplicados no resultado)
const SHORT_PTS=[[2,[]],[.25,[6,4,3,2,1]],[.5,[13,10,8,6,5,4,3,2,1]],[.75,[19,14,12,9,8,6,5,3,2,1]]];
(function(){if(typeof endRace!=="function")return;const base=endRace;globalThis.endRace=function(){const was=R.over;base.apply(this,arguments);if(was||!R.result||R.result.sprint)return;try{fiaResult(R.result)}catch(e){console.warn("fia",e)}}})();
function fiaResult(res){const F=R._fia||{L0:R.L};const cls=res.cls;
  // vistoria depois da corrida: prancha do assoalho gasta demais (carro baixo demais no acerto)
  {const me=R.cars.find(c=>c.isP);const e=me&&cls.find(x=>x.d===me.d.id&&x.status==="ok");if(e&&me.plankK>0&&rnd()<Math.min(.6,me.plankK*.22)){e.status="dsq";e.pos=null;e.pts=0;e.why="desgaste excessivo da prancha do assoalho (carro baixo demais)";rcMsg(`DESCLASSIFICADO: ${me.code} (prancha do assoalho gasta além do limite).`,"bad","punicao")}}const ok=cls.filter(e=>e.status==="ok");if(!ok.length)return;const wl=ok[0].laps||R.L;
  // 90%: quem abandonou depois de completar 90% das voltas do vencedor é classificado
  const cl90=cls.filter(e=>e.status==="dnf"&&e.laps>=Math.floor(wl*.9)).sort((a,b)=>b.laps-a.laps);
  cl90.forEach(e=>{e.status="ok";e.cl90=1;e.why=(e.why?e.why+" · ":"")+"classificado (90% da prova)";e.time=0});
  const fin=cls.filter(e=>e.status==="ok");const rest=cls.filter(e=>e.status!=="ok");fin.forEach((e,i)=>e.pos=i+1);
  // corrida encurtada (tempo máximo ou bandeira vermelha final): menos pontos
  const pct=wl/Math.max(1,F.L0);let table=POINTS;if(pct<.75){table=wl<2?[]:pct<=.25?SHORT_PTS[1][1]:pct<=.5?SHORT_PTS[2][1]:SHORT_PTS[3][1];res.shortened=Math.round(pct*100);rcMsg(`Corrida encurtada (${res.shortened}% da distância): pontuação reduzida, como no regulamento.`,"warn","quadriculada")}
  fin.forEach((e,i)=>e.pts=table[i]||0);res.cls=fin.concat(rest)}
// desempate do campeonato: mais vitórias, depois mais segundos lugares, e assim por diante
(function(){if(typeof standings!=="function")return;const base=standings;globalThis.standings=function(){const st=base();try{const pc={},tc={};
    for(const r of G.results.filter(r=>r.season===G.season&&!r.sprint))for(const e of r.cls){if(e.status!=="ok"||!e.pos)continue;(pc[e.d]=pc[e.d]||[])[e.pos]=((pc[e.d]||[])[e.pos]||0)+1;(tc[e.team]=tc[e.team]||[])[e.pos]=((tc[e.team]||[])[e.pos]||0)+1}
    const cb=(A,B)=>{for(let p=1;p<=30;p++){const x=((B||[])[p]||0)-((A||[])[p]||0);if(x)return x}return 0};
    st.drivers.sort((a,b)=>b.pts-a.pts||cb(pc[a.id],pc[b.id]));st.teams.sort((a,b)=>b.pts-a.pts||cb(tc[a.id],tc[b.id]))}catch(e){}return st}})();
