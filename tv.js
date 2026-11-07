// ===================== TRANSMISSÃO: VINHETAS, FAIXAS, NARRAÇÃO, RÁDIO DOS PILOTOS E MELHORES MOMENTOS =====================
// Tudo desenhado por cima da corrida, como numa transmissão de TV:
// vinheta na troca de câmera, faixa com o nome do piloto, avisos grandes (safety car, novo líder, última volta),
// legenda do narrador e do comentarista, rádio dos pilotos com personalidade e um resumo com os lances no fim.
const TVX={st:-9,stCol:"#E10600",lastFlash:0,hl:0,ban:null,banQ:[],cap:null,capQ:[],narrN:0,comNext:40,rad:null,radNext:25,radSaid:{},clipQ:[],lastCut:-9,lowKey:"",
  sc:null,red:false,lastLap:false,rain:false,fastT:1e9,vsc:false,flagsSeen:{}};
function tvReset(){Object.assign(TVX,{st:-9,lastFlash:0,hl:0,ban:null,banQ:[],cap:null,capQ:[],narrN:0,comNext:40,rad:null,radNext:25,radSaid:{},clipQ:[],lastCut:-9,lowKey:"",sc:null,red:false,lastLap:false,rain:false,fastT:1e9,flagsSeen:{}});if(R)R.clips=[]}
const TVF="'Titillium Web',system-ui,sans-serif";
function tvOn(){return typeof PREFS==="undefined"||PREFS.tv!==false}
// ---------- chamado a cada quadro, depois de desenhar a pista
function tvOverlay(ctx,cw,ch,dt){if(!R)return;if(!R.clips)R.clips=[];const now=performance.now()/1000;
  if(CAM.flash>TVX.lastFlash+.4){TVX.st=now;TVX.lastCut=R.t;const f=typeof SMART!=="undefined"&&SMART.mode==="me"?meCar():null;TVX.stCol=f&&f.t?f.t.c:"#E10600"}TVX.lastFlash=CAM.flash;CAM.flash=0;
  tvEvents();tvClipTick();if(!tvOn()){tvStinger(ctx,cw,ch,now);return}
  tvStinger(ctx,cw,ch,now);tvBanner(ctx,cw,ch,now);tvRadioCard(ctx,cw,ch,now);tvCaption(ctx,cw,ch,now)}
// vinheta de troca de câmera: uma faixa diagonal passa pela tela em ~0,45 s (a câmera corta escondida atrás dela)
function tvStinger(ctx,cw,ch,now){const k=(now-TVX.st)/.45;if(k<0||k>1)return;const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;const W=cw*.55,x=-W-ch*.5+(cw+W+ch)*e;
  ctx.save();ctx.globalAlpha=.94;ctx.fillStyle=TVX.stCol;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+W,0);ctx.lineTo(x+W-ch*.5,ch);ctx.lineTo(x-ch*.5,ch);ctx.fill();
  ctx.fillStyle="#FFFFFF";ctx.beginPath();ctx.moveTo(x+W,0);ctx.lineTo(x+W+14,0);ctx.lineTo(x+W+14-ch*.5,ch);ctx.lineTo(x+W-ch*.5,ch);ctx.fill();
  ctx.fillStyle="#111";ctx.beginPath();ctx.moveTo(x-10,0);ctx.lineTo(x,0);ctx.lineTo(x-ch*.5,ch);ctx.lineTo(x-10-ch*.5,ch);ctx.fill();
  ctx.globalAlpha=1;ctx.fillStyle="#FFFFFF";ctx.font=`900 italic ${Math.round(Math.min(cw,ch)*.07)}px ${TVF}`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("PADDOCK",x+W/2-ch*.25,ch/2);ctx.restore()}
