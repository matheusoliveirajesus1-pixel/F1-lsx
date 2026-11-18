// ===================== VOLANTE: VOCÊ GUIA O SEU CARRO =====================
// Botão "Pilotar" na corrida e na classificação: o seu carro passa a obedecer ao acelerador, ao freio e ao volante
// (teclado, controle ou toque na tela). Solte a qualquer momento e o piloto da equipe continua de onde você parou.
// A física é a mesma de todos os carros (dyn.js): pneus, aderência, travadas, rodadas, muro e danos. O que muda é quem
// pede: em vez da IA escolher velocidade e trajetória, os pedais e o volante vão direto para os pneus.
// Ajudas (escolha no botão "Ajudas"):
//   direção  alta: o carro já acompanha a curva da pista, você corrige; média: contra-esterça sozinho quando a traseira
//            escapa; nenhuma: tudo com você
//   freio    automático: freia o que a curva pede (você só acelera e vira); ABS: não trava; nenhum: pedal cheio devagar trava
//   tração   alta / média / desligada (desligada: pisar fundo na saída patina e solta a traseira)
//   linha    completa / só nas curvas / desligada (verde = acelere, amarelo = alivie, vermelho = freie)
// Piloto automático assume sozinho: safety car e VSC, bandeira vermelha, relargada, entrada, parada e saída do box
// (o box continua sendo pedido pelo rádio). No modo online, só a IA guia.
const VOL={on:false,inp:{thr:0,brk:0,str:0,re:0},k:{},gp:null,gpPrev:[],src:"teclado",motivo:"",aj:null,toque:false,
  tq:{str:0,thr:0,brk:0,dirId:null,x0:0},reT:0,thrPrev:0,vivoT:0,lastT:0,cfg:false};
const VOL_AJ0={dir:"alta",fr:"abs",tc:"alta",linha:"completa",cam:"chase"};// começo amigável: o jogador sobe a dificuldade em "Ajudas"
const VOL_CAMS=[["chase","Atrás do carro"],["onboard","T-cam"],["topo","De cima"],["iso","Isométrica"]];
const VOL_OPC={dir:[["alta","Alta"],["media","Média"],["nenhuma","Nenhuma"]],fr:[["auto","Automático"],["abs","ABS"],["nenhum","Nenhum"]],
  tc:[["alta","Alta"],["media","Média"],["nenhuma","Desligada"]],linha:[["completa","Completa"],["curvas","Só nas curvas"],["nenhuma","Desligada"]]};
function volAj(){if(!VOL.aj){const p=(typeof PREFS!=="undefined"&&PREFS&&PREFS.vol)||{};VOL.aj=Object.assign({},VOL_AJ0,p)}return VOL.aj}
function volSalva(){if(typeof PREFS!=="undefined"&&PREFS){PREFS.vol=Object.assign({},VOL.aj);if(typeof prefsSave==="function")prefsSave()}}
function volMe(){return typeof R!=="undefined"&&R&&R.cars?R.cars.find(c=>c.isP):null}
function volTela(){return typeof W!=="undefined"&&W&&W.step==="race"&&typeof R!=="undefined"&&R&&!!document.getElementById("rc")}
// o jogador está no comando agora? devolve "" ou o motivo do piloto automático
function volMotivo(c){if(!c||c.status!=="run")return"Carro fora da corrida";if(R.mp)return"Online: só a IA guia";if(R.fastSim)return"Simulando";
  if(R.form&&R.form.phase==="out")return"Volta de apresentação";if(!R.started||c.hold)return"Largada: acelere quando as luzes apagarem";
  if(c.pit)return R.qMode?"Box":"Pit lane";if(c.pitCall&&typeof pitDist==="function"&&pitDist(c)<450)return"Entrando no box";if(c.pitExit!=null&&R.t-c.pitExit<2.5)return"Saindo do box";
  if(R.sc)return R.sc.type==="vsc"?"Safety car virtual":"Safety car";if(R.red)return"Bandeira vermelha";if(R.rs&&c.rsSlot!=null)return"Relargada";return""}
