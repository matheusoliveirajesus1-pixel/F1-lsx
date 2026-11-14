// ===================== DESEMPENHO: MEDIDOR DE QUADROS E FILA DE RECÁLCULO =====================
// Mede cada quadro da corrida e anota quem gastou o tempo (física, desenho, preparo do cenário, painel, som...).
// Quadros acima de 45 ms ficam registrados com a lista de culpados. Liga e desliga no botão "Desempenho" da corrida.
const PERF={on:false,gaps:new Float32Array(240),gi:0,last:0,spikes:[],cur:{},frameT0:0,n:0,sum:0};
const PERF_PARTS={step:"física",drawScene:"desenho",bakeChunk:"preparo do chão",bakeBuilding:"preparo de prédios",treeSprite:"preparo de árvores",recalcNow:"recálculo dos carros",
  updatePanels:"painel",sndUpdate:"som",mpHostTick:"multijogador",mpGuestFrame:"multijogador",smartPip:"janela no canto",smartDrawReplay:"replay",drawGroundRaw:"chão sem cache",save:"salvar jogo",tipsTick:"dicas"};
function perfWrap(){if(typeof window==="undefined")return;for(const n in PERF_PARTS){const f=window[n];if(typeof f!=="function"||f._pf)continue;const lab=PERF_PARTS[n];
    const g=function(){const t=performance.now();try{return f.apply(this,arguments)}finally{const d=performance.now()-t;PERF.cur[lab]=(PERF.cur[lab]||0)+d}};g._pf=1;g._orig=f;window[n]=g}}
// começo de cada quadro (chamado pelo laço da corrida)
function perfFrame(now){const gap=PERF.last?now-PERF.last:16;PERF.last=now;PERF.gaps[PERF.gi=(PERF.gi+1)%PERF.gaps.length]=gap;PERF.n++;PERF.sum+=gap;
  if(gap>45&&PERF.n>30){const parts=Object.entries(PERF.prev||{}).sort((a,b)=>b[1]-a[1]).filter(x=>x[1]>1).slice(0,4).map(([k,v])=>`${k} ${v.toFixed(0)} ms`);
    PERF.spikes.unshift({t:R?R.t:0,gap:Math.round(gap),parts:parts.length?parts.join(", "):"navegador (limpeza de memória ou outra aba)"});if(PERF.spikes.length>8)PERF.spikes.pop()}
  PERF.prev=PERF.cur;PERF.cur={};PERF.frameT0=performance.now();if(typeof qualityTick==="function")qualityTick(now);if(PERF.on&&PERF.n%6===0)perfDraw()}
// tempo que ainda sobra neste quadro para preparar cenário (orçamento de ~4 ms)
function perfBudget(ms){return performance.now()-PERF.frameT0<(ms||4)}
function perfDraw(){const el=document.getElementById("perfbox");if(!el)return;el.hidden=!PERF.on;if(!PERF.on)return;const cv=el.querySelector("canvas");if(!cv)return;const c=cv.getContext("2d"),W=cv.width,H=cv.height;
  c.clearRect(0,0,W,H);c.fillStyle="rgba(10,12,16,.85)";c.fillRect(0,0,W,H);c.strokeStyle="rgba(255,255,255,.25)";c.beginPath();for(const ms of[16.7,33.3]){const y=H-ms/60*H;c.moveTo(0,y);c.lineTo(W,y)}c.stroke();
  const n=PERF.gaps.length;for(let k=0;k<n;k++){const g=PERF.gaps[(PERF.gi+1+k)%n];const h=Math.min(H,g/60*H);c.fillStyle=g>45?"#FF4D4D":g>20?"#F5A524":"#21C55D";c.fillRect(k*W/n,H-h,Math.max(1,W/n),h)}
  const avg=PERF.sum/Math.max(1,PERF.n);const lst=el.querySelector(".pl");if(lst)lst.innerHTML=`<b>${(1000/Math.max(1,avg)).toFixed(0)} quadros/s em média</b>`+(PERF.spikes.length?PERF.spikes.slice(0,4).map(s=>`<div>⚠ ${s.gap} ms: ${s.parts}</div>`).join(""):"<div>Nenhum travamento registrado.</div>")}
function perfToggle(){PERF.on=!PERF.on;perfDraw();const b=document.getElementById("perfb");if(b)b.classList.toggle("on",PERF.on)}
// ---------- fila de recálculo: em vez de recalcular vários carros no mesmo quadro, espalha pelos próximos quadros
const RQ=new Set();
function recalcQueueInstall(){if(typeof window==="undefined"||typeof recalc!=="function"||recalc._q)return;window.recalcNow=recalc;const q=function(c){if(!c||!c.prof||!R||!R.started||R.over){return window.recalcNow(c)}RQ.add(c)};q._q=1;window.recalc=q}
function recalcFlush(){if(!RQ.size)return;let n=0;for(const c of RQ){RQ.delete(c);window.recalcNow(c);if(++n>=6)break}}// ordem de chegada, sem relógio: igual em qualquer aparelho
if(typeof window!=="undefined"){recalcQueueInstall();perfWrap()}
// ===================== CARREGAR SÓ QUANDO PRECISA =====================
// O desenho da pista (cenário, carros, câmeras, transmissão, radar) só é baixado quando um fim de semana começa;
// o modo online, só quando alguém abre a corrida online. O menu e a carreira abrem bem mais rápido.
const LAZY={race:["scene.js","render.js","cars.js","camera.js","tv.js","tv2.js","tv3.js","wx.js"],online:["config.js","net.js","mp.js","mpssn.js"]};const LZ={};const LZF={};
function lazyScript(f){if(LZF[f])return LZF[f];return LZF[f]=new Promise(ok=>{const s=document.createElement("script");s.src=f;s.async=false;s.onload=()=>ok(true);s.onerror=()=>ok(false);document.body.appendChild(s)})}
function lazyLoad(name){if(LZ[name])return LZ[name];const files=name==="online"?[...LAZY.race,...LAZY.online]:LAZY[name];
  LZ[name]=files.reduce((p,f)=>p.then(()=>lazyScript(f)),Promise.resolve()).then(()=>{perfWrap();return true});return LZ[name]}
