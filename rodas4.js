// ===================== QUATRO RODAS E DIFERENCIAL =====================
// O núcleo de dinâmica (dyn.js) trata cada eixo como um pneu só para a guinada (modelo de bicicleta), mas a força que
// cada eixo consegue fazer agora sai das suas duas rodas, cada uma com a sua carga (transferência de carga e suspensão,
// suspfis.js) e o seu pneu (pneu.js):
//  - tração: o motor empurra as duas rodas de trás pelo diferencial. Na saída de curva a roda de dentro está leve; com
//    diferencial aberto ela patina e limita o carro inteiro. O diferencial autoblocante do F1 manda parte da força para a
//    roda de fora (mais tração), mas, travando as duas rodas juntas, resiste a virar (sai um pouco de frente na saída)
//  - alívio e freio motor: o diferencial travado segura a traseira na entrada da curva (carro mais estável, menos ágil)
//  - freada: cada roda tem o mesmo freio; numa freada ainda em curva a roda dianteira de dentro, leve, trava primeiro
//    (a clássica travada da dianteira de dentro, com fumaça), perde aderência e pode fazer um ponto chato no pneu
// Rodas: 0 dianteira esq., 1 dianteira dir., 2 traseira esq., 3 traseira dir. (esquerda = +y)
const RODAS4={
  LOCK_E:.6,// trava do diferencial acelerando (0 aberto, 1 travado)
  LOCK_C:.35,// trava no alívio/freio motor
  BIAS:.12,// quanto o diferencial travado puxa a força para a roda mais lenta (de dentro) numa curva fechada
  TR:1.6,// bitola (m)
  TRAVA:.25,// a roda de dentro aguenta ~25% acima do limite antes de travar (o piloto modula o pedal)
  CHATO:.006// chance por passo de uma travada de roda virar ponto chato no pneu
};
// fração da capacidade do eixo que cada roda tem (pela carga e pela sensibilidade do pneu à carga)
function rodasParte(Fin,Fout){const L=LOAD,f=x=>x>0?x*(1+L.S*(x-L.FZ0)):0,a=f(Fin),b=f(Fout),s=a+b;return s>0?[a/s,b/s]:[.5,.5]}
// tração máxima de um eixo motriz com diferencial (em fração da capacidade do eixo), com as partes de dentro e de fora
function rodasTrac(pIn,pOut,lock){if(pIn>=pOut)return 1;return Math.min(1,2*pIn+lock*(pOut-pIn))}
// a mesma conta para o perfil de velocidade (physics.js): carga das rodas de trás pela transferência lateral em regime
function rodasTracPerfil(lat,vv,m,kdv2){const L=LOAD,g=PH.g,Fr=m*g*(1-L.WF)+kdv2*(1-L.AF),dR=m*lat*L.H/L.TR*L.RF;const p=rodasParte(Fr/2-dR,Fr/2+dR);return rodasTrac(p[0],p[1],RODAS4.LOCK_E)}
// cargas de dentro e de fora de um eixo (0 frente, 1 trás) agora; curva para a esquerda (aLat>0): dentro = esquerda
function rodasCargas(d,eixo,aLat){const fz=d.fz4;if(!fz)return null;const iL=eixo*2,iR=iL+1;return aLat>=0?[fz[iL],fz[iR],iL,iR]:[fz[iR],fz[iL],iR,iL]}
// quanto a roda dianteira de dentro passa do limite numa freada em curva (0 = não trava; até 1)
function rodasTravaDentro(fzIn,fzOut,G,bf,aLatAbs,aL,shF){const p=rodasParte(fzIn,fzOut),latF=Math.min(.98,aLatAbs/Math.max(1,G*bf)),capIn=p[0]*2*G*bf*Math.sqrt(1-latF*latF),need=-aL*shF;
  return{li:Math.max(0,Math.min(1,(need/Math.max(.5,capIn)-1-RODAS4.TRAVA)*3)),capIn}}
// qual roda dianteira trava numa travada do eixo: em curva a de dentro (aLat>0 = curva para a esquerda: a esquerda, 0); em reta, as duas
function rodasRodaTravada(aLat){return Math.abs(aLat)>3?[aLat>=0?0:1]:[0,1]}
