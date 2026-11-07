// ===================== MÍDIA: REDE SOCIAL, ENTREVISTAS E REPORTAGENS =====================
// Fama: G.fame.pop (popularidade com o público, 0-100), G.fame.rep (respeito no paddock, 0-100), seguidores.
// G.trust = confiança da equipe em você. G.press[nome] = relação com cada jornalista. G.rel[id] = relação com rivais (negativo = rixa).
const OFFICIAL={n:"F1 Paddock",h:"@paddockf1",v:true,c:"#E10600"};
const TONES={humilde:{n:"Humilde",c:"#7EE2A0"},confiante:{n:"Confiante",c:"#FFD400"},polemico:{n:"Polêmico",c:"#FF6B6B"},evasivo:{n:"Evasivo",c:"#8C96A3"},tecnico:{n:"Técnico",c:"#6EC1FF"},emocional:{n:"Emocional",c:"#F15BB5"}};
function handleOf(n){return"@"+n.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g,"").slice(0,15)}
function meAuthor(){const me=ME();return{n:me.n,h:handleOf(me.n),v:G.fame.followers>150000,c:G.helmet.c1,me:true}}
function journoAuthor(j){const o=OUTLETS.find(x=>x.id===j.o);return{n:j.n,h:handleOf(j.n),v:true,c:"#6EC1FF",sub:o?o.n:""}}
function fanAuthor(){const n=pick(FAN_NAMES);return{n,h:"@"+n+(rnd()<.5?ri(1,99):""),v:false,c:pick(["#888","#9AA","#A98","#89A","#A8A"])}}
function post(kind,text,o){o=o||{};if(!G.social)G.social={feed:[],trends:[]};
  const who=o.author||(kind==="me"?meAuthor():kind==="journo"&&o.journo?journoAuthor(o.journo):kind==="sys"?OFFICIAL:kind==="team"?teamAuthor(o.team||ME().team):fanAuthor());
  const likes=o.likes??Math.round(rr(20,400)*(1+G.fame.pop/12));
  const p={id:"p"+(G.social.n=(G.social.n||0)+1),kind,who,text,likes,rts:Math.round(likes*rr(.05,.22)),com:Math.round(likes*rr(.02,.09)),s:G.season,r:G.round,mood:o.mood||0,replies:o.replies||[],tag:o.tag||null};
  G.social.feed.unshift(p);if(G.social.feed.length>160)G.social.feed.length=160;if(o.tag)trend(o.tag,likes);return p}
function teamAuthor(id){const t=teamOf(id);return{n:t.n,h:handleOf(t.n),v:true,c:t.c}}
function trend(tag,w){const T=G.social.trends;let x=T.find(t=>t.tag===tag);if(!x){x={tag,n:0,r:G.round,s:G.season};T.push(x)}x.n+=Math.round(w*rr(.6,1.4));x.r=G.round;x.s=G.season;
  T.forEach(t=>{if(t.r<G.round-1||t.s!==G.season)t.n=Math.round(t.n*.6)});T.sort((a,b)=>b.n-a.n);G.social.trends=T.filter(t=>t.n>50).slice(0,8)}
function fameAdd(pop,rep){G.fame.pop=clamp(G.fame.pop+(pop||0),0,100);G.fame.rep=clamp(G.fame.rep+(rep||0),0,100);ME().fame=Math.round(G.fame.pop)}
function follow(n){G.fame.followers=Math.max(1000,Math.round(G.fame.followers+n))}
function relAdd(id,v){G.rel[id]=clamp((G.rel[id]||0)+v,-100,100)}
function pressAdd(n,v){G.press=G.press||{};G.press[n]=clamp((G.press[n]||50)+v,0,100)}
function heatAdd(v){G.heat=clamp((G.heat||0)+v,0,100)}
function marketValue(){const me=ME();return +(0.4+ovr(me)*.04+G.fame.pop*.06+G.fame.rep*.03-3.2).toFixed(1)}

