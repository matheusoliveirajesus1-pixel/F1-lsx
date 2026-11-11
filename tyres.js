// ===================== PNEUS POR RODA, ESTOURO, CORRER NA RODA, PAINEL DE DANOS E ESCOLHAS NO BOX =====================
// Cada roda gasta de um jeito: a de fora da curva trabalha mais, as dianteiras sofrem nas freadas e as traseiras na tração.
// O desgaste "geral" do pneu (o que a estratégia já usava) continua o mesmo: as quatro rodas só repartem esse desgaste.
// Quando a roda mais gasta passa do limite, ela pode estourar. Com o pneu furado, o carro anda devagar; depois de ~1,2 km
// a borracha sai e o carro corre na roda (faíscas, estraga o assoalho) e, se insistir demais, a suspensão quebra.
const WK=["FL","FR","RL","RR"],WK_N={FL:"dianteiro esquerdo",FR:"dianteiro direito",RL:"traseiro esquerdo",RR:"traseiro direito"};
function tyreW4(c){const t=c.tyre;if(!t.w4)t.w4=[t.wear,t.wear,t.wear,t.wear];return t.w4}
function tyreStep(c,dt,inc){if(!c.tyre||!running(c))return;const w4=tyreW4(c);const g=R.geo,i=Math.floor(fr(c.prog)*g.N)%g.N,k=g.k[i]||0,v=c.v||0;
  const lat=clamp(v*v*Math.abs(k)/9.81/4,0,1.3);const out=k>0?[0,1,0,1]:[1,0,1,0];const brk=c.acc<-8?clamp(-c.acc/40,0,1):0,trac=c.acc>2&&v<55?clamp(c.acc/12,0,1):0;
  const f=[0,1,2,3].map(j=>1+out[j]*lat*.55+(j<2?brk*.45:trac*.4)+(R.C.cw?(j%2===0?.05:-.05):(j%2===0?-.05:.05)));const m=(f[0]+f[1]+f[2]+f[3])/4;
  for(let j=0;j<4;j++)w4[j]=Math.min(1,w4[j]+inc*f[j]/m);
  {const mean=(w4[0]+w4[1]+w4[2]+w4[3])/4,d=c.tyre.wear-mean;if(d>.0005)for(let j=0;j<4;j++)w4[j]=Math.min(1,w4[j]+d)}// toques e travadas também gastam
  // furado: depois de ~1,2 km, roda no aro (faíscas, assoalho e suspensão sofrem)
  const t=c.tyre;if(t.punct&&!c.pit){t.rimD=(t.rimD||0)+v*dt;if(!c.pitCall&&!R.red)c.pitCall=COMP[t.c].dry?pickDry(Math.max(1,R.L-c.lap)):t.c;
    if(!t.rim&&t.rimD>1200){t.rim=true;if(c.hum||c.isP)radio(c,"A borracha saiu! Estou andando na roda!",{pause:!!c.isP});bubble(c,"Na roda! Faíscas!","bad",3)}
    if(t.rim){/* na roda: o piloto limita a velocidade (alvo em race.js), e o eixo perde aderência em axleK */c.dmg.floor=Math.min(1,(c.dmg.floor||0)+dt*.004);if(vrnd()<dt*6)R.fxq.push({type:"sparks",f:fr(c.prog),lat:c.y||0,t0:R.t});
      if(t.rimD>Math.max(8000,R.geo.len*1.6+2000)&&!c.parked&&rnd()<dt*.5){mechFail(c,`Suspensão quebrada (correu demais na roda)`);}}}}
// fim de cada volta: a roda mais gasta pode estourar (em velocidade, pode tirar o carro da pista)
function tyreBlowCheck(c){if(!c.tyre||c.tyre.punct||c.pit)return false;const w4=tyreW4(c);let j=0;for(let q=1;q<4;q++)if(w4[q]>w4[j])j=q;const mx=w4[j];
  if(mx<.95||rnd()>=(mx-.94)*2)return true;// sem estouro (true = já tratado aqui)
  const t=c.tyre;t.punct=true;t.pw=j;recalc(c);const nm=WK_N[WK[j]];rcMsg(`${c.code}: o pneu ${nm} estourou!`,"bad");hlight("spin",[c],`Pneu de ${c.code} estoura`,c.isP?3:2);
  if(c.hum)radio(c,`ESTOUROU O PNEU ${nm.toUpperCase()}! Vou para o box!`,{pause:true});else if(typeof tvRadio==="function")tvRadio(c,"crash",2);
  if(c.v>55&&typeof exStart==="function"&&rnd()<(j<2?.35:.5))exStart(c,j<2?"off":"spin");
  if(!c.pitCall)c.pitCall=COMP[c.tyre.c].dry?pickDry(R.L-c.lap):c.tyre.c;return true}
