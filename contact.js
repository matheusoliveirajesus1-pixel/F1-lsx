// ===================== CORRIDA FÍSICA: CONTATO, DANOS POR PEÇA, ESCAPADAS, DETRITOS, REFLEXO E COMISSÁRIOS =====================
// Os carros são corpos sólidos: nunca se atravessam. Cada encostada é calculada pela velocidade, pelo ângulo e pelo ponto de contato,
// e o estrago sai disso (asa de um lado, bico, furo, suspensão, roda arrancada, radiador...). Rodar, passar reto e bater no muro
// são movimentos de verdade: o carro desliza, gira, para e volta à pista. Quem vem atrás reage com o seu tempo de reflexo.
// O acaso só pode começar um erro humano (travar a roda, perder a traseira). O que acontece depois é física.
const WHEEL={FL:0,FR:1,RL:2,RR:3},WNAME=["dianteiro esquerdo","dianteiro direito","traseiro esquerdo","traseiro direito"],WNAMEF=["dianteira esquerda","dianteira direita","traseira esquerda","traseira direita"];
const AXF=1.75,AXR=-1.65,WB=AXF-AXR;// eixos (m a partir do centro do carro)
function dmgInit(c){const d=c.dmg;d.wingL=d.wingL||0;d.wingR=d.wingR||0;d.nose=d.nose||0;d.cool=d.cool||0;d.side=d.side||0;if(!d.whl)d.whl=[0,0,0,0];d.off=d.off||-1;d.loose=d.loose||0}
// resume as peças nos valores que o resto do jogo já usa (tempo de volta, visual, multijogador)
function dmgSync(c){const d=c.dmg;dmgInit(c);d.wing=Math.min(1,Math.max(d.wing||0,Math.max(d.wingL,d.wingR)*.8+Math.min(d.wingL,d.wingR)*.2+d.nose*.5));d.susp=Math.min(1,Math.max(...d.whl));d.body=Math.min(1,Math.max(d.body||0,d.side));recalc(c)}
// ---------- paredes e escape (em metros a partir do centro da pista)
function wallM(c,sign){const f=fr(c.prog);let w=null;if(typeof sceneWallLat==="function"&&typeof TRACKGEO!=="undefined"&&TRACKGEO&&TRACKGEO.scn)w=sceneWallLat(f,sign);if(w!=null)return w/WS;
  const g=R.geo,i=Math.floor(f*g.N)%g.N;const cn=cornerAt(g,i);if(R.C.street)return TRK_H+2.4;if(cn&&(cn.ro==="muro"))return TRK_H+4;if(cn&&cn.ro==="brita")return TRK_H+16;return TRK_H+20}
function surfAt(c){const ay=Math.abs(c.y||0);if(ay<=TRK_H)return"pista";const g=R.geo,i=Math.floor(fr(c.prog)*g.N)%g.N;const cn=cornerAt(g,i);if(R.C.street)return"asfalto";if(cn&&cn.ro==="brita"&&ay>TRK_H+2)return"brita";if(cn&&cn.ro==="asfalto")return"asfalto";return ay>TRK_H+3?"grama":"zebra"}
// ---------- escapadas: rodada, passar reto, alargar e bater
function exStart(c,type,o){if(c.ex||!running(c)||c.pit||c.parked)return false;o=o||{};const v=Math.max(0,c.v||0),dir=o.dir||(sideAt(fr(c.prog))||1);const wet=R.w>.3;
  const ex={type,dir,t:0,t0:R.t,ph:"slide",yaw:0,yr:0,vy:(c.vy||0),dec:8,ro:o.ro||null,fast:o.fast||0,why:o.why||"",cause:o.cause||null,v0:v};
  if(type==="spin"){ex.yr=dir*(3.2+v/25)*(o.k||1);ex.vy+=dir*(1.2+v*.05);ex.dec=wet?7:10}
  else if(type==="off"){ex.yr=dir*.12;ex.vy+=dir*(.6+v*.012);ex.dec=wet?15:24}// travou ou errou a freada: continua freando forte (2,5 g), só sem conseguir fazer a curva
  else if(type==="wide"){ex.yr=dir*.08;ex.vy+=dir*(1.6+v*.022);ex.dec=2.2}
  else if(type==="crash"){ex.yr=dir*(.8+v/60);ex.vy+=dir*(5+v*.17);ex.dec=4}
  if(type!=="wide"){ex.V=Math.hypot(v,ex.vy);ex.phi=Math.atan2(ex.vy,Math.max(.1,v))}c.ex=ex;c.vis=null;c.att=null;c.cdAtt=8;c.lose=0;R.exN=(R.exN||0)+1;if(type!=="wide")addYellow(fr(c.prog),R.t+(type==="crash"?30:16));return true}
