// ===================== INTERFACE =====================
const $=s=>document.querySelector(s);const app=$("#app");
const UI={scr:"title",tab:"home",speed:1,cam:"tv",paused:false,ng:{name:"",code:"",num:ri(2,99),nat:"BRA",c1:"#FFD400",c2:"#1B998B",trait:"agressivo",style:"equilibrado",dist:.25},last:0,raf:0,trace:null,best:null,lastLap:-1,radioN:0,sound:false,skip:false};
const STYLES={equilibrado:{n:"Equilibrado",d:"Sem pontos fracos",a:{},p:{aggr:50,disc:66}},velocista:{n:"Velocista",d:"+Ritmo, volta lançada e curvas, −pneus e combustível",a:{pace:3,quali:4,cor:2,brk:1,tyre:-4,cons:-2,fuel:-2},p:{aggr:58,disc:58}},estrategista:{n:"Estrategista",d:"+Pneus, energia, combustível e consistência, −largada e frenagem",a:{tyre:5,cons:4,ers:3,fuel:3,craft:2,start:-3,quali:-2,brk:-2},p:{aggr:38,disc:78}},guerreiro:{n:"Guerreiro",d:"+Ultrapassagem, defesa e frenagem, −frieza e consistência",a:{ovt:5,def:4,brk:2,craft:1,mental:-3,cons:-2,tyre:-2},p:{aggr:74,disc:50}}};
const HELMETS=["#FFD400","#1B998B","#E10600","#3A86FF","#FFFFFF","#111111","#F15BB5","#FF8000","#21C55D","#9B5DE5"];
function tyreBadge(c,label){const C=COMP[c];return`<span class="tyre" style="border-color:${C.c};color:${C.c}" title="${C.n}">${label||c}</span>`}
function bar(v,min,max,col){const f=clamp((v-min)/(max-min),0,1)*100;return`<div class="bar"><i style="width:${f}%;background:${col||"var(--team)"}"></i></div>`}
function modal(html){$("#modal").innerHTML=html?`<div class="modalbg" data-act="bgClose"><div class="modal" role="dialog">${html}</div></div>`:""}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function teamName(id){const t=teamOf(id);return t?t.n:"—"}
function setTeamVars(){if(!G)return;const t=myTeam();document.documentElement.style.setProperty("--team",t.c);document.documentElement.style.setProperty("--team2",t.c2)}
function helmetSVG(c1,c2,s){return`<svg class="helmet" viewBox="0 0 56 56" width="${s||56}" height="${s||56}" aria-hidden="true"><path d="M8 34a20 20 0 0 1 40-6v10H22l-6 8H10z" fill="${c1}"/><path d="M14 30h34v8H22z" fill="#0B0D12"/><path d="M10 40c10-2 22-2 36 0" stroke="${c2}" stroke-width="5" fill="none"/><path d="M18 18c6-6 18-6 24 0" stroke="${c2}" stroke-width="4" fill="none"/></svg>`}
function av(who){const ini=(who.n||"?").replace(/^@/,"").split(/[\s_]/).map(w=>w[0]).join("").slice(0,2).toUpperCase();return`<div class="av" style="background:${who.c||"#888"}">${esc(ini)}</div>`}
function render(){cancelAnimationFrame(UI.raf);if(typeof lazyNeed==="function"&&lazyNeed())return;if(UI.scr==="title")return titleScreen();if(UI.scr==="create")return createScreen();if(UI.scr==="mp")return mpScreen();
  if(UI.scr==="mprace"){if(G&&G.mp&&W){setTeamVars();return weekendScreen()}UI.scr=G?"hub":"title";if(!G)return titleScreen()}setTeamVars();
  if(G.gameOver)return gameOverScreen();if(G.round>=G.calendar.length&&G.phase!=="weekend")return seasonEnd();
  if(G.phase==="weekend"&&W)return weekendScreen();return hub()}

// ---------- abertura e criação do piloto
function titleScreen(){const sv=hasSave();app.innerHTML=`<div class="title-screen"><div class="big">PADDOCK<br><span>2026</span></div>
  <p style="font-size:17px;max-width:56ch">Simulador de carreira na Fórmula 1 com o regulamento de 2026: motores com 50% de energia elétrica, aerodinâmica ativa, modo de ultrapassagem e pneus que esquentam, gastam e furam. Você é o piloto. A física decide o resto.</p>
  <p class="muted">Equipes com os nomes reais do grid de 2026; pilotos, chefes e histórias são fictícios. Jogo de fã, sem ligação oficial com a Fórmula 1, a FIA ou as equipes. Circuitos, calendário e regras seguem a temporada real.</p>
  <p class="muted" style="font-size:11px">Traçados dos circuitos: projeto f1-circuits, © 2019-2025 Tomislav Bacinger, licença MIT.</p>
  <div class="row">${sv?`<button class="btn go" data-act="continue">Continuar carreira</button>`:""}<button class="btn ${sv?"":"go"}" data-act="newCareer">Nova carreira</button><button class="btn" data-act="mpOpen">🌐 Corrida online</button></div></div>`}
function createScreen(){const n=UI.ng;const st=STYLES[n.style];app.innerHTML=`<div class="title-screen" style="justify-content:flex-start;padding-top:12px">
  <h2>Crie o seu piloto</h2>
  <div class="card"><div class="row" style="align-items:center;gap:14px">${helmetSVG(n.c1,n.c2,64)}<div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:8px">
    <label>Nome completo<input class="txt" id="fname" maxlength="26" value="${esc(n.name)}" placeholder="Ex.: Matheus Oliveira"></label>
    <div class="row"><label style="flex:1">Sigla (3 letras)<input class="txt" id="fcode" maxlength="3" value="${esc(n.code)}" placeholder="OLI"></label><label style="width:110px">Número<input class="txt" id="fnum" type="number" min="2" max="99" value="${n.num}"></label></div>
    <label>Nacionalidade<select class="txt" id="fnat">${Object.entries(NAT_NAME).map(([k,v])=>`<option value="${k}"${k===n.nat?" selected":""}>${v}</option>`).join("")}</select></label></div></div>
    <h3>Capacete</h3><div class="swatches">${HELMETS.map(c=>`<button class="sw${n.c1===c?" on":""}" style="background:${c}" data-act="c1" data-k="${c}" aria-label="cor principal ${c}"></button>`).join("")}</div>
    <div class="swatches">${HELMETS.map(c=>`<button class="sw${n.c2===c?" on":""}" style="background:${c}" data-act="c2" data-k="${c}" aria-label="cor das faixas ${c}"></button>`).join("")}</div></div>
  <div class="card"><h3>Estilo de pilotagem</h3><div class="choice">${Object.entries(STYLES).map(([k,s])=>`<button class="chip${n.style===k?" on":""}" data-act="style" data-k="${k}"><b>${s.n}</b><span>${s.d}</span></button>`).join("")}</div>
    <h3>Característica</h3><div class="choice">${Object.entries(TRAITS).map(([k,s])=>`<button class="chip${n.trait===k?" on":""}" data-act="trait" data-k="${k}"><b>${s.n}</b><span>${s.d}</span></button>`).join("")}</div></div>
  <div class="card"><h3>Duração das corridas</h3><div class="choice">${[[.15,"Rápida","~8 voltas"],[.25,"Curta","25% da distância"],[.5,"Média","50%"],[1,"Real","Distância oficial"]].map(([v,a,b])=>`<button class="chip${n.dist===v?" on":""}" data-act="dist" data-k="${v}"><b>${a}</b><span>${b}</span></button>`).join("")}</div>
    <p class="muted" style="font-size:13.5px">Você estreia na Cadilak, a 11ª equipe do grid, recém-chegada à categoria. O carro é o mais lento do pelotão: pontuar já é uma façanha.</p></div>
  <div class="row"><button class="btn" data-act="toTitle">Voltar</button><button class="btn go" data-act="createGo">Assinar contrato</button></div></div>`}
function readCreate(){const n=UI.ng;const f=$("#fname");if(f){n.name=f.value.trim();n.code=$("#fcode").value.trim().toUpperCase();n.num=clamp(+$("#fnum").value||n.num,2,99);n.nat=$("#fnat").value}}

// ---------- hub
function topbar(){const me=ME(),t=myTeam();const st=standings();const pos=st.drivers.findIndex(x=>x.id===G.me)+1;
  return`<div class="topbar"><div class="brand">${helmetSVG(G.helmet.c1,G.helmet.c2,40)}<div><div class="logo">${esc(me.n)} <span>#${me.num}</span></div><div class="teamchip"><span class="livery"></span>${t.n}</div></div></div>
  <div class="stats"><div><span class="muted">Temporada</span><b>${G.year} · ${Math.min(G.round+1,G.calendar.length)}/${G.calendar.length}</b></div><div><span class="muted">Campeonato</span><b>${pos?pos+"º":"—"} · ${myStats().points} pts</b></div>
  <div><span class="muted">Seguidores</span><b>${fmtK(G.fame.followers)}</b></div><div><span class="muted">Confiança ${ib("confianca")}</span><b>${Math.round(G.trust)}%</b></div></div></div>`}
function hub(){const tabs=[["home","Início"],["social","Redes"],["press","Imprensa"],["champ","Campeonato"],["career","Carreira"],["learn","Aprender"],["online","🌐 Online"]];
  app.innerHTML=topbar()+`<div class="tabs" role="tablist">${tabs.map(([k,n])=>`<button class="tab${UI.tab===k?" on":""}" data-act="tab" data-k="${k}" role="tab">${n}</button>`).join("")}</div><div id="body"></div>`;
  ({home:homeTab,social:socialTab,press:pressTab,champ:champTab,career:careerTab,learn:learnTab,online:onlineTab})[UI.tab]()}
function onlineTab(){$("#body").innerHTML=`<div class="grid2" style="margin-top:12px"><div class="card"><h3>Corrida online com amigos</h3><p>Crie uma sala, mande o código e corram juntos na mesma pista. Cada um pilota o próprio carro pelo rádio e larga no toque, contra o grid inteiro.</p>
   <p class="muted" style="font-size:13.5px">Modos: equipes diferentes (até 4 pilotos) ou mesma equipe (dois companheiros). A corrida online não mexe na sua carreira.</p><button class="btn go" data-act="mpOpen">Abrir o modo online</button></div>
   <div class="card"><h3>Antes de começar</h3><p>Compartilhe esta página com o seu amigo pelo menu <b>Compartilhar</b> do Claude. Quem cria a sala roda a corrida no próprio aparelho e precisa deixar o jogo aberto até o fim.</p></div></div>`}
