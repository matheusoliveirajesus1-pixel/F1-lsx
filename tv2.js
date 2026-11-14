// ===================== TRANSMISSÃO 2: GRÁFICOS DE PREVISÃO E PÓDIO =====================
// Gráficos: previsão de alcance ("chega em X voltas"), janela de box, radar de velocidade e história dos pneus.
// Pódio: champanhe e uma fanfarra original.
// ---------- gráficos de previsão (um a cada ~45 s, quando não há aviso mais importante)
function tvGraphics(){if(!R.started||R.over||R.sc||R.red||R.qMode||TVX.ban||TVX.banQ.length)return;if(R.t<(TVX.gfxNext||40))return;TVX.gfxNext=R.t+vrr(40,55);const run=R.order.filter(c=>running(c)&&!c.pit);if(run.length<4)return;
  const kind=(TVX.gfxK=((TVX.gfxK||0)+1)%4);
  if(kind===0){let best=null;for(let i=1;i<Math.min(12,run.length);i++){const A=run[i-1],B=run[i];const gap=(A.prog-B.prog)*B.L;const d=(A.L||0)-(B.L||0);if(gap>.7&&gap<4&&d>.12){const laps=Math.ceil(gap/d);if(!best||laps<best.laps)best={A,B,laps,gap}}}
    if(best){tvBan("PREVISÃO DE ALCANCE",`${best.B.code} chega em ${best.A.code} em ~${best.laps} volta${best.laps>1?"s":""} (${best.gap.toFixed(1).replace(".",",")} s de diferença)`,best.B.t.c,5,1);return}}
  if(kind<=1){const c=run[0];const rate=c.tyre.age>0?c.tyre.wear/c.tyre.age:0;if(rate>0&&R.L-c.lap>4){const a=Math.max(c.lap+1,Math.round(c.lap+(.6-c.tyre.wear)/rate)),b=Math.max(a+1,Math.round(c.lap+(.78-c.tyre.wear)/rate));if(a<R.L){tvBan("JANELA DE BOX",`${c.code} (líder): voltas ${a} a ${Math.min(R.L-1,b)} · pneus ${COMP[c.tyre.c].n.toLowerCase()}s com ${c.tyre.age} voltas`,c.t.c,5,1);return}}}
  if(kind===2){const top=R.cars.filter(c=>c._vmax).sort((a,b)=>b._vmax-a._vmax).slice(0,3);if(top.length){tvBan("RADAR DE VELOCIDADE",top.map(c=>`${c.code} ${Math.round(c._vmax*3.6)} km/h`).join(" · "),"#3A86FF",5,1);return}}
  const me=meCar();if(me&&me.used&&me.used.length){tvBan(`HISTÓRIA DOS PNEUS · ${me.code}`,me.used.map((k,i)=>`${i+1}º: ${COMP[k].n.toLowerCase()}`).join(" → ")+` (atual com ${me.tyre.age} voltas)`,me.t.c,5,1)}}
(function(){if(typeof tvEvents!=="function")return;const base=tvEvents;globalThis.tvEvents=function(){base();try{for(const c of R.cars)if(running(c)&&!c.pit)c._vmax=Math.max(c._vmax||0,c.v||0);tvGraphics()}catch(e){}}})();
// ---------- pódio: champanhe e fanfarra
(function(){if(typeof drawPodium!=="function")return;const base=drawPodium;globalThis.drawPodium=function(ctx,cw,ch,t,top){base(ctx,cw,ch,t,top);try{if(t>.4&&!drawPodium._fan){drawPodium._fan=1;if(typeof sndFanfare==="function")sndFanfare()}if(t<.2)drawPodium._fan=0;
      if(t>2.5){const pts=[[cw/2,ch*.32],[cw/2-cw*.2,ch*.4],[cw/2+cw*.2,ch*.44]];ctx.save();for(const[i,[x,y]]of pts.entries()){for(let k=0;k<26;k++){const ph=(t*1.4+k*.07+i*.3)%1;const dir=(i===1?-1:1)*(.6+k%5*.12);
        const px=x+dir*ph*cw*.12,py=y-Math.sin(ph*Math.PI)*ch*.18+ph*ch*.05;ctx.fillStyle=`rgba(255,240,180,${.75*(1-ph)})`;ctx.beginPath();ctx.arc(px,py,1.5+2*(1-ph),0,7);ctx.fill()}}ctx.restore()}}catch(e){}}})();
