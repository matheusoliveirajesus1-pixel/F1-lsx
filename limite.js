// ===================== PILOTO NO LIMITE: CADA PILOTO APRENDE ATÉ ONDE CADA CURVA VAI =====================
// O plano de velocidade (physics.js) é uma estimativa: a física de verdade (relevo, efeito solo, suspensão, pneu, rodas)
// às vezes dá mais e às vezes dá menos que ele. Como um piloto real, cada piloto da IA guarda, curva por curva, uma
// margem própria e mexe nela volta a volta:
//  - passou limpo (na linha, sem sair de frente, sem a traseira escorregar): na próxima entra um pouco mais forte
//  - escorregou, saiu da linha ou saiu de frente: tira um pouco
//  - saiu da pista ou rodou: tira bastante (e reconstrói devagar)
// O ponto de equilíbrio é o limite do carro naquele momento (pneu, combustível, chuva, ar sujo). O modo muda até onde
// ele vai (atacando busca o limite, poupando fica longe dele) e o talento muda o teto e a rapidez com que acha.
// Disputa lado a lado, ultrapassagem e safety car não contam (não é a volta "limpa" que ensina).
const LIM={
  SOBE:.0012,// ganho por curva limpa
  DESCE:.008,// perda por uma escorregada ("um momento")
  ERRO:.02,// perda por saída de pista ou rodada
  TETO:{attack:1.03,normal:1.018,save:.99},// até quanto acima do plano ele vai, por modo
  PISO:.93,
  LINHA:1.1,// erro de linha (m) que conta como "saiu da linha"
  BETA:.09,// derrapagem (rad) que conta como "a traseira escorregou"
  UNDER:3// falta de aderência na frente (m/s²) que conta como "saiu de frente"
};
// zonas de curva (freada + curva) do traçado da IA: cada uma é uma curva a aprender; reta = −1
function limZonas(g){const A=g.ai;if(!A||!A.ph)return null;if(A._lz)return A._lz;const N=g.N,z=new Int16Array(N).fill(-1);let n=-1,k0=0;
  for(let i=0;i<N;i++)if(A.ph[i]===1&&A.ph[(i-1+N)%N]!==1){k0=i;break}
  for(let q=0;q<N;q++){const i=(k0+q)%N,p=A.ph[i];if(p===1&&A.ph[(i-1+N)%N]!==1)n++;z[i]=p===0?-1:Math.max(0,n)}
  A._lzN=n+1;return A._lz=z}
function limTalento(c){const a=c.d&&c.d.a||{};const cor=typeof sk==="function"?sk(c,"cor"):(a.pace||80);return clamp((cor-60)/40,0,1)}
// fator da curva atual para a velocidade-alvo (ai.js)
function limFator(c,i){const z=limZonas(R.geo);if(!z||z[i]<0||!c._lim)return 1;return c._lim[z[i]]||1}
// aprendizado: chamado a cada passo da IA
function limPasso(c,i,neutral){const z=limZonas(R.geo);if(!z)return;const N=R.geo.N;
  if(!c._lim){const t=limTalento(c),n=R.geo.ai._lzN||1;c._lim=new Float32Array(n).fill(.99+.01*t);c._lz={k:-1}}
  const st=c._lz,k=z[i],d=c.dyn||{};
  if(k!==st.k){// saiu de uma curva: aprende com ela
    if(st.k>=0&&!st.suja){const t=limTalento(c),teto=(LIM.TETO[c.mode]||LIM.TETO.normal)-(1-t)*.02,cur=c._lim[st.k];let nv=cur;
      if(st.erro)nv=cur-LIM.ERRO;else if(st.beta>LIM.BETA)nv=cur-LIM.DESCE;else nv=Math.min(teto,cur+LIM.SOBE*(.6+.8*t));
      if(nv>teto)nv=Math.max(teto,cur-LIM.DESCE);// trocou para um modo mais calmo: desce aos poucos até o novo teto
      c._lim[st.k]=clamp(nv,LIM.PISO,1.05)}
    st.k=k;st.linha=0;st.beta=0;st.under=0;st.nt=0;st.ns=0;st.erro=false;st.suja=false}
  if(k<0)return;
  // o que acontece dentro da curva
  if(neutral||R.sc||R.red||c.pit||(c.alongs&&c.alongs.length)||(c.att&&c.att.commit)||(c.dirtyK||0)>.4||!R.started)st.suja=true;
  if(c.ex)st.erro=true;if(d.spin)st.erro=true;
  // sinais de que passou do limite: o carro abre para fora do que o piloto quer (saiu de frente ou de traseira), a frente
  // satura por muito tempo, a traseira escorrega
  if((c.v||0)>12&&typeof gripG==="function"){const cap=gripG(c,c.v)*Math.min(d.kF||1,d.kR||1),u=Math.hypot(d.ayA||0,Math.min(0,d.ax||0)*.5)/Math.max(1,cap);st.linha=Math.max(st.linha,u)}// uso da aderência (pico na curva)
  st.beta=Math.max(st.beta,Math.abs(d.beta||0));st.nt=(st.nt||0)+1;if(d.fSat)st.ns=(st.ns||0)+1;st.under=st.nt>5?(st.ns||0)/st.nt:0}
