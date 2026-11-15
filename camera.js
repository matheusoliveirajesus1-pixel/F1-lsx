// ===================== CÂMERA AUTOMÁTICA =====================
// Segue o seu carro. Quando acontece um acidente, uma rodada ou um toque forte longe de você, corta para o lugar ao vivo,
// mostra o replay do momento e volta para você. Se você está numa briga colada, a câmera não sai de você:
// o lance aparece numa janela no canto. Enquanto mostra outro lugar, o seu carro aparece nessa janela.
const SMART={mode:"me",hlN:0,ev:null,until:0,rep:null,label:"",pip:null,cool:0,shot:"chase",shotT:0,mineT:-99,scOn:false};
function smartReset(){Object.assign(SMART,{mode:"me",hlN:R&&R.hl?R.hl.length:0,ev:null,until:0,rep:null,label:"",pip:null,cool:0,shot:"chase",shotT:0,mineT:-99,scOn:false})}
function meCar(){return R.cars.find(c=>c.isP)}
function inBattle(me){if(!me||!running(me)||me.pit||R.sc||!R.started)return false;const v=Math.max(25,me.v||0);
  return!!((me.ahead&&running(me.ahead)&&!me.ahead.pit&&me.dA<v*.65)||(me.behind&&running(me.behind)&&!me.behind.pit&&me.dB<v*.65))}
const SMART_W={crash:3,spin:2,contact:2};
function evPos(ev){for(const id of ev.cars){const w=R.wrecks.find(x=>x.c&&x.c.id===id&&!x.removed);if(w)return trackPos(w.f,(w._lw??w.lat)*WS);const c=R.cars.find(x=>x.id===id);if(c&&c._w)return c._w}
  return ev.pos||null}
function smartScan(me){let best=null;
  while(SMART.hlN<R.hl.length){const h=R.hl[SMART.hlN++];const w=SMART_W[h.type];if(!w||(h.imp||1)<2)continue;
    if(me&&h.cars.includes(me.id)){SMART.mineT=R.t;continue}
    if(SMART.ev&&R.t-SMART.ev.t<4&&SMART.mode!=="me"){SMART.ev.cars=[...new Set(SMART.ev.cars.concat(h.cars))];continue}
    if(!best||w>best.w)best={t:h.t,type:h.type,cars:h.cars.slice(),w}}
  // safety car entrando
  const sc=!!(R.sc&&R.sc.type==="sc");if(sc&&!SMART.scOn&&!best&&typeof scWorld==="function"){const p=scWorld();if(p)best={t:R.t,type:"sc",cars:[],w:1,pos:p}}SMART.scOn=sc;
  return best}
// ---------- vinheta: transição lenta antes de trocar o que aparece (replay, volta ao vivo, troca de câmera)
const VIN={t0:-99,dur:1.25,fn:null,feito:true};
function vinheta(fn){if(VIN.fn&&!VIN.feito)return false;VIN.t0=performance.now()/1000;VIN.fn=fn;VIN.feito=false;return true}
function vinhetaPend(){return !!(VIN.fn&&!VIN.feito)}
function vinhetaTick(){const t=performance.now()/1000-VIN.t0;if(!VIN.feito&&t>=VIN.dur*.45){VIN.feito=true;try{VIN.fn&&VIN.fn()}catch(e){}}}
function vinhetaDraw(ctx,cw,ch){const t=performance.now()/1000-VIN.t0,D=VIN.dur;if(t<0||t>D)return;const a=D*.45;let k=t<a?t/a:t<D-a?1:(D-t)/a;k=Math.max(0,Math.min(1,k));const e=k*k*(3-2*k);
  // faixas diagonais que cobrem a tela devagar e abrem depois da troca
  const w=cw+ch*.6;ctx.save();ctx.fillStyle=`rgba(10,12,16,${.92*e})`;ctx.fillRect(0,0,cw,ch);
  const x0=-ch*.6+w*e*(t<a?1:1);ctx.globalAlpha=Math.min(1,e*1.4);ctx.fillStyle="#FF4D2E";ctx.beginPath();ctx.moveTo(x0-120,0);ctx.lineTo(x0-60,0);ctx.lineTo(x0-60-ch*.6,ch);ctx.lineTo(x0-120-ch*.6,ch);ctx.closePath();ctx.fill();
  ctx.fillStyle="#FFFFFF";ctx.beginPath();ctx.moveTo(x0-48,0);ctx.lineTo(x0-38,0);ctx.lineTo(x0-38-ch*.6,ch);ctx.lineTo(x0-48-ch*.6,ch);ctx.closePath();ctx.fill();
  if(e>.6){ctx.globalAlpha=(e-.6)/.4;ctx.fillStyle="#FFFFFF";ctx.font="900 italic 22px 'Titillium Web',sans-serif";ctx.textAlign="center";ctx.fillText("PADDOCK TV",cw/2,ch/2+8)}ctx.restore()}
