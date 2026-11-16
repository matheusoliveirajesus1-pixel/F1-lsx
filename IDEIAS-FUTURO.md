# Ideias guardadas para o futuro

Registradas em 15/11/2026. Nada disto está implementado ainda.

## 1. Mais controle do jogador sobre o carro (campeonato)

Problema: hoje o jogador só dá ordens (ritmo, risco, defesa, estilo, box). A única ação "de mão" é a largada por reação (`releasePlayer` em race.js, botão `launchTap`).
Objetivo: a mão do jogador decidir resultados em momentos específicos, com risco real e ganho limitado — sem virar simulador de volante.

### Ideias (ordem sugerida)

1. **Disputa roda a roda** (prioridade)
   - Quando duel.js detecta uma briga, abre um momento curto: escolher por dentro / por fora / esperar e tocar no ponto de frenagem.
   - Frear tarde e no ponto certo = ultrapassagem. Tarde demais = travada, escapada larga ou toque (com análise dos comissários).
   - Na defesa: escolher a linha a tempo; mudar de linha tarde demais já gera punição hoje.

2. **Barra de esforço contínua** (prioridade)
   - O jogador segura ou arrasta quanto está forçando.
   - O limite de aderência varia com pneu, temperatura, chuva e combustível.
   - Perto do limite = décimos. Passou do limite = erro (escapada, travada, rodada).

3. **Bateria manual (modo ultrapassagem do regulamento de 2026)**
   - Carga limitada; o jogador escolhe em qual reta gastar.
   - Gastar na reta errada deixa sem bateria para defender na seguinte.

4. **Curvas-chave por volta**
   - Duas ou três curvas marcadas por volta, com janela de toque: ganha ou perde centésimos.
   - Na classificação vira o centro da volta lançada.

5. **Momentos raros e decisivos**
   - Relargada do safety car (sair cedo = punição).
   - Entrada no box (frear tarde = excesso de velocidade = punição).
   - Saída do box.
   - Troca de pneu na pista secando, decidida volta a volta.

### Regras para funcionar num campeonato

- **Ganho limitado**
  - O jogador perfeito ganha uns 0,2–0,4 s por volta sobre o automático.
  - O erro custa mais do que o acerto rende, então arriscar é uma escolha de verdade.
- **Modo automático um pouco pior que um bom jogador**
  - O piloto faz sozinho, com desempenho médio.
  - Quem joga bem tem vantagem; quem joga mal se arriscando fica atrás do automático.
- **Mesmas oportunidades para todos**
  - Os momentos surgem das mesmas situações de corrida, sem sorteio.
  - Cada toque é gravado com o instante da simulação (o tick), para que:
    - o replay continue idêntico;
    - o servidor possa conferir o resultado;
    - fique difícil usar robô.
- **Celular primeiro**
  - Áreas de toque grandes e desconto da latência da tela (como a largada já faz: −0,08 s).
- **Online**
  - O toque é enviado com horário e o anfitrião aplica no instante certo da simulação.

### Pergunta em aberto
As corridas do campeonato são todas ao vivo e simultâneas (online), ou os jogadores também correm sozinhos e comparam resultados? Isso muda como os toques são validados.

## 2. Personagens animados (aprovado em 15/11/2026 — todas as ideias)

Base: o protótipo da entrevista na zona mista. O "boneco" é desenhado em SVG e funciona assim:
- expressões por parâmetros;
- boca sincronizada com as letras da fala;
- piscadas;
- olhar;
- flashes.

É leve e roda bem no celular.

Ordem sugerida:
1. **Personalização do piloto**: tom de pele, cabelo, barba, sobrancelha, formato do rosto, capacete e número. Os pilotos da IA ganham rostos sorteados do mesmo jeito. É a base de todas as cenas.
2. **Entrevista da zona mista no jogo**: perguntas e respostas do banco do press.js, cores e número da equipe do jogador, mesmos efeitos de carreira.
3. **Reunião com a chefe de equipe** (motorhome): a expressão dela mostra a confiança.
4. **Negociação de contrato**: o rosto do diretor denuncia o blefe (mecânica de "ler" o adversário).

