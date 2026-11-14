// ===================== SIMULAR O RESTO (corrida e classificação ao vivo) =====================
// Botão sempre visível durante a corrida (e na classificação ao vivo). Pede confirmação no próprio botão (o visualizador
// não mostra confirm()). A simulação é a mesma física de quando você assiste, só que sem desenhar: roda em partes de
// ~35 ms para a tela não travar, com progresso (volta, sua posição, líder) e um botão para voltar a assistir.
// Durante a simulação, o engenheiro decide por você (respostas padrão) e o rádio fica em silêncio.
const SIMF={on:false,arm:0,t0:0,cancel:false};
function simfCan(){return R&&!R.over&&!R.mp&&W&&W.step==="race"&&!SIMF.on&&(R.qMode?R.qMode.phase!=="done":true)}
function simfLabel(){return R&&R.qMode?"Simular o resto da classificação":"Simular o resto da corrida"}
function simfStart(){if(!simfCan())return;SIMF.on=true;SIMF.f0=null;SIMF.cancel=false;SIMF.t0=performance.now();UI.paused=true;R.fastSim=true;if(typeof sndSilence==="function")sndSilence();
  try{if(typeof speechSynthesis!=="undefined")speechSynthesis.cancel()}catch(e){}
  if(!R.qMode){R.autoStart=true;if(!R.started&&typeof skipFormation==="function")skipFormation();const me=R.cars.find(c=>c.isP);if(me&&me.hold)releasePlayer(me,.3)}
  {const b=document.getElementById("simrest");if(b)b.hidden=true}SIMF.arm=0;simfOverlay(true);setTimeout(simfChunk,30)}
function simfDone(){const Q=R&&R.qMode;return!R||R.over||(Q&&(Q.phase==="done"||Q.finished))}
function simfChunk(){if(!SIMF.on)return;const t=performance.now();let n=0;
  while(performance.now()-t<60&&!simfDone()&&!SIMF.cancel){if(R.redChoose)resumeRed({});if(R.ask)answerAsk(R.ask.def,true);if(!R.qMode){const me=R.cars.find(c=>c.isP);if(me&&me.hold)releasePlayer(me,.3)}step(SIM_DT);n++}
  simfOverlay(false);
  if(SIMF.cancel){simfStop(false);return}
  if(simfDone()){simfStop(true);return}
  setTimeout(simfChunk,0)}
function simfStop(done){SIMF.on=false;if(R)R.fastSim=false;UI.paused=false;const o=document.getElementById("simfOv");if(o)o.remove();
  if(done&&R&&R.qMode&&R.qMode.phase==="done"&&!R.qMode.finished&&typeof qFinish==="function"){qFinish();return}
  /* corrida: o laço da tela vê R.over e abre o resultado como sempre */}