// ---------- avisos grandes (topo da tela)
function tvBan(txt,sub,col,dur,pri){const b={txt,sub:sub||"",col:col||"#E10600",dur:dur||3.6,pri:pri||1};if(TVX.ban&&TVX.ban.pri<b.pri)TVX.ban=null;if(TVX.banQ.length<4)TVX.banQ.push(b)}
function tvBanner(ctx,cw,ch,now){if(!TVX.ban&&TVX.banQ.length){TVX.banQ.sort((a,b)=>b.pri-a.pri);TVX.ban=TVX.banQ.shift();TVX.ban.t0=now}const b=TVX.ban;if(!b)return;const a=now-b.t0;if(a>b.dur){TVX.ban=null;return}
  const mob=cw<640;const inK=Math.min(1,a/.28),outK=Math.min(1,(b.dur-a)/.25);const k=Math.min(inK,outK);const ease=1-Math.pow(1-k,3);
  const fs=mob?17:24,ss=mob?11:13;ctx.save();ctx.font=`900 italic ${fs}px ${TVF}`;const tw=ctx.measureText(b.txt).width;ctx.font=`700 ${ss}px ${TVF}`;const sw=b.sub?ctx.measureText(b.sub).width:0;
  const w=Math.min(cw-20,Math.max(tw,sw)+70),h=b.sub?(mob?46:58):(mob?34:42);const x=(cw-w)/2,y=(mob?168:84)-(1-ease)*30;ctx.globalAlpha=ease;
  ctx.fillStyle="rgba(10,12,16,.92)";ctx.fillRect(x,y,w,h);ctx.fillStyle=b.col;ctx.fillRect(x,y,8,h);ctx.fillRect(x,y+h-3,w*ease,3);
  ctx.fillStyle="#FFFFFF";ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.font=`900 italic ${fs}px ${TVF}`;ctx.fillText(b.txt,x+24,y+(b.sub?fs+6:h/2+fs*.36));
  if(b.sub){ctx.fillStyle="#C9CED8";ctx.font=`700 ${ss}px ${TVF}`;ctx.fillText(b.sub,x+24,y+h-12)}ctx.restore()}
// lê o que aconteceu na corrida e decide avisos, rádio e lances para o resumo
function tvEvents(){if(!R.started&&!R.form)return;const me=meCar();
  while(TVX.hl<R.hl.length){const h=R.hl[TVX.hl++];const cs=h.cars.map(id=>R.cars.find(x=>x.id===id)).filter(Boolean);const c=cs[0];
    if(h.type==="lead"&&c&&R.lead>0)tvBan("NOVO LÍDER",`${c.d.n.toUpperCase()} · ${c.t.n}`,c.t.c,3.8,3);
    if(h.type==="finish"&&c)tvBan("BANDEIRA QUADRICULADA",`${c.d.n} vence o ${R.C.gp}`,c.t.c,5,4);
    if(h.type==="crash"&&c)tvBan("ACIDENTE",h.txt,"#FF4D4D",3.4,2);
    if((h.imp||1)>=2&&["crash","spin","contact","pass","lead","finish","start"].includes(h.type))tvClipAdd(h);
    if(c)tvRadioEvent(h,cs)}
  const sc=R.sc?R.sc.type:null;if(sc!==TVX.sc){if(sc==="sc")tvBan("SAFETY CAR","Carro de segurança na pista: proibido ultrapassar","#FFD400",4.2,4);else if(sc==="vsc")tvBan("SAFETY CAR VIRTUAL","Todos reduzem o ritmo: proibido ultrapassar","#FFD400",4,4);
    else if(TVX.sc)tvBan("PISTA LIVRE","Bandeira verde: a corrida recomeça","#21C55D",3.4,3);TVX.sc=sc;if(sc)tvRadioSC()}
  if(!!R.red!==TVX.red){TVX.red=!!R.red;if(R.red)tvBan("BANDEIRA VERMELHA","Corrida interrompida: todos para o pit lane","#FF2020",5,5)}
  if(!TVX.lastLap&&R.started&&R.lead===R.L-1&&R.L>2){TVX.lastLap=true;tvBan("ÚLTIMA VOLTA",`${R.order[0]?R.order[0].d.n:""} lidera`,"#FFFFFF",3.6,3)}
  const wet=R.w>.32;if(wet!==TVX.rain&&R.started){TVX.rain=wet;tvBan(wet?"CHUVA NA PISTA":"PISTA SECANDO",wet?"Pneus intermediários e de chuva entram em jogo":"Os pilotos pensam em voltar para o slick","#3A86FF",3.8,2)}
  if(R.fast&&R.fast.c&&R.fast.t<TVX.fastT-.0005){const first=TVX.fastT>1e8;TVX.fastT=R.fast.t;const c=R.fast.c;if(!first&&c.lap>3)tvBan("VOLTA MAIS RÁPIDA",`${c.code} · ${fmtT(R.fast.t)}`,"#B14CFF",3,1)}
  if(R.started&&!R.over)tvNarrTick()}
