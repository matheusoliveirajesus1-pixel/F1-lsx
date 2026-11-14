// ===================== RÁDIO 2: BANCO GRANDE DE FALAS (corrida e classificação) =====================
// Amplia o voice.js: muito mais falas por situação, situações novas (amarela, azul, limites de pista, investigação,
// dano, bateria, zona de pontos, saída do box...) e um rádio próprio da classificação (volta de saída, setores,
// tráfego, linha de corte, eliminação, pole). Frases já ditas ficam numa memória que atravessa corridas e temporadas
// (G.voxMem), então a mesma fala só volta depois que o banco daquela situação foi usado. Início e fim da fala também
// variam ("Lucas, ...", "Copiado.", "Bora!"). Só apresentação: sorteios visuais (vpick/vrnd), nunca os da física.
// Variáveis: {A} carro, {P} posição, {G} distância, {T} tempo, {M} companheiro, {C} curva, {L} voltas restantes,
// {N} seu primeiro nome, {X} extra, {D} diferença, {V} volta, {W} pneus %, {K} posição do corte, {S} setor, {B} bateria %

(function(){const add=(k,v)=>{const o=VOX[k];if(!o){VOX[k]=v;return}if(Array.isArray(o)){o.push(...v);return}for(const t in v)(o[t]=o[t]||[]).push(...v[t])};const B={
// ======================= CORRIDA: VOCÊ =======================
me_gain:{quente:["Por dentro! Nem viu de onde eu vim, {A}!","Tchau, {A}! Próximo da fila!","Foi na raça! P{P}!","Esse foi bonito, hein? Bora pro próximo!","Mergulhei e ele não fechou! P{P}!","Isso aí! Freei mais tarde que ele!","Passei! Quanto pro próximo? Tô com fome!","Ele dormiu na saída e eu fui! P{P}!","Ganhei! Agora não me segura mais!","Por fora, cara! Por fora! Que manobra!","Mais um! O carro tá voando!","Pega essa, {A}! Volta pro retrovisor!"],
  normal:["Passei o {A} na freada. P{P}.","Posição ganha. O carro está respondendo bem.","Boa. Ultrapassagem limpa no {A}.","Consegui o {A}. Seguimos atacando.","P{P}! Usei bem a bateria na reta.","Ele abriu a porta e eu fui. P{P}.","Pronto, {A} ficou pra trás. Quem é o próximo?","Ultrapassagem feita. O vácuo ajudou muito.","Feito! O modo de ultrapassagem funcionou.","Passei. Vou ver se abro distância agora.","P{P}. Agora é construir uma margem.","Ganhei a posição do {A}. Os pneus aguentam."],
  frio:["Passagem concluída. P{P}.","{A} superado. Ritmo constante.","Posição ganha sem risco.","Feito. Vou estabilizar os pneus antes do próximo.","Ok. P{P}. Qual o ritmo do carro da frente?","Ultrapassagem limpa. Bateria em quanto?","Passei o {A}. Sem desgaste extra.","Posição. Próximo alvo quando os pneus estabilizarem."]},
me_lost:{quente:["Ele passou por cima de mim! Isso é limite?","Que vácuo absurdo! Como ele tem tanta reta?","Me engoliu na reta, que raiva!","Perdi! Tô sem tração nenhuma na saída!","Ele mergulhou do nada! Quase bateu!","Não dá! Esse carro não tem velocidade de reta!","P{P}... que vergonha. Vou buscar de volta!","Ele foi pra cima com tudo e eu não tinha bateria!"],
  normal:["O {A} passou. Ele tinha mais bateria.","Perdi a posição na freada da {C}.","Ele estava mais rápido na reta. P{P}.","O {A} conseguiu. Vou tentar o contra-ataque.","Sem tração na saída, ele aproveitou.","Perdi para o {A}. Quanto ele tem de ritmo?","Fiquei sem energia na hora errada.","Ele me pegou no vácuo. Vou reagir."],
  frio:["{A} passou. Não vou brigar à toa com esses pneus.","Posição perdida. Vou focar no ritmo.","Ele tinha pneus mais novos. Normal.","Ok, perdi o {A}. Quantas voltas até a parada?","Sem resposta na reta. Vou guardar energia.","P{P}. Ele vai ter que parar antes de mim."]},
me_door:{quente:["Ele mudou de linha duas vezes! Isso não pode!","Fechou na freada de novo! Avisem a direção de prova!","Ele vai causar um acidente desse jeito!","Toda vez que eu vou, ele joga o carro!"],normal:["Tentei por dentro, mas ele cobriu bem.","Sem espaço na {C}. Vou tentar na próxima reta.","Ele defende tarde demais, mas está dentro da regra.","Não deu. Ele está forte nas freadas."],frio:["Defesa correta dele. Vou preparar melhor a saída.","Sem abertura. Mudo o ponto de ataque.","Ok. Ele protege o lado de dentro. Vou por fora."]},
me_defend:{quente:["Aqui não, {A}! Volta pra trás!","Pode tentar o dia todo!","Fechei! Ele vai ter que suar!","Sai do meu vácuo, {A}!"],normal:["Segurei de novo. Quanto ele tem de bateria?","Ele tentou na {C}, mas segurei.","Defesa ok. Os pneus estão aguentando.","Consegui manter. Ele está muito perto."],frio:["Posição protegida. Vou gerenciar a energia na reta.","Defesa feita sem gastar pneu.","Ele não tem ritmo para completar. Mantendo."]},
me_contact:{quente:["Ele me acertou na roda! Vejam isso!","Toque forte! Ele mergulhou sem freio!","Batida! Ele tem que ser punido!","Que pancada! Verifiquem a asa!"],normal:["Encostamos na {C}. Me digam se tem dano.","Toque com o {A}. O carro parece puxar um pouco.","Pequena batida. Vejam os dados da asa.","Teve contato. Sinto algo diferente na frente."],frio:["Contato leve. Me passem a leitura de dano.","Toque. Equilíbrio parece igual. Confirmem.","Encostamos. Não sinto diferença por enquanto."]},
me_spin:{quente:["Rodei! A traseira simplesmente foi!","Que vergonha, rodei sozinho!","Perdi tudo na {C}! Que raiva!"],normal:["Rodei na {C}. Voltando com cuidado.","Perdi a traseira na saída. Desculpem.","Rodada. Vou checar os pneus."],frio:["Rodei. Pneus com pontos planos, provavelmente.","Erro na {C}. Retomando o ritmo.","Rodada. Sem impacto. Voltando."]},
me_crash:{quente:["Acabou! Não acredito nisso!","Bati! Joguei tudo fora! Desculpem!","Fim! Que dia horrível!"],normal:["Bati. Estou bem. Desculpem, pessoal.","Acabou a corrida. Estou ok.","Perdi o carro e bati. Desculpem."],frio:["Estou bem. O carro não continua.","Batida. Estou fora. Desculpem a equipe.","Acabou. Vamos entender o que aconteceu."]},
me_tyre:{quente:["Tô deslizando que nem sabão!","Esses pneus viraram pedra!","Sem aderência nenhuma! Me chamem!","A traseira tá dançando em toda saída!"],normal:["A traseira está indo embora.","Granulação na dianteira esquerda.","Perdendo aderência nas curvas rápidas.","Os pneus estão perto do limite."],frio:["Degradação aumentando. Quantas voltas até a janela?","Perco uns três décimos por volta agora.","Pneus caindo. Me deem o delta para o plano."]},
me_rain:{quente:["Tá chovendo forte na {C}! Pista virou rio!","Não enxergo nada no spray!"],normal:["Chuva aumentando na {C}.","Pista molhada no setor 2. Cuidado.","Começou a garoar. Fiquem atentos ao radar."],frio:["Umidade na {C}. Slick ainda funciona.","Garoa leve. Me avisem a previsão."]},
me_lead:{quente:["P1! Ninguém mais na frente!","Liderando! Agora é abrir!"],normal:["Na ponta. Vamos administrar.","Liderança! Me passem o gap."],frio:["P1. Ritmo controlado.","Liderança. Prioridade: pneus."]},
me_chat:{quente:["Esse vento tá me empurrando pra fora na {C}!","O carro tá bom, mas eu quero mais!","Que pista travada, só dá pra passar com bateria!","A torcida tá barulhenta, dá pra ouvir daqui!","Freio dianteiro travando na {C}!","Hoje dá pra brigar lá na frente!","O banco tá mais quente que fogão!","Bora, bora, bora! Sem tirar o pé!","Essas zebras estão arrancando meu dente!"],
  normal:["O carro melhorou com o tanque mais leve.","A {C} está com mais aderência agora.","Sinto um pouco de subesterço na {C}.","Tudo ok com os freios.","O vento mudou de direção, sinto na {C}.","Temperatura do motor normal?","A pista está emborrachando bem.","Estou confortável com esse ritmo.","Um pouco de vibração na reta, nada grave.","As zebras da {C} estão altas, vou evitar.","O equilíbrio melhorou com o diferencial novo."],
  frio:["Ajustei o freio-motor. Ficou melhor.","Vou mudar o balanço de freio um clique para frente.","Estabilidade boa. Mantendo.","Consumo dentro do alvo?","Diferencial em 6 na {C}. Funciona.","Temperaturas estáveis. Sem alertas.","Mantendo o delta. Algum dado novo?","Saída da {C} melhor com menos zebra."]},
me_traffic:{quente:["Mostrem a azul pra ele! Tá me atrapalhando!","Retardatário dormindo na linha!","Esse cara não olha o retrovisor?"],normal:["Retardatário à frente. Perdendo meio segundo.","Tráfego na {C}. Ele vai abrir?","Preso atrás do retardatário."],frio:["Retardatário. Passo na reta.","Tráfego. Vou usar a próxima reta.","Azul mostrada? Ok, aguardando."]},
me_pen:{quente:["Punição por isso? Eu estava na frente!","Os comissários estão de brincadeira!","Não aceito essa punição!"],normal:["Punição... vamos compensar no ritmo.","Que pena. Achei que era corrida normal.","Entendi. Vou abrir espaço para cumprir sem perder posição."],frio:["Entendido. Quanto preciso de margem?","Punição registrada. Ajustamos o plano.","Ok. Vou construir o gap para absorver."]},
me_restart:{quente:["Relargada! Agora eu vou com tudo!","Pneus quentes, bateria cheia, vamos!"],normal:["Pronto pra relargada.","Pneus no ponto. Vamos."],frio:["Relargada. Bateria carregada.","Pneus na janela. Pronto."]},
me_start:{quente:["Que largada! Ganhei {N}!","Passei todo mundo por fora! +{N}!"],normal:["Largada limpa, mais {N}.","Boa largada! Ganhei {N} posições."],frio:["Largada eficiente. +{N}.","+{N} na largada. Sem riscos."]},
me_startBad:{quente:["Fiquei preso no meio da confusão!","Patinei na largada, que raiva!"],normal:["Largada ruim. Patinei.","Perdi {N} na primeira curva."],frio:["Patinamos na largada. Vou recuperar.","-{N}. Plano mantido."]},
me_go:{quente:["Vou pra cima! Ele tá vulnerável!","Agora é minha vez, {A}!","Bateria cheia, vou atacar!"],normal:["Vou atacar o {A} na próxima reta.","Ele está errando na {C}. Vou tentar.","Preparando ataque com bateria cheia."],frio:["Janela de ataque no {A}. Vou na próxima freada.","Ele está com pneu mais gasto. Ataco agora."]},
me_mate:{quente:["Passei o {M}! Agora ele que me siga!"],normal:["Passei o {M}. Tudo limpo."],frio:["Passei o {M}. Sem contato."]},
me_mateLost:{quente:["O {M} me espremeu no muro!"],normal:["O {M} foi melhor nessa."],frio:["{M} passou. Estratégias diferentes."]},
// novas situações (você)
me_ack:{quente:["Copiado!","Entendido, vamos!","Beleza, bora!","Recebido!"],normal:["Copiado.","Entendido.","Ok, recebido.","Certo.","Combinado."],frio:["Copiado.","Recebido.","Ok.","Entendido. Executando."]},
me_dmg:{quente:["O carro tá torto! Algo quebrou!","Perdi pressão aerodinâmica, tá tudo saindo!"],normal:["O carro está puxando para um lado.","Sinto menos carga na frente. Dano?","Algo mudou depois do toque."],frio:["Perda de carga dianteira. Me passem a leitura.","Equilíbrio alterado. Dano confirmado?"]},
me_tl:{quente:["Eu estava dentro! Duas rodas dentro!","Limite de pista? Ele me empurrou pra fora!","Isso é ridículo, a zebra é parte da pista!"],normal:["Fui largo na {C}, desculpem.","Ok, vou cuidar da {C}.","Errei a tangência, saí um pouco."],frio:["Entendido. Vou ajustar a linha na {C}.","Margem menor na saída da {C}. Ok.","Limite anotado. Corrijo."]},
me_inv:{quente:["Investigação? Foi ele que veio pra cima!","Ele que fechou! Mostrem o vídeo!"],normal:["Acho que foi incidente de corrida.","Não tinha para onde ir."],frio:["Os dados vão mostrar que eu estava na minha linha.","Ok. Aguardamos a decisão."]},
me_slowPit:{quente:["Que parada foi essa?!","Perdemos uma eternidade no box!"],normal:["Parada demorada. Vamos recuperar.","Perdi tempo no box, sem problema."],frio:["Parada lenta. Quanto custou?","Ok. Recalcula o plano com esse tempo."]},
me_blueAnnoy:{quente:["Já tô abrindo, calma!","Não tem onde abrir aqui!"],normal:["Vou abrir na reta.","Ok, deixo passar na próxima."],frio:["Abro na saída da {C}.","Entendido. Abro na reta."]},
me_points:{quente:["P{P}! Pontos na raça!","Pontos! Ninguém tira!"],normal:["Pontos pra equipe! P{P}.","Boa! Saímos com pontos."],frio:["P{P}, pontos. Corrida sólida."]},
me_halfway:{quente:["Metade! O carro aguenta, eu aguento!"],normal:["Metade da corrida. Tudo sob controle."],frio:["Metade. Consumo e pneus no plano?"]},
me_heat:{quente:["Tá um forno aqui dentro!","Bebi toda a água, alguém tem mais?"],normal:["Calor forte no cockpit.","Bastante calor hoje, mas tudo ok."],frio:["Temperatura alta no cockpit. Hidratação ok."]},
me_dryLine:{quente:["Já tem linha seca! Slick, slick!"],normal:["A linha está secando rápido.","Já tem trilho seco na {C}."],frio:["Pista secando. Slick em duas voltas?"]},
me_rainHeavy:{quente:["Tá impossível de slick! Box!"],normal:["Pista muito molhada agora.","Não dá mais de slick."],frio:["Aquaplanagem na {C}. Precisamos trocar."]},
// ======================= CORRIDA: ENGENHEIRO =======================
eng_info:["P{P}, {L} voltas para o fim. Tudo nos alvos.","Volta {V}: {T}. Ritmo muito bom, {N}.","Pneus a {W}%. Bem dentro do previsto.","{T} na última. É o ritmo dos líderes.","O {A} está a {G} s. Mantém a pressão.","Faltam {L} voltas. Continua limpo.","Tudo certo do nosso lado. P{P}.","Ótimo trabalho nos pneus: {W}% ainda.","Seu ritmo está estável. Continua assim.","{T}. Esse tempo te coloca entre os mais rápidos agora.","Os carros à frente estão tendo dificuldade com pneu. Paciência.","Temperatura dos freios boa. Pode atacar mais na {C}.","P{P}. A estratégia está funcionando.","Ritmo forte. O carro de trás não consegue acompanhar.","Sem alertas no carro. Foca na pilotagem.","Você ganhou dois décimos no setor 2 nessa volta.","Mantém a gestão da bateria nas retas, está perfeito."],
eng_box:["Box nesta volta, {N}. Pneu {X}.","Vamos parar. Box, box. Pneu {X}.","Agora: box, box. Pneu {X} pronto.","Box nesta volta, confirma? Pneu {X} esperando.","É agora, {N}. Box, box, pneu {X}."],
eng_sc:["Safety car, safety car. Respeita o delta.","Safety car na pista. Mantém a temperatura dos pneus.","Safety car. Fica atento ao delta mínimo.","Safety car acionado. Estamos analisando a parada."],
eng_vsc:["Safety car virtual. Mantém o delta positivo.","VSC, VSC. Respeita o tempo mínimo.","Safety car virtual acionado. Nada de passar ninguém.","VSC. Cuidado com o delta nas retas."],
eng_red:["Bandeira vermelha! Devagar para o pit lane.","Vermelha, {N}. Entra no box com cuidado.","Bandeira vermelha. A corrida foi interrompida. Pit lane."],
eng_yellow:["Amarela na {C}. Tira o pé ali.","Bandeira amarela à frente, na {C}. Cuidado.","Atenção: amarela na {C}, carro parado.","Amarela dupla na {C}! Pronto para parar se precisar."],
eng_blue:["Bandeira azul, {N}. Deixa o {A} passar.","Carro da ponta atrás: {A}. Abre na reta.","Azul para você. Abre para o {A} sem perder muito.","O {A} está te alcançando. Bandeira azul, abre na saída da {C}."],
eng_tl:["Limite de pista na {C}: {X} de 3.","Cuidado com a {C}, {N}. Já são {X} limites de pista.","Mais um limite de pista. {X} de 3, depois é punição.","Volta apagada pela {C}. Contagem: {X}."],
eng_inv:["Incidente com o {A} sob investigação.","Os comissários estão olhando o toque com o {A}.","Atenção: investigação no lance com o {A}. Não faz nada diferente.","Investigação aberta envolvendo você e o {A}."],
eng_decOk:["Sem punição para nós. Foi considerado incidente de corrida.","Decisão: nenhuma ação. Seguimos.","Os comissários não vão punir. Foco total.","Boa notícia: sem penalidade no lance com o {A}."],
eng_decPen:["Recebemos {X}. Vamos compensar.","Os comissários deram {X}. Precisamos de ritmo.","{X} para nós. Constrói vantagem sobre o carro de trás.","Decisão contra a gente: {X}. Bola pra frente."],
eng_otherPen:["O {A} recebeu {X} pelo lance com você.","Punição para o {A}: {X}. Isso pode nos ajudar.","Os comissários puniram o {A} com {X}."],
eng_dmg:["Vemos dano no {X}. O carro vai ficar mais difícil na {C}.","Leitura de dano: {X}. Vamos avaliar a troca.","Dano confirmado no {X}. Cuidado nas curvas rápidas.","Perdemos carga com o dano no {X}. Ajusta o balanço."],
eng_batt:["Bateria baixa, {N}. Recarrega antes de atacar.","Energia em {B}%. Tira um pouco o pé no fim da reta.","Bateria crítica. Recupera na próxima volta.","Pouca energia. Usa a freada da {C} para recarregar."],
eng_half:["Metade da corrida. Tudo nos alvos.","Metade feita, {N}. Os pneus estão melhores que o esperado.","Metade da corrida. P{P}, plano mantido."],
eng_left:["Faltam {L} voltas. É hora de dar tudo.","{L} voltas. Sem erros, {N}.","Faltam {L}. Bateria livre a partir de agora.","{L} voltas para o fim. Traz esse resultado."],
eng_inPoints:["Você está na zona de pontos! P{P}.","Pontos, {N}! P{P}, segura isso.","Entramos no top 10! Vamos defender."],
eng_outPoints:["Caímos para P{P}, fora dos pontos. Ainda dá.","P{P}. Precisamos de mais uma posição para pontuar.","Saímos do top 10. Vamos buscar de volta."],
eng_matePit:["O {M} está parando nesta volta.","Seu companheiro vai para o box agora.","O {M} parou. Você tem pista livre."],
eng_aPit:["O {A} parou! Pista livre, empurra agora!","{A} entrou no box. Duas voltas rápidas, {N}!","O carro da frente parou. Hora de fazer a diferença."],
eng_pitExit:["Saída do box: você volta logo à frente do {A}. Defende!","Você volta atrás do {A}. Pneus novos, ataca!","Pista livre na saída. Aquece os pneus.","Cuidado na saída do box: {A} chegando."],
eng_leadGap:["Vantagem de {G} s para o {A}. Controla.","{G} s de margem. Pode gerenciar os pneus.","O {A} está a {G} s. Está tudo sob controle."],
eng_rainHeavy:["A chuva aumentou. Avaliamos intermediários.","Pista ficando muito molhada. Talvez seja hora.","O radar mostra chuva forte por 15 minutos."],
eng_dry:["Linha seca aparecendo. Pensamos em slicks.","A pista está secando rápido, prepare-se.","Os tempos de slick vão ser melhores logo."],
eng_lapped:["Retardatários à frente. Já mostraram a azul.","Tráfego chegando: {A}. Ele vai abrir.","Retardatário {A} à frente. Cuidado na {C}."],
eng_fastOther:["O {A} fez a volta mais rápida: {T}.","Volta mais rápida para o {A}, {T}. Nosso ritmo é parecido."],
eng_mateFight:["Vocês dois estão brigando limpo. Continuem assim.","Atenção com o {M}. Nada de toque."],
// ======================= CLASSIFICAÇÃO: ENGENHEIRO =======================
q_eng_go:["Pode ir, {N}. Pneus {X} novos. Cuidado com quem está em volta rápida.","Liberado. Saída limpa, pista com pouco tráfego.","Vai, vai! Pista livre na saída.","Liberado. Lembra: aquecer pneu e carregar bateria na saída.","Pode sair. Tem espaço depois do {A}.","Liberado. Pneus {X} novos, a pista está boa agora.","Saída liberada. Procura um buraco no tráfego.","Vai, {N}. Esse é o momento certo."],
q_eng_out:["Volta de saída: aquece os pneus e carrega a bateria.","Saída: gap de 8 segundos para o carro da frente. Mantém.","Pneus ainda frios. Trabalha a temperatura no setor 1.","Bateria em {B}%. Recupera bem na freada da {C}.","Na saída tem um carro em volta rápida atrás. Deixa espaço.","Aquece os pneus traseiros, eles estão abaixo da janela.","Volta de saída tranquila. Quero a bateria cheia na linha.","Atenção à temperatura dos freios. Uma freada forte na {C}.","Espaço à frente bom. Não chega muito perto do {A}.","Tudo pronto. Abre a volta embalado na última curva."],
q_eng_push:["Volta rápida. Vai!","É agora, {N}. Tudo que tiver.","Volta rápida. Bateria cheia, pneus no ponto.","Vai! Pista livre à frente.","Volta rápida! Sem tráfego no setor 1.","Agora é com você. Volta rápida.","Pode abrir! Vai!","Bandeira verde na volta. Ataca."],
q_eng_sec:["Primeiro setor: {D}.","Setor {S}: {D} para a pole.","{D} até aqui. Continua.","Setor {S} roxo! Continua!","Até o setor {S}: {D}. Segura o resto.","{D} no setor {S}. O último setor é o seu forte."],
q_eng_lapGood:["{T}! P{P}, a {D} do {A}.","{T}, P{P}. Boa volta, {N}.","P{P} com {T}. Bom trabalho.","{T}. Você está em P{P}, {D} da ponta.","Boa! {T}, P{P}.","{T}. P{P}. Esse tempo é forte."],
q_eng_lapPole:["{T}! P1! Você está na ponta!","P1, {N}! {T}! Que volta!","{T}, provisoriamente na pole!","Primeiro lugar! {T}! Fantástico!"],
q_eng_lapNo:["{T}, não melhorou. {X} continua valendo.","Volta mais lenta: {T}. O melhor segue {X}.","{T}. Perdemos tempo no setor 2. Melhor continua {X}.","Sem melhora: {T}. Vamos de novo."],
q_eng_lapDel:["Volta apagada: {T} não vale. {X}.","Perdemos a volta: {X}. {T} não conta.","Volta deletada pelos comissários: {X}.","Não vale, {N}. {X}. Temos que ir de novo."],
q_eng_safe:["Você está dentro do corte: P{P}, o corte é P{K}.","P{P}, seguro por enquanto. O corte é P{K}.","Dentro! P{P}. Margem para o P{K}: {D}.","Estamos em P{P}, dentro da zona de classificação."],
q_eng_danger:["Fora do corte: P{P}. Precisamos de P{K}.","P{P}. Estamos na zona de eliminação.","Atenção: P{P}, fora do corte. Precisamos de {D}.","Caímos para a zona de eliminação. Temos mais uma saída."],
q_eng_drop:["O {A} melhorou. Você caiu para P{P}.","Mais um à frente: {A}. Agora você é P{P}.","Caímos para P{P}. O {A} fez {T}.","O {A} passou o seu tempo. P{P}."],
q_eng_flag:["Bandeira quadriculada. Esta é a última volta.","Quadriculada! Fecha a volta, é a última chance.","A sessão acabou. A sua volta ainda vale, vai!","Bandeira caiu. Só esta volta, tudo ou nada."],
q_eng_flagIn:["Bandeira antes de abrirmos a volta. Box.","Não deu tempo. Volta para o box.","Quadriculada antes da linha. Acabou para nós nesta sessão."],
q_eng_red:["Bandeira vermelha! Volta abortada, devagar para o box.","Vermelha, {N}. A volta não vale. Box.","Sessão interrompida. Volta para o box com calma.","Vermelha. Relógio parado. Box, box."],
q_eng_redGo:["Sessão vai recomeçar. Preparamos você para sair.","Bandeira verde em breve. Fica pronto.","Retomada confirmada. Planejamos uma saída."],
q_eng_through:["Passamos para o Q{X}! P{P}.","Estamos no Q{X}! Grande trabalho.","Classificados para o Q{X}. P{P} nesta sessão.","Q{X} garantido. Vamos com tudo."],
q_eng_elim:["Eliminados no Q{X}. P{P}. Faltaram {D}.","Acabou no Q{X}: P{P}. Vamos analisar.","Ficamos fora no Q{X}. P{P}, muito perto.","P{P}. Não foi suficiente para passar. Desculpa, {N}."],
q_eng_final:["P{P} no grid. {D} da pole.","Fechamos em P{P}. Boa base para amanhã.","P{P}. Largamos daí e vamos pra cima.","Classificação terminada: P{P}."],
q_eng_poleWin:["POLE POSITION! POLE POSITION, {N}!","É POLE! Que volta! Inacreditável!","POLE! Primeiro lugar no grid! Vocês são incríveis!"],
q_eng_letBy:["Carro em volta rápida atrás. Abre agora!","{A} vem rápido atrás. Sai da linha!","Atenção: {A} em volta rápida. Deixa passar.","Carro chegando: {A}. Não atrapalha, vira punição."],
q_eng_impeded:["O {A} te atrapalhou. Vamos reportar aos comissários.","Tráfego com o {A}. Perdemos tempo ali.","O {A} estava na linha. Os comissários vão olhar.","Foi o {A}. Já avisamos a direção de prova."],
q_eng_garage:["Bom trabalho. Trocamos pneus e saímos de novo em breve.","Na garagem. Dados mostram ganho no setor 3.","Voltamos. Próxima saída com {X} para o fim.","Pneus novos prontos. Esperamos a pista melhorar."],
q_eng_clock:["Faltam {X} no relógio. Todo mundo vai para a pista agora.","{X} no relógio. Vamos sair na hora certa.","{X} para o fim. A pista está no melhor momento."],
// ======================= CLASSIFICAÇÃO: VOCÊ =======================
q_me_out:{quente:["Pneus frios ainda, mas tô pronto!","Vamos arrancar uma volta daquelas!","Carro pronto, cabeça pronta!","Bateria cheia? Então vai!"],normal:["Pneus esquentando bem.","Saída ok. A pista parece boa.","Tudo pronto pra volta rápida.","Freios no ponto."],frio:["Temperatura dos pneus subindo. Bateria?","Gap para o carro da frente ok?","Setor 1 com vento de frente. Anotado.","Pronto. Pneus na janela na próxima curva."]},
q_me_traffic:{quente:["Tem um carro lento bem na minha linha!","Sai daí! Volta rápida aqui!","Tráfego! Não acredito!"],normal:["Carro lento à frente. Vai atrapalhar.","Tráfego na {C}.","Tem alguém em volta de saída na frente."],frio:["Tráfego à frente. Vou perder um pouco.","Carro lento na {C}. Aviso dado?"]},
q_me_good:{quente:["Que volta! Que volta!","Isso! O carro tava nos trilhos!","Voei nessa! Bora!","Volta perfeita, cara!"],normal:["Volta boa, limpa do começo ao fim.","Gostei dessa. Senti o carro bem.","Volta forte. Dá pra melhorar o setor 2.","Boa volta. Pista melhorando."],frio:["Volta limpa. Ganho possível na {C}.","Execução boa. Dados para a próxima?","Volta sólida. Pequeno erro na saída da {C}."]},
q_me_meh:{quente:["Errei na {C}, joguei tempo fora!","Não foi boa, o carro escorregou!","Que volta ruim, perdi tudo no fim!"],normal:["Errei um pouco na {C}.","Não foi a melhor. Muito subesterço.","Faltou aderência no setor 2."],frio:["Volta abaixo do potencial. Perdi na {C}.","Temperatura do pneu traseiro baixa. Ajuste?"]},
q_me_del:{quente:["Apagaram? Eu estava dentro!","Por um centímetro? Sério?"],normal:["Fui largo. Culpa minha.","Errei a saída da {C}. Desculpem."],frio:["Ok, limite na {C}. Vou ajustar.","Entendido. Margem maior na próxima."]},
q_me_impeded:{quente:["Ele estava parado na linha! Punição pra ele!","Me atrapalhou de propósito!","Quem deixou esse carro na minha frente?"],normal:["Fui atrapalhado na {C}.","O carro lento não abriu a tempo.","Perdi a volta por causa de tráfego."],frio:["Tráfego custou uns três décimos.","Bloqueio na {C}. Reportem, por favor."]},
q_me_through:{quente:["Passamos! Agora é pra cima!","Bora pro próximo! Ninguém segura!"],normal:["Passamos! Bom trabalho, pessoal.","Próxima sessão! Vamos melhorar."],frio:["Passamos. Ajustes para a próxima?","Ok. Foco na próxima sessão."]},
q_me_elim:{quente:["Não acredito! Ficamos fora!","Que raiva! Tinha mais no carro!"],normal:["Que pena. Tinha um pouco mais.","Ficamos fora. Vamos pensar na corrida."],frio:["Eliminados. Precisamos entender o setor 2.","Ok. Vamos trabalhar a estratégia de corrida."]},
q_me_pole:{quente:["POLE! POLE! QUE VOLTA, GALERA!","SIIIM! A POLE É NOSSA!"],normal:["Pole! Obrigado, equipe! Que carro!","Pole position! Sensacional, pessoal!"],frio:["Pole. Volta muito limpa. Obrigado a todos.","Pole. Bom trabalho de todos."]},
q_me_front:{quente:["Primeira fila! Amanhã eu passo na largada!","Tá bom, mas eu queria a pole!"],normal:["Boa posição para amanhã.","Largamos bem, vamos pra cima."],frio:["Posição boa. Estratégia de corrida definida?","Ok. Grid bom para a corrida."]},
q_me_ack:{quente:["Bora!","Valeu, vamos!","Fechou!"],normal:["Copiado.","Entendido.","Ok."],frio:["Copiado.","Recebido.","Ok."]}};
for(const k in B)add(k,B[k])})();

