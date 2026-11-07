// ===================== ENGENHARIA E PATROCINADORES =====================
// ---------- reunião técnica: você lê os dados, aponta onde o carro perde tempo e escolhe o próximo projeto
const TA={eng:"Retas (motor e arrasto)",aero:"Curvas de alta (aerodinâmica)",chas:"Curvas lentas e tração (chassi)",brk:"Freadas (freios)",susp:"Desgaste dos pneus (suspensão)",rel:"Confiabilidade"};
const TA_S={eng:"retas",aero:"curvas de alta",chas:"curvas lentas",brk:"freadas",susp:"pneus",rel:"confiabilidade"};
const TIME_AREAS=["eng","aero","chas","brk"];
const DEVP=[
 {id:"floor",area:"aero",n:"Assoalho novo",d:"Mais pressão aerodinâmica nas curvas de alta",gain:1.25,eta:3,risk:.28},
 {id:"fwing",area:"aero",n:"Asa dianteira revisada",d:"Carro mais equilibrado nas curvas rápidas",gain:.8,eta:2,risk:.14},
 {id:"lowdrag",area:"eng",n:"Asa traseira de baixo arrasto e mapa de energia",d:"Mais velocidade no fim das retas",gain:.9,eta:2,risk:.15},
 {id:"cool",area:"eng",n:"Arrefecimento mais compacto",d:"Menos arrasto e mais potência utilizável",gain:1.15,eta:3,risk:.25},
 {id:"rsusp",area:"chas",n:"Suspensão traseira e difusor",d:"Mais tração na saída das curvas lentas",gain:1.1,eta:3,risk:.24},
 {id:"weight",area:"chas",n:"Programa de redução de peso",d:"Chassi mais leve e mais rígido",gain:.7,eta:2,risk:.1},
 {id:"brakes",area:"brk",n:"Pinças e dutos de freio novos",d:"Freadas mais curtas e estáveis",gain:1.2,eta:2,risk:.12},
 {id:"geo",area:"susp",n:"Geometria de suspensão para os pneus",d:"Menos desgaste e temperatura sob controle",gain:1.3,eta:2,risk:.15},
 {id:"relp",area:"rel",n:"Programa de confiabilidade",d:"Menos quebras de câmbio, motor e hidráulica",gain:1.9,eta:2,risk:.05}];
const TECHG={};
function techGeo(id){if(!TECHG[id]){const g=buildCircuit(id);calibrate(g);TECHG[id]=g}return TECHG[id]}
function lapProf(geo,car){return speedProfile(geo,carPhys({car},null),tyreMu("M",0,.2,null),4,geo.gk)}
function nextTrackId(){return G.calendar[Math.min(G.round,G.calendar.length-1)]}
function devRoom(v){return clamp((99-v)/16,.3,1)}
// relatório: compara o seu carro com o mais rápido do grid na próxima pista
function techReport(){const t=myTeam(),id=nextTrackId(),geo=techGeo(id),N=geo.N;const our=lapProf(geo,t.car);
  const others=G.teams.filter(x=>x!==t).map(x=>({t:x,p:lapProf(geo,x.car)})).sort((a,b)=>a.p.t-b.p.t);
  let refCar=others[0].t.car,refName=others[0].t.n,ref=others[0].p,leader=false;
  if(our.t<ref.t){leader=true;refCar={};for(const k of Object.keys(TA))refCar[k]=Math.max(...G.teams.filter(x=>x!==t).map(x=>x.car[k]));refName="o melhor de cada área no grid";ref=lapProf(geo,refCar)}
  const dt={};for(const k of TIME_AREAS)dt[k]=our.t-lapProf(geo,{...t.car,[k]:refCar[k]}).t;
  const wear=(1.32-t.car.susp/250)/(1.32-refCar.susp/250)-1,fail=(1.55-t.car.rel/100)/(1.55-refCar.rel/100)-1;
  const v=ref.v,vo=our.v;let top=0,topO=0;for(let i=0;i<N;i++){top=Math.max(top,v[i]);topO=Math.max(topO,vo[i])}
  const minNear=(arr,i)=>{let m=1e9,mi=i;for(let j=-24;j<=24;j++){const q=(i+j+N)%N;if(arr[q]<m){m=arr[q];mi=q}}return[m,mi]};
  const cs=geo.corners.map(c=>{const[m,mi]=minNear(v,c.i);const[mo]=minNear(vo,c.i);let st=mi,k=0;while(k<120&&v[(st-1+N)%N]>=v[st]){st=(st-1+N)%N;k++}let sto=mi;k=0;while(k<120&&vo[(sto-1+N)%N]>=vo[sto]){sto=(sto-1+N)%N;k++}
    const dist=((mi-st+N)%N)*DS,disto=((mi-sto+N)%N)*DS;const dec=dist>8?(v[st]**2-m*m)/(2*dist)/9.81:0,deco=disto>8?(vo[sto]**2-mo*mo)/(2*disto)/9.81:0;return{n:c.n,m,mo,drop:v[st]-m,dec,deco}}).filter(c=>c.m<top*.95);
  const fast=cs.slice().sort((a,b)=>b.m-a.m)[0],slow=cs.slice().sort((a,b)=>a.m-b.m)[0],brake=cs.slice().sort((a,b)=>b.drop-a.drop)[0];
  const worst=TIME_AREAS.slice().sort((a,b)=>dt[b]-dt[a])[0];
  return{track:id,refName,leader,our:our.t,ref:ref.t,dt,wear,fail,worst,
    tel:{top:[top*3.6,topO*3.6],fast:fast&&{n:fast.n,v:[fast.m*3.6,fast.mo*3.6]},slow:slow&&{n:slow.n,v:[slow.m*3.6,slow.mo*3.6]},brake:brake&&{n:brake.n,g:[brake.dec,brake.deco]}}}}