function sndFanfare(){if(typeof SND==="undefined"||!SND.on||!SND.ctx)return;const ctx=SND.ctx,t0=ctx.currentTime+.05,bus=SND.b.music||SND.bus;// melodia original (não é hino de país)
  [[67,0,.25],[72,.25,.25],[76,.5,.25],[79,.75,.6],[76,1.4,.2],[79,1.6,.9]].forEach(([m,d,len])=>{for(const det of[0,7]){const o=ctx.createOscillator(),g=ctx.createGain();o.type="sawtooth";o.frequency.value=440*Math.pow(2,(m+det/100-69)/12);g.gain.setValueAtTime(0,t0+d);g.gain.linearRampToValueAtTime(.05,t0+d+.03);g.gain.setTargetAtTime(0,t0+d+len*.8,.08);o.connect(g);g.connect(bus);o.start(t0+d);o.stop(t0+d+len+.4)}})}
// ===================== TRANSMISSÃO PADRONIZADA (TV e Diretor) =====================
// Cada gráfico tem hora e lugar: abertura do evento (antes da largada), cartão do piloto em foco e velocidade ao vivo
// (embaixo à esquerda, só quando a câmera corta para alguém ou ele entra numa reta), e a linha da torre que abre a câmera
// de um dos carros em volta do jogador. Só desenho: nada aqui mexe na corrida.
function bcOn(){return typeof UI!=="undefined"&&(UI.cam==="tv"||UI.cam==="director")}
const BCX={openT:null,opened:false,cardId:null,cardT:-99,spdT:-99,spdNext:0,tw:null,twNext:30,twPos:{},twFast:null,twCv:null,twDraw:0,box:null,boxT:0};
function bcReset(){Object.assign(BCX,{openT:null,opened:false,cardId:null,cardT:-99,spdT:-99,spdNext:0,tw:null,twNext:30,twPos:{},twFast:null,twDraw:0,box:null,boxT:0})}
function bcOff(){if(BCX.twCv)BCX.twCv.style.display="none";BCX.tw=null}
const bcEase=k=>1-Math.pow(1-Math.max(0,Math.min(1,k)),3);
function bcFit(ctx,t,font,maxW){ctx.font=font;let s=String(t);while(s.length>3&&ctx.measureText(s).width>maxW)s=s.slice(0,-2)+"…";return s}
// ---------- abertura do evento: aparece uma vez, antes da largada (ou logo no começo), e esconde os outros gráficos enquanto está na tela
function tvOpening(ctx,cw,ch,now){if(BCX.opened&&BCX.openT==null)return false;if(BCX.rRef!==R){bcReset();BCX.rRef=R}
  if(BCX.openT==null){if((R.lead||0)>=1||R.t>40){BCX.opened=true;return false}BCX.openT=now;BCX.opened=true}
  if(R.started&&R.t-(R.go||0)>1.5&&now-BCX.openT<6.1)BCX.openT=now-6.1;/* largou: a abertura sai */
  const a=now-BCX.openT,D=6.5;if(a>D){BCX.openT=null;return false}
  const C=R.C,mob=cw<640,k=bcEase(a/.45),o=Math.min(1,(D-a)/.4);const gp=(C.gp||"").replace(/^GP /,"Grande Prêmio ");
  const W=Math.min(cw-24,mob?cw-24:Math.max(380,Math.min(560,cw-560))),H=mob?84:108,x=(cw-W)/2-(1-k)*40,y=mob?Math.min(118,Math.round(ch*.19)):24;/* no alto, entre a torre e o painel: longe das luzes e do botão de largada */
  ctx.save();ctx.globalAlpha=Math.min(k,o);ctx.fillStyle="rgba(8,10,14,.9)";ctx.fillRect(x,y,W,H);
  ctx.fillStyle="#E10600";ctx.fillRect(x,y,6,H);ctx.fillStyle="#FFFFFF";ctx.fillRect(x+6,y+H-3,(W-6)*k,3);
  ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillStyle="#E10600";ctx.font=`900 italic ${mob?10:11}px ${TVF}`;ctx.fillText("PADDOCK TV · AO VIVO",x+20,y+(mob?18:22));
  ctx.fillStyle="#FFFFFF";let fs1=mob?19:26;ctx.font=`900 italic ${fs1}px ${TVF}`;while(fs1>12&&ctx.measureText(gp.toUpperCase()).width>W-36){fs1--;ctx.font=`900 italic ${fs1}px ${TVF}`}ctx.fillText(gp.toUpperCase(),x+20,y+(mob?44:56));
  ctx.fillStyle="#C9CED8";const f2=`700 ${mob?11:13}px ${TVF}`;ctx.font=f2;ctx.fillText(bcFit(ctx,`CORRIDA · ${(C.city||"").toUpperCase()}, ${(C.nat||"").toUpperCase()}`,f2,W-36),x+20,y+(mob?63:78));
  ctx.fillStyle="#8B93A1";const f3=`600 ${mob?10:12}px ${TVF}`;ctx.font=f3;ctx.fillText(bcFit(ctx,`${C.n||""} · ${R.L} voltas · ${((C.len||R.geo.len)/1000).toFixed(3).replace(".",",")} km`,f3,W-36),x+20,y+(mob?80:96));
  ctx.restore();return true}
