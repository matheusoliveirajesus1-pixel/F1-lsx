// ===================== PNEU COMPLETO: SUPERFÍCIE E CARCAÇA, PRESSÃO, CAMBAGEM, GRANULAÇÃO E BOLHAS =====================
// Antes o pneu tinha uma temperatura só, que ia sozinha para um alvo (modo de pilotagem, safety car, chuva). Agora cada
// roda tem duas temperaturas que vêm do que o carro está fazendo:
//  - superfície: esquenta rápido quando o pneu trabalha perto do limite e escorrega (curva no limite, freada forte, roda
//    patinando ou travando, carro de lado), esfria rápido nas retas com o vento
//  - carcaça (o miolo): esquenta devagar com a flexão da borracha (carga × velocidade) e com a superfície; esfria devagar
//  - pressão: vem da carcaça (gás quente = mais pressão); fora da pressão ideal a área de contato muda e o pneu rende menos
//  - cambagem: a roda é inclinada para dentro parada; na curva a carroceria rola e a roda de fora fica mais perto de reta,
//    que é onde o pneu rende mais
// Problemas que saem disso (não são mais sorteio):
//  - granulação: borracha fria escorregando arranca bolinhas que grudam na banda; some quando o pneu entra na janela
//  - bolhas: carcaça quente demais por muito tempo ferve a borracha por dentro; não some até trocar o pneu
// A aderência de cada eixo no núcleo de dinâmica (dyn.js) segue a média das suas duas rodas, comparada com o que o
// piloto planejou na última atualização (race.js, recalc). Rodas: 0 dianteira esq., 1 dianteira dir., 2 traseira esq., 3 traseira dir.
const PNEU={
  AR:25,// temperatura do ar (°C); chuva esfria
  TAU_S:2.5,TAU_C:6,// tempo da superfície e da carcaça (s); a carcaça segue a superfície, que só se afasta dela um pouco
  RESP:.6,// quanto a temperatura de equilíbrio acompanha o trabalho (a pressão sobe com o calor e segura parte da subida)
  MIX:.09,// quanto a superfície se afasta da carcaça pelo trabalho de agora (curva no limite ~+15°, reta ~−6°): a carcaça leva ~1 volta para mudar
  AQ:1,// escala do aquecimento (calibrada para o ritmo normal deixar a carcaça perto da janela do composto)
  COMP:{S:1.03,M:1,H:.97,I:.95,W:.9},// macio esquenta um pouco mais (borracha mais "viva"); a janela de cada composto já está em TYRES
  ESTILO:{attack:1.1,normal:1,save:.88},// atacando o piloto escorrega mais; poupando, alivia antes e escorrega menos
  P0:[1.62,1.62,1.45,1.45],// pressão a frio (bar) dianteira e traseira
  CAMB:[-3.2,-3.2,-2,-2],// cambagem parada (graus); o ideal na curva é perto de −1°
  ROLA:.5,// rolagem da carroceria por g de curva (graus; carro de F1 é muito duro): muda a cambagem
  GR_T:16,// graus abaixo da janela em que escorregar granula
  BL_T:22// graus acima da janela (carcaça) em que começa a ferver
};
// trabalho médio do pneu no ritmo normal em cada pista (medido em corridas de teste: tests/pneu.js, calibração)
const PNEU_TRK={melbourne:.217,shanghai:.267,suzuka:.318,miami:.267,montreal:.246,monaco:.221,barcelona:.354,spielberg:.281,silverstone:.281,spa:.256,budapest:.252,zandvoort:.261,monza:.222,madrid:.206,baku:.23,singapura:.233,austin:.248,mexico:.223,interlagos:.245,lasvegas:.274,lusail:.354,abudhabi:.238};
function pneuTrkW(){if(R&&R._pnW)return R._pnW;const id=R&&R.geo&&R.geo.id;return PNEU_TRK[id]||.25}
// o "treino" continua durante a corrida: a média de trabalho de todos os carros em bandeira verde (a tabela acima é o ponto de
// partida) — é o que o engenheiro usaria para acertar as pressões; um carro sozinho atacando ou poupando quase não mexe nela
function pneuTrkAprende(trab,dt){if(!R||R.sc||R.red)return;if(!R._pnW)R._pnW=pneuTrkW();const n=Math.max(1,(R.cars||[]).length);R._pnW+=(trab-R._pnW)*Math.min(1,dt/(240*n))}
// estado por carro (refeito a cada pneu novo)
function pneuInit(c){const t=c.tyre,T0=t.temp!=null?t.temp:60;return c._pn={ref:t,ts:[T0,T0,T0,T0],tc:[T0-4,T0-4,T0-4,T0-4],gr:[0,0,0,0],bl:[0,0,0,0],p:[0,0,0,0],avisoGr:0,avisoBl:0}}
// janela do composto: superfície pelo T.opt; carcaça uns graus abaixo
function pneuJanela(comp){const T=TYRES[comp]||TYRES.M;return{s:T.opt,c:T.opt-4}}
// fator de aderência de uma roda pelas temperaturas (mesma inclinação que o plano usa, ver tyreMu em physics.js)
function pneuTemp(ts,tc,comp){const J=pneuJanela(comp);return 1-Math.min(.18,Math.abs(ts-J.s)*.0022+Math.max(0,Math.abs(tc-J.c)-10)*.0015)}
// pressão quente (bar) e o fator dela: longe do ideal (a pressão fria esquentada até a janela) o pneu rende menos
function pneuPressao(j,tc,comp){const J=pneuJanela(comp),p=PNEU.P0[j]*(tc+273)/(20+273),pi=PNEU.P0[j]*(J.c+273)/(20+273);return{p,k:1-Math.min(.06,3.5*((p-pi)/pi)**2)}}
// cambagem dinâmica e o fator dela: ay em m/s² (+ = curva para a esquerda: rodas da direita por fora)
function pneuCamb(j,ay){const g=ay/9.81,fora=(j%2===0)?g<0:g>0,rol=PNEU.ROLA*Math.abs(g);const cam=PNEU.CAMB[j]+(fora?rol:-rol);
  // em curva o que importa é a roda de fora (carregada): perto de −1° é o melhor; em reta, o pneu fica um pouco inclinado (perde pouco)
  const ideal=Math.abs(g)>.4?-1:-1.6;return{cam,k:1-Math.min(.05,.0035*(cam-ideal)**2)}}