// quanto um projeto rende de verdade na próxima pista
function devEstimate(p,eff){const t=myTeam(),g=p.gain*(eff||1)*devRoom(t.car[p.area]);
  if(TIME_AREAS.includes(p.area)){const geo=techGeo(nextTrackId());const a=lapProf(geo,t.car).t,b=lapProf(geo,{...t.car,[p.area]:t.car[p.area]+g}).t;return{g,txt:`≈ ${(a-b).toFixed(2).replace(".",",")} s por volta`}}
  if(p.area==="susp"){const w0=1.32-t.car.susp/250,w1=1.32-(t.car.susp+g)/250;return{g,txt:`${Math.round((1-w1/w0)*100)}% menos desgaste dos pneus`}}
  const f0=1.55-t.car.rel/100,f1=1.55-(t.car.rel+g)/100;return{g,txt:`${Math.round((1-f1/f0)*100)}% menos risco de quebra`}}
function devOptions(rep,guess){const pickA=a=>DEVP.filter(p=>p.area===a);const out=[];const add=p=>{if(p&&!out.includes(p))out.push(p)};
  add(pick(pickA(rep.worst)));if(guess&&guess!==rep.worst)add(pick(pickA(guess)));else add(pickA(rep.worst).find(p=>!out.includes(p)));
  const extra=rep.wear>.02?"susp":rep.fail>.05?"rel":pick(["susp","rel"]);add(pick(pickA(extra)));
  for(const p of DEVP.slice().sort(()=>rnd()-.5)){if(out.length>=3)break;add(p)}return out.slice(0,3)}
function meetingAvailable(){return G.round<G.calendar.length&&!G.dev&&G.meetRound!==G.season*100+G.round}
function devStart(p,eff,overridden){const t=myTeam();G.dev={id:p.id,area:p.area,n:p.n,gain:p.gain,eta:p.eta,eta0:p.eta,risk:p.risk,eff,team:t.id,from:G.round};G.meetRound=G.season*100+G.round;
  const arrive=CIR[G.calendar[Math.min(G.calendar.length-1,G.round+p.eta)]];news(`${overridden?"O diretor técnico decidiu":"Projeto aprovado"}: ${p.n}. A peça deve estrear ${arrive?"no "+arrive.gp:"no fim do ano"}.`);save()}
function devAfterRace(){const d=G.dev;if(!d)return;const t=myTeam();if(d.team!==t.id){G.dev=null;return}d.eta--;if(d.eta>0)return;
  const ok=rnd()>d.risk;const g=+(d.gain*d.eff*devRoom(t.car[d.area])*(ok?1:.25)).toFixed(2);t.car[d.area]=clamp(+(t.car[d.area]+g).toFixed(2),55,99);if(d.id){t.inst=t.inst||[];if(!t.inst.includes(d.id))t.inst.push(d.id)}
  G.devLog=G.devLog||[];G.devLog.unshift({n:d.n,area:d.area,g,ok,s:G.season,r:G.round});if(G.devLog.length>12)G.devLog.pop();
  news(ok?`Atualização instalada: ${d.n}. Os dados confirmam o ganho nas ${TA_S[d.area]}.`:`${d.n} chegou, mas não funcionou como no túnel de vento: ganho bem menor que o esperado.`,ok?"good":"warn");
  if(ok)G.trust=clamp(G.trust+1,0,100);G.dev=null}