// chamado pela corrida a cada passo da física, para o seu carro
function volCmd(c){const ok=VOL.on&&performance.now()-VOL.vivoT<600;/* sem tela desenhando (aba escondida, teste), a IA guia */
  if(!ok){c.man=false;return null}const why=volMotivo(c);VOL.motivo=why;if(why){c.man=false;return null}c.man=true;const a=volAj(),I=VOL.inp;
  const parado=c.stallT&&R.t<c.stallT;const o={thr:parado?0:I.thr,brk:I.brk,str:I.str,re:I.re,dir:a.dir,fr:a.fr,tc:a.tc};
  // direção assistida alta: o volante desloca o carro em relação à linha ideal (para ultrapassar, defender, desviar); sem volante, ele volta para a linha devagar
  if(a.dir==="alta"){const N=R.geo.N,i=Math.floor(fr(c.prog)*N)%N,ln=R.geo.line[i]*(c.lineK||1),dt=typeof SIM_DT==="number"?SIM_DT:.05;let f=VOL.off||0;
    if(Math.abs(I.str)>.05)f+=I.str*7*dt;else f-=Math.sign(f)*Math.min(Math.abs(f),1.2*dt);f=clamp(f,-TRK_H-ln,TRK_H-ln);if(c.ex)f=(c.y||0)-ln;VOL.off=f;o.auto=true;o.yT=ln+f}else VOL.off=(c.y||0)-R.geo.line[Math.floor(fr(c.prog)*R.geo.N)%R.geo.N]*(c.lineK||1);return o}
function volDirigindo(){if(!VOL.on||!volTela())return false;const me=volMe();return!!me&&!R.mp&&!R.spect&&!R.over&&me.status==="run"}
// câmera 2D (isométrica) e foco do resto da tela: sempre o seu carro
function volFoco(dt,cw,ch){if(!volDirigindo())return null;const me=volMe();shotChase(dt,cw,ch,me);if(typeof camShake==="function")camShake(dt,me);return me}
// câmera 3D para o desenho principal
function volCena(){const a=volAj();if(a.cam==="iso"||typeof P3D==="undefined"||!P3D||!P3D.on)return undefined;const me=volMe();return me?{cam3d:{tipo:a.cam,id:me.id,chave:"vol"}}:undefined}
// ---------- linha ideal: pontos no chão à frente do carro, coloridos pela velocidade que a curva pede
function volLinha(add,m){if(!volDirigindo()||!R.started)return;const a=volAj();if(a.linha==="nenhuma")return;const c=volMe();if(!c||!c.prof||c.pit)return;
  const N=R.geo.N,L=R.geo.len,v=c.v||0,lk=c.lineK||1,f0=fr(c.prog);
  for(let d=5;d<=170;d+=2.5){const pr=f0+d/L,x=fr(pr)*N,ix=Math.floor(x)%N,ix2=(ix+1)%N,t=x-Math.floor(x);const vt=c.prof.v[ix]+(c.prof.v[ix2]-c.prof.v[ix])*t;
    // quanto falta para chegar à velocidade da curva freando forte (freada de ~4,5 g)
    const dv=v-vt,need=dv>0?(v*v-vt*vt)/(2*44):-1;let r,g,b,al=.9;
    if(dv>2&&need>=d-12){r=1;g=.2;b=.15}else if(dv>-3){r=1;g=.82;b=.15}else{r=.2;g=.9;b=.4;al=.75}
    if(a.linha==="curvas"&&r===.2&&!(vt<v+25&&(R.geo.ai.ph[ix]!==0)))continue;
    const lat=(R.geo.line[ix]+(R.geo.line[ix2]-R.geo.line[ix])*t)*lk,p=trackPos(pr,lat*WS);const z=(P3D.zAt?P3D.zAt(pr):(P3D.H?P3D.H(p.x,p.y):0))+.22*m;
    add(p.x,p.y,z,(a.cam==="topo"?1.5:.45)*m,r,g,b,al)}}