// câmera de TV contínua: não corta; aproxima devagar nas brigas e curvas lentas, abre nas retas e quando está tudo calmo
function shotTVSuave(dt,cw,ch,me,battle){const p=me._w||carWorld(me);const v=me.v||0;let tx=p.x,ty=p.y;let rival=null;
  if(battle){let bd=1e9;for(const c of R.cars){if(c===me||!running(c)||!c._w)continue;const d=Math.hypot(c._w.x-p.x,c._w.y-p.y);if(d<bd){bd=d;rival=c}}if(rival&&bd<40*WS){tx=(p.x+rival._w.x)/2;ty=(p.y+rival._w.y)/2}else rival=null}
  const la=clamp(v*.35,2,26)*WS;tx+=Math.cos(p.h)*la;ty+=Math.sin(p.h)*la;
  const base=Math.min(cw,ch*1.3)/(WS*viewMeters(cw));const lento=1-clamp((v-25)/55,0,1);let alvo=.95+.35*lento;if(rival)alvo=1.3;if(me.pit)alvo=1.1;
  SMART.tvz=SMART.tvz==null?alvo:SMART.tvz+(alvo-SMART.tvz)*(1-Math.exp(-dt/2.6));const[ix,iy]=iso(tx,ty);camTo(dt,ix,iy,base*SMART.tvz*CAM.userZ,.35,2.2)}
function smartLabel(ev,live){const nm={crash:"Acidente",spin:"Rodada",contact:"Toque",sc:"Safety car na pista"}[ev.type]||"Lance";const who=ev.cars.map(id=>{const c=R.cars.find(x=>x.id===id);return c?c.code:""}).filter(Boolean).join(" × ");
  return`${live?"AO VIVO":"REPLAY"} · ${nm}${who?" · "+who:""}`}
// escolhe o que a câmera mostra (chamado a cada quadro); devolve o carro em foco
function smartPick(dt,cw,ch){const me=meCar();const ev=smartScan(me);const battle=inBattle(me);const mine=R.t-SMART.mineT<5;
  if(ev){if(battle||mine||!me||!running(me)){if(ev.type!=="sc")SMART.pip={ev,until:R.t+7}}
    else if(SMART.mode==="me"&&(R.t>=SMART.cool||ev.w>=3)&&!vinhetaPend()){vinheta(()=>{SMART.ev=ev;SMART.mode="live";SMART.until=Math.max(R.t+2.6,ev.t+3.2);SMART.label=smartLabel(ev,true);CAM.cut=1;SMART.pip=null})}}
  if(SMART.mode!=="me"&&(battle||mine)&&!vinhetaPend()){vinheta(smartBack)}
  if(SMART.mode==="live"){const p=evPos(SMART.ev);if(!p){smartBack()}else{const[tx,ty]=iso(p.x,p.y);camTo(dt,tx,ty,Math.min(cw,ch*1.3)/(WS*95)*CAM.userZ,.25,1.2);camShake(dt,null);
      if(R.t>=SMART.until&&!vinhetaPend()){vinheta(()=>{if(!smartStartReplay())smartBack()})}return null}}
  if(SMART.mode==="replay")return null;
  // no seu carro: perseguição; numa briga, câmera de TV para mostrar os dois
  if(!me||(!running(me)&&me.status!=="fin")||(me.status==="fin"&&R.over)){shotAll(dt,cw,ch);camShake(dt,null);SMART.label="";return null}
  // variedade de câmeras sem cortes nervosos: cada plano dura pelo menos 6-7 s; numa reta tranquila, alterna aérea e câmera de curva
  SMART.label="";shotTVSuave(dt,cw,ch,me,battle);camShake(dt,me);return me;
  let want;const el=R.t-SMART.shotT;if(battle)want="tv";else if(SMART.shot==="heli"||SMART.shot==="tvc")want=el<7.5?SMART.shot:"chase";
  else if(SMART.shot==="chase"&&el>16&&R.started&&!R.sc&&!me.pit&&!R.over){SMART.alt=SMART.alt==="heli"?"tvc":"heli";want=SMART.alt}else want=SMART.shot==="tv"?"chase":SMART.shot;
  if(want!==SMART.shot&&el>6){SMART.shot=want;SMART.shotT=R.t;CAM.cut=1;TV.cam=null}
  SMART.label="";if(SMART.shot==="tv"||SMART.shot==="tvc")shotTV(dt,cw,ch,me);else if(SMART.shot==="heli"&&typeof shotHeli==="function")shotHeli(dt,cw,ch,me);else shotChase(dt,cw,ch,me);camShake(dt,me);return me}