// desgaste mostrado no painel (agora é o desgaste real de cada roda)
function wheelWear(c){const t=c.tyre;if(t&&t.w4)return{FL:t.w4[0],FR:t.w4[1],RL:t.w4[2],RR:t.w4[3]};const w=t.wear,s=R.C.cw?1:-1;return{FL:clamp(w*(1+.08*s),0,1),FR:clamp(w*(1-.08*s),0,1),RL:clamp(w*(1+.08*s),0,1),RR:clamp(w*(1-.08*s),0,1)}}
// ---------- painel de danos: o carro visto de cima, peça por peça
function dmgList(c){const d=c.dmg||{};const L=[];const p=(v,n)=>{if(v>=.08)L.push([v,n])};
  p(d.wingL||0,"asa diant. esq.");p(d.wingR||0,"asa diant. dir.");p(d.nose||0,"bico");p(d.rwing||0,"asa traseira");p(d.floor||0,"assoalho");p(d.side||0,"lateral");p(d.cool||0,"radiador");
  (d.whl||[]).forEach((v,i)=>p(v,"suspensão "+WK_N[WK[i]].replace("dianteiro","diant.").replace("traseiro","tras.").replace("esquerdo","esq.").replace("direito","dir.")));p(d.power||0,"motor");p(d.gear||0,"câmbio");
  if(c.tyre&&c.tyre.punct)L.push([1,c.tyre.rim?"correndo na roda":"pneu furado"]);if(d.loose)L.push([.6,"peça solta"]);return L.sort((a,b)=>b[0]-a[0])}
function drawCarStatus(c){const cv=$("#hCarCv");if(!cv||!c)return;const ctx=cv.getContext("2d"),k=cv.width/110;ctx.setTransform(k,0,0,k,0,0);ctx.clearRect(0,0,110,132);
  const ok="#2BD46E",col=v=>v<.12?ok:v<.5?"#FFD400":"#FF4D4F";const d=c.dmg||{};const ww=wheelWear(c);const whl=d.whl||[0,0,0,0];const blink=Math.floor(performance.now()/300)%2;
  const rr=(x,y,w,h,r,fill)=>{ctx.fillStyle=fill;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.fill()};
  rr(33,12,21,6,2,col(Math.max(d.wingL||0,(d.wing||0)*.8)));rr(56,12,21,6,2,col(Math.max(d.wingR||0,(d.wing||0)*.8)));// asa dianteira (dois lados)
  ctx.fillStyle=col(d.nose||0);ctx.beginPath();ctx.moveTo(51,18);ctx.lineTo(59,18);ctx.lineTo(61,44);ctx.lineTo(49,44);ctx.fill();// bico
  rr(41,44,28,46,8,col(d.floor||0));// assoalho
  rr(37,52,6,26,3,col(Math.max(d.side||0,d.cool||0)));rr(67,52,6,26,3,col(Math.max(d.side||0,d.cool||0)));// laterais e radiadores
  rr(50,50,10,10,5,"#0B0D12");rr(51,62,8,30,3,col(d.power?.9:0));rr(50,92,10,12,2,col(d.gear||0));rr(36,106,38,6,2,col(d.rwing||0));
  [[38,33,44,46],[72,33,66,46],[37,93,44,86],[73,93,66,86]].forEach(([a,b,c2,e],i)=>{ctx.strokeStyle=col(Math.max(whl[i]||0,(d.susp||0)*.5));ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c2,e);ctx.stroke()});
  const wcol=v=>v<.4?"#21C55D":v<.65?"#FFD400":v<.82?"#FF8A00":"#FF4D4F";const pw=c.tyre&&c.tyre.punct?(c.tyre.pw??-1):-2;
  [["FL",28,24],["FR",72,24],["RL",27,84],["RR",73,84]].forEach(([n,x,y],i)=>{if(d.off===i){ctx.strokeStyle="#FF4D4F";ctx.setLineDash([2,2]);ctx.strokeRect(x,y,10,18);ctx.setLineDash([]);return}
    rr(x,y,10,18,3,pw===i||(pw===-1&&i>=2)?(blink?"#FF4D4F":"#3A0D0D"):wcol(ww[n]))});
  if(c.brakeHot){ctx.fillStyle="#FF8A00";[[33,33],[77,33]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,2.5,0,7);ctx.fill()})}
  if(d.loose&&blink){ctx.fillStyle="#FF8A00";ctx.beginPath();ctx.arc(55,30,4,0,7);ctx.fill()}
  ctx.font="700 9px 'Roboto Mono',monospace";ctx.textAlign="center";ctx.fillStyle="#EEF1F5";
  [["FL",12,36],["FR",98,36],["RL",12,96],["RR",98,96]].forEach(([n,x,y])=>{ctx.strokeStyle=wcol(ww[n]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-3,9.5,0,7);ctx.stroke();ctx.fillText(Math.round(ww[n]*100)+"%",x,y)});
  const L=dmgList(c);setT("hCarTxt",L.length?`⚠ ${L.slice(0,2).map(x=>x[1]+(x[0]<1?" "+Math.round(x[0]*100)+"%":"")).join(" · ")}`:`${TYRES[c.tyre.c].n} · ${c.tyre.age}v · ${Math.round(c.tyre.temp)}°C`)}