// ---------- reações do público
const FAN_LINES={
  win:["QUE PILOTAGEM!!! {c} É GIGANTE 🏆","Chorei aqui em casa. Vitória de {c}! 🇧🇷","Eu falei que {c} ia ganhar uma. Eu falei!","Isso aqui é história. {c} vencendo com a {t} 😭","{c} merece um carro melhor, imagina com um carro de ponta"],
  podium:["PÓDIO! {c} no champanhe 🍾","{c} levando a {t} pro pódio, que temporada","Que corrida de {c}, segura esse pódio!","Quem duvidou do {c} tá quietinho agora 👀"],
  points:["Pontos importantes pra {t}. Bom trabalho {c}","{c} fez o máximo com o carro que tem","P{p} com esse carro é vitória 👏","Corrida sólida de {c}, sem erro"],
  bad:["Corrida pra esquecer de {c} 😔","{c} sumiu hoje... o que aconteceu?","Tá faltando carro pra {c}","Fim de semana difícil, bola pra frente {c}","Precisa melhorar, {c}. Companheiro tá andando mais"],
  crash:["{c} jogou fora a corrida 🤦","Erro bobo de {c} hoje","Calma {c}, a corrida é longa!","Isso que dá forçar demais...","Força {c}, acontece com todo mundo"],
  dnf:["Que azar do {c}, carro quebrou","A {t} precisa ajudar o {c}, quebrou de novo?","Sem confiabilidade não dá 😤"],
  orderNo:["{c} ignorou a ordem de equipe! Isso é piloto de verdade 🔥","Desobedecer a equipe? Falta de respeito, {c}","{c} não abre pra ninguém kkkkk","O chefe da {t} deve estar furioso 😬","Ordem de equipe é pra ser cumprida. Péssimo, {c}"],
  orderYes:["{c} abriu pro companheiro... jogador de equipe 🤝","Não acredito que {c} deixou passar 😡","Ordem de equipe na F1 é uma vergonha","Respeito o {c}, pensou no time"],
  pole:["POLE POSITION DE {c}!!! 🚀","{c} voou na classificação","Que volta foi essa, {c}?!"],
  stewards:["Punição justa pra {c}, foi pra cima demais","Os comissários exageraram com {c}. Isso é corrida!","{c} precisa controlar a agressividade","Sempre punem o {c}, impressionante","Duro, mas a regra é clara"],
  quali_bad:["Classificação complicada pra {c}","{c} vai ter que se recuperar amanhã"]};
function fill(t,x){return t.replace(/\{c\}/g,x.c||"").replace(/\{t\}/g,x.t||"").replace(/\{p\}/g,x.p||"")}
function fansReact(kind,n,x){const me=ME();x=Object.assign({c:me.n.split(" ").pop(),t:myTeam().n},x||{});const L=FAN_LINES[kind];if(!L)return;
  const k=Math.min(L.length,Math.round(n*(1+G.fame.pop/40)));const sh=L.slice().sort(()=>rnd()-.5);for(let i=0;i<k;i++)post("fan",fill(sh[i],x),{likes:Math.round(rr(5,180)*(1+G.fame.pop/8)),mood:{win:2,podium:2,points:1,pole:2,orderNo:0,orderYes:0}[kind]??-1})}