// um passo (dt da corrida): aquece e esfria cada roda pelo que o carro fez; atualiza granulação, bolhas, pressão e a temperatura mostrada
function pneuPasso(c,dt){if(!c.tyre)return;let st=c._pn;if(!st||st.ref!==c.tyre)st=pneuInit(c);
  // parado no grid, na volta de apresentação ou no box: a temperatura segue o que race.js já faz (mantas, carro parado); as rodas acompanham
  if(c.pit||!R.started){for(let j=0;j<4;j++){st.ts[j]+=(c.tyre.temp-st.ts[j])*Math.min(1,dt/2);st.tc[j]+=(c.tyre.temp-4-st.tc[j])*Math.min(1,dt/8)}c._pn=st;return}const t=c.tyre,d=c.dyn||{},v=Math.max(0,c.v||0),P=PNEU;
  const comp=t.c,J=pneuJanela(comp),molh=R.w||0,ar=P.AR-8*molh,kc=P.COMP[comp]||1;
  const m=(c.ph&&c.ph.mass)||PH.mass,q=m*9.81/4,fz=d.fz4||null,ay=d.ayA||0;
  const uA=[d.uF||0,d.uF||0,d.uR||0,d.uR||0],lk=d.lockT>0?1:0,pat=d.spinW||0,beta=Math.abs(d.beta||0);
  // vento: esfria a superfície mais em alta; pista molhada esfria muito
  const vento=1+v/25+molh*3;
  for(let j=0;j<4;j++){const carga=fz?Math.min(2.5,Math.max(.2,fz[j]/q)):1,u=Math.min(1.3,uA[j]);
    // trabalho do pneu: força × escorregamento cresce com u² e com a velocidade; a flexão da carcaça rolando soma um pouco;
    // travada (dianteiras), patinada (traseiras) e carro de lado esquentam a superfície de uma vez
    const extra=Math.min(1.5,(j<2?lk*1.2:pat*1.5)+Math.min(.5,beta)*Math.min(.5,beta)*6);
    const trab=(carga*(.05*Math.min(1.3,v/55)+u*u*Math.min(1.4,v/50))+extra*Math.min(1,v/30))*(P.ESTILO[c.mode]||1);
    st.w=(st.w||0)+trab*dt;st.wt=(st.wt||0)+dt;if(v>15)pneuTrkAprende(trab/(P.ESTILO[c.mode]||1),dt);
    // carcaça: vai devagar para o equilíbrio do trabalho médio
    // equilíbrio: o engenheiro escolhe as pressões pela pista (treinos) para o ritmo normal deixar o pneu na janela; o que muda
    // daí é a pilotagem (atacar, escorregar, travar, ar sujo, poupar) e um pouco o caráter da pista (as mais exigentes esquentam mais)
    // superfície: sai um pouco da carcaça na direção do que o trabalho de agora pede (curva esquenta, reta esfria)
    const Wt=pneuTrkW(),alvo=ar+(J.s-2-P.AR)*P.AQ*kc*(1+P.RESP*(trab/Wt-1))*Math.pow(Wt/.25,.25);
    const eqS=st.tc[j]+P.MIX*(alvo-molh*35-st.tc[j]);/* pista molhada esfria (a água tira calor) */st.ts[j]+=(eqS-st.ts[j])*Math.min(1,dt/P.TAU_S);
    // carcaça: segue a superfície devagar (condução pela borracha)
    st.tc[j]+=(st.ts[j]-st.tc[j])*Math.min(1,dt/P.TAU_C);
    // granulação: superfície fria e escorregando; limpa quando volta à janela
    const frio=J.s-P.GR_T-st.ts[j];if(frio>0&&u>.8&&v>15)st.gr[j]=Math.min(1,st.gr[j]+dt*.012*(frio/10)*(u-.75)*4*(comp==="H"?.5:1));
    else if(st.ts[j]>J.s-8)st.gr[j]=Math.max(0,st.gr[j]-dt*.006);
    // bolhas: carcaça muito quente por muito tempo (não volta)
    const quente=st.tc[j]-J.c-P.BL_T;if(quente>0&&COMP[comp]&&COMP[comp].dry)st.bl[j]=Math.min(1,st.bl[j]+dt*.0016*quente/5);
    st.p[j]=pneuPressao(j,st.tc[j],comp).p}
  // o que o resto do jogo enxerga: temperatura média da superfície (painel, plano, desgaste), granulação e bolha da pior roda
  t.temp=(st.ts[0]+st.ts[1]+st.ts[2]+st.ts[3])/4;t.tc=(st.tc[0]+st.tc[1]+st.tc[2]+st.tc[3])/4;t.ts4=st.ts.slice();t.tc4=st.tc.slice();t.p4=st.p.slice();
  t.grain=Math.max(...st.gr);t.blister=Math.max(...st.bl);
  if(c.hum&&typeof radio==="function"){if(t.grain>.35&&!st.avisoGr){st.avisoGr=1;radio(c,"Os pneus estão granulando, sem aderência. Estavam frios demais.",{k:"pneu"})}if(t.grain<.1)st.avisoGr=0;
    if(t.blister>.3&&!st.avisoBl){st.avisoBl=1;radio(c,"Bolhas nos pneus! A carcaça esquentou demais, preciso pegar leve.",{k:"pneu"})}}
  c._pn=st}
