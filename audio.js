// ===================== SOM (WebAudio, tudo sintetizado: nenhum arquivo de áudio para baixar) =====================
// Motor V6 1.6 turbo híbrido em camadas: ignição (rpm/20 Hz) + escapamento grave + admissão + turbo + ERS (MGU-K).
// Efeitos: troca de marcha, pneus cantando, zebra, brita, vento, carros passando (com Doppler e lado esquerdo/direito),
// batidas com força proporcional, eco no túnel de Mônaco e nas pistas de rua, chiado do rádio abaixando o motor.
// Cada grupo tem o próprio volume (menu "Som" na corrida). Música original gerada na hora, só nos menus.
const SND={ctx:null,on:false,eng:null,vol:.7,duckT:0,tunnel:null};
const SND_BUS=[["master","Geral",.8],["eng","Motor",.85],["fx","Efeitos",.8],["amb","Ambiente e público",.7],["voice","Rádio e narração",.9],["music","Música",.35]];
function sndVols(){const v=(typeof PREFS!=="undefined"&&PREFS.vol)||(typeof G!=="undefined"&&G&&G.settings&&G.settings.vol)||{};const o={};for(const[k,,d]of SND_BUS)o[k]=typeof v[k]==="number"?clamp(v[k],0,1):d;return o}
function sndVolApply(){if(!SND.ctx)return;const v=sndVols(),t=SND.ctx.currentTime;for(const[k]of SND_BUS){const g=SND.b[k];if(g)g.gain.setTargetAtTime(k==="master"?v[k]:v[k],t,.05)}}
function sndVolSet(k,x){if(typeof PREFS!=="undefined"){PREFS.vol[k]=clamp(+x,0,1);prefsSave()}sndVolApply()}
function sndNoise(ctx,sec){const nb=ctx.createBuffer(1,ctx.sampleRate*sec,ctx.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return nb}
function sndLoop(ctx,buf,type,f,q,bus){const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ctx.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(bus);s.start();return{s,f:fl,g}}
function sndInit(){if(SND.ctx)return true;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;const ctx=new AC();SND.ctx=ctx;
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;SND.b={};
  SND.b.master=ctx.createGain();comp.connect(SND.b.master);SND.b.master.connect(ctx.destination);SND.master=SND.b.master;SND.bus=comp;
  for(const[k]of SND_BUS)if(k!=="master"){SND.b[k]=ctx.createGain();SND.b[k].connect(comp)}
  // o motor passa por um "abaixador" (quando o rádio fala, o motor baixa)
  SND.duck=ctx.createGain();SND.duck.gain.value=1;SND.duck.connect(SND.b.eng);
  // eco curto (túnel e muros das pistas de rua): resposta ao impulso gerada na hora
  const ir=ctx.createBuffer(2,ctx.sampleRate*1.4,ctx.sampleRate);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3.2)}
  SND.rev=ctx.createConvolver();SND.rev.buffer=ir;SND.revG=ctx.createGain();SND.revG.gain.value=0;SND.duck.connect(SND.rev);SND.rev.connect(SND.revG);SND.revG.connect(comp);
  const nb=sndNoise(ctx,2);SND.noise=nb;const e={};
  // camada 1: ignição (harmônicos)
  e.g=ctx.createGain();e.g.gain.value=0;e.lp=ctx.createBiquadFilter();e.lp.type="lowpass";e.lp.frequency.value=2400;e.lp.Q.value=.8;e.mod=ctx.createGain();e.mod.gain.value=1;e.lp.connect(e.mod);e.mod.connect(e.g);e.g.connect(SND.duck);
  e.oscs=[["sawtooth",1,.3],["square",.5,.15],["sawtooth",2,.11],["triangle",3,.06]].map(([type,mul,amp])=>{const o=ctx.createOscillator();o.type=type;const g=ctx.createGain();g.gain.value=amp;o.connect(g);g.connect(e.lp);o.start();return{o,mul,g}});
  e.am=ctx.createOscillator();e.am.frequency.value=31;const amg=ctx.createGain();amg.gain.value=.12;e.am.connect(amg);amg.connect(e.mod.gain);e.am.start();
  // camada 2: escapamento grave (ronco embaixo)
  e.ex=ctx.createOscillator();e.ex.type="sine";e.exg=ctx.createGain();e.exg.gain.value=0;e.ex.connect(e.exg);e.exg.connect(SND.duck);e.ex.start();
  // camada 3: admissão (ar entrando, chiado agudo que sobe com o giro)
  e.in=sndLoop(ctx,nb,"bandpass",2400,3,SND.duck);
  // turbo e ERS (MGU-K): assobio e zumbido elétrico
  e.tb=sndLoop(ctx,nb,"bandpass",5200,9,SND.duck);
  e.ers=ctx.createOscillator();e.ers.type="sine";e.ersg=ctx.createGain();e.ersg.gain.value=0;e.ers.connect(e.ersg);e.ersg.connect(SND.duck);e.ers.start();
  // efeitos contínuos
  e.wn=sndLoop(ctx,nb,"lowpass",700,.7,SND.b.fx);// vento
  e.sq=sndLoop(ctx,nb,"bandpass",1500,4,SND.b.fx);// pneu cantando
  e.gr=sndLoop(ctx,nb,"lowpass",420,.9,SND.b.fx);// brita e grama
  e.kb=ctx.createOscillator();e.kb.type="square";e.kb.frequency.value=38;e.kbf=ctx.createBiquadFilter();e.kbf.type="lowpass";e.kbf.frequency.value=260;e.kbg=ctx.createGain();e.kbg.gain.value=0;e.kb.connect(e.kbf);e.kbf.connect(e.kbg);e.kbg.connect(SND.b.fx);e.kb.start();// zebra
  // carro passando perto: motor dele com Doppler e lado (estéreo)
  e.po=ctx.createOscillator();e.po.type="sawtooth";e.pf=ctx.createBiquadFilter();e.pf.type="lowpass";e.pf.frequency.value=1800;e.pg=ctx.createGain();e.pg.gain.value=0;e.pp=ctx.createStereoPanner?ctx.createStereoPanner():null;
  e.po.connect(e.pf);e.pf.connect(e.pg);if(e.pp){e.pg.connect(e.pp);e.pp.connect(SND.b.fx)}else e.pg.connect(SND.b.fx);e.po.start();
  // ambiente: público e chuva
  e.cr=sndLoop(ctx,nb,"bandpass",900,.5,SND.b.amb);e.rn=sndLoop(ctx,nb,"highpass",3000,.4,SND.b.amb);
  // chiado do rádio
  e.st=sndLoop(ctx,nb,"bandpass",2600,1.2,SND.b.voice);
  SND.eng=e;sndVolApply();SND.on=true;return true}catch(err){console.warn("som:",err);SND.ctx=null;return false}}