// ---------- entrevistas
// Cada pergunta tem opções com tom e efeitos. eff: pop, rep, trust, morale, rival (relação com o alvo), heat, press (jornalista)
function Q(j,q,opts,ctx){return{j,q,opts,ctx}}
function A(t,tone,eff,quote){return{t,tone,eff:eff||{},quote:quote||t}}
function jPick(pref){const pool=pref?JOURNOS.filter(j=>pref.includes(j.o)):JOURNOS;return pick(pool.length?pool:JOURNOS)}
function makeInterview(type){const me=ME(),t=myTeam(),m=mate(),C=CIR[G.calendar[G.round]];const qs=[];const st=standings();const myPos=st.drivers.findIndex(d=>d.id===G.me)+1;
  const last=G.results.filter(r=>!r.sprint&&r.season===G.season).slice(-1)[0];const le=last&&last.cls.find(e=>e.d===G.me);
  const mName=m?m.n.split(" ").pop():"seu companheiro";const rival=G.rival&&G.drivers[G.rival]&&G.drivers[G.rival].team?G.drivers[G.rival]:null;
  const surname=me.n.split(" ").pop();
  if(type==="pre"){
    if(G.round===0)qs.push(Q(jPick(),`É a sua estreia na Fórmula 1. O que podemos esperar de ${surname} em ${G.year}?`,[
      A("Vim para aprender e somar com a equipe. Um passo de cada vez.","humilde",{rep:2,trust:2},"Vim para aprender"),
      A("Vim para ganhar. Não estou aqui para fazer número.","confiante",{pop:3,rep:-1},"Não estou aqui para fazer número"),
      A("Quero ser campeão do mundo. Talvez não este ano, mas vou ser.","polemico",{pop:4,rep:-2,heat:4},"Vou ser campeão do mundo"),
      A("Vamos ver. Ainda é cedo para dizer qualquer coisa.","evasivo",{press:-2})]));
    if(C.nat==="Brasil"&&me.nat==="BRA")qs.push(Q(jPick(["gpbr","racefan"]),`Correr em Interlagos, em casa, com a torcida inteira gritando seu nome. Pesa ou empurra?`,[
      A("Empurra! Essa torcida é a melhor do mundo e vou dar tudo por ela.","emocional",{pop:5,morale:4},"Essa torcida é a melhor do mundo"),
      A("É especial, mas trato como qualquer outra corrida. Preciso manter a cabeça fria.","tecnico",{rep:2},"Trato como qualquer outra corrida"),
      A("Prometo um resultado histórico no domingo.","confiante",{pop:4,heat:3,promise:"top10"},"Prometo um resultado histórico")]));
    if(le&&le.status!=="ok"&&/Acidente/.test(le.why||""))qs.push(Q(jPick(["speedtv","paddock"]),`Na última corrida você bateu sozinho. Alguns dizem que você está forçando demais. Responde aos críticos?`,[
      A("Errei, assumo. Já conversei com a equipe e aprendi.","humilde",{rep:3,trust:3},"Errei, assumo"),
      A("Quem nunca bateu não está no limite. Vou continuar atacando.","confiante",{pop:2,trust:-1},"Quem nunca bateu não está no limite"),
      A("Os críticos não sabem o que é guiar um carro desses.","polemico",{pop:3,rep:-3,press:-6,heat:5},"Os críticos não sabem o que é guiar um carro desses")]));
    if(G.lastOrder&&G.lastOrder.s===G.season&&G.lastOrder.r===G.round-1){const o=G.lastOrder;
      qs.push(Q(jPick(["paddock","speedtv","times"]),o.obeyed?`Você abriu passagem para ${o.mate} na última corrida. Aceita ser segundo piloto?`:`Você ignorou a ordem de equipe na última corrida. Como está a relação com ${t.boss}?`,o.obeyed?[
        A("Fiz o que era melhor para a equipe naquele momento.","humilde",{trust:3,rep:1},"Fiz o que era melhor para a equipe"),
        A("Não sou segundo piloto de ninguém. Foi a última vez.","polemico",{pop:4,trust:-5,heat:6,mate:-10},"Não sou segundo piloto de ninguém"),
        A("Isso fica entre nós e a equipe.","evasivo",{press:-1})]:[
        A("Já conversamos e está tudo resolvido. Foi calor do momento.","humilde",{trust:4,rep:1},"Foi calor do momento"),
        A("Eu era mais rápido. Piloto que abre não vira campeão.","polemico",{pop:5,trust:-6,heat:7,mate:-12},"Piloto que abre não vira campeão"),
        A("Respeito a equipe, mas quero que nos deixem correr.","confiante",{pop:2,trust:-1},"Quero que nos deixem correr")]))}
    if(G.offers&&G.offers.some(o=>!o.renew))qs.push(Q(jPick(["paddock","speedtv"]),`Há rumores de que outras equipes querem você para ${G.year+1}. Já conversou com alguém?`,[
      A("Meu foco total é a minha equipe atual.","evasivo",{trust:3},"Meu foco é a minha equipe atual"),
      A("É bom saber que meu trabalho está sendo notado.","confiante",{pop:2,trust:-3,heat:3},"Meu trabalho está sendo notado"),
      A("Quero um carro para vencer. Se não for aqui, será em outro lugar.","polemico",{pop:3,trust:-8,heat:6},"Se não for aqui, será em outro lugar")]));
    if(rival)qs.push(Q(jPick(["speedtv","racefan","paddock"]),`${rival.n} disse que você "ainda tem muito a aprender". O que acha?`,[
      A("Ele tem mais experiência, é verdade. Vou responder na pista.","humilde",{rep:2,rival:3},"Vou responder na pista"),
      A("Engraçado ele dizer isso. Na pista, quem tem ficado na frente sou eu.","confiante",{pop:3,rival:-8,heat:3},"Na pista, quem tem ficado na frente sou eu"),
      A("Ele deveria se preocupar com o próprio carro.","polemico",{pop:5,rep:-2,rival:-15,heat:6},"Ele deveria se preocupar com o próprio carro")]));
    qs.push(Q(jPick(["motorde","times"]),`${C.n} tem ${C.len.toLocaleString("pt-BR")} m e ${C.street?"é um circuito de rua, sem margem para erro":"um traçado exigente"}. Qual é a chave aqui com o carro de ${G.year}?`,[
      A(C.wear>1.1?"A degradação. Aqui o pneu traseiro sofre muito; quem cuidar dele ganha no fim.":C.street?"A confiança nos muros. Você precisa chegar a centímetros sem tocar.":"A gestão da energia. Com 50% de potência elétrica, quem recarregar melhor ataca nas retas.","tecnico",{rep:3,press:3},"A chave é a gestão"),
      A("Andar rápido. Simples assim.","confiante",{pop:1,press:-2},"Andar rápido. Simples assim"),
      A("Ainda estamos estudando os dados do simulador.","evasivo",{})]));
    if(m)qs.push(Q(jPick(),`Contra ${mName}, o placar de classificação está ${G.h2h.q[0]} a ${G.h2h.q[1]}. Ele é a sua referência?`,[
      A(`${mName} é rápido e me ajuda a crescer. Temos uma boa relação.`,"humilde",{trust:2,mate:5},"Temos uma boa relação"),
      A(`Meu objetivo é bater ${mName} em todo fim de semana.`,"confiante",{pop:2,mate:-4},"Meu objetivo é bater o companheiro"),
      A(G.h2h.q[0]>=G.h2h.q[1]?"Os números falam por si.":"Os números não contam a história toda.","polemico",{pop:2,mate:-8,heat:3},"Os números falam por si")]));
    if(myPos&&myPos<=3&&G.round>4)qs.push(Q(jPick(["times","gpbr"]),`Você é ${myPos}º no campeonato. Dá para sonhar com o título?`,[
      A("Dá. Vamos brigar até a última corrida.","confiante",{pop:3},"Vamos brigar até a última corrida"),
      A("Corrida a corrida. O campeonato se decide no fim.","evasivo",{}),
      A("Sonhar não, eu vou buscar.","emocional",{pop:4,heat:2},"Eu vou buscar")]))}
  else{// pós-corrida (zona mista)
    const res=R&&R.result;const e=res&&res.cls.find(x=>x.d===G.me);const pos=e&&e.pos;const out=e&&e.status!=="ok";const crash=out&&/Acidente/.test(e.why||"");const em=m&&res.cls.find(x=>x.d===m.id);
    const to=R&&R.teamOrder;
    if(pos===1)qs.push(Q(jPick(),`Vitória! Descreva o que está sentindo agora.`,[
      A("Não tenho palavras. Obrigado a cada pessoa da equipe, isso é de vocês.","emocional",{pop:4,trust:4,rep:2},"Isso é de vocês"),
      A("Eu sabia que era possível. É só o começo.","confiante",{pop:5,heat:2},"É só o começo"),
      A("Fizemos a estratégia certa e cuidei bem dos pneus.","tecnico",{rep:4},"Fizemos a estratégia certa")]));
    else if(pos&&pos<=3)qs.push(Q(jPick(),`Pódio em ${CIR[res.track].n}! Faltou alguma coisa para a vitória?`,[
      A("Hoje o pódio era o máximo. Estou muito feliz.","humilde",{rep:2,trust:2},"Hoje o pódio era o máximo"),
      A("Faltou um pouco de carro. Com mais ritmo eu teria vencido.","polemico",{pop:2,trust:-3},"Faltou um pouco de carro"),
      A("Foi uma luta nos pneus. Na próxima a gente chega lá.","confiante",{pop:2},"Na próxima a gente chega lá")]));
    else if(pos&&pos<=10)qs.push(Q(jPick(["gpbr","racefan","motorde"]),`${pos}º lugar e ${POINTS[pos-1]} pontos. Foi o máximo possível?`,[
      A("Foi. Corrida limpa, pontos importantes para a equipe.","humilde",{trust:2,rep:1},"Pontos importantes para a equipe"),
      A("Com uma estratégia melhor dava para mais.","polemico",{pop:1,trust:-4,heat:2},"Com uma estratégia melhor dava para mais"),
      A("O ritmo foi bom. Gerenciei bem a energia nas retas.","tecnico",{rep:2},"Gerenciei bem a energia")]));
    else if(crash)qs.push(Q(jPick(["speedtv","paddock"]),`Você bateu e abandonou. O que aconteceu?`,[
      A("Errei sozinho. Peço desculpas para a equipe.","humilde",{rep:2,trust:4},"Peço desculpas para a equipe"),
      A("O carro estava impossível de guiar naquele trecho.","polemico",{trust:-5,rep:-1},"O carro estava impossível de guiar"),
      A("Estava no limite, faz parte. Quem não arrisca não ganha.","confiante",{pop:1,trust:-1},"Quem não arrisca não ganha")]));
    else if(out)qs.push(Q(jPick(["motorde","times"]),`Problema mecânico (${e.why}). Frustrado com a confiabilidade?`,[
      A("Acontece. A equipe vai descobrir o que houve.","humilde",{trust:3},"A equipe vai descobrir o que houve"),
      A("Muito. Não dá para perder pontos assim.","polemico",{pop:2,trust:-4,heat:3},"Não dá para perder pontos assim"),
      A("Sem comentários agora. Preciso esfriar a cabeça.","evasivo",{press:-2})]));
    else qs.push(Q(jPick(),`${pos?pos+"º":"Fora dos pontos"} hoje. Onde vocês perderam?`,[
      A("Faltou ritmo no carro. Vamos trabalhar e voltar mais fortes.","humilde",{trust:2},"Vamos voltar mais fortes"),
      A("Fiquei preso no tráfego e o ar sujo destruiu meus pneus.","tecnico",{rep:2},"O ar sujo destruiu meus pneus"),
      A("Não foi um bom dia para mim. Eu mesmo não estava bem.","emocional",{pop:1,rep:1},"Não foi um bom dia")]));
    if(to)qs.push(Q(jPick(["speedtv","paddock","racefan"]),to.obeyed?`A equipe pediu para você abrir para ${to.mate} e você obedeceu. Concorda com a decisão?`:`Ouvimos pelo rádio que você ignorou a ordem de equipe. Por quê?`,to.obeyed?[
      A("Era o certo para a equipe. Ele estava mais rápido.","humilde",{trust:3,rep:2},"Era o certo para a equipe"),
      A("Não concordo, mas obedeci. Vamos conversar internamente.","confiante",{pop:2,trust:-2,heat:3},"Não concordo, mas obedeci"),
      A("Na próxima não vou abrir.","polemico",{pop:4,trust:-6,heat:6,mate:-8},"Na próxima não vou abrir")]:[
      A("Eu tinha ritmo para segurar a posição. Peço desculpas se causei problema.","humilde",{trust:4,rep:1},"Peço desculpas"),
      A("Eu sou piloto de corrida. Não vim aqui para abrir para ninguém.","polemico",{pop:6,trust:-8,heat:8,mate:-12},"Não vim aqui para abrir para ninguém"),
      A("Não ouvi bem o rádio naquela hora.","evasivo",{rep:-2,press:-3,trust:-2},"Não ouvi bem o rádio")]));
    if(em&&e&&em.status==="ok"&&(e.status!=="ok"||em.pos<e.pos))qs.push(Q(jPick(),`${mName} terminou à sua frente. Ele está melhor adaptado ao carro?`,[
      A(`Hoje ele fez um trabalho melhor. Mérito dele.`,"humilde",{rep:2,mate:4},"Mérito dele"),
      A(`Tivemos estratégias diferentes. Não dá para comparar.`,"evasivo",{}),
      A(`A equipe precisa me dar as mesmas condições.`,"polemico",{pop:2,trust:-5,heat:4,mate:-6},"A equipe precisa me dar as mesmas condições")]));
    if(R&&R.myPasses>=4)qs.push(Q(jPick(["racefan","gpbr"]),`Você fez ${R.myPasses} ultrapassagens hoje. Qual foi a melhor?`,[
      A("Todas foram especiais, o carro estava ótimo no modo de ultrapassagem.","tecnico",{rep:2},"O carro estava ótimo"),
      A("A última, por fora. Essa vai para os melhores momentos!","emocional",{pop:3},"Essa vai para os melhores momentos")]))}
  // no máximo 3 perguntas, mais relevantes primeiro
  const I={type,qs:qs.slice(0,3),ans:[],i:0};G.interview=I;return I}