function nextC(){return CIR[G.calendar[G.round]]}
function homeTab(){const C=nextC();const me=ME();const m=mate();const rv=G.rival&&G.drivers[G.rival];
  $("#body").innerHTML=`<div class="hero" style="margin-top:12px"><div class="gp"><h3>Próxima etapa · ${G.round+1} de ${G.calendar.length}${C.sprint?" · fim de semana sprint":""}</h3><div class="name">${C.gp}</div>
    <div class="muted">${C.n} · ${C.city}, ${C.nat}</div>
    <canvas id="prev" width="560" height="300" style="width:100%;height:auto;border-radius:6px;background:#0E1116"></canvas>
    <div class="mini"><div>Extensão<b>${(C.len/1000).toFixed(3).replace(".",",")} km</b></div><div>Voltas<b>${raceLaps(C.id)} <span class="muted">/ ${C.laps}</span></b></div><div>Recorde de ref.<b>${fmtT(C.target)}</b></div>
      <div>Desgaste<b>${C.wear>1.15?"Alto":C.wear<.9?"Baixo":"Médio"}</b></div><div>Ultrapassar<b>${C.ovt>.65?"Fácil":C.ovt<.35?"Difícil":"Médio"}</b></div><div>Chuva<b>${Math.round(C.rain*100)}%</b></div></div>
    <button class="btn go" data-act="goWeekend">Ir para o paddock</button></div>
   <div style="display:flex;flex-direction:column;gap:12px">
    ${devCard()}
    <div class="card"><h3>Sua imagem ${ib("fama")}</h3>
      <div class="meter"><span>Popularidade</span>${bar(G.fame.pop,0,100,"#F15BB5")}<b class="num">${Math.round(G.fame.pop)}</b></div>
      <div class="meter"><span>Respeito</span>${bar(G.fame.rep,0,100,"#6EC1FF")}<b class="num">${Math.round(G.fame.rep)}</b></div>
      <div class="meter"><span>Confiança</span>${bar(G.trust,0,100,"#21C55D")}<b class="num">${Math.round(G.trust)}</b></div>
      <div class="meter"><span>Moral</span>${bar(me.morale,0,100,"#FFD400")}<b class="num">${Math.round(me.morale)}</b></div>
      <div class="meter"><span>Polêmica</span>${bar(G.heat||0,0,100,"#FF4D4F")}<b class="num">${Math.round(G.heat||0)}</b></div>
      <div class="kv"><span>Valor de mercado</span><b class="num">${money(Math.max(.5,marketValue()))}/ano</b></div></div>
    <div class="card"><h3>Duelo com o companheiro</h3>${m?`<div class="kv"><span>${esc(m.n)} (#${m.num})</span><b class="num">OVR ${ovr(m)}</b></div>
      <div class="kv"><span>Classificações</span><b class="num">${G.h2h.q[0]} × ${G.h2h.q[1]}</b></div><div class="kv"><span>Corridas</span><b class="num">${G.h2h.r[0]} × ${G.h2h.r[1]}</b></div>`:""}
      ${rv?`<div class="kv"><span>Rival na imprensa</span><b>${esc(rv.n)} · ${teamName(rv.team)}</b></div><div class="kv"><span>Relação</span><b class="num">${Math.round(G.rel[rv.id]||0)}</b></div>`:""}</div>
    <div class="card"><h3>Notícias</h3><ul class="news">${G.news.slice(0,14).map(n=>`<li class="${n.cls}">${esc(n.t)}</li>`).join("")}</ul></div></div></div>`;
  drawPreview($("#prev"),C.id)}
function drawPreview(cv,id){if(!cv)return;const geo=buildCircuit(id);const ctx=cv.getContext("2d");const w=cv.width,h=cv.height;ctx.clearRect(0,0,w,h);
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;const pts=geo.P.map(p=>{const a=(p.x-p.y)*ISO_C,b=(p.x+p.y)*ISO_S;x0=Math.min(x0,a);x1=Math.max(x1,a);y0=Math.min(y0,b);y1=Math.max(y1,b);return[a,b]});
  const s=Math.min((w-40)/(x1-x0),(h-40)/(y1-y0)),ox=(w-(x1-x0)*s)/2,oy=(h-(y1-y0)*s)/2;const P=q=>[(q[0]-x0)*s+ox,(q[1]-y0)*s+oy];
  ctx.lineJoin="round";ctx.beginPath();pts.forEach((q,i)=>{const r=P(q);i?ctx.lineTo(r[0],r[1]):ctx.moveTo(r[0],r[1])});ctx.closePath();ctx.strokeStyle="#3A3F46";ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle="#C9CFD8";ctx.lineWidth=3;ctx.stroke();
  prepGeo(geo);ctx.strokeStyle="#21C55D";ctx.lineWidth=3;geo.zones.forEach(([a,b])=>{ctx.beginPath();for(let i=a;;i=(i+1)%geo.N){const r=P(pts[i]);i===a?ctx.moveTo(r[0],r[1]):ctx.lineTo(r[0],r[1]);if(i===b)break}ctx.stroke()});
  const st=P(pts[0]);ctx.fillStyle="#FFF";ctx.fillRect(st[0]-2,st[1]-6,4,12);
  ctx.font="600 11px 'Titillium Web',sans-serif";ctx.fillStyle="#8C96A3";geo.corners.slice(0,14).forEach(c=>{const r=P(pts[c.i]);ctx.fillText(c.n,r[0]+6,r[1]-6)});
  ctx.fillStyle="#21C55D";ctx.fillText("— zonas de aero ativa (modo reta)",10,h-10)}
function socialTab(){const F=G.social.feed;const opts=postOptions();const posted=G.postedRound===G.season*100+G.round;
  $("#body").innerHTML=`<div class="grid2" style="margin-top:12px;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div style="display:flex;flex-direction:column;gap:12px;min-width:0">
   <div class="card"><h3>Publicar ${ib("redes")}</h3>${posted?`<p class="muted">Você já publicou nesta semana. Volte depois do próximo GP.</p>`:`<div class="choice">${opts.map(o=>`<button class="chip" data-act="doPost" data-k="${o.k}"><b>${o.n}</b><span style="color:${TONES[o.tone].c}">${TONES[o.tone].n}</span></button>`).join("")}</div>`}</div>
   <div class="feedx">${F.slice(0,40).map(p=>tweet(p)).join("")||`<p class="muted" style="padding:12px">Nada por aqui ainda.</p>`}</div></div>
   <div style="display:flex;flex-direction:column;gap:12px"><div class="card"><h3>Seu perfil</h3><div class="row">${helmetSVG(G.helmet.c1,G.helmet.c2,44)}<div><b>${esc(ME().n)}</b> ${G.fame.followers>150000?`<span class="vf">✓</span>`:""}<div class="muted">${handleOf(ME().n)}</div></div></div>
     <div class="kv"><span>Seguidores</span><b class="num">${fmtK(G.fame.followers)}</b></div><div class="kv"><span>Popularidade</span><b class="num">${Math.round(G.fame.pop)}/100</b></div></div>
   <div class="card"><h3>Em alta</h3>${(G.social.trends||[]).map(t=>`<div class="trend"><b>${esc(t.tag)}</b><span class="num muted">${fmtK(t.n)} posts</span></div>`).join("")||`<p class="muted">Sem assuntos em alta.</p>`}</div></div></div>`}
function tweet(p){const w=p.who;return`<div class="tw1">${av(w)}<div style="min-width:0"><div class="hd"><b>${esc(w.n)}</b>${w.v?`<span class="vf" aria-label="verificado">✓</span>`:""}<span>${esc(w.h||"")}${w.sub?" · "+esc(w.sub):""}</span><span>· ${G.calendar[p.r]?CIR[G.calendar[Math.min(p.r,G.calendar.length-1)]].city:""}</span></div>
  <p>${esc(p.text)}</p>${(p.replies||[]).map(r=>`<div class="rep"><b>${esc(r.who.h)}</b> ${esc(r.t)}</div>`).join("")}<div class="ft"><span>💬 ${fmtK(p.com)}</span><span>🔁 ${fmtK(p.rts)}</span><span>♥ ${fmtK(p.likes)}</span></div></div></div>`}
function pressTab(){const A=G.articles;$("#body").innerHTML=`<div class="grid2" style="margin-top:12px;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div class="card"><h3>Reportagens e entrevistas ${ib("entrevista")}</h3>
  ${A.slice(0,30).map(a=>`<div class="art${a.heat?" hot":""}"><span class="src">${esc(a.outlet)} · ${esc(a.kind)} · ${esc(a.journo)} · ${CIR[G.calendar[Math.min(a.r,G.calendar.length-1)]].gp} ${G.year-(G.season-a.s)}</span><h4>${esc(a.headline)}</h4><p>${esc(a.body)}</p></div>`).join("")||`<p class="muted">A imprensa ainda não escreveu sobre você. Isso muda no primeiro GP.</p>`}</div>
  <div class="card"><h3>Relação com jornalistas</h3>${JOURNOS.map(j=>{const v=(G.press||{})[j.n]??50;const o=OUTLETS.find(x=>x.id===j.o);return`<div class="meter"><span>${esc(j.n)}<br><small class="muted">${esc(o.n)} · ${esc(o.tone)}</small></span>${bar(v,0,100,"#6EC1FF")}<b class="num">${Math.round(v)}</b></div>`}).join("")}</div></div>`}
function champTab(){const st=standings();$("#body").innerHTML=`<div class="grid2" style="margin-top:12px"><div class="card"><h3>Pilotos ${ib("pontos")}</h3><div class="tw"><table><thead><tr><th>#</th><th>Piloto</th><th>Equipe</th><th>V</th><th>Pts</th></tr></thead><tbody>
  ${st.drivers.map((d,i)=>{const D=G.drivers[d.id],t=teamOf(d.team);return`<tr class="${d.id===G.me?"me":""}"><td class="num">${i+1}</td><td>${teamLogo(t,"tc")}${esc(D.n)}</td><td class="muted">${t.n}</td><td class="num">${d.wins}</td><td class="num"><b>${d.pts}</b></td></tr>`}).join("")||`<tr><td colspan="5" class="muted">Ainda sem corridas.</td></tr>`}</tbody></table></div></div>
  <div class="card"><h3>Construtores</h3><div class="tw"><table><thead><tr><th>#</th><th>Equipe</th><th>Carro</th><th>Pts</th></tr></thead><tbody>${st.teams.map((x,i)=>{const t=teamOf(x.id);return`<tr class="${t.id===myTeam().id?"me":""}"><td class="num">${i+1}</td><td>${teamLogo(t,"tc")}${t.n}</td><td class="num muted">${carAvg(t).toFixed(1)}</td><td class="num"><b>${x.pts}</b></td></tr>`}).join("")}</tbody></table></div>
  <h3>Calendário ${ib("calendario")}</h3><div class="tw"><table><tbody>${G.calendar.map((id,i)=>{const C=CIR[id];const r=G.results.find(x=>x.season===G.season&&x.round===i&&!x.sprint);const e=r&&r.cls.find(x=>x.d===G.me);return`<tr class="${i===G.round?"me":""}"><td class="num">${i+1}</td><td>${C.gp}${C.sprint?` <span class="pill">Sprint</span>`:""}</td><td class="num">${e?(e.status==="ok"?e.pos+"º":e.status.toUpperCase()):i===G.round?"próxima":""}</td></tr>`}).join("")}</tbody></table></div></div></div>`}
function expCard(me){const ex=dExp(me),nid=G.calendar[Math.min(G.round,G.calendar.length-1)],nf=famOf(me,nid);
  const known=G.calendar.map(id=>({id,f:famOf(me,id)})).sort((a,b)=>b.f-a.f);const best=known.slice(0,3).map(x=>CIR[x.id].n).join(", "),worst=known.slice(-3).reverse().map(x=>CIR[x.id].n).join(", ");
  return`<div class="card"><h3>Experiência ${ib("experiencia")}</h3><div class="kv"><span>Largadas na F1</span><b class="num">${ex.starts}</b></div><div class="kv"><span>Corridas na chuva</span><b class="num">${ex.wet}</b></div>
   <div class="meter"><span>Próxima pista<br><small class="muted">${esc(CIR[nid].n)} · ${famLabel(nf)}</small></span>${bar(nf*100,0,100,"#6EC1FF")}<b class="num">${Math.round(nf*100)}%</b></div>
   <p class="muted" style="font-size:12.5px;margin:6px 0 0">Conhece melhor: ${esc(best)}. Precisa aprender: ${esc(worst)}.${ex.starts<25?" Estreante erra mais: cada largada ajuda.":""}</p></div>`}
function feudCard(){const fs=myFeuds().slice(0,4);return`<div class="card"><h3>Rivalidades ${ib("rivalidade")}</h3>${fs.length?fs.map(f=>`<div class="meter"><span>${esc(f.d.n)}<br><small class="muted">${esc(f.why||"disputas na pista")}${f.trk?" · "+esc(f.trk):""}</small></span>${bar(f.s,0,100,"#FF4D4F")}<b class="num">${Math.round(f.s)}</b></div>`).join(""):`<p class="muted">Nenhuma por enquanto. Toques e brigas longas criam rivalidades: o rival deixa menos espaço e ataca mais.</p>`}</div>`}
function careerTab(){const me=ME();$("#body").innerHTML=`<div class="grid2" style="margin-top:12px"><div class="card"><h3>Atributos · OVR ${ovr(me)} · potencial ${me.potential}</h3>
  ${ATTR_G.map(([g,ks])=>`<h4 class="ag">${g}</h4>${ks.map(k=>`<div class="meter" title="${ATTR_D[k]}"><span>${ATTR[k]}</span>${bar(me.a[k],40,100)}<b class="num">${me.a[k]}</b></div>`).join("")}`).join("")}
  <h4 class="ag">Personalidade ${ib("personalidade")}</h4>${Object.entries(PERS).map(([k,p])=>{const v=(me.pers||{})[k]??50;return`<div class="meter" title="${p.d}"><span>${p.n}<br><small class="muted">${v<40?p.lo:v>62?p.hi:"Equilibrado"}</small></span>${bar(v,0,100,"#F5A524")}<b class="num">${v}</b></div>`}).join("")}
  <div class="kv"><span>Característica</span><b>${TRAITS[me.trait].n}</b></div><div class="kv"><span>Idade</span><b>${me.age} anos</b></div><div class="kv"><span>Experiência para evoluir</span><b class="num">${Math.round(G.xp)}/12</b></div></div>
  <div style="display:flex;flex-direction:column;gap:12px"><div class="card"><h3>Treinamento entre corridas</h3><div class="choice">${Object.entries(TRAIN).map(([k,t])=>`<button class="chip${G.train===k?" on":""}" data-act="train" data-k="${k}"><b>${t.n}</b><span>${t.d}</span></button>`).join("")}</div></div>
   ${expCard(me)}${feudCard()}
   <div class="card"><h3>Contrato</h3><div class="kv"><span>Equipe</span><b>${myTeam().n}</b></div><div class="kv"><span>Equipe de box ${ib("box")}</span><b class="num">${Math.round(crewOf(myTeam()))}/100</b></div><div class="kv"><span>Salário</span><b class="num">${money(me.salary)}/ano</b></div><div class="kv"><span>Ganhos na carreira</span><b class="num">${money(G.money)}</b></div>
    ${G.signed?`<p class="pill good">Assinado com ${teamName(G.signed.team)} para ${G.year+1}</p>`:G.offers.length?G.offers.map((o,i)=>`<div class="card" style="background:var(--panel-2)"><b>${teamName(o.team)}</b><span class="muted">${o.years} ano(s) · ${money(o.salary)}/ano · ${o.role} · meta: ${o.exp}</span><button class="btn sm" data-act="accept" data-k="${i}">Assinar</button></div>`).join(""):`<p class="muted">O mercado de pilotos abre na reta final da temporada. Resultados, popularidade e respeito atraem propostas.</p>`}</div>
   ${sponsorsCard()}
   <div class="card"><h3>Superlicença ${ib("superlicenca")}</h3>${licBar(licPoints())}<div class="kv"><span>Pontos nos últimos 12 meses</span><b class="num">${licPoints()} de 12</b></div><div class="kv"><span>Advertências na temporada</span><b class="num">${G.reprimands||0} de 3</b></div><div class="kv"><span>Relação com os comissários</span><b class="num">${Math.round(G.stewRep??50)}</b></div>${G.gridPen?`<p class="pill bad">${G.gridPen} posições de punição no grid da próxima corrida</p>`:""}${G.ban?`<p class="pill bad">Suspenso da próxima corrida</p>`:""}</div>
   <div class="card"><h3>Carreira</h3><div class="kv"><span>Largadas</span><b class="num">${me.stats.starts}</b></div><div class="kv"><span>Vitórias</span><b class="num">${me.stats.wins}</b></div><div class="kv"><span>Pódios</span><b class="num">${me.stats.podiums}</b></div><div class="kv"><span>Poles</span><b class="num">${me.stats.poles}</b></div><div class="kv"><span>Títulos</span><b class="num">${me.stats.titles}</b></div>
    ${G.history.map(h=>`<div class="kv"><span>${h.year} · ${teamName(h.team)}</span><b class="num">${h.pos}º · ${h.pts} pts</b></div>`).join("")}</div>
   <div class="card"><h3>Opções</h3><h4 class="ag">Realismo ${ib("realismo")}</h4><div class="seg">${Object.entries(REAL).map(([k,r])=>`<button data-act="realism" data-k="${k}" class="${(G.settings.real||"real")===k?"on":""}">${r.n}</button>`).join("")}</div><p class="muted" style="font-size:12.5px;margin:6px 0 10px">${esc(REAL[G.settings.real||"real"].d)}</p><label class="toggle"><input type="checkbox" data-act="sndPref" ${G.settings.sound?"checked":""}> Som nas corridas</label><button class="btn sm" data-act="wipe">Apagar carreira</button></div></div></div>`}
// ---------- reunião técnica
const km=v=>Math.round(v)+" km/h";const sgn=v=>(v>0?"+":"")+v.toFixed(2).replace(".",",");
function devCard(){const d=G.dev,log=(G.devLog||[])[0];
  if(d){const done=d.eta0-d.eta;return`<div class="card"><h3>Desenvolvimento do carro</h3><p>Em produção: <b>${esc(d.n)}</b> · ${TA[d.area]}.</p>${bar(done+.15,0,d.eta0,"#6EC1FF")}<p class="muted" style="font-size:13px">Estreia em ${d.eta} corrida${d.eta>1?"s":""}. Risco de não funcionar como no túnel de vento: ${Math.round(d.risk*100)}%.</p></div>`}
  return`<div class="card"><h3>Reunião técnica</h3>${meetingAvailable()?`<p>Os engenheiros querem a sua leitura dos dados antes de escolher o próximo pacote de atualizações.</p><button class="btn go" data-act="meeting">Entrar na reunião</button>`:`<p class="muted">Sem reunião pendente nesta semana.</p>`}${log?`<p class="muted" style="font-size:13px">Última peça: ${esc(log.n)} (${log.ok?"funcionou":"ganho abaixo do esperado"}, +${log.g.toFixed(2).replace(".",",")} em ${TA_S[log.area]}).</p>`:""}</div>`}
function meetingModal(){const M=UI.meet,rep=M.rep,T=rep.tel,C=CIR[rep.track];
  if(M.stage===1){modal(`<h2>Reunião técnica · ${C.gp}</h2><p class="muted" style="margin:0">Simulação da próxima pista: o nosso carro contra ${esc(rep.refName)}. ${rep.leader?"Somos os mais rápidos, mas dá para ganhar mais.":`Perdemos <b>${(rep.our-rep.ref).toFixed(2).replace(".",",")} s</b> por volta.`}</p>
    <div class="tw"><table><thead><tr><th>Dado</th><th>Nós</th><th>Ref.</th></tr></thead><tbody>
     <tr><td>Velocidade máxima</td><td class="num">${km(T.top[1])}</td><td class="num">${km(T.top[0])}</td></tr>
     ${T.fast?`<tr><td>Curva mais rápida (${esc(T.fast.n)})</td><td class="num">${km(T.fast.v[1])}</td><td class="num">${km(T.fast.v[0])}</td></tr>`:""}
     ${T.slow?`<tr><td>Curva mais lenta (${esc(T.slow.n)})</td><td class="num">${km(T.slow.v[1])}</td><td class="num">${km(T.slow.v[0])}</td></tr>`:""}
     ${T.brake?`<tr><td>Freada mais forte (${esc(T.brake.n)})</td><td class="num">${T.brake.g[1].toFixed(1).replace(".",",")} G</td><td class="num">${T.brake.g[0].toFixed(1).replace(".",",")} G</td></tr>`:""}
     <tr><td>Desgaste dos pneus</td><td class="num">${rep.wear>=0?"+":""}${Math.round(rep.wear*100)}%</td><td class="num">0%</td></tr></tbody></table></div>
    <h3 style="margin:0">Onde perdemos mais tempo por volta?</h3><div class="ansl">${TIME_AREAS.map(a=>`<button class="ans" data-act="meetAns" data-k="${a}"><span>${TA[a]}</span></button>`).join("")}</div>
    <div class="row"><button class="btn sm" data-act="meetAuto">Deixar a decisão com a equipe</button><button class="btn sm" data-act="closeModal">Depois</button></div>`);return}
  if(M.stage===2){const ok=M.guess===rep.worst,mx=Math.max(.01,...TIME_AREAS.map(a=>Math.abs(rep.dt[a])));
    modal(`<h2>${M.guess==="auto"?"A equipe analisou os dados":ok?"Leitura certeira":"Os dados mostram outra coisa"}</h2>
     <p style="margin:0">${M.guess==="auto"?`A maior perda está nas ${TA_S[rep.worst]}.`:ok?`Exatamente: é nas ${TA_S[rep.worst]} que mais perdemos. Com a sua leitura, a equipe acerta o alvo e o projeto rende mais.`:`Você apontou as ${TA_S[M.guess]}, mas a maior perda está nas ${TA_S[rep.worst]}.`}</p>
     <div style="display:flex;flex-direction:column;gap:6px">${TIME_AREAS.map(a=>`<div class="dtrow"><span>${TA[a]}</span>${bar(Math.max(0,rep.dt[a]),0,mx,a===rep.worst?"#FF4D4F":"#6EC1FF")}<b>${sgn(rep.dt[a])} s</b></div>`).join("")}</div>
     <h3 style="margin:0">Projetos propostos</h3><div class="ansl">${M.opts.map((p,i)=>{const e=devEstimate(p,M.eff);return`<button class="proj" data-act="meetPick" data-k="${p.id}"><span class="tag">${i===0?"RECOMENDADO PELOS ENGENHEIROS · ":""}${TA_S[p.area].toUpperCase()}</span><b>${esc(p.n)}</b><small>${esc(p.d)} · ${e.txt}</small><small>Fica pronto em ${p.eta} corridas · risco de não funcionar: ${Math.round(p.risk*100)}%</small>${DEV_SIDE[p.id]&&DEV_SIDE[p.id].d?`<small>${esc(DEV_SIDE[p.id].d)}</small>`:""}</button>`}).join("")}</div>`);return}
  modal(`<h2>${M.over?"O diretor técnico decidiu":"Projeto aprovado"}</h2><p>${M.over?`Com a confiança da equipe em ${Math.round(G.trust)}%, o diretor técnico preferiu o projeto recomendado: <b>${esc(M.chosen.n)}</b>. Melhore a confiança para ter mais voz nas decisões.`:`A fábrica começa a produzir <b>${esc(M.chosen.n)}</b>. Previsão: ${M.chosen.eta} corridas.`}</p><button class="btn go" data-act="closeModal">Fechar</button>`)}
// ---------- patrocinadores pessoais
function spProg(s){if(s.goal==="followers")return`${fmtK(s.prog)} de ${fmtK(s.tgt)}`;if(s.goal==="respect")return`respeito atual ${Math.round(G.fame.rep)}`;return`${s.prog} de ${s.tgt}`}
function sponsorsCard(){spInit();const A=G.sponsors,O=G.spOffers;const B=id=>SPONS.find(x=>x.id===id);
  return`<div class="card"><h3>Patrocinadores pessoais</h3>${A.length?A.map(s=>{const b=B(s.id);return`<div class="spon"><div class="kv"><span><span class="tc" style="background:${b.c}"></span><b>${esc(b.n)}</b> <span class="muted">· ${esc(b.sec)}</span></span><b class="num">${moneyS(s.pay)}/corrida</b></div>
    <div class="muted" style="font-size:13px">Meta: ${SPG[s.goal].d(s.tgt)} (${spProg(s)})${s.paidBonus?" · bônus pago":` · bônus ${moneyS(s.bonus)}`} · ${s.left} corrida${s.left>1?"s":""} de contrato</div>
    <div class="meter"><span>Satisfação</span>${bar(s.sat,0,100,b.c)}<b class="num">${Math.round(s.sat)}</b></div>${s.warned?`<span class="pill bad">Aviso da cláusula de imagem: polêmica acima de ${s.heatMax}</span>`:""}</div>`}).join(""):`<p class="muted">Nenhum patrocinador pessoal ainda. Popularidade e boa imagem atraem marcas.</p>`}
   ${O.length?`<h3>Propostas</h3>${O.map((o,i)=>{const b=B(o.id);return`<div class="spon"><div class="kv"><span><span class="tc" style="background:${b.c}"></span><b>${esc(b.n)}</b>${o.renew?" · renovação":""} <span class="muted">· ${esc(b.sec)}</span></span><b class="num">${moneyS(o.pay)}/corrida</b></div>
    <div class="muted" style="font-size:13px">${o.races} corridas · meta: ${SPG[o.goal].d(o.tgt)} (bônus ${moneyS(o.bonus)}) · o contrato cai se a polêmica passar de ${o.heatMax} · proposta válida por ${Math.max(1,o.exp-G.round)} corrida(s)</div>
    <div class="row"><button class="btn sm go" data-act="spAcc" data-k="${i}"${A.length>=3?" disabled":""}>Assinar</button><button class="btn sm" data-act="spDec" data-k="${i}">Recusar</button></div></div>`}).join("")}${A.length>=3?`<p class="muted" style="font-size:13px">Máximo de 3 patrocinadores pessoais ao mesmo tempo.</p>`:""}`:""}
   <p class="muted" style="font-size:13px">Posts patrocinados aparecem na aba Redes e deixam as marcas satisfeitas.</p></div>`}
function learnTab(){$("#body").innerHTML=`<div class="grid2" style="margin-top:12px">${GLOSS_CATS.map(([k,n])=>`<div class="card"><h3>${n}</h3>${Object.entries(GLOSS).filter(([,g])=>g.c===k).map(([,g])=>`<details class="gl"><summary>${g.t}</summary><p>${g.d}</p></details>`).join("")}</div>`).join("")}</div>`}

// ---------- fim de semana
const WSTEPS=[["press","Coletiva"],["practice","Treino livre"],["quali","Classificação"],["sprint","Sprint"],["prerace","Estratégia"],["race","Corrida"],["stewards","Comissários"],["results","Resultado"],["mixed","Zona mista"]];
function weekendScreen(){const C=W.C;const steps=W.mp?[["race","Corrida online"],["mpres","Resultado"]]:W.banned?[["banned","Suspensão"]]:WSTEPS.filter(s=>(s[0]!=="sprint"||W.sprint)&&(s[0]!=="stewards"||W.hadInc));const cur=steps.findIndex(s=>s[0]===W.step);
  app.innerHTML=(W.step==="race"||W.mp?"":topbar())+`<div class="row" style="justify-content:space-between"><h2>${C.gp} <span class="muted" style="font-weight:600;font-size:15px">${C.n}</span></h2>${W.step==="race"||W.step==="stewards"||W.mp?"":`<button class="btn sm" data-act="toHub">Paddock</button>`}</div>
  <div class="steps">${steps.map((s,i)=>`<span class="${i===cur?"on":i<cur?"done":""}">${s[1]}</span>`).join("")}</div><div id="wk"></div>`;
  ({press:pressStep,practice:practiceStep,quali:qualiStep,sprint:sprintStep,prerace:preStep,race:raceStep,stewards:stewardsStep,banned:bannedStep,results:resultsStep,mixed:mixedStep,mpres:()=>mpResultsStep()})[W.step]()}
function interviewHTML(title){const I=G.interview;const q=I.qs[I.i];const o=OUTLETS.find(x=>x.id===q.j.o);
  return`<div class="card press"><h3>${title} · pergunta ${I.i+1} de ${I.qs.length} ${ib("entrevista")}</h3><div class="mic">${av(journoAuthor(q.j))}<div style="min-width:0"><b>${esc(q.j.n)}</b> <span class="muted">${esc(o.n)} · estilo ${esc(o.tone)}</span><div class="qbub">${esc(q.q)}</div></div></div>
  <div class="ansl">${q.opts.map((a,i)=>`<button class="ans" data-act="answer" data-k="${i}"><span class="tone" style="background:${TONES[a.tone].c}">${TONES[a.tone].n}</span><span>"${esc(a.t)}"</span></button>`).join("")}</div></div>`}
function articleCard(a){return`<div class="card"><h3>Repercussão</h3><div class="art${a.heat?" hot":""}"><span class="src">${esc(a.outlet)} · ${esc(a.journo)}</span><h4>${esc(a.headline)}</h4><p>${esc(a.body)}</p></div></div>`}
function pressStep(){if(!G.interview&&!UI.pressDone)makeInterview("pre");const el=$("#wk");
  if(UI.pressDone){el.innerHTML=`<div class="grid2">${UI.pressArt?articleCard(UI.pressArt):""}<div class="card"><h3>Quinta-feira no paddock</h3><p>A coletiva acabou. Hora de ir para a pista: o treino livre define o acerto do carro.</p><button class="btn go" data-act="toPractice">Ir para o treino livre</button></div></div>`;return}
  if(!G.interview.qs.length){UI.pressDone=true;return pressStep()}
  el.innerHTML=`<div class="grid2"><div>${interviewHTML("Coletiva de imprensa")}</div><div class="card"><h3>Como funciona</h3><p>Cada resposta tem um tom. Respostas polêmicas aumentam a popularidade e viram manchete, mas derrubam a confiança da equipe e o respeito no paddock. Respostas técnicas e humildes constroem respeito.</p>
  <div class="meter"><span>Popularidade</span>${bar(G.fame.pop,0,100,"#F15BB5")}<b class="num">${Math.round(G.fame.pop)}</b></div><div class="meter"><span>Respeito</span>${bar(G.fame.rep,0,100,"#6EC1FF")}<b class="num">${Math.round(G.fame.rep)}</b></div><div class="meter"><span>Confiança</span>${bar(G.trust,0,100,"#21C55D")}<b class="num">${Math.round(G.trust)}</b></div></div></div>`}
function practiceStep(){const el=$("#wk");if(W.practice.done){el.innerHTML=`<div class="grid2"><div class="card"><h3>Relatório do treino</h3>${W.practice.msgs.map(m=>`<p>${esc(m)}</p>`).join("")}</div><div class="card"><h3>Próximo passo</h3><p>Classificação: Q1, Q2 e Q3 ${ib("classificacao")}.</p><button class="btn go" data-act="toQuali">Ir para a classificação</button></div></div>`;return}
  const f=forecast();const me=ME(),fm=famOf(me,W.C.id),ex=dExp(me);el.innerHTML=`<div class="grid2"><div class="card"><h3>Programa do treino livre</h3>
   <div class="meter"><span>Você e esta pista ${ib("experiencia")}<br><small class="muted">${famLabel(fm)}${ex.starts<10?` · ${ex.starts?ex.starts+"ª":"1ª"} temporada de estreante`:""}</small></span>${bar(fm*100,0,100,"#6EC1FF")}<b class="num">${Math.round(fm*100)}%</b></div><div class="choice">
   <button class="chip" data-act="practice" data-k="learn"><b>Aprender a pista</b><span>Muitas voltas para decorar o traçado: mais ritmo e menos erros${fm<.6?" (recomendado: você ainda não conhece bem a pista)":""}</span></button>
   <button class="chip" data-act="practice" data-k="setup"><b>Acerto do carro</b><span>Asa, suspensão e diferencial: melhora o ritmo no fim de semana todo</span></button>
   <button class="chip" data-act="practice" data-k="long"><b>Simulação de corrida</b><span>Tanque cheio: aprende a degradação e melhora a previsão do tempo</span></button>
   <button class="chip" data-act="practice" data-k="quali"><b>Voltas rápidas</b><span>Pouco combustível e pneu macio: mais confiança para a classificação</span></button></div></div>
   <div class="card"><h3>Previsão de chuva no domingo ${ib("chuva")}</h3><div class="fc">${f.map(x=>`<div>V${x.a}-${x.b}<b>${x.p}%</b></div>`).join("")}</div><p class="muted" style="font-size:13px">Previsões erram. A simulação de corrida deixa a meteorologia mais precisa.</p>
   ${W.qualiRain?`<p class="pill warn">Nuvens carregadas para a classificação</p>`:""}</div></div>`}
function qualiStep(){const el=$("#wk");if(W.quali){const q=W.quali;const me=q.order.findIndex(x=>x.id===G.me)+1;const lv=r=>r.q3!==undefined?3:r.q2!==undefined?2:1;
   el.innerHTML=`<div class="grid2"><div class="card"><h3>Resultado da classificação ${ib("classificacao")}</h3><div class="tw"><table><thead><tr><th>#</th><th>Piloto</th><th>Q1</th><th>Q2</th><th>Q3</th></tr></thead><tbody>${q.order.map((r,i)=>{const d=G.drivers[r.id],t=teamOf(r.team);const L=lv(r);return`<tr class="${r.id===G.me?"me":""}"><td class="num">${i+1}</td><td>${teamLogo(t,"tc")}${d.code}</td>${[1,2,3].map(s=>`<td class="num ${L===s?"":"muted"}">${s>L?"":r["e"+s]?"sem tempo":fmtT(r["q"+s])}</td>`).join("")}</tr>`}).join("")}</tbody></table></div>
   ${q.pens.length?`<p class="muted">Punições no grid: ${q.pens.map(p=>`${G.drivers[p.id].code} +${p.n}`).join(", ")}</p>`:""}</div>
   <div class="card"><h3>Você larga em ${W.grid.indexOf(G.me)+1}º</h3><p>${me<=10?"Você chegou ao Q3!":me<=16?"Eliminado no Q2.":"Eliminado no Q1."} ${W.quali.rain?"Pista molhada mexeu na ordem.":""}</p><button class="btn go" data-act="toNextAfterQuali">${W.sprint?"Ir para a sprint":"Definir a estratégia"}</button></div></div>`;return}
  el.innerHTML=`<div class="grid2"><div class="card"><h3>Como atacar a volta lançada?</h3><div class="choice">
   <button class="chip" data-act="quali" data-k="safe"><b>Volta segura</b><span>Poucos erros, alguns décimos a menos</span></button>
   <button class="chip" data-act="quali" data-k="normal"><b>No limite</b><span>Equilíbrio entre risco e tempo</span></button>
   <button class="chip" data-act="quali" data-k="risky"><b>Tudo ou nada</b><span>Zebras, freada tardia, energia total. Pode não marcar tempo</span></button></div></div>
   <div class="card"><h3>Seu carro</h3><div class="kv"><span>Acerto</span><b class="num">${Math.round((W.setup[G.me]||.6)*100)}%</b></div><div class="kv"><span>Volta lançada</span><b class="num">${ME().a.quali}</b></div><div class="kv"><span>Carro (média)</span><b class="num">${carAvg(myTeam()).toFixed(1)}</b></div></div></div>`}
function sprintStep(){const el=$("#wk");if(!W.sprintRes){el.innerHTML=`<div class="card"><h3>Corrida sprint ${ib("sprint")}</h3><p>Cerca de 100 km, sem pit stop obrigatório. Pontos para os 8 primeiros.</p><button class="btn go" data-act="runSprint">Disputar a sprint</button></div>`;return}
  const r=W.sprintRes;const e=r.cls.find(x=>x.d===G.me);el.innerHTML=`<div class="grid2"><div class="card"><h3>Resultado da sprint</h3>${resultTable(r.cls.slice(0,22))}</div><div class="card"><h3>Você: ${e.status==="ok"?e.pos+"º":"abandonou"}${e.pts?` · ${e.pts} pts`:""}</h3><button class="btn go" data-act="toPre">Definir a estratégia da corrida</button></div></div>`}
function preStep(){const el=$("#wk");const plans=strategyPlans();UI.pre=UI.pre||{plan:"A",fuel:"normal",tyre:null};const P=UI.pre;const f=forecast();const wet=rainAt(0)>0;
  el.innerHTML=`<div class="grid2"><div class="card"><h3>Plano de pit stops ${ib("undercut")}</h3><div class="choice">${plans.map(p=>`<button class="chip${P.plan===p.id?" on":""}" data-act="prePlan" data-k="${p.id}"><b>${p.n}</b><span>${p.stops.map(s=>`volta ${s.lap} → ${COMP[s.c].n}`).join(" · ")}</span></button>`).join("")}</div>
   <h3>Pneu de largada ${ib("compostos")}</h3><div class="row">${["S","M","H"].map(c=>`<button class="btn sm${(P.tyre||plans.find(p=>p.id===P.plan).start)===c?" on":""}" data-act="preTyre" data-k="${c}">${tyreBadge(c)} ${COMP[c].n}</button>`).join("")}</div>
   ${wet?`<p class="pill warn">Pista molhada na largada: todos largam com pneus de chuva.</p>`:""}
   <h3>Combustível ${ib("combustivel")}</h3><div class="choice">${[["light","Leve","Mais rápido no início, pode exigir economia"],["normal","Normal","Margem segura"],["heavy","Cheio","Ataque livre, mais lento no começo"]].map(([k,a,b])=>`<button class="chip${P.fuel===k?" on":""}" data-act="preFuel" data-k="${k}"><b>${a}</b><span>${b}</span></button>`).join("")}</div></div>
   <div class="card"><h3>Grid de largada</h3><div class="tw" style="max-height:300px;overflow-y:auto"><table><tbody>${W.grid.map((id,i)=>{const d=G.drivers[id],t=teamOf(d.team);return`<tr class="${id===G.me?"me":""}"><td class="num">${i+1}</td><td>${teamLogo(t,"tc")}${esc(d.n)}</td><td class="muted">${t.n}</td></tr>`}).join("")}</tbody></table></div>
   <div class="fc">${f.map(x=>`<div>V${x.a}-${x.b}<b>${x.p}%</b></div>`).join("")}</div>
   <p class="muted" style="font-size:13.5px">Na corrida você pilota. Seu engenheiro fala com você pelo rádio e você responde: ritmo, energia, pedir box e obedecer ou não as ordens da equipe.</p>
   <button class="btn go" data-act="startRace">Alinhar no grid</button></div></div>`}
function resultTable(cls){return`<div class="tw"><table><thead><tr><th>#</th><th>Piloto</th><th>Equipe</th><th>Tempo</th><th>Pts</th></tr></thead><tbody>${cls.map(e=>{const d=G.drivers[e.d],t=teamOf(e.team);return`<tr class="${e.d===G.me?"me":""}"><td class="num">${e.pos||e.status.toUpperCase()}</td><td>${teamLogo(t,"tc")}${esc(d.n)}${e.fl?` <span class="pill" style="background:#3A1A55">volta + rápida</span>`:""}</td><td class="muted">${t.n}</td><td class="num">${e.status==="ok"?(e.pos===1?"vencedor":e.laps<cls[0].laps?`+${cls[0].laps-e.laps} v`:"+"+e.time.toFixed(3)):esc(e.why||"")}</td><td class="num">${e.pts||""}</td></tr>`}).join("")}</tbody></table></div>`}

// ---------- corrida
function raceStep(){const me=R.cars.find(c=>c.isP);UI.trace=new Float32Array(R.geo.N);UI.best=null;UI.lastLap=-1;UI.radioN=R.radio.length;UI.msgN=0;UI.paused=false;CAM.init=0;if(typeof tvReset==="function")tvReset();if(typeof wxReset==="function")wxReset();if(typeof smartReset==="function")smartReset();if(typeof tipsReset==="function")tipsReset();CAM.userZ=1;CAM.pan=null;TV.cam=null;DIR.subj=null;DIR.until=0;UI.rtab=UI.rtab||"radio";
  if(UI.cam==="auto"||UI.cam==="onboard")UI.cam="tv";// Auto e Bordo saíram: a TV faz o papel da Auto
  const cams=[["tv","TV"],["director","Diretor"],["chase","Perseguição"],["all","Pista"]];
  $("#wk").innerHTML=`<div class="race2">
   <div class="stage" id="stage"><canvas class="main" id="rc"></canvas>
    <div class="rhud" id="hud">
     <div class="h-tower" id="hTower"><div class="h-head"><b id="hLap">VOLTA</b><span id="hTowerMode"></span></div><div id="hRows"></div></div>
     <div class="h-sec" id="hSec"><div class="h-top"><span class="h-pos"><b id="hPos">P–</b><span id="hPosN"></span></span><span class="h-lapt" id="hCur">0:00.0</span></div>
      <div class="h-bars"><i id="hS1"></i><i id="hS2"></i><i id="hS3"></i></div>
      <div class="h-line"><span>Delta</span><b id="hDelta">—</b></div><div class="h-line"><span>Melhor</span><b id="hBest">—</b></div><div class="h-wx" id="hWx"></div></div>
     <canvas class="minimap h-map" id="mm" width="300" height="210" data-act="camAll" aria-label="Minimapa: toque para ver a pista inteira"></canvas>
     <div class="h-car" id="hCar"><canvas id="hCarCv" width="220" height="264" aria-label="Estado do carro e dos pneus"></canvas><span id="hCarTxt"></span></div>
     <div class="h-wheel" id="hWheel"><div class="hw-spd"><b id="hwSpd">0</b><small>km/h</small></div><div class="hw-gear" id="hwGear">N</div>
      <div class="hw-mid"><div class="hw-bat"><i id="hwBat"></i></div><div class="hw-lamps"><span class="lamp" id="hwOT">OVERTAKE</span><span class="lamp aero" id="hwAero">AERO</span><span class="lamp clip" id="hwClip">CLIP</span><span class="lamp tow" id="hwTow">VÁCUO</span><span class="lamp" id="hwRisk">RISCO</span></div></div><div class="hw-ers" id="hwErs">AUTO</div></div>
    </div>
    <div class="flag" id="flag" hidden></div><div class="lights" id="lights" hidden><div class="lamps">${"<i></i>".repeat(5)}</div><span>LUZES</span></div>
    <div class="toast" id="toast" hidden></div><div class="lower" id="lower" hidden></div><div class="pausedov" id="pausedov" hidden>PAUSADO</div>
    <div class="ask" id="ask" hidden></div><div class="tipbox" id="tipbox" hidden></div><div class="perfbox" id="perfbox" hidden><canvas width="240" height="60"></canvas><div class="pl"></div></div>
    <div class="launch" id="launch" hidden><button class="launchbtn" data-act="launchTap" id="launchBtn">LARGAR</button><span id="launchTxt">Toque quando as cinco luzes APAGAREM (ou aperte espaço)</span></div></div>
   <div class="ctl"><div class="row"><button class="btn sm" data-act="skipForm" id="skipForm" hidden>⏭ Pular volta de apresentação</button><button class="btn sm" data-act="pause" id="pauseb">⏸ Pausar</button><button class="btn sm" data-act="snd" id="sndb">${UI.sound?"🔊 Som ligado":"🔈 Ligar som"}</button><button class="btn sm" data-act="hudOpen">⚙️ Tela e som</button><button class="btn sm" data-act="perf" id="perfb">📊 Desempenho</button><button class="btn sm" data-act="simRest" id="simrest" hidden>Simular o resto da corrida</button></div>
    <div class="seg" id="cams">${cams.map(([k,n])=>`<button data-act="cam" data-k="${k}" class="${UI.cam===k?"on":""}">${n}</button>`).join("")}</div></div>
   <div class="rtabs" role="tablist">${[["radio","Rádio"],["tele","Telemetria"],["pos","Posições"]].map(([k,n])=>`<button role="tab" data-act="rtab" data-k="${k}" class="${UI.rtab===k?"on":""}">${n}</button>`).join("")}</div>
   <div class="rpanes">
    <section class="pane pane-radio${UI.rtab==="radio"?" on":""}" data-pane="radio"><div class="radioctl">
     <div class="card"><h3>Ritmo ${ib("temperatura")}</h3><div class="seg">${[["attack","Atacar"],["normal","Normal"],["save","Poupar"]].map(([k,n])=>`<button data-act="mode" data-k="${k}" id="m_${k}">${n}</button>`).join("")}</div>
      ${typeof ccCard==="function"&&!(R&&R.mpGuest)?ccCard():""}<h3>Energia ${ib("ers")}</h3><div class="seg">${[["auto","Auto"],["attack","Boost"],["defend","Defesa"],["save","Recarregar"]].map(([k,n])=>`<button data-act="ers" data-k="${k}" id="e_${k}">${n}</button>`).join("")}</div>
      <h4 class="ag" style="margin-top:8px">Plano de energia</h4><div class="seg">${Object.entries(EPLAN).map(([k,n])=>`<button data-act="eplan" data-k="${k}" id="ep_${k}">${n}</button>`).join("")}</div>
      <h3>Disputa ${ib("duelo")}</h3><div class="seg">${Object.entries(ASTYLE_S).map(([k,n])=>`<button data-act="astyle" data-k="${k}" id="as_${k}">${n}</button>`).join("")}</div>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-act="go" id="gob">Atacar agora</button><button class="btn sm" data-act="def" id="defb">Segurar posição</button><button class="btn sm" data-act="back" id="backb">Recuar</button><span class="muted num" id="gost" style="font-size:12.5px"></span></div>
      <div class="row" style="margin-top:6px"><button class="btn sm" data-act="tow" id="towb">Quebrar o vácuo</button><span class="muted num" id="towst" style="font-size:12.5px"></span></div>
      <div class="row" style="margin-top:8px"><button class="btn sm${G.settings.autoDec===false?"":" on"}" data-act="autoDec" id="adb">Decisões óbvias automáticas</button><button class="btn sm${G.settings.tips===false?"":" on"}" data-act="tipsT" id="tpb">Dicas do engenheiro</button><button class="btn sm${typeof PREFS!=="undefined"&&PREFS.tv===false?"":" on"}" data-act="tvT" id="tvb">Gráficos de TV</button></div></div>
     <div class="card"><h3>Pedir box ${ib("pitlane")}</h3><div class="tyrepick">${["S","M","H","I","W"].map(c=>`<button data-act="box" data-k="${c}">${tyreBadge(c)}${COMP[c].n}</button>`).join("")}</div><div class="row"><button class="btn sm" data-act="box" data-k="">Cancelar box</button><span class="muted num" id="pitp" style="font-size:12.5px"></span></div>${typeof pxCard==="function"&&!(R&&R.mpGuest)?pxCard():""}</div>
     <div class="card" style="grid-column:1/-1"><h3>Rádio</h3><ul class="rfeed" id="rfeed"></ul></div></div></section>
    <section class="pane pane-tele${UI.rtab==="tele"?" on":""}" data-pane="tele"><div class="wxbox"><canvas id="radar" width="440" height="300" aria-label="radar de chuva"></canvas><div id="wxfc" class="wxfc"></div></div><div class="wheel" id="wheel"></div><canvas class="trace" id="trace" width="900" height="220" aria-label="telemetria de velocidade"></canvas></section>
    <section class="pane pane-pos card tower${UI.rtab==="pos"?" on":""}" data-pane="pos" style="padding:10px"><h3 id="lapc">Volta</h3><div class="tw"><table><tbody id="tower"></tbody></table></div><h3>Direção de prova</h3><ul class="feed" id="rcfeed"></ul><h3>Transmissão</h3><ul class="feed" id="nfeed"></ul></section>
   </div></div>`;
  setupStage();applyHud();UI.last=performance.now();if(R.mp)mpRaceDecor();
  UI.raf=requestAnimationFrame(raceLoop)}
// ---------- configuração da tela da corrida (salva no jogo)
const HUD_DEF={tower:"rel",labels:"near",sectors:true,car:true,wheel:true,map:true,bubbles:true,weather:true,trace:true};
function hudCfg(){G.settings.hud=Object.assign({},HUD_DEF,G.settings.hud||{});return G.settings.hud}
function applyHud(){const H=hudCfg();const tog=(id,on)=>{const e=$(id);if(e)e.hidden=!on};
  tog("#hTower",H.tower!=="off");tog("#hSec",H.sectors);tog("#hCar",H.car);tog("#hWheel",H.wheel);tog("#mm",H.map);tog("#trace",H.trace);tog("#hWx",H.weather);
  const t=$("#hTower");if(t){t.classList.toggle("full",H.tower==="full");t._h=null;const r=$("#hRows");if(r)r._h=null}
  const lw=$("#lower");if(lw)lw.classList.toggle("nomap",!H.map)}
function hudSettings(){const H=hudCfg();const seg=(k,o)=>`<div class="seg">${o.map(([v,n])=>`<button data-act="hud" data-k="${k}:${v}" class="${H[k]===v?"on":""}">${n}</button>`).join("")}</div>`;
  const tg=(k,n)=>`<button class="chip${H[k]?" on":""}" data-act="hudT" data-k="${k}" aria-pressed="${!!H[k]}"><b>${H[k]?"✓ ":""}${n}</b></button>`;
  modal(`<h2>Configurar a tela</h2><p class="muted" style="font-size:14px">O que aparece sobre a pista durante a corrida. Fica salvo para as próximas corridas.</p>
   <h3>Torre de posições</h3>${seg("tower",[["rel","Perto de mim"],["full","Grid inteiro"],["off","Esconder"]])}
   <h3>Nomes sobre os carros</h3>${seg("labels",[["all","Todos"],["near","Perto de mim"],["mine","Só o meu"]])}
   <h3>Painéis</h3><div class="choice">${tg("sectors","Setores e tempos")}${tg("car","Estado do carro e pneus")}${tg("wheel","Volante")}${tg("map","Minimapa")}${tg("bubbles","Balões sobre os carros")}${tg("weather","Clima")}${tg("trace","Gráfico de velocidade")}</div>
   <div class="row" style="margin-top:6px"><button class="btn sm" data-act="hudCinema">Modo cinema</button><button class="btn sm" data-act="hudReset">Restaurar padrão</button></div>${typeof sndPanel==="function"?sndPanel():""}<div class="row" style="margin-top:6px"><button class="btn go sm" data-act="closeModal">Pronto</button></div>`)}
// ---------- HUD: torre, setores, volante e estado do carro
function relGap(me,c){if(c===me)return"";if(c.status==="dnf"||c.status==="dsq")return"OUT";if(c.pit)return"BOX";const d=(c.prog-me.prog);if(Math.abs(d)>=1)return(d>0?"−":"+")+Math.floor(Math.abs(d))+" V";const t=d*me.L;return(t>0?"−":"+")+Math.abs(t).toFixed(3)}
// torre: quem subiu fica verde, quem desceu vermelho (3 s); relógio roxo na volta mais rápida; linhas deslizam na troca
const TWA={pos:{},chg:{},key:null};
function towerFxTick(){if(!R)return;if(TWA.key!==R){TWA.key=R;TWA.pos={};TWA.chg={}}if(!R.started)return;R.order.forEach((c,i)=>{const p=i+1,o=TWA.pos[c.id];if(o!=null&&o!==p&&running(c))TWA.chg[c.id]={d:p<o?1:-1,t:R.t};TWA.pos[c.id]=p})}
function towerPosCls(c){const ch=TWA.chg[c.id];return ch&&R.t-ch.t<3?(ch.d>0?" up":" dn"):""}
function fastIcon(c){return R.fast&&R.fast.c===c?`<svg class="fl" viewBox="0 0 16 16" aria-label="volta mais rápida"><circle cx="8" cy="9" r="6" fill="#A020F0"/><rect x="6.5" y="1" width="3" height="2" rx=".6" fill="#A020F0"/><path d="M8 9 L8 5.5 M8 9 L10.4 10.4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`:""}
// troca o conteúdo e anima cada linha (data-id) da posição antiga até a nova
function setRowsAnim(sel,h){const e=$(sel);if(!e||e._h===h)return;const old={};for(const r of e.children){const id=r.dataset&&r.dataset.id;if(id)old[id]=r.offsetTop}
  e._h=h;e.innerHTML=h;for(const r of e.children){const id=r.dataset&&r.dataset.id;if(!id||old[id]==null)continue;const dy=old[id]-r.offsetTop;if(Math.abs(dy)<2)continue;
    r.style.transition="none";r.style.transform=`translateY(${dy}px)`;r.offsetHeight;r.style.transition="transform .4s cubic-bezier(.2,.8,.2,1)";r.style.transform="";r.style.position="relative";r.style.zIndex=dy>0?"2":"1"}}
function hudTower(me){const H=hudCfg();if(H.tower==="off")return;const ord=R.order,n=ord.length;let rows;
  if(H.tower==="full")rows=ord.map((c,i)=>[c,i]);else{const i=Math.max(0,ord.indexOf(me));const a=clamp(i-2,0,Math.max(0,n-5));rows=ord.slice(a,a+5).map((c,k)=>[c,a+k])}
  const xp=typeof towerCamRow==="function"?towerCamRow(rows.map(r=>r[0]),me):null;
  towerFxTick();setRowsAnim("#hRows",rows.map(([c,i])=>{const T=TYRES[c.tyre.c];const g=H.tower==="full"?(i===0?"Líder":gapTxt(c)):(c===me?"":relGap(me,c));
    return`<div data-id="${c.id}" class="h-row${c.isP?" me":c.hum?" hu":""}${c.status!=="run"&&c.status!=="fin"?" out":""}"><span class="num${towerPosCls(c)}">${i+1}</span>${teamLogo(c.t,"hlg")}<span class="cd">${c.code}${fastIcon(c)}</span><span class="ty" style="color:${T.c};border-color:${T.c}">${c.tyre.c}</span><span class="hg${c.pit&&running(c)?" pit":""}">${g}</span></div>`+(xp&&xp.id===c.id?`<div class="h-cam" id="hTwSp" style="height:${xp.h}px"><span class="h-camlab" style="border-color:${c.col}">${xp.lab}</span></div>`:"")}).join(""));
  setT("hLap",`VOLTA ${Math.min(R.L,Math.max(1,R.lead+1))}/${R.L}`);setT("hTowerMode",H.tower==="full"?"GRID":"")}
function secCls(me,k){const t=me.secCur[k];if(t==null)return"";const b=R.secBest[k];if(b&&b.id===me.id&&Math.abs(b.t-t)<1e-6)return"p";if(me.secPB[k]!=null&&Math.abs(me.secPB[k]-t)<1e-6)return"g";return"y"}
function hudSectors(me){const H=hudCfg();if(!H.sectors)return;const p=R.order.indexOf(me)+1;setT("hPos","P"+p);setT("hPosN","/"+R.cars.length);
  const cur=me.status==="run"&&R.started?R.t-me.lapStart:0;setT("hCur",fmtT(Math.max(0,cur)).replace(/(\.\d)\d\d$/,"$1"));
  let k=0;while(k<3&&me.secCur[k]!=null)k++;for(let j=0;j<3;j++){const e=$("#hS"+(j+1));if(!e)continue;const c=j<k?secCls(me,j):j===k&&running(me)?"cur":"";if(e.className!==c)e.className=c}
  const d=lapDelta(me);const de=setT("hDelta",d==null?"—":(d>0?"+":"−")+Math.abs(d).toFixed(3));if(de)de.className=d==null?"":d>0?"pos":"neg";setT("hBest",fmtT(me.best))}
function hudWheel(me){const H=hudCfg();if(!H.wheel)return;const g=gearRpm(Math.max(1,me.v));const run=running(me)&&R.started;
  setT("hwSpd",String(run?Math.round(me.v*3.6):0));setT("hwGear",!run?"N":me.pit?"P":String(g.gear));
  const b=$("#hwBat");if(b){b.style.width=clamp(me.batt,0,100).toFixed(0)+"%";b.style.background=me.batt<15?"#FF4D4F":"#B65CFF"}
  const zone=R.geo.ai&&R.geo.ai.ph[Math.floor(fr(me.prog)*R.geo.N)%R.geo.N]===0&&me.v>45&&R.geo.zoneMask[Math.floor(fr(me.prog)*R.geo.N)%R.geo.N];
  $("#hwOT").classList.toggle("on",!!me.ovMode);$("#hwAero").classList.toggle("on",!!zone);$("#hwClip").classList.toggle("on",!!me.clip);{const rl=$("#hwRisk");if(rl){const ri=me.rk||riskInfo(me);const[lb,col]=riskLabel(ri.v);const on=ri.v>=1.35;rl.classList.toggle("on",on);const bg=on?col:"";if(rl.style.background!==bg){rl.style.background=bg;rl.style.color=on?"#111":""}}}{const tw=$("#hwTow");if(tw){const on=(me.tow||0)>.35,dirty=!!me.dirty;tw.classList.toggle("on",on||dirty);tw.classList.toggle("dirty",dirty&&!on);const tx=dirty&&!on?"AR SUJO":"VÁCUO";if(tw.textContent!==tx)tw.textContent=tx}}
  setT("hwErs",{auto:"ERS AUTO",attack:"BOOST",defend:"DEFESA",save:"RECARGA"}[me.ers]+" · "+Math.round(me.batt)+"%")}
// desgaste por roda: o lado de fora das curvas da pista e o eixo mais exigido gastam mais
function wheelWear(c){const w=c.tyre.wear,s=R.C.cw?1:-1,f=R.C.street?.95:1.05,j=(hashS(c.id)%7)/100;
  return{FL:clamp(w*(1+.12*s)*f+j*w,0,1),FR:clamp(w*(1-.12*s)*f,0,1),RL:clamp(w*(1+.12*s)*(2-f),0,1),RR:clamp(w*(1-.12*s)*(2-f)+j*w,0,1)}}
function drawCarStatus(c){const cv=$("#hCarCv");if(!cv||!c)return;const ctx=cv.getContext("2d"),k=cv.width/110;ctx.setTransform(k,0,0,k,0,0);ctx.clearRect(0,0,110,132);
  const ok="#2BD46E",col=v=>v<.12?ok:v<.5?"#FFD400":"#FF4D4F";const d=c.dmg||{};const ww=wheelWear(c);
  const rr=(x,y,w,h,r,fill)=>{ctx.fillStyle=fill;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.fill()};
  // carro visto de cima
  rr(33,12,44,6,2,col(d.wing||0));// asa dianteira
  ctx.fillStyle=ok;ctx.beginPath();ctx.moveTo(51,18);ctx.lineTo(59,18);ctx.lineTo(61,44);ctx.lineTo(49,44);ctx.fill();// bico
  rr(41,44,28,46,8,col(Math.max(d.floor||0,d.body||0)));// assoalho e laterais
  rr(50,50,10,10,5,"#0B0D12");// cockpit
  rr(51,62,8,30,3,col(d.power?.9:0));// motor / ERS
  rr(50,92,10,12,2,col(d.gear||0));// câmbio
  rr(36,106,38,6,2,col(d.rwing||0));// asa traseira
  ctx.strokeStyle=col(d.susp||0);ctx.lineWidth=2;[[38,33,44,46],[72,33,66,46],[37,93,44,86],[73,93,66,86]].forEach(([a,b,c2,e])=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c2,e);ctx.stroke()});// suspensão
  // rodas: cor pelo desgaste
  const wcol=v=>v<.4?"#21C55D":v<.65?"#FFD400":v<.82?"#FF8A00":"#FF4D4F";
  [["FL",28,24],["FR",72,24],["RL",27,84],["RR",73,84]].forEach(([n,x,y])=>{rr(x,y,10,18,3,wcol(ww[n]))});
  // freios superaquecidos
  if(c.brakeHot){ctx.fillStyle="#FF8A00";[[33,33],[77,33]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,2.5,0,7);ctx.fill()})}
  // % de desgaste ao lado de cada roda
  ctx.font="700 9px 'Roboto Mono',monospace";ctx.textAlign="center";ctx.fillStyle="#EEF1F5";
  [["FL",12,36],["FR",98,36],["RL",12,96],["RR",98,96]].forEach(([n,x,y])=>{ctx.strokeStyle=wcol(ww[n]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-3,9.5,0,7);ctx.stroke();ctx.fillText(Math.round(ww[n]*100)+"%",x,y)});
  setT("hCarTxt",`${TYRES[c.tyre.c].n} · ${c.tyre.age}v · ${Math.round(c.tyre.temp)}°C`)}
