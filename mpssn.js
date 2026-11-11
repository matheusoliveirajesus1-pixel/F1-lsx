// ===================== TEMPORADA ONLINE: EQUIPES ESTREANTES, PONTOS E EVOLUÇÃO DO CARRO =====================
// Cada jogador tem a própria equipe estreante (ele e um companheiro da IA) contra as 11 equipes reais.
// A temporada fica salva em todos os aparelhos que correm nela; quem criar a sala (qualquer um) continua de onde parou.
// Regras iguais para todos: mesmo carro inicial, mesmo prêmio por ponto, mesmos preços de evolução.
const SSN_AREAS=[["aero","Aerodinâmica","mais rápido nas curvas"],["eng","Motor","mais rápido nas retas"],["chas","Chassi e freios","freia mais tarde e gasta menos pneu"],["rel","Confiabilidade","menos quebras"]];
const SSN_MAX=6,SSN_CALS=[[6,"Curta","6 GPs"],[11,"Média","11 GPs"],[22,"Completa","22 GPs"]],SSN_PRE="paddock-mpseason-";
const SSN={cache:null,ck:"",ui:{n:6,lp:.15,wx:"auto",tab:"drv"},sure:""};
const SSN_ON=true;// temporada online: pausada até terminar os testes
const SSN_ID=x=>String(x||"").replace(/[^a-z0-9]/g,"").slice(0,16);
const SSN_TXT=x=>String(x||"").replace(/[\u0000-\u001f\u007f-\u009f<>]/g,"").trim();
const fmtM=t=>(t/10).toFixed(1).replace(".",",")+" mi";
// ---------- identidade fixa do jogador (sobrevive a recarregar a página: é assim que ele volta para o próprio carro)
function mpUid(){if(MP.uid)return MP.uid;let u=null;try{u=sessionStorage.getItem("paddock-mp-uid-tab")||localStorage.getItem("paddock-mp-uid")}catch(e){}// (a aba pode ter um id próprio: dois jogadores no mesmo navegador)
  if(!u||!/^[a-z0-9]{8,16}$/.test(u)){u="";for(let i=0;i<10;i++)u+=MP_ALPH[Math.floor(Math.random()*MP_ALPH.length)];try{localStorage.setItem("paddock-mp-uid",u)}catch(e){}}MP.uid=u;return u}
function mpRemember(code,role){try{localStorage.setItem("paddock-mp-last",JSON.stringify({code,role,t:Date.now()}))}catch(e){}}
function mpForget(){try{localStorage.removeItem("paddock-mp-last")}catch(e){}}
function mpLast(){try{const o=JSON.parse(localStorage.getItem("paddock-mp-last")||"null");if(o&&typeof o.code==="string"&&/^[a-z0-9]{3,8}$/.test(o.code)&&Date.now()-(+o.t||0)<6*3600e3)return o}catch(e){}return null}
function mpLastBtn(){const l=mpLast();if(!l||MP.st==="none"||MP.nr)return"";return`<button class="btn" data-act="mpRejoin" data-k="${l.code}:${l.role==="h"?"h":"g"}">↩ Voltar para a sala ${l.code.toUpperCase()}</button>`}
// ---------- escolhas do fim de semana (treino livre e classificação)
function mpWk(){if(!MP.wk){let o=null;try{o=JSON.parse(localStorage.getItem("paddock-mp-wk")||"null")}catch(e){}MP.wk=Array.isArray(o)?o.slice(0,2):["setup","normal"]}
  return[MP_FO.some(x=>x[0]===MP.wk[0])?MP.wk[0]:"setup",MP_QR.some(x=>x[0]===MP.wk[1])?MP.wk[1]:"normal"]}
function mpWkSet(i,v){const w=mpWk();w[i]=v;MP.wk=w;try{localStorage.setItem("paddock-mp-wk",JSON.stringify(w))}catch(e){}if(MP.nr)mpSet({wk:w})}
// ---------- a equipe estreante de cada jogador (nome e cores)
function ssnCleanTeam(o){o=o||{};return{tn:SSN_TXT(o.tn).slice(0,24)||"Equipe Estreante",tc:mpHex(o.tc)||"#FFD400",tc2:mpHex(o.tc2)||"#111111"}}
function mpMyTeam(){if(!MP.myTeam){let o=null;try{o=JSON.parse(localStorage.getItem("paddock-mp-team")||"null")}catch(e){}const id=mpId();
    MP.myTeam=ssnCleanTeam(o||{tn:`${id.nm.split(" ").pop()} Racing`,tc:id.c1,tc2:id.c2==="#FFD400"?"#111111":id.c2})}return MP.myTeam}