// ---------- entradas: teclado, controle e toque
const VOL_TECLAS={ArrowUp:"thr",KeyW:"thr",ArrowDown:"brk",KeyS:"brk",ArrowLeft:"esq",KeyA:"esq",ArrowRight:"dir",KeyD:"dir"};
function volDigitando(e){return e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)}
addEventListener("keydown",e=>{if(!volTela()||volDigitando(e))return;
  if(e.code==="KeyV"&&!e.repeat){e.preventDefault();volToggle();return}
  if(!VOL.on)return;if(e.code==="KeyC"&&!e.repeat){e.preventDefault();volCamProx();return}
  const k=VOL_TECLAS[e.code];if(k){e.preventDefault();VOL.k[k]=true;VOL.src="teclado"}},true);
addEventListener("keyup",e=>{const k=VOL_TECLAS[e.code];if(k)VOL.k[k]=false});
addEventListener("blur",()=>{VOL.k={}});
function volPad(){let ps=null;try{ps=navigator.getGamepads?navigator.getGamepads():null}catch(e){ps=null}if(!ps)return null;for(const p of ps)if(p&&p.connected)return p;return null}
function volCurva(x,dz){const a=Math.abs(x);if(a<dz)return 0;return Math.sign(x)*Math.pow((a-dz)/(1-dz),1.5)}
function volEntrada(dt){const I=VOL.inp,K=VOL.k,me=volMe();let thr=0,brk=0,str=null;
  // teclado: tecla vira pedal e volante com rampa (sem tranco); o volante volta ao centro sozinho, mais rápido do que vai
  {const alvo=(K.esq?1:0)-(K.dir?1:0),v=me?me.v||0:0,ida=clamp(3.6-v*.02,1.8,3.6);let s=VOL.kStr||0;const rt=alvo===0||Math.sign(alvo)!==Math.sign(s)?6:ida;s+=clamp(alvo-s,-rt*dt,rt*dt);VOL.kStr=s;
    VOL.kThr=clamp((VOL.kThr||0)+(K.thr?6:-9)*dt,0,1);VOL.kBrk=clamp((VOL.kBrk||0)+(K.brk?7:-11)*dt,0,1);thr=VOL.kThr;brk=VOL.kBrk;if(Math.abs(s)>.001)str=s}
  // controle: gatilho direito acelera, esquerdo freia, analógico esquerdo vira; A/X também servem de pedal; Y troca a câmera; View/Back solta o volante
  const p=volPad();if(p){const b=i=>p.buttons[i]?(typeof p.buttons[i]==="object"?p.buttons[i].value||(p.buttons[i].pressed?1:0):p.buttons[i]):0;
    const gt=Math.max(b(7),b(0)),gb=Math.max(b(6),b(2)),gs=-volCurva(p.axes[0]||0,.1);if(gt>.02||gb>.02||Math.abs(gs)>0)VOL.src="controle";thr=Math.max(thr,gt);brk=Math.max(brk,gb);if(gs)str=gs;
    const pr=VOL.gpPrev,on=i=>b(i)>.5&&!(pr[i]>.5);if(on(8))volToggle();if(VOL.on&&on(3))volCamProx();VOL.gpPrev=p.buttons.map((x,i)=>b(i))}
  // toque
  if(VOL.toque){const T=VOL.tq;thr=Math.max(thr,T.thr);brk=Math.max(brk,T.brk);if(T.dirId!=null)str=T.str}
  I.thr=thr;I.brk=brk;I.str=str==null?0:clamp(str,-1,1);
  // ré: freio segurado com o carro parado por quase meio segundo
  if(me&&brk>.6&&thr<.1&&(me.v||0)<.5){VOL.reT+=dt;I.re=VOL.reT>.45?1:0}else{VOL.reT=0;I.re=0}
  // largada: acelerar quando as luzes apagam (acelerar durante as luzes é queimar a largada)
  if(me&&R.form&&R.form.phase==="lights"&&!R.autoStart&&thr>.5&&VOL.thrPrev<=.5&&typeof tapLaunch==="function")tapLaunch();VOL.thrPrev=thr}
