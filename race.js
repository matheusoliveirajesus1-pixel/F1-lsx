let R0K=1;
// ===================== FIM DE SEMANA E CORRIDA =====================
let W=null;
function raceLaps(id){return Math.max(5,Math.round(CIR[id].laps*G.settings.dist))}
function startWeekend(){const C=CIR[G.calendar[G.round]];const geo=buildCircuit(C.id);calibrate(geo);prepGeo(geo);
  W={track:C.id,C,geo,step:"practice",practice:{},quali:null,grid:null,setup:{},knowWear:false,laps:raceLaps(C.id),sprint:!!C.sprint};
  const laps=W.laps;const plan=[];
  if(rnd()<C.rain*1.5){const n=rnd()<.3?2:1;for(let i=0;i<n;i++){const s=Math.floor(rr(.05,.85)*laps),len=Math.max(2,Math.round(rr(.15,.45)*laps));plan.push({s,e:Math.min(laps+2,s+len),int:rnd()<.32?2:1})}}
  W.weather=plan;W.qualiRain=rnd()<C.rain*.7?(rnd()<.5?"all":"late"):null;
  G.teams.forEach(t=>teamDrivers(t).forEach(d=>{W.setup[d.id]=d.me?.55:rr(.55,.9)}));
  G.phase="weekend";return W}
function rainAt(lap){let r=0;for(const p of W.weather)if(lap>=p.s&&lap<p.e)r=Math.max(r,p.int);return r}
function forecast(){const laps=W.laps,acc=60+myTeam().rep/4+(W.knowWear?10:0);const out=[];const Rr=mulberry(hashS(W.track+G.season+G.round));
  for(let i=0;i<5;i++){const a=Math.floor(i*laps/5),b=Math.max(a+1,Math.floor((i+1)*laps/5));let hit=0;for(let l=a;l<b;l++)if(rainAt(l))hit++;
    const truth=hit/(b-a)>0?Math.min(.95,.55+hit/(b-a)*.45):.05;const err=(Rr()-.5)*(110-acc)/90;out.push({a:a+1,b,p:Math.round(clamp(truth+err,0,1)*100)})}return out}
function doPractice(focus){const me=ME();const msgs=[];W.rubber=clamp((W.rubber||0)+.3,0,1);const f0=famOf(me,W.C.id);addTrackLaps(me,W.C.id,{learn:90,setup:40,long:55,quali:35}[focus]||40);
  if(focus==="learn"){W.setup[me.id]=.6+rr(0,.07);msgs.push(`Você rodou muitas voltas aprendendo o traçado: conhecimento da pista de ${Math.round(f0*100)}% para ${Math.round(famOf(me,W.C.id)*100)}%. Menos erros e mais ritmo, mas o acerto ficou só no básico.`)}else
  if(focus==="setup"){W.setup[me.id]=clamp(.66+rr(0,.16)+(me.a.cons-70)/400,0,1);msgs.push(`Você trabalhou no acerto com os engenheiros: carro ${Math.round(W.setup[me.id]*100)}% acertado.`)}
  else if(focus==="long"){W.setup[me.id]=.6+rr(0,.08);W.knowWear=true;msgs.push("Você fez uma simulação de corrida com muito combustível: a equipe agora sabe quanto os pneus duram e a previsão do tempo ficou mais precisa.")}
  else{W.setup[me.id]=.62+rr(0,.08);W.qbonus=.12;msgs.push("Você treinou voltas de classificação com pneu macio e pouco combustível: vai chegar mais confiante na classificação.")}
  const geo=W.geo;const t=myTeam();const ph=carPhys(t,me);const p=speedProfile(geo,ph,tyreMu("S",0,0,null)*driverMu(me,true,0),4.2,geo.gk);
  let top=0;for(let i=0;i<geo.N;i++)top=Math.max(top,p.v[i]);msgs.push(`Melhor volta no treino: ${fmtT(p.t+rr(.4,1.1))} · velocidade máxima ${Math.round(top*3.6)} km/h.`);
  try{const r=techReport(),T=r.tel;msgs.push(`Comparação com ${r.refName}: ${Math.round(T.top[1])} km/h de máxima contra ${Math.round(T.top[0])}${T.fast?`; na ${T.fast.n} (a curva mais rápida), ${Math.round(T.fast.v[1])} contra ${Math.round(T.fast.v[0])} km/h`:""}${T.slow?`; na ${T.slow.n}, ${Math.round(T.slow.v[1])} contra ${Math.round(T.slow.v[0])} km/h`:""}.`)}catch(err){}
  if(focus!=="learn")msgs.push(`Conhecimento da pista: ${Math.round(famOf(me,W.C.id)*100)}% (${famLabel(famOf(me,W.C.id))}).`);
  W.practice={done:true,msgs};W.step="quali";save();return msgs}
// ---------- desempenho do piloto (fator de aderência)
function driverMu(d,quali,wet){const a=d.a;let p=quali?(a.pace*.4+a.quali*.6):a.pace;p+=(d.trait==="classificacao"&&quali?3:0);
  const w=(a.wet+(d.trait==="chuva"?6:0));const eff=p*(1-wet)+w*wet;return 1+(eff-85)*.0013+(d.morale-70)*.0001+Math.min(10,d.chem||0)*.0003}
function setupMu(id){return 1+((W.setup[id]||.6)-.6)*.025}
// ---------- classificação (física)
function qualiLap(d,t,sess,wet,risk){const geo=W.geo;const ph=carPhys(t,d);ph.mass=PH.mass+3;
  const mu=tyreMu(wet>.3?(wet>.7?"W":"I"):"S",wet,0,null)*driverMu(d,true,wet)*famMu(d,W.C.id)*setupMu(d.id)*(W.qb&&W.qb[d.id]?1+W.qb[d.id]*.01:d.me&&W.qbonus?1+W.qbonus*.01:1)*(1+sess*.0012)*({safe:.997,normal:1,risky:1.003}[risk]);
  let tm=speedProfile(geo,ph,mu,4.5,geo.gk).t+gauss()*(1.35-d.a.cons/100)*.42;
  const err={safe:.01,normal:.03,risky:.075}[risk]*(1+wet*2)*(d.trait==="agressivo"?1.3:1);if(rnd()<err)return null;return tm}
function doQuali(myRisk){W.rubber=clamp((W.rubber||0)+.22,0,1);if(!W.famDone){W.famDone=true;G.teams.forEach(t=>teamDrivers(t).forEach(d=>{if(!d.me||d.hum)addTrackLaps(d,W.C.id,50);addTrackLaps(d,W.C.id,12)}))}const cars=[];G.teams.forEach(t=>teamDrivers(t).forEach(d=>cars.push({d,t})));
  const rainAll=W.qualiRain==="all",rainLate=W.qualiRain==="late";const res={};let pool=cars.slice();const out=[];
  for(const[sess,keep]of[[1,16],[2,10],[3,0]]){const wet=rainAll?.65:(rainLate&&sess===3?.45:0);
    pool.forEach(c=>{const r=c.d.hum&&W.qRisk&&W.qRisk[c.d.id]?W.qRisk[c.d.id]:c.d.me||c.d.hum?(myRisk||"normal"):pick(["safe","normal","normal","risky"]);const tm=qualiLap(c.d,c.t,sess,wet,r);res[c.d.id]=res[c.d.id]||{};res[c.d.id]["q"+sess]=tm;if(tm==null)res[c.d.id]["e"+sess]=true});
    pool.sort((a,b)=>(res[a.d.id]["q"+sess]??999)-(res[b.d.id]["q"+sess]??999));
    if(keep){pool.slice(keep).forEach(c=>out.unshift(c));pool=pool.slice(0,keep)}else pool.forEach((c,i)=>out.splice(i,0,c))}
  const lv=r=>r.q3!==undefined?3:r.q2!==undefined?2:1;
  out.sort((a,b)=>{const ra=res[a.d.id],rb=res[b.d.id];const la=lv(ra),lb=lv(rb);if(la!==lb)return lb-la;return(ra["q"+la]??999)-(rb["q"+lb]??999)});
  let grid=out.map(c=>c.d.id);const pens=[];G.teams.forEach(t=>teamDrivers(t).forEach(d=>{if(!d.me&&!d.hum&&rnd()<.02){const n=pick([3,5,10]);const i=grid.indexOf(d.id);grid.splice(i,1);grid.splice(Math.min(grid.length,i+n),0,d.id);pens.push({id:d.id,n})}}));
  if(G.gridPen){const i=grid.indexOf(G.me);if(i>=0){grid.splice(i,1);grid.splice(Math.min(grid.length,i+G.gridPen),0,G.me);pens.push({id:G.me,n:G.gridPen,why:"três advertências"})}G.gridPen=0}
  W.quali={order:out.map(c=>({id:c.d.id,team:c.t.id,...res[c.d.id]})),pens,rain:W.qualiRain};W.grid=grid;W.pole=out[0].d.id;W.step="prerace";save();return W.quali}
function strategyPlans(){const L=W.laps;const hw=W.C.wear>1.15;
  return[{id:"A",n:"1 parada (Médio → Duro)",start:"M",stops:[{lap:Math.round(L*(hw?.38:.45)),c:"H"}]},
   {id:"B",n:"2 paradas (Macio → Médio → Macio)",start:"S",stops:[{lap:Math.round(L*.3),c:"M"},{lap:Math.round(L*.66),c:"S"}]},
   {id:"C",n:"1 parada (Duro → Médio)",start:"H",stops:[{lap:Math.round(L*(hw?.52:.58)),c:"M"}]}]}