// fator de aderência de um eixo (0 = dianteiro, 1 = traseiro): média das duas rodas pesada pela carga (a roda de fora,
// carregada, é a que faz a curva), dividida pela referência que o plano já conta (pneuRef, na última atualização em recalc)
function pneuRoda(j,ts,tc,comp,ay,gr,bl){return pneuTemp(ts,tc,comp)*pneuPressao(j,tc,comp).k*pneuCamb(j,ay).k*(1-.03*(gr||0))*(1-.035*(bl||0))}
function pneuEixo(c,a){const st=c._pn,t=c.tyre;if(!st||!t||st.ref!==t)return 1;const d=c.dyn||{},ay=d.ayA||0,fz=d.fz4;let s=0,wt=0;
  for(const j of a===0?[0,1]:[2,3]){const w=fz?Math.max(50,fz[j]):1;s+=w*pneuRoda(j,st.ts[j],st.tc[j],t.c,ay,st.gr[j],st.bl[j]);wt+=w}
  const ref=c._muTref||1;return Math.max(.6,Math.min(1.08,s/wt/ref))}
// referência do plano: a mesma conta com as temperaturas médias do momento da atualização, numa curva típica (3 g, 65% da carga na roda de fora)
function pneuRef(c){const t=c.tyre;if(!t)return 1;const tc=t.tc!=null?t.tc:t.temp-4;let s=0;
  for(const a of [[0,1],[2,3]]){const fo=pneuRoda(a[1],t.temp,tc,t.c,30,0,0),de=pneuRoda(a[0],t.temp,tc,t.c,30,0,0);s+=.65*fo+.35*de}
  // a temperatura média já entra no plano por tyreMu: aqui fica só o resto (pressão, cambagem), para não contar duas vezes
  const T=TYRES[t.c]||TYRES.M,tm=1-Math.min(.12,Math.abs(t.temp-T.opt)*.0022);return c._muTref=s/2/Math.max(.5,pneuTemp(t.temp,tc,t.c))*tm}
