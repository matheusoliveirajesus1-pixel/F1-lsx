// ===================== RÁDIO VIVO =====================
// 1) O seu piloto nunca fala sozinho (sem respostas rápidas).
// 2) Um botão "Rádio" na corrida serve para perguntar à equipe (respostas com os dados reais) e pedir pneus, como na vida real.
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
// ---------- 1. o seu piloto não fala sozinho
// As falas automáticas do seu piloto ficam caladas (sem cartões de resposta rápida). Só as confirmações das suas ordens continuam.
function pede(){}function escolhe(){}
if(typeof vox==="function"&&!vox._vivo){const base=vox;GL.vox=function(kind,c,v,pri,who){
    if((who==null||who==="me")&&c&&c.isP&&!AUTO.has(kind))return;
    return base.apply(this,arguments)};GL.vox._vivo=1}
// ---------- perguntas à equipe: respostas tiradas dos dados reais do carro e da corrida
const PEDACO={wingL:"asa dianteira esquerda",wingR:"asa dianteira direita",nose:"bico",floor:"assoalho",cool:"radiador",side:"lateral",rwing:"asa traseira",gear:"câmbio",body:"carroceria",susp:"suspensão",power:"ERS"};
const RODAS=["dianteiro esquerdo","dianteiro direito","traseiro esquerdo","traseiro direito"];
function lista(a){return a.length<2?a.join(""):a.slice(0,-1).join(", ")+" e "+a[a.length-1]}
function nPneu(k){return COMP[k]?COMP[k].n.toLowerCase():k}
function vidaPneu(c){try{const r=wearRate(c);if(!(r>0))return null;return Math.max(0,Math.floor((.8-c.tyre.wear)/r))}catch(e){return null}}
function gapS(a,b){return Math.abs(a.prog-b.prog)*(b.L||90)}
const PERGS=[["carro","Como está o carro?"],["pneus","Como estão os pneus?"],["frente","E o carro da frente?"],["tras","E quem vem atrás?"],["chuva","Vai chover?"],["box","Quando a gente para?"],["comb","Combustível e bateria?"],["ritmo","Como está o meu ritmo?"]];
function respostaDe(k,me){const i=R.order.indexOf(me),A=R.order[i-1],B=R.order[i+1];const ty=me.tyre||{};const d=me.dmg||{};
  if(k==="carro"){const p=[];for(const x in PEDACO)if((d[x]||0)>.05)p.push(PEDACO[x]+((d[x]||0)>.55?" (grave)":(d[x]||0)<.2?" (leve)":""));(d.whl||[]).forEach((w,j)=>{if(w>.2)p.push("suspensão "+RODAS[j])});
    const furo=ty.punct||ty.flat;let t=p.length?`Temos dano: ${lista(p)}.`:"O carro está limpo, nenhum dano nos dados.";if(furo)t+=" E o pneu está furado, box agora!";
    if(me.latFail)t+=` Atenção: a leitura ${me.latFail==="Câmbio"?"do câmbio":me.latFail==="Motor"?"do motor":"de "+me.latFail.toLowerCase()} piorou depois do toque. Poupa nas trocas, pode não aguentar.`;
    if(me.bo)t+=" A direção de prova mostrou bandeira preta e laranja: tem que vir ao box.";return t}
  if(k==="pneus"){const v=vidaPneu(me),w=Math.round((ty.wear||0)*100),T=COMP[ty.c]||{};const tmp=ty.temp!=null&&T.opt?(ty.temp<T.opt-12?"ainda frios":ty.temp>T.opt+10?"superaquecendo":"na temperatura certa"):"";
    return `${(T.n||"Pneu")} com ${Math.round(ty.age||0)} voltas, ${w}% gastos${tmp?", "+tmp:""}. `+(v==null?"":v<=1?"Estão no fim, precisamos parar.":`Devem aguentar umas ${v} voltas.`)+(ty.grain?" Tem granulação.":"")+(ty.blister?" Tem bolha na borracha.":"")}
  if(k==="frente"){if(!A)return"Ninguém na sua frente. Você é o líder!";const g=gapS(A,me),ta=A.tyre||{};const dif=Math.round((ta.age||0)-(ty.age||0));
    return `${A.code} a ${g.toFixed(1)} segundos, de ${nPneu(ta.c)} com ${Math.round(ta.age||0)} voltas`+(dif>=3?`, ${dif} voltas mais velho que o seu. Deve cair.`:dif<=-3?`, ${-dif} voltas mais novo. Cuidado.`:".")+(A.pit||A.pitCall?" Parece que vai parar.":"")+(g<1?" Você está no DRS.":"")}
  if(k==="tras"){if(!B)return"Ninguém atrás de você.";const g=gapS(me,B),tb=B.tyre||{};return `${B.code} a ${g.toFixed(1)} segundos, de ${nPneu(tb.c)} com ${Math.round(tb.age||0)} voltas.`+(g<1?" Ele está no seu DRS, defende!":g<2.5?" Está se aproximando.":" Margem tranquila.")}
  if(k==="chuva"){let em=-1,int=0;for(let l=me.lap+1;l<=me.lap+15;l++){const r=typeof rainAt==="function"?rainAt(l):0;if(r>(R.rain||0)+.05){em=l-me.lap;int=r;break}}
    const seco=COMP[ty.c]&&COMP[ty.c].dry;if(em>0)return`Radar mostra chuva em ${em} volta${em>1?"s":""}, ${int>.6?"forte, vai precisar de pneu de chuva":int>.3?"moderada, intermediário":"fraca, talvez dê pra seguir no seco"}.`;
    if((R.rain||0)>.3)return seco?"Está chovendo e você está de pneu de seco. Precisa parar!":"A chuva deve continuar. Fica no pneu de chuva.";return"Sem chuva no radar."}
  if(k==="box"){const st=me.plan&&me.plan.stops&&me.plan.stops[me.planIdx];if(me.pitCall)return`Você já pediu box: ${nPneu(me.pitCall)} pronto.`;const v=vidaPneu(me);
    return st?`O plano é parar perto da volta ${st.lap} para o ${nPneu(st.c)}${v!=null&&me.lap+v<st.lap?", mas os pneus não chegam até lá. Talvez antes":""}.`:`Sem parada no plano. ${v!=null&&v<R.L-me.lap?"Mas os pneus não chegam ao fim, vamos ter que parar.":"Cuida dos pneus até o fim."}`}
  if(k==="comb"){let t=`Bateria em ${Math.round(me.batt||0)}%.`;if(me.fuelWarn)t="Combustível no limite, precisa poupar. "+t;else t="Combustível dá até o fim. "+t;return t}
  if(k==="ritmo"){if(!me.last)return"Ainda sem volta completa.";const r=A&&A.last?me.last-A.last:null;return`Última volta ${me.last.toFixed(1)}.`+(r==null?"":Math.abs(r)<.15?` Mesmo ritmo do ${A.code}.`:r<0?` ${(-r).toFixed(1)} mais rápido que o ${A.code}.`:` ${r.toFixed(1)} mais lento que o ${A.code}.`)}
  return""}
