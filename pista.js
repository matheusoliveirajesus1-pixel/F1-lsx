// ===================== PISTA VIVA: POÇAS, LINHA SECANDO, SPRAY, BORRACHA, SUJEIRA E BANDEIRA AMARELA =====================
// Poças: pontos fixos de cada circuito que acumulam água com chuva forte; passar rápido com pneu errado = aquaplanagem.
// Linha secando: quando a chuva para, o traçado seca antes; fora dele a pista continua molhada.
// Spray: atrás de outro carro na chuva a visibilidade cai (reage mais tarde, erra mais).
// Borracha: a pista fica mais rápida ao longo do fim de semana; a chuva lava. Sujeira (marbles) fora da linha no fim da corrida.
// Amarela: os pilotos aliviam antes da zona; dupla é mais lenta; quem não alivia pode ser punido.
function puddlesFor(geo){const N=geo.N,AI=geo.ai,h=hashS(geo.id+":agua");const out=[];let seed=h;const rn=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const n=3+Math.floor(rn()*3);let tries=0;while(out.length<n&&tries++<200){const i=Math.floor(rn()*N);if(AI.ph[i]!==0&&AI.ph[i]!==1)continue;
    if(out.some(p=>Math.abs(p.i-i)<60))continue;out.push({i,f:i/N,lat:(rn()-.5)*7,len:14+rn()*22,w:2.4+rn()*2.6})}return out}
function rainDepth(){return clamp((R.w-.55)/.4,0,1)*(R.rain===2?1:R.rain===1?.6:.35)}
// molhado "efetivo" para um carro: linha seca quando a pista está secando
function wetAt(c){const w=R.w;if(!R.drying||w<.05)return w;const off=Math.abs((c.y||0)-(R.geo.line[Math.floor(fr(c.prog)*R.geo.N)%R.geo.N]*(c.lineK||1)))>1.8;return off?Math.min(1,w*1.15):w*(1-.45*R.drying)}
function pistaInit(){R.puddles=puddlesFor(R.geo);R.rubber=clamp(W.rubber??.45,0,1);R.marb=0;R.drying=0;R.yId=0}
// clima da pista a cada passo (chamado pelo motor)
function pistaTick(dt){const tr=R.wPrev!=null?(R.w-R.wPrev)/Math.max(dt,1e-3):0;R.wPrev=R.w;
  R.drying=R.rain===0&&R.w<.75&&R.w>.04?clamp((.75-R.w)/.5,0,1):0;
  if(R.w>.45)R.rubber=Math.max(0,R.rubber-dt*.004);else R.rubber=Math.min(1,R.rubber+dt*.00045);
  R.marb=clamp((R.lead/Math.max(1,R.L))*(1-R.w*1.5),0,1)}
// ajuste de ritmo do carro (por volta): borracha acumulada
function rubberMu(){return 1+(R.rubber||0)*.004}
// efeitos por passo para cada carro: poças, linha molhada, sujeira fora da linha, spray
function pistaDrive(c,ph,i,dt){let m=1;const g=R.geo,ideal=g.line[i]*(c.lineK||1),off=Math.abs((c.y||0)-ideal);const T=TYRES[c.tyre.c];
  if(R.drying&&off>1.8&&R.w>.05){m*=1-(T.dry?.025:.008)*R.drying*Math.min(1,R.w*2)}
  if((R.marb||0)>.25&&ph===2&&off>2.2)m*=1-R.marb*.014;
  // spray: atrás de outro carro na chuva
  const A=c.aheadO,dA=c.dAO;c.spray=(R.w>.35&&A&&dA<55&&running(A)&&!A.pit)?R.w*clamp(1-(dA-8)/47,0,1):0;
  // poças
  const dep=rainDepth();if(dep>.05&&R.puddles&&!c.pit&&c.v>45){for(const p of R.puddles){let d=(fr(c.prog)-p.f)*g.len;if(d<0)d+=g.len;if(d>p.len)continue;
      if(Math.abs((c.y||0)-p.lat)>p.w/2+.9)continue;const key=c.lap*16+R.puddles.indexOf(p);if(c.aqK===key)continue;c.aqK=key;
      const tk=T.dry?1:c.tyre.c==="I"?.3:.05;const sp=Math.pow(clamp((c.v-50)/32,0,1),1.5);const sk2=Math.exp((75-(c.d.a.wet||75))/20)*expRisk(c);
      if(rnd()<.12*dep*tk*sp*sk2*(1+c.tyre.wear))aquaplane(c,dep)}}
  return m}
