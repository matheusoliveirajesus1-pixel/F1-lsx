// ===================== DICAS DA EQUIPE E DECISÕES AUTOMÁTICAS =====================
// O engenheiro só fala quando há uma decisão de box para o jogador (pneu gasto, chuva, pista secando, safety car).
// A operação do carro (energia, ritmo, ataque, defesa) é do próprio piloto: brain.js. Sem dicas que não pedem decisão.
// Decisões óbvias de box (pneu furado, asa quebrada, chuva forte com slick, pista seca com pneu de chuva) são sempre automáticas.
const TIPS={cur:null,cd:{},next:0,st:{},shown:0};
function tipsReset(){TIPS.cur=null;TIPS.cd={};TIPS.next=0;TIPS.st={};TIPS.shown=0}
function tipsOn(){return!(G&&G.settings&&G.settings.tips===false)}
// mesma ação dos botões da tela (funciona também como convidado no multijogador)
function uiAct(a,k){const g=R&&R.mpGuest;const H=f=>typeof hostCmd==="function"?hostCmd(f):f();const me=R&&R.cars.find(c=>c.isP);
  switch(a){case"box":return g?mpCmd({b:k||null}):H(()=>cmdBox(k||null));
  case"pace":case"risk":if(g){if(me)intentOf(me)[a]=k;return mpCmd(a==="pace"?{ip:k}:{ir:k})}return H(()=>setIntentC(me,a,k))}}
function lapsLeft(me){return Math.max(0,R.L-(me.lap||0))}
function bestDry(me){const left=lapsLeft(me);return left<=Math.max(6,R.L*.32)?"S":left<=R.L*.6?"M":"H"}
function wetComp(){return R.w>.78?"W":"I"}
function secs(m,me){return m/Math.max(30,me.v||60)}
function nextCornerName(me){const g=R.geo;if(!g||!g.corners.length)return"próxima curva";const i=Math.floor(fr(me.prog)*g.N);let best=null,bd=1e9;for(const c of g.corners){const d=(c.i-i+g.N)%g.N;if(d>8&&d<bd){bd=d;best=c}}return best?best.n:"próxima curva"}
const fmtS=s=>s.toFixed(1).replace(".",",");
// regras em ordem de prioridade: devolvem {txt, btn:[[rótulo, ação, k]], dur}
const TIP_RULES=[
  {k:"chuva",cd:50,f:me=>COMP[me.tyre.c].dry&&R.w>.42&&!me.pitCall?{txt:`A pista está molhada demais para slick. ${R.w>.78?"Pneu de chuva":"Intermediário"} agora?`,btn:[[R.w>.78?"Box: chuva":"Box: intermediário","box",wetComp()]]}:null},
  {k:"seco",cd:60,f:me=>!COMP[me.tyre.c].dry&&R.w<.2&&!me.pitCall?{txt:"O traçado já secou. Hora de voltar para o slick.",btn:[["Box: slick","box",bestDry(me)]]}:null},
  {k:"sc",cd:120,f:me=>R.sc&&!me.pitCall&&!me.pit&&lapsLeft(me)>3&&me.tyre.wear>.28?{txt:`${R.sc.type==="sc"?"Safety car":"Safety car virtual"}! Parar agora custa bem menos tempo.`,btn:[["Box agora","box",R.w>.45?wetComp():bestDry(me)]],dur:20}:null},
  {k:"gasto",cd:150,f:me=>COMP[me.tyre.c].dry&&me.tyre.wear>.66&&!me.pitCall&&lapsLeft(me)>2?{txt:`Pneus ${Math.round(me.tyre.wear*100)}% gastos. A janela de box está aberta: entra nesta volta?`,btn:[["Box: "+COMP[bestDry(me)].n.toLowerCase(),"box",bestDry(me)]]}:null},
];
// a cada segundo: decisões automáticas e a próxima dica
function tipsTick(){if(!R||!R.started||R.over||R.spect)return;const me=meCar();if(!me||!running(me)){TIPS.cur=null;tipsRender();return}
  if(R.t<TIPS.next)return;TIPS.next=R.t+1;
  autoDecide(me);
  if(TIPS.cur&&(R.t>TIPS.cur.until||(TIPS.cur.rule&&!TIPS.cur.rule.f(me)))){TIPS.cur=null}
  if(!TIPS.cur&&tipsOn()&&R.t>8)for(const T of TIP_RULES){if((TIPS.cd[T.k]||-1e9)>R.t)continue;if((me.lap||0)<1&&!{chuva:1,seco:1,sc:1}[T.k])continue;let r=null;try{r=T.f(me)}catch(e){r=null}if(!r)continue;
    TIPS.cd[T.k]=R.t+(T.cd||90);TIPS.cur={k:T.k,rule:T,txt:r.txt,btn:r.btn||[],until:R.t+(r.dur||15)};TIPS.shown++;radio(me,`Engenheiro: "${r.txt}"`,{});break}
  tipsRender()}
function tipApply(i){const t=TIPS.cur;if(!t)return;const b=t.btn[+i];if(!b)return;uiAct(b[1],b[2]);TIPS.cur=null;tipsRender()}
function tipDismiss(){if(TIPS.cur){TIPS.cd[TIPS.cur.k]=Math.max(TIPS.cd[TIPS.cur.k]||0,R.t+120)}TIPS.cur=null;tipsRender()}
function tipsRender(){const el=document.getElementById("tipbox");if(!el)return;const t=TIPS.cur;if(!t){if(!el.hidden){el.hidden=true;el.dataset.k=""}return}
  if(el.dataset.k===t.k+t.txt&&!el.hidden)return;el.dataset.k=t.k+t.txt;el.hidden=false;
  el.innerHTML=`<div class="tiphead">🎧 Engenheiro</div><div class="tiptxt">${esc(t.txt)}</div><div class="row">${t.btn.map((b,i)=>`<button class="btn sm go" data-act="tip" data-k="${i}">${esc(b[0])}</button>`).join("")}<button class="btn sm" data-act="tipNo">${t.btn.length?"Ignorar":"Ok"}</button></div>`}
// decisões óbvias tomadas sozinhas (com aviso no rádio)
function autoDecide(me){const st=TIPS.st;const say=t=>radio(me,`${G.engineer||"Engenheiro"}: "${t}"`,{});
  if(me.pit)return;
  if((me.tyre.punct||me.dmg.wing>=.5)&&!me.pitCall&&!st.box){st.box=R.t;uiAct("box",R.w>.45?wetComp():bestDry(me));say(me.tyre.punct?"Pneu furado. Box, box!":"Asa dianteira quebrada. Box para trocar o bico.");return}
  if(COMP[me.tyre.c].dry&&R.w>.62&&!me.pitCall&&!(st.rain>R.t-60)){st.rain=R.t;uiAct("box",wetComp());say("Chuva forte e pneu liso: box para pneus de chuva.");return}
  if(!COMP[me.tyre.c].dry&&R.w<.1&&!me.pitCall&&!(st.dry>R.t-60)){st.dry=R.t;uiAct("box",bestDry(me));say("Pista seca: box para slicks.");return}
  if(st.box&&!me.pitCall&&!me.tyre.punct&&me.dmg.wing<.5)st.box=0}
