// ===================== MEMÓRIA DO MUNDO =====================
// Tudo o que acontece com o piloto vira um FATO: o quê, contra quem, quem viu (equipe, TV, público, imprensa),
// peso (o quanto é notícia) e validade (em fins de semana). A imprensa monta perguntas a partir dos fatos mais fortes,
// as redes reagem ao que o público viu e as respostas polêmicas viram fatos novos, que voltam semanas depois.
// Fica salvo em G.mem. Para crescer o banco: acrescente tipos em TIPOS e respostas em RESP (não precisa mexer no resto).
(function(GL){
const rand=()=>Math.random(),pk=a=>a[Math.floor(rand()*a.length)];
// ---------- tipos de fato. q = perguntas por ângulo (polemica, tecnico, humano, provocacao, futuro)
// variáveis: {alvo} piloto envolvido, {rival}, {comp} companheiro, {gp}, {volta}, {pos}, {tempo}, {frase}, {pen}
const TIPOS={
  radio_ofensa:{nome:"Xingou no rádio",peso:45,val:4,grupo:"conflito",visto:{equipe:1},
    q:{polemica:["A TV mostrou o seu rádio xingando o {alvo} no {gp}. Passou do limite?","O seu palavrão no rádio virou o assunto do fim de semana. Você se arrepende?"],
       provocacao:["Estão dizendo que você perde a cabeça fácil. O rádio no {gp} prova isso?"],humano:["Dá pra entender a raiva depois daquela manobra do {alvo}?"]}},
  radio_reclamacao:{nome:"Reclamou de outro piloto no rádio",peso:22,val:2,grupo:"conflito",visto:{equipe:1},
    q:{tecnico:["Você reclamou no rádio do {alvo}. Acha que ele merecia punição?"],polemica:["O {alvo} fecha a porta e você vai reclamar no rádio. É isso?"]}},
  radio_elogio:{nome:"Agradeceu a equipe no rádio",peso:15,val:2,grupo:"positivo",visto:{equipe:1},
    q:{humano:["O seu rádio agradecendo os mecânicos rodou as redes. A relação com a equipe está nesse nível?"]}},
  radio_carro:{nome:"Reclamou do carro no rádio",peso:24,val:3,grupo:"equipe_erro",visto:{equipe:1},
    q:{tecnico:["Você reclamou do carro no rádio no {gp}. O problema é o carro ou a pilotagem?"],polemica:["Reclamar do carro em público não desgasta a equipe?"]}},
  muitas_perguntas:{nome:"Pediu informação toda volta",peso:14,val:2,grupo:"equipe_erro",visto:{equipe:1},
    q:{tecnico:["Dizem que você pediu informação quase toda volta. Falta confiança na estratégia?"]}},
  toque:{nome:"Toque com outro piloto",peso:34,val:3,grupo:"conflito",visto:{equipe:1,tv:1,publico:1,imprensa:1},
    q:{tecnico:["O que aconteceu no toque com o {alvo}?"],polemica:["O toque com o {alvo} foi culpa sua?"],provocacao:["O {alvo} reclamou de você depois da corrida. Responde?"]}},
  punicao:{nome:"Punição dos comissários",peso:30,val:2,grupo:"conflito",visto:{equipe:1,tv:1,publico:1,imprensa:1},
    q:{tecnico:["Os comissários te deram {pen}. Concorda com a decisão?"],polemica:["Mais uma punição. Você está pilotando no limite das regras?"]}},
  ordem_ignorada:{nome:"Ignorou ordem de equipe",peso:55,val:6,grupo:"ordem",visto:{equipe:1},
    q:{polemica:["A equipe pediu para você deixar o {comp} passar e você ignorou. Quem manda na equipe?"],humano:["Como fica o clima com o {comp} depois do {gp}?"],futuro:["Desobedecer a equipe pode custar a sua renovação?"]}},
  ordem_cumprida:{nome:"Cumpriu ordem de equipe",peso:20,val:2,grupo:"ordem",visto:{equipe:1,imprensa:1},
    q:{humano:["Você abriu passagem para o {comp}. Doeu?"],provocacao:["Você aceita ser o segundo piloto da equipe?"]}},
  box_ruim:{nome:"Parada lenta no box",peso:26,val:2,grupo:"equipe_erro",visto:{equipe:1,tv:1,publico:1,imprensa:1},
    q:{tecnico:["A parada de {tempo} segundos te custou posições. A equipe errou?"],humano:["Como você reage quando a equipe erra assim?"]}},
  box_bom:{nome:"Parada muito rápida",peso:10,val:1,grupo:"positivo",visto:{equipe:1,tv:1,imprensa:1},
    q:{tecnico:["A sua parada foi uma das mais rápidas do dia. Isso decidiu a corrida?"]}},
  passou_rival:{nome:"Passou o rival",peso:30,val:3,grupo:"conflito",visto:{equipe:1,tv:1,publico:1,imprensa:1},
    q:{provocacao:["Que manobra em cima do {rival}! Foi recado?"],tecnico:["Como você preparou a ultrapassagem no {rival}?"]}},
  perdeu_rival:{nome:"Foi passado pelo rival",peso:24,val:2,grupo:"conflito",visto:{equipe:1,tv:1,publico:1,imprensa:1},
    q:{provocacao:["O {rival} te passou na pista. Ele foi melhor hoje?"],tecnico:["O que faltou para segurar o {rival}?"]}},
  vitima_toque:{nome:"Foi atingido por outro piloto",peso:30,val:3,grupo:"vitima",visto:{equipe:1,tv:1,publico:1,imprensa:1},
    q:{tecnico:["Na última corrida o {alvo} te acertou. Já conversaram?"],polemica:["O {alvo} saiu sem punição depois de te acertar. Isso ainda incomoda?"],provocacao:["Você vai ter o {alvo} por perto de novo. Vai deixar espaço pra ele?"]}},
  abandono_por_dano:{nome:"Abandonou por dano de um toque",peso:44,val:4,grupo:"vitima",visto:{equipe:1,tv:1,publico:1,imprensa:1},
    q:{humano:["Você abandonou {gp} por causa do dano daquele toque com o {alvo}. Já superou?"],polemica:["O {alvo} acabou com a sua corrida no {gp}. Vai cobrar dele?"]}},
  abandono:{nome:"Abandonou a corrida",peso:28,val:2,grupo:"equipe_erro",visto:{equipe:1,tv:1,publico:1,imprensa:1},
    q:{humano:["Abandono no {gp}. Como você está?"],tecnico:["O que aconteceu para você abandonar?"]}},
  declaracao_polemica:{nome:"Declaração polêmica",peso:40,val:4,grupo:"conflito",depois:1,visto:{imprensa:1,publico:1},
    q:{polemica:["No {gp} você disse: “{frase}”. Você mantém?","Na última corrida você disse: “{frase}”. Se arrepende?"],provocacao:["Depois do que você disse no {gp}, o clima ficou pesado. Valeu a pena?"]}},
  radio_provocou:{nome:"Provocou outro piloto no rádio",peso:26,val:3,grupo:"conflito",visto:{equipe:1},
    q:{provocacao:["Você passou o {alvo} e mandou um recado no rádio. Era pra ele ouvir?"],polemica:["Provocar o {alvo} no rádio não é jogar gasolina na fogueira?"]}},
  // o que os OUTROS pilotos falaram (só entra na memória quando envolve você, o seu rival ou o seu companheiro)
  npc_xingou:{nome:"Outro piloto te xingou no rádio",peso:44,val:4,grupo:"conflito",visto:{equipe:1},
    q:{polemica:["O {quem} te xingou no rádio depois da disputa: “{fala}”. Vai responder?","A TV mostrou o {quem} perdendo a cabeça com você no rádio. O que achou?"],provocacao:["O {quem} disse no rádio: “{fala}”. Ele tem razão?"],humano:["Como você recebe um rádio desses do {quem}?"]}},
  npc_reclamou:{nome:"Outro piloto reclamou de você",peso:28,val:3,grupo:"conflito",visto:{equipe:1},
    q:{tecnico:["O {quem} reclamou de você no rádio: “{fala}”. Você fechou a porta?"],polemica:["O {quem} pediu punição para você no rádio. Merecia?"]}},
  npc_provocou:{nome:"Outro piloto te provocou",peso:30,val:3,grupo:"conflito",visto:{equipe:1},
    q:{provocacao:["O {quem} te passou e mandou no rádio: “{fala}”. Doeu?","Você ouviu o que o {quem} falou no rádio depois de te passar?"]}},
  outro_reclamou:{nome:"Rival ou companheiro reclamou no rádio",peso:20,val:2,grupo:"sobre_outro",visto:{equipe:1},
    q:{provocacao:["O {quem} reclamou no rádio: “{fala}”. Ele está sentindo a pressão?"],humano:["Deu pra ouvir o {quem} irritado no rádio. Você se preocupa com o que ele sente?"]}},
  tv_mostrou:{nome:"A TV transmitiu o seu rádio",peso:0,val:4,grupo:"meta",visto:{tv:1,publico:1,imprensa:1},q:{}}};
// ---------- respostas por família e tom, com efeitos no jogo (pop, rep, trust, morale, heat, rival, mate; alvo = relação com o piloto envolvido)
const RESP={
  conflito:{humilde:{t:["Passei do ponto, sim. Já falei com ele e com a equipe.","Foi um momento ruim meu. A disputa fica na pista."],ef:{alvo:4,heat:-5,rep:2}},
    confiante:{t:["Corrida é emoção. Ele sabe o que fez.","Eu não vim aqui para ser simpático. Vim para ganhar posição."],ef:{alvo:-3,pop:3}},
    polemico:{t:["Ele pilota como se a pista fosse só dele. Alguém precisa falar.","Se ele fizer de novo, vai ouvir de novo. Simples."],ef:{alvo:-8,heat:8,pop:5,rep:-2},decl:1},
    piada:{t:["Ainda bem que a TV colocou o bip. Minha mãe estava assistindo!","Na hora eu só estava elogiando a pilotagem dele. Do meu jeito."],ef:{heat:-3,pop:4}},
    evasivo:{t:["Isso fica entre mim e a equipe.","Prefiro falar da corrida."],ef:{heat:1}}},
  vitima:{humilde:{t:["Já passou. Ele errou, eu sigo em frente.","Não guardo mágoa. Corrida tem disso."],ef:{alvo:3,rep:2}},
    confiante:{t:["Eu estava na minha linha. Quem tem que explicar é ele.","A pista mostrou quem estava certo."],ef:{alvo:-2,pop:2}},
    polemico:{t:["Os comissários deixaram passar. Da próxima vez eu não alivio.","Se ninguém pune, a gente resolve na pista."],ef:{alvo:-7,heat:7,pop:4,rep:-2},decl:1},
    piada:{t:["Mandei a conta da asa nova pra equipe dele.","Pelo menos agora eu sei que meu carro é resistente."],ef:{heat:-3,pop:4}},
    evasivo:{t:["Isso já foi resolvido.","Prefiro falar da próxima corrida."],ef:{}}},
  ordem:{humilde:{t:["A equipe vem primeiro. Se pediram, tinha motivo.","Somos dois carros, um time."],ef:{trust:6,mate:4}},
    confiante:{t:["Eu estava mais rápido. Fiz o que achei melhor para o resultado.","Eu sei o que faço dentro do carro."],ef:{trust:-3,mate:-2,pop:2}},
    polemico:{t:["Não vim para ser escudeiro de ninguém.","Ordem de equipe a essa altura? Não contem comigo pra isso."],ef:{trust:-9,mate:-7,heat:8,pop:5},decl:1},
    piada:{t:["O rádio estava meio ruim nessa hora, sabe como é…","Achei que tinham falado “deixa passar a vontade”."],ef:{trust:-2,pop:3,heat:2}},
    evasivo:{t:["Isso a gente conversa internamente.","Sem comentários sobre estratégia de equipe."],ef:{trust:2}}},
  equipe_erro:{humilde:{t:["Acontece. Ganhamos juntos e perdemos juntos.","Ninguém erra de propósito. Vamos revisar."],ef:{trust:6,rep:1}},
    confiante:{t:["Quero respostas, mas confio no pessoal.","Precisamos ser melhores, eu inclusive."],ef:{trust:2}},
    polemico:{t:["Desse jeito fica difícil brigar lá na frente.","Eu faço a minha parte. A equipe precisa fazer a dela."],ef:{trust:-10,heat:7,pop:3},decl:1},
    piada:{t:["Pelo menos deu tempo de tomar um café.","Foi um pit stop com direito a paisagem."],ef:{trust:-2,pop:3}},
    evasivo:{t:["Vamos analisar os dados primeiro.","Não vi as imagens ainda."],ef:{}}},
  sobre_outro:{humilde:{t:["Cada um sabe da sua corrida. Não comento os outros.","Ele é um grande piloto. Dia ruim acontece com todo mundo."],ef:{alvo:3,rep:2}},
    confiante:{t:["Eu cuido do meu carro. Se ele está nervoso, melhor pra mim.","A pressão é parte do jogo."],ef:{alvo:-2,pop:2}},
    polemico:{t:["Se ele reclama tanto, talvez o problema seja ele.","Quem chora no rádio já perdeu a briga."],ef:{alvo:-7,heat:7,pop:4},decl:1},
    piada:{t:["Vou mandar um chá de camomila pra ele.","Rádio dele é melhor que novela."],ef:{alvo:-2,pop:4,heat:2}},
    evasivo:{t:["Prefiro falar de mim.","Sem comentários."],ef:{}}},
  positivo:{humilde:{t:["Mérito de todo mundo da garagem.","Eles trabalham dia e noite. Merecem."],ef:{trust:5,pop:2}},
    confiante:{t:["Quando a equipe acerta, eu entrego.","É assim que a gente vai ganhar."],ef:{trust:2,pop:2}},
    polemico:{t:["Pena que não é sempre assim.","Já era hora, né?"],ef:{trust:-5,heat:4},decl:1},
    piada:{t:["Vou pagar um churrasco pra eles. Talvez.","Eles são mais rápidos que eu, só que de pé."],ef:{trust:3,pop:3}},
    evasivo:{t:["Foi um bom dia de trabalho.","Seguimos."],ef:{}}}};
// tom do jogo para cada tom da memória (a "piada" usa o tom emocional, que mostra o rosto rindo)
const TOM_JOGO={humilde:"humilde",confiante:"confiante",polemico:"polemico",piada:"emocional",evasivo:"evasivo"};
const VEICULO={polemica:["speedtv","racefan","paddock"],provocacao:["speedtv","paddock"],tecnico:["motorde","times"],humano:["gpbr","racefan"],futuro:["times","gpbr"]};
// ---------- estado salvo
function M(){if(typeof G==="undefined"||!G)return null;if(!G.mem)G.mem={f:[],uid:0,sem:0,wk:null};return G.mem}
function semana(){const m=M();return m?m.sem:0}
function nomeDe(id){const d=G.drivers&&G.drivers[id];return d?d.n.split(" ").pop():"rival"}
function registra(tipo,dados){const m=M(),T=TIPOS[tipo];if(!m||!T)return null;dados=dados||{};
  const f={id:++m.uid,tipo,peso:dados.peso!=null?dados.peso:T.peso,visto:{equipe:0,tv:0,publico:0,imprensa:0,...T.visto,...(dados.visto||{})},sem:m.sem,val:T.val,d:dados,usado:0,post:0};
  delete f.d.peso;delete f.d.visto;m.f.push(f);if(m.f.length>220)m.f.splice(0,m.f.length-220);redes();return f}
function forca(f){const idade=semana()-f.sem;if(idade>f.val)return 0;return f.peso*(1-idade/(f.val+1))*Math.pow(.45,f.usado||0)}
function tvEscuta(f,chance){if(rand()<chance){f.visto.tv=f.visto.publico=f.visto.imprensa=1;f.peso+=25;registra("tv_mostrou",{ref:f.id});redes();return true}return false}
function vaza(f,chance){if(!f.visto.imprensa&&rand()<chance){f.visto.imprensa=1;f.peso+=8;return true}return false}
function noticias(){const m=M();if(!m)return[];return m.f.filter(f=>f.visto.imprensa&&TIPOS[f.tipo]&&TIPOS[f.tipo].grupo!=="meta"&&forca(f)>0&&!(TIPOS[f.tipo].depois&&f.sem===semana())).sort((a,b)=>forca(b)-forca(a))}
function ctx(f){const m=typeof mate==="function"?mate():null;const C=typeof CIR!=="undefined"&&G.calendar?CIR[G.calendar[Math.min(G.round,G.calendar.length-1)]]:null;
  return{rival:G.rival?nomeDe(G.rival):"rival",comp:m?m.n.split(" ").pop():"seu companheiro",gp:f&&f.d.gp||(C?C.gp:"a última corrida"),alvo:f&&f.d.alvo?nomeDe(f.d.alvo):(G.rival?nomeDe(G.rival):"rival"),quem:f&&f.d.quem?nomeDe(f.d.quem):"",fala:f&&f.d.fala,pos:f&&f.d.pos,tempo:f&&f.d.tempo,frase:f&&f.d.frase,pen:f&&f.d.pen||"punição",volta:f&&f.d.volta}}
const preenche=(t,c)=>t.replace(/\{(\w+)\}/g,(m,k)=>c[k]!=null?c[k]:m);
// pergunta da imprensa no formato do jogo (Q/A de media.js)
function perguntaJogo(tipoIv){const lista=noticias().filter(f=>tipoIv==="pre"?f.sem<semana():f.sem>=semana()-0);for(const f of lista){const T=TIPOS[f.tipo];const angs=Object.keys(T.q);if(!angs.length)continue;
    const ang=pk(angs);const c=ctx(f);const qtxt=preenche(pk(T.q[ang]),c);const g=RESP[f.d.grupo||T.grupo];if(!g)continue;
    const tons=["humilde","confiante","polemico",rand()<.5?"piada":"evasivo"];
    const opts=tons.map(tom=>{const r=g[tom];const t=preenche(pk(r.t),c);const ef={};for(const[k,v]of Object.entries(r.ef)){if(k==="alvo"){if(f.d.alvo&&f.d.alvo!==G.rival){ef.relId=f.d.alvo;ef.relV=v}else ef.rival=v}else ef[k]=v}
      const a=A(t,TOM_JOGO[tom],ef,t.replace(/[.!?…]+$/,""));a.mem={fato:f.id,grupo:f.d.grupo||T.grupo,decl:!!r.decl};return a});
    for(let i=opts.length-1;i>0;i--){const k=Math.floor(rand()*(i+1));[opts[i],opts[k]]=[opts[k],opts[i]]}
    f.usado++;return Q(jPick(VEICULO[ang]),qtxt,opts,{mem:f.id})}return null}
// ---------- redes: o público reage ao que viu
const POSTS={radio_ofensa:["o {alvo} levou uma bronca daquelas no rádio. Que falta de classe","falou o que todo mundo queria falar kkkk","o bip mais alto da temporada"],
  radio_reclamacao:["o {alvo} jogou ele pra fora mesmo, olha o replay"],radio_elogio:["“valeu, pessoal” no rádio. Esse é o cara"],radio_carro:["reclamando do carro de novo no rádio…"],
  toque:["toque com o {alvo}. Eu daria incidente de corrida","o {alvo} não deixou espaço nenhum"],punicao:["{pen}? Os comissários exageraram","punição merecida, foi afobado"],
  ordem_ignorada:["clima pesado na garagem depois da ordem ignorada","falta de respeito com o {comp}","fez certo, piloto de verdade não abre"],ordem_cumprida:["profissional demais, abriu pro {comp}"],
  box_ruim:["parada de {tempo} s. Alguém revisa esse box"],passou_rival:["QUE MANOBRA em cima do {rival}!"],perdeu_rival:["o {rival} passou fácil"],abandono:["que pena, fim de corrida cedo"],
  declaracao_polemica:["não poupou palavras: “{frase}”","alguém segura esse homem kkkk"],
  radio_provocou:["mandou recado pro {alvo} no rádio kkkk","provocar no rádio é feio, mas foi engraçado"],
  npc_xingou:["o {quem} perdeu a linha no rádio com o Andrade","o {quem} tá certo, foi jogo sujo"],npc_reclamou:["o {quem} reclamando no rádio… chorão"],npc_provocou:["o {quem} passou e ainda provocou no rádio"],
  outro_reclamou:["o {quem} tá nervoso no rádio, hein"]};
function redes(){const m=M();if(!m||typeof post!=="function")return;for(const f of m.f){if(f.post||!f.visto.publico||!POSTS[f.tipo])continue;f.post=1;const c=ctx(f);const sur=ME().n.split(" ").pop();
    POSTS[f.tipo].slice(0,2).forEach((t,i)=>{try{post("fan",(i?"":sur+": ")+preenche(t,c),{tag:i===0&&f.peso>=40?("#"+sur+(f.tipo.startsWith("radio")?"NoRadio":"")).replace(/\s/g,""):null,mood:/ofensa|ignorada|punicao|perdeu/.test(f.tipo)?-1:1})}catch(e){}})}}
// ---------- corrida: observa o que acontece (sem mexer na simulação)
let OBS={};
function noFimDeSemana(){const m=M();if(!m||typeof W==="undefined"||!W)return;const k=G.season+":"+G.calendar[G.round];if(m.wk!==k){m.wk=k;m.sem++;OBS={}}}
function carroEu(){return typeof R!=="undefined"&&R&&R.cars?R.cars.find(c=>c.isP):null}
function carroDe(id){return R.cars.find(c=>c.id===id||(c.d&&c.d.id===id))}
function emDisputa(c){const i=R.order.indexOf(c);const A=R.order[i-1],B=R.order[i+1];const g=x=>x?Math.abs(x.prog-c.prog)*c.L:999;return Math.min(g(A),g(B))<40}
function observa(){if(typeof R==="undefined"||!R||!R.cars||!R.order)return;noFimDeSemana();const me=carroEu();if(!me)return;const gp=CIR[G.calendar[G.round]].gp;
  if(OBS.R!==R){OBS={R,inc:0,pit:0,to:0,pos:{},pens:me.pen||0}}
  // incidentes com o jogador
  (R.incidents||[]).slice(OBS.inc).forEach(inc=>{const outro=inc.other;if(!outro)return;/* culpa vem dos dados do lance: quem bateu em quem */if(inc.meCulprit)registra("toque",{alvo:outro,gp,volta:inc.lap});else registra("vitima_toque",{alvo:outro,quem:outro,gp,volta:inc.lap})});OBS.inc=(R.incidents||[]).length;
  // ordem de equipe
  if(R.teamOrder&&!OBS.to){OBS.to=1;const f=registra(R.teamOrder.obeyed?"ordem_cumprida":"ordem_ignorada",{gp,volta:R.teamOrder.lap});if(!R.teamOrder.obeyed&&f)tvEscuta(f,.45)}
  // box: tempo parado
  if(me.pit&&me.pit!==OBS.pit){OBS.pit=me.pit;const t=me.pit.stop-(me.pit.penS||0);if(t>4.3)registra("box_ruim",{gp,tempo:t.toFixed(1).replace(".",",")});else if(t>0&&t<2.4)registra("box_bom",{gp})}
  // punição nova
  if((me.pen||0)>OBS.pens+.5){registra("punicao",{gp,pen:Math.round(me.pen-OBS.pens)+" segundos"})}OBS.pens=me.pen||0;
  // trocas de posição com o rival
  if(G.rival){const rv=carroDe(G.rival);if(rv&&running(rv)&&running(me)){const a=R.order.indexOf(me)<R.order.indexOf(rv);if(OBS.frente!=null&&a!==OBS.frente&&Math.abs(R.order.indexOf(me)-R.order.indexOf(rv))===1&&!me.pit&&!rv.pit){
      const ult=OBS.ultTroca||-99;if(R.t-ult>20){registra(a?"passou_rival":"perdeu_rival",{gp,peso:a?30:24});OBS.ultTroca=R.t}}OBS.frente=a}}}
if(typeof window!=="undefined"&&typeof document!=="undefined"){const h=setInterval(()=>{try{observa()}catch(e){}},500);if(h&&h.unref)h.unref()}
// ---------- rádio do piloto: falar e perguntar
function falaRadio(k){const me=carroEu();if(!me||typeof radio!=="function")return;noFimDeSemana();const gp=CIR[G.calendar[G.round]].gp;
  const i=R.order.indexOf(me),A=R.order[i-1],B=R.order[i+1];const alvo=(A&&emDisputa(me)?A:B||A);const an=alvo?alvo.code:"ele";const fama=(G.fame&&G.fame.pop||30)/100;const tv=(emDisputa(me)?.35:.12)+fama*.35;
  const eng=G.engineer||"Engenheiro";const resp=t=>setTimeout(()=>{try{radio(me,`${eng}: "${t}"`)}catch(e){}},1600+rand()*1500);
  if(k==="reclamar"){radio(me,pk([`O ${an} me jogou pra fora! Isso é punição!`,`Olha o que o ${an} fez! Me espremeu no muro!`]),{me:1});const f=registra("radio_reclamacao",{alvo:alvo&&alvo.id,gp,volta:me.lap});if(tvEscuta(f,tv))aviso("A TV transmitiu o seu rádio.");resp(pk(["Copiado. A gente vai mostrar aos comissários.","Entendido. Foco na corrida."]))}
  else if(k==="explodir"){radio(me,pk([`Que ***** o ${an} está fazendo?! ****!`,`${an}, seu ****! Me jogou na grama!`]),{me:1});const f=registra("radio_ofensa",{alvo:alvo&&alvo.id,gp,volta:me.lap});G.trust=Math.max(0,G.trust-1);
    if(tvEscuta(f,tv+.2))aviso("A TV transmitiu o seu rádio, com bip.");resp(pk(["Lucas… calma. Cabeça fria.","Respira. Ainda tem muita corrida."].map(x=>x.replace("Lucas",ME().n.split(" ")[0]))))}
  else if(k==="elogiar"){radio(me,pk(["Valeu, pessoal! Que trabalho!","Carro perfeito, obrigado equipe!"]),{me:1});const f=registra("radio_elogio",{gp});tvEscuta(f,tv*.8);G.trust=Math.min(100,G.trust+1);resp("Valeu! Continua assim.")}
  else if(k==="carro"){radio(me,pk(["Esse carro não anda nada na reta!","Não tenho aderência nenhuma, o carro está horrível!"]),{me:1});const f=registra("radio_carro",{gp});G.trust=Math.max(0,G.trust-2);vaza(f,G.trust<45?.5:.25);resp("Copiado. Estamos olhando os dados.")}
  else{OBS.perg=(OBS.perg||0)+1;let t="";
    if(k==="q_frente"){if(A){const v=Math.round((A.tyre&&A.tyre.age)||0),e=Math.round((me.tyre&&me.tyre.age)||0);t=`O ${A.code} está com o pneu ${Math.abs(v-e)<2?"com idade parecida com o seu":v>e?(v-e)+" voltas mais velho. Deve cair":(e-v)+" voltas mais novo"}${rand()<.4?", mas não temos certeza":""}.`}else t="Você está na frente. Ninguém para olhar além do retrovisor."}
    else if(k==="q_chuva"){let em=-1;for(let l=me.lap+1;l<=me.lap+12;l++)if(typeof rainAt==="function"&&rainAt(l)>(R.rain||0)){em=l-me.lap;break}t=em>0?`O radar mostra chuva em umas ${em+(rand()<.5?1:-1)>0?em:1} voltas. Pode mudar.`:R.rain?"A chuva deve continuar por enquanto.":"Sem chuva no radar para as próximas voltas."}
    else if(k==="q_box"){const st=me.plan&&me.plan.stops&&me.plan.stops[me.planIdx];t=st?`A janela abre perto da volta ${st.lap}. Fica pronto.`:"Sem parada prevista. Cuida dos pneus até o fim."}
    radio(me,{q_frente:"Como está o pneu do carro da frente?",q_chuva:"Vai chover?",q_box:"Quando a gente para?"}[k],{me:1});
    if(OBS.perg>=4){t="Foca na pista, a gente avisa. "+t;if(!OBS.pergF){OBS.pergF=1;registra("muitas_perguntas",{gp})}}resp(t)}}
function aviso(t){try{rcMsg("Transmissão: "+t,"warn");R.toast={t:R.t,text:t}}catch(e){}}
// botões do rádio na tela da corrida
if(typeof document!=="undefined")document.addEventListener("click",e=>{const b=e.target.closest("[data-mem]");if(!b)return;e.preventDefault();falaRadio(b.dataset.mem);b.disabled=true;setTimeout(()=>{b.disabled=false},b.dataset.mem.startsWith("q_")?4000:8000)});
// ---------- ligações com o resto do jogo
function instala(){
  if(typeof raceStep==="function"&&!raceStep._mem){const b=raceStep;GL.raceStep=function(){const r=b.apply(this,arguments);try{noFimDeSemana()}catch(e){}return r};GL.raceStep._mem=1}
  if(typeof resultsStep==="function"&&!resultsStep._mem){const b=resultsStep;GL.resultsStep=function(){try{if(typeof R!=="undefined"&&R&&R.result&&OBS.fim!==R){OBS.fim=R;const e=R.result.cls.find(x=>x.d===G.me);const gp=CIR[G.calendar[Math.max(0,G.round-1)]]?CIR[G.calendar[Math.max(0,G.round-1)]].gp:"";if(e&&e.status!=="ok"){const H=GL.CEREBRO&&GL.CEREBRO.historia();const bd=H&&H.beats.find(b=>b.k==="abandono_dano"&&b.quem&&!b.culpa);if(bd){registra("abandono_por_dano",{alvo:bd.quem,quem:bd.quem,gp,peca:bd.peca});H.guardado=1}else registra("abandono",{gp})}}}catch(x){}return b.apply(this,arguments)};GL.resultsStep._mem=1}
  if(typeof makeInterview==="function"&&!makeInterview._mem){const b=makeInterview;GL.makeInterview=function(type){noFimDeSemana();
      // o que só a equipe viu pode vazar até a entrevista (mais quando a confiança está baixa)
      const m=M();if(m)m.f.filter(f=>!f.visto.imprensa&&f.sem>=semana()-1).forEach(f=>vaza(f,G.trust<45?.45:.2));
      const I=b.apply(this,arguments);try{const extra=[];for(let i=0;i<2;i++){const q=perguntaJogo(type);if(q)extra.push(q)}if(extra.length){I.qs=extra.concat(I.qs).slice(0,Math.max(3,extra.length+1))}}catch(e){console.warn("memória",e)}return I};GL.makeInterview._mem=1}
  if(typeof answerInterview==="function"&&!answerInterview._mem){const b=answerInterview;GL.answerInterview=function(k){const I=G.interview;const q=I&&I.qs[I.i];const a=q&&q.opts[k];const r=b.apply(this,arguments);
      try{const gp=CIR[G.calendar[Math.min(G.round,G.calendar.length-1)]].gp;if(a&&(a.tone==="polemico"||(a.mem&&a.mem.decl))&&a.tone==="polemico"){registra("declaracao_polemica",{frase:(a.quote||a.t).replace(/[.!?…]+$/,""),gp,grupo:a.mem?a.mem.grupo:"conflito",peso:a.mem?40:30})}}catch(e){}return r};GL.answerInterview._mem=1}
  if(typeof applyEff==="function"&&!applyEff._mem){const b=applyEff;GL.applyEff=function(e,j){b.apply(this,arguments);try{if(e&&e.relId&&typeof relAdd==="function")relAdd(e.relId,e.relV||0)}catch(x){}};GL.applyEff._mem=1}}
if(typeof window!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instala);else instala()}
GL.MEMO={TIPOS,RESP,registra,tvEscuta,vaza,forca,noticias,perguntaJogo,falaRadio,semana,instala};
})(typeof window!=="undefined"?window:globalThis);
