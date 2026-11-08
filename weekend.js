// ===================== FIM DE SEMANA COMPLETO =====================
// TL1, TL2 e TL3 (sprint: só TL1), novato no TL1 duas vezes por ano, acerto detalhado com o engenheiro,
// jogos de pneus do fim de semana, limite de peças do motor (punição no grid), classificação com decisões de verdade
// (quando sair, jogo novo ou usado, bandeira amarela e tráfego), regra dos 107% e parque fechado.
// ---------- acerto detalhado: cada peça tem um ideal escondido que depende da pista
const SU_P=[["fw","Asa dianteira","menos ↔ mais apoio na frente"],["rw","Asa traseira","velocidade na reta ↔ aderência nas curvas"],["rh","Altura do carro","baixo = rápido, mas gasta a prancha"],["sp","Molas e barras","macio = zebras e ondulações; duro = resposta rápida"],["gr","Relação de marchas","curta = aceleração; longa = velocidade final"],["tp","Pressão dos pneus","acima do mínimo da Pirelli; baixa = aderência, alta = durabilidade"],["cl","Refrigeração","aberta = motor fresco, mais arrasto"]];
const HOT={singapura:1,lusail:1,abudhabi:1,miami:1,hungaroring:1,hungria:1,mexico:0,lasvegas:-1,interlagos:0,suzuka:0};
function suOpt(){if(W._suOpt)return W._suOpt;const g=W.geo||R.geo,C=W.C;const km=g.len/1000;const cd=(g.corners||[]).length/km;const slow=(g.corners||[]).filter(k=>(k.v||99)<35).length/Math.max(1,(g.corners||[]).length);
  const wing=clamp(Math.round(2.2+(cd-1.6)*1.7+slow*2),1,11),street=!!C.street;const hot=HOT[C.id]??0;
  W._suOpt={fw:clamp(wing+(slow>.4?1:0),1,11),rw:wing,rh:street?7:C.id==="interlagos"||C.id==="lasvegas"?6:4,sp:street?3:cd<2.2?8:6,gr:clamp(Math.round(9-(cd-1.5)*1.5),2,10),tp:2,cl:clamp(5+hot*3,2,10)};return W._suOpt}
function suGet(){if(!W.su)W.su={fw:6,rw:6,rh:6,sp:6,gr:6,tp:4,cl:6};return W.su}
// qualidade do acerto: 0 a 1 (média da distância de cada peça ao ideal)
function suQuality(){const o=suOpt(),s=suGet();let e=0;for(const[k]of SU_P)e+=Math.min(1,Math.abs(s[k]-o[k])/5);return clamp(1-e/SU_P.length,0,1)}
function suFeedback(){const o=suOpt(),s=suGet();const fb=[];const d=k=>s[k]-o[k];
  if(d("rw")>1)fb.push("Falta velocidade na reta: a asa traseira está carregada demais.");else if(d("rw")<-1)fb.push("O carro escorrega nas curvas rápidas: falta asa traseira.");
  if(d("fw")-d("rw")>1.5)fb.push("O carro está nervoso de traseira na entrada das curvas: frente com apoio demais.");else if(d("rw")-d("fw")>1.5)fb.push("O carro sai de frente nas curvas lentas: falta asa dianteira.");
  if(d("rh")<-1)fb.push("O carro está batendo no chão: a prancha vai gastar demais.");else if(d("rh")>1)fb.push("Dá para baixar o carro: estamos perdendo apoio do assoalho.");
  if(Math.abs(d("sp"))>1)fb.push(d("sp")>0?"Duro demais: pula nas zebras e ondulações.":"Mole demais: o carro demora a responder nas trocas de direção.");
  if(Math.abs(d("gr"))>1)fb.push(d("gr")>0?"Marchas longas: o carro demora a acelerar na saída das curvas lentas.":"Marchas curtas: batendo no limitador antes do fim da reta.");
  if(d("tp")>1)fb.push("Pressão alta: pneu dura mais, mas falta aderência.");if(d("cl")<-1)fb.push("O motor está esquentando: precisamos abrir mais a refrigeração.");else if(d("cl")>1)fb.push("Refrigeração aberta demais: dá para fechar e ganhar velocidade.");
  return fb.length?fb.slice(0,3):["O carro está equilibrado. O piloto está feliz com o acerto."]}
