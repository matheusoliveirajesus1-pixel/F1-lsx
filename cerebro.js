// ===================== CÉREBRO DA CORRIDA =====================
// Liga todos os dados da corrida do jogador, causa com consequência, e conta essa história para a imprensa:
// quem bateu em quem, quem teve culpa, qual punição saiu (ou não saiu), que peças quebraram, se furou pneu,
// quantas paradas extras e voltas foram perdidas, se o abandono veio de um dano (e não de "falha mecânica"),
// chuva, safety car, largada, recuperação, pneus, combustível, companheiro e rival.
// A coleta é feita embrulhando funções da simulação (não muda nenhum resultado) e roda também nos testes sem tela.
(function(GL){
const PART={wingL:"asa dianteira (lado esquerdo)",wingR:"asa dianteira (lado direito)",nose:"bico",floor:"assoalho",cool:"radiador",side:"lateral",gear:"câmbio",rwing:"asa traseira",body:"carroceria"};
const RODA=["suspensão dianteira esquerda","suspensão dianteira direita","suspensão traseira esquerda","suspensão traseira direita"];
const PECA={"câmbio":["câmbio","o"],"motor":["motor","o"],"suspensão quebrada":["suspensão","a"],"roda arrancada":["roda","a"],"freios":["freios","os"],"hidráulica":["hidráulica","a"],"elétrica":["parte elétrica","a"],"sem combustível":["combustível","o"]};
function artPeca(p){const [n,a]=PECA[p]||[p||"falha","a"];const de={o:"do",a:"da",os:"dos",as:"das"}[a];return{oPeca:a+" "+n,OPeca:a.toUpperCase().slice(0,1)+a.slice(1)+" "+n,doPeca:de+" "+n}}
const pk=a=>a[Math.floor(Math.random()*a.length)];
function D(){if(typeof R==="undefined"||!R)return null;if(!R.dos)R.dos={ev:[],lat:{},dnf:{},pits:[],voltas:[],sc:[],chuva:[],ultT:-9};return R.dos}
function eu(){return R&&R.cars?R.cars.find(c=>c.isP):null}
function nome(id){const d=G.drivers&&G.drivers[id];return d?d.n.split(" ").pop():"?"}
function foto(c){const d=c.dmg||{};return{wingL:d.wingL||0,wingR:d.wingR||0,nose:d.nose||0,floor:d.floor||0,cool:d.cool||0,side:d.side||0,gear:d.gear||0,rwing:d.rwing||0,body:d.body||0,whl:(d.whl||[0,0,0,0]).slice(),punct:!!(c.tyre&&c.tyre.punct)}}
function danosEntre(a,b){const out=[];for(const k in PART){const dv=(b[k]||0)-(a[k]||0);if(dv>.08)out.push({p:k,n:PART[k],v:+(b[k]).toFixed(2)})}
  b.whl.forEach((w,i)=>{if(w-(a.whl[i]||0)>.12)out.push({p:"whl"+i,n:RODA[i],v:+w.toFixed(2)})});if(b.punct&&!a.punct)out.push({p:"punct",n:"pneu furado",v:1});return out}
function interessa(c){return c&&(c.isP||c.id===G.rival||(typeof mate==="function"&&mate()&&mate().id===c.id))}
// ---------- coleta
function embrulha(nomeF,antes,depois){const f=GL[nomeF];if(typeof f!=="function"||f._cer)return;const w=function(){let ctx;try{ctx=antes&&antes.apply(this,arguments)}catch(e){}const r=f.apply(this,arguments);try{depois&&depois.call(this,ctx,arguments,r)}catch(e){}return r};w._cer=1;GL[nomeF]=w}
function instala(){
  // toques: guarda quem estava atrás, o tipo, a força e as peças que quebraram em cada carro
  embrulha("contactEvent",(rear,front)=>interessa(rear)||interessa(front)?{a:foto(rear),b:foto(front)}:null,(s,[rear,front,mode,E])=>{if(!s)return;const d=D();
    const ev={i:d.ev.length,t:R.t,lap:Math.max(1,(R.lead||0)+1),tipo:"toque",atras:rear.id,frente:front.id,mode,E:+(E||0).toFixed(2),danos:{}};ev.danos[rear.id]=danosEntre(s.a,foto(rear));ev.danos[front.id]=danosEntre(s.b,foto(front));
    // junta toques seguidos do mesmo par (o mesmo lance)
    const liga=i=>[rear,front].forEach(c=>{const L=d.lat[c.id];if(L&&L.ev==null&&R.t-L.t<.05)L.ev=i});
    const ult=d.ev[d.ev.length-1];if(ult&&ult.tipo==="toque"&&R.t-ult.t<2.5&&((ult.atras===rear.id&&ult.frente===front.id)||(ult.atras===front.id&&ult.frente===rear.id))){for(const id in ev.danos)ult.danos[id]=(ult.danos[id]||[]).concat(ev.danos[id]);ult.E=Math.max(ult.E,ev.E);liga(ult.i);return}
    d.ev.push(ev);liga(ev.i)});
  embrulha("exWall",c=>c&&c.isP?{a:foto(c)}:null,(s,[c,imp])=>{if(!s)return;const d=D();d.ev.push({i:d.ev.length,t:R.t,lap:Math.max(1,(R.lead||0)+1),tipo:"muro",atras:c.id,frente:null,E:+(imp||0).toFixed(1),danos:{[c.id]:danosEntre(s.a,foto(c))}})});
  // peça que vai quebrar depois por causa de um dano: liga ao último toque daquele carro
  embrulha("latentFail",null,(s,[c,why])=>{const d=D();if(!d||!c)return;const ev=[...d.ev].reverse().find(e=>(e.atras===c.id||e.frente===c.id)&&R.t-e.t<4);if(!d.lat[c.id])d.lat[c.id]={why,ev:ev?ev.i:null,t:R.t,lap:Math.max(1,(R.lead||0)+1)}});
  embrulha("dnf",c=>c&&c.status==="run"?{why0:c.why}:null,(s,[c,why,kind])=>{if(!s)return;const d=D();if(!d)return;const L=d.lat[c.id];let causa=null;
    const toques=[...d.ev].reverse().filter(e=>e.tipo==="toque"&&(e.atras===c.id||e.frente===c.id));const rec=toques.find(e=>R.t-e.t<15);
    if(L&&L.why===why)causa={tipo:"dano",ev:L.ev};
    else if(/Suspens|Roda/.test(why)&&toques.length)causa={tipo:"dano",ev:toques[0].i};
    else if(/^Acidente|Atolou/.test(why))causa=rec||/toque/.test(why)?{tipo:"toque",ev:rec?rec.i:(toques[0]?toques[0].i:null)}:{tipo:"sozinho"};
    d.dnf[c.id]={why:String(why).replace(/ \(toque\)/,""),lap:c.lap,t:R.t,causa}});
  // paradas: motivo (plano, furo, conserto de asa, bandeira preta e laranja)
  embrulha("enterPit",c=>c&&c.isP?{f:foto(c),comp:c.tyre&&c.tyre.c,w:c.tyre&&c.tyre.wear,bo:!!c.bo}:null,(s,[c])=>{if(!s)return;const d=D();const f=s.f;const mot=[];if(f.punct)mot.push("pneu furado");if(f.wingL>.25||f.wingR>.25||f.nose>.25)mot.push("trocar a asa");if(s.bo)mot.push("bandeira preta e laranja");
    d.pits.push({lap:c.lap,t:R.t,de:s.comp,para:c.pit&&c.pit.comp,desgaste:+(s.w||0).toFixed(2),motivo:mot,sc:!!R.sc})});
  // a cada segundo de simulação: volta, posição, safety car e chuva
  embrulha("step",null,()=>{const d=D();if(!d||!R.started||R.t-d.ultT<1)return;d.ultT=R.t;const me=eu();if(!me)return;
    const v=d.voltas;if(!v.length||v[v.length-1].lap!==me.lap){v.push({lap:me.lap,pos:R.order.indexOf(me)+1,comp:me.tyre&&me.tyre.c,wear:+((me.tyre&&me.tyre.wear)||0).toFixed(2),rain:+(R.rain||0).toFixed(2),fuel:me.fuel,batt:me.batt})}
    const sc=R.sc?R.sc.type:null;const ls=d.sc[d.sc.length-1];if(sc&&(!ls||ls.fim!=null||ls.tipo!==sc))d.sc.push({tipo:sc,lap:Math.max(1,(R.lead||0)+1),fim:null});if(!sc&&ls&&ls.fim==null)ls.fim=Math.max(1,(R.lead||0)+1)});
}
// ---------- a história da corrida do jogador (o "dossiê")
function veredito(outroId,lap){const L=(R.stewRep||[]).filter(x=>x.id===outroId&&Math.abs((x.lap||0)-lap)<=2);if(!L.length)return null;const v=L[L.length-1];return v.verdict||null}
function textoPen(v){if(!v)return"nenhuma punição";const s=String(v).toLowerCase();if(/sem|nenhum|incidente de corrida|arquiv/.test(s))return"nenhuma punição";return v}
function listaDanos(L){const n=[...new Set(L.filter(x=>x.p!=="punct").map(x=>x.n.replace(/ \(lado.*\)/,"")))];if(!n.length)return"";return n.length===1?n[0]:n.slice(0,-1).join(", ")+" e "+n[n.length-1]}
function historia(){if(typeof R==="undefined"||!R||!R.dos||!R.result)return null;if(R.dos.hist)return R.dos.hist;const d=R.dos,me=eu();if(!me)return null;const cls=R.result.cls;const e=cls.find(x=>x.d===G.me);if(!e)return null;
  const lider=cls[0],voltasAtras=Math.max(0,(lider.laps||0)-(e.laps||0));const C=CIR[G.calendar[Math.max(0,Math.min(G.round,G.calendar.length-1))]]||{};
  const H={gp:R.C&&R.C.gp||C.gp||"",pos:e.pos,status:e.status,why:e.why,grid:me.grid,voltasAtras,beats:[]};const B=(k,imp,v)=>H.beats.push({k,imp,...v});
  // toques que envolvem o jogador
  const meus=d.ev.filter(x=>x.atras===me.id||x.frente===me.id);
  meus.forEach(x=>{const outro=x.atras===me.id?x.frente:x.atras;const danos=x.danos[me.id]||[];const fuiAtingido=x.tipo==="toque"&&x.frente===me.id&&(x.mode==="long"||danos.length);
    const inc=(R.incidents||[]).find(i=>Math.abs(i.t-x.t)<8&&(i.other===outro||i.cul===outro||i.vic===outro));const culpaMinha=inc?inc.cul===me.id:x.atras===me.id&&x.mode==="long";
    if(x.tipo==="muro"){if(danos.length)B("muro",55+danos.length*5,{volta:x.lap,danos:listaDanos(danos),ev:x.i});return}
    if(!outro)return;const pen=textoPen(veredito(outro,x.lap)),penMinha=textoPen(veredito(me.id,x.lap));
    if(!culpaMinha&&(fuiAtingido||danos.length))B("atingido",60+Math.min(30,danos.length*8),{furou:danos.some(d=>d.p==="punct"),quem:outro,volta:x.lap,pen,danos:listaDanos(danos),traseira:x.mode==="long",ev:x.i,danosN:danos.length});
    else if(culpaMinha)B("causei",50+(x.danos[outro]||[]).length*8,{quem:outro,volta:x.lap,pen:penMinha,danosOutro:listaDanos(x.danos[outro]||[]),danos:listaDanos(danos),ev:x.i})});
  // o dano custou a corrida? paradas fora do plano e voltas perdidas
  const extras=d.pits.filter(p=>p.motivo.length);const furo=extras.find(p=>p.motivo.includes("pneu furado"));
  const ating=H.beats.find(b=>b.k==="atingido"||b.k==="causei"||b.k==="muro");
  const vaiAbandonar=e.status==="dnf";if(extras.length&&ating&&!vaiAbandonar)B("dano_custou",70+voltasAtras*6,{quem:ating.quem,volta:ating.volta,voltas:voltasAtras,paradas:extras.length,motivos:[...new Set(extras.flatMap(p=>p.motivo))].join(" e "),culpa:ating.k==="causei"});
  else if(furo&&!ating)B("furo",45,{volta:furo.lap});
  // abandono: com a causa raiz
  const dn=d.dnf[me.id];if(e.status==="dnf"&&dn){const ev=dn.causa&&dn.causa.ev!=null?d.ev[dn.causa.ev]:null;const outro=ev?(ev.atras===me.id?ev.frente:ev.atras):null;
    if(dn.causa&&dn.causa.tipo==="dano")B("abandono_dano",95,{peca:String(dn.why).toLowerCase(),quem:outro,volta:ev?ev.lap:null,voltaFim:dn.lap,culpa:ev&&ev.atras===me.id&&ev.mode==="long",paradas:extras.length,motivos:[...new Set(extras.flatMap(p=>p.motivo))].join(" e ")});
    else if(dn.causa&&dn.causa.tipo==="toque")B("abandono_toque",92,{quem:outro,volta:dn.lap,culpa:ev&&ev.atras===me.id});
    else if(dn.causa&&dn.causa.tipo==="sozinho")B("abandono_erro",85,{volta:dn.lap});
    else B("abandono_mec",75,{peca:String(dn.why||"falha").toLowerCase(),volta:dn.lap})}
  // punição minha que não veio de toque
  (R.stewRep||[]).filter(x=>x.me&&x.verdict&&!/sem|nenhum|incidente/i.test(x.verdict)).forEach(x=>{if(!H.beats.some(b=>b.k==="causei"&&Math.abs(b.volta-x.lap)<=2))B("punicao",58,{pen:x.verdict,motivo:x.why||"",volta:x.lap})});
  // largada, recuperação e queda (só quando não há abandono)
  const v=d.voltas;if(v.length>2){const p1=(v.find(x=>x.lap>=1)||v[0]).pos;const dl=me.grid-p1;if(Math.abs(dl)>=3)B(dl>0?"largada_boa":"largada_ruim",38+Math.abs(dl)*3,{ganho:Math.abs(dl),grid:me.grid,p1})}
  if(e.pos){const dg=me.grid-e.pos;if(dg>=5&&!ating)B("recuperacao",52+dg*2,{ganho:dg,grid:me.grid});if(dg<=-5&&!ating&&!H.beats.some(b=>/abandono/.test(b.k)))B("queda",48,{perda:-dg,grid:me.grid})}
  // chuva: quando começou e quando você trocou
  const ch=v.find(x=>x.rain>.3);if(ch){const troca=d.pits.find(p=>p.lap>=ch.lap-1&&p.para&&!COMP[p.para].dry);const atraso=troca?troca.lap-ch.lap:null;B("chuva",46,{voltaChuva:ch.lap,atraso,trocou:!!troca,comp:troca?COMP[troca.para].n.toLowerCase():null})}
  // safety car: parou embaixo dele?
  const scP=d.pits.find(p=>p.sc&&!p.motivo.length);if(scP)B("sc_box",40,{volta:scP.lap});
  // pneus e estratégia
  const ult=v[v.length-1];if(ult&&ult.wear>.82&&e.status==="ok")B("pneu_limite",34,{wear:Math.round(ult.wear*100),comp:COMP[ult.comp]?COMP[ult.comp].n.toLowerCase():""});
  // resultado, companheiro e rival
  if(e.status==="ok"){const bom=e.pos<=3||e.pos<=me.grid||(e.pts>0&&e.pos<=me.grid+2);B(e.pos===1?"vitoria":bom?"resultado_bom":"resultado_ruim",e.pos===1?90:e.pos<=3?72:e.pos<=10?40:26,{pos:e.pos,pts:e.pts||0,grid:me.grid})}
  const m=typeof mate==="function"?mate():null;const em=m&&cls.find(x=>x.d===m.id);if(em&&e.pos&&em.pos)B("companheiro",30+(e.pos<em.pos?6:0),{quem:m.id,venceu:e.pos<em.pos,dif:Math.abs(e.pos-em.pos)});
  const er=G.rival&&cls.find(x=>x.d===G.rival);if(er&&e.pos&&er.pos)B("rival",34,{quem:G.rival,venceu:e.pos<er.pos});
  H.beats.sort((a,b)=>b.imp-a.imp);d.hist=H;return H}
// ---------- perguntas e respostas próprias de cada acontecimento (nunca repetem texto dentro da mesma pergunta)
// t: textos da resposta (um é sorteado), tom: tom do jogo, ef: efeitos (alvo = relação com o piloto envolvido)
const BANCO={
  atingido:{q:["O {quem} acertou {traseira} na volta {volta} e {penTxt}. Foi justo?","Você foi atingido pelo {quem} na volta {volta}{comDanos}. O que passou pela sua cabeça?","Os comissários decidiram: {pen} para o {quem}. Você concorda?"],
    a:[["humilde",["Corrida é assim. Ele errou a freada e acontece com qualquer um.","Não vou crucificar ninguém. Foi um erro de julgamento dele."],{alvo:2,rep:2}],
       ["polemico",["{penCurta}? Ele acabou com a minha corrida. Os comissários precisam rever isso.","{penSe}, então vale tudo na pista. Não dá."],{alvo:-5,heat:6,pop:4,rep:-1},1],
       ["confiante",["Eu fiz a minha linha. Ele simplesmente não freou a tempo.","A culpa não foi minha, as imagens mostram."],{alvo:-2,pop:2}],
       ["emocional",["Dói demais. A gente tinha ritmo pra brigar lá na frente.","Fiquei muito chateado. O carro estava perfeito até ali."],{pop:3,morale:-2}],
       ["evasivo",["Prefiro ver as imagens com calma antes de falar dele.","Já conversei com a equipe. Agora é olhar pra frente."],{}]]},
  causei:{q:["O toque com o {quem} na volta {volta} foi culpa sua?","Você acertou o {quem}{danosOutroTxt}. Vai pedir desculpas?","Os comissários te deram {pen} pelo toque no {quem}. Concorda?"],
    a:[["humilde",["Foi erro meu. Calculei mal a freada e já pedi desculpas pra ele.","Assumo. Ele não merecia aquilo."],{alvo:4,heat:-4,rep:3}],
       ["confiante",["Foi uma disputa dura. Eu estava lá, ele fechou.","Acho que foi incidente de corrida. Os dois tinham direito ao espaço."],{alvo:-2,pop:1}],
       ["polemico",["Ele freou cedo demais. Não tinha como evitar.","Se ele não quer contato, não fecha a porta."],{alvo:-6,heat:7,pop:3,rep:-3},1],
       ["evasivo",["Ainda não vi as imagens.","Vamos conversar internamente."],{}]]},
  muro:{q:["Você bateu no muro na volta {volta} e ficou com {danos}. O que aconteceu?","O que deu errado naquele erro da volta {volta}?"],
    a:[["humilde",["Erro meu. Fui otimista demais na entrada.","Passei do limite. A equipe não merecia."],{trust:2,rep:2}],
       ["tecnico",["O carro escapou de traseira, pode ter sido pneu frio ou vento.","Peguei a sujeira fora do traçado e perdi a frente."],{trust:-1}],
       ["emocional",["Fiquei com muita raiva de mim mesmo.","Dá vontade de sumir. Mas faz parte."],{pop:2,morale:-2}],
       ["evasivo",["Vou ver os dados antes de falar.","Já passou. Próxima corrida."],{}]]},
  dano_custou:{q:["Depois do toque com o {quem}, você teve que parar {paradasTxt} para {motivosTxt} e terminou {voltasTxt}. Dava pra salvar algo?","Quanto aquele incidente da volta {volta} te custou hoje?"],
    a:[["emocional",["Custou tudo. Depois daquilo virou só sobreviver.","Acabou com o nosso domingo. A gente tinha carro pra pontuar."],{pop:3,morale:-2}],
       ["humilde",["A equipe fez um trabalho incrível pra me colocar de volta na pista.","Os mecânicos foram heróis. Eu só tentei levar o carro até o fim."],{trust:5}],
       ["polemico",["{culpaTxt}","Alguém precisa explicar por que um lance desses passa assim."],{heat:5,pop:3},1],
       ["evasivo",["Não adianta lamentar. É juntar os cacos.","Vamos analisar tudo com calma."],{}]]},
  abandono_dano:{q:["Você foi atingido pelo {quem}, teve que parar para {motivosTxt} e no fim {oPeca} quebrou. O que sobrou dessa corrida?","{OPeca} quebrou na volta {voltaFim}. Foi consequência do toque com o {quem} na volta {volta}?","A equipe confirmou que o problema {doPeca} veio daquele incidente da volta {volta}. Frustrante?","Você abandonou por causa {doPeca}. Dá pra culpar o {quem}?"],
    a:[["tecnico",["Sim. Depois do toque {oPeca} começou a dar sinal, e não teve jeito.","Os dados mostram: o dano veio do incidente. O carro aguentou o quanto deu."],{trust:2}],
       ["polemico",["{culpaAband}","O {quem} acabou com a minha corrida duas vezes: no toque e no abandono."],{alvo:-6,heat:6,pop:4},1],
       ["emocional",["É muito frustrante. A gente lutou o tempo todo com o carro machucado.","Saio daqui com o coração pesado. Não foi falha nossa."],{pop:3,morale:-3}],
       ["humilde",["A equipe fez tudo o que podia. Às vezes não dá.","Não vou culpar ninguém. É corrida."],{trust:4,rep:2}]]},
  abandono_toque:{q:["O toque com o {quem} te tirou da corrida na volta {volta}. Como você está?","O que aconteceu no lance com o {quem} que terminou com o seu abandono?"],
    a:[["emocional",["Estou bem fisicamente, mas é muito frustrante.","Dói ver a corrida acabar assim."],{pop:2,morale:-2}],
       ["polemico",["Ele não deixou espaço nenhum. Quero ver o que os comissários vão dizer.","Isso não pode ficar assim."],{alvo:-6,heat:6,pop:3},1],
       ["humilde",["Foi um lance de corrida. Acontece.","Ninguém quer sair assim. Vamos conversar."],{alvo:3,rep:2}],
       ["evasivo",["Ainda estou de cabeça quente. Melhor não falar agora.","Vamos ver as imagens."],{}]]},
  abandono_erro:{q:["Você bateu sozinho na volta {volta}. O que aconteceu?","Erro seu ou do carro na batida da volta {volta}?"],
    a:[["humilde",["Erro meu. Fui além do limite.","Assumo totalmente. Peço desculpas à equipe."],{trust:3,rep:2}],
       ["tecnico",["O carro escapou de repente, vamos olhar os dados.","Senti a traseira solta antes, pode ter algo ali."],{trust:-2}],
       ["emocional",["Estou com muita raiva de mim.","É um dia pra esquecer."],{pop:2,morale:-3}],
       ["evasivo",["Prefiro não falar agora.","Vamos analisar."],{}]]},
  abandono_mec:{q:["{OPeca} te deixou na mão na volta {volta}. A confiabilidade preocupa?","Mais um abandono por falha. A equipe está devendo?"],
    a:[["humilde",["Acontece. A equipe vai descobrir o que foi.","Confio no pessoal. Vamos voltar mais fortes."],{trust:5}],
       ["polemico",["Assim fica difícil. Precisamos de um carro que termine as corridas.","Não dá pra brigar por nada com o carro quebrando."],{trust:-8,heat:5,pop:2},1],
       ["emocional",["É frustrante, estava tudo indo bem.","Doeu. A gente merecia mais."],{pop:2,morale:-2}],
       ["evasivo",["Vamos esperar a análise.","Sem comentários por enquanto."],{}]]},
  furo:{q:["O pneu furou na volta {volta}. Foi detrito ou desgaste?","Como foi voltar ao box com o pneu furado?"],
    a:[["tecnico",["Peguei um detrito na pista. Não tinha o que fazer.","Acho que foi um pedaço de carro na trajetória."],{}],
       ["emocional",["Foi um susto. O carro ficou impossível de guiar.","Que azar. Estava indo bem."],{pop:2}],
       ["humilde",["A equipe reagiu rápido e salvou o que deu.","Bom trabalho do box pra me colocar de volta."],{trust:3}]]},
  punicao:{q:["Você levou {pen} na volta {volta}. Foi justo?","O que você achou da punição de {pen}?"],
    a:[["humilde",["Foi justo. Eu errei.","Aceito. Vou aprender."],{rep:2,heat:-3}],
       ["polemico",["Punição exagerada. Ninguém foi prejudicado.","Os critérios mudam toda corrida."],{heat:6,pop:2,rep:-2},1],
       ["evasivo",["As regras são essas.","Não vou comentar a decisão."],{}]]},
  largada_boa:{q:["Você ganhou {ganho} posições na largada. Qual foi o segredo?","Que largada! Do {grid}º para {p1}º. Planejado?"],
    a:[["confiante",["Reação boa nas luzes e a linha certa na curva um.","Eu estudo cada largada. Hoje encaixou."],{pop:3}],
       ["humilde",["Sorte também. Abriu espaço e eu aproveitei.","A equipe acertou o carro para a largada."],{trust:2}],
       ["tecnico",["A embreagem estava perfeita e a bateria cheia.","Pneus na temperatura certa fizeram a diferença."],{rep:1}]]},
  largada_ruim:{q:["Você perdeu {ganho} posições na largada. O que aconteceu?","A largada comprometeu a sua corrida?"],
    a:[["tecnico",["Patinei demais na saída.","Fiquei preso do lado sujo do grid."],{}],["humilde",["Erro meu nas luzes.","Larguei mal, não tem desculpa."],{rep:1}],["evasivo",["Acontece.","Vamos melhorar isso."],{}]]},
  recuperacao:{q:["Você saiu em {grid}º e ganhou {ganho} posições. Corrida de recuperação?","O que funcionou tão bem para subir {ganho} posições?"],
    a:[["confiante",["Eu sabia que tinha carro para isso. Foi só não errar.","Ritmo forte e ultrapassagens limpas."],{pop:3}],["humilde",["A estratégia da equipe foi perfeita.","Mérito de todo mundo."],{trust:3}],["tecnico",["Os pneus duraram mais que os dos outros.","Acertamos a janela de box."],{rep:2}]]},
  queda:{q:["Você largou em {grid}º e caiu {perda} posições. O que faltou?","O ritmo de corrida preocupa?"],
    a:[["tecnico",["Os pneus caíram muito antes do previsto.","Faltou velocidade de reta."],{}],["humilde",["Eu não encontrei o ritmo hoje.","Dia difícil, vamos entender."],{rep:1}],["polemico",["O carro simplesmente não anda.","Com esse carro não dá pra fazer mais."],{trust:-6,heat:4},1]]},
  chuva:{q:["A chuva chegou na volta {voltaChuva}. {chuvaTxt} Acertaram o momento?","Como foi guiar quando a chuva apertou?"],
    a:[["tecnico",["A decisão do pneu foi no limite, mas a gente arriscou certo.","Escutei a equipe e fomos na hora."],{trust:2}],["emocional",["Na chuva é onde a gente separa os pilotos. Adorei.","Foi tenso, o carro aquaplanava nas retas."],{pop:2}],["polemico",["Paramos tarde. Perdi muito tempo.","A equipe demorou para chamar."],{trust:-5,heat:3},1]]},
  sc_box:{q:["Você parou embaixo do safety car na volta {volta}. Sorte ou estratégia?"],
    a:[["confiante",["Estratégia. A gente estava pronto para isso.","Leitura perfeita da equipe."],{trust:3}],["humilde",["Um pouco de sorte também.","Caiu no momento certo."],{}]]},
  pneu_limite:{q:["Os seus pneus terminaram com {wear}% de desgaste. Dava pra ir mais uma volta?"],
    a:[["tecnico",["Estava no limite. Mais uma volta e talvez não chegasse.","Gerenciei cada curva no fim."],{rep:2}],["emocional",["Foi no fio do bigode!","Sofri muito no final."],{pop:2}]]},
  vitoria:{q:["Vitória no {gp}! O que passa pela cabeça agora?","Você largou em {grid}º e venceu. Foi a corrida perfeita?"],
    a:[["emocional",["Ainda não caiu a ficha. Isso é pra todo mundo que acreditou.","Sonhei com isso a vida inteira!"],{pop:5,morale:4}],["humilde",["Mérito da equipe. O carro foi perfeito do início ao fim.","Agradeço cada mecânico dessa equipe."],{trust:5}],["confiante",["Eu disse que ia acontecer. É só a primeira.","Hoje ninguém tinha o meu ritmo."],{pop:4,heat:2}]]},
  resultado_bom:{q:["{pos}º no {gp}, saindo de {grid}º. Dá pra comemorar?","Terminou em {pos}º. O que funcionou hoje?"],
    a:[["humilde",["Satisfeito. A equipe fez um trabalho limpo.","Resultado justo para o que tínhamos, sem erros."],{trust:3}],["confiante",["Isso é só o começo.","Eu sabia que dava pra andar aqui."],{pop:3}],["emocional",["Muito feliz! A equipe merece.","Que domingo bom!"],{pop:2,morale:2}],["tecnico",["Os pneus funcionaram bem no segundo stint.","Acertamos o carro para a corrida, não para a classificação."],{rep:2}]]},
  resultado_ruim:{q:["{pos}º hoje, depois de largar em {grid}º. O que faltou?","Terminou em {pos}º no {gp}. Era o máximo possível?"],
    a:[["humilde",["Não foi o nosso dia. Vamos entender e voltar mais fortes.","Eu também errei. Dá pra fazer melhor."],{trust:2,rep:1}],["tecnico",["Faltou ritmo de corrida, os pneus caíram cedo.","Perdemos tempo no tráfego e na estratégia."],{}],["emocional",["Frustrante. A gente esperava mais.","Saio daqui chateado, não vou mentir."],{pop:1,morale:-2}],["polemico",["Com um carro melhor eu estaria lá na frente.","Alguém precisa explicar esse ritmo."],{trust:-5,heat:4,pop:2},1]]},
  companheiro:{q:["Você {venceuTxt} o {quem} hoje. Como está o duelo interno?"],
    a:[["confiante",["Eu sempre quero bater o meu companheiro. É o primeiro adversário.","O placar fala por si."],{mate:-2,pop:2}],["humilde",["Somos um time. O importante é a equipe pontuar.","Ele é muito rápido, a gente se ajuda."],{mate:3,trust:2}]]},
  rival:{q:["E o {quem}? Você {venceuTxt} ele hoje."],
    a:[["confiante",["Ele sabe que eu estou aqui.","Hoje a vitória do duelo foi minha."],{rival:-2,pop:2}],["humilde",["Respeito muito ele.","Cada corrida é uma história."],{rival:2}],["polemico",["Ele fala muito e anda pouco.","Na pista é onde se resolve."],{rival:-6,heat:5,pop:4},1]]}};
const JORN_PREF={vitoria:["gpbr","times"],resultado_bom:["gpbr","times"],resultado_ruim:["motorde","times"],atingido:["speedtv","racefan","paddock"],causei:["speedtv","paddock"],dano_custou:["gpbr","motorde"],abandono_dano:["motorde","times","gpbr"],abandono_toque:["speedtv","gpbr"],abandono_mec:["motorde","times"],
  resultado:["gpbr","times"],chuva:["motorde"],largada_boa:["gpbr"],recuperacao:["gpbr","racefan"],rival:["speedtv","paddock"],companheiro:["paddock","racefan"]};
function vars(b,H){const nq=b.quem?nome(b.quem):"";const pen=b.pen||"nenhuma punição";const semPen=pen==="nenhuma punição";
  return{...b,...artPeca(b.peca),gp:H.gp,quem:nq,pen,penSe:semPen?"Se isso não dá punição":"Se isso vale só "+pen,penCurta:semPen?"Nenhuma punição":pen.charAt(0).toUpperCase()+pen.slice(1),penTxt:semPen?"saiu sem punição":"levou "+pen,traseira:b.traseira?"a sua traseira":"o seu carro",
    comDanos:(b.danos?` e ficou com ${b.danos} danificado${/ e /.test(b.danos)?"s":""}`:"")+(b.furou?(b.danos?", além de um pneu furado":" e furou um pneu"):""),danosOutroTxt:b.danosOutro?` e danificou ${b.danosOutro} dele`:"",
    motivosTxt:b.motivos?b.motivos.replace("pneu furado","trocar o pneu furado").replace("bandeira preta e laranja","cumprir a bandeira preta e laranja"):null,paradasTxt:b.paradas>1?b.paradas+" vezes":"uma vez a mais",voltasTxt:b.voltas>0?`${b.voltas} volta${b.voltas>1?"s":""} atrás do líder`:"atrás de onde podia",
    culpaTxt:b.culpa?"Fui eu que causei, mas paguei caro demais.":`O ${nq} saiu ileso e eu fiquei com a conta. Não é justo.`,
    culpaAband:b.culpa?"Eu causei o toque, e o carro cobrou a conta depois.":`Fica a pergunta: o ${nq} levou o quê por isso? Eu levei um abandono.`,
    venceuTxt:b.venceu?"terminou na frente d":"terminou atrás d",chuvaTxt:b.trocou?(b.atraso<=1?`Você trocou para ${b.comp} logo em seguida.`:`Você só trocou ${b.atraso} voltas depois.`):"Você ficou de pneu de seco."}}
const preenche=(t,v)=>t.replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null?v[k]:m).replace(/terminou (na frente|atrás) d o /g,"terminou $1 do ").replace(/ d ele/g," dele");
function perguntaDoBeat(b,H){const T=BANCO[b.k];if(!T||typeof Q!=="function")return null;const v=vars(b,H);const temTudo=x=>(x.match(/\{(\w+)\}/g)||[]).every(m=>{const k=m.slice(1,-1);return v[k]!=null&&v[k]!==""});const qOk=T.q.filter(temTudo);if(!qOk.length)return null;const q=preenche(pk(qOk),v);const vistos=new Set();
  const opts=T.a.map(([tom,txts,ef,decl])=>{let t=preenche(pk(txts),v);if(vistos.has(t))t=preenche(txts.find(x=>!vistos.has(preenche(x,v)))||txts[0],v);vistos.add(t);
    const e={};for(const[k,val]of Object.entries(ef)){if(k==="alvo"){if(b.quem&&b.quem!==G.rival){e.relId=b.quem;e.relV=val}else if(b.quem)e.rival=val}else e[k]=val}
    const a=A(t,tom,e,t.replace(/[.!?…]+$/,""));a.mem={grupo:"conflito",decl:!!decl,beat:b.k};return a}).filter(Boolean).slice(0,4);
  for(let i=opts.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[opts[i],opts[k]]=[opts[k],opts[i]]}
  return Q(jPick(JORN_PREF[b.k]||["gpbr","speedtv","motorde","times"]),q,opts,{beat:b.k,mem:"beat"})}
// os acontecimentos fortes viram memória para as próximas semanas
function guardaNaMemoria(H){if(!GL.MEMO||H.guardado)return;H.guardado=1;const b=H.beats.find(x=>x.k==="abandono_dano"&&x.quem&&!x.culpa);
  if(b)GL.MEMO.registra("abandono_por_dano",{alvo:b.quem,quem:b.quem,gp:H.gp,peca:b.peca})}
// entrevista pós-corrida: as perguntas saem da história; as genéricas só completam se faltar assunto
function instalaEntrevista(){if(typeof makeInterview!=="function"||makeInterview._cer)return;const base=makeInterview;GL.makeInterview=function(type){const I=base.apply(this,arguments);
    try{if(type==="post"){const H=historia();if(H){guardaNaMemoria(H);const usados=new Set();const qs=[];
        const forte=H.beats.length&&H.beats[0].imp>=85;for(const b of H.beats){if(qs.length>=3)break;if(forte&&b.imp<50)continue;const fam=b.k.startsWith("abandono")?"abandono":/^(vitoria|resultado|recuperacao|queda)/.test(b.k)?"resultado":b.k;if(usados.has(fam))continue;
          // não pergunta do resultado se houve abandono, nem de "toque" e de "dano" como dois assuntos separados quando é o mesmo lance
          if(b.k==="dano_custou"&&usados.has("atingido")&&H.beats.some(x=>x.k==="abandono_dano"))continue;const q=perguntaDoBeat(b,H);if(q){qs.push(q);usados.add(fam)}}
        // memória (rádio, frases polêmicas) entra se couber, sem repetir o mesmo lance
        const mem=(I.qs||[]).filter(q=>q.ctx&&q.ctx.mem&&q.ctx.mem!=="beat").filter(q=>!/toque|acert|bateu|abandon|punição/i.test(q.q));if(qs.length<3&&mem.length)qs.push(mem[0]);
        if(qs.length<3){const gen=(I.qs||[]).filter(q=>!(q.ctx&&q.ctx.mem)).filter(q=>!/mecânic|quebr|abandon|toque|acidente|incidente/i.test(q.q)||!H.beats.some(b=>/abandono|atingido|causei/.test(b.k)));while(qs.length<3&&gen.length)qs.push(gen.shift())}
        const ORD=["largada_boa","largada_ruim","atingido","causei","muro","furo","punicao","chuva","sc_box","dano_custou","abandono_dano","abandono_toque","abandono_erro","abandono_mec","recuperacao","queda","pneu_limite","vitoria","resultado_bom","resultado_ruim","companheiro","rival"];
        const oi=q=>{const k=q.ctx&&q.ctx.beat;const i=ORD.indexOf(k);return i<0?99:i};qs.sort((a,b)=>oi(a)-oi(b));
        const vist=new Set();qs.forEach(q=>{if(vist.has(q.j.o)){const alt=(typeof JOURNOS!=="undefined"?JOURNOS:[]).filter(j=>!vist.has(j.o));if(alt.length)q.j=pk(alt)}vist.add(q.j.o)});
        if(qs.length)I.qs=qs}}}catch(e){console.warn("cérebro",e)}return I};GL.makeInterview._cer=1}
function liga(){instala();instalaEntrevista()}
if(typeof document!=="undefined"&&document.readyState==="loading")document.addEventListener("DOMContentLoaded",liga);else liga();
GL.CEREBRO={historia,perguntaDoBeat,BANCO,instala:liga};
})(typeof window!=="undefined"?window:globalThis);
