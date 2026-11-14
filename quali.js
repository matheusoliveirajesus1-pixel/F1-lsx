// ---------- classificação ao vivo: Q1 18 min, Q2 15 min, Q3 12 min no mesmo motor da corrida
// (física, tráfego, limites de pista, bandeiras e comissários iguais aos da corrida; mesmas regras para jogador e IA)
// Cada carro: garagem → volta de saída → volta rápida (cronometrada) → volta de entrada → garagem.
// O resultado medido vira W.quali/W.grid/W.pole pelo próprio doQuali (mesmo formato da classificação simulada).
const QDUR={1:1080,2:900,3:720},QKEEP={1:16,2:10,3:0};
let QLIVE=null;// tempos medidos (id → {q1,q2,q3}) lidos pelo doQuali no fim
function qCars(){const out=[];G.teams.forEach(t=>teamDrivers(t).forEach(d=>out.push(d.id)));return out}
// posição para mostrar na tela: na classificação é a da tabela de tempos
function dpos(c){return R&&R.qMode?(qPosOf(c)||"–"):pos(c)}
function qClock(s){s=Math.max(0,Math.ceil(s));return`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`}
function qGarS(c){const mates=R.cars.filter(x=>x.t===c.t);return R.pitLane.D*garF(c.t)-(mates.indexOf(c)>0?7.5:0)}// duas vagas por garagem
function qComp(){return R.w>.3?(R.w>.7?"W":"I"):"S"}

function startQualiLive(){const ids=qCars();const g0=W.grid;W.grid=ids.slice();if(typeof tsInit==='function')tsInit();const sets0=W.sets?JSON.stringify(W.sets):null;try{startRace({})}finally{W.grid=g0;if(sets0)W.sets=JSON.parse(sets0)/* montar a sessão não gasta pneu */}
  R.form=null;R.started=true;R.go=0;R.autoStart=true;R.L=99;R.lead=0;R.goals=null;R.fast={t:0,c:null};/* sem "volta mais rápida da corrida" */
  const Q=R.qMode={sess:0,clock:0,phase:"pre",res:{},pool:ids.slice(),elim:[],flag:false,red:null,notes:[],nRed:0};
  if(W.qualiRain==="all"){R.rain=1;R.w=.65}else{R.rain=0;R.w=0}
  const L=R.geo.len,PL=R.pitLane,sd=(TRACKGEO&&TRACKGEO.side)||1;
  for(const c of R.cars){c.fuel=c.fuel0=7;c.pitCall=null;c.plan=null;c.tyreInfo=1e9;c.mode="normal";const comp=qComp();c.tyre={c:comp,wear:0,temp:TYRES[comp].opt-15,grain:0,blister:0,punct:false,age:0};c.used=[comp];
    const gar=qGarS(c),E=PL.fe-1;c.pit={s:gar,p0:E,phase:"stop",gar,comp,stop:1e9,stopT:0,note:"",q:true};c.prog=E+gar/L;c.lap=0;c.lapStart=0;c.v=0;c.vy=0;
    const yl=pitLatAt(fr(c.prog));c.y=(yl??0)+sd*PIT_WORK;c.dyn=null;c.q={st:"gar",runs:0,plan:[],push:0,pushMax:1,risk:"normal",k:1};recalc(c)}
  R.msgs=[];R.narr=[];R.radio=[];/* nada da montagem da corrida (volta de apresentação etc.) */
  R.order=R.cars.slice();qSession(1)}

function qSession(n){const Q=R.qMode;Q.sess=n;Q.clock=QDUR[n];Q.phase="run";Q.flag=false;Q.flagT=null;Q.red=null;Q.t0=R.t;
  if(n===3&&W.qualiRain==="late")R.rain=1;
  const pool=Q.pool.map(id=>R.cars.find(c=>c.d.id===id)).filter(Boolean);
  for(const c of pool){const q=c.q;q.runs=0;q.push=0;q.asked=false;q.pushMax=1;if(c.isP){q.plan=[];continue}
    q.risk=pick(["safe","normal","normal","risky"]);
    // primeira saída cedo (pista mais lenta, sem tráfego), segunda no fim, quando a pista está mais rápida
    q.plan=[QDUR[n]-rr(30,n===3?160:330),rr(220,300)]}
  rcMsg(`Q${n} começou: ${QDUR[n]/60} minutos.${QKEEP[n]?` Os ${pool.length-QKEEP[n]} últimos são eliminados.`:" Dez carros disputam a pole."}`,"big","quali");
  narr(`Luz verde no fim do pit lane: começa o Q${n}!`,2);
  const me=pool.find(c=>c.isP);if(me)qAskPlan(me);else if(R.cars.some(c=>c.isP))qSpect()}