// toque na tela: metade esquerda é o volante (arraste para os lados), à direita os pedais
function volToqueLiga(el){if(!el||el._vol)return;el._vol=1;const T=VOL.tq;
  const dz=el.querySelector(".vt-dir"),kn=el.querySelector(".vt-kn");
  dz.addEventListener("pointerdown",e=>{e.preventDefault();T.dirId=e.pointerId;T.x0=e.clientX;T.str=0;try{dz.setPointerCapture(e.pointerId)}catch(_){}VOL.src="toque"});
  dz.addEventListener("pointermove",e=>{if(e.pointerId!==T.dirId)return;const w=Math.max(60,dz.clientWidth*.32);T.str=clamp(-(e.clientX-T.x0)/w,-1,1);if(kn)kn.style.transform=`translateX(${(-T.str*42).toFixed(1)}px)`});
  const solta=e=>{if(e.pointerId!==T.dirId)return;T.dirId=null;T.str=0;if(kn)kn.style.transform=""};dz.addEventListener("pointerup",solta);dz.addEventListener("pointercancel",solta);
  for(const [sel,k] of [[".vt-ac","thr"],[".vt-fr","brk"]]){const b=el.querySelector(sel);if(!b)continue;
    b.addEventListener("pointerdown",e=>{e.preventDefault();T[k]=1;b.classList.add("on");try{b.setPointerCapture(e.pointerId)}catch(_){}VOL.src="toque"});
    const up=()=>{T[k]=0;b.classList.remove("on")};b.addEventListener("pointerup",up);b.addEventListener("pointercancel",up);b.addEventListener("lostpointercapture",up)}
  el.addEventListener("contextmenu",e=>e.preventDefault())}
addEventListener("pointerdown",e=>{if(e.pointerType==="touch"&&!VOL.toque){VOL.toque=true;volPinta()}},true);
try{if(matchMedia("(pointer:coarse)").matches)VOL.toque=true}catch(e){}
// ---------- liga e desliga
function volToggle(){if(!volTela())return;const me=volMe();if(!me||R.mp||R.spect)return;VOL.on=!VOL.on;VOL.k={};VOL.cfg=false;
  if(VOL.on){if(typeof UI!=="undefined"&&UI.speed!==1){UI.speed=1;document.querySelectorAll("#qSpd button").forEach(x=>x.classList.toggle("on",+x.dataset.k===1))}
    if(typeof radio==="function"&&R.started)radio(me,`${G.engineer||"Engenheiro"}: "Com você. ${volAj().fr==="auto"?"Freio automático ligado.":"Cuidado com as freadas."}"`,{me:1})}
  else{me.man=false;if(typeof radio==="function"&&R.started)radio(me,`${G.engineer||"Engenheiro"}: "Piloto automático. O carro é da equipe de novo."`,{me:1})}volPinta()}