// sinal da curvatura: para que lado um carro que segue reto se afasta da pista (lado de fora da curva)
function exKS(){if(R._kS)return R._kS;let s=1;try{const k=R.geo.kc||R.geo.k;let bi=0;for(let i=0;i<k.length;i++)if(Math.abs(k[i])>Math.abs(k[bi]))bi=i;const o=sideAt(bi/R.geo.N);s=(o||1)*Math.sign(k[bi]||1)}catch(e){}R._kS=s||1;return R._kS}
// passo da escapada: devolve a velocidade e prepara a posição lateral
function exStep(c,dt,vp){const ex=c.ex;ex.t+=dt;const sf=surfAt(c);let v=vp;const ay=Math.abs(c.y||0);
  if(ex.ph==="slide"){const k=sf==="brita"?2.2:sf==="grama"?1.25:1;v=Math.max(0,vp-ex.dec*k*dt);
    // INÉRCIA: o carro sem controle segue reto no mapa; a pista é que curva por baixo dele (sai pela tangente da curva)
    if(ex.V!=null){const side=Math.abs(Math.sin(ex.yaw))>.55?1.45:1;ex.V=Math.max(0,ex.V-ex.dec*k*side*dt);const N=R.geo.N,i=Math.floor(fr(c.prog)*N)%N,kc=(R.geo.kc||R.geo.k)[i]||0;
      let fk=1;if(ex.type==="off"){// passou reto: o carro só sai da curva pelo excesso de velocidade (subesterço); o piloto esterça com a aderência que sobra
        const need=ex.V*ex.V*Math.abs(kc),have=Math.pow(speedAt(c,fr(c.prog)),2)*Math.abs(kc)*(sf==="pista"?.8:.55);fk=need>1e-6?clamp(1-have/need,0,1):0;if(fk<.05)ex.phi*=Math.exp(-dt*1.4)}
      ex.phi=clamp(ex.phi+exKS()*kc*ex.V*Math.cos(ex.phi)*dt*fk,-1.45,1.45);v=Math.max(0,ex.V*Math.cos(ex.phi));ex.vyI=ex.V*Math.sin(ex.phi);
      // passou reto com o carro sob controle: freia em linha reta e, quando a velocidade cai, volta a esterçar sem parar o carro
      if(ex.type==="off"&&ex.t>.6&&ex.V<Math.max(9,speedAt(c,fr(c.prog))*(sf==="brita"?.3:.5))){ex.ph="rejoin";ex.wt=R.t;ex.vyI=null;ex.V=null;ex.yr=0}}
    if(ex.type==="wide"){v=Math.max(v,speedAt(c,fr(c.prog))*.62);if(ex.t>.8||ay>TRK_H+2.6){ex.ph="rejoin";ex.wt=R.t}}
    ex.yaw+=ex.yr*dt;ex.yr*=Math.exp(-dt*(ex.type==="spin"?(v<15?2.4:.8):2));
    if(ex.vyI!=null)ex.vy=ex.vyI;else{const ld=(sf==="brita"?10:sf==="grama"?3.2:4.2)*(1-R.w*.35);const s0=Math.sign(ex.vy);ex.vy-=s0*Math.min(Math.abs(ex.vy),ld*dt)}// atrito lateral
    if(ex.type!=="wide"&&(ex.V!=null?ex.V:v)<1.2){v=0;ex.ph="stop";const nerv=c.st?c.st.nerv:30;ex.until=R.t+(ex.type==="spin"?1.3+nerv*.012:.7);
      if(sf==="brita"&&ay>TRK_H+7&&ex.v0>30&&rnd()<.45){exStuck(c);return 0}}}
  else if(ex.ph==="stop"){v=0;ex.vy=0;ex.yr=0;ex.V=null;ex.vyI=null;if(R.t>=ex.until&&exSafe(c)){ex.ph="rejoin";ex.wt=R.t}}
  else if(ex.ph==="rejoin"){// vira o carro de volta, sai do zero e volta para a beira da pista
    let y0=((ex.yaw%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI;const turn=Math.sign(y0)*Math.min(Math.abs(y0),dt*(ex.type==="wide"?3:1.8));ex.yaw=y0-turn;
    const lim=speedAt(c,fr(c.prog))*(ay>TRK_H?.55:.8);v=Math.abs(ex.yaw)>.7?Math.max(0,vp-6*dt):Math.min(lim,vp+(sf==="brita"?3:6.5)*dt);
    const tgt=Math.sign(c.y||ex.dir)*(YMAX-.4);ex.vy=clamp((tgt-c.y)*1.4,-3.2,3.2);
    // não entra em cima de um carro que está do lado: espera ele passar
    {const sg=Math.sign(ex.vy),L=R.geo.len;if(sg)for(const o of c.alongs||[]){let ds=fr(o.prog)*L-fr(c.prog)*L;if(ds>L/2)ds-=L;if(ds<-L/2)ds+=L;const dy=((o.y||0)-(c.y||0))*sg;if(Math.abs(ds)<CARL+1&&dy>0&&dy<CARW+1.2){ex.vy=0;break}}}if(ex.type==="off"&&Math.abs(c.y)>TRK_H+1)v=Math.max(v,Math.min(lim,vp));
    if(Math.abs(c.y)<=YMAX+.05&&Math.abs(ex.yaw)<.08&&v>lim*.6){c.ex=null;c.yaw=0;c.vy=ex.vy*.4;return v}}
  ex.ny=(c.y||0)+ex.vy*dt;
  // muro ou barreira
  const s=Math.sign(ex.ny)||ex.dir,wl=wallM(c,s);if(Math.abs(ex.ny)>=wl-CARW/2){const imp=Math.abs(ex.vy)+v*.07*Math.min(1,Math.abs(Math.sin(ex.yaw))+.3);ex.ny=s*(wl-CARW/2);ex.vy=-ex.vy*.25;if(ex.V!=null){ex.V*=.5;ex.phi=-ex.phi*.25;ex.vyI=ex.vy}exWall(c,imp,v);if(!running(c))return 0;v*=.55}
  return v}
function exApplyLat(c){if(!c.ex||c.ex.ny==null)return;c.y=c.ex.ny;c.vy=c.ex.vy;c.yaw=c.ex.yaw}
// só volta à pista quando não vem ninguém (piloto impaciente arrisca mais)
function exSafe(c){const L=R.geo.len,wait=R.t-c.ex.until,disc=(c.d.pers||{}).disc??65;if(wait>(disc<45?3.5:7))return true;if(Math.abs(c.y||0)<TRK_H-1)return true;// parado no meio da pista: sai logo
  for(const o of R.cars){if(o===c||!running(o)||o.pit||o.ex||(o.v||0)<6)continue;let d=fr(c.prog)*L-fr(o.prog)*L;if(d<0)d+=L;if(d>0&&d<Math.max(40,(o.v||0)*2.3)&&Math.abs((o.y||0)-Math.sign(c.y||1)*YMAX)<4)return false}return true}
function exStuck(c){const f=fr(c.prog);R.errLog&&R.errLog.beach++;rcMsg(`${c.code} atolou na brita!`,"bad","escape");narr(`${c.code} ATOLOU NA BRITA! A corrida acabou para ele.`,3);hlight("crash",[c],`${c.code} preso na brita`,3);c.ex=null;dnf(c,"Atolou na brita","beach");crowdEv(f,.9);triggerSC(c.y&&Math.abs(c.y)>TRK_H+9?"vsc":"sc")}
// batida no muro: a força do impacto decide se acaba ou se segue avariado
function exWall(c,imp,v){if(typeof sndHitAt==="function")sndHitAt(c,clamp(imp/22,.2,1));const f=fr(c.prog),cn=nextCorner(c),nm=cn?`na ${cn.n}`:"";R.fxq.push({type:"sparks",f,lat:c.y||0,t0:R.t});R.fxq.push({type:"parts",f,lat:c.y||0,t0:R.t,col:c.col,col2:c.col2});
  const ro=R.C.street?"muro":(c.ex&&c.ex.ro)||"barreira";
  if(imp>11){c.crashRo=ro==="muro"?"muro":"brita";c.crashFire=imp>24&&(c.fuel||0)>20;c.crashFast=clamp(imp/26,0,1);R.errLog&&R.errLog.dnf++;c._crashPhys=1;
    rcMsg(`ACIDENTE: ${c.code} bateu ${ro==="muro"?"no muro":"na barreira"} ${nm}!`,"bad","escape");narr(imp>18?`BATIDA FORTE! ${c.code} vai direto para o muro ${nm}!`:`${c.code} bate ${nm} e está fora!`,3);hlight("crash",[c],`Acidente de ${c.code}`,3);
    const cause=c.ex&&c.ex.cause;c.ex=null;dnf(c,cause?"Acidente (toque)":"Acidente","crash");crowdEv(f,1);stEv(c,"err","crash");
    if(typeof accFlag==="function")accFlag(c,imp);else if(imp>30&&!R.C.street)redFlag(`acidente de ${c.code}`);else if(imp>20||R.C.street||Math.abs(c.y||0)<TRK_H+3)triggerSC(imp>26||R.C.street?"sc":"vsc");else addYellow(f,R.t+60,true);debrisAdd(c,f,c.y||0,4,true);return}
  // segue com o carro machucado
  dmgInit(c);const s=Math.sign(c.y||1);const corner=s>0?(imp>4?WHEEL.FL:WHEEL.RL):(imp>4?WHEEL.FR:WHEEL.RR);if(imp<2.5){bubble(c,"Raspou no muro","warn",2);return}c.dmg.whl[corner]=Math.min(1,c.dmg.whl[corner]+(imp-2)*.075);
  if(s>0)c.dmg.wingL=Math.min(1,c.dmg.wingL+(imp-2)*.09);else c.dmg.wingR=Math.min(1,c.dmg.wingR+(imp-2)*.09);c.dmg.side=Math.min(1,c.dmg.side+imp*.04);dmgSync(c);
  bubble(c,"Bateu no muro!","bad",3);if(c.hum)radio(c,`Encostei no muro ${nm}! ${c.dmg.whl[corner]>.5?"A suspensão sentiu.":"Acho que só arranhou."}`,{pause:imp>5,k:"dano"});if(imp>4)debrisAdd(c,f,c.y||0,1,true);wheelCheck(c)}
// ---------- detritos na pista
function debrisAdd(c,f,y,n,sharp){R.debris=R.debris||[];const L=R.geo.len;for(let k=0;k<n;k++)R.debris.push({fs:(fr(f)*L+k*2.5+L)%L,y:clamp(y+(k-n/2)*.9,-TRK_H,TRK_H),until:R.t+70+k*5,sharp:!!sharp,col:c?c.col:"#333",col2:c?c.col2:"#111"});if(R.debris.length>40)R.debris.splice(0,R.debris.length-40)}
function debrisTick(dt){const D=R.debris;if(!D||!D.length)return;const L=R.geo.len;for(let k=D.length-1;k>=0;k--){if(R.t>D[k].until||(R.sc&&R.t>D[k].until-50))D.splice(k,1)}
  for(const c of R.phys||[]){if(c.ex||!running(c))continue;const fs=fr(c.prog)*L;for(const d of D){let dd=fs-d.fs;if(dd<0)dd+=L;if(dd>Math.max(1.5,c.v*dt+1))continue;if(Math.abs((c.y||0)-d.y)>1.0)continue;
      if(d.hit&&d.hit[c.id])continue;(d.hit=d.hit||{})[c.id]=1;if(d.sharp&&c.v>22&&!c.tyre.punct){c.tyre.punct=true;c.tyre.pw=WHEEL.FL+(Math.abs(c.y-d.y)<.5?0:1);recalc(c);bubble(c,"Furou nos destroços!","bad",3);rcMsg(`${c.code} passou por cima de destroços e furou o pneu.`,"warn","dano");if(c.hum)radio(c,"Passei por cima de um pedaço de carro! Pneu furado!",{pause:true,k:"dano"});if(!c.pitCall)c.pitCall=COMP[c.tyre.c].dry?pickDry(R.L-c.lap):c.tyre.c}
      else c.tyre.wear=Math.min(1,c.tyre.wear+.01)}}}
// ---------- reflexo: perceber o perigo à frente e decidir desviar ou frear
function reactTime(c){const s=c.st||{};const craft=clamp((sk(c,"craft")-55)/45,0,1);return(.17+(1-craft)*.2+(100-(s.foco??90))*.0025+(s.fat||0)*.0015)*(1+(c.spray||0)*1.4)}
function hazardAvoid(c){if(!R.started||c.pit||c.ex)return null;const L=R.geo.len,fs=fr(c.prog)*L,look=Math.max(45,(c.v||0)*2.6);const hs=[];
  for(const o of R.phys||[]){if(o===c)continue;const slow=o.ex||(R.started&&!R.sc&&(o.v||0)<Math.max(12,(c.v||0)*.55)&&!o.pit&&!o.parked&&o.lap>0)||(R.sc&&(o.v||0)<4&&!o.pit);if(!slow)continue;let d=fr(o.prog)*L-fs;if(d<0)d+=L;if(d>look||d<1)continue;
    const oy=(o.y||0)+(o.ex?o.ex.vy*Math.min(1.2,d/Math.max(8,c.v)):0);if(Math.abs(oy-(c.y||0))>CARW+3.2&&Math.abs((o.y||0)-(c.y||0))>CARW+3.2)continue;hs.push({id:o.id,d,y:oy,y0:o.y||0,v:o.v||0,o})}
  if(R.debris)for(const b of R.debris){let d=b.fs-fs;if(d<0)d+=L;if(d>look||d<1)continue;if(Math.abs(b.y-(c.y||0))>CARW+1.5)continue;hs.push({id:"d"+b.fs.toFixed(0),d,y:b.y,v:0,small:true})}
  if(!hs.length){c.hzSeen=null;return null}
  // o perigo principal é o carro mais próximo (destroços pequenos só pedem um desvio, nunca escondem um carro parado logo atrás)
  hs.sort((a,b)=>a.d-b.d);const cars=hs.filter(h=>!h.small);const hz=cars[0]||hs[0];
  if(!c.hzSeen||c.hzSeen.id!==hz.id){const blocked=c.aheadO&&c.aheadO!==hz.o&&c.dAO<hz.d;c.hzSeen={id:hz.id,t:R.t,rt:reactTime(c)*(blocked?1.35:1)}}
  if(R.t-c.hzSeen.t<c.hzSeen.rt)return{late:true};// ainda não viu
  const ttc=hz.d/Math.max(1,(c.v||0)-hz.v);let best=null,bc=1e9;
  for(let y=-(YMAX+2.5);y<=YMAX+2.5;y+=.5){if(Math.abs(y-(c.y||0))>6.2*ttc*.85)continue;let bad=false,cost=Math.abs(y-(c.y||0))+(Math.abs(y)>YMAX?2.5:0);
    for(const h of hs){const need=h.small?CARW*.5+.9:CARW+.5;const near=Math.min(Math.abs(y-h.y),Math.abs(y-h.y0??h.y));if(near<need){if(h.small)cost+=3;else{bad=true;break}}}if(bad)continue;
    for(const o of c.alongs||[]){if(Math.abs((o.y||0)-y)<CARW+.2){bad=true;break}}if(bad)continue;
    if(cost<bc){bc=cost;best=y}}
  const capCar=cars.length?Math.sqrt(Math.max(0,2*42*(cars[0].d-CARL-.5)))+cars[0].v*.6:null;
  if(best!=null)return{yT:best,cap:ttc<.9&&!hz.small?Math.max(hz.v+8,(c.v||0)*.9):null};
  return{cap:capCar}}
// ---------- contato físico entre carros (rodado a cada passo, depois do movimento)
// depois de um choque, a escapada continua com a velocidade e a direção resultantes
function exSync(c){const ex=c.ex;if(!ex||ex.V==null||ex.ph!=="slide")return;const v=Math.max(0,c.v||0),vy=c.vy||0;ex.V=Math.hypot(v,vy);ex.phi=clamp(Math.atan2(vy,Math.max(.1,v)),-1.45,1.45);ex.vyI=ex.V*Math.sin(ex.phi);ex.vy=ex.vyI}
function physContacts(){const P=R.phys;if(!P||P.length<2)return;const L=R.geo.len;R.cpair=R.cpair||{};
  for(const c of P)c.fsN=fr(c.prog)*L;
  const n=P.length;for(let a=0;a<n;a++){const c=P[a];if(!running(c)||c.pit)continue;
    for(let q=1;q<=3;q++){const o=P[(a+q)%n];if(o===c||!running(o)||o.pit)continue;let ds=o.fsN-c.fsN;if(ds>L/2)ds-=L;if(ds<-L/2)ds+=L;if(Math.abs(ds)>=CARL)continue;
      const dy=(o.y||0)-(c.y||0);if(Math.abs(dy)>=CARW)continue;
      const key=c.id<o.id?c.id+"|"+o.id:o.id+"|"+c.id;const was=(R.cpair[key]||-9)>R.t-.3;R.cpair[key]=R.t;
      const rear=ds>=0?c:o,front=rear===c?o:c,dsa=Math.abs(ds),ov=CARL-dsa,oy=CARW-Math.abs(dy);const pre={rv:rear.vy||0,fv:front.vy||0,rearAtt:!!(rear.att&&rear.att.commit),frontCov:front.coverY!=null};
      if(ov/CARL<oy/CARW){// batida de frente/traseira
        const close=Math.max(0,(rear.v||0)-(front.v||0));rear.prog-=ov*.75/L;front.prog+=ov*.25/L;rear.fsN-=ov*.75;
        if(close>0){const va=((rear.v||0)+(front.v||0))/2;rear.v=Math.max(0,va-close*.12);front.v=va+close*.12}
        exSync(rear);exSync(front);if(!was||close>2)contactEvent(rear,front,"long",close,{off:(front.y||0)-(rear.y||0),ds:dsa,pre})}
      else{// lado a lado
        const s=Math.sign(dy)||1;const push=oy/2+.02;if(!c.ex||!o.ex){c.y=(c.y||0)-s*push;o.y=(o.y||0)+s*push}
        const close=Math.max(0,((c.vy||0)-(o.vy||0))*s);if(close>0){const avg=((c.vy||0)+(o.vy||0))/2;c.vy=avg-s*close*.3;o.vy=avg+s*close*.3}
        exSync(c);exSync(o);const dv=Math.abs((c.v||0)-(o.v||0));const slowBoth=(c.v||0)<8&&(o.v||0)<8;if(!was||(close>1.5&&!slowBoth)||close>4)contactEvent(rear,front,"lat",close+dv*.08,{ds:dsa,side:s,dy,pre,mover:((c.vy||0)*s>(-(o.vy||0)*s))?c:o})}}}}
// ---------- dano por peça a partir do impacto
function contactEvent(rear,front,mode,E,g){R.nTouch=(R.nTouch||0)+1;if(typeof sndHitAt==="function")sndHitAt(front,clamp(E/3,.05,.8));dmgInit(rear);dmgInit(front);const f=fr(front.prog),out=[];const add=(car,t)=>out.push([car,t]);
  if(E<.35&&mode==="lat"){if(!rear._rub||R.t-rear._rub>4){rear._rub=R.t;R.fxq.push({type:"sparks",f,lat:((rear.y||0)+(front.y||0))/2,t0:R.t})}return}
  R.fxq.push({type:"sparks",f,lat:((rear.y||0)+(front.y||0))/2,t0:R.t});stEv(front,"hit");stEv(rear,"hitter");feudAdd(rear.d.id,front.d.id,6+E*3,mode==="long"?"toque na traseira":"roda com roda");
  let spun=null,dead=[],sev={[rear.id]:0,[front.id]:0};const bump=(c,v)=>{sev[c.id]=Math.max(sev[c.id],v)};
  if(mode==="long"){const off=g.off,ao=Math.abs(off),sideL=off>0;// do ponto de vista de quem bate: a asa do lado do carro da frente
    if(E<1.4){add(rear,"encostou na traseira")}
    else{const w=Math.max(0,E-1.2)*(ao<.5?.075:.11)+(E>5.5?.25:0);if(ao<.5){rear.dmg.wingL+=w*.7;rear.dmg.wingR+=w*.7;if(E>5.5){rear.dmg.nose+=(E-4)*.07;add(rear,"bico danificado")}}else if(sideL)rear.dmg.wingL+=w;else rear.dmg.wingR+=w;
      add(rear,(rear.dmg.wingL>=.6||rear.dmg.wingR>=.6)?"asa dianteira quebrada":"asa dianteira danificada");bump(rear,rear.dmg.wingL>=.6||rear.dmg.wingR>=.6?2:Math.max(rear.dmg.wingL,rear.dmg.wingR)>=.3?1:0);
      if(ao>=.45&&ao<1.7&&E>2.4&&rnd()<clamp((E-2)/6,.15,.75)){const wi=off>0?WHEEL.RR:WHEEL.RL;front.tyre.punct=true;front.tyre.pw=wi;add(front,`pneu ${WNAME[wi]} furado`);bump(front,2);if(!front.pitCall)front.pitCall=COMP[front.tyre.c].dry?pickDry(R.L-front.lap):front.tyre.c}
      if(ao<.6){front.dmg.floor=Math.min(1,(front.dmg.floor||0)+E*.04);if(E>5){front.dmg.rwing=Math.min(1,(front.dmg.rwing||0)+(E-4)*.12);add(front,"asa traseira danificada");bump(front,1)}}
      if(E>8){front.dmg.gear=Math.min(1,(front.dmg.gear||0)+(E-6)*.05);if(front.dmg.gear>.6)latentFail(front,"Câmbio",front.dmg.gear)}
      // toque fora do centro gira o carro da frente
      const torque=E*Math.min(1.6,ao)*(1+R.w*.8);if(ao>=.35&&E>2&&torque>3.3*(1-R.w*.35)){spun=front;exStart(front,"spin",{dir:off>0?-1:1,cause:"toque"});bump(front,2)}
      if(E>14&&!spun){exStart(front,"crash",{dir:sideAt(f),cause:"toque"});bump(front,3)}
      if(E>12){rear.dmg.whl[WHEEL.FL]+=.3;rear.dmg.whl[WHEEL.FR]+=.3;add(rear,"suspensão dianteira danificada")}}}
  else{// lado a lado: onde as rodas e as laterais se encostam
    const ds=g.ds,s=g.side;const leftOf=(car)=>car===rear?(s>0):(s<0);// contato do lado esquerdo do carro?
    const wheelPair=ds<.8?"mesmo":Math.abs(ds-WB)<.9?"cruzado":null;
    if(E<1.1){add(rear,"raspou");add(front,"raspou");rear.dmg.side+=.01;front.dmg.side+=.01}
    else if(wheelPair){for(const car of[rear,front]){const L0=leftOf(car);const wi=wheelPair==="mesmo"?(L0?WHEEL.FL:WHEEL.FR):car===rear?(L0?WHEEL.FL:WHEEL.FR):(L0?WHEEL.RL:WHEEL.RR);
        car.dmg.whl[wi]=Math.min(1,car.dmg.whl[wi]+Math.max(0,E-.9)*.065);car.tyre.wear=Math.min(1,car.tyre.wear+.005+E*.005);
        if(E>2.8&&!car.tyre.punct&&rnd()<clamp((E-2.5)/6,.1,.6)){car.tyre.punct=true;car.tyre.pw=wi;add(car,`pneu ${WNAME[wi]} furado`);bump(car,2);if(!car.pitCall)car.pitCall=COMP[car.tyre.c].dry?pickDry(R.L-car.lap):car.tyre.c}
        else add(car,car.dmg.whl[wi]>.3?`suspensão ${WNAMEF[wi]} entortou`:"roda com roda");bump(car,car.dmg.whl[wi]>.3?1:0)}
      // rodas que se encaixam: a traseira do carro da frente é empurrada e ele gira
      if(wheelPair==="cruzado"&&E>2.9){spun=front;exStart(front,"spin",{dir:g.side>0?1:-1,cause:"toque"});bump(front,2);if(E>8){exStart(rear,"crash",{dir:Math.sign(rear.y||1),cause:"toque"});bump(rear,3)}}}
    else{const tip=rear;const L0=leftOf(tip);const wd=Math.max(0,E-.9)*.1;if(L0)tip.dmg.wingL+=wd;else tip.dmg.wingR+=wd;add(tip,"placa da asa dianteira danificada");bump(tip,1);
      const hit=front;hit.dmg.side=Math.min(1,hit.dmg.side+E*.08);hit.dmg.floor=Math.min(1,(hit.dmg.floor||0)+E*.03);if(E>4){hit.dmg.cool=Math.min(1,hit.dmg.cool+(E-3)*.07);add(hit,"radiador danificado");bump(hit,1);if(hit.dmg.cool>.55)latentFail(hit,"Motor",hit.dmg.cool)}else add(hit,"lateral raspada")}
    // empurrado para fora da pista
    for(const car of[rear,front]){if(!car.ex&&Math.abs(car.y||0)>TRK_H+.6){exStart(car,"off",{dir:Math.sign(car.y),cause:"forcado"});bump(car,2)}}}
  for(const car of[rear,front]){car.dmg.wingL=Math.min(1,car.dmg.wingL);car.dmg.wingR=Math.min(1,car.dmg.wingR);car.dmg.nose=Math.min(1,car.dmg.nose);
    const broken=(car.dmg.wingL>=.6&&!car._wbL)||(car.dmg.wingR>=.6&&!car._wbR);if(car.dmg.wingL>=.6)car._wbL=1;if(car.dmg.wingR>=.6)car._wbR=1;if(broken){R.fxq.push({type:"parts",f,lat:car.y||0,t0:R.t,col:car.col,col2:car.col2});debrisAdd(car,f,car.y||0,2,true)}
    if((car.dmg.wingL>.5&&car.dmg.wingL<.85)||(car.dmg.wingR>.5&&car.dmg.wingR<.85))car.dmg.loose=car.dmg.loose||R.t;
    dmgSync(car);wheelCheck(car);if(!running(car))bump(car,3)}
  // mensagens
  const big=Math.max(sev[rear.id],sev[front.id]);
  if(big>=1||E>1.5){rcMsg(mode==="long"?`${rear.code} tocou na traseira de ${front.code}.`:`Roda com roda entre ${rear.code} e ${front.code}.`,big>=2?"warn":"","toque");crowdEv(f,.4+big*.2)}
  for(const[car,t]of out){if(!car.hum)continue;const other=car===rear?front:rear;if(t==="raspou"||t==="roda com roda"||t==="encostou na traseira"){if(!car._rubMsg||R.t-car._rubMsg>12){car._rubMsg=R.t;radio(car,`Encostei com ${other.code}.`,{me:1})}}else radio(car,`Toque com ${other.code}: ${t}.`,{pause:/furado|quebrad|radiador/.test(t),k:"dano"})}
  if(big>=1&&(rear.isP||front.isP||pos(front)<=8)){narr(mode==="long"?`${rear.code} acerta a traseira de ${front.code}!`:`Roda com roda! ${rear.code} e ${front.code} se tocam.`,big>=2?3:2);hlight(big>=2?"crash":"contact",[rear,front],`Toque entre ${rear.code} e ${front.code}`,big>=2?3:2)}
  if(big>=1)stewContact(rear,front,mode,E,g,sev)}
// rodas e suspensão: quebrada de vez arranca a roda
function wheelCheck(c){if(!running(c))return;const w=c.dmg.whl;for(let i=0;i<4;i++){if(w[i]>=1&&c.dmg.off<0){c.dmg.off=i;const f=fr(c.prog);R.fxq.push({type:"parts",f,lat:c.y||0,t0:R.t,col:"#111",col2:"#333"});debrisAdd(c,f,c.y||0,2,true);
      rcMsg(`${c.code}: a suspensão ${WNAMEF[i]} quebrou; a roda ficou presa pelos cabos de segurança.`,"bad","dano");narr(`A SUSPENSÃO DE ${c.code} QUEBROU! A roda ficou pendurada pelos cabos. Ele está fora.`,3);hlight("crash",[c],`${c.code} perde uma roda`,3);c.ex=null;dnf(c,"Roda arrancada","stop");triggerSC("vsc");return}}}
// falha escondida: a peça aguenta algumas voltas e quebra depois
function latentFail(c,why,d){R.latN=(R.latN||0)+1;if(c.pendFail!=null||c._lat)return;c._lat=why;const laps=Math.max(1,Math.round(2+(1-d)*9));c.pendFail=c.prog+laps;c.pendWhy=why}
// bandeira preta e laranja: peça solta obriga a ir ao box
function looseTick(){for(const c of R.cars){if(!running(c)||!c.dmg||!c.dmg.loose||c.pit)continue;if(R.t-c.dmg.loose<15||c.bo)continue;c.bo=1;if(!c.pitCall)c.pitCall=COMP[c.tyre.c].dry?pickDry(R.L-c.lap):c.tyre.c;
    rcMsg(`Bandeira preta e laranja para ${c.code}: peça solta, obrigatório ir ao box.`,"warn","punicao");if(c.hum)radio(c,"Bandeira preta e laranja: a asa está solta, temos que parar nesta volta.",{pause:true,k:"dano"})}}
// ---------- comissários: quem causou o toque (sem sorteio)
function stewContact(rear,front,mode,E,g,sev){const P=g.pre||{};let cul=null,clar=0,why="";const i=Math.floor(fr(front.prog)*R.geo.N)%R.geo.N,ph=R.geo.ai.ph[i];
  if(rear.ex&&rear.ex.ph==="rejoin"){cul=rear;clar=.72;why="volta insegura à pista"}else if(front.ex&&front.ex.ph==="rejoin"){cul=front;clar=.72;why="volta insegura à pista"}
  else if(mode==="long"){if(front.ex&&front.ex.t0<R.t-.05){cul=null;clar=0;why="carro rodado na frente"}
    else if((front.acc||0)<-32&&ph===0){cul=front;clar=.7;why="frear de forma irregular na frente de outro carro"}
    else if(Math.abs(P.fv||0)>1.4&&Math.sign(P.fv)===Math.sign((rear.y||0)-(front.y||0))&&ph===1){cul=front;clar=.65;why="mudar de direção na freada"}
    else{cul=rear;clar=.55+Math.min(.35,E*.04);why="causar colisão (batida na traseira)"}}
  else{const s=g.side;const tc=(g.mover===rear?1:0);const vR=(P.rv||0)*(rear.y<front.y?1:-1),vF=(P.fv||0)*(front.y<rear.y?1:-1);// velocidade lateral de cada um na direção do outro
    const mv=vR>vF?rear:front,mvv=Math.max(vR,vF),oth=mv===rear?front:rear,othv=Math.min(vR,vF);
    if(mvv<.45){cul=null;clar=0;why="incidente de corrida"}
    else{const behind=mv===rear;const overlap=(oth.fsN??0)-(mv.fsN??0);// quanto o outro está à frente
      if(behind&&g.ds>2.2&&ph!==0){cul=mv;clar=.62+Math.min(.25,(mvv-othv)*.06);why="mergulho sem estar ao lado (ultrapassagem otimista)"}
      else if(!behind&&g.ds<2.2){cul=mv;clar=.66+Math.min(.25,(mvv-othv)*.06);why="fechar a porta com o carro ao lado"}
      else{cul=mv;clar=.18+(mvv-othv)*.09;why=ph===0?"mudar de linha em cima do outro carro":"forçar o outro carro na curva"}}}
  const vic=cul?(cul===rear?front:rear):null;const S=vic?sev[vic.id]:0;
  const inc={cul:cul&&cul.id,vic:vic&&vic.id,clar,why,S,mode,E:+E.toFixed(1),at:R.t+18,kind:"contact",lap:Math.max(1,R.lead+1)};
  if(!cul||clar<.45){R.stewLog=R.stewLog||[];R.stewLog.push(Object.assign(inc,{verdict:"Incidente de corrida"}));return}
  if((rear.isP||front.isP)&&!R.mp&&typeof noteIncident==="function"){noteIncident(cul,vic,"toque",{rear:mode==="long",pre:{vy:{[rear.id]:P.rv||0,[front.id]:P.fv||0},att:{[rear.id]:!!P.rearAtt,[front.id]:false},cov:{[rear.id]:false,[front.id]:!!P.frontCov}}});return}
  stewAdd(inc)}
// decisão dos comissários (chamada pelo stewTick)
function stewVerdict(s){const c=R.cars.find(x=>x.id===s.cul),v=R.cars.find(x=>x.id===s.vic);if(!c)return;const vS=v&&!running(v)&&v.status==="dnf"?3:s.S;
  R.stewLog=R.stewLog||[];
  if(vS<=0){if(s.clar>.8){rcMsg(`Comissários: advertência para ${c.code} por ${s.why}.`,"","punicao");c.warn=(c.warn||0)+1;if(c.hum)radio(c,`Advertência dos comissários: ${s.why}.`,{k:"punicao"})}else rcMsg(`Comissários: toque entre ${c.code} e ${v?v.code:"?"} sem consequência, nenhuma ação.`,"","punicao");s.verdict="Sem punição";R.stewLog.push(s);return}
  if(vS===1){if(s.clar>=.9){penalize(c,5,s.why,1);s.verdict="5 s"}else{rcMsg(`Comissários: toque entre ${c.code} e ${v?v.code:"?"} analisado, incidente de corrida.`,"","punicao");s.verdict="Sem punição"}}
  else if(vS===2){if(s.clar<.7){rcMsg(`Comissários: lance entre ${c.code} e ${v?v.code:"?"} foi incidente de corrida.`,"","punicao");s.verdict="Sem punição";R.stewLog.push(s);return}const t=s.clar>=.85?10:5;penalize(c,t,s.why,t===10?2:1);s.verdict=t+" s"}
  else{if(s.clar>.8&&running(c)){penalize(c,30,`${s.why} (stop and go de 10 s, convertido em 30 s)`,3);s.verdict="Stop and go"}else{penalize(c,20,`${s.why} (drive-through, convertido em 20 s)`,3);s.verdict="Drive-through"}
    if(!running(c)&&c.d){c.d.gridPen=(c.d.gridPen||0)+3;rcMsg(`${c.code} perde 3 posições no grid da próxima corrida.`,"warn","punicao");s.verdict+=" + 3 posições no grid"}}
  R.stewLog.push(s)}
// ---------- comando: recuar (desiste do ataque e volta para trás do carro da frente)
function cmdBackC(c){if(!c||!running(c))return;c.backOff=R.t+6;c.att=null;c.cdAtt=8;c.goReq=false;if(c.hum)radio(c,"Entendido, tiro o pé e fico atrás. Não vale o risco.",{me:1,k:"duelo"})}
function cmdBack(){cmdBackC(R.cars.find(c=>c.isP))}
