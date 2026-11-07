// ===================== CARREIRA DO PILOTO =====================
let G=null;const SAVE_KEY="paddock-save-v1";let DID=0;
const ATTR={pace:"Ritmo",quali:"Volta lançada",brk:"Frenagem",cor:"Entrada de curva",trc:"Tração",gear:"Câmbio",kerb:"Zebras",ctrl:"Controle do carro",ovt:"Ultrapassagem",def:"Defesa",craft:"Leitura de corrida",start:"Largada",wet:"Chuva",adapt:"Adaptação",tyre:"Gestão de pneus",ers:"Gestão de energia",fuel:"Economia de combustível",cons:"Consistência",mental:"Frieza",fitness:"Preparo físico"};
const ATTR_G=[["Velocidade",["pace","quali"]],["Técnica",["brk","cor","trc","gear","kerb","ctrl"]],["Corrida",["ovt","def","craft","start","wet","adapt"]],["Gestão",["tyre","ers","fuel","cons"]],["Cabeça e corpo",["mental","fitness"]]];
const PERS={aggr:{n:"Agressividade",lo:"Cauteloso",hi:"Agressivo",d:"Quanto arrisca nas disputas: tenta mais ultrapassagens e deixa menos espaço, mas se envolve em mais toques"},disc:{n:"Disciplina",lo:"Rebelde",hi:"Disciplinado",d:"Quanto respeita ordens da equipe e as regras (devolver posição, bandeiras)"}};
const ATTR_D={brk:"Frear forte e tarde sem travar as rodas; decide mergulhos",cor:"Levar velocidade para dentro da curva sem alargar",trc:"Acelerar cedo na saída sem a traseira escapar",gear:"Trocas de marcha rápidas e suaves: largada e saídas de curva",kerb:"Usar as zebras sem estourar os limites de pista nem danificar o carro",ctrl:"Segurar o carro quando ele escapa: transforma rodadas em sustos",craft:"Ler a corrida: perceber o rival, escolher a hora certa de atacar e deixar o espaço certo",adapt:"Aprender pistas novas e se ajustar a mudanças (chuva começando, carro novo)",ers:"Recuperar e usar a bateria no lugar certo",fuel:"Poupar combustível perdendo pouco tempo",pace:"Velocidade pura em ritmo de corrida",quali:"Tirar tudo do carro em uma volta na classificação",cons:"Errar pouco e manter tempos constantes",wet:"Rendimento com pista molhada",ovt:"Encontrar e completar ultrapassagens",def:"Segurar quem vem atrás sem perder tempo",tyre:"Fazer os pneus durarem mais",start:"Ganhar posições na largada",mental:"Frieza: lidar com pressão, rival colado e momentos decisivos sem ficar nervoso",fitness:"Manter o ritmo no fim de corridas longas e no calor"};
const TRAITS={agressivo:{n:"Agressivo",d:"Larga bem e ultrapassa mais, mas erra mais"},cuidadoso:{n:"Cuidadoso",d:"Erra pouco e poupa pneus, mas ultrapassa menos"},chuva:{n:"Rei da chuva",d:"Rende muito mais na pista molhada"},rua:{n:"Especialista em rua",d:"Mais rápido em circuitos de rua"},pneus:{n:"Mão leve",d:"Gasta menos pneu"},classificacao:{n:"Voador de sábado",d:"Muito rápido na classificação"}};
const TRAITS_K=Object.keys(TRAITS);
function newDriver(o){const nat=o.nat||pick(Object.keys(NATS)),N=NATS[nat]||NATS.BRA;const base=o.pace;
  const a={};for(const k of Object.keys(ATTR))a[k]=clamp(Math.round(base+rr(-8,6)),40,99);a.pace=clamp(Math.round(base),40,99);const tr0=o.trait||null;
  let n=o.n||pick(N.f)+" "+pick(N.l);if(!o.n&&typeof G!=="undefined"&&G&&G.drivers){const used=new Set(Object.values(G.drivers).map(d=>d.n));let k=0;while(used.has(n)&&k++<40){const M=k>12?NATS[pick(Object.keys(NATS))]:N;n=pick(M.f)+" "+pick(M.l)}}const last=n.split(" ").slice(-1)[0];
  const d={id:"d"+(DID++),n,code:(o.code||last.normalize("NFD").replace(/[^A-Za-z]/g,"").slice(0,3)).toUpperCase(),nat,age:o.age||ri(20,34),num:o.num||ri(2,99),a,trait:o.trait||pick(TRAITS_K),morale:70,team:o.team||null,contract:o.contract||ri(1,3),
    potential:o.potential||clamp(Math.round(base+rr(0,8)),40,99),chem:0,fame:clamp(Math.round((base-70)*2.5+rr(0,15)),2,95),stats:{starts:0,wins:0,podiums:0,points:0,poles:0,titles:0,dnf:0},me:!!o.me};
  traitAttrs(d);d.pers=o.pers||genPers(d);const st0=o.me?0:Math.max(0,Math.round((d.age-21)*20+rr(-25,15)));d.exp={yrs:+(st0/22).toFixed(1),starts:st0,wet:Math.round(st0*.12),laps:{}};
  d.salary=+Math.max(.5,Math.pow(Math.max(0,base-62),1.7)*.06).toFixed(1);return d}
