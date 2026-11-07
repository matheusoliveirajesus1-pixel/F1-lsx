// ===================== DICAS DA EQUIPE E DECISÕES AUTOMÁTICAS =====================
// O engenheiro observa a corrida e sugere o que fazer (com um botão para aplicar na hora).
// As decisões óbvias (pneu furado, chuva forte com slick, bateria vazia, ritmo atrás do safety car) podem ser automáticas.
const TIPS={cur:null,cd:{},next:0,st:{},shown:0};
function tipsReset(){TIPS.cur=null;TIPS.cd={};TIPS.next=0;TIPS.st={};TIPS.shown=0}
function autoDecOn(){return!(G&&G.settings&&G.settings.autoDec===false)}
function tipsOn(){return!(G&&G.settings&&G.settings.tips===false)}
// mesma ação dos botões da tela (funciona também como convidado no multijogador)
function uiAct(a,k){const g=R&&R.mpGuest;const H=f=>typeof hostCmd==="function"?hostCmd(f):f();
  switch(a){case"mode":return g?mpCmd({m:k}):H(()=>cmdMode(k));case"ers":return g?mpCmd({e:k}):H(()=>cmdErs(k));case"box":return g?mpCmd({b:k||null}):H(()=>cmdBox(k||null));
  case"go":return g?mpCmd({go:1}):H(()=>cmdGo());case"def":return g?mpCmd({df:1}):H(()=>cmdDef());case"tow":return g?mpCmd({tw:1}):H(()=>cmdTow());
  case"astyle":return g?mpCmd({as:k}):H(()=>cmdStyle(k));case"eplan":return g?mpCmd({pl:k}):H(()=>cmdPlan(k))}}
