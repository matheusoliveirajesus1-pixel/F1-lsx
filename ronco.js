// ===================== RONCO CLÁSSICO (bruto, estilo V10/V8) =====================
// Camada extra do motor, sintetizada na hora (sem arquivos de áudio):
//  - saturação (waveshaper com tanh): o som "rasgado" de um motor no limite;
//  - meias-ordens (0,5× e 1,5× a frequência de ignição): o ronco grosso e irregular dos V8/V10;
//  - "grão" de combustão: ruído modulado na própria frequência de ignição;
//  - escapamento grave em serrote (corpo embaixo);
//  - leve irregularidade de rotação (o motor nunca é um tom perfeito);
//  - estalos e explosões no escapamento ao tirar o pé e nas reduções.
// Escolha nas configurações de som: "Clássico (bruto)" ou "Moderno (V6 híbrido)" (o som que já existia).
function roncoMode(){return(typeof PREFS!=="undefined"&&PREFS.engSnd)||"bruto"}
function roncoCurve(k){const n=2048,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(k*x)/Math.tanh(k)}return c}
(function(){const base=sndInit;globalThis.sndInit=function(){const had=!!SND.ctx;const ok=base();if(!ok||had||!SND.eng||SND.eng.rw)return ok;try{const ctx=SND.ctx,e=SND.eng;const rw={};
  rw.inp=ctx.createGain();rw.inp.gain.value=1;rw.drive=ctx.createGain();rw.drive.gain.value=2.6;rw.ws=ctx.createWaveShaper();rw.ws.curve=roncoCurve(3.2);rw.ws.oversample="4x";
  rw.lp=ctx.createBiquadFilter();rw.lp.type="lowpass";rw.lp.frequency.value=2600;rw.lp.Q.value=.9;rw.pk=ctx.createBiquadFilter();rw.pk.type="peaking";rw.pk.frequency.value=130;rw.pk.gain.value=9;rw.pk.Q.value=.8;
  rw.g=ctx.createGain();rw.g.gain.value=0;rw.inp.connect(rw.drive);rw.drive.connect(rw.ws);rw.ws.connect(rw.lp);rw.lp.connect(rw.pk);rw.pk.connect(rw.g);rw.g.connect(SND.duck);
  // irregularidade: dois osciladores lentos mexem na afinação (em cents)
  rw.j1=ctx.createOscillator();rw.j1.frequency.value=7.3;rw.j2=ctx.createOscillator();rw.j2.frequency.value=13.1;rw.jg=ctx.createGain();rw.jg.gain.value=14;rw.j1.connect(rw.jg);rw.j2.connect(rw.jg);rw.j1.start();rw.j2.start();
  // ordens do motor: [tipo, múltiplo da frequência de ignição, amplitude]
  rw.oscs=[["sawtooth",1/3,.2],["sawtooth",1,.32],["square",.5,.22],["sawtooth",1.5,.12],["sawtooth",2,.1],["square",3,.035]]/* 1/3 = virabrequim: o estrondo grave */.map(([type,mul,amp])=>{const o=ctx.createOscillator();o.type=type;const g=ctx.createGain();g.gain.value=amp;o.connect(g);g.connect(rw.inp);rw.jg.connect(o.detune);o.start();return{o,mul,g}});
  // grão de combustão: ruído em banda, pulsado na frequência de ignição
  rw.nz=ctx.createBufferSource();rw.nz.buffer=SND.noise;rw.nz.loop=true;rw.nf=ctx.createBiquadFilter();rw.nf.type="bandpass";rw.nf.frequency.value=900;rw.nf.Q.value=1.1;rw.na=ctx.createGain();rw.na.gain.value=0;
  rw.pul=ctx.createOscillator();rw.pul.type="square";rw.pul.frequency.value=100;rw.pulg=ctx.createGain();rw.pulg.gain.value=.11;rw.pul.connect(rw.pulg);rw.pulg.connect(rw.na.gain);
  rw.nz.connect(rw.nf);rw.nf.connect(rw.na);rw.na.connect(rw.inp);rw.nz.start();rw.pul.start();
  // escapamento grave (corpo)
  rw.bx=ctx.createOscillator();rw.bx.type="sawtooth";rw.bxf=ctx.createBiquadFilter();rw.bxf.type="lowpass";rw.bxf.frequency.value=240;rw.bxf.Q.value=1.4;rw.bxg=ctx.createGain();rw.bxg.gain.value=0;
  rw.bx.connect(rw.bxf);rw.bxf.connect(rw.bxg);rw.bxg.connect(SND.duck);rw.jg.connect(rw.bx.detune);rw.bx.start();
  rw.popT=0;e.rw=rw}catch(err){console.warn("ronco:",err)}return ok}})();
