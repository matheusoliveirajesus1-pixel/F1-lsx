// ===================== IA DE PILOTAGEM =====================
// Cada carro tem posição lateral própria (metros a partir do centro da pista). O piloto escolhe a linha,
// segue sem atravessar o carro da frente, sai do vácuo para emparelhar, mergulha por dentro na freada,
// defende com uma mudança de trajetória, administra pneus e bateria. Nada de sorteio para ultrapassar:
// quem passa é quem tem velocidade e espaço.
const CARW=2.0,CARL=5.6,TRK_H=7.4,YMAX=TRK_H-1.05;
// em disputa (atacar, defender, lado a lado, desviar) o piloto usa a pista inteira: pode deixar metade do carro além da linha branca
const YATK=TRK_H-.1;
function usesWidth(c){if(c.emerg)return true;if(c.neut)return false;return!!(c.atk||c.defend||c.coverY!=null||c.towY!=null||(c.alongs&&c.alongs.length)||c.emerg||c.bypass)}
// mapa de fases da pista: 0 reta/aceleração, 1 frenagem, 2 curva; distância até a próxima freada; lado de dentro da próxima curva
function aiPrep(geo){if(geo.ai)return geo.ai;const N=geo.N,k=geo.k;
  const p=speedProfile(geo,{pw:1,cd:1,cl:1,mass:PH.mass+15},tyreMu("M",0,.2,null),4.0,geo.gk);const v=Float32Array.from(p.v);
  const ph=new Uint8Array(N),cw=new Float32Array(N);
  for(let i=0;i<N;i++){const r=1/Math.max(1e-6,Math.abs(k[i]));cw[i]=clamp((420-r)/340,0,1);const j=(i+1)%N;ph[i]=v[j]<v[i]-.03?1:cw[i]>.12?2:0}
  for(let pass=0;pass<3;pass++)for(let i=0;i<N;i++){const a=ph[(i-1+N)%N],b=ph[(i+1)%N];if(ph[i]!==a&&a===b)ph[i]=a}
  // limpa trechos muito curtos (ruído do traçado) e trata como reta as curvas feitas de pé embaixo (sem freada antes)
  const runs=()=>{const out=[];let s0=0;while(s0<N&&ph[s0]===ph[(s0-1+N)%N])s0++;if(s0>=N)return out;let st=s0;for(let n=1;n<=N;n++){const i=(s0+n)%N;if(ph[i]!==ph[(i-1+N)%N]||n===N){out.push([st,n-(st-s0+N)%N,ph[st]]);st=i}}return out};
  for(let pass=0;pass<4;pass++){const rs=runs();for(let r=0;r<rs.length;r++){const[a,len]=rs[r];if(len>=7)continue;const pv=ph[(a-1+N)%N];for(let q=0;q<len;q++)ph[(a+q)%N]=pv}}
  {const rs=runs();for(const[a,len,v0]of rs){if(v0!==2)continue;if(ph[(a-1+N)%N]!==0)continue;for(let q=0;q<len;q++)ph[(a+q)%N]=0}}
  const isStart=i=>ph[i]===1&&ph[(i-1+N)%N]!==1;let s0=0;for(let i=0;i<N;i++)if(isStart(i)){s0=i;break}
  const nbD=new Float32Array(N);let d=0;for(let n=0;n<N;n++){const i=(s0-n+N)%N;if(n>0){d+=DS;if(isStart(i))d=0}nbD[i]=d}
  const apex=new Int8Array(N);geo.corners.forEach(c=>{apex[c.i]=Math.sign(k[c.i])||1});
  const insN=new Int8Array(N);let last=1;for(let n=0;n<2*N;n++){const i=N-1-(n%N);if(apex[i])last=apex[i];if(n>=N)insN[i]=last}
  const P=geo.P,p0=P[0],h=Math.atan2(P[1].y-P[N-1].y,P[1].x-P[N-1].x);
  geo.pitSide=((geo.ctr.x-p0.x)*-Math.sin(h)+(geo.ctr.y-p0.y)*Math.cos(h))>0?1:-1;
  geo.ai={ph,cw,nbD,insN,vref:v};cornerTypes(geo);return geo.ai}
function aiInit(c,i){const d=c.d;c.y=c.gridLat;c.vy=0;c.lineK=rr(.88,1);c.lineN=0;c.cdAtt=0;c.att=null;c.pressT=0;c.press=0;c.touchCd=0;
  c.aggr=clamp((d.pers?d.pers.aggr/100*.9+.05:.45+(d.a.ovt-75)/70)+rr(-.05,.05),.1,.95);c.form=gauss()*.0048}// agressividade vem da personalidade