function sndToggle(on){if(on){if(!sndInit())return false;SND.ctx.resume&&SND.ctx.resume();SND.on=true;sndVolApply()}else{SND.on=false;sndSilence(true);sndMusic(false)}return true}
// trecho do túnel de Mônaco (entre Portier e a Nova Chicane)
function sndTunnelAt(f){if(!R||R.C.id!=="monaco")return false;if(!SND.tunnel||SND.tunnel.g!==R.geo){const cs=R.geo.corners||[];const a=cs.find(c=>/Portier/.test(c.n)),b=cs.find(c=>/Nova Chicane/.test(c.n));
    SND.tunnel={g:R.geo,a:a?a.i/R.geo.N+60/R.geo.len:-1,b:b?b.i/R.geo.N-60/R.geo.len:-1}}const T=SND.tunnel;return T.a>=0&&T.b>T.a&&f>T.a&&f<T.b}
// chamado a cada quadro com o carro em foco; near = carro mais próximo (para o "zum" de passagem)
let SNDLAST={gear:0,shiftT:0};
function sndUpdate(c,opts){if(!SND.on||!SND.eng||!c)return;const e=SND.eng,ctx=SND.ctx,t=ctx.currentTime,o=opts||{};const sp=o.speed||1;const D=o.dist??1;
  const form=!R.started&&R.form&&R.form.phase==="out";const moving=running(c)&&!c.parked&&(R.started||form);const v=moving?(c.pit?Math.min(c.v,22):c.v):0;
  let{gear,rpm}=gearRpm(Math.max(1,v));if(!R.started&&!form)rpm=R.lightsStart!=null&&R.t>R.lightsStart-1?10500+Math.sin(t*9)*700:6500;if(c.hold)rpm=10500+Math.sin(t*9)*700;if(c.pit&&c.pit.phase==="stop")rpm=4200;if(!running(c))rpm=0;
  if(gear>SNDLAST.gear&&moving){e.g.gain.setValueAtTime(e.g.gain.value*.3,t);sndClick(.09,170)}else if(gear<SNDLAST.gear&&moving&&c.acc<-6)sndClick(.06,120);// troca de marcha (subida com corte, redução com "pop")
  SNDLAST.gear=gear;c._gear=gear;c._rpm=rpm;
  const thr=c.acc>.5?1:c.acc<-3?0:.45;const f=rpm/20;
  e.oscs.forEach(x=>x.o.frequency.setTargetAtTime(Math.max(20,f*x.mul),t,.02));e.lp.frequency.setTargetAtTime(900+thr*2600+rpm*.12,t,.05);
  const vol=(rpm?(.16+thr*.3):0)*D*(sp>8?.4:1);e.g.gain.setTargetAtTime(vol,t,.03);
  e.ex.frequency.setTargetAtTime(Math.max(18,f*.5),t,.03);e.exg.gain.setTargetAtTime(rpm?(.1+thr*.14)*D:0,t,.05);
  e.in.f.frequency.setTargetAtTime(1600+rpm*.22,t,.05);e.in.g.gain.setTargetAtTime(rpm?thr*.05*D:0,t,.06);
  e.tb.g.gain.setTargetAtTime(rpm?(c.acc<-4?.06:.02)*D:0,t,.08);e.tb.f.frequency.setTargetAtTime(3800+rpm*.25,t,.1);
  const ersOn=moving&&c.acc>.3&&(c.batt||0)>3;e.ers.frequency.setTargetAtTime(300+v*14,t,.05);e.ersg.gain.setTargetAtTime(ersOn?(c.ers==="attack"||c.ovMode?.035:.016)*D:0,t,.08);
  e.wn.g.gain.setTargetAtTime(Math.min(.26,v*v/26000)*D,t,.1);
  const kap=Math.abs(R.geo.k[Math.floor(fr(c.prog)*R.geo.N)%R.geo.N]);const lat=v*v*kap/9.81;const lock=c.acc<-30||!!c.ex||(c.dyn&&c.dyn.lock>.2)||(c.dyn&&(c.dyn.spin||Math.abs(c.dyn.beta)>.2));
  e.sq.g.gain.setTargetAtTime(lock?.2:(lat>3.6?Math.min(.08,(lat-3.6)*.04):0)*D,t,.04);
  const surf=moving&&typeof surfAt==="function"?surfAt(c):"pista";
  e.gr.g.gain.setTargetAtTime(surf==="brita"?.3*D:surf==="grama"?.12*D:0,t,.05);e.gr.f.frequency.setTargetAtTime(surf==="brita"?520:300,t,.1);
  e.kbg.gain.setTargetAtTime(surf==="zebra"&&v>8?.16*D:0,t,.02);e.kb.frequency.setTargetAtTime(14+v*.9,t,.05);
  // ambiente: público, chuva e eco (túnel de Mônaco forte; pistas de rua com eco leve dos muros)
  e.cr.g.gain.setTargetAtTime((R.C.street?.03:.045)+(typeof o.cheer==="number"?Math.max(0,o.cheer-.1)*.15:o.cheer?.12:0),t,.4);
  e.rn.g.gain.setTargetAtTime(R.w>.15?Math.min(.09,R.w*.1):0,t,.6);
  const tun=sndTunnelAt(fr(c.prog));SND.revG.gain.setTargetAtTime(tun?.55:R.C.street?.09:0,t,tun?.08:.4);
  // carro passando perto: Doppler pela velocidade relativa e lado pelo estéreo
  const n=o.near;if(n){const nv=n.v||0;const df=Math.max(.2,n.d);const rel=clamp((nv-v)/40,-.5,.5);const dop=n.app?1+Math.abs(rel)*.25:1-Math.abs(rel)*.25;
    e.po.frequency.setTargetAtTime(Math.max(30,gearRpm(nv).rpm/20*dop),t,.05);e.pg.gain.setTargetAtTime(Math.min(.14,.05/df),t,.05);if(e.pp)e.pp.pan.setTargetAtTime(clamp(n.pan||0,-.9,.9),t,.06)}
  else e.pg.gain.setTargetAtTime(0,t,.1);
  // o rádio abaixa o motor por um instante
  const ducking=performance.now()<SND.duckT;SND.duck.gain.setTargetAtTime(ducking?.35:1,t,.08);e.st.g.gain.setTargetAtTime(ducking?.035:0,t,.05)}