function mpTeamPres(){const t=mpMyTeam();return{tn:t.tn,tc:t.tc,tc2:t.tc2}}
function mpTeamSave(patch){MP.myTeam=ssnCleanTeam({...mpMyTeam(),...patch});try{localStorage.setItem("paddock-mp-team",JSON.stringify(MP.myTeam))}catch(e){}if(MP.nr)mpSet(mpTeamPres());if(MP.role==="h")ssnHostSync()}
// ---------- a temporada: criar, limpar (dados vindos da rede não são confiáveis), salvar
function ssnCal(n){const ids=CIRCUITS.map(c=>c.id);if(n>=ids.length)return ids.slice();const out=[];for(let i=0;i<n;i++)out.push(ids[Math.round(i*(ids.length-1)/(n-1))]);return out}
function ssnRand(n){let s="";for(let i=0;i<n;i++)s+=MP_ALPH[Math.floor(Math.random()*MP_ALPH.length)];return s}
function ssnNew(n,lp,wx){const id=mpId();return{v:1,id:ssnRand(8),nm:`Temporada de ${id.nm.split(" ")[0]}`,sd:1+Math.floor(Math.random()*2147483000),cal:ssnCal(n),lp,wx,rd:0,pl:[],dp:[],dw:[],hist:[],done:0,up:Date.now()}}
function ssnPlayer(uid,q,team){const c=mpCleanId(q),t=ssnCleanTeam(team);return{u:uid,nm:c.nm,cd:c.cd,num:c.num,c1:c.c1,c2:c.c2,tn:t.tn,tc:t.tc,tc2:t.tc2,dv:[0,0,0,0],m:150,lp:0}}
function ssnCleanPl(p){if(!p||typeof p!=="object")return null;const u=SSN_ID(p.u);if(u.length<6)return null;const c=mpCleanId(p),t=ssnCleanTeam(p);
  const dv=(Array.isArray(p.dv)?p.dv:[]).slice(0,4).map(x=>clamp(Math.round(+x||0),0,SSN_MAX));while(dv.length<4)dv.push(0);
  return{u,nm:c.nm,cd:c.cd,num:c.num,c1:c.c1,c2:c.c2,tn:t.tn,tc:t.tc,tc2:t.tc2,dv,m:clamp(Math.round(+p.m||0),0,99999),lp:clamp(Math.round(+p.lp||0),0,9999)}}
function ssnClean(o){if(!o||typeof o!=="object")return null;const id=SSN_ID(o.id);if(id.length<6)return null;
  const cal=(Array.isArray(o.cal)?o.cal:[]).filter(x=>typeof x==="string"&&CIR[x]).slice(0,24);if(!cal.length)return null;
  const seen=new Set();const pl=(Array.isArray(o.pl)?o.pl:[]).slice(0,4).map(ssnCleanPl).filter(p=>p&&!seen.has(p.u)&&seen.add(p.u));
  const n=TEAMS0.length*2+2*pl.length;const arr=(a,hi)=>{const v=(Array.isArray(a)?a:[]).slice(0,n).map(x=>clamp(Math.round(+x||0),0,hi));return v.length===n?v:[]};
  const rd=clamp(Math.round(+o.rd||0),0,cal.length);
  return{v:1,id,nm:SSN_TXT(o.nm).slice(0,40)||"Temporada",sd:clamp(Math.round(+o.sd||1),1,2147483646),cal,lp:MP_LAPS.some(x=>x[0]===+o.lp)?+o.lp:.15,wx:MP_WX.some(x=>x[0]===o.wx)?o.wx:"seco",rd,pl,
    dp:arr(o.dp,9999),dw:arr(o.dw,99),hist:(Array.isArray(o.hist)?o.hist:[]).slice(-24).filter(Array.isArray).map(h=>h.slice(0,6).map(x=>clamp(Math.round(+x||0),-1,99))),done:rd>=cal.length?1:0,up:clamp(Math.round(+o.up||0),0,9e15)}}
function ssnSave(s,keep){if(!s)return;if(!keep)s.up=Date.now();try{localStorage.setItem(SSN_PRE+s.id,JSON.stringify(s))}catch(e){}}
function ssnLoad(id){try{return ssnClean(JSON.parse(localStorage.getItem(SSN_PRE+SSN_ID(id))||"null"))}catch(e){return null}}
function ssnDelete(id){try{localStorage.removeItem(SSN_PRE+SSN_ID(id))}catch(e){}}
function ssnList(){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(SSN_PRE)){const s=ssnLoad(k.slice(SSN_PRE.length));if(s&&s.pl.some(p=>p.u===mpUid()))out.push(s)}}}catch(e){}return out.sort((a,b)=>b.up-a.up)}
// ---------- o mundo da temporada: o que precisa ir para todos os aparelhos montarem o mesmo grid
function ssnWorldOf(s){return{sd:s.sd,pl:s.pl.map(p=>[p.u,p.nm,p.cd,p.num,p.c1,p.c2,p.tn,p.tc,p.tc2,...p.dv])}}
function ssnUnpack(a){return ssnCleanPl({u:a[0],nm:a[1],cd:a[2],num:a[3],c1:a[4],c2:a[5],tn:a[6],tc:a[7],tc2:a[8],dv:a.slice(9,13)})}
function ssnCleanWorld(w){if(!w||typeof w!=="object"||!Array.isArray(w.pl))return null;
  const pl=w.pl.slice(0,4).map(a=>Array.isArray(a)?ssnUnpack(a):a&&typeof a==="object"?ssnCleanPl(a):null).filter(Boolean);
  return{sd:clamp(Math.round(+w.sd||1),1,2147483646),pl:pl.map(p=>[p.u,p.nm,p.cd,p.num,p.c1,p.c2,p.tn,p.tc,p.tc2,...p.dv])}}
