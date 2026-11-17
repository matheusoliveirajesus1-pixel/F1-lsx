// ===================== AERODINÂMICA: ALTURA DO CHÃO, ARFAGEM, DERRAPAGEM E AR SUJO =====================
// O carro de 2026 tira boa parte da pressão aerodinâmica do assoalho (efeito solo): quanto mais perto do chão, mais ele
// gruda, até um limite; baixo demais o fluxo descola e o assoalho raspa (perde de uma vez). A altura muda o tempo todo:
//  - a própria pressão aerodinâmica comprime as molas (em alta o carro anda mais baixo e gruda mais que o v² sozinho daria)
//  - freando, a frente abaixa e a traseira sobe (o equilíbrio vai para a frente); acelerando, o contrário (vai para trás)
//  - compressões do relevo (fundo da Eau Rouge) baixam o carro; cristas levantam
// Derrapando (carro de lado em relação ao movimento), o assoalho e a asa perdem eficiência, mais atrás do que na frente:
// uma escorregada em alta tende a piorar sozinha. Atrás de outro carro, o ar sujo tira pressão (mais da frente: o carro
// de trás sai de frente nas curvas) e o piloto precisa tirar um pouco nas curvas rápidas.
// O perfil de velocidade (physics.js) usa a curva "em regime" (só a velocidade); o núcleo de dinâmica (dyn.js) usa o estado
// completo de cada instante.
const AERO={
  HF0:32,HR0:68,// altura parado (mm), dianteira e traseira (o carro anda com a traseira mais alta: "rake")
  KF:400,KR:290,// rigidez vertical de cada eixo (N/mm), molas + barra de altura
  HOT:12,// altura média abaixo da qual o assoalho começa a descolar/raspar (mm)
  GANHO:.0055,// ganho de pressão por mm abaixo da altura parada (efeito solo)
  STALL:.035,// perda por mm abaixo de HOT
  VREF:60,// velocidade de referência: a pressão nessa velocidade em regime vale 1 (o resto da física foi calibrado assim)
  BAL:.0022,// quanto o equilíbrio (fração da frente) anda por mm de arfagem
  YAW:2.4,// perda de pressão por rad² de derrapagem (0,15 rad ≈ 8,6° → −5%)
  YAW_BAL:.3,// derrapando, a traseira perde mais (fração da frente sobe)
  SUJO:.12,// perda de pressão no ar sujo colado no carro da frente (some até ~36 m)
  SUJO_BAL:.025// no ar sujo a frente perde mais (fração da frente cai: sai de frente)
};
// fator do efeito solo pela altura média (mm)
function aeroSolo(hm){const A=AERO,mid=(A.HF0+A.HR0)/2;if(hm>=A.HOT)return 1+A.GANHO*(mid-hm);return 1+A.GANHO*(mid-A.HOT)-A.STALL*(A.HOT-hm)}
// alturas (mm) com uma carga vertical extra em cada eixo (N) e a pressão aerodinâmica dada
function aeroAlturas(down,af,dF,dR){const A=AERO;/* batente: o assoalho encosta no chão, não passa dele */return[Math.max(0,A.HF0-(down*af+dF)/A.KF),Math.max(0,A.HR0-(down*(1-af)+dR)/A.KR)]}
// fator em regime (só a velocidade, sem arfagem): o mesmo para o perfil de velocidade e o núcleo
const _aeroRef={};// fator na velocidade de referência, por cl (guardado: muda pouco entre carros)
function _aeroFix(v,cl){const kd=.5*PH.rho*PH.cla*cl;let f=1;for(let it=0;it<3;it++){const h=aeroAlturas(kd*v*v*f,LOAD.AF,0,0);f=aeroSolo((h[0]+h[1])/2)}return f}
function aeroRegime(v,cl){cl=cl||1;const kc=Math.round(cl*500);let r=_aeroRef[kc];if(r===undefined)r=_aeroRef[kc]=_aeroFix(AERO.VREF,kc/500);return _aeroFix(v,cl)/r}
// estado completo do carro agora: fator de pressão (k) e fração na dianteira (af), alturas (hF, hR) e se o assoalho raspa
function aeroEstado(c,v,rl){const d=c.dyn||{},m=(c.ph&&c.ph.mass)||PH.mass,cl=(c.ph&&c.ph.cl)||1,A=AERO;
  const kd=.5*PH.rho*(typeof relRhoR==="function"?relRhoR():1)*PH.cla*cl,ss=aeroRegime(v,cl),down=kd*v*v*ss;
  // arfagem pela aceleração longitudinal (a mesma transferência de carga de dynLoad) e compressão do relevo
  const ax=Math.max(-60,Math.min(20,d.ax||0)),dLx=m*ax*LOAD.H/LOAD.L,kv=rl?rl.kv:0,dz=m*v*v*kv;
  const h=aeroAlturas(down,LOAD.AF,-dLx+dz*LOAD.WF,dLx+dz*(1-LOAD.WF)),h0=aeroAlturas(down,LOAD.AF,0,0);
  const hm=(h[0]+h[1])/2,hm0=(h0[0]+h0[1])/2;let k=ss*aeroSolo(hm)/aeroSolo(hm0);
  let af=LOAD.AF+A.BAL*((h[1]-h[0])-(h0[1]-h0[0]));// mais rake que o normal (freando) = equilíbrio para a frente
  const b=Math.min(.6,Math.abs(d.beta||0));if(v>8){k*=Math.max(.55,1-A.YAW*b*b);af+=A.YAW_BAL*b*b}
  const sj=c.dirtyK||0;if(sj>0){k*=1-A.SUJO*sj;af-=A.SUJO_BAL*sj}
  af=Math.max(.3,Math.min(.6,af));const raspa=Math.min(h[0],h[1])<1.5;
  return c._aero={k,af,hF:h[0],hR:h[1],raspa,ss}}
// fator de pressão do carro agora (1 se ainda não calculado)
function aeroK(c){return c&&c._aero?c._aero.k:1}