function volCamProx(){const a=volAj();const lst=VOL_CAMS.filter(([k])=>k==="iso"||(typeof P3D!=="undefined"&&P3D&&P3D.on));const i=lst.findIndex(([k])=>k===a.cam);a.cam=lst[(i+1)%lst.length][0];volSalva();volPinta()}
// ---------- tela: botões, painel de ajudas, pedais e volante na tela
function volBotoes(){if(typeof R!=="undefined"&&R&&R.mp)return"";return`<button class="btn sm${VOL.on?" on":""}" data-vol="toggle" id="volBtn" aria-pressed="${VOL.on}">${VOL.on?"🤖 Devolver ao piloto":"🎮 Pilotar"}</button><button class="btn sm" data-vol="cfg" id="volCfgBtn">Ajudas</button>`}
function volHudHtml(){return`<div class="volhud" id="volHud" hidden><div class="vh-st" id="volSt"></div><div class="vh-row"><div class="vh-ped"><i class="b" id="volB"></i></div><div class="vh-dir"><i id="volS"></i></div><div class="vh-ped"><i class="a" id="volA"></i></div></div><div class="vh-k" id="volK"></div></div>
  <div class="voltq" id="volTq" hidden><div class="vt-dir"><div class="vt-trilho"><div class="vt-kn"></div></div><span>arraste para virar</span></div><div class="vt-ped"><button class="vt-fr" type="button">FREIO</button><button class="vt-ac" type="button">ACELERA</button></div></div>
  <div class="volcfg" id="volCfg" hidden></div>`}
function volCfgHtml(){const a=volAj();const seg=(k,t,o)=>`<div class="vc-l"><span>${t}</span><div class="vc-seg" role="group" aria-label="${t}">${o.map(([v,n])=>`<button type="button" data-vol="aj:${k}:${v}" class="${a[k]===v?"on":""}">${n}</button>`).join("")}</div></div>`;
  const cams=VOL_CAMS.filter(([k])=>k==="iso"||(typeof P3D!=="undefined"&&P3D&&P3D.on));
  return`<div class="vc-h"><b>Pilotagem: ajudas</b><button type="button" data-vol="fechar" aria-label="Fechar">✕</button></div>
   ${seg("dir","Direção",VOL_OPC.dir)}${seg("fr","Freio",VOL_OPC.fr)}${seg("tc","Controle de tração",VOL_OPC.tc)}${seg("linha","Linha ideal",VOL_OPC.linha)}${seg("cam","Câmera",cams)}
   <p class="vc-p"><b>Teclado:</b> ↑/W acelera, ↓/S freia, ←/→ ou A/D viram, C troca a câmera, V pega ou solta o volante. Freio segurado com o carro parado engata a ré.<br>
   <b>Controle:</b> gatilho direito acelera, esquerdo freia, analógico esquerdo vira, Y troca a câmera, View/Back solta o volante.<br>
   <b>Celular:</b> arraste no lado esquerdo da tela para virar; FREIO e ACELERA à direita.<br>
   Box, safety car, bandeira vermelha e relargada: o piloto automático assume e devolve depois. O box continua sendo pedido pelo rádio.</p>`}
function volPinta(){const b=document.getElementById("volBtn");if(b){b.classList.toggle("on",VOL.on);b.setAttribute("aria-pressed",VOL.on);b.textContent=VOL.on?"🤖 Devolver ao piloto":"🎮 Pilotar"}
  const h=document.getElementById("volHud");if(h)h.hidden=!VOL.on;const t=document.getElementById("volTq");if(t){t.hidden=!(VOL.on&&VOL.toque&&volDirigindo());volToqueLiga(t)}
  const c=document.getElementById("volCfg");if(c){c.hidden=!VOL.cfg;if(VOL.cfg)c.innerHTML=volCfgHtml()}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-vol]");if(!b)return;e.preventDefault();e.stopPropagation();const a=b.dataset.vol;
  if(a==="toggle")volToggle();else if(a==="cfg"){VOL.cfg=!VOL.cfg;volPinta()}else if(a==="fechar"){VOL.cfg=false;volPinta()}
  else if(a.startsWith("aj:")){const[,k,v]=a.split(":");volAj()[k]=v;volSalva();volPinta()}},true);