// estalo do escapamento: rajada curta de ruído saturado (com um "tum" grave nas explosões maiores)
function roncoPop(a,dl){if(!SND.on||!SND.ctx||!SND.eng||!SND.eng.rw)return;const ctx=SND.ctx,t=ctx.currentTime+(dl||0)+Math.random()*.03;const len=.03+Math.random()*.07;
  const s=ctx.createBufferSource();s.buffer=SND.noise;const f=ctx.createBiquadFilter();f.type="bandpass";f.frequency.value=350+Math.random()*700;f.Q.value=.9;const ws=ctx.createWaveShaper();ws.curve=SND.eng.rw.ws.curve;const g=ctx.createGain();
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+len);s.connect(f);f.connect(ws);ws.connect(g);g.connect(SND.duck);s.start(t,Math.random()*1.5);s.stop(t+len+.02);
  if(a>.25){const o=ctx.createOscillator(),og=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(42,t+.09);og.gain.setValueAtTime(a*.7,t);og.gain.exponentialRampToValueAtTime(.001,t+.1);o.connect(og);og.connect(SND.duck);o.start(t);o.stop(t+.12)}}
(function(){const base=sndUpdate;globalThis.sndUpdate=function(c,opts){const g0=SNDLAST.gear;base(c,opts);if(!SND.on||!SND.eng||!c)return;const e=SND.eng,rw=e.rw;if(!rw)return;const ctx=SND.ctx,t=ctx.currentTime,o=opts||{};const D=o.dist??1,sp=o.speed||1;
  const bruto=roncoMode()==="bruto";const rpm=c._rpm||0;const thr=c.acc>.5?1:c.acc<-3?0:.45;const f=rpm/20;
  if(!bruto||!rpm){rw.g.gain.setTargetAtTime(0,t,.05);rw.bxg.gain.setTargetAtTime(0,t,.05);rw.na.gain.setTargetAtTime(0,t,.05);return}
  // a camada limpa (moderna) fica mais baixa: o clássico manda
  e.g.gain.setTargetAtTime(((.16+thr*.3)*D*(sp>8?.4:1))*.38,t,.03);e.exg.gain.setTargetAtTime(0,t,.05);e.ersg.gain.setTargetAtTime(0,t,.05);e.tb.g.gain.setTargetAtTime(e.tb.g.gain.value*.4,t,.08);
  rw.oscs.forEach(x=>x.o.frequency.setTargetAtTime(Math.max(18,f*x.mul),t,.02));rw.pul.frequency.setTargetAtTime(Math.max(10,f),t,.02);rw.nf.frequency.setTargetAtTime(500+f*2.2,t,.05);
  rw.drive.gain.setTargetAtTime(1.6+thr*2.6+rpm/9000,t,.04);/* mais carga = mais rasgado */rw.lp.frequency.setTargetAtTime(1200+thr*2400+rpm*.16,t,.05);
  const vol=(.13+thr*.27)*D*(sp>8?.4:1);rw.g.gain.setTargetAtTime(vol,t,.03);rw.na.gain.setTargetAtTime(.05+thr*.07,t,.04);
  rw.bx.frequency.setTargetAtTime(Math.max(16,f/3),t,.03);rw.bxg.gain.setTargetAtTime((.1+thr*.16)*D*(sp>8?.4:1),t,.05);
  // corte na troca de marcha (mais seco no clássico)
  if((c._gear||0)>g0&&g0>0){rw.g.gain.setValueAtTime(vol*.15,t);rw.g.gain.setTargetAtTime(vol,t+.045,.02)}
  // estalos: ao tirar o pé em alta e em cada redução
  const now=performance.now();if(running(c)&&!c.pit&&D>.3){if((c._gear||0)<g0&&g0>0){const n=1+Math.floor(Math.random()*3);for(let i=0;i<n;i++)roncoPop((.18+Math.random()*.22)*D,i*.055)/* agendado no relógio do áudio */}
    else if(c.acc<-3&&rpm>8500&&now>rw.popT){rw.popT=now+60+Math.random()*220;roncoPop((.08+Math.random()*.16)*D)}}}})();
(function(){const base=sndSilence;globalThis.sndSilence=function(all){base(all);if(!SND.eng||!SND.eng.rw)return;const t=SND.ctx.currentTime,rw=SND.eng.rw;[rw.g,rw.bxg,rw.na].forEach(g=>g.gain.setTargetAtTime(0,t,.05))}})();
// escolha nas configurações de som
(function(){const base=sndPanel;globalThis.sndPanel=function(){const m=roncoMode();return base()+`<h4 style="margin:14px 0 6px">Ronco do motor</h4><div class="choice" role="group" aria-label="Ronco do motor"><button class="chip${m==="bruto"?" on":""}" data-act="engSnd" data-k="bruto" aria-pressed="${m==="bruto"}"><b>Clássico (bruto)</b><span>V10/V8: rasgado, grave, com estalos</span></button><button class="chip${m==="moderno"?" on":""}" data-act="engSnd" data-k="moderno" aria-pressed="${m==="moderno"}"><b>Moderno (V6 híbrido)</b><span>Mais limpo e agudo, com zumbido elétrico</span></button></div>`}})();
if(typeof document!=="undefined")document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest('[data-act="engSnd"]');if(!b)return;if(typeof PREFS!=="undefined"){PREFS.engSnd=b.dataset.k;if(typeof prefsSave==="function")prefsSave()}
  b.parentNode.querySelectorAll('[data-act="engSnd"]').forEach(x=>{const on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-pressed",on)});if(SND.on&&b.dataset.k==="bruto")roncoPop(.3)});
