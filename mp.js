// ===================== MULTIPLAYER: SALA ONLINE E CORRIDA COMPARTILHADA =====================
// Quem cria a sala (anfitrião) roda a simulação. O estado da corrida vai para os outros jogadores pelo "presence" da sala
// (um objeto de até 4 KiB, ~10 vezes por segundo). Os outros mandam os comandos pelo próprio presence, sempre como estado
// absoluto (ritmo, energia, pedido de box, resposta ao rádio, tempo de reação). Assim qualquer pessoa com acesso à página
// joga, sem permissão especial. Nada do modo online entra no save da carreira.
const MP={st:"off",room:null,nr:null,code:null,role:null,view:"home",conn:false,err:"",
  cfg:{tr:"interlagos",lp:.15,wx:"seco",md:"dif"},tm:null,ty:"M",rdy:false,pres:{},
  seq:0,log:[],lastPub:0,saved:null,snaps:[],lastS:null,lastLg:null,lastSeq:0,cmd:null,res:null,curSd:null,inRace:false,spect:false,sig:""};
const MP_TY=["S","M","H","I","W"],MP_VIS=["","spin","off","crash","wide"],MP_MODE=["attack","normal","save"],MP_ERS=["auto","attack","defend","save"];
const MP_ALPH="abcdefghjkmnpqrstuvwxyz23456789",MP_FX=["skid","sparks","parts","puff","debris","smoke","dust"],MP_CLS=["","bad","warn","big","good"];
const MP_LAPS=[[.15,"Rápida"],[.25,"Curta"],[.5,"Média"]],MP_WX=[["seco","Seco"],["auto","Aleatório"],["chuva","Chuva"]];
// fim de semana: foco do treino livre e estilo da classificação (valores fixos e iguais para todos os jogadores)
const MP_FO=[["setup","Acerto do carro","carro 82% acertado"],["quali","Simulação de classificação","volta lançada mais forte"],["learn","Aprender a pista","menos erros na corrida"]],MP_QR=[["safe","Seguro"],["normal","Normal"],["risky","No limite"]];
const MP_DELAY=.22;// atraso igual para os comandos do anfitrião (o convidado tem o atraso da rede)
function mpCodeGen(){let s="";for(let i=0;i<4;i++)s+=MP_ALPH[Math.floor(Math.random()*MP_ALPH.length)];return s}
function mpHex(x){return typeof x==="string"&&/^#[0-9A-Fa-f]{6}$/.test(x)?x:null}
function mpTeams(){return TEAMS0.map(t=>t.id)}
function mpCleanId(o){o=o||{};return{nm:String(o.nm||"Piloto").replace(/[\u0000-\u001f\u007f-\u009f<>]/g,"").trim().slice(0,24)||"Piloto",
  cd:(String(o.cd||"").normalize("NFD").replace(/[^A-Za-z]/g,"").toUpperCase()+"XXX").slice(0,3),num:clamp(Math.round(+o.num||7),2,99),c1:mpHex(o.c1)||"#FFD400",c2:mpHex(o.c2)||"#1B998B"}}
function mpCleanCfg(c){c=c||{};return{tr:CIR[c.tr]?c.tr:"interlagos",lp:MP_LAPS.some(x=>x[0]===+c.lp)?+c.lp:.15,wx:MP_WX.some(x=>x[0]===c.wx)?c.wx:"seco",md:c.md==="mesma"?"mesma":"dif",sd:Math.abs(Math.round(+c.sd||0))%2147483647,ss:c.ss?1:0,sid:String(c.sid||"").replace(/[^a-z0-9]/g,"").slice(0,12),rd:clamp(Math.round(+c.rd||0),0,30),sw:c.ss&&c.sw&&typeof ssnCleanWorld==="function"?ssnCleanWorld(c.sw):null}}
// ---------- identidade (nome, sigla, número e capacete)
function mpId(){if(MP.id)return MP.id;let o=null;try{o=JSON.parse(localStorage.getItem("paddock-mp-id")||"null")}catch(e){}
  const CG=MP.saved?MP.saved.G:G;const me=CG&&CG.drivers&&CG.drivers[CG.me];
  MP.id=mpCleanId(Object.assign({nm:me?me.n:"Piloto",cd:me?me.code:"PIL",num:me?me.num:ri(2,99),c1:CG&&CG.helmet?CG.helmet.c1:"#FFD400",c2:CG&&CG.helmet?CG.helmet.c2:"#1B998B"},o||{}));return MP.id}
function mpIdSave(){try{localStorage.setItem("paddock-mp-id",JSON.stringify(MP.id))}catch(e){}}
// ---------- conexão com a sala
async function mpConnect(){if(MP.room)return MP.room;if(MP.st==="connecting")return null;MP.st="connecting";mpRefresh();
  let r=null;try{r=window.claude&&typeof window.claude.use==="function"?await window.claude.use("room"):null}catch(e){r=null}MP.net=r?"claude":"";
  if(!r&&typeof netRoom==="function"&&netConfig()){try{r=await netRoom()}catch(e){r=null;MP.err="Não deu para ligar no servidor online: "+String((e&&e.message)||"erro").slice(0,120)}if(r)MP.net="fb"}
  if(!r){MP.st="none";mpRefresh();return null}
  MP.room=r;MP.st="ok";
  r.onConnection(c=>{MP.conn=c;mpRefresh()},e=>{MP.st="none";MP.err=(e&&e.code)||"";mpRefresh()});
  r.onPeers(()=>{if(UI.scr==="mp"&&MP.view==="home")mpRefresh()});
  mpLobbyPresence();mpRefresh();return r}
function mpLobbyPresence(){if(!MP.room||MP.nr===MP.room)return;const id=mpId();const open=MP.role==="h"&&MP.nr?MP.code:null;
  MP.room.presence({app:"pdk",v:1,nm:id.nm,cd:id.cd,c1:id.c1,open,tr:open?MP.cfg.tr:null,md:open?MP.cfg.md:null,ph:open?(MP.pres.ph||"lobby"):null}).catch(()=>{})}
function mpPeersAll(){return MP.nr?MP.nr.peers():[]}
function mpPeers(){return mpPeersAll().filter(p=>p.kind==="viewer"&&p.presence&&p.presence.rm===MP.code)}
function mpSelf(){return mpPeersAll().find(p=>p.sameTab)||null}
function mpHostPeer(){if(MP.role==="h")return mpSelf();return mpPeers().filter(p=>p.presence.role==="h"&&!p.sameTab).sort((a,b)=>(+a.presence.since||0)-(+b.presence.since||0))[0]||null}
// presence com limite de 4 KiB: se passar, corta os eventos mais antigos
const MP_ENC=typeof TextEncoder!=="undefined"?new TextEncoder():null;
function mpBytes(o){const s=JSON.stringify(o);return MP_ENC?MP_ENC.encode(s).length:s.length*2}
function mpSet(patch){for(const k in patch){if(patch[k]===null)delete MP.pres[k];else MP.pres[k]=patch[k]}
  let n=0;while(mpBytes(MP.pres)>3900&&MP.pres.lg&&MP.pres.lg.length&&n++<30){MP.pres.lg=MP.pres.lg.slice(1);patch.lg=MP.pres.lg}
  if(!MP.nr)return Promise.resolve();return MP.nr.presence(patch).catch(e=>{MP.err=(e&&e.code)||""})}
async function mpEnter(code,role){code=String(code||"").toLowerCase().replace(/^\s*pdk-?/,"").replace(/[^a-z0-9]/g,"").slice(0,8);
  if(code.length<3){MP.err="Digite o código da sala (4 letras ou números).";mpRefresh();return}
  const r=await mpConnect();if(!r)return;let nr=null;
  try{nr=await r.join("pdk-"+code)}catch(e){nr=null}
  if(!nr)nr=r;// sem salas separadas: usa a sala geral e filtra pelo código
  if(MP.nr&&MP.nr!==nr&&MP.nr!==MP.room)MP.nr.leave().catch(()=>{});
  if(MP.unsub)MP.unsub();MP.nr=nr;MP.code=code;MP.role=role;MP.view="room";MP.rdy=false;MP.res=null;MP.pres={};MP.err="";MP.sig="";
  if(!MP.tm)MP.tm=role==="h"?"mercedes":"ferrari";const id=mpId();
  MP.unsub=nr.onPeers(()=>mpOnPeers());
  const base={v:1,rm:code,role,nm:id.nm,cd:id.cd,c1:id.c1,c2:id.c2,num:id.num,tm:MP.tm,ty:MP.ty,uid:mpUid(),wk:mpWk(),...mpTeamPres()};mpRemember(code,role);
  if(role==="h")Object.assign(base,{since:Date.now(),ph:"lobby",cfg:{...MP.cfg}});else Object.assign(base,{rdy:false});
  await mpSet(base);mpLobbyPresence();UI.scr="mp";render()}
async function mpLeaveRoom(){mpBgStop();if(MP.unsub){MP.unsub();MP.unsub=null}
  if(MP.nr&&MP.nr!==MP.room)await MP.nr.leave().catch(()=>{});else if(MP.nr)await MP.nr.presence({rm:null,role:null,ph:null,cfg:null,seats:null,grid:null,s:null,lg:null,res:null,cmd:null,ans:null,go:null,rdy:null,uid:null,wk:null,tn:null,tc:null,tc2:null,ssn:null,ssv:null,dq:null}).catch(()=>{});
  MP.nr=null;MP.code=null;MP.role=null;MP.view="home";MP.pres={};MP.inRace=false;mpLobbyPresence()}
function mpRestoreCareer(){if(MP.saved){G=MP.saved.G;W=MP.saved.W;R=MP.saved.R;MP.saved=null}}
// ---------- o mundo da corrida online: mesmas equipes e pilotos em todos os aparelhos (sorteio com a mesma semente)
function mpPlan(ty){return{S:"B",M:"A",H:"C"}[ty]||"A"}
function mpSeatArr(s){return[s.peer,s.nm,s.cd,s.c1,s.c2,s.num,s.tm,s.ty,s.uid||"",s.fo||"setup",s.qr||"normal"]}
function mpSeatObj(a){if(!Array.isArray(a)||typeof a[0]!=="string")return null;const c=mpCleanId({nm:a[1],cd:a[2],c1:a[3],c2:a[4],num:a[5]});return{peer:a[0].slice(0,64),...c,tm:mpTeams().includes(a[6])||/^rk[0-3]$/.test(a[6])?a[6]:"ferrari",ty:["S","M","H"].includes(a[7])?a[7]:"M",uid:String(a[8]||"").replace(/[^a-z0-9]/g,"").slice(0,16),fo:MP_FO.some(x=>x[0]===a[9])?a[9]:"setup",qr:MP_QR.some(x=>x[0]===a[10])?a[10]:"normal"}}
function mpDedupeCodes(){const used=new Set();Object.values(G.drivers).sort((x,y)=>(y.hum||y.rkh?1:0)-(x.hum||x.rkh?1:0)).forEach(d=>{let c=d.code;if(used.has(c)){const L=d.n.split(" ").pop().normalize("NFD").replace(/[^A-Za-z]/g,"").toUpperCase()+"XXXX";const F=(d.n[0]||"X").toUpperCase();
  const cands=[L[0]+L[1]+L[3],L[0]+L[2]+L[3],F+L[0]+L[1],L.slice(0,2)+F,L[0]+L[1]+"X",L[0]+"Z"+L[1]];c=cands.find(x=>x&&x.length===3&&!used.has(x))||"X"+String(used.size).padStart(2,"0")}d.code=c;used.add(c)})}
function mpBuildWorld(cfg,L,localPeer){if(!MP.saved)MP.saved={G,W,R};const CG=MP.saved.G;
  const hud=CG&&CG.settings&&CG.settings.hud?JSON.parse(JSON.stringify(CG.settings.hud)):undefined;const snd=CG?CG.settings.sound!==false:true;const id=mpId();
  RNG=mulberry((cfg.ss&&cfg.sw?cfg.sw.sd:cfg.sd)||1);DID=0;
  G={v:1,mp:true,garage:GARAGE0.slice(),year:2026,season:1,round:0,calendar:[cfg.tr],settings:{dist:cfg.lp,sound:snd,hud},drivers:{},teams:[],results:[],news:[],articles:[],phase:"weekend",social:{feed:[],trends:[]},
    fame:{pop:30,rep:30,followers:20000},money:0,trust:60,rel:{},h2h:{q:[0,0],r:[0,0]},xp:0,train:"auto",ach:{},history:[],offers:[],pending:[],mood:"neutro",gameOver:null,engineer:"Engenheiro",rival:null,helmet:{c1:id.c1,c2:id.c2}};
  mpAiField();
  if(cfg.ss&&cfg.sw)ssnAddRookies(cfg.sw,L,localPeer);
  else L.forEach(s=>{const t=G.teams.find(x=>x.id===s.tm)||G.teams[0];const slot=t.drivers.findIndex(x=>!G.drivers[x].hum);if(slot<0)return;delete G.drivers[t.drivers[slot]];
    const d=mpHumanDriver(s,t.id,localPeer);G.drivers[d.id]=d;t.drivers[slot]=d.id;if(d.me)G.me=d.id});
  mpDedupeCodes();if(cfg.ss&&cfg.sw)RNG=mulberry(cfg.sd||1);
  mpWorldTrack(cfg,L)}
function mpHumanDriver(s,tid,localPeer){const d=newDriver({n:s.nm,code:s.cd,nat:"BRA",pace:84,team:tid,num:s.num,age:24});for(const a in d.a)d.a[a]=84;d.trait=null;d.morale=75;d.pers={aggr:60,disc:70};d.exp={yrs:5,starts:100,wet:12,laps:{}};
  if(s.peer){d.hum=s.peer;d.me=s.peer===localPeer}d.uid=s.uid||"";d.helmet=[s.c1,s.c2];return d}
// as 11 equipes reais com os pilotos da IA (mesma semente = mesmos pilotos em todos os aparelhos)
function mpAiField(){for(const t0 of TEAMS0){const t={...t0,car:{},drivers:[]};for(const k of["aero","chas","susp","brk","rel"])t.car[k]=clamp(Math.round(t0.tier+rr(-2,2)),60,97);t.car.eng=Math.round(88+(PU[t0.pu].power-1)*250+(t0.tier-84)*.4);G.teams.push(t)}
  for(const t of G.teams)for(let i=0;i<2;i++){const d=newDriver({pace:t.tier-6+(i?rr(-5,1):rr(-1,4)),team:t.id,age:ri(21,36)});G.drivers[d.id]=d;t.drivers.push(d.id)}}
// pista, clima, acerto e fim de semana de cada jogador
function mpWorldTrack(cfg,L){
  const C=CIR[cfg.tr];const geo=buildCircuit(C.id);calibrate(geo);prepGeo(geo);
  W={track:C.id,C,geo,step:"race",practice:{},quali:null,grid:null,setup:{},knowWear:true,laps:Math.max(5,Math.round(C.laps*cfg.lp)),sprint:false,mp:true,preBy:{},qualiRain:null};
  const plan=[];if(cfg.wx==="chuva")plan.push({s:0,e:W.laps+2,int:rnd()<.3?2:1});
  else if(cfg.wx==="auto"&&rnd()<Math.max(.3,C.rain*1.5)){const s=Math.floor(rr(.1,.7)*W.laps),len=Math.max(2,Math.round(rr(.2,.5)*W.laps));plan.push({s,e:Math.min(W.laps+2,s+len),int:rnd()<.3?2:1})}
  W.weather=plan;G.teams.forEach(t=>teamDrivers(t).forEach(d=>{W.setup[d.id]=d.hum?.75:rr(.55,.9)}));
  // treino livre e classificação de cada jogador (mesmos números para todos)
  W.qRisk={};W.qb={};L.forEach(s=>{const d=Object.values(G.drivers).find(x=>x.hum&&x.hum===s.peer);if(!d)return;W.qRisk[d.id]=s.qr||"normal";
    if(s.fo==="quali"){W.setup[d.id]=.7;W.qb[d.id]=.12}else if(s.fo==="learn"){W.setup[d.id]=.68;addTrackLaps(d,C.id,45)}else W.setup[d.id]=.82});
  L.forEach(s=>{const d=Object.values(G.drivers).find(x=>x.hum===s.peer);if(d&&!d.me)W.preBy[d.id]={plan:mpPlan(s.ty),tyre:s.ty,fuel:"normal"}});
  RNG=Math.random;buildTrack(geo)}
function mpInitRace(){R.mp=true;const now=performance.now();R.cars.forEach((c,i)=>{c.idx=i;if(c.d.hum){c.peer=c.d.hum;c.uid=c.d.uid||"";c.lastSeen=now}})}
// comandos do anfitrião com o mesmo atraso que os do convidado levam pela rede
function hostCmd(fn){if(R&&R.mpHost&&R.cars.some(c=>c.peer&&!c.isP&&!c.gone)){setTimeout(()=>{if(R&&!R.over)fn()},MP_DELAY*1000);return}fn()}
// ---------- anfitrião: abre a corrida, aplica os comandos dos outros e publica o estado
function mpSeats(){const me=mpSelf();const id=mpId();const ss=MP.cfg.ss&&MP.ssn;const max=ss?4:MP.cfg.md==="mesma"?2:4;const wk=mpWk();
  const L=[{peer:me?me.peer:"host",...id,tm:MP.tm,ty:MP.ty,host:true,uid:mpUid(),fo:wk[0],qr:wk[1]}];
  for(const p of mpPeers()){const q=p.presence;if(p.sameTab||q.role!=="g"||!q.rdy)continue;if(L.length>=max)break;const w=Array.isArray(q.wk)?q.wk:[];
    L.push({peer:p.peer,...mpCleanId(q),tm:mpTeams().includes(q.tm)?q.tm:"ferrari",ty:["S","M","H"].includes(q.ty)?q.ty:"M",uid:String(q.uid||"").replace(/[^a-z0-9]/g,"").slice(0,16),
      fo:MP_FO.some(x=>x[0]===w[0])?w[0]:"setup",qr:MP_QR.some(x=>x[0]===w[1])?w[1]:"normal"})}
  if(ss){const out=[];for(const s of L){const k=MP.ssn.pl.findIndex(p=>p.u===s.uid);if(k<0||out.some(o=>o.tm==="rk"+k))continue;s.tm="rk"+k;out.push(s)}return out}
  if(MP.cfg.md==="mesma")L.forEach(s=>s.tm=MP.tm);return L}
function mpSeatProblem(L){if(MP.cfg.ss){if(!MP.ssn)return"Crie uma temporada nova ou continue uma salva.";if(MP.ssn.done)return"Esta temporada já terminou. Crie uma nova.";
    if(!L.length||L[0].uid!==mpUid())return"Você não faz parte desta temporada: quem corre nela precisa criar a sala.";}
  else if(MP.cfg.md!=="mesma"){const t=new Set();for(const s of L){if(t.has(s.tm))return`Duas pessoas escolheram a ${mpTeam(s.tm).n}. No modo equipes diferentes, cada um precisa de uma.`;t.add(s.tm)}}
  const cds=new Set();for(const s of L){if(cds.has(s.cd))return`Dois pilotos com a sigla ${s.cd}. Um de vocês precisa trocar a sigla.`;cds.add(s.cd)}return""}
function mpStart(){if(MP.role!=="h")return;const L=mpSeats();if(mpSeatProblem(L))return;
  if(MP.cfg.ss&&MP.ssn)ssnRaceCfg();MP.cfg=mpCleanCfg({...MP.cfg,sd:1+Math.floor(Math.random()*2147483000)});MP.curSd=MP.cfg.sd;const me=mpSelf();L[0].peer=me?me.peer:"host";
  mpBuildWorld(MP.cfg,L,L[0].peer);doQuali("normal");W.step="race";
  startRace({plan:mpPlan(L[0].ty),tyre:L[0].ty,fuel:"normal"});mpInitRace();R.mpHost=true;mpGridNote();
  MP.log=[];MP.seq=0;MP.lastPub=0;MP.res=null;MP.lost=false;MP.inRace=true;
  mpSet({ph:"race",cfg:{...MP.cfg},seats:L.map(mpSeatArr),grid:W.grid.slice(),s:null,lg:[],res:null,ssn:null});mpLobbyPresence();
  UI.scr="mprace";CAM.init=0;if(G.settings.sound&&!UI.sound)UI.sound=sndToggle(true);render();mpBgStart()}
function mpHostTick(now){if(!R||!R.mpHost)return;const peers=mpPeers();
  for(const c of R.cars){if(!c.peer||c.isP)continue;let p=peers.find(x=>x.peer===c.peer);
    // quem caiu e voltou (página recarregada) é reconhecido pelo id fixo do jogador
    if((!p||c.gone)&&c.uid){const q=peers.find(x=>!x.sameTab&&x.presence.uid===c.uid&&x.presence.quit!==MP.cfg.sd&&x.presence.ph!=="spec");
      if(q&&(q.peer!==c.peer||c.gone)){p=q;c.peer=q.peer;for(const k of["cmdM","cmdE","cmdTw","cmdGo","cmdAs","cmdPl","cmdBk","cmdDf","cmdBs","ansDone"])c[k]=undefined;
        if(c.gone&&running(c)&&!c.quitT){c.gone=false;c.hum=true;c.auto=false;rcMsg(`${c.code} voltou para a corrida e assume o carro de novo.`,"good")}}}
    if(c.gone)continue;
    if(!p){if(now-c.lastSeen>9000){c.gone=true;c.hum=false;c.auto=true;c.rask=null;rcMsg(`${c.code} perdeu a conexão: a equipe pilota o carro até ele voltar.`,"warn")}continue}
    c.lastSeen=now;const P=p.presence||{},sd=MP.cfg.sd;
    if(P.quit===sd||P.rm!==MP.code){c.gone=true;c.quitT=P.quit===sd?1:0;c.hum=false;c.auto=true;c.rask=null;rcMsg(`${c.code} saiu da corrida: a equipe assume o carro até o fim.`,"warn");continue}
    const cmd=P.cmd;if(cmd&&cmd.sd===sd){if(cmd.m!==c.cmdM){c.cmdM=cmd.m;if(cmd.m!==c.mode)cmdModeC(c,cmd.m)}if(cmd.e!==c.cmdE){c.cmdE=cmd.e;if(cmd.e!==c.ers)cmdErsC(c,cmd.e)}
      if((cmd.tw||0)!==(c.cmdTw||0)){const first=c.cmdTw==null;c.cmdTw=cmd.tw||0;if(!first||cmd.tw>0)cmdTowC(c)}
      if((cmd.go||0)!==(c.cmdGo||0)){const first=c.cmdGo==null;c.cmdGo=cmd.go||0;if(!first||cmd.go>0)cmdGoC(c)}
      if((cmd.as||"auto")!==(c.cmdAs||"auto")){c.cmdAs=cmd.as||"auto";cmdStyleC(c,c.cmdAs)}
      if((cmd.pl||"norm")!==(c.cmdPl||"norm")){c.cmdPl=cmd.pl||"norm";cmdPlanC(c,c.cmdPl)}
      if((cmd.bk||0)!==(c.cmdBk||0)){const first=c.cmdBk==null;c.cmdBk=cmd.bk||0;if(!first||cmd.bk>0)cmdBackC(c)}
      if((cmd.df||0)!==(c.cmdDf||0)){const first=c.cmdDf==null;c.cmdDf=cmd.df||0;if(!first||cmd.df>0)cmdDefC(c)}
      if(cmd.bs!==c.cmdBs){const first=c.cmdBs==null;c.cmdBs=cmd.bs;if(!first||cmd.bs>0)cmdBoxC(c,cmd.b||null)}}
    const a=P.ans;if(Array.isArray(a)&&a[0]===sd&&a[1]!==c.ansDone){c.ansDone=a[1];answerRemote(c,a[1],a[2])}
    const g=P.go;if(g&&g.sd===sd&&R.started&&!c.goDone)remoteLaunch(c,g.rt,!!g.j)}
  if(R.started)for(const c of R.cars)if(c.peer&&!c.isP&&!c.goDone&&!c.gone&&R.t-R.go>3.5)remoteLaunch(c,1.2,false);
  if(now-MP.lastPub>=100){MP.lastPub=now;mpPublish()}}
function mpCollect(){const out=[];
  for(let i=R.msgs.length-1;i>=0;i--){const m=R.msgs[i];if(m._n)continue;m._n=1;out.push(["rc",String(m.t).slice(0,170),m.cls||"",m.k||""])}
  for(let i=R.radio.length-1;i>=0;i--){const m=R.radio[i];if(m._n)continue;m._n=1;const c=R.cars.find(x=>x.id===m.c);if(c&&c.peer&&!c.isP&&!c.gone)out.push(["ra",c.idx,String(m.t).slice(0,170),m.me?1:0,m.pause?1:0,m.k||""])}
  for(const h of R.hl){if(h._n)continue;h._n=1;out.push(["hl",+h.t.toFixed(2),h.type,h.cars.map(id=>{const c=R.cars.find(x=>x.id===id);return c?c.idx:-1}),String(h.txt).slice(0,80),h.imp])}
  for(const b of R.bubbles){if(b._n)continue;b._n=1;const c=R.cars.find(x=>x.id===b.id);if(c)out.push(["bu",+b.t.toFixed(2),c.idx,String(b.text).slice(0,78),b.kind||"",b.dur])}
  for(const e of R.fxq){if(e._n)continue;e._n=1;if(R.t-e.t0>5)continue;out.push(["fx",+e.t0.toFixed(2),e.type,Math.round(fr(e.f)*1e5),Math.round((e.lat||0)*10),e.col||0,e.col2||0,e.turn||0])}
  for(const o of out){MP.seq++;MP.log.push([MP.seq,...o])}if(MP.log.length>14)MP.log=MP.log.slice(-14)}
function mpSnap(){const L=R.geo.len;const ix=c=>c?c.idx:-1;MP.pubN=(MP.pubN||0)+1;const hSkip=R.cars.filter(c=>c.hum).length>2;// com 3 ou 4 jogadores, o detalhe de cada um vai em quadros alternados (cabe no limite de 4 KB)

  const cars=R.cars.map(c=>{const f=(c.status==="run"?0:c.status==="fin"?1:c.status==="dnf"?2:3)|(c.pit?4:0)|(c.pit&&c.pit.phase==="stop"?8:0)|(c.dmg.wing>=.5?16:0)|(c.dmg.rwing>=.5?32:0)|(c.dmg.floor>.5?64:0)|(c.tyre.punct?128:0)|((c.acc||0)<-6?256:0)|(c.ovMode?512:0)|((c.smokeT||0)>R.t?1024:0)|(c.parked?2048:0)|(c.blue?4096:0)|((c.dmg.body||0)>.3?8192:0)|((c.tow||0)>.35?16384:0)|(c.dirty?32768:0);
    const a=[Math.round(c.prog*L*10),Math.round((c.y||0)*10),Math.round((c.v||0)*10),f,c.pit?Math.round((c.pit.s||0)*10):0,Math.max(0,MP_TY.indexOf(c.tyre.c))*1000+Math.round(c.tyre.wear*999)];
    a.push(0,0,0,0);a.push(Math.round((c.psi||0)*100),/* direção real da carroceria (dyn.js) */(c.dmg.wingL>=.6?1:0)|(c.dmg.wingR>=.6?2:0)|((c.dmg.off>=0?c.dmg.off+1:0)<<2));return a});
  const s={t:+R.t.toFixed(2),st:(R.started?1:0)|(R.form&&R.form.phase==="lights"?2:0)|(R.over?4:0)|(R.finishing?8:0),ls:R.lightsStart==null?-1:+R.lightsStart.toFixed(2),go:isFinite(R.go)?+R.go.toFixed(2):-1,
    ld:R.lead,w:+R.w.toFixed(3),rn:R.rain,o:R.order.map(ix),c:cars,sb:R.secBest.map(b=>b?[+b.t.toFixed(3),ix(R.cars.find(c=>c.id===b.id))]:0)};
  if(R.sc)s.sc=[R.sc.type==="sc"?1:2,R.sc.ending?1:0,R.scP!=null?Math.round(fr(R.scP)*1e5):-1];
  if(R.red)s.rd=R.red.phase==="return"?1:R.red.phase==="stopped"?2:3;
  if(R.yellows.length)s.yl=R.yellows.slice(0,8).map(y=>[Math.round(fr(y.a)*1e5),Math.round(fr(y.b)*1e5),y.dbl?1:0]);
  if(R.greenT>R.t)s.gt=+R.greenT.toFixed(1);
  const wk=R.wrecks.filter(w=>!w.removed);if(wk.length)s.wk=wk.slice(0,6).map(w=>[Math.round(w.f*1e5),Math.round(w.lat*10),Math.round(w.ang*100),+w.t0.toFixed(1),+w.removeAt.toFixed(1),ix(w.c),w.kind==="crash"?1:w.kind==="beach"?2:0,w.fire?1:0,Math.round((w.f0??w.f)*1e5),Math.round((w.lat0??w.lat)*10),+(w.slide||0).toFixed(1),Math.round((w.spin||0)*10)]);
  const h=[],ak=[];R.cars.forEach(c=>{if(!c.hum)return;const q=x=>x==null?-1:+x.toFixed(3);
    if(!(hSkip&&(c.idx+MP.pubN)%2))h.push([c.idx,Math.round(c.batt),Math.round(c.tyre.temp),c.tyre.age,+c.fuel.toFixed(1),Math.max(0,MP_MODE.indexOf(c.mode)),Math.max(0,MP_ERS.indexOf(c.ers)),q(c.last),q(c.best),+(c.lapStart||0).toFixed(2),...c.secCur.map(q),...c.secPB.map(q),
      c.pitCall?MP_TY.indexOf(c.pitCall):-1,c.pen||0,c.warn||0,c.clip?1:0,c.brakeHot||0,c.stops||0,+(c.L||90).toFixed(2),+(c.fuel0||0).toFixed(1),+(c.dmg.power||0).toFixed(2),+(c.dmg.gear||0).toFixed(2),+(c.dmg.floor||0).toFixed(2),+(c.dmg.body||0).toFixed(2),+(c.heat||0).toFixed(2),c.towReq?1:0,c.goReq?1:0,c.att&&c.att.commit?1:0,...(c.st?[c.st.conf,c.st.nerv,c.st.fat,c.st.frus,c.st.foco]:[50,20,0,0,90]).map(Math.round),Object.keys(ASTYLE).indexOf(c.atkStyle||"auto"),c.defOrd?1:0,c.gb?(c.gb.mode==="line"?2:1):0,c.gb?ix(R.cars.find(x=>x.id===c.gb.to)):-1,...(c.mc?[c.mc.tEng,c.mc.tBrk,c.mc.hEng*100,c.mc.hGbx*100]:[100,400,100,100]).map(Math.round),Object.keys(EPLAN).indexOf(c.ersPlan||"norm"),...[c.dmg.wing,c.dmg.wingL,c.dmg.wingR,c.dmg.nose,c.dmg.cool,c.dmg.side,c.dmg.susp,...(c.dmg.whl||[0,0,0,0]),c.dmg.loose].map(x=>+(+x||0).toFixed(2)),c.dmg.off==null?-1:c.dmg.off]);
    const a=c.rask;if(a&&!c.isP)ak.push([c.idx,a.id,String(a.q).slice(0,240),a.opts.map(o=>[o[0],String(o[1]).slice(0,60)]),a.def,+Math.max(0,a.until-R.t-1).toFixed(1),a.dur,a.kind||""])});
  s.h=h;if(ak.length)s.ak=ak;return s}
function mpPublish(){mpCollect();mpSet({s:mpSnap(),lg:MP.log.slice()})}
// com a aba escondida o navegador quase para a animação: um relógio de reserva mantém a corrida andando para os outros
function mpBgStart(){mpBgStop();MP.bg=setInterval(()=>{if(!document.hidden||!R||!R.mpHost||R.over||R.redChoose)return;const now=performance.now();let sim=Math.min(2,(now-UI.last)/1000);UI.last=now;
  simAdvance(sim,60);mpHostTick(now);if(R.over)mpFinish()},400)}
function mpBgStop(){if(MP.bg){clearInterval(MP.bg);MP.bg=0}}
// ---------- convidado: recebe o estado, interpola e manda os comandos
function mpGuestBegin(hp){const L=(hp.seats||[]).map(mpSeatObj).filter(Boolean);if(!L.length)return;const me=mpSelf();const myPeer=me&&me.peer;
  const mine=L.find(s=>s.peer===myPeer)||L.find(s=>s.uid&&s.uid===mpUid());const cfg=mpCleanCfg(hp.cfg);if(!cfg.sd)return;MP.curSd=cfg.sd;MP.spect=!mine;
  mpBuildWorld(cfg,L,mine?mine.peer:L[0].peer);const ids=new Set(Object.keys(G.drivers));const grid=(Array.isArray(hp.grid)?hp.grid:[]).filter(x=>ids.has(x));
  if(grid.length!==ids.size){mpRestoreCareer();MP.err="Não deu para acompanhar esta corrida: a sala está em outra versão do jogo.";mpRefresh();return}
  W.grid=grid;W.step="race";startRace({});mpInitRace();R.msgs=[];R.radio=[];R.narr=[];R.hl=[];R.bubbles=[];R.fxq=[];R.mpGuest=true;R.spect=MP.spect;R.autoStart=true;R.form.phase="out";
  MP.snaps=[];MP.lastS=null;MP.lastLg=null;MP.lastSeq=0;MP.res=null;MP.askDone=null;MP.outAt=0;MP.hostMiss=0;MP.lost=false;MP.cfg=cfg;
  MP.cmd={sd:cfg.sd,m:"normal",e:"auto",b:null,bs:0};mpSet({cmd:MP.cmd,ans:null,go:null,quit:null});MP.inRace=true;UI.scr="mprace";CAM.init=0;render()}
function mpGuestFrame(now){const h=mpHostPeer();const hp=h&&h.presence;
  if(hp&&hp.ph==="lobby"){if(!R.over){R.over=true;MP.lost=true;rcMsg("O anfitrião encerrou a corrida.","bad")}return}
  if(!hp){if(!MP.hostMiss)MP.hostMiss=now;if(now-MP.hostMiss>7000&&!R.over){R.over=true;MP.lost=true;rcMsg("O anfitrião saiu da sala: a corrida foi encerrada.","bad")}return}MP.hostMiss=0;
  if(hp.s&&hp.s!==MP.lastS&&Array.isArray(hp.s.c)&&hp.s.c.length===R.cars.length){MP.lastS=hp.s;MP.snaps.push({t:+hp.s.t||0,recv:now,s:hp.s});if(MP.snaps.length>14)MP.snaps.shift()}
  if(Array.isArray(hp.lg)&&hp.lg!==MP.lastLg){MP.lastLg=hp.lg;mpApplyLog(hp.lg)}
  if(Array.isArray(hp.res)){MP.res=hp.res;if(hp.ph==="res"&&!R.over){R.over=true}}
  if(!MP.snaps.length)return;const last=MP.snaps[MP.snaps.length-1];const T=Math.max(MP.snaps[0].t,last.t+Math.min(.4,(now-last.recv)/1000)-.25);
  let a=MP.snaps[0],b=a;for(let i=0;i<MP.snaps.length;i++)if(MP.snaps[i].t<=T){a=MP.snaps[i];b=MP.snaps[i+1]||a}
  const k=b.t>a.t?clamp((T-a.t)/(b.t-a.t),0,1):1;mpApplySnap(a.s,b.s,k,Math.min(T,b.t),now)}
function mpApplySnap(A,B,k,T,now){const L=R.geo.len,dt=Math.max(.001,FDT||.016);const wasStarted=R.started;R.t=T;
  R.go=B.go>0?B.go:Infinity;R.lightsStart=B.ls>=0?B.ls:null;R.started=B.go>0&&T>=B.go;R.form.phase=(B.st&2)||R.started?"lights":"out";
  R.over=!!(B.st&4)&&T>=B.t-.3;R.finishing=!!(B.st&8);R.lead=+B.ld||0;R.w=clamp(+B.w||0,0,1);R.rain=+B.rn||0;R.greenT=+B.gt||0;
  if(Array.isArray(B.sc)){R.sc=R.sc||{};R.sc.type=B.sc[0]===1?"sc":"vsc";R.sc.ending=!!B.sc[1];R.scP=B.sc[0]===1&&B.sc[2]>=0?B.sc[2]/1e5:null}else{R.sc=null;R.scP=null}
  R.red=B.rd?{phase:B.rd===1?"return":B.rd===2?"stopped":"restart"}:null;R.redChoose=false;
  R.yellows=Array.isArray(B.yl)?B.yl.map(y=>({a:y[0]/1e5,b:y[1]/1e5,f:y[1]/1e5-.008,dbl:!!y[2],until:1e9})):[];
  R.wrecks=Array.isArray(B.wk)?B.wk.map(w=>{const c=R.cars[w[5]];return{c,code:c?c.code:"",col:c?c.col:"#888888",col2:c?c.col2:"#222222",f:w[0]/1e5,lat:w[1]/10,ang:w[2]/100,t0:+w[3],removeAt:+w[4],kind:w[6]===1?"crash":w[6]===2?"beach":"stop",fire:!!w[7],f0:w[8]!=null?w[8]/1e5:undefined,lat0:w[9]!=null?w[9]/10:undefined,slide:+w[10]||.01,spin:(+w[11]||0)/10,removed:false}}):[];
  if(Array.isArray(B.sb))R.secBest=B.sb.map(x=>Array.isArray(x)&&R.cars[x[1]]?{t:+x[0],id:R.cars[x[1]].id}:null);
  if(Array.isArray(B.o)&&B.o.length===R.cars.length)R.order=B.o.map(i=>R.cars[i]).filter(Boolean);
  R.cars.forEach((c,i)=>{const ca=A.c[i],cb=B.c[i];if(!Array.isArray(ca)||!Array.isArray(cb))return;const lerp=(j,s)=>((+ca[j]||0)+((+cb[j]||0)-(+ca[j]||0))*k)/s;
    const f=+cb[3]||0;const prog=lerp(0,10)/L,y=lerp(1,10),v=Math.max(0,lerp(2,10));const vp=c.v||0;
    c.status=["run","fin","dnf","dsq"][f&3];c.prog=prog;c.lap=Math.max(0,Math.floor(prog));
    c.vy=(c.vy||0)*.7+.3*clamp((y-(c.y||0))/dt,-6,6);c.y=y;c.v=v;c.acc=f&256?-12:clamp((v-vp)/dt,-40,20);
    c.pit=f&4?{s:(ca[4]&&(+ca[3]&4)?lerp(4,10):(+cb[4]||0)/10),phase:f&8?"stop":"in"}:null;
    c.dmg.wing=f&16?1:0;c.dmg.rwing=f&32?1:0;if(!c.isP){c.dmg.floor=f&64?.6:0;c.dmg.body=f&8192?.5:0}c.tyre.punct=!!(f&128);c.ovMode=!!(f&512);c.smokeT=f&1024?R.t+1:0;c.parked=!!(f&2048);c.blue=!!(f&4096);c.tow=f&16384?.8:0;c.dirty=!!(f&32768);
    if(cb.length>=12){c.psi=lerp(10,100);c.yaw=0;const dw=+cb[11]||0;c.dmg.wingL=dw&1?1:0;c.dmg.wingR=dw&2?1:0;c.dmg.off=((dw>>2)&7)-1}
    const ty=+cb[5]||0;c.tyre.c=MP_TY[Math.floor(ty/1000)]||"M";c.tyre.wear=clamp((ty%1000)/999,0,1);
    const hd=Array.isArray(B.h)&&B.h.find(x=>Array.isArray(x)&&x[0]===i);if(hd)mpApplyDetail(c,hd.slice(1))});
  const me=R.cars.find(c=>c.isP);if(!me)return;
  if(!wasStarted&&R.started){MP.outAt=now;if(!R.spect&&!me.tapped){me.tapped=true;me.hold=false;const rt=+(.2+(1-clamp(((me.d&&me.d.a&&me.d.a.start)||75)/100,0,1))*.25).toFixed(3);mpSet({go:{sd:MP.cfg.sd,rt,j:0}})}}/* largada automática também no online */
  if(me.hold&&R.started&&MP.outAt&&now-MP.outAt>1400){me.hold=false;me.tapped=true;mpSet({go:{sd:MP.cfg.sd,rt:1.4,j:0}})}
  if(R.toast&&R.t-R.toast.t>7)R.toast=null;mpLapTrack(me);
  // pergunta do engenheiro para você
  const qa=Array.isArray(B.ak)&&B.ak.find(x=>Array.isArray(x)&&x[0]===me.idx),q=qa?qa.slice(1):null;
  if(q&&q[0]!==MP.askDone){if(!R.ask||R.ask.id!==q[0]){const opts=(Array.isArray(q[2])?q[2]:[]).filter(o=>Array.isArray(o)&&typeof o[0]==="string").map(o=>[o[0].slice(0,24),String(o[1]).slice(0,60)]);
      if(opts.length)R.ask={id:q[0],c:me,q:String(q[1]),opts,def:String(q[3]),dur:clamp(+q[5]||15,4,30),until:R.t+clamp(+q[4]||10,0,30),kind:String(q[6]||""),t0:R.t}}}
  else if(R.ask&&!q)R.ask=null}
function mpApplyDetail(c,h){if(!Array.isArray(h))return;let i=0;const n=()=>{const v=+h[i++];return isFinite(v)?v:0};
  c.batt=clamp(n(),0,100);c.tyre.temp=n();c.tyre.age=n();c.fuel=n();c.mode=MP_MODE[n()]||"normal";c.ers=MP_ERS[n()]||"auto";const last=n(),best=n();c.last=last>0?last:null;c.best=best>0?best:null;c.lapStart=n();
  c.secCur=[n(),n(),n()].map(x=>x<0?null:x);c.secPB=[n(),n(),n()].map(x=>x<0?null:x);const pc=n();c.pitCall=pc>=0?MP_TY[pc]||null:null;c.pen=n();c.warn=n();c.clip=!!n();c.brakeHot=n();c.stops=n();
  const Lt=n();if(Lt>30)c.L=Lt;const f0=n();if(f0>0)c.fuel0=f0;c.dmg.power=n();c.dmg.gear=n();c.dmg.floor=n();c.dmg.body=n();c.heat=n();c.towReq=!!n();c.goReq=!!n();c.atkOn=!!n();c.st={conf:n(),nerv:n(),fat:n(),frus:n(),foco:n()};c.atkStyle=Object.keys(ASTYLE)[n()]||"auto";c.defOrd=!!n();const gbm=n(),gbt=n();c.gbShow=gbm?{mode:gbm===2?"line":"now",to:R.cars[gbt]?R.cars[gbt].id:null}:null;c.mc={tEng:n(),tBrk:n(),hEng:n()/100,hGbx:n()/100,hBrk:1,warn:{}};c.ersPlan=Object.keys(EPLAN)[n()]||"norm";
  if(i<h.length-12){const D=c.dmg;D.wing=clamp(n(),0,1);D.wingL=clamp(n(),0,1);D.wingR=clamp(n(),0,1);D.nose=clamp(n(),0,1);D.cool=clamp(n(),0,1);D.side=clamp(n(),0,1);D.susp=clamp(n(),0,1);D.whl=[n(),n(),n(),n()].map(x=>clamp(x,0,1));D.loose=clamp(n(),0,1);D.off=clamp(Math.round(n()),-1,3)}}
function mpLapTrack(me){if(!me.cpCur)me.cpCur=new Float32Array(101);const n=Math.floor(me.prog);if(me._lapN==null)me._lapN=n;
  if(n>me._lapN){if(me.last&&me.best&&Math.abs(me.last-me.best)<.002&&me.cpNext>90)me.cpBest=Float32Array.from(me.cpCur);me.cpCur=new Float32Array(101);me.cpNext=0;me._lapN=n}
  if(R.started&&!me.pit&&me.lapStart){const idx=Math.floor(fr(me.prog)*100);while(me.cpNext<=idx&&me.cpNext<101){me.cpCur[me.cpNext]=Math.max(0,R.t-me.lapStart);me.cpNext++}}}
function mpApplyLog(lg){for(const e of lg){if(!Array.isArray(e)||!(e[0]>MP.lastSeq))continue;MP.lastSeq=e[0];const k=e[1],lap=Math.max(1,R.lead+1);
  if(k==="rc"){R.msgs.unshift({lap,t:String(e[2]),cls:MP_CLS.includes(e[3])?e[3]:"",k:GLOSS[e[4]]?e[4]:""});if(R.msgs.length>60)R.msgs.pop()}
  else if(k==="ra"){const c=R.cars[e[2]];if(!c)continue;const m={lap,c:c.id,code:c.code,t:String(e[3]),rt:R.t,me:!!e[4],k:GLOSS[e[6]]?e[6]:""};R.radio.unshift(m);if(R.radio.length>40)R.radio.pop();if(e[5]&&c.isP)R.toast={t:R.t,text:m.t}}
  else if(k==="hl"){R.hl.push({t:+e[2]||0,type:String(e[3]),cars:(Array.isArray(e[4])?e[4]:[]).map(i=>R.cars[i]&&R.cars[i].id).filter(Boolean),txt:String(e[5]),imp:clamp(+e[6]||1,1,3),lap});if(R.hl.length>60)R.hl.shift()}
  else if(k==="bu"){const c=R.cars[e[3]];if(c){R.bubbles.push({id:c.id,text:String(e[4]).slice(0,78),kind:BUB_COL[e[5]]?e[5]:"",t:+e[2]||0,dur:clamp(+e[6]||4,1,8)});if(R.bubbles.length>16)R.bubbles.shift()}}
  else if(k==="fx"&&MP_FX.includes(e[3]))R.fxq.push({type:e[3],t0:+e[2]||0,f:(+e[4]||0)/1e5,lat:(+e[5]||0)/10,col:mpHex(e[6])||"#888888",col2:mpHex(e[7])||"#222222",turn:+e[8]||0})}}
// comandos do convidado: o estado vai no presence e o anfitrião aplica no seu carro
function mpCmd(patch){if(!R||!R.mpGuest||R.spect)return;const me=R.cars.find(c=>c.isP);if(!me||!running(me))return;
  if("b" in patch){MP.cmd.b=patch.b||null;MP.cmd.bs=(MP.cmd.bs||0)+1;me.pitCall=patch.b||null}
  if(patch.tw){MP.cmd.tw=(MP.cmd.tw||0)+1;me.towReq=true}
  if(patch.go){MP.cmd.go=(MP.cmd.go||0)+1;me.goReq=true}
  if(patch.as){MP.cmd.as=patch.as;me.atkStyle=patch.as}if(patch.pl){MP.cmd.pl=patch.pl;me.ersPlan=patch.pl}if(patch.df){MP.cmd.df=(MP.cmd.df||0)+1;me.defOrd=!me.defOrd}
  if(patch.bk){MP.cmd.bk=(MP.cmd.bk||0)+1}
  if(patch.m){MP.cmd.m=patch.m;me.mode=patch.m}if(patch.e){MP.cmd.e=patch.e;me.ers=patch.e}MP.cmd.sd=MP.cfg.sd;mpSet({cmd:{...MP.cmd}})}
function mpAnswer(k){const a=R.ask;if(!a||!R.mpGuest)return;MP.askDone=a.id;R.ask=null;radio(a.c,(a.opts.find(o=>o[0]===k)||[,""])[1],{me:1});mpSet({ans:[MP.cfg.sd,a.id,k]})}
function mpTap(){const me=R.cars.find(c=>c.isP);if(!me||R.spect||me.tapped||R.form.phase!=="lights")return;me.tapped=true;
  if(!R.started){if(R.lightsStart!=null&&R.t>=R.lightsStart){mpSet({go:{sd:MP.cfg.sd,j:1,rt:0}});radio(me,"Queimei a largada!",{me:1})}else me.tapped=false;return}
  me.hold=false;const rt=Math.max(.05,(performance.now()-MP.outAt)/1000);mpSet({go:{sd:MP.cfg.sd,rt:+rt.toFixed(3),j:0}})}
// ---------- fim da corrida
function mpFinish(){sndSilence();mpBgStop();
  if(R.mpHost&&R.result){MP.res=R.result.cls.map(e=>[e.d,e.pos||0,e.status,e.time!=null?+e.time.toFixed(3):null,e.laps,e.pts||0,e.fl?1:0,e.pen||0,String(e.why||"").slice(0,40)]);
    if(MP.cfg.ss&&MP.ssn&&MP.ssn.id===MP.cfg.sid&&MP.ssn.rd===MP.cfg.rd)ssnAfterRace(R.result.cls);
    mpSet({ph:"res",res:MP.res,s:null,lg:null,seats:null,grid:null,cfg:{...MP.cfg,sw:null},ssn:MP.cfg.ss&&MP.ssn?MP.ssn:null})}
  if(G&&G.mp&&W){W.step="mpres";render()}}
function mpResCls(){if(!Array.isArray(MP.res))return null;return MP.res.filter(a=>Array.isArray(a)&&G.drivers[a[0]]).map(a=>({d:a[0],team:G.drivers[a[0]].team,pos:+a[1]||null,status:["ok","dnf","dsq"].includes(a[2])?a[2]:"dnf",time:+a[3]||0,laps:+a[4]||0,pts:+a[5]||0,fl:!!a[6],pen:+a[7]||0,why:String(a[8]||"")}))}
function mpAgain(){if(MP.role!=="h")return;MP.inRace=false;MP.res=null;MP.cfg.sw=null;mpSet({ph:"lobby",s:null,lg:null,res:null,seats:null,grid:null,cfg:{...MP.cfg}});mpRestoreCareer();ssnHostSync();MP.view="room";UI.scr="mp";render()}
function mpOnPeers(){const h=MP.role==="g"?mpHostPeer():null,hp=h&&h.presence;if(typeof ssnOnPeers==="function")ssnOnPeers(hp);
  if(hp&&hp.ph==="race"&&hp.cfg&&hp.grid&&hp.seats&&+hp.cfg.sd!==MP.curSd)mpGuestBegin(hp);
  else if(hp&&hp.ph==="lobby"&&MP.inRace&&W&&W.step==="mpres"){MP.inRace=false;mpRestoreCareer();MP.view="room";UI.scr="mp";render();return}
  if(hp&&Array.isArray(hp.res)&&G&&G.mp&&W&&W.step==="mpres"&&MP.res!==hp.res){MP.res=hp.res;render();return}
  if(UI.scr==="mp")mpRefresh()}
// ---------- telas do modo online
function mpTeam(id){return TEAMS0.find(t=>t.id===id)||TEAMS0[0]}
function mpOpen(){MP.err="";UI.scr="mp";if(!(MP.view==="room"&&MP.nr))MP.view="home";render();mpConnect()}
async function mpExitAll(){await mpLeaveRoom();mpRestoreCareer();UI.scr=G?"hub":"title";if(G&&!W)G.phase="home";render()}
function mpSignature(){const ps=MP.view==="room"?mpPeers():(MP.room?MP.room.peers():[]);
  return JSON.stringify([MP.st,MP.conn,MP.err,MP.view,MP.code,MP.role,MP.cfg,MP.tm,MP.ty,MP.rdy,MP.wk,MP.myTeam,MP.ssn?[MP.ssn.id,MP.ssn.up]:0,SSN.ui,ps.map(p=>{const q=p.presence||{};return[p.peer,q.nm,q.cd,q.num,q.tm,q.ty,q.rdy,q.role,q.ph,q.open,q.tr,q.md,q.uid,q.tn,q.tc,q.tc2,q.wk,q.dq,q.ss,MP.view==="room"&&q.role==="h"?q.cfg:0]})])}
function mpRefresh(){if(UI.scr!=="mp")return;const a=document.activeElement;if(a&&a.tagName==="INPUT"&&a.id&&a.id.startsWith("mp"))return;const sig=mpSignature();if(sig===MP.sig)return;mpScreen()}
function mpScreen(){MP.sig=mpSignature();if(MP.view==="room"&&MP.nr)mpRoomView();else mpHomeView();mpBind()}
function mpStatusLine(){const n=MP.room?MP.room.peers().length:0;
  if(MP.st==="none")return`<p class="pill bad" style="white-space:normal">Sem servidor online. Abra o jogo pelo link do Claude ou pelo seu site com o servidor configurado.</p>${typeof mpNetSetup==="function"?mpNetSetup():""}`;
  if(MP.net==="fb"&&MP.st==="ok"&&MP.conn)return`<p class="muted" style="font-size:13px"><span class="dot on"></span> Conectado ao seu servidor online</p>`;
  if(MP.st!=="ok")return`<p class="muted">Conectando…</p>`;if(!MP.conn)return`<p class="muted">Reconectando…</p>`;
  return`<p class="muted" style="font-size:13px"><span class="dot on"></span> Conectado · ${n} ${n===1?"pessoa":"pessoas"} com o jogo aberto agora</p>`}
function mpHomeView(){const id=mpId();const dis=MP.st==="none"?" disabled":"";
  const lobby=MP.room?MP.room.peers().filter(p=>!p.sameTab&&p.presence&&p.presence.app==="pdk"&&typeof p.presence.open==="string"):[];
  app.innerHTML=`<div class="mpw"><div class="row" style="justify-content:space-between"><h2>Corrida online</h2><button class="btn sm" data-act="mpExit">Voltar</button></div>
   <div class="grid2">
    <div class="card"><h3>Seu piloto na sala</h3>
     <label class="fl"><span>Nome</span><input class="txt" id="mpNm" maxlength="24" value="${esc(id.nm)}" autocomplete="off"></label>
     <div class="row"><label class="fl" style="flex:1;min-width:0"><span>Sigla</span><input class="txt" id="mpCd" maxlength="3" value="${esc(id.cd)}" autocomplete="off" style="text-transform:uppercase"></label><label class="fl" style="flex:1;min-width:0"><span>Número</span><input class="txt" id="mpNum" type="number" min="2" max="99" value="${id.num}"></label></div>
     <div class="row">${helmetSVG(id.c1,id.c2,40)}<span class="muted" style="font-size:13px">Capacete</span></div>
     <div class="swatches">${HELMETS.map(c=>`<button class="sw${id.c1===c?" on":""}" style="background:${c}" data-act="mpC1" data-k="${c}" aria-label="cor principal ${c}"></button>`).join("")}</div>
     <div class="swatches">${HELMETS.map(c=>`<button class="sw${id.c2===c?" on":""}" style="background:${c}" data-act="mpC2" data-k="${c}" aria-label="cor das faixas ${c}"></button>`).join("")}</div></div>
    <div class="card"><h3>Jogar com amigos</h3>${mpStatusLine()}${mpLastBtn()}
     <button class="btn go" data-act="mpCreate"${dis}>Criar sala</button>
     <div class="row"><input class="txt" id="mpCode" maxlength="9" placeholder="Código da sala" autocomplete="off" style="flex:1;min-width:0;text-transform:uppercase"><button class="btn" data-act="mpJoin"${dis}>Entrar</button></div>
     ${MP.err?`<p class="pill bad" style="white-space:normal">${esc(MP.err)}</p>`:""}
     <h3>Salas abertas agora</h3>${lobby.length?`<div class="ansl">${lobby.map(p=>{const q=p.presence,c=CIR[q.tr],code=String(q.open).replace(/[^a-z0-9]/g,"").slice(0,8);
       return`<button class="proj" data-act="mpJoinCode" data-k="${code}"><span class="tag">SALA ${code.toUpperCase()}${q.ph==="race"?" · CORRIDA EM ANDAMENTO":""}</span><b>${esc(String(q.nm||"Piloto").slice(0,24))}</b><small>${c?esc(c.gp):"—"} · ${q.md==="mesma"?"mesma equipe":"equipes diferentes"}</small></button>`}).join("")}</div>`:`<p class="muted" style="font-size:13px">Nenhuma sala aberta. Crie uma e mande o código para o seu amigo.</p>`}</div>
    <div class="card" style="grid-column:1/-1"><h3>Como jogar</h3><ol class="howto">
     <li>Compartilhe esta página com o seu amigo pelo menu <b>Compartilhar</b> do Claude. Ele abre com a conta dele.</li>
     <li>Um de vocês toca em <b>Criar sala</b> e passa o código. O outro digita o código e toca em <b>Entrar</b>, ou escolhe a sala na lista.</li>
     <li>Cada um escolhe a equipe e o pneu de largada. Quem criou a sala (o anfitrião) escolhe pista, distância, clima e modo, e larga quando todos estiverem prontos.</li>
     <li>Na corrida, cada um pilota o próprio carro pelo rádio e larga no toque. O anfitrião roda a simulação: o jogo dele precisa ficar aberto até a bandeirada.</li></ol></div></div></div>`}
// (a tela da sala fica em mpssn.js: corrida avulsa e temporada)
function mpCfgEditor(c){return`<label class="fl"><span>Pista</span><select class="txt" id="mpTr">${CIRCUITS.map(x=>`<option value="${x.id}"${x.id===c.tr?" selected":""}>${esc(x.gp)} · ${esc(x.n)}</option>`).join("")}</select></label>
  <h3>Distância</h3><div class="seg">${MP_LAPS.map(([v,n])=>`<button data-act="mpCfg" data-k="lp:${v}" class="${c.lp===v?"on":""}">${n} · ${Math.max(5,Math.round(CIR[c.tr].laps*v))} v</button>`).join("")}</div>
  <h3>Clima</h3><div class="seg">${MP_WX.map(([v,n])=>`<button data-act="mpCfg" data-k="wx:${v}" class="${c.wx===v?"on":""}">${n}</button>`).join("")}</div>
  <h3>Modo</h3><div class="seg">${[["dif","Equipes diferentes"],["mesma","Mesma equipe"]].map(([v,n])=>`<button data-act="mpCfg" data-k="md:${v}" class="${c.md===v?"on":""}">${n}</button>`).join("")}</div>`}
function mpCfgView(c){const C=CIR[c.tr];return`<div class="kv"><span>Pista</span><b>${esc(C.gp)}</b></div><div class="kv"><span>Distância</span><b class="num">${Math.max(5,Math.round(C.laps*c.lp))} voltas</b></div>
  <div class="kv"><span>Clima</span><b>${(MP_WX.find(x=>x[0]===c.wx)||[0,"Seco"])[1]}</b></div><div class="kv"><span>Modo</span><b>${c.md==="mesma"?"Mesma equipe":"Equipes diferentes"}</b></div><p class="muted" style="font-size:12.5px">Quem escolhe é o anfitrião.</p>`}
function mpBind(){const upd=()=>{const id=mpId();const nm=$("#mpNm"),cd=$("#mpCd"),num=$("#mpNum");MP.id=mpCleanId({...id,nm:nm?nm.value:id.nm,cd:cd?cd.value:id.cd,num:num?num.value:id.num});mpIdSave();
    if(MP.nr)mpSet({nm:MP.id.nm,cd:MP.id.cd,num:MP.id.num});mpLobbyPresence()};
  ["#mpNm","#mpCd","#mpNum"].forEach(s=>{const e=$(s);if(!e)return;e.addEventListener("input",()=>{const id=mpId();MP.id=mpCleanId({...id,[{mpNm:"nm",mpCd:"cd",mpNum:"num"}[e.id]]:e.value})});e.addEventListener("change",upd)});
  const c=$("#mpCode");if(c)c.addEventListener("keydown",e=>{if(e.key==="Enter")mpEnter(c.value,"g")});
  const tr=$("#mpTr");if(tr)tr.addEventListener("change",()=>{if(!CIR[tr.value])return;MP.cfg.tr=tr.value;mpSet({cfg:{...MP.cfg}});mpLobbyPresence();mpScreen()})}
function mpAction(a,k,b){if(typeof ssnAction==="function"&&ssnAction(a,k,b))return;
  if(a==="mpOpen")return mpOpen();if(a==="mpExit")return mpExitAll();
  if(a==="mpCreate")return mpEnter(mpCodeGen(),"h");
  if(a==="mpJoin"){const c=$("#mpCode");return mpEnter(c?c.value:"","g")}
  if(a==="mpJoinCode")return mpEnter(k,"g");
  if(a==="mpLeave"){mpForget();return mpLeaveRoom().then(()=>{mpRestoreCareer();UI.scr="mp";MP.view="home";render()});}
  if(a==="mpCopy"){const t=MP.code?MP.code.toUpperCase():"";try{navigator.clipboard.writeText(t).then(()=>{b.textContent="Copiado ✓"},()=>mpSelectCode())}catch(e){mpSelectCode()}return}
  if(a==="mpCfg"&&MP.role==="h"){const[key,v]=String(k).split(":");if(key==="lp")MP.cfg.lp=+v;else if(key==="wx"||key==="md")MP.cfg[key]=v;MP.cfg=mpCleanCfg(MP.cfg);mpSet({cfg:{...MP.cfg}});mpLobbyPresence();return mpScreen()}
  if(a==="mpTeam"&&mpTeams().includes(k)){MP.tm=k;mpSet({tm:k});return mpScreen()}
  if(a==="mpTyre"&&["S","M","H"].includes(k)){MP.ty=k;mpSet({ty:k});return mpScreen()}
  if(a==="mpReady"){MP.rdy=!MP.rdy;mpSet({rdy:MP.rdy});return mpScreen()}
  if((a==="mpC1"||a==="mpC2")&&mpHex(k)){const id=mpId();MP.id=mpCleanId({...id,[a==="mpC1"?"c1":"c2"]:k});mpIdSave();if(MP.nr)mpSet({c1:MP.id.c1,c2:MP.id.c2});mpLobbyPresence();return mpScreen()}
  if(a==="mpGo")return mpStart();
  if(a==="mpAgain")return mpAgain();
  if(a==="mpBack"&&MP.role==="h")return mpAgain();
  if(a==="mpBack"){MP.inRace=false;mpRestoreCareer();MP.view=MP.nr?"room":"home";UI.scr="mp";return render()}
  if(a==="mpQuit"){if(!b.dataset.sure){b.dataset.sure="1";b.textContent=MP.role==="h"?"Toque de novo: encerra para todos":"Toque de novo para sair";return}
    if(MP.role==="h"){mpBgStop();MP.inRace=false;mpSet({ph:"lobby",s:null,lg:null,res:null,seats:null,grid:null})}else{MP.inRace=false;mpSet({go:null,ans:null,cmd:null,quit:MP.cfg.sd})}
    sndSilence();mpRestoreCareer();MP.view=MP.nr?"room":"home";UI.scr="mp";return render()}}
function mpSelectCode(){const e=$("#mpCodeTxt");if(!e)return;const r=document.createRange();r.selectNodeContents(e);const s=window.getSelection();s.removeAllRanges();s.addRange(r)}
// ---------- dentro da corrida
function mpRaceDecor(){const pb=$("#pauseb");if(pb)pb.hidden=true;const row=$(".ctl .row");if(row&&!$("#mpNet"))row.insertAdjacentHTML("beforeend",`<span class="pill" id="mpNet"><span class="dot on"></span> online</span><button class="btn sm" data-act="mpQuit">Sair da corrida</button>`);
  if(R.spect){document.querySelectorAll(".radioctl > .card").forEach((c,i)=>{if(i<2)c.hidden=true});const rc=$(".radioctl");if(rc)rc.insertAdjacentHTML("afterbegin",`<div class="card" style="grid-column:1/-1"><h3>Você está assistindo</h3><p class="muted">O grid já estava completo. Use as câmeras para acompanhar a corrida.</p></div>`)}}
function mpNetTick(){const el=$("#mpNet");if(!el||!R||!R.mp)return;let t;
  if(R.mpHost){const on=R.cars.filter(c=>c.peer&&!c.isP);const ok=on.filter(c=>!c.gone).length;t=on.length?`online · ${ok} de ${on.length} conectado${on.length>1?"s":""}`:"online · só você"}
  else{const last=MP.snaps[MP.snaps.length-1];const lag=last?(performance.now()-last.recv)/1000:9;t=lag>2?"online · sinal fraco…":"online · ao vivo"}
  if(el._t!==t){el._t=t;el.innerHTML=`<span class="dot ${t.includes("fraco")?"":"on"}"></span> ${t}`}}
// (o resultado fica em mpssn.js)
