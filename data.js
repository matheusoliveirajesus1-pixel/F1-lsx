// ===================== DADOS GERAIS =====================
const POINTS=[25,18,15,12,10,8,6,4,2,1];// desde 2025 não há ponto extra pela volta mais rápida
const SPRINT_PTS=[8,7,6,5,4,3,2,1];
const COMP=TYRES;
const PU={mercedes:{n:"Mercedes",power:1.012},ferrari:{n:"Ferrari",power:1.008},rbford:{n:"Red Bull Ford",power:.998},honda:{n:"Honda",power:.982},audi:{n:"Audi",power:.986}};
// as 11 equipes do grid de 2026 com os nomes reais (pilotos e chefes são fictícios). A força inicial segue a classificação real de 2026.
const TEAMS0=[
 {id:"mercedes",n:"Mercedes",c:"#27F4D2",c2:"#1A1A1A",tier:92,pu:"mercedes",rep:96,boss:"Karl Weidner",style:"frio"},
 {id:"ferrari",n:"Ferrari",c:"#E8002D",c2:"#FFE600",tier:91,pu:"ferrari",rep:97,boss:"Lorenzo Vietti",style:"agressivo"},
 {id:"redbull",n:"Red Bull Racing",c:"#3671C6",c2:"#DC0032",tier:90,pu:"rbford",rep:95,boss:"James Whitlock",style:"calculista"},
 {id:"mclaren",n:"McLaren",c:"#FF8000",c2:"#1A1A1A",tier:90,pu:"mercedes",rep:94,boss:"Andrew Hale",style:"exigente"},
 {id:"racingbulls",n:"Racing Bulls",c:"#6692FF",c2:"#F2F2F2",tier:85,pu:"rbford",rep:78,boss:"Mike Carrow",style:"paciente"},
 {id:"alpine",n:"Alpine",c:"#FF87BC",c2:"#0093CC",tier:84,pu:"mercedes",rep:76,boss:"Sophie Laurent",style:"calculista"},
 {id:"haas",n:"Haas",c:"#E6E6E6",c2:"#DA291C",tier:83,pu:"ferrari",rep:70,boss:"Greg Dalton",style:"exigente"},
 {id:"audi",n:"Audi",c:"#8A8D8F",c2:"#E2001A",tier:82,pu:"audi",rep:76,boss:"Matthias Kern",style:"frio"},
 {id:"williams",n:"Williams",c:"#64C4FF",c2:"#00205B",tier:82,pu:"mercedes",rep:74,boss:"Thomas Reeve",style:"paciente"},
 {id:"astonmartin",n:"Aston Martin",c:"#229971",c2:"#CEDC00",tier:81,pu:"honda",rep:82,boss:"Hugh Carlisle",style:"agressivo"},
 {id:"cadillac",n:"Cadillac",c:"#3A3A3A",c2:"#F2F2F2",tier:79,pu:"ferrari",rep:60,boss:"Renata Duarte",style:"paciente",rookieTeam:true}
];
// garagens do pit lane: ordem do campeonato de construtores do ano anterior (2025); a equipe nova fica no fim
const GARAGE0=["mclaren","mercedes","redbull","ferrari","williams","racingbulls","astonmartin","haas","audi","alpine","cadillac"];
// carreiras salvas com as equipes fictícias antigas: cada uma vira a equipe real de força parecida
const OLD_TEAM_IDS={halberg:"mercedes",vortex:"ferrari",orion:"redbull",kitsune:"mclaren",albatross:"racingbulls",meridian:"alpine",atlas:"haas",sakura:"audi",corvo:"williams",nordic:"astonmartin",aurora:"cadillac"};
const NATS={
  BRA:{f:["Lucas","Rafael","Thiago","Bruno","Felipe","Gabriel","Caio","Matheus","Enzo","Pedro"],l:["Almeida","Barros","Siqueira","Moraes","Teixeira","Carvalho","Pacheco","Rezende","Fontana","Azevedo"]},
  GBR:{f:["Oliver","Harry","Jack","George","Alfie","Callum"],l:["Whitmore","Ashby","Fletcher","Hollis","Brennan","Calloway"]},
  NED:{f:["Daan","Sem","Luuk","Bram"],l:["van Dijkstra","Hoekstra","de Wit","Visser"]},
  ESP:{f:["Pablo","Álvaro","Diego","Iker"],l:["Navarro","Castillo","Ibarra","Montero"]},
  ITA:{f:["Marco","Luca","Matteo","Davide"],l:["Ferrante","Bellini","Rinaldi","Galli"]},
  FRA:{f:["Théo","Hugo","Louis","Mathis"],l:["Moreau","Garnier","Lefèvre","Dumont"]},
  GER:{f:["Lukas","Felix","Jonas","Niklas"],l:["Brandt","Keller","Vogt","Hartmann"]},
  MEX:{f:["Sergio","Emilio","Andrés"],l:["Villarreal","Cárdenas","Ortega"]},
  AUS:{f:["Liam","Cooper","Mitchell"],l:["Harland","Doyle","McKenna"]},
  JPN:{f:["Yuki","Ren","Haruto","Sota"],l:["Takeda","Morimoto","Kagawa","Ishida"]},
  FIN:{f:["Aleksi","Eero","Joonas"],l:["Virtanen","Lahtinen","Koskela"]},
  MON:{f:["Arthur","Charles"],l:["Rossel","Médecin"]},
  CAN:{f:["Nathan","Logan","Félix"],l:["Tremblay","Gagnon","Mackenzie"]},
  ARG:{f:["Franco","Tomás","Nicolás"],l:["Benítez","Aguirre","Sosa"]},
  CHN:{f:["Zhou","Wei","Hao"],l:["Lin","Zhang","Guo"]},
  USA:{f:["Logan","Tyler","Ryan"],l:["Mercer","Callahan","Brooks"]},
  THA:{f:["Kiet","Arun"],l:["Suwan","Chai"]},
  NZL:{f:["Liam","Jack"],l:["Lawton","Reid"]}};