// o jogador já está fora: a sessão continua com os outros (dá para acelerar)
function qSpect(){const me=R.cars.find(c=>c.isP);if(me&&!R.qMode.spect){R.qMode.spect=true;radio(me,`${G.engineer||"Engenheiro"}: "Acabou para nós hoje. Vamos acompanhar o resto da classificação daqui."`)}}

// ---------- engenheiro sugere, você confirma (sem resposta, vale a sugestão)
function qAskPlan(c){const n=R.qMode.sess,eng=G.engineer||"Engenheiro";
  pushAsk({c,kind:"qplan",dur:25,q:`${eng}: "Q${n}: sugiro duas saídas, uma cedo para garantir tempo e outra no fim, com a pista mais rápida. Confirma?"`,
    opts:[["two","Duas saídas (cedo e no fim)"],["late","Uma saída só, no fim"],["now","Sair já e fazer duas voltas rápidas"]],def:"two",
    cb:k=>{const q=c.q,D=QDUR[n];q.pushMax=1;if(k==="late")q.plan=[300];else if(k==="now"){q.plan=[D-2,270];q.pushMax=2}else q.plan=[D-90,270];
      radio(c,`${eng}: "${k==="late"?"Certo: esperamos e saímos com 5 minutos no relógio.":k==="now"?"Vamos agora: duas voltas rápidas seguidas e depois mais uma tentativa no fim.":"Combinado: primeira saída em instantes, segunda com 4 minutos e meio."}"`)}})}
function qAskGo(c){const Q=R.qMode,eng=G.engineer||"Engenheiro";c.q.asked=true;
  const onTrack=R.cars.filter(x=>running(x)&&!x.pit&&x.q&&x.q.st==="push").length;const pos=qPosOf(c);
  pushAsk({c,kind:"qgo",dur:15,q:`${eng}: "Hora de sair${Q.clock<330?" para a última tentativa":""}. ${onTrack} carro${onTrack===1?"":"s"} em volta rápida${pos?`, você está em P${pos}`:""}. Pneu ${COMP[qComp()].n.toLowerCase()} novo. Volta no limite?"`,
    opts:[["normal","Sair: volta no limite"],["safe","Sair: volta segura"],["risky","Sair: tudo ou nada"],["wait","Esperar 40 s"]],def:"normal",
    cb:k=>{if(k==="wait"){if(Q.clock-40<140){radio(c,`${eng}: "Não dá para esperar: depois disso não abrimos a volta antes da bandeira. Saindo agora."`);c.q.risk="normal";qRelease(c);return}c.q.plan[c.q.runs]=Q.clock-40;c.q.asked=false;radio(c,`${eng}: "Ok, seguramos 40 segundos."`);return}c.q.risk=k;qRelease(c)}})}
// resposta de pergunta da classificação
(function(){const base=answerAskObj;globalThis.answerAskObj=function(a,k,auto){if(!a.cb)return base(a,k,auto);const said=a.opts.find(o=>o[0]===k);if(said&&!auto)radio(a.c,said[1],{me:1});a.cb(k,auto)}})();

// ---------- saída da garagem e volta para ela
function qRelease(c){const P=c.pit;if(!P||P.phase!=="stop"||!running(c))return;P.comp=qComp();if(c.isP&&W.sets&&W.sets[P.comp]!=null){if(W.sets[P.comp]>0){W.sets[P.comp]--;P.newSet=true}else P.newSet=false}P.stop=P.stopT;/* termina a espera: o pitMove libera (com a checagem de liberação insegura) */c.q.st="pitout";c.q.runs++;c.q.push=0;c.q.asked=false;
  if(c.isP)radio(c,`${G.engineer||"Engenheiro"}: "Pode ir. Pneus ${COMP[P.comp].n.toLowerCase()} novos. Cuidado com quem estiver na volta rápida."`)}
function qIn(c){c.q.st="in";c.pitCall=c.tyre.c;c.mode="normal";c.q.k=1}
function qPushMode(c){const r=c.q.risk;c.mode=r==="safe"?"normal":"attack";c.q.k=r==="risky"?1.004:r==="safe"?.997:1}
function qPosOf(c){const o=qOrder();const i=o.indexOf(c);return i>=0&&qTime(c)!=null?i+1:0}
function qTime(c,s){const r=R.qMode.res[c.d.id];return r?r["q"+(s||R.qMode.sess)]:undefined}