// ---------- início e fim de fala (multiplica as combinações sem perder o sentido)
const VOXDECO={eng:{pre:["{N}, ","Ok, {N}. ","{N}, escuta. ","Informação: "],post:[" Foco."," Concentração."," Vamos."]},
  quente:{pre:["Cara, ","Pô, ","Olha só: ","Gente, "],post:[" Vamos!"," Bora!"," Foco!"," Que isso!"]},
  normal:{pre:["Olha, ","Então, ","Pessoal, "],post:[" Vamos lá."," Seguimos."," Tudo certo."]},
  frio:{pre:["Ok. ","Certo. "],post:[" Seguimos."]}};
const VOX_NODECO={me_win:1,me_podium:1,me_crash:1,eng_fin_win:1,eng_fin_pod:1,eng_red:1,q_eng_poleWin:1,q_me_pole:1,me_ack:1,q_me_ack:1,eng_box:1};
let VOXK="",VOXW="";
function voxHash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return(h>>>0).toString(36)}
function voxMem(){if(!G)return null;if(!G.voxMem)G.voxMem=[];if(!voxMem._s||voxMem._g!==G.voxMem){voxMem._s=new Set(G.voxMem);voxMem._g=G.voxMem}return voxMem._s}
function voxMemAdd(s){const m=voxMem();if(!m)return;const h=voxHash(s);if(m.has(h))return;G.voxMem.push(h);m.add(h);if(G.voxMem.length>900){const x=G.voxMem.shift();m.delete(x)}}
// troca a escolha de frase: prefere o que nunca foi dito (nesta corrida e nas anteriores), depois o que não foi dito nesta corrida
globalThis.voxLine=function(list,c,v){const tmp=voxTemper(c);const arr=Array.isArray(list)?list:list[tmp]||list.normal;const used=R.vox.used;const mem=voxMem();
  const has=x=>!(x.match(/\{(\w)\}/g)||[]).some(m=>v[m[1]]==null);const ok=arr.filter(has);if(!ok.length)return null;
  let pool=ok.filter(x=>!used[x]&&!(mem&&mem.has(voxHash(x))));if(!pool.length){if(mem)ok.forEach(x=>{const h=voxHash(x);if(mem.has(h)){mem.delete(h);const i=G.voxMem.indexOf(h);if(i>=0)G.voxMem.splice(i,1)}})/* banco esgotado: recomeça o ciclo dessa situação */;pool=ok.filter(x=>!used[x])}
  if(!pool.length){if(v.__once)return null;pool=ok}
  const s=vpick(pool);used[s]=1;voxMemAdd(s);
  const me=R.cars.find(x=>x.isP);const N=me?me.d.n.split(" ")[0]:"";const vv=Object.assign({N},v);
  let out=s.replace(/\{(\w)\}/g,(m,k)=>vv[k]!=null?String(vv[k]):m);
  if(!VOX_NODECO[VOXK]&&vrnd()<.32){const D=VOXW==="eng"?VOXDECO.eng:VOXW==="mate"?null:VOXDECO[tmp]||VOXDECO.normal;if(D){
    if(vrnd()<.6&&!/^[A-Z]{3}\b/.test(out)&&!/^(Ok|Certo|Copiado|Entendido|Recebido|Atenção|Informação|Cuidado|Olha|Então|Cara|Pô|Gente|Pessoal)\b/i.test(out)){const p=vpick(D.pre).replace("{N}",N);if(!out.startsWith(N)){const low=/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]/.test(out)&&p.endsWith(", ");out=p+(low?out[0].toLowerCase()+out.slice(1):out)}}
    else if(/[.!]$/.test(out)){out=out+vpick(D.post)}}}
  return out};