// ---------- pit lane (centrado na linha de chegada; comprimento calibrado pela perda de tempo real do circuito)
const PIT_LIM=22.2;// 80 km/h
function pitLane(C,len){const D=clamp((C.pit-6.5)/(1/PIT_LIM-1/80),300,700);return{D,fe:1-D/2/len,fx:D/2/len,loss:C.pit}}
function garF(t){const ord=G.garage||GARAGE0;let i=ord.indexOf(t.id);if(i<0)i=G.teams.findIndex(x=>x.id===t.id);return .3+Math.max(0,i)*.036}
function scProg(){const l=R.order.find(c=>c.status==="run"&&!c.pit&&!c.parked);return l?l.prog+60/R.geo.len:null}
// ---------- corrida
let R=null;
function startRace(pre){R0K=riskK();// pre: {plan, tyre, fuel} do seu carro (a equipe decide o resto)
  const C=W.C,L=W.laps;const plans=strategyPlans();const geo=W.geo;
  R={tr:C,C,geo,L,t:0,pitLane:pitLane(C,geo.len),askQ:[],toast:null,cars:[],sc:null,w:0,rain:0,msgs:[],radio:[],fast:{t:999,c:null},over:false,lead:0,finishing:false,pause:null,order:[],ticks:0,flags:{},dsq:[],pitBusy:{}};
  R.w=rainAt(0)?.55:0;R.rain=rainAt(0);const fuelRace=78*L/C.laps;
  const byId={};G.teams.forEach(t=>teamDrivers(t).forEach(d=>{byId[d.id]={d,t}}));
  W.grid.forEach((id,i)=>{const{d,t}=byId[id];const me=d.me;const P=me?(pre||{}):(W.preBy&&W.preBy[id])||null;
    const wetStart=R.w>.3;let plan=P&&P.plan?plans.find(p=>p.id===P.plan):(()=>{const r=rnd();return plans[r<.62?0:r<.86?2:1]})();
    const tyre=wetStart?(R.w>.7?"W":"I"):(P&&P.tyre?P.tyre:plan.start);const fuelMul=P?{light:.99,normal:1.03,heavy:1.06}[P.fuel||"normal"]:rr(1.025,1.04);
    R.cars.push({id,d,t,isP:me,hum:me||!!d.hum,mate:t.drivers.includes(G.me)&&!me,col:t.c,col2:t.c2,code:d.code,num:d.num,grid:i+1,prog:-(i*8+4)/geo.len,gridLat:(i%2?-2.6:2.6),lap:0,tyre:{c:tyre,wear:0,temp:75,grain:0,blister:0,punct:false,age:0},
      used:[tyre],fuel:fuelRace*fuelMul+1.2,fuel0:fuelRace,mode:"normal",ers:"auto",dmg:{wing:0,rwing:0,floor:0,power:0,gear:0,susp:0,body:0},secCur:[null,null,null],secLast:[null,null,null],secPB:[null,null,null],secStart:0,cpCur:me?new Float32Array(101):null,cpNext:0,cpBest:null,pit:null,pitCall:null,pen:0,warn:0,
      status:"run",why:"",lapStart:0,lose:0,last:null,best:null,noise:0,stops:0,fin:null,cd:0,pass:null,passT:0,yieldTo:null,yieldT:0,
      auto:!(me||d.hum),plan,planIdx:0,setup:W.setup[id]||.6,L:C.target+3,dirty:false,errs:0,laps:[],sect:[0,0,0],sectBest:[null,null,null],v:0,ph:carPhys(t,d),ovMode:false,batt:100,q:-1})});
  aiPrep(geo);pistaInit();R.cars.forEach((c,i)=>{aiInit(c,i);stInit(c);mcInit(c)});R.touchCd={};R.prevRank=null;R.wetLaps=0;
  R.secBest=[null,null,null];R.bubbles=[];
  R.order=R.cars.slice();R.narr=[];R.hl=[];R.rec=[];R.recNext=0;R.asks=0;R.ask=null;R.leader=null;R.lastLapSaid=false;R.go=Infinity;R.started=false;R.form={phase:"out",t0:0};R.lightsStart=null;R.autoStart=true;/* largada automática: o tempo de reação do jogador vem da habilidade, como nos adversários */R.incidents=[];R.rb=[];R.rbNext=0;R.riskK=R0K;R.errLog={minor:0,off:0,spin:0,crash:0,dnf:0,fire:0,beach:0};R.crowd=[];R.touchCd={};R.wrecks=[];R.yellows=[];R.fxq=[];R.greenT=0;
  R.cars.forEach(c=>{c.slot=c.prog+1;c.v=0;recalc(c)});
  rcMsg(`Volta de apresentação em ${C.n}: os carros aquecem os pneus e voltam ao grid. Depois, cinco luzes vermelhas; quando apagarem, a corrida começa.`,"","largada");
  if(R.w>.3)rcMsg("Pista molhada na largada: todos com pneus para chuva.","","chuva");
  return R;
}
function formationStep(dt){const F=R.form,geo=R.geo,L=geo.len,N=geo.N;let all=true;
  R.cars.forEach((c,i)=>{if(!running(c))return;const A=i>0?R.cars[i-1]:null;const f=fr(c.prog),ix=Math.floor(f*N)%N;
    let vT=Math.min(speedAt(c,f)*.55,i===0?38:44);const dS=(c.slot-c.prog)*L;vT=Math.min(vT,Math.sqrt(2*4.5*Math.max(0,dS-.15)));
    if(A&&running(A)){const d=(A.prog-c.prog)*L,fd=clamp(dS*.2,6.8,16);vT=Math.min(vT,Math.max(0,A.v+(d-fd)/1.2))}// perto do grid, encosta no carro da frente (as posições ficam a 8 m)
    if(!c.dyn)dynInit(c);
    // zigue-zague nas retas para aquecer os pneus; perto do grid, volta para a posição de largada
    const zz=geo.ai.ph[ix]===0&&dS>420&&c.v>12;c.yT=zz?Math.sin(R.t*1.9+i*.9)*2.6:dS<450?c.gridLat:geo.line[ix]*.45;dynStep(c,dt,vT,true,false,c.yT,{amax:6,dmax:12,sMax:c.slot});
    c.tyre.temp+=((TYRES[c.tyre.c].opt-(zz?8:14))-c.tyre.temp)*dt/45;c.batt=Math.min(100,c.batt+dt*.4);
    if(dS>.5||c.v>.3)all=false});
  if(all)formationDone(2.5)}
function formationDone(wait){R.cars.forEach(c=>{if(c.slot!=null)c.prog=c.slot-1;c.v=0;c.y=c.gridLat;c.vy=0;c.tyre.temp=Math.max(c.tyre.temp,TYRES[c.tyre.c].opt-14)});
  R.form.phase="lights";R.lightsStart=R.t+wait;R.go=R.lightsStart+5+rr(.3,2.6);rcMsg("Todos no grid. Atenção às luzes!","","largada")}
function skipFormation(){if(R.form&&R.form.phase==="out")formationDone(1.2)}
// largada do jogador: toque quando as luzes apagarem
function tapLaunch(){if(R.mpGuest){mpTap();return}if(R.spect)return;const c=R.cars.find(x=>x.isP);if(!c||c.tapped||!R.form||R.form.phase!=="lights")return;c.tapped=true;
  if(!R.started){if(R.lightsStart!=null&&R.t>=R.lightsStart)R.jump=true;else c.tapped=false}else if(c.hold)releasePlayer(c,R.t-R.go)}
function releasePlayer(c,rt){c.hold=false;c.rt=rt;const eff=Math.max(.1,rt-.08);// desconta a latência da tela e do toque
  c.lose+=Math.max(0,(eff-.16)*1.35+Math.max(0,(80-c.d.a.start)*.008)+gauss()*.04);const s=rt.toFixed(3).replace(".",",");
  radio(c,rt<.26?`Largada perfeita! Reação de ${s} s.`:rt<.42?`Reação de ${s} s. Largada boa.`:`Reação lenta, ${s} s. Perdemos terreno.`,{me:1})}
// multiplayer: a reação medida na tela do outro jogador corrige a largada do carro dele
function remoteLaunch(c,rt,jump){if(!c||c.goDone||!running(c))return;c.goDone=true;
  if(jump){c.pen+=5;rcMsg(`${c.code} queimou a largada: 5s de punição.`,"warn","punicao");radio(c,"Queimamos a largada! Os comissários deram 5 segundos.",{pause:true,k:"punicao"});return}
  rt=clamp(+rt||1.4,.08,2);const eff=Math.max(.1,rt-.08),base=Math.max(.1,(c.rt||.2));const d=(eff-base)*1.35;c.lose=d>0?c.lose+d:Math.max(0,c.lose+d);c.rt=rt;const s=rt.toFixed(3).replace(".",",");
  radio(c,rt<.26?`Largada perfeita! Reação de ${s} s.`:rt<.42?`Reação de ${s} s. Largada boa.`:`Reação lenta, ${s} s. Perdemos terreno.`,{me:1})}
function launch(){R.started=true;R.cars.forEach(c=>{c.lapStart=R.go;c.secStart=R.go;
    if(c.isP&&!R.autoStart){if(R.jump){c.rt=.08;c.pen+=5;rcMsg(`${c.code} queimou a largada: 5s de punição.`,"warn","punicao");radio(c,"Queimamos a largada! Os comissários deram 5 segundos.",{pause:true,k:"punicao"})}else{c.hold=true;return}}
    const nv=c.st?c.st.nerv:20;const rt=clamp(.15+(90-c.d.a.start)*.004+Math.abs(gauss())*(.05+nv*.0009),.12,.6);c.rt=rt;c.lose+=Math.max(0,(rt-.16)*1.35+Math.max(0,(80-(c.d.a.start*.7+(c.d.a.gear||75)*.3)-(c.d.trait==='agressivo'?5:0))*.008)+gauss()*(.04+nv*.0006));recalc(c)});
  rcMsg(`Luzes apagadas! Começou o ${R.C.gp}: ${R.L} voltas.`,"big","largada");narr("E APAGARAM AS LUZES! Começa a corrida!",3);hlight("start",[R.cars[0]],"Largada",2);
}// os toques da primeira volta agora nascem da disputa de verdade (risk.js)
function narr(t,lvl){R.narr.unshift({lap:Math.max(1,R.lead+1),t,lvl:lvl||0,rt:R.t});if(R.narr.length>70)R.narr.pop()}
function hlight(type,cars,txt,imp){R.hl.push({t:R.t,type,cars:cars.map(c=>c.id),txt,imp:imp||1,lap:Math.max(1,R.lead+1)})}
function passLine(B,A,drs,pa){return pick([`${B.code} ${B.passWhy==="ov"?"aciona o modo de ultrapassagem e ":drs?"aproveita o vácuo na reta e ":""}mergulha por dentro de ${A.code}`,`${B.code} vem por fora, lado a lado com ${A.code}... e passa`,`Que manobra de ${B.code} em cima de ${A.code}`,`${A.code} não consegue segurar ${B.code}`])+(pa<=3?`: ${B.code} agora é o ${pa}º!`:"!")}
function record(){if(typeof carWorld!=="function"||typeof TRACKGEO==="undefined"||!TRACKGEO)return;const N=R.cars.length,a=new Float32Array(N*4+4);
  R.cars.forEach((c,i)=>{if(c.status==="dnf"||c.status==="dsq"){a[i*4+3]=0;return}const w=c._w||carWorld(c);a[i*4]=w.x;a[i*4+1]=w.y;a[i*4+2]=w.h;a[i*4+3]=1+(c._stopped?2:0)});
  if(R.scP!=null&&typeof scWorld==="function"){const p=scWorld();a[N*4]=p.x;a[N*4+1]=p.y;a[N*4+2]=p.h;a[N*4+3]=1}
  R.rec.push(a)}
// o engenheiro pergunta ao jogador (você é o piloto)
function pushAsk(a){a.dur=a.dur||15;a.until=R.t+a.dur;a.t0=R.t;if(a.c&&a.c.hum&&!a.c.isP){if(!a.c.rask){a.id=(R.askSeq=(R.askSeq||0)+1);a.until+=1.5;a.c.rask=a}return}if(!R.ask)R.ask=a;else if(R.askQ.length<2&&R.ask.kind!==a.kind&&!R.askQ.some(x=>x.kind===a.kind))R.askQ.push(a)}
function askTick(){for(const c of R.cars){const a=c.rask;if(a&&R.t>a.until){c.rask=null;const o=a.opts.find(x=>x[0]===a.def);radio(c,`Sem resposta pelo rádio: ${o?o[1].toLowerCase():"a equipe decidiu"}.`,{});answerAskObj(a,a.def,true)}}
  if(R.ask&&R.t>R.ask.until){const a=R.ask;const o=a.opts.find(x=>x[0]===a.def);radio(a.c,`Sem resposta pelo rádio: ${o?o[1].toLowerCase():"a equipe decidiu"}.`,{});answerAsk(a.def,true)}
  if(!R.ask&&R.askQ.length){const a=R.askQ.shift();if(R.t-a.t0<25){a.until=R.t+a.dur;R.ask=a}}}