function rivals(a,b){return(a.isP&&G.rival===b.id)||(b.isP&&G.rival===a.id)}
// ---------- percepção: quem está à frente, atrás e ao lado (posição física, não a ordem da corrida)
function aiSense(){const L=R.geo.len;const arr=R.cars.filter(c=>running(c)&&!c.pit&&!c.parked);
  for(const c of arr){c.fs=fr(c.prog)*L;c.ahead=c.aheadO=c.aheadQ=c.behind=c.along=null;c.alongs=[];c.dA=c.dAO=c.dAQ=c.dB=1e9}
  arr.sort((a,b)=>a.fs-b.fs);const n=arr.length;
  for(let j=0;j<n;j++){const c=arr[j];
    for(let q=1;q<Math.min(n,7);q++){const o=arr[(j+q)%n];let d=o.fs-c.fs;if(d<0)d+=L;if(d>160)break;const dy=Math.abs(o.y-c.y);
      if(!c.ahead){c.ahead=o;c.dA=d}if(!c.aheadO&&dy<CARW+.3){c.aheadO=o;c.dAO=d}if(!c.aheadQ&&dy<4.6){c.aheadQ=o;c.dAQ=d}if(d<CARL+2+Math.max(0,c.v-o.v)*.6){c.alongs.push(o);if(d<CARL+2&&!c.along)c.along=o}}
    for(let q=1;q<Math.min(n,7);q++){const o=arr[(j-q+n)%n];let d=c.fs-o.fs;if(d<0)d+=L;if(d>160)break;if(!c.behind){c.behind=o;c.dB=d}if(d<CARL+2+Math.max(0,o.v-c.v)*.6){c.alongs.push(o);if(d<CARL+2&&!c.along)c.along=o}}}
  // distância (s) para o carro da frente na ordem da corrida (fila do safety car)
  for(let i=0;i<R.order.length;i++){const c=R.order[i],A=R.order[i-1];if(!running(c))continue;c.scGap=A&&running(A)?(A.prog-c.prog)*c.L:0/* o líder anda no ritmo do safety car; antes ganhava o ritmo de "alcançar a fila" e a fila nunca se juntava */}
  R.phys=arr}
// o caminho de c até a faixa yT está livre de carros andando ao lado (ignora o obstáculo parado Q)
function sideFree(c,yT,Q){const L=R.geo.len,y0=Math.min(c.y||0,yT)-CARW*.6,y1=Math.max(c.y||0,yT)+CARW*.6;for(const o of R.phys||[]){if(o===c||o===Q)continue;let ds=(o.fs??fr(o.prog)*L)-(c.fs??fr(c.prog)*L);if(ds>L/2)ds-=L;if(ds<-L/2)ds+=L;if(ds<-CARL-1||ds>CARL+6)continue;if((o.y||0)>y0&&(o.y||0)<y1&&((o.v||0)>3||ds>0))return false}return true}
function sideRoom(oy,cy){const s=cy>=oy?1:-1;return Math.abs(oy+s*3)>YMAX?-s:s}
// leitura da ultrapassagem: dá para chegar do lado antes da freada? (diferença de velocidade, vácuo, ritmo e bateria)
// "reta": chega emparelhado antes da freada; "freada": chega a 1-1,5 carro e mergulha por dentro; null: não dá nesta reta
function passPlan(c,A,dA,nb,adv){const v=Math.max(30,c.v||0),t=Math.max(0,(nb||0))/v;if(t<=0)return{k:null,g:0};
  const vrel=(c.v||0)-(A.v||0),tow=c.tow||0,ers=c.batt>25?1:c.batt>8?.5:0;
  const acc=tow*.045*v*.35+ers*.35+Math.max(0,adv)/Math.max(60,A.L||80)*v*.25;/* ganho de velocidade relativo por segundo (vácuo, energia, ritmo) */
  const g=vrel*t+.5*acc*Math.min(t,5)*Math.min(t,5);c.ppG=g;
  // frear mais tarde por dentro também ganha metros (quem freia bem ganha mais); a frustração de estar preso atrás faz arriscar um pouco mais
  const brk=v*(.05+((c.d.a.brk||75)-60)/40*.04+(c.d.a.ovt-60)/40*.02)*(1+((c.st&&c.st.frus)||0)/120);
  if(g>=dA-CARL*.2)return{k:"reta",g};if(g+brk>=dA-CARL*1.6)return{k:"freada",g};return{k:null,g}}
// chance de o piloto se comprometer com uma tentativa nesta reta
function attemptProb(c,A,adv,dA){let p=.04+adv*.6+(c.ovMode?.16:0)+(c.mode==="attack"?.1:c.mode==="save"?-.1:0)+(aggrEff(c,A)-.5)*.35+((c.st?c.st.conf:50)-50)/400+((c.d.a.craft||75)-75)/500*(adv>0?1:-1)+(c.batt>45?.05:c.batt<15?-.12:0)+R.C.ovt*.12-(A.d.a.def-75)/160+(dA<25?.05:0);
  const close=Math.max(0,(c.v||0)-(A.v||0));p+=clamp(close/18,0,.15)+(c.tow||0)*.08;// chegando mais rápido e no vácuo: a oportunidade é real
  if(rivals(c,A))p+=.15;if(c.t===A.t)p-=.3;if(R.w>.4)p-=.06;return clamp(p,.02,.92)}