function raceReady(){return typeof drawScene==="function"&&typeof buildTrack==="function"&&typeof smartPick==="function"&&typeof tvOverlay==="function"&&typeof wxDraw==="function"}
function onlineReady(){return typeof mpAction==="function"&&typeof ssnAction==="function"}
function lazyWait(){const el=document.getElementById("app");if(el&&!el.querySelector(".lzw"))el.insertAdjacentHTML("beforeend",`<div class="lzw" role="status"><span class="lzs"></span>Carregando…</div>`)}
function lazyDone(){document.querySelectorAll(".lzw").forEach(x=>x.remove())}
// ações que precisam de um pacote: carrega e repete o toque
const LAZY_RACE_ACTS={goWeekend:1,continue:1,startRace:1};
function lazyGate(a,b){let need=null;if(a.startsWith("mp")&&!onlineReady())need="online";else if(LAZY_RACE_ACTS[a]&&!raceReady())need="race";if(!need)return false;
  if(b._lz)return true;b._lz=1;lazyWait();lazyLoad(need).then(()=>{lazyDone();b._lz=0;b.click()});return true}
// telas que precisam do desenho da pista (por exemplo, ao abrir uma carreira salva no meio do fim de semana)
function lazyNeed(){if(typeof G==="undefined"||!G)return false;const wk=(G.phase==="weekend"||(typeof W!=="undefined"&&W&&W.step))&&UI.scr!=="title"&&UI.scr!=="create";
  const on=(UI.scr==="mp"||G.mp)&&!onlineReady();if(on){lazyWait();lazyLoad("online").then(()=>{lazyDone();render()});return true}
  if(wk&&!raceReady()){lazyWait();lazyLoad("race").then(()=>{lazyDone();if(typeof W!=="undefined"&&W&&W.geo&&!TRACKGEO)buildTrack(W.geo);render()});return true}return false}
// adianta o pacote da pista quando o aparelho está ocioso (sem atrasar a abertura do menu)
if(typeof window!=="undefined"){const idle=window.requestIdleCallback||(f=>setTimeout(f,2500));window.addEventListener("load",()=>idle(()=>lazyLoad("race"),{timeout:6000}))}
// ===================== QUALIDADE GRÁFICA =====================
// Alta: tela nítida (até 2x). Média: 1,5x. Leve: 1x, metade das árvores, sem vinheta e sem a janelinha no canto.
// Automática: começa na alta e desce um degrau se a corrida ficar abaixo de ~40 quadros por segundo.
const QL={lvl:2,auto:true,autoLvl:2,checkT:0,slow:0};
function qualityApply(user){const q=typeof PREFS!=="undefined"?PREFS.q:"auto";QL.auto=q==="auto";if(user&&QL.auto)QL.autoLvl=2;QL.lvl=QL.auto?QL.autoLvl:q==="leve"?0:q==="medio"?1:2;if(typeof GCH!=="undefined"&&GCH&&GCH.map)GCH.map.clear()}
// mapa simples: sem imagens guardadas de prédios e árvores, sem janelas, tela em resolução 1x e menos blocos de chão na memória.
// Fica ligado sozinho em celulares e aparelhos com pouca memória (pode ser trocado em Configurações > Mapa).
function devLow(){try{return (navigator.deviceMemory||8)<=4||matchMedia("(pointer:coarse)").matches}catch(e){return false}}
function mapSimple(){const m=(typeof PREFS!=="undefined"&&PREFS.map)||"auto";return m==="simples"||(m!=="completo"&&devLow())}
function qDpr(){if(mapSimple())return 1;const d=(typeof window!=="undefined"&&window.devicePixelRatio)||1;return QL.lvl>=2?Math.min(2,d):QL.lvl===1?Math.min(1.5,d):1}
function qualityTick(now){if(!QL.auto||typeof R==="undefined"||!R||!R.started||R.over||document.hidden||QL.autoLvl===0)return;if(now-QL.checkT<4000)return;QL.checkT=now;
  let s=0,n=0;for(const g of PERF.gaps){if(g>0&&g<250){s+=g;n++}}if(n<120)return;const avg=s/n;
  if(avg>25){QL.slow++;if(QL.slow>=2){QL.autoLvl--;QL.slow=0;qualityApply();PERF.gaps.fill(0);if(typeof rcMsg==="function")rcMsg(`Qualidade gráfica ajustada para "${QL.lvl===1?"média":"leve"}" para o jogo ficar mais fluido (Configurações no menu).`,"")}}else QL.slow=0}
if(typeof window!=="undefined")qualityApply();
// ===================== SÓ DESENHA O QUE ESTÁ NA TELA =====================
// Se a pista sai da tela (por exemplo, quando você rola até os botões do rádio no celular), a corrida continua,
// mas o desenho da pista para até ela voltar a aparecer. Economiza bateria e deixa os botões mais rápidos.
const VIS={el:null,on:true,io:null};
function stageVisible(){const el=document.getElementById("stage");if(!el)return true;if(el!==VIS.el){VIS.el=el;VIS.on=true;if(VIS.io)VIS.io.disconnect();
    if(typeof IntersectionObserver==="function"){VIS.io=new IntersectionObserver(es=>{for(const e of es)VIS.on=e.isIntersecting},{threshold:0});VIS.io.observe(el)}}return VIS.on}