function sndSilence(all){if(!SND.eng)return;const t=SND.ctx.currentTime,e=SND.eng;[e.g,e.exg,e.in.g,e.tb.g,e.ersg,e.wn.g,e.sq.g,e.gr.g,e.kbg,e.pg,e.rn.g,e.st.g].forEach(g=>g.gain.setTargetAtTime(0,t,.05));e.cr.g.gain.setTargetAtTime(all?0:.04,t,.3);SND.revG.gain.setTargetAtTime(0,t,.1)}
function sndClick(a,fq){if(!SND.on||!SND.ctx)return;const ctx=SND.ctx,t=ctx.currentTime;const o=ctx.createOscillator(),g=ctx.createGain();o.type="triangle";o.frequency.setValueAtTime(fq,t);o.frequency.exponentialRampToValueAtTime(fq*.4,t+.06);g.gain.setValueAtTime(a,t);g.gain.exponentialRampToValueAtTime(.001,t+.07);o.connect(g);g.connect(SND.b.fx);o.start(t);o.stop(t+.08)}
// bipe clássico do rádio de equipe (dois tons) + chiado e motor mais baixo enquanto fala
function sndRadio(sec){if(!SND.on||!SND.ctx)return;const ctx=SND.ctx,t=ctx.currentTime;SND.duckT=performance.now()+(sec||1.6)*1000;
  [[1250,0],[960,.09]].forEach(([fq,d])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=fq;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.14,t+d+.01);g.gain.linearRampToValueAtTime(0,t+d+.08);o.connect(g);g.connect(SND.b.voice);o.start(t+d);o.stop(t+d+.1)})}