function setupStage(){const st=$("#stage");let drag=null,pinch=null;const pts=new Map();
  st.addEventListener("wheel",e=>{e.preventDefault();CAM.userZ=clamp((CAM.userZ||1)*(e.deltaY<0?1.1:.91),.4,3.5)},{passive:false});
  st.addEventListener("pointerdown",e=>{if(R&&R.form&&R.form.phase==="lights"&&!R.autoStart){const me=R.cars.find(c=>c.isP);if(me&&!me.tapped&&(!R.started||me.hold)&&!e.target.closest(".ctl")){tapLaunch();return}}if(e.target.closest("button,.ask,.minimap"))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===2){const[a,b]=[...pts.values()];pinch={d:Math.max(20,Math.hypot(a.x-b.x,a.y-b.y)),z:CAM.userZ};drag=null}else drag={x:e.clientX,y:e.clientY,px:(CAM.pan||{x:0}).x,py:(CAM.pan||{y:0}).y}});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!pts.size)drag=null};window.onpointerup=up;window.onpointercancel=up;
  st.addEventListener("pointermove",e=>{if(pts.has(e.pointerId))pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch&&pts.size===2){const[a,b]=[...pts.values()];CAM.userZ=clamp(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d,.4,3.5);return}
    if(!drag||UI.cam!=="all")return;CAM.pan={x:drag.px-(e.clientX-drag.x)/CAM.z,y:drag.py-(e.clientY-drag.y)/CAM.z}})}