function suCard(){const s=suGet();const locked=!!W.quali;return`<div class="card"><h3>Acerto detalhado</h3>${locked?`<p class="pill warn" style="white-space:normal">Parque fechado: o acerto está travado desde a classificação. Mexer agora obriga a largar do pit lane.</p>`:""}
  <div class="sug">${SU_P.map(([k,n,d])=>`<div class="sur"><div style="min-width:0"><b>${n}</b><small class="muted">${d}</small></div><div class="ccrow"><button class="btn sm" data-act="wkSu" data-k="${k}:-1"${locked?" disabled":""}>−</button><b class="num">${s[k]}</b><button class="btn sm" data-act="wkSu" data-k="${k}:1"${locked?" disabled":""}>+</button></div></div>`).join("")}</div>
  <p class="muted" style="font-size:12.5px">${(W.suNotes||["Rode um treino para o engenheiro dizer o que o piloto sentiu."]).map(esc).join(" ")}</p></div>`}
// efeito do acerto na corrida (aplicado no seu carro quando a largada é preparada)
function suApply(c){if(!W.su||!W.suTouched||!c||!c.ph)return;const s=W.su,o=suOpt();c.ph.cl*=1+.012*(s.rw-6)+.006*(s.fw-6);c.ph.cd*=1+.008*(s.rw-6)+.004*(s.cl-6);
  c.plankK=Math.max(0,(o.rh-s.rh))*0.35;c.hotK=Math.max(0,o.cl-s.cl)*.12;c.tpK=(s.tp-o.tp)*.02}
// ---------- três treinos livres (com novato no TL1)
function fpMax(){return W.sprint?1:3}
function rookieRound(){const t=myTeam();if(!t)return false;if(!t.rookieRounds||t.rookieSeason!==G.season){const n=G.calendar.length;t.rookieSeason=G.season;t.rookieRounds=[ri(2,Math.floor(n/2)),ri(Math.floor(n/2)+1,n-3)]}
  const me=ME();return t.rookieRounds.includes(G.round)&&(dExp(me).starts>=22)}
(function(){if(typeof doPractice!=="function")return;const base=doPractice;
  globalThis.doPractice=function(focus){W.fp=W.fp||{n:0,best:0,log:[]};const prevSet=W.setup[G.me]||0;base(focus);W.fp.n++;
    // acerto: o melhor dos treinos + o quanto o seu acerto detalhado está perto do ideal
    const q=suQuality();const sess=W.setup[G.me]||.6;let v=Math.max(prevSet,sess)+(focus==="setup"&&prevSet?.03:0);if(W.suTouched)v=v*.55+q*.45;W.setup[G.me]=clamp(v,0,.98);
    W.suNotes=suFeedback();W.practice.msgs.unshift(`TL${W.fp.n + (W.fp.skip||0)}: ${{learn:"aprender a pista",setup:"acerto",long:"simulação de corrida",quali:"voltas rápidas"}[focus]||focus}. Acerto atual: ${Math.round(W.setup[G.me]*100)}%.`);
    W.practice.msgs.push(`O piloto sobre o carro: ${W.suNotes.join(" ")}`);
    // pneus usados nos treinos
    tsInit();const use=focus==="long"?{M:1,H:1}:focus==="quali"?{S:1}:{M:1};for(const k in use)W.sets[k]=Math.max(0,W.sets[k]-use[k])}
  if(typeof practiceStep!=="function")return;const ps=practiceStep;
  globalThis.practiceStep=function(){W.fp=W.fp||{n:0,log:[]};const n=W.fp.n+(W.fp.skip||0);
    if(!W.practice.done&&n===0&&rookieRound()&&!W.fp.rk){W.fp.rk=1;$("#wk").innerHTML=`<div class="grid2"><div class="card"><h3>TL1: um novato no seu carro</h3><p>O regulamento obriga cada equipe a colocar um piloto estreante no TL1 duas vezes por ano. Hoje é a vez da ${esc(myTeam().n)}: você assiste da garagem.</p><button class="btn go" data-act="wkSkipFP">Ir para o TL2</button></div>${suCard()}</div>`;return}
    ps();const el=$("#wk");if(!el)return;const card=el.querySelector(".grid2");if(!card)return;
    if(!W.practice.done)card.insertAdjacentHTML("afterbegin",`<div class="card" style="grid-column:1/-1"><h3>Treino livre ${n+1} de ${fpMax()}</h3><p class="muted" style="font-size:13px">${tsLine()} · Motor: ${puLine(ME())}</p></div>`);
    else if(n<fpMax()){const nx=el.querySelector("[data-act=toQuali]");if(nx)nx.insertAdjacentHTML("beforebegin",`<button class="btn go" data-act="wkNextFP">Ir para o TL${n+1}</button> `)}
    card.insertAdjacentHTML("beforeend",suCard())}})();