function wantsDefend(c,B){if(B.prog>c.prog+.5||c.prog>B.prog+.5)return false;if(c.t===B.t)return false;if(c.defOrd)return true;const adv=(c.Ls??c.L)-(B.Ls??B.L);
  // decisão pela personalidade (agressivo defende, cuidadoso cede); uma pequena variação de humor por decisão
  return clamp(.55+aggrEff(c,B)*.4-(adv>.7?.35:0)+(rivals(c,B)?.2:0)+feud(c.d.id,B.d.id)*.006-(c.d.trait==="cuidadoso"?.2:0),.05,.95)>=.62+(c.decN||0)}
function deployRate(c){const close=c.ahead&&c.dA<70&&c.atk,threat=c.behind&&c.dB<45;
  switch(c.ers){case"save":return .62;case"attack":return 1.35;case"defend":return threat?1.3:.82;
    default:if(close)return c.batt>35?1.3:c.batt>15?1.1:.85;if(threat)return c.batt>30?1.22:c.batt>12?1.05:.85;
      if(c.goReq)return c.batt<60?.8:1;// guardando bateria para o ataque pedido
      return c.batt<22?.72:c.batt>85?1.12:1}}
// ---------- decisão de cada piloto a cada instante: linha alvo, limite de velocidade e multiplicador
function aiDrive(c,dt){const g=R.geo,AI=g.ai,N=g.N,i=Math.floor(fr(c.prog)*N)%N;const ph=AI.ph[i],ins=AI.insN[i],nb=AI.nbD[i],cw=AI.cw[i];
  const neutral=!R.started||!!R.sc||!!R.red||(R.yellows.length&&inYellow(c));c.neut=neutral;
  const amp=.22+(1-c.d.a.cons/100)*1.5;c.lineN+=(-c.lineN*.6+gauss()*amp*1.2)*dt;c.lineN=clamp(c.lineN,-1.1,1.1);
  const ideal=g.line[i]*c.lineK;let yT=ideal+c.lineN,m=1;
  // carro avariado (no aro, furado, sem roda, asa ou suspensão muito danificadas): anda fora da linha e deixa passar até o box
  if(!c.blue&&c.blueSide&&R.t-c.blueSide.t>2)c.blueSide=null;
  {const D=c.dmg||{},w=D.whl||[0,0,0,0];c.crippled=R.started&&!c.pit&&(!!(c.tyre&&(c.tyre.rim||c.tyre.punct))||(D.off!=null&&D.off>=0)||(D.wing||0)>=.6||(D.rwing||0)>=.5||Math.max(w[0],w[1],w[2],w[3])>.6)}c.vCap=Infinity;c.hard=false;c.dirty=false;c.atk=false;c.defend=false;c.bypass=false;
  const A=c.ahead,dA=c.dA,B=c.behind;c.cdAtt=Math.max(0,c.cdAtt-dt);
  if(ph!==1)c.diveRoll=false;
  if(c.pitCall&&R.started&&pitDist(c)<330)yT=g.pitSide*4.1;
  else if(c.yieldTo){const mt=R.cars.find(x=>x.id===c.yieldTo);if(!mt||!running(mt)||mt.pit||mt.prog>c.prog){c.yieldTo=null}else if((c.prog-mt.prog)*g.len<140){yT=-Math.sign(mt.y||ideal||1)*4.4;m*=.94;if(!c.yielded||c.yielded.to!==mt.id)bubble(c,c.gb&&c.gb.to===mt.id?`Devolvendo a posição para ${mt.code}`:`Ordem de equipe: abrindo para ${mt.code}`,"order",4);c.yielded={to:mt.id,t:R.t}}}
  else if(c.blue){if(!c.blueSide)c.blueSide={s:-(Math.sign(ideal||c.y||1)),t:R.t};c.blueSide.t=R.t;yT=c.blueSide.s*5.6;m*=ph===0?.975:.99}/* bandeira azul: escolhe um lado e fica nele até ser passado (sem ziguezague) */
  else if(c.crippled){yT=-Math.sign(ideal||c.y||1)*4.6}
  else if(!neutral&&A&&dA<120){
    const lapped=A.prog<c.prog-.5,lapping=A.prog>c.prog+.5;
    const slowA=!A.ex&&(lapped||A.lose>0||A.crippled)||(A.pitCall&&pitDist(A)<330)||(A.pitExit&&R.t-A.pitExit<8)||A.yieldTo===c.id||(R.qMode&&A.q&&c.q&&c.q.st==="push"&&A.q.st!=="push");/* classificação: quem não está em volta rápida é carro lento */
    if(slowA){c.bypass=true;if(dA<85&&Math.abs(A.y-c.y)<3.4){const s=A.pitCall?-g.pitSide:A.blue?(A.blueSide?-A.blueSide.s:(-Math.sign(A.y)||1)):sideRoom(A.y,c.y);yT=clamp(A.y+s*3.4,-YMAX,YMAX)}}
    else if(!lapping)battle(c,A,dA,ph,ins,nb);
  }else if(c.att)c.att=null;
  if(c.att&&c.att.commit&&c.att.y!=null)yT=c.att.y;
  else if(!neutral&&ph===0&&A&&dA<75&&dA>CARL+1&&!c.bypass&&!c.blue&&!c.yieldTo&&!(c.pitCall&&R.started&&pitDist(c)<330)&&nb>120)yT=clamp(A.y,-YMAX,YMAX);// pega o vácuo
  // defesa: uma única mudança de trajetória antes da freada, para o lado de dentro
  if(!neutral&&B&&c.dB<34&&c.dB>CARL+4&&ph===0&&nb<280&&nb>60&&!c.coverDone&&!(c.att&&c.att.commit)){c.coverDone=true;const cy=clamp(ins*4.7,-YATK,YATK);if(Math.abs(B.y-cy)>2.4&&wantsDefend(c,B))c.coverY=cy}
  if(!neutral&&ph===0&&B&&c.dB<48&&c.dB>CARL+3&&nb>300&&!c.coverDone&&c.towY==null&&(B.tow||0)>.55&&(B.v||0)>(c.v||0)+1&&!(c.att&&c.att.commit)&&running(B)&&!B.pit){
    if(c.towSeen==null||c.towSeenId!==B.id){c.towSeen=R.t;c.towSeenId=B.id}const defK=clamp(((c.d.a.def||75)-50)/45,0,1);const rt=.5+(1-defK)*1.3+(1-clamp(c.aggr,0,1))*.6;
    const want=c.towReq||(c.t!==B.t&&R.t-c.towSeen>rt&&(defK>.25||c.aggr>.55||rivals(c,B)));
    if(want){c.towReq=false;c.coverDone=true;const s=Math.sign((c.y||0)-(B.y||0))||(rnd()<.5?1:-1);let ty=(c.y||0)+s*3.6;if(Math.abs(ty)>YATK-.3)ty=(c.y||0)-s*3.6;c.towY=clamp(ty,-YATK+.3,YATK-.3);c.towT=R.t;
      bubble(c,"Quebrou o vácuo!","",2.5);if(B.hum)radio(B,`${c.code} mudou de linha e quebrou o nosso vácuo.`,{k:"vacuo"});if(c.hum)radio(c,`Mudei de linha: ${B.code} saiu do vácuo.`,{me:1,k:"vacuo"})}}
  if(c.towY!=null){if(ph!==0||R.t-c.towT>7)c.towY=null;else yT=c.towY}
  if(ph===2){c.coverDone=false;c.coverY=null}
  if(c.coverY!=null){yT=c.coverY;c.defend=true}
  // lado a lado: cada um abre espaço para o outro; quem está espremido contra a borda tira o pé
  // nunca mira o espaço de um carro que está ao lado; quem está atrás na freada/curva cede e se encaixa
  if(c.alongs&&c.alongs.length){const L=g.len;let squeezed=false;
    const sep0=2.4+clamp((sk(c,"craft")-60)/40,0,1)*.4;// quanto espaço o piloto deixa ao lado (menos para quem é agressivo ou rival)
    for(const o of c.alongs){let ds=o.fs-c.fs;if(ds>L/2)ds-=L;if(ds<-L/2)ds+=L;const s=Math.sign(o.y-c.y)||(c.y>=0?-1:1);
      // abrir a trajetória na saída sem deixar espaço (espremer)
      if(c.runWide&&c.runWide.o===o.id&&R.t<c.runWide.until&&ph!==1){yT=clamp(o.y-s*1.75,-YMAX,YMAX);continue}
      const sep=Math.max(2.22,sep0-aggrEff(c,o)*.16-feud(c.d.id,o.d.id)*.002);const lim=o.y-s*sep;
      if(s>0){if(yT>lim)yT=lim}else{if(yT<lim)yT=lim}if(Math.abs(lim)>YATK&&Math.sign(lim)===-s){squeezed=true;c.sqBy=o}
      const inside=c.att&&c.att.commit&&c.att.side===ins&&c.y*ins>o.y*ins;
      const qSlow=x=>R.qMode&&x.q&&x.q.st!=="push";const lappedO=o.blue&&(o.prog<c.prog-.5||(qSlow(o)&&!qSlow(c))),lappingO=c.blue&&(o.prog>c.prog+.5||(qSlow(c)&&!qSlow(o)));
      // amarela (ou safety car): lado a lado, quem está atrás tira o pé e fica atrás (proibido completar a ultrapassagem)
      if((R.sc||(R.yellows.length&&inYellow(c)))&&R.started&&ds>-.3&&Math.abs(ds)<CARL*1.6&&running(o)&&!o.ex&&!(o.lose>0)&&!o.pit&&(o.v||0)>12&&!c.unlap){m*=.95;c.hard=true}
      if(lappingO&&Math.abs(o.y-c.y)<3.6&&Math.abs(ds)<CARL*1.5){m*=ph===0?.97:.95;c.hard=true}/* retardatário: tira o pé e deixa o líder passar */
      else if(ds>1.2&&ph!==0&&!inside&&!lappedO&&Math.abs(o.y-c.y)<3.2){m*=.975;c.hard=true}}
    if(squeezed){squeezeOut(c,c.sqBy,ph);m*=.95;c.hard=true}yT=clamp(yT,-YATK,YATK)}
  // erro de julgamento: fecha a porta / alarga em cima do carro ao lado por um instante
  if(c.squeeze){const o=R.t<c.squeeze.until&&R.cars.find(x=>x.id===c.squeeze.id);if(o&&running(o)&&!o.pit)yT=clamp(o.y,-YMAX,YMAX);else c.squeeze=null}
  if(c.lateBrake){if(R.t>c.lateBrake.until||neutral)c.lateBrake=null;else if(ph===1)m*=1.06}
  if(c.goReq&&!neutral&&ph!==0&&A&&dA<90)m*=1.006;// vai pra cima: entra mais forte nas curvas para encostar
  // recuar: desiste do ataque e tira o pé para ficar atrás
  if((c.backOff||0)>R.t&&A&&dA<CARL*2.5&&!neutral){m*=.985;c.att=null;yT=clamp(A.y||0,-YMAX,YMAX)}
  if(c.hzYT!=null)yT=c.hzYT;
  // custo de sair da linha ideal nas curvas
  const off=Math.min(1,Math.abs(c.y-ideal)/5);m*=1-.085*cw*off*off;if(Math.abs(c.y)>TRK_H)m*=.93;
  // vácuo na reta, ar sujo na curva (só quando está atrás, na mesma faixa)
  const F=c.aheadO,dF=c.dAO;c.tow=0;c.dirtyK=0;
  if(A&&dA<110&&!neutral&&running(A)&&!A.pit){const dy=Math.abs((A.y||0)-(c.y||0));const al=dy<1.1?1:dy<3.2?1-(dy-1.1)/2.1:0;
    if(ph===0&&c.v>40&&al>0){c.tow=al*clamp(1-(dA-10)/95,0,1);m*=1+.045*c.tow}
    else if(ph!==0&&dA<36&&al>.15){const k=al*clamp(1-(dA-6)/30,0,1);m*=1-.005*k*(cw<.5?1.2:1);/* ar sujo: atrapalha, mas deixa o mais rápido encostar */c.dirtyK=k;c.dirty=k>.25}}
  // mergulho por dentro na freada: freia mais tarde, com risco de travar e passar reto
  if(c.att&&c.att.commit&&ph===1&&c.att.side===ins&&A&&dA<CARL*(c.att.go?2.3:1.6)){m*=1+.02*(.6+(c.d.a.ovt*.5+(c.d.a.brk||75)*.5)/250)*(c.att.go?1.35:1);
    if(!c.diveRoll){c.diveRoll=true;if(rnd()<.055*(1+R.w*3)*(1.25-(c.d.a.ovt*.4+(c.d.a.brk||75)*.6)/120)*(.6+aggrEff(c,A))*(c.tyre.wear>.6?1.5:1)*(c.att.go?(dA>CARL*1.6?2.2:1.4):1))lockUp(c,A)}}
  // energia elétrica nas retas: boost, defesa, recarga e clipping (bateria vazia no fim da reta)
  if(ph===0&&c.v>40&&R.started&&!R.sc&&!R.red){const dep=Math.min(1.42,deployRate(c)*planK(c));m*=1+.019*(dep-1)/.35+(c.ovMode?.014:0)-(c.batt<4?.045:0);c.batt-=dt*1.08*dep*(c.ovMode?.8:1)*(1-((c.d.a.ers||75)-75)*.003);c.clip=c.batt<4}else c.clip=false;
  if(c.ers==="save"&&ph===0)c.batt+=dt*.45;
  // reflexo: carro rodado, parado ou destroços à frente (desvia para o lado livre ou freia)
  {const hz=hazardAvoid(c);c.emerg=false;c.hzYT=null;if(hz&&!hz.late){if(hz.yT!=null){yT=hz.yT;c.hzYT=hz.yT;c.emerg=true;c.bypass=true}if(hz.cap!=null){c.hzCap=hz.cap;c.emerg=true}else c.hzCap=null}else c.hzCap=null}
  // seguir sem atravessar o carro da frente (fila apertada em bandeira amarela / safety car)
  const free=c.bypass||(c.att&&c.att.commit);const wide=!free||(neutral&&!c.emerg);/* desviando de um obstáculo: só o carro que está na mesma faixa conta, mesmo na amarela */let Q=wide?c.aheadQ:F,dQ=wide?c.dAQ:dF;
    // bandeira amarela: proibido ultrapassar; o carro da frente conta em qualquer lado da pista (só se passa carro com problema)
    if(R.started&&!R.red&&((R.sc&&!R.sc.unlapOn&&!c.unlap)||(!R.sc&&R.yellows.length&&inYellow(c)))&&!c.emerg){/* safety car e VSC: mantém a posição igual */const H=c.ahead;if(H&&c.dA<(Q?dQ:1e9)&&running(H)&&!H.pit&&!H.ex&&!(H.lose>0)&&(H.v||0)>12&&c.dA<60){Q=H;dQ=c.dA}}
  if(Q&&!(c.lateBrake&&c.lateBrake.id===Q.id)){const close=!neutral&&ph===0&&c.att&&c.att.commit&&Q===A;const tw=!neutral&&ph===0&&Q===A&&(c.tow||0)>.3;const dmin=CARL+(close?1.2+c.v*.045:tw?.8+c.v*.08/* no vácuo encosta mais */:.8+c.v*(R.sc&&R.sc.type==="sc"?.38:neutral?.15:.13));// reação: o piloto percebe a velocidade do carro da frente com um pequeno atraso
    const tau=(.1+(1-clamp((sk(c,"craft")-55)/45,0,1))*.28)*(1+(c.spray||0)*1.6);if(c.pqId!==Q.id){c.pqId=Q.id;c.pqv=Q.v}else c.pqv+=(Q.v-c.pqv)*Math.min(1,dt/tau);const qv=neutral?Q.v:Math.max(Q.v,c.pqv);const qa=Math.min(0,Q.acc||0);/* freada fora do normal do carro da frente (desviando, travando, batendo): o de trás reage a ela */let qx=0;if(Q.prof&&qa<-8){const N=g.N,j=Math.floor(fr(Q.prof?Q.prog:0)*N)%N,v0=Q.prof.v[j],v1=Q.prof.v[(j+1)%N];const exp=Math.min(0,(v1*v1-v0*v0)/(2*DS));qx=qa-exp}
    const dec=neutral||c.spray>.3?28:(c.v||0)>45?34:30;/* em corrida o piloto confia na própria freada: não freia antes só porque o da frente está freando para a curva */let cap=dQ>dmin?Math.sqrt(Math.max(0,qv*qv+2*dec*(dQ-dmin)+(qa<-8&&(neutral||qx<-6)?qa*Q.v*.35:0))):qv-(dmin-dQ)/.6;cap=Math.max(cap,dQ<CARL+1.5?0:dQ<dmin*.6?Q.v*.5:Q.v*.8-1.5);// colado demais: pode frear até parar (antes havia um piso que fazia o de trás bater no da frente)
    // contornando um carro parado/rodado: anda devagar enquanto sai de trás dele (o carro só vai para o lado andando para frente)
    // carro parado/rodado na frente: para deixando espaço para esterçar (nunca de nariz encostado) e só avança para o lado quando o caminho estiver livre
    if(R.started&&((Q.v||0)<4||Q.ex)){const ov=CARW+.3-Math.abs((Q.y||0)-(c.y||0));if(ov>0){const keep=CARL+4.2;let cap2=dQ>keep?Math.sqrt(2*22*(dQ-keep)):0;cap=Math.min(cap,Math.max(cap2,Q.v||0));
      if(c.hzYT!=null&&sideFree(c,c.hzYT,Q)){const room=dQ-CARL-.8;if(room>Math.max(.6,ov*.9))cap=Math.max(cap,Math.min(26,4+room*1.6));else if(room>.15&&ov<1.4)cap=Math.max(cap,1.6)}}}
    if(cap<c.v+25){c.vCap=Math.max(0,cap);if(dQ<dmin+25)c.hard=true}}
  if(c.hzCap!=null){c.vCap=Math.min(c.vCap,c.hzCap);c.hard=true}
  // pressão: carro colado atrás aumenta a chance de erro
  if(B&&c.dB<c.v*.9&&!neutral&&Math.abs(B.prog-c.prog)<.5)c.pressT+=dt;
  if(c.hum&&!neutral){if(A&&dA<c.v)feudMeet(c,A);if(B&&c.dB<c.v*.9)feudMeet(c,B)}
  // habilidade em cada fase: frenagem, entrada de curva e tração/câmbio na saída
  if(c.lastPh===2&&ph===0)c.exitT=R.t+2;if(!neutral&&R.started){const a=c.d.a;if(ph===1)m*=1+((a.brk||75)-75)*.00012;else if(ph===2)m*=1+((a.cor||75)-75)*.00012;else if((c.exitT||0)>R.t)m*=1+(((a.trc||75)+(a.gear||75))/2-75)*.0001}
  if((c.heat||0)>.75)m*=1-.012*((c.heat-.75)/.25);
  // linha por fora: leva mais velocidade em curva média/rápida, perde em curva lenta
  if(c.att&&c.att.commit&&ph===2&&A&&dA<CARL*1.4&&c.att.side===-ins){const cn=cornerAt(g,i)||nextCorner(c);if(cn)m*=cn.type==="media"||cn.type==="rapida"?1.006:cn.type==="alta"?1:.993}
  // troco: quem acabou de ser passado num mergulho cruza a linha e sai melhor da curva
  if(c.cut&&R.t<c.cut.until&&!neutral){if(ph===2)yT=clamp(ins*3,-YMAX,YMAX);else if(ph===0&&(c.exitT||0)>R.t)m*=1.01}
  if((c.diveExitT||0)>R.t&&ph===0)m*=.992;
  // segurar a posição: freia mais tarde quando o rival está colado
  if(c.defOrd&&ph===1&&B&&c.dB<CARL*2.5&&!neutral)m*=1.004;
  m*=pistaDrive(c,ph,i,dt);if((c.wideBoost||0)>R.t)m*=1.02;// sem tirar o pé, pela área de escape
  if(c.lastPh===1&&ph===2)apexRight(c,i);
  if(c.lastPh!=null&&c.lastPh!==ph&&typeof riskCheck==="function"){const ev=c.lastPh===0&&ph===1?"brake":c.lastPh===1&&ph===2?"apex":c.lastPh===2&&ph===0?"exit":null;if(ev)riskCheck(c,ev,i)}
  c.yT=yT;c.lastPh=ph;return m}