const NAT_NAME={BRA:"Brasil",GBR:"Grã-Bretanha",NED:"Holanda",ESP:"Espanha",ITA:"Itália",FRA:"França",GER:"Alemanha",MEX:"México",AUS:"Austrália",JPN:"Japão",FIN:"Finlândia",MON:"Mônaco",CAN:"Canadá",ARG:"Argentina",CHN:"China",USA:"Estados Unidos",THA:"Tailândia",NZL:"Nova Zelândia",POR:"Portugal"};
// imprensa
const OUTLETS=[
 {id:"gpbr",n:"GP Brasil Hoje",tone:"patriota",nat:"BRA"},{id:"paddock",n:"Paddock Insider",tone:"bastidores"},{id:"motorde",n:"Motor Diário",tone:"técnico"},
 {id:"speedtv",n:"SpeedTV Global",tone:"sensacionalista"},{id:"racefan",n:"RaceFans Brasil",tone:"torcedor",nat:"BRA"},{id:"times",n:"The Grid Times",tone:"sério"}];
const JOURNOS=[{n:"Marina Lopes",o:"gpbr"},{n:"Ted Carrington",o:"speedtv"},{n:"Giulia Ferri",o:"motorde"},{n:"Ben Archer",o:"paddock"},{n:"Ana Bezerra",o:"racefan"},{n:"Henrik Sand",o:"times"}];
const FAN_NAMES=["vrumvrum_br","boxboxbox","pitlane_girl","senna_eterno","f1nerd","curva_do_sol","podio_ou_nada","undercut_king","grid_zero","bandeira_quadriculada","ultrapassagem_br","pneu_macio","telemetria_br","garagem77","safety_car_fan","marchinha","parabolica","tifosi_br","racing_lady","domingo_de_f1"];
// utilidades
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
let RNG=Math.random;function rnd(){return RNG()}
function rr(a,b){return a+rnd()*(b-a)}function ri(a,b){return Math.floor(rr(a,b+1))}function pick(a){return a[Math.floor(rnd()*a.length)]}
function gauss(){return(rnd()+rnd()+rnd()-1.5)}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashS(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
const moneyS=v=>Math.abs(v)<1?(v<0?"-":"")+"$"+Math.round(Math.abs(v)*1000)+" mil":money(v);
const money=v=>(v<0?"-":"")+"$"+Math.abs(v).toFixed(2).replace(".",",")+" mi";
const fmtT=s=>{if(s==null||!isFinite(s))return"—";const m=Math.floor(s/60),r=s-m*60;return(m?m+":":"")+(m?r.toFixed(3).padStart(6,"0"):r.toFixed(3))};
const fmtK=n=>n>=1e6?(n/1e6).toFixed(1).replace(".",",")+" mi":n>=1e3?(n/1e3).toFixed(n>=1e4?0:1).replace(".",",")+" mil":String(Math.round(n));

// geometria isométrica compartilhada (o desenho da pista é carregado só quando o fim de semana começa)
let TRACKGEO=null;
const ISO_C=.866,ISO_S=.5;
const WS=3.6;// 1 metro = 3,6 unidades do mundo (pista ampliada, formato real)