// ---------- legenda do narrador e do comentarista (parte de baixo da tela)
function tvSay(who,txt,pri){if(!txt)return;if(TVX.capQ.length>3)TVX.capQ.shift();TVX.capQ.push({who,txt,pri:pri||1});if(typeof ttsSay==="function")ttsSay(who,txt,pri||1)}
function tvNarrTick(){// frases novas do narrador que valem destaque
  const fresh=[];for(const n of R.narr){if(n._tv)break;n._tv=1;fresh.push(n)}fresh.reverse().forEach(n=>{if((n.lvl||0)>=2)tvSay("narr",n.t,n.lvl)});
  if(R.t>=TVX.comNext&&!TVX.cap&&!TVX.capQ.length){TVX.comNext=R.t+rr(28,46);const t=tvComment();if(t){tvSay("com",t,1);narr(`Comentário: ${t}`,0)}}}
function tvCaption(ctx,cw,ch,now){if(!TVX.cap&&TVX.capQ.length){TVX.cap=TVX.capQ.shift();TVX.cap.t0=now;TVX.cap.dur=clamp(2.6+TVX.cap.txt.length*.045,3.2,7)}const c=TVX.cap;if(!c)return;const a=now-c.t0;if(a>c.dur){TVX.cap=null;return}
  const mob=cw<640;const k=Math.min(1,a/.2,(c.dur-a)/.25);ctx.save();ctx.globalAlpha=k;ctx.textAlign="left";ctx.textBaseline="alphabetic";const fs=mob?12.5:15;ctx.font=`600 ${fs}px ${TVF}`;
  const lab=c.who==="com"?"COMENTARISTA":"NARRADOR";const maxW=Math.min(cw-28,mob?cw-28:720);const lines=tvWrap(ctx,c.txt,maxW-24).slice(0,3);const lh=fs*1.3,h=lines.length*lh+30;
  const w=Math.min(maxW,Math.max(...lines.map(l=>ctx.measureText(l).width))+28);const x=(cw-w)/2,y=ch-h-(mob?150:64);
  ctx.fillStyle="rgba(8,10,14,.82)";ctx.fillRect(x,y,w,h);ctx.fillStyle=c.who==="com"?"#3A86FF":"#E10600";ctx.fillRect(x,y,w,3);
  ctx.font=`800 ${mob?10:11}px ${TVF}`;ctx.fillText(lab,x+12,y+15);ctx.fillStyle="#FFFFFF";ctx.font=`600 ${fs}px ${TVF}`;ctx.textAlign="left";lines.forEach((l,i)=>ctx.fillText(l,x+12,y+20+lh*(i+.8)));ctx.restore()}
