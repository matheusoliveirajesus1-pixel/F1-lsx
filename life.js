// ===================== VIDA DO PILOTO, EQUIPE, CARREIRA E DONO DE EQUIPE =====================
// Dinheiro que faz sentido: equipe pessoal, treino, estilo de vida, negócios, investimentos, academia de pilotos e cotas
// de equipe. Custos por corrida e imposto pelo país onde você mora. Limites para o dinheiro não comprar o título.
// Equipe: teto de gastos, túnel de vento pela posição no campeonato. Carreira: F2/F3, lesões e reservas, prêmios do ano,
// Piloto do Dia. No fim: aposentadoria e modo dono de equipe para quem juntou cotas.
const LF_STAFF=[["agent","Empresário","contratos 10% maiores e mais propostas; fica com 5% do salário",0],["fit","Preparador físico","+Físico a cada corrida (até +6 no ano)",.05],["physio","Fisioterapeuta","lesões curam na metade do tempo",.03],["psy","Psicólogo do esporte","+Mental a cada corrida (até +6 no ano); menos erros sob pressão",.03],["pr","Assessor de imprensa","mais fama a cada corrida, menos polêmica",.04],["social","Equipe de redes sociais","mais seguidores e patrocinadores pessoais melhores",.03]];
const LF_LIFE=[["sim","Simulador em casa",1.5,.01,"chega conhecendo a pista (+voltas antes do treino)"],["jet","Jatinho particular",8,.06,"menos cansaço nas viagens longas: melhor rendimento fora da Europa"],["car","Carro de luxo",.5,0,"mais fama, mas pode render polêmica"],["fund","Fundação beneficente",1,.02,"mais respeito no paddock e na imprensa"],["merch","Linha de produtos",1,0,"rende por corrida conforme a sua fama"],["ins","Seguro de carreira",0,.02,"se você se machucar, o rendimento não cai tanto"]];
const LF_HOME=[["br","Brasil",.275,0],["mc","Mônaco",0,.08],["ch","Suíça",.12,.03]];
const LF_ATTR=[["brk","Freada"],["wet","Chuva"],["start","Largada"],["ovt","Ultrapassagem"],["def","Defesa"],["tyre","Pneus"],["quali","Volta lançada"]];
const LF_EVENTS=[["lemans","24 Horas de Le Mans",.3,6,.04,"experiência, fama e prêmio; risco de lesão"],["indy","500 Milhas de Indianápolis",1.2,10,.07,"prêmio grande e muita fama; risco alto"],["kart","Kart de inverno",-.05,0,.01,"+Largada e +Ultrapassagem (fim de temporada)"]];
function LF(){G.life=G.life||{staff:{},items:{},home:"br",inv:{re:0,st:0},hist:[],attrGain:{},season:G.season,academy:[],shares:{},events:{},log:[],injury:0,bring:0};if(G.life.season!==G.season){G.life.season=G.season;G.life.attrGain={};G.life.events={}}return G.life}
function lfCostPerRace(){const L=LF(),me=ME();let c=0;const sal=(me.salary||0)/Math.max(1,G.calendar.length);for(const[k,,,cost]of LF_STAFF)if(L.staff[k])c+=k==="agent"?sal*.05:cost;for(const[k,,,cost]of LF_LIFE)if(L.items[k])c+=cost;c+=(LF_HOME.find(h=>h[0]===L.home)||LF_HOME[0])[3];c+=L.academy.length*.025;return c}
function lfLog(t){const L=LF();L.log.unshift({r:G.round,y:G.year,t});L.log=L.log.slice(0,30)}
function lfGain(a,v){const L=LF();const g=L.attrGain[a]||0;if(g>=6)return 0;const me=ME();const add=Math.min(v,6-g);me.a[a]=Math.min(99,me.a[a]+add);L.attrGain[a]=g+add;return add}
// ---------- depois de cada corrida: custos, imposto, rendas e efeitos
(function(){if(typeof afterRace!=="function")return;const base=afterRace;globalThis.afterRace=function(res){const m0=G.money||0;const r=base(res);try{lfAfterRace(res,(G.money||0)-m0)}catch(e){console.warn("vida",e)}return r}})();
function lfAfterRace(res,income){if(G.mp||res.sprint)return;const L=LF(),me=ME();const home=LF_HOME.find(h=>h[0]===L.home)||LF_HOME[0];
  const tax=Math.max(0,income)*home[2];const cost=lfCostPerRace();let inc=0;
  if(L.items.merch)inc+=(G.fame.pop||0)*.004;inc+=L.inv.re*.004;// produtos e imóveis
  for(const tid in L.shares){const t=teamOf(tid);if(!t)continue;const st=standings();const p=st.teams.findIndex(x=>x.id===tid)+1;inc+=L.shares[tid]/100*(14-p)*.35}// dividendos
  G.money=(G.money||0)-tax-cost+inc;L.hist.push({r:G.round,y:G.year,tax:+tax.toFixed(3),cost:+cost.toFixed(3),inc:+inc.toFixed(3)});L.hist=L.hist.slice(-40);
  if(L.staff.fit)lfGain("fitness",.6);if(L.staff.psy)lfGain("mental",.6);if(L.staff.pr)G.fame.pop=Math.min(100,(G.fame.pop||0)+.4);if(L.staff.social)G.followers=(G.followers||0)*1.01;
  if(L.items.fund)G.fame.resp=Math.min(100,(G.fame.resp||0)+.3);if(L.items.car){G.fame.pop=Math.min(100,(G.fame.pop||0)+.2);if(rnd()<.03&&!L.staff.pr){G.fame.resp=Math.max(0,(G.fame.resp||0)-3);news(`Polêmica: ${me.n} flagrado em alta velocidade com o carro de luxo nas ruas. A equipe não gostou.`);lfLog("Polêmica com o carro de luxo: respeito caiu.")}}
  if(L.injury>0){L.injury--;if(!L.injury)lfLog("Você está 100% recuperado da lesão.")}
  // Piloto do Dia (voto dos fãs): quem mais ganhou posições entre os que terminaram
  const okc=res.cls.filter(e=>e.status==="ok"&&e.pos);let best=null,bg=-99;for(const e of okc){const gp=(W&&W.grid?W.grid.indexOf(e.d)+1:e.pos)-e.pos+(e.pos===1?2:0)+(e.d===G.me?1:0);if(gp>bg){bg=gp;best=e}}
  if(best){res.dotd=best.d;news(`Piloto do Dia (voto dos fãs): ${G.drivers[best.d].n}.`);if(best.d===G.me){G.fame.pop=Math.min(100,(G.fame.pop||0)+2);lfLog("Você foi eleito o Piloto do Dia!")}}
  // reservas: pilotos lesionados ficam de fora
  for(const d of Object.values(G.drivers)){if(d.injury>0&&!d.me){d.injury--;}}
  // túnel de vento e teto de gastos da sua equipe
  ccapAfterRace(res);if(typeof feederRound==="function")feederRound()}