(function(){const base=enterPit;globalThis.enterPit=function(c,s0,E,red){if(!R.qMode||!c.q)return base(c,s0,E,red);
  c.pit={s:s0,p0:E,phase:"in",gar:qGarS(c),comp:c.tyre.c,stop:1e9,stopT:0,note:"",q:true};c.pitCall=null;c.inLap=false;c.att=null;c.q.st="box";
  if(c.isP)radio(c,"Entrando no pit lane. Limitador ligado.")}})();
(function(){const base=pitArrive;globalThis.pitArrive=function(c){if(!R.qMode||!c.pit||!c.pit.q)return base(c);c.q.st="gar";c.q.garT=R.t}})();
(function(){const base=pitService;globalThis.pitService=function(c){if(!R.qMode||!c.pit||!c.pit.q)return base(c);const comp=c.pit.comp;
  c.tyre={c:comp,wear:c.pit.newSet===false?.12:0,temp:TYRES[comp].opt-15,grain:0,blister:0,punct:false,age:0};if(!c.used.includes(comp))c.used.push(comp);
  if(c.isP&&c.pit.newSet===false)radio(c,`${G.engineer||"Engenheiro"}: "Acabaram os ${COMP[comp].n.toLowerCase()} novos: vamos com um jogo usado."`);
  /* tempo de garagem entre as saídas: os mecânicos consertam o carro */if(c.dmg){for(const k in c.dmg)if(typeof c.dmg[k]==="number"&&k!=="off")c.dmg[k]=0;if(Array.isArray(c.dmg.whl))c.dmg.whl.fill(0);c.dmg.off=-1;c._wbL=0;c._wbR=0;c.bo=0;c.floorMsg=0;if(typeof dmgSync==="function")dmgSync(c)}
  recalc(c)}})();
(function(){const base=exitPit;globalThis.exitPit=function(c){const q=R.qMode&&c.q;base(c);if(!q)return;const Q=R.qMode;if(Q.red||Q.flag||Q.phase!=="run"){qIn(c);return}c.q.st="out";c.mode="normal"}})();
(function(){const base=pitRelease;globalThis.pitRelease=function(c){const p0=c.pen;const h=base(c);if(R&&R.qMode&&c.pen>p0){/* na classificação não há tempo a cumprir: vira advertência e anotação */c.pen=p0;c.penServe=false;if(typeof repAdd==="function")repAdd(c,"liberação insegura no pit lane",false);R.qMode.notes.push(`${c.code}: advertência por liberação insegura no pit lane.`)}return h}})();

// ---------- volta cronometrada: só vale a volta rápida inteira, sem limite de pista, sem amarela
(function(){const base=onLap;globalThis.onLap=function(c){if(!R.qMode||!c.q)return base(c);const Q=R.qMode,q=c.q;const tc=c._cross??R.t,lt=tc-c.lapStart,del=c.lapDel,inPit=!!c.pit;base(c);c.ovMode=false;/* modo de ultrapassagem é de corrida */if(inPit)return;
  if(q.st==="out"){if(Q.flag||Q.red||Q.phase!=="run"){qIn(c);if(c.isP)radio(c,`${G.engineer||"Engenheiro"}: "Bandeira quadriculada antes de abrirmos a volta. Box."`);return}q.st="push";q.push++;qPushMode(c);if(c.isP)radio(c,`${G.engineer||"Engenheiro"}: "Volta rápida. Vai!"`);return}
  if(q.st==="push"){qLapDone(c,lt,del);const more=!Q.flag&&!Q.red&&Q.phase==="run"&&(q.push<q.pushMax||(del&&q.push<q.pushMax+1))&&c.tyre.wear<.4;if(more){q.push++;qPushMode(c)}else qIn(c)}}})();
function qLapDone(c,lt,del){const Q=R.qMode,key="q"+Q.sess,eng=G.engineer||"Engenheiro";
  if(del){if(c.isP){radio(c,`${eng}: "Volta apagada: ${fmtT(lt)} não vale (${c.qDelWhy||"limite de pista"})."`);Q.notes.push(`Q${Q.sess}: sua volta de ${fmtT(lt)} foi apagada (${c.qDelWhy||"limite de pista"}).`)}c.qDelWhy=null;return}
  const r=Q.res[c.d.id]=Q.res[c.d.id]||{};const prev=r[key];if(prev!=null&&lt>=prev){if(c.isP)radio(c,`${eng}: "${fmtT(lt)}, não melhorou (${fmtT(prev)} continua)."`);return}
  r[key]=+lt.toFixed(3);const ord=qOrder(),p=ord.indexOf(c)+1,lead=ord[0],lt0=qTime(lead);
  if(p===1&&ord.filter(x=>qTime(x)!=null).length>1){rcMsg(`${c.code} assume a ponta do Q${Q.sess}: ${fmtT(lt)}.`,"","quali");if(Q.sess===3)narr(`${c.code} crava ${fmtT(lt)} e é o pole provisório!`,2)}
  if(c.isP){const cut=QKEEP[Q.sess];radio(c,`${eng}: "${fmtT(lt)}, P${p}${p>1?`, a ${(lt-lt0).toFixed(3)} do ${lead.code}`:"!"}.${cut?(p<=cut?` Dentro do corte (P${cut}).`:` Fora do corte: precisamos de P${cut}.`):""}"`)}}