function lapsLeft(me){return Math.max(0,R.L-(me.lap||0))}
function bestDry(me){const left=lapsLeft(me);return left<=Math.max(6,R.L*.32)?"S":left<=R.L*.6?"M":"H"}
function wetComp(){return R.w>.78?"W":"I"}
function secs(m,me){return m/Math.max(30,me.v||60)}
function nextCornerName(me){const g=R.geo;if(!g||!g.corners.length)return"próxima curva";const i=Math.floor(fr(me.prog)*g.N);let best=null,bd=1e9;for(const c of g.corners){const d=(c.i-i+g.N)%g.N;if(d>8&&d<bd){bd=d;best=c}}return best?best.n:"próxima curva"}
const fmtS=s=>s.toFixed(1).replace(".",",");
// regras em ordem de prioridade: devolvem {txt, btn:[[rótulo, ação, k]], dur}
const TIP_RULES=[
  {k:"furo",cd:40,f:me=>(me.tyre.punct||(me.dmg.wing>=.5))&&!me.pitCall&&!me.pit?{txt:me.tyre.punct?"Pneu furado! Box nesta volta.":"A asa dianteira está quebrada. Box para trocar o bico.",btn:[["Box agora","box",R.w>.45?wetComp():bestDry(me)]]}:null},
  {k:"chuva",cd:50,f:me=>COMP[me.tyre.c].dry&&R.w>.42&&!me.pitCall?{txt:`A pista está molhada demais para slick. ${R.w>.78?"Pneu de chuva":"Intermediário"} agora?`,btn:[[R.w>.78?"Box: chuva":"Box: intermediário","box",wetComp()]]}:null},
  {k:"seco",cd:60,f:me=>!COMP[me.tyre.c].dry&&R.w<.2&&!me.pitCall?{txt:"O traçado já secou. Hora de voltar para o slick.",btn:[["Box: slick","box",bestDry(me)]]}:null},
  {k:"sc",cd:120,f:me=>R.sc&&!me.pitCall&&!me.pit&&lapsLeft(me)>3&&me.tyre.wear>.28?{txt:`${R.sc.type==="sc"?"Safety car":"Safety car virtual"}! Parar agora custa bem menos tempo.`,btn:[["Box agora","box",R.w>.45?wetComp():bestDry(me)]],dur:20}:null},
  {k:"gasto",cd:150,f:me=>COMP[me.tyre.c].dry&&me.tyre.wear>.66&&!me.pitCall&&lapsLeft(me)>2?{txt:`Pneus ${Math.round(me.tyre.wear*100)}% gastos. A janela de box está aberta: entra nesta volta?`,btn:[["Box: "+COMP[bestDry(me)].n.toLowerCase(),"box",bestDry(me)]]}:null},
  {k:"freio",cd:120,f:me=>me.mc&&me.mc.tBrk>960&&me.mode!=="save"?{txt:`Freios a ${Math.round(me.mc.tBrk)} °C. Alivie um pouco antes das freadas por uma volta.`,btn:[["Poupar","mode","save"]]}:null},
  {k:"bateria",cd:90,f:me=>me.batt<12&&me.ers!=="save"&&!R.sc?{txt:"Bateria quase vazia. Recarrega nesta volta e volta forte na seguinte.",btn:[["Recarregar","ers","save"]]}:null},
  {k:"ataque",cd:75,f:me=>{const A=me.ahead;if(!A||!running(A)||A.pit||A.t===me.t||R.sc||me.goReq)return null;const g=secs(me.dA,me);if(g>.9||me.batt<30)return null;
    return{txt:`Você está a ${fmtS(g)} s do ${A.code}${A.batt<me.batt-10?" e ele tem menos bateria":""}. Na próxima reta dá: ataque!`,btn:[["Atacar agora","go"],["Boost","ers","attack"]]}}},
  {k:"defesa",cd:75,f:me=>{const B=me.behind;if(!B||!running(B)||B.pit||B.t===me.t||R.sc||me.defOrd)return null;const g=secs(me.dB,me);if(g>.75)return null;
    if(!((B.batt||0)>(me.batt||0)+8||(B.tow||0)>.3))return null;return{txt:`O ${B.code} está a ${fmtS(g)} s e com mais bateria. Defenda por dentro na ${nextCornerName(me)}.`,btn:[["Segurar posição","def"],["Defesa","ers","defend"]]}}},
  {k:"preso",cd:150,f:me=>me.st&&me.st.frus>45&&me.ahead&&running(me.ahead)&&me.atkStyle!=="out"?{txt:`O ${me.ahead.code} fecha muito a porta por dentro. Tente pelo lado de fora na ${nextCornerName(me)}.`,btn:[["Atacar por fora","astyle","out"]]}:null},
  {k:"livre",cd:240,f:me=>{if(R.sc||me.mode==="attack"||lapsLeft(me)<3||me.tyre.wear>.45)return null;const fa=!me.ahead||secs(me.dA,me)>2.5,fb=!me.behind||secs(me.dB,me)>2.5;return fa&&fb?{txt:"Pista livre na sua frente. Pode atacar por algumas voltas.",btn:[["Atacar","mode","attack"]]}:null}},
  {k:"fim",cd:999,f:me=>lapsLeft(me)<=4&&lapsLeft(me)>0&&me.ersPlan!=="end"&&((me.ahead&&secs(me.dA,me)<2)||(me.behind&&secs(me.dB,me)<2))?{txt:"Últimas voltas e a briga está perto: guarde energia para o fim.",btn:[["Tudo no fim","eplan","end"]]}:null},
  {k:"amarela",cd:40,f:me=>{if(!R.yellows||!R.yellows.length)return null;const f=fr(me.prog);for(const y of R.yellows){if(y.until<R.t)continue;let d=fr(y.a)-f;if(d<0)d+=1;d*=R.geo.len;if(d<700&&d>120)return{txt:`${y.dbl?"Dupla amarela":"Bandeira amarela"} logo à frente. Alivie e não ultrapasse.`,btn:[],dur:7}}return null}}
];
// a cada segundo: decisões automáticas e a próxima dica
function tipsTick(){if(!R||!R.started||R.over||R.spect)return;const me=meCar();if(!me||!running(me)){TIPS.cur=null;tipsRender();return}
  if(R.t<TIPS.next)return;TIPS.next=R.t+1;
  if(autoDecOn())autoDecide(me);
  if(TIPS.cur&&(R.t>TIPS.cur.until||(TIPS.cur.rule&&!TIPS.cur.rule.f(me)))){TIPS.cur=null}
  if(!TIPS.cur&&tipsOn()&&R.t>8)for(const T of TIP_RULES){if((TIPS.cd[T.k]||-1e9)>R.t)continue;if((me.lap||0)<1&&!{furo:1,chuva:1,seco:1,amarela:1,sc:1}[T.k])continue;let r=null;try{r=T.f(me)}catch(e){r=null}if(!r)continue;
    TIPS.cd[T.k]=R.t+(T.cd||90);TIPS.cur={k:T.k,rule:T,txt:r.txt,btn:r.btn||[],until:R.t+(r.dur||15)};TIPS.shown++;radio(me,`Engenheiro: "${r.txt}"`,{});break}
  tipsRender()}