function simfOverlay(first){const host=document.getElementById("rc");const wrap=host&&host.parentElement;if(!wrap)return;let o=document.getElementById("simfOv");
  if(!o){o=document.createElement("div");o.id="simfOv";o.setAttribute("role","status");o.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(8,10,14,.82);z-index:40;padding:16px";
    o.innerHTML=`<div class="card" style="max-width:420px;width:100%;text-align:left"><h3 id="simfT" style="margin:0 0 6px"></h3><p class="muted" id="simfS" style="margin:0 0 10px;font-size:14px"></p><div style="height:8px;background:rgba(255,255,255,.12);border-radius:4px;overflow:hidden"><div id="simfBar" style="height:100%;width:0;background:#E10600"></div></div><p id="simfP" style="margin:10px 0 12px;font-size:14px"></p><button class="btn sm" data-act="simfCancel">Voltar a assistir</button></div>`;
    if(getComputedStyle(wrap).position==="static")wrap.style.position="relative";wrap.appendChild(o)}
  const me=R.cars.find(c=>c.isP);let frac=0,title="",sub="",info="";
  if(R.qMode){const Q=R.qMode;const tot=QDUR[1]+QDUR[2]+QDUR[3];const done=[0,0,QDUR[1],QDUR[1]+QDUR[2]][Q.sess]+(QDUR[Q.sess]-Q.clock);frac=Math.min(1,done/tot);title="Simulando a classificação";
    sub=Q.phase==="break"?`Intervalo antes do Q${Q.sess+1}`:`Q${Q.sess} · ${qClock(Q.clock)} no relógio`;const p=me&&qPosOf(me);const o2=qOrder();info=`${me?`Você: ${me.d.id&&Q.pool.includes(me.d.id)?(p?`P${p}`:"sem tempo"):"eliminado"} · `:""}Ponta: ${o2[0]&&qTime(o2[0])!=null?`${o2[0].code} ${fmtT(qTime(o2[0]))}`:"—"}`}
  else{const lap=Math.min(R.L,R.lead||0);frac=R.L?lap/R.L:0;title="Simulando a corrida";sub=`Volta ${lap} de ${R.L}${R.sc?R.sc.type==="vsc"?" · safety car virtual":" · safety car":""}${R.red?" · bandeira vermelha":""}`;
    const ld=R.order.find(c=>running(c)||c.status==="fin");info=`${me?`Você: ${running(me)||me.status==="fin"?`P${pos(me)}`:"fora da corrida"} · `:""}Líder: ${ld?ld.code:"—"}`}
  const el=(performance.now()-SIMF.t0)/1000;if(SIMF.f0==null)SIMF.f0=frac;let eta="";if(el>2&&frac>SIMF.f0+.005){const rem=(1-frac)*el/(frac-SIMF.f0);eta=rem<60?` · faltam ~${Math.max(1,Math.round(rem))} s`:` · faltam ~${Math.round(rem/60)} min`}sub+=eta;
  const set=(id,t)=>{const e=document.getElementById(id);if(e&&e.textContent!==t)e.textContent=t};set("simfT",title);set("simfS",sub+" · o engenheiro decide por você");set("simfP",info);const b=document.getElementById("simfBar");if(b)b.style.width=(frac*100).toFixed(1)+"%"}
// a pista não é desenhada durante a simulação (o aviso cobre a tela): todo o processador vai para a física
(function(){if(typeof stageVisible==="function"){const base=stageVisible;globalThis.stageVisible=function(){return SIMF.on?false:base()}}else globalThis.stageVisible=function(){return!SIMF.on}})();
// rádio em silêncio durante a simulação rápida (só apresentação: não mexe na física)
(function(){const base=vox;globalThis.vox=function(...a){if(R&&R.fastSim)return;return base(...a)}})();
(function(){if(typeof tvMyRadioSay==="function"){const base=tvMyRadioSay;globalThis.tvMyRadioSay=function(...a){if(R&&R.fastSim)return;return base(...a)}}})();
// o botão: sempre visível na corrida e na classificação ao vivo; o primeiro toque pede confirmação
(function(){if(typeof updatePanels!=="function")return;const base=updatePanels;globalThis.updatePanels=function(now){if(SIMF.on)return;/* painéis parados enquanto simula: mais processador para a física */base(now);try{const b=document.getElementById("simrest");if(!b||!R)return;const me=R.cars.find(c=>c.isP);
  const out=me&&!running(me)&&me.status!=="fin";const can=simfCan()&&(R.started||R.form||R.qMode);b.hidden=!can;if(!can)return;
  const armed=SIMF.arm&&performance.now()-SIMF.arm<4000;if(!armed)SIMF.arm=0;const t=armed?"Confirmar: simular até o fim?":me&&me.status==="fin"?"Ver o resultado final":out?"Simular o resto da corrida":simfLabel();if(b.textContent!==t)b.textContent=t;b.classList.toggle("go",!!armed)}catch(e){}}})();
document.addEventListener("click",e=>{const b=e.target.closest('[data-act="simRest"],[data-act="simfCancel"]');if(!b)return;e.stopPropagation();e.preventDefault();
  if(b.dataset.act==="simfCancel"){SIMF.cancel=true;return}if(!simfCan())return;const me=R.cars.find(c=>c.isP);
  // abandonou ou já terminou: não precisa confirmar (nada a perder)
  if(me&&(!running(me)||me.status==="fin")){simfStart();return}
  if(SIMF.arm&&performance.now()-SIMF.arm<4000){SIMF.arm=0;simfStart()}else{SIMF.arm=performance.now()}},true);
