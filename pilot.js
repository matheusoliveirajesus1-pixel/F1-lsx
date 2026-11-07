// ===================== PILOTO: EXPERIÊNCIA, ESTADO NA CORRIDA E RIVALIDADES =====================
// Experiência: largadas na F1, corridas na chuva e voltas em cada pista (conhecimento do traçado).
// Estado (0 a 100, muda durante a corrida): confiança, nervosismo, cansaço, frustração e foco.
// Rivalidade: toques e brigas criam um histórico entre dois pilotos que muda como eles disputam.

// pistas novas no calendário (ninguém tem anos de experiência nelas)
const TRK_YEAR={madrid:2026,lasvegas:2023,miami:2022,lusail:2021,zandvoort:2021};
// calor e umidade cansam mais
const TRK_HEAT={singapura:1.6,lusail:1.45,miami:1.3,budapest:1.2,mexico:1.15,abudhabi:1.1,baku:1.1,austin:1.1,interlagos:1.05};
function dExp(d){if(!d.exp)d.exp={yrs:0,starts:0,wet:0,laps:{}};if(!d.exp.laps)d.exp.laps={};return d.exp}
function curYear(){return(typeof G!=="undefined"&&G&&G.year)||2026}
// voltas "de verdade" que o piloto já tem na pista: categorias de base + temporadas de F1 + o que fez no jogo
function trackLaps(d,id,extra){const e=dExp(d),ty=TRK_YEAR[id]||1990;const yrs=Math.min(e.yrs||0,Math.max(0,curYear()-ty));
  return(ty<2021?50:0)+yrs*110+(e.laps[id]||0)+(extra||0)}
function famOf(d,id,extra){if(!id)return 1;return 1-Math.exp(-trackLaps(d,id,extra)/110)}
function adaptK(d){return 1.5-((d.a&&d.a.adapt)||75)/100}
// ritmo perdido por não conhecer bem a pista (até ~0,3% para um estreante numa pista nova)
function famMu(d,id,extra){return 1-(1-famOf(d,id,extra))*.0035*adaptK(d)}
function raceExtraLaps(c){return(c.lap||0)/((typeof G!=="undefined"&&G&&G.settings&&G.settings.dist)||.25)}
// risco extra de errar por inexperiência
function expRisk(c){const d=c.d,e=dExp(d);const fam=famOf(d,R.C.id,raceExtraLaps(c));
  return(1+.3*Math.exp(-(e.starts||0)/25))*(1+(1-fam)*.3*adaptK(d))*(1+R.w*.3*Math.exp(-(e.wet||0)/5))}
// chance de segurar o carro num erro (controle + experiência)
function saveChance(c){const e=dExp(c.d);return clamp((sk(c,"ctrl")-55)/110+.1*(1-Math.exp(-(e.starts||0)/50)),0,.42)}
function famLabel(f){return f>.93?"conhece de cor":f>.75?"conhece bem":f>.5?"ainda aprendendo":f>.25?"pouco conhecida":"nunca correu aqui"}
// adiciona voltas de treino/classificação ao conhecimento da pista
function addTrackLaps(d,id,n){const e=dExp(d);e.laps[id]=Math.round((e.laps[id]||0)+n)}
function expAfterRace(){if(!R||!R.cars||(typeof G!=="undefined"&&G&&G.mp))return;const id=R.C.id,wet=(R.wetLaps||0)>=Math.max(2,R.L*.25);
  for(const c of R.cars){if(c.status==="dns")continue;addTrackLaps(c.d,id,raceExtraLaps(c));if(wet)dExp(c.d).wet++}}

// ---------- estado do piloto durante a corrida
function stInit(c){const d=c.d,a=d.a,e=dExp(d);const rookie=Math.exp(-(e.starts||0)/20);
  c.st={conf:clamp(52+((d.morale??70)-70)*.5+rr(-6,6),20,88),nerv:clamp(18+(75-(a.mental||75))*.7+rookie*18+(c.grid<=3?8:0)+rr(-5,5),0,85),fat:0,frus:0,foco:clamp(92+((a.mental||75)-75)*.15,60,100),shaken:0,spam:0,said:{}};c.stuckT=0}
