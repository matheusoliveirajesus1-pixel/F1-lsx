// ===================== PUNIÇÕES: TUDO POR PROVA, IGUAL PARA TODOS (regulamento da FIA) =====================
// Nada de sorteio na decisão: os comissários olham o que foi medido (velocidade, posição, trajetória, quem estava à frente).
// As mesmas regras valem para o jogador e para a IA: superlicença (12 pontos em 12 meses = suspensão), advertências do ano
// (5 advertências, 4 delas de pilotagem = 10 posições no grid), limites de pista (4ª vez = 5 s), bandeira azul, safety car.
// Cumprimento como na F1: 5 s e 10 s na próxima parada (a equipe só mexe no carro depois do tempo); drive-through e
// stop-and-go de 10 s em até 3 voltas (não vale sob safety car); dado nas últimas voltas ou depois da bandeirada vira tempo
// (20 s e 30 s); quem não cumpre leva bandeira preta. Cada decisão entra no relatório dos comissários com o motivo.

// ---------- registro (relatório dos comissários)
function stewReport(c,verdict,why,ev){if(!R)return;R.stewRep=R.stewRep||[];R.stewRep.push({lap:Math.max(1,(R.lead||0)+1),code:c?c.code:"?",id:c?c.id:null,me:!!(c&&c.isP),verdict,why,ev:ev||""});if(R.stewRep.length>80)R.stewRep.shift()}

// ---------- superlicença: pontos valem 12 meses (um calendário); 12 pontos = suspensão da próxima corrida
function licOf(d){if(!d)return[];if(d.me)return G.lic=G.lic||[];return d.lic=d.lic||[]}
function licPtsOf(d){const n=G.calendar.length;return licOf(d).filter(x=>(G.season-x.s)*n+(G.round-x.r)<n).reduce((a,x)=>a+x.pts,0)}
function licAdd(d,pts,why){if(!d||!pts||!G||G.mp||(R&&R.mp))return;licOf(d).push({pts,s:G.season,r:G.round,why:why||""});const tot=licPtsOf(d);
  if(R)rcMsg(`${d.code} recebe ${pts} ponto${pts>1?"s":""} na superlicença (total ${tot} de 12).`,"","superlicenca");
  if(tot>=12){if(d.me){G.ban=true;G.lic=[]}else{d.ban=true;d.lic=[]}if(R)rcMsg(`${d.code} chegou a 12 pontos na superlicença: está suspenso da próxima corrida.`,"bad","superlicenca");if(typeof news==="function")news(`${d.code} é suspenso: 12 pontos na superlicença.`,"bad")}}

// ---------- advertências do ano: 5 advertências, pelo menos 4 de pilotagem = 10 posições no grid da próxima corrida
function repOf(d){if(!d.repS||d.repS.s!==G.season)d.repS={s:G.season,n:0,drv:0};return d.repS}
function repAdd(c,why,driving){const d=c&&c.d;if(!d||!G||G.mp||(R&&R.mp))return;const r=repOf(d);r.n++;if(driving)r.drv++;if(d.me)G.reprimands=r.n;
  rcMsg(`Comissários: advertência para ${c.code} por ${why} (${r.n}ª do ano).`,"","punicao");stewReport(c,"Advertência",why);
  if(c.hum)radio(c,`${G.engineer||"Engenheiro"}: "Advertência dos comissários: ${why}. É a ${r.n}ª do ano; na 5ª perdemos 10 posições no grid."`,{k:"punicao"});
  if(r.n>=5&&r.drv>=4){d.gridPen=(d.gridPen||0)+10;r.n=0;r.drv=0;if(d.me)G.reprimands=0;rcMsg(`${c.code} chegou à 5ª advertência do ano: perde 10 posições no grid da próxima corrida.`,"warn","punicao")}}