function fitRaceCanvas(){const cv=$("#rc");if(!cv)return null;const st=$("#stage");const dpr=(typeof qDpr==="function"?qDpr():Math.min(2,window.devicePixelRatio||1));const cw=st.clientWidth,ch=Math.round(cw<760?clamp(window.innerHeight*.68,380,cw*1.65):Math.min(600,Math.max(320,cw*.6)));
  if(cv.width!==Math.round(cw*dpr)||cv.height!==Math.round(ch*dpr)){cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);cv.style.height=ch+"px"}const ctx=cv.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);return{ctx,cw,ch}}
// diretor de TV: alterna entre o seu carro e as brigas, e corta para os grandes momentos
const DIR={subj:null,until:0,kind:"chase",label:"",ev:0,fixed:null};
const HL_LABEL={crash:"Acidente",contact:"Toque",spin:"Rodada",lead:"Novo líder",pass:"Ultrapassagem",pit:"Pit stop",finish:"Bandeira quadriculada",start:"Largada"};
function setShot(c,kind,dur,label,fixed){if(DIR.subj!==c||DIR.kind!==kind||fixed)CAM.cut=1;DIR.subj=c;DIR.kind=kind;DIR.until=R.t+dur;DIR.label=label;DIR.fixed=fixed||null;TV.cam=null}
function closestBattle(){if(R.sc||R.red)return null;let best=null,bg=.7;for(let i=1;i<R.order.length;i++){const A=R.order[i-1],B=R.order[i];if(!running(A)||!running(B)||A.pit||B.pit)continue;const g=(A.prog-B.prog)*B.L;const w=g-(i<=6?.15:0);if(w<bg){bg=w;best={A,B}}}return best}
function directorPick(){const me=R.cars.find(c=>c.isP);const h=R.hl[R.hl.length-1];
  if(R.form&&R.form.phase!=="lights"&&!R.started){if(!DIR.subj||R.t>DIR.until){const c=vpick(R.cars.filter(running));setShot(c,vrnd()<.5?"tv":"chase",7,"Volta de apresentação · "+c.code)}return}
  if(h&&h.t>DIR.ev&&R.t-h.t<2.5&&h.imp>=2&&h.type!=="start"){DIR.ev=h.t;const c=R.cars.find(x=>x.id===h.cars[0]);
    if(c){const lab=`${HL_LABEL[h.type]||"Replay"} · ${h.cars.map(id=>R.cars.find(x=>x.id===id).code).join(" × ")}`;
      if(!running(c)&&c.status!=="fin"){const w=R.wrecks.find(w=>w.c===c);if(w){const p=trackPos(w.f,(w._lw??w.lat)*WS);setShot(c,"fixed",8,lab,p);return}}
      else{setShot(c,"tv",8,lab);return}}}
  const cur=DIR.subj;if(R.t<DIR.until&&cur&&(running(cur)||DIR.kind==="fixed"))return;
  const r=vrnd();const b=closestBattle();
  if(me&&running(me)&&(r<.5||!b)){setShot(me,vrnd()<.45?"chase":"tv",9,`Você · P${pos(me)} · ${me.code}`);return}
  if(b&&r<.85){setShot(b.B,"tv",8,`Briga pelo ${pos(b.A)}º · ${b.A.code} × ${b.B.code}`);return}
  const l=R.order.find(c=>running(c)&&!c.pit);if(l)setShot(l,"tv",7,`Líder · ${l.code}`)}
