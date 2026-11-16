// ===================== CENAS ANIMADAS DO PADDOCK =====================
// Usa o mesmo boneco das entrevistas (avatar.js) num "palco" comum: cenário, pessoas, falas com legenda,
// escolhas do jogador e flashes. Cada cena entra em um momento que o jogo já tem:
//   reunião técnica (chefe e engenheiro) · sala dos comissários · sala antes do pódio + cerimônia ·
//   conversa com o companheiro depois de ordem de equipe · negociação de contrato (o rosto do diretor entrega o blefe) ·
//   anúncio da contratação · gravação do comercial do patrocinador · título mundial · rádio com o rosto do engenheiro ·
//   foto na manchete · clipe vertical para as redes.
// Os efeitos usam as funções de sempre (relAdd, fameAdd, heatAdd, follow, post). Nada disso usa o sorteio da física.
(function(GL){
const NS="http://www.w3.org/2000/svg";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const AV=()=>GL.AV;const sur=n=>String(n||"").split(" ").pop();
let UID=0,cssOk=false;
function estilo(){if(GL.AVZ)GL.AVZ.estilo();if(cssOk)return;cssOk=true;const s=document.createElement("style");s.textContent=`
.cnov{position:fixed;inset:0;z-index:55;background:rgba(6,7,9,.82);display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));overflow-y:auto}
.cnov>.cnbox{width:100%;max-width:1000px;display:flex;flex-direction:column;gap:10px;background:var(--panel,#15171C);border:1px solid var(--line,rgba(255,255,255,.12));border-radius:12px;padding:12px}
.cnov h2{margin:0;font:900 italic 22px/1.15 'Titillium Web',system-ui,sans-serif}
.cnov .cnfim{display:flex;justify-content:flex-end;gap:8px}
.avz.cnmini .card2 p{font-size:3cqw}.avz.cnmini .card2 h4{font-size:2cqw}.avz.cnmini .sub{font-size:3.1cqw;max-width:86%}.avz.cnmini .sub small{font-size:1.6cqw}.avz.cnmini .bug{font-size:2cqw}.avz.cnmini .bug b{font-size:2.2cqw;padding:.9cqw 1.3cqw}.avz.cnmini .bug i,.avz.cnmini .bug .live{padding:.9cqw 1.3cqw}
.avz.cnmini .palco{aspect-ratio:16/9}
.avz .painel.cnp .opts{grid-template-columns:repeat(auto-fit,minmax(min(100%,22cqw),1fr))}
.avz.vert{max-width:360px;margin:0 auto}.avz.vert .palco{aspect-ratio:9/16}
.avz.vert .sub{font-size:5.4cqw;max-width:90%;bottom:10%;padding:1.6cqw 3cqw;border-radius:1.2cqw}.avz.vert .sub small{font-size:3cqw;margin-bottom:1cqw}
.avz.vert .bug{font-size:3.2cqw;gap:2cqw}.avz.vert .bug b{font-size:3.6cqw;padding:1.4cqw 2cqw}.avz.vert .bug i{display:none}.avz.vert .bug .live{padding:1.4cqw 2cqw}
.avz.vert .strap b{font-size:6cqw;padding:2cqw 3.4cqw}.avz.vert .strap span{font-size:3.2cqw;padding:1.4cqw 3.4cqw}.avz.vert .strap{bottom:24%;left:5%}
.cnrad{display:inline-flex;align-items:center;gap:10px}.cnrad svg{width:54px;height:54px;border-radius:50%;background:#E9ECEF;flex:none}
.cnrad small{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#8D929C)}
.cnfoto{position:relative;border-radius:8px;overflow:hidden;background:#E9ECEF;aspect-ratio:4/3;max-height:230px}
.cnfoto svg{width:100%;height:100%;display:block}
.cnfoto span{position:absolute;left:8px;bottom:8px;font:700 10.5px/1 'Titillium Web',sans-serif;letter-spacing:.14em;text-transform:uppercase;background:rgba(10,11,14,.78);color:#fff;padding:5px 7px;border-radius:4px}
@media (max-width:640px){.avz .painel.cnp .opts{grid-template-columns:1fr 1fr}.avz.cnmini .palco{aspect-ratio:3/4}.avz.cnmini .sub{font-size:3.8cqw}.avz.vert .palco{aspect-ratio:9/16}}`;document.head.appendChild(s)}

// ---------- palco genérico
function Palco(o){estilo();o=o||{};this.o=o;const id="cn"+(++UID);this.id=id;const no=document.createElement("div");no.className="avz "+(o.classe||"");this.no=no;
  const ac=o.acento||"#00B4D8";no.style.setProperty("--avzT",ac);no.style.setProperty("--avzTT",AV().luz(ac)>.55?"#0B0C0F":"#FFFFFF");
  no.innerHTML=`<div class="palco"><svg class="cena" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(o.rotulo||o.local||"Cena")}"><defs>
      <filter id="${id}bl" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.2"/></filter>
      <radialGradient id="${id}sp" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".62" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></radialGradient>
      <radialGradient id="${id}fl"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#EAF4FF" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}mi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B3F46"/><stop offset="1" stop-color="#1E2125"/></linearGradient>
      <linearGradient id="${id}ou" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset=".5" stop-color="#E0A92E"/><stop offset="1" stop-color="#9A6A12"/></linearGradient></defs>
    <g class="fundo"></g><g class="rigs"></g><g class="frente"></g><g class="efx"></g><rect class="flashTela" width="1600" height="900" fill="#fff" opacity="0"/></svg>
    <div class="ov"><div class="bug"><b>${esc(o.marca||"PADDOCK TV")}</b>${o.local?`<i>${esc(o.local)}</i>`:""}${o.aoVivo?`<span class="live">Ao vivo</span>`:""}</div>
      <div class="card2 q"><h4 class="qWho"></h4><p class="qTxt"></p></div><div class="card2 a"><h4 class="aWho"></h4><div class="aBody"></div></div>
      <div class="painel cnp"><h4 class="pT"></h4><div class="opts pOpts"></div></div><div class="strap"><b class="sB"></b><span class="sS"></span></div><div class="sub"></div></div></div>
    ${o.barra===false?"":`<div class="barra"><span class="dica">${esc(o.dica||"")}</span><span class="row" style="gap:6px"><button class="btn sm" data-pc="pausa">Pausar</button><button class="btn sm" data-pc="pula">Pular</button></span></div>`}`;
  const q=s=>no.querySelector(s);this.$={fundo:q(".fundo"),rigs:q(".rigs"),frente:q(".frente"),efx:q(".efx"),tela:q(".flashTela"),q:q(".q"),qWho:q(".qWho"),qTxt:q(".qTxt"),a:q(".a"),aWho:q(".aWho"),aBody:q(".aBody"),
    painel:q(".painel"),pT:q(".pT"),pOpts:q(".pOpts"),strap:q(".strap"),sB:q(".sB"),sS:q(".sS"),sub:q(".sub")};
  no.addEventListener("click",e=>{const b=e.target.closest("[data-pc]");if(!b)return;if(b.dataset.pc==="pausa"){this.T.pausa=!this.T.pausa;b.textContent=this.T.pausa?"Continuar":"Pausar"}else this.T.gen++});
  this.T={t:0,pausa:false,gen:0,esperas:[]};this.rigs=[];this.rajada=0;this.prox=1;this.vivo=true;this.rodando=false;this.escolha=null;this.part=[];
  this.tecla=e=>{if(!this.no.isConnected||!this.escolha)return;const n=+e.key;if(n>=1&&n<=this.escolha.n)this.escolha.fim(n-1)};window.addEventListener("keydown",this.tecla)}
const PP=Palco.prototype;
PP.u=function(n){return`url(#${this.id}${n})`};
PP.fundo=function(s){this.$.fundo.innerHTML=s};PP.frente=function(s){this.$.frente.innerHTML=s};
PP.rig=function(P,o){const r=new (AV().Rig)(this.$.rigs,P,o);this.rigs.push(r);for(let i=0;i<20;i++)r.tick(.05,i*.05);return r};
// corpo inteiro (comemorações): mesma interface do rig; x,y = topo da figura, s = escala (altura ≈ s × 2010)
PP.corpo=function(P,o){const C=GL.CORPO;if(!C)return this.rig(P,o);const c=new C.Corpo(this.$.rigs,P,o);this.rigs.push(c);for(let i=0;i<30;i++)c.tick(.05,i*.05);return c};
PP.mao=function(c,lado){const m=c.maos&&c.maos[lado];return m?[c.x+m[0]*c.s,c.y+m[1]*c.s]:[c.x,c.y+300*c.s]};
PP.espera=function(seg){const g=this.T.gen;return new Promise(r=>this.T.esperas.push({at:this.T.t+seg,r,g}))};
PP.para=function(){this.vivo=false;window.removeEventListener("keydown",this.tecla)};
PP.flash=function(forte){const x=Math.random()<.5?Math.random()*380-60:1260+Math.random()*400,y=520+Math.random()*420,r=forte?260:150+Math.random()*80;
  const c=document.createElementNS(NS,"circle");c.setAttribute("cx",x);c.setAttribute("cy",y);c.setAttribute("r",r);c.setAttribute("fill",this.u("fl"));this.$.efx.appendChild(c);const t0=performance.now();
  (function some(){const k=(performance.now()-t0)/260;c.setAttribute("opacity",Math.max(0,1-k));if(k<1)requestAnimationFrame(some);else c.remove()})();
  if(!matchMedia("(prefers-reduced-motion: reduce)").matches){const tela=this.$.tela,a=forte?.36:.16,t1=performance.now();(function f2(){const k=(performance.now()-t1)/140;tela.setAttribute("opacity",Math.max(0,a*(1-k)));if(k<1)requestAnimationFrame(f2)})()}
  for(const rg of this.rigs)rg.flash(forte?.8:.35)};
// confete e espuma de champanhe
PP.confete=function(n,cores){for(let i=0;i<n;i++)this.part.push({x:Math.random()*1600,y:-20-Math.random()*400,vx:(Math.random()-.5)*60,vy:120+Math.random()*120,r:Math.random()*6.28,vr:(Math.random()-.5)*8,c:cores[i%cores.length],w:10+Math.random()*8,h:6+Math.random()*5,vida:6})};
PP.espuma=function(x,y,dir){for(let i=0;i<60;i++)this.part.push({x,y,vx:dir*(300+Math.random()*420),vy:-260-Math.random()*300,g:900,r:0,vr:0,c:"#FFFFFF",w:8+Math.random()*10,h:0,vida:1.4+Math.random()*.6,bolha:1})};
PP.particulas=function(dt){if(!this.part.length){if(this.$.pg)this.$.pg.innerHTML="";return}if(!this.$.pg){this.$.pg=document.createElementNS(NS,"g");this.$.efx.appendChild(this.$.pg)}let s="";
  this.part=this.part.filter(p=>{p.vida-=dt;p.vy+=(p.g||30)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;if(p.vida<=0||p.y>960)return false;
    s+=p.bolha?`<circle cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" r="${(p.w*.5).toFixed(1)}" fill="#fff" opacity="${Math.min(.85,p.vida).toFixed(2)}"/>`:`<rect x="${(p.x-p.w/2).toFixed(0)}" y="${(p.y-p.h/2).toFixed(0)}" width="${p.w.toFixed(0)}" height="${p.h.toFixed(0)}" fill="${p.c}" transform="rotate(${(p.r*57).toFixed(0)} ${p.x.toFixed(0)} ${p.y.toFixed(0)})"/>`;return true});this.$.pg.innerHTML=s};
PP.laco=function(){if(this.rodando)return;this.rodando=true;let ult=performance.now();const q=agora=>{if(!this.vivo||!this.no.isConnected){this.rodando=false;return}
    const dt=Math.max(0,Math.min(.05,(agora-ult)/1000));ult=agora;const T=this.T;
    if(!T.pausa){T.t+=dt;for(let i=T.esperas.length-1;i>=0;i--){const w=T.esperas[i];if(T.t>=w.at||w.g!==T.gen){T.esperas.splice(i,1);w.r()}}
      this.prox-=dt;if(this.rajada>0&&this.prox<=0){this.flash(Math.random()<.35);this.rajada--;this.prox=.09+Math.random()*.22}else if(this.o.flashes&&this.prox<=-(4+Math.random()*4)){this.flash(false);this.prox=0}
      for(const rg of this.rigs)rg.tick(dt,T.t);this.particulas(dt);if(this.aoTick)this.aoTick(dt,T.t)}
    requestAnimationFrame(q)};requestAnimationFrame(q)};
PP.legenda=function(txt,quem,frac){const B=GL.AVZ?GL.AVZ.blocos(txt):[txt],tot=B.reduce((s,b)=>s+b.length,0);let acc=0,i=0;for(;i<B.length;i++){acc+=B[i].length;if(acc/tot>=frac-1e-6)break}
  const h=`${quem?`<small>${esc(quem)}</small>`:""}${esc(B[Math.min(i,B.length-1)])}`;if(this.$.sub.dataset.h!==h){this.$.sub.innerHTML=h;this.$.sub.dataset.h=h}this.$.sub.classList.add("on")};
// alguém fala: boca sincronizada, texto no cartão do lado (q = direita, a = esquerda) ou na legenda (sub)
PP.diz=async function(rig,o){const txt=o.texto,g=this.T.gen,t0=this.T.t;if(o.emo)rig.emo(o.emo);let el=null;
  const VZ=GL.VOZJ&&GL.VOZJ.fala(txt,{nome:o.nome,fem:rig.P&&rig.P.fem,emo:o.emo||rig.emoN,radio:o.radio});const dur=VZ?VZ.dur:txt.length/(o.cps||16);
  if(!o.sub){const c=o.lado==="q"?this.$.q:this.$.a;(o.lado==="q"?this.$.qWho:this.$.aWho).innerHTML=`<em>${esc(o.nome)}</em>${o.cargo?` · ${esc(o.cargo)}`:""}`;
    if(o.lado==="q"){el=this.$.qTxt}else{this.$.aBody.innerHTML=`<p></p>`;el=this.$.aBody.firstChild}c.classList.add("on")}
  rig.fala.on=true;rig.fala.txt=VZ?VZ.boca:txt;
  while(this.vivo){const k=g!==this.T.gen?1:Math.min(1,(this.T.t-t0)/dur);if(g!==this.T.gen&&VZ)VZ.para();rig.fala.i=VZ?VZ.indice():k*txt.length;if(el){const n=Math.floor(k*txt.length);let c=txt.indexOf(" ",n);if(c<0||k>=1)c=txt.length;el.textContent=txt.slice(0,c)}
    else this.legenda(txt,o.nome,k);if(k>=1)break;await this.espera(.03)}
  rig.fala.on=false;await this.espera(o.pausa!=null?o.pausa:.9)};
PP.cala=function(){this.$.sub.classList.remove("on");this.$.q.classList.remove("on");this.$.a.classList.remove("on")};
PP.chips=function(lista){if(!lista||!lista.length)return;const fx=document.createElement("div");fx.className="fx";lista.forEach(f=>{const s=document.createElement("span");s.className=f[1];s.textContent=f[0];fx.appendChild(s)});
  this.$.aBody.appendChild(fx);this.$.a.classList.add("on");if(!this.$.aWho.textContent)this.$.aWho.innerHTML="<em>Efeitos</em>";[...fx.children].forEach((s,i)=>setTimeout(()=>s.classList.add("on"),200+i*220))};
PP.escolhe=function(titulo,ops){return new Promise(res=>{const $=this.$;$.pT.textContent=titulo;$.pOpts.innerHTML="";
  ops.forEach((op,i)=>{const b=document.createElement("button");b.className="opt";b.innerHTML=`<kbd>${i+1}</kbd><b style="color:${op.c||"#fff"}">${esc(op.t)}</b><span>${esc(op.d||"")}</span>`;b.onclick=()=>fim(i);$.pOpts.appendChild(b)});
  $.painel.classList.add("on");let feito=false;const fim=i=>{if(feito)return;feito=true;this.escolha=null;$.pOpts.children[i].classList.add("esc");setTimeout(()=>{$.painel.classList.remove("on");res(i)},450)};this.escolha={n:ops.length,fim}})};
PP.lugar=function(t){const i=this.no.querySelector(".bug i");if(i)i.textContent=t};
PP.letreiro=function(b,s,on){this.$.sB.textContent=b||"";this.$.sS.textContent=s||"";this.$.sS.style.display=s?"":"none";this.$.strap.classList.toggle("on",on!==false)};

// ---------- montagem: a cena continua viva mesmo se a tela for redesenhada
const VIVAS={};
function mostra(host,chave,fab){if(!host)return null;const cat=chave.split(":")[0];for(const k in VIVAS)if(k!==chave&&k.split(":")[0]===cat){VIVAS[k].para();delete VIVAS[k]}
  let p=VIVAS[chave];if(!p||!p.vivo){p=fab();if(!p)return null;VIVAS[chave]=p;host.appendChild(p.no);p.laco();if(p.roteiro)p.roteiro().catch(e=>console.warn("cena",e));return p}
  host.appendChild(p.no);p.laco();return p}
function janela(p,titulo,botao,aoFechar){estilo();const bg=document.createElement("div");bg.className="cnov";bg.setAttribute("role","dialog");bg.setAttribute("aria-modal","true");bg.setAttribute("aria-label",titulo);
  bg.innerHTML=`<div class="cnbox"><h2>${esc(titulo)}</h2><div class="cnhost"></div><div class="cnfim"><button class="btn go" data-cnf="1">${esc(botao||"Continuar")}</button></div></div>`;document.body.appendChild(bg);
  bg.querySelector(".cnhost").appendChild(p.no);p.laco();if(p.roteiro)p.roteiro().catch(e=>console.warn("cena",e));
  const fecha=()=>{p.para();bg.remove();window.removeEventListener("keydown",esc_);if(aoFechar)aoFechar()};const esc_=e=>{if(e.key==="Escape")fecha()};window.addEventListener("keydown",esc_);
  bg.querySelector("[data-cnf]").onclick=fecha;p.fechaJanela=fecha;return p}

// ---------- uniformes e pessoas
function uniDe(d,teamId){const t=typeof teamOf==="function"?teamOf(teamId||(d&&d.team)):null;const u=AV().uniformeDe(d&&teamId?{...d,team:teamId}:d);if(t){u.cor=t.c;u.cor2=t.c2||"#E9ECEF";u.equipe=t.n}return u}
function uniEquipe(t){const sp=AV().patrociniosDe(t);return{cor:t?t.c:"#3A3E45",cor2:t?(t.c2||"#E9ECEF"):"#E9ECEF",acento:sp&&sp.m?sp.m.c:"#00B4D8",sp,equipe:t?t.n:""}}
function rostoD(d){return d&&d.id===G.me?AV().rostoJogador():AV().rostoPiloto(d)}

// ---------- cenários
function selos(lista,claro,op){const r=[];let k=0;for(let rr=-1;rr<9;rr++)for(let c=-1;c<7;c++)r.push(AV().selo(lista[((k++ +rr*3)%lista.length+lista.length)%lista.length],c*300+(rr%2?150:0)+60,rr*120+40,40,claro?"#111316":"#FFFFFF"));return`<g opacity="${op||1}">${r.join("")}</g>`}
function marcas(t){const sp=AV().patrociniosDe(t);const C=typeof SPONSOR_CAT!=="undefined"?SPONSOR_CAT:[];return[sp.m,sp.s,...C.slice(0,5),{n:"Liga Paddock",c:"#FF4D2E",c2:"#FFFFFF",mk:"play"}].filter(Boolean)}
function fParede(p,lista){return`<g filter="${p.u("bl")}"><rect width="1600" height="900" fill="#EEF0F3"/>${selos(lista,true)}</g><rect width="1600" height="900" fill="${p.u("sp")}"/>`}
function fMotorhome(p,t){const c=t.c,esc2=AV().tom(c,-.62);return`<rect width="1600" height="900" fill="${esc2}"/><rect y="0" width="1600" height="900" fill="${AV().tom(c,-.48)}" opacity=".5"/>
  ${[0,1,2,3].map(i=>`<rect x="${120+i*360}" y="90" width="300" height="360" rx="6" fill="#BFD4E6" opacity=".22"/><rect x="${120+i*360}" y="90" width="300" height="360" rx="6" fill="none" stroke="${AV().tom(c,-.2)}" stroke-width="10"/>`).join("")}
  <text x="800" y="760" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="420" fill="${AV().tom(c,-.35)}" opacity=".45">${esc(String(t.n).slice(0,1).toUpperCase())}</text>
  <rect y="600" width="1600" height="300" fill="#0F1115" opacity=".55"/><rect width="1600" height="900" fill="${p.u("sp")}" opacity=".6"/>`}
function fComissarios(p){return`<rect width="1600" height="900" fill="#2A2420"/>${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${i*210-20}" y="0" width="200" height="900" fill="#332B25" opacity="${i%2?.6:.9}"/>`).join("")}
  <rect x="1180" y="120" width="360" height="220" rx="8" fill="#0B0D12"/><path d="M1210 300 C1280 200 1360 300 1430 220 S1510 180 1520 160" stroke="#3C4250" stroke-width="22" fill="none"/><circle cx="1360" cy="262" r="12" fill="#FF4D2E"/><circle cx="1395" cy="244" r="12" fill="#3A86FF"/>
  <rect width="1600" height="900" fill="${p.u("sp")}" opacity=".7"/>`}
function fSalaPodio(p){return`<rect width="1600" height="900" fill="#20242C"/><rect y="560" width="1600" height="340" fill="#15181E"/>
  <rect x="620" y="40" width="360" height="200" rx="10" fill="#0A0C10"/><path d="M645 210 C700 110 780 210 850 130 S950 100 960 90" stroke="#3C4250" stroke-width="16" fill="none"/>
  <g opacity=".12">${[0,1,2,3,4].map(i=>`<text x="${120+i*340}" y="500" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="40" fill="#fff">LIGA PADDOCK</text>`).join("")}</g>
  <rect width="1600" height="900" fill="${p.u("sp")}" opacity=".6"/>`}
function fPodio(p,noite){const ceu=noite?["#0B1530","#1C2E5A"]:["#5C94D6","#BBD8F2"];return`<defs><linearGradient id="${p.id}ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ceu[0]}"/><stop offset="1" stop-color="${ceu[1]}"/></linearGradient></defs>
  <rect width="1600" height="900" fill="url(#${p.id}ceu)"/>${[...Array(80)].map((_,i)=>`<circle cx="${(i*97)%1600}" cy="${560+((i*53)%120)}" r="${10+(i%4)*3}" fill="${["#1F2633","#2A3140","#343B4C","#C1121F","#FFD400"][i%5]}" opacity=".9"/>`).join("")}
  <rect y="600" width="1600" height="300" fill="#12151B"/><rect x="200" y="96" width="1200" height="70" rx="6" fill="#FF4D2E"/><text x="800" y="146" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="44" fill="#fff" letter-spacing="3">LIGA PADDOCK · PÓDIO</text>`}
function fGaragem(p,t){const c=t.c;return`<rect width="1600" height="900" fill="${AV().tom(c,-.55)}"/><rect y="120" width="1600" height="40" fill="${c}" opacity=".7"/>
  ${[0,1,2,3,4,5].map(i=>`<rect x="${60+i*260}" y="420" width="200" height="300" rx="8" fill="#1B1E24"/>${[0,1,2,3].map(j=>`<rect x="${72+i*260}" y="${436+j*70}" width="176" height="54" rx="4" fill="#2A2F38"/>`).join("")}`).join("")}
  ${[0,1,2,3].map(i=>`<circle cx="${1400}" cy="${780-i*70}" r="62" fill="#111"/><circle cx="1400" cy="${780-i*70}" r="30" fill="#333"/>`).join("")}<rect width="1600" height="900" fill="${p.u("sp")}" opacity=".6"/>`}
function fEstudio(p,sp){const c=sp&&sp.c||"#FF4D2E";return`<rect width="1600" height="900" fill="${AV().tom(c,-.55)}"/><circle cx="800" cy="420" r="560" fill="${c}" opacity=".35"/>${sp?AV().selo(sp,800,180,90,"#FFFFFF"):""}
  ${[260,1340].map(x=>`<path d="M${x} 900 L${x} 360" stroke="#111" stroke-width="10"/><rect x="${x-60}" y="300" width="120" height="80" rx="10" fill="#222"/><circle cx="${x}" cy="340" r="26" fill="#FFF6D8"/>`).join("")}`}
function fEscritorio(p,t){return`<rect width="1600" height="900" fill="#1A1E26"/><rect x="100" y="80" width="1400" height="440" rx="8" fill="#2B4566"/>${[...Array(18)].map((_,i)=>`<rect x="${130+i*76}" y="${260+(i*37)%140}" width="56" height="${260-(i*37)%140}" fill="#16243A"/>`).join("")}
  <rect x="100" y="80" width="1400" height="440" rx="8" fill="none" stroke="#0D1016" stroke-width="16"/><text x="1440" y="140" text-anchor="end" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="54" fill="${t?t.c:"#fff"}" opacity=".85">${esc(t?t.n:"")}</text>
  <rect width="1600" height="900" fill="${p.u("sp")}" opacity=".55"/>`}
function mesa(y,cor){return`<rect x="0" y="${y}" width="1600" height="${900-y}" fill="${cor||"#0B0E15"}"/><rect x="0" y="${y}" width="1600" height="6" fill="#2C3346"/>`}
function trofeu(p,x,y,s){return`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-70 -150 L70 -150 C70 -40 30 0 0 10 C-30 0 -70 -40 -70 -150Z" fill="${p.u("ou")}"/><path d="M-70 -130 C-130 -130 -120 -50 -60 -50 M70 -130 C130 -130 120 -50 60 -50" stroke="${p.u("ou")}" stroke-width="16" fill="none"/>
  <rect x="-14" y="8" width="28" height="60" fill="${p.u("ou")}"/><rect x="-60" y="66" width="120" height="30" rx="6" fill="#3A2B12"/><rect x="-70" y="94" width="140" height="22" rx="4" fill="${p.u("ou")}"/></g>`}

// ---------- 1. reunião técnica: chefe e engenheiro reagem à sua leitura dos dados
function cenaReuniao(){const t=myTeam();if(!t)return null;const p=new Palco({classe:"cnmini",local:"Motorhome · reunião técnica",marca:String(t.n).toUpperCase(),acento:uniEquipe(t).acento,barra:false});
  p.fundo(fMotorhome(p,t));const u=uniEquipe(t);
  const chefe=p.rig(AV().pessoa(t.boss||"Chefe",{idade:50}),{...u,roupa:"polo",cracha:true,x:560,y:170,s:.8});const eng=p.rig(AV().pessoa(G.engineer||"Bruno"),{...u,roupa:"polo",fone:true,x:1080,y:215,s:.72});
  chefe.olhar(3,1,.2);eng.olhar(-3,1,-.2);const nomeC=t.boss||"Chefe",nomeE=G.engineer||"Engenheiro";
  p.roteiro=async function(){let visto="";while(this.vivo){const M=UI.meet;if(!M){await this.espera(.4);continue}const k=M.stage+"|"+(M.guess||"")+"|"+(M.chosen?M.chosen.id:"");
    if(k!==visto){visto=k;
      if(M.chosen){if(M.over){await this.diz(chefe,{sub:true,nome:nomeC,emo:"irritado",texto:"Desta vez vamos do meu jeito. Confiança se conquista na pista."});eng.emo("serio")}
        else{await this.diz(chefe,{sub:true,nome:nomeC,emo:"confiante",texto:"Fechado. A fábrica começa hoje."});await this.diz(eng,{sub:true,nome:nomeE,emo:"feliz",texto:"Vou passar os números para o pessoal agora mesmo."})}}
      else if(M.stage===2){const ok=M.guess===M.rep.worst;if(M.guess==="auto")await this.diz(eng,{sub:true,nome:nomeE,emo:"serio",texto:"Deixa com a gente. Os dados não mentem."});
        else if(ok){eng.emo("feliz");await this.diz(chefe,{sub:true,nome:nomeC,emo:"feliz",texto:"É isso mesmo. Você leu os dados melhor que muita gente aqui."})}
        else{eng.emo("pensativo");await this.diz(chefe,{sub:true,nome:nomeC,emo:"pensativo",texto:"Não é o que a telemetria mostra. Mas é bom ver você atento."})}}
      else{await this.diz(chefe,{sub:true,nome:nomeC,emo:"serio",texto:"Vamos direto ao ponto: onde o carro está perdendo mais tempo?"});await this.diz(eng,{sub:true,nome:nomeE,emo:"neutro",texto:"Os dados estão na tela. Quero ouvir a sua leitura."})}
      this.cala()}await this.espera(.3)}};return p}

// ---------- 2. sala dos comissários
const COMISSARIOS=["Henrique Salles","Margaret Doyle","Kenji Arai"];
function cenaComissarios(inc){const p=new Palco({classe:"cnmini",local:"Sala dos comissários",marca:"DIREÇÃO DE PROVA",acento:"#FFD34D",barra:false});p.fundo(fComissarios(p));
  const r=COMISSARIOS.map((n,i)=>p.rig(AV().pessoa(n,{idade:55}),{roupa:"terno",gravata:["#8A1C1C","#1E3A8A","#0F5132"][i],x:[440,800,1160][i],y:[150,110,150][i],s:[.7,.76,.7][i]}));
  p.frente(mesa(640,"#1A140F")+`<rect x="60" y="672" width="420" height="56" rx="6" fill="#E9ECEF"/><text x="270" y="712" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="800" font-size="28" fill="#15171B">COMISSÁRIOS DESPORTIVOS</text>`);
  r.forEach(x=>{x.emo("serio");x.olhar(0,2,0)});const me=ME();const ph=["na reta","na freada","no meio da curva"][inc&&inc.ev?inc.ev.phase:0]||"na pista";
  p.roteiro=async function(){if(!inc.verdict){r[0].olhar(4,1,.2);r[2].olhar(-4,1,-.2);await this.diz(r[1],{sub:true,nome:COMISSARIOS[1],emo:"serio",texto:`Senhor ${sur(me.n)}, conte o que aconteceu ${ph}.`});this.cala();r[0].olhar(0,2,0);r[2].olhar(0,2,0)}
    while(this.vivo&&!inc.verdict)await this.espera(.3);if(!this.vivo)return;const v=inc.verdict;const bom=v.cls==="good",ruim=v.cls==="bad";
    r.forEach(x=>x.emo(bom?"neutro":ruim?"serio":"pensativo"));r[0].olhar(4,0,.15);r[2].olhar(-4,0,-.15);await this.espera(.6);
    await this.diz(r[1],{sub:true,nome:COMISSARIOS[1],emo:bom?"neutro":"serio",texto:`Decisão: ${String(v.title||"").replace(/\.$/,"")}.`});r[1].emo(bom?"feliz":"serio")};return p}

// ---------- 3. sala antes do pódio + cerimônia
function cenaPodio(res){const top=res.cls.filter(x=>x.status==="ok").slice(0,3);if(top.length<3)return null;const ds=top.map(x=>G.drivers[x.d]);const meI=ds.findIndex(d=>d.id===G.me);if(meI<0)return null;
  const p=new Palco({local:"Sala antes do pódio",acento:"#FFD34D",dica:"Os três primeiros esperam para subir ao pódio"});p.fundo(fSalaPodio(p));
  const pos=[{x:800,y:120,s:.66},{x:430,y:150,s:.6},{x:1170,y:150,s:.6}];const rg=ds.map((d,i)=>p.rig(rostoD(d),{...uniDe(d,top[i].team),...pos[i]}));
  const me=ds[meI],outros=ds.filter(d=>d!==me);const rv=outros.find(d=>d.id===G.rival)||outros[0];const rvR=rg[ds.indexOf(rv)],meR=rg[meI];
  rg.forEach((r,i)=>r.emo(i===0?"feliz":"neutro"));
  p.roteiro=async function(){this.letreiro(ds[0].n,"Vencedor · "+(typeof teamOf==="function"?teamOf(top[0].team).n:""));await this.espera(2.6);this.letreiro("","",false);
    rg.forEach((r,i)=>r.olhar(i===1?5:i===2?-5:0,1,i===1?.3:i===2?-.3:0));await this.espera(1);
    const k=await this.escolhe("O que você faz na sala de espera?",[{t:"Cumprimentar os dois",d:"Aperto de mão e parabéns",c:"#5BE39A"},{t:`Provocar ${sur(rv.n)}`,d:"Uma alfinetada antes do pódio",c:"#FF8A7A"},{t:"Ficar na sua",d:"Água, toalha e silêncio",c:"#9AA0AA"}]);
    if(!this.vivo)return;let fx=[];
    if(k===0){outros.forEach(d=>relAdd(d.id,3));fameAdd(0,1);meR.emo("feliz");await this.diz(meR,{lado:"a",nome:me.n,texto:"Corridaça. Parabéns aos dois.",emo:"feliz"});rg.forEach(r=>{if(r!==meR)r.emo("feliz")});fx=[["Relação com os dois +3","up"],["Respeito +1","up"]]}
    else if(k===1){relAdd(rv.id,-5);fameAdd(3,-1);heatAdd(3);await this.diz(meR,{lado:"a",nome:me.n,texto:me===ds[0]?`Hoje você só viu o meu aerofólio, ${sur(rv.n)}.`:`Na próxima eu não te deixo respirar, ${sur(rv.n)}.`,emo:"convencido"});rvR.emo("irritado");await this.espera(.8);rvR.emo("revira");fx=[[`Relação com ${sur(rv.n)} −5`,"dn"],["Popularidade +3","up"],["Polêmica ↑","dn"]]}
    else{ME().morale=Math.min(100,(ME().morale||50)+1);meR.emo("pensativo");meR.olhar(-3,3,-.1);await this.espera(1.6);fx=[["Moral +1","up"]]}
    this.chips(fx);if(typeof save==="function")save();await this.espera(2.6);this.cala();
    // cerimônia
    this.lugar("Cerimônia do pódio");this.fundo(fPodio(this,!!(R&&R.C&&R.C.night)));const deg=[{x:800,y:555},{x:520,y:605},{x:1080,y:635}].map(d=>({x:d.x,y:d.y-.22*2010,s:.22}));
    // no pódio os três aparecem de corpo inteiro, em cima dos degraus
    rg.forEach(r=>r.remove());this.rigs=[];const cb=ds.map((d,i)=>this.corpo(rostoD(d),{...uniDe(d,top[i].team),nome:d.n,roupa:"macacao",...deg[i]}));rg.splice(0,3,...cb);
    this.frente(`<rect x="680" y="555" width="240" height="345" fill="#E9ECEF"/><rect x="400" y="605" width="240" height="295" fill="#D7DBE0"/><rect x="960" y="635" width="240" height="265" fill="#D7DBE0"/>
      ${[["1",800,640],["2",520,690],["3",1080,720]].map(([n,x,y])=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-size="72" fill="#15171B">${n}</text>`).join("")}`);
    const nat=typeof NAT_NAME!=="undefined"?NAT_NAME[ds[0].nat]||ds[0].nat:ds[0].nat;rg.forEach(r=>{r.emo("neutro");r.olhar(0,-2,0)});this.letreiro("Hino de "+nat,"Pódio · "+(R&&R.C?R.C.gp:""));this.rajada=8;await this.espera(3.4);this.letreiro("","",false);
    rg.forEach(r=>r.emo("rindo"));rg[0].pose&&rg[0].pose("trofeu");await this.espera(1.2);rg.forEach(r=>r.pose&&r.pose("comemora"));this.confete(140,["#FF4D2E","#FFD34D","#00B4D8","#FFFFFF","#5BE39A"]);this.rajada=14;await this.espera(.5);
    for(let i=0;i<3&&this.vivo;i++){const a=this.mao(rg[0],i%2?"d":"e"),b=this.mao(rg[1],"d"),c=this.mao(rg[2],"e");this.espuma(a[0],a[1],i%2?1:-1);this.espuma(b[0],b[1],1);this.espuma(c[0],c[1],-1);await this.espera(.7)}
    await this.espera(2);rg.forEach(r=>r.emo("feliz"))};return p}

// ---------- 4. companheiro de equipe depois da ordem de equipe
function cenaCompanheiro(to){const m=typeof mate==="function"?mate():null;if(!m)return null;const t=myTeam();const p=new Palco({local:"Garagem · depois da corrida",marca:String(t.n).toUpperCase(),acento:uniEquipe(t).acento,dica:`Conversa com ${m.n}`});
  p.fundo(fGaragem(p,t));const mr=p.rig(rostoD(m),{...uniDe(m),x:1000,y:60,s:.82});const meR=p.rig(AV().rostoJogador(),{...uniDe(ME()),x:470,y:120,s:.74});meR.olhar(5,0,.35);mr.olhar(-5,0,-.35);
  p.roteiro=async function(){if(to.obeyed){mr.emo("feliz");await this.diz(mr,{lado:"q",nome:m.n,texto:"Valeu por abrir hoje. Fico te devendo essa.",emo:"feliz"});relAdd(m.id,2);this.chips([[`Relação com ${sur(m.n)} +2`,"up"]]);if(typeof save==="function")save();return}
    await this.diz(mr,{lado:"q",nome:m.n,texto:`A equipe pediu para você me deixar passar na volta ${to.lap}. Eu estava mais rápido.`,emo:"irritado"});
    const k=await this.escolhe("Como você responde?",[{t:"Pedir desculpas",d:"Reconhecer e seguir em frente",c:"#5BE39A"},{t:"Bater de frente",d:"Você também não estava tão rápido",c:"#FF8A7A"},{t:"Deixar pra lá",d:"Dar de ombros e ir embora",c:"#9AA0AA"}]);if(!this.vivo)return;
    if(k===0){relAdd(m.id,6);G.trust=Math.min(100,G.trust+2);await this.diz(meR,{lado:"a",nome:ME().n,texto:"Você tem razão. Errei na hora. Na próxima eu cumpro.",emo:"triste"});mr.emo("neutro");await this.diz(mr,{lado:"q",nome:m.n,texto:"Beleza. Página virada.",emo:"neutro"});this.chips([[`Relação com ${sur(m.n)} +6`,"up"],["Confiança da equipe +2","up"]])}
    else if(k===1){relAdd(m.id,-8);heatAdd(3);ME().morale=Math.min(100,(ME().morale||50)+2);await this.diz(meR,{lado:"a",nome:ME().n,texto:"Mais rápido? Você ficou duas voltas atrás de mim sem chegar perto.",emo:"irritado"});mr.emo("irritado");await this.espera(.6);mr.emo("revira");this.chips([[`Relação com ${sur(m.n)} −8`,"dn"],["Polêmica ↑","dn"],["Moral +2","up"]])}
    else{relAdd(m.id,-3);meR.emo("pensativo");meR.olhar(-6,2,-.3);await this.espera(1.2);mr.emo("irritado");this.chips([[`Relação com ${sur(m.n)} −3`,"dn"]])}
    if(typeof save==="function")save()};return p}

// ---------- 5. negociação de contrato: o rosto do diretor entrega quanto ainda dá para pedir
function folga(o){if(o.neg&&o.neg.f!=null)return o.neg.f;const h=AV().hsh(o.team+":"+G.season+":"+o.salary);o.neg={f:.04+(h%27)/100,t:0};return o.neg.f}
function cenaNegocio(i){const o=G.offers[i];if(!o)return null;const t=teamOf(o.team);const p=new Palco({local:"Negociação de contrato",marca:String(t.n).toUpperCase(),acento:uniEquipe(t).acento,barra:false});p.fundo(fEscritorio(p,t));
  const nome=t.boss||"Diretor";const dir=p.rig(AV().pessoa(nome,{idade:52}),{roupa:"terno",gravata:t.c,x:800,y:90,s:.84});p.frente(mesa(700,"#14100C"));const f=folga(o);
  const tell=()=>{dir.emo(f>=.18?"convencido":f>=.1?"pensativo":"serio");dir.olhar(f>=.18?0:f>=.1?-4:3,f>=.1&&f<.18?-2:1,f>=.1&&f<.18?-.2:0)};
  p.roteiro=async function(){await this.diz(dir,{lado:"q",nome,cargo:t.n,emo:"neutro",texto:`${o.years} ano${o.years>1?"s":""}, ${money(o.salary)} por ano, como ${o.role}. É uma proposta justa.`});
    while(this.vivo&&G.offers.includes(o)){tell();const k=await this.escolhe("Leia o rosto dele e decida",[{t:"Aceitar como está",d:`${money(o.salary)}/ano`,c:"#5BE39A"},{t:"Pedir +10%",d:"Um ajuste no salário",c:"#FFD34D"},{t:"Pedir +25%",d:"Pressão alta",c:"#FF8A7A"},{t:"Mais um ano",d:"Contrato mais longo",c:"#6EC1FF"}]);if(!this.vivo)return;
      if(k===0){await this.diz(dir,{lado:"q",nome,emo:"feliz",texto:"Excelente. Bem-vindo à equipe."});if(this.fechaJanela)this.fechaJanela();acceptOffer(o);if(typeof render==="function")render();return}
      if(k===3){if(f>=.12){o.years++;o.neg.f=Math.max(.02,f-.05);await this.diz(dir,{lado:"q",nome,emo:"neutro",texto:`Tudo bem. ${o.years} anos.`})}else{await this.diz(dir,{lado:"q",nome,emo:"serio",texto:"Não posso garantir isso agora."})}continue}
      const ask=k===1?.1:.25;o.neg.t++;
      if(ask<=f+1e-6){o.salary=Math.round(o.salary*(1+ask)*100)/100;o.neg.f=Math.max(0,f-ask);await this.diz(dir,{lado:"q",nome,emo:"pensativo",texto:`Hmm. Está bem: ${money(o.salary)} por ano.`});if(typeof save==="function")save();if(typeof render==="function")render();continue}
      if(ask-f<.09&&o.neg.t<3){await this.diz(dir,{lado:"q",nome,emo:"serio",texto:"Esse é o meu limite. Não passo disso."});continue}
      await this.diz(dir,{lado:"q",nome,emo:"irritado",texto:"Então não temos acordo. Boa sorte."});G.offers.splice(G.offers.indexOf(o),1);if(typeof news==="function")news(`A ${t.n} retirou a proposta depois de uma negociação dura.`,"bad");if(typeof save==="function")save();if(typeof render==="function")render();return}};return p}

// ---------- 6. anúncio da contratação
function cenaAnuncio(o){const t=teamOf(o.team);const me=ME();const p=new Palco({local:"Anúncio oficial",marca:String(t.n).toUpperCase(),acento:uniEquipe(t).acento,flashes:true,barra:false});
  p.fundo(fParede(p,marcas(t)));const r=p.corpo(AV().rostoJogador(),{...uniDe(me,o.team),nome:me.n,roupa:"macacao",pose:"acena",x:800,y:880-.4*2010,s:.4});
  p.roteiro=async function(){r.emo("feliz");this.rajada=12;this.letreiro(me.n,`Novo piloto da ${t.n} · ${G.year+1}`);await this.espera(2.4);
    await this.diz(r,{sub:true,nome:me.n,emo:"feliz",texto:`Estou muito feliz por esse novo capítulo com a ${t.n}. Vamos trabalhar forte desde o primeiro dia.`});this.letreiro("","",false);r.emo("confiante");if(r.pose)r.pose("joia");this.rajada=6};return p}

// ---------- 7. gravação do comercial do patrocinador
const SLOGAN={"logística":"chega antes de todo mundo. Igual eu na largada.","bebida energética":"quando a luz apaga, eu preciso de energia.","games e streaming":"onde a corrida continua depois da bandeirada.","fones de ouvido":"o único barulho mais alto que o motor.",
  moda:"estilo de quem sobe no pódio.","energia solar":"energia limpa, ritmo de corrida.","banco digital":"rápido como um pit stop.","relógios de luxo":"cada milésimo conta.","combustível e lubrificantes":"o que move o meu carro.","telefonia e internet":"sinal forte até na última volta.",
  tecnologia:"os dados que me deixam mais rápido.","seguros":"porque na pista eu arrisco. Fora dela, não.","companhia aérea":"de corrida em corrida, pelo mundo.","refrigerante":"a comemoração depois da bandeira quadriculada.","carros de rua":"um pouco da pista na sua garagem.",
  saúde:"cuidar do corpo também é ganhar corrida.","café":"o primeiro pit stop do dia.","turismo":"o mundo inteiro é a minha pista."};
function cenaComercial(o){const s=(typeof SPONS!=="undefined"&&SPONS.find(x=>x.id===o.id))||{n:o.n||"Patrocinador",c:"#FF4D2E",sec:""};const cat=(typeof SPONSOR_CAT!=="undefined"&&SPONSOR_CAT.find(x=>x.id===s.id))||{...s,c2:"#FFFFFF",mk:"diamond"};
  const me=ME();const p=new Palco({local:"Gravação do comercial",marca:s.n.toUpperCase(),acento:s.c,barra:false});p.fundo(fEstudio(p,cat));const r=p.corpo(AV().rostoJogador(),{...uniDe(me),nome:me.n,roupa:"macacao",pose:"cintura",x:800,y:890-.43*2010,s:.43});
  p.frente(`<g class="clap"><rect x="60" y="640" width="300" height="190" rx="8" fill="#111"/><path d="M60 640 L360 640 L340 590 L40 590Z" fill="#F2F3F5"/><text x="210" y="740" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-size="40" fill="#fff">TAKE 1</text></g>`);
  p.roteiro=async function(){r.emo("neutro");this.legenda("Silêncio no estúdio... Ação!","Diretor",1);await this.espera(1.8);this.cala();
    if(r.pose)r.pose("pe");await this.diz(r,{sub:true,nome:me.n,emo:"confiante",texto:`${s.n}: ${SLOGAN[s.sec]||"comigo na pista e fora dela."}`});r.emo("rindo");if(r.pose)r.pose("joia");await this.espera(.6);
    this.legenda("Corta! Ficou ótimo. Primeiro take, hein?","Diretor",1);await this.espera(2.2);this.cala();r.emo("feliz")};return p}

// ---------- 8. título mundial
function cenaTitulo(){const me=ME(),t=myTeam();const p=new Palco({local:"Campeão mundial",marca:"LIGA PADDOCK",acento:"#FFD34D",flashes:true,dica:"O momento da carreira"});p.fundo(fPodio(p,true));
  const u=uniEquipe(t);const pm=AV().pessoa("Mecânico "+t.id+"1");pm.bone=true;const mc=[p.corpo(pm,{...u,nome:"",roupa:"polo",pose:"comemora",x:470,y:880-.3*2010,s:.3}),p.corpo(AV().pessoa("Mecânica "+t.id+"2",{fem:true}),{...u,nome:"",roupa:"polo",pose:"acena",x:1130,y:880-.3*2010,s:.3})];
  const r=p.corpo(AV().rostoJogador(),{...uniDe(me),nome:me.n,roupa:"macacao",pose:"trofeu",x:800,y:890-.37*2010,s:.37});p.frente(`<rect y="860" width="1600" height="40" fill="#0B0D12"/>`);
  p.roteiro=async function(){[r,...mc].forEach(x=>x.emo("rindo"));this.letreiro(me.n,`Campeão mundial ${G.year}`);this.confete(220,["#FFD34D","#FFFFFF","#FF4D2E",u.cor,u.cor2]);this.rajada=16;await this.espera(2.8);
    await this.diz(r,{sub:true,nome:me.n,emo:"rindo",texto:"A gente conseguiu! Isso é de cada pessoa dessa equipe. Campeões do mundo!"});if(r.pose)r.pose("comemora");this.confete(160,["#FFD34D","#FFFFFF",u.cor]);this.rajada=10;this.letreiro(me.n,`Campeão mundial ${G.year}`);await this.espera(2.5);if(r.pose&&this.vivo)r.pose("trofeu")};return p}

// ---------- 9. foto da manchete
function foto(emo,tipo){if(!GL.AV)return"";const svg=document.createElementNS(NS,"svg");svg.setAttribute("viewBox","-330 170 660 495");svg.setAttribute("preserveAspectRatio","xMidYMid slice");
  const me=ME();const t=myTeam();const bg=document.createElementNS(NS,"g");bg.innerHTML=tipo==="pre"?`<rect x="-330" y="170" width="660" height="495" fill="#1B2540"/>`:`<rect x="-330" y="170" width="660" height="495" fill="#E9ECEF"/>${marcas(t).slice(0,4).map((s,i)=>AV().selo(s,-200+(i%2)*400,230+Math.floor(i/2)*200,34,"#111316")).join("")}`;svg.appendChild(bg);
  const r=new (AV().Rig)(svg,AV().rostoJogador(),{...uniDe(me),x:0,y:0,s:1});r.emo(emo||"neutro");for(let i=0;i<60;i++)r.tick(.05,i*.05);
  const fl=document.createElementNS(NS,"g");fl.innerHTML=`<circle cx="280" cy="230" r="160" fill="#fff" opacity=".35"/><circle cx="280" cy="230" r="60" fill="#fff" opacity=".5"/>`;svg.appendChild(fl);return svg.outerHTML}

// ---------- 10. clipe vertical para as redes
function cenaClipe(c){const me=ME(),t=myTeam();const p=new Palco({classe:"vert",local:"",marca:"PADDOCK",aoVivo:false,acento:uniEquipe(t).acento,dica:"Clipe da entrevista"});
  if(c.tipo==="pre"){p.fundo(`<rect width="1600" height="900" fill="#1B2540"/>${selos(marcas(t),false,.14)}`)}else p.fundo(fParede(p,marcas(t)));
  const r=p.rig(AV().rostoJogador(),{...uniDe(me),x:800,y:30,s:1});
  p.roteiro=async function(){while(this.vivo){r.emo("ouvindo");this.legenda(c.q,"Pergunta",1);await this.espera(2.6);this.cala();await this.diz(r,{sub:true,nome:me.n,emo:c.e||"confiante",texto:c.t});this.cala();
    this.letreiro(`#${String(c.gp||"F1").replace(/^GP (de |do |da |dos |das )?/,"").replace(/\s+/g,"")}`,"Entrevista completa no perfil");await this.espera(3);this.letreiro("","",false);await this.espera(1)}};return p}

// ---------- 11. rádio com o rosto do engenheiro (durante a corrida)
const RAD={rig:null,ult:null,svg:null,t:0,fim:0};
function humorDo(t){t=String(t).toLowerCase();if(/perfeit|boa|isso!|excelente|ótim|parab|vitória|pódio|ganh|melhor volta/.test(t))return"feliz";if(/punição|investiga|limites|cuidado|chuva|dano|problema|furo|batida|abandon|bandeira amarela|safety/.test(t))return"serio";if(/box|pneu|parada/.test(t))return"confiante";return"neutro"}
function radioRosto(){try{const f=document.getElementById("rfeed");if(!f||!GL.AV)return;const card=f.closest(".card");if(!card||card.querySelector(".cnrad"))return;estilo();const t=myTeam(),u=uniEquipe(t);const h=card.querySelector("h3");
    const w=document.createElement("div");w.className="cnrad";const svg=document.createElementNS(NS,"svg");svg.setAttribute("viewBox","-150 205 300 300");svg.setAttribute("aria-hidden","true");w.appendChild(svg);
    const tx=document.createElement("div");tx.innerHTML=`<small>Engenheiro de corrida</small><b>${esc(G.engineer||"Engenheiro")}</b>`;w.appendChild(tx);
    if(h){h.style.display="none";card.insertBefore(w,h)}RAD.rig=new (AV().Rig)(svg,AV().pessoa(G.engineer||"Bruno"),{...u,roupa:"polo",fone:true,x:0,y:0,s:1});RAD.svg=svg;RAD.ult=R&&R.radio?R.radio[0]:null;
    let ult=performance.now(),acc=0;const q=n=>{if(!svg.isConnected){RAD.rig=null;return}const dt=Math.max(0,Math.min(.1,(n-ult)/1000));ult=n;acc+=dt;RAD.t+=dt;
      const m=R&&R.radio?R.radio[0]:null;if(m&&m!==RAD.ult){RAD.ult=m;const meC=R.cars.find(c=>c.isP);if(!meC||m.c===meC.id){const deEng=!m.me;const fala=String(m.t).replace(/^[^:"]{1,24}:\s*/,"").replace(/^"|"$/g,"");
          const VZ=GL.VOZJ&&GL.VOZJ.fala(fala,{nome:deEng?(G.engineer||"Engenheiro"):ME().n,jogador:!deEng,fem:deEng&&RAD.rig.P?RAD.rig.P.fem:undefined,radio:true,emo:humorDo(m.t)});
          if(deEng){RAD.rig.emo(humorDo(m.t));RAD.rig.fala.on=true;RAD.vz=VZ;RAD.rig.fala.txt=VZ?VZ.boca:String(m.t);RAD.rig.fala.i=0;RAD.fim=String(m.t).length/16}}}
      if(RAD.rig.fala.on){RAD.rig.fala.i=RAD.vz?RAD.vz.indice():RAD.rig.fala.i+dt*16;if(RAD.rig.fala.i>=RAD.rig.fala.txt.length-.01){RAD.rig.fala.on=false;RAD.vz=null;setTimeout(()=>RAD.rig&&RAD.rig.emo("neutro"),1500)}}
      if(acc>=.05){RAD.rig.tick(acc,RAD.t);acc=0}requestAnimationFrame(q)};requestAnimationFrame(q)}catch(e){console.warn("rádio",e)}}

// ---------- ligações com as telas do jogo
function host(el,antes){const h=document.createElement("div");if(antes&&antes.parentNode)antes.parentNode.insertBefore(h,antes);else el.insertBefore(h,el.firstChild);return h}
function instala(){if(typeof document==="undefined"||!GL.AV)return;
  if(typeof meetingModal==="function"&&!meetingModal._cn){const b=meetingModal;GL.meetingModal=function(){b.apply(this,arguments);try{const m=document.querySelector("#modal .modal");if(m&&UI.meet)mostra(host(m),"meet:"+G.season+":"+G.round,cenaReuniao)}catch(e){console.warn(e)}};GL.meetingModal._cn=1}
  if(typeof stewardsStep==="function"&&!stewardsStep._cn){const b=stewardsStep;GL.stewardsStep=function(){b.apply(this,arguments);try{const i=UI.incIdx||0,inc=R&&R.incidents&&R.incidents[i];const wk=document.getElementById("wk");
      if(inc&&wk&&W.step==="stewards"&&!(inc.verdict&&inc.verdict.victim))mostra(host(wk),"stew:"+R.t.toFixed(1)+":"+i,()=>cenaComissarios(inc))}catch(e){console.warn(e)}};GL.stewardsStep._cn=1}
  if(typeof resultsStep==="function"&&!resultsStep._cn){const b=resultsStep;GL.resultsStep=function(){b.apply(this,arguments);try{const wk=document.getElementById("wk");if(!wk||!R||!R.result)return;const k=G.season+":"+G.round;
      const e=R.result.cls.find(x=>x.d===G.me);const to=R.teamOrder;if(to)mostra(host(wk),"mate:"+k,()=>cenaCompanheiro(to));
      if(e&&e.status==="ok"&&e.pos<=3)mostra(host(wk),"pod:"+k,()=>cenaPodio(R.result))}catch(e){console.warn(e)}};GL.resultsStep._cn=1}
  if(typeof seasonEnd==="function"&&!seasonEnd._cn){const b=seasonEnd;GL.seasonEnd=function(){b.apply(this,arguments);try{const S=G.endSummary;const txt=JSON.stringify(S||"");if(/VOCÊ É CAMPEÃO/.test(txt)){const a=document.getElementById("app");const c=a&&a.querySelector(".card");if(c)mostra(host(a,c),"tit:"+G.season,cenaTitulo)}}catch(e){console.warn(e)}};GL.seasonEnd._cn=1}
  if(typeof acceptOffer==="function"&&!acceptOffer._cn){const b=acceptOffer;GL.acceptOffer=function(o){const r=b.apply(this,arguments);try{if(o&&G.signed===o)setTimeout(()=>{const p=cenaAnuncio(o);if(p)janela(p,"Contrato assinado","Continuar")},60)}catch(e){console.warn(e)}return r};GL.acceptOffer._cn=1}
  if(typeof spAccept==="function"&&!spAccept._cn){const b=spAccept;GL.spAccept=function(i){const o=G.spOffers&&G.spOffers[i];const n=G.sponsors?G.sponsors.length:0;const r=b.apply(this,arguments);try{if(o&&G.sponsors&&G.sponsors.length>n)setTimeout(()=>{const p=cenaComercial(o);if(p)janela(p,"Parceria fechada","Continuar")},60)}catch(e){console.warn(e)}return r};GL.spAccept._cn=1}
  if(typeof careerTab==="function"&&!careerTab._cn){const b=careerTab;GL.careerTab=function(){b.apply(this,arguments);try{document.querySelectorAll('#body [data-act="accept"]').forEach(btn=>{if(btn.nextSibling&&btn.nextSibling.dataset&&btn.nextSibling.dataset.cnNeg)return;const i=+btn.dataset.k;
      const n=document.createElement("button");n.className="btn sm";n.dataset.cnNeg=i;n.textContent="Negociar";n.onclick=()=>{const p=cenaNegocio(i);if(p)janela(p,"Negociação de contrato","Sair da negociação")};btn.after(n)})}catch(e){console.warn(e)}};GL.careerTab._cn=1}
  if(typeof articleCard==="function"&&!articleCard._cn){const b=articleCard;GL.articleCard=function(a){const h=b.apply(this,arguments);try{if(a&&a.foto){const f=`<div class="cnfoto">${foto(a.foto.e,a.foto.tipo)}<span>Foto: Paddock TV</span></div>`;return h.replace('<div class="art','<div class="art-foto">'+f+'</div><div class="art')}}catch(e){}return h};GL.articleCard._cn=1}
  if(typeof socialTab==="function"&&!socialTab._cn){const b=socialTab;GL.socialTab=function(){b.apply(this,arguments);try{const c=G.clip;const body=document.getElementById("body");if(!c||!body||G.season!==c.s||G.round-c.r>2)return;estilo();
      const card=document.createElement("div");card.className="card";card.style.marginTop="12px";card.innerHTML=`<h3>Clipe da entrevista · ${esc(c.gp)}</h3><div class="cnclip"></div><div class="row" style="justify-content:center">${c.posted?`<span class="pill good">Clipe publicado</span>`:`<button class="btn go" data-cn-clip="1">Postar nas redes</button>`}</div>`;
      body.insertBefore(card,body.firstChild);mostra(card.querySelector(".cnclip"),"clip:"+c.s+":"+c.r,()=>cenaClipe(c));const pb=card.querySelector("[data-cn-clip]");
      if(pb)pb.onclick=()=>{const q=c.t.length>110?c.t.slice(0,108)+"…":c.t;const likes=Math.round(G.fame.followers*(.02+(c.tone==="polemico"?.03:c.tone==="emocional"?.02:.01)));post("me",`🎙️ "${q}"`,{likes});follow(Math.round(likes*.08));c.posted=true;if(typeof save==="function")save();render()}}catch(e){console.warn(e)}};GL.socialTab._cn=1}
  if(typeof raceStep==="function"&&!raceStep._cn){const b=raceStep;GL.raceStep=function(){b.apply(this,arguments);try{radioRosto()}catch(e){}};GL.raceStep._cn=1}}
if(typeof window!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instala);else instala();
  // algumas telas (corrida, resultado, comissários) chegam depois, no pacote da pista: instala de novo quando ele terminar
  const it=setInterval(()=>{instala();if(typeof raceStep==="function"&&raceStep._cn&&typeof resultsStep==="function"&&resultsStep._cn)clearInterval(it)},1500)}
GL.CN={Palco,mostra,janela,cenaReuniao,cenaComissarios,cenaPodio,cenaCompanheiro,cenaNegocio,cenaAnuncio,cenaComercial,cenaTitulo,cenaClipe,foto,instala};
})(typeof window!=="undefined"?window:globalThis);
