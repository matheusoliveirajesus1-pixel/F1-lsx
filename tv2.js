// ===================== TRANSMISSÃO 2: CÂMERA DE BORDO, GRÁFICOS DE PREVISÃO E PÓDIO =====================
// Câmera de bordo: a pista gira para o carro apontar para cima, com o halo e o volante na frente.
// Gráficos: previsão de alcance ("chega em X voltas"), janela de box, radar de velocidade e história dos pneus.
// Pódio: champanhe e uma fanfarra original.
function drawOnboard(ctx,cw,ch,c){if(!c){drawScene(ctx,cw,ch);return}const p=c._w||carWorld(c);const a=toScreen(p.x,p.y,0,cw,ch),b=toScreen(p.x+Math.cos(p.h)*20,p.y+Math.sin(p.h)*20,0,cw,ch);
  const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);const D=Math.ceil(Math.hypot(cw,ch)*1.05);const sx=CAM.sx,sy=CAM.sy;CAM.sx=0;CAM.sy=0;
  ctx.save();ctx.translate(cw/2,ch*.7);ctx.rotate(-ang-Math.PI/2);ctx.translate(-D/2,-D/2);try{drawScene(ctx,D,D)}finally{ctx.restore();CAM.sx=sx;CAM.sy=sy}
  // cockpit: halo e laterais
  ctx.save();ctx.fillStyle="#0B0D11";ctx.beginPath();ctx.moveTo(cw*.5-8,0);ctx.lineTo(cw*.5+8,0);ctx.lineTo(cw*.5+14,ch*.22);ctx.lineTo(cw*.5-14,ch*.22);ctx.fill();
  ctx.lineWidth=Math.max(16,cw*.03);ctx.strokeStyle="#111418";ctx.beginPath();ctx.ellipse(cw/2,ch*.25,cw*.36,ch*.3,0,Math.PI*1.05,Math.PI*1.95);ctx.stroke();
  ctx.fillStyle=c.col||"#333";ctx.beginPath();ctx.moveTo(0,ch);ctx.lineTo(cw*.18,ch*.78);ctx.lineTo(cw*.32,ch);ctx.fill();ctx.beginPath();ctx.moveTo(cw,ch);ctx.lineTo(cw*.82,ch*.78);ctx.lineTo(cw*.68,ch);ctx.fill();
  // volante com o painel
  const W=Math.min(300,cw*.42),H=W*.32,x=cw/2-W/2,y=ch-H-10;ctx.fillStyle="#15181E";ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,W,H,H*.45);else ctx.rect(x,y,W,H);ctx.fill();
  ctx.fillStyle="#05070A";ctx.fillRect(x+W*.28,y+H*.15,W*.44,H*.6);const g=typeof gearRpm==="function"?gearRpm(Math.max(1,c.v||0)):{gear:1,rpm:0};
  ctx.fillStyle="#FFD400";ctx.font=`900 ${Math.round(H*.42)}px 'Roboto Mono',monospace`;ctx.textAlign="center";ctx.fillText(String(c.pit?"N":g.gear),cw/2,y+H*.6);
  ctx.font=`700 ${Math.round(H*.2)}px 'Roboto Mono',monospace`;ctx.fillStyle="#fff";ctx.fillText(Math.round((c.v||0)*3.6)+" km/h",cw/2-W*.38+W*.1,y+H*.55);ctx.fillText("P"+pos(c),cw/2+W*.3,y+H*.55);
  const n=10,lit=Math.round(clamp((g.rpm-7000)/4800,0,1)*n);for(let i=0;i<n;i++){ctx.fillStyle=i<lit?(i<4?"#21C55D":i<7?"#FF4D4D":"#3A86FF"):"#222";ctx.fillRect(x+W*.3+i*W*.04,y+H*.05,W*.03,H*.07)}
  ctx.fillStyle="#3A86FF";ctx.fillRect(x+W*.3,y+H*.8,W*.4*clamp((c.batt||0)/100,0,1),H*.06);ctx.restore()}
// ---------- gráficos de previsão (um a cada ~45 s, quando não há aviso mais importante)
function tvGraphics(){if(!R.started||R.over||R.sc||R.red||TVX.ban||TVX.banQ.length)return;if(R.t<(TVX.gfxNext||40))return;TVX.gfxNext=R.t+rr(40,55);const run=R.order.filter(c=>running(c)&&!c.pit);if(run.length<4)return;
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
