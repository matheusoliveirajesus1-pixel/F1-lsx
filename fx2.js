// ===================== EFEITOS VISUAIS 2.0 =====================
// Fogo, fumaça de pneu, faíscas, poeira, spray de chuva e clarão de batida feitos com partículas suaves
// (imagens desfocadas desenhadas uma vez e reaproveitadas) e brilho somado ("lighter").
// É só desenho: não usa o sorteio da física (RNG) nem muda nada da corrida. Em qualidade "leve" só desenha menos partículas.
const FX2 = { sp: null, tentou: false };
function fx2Hash(i) { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }
// a qualidade "leve" só reduz a quantidade de partículas: os efeitos continuam aparecendo
function fx2Nivel() { return typeof QL !== "undefined" && QL ? Math.max(1, QL.lvl) : 2 }
function fx2Sprites() {
  if (FX2.sp || FX2.tentou) return FX2.sp; FX2.tentou = true;
  try {
    if (typeof document === "undefined" || !document.createElement) return null;
    const mk = (stops, n = 64) => { const c = document.createElement("canvas"); if (!c || !c.getContext) return null; c.width = c.height = n; const g = c.getContext("2d"); if (!g || !g.createRadialGradient) return null;
      const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, n, n); return c };
    const sp = {
      fumacaClara: mk([[0, "rgba(236,238,240,.95)"], [.45, "rgba(222,225,228,.55)"], [1, "rgba(210,214,218,0)"]]),
      fumacaEscura: mk([[0, "rgba(46,44,42,.9)"], [.5, "rgba(40,38,36,.5)"], [1, "rgba(30,30,30,0)"]]),
      poeira: mk([[0, "rgba(214,192,140,.9)"], [.5, "rgba(204,182,132,.45)"], [1, "rgba(196,176,128,0)"]]),
      agua: mk([[0, "rgba(232,238,246,.85)"], [.5, "rgba(220,228,238,.35)"], [1, "rgba(210,220,232,0)"]]),
      fogoNucleo: mk([[0, "rgba(255,255,236,1)"], [.25, "rgba(255,236,150,.9)"], [.6, "rgba(255,170,40,.35)"], [1, "rgba(255,120,0,0)"]]),
      fogo: mk([[0, "rgba(255,196,64,.95)"], [.4, "rgba(255,110,20,.6)"], [1, "rgba(200,40,0,0)"]]),
      brilho: mk([[0, "rgba(255,170,70,.75)"], [.5, "rgba(255,110,30,.25)"], [1, "rgba(255,80,0,0)"]]),
      clarao: mk([[0, "rgba(255,255,255,1)"], [.3, "rgba(255,226,170,.7)"], [1, "rgba(255,160,60,0)"]]),
    };
    // chama: gota alongada (base quente, ponta vermelha que some)
    sp.chama = (() => { const c = document.createElement("canvas"); c.width = 48; c.height = 112; const g = c.getContext("2d"); if (!g || !g.createRadialGradient) return null; g.translate(24, 84); g.scale(1, 2.6);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 22); gr.addColorStop(0, "rgba(255,250,210,1)"); gr.addColorStop(.3, "rgba(255,200,70,.9)"); gr.addColorStop(.65, "rgba(255,100,20,.45)"); gr.addColorStop(1, "rgba(180,30,0,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill(); return c })();
    if (Object.values(sp).some((x) => !x)) return null; FX2.sp = sp; return sp;
  } catch (e) { return null }
}
function fx2Ok(ctx) { return !FX2.off && fx2Nivel() > 0 && ctx && typeof ctx.drawImage === "function" && !!fx2Sprites() }
function fx2Img(ctx, img, x, y, r, a) { if (a <= .003 || r <= .2) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(img, x - r, y - r, r * 2, r * 2) }

// ---------- fogo: brilho no chão, chamas subindo (núcleo quase branco, bordas laranja), brasas e fumaça escura
(function () {
  if (typeof drawFire !== "function") return; const base = drawFire;
  globalThis.drawFire = function (ctx, cw, ch, p, age, Z, now) {
    if (!fx2Ok(ctx)) return base(ctx, cw, ch, p, age, Z, now);
    const S = FX2.sp, k = Math.min(1, (16 - age) / 4) * Math.min(1, age / .6), hi = fx2Nivel() >= 2;
    const g = toScreen(p.x, p.y, 0, cw, ch), fl = .8 + .2 * Math.sin(now * 23) + .1 * Math.sin(now * 37);
    ctx.save();
    // fumaça escura subindo (atrás das chamas)
    const nf = hi ? 14 : 7;
    for (let j = 0; j < nf; j++) { const ph = (now * .28 + fx2Hash(j)) % 1, z = (10 + ph * 70) * U, dx = (ph * 26 + Math.sin(now * .9 + j) * 4) * U;
      const s = toScreen(p.x + dx, p.y - dx * .4, z, cw, ch); fx2Img(ctx, S.fumacaEscura, s[0], s[1], (6 + ph * 22) * U * Z, .55 * (1 - ph) * k * Math.min(1, ph * 6)) }
    ctx.globalCompositeOperation = "lighter";
    fx2Img(ctx, S.brilho, g[0], g[1], 22 * U * Z * fl, .55 * k);// luz no asfalto
    const nc = hi ? 22 : 11;
    for (let j = 0; j < nc; j++) { const h = fx2Hash(j + 7), ph = (now * (1.5 + h) + h) % 1, ang = j * 2.4 + p.h, rr = (1 - ph) * 3 * U;
      const s = toScreen(p.x + Math.cos(ang) * rr, p.y + Math.sin(ang) * rr, (2 + ph * (14 + 8 * h) * k) * U, cw, ch), sw = Math.sin(now * 9 + j) * 1.4 * U * Z * ph;
      const r = (4.6 * (1 - ph * .7)) * U * Z * (.7 + .3 * k), core = ph < .25 && j % 3 === 0, a = (core ? .55 : .42) * (1 - ph) * k;
      if (a > .003) { ctx.globalAlpha = Math.min(1, a * 1.5); const img = core ? S.fogoNucleo : S.chama; if (core) ctx.drawImage(img, s[0] + sw - r, s[1] - r, r * 2, r * 2); else ctx.drawImage(img, s[0] + sw - r * .8, s[1] - r * 3.2, r * 1.6, r * 3.8) } }// línguas de fogo subindo
    if (hi) for (let j = 0; j < 8; j++) { const h = fx2Hash(j + 99), ph = (now * .7 + h) % 1; const s = toScreen(p.x + (h - .5) * 10 * U + ph * 8 * U, p.y + (fx2Hash(j + 3) - .5) * 8 * U, (8 + ph * 46) * U, cw, ch);
      ctx.globalAlpha = (1 - ph) * k * .9; ctx.fillStyle = "#ffcf6a"; ctx.fillRect(s[0], s[1], 1.4 * Z, 1.4 * Z) }// brasas
    ctx.globalCompositeOperation = "source-over";
    for (let j = 0; j < nf; j++) { const ph = (now * .28 + fx2Hash(j)) % 1; if (ph < .25) continue; const z = (12 + ph * 38) * U, dx = (ph * 18 + Math.sin(now * .9 + j) * 3) * U;
      const s = toScreen(p.x + dx, p.y - dx * .4, z, cw, ch); fx2Img(ctx, S.fumacaEscura, s[0], s[1], (6 + ph * 18) * U * Z, .6 * (1 - ph) * k) }// fumaça por cima
    ctx.restore();
  };
})();
// ---------- fumaça de pneu: nuvem que cresce, se espalha e fica para trás
(function () {
  if (typeof drawSmokeTrail !== "function") return; const base = drawSmokeTrail;
  globalThis.drawSmokeTrail = function (ctx, cw, ch, p, t) {
    if (!fx2Ok(ctx)) return base(ctx, cw, ch, p, t);
    const S = FX2.sp, co = Math.cos(p.h), si = Math.sin(p.h), Z = CAM.z, n = fx2Nivel() >= 2 ? 12 : 6; ctx.save();
    for (let j = 0; j < n; j++) { const ph = (t * 1.3 + j / n) % 1, d = (4 + ph * 46) * CSC, lat = (fx2Hash(j) - .5) * ph * 22 * CSC;
      const s = toScreen(p.x - co * d - si * lat, p.y - si * d + co * lat, (3 + ph * 10) * CSC, cw, ch);
      fx2Img(ctx, S.fumacaClara, s[0], s[1], (9 + ph * 30) * CSC * Z, .6 * (1 - ph) * Math.min(1, ph * 8)) }
    ctx.restore();
  };
})();
// ---------- spray de chuva: véu de água atrás do carro, mais largo e longo com velocidade
(function () {
  if (typeof drawSpray !== "function") return; const base = drawSpray;
  globalThis.drawSpray = function (ctx, cw, ch, p, v, wet) {
    if (!fx2Ok(ctx)) return base(ctx, cw, ch, p, v, wet);
    const k = clamp((v - 22) / 50, 0, 1) * clamp((wet - .28) * 2.2, 0, 1); if (k <= 0) return;
    const S = FX2.sp, co = Math.cos(p.h), si = Math.sin(p.h), Z = CAM.z, t = performance.now() / 1000, n = fx2Nivel() >= 2 ? 14 : 7; ctx.save();
    for (let j = 0; j < n; j++) { const ph = (t * 2.2 + j / n) % 1, d = (8 + ph * 60 * (.6 + .4 * k)) * CSC, lat = (fx2Hash(j + 11) - .5) * (4 + ph * 26) * CSC;
      const s = toScreen(p.x - co * d - si * lat, p.y - si * d + co * lat, (2 + ph * 9) * CSC, cw, ch);
      fx2Img(ctx, S.agua, s[0], s[1], (8 + ph * 22) * CSC * Z, .62 * k * (1 - ph) * Math.min(1, ph * 6)) }
    ctx.restore();
  };
})();
// ---------- eventos no chão (chamados pelo desenho da pista): faíscas, poeira, fumacinha de toque e clarão de batida
FX2.evento = function (ctx, e, s, q, age, Z, cw, ch) {
  if (!fx2Ok(ctx)) return false; const S = FX2.sp, hi = fx2Nivel() >= 2;
  if (e.type === "sparks") {
    if (age > 1.2) return true; ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; const n = hi ? 26 : 12;
    for (let j = 0; j < n; j++) { const h = fx2Hash(j + e.t0 * 13), h2 = fx2Hash(j * 3 + e.t0 * 7), a = h * 6.283, sp = (18 + h2 * 34) * U * Z, life = .35 + h2 * .6; if (age > life) continue;
      const tt = age, x = Math.cos(a) * sp * tt, y0 = Math.sin(a) * sp * tt * .5, z = Math.max(0, (14 * tt - 30 * tt * tt)) * U * Z * 3;
      const px = s[0] + x, py = s[1] + y0 - z, tr = .045, x2 = Math.cos(a) * sp * (tt - tr), z2 = Math.max(0, (14 * (tt - tr) - 30 * (tt - tr) * (tt - tr))) * U * Z * 3;
      const fade = 1 - age / life; ctx.strokeStyle = `rgba(255,${200 + Math.round(h * 55)},${120 + Math.round(h2 * 90)},${fade})`; ctx.lineWidth = (1.2 + h * 1.4) * Math.min(1.6, Z);
      ctx.beginPath(); ctx.moveTo(s[0] + x2, s[1] + Math.sin(a) * sp * (tt - tr) * .5 - z2); ctx.lineTo(px, py); ctx.stroke() }
    fx2Img(ctx, S.brilho, s[0], s[1], 9 * U * Z, .5 * Math.max(0, 1 - age / .4)); ctx.restore(); return true;
  }
  if (e.type === "dust") {
    if (age > 6) return true; ctx.save(); const n = hi ? 10 : 5;
    for (let j = 0; j < n; j++) { const h = fx2Hash(j + e.t0), ph = Math.min(1, age / 6), a = h * 6.283, d = (3 + age * 4 * (.5 + h)) * U * Z;
      fx2Img(ctx, S.poeira, s[0] + Math.cos(a) * d, s[1] - (3 + age * 4 * h) * U * Z + Math.sin(a) * d * .45, (5 + age * 5 * (.6 + h)) * U * Z, .5 * (1 - ph) * Math.min(1, age * 5)) }
    ctx.restore(); return true;
  }
  if (e.type === "puff") {
    if (age > 1.6) return true; const k = age / 1.6; ctx.save();
    for (let j = 0; j < (hi ? 8 : 4); j++) { const a = j * 2.1 + e.t0, p = toScreen(q.x + Math.cos(a) * k * 5 * WS, q.y + Math.sin(a) * k * 5 * WS, (1 + k * 4) * WS, cw, ch);
      fx2Img(ctx, S.fumacaClara, p[0], p[1], (3 + k * 10) * U * Z, .5 * (1 - k)) }
    ctx.restore(); return true;
  }
  return false;
};
// clarão rápido no momento da batida (por cima do desenho normal dos destroços)
FX2.clarao = function (ctx, e, s, age, Z) {
  if (!fx2Ok(ctx) || age > .3) return; ctx.save(); ctx.globalCompositeOperation = "lighter";
  fx2Img(ctx, FX2.sp.clarao, s[0], s[1] - 4 * U * Z, (16 + age * 40) * U * Z, .85 * (1 - age / .3)); ctx.restore();
};
// ---------- o ar: vácuo (corrente de ar puxando o carro de trás) e ar sujo (turbulência atrás do carro da frente)
(function () {
  if (typeof drawTow === "function") { const base = drawTow;
    globalThis.drawTow = function (ctx, cw, ch, p, pa, k, now) {
      if (!fx2Ok(ctx)) return base(ctx, cw, ch, p, pa, k, now);
      const Z = CAM.z, dx = p.x - pa.x, dy = p.y - pa.y, L = Math.hypot(dx, dy); if (L < 8 || L > WS * 45) return;
      const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, n = fx2Nivel() >= 2 ? 30 : 15, x0 = pa.x - ux * 8 * CSC, y0 = pa.y - uy * 8 * CSC;
      const pt = (t, lat, z) => toScreen(x0 + (dx + ux * 8 * CSC) * t + nx * lat, y0 + (dy + uy * 8 * CSC) * t + ny * lat, z, cw, ch);
      ctx.save();
      // volume do vácuo: um túnel de ar claro bem suave
      for (let j = 0; j < 4; j++) { const t = (j + .5) / 4, q = pt(t, 0, 2 * CSC); fx2Img(ctx, FX2.sp.agua, q[0], q[1], (2 + t * 3.2) * WS * Z, .15 * k) }
      // filetes de ar correndo da traseira do carro da frente até o bico do carro de trás
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      for (let j = 0; j < n; j++) { const h = fx2Hash(j + 5), ph = (now * (1.6 + h * .8) + h) % 1, w = (.6 + ph * 1.9) * WS * (fx2Hash(j * 7) - .5) * 2;
        const a = Math.min(1, k * 1.05 * Math.sin(Math.PI * ph)); if (a < .02) continue; const t0 = Math.max(0, ph - .16), z = (1.5 + h) * CSC;
        const A = pt(t0, w * (t0 / Math.max(ph, .01)), z), B = pt(ph, w, z);
        ctx.strokeStyle = `rgba(190,226,255,${a})`; ctx.lineWidth = Math.max(1.2, (1.2 + h * 1.2) * Z); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke() }
      ctx.restore();
    } }
  if (typeof drawDirty === "function") { const base = drawDirty;
    globalThis.drawDirty = function (ctx, cw, ch, p, pa, k, now) {
      if (!fx2Ok(ctx)) return base(ctx, cw, ch, p, pa, k, now);
      const Z = CAM.z, dx = p.x - pa.x, dy = p.y - pa.y, L = Math.hypot(dx, dy); if (L < 8) return;
      const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, n = fx2Nivel() >= 2 ? 12 : 6; ctx.save();
      // bolsões de ar turbulento girando e se desfazendo
      for (let j = 0; j < n; j++) { const h = fx2Hash(j + 21), ph = (now * (.9 + h * .5) + h) % 1, t = .1 + ph * .9;
        const lat = (Math.sin(now * 3.1 + j * 1.7) * 1.1 + (h - .5) * 2.4) * WS * t, x = pa.x + dx * t + nx * lat, y = pa.y + dy * t + ny * lat;
        const q = toScreen(x, y, (2 + ph * 4) * CSC, cw, ch); fx2Img(ctx, FX2.sp.fumacaClara, q[0], q[1], (1.2 + t * 3) * WS * Z, .24 * k * Math.sin(Math.PI * ph)) }
      // redemoinhos: espirais curtas que giram rápido
      ctx.lineCap = "round"; for (let j = 0; j < (n >> 1); j++) { const h = fx2Hash(j + 50), t = .2 + (j + .5) / (n >> 1) * .75, cx = pa.x + dx * t + nx * (h - .5) * 2.4 * WS * t, cy = pa.y + dy * t + ny * (h - .5) * 2.4 * WS * t;
        const c = toScreen(cx, cy, 2.4 * CSC, cw, ch), r = (.7 + t * 1.6) * WS * Z, a0 = now * (5 + h * 4) * (j % 2 ? 1 : -1) + h * 6;
        ctx.strokeStyle = `rgba(245,236,226,${(.25 + .35 * k) * (1 - t * .5)})`; ctx.lineWidth = Math.max(1, .9 * Z); ctx.beginPath();
        for (let s = 0; s <= 10; s++) { const a = a0 + s * .55, rr = r * (1 - s * .07), X = c[0] + Math.cos(a) * rr, Y = c[1] + Math.sin(a) * rr * .5; s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y) } ctx.stroke() }
      ctx.restore();
    } }
})();
