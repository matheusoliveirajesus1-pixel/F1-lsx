// ===================== RÁDIO VIVO (piloto, engenheiro, companheiro) =====================
// Falas que nascem do que aconteceu de verdade na corrida: ultrapassagens, portas fechadas, toques, volta mais rápida,
// pneus, chuva, safety car, briga com o companheiro, última volta, chegada.
// Para ficar vivo sem poluir: cada fala tem prioridade; as pequenas esperam ou somem; há um intervalo mínimo entre falas
// (as importantes passam na frente); nenhuma frase se repete na corrida; o tom muda com o momento e com o temperamento
// (quente xinga, frio analisa). Só apresentação: usa os sorteios visuais (vpick), nunca os da física.

// temperamento do piloto (o seu também): agressivo = quente; disciplinado = frio
function voxTemper(c){const p=(c&&c.d&&c.d.pers)||{aggr:50,disc:50};return p.aggr>64||(c&&c.d&&c.d.trait==="agressivo")?"quente":p.disc>66?"frio":"normal"}
// {A} carro envolvido, {P} posição, {G} distância, {T} tempo, {E} engenheiro, {M} companheiro, {C} curva, {L} voltas restantes
const VOX={
 // ---------- você (piloto)
 me_gain:{quente:["Passei! Toma essa, {A}!","Isso! Por dentro, sem chance pra ele!","Vamos! P{P}! Quem é o próximo?","Engoliu a poeira, {A}! Próximo!","Foi lindo isso! Me dá o gap do próximo!"],
   normal:["Passei o {A}! P{P}.","Boa! Ganhei a posição do {A}.","Ultrapassagem feita. Qual é o gap pro próximo?","Consegui! P{P}, seguimos.","Deixei o {A} pra trás."],
   frio:["Ok, passei o {A}. Mantendo o ritmo.","Posição ganha. Pneus ainda bons.","Feito. P{P}. Qual é o próximo alvo?","Passagem limpa. Seguimos."]},
 me_lost:{quente:["Porra! O {A} me passou com tudo!","Que merda! Perdi a posição pro {A}!","Não acredito! Como o {A} tem tanta velocidade?","Droga! Ele veio do nada!","Caralho, que vacilo meu!"],
   normal:["Perdi a posição pro {A}. Ele veio com muito vácuo.","O {A} passou. Vou tentar devolver.","Droga, perdi o {A}. P{P} agora.","Ele estava mais rápido na reta."],
   frio:["O {A} estava mais rápido. Sem problema, vou seguir o ritmo.","Perdi a posição. Qual é o ritmo dele?","Entendido. Vou proteger os pneus e esperar a chance."]},
 me_door:{quente:["Ele fechou a porta na cara! Isso é perigoso!","Que porra é essa? Ele mudou de direção na freada!","O {A} tá jogando o carro em cima de mim!","Esse cara não deixa espaço nenhum, caralho!"],
   normal:["O {A} fechou a porta. Não tinha espaço.","Ele defende bem demais, vou tentar por fora.","Sem espaço. Ele cobriu o lado de dentro."],
   frio:["Ele defendeu bem. Vou esperar a próxima reta.","Sem espaço por dentro. Tentarei outra coisa."]},
 me_defend:{quente:["Segurei! Pode vir que aqui não passa!","Não vai passar não, {A}!","Isso! Fechei a porta direitinho!"],normal:["Segurei o {A}. Ele vai voltar a tentar.","Defesa feita. Ele está muito perto.","Consegui segurar. Qual é o gap atrás?"],frio:["Defendi. Ele vai tentar de novo na próxima reta.","Posição mantida. Cuidando dos pneus."]},
 me_contact:{quente:["Ele me acertou! Viu isso? Porra!","Que filho da mãe! Bateu em mim!","Toque! Ele não freou!","Merda! Teve toque, verifiquem o carro!"],
   normal:["Teve toque com o {A}! Verifiquem o carro.","Encostamos. Vejam se tem dano.","Ele me tocou na freada."],frio:["Pequeno toque com o {A}. Vejam os dados.","Contato. O carro parece ok."]},
 me_spin:{quente:["Rodei! Que merda de traseira!","Perdi o carro! Porra!","Esse carro tá impossível de guiar!"],normal:["Rodei! Voltando pra pista.","Perdi a traseira. Tudo bem, voltando.","Rodada. Desculpa, pessoal."],frio:["Rodei. Sem dano aparente. Voltando com cuidado.","Erro meu. Voltando."]},
 me_crash:{quente:["Acabou! Que merda! Que corrida jogada fora!","Não acredito, porra! Acabou!","Bati! Desculpa, gente... que raiva!"],normal:["Bati. Estou bem, mas o carro acabou.","Acabou pra nós. Desculpem.","Fim de corrida. Estou bem."],frio:["Batida. Estou bem. Desculpem, erro meu.","O carro acabou. Estou bem."]},
 me_tyre:{quente:["Esses pneus acabaram! Não tenho aderência nenhuma!","Tô patinando em tudo! Cadê o box?","Os pneus morreram, caralho!"],normal:["Os pneus estão no fim.","Muito desgaste atrás. Box logo?","Estou perdendo aderência a cada volta."],frio:["Os pneus estão caindo. Quantas voltas até a janela?","Perdendo uns décimos por volta com esses pneus."]},
 me_rain:{quente:["Tá chovendo na {C}! Tá um sabão!","Chuva! Não dá pra ficar de slick muito tempo!"],normal:["Começou a chover na {C}.","Algumas gotas na {C}. Fiquem de olho."],frio:["Chuva leve na {C}. Por enquanto dá pra seguir."]},
 me_lead:{quente:["LIDERANDO! Ninguém me pega agora!","P1! Vamos! Vamos!"],normal:["Estamos na liderança! Vamos manter.","P1! Agora é cuidar dos pneus."],frio:["Na liderança. Vou administrar."]},
 me_mate:{quente:["Passei o {M}! Ele que se vire!","Deixei o {M} pra trás. Ninguém me segura!"],normal:["Passei o {M}.","Ganhei a posição do {M}."],frio:["Passei o {M}. Seguimos."]},
 me_mateLost:{quente:["O {M} me passou?! Ele quase me jogou pra fora!","Que é isso, {M}? Somos da mesma equipe, porra!","Falem pro {M} tomar cuidado!"],normal:["O {M} me passou. Ele estava mais rápido.","Perdi a posição pro {M}.","O {M} veio com tudo pra cima de mim."],frio:["O {M} passou. Estava com pneus melhores.","Ok, o {M} passou. Seguimos."]},
 me_pen:{quente:["Punição?! Isso é ridículo!","Que palhaçada, eu não fiz nada!","Quem são esses comissários? Porra!"],normal:["Punição? Achei que estava dentro.","Que pena. Vamos recuperar."],frio:["Entendido, punição. Vamos compensar no ritmo."]},
 me_win:{quente:["VAMOOOOS! VITÓRIA, PORRA! VOCÊS SÃO DEMAIS!","SIIIIIM! É NOSSA! QUE CORRIDA!","GANHAMOS, CARALHO! OBRIGADO, EQUIPE!"],normal:["Vencemos! Que domingo! Obrigado, pessoal!","Vitória! Vocês fizeram um carro incrível!"],frio:["Vitória. Estratégia perfeita. Obrigado a todos.","Grande trabalho, pessoal. Corrida perfeita."]},
 me_podium:{quente:["PÓDIO! VAMOS! QUE CORRIDA!","P{P}! Pódio, galera! Isso é demais!"],normal:["Pódio! Obrigado, pessoal!","P{P}! Que resultado pra equipe!"],frio:["P{P}. Bom resultado. Obrigado à equipe."]},
 me_points:{quente:["Pontos! Arrancamos isso na raça!","P{P}! Valeu a briga!"],normal:["Pontos pra equipe! P{P}.","Boa! Saímos com pontos."],frio:["P{P}, pontos. Corrida sólida."]},
 me_bad:{quente:["Que corrida horrível. Precisamos conversar.","Não deu nada certo hoje. Que raiva!","P{P}... que merda de domingo."],normal:["Não foi nosso dia. P{P}.","Difícil hoje. Vamos analisar os dados."],frio:["P{P}. Precisamos entender onde perdemos tempo.","Corrida difícil. Vamos aprender com isso."]},
 me_start:{quente:["Largada animal! Ganhei {N}!","Passei {N} carros na largada! Vamos!"],normal:["Boa largada, ganhei {N} posições.","Largada boa! P{P}."],frio:["Largada limpa, +{N}. Seguimos."]},
 me_startBad:{quente:["Que largada de merda! Perdi {N}!","Me fecharam na primeira curva, porra!"],normal:["Largada ruim, perdi {N} posições.","Fiquei preso na primeira curva."],frio:["Perdi {N} na largada. Vou recuperar com calma."]},
 me_go:{quente:["Vou pra cima do {A}! Segura que lá vou eu!","Ele tá no meu alcance. Agora!","Chega de esperar, vou atacar o {A}!"],normal:["Vou tentar o {A} na próxima reta.","Estou mais rápido que o {A}, vou atacar.","Preparando o ataque no {A}."],frio:["Oportunidade no {A}. Vou tentar na freada.","Ele está gastando os pneus. Vou atacar agora."]},
 me_chat:{quente:["Esse carro tá pedindo mais, vamos forçar!","Que pista travada, não tem lugar pra passar!","Tem óleo na {C}? Tá escorregando demais!","Meu banco tá queimando aqui, caramba!","Vamos lá, vamos lá, foco!","O carro tá saindo de traseira na {C}, que saco!","Esse tráfego tá me matando!","Que calor nesse cockpit, caramba!","Os freios estão muito bons hoje, vamos!"],
   normal:["Estou me sentindo bem no carro.","A {C} está ficando mais fácil a cada volta.","O vento mudou, sinto mais na {C}.","Tem um pouco de sujeira fora do traçado na {C}.","O motor está redondo, sem problemas.","Freios bons, consigo frear tarde na {C}.","O carro está bom, só um pouco de saída de frente na {C}.","O equilíbrio está bom. Seguimos.","A pista está melhorando a cada volta.","Os pneus estão aguentando bem.","O vento está forte na {C}."],
   frio:["Temperatura dos freios ok.","Vou testar outra linha na {C}.","Consumo dentro do previsto?","Equilíbrio bom. Um pouco de subesterço na {C}.","Ritmo estável. Pneus dentro da janela.","Tudo sob controle aqui."]},
 me_restart:{quente:["Relargada! Agora é pra cima!","Bora! Ninguém me segura na relargada!"],normal:["Relargada, pneus aquecidos. Vamos!","Pronto pra relargada."],frio:["Relargada. Pneus na temperatura."]},
 me_traffic:{quente:["Tira esse retardatário da frente, porra!","Bandeira azul! Ele não sai da frente!"],normal:["Retardatário na frente, perdendo tempo.","Tráfego. Avisem ele da bandeira azul."],frio:["Tráfego à frente. Vou passar com cuidado."]},
 // ---------- engenheiro (fala com você)
 eng_info:["Volta {V}: {T}. Você está em P{P}.","P{P}, {L} voltas para o fim.","{T} na última volta. O {A} está a {G} s.","Tudo certo, P{P}. Os pneus estão em {W}%.","Pneus em {W}%. Temos margem.","{L} voltas para o fim. Mantém esse ritmo.","Sua última volta: {T}. Continua assim.","P{P}. O {A} está a {G} s à sua frente.","Faltam {L} voltas. Concentração.","P{P}. Cada posição conta."],
 eng_crash:["Cuidado! Carro batido na {C}, bandeira amarela!","Acidente do {A} à frente, na {C}. Cuidado!","Atenção: {A} parado na {C}. Reduz ali."],
 eng_restart:["Safety car entrando. Relargada, prepare os pneus!","O safety car sai nesta volta. Aquece os pneus!"],
 eng_box:["Box, box nesta volta. Pneus {X}.","Vamos parar nesta volta. Pneus {X}.","Box, box! Confirma, pneus {X}."],
 eng_threat:["O {A} está chegando com o modo de ultrapassagem. Defende!","Atenção: {A} vai atacar na próxima reta.","Cuidado com o {A} atrás, ele tem mais bateria."],
 eng_lead:["Mudança na liderança: {A} é o novo líder.","O {A} passou para a ponta da corrida."],
 eng_fast:["Volta mais rápida da corrida! {T}. Fantástico!","Roxo! Volta mais rápida: {T}. Continua assim!","{T}! Ninguém andou mais rápido hoje!"],
 eng_pb:["Boa volta! {T}, a sua melhor até agora.","{T}. Esse é o ritmo!","Melhor volta pessoal: {T}. Continua."],
 eng_gapA:["O {A} está a {G} s. Você é {D} mais rápido por volta.","Gap pro {A}: {G} s. Você está tirando {D} por volta.","{G} s pro {A}. Vai chegar nele em poucas voltas."],
 eng_gapB:["O {A} está a {G} s atrás e chegando. Ele é {D} mais rápido.","Atenção: {A} a {G} s, vindo forte.","Cuidado atrás: {A} a {G} s."],
 eng_last:["Última volta! O {A} está a {G} s, segura ele, segura!","Última volta! Traz pra casa, você consegue!","Última volta! Sem erros agora, P{P} é nosso!","Última volta! Vai pra cima do {A}, ele está a {G} s!"],
 eng_pit:["{T} no box! Grande trabalho dos mecânicos!","Parada de {T}. Boa, pessoal!","Pit stop de {T}. Vamos!"],
 eng_pitBad:["{T} no box, perdemos um pouco ali. Desculpa.","Parada lenta: {T}. Vamos recuperar na pista.","{T}. Uma porca demorou. Foco agora."],
 eng_pitNote:["{T} no box: {X}. Vamos recuperar.","Parada longa, {T}, por causa disto: {X}.","{T}. Precisamos: {X}. Agora é atacar."],
 eng_sc:["Safety car! Mantém o delta, cuidado com os pneus frios.","Safety car na pista. Calma, fica atrás do carro da frente.","Bandeira amarela geral, safety car. Mantém a temperatura dos pneus."],
 eng_rain:["Chuva chegando na {C}. Atenção na freada.","O radar mostra chuva perto da {C}. Fica de olho."],
 eng_calm:["Respira. Você está indo bem.","Calma, ainda tem muita corrida.","Esquece o que passou. Foco na próxima curva."],
 eng_mateWarn:["Cuidado com o {M}. Nada de batida entre nós, por favor.","Atenção: briga com o {M}. Deixa espaço, os dois carros importam."],
 eng_fin_win:["VOCÊ VENCEU! VOCÊ VENCEU! QUE PILOTAGEM!","VITÓRIA! Sensacional! Isso foi incrível!"],
 eng_fin_pod:["P{P}! Pódio! Grande corrida!","P{P}! Que trabalho, campeão!"],
 eng_fin_pts:["P{P}. Pontos importantes, boa corrida.","Terminamos em P{P}. Bom trabalho hoje."],
 eng_fin_bad:["P{P}. Não foi o dia. Vamos analisar tudo.","Terminamos em P{P}. Valeu o esforço, vamos melhorar."],
 // ---------- companheiro (rádio dele, na transmissão)
 mate_beaten:{quente:["De novo atrás do {M}? Isso não pode continuar!","Ele está tendo um carro melhor que o meu, só pode!"],normal:["O {M} foi melhor hoje. Respeito.","Perdi a posição pro {M}."],frio:["O {M} estava mais rápido. Vou analisar os dados."]},
 mate_beat:{quente:["Passei o {M}! Ele não me segura nunca!","Isso aí! Mostrei quem manda na equipe!"],normal:["Passei o {M}. Agora é seguir.","Deixei o {M} pra trás."],frio:["Posição ganha do {M}. Seguimos."]},
 mate_rival:{quente:["O {M} quase me tirou da pista! Falem com ele!","Ele não respeita ninguém, nem o companheiro!"],normal:["A briga com o {M} está pesada.","Avisem o {M} que eu estou do lado dele."],frio:["Briga dura com o {M}. Sem riscos, por favor."]}};