function tvWrap(ctx,t,w){const out=[];let cur="";for(const word of String(t).split(/\s+/)){const nx=cur?cur+" "+word:word;if(ctx.measureText(nx).width>w&&cur){out.push(cur);cur=word}else cur=nx}if(cur)out.push(cur);return out}
// o comentarista olha os números da corrida e explica o que está acontecendo
function tvComment(){const run=R.order.filter(c=>running(c));if(run.length<3)return null;const L=R.L,lap=R.lead,left=L-lap;const ops=[];
  const A=run[0],B=run[1];const gap=(A.prog-B.prog)*B.L;
  if(gap<1.2)ops.push(`${B.code} está a ${gap.toFixed(1).replace(".",",")} segundo do líder. Se continuar assim, a briga pela vitória vai até o fim.`);
  else if(gap>8&&left>3)ops.push(`${A.code} controla a corrida com ${Math.round(gap)} segundos de vantagem. Agora é cuidar dos pneus e não errar.`);
  const worn=run.slice(0,10).filter(c=>c.tyre.wear>.62&&!c.pitCall);if(worn.length&&left>4){const c=worn[0];ops.push(`Os pneus de ${c.code} já estão ${Math.round(c.tyre.wear*100)}% gastos. A equipe deve chamar para o box nas próximas voltas.`)}
  const fresh=run.slice(0,12).filter(c=>c.tyre.age<4&&c.lap>3);if(fresh.length){const c=fresh[0];ops.push(`${c.code} saiu do box com pneus ${COMP[c.tyre.c].n.toLowerCase()}s novos e deve ser o mais rápido da pista agora.`)}
  const comps={};run.slice(0,10).forEach(c=>comps[c.tyre.c]=(comps[c.tyre.c]||0)+1);const ks=Object.keys(comps);if(ks.length>=2&&lap>2)ops.push(`Estratégias diferentes no top 10: ${ks.map(k=>`${comps[k]} de ${COMP[k].n.toLowerCase()}`).join(", ")}. Isso vai embaralhar as posições.`);
  const me=meCar();if(me&&running(me)&&me.ahead&&running(me.ahead)&&me.dA<60&&!me.pit)ops.push(`${me.code} está colado em ${me.ahead.code}. ${me.batt>me.ahead.batt+10?"Tem mais bateria: a chance de ataque é real.":"Vai precisar de vácuo e de uma boa saída de curva."}`);
  if(R.w>.15&&R.w<.45)ops.push("A pista está naquele ponto difícil: molhada demais para slick em alguns trechos e seca demais para intermediário em outros.");
  if(left===Math.round(L/2))ops.push(`Metade da corrida. ${A.code} lidera, e quem ainda não parou precisa decidir logo.`);
  if(R.C.ovt<.35&&lap>2)ops.push(`Em ${R.C.n} ultrapassar é muito difícil: a posição de pista vale ouro e a estratégia faz a diferença.`);
  return ops.length?pick(ops):null}
// ---------- rádio dos pilotos (personalidade: agressivo reclama, calmo analisa)
function tvTemper(c){const p=c.d.pers||{aggr:50,disc:50};return p.aggr>66?"quente":p.disc>66?"frio":"normal"}
const TV_RAD={
  lost:{quente:["Ele me jogou pra fora! Isso tem que ser investigado!","Não acredito, ele fechou a porta na freada!","Estou perdendo tempo demais aqui, façam alguma coisa!"],frio:["Ele estava mais rápido, não tinha o que fazer.","Ok, perdi a posição. Qual é o ritmo dele?","Entendido. Vou proteger os pneus e esperar."],normal:["Perdi a posição, ele veio com muito vácuo.","Ele passou. Preciso de mais tração na saída.","Droga! Vou tentar de volta na próxima volta."]},
  gain:{quente:["Isso! Vamos pra cima do próximo!","Passei! Me dá o gap do próximo!","Toma essa! Agora é ataque total!"],frio:["Ok, passei. Mantendo o ritmo.","Posição ganha. Pneus ainda bons.","Feito. Qual é a distância para o próximo?"],normal:["Boa! Ganhamos uma posição.","Passei por fora, que manobra!","Ultrapassagem feita. Seguimos."]},
  crash:{quente:["Não acredito! Alguém me acertou?","Acabou. Que corrida jogada fora!","Sem freio, sem nada! O que aconteceu?"],frio:["Desculpem, pessoal. Perdi a traseira.","Estou bem. Erro meu, desculpem.","Acabou para nós. Estou bem."],normal:["Bati! Estou bem, mas o carro acabou.","Perdi o carro na freada. Desculpem.","Fim de corrida. Que pena."]},
  spin:{quente:["Rodei! Esse carro está impossível!","Que pista escorregadia! Voltando!"],frio:["Rodei, tudo bem. Voltando com cuidado.","Pequena rodada, sem danos aparentes."],normal:["Rodei, rodei! Voltando para a pista.","Perdi a traseira, mas voltei."]},
  tyre:{quente:["Esses pneus acabaram! Me chamem para o box!","Não tenho mais aderência nenhuma!"],frio:["Os pneus estão caindo. Quantas voltas faltam para a janela?","Estou perdendo meio segundo por volta com esses pneus."],normal:["Os pneus estão no fim, pessoal.","Muito desgaste atrás. Box logo?"]},
  sc:{quente:["Safety car! Box, box, agora!","Vamos aproveitar! Para dentro!"],frio:["Safety car. Qual é o plano: paramos ou ficamos?","Entendido, safety car. Aguardo instruções."],normal:["Safety car na pista. Vamos parar?","Bandeira amarela geral. Box?"]},
  win:{quente:["VAMOS! QUE CORRIDA! É NOSSA!","SIIIIM! Obrigado, equipe! Vocês são demais!"],frio:["Obrigado, pessoal. Corrida perfeita. Grande trabalho.","Vitória. Estratégia certa, carro excelente. Obrigado."],normal:["Vencemos! Que domingo! Obrigado a todos!","É isso! Vitória! Obrigado, equipe!"]},
  lead:{quente:["Liderando! Agora ninguém me pega!"],frio:["Na liderança. Vou administrar."],normal:["Assumimos a ponta! Vamos manter."]}};