// ---------- patrocinadores pessoais (marcas fictícias)
const SPONS=[
 {id:"carga",n:"Carga Express",sec:"logística",c:"#FF8A00",minPop:6,pay:.008,heatMax:60,goal:"finish"},
 {id:"voltix",n:"Voltix Energy",sec:"bebida energética",c:"#B8FF2E",minPop:12,pay:.012,heatMax:85,goal:"points",loves:"polemico"},
 {id:"rush",n:"Rush Games",sec:"games e streaming",c:"#9B5DE5",minPop:18,pay:.014,heatMax:80,goal:"followers",loves:"emocional"},
 {id:"aeris",n:"Aeris Audio",sec:"fones de ouvido",c:"#00C2FF",minPop:24,pay:.018,heatMax:65,goal:"top5"},
 {id:"brava",n:"Brava",sec:"moda",c:"#F15BB5",minPop:30,pay:.022,heatMax:70,goal:"posts",loves:"confiante"},
 {id:"solaris",n:"Solaris",sec:"energia solar",c:"#FFC300",minPop:34,pay:.024,heatMax:45,goal:"respect",minRep:30},
 {id:"nimbus",n:"Nimbus Bank",sec:"banco digital",c:"#3A86FF",minPop:45,pay:.034,heatMax:40,goal:"top5",minRep:35},
 {id:"tempora",n:"Tempora",sec:"relógios de luxo",c:"#C9A227",minPop:58,pay:.05,heatMax:35,goal:"podium",minRep:50}];
const SPG={finish:{n:"Terminar corridas",d:n=>`Terminar ${n} corridas`},points:{n:"Pontos",d:n=>`Marcar pontos em ${n} corridas`},top5:{n:"Top 5",d:n=>`Terminar ${n} vez${n>1?"es":""} no top 5`},podium:{n:"Pódio",d:n=>`Subir ao pódio ${n} vez${n>1?"es":""}`},
  followers:{n:"Seguidores",d:n=>`Ganhar ${fmtK(n)} seguidores`},posts:{n:"Posts",d:n=>`Publicar ${n} posts patrocinados`},respect:{n:"Imagem",d:n=>`Manter o respeito acima de ${n}`}};
function spInit(){G.sponsors=G.sponsors||[];G.spOffers=G.spOffers||[];G.spGone=G.spGone||{}}
function spPayRace(s){return +(s.pay*(1+G.fame.pop/60)).toFixed(3)}
function spGoalTarget(s,races){const exp=expectedPos();const g=s.goal;
  if(g==="finish")return Math.max(2,Math.round(races*.6));if(g==="points")return Math.max(1,Math.round(races*(exp<=10?.5:.25)));if(g==="top5")return Math.max(1,Math.round(races*(exp<=5?.4:.12)));
  if(g==="podium")return 1;if(g==="followers")return Math.round(G.fame.followers*.12/1000)*1000||2000;if(g==="posts")return Math.max(2,Math.round(races/3));return Math.max(20,Math.round(Math.min(G.fame.rep,70)-8))}
function spMakeOffer(s){const left=G.calendar.length-G.round;const races=clamp(ri(6,12),3,Math.max(3,left));const pay=spPayRace(s);const tgt=spGoalTarget(s,races);
  return{id:s.id,races,pay,goal:s.goal,tgt,bonus:+(pay*races*.6).toFixed(3),heatMax:s.heatMax,exp:G.round+3,s:G.season}}
function spRefresh(){spInit();const left=G.calendar.length-G.round;if(left<3)return;G.spOffers=G.spOffers.filter(o=>o.s===G.season&&o.exp>G.round);
  if(G.sponsors.length+G.spOffers.length>=4)return;
  const pool=SPONS.filter(s=>G.fame.pop>=s.minPop&&(G.fame.rep>=(s.minRep||0))&&(G.heat||0)<s.heatMax&&!G.sponsors.some(x=>x.id===s.id)&&!G.spOffers.some(x=>x.id===s.id)&&!((G.spGone[s.id]||-99)>G.season*100+G.round-6));
  if(!pool.length)return;const s=pool.sort((a,b)=>b.minPop-a.minPop)[rnd()<.6?0:ri(0,pool.length-1)];if(G.sponsors.length===0||rnd()<.45){G.spOffers.push(spMakeOffer(s));news(`Proposta de patrocínio pessoal: ${s.n} (${s.sec}). Veja na aba Carreira.`,"good")}}
function spAccept(i){spInit();const o=G.spOffers[i];if(!o||G.sponsors.length>=3)return;G.spOffers.splice(i,1);
  G.sponsors.push({...o,left:o.races,prog:0,sat:60,f0:G.fame.followers,warned:false,from:G.round});const s=SPONS.find(x=>x.id===o.id);
  post("me",`Muito feliz em anunciar minha parceria com a ${s.n}! Bora pra cima 🤝`,{likes:Math.round(G.fame.followers*rr(.015,.04))});fameAdd(.5,-.2);news(`Você assinou com a ${s.n}: ${moneyS(o.pay)} por corrida durante ${o.races} corridas.`,"good");save()}