function stTick(c,dt0){const s=c.st;if(!s||!R.started)return;c.stAcc=(c.stAcc||0)+dt0;if(c.stAcc<.25)return;const dt=c.stAcc;c.stAcc=0;const a=c.d.a,mental=(a.mental||75)/100;
  const B=c.behind,close=!!(B&&running(B)&&!B.pit&&c.dB<c.v*.9&&B.t!==c.t);const left=R.L-c.lap,p=pos(c);
  let tgt=12+(1-mental)*30+(close?28*(1.3-mental):0)+(p===1?8:0)+(left<=3&&(p<=3||(p>=9&&p<=11))?10:0)+(c.lap<1?10:0)+s.shaken*.4;
  if(R.sc)tgt*=.5;s.nerv=clamp(s.nerv+(tgt-s.nerv)*Math.min(1,dt*(tgt>s.nerv?.12:.04)),0,100);
  // frustração: preso atrás de um carro que não é mais rápido
  const A=c.ahead,stuck=!!(A&&running(A)&&!A.pit&&c.dA<c.v*.9&&!R.sc&&A.L>c.L-.05);
  if(stuck){c.stuckT+=dt;if(c.stuckT>20)s.frus=Math.min(100,s.frus+dt*.35*(1.2-mental*.6))}else{c.stuckT=Math.max(0,c.stuckT-dt*2);s.frus=Math.max(0,s.frus-dt*.06)}
  s.shaken=Math.max(0,s.shaken-dt*.35);s.spam=Math.max(0,s.spam-dt*.25);
  s.foco=clamp(96+((a.mental||75)-75)*.15-s.fat*.45-s.shaken*.8-Math.max(0,s.spam-6)*1.6,15,100);
  s.conf=clamp(s.conf+((52+((c.d.morale??70)-70)*.3)-s.conf)*dt*.004,0,100);
  // briga longa entre os mesmos dois pilotos vira rivalidade
  if(A&&c.dA<CARL*2.2&&A.t!==c.t&&!R.sc&&running(A))feudAdd(c.d.id,A.d.id,dt*.025)}
function stLap(c){const s=c.st;if(!s)return;const a=c.d.a;const dist=(G&&G.settings&&G.settings.dist)||.25;
  s.fat=Math.min(100,s.fat+.5*(1.6-(a.fitness||75)/100)*(TRK_HEAT[R.C.id]||1)*({attack:1.2,normal:1,save:.85}[c.mode]||1)/dist);// ~25 pontos numa corrida inteira; mais no calor
  if(!c.pit&&!R.sc&&c.lap>1)s.conf=Math.min(100,s.conf+.5);
  if(c.hum)stRadio(c)}
// acontecimentos que mexem com a cabeça do piloto
function stEv(c,type,x){const s=c&&c.st;if(!s)return;
  switch(type){case"pass":s.conf+=5;s.frus=Math.max(0,s.frus-15);s.nerv-=3;break;
    case"lost":s.conf-=3;s.frus+=3;s.nerv+=2;break;
    case"err":{const k={minor:[1.5,4],off:[5,10],spin:[10,18],crash:[12,22]}[x]||[2,4];s.conf-=k[0];s.shaken+=k[1];if(x==="spin")s.frus+=5;break}
    case"save":s.conf-=1;s.shaken+=8;s.nerv+=4;break;
    case"hit":s.conf-=2;s.frus+=8;s.shaken+=6;break;
    case"hitter":s.conf-=3;s.shaken+=6;break;
    case"fast":s.conf+=3;break;
    case"order":s.frus+=20;s.conf-=3;break;
    case"radio":s.spam+=4;break}
  s.conf=clamp(s.conf,0,100);s.nerv=clamp(s.nerv,0,100);s.frus=clamp(s.frus,0,100)}