// carro da equipe estreante: começa no nível da última equipe do grid e pode chegar ao das melhores
function ssnCar(dv){const L=x=>clamp(Math.round(x),60,97);const aero=L(80+dv[0]*2.2),chas=L(80+dv[2]*2.2);return{aero,chas,susp:chas,brk:chas,rel:L(78+dv[3]*3),eng:Math.round(85+dv[1]*1.6)}}
function ssnCost(lv){return 40+30*lv}// em décimos de milhão: 4, 7, 10, 13, 16 e 19 milhões
function ssnAddRookies(sw,L,localPeer){(sw.pl||[]).forEach((a,k)=>{const p=ssnUnpack(a);if(!p)return;const car=ssnCar(p.dv);
    const t={id:"rk"+k,n:p.tn,c:p.tc,c2:p.tc2,tier:Math.round((car.aero+car.chas)/2),pu:"ferrari",rep:50,boss:p.nm,style:"paciente",rookieTeam:true,rk:1,car,drivers:[]};G.teams.push(t);
    const seat=(L||[]).find(x=>x.uid===p.u);const d=mpHumanDriver({peer:seat?seat.peer:null,nm:p.nm,cd:p.cd,num:p.num,c1:p.c1,c2:p.c2,uid:p.u},t.id,localPeer);d.rkh=1;
    G.drivers[d.id]=d;t.drivers.push(d.id);if(d.me)G.me=d.id;
    const m=newDriver({pace:78+rr(-2,2),team:t.id,age:ri(20,30)});G.drivers[m.id]=m;t.drivers.push(m.id)})}
// nomes e equipes da temporada para mostrar fora da corrida (monta o grid sem mexer no jogo aberto)
function ssnRoster(s){const sw=ssnWorldOf(s);const key=s.id+"|"+s.sd+"|"+JSON.stringify(sw.pl.map(a=>a.slice(0,9)));if(SSN.ck===key&&SSN.cache)return SSN.cache;
  const sv={G,RNG,DID};try{G={mp:true,drivers:{},teams:[],garage:GARAGE0.slice(),settings:{}};RNG=mulberry(s.sd);DID=0;mpAiField();ssnAddRookies(sw,[],null);mpDedupeCodes();
    SSN.cache={teams:G.teams,drivers:G.drivers,ids:G.teams.flatMap(t=>t.drivers)}}finally{G=sv.G;RNG=sv.RNG;DID=sv.DID}SSN.ck=key;return SSN.cache}
function ssnTable(s){const ro=ssnRoster(s);const n=ro.ids.length;const dp=s.dp.length===n?s.dp:new Array(n).fill(0),dw=s.dw.length===n?s.dw:new Array(n).fill(0);
  const drv=ro.ids.map((id,i)=>{const d=ro.drivers[id];const t=ro.teams.find(x=>x.drivers.includes(id));return{i,id,n:d.n,code:d.code,t,pts:dp[i],w:dw[i],rk:!!d.rkh}}).sort((a,b)=>b.pts-a.pts||b.w-a.w||a.i-b.i);
  const tms=ro.teams.map(t=>{const m=drv.filter(x=>x.t===t);return{t,pts:m.reduce((a,b)=>a+b.pts,0),w:m.reduce((a,b)=>a+b.w,0)}}).sort((a,b)=>b.pts-a.pts||b.w-a.w);return{drv,tms,ro}}
// ---------- depois da corrida (só o anfitrião calcula; os outros recebem a temporada pronta)
function ssnAfterRace(cls){const s=MP.ssn;const ids=G.teams.flatMap(t=>t.drivers);const n=ids.length;if(s.dp.length!==n){s.dp=new Array(n).fill(0);s.dw=new Array(n).fill(0)}
  for(const e of cls){const i=ids.indexOf(e.d);if(i<0)continue;s.dp[i]+=e.pts||0;if(e.status==="ok"&&e.pos===1)s.dw[i]++}
  const f=clamp(22/s.cal.length,1,4);const win=cls.find(e=>e.status==="ok"&&e.pos===1);const h=[s.rd,win?ids.indexOf(win.d):-1];
  s.pl.forEach((p,k)=>{const es=cls.filter(e=>e.team==="rk"+k);const pts=es.reduce((a,e)=>a+(e.pts||0),0);const fin=es.filter(e=>e.status==="ok").length;
    const prize=Math.round((50+pts*6+(fin===2?10:0))*f);p.m+=prize;p.lp=prize;const t=G.teams.find(x=>x.id==="rk"+k);const me=t&&cls.find(e=>e.d===t.drivers[0]);h.push(me&&me.status==="ok"?me.pos:0)});
  s.hist.push(h);s.rd++;if(s.rd>=s.cal.length)s.done=1;ssnSave(s)}