// ---------- escolhas no box: trocar o bico ou não, ajustar a asa, parada dupla
const PX_WING=[[-2,"−2"],[-1,"−1"],[0,"0"],[1,"+1"],[2,"+2"]];
function pxOpt(c){if(!c.pitOpt)c.pitOpt={nose:"auto",wing:0};return c.pitOpt}
function noseNeeded(c){const d=c.dmg||{};return(d.wing||0)>=.3||(d.nose||0)>=.25||(d.wingL||0)>=.35||(d.wingR||0)>=.35}
function pxAction(a,k){const me=R&&R.cars.find(c=>c.isP);if(!me)return;const o=pxOpt(me);
  if(a==="pxNose"){o.nose=k==="no"?"no":"auto";radio(me,o.nose==="no"?"Se pararmos, não troquem o bico: só pneus.":"Se o bico estiver quebrado, troquem na parada.",{me:1})}
  if(a==="pxWing"){o.wing=clamp(+k||0,-2,2);radio(me,o.wing?`Na parada, ${o.wing>0?"mais":"menos"} asa: ${o.wing>0?"+":""}${o.wing}.`:"Asa como está.",{me:1})}
  if(a==="pxDbl"){const mt=R.cars.find(c=>c!==me&&c.t===me.t&&running(c)&&!c.hum);if(!mt){radio(me,"O companheiro não está mais na corrida.",{me:1});return}
    if(mt.pit){radio(me,`${mt.code} já está no pit lane.`,{me:1});return}const comp=R.w>.45?(R.w>.78?"W":"I"):pickDry(R.L-mt.lap);mt.pitCall=comp;
    if(!me.pitCall)cmdBox(R.w>.45?(R.w>.78?"W":"I"):pickDry(R.L-me.lap));radio(me,`Parada dupla! ${mt.code} entra logo depois de você: ele perde um pouco esperando.`,{me:1})}
  pxRefresh()}
function pxRefresh(){const me=R&&R.cars.find(c=>c.isP);if(!me)return;const o=pxOpt(me);
  document.querySelectorAll("[data-act=pxNose]").forEach(b=>b.classList.toggle("on",b.dataset.k===o.nose));document.querySelectorAll("[data-act=pxWing]").forEach(b=>b.classList.toggle("on",+b.dataset.k===o.wing));
  const el=$("#pxinfo");if(el){const nn=noseNeeded(me);const t=nn&&o.nose!=="no"?"Troca de bico: +7,5 s na parada.":nn?"Bico quebrado, mas você escolheu manter.":"";if(el.textContent!==t)el.textContent=t}}
// chamados pelo pit stop
function pxExtraTime(c){const o=pxOpt(c);let t=0,note="";if(noseNeeded(c)&&(o.nose!=="no"||!c.isP)){t+=7.5;note="troca de bico (+7,5s)"}if(o.wing&&c.isP){t+=.4;note+=(note?", ":"")+"ajuste de asa"}return{t,note}}
function pxService(c){const o=pxOpt(c);const keepNose=c.isP&&o.nose==="no";if(c.isP&&o.wing&&c.ph){c.ph.cl*=1+.014*o.wing;c.ph.cd*=1+.009*o.wing;c.wingAdj=(c.wingAdj||0)+o.wing;o.wing=0;radio(c,`Asa ajustada (${c.wingAdj>0?"+":""}${c.wingAdj}): ${c.wingAdj>0?"mais aderência nas curvas, menos velocidade na reta":"mais velocidade na reta, menos aderência nas curvas"}.`)}
  return keepNose}