function askDriver(c){const loc=c.isP;if((loc?R.ask:c.rask)||(loc?R.asks:(c.asksN||0))>=4||R.lead<2||R.finishing||R.sc||R.red)return;const i=R.order.indexOf(c),A=R.order[i-1],B=R.order[i+1];const mt=R.cars.find(x=>x!==c&&x.t===c.t&&!x.hum);const eng=G.engineer||"Engenheiro";
  if(mt&&B===mt&&running(mt)&&mt.L<c.L-.25&&(c.prog-mt.prog)*mt.L<1.2&&c.lap>R.L*.3)pushAsk({c,mate:mt,kind:"order",q:`${eng}: "${mt.code} está mais rápido atrás de você. A equipe pede: deixe ele passar."`,opts:[["let","Entendido, vou abrir"],["defend","Negativo, vou defender"],["race","Deixem a gente correr"]],def:"let"});
  else if(A&&running(A)&&!A.pit&&(A.prog-c.prog)*c.L<1.6&&c.L<A.L-.15&&c.mode!=="attack")pushAsk({c,A,kind:"push",q:`${eng}: "Você está ${(A.L-c.L).toFixed(1)}s por volta mais rápido que ${A.code}. Quer atacar agora ou guardar pneus?"`,opts:[["attack","Vou atacar"],["hold","Guardo para o fim"]],def:"hold"});
  else if(COMP[c.tyre.c].dry&&c.tyre.wear>.58&&!c.pitCall&&R.L-c.lap>3){const pp=pitPredict(c);pushAsk({c,kind:"feel",q:`${eng}: "Pneus em ${Math.round(c.tyre.wear*100)}%. Se pararmos agora você volta em ${pp?pp.pos:"?"}º. Como estão sentindo?"`,opts:[["box","Box, box! Não aguento mais"],["stay","Ainda tem borracha, vamos estender"]],def:"stay"})}
  else if(c.lap>R.L*.5&&c.fuel-c.fuel0/R.L*(R.L-c.lap)<1.6)pushAsk({c,kind:"fuel",q:`${eng}: "Combustível apertado. Precisamos de lift and coast nas freadas: tire o pé antes das curvas."`,opts:[["save","Copiado, vou economizar"],["ignore","Vou manter o ritmo"]],def:"save"});
  else return;if(loc)R.asks++;else c.asksN=(c.asksN||0)+1}
function answerAsk(k,auto){const a=R.ask;if(!a)return;R.ask=null;answerAskObj(a,k,auto)}
// resposta de outro jogador (multiplayer): só vale para a pergunta que ainda está aberta
function answerRemote(c,id,k){const a=c.rask;if(!a||a.id!==id||!a.opts.some(o=>o[0]===k))return;c.rask=null;answerAskObj(a,k,false)}
function answerAskObj(a,k,auto){const c=a.c;const boss=c.t.boss;
  if(a.kind==="giveback"){const said=a.opts.find(o=>o[0]===k);if(said&&!auto)radio(c,said[1],{me:1});gbDecide(c,a.A,k);return}
  const said=a.opts.find(o=>o[0]===k);if(said&&!auto)radio(c,said[1],{me:1});
  if(k&&k.startsWith("pit:")){if(running(c)&&!c.pit){c.pitCall=k.slice(4);if(a.kind==="plan")c.planIdx++;radio(c,`${G.engineer||"Engenheiro"}: "Copiado. Box nesta volta, ${COMP[c.pitCall].n.toLowerCase()} pronto."`)}return}
  if(k==="stay"&&(a.kind==="plan"||a.kind==="wear"||a.kind==="rain"||a.kind==="dry"||a.kind==="sc"||a.kind==="dmg"||a.kind==="comp")){c.lastAskLap=c.lap;return}
  if(k==="attack"){c.mode="attack";c.ers="attack";recalc(c)}
  else if(k==="hold"){c.mode="save";recalc(c);G.trust=clamp(G.trust+1,0,100)}
  else if(k==="box"){c.pitCall=COMP[c.tyre.c].dry?pickDry(R.L-c.lap):c.tyre.c}
  else if(k==="stay"){c.mode="save";recalc(c)}
  else if(k==="save"){c.mode="save";c.ers="save";recalc(c);G.trust=clamp(G.trust+1,0,100)}
  else if(k==="ignore"){G.trust=clamp(G.trust-1,0,100)}
  else if(k==="let"){c.yieldTo=a.mate.id;G.trust=clamp(G.trust+5,0,100);c.d.morale=clamp(c.d.morale-4,0,100);R.teamOrder={obeyed:true,mate:a.mate.code,lap:c.lap}}
  else if(k==="defend"||k==="race"){G.trust=clamp(G.trust-(k==="defend"?8:4),0,100);c.d.morale=clamp(c.d.morale+3,0,100);R.teamOrder={obeyed:false,mate:a.mate.code,lap:c.lap,soft:k==="race"};rcMsg(`${c.code} ignorou uma ordem de equipe pelo rádio!`,"warn");
    radio(c,`${boss}: "Conversamos depois da corrida."`,{})}}
// comandos de rádio do jogador
function cmdMode(m){cmdModeC(R.cars.find(x=>x.isP),m)}
function cmdModeC(c,m){if(!c||!running(c)||!{attack:1,normal:1,save:1}[m])return;stEv(c,"radio");c.mode=m;recalc(c);radio(c,{attack:"Vou forçar tudo agora.",normal:"Ritmo normal.",save:"Poupando pneus e combustível."}[m],{me:1})}
function cmdErs(m){cmdErsC(R.cars.find(x=>x.isP),m)}
function cmdErsC(c,m){if(!c||!running(c)||!{auto:1,attack:1,defend:1,save:1}[m])return;stEv(c,"radio");c.ers=m;ersK(c);radio(c,{auto:"Energia no automático.",attack:"Mapa de ataque: liberando toda a bateria.",defend:"Bateria guardada para defender.",save:"Recarregando a bateria."}[m],{me:1})}
function cmdGo(){cmdGoC(R.cars.find(x=>x.isP))}
function cmdGoC(c){if(!c||!running(c))return;stEv(c,"radio");if(R.sc||R.red||!R.started){radio(c,"Agora não dá: só depois da bandeira verde.",{me:1});return}c.goReq=true;c.goReqT=R.t;radio(c,"Entendido: vou tentar a ultrapassagem na próxima chance. Vou arriscar mais na freada.",{me:1,k:"duelo"})}
function cmdTow(){cmdTowC(R.cars.find(x=>x.isP))}
function cmdTowC(c){if(!c||!running(c))return;stEv(c,"radio");c.towReq=true;c.towReqT=R.t;radio(c,"Se alguém pegar o meu vácuo na próxima reta, eu mudo de linha.",{me:1,k:"vacuo"})}
function cmdBox(comp){cmdBoxC(R.cars.find(x=>x.isP),comp)}
function cmdBoxC(c,comp){if(!c||!running(c)||(comp&&!COMP[comp]))return;stEv(c,"radio");if(c.pit){radio(c,"Já estamos no pit lane.",{me:1});return}if(!comp){c.pitCall=null;radio(c,"Ficamos na pista.",{me:1});return}c.pitCall=comp;radio(c,`Box, box! Quero o ${COMP[comp].n.toLowerCase()}.`,{me:1});
  const d=pitDist(c);radio(c,`${G.engineer||"Engenheiro"}: "Copiado. ${d<150?"Já passou da entrada, box na próxima volta.":"Entrada do box em "+Math.round(d)+" metros."}"`)}
// distância (m) até a entrada do pit lane
function pitDist(c){const fe=R.pitLane.fe;let d=fe-fr(c.prog);if(d<0)d+=1;return d*R.geo.len}
function fr(p){return((p%1)+1)%1}
function inZone(f,a,b){a=fr(a);b=fr(b);return a<=b?f>=a&&f<=b:f>=a||f<=b}
function inYellow(c){if(!R.yellows.length)return false;const f=fr(c.prog);return R.yellows.some(y=>inZone(f,y.a,y.b))}
function addYellow(f,until,dbl,w){R.yellows.push({f,a:f-.022,b:f+.008,until,dbl:!!dbl,w})}
function sideAt(f){return typeof TRACKGEO!=="undefined"&&TRACKGEO&&TRACKGEO.outside?TRACKGEO.outside(f):1}
function makeWreck(c,kind){const f=fr(c.prog),s=sideAt(f);return makeWreckRaw(c,kind,f,s)}
function makeWreckRaw(c,kind,f,s){const ro=c.crashRo||(R.C.street?"muro":"brita");const far=kind==="crash"?(ro==="muro"?12.6:22+(c.crashFast||0)*9):kind==="beach"?12+rr(0,5):13;
  // o acidente é registrado onde o carro está: o carro continua sendo desenhado e simulado (dyn.js) até parar
  const w={c,code:c.code,col:c.col,col2:c.col2,f,f0:f,lat0:c.y||0,slide:.01,lat:c.y||0,_lw:c.y||0,ang:0,spin:0,real:true,smoke:kind==="crash"||kind==="beach",smokeT:0,t0:R.t,kind,ro,fire:kind==="crash"&&!!c.crashFire,removeAt:R.t+(kind==="crash"?rr(60,95):rr(30,50)),removed:false};
  if(w.fire)rcMsg(`Fogo no carro de ${c.code}! Os fiscais correm com os extintores.`,"bad","fiscais");if(kind==="crash"){R.fxq.push({type:"tyres",f:w.f,lat:w.lat,t0:R.t+1.2});w.okMsg=R.t+6}
  R.wrecks.push(w);addYellow(fr(w.f),1e9,kind==="crash",w);R.fxq.push({type:kind==="crash"?"debris":kind==="beach"?"dust":"smoke",f:kind==="crash"?f:w.f,lat:kind==="crash"?(c.y||0):w.lat,t0:R.t});
  rcMsg(kind==="crash"?"Bandeira amarela dupla no local do acidente: os pilotos devem reduzir bastante e não podem ultrapassar.":`Bandeira amarela: ${c.code} parou ao lado da pista.`,"warn",kind==="crash"?"dupla":"amarela");return w}
// VSC termina poucos segundos depois que o trecho é liberado; o safety car apaga as luzes na volta seguinte à limpeza
function scClearTick(){const S=R.sc;if(!S||R.red)return;const clear=R.wrecks.every(w=>w.removed)&&!(R.cars.some(c=>running(c)&&c.ex&&c.ex.ph==="stop"));
  if(S.type==="sc"&&clear&&!S.ending&&R.t-S.t0>20){S.ending=true;S.endT=R.t;rcMsg("Pista liberada: as luzes do safety car apagaram, ele entra nos boxes NESTA volta.","","sc")}
  if(S.type==="vsc"&&clear){if(!S.vEnd){S.vEnd=R.t+7;S.ending=true;rcMsg("Pista liberada: o VSC termina em instantes.","","sc")}else if(R.t>=S.vEnd){rcMsg("VSC encerrado. BANDEIRA VERDE!","","verde");R.sc=null;R.greenT=R.t+20}}}
