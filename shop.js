// ===================== OFICINA (carreira) =====================
// Peças em níveis (Série → Nível 5), compradas com créditos de oficina, e ajustes finos com troca (ganha aqui, perde ali).
// Feita para quem está começando: cada peça diz em palavras simples onde o carro melhora, a melhor compra do momento vem
// marcada como "Recomendado" e os ajustes começam em "Engenheiro decide", que escolhe o melhor para cada pista.
// As peças mexem nas notas do carro da sua equipe (t.car); os ajustes entram na física só para o seu carro e o do
// companheiro (carPhys/tuneFor). No online nada disso vale: lá todos os carros são iguais (mpEqualCars em mp.js).

const SHOP_AREAS={eng:"Retas",aero:"Curvas rápidas",chas:"Curvas lentas",brk:"Freadas",susp:"Pneus duram mais",rel:"Menos quebras"};
// efeito de cada nível nas notas do carro (as notas vão de 60 a 99)
const SHOP_PARTS=[
 {id:"motor",n:"Motor",ic:"⚙️",d:"Mais potência: o carro anda mais nas retas.",fx:{eng:.45},p:34},
 {id:"ers",n:"Bateria e motor elétrico",ic:"🔋",d:"Mais energia para soltar nas retas.",fx:{eng:.3},p:26},
 {id:"cambio",n:"Câmbio",ic:"🔩",d:"Trocas mais rápidas: melhor saída de curva e reta.",fx:{eng:.15,chas:.2},p:22},
 {id:"asad",n:"Asa dianteira",ic:"🪽",d:"O carro vira melhor nas curvas rápidas.",fx:{aero:.3},p:24},
 {id:"asat",n:"Asa traseira",ic:"🛩️",d:"Mais estabilidade nas curvas e menos arrasto.",fx:{aero:.25,eng:.1},p:26},
 {id:"assoalho",n:"Assoalho",ic:"🟫",d:"Mais pressão aerodinâmica: curvas rápidas bem mais rápidas.",fx:{aero:.4},p:34},
 {id:"susp",n:"Suspensão",ic:"🛞",d:"Gasta menos os pneus e ajuda nas curvas lentas.",fx:{susp:.45,chas:.1},p:24},
 {id:"freios",n:"Freios",ic:"🛑",d:"Freia mais tarde e mais forte.",fx:{brk:.55},p:22},
 {id:"chassi",n:"Chassi mais leve",ic:"🏎️",d:"Carro mais leve: melhor nas curvas lentas.",fx:{chas:.4},p:28},
 {id:"arref",n:"Arrefecimento",ic:"❄️",d:"Motor menos quente: quebra menos.",fx:{rel:.6,eng:.05},p:20}];
const SHOP_MAX=5;
const SHOP_LV=["Série","Nível 1","Nível 2","Nível 3","Nível 4","Nível 5"];
// ajustes finos: −2 a +2, cada ponta explicada
const SHOP_TUNE=[
 {k:"w",n:"Asa",lo:"Mais rápido na reta",hi:"Mais rápido na curva"},
 {k:"g",n:"Câmbio",lo:"Mais velocidade final",hi:"Mais aceleração"},
 {k:"s",n:"Suspensão",lo:"Macia: gasta menos pneu",hi:"Dura: mais rápida, gasta mais pneu"},
 {k:"p",n:"Motor",lo:"Seguro: quebra menos",hi:"Potente: mais rápido, quebra mais"}];

function shopOn(){return!!(G&&!G.mp&&typeof myTeam==="function"&&myTeam())}
function shopInit(){if(!shopOn())return null;const t=myTeam();
  if(!G.shop)G.shop={cr:120,lv:{},upB:{},team:t.id,tune:{auto:true,w:0,g:0,s:0,p:0},seen:false,log:[]};
  const S=G.shop;
  // trocou de equipe: as peças ficam no carro da equipe antiga; os créditos vão com você
  if(S.team!==t.id){const old=G.teams.find(x=>x.id===S.team);if(old)for(const k in S.upB)old.car[k]=Math.max(60,+(old.car[k]-S.upB[k]).toFixed(2));
    S.lv={};S.upB={};S.team=t.id;S.log.unshift({t:`Nova equipe: as peças ficaram com a equipe antiga.`})}
  return S}