function cameraFrame(dt,cw,ch){const me=R.cars.find(c=>c.isP);let foc=me,kind=UI.cam;if(UI.cam==="tv"&&typeof smartPick==="function")return smartPick(dt,cw,ch);
  if(UI.cam==="director"){directorPick();foc=DIR.subj||me;kind=DIR.kind}
  if(kind==="all"){shotAll(dt,cw,ch);camShake(dt,null);return null}
  if(kind==="fixed"&&DIR.fixed){const[tx,ty]=iso(DIR.fixed.x,DIR.fixed.y);camTo(dt,tx,ty,Math.min(cw,ch*1.3)/(WS*85)*CAM.userZ,.2,1.5);camShake(dt,null);return null}
  if(!foc||(!running(foc)&&foc.status!=="fin")||(foc.status==="fin"&&R.over)){shotAll(dt,cw,ch);camShake(dt,null);return null}
  if(kind==="chase")shotChase(dt,cw,ch,foc);else shotTV(dt,cw,ch,foc);camShake(dt,foc);return foc}
let VIGN=null;
function drawVignette(ctx,cw,ch){if(!VIGN||VIGN.w!==cw||VIGN.h!==ch){const g=ctx.createRadialGradient(cw/2,ch/2,Math.min(cw,ch)*.38,cw/2,ch/2,Math.max(cw,ch)*.72);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.38)");VIGN={w:cw,h:ch,g}}ctx.fillStyle=VIGN.g;ctx.fillRect(0,0,cw,ch)}
function raceLoop(now){if(typeof MUS!=="undefined"&&MUS.on)sndMusic(false);if(G.phase!=="weekend"||W.step!=="race"||!$("#rc"))return;const rdt=Math.min(.1,(now-UI.last)/1000);UI.last=now;FDT=Math.max(.001,rdt);if(typeof perfFrame==="function")perfFrame(now);
  if(R.mpGuest){mpGuestFrame(now);traceRec();if(R.started&&typeof aiSense==="function")aiSense();rbRecord()}
  else if(!UI.paused&&!R.over&&!R.redChoose)simAdvance(rdt*UI.speed,Math.ceil(UI.speed*3)+4,traceRec);
  if(R.mpHost)mpHostTick(now);
  if(R.redChoose&&!$("#ask").dataset.red)showRedChoice();
  const s=typeof stageVisible!=="function"||stageVisible()?fitRaceCanvas():null;let foc=null;if(s){const{ctx,cw,ch}=s;let drew=false;if(UI.cam==="tv"&&typeof SMART!=="undefined"&&SMART.mode==="replay")drew=smartDrawReplay(ctx,cw,ch,rdt);
    RENDER_A=R.mpGuest||UI.paused?null:Math.min(1,(R.acc||0)/SIM_DT);if(!drew){foc=cameraFrame(rdt,cw,ch);UI.foc=foc;drawScene(ctx,cw,ch)}drawRain(ctx,cw,ch,R.rain&&R.w>.15?R.rain:0);if(UI.cam!=="all"&&(typeof QL==="undefined"||QL.lvl>0))drawVignette(ctx,cw,ch);if(UI.cam==="tv"&&typeof smartPip==="function")smartPip(ctx,cw,ch);if(typeof tvOverlay==="function")tvOverlay(ctx,cw,ch,rdt);else if(CAM.flash>0){ctx.fillStyle=`rgba(0,0,0,${.55*CAM.flash})`;ctx.fillRect(0,0,cw,ch)}
    const mm=$("#mm");if(mm&&!mm.hidden){const mx=mm.getContext("2d");mx.setTransform(2,0,0,2,0,0);drawMinimap(mx,mm.width/2,mm.height/2)}}
  RENDER_A=null;/* fora do desenho, ninguém lê posição interpolada */updatePanels(now);if(typeof tipsTick==="function")tipsTick();if(typeof pxRefresh==="function"&&(UI.pxN=(UI.pxN||0)+1)%15===0){pxRefresh();if(typeof ccRefresh==="function")ccRefresh()}
  const lw=$("#lower");if(lw){if(typeof tvLower==="function")tvLower(lw,foc||R.cars.find(c=>c.isP));else{const lab=UI.cam==="director"?DIR.label:UI.cam==="tv"&&typeof SMART!=="undefined"?SMART.label:"";const show=!!lab;lw.hidden=!show;if(show&&lw.textContent!==lab)lw.textContent=lab}}
  if(UI.sound){const me=R.cars.find(c=>c.isP);const f=foc||me;let near=null;if(f&&f._w){let bd=1e9;for(const c of R.cars){if(c===f||!running(c)||!c._w)continue;const d=Math.hypot(c._w.x-f._w.x,c._w.y-f._w.y);if(d<bd){bd=d;near={v:c.v,d:d/(12*WS),app:c.prog<f.prog,pan:(-Math.sin(f._w.h)*(c._w.x-f._w.x)+Math.cos(f._w.h)*(c._w.y-f._w.y))/(14*WS)}}}if(bd>60*WS)near=null}
    if(UI.paused)sndSilence();else sndUpdate(f,{speed:1,near,cheer:R.finishing?1:f?crowdExc(fr(f.prog),R.t):0})}
  if(R.over&&!UI.endT){UI.endT=now}if(R.over&&UI.endT&&now-UI.endT>2500){UI.endT=0;finishRaceUI();return}
  UI.raf=requestAnimationFrame(raceLoop)}
function traceRec(){const me=R.cars.find(c=>c.isP);if(!me||!running(me)||me.pit)return;const i=Math.floor(fr(me.prog)*R.geo.N)%R.geo.N;UI.trace[i]=me.v*3.6;if(typeof traceAheadRec==="function")traceAheadRec(me);
  if(me.lap!==UI.lastLap){if(UI.lastLap>=1&&me.last&&me.last<=me.best+1e-6)UI.best=Float32Array.from(UI.trace);UI.lastLap=me.lap}}
function flagInfo(){if(R.form&&R.form.phase==="out")return["VOLTA DE APRESENTAÇÃO","#2B4FD8","#fff"];if(R.red)return["BANDEIRA VERMELHA","#E10600","#fff"];if(R.sc)return[R.sc.type==="sc"?"SAFETY CAR":"VIRTUAL SAFETY CAR","#FFD400","#111"];if(R.finishing)return["BANDEIRA QUADRICULADA","#FFF","#111"];
  const me=R.cars.find(c=>c.isP);if(me&&inYellow(me))return["BANDEIRA AMARELA","#FFD400","#111"];if(R.greenT>R.t)return["BANDEIRA VERDE","#21C55D","#06120A"];return null}
function gapTxt(c){const i=R.order.indexOf(c);if(i===0)return c.status==="fin"?"Vencedor":"Líder";const a=R.order[0];if(c.status==="dnf"||c.status==="dsq")return"OUT";if(c.pit)return"BOX";const lp=a.prog-c.prog;if(lp>=1)return"+"+Math.floor(lp)+" v";return"+"+(lp*c.L).toFixed(1)}
function setH(sel,h){const e=$(sel);if(e&&e._h!==h){e._h=h;e.innerHTML=h}}
function updatePanels(now){const me=R.cars.find(c=>c.isP);
  const fl=flagInfo(),fe=$("#flag");if(fl){fe.hidden=false;fe.textContent=fl[0];fe.style.background=fl[1];fe.style.color=fl[2]}else fe.hidden=true;
  const L=$("#lights");const lights=!R.started&&R.form&&R.form.phase==="lights";if(lights){L.hidden=false;const lit=R.lightsStart==null?0:Math.min(5,Math.max(0,Math.floor(R.t-R.lightsStart)+1));L.querySelectorAll("i").forEach((x,i)=>x.classList.toggle("on",i<lit))}else L.hidden=true;
  setT("hWx",`${R.w>.6?"🌧️ Chuva forte":R.w>.25?"🌦️ Pista úmida":R.rain?"🌦️ Garoa":"☀️ Seca"} · pista ${Math.round(R.w*100)}% molhada`);
  if(me){hudSectors(me);hudWheel(me)}
  $("#lapc").textContent=`Volta ${Math.min(R.L,Math.max(1,R.lead+1))} / ${R.L}`;
  if(!UI.ptick||now-UI.ptick>250){UI.ptick=now;if(me){hudTower(me);if(hudCfg().car)drawCarStatus(me)}
    towerFxTick();setRowsAnim("#tower",R.order.map((c,i)=>`<tr data-id="${c.id}" class="${c.isP?"me":""}"><td class="num"><span class="pn${towerPosCls(c)}">${i+1}</span></td><td>${teamLogo(c.t,"tc")}${c.code}${fastIcon(c)}</td><td class="num ${c.pit?"pit":""}">${gapTxt(c)}</td><td>${running(c)||c.status==="fin"?tyreBadge(c.tyre.c):""}</td><td class="num muted">${c.ovMode?"OT":""}</td></tr>`).join(""));
    setH("#nfeed",(R.narr||[]).slice(0,14).map(m=>`<li><span class="l">V${m.lap}</span><span class="t">${esc(m.t)}</span></li>`).join(""));
    setH("#rcfeed",R.msgs.slice(0,16).map(m=>`<li class="${m.cls}"><span class="l">V${m.lap}</span><span class="t">${esc(m.t)}${m.k?ib(m.k):""}</span></li>`).join(""));
    const rf=$("#rfeed");if(rf){const mine=R.radio.filter(m=>me&&(m.c===me.id));setH("#rfeed",mine.slice(0,16).map(m=>`<li class="${m.me?"me":"eng"}"><span class="l">V${m.lap}</span><span><span class="w">${m.me?esc(me.code):"Engenheiro"}</span><br><span class="t">${esc(m.t)}</span>${m.k?ib(m.k):""}</span></li>`).join(""));
      if(mine.length>UI.radioN){if(!mine[0].me)sndRadio();UI.radioN=mine.length}}
    if(me){["attack","normal","save"].forEach(k=>{const b=$("#m_"+k);if(b)b.classList.toggle("on",me.mode===k)});["auto","attack","defend","save"].forEach(k=>{const b=$("#e_"+k);if(b)b.classList.toggle("on",me.ers===k)});
      {const pl=me.ersPlan||"norm";for(const k in EPLAN){const b=$("#ep_"+k);if(b)b.classList.toggle("on",pl===k)}}
      {const st=me.atkStyle||"auto";for(const k in ASTYLE_S){const b=$("#as_"+k);if(b)b.classList.toggle("on",st===k)}const db=$("#defb");if(db)db.classList.toggle("on",!!me.defOrd)}
      {const gs=$("#gost");if(gs){const A=me.att&&me.att.commit&&R.cars.find(x=>x.id===me.att.id);const gb=me.gb||me.gbShow;const gt=gb?R.cars.find(x=>x.id===gb.to):null;const t=gb?(gb.mode==="line"?"devolve a posição perto da linha":`devolver a posição${gt?" para "+gt.code:""}`):me.goReq?"tenta na próxima reta":(A||me.atkOn)?`atacando ${A?A.code:""}`.trim():me.defOrd?"segurando a posição":"";if(gs.textContent!==t)gs.textContent=t}}
      {const ts=$("#towst");if(ts){const t=me.towReq?"pronto para mudar de linha":(me.tow||0)>.35?"você está no vácuo":me.dirty?"ar sujo: o carro escorrega":(me.heat||0)>.75?"freios e motor quentes":"";if(ts.textContent!==t)ts.textContent=t}}
      const pp=pitPredict(me);$("#pitp").textContent=me.pitCall?`Box chamado: ${COMP[me.pitCall].n}`:pp?`Parar agora: volta em ${pp.pos}º (−${pp.loss.toFixed(0)}s)`:""}}
  const vz=el=>!!(el&&el.offsetParent);if(vz($("#wheel")))wheelPanel(me);if(vz($("#trace"))){drawTrace(me);if(typeof drawTraceCmp==="function")drawTraceCmp(me)}if(typeof wxDraw==="function")wxDraw();askPanel();raceExtras()}
// painel do volante: estrutura criada uma vez; a cada quadro só os textos mudam (sem recriar botões nem mudar a altura)
function wheelBuild(el){el.innerHTML=`<div class="leds">${"<i></i>".repeat(15)}</div>
   <div class="wcell big"><small>Posição</small><b id="w_pos">—</b><span class="sub" id="w_where"></span></div>
   <div class="wcell big"><small>Velocidade</small><b id="w_spd">0</b><span class="sub" id="w_gear"></span></div>
   <div class="wcell"><small>Bateria ${ib("ers")}</small><b id="w_bat"></b><div class="bar"><i id="w_batb"></i></div><span class="sub"><span class="lamp" id="w_ot">OVERTAKE</span> <span class="lamp aero" id="w_aero">AERO RETA</span> <span class="lamp clip" id="w_clip">CLIP</span></span></div>
   <div class="wcell"><small>Pneus ${ib("temperatura")}</small><b id="w_ty"></b><span class="sub" id="w_tys"></span></div>
   <div class="wcell"><small>Combustível ${ib("combustivel")}</small><b id="w_fu"></b><span class="sub" id="w_fus"></span></div>
   <div class="wcell"><small>Distâncias</small><b id="w_gap"></b><span class="sub" id="w_gaps"></span></div>
   <div class="wcell"><small>Tempos</small><b id="w_lap"></b><span class="sub" id="w_laps"></span></div>
   <div class="wcell"><small>Motor e freios ${ib("mecanica")}</small><b id="w_mc"></b><span class="sub" id="w_mcs"></span></div>
   <div class="wcell"><small>Risco de erro ${ib("risco")}</small><b id="w_rk"></b><div class="bar"><i id="w_rkb"></i></div><span class="sub" id="w_rks"></span></div>
   <div class="wcell wide"><small>Piloto ${ib("estado")}</small><div class="pst">${ST_K.map(([k,n])=>`<div><span>${n}</span><i><b id="ws_${k}"></b></i></div>`).join("")}</div><span class="sub" id="w_sts"></span></div>`;el.dataset.ok="1";UI.leds=[...el.querySelectorAll(".leds i")]}
const ASTYLE_S={auto:"Livre",in:"Dentro",out:"Fora",wait:"Paciência"};
const ST_K=[["conf","Confiança"],["nerv","Nervos"],["fat","Cansaço"],["frus","Frustração"],["foco","Foco"]];
function stColor(k,v){const bad=k==="nerv"||k==="fat"||k==="frus"?v:100-v;return bad>66?"#FF4D4F":bad>40?"#F5A524":"#21C55D"}
function setT(id,t){const e=document.getElementById(id);if(e&&e.textContent!==t)e.textContent=t;return e}
function wheelPanel(me){const el=$("#wheel");if(!el||!me)return;if(!el.dataset.ok)wheelBuild(el);const g=gearRpm(Math.max(1,me.v));const rpm=running(me)&&R.started?(me.pit?5000:g.rpm):0;const n=Math.round(clamp((rpm-7000)/4800,0,1)*15);
  UI.leds.forEach((x,k)=>{const c=k<n?(k<5?"g":k<10?"r":"b"):"";if(x.className!==c)x.className=c});
  const i=R.order.indexOf(me),A=R.order[i-1],B=R.order[i+1];const ga=A&&running(A)?((A.prog-me.prog)*me.L):null,gb=B&&running(B)?((me.prog-B.prog)*me.L):null;
  const zone=R.geo.zoneMask[Math.floor(fr(me.prog)*R.geo.N)%R.geo.N]&&me.v>45;const T=TYRES[me.tyre.c];const fuelM=me.fuel-me.fuel0/R.L*(R.L-me.lap);
  const corner=cornerAt(R.geo,Math.floor(fr(me.prog)*R.geo.N));
  setT("w_pos","P"+(i+1));setT("w_where",me.status==="fin"?"Chegou":me.pit?"No box":corner?`${corner.n} · ${ctypeName(corner)}`:"Reta");
  setT("w_spd",String(running(me)?Math.round(me.v*3.6):0));setT("w_gear",`km/h · marcha ${running(me)?g.gear:"N"} · ${Math.round(rpm)} rpm`);
  setT("w_bat",Math.round(me.batt)+"%");const bb=$("#w_batb");if(bb){bb.style.width=me.batt+"%";bb.style.background=me.batt<15?"#FF4D4F":"#B65CFF"}
  $("#w_ot").classList.toggle("on",!!me.ovMode);$("#w_aero").classList.toggle("on",!!zone);$("#w_clip").classList.toggle("on",!!me.clip);
  const ty=setT("w_ty",`${T.n.slice(0,5)} ${Math.round((1-me.tyre.wear)*100)}%`);ty.style.color=T.c;setT("w_tys",`${Math.round(me.tyre.temp)}°C (ideal ${T.opt}) · ${me.tyre.age} v`);
  setT("w_fu",me.fuel.toFixed(1)+" kg");const fs=setT("w_fus",`margem ${fuelM>=0?"+":""}${fuelM.toFixed(1)} kg`);fs.style.color=fuelM<.5?"#FF9C9E":"";
  setT("w_gap",ga!=null?"−"+ga.toFixed(2):"—");setT("w_gaps",`frente${A?" "+A.code:""} · atrás ${gb!=null?"+"+gb.toFixed(2):"—"}${B?" "+B.code:""}`);
  setT("w_lap",fmtT(me.last));setT("w_laps",`melhor ${fmtT(me.best)} · ${me.pen?`pun. ${me.pen}s`:`adv. ${me.warn}/3`}`);
  {const m=me.mc;if(m){const e=setT("w_mc",`${Math.round(m.tEng)}°C`);if(e)e.style.color=m.tEng>127?"#FF4D4F":m.tEng>122?"#F5A524":"";setT("w_mcs",`freios ${Math.round(m.tBrk)}°C · saúde: motor ${Math.round(m.hEng*100)}%, câmbio ${Math.round(m.hGbx*100)}%`)}}
  {const ri=me.rk||riskInfo(me);const[lb,col]=riskLabel(ri.v);const e=setT("w_rk",ri.v?lb:"—");if(e)e.style.color=col;const rb=$("#w_rkb");if(rb){const w=Math.round(clamp(Math.log(Math.max(ri.v,.3))/Math.log(6)*100+30,4,100))+"%";if(rb.style.width!==w){rb.style.width=w;rb.style.background=col}}setT("w_rks",ri.f&&ri.f.length?ri.f.join(" · "):"tudo sob controle")}
  if(me.st){for(const[k]of ST_K){const e=document.getElementById("ws_"+k);if(!e)continue;const v=Math.round(me.st[k]||0),w=v+"%";if(e.style.width!==w){e.style.width=w;e.style.background=stColor(k,v)}}
    const ex=dExp(me.d),fm=famOf(me.d,R.C.id,raceExtraLaps(me));const A=me.ahead,B=me.behind;const fr0=[A,B].find(x=>x&&feud(me.d.id,x.d.id)>=25);
    setT("w_sts",`pista ${Math.round(fm*100)}% conhecida · ${ex.starts+1}ª largada${fr0?` · rival: ${fr0.code}`:""}`)}}
function drawTrace(me){const cv=$("#trace");if(!cv||!me)return;const ctx=cv.getContext("2d"),w=cv.width,h=cv.height,N=R.geo.N;ctx.fillStyle="#0A0C10";ctx.fillRect(0,0,w,h);
  const Y=v=>h-14-(v/360)*(h-30);ctx.strokeStyle="#1B1F27";ctx.lineWidth=1;ctx.font="500 18px 'Roboto Mono',monospace";ctx.fillStyle="#5B6470";[100,200,300].forEach(v=>{ctx.beginPath();ctx.moveTo(0,Y(v));ctx.lineTo(w,Y(v));ctx.stroke();ctx.fillText(v,6,Y(v)-4)});
  const z=R.geo.zoneMask;ctx.fillStyle="rgba(33,197,93,.08)";for(let i=0;i<N;i+=2)if(z[i])ctx.fillRect(i/N*w,0,2*w/N+1,h);
  const line=(arr,col,upto)=>{ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();let st=false;for(let i=0;i<(upto??N);i+=2){const v=arr[i];if(!v){st=false;continue}const x=i/N*w;st?ctx.lineTo(x,Y(v)):ctx.moveTo(x,Y(v));st=true}ctx.stroke()};
  if(UI.best)line(UI.best,"#5B6470");const cur=Math.floor(fr(me.prog)*N);line(UI.trace,"#FFD400",cur);
  ctx.fillStyle="#FFF";ctx.fillRect(cur/N*w-1,0,2,h);ctx.fillStyle="#8C96A3";ctx.fillText("VELOCIDADE (km/h) · amarelo: volta atual · cinza: sua melhor volta · verde: aero ativa",120,22)}
function askPanel(){const el=$("#ask");const tt=$("#toast");
  if(tt){const show=R.toast&&!R.ask;tt.hidden=!show;if(show){const t="📻 "+R.toast.text;if(tt.textContent!==t){tt.textContent=t;sndRadio()}}}
  if(R.redChoose)return;
  if(R.ask){const a=R.ask;if(el.dataset.q!==a.q){el.dataset.q=a.q;el.hidden=false;sndRadio();const d=a.opts.find(o=>o[0]===a.def);
      el.innerHTML=`<span class="who">📻 RÁDIO DA EQUIPE${a.kind==="order"?" · ORDEM DE EQUIPE":""}</span><p style="font-size:15.5px">${esc(a.q)}${a.kind==="order"?ib("ordem"):a.kind==="rain"||a.kind==="dry"?ib("chuva"):a.kind==="sc"?ib("sc"):""}</p><div class="row">${a.opts.map(([k,t])=>`<button class="btn sm${k===a.def?" def":""}" data-act="askAns" data-k="${k}">${esc(t)}</button>`).join("")}</div>
        <div class="askbar"><i id="askbar"></i></div><span class="muted" style="font-size:12px" id="askleft"></span>`;el._def=d?d[1]:""}
    const f=clamp((a.until-R.t)/a.dur,0,1);const b=$("#askbar");if(b)b.style.width=(f*100).toFixed(1)+"%";setT("askleft",`Sem resposta em ${Math.ceil(Math.max(0,a.until-R.t))}s: ${el._def}`)}
  else if(!el.hidden){el.hidden=true;el.dataset.q=""}}
function showRedChoice(){const el=$("#ask");el.dataset.red="1";el.hidden=false;const me=R.cars.find(c=>c.isP);
  el.innerHTML=`<span class="who">BANDEIRA VERMELHA ${ib("vermelha")}</span><p>Todos parados no pit lane. Qual pneu para a relargada?</p><div class="tyrepick">${["S","M","H","I","W"].map(c=>`<button data-act="redTyre" data-k="${c}">${tyreBadge(c)}${COMP[c].n}</button>`).join("")}</div>`}
function raceExtras(){const me=R.cars.find(c=>c.isP);
  const sf=$("#skipForm");if(sf)sf.hidden=!(R.form&&R.form.phase==="out")||!!R.mpGuest;if(R.mp)mpNetTick();
  const ln=$("#launch");if(ln&&me){const show=!R.autoStart&&!R.spect&&R.form&&R.form.phase==="lights"&&!me.tapped&&(!R.started||me.hold)&&running(me);ln.hidden=!show;
    if(show){const out=R.started;ln.classList.toggle("go",out);setT("launchTxt",out?"APAGARAM! Toque agora!":R.lightsStart!=null&&R.t>=R.lightsStart?"Espere as luzes apagarem… tocar antes queima a largada":"Alinhando no grid…")}}const b=$("#simrest");if(b){const out=me&&!running(me)&&!R.over&&!R.mp;b.hidden=!out;if(out)b.textContent=me.status==="fin"?"Ver o resultado final":"Simular o resto da corrida"}
  const p=$("#pausedov");if(p)p.hidden=!UI.paused}
function hostCmdSafe(f){return typeof hostCmd==="function"?hostCmd(f):f()}
function finishRaceUI(){if(UI.sound&&typeof sndMusic==="function")setTimeout(()=>sndMusic(true),1200);if(R&&R.mp){mpFinish();return}sndSilence();if(R.incidents&&R.incidents.length&&!W.stewDone){W.step="stewards";W.hadInc=true;UI.incIdx=0;render();return}finalizeRace()}
function finalizeRace(){cancelAnimationFrame(REP.raf);const res=R.result;afterRace(res);G.round--;mediaAfterRace(res);if(W.stewArts)W.stewArts.forEach(a=>G.articles.unshift(a));G.round++;W.step="results";save();render()}
// ---------- sala dos comissários: replay do incidente, dados e a sua defesa
const REP={play:true,speed:1,t:0,t0:0,t1:0,raf:0};
function incEvidence(inc){const ev=inc.ev,o=R.cars.find(x=>x.id===inc.other);
  const oMoved=ev.vyO*Math.sign(-ev.dy||1)>.6,meMoved=ev.vyMe*Math.sign(ev.dy||1)>.6,along=Math.abs(ev.ds)<CARL*.85;
  let g=inc.meCulprit?.62:.22;if(meMoved)g+=.12;if(oMoved)g-=.15;if(ev.rear)g+=inc.meCulprit?.12:-.12;if(along&&ev.inside&&oMoved)g-=.1;if(ev.meCover)g+=.08;if(ev.oCover)g-=.08;
  return{o,oMoved,meMoved,along,g:clamp(g,0,1)}}
function incFacts(inc,E){const ev=inc.ev,o=E.o,f=[];const n1=x=>Math.abs(x).toFixed(1).replace(".",",");
  if(E.meMoved)f.push(`Você estava se movendo de lado na direção de ${o.code} (${n1(ev.vyMe)} m/s).`);
  if(E.oMoved)f.push(`${o.code} veio de lado na sua direção (${n1(ev.vyO)} m/s).`);
  if(!E.meMoved&&!E.oMoved)f.push("Nenhum dos dois mudou de trajetória de forma brusca no momento do toque.");
  if(ev.rear)f.push(inc.meCulprit?`O bico do seu carro acertou a traseira de ${o.code}.`:`${o.code} acertou a sua traseira.`);
  if(E.along)f.push(`Os carros estavam emparelhados (${Math.round(clamp(1-Math.abs(ev.ds)/CARL,0,1)*100)}% de sobreposição), com você ${ev.inside?"por dentro":"por fora"} da curva.`);
  else f.push(ev.ds>0?`${o.code} estava à sua frente (${n1(ev.ds)} m).`:`Você estava à frente (${n1(ev.ds)} m).`);
  if(ev.meAtt)f.push("Você estava tentando a ultrapassagem.");if(ev.oAtt)f.push(`${o.code} estava tentando a ultrapassagem.`);
  if(ev.oCover)f.push(`${o.code} tinha acabado de fechar a porta.`);if(ev.meCover)f.push("Você tinha acabado de fechar a porta.");return f}
function licBar(n){return`<div class="lic" aria-label="${n} de 12 pontos">${Array.from({length:12},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("")}</div>`}
function stewardsStep(){const incs=R.incidents;const i=UI.incIdx||0;if(i>=incs.length){W.stewDone=true;finalizeRace();return}const inc=incs[i];
  if(!inc.frames||inc.frames.length<4){inc.frames=R.rb.filter(x=>x.t>=inc.t-6&&x.t<=inc.t+4);inc.fx=R.fxq.slice()}
  const E=incEvidence(inc),o=E.o,me=R.cars.find(x=>x.id===inc.me);const ph=["na reta","na freada","no meio da curva"][inc.ev.phase]||"na pista";
  // vítima com provas claras: ninguém chama você, só informa a decisão
  if(!inc.meCulprit&&E.g<.34&&!inc.verdict)stewardsDecide("victim");
  const dec=inc.verdict,victim=dec&&dec.victim;
  $("#wk").innerHTML=`<div class="grid2"><div class="card"><h3>Sala dos comissários · incidente ${i+1} de ${incs.length} ${ib("punicao")}</h3>
    ${inc.frames.length>3?`<canvas id="repc" class="replay" aria-label="Replay do incidente"></canvas><div class="row"><button class="btn sm" data-act="repPlay">⏯ Play/pausa</button><button class="btn sm" data-act="repSlow">${REP.speed===1?"Câmera lenta":"Velocidade normal"}</button><button class="btn sm" data-act="repRestart">↺ Ver de novo</button></div>`:`<p class="muted">Sem imagens deste incidente.</p>`}
    <p><b>Volta ${inc.lap}:</b> ${inc.kind==="colisão"?"colisão":"toque"} entre você (${me.code}) e ${o.code} ${ph}.</p>
    <h3>O que os dados mostram</h3><ul class="facts">${incFacts(inc,E).map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>
   <div class="card"><h3>${victim?"Decisão dos comissários":"Sua defesa"}</h3>${dec?`<div class="verdict ${dec.cls}"><b>${esc(dec.title)}</b><p>${esc(dec.text)}</p></div>${licBar(licPoints())}<p class="muted" style="font-size:13px">Superlicença: ${licPoints()} de 12 pontos nos últimos 12 meses · advertências na temporada: ${G.reprimands||0} de 3.</p><button class="btn go" data-act="stewNext">${i+1<incs.length?"Próximo incidente":"Ver o resultado"}</button>`:
    `<p>Os comissários assistiram às imagens e querem ouvir você antes de decidir. Escolha o seu argumento:</p><div class="ansl">${[["sorry","Assumo a culpa. Errei e peço desculpas."],["moved",`${o.code} mudou de trajetória e fechou a porta em cima de mim.`],["space","Eu estava emparelhado e tinha direito ao espaço na curva."],["racing","Foi um incidente de corrida: os dois arriscaram."]].map(([k,t])=>`<button class="ans" data-act="defend" data-k="${k}"><span>"${esc(t)}"</span></button>`).join("")}</div>
    ${licBar(licPoints())}<p class="muted" style="font-size:13px">Pontos na superlicença nos últimos 12 meses: <b>${licPoints()}</b> de 12. Com 12, você fica fora de uma corrida. Advertências na temporada: ${G.reprimands||0} de 3.</p>`}</div></div>`;
  if(inc.frames.length>3)startReplay(inc)}
function startReplay(inc){cancelAnimationFrame(REP.raf);REP.inc=inc;REP.t0=inc.frames[0].t;REP.t1=inc.frames[inc.frames.length-1].t;REP.t=Math.max(REP.t0,inc.t-4);REP.play=true;REP.last=performance.now();
  const loop=n=>{const cv=$("#repc");if(!cv||REP.inc!==inc)return;const dt=Math.min(.1,(n-REP.last)/1000);REP.last=n;
    if(REP.play){REP.t+=dt*REP.speed*(Math.abs(REP.t-inc.t)<1.2&&REP.speed===1?.5:1);if(REP.t>REP.t1)REP.t=REP.t0}drawReplay(cv,inc,REP.t);REP.raf=requestAnimationFrame(loop)};REP.raf=requestAnimationFrame(loop)}
function frameAt(inc,t){const F=inc.frames;let i=0;while(i<F.length-2&&F[i+1].t<t)i++;const a=F[i],b=F[i+1]||a;const k=b.t>a.t?clamp((t-a.t)/(b.t-a.t),0,1):0;const bm=new Map(b.cars.map(c=>[c.id,c]));
  return{t,cars:a.cars.map(c=>{const d=bm.get(c.id)||c;return{id:c.id,x:c.x+(d.x-c.x)*k,y:c.y+(d.y-c.y)*k,h:lerpAng(c.h,d.h,k),vis:1}}),sc:a.sc}}
function drawReplay(cv,inc,t){const dpr=(typeof qDpr==="function"?qDpr():Math.min(2,window.devicePixelRatio||1)),cw=cv.clientWidth||600,ch=Math.round(Math.min(cw*.62,420));if(cv.width!==Math.round(cw*dpr)||cv.height!==Math.round(ch*dpr)){cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);cv.style.height=ch+"px"}
  const ctx=cv.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);const S=frameAt(inc,t);const a=S.cars.find(c=>c.id===inc.me),b=S.cars.find(c=>c.id===inc.other);const m=a&&b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:(a||b||{x:0,y:0});
  const sv={x:CAM.x,y:CAM.y,z:CAM.z,sx:CAM.sx,sy:CAM.sy};const[ix,iy]=iso(m.x,m.y);let z=Math.min(cw,ch*1.3)/(WS*46);if(a&&b){const[ax,ay]=iso(a.x,a.y),[bx,by]=iso(b.x,b.y);const d=Math.hypot(ax-bx,ay-by);z=Math.min(z,Math.min(cw,ch)*.55/Math.max(1,d))}
  CAM.x=ix;CAM.y=iy;CAM.z=Math.max(z,.25);CAM.sx=0;CAM.sy=0;const fx=R.fxq;R.fxq=inc.fx||[];
  try{drawScene(ctx,cw,ch,{S,T:t});[[a,"#FFFFFF"],[b,"#FFD400"]].forEach(([c,col])=>{if(!c)return;const s=toScreen(c.x,c.y,0,cw,ch);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(s[0],s[1],5.2*WS*CAM.z,2.8*WS*CAM.z,0,0,7);ctx.stroke();ctx.setLineDash([])})}
  finally{R.fxq=fx;Object.assign(CAM,sv)}
  const near=Math.abs(t-inc.t)<.6;ctx.fillStyle="#0E1116D9";ctx.fillRect(8,8,176,24);ctx.fillStyle=near?"#FF4D4F":"#fff";ctx.font="700 12px 'Roboto Mono',monospace";ctx.textAlign="left";ctx.fillText(`REPLAY ${REP.speed<1?"0,4×":"1×"}  ${(t-inc.t>=0?"+":"")+(t-inc.t).toFixed(1).replace(".",",")}s${near?"  TOQUE":""}`,16,24)}
