// ===================== MENU PRINCIPAL E CONFIGURAÇÕES =====================
// Preferências do aparelho (valem para qualquer carreira): qualidade gráfica, gráficos de TV, voz e volumes.
let PREFS=(()=>{let o=null;try{o=JSON.parse(localStorage.getItem("paddock-prefs")||"null")}catch(e){}o=o&&typeof o==="object"?o:{};
  return{q:["auto","alto","medio","leve"].includes(o.q)?o.q:"auto",tv:o.tv!==false,tts:!!o.tts,vol:o.vol&&typeof o.vol==="object"?o.vol:{}}})();
function prefsSave(){try{localStorage.setItem("paddock-prefs",JSON.stringify(PREFS))}catch(e){}}
const Q_NAMES=[["auto","Automática","ajusta sozinha se o aparelho engasgar"],["alto","Alta","cenário completo e tela nítida"],["medio","Média","menos detalhes no cenário"],["leve","Leve","para celulares mais simples"]];
// resumo da carreira salva, sem abrir o jogo
function saveSummary(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");const g=s&&s.G;if(!g||!g.drivers)return null;const me=g.drivers[g.me];const t=g.teams.find(x=>x.id===me.team);
  const cid=g.calendar[Math.min(g.round,g.calendar.length-1)];const C=CIR[cid&&cid.id||cid];let pts=0;for(const r of g.results||[])if(r.season===g.season){const e=r.cls.find(x=>x.d===g.me);if(e)pts+=e.pts||0}
  return{n:me.n,code:me.code,team:t?t.n:"",tc:t?t.c:"#888",year:g.year,round:g.round,total:g.calendar.length,next:C?C.gp:"",pts,h:g.helmet||{c1:"#FFD400",c2:"#1B998B"},over:!!g.gameOver}}catch(e){return null}}
function titleScreen(){const sv=hasSave()?saveSummary():null;
  const item=(act,title,sub,cls)=>`<button class="mn-item${cls?" "+cls:""}" data-act="${act}"><b>${title}</b><small>${sub}</small><i aria-hidden="true">›</i></button>`;
  app.innerHTML=`<div class="mn"><div class="mn-stripes" aria-hidden="true"><i></i><i></i><i></i></div>
   <div class="mn-wrap"><header class="mn-brand"><div class="mn-logo">PADDOCK<span>2026</span></div><p>Simulador de carreira na Fórmula 1 com o regulamento de 2026. Você é o piloto: a física decide o resto.</p></header>
    <nav class="mn-menu" aria-label="Menu principal">
     ${sv&&!sv.over?item("continue","Continuar carreira",`${esc(sv.n)} · ${esc(sv.team)} · ${sv.year}, etapa ${Math.min(sv.round+1,sv.total)} de ${sv.total}`,"go"):""}
     ${item("newCareer","Nova carreira",sv?"Começa do zero (a carreira atual é substituída)":"Crie o seu piloto e assine com a equipe estreante",sv?"":"go")}
     ${item("mpOpen","Corrida online","Corra contra amigos, cada um no seu aparelho")}
     ${item("mnCfg","Configurações","Gráficos, som, narração e gráficos de TV")}
     ${item("mnHelp","Como jogar","O básico em um minuto")}</nav>
    ${sv&&!sv.over?`<aside class="mn-card"><div class="row" style="flex-wrap:nowrap;gap:12px">${helmetSVG(sv.h.c1,sv.h.c2,52)}<div style="min-width:0"><div class="mn-k">SUA CARREIRA</div><b class="mn-n">${esc(sv.n)}</b><div class="muted"><span class="tc" style="background:${sv.tc}"></span>${esc(sv.team)}</div></div></div>
      <div class="mn-stats"><div><small>Temporada</small><b class="num">${sv.year}</b></div><div><small>Pontos</small><b class="num">${sv.pts}</b></div><div><small>Próximo GP</small><b>${esc(sv.next)}</b></div></div></aside>`
     :`<aside class="mn-card"><div class="mn-k">O QUE TEM AQUI</div><ul class="mn-feat"><li>22 circuitos com traçado real</li><li>Motores 50% elétricos, aero ativa e modo de ultrapassagem</li><li>Pneus que esquentam, gastam por roda e estouram</li><li>Transmissão com narrador, replays e rádio dos pilotos</li><li>Contratos, mercado de pilotos, imprensa e patrocinadores</li></ul></aside>`}
    <footer class="mn-foot"><p>Equipes com os nomes reais do grid de 2026; pilotos, chefes e histórias são fictícios. Jogo de fã, sem ligação oficial com a Fórmula 1, a FIA ou as equipes.</p><p>Traçados dos circuitos: projeto f1-circuits, © 2019-2025 Tomislav Bacinger, licença MIT.</p></footer></div></div>`}
function cfgModal(){const seg=(act,cur,opts)=>`<div class="tpick">${opts.map(([v,n,d])=>`<button class="tchip ni${cur===v?" on":""}" data-act="${act}" data-k="${v}"><b>${n}</b>${d?`<small>${d}</small>`:""}</button>`).join("")}</div>`;
  modal(`<h2>Configurações</h2><p class="muted" style="font-size:14px">Valem para este aparelho e ficam salvas.</p>
   <h3>Qualidade gráfica</h3>${seg("mnQ",PREFS.q,Q_NAMES)}
   <h3>Transmissão</h3><div class="choice"><button class="chip${PREFS.tv?" on":""}" data-act="mnTv"><b>${PREFS.tv?"✓ ":""}Gráficos de TV (vinhetas, faixas, avisos e legendas)</b></button></div>
   ${typeof sndPanel==="function"?sndPanel():""}
   ${typeof liveryCard==="function"?liveryCard():""}
   <div class="row" style="margin-top:10px"><button class="btn go sm" data-act="closeModal">Pronto</button></div>`)}
function helpModal(){modal(`<h2>Como jogar</h2><ol class="howto">
  <li><b>Fim de semana:</b> coletiva, treino livre (escolha o foco), classificação e estratégia. Cada escolha muda a corrida.</li>
  <li><b>Largada:</b> toque na tela (ou espaço) quando as cinco luzes apagarem. Cedo demais é punição.</li>
  <li><b>Na corrida você é o piloto pelo rádio:</b> ritmo (atacar, normal, poupar), energia da bateria, quando atacar ou defender e quando ir para o box.</li>
  <li><b>O engenheiro ajuda:</b> as dicas aparecem com um botão para aplicar na hora. As decisões óbvias podem ser automáticas.</li>
  <li><b>Pneus:</b> cada roda gasta de um jeito. Passou de ~90% na roda mais gasta, pode estourar.</li>
  <li><b>Carreira:</b> resultados trazem dinheiro, fama e propostas. No fim do ano, contratos vencem e o mercado se mexe.</li></ol>
  <div class="row"><button class="btn go sm" data-act="closeModal">Entendi</button></div>`)}
function mnAction(a,k,b){if(typeof racelogAction==="function"&&racelogAction(a,k,b))return;if(a==="mnCfg")return cfgModal();if(a==="mnHelp")return helpModal();
  if(a==="mnQ"&&Q_NAMES.some(x=>x[0]===k)){PREFS.q=k;prefsSave();if(typeof qualityApply==="function")qualityApply(true);return cfgModal()}
  if(a==="mnTv"){PREFS.tv=!PREFS.tv;prefsSave();return cfgModal()}}