(function(){const base=vox;globalThis.vox=function(kind,c,v,pri,who){
  if(kind==="eng_sc"&&R&&R.sc&&R.sc.type==="vsc")kind="eng_vsc";VOXK=kind;VOXW=who||"me";try{return base(kind,c,v,pri,who)}finally{VOXK="";VOXW=""}}})();

// ---------- novas situações da corrida (o voxTick original continua; aqui só o que ele não cobria)
(function(){const base=voxTick;globalThis.voxTick=function(){if(R&&R.qMode&&R.vox&&R.started){try{qVoxTick()}catch(e){}return}base();try{voxTick2()}catch(e){}}})();
function voxTick2(){if(!R||!R.vox||!R.started||R.over)return;const me=R.cars.find(c=>c.isP);if(!me||!running(me))return;const M=R.vox.meta;if(R.t<(M.tk2||0))return;M.tk2=R.t+.5;
  const cn=(x)=>{const k=typeof nextCorner==="function"&&nextCorner(x||me);return k?k.n:"próxima curva"};const L=R.geo.len;const p=pos(me);
  const i=R.order.indexOf(me),A=R.order[i-1],Bc=R.order[i+1];const ok=x=>x&&running(x)&&!x.pit;
  // bandeira vermelha
  if(R.red&&!M.red){M.red=1;vox("eng_red",me,{},3,"eng")}if(!R.red)M.red=0;
  // amarela à frente (até 700 m)
  if(!R.sc&&!R.red&&R.yellows){M.ySaid=M.ySaid||{};for(const y of R.yellows){if(y.until<=R.t)continue;const key=(y.t0||y.until).toFixed(1);if(M.ySaid[key])continue;const d=fr(y.a-fr(me.prog))*L;if(d>40&&d<700){M.ySaid[key]=1;vox("eng_yellow",me,{C:cn()},2,"eng");break}}}
  // bandeira azul em você
  if(me.blue&&!M.blueMe&&R.t-(M.blueT||-99)>45){M.blueMe=R.t;M.blueT=R.t;const o=R.cars.filter(x=>ok(x)&&x.lap>me.lap&&fr(me.prog-x.prog)*L<300).sort((a,b)=>fr(me.prog-a.prog)-fr(me.prog-b.prog))[0];vox("eng_blue",me,{A:o?o.code:undefined,C:cn()},2,"eng");if(vrnd()<.4)setTimeout(()=>{if(R&&R.vox)vox("me_blueAnnoy",me,{C:cn()},1)},2400)}if(!me.blue)M.blueMe=0;
  // limites de pista
  if((me.tl||0)>(M.tl||0)){M.tl=me.tl;if(me.tl<=3){vox("eng_tl",me,{X:me.tl,C:cn()},2,"eng");if(vrnd()<.45)setTimeout(()=>{if(R&&R.vox)vox("me_tl",me,{C:cn()},1)},2600)}}
  // investigação aberta envolvendo você
  if(R.stewQ){M.invSaid=M.invSaid||{};for(const s of R.stewQ){if(s.kind!=="contact"&&s.kind!=="forced"&&s.kind!=="adv")continue;if(s.cul!==me.id&&s.vic!==me.id)continue;const key=(s.t0||s.at).toFixed(1);if(M.invSaid[key])continue;M.invSaid[key]=1;const o=R.cars.find(x=>x.id===(s.cul===me.id?s.vic:s.cul));vox("eng_inv",me,{A:o?o.code:"outro carro"},2,"eng");if(s.cul===me.id&&vrnd()<.6)setTimeout(()=>{if(R&&R.vox)vox("me_inv",me,{},1)},2800)}}
  // dano novo
  {const d=me.dmg||{};const tot=(d.wing||0)+(d.rwing||0)+(d.floor||0)+(d.susp||0);if(tot>(M.dmgT||0)+.18){const part=(d.wing||0)>=Math.max(d.rwing||0,d.floor||0,d.susp||0)?"bico e asa dianteira":(d.floor||0)>=Math.max(d.rwing||0,d.susp||0)?"assoalho":(d.rwing||0)>=(d.susp||0)?"asa traseira":"suspensão";vox("eng_dmg",me,{X:part,C:cn()},2,"eng");if(vrnd()<.5)setTimeout(()=>{if(R&&R.vox)vox("me_dmg",me,{},1)},2600)}M.dmgT=Math.max(M.dmgT||0,tot)}
  // bateria
  if(me.batt<10&&!M.battLow&&!R.sc){M.battLow=1;vox("eng_batt",me,{B:Math.round(me.batt),C:cn()},1,"eng")}if(me.batt>40)M.battLow=0;
  // metade e voltas finais
  const left=R.L-me.lap;if(R.L>=10&&me.lap===Math.round(R.L/2)&&!M.half){M.half=1;vrnd()<.6?vox("eng_half",me,{P:p},1,"eng"):vox("me_halfway",me,{},1)}
  if((left===10||left===5)&&M.leftSaid!==left&&R.L>15){M.leftSaid=left;vox("eng_left",me,{L:left},2,"eng")}
  // zona de pontos
  if(M.pp==null)M.pp=p;if(me.lap>=1&&!me.pit){if(p<=10&&M.pp>10)vox("eng_inPoints",me,{P:p},2,"eng");else if(p>10&&M.pp<=10)vox("eng_outPoints",me,{P:p},2,"eng")}if(!me.pit)M.pp=p;
  // companheiro e carro da frente no box
  const mt=R.cars.find(c=>c!==me&&c.t===me.t);if(mt&&running(mt)&&mt.pit&&mt.pit.phase==="in"&&!M.matePit){M.matePit=1;vox("eng_matePit",me,{M:mt.code},1,"eng")}if(mt&&!mt.pit)M.matePit=0;
  if(A&&running(A)&&A.pit&&A.pit.phase==="in"&&M.aPit!==A.id&&!me.pit&&!R.sc){M.aPit=A.id;vox("eng_aPit",me,{A:A.code},2,"eng")}
  // saída do box: quem está perto
  if(me.pitExit&&R.t-me.pitExit<1.2&&M.pexT!==me.pitExit){M.pexT=me.pitExit;const near=R.cars.filter(x=>ok(x)&&x!==me).map(x=>({x,d:(fr(x.prog-me.prog+.5)-.5)*L})).filter(o=>Math.abs(o.d)<250).sort((a,b)=>Math.abs(a.d)-Math.abs(b.d))[0];vox("eng_pitExit",me,near?{A:near.x.code}:{},2,"eng")}
  // líder: vantagem (a cada ~8 voltas)
  if(p===1&&ok(Bc)&&me.lap>=3&&R.t>(M.ldT||0)){M.ldT=R.t+me.L*8;const g=(me.prog-Bc.prog)*(me.L||90);if(g>1.5)vox("eng_leadGap",me,{A:Bc.code,G:g.toFixed(1).replace(".",",")},1,"eng")}
  // chuva aumentando ou pista secando
  const slick=["S","M","H"].includes(me.tyre.c);if(R.w>.5&&slick&&!M.rainH){M.rainH=1;vox("eng_rainHeavy",me,{},2,"eng");setTimeout(()=>{if(R&&R.vox)vox("me_rainHeavy",me,{C:cn()},1)},2600)}if(R.w<.3)M.rainH=0;
  if(R.w<.18&&!slick&&!M.dry&&me.lap>2){M.dry=1;vrnd()<.5?vox("eng_dry",me,{},2,"eng"):vox("me_dryLine",me,{C:cn()},2)}if(R.w>.35)M.dry=0;
  // retardatário à frente: o engenheiro avisa antes
  if(ok(A)&&A.lap<me.lap&&fr(A.prog-me.prog)*L<400&&M.lapA!==A.id){M.lapA=A.id;if(vrnd()<.5)vox("eng_lapped",me,{A:A.code,C:cn()},1,"eng")}
  // volta mais rápida de outro piloto
  if(R.fast&&R.fast.c&&R.fast.c!==me&&M.fastC!==R.fast.t&&me.lap>3){M.fastC=R.fast.t;if(vrnd()<.35)vox("eng_fastOther",me,{A:R.fast.c.code,T:fmtT(R.fast.t)},1,"eng")}
  // calor
  if(!M.heat&&me.lap>5&&(R.C&&R.C.hot||(R.temp||0)>30)&&vrnd()<.004){M.heat=1;vox("me_heat",me,{},1)}}