function shopLv(id){const S=shopInit();return S?(S.lv[id]||0):0}
function shopPrice(part,lv){return Math.round(part.p*(lv+1)*(1+lv*.15))}// preço do próximo nível
// créditos por corrida: participar, terminar, posição e pontos (um novato no meio do grid ganha ~45 por corrida)
function shopEarn(e){if(!shopOn())return 0;const S=shopInit();const pos=e.status==="ok"?e.pos:22;const c=Math.round(20+(e.status==="ok"?10:0)+Math.max(0,21-pos)*1.5+(e.pts||0));S.cr+=c;S.lastEarn=c;return c}
function shopAvg(k){const ts=G.teams.filter(x=>x.car);return ts.reduce((s,x)=>s+(x.car[k]||85),0)/Math.max(1,ts.length)}
// recomendação: onde o carro mais perde para a média do grid, entre o que dá para comprar agora
function shopRecommend(){const S=shopInit();if(!S)return null;const t=myTeam();let best=null;
  for(const p of SHOP_PARTS){const lv=S.lv[p.id]||0;if(lv>=SHOP_MAX)continue;const pr=shopPrice(p,lv);
    let gain=0;for(const k in p.fx){const gap=shopAvg(k)+2-t.car[k];gain+=p.fx[k]*(k==="rel"?.6:k==="susp"?.8:1)*(1+clamp(gap/4,0,1.5))}
    const v=gain/pr*(pr<=S.cr?1.6:1);if(!best||v>best.v)best={p,lv,pr,v,can:pr<=S.cr}}
  return best}
function shopBuy(id){const S=shopInit();if(!S)return false;const p=SHOP_PARTS.find(x=>x.id===id);if(!p)return false;const lv=S.lv[p.id]||0;if(lv>=SHOP_MAX)return false;const pr=shopPrice(p,lv);if(pr>S.cr)return false;
  const t=myTeam();S.cr-=pr;S.lv[p.id]=lv+1;for(const k in p.fx){const before=t.car[k];t.car[k]=Math.min(99,+(t.car[k]+p.fx[k]).toFixed(2));S.upB[k]=+((S.upB[k]||0)+(t.car[k]-before)).toFixed(2)}
  S.log.unshift({t:`${p.n}: ${SHOP_LV[lv+1]} instalado (−${pr} créditos).`});S.log=S.log.slice(0,8);if(typeof save==="function")save();return true}
// virada de temporada: as notas de todos voltam um pouco para a média; as suas peças continuam valendo por cima disso
function shopSeason(after){const S=G&&G.shop;if(!S||G.mp)return;const t=G.teams.find(x=>x.id===S.team);if(!t)return;for(const k in S.upB)t.car[k]=Math.min(99,Math.max(60,+(t.car[k]+(after?1:-1)*S.upB[k]).toFixed(2)))}

// ---------- ajustes finos
// o que cada ajuste faz na física (multiplicadores pequenos; o melhor depende da pista)
function tuneApply(ph,T){if(!T)return ph;const w=(T.w||0)/2,g=(T.g||0)/2,s=(T.s||0)/2,p=(T.p||0)/2;
  // asa: pressão com retorno decrescente × arrasto (o ponto ideal muda com a pista: Monza pede pouca, Barcelona muita)
  // câmbio: aceleração (com custo quadrático) × velocidade final; suspensão dura: um pouco mais de aderência
  ph.cl*=(1+.025*w-.008*w*w)*(1+.006*s);ph.cd*=1+.022*w+.02*g;ph.pw*=1+.015*g-.006*g*g+.006*p;return ph}
function tuneWearK(c){const T=tuneFor(c.t);return T?1+.06*((T.s||0)/2):1}
function tuneRelK(c){const T=tuneFor(c.t);return T?1+.7*Math.max(0,(T.p||0)/2)-.25*Math.max(0,-(T.p||0)/2):1}
// ajuste valendo para cada equipe na carreira: a sua segue a oficina; as da IA têm o engenheiro delas escolhendo o melhor
// (assim o ajuste automático não dá vantagem de graça ao jogador). No online, nada.
function tuneFor(team){if(!team||!team.id||!G||G.mp||(typeof R!=="undefined"&&R&&(R.mpHost||R.mpGuest)))return null;const mine=G.shop&&team.id===G.shop.team;const T=mine?G.shop.tune:{auto:true};if(!T)return null;
  if(T.auto){const id=(typeof W!=="undefined"&&W&&W.C&&W.C.id)||(G.calendar&&G.calendar[Math.min(G.round,G.calendar.length-1)]);return autoTune(id,team)}return T}