function wkAction(a,k){if(a==="wkSu"){const[p,d]=String(k).split(":");const s=suGet();if(W.quali)return;s[p]=clamp(s[p]+(+d),1,11);if(p==="tp")s[p]=Math.max(1,s[p]);W.suTouched=true;return render()}
  if(a==="wkNextFP"){W.practice.done=false;return render()}if(a==="wkSkipFP"){W.fp.skip=(W.fp.skip||0)+1;W.practice.done=false;return render()}
  if(a==="wkQ"){const[key,v]=String(k).split(":");W.qPlan=W.qPlan||{run:"late",tyre:"new"};W.qPlan[key]=v;return render()}}
// ---------- jogos de pneus do fim de semana (seco: 2 duros, 3 médios, 8 macios)
function tsInit(){if(!W.sets)W.sets={H:2,M:3,S:8}}
function tsLine(){tsInit();return`Jogos novos: ${W.sets.S} macios, ${W.sets.M} médios, ${W.sets.H} duros`}
// ---------- limite de peças do motor (2026: 4 motores e turbos, 3 MGU-K, baterias e centrais, 4 escapamentos)
const PU_LIM={ICE:4,TC:4,MGUK:3,ES:3,CE:3,EX:4},PU_LIFE={ICE:6,TC:6,MGUK:8,ES:8,CE:8,EX:6},PU_N={ICE:"motor",TC:"turbo",MGUK:"MGU-K",ES:"bateria",CE:"central eletrônica",EX:"escapamento"};
function puOf(d){if(!d.pu||d.pu.season!==G.season)d.pu={season:G.season,used:{ICE:1,TC:1,MGUK:1,ES:1,CE:1,EX:1},age:{ICE:0,TC:0,MGUK:0,ES:0,CE:0,EX:0},over:0};return d.pu}
function puLine(d){const p=puOf(d);return`${p.used.ICE} de ${PU_LIM.ICE} motores, ${p.used.ES} de ${PU_LIM.ES} baterias`}
// antes da classificação: peças no fim da vida (ou quebradas) são trocadas; passou do limite, perde posições
function puWeekend(){const notes=[];for(const t of G.teams)for(const d of teamDrivers(t)){const p=puOf(d);let pen=0;
    for(const k in PU_LIM){p.age[k]++;const life=PU_LIFE[k]*(.85+((t.car&&t.car.rel)||85)/100*.3);const broke=d.puBroke&&k==="ICE";if(p.age[k]>=life||broke||rnd()<.015){p.used[k]++;p.age[k]=0;if(p.used[k]>PU_LIM[k]){pen+=p.over?5:10;p.over++}}}
    d.puBroke=false;if(pen){d.gridPen=(d.gridPen||0)+pen;notes.push(`${d.code}: peças novas do motor além do limite, ${pen} posições no grid`)}}W.puNotes=notes}
// motor quebrado na corrida: precisa de peça nova na próxima
(function(){if(typeof mechFail!=="function")return;const base=mechFail;globalThis.mechFail=function(c,why){if(/Motor|motor|MGU|Bateria|Turbo/.test(why||"")&&c.d)c.d.puBroke=true;return base(c,why)}})();
// ---------- classificação com decisões
(function(){if(typeof doQuali!=="function")return;const base=doQuali;
  globalThis.doQuali=function(myRisk){if(!W.puDone){W.puDone=1;puWeekend()}tsInit();W.qNotes=[];const r=base(myRisk);
    // punições de grid de qualquer piloto (motor, advertências, comissários)
    let grid=W.grid.slice();for(const id of grid.slice()){const d=G.drivers[id];if(!d||!d.gridPen)continue;const n=d.gridPen;d.gridPen=0;const i=grid.indexOf(id);grid.splice(i,1);grid.splice(Math.min(grid.length,i+n),0,id);W.quali.pens.push({id,n})}W.grid=grid;
    // regra dos 107%
    const q1=W.quali.order.map(o=>o.q1).filter(x=>x);const best=Math.min(...q1);W.quali.order.forEach(o=>{if(o.q1&&o.q1>best*1.07)W.qNotes.push(`${G.drivers[o.id].code} ficou fora dos 107% (${fmtT(best*1.07)}): os comissários autorizaram a largada.`)});
    W.quali.notes=W.qNotes.concat(W.puNotes||[]);save();return r}})();
