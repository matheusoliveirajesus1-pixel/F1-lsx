// ===================== BASE DO CAMPEONATO: CORRIDA COM SEMENTE, REGISTRO COMPLETO E PINTURA ESPECIAL =====================
// Semente: toda corrida guarda o número que gerou os sorteios. Rodando a simulação sem tela (passo fixo) com a mesma
// semente e as mesmas decisões, o resultado sai idêntico: é a base para um servidor de campeonato conferir corridas.
// Registro: tudo o que aconteceu (direção de prova, lances, voltas, paradas), para ver no fim ou copiar como JSON.
function raceSeedPick(){const sd=(W&&W.seed)||1+Math.floor(Math.random()*2147483000);if(W&&W.seed)RNG=mulberry(sd);return sd}
function raceSeedEnd(){if(W&&W.seed)RNG=Math.random}
function rlog(kind,txt,extra){if(!R)return;if(!R.log)R.log=[];if(R.log.length>3000)return;R.log.push({t:+(R.t||0).toFixed(2),lap:Math.max(0,(R.lead||0)+1),k:kind,txt:String(txt),...(extra||{})})}
// grava tudo que passa pela direção de prova e pelos lances da transmissão
(function(){if(typeof rcMsg!=="function")return;const _rc=rcMsg;globalThis.rcMsg=function(t,cls,k){rlog("dp",t,cls?{cls}:null);return _rc.apply(this,arguments)};
  const _hl=hlight;globalThis.hlight=function(type,cars,txt,imp){rlog(type,txt,{cars:cars.map(c=>c.code)});return _hl.apply(this,arguments)};
  const _sr=startRace;globalThis.startRace=function(pre){const sd=raceSeedPick();const r=_sr.apply(this,arguments);R.seed=sd;R.log=R.log||[];if(typeof liveryApply==="function")liveryApply();return r}})();
function raceLogJSON(){if(!R)return"{}";const res=R.result;return JSON.stringify({jogo:"Paddock 2026",semente:R.seed,pista:R.C.id,gp:R.C.gp,voltas:R.L,
  carros:R.cars.map(c=>({sigla:c.code,piloto:c.d.n,equipe:c.t.n,largada:c.grid,status:c.status,motivo:c.why||undefined,voltas:c.laps,paradas:c.stops,punicao:c.pen||0})),
  resultado:res?res.cls.map(e=>({pos:e.pos,sigla:G.drivers[e.d]?G.drivers[e.d].code:e.d,status:e.status,pts:e.pts})):null,eventos:R.log},null,1)}
function raceLogModal(){if(!R||!R.log)return;const ev=R.log.filter(e=>e.k!=="dp"||!/^Volta \d/.test(e.txt));const ic={pass:"↗",lead:"★",crash:"✖",spin:"↻",contact:"⚡",pit:"⏱",finish:"🏁",start:"🚦",dp:"·"};
  modal(`<h2>Registro da corrida</h2><p class="muted" style="font-size:13px">${esc(R.C.gp)} · ${R.L} voltas · semente <span class="num">${R.seed}</span> · ${ev.length} eventos</p>
   <div class="rlog">${ev.map(e=>`<div class="rl-${e.k}"><span class="num">V${e.lap}</span><span class="num">${fmtClock(e.t)}</span><i>${ic[e.k]||"·"}</i><span>${esc(e.txt)}</span></div>`).join("")}</div>
   <div class="row" style="margin-top:10px"><button class="btn sm" data-act="mnLogCopy">Copiar registro (JSON)</button><button class="btn go sm" data-act="closeModal">Fechar</button><span class="muted" id="rlmsg" style="font-size:12.5px"></span></div>`)}
function fmtClock(t){const m=Math.floor(t/60),s=Math.floor(t%60);return`${m}:${String(s).padStart(2,"0")}`}
// ---------- pintura especial (vale para os dois carros da sua equipe, a partir da próxima corrida)
function liveryApply(){if(!G||!G.livery||!G.livery.on||!R)return;const me=R.cars.find(c=>c.isP);if(!me)return;R.cars.forEach(c=>{if(c.t===me.t){c.col=G.livery.c1;c.col2=G.livery.c2}})}
function liveryCard(){if(!G||G.mp)return"";const L=G.livery||{on:false,c1:"#FFD400",c2:"#111111"};const t=G.teams&&teamOf(ME().team);
  return`<h3>Pintura especial do seu carro</h3><p class="muted" style="font-size:12.5px">Como as edições especiais da F1: troca as cores dos dois carros da ${t?esc(t.n):"sua equipe"} a partir da próxima corrida.</p>
   <div class="row"><button class="chip${L.on?" on":""}" data-act="mnLiv"><b>${L.on?"✓ Usando a pintura especial":"Usar pintura especial"}</b></button><div class="ssncar" style="--c1:${L.on?L.c1:t?t.c:"#888"};--c2:${L.on?L.c2:t?t.c2:"#222"}"><i></i><b></b></div></div>
   ${L.on?`<div class="muted" style="font-size:12.5px">Cor principal</div><div class="swatches">${HELMETS.map(c=>`<button class="sw${L.c1===c?" on":""}" style="background:${c}" data-act="mnLc1" data-k="${c}" aria-label="cor principal ${c}"></button>`).join("")}</div>
   <div class="muted" style="font-size:12.5px">Cor dos detalhes</div><div class="swatches">${HELMETS.map(c=>`<button class="sw${L.c2===c?" on":""}" style="background:${c}" data-act="mnLc2" data-k="${c}" aria-label="cor dos detalhes ${c}"></button>`).join("")}</div>`:""}`}
function racelogAction(a,k,b){if(a==="mnLog"){raceLogModal();return true}
  if(a==="mnLogCopy"){const txt=raceLogJSON();const el=$("#rlmsg");const ok=()=>{if(el)el.textContent="Copiado ✓"};try{navigator.clipboard.writeText(txt).then(ok,()=>{if(el)el.textContent="Não deu para copiar neste navegador."})}catch(e){if(el)el.textContent="Não deu para copiar neste navegador."}return true}
  if(a==="mnLiv"){G.livery=G.livery||{on:false,c1:"#FFD400",c2:"#111111"};G.livery.on=!G.livery.on;save();cfgModal();return true}
  if((a==="mnLc1"||a==="mnLc2")&&/^#[0-9A-Fa-f]{6}$/.test(k)){G.livery[a==="mnLc1"?"c1":"c2"]=k;save();cfgModal();return true}return false}