function ssnRaceCfg(){const s=MP.ssn;Object.assign(MP.cfg,{tr:s.cal[s.rd],lp:s.lp,wx:s.wx,md:"dif",ss:1,sid:s.id,rd:s.rd,sw:ssnWorldOf(s)})}
// ---------- sincronia na sala
function ssnOnPeers(hp){if(MP.role==="h")ssnHostSync();else if(MP.role==="g")ssnGuestSync(hp)}
function ssnHostSync(){if(MP.role!=="h"||!MP.nr||MP.inRace)return;const s=MP.cfg.ss?MP.ssn:null;if(!s){if(MP.pres.ssn)mpSet({ssn:null});return}let ch=false;
  for(const p of mpPeers()){if(p.sameTab)continue;const v=ssnClean(p.presence.ssv);if(v&&v.id===s.id&&v.rd>s.rd&&v.pl.some(x=>x.u===SSN_ID(p.presence.uid))){Object.assign(s,v);ch=true}}
  const present=[{uid:mpUid(),q:mpId(),team:mpMyTeam(),me:1}];
  for(const p of mpPeers()){if(p.sameTab)continue;const q=p.presence;if(q.role!=="g")continue;const u=SSN_ID(q.uid);if(u.length<6||present.some(x=>x.uid===u))continue;present.push({uid:u,q,team:q})}
  if(s.rd===0&&!s.hist.length){const before=s.pl.map(p=>p.u).join();// até a primeira corrida, entra quem estiver na sala
    s.pl=present.slice(0,4).map(x=>s.pl.find(p=>p.u===x.uid)||ssnPlayer(x.uid,x.q,x.team));if(s.pl.map(p=>p.u).join()!==before){ch=true;s.dp=[];s.dw=[]}}
  for(const x of present){const p=s.pl.find(y=>y.u===x.uid);if(!p)continue;const c=mpCleanId(x.q),t=ssnCleanTeam(x.team);
    for(const k of["nm","cd","num","c1","c2"])if(p[k]!==c[k]){p[k]=c[k];ch=true}for(const k of["tn","tc","tc2"])if(p[k]!==t[k]){p[k]=t[k];ch=true}
    const dq=x.me?null:x.q.dq;// pedidos de evolução valem só para a etapa em que foram feitos
    if(Array.isArray(dq)&&dq[0]===s.id&&dq[1]===s.rd)for(let a=0;a<4;a++){const want=clamp(Math.round(+dq[2+a]||0),0,SSN_MAX);while(p.dv[a]<want&&p.m>=ssnCost(p.dv[a])){p.m-=ssnCost(p.dv[a]);p.dv[a]++;ch=true}}}
  if(ch)ssnSave(s);if(!MP.pres.ssn||MP.pres.ssn.up!==s.up||MP.pres.ssn.id!==s.id||MP.pres.ssn.rd!==s.rd)mpSet({ssn:JSON.parse(JSON.stringify(s))})}
function ssnGuestSync(hp){const v=hp&&hp.ssn&&hp.cfg&&hp.cfg.ss?ssnClean(hp.ssn):null;if(!v){if(hp&&hp.ph!=="race"&&hp.ph!=="res")MP.ssn=null;if(MP.pres.ssv)mpSet({ssv:null});return}
  MP.ssn=v;const mine=ssnLoad(v.id);
  if(mine&&mine.rd>v.rd){if(!MP.pres.ssv||MP.pres.ssv.rd!==mine.rd)mpSet({ssv:mine})}
  else{if(MP.pres.ssv)mpSet({ssv:null});if(v.pl.some(p=>p.u===mpUid())&&(!mine||mine.up!==v.up))ssnSave(v,true)}}
// ---------- ações da sala
function ssnAction(a,k,b){
  if(typeof netAction==="function"&&netAction(a))return true;
  if(a==="mpRejoin"){const[c,r]=String(k).split(":");mpEnter(c,r==="h"?"h":"g");return true}
  if(a==="mpWk"){const[i,v]=String(k).split(":");if((i==="0"&&MP_FO.some(x=>x[0]===v))||(i==="1"&&MP_QR.some(x=>x[0]===v)))mpWkSet(+i,v);mpScreen();return true}
  if(a==="mpTc"||a==="mpTc2"){if(mpHex(k))mpTeamSave({[a==="mpTc"?"tc":"tc2"]:k});mpScreen();return true}
  if(a==="mpSsMode"&&MP.role==="h"){MP.cfg.ss=k==="1"?1:0;if(MP.cfg.ss&&!MP.ssn){const l=ssnList().filter(s=>!s.done);if(l.length)MP.ssn=l[0]}mpSet({cfg:{...MP.cfg}});ssnHostSync();mpLobbyPresence();mpScreen();return true}
  if(a==="mpSsOpt"){const[key,v]=String(k).split(":");if(key==="n"&&SSN_CALS.some(x=>x[0]===+v))SSN.ui.n=+v;if(key==="lp"&&MP_LAPS.some(x=>x[0]===+v))SSN.ui.lp=+v;if(key==="wx"&&MP_WX.some(x=>x[0]===v))SSN.ui.wx=v;if(key==="tab")SSN.ui.tab=v==="tm"?"tm":"drv";mpScreen();return true}
  if(a==="mpSsNew"&&MP.role==="h"){MP.ssn=ssnNew(SSN.ui.n,SSN.ui.lp,SSN.ui.wx);ssnHostSync();ssnSave(MP.ssn);mpScreen();return true}
  if(a==="mpSsLoad"&&MP.role==="h"){const s=ssnLoad(k);if(s){MP.ssn=s;ssnHostSync()}mpScreen();return true}
  if(a==="mpSsClose"&&MP.role==="h"){MP.ssn=null;ssnHostSync();mpScreen();return true}
  if(a==="mpSsDel"){if(SSN.sure!==k){SSN.sure=k;b.textContent="Toque de novo para apagar";return true}SSN.sure="";ssnDelete(k);if(MP.ssn&&MP.ssn.id===k&&MP.role==="h"){MP.ssn=null;ssnHostSync()}mpScreen();return true}
  if(a==="mpSsUp"){const s=MP.ssn;const ai=+k;if(!s||!(ai>=0&&ai<4)||s.done)return true;const p=s.pl.find(x=>x.u===mpUid());if(!p)return true;
    if(MP.role==="h"){if(p.dv[ai]<SSN_MAX&&p.m>=ssnCost(p.dv[ai])){p.m-=ssnCost(p.dv[ai]);p.dv[ai]++;ssnSave(s);ssnHostSync()}}
    else{const cur=Array.isArray(MP.pres.dq)&&MP.pres.dq[0]===s.id&&MP.pres.dq[1]===s.rd?MP.pres.dq.slice(2,6):p.dv.slice();const want=cur.map((x,i)=>Math.max(x,p.dv[i]));if(want[ai]<SSN_MAX)want[ai]++;mpSet({dq:[s.id,s.rd,...want]})}
    mpScreen();return true}
  return false}