// ---------- motor do rádio
function voxInit(){R.vox={said:{},used:{},next:0,q:[],last:{},meta:{}}}
function voxLine(list,c,v){const arr=Array.isArray(list)?list:list[voxTemper(c)]||list.normal;const used=R.vox.used;const has=x=>!(x.match(/\{(\w)\}/g)||[]).some(m=>v[m[1]]==null);const ok=arr.filter(has);const fresh=ok.filter(x=>!used[x]);if(!fresh.length&&v.__once)return null;const pool=fresh.length?fresh:ok.length?ok:arr;const s=typeof vpick==="function"?vpick(pool):pool[0];used[s]=1;
  return s.replace(/\{(\w)\}/g,(m,k)=>v[k]!=null?String(v[k]):m)}
// pri 1 = cor, 2 = importante, 3 = urgente (fura a fila). who: "me" (você), "eng" (engenheiro), "mate" (companheiro, na transmissão)
function vox(kind,c,v,pri,who){if(!R||!R.vox||!c)return;pri=pri||1;const k=kind+(who||"");if((R.vox.said[k]||-99)>R.t-(pri>=3?0:pri===2?22:45))return;if(R.t<R.vox.next&&pri<3){if(pri===2)R.vox.q.push({kind,c,v,pri,who,t:R.t});return}
  const list=VOX[kind];if(!list)return;R.vox.said[k]=R.t;R.vox.next=R.t+(pri>=3?3:pri===2?6:8)+(typeof vrr==="function"?vrr(0,3):1.5);R.vox.lastT=R.t;const txt=voxLine(list,c,Object.assign({},v||{},pri<2?{__once:1}:{}));if(!txt)return;(R.vox.log=R.vox.log||[]).push({t:R.t,lap:Math.max(1,R.lead+1),who:who||"me",txt});
  if(who==="mate"){if(typeof tvRadioSay==="function")tvRadioSay(c,txt);else narr(`Rádio de ${c.code}: "${txt}"`,1);return}
  if(typeof tvMyRadioSay==="function")tvMyRadioSay(c,txt,who);
  if(who==="eng"){radio(c,txt,{k:"vox",vox:1})/* o feed já mostra "Engenheiro" no cabeçalho */;if(typeof ttsSay==="function")ttsSay("eng",txt,pri)}
  else{radio(c,txt,{me:1,k:"vox",vox:1});if(typeof ttsSay==="function")ttsSay("me",txt,pri)}}