function answerInterview(k){const I=G.interview;if(!I)return;const q=I.qs[I.i];const a=q.opts[k];I.ans.push({q,a});applyEff(a.eff,q.j);I.i++;if(I.i>=I.qs.length)return finishInterview();return null}
function applyEff(e,j){const me=ME();fameAdd((e.pop||0)*.7,(e.rep||0)*.7);if(e.trust)G.trust=clamp(G.trust+e.trust,0,100);if(e.morale)me.morale=clamp(me.morale+e.morale,0,100);
  if(e.heat)heatAdd(e.heat);if(e.press&&j)pressAdd(j.n,e.press);if(j)pressAdd(j.n,1);
  if(e.rival&&G.rival)relAdd(G.rival,e.rival);if(e.mate){const m=mate();if(m)relAdd(m.id,e.mate)}
  if(e.promise)G.promise={what:e.promise,s:G.season,r:G.round};
  follow((e.pop||0)*G.fame.followers*.004)}
function finishInterview(){const I=G.interview;if(!I)return null;const me=ME();const sur=me.n.split(" ").pop();
  // a resposta mais "quente" vira manchete
  const score=a=>({polemico:5,emocional:3,confiante:2,tecnico:1,humilde:1,evasivo:0}[a.a.tone]||0);const top=I.ans.slice().sort((x,y)=>score(y)-score(x))[0];
  const j=top.q.j,o=OUTLETS.find(x=>x.id===j.o);const tone=top.a.tone;
  const H={sensacionalista:{polemico:`BOMBA: ${sur} dispara "${top.a.quote}"`,emocional:`${sur} se emociona: "${top.a.quote}"`,confiante:`${sur} provoca: "${top.a.quote}"`,_:`${sur} fala sobre o fim de semana`},
    "técnico":{tecnico:`${sur} explica: "${top.a.quote}"`,_:`Análise: o que ${sur} revelou sobre o carro`},
    patriota:{emocional:`Orgulho nacional! ${sur}: "${top.a.quote}"`,confiante:`${sur} promete brigar: "${top.a.quote}"`,polemico:`${sur} não leva desaforo: "${top.a.quote}"`,_:`${sur} fala com exclusividade à imprensa brasileira`},
    bastidores:{polemico:`Clima tenso? ${sur} diz "${top.a.quote}"`,_:`Nos bastidores: ${sur} e o momento da ${myTeam().n}`},
    torcedor:{_:`${sur}: "${top.a.quote}"`},"sério":{polemico:`${sur} abre polêmica com declaração`,_:`${sur}: "${top.a.quote}"`}};
  const hs=H[o.tone]||H["sério"];const headline=hs[tone]||hs._;
  const others=I.ans.filter(x=>x!==top);const body=`Questionado por ${j.n}, do ${o.n}, o piloto foi direto: "${top.a.t}"`+(others.length?` Em outro momento da ${I.type==="pre"?"coletiva":"zona mista"}, ${me.n.split(" ")[0]} disse: "${others[0].a.t}"`:"")+(tone==="polemico"?` A declaração deve repercutir no paddock nos próximos dias.`:"");
  const art={id:"a"+(G.articles.length+1),s:G.season,r:G.round,outlet:o.n,tone:o.tone,journo:j.n,headline,body,kind:I.type==="pre"?"entrevista":"zona mista",heat:tone==="polemico"};
  G.articles.unshift(art);if(G.articles.length>80)G.articles.length=80;
  post("journo",`${headline} ${tone==="polemico"?"🔥":""}`,{journo:j,likes:Math.round(rr(300,2500)*(1+G.fame.pop/10)*(tone==="polemico"?2.5:1)),tag:tone==="polemico"?"#"+sur.toUpperCase().replace(/[^A-Z]/g,""):null});
  if(tone==="polemico"){for(let i=0;i<3+Math.round(G.fame.pop/15);i++)post("fan",pick([`"${top.a.quote}" kkkkk ${sur} não tem medo de nada`,`${sur} falou o que todo mundo pensa`,`Que falta de respeito de ${sur}`,`Isso vai dar problema com a ${myTeam().n} 😬`,`${sur} tá virando o vilão da F1 e eu amo`]),{mood:0});
    const t=myTeam();if(G.trust<45)post("team",`Nossos pilotos falam por si. Seguimos focados no trabalho. #${t.n.replace(/\s/g,"")}`,{team:t.id,likes:ri(800,3000)})}
  else if(tone==="emocional")fansReact("points",2);
  G.interview=null;save();return art}