// ---------- telas
function mpRowTeam(q,same,hostTm,ss){if(ss){const p=MP.ssn&&MP.ssn.pl.find(x=>x.u===SSN_ID(q.uid));return p?{n:p.tn,c:p.tc,in:1}:{n:MP.ssn?"fora desta temporada":"temporada ainda não escolhida",c:"#555"}}return mpTeam(same?hostTm:q.tm)}
function mpRoomView(){const amH=MP.role==="h";const host=mpHostPeer();const hp=(host&&host.presence)||{};const cfg=amH?MP.cfg:mpCleanCfg(hp.cfg);const ss=!!cfg.ss;
  const same=!ss&&cfg.md==="mesma",hostTm=amH?MP.tm:(mpTeams().includes(hp.tm)?hp.tm:"mercedes");
  const players=mpPeers().slice().sort((a,b)=>(b.presence.role==="h")-(a.presence.role==="h")||(a.sameTab?-1:0));
  const seats=amH?mpSeats():null,prob=amH?mpSeatProblem(seats):"";const max=same?2:4;
  const taken={};if(!ss)players.forEach(p=>{const q=p.presence;if(!p.sameTab&&(q.role==="h"||q.rdy)&&mpTeams().includes(q.tm))taken[q.tm]=mpCleanId(q).cd});
  const live=!amH&&hp.ph==="race";const s=MP.ssn;const inSs=ss&&s&&s.pl.some(p=>p.u===mpUid());
  const plRows=players.map(p=>{const q=p.presence,c=mpCleanId(q),isH=q.role==="h";const t=mpRowTeam(q,same,hostTm,ss);const ok=isH||q.rdy;
      return`<div class="mprow${p.sameTab?" me":""}">${helmetSVG(c.c1,c.c2,30)}<div style="min-width:0;flex:1"><b>${esc(c.nm)}</b> <span class="muted num">${c.cd} · #${c.num}</span>${isH?` <span class="pill">anfitrião</span>`:""}${p.sameTab?` <span class="pill">você</span>`:""}
       <div class="muted" style="font-size:12.5px">${teamLogo(t,"tc")}${esc(t.n)} · largada de ${TYRES[q.ty]?TYRES[q.ty].n.toLowerCase():"médio"}</div></div><span class="pill ${ok?"good":""}">${ok?"pronto":"escolhendo"}</span></div>`}).join("");
  const modeSeg=amH&&SSN_ON?`<div class="seg" style="margin-bottom:10px">${[["0","Corrida avulsa"],["1","Temporada"]].map(([v,n])=>`<button data-act="mpSsMode" data-k="${v}" class="${String(cfg.ss)===v?"on":""}">${n}</button>`).join("")}</div>`:"";
  const raceCard=`<div class="card"><h3>${ss?"Temporada":"Corrida"}</h3>${modeSeg}${ss?(amH?ssnHostCard():ssnGuestCard()):(amH?mpCfgEditor(cfg):mpCfgView(cfg))}</div>`;
  const teamCard=ss?ssnTeamCard(inSs):(same&&!amH?`<p>Modo mesma equipe: você corre na <b>${esc(mpTeam(hostTm).n)}</b>, como companheiro do anfitrião.</p>`:
     `<div class="tpick">${TEAMS0.slice().sort((a,b)=>b.tier-a.tier).map((t,i)=>{const tk=!same&&taken[t.id]&&MP.tm!==t.id?taken[t.id]:"";return`<button class="tchip${MP.tm===t.id?" on":""}" data-act="mpTeam" data-k="${t.id}"${tk?" disabled":""}><i style="background:${t.c}"></i><b>${esc(t.n)}</b><small>${i+1}º carro do grid${tk?` · com ${esc(tk)}`:""}</small></button>`}).join("")}</div>`);
  const wk=mpWk();const canRace=!ss||inSs;
  const goRow=amH?`<button class="btn go" data-act="mpGo"${prob?" disabled":""}>${ss&&s?`Largar: ${esc(CIR[s.cal[Math.min(s.rd,s.cal.length-1)]].gp)}`:seats.length<2?"Largar sem esperar":"Largar"}</button>${prob?`<span class="pill bad" style="white-space:normal">${esc(prob)}</span>`:`<span class="muted" style="font-size:13px">${seats.length} piloto${seats.length>1?"s":""} no grid${seats.length<2?": ninguém marcou pronto ainda":""}</span>`}`
    :canRace?`<button class="btn ${MP.rdy?"on":"go"}" data-act="mpReady"${live?" disabled":""}>${MP.rdy?"Pronto ✓":"Estou pronto"}</button><span class="muted" style="font-size:13px">${MP.rdy?"Esperando o anfitrião largar. Toque de novo para mudar algo.":"Faça as escolhas e avise que está pronto."}</span>`
    :`<span class="muted" style="font-size:13px">Você não faz parte desta temporada: assiste às corridas.</span>`;
  app.innerHTML=`<div class="mpw"><div class="row" style="justify-content:space-between"><h2>Sala <span class="codebox" id="mpCodeTxt">${esc(MP.code.toUpperCase())}</span></h2><div class="row"><button class="btn sm" data-act="mpCopy">Copiar código</button><button class="btn sm" data-act="mpLeave">Sair da sala</button></div></div>
   ${!host&&!amH?`<p class="pill warn">Esperando o anfitrião aparecer nesta sala. Confira o código.</p>`:""}${live?`<p class="pill warn">Há uma corrida em andamento: você entra nela assim que ela aparecer aqui.</p>`:""}
   <div class="grid2">
    <div class="card"><h3>Pilotos na sala</h3><div class="mpl">${plRows}</div>
     <p class="muted" style="font-size:12.5px">${ss?"Na temporada, cada jogador tem a própria equipe estreante. Até 4 jogadores.":`Correm até ${max} pilotos${same?", os dois na mesma equipe":""}. Quem passar disso assiste.`}</p></div>
    ${raceCard}
    ${ss&&s?ssnStandCard(s):""}
    <div class="card" style="grid-column:1/-1"><h3>${ss?"Sua equipe estreante":"Sua equipe"}</h3>${teamCard}
     ${canRace?`<h3>Treino livre</h3><div class="tpick">${MP_FO.map(([v,n,d])=>`<button class="tchip ni${wk[0]===v?" on":""}" data-act="mpWk" data-k="0:${v}"><b>${n}</b><small>${d}</small></button>`).join("")}</div>
     <h3>Classificação</h3><div class="seg">${MP_QR.map(([v,n])=>`<button data-act="mpWk" data-k="1:${v}" class="${wk[1]===v?"on":""}">${n}</button>`).join("")}</div>
     <h3>Pneu de largada ${ib("compostos")}</h3><div class="row">${["S","M","H"].map(c=>`<button class="btn sm${MP.ty===c?" on":""}" data-act="mpTyre" data-k="${c}">${tyreBadge(c)} ${COMP[c].n}</button>`).join("")}</div>`:""}
     <div class="row" style="margin-top:12px">${goRow}</div></div></div></div>`}