function licPoints(){const n=G.calendar.length;return(G.lic||[]).filter(x=>(G.season-x.s)*n+(G.round-x.r)<n).reduce((a,x)=>a+x.pts,0)}
function stewardsDecide(arg){const inc=R.incidents[UI.incIdx||0];if(!inc||inc.verdict)return;const ev=inc.ev;const E=incEvidence(inc),o=E.o;const me=ME();const sur=me.n.split(" ").pop();
  let title,text,cls;
  if(arg==="victim"){const h=clamp(1-E.g+rr(-.08,.08),0,1);let pen=h>.82&&inc.kind==="colisão"?10:h>.6?5:0;
    if(pen){applyPostPenalty(o.d.id,pen);title=`${o.code} punido com ${pen} segundos`;cls="good";text=`Os comissários analisaram as imagens e concluíram que ${o.code} causou o incidente. Você não foi chamado para depor.`}
    else{title="Incidente de corrida";cls="good";text=`Os comissários olharam o toque com ${o.code} e não viram culpa clara de ninguém. Sem punição para os dois.`}
    inc.verdict={title,text,cls,lvl:0,victim:true};inc.decided=true;if(pen)news(`Comissários: ${o.code} recebe ${pen}s pelo toque em você.`,"good");return}
  let g=E.g;
  if(arg==="moved")g+=E.oMoved||ev.oCover?-.3:.12;if(arg==="space")g+=E.along&&ev.inside?-.28:E.along?-.08:.1;if(arg==="racing")g=g*.75+.12;if(arg==="sorry")g=Math.max(g,.55);
  g+=((G.stewRep??50)-50)/600+rr(-.07,.07);g=clamp(g,0,1);
  let lvl=g<.34?0:g<.5?1:g<.76?2:3;if(arg==="sorry"&&lvl>1)lvl--;
  const pts=[0,0,1,2][lvl]+(inc.kind==="colisão"&&lvl===3?1:0),sec=[0,0,5,10][lvl];
  if(lvl===0){title="Sem punição";cls="good";text="Os comissários consideraram um incidente de corrida.";if(g<.16){applyPostPenalty(o.d.id,5);text=`Os comissários entenderam que ${o.code} causou o incidente: ele recebeu 5 segundos.`}}
  else if(lvl===1){title="Advertência";cls="warn";G.reprimands=(G.reprimands||0)+1;text=`Você recebeu uma advertência (${G.reprimands} nesta temporada). Com 3 advertências, você perde 10 posições no grid de uma corrida.`;if(G.reprimands>=3){G.gridPen=(G.gridPen||0)+10;G.reprimands=0;text+=" Era a terceira: 10 posições de punição no grid da próxima corrida."}}
  else{const e=R.result.cls.find(x=>x.d===G.me);title=`${sec} segundos de punição`;cls="bad";
    if(e&&e.status==="ok"){applyPostPenalty(G.me,sec);const e2=R.result.cls.find(x=>x.d===G.me);text=`${sec} segundos somados ao seu tempo de corrida: você cai para ${e2.pos}º. Mais ${pts} ponto${pts>1?"s":""} na superlicença.`}
    else{const gp=sec===5?3:5;G.gridPen=(G.gridPen||0)+gp;title=`Punição de ${gp} posições no grid`;text=`Como você não terminou a corrida, os ${sec} segundos viram ${gp} posições de punição no grid da próxima etapa. Mais ${pts} ponto${pts>1?"s":""} na superlicença.`}}
  if(pts){G.lic=G.lic||[];G.lic.push({pts,s:G.season,r:G.round});const tot=licPoints();text+=` Total: ${tot} de 12.`;if(tot>=12){G.ban=true;G.lic=[];text+=" Você atingiu 12 pontos: está suspenso da próxima corrida."}}
  if(arg==="sorry"){G.stewRep=clamp((G.stewRep??50)+4,0,100);fameAdd(0,1.5)}
  else if((arg==="moved"&&!(E.oMoved||ev.oCover))||(arg==="space"&&!E.along)){G.stewRep=clamp((G.stewRep??50)-5,0,100);fameAdd(0,-1);text+=" Os comissários não aceitaram o seu argumento: as imagens mostram outra coisa."}
  else if(lvl===0)G.stewRep=clamp((G.stewRep??50)+1,0,100);
  inc.verdict={title,text,cls,lvl};inc.decided=true;
  // repercussão na imprensa e nas redes
  const j=pick(JOURNOS),ou=OUTLETS.find(x=>x.id===j.o);W.stewArts=W.stewArts||[];
  W.stewArts.push({id:"a"+(G.articles.length+W.stewArts.length+1),s:G.season,r:G.round,outlet:ou.n,tone:ou.tone,journo:j.n,kind:"comissários",headline:lvl>=2?`${sur} é punido pelos comissários após incidente com ${o.code}`:lvl===1?`${sur} leva advertência pelo incidente com ${o.code}`:`Comissários livram ${sur} no incidente com ${o.code}`,body:text,heat:lvl>=2});
  if(lvl>=2){post("journo",`Comissários: ${me.code} punido pelo incidente com ${o.code}. ${title}.`,{journo:j,likes:ri(2000,9000)});fansReact("stewards",2);heatAdd(lvl===3?6:3)}
  render()}