// ---------- posts do jogador
function postOptions(ctx){const me=ME(),t=myTeam();const sur=me.n.split(" ").pop();const res=G.results.filter(r=>!r.sprint&&r.season===G.season).slice(-1)[0];const e=res&&res.cls.find(x=>x.d===G.me);
  const o=[{k:"thanks",n:"Agradecer a equipe",tone:"humilde",txt:`Obrigado a todos da ${t.n} pelo trabalho incansável. Seguimos juntos 💪`,eff:{trust:2,pop:1}},
    {k:"fans",n:"Falar com os fãs",tone:"emocional",txt:`Vocês são incríveis! Cada mensagem chega até mim. Obrigado pelo apoio ❤️🏁`,eff:{pop:2}},
    {k:"gym",n:"Foto do treino físico",tone:"confiante",txt:`Treino de pescoço hoje: 5G nas curvas não perdoa 😤 #TreinoDePiloto`,eff:{pop:1.5,morale:2}},
    {k:"sim",n:"Bastidores no simulador",tone:"tecnico",txt:`Horas no simulador preparando ${CIR[G.calendar[Math.min(G.round,G.calendar.length-1)]].n}. Cada décimo conta.`,eff:{rep:1,trust:1}}];
  if(e&&e.status==="ok"&&e.pos<=3)o.push({k:"cele",n:"Comemorar o pódio",tone:"emocional",txt:`P${e.pos}!!! Que dia! Esse troféu é nosso 🏆🍾`,eff:{pop:3}});
  if(e&&(e.status!=="ok"||e.pos>10))o.push({k:"vent",n:"Desabafar",tone:"polemico",txt:`Domingo frustrante. Algumas coisas precisam mudar. Não vou falar mais nada.`,eff:{pop:2,trust:-5,heat:5}});
  if(typeof spPostOptions==="function")o.push(...spPostOptions());
  if(G.rival&&G.drivers[G.rival])o.push({k:"jab",n:`Provocar ${G.drivers[G.rival].code}`,tone:"polemico",txt:`Alguns falam demais fora da pista. Nos vemos domingo 😉`,eff:{pop:3,rep:-1.5,rival:-12,heat:5}});
  return o}