function tvRadio(c,kind,pri){if(!c||c.hum||!c.t)return;if(R.t<TVX.radNext&&(pri||1)<3)return;const set=TV_RAD[kind];if(!set)return;const key=c.id+kind;if((TVX.radSaid[key]||-99)>R.t-60&&(pri||1)<3)return;
  TVX.radSaid[key]=R.t;const txt=pick(set[tvTemper(c)]);TVX.rad={c,txt,t0:performance.now()/1000,dur:4.6};if(UI.sound&&typeof sndRadio==="function")sndRadio(1.2);if(typeof ttsSay==="function")ttsSay("radio",txt,1);TVX.radNext=R.t+rr(16,26);narr(`Rádio de ${c.code}: "${txt}"`,1)}
function tvRadioEvent(h,cs){const c=cs[0];const top=x=>x&&pos(x)<=10;
  if(h.type==="pass"&&cs[1]){if(top(cs[1])&&rnd()<.55)tvRadio(cs[1],"lost");else if(top(c)&&rnd()<.4)tvRadio(c,"gain")}
  else if(h.type==="crash")tvRadio(c,"crash",2);else if(h.type==="spin"&&rnd()<.6)tvRadio(c,"spin");else if(h.type==="lead"&&R.lead>0&&rnd()<.5)tvRadio(c,"lead");else if(h.type==="finish")tvRadio(c,"win",3);
  // pneus no fim: alguém do top 10 reclama de vez em quando
  if(rnd()<.25){const w=R.order.slice(0,10).find(x=>running(x)&&!x.hum&&x.tyre.wear>.7&&!x.pitCall);if(w)tvRadio(w,"tyre")}}