function ssnCalLine(s){const C=CIR[s.cal[Math.min(s.rd,s.cal.length-1)]];return s.done?`<p><b>Temporada encerrada</b> · ${s.cal.length} GPs</p>`:`<p>Próxima: <b>${esc(C.gp)}</b> · etapa ${s.rd+1} de ${s.cal.length}</p>
  <div class="kv"><span>Distância</span><b>${(MP_LAPS.find(x=>x[0]===s.lp)||[0,"Rápida"])[1]} · ${Math.max(5,Math.round(C.laps*s.lp))} voltas</b></div><div class="kv"><span>Clima</span><b>${(MP_WX.find(x=>x[0]===s.wx)||[0,"Seco"])[1]}</b></div>
  <div class="muted" style="font-size:12.5px;margin-top:6px">${s.cal.slice(s.rd+1,s.rd+4).map(id=>esc(CIR[id].gp)).join(" · ")}${s.cal.length-s.rd>4?" …":""}</div>`}
function ssnHostCard(){const s=MP.ssn;
  if(s)return`<p class="muted" style="font-size:12.5px">${esc(s.nm)}</p>${ssnCalLine(s)}${s.done?ssnChampLine(s):""}<div class="row" style="margin-top:8px"><button class="btn sm" data-act="mpSsClose">Trocar de temporada</button></div>`;
  const list=ssnList();const u=SSN.ui;
  return`<h4 class="ag">Nova temporada</h4><div class="seg">${SSN_CALS.map(([v,n,d])=>`<button data-act="mpSsOpt" data-k="n:${v}" class="${u.n===v?"on":""}">${n} · ${d}</button>`).join("")}</div>
   <h4 class="ag">Distância</h4><div class="seg">${MP_LAPS.map(([v,n])=>`<button data-act="mpSsOpt" data-k="lp:${v}" class="${u.lp===v?"on":""}">${n}</button>`).join("")}</div>
   <h4 class="ag">Clima</h4><div class="seg">${MP_WX.map(([v,n])=>`<button data-act="mpSsOpt" data-k="wx:${v}" class="${u.wx===v?"on":""}">${n}</button>`).join("")}</div>
   <div class="row" style="margin-top:10px"><button class="btn go" data-act="mpSsNew">Criar temporada</button><span class="muted" style="font-size:12.5px">Quem estiver na sala até a 1ª corrida entra com a própria equipe.</span></div>
   ${list.length?`<h4 class="ag">Continuar uma temporada salva</h4><div class="ansl">${list.slice(0,5).map(x=>`<div class="row" style="flex-wrap:nowrap"><button class="proj" style="flex:1;min-width:0" data-act="mpSsLoad" data-k="${x.id}"><span class="tag">${x.done?"ENCERRADA":`ETAPA ${x.rd+1} DE ${x.cal.length}`}</span><b>${esc(x.nm)}</b><small>${x.pl.map(p=>esc(p.tn)).join(" × ")}</small></button><button class="btn sm" data-act="mpSsDel" data-k="${x.id}" aria-label="apagar temporada">Apagar</button></div>`).join("")}</div>`:""}`}