Demais cenas:
- **Coletiva de imprensa:** vários pilotos lado a lado, e o rival reage às provocações.
- **Sala dos comissários:** você defende seu caso com o replay ao lado.
- **Sala antes do pódio:** os três primeiros esperando para subir.
- **Pódio e cerimônia:** hino e champanhe, continuando o pódio 3D.
- **Rádio com rosto:** o engenheiro numa janelinha durante a corrida.
- **Tensão com o companheiro de equipe:** depois de uma ordem de equipe desobedecida.
- **Momentos de carreira:** anúncio de contratação, título e comercial do patrocinador.

Coisas que nascem disso:
- **Manchete com foto:** a resposta vira a capa do jornal do dia seguinte, com a foto tirada no flash.
- **Vídeo curto vertical:** a melhor resposta vira clipe de rede social, com legenda.
- **Liga online:** as perguntas citam os jogadores humanos da liga, e as respostas aparecem no site da liga.

### Situação em 15/11/2026

Feito (arquivos: avatar.js, entrevista.js, piloto-visual.js, cenas.js):
- **Personagem**
  - Criação do personagem, que funciona em carreira salva sem resetar.
  - Pilotos da IA e pessoas do paddock com rostos próprios.
- **Entrevistas**
  - Coletiva com três pilotos, em que o rival reage.
  - Zona mista.
- **Reunião técnica**, com a chefe e o engenheiro.
- **Sala dos comissários.**
- **Sala antes do pódio e cerimônia**, com hino, confete e champanhe.
- **Conversa com o companheiro de equipe** depois de uma ordem de equipe.
- **Negociação de contrato**, em que o rosto do diretor entrega a folga.
- **Momentos de carreira**
  - Anúncio da contratação.
  - Comercial do patrocinador.
  - Título mundial.
- **Rádio com o rosto do engenheiro.**
- **Corpo inteiro (corpo.js)** nas comemorações: pódio (troféu e champanhe), título, anúncio e comercial. As entrevistas continuam com foco no rosto.
- **Coisas que nasceram disso**
  - Foto na manchete.
  - Clipe vertical nas redes.

- **Memória do mundo (memoria.js):** fatos com quem viu, peso e validade; rádio do piloto (falar e perguntar); a TV escuta; vazamentos; redes reagem; zona mista e coletiva com perguntas da memória; frases polêmicas voltam semanas depois.
- **Vozes (voz-pt.js + vozes-jogo.js):** voz gerada pelo jogo nas cenas, entrevistas e rádio; liga/desliga em Configurações.

Ainda falta:
- **Banco da memória maior:** chegar a 150+ tipos de fato (vida pessoal, contratos, patrocínio, companheiro, campeonato).
- **Perguntas da liga online.** Precisa dos resultados das corridas online e dos nomes dos jogadores humanos.
- **Banco de perguntas em inglês.** Hoje a legenda de "tradução" mostra o texto em português, porque o banco só existe em português.

## 3. Otimizações ainda não feitas

Já feitas em 15/11/2026:
- pista em blocos com corte do que está fora da câmera;
- carros com 3 níveis de detalhe;
- pista montada antes da largada;
- ajuste automático de qualidade que não desliga efeitos;
- sombras fixas gravadas num mapa;
- camada do chão a 1x;
- janelas secundárias a 20 fps;
- antisserrilhado desligado no celular de tela densa.

Pendentes:
1. **Carros num único desenho por nível de detalhe** (instancing): menos trabalho do processador.
2. **Árvores distantes como "cartões"** (impostores); só as próximas em 3D. Spa e Spielberg chegam a 9 mil pinheiros.
3. **Shader mais enxuto**
   - O laço dos 12 adesivos de patrocínio só nos carros.
   - Precisão `mediump` no celular.
4. **Montar a pista num Web Worker** e guardar no aparelho (IndexedDB) para as próximas vezes.
5. **Modo economia de bateria** (trava em 30 quadros por segundo).
6. **Unir as passadas 2D "chão" e "topo"** da câmera isométrica. Mexe no código antigo e tem mais risco.
7. **Download menor:** compactar o carro3d.js e, na VPS, guardar os arquivos no aparelho (service worker).
8. **Simulação em segundo plano (Web Worker).** É o mais arriscado: só fazer com teste de determinismo antes.