function doPost(k){const o=postOptions().find(x=>x.k===k);if(!o||G.postedRound===G.season*100+G.round)return null;G.postedRound=G.season*100+G.round;
  const likes=Math.round(G.fame.followers*rr(.02,.06)*(o.tone==="polemico"?1.8:1));const p=post("me",o.txt,{likes});applyEff(o.eff);if(o.sp)spPosted(o.sp);
  const sur=ME().n.split(" ").pop();
  const rep=o.tone==="polemico"?[`Eita, ${sur} mandou indireta 👀`,`Isso foi pra quem?`,`Não precisava disso`]:[`Orgulho! 🇧🇷`,`Vamos ${sur}!!!`,`Melhor piloto do grid`,`❤️❤️❤️`];
  p.replies=rep.slice(0,2).map(t=>({who:fanAuthor(),t}));
  if(o.tone==="polemico"&&G.rival&&o.k==="jab"){const r=G.drivers[G.rival];post("rival",pick([`Prefiro responder na pista. 🙂`,`Interessante... domingo a gente conversa.`,`Foco no meu trabalho.`]),{author:{n:r.n,h:handleOf(r.n),v:true,c:teamOf(r.team).c},likes:Math.round(likes*.8)})}
  save();return p}
// ---------- reportagem semanal (análise com números)
function weeklyReport(res){const me=ME(),m=mate(),t=myTeam();const st=standings();const sur=me.n.split(" ").pop();const C=CIR[res.track];
  const e=res.cls.find(x=>x.d===G.me);const myPos=st.drivers.findIndex(d=>d.id===G.me)+1;const pts=(st.drivers.find(d=>d.id===G.me)||{pts:0}).pts;
  const o=pick(OUTLETS);const j=JOURNOS.find(x=>x.o===o.id)||pick(JOURNOS);
  const win=G.drivers[res.cls[0].d];const headline=e.status==="ok"&&e.pos===1?`${sur} vence em ${C.n} e entra para a história da ${t.n}`:
    e.status==="ok"&&e.pos<=3?`Pódio de ${sur} em ${C.n} confirma evolução`:e.status!=="ok"?`${C.n}: domingo para esquecer para ${sur}`:e.pos<=10?`${sur} pontua em ${C.n} e soma ${pts} no ano`:`${sur} sofre em ${C.n}; ${win.n.split(" ").pop()} vence`;
  const para=[`${win.n} venceu o ${C.gp} com a ${teamOf(win.team).n}.`,
    e.status==="ok"?`${me.n} largou em ${res.gridMe}º e terminou em ${e.pos}º${e.pos<res.gridMe?`, ganhando ${res.gridMe-e.pos} posições`:e.pos>res.gridMe?`, perdendo ${e.pos-res.gridMe} posições`:""}.`:`${me.n} abandonou (${e.why}).`,
    m?`No duelo interno contra ${m.n}, o placar está ${G.h2h.q[0]} x ${G.h2h.q[1]} em classificações e ${G.h2h.r[0]} x ${G.h2h.r[1]} em corridas.`:"",
    `No campeonato, ${sur} é o ${myPos}º com ${pts} pontos. A confiança da equipe está em ${Math.round(G.trust)}% e a popularidade em ${Math.round(G.fame.pop)}/100.`,
    G.heat>40?`Fora da pista, o clima esquentou: as declarações recentes do piloto dividiram a opinião do paddock.`:""].filter(Boolean).join(" ");
  const art={id:"a"+(G.articles.length+1),s:G.season,r:G.round,outlet:o.n,tone:o.tone,journo:j.n,headline,body:para,kind:"reportagem"};G.articles.unshift(art);return art}