function voxFlush(){const Q=R.vox.q;if(!Q.length||R.t<R.vox.next)return;const x=Q.shift();if(R.t-x.t<8)vox(x.kind,x.c,x.v,x.pri,x.who);R.vox.q=Q.filter(y=>R.t-y.t<8)}

// ---------- o que aconteceu (chamado pelo hlight da corrida)
function voxHl(type,cars){if(!R.vox||!R.started)return;const me=R.cars.find(c=>c.isP);if(!me)return;const m=R.cars.find(c=>c!==me&&c.t===me.t);const a=cars[0],b=cars[1];
  const P=x=>pos(x);
  if(type==="lead"&&a&&a!==me&&R.lead>0&&!a.pit&&R.t-(R.vox.meta.leadT||-999)>240){R.vox.meta.leadT=R.t;vox("eng_lead",me,{A:a.code},1,"eng")}
  else if((type==="crash")&&a&&a!==me&&!cars.includes(me)){const cn=typeof nextCorner==="function"&&nextCorner(a);const d=((a.prog-me.prog)%1+1)%1;if(d<.35)vox("eng_crash",me,{A:a.code,C:cn?cn.n:"pista"},2,"eng")}
  else if((type==="contact"||type==="crash"||type==="spin")&&cars.includes(me)){const o=cars.find(x=>x!==me);
    if(type==="crash"&&!running(me))vox("me_crash",me,{},3);else if(type==="spin")vox("me_spin",me,{},2);else vox("me_contact",me,{A:o?o.code:"outro"},2);
    if(o&&o===m)vox("mate_rival",m,{M:me.code},2,"mate")}}// a chegada é tratada em voxTick (quando o seu carro recebe a bandeirada, vencendo ou não)
