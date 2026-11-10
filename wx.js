// ===================== RADAR DE CHUVA, PREVISÃO (QUE PODE ERRAR) E TELEMETRIA COMPARADA =====================
// A equipe olha o radar e faz uma previsão. Quanto mais longe a chuva, maior o erro; num dia seco ela às vezes vê
// nuvens que não chegam. Quem fez simulação de corrida no treino livre tem previsão mais precisa.
const WXR={fc:null,next:0,said:{},cells:null,ang:0,falseAt:null,draw:0};
function wxReset(){WXR.fc=null;WXR.next=0;WXR.said={};WXR.cells=null;WXR.ang=vrr(0,6.28);WXR.falseAt=vrnd()<.28?vrr(.25,.75):null;WXR.draw=0}
// próximo trecho de chuva do plano (em voltas)
function wxNextRain(){const lap=R.lead+fr(R.order[0]?R.order[0].prog:0);const pl=(W&&W.weather)||[];let best=null;for(const p of pl){if(p.e<=lap)continue;if(p.s<=lap)return{now:true,s:p.s,e:p.e,int:p.int,eta:0};if(!best||p.s<best.s)best=p}
  return best?{now:false,s:best.s,e:best.e,int:best.int,eta:best.s-lap}:null}
function wxForecast(){if(R.t<WXR.next&&WXR.fc)return WXR.fc;WXR.next=R.t+6;const nr=wxNextRain();const prec=W&&W.knowWear?.5:1;const left=R.L-R.lead;let fc;
  if(nr&&nr.now)fc={kind:"now",txt:`Chovendo agora. ${nr.e-R.lead<=left?`A equipe acha que para em ~${Math.max(1,Math.round(nr.e-R.lead+vgauss()*.6*prec))} volta(s).`:"Deve seguir até o fim."}`,p:.9,eta:0,int:nr.int};
  else if(nr&&nr.eta<12){const err=(.6+nr.eta*.28)*prec;const eta=Math.max(1,Math.round(nr.eta+vgauss()*err));const p=clamp(.95-nr.eta*.06*prec+vgauss()*.05,.35,.95);fc={kind:"rain",eta,p,int:nr.int,txt:`Chuva ${nr.int>1?"forte":"fraca"} chegando em ~${eta} volta${eta>1?"s":""} (${Math.round(p*100)}% de chance).`}}
  else if(WXR.falseAt!=null&&R.lead/R.L>WXR.falseAt-.12&&R.lead/R.L<WXR.falseAt+.08){const p=clamp(.3+vgauss()*.06,.18,.45);fc={kind:"maybe",eta:Math.max(2,Math.round(vrr(2,6))),p,int:1,txt:`Nuvens no radar: ${Math.round(p*100)}% de chance de garoa nas próximas voltas.`,fake:true}}
  else fc={kind:"dry",eta:99,p:clamp(.85-(1-prec)*-.05,.6,.95),txt:`Sem chuva prevista nas próximas ${Math.min(10,Math.max(1,left))} voltas.`};
  WXR.fc=fc;const me=meCar();
  if(me&&me.isP&&!R.over&&fc.kind!=="dry"&&fc.eta<=5&&!WXR.said[fc.kind]){WXR.said[fc.kind]=1;radio(me,`${G.engineer||"Engenheiro"}: "Radar: ${fc.txt}"`,{k:"chuva"})}
  if(fc.kind==="dry"){WXR.said={}}return fc}
// células de chuva que andam na direção da pista conforme a previsão
function wxCells(fc,w,h){if(!WXR.cells){WXR.cells=[];for(let i=0;i<7;i++)WXR.cells.push({a:vrr(-.6,.6),r:vrr(.06,.15),o:vrr(0,1),ph:vrr(0,6)})}
  const show=fc.kind!=="dry";const prog=fc.kind==="now"?0:clamp(fc.eta/8,0,1.3);const cx=w/2,cy=h/2,R0=Math.max(w,h)*.62;const t=performance.now()/1000;
  return show?WXR.cells.map(c=>{const d=(prog+c.o*.25)*R0;const a=WXR.ang+c.a;return{x:cx+Math.cos(a)*d+Math.sin(t*.3+c.ph)*6,y:cy+Math.sin(a)*d*.75+Math.cos(t*.25+c.ph)*4,r:c.r*Math.min(w,h)*(fc.int>1?1.5:1.1)*(fc.fake?.7:1),k:fc.int>1?1:.6}}):[]}