function tvRadioSC(){const c=R.order.slice(0,8).find(x=>running(x)&&!x.hum&&!x.pit);if(c)tvRadio(c,"sc",2)}
function tvRadioCard(ctx,cw,ch,now){const r=TVX.rad;if(!r)return;const a=now-r.t0;if(a>r.dur){TVX.rad=null;return}const mob=cw<640;const k=Math.min(1,a/.25,(r.dur-a)/.3);
  ctx.save();ctx.globalAlpha=k;const fs=mob?12:14;ctx.font=`600 italic ${fs}px ${TVF}`;const lines=tvWrap(ctx,`“${r.txt}”`,mob?cw*.62:300).slice(0,3);const w=Math.max(170,Math.max(...lines.map(l=>ctx.measureText(l).width))+26),h=40+lines.length*fs*1.3;
  const x=10-(1-k)*40,y=mob?ch*.42:ch*.36;ctx.fillStyle="rgba(8,10,14,.9)";ctx.fillRect(x,y,w,h);ctx.fillStyle=r.c.t.c;ctx.fillRect(x,y,5,h);
  ctx.fillStyle="#FFD400";ctx.font=`800 ${mob?10:11}px ${TVF}`;ctx.textAlign="left";ctx.fillText("RÁDIO DA EQUIPE",x+14,y+15);ctx.fillStyle="#FFFFFF";ctx.font=`900 ${mob?13:15}px ${TVF}`;ctx.fillText(`${r.c.code} · P${pos(r.c)}`,x+14,y+32);
  // ondinha de áudio
  ctx.fillStyle=r.c.t.c;for(let i=0;i<9;i++){const bh=3+Math.abs(Math.sin(now*11+i*1.7))*9;ctx.fillRect(x+w-70+i*6,y+20-bh/2,3,bh)}
  ctx.fillStyle="#E6E9EF";ctx.font=`600 italic ${fs}px ${TVF}`;lines.forEach((l,i)=>ctx.fillText(l,x+14,y+48+i*fs*1.3));ctx.restore()}
// ---------- faixa com o nome do piloto (embaixo, à esquerda): aparece por alguns segundos depois de cada corte
function tvLower(lw,foc){const lab=UI.cam==="director"?DIR.label:UI.cam==="auto"&&typeof SMART!=="undefined"?SMART.label:"";let html="",key="";
  if(lab){key="L"+lab;html=`<span class="lt-ev">${esc(lab)}</span>`}
  else if(tvOn()&&foc&&foc.t&&R.started&&R.t-TVX.lastCut<5.5&&running(foc)){const p=pos(foc);const A=R.order[p-2];const g=A?(A.prog-foc.prog)*foc.L:0;
    key=`D${foc.id}${p}${Math.round(g*10)}`;html=`<i style="background:${foc.t.c}"></i><b class="lt-p">P${p}</b><span class="lt-n">${esc(foc.d.n)}</span><span class="lt-t">${esc(foc.t.n)}${A?` · ${g.toFixed(1).replace(".",",")} s atrás de ${esc(A.code)}`:" · lidera a corrida"}</span>`}
  if(key===TVX.lowKey)return;TVX.lowKey=key;lw.hidden=!html;lw.classList.toggle("lt",!!html&&!lab);if(html)lw.innerHTML=html}
// ---------- melhores momentos: guarda os lances (posições de todos os carros) para o resumo no fim
function tvClipAdd(h){if(TVX.clipQ.some(q=>Math.abs(q.t-h.t)<3)){const q=TVX.clipQ.find(q=>Math.abs(q.t-h.t)<3);q.cars=[...new Set(q.cars.concat(h.cars))];q.imp=Math.max(q.imp,h.imp||1);return}
  TVX.clipQ.push({t:h.t,txt:h.txt,type:h.type,cars:h.cars.slice(),imp:h.imp||1,lap:h.lap||1})}
function tvClipTick(){if(!R.rb||!TVX.clipQ.length)return;const out=[];for(const q of TVX.clipQ){if(R.t<q.t+3&&!R.over){out.push(q);continue}
    const fr0=R.rb.filter(x=>x.t>=q.t-4.5&&x.t<=q.t+3);if(fr0.length<12)continue;const clip={...q,frames:fr0.map(f=>({t:f.t,cars:f.cars.map(c=>({id:c.id,x:c.x,y:c.y,h:c.h,vis:1})),sc:f.sc}))};
    R.clips.push(clip);if(R.clips.length>12){let lo=0;for(let i=1;i<R.clips.length;i++)if(R.clips[i].imp<R.clips[lo].imp)lo=i;R.clips.splice(lo,1)}}TVX.clipQ=out}
const HLP={on:false,i:0,t:0,raf:0,last:0};
function hlCard(){if(!R||!R.clips||!R.clips.length)return"";return`<div class="card" style="grid-column:1/-1"><h3>Melhores momentos <small class="muted">${R.clips.length} lance${R.clips.length>1?"s":""}</small></h3>
  <div class="hlbox"><canvas id="hlcv" width="960" height="420" aria-label="replay dos melhores momentos"></canvas><div class="hlcap" id="hlcap">${esc(R.clips[0].txt)}</div><button class="btn go hlplay" data-act="tvHl" id="hlb">▶ Assistir</button></div></div>`}