function battle(c,A,dA,ph,ins,nb){const adv=(A.Ls??A.L)-(c.Ls??c.L);
  // ataque pedido: vai quando dá para chegar do lado até a freada, ou mergulha no fim da reta se estiver a menos de 2-3 carros
  const go=c.goReq&&ph===0&&A.t!==c.t&&((dA<Math.min(60,CARL+6+(nb||0)*.03)&&dA/Math.max(30,c.v)<.3)||((nb||0)<170&&dA<CARL*2.3+Math.max(0,c.v-A.v)*.5));
  if(!c.att||c.att.id!==A.id||(go&&!c.att.commit)){if(ph===0&&dA<75&&(c.cdAtt<=0||go)){const plan=passPlan(c,A,dA,nb,adv);let p=go?Math.max(.93,attemptProb(c,A,adv,dA)):clamp(attemptProb(c,A,adv,dA)*styleK(c,adv),.01,.95);c.decN=gauss()*.05;
      // a leitura manda: se dá para chegar do lado, vai; se dá para mergulhar, a personalidade decide; companheiro de equipe só sem ordem contrária
      const mate=c.t===A.t;if(plan.k==="reta")p=Math.max(p,mate?.5:.92);else if(plan.k==="freada")p=Math.max(p,(mate?.3:.58)+(aggrEff(c,A)-.5)*.35+(c.d.a.ovt-75)/250);
      // oportunidade real: vale a pena pela vantagem e pela personalidade, e só se houver espaço do lado escolhido
      let side=plan.k==="freada"?ins/* mergulho é por dentro */:atkSide(c,A,ins);const room=sd=>{const y=(A.y||0)+sd*2.8;if(Math.abs(y)>YATK)return false;return!(A.alongs||[]).some(o=>o!==c&&Math.abs((o.y||0)-y)<CARW+.2)};if(!room(side)&&room(-side))side=-side;
      const take=(c.backOff||0)<R.t&&room(side)&&(plan.k||go)/* sem chance real não sai da linha: segue colado e pressiona */&&p>=.42-(aggrEff(c,A)-.5)*.3+c.decN;c.att={id:A.id,commit:take,side,t:R.t,y:null,go:take&&go,plan:plan.k};if(!take)c.cdAtt=plan.k?rr(.6,1.2):(c.v||0)>(A.v||0)+1?rr(.8,1.6):rr(1.8,3.5);/* reavalia logo: a chance pode aparecer mais adiante na mesma reta */
      if(go&&!take)c.goReq=false;
      if(take&&go){c.goReq=false;c.goT=R.t;R.goN=(R.goN||0)+1;bubble(c,"Vai pra cima!","pass",2.5);if(c.hum)radio(c,`Vou pra cima do ${A.code}!`,{me:1,k:"duelo"})}}
    else return}
  const a=c.att;
  // "X": o da frente fechou por dentro na freada; quem está colado entra aberto e cruza a trajetória para sair melhor da curva
  if(ph===1&&!(a&&a.commit)&&(A.coverY!=null||A.defend)&&dA<CARL*2.6&&A.t!==c.t&&(!c.cut||R.t>c.cut.until+3)&&(c.backOff||0)<R.t){c.cut={until:R.t+5,x:1};if(c.hum)radio(c,`Ele fechou por dentro, vou cruzar na saída!`,{me:1,k:"duelo"})}
  if(!a.commit){if(c.cdAtt<=0&&ph===0)c.att=null;return}
  c.atk=true;
  // fica no vácuo até chegar perto (ou até a freada estar próxima) e só então sai para o lado: estilingue
  if(ph===0){const pull=dA<70&&(a.y!=null||dA<CARL+2.5||(nb||0)<120+c.v*.9);
    if(pull&&a.y==null&&a.plan!=="freada"){a.side=atkSide(c,A,ins)}// escolhe o lado na hora de sair do vácuo
    if(pull){let ty=(A.y||0)+a.side*2.9;if(a.side===ins&&(nb||0)<160)ty=a.side*Math.max(a.side*ty,YATK-.7);else if(a.side===-ins)ty=a.side*Math.max(a.side*ty,Math.min(YATK-.4,Math.abs(A.y||0)+3.4));a.y=clamp(ty,-YATK,YATK)}else a.y=null;if(R.t-a.t>(a.go?20:14)){a.commit=false;c.cdAtt=rr(3,6)}}
  else if(ph===1){const diving=a.side===ins&&dA<CARL*(a.go?2.3:a.plan==="freada"?2.0:1.8)&&((c.v||0)>(A.v||0)-.5||dA<CARL*1.4);/* mergulho: segue enquanto ainda está encostando na freada */
    if(dA>CARL*1.05&&!diving){a.commit=false;a.y=null;c.cdAtt=rr(3,6);if(a.go&&c.hum)radio(c,`Não deu para colocar o carro do lado do ${A.code}.`,{me:1,k:"duelo"})}}
  else if(dA>CARL*1.3){a.commit=false;a.y=null;c.cdAtt=rr(2,5)}}