// engenheiro decide: simula a volta da pista com cada combinação de asa e câmbio e fica com a mais rápida;
// suspensão pelo desgaste da pista (pneu que gasta muito pede macia) e motor sempre no seguro
const AUTOT={};
function autoTune(id,team){if(!id||typeof techGeo!=="function")return{w:0,g:0,s:0,p:0};const t=team||myTeam();const key=id+":"+["eng","aero","chas","brk"].map(k=>Math.round(t.car[k]*2)).join(",");if(AUTOT[key])return AUTOT[key];
  const geo=techGeo(id),C=CIR[id];let best=null;const base=carPhys({car:t.car},null);
  for(let w=-2;w<=2;w++)for(let g=-2;g<=2;g++){const ph=tuneApply({...base},{w,g,s:0,p:0});const tm=speedProfile(geo,ph,tyreMu("M",0,.2,null),4,geo.gk).t;if(!best||tm<best.tm-1e-6)best={w,g,tm}}
  const s=C.wear>1.15?-1:C.wear<.9?1:0;return AUTOT[key]={w:best.w,g:best.g,s,p:0}}
// tempo de volta estimado com um ajuste (para mostrar a diferença para a sugestão do engenheiro)
function tuneLap(T){const id=G.calendar[Math.min(G.round,G.calendar.length-1)];if(typeof techGeo!=="function")return null;const geo=techGeo(id),t=myTeam();const ph=tuneApply(carPhys({car:t.car},null),T);return speedProfile(geo,ph,tyreMu("M",0,.2,null),4,geo.gk).t}