// a característica escolhida puxa alguns atributos
function traitAttrs(d){const a=d.a,b={agressivo:{ovt:3,brk:2,def:1},cuidadoso:{cons:3,tyre:2,fuel:2},chuva:{wet:4,ctrl:3,adapt:2},rua:{brk:3,ctrl:3,kerb:2},pneus:{tyre:4,trc:2},classificacao:{quali:4,cor:2}}[d.trait]||{};for(const k in b)a[k]=clamp(a[k]+b[k],40,99)}
// personalidade (não é habilidade): agressividade e disciplina, 0 a 100
function genPers(d){const a=d.a;return{aggr:clamp(Math.round(50+(d.trait==="agressivo"?28:d.trait==="cuidadoso"?-24:0)+(a.ovt-75)*.5+rr(-15,15)),8,97),disc:clamp(Math.round(64+(d.trait==="cuidadoso"?14:d.trait==="agressivo"?-14:0)+(a.mental-75)*.4+rr(-16,16)),8,97)}}
// atributos que faltam em saves antigos saem dos que já existiam
function fillAttrs(d){const a=d.a;const v=(x,y,w)=>clamp(Math.round((a[x]??75)*(1-w)+(a[y]??75)*w+rr(-4,4)),40,99);
  const der={brk:()=>v("pace","cons",.4),cor:()=>v("pace","quali",.3),trc:()=>v("cons","tyre",.3),gear:()=>v("start","pace",.5),kerb:()=>v("cons","pace",.5),ctrl:()=>v("wet","mental",.5),craft:()=>v("ovt","def",.5),adapt:()=>v("wet","mental",.4),ers:()=>v("tyre","cons",.4),fuel:()=>v("tyre","cons",.5)};
  for(const k of Object.keys(ATTR))if(a[k]==null)a[k]=der[k]?der[k]():75;if(!d.pers)d.pers=genPers(d);
  if(!d.exp){const st0=d.me?0:Math.max(0,Math.round((d.age-21)*20));const s=(d.stats&&d.stats.starts)||0;d.exp={yrs:+(st0/22).toFixed(1),starts:st0+s,wet:Math.round(st0*.12),laps:{}}}}