function tvAction(a){if(a==="tvTts"){PREFS.tts=!PREFS.tts;prefsSave();const b=document.querySelector("[data-act=tvTts]");if(b){b.classList.toggle("on",PREFS.tts);b.innerHTML=`<b>${PREFS.tts?"✓ ":""}Narração falada (voz do navegador)</b>`}if(PREFS.tts){if(!UI.sound)UI.sound=sndToggle(true);ttsSay("narr","Narração ligada.",3)}return}if(a==="tvT"){PREFS.tv=!PREFS.tv;prefsSave();const b=$("#tvb");if(b)b.classList.toggle("on",PREFS.tv);return}if(a==="tvHl"){if(HLP.on){HLP.on=false;const b=$("#hlb");if(b){b.textContent="▶ Assistir";b.hidden=false}return}HLP.on=true;HLP.i=0;HLP.t=R.clips[0].frames[0].t;HLP.last=performance.now();const b=$("#hlb");if(b)b.textContent="⏸ Parar";cancelAnimationFrame(HLP.raf);HLP.raf=requestAnimationFrame(hlLoop)}}
function hlLoop(n){const cv=$("#hlcv");if(!cv||!HLP.on){HLP.on=false;return}const dt=Math.min(.1,(n-HLP.last)/1000);HLP.last=n;const clip=R.clips[HLP.i];
  const r=cv.getBoundingClientRect();const dpr=(typeof qDpr==="function"?qDpr():Math.min(2,window.devicePixelRatio||1));const W=Math.max(200,Math.round(r.width)),H=Math.round(W*.44);if(cv.width!==W*dpr){cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+"px"}
  const ctx=cv.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);const near=Math.abs(HLP.t-clip.t)<1;HLP.t+=dt*(near?.5:1);
  const t1=clip.frames[clip.frames.length-1].t;if(HLP.t>=t1){HLP.i++;if(HLP.i>=R.clips.length){HLP.on=false;const b=$("#hlb");if(b)b.textContent="↺ Ver de novo";return}HLP.t=R.clips[HLP.i].frames[0].t;CAM.cut=1;const cp=$("#hlcap");if(cp)cp.textContent=`Volta ${R.clips[HLP.i].lap} · ${R.clips[HLP.i].txt}`}
  const S=frameAt({frames:clip.frames},HLP.t);const inv=S.cars.filter(c=>clip.cars.includes(c.id));const m=inv.length?{x:inv.reduce((s,c)=>s+c.x,0)/inv.length,y:inv.reduce((s,c)=>s+c.y,0)/inv.length}:S.cars[0];
  if(m){const[tx,ty]=iso(m.x,m.y);camTo(dt,tx,ty,Math.min(W,H*1.3)/(WS*58),.2,.6);CAM.sx=0;CAM.sy=0;const sv=CAM.flash;try{drawScene(ctx,W,H,{S,T:HLP.t,pip:true})}catch(e){}CAM.flash=sv}
  ctx.fillStyle="#0E1116E6";ctx.fillRect(10,10,near?132:96,24);ctx.fillStyle="#FF3B3B";ctx.beginPath();ctx.arc(24,22,5,0,7);ctx.fill();ctx.fillStyle="#FFF";ctx.font=`700 12px ${TVF}`;ctx.textAlign="left";ctx.fillText(near?"REPLAY · LENTO":"REPLAY",34,27);
  HLP.raf=requestAnimationFrame(hlLoop)}
// ---------- câmera aérea (helicóptero): visão alta e larga que acompanha o carro
function shotHeli(dt,cw,ch,c){const p=c._w||carWorld(c);const z=Math.min(cw,ch*1.3)/(WS*viewMeters(cw)*3.1)*CAM.userZ;const[tx,ty]=iso(p.x,p.y);camTo(dt,tx,ty,z,.5,1.6)}
