// ===================== CRIAÇÃO DO PERSONAGEM (visual do piloto) =====================
// Rosto, cabelo, barba, olhos, boné, capacete e número. Fica em G.avatar (e G.helmet / número do piloto).
// Funciona em carreiras já salvas: nada é zerado. Se a carreira ainda não tem visual, o jogo oferece criar
// uma vez ao abrir o paddock; dá para voltar a qualquer momento pelo cartão "Seu piloto" na aba Início.
(function(GL){
const AV=()=>GL.AV;const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let cssOk=false;
function estilo(){if(cssOk)return;cssOk=true;const s=document.createElement("style");s.textContent=`
.pvf{position:fixed;inset:0;z-index:60;background:rgba(6,7,9,.78);display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));overflow-y:auto}
.pv{background:var(--panel,#15171C);border:1px solid var(--line,rgba(255,255,255,.12));border-radius:12px;width:100%;max-width:1000px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);overflow:hidden}
.pv .pv-prev{position:relative;background:#E9ECEF;min-height:420px;display:flex;flex-direction:column}
.pv .pv-prev svg{width:100%;flex:1;display:block}
.pv .pv-prev .pv-exps{display:flex;gap:6px;flex-wrap:wrap;padding:10px;background:rgba(12,13,16,.92)}
.pv .pv-prev .pv-exps button{font:600 12.5px/1 inherit;color:#F2F3F5;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:7px 10px;cursor:pointer}
.pv .pv-prev .pv-exps button:focus-visible{outline:2px solid #FF4D2E;outline-offset:2px}
.pv .pv-ctl{padding:18px;display:flex;flex-direction:column;gap:14px;max-height:min(86vh,760px);overflow-y:auto}
.pv h2{margin:0;font:900 italic 24px/1.1 'Titillium Web',system-ui,sans-serif}
.pv .pv-lead{margin:0;color:var(--mu,#8D929C);font-size:14px;line-height:1.45}
.pv .pv-grp{display:flex;flex-direction:column;gap:7px}
.pv .pv-grp>b{font:700 10.5px/1 inherit;letter-spacing:.16em;text-transform:uppercase;color:var(--mu,#8D929C)}
.pv .pv-ops{display:flex;gap:6px;flex-wrap:wrap}
.pv .pv-chip{font:600 13px/1 inherit;color:var(--fg,#EEF0F3);background:rgba(255,255,255,.05);border:1px solid var(--line,rgba(255,255,255,.12));border-radius:999px;padding:8px 12px;cursor:pointer}
.pv .pv-chip.on{border-color:#FF4D2E;background:rgba(255,77,46,.16)}
.pv .pv-sw{width:34px;height:34px;border-radius:50%;border:2px solid transparent;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}
.pv .pv-sw.on{border-color:#FF4D2E;box-shadow:0 0 0 2px var(--panel,#15171C) inset}
.pv .pv-chip:focus-visible,.pv .pv-sw:focus-visible{outline:2px solid #FF4D2E;outline-offset:2px}
.pv .pv-cap{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.pv .pv-cap label{display:flex;gap:6px;align-items:center;font-size:13px;color:var(--mu,#8D929C)}
.pv .pv-cap input[type=color]{width:42px;height:32px;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:6px;background:none;padding:2px}
.pv .pv-cap input[type=number]{width:80px}
.pv .pv-acoes{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;position:sticky;bottom:-18px;background:var(--panel,#15171C);padding:10px 0 2px}
.pv .pv-aviso{font-size:12.5px;color:#FFB4A8;min-height:1em}
@media (max-width:760px){.pv{grid-template-columns:1fr}.pv .pv-prev{min-height:0}.pv .pv-prev svg{height:42vh}.pv .pv-ctl{max-height:none;overflow:visible}.pvf{place-items:start center}}
.pvc{display:flex;flex-direction:row;gap:14px;align-items:center;text-align:left}
.pvc svg{width:92px;height:92px;border-radius:50%;background:#E9ECEF;flex:none}
.pvc.novo{border:1px solid #FF4D2E;background:linear-gradient(90deg,rgba(255,77,46,.12),transparent)}`;document.head.appendChild(s)}

const PRE_CAP=["#FFD400","#E10600","#1B998B","#2D6CDF","#FFFFFF","#111316","#FF4D2E","#21C55D","#9B5DE5","#F15BB5"];
let E=null;// editor aberto
function abre(opts){opts=opts||{};if(typeof G==="undefined"||!G||!GL.AV)return;estilo();fecha(true);const me=ME();
  const D=Object.assign({},G.avatar||AV().rostoJogador());const hc={c1:(G.helmet&&G.helmet.c1)||"#FFD400",c2:(G.helmet&&G.helmet.c2)||"#1B998B"};let num=me.num;
  const bg=document.createElement("div");bg.className="pvf";bg.setAttribute("role","dialog");bg.setAttribute("aria-modal","true");bg.setAttribute("aria-label","Visual do piloto");
  bg.innerHTML=`<div class="pv"><div class="pv-prev"><svg viewBox="-330 176 660 584" preserveAspectRatio="xMidYMid slice"><rect x="-330" y="176" width="660" height="584" fill="#E9ECEF"/><g class="r"></g></svg>
    <div class="pv-exps">${[["neutro","Neutro"],["feliz","Feliz"],["rindo","Rindo"],["serio","Sério"],["confiante","Confiante"],["irritado","Irritado"],["triste","Triste"]].map(([k,n])=>`<button data-e="${k}">${n}</button>`).join("")}<button data-e="falar">Falar</button></div></div>
    <div class="pv-ctl"><div><h2>${G.avatar?"Visual do piloto":"Crie o seu piloto"}</h2><p class="pv-lead">${G.avatar?"Mude o que quiser. O visual aparece nas entrevistas, na coletiva e nas outras cenas.":"Sua carreira continua exatamente como está. Escolha o rosto que vai aparecer nas entrevistas, na coletiva e nas outras cenas do jogo."}</p></div>
    <div class="pv-grp"><b>Pele</b><div class="pv-ops" data-g="pele">${AV().PELES.map((c,i)=>`<button class="pv-sw" data-v="${i}" style="background:${c}" aria-label="Tom de pele ${i+1}"></button>`).join("")}</div></div>
    <div class="pv-grp"><b>Formato do rosto</b><div class="pv-ops" data-g="rosto">${AV().ROSTOS.map(k=>`<button class="pv-chip" data-v="${k}">${AV().NOMES.rosto[k]}</button>`).join("")}</div></div>
    <div class="pv-grp"><b>Olhos</b><div class="pv-ops" data-g="olhos">${Object.entries(AV().OLHOS).map(([k,c])=>`<button class="pv-sw" data-v="${k}" style="background:${c}" aria-label="Olhos ${AV().NOMES.olhos[k]}"></button>`).join("")}</div></div>
    <div class="pv-grp"><b>Cabelo</b><div class="pv-ops" data-g="estilo">${AV().ESTILOS.map(k=>`<button class="pv-chip" data-v="${k}">${AV().NOMES.estilo[k]}</button>`).join("")}</div>
      <div class="pv-ops" data-g="cabelo">${Object.entries(AV().CABELOS).map(([k,c])=>`<button class="pv-sw" data-v="${k}" style="background:${c}" aria-label="Cabelo ${AV().NOMES.cabelo[k]}"></button>`).join("")}</div></div>
    <div class="pv-grp"><b>Barba</b><div class="pv-ops" data-g="barba">${AV().BARBAS.map(k=>`<button class="pv-chip" data-v="${k}">${AV().NOMES.barba[k]}</button>`).join("")}</div></div>
    <div class="pv-grp"><b>Sobrancelhas</b><div class="pv-ops" data-g="sobr">${[[.8,"Finas"],[1,"Médias"],[1.25,"Grossas"]].map(([v,n])=>`<button class="pv-chip" data-v="${v}">${n}</button>`).join("")}</div></div>
    <div class="pv-grp"><b>Nas entrevistas</b><div class="pv-ops" data-g="bone"><button class="pv-chip" data-v="1">Com o boné da equipe</button><button class="pv-chip" data-v="0">Sem boné</button></div></div>
    <div class="pv-grp"><b>Capacete e número</b><div class="pv-cap"><label>Cor 1 <input type="color" id="pvC1" value="${hc.c1}"></label><label>Cor 2 <input type="color" id="pvC2" value="${hc.c2}"></label>
      <span class="helm"></span><label>Número <input class="txt" type="number" id="pvNum" min="2" max="99" value="${num}"></label></div><div class="pv-aviso" id="pvAv"></div></div>
    <div class="pv-acoes"><button class="btn" data-a="sorteia">Sortear</button>${opts.primeira?`<button class="btn" data-a="depois">Agora não</button>`:`<button class="btn" data-a="cancela">Cancelar</button>`}<button class="btn go" data-a="salva">Salvar visual</button></div></div></div>`;
  document.body.appendChild(bg);const g=bg.querySelector("g.r");let rig=null;let emo="neutro";
  const marca=()=>{bg.querySelectorAll(".pv-ops").forEach(o=>{const k=o.dataset.g;o.querySelectorAll("button").forEach(b=>{let v=D[k];if(k==="bone")v=D.bone===false?"0":"1";b.classList.toggle("on",String(v)===b.dataset.v);b.setAttribute("aria-pressed",String(v)===b.dataset.v)})});
    const h=bg.querySelector(".helm");if(h&&typeof helmetSVG==="function")h.innerHTML=helmetSVG(hc.c1,hc.c2,40)};
  const monta=()=>{if(rig)rig.remove();rig=new (AV().Rig)(g,D,{...AV().uniformeDe(me),num,x:0,y:0,s:1});rig.emo(emo);for(let i=0;i<40;i++)rig.tick(.05,i*.05);marca()};
  bg.addEventListener("click",e=>{if(e.target===bg){if(!opts.primeira)fecha();return}const op=e.target.closest(".pv-ops button");if(op){const k=op.closest(".pv-ops").dataset.g;let v=op.dataset.v;
      if(k==="pele")v=+v;else if(k==="sobr")v=+v;else if(k==="bone")v=v==="1";D[k]=v;monta();return}
    const ex=e.target.closest(".pv-exps button");if(ex){const k=ex.dataset.e;if(k==="falar"){emo="feliz";rig.emo("feliz");E.falaT=0;E.falaTxt="Pronto para a próxima corrida. Vamos buscar esse pódio!";rig.fala.on=true;rig.fala.txt=E.falaTxt}else{emo=k;rig.emo(k)}return}
    const a=e.target.closest("[data-a]");if(!a)return;const ac=a.dataset.a;
    if(ac==="sorteia"){Object.assign(D,AV().rostoDe({id:"s"+Math.random()}));monta()}
    else if(ac==="cancela")fecha();
    else if(ac==="depois"){UI.pvAdiado=true;fecha()}
    else if(ac==="salva"){const n=Math.round(+bg.querySelector("#pvNum").value||num);const usado=Object.values(G.drivers).find(d=>d.id!==G.me&&d.team&&d.num===n);
      if(n<2||n>99){bg.querySelector("#pvAv").textContent="Escolha um número entre 2 e 99.";return}
      if(usado){bg.querySelector("#pvAv").textContent=`O número ${n} já é de ${usado.n}. Escolha outro.`;return}
      G.avatar={v:1,pele:D.pele,cabelo:D.cabelo,estilo:D.estilo,barba:D.barba,olhos:D.olhos,rosto:D.rosto,bone:D.bone!==false,sobr:D.sobr||1};G.helmet={c1:hc.c1,c2:hc.c2};me.num=n;
      if(typeof save==="function")save();fecha();if(typeof render==="function")render()}});
  bg.querySelector("#pvC1").addEventListener("input",e=>{hc.c1=e.target.value;marca()});bg.querySelector("#pvC2").addEventListener("input",e=>{hc.c2=e.target.value;marca()});
  bg.querySelector("#pvNum").addEventListener("change",e=>{num=Math.round(+e.target.value||num);monta()});
  E={bg,falaT:0,falaTxt:"",onKey:e=>{if(e.key==="Escape"&&!opts.primeira)fecha()}};window.addEventListener("keydown",E.onKey);monta();
  let ult=performance.now(),t=0;const laco=n=>{if(!E||E.bg!==bg)return;const dt=Math.max(0,Math.min(.05,(n-ult)/1000));ult=n;t+=dt;
    if(rig.fala.on){E.falaT+=dt;rig.fala.i=E.falaT*16;if(rig.fala.i>=E.falaTxt.length){rig.fala.on=false}}rig.olhar(Math.sin(t*.5)*2,Math.sin(t*.8)*.6,Math.sin(t*.3)*.1);rig.tick(dt,t);requestAnimationFrame(laco)};requestAnimationFrame(laco);
  const f=bg.querySelector(".pv-ops button.on")||bg.querySelector("button");if(f)f.focus()}
function fecha(silencio){if(!E)return;window.removeEventListener("keydown",E.onKey);E.bg.remove();E=null}

// cabeça do piloto parada (para cartões e listas)
function retrato(d,tam){if(!GL.AV)return"";const svg=document.createElementNS(GL.AV.NS,"svg");svg.setAttribute("viewBox","-160 192 320 320");const P=d&&d.id===G.me?GL.AV.rostoJogador():GL.AV.rostoPiloto(d);
  const r=new GL.AV.Rig(svg,P,{...GL.AV.uniformeDe(d),x:0,y:0,s:1});for(let i=0;i<30;i++)r.tick(.05,i*.05);svg.setAttribute("width",tam||92);svg.setAttribute("height",tam||92);svg.setAttribute("aria-hidden","true");return svg.outerHTML}

// cartão "Seu piloto" na aba Início + convite automático para quem ainda não tem visual
function instala(){if(typeof homeTab!=="function"||homeTab._pv)return;const base=homeTab;
  GL.homeTab=function(){base.apply(this,arguments);try{estilo();const b=document.getElementById("body");if(!b)return;const me=ME();const novo=!G.avatar;
      const c=document.createElement("div");c.className="card pvc"+(novo?" novo":"");c.style.marginTop="12px";
      c.innerHTML=`${retrato(me,92)}<div style="flex:1;min-width:0"><h3 style="margin:0 0 4px">Seu piloto</h3><p class="muted" style="margin:0 0 8px">${novo?"Sua carreira ainda não tem um rosto. Crie o visual do seu piloto: nada da carreira muda.":"Este é o visual que aparece nas entrevistas e na coletiva."}</p><button class="btn ${novo?"go":"sm"}" data-pv="abre">${novo?"Criar meu piloto":"Editar visual"}</button></div>`;
      b.insertBefore(c,b.firstChild);c.querySelector("[data-pv]").onclick=()=>abre({primeira:novo});
      if(novo&&!UI.pvAdiado&&!UI.pvVisto&&!(navigator.webdriver&&!window.PV_TESTE)){UI.pvVisto=true;setTimeout(()=>{if(!G.avatar&&UI.scr==="hub")abre({primeira:true})},350)}}catch(e){console.warn("visual do piloto",e)}};
  GL.homeTab._pv=true}
if(typeof window!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instala);else instala()}
GL.PV={abre,fecha,retrato,instala};
})(typeof window!=="undefined"?window:globalThis);