// ---------- drive-through e stop-and-go (cumpridos no pit lane em até 3 voltas)
function penDrive(c,kind,why,lic,ev){const nm=kind==="dt"?"drive-through":"stop-and-go de 10 s";
  if(!running(c)){if(c.d&&c.status==="dnf"){const n=kind==="dt"?3:5;c.d.gridPen=(c.d.gridPen||0)+n;rcMsg(`${c.code} não está mais na corrida: o ${nm} vira ${n} posições no grid da próxima etapa.`,"warn","punicao");stewReport(c,`${n} posições no grid`,why,ev)}if(lic&&c.d)licAdd(c.d,lic,why);return}
  if(R.finishing||R.L-c.lap<3){const s=kind==="dt"?20:30;penalize(c,s,`${why} (${nm} nas últimas voltas, convertido em ${s} s)`,lic,ev);return}
  c.penDue={kind,why,by:c.lap+3,t:R.t};R.nPen=(R.nPen||0)+1;if(lic&&c.d)licAdd(c.d,lic,why);
  rcMsg(`${c.code}: ${nm} por ${why}. Cumprir em até 3 voltas.`,"warn","punicao");stewReport(c,nm[0].toUpperCase()+nm.slice(1),why,ev);
  if(c.hum)radio(c,`${G.engineer||"Engenheiro"}: "${nm[0].toUpperCase()+nm.slice(1)} por ${why}. Vamos cumprir na próxima volta, sem trocar pneu."`,{pause:true,k:"punicao"})}

// ---------- fiscalização a cada passo
function penTick(dt){if(!R||!R.started||R.over)return;const L=R.geo.len;
  for(const c of R.cars){if(!running(c))continue;
    // drive-through / stop-and-go: vai ao box na primeira oportunidade (não vale sob safety car); passou do prazo = bandeira preta
    const P=c.penDue;if(P){if(R.sc||R.red)P.by=Math.max(P.by,c.lap+2);if(!c.pit&&!R.sc&&!R.red&&!c.penStop){c.penStop=true;c.pitCall=c.tyre.c}
      if(!c.pit&&c.lap>P.by){c.penDue=null;c.status="dsq";c.why=`bandeira preta (não cumpriu o ${P.kind==="dt"?"drive-through":"stop-and-go"})`;rcMsg(`BANDEIRA PRETA para ${c.code}: não cumpriu a punição. Desclassificado.`,"bad","punicao");stewReport(c,"Bandeira preta",c.why);makeWreck(c,"stop")}}
    // excesso de velocidade no pit lane (medido): 5 s na corrida
    if(c.pit&&(c.pit.phase==="in"||c.pit.phase==="out")&&!c.pit.red&&c.pit.s>60&&c.pit.s<R.pitLane.D-25){if((c.v||0)>PIT_LIM+.45)c.pit.spd=Math.max(c.pit.spd||0,c.v)}/* entre as linhas de velocidade (60 m depois da entrada, 25 m antes da saída) */
    else if(c._lastPit&&c._lastPit.spd&&!c._lastPit.done){c._lastPit.done=1;const kmh=Math.round((c._lastPit.spd-PIT_LIM)*3.6);if(kmh>=1)penalize(c,5,`excesso de velocidade no pit lane (${kmh} km/h acima)`,0,`velocidade máxima medida ${Math.round(c._lastPit.spd*3.6)} km/h`)}
    if(c.pit)c._lastPit=c.pit;
    // bandeira azul ignorada: o retardatário segura quem vai lhe dar uma volta (medido pelo tempo colado)
    if(c.blue&&!R.sc){let lap=null;for(const o of R.phys||[]){if(o===c||o.prog-c.prog<.6)continue;let d=fr(c.prog)*L-fr(o.prog)*L;if(d<0)d+=L;if(d<Math.max(25,(o.v||40)*1.1)){lap=o;break}}
      const yielding=c.blueSide&&Math.abs((c.y||0)-c.blueSide.s*5.6)<2.6;/* abrindo para o lado escolhido = obedecendo */
      if(lap&&!yielding){c.blueT=(c.blueT||0)+dt;if(c.blueT>10&&!c.blueW){c.blueW=1;rcMsg(`Bandeira azul agitada para ${c.code}: deixe ${lap.code} passar.`,"warn","bandeiras");if(c.hum)radio(c,"Bandeira azul agitada! Abre para o líder.",{k:"bandeiras"})}
        if(c.blueT>20){c.blueT=-25;c.blueW=0;penalize(c,5,"ignorar bandeiras azuis",1,`segurou ${lap.code} por mais de 20 s`)}}}
    else if((c.blueT||0)>0){c.blueT=Math.max(0,c.blueT-dt*2);if(c.blueT===0)c.blueW=0}
    // prancha do assoalho (só quem baixou o carro abaixo do sugerido): o desgaste é calculado pelas voltas
    if(c.plankK>0&&c.lap!==c._plL){c._plL=c.lap;c.plankW=c.plankK*1.6*c.lap/Math.max(1,R.C.laps);if(c.plankW>.7&&!c._plMsg&&c.hum){c._plMsg=1;radio(c,`${G.engineer||"Engenheiro"}: "A prancha do assoalho está gastando rápido com o carro baixo. Se passar do limite somos desclassificados na vistoria."`,{k:"motor"})}}}}