// ---------- tela
function shopTab(){const S=shopInit();if(!S){$("#body").innerHTML=`<div class="card" style="margin-top:12px"><p>A oficina está disponível na carreira.</p></div>`;return}
  const t=myTeam(),rec=shopRecommend(),T=S.tune;
  const area=k=>`<div class="meter"><span>${SHOP_AREAS[k]}</span>${bar(t.car[k],60,99,"#6EC1FF")}<b class="num">${Math.round(t.car[k])}${S.upB[k]?` <span class="up">+${S.upB[k].toFixed(1).replace(".",",")}</span>`:""}</b></div>`;
  const partRow=p=>{const lv=S.lv[p.id]||0,mx=lv>=SHOP_MAX,pr=mx?0:shopPrice(p,lv),can=!mx&&pr<=S.cr,isRec=rec&&rec.p.id===p.id;
    return`<div class="part${isRec?" rec":""}"><div class="pi">${p.ic}</div><div class="pt"><b>${p.n}</b>${isRec?`<span class="tagrec">Recomendado</span>`:""}<div class="muted">${p.d}</div>
      <div class="pls">${Array.from({length:SHOP_MAX},(_,i)=>`<i class="${i<lv?"on":""}"></i>`).join("")}<span class="muted">${SHOP_LV[lv]}</span></div>
      <div class="muted pfx">${Object.entries(p.fx).map(([k,v])=>`${SHOP_AREAS[k]} +${(v).toFixed(2).replace(".",",")}`).join(" · ")} por nível</div></div>
      <div class="pb">${mx?`<span class="muted">Completo</span>`:`<button class="btn sm${can&&isRec?" go":""}" data-act="shopBuy" data-k="${p.id}"${can?"":" disabled"}>${SHOP_LV[lv+1]}<br><b>${pr}</b> créditos</button>`}</div></div>`};
  const tuneRow=x=>`<div class="tune"><div class="tn"><b>${x.n}</b></div><div class="tsl"><span class="muted">${x.lo}</span><input type="range" min="-2" max="2" step="1" value="${T[x.k]||0}" data-tune="${x.k}"${T.auto?" disabled":""}><span class="muted">${x.hi}</span></div></div>`;
  const sug=autoTune(G.calendar[Math.min(G.round,G.calendar.length-1)]);const lapS=tuneLap(sug),lapM=T.auto?lapS:tuneLap(T);const dl=lapM!=null&&lapS!=null?lapM-lapS:0;
  $("#body").innerHTML=`<div class="grid2" style="margin-top:12px">
   <div style="display:flex;flex-direction:column;gap:12px">
    ${S.seen?"":`<div class="card intro"><h3>Bem-vindo à oficina</h3><p>Aqui você melhora o carro da sua equipe. Ganhe <b>créditos</b> em cada corrida (quanto melhor o resultado, mais créditos) e troque por peças.</p><p>Na dúvida, toque em <b>Instalar o recomendado</b>: a gente escolhe a peça que mais ajuda o carro agora.</p><button class="btn sm" data-act="shopSeen">Entendi</button></div>`}
    <div class="card"><h3>Créditos de oficina</h3><div class="crd"><b class="num">${S.cr}</b> créditos${S.lastEarn?`<span class="muted"> · última corrida: +${S.lastEarn}</span>`:""}</div>
     ${rec?`<p style="margin:8px 0 6px">Melhor compra agora: <b>${rec.p.ic} ${rec.p.n} · ${SHOP_LV[rec.lv+1]}</b> por ${rec.pr} créditos.</p><button class="btn go" data-act="shopBuy" data-k="${rec.p.id}"${rec.can?"":" disabled"}>${rec.can?"Instalar o recomendado":`Faltam ${rec.pr-S.cr} créditos`}</button>`:`<p>Carro no máximo. Parabéns!</p>`}
     ${S.log.length?`<p class="muted" style="font-size:12.5px;margin:8px 0 0">${esc(S.log[0].t)}</p>`:""}</div>
    <div class="card"><h3>Seu carro · ${esc(t.n)}</h3>${["eng","aero","chas","brk","susp","rel"].map(area).join("")}<p class="muted" style="font-size:12.5px;margin:6px 0 0">Comparado com a média do grid: ${["eng","aero","chas","brk"].map(k=>`${SHOP_AREAS[k].toLowerCase()} ${t.car[k]>=shopAvg(k)?"acima":"abaixo"}`).join(", ")}.</p></div>
    <div class="card"><h3>Ajustes finos</h3>
     <div class="choice"><button class="chip${T.auto?" on":""}" data-act="shopAuto" data-k="1"><b>Engenheiro decide</b><span>O melhor para cada pista, automático</span></button><button class="chip${T.auto?"":" on"}" data-act="shopAuto" data-k="0"><b>Eu ajusto</b><span>Cada ajuste ganha de um lado e perde do outro</span></button></div>
     ${SHOP_TUNE.map(tuneRow).join("")}
     <p class="muted" style="font-size:12.5px;margin:6px 0 0">${T.auto?`Para ${CIR[G.calendar[Math.min(G.round,G.calendar.length-1)]].n}, o engenheiro escolheu: asa ${sug.w>0?"mais alta":sug.w<0?"mais baixa":"no meio"}, câmbio ${sug.g>0?"mais curto":sug.g<0?"mais longo":"no meio"}, suspensão ${sug.s>0?"mais dura":sug.s<0?"mais macia":"no meio"}.`:`Volta estimada na próxima pista: ${Math.abs(dl)<.005?"igual à sugestão do engenheiro":`${dl>0?"+":"−"}${Math.abs(dl).toFixed(2).replace(".",",")} s ${dl>0?"mais lenta":"mais rápida"} que a sugestão do engenheiro`}.${T.p>0?" Motor potente: mais chance de quebra.":""}${T.s>0?" Suspensão dura: os pneus gastam mais.":""}`}</p>
     ${T.auto?"":`<button class="btn sm" data-act="shopReset">Voltar para a sugestão do engenheiro</button>`}</div>
   </div>
   <div class="card"><h3>Peças</h3><p class="muted" style="margin:0 0 8px">Cada peça tem 5 níveis. Instalou, já vale na próxima corrida para você e o seu companheiro.</p>${SHOP_PARTS.map(partRow).join("")}</div></div>`;
  document.querySelectorAll("[data-tune]").forEach(el=>el.addEventListener("change",()=>{const S=shopInit();S.tune[el.dataset.tune]=+el.value;save();shopTab()}))}
// cartão do início: créditos e a melhor compra, com atalho para a oficina
function shopCard(){const S=shopInit();if(!S)return"";const rec=shopRecommend();
  return`<div class="card"><h3>Oficina</h3><div class="crd"><b class="num">${S.cr}</b> créditos</div>${rec?`<p style="margin:6px 0">Recomendado: <b>${rec.p.ic} ${rec.p.n} · ${SHOP_LV[rec.lv+1]}</b> (${rec.pr} créditos)</p>`:""}
   <div class="row">${rec&&rec.can?`<button class="btn sm go" data-act="shopBuy" data-k="${rec.p.id}">Instalar o recomendado</button>`:""}<button class="btn sm" data-act="tab" data-k="shop">Abrir oficina</button></div></div>`}
function shopAction(a,k){if(a==="shopBuy"){shopBuy(k)}else if(a==="shopAuto"){const S=shopInit();S.tune.auto=k==="1";save()}else if(a==="shopReset"){const S=shopInit();Object.assign(S.tune,autoTune(G.calendar[Math.min(G.round,G.calendar.length-1)]),{auto:false});save()}
  else if(a==="shopSeen"){const S=shopInit();S.seen=true;save()}
  render()}