function ovr(d){const a=d.a;return Math.round(a.pace*.22+a.quali*.09+a.cons*.08+a.tyre*.07+a.ovt*.06+a.def*.05+a.wet*.05+a.brk*.05+a.cor*.05+a.ctrl*.04+a.craft*.05+a.trc*.04+a.start*.03+a.ers*.03+a.mental*.03+a.fitness*.02+a.adapt*.02+a.fuel*.01+a.gear*.01+a.kerb*.01)}
function carFrom(t){const c={};for(const k of["aero","chas","susp","brk","rel"])c[k]=clamp(Math.round(t+rr(-3,3)),60,97);c.eng=Math.round(85+((PU[t.pu]||{power:1}).power-1)*250);return c}
function newGame(o){DID=0;
  G={v:1,garage:GARAGE0.slice(),year:2026,season:1,round:0,calendar:CIRCUITS.map(c=>c.id),settings:{dist:o.dist||.25,sound:true},drivers:{},teams:[],results:[],news:[],articles:[],phase:"home",
    social:{feed:[],trends:[]},fame:{pop:8,rep:20,followers:12000},money:0,trust:55,rel:{},h2h:{q:[0,0],r:[0,0]},xp:0,train:"auto",ach:{},history:[],offers:[],pending:[],mood:"neutro",gameOver:null};
  for(const t0 of TEAMS0){const t={...t0,car:{},drivers:[]};for(const k of["aero","chas","susp","brk","rel"])t.car[k]=clamp(Math.round(t0.tier+rr(-2.5,2.5)),60,97);t.car.eng=Math.round(88+(PU[t0.pu].power-1)*250+(t0.tier-84)*.4);
    G.teams.push(t)}
  // você
  const me=newDriver({n:o.name,code:o.code,nat:o.nat||"BRA",age:o.age||19,num:o.num||ri(2,99),pace:75,potential:95,team:"cadillac",contract:1,me:true,trait:o.trait});
  if(o.attrs){Object.assign(me.a,o.attrs);traitAttrs(me)}if(o.pers)me.pers=o.pers;me.fame=6;me.salary=.6;G.drivers[me.id]=me;G.me=me.id;G.helmet={c1:o.c1||"#FFD400",c2:o.c2||"#1B998B"};
  for(const t of G.teams){const need=t.id==="cadillac"?1:2;for(let i=0;i<need;i++){const d=newDriver({pace:t.tier-6+(i?rr(-5,1):rr(-1,4)),team:t.id,age:ri(21,36)});G.drivers[d.id]=d;t.drivers.push(d.id)}if(t.id==="cadillac")t.drivers.unshift(me.id)}
  for(let i=0;i<10;i++){const d=newDriver({pace:rr(68,80),age:ri(19,33)});d.team=null;G.drivers[d.id]=d}
  {const used=new Set();Object.values(G.drivers).sort((x,y)=>(y.me?1:0)-(x.me?1:0)).forEach(d=>{let c=d.code;if(used.has(c)){const L=d.n.split(" ").pop().normalize("NFD").replace(/[^A-Za-z]/g,"").toUpperCase();const F=d.n[0].toUpperCase();const cands=[L[0]+L[1]+L[3],L[0]+L[2]+L[3],F+L[0]+L[1],L.slice(0,2)+F,L[0]+L[1]+"X"];c=cands.find(x=>x&&x.length===3&&!used.has(x))||c+DID;d.code=c}used.add(d.code)})}
  if(typeof spRefresh==="function")spRefresh();G.rival=null;post("sys",`${me.n} é o novo piloto da Cadillac! Estreia na F1 em 2026.`,{likes:ri(800,2500)});
  news(`Bem-vindo à Fórmula 1! Você assinou por 1 temporada com a ${teamOf("cadillac").n}, a equipe estreante do grid.`,"big");
  news(`Meta da equipe para você: terminar à frente do companheiro e marcar pontos. Chefe: ${teamOf("cadillac").boss}.`);
  save();return G}
const ME=()=>G.drivers[G.me];
function myTeam(){return teamOf(ME().team)}
function teamOf(id){return G.teams.find(t=>t.id===id)}
function mate(){const t=myTeam();return G.drivers[t.drivers.find(id=>id!==G.me)]}
function news(t,cls){G.news.unshift({s:G.season,r:G.round,t,cls:cls||""});if(G.news.length>90)G.news.pop()}
function carAvg(t){const c=t.car;return(c.eng+c.aero+c.chas+c.susp+c.brk+c.rel)/6}
function teamDrivers(t){return t.drivers.map(id=>G.drivers[id])}
function activeDrivers(t){return teamDrivers(t)}
// ---------- classificação do campeonato
function standings(){const dr={},tm={};G.teams.forEach(t=>tm[t.id]={id:t.id,pts:0,wins:0,best:99});
  for(const r of G.results.filter(r=>r.season===G.season))for(const e of r.cls){dr[e.d]=dr[e.d]||{id:e.d,team:e.team,pts:0,wins:0,pod:0,best:99};
    dr[e.d].pts+=e.pts;dr[e.d].team=e.team;tm[e.team].pts+=e.pts;if(r.sprint)continue;if(e.status==="ok"){if(e.pos===1){dr[e.d].wins++;tm[e.team].wins++}if(e.pos<=3)dr[e.d].pod++;dr[e.d].best=Math.min(dr[e.d].best,e.pos);tm[e.team].best=Math.min(tm[e.team].best,e.pos)}}
  const cmp=(a,b)=>b.pts-a.pts||b.wins-a.wins||a.best-b.best;return{drivers:Object.values(dr).sort(cmp),teams:Object.values(tm).sort(cmp)}}