function ssnGuestCard(){const s=MP.ssn;if(!s)return`<p class="muted">O anfitrião está escolhendo a temporada…</p>`;return`<p class="muted" style="font-size:12.5px">${esc(s.nm)}</p>${ssnCalLine(s)}${s.done?ssnChampLine(s):""}<p class="muted" style="font-size:12.5px">Quem escolhe a temporada é o anfitrião. Ela fica salva no seu aparelho também: qualquer um de vocês pode abrir a sala na próxima vez.</p>`}
function ssnChampLine(s){const T=ssnTable(s);const d=T.drv[0],t=T.tms[0];return`<p class="pill good" style="white-space:normal">🏆 Campeão: <b>${esc(d.n)}</b> (${d.pts} pts) · Construtores: <b>${esc(t.t.n)}</b></p>`}
function ssnStandCard(s){const T=ssnTable(s);const tab=SSN.ui.tab;const me=mpUid();const myTeam=(()=>{const k=s.pl.findIndex(p=>p.u===me);return k>=0?"rk"+k:""})();
  const rows=tab==="tm"?T.tms.map((x,i)=>({i,show:i<6||x.t.rk,html:`<tr class="${x.t.id===myTeam?"me":""}"><td class="num">${i+1}</td><td>${teamLogo(x.t,"tc")}${esc(x.t.n)}${x.t.rk?` <span class="pill">estreante</span>`:""}</td><td class="num">${x.w||""}</td><td class="num"><b>${x.pts}</b></td></tr>`}))
    :T.drv.map((x,i)=>({i,show:i<8||x.rk,html:`<tr class="${x.t&&x.t.id===myTeam&&x.rk?"me":""}"><td class="num">${i+1}</td><td><b>${esc(x.code)}</b> ${esc(x.n)}<div class="muted" style="font-size:11.5px"><span class="tc" style="background:${x.t?x.t.c:"#888"}"></span>${esc(x.t?x.t.n:"")}</div></td><td class="num">${x.w||""}</td><td class="num"><b>${x.pts}</b></td></tr>`}));
  let last=-1;const body=rows.filter(r=>r.show).map(r=>{const gap=last>=0&&r.i>last+1?`<tr><td colspan="4" class="muted" style="text-align:center">⋯</td></tr>`:"";last=r.i;return gap+r.html}).join("");
  return`<div class="card"><h3>Campeonato</h3><div class="seg" style="margin-bottom:8px">${[["drv","Pilotos"],["tm","Construtores"]].map(([v,n])=>`<button data-act="mpSsOpt" data-k="tab:${v}" class="${tab===v?"on":""}">${n}</button>`).join("")}</div>
   <div class="tw"><table><thead><tr><th>#</th><th>${tab==="tm"?"Equipe":"Piloto"}</th><th>Vit.</th><th>Pts</th></tr></thead><tbody>${body}</tbody></table></div>
   ${s.hist.length?`<p class="muted" style="font-size:12px">Última etapa: ${esc(CIR[s.cal[s.hist[s.hist.length-1][0]]].gp)} · vitória de ${esc((T.drv.find(x=>x.i===s.hist[s.hist.length-1][1])||{n:"—"}).n)}</p>`:""}</div>`}
function ssnTeamCard(inSs){const s=MP.ssn;const t=mpMyTeam();const p=s&&s.pl.find(x=>x.u===mpUid());
  const look=`<div class="row" style="align-items:flex-end"><label class="fl" style="flex:1;min-width:180px"><span>Nome da equipe</span><input class="txt" id="mpTn" maxlength="24" value="${esc(t.tn)}" autocomplete="off"></label>
     <div class="ssncar" aria-hidden="true" style="--c1:${t.tc};--c2:${t.tc2}"><i></i><b></b></div></div>
   <div class="muted" style="font-size:12.5px;margin-top:6px">Cor principal</div><div class="swatches">${HELMETS.map(c=>`<button class="sw${t.tc===c?" on":""}" style="background:${c}" data-act="mpTc" data-k="${c}" aria-label="cor principal ${c}"></button>`).join("")}</div>
   <div class="muted" style="font-size:12.5px">Cor dos detalhes</div><div class="swatches">${HELMETS.map(c=>`<button class="sw${t.tc2===c?" on":""}" style="background:${c}" data-act="mpTc2" data-k="${c}" aria-label="cor dos detalhes ${c}"></button>`).join("")}</div>`;
  if(!s)return look+`<p class="muted" style="font-size:12.5px">Quando a temporada for escolhida, aqui aparecem o dinheiro e as evoluções do carro.</p>`;
  if(!p)return look+`<p class="pill warn" style="white-space:normal">Esta temporada já começou sem você. Você assiste às corridas e pode correr numa temporada nova.</p>`;
  const pend=MP.role==="g"&&Array.isArray(MP.pres.dq)&&MP.pres.dq[0]===s.id&&MP.pres.dq[1]===s.rd?MP.pres.dq.slice(2,6):null;const car=ssnCar(p.dv);
  return look+`<h3>Caixa da equipe: <span class="num">${fmtM(p.m)}</span>${p.lp?` <small class="muted">(+${fmtM(p.lp)} na última corrida)</small>`:""}</h3>
   <div class="ssnup">${SSN_AREAS.map(([k,n,d],i)=>{const lv=p.dv[i],cost=ssnCost(lv),w=pend&&pend[i]>lv;const can=!s.done&&lv<SSN_MAX&&p.m>=cost;
     return`<div class="ssnrow"><div style="min-width:0;flex:1"><b>${n}</b> <small class="muted">${d}</small><div class="lvbar">${Array.from({length:SSN_MAX},(_,j)=>`<i class="${j<lv?"on":""}"></i>`).join("")}</div></div>
      ${lv>=SSN_MAX?`<span class="pill good">máximo</span>`:w?`<span class="pill">pedido enviado</span>`:`<button class="btn sm${can?" go":""}" data-act="mpSsUp" data-k="${i}"${can?"":" disabled"}>Evoluir · ${fmtM(cost)}</button>`}</div>`}).join("")}</div>
   <p class="muted" style="font-size:12.5px">Carro: aerodinâmica ${car.aero} · motor ${car.eng} · chassi ${car.chas} · confiabilidade ${car.rel}. As evoluções entram na próxima corrida. Prêmio igual para todos: 5 mi por corrida, mais 0,6 mi por ponto da equipe${s.cal.length<22?` (multiplicado por ${(clamp(22/s.cal.length,1,4)).toFixed(1).replace(".",",")} na temporada mais curta)`:""}.</p>`}