// área livre embaixo à esquerda: logo acima do minimapa (lido do próprio painel), para o cartão não cobrir nada
function bcBottom(cw,ch){const now=performance.now();if(BCX.box&&now-BCX.boxT<500)return BCX.box;BCX.boxT=now;let y=ch-(cw<640?96:64);
  try{const rc=document.getElementById("rc"),mm=document.getElementById("mm");if(rc&&mm&&!mm.hidden&&mm.offsetParent){const a=rc.getBoundingClientRect(),b=mm.getBoundingClientRect();if(b.height>0&&b.top>a.top)y=b.top-a.top-8}}catch(e){}
  return BCX.box={y}}
// ---------- cartão do piloto em foco + velocidade ao vivo
function tvCard(ctx,cw,ch,now){towerCamFrame();if(!R.started||R.over)return;const c=UI.foc;if(!c||!c.d||!running(c)){BCX.cardId=null;return}
  if(c.id!==BCX.cardId||R.t-BCX.cardT>45){BCX.cardId=c.id;BCX.cardT=R.t;const i=Math.floor(fr(c.prog)*R.geo.N)%R.geo.N;if(R.geo.ai&&R.geo.ai.ph[i]===0&&c.v>40){BCX.spdT=R.t;BCX.spdNext=R.t+22}}
  // velocidade sozinha: quando o piloto em foco entra numa reta longa (no máximo a cada ~22 s)
  {const i=Math.floor(fr(c.prog)*R.geo.N)%R.geo.N;if(R.t>BCX.spdNext&&R.geo.zoneMask&&R.geo.zoneMask[i]&&c.v>55){BCX.spdT=R.t;BCX.spdNext=R.t+22}}
  const mob=cw<640,base=bcBottom(cw,ch).y;let x0=10,yTop=base;
  // celular: pouco espaço embaixo; se o narrador está falando, o cartão e a velocidade esperam ele terminar
  if(mob&&TVX.cap){if(R.t-BCX.cardT<.3)BCX.cardT=R.t;if(R.t-BCX.spdT<.3)BCX.spdT=R.t}
  const ac=R.t-BCX.cardT,DC=5.5;if(ac>=0&&ac<DC){const k=bcEase(ac/.35),o=Math.min(1,(DC-ac)/.35);const p=pos(c);const nm=(c.d.n||c.code).split(" ");const first=nm.length>1?nm.slice(0,-1).join(" "):"",last=nm[nm.length-1];
    const W=mob?Math.min(cw-20,250):310,H=mob?50:60,x=x0-(1-k)*30,y=base-H;yTop=y;
    ctx.save();ctx.globalAlpha=Math.min(k,o);ctx.fillStyle="rgba(8,10,14,.92)";ctx.fillRect(x,y,W,H);
    const S=H;ctx.fillStyle=c.t.c;ctx.fillRect(x,y,S*.78,H);ctx.fillStyle="#FFFFFF";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`900 ${mob?20:24}px ${TVF}`;ctx.fillText(String(p),x+S*.39,y+H/2+1);
    ctx.textAlign="left";ctx.textBaseline="alphabetic";const tx=x+S*.78+10,num=String(c.d.num||"");const numW=mob?40:52;const tw=W-(tx-x)-numW-6;
    ctx.fillStyle="#C9CED8";const fA=`600 ${mob?10:11}px ${TVF}`;ctx.font=fA;if(first)ctx.fillText(bcFit(ctx,first,fA,tw),tx,y+(mob?14:16));
    ctx.fillStyle="#FFFFFF";const fB=`900 ${mob?16:20}px ${TVF}`;ctx.font=fB;ctx.fillText(bcFit(ctx,last.toUpperCase(),fB,tw),tx,y+(mob?32:38));
    {const im=typeof logoImg==="function"?logoImg(c.t):null,ls=mob?11:12;let lx=tx;if(im&&im.complete&&im.naturalWidth){ctx.drawImage(im,tx,y+H-(mob?6:8)-ls+2,ls,ls);lx=tx+ls+4}ctx.fillStyle="#8B93A1";const fC=`700 ${mob?9:10}px ${TVF}`;ctx.font=fC;const spn=typeof carSponsors==="function"?carSponsors(c.t):null;ctx.fillText(bcFit(ctx,((c.t.n||"")+(spn&&spn.m?" · "+spn.m.n:"")).toUpperCase(),fC,tw-(lx-tx)),lx,y+H-(mob?6:8))}
    ctx.fillStyle=c.t.c;ctx.textAlign="right";ctx.font=`900 italic ${mob?26:34}px ${TVF}`;ctx.fillText(num,x+W-8,y+H/2+(mob?9:12));ctx.restore()}
  const as=R.t-BCX.spdT,DS2=4.2;if(as>=0&&as<DS2){const k=bcEase(as/.3),o=Math.min(1,(DS2-as)/.3);const W=mob?118:132,H=mob?44:50;let x,y;
    if(ac>=0&&ac<DC&&!mob){x=x0+310+8;y=base-H}else if(ac>=0&&ac<DC){x=x0;y=yTop-H-6}else{x=x0;y=base-H}
    ctx.save();ctx.globalAlpha=Math.min(k,o);ctx.fillStyle="rgba(8,10,14,.92)";ctx.fillRect(x,y,W,H);ctx.fillStyle=c.t.c;ctx.fillRect(x,y,W,3);
    ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillStyle="#C9CED8";ctx.font=`800 ${mob?9:10}px ${TVF}`;ctx.fillText(`VELOCIDADE · ${c.code}`,x+8,y+(mob?14:16));
    ctx.fillStyle="#FFFFFF";ctx.font=`900 ${mob?20:24}px ${TVF}`;const v=Math.round(c.v*3.6);ctx.fillText(String(v),x+8,y+H-(mob?7:9));const vw=ctx.measureText(String(v)).width;
    ctx.fillStyle="#8B93A1";ctx.font=`700 ${mob?10:11}px ${TVF}`;ctx.fillText("km/h",x+12+vw,y+H-(mob?8:10));ctx.restore()}}