// ---------- lesões em batidas fortes (IA vai para o reserva; você corre machucado com rendimento menor)
(function(){if(typeof exWall!=="function")return;const base=exWall;globalThis.exWall=function(c,imp,v){const r=base(c,imp,v);try{if(imp>20&&c.status==="dnf"&&rnd()<.3&&!(G&&G.mp)){const n=ri(1,3);
      if(c.isP){const L=LF();L.injury=L.staff.physio?Math.ceil(n/2):n;rcMsg(`${c.code} foi levado ao centro médico: lesão leve, vai correr com dor nas próximas ${L.injury} corrida(s).`,"warn","fiscais");lfLog(`Lesão na batida: ${L.injury} corrida(s) com rendimento menor.`)}
      else{c.d.injury=n+1;rcMsg(`${c.code} foi levado ao hospital para exames. Pode ficar fora das próximas corridas.`,"warn","fiscais")}}}catch(e){}return r}})();
(function(){if(typeof startWeekend!=="function")return;const base=startWeekend;globalThis.startWeekend=function(){const r=base.apply(this,arguments);try{if(!G.mp){const L=LF(),me=ME();
      if(L.items.sim)addTrackLaps(me,W.C.id,25);if(L.injury>0)W.injMe=L.items.ins?.985:.97;
      // reservas no lugar dos lesionados
      for(const t of G.teams)t.drivers.forEach((id,i)=>{const d=G.drivers[id];if(!d||!d.injury||d.me)return;let rv=t.reserve&&G.drivers[t.reserve];if(!rv){rv=newDriver({pace:72+rr(0,6),team:t.id,age:ri(20,26)});G.drivers[rv.id]=rv;t.reserve=rv.id}
        if(!t.drivers.includes(rv.id)){t.drivers[i]=rv.id;rv.team=t.id;rv.subFor=id;news(`${rv.n} substitui ${d.n} (lesionado) na ${t.n} no ${W.C.gp}.`)}});
      for(const t of G.teams)t.drivers.forEach((id,i)=>{const d=G.drivers[id];if(d&&d.subFor&&!(G.drivers[d.subFor].injury>0)){t.drivers[i]=d.subFor;d.subFor=null}})}}catch(e){console.warn("vida",e)}return r}})();
