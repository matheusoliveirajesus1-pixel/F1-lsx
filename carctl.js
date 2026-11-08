// ===================== CONTROLES DO CARRO E ASSISTÊNCIAS =====================
// Asa móvel (aerodinâmica ativa de 2026), balanço de freio, diferencial, recarga na freada e largada.
// Assistências: cada função pode ser Automática, Sugestão (o engenheiro aplica em 3 s se você não cancelar) ou Manual.
// O automático usa os atributos do seu piloto: não é melhor do que um bom jogador.
const AS_CATS=[["ers","Energia da bateria"],["aero","Asa móvel e modo de ultrapassagem"],["att","Ataque"],["def","Defesa"],["pace","Ritmo e pneus"],["brk","Balanço de freio e diferencial"],["start","Largada (embreagem)"],["box","Box e estratégia"]];
const AS_MODES=[["auto","Automático"],["sug","Sugestão"],["man","Manual"]];
const AS_PRESETS={iniciante:{ers:"auto",aero:"auto",att:"auto",def:"auto",pace:"auto",brk:"auto",start:"auto",box:"sug"},equilibrado:{ers:"auto",aero:"auto",att:"sug",def:"sug",pace:"sug",brk:"auto",start:"man",box:"sug"},piloto:{ers:"man",aero:"man",att:"man",def:"man",pace:"man",brk:"man",start:"man",box:"man"}};
function asGet(k){const a=(G&&G.settings&&G.settings.assist)||AS_PRESETS.equilibrado;return a[k]||AS_PRESETS.equilibrado[k]}
function asSet(k,v){G.settings.assist=Object.assign({},AS_PRESETS.equilibrado,G.settings.assist||{},{[k]:v});save()}
// ---------- estado dos controles de cada carro
function ccInit(c){if(c.cc)return c.cc;c.cc={bb:56,diff:0,harv:1,aeroOpen:false};return c.cc}
function bbOpt(c){const fuelK=clamp((c.fuel||60)/100,0,1);return 55.5+fuelK*1.5-(R.w>.4?1.2:0)}// mais combustível pesa atrás: freio mais para a frente
function diffOpt(){const slow=(R.geo.corners||[]).filter(k=>(k.v||99)<35).length;return slow>=5?1:slow<=2?-1:0}// muitas curvas lentas pedem mais travado
const AERO_K=.958;// asa fechada nas retas de aero: ~4% a menos de velocidade final
// ajusta a velocidade-alvo a cada passo (chamado pela física da corrida)
function ccAdj(c,v1,i){if(!R.started)return v1;const cc=ccInit(c);
  if(c.stallT){if(R.t<c.stallT)return 0;c.stallT=0}
  // ponto chato no pneu (travada forte): vibra e perde rendimento até trocar o jogo
  if(c.tyre.flat)v1*=1-c.tyre.flat*.009;
  const zone=typeof inDRS==="function"&&inDRS(fr(c.prog)),brk=R.geo.ai.ph[i]===1;
  // asa móvel: os carros da IA e o modo automático abrem nas retas marcadas; no manual, você abre
  if(c.isP&&asGet("aero")==="man"){if(cc.aeroOpen&&(brk||!zone||R.sc)){cc.aeroOpen=false}if(zone&&!cc.aeroOpen&&!R.sc)v1*=AERO_K}else cc.aeroOpen=zone&&!brk&&!R.sc;
  // balanço de freio e diferencial: longe do ideal, freia/traciona pior
  if(c.isP){const offB=Math.abs(cc.bb-bbOpt(c));if(brk&&offB>.5)v1*=1-Math.min(.03,(offB-.5)*.006);const offD=Math.abs(cc.diff-diffOpt());if(!brk&&R.geo.ai.ph[i]===2&&offD>0)v1*=1-offD*.004;
    // recarga na freada: mais bateria, mas traseira mais nervosa
    if(brk&&cc.harv>0&&(c.batt||0)<100){c.batt=Math.min(100,(c.batt||0)+cc.harv*.35*.05)}
    if(brk&&cc.bb>bbOpt(c)+1.5&&!c.tyre.flat&&rnd()<.0005*(cc.bb-bbOpt(c))){c.tyre.flat=rr(.3,.8);radio(c,"Travei a dianteira! Ponto chato no pneu, o volante está vibrando.",{k:"pneus"})}
    if(brk&&cc.harv===2&&(c.v||0)>40&&rnd()<.00012&&typeof exStart==="function")exStart(c,"spin",{why:"traseira escapou com recarga máxima na freada"})}
  return v1}