// confirmação do piloto quando o engenheiro chama para o box
(function(){const base=vox;globalThis.vox=function(kind,c,v,pri,who){const r=base(kind,c,v,pri,who);if(kind==="eng_box"&&c&&c.isP&&vrnd()<.55)setTimeout(()=>{if(R&&R.vox)base("me_ack",c,{},3)},2200);if((kind==="eng_pitBad"||kind==="eng_pitNote")&&c&&c.isP&&vrnd()<.5)setTimeout(()=>{if(R&&R.vox)base("me_slowPit",c,{},2)},2600);return r}})();
// decisões dos comissários que envolvem você
(function(){if(typeof stewReport!=="function")return;const base=stewReport;globalThis.stewReport=function(c,verdict,why,ev){const r=base(c,verdict,why,ev);try{if(!R||!R.vox||R.qMode)return r;const me=R.cars.find(x=>x.isP);if(!me)return r;
  const pen=!/sem punição|nenhuma/i.test(verdict||"");if(c===me){vox(pen?"eng_decPen":"eng_decOk",me,{X:verdict,A:undefined},2,"eng")}
  else if(pen&&R.stewQ!==undefined&&ev&&new RegExp(me.code).test(String(ev)+String(why)))vox("eng_otherPen",me,{A:c.code,X:verdict},2,"eng")}catch(e){}return r}})();