(function(){if(typeof doQuali!=="function")return;const base=doQuali;globalThis.doQuali=function(r){if(W.injMe&&W.setup[G.me])W.setup[G.me]*=W.injMe;return base(r)}})();
// ---------- equipe: teto de gastos e túnel de vento (quem está atrás no campeonato tem mais tempo de túnel)
function atrFactor(tid){const st=standings();const p=Math.max(1,st.teams.findIndex(x=>x.id===tid)+1);return .7+(p-1)*.05}// 1º: 70% ... 11º: 120%
function ccapInit(){G.ccap=G.ccap||{season:G.season,spent:0,cap:215};if(G.ccap.season!==G.season){if(G.ccap.spent>G.ccap.cap){G.ccap.penATR=.1;news(`${myTeam().n} estourou o teto de gastos em ${G.year-1}: multa e 10% menos tempo de túnel de vento.`)}else G.ccap.penATR=0;G.ccap.season=G.season;G.ccap.spent=0}return G.ccap}
function ccapAfterRace(res){const cc=ccapInit();const t=myTeam();const n=G.calendar.length;let spent=150/n;// operação normal
  for(const e of res.cls){if(e.team!==t.id)continue;if(/Acidente|toque/i.test(e.why||""))spent+=rr(1.5,3.5);}if(G.dev)spent+=.8;cc.spent=+(cc.spent+spent).toFixed(1)}
// desenvolvimento: as peças rendem conforme o túnel de vento
(function(){if(typeof devStart!=="function")return;const base=devStart;globalThis.devStart=function(p,eff,ov){const cc=ccapInit();const k=atrFactor(myTeam().id)*(1-(cc.penATR||0))*(cc.spent>cc.cap?.85:1);return base(p,(eff||1)*k,ov)}})();
// equipes da IA evoluem durante o ano conforme o túnel de vento (e a ajuda aos motores atrasados)
function aiDevRound(){for(const t of G.teams){if(t.id===myTeam().id)continue;const k=atrFactor(t.id);for(const a of["aero","chas"])if(rnd()<.35)t.car[a]=Math.min(97,t.car[a]+.4*k*devRoom(t.car[a]))}
  // ADUO (2026): fabricante de motor muito atrás ganha mais liberdade para evoluir
  const engs={};for(const t of G.teams){(engs[t.pu]=engs[t.pu]||[]).push(t.car.eng)}const avg=Object.fromEntries(Object.entries(engs).map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length]));const top=Math.max(...Object.values(avg));
  for(const t of G.teams)if(top-avg[t.pu]>3&&rnd()<.4){t.car.eng=Math.min(97,t.car.eng+.5);if(!G._aduoMsg||G._aduoMsg!==G.round){G._aduoMsg=G.round;news(`ADUO: os motores ${t.pu} estão mais de 3% atrás e ganharam liberdade extra de desenvolvimento.`)}}}