function lockUp(c,A){bubble(c,"Travou as rodas!","bad",3.5);R.fxq.push({type:"puff",f:fr(c.prog),lat:c.y||0,t0:R.t});c.att=null;c.cdAtt=6;const f=fr(c.prog);exStart(c,"off",{dir:sideAt(f),why:"travada"});R.fxq.push({type:"skid",f,lat:c.y,t0:R.t,turn:1});
  const p=pos(c);if(c.hum)radio(c,`Travei as rodas tentando passar o ${A.code}!`,{k:"escape"});else if(p<=8||A.isP)narr(`${c.code} trava as rodas no mergulho e passa reto! ${A.code} respira.`,2);c.tyre.wear=Math.min(1,c.tyre.wear+.02)}
// ---------- movimento lateral (suave, com limite de velocidade lateral)
// (o movimento lateral agora é do núcleo de dinâmica, dyn.js: a IA só escolhe a linha c.yT)
// ---------- toques: só quando dois carros realmente se encostam
// (contato antigo por sorteio removido: os toques são físicos em contact.js physContacts)
function aiPasses(){const ord=R.order,rank=new Map();ord.forEach((c,i)=>rank.set(c,i));const pr=R.prevRank;
  const skip=x=>x.pit||(x.pitCall&&pitDist(x)<360)||x.lose>0||!!x.vis||!!x.ex||(x.pitExit&&R.t-x.pitExit<10)||x.parked;
  if(pr)for(const B of ord){if(!running(B)||B.pit)continue;const p0=pr.get(B),p1=rank.get(B);if(p0==null||p1>=p0)continue;
    for(let j=p1+1;j<=p0&&j<ord.length;j++){const A=ord[j];const a0=pr.get(A);if(a0==null||a0>=p0||!running(A))continue;if(skip(A)||skip(B)||Math.abs(A.prog-B.prog)>.3)continue;
      B.cands=B.cands||[];if(!B.cands.some(x=>x.A===A))B.cands.push({A,t:R.t})}}
  for(const B of ord){if(!B.cands||!B.cands.length)continue;B.cands=B.cands.filter(x=>{if(!running(B)||!running(x.A)||rank.get(B)>rank.get(x.A)||R.t-x.t>12)return false;const lead=(B.prog-x.A.prog)*R.geo.len;if(lead<CARL+4){x.t2=null;return true}x.t2=x.t2||R.t;if(R.t-x.t2>=1.2){completePass(B,x.A);return false}return true})}
  R.prevRank=rank}