function sndBeep(n){if(!SND.on||!SND.ctx)return;const ctx=SND.ctx,t=ctx.currentTime;for(let i=0;i<(n||1);i++){const o=ctx.createOscillator(),g=ctx.createGain();o.type="square";o.frequency.value=880;g.gain.setValueAtTime(.08,t+i*.15);g.gain.setValueAtTime(0,t+i*.15+.08);o.connect(g);g.connect(SND.b.fx);o.start(t+i*.15);o.stop(t+i*.15+.1)}}
// batida: força 0..1 (toque leve = estalo curto; batida forte = estrondo grave e longo com peças voando)
function sndImpact(force,dist){if(!SND.on||!SND.ctx)return;const ctx=SND.ctx,t=ctx.currentTime;const F=clamp(force,0,1),a=(.12+F*.55)/Math.max(1,dist||1);if(a<.02)return;
  const s=ctx.createBufferSource();s.buffer=SND.noise;const f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=300+F*900;const g=ctx.createGain();const len=.15+F*1.1;
  g.gain.setValueAtTime(a,t);g.gain.exponentialRampToValueAtTime(.001,t+len);s.connect(f);f.connect(g);g.connect(SND.b.fx);s.start(t,Math.random());s.stop(t+len+.05);
  const o=ctx.createOscillator(),og=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(70+F*40,t);o.frequency.exponentialRampToValueAtTime(30,t+.25);og.gain.setValueAtTime(a*.9,t);og.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(og);og.connect(SND.b.fx);o.start(t);o.stop(t+.32);
  if(F>.45)for(let i=0;i<4;i++){const d=.08+i*.07+Math.random()*.05;const p=ctx.createOscillator(),pg=ctx.createGain();p.type="square";p.frequency.value=900+Math.random()*1500;pg.gain.setValueAtTime(0,t+d);pg.gain.linearRampToValueAtTime(a*.12,t+d+.005);pg.gain.exponentialRampToValueAtTime(.001,t+d+.05);p.connect(pg);pg.connect(SND.b.fx);p.start(t+d);p.stop(t+d+.06)}}