// painel do volante: estado, pedais e volante
function volHud(){const h=document.getElementById("volHud");if(!h||h.hidden)return;const I=VOL.inp,a=volAj(),me=volMe();
  const st=document.getElementById("volSt");const mot=me?volMotivo(me):"";const dir=!mot&&me&&me.man;const curto=typeof innerWidth==="number"&&innerWidth<600;const txt=curto?(dir?"🎮 Você guia":`🤖 ${mot?mot.split(":")[0]:"Automático"}`):dir?`🎮 Você guia · ${(VOL_CAMS.find(x=>x[0]===a.cam)||[0,""])[1]}`:`🤖 Piloto automático${mot?": "+mot:""}`;
  if(st&&st.textContent!==txt){st.textContent=txt;st.classList.toggle("auto",!dir)}
  const A=document.getElementById("volA"),B=document.getElementById("volB"),S=document.getElementById("volS");if(A)A.style.height=(I.thr*100).toFixed(0)+"%";if(B)B.style.height=(I.brk*100).toFixed(0)+"%";
  if(S){const x=-I.str;S.style.left=(50+Math.min(0,x)*50).toFixed(1)+"%";S.style.width=(Math.abs(x)*50).toFixed(1)+"%"}
  const k=document.getElementById("volK");if(k){const aj=[a.fr==="auto"?"freio automático":a.fr==="abs"?"ABS":"sem ABS",a.tc==="nenhuma"?"sem tração":"tração "+(a.tc==="alta"?"alta":"média"),a.dir==="alta"?"direção assistida":a.dir==="media"?"contra-esterço":"direção livre"].join(" · ");
    const s=(VOL.src==="controle"?"Controle":VOL.src==="toque"?"Toque":"Teclado")+" · "+aj+(I.re?" · RÉ":"");if(k.textContent!==s)k.textContent=s}
  const t=document.getElementById("volTq");if(t){const vis=VOL.on&&VOL.toque&&volDirigindo();if(t.hidden===vis){t.hidden=!vis;volToqueLiga(t)}document.body.classList.toggle("voltq-on",vis)}}
// laço próprio: lê as entradas a cada quadro (a física lê o último valor a cada passo)
(function volLoop(now){try{const dt=Math.min(.1,Math.max(0,((now||0)-VOL.lastT)/1000));VOL.lastT=now||0;
  if(volTela()){if(VOL.on&&!(typeof UI!=="undefined"&&UI.paused))VOL.vivoT=performance.now();volEntrada(dt);volHud();if(typeof P3D!=="undefined"&&P3D&&P3D.extraPts!==volLinha)P3D.extraPts=volLinha;
    if(VOL.on&&typeof UI!=="undefined"&&UI.speed!==1&&volDirigindo()){UI.speed=1;document.querySelectorAll("#qSpd button").forEach(x=>x.classList.toggle("on",+x.dataset.k===1))}}
  else if(VOL.on&&!(typeof R!=="undefined"&&R&&!R.over)){VOL.on=false}}catch(e){if(!VOL.erro){VOL.erro=String(e&&e.message||e);console.error("volante:",e)}}
  if(typeof requestAnimationFrame==="function")requestAnimationFrame(volLoop)})(0);
