// ===================== LIGA PADDOCK DENTRO DO JOGO =====================
// Quando o jogo é aberto pelo site da liga (endereço com ?liga=1), ele entra direto na sala de corrida do servidor.
// A corrida oficial roda no servidor (servidor/corrida-sim.js) com este mesmo código; aqui o jogo só assiste e manda
// os comandos do seu carro. O mundo da liga tem só as equipes inscritas, só pessoas reais e carros iguais.
const LIGA = { on: typeof location !== "undefined" && /[?&]liga=1\b/.test(location.search), eu: null, inst: false, code: "liga" };

// ---------- mundo da liga (o servidor e todos os navegadores montam igual, a partir da mesma configuração)
function ligaEquipesLimpa(a) {
  if (!Array.isArray(a)) return null; const out = [];
  for (const e of a.slice(0, 11)) { if (!Array.isArray(e) || !/^lg\d{1,6}$/.test(e[0])) continue; const cor = (x, d) => (typeof mpHex === "function" && mpHex(x)) || d;
    out.push([e[0], String(e[1] || "Equipe").replace(/[\u0000-\u001f<>]/g, "").slice(0, 28), String(e[2] || "").replace(/[^A-Z]/g, "").slice(0, 3), cor(e[3], "#E10600"), cor(e[4], "#15151E"), /^\/logos\/[\w.-]{1,80}$/.test(e[5] || "") ? e[5] : ""]) }
  return out.length ? out : null;
}
function ligaBuildWorld(cfg, L, localPeer) {
  if (!MP.saved) MP.saved = { G, W, R }; const CG = MP.saved.G;
  const hud = CG && CG.settings && CG.settings.hud ? JSON.parse(JSON.stringify(CG.settings.hud)) : undefined; const snd = CG ? CG.settings.sound !== false : true;
  RNG = mulberry(cfg.sd || 1); DID = 0;
  G = { v: 1, mp: true, liga: true, garage: GARAGE0.slice(), year: 2026, season: 1, round: 0, calendar: [cfg.tr], settings: { dist: cfg.lp, sound: snd, hud }, drivers: {}, teams: [], results: [], news: [], articles: [], phase: "weekend", social: { feed: [], trends: [] },
    fame: { pop: 30, rep: 30, followers: 20000 }, money: 0, trust: 60, rel: {}, h2h: { q: [0, 0], r: [0, 0] }, xp: 0, train: "auto", ach: {}, history: [], offers: [], pending: [], mood: "neutro", gameOver: null, engineer: "Engenheiro", rival: null, helmet: { c1: "#FFD400", c2: "#1B998B" } };
  const base = TEAMS0[0];
  for (const [id, n, sg, c1, c2, logo] of cfg.lg) { G.teams.push({ ...base, id, n, sig: sg, c: c1, c2, tier: 88, rep: 50, boss: "Dono da equipe", style: "frio", liga: true, logo: logo || "", car: {}, drivers: [] }); ligaLogo(id, logo) }
  for (const s of L) { const t = G.teams.find((x) => x.id === s.tm); if (!t || t.drivers.length >= 2) continue; const d = mpHumanDriver(s, t.id, localPeer); G.drivers[d.id] = d; t.drivers.push(d.id); if (d.me) G.me = d.id }
  G.teams = G.teams.filter((t) => t.drivers.length);// equipe sem piloto presente não larga (nenhum carro da IA)
  mpDedupeCodes(); G.mpRules = { equalCars: true, shop: false }; mpEqualCars(); mpWorldTrack(cfg, L);
}

// logos das equipes (enviados no site e aprovados pelo staff), carregados uma vez por navegador
LIGA.logos = {};
function ligaLogo(id, url) { if (!url || typeof Image === "undefined" || typeof document === "undefined" || LIGA.logos[id]) return; const im = new Image(); im.src = url; LIGA.logos[id] = { url, im } }
// ---------- sala de corrida pelo servidor da liga (WebSocket), com o mesmo jeito da sala online que o jogo já usa
function ligaRoom() {
  const st = { ws: null, me: null, peers: new Map(), mine: {}, hs: new Set(), ch: new Set(), conn: false, snap: [], tm: 0, wait: 500, alive: true };
  const peerObj = (peer, presence, me) => Object.freeze({ peer, isMe: !!me, sameTab: !!me, kind: "viewer", guest: false, presence });
  const build = () => { st.snap = Object.freeze([peerObj(st.me || "eu", Object.freeze({ ...st.mine }), true), ...[...st.peers].map(([p, q]) => peerObj(p, q))]) };
  const notify = () => { build(); if (st.tm) return; st.tm = setTimeout(() => { st.tm = 0; st.hs.forEach((h) => { try { h({ peers: st.snap }) } catch (e) { console.error(e) } }) }, 20) };
  const conn = (v) => { if (st.conn === v) return; st.conn = v; st.ch.forEach((h) => { try { h(v) } catch (e) {} }) };
  const send = (o) => { if (st.ws && st.ws.readyState === 1) st.ws.send(JSON.stringify(o)) };
  const merge = (old, patch) => { const o = { ...(old || {}) }; for (const k in patch) { if (patch[k] === null || patch[k] === undefined) delete o[k]; else o[k] = patch[k] } return Object.freeze(o) };
  function abre() {
    if (!st.alive) return; const ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws" + (TVM.on ? "?tv=1" : "")); st.ws = ws;
    ws.onopen = () => { st.wait = 500; send({ t: "p", full: 1, d: st.mine }) };
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data) } catch (e) { return }
      if (m.t === "all") { st.me = m.me; st.peers.clear(); for (const p of m.peers || []) if (p.peer !== st.me) st.peers.set(p.peer, Object.freeze(p.presence || {})); conn(true); notify() }
      else if (m.t === "pp") { if (m.peer === st.me) return; st.peers.set(m.peer, merge(st.peers.get(m.peer), m.patch || {})); notify() }
      else if (m.t === "bye") { if (st.peers.delete(m.peer)) notify() }
      else if (m.t === "erro") { LIGA.erro = String(m.msg || ""); if (typeof mpRefresh === "function") { MP.err = LIGA.erro; mpRefresh() } } };
    ws.onclose = () => { conn(false); st.ws = null; if (st.alive) { setTimeout(abre, st.wait); st.wait = Math.min(8000, st.wait * 2) } };
  }
  abre(); build();
  const api = { name: "liga",
    presence(patch) { st.mine = merge(st.mine, patch); if (JSON.stringify(st.mine).length > 5800) return Promise.reject({ code: "invalid_argument" }); send({ t: "p", d: patch }); notify(); return Promise.resolve() },
    peers() { return st.snap }, onPeers(h) { st.hs.add(h); setTimeout(() => h({ peers: st.snap }), 0); return () => st.hs.delete(h) },
    connected() { return st.conn }, onConnection(h) { st.ch.add(h); setTimeout(() => h(st.conn), 0); return () => st.ch.delete(h) },
    emit() { return Promise.resolve() }, on() { return () => {} }, join() { return Promise.resolve(api) },
    leave() { st.alive = false; try { st.ws && st.ws.close() } catch (e) {} return Promise.resolve() } };
  return api;
}