// ---------- assistências (1 vez por segundo)
function asTick(me){if(!me||!running(me)||me.pit||R.over)return;const now=R.t;const st=(R._as=R._as||{});const cc=ccInit(me);
  const act=(cat,txt,fn,cd)=>{if((st[cat]||-99)>now-(cd||12))return;st[cat]=now;const m=asGet(cat);if(m==="man")return;if(m==="auto"){fn();radio(me,`Automático: ${txt}`,{me:0})}
    else if(typeof TIPS!=="undefined"&&!TIPS.cur){TIPS.cur={k:"as_"+cat,txt:`${txt} (aplico em 3 s se você não cancelar)`,btn:[["Aplicar agora","__as",cat],["Cancelar","__no",cat]],until:R.t+6,autoAt:R.t+3,fn};if(typeof tipsRender==="function")tipsRender()}};
  // largada automática: reage pelas luzes com o tempo do atributo Largada
  if(me.hold&&asGet("start")==="auto"&&isFinite(R.go)&&R.t>=R.go){const rt=.2+(100-sk(me,"start"))*.003;if(R.t>=R.go+rt){releasePlayer(me,rt+.08);radio(me,"Automático: largada feita pela embreagem automática.",{me:0})}}
  if(!R.started)return;
  // energia
  const A=R.order[pos(me)-2],B=R.order[pos(me)];const gA=A?(A.prog-me.prog)*me.L:9,gB=B?(me.prog-B.prog)*me.L:9;
  if(me.ers!=="attack"&&me.ovMode&&me.batt>30&&gA<.8)act("ers","ataque com bateria cheia: Boost",()=>uiAct("ers","attack"),10);
  else if(me.ers==="attack"&&(gA>1.4||me.batt<12))act("ers","Boost desligado para guardar bateria",()=>uiAct("ers","auto"),10);
  else if(me.batt<8&&me.ers!=="save"&&!R.sc)act("ers","bateria quase vazia: recarregando",()=>uiAct("ers","save"),20);
  else if(me.ers==="save"&&me.batt>45)act("ers","bateria recarregada: energia no automático",()=>uiAct("ers","auto"),20);
  // ataque e defesa
  if(A&&gA<.55&&me.ovMode&&me.batt>25&&!me.att&&!R.sc&&!me.goReq)act("att",`bote em ${A.code} na próxima reta`,()=>uiAct("go"),15);
  if(B&&gB<.5&&!R.sc&&!me.coverY&&B.ovMode)act("def",`${B.code} colou: segurando a posição`,()=>uiAct("def"),18);
  // ritmo
  const left=R.L-me.lap;if(R.sc&&me.mode==="attack")act("pace","ritmo normal atrás do safety car",()=>uiAct("mode","normal"),20);
  else if(!R.sc&&me.mode!=="attack"&&gA<1.1&&me.tyre.wear<.55&&left>1)act("pace","ritmo de ataque para chegar no carro da frente",()=>uiAct("mode","attack"),25);
  else if(!R.sc&&me.mode==="attack"&&me.tyre.wear>.62&&left>4)act("pace","pneus gastos: ritmo normal",()=>uiAct("mode","normal"),25);
  // freio e diferencial
  const ob=Math.round(bbOpt(me)*2)/2;if(Math.abs(cc.bb-ob)>=.5)act("brk",`balanço de freio para ${ob.toFixed(1).replace(".",",")}%`,()=>{cc.bb=ob},20);
  const od=diffOpt();if(cc.diff!==od)act("brk",`diferencial em ${DIFF_N[od+2]}`,()=>{cc.diff=od},30);
  // box: responde as perguntas do engenheiro sozinho
  if(R.ask&&R.ask.c===me&&asGet("box")==="auto"&&R.t-R.ask.t0>2){const a=R.ask;answerAsk(a.def,true);radio(me,"Automático: decisão de estratégia tomada com a equipe.",{me:0})}}
(function(){if(typeof tipsTick!=="function")return;const base=tipsTick;globalThis.tipsTick=function(){const me=typeof meCar==="function"?meCar():null;
    if(typeof TIPS!=="undefined"&&TIPS.cur&&TIPS.cur.autoAt&&R&&R.t>=TIPS.cur.autoAt){const f=TIPS.cur.fn;TIPS.cur=null;try{f&&f()}catch(e){}}
    if(R&&!R.spect&&me&&(!R._asT||R.t>=R._asT||me.hold)){R._asT=R.t+1;try{asTick(me)}catch(e){console.warn("assist",e)}}base()}})();
(function(){if(typeof tipApply!=="function")return;const base=tipApply;globalThis.tipApply=function(i){const t=TIPS.cur;if(t&&t.fn){const b=t.btn[+i];TIPS.cur=null;if(b&&b[1]==="__as")t.fn();tipsRender();return}return base(i)}})();
// ---------- botões na corrida
const DIFF_N=["bem aberto","aberto","neutro","travado","bem travado"],HARV_N=["baixa","normal","máxima"];
function ccCard(){return`<h3>Carro</h3><div class="ccgrid">
  <button class="btn sm" data-act="ccAero" id="ccA">Asa: automática</button>
  <div class="ccrow"><span class="muted">Freio</span><button class="btn sm" data-act="ccBB" data-k="-1" aria-label="freio mais para trás">−</button><b class="num" id="ccB">56,0%</b><button class="btn sm" data-act="ccBB" data-k="1" aria-label="freio mais para a frente">+</button></div>
  <div class="ccrow"><span class="muted">Diferencial</span><button class="btn sm" data-act="ccDf" data-k="-1">−</button><b id="ccD">neutro</b><button class="btn sm" data-act="ccDf" data-k="1">+</button></div>
  <div class="ccrow"><span class="muted">Recarga na freada</span><div class="seg">${HARV_N.map((n,i)=>`<button data-act="ccHv" data-k="${i}" id="cch_${i}">${n}</button>`).join("")}</div></div>
  <button class="btn sm" data-act="ccAs">Assistências</button></div>`}