// estilos
(function(){if(typeof document==="undefined"||!document.head)return;const s=document.createElement("style");s.textContent=`
.volhud{position:absolute;left:50%;bottom:58px;transform:translateX(-50%);z-index:12;background:#0B0D12E6;color:#ECEEF1;border-radius:10px;padding:6px 10px 7px;display:grid;gap:5px;justify-items:center;pointer-events:none;font:600 12px/1.2 "Titillium Web",system-ui,sans-serif;min-width:230px;box-shadow:0 6px 18px #0006}
.volhud .vh-st{font-weight:800;letter-spacing:.04em;text-transform:uppercase;font-size:12px;color:#7CE38B}.volhud .vh-st.auto{color:#FFD27A}
.volhud .vh-row{display:flex;align-items:flex-end;gap:8px}.volhud .vh-ped{width:10px;height:30px;background:#ffffff18;border-radius:3px;position:relative;overflow:hidden}
.volhud .vh-ped i{position:absolute;left:0;right:0;bottom:0;height:0}.volhud .vh-ped i.a{background:#3DDC6A}.volhud .vh-ped i.b{background:#FF4B4B}
.volhud .vh-dir{width:150px;height:8px;background:#ffffff18;border-radius:4px;position:relative;margin-bottom:11px}.volhud .vh-dir::after{content:"";position:absolute;left:50%;top:-3px;width:2px;height:14px;background:#ffffff70}
.volhud .vh-dir i{position:absolute;top:0;bottom:0;background:#4DA3FF;border-radius:4px}.volhud .vh-k{font-weight:600;font-size:11px;color:#AAB2BD}
.voltq{position:absolute;inset:auto 0 0 0;height:46%;z-index:13;display:flex;justify-content:space-between;align-items:flex-end;padding:0 max(10px,env(safe-area-inset-right,0px)) 10px max(10px,env(safe-area-inset-left,0px));pointer-events:none}
.voltq .vt-dir{pointer-events:auto;touch-action:none;width:44%;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;padding-bottom:6px;color:#ffffffa0;font:600 11px "Titillium Web",sans-serif;user-select:none;-webkit-user-select:none}
.voltq .vt-trilho{width:140px;height:44px;border-radius:22px;background:#0B0D1299;border:1px solid #ffffff30;display:grid;place-items:center}.voltq .vt-kn{width:40px;height:40px;border-radius:50%;background:#4DA3FFCC;border:2px solid #fff;transition:transform .05s linear}
.voltq .vt-ped{pointer-events:auto;touch-action:none;display:flex;gap:10px;align-items:flex-end}
.voltq button{touch-action:none;user-select:none;-webkit-user-select:none;border:2px solid #ffffff60;color:#fff;font:800 13px "Titillium Web",sans-serif;letter-spacing:.06em;border-radius:14px;width:84px;height:96px}
.voltq .vt-fr{background:#C2282899}.voltq .vt-ac{background:#1E9E4A99;height:120px}.voltq button.on{filter:brightness(1.5);border-color:#fff}
.volcfg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;width:min(460px,calc(100% - 24px));max-height:calc(100% - 24px);overflow:auto;background:#0E1117F5;color:#ECEEF1;border:1px solid #ffffff22;border-radius:12px;padding:12px 14px;display:grid;gap:8px;box-shadow:0 12px 32px #000a;font:500 13px/1.35 "Titillium Web",system-ui,sans-serif}
.volcfg .vc-h{display:flex;justify-content:space-between;align-items:center}.volcfg .vc-h b{font-size:15px;letter-spacing:.03em}.volcfg .vc-h button{background:none;border:0;color:#AAB2BD;font-size:18px;cursor:pointer;min-width:36px;min-height:36px}
.volcfg .vc-l{display:grid;gap:4px}.volcfg .vc-l>span{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#AAB2BD;font-weight:700}
.volcfg .vc-seg{display:flex;flex-wrap:wrap;gap:4px}.volcfg .vc-seg button{flex:1 1 auto;min-height:34px;padding:5px 10px;border-radius:8px;border:1px solid #ffffff22;background:#1A1F27;color:#ECEEF1;font:600 13px "Titillium Web",sans-serif;cursor:pointer}
.volcfg .vc-seg button.on{background:#3A2A0A;border-color:#F5A524;color:#FFD27A}.volcfg .vc-p{margin:2px 0 0;font-size:12px;color:#AAB2BD}.volcfg .vc-p b{color:#ECEEF1}
body.voltq-on .h-car,body.voltq-on .h-map{display:none!important}
@media (max-width:600px){.volhud{bottom:auto;top:6px;min-width:0;max-width:34%;padding:3px 8px;border-radius:8px}.volhud .vh-st{font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.volhud .vh-row,.volhud .vh-k{display:none}}`;document.head.appendChild(s)})();