function aquaplane(c,dep){if(c.ex||!running(c))return;const f=fr(c.prog);R.nAqua=(R.nAqua||0)+1;R.fxq.push({type:"puff",f,lat:c.y||0,t0:R.t});
  const r=rnd(),sv=saveChance(c);const cn=nextCorner(c),nm=cn?`antes da ${cn.n}`:"na reta";
  if(r<.62+sv*.5){bubble(c,"Aquaplanou!","bad",2.6);dynError(c,"gripLoss",{axle:"f",k:.25,t:.7});dynError(c,"gripLoss",{axle:"r",k:.35,t:.6});/* a poça tira a aderência; o resto é física */stEv(c,"err","minor");if(c.hum)radio(c,`Aquaplanei ${nm}! O carro flutuou na poça.`,{me:1,k:"aqua"})}
  else if(r<.95||dep<.6){bubble(c,"Rodou na poça!","bad",3.2);const d=rnd()<.5?1:-1;exStart(c,"spin",{dir:d});stEv(c,"err","spin");
    rcMsg(`${c.code} aquaplanou e rodou ${nm}!`,"warn","aqua");if(c.hum)radio(c,`Aquaplanagem ${nm}! Rodei.`,{pause:true,k:"aqua"});crowdEv(f,.8);hlight("spin",[c],`${c.code} aquaplana`,c.isP?3:2)}
  else{R.errLog&&R.errLog.crash++;stEv(c,"err","crash");rcMsg(`${c.code} aquaplanou e perdeu o carro ${nm}!`,"bad","aqua");exStart(c,"crash",{dir:sideAt(f),fast:.7});crowdEv(f,1)}}

// ---------- bandeira amarela: alívio progressivo e fiscalização
function yellowK(c){if(!R.yellows.length)return 1;const f=fr(c.prog),L=R.geo.len;let k=1,dbl=false,yy=null;
  for(const y of R.yellows){if(y.until<R.t)continue;const tgt=y.dbl?.84:.93;let d=fr(y.a)-f;if(d<0)d+=1;d*=L;const inside=inZone(f,y.a,y.b);
    const kk=inside?tgt:d<160?1-(1-tgt)*(1-d/160):1;if(kk<k){k=kk;dbl=y.dbl;yy=y}}
  if(yy&&inZone(f,yy.a,yy.b)){yy.id=yy.id||(R.yId=(R.yId||0)+1);if(c.yLast!==yy.id){c.yLast=yy.id;const disc=(c.d.pers||{}).disc??65;
      c.yNo=!c.pit&&rnd()<(1-disc/100)*.011+(c.mode==="attack"?.004:0)+((c.st&&c.st.frus>60)?.004:0);if(c.yNo)R.nYellowNo=(R.nYellowNo||0)+1;
      // medição: velocidade média na zona contra a velocidade normal do carro naquele ponto (os comissários olham isso, não a intenção)
      c.yM={id:yy.id,dbl,n:0,s:0}}
    if(c.yM&&c.yM.id===yy.id&&!c.pit&&!c.ex&&!(c.emergT>R.t)){const ref=speedAt(c,f)*(c.k||1);if(ref>8){c.yM.s+=Math.min(1.2,(c.v||0)/ref);c.yM.n++}}}
  else if(c.yM){const M=c.yM;c.yM=null;if(M.n>8){const r=M.s/M.n,lim=M.dbl?.91:.965;if(r>lim){R.nYellowPen=(R.nYellowPen||0)+1;stewAdd({kind:"yellow",cul:c.id,dbl:M.dbl,ratio:r,at:R.t+rr(12,20)})}}}
  if(k<1&&c.yNo)k=1-(1-k)*.35;return k}