// ---------- suspensão: o reserva assume o carro e você assiste dos boxes
function bannedWeekend(){const t=myTeam();let rs=Object.values(G.drivers).filter(d=>!d.team&&!d.me).sort((a,b)=>ovr(b)-ovr(a))[0];if(!rs){rs=newDriver({pace:72,age:ri(20,27)});G.drivers[rs.id]=rs}
  startWeekend();W.banned=true;G.ban=false;const i=t.drivers.indexOf(G.me);t.drivers[i]=rs.id;rs.team=t.id;
  try{doQuali("normal");if(W.sprint)runSprint();startRace({});simulateRaceQuick()}finally{t.drivers[i]=G.me;rs.team=null}
  const r=R.result;r.banned=true;r.reserve=rs.id;W.step="banned";afterRace(r);const e=r.cls.find(x=>x.d===rs.id);
  news(`Suspenso, você assistiu dos boxes. ${rs.n} substituiu você e ${e&&e.status==="ok"?`terminou em ${e.pos}º${e.pts?` (${e.pts} pts para a equipe)`:""}`:"não terminou"}.`,"warn");
  post("journo",`${rs.n} substitui ${ME().n} na ${t.n}: suspensão por pontos na superlicença.`,{journo:pick(JOURNOS),likes:ri(3000,12000)});save();render()}