function tipApply(i){const t=TIPS.cur;if(!t)return;const b=t.btn[+i];if(!b)return;uiAct(b[1],b[2]);TIPS.cur=null;tipsRender()}
function tipDismiss(){if(TIPS.cur){TIPS.cd[TIPS.cur.k]=Math.max(TIPS.cd[TIPS.cur.k]||0,R.t+120)}TIPS.cur=null;tipsRender()}
function tipsRender(){const el=document.getElementById("tipbox");if(!el)return;const t=TIPS.cur;if(!t){if(!el.hidden){el.hidden=true;el.dataset.k=""}return}
  if(el.dataset.k===t.k+t.txt&&!el.hidden)return;el.dataset.k=t.k+t.txt;el.hidden=false;
  el.innerHTML=`<div class="tiphead">🎧 Dica do engenheiro</div><div class="tiptxt">${esc(t.txt)}</div><div class="row">${t.btn.map((b,i)=>`<button class="btn sm go" data-act="tip" data-k="${i}">${esc(b[0])}</button>`).join("")}<button class="btn sm" data-act="tipNo">${t.btn.length?"Ignorar":"Ok"}</button></div>`}
// decisões óbvias tomadas sozinhas (com aviso no rádio)
function autoDecide(me){const st=TIPS.st;const say=t=>{radio(me,`Automático: ${t}`,{me:0});if(typeof rcMsg==="function"&&false)rcMsg(t)};
  if(me.pit)return;
  if((me.tyre.punct||me.dmg.wing>=.5)&&!me.pitCall&&!st.box){st.box=R.t;uiAct("box",R.w>.45?wetComp():bestDry(me));say(me.tyre.punct?"pneu furado, chamando para o box.":"asa quebrada, chamando para o box.");return}
  if(COMP[me.tyre.c].dry&&R.w>.62&&!me.pitCall&&!(st.rain>R.t-60)){st.rain=R.t;uiAct("box",wetComp());say("chuva forte e pneu liso: box para pneus de chuva.");return}
  if(!COMP[me.tyre.c].dry&&R.w<.1&&!me.pitCall&&!(st.dry>R.t-60)){st.dry=R.t;uiAct("box",bestDry(me));say("pista seca, box para slicks.");return}
  if(me.batt<5&&me.ers!=="save"&&!R.sc){st.batt=1;uiAct("ers","save");say("bateria vazia, recarregando.");return}
  if(st.batt&&me.batt>45&&me.ers==="save"){st.batt=0;uiAct("ers","auto");say("bateria recarregada, energia no automático.");return}
  if(R.sc&&me.mode==="attack"){st.sc=1;uiAct("mode","normal");say("ritmo normal atrás do safety car.");return}
  if(st.box&&!me.pitCall&&!me.tyre.punct&&me.dmg.wing<.5)st.box=0}