(function(){if(typeof looseTick!=="function")return;const base=looseTick;globalThis.looseTick=function(){base();try{penTick(SIM_DT)}catch(e){console.warn("pen",e)}}})();

// ---------- ultrapassagem sob safety car / VSC: tem que devolver (ou leva 5 s)
(function(){if(typeof completePass!=="function")return;const base=completePass;
  globalThis.completePass=function(B,A){if(R.sc&&running(A)&&!A.pit&&!B.pit&&R.t-(B.pitExit||-99)>12&&R.t-(A.pitExit||-99)>3&&!A.ex&&!B.ex&&Math.abs(A.y||0)<TRK_H+.8&&!(A.emergT>R.t)&&!(A.dmg&&(A.dmg.wing>=.3||A.dmg.rwing||A.dmg.floor>.3||A.dmg.susp>=.3))&&(A.v||0)>8/* passar carro com dano, desviando ou quase parado é permitido */&&!(A.lose>0)&&!A.vis&&!B.unlap&&!A.unlap&&!(A.dmg&&(A.dmg.punct||A.dmg.off>=0))&&R.started&&!B.gb){base(B,A);if(typeof advGain==="function")advGain(B,A,"sc");return}return base(B,A)}})();

// ---------- suspensão também para a IA: o reserva corre no lugar dela nessa etapa
(function(){if(typeof startWeekend!=="function")return;const base=startWeekend;
  globalThis.startWeekend=function(){const subs=[];if(G&&!G.mp&&G.teams){const used=new Set();for(const t of G.teams){t.drivers.forEach((id,i)=>{const d=G.drivers[id];if(!d||d.me||d.hum||!d.ban)return;
        const rs=Object.values(G.drivers).filter(x=>!x.team&&!x.me&&!used.has(x.id)).sort((a,b)=>ovr(b)-ovr(a))[0];if(!rs)return;used.add(rs.id);t.drivers[i]=rs.id;rs.team=t.id;subs.push({t:t.id,i,orig:id,rs:rs.id})})}}
    G.penSubs=subs;const r=base.apply(this,arguments);if(subs.length&&W){W.subs=subs;W.puNotes=(W.puNotes||[]);for(const s of subs)W.puNotes.push(`${G.drivers[s.orig].code} está suspenso (12 pontos na superlicença): ${G.drivers[s.rs].n} corre no lugar.`)}return r}})();
function penRestoreSubs(){if(!G||!G.penSubs||!G.penSubs.length)return;for(const s of G.penSubs){const t=G.teams.find(x=>x.id===s.t);if(!t)continue;const rs=G.drivers[s.rs],d=G.drivers[s.orig];if(t.drivers[s.i]===s.rs)t.drivers[s.i]=s.orig;if(rs)rs.team=null;if(d)d.ban=false}G.penSubs=[]}
(function(){if(typeof afterRace!=="function")return;const base=afterRace;globalThis.afterRace=function(res){const r=base.apply(this,arguments);try{penRestoreSubs()}catch(e){}return r}})();

// ---------- tela: relatório dos comissários no resultado
function stewCard(){const L=(R&&R.stewRep)||[];if(!L.length)return"";const mine=L.filter(x=>x.me),rest=L.filter(x=>!x.me);
  const row=x=>`<div class="kv"><span><b>V${x.lap} · ${esc(x.code)}</b> ${esc(x.why)}${x.ev?` <small class="muted">(${esc(x.ev)})</small>`:""}</span><b class="${/Sem|Revogada|Incidente/.test(x.verdict)?"":"num"}">${esc(x.verdict)}</b></div>`;
  return`<div class="card" style="grid-column:1/-1"><h3>Relatório dos comissários</h3>${mine.length?`<h4 class="ag">Você</h4>${mine.map(row).join("")}`:""}${rest.length?`<h4 class="ag">Outros pilotos</h4>${rest.slice(-14).map(row).join("")}`:""}</div>`}