// ======================= RÁDIO DA CLASSIFICAÇÃO =======================
// Substitui as mensagens fixas do quali.js por falas do banco (vão para o cartão SEU RÁDIO, com voz)
function qSay(kind,c,v,pri,who){if(!R||!R.vox||!c)return;vox(kind,c,v||{},pri||3,who||(kind.startsWith("q_me")?undefined:"eng"))}
function qVoxTick(){const me=R.cars.find(c=>c.isP);if(!me||!me.q||!running(me))return;const M=R.vox.meta,Q=R.qMode;if(R.t<(M.qtk||0))return;M.qtk=R.t+.5;voxFlush();
  const cn=()=>{const k=typeof nextCorner==="function"&&nextCorner(me);return k?k.n:"curva 1"};const L=R.geo.len;const st=me.q.st;
  // volta de saída: instrução do engenheiro e comentário do piloto
  if(st==="out"&&M.qOut!==me.q.runs){M.qOut=me.q.runs;const a=R.cars.filter(x=>running(x)&&!x.pit&&x!==me).map(x=>({x,d:fr(x.prog-me.prog)*L})).filter(o=>o.d<500).sort((p,q)=>p.d-q.d)[0];
    setTimeout(()=>{if(R&&R.vox&&me.q.st==="out")vox("q_eng_out",me,{A:a?a.x.code:undefined,B:Math.round(me.batt),C:cn()},2,"eng")},3500);setTimeout(()=>{if(R&&R.vox&&me.q.st==="out"&&vrnd()<.6)vox("q_me_out",me,{C:cn()},1)},11000)}
  // tráfego à frente na volta rápida
  if(st==="push"){const a=R.cars.find(x=>running(x)&&!x.pit&&x!==me&&x.q&&x.q.st!=="push"&&fr(x.prog-me.prog)*L<180&&fr(x.prog-me.prog)*L>20);if(a&&M.qTr!==me.q.runs*10+me.q.push){M.qTr=me.q.runs*10+me.q.push;M.qImp=a.code;vox("q_me_traffic",me,{C:cn()},2)}}
  // carro em volta rápida atrás de você (você precisa abrir)
  if(me.blue&&st!=="push"&&!M.qBlue&&R.t-(M.qBlueT||-99)>30){M.qBlue=1;M.qBlueT=R.t;const o=R.cars.filter(x=>running(x)&&!x.pit&&x.q&&x.q.st==="push"&&fr(me.prog-x.prog)*L<220).sort((p,q)=>fr(me.prog-p.prog)-fr(me.prog-q.prog))[0];vox("q_eng_letBy",me,{A:o?o.code:undefined},3,"eng")}if(!me.blue)M.qBlue=0;
  // posição caindo enquanto você está na garagem
  if(Q.phase==="run"&&Q.pool.includes(me.d.id)){const p=qPosOf(me);if(M.qPos==null||!p)M.qPos=p;else if(p>M.qPos&&st!=="push"){const o=qOrder();const by=o[p-2];M.qPos=p;const cut=QKEEP[Q.sess];
      if(cut&&p>cut&&M.qDang!==Q.sess*100+p){M.qDang=Q.sess*100+p;const tk=qTime(o[cut-1]),tm=qTime(me);vox("q_eng_danger",me,{P:p,K:cut,D:tk!=null&&tm!=null?`${(tm-tk).toFixed(3).replace(".",",")} s`:undefined},2,"eng")}
      else if(by&&by!==me&&vrnd()<.7)vox("q_eng_drop",me,{A:by.code,P:p,T:qTime(by)!=null?fmtT(qTime(by)):undefined},1,"eng")}else if(p<M.qPos)M.qPos=p}
  // relógio: avisos de tempo com o jogador na garagem
  if(Q.phase==="run"&&st==="gar"&&Q.pool.includes(me.d.id)){for(const s of[300,180]){if(Q.clock<s&&Q.clock>s-30&&M.qClk!==Q.sess*1000+s){M.qClk=Q.sess*1000+s;vox("q_eng_clock",me,{X:qClock(s)},1,"eng")}}}
  // de volta à garagem depois de uma saída
  if(st==="gar"&&M.qGar!==me.q.runs&&me.q.runs>0&&Q.phase==="run"){M.qGar=me.q.runs;if(vrnd()<.55)setTimeout(()=>{if(R&&R.vox&&me.q.st==="gar")vox("q_eng_garage",me,{X:COMP[qComp()].n.toLowerCase()+"s novos"},1,"eng")},4000)}}