// ---------- categorias de base (F2 e F3)
function feederInit(){if(G.feeder&&G.feeder.season===G.season)return G.feeder;const old=G.feeder;const mk=(s,age,base)=>({n:pickName(),age,pot:Math.round(rr(70,96)),ovr:Math.round(base+rr(-4,4)),s,pts:0});
  const pickName=()=>{const d=newDriver({pace:70});delete G.drivers[d.id];return d.n};
  if(!old){G.feeder={season:G.season,f2:Array.from({length:10},()=>mk("F2",ri(19,23),74)),f3:Array.from({length:10},()=>mk("F3",ri(17,20),66))}}
  else{const champ2=old.f2.slice().sort((a,b)=>b.pts-a.pts),champ3=old.f3.slice().sort((a,b)=>b.pts-a.pts);G.feeder={season:G.season,promoted:champ2[0],f2:champ2.slice(1,7).concat(champ3.slice(0,4).map(x=>({...x,s:"F2"}))).map(x=>({...x,age:x.age+1,ovr:Math.min(x.pot,x.ovr+ri(1,4)),pts:0})),f3:champ3.slice(4).map(x=>({...x,age:x.age+1,ovr:Math.min(x.pot,x.ovr+ri(1,4)),pts:0})).concat(Array.from({length:4},()=>mk("F3",ri(16,18),64)))}}
  return G.feeder}
function feederRound(){const F=feederInit();for(const L of[F.f2,F.f3]){const o=L.map(x=>({x,s:x.ovr+rr(-6,6)})).sort((a,b)=>b.s-a.s);o.forEach((y,i)=>{y.x.pts+=[25,18,15,12,10,8,6,4,2,1][i]||0})}
  aiDevRound();const L=LF();for(const j of L.academy){const f=F.f2.concat(F.f3).find(x=>x.n===j.n);if(f)j.pts=f.pts}}
function feederCard(){const F=feederInit();const tb=(arr,t)=>`<h4 class="ag">${t}</h4><div class="tw"><table><tbody>${arr.slice().sort((a,b)=>b.pts-a.pts).slice(0,6).map((x,i)=>`<tr><td class="num">${i+1}</td><td>${esc(x.n)} <span class="muted">${x.age} anos</span></td><td class="num">${x.pts}</td></tr>`).join("")}</tbody></table></div>`;
  return`<div class="card"><h3>Categorias de base</h3><p class="muted" style="font-size:12.5px">O campeão da F2 costuma subir para a F1 no ano seguinte.${F.promoted?` Último campeão: ${esc(F.promoted.n)}.`:""}</p>${tb(F.f2,"Fórmula 2")}${tb(F.f3,"Fórmula 3")}</div>`}
// o mercado de pilotos passa a usar os jovens da F2 em vez de nomes do nada
(function(){if(typeof aiMarket!=="function")return;const base=aiMarket;globalThis.aiMarket=function(){const F=feederInit();const out=base();try{let pr=(F.f2||[]).slice().sort((a,b)=>b.pts-a.pts);
    for(const d of Object.values(G.drivers)){if(!d.retired&&d.team&&d.stats&&d.stats.starts===0&&d.age<=22&&pr.length&&!d.fromF2){const j=pr.shift();d.n=j.n;d.fromF2=1;d.a.pace=Math.min(95,Math.max(d.a.pace,j.ovr));
        const L=LF();if(L.academy.some(a=>a.n===j.n)){G.fame.pop=Math.min(100,(G.fame.pop||0)+5);L.academy=L.academy.filter(a=>a.n!==j.n);L.acadF1=(L.acadF1||[]).concat([{n:j.n,id:d.id}]);out.push(`${j.n}, da sua academia, chega à F1!`);lfLog(`${j.n}, da sua academia, chegou à F1: você recebe parte do contrato dele.`)}}}}catch(e){}return out}})();
// ---------- prêmios do fim do ano
(function(){if(typeof endSeason!=="function")return;const base=endSeason;globalThis.endSeason=function(){let aw=[];try{aw=lfAwards()}catch(e){}const sum=base.apply(this,arguments);try{if(Array.isArray(sum)&&aw.length)sum.push("Prêmios da FIA: "+aw.join(" · "));const L=LF();
      if(L.acadF1)for(const a of L.acadF1){const d=G.drivers[a.id];if(d&&!d.retired){G.money+=(d.salary||1)*.1;}}
      if(L.inv.st>0){const m=pick([0,0,.5,1,1.5,3,5]);const v=L.inv.st*m;G.money+=v;sum.push(`Startups: seus ${money(L.inv.st)} viraram ${money(v)}.`);L.inv.st=0}}catch(e){}return sum}})();