// ---------- pilotagem: volta de saída e de entrada mais lentas (aquecer pneu, não atrapalhar), volta rápida no risco escolhido
(function(){const base=aiDrive;globalThis.aiDrive=function(c,dt){const m=base(c,dt);if(!R.qMode||!c.q)return m;const st=c.q.st;
  if(st==="out")return(1-fr(c.prog))*R.geo.len>700?m*.8:m;/* acelera no fim da volta de saída para abrir a volta embalado */
  let mm=st==="in"||st==="box"?m*.78:st==="push"?m*(c.q.k||1):m;
  /* ninguém chega na traseira de quem está na mesma faixa mais rápido do que consegue frear (16 m/s²); passar pelo lado continua livre */
  if(!c.ex&&!c.pit){const L=R.geo.len,f=fr(c.prog),vb=speedAt(c,f)*c.k;if(vb>1)for(const o of R.cars){if(o===c||!running(o)||o.pit)continue;const d=fr(o.prog-c.prog)*L;if(d<=0||d>90||Math.abs((o.y||0)-(c.y||0))>CARW+.7)continue;const vo=o.v||0;const cap=Math.sqrt(Math.max(0,vo*vo+2*16*(d-7)));if(cap<vb*mm)mm=Math.min(mm,cap/vb)}}
  return mm}})();
// o cérebro do piloto continua cuidando de energia, defesa e linha; o ritmo segue a fase da volta
(function(){if(typeof driverBrain!=="function")return;const base=driverBrain;globalThis.driverBrain=function(c){base(c);if(!R||!R.qMode||!c.q||!running(c)||c.pit)return;const st=c.q.st;
  const m=st==="push"?(c.q.risk==="safe"?"normal":"attack"):"normal";if(c.mode!==m){c.mode=m;recalc(c)}
  const b=c.br||(c.br={});b.what=st==="push"?(c.q.risk==="risky"?"Volta rápida: tudo ou nada":c.q.risk==="safe"?"Volta rápida segura":"Volta rápida no limite"):st==="out"?"Volta de saída: aquecendo pneus e carregando a bateria":st==="in"?"Volta de entrada":b.what}})();
(function(){for(const fn of["leaderLap","autoStrategy","askDriver"]){const base=globalThis[fn];if(typeof base!=="function")continue;globalThis[fn]=function(...a){if(R&&R.qMode)return;return base(...a)}}})();

// ---------- bandeiras: na classificação não há safety car; acidente sério = bandeira vermelha (relógio para, todos para os boxes)
(function(){const base=triggerSC;globalThis.triggerSC=function(type){if(!R.qMode)return base(type);const by=R.cars.filter(c=>c.status==="dnf").slice(-1)[0];if(type==="sc")qRedFlag(by?`${by.code} parado na pista`:"incidente");else if(by)addYellow(fr(by.prog),R.t+60,true)}})();
(function(){const base=redFlag;globalThis.redFlag=function(why){if(!R.qMode)return base(why);qRedFlag(why)}})();
function qRedFlag(why){const Q=R.qMode;if(Q.red||Q.phase!=="run"||Q.flag)return;Q.red={t:R.t,why};Q.nRed++;
  rcMsg(`BANDEIRA VERMELHA no Q${Q.sess}: ${why}. Relógio parado em ${qClock(Q.clock)}.`,"big","quali");narr(`Bandeira vermelha! A sessão está interrompida (${why}).`,3);Q.notes.push(`Q${Q.sess}: bandeira vermelha (${why}) com ${qClock(Q.clock)} no relógio.`);
  for(const c of R.cars){if(!running(c)||!c.q)continue;if(!c.pit&&(c.q.st==="out"||c.q.st==="push"))qIn(c)}/* a volta em andamento não vale */
  const me=R.cars.find(c=>c.isP&&running(c));if(me&&!me.pit)radio(me,`${G.engineer||"Engenheiro"}: "Bandeira vermelha, volta abortada. Devagar para o box."`)}