function sndCrash(){sndImpact(1,1)}
// batida em algum lugar da pista: mais baixo quanto mais longe do carro que a câmera mostra
function sndHitAt(c,F){if(!SND.on||!R||!c)return;const f=R.cars.find(x=>x.isP);let d=1;if(f&&f!==c){let m=Math.abs(fr(c.prog)-fr(f.prog));m=Math.min(m,1-m)*R.geo.len;d=Math.max(1,m/40)}if(d<8)sndImpact(F,d)}
// ---------- voz (opcional): o navegador lê a narração e o rádio em português
const TTS={on:false,q:0};
function ttsOn(){return!!(typeof PREFS!=="undefined"&&PREFS.tts)&&typeof speechSynthesis!=="undefined"}
function ttsSay(who,txt,pri){if(!ttsOn()||!SND.on)return;try{const ss=speechSynthesis;if(ss.speaking&&(pri||1)<2)return;if(ss.speaking)ss.cancel();
  const u=new SpeechSynthesisUtterance(String(txt).replace(/[“”"]/g,""));u.lang="pt-BR";const vs=ss.getVoices().filter(v=>/^pt/i.test(v.lang));if(vs.length)u.voice=vs[who==="com"&&vs[1]?1:0];
  u.rate=who==="narr"?1.12:1.02;u.pitch=who==="com"?.9:1.05;u.volume=sndVols().voice*sndVols().master;SND.duckT=performance.now()+Math.min(6000,txt.length*70);ss.speak(u)}catch(e){}}
// ---------- música original (menus e resultados): sintetizada na hora, acordes + baixo + batida leve
const MUS={on:false,timer:0,step:0,next:0};
const MUS_PROG=[[57,60,64,67],[53,57,60,64],[55,59,62,65],[52,55,59,64]];// Lá menor, Fá, Sol, Mi menor (com sétimas)
function sndMusic(on){if(!on){MUS.on=false;clearInterval(MUS.timer);MUS.timer=0;return}if(!SND.on||!SND.ctx||MUS.on||sndVols().music<.01)return;MUS.on=true;MUS.next=SND.ctx.currentTime+.1;MUS.step=0;MUS.timer=setInterval(musTick,90)}
function musNote(m,t,d,type,a,dest){const ctx=SND.ctx;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=440*Math.pow(2,(m-69)/12);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.02);g.gain.setTargetAtTime(0,t+d*.6,d*.25);o.connect(g);g.connect(dest);o.start(t);o.stop(t+d+.4)}
function musTick(){if(!MUS.on||!SND.ctx)return;const ctx=SND.ctx,bus=SND.b.music,spb=60/104/2;// colcheias a 104 bpm
  while(MUS.next<ctx.currentTime+.35){const s=MUS.step,t=MUS.next,bar=Math.floor(s/16)%4,ch=MUS_PROG[bar],k=s%16;
    if(k===0)ch.forEach(m=>musNote(m,t,spb*16,"triangle",.035,bus));// pad
    if(k%4===0||k===14)musNote(ch[0]-24,t,spb*1.6,"sawtooth",.05,bus);// baixo
    if(k%2===0){const m=ch[(Math.floor(s/2)+bar)%4]+12;if(k!==6&&k!==12)musNote(m,t,spb*.9,"square",.012,bus)}// arpejo
    if(k%4===2){const n=ctx.createBufferSource();n.buffer=SND.noise;const f=ctx.createBiquadFilter();f.type="highpass";f.frequency.value=7000;const g=ctx.createGain();g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);n.connect(f);f.connect(g);g.connect(bus);n.start(t,Math.random());n.stop(t+.06)}
    if(k===0||k===8){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.18)}
    MUS.step++;MUS.next+=spb}}
// ---------- tela de volumes
function sndPanel(){const v=sndVols();return`<h3>Som</h3><div class="volg">${SND_BUS.map(([k,n])=>`<label class="volr"><span>${n}</span><input type="range" min="0" max="100" value="${Math.round(v[k]*100)}" data-vol="${k}" aria-label="volume: ${n}"><b class="num">${Math.round(v[k]*100)}</b></label>`).join("")}</div>
  <div class="choice"><button class="chip${ttsOn()?" on":""}" data-act="tvTts" aria-pressed="${ttsOn()}"><b>${ttsOn()?"✓ ":""}Narração falada (voz do navegador)</b></button></div>`}
if(typeof document!=="undefined")document.addEventListener("pointerdown",()=>{try{if(typeof G!=="undefined"&&G&&G.settings&&G.settings.sound===true&&!UI.sound&&!(W&&W.step==="race")){UI.sound=sndToggle(true);if(UI.sound)sndMusic(true)}}catch(e){}});
if(typeof document!=="undefined")document.addEventListener("input",ev=>{const el=ev.target;if(!el||!el.dataset||!el.dataset.vol)return;sndVolSet(el.dataset.vol,el.value/100);const b=el.parentNode.querySelector("b");if(b)b.textContent=el.value;if(el.dataset.vol==="music"){if(+el.value>0&&UI.scr!=="race")sndMusic(true);else if(+el.value===0)sndMusic(false)}});