// setores da volta rápida: o engenheiro fala uma vez por volta (como na TV, sem encher o rádio)
(function(){const base=secMark;globalThis.secMark=function(c,k,tc){base(c,k,tc);try{if(R&&R.qMode&&c.q&&k<=1){(c._qsec=c._qsec||[])[k]=tc-c.lapStart}if(!R||!R.qMode||!c.isP||!c.q||c.q.st!=="push"||k>1||!R.vox)return;const M=R.vox.meta;const key=c.q.runs*10+c.q.push;if(M.qSec===key||vrnd()<.45)return;
  const ref=qRefSplits();const cum=tc-c.lapStart;M.qSec=key;
  const purple=R.secBest[k]&&R.secBest[k].id===c.id&&Math.abs(R.secBest[k].t-c.secCur[k])<1e-6;
  if(purple&&vrnd()<.5){vox("q_eng_sec",c,{S:k+1,D:"roxo"},2,"eng");return}
  if(!ref)return;const d=cum-ref[k];vox("q_eng_sec",c,{S:k+1,D:(d<0?"−":"+")+Math.abs(d).toFixed(3).replace(".",",")},2,"eng")}catch(e){}}})();
// parciais da volta de referência (a melhor da sessão), guardadas pelo qLapDone
function qRefSplits(){const Q=R.qMode;if(!Q||!Q.splits)return null;const o=qOrder();const lead=o.find(x=>qTime(x)!=null);return lead?Q.splits[lead.d.id+"_"+Q.sess]||null:null}
(function(){const base=qLapDone;globalThis.qLapDone=function(c,lt,del){const Q=R.qMode,key="q"+Q.sess;const r=Q.res[c.d.id]||{};const prev=r[key];const ord0=qOrder();const p0=ord0.indexOf(c)+1;const hadT=prev!=null;
  // guarda as parciais desta volta (para o cronômetro na tela e para o engenheiro comparar)
  if(!del&&(prev==null||lt<prev)){Q.splits=Q.splits||{};const s=c._qsLast;Q.splits[c.d.id+"_"+Q.sess]=s&&s[0]>0&&s[1]>s[0]&&s[1]<lt?[s[0],s[1],lt]:null}
  // o quali.js manda rádio fixo para o jogador; aqui ele é silenciado e substituído pelas falas do banco
  const rd=globalThis.radio;if(c.isP)globalThis.radio=function(){};try{base(c,lt,del)}finally{globalThis.radio=rd}
  if(typeof tvQLap==="function")tvQLap(c,lt,del,prev);
  if(!c.isP)return;const eng="eng",cnm=(()=>{const k=typeof nextCorner==="function"&&nextCorner(c);return k?k.n:"curva 1"})();
  if(del){const why=c.qDelWhyLast||"limite de pista";qSay("q_eng_lapDel",c,{T:fmtT(lt),X:why});setTimeout(()=>{if(R&&R.vox)vox("q_me_del",c,{C:cnm},2)},2600);return}
  const now=Q.res[c.d.id]&&Q.res[c.d.id][key];if(hadT&&lt>=prev){qSay("q_eng_lapNo",c,{T:fmtT(lt),X:fmtT(prev)});if(M_imp(c))qSay("q_eng_impeded",c,{A:M_imp(c)},2);else setTimeout(()=>{if(R&&R.vox)vox("q_me_meh",c,{C:cnm},2)},2600);return}
  const o=qOrder(),p=o.indexOf(c)+1,lead=o[0],t0=qTime(lead);const cut=QKEEP[Q.sess];
  if(p===1)qSay("q_eng_lapPole",c,{T:fmtT(lt)});else qSay("q_eng_lapGood",c,{T:fmtT(lt),P:p,A:lead.code,D:`${(lt-t0).toFixed(3).replace(".",",")} s`});
  if(cut){setTimeout(()=>{if(!R||!R.vox)return;const o2=qOrder(),p2=o2.indexOf(c)+1;const tk=qTime(o2[cut-1]),tc=qTime(o2[cut]);if(p2<=cut)vox("q_eng_safe",c,{P:p2,K:cut,D:tc!=null?`${(tc-lt).toFixed(3).replace(".",",")} s`:undefined},2,eng);else vox("q_eng_danger",c,{P:p2,K:cut,D:tk!=null?`${(lt-tk).toFixed(3).replace(".",",")} s`:undefined},2,eng)},5200)}
  setTimeout(()=>{if(R&&R.vox)vox(M_imp(c)?"q_me_impeded":"q_me_good",c,{C:cnm},1)},2600)}})();