// ---------- torre: a linha de um dos 5 carros em volta do jogador abre e mostra a câmera dele (um por vez, só em momento que vale)
function towerCamRow(cars,me){if(!bcOn()||!R.started||R.over){BCX.tw=null;return null}const mob=typeof innerWidth!=="undefined"&&innerWidth<640;
  const t=R.t;let tw=BCX.tw;if(tw&&t>tw.t0+tw.dur)tw=BCX.tw=null;
  if(!tw&&t>=BCX.twNext&&!TVX.rad&&!(mob&&(TVX.ban||TVX.banQ.length||(typeof SMART!=="undefined"&&SMART.pip)||(typeof flagInfo==="function"&&flagInfo())))){let pick=null;const fast=R.fast&&R.fast.c&&R.fast.c.id;
    for(const c of cars){if(!running(c)||c===me||c.pit)continue;const p=pos(c),pv=BCX.twPos[c.id];
      if(fast&&fast===c.id&&BCX.twFast!==fast){pick={c,lab:"VOLTA MAIS RÁPIDA"};break}
      if(pv!=null&&p<pv&&R.t-(c.pitExit||-99)>10){pick={c,lab:R.qMode?`SUBIU NA TABELA · P${p}`:`GANHOU POSIÇÃO · P${p}`};break}
      if(c.pitExit&&t-c.pitExit<4){pick={c,lab:"SAIU DO BOX"};break}
      if(c.att&&c.att.commit){const A=R.cars.find(x=>x.id===c.att.id);pick={c,lab:A?`ATACANDO ${A.code}`:"ATACANDO"};break}}
    if(pick){tw=BCX.tw={id:pick.c.id,lab:pick.lab,t0:t,dur:6.5};BCX.twNext=t+20}}
  for(const c of cars)BCX.twPos[c.id]=pos(c);BCX.twFast=R.fast&&R.fast.c&&R.fast.c.id;
  if(!tw)return null;return{id:tw.id,lab:tw.lab,h:towerCamH()}}
