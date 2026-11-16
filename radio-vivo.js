// ===================== RÁDIO VIVO =====================
// 1) O seu piloto nunca fala sozinho: quando acontece algo (ganhou/perdeu posição, toque, box lento...), o rádio oferece
//    respostas rápidas por alguns segundos. Se você não escolher, ele fica calado. O que você escolhe vira fato na memória.
// 2) Um botão "Rádio" na corrida abre tudo o que você pode falar ou perguntar à equipe.
// 3) Os outros pilotos seguem a mesma lógica: falam conforme o temperamento, a situação e a relação com você,
//    perguntam à própria equipe, e a TV decide o que vai ao ar. O que envolve você (ou o seu rival e o seu companheiro)
//    entra na memória e pode virar pergunta, manchete ou post.
(function(GL){
if(typeof window==="undefined"||typeof document==="undefined"||!document.head||!document.body||typeof document.head.appendChild!=="function"||typeof requestAnimationFrame!=="function")return;
const rnd=()=>Math.random(),pk=a=>a[Math.floor(rnd()*a.length)];
const PALAVRAO=/porra|merda|caralho|idiota|\*{3,}/i;
const AUTO=new Set(["me_ack","q_me_ack"]);// confirmações das suas próprias ordens continuam automáticas
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function eu(){return typeof R!=="undefined"&&R&&R.cars?R.cars.find(c=>c.isP):null}
function gp(){try{return CIR[G.calendar[Math.min(G.round,G.calendar.length-1)]].gp}catch(e){return""}}
function carroCod(code){return R.cars.find(c=>c.code===code)}
function noAr(c){const me=eu();if(!me)return false;const i=R.order.indexOf(me),j=R.order.indexOf(c);return Math.abs(i-j)<=1}
// ---------- 1. respostas rápidas do seu piloto
// família de fato conforme a situação e o tom escolhido
const CONFLITO=new Set(["me_lost","me_door","me_contact","me_pen","me_blueAnnoy","me_traffic","me_defend","q_me_impeded","q_me_traffic"]);
const EQUIPE=new Set(["me_slowPit","me_dmg","me_tyre","me_heat","q_me_meh","q_me_elim","me_bad"]);
const FESTA=new Set(["me_win","me_podium","me_points","me_lead","q_me_pole","q_me_front","q_me_good"]);
const PROVOCA=new Set(["me_gain","me_start","q_me_through"]);
function opcoes(kind,c,v){const L=typeof VOX!=="undefined"&&VOX[kind];if(!L)return[];const N=c.d.n.split(" ")[0];const vv={N,...v};
  const has=x=>!(x.match(/\{(\w)\}/g)||[]).some(m=>vv[m[1]]==null);const fill=x=>x.replace(/\{(\w)\}/g,(m,k)=>vv[k]!=null?String(vv[k]):m);const out=[];
  if(Array.isArray(L)){const ok=L.filter(has);for(let i=0;i<2&&ok.length;i++){const s=ok.splice(Math.floor(rnd()*ok.length),1)[0];out.push({t:fill(s),tom:"normal"})}}
  else for(const tom of["quente","normal","frio"]){const ok=(L[tom]||[]).filter(has);if(ok.length)out.push({t:fill(pk(ok)),tom})}
  return out}
let PROMPT=null;
function pede(kind,c,v,pri){const ops=opcoes(kind,c,v);if(!ops.length)return;if(PROMPT&&PROMPT.pri>pri&&R.t-PROMPT.t0<5)return;
  PROMPT={kind,c,v,pri,ops,t0:R.t,ate:performance.now()+(window.__rvLongo?60000:7000)};desenhaPrompt()}
function escolhe(i){const P=PROMPT;if(!P)return;PROMPT=null;desenhaPrompt();const o=P.ops[i];if(!o)return;const c=P.c;
  try{radio(c,o.t,{me:1,k:"vox",vox:1})}catch(e){}try{if(typeof tvMyRadioSay==="function")tvMyRadioSay(c,o.t,"me")}catch(e){}
  try{(R.vox.log=R.vox.log||[]).push({t:R.t,lap:Math.max(1,R.lead+1),who:"me",txt:o.t})}catch(e){}
  fatoDoPiloto(P.kind,o,P.v)}
function fatoDoPiloto(kind,o,v){const M=GL.MEMO;if(!M)return;const me=eu();const alvoC=v&&v.A?carroCod(v.A):null;const alvo=alvoC?alvoC.id:undefined;const quente=o.tom==="quente";const xingo=PALAVRAO.test(o.t);
  const tv=(alvoC&&noAr(alvoC)?.32:.12)+((G.fame&&G.fame.pop)||30)/300+(quente?.12:0);let f=null;
  if(CONFLITO.has(kind)&&(quente||xingo))f=M.registra(xingo?"radio_ofensa":"radio_reclamacao",{alvo,gp:gp(),volta:me&&me.lap});
  else if(EQUIPE.has(kind)&&quente)f=M.registra("radio_carro",{gp:gp()});
  else if(PROVOCA.has(kind)&&quente&&alvo)f=M.registra("radio_provocou",{alvo,gp:gp()});
  else if(FESTA.has(kind)&&o.tom!=="frio")f=M.registra("radio_elogio",{gp:gp(),peso:kind==="me_win"?26:15});
  if(f){if(M.tvEscuta(f,tv))aviso("A TV transmitiu o seu rádio"+(xingo?", com bip.":"."))}}
function aviso(t){try{rcMsg("Transmissão: "+t,"warn");R.toast={t:R.t,text:t}}catch(e){}}
// intercepta as falas automáticas do seu piloto
if(typeof vox==="function"&&!vox._vivo){const base=vox;GL.vox=function(kind,c,v,pri,who){
    if((who==null||who==="me")&&c&&c.isP&&!AUTO.has(kind)&&typeof R!=="undefined"&&R&&R.vox){pri=pri||1;const k=kind+"me";if((R.vox.said[k]||-99)>R.t-(pri>=3?0:pri===2?22:45))return;R.vox.said[k]=R.t;pede(kind,c,v||{},pri);return}
    return base.apply(this,arguments)};GL.vox._vivo=1}
// ---------- 2. botão do rádio e painel
const css=document.createElement("style");css.textContent=`
.rvBox{position:fixed;left:max(12px,env(safe-area-inset-left,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:80;display:flex;flex-direction:column;align-items:flex-start;gap:8px;max-width:min(92vw,420px);pointer-events:none}
.rvBox>*{pointer-events:auto}
.rvBtn{all:unset;pointer-events:auto;cursor:pointer;display:inline-flex;align-items:center;gap:8px;background:#E8432A;color:#fff;font:700 15px/1 Inter,'Titillium Web',system-ui,sans-serif;padding:0 18px;min-height:48px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.4)}
.rvBtn:focus-visible{outline:2px solid #fff;outline-offset:2px}
.rvCard{background:rgba(18,19,23,.96);border:1px solid #2C3038;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 10px 30px rgba(0,0,0,.45);color:#F2F3F5;font-family:Inter,system-ui,sans-serif;width:min(92vw,420px)}
.rvCard h4{margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9097A3}
.rvOps{display:flex;flex-direction:column;gap:6px}
.rvOp{all:unset;pointer-events:auto;box-sizing:border-box;cursor:pointer;padding:10px 12px;border-radius:10px;background:#1F2229;font-size:14px;line-height:1.35;min-height:44px}
.rvOp:hover{background:#2A2E36}.rvOp:focus-visible{outline:2px solid #fff}
.rvOp small{display:block;font-size:11px;color:#9097A3;letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px}
.rvOp.quente small{color:#FF9A88}.rvOp.frio small{color:#8FC2FF}
.rvBar{height:3px;border-radius:2px;background:#2C3038;overflow:hidden}.rvBar i{display:block;height:100%;background:#E8432A}
.rvGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.rvX{all:unset;pointer-events:auto;cursor:pointer;align-self:flex-end;font-size:13px;color:#9097A3;padding:4px 6px}`;document.head.appendChild(css);
const box=document.createElement("div");box.className="rvBox";box.hidden=true;box.innerHTML=`<div class="rvCard" id="rvPrompt" hidden></div><div class="rvCard" id="rvMenu" hidden></div><button class="rvBtn" id="rvBtn" aria-haspopup="dialog"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="7" y="7" width="10" height="14" rx="2"/><path d="M12 7V3M9 3h6M10 12h4M10 16h4"/></svg>Rádio</button>`;
document.body.appendChild(box);
const TOM={quente:"Quente",normal:"Normal",frio:"Frio"};
function desenhaPrompt(){const el=box.querySelector("#rvPrompt");if(!PROMPT){el.hidden=true;el.innerHTML="";return}
  el.hidden=false;el.innerHTML=`<h4>Responder no rádio?</h4><div class="rvOps">${PROMPT.ops.map((o,i)=>`<button class="rvOp ${o.tom}" data-rv="${i}"><small>${TOM[o.tom]}</small>${esc(o.t)}</button>`).join("")}<button class="rvOp" data-rv="x"><small>Ficar calado</small>Não falar nada</button></div><div class="rvBar"><i id="rvT"></i></div>`}
function desenhaMenu(abre){const el=box.querySelector("#rvMenu");if(!abre){el.hidden=true;return}el.hidden=false;
  el.innerHTML=`<button class="rvX" data-rvm="fecha" aria-label="Fechar">Fechar ✕</button><h4>Falar</h4><div class="rvGrid">${[["reclamar","Reclamar de quem está perto"],["explodir","Explodir"],["elogiar","Agradecer a equipe"],["carro","Reclamar do carro"]].map(([k,n])=>`<button class="rvOp" data-rvm="${k}">${n}</button>`).join("")}</div>
   <h4>Perguntar à equipe</h4><div class="rvGrid">${[["q_frente","Pneu do carro da frente"],["q_chuva","Vai chover?"],["q_box","Quando paramos?"]].map(([k,n])=>`<button class="rvOp" data-rvm="${k}">${n}</button>`).join("")}</div>`}
box.addEventListener("click",e=>{const a=e.target.closest("[data-rv]");if(a){e.preventDefault();if(a.dataset.rv==="x"){PROMPT=null;desenhaPrompt()}else escolhe(+a.dataset.rv);return}
  const m=e.target.closest("[data-rvm]");if(m){e.preventDefault();const k=m.dataset.rvm;desenhaMenu(false);if(k!=="fecha"&&GL.MEMO)GL.MEMO.falaRadio(k);return}
  if(e.target.closest("#rvBtn")){const el=box.querySelector("#rvMenu");desenhaMenu(el.hidden)}});
// mostra o botão só durante a corrida ou a classificação
const _h1=setInterval(()=>{const ativo=typeof R!=="undefined"&&R&&R.started&&!R.over&&!!document.querySelector("#app .stage")&&!!eu();if(box.hidden===ativo)box.hidden=!ativo;
  if(!ativo&&PROMPT){PROMPT=null;desenhaPrompt()}
  if(PROMPT){const left=PROMPT.ate-performance.now();const b=document.getElementById("rvT");if(b)b.style.width=Math.max(0,left/70)+"%";if(left<=0){PROMPT=null;desenhaPrompt()}}},150);if(_h1&&_h1.unref)_h1.unref();
// ---------- 3. os outros pilotos
// fala (ou não) conforme temperamento, situação e relação com você; a TV decide se vai ao ar
const PERG={tyre:["Quantas voltas esses pneus aguentam?","Os pneus estão caindo. Qual é o plano?","Não tenho mais aderência. Quando paramos?"],rain:["Vai chover? Preciso saber agora.","Estou vendo nuvens. Qual é a previsão?"],attack:["Posso usar a bateria toda pra atacar?","Me dá o gap. Dá pra passar?"]};
const RESPEQ={tyre:["Mais umas quatro voltas. Aguenta.","Box na próxima volta, prepara.","Segura mais duas, a janela abre já."],rain:["Chuva em cinco voltas, talvez menos.","Sem chuva no radar por enquanto."],attack:["Afirmativo, ataque total por duas voltas.","Negativo, poupa a bateria para a reta final."]};
function temper(c){return typeof tvTemper==="function"?tvTemper(c):"normal"}
function relCom(c){return(G.rel&&G.rel[c.id])||0}
function linha(kind,tom){const set=typeof TV_RAD!=="undefined"&&TV_RAD[kind];if(!set)return null;return pk(set[tom]||set.normal||set.quente)}
function npcFala(c,kind,outro,pri){if(!c||c.hum||!c.t||typeof R==="undefined"||!R)return;const me=eu();const comigo=outro&&outro===me;
  let p={lost:.38,gain:.22,crash:.8,spin:.45,lead:.4,win:1,tyre:.3}[kind]||.3;const tom0=temper(c);
  if(tom0==="quente")p+=.2;if(tom0==="frio")p-=.12;if(comigo)p+=.25;if(pos(c)<=10)p+=.1;if(c.id===G.rival)p+=.15;if(rnd()>p)return;
  // a raiva sobe quando é com você e a relação já é ruim
  let tom=tom0;if(comigo&&(relCom(c)<-10||tom0==="quente")&&(kind==="lost"||kind==="crash"))tom="quente";if(comigo&&kind==="gain"&&relCom(c)<-5)tom="quente";
  const txt=linha(kind,tom);if(!txt)return;
  // a TV pega mais o que é relevante: briga com você, o seu rival, o top 10
  const ar=Math.min(.95,.25+(pos(c)<=10?.25:0)+(comigo?.35:0)+(c.id===G.rival?.2:0)+(pri>=3?.5:0));const noar=rnd()<ar&&(R.t>=(TVX.radNext||0)||pri>=3||comigo);
  if(noar&&typeof tvRadioSay==="function")tvRadioSay(c,txt);
  const M=GL.MEMO;if(!M)return;const vis=noar?{tv:1,publico:1,imprensa:1}:{equipe:1};
  // um fato por piloto e por tipo de situação em cada corrida (o assunto não se repete)
  R._rvF=R._rvF||{};const chave=c.id+":"+kind;if(R._rvF[chave])return;R._rvF[chave]=1;
  if(comigo&&(kind==="lost"||kind==="crash")){const xing=PALAVRAO.test(txt),recl=tom==="quente"||/fech|jogou|investig|puni|porta|acert|limite/i.test(txt);
    if(xing||recl)M.registra(xing?"npc_xingou":"npc_reclamou",{quem:c.id,alvo:c.id,gp:gp(),fala:txt.replace(/[.!?]+$/,""),visto:vis})}
  else if(comigo&&kind==="gain"&&tom==="quente"){M.registra("npc_provocou",{quem:c.id,alvo:c.id,gp:gp(),fala:txt.replace(/[.!?]+$/,""),visto:vis})}
  else if((c.id===G.rival||(typeof mate==="function"&&mate()&&mate().id===c.id))&&tom==="quente"&&(kind==="tyre"||kind==="lost"||kind==="spin")){M.registra("outro_reclamou",{quem:c.id,alvo:c.id,gp:gp(),fala:txt.replace(/[.!?]+$/,""),visto:vis})}}
function npcPergunta(c,tipo){if(!c||c.hum||!c.t)return;const q=pk(PERG[tipo]),a=pk(RESPEQ[tipo]);const ar=pos(c)<=8||c.id===G.rival;if(!ar||R.t<(TVX.radNext||0))return;
  if(typeof tvRadioSay==="function"){tvRadioSay(c,q);setTimeout(()=>{try{narr(`Equipe de ${c.code}: "${a}"`,1)}catch(e){}},2600)}}
if(typeof tvRadioEvent==="function"&&!tvRadioEvent._vivo){GL.tvRadioEvent=function(h,cs){try{const c=cs[0];
    if(h.type==="pass"&&cs[1]){npcFala(cs[1],"lost",c,1);npcFala(c,"gain",cs[1],1)}
    else if(h.type==="crash"){const o=cs[1];npcFala(c,"crash",o,2);if(o)npcFala(o,"crash",c,2)}
    else if(h.type==="spin")npcFala(c,"spin",null,1);else if(h.type==="lead"&&R.lead>0)npcFala(c,"lead",null,1);else if(h.type==="finish")npcFala(c,"win",null,3)}catch(e){}};GL.tvRadioEvent._vivo=1}
// de tempos em tempos, quem tem motivo pergunta à própria equipe (pneu gasto, chuva chegando, colado em alguém)
const _h2=setInterval(()=>{try{if(typeof R==="undefined"||!R||!R.started||R.over||R.qMode||!R.order)return;const M=npcPergunta;
  const cand=R.order.slice(0,12).filter(c=>running(c)&&!c.hum&&!c.pit);if(!cand.length)return;const c=pk(cand);const st=c._rv=c._rv||{};if(R.t-(st.t||-99)<90)return;
  let tipo=null;if(c.tyre&&c.tyre.wear>.62&&!c.pitCall)tipo="tyre";else if(typeof rainAt==="function"&&rainAt(c.lap+4)>(R.rain||0))tipo="rain";else{const i=R.order.indexOf(c),A=R.order[i-1];if(A&&(A.prog-c.prog)*c.L<30)tipo="attack"}
  if(tipo&&rnd()<.5){st.t=R.t;M(c,tipo);if(tipo==="tyre"&&temper(c)==="quente")npcFala(c,"tyre",null,1)}}catch(e){}},4000);if(_h2&&_h2.unref)_h2.unref();
GL.RADIOVIVO={pede,escolhe,npcFala};
})(typeof window!=="undefined"?window:globalThis);