// ---------- ajustes no modo online (só valem quando a configuração traz as equipes da liga)
function ligaInstall() {
  if (LIGA.inst || typeof mpBuildWorld !== "function") return; LIGA.inst = true;
  const cc = mpCleanCfg; globalThis.mpCleanCfg = function (c) { const o = cc(c); const lg = c && ligaEquipesLimpa(c.lg); if (lg) { o.lg = lg; o.lp = clamp(+c.lp || .15, .05, 1.5) } return o };
  const so = mpSeatObj; globalThis.mpSeatObj = function (a) { const o = so(a); if (o && Array.isArray(a) && /^lg\d{1,6}$/.test(a[6])) o.tm = a[6]; return o };
  const bw = mpBuildWorld; globalThis.mpBuildWorld = function (cfg, L, lp) { return cfg && cfg.lg ? ligaBuildWorld(cfg, L, lp) : bw(cfg, L, lp) };
  if (typeof mpTeam === "function") { const mt = mpTeam; globalThis.mpTeam = function (id) { const t = typeof G !== "undefined" && G && G.liga && G.teams.find((x) => x.id === id); return t || mt(id) } }
  // comandos de disputa do piloto valem por cima da decisão automática do carro (só no servidor da liga, quando o piloto escolheu)
  if (typeof driverBrain === "function") { const db0 = driverBrain; globalThis.driverBrain = function (c) { const r = db0.apply(this, arguments); const o = c && c.lp;
    if (o && running(c) && !c.pit) { if (o.at !== "auto") c.atkStyle = o.at; if (o.df) c.defOrd = true; if (o.e !== "auto" && c.ers !== o.e) { c.ers = o.e; if (typeof ersK === "function") ersK(c) } } return r } }
  if (!LIGA.on) return;
  // a sala é a do servidor da liga
  globalThis.netConfig = () => ({ liga: 1 }); globalThis.netRoom = async () => ligaRoom();
  const ru = mpUid; globalThis.mpUid = function () { return TVM.on ? "tv" : LIGA.eu ? "u" + LIGA.eu.id : ru() };
  if (TVM.on) tvInstall(); else pilInstall();
  // classificação ao vivo: o estado vem do servidor junto com a posição dos carros
  for (const f of ["tvComment", "tv3RaceComment", "tv3ChampTick", "tv3BattleTick"]) if (typeof globalThis[f] === "function") { const b = globalThis[f]; globalThis[f] = function (...a) { if (LIGA.q) return; return b.apply(this, a) } }/* comentário de corrida não entra na classificação */
  // na TV, as punições da direção de prova aparecem como faixa dos comissários
  if (TVM.on) { const alt = mpApplyLog; globalThis.mpApplyLog = function (lg) { const ini = MP.lastSeq; const r = alt(lg); try { if (Array.isArray(lg) && typeof tv3Stew === "function") for (const e of lg) if (Array.isArray(e) && e[0] > ini && e[1] === "rc" && e[4] === "punicao") tv3Stew("DECISÃO DOS COMISSÁRIOS", [String(e[2]).slice(0, 120)], 2, 7) } catch (x) {} return r } }
  const al = mpApplyLog; globalThis.mpApplyLog = function (lg) { if (document.body.classList.contains("ligapil") && Array.isArray(lg)) lg = lg.filter((e) => !(Array.isArray(e) && e[1] === "bu")); return al(lg) };/* balões de fala ficam só na TV */
  const as = mpApplySnap; globalThis.mpApplySnap = function (A, B, k, T, now) { as(A, B, k, T, now); LIGA.q = B && B.q ? B.q : null; if (LIGA.q) { R.started = true; R.go = 0; if (R.form) R.form.phase = "lights" }/* na classificação não há largada nem volta de apresentação */ ligaQ() };
  // tela de espera: a largada é do staff, não de um anfitrião
  const rv = mpRoomView; globalThis.mpRoomView = function () { if (MP.code !== LIGA.code) return rv(); if (TVM.on) return tvLobby(); ligaLobby() };
  // sair da corrida na liga = abandonar (o carro não fica com a IA)
  if (typeof mpAction === "function") { const ma = mpAction; globalThis.mpAction = function (a, k, b) { if (a === "mpQuit" && b && !b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Toque de novo: você abandona o GP"; return } if (a === "mpLeave" || a === "mpExit") { location.href = "/liga/#conta"; return } return ma(a, k, b) } }
}
function ligaLobby() {
  const host = mpHostPeer(), hp = (host && host.presence) || {}; const eu = LIGA.eu || {}; const p = eu.piloto || {}; const e = eu.equipe;
  const outros = mpPeers().filter((x) => !x.sameTab && x.presence && x.presence.role === "g");
  const st = !MP.conn ? ["Conectando ao servidor da liga…", ""] : hp.ph === "race" ? ["Corrida em andamento", "Você entra assistindo e, se estiver no grid, assume o seu carro."] : hp.ph === "res" ? ["GP encerrado", "O resultado oficial fica no site da liga."] : ["Aguardando a largada", "O staff inicia o GP no horário. Deixe esta tela aberta."];
  app.innerHTML = `<div class="mpw"><div class="row" style="justify-content:space-between"><h2>Liga Paddock · sala do GP</h2><a class="btn sm" href="/liga/#conta">Voltar ao site</a></div>
   <div class="grid2"><div class="card"><h3>${esc(st[0])}</h3><p class="muted">${esc(st[1])}</p>
     <div class="row">${typeof helmetSVG === "function" ? helmetSVG(p.c1 || "#FFD400", p.c2 || "#1B998B", 44) : ""}<div><b>${esc(p.nome || eu.nome || "")}</b> <span class="muted">#${esc(p.numero ?? "")} · ${esc(p.sigla || "")}</span><br><span class="muted" style="font-size:13px">${e ? esc(e.nome) + (eu.papel === "reserva" ? " · reserva" : "") : "sem equipe: você assiste"}</span></div></div>
     ${MP.err ? `<p class="pill bad" style="white-space:normal">${esc(MP.err)}</p>` : ""}
     <p class="muted" style="font-size:12.5px">Regras da liga: carros iguais, nenhum carro da IA. Se a sua conexão cair, o carro mantém o último comando por até 60 s; depois vai para o box e abandona.</p></div>
    <div class="card"><h3>Conectados agora · ${outros.length + 1}</h3><div class="ansl">${[{ presence: { nm: p.nome || eu.nome, cd: p.sigla, c1: p.c1 } }, ...outros].map((x) => `<div class="row" style="gap:8px"><span class="dot on" style="color:${esc(mpHex(x.presence.c1) || "#888")}"></span><b>${esc(String(x.presence.cd || "").slice(0, 3))}</b><span class="muted">${esc(String(x.presence.nm || "").slice(0, 24))}</span></div>`).join("")}</div></div></div></div>`;
}
// ===================== TELA DO PILOTO (limpa: a pista, o essencial e os comandos) =====================
LIGA.lc = { at: "auto", df: false, e: "auto", go: 0 };
function lcEnvia() { if (!R || !R.mpGuest || R.spect) return; mpSet({ lc: { sd: MP.cfg.sd, ...LIGA.lc } }) }
function pilInstall() {
  if (LIGA.pil) return; LIGA.pil = true;
  const css = document.createElement("style"); css.textContent = `body.ligapil{--dock:118px;overflow:hidden;background:#0b0d10}
  body.ligapil #stage{position:fixed!important;left:0;right:0;top:0;bottom:var(--dock);z-index:9000;margin:0!important;border-radius:0!important;max-width:none!important}
  body.ligapil #lower,body.ligapil #hTowerMode{display:none!important}
  body.ligapil .rvBox{z-index:9500;bottom:calc(var(--dock) + 12px)}/* botão do rádio sobre a pista, acima do painel */
  body.ligapil #ask{position:fixed!important;left:50%;transform:translateX(-50%);bottom:calc(var(--dock) + 12px);top:auto!important;z-index:9600;width:min(560px,calc(100% - 24px));margin:0!important}
  #lpDock{position:fixed;left:0;right:0;bottom:0;height:var(--dock);z-index:9100;background:#111419;border-top:1px solid #262c35;color:#eceef1;font:13px/1.2 Inter,system-ui,sans-serif;display:flex;flex-direction:column;padding:8px max(12px,env(safe-area-inset-right,0px)) calc(8px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));gap:8px}
  #lpDock .inf{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font:600 13px/1 ui-monospace,Menlo,monospace;color:#aab2bd}#lpDock .inf b{color:#eceef1;font-size:15px}#lpDock .inf .pos{font:800 italic 26px/1 "Barlow Condensed","Arial Narrow",sans-serif;color:#fff}
  #lpDock .inf .al{color:#ffd23f}#lpDock .inf .bad{color:#ff4b5c}#lpDock .grp{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;flex:1;min-height:0}
  #lpDock .g{display:flex;flex-direction:column;gap:4px;min-width:0}#lpDock .g>span{font:700 10.5px/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7b8591}
  #lpDock .sg{display:flex;gap:3px}#lpDock button{flex:1;min-width:0;appearance:none;border:1px solid #2c333d;background:#1a1f26;color:#cfd5dc;border-radius:8px;font:600 12px/1.1 Inter,sans-serif;padding:9px 4px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #lpDock button.on{background:#eceef1;color:#0b0d10;border-color:#eceef1}#lpDock button.go{background:#ff4d2e;border-color:#ff4d2e;color:#fff;font-weight:800;font-size:13px}#lpDock button.go:disabled{opacity:.45}
  #lpDock button.df.on{background:#4da3ff;border-color:#4da3ff;color:#06121f}#lpDock .tyS{color:#ff4b5c}#lpDock .tyM{color:#ffd23f}#lpDock .tyH{color:#eceef1}#lpDock .tyI{color:#3ddc84}#lpDock .tyW{color:#4da3ff}
  #lpDock .tp{margin-left:auto;display:flex;gap:6px}#lpDock .tp button{flex:none;padding:6px 10px}
  @media (max-width:860px){body.ligapil{--dock:150px}#lpDock .grp{grid-template-columns:repeat(2,minmax(0,1fr));overflow:auto;align-content:start}#lpDock .g.w{grid-column:1/-1}#lpDock .inf{gap:10px;font-size:12px}#lpDock .inf b{font-size:13px}}`;
  document.head.appendChild(css);
  const fit = fitRaceCanvas; globalThis.fitRaceCanvas = function () { if (!document.body.classList.contains("ligapil")) return fit(); const cv = document.getElementById("rc"), st = document.getElementById("stage"); if (!cv || !st) return fit();
    const dpr = Math.min(2, window.devicePixelRatio || 1), cw = st.clientWidth, ch = st.clientHeight; if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); cv.style.width = cw + "px"; cv.style.height = ch + "px" } const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return { ctx, cw, ch } };
  if (typeof tvOn === "function") { const to = tvOn; globalThis.tvOn = function () { return document.body.classList.contains("ligapil") ? false : to() } }/* sem comentarista e faixas de TV na tela de quem pilota */
  setInterval(pilTick, 250);
  addEventListener("keydown", (ev) => { if (!document.body.classList.contains("ligapil") || (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName))) return;
    const k = ev.key.toLowerCase(); const m = { "1": ["pace", "tyres"], "2": ["pace", "bal"], "3": ["pace", "push"] }[k];
    if (m) { ev.preventDefault(); pilAcao(m[0], m[1]) } else if (k === " ") { ev.preventDefault(); pilAcao("go") } else if (k === "d") { ev.preventDefault(); pilAcao("df") } });
  document.addEventListener("click", (ev) => { const b = ev.target.closest && ev.target.closest("[data-lp]"); if (!b) return; ev.preventDefault(); ev.stopPropagation(); const [a, k] = b.dataset.lp.split(":"); pilAcao(a, k) }, true);
}
function pilAcao(a, k) {
  const me = R && R.cars.find((c) => c.isP); if (!me || R.spect) return;
  if (a === "pace" || a === "risk") { if (typeof uiAct === "function") uiAct(a, k) }
  else if (a === "e" || a === "at") { LIGA.lc[a] = k; lcEnvia() }
  else if (a === "df") { LIGA.lc.df = !LIGA.lc.df; lcEnvia() }
  else if (a === "go") { if (LIGA.goT && performance.now() - LIGA.goT < 4000) return; LIGA.goT = performance.now(); LIGA.lc.go++; lcEnvia() }
  else if (a === "box") mpCmd({ b: k === "x" ? null : k });
  else if (a === "som") { if (typeof sndToggle === "function") UI.sound = sndToggle(!UI.sound) }
  else if (a === "sair") { const b = document.querySelector("#lpDock [data-lp='sair']"); if (b && !b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Confirmar: abandonar"; setTimeout(() => { if (b) { b.dataset.sure = ""; b.textContent = "Sair" } }, 4000); return } mpAction("mpQuit", "", { dataset: { sure: "1" }, textContent: "" }) }
  LIGA.pilH = ""; pilTick();
}
function pilTick() {
  const on = typeof UI !== "undefined" && UI.scr === "mprace" && typeof R !== "undefined" && R && R.mpGuest && !R.spect && !TVM.on && !(W && W.step === "mpres");
  document.body.classList.toggle("ligapil", !!on); let d = document.getElementById("lpDock"); if (!on) { if (d) d.remove(); return }
  const me = R.cars.find((c) => c.isP); if (!me) return;
  if (!d) { d = document.createElement("div"); d.id = "lpDock"; d.innerHTML = `<div class="inf" id="lpInf"></div><div class="grp" id="lpGrp"></div>`; document.body.appendChild(d); requestAnimationFrame(() => { CAM.cut = 1 }) }
  const ord = R.order.filter((c) => running(c) || c.status === "fin"); const i = ord.indexOf(me); const A = i > 0 ? ord[i - 1] : null, B = i >= 0 ? ord[i + 1] : null; const L = me.L || 90;
  const gap = (x, y) => Math.abs((x.prog - y.prog) * L); const ty = me.tyre || {}; const fd = (me.fuel || 0) - ((me.L ? 0 : 0));
  const inf = `<span class="pos">P${i + 1}<small style="font-size:15px;color:#7b8591">/${ord.length}</small></span><span>VOLTA <b>${Math.min(R.L || 0, (R.lead || 0) + 1)}/${R.L || "?"}</b></span>
    <span>FRENTE <b>${A ? `${A.code} +${gap(A, me).toFixed(1)}` : "—"}</b></span><span>ATRÁS <b>${B ? `${B.code} −${gap(me, B).toFixed(1)}` : "—"}</b></span>
    <span>PNEU <b class="ty${ty.c}">${ty.c || "?"}</b> <b>${Math.round((1 - (ty.wear || 0)) * 100)}%</b> · ${ty.age || 0}v</span><span>BATERIA <b>${Math.round(me.batt || 0)}%</b></span>
    ${me.pen ? `<span class="bad">PUNIÇÃO <b>${me.pen} s</b></span>` : ""}${R.sc ? `<span class="al"><b>${R.sc.type === "vsc" ? "VSC" : "SAFETY CAR"}</b></span>` : ""}${R.red ? `<span class="bad"><b>BANDEIRA VERMELHA</b></span>` : ""}${me.pitCall ? `<span class="al">BOX: <b>${me.pitCall}</b></span>` : ""}`;
  const I = typeof intentOf === "function" ? intentOf(me) : {}; const lc = LIGA.lc; const can = running(me) && !me.pit && R.started && !R.sc && !R.red;
  const sg = (a, opts, cur) => `<div class="sg">${opts.map(([k, n]) => `<button data-lp="${a}:${k}" class="${cur === k ? "on" : ""}">${n}</button>`).join("")}</div>`;
  /* no painel só a disputa; ritmo, risco, bateria, lado do ataque e box ficam no botão Rádio (radio-vivo.js) */
  const grp = `<div class="g w"><span>Disputa · espaço · D <span class="tp"><button data-lp="som" title="Som">${UI.sound ? "🔊" : "🔈"}</button><button data-lp="sair">Sair</button></span></span><div class="sg"><button data-lp="go" class="go" ${can && A ? "" : "disabled"} title="Forçar ultrapassagem (espaço)">Ultrapassar!</button><button data-lp="df" class="df${lc.df ? " on" : ""}">Defender</button></div></div>`;
  if (LIGA.q) { document.body.style.setProperty("--dock", "50px"); const t = `<span class="pos">CLASSIFICAÇÃO</span><span>Use o painel no canto da pista: <b>Sair para a pista</b> e <b>Abortar</b>.</span><span class="tp"><button data-lp="som">${UI.sound ? "🔊" : "🔈"}</button></span>`; const a = document.getElementById("lpInf"), g = document.getElementById("lpGrp"); if (a._h !== t) { a._h = t; a.innerHTML = t; g.innerHTML = ""; g._h = "" } return }
  document.body.style.removeProperty("--dock");
  const a = document.getElementById("lpInf"), g = document.getElementById("lpGrp"); if (a._h !== inf) { a._h = inf; a.innerHTML = inf } if (g._h !== grp) { g._h = grp; g.innerHTML = grp }
}
// ---------- painel da classificação ao vivo (tempos, linha de corte e os botões do piloto)
const Q_ST = { gar: "garagem", pitout: "saindo", out: "volta de saída", push: "VOLTA RÁPIDA", in: "volta de entrada", box: "box" };
function ligaQ() {
  const q = LIGA.q; document.body.classList.toggle("ligaq", !!q); let el = document.getElementById("ligaQ");
  if (!q) { if (el) el.remove(); return }
  const now = performance.now(); if (el && now - (LIGA.qT || 0) < 250) return; LIGA.qT = now;
  const st = document.getElementById("stage"); if (!st) return;
  if (!el) { el = document.createElement("div"); el.id = "ligaQ"; st.appendChild(el);
    if (!document.getElementById("ligaQcss")) { const c = document.createElement("style"); c.id = "ligaQcss"; c.textContent = `body.ligaq #hTower{display:none!important}
      #ligaQ{position:absolute;left:8px;top:8px;z-index:30;width:min(300px,calc(100% - 16px));background:rgba(12,14,18,.9);color:#eceef1;border-radius:10px;font:12.5px/1.3 Inter,system-ui,sans-serif;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.4)}
      #ligaQ .qh{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#ff4d2e;font:800 15px/1 "Barlow Condensed","Arial Narrow",sans-serif;letter-spacing:.06em;text-transform:uppercase}
      #ligaQ .qr{display:grid;grid-template-columns:22px 8px 40px 1fr auto;gap:6px;align-items:center;padding:3px 10px}#ligaQ .qr.me{background:rgba(255,255,255,.1)}#ligaQ .qr.out{opacity:.5}
      #ligaQ .qc{height:2px;background:#ff4b5c;margin:2px 10px}#ligaQ .qt{font:600 12px ui-monospace,monospace;text-align:right}#ligaQ .qs{font-size:10.5px;color:#aab2bd}#ligaQ .qs.vr{color:#c49bff;font-weight:700}
      #ligaQ .qb{display:flex;gap:6px;padding:8px 10px;border-top:1px solid rgba(255,255,255,.1)}#ligaQ .qb button{flex:1;appearance:none;border:0;border-radius:8px;padding:9px;font:700 13px/1 Inter,system-ui,sans-serif;cursor:pointer}
      #ligaQ .go{background:#3ddc84;color:#06240f}#ligaQ .ab{background:#2a3039;color:#eceef1}#ligaQ .qi{padding:6px 10px;color:#aab2bd;font-size:11.5px}`; document.head.appendChild(c) } }
  const cl = (x) => { x = Math.max(0, Math.ceil(x)); return Math.floor(x / 60) + ":" + String(x % 60).padStart(2, "0") };
  const key = q.n - 1; const tm = (i) => { const r = q.r[i]; return r ? r[key] : null };
  const pool = q.p.filter((i) => i >= 0), fora = q.r.map((_, i) => i).filter((i) => !pool.includes(i));
  pool.sort((a, b) => (tm(a) ?? 1e9) - (tm(b) ?? 1e9));
  const best = (i) => { const r = q.r[i] || []; return r[2] ?? r[1] ?? r[0] };
  fora.sort((a, b) => (best(a) ?? 1e9) - (best(b) ?? 1e9));
  const me = R.cars.find((c) => c.isP && !R.spect); const myI = me ? me.idx : -1; const ft = (t) => t == null ? "—" : typeof fmtT === "function" ? fmtT(t) : t.toFixed(3);
  const row = (i, p, out) => { const c = R.cars[i]; if (!c) return ""; const sx = (q.r[i] || [])[3]; const b0 = tm(pool[0]); const t = out ? best(i) : tm(i);
    return `<div class="qr${i === myI ? " me" : ""}${out ? " out" : ""}"><span class="qt" style="text-align:left">${p}</span><i style="width:6px;height:14px;border-radius:2px;background:${c.col || "#888"}"></i><b>${c.code}</b><span class="qs${sx === "push" ? " vr" : ""}">${out ? "eliminado" : Q_ST[sx] || ""}</span><span class="qt">${out || p === 1 || t == null || b0 == null ? ft(t) : "+" + (t - b0).toFixed(3)}</span></div>` };
  const head = q.ph === "break" ? `Intervalo · Q${q.n + 1} em ${cl(q.be)}` : q.ph === "done" || q.ph === "end" ? (q.n === 3 || !q.k ? "Fim da classificação" : `Fim do Q${q.n}`) : `Q${q.n} <span>${cl(q.cl)}</span>`;
  let rows = ""; pool.forEach((i, j) => { rows += row(i, j + 1, false); if (q.k && j + 1 === q.k && j + 1 < pool.length) rows += `<div class="qc" title="linha de corte"></div>` });
  if (fora.length) rows += `<div class="qi">Eliminados</div>` + fora.map((i, j) => row(i, pool.length + j + 1, true)).join("");
  let bt = ""; if (me && !TVM.on) { const sx = (q.r[myI] || [])[3]; const vivo = q.p.includes(myI);
    if (!vivo) bt = `<div class="qi">Você está fora desta fase.</div>`;
    else if (q.ph !== "run") bt = `<div class="qi">Aguarde: a sessão não está aberta.</div>`;
    else if (sx === "gar") bt = `<div class="qb"><button class="go" data-liga="qgo">Sair para a pista</button></div>`;
    else if (sx === "out" || sx === "push" || sx === "pitout") bt = `<div class="qb"><button class="ab" data-liga="qbox">Abortar e voltar ao box</button></div>`;
    else bt = `<div class="qi">${Q_ST[sx] || ""}: o carro está voltando.</div>` }
  const lc = document.getElementById("lapc"), lh = `CLASSIFICAÇÃO · ${q.ph === "break" ? "INTERVALO" : "Q" + q.n}`; if (lc && lc.textContent !== lh) lc.textContent = lh;
  if (!el.firstChild) el.innerHTML = `<div id="lqT"></div><div id="lqB"></div>`;
  const t = `<div class="qh">${head}</div>${rows}`, a = el.querySelector("#lqT"), b = el.querySelector("#lqB");
  if (a._h !== t) { a._h = t; a.innerHTML = t } if (b._h !== bt) { b._h = bt; b.innerHTML = bt }/* os botões só mudam quando o estado muda: o toque não se perde */
}
if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("click", (ev) => { const b = ev.target.closest && ev.target.closest("[data-liga]"); if (!b || !LIGA.q) return; ev.preventDefault(); ev.stopPropagation();
  LIGA.qc = LIGA.qc || { go: 0, box: 0 }; if (b.dataset.liga === "qgo") LIGA.qc.go++; else LIGA.qc.box++; mpSet({ qc: { sd: MP.cfg.sd, go: LIGA.qc.go, box: LIGA.qc.box } }); b.disabled = true; LIGA.qT = 0 }, true);
async function ligaEntrar() {
  try { if (typeof lazyLoad === "function") await lazyLoad("online"); ligaInstall();
    const r = await fetch("/api/eu", { credentials: "same-origin" }); LIGA.eu = r.ok ? await r.json() : null;
    if (!LIGA.eu || !LIGA.eu.logado) { location.href = "/liga/#entrar"; return }
    if (TVM.on) { MP.id = mpCleanId({ nm: "Transmissão", cd: "TVX", num: 99 }); MP.uid = "tv"; MP.tm = "ferrari"; await mpEnter(LIGA.code, "g"); return }
    const p = LIGA.eu.piloto; MP.id = mpCleanId(p ? { nm: p.nome, cd: p.sigla, num: p.numero, c1: p.c1, c2: p.c2 } : { nm: LIGA.eu.nome, cd: "VIS", num: 99 }); MP.uid = "u" + LIGA.eu.id;
    MP.tm = LIGA.eu.equipe ? "lg" + LIGA.eu.equipe.id : "ferrari"; await mpEnter(LIGA.code, "g");
  } catch (e) { console.error("liga:", e); if (typeof app !== "undefined" && app) app.innerHTML = `<div class="card"><h3>Não deu para entrar na sala da liga</h3><p class="muted">${esc(String(e && e.message || e))}</p><a class="btn" href="/liga/">Voltar ao site</a></div>` }
}
// ===================== TELA DE TRANSMISSÃO (endereço /?liga=1&tv=1) =====================
// Só a corrida em tela cheia, com os gráficos de TV, para capturar no OBS. Tudo por atalhos de teclado configuráveis
// (F1 mostra e muda os atalhos; ficam salvos neste computador).
const TVM = { on: LIGA.on && typeof location !== "undefined" && /[?&]tv=1\b/.test(location.search), lock: null, kind: "tv", help: false, edit: null, k: null, camp: null };
const TV_ACOES = [["auto", "Câmera automática (o diretor do jogo escolhe)", "a"], ["tv", "Câmera de TV no carro escolhido", "t"], ["chase", "Câmera de perseguição no carro escolhido", "c"], ["pista", "Pista inteira", "p"],
  ["lider", "Focar o líder", "l"], ["prox", "Próximo carro (posição abaixo)", "ArrowRight"], ["ant", "Carro anterior (posição acima)", "ArrowLeft"],
  ...Array.from({ length: 10 }, (_, i) => ["pos" + (i + 1), `Focar o ${i + 1}º colocado`, i === 9 ? "0" : String(i + 1)]),
  ["intervalo", "Torre: diferença para o líder ou para o carro da frente", "i"], ["batalha", "Gráfico de batalha (a melhor briga agora)", "b"], ["campeonato", "Campeonato ao vivo (se terminasse agora)", "g"], ["graficos", "Mostrar ou esconder os gráficos de TV", "h"], ["som", "Ligar ou desligar o som", "m"], ["ajuda", "Mostrar estes atalhos", "F1"]];
function tvKeys() { if (TVM.k) return TVM.k; let o = {}; try { o = JSON.parse(localStorage.getItem("liga-tv-atalhos") || "{}") || {} } catch (e) {} TVM.k = Object.fromEntries(TV_ACOES.map(([a, , d]) => [a, typeof o[a] === "string" ? o[a] : d])); return TVM.k }
function tvKeySave() { try { localStorage.setItem("liga-tv-atalhos", JSON.stringify(TVM.k)) } catch (e) {} }
const tvNomeTecla = (k) => ({ " ": "Espaço", ArrowRight: "→", ArrowLeft: "←", ArrowUp: "↑", ArrowDown: "↓" }[k] || (k.length === 1 ? k.toUpperCase() : k));
function tvOrdem() { return typeof R !== "undefined" && R && R.order ? R.order.filter((c) => running(c) || c.status === "fin") : [] }
function tvFoco(c) { if (!c) return; TVM.lock = c.id; if (UI.cam === "all" || UI.cam === "tv") UI.cam = TVM.kind === "chase" ? "chase" : "director"; CAM.cut = 1 }
function tvAcao(a) {
  if (typeof R === "undefined" || !R) { if (a === "ajuda") tvAjuda(); return }
  const ord = tvOrdem(); const i = ord.findIndex((c) => c.id === TVM.lock);
  if (a === "auto") { TVM.lock = null; UI.cam = "tv"; CAM.cut = 1 }
  else if (a === "tv" || a === "chase") { TVM.kind = a; if (!TVM.lock && ord[0]) TVM.lock = ord[0].id; UI.cam = a === "chase" ? "chase" : "director"; CAM.cut = 1 }
  else if (a === "pista") { TVM.lock = null; UI.cam = "all"; CAM.pan = null; CAM.userZ = 1; CAM.cut = 1 }
  else if (a === "lider") tvFoco(ord[0]);
  else if (a === "prox") tvFoco(ord[Math.min(ord.length - 1, i + 1)] || ord[0]);
  else if (a === "ant") tvFoco(ord[Math.max(0, i - 1)] || ord[0]);
  else if (/^pos\d+$/.test(a)) tvFoco(ord[+a.slice(3) - 1]);
  else if (a === "intervalo") { TVM.int = !TVM.int }
  else if (a === "batalha") { try { const S = tv3(); S.batNext = 0; tv3BattleTick() } catch (e) {} }
  else if (a === "campeonato") { try { tv3Champ() } catch (e) {} }
  else if (a === "graficos") { PREFS.tv = PREFS.tv === false; if (typeof prefsSave === "function") prefsSave() }
  else if (a === "som") { if (typeof sndToggle === "function") UI.sound = sndToggle(!UI.sound) }
  else if (a === "ajuda") tvAjuda();
}
function tvAjuda(force) {
  TVM.help = force != null ? force : !TVM.help; let el = document.getElementById("tvHelp"); if (!TVM.help) { if (el) el.remove(); TVM.edit = null; return }
  if (!el) { el = document.createElement("div"); el.id = "tvHelp"; document.body.appendChild(el) } const K = tvKeys();
  el.innerHTML = `<div class="tvh-c"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Atalhos da transmissão</h3><button class="btn sm" data-tvh="fechar">Fechar (${esc(tvNomeTecla(K.ajuda))})</button></div>
    <p class="muted" style="font-size:12.5px;margin:4px 0 10px">Toque em "mudar" e aperte a nova tecla. Ficam salvos neste computador.</p>
    <div class="tvh-l">${TV_ACOES.map(([a, n]) => `<div class="tvh-i"><span>${esc(n)}</span><kbd>${TVM.edit === a ? "aperte…" : esc(tvNomeTecla(K[a]))}</kbd><button class="btn sm" data-tvh="${a}">mudar</button></div>`).join("")}</div>
    <div class="row" style="margin-top:10px"><button class="btn sm" data-tvh="padrao">Voltar ao padrão</button></div></div>`;
}
function tvInstall() {
  if (TVM.inst) return; TVM.inst = true; document.body.classList.add("ligatv");
  const st = document.createElement("style"); st.textContent = `body.ligatv{background:#000;overflow:hidden}body.ligatv #hSec,body.ligatv #hCar,body.ligatv #launch,body.ligatv #ask{display:none!important}body.ligatv #stage{position:fixed!important;inset:0!important;z-index:9000;margin:0!important;border-radius:0!important;max-width:none!important}
    #tvHelp{position:fixed;inset:0;z-index:9500;background:rgba(5,6,8,.72);display:grid;place-items:center;padding:16px}#tvHelp .tvh-c{background:#14171c;color:#eceef1;border:1px solid #363e49;border-radius:14px;padding:18px;width:min(640px,100%);max-height:90vh;overflow:auto}
    #tvHelp .tvh-l{display:grid;gap:4px}#tvHelp .tvh-i{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:6px 8px;border-radius:8px;background:#1b1f26}#tvHelp kbd{font:700 13px ui-monospace,monospace;background:#0d0f12;border:1px solid #363e49;border-radius:6px;padding:4px 8px;min-width:34px;text-align:center}
    .tvlob{position:fixed;inset:0;background:radial-gradient(900px 400px at 80% -10%,rgba(255,77,46,.35),transparent 60%),#0b0d10;color:#eceef1;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:6vw;gap:14px;z-index:8000}
    .tvlob h1{font:800 italic clamp(48px,9vw,140px)/.9 "Barlow Condensed","Arial Narrow",sans-serif;margin:0;text-transform:uppercase;letter-spacing:.01em}.tvlob .k{font:700 clamp(14px,1.4vw,22px)/1 "Barlow Condensed","Arial Narrow",sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#ff4d2e}
    .tvlob .z{position:absolute;left:0;right:0;bottom:0;height:14px;background:repeating-linear-gradient(90deg,#ff4d2e 0 28px,#fff 28px 56px)}`;
  document.head.appendChild(st);
  const fit = fitRaceCanvas; globalThis.fitRaceCanvas = function () { const cv = document.getElementById("rc"); if (!cv) return fit(); const dpr = Math.min(2, window.devicePixelRatio || 1); const cw = innerWidth, ch = innerHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); cv.style.width = cw + "px"; cv.style.height = ch + "px" } const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return { ctx, cw, ch } };
  const cf = cameraFrame; globalThis.cameraFrame = function (dt, cw, ch) {
    if (TVM.lock && UI.cam !== "all" && UI.cam !== "tv") { const c = R.cars.find((x) => x.id === TVM.lock); if (c && (running(c) || (c.status === "fin" && !R.over))) { CAM.userZ = TVM.kind === "chase" ? 1 : .62; shotChase(dt, cw, ch, c);/* "TV": mesma câmera que segue o carro, mais aberta */ if (typeof camShake === "function") camShake(dt, c); return c } TVM.lock = null; UI.cam = "tv" }
    return cf(dt, cw, ch) };
  addEventListener("keydown", (ev) => {
    if (TVM.edit) { ev.preventDefault(); if (ev.key !== "Escape") { tvKeys()[TVM.edit] = ev.key; tvKeySave() } TVM.edit = null; tvAjuda(true); return }
    if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return; const K = tvKeys(); const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    const a = Object.keys(K).find((x) => (K[x].length === 1 ? K[x].toLowerCase() : K[x]) === k); if (!a) return; ev.preventDefault(); ev.stopPropagation(); tvAcao(a) }, true);
  document.addEventListener("click", (ev) => { const b = ev.target.closest && ev.target.closest("[data-tvh]"); if (!b) return; const a = b.dataset.tvh;
    if (a === "fechar") return tvAjuda(false); if (a === "padrao") { TVM.k = null; try { localStorage.removeItem("liga-tv-atalhos") } catch (e) {} return tvAjuda(true) } TVM.edit = a; tvAjuda(true) });
  fetch("/api/campeonato").then((r) => r.json()).then((j) => { TVM.camp = j; if (UI.scr === "mp") tvLobby() }).catch(() => {});
  const c2 = document.createElement("style"); c2.textContent = `body.ligatv.ligarc #hTower{display:none!important}
    #ligaT{position:absolute;left:14px;top:14px;z-index:30;width:272px;background:rgba(10,12,16,.9);color:#eceef1;border-radius:10px;overflow:hidden;font:13px/1.2 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45)}
    #ligaT .h{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#ff4d2e;font:800 16px/1 "Barlow Condensed","Arial Narrow",sans-serif;letter-spacing:.06em;text-transform:uppercase}#ligaT .h small{font:700 11px/1 Inter,sans-serif;opacity:.85}
    #ligaT .r{display:grid;grid-template-columns:22px 22px 44px 1fr auto;gap:7px;align-items:center;padding:3px 10px;height:24px}#ligaT .r:nth-child(even){background:rgba(255,255,255,.035)}#ligaT .r.f{background:rgba(255,255,255,.14)}
    #ligaT .lg{width:22px;height:18px;display:grid;place-items:center}#ligaT .lg img{max-width:22px;max-height:18px;object-fit:contain}#ligaT .lg i{width:5px;height:16px;border-radius:2px}
    #ligaT .p{font:700 12px ui-monospace,monospace;text-align:right;color:#aab2bd}#ligaT .c{font-weight:800;letter-spacing:.03em}#ligaT .g{font:600 12px ui-monospace,monospace;text-align:right}#ligaT .s{font:700 10px/1 Inter,sans-serif;padding:2px 4px;border-radius:4px;background:#2a3039;color:#eceef1}#ligaT .s.pit{background:#4da3ff;color:#06121f}#ligaT .s.out{background:#ff4b5c}#ligaT .s.pen{background:#ffd23f;color:#1a1400}
    #ligaF{position:absolute;right:18px;bottom:18px;z-index:30;display:flex;align-items:center;gap:12px;background:rgba(10,12,16,.92);color:#eceef1;border-radius:12px;padding:10px 16px 10px 10px;box-shadow:0 8px 24px rgba(0,0,0,.45);border-left:5px solid var(--c)}
    #ligaF .pp{font:800 italic 34px/1 "Barlow Condensed","Arial Narrow",sans-serif}#ligaF img{width:44px;height:44px;object-fit:contain}#ligaF b{display:block;font:800 22px/1 "Barlow Condensed","Arial Narrow",sans-serif;text-transform:uppercase;letter-spacing:.02em}#ligaF small{color:#aab2bd;font-size:12px}`;
  document.head.appendChild(c2); setInterval(tvTorre, 250);
}
function tvTorre() {
  const on = typeof UI !== "undefined" && UI.scr === "mprace" && typeof R !== "undefined" && R && R.cars && !LIGA.q && PREFS.tv !== false;
  document.body.classList.toggle("ligarc", !!on); let t = document.getElementById("ligaT"), f = document.getElementById("ligaF"); const st = document.getElementById("stage");
  if (!on || !st) { if (t) t.remove(); if (f) f.remove(); return }
  if (!t) { t = document.createElement("div"); t.id = "ligaT"; st.appendChild(t) }
  const ord = R.order.filter((c) => c.status !== "dsq"); const lead = ord[0]; const L = (lead && lead.L) || 90; const team = (c) => (G.teams.find((x) => x.id === c.d.team) || {});
  const logo = (c) => { const tm = team(c), lg = LIGA.logos[tm.id]; return lg ? `<img src="${lg.url}" alt="">` : `<i style="background:${tm.c || c.col || "#888"}"></i>` };
  const gapTxt = (c, i) => { if (c.status === "dnf") return `<span class="s out">OUT</span>`; if (i === 0) return R.over ? "Vencedor" : "Líder"; const ref = TVM.int ? ord[i - 1] : lead; const dl = Math.floor(ref.prog) - Math.floor(c.prog) - (fr(ref.prog) < fr(c.prog) ? 1 : 0);
    if (!TVM.int && dl >= 1 && (ref.prog - c.prog) >= 1) return `+${Math.floor(ref.prog - c.prog)} V`; return "+" + Math.max(0, (ref.prog - c.prog) * L).toFixed(1) };
  const h = `<div class="h"><span>Volta ${Math.min(R.L || 0, (R.lead || 0) + 1)}/${R.L || "?"}</span><small>${TVM.int ? "INTERVALO" : "LÍDER"}${R.sc ? " · " + (R.sc.type === "vsc" ? "VSC" : "SAFETY CAR") : ""}</small></div>` +
    ord.map((c, i) => `<div class="r${c.id === TVM.lock ? " f" : ""}"><span class="p">${i + 1}</span><span class="lg">${logo(c)}</span><span class="c">${c.code}</span><span>${c.pit ? `<span class="s pit">PIT</span>` : ""}${c.pen ? ` <span class="s pen">+${c.pen}s</span>` : ""}</span><span class="g">${gapTxt(c, i)}</span></div>`).join("");
  if (t._h !== h) { t._h = h; t.innerHTML = h }
  const fc = TVM.lock && R.cars.find((x) => x.id === TVM.lock);
  if (!fc) { if (f) f.remove(); return } if (!f) { f = document.createElement("div"); f.id = "ligaF"; st.appendChild(f) }
  const tm = team(fc), lg = LIGA.logos[tm.id]; const fh = `<span class="pp">P${ord.indexOf(fc) + 1}</span>${lg ? `<img src="${lg.url}" alt="">` : ""}<span><b>${esc(fc.d.n)}</b><small>#${fc.d.num || ""} · ${esc(tm.n || "")}</small></span>`;
  f.style.setProperty("--c", tm.c || fc.col || "#ff4d2e"); if (f._h !== fh) { f._h = fh; f.innerHTML = fh }
}
function tvLobby() {
  const nx = TVM.camp && TVM.camp.proximo; const host = mpHostPeer(), hp = (host && host.presence) || {}; const n = mpPeers().filter((x) => !x.sameTab && x.presence && x.presence.role === "g").length;
  app.innerHTML = `<div class="tvlob"><span class="k">${nx ? `Temporada ${TVM.camp.temporada.numero} · GP ${nx.rodada} de ${TVM.camp.gps.length}` : "Liga Paddock"}</span><h1>${nx ? esc(nx.gp) : "Liga<br>Paddock"}</h1>
    <span class="k" style="color:#aab2bd">${hp.ph === "res" ? "GP encerrado" : MP.conn ? `${n} piloto${n === 1 ? "" : "s"} na sala · a largada é às 20h` : "conectando…"}</span>
    <span style="position:absolute;right:16px;top:12px;font:12px ui-monospace,monospace;color:#7b8591">${esc(tvNomeTecla(tvKeys().ajuda))}: atalhos</span><div class="z"></div></div>`;
}
if (typeof mpBuildWorld === "function") ligaInstall();// servidor: o pacote online já está carregado
if (LIGA.on && typeof addEventListener === "function" && typeof document !== "undefined" && document.readyState !== undefined) { const go = () => setTimeout(ligaEntrar, 200); if (document.readyState === "complete") go(); else addEventListener("load", go) }
