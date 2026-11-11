// ===================== CARRO: ASA MÓVEL, FREIO, DIFERENCIAL E RECARGA =====================
// Asa móvel (aerodinâmica ativa de 2026), balanço de freio, diferencial e recarga na freada.
// Tudo isso é operação do próprio piloto: brain.js (brainCar) ajusta pelo estado do carro e pela experiência dele.
// O jogador não opera esses mecanismos; ele só dá intenções (Ritmo e Disputas).
// ---------- estado dos controles de cada carro
function ccInit(c){if(c.cc)return c.cc;c.cc={bb:56,diff:0,harv:1,aeroOpen:false};return c.cc}
function bbOpt(c){const fuelK=clamp((c.fuel||60)/100,0,1);return 55.5+fuelK*1.5-(R.w>.4?1.2:0)}// mais combustível pesa atrás: freio mais para a frente
function diffOpt(){const slow=(R.geo.corners||[]).filter(k=>(k.v||99)<35).length;return slow>=5?1:slow<=2?-1:0}// muitas curvas lentas pedem mais travado
const AERO_K=.958;// asa fechada nas retas de aero: ~4% a menos de velocidade final
// ajusta a velocidade-alvo a cada passo (chamado pela física da corrida)
function ccAdj(c,v1,i){if(!R.started)return v1;const cc=ccInit(c);
  if(c.stallT){if(R.t<c.stallT)return 0;c.stallT=0}
  // ponto chato no pneu (travada forte): vibra e perde rendimento até trocar o jogo
  if(c.tyre.flat)v1*=1-c.tyre.flat*.009;
  const zone=typeof inDRS==="function"&&inDRS(fr(c.prog)),brk=R.geo.ai.ph[i]===1;
  // asa móvel: o piloto abre sempre que a regra deixa (reta marcada, fora da freada, sem safety car)
  cc.aeroOpen=zone&&!brk&&!R.sc;
  // balanço de freio e diferencial: longe do ideal, freia/traciona pior
  if(c.isP||c.hum){/* jogadores: o acerto vem do próprio piloto (brainCar) */const offB=Math.abs(cc.bb-bbOpt(c));if(brk&&offB>.5)v1*=1-Math.min(.03,(offB-.5)*.006);const offD=Math.abs(cc.diff-diffOpt());if(!brk&&R.geo.ai.ph[i]===2&&offD>0)v1*=1-offD*.004;
    // recarga na freada: mais bateria, mas traseira mais nervosa
    if(brk&&cc.harv>0&&(c.batt||0)<100){c.batt=Math.min(100,(c.batt||0)+cc.harv*.35*.05)}
    if(brk&&cc.bb>bbOpt(c)+1.5&&!c.tyre.flat&&rnd()<.0005*(cc.bb-bbOpt(c))){c.tyre.flat=rr(.3,.8);radio(c,"Travei a dianteira! Ponto chato no pneu, o volante está vibrando.",{k:"pneus"})}
    if(brk&&cc.harv===2&&(c.v||0)>40&&rnd()<.00012&&typeof exStart==="function")exStart(c,"spin",{why:"traseira escapou com recarga máxima na freada"})}
  return v1}
// largada: às vezes um carro da IA apaga o motor no grid
function ccStartStalls(){for(const c of R.cars){if(c.isP||!running(c))continue;if(rnd()<.004){c.stallT=R.t+rr(6,11);rcMsg(`${c.code} apagou o motor na largada! Perde várias posições.`,"warn","largada")}}}