(function(){if(typeof qualiLap!=="function")return;const base=qualiLap;
  globalThis.qualiLap=function(d,t,sess,wet,risk){let tm=base(d,t,sess,wet,risk);if(!d.me||tm==null)return tm;const P=W.qPlan||{run:"late",tyre:"new"};tsInit();
    if(P.tyre==="used"&&sess===1){tm*=1.0035;W.qNotes.push("Q1 com macio usado: guardou um jogo novo para a corrida.")}else{if(W.sets.S>0)W.sets.S--;else{tm*=1.004;W.qNotes.push(`Q${sess}: sem macio novo, volta com pneu usado.`)}}
    if(P.run==="late"){tm*=.9985;if(rnd()<.12){tm*=1.012;W.qNotes.push(`Q${sess}: bandeira amarela no fim da sessão estragou a última volta!`)}else if(rnd()<.1){tm*=1.004;W.qNotes.push(`Q${sess}: pegou tráfego na volta de saída e o pneu esfriou.`)}}
    return tm}})();
(function(){if(typeof qualiStep!=="function")return;const base=qualiStep;globalThis.qualiStep=function(){base();const el=$("#wk");if(!el)return;const g=el.querySelector(".grid2");if(!g)return;
    if(W.quali){if((W.quali.notes||[]).length)g.insertAdjacentHTML("beforeend",`<div class="card" style="grid-column:1/-1"><h3>O que aconteceu na classificação</h3>${W.quali.notes.map(n=>`<p>${esc(n)}</p>`).join("")}</div>`);return}
    const P=W.qPlan||{run:"late",tyre:"new"};const seg=(key,opts)=>`<div class="seg">${opts.map(([v,n])=>`<button data-act="wkQ" data-k="${key}:${v}" class="${P[key]===v?"on":""}">${n}</button>`).join("")}</div>`;
    g.insertAdjacentHTML("afterbegin",`<div class="card" style="grid-column:1/-1"><h3>Plano da classificação</h3><p class="muted" style="font-size:13px">${tsLine()}</p>
      <h4 class="ag">Quando sair para a volta</h4>${seg("run",[["early","Cedo"],["late","No fim"]])}<p class="muted" style="font-size:12px">Cedo: pista mais lenta, sem risco. No fim: pista mais rápida, mas pode pegar bandeira amarela ou tráfego.</p>
      <h4 class="ag">Pneus no Q1</h4>${seg("tyre",[["new","Jogo novo"],["used","Usado"]])}<p class="muted" style="font-size:12px">Usado no Q1 guarda um macio novo para a corrida, mas custa uns 3 décimos.</p></div>`)}})();
// ---------- jogos usados na corrida: sem jogo novo do composto, o pneu já sai com desgaste
(function(){if(typeof startRace!=="function")return;const base=startRace;globalThis.startRace=function(pre){const r=base.apply(this,arguments);try{const me=R.cars.find(c=>c.isP);if(me&&W){suApply(me);tsInit();const k=me.tyre.c;if(W.sets[k]!=null){if(W.sets[k]>0)W.sets[k]--;else{me.tyre.wear=Math.max(me.tyre.wear,.1);rcMsg("Você largou com um jogo de pneus usado (não sobrou jogo novo desse composto).","","compostos")}}}}catch(e){}return r}})();
(function(){if(typeof pitService!=="function")return;const base=pitService;globalThis.pitService=function(c){const r=base(c);try{if(c.isP&&W&&W.sets){const k=c.tyre.c;if(W.sets[k]!=null){if(W.sets[k]>0)W.sets[k]--;else{c.tyre.wear=.12;radio(c,`${G.engineer||"Engenheiro"}: "Não tínhamos mais ${COMP[k].n.toLowerCase()} novo: saiu com um jogo usado."`)}}}}catch(e){}return r}})();