function towerCamH(){const tw=BCX.tw;if(!tw)return 0;const full=(typeof innerWidth!=="undefined"&&innerWidth<640)?78:104;const a=R.t-tw.t0,d=tw.dur;return Math.round(full*Math.min(bcEase(a/.4),bcEase((d-a)/.4)))}
function towerCamFrame(){const sp=document.getElementById("hTwSp"),tower=document.getElementById("hTower");if(!tower)return;
  if(!BCX.tw||!sp){if(BCX.twCv)BCX.twCv.style.display="none";return}
  if(!BCX.twCv||!tower.contains(BCX.twCv)){BCX.twCv=document.createElement("canvas");BCX.twCv.className="h-camcv";tower.appendChild(BCX.twCv)}
  const h=towerCamH();sp.style.height=h+"px";const cv=BCX.twCv;cv.style.display=h>4?"block":"none";cv.style.top=sp.offsetTop+"px";cv.style.height=h+"px";if(h<=4)return;
  const c=R.cars.find(x=>x.id===BCX.tw.id);if(!c||!c._w)return;const tn=performance.now();if(tn-BCX.twDraw<66)return;BCX.twDraw=tn;
  const w=sp.clientWidth||196,dpr=(typeof qDpr==="function"?qDpr():Math.min(2,window.devicePixelRatio||1)),hh=h;
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(hh*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(hh*dpr)}
  const pc=cv.getContext("2d");pc.setTransform(dpr,0,0,dpr,0,0);const sv={x:CAM.x,y:CAM.y,z:CAM.z,sx:CAM.sx,sy:CAM.sy};
  const[ix,iy]=iso(c._w.x,c._w.y);CAM.x=ix;CAM.y=iy;CAM.z=w/(WS*14*1.6);CAM.sx=0;CAM.sy=0;
  try{drawScene(pc,w,hh,{pip:true})}catch(e){}finally{Object.assign(CAM,sv)}}