// multiplicadores usados no risco e no ritmo
function stateRisk(c){const s=c.st;if(!s)return 1;return(1+s.nerv*.005)*(s.conf<50?1+(50-s.conf)*.008:1-(s.conf-50)*.003)*(1+s.frus*.004)*(1+(100-s.foco)*.006)*(1+s.fat*.004)}
function stateMu(c){const s=c.st;if(!s)return 1;return 1+(s.conf-50)*.00005-s.fat*.00004-(100-s.foco)*.00003}
function aggrEff(c,A){const s=c.st;return clamp(c.aggr+(s?s.frus*.003:0)+(A?feud(c.d.id,A.d.id)*.004:0),.05,1)}
// falas do piloto conforme o estado (sem repetir toda hora)
function stRadio(c){const s=c.st,said=s.said,L=c.lap;const ok=(k,gap)=>!(said[k]!=null&&L-said[k]<gap);const say=(k,t,o)=>{said[k]=L;radio(c,t,Object.assign({me:1,k:"piloto"},o||{}))};
  const A=c.ahead;
  if(s.frus>55&&ok("frus",5)&&A&&running(A))say("frus",pick([`Estou preso atrás do ${A.code} há muito tempo! Me dá alguma coisa: bateria, estratégia, qualquer coisa.`,`Não consigo passar o ${A.code}. Preciso de outra ideia!`]),{sug:"go"});
  else if(s.nerv>64&&ok("nerv",6)&&c.behind&&running(c.behind)&&c.dB<c.v*.9)say("nerv",pick([`O ${c.behind.code} está colado, a pressão é grande.`,`Tá difícil segurar, ele está em cima de mim.`]));
  else if(s.fat>50&&ok("fat",99))say("fat","Estou ficando cansado, o pescoço está pesando.");
  else if(s.spam>12&&ok("spam",4))say("spam","Menos rádio, por favor! Deixa eu me concentrar.");
  else if(s.conf>82&&ok("conf",99))say("conf","O carro está ótimo, estou muito confiante!")}

// ---------- rivalidades (histórico de disputas entre dois pilotos)
function fkey(a,b){return a<b?a+"|"+b:b+"|"+a}
function feud(a,b){const F=typeof G!=="undefined"&&G&&G.feud;if(!F||!a||!b)return 0;const f=F[fkey(a,b)];return f?Math.min(60,f.s):0}
function feudAdd(a,b,v,why){if(typeof G==="undefined"||!G||!a||!b||a===b)return;G.feud=G.feud||{};const k=fkey(a,b);const f=G.feud[k]||(G.feud[k]={s:0,n:0});
  f.s=Math.min(100,f.s+v);if(why){f.n++;f.why=why;f.trk=R&&R.C?R.C.n:"";f.y=G.year}}
function feudDecay(){if(!G||!G.feud)return;for(const k in G.feud){const f=G.feud[k];f.s*=.82;if(f.s<3)delete G.feud[k]}}
function myFeuds(){const out=[];if(!G||!G.feud)return out;for(const k in G.feud){const[a,b]=k.split("|");if(a!==G.me&&b!==G.me)continue;const o=a===G.me?b:a;if(!G.drivers[o])continue;out.push({d:G.drivers[o],...G.feud[k]})}return out.sort((x,y)=>y.s-x.s)}
// aviso quando reencontra um rival na pista
function feudMeet(c,A){if(!c.hum||!A||c.feudSaid&&c.feudSaid[A.id])return;const f=feud(c.d.id,A.d.id);if(f<25)return;c.feudSaid=c.feudSaid||{};c.feudSaid[A.id]=1;
  const F=G.feud[fkey(c.d.id,A.d.id)];radio(c,pick([`${A.code} de novo... depois do que aconteceu${F&&F.trk?` em ${F.trk}`:""}, não vou dar espaço.`,`Olha quem está aí: ${A.code}. Essa briga é pessoal.`]),{me:1,k:"rival"})}