// ---------- reação geral pós-corrida (chamada pela UI)
function mediaAfterRace(res){const me=ME(),t=myTeam();const e=res.cls.find(x=>x.d===G.me);const sur=me.n.split(" ").pop();const C=CIR[res.track];
  const win=G.drivers[res.cls[0].d];post("sys",`🏁 ${win.n} vence o ${C.gp}! ${res.cls.slice(0,3).map(x=>G.drivers[x.d].code).join(" · ")} no pódio.`,{likes:ri(30000,120000),tag:"#"+C.gp.replace(/^GP (d[aoe]s? )?/,"").replace(/\s/g,"")+"GP"});
  if(e.status==="ok"){const k=e.pos===1?"win":e.pos<=3?"podium":e.pos<=10?"points":"bad";fansReact(k,k==="bad"?3:4,{p:e.pos});
    const gain=e.pos===1?18:e.pos<=3?8:e.pos<=10?2.5:-.4;follow(G.fame.followers*gain/100+ri(200,1500));if(e.pos<=3)trend("#"+sur.toUpperCase().replace(/[^A-Z]/g,""),20000)}
  else fansReact(/Acidente/.test(e.why||"")?"crash":"dnf",3);
  if(R&&R.teamOrder){fansReact(R.teamOrder.obeyed?"orderYes":"orderNo",4);trend("#OrdemDeEquipe",15000);G.lastOrder={...R.teamOrder,s:G.season,r:G.round};
    if(!R.teamOrder.obeyed){heatAdd(8);post("journo",`Rádio: ${me.code} ignora ordem da ${t.n} para deixar ${R.teamOrder.mate} passar. ${t.boss} não escondeu a irritação.`,{journo:pick(JOURNOS),likes:ri(4000,15000)})}}
  // promessa
  if(G.promise&&G.promise.r===G.round&&G.promise.s===G.season){const ok=e.status==="ok"&&e.pos<=10;fameAdd(ok?4:-4,ok?1:-2);post("journo",ok?`${sur} prometeu e cumpriu!`:`${sur} prometeu resultado histórico... e não entregou.`,{journo:pick(JOURNOS),likes:ri(2000,9000)});G.promise=null}
  // rival: piloto mais próximo no campeonato com rixa
  if(!G.rival&&G.round>=3){const st=standings();const i=st.drivers.findIndex(d=>d.id===G.me);const near=[st.drivers[i-1],st.drivers[i+1]].filter(d=>d&&d.id!==(mate()||{}).id);if(near.length){G.rival=pick(near).id;const r=G.drivers[G.rival];news(`A imprensa já fala em rivalidade entre você e ${r.n}.`,"big")}}
  G.heat=Math.max(0,(G.heat||0)-3);weeklyReport(res);save()}
function mediaAfterQuali(){const q=W.quali;const me=ME();const p=q.order.findIndex(x=>x.id===G.me)+1;const pole=G.drivers[q.order[0].id];
  post("sys",`⏱️ POLE POSITION: ${pole.n} (${teamOf(pole.team).n}) em ${CIR[W.track].n}.`,{likes:ri(15000,60000)});
  if(p===1)fansReact("pole",4);else if(p>15)fansReact("quali_bad",2);save()}