function myStats(){const s={points:0,best:99,podiums:0,wins:0,top10:0,dnf:0,starts:0};for(const r of G.results.filter(r=>r.season===G.season)){const e=r.cls.find(x=>x.d===G.me);if(!e||e.status==="dns")continue;s.points+=e.pts;if(r.sprint)continue;s.starts++;if(e.status==="ok"){s.best=Math.min(s.best,e.pos);if(e.pos<=3)s.podiums++;if(e.pos===1)s.wins++;if(e.pos<=10)s.top10++}else s.dnf++}return s}
// ---------- depois de uma corrida
function afterRace(res){if(typeof marketRumors==="function")marketRumors();G.results.push(res);const me=ME(),t=myTeam(),m=mate();const ban=!!res.banned;const e=res.cls.find(x=>x.d===G.me)||{status:"dns",pts:0,pos:null,why:"suspenso"},em=ban?null:res.cls.find(x=>x.d===(m&&m.id));
  res.cls.forEach(x=>{const d=G.drivers[x.d];if(!d||x.status==="dns")return;d.stats.starts++;if(!res.sprint)dExp(d).starts++;d.stats.points+=x.pts;if(x.status==="ok"){if(x.pos===1)d.stats.wins++;if(x.pos<=3)d.stats.podiums++}else d.stats.dnf++;d.chem=(d.chem||0)+1});
  if(ban){G.trust=clamp(G.trust-4,0,100);fameAdd(-2,-3)}
  if(res.pole&&G.drivers[res.pole])G.drivers[res.pole].stats.poles++;
  // duelo com o companheiro
  if(em){const a=e.status==="ok"?e.pos:99,b=em.status==="ok"?em.pos:99;if(a<b)G.h2h.r[0]++;else if(b<a)G.h2h.r[1]++}
  if(res.gridMe&&res.gridMate){if(res.gridMe<res.gridMate)G.h2h.q[0]++;else G.h2h.q[1]++}
  // dinheiro, fama, confiança, experiência
  const pay=me.salary/G.calendar.length+e.pts*.04;G.money+=pay;res.pay=pay;
  const exp=expectedPos();const perf=e.status==="ok"?exp-e.pos:-6;
  G.trust=clamp(G.trust+clamp(perf*.8,-6,6)+(e.status!=="ok"&&e.why&&e.why.includes("Acidente")?-5:0),0,100);
  const fameGain=(e.pts>0?2+e.pts*.25:0)+(e.pos===1?10:e.pos<=3?5:0)+(res.wet&&e.pts>0?2:0)-(e.status!=="ok"?1:0);G.fame.pop=clamp(G.fame.pop+fameGain*.6,0,100);me.fame=Math.round(G.fame.pop);
  G.fame.followers=Math.round(G.fame.followers*(1+Math.max(-.01,fameGain*.012))+ri(50,400));
  if(!ban){G.xp+=6+Math.max(0,perf)*.6+(e.status==="ok"?2:0);develop()}
  me.morale=clamp(me.morale+clamp(perf*1.2,-6,8),5,100);
  // recordes
  const R=G.ach;const tag=`${CIR[res.track].gp} ${G.year}`;
  if(e.pts>0&&!R.point){R.point=tag;news("Seus primeiros pontos na Fórmula 1!","big")}
  if(e.pos<=3&&e.status==="ok"&&!R.podium){R.podium=tag;news("Seu primeiro pódio na F1!","big")}
  if(e.pos===1&&e.status==="ok"&&!R.win){R.win=tag;news("SUA PRIMEIRA VITÓRIA NA FÓRMULA 1!","big")}
  if(typeof devAfterRace==="function")devAfterRace();if(typeof spAfterRace==="function")spAfterRace(res,e);
  aiDevelop();G.round++;
  if(G.round===Math.floor(G.calendar.length*.6))makeOffers(true);
  save()}