(function(){const base=stewAdd;globalThis.stewAdd=function(o){if(!R||!R.qMode||o.kind!=="yellow")return base(o);const c=R.cars.find(x=>x.id===o.cul);if(!c)return;
  /* amarela na classificação: quem não tirou o pé perde a volta (medido na zona, igual na corrida) */c.lapDel=1;c.qDelWhy="não reduziu na bandeira amarela";
  if(c.q&&c.q.st==="push"){rcMsg(`${c.code}: volta apagada, não reduziu na amarela (${Math.round((o.ratio||1)*100)}% da velocidade normal).`,"warn","punicao");if(typeof stewReport==="function")stewReport(c,"volta apagada","não reduzir sob bandeira amarela",`passou a ${Math.round((o.ratio||1)*100)}% da velocidade normal na zona`)}}})();
function qTrackLimit(c){c.qDelWhy=c.qDelWhy||"limite de pista";if(c.q&&c.q.st==="push"&&(c.isP||(c.qTlN=(c.qTlN||0)+1)<=1))rcMsg(`${c.code}: volta apagada por limite de pista.`,"","limites")}
// punições dos comissários na classificação: posições no grid da corrida (não há tempo para cumprir)
(function(){const base=penalize;globalThis.penalize=function(c,secs,why,lic,ev){if(!R||!R.qMode)return base(c,secs,why,lic,ev);if(c.status!=="run")return;
  if(/azu/.test(why||""))why="atrapalhar um carro em volta rápida";const n=secs>=10?5:3;c.d.gridPen=(c.d.gridPen||0)+n;
  rcMsg(`${c.code}: ${n} posições no grid da corrida por ${why}.`,"warn","punicao");if(typeof stewReport==="function")stewReport(c,`${n} posições no grid`,why,ev);if(lic&&typeof licAdd==="function")licAdd(c.d,lic,why);
  R.qMode.notes.push(`${c.code}: ${n} posições no grid por ${why}${ev?` (${ev})`:""}.`);if(c.isP)radio(c,`${G.engineer||"Engenheiro"}: "Os comissários nos deram ${n} posições no grid: ${why}."`)}})();
(function(){const base=penDrive;globalThis.penDrive=function(c,kind,why,lic,ev){if(!R||!R.qMode)return base(c,kind,why,lic,ev);penalize(c,kind==="sg"?20:10,why,lic,ev)}})();

// ---------- relógio, saídas, fim de sessão, bandeira azul de quem não está em volta rápida
(function(){const base=step;globalThis.step=function(dt){base(dt);if(R&&R.qMode&&!R.over)qTick(dt)}})();
function qTick(dt){const Q=R.qMode;
  if(Q.phase==="break"){if(R.t>=Q.breakEnd)qSession(Q.sess+1);return}
  if(Q.phase==="done"){if(R.t-Q.doneT>15)qFinish();return}
  if(Q.phase!=="run")return;
  if(!Q.red&&!Q.flag){Q.clock-=dt;if(Q.clock<=0&&!Q.flag){Q.clock=0;Q.flag=true;Q.flagT=R.t;rcMsg(`Bandeira quadriculada no Q${Q.sess}: vale só a volta que já foi aberta.`,"big","quali");narr(`Bandeira quadriculada! Últimas voltas do Q${Q.sess}.`,2)}}
  const pool=Q.pool.map(id=>R.cars.find(c=>c.d.id===id)).filter(Boolean);
  for(const c of pool){if(!running(c)||!c.pit||c.pit.phase!=="stop"||c.q.st!=="gar"||Q.flag||Q.red||R.t-(c.q.garT??-99)<25)continue;/* troca de pneus e preparo: pelo menos 25 s na garagem */const q=c.q;let next=q.plan[q.runs];
    // sem tempo marcado e ainda dá: mais uma saída (a IA e o engenheiro do jogador fazem a mesma conta)
    if(next==null&&qTime(c)==null&&Q.clock>150&&q.runs<4){next=Q.clock;q.plan[q.runs]=next}
    if(next==null||Q.clock>next)continue;
    if(c.isP){if(Q.clock<140&&q.runs===0){radio(c,`${G.engineer||"Engenheiro"}: "Sem tempo para esperar: saindo agora."`);q.risk="normal";qRelease(c)}else if(!q.asked&&!R.ask)qAskGo(c)}
    else qRelease(c)}
  // pista emborrachando: só quem está rodando deposita borracha (o pistaTick soma o ritmo de corrida, com todos na pista; aqui troca pelo dos carros que de fato estão rodando)
  if(R.w<=.45&&R.rubber!=null){const on=R.cars.filter(c=>running(c)&&!c.pit).length/Math.max(1,R.cars.length);R.rubber=clamp(R.rubber-dt*.00045+dt*.00045*1.6*on,0,1)}
  // volta de saída: o piloto colhe energia nas freadas e tira o pé para abrir a volta rápida com a bateria cheia
  for(const c of R.cars)if(running(c)&&c.q&&(c.q.st==="out"||c.q.st==="pitout"))c.batt=Math.min(100,c.batt+dt*.8);
  // bandeira azul: quem não está em volta rápida abre para quem está (ignorar = atrapalhar, julgado em pen.js)
  const L=R.geo.len;const push=R.cars.filter(o=>running(o)&&!o.pit&&o.q&&o.q.st==="push");
  for(const c of R.cars){if(!running(c)||c.pit||!c.q){continue}c.blue=false;if(c.q.st==="push")continue;for(const o of push){const d=fr(c.prog-o.prog)*L;if(d>0&&d<200){c.blue=true;break}}}
  // bandeira vermelha: retoma quando todos estiverem na garagem e a pista limpa
  if(Q.red){const all=pool.every(c=>!running(c)||(c.pit&&c.pit.phase==="stop"));if(all&&R.t-Q.red.t>90){Q.red=null;rcMsg(`Sessão retomada: ${qClock(Q.clock)} no relógio.`,"big","quali");
    for(const c of pool){if(c.isP||!running(c))continue;const q=c.q;if(q.plan[q.runs]!=null&&q.plan[q.runs]>=Q.clock)q.plan[q.runs]=Q.clock-rr(0,50)}}}
  // fim: todos os carros da sessão na garagem depois da bandeira
  if(Q.flag){const all=pool.every(c=>!running(c)||(c.pit&&c.pit.phase==="stop"));if(all||R.t-Q.flagT>420)qEndSession()}}