function lfAwards(){const rs=G.results.filter(r=>r.season===G.season&&!r.sprint);if(!rs.length)return[];const cnt=(f)=>{const m={};rs.forEach(r=>{const k=f(r);if(k)m[k]=(m[k]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]};
  const out=[];const pole=cnt(r=>r.pole);if(pole)out.push(`Troféu de poles: ${G.drivers[pole[0]].n} (${pole[1]})`);const dd=cnt(r=>r.dotd);if(dd)out.push(`Mais vezes Piloto do Dia: ${G.drivers[dd[0]].n} (${dd[1]})`);
  const crews=G.teams.map(t=>({t,c:typeof crewOf==="function"?crewOf(t):50})).sort((a,b)=>b.c-a.c);if(crews[0])out.push(`Prêmio de pit stop mais rápido: ${crews[0].t.n}`);
  const rk=Object.values(G.drivers).filter(d=>!d.retired&&d.stats&&d.stats.starts<=G.calendar.length+1);const st=standings();const best=st.drivers.find(x=>rk.some(d=>d.id===x.id));if(best)out.push(`Estreante do ano: ${G.drivers[best.id].n}`);
  if(pole&&pole[0]===G.me||dd&&dd[0]===G.me||best&&best.id===G.me)G.fame.pop=Math.min(100,(G.fame.pop||0)+5);return out}
// ---------- tela "Vida do piloto"
(function(){if(typeof hub!=="function")return;const base=hub;globalThis.hub=function(){if(G&&G.owner)return ownerHub();const life=UI.tab==="life";if(life)UI.tab="home";try{base()}finally{if(life)UI.tab="life"}const tb=document.querySelector(".tabs");if(tb&&!tb.querySelector('[data-k="life"]')){tb.insertAdjacentHTML("beforeend",`<button class="tab" data-act="tab" data-k="life" role="tab">Vida do piloto</button>`)}if(life){tb.querySelectorAll(".tab").forEach(x=>x.classList.toggle("on",x.dataset.k==="life"));lifeTab()}}})();
(function(){if(typeof champTab!=="function")return;const base=champTab;globalThis.champTab=function(){base();const g=$("#body .grid2");if(g)g.insertAdjacentHTML("beforeend",feederCard())}})();
function lifeTab(){const L=LF(),me=ME();const cost=lfCostPerRace();const home=LF_HOME.find(h=>h[0]===L.home)||LF_HOME[0];const last=L.hist[L.hist.length-1];const cc=ccapInit();
  const row=(on,act,k,title,desc,price)=>`<div class="lfr${on?" on":""}"><div style="min-width:0"><b>${title}</b><small class="muted">${desc}</small></div><button class="btn sm${on?"":" go"}" data-act="${act}" data-k="${k}">${on?"Dispensar":price}</button></div>`;
  $("#body").innerHTML=`<div class="grid2" style="margin-top:12px">
   <div class="card"><h3>Seu dinheiro</h3><div class="kv"><span>Saldo</span><b class="num">${money(G.money||0)}</b></div><div class="kv"><span>Gastos fixos por corrida</span><b class="num">${moneyS(cost)}</b></div>
    <div class="kv"><span>Imposto (${home[1]})</span><b class="num">${Math.round(home[2]*100)}% do que você ganha</b></div>${last?`<div class="kv"><span>Última corrida</span><b class="num">imposto ${moneyS(last.tax)} · gastos ${moneyS(last.cost)} · rendas ${moneyS(last.inc)}</b></div>`:""}
    <h4 class="ag">Onde você mora</h4><div class="seg">${LF_HOME.map(([k,n,tx,rent])=>`<button data-act="lfHome" data-k="${k}" class="${L.home===k?"on":""}">${n} · ${Math.round(tx*100)}%${rent?` · aluguel ${moneyS(rent)}`:""}</button>`).join("")}</div>
    ${L.injury>0?`<p class="pill warn" style="white-space:normal">Lesionado: mais ${L.injury} corrida(s) com rendimento menor.</p>`:""}</div>
   <div class="card"><h3>Equipe pessoal</h3>${LF_STAFF.map(([k,n,d,c])=>row(L.staff[k],"lfStaff",k,n,d,k==="agent"?"Contratar (5%)":`Contratar · ${moneyS(c)}/corrida`)).join("")}</div>
   <div class="card"><h3>Estilo de vida e negócios</h3>${LF_LIFE.map(([k,n,price,c,d])=>row(L.items[k],"lfItem",k,n,d+(c?` · ${moneyS(c)}/corrida`:""),price?`Comprar · ${money(price)}`:`Contratar · ${moneyS(c)}/corrida`)).join("")}</div>
   <div class="card"><h3>Treino e outras corridas</h3><p class="muted" style="font-size:12.5px">Professor de pilotagem: $400 mil por curso, +1 no atributo (até +6 por ano em cada um).</p>
    <div class="row">${LF_ATTR.map(([k,n])=>`<button class="btn sm" data-act="lfCoach" data-k="${k}">${n} ${me.a[k]}</button>`).join("")}</div>
    ${LF_EVENTS.map(([k,n,prize,fame,risk,d])=>`<div class="lfr${L.events[k]?" on":""}"><div style="min-width:0"><b>${n}</b><small class="muted">${d}</small></div><button class="btn sm" data-act="lfEvent" data-k="${k}"${L.events[k]?" disabled":""}>${L.events[k]?"Feito este ano":"Participar"}</button></div>`).join("")}</div>
   <div class="card"><h3>Investimentos</h3><div class="kv"><span>Imóveis (rende 0,4% por corrida)</span><b class="num">${money(L.inv.re)}</b></div><div class="kv"><span>Startups (no fim do ano: perde tudo ou multiplica)</span><b class="num">${money(L.inv.st)}</b></div>
    <div class="row"><button class="btn sm" data-act="lfInv" data-k="re">+ $1 mi em imóveis</button><button class="btn sm" data-act="lfInv" data-k="st">+ $1 mi em startups</button><button class="btn sm" data-act="lfInv" data-k="sell">Vender imóveis</button></div></div>
   <div class="card"><h3>Dentro da F1</h3><div class="kv"><span>Teto de gastos da ${esc(myTeam().n)}</span><b class="num">$${cc.spent} de $${cc.cap} mi</b></div><div class="kv"><span>Tempo de túnel de vento</span><b class="num">${Math.round(atrFactor(myTeam().id)*100)}%</b></div>
    ${G.dev?`<div class="lfr"><div><b>Adiantar a peça nova</b><small class="muted">${esc(G.dev.n||"Atualização")} chega uma corrida antes, só no seu carro</small></div><button class="btn sm go" data-act="lfRush">Pagar $2 mi</button></div>`:""}
    <div class="lfr"><div><b>Patrocínio levado por você</b><small class="muted">Equipes melhores abrem a porta no mercado (pago no fim do ano)</small></div><div class="seg">${[0,5,10,20].map(v=>`<button data-act="lfBring" data-k="${v}" class="${L.bring===v?"on":""}">${v?"$"+v+" mi":"Nada"}</button>`).join("")}</div></div></div>
   <div class="card"><h3>Academia de pilotos</h3><p class="muted" style="font-size:12.5px">Banque jovens da F2 e F3 por $25 mil por corrida cada. Se chegarem à F1, você ganha fama e 10% do salário deles todo ano.</p>
    ${L.academy.map(a=>`<div class="kv"><span>${esc(a.n)} (${a.s})</span><b class="num">${a.pts||0} pts</b></div>`).join("")||""}
    <div class="row">${feederInit().f3.concat(feederInit().f2).filter(x=>!L.academy.some(a=>a.n===x.n)).sort((a,b)=>b.pot-a.pot).slice(0,3).map(x=>`<button class="btn sm" data-act="lfAcad" data-k="${esc(x.n)}">Bancar ${esc(x.n)} (${x.s}, ${x.age} anos)</button>`).join("")}</div></div>
   <div class="card"><h3>Cotas de equipe</h3><p class="muted" style="font-size:12.5px">Rendem dividendos pela posição da equipe. Com 10% de uma equipe, ao se aposentar você pode virar o dono.</p>
    ${G.teams.slice().sort((a,b)=>b.rep-a.rep).map(t=>`<div class="kv"><span>${teamLogo(t,"tc")}${esc(t.n)} ${L.shares[t.id]?`<b>${L.shares[t.id]}%</b>`:""}</span><button class="btn sm" data-act="lfShare" data-k="${t.id}">+1% · ${money(sharePrice(t))}</button></div>`).join("")}
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="lfRetire">Aposentar</button><span class="muted" style="font-size:12.5px">${me.age<30?"Você ainda é jovem: aposentar encerra a carreira de piloto.":"Ao se aposentar com 10% de uma equipe, você assume como dono."}</span></div></div>
   <div class="card" style="grid-column:1/-1"><h3>Histórico</h3>${L.log.slice(0,8).map(x=>`<p class="muted" style="font-size:13px">${x.y} · etapa ${x.r}: ${esc(x.t)}</p>`).join("")||`<p class="muted">Nada ainda.</p>`}</div></div>`}
function sharePrice(t){return +(1.2*(t.rep/60)).toFixed(2)}
function lfAction(a,k,b){const L=LF(),me=ME();const pay=v=>{if((G.money||0)<v){b&&(b.textContent="Sem dinheiro");return false}G.money-=v;return true};
  if(a==="lfHome"&&LF_HOME.some(h=>h[0]===k)){L.home=k;lfLog(`Mudou-se para ${LF_HOME.find(h=>h[0]===k)[1]}.`)}
  if(a==="lfStaff"){L.staff[k]=!L.staff[k];lfLog(`${L.staff[k]?"Contratou":"Dispensou"}: ${LF_STAFF.find(x=>x[0]===k)[1]}.`)}
  if(a==="lfItem"){const it=LF_LIFE.find(x=>x[0]===k);if(L.items[k]){L.items[k]=false;if(it[2])G.money+=it[2]*.5;lfLog(`Vendeu: ${it[1]}.`)}else if(pay(it[2])){L.items[k]=true;lfLog(`Comprou: ${it[1]}.`)}else return}
  if(a==="lfCoach"){if(!pay(.4))return;const g=lfGain(k,1);lfLog(g?`Curso de pilotagem: +${g} em ${LF_ATTR.find(x=>x[0]===k)[1]}.`:"Curso feito, mas você já chegou ao limite deste ano nesse atributo.")}
  if(a==="lfEvent"){const ev=LF_EVENTS.find(x=>x[0]===k);if(!ev||L.events[k])return;L.events[k]=1;const won=rnd()<clamp(ovr(me)/140,.15,.6);const prize=ev[2]*(won?2:1);G.money+=prize;G.fame.pop=Math.min(100,(G.fame.pop||0)+ev[3]*(won?1.5:1));
    if(k==="kart"){lfGain("start",1);lfGain("ovt",1)}else{const ex=dExp(me);ex.wet=(ex.wet||0)+2}
    if(rnd()<ev[4]){L.injury=L.staff.physio?1:2;lfLog(`${ev[1]}: você se machucou num acidente. ${L.injury} corrida(s) com rendimento menor.`)}else lfLog(`${ev[1]}: ${won?"VITÓRIA!":"boa participação."} ${prize>0?"Prêmio de "+money(prize)+".":""}`)}
  if(a==="lfInv"){if(k==="sell"){G.money+=L.inv.re;lfLog(`Vendeu imóveis por ${money(L.inv.re)}.`);L.inv.re=0}else if(pay(1)){L.inv[k]+=1}else return}
  if(a==="lfRush"&&G.dev&&pay(2)){G.dev.eta=Math.max(0,(G.dev.eta||1)-1);lfLog("Pagou para adiantar a peça nova em uma corrida.")}
  if(a==="lfBring"){L.bring=+k||0}
  if(a==="lfAcad"){const F=feederInit();const j=F.f2.concat(F.f3).find(x=>x.n===k);if(j&&L.academy.length<3){L.academy.push({n:j.n,s:j.s,pts:j.pts});lfLog(`Agora você banca ${j.n} (${j.s}).`)}}
  if(a==="lfShare"){const t=teamOf(k);if(t&&pay(sharePrice(t))){L.shares[k]=(L.shares[k]||0)+1;lfLog(`Comprou 1% da ${t.n}.`)}else return}
  if(a==="lfRetire"){if(b&&b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Toque de novo para confirmar";return}const own=Object.entries(L.shares).find(([t,p])=>p>=10);
    if(own){G.owner={team:own[0],since:G.year};G.drivers[G.me].retired=true;lfLog(`Você se aposentou e assumiu como dono da ${teamOf(own[0]).n}.`);news(`${me.n} se aposenta e vira dono da ${teamOf(own[0]).n}!`)}
    else{G.gameOver=true;news(`${me.n} anuncia a aposentadoria.`)}save();return render()}
  save();lifeTab()}
// patrocínio levado: abre proposta de equipe melhor
(function(){if(typeof makeOffers!=="function")return;const base=makeOffers;globalThis.makeOffers=function(mid){const r=base.apply(this,arguments);try{const L=LF();if(L.staff.agent)(G.offers||[]).forEach(o=>{if(o.salary)o.salary=+(o.salary*1.1).toFixed(2)});
      if(L.bring>0&&!mid){const cur=myTeam();const up=G.teams.filter(t=>t.rep>cur.rep&&!(G.offers||[]).some(o=>o.team===t.id)).sort((a,b)=>a.rep-b.rep)[0];
        if(up&&(G.money||0)>=L.bring&&G.offers&&G.offers[0]){const o={...G.offers[0],team:up.id,salary:+Math.max(.5,(G.offers[0].salary||2)*.6).toFixed(2),bring:L.bring};G.offers.push(o);news(`Com o seu patrocínio de $${L.bring} mi, a ${up.n} entrou na disputa pela sua contratação.`)}}}catch(e){}return r}})();
// ---------- dono de equipe (depois de se aposentar com 10% de uma equipe)
function ownerHub(){const t=teamOf(G.owner.team);const st=standings();const tp=st.teams.findIndex(x=>x.id===t.id)+1;const C=CIR[G.calendar[Math.min(G.round,G.calendar.length-1)]];
  app.innerHTML=`<div class="mn-wrap" style="max-width:1000px;margin:0 auto"><header class="mn-brand"><div class="mn-k">DONO DE EQUIPE</div><h2 style="margin:4px 0">${esc(t.n)}</h2><p class="muted">Desde ${G.owner.since} · ${tp}º no campeonato de construtores · saldo ${money(G.money||0)}</p></header>
   <div class="grid2"><div class="card"><h3>Próxima etapa</h3><p><b>${esc(C?C.gp:"Fim da temporada")}</b> · etapa ${G.round+1} de ${G.calendar.length}</p>
    <h4 class="ag">Investimento no carro nesta etapa</h4><div class="seg">${[["aero","Aerodinâmica"],["eng","Motor"],["chas","Chassi"],["rel","Confiabilidade"]].map(([k,n])=>`<button data-act="owDev" data-k="${k}">${n} · $3 mi</button>`).join("")}</div>
    <div class="row" style="margin-top:10px"><button class="btn go" data-act="owRun">${G.round>=G.calendar.length?"Nova temporada":"Simular o GP"}</button></div></div>
    <div class="card"><h3>Seus pilotos</h3>${t.drivers.map(id=>{const d=G.drivers[id];const s=st.drivers.find(x=>x.id===id);return`<div class="kv"><span>${esc(d.n)} · OVR ${ovr(d)}</span><b class="num">${s?s.pts:0} pts</b></div>`}).join("")}
     <h4 class="ag">Carro</h4>${["aero","eng","chas","rel"].map(k=>`<div class="kv"><span>${k}</span><b class="num">${Math.round(t.car[k])}</b></div>`).join("")}</div>
    <div class="card" style="grid-column:1/-1"><h3>Construtores</h3>${st.teams.slice(0,11).map((x,i)=>`<div class="kv"><span>${i+1}. ${esc(teamOf(x.id).n)}</span><b class="num">${x.pts}</b></div>`).join("")}</div></div></div>`}
function owAction(a,k){const t=teamOf(G.owner.team);if(a==="owDev"){if((G.money||0)<3)return;G.money-=3;t.car[k]=Math.min(97,t.car[k]+rr(.4,1.2));save();return ownerHub()}
  if(a==="owRun"){if(G.round>=G.calendar.length){G.endSummary=endSeason();save();return render()}const sv=G.me;try{const d=G.drivers[t.drivers[0]];G.me=d.id;d.me=true;startWeekend();doPractice("setup");doQuali("normal");startRace({plan:"A",fuel:"normal"});simulateRaceQuick();const m0=G.money;afterRace(R.result);G.money=m0;G.round++;W=null}catch(e){console.warn(e)}finally{for(const id of t.drivers)G.drivers[id].me=false;G.me=sv}
    const inc=(12-(standings().teams.findIndex(x=>x.id===t.id)+1))*.6;G.money+=inc;save();return ownerHub()}}