function bannedStep(){const r=R.result;const rs=G.drivers[r.reserve];const e=r.cls.find(x=>x.d===r.reserve);
  $("#wk").innerHTML=`<div class="grid2"><div class="card"><h3>Você está suspenso</h3><p>Com 12 pontos na superlicença, a FIA tirou você desta corrida. ${esc(rs?rs.n:"O reserva")} pilotou o seu carro: ${e&&e.status==="ok"?`${e.pos}º lugar${e.pts?`, ${e.pts} pontos para a equipe`:""}`:"não terminou"}.</p><p class="muted">Seus pontos na superlicença foram zerados. A partir da próxima etapa você volta ao carro.</p><button class="btn go" data-act="endWeekend">Voltar ao paddock</button></div>
   <div class="card" style="grid-column:1/-1"><h3>Classificação final</h3>${resultTable(r.cls)}</div></div>`}
function resultsStep(){const res=R.result;const e=res.cls.find(x=>x.d===G.me);const top=res.cls.filter(x=>x.status==="ok").slice(0,3);
  $("#wk").innerHTML=`<div class="grid2"><div class="card"><h3>Pódio</h3><canvas id="pod" width="520" height="340" style="width:100%;height:auto;border-radius:6px"></canvas></div>
   <div class="card"><h3>Você: ${e.status==="ok"?e.pos+"º lugar":e.status==="dsq"?"desclassificado":"abandono"}${e.pts?` · +${e.pts} pts`:""}</h3><p>${e.status==="ok"?`Largou em ${res.gridMe}º, ${e.stops} parada(s), melhor volta ${fmtT(e.best)}.`:esc(e.why||"")}</p>
    <div class="kv"><span>Popularidade</span><b class="num">${Math.round(G.fame.pop)}</b></div><div class="kv"><span>Seguidores</span><b class="num">${fmtK(G.fame.followers)}</b></div><div class="kv"><span>Confiança da equipe</span><b class="num">${Math.round(G.trust)}%</b></div>
    <div class="row"><button class="btn go" data-act="toMixed">Ir para a zona mista</button><button class="btn" data-act="mnLog">Registro da corrida</button></div></div>
   ${typeof hlCard==="function"?hlCard():""}<div class="card" style="grid-column:1/-1"><h3>Classificação final</h3>${resultTable(res.cls)}</div></div>`;
  const cv=$("#pod");const t0=performance.now();const tops=top.map(x=>{const d=G.drivers[x.d],t=teamOf(x.team);return{code:d.code,col:t.c,col2:t.c2}});
  let lastP=0;const loop=n=>{if(!$("#pod"))return;const el=(n-t0)/1000;if(n-lastP>33){lastP=n;drawPodium(cv.getContext("2d"),cv.width,cv.height,el,tops)}if(el<14)requestAnimationFrame(loop)};requestAnimationFrame(loop)}
function mixedStep(){const el=$("#wk");if(!G.interview&&!UI.mixDone)makeInterview("post");
  if(UI.mixDone||!G.interview.qs.length){el.innerHTML=`<div class="grid2">${UI.mixArt?articleCard(UI.mixArt):""}<div class="card"><h3>Fim de semana encerrado</h3><p>As redes já estão comentando o seu domingo.</p><div class="row"><button class="btn go" data-act="endWeekend">Voltar ao paddock</button><button class="btn" data-act="endWeekendSocial">Ver as redes</button></div></div></div>`;return}
  el.innerHTML=`<div class="grid2"><div>${interviewHTML("Zona mista")}</div><div class="card"><h3>Repercussão nas redes</h3><div class="feedx">${G.social.feed.slice(0,5).map(tweet).join("")}</div></div></div>`}
function seasonEnd(){if(!G.endSummary){G.endSummary=endSeason();save()}
  app.innerHTML=topbar()+`<div class="card" style="margin-top:12px"><h2>Fim da temporada</h2>${G.endSummary.map(s=>`<p>${esc(s)}</p>`).join("")}<button class="btn go" data-act="newSeason">Começar ${G.year}</button></div>`}
function gameOverScreen(){app.innerHTML=`<div class="title-screen"><div class="big">FIM DE<br><span>LINHA</span></div><p>${esc(G.gameOver)}</p><button class="btn go" data-act="wipe">Nova carreira</button></div>`}

// ---------- ações
document.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act,k=b.dataset.k;if(typeof lazyGate==="function"&&lazyGate(a,b))return;
  if(a==="gloss"){e.stopPropagation();const g=GLOSS[k];modal(`<h2>${g.t}</h2><p style="font-size:15px;line-height:1.55">${g.d}</p><button class="btn" data-act="closeModal">Entendi</button>`);return}
  if(a==="closeModal"||(a==="bgClose"&&e.target===b)){modal("");return}
  if(a==="bgClose")return;
  if(a.startsWith("mp")){mpAction(a,k,b);return}if(a.startsWith("tv")&&typeof tvAction==="function"){tvAction(a,k,b);return}if(a.startsWith("px")&&typeof pxAction==="function"){pxAction(a,k);return}if(a.startsWith("mn")&&typeof mnAction==="function"){mnAction(a,k,b);return}if(a.startsWith("wk")&&typeof wkAction==="function"){wkAction(a,k);return}if(a.startsWith("lf")&&typeof lfAction==="function"){lfAction(a,k,b);return}if(a.startsWith("ow")&&typeof owAction==="function"){owAction(a,k);return}if(a.startsWith("cc")&&typeof ccAction==="function"){if(a==="ccAsSet"||a==="ccAsP")ccAction2(a,k);else ccAction(a,k);return}
  const A={
   continue(){if(load()){UI.scr="hub";if(G.phase==="weekend"){G.phase="home"}render()}},
   newCareer(){UI.scr="create";render()},toTitle(){UI.scr="title";render()},
   c1(){readCreate();UI.ng.c1=k;render()},c2(){readCreate();UI.ng.c2=k;render()},style(){readCreate();UI.ng.style=k;render()},trait(){readCreate();UI.ng.trait=k;render()},dist(){readCreate();UI.ng.dist=+k;render()},
   createGo(){readCreate();const n=UI.ng;if(n.name.length<3){$("#fname").focus();$("#fname").placeholder="Digite seu nome";return}const parts=n.name.split(" ");const code=(n.code||parts[parts.length-1].normalize("NFD").replace(/[^A-Za-z]/g,"").slice(0,3)).toUpperCase().padEnd(3,"X");
     const base={};Object.keys(ATTR).forEach(k=>base[k]=74);const st=STYLES[n.style].a;Object.keys(st).forEach(k=>base[k]+=st[k]);base.pace=75+(st.pace||0);
     newGame({name:n.name,code,nat:n.nat,num:n.num,c1:n.c1,c2:n.c2,trait:n.trait,dist:n.dist,attrs:base,pers:Object.assign({},STYLES[n.style].p)});G.engineer=pick(["Bruno","Sarah","Tom","Gianpiero","Lena"]);save();UI.scr="hub";UI.tab="home";render()},
   tab(){UI.tab=k;render()},realism(){G.settings.real=k;save();render()},
   goWeekend(){if(G.ban){bannedWeekend();return}startWeekend();W.step="press";UI.pressDone=false;UI.pressArt=null;UI.mixDone=false;UI.mixArt=null;UI.pre=null;G.interview=null;render()},
   toHub(){G.phase="home";render()},
   answer(){const mx=W.step==="mixed";if(mx)G.round--;const art=answerInterview(+k);if(mx)G.round++;if(art){if(W.step==="press"){UI.pressDone=true;UI.pressArt=art}else{UI.mixDone=true;UI.mixArt=art}}render()},
   toPractice(){W.step="practice";render()},practice(){doPractice(k);W.step="practice";render()},toQuali(){W.step="quali";render()},
   quali(){doQuali(k);W.step="quali";mediaAfterQuali();render()},toNextAfterQuali(){W.step=W.sprint?"sprint":"prerace";render()},
   runSprint(){runSprint();render()},toPre(){W.step="prerace";render()},
   prePlan(){UI.pre.plan=k;UI.pre.tyre=null;render()},preTyre(){UI.pre.tyre=k;render()},preFuel(){UI.pre.fuel=k;render()},
   startRace(){startRace(UI.pre);W.step="race";CAM.init=0;if(G.settings.sound&&!UI.sound){UI.sound=sndToggle(true)}render()},
   cam(){UI.cam=k;CAM.pan=null;CAM.userZ=1;CAM.cut=1;TV.cam=null;DIR.until=0;document.querySelectorAll("#cams button").forEach(x=>x.classList.toggle("on",x.dataset.k===k))},
   pause(){UI.paused=!UI.paused;b.textContent=UI.paused?"▶ Continuar":"⏸ Pausar"},
   simRest(){UI.paused=false;simulateRaceQuick()},
   launchTap(){tapLaunch()},skipForm(){skipFormation()},
   repPlay(){REP.play=!REP.play},repSlow(){REP.speed=REP.speed===1?.4:1;b.textContent=REP.speed===1?"Câmera lenta":"Velocidade normal"},repRestart(){REP.t=REP.t0;REP.play=true},
   defend(){stewardsDecide(k)},stewNext(){UI.incIdx++;render()},
   hudOpen(){hudSettings()},
   meeting(){UI.meet={stage:1,rep:techReport()};meetingModal()},
   meetAns(){const M=UI.meet;M.guess=k;const ok=k===M.rep.worst;M.eff=ok?1.15:.9;G.trust=clamp(G.trust+(ok?2:-1),0,100);if(ok)fameAdd(0,.6);M.opts=devOptions(M.rep,k);M.stage=2;meetingModal()},
   meetAuto(){const M=UI.meet;M.guess="auto";M.eff=1;M.opts=devOptions(M.rep,null);M.stage=2;meetingModal()},
   meetPick(){const M=UI.meet;let p=M.opts.find(x=>x.id===k);M.over=false;if(p!==M.opts[0]&&G.trust<40&&rnd()<.25+(40-G.trust)/40){p=M.opts[0];M.over=true}M.chosen=p;devStart(p,M.eff,M.over);M.stage=3;meetingModal();if(UI.scr==="hub"&&UI.tab==="home")homeTab()},
   spAcc(){spAccept(+k);render()},spDec(){spDecline(+k);render()},
   hud(){const[key,v]=k.split(":");hudCfg()[key]=v;save();applyHud();hudSettings()},
   hudT(){const H=hudCfg();H[k]=!H[k];save();applyHud();hudSettings()},
   hudCinema(){const H=hudCfg();Object.assign(H,{tower:"off",labels:"mine",sectors:false,car:false,wheel:false,map:false,bubbles:false,weather:false});save();applyHud();hudSettings()},
   hudReset(){G.settings.hud=Object.assign({},HUD_DEF);save();applyHud();hudSettings()},
   rtab(){UI.rtab=k;document.querySelectorAll(".rtabs button").forEach(x=>x.classList.toggle("on",x.dataset.k===k));document.querySelectorAll(".rpanes .pane").forEach(x=>x.classList.toggle("on",x.dataset.pane===k))},
   snd(){UI.sound=!UI.sound;const ok=sndToggle(UI.sound);if(!ok)UI.sound=false;G.settings.sound=UI.sound;b.textContent=UI.sound?"🔊 Som ligado":"🔈 Ligar som"},
   tow(){if(R&&R.mpGuest)return mpCmd({tw:1});hostCmdSafe(()=>cmdTow())},
   back(){if(R&&R.mpGuest)return mpCmd({bk:1});hostCmdSafe(()=>cmdBack())},
   perf(){if(typeof perfToggle==="function")perfToggle()},
   tip(){tipApply(k)},tipNo(){tipDismiss()},
   autoDec(){G.settings.autoDec=G.settings.autoDec===false;save();b.classList.toggle("on",G.settings.autoDec!==false)},tipsT(){G.settings.tips=G.settings.tips===false;save();b.classList.toggle("on",G.settings.tips!==false);if(G.settings.tips===false&&typeof tipDismiss==="function")tipDismiss()},
   go(){if(R&&R.mpGuest)return mpCmd({go:1});hostCmdSafe(()=>cmdGo())},
   astyle(){if(R&&R.mpGuest)return mpCmd({as:k});hostCmdSafe(()=>cmdStyle(k))},eplan(){if(R&&R.mpGuest)return mpCmd({pl:k});hostCmdSafe(()=>cmdPlan(k))},def(){if(R&&R.mpGuest)return mpCmd({df:1});hostCmdSafe(()=>cmdDef())},
   mode(){if(R&&R.mpGuest)return mpCmd({m:k});hostCmdSafe(()=>cmdMode(k))},ers(){if(R&&R.mpGuest)return mpCmd({e:k});hostCmdSafe(()=>cmdErs(k))},box(){if(R&&R.mpGuest)return mpCmd({b:k||null});hostCmdSafe(()=>cmdBox(k||null))},
   askAns(){if(R&&R.mpGuest)mpAnswer(k);else answerAsk(k);const el=$("#ask");el.hidden=true;el.dataset.q=""},
   redTyre(){const me=R.cars.find(c=>c.isP);resumeRed({[me.id]:k});const el=$("#ask");el.hidden=true;el.dataset.red="";el.dataset.q=""},
   toMixed(){W.step="mixed";render()},
   endWeekend(){G.phase="home";W=null;UI.tab="home";save();render()},endWeekendSocial(){G.phase="home";W=null;UI.tab="social";save();render()},
   doPost(){doPost(k);render()},train(){G.train=k;save();render()},accept(){acceptOffer(G.offers[+k]);render()},
   sndPref(){G.settings.sound=b.checked;save()},
   wipe(){if(b.dataset.sure){wipeSave();G=null;UI.scr="title";render()}else{b.dataset.sure="1";b.textContent="Toque de novo para confirmar"}},
   newSeason(){G.endSummary=null;save();render()}};
  if(A[a]){if(a==="camAll"){UI.cam=UI.cam==="all"?"chase":"all";CAM.pan=null;CAM.userZ=1;CAM.cut=1;document.querySelectorAll("#cams button").forEach(x=>x.classList.toggle("on",x.dataset.k===UI.cam));return}A[a]()}});
document.addEventListener("keydown",e=>{if(e.code==="Space"&&typeof R!=="undefined"&&R&&W&&W.step==="race"&&R.form&&R.form.phase==="lights"&&!R.autoStart){e.preventDefault();tapLaunch()}});
window.addEventListener("resize",()=>{if(UI.scr==="hub"&&G&&G.phase!=="weekend"&&UI.tab==="home")drawPreview($("#prev"),G.calendar[G.round])});
// início
// (espera todos os arquivos carregarem: o menu novo e os módulos extras vêm depois deste arquivo)
(function(){const boot=()=>{UI.scr="title";render()};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else setTimeout(boot,0)})();
// geometria isométrica: montar TRACKGEO ao começar o fim de semana
const _sw=startWeekend;startWeekend=function(){const w=_sw();buildTrack(w.geo);return w};