function qEndSession(){const Q=R.qMode,n=Q.sess,key="q"+n;Q.phase="end";
  const pool=Q.pool.map(id=>R.cars.find(c=>c.d.id===id)).filter(Boolean);const tm=c=>{const r=Q.res[c.d.id];return r&&r[key]!=null?r[key]:999};
  const sorted=pool.slice().sort((a,b)=>tm(a)-tm(b));/* mesma ordem e desempate do doQuali */const me=R.cars.find(c=>c.isP);
  if(QKEEP[n]){const keep=QKEEP[n];const out=sorted.slice(keep);Q.elim=out.concat(Q.elim);Q.pool=sorted.slice(0,keep).map(c=>c.d.id);
    rcMsg(`Fim do Q${n}. Eliminados: ${out.map(c=>c.code).join(", ")}.`,"big","quali");
    if(me&&sorted.includes(me)){const p=sorted.indexOf(me)+1;radio(me,`${G.engineer||"Engenheiro"}: "${p<=keep?`Passamos para o Q${n+1}! P${p} no Q${n}.`:`Ficamos fora no Q${n}: P${p}. ${tm(me)<999?`Faltaram ${(tm(me)-tm(sorted[keep-1])).toFixed(3)} s.`:"Sem tempo válido."}`}"`)}
    Q.phase="break";Q.breakEnd=R.t+120;rcMsg(`Intervalo: o Q${n+1} começa em 2 minutos.`,"","quali");if(me&&!Q.pool.includes(me.d.id))qSpect()}
  else{const p=me?sorted.indexOf(me)+1:0;rcMsg(`Fim da classificação! Pole position: ${sorted[0].code} (${fmtT(tm(sorted[0]))}).`,"big","quali");narr(`${sorted[0].code} é o pole position!`,3);if(me&&p)radio(me,`${G.engineer||"Engenheiro"}: "${p===1?"POLE POSITION! Que volta!":`P${p} no grid. ${tm(me)<999?`A ${(tm(me)-tm(sorted[0])).toFixed(3)} da pole.`:""}`}"`);
    Q.phase="done";Q.doneT=R.t}}
// fim: o resultado medido passa pelo doQuali (punições de grid, 107%, notas, mesmo formato da classificação simulada)
function qFinish(){const Q=R.qMode;if(Q.finished)return;Q.finished=true;if(R.stewQ&&R.stewQ.length){for(const s of R.stewQ)s.at=R.t;stewTick()}/* investigações pendentes são julgadas agora */
  QLIVE=Q.res;try{doQuali("normal")}finally{QLIVE=null}
  W.quali.live=true;W.quali.notes=(W.quali.notes||[]).concat(Q.notes);W.qLiveStats={red:Q.nRed};
  if(typeof mediaAfterQuali==="function")mediaAfterQuali();if(typeof UI!=="undefined"){UI.speed=1;if(UI.raf)cancelAnimationFrame(UI.raf)}if(typeof sndSilence==="function")sndSilence();
  R.over=true;W.step="quali";if(typeof render==="function")render()}