function expectedPos(){const order=G.teams.slice().sort((a,b)=>carAvg(b)-carAvg(a));return order.indexOf(myTeam())*2+2}
function aiDevelop(){G.teams.forEach(t=>{const m=.12+(t.rep/100)*.22;for(const k of["aero","chas","susp","brk","rel"]){const room=clamp((99-t.car[k])/16,.15,1);t.car[k]=clamp(+(t.car[k]+rr(0,m)*room*(t.id===myTeam().id&&!G.dev&&!(G.devLog||[]).length?1.2:1)).toFixed(2),55,99)}})}
// ---------- evolução do piloto
const TRAIN={auto:{n:"Automático",d:"O preparador escolhe os pontos mais fracos"},simulador:{n:"Simulador",d:"Ritmo, volta lançada, frenagem, curvas e adaptação"},academia:{n:"Academia",d:"Preparo físico e frieza"},dados:{n:"Engenharia e dados",d:"Pneus, energia, combustível, consistência e leitura de corrida"},kart:{n:"Kart e racecraft",d:"Ultrapassagem, defesa, largada, chuva, tração, câmbio, zebras e controle"}};
const TRAIN_MAP={simulador:["pace","quali","brk","cor","adapt"],academia:["fitness","mental"],dados:["tyre","ers","fuel","cons","craft"],kart:["ovt","def","start","wet","trc","gear","kerb","ctrl"]};
function develop(){const me=ME();while(G.xp>=12){G.xp-=12;let keys;if(G.train==="auto"){keys=Object.keys(ATTR).sort((a,b)=>me.a[a]-me.a[b]).slice(0,3)}else keys=TRAIN_MAP[G.train];
  // com 20 atributos, cada nível sobe dois deles (mesmo ritmo de evolução de antes)
  const ks=keys.slice().sort(()=>rnd()-.5).slice(0,2);for(const k of ks){const cap=me.potential+(k==="pace"?0:4);if(me.a[k]<cap){me.a[k]++;news(`Evolução: ${ATTR[k]} subiu para ${me.a[k]}.`,"good")}}}}
// ---------- propostas de contrato
function makeOffers(mid){const me=ME(),st=standings();const myPos=st.drivers.findIndex(x=>x.id===G.me)+1||22;const mp=myStats().points;const score=ovr(me)+G.fame.pop*.15+mp*.08+(G.h2h.r[0]-G.h2h.r[1])*.8;
  const out=[];G.teams.forEach(t=>{const need=72+(t.rep-55)*.45;if(score+rr(-4,4)<need)return;if(t.id===me.team)return;const sal=+(1+(t.rep/100)*6+mp*.03).toFixed(1);
    out.push({team:t.id,years:ri(1,3),salary:sal,role:t.rep>85&&score<need+6?"segundo piloto":"piloto titular",exp:t.rep>85?"brigar por pódios":t.rep>70?"pontos com frequência":"pontuar quando possível"})});
  const own=myTeam();if(G.trust>30)out.push({team:own.id,years:ri(1,2),salary:+(me.salary*1.25+mp*.02).toFixed(1),role:"piloto titular",exp:"seguir evoluindo",renew:true});
  G.offers=out.sort((a,b)=>teamOf(b.team).rep-teamOf(a.team).rep).slice(0,4);
  if(G.offers.length)news(`${mid?"Mercado aquecido":"Fim de ano"}: você recebeu ${G.offers.length} proposta${G.offers.length>1?"s":""} de contrato. Veja na aba Carreira.`,"big");
  G.offers.filter(o=>!o.renew).forEach(o=>post("journo",`Fontes do paddock dizem que a ${teamOf(o.team).n} está de olho em ${me.n} para ${G.year+1}. 👀`,{likes:ri(400,3000),journo:pick(JOURNOS)}))}
function acceptOffer(o){G.signed=o;news(`Você assinou com a ${teamOf(o.team).n} para ${G.year+1}: ${o.years} ano${o.years>1?"s":""}, ${money(o.salary)} por ano.`,"big");
  post("me",o.renew?`Feliz em continuar na ${teamOf(o.team).n}! Vamos juntos 💪`:`Novo capítulo! A partir de ${G.year+1} defendo a ${teamOf(o.team).n}. Obrigado a todos que me apoiaram até aqui ❤️`,{likes:ri(20000,90000)});
  G.offers=[];save()}