function updWrecks(){scClearTick();for(const w of R.wrecks){if(w.c&&!w.removed){w.f=fr(w.c.prog);w.lat=w.c.y||0;w._lw=w.lat}if(w.okMsg&&R.t>=w.okMsg){w.okMsg=0;rcMsg(`${w.code} saiu do carro sozinho e está bem.`,"","fiscais")}if(!w.removed&&R.t>=w.removeAt){w.removed=true;rcMsg(`Fiscais e guindaste removeram o carro de ${w.code}. Trecho liberado, bandeira verde no setor.`,"","fiscais");R.greenT=R.t+25}}
  R.yellows=R.yellows.filter(y=>y.w?!y.w.removed:R.t<y.until)}
function bubble(c,text,kind,dur){if(!c||!R.bubbles)return;R.bubbles.push({id:c.id,text:text.length>78?text.slice(0,76)+"…":text,kind:kind||"",t:R.t,dur:dur||4.5});if(R.bubbles.length>16)R.bubbles.shift()}
function rcMsg(t,cls,k){R.msgs.unshift({lap:Math.max(1,R.lead+1),t,cls:cls||"",k});if(R.msgs.length>60)R.msgs.pop()}
function radio(c,t,o){const m={lap:Math.max(1,R.lead+1),c:c.id,code:c.code,t,rt:R.t,...(o||{})};R.radio.unshift(m);if(R.radio.length>40)R.radio.pop();if(o&&o.pause&&c.isP)R.toast={t:R.t,text:t};if(c.hum)bubble(c,(o&&o.me?"":"🎧 ")+t.replace(/^[^:"]{2,22}: "?/,"").replace(/"$/,""),o&&o.me?"me":"radio",5)}
function pos(c){return R.order.indexOf(c)+1}
function running(c){return c.status==="run"}

// energia elétrica por volta (MJ) conforme o modo e a situação
function ersBudget(c){let e={auto:4.0,attack:4.4,defend:4.2,save:3.3}[c.ers]||4;if(c.ers==="auto"){if(c.atk)e=4.35;else if(c.defend)e=4.2}if(c.ovMode)e+=.5;if(c.dmg.power)e*=.4;return e}
function recalc(c){const w=R.w,ty=c.tyre;let mu=tyreMu(ty.c,w,ty.wear,ty.temp)*driverMu(c.d,false,w)*setupMu(c.id)*(1+(c.form||0));
  mu*={attack:1.006,normal:1,save:.992+((c.d.a.fuel||75)-75)*.00015}[c.mode];if(c.d.trait==="rua"&&R.C.street)mu*=1.002;
  mu*=famMu(c.d,R.C.id,raceExtraLaps(c))*stateMu(c)*rubberMu();
  if(c.lap>R.L*.7&&c.d.a.fitness<70)mu*=1-(70-c.d.a.fitness)*.0002;
  c.muBase=mu;if(typeof dynMuK==="function")mu*=dynMuK(c);c.mu=mu;// o perfil já usa a aderência que sobra com o dano (o piloto anda dentro do que o carro aguenta)
  const ph=c.ph;ph.mass=PH.mass+c.fuel*R.C.laps/R.L;const p=speedProfile(R.geo,ph,mu,4.0,R.geo.gk,c.prof);c.prof=p;
  let extra=ty.grain*.5+ty.blister*.8+(ty.punct?22:0)+(ty.flat?.15:0)+((c.dmg.gear||0)*.45+(c.dmg.body||0)*.35+(c.dmg.wing||0)*.25+(c.dmg.rwing||0)*.3)*realK(c,"dmg")/* asa, assoalho e suspensão agora tiram aderência no núcleo de dinâmica; aqui sobra só o arrasto e o câmbio */+(c.brakeHot>0?.3:0)+c.noise;
  c.base=p.t+extra;c.dep=p.deploy;ersK(c);c.Ls=c.Ls==null?c.L:c.Ls*.6+c.L*.4}
// energia extra/menor muda o tempo sem recalcular o perfil (≈0,32 s por MJ)
function ersK(c){c.k=c.prof.t/c.base;c.L=c.base}
function lapTime(c){return c.L}
function wearRate(c){const C=R.C,ty=c.tyre,T=TYRES[ty.c],w=R.w;
  let r=1/(.85*R.L)*T.wear*C.wear*{attack:1.35,normal:1,save:.72}[c.mode]*(1.32-c.t.car.susp/250)*(1.22-c.d.a.tyre/320)*(c.dirty?1.15:1)*(c.d.trait==='pneus'?.9:c.d.trait==='cuidadoso'?.94:1)*(1+Math.max(0,ty.temp-T.opt-8)*.02)*(1+(c.dmg.susp||0)*.6+(c.dmg.floor||0)*.25)*(ty.flat?1.1:1);
  if(!T.dry&&w<.25)r*=ty.c==="I"?2.6:3.4;if(T.dry&&w>.2)r*=.6;if(R.sc)r*=.35;r*=1+((c.dmg&&c.dmg.susp)||0)*.6;return r}
// velocidade instantânea (m/s) no ponto da volta
function speedAt(c,f){const geo=R.geo,N=geo.N;const x=f*N,i=Math.floor(x)%N,k=x-Math.floor(x);const v=c.prof.v[i]+(c.prof.v[(i+1)%N]-c.prof.v[i])*k;return v}
// (incidente antigo por sorteio removido: os erros saem de risk.js e o resultado sai da física em dyn.js)
function dnf(c,why,kind){if(c.status!=="run")return;c.status="dnf";c.why=why;if(!c.pit)makeWreck(c,kind||"stop");c.pit=null;if(c.hum)radio(c,why==="Acidente"?"Bati... desculpa, pessoal.":`Abandono: ${why}.`,{pause:true});
  if(c.isP)R.repair=(R.repair||0)+(why.includes("Acidente")?1.2:.4)}
function triggerSC(type){if(R.sc||R.finishing||R.red)return;R.nSC=(R.nSC||0)+(type==="sc"?1:0);R.nVSC=(R.nVSC||0)+(type==="vsc"?1:0);
  R.sc={type,laps:1,start:R.lead,t0:R.t};// sai assim que a pista é limpa (o SC precisa de pelo menos a volta de entrada)
  narr(type==="sc"?"Entra o safety car! A corrida fica neutralizada.":"Virtual safety car acionado.",2);
  rcMsg(type==="sc"?"SAFETY CAR na pista! Os carros formam fila atrás dele e ninguém pode ultrapassar.":"VIRTUAL SAFETY CAR: todos reduzem a velocidade e mantêm a distância, sem ultrapassar.","warn",type);
  R.cars.filter(c=>c.hum&&running(c)&&!c.pit).forEach(c=>{radio(c,type==="sc"?"Safety car! Parar agora custa bem menos tempo, porque todos estão andando devagar.":"VSC: uma parada agora custa menos que o normal.",{k:type});
    const left=R.L-c.lap,dry=COMP[c.tyre.c].dry,st=c.plan&&c.plan.stops[c.planIdx];if(left>3&&!c.pitCall&&dry&&c.tyre.wear>.18){const comp=st?st.c:pickDry(left);const good=c.tyre.wear>.4||(st&&st.lap-c.lap<=6);
      pushAsk({c,kind:"sc",dur:12,q:`${G.engineer||"Engenheiro"}: "${type==="sc"?"Safety car":"VSC"}! Box agora custa menos. Entramos nesta volta para ${COMP[comp].n.toLowerCase()}?"`,opts:[["pit:"+comp,"Box, box!"],["stay","Fico na pista"]],def:good?"pit:"+comp:"stay"})}})}
function redFlag(why){if(R.finishing||R.red)return;R.red={why,phase:"return",n:0};R.sc=null;
  rcMsg(`BANDEIRA VERMELHA: ${why}. Corrida interrompida: todos voltam devagar para o pit lane.`,"bad","vermelha");
  R.cars.filter(running).forEach(c=>{c.pitCall=null});R.wrecks.forEach(w=>{w.removeAt=Math.min(w.removeAt,R.t+25)});
  R.cars.filter(c=>c.hum&&running(c)).forEach(c=>radio(c,"Bandeira vermelha! Volte devagar para o pit lane e pare na fila.",{k:"vermelha"}))}
function resumeRed(choices){
  const parked=R.cars.filter(c=>running(c)&&c.parked).sort((a,b)=>a.parkIdx-b.parkIdx);const N=parked.length;
  parked.forEach((c,i)=>{const comp=c.hum&&choices[c.id]?choices[c.id]:(R.w>.7?"W":R.w>.28?"I":c.tyre.wear>.4?(R.L-R.lead>R.L*.4?"M":"S"):c.tyre.c);
    if(comp!==c.tyre.c||c.tyre.wear>.3){c.tyre={c:comp,wear:0,temp:80,grain:0,blister:0,punct:false,age:0};if(!c.used.includes(comp))c.used.push(comp)}c.dmg.wing=0;
    c.parked=false;if(c.pit){c.pit.phase="release";c.pit.red=false}});
  R.red=null;R.redChoose=false;rcMsg("Pneus trocados. A corrida recomeça atrás do safety car por uma volta.","warn","relargada");triggerSC("sc");if(R.sc)R.sc.laps=1}

function enterPit(c,s0,E,red){// entra no pit lane (s0 metros depois da entrada, E = prog absoluto da entrada)
  const PL=R.pitLane;
  if(red){c.pit={s:s0,p0:E,phase:"queue",slot:Math.max(s0+1,PL.D*.93-(R.red.n++)*13),red:true,comp:c.tyre.c,stop:0,stopT:0,note:""};c.pitCall=null;return}
  const dbl=(R.pitBusy[c.t.id]||0)>R.t;const pt=pitTime(c,dbl);let stop=pt.t;let note=pt.note;if(typeof pxExtraTime==="function"){const x=pxExtraTime(c);stop+=x.t;if(x.note)note+=(note?", ":"")+x.note}
  if(c.dmg.wing>=.3){stop+=7;note+=(note?", ":"")+"bico trocado"}
  if(c.dmg.floor>.3){stop+=6;note+=(note?", ":"")+"assoalho reparado"}
  if(c.dmg.rwing){stop+=12;note+=(note?", ":"")+"asa traseira trocada"}
  if(c.pen>0&&c.penServe){stop+=c.pen;note+=(note?", ":"")+`cumpriu ${c.pen}s de punição`}
  const comp=c.pitCall||c.tyre.c;
  c.pit={s:s0,p0:E,phase:"in",gar:PL.D*garF(c.t),comp,stop,stopT:0,note};c.pitCall=null;c.stops++;c.pendErr=null;c.inLap=false;c.att=null;
  {const i=R.order.indexOf(c),A=R.order[i-1];c.pitRival=A&&running(A)&&!A.pit?A.id:null;c.pitGap=A?(A.prog-c.prog)*c.L:99;c.pitT=R.t;c.reactDone=false}
  if(c.hum)radio(c,`Entrando no pit lane. Limitador ligado: 80 km/h.`);else bubble(c,"Box!","pit",3)
  const pp=pos(c);if(c.isP||pp<=5)narr(`${c.code}${pp<=3?`, que é o ${pp}º,`:""} entra nos boxes para colocar ${COMP[comp].n.toLowerCase()}.`,1)}
function pitArrive(c){const P=c.pit;const busy=R.pitBusy[c.t.id]||0;if(busy>R.t){const w=busy-R.t;P.stop+=w;P.note+=(P.note?", ":"")+`esperou o companheiro (+${w.toFixed(1)}s)`}
  R.pitBusy[c.t.id]=R.t+P.stop;
  if(c.hum)radio(c,`Pit stop: pneu ${COMP[P.comp].n}${P.note?" ("+P.note+")":""}.`);
  if(P.note.includes("porca")&&(c.isP||pos(c)<=5)){narr(`Problema no pit stop de ${c.code}! A roda não saiu.`,2);hlight("pit",[c],`Pit stop lento de ${c.code}`,c.isP?2:1)}}
function pitService(c){const P=c.pit,comp=P.comp;const keepN=typeof pxService==="function"&&pxService(c);if(c.dmg&&!keepN){const d=c.dmg;d.wingL=0;d.wingR=0;d.nose=0;d.loose=0;c._wbL=0;c._wbR=0;c.bo=0}c.tyre={c:comp,wear:0,temp:82,grain:0,blister:0,punct:false,age:0};if(!c.used.includes(comp))c.used.push(comp);
  if(c.dmg.wing>=.3&&!keepN)c.dmg.wing=0;if(c.dmg.rwing>=.3)c.dmg.rwing=0;if(c.dmg.floor>.3){c.dmg.floor=0;c.floorMsg=0}if(c.pen>0&&c.penServe){c.pen=0;c.penServe=false}
  if(c.hum){const st=c.plan&&c.plan.stops[c.planIdx];if(st&&Math.abs(st.lap-c.lap)<=6)c.planIdx++;radio(c,`Parado ${P.stop.toFixed(1)}s.${P.stop<2.35&&!P.note?" Pit stop excelente da equipe!":P.stop>3.6&&!P.note?" Pit stop lento.":""} Vai, vai, vai!`);c.wearWarn=0;c.compWarn=0}
  recalc(c)}
function exitPit(c){c.pit=null;c.pitExit=R.t;c.lineN=0;c.att=null;recalc(c);// a posição lateral continua de onde o carro está (fim do pit lane), sem salto
  // (a velocidade de entrada na pista já foi ajustada ao carro da frente ainda dentro do pit lane, em pitMove)
  if(c.hum)radio(c,"Saindo do pit lane. Cuidado com os pneus frios na primeira volta.")}
// movimento dentro do pit lane
function pitMove(c,dt){const P=c.pit,PL=R.pitLane;let v=c.v||0,vT=0,amax=16;
  if(P.phase==="in"){const d=P.gar-P.s;vT=Math.min(PIT_LIM,Math.sqrt(2*11*Math.max(0,d))+.4);if(d<=.25){P.phase="stop";pitArrive(c);vT=0}}
  else if(P.phase==="stop"){vT=0;P.stopT+=dt;if(P.stopT>=P.stop){const h=P.relChk?0:(P.relChk=1,pitRelease(c));if(h>0)P.stop+=h;else{P.phase="out";pitService(c)}}}
  else if(P.phase==="queue"){const d=P.slot-P.s;vT=d>0?Math.min(PIT_LIM,Math.sqrt(2*8*d)+.3):0;if(d<=.25){vT=0;if(!c.parked&&v<.3){c.parked=true;c.parkIdx=R.red?R.red.n:0}}}
  else{vT=PIT_LIM;amax=8;if(R.red&&R.red.phase==="return"&&P.phase==="out"){P.phase="queue";P.red=true;P.slot=Math.max(P.s+1,PL.D*.93-(R.red.n++)*13)}
    // fim do pit lane: se há carro logo à frente na pista (fila do safety car, por exemplo), o piloto já chega na velocidade dele (freando no pit lane, sem corte de velocidade na saída)
    else if(PL.D-P.s<120){const L=R.geo.len,fs=fr(c.prog)*L+(PL.D-P.s);let best=null,bd=1e9;for(const o of R.cars){if(o===c||!running(o)||o.pit||o.parked)continue;let d=fr(o.prog)*L-fs;while(d<-L/2)d+=L;while(d>L/2)d-=L;if(d>-CARL&&d<bd&&d<90&&Math.abs(o.y||0)<TRK_H+1&&Math.abs((o.y||0)-(pitLatAt(fr(c.prog)+(PL.D-P.s)/L)??c.y))<4.6){bd=d;best=o}}
      if(best){const gap=bd+(PL.D-P.s)-CARL-2;const allow=gap<=0?Math.max(0,(best.v||0)-3):Math.sqrt(Math.max(0,(best.v||0)*(best.v||0)+2*20*gap));vT=Math.min(vT,Math.max(best.v||0,allow)*(gap<=0?.9:1))}}}
  // o carro anda pelo pit lane no mesmo sistema da pista: a linha lateral é a do próprio desenho do pit lane (TRACKGEO.pit)
  const f=fr(c.prog),yl=pitLatAt(f),yl2=pitLatAt(f+2/R.geo.len),slope=yl!=null&&yl2!=null?(yl2-yl)/2:0;
  const before=Math.floor(c.prog),pb0=c.prog;dynStep(c,dt,vT,true,false,yl!=null?yl:c.y,{pit:true,amax,dmax:24,slope});
  P.s=(c.prog-P.p0)*R.geo.len;c._cross=R.t;secCheck(c,pb0);const ds=(c.prog-pb0)*R.geo.len;
  c.tyre.temp+=((P.phase==="stop"?TYRES[c.tyre.c].opt-20:TYRES[c.tyre.c].opt-12)-c.tyre.temp)*dt/30;c.fuel-=ds/R.geo.len*c.fuel0/R.L*.4;
  if(Math.floor(c.prog)>before&&Math.floor(c.prog)>=1)onLap(c);
  if(c.pit&&P.s>=PL.D&&(P.phase==="out"||P.phase==="release"))exitPit(c)}

function autoStrategy(c){// decidido ao cruzar a linha
  if(c.pitCall)return;const left=R.L-c.lap,w=R.w,ty=c.tyre,dry=COMP[ty.c].dry;
  const skill=70+c.t.rep/4;const thr=.42+(rnd()-.5)*(130-skill)/250;
  if(ty.punct||c.dmg.wing>=.55||(c.dmg.wing>=.3&&left>8)||(c.dmg.rwing>=.5&&left>5)){c.pitCall=dry?pickDry(left):ty.c;return}
  if(left<=1)return;
  if(dry&&w>thr){c.pitCall=w>.74?"W":"I";return}
  if(ty.c==="I"&&w>.8){c.pitCall="W";return}
  if(ty.c==="W"&&w<.58){c.pitCall="I";return}
  if(!dry&&w<.2&&rainAt(c.lap+3)===0){c.pitCall=pickDry(left);return}
  if(!dry)return;
  const st=c.plan&&c.plan.stops[c.planIdx];
  if(R.sc&&ty.wear>.3&&left>4){c.pitCall=st?st.c:pickDry(left);c.planIdx++;return}
  if(st&&c.lap>=st.lap-1&&left>2){c.pitCall=st.c;c.planIdx++;return}
  if(ty.wear>.74+rr(-.04,.04)&&left>2){c.pitCall=pickDry(left);return}
  const usedDry=c.used.filter(x=>COMP[x].dry);if(R.w<.1&&!c.used.some(x=>!COMP[x].dry)&&new Set(usedDry).size<2&&left<=3){c.pitCall=ty.c==="S"?"M":"S";}
}
function playerStrategy(c){if(c.pitCall||c.pit||!running(c))return;const left=R.L-c.lap,w=R.w,ty=c.tyre,dry=COMP[ty.c].dry,eng=G.engineer||"Engenheiro";
  if(ty.punct){c.pitCall=dry?pickDry(left):ty.c;radio(c,`${eng}: "Pneu furado! Box, box, box!"`,{pause:true});return}
  if(left<=1)return;if(c.lastAskLap!=null&&c.lap-c.lastAskLap<2)return;
  const ask=(kind,q,opts,def)=>{c.lastAskLap=c.lap;pushAsk({c,kind,q:`${eng}: "${q}"`,opts,def,dur:16})};
  const dc=dry?pickDry(left):ty.c;
  if(c.dmg.wing>=.3)return ask("dmg",c.dmg.wing>=.6?"Asa dianteira quebrada: mais de 1 segundo por volta. Box nesta volta para trocar o bico?":"Asa dianteira danificada: perdemos uns 0,5 segundo por volta. Trocar o bico custa uns 7 segundos a mais no box. Paramos?",[["pit:"+dc,"Box, troca o bico"],["stay","Fico na pista"]],"pit:"+dc);
  if(c.dmg.rwing&&left>4)return ask("dmg","Asa traseira danificada: perdemos quase 1 segundo por volta. Trocar custa uns 12 segundos a mais no box. Paramos?",[["pit:"+dc,"Box, troca a asa"],["stay","Aguento assim"]],left>8?"pit:"+dc:"stay");
  if(c.dmg.floor>.6)return ask("dmg","O assoalho está muito danificado. Box para consertar?",[["pit:"+dc,"Box, conserta"],["stay","Aguento até o fim"]],"pit:"+dc);
  if(dry&&w>.36){const rec=w>.74?"W":"I";return ask("rain",`A pista está ${w>.6?"encharcando":"molhada demais"} para slicks. Box para ${COMP[rec].n.toLowerCase()}?`,[["pit:I","Box, intermediário"],["pit:W","Box, pneu de chuva"],["stay","Fico de slick"]],w>.6?"pit:"+rec:"stay")}
  if(ty.c==="I"&&w>.84)return ask("rain","Muita água na pista. O pneu de chuva é mais seguro agora. Trocamos?",[["pit:W","Box, pneu de chuva"],["stay","Fico de intermediário"]],"stay");
  if(ty.c==="W"&&w<.55&&rainAt(c.lap+2)<2)return ask("rain","A chuva diminuiu: o intermediário já está mais rápido. Trocamos?",[["pit:I","Box, intermediário"],["stay","Fico de pneu de chuva"]],"stay");
  if(!dry&&w<.22&&rainAt(c.lap+3)===0)return ask("dry",`A pista está secando. Hora dos slicks: ${COMP[pickDry(left)].n.toLowerCase()}?`,[["pit:"+pickDry(left),"Box, slick"],["stay","Ainda não"]],"stay");
  if(!dry)return;
  const st=c.plan&&c.plan.stops[c.planIdx];
  if(st&&c.lap>=st.lap-1&&left>2){const alt=st.c==="H"?"M":st.c==="M"?"H":"M";return ask("plan",`Janela do plano ${c.plan.id}: box nesta volta para ${COMP[st.c].n.toLowerCase()}?`,[["pit:"+st.c,`Box, ${COMP[st.c].n.toLowerCase()}`],["pit:"+alt,`Box, mas quero ${COMP[alt].n.toLowerCase()}`],["stay","Vamos estender"]],"pit:"+st.c)}
  if(ty.wear>.74)return ask("wear",`Pneus ${Math.round(ty.wear*100)}% gastos, risco de furo. Box nesta volta?`,[["pit:"+pickDry(left),"Box, box"],["stay","Ainda dá"]],"pit:"+pickDry(left));
  const usedDry=c.used.filter(x=>COMP[x].dry);if(R.w<.1&&!c.used.some(x=>!COMP[x].dry)&&new Set(usedDry).size<2&&left<=Math.max(3,Math.round(R.L*.3))){const o=ty.c==="H"?"M":ty.c==="M"?"H":"M";return ask("comp",`Ainda não usamos dois compostos: sem parar, seremos desclassificados. Box para ${COMP[o].n.toLowerCase()}?`,[["pit:"+o,"Box, box"],["stay","Depois"]],"pit:"+o)}}
function pickDry(left){return left<=R.L*.36?"S":left<=R.L*.62?"M":"H"}

function onLap(c){// cruzou a linha de chegada
  const tc=c._cross??R.t;const lt=tc-c.lapStart;secMark(c,2,tc);c.secLast=c.secCur.slice();c.secCur=[null,null,null];
  if(c.cpCur){const clean=!c.pit&&lt>30&&c.lap>0&&!(c.pitExit&&tc-c.pitExit<lt);if(clean&&(!c.best||lt<=c.best)){c.cpCur[100]=lt;c.cpBest=Float32Array.from(c.cpCur)}c.cpCur.fill(0);c.cpNext=0}
  c.lapStart=tc;c.lap++;c.tyre.age++;
  if(R.red)return;const inPit=!!c.pit;
  if(c.lap>0&&!c.pit&&lt>30){c.last=lt;c.laps.push(+lt.toFixed(3));if(!c.best||lt<c.best)c.best=lt;if(lt<R.fast.t&&!R.sc&&c.lap>1){R.fast={t:lt,c};stEv(c,"fast");if(c.lap>3&&(c.isP||pos(c)<=8))narr(`Volta mais rápida da corrida para ${c.code}: ${fmtT(lt)}.`,1)}}
  c.noise=gauss()*(1.25-c.d.a.cons/100)*.3;stLap(c);if(c===R.order[0]&&R.w>.3)R.wetLaps=(R.wetLaps||0)+1;
  {const i=R.order.indexOf(c),A=R.order[i-1];c.ovMode=!!(!inPit&&A&&running(A)&&!A.pit&&(A.prog-c.prog)*c.L<1&&c.lap>=2&&!R.sc);if(c.ovMode&&c.hum&&!c.ovMsg){c.ovMsg=1;radio(c,"Modo de ultrapassagem liberado nesta volta: +0,5 MJ de energia.",{k:"overtake"})}if(!c.ovMode)c.ovMsg=0}
  recalc(c);
  if(c.dmg.floor>0&&c.dmg.floor<1){c.dmg.floor=Math.min(1,c.dmg.floor+.05);if(c.hum&&c.dmg.floor>.55&&!c.floorMsg){c.floorMsg=1;radio(c,"O dano no assoalho está piorando. A equipe vai me chamar para consertar.",{k:"dano"})}}
  if(!c.hum&&c.dmg.floor>.6&&R.L-c.lap>4&&!c.pitCall&&!c.pit){c.pitCall=COMP[c.tyre.c].dry?pickDry(R.L-c.lap):c.tyre.c}
  if(c.hum&&!R.sc&&rnd()<.12){const A=R.order[pos(c)-2];if(A&&running(A)&&!A.pit&&COMP[A.tyre.c].dry&&A.tyre.age-c.tyre.age>=6&&(A.prog-c.prog)*c.L<6&&!c.tyreInfo){c.tyreInfo=8;radio(c,`Estrategista: ${A.code} está com pneus ${A.tyre.age-c.tyre.age} voltas mais velhos. Vamos alcançá-lo nas próximas voltas.`,{k:"overcut"})}}
  if(c.tyreInfo>0)c.tyreInfo--;
  if(R.finishing){finish(c);return}
  if(c.lap>=R.L){R.finishing=true;finish(c);rcMsg(`Bandeira quadriculada! ${c.code} vence o GP!`,"big","quadriculada");narr(`BANDEIRA QUADRICULADA! ${c.d.n} VENCE O ${R.C.gp.toUpperCase()}!`,3);hlight("finish",[c],`${c.code} vence`,3);return}
  if(c===R.order[0]&&c.lap===R.L-1&&!R.lastLapSaid){R.lastLapSaid=true;narr("ÚLTIMA VOLTA! Tudo pode acontecer!",3)}
  if(inPit){leaderLap(c);return}
  // combustível
  const burn=c.fuel0/R.L*{attack:1.06,normal:1,save:.9-((c.d.a.fuel||75)-75)*.002}[c.mode];
  if(c.hum){const proj=c.fuel-burn*(R.L-c.lap);if(proj<1.2&&!c.fuelWarn){c.fuelWarn=1;radio(c,"Combustível no limite! Precisa poupar ou não chega ao fim.",{pause:true,sug:"save"})}if(proj>2.5)c.fuelWarn=0}
  // pneus: problemas
  if(c.tyre.c!=="H"&&c.tyre.age<=3&&R.C.wear<1&&rnd()<.04&&COMP[c.tyre.c].dry){c.tyre.grain=1;if(c.hum)radio(c,"Os pneus estão granulando, sem aderência.")}
  if(c.tyre.grain&&c.tyre.age>5)c.tyre.grain=0;
  if(c.mode==="attack"&&COMP[c.tyre.c].dry&&R.C.wear>1.1&&rnd()<.03&&!c.tyre.blister){c.tyre.blister=1;if(c.hum)radio(c,"Bolhas nos pneus! Preciso pegar leve.")}
  if(typeof tyreBlowCheck==="function")tyreBlowCheck(c);else if(c.tyre.wear>.86&&!c.tyre.punct&&rnd()<(c.tyre.wear-.82)*.9){c.tyre.punct=true;rcMsg(`${c.code} com pneu furado!`);if(c.hum)radio(c,"PNEU FURADO! Vou para o box.",{pause:true});if(!c.pitCall)c.pitCall=COMP[c.tyre.c].dry?pickDry(R.L-c.lap):c.tyre.c}
  if(c.hum&&c.tyre.wear>.7&&!c.wearWarn&&COMP[c.tyre.c].dry){c.wearWarn=1;radio(c,`Pneus ${COMP[c.tyre.c].n.toLowerCase()} acabando (${Math.round(c.tyre.wear*100)}% gastos).`,{sug:"box"})}
  if(c.tyre.wear<.5)c.wearWarn=0;
  // erros, quebras, limites de pista
  const w=R.w,dryT=COMP[c.tyre.c].dry;
  c.press=clamp((c.pressT||0)/Math.max(30,c.L),0,1.5);c.pressT=0;
  const pe=(1+c.press*(1.25-c.d.a.mental/100)*1.1)*(c.d.trait==='agressivo'?1.3:c.d.trait==='cuidadoso'?.7:1)*.0026*{attack:2.1,normal:1,save:.6}[c.mode]*(1+(dryT?w*28:0)+w*2.2)*(1.4-c.d.a.cons/100)*(1.25-c.d.a.mental/400)*(c.d.morale<40?1.4:1)*(c.tyre.wear>.85?2:1)*(R.sc?.3:1);
  // os erros de pilotagem agora acontecem no lugar e na hora (risk.js): freada, curva e saída
  if((c.dmg.susp||0)>.8&&rnd()<.18){dnf(c,"Suspensão quebrada","stop");rcMsg(`${c.code} abandona: a suspensão danificada no toque quebrou.`,"bad","dano");return}
  const pm=.0011*(1.55-c.t.car.rel/100)*(c.mode==="attack"?1.3:1);
  mcLap(c);// quebras agora vêm do uso (mech.js); só a parte elétrica ainda falha sem aviso
  // limites de pista: só quando o piloto alarga ou passa reto de verdade (risk.js)
  leaderLap(c);
  // sugestões do estrategista para os carros do jogador
  if(c.hum&&rnd()<.09)askDriver(c);
  if(c.hum)playerStrategy(c);
  // undercut de rival
  if(c.hum){const ahead=R.order[pos(c)-2];if(ahead&&ahead.pit&&ahead.pit.phase==="in")radio(c,`${ahead.code}, logo à frente, entrou nos boxes. Podemos responder com undercut ou overcut.`,{k:"undercut"})}
  if(c.auto){autoStrategy(c);if(c.pitCall&&!c.inLap)c.inLap=true;aiReact(c);aiPace(c);aiTeamOrders(c)}
}
function cornerF(){const cs=R.geo.corners,N=R.geo.N;if(!cs.length)return rr(.1,.9);let tot=0;const w=cs.map(c=>{const x=1/Math.max(25,c.r);tot+=x;return x});let r=rnd()*tot;for(let i=0;i<cs.length;i++){r-=w[i];if(r<=0)return((cs[i].i-5+N)%N)/N}return cs[0].i/N}
function mechFail(c,why){c.smokeT=R.t+10;if(why){dnf(c,why,"stop");rcMsg(`${c.code} abandona: ${why==="Motor"?"o motor":"o câmbio"} quebrou.`,"bad");if(c.hum)radio(c,why==="Motor"?"O motor foi embora. Acabou para nós.":"Câmbio travado. Tenho que parar.",{pause:true,k:why==="Motor"?"motor":"cambio"});narr(`${c.code} para com ${why==="Motor"?"o motor quebrado":"o câmbio quebrado"}!`,2);if(rnd()<.4)triggerSC("vsc");return}if(rnd()<.55){dnf(c,pick(["Hidráulica","Elétrica","Pressão de combustível"]),"stop");rcMsg(`${c.code} abandona com problema mecânico.`,"bad");if(rnd()<.4)triggerSC("vsc")}
    else if(!c.dmg.power){c.dmg.power=.9;c.smokeT=R.t+8;recalc(c);rcMsg(`${c.code} perdeu potência.`);if(c.hum)radio(c,"Estou sem potência no ERS! Perdendo quase 1 segundo por volta.",{pause:true})}}
function leaderLap(c){// chuva, safety car e contagem de voltas (quando o líder cruza a linha)
  const r=rainAt(c.lap);if(c===R.order[0]){if(r!==R.rain){if(r>R.rain){rcMsg(r===2?"Chuva forte!":"Começou a chover.","warn");R.cars.filter(x=>x.hum&&running(x)).forEach(x=>radio(x,r===2?"Chuva forte agora! A pista vai encharcar.":"Começou a chover em algumas curvas.",{pause:true,k:"chuva"}))}else rcMsg(r===0?"A chuva parou. A pista vai secar.":"A chuva diminuiu.");R.rain=r}
    {const clear=R.wrecks.every(w=>w.removed);
    if(R.sc&&R.sc.type==="sc"&&!R.sc.ending&&clear){R.sc.ending=true;R.sc.endT=R.t;rcMsg(R.sc.type==="sc"?"As luzes do safety car apagaram: ele entra nos boxes NESTA volta.":"O VSC vai terminar em instantes.","","sc")}
    if(R.sc&&R.sc.type==="sc"&&(R.sc.ending||c.lap-R.sc.start>=R.sc.laps)){if(clear&&R.sc.ending&&R.t-(R.sc.endT||0)>3){rcMsg(R.sc.type==="sc"?"Safety car nos boxes. BANDEIRA VERDE: corrida liberada!":"VSC encerrado. BANDEIRA VERDE!","","verde");R.sc=null;R.greenT=R.t+30;R.cars.filter(running).forEach(x=>{x.tyre.temp=Math.min(x.tyre.temp,TYRES[x.tyre.c].opt-22)});narr("Relargada! Pneus frios depois do safety car: quem esquentar primeiro leva vantagem.",2)}
      else if(!R.sc.waitMsg){R.sc.waitMsg=1;rcMsg("O safety car continua: o guindaste ainda está removendo o carro acidentado.","warn","fiscais")}}
    if(R.rain===2&&R.w>.93&&rnd()<.14&&!R.redDone){R.redDone=true;redFlag("chuva torrencial")}}
    R.lead=c.lap}}
// setores: 1/3 e 2/3 da volta; o terceiro fecha na linha de chegada
function secMark(c,k,tc){const st=tc-c.secStart;c.secStart=tc;c.secCur[k]=st;if(c.lap<1&&k===0)return;if(c.pit||c.pitExit&&tc-c.pitExit<2)return;
  if(c.secPB[k]==null||st<c.secPB[k]){c.secPB[k]=st}if(R.secBest[k]==null||st<R.secBest[k].t)R.secBest[k]={t:st,id:c.id}}
function secCheck(c,pb){for(let k=1;k<=2;k++){const b=Math.floor(pb)+k/3;if(pb<b&&c.prog>=b){const tc=R.t-(c.prog-b)*R.geo.len/Math.max(1,c.v||1);secMark(c,k-1,tc)}}
  if(c.cpCur&&R.started){const f=fr(c.prog);const idx=Math.floor(f*100);while(c.cpNext<=idx&&c.cpNext<101){c.cpCur[c.cpNext]=R.t-c.lapStart;c.cpNext++}}}
// delta (s) da volta atual contra a melhor volta do piloto
function lapDelta(c){if(!c.cpBest||!R.started||c.pit)return null;const f=fr(c.prog)*100,i=Math.floor(f),k=f-i;const b=c.cpBest[i]+(c.cpBest[Math.min(100,i+1)]-c.cpBest[i])*k;return(R.t-c.lapStart)-b}
function finish(c){c.status="fin";c.fin=c._cross??R.t;c.pit=null;if(c.isP){const p=R.cars.filter(x=>x.status==="fin").length;narr(`${c.code} recebe a quadriculada em ${p}º${p<=10?": pontos para a equipe!":"."}`,p<=10?3:1)}}

// ---------- passo fixo da simulação: o navegador, o modo online e os testes avançam o tempo sempre em passos de 0,05 s.
// A velocidade da simulação (1x, 2x...) muda quantos passos cabem em cada quadro, nunca o tamanho do passo.
const SIM_DT=.05;
function simAdvance(sec,maxSteps,onStep){if(!R||R.over)return 0;R.acc=(R.acc||0)+Math.max(0,sec);let n=0;
  while(R.acc>=SIM_DT-1e-9&&n<maxSteps&&!R.over&&!R.redChoose){for(const c of R.cars){c._pp=c.prog;c._py=c.y||0;c._ppsi=c.psi}step(SIM_DT);R.acc-=SIM_DT;n++;if(onStep)onStep()}
  if(n>=maxSteps)R.acc=Math.min(R.acc,SIM_DT);// aparelho lento: a corrida fica em câmera lenta em vez de dar passos maiores
  return n}
function step(dt){
  if(R.over)return;
  R.t+=dt;R.ticks++;
  if(!R.started){if(R.form&&R.form.phase==="out"){formationStep(dt);return}if(R.t>=R.go)launch();else return}
  updWrecks();askTick();for(const c of R.cars){if(c.towReq&&R.t-(c.towReqT||0)>25)c.towReq=false;if(c.goReq&&(R.t-(c.goReqT||0)>30||R.sc||R.red)){c.goReq=false;if(c.hum&&running(c))radio(c,"Não apareceu chance de ataque. Sigo no ritmo.",{me:1,k:"duelo"})}}if(R.toast&&R.t-R.toast.t>7)R.toast=null;
  if(R.red&&R.red.phase==="stopped")return;
  // clima
  const tgt=R.rain===2?.97:R.rain===1?.62:0;R.w+=(tgt-R.w)*dt/(tgt>R.w?110:R.w>.3?260:420);R.w=clamp(R.w,0,1);
  // percepção dos pilotos (quem está à frente, atrás, ao lado)
  aiSense();pistaTick(dt);stewTick();for(const c of R.cars)if(running(c)){if(!c.pit){stTick(c,dt);mcTick(c,dt,R.geo.ai.ph[Math.floor(fr(c.prog)*R.geo.N)%R.geo.N])}gbTick(c);defTick(c)}
  const geo=R.geo,N=geo.N;
  for(const c of R.cars){if(!running(c)){if(c.status==="dnf"&&c.dyn&&!c.dyn.frozen)dynCoast(c,dt);continue}if(c.parked){c.v=0;continue}
    if(!c.dyn)dynInit(c);
    if(c.pit){pitMove(c,dt);continue}
    if(c.hold){if(R.t-R.go>1.4)releasePlayer(c,1.4);else{c.v=0;continue}}
    const f=fr(c.prog),i=Math.floor(f*N)%N;const m=aiDrive(c,dt);
    let v1=speedAt(c,f)*c.k*m,hard=c.hard;
    if(R.yellows.length){const yk=yellowK(c);if(yk<1)v1*=yk}
    if(!R.sc&&c.unlap)c.unlap=null;
    if(R.sc){const cap=R.sc.type==="sc"?(c.unlap?.86:c.scGap>.9?.78:.6):.68;const vc=speedAt(c,f)*cap;if(v1>vc){v1=vc;hard=true}}
    if(R.red&&v1>45){v1=45;hard=true}
    // aproximação da entrada do pit lane: freia até 80 km/h
    const toPit=(c.pitCall||(R.red&&R.red.phase==="return"))&&R.started;if(toPit){const pd=pitDist(c);if(pd<260){const vc=Math.sqrt(PIT_LIM*PIT_LIM+2*24*Math.max(0,pd-6));if(v1>vc){v1=vc;hard=true}}}
    if(c.lose>0){v1*=.86;c.lose=Math.max(0,c.lose-dt*.14);hard=true}
    if(typeof ccAdj==="function")v1=ccAdj(c,v1,i);
    if(v1>c.vCap){v1=c.vCap;hard=true}
    const brk=geo.ai.ph[i]===1||c.prof.v[(i+1)%N]<c.prof.v[i]-.02;
    if(typeof revStep==="function"&&!c.ex)revStep(c,dt,v1);
    // o núcleo de dinâmica move o carro (única autoridade); na recuperação de uma escapada o alvo é voltar à pista
    let yT=c.yT;if(R.sc&&R.sc.unlapOn&&!c.emerg)yT=c.unlap?-4.4:2.4;// retardatários passando: a fila anda pela direita e deixa a esquerda livre
    if(c.tyre.rim&&v1>38){v1=38;hard=true}// rodando no aro
    if(c.ex){const rc=dynRecover(c);v1=rc.v;yT=rc.y;hard=true}
    const before=Math.floor(c.prog),pb=c.prog;dynStep(c,dt,Math.max(0,v1),hard,brk,yT,{em:!!c.emerg});if(!running(c))continue;
    let ds=(c.prog-pb)*geo.len;secCheck(c,pb);
    if(toPit){const E=Math.floor(pb-R.pitLane.fe)+1+R.pitLane.fe;if(pb<E&&c.prog>=E){
      // só entra quem chegou na faixa do pit lane; quem não chegou segue na pista e tenta na próxima volta
      const yIn=pitLatAt(fr(E)+1e-4);if(yIn==null||Math.abs((c.y||0)-yIn)<=2.4||R.red){enterPit(c,(c.prog-E)*geo.len,E,!!R.red);continue}
      else if(!c.pitMissLap||c.pitMissLap!==c.lap){c.pitMissLap=c.lap;R.pitMiss=(R.pitMiss||0)+1;bubble(c,"Perdeu a entrada do box","warn",3);if(c.hum)radio(c,"Não deu para entrar no box, estava do lado errado. Paro na próxima volta.",{k:"box"})}}}
    // bateria: recupera nas freadas (o gasto nas retas é calculado pelo piloto)
    if(c.acc<-5)c.batt+=(-c.acc)*dt*.155*(1+((c.d.a.ers||75)-75)*.004);c.batt=clamp(c.batt,0,100);c._cross=R.t-(c.prog-Math.floor(c.prog))*c.L;
    {const _wi=wearRate(c)*dt/c.L;c.tyre.wear=Math.min(1,c.tyre.wear+_wi);if(typeof tyreStep==="function")tyreStep(c,dt,_wi)}{const T=TYRES[c.tyre.c];const tgt=(R.sc?T.opt-25:T.opt+({attack:8,normal:0,save:-6}[c.mode]))-R.w*25+(c.dirty?4:0);c.tyre.temp+=(tgt-c.tyre.temp)*dt/(R.sc?60:22)}
    {const fol=(c.tow||0)>.35||c.dirty;c.heat=clamp((c.heat||0)+dt*(fol?.011:-.018),0,1);if(c.heat>.8&&c.hum&&!c.heatMsg){c.heatMsg=1;radio(c,"Temperaturas de freio e motor subindo atrás do carro da frente. Se puder, saia um pouco do vácuo para esfriar.",{k:"vacuo"})}if(c.heat<.4)c.heatMsg=0}
    c.fuel-=ds/geo.len*c.fuel0/R.L*{attack:1.05,normal:1,save:.9}[c.mode]*(c.ers==="save"?.97:1)*(R.sc||R.red?.55:1);
    if(c.fuel<=0){c.fuel=0;dnf(c,"Sem combustível","stop");rcMsg(`${c.code} ficou sem combustível!`,"bad");continue}
    if(c.pendFail!=null&&c.prog>=c.pendFail){c.pendFail=null;mechFail(c,c.pendWhy);c.pendWhy=null;if(!running(c))continue}
    if(Math.floor(c.prog)>before&&Math.floor(c.prog)>=1)onLap(c)}
  if(R.started&&R.phys){physContacts();debrisTick(dt);looseTick()}
  if(R.red&&R.red.phase==="return"&&R.cars.filter(running).every(c=>c.parked||c.pit)&&R.cars.some(c=>c.parked)&&R.cars.filter(running).every(c=>c.parked)){R.red.phase="stopped";R.redChoose=true}
  // ordem da corrida
  R.order=R.cars.slice().sort((a,b)=>{const ra=a.status==="dnf"||a.status==="dsq",rb=b.status==="dnf"||b.status==="dsq";if(ra!==rb)return ra?1:-1;
    if(a.status==="fin"&&b.status==="fin")return(b.lap-a.lap)||(a.fin-b.fin);return b.prog-a.prog});
  const ord=R.order;
  if(R.started&&ord[0]&&running(ord[0])&&!ord[0].pit){if(R.leader&&ord[0]!==R.leader&&ord[0].lap>0&&!R.sc){narr(`NOVO LÍDER! ${ord[0].code} assume a ponta da corrida!`,3);crowdEv(ord[0].prog,1);hlight("lead",[ord[0]],`${ord[0].code} assume a liderança`,3)}R.leader=ord[0]}
  R.scP=R.sc&&R.sc.type==="sc"?scProg():null;
  if(R.t>=R.recNext){R.recNext=R.t+.5;record()}
  if(R.incidents)rbRecord();
  aiPasses();
  // recálculo dos carros (pneu, combustível, danos) dentro do passo: não depende de quadros nem do relógio
  if(typeof recalcFlush==="function")recalcFlush();
  // bandeira azul
  for(const c of ord){c.blue=false;if(!running(c)||c.pit)continue;const f=c.prog%1;
    for(const o of ord){if(o===c||!running(o)||o.pit)continue;if(o.prog-c.prog>.6){let df=(f-(o.prog%1)+1)%1;if(df>0&&df<.012)c.blue=true}}}
  if(ord[0])R.lead=Math.max(R.lead,ord[0].lap);
  if(R.cars.every(c=>c.status!=="run"))endRace();
}
function completePass(B,A){if(A.gbTo===B.id&&R.t-(A.gbDoneT||0)<10)return;// posição devolvida, não é ultrapassagem
  if(B.yNo&&R.yellows.some(y=>y.id===B.yLast&&y.until>R.t)&&!A.vis&&!A.ex&&!(A.lose>0)&&!A.pit){advGain(B,A,"amarela")}
  R.np=(R.np||0)+1;if(B.isP){R.npMe=(R.npMe||0)+1;if(R.t-(B.goT??-99)<25)R.goPass=(R.goPass||0)+1}if(A.isP)R.nlMe=(R.nlMe||0)+1;crowdEv(B.prog,B.isP||A.isP?.8:pos(B)<=3?.75:.45);if(A.yielded&&A.yielded.to===B.id&&R.t-A.yielded.t<40){A.yielded=null;stEv(A,"order");rcMsg(`${A.code} abriu passagem para ${B.code} (ordem de equipe).`);return}stEv(B,"pass");stEv(A,"lost");
  B.passWhy=B.ovMode?"ov":inDRS(fr(B.prog))?"drs":"";if(B.isP)B.passes=(B.passes||0)+1;const pa=pos(B);if(!B.isP)bubble(B,`Passou ${A.code}!`,"pass",3.5);
  if(B.isP||A.isP||pa<=(B.lap<1?3:6)){narr(passLine(B,A,B.passWhy==="drs",pa),pa<=3||B.isP?2:1);hlight("pass",[B,A],`${B.code} passa ${A.code}${pa<=3?" pelo "+pa+"º lugar":""}`,B.isP||pa===1?3:pa<=3?2:1)}
  if(A.hum&&pos(A)<=14&&rnd()<.4)radio(A,`${B.code} me passou${B.passWhy==="ov"?" com o modo de ultrapassagem":""}.`,{me:1});if(B.hum&&rnd()<.5)radio(B,`Passei o ${A.code}!`,{me:1})}
// (toque antigo por sorteio removido: contatos físicos em contact.js)
function noteIncident(B,A,kind,ev){if(!R.incidents)R.incidents=[];if(R.incidents.some(x=>Math.abs(x.t-R.t)<6))return;const me=B.isP?B:A,o=B.isP?A:B;
  const L=R.geo.len;let ds=(fr(o.prog)-fr(me.prog))*L;if(ds>L/2)ds-=L;if(ds<-L/2)ds+=L;const i=Math.floor(fr(me.prog)*R.geo.N)%R.geo.N;
  const inc={t:R.t,lap:Math.max(1,R.lead+1),kind,cul:B.id,vic:A.id,me:me.id,other:o.id,code:o.code,meCulprit:B===me,
    ev:null,frames:null,decided:false};const P=ev&&ev.pre;
  inc.ev={ds,dy:(o.y||0)-(me.y||0),vyMe:P?P.vy[me.id]:me.vy||0,vyO:P?P.vy[o.id]:o.vy||0,phase:R.geo.ai?R.geo.ai.ph[i]:0,inside:R.geo.ai?Math.sign((me.y||0)-(o.y||0))===R.geo.ai.insN[i]:false,meAtt:P?P.att[me.id]:!!(me.att&&me.att.commit),oAtt:P?P.att[o.id]:!!(o.att&&o.att.commit),oCover:P?P.cov[o.id]:o.coverY!=null,meCover:P?P.cov[me.id]:me.coverY!=null,rear:!!(ev&&ev.rear)};
  R.incidents.push(inc);rcMsg(`Incidente entre ${B.code} e ${A.code}: os comissários vão investigar depois da corrida.`,"warn","punicao");radio(me,`Os comissários anotaram o incidente com ${o.code}. Vai ser investigado depois da corrida.`,{k:"punicao"})}
// replay em alta frequência (10 quadros/s, últimos 14 s) para os comissários
function rbRecord(){if(typeof carWorld!=="function"||typeof TRACKGEO==="undefined"||!TRACKGEO)return;if(R.t<R.rbNext)return;R.rbNext=R.t+.1;
  const f={t:R.t,cars:R.cars.filter(c=>running(c)||c.status==="fin").map(c=>{const w=carWorld(c);return{id:c.id,x:w.x,y:w.y,h:w.h,vis:1}})};if(R.scP!=null&&typeof scWorld==="function"){const p=scWorld();if(p)f.sc=p}
  R.rb.push(f);while(R.rb.length&&R.rb[0].t<R.t-14)R.rb.shift();
  for(const inc of R.incidents)if(!inc.frames&&R.t>=inc.t+4){inc.frames=R.rb.filter(x=>x.t>=inc.t-6&&x.t<=inc.t+4);inc.fx=R.fxq.filter(e=>e.t0<=inc.t+4&&e.t0>=inc.t-60)}}
function inDRS(f){const g=R.geo;return!!g.zoneMask[Math.floor(f*g.N)%g.N]}

function endRace(){if(R.over)return;R.over=true;{const me=R.cars.find(c=>c.isP);R.myPasses=me?me.passes||0:0}try{expAfterRace();feudDecay();if(!(G&&G.mp))crewAfterRace()}catch(e){}
  const fin=R.cars.filter(c=>c.status==="fin").sort((a,b)=>(b.lap-a.lap)||((a.fin+a.pen)-(b.fin+b.pen)));
  const out=R.cars.filter(c=>c.status!=="fin").sort((a,b)=>b.prog-a.prog);
  // vistoria técnica
  const dsqs=[];const dryRace=!R.cars.some(c=>c.used.some(x=>!COMP[x].dry));
  fin.forEach(c=>{let why=null;
    if(c.fuel<1)why="amostra de combustível abaixo de 1 kg";
    else if(dryRace&&new Set(c.used).size<2)why="não usou dois compostos diferentes";
    else if(!c.hum&&rnd()<.002)why="desgaste excessivo da prancha do assoalho";
    if(why){c.status="dsq";c.why=why;dsqs.push(c)}});
  const cls=[];let p=0;const leader=fin.find(c=>c.status==="fin");
  fin.filter(c=>c.status==="fin").forEach(c=>{p++;const pts=p<=10?POINTS[p-1]:0;cls.push({d:c.d.id,team:c.t.id,pos:p,status:"ok",pts,time:c.fin+c.pen-(leader.fin+leader.pen),laps:c.lap,pen:c.pen,code:c.code,best:c.best,stops:c.stops})});
  const fl=R.fast.c;if(fl&&fl.status==="fin"){const e=cls.find(e=>e.d===fl.d.id);if(e)e.fl=true}
  dsqs.forEach(c=>{cls.push({d:c.d.id,team:c.t.id,pos:null,status:"dsq",pts:0,why:c.why,laps:c.lap,code:c.code});rcMsg(`DESCLASSIFICADO: ${c.code} (${c.why}).`,"bad")});
  out.forEach(c=>cls.push({d:c.d.id,team:c.t.id,pos:null,status:c.status==="dns"?"dns":"dnf",pts:0,why:c.why,laps:c.lap,code:c.code}));
  // motor
  const mt=mate();R.result={season:G.season,round:G.round,track:R.C.id,cls,pole:W.pole,fast:fl?{d:fl.d.id,t:R.fast.t}:null,wet:!dryRace,gridMe:W.grid.indexOf(G.me)+1,gridMate:mt?W.grid.indexOf(mt.id)+1:0,hl:R.hl.slice()};
}
function applyPostPenalty(id,secs){const res=R.result;if(!res||!secs)return;const ok=res.cls.filter(e=>e.status==="ok"),rest=res.cls.filter(e=>e.status!=="ok");
  const e=ok.find(x=>x.d===id);if(!e)return;e.time+=secs;e.pen=(e.pen||0)+secs;const lead=ok[0];ok.sort((a,b)=>(b.laps-a.laps)||(a.time-b.time));const t0=ok[0].time;
  ok.forEach((x,i)=>{x.pos=i+1;x.pts=i<10?POINTS[i]:0;x.time-=t0});res.cls=ok.concat(rest)}
function simulateRaceQuick(){let n=0;R.autoStart=true;skipFormation();{const me=R.cars.find(c=>c.isP);if(me&&me.hold)releasePlayer(me,.3)}while(!R.over&&n<4000000){if(R.redChoose)resumeRed({});if(R.ask)answerAsk(R.ask.def,true);step(SIM_DT);n++}}
// ordens do jogador
function orderBox(c,comp){if(!running(c))return;c.pitCall=comp;if(c.pit)return;radio(c,`Entendido, box nesta volta para ${COMP[comp].n}.`)}
function orderCancelBox(c){c.pitCall=null;radio(c,"Ok, ficamos na pista.")}
function orderYield(c,mate){const P=c.d.pers||{aggr:50,disc:65};const p=clamp(.12+P.disc/170+c.d.morale/300-(P.aggr>75?.1:0),.08,.97);// disciplina decide
  if(rnd()<p){c.yieldTo=mate.id;radio(c,`Entendido. Vou deixar ${mate.code} passar.`);c.d.morale=clamp(c.d.morale-5,0,100)}
  else{radio(c,"Negativo! Eu sou mais rápido, não vou abrir.",{pause:false});c.d.morale=clamp(c.d.morale+2,0,100);mate.d.morale=clamp(mate.d.morale-4,0,100);rcMsg(`${c.code} desobedeceu uma ordem de equipe.`,"warn")}}

function pitPredict(c){if(!running(c)||c.pit)return null;const loss=R.pitLane.loss*(R.sc?(R.sc.type==="sc"?.55:.7):1)+(c.dmg.wing>=.3?7:0)+(c.dmg.rwing>=.3?12:0)+(c.dmg.floor>.3?6:0)+(c.pen&&c.penServe?c.pen:0);
  let ahead=0,just=null,jg=1e9;R.cars.forEach(o=>{if(o===c||o.status==="dnf"||o.status==="dsq")return;const g=(o.prog-c.prog)*c.L-(o.pit?Math.max(0,(o.pit.phase==="in"?o.pit.stop:o.pit.stop-o.pit.stopT)):0);if(g>-loss){ahead++;const d=g+loss;if(d<jg){jg=d;just=o}}});
  return{pos:ahead+1,behind:just,gap:jg,loss}}
// corrida sprint (simulada em segundo plano)
function runSprint(){const keepR=R;const oldL=W.laps;W.laps=Math.max(4,Math.round(oldL/3));startRace({});R.cars.forEach(c=>{c.plan={id:"S",stops:[]};c.used=["M","H"]});simulateRaceQuick();W.laps=oldL;
  const cls=R.result.cls.map(e=>({...e,pts:e.status==="ok"&&e.pos<=8?SPRINT_PTS[e.pos-1]:0,fl:false}));
  const res={season:G.season,round:G.round,track:R.C.id,cls,sprint:true};G.results.push(res);W.sprintRes=res;cls.forEach(e=>{const d=G.drivers[e.d];if(d)d.stats.points+=e.pts});
  const me=cls.find(e=>e.d===G.me);news(me&&me.status==="ok"?`Sprint em ${R.C.n}: você terminou em ${me.pos}º${me.pts?` e marcou ${me.pts} ponto${me.pts>1?"s":""}`:""}.`:`Sprint em ${R.C.n}: você não terminou.`,me&&me.pts?"good":"");
  R=keepR;save();return res}