(function(){const base=qualiLap;globalThis.qualiLap=function(d,t,sess,wet,risk){if(QLIVE){const r=QLIVE[d.id];const tm=r&&r["q"+sess];return tm==null?null:tm}return base(d,t,sess,wet,risk)}})();

// ---------- tela: torre com tempos, relógio da sessão, linha de corte, cartão da classificação e velocidade
function qOrder(){const Q=R.qMode,key="q"+Q.sess;const tm=c=>{const r=Q.res[c.d.id];return r&&r[key]!=null?r[key]:999};
  const pool=Q.pool.map(id=>R.cars.find(c=>c.d.id===id)).filter(Boolean).sort((a,b)=>tm(a)-tm(b));return pool.concat(Q.elim.filter(c=>!pool.includes(c)))}
function qGapTxt(c){const Q=R.qMode,o=qOrder();if(!Q.pool.includes(c.d.id)){const r=Q.res[c.d.id]||{};const t=r.q2??r.q1;return t!=null?`${fmtT(t)}`:"—"}
  if(!running(c))return"OUT";const t=qTime(c),st=c.q&&c.q.st;const tag=st==="push"?" ▸":"";if(t==null)return st==="push"?"VOLTA":st==="out"||st==="pitout"?"SAÍDA":st==="in"||st==="box"?"ENTRADA":"BOX";
  const t0=qTime(o[0]);return(o[0]===c?fmtT(t):`+${(t-t0).toFixed(3)}`)+tag}
(function(){if(typeof gapTxt==="function"){const base=gapTxt;globalThis.gapTxt=function(c){return R&&R.qMode?qGapTxt(c):base(c)}}if(typeof relGap==="function"){const base=relGap;globalThis.relGap=function(me,c){return R&&R.qMode?qGapTxt(c):base(me,c)}}
  if(typeof flagInfo==="function"){const base=flagInfo;globalThis.flagInfo=function(){if(R&&R.qMode){const Q=R.qMode;if(Q.red)return["BANDEIRA VERMELHA","#E10600","#fff"];if(Q.flag&&Q.phase==="run")return["BANDEIRA QUADRICULADA","#111","#fff"]}return base()}}})();
function qHead(){const Q=R.qMode;if(Q.phase==="break")return`INTERVALO · Q${Q.sess+1} em ${qClock(Q.breakEnd-R.t)}`;if(Q.phase==="done"||Q.phase==="end")return`FIM DO Q${Q.sess}`;return`Q${Q.sess} · ${qClock(Q.clock)}${Q.red?" · VERMELHA":Q.flag?" · 🏁":""}`}
(function(){if(typeof updatePanels!=="function")return;const base=updatePanels;globalThis.updatePanels=function(now){if(!R||!R.qMode)return base(now);const ro=R.order;R.order=qOrder();try{base(now)}finally{R.order=ro}qPanels()}})();
function qPanels(){const Q=R.qMode,h=qHead();const a=$("#lapc");if(a&&a.textContent!==h)a.textContent=h;const b=$("#hLap");if(b&&b.textContent!==h)b.textContent=h;
  const cut=QKEEP[Q.sess]&&Q.phase==="run"?QKEEP[Q.sess]:0;let st=$("#qcut");if(!st){st=document.createElement("style");st.id="qcut";document.head.appendChild(st)}
  const css=cut?`#tower tr:nth-child(${cut}) td{box-shadow:inset 0 -2px 0 #E10600}.h-tower.full #hRows>.h-row:nth-child(${cut}){box-shadow:inset 0 -2px 0 #E10600}`:"";if(st.textContent!==css)st.textContent=css;
  const me=R.cars.find(c=>c.isP),inf=$("#qInfo");if(inf&&me){const p=qPosOf(me),t=qTime(me),q=me.q||{};const nx=q.plan&&q.plan[q.runs];
    const stx={gar:"Na garagem",pitout:"Saindo do box",out:"Volta de saída",push:"Volta rápida",in:"Volta de entrada",box:"Entrando no box"}[q.st]||"";
    const s=!Q.pool.includes(me.d.id)?"Eliminado: acompanhando a sessão":`${stx}${t!=null?` · melhor ${fmtT(t)} (P${p})`:" · sem tempo"}${q.st==="gar"&&nx!=null&&Q.phase==="run"&&!Q.flag?` · próxima saída com ${qClock(nx)}`:""}`;if(inf.textContent!==s)inf.textContent=s;
    const g=$("#qGoB");if(g)g.disabled=!(Q.phase==="run"&&!Q.flag&&!Q.red&&me.pit&&me.pit.phase==="stop"&&Q.pool.includes(me.d.id));
    const e=$("#qEndB");if(e)e.hidden=!(Q.phase==="done"||(Q.phase==="break"))}
  const e=$("#qEndB");if(e){const t=Q.phase==="done"?"Ver o resultado da classificação":Q.phase==="break"?`Pular o intervalo (Q${Q.sess+1})`:"";if(e.textContent!==t)e.textContent=t;e.hidden=!t}}