// ---------- ritmo e energia de cada piloto: brain.js (driverBrain), igual para a IA e para os jogadores
// ---------- estrategistas: reagem às paradas dos rivais
function aiReact(c){if(c.hum||c.pitCall||c.pit||!running(c))return;const left=R.L-c.lap;if(left<4||R.w>.2||!COMP[c.tyre.c].dry)return;const skill=(70+c.t.rep/4)/100;
  const threat=R.cars.find(x=>x!==c&&running(x)&&x.pitRival===c.id&&x.pitGap<3.2&&x.pitT>R.t-c.L*1.05&&!x.reactDone);
  if(threat&&c.tyre.age>=4){threat.reactDone=true;if(rnd()<.25+skill*.5){c.pitCall=pickDry(left);c.inLap=true;const st=c.plan&&c.plan.stops[c.planIdx];if(st&&Math.abs(st.lap-c.lap)<6)c.planIdx++;
      if(pos(c)<=8||threat.hum)narr(`${c.t.n} reage ao undercut de ${threat.code}: ${c.code} vai para os boxes!`,1);if(threat.hum)radio(threat,`${c.code} respondeu e vai parar nesta volta para cobrir o undercut.`,{k:"undercut"})}
    else if(threat.hum)radio(threat,`${c.code} não reagiu à nossa parada. Ataque com pneu novo: é a chance do undercut!`,{k:"undercut"})}}