function wxDraw(){const cv=$("#radar");if(!cv||!cv.offsetParent)return;if(performance.now()-WXR.draw<250)return;WXR.draw=performance.now();const ctx=cv.getContext("2d"),w=cv.width,h=cv.height;
  try{drawMinimap(ctx,w,h)}catch(e){ctx.fillStyle="#0E1116";ctx.fillRect(0,0,w,h)}const fc=wxForecast();
  ctx.save();ctx.globalCompositeOperation="lighter";for(const c of wxCells(fc,w,h)){const g=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,c.r);g.addColorStop(0,c.k>.8?"rgba(255,80,60,.55)":"rgba(255,214,0,.45)");g.addColorStop(.45,"rgba(33,197,93,.35)");g.addColorStop(1,"rgba(33,120,200,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,7);ctx.fill()}ctx.restore();
  // varredura do radar
  const a=(performance.now()/1000*1.6)%(Math.PI*2);ctx.strokeStyle="rgba(33,197,93,.35)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w/2,h/2);ctx.lineTo(w/2+Math.cos(a)*w,h/2+Math.sin(a)*w);ctx.stroke();
  ctx.fillStyle="#C9CED8";ctx.font="700 18px 'Titillium Web',sans-serif";ctx.textAlign="left";ctx.fillText("RADAR",12,26);
  const el=$("#wxfc");if(el){const t=`<b>Previsão da equipe:</b> ${esc(fc.txt)} <span class="muted">Pista ${Math.round(R.w*100)}% molhada.${W&&W.knowWear?" Previsão afinada no treino livre.":" A previsão pode errar."}</span>`;if(el._t!==t){el._t=t;el.innerHTML=t}}}
// ---------- telemetria comparada: sua volta, sua melhor volta, o carro da frente e a diferença de tempo
function traceAheadRec(me){const A=R.order[pos(me)-2];if(!A||!running(A)||A.pit){return}if(UI.traceAid!==A.id||!UI.traceA){UI.traceAid=A.id;UI.traceA=new Float32Array(R.geo.N)}const i=Math.floor(fr(A.prog)*R.geo.N)%R.geo.N;UI.traceA[i]=A.v*3.6}
function drawTraceCmp(me){const cv=$("#trace");if(!cv||!me)return;const ctx=cv.getContext("2d"),w=cv.width,h=cv.height,N=R.geo.N;const A=UI.traceAid&&R.cars.find(c=>c.id===UI.traceAid);
  if(A&&UI.traceA){const Y=v=>h-14-(v/360)*(h-30);ctx.strokeStyle=A.t.c;ctx.globalAlpha=.8;ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();let st=false;for(let i=0;i<N;i+=2){const v=UI.traceA[i];if(!v){st=false;continue}const x=i/N*w;st?ctx.lineTo(x,Y(v)):ctx.moveTo(x,Y(v));st=true}ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1}
  // diferença para a melhor volta (faixa de baixo): verde = ganhando tempo, vermelho = perdendo
  if(me.cpBest&&me.cpCur&&me.cpNext>2){const H=36,y0=h-H-2;ctx.fillStyle="rgba(255,255,255,.04)";ctx.fillRect(0,y0,w,H);ctx.strokeStyle="#5B6470";ctx.beginPath();ctx.moveTo(0,y0+H/2);ctx.lineTo(w,y0+H/2);ctx.stroke();
    ctx.lineWidth=2.5;let last=0;for(let i=1;i<me.cpNext&&i<101;i++){const d=me.cpCur[i]-me.cpBest[i];if(!isFinite(d)||!me.cpBest[i])continue;const x0=(i-1)/100*w,x1=i/100*w,y=y0+H/2+clamp(d,-1,1)*H/2;ctx.strokeStyle=d<=0?"#21C55D":"#FF4D4F";ctx.beginPath();ctx.moveTo(x0,y0+H/2+clamp(last,-1,1)*H/2);ctx.lineTo(x1,y);ctx.stroke();last=d}
    const d=me.cpCur[Math.min(100,me.cpNext-1)]-me.cpBest[Math.min(100,me.cpNext-1)];ctx.font="700 16px 'Roboto Mono',monospace";ctx.fillStyle=d<=0?"#21C55D":"#FF4D4F";ctx.textAlign="right";ctx.fillText((d<=0?"−":"+")+Math.abs(d).toFixed(2)+" s",w-8,y0+14);ctx.textAlign="left"}
  ctx.fillStyle="#0A0C10";ctx.fillRect(0,0,w,32);ctx.font="500 17px 'Roboto Mono',monospace";ctx.fillStyle="#FFD400";ctx.fillText("■ volta atual",8,22);ctx.fillStyle="#8C96A3";ctx.fillText("■ sua melhor",170,22);
  if(A){ctx.fillStyle=A.t.c;ctx.fillText(`■ ${A.code} (à frente)`,330,22)}ctx.fillStyle="#8C96A3";ctx.fillText("embaixo: diferença para a sua melhor volta",w>800?520:8,w>800?22:52)}
