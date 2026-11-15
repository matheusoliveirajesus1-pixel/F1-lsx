// ===================== ENTREVISTAS ANIMADAS: coletiva (antes) e zona mista (depois) =====================
// Usa as perguntas, respostas e efeitos de sempre (press.js / media.js). Só muda a apresentação:
//   pergunta à direita, respostas à esquerda, legenda no meio embaixo, piloto com expressões, flashes dos fotógrafos.
// Coletiva: você e mais dois pilotos atrás da mesa (o rival reage ao que você fala).
// Zona mista: você de pé em frente à parede de patrocinadores, com os microfones das emissoras.
// Os efeitos só são aplicados quando a fala termina, pelo mesmo caminho do botão antigo (answerInterview).
// A cena sobrevive a um render() da tela: o palco é reaproveitado e continua de onde estava.
(function(GL){
const NS="http://www.w3.org/2000/svg";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let cssOk=false;
function estilo(){if(cssOk)return;cssOk=true;const s=document.createElement("style");s.id="avzCss";s.textContent=`
.avz{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.avz .palco{position:relative;width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#15171c;container-type:inline-size;box-shadow:0 0 0 1px rgba(255,255,255,.1);font-family:'Titillium Web','Segoe UI',system-ui,sans-serif;color:#F2F3F5}
.avz svg.cena{position:absolute;inset:0;width:100%;height:100%;display:block}
.avz .ov{position:absolute;inset:0;pointer-events:none}
.avz .ov button{pointer-events:auto}
.avz .bug{position:absolute;left:2.4%;top:4%;display:flex;align-items:center;gap:.8cqw;font:700 1.15cqw/1 inherit;letter-spacing:.14em;text-transform:uppercase}
.avz .bug b{background:#FF4D2E;color:#fff;padding:.55cqw .8cqw;font:900 italic 1.3cqw/1 inherit;letter-spacing:.02em}
.avz .bug i{font-style:normal;background:rgba(10,11,14,.8);padding:.55cqw .9cqw;color:#fff}
.avz .bug .live{display:inline-flex;align-items:center;gap:.5cqw;background:rgba(10,11,14,.8);padding:.55cqw .8cqw;color:#fff}
.avz .bug .live::before{content:"";width:.7cqw;height:.7cqw;border-radius:50%;background:#FF2E2E;animation:avzP 1.4s infinite}
@keyframes avzP{50%{opacity:.25}}
.avz .card2{position:absolute;background:rgba(12,13,16,.9);border-radius:.5cqw;padding:1.2cqw 1.5cqw 1.3cqw;opacity:0;transition:opacity .8s ease,transform .9s cubic-bezier(.2,.8,.2,1);box-shadow:0 .6cqw 2cqw rgba(0,0,0,.35)}
.avz .card2.on{opacity:1;transform:none}
.avz .card2 h4{margin:0 0 .6cqw;font:700 1.05cqw/1.2 inherit;letter-spacing:.13em;text-transform:uppercase;color:#9AA0AA;display:flex;gap:.6cqw;align-items:center;flex-wrap:wrap}
.avz .card2 h4 em{font-style:normal;color:#fff}
.avz .card2 p{margin:0;font:600 1.6cqw/1.35 inherit;color:#fff}
.avz .q{right:2.6%;top:9%;width:33%;transform:translateX(3cqw);border-right:.35cqw solid #FF4D2E}
.avz .q h4::before{content:"P";display:inline-grid;place-items:center;width:1.7cqw;height:1.7cqw;background:#FF4D2E;color:#fff;border-radius:.3cqw;font-weight:900;letter-spacing:0}
.avz .a{left:2.6%;top:24%;width:35%;transform:translateX(-3cqw);border-left:.35cqw solid var(--avzT,#00B4D8)}
.avz .a h4::before{content:"R";display:inline-grid;place-items:center;width:1.7cqw;height:1.7cqw;background:var(--avzT,#00B4D8);color:#04131A;border-radius:.3cqw;font-weight:900;letter-spacing:0}
.avz.col .q{top:3.5%;width:44%}
.avz.col .a{top:10.5%;left:2.6%;width:44%}
.avz .opts{display:flex;flex-direction:column;gap:.6cqw}
.avz .opt{all:unset;cursor:pointer;display:grid;grid-template-columns:auto 1fr;gap:.2cqw .9cqw;align-items:baseline;padding:.7cqw .9cqw;border-radius:.4cqw;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);transition:background .2s,box-shadow .2s}
.avz .opt:hover,.avz .opt:focus-visible{background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px var(--avzT,#00B4D8)}
.avz .opt.esc{background:rgba(255,255,255,.18);box-shadow:inset 0 0 0 1.5px var(--avzT,#00B4D8)}
.avz .opt kbd{font:700 1cqw/1 inherit;color:#fff;background:rgba(255,255,255,.12);padding:.3cqw .55cqw;border-radius:.25cqw;grid-row:span 2}
.avz .opt b{font:700 1.05cqw/1.2 inherit;letter-spacing:.1em;text-transform:uppercase}
.avz .opt span{font:500 1.22cqw/1.32 inherit;color:#E3E6EA;grid-column:2}
.avz .painel{position:absolute;left:2.6%;right:2.6%;bottom:3%;background:rgba(12,13,16,.92);border-radius:.6cqw;padding:1cqw 1.2cqw;opacity:0;transform:translateY(3cqw);transition:opacity .8s ease,transform .9s cubic-bezier(.2,.8,.2,1);border-top:.35cqw solid var(--avzT,#00B4D8)}
.avz .painel.on{opacity:1;transform:none}
.avz .painel h4{margin:0 0 .7cqw;font:700 1.05cqw/1 inherit;letter-spacing:.13em;text-transform:uppercase;color:#9AA0AA}
.avz .painel .opts{display:grid;grid-template-columns:1fr 1fr;gap:.6cqw}
.avz .fx{display:flex;flex-wrap:wrap;gap:.5cqw;margin-top:.8cqw}
.avz .fx span{font:700 1.02cqw/1 inherit;padding:.45cqw .7cqw;border-radius:1cqw;background:rgba(255,255,255,.08);color:#fff;opacity:0;transform:translateY(.6cqw);transition:all .6s ease}
.avz .fx span.on{opacity:1;transform:none}
.avz .fx .up{color:#5BE39A}.avz .fx .dn{color:#FF8A7A}
.avz .tomc{font:800 .95cqw/1 inherit;letter-spacing:.1em;text-transform:uppercase;padding:.3cqw .55cqw;border-radius:.25cqw;color:#111}
.avz .strap{position:absolute;left:2.6%;bottom:17%;display:flex;flex-direction:column;opacity:0;transform:translateX(-4cqw);transition:opacity .9s ease,transform 1s cubic-bezier(.2,.8,.2,1)}
.avz .strap.on{opacity:1;transform:none}
.avz .strap b{background:#fff;color:#0B0C0F;font:900 italic 2.4cqw/1 inherit;padding:.7cqw 1.4cqw .6cqw;text-transform:uppercase;letter-spacing:-.01em}
.avz .strap span{background:var(--avzT,#00B4D8);color:var(--avzTT,#04131A);font:700 1.15cqw/1 inherit;letter-spacing:.14em;text-transform:uppercase;padding:.55cqw 1.4cqw;align-self:flex-start}
.avz .sub{position:absolute;left:50%;bottom:4.5%;transform:translateX(-50%);width:max-content;max-width:62%;text-align:center;font:600 1.85cqw/1.3 inherit;color:#FFF;background:rgba(0,0,0,.74);padding:.45cqw 1.2cqw;border-radius:.3cqw;opacity:0;transition:opacity .35s ease;text-wrap:balance}
.avz .sub.on{opacity:1}
.avz .sub small{display:block;font:700 .9cqw/1 inherit;letter-spacing:.18em;color:#FFD34D;text-transform:uppercase;margin-bottom:.35cqw}
.avz .barra{display:flex;gap:6px;flex-wrap:wrap;justify-content:space-between;align-items:center}
.avz .barra .dica{font-size:13px;color:var(--mu,#8D929C)}
@media (max-width:640px){
 .avz .palco{aspect-ratio:3/4}
 .avz .bug{font-size:2.4cqw;gap:1.4cqw}.avz .bug b{font-size:2.6cqw;padding:1cqw 1.4cqw}.avz .bug i{display:none}.avz .bug .live{padding:1cqw 1.5cqw}.avz .bug .live::before{width:1.4cqw;height:1.4cqw}
 .avz .card2{padding:2.4cqw 3cqw;border-radius:1.4cqw}.avz .card2 h4{font-size:2.6cqw;margin-bottom:1.2cqw}.avz .card2 h4::before{width:3.6cqw;height:3.6cqw}.avz .card2 p{font-size:3.6cqw}
 .avz .q,.avz.col .q{left:4%;right:4%;top:11%;width:auto;transform:translateY(-3cqw);border-right:0;border-top:.8cqw solid #FF4D2E}
 .avz .a,.avz.col .a{left:4%;right:4%;top:auto;bottom:19%;width:auto;transform:translateY(3cqw);border-left:0;border-top:.8cqw solid var(--avzT,#00B4D8)}
 .avz .painel{left:4%;right:4%;padding:2.4cqw 3cqw;border-radius:1.4cqw;bottom:2.5%}.avz .painel h4{font-size:2.6cqw;margin-bottom:1.4cqw}.avz .painel .opts{grid-template-columns:1fr}
 .avz .opts{gap:1.4cqw}.avz .opt{padding:1.8cqw 2.2cqw;gap:.6cqw 2.2cqw;border-radius:1cqw}.avz .opt kbd{font-size:2.4cqw;padding:.7cqw 1.2cqw}.avz .opt b{font-size:2.5cqw}.avz .opt span{font-size:3.2cqw}
 .avz .fx{gap:1.2cqw;margin-top:1.8cqw}.avz .fx span{font-size:2.6cqw;padding:1cqw 1.6cqw}.avz .tomc{font-size:2.3cqw;padding:.7cqw 1.2cqw}
 .avz .strap{bottom:16%;left:4%}.avz .strap b{font-size:5.6cqw;padding:1.6cqw 3cqw 1.4cqw}.avz .strap span{font-size:2.6cqw;padding:1.2cqw 3cqw}
 .avz .sub{max-width:92%;font-size:3.8cqw;bottom:2.5%;padding:1cqw 2.6cqw;border-radius:.8cqw}.avz .sub small{font-size:2.2cqw;margin-bottom:.8cqw}
}
@media (prefers-reduced-motion:reduce){.avz .card2,.avz .strap,.avz .painel,.avz .fx span{transition-duration:.01s}}`;document.head.appendChild(s)}

// emissoras: cor e sigla do cubo do microfone
const MIC={gpbr:["GPB","#1F9D55"],speedtv:["STV","#E10600"],motorde:["MD","#2D6CDF"],paddock:["PI","#FF4D2E"],racefan:["RF","#F5A524"],times:["GT","#111316"]};
const ESTRANGEIRO={speedtv:"inglês",times:"inglês"};
const TOM_FL={polemico:11,emocional:6,confiante:6,humilde:3,tecnico:2,evasivo:2};
function efeitos(eff){const o=[];if(!eff)return o;const sn=v=>(v>0?"+":"−")+Math.abs(Math.round(v));
  const m=typeof mate==="function"?mate():null,rv=typeof G!=="undefined"&&G.rival&&G.drivers[G.rival]?G.drivers[G.rival]:null;
  if(eff.pop)o.push([`Popularidade ${sn(eff.pop)}`,eff.pop>0?"up":"dn"]);if(eff.rep)o.push([`Respeito ${sn(eff.rep)}`,eff.rep>0?"up":"dn"]);
  if(eff.trust)o.push([`Confiança da equipe ${sn(eff.trust)}`,eff.trust>0?"up":"dn"]);if(eff.morale)o.push([`Moral ${sn(eff.morale)}`,eff.morale>0?"up":"dn"]);
  if(eff.mate)o.push([`Relação com ${m?m.n.split(" ").pop():"o companheiro"} ${sn(eff.mate)}`,eff.mate>0?"up":"dn"]);
  if(eff.rival)o.push([`Relação com ${rv?rv.n.split(" ").pop():"o rival"} ${sn(eff.rival)}`,eff.rival>0?"up":"dn"]);
  if(eff.heat)o.push([eff.heat>0?"Polêmica ↑":"Polêmica ↓",eff.heat>0?"dn":"up"]);if(eff.press)o.push([`Imprensa ${sn(eff.press)}`,eff.press>0?"up":"dn"]);
  if(eff.promise)o.push(["Promessa feita","dn"]);return o}
function resultadoBom(){try{const r=G.results.filter(x=>!x.sprint).slice(-1)[0];const e=r&&r.cls.find(x=>x.d===G.me);if(!e)return 0;if(e.status!=="ok")return-1;return e.pos<=6?1:e.pos>12?-1:0}catch(e){return 0}}
function emoDoTom(t,bom){return{humilde:bom<0?"serio":"feliz",confiante:"confiante",polemico:bom<0?"irritado":"convencido",evasivo:"pensativo",tecnico:"serio",emocional:bom>0?"rindo":bom<0?"triste":"feliz"}[t]||"neutro"}
function blocos(txt){const out=[];txt.split(/(?<=[.?!…])\s+/).forEach(f=>{if(f.length<=82){out.push(f);return}let a="";f.split(/(?<=[,;:])\s+/).forEach(p=>{if((a+" "+p).length>82&&a){out.push(a);a=p}else a=a?a+" "+p:p});if(a)out.push(a)});return out}

// ---------- cena
function Cena(tipo,I){estilo();this.tipo=tipo;this.I=I;const AV=GL.AV;const me=ME(),t=myTeam();this.me=me;
  const uni=AV.uniformeDe(me);this.uni=uni;const C=(typeof W!=="undefined"&&W&&W.C)||{gp:"",n:""};this.C=C;this.bom=tipo==="post"?resultadoBom():0;
  const no=document.createElement("div");no.className="avz"+(tipo==="pre"?" col":"");this.no=no;
  no.style.setProperty("--avzT",uni.acento);no.style.setProperty("--avzTT",AV.luz(uni.acento)>.55?"#0B0C0F":"#FFFFFF");
  no.innerHTML=`<div class="palco"><svg class="cena" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${tipo==="pre"?"Coletiva de imprensa":"Entrevista na zona mista"}">
    <defs><filter id="avzBl" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.2"/></filter>
      <radialGradient id="avzSpot" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".62" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></radialGradient>
      <radialGradient id="avzFl"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#EAF4FF" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="avzCol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2540"/><stop offset="1" stop-color="#0D1222"/></linearGradient>
      <linearGradient id="avzMic" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B3F46"/><stop offset="1" stop-color="#1E2125"/></linearGradient></defs>
    <g class="fundo"></g><g class="rigs"></g><g class="frente"></g><g class="flashes"></g><rect class="flashTela" width="1600" height="900" fill="#fff" opacity="0"/></svg>
    <div class="ov"><div class="bug"><b>PADDOCK TV</b><i>${tipo==="pre"?"Coletiva":"Zona mista"} · ${esc(C.gp)}</i><span class="live">Ao vivo</span></div>
      <div class="card2 q"><h4 class="qWho"></h4><p class="qTxt"></p></div>
      <div class="card2 a"><h4><em>${esc(me.n)}</em> · ${esc(t?t.n:"")}</h4><div class="aBody"></div></div>
      <div class="painel"><h4>Como responder? <span style="font-weight:600;letter-spacing:.06em;text-transform:none">· toque numa opção ou use 1 a 4</span></h4><div class="opts pOpts"></div></div>
      <div class="strap"><b>${esc(me.n)}</b><span>${esc(t?t.n:"")} · #${esc(me.num)}</span></div><div class="sub"></div></div></div>
    <div class="barra"><span class="dica">${tipo==="pre"?"Coletiva de imprensa de quinta-feira":"Zona mista depois da corrida"} · as respostas valem como sempre</span>
      <span class="row" style="gap:6px"><button class="btn sm" data-avz="pausa">Pausar</button><button class="btn sm" data-avz="pula">Pular fala</button><button class="btn sm" data-avz="texto">Ver em texto</button></span></div>`;
  const q=s=>no.querySelector(s);this.$={svg:q("svg"),fundo:q(".fundo"),rigs:q(".rigs"),frente:q(".frente"),fl:q(".flashes"),tela:q(".flashTela"),q:q(".q"),qWho:q(".qWho"),qTxt:q(".qTxt"),
    a:q(".a"),aBody:q(".aBody"),painel:q(".painel"),pOpts:q(".pOpts"),strap:q(".strap"),sub:q(".sub"),bPausa:q('[data-avz="pausa"]')};
  no.addEventListener("click",e=>{const b=e.target.closest("[data-avz]");if(!b)return;const a=b.dataset.avz;
    if(a==="pausa"){this.T.pausa=!this.T.pausa;b.textContent=this.T.pausa?"Continuar":"Pausar"}else if(a==="pula")this.T.gen++;
    else if(a==="texto"){if(typeof PREFS!=="undefined"){PREFS.ivTexto=true;if(typeof prefsSave==="function")prefsSave()}this.para();CENA.cur=null;if(typeof render==="function")render()}});
  this.T={t:0,pausa:false,gen:0,esperas:[]};this.rajada=0;this.prox=1;this.rodando=false;this.vivo=true;this.fala=null;
  this.monta();this.tecla=e=>{if(!this.no.isConnected||!this.escolha)return;const n=+e.key;if(n>=1&&n<=this.escolha.n)this.escolha.fim(n-1)};window.addEventListener("keydown",this.tecla)}
Cena.prototype.monta=function(){const AV=GL.AV,$=this.$,me=this.me,uni=this.uni,t=myTeam();
  const C=typeof SPONSOR_CAT!=="undefined"?SPONSOR_CAT:[];const meus=[uni.sp&&uni.sp.m,uni.sp&&uni.sp.s].filter(Boolean);const outros=C.filter(s=>!meus.includes(s));const r=AV.prng(AV.hsh(this.C.gp||"gp"));
  const lista=[...meus,...meus,...outros.sort(()=>r()-.5).slice(0,5),{n:"Liga Paddock",c:"#FF4D2E",c2:"#FFFFFF",mk:"play"}];
  if(this.tipo==="post"){// parede de patrocinadores desfocada
    let s=`<g filter="url(#avzBl)"><rect width="1600" height="900" fill="#EEF0F3"/>`;let k=0;for(let rr=-1;rr<9;rr++)for(let c=-1;c<7;c++){s+=AV.selo(lista[((k++ +rr*3)%lista.length+lista.length)%lista.length],c*300+(rr%2?150:0)+60,rr*120+40,40,"#111316")}
    $.fundo.innerHTML=s+`</g><rect width="1600" height="900" fill="url(#avzSpot)"/>`;
    this.rig=new AV.Rig($.rigs,AV.rostoJogador(),{...uni,x:800,y:0,s:1});this.rigs=[this.rig];
    // microfones das emissoras
    const ids=Object.keys(MIC);const pos=[{x:-78,y:610,px:-280},{x:84,y:622,px:300},{x:6,y:652,px:60}];let m="";
    pos.forEach((p,i)=>{const mc=MIC[ids[(i*2+(this.C.gp||"").length)%ids.length]];m+=`<g class="mic"><path d="M${800+p.px} 920 L${800+p.x} ${p.y+40}" stroke="#16181C" stroke-width="12" stroke-linecap="round"/><rect x="${800+p.x-20}" y="${p.y+6}" width="40" height="40" rx="5" fill="${mc[1]}"/><text x="${800+p.x}" y="${p.y+33}" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-size="${mc[0].length>2?13:17}" fill="#fff">${mc[0]}</text><rect x="${800+p.x-15}" y="${p.y-44}" width="30" height="54" rx="15" fill="url(#avzMic)"/></g>`});
    $.frente.innerHTML=m;this.mics=[...$.frente.querySelectorAll(".mic")]}
  else{// coletiva: painel azul com a marca da liga, mesa com plaquinhas
    let s=`<rect width="1600" height="900" fill="url(#avzCol)"/><g opacity=".16">`;for(let rr=0;rr<8;rr++)for(let c=-1;c<6;c++){const x=c*340+(rr%2?170:0)+90,y=rr*118+40;s+=rr%2?`<text x="${x}" y="${y+12}" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="34" fill="#fff">LIGA PADDOCK</text>`:AV.selo(lista[(c+rr+8)%lista.length],x,y,30,"#FFFFFF")}
    $.fundo.innerHTML=s+`</g><rect width="1600" height="900" fill="url(#avzSpot)" opacity=".7"/>`;
    // quem senta ao lado: o rival (ou o líder) e um piloto de outra equipe
    const ds=Object.values(G.drivers).filter(d=>d.team&&d.id!==G.me);const mt=typeof mate==="function"?mate():null;
    let rv=G.rival&&G.drivers[G.rival]&&G.drivers[G.rival].team?G.drivers[G.rival]:null;
    if(!rv){try{const st=standings();const l=st.drivers.find(d=>d.id!==G.me);rv=l?G.drivers[l.id]:ds[0]}catch(e){rv=ds[0]}}
    const pool=ds.filter(d=>d!==rv&&d!==mt&&d.team!==me.team);const ot=pool[Math.floor(r()*pool.length)]||ds.find(d=>d!==rv);
    this.rival=new AV.Rig($.rigs,AV.rostoPiloto(rv),{...AV.uniformeDe(rv),x:380,y:130,s:.6});this.outro=ot?new AV.Rig($.rigs,AV.rostoPiloto(ot),{...AV.uniformeDe(ot),x:1220,y:130,s:.6}):null;
    this.rig=new AV.Rig($.rigs,AV.rostoJogador(),{...uni,x:800,y:66,s:.7});this.rigs=[this.rival,this.outro,this.rig].filter(Boolean);
    const plate=(x,d)=>`<g transform="translate(${x} 700)"><rect x="-120" y="-30" width="240" height="56" rx="6" fill="#F2F3F5"/><g transform="translate(-104 -14)">${AV.bandeira(d.nat,38,26)}</g><text x="-56" y="8" font-family="Titillium Web,sans-serif" font-weight="800" font-size="26" fill="#111316">${esc(d.n.split(" ").pop().toUpperCase())}</text></g>`;
    $.frente.innerHTML=`<rect x="0" y="640" width="1600" height="260" fill="#0B0E15"/><rect x="0" y="640" width="1600" height="6" fill="#2C3346"/>
      ${[1,3,5].map(i=>AV.selo(lista[i%lista.length],i*266,820,34,"#FFFFFF")).join("")}${plate(380,rv)}${ot?plate(1220,ot):""}${plate(800,me)}
      <g><rect x="770" y="590" width="60" height="40" rx="8" fill="#2A2D33"/><path d="M800 590 L800 520" stroke="#2A2D33" stroke-width="8"/><rect x="787" y="478" width="26" height="48" rx="13" fill="url(#avzMic)"/></g>`;this.mics=[]}};
// ---------- relógio próprio (pausa e pular)
Cena.prototype.espera=function(seg){const g=this.T.gen;return new Promise(r=>this.T.esperas.push({at:this.T.t+seg,r,g}))};
Cena.prototype.flash=function(forte){const $=this.$;const x=Math.random()<.5?Math.random()*380-60:1260+Math.random()*400,y=520+Math.random()*420,r=forte?260:150+Math.random()*80;
  const c=document.createElementNS(NS,"circle");c.setAttribute("cx",x);c.setAttribute("cy",y);c.setAttribute("r",r);c.setAttribute("fill","url(#avzFl)");$.fl.appendChild(c);const t0=performance.now();
  (function some(){const k=(performance.now()-t0)/260;c.setAttribute("opacity",Math.max(0,1-k));if(k<1)requestAnimationFrame(some);else c.remove()})();
  if(!matchMedia("(prefers-reduced-motion: reduce)").matches){const a=forte?.38:.18,t1=performance.now();(function f2(){const k=(performance.now()-t1)/140;$.tela.setAttribute("opacity",Math.max(0,a*(1-k)));if(k<1)requestAnimationFrame(f2)})()}
  for(const rg of this.rigs)rg.flash(forte?.85:.4)};
Cena.prototype.laco=function(){if(this.rodando)return;this.rodando=true;let ult=performance.now();const q=agora=>{if(!this.vivo){this.rodando=false;return}
    if(!this.no.isConnected){this.rodando=false;return}// a tela saiu: congela até o palco voltar
    const dt=Math.max(0,Math.min(.05,(agora-ult)/1000));ult=agora;const T=this.T;
    if(!T.pausa){T.t+=dt;for(let i=T.esperas.length-1;i>=0;i--){const w=T.esperas[i];if(T.t>=w.at||w.g!==T.gen){T.esperas.splice(i,1);w.r()}}
      this.prox-=dt;const fq=this.tipo==="pre"?.45:1;if(this.rajada>0&&this.prox<=0){this.flash(Math.random()<.35);this.rajada--;this.prox=.09+Math.random()*.22}else if(this.prox<=-(3.5+Math.random()*4)/fq){this.flash(false);this.prox=0}
      for(const rg of this.rigs)rg.tick(dt,T.t);this.mics.forEach((m,i)=>m.setAttribute("transform",`translate(${(Math.sin(T.t*1.3+i*2)*2.2).toFixed(2)} ${(Math.cos(T.t*1.7+i)*1.8).toFixed(2)})`))}
    requestAnimationFrame(q)};requestAnimationFrame(q)};
Cena.prototype.para=function(){this.vivo=false;window.removeEventListener("keydown",this.tecla)};
Cena.prototype.legenda=function(txt,quem,frac,trad){const B=blocos(txt),tot=B.reduce((s,b)=>s+b.length,0);let acc=0,i=0;for(;i<B.length;i++){acc+=B[i].length;if(acc/tot>=frac-1e-6)break}
  const h=`<small>${esc(quem)} · ${trad?"tradução do "+trad:"legenda"}</small>${esc(B[Math.min(i,B.length-1)])}`;if(this.$.sub.dataset.h!==h){this.$.sub.innerHTML=h;this.$.sub.dataset.h=h}this.$.sub.classList.add("on")};
// ---------- roteiro
Cena.prototype.roda=async function(){if(this.rodaOk)return;this.rodaOk=true;const $=this.$,I=this.I,me=this.me;const lado=this.tipo==="pre";
  this.rig.emo(this.bom<0?"serio":this.bom>0?"feliz":"neutro");this.rajada=this.tipo==="post"?(this.bom>0?9:5):3;
  if(I.i===0){await this.espera(.5);$.strap.classList.add("on");await this.espera(3);$.strap.classList.remove("on");await this.espera(.8)}
  while(I===G.interview&&I.i<I.qs.length&&this.vivo){const q=I.qs[I.i];const o=(typeof OUTLETS!=="undefined"&&OUTLETS.find(x=>x.id===q.j.o))||{n:""};const trad=ESTRANGEIRO[q.j.o]||null;
    // pergunta: o cartão entra devagar e o piloto vira para quem pergunta
    $.qWho.innerHTML=`<em>${esc(q.j.n)}</em> · ${esc(o.n)}`;$.qTxt.textContent="";$.q.classList.add("on");this.rig.emo("ouvindo");
    if(lado){this.rig.olhar(2,3,.1);this.rival&&this.rival.olhar(-1,2,.1);this.outro&&this.outro.olhar(1,2,-.1)}else this.rig.olhar(6,1,.45);
    await this.espera(.9);await this.digita($.qTxt,q.q,30,trad?q.q:null,q.j.n,trad);await this.espera(1);
    // escolha do tom
    if(trad)$.sub.classList.remove("on");this.rig.emo("pensativo");this.rig.olhar(-4,-4,-.25);const k=await this.escolher(q);if(!this.vivo)return;
    const a=q.opts[k];await this.falar(q,a,trad);if(!this.vivo)return;
    // aplica as respostas como o botão antigo fazia
    (this.respostas=this.respostas||[]).push({q:q.q,t:a.t,tone:a.tone});const art=responde(k);await this.espera(1.4);$.sub.classList.remove("on");$.q.classList.remove("on");$.a.classList.remove("on");this.rig.olhar(0,0,0);
    if(this.rival){this.rival.emo("neutro");this.rival.olhar(0,0,0)}if(this.outro){this.outro.emo("neutro");this.outro.olhar(0,0,0)}
    if(art){await this.espera(1);this.rig.emo(this.bom<0?"serio":"feliz");this.rajada+=4;CENA.fimDe=this;if(typeof render==="function")render();return}
    await this.espera(1.2)}};
Cena.prototype.digita=async function(el,txt,cps,leg,quem,trad){const g=this.T.gen,t0=this.T.t,dur=txt.length/cps;
  while(this.vivo){const k=g!==this.T.gen?1:Math.min(1,(this.T.t-t0)/dur);el.textContent=txt.slice(0,Math.round(txt.length*k));if(leg)this.legenda(leg,quem,k,trad);if(k>=1)break;await this.espera(.03)}};
Cena.prototype.escolher=function(q){return new Promise(res=>{const $=this.$,lado=this.tipo==="pre";const box=lado?$.pOpts:document.createElement("div");box.className="opts"+(lado?" pOpts":"");box.innerHTML="";
  q.opts.forEach((a,i)=>{const tn=(typeof TONES!=="undefined"&&TONES[a.tone])||{n:a.tone,c:"#888"};const b=document.createElement("button");b.className="opt";
    b.innerHTML=`<kbd>${i+1}</kbd><b style="color:${tn.c}">${esc(tn.n)}</b><span>${esc(a.t)}</span>`;b.onclick=()=>fim(i);box.appendChild(b)});
  if(lado)$.painel.classList.add("on");else{$.aBody.innerHTML="";$.aBody.appendChild(box);$.a.classList.add("on")}
  let feito=false;const fim=i=>{if(feito)return;feito=true;this.escolha=null;box.children[i].classList.add("esc");setTimeout(()=>{if(lado)$.painel.classList.remove("on");res(i)},450)};this.escolha={n:q.opts.length,fim}})};
Cena.prototype.falar=async function(q,a,trad){const $=this.$,rig=this.rig,lado=this.tipo==="pre";const tn=(typeof TONES!=="undefined"&&TONES[a.tone])||{n:a.tone,c:"#888"};
  // cartão da resposta: o tom e a frase de destaque; a fala completa vai na legenda
  $.aBody.innerHTML=`<p><span class="tomc" style="background:${tn.c}">${esc(tn.n)}</span></p><p class="aTxt" style="margin-top:.6cqw"></p>`;$.a.classList.add("on");const pTxt=$.aBody.querySelector(".aTxt");
  const emo=emoDoTom(a.tone,this.bom);rig.emo(emo);rig.olhar(0,0,0);this.rajada+=TOM_FL[a.tone]||3;
  // na coletiva os outros reagem
  if(lado){const pol=a.tone==="polemico",emoc=a.tone==="emocional",conf=a.tone==="confiante";
    if(this.rival){this.rival.olhar(5,0,.25);this.rival.emo(pol?"irritado":conf?"serio":emoc?"feliz":"neutro")}
    if(this.outro){this.outro.olhar(-5,0,-.25);this.outro.emo(pol?"rindo":emoc?"feliz":"ouvindo")}}
  const txt=a.t,dur=txt.length/16,g=this.T.gen,t0=this.T.t;rig.fala.on=true;rig.fala.txt=txt;
  while(this.vivo){const k=g!==this.T.gen?1:Math.min(1,(this.T.t-t0)/dur);rig.fala.i=k*txt.length;
    const n=Math.floor(k*txt.length);let c=txt.indexOf(" ",n);if(c<0||k>=1)c=txt.length;pTxt.textContent=txt.slice(0,c);
    this.legenda(txt,this.me.n,k,trad);rig.olhar(Math.sin(this.T.t*.6)*2.5,Math.sin(this.T.t*.9)*.8,Math.sin(this.T.t*.35)*.12);if(k>=1)break;await this.espera(.03)}
  rig.fala.on=false;if(lado&&a.tone==="polemico"&&this.rival)this.rival.emo("revira");
  const fx=document.createElement("div");fx.className="fx";efeitos(a.eff).forEach(f=>{const s=document.createElement("span");s.className=f[1];s.textContent=f[0];fx.appendChild(s)});$.aBody.appendChild(fx);
  await this.espera(.25);[...fx.children].forEach((s,i)=>setTimeout(()=>s.classList.add("on"),i*220));await this.espera(1.2);rig.emo(emo==="rindo"?"feliz":emo==="irritado"?"serio":emo)};

// mesma lógica do botão "answer" do ui.js
function responde(k){const mx=typeof W!=="undefined"&&W&&W.step==="mixed";if(mx)G.round--;let art=null;try{art=answerInterview(k)}finally{if(mx)G.round++}
  if(art){try{const c=CENA.cur;const tipo=W.step==="press"?"pre":"post";const bom=tipo==="post"?resultadoBom():0;const sc=t=>({polemico:5,emocional:3,confiante:2,tecnico:1,humilde:1,evasivo:0}[t]||0);
      const ans=(c&&c.respostas)||[];const top=ans.slice().sort((p,q)=>sc(q.tone)-sc(p.tone))[0];if(top){art.foto={e:emoDoTom(top.tone,bom),tom:top.tone,tipo};
        G.clip={gp:(W.C&&W.C.gp)||"",q:top.q,t:top.t,tone:top.tone,e:emoDoTom(top.tone,bom),tipo,s:G.season,r:G.round,posted:false}}}catch(e){}
    if(W.step==="press"){UI.pressDone=true;UI.pressArt=art}else{UI.mixDone=true;UI.mixArt=art}}return art}

const CENA={cur:null,fimDe:null};
function ativo(){return!(typeof PREFS!=="undefined"&&PREFS.ivTexto)&&typeof document!=="undefined"&&!!GL.AV}
// coloca (ou devolve) o palco no lugar indicado e continua a entrevista
function monta(host,tipo){if(!host)return;const I=G.interview;if(!I)return;let c=CENA.cur;
  if(!c||c.I!==I||c.tipo!==tipo){if(c)c.para();c=CENA.cur=new Cena(tipo,I)}host.appendChild(c.no);c.laco();c.roda()}
// depois da última resposta: o palco continua ali, sem cartões, em cima da repercussão
function fim(host,tipo){const c=CENA.fimDe;if(!host||!c||c.tipo!==tipo||!c.vivo){host&&(host.style.display="none");return}host.appendChild(c.no);c.laco();
  c.no.querySelector(".barra .dica").textContent=tipo==="pre"?"Fim da coletiva":"Fim da zona mista";c.no.querySelectorAll('[data-avz="pula"],[data-avz="texto"]').forEach(b=>b.remove())}
function limpa(){if(CENA.cur){CENA.cur.para();CENA.cur=null}if(CENA.fimDe){CENA.fimDe.para();CENA.fimDe=null}}
GL.AVZ={monta,fim,ativo,limpa,efeitos,emoDoTom,estilo,blocos,resultadoBom};
})(typeof window!=="undefined"?window:globalThis);