function smartBack(){SMART.mode="me";SMART.rep=null;SMART.label="";SMART.cool=R.t+9;CAM.cut=1;TV.cam=null}
function smartStartReplay(){const ev=SMART.ev;if(!ev||!R.rb||ev.type==="sc")return false;const fr0=R.rb.filter(x=>x.t>=ev.t-5&&x.t<=ev.t+2.2);/* replay mais longo */if(fr0.length<8)return false;
  SMART.rep={frames:fr0.map(f=>({t:f.t,cars:f.cars.map(c=>({...c})),sc:f.sc})),t:fr0[0].t,t1:fr0[fr0.length-1].t,ev,fx:R.fxq.slice()};SMART.mode="replay";SMART.label=smartLabel(ev,false);CAM.cut=1;return true}
// desenha o replay no lugar da corrida ao vivo
function smartDrawReplay(ctx,cw,ch,dt){const rep=SMART.rep;if(!rep)return false;const ev=rep.ev;
  if(!UI.paused){const near=Math.abs(rep.t-ev.t)<1;rep.t+=dt*(near?.45:.9)}if(rep.t>=rep.t1){rep.t=rep.t1;if(!rep.trans){rep.trans=1;vinheta(()=>{rep.trans=0;/* segunda passada em 3D: onboard em ultrapassagem e acidente, perseguição nos outros lances */if(!rep.p2&&typeof P3D!=="undefined"&&P3D.on&&ev.cars&&ev.cars.length){rep.p2=1;rep.cam="onboard";rep.t=Math.max(rep.frames[0].t,ev.t-3.2);rep.t1=Math.min(rep.frames[rep.frames.length-1].t,ev.t+1.8);CAM.cut=1}else smartBack()})}}
  const S=frameAt({frames:rep.frames},rep.t);const inv=S.cars.filter(c=>ev.cars.includes(c.id));let m;
  if(inv.length){m={x:inv.reduce((s,c)=>s+c.x,0)/inv.length,y:inv.reduce((s,c)=>s+c.y,0)/inv.length}}else{const p=evPos(ev);if(!p){smartBack();return false}m=p}
  let z=Math.min(cw,ch*1.3)/(WS*62);if(inv.length>1){let d=0;for(const a of inv)for(const b of inv){const[ax,ay]=iso(a.x,a.y),[bx,by]=iso(b.x,b.y);d=Math.max(d,Math.hypot(ax-bx,ay-by))}z=Math.min(z,Math.min(cw,ch)*.5/Math.max(1,d))}
  const[tx,ty]=iso(m.x,m.y);camTo(dt,tx,ty,Math.max(.3,z)*CAM.userZ,.18,.5);CAM.sx=0;CAM.sy=0;
  const fx=R.fxq;R.fxq=rep.fx;try{drawScene(ctx,cw,ch,{S,T:rep.t,pip:true,foc:ev.cars,cam3d:rep.p2?{tipo:rep.cam||"onboard",id:ev.cars[0],chave:"rep"}:null})}finally{R.fxq=fx}
  if(!rep.p2)for(const c of inv){const s=toScreen(c.x,c.y,0,cw,ch);ctx.strokeStyle="#FFD400";ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(s[0],s[1],5.4*WS*CAM.z,2.9*WS*CAM.z,0,0,7);ctx.stroke();ctx.setLineDash([])}
  // faixas de replay
  ctx.fillStyle="rgba(0,0,0,.18)";ctx.fillRect(0,0,cw,ch);const near=Math.abs(rep.t-ev.t)<.7;
  const bx=cw/2-62,by=cw<640?132:44;ctx.fillStyle="#0E1116E6";ctx.fillRect(bx,by,124,26);ctx.fillStyle=Math.floor(performance.now()/400)%2?"#FF3B3B":"#7A1010";ctx.beginPath();ctx.arc(bx+16,by+13,5,0,7);ctx.fill();
  ctx.fillStyle="#FFF";ctx.font="700 13px 'Titillium Web',sans-serif";ctx.textAlign="left";ctx.fillText(rep.p2?"REPLAY · ONBOARD":near?"REPLAY · LENTO":"REPLAY",bx+28,by+18);return true}