// ---------- fim de temporada
function endSeason(){const st=standings(),me=ME();const pos=st.drivers.findIndex(x=>x.id===G.me)+1;const sum=[];
  const champ=st.drivers[0];sum.push(`Campeão mundial de ${G.year}: ${G.drivers[champ.id].n} (${teamOf(champ.team).n}).`);G.drivers[champ.id].stats.titles++;
  sum.push(`Campeã de construtores: ${teamOf(st.teams[0].id).n}.`);sum.push(`Você terminou em ${pos}º com ${myStats().points} pontos. Duelo com o companheiro: ${G.h2h.r[0]} × ${G.h2h.r[1]} em corridas, ${G.h2h.q[0]} × ${G.h2h.q[1]} em classificações.`);
  if(champ.id===G.me){sum.push("VOCÊ É CAMPEÃO MUNDIAL DE FÓRMULA 1!");me.stats.titles++}
  G.history.push({year:G.year,team:me.team,pos,pts:myStats().points,wins:myStats().wins});
  G.garage=st.teams.map(t=>t.id);// garagens do ano que vem: ordem do campeonato que acabou
  if(!G.signed){if(!G.offers.length)makeOffers(false);G.signed=G.offers[0]||{team:me.team,years:1,salary:me.salary,renew:true};sum.push(`Contrato para ${G.year+1}: ${teamOf(G.signed.team).n}.`)}
  // mudança de equipe
  const nt=G.signed;if(nt.team!==me.team){const old=myTeam(),nw=teamOf(nt.team);old.drivers=old.drivers.filter(x=>x!==G.me);const out=nw.drivers.sort((a,b)=>ovr(G.drivers[a])-ovr(G.drivers[b]))[0];
    nw.drivers=nw.drivers.filter(x=>x!==out);G.drivers[out].team=old.id;old.drivers.push(out);nw.drivers.unshift(G.me);me.team=nw.id;me.chem=0;G.trust=55;G.h2h={q:[0,0],r:[0,0]}}
  me.salary=nt.salary;me.contract=nt.years;G.signed=null;G.offers=[];
  {const mk=typeof aiMarket==="function"?aiMarket():[];if(mk.length)sum.push("Mercado de pilotos para "+(G.year+1)+": "+mk.slice(0,10).join(" ")+(mk.length>10?` E mais ${mk.length-10} mudanças.`:""))}
  // envelhecimento e evolução dos outros
  Object.values(G.drivers).forEach(d=>{d.age++;if(d.me||d.retired)return;const g=d.age<=25?rr(0,3):d.age<=32?rr(-1,1):rr(-3,0);for(const k in d.a)d.a[k]=clamp(Math.round(d.a[k]+g+rr(-1,1)),40,99)});
  G.teams.forEach(t=>{for(const k of["aero","chas","susp","brk","rel"])t.car[k]=clamp(+(80+(t.car[k]-80)*.7+rr(-2,2)).toFixed(1),60,95)});
  G.year++;G.season++;G.round=0;G.h2h={q:[0,0],r:[0,0]};G.trust=clamp(G.trust,40,70);news(`Começa a temporada ${G.year}.`,"big");save();return sum}
// ---------- salvar
function save(){if(G&&G.mp)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({G,DID}))}catch(e){}}
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(!s||!s.G)return false;G=migrateSave(s.G);DID=s.DID;return true}catch(e){return false}}
// carreiras antigas: troca as equipes fictícias pelas reais (mantém carros, pilotos e resultados)
function migrateSave(g){if(g.teams&&g.teams.some(t=>OLD_TEAM_IDS[t.id])){let txt=JSON.stringify(g);for(const[o,n]of Object.entries(OLD_TEAM_IDS))txt=txt.split(`"${o}"`).join(`"${n}"`);g=JSON.parse(txt);
    g.teams.forEach(t=>{const t0=TEAMS0.find(x=>x.id===t.id);if(!t0)return;Object.assign(t,{n:t0.n,c:t0.c,c2:t0.c2,pu:t0.pu,boss:t0.boss,style:t0.style,rookieTeam:!!t0.rookieTeam})});g.migrated5=true}
  if(!Array.isArray(g.garage)||g.garage.length!==TEAMS0.length)g.garage=GARAGE0.slice();
  // etapa 6: atributos novos, personalidade e experiência
  if(g.drivers)for(const id in g.drivers)fillAttrs(g.drivers[id]);if(!g.feud)g.feud={};return g}
function hasSave(){try{return!!localStorage.getItem(SAVE_KEY)}catch(e){return false}}
function wipeSave(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}}