(function(){if(typeof raceStep!=="function")return;const base=raceStep;globalThis.raceStep=function(){base();if(R&&R.qMode)qDecor()}})();
function qDecor(){const rc=document.querySelector(".radioctl");if(rc){const bx=rc.querySelector('[data-act="box"]');const bc=bx&&bx.closest(".card");if(bc)bc.hidden=true;
    rc.insertAdjacentHTML("afterbegin",`<div class="card" style="grid-column:1/-1"><h3>Classificação</h3><p class="muted" id="qInfo" style="margin:2px 0 8px;font-size:14px"></p><div class="row"><button class="btn sm go" data-act="qGo" id="qGoB">Sair para a pista agora</button><button class="btn sm" data-act="qBox">Voltar para o box</button></div><p class="muted" style="font-size:12px;margin:6px 0 0">O engenheiro sugere quando sair e como atacar a volta; sem resposta, vale a sugestão.</p></div>`)}
  const pb=$("#pauseb");if(pb)pb.insertAdjacentHTML("afterend",`<div class="seg" id="qSpd" role="group" aria-label="Velocidade da sessão">${[1,2,4,8].map(v=>`<button data-act="qSpd" data-k="${v}" class="${UI.speed===v?"on":""}">${v}×</button>`).join("")}</div><button class="btn sm go" data-act="qEnd" id="qEndB" hidden></button>`);
  const sk=$("#skipForm");if(sk)sk.hidden=true;
  /* passos do fim de semana: estamos na classificação, não na corrida */const sp=[...document.querySelectorAll(".steps span")];const qi=sp.findIndex(x=>/Classifica/.test(x.textContent));if(qi>=0)sp.forEach((x,i)=>{x.classList.toggle("on",i===qi);x.classList.toggle("done",i<qi)})}
document.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b||typeof R==="undefined"||!R||!R.qMode)return;const a=b.dataset.act,Q=R.qMode,me=R.cars.find(c=>c.isP);
  if(a==="qSpd"){UI.speed=+b.dataset.k;document.querySelectorAll("#qSpd button").forEach(x=>x.classList.toggle("on",+x.dataset.k===UI.speed))}
  else if(a==="qGo"&&me&&me.pit&&me.pit.phase==="stop"&&me.q.st==="gar"&&R.t-(me.q.garT??-99)>=25&&Q.phase==="run"&&!Q.flag&&!Q.red&&Q.pool.includes(me.d.id)){if(R.ask&&R.ask.kind==="qgo"){answerAsk("normal")}else{me.q.risk=me.q.risk||"normal";qRelease(me)}}
  else if(a==="qBox"&&me&&running(me)&&!me.pit&&me.q&&me.q.st!=="in"){qIn(me);radio(me,`${G.engineer||"Engenheiro"}: "Entendido, box nesta volta."`)}
  else if(a==="qEnd"){if(Q.phase==="done")qFinish();else if(Q.phase==="break")Q.breakEnd=R.t}});
if(typeof LAZY_RACE_ACTS!=="undefined")LAZY_RACE_ACTS.qLive=1;
// tela da classificação: opção de disputar ao vivo (a simulada continua para quem quiser só o resultado)
(function(){if(typeof qualiStep!=="function")return;const base=qualiStep;globalThis.qualiStep=function(){base();if(W.quali||W.mp)return;const g=document.querySelector("#wk .grid2");if(!g)return;
  g.insertAdjacentHTML("afterbegin",`<div class="card" style="grid-column:1/-1"><h3>Classificação ao vivo</h3><p style="margin:2px 0 8px">Q1 (18 min), Q2 (15 min) e Q3 (12 min) na pista, com tráfego, bandeiras e comissários. O engenheiro sugere quando sair e como atacar; você confirma. Dá para acelerar o tempo.</p><button class="btn go" data-act="qLive">Ir para a pista</button><p class="muted" style="font-size:13px;margin:8px 0 0">Prefere só o resultado? As opções abaixo simulam a classificação na hora, sem ir para a pista.</p></div>`)}})();
document.addEventListener("click",e=>{const b=e.target.closest('[data-act="qLive"]');if(!b)return;if(typeof lazyGate==="function"&&lazyGate("qLive",b))return;startQualiLive();W.step="race";CAM.init=0;UI.speed=1;if(G.settings.sound&&!UI.sound)UI.sound=sndToggle(true);render()});