// janela no canto: o seu carro (quando a câmera está em outro lugar) ou o lance (quando você está brigando)
let PIP=null;
function smartPip(ctx,cw,ch){if(typeof QL!=="undefined"&&QL.lvl===0)return;if(cw<640&&((typeof BCX!=="undefined"&&BCX.tw)||(typeof TVX!=="undefined"&&TVX.ban)))return;/* celular: a torre aberta ocupa o canto */const me=meCar();let tgt=null,lab="",col="#FFFFFF";
  if(SMART.mode!=="me"&&me&&me._w&&running(me)){tgt=me._w;lab=`VOCÊ · P${dpos(me)}`}
  else if(SMART.pip&&R.t<SMART.pip.until){const p=evPos(SMART.pip.ev);if(p){tgt=p;lab=smartLabel(SMART.pip.ev,true);col="#FFD400"}}else SMART.pip=null;
  if(!tgt)return;const mob=cw<640;const w=Math.round(mob?cw*.44:Math.min(300,cw*.27)),h=Math.round(w*.62),x=cw-w-10,y=mob?118:122;
  const dpr=(typeof qDpr==="function"?qDpr():Math.min(2,window.devicePixelRatio||1));if(!PIP)PIP=document.createElement("canvas");if(PIP.width!==Math.round(w*dpr)||PIP.height!==Math.round(h*dpr)){PIP.width=Math.round(w*dpr);PIP.height=Math.round(h*dpr)}
  const tn=performance.now(),key=tgt.x.toFixed(0)+lab;if(!(PIP._t&&tn-PIP._t<66&&PIP._w===w)){PIP._t=tn;PIP._w=w;const pc=PIP.getContext("2d");pc.setTransform(dpr,0,0,dpr,0,0);const sv={x:CAM.x,y:CAM.y,z:CAM.z,sx:CAM.sx,sy:CAM.sy};
  const[ix,iy]=iso(tgt.x,tgt.y);CAM.x=ix;CAM.y=iy;CAM.z=w/(WS*(mob?44:56)*1.6);CAM.sx=0;CAM.sy=0;
  try{drawScene(pc,w,h,{pip:true})}catch(e){}finally{Object.assign(CAM,sv)}}
  ctx.save();ctx.shadowColor="rgba(0,0,0,.5)";ctx.shadowBlur=10;ctx.drawImage(PIP,x,y,w,h);ctx.restore();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
  ctx.font="700 11px 'Titillium Web',sans-serif";const tw=Math.min(w-8,ctx.measureText(lab).width+12);ctx.fillStyle="#0E1116E6";ctx.fillRect(x,y+h-18,tw,18);ctx.fillStyle=col;ctx.textAlign="left";ctx.fillText(lab,x+6,y+h-5)}