function M_imp(c){const M=R.vox&&R.vox.meta;if(!M||!M.qImp)return null;const a=M.qImp;M.qImp=null;return a}
// mensagens fixas restantes do quali.js (saída, volta rápida, bandeira, vermelha, fim de sessão) → banco
(function(){const base=qRelease;globalThis.qRelease=function(c){const rd=globalThis.radio;if(c&&c.isP)globalThis.radio=function(){};try{base(c)}finally{globalThis.radio=rd}
  if(c&&c.isP&&c.q.st==="pitout"){const a=R.cars.filter(x=>running(x)&&!x.pit&&x!==c).sort((p,q)=>fr(p.prog-R.pitLane.fx)-fr(q.prog-R.pitLane.fx))[0];qSay("q_eng_go",c,{X:COMP[(c.pit&&c.pit.comp)||"S"].n.toLowerCase()+"s",A:a?a.code:undefined})}}})();
(function(){const base=onLap;globalThis.onLap=function(c){if(R&&R.qMode&&c.q&&!c.pit){c._qsLast=c._qsec&&c._qsec.length===2?c._qsec.slice():null;c._qsec=[]}if(!R||!R.qMode||!c.isP||!c.q)return base(c);const st0=c.q.st,fl=R.qMode.flag;c.qDelWhyLast=c.qDelWhy||null;const rd=globalThis.radio;globalThis.radio=function(m,t,o){if(/Box\."|Volta rápida|Bandeira quadriculada/.test(t||""))return;return rd(m,t,o)};try{base(c)}finally{globalThis.radio=rd}
  if(st0==="out"&&c.q.st==="push")qSay(fl?"q_eng_flag":"q_eng_push",c,{});else if(st0==="out"&&c.q.st==="in")qSay("q_eng_flagIn",c,{});
  else if(st0==="push"&&c.q.st==="push"&&R.qMode.flag)qSay("q_eng_flag",c,{})}})();
(function(){const base=qRedFlag;globalThis.qRedFlag=function(why){const Q=R.qMode;const was=!!Q.red;const rd=globalThis.radio;globalThis.radio=function(m,t,o){if(m&&m.isP)return;return rd(m,t,o)};try{base(why)}finally{globalThis.radio=rd}
  const me=R.cars.find(c=>c.isP&&running(c));if(!was&&Q.red&&me&&Q.pool.includes(me.d.id))qSay("q_eng_red",me,{})}})();
(function(){const base=qEndSession;globalThis.qEndSession=function(){const Q=R.qMode,n=Q.sess;const me=R.cars.find(c=>c.isP);const inPool=me&&Q.pool.includes(me.d.id);const pool0=Q.pool.slice();const rd=globalThis.radio;globalThis.radio=function(m,t,o){if(m&&m.isP)return;return rd(m,t,o)};try{base()}finally{globalThis.radio=rd}
  if(!me||!inPool)return;const key="q"+n;const tm=x=>{const r=Q.res[x.d.id];return r&&r[key]!=null?r[key]:999};const sorted=pool0.map(id=>R.cars.find(x=>x.d.id===id)).filter(Boolean).sort((a,b)=>tm(a)-tm(b));const p=sorted.indexOf(me)+1;const keep=QKEEP[n];
  if(keep){if(Q.pool.includes(me.d.id)){qSay("q_eng_through",me,{X:n+1,P:p});setTimeout(()=>{if(R&&R.vox)vox("q_me_through",me,{},2)},2800)}
    else{const cutT=tm(sorted[keep-1]);qSay("q_eng_elim",me,{X:n,P:p,D:tm(me)<999?`${(tm(me)-cutT).toFixed(3).replace(".",",")} s`:"um tempo válido"});setTimeout(()=>{if(R&&R.vox)vox("q_me_elim",me,{},2)},2800)}}
  else{if(p===1){qSay("q_eng_poleWin",me,{});setTimeout(()=>{if(R&&R.vox)vox("q_me_pole",me,{},3)},2600)}else{qSay("q_eng_final",me,{P:p,D:tm(me)<999?`${(tm(me)-tm(sorted[0])).toFixed(3).replace(".",",")} s`:"sem tempo"});if(p<=3)setTimeout(()=>{if(R&&R.vox)vox("q_me_front",me,{},2)},2600)}}}})();
// confirmação do piloto às perguntas do engenheiro na classificação
(function(){const base=answerAskObj;globalThis.answerAskObj=function(a,k,auto){const r=base(a,k,auto);try{if(a&&a.cb&&a.c&&a.c.isP&&!auto&&R&&R.vox&&vrnd()<.5)setTimeout(()=>{if(R&&R.vox)vox("q_me_ack",a.c,{},1)},1600)}catch(e){}return r}})();
