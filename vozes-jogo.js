// ===================== VOZES NO JOGO =====================
// Liga a voz gerada pelo próprio jogo (voz-pt.js) às cenas e entrevistas: cada personagem tem uma voz estável
// (escolhida pelo nome), a emoção muda a fala e a boca segue o áudio. Pode ser desligada em Configurações > Vozes ou no botão de voz do rádio, das cenas e das entrevistas.
(function(GL){
let AC=null,OUT=null,REV=null,RU=null,atual=null;
function audio(){if(AC)return AC;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();const comp=AC.createDynamicsCompressor();comp.connect(AC.destination);OUT=AC.createGain();OUT.gain.value=.9;OUT.connect(comp);
  const n=AC.sampleRate*.4,ir=AC.createBuffer(2,n,AC.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2)}REV=AC.createConvolver();REV.buffer=ir;const rg=AC.createGain();rg.gain.value=.12;REV.connect(rg);rg.connect(OUT);
  const m=AC.sampleRate;RU=AC.createBuffer(1,m,AC.sampleRate);const d=RU.getChannelData(0);for(let i=0;i<m;i++)d[i]=Math.random()*2-1;return AC}
// o navegador só libera som depois de um toque: destrava no primeiro clique
if(typeof document!=="undefined")document.addEventListener("pointerdown",()=>{try{const a=audio();if(a&&a.state==="suspended")a.resume()}catch(e){}},{passive:true});
function ativo(){return!!GL.VOZPT&&!(typeof PREFS!=="undefined"&&PREFS.vozes===false)&&!(typeof navigator!=="undefined"&&navigator.webdriver&&!window.VOZ_TESTE)}
function hs(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
// voz estável por personagem: o jogador usa a voz do piloto; os outros variam tom, tamanho da boca e ritmo pelo nome
function vozDe(o){const V=GL.VOZPT.VOZ_PT;let jog=false;try{jog=o.jogador||(typeof ME==="function"&&o.nome&&o.nome===ME().n)}catch(e){}
  if(jog)return{...V.piloto};const h=hs(o.nome||"x"),u=k=>((h>>>k)%1000)/1000;
  const fem=o.fem!=null?o.fem:/a$/i.test(String(o.nome||"").split(" ")[0]);const b=fem?V.reporter:(u(3)<.5?V.engenheiro:V.rival);
  return{...b,f0:b.f0*(.88+u(5)*.24),fs:b.fs*(.96+u(9)*.08),vel:b.vel*(.94+u(13)*.12),ar:b.ar*(.8+u(17)*.6)}}
const EMO={ouvindo:"neutro",revira:"irritado"};
function fala(txt,o){o=o||{};if(!ativo())return null;const ac=audio();if(!ac)return null;try{if(ac.state==="suspended")ac.resume();if(atual){try{atual.stop()}catch(e){}atual=null}
  const V=GL.VOZPT;const em=V.EMO_PT[EMO[o.emo]||o.emo]||V.EMO_PT.neutro;const R=V.sintetiza(String(txt).replace(/\*{2,}/g,m=>"#"+"x".repeat(m.length)+"#"),vozDe(o),em);
  const b=ac.createBuffer(1,R.amostras.length,R.fs);b.getChannelData(0).set(R.amostras);const s=ac.createBufferSource();s.buffer=b;const t0=ac.currentTime+.05;
  if(o.radio){const h=ac.createBiquadFilter();h.type="highpass";h.frequency.value=480;const l=ac.createBiquadFilter();l.type="lowpass";l.frequency.value=3000;const ws=ac.createWaveShaper();const cu=new Float32Array(1024);for(let i=0;i<1024;i++)cu[i]=Math.tanh((i/512-1)*3.5);ws.curve=cu;const g=ac.createGain();g.gain.value=.6;s.connect(h);h.connect(l);l.connect(ws);ws.connect(g);g.connect(OUT);
    const ch=ac.createBufferSource();ch.buffer=RU;ch.loop=true;const f=ac.createBiquadFilter();f.type="bandpass";f.frequency.value=2200;const cg=ac.createGain();ch.connect(f);f.connect(cg);cg.connect(OUT);const fim=t0+R.dur;
    cg.gain.setValueAtTime(0,t0-.04);cg.gain.linearRampToValueAtTime(.08,t0-.03);cg.gain.linearRampToValueAtTime(.012,t0);cg.gain.setValueAtTime(.012,fim);cg.gain.linearRampToValueAtTime(.09,fim+.01);cg.gain.linearRampToValueAtTime(0,fim+.08);ch.start(t0-.05);ch.stop(fim+.1)}
  else{s.connect(OUT);s.connect(REV)}
  s.start(t0);atual=s;const tl=R.tl;
  return{dur:R.dur+.05,boca:R.boca,indice(){const t=ac.currentTime-t0;if(t<0)return 0;let k=0;while(k<tl.length-1&&tl[k+1][0]<=t)k++;const a=tl[k],n=tl[k+1];return a[1]+(n?Math.min(1,(t-a[0])/(n[0]-a[0])):1)},para(){try{s.stop()}catch(e){}}}}catch(e){console.warn("voz",e);return null}}
// liga/desliga a voz de onde ela toca (rádio da corrida, cenas, entrevistas): o mesmo ajuste de Configurações > Vozes
function ligada(){return!(typeof PREFS!=="undefined"&&PREFS.vozes===false)}
function rotulo(){return ligada()?"🔊 Voz ligada":"🔇 Voz desligada"}
function botao(cls){return`<button type="button" class="${cls||"btn sm"} vozbt" data-voz="1" aria-pressed="${ligada()}" title="Liga ou desliga as vozes dos personagens (também em Configurações)">${rotulo()}</button>`}
function alterna(on){if(typeof PREFS==="undefined")return;PREFS.vozes=on==null?!ligada():!!on;if(typeof prefsSave==="function")prefsSave();
  if(!ligada()&&atual){try{atual.stop()}catch(e){}atual=null}
  if(typeof document!=="undefined")document.querySelectorAll("[data-voz]").forEach(b=>{b.textContent=rotulo();b.setAttribute("aria-pressed",String(ligada()))});return ligada()}
if(typeof document!=="undefined")document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-voz]");if(!b)return;e.preventDefault();e.stopPropagation();alterna()},true);
GL.VOZJ={fala,ativo,vozDe,alterna,botao,ligada};
})(typeof window!=="undefined"?window:globalThis);