function spDecline(i){spInit();const o=G.spOffers[i];if(!o)return;G.spOffers.splice(i,1);G.spGone[o.id]=G.season*100+G.round;save()}
function spPosted(id){spInit();const s=G.sponsors.find(x=>x.id===id);if(!s)return;s.sat=clamp(s.sat+12,0,100);s.posted=(s.posted||0)+1;if(s.goal==="posts")s.prog++}
// cada corrida: cachê, metas, cláusula de imagem e fim de contrato
function spAfterRace(res,e){spInit();const B=SPONS.reduce((m,s)=>(m[s.id]=s,m),{});const heat=G.heat||0;let paid=0;
  for(const s of G.sponsors.slice()){const b=B[s.id];paid+=s.pay;G.money+=s.pay;s.left--;
    const ok=e&&e.status==="ok";if(s.goal==="finish"&&ok)s.prog++;if(s.goal==="points"&&ok&&e.pts>0)s.prog++;if(s.goal==="top5"&&ok&&e.pos<=5)s.prog++;if(s.goal==="podium"&&ok&&e.pos<=3)s.prog++;
    if(s.goal==="followers")s.prog=Math.max(0,G.fame.followers-s.f0);if(s.goal==="respect")s.prog=G.fame.rep>=s.tgt?s.tgt:0;
    s.sat=clamp(s.sat+(ok&&e.pts>0?3:0)-(e&&e.status==="dns"?14:0)-((s.posted||0)?0:3),0,100);s.posted=0;
    if(heat>s.heatMax){if(s.warned){G.sponsors.splice(G.sponsors.indexOf(s),1);G.spGone[s.id]=G.season*100+G.round;news(`${b.n} rompeu o patrocínio por causa das polêmicas (cláusula de imagem).`,"bad");post("journo",`${b.n} encerra contrato com ${ME().n} após sequência de polêmicas.`,{journo:pick(JOURNOS),likes:ri(1500,6000)});fameAdd(-1,-1);continue}
      s.warned=true;news(`${b.n} mandou um aviso: mais uma polêmica e o contrato acaba (cláusula de imagem).`,"warn")}else s.warned=false;
    if(!s.paidBonus&&s.goal!=="respect"&&s.prog>=s.tgt){s.paidBonus=true;G.money+=s.bonus;s.sat=clamp(s.sat+15,0,100);news(`Meta batida com a ${b.n}: bônus de ${moneyS(s.bonus)}.`,"good")}
    if(s.left<=0){if(s.goal==="respect"&&s.prog>=s.tgt&&!s.paidBonus){G.money+=s.bonus;news(`Meta batida com a ${b.n}: bônus de ${moneyS(s.bonus)}.`,"good")}
      G.sponsors.splice(G.sponsors.indexOf(s),1);
      if(s.sat>=55&&G.calendar.length-G.round>3){const o=spMakeOffer(b);o.pay=+(Math.max(o.pay,s.pay)*1.15).toFixed(3);o.renew=true;G.spOffers.push(o);news(`Fim do contrato com a ${b.n}. Satisfeita, a marca quer renovar com aumento.`,"good")}
      else{G.spGone[s.id]=G.season*100+G.round;news(`Fim do contrato com a ${b.n}${s.sat<35?": a marca não quis renovar":""}.`)}}}
  if(res)res.spPay=paid;spRefresh()}
function spPostOptions(){spInit();const me=ME();const sur=me.n.split(" ").pop();return G.sponsors.map(s=>{const b=SPONS.find(x=>x.id===s.id);const txt={carga:`Logística de F1 é coisa séria: 30 toneladas de equipamento por GP. Valeu, @cargaexpress 📦`,voltix:`Energia lá em cima pra mais um fim de semana. #VoltixEnergy ⚡`,rush:`Hoje tem live jogando com a galera! Quem me vence no simulador? 🎮 @rushgames`,aeris:`Foco total antes da classificação. Música certa no fone faz diferença 🎧 @aerisaudio`,brava:`Look de paddock pronto. Estilo também é performance 😎 @brava`,solaris:`Corrida com energia limpa no box e em casa ☀️ Orgulho de ser parceiro da Solaris.`,nimbus:`Planejamento é tudo, na pista e fora dela. Parceiro @nimbusbank 💙`,tempora:`Na F1 tudo é questão de milésimos. ⏱️ @tempora`}[s.id];
  return{k:"sp:"+s.id,n:`Post patrocinado · ${b.n}`,tone:b.loves||"confiante",txt,eff:{pop:.6,rep:-.25},sp:s.id}})}