function pergunta(k){const me=eu();if(!me)return;const q=(PERGS.find(x=>x[0]===k)||[])[1];if(!q)return;try{radio(me,q,{me:1})}catch(e){}
  const t=respostaDe(k,me);R._rvPerg=(R._rvPerg||0)+1;setTimeout(()=>{try{radio(me,`${G.engineer||"Engenheiro"}: "${t}"`)}catch(e){}},1200+Math.random()*900);return t}
function pedePneu(comp){const me=eu();if(!me)return;if(comp==="fica"){cmdBoxC(me,null);return}cmdBoxC(me,comp);
  const T=COMP[comp];const chuva=R.rain||0;let aviso=null;if(T&&T.dry&&chuva>.45)aviso="A pista está molhada. Tem certeza que quer pneu de seco?";else if(T&&!T.dry&&chuva<.1&&!(typeof rainAt==="function"&&rainAt(me.lap+2)>.2))aviso="Não tem chuva prevista, esse pneu vai derreter.";
  if(aviso)setTimeout(()=>{try{radio(me,`${G.engineer||"Engenheiro"}: "${aviso}"`)}catch(e){}},2200)}
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
.rvTy{display:flex;align-items:center;gap:8px}.rvTy i{width:12px;height:12px;border-radius:50%;flex:none;box-shadow:inset 0 0 0 2px rgba(0,0,0,.35)}.rvTy small{margin:0 0 0 auto;display:inline}
.rvX{all:unset;pointer-events:auto;cursor:pointer;align-self:flex-end;font-size:13px;color:#9097A3;padding:4px 6px}`;document.head.appendChild(css);
const box=document.createElement("div");box.className="rvBox";box.hidden=true;box.innerHTML=`<div class="rvCard" id="rvPrompt" hidden></div><div class="rvCard" id="rvMenu" hidden></div><button class="rvBtn" id="rvBtn" aria-haspopup="dialog"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="7" y="7" width="10" height="14" rx="2"/><path d="M12 7V3M9 3h6M10 12h4M10 16h4"/></svg>Rádio</button>`;
document.body.appendChild(box);
function desenhaMenu(abre){const el=box.querySelector("#rvMenu");if(!abre){el.hidden=true;return}el.hidden=false;const me=eu();const atual=me&&me.tyre?me.tyre.c:null;
  el.innerHTML=`<button class="rvX" data-rvm="fecha" aria-label="Fechar">Fechar ✕</button><h4>Perguntar à equipe</h4><div class="rvGrid">${PERGS.map(([k,n])=>`<button class="rvOp" data-rvq="${k}">${n}</button>`).join("")}</div>
   <h4>Pedir pneus (box)</h4><div class="rvGrid rvPn">${Object.keys(COMP).map(k=>`<button class="rvOp rvTy" data-rvp="${k}"><i style="background:${COMP[k].c}"></i>${COMP[k].n}${k===atual?" <small>atual</small>":""}</button>`).join("")}<button class="rvOp" data-rvp="fica">Ficar na pista</button></div>`}
box.addEventListener("click",e=>{const q=e.target.closest("[data-rvq]");if(q){e.preventDefault();desenhaMenu(false);pergunta(q.dataset.rvq);return}
  const p=e.target.closest("[data-rvp]");if(p){e.preventDefault();desenhaMenu(false);pedePneu(p.dataset.rvp);return}
  const m=e.target.closest("[data-rvm]");if(m){e.preventDefault();desenhaMenu(false);return}
  if(e.target.closest("#rvBtn")){const el=box.querySelector("#rvMenu");desenhaMenu(el.hidden)}});
// mostra o botão só durante a corrida ou a classificação
const _h1=setInterval(()=>{const ativo=typeof R!=="undefined"&&R&&R.started&&!R.over&&!!document.querySelector("#app .stage")&&!!eu();if(box.hidden===ativo)box.hidden=!ativo;
  if(!ativo){const el=box.querySelector("#rvMenu");if(!el.hidden)desenhaMenu(false)}},150);if(_h1&&_h1.unref)_h1.unref();
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
GL.RADIOVIVO={pede,escolhe,npcFala,pergunta,pedePneu,respostaDe};
})(typeof window!=="undefined"?window:globalThis);