function ccAction(a,k){const me=R&&R.cars.find(c=>c.isP);if(!me&&a!=="ccAs")return;const cc=me?ccInit(me):null;
  if(a==="ccAero"){if(asGet("aero")!=="man"){asSet("aero","man");radio(me,"Asa móvel no manual: abra nas retas marcadas (tecla A).",{me:1})}else{const z=inDRS(fr(me.prog));if(z&&!R.sc){cc.aeroOpen=!cc.aeroOpen}else radio(me,R.sc?"Com safety car a asa fica fechada.":"A asa só abre nas retas marcadas como AERO.",{me:1})}}
  if(a==="ccBB"){cc.bb=clamp(cc.bb+(+k)*.5,50,62);if(asGet("brk")==="auto")asSet("brk","sug")}
  if(a==="ccDf"){cc.diff=clamp(cc.diff+(+k),-2,2);if(asGet("brk")==="auto")asSet("brk","sug")}
  if(a==="ccHv"){cc.harv=clamp(+k,0,2)}
  if(a==="ccAs")return asModal();ccRefresh()}
function ccRefresh(){const me=R&&R.cars.find(c=>c.isP);if(!me)return;const cc=ccInit(me);const b=$("#ccA");if(b){const man=asGet("aero")==="man";const z=inDRS(fr(me.prog))&&!R.sc;
    const t=man?(cc.aeroOpen?"Asa: ABERTA":z?"Asa: ABRIR AGORA":"Asa: fechada"):(cc.aeroOpen?"Asa: aberta (auto)":"Asa: automática");if(b.textContent!==t)b.textContent=t;b.classList.toggle("go",man&&z&&!cc.aeroOpen);b.classList.toggle("on",cc.aeroOpen)}
  const B=$("#ccB");if(B){const t=cc.bb.toFixed(1).replace(".",",")+"%";if(B.textContent!==t)B.textContent=t;B.title=`ideal agora: ${bbOpt(me).toFixed(1)}%`}const D=$("#ccD");if(D)D.textContent=DIFF_N[cc.diff+2];
  for(let i=0;i<3;i++){const h=$("#cch_"+i);if(h)h.classList.toggle("on",cc.harv===i)}}
function asModal(){const seg=(k)=>`<div class="seg">${AS_MODES.map(([v,n])=>`<button data-act="ccAsSet" data-k="${k}:${v}" class="${asGet(k)===v?"on":""}">${n}</button>`).join("")}</div>`;
  modal(`<h2>Assistências</h2><p class="muted" style="font-size:13.5px">Automático: o carro e a equipe fazem. Sugestão: o engenheiro avisa e aplica em 3 s se você não cancelar. Manual: só você. O automático segue os atributos do seu piloto.</p>
   <div class="row" style="margin:8px 0">${Object.keys(AS_PRESETS).map(p=>`<button class="btn sm" data-act="ccAsP" data-k="${p}">${p[0].toUpperCase()+p.slice(1)}</button>`).join("")}</div>
   <div class="asg">${AS_CATS.map(([k,n])=>`<div class="asr"><b>${n}</b>${seg(k)}</div>`).join("")}</div><div class="row" style="margin-top:10px"><button class="btn go sm" data-act="closeModal">Pronto</button></div>`)}
function ccAction2(a,k){if(a==="ccAsSet"){const[c,v]=String(k).split(":");if(AS_MODES.some(x=>x[0]===v)&&AS_CATS.some(x=>x[0]===c))asSet(c,v);return asModal()}if(a==="ccAsP"&&AS_PRESETS[k]){G.settings.assist=Object.assign({},AS_PRESETS[k]);save();return asModal()}}
if(typeof document!=="undefined")document.addEventListener("keydown",e=>{if((e.key==="a"||e.key==="A")&&R&&!R.over&&UI.scr==="race"&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||"")){ccAction("ccAero")}});
// largada: às vezes um carro da IA apaga o motor no grid
function ccStartStalls(){for(const c of R.cars){if(c.isP||!running(c))continue;if(rnd()<.004){c.stallT=R.t+rr(6,11);rcMsg(`${c.code} apagou o motor na largada! Perde várias posições.`,"warn","largada")}}}