// ---------- ordens de equipe entre pilotos da mesma equipe
function aiTeamOrders(c){if(!running(c)||c.pit||c.yieldTo)return;const mt=R.cars.find(x=>x!==c&&x.t===c.t&&running(x)&&!x.pit);if(!mt)return;
  const i=R.order.indexOf(c);if(R.order[i+1]!==mt){c.ordN=0;return}const gap=(c.prog-mt.prog)*mt.L;if(gap>1.3){c.ordN=0;return}
  if((mt.Ls??mt.L)<(c.Ls??c.L)-.3)c.ordN=(c.ordN||0)+1;else c.ordN=0;if(c.ordN<2||c.hum)return;
  const style=c.t.style;if(!["calculista","frio","exigente"].includes(style)&&rnd()<.6)return;
  if(c.hum)return;// o jogador recebe a pergunta pelo rádio
  if(mt.hum){c.yieldTo=mt.id;radio(mt,`${G.engineer||"Engenheiro"}: "Pedimos para ${c.code} abrir para você. Ele vai deixar passar."`,{k:"ordem"});rcMsg(`Ordem de equipe na ${c.t.n}: ${c.code} abre para ${mt.code}.`);return}
  c.yieldTo=mt.id;if(pos(c)<=10)narr(`Ordem de equipe na ${c.t.n}: ${c.code} vai deixar ${mt.code} passar.`,1)}