// ---------- resultado da corrida online (avulsa ou da temporada)
function mpResultsStep(){const cls=mpResCls();const el=$("#wk");const amH=MP.role==="h";const ss=!!MP.cfg.ss;
  if(!cls){el.innerHTML=`<div class="card"><h3>${MP.lost?"Corrida encerrada":"Resultado"}</h3><p class="muted">${MP.lost?"O anfitrião saiu ou encerrou a corrida antes da bandeirada.":"Esperando o resultado oficial do anfitrião…"}</p><button class="btn" data-act="mpBack">Voltar à sala</button></div>`;return}
  const hum=cls.filter(e=>G.drivers[e.d]&&(G.drivers[e.d].hum||G.drivers[e.d].rkh));const s=ss&&MP.ssn&&MP.ssn.id===MP.cfg.sid?MP.ssn:null;
  const rowsH=hum.map(e=>{const d=G.drivers[e.d],t=teamOf(e.team);const h=d.helmet||["#FFD400","#1B998B"];const k=s&&/^rk\d$/.test(e.team)?+e.team.slice(2):-1;const p=k>=0?s.pl[k]:null;
     const tp=cls.filter(x=>x.team===e.team).reduce((a,x)=>a+(x.pts||0),0);
     return`<div class="mprow${d.me?" me":""}">${helmetSVG(h[0],h[1],30)}<div style="min-width:0;flex:1"><b>${esc(d.n)}</b>${d.me?` <span class="pill">você</span>`:""}<div class="muted" style="font-size:12.5px">${teamLogo(t,"tc")}${esc(t.n)}${e.pen?` · ${e.pen}s de punição`:""}${s?` · equipe fez ${tp} pts${p&&p.lp?` · prêmio +${fmtM(p.lp)}`:""}`:""}</div></div><b class="num" style="font-size:20px">${e.status==="ok"?e.pos+"º":e.status.toUpperCase()}</b></div>`}).join("");
  const next=s?(s.done?`<p class="pill good" style="white-space:normal">Fim da temporada!</p>${ssnChampLine(s)}`:`<p class="muted" style="font-size:13px">Próxima etapa: <b>${esc(CIR[s.cal[s.rd]].gp)}</b> (${s.rd+1} de ${s.cal.length}). Na sala dá para evoluir o carro antes de largar.</p>`):"";
  el.innerHTML=`<div class="grid2"><div class="card"><h3>${s?"Suas equipes":"Duelo online"}</h3>${rowsH}${next}
     <div class="row" style="margin-top:10px">${amH?`<button class="btn go" data-act="mpAgain">${s?(s.done?"Voltar à sala":"Ir para a próxima etapa"):"Nova corrida na sala"}</button>`:`<span class="muted" style="font-size:13px">O anfitrião decide a próxima corrida: a sala abre de novo sozinha.</span>`}<button class="btn" data-act="mpBack">Voltar à sala</button></div></div>
   ${s?ssnStandCard(s):""}
   <div class="card" style="grid-column:1/-1"><h3>Classificação final</h3>${resultTable(cls)}</div></div>`}
// ---------- mensagem do grid (resultado da classificação dos jogadores)
function mpGridNote(){const hs=W.grid.map((id,i)=>({d:G.drivers[id],p:i+1})).filter(x=>x.d&&(x.d.hum||x.d.rkh));if(!hs.length)return;const pole=G.drivers[W.grid[0]];
  rcMsg(`Classificação: pole de ${pole.code}. ${hs.map(x=>`${x.d.code} larga em ${x.p}º`).join(", ")}.`,"")}
// campos do nome da equipe (a tela da sala chama mpBind; aqui liga o campo novo)
(function(){if(typeof mpBind!=="function")return;const base=mpBind;window.mpBind=function(){base();const e=$("#mpTn");if(e)e.addEventListener("change",()=>{mpTeamSave({tn:e.value});mpScreen()})}})();