// fim da corrida: piloto e engenheiro, pelo resultado em relação ao esperado
function voxFinish(me){const p=pos(me),exp=typeof expectedPos==="function"?expectedPos():10;const v={P:p};
  if(p===1){vox("eng_fin_win",me,v,3,"eng");setTimeout(()=>vox("me_win",me,v,3),2600)}
  else if(p<=3){vox("eng_fin_pod",me,v,3,"eng");setTimeout(()=>vox("me_podium",me,v,3),2600)}
  else if(p<=10&&p<=exp+1){vox("eng_fin_pts",me,v,3,"eng");setTimeout(()=>vox("me_points",me,v,3),2600)}
  else{vox("eng_fin_bad",me,v,3,"eng");setTimeout(()=>vox("me_bad",me,v,3),2600)}}

// ---------- observando o carro do jogador (1 vez a cada meio segundo de corrida)
function voxTick(){if(!R||!R.vox||!R.started)return;const me=R.cars.find(c=>c.isP);if(!me)return;
  if(me.status==="fin"&&!R.vox.meta.finSaid){R.vox.meta.finSaid=1;voxFinish(me);return}
  if(R.over||!running(me))return;const V=R.vox,M=V.meta;if(R.t<(M.tk||0))return;M.tk=R.t+.5;voxFlush();
  const i=R.order.indexOf(me),A=R.order[i-1],B=R.order[i+1];const ok=x=>x&&running(x)&&!x.pit;
  // ganhou ou perdeu posição (na pista, não no box)
  {const p=pos(me),m=R.cars.find(c=>c!==me&&c.t===me.t);if(M.p==null)M.p=p;
    if(p!==M.p&&!me.pit){const prev=M.p;M.p=p;if(me.lap>=1&&R.t-(R.go||0)>25){
      if(p<prev){const b=R.order[p];if(b&&!b.pit&&running(b)){if(b===m){vox("me_mate",me,{M:b.code},2);vox("mate_beaten",m,{M:me.code},1,"mate")}else vox(p===1?"me_lead":"me_gain",me,{A:b.code,P:p},p<=3?3:2)}}
      else{const a=R.order[p-2];if(a&&!a.pit&&running(a)&&a.status!=="fin"){if(a===m){vox("me_mateLost",me,{M:a.code},2);vox("mate_beat",m,{M:me.code},1,"mate");M.mateSwap=(M.mateSwap||0)+1;if(M.mateSwap>=2)vox("eng_mateWarn",me,{M:a.code},2,"eng")}else vox("me_lost",me,{A:a.code,P:p},2)}}}}
    else if(me.pit)M.p=p;
    // largada: resumo da primeira volta
    if(me.lap>=1&&!M.startSaid){M.startSaid=1;if(!me.stops){const g=(M.grid0||p)-p;if(g>=2)vox("me_start",me,{N:g,P:p},2);else if(g<=-2)vox("me_startBad",me,{N:-g,P:p},2)}}
    if(M.grid0==null&&R.started)M.grid0=p}
  // o piloto decidiu atacar (cérebro): anuncia
  if(me.goReq&&!M.goSaid&&ok(A)){M.goSaid=1;vox("me_go",me,{A:A.code},1)}if(!me.goReq)M.goSaid=0;
  // alguém vem atacar você
  if(ok(B)&&B.t!==me.t&&(B.goReq||B.ovMode)&&(me.prog-B.prog)*me.L<.8&&!M.thrSaid){M.thrSaid=1;vox("eng_threat",me,{A:B.code},1,"eng")}if(!(ok(B)&&(me.prog-B.prog)*me.L<1.2))M.thrSaid=0;
  // chamado para o box
  if(me.pitCall&&!M.boxSaid){M.boxSaid=1;vox("eng_box",me,{X:(COMP[me.pitCall]||COMP.M).n.toLowerCase()},2,"eng")}if(!me.pitCall)M.boxSaid=0;
  // relargada depois do safety car
  if(M.sc&&!R.sc){const e=vrnd()<.5;vox(e?"eng_restart":"me_restart",me,{},2,e?"eng":undefined)}
  // retardatário na frente (bandeira azul)
  if(ok(A)&&A.lap<me.lap&&(A.prog-me.prog)*me.L<1.2&&!M.blueSaid){M.blueSaid=1;vox("me_traffic",me,{},1)}if(!(ok(A)&&A.lap<me.lap))M.blueSaid=0;
  // silêncio longo: informação do engenheiro ou comentário do piloto (corrida não fica muda)
  if(me.lap>=1&&!R.sc&&R.t-(V.lastT||0)>55&&R.t-(M.idleT||0)>55){M.idleT=R.t;const cn=typeof nextCorner==="function"&&nextCorner(me);const ld=R.order[0];
    if(vrnd()<.55)vox("eng_info",me,{V:me.lap,P:pos(me),L:R.L-me.lap,...(ok(A)&&(A.prog-me.prog)*me.L<20?{A:A.code,G:((A.prog-me.prog)*me.L).toFixed(1).replace(".",",")}:{}),W:Math.round(100-me.tyre.wear*100),T:me.last?fmtT(me.last):undefined},1,"eng");
    else vox("me_chat",me,{C:cn?cn.n:"curva 1"},1)}
  // porta fechada: pediu ataque e não passou (o cérebro desistiu)
  if(me.goReq&&ok(A)){M.goA=A.id;M.goP=pos(me)}else if(M.goA!=null){if(pos(me)>=M.goP&&ok(A)&&A.id===M.goA&&me.st&&me.st.frus>25)vox("me_door",me,{A:A.code},1);M.goA=null}
  // defesa: alguém pediu ataque em você e não passou
  if(ok(B)&&B.goReq&&B.t!==me.t){M.defA=B.id;M.defP=pos(me);M.defT=R.t}else if(M.defA!=null&&R.t-M.defT>4){if(pos(me)<=M.defP&&ok(B)&&B.id===M.defA)vox("me_defend",me,{A:B.code},1);M.defA=null}
  // pneus no fim (uma vez por jogo de pneus)
  if(me.tyre.wear>.68&&M.tyreStint!==me.stops&&!me.pitCall){M.tyreStint=me.stops;vox("me_tyre",me,{},1)}
  // chuva começando
  if(R.w>.18&&!M.rain){M.rain=1;const cn=typeof nextCorner==="function"&&nextCorner(me);vox("me_rain",me,{C:cn?cn.n:"curva"},2)}if(R.w<.08)M.rain=0;
  // safety car
  if(R.sc&&!M.sc){M.sc=1;vox("eng_sc",me,{},2,"eng")}if(!R.sc)M.sc=0;
  // distância para quem está na frente e atrás (a cada ~4 voltas, quando há briga chegando)
  if(me.lap>=2&&R.t>(M.gapT||0)){const gA=ok(A)?(A.prog-me.prog)*me.L:99,gB=ok(B)?(me.prog-B.prog)*me.L:99;const dA=(A&&(A.Ls??A.L))-(me.Ls??me.L),dB=(me.Ls??me.L)-(B&&(B.Ls??B.L));const f=x=>Math.abs(x).toFixed(1).replace(".",",");
    if(ok(A)&&gA>.9&&gA<4&&dA>.15){vox("eng_gapA",me,{A:A.code,G:f(gA),D:f(dA)+" s"},1,"eng");M.gapT=R.t+me.L*4}
    else if(ok(B)&&gB>.6&&gB<2.5&&dB>.15){vox("eng_gapB",me,{A:B.code,G:f(gB),D:f(dB)+" s"},1,"eng");M.gapT=R.t+me.L*4}}
  // última volta
  if(R.L-me.lap===1&&!M.last){M.last=1;const tgt=ok(A)&&(A.prog-me.prog)*me.L<1.5?A:ok(B)?B:A;const g=tgt?Math.abs((tgt.prog-me.prog)*me.L):0;vox("eng_last",me,{A:tgt?tgt.code:"",G:g.toFixed(1).replace(".",","),P:pos(me)},3,"eng")}
  // volta mais rápida e melhor volta pessoal
  if(me.laps.length!==M.nLaps){M.nLaps=me.laps.length;const lt=me.last;if(R.fast&&R.fast.c===me&&R.fast.t===lt&&me.lap>2)vox("eng_fast",me,{T:fmtT(lt)},2,"eng");else if(lt&&lt===me.best&&me.lap>3&&me.laps.length>3)vox("eng_pb",me,{T:fmtT(lt)},1,"eng")}
  // parada no box: tempo parado
  if(me.pit&&me.pit.phase==="out"&&!M.pitSaid){M.pitSaid=1;const s=me.pit.stop||0,nt=me.pit.note||"";if(nt&&s>=4)vox("eng_pitNote",me,{T:s.toFixed(1).replace(".",",")+" s",X:nt},2,"eng");else vox(s<2.8?"eng_pit":"eng_pitBad",me,{T:s.toFixed(1).replace(".",",")+" s"},2,"eng")}if(!me.pit)M.pitSaid=0;
  // punição
  if((me.pen||0)>(M.pen||0)){vox("me_pen",me,{},2)}M.pen=me.pen||0}
