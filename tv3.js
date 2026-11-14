// ===================== TRANSMISSÃO 3: GRÁFICOS DE TV NOVOS E A CLASSIFICAÇÃO NA TV =====================
// 1) cronômetro da volta rápida na classificação (setores roxo/verde/amarelo e diferença para a pole, posição ao fechar)
// 2) zona de eliminação, tempo a bater e briga pela pole
// 3) batalha: dois pilotos, intervalo e tendência por volta ("alcança em ~3 voltas")
// 5) comissários na tela: incidente sob investigação → decisão
// 6) campeonato ao vivo ("se terminar assim")
// + comentarista e rádio dos pilotos com falas próprias da classificação, e mais variedade de comentários na corrida.
// Os painéis usam a mesma fila das faixas do topo (um de cada vez, por prioridade). Só apresentação: sorteios visuais.

const TV3_PURPLE="#A43BFF",TV3_GREEN="#1FCB6B",TV3_YELLOW="#F2C200",TV3_FIA="#FFC906";
function tv3(){if(!R)return{};if(R._tv3)return R._tv3;return R._tv3={batNext:60,champN:0,hist:{},inv:{},zoneNext:0,beatSaid:{},poleSaid:{},qlast:null,sessSeen:0}}
function tv3Panel(ctx,x,y,w,h,col){ctx.fillStyle="rgba(10,12,16,.93)";ctx.fillRect(x,y,w,h);ctx.fillStyle=col||"#E10600";ctx.fillRect(x,y,6,h)}
function tv3Fmt(d,dig){return(d<0?"−":"+")+Math.abs(d).toFixed(dig??3).replace(".",",")}

// espaço livre no topo, entre a torre (esquerda) e o painel do piloto (direita), medido na tela a cada meio segundo
function tv3Slot(cw,want,minW){const now=performance.now();const S=tv3Slot;if(!S.c||now-S.t>500||S.cw!==cw){S.t=now;S.cw=cw;let L=10,Rr=cw-10,bot=0;try{const cv=document.getElementById("rc");const cr=cv&&cv.getBoundingClientRect();
    const box=id=>{const e=document.getElementById(id);if(!e||!e.offsetParent)return null;const r=e.getBoundingClientRect();return r.width?{l:r.left-cr.left,r:r.right-cr.left,t:r.top-cr.top,b:r.bottom-cr.top}:null};
    const tw=box("hTower"),sc=box("hSec");if(tw&&tw.t<140){L=Math.max(L,tw.r+10);bot=Math.max(bot,tw.b)}if(sc&&sc.t<140){Rr=Math.min(Rr,sc.l-10);bot=Math.max(bot,sc.b)}}catch(e){}S.c={L,R:Rr,bot}}
  const c=S.c,free=c.R-c.L,mob=cw<640;const W=Math.min(want,free);if(W>=(minW||Math.min(want,360))&&!mob)return{x:c.L+(free-W)/2,W,y:84};
  const W2=Math.min(want,cw-20);return{x:(cw-W2)/2,W:W2,y:mob?168:Math.max(84,c.bot+8)}}
// ---------- fila de faixas: aceita painéis com desenho próprio (b.draw) e guarda onde a faixa termina
(function(){const base=tvBanner;globalThis.tvBanner=function(ctx,cw,ch,now){const mob=cw<640;
  if(!TVX.ban&&TVX.banQ.length&&!(mob&&typeof BCX!=="undefined"&&BCX.tw)){TVX.banQ.sort((a,b)=>b.pri-a.pri);TVX.ban=TVX.banQ.shift();TVX.ban.t0=now}
  const b=TVX.ban;TVX.banBottom=0;if(!b)return;
  if(b.draw){const a=now-b.t0;if(a>b.dur){TVX.ban=null;return}const k=Math.min(1,a/.28,(b.dur-a)/.25);const ease=1-Math.pow(1-Math.max(0,k),3);ctx.save();ctx.globalAlpha=ease;try{TVX.banBottom=b.draw(ctx,cw,ch,ease,mob)||0}catch(e){TVX.ban=null}ctx.restore();return}
  base(ctx,cw,ch,now);if(TVX.ban)TVX.banBottom=(mob?168:84)+(b.sub?(mob?46:58):(mob?34:42))}})();
function tv3Push(o){if(typeof tvBan!=="function")return;const b={txt:o.txt||"",sub:"",col:o.col||"#E10600",dur:o.dur||6,pri:o.pri||1,draw:o.draw};if(TVX.ban&&TVX.ban.pri<b.pri)TVX.ban=null;if(TVX.banQ.length<5)TVX.banQ.push(b)}

// ======================= 1) CRONÔMETRO DA VOLTA (classificação) =======================
function tv3QTarget(){const Q=R.qMode;if(!Q)return null;const f=UI.foc;if(f&&f.q&&f.q.st==="push"&&running(f)&&!f.pit)return f;const me=R.cars.find(c=>c.isP);if(me&&me.q&&me.q.st==="push"&&running(me)&&!me.pit)return me;return null}
function tv3SecCol(c,k,s){const b=R.secBest&&R.secBest[k];if(b&&b.id===c.id&&Math.abs(b.t-s)<1e-6)return TV3_PURPLE;if(b&&s<b.t)return TV3_PURPLE;if(c.secPB&&c.secPB[k]!=null&&s<=c.secPB[k]+1e-6)return TV3_GREEN;return TV3_YELLOW}
function tv3LapTimer(ctx,cw,ch,now){const Q=R.qMode;if(!Q)return;const S=tv3();const mob=cw<640;let c=tv3QTarget(),fin=null;
  if(S.qlast&&R.t-S.qlast.t<4.5&&(!c||c===S.qlast.c)){fin=S.qlast;c=fin.c}if(!c)return;
  const ref=typeof qRefSplits==="function"?qRefSplits():null;const el=fin?fin.lt:R.t-c.lapStart;const q=c._qsec||[];
  const secs=fin?fin.secs:[q[0],q[1]!=null&&q[0]!=null?q[1]-q[0]:null,null];const cums=fin?[fin.secs[0],fin.secs[0]+fin.secs[1],fin.lt]:[q[0],q[1],null];
  const sl=tv3Slot(cw,560,440);const W=sl.W,H=mob?58:62,x=sl.x,y=Math.max(sl.y,(TVX.banBottom||0)+8);ctx.save();tv3Panel(ctx,x,y,W,H,c.t.c);
  const pos=typeof qPosOf==="function"?qPosOf(c):0;ctx.textBaseline="alphabetic";ctx.textAlign="left";
  ctx.fillStyle="#FFFFFF";ctx.font=`900 ${mob?16:20}px ${TVF}`;ctx.fillText(c.code,x+16,y+(mob?24:28));ctx.fillStyle="#9AA3B2";ctx.font=`700 ${mob?10:11}px ${TVF}`;ctx.fillText(fin?(fin.del?"VOLTA APAGADA":"VOLTA COMPLETA"):`Q${Q.sess} · VOLTA RÁPIDA`,x+16,y+H-10);
  // setores
  const bx=x+(mob?84:92),bw=(W-(mob?84:92)-(mob?118:150))/3-4,bh=mob?22:26;for(let k=0;k<3;k++){const s=secs[k],cx=bx+k*(bw+4);let col="#2A2F38",txt=`S${k+1}`;
    if(s!=null&&s>0){col=tv3SecCol(c,k,s);txt=ref&&cums[k]!=null?tv3Fmt(cums[k]-ref[k]):s.toFixed(3).replace(".",",")}
    ctx.fillStyle=col;ctx.fillRect(cx,y+8,bw,bh);ctx.fillStyle=col==="#2A2F38"?"#7D8696":col===TV3_YELLOW?"#111":"#FFFFFF";ctx.font=`800 ${mob?10.5:12}px ${TVF}`;ctx.textAlign="center";ctx.fillText(txt,cx+bw/2,y+8+bh*.68)}
  // tempo correndo e situação
  ctx.textAlign="right";const rx=x+W-12;ctx.fillStyle=fin&&fin.del?"#FF5A5F":"#FFFFFF";ctx.font=`900 ${mob?17:22}px ${TVF}`;ctx.fillText(fmtT(Math.max(0,el)),rx,y+(mob?24:30));
  ctx.font=`800 ${mob?11:13}px ${TVF}`;if(fin){ctx.fillStyle=fin.del?"#FF5A5F":fin.p===1?TV3_PURPLE:"#C9CED8";ctx.fillText(fin.del?"não vale":fin.p?`P${fin.p}${fin.gap!=null&&fin.p>1?"  "+tv3Fmt(fin.gap):""}`:"sem melhora",rx,y+H-10)}
  else{const k=cums[1]!=null?1:cums[0]!=null?0:-1;if(ref&&k>=0){const d=cums[k]-ref[k];ctx.fillStyle=d<=0?TV3_GREEN:"#FF8A3D";ctx.fillText(`${tv3Fmt(d)} para a pole`,rx,y+H-10)}else{ctx.fillStyle="#C9CED8";ctx.fillText(pos?`melhor: P${pos}`:"sem tempo",rx,y+H-10)}}
  // linha de corte: quanto precisa
  const cut=QKEEP[Q.sess];if(cut&&!fin&&Q.phase==="run"&&!mob){const o=qOrder();const tc=o[cut-1]&&qTime(o[cut-1]);if(tc!=null){ctx.fillStyle="#9AA3B2";ctx.font=`700 11px ${TVF}`;ctx.textAlign="center";ctx.fillText(`corte (P${cut}): ${fmtT(tc)}`,bx+(bw*3+8)/2,y+H-10)}}
  ctx.restore()}
// volta concluída (chamado pelo radio.js): mostra o resultado no cronômetro e alimenta narração e rádio da TV
function tvQLap(c,lt,del,prev){const S=tv3();const Q=R.qMode;const s=c._qsLast;const secs=s&&s.length===2?[s[0],s[1]-s[0],lt-s[1]]:[null,null,null];
  let p=0,gap=null;if(!del&&(prev==null||lt<prev)){const o=qOrder();p=o.indexOf(c)+1;const t0=qTime(o[0]);gap=t0!=null?lt-t0:null}
  if(c===tv3QTarget()||c===UI.foc||c.isP)S.qlast={c,lt,del,p,gap,secs,t:R.t};
  // narração e rádio da TV
  if(c.isP||!c.t)return;const o=qOrder();const cut=QKEEP[Q.sess];
  if(del){if(vrnd()<.55)tvQRadio(c,"q_del");return}
  if(p===1&&o.filter(x=>qTime(x)!=null).length>2){narr(vpick([`${c.code} vai para o topo: ${fmtT(lt)}!`,`Novo melhor tempo do Q${Q.sess}: ${c.code}, ${fmtT(lt)}.`,`${c.code} crava ${fmtT(lt)} e assume a ponta!`,`Ponta para ${c.code}! ${fmtT(lt)}.`,`${c.code} melhora tudo e lidera com ${fmtT(lt)}.`]),2);if(vrnd()<.5)tvQRadio(c,"q_top")}
  else if(p&&p<=3&&vrnd()<.6)narr(vpick([`${c.code} sobe para P${p}.`,`${c.code} melhora: P${p}, a ${tv3Fmt(gap)} da ponta.`,`Volta forte de ${c.code}: P${p}.`,`${c.code} entra no top 3 com ${fmtT(lt)}.`]),2);
  else if(cut&&p&&p<=cut&&prev!=null&&o.indexOf(c)>=0&&qTime(c)<prev&&(()=>{const before=o.filter(x=>x!==c&&qTime(x)!=null&&qTime(x)<prev).length+1;return before>cut})())narr(vpick([`${c.code} se salva! Sai da zona de eliminação para P${p}.`,`Que volta de ${c.code}: escapa da eliminação, P${p}.`,`${c.code} reage na hora certa e sobe para P${p}.`]),2);
  else if(p===0&&prev!=null&&vrnd()<.25)tvQRadio(c,"q_meh")}
// rádio dos pilotos da IA na classificação
const TV_RAD_Q={
 q_top:{quente:["Isso! Que volta! Ninguém chega perto!","Voei! Vocês viram esse setor 3?","P1! Agora deixa eles tentarem!","Essa é a volta! Sem medo nenhum!"],normal:["Boa volta! O carro estava perfeito.","Gostei! Senti tudo no lugar.","Volta limpa, finalmente!","Isso, pessoal! Era isso que a gente queria."],frio:["Volta boa. Ainda tem um pouco no setor 2.","Ok. Execução limpa. Próximo passo?","Bom. Pneus responderam bem.","Volta sólida. Vamos guardar um jogo."]},
 q_del:{quente:["Apagaram minha volta? Por um centímetro!","Isso é ridículo, eu estava dentro!","Não acredito! Era a melhor volta da minha vida!"],normal:["Volta apagada... fui largo na saída.","Que pena, passei do limite.","Perdi a volta. Erro meu."],frio:["Ok. Limite de pista. Vou ajustar a linha.","Volta deletada. Temos tempo para outra?","Entendido. Margem maior na próxima."]},
 q_meh:{quente:["Errei tudo no último setor!","Carro escorregando demais, que raiva!","Tráfego de novo! Quem programa essas saídas?"],normal:["Não melhorei. Muito vento no setor 1.","Volta ruim, errei a freada.","Fiquei preso atrás de um carro lento."],frio:["Sem melhora. Pneus traseiros frios.","Volta abaixo. Perdi tempo na chicane.","Não encaixou. Vamos de novo."]},
 q_elim:{quente:["Fora no Q{X}? Isso é inaceitável!","Que vergonha! Esse carro não anda!","Não dá! Não tinha mais nada pra tirar!"],normal:["Eliminado... faltou muito pouco.","Ficamos fora. Amanhã a gente recupera.","Que pena. O tráfego me atrapalhou na volta final."],frio:["Eliminados. Vamos focar no ritmo de corrida.","Não foi suficiente. Precisamos entender o carro.","Ok. Estratégia diferente para amanhã."]},
 q_pole:{quente:["POLE! POLE! QUE VOLTA!","É NOSSA! QUE CARRO, GALERA!","POLE POSITION, PORRA!"],normal:["Pole! Que volta, pessoal! Obrigado!","Pole position! Vocês fizeram um carro incrível!","Isso! Pole! Amanhã é outra história, mas que volta!"],frio:["Pole. Volta muito limpa. Grande trabalho.","Pole. Agora foco na largada.","Obrigado a todos. Volta sem erros."]},
 q_front:{quente:["Faltou pouco pra pole! Amanhã eu pego!","Primeira fila, mas eu queria mais!"],normal:["Primeira fila! Boa posição para amanhã.","Fiquei perto. Bom trabalho da equipe."],frio:["P2. Boa base para a corrida.","Primeira fila. Estratégia definida?"]}};
function tvQRadio(c,kind,pri,vars){if(!c||c.hum||!c.t||!TV_RAD_Q[kind])return;if(R.t<TVX.radNext&&(pri||1)<3)return;const key=c.id+kind;if((TVX.radSaid[key]||-99)>R.t-50&&(pri||1)<3)return;TVX.radSaid[key]=R.t;
  const pool=TV_RAD_Q[kind][tvTemper(c)]||TV_RAD_Q[kind].normal;const S=tv3();S.usedQ=S.usedQ||{};const fresh=pool.filter(x=>!S.usedQ[x]);const s=vpick(fresh.length?fresh:pool);S.usedQ[s]=1;
  const txt=s.replace(/\{(\w)\}/g,(m,k)=>vars&&vars[k]!=null?vars[k]:m);if(typeof tvRadioSay==="function")tvRadioSay(c,txt)}
(function(){if(typeof qEndSession!=="function")return;const base=qEndSession;globalThis.qEndSession=function(){const Q=R.qMode,n=Q.sess;const pool0=Q.pool.slice();base();try{const keep=QKEEP[n];
  const out=pool0.filter(id=>!Q.pool.includes(id)).map(id=>R.cars.find(c=>c.d.id===id)).filter(c=>c&&!c.isP);const big=out.sort((a,b)=>(b.t.tier||0)-(a.t.tier||0))[0];
  if(keep&&big&&(big.t.tier||0)>=85)setTimeout(()=>{if(R&&R.qMode)tvQRadio(big,"q_elim",3,{X:n})},5000);
  if(!keep){const key="q3";const tm=c=>{const r=Q.res[c.d.id];return r&&r[key]!=null?r[key]:999};const cars=pool0.map(id=>R.cars.find(c=>c.d.id===id)).filter(Boolean).sort((a,b)=>tm(a)-tm(b));
    const pole=cars[0];if(pole&&!pole.isP){tvBan("POLE POSITION",`${pole.d.n} · ${pole.t.n} · ${fmtT(tm(pole))}`,pole.t.c,7,3);setTimeout(()=>{if(R&&R.qMode)tvQRadio(pole,"q_pole",3)},2500)}
    else if(pole&&pole.isP)tvBan("POLE POSITION",`${pole.d.n} · ${pole.t.n} · ${fmtT(tm(pole))}`,pole.t.c,7,3);if(cars[1]&&!cars[1].isP)setTimeout(()=>{if(R&&R.qMode)tvQRadio(cars[1],"q_front",2)},9000)}}catch(e){}}})();

// ======================= 2) ZONA DE ELIMINAÇÃO, TEMPO A BATER, BRIGA PELA POLE =======================
function tv3ZoneRows(){const Q=R.qMode;const n=Q.sess,cut=QKEEP[n];const o=qOrder().filter(c=>Q.pool.includes(c.d.id));let rows,title,foot=null,line=-1;
  if(cut){const a=Math.max(0,cut-4),b=Math.min(o.length,cut+2);rows=o.slice(a,b).map((c,i)=>({c,p:a+i+1}));line=cut-a;title=`ZONA DE ELIMINAÇÃO · Q${n}`;const tc=qTime(o[cut-1]);if(tc!=null)foot=`Tempo a bater: ${fmtT(tc)} (P${cut} · ${o[cut-1].code})`}
  else{rows=o.slice(0,4).map((c,i)=>({c,p:i+1}));title="BRIGA PELA POLE";const t0=qTime(o[0]);if(t0!=null)foot=`Pole provisória: ${o[0].code} · ${fmtT(t0)}`}
  return{rows,title,foot,line,cut,ref:cut?qTime(o[cut-1]):qTime(o[0]),n:o.filter(c=>qTime(c)!=null).length}}
function tv3Zone(){const Q=R.qMode;const z0=tv3ZoneRows();if(z0.n<4)return;const cut=z0.cut;
  tv3Push({pri:2,dur:7.5,col:cut?"#E10600":TV3_PURPLE,draw:(ctx,cw,ch,e,mob)=>{const{rows,title,foot,line,ref}=tv3ZoneRows();/* recalculado a cada quadro: a tabela muda enquanto o painel está na tela */
    const rh=mob?19:22,sl=tv3Slot(cw,mob?330:380,320),W=sl.W,H=34+rows.length*rh+(foot?24:6)+(line>=0?2:0),x=sl.x,y=sl.y-(1-e)*24;tv3Panel(ctx,x,y,W,H,cut?"#E10600":TV3_PURPLE);
    ctx.textAlign="left";ctx.fillStyle="#FFFFFF";ctx.font=`900 italic ${mob?14:17}px ${TVF}`;ctx.fillText(title,x+18,y+22);ctx.fillStyle="#9AA3B2";ctx.font=`700 ${mob?10:11}px ${TVF}`;ctx.textAlign="right";ctx.fillText(qClock(Q.clock),x+W-12,y+21);
    let yy=y+32;rows.forEach((r,i)=>{if(i===line){ctx.fillStyle="#E10600";ctx.fillRect(x+12,yy,W-24,2);yy+=2}const out=line>=0&&i>=line;const t=qTime(r.c);
      if(r.c.isP){ctx.fillStyle="rgba(255,212,0,.13)";ctx.fillRect(x+8,yy,W-16,rh)}ctx.textAlign="left";ctx.fillStyle=out?"#FF6B6B":"#C9CED8";ctx.font=`800 ${mob?11:13}px ${TVF}`;ctx.fillText(String(r.p),x+18,yy+rh*.72);
      ctx.fillStyle=r.c.t.c;ctx.fillRect(x+44,yy+4,4,rh-8);ctx.fillStyle="#FFFFFF";ctx.font=`900 ${mob?12:14}px ${TVF}`;ctx.fillText(r.c.code,x+54,yy+rh*.72);
      const st=r.c.q&&r.c.q.st==="push";if(st){ctx.fillStyle=TV3_GREEN;ctx.font=`800 ${mob?9.5:10.5}px ${TVF}`;ctx.fillText("NA VOLTA",x+(mob?96:104),yy+rh*.7)}
      ctx.textAlign="right";ctx.font=`800 ${mob?11:13}px ${TVF}`;ctx.fillStyle=out?"#FF6B6B":"#FFFFFF";ctx.fillText(t==null?"sem tempo":(ref!=null&&r.p!==(cut||1)?tv3Fmt(t-ref):fmtT(t)),x+W-12,yy+rh*.72);yy+=rh});
    if(foot){ctx.textAlign="left";ctx.fillStyle=cut?"#FFB4B4":"#D9B8FF";ctx.font=`800 ${mob?10.5:12}px ${TVF}`;ctx.fillText(foot,x+18,yy+16)}return y+H}})}
function tv3QTick(){const Q=R.qMode,S=tv3();if(Q.phase!=="run"||Q.red)return;
  if(S.sessSeen!==Q.sess){S.sessSeen=Q.sess;S.zoneNext=R.t+60;R.secBest=[null,null,null]/* setor roxo = mais rápido da sessão */}
  const cut=QKEEP[Q.sess];const late=Q.clock<(cut?250:200);
  const busy=tv3QTarget()||(S.qlast&&R.t-S.qlast.t<5);/* o cronômetro da volta tem prioridade no topo */
  if(late&&R.t>S.zoneNext&&!TVX.ban&&!TVX.banQ.length&&!busy){S.zoneNext=R.t+vrr(38,55);tv3Zone()}
  else if(!late&&R.t>S.zoneNext&&!TVX.ban&&!TVX.banQ.length&&!busy&&Q.clock<QDUR[Q.sess]-240){S.zoneNext=R.t+vrr(80,120);tv3Zone()}
  if(cut&&Q.clock<95&&!S.beatSaid[Q.sess]){S.beatSaid[Q.sess]=1;const o=qOrder();const c=o[cut-1];const t=c&&qTime(c);if(t!=null)tvBan("TEMPO A BATER",`P${cut} · ${c.code} · ${fmtT(t)} · ${o.filter((x,i)=>i>=cut&&Q.pool.includes(x.d.id)).length} carros fora`,"#E10600",5.5,2)}}

// ======================= 3) BATALHA (corrida) =======================
function tv3BattleTick(){const S=tv3();if(R.sc||R.red||!R.started||(R.lead||0)<1)return;const run=R.order.filter(c=>running(c)&&!c.pit);
  // amostra o intervalo entre vizinhos a cada 5 s (para a tendência)
  if(R.t>(S.sampT||0)){S.sampT=R.t+5;for(let i=1;i<Math.min(run.length,14);i++){const A=run[i-1],B=run[i];const key=A.id+">"+B.id;const g=(A.prog-B.prog)*(B.L||90);const h=S.hist[key]||(S.hist[key]=[]);h.push({t:R.t,g});if(h.length>40)h.shift()}}
  if(R.t<S.batNext||TVX.ban||TVX.banQ.length)return;const me=R.cars.find(c=>c.isP);let best=null;
  for(let i=1;i<Math.min(run.length,14);i++){const A=run[i-1],B=run[i];const h=S.hist[A.id+">"+B.id];if(!h||h.length<5)continue;const g=h[h.length-1].g;if(g>1.3||g<0)continue;const dur=R.t-h[0].t;if(dur<20)continue;
    const sc=(A.isP||B.isP?100:0)+(14-i)*3+(g<.6?10:0)+(A.t===B.t?8:0);if(!best||sc>best.sc)best={A,B,p:i,sc,h,g}}
  if(!best){S.batNext=R.t+20;return}S.batNext=R.t+vrr(70,95);const{A,B,p,h,g}=best;const n=h.length;const k=Math.min(n-1,8);const dt=h[n-1].t-h[n-1-k].t;const lapT=B.L||90;const slope=dt>0?(h[n-1].g-h[n-1-k].g)/dt*lapT:0;
  const trend=Math.abs(slope)<.04?"intervalo estável":slope<0?`${B.code} tira ${Math.abs(slope).toFixed(2).replace(".",",")} s por volta`:`${A.code} abre ${slope.toFixed(2).replace(".",",")} s por volta`;
  const catchL=slope<-.04&&g>.3?Math.ceil((g-.25)/-slope):null;const bat=`bateria ${Math.round(A.batt)}% × ${Math.round(B.batt)}%`;const tyr=`pneus ${A.tyre.age}v × ${B.tyre.age}v`;
  tv3Push({pri:1,dur:6.5,col:"#FFFFFF",draw:(ctx,cw,ch,e,mob)=>{const sl=tv3Slot(cw,520,460),W=sl.W,H=mob?84:92,x=sl.x,y=sl.y-(1-e)*24;ctx.fillStyle="rgba(10,12,16,.93)";ctx.fillRect(x,y,W,H);
    ctx.textAlign="center";ctx.fillStyle="#FFD400";ctx.font=`900 italic ${mob?12:14}px ${TVF}`;ctx.fillText(`BATALHA PELA P${p}${A.t===B.t?" · DUELO NA EQUIPE":""}`,x+W/2,y+18);
    const box=(c,px,al,pp)=>{const bw=Math.min(190,W*.34);const bx=al==="l"?px:px-bw;ctx.fillStyle=c.t.c;ctx.fillRect(bx,y+26,bw,mob?34:38);ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(bx,y+26,mob?26:30,mob?34:38);
      ctx.fillStyle="#FFFFFF";ctx.textAlign="center";ctx.font=`900 ${mob?13:15}px ${TVF}`;ctx.fillText(String(pp),bx+(mob?13:15),y+26+(mob?22:25));ctx.textAlign="left";ctx.font=`900 ${mob?15:18}px ${TVF}`;ctx.fillText(c.code,bx+(mob?32:38),y+26+(mob?22:26));
      ctx.font=`700 ${mob?9:10.5}px ${TVF}`;ctx.fillStyle="rgba(255,255,255,.85)";ctx.textAlign="right";ctx.fillText(c.t.n,bx+bw-8,y+26+(mob?22:26))};
    box(A,x+12,"l",p);box(B,x+W-12,"r",p+1);ctx.textAlign="center";ctx.fillStyle="#FFFFFF";ctx.font=`900 ${mob?17:22}px ${TVF}`;ctx.fillText(`${g.toFixed(1).replace(".",",")} s`,x+W/2,y+26+(mob?24:27));
    ctx.font=`700 ${mob?10:12}px ${TVF}`;ctx.fillStyle=slope<-.04?TV3_GREEN:slope>.04?"#FF8A3D":"#C9CED8";ctx.fillText(trend+(catchL?` · alcança em ~${catchL} volta${catchL>1?"s":""}`:""),x+W/2,y+H-(mob?12:14));
    if(!mob){ctx.fillStyle="#9AA3B2";ctx.font=`700 10.5px ${TVF}`;ctx.textAlign="left";ctx.fillText(bat,x+14,y+H-14);ctx.textAlign="right";ctx.fillText(tyr,x+W-14,y+H-14)}return y+H}})}

// ======================= 5) COMISSÁRIOS NA TELA =======================
const TV3_KIND={contact:"toque",forced:"forçar para fora",adv:"vantagem ao sair da pista",yellow:"bandeira amarela",blue:"bandeira azul",unsafe:"liberação insegura"};
function tv3Stew(title,lines,pri,dur){tv3Push({pri,dur,col:TV3_FIA,draw:(ctx,cw,ch,e,mob)=>{const sl=tv3Slot(cw,500,400),W=sl.W,lh=mob?15:17,H=40+lines.length*lh+6,x=sl.x,y=sl.y-(1-e)*24;
  ctx.fillStyle="rgba(8,18,44,.95)";ctx.fillRect(x,y,W,H);ctx.fillStyle=TV3_FIA;ctx.fillRect(x,y,6,H);ctx.fillRect(x,y+H-3,W*e,3);
  ctx.textAlign="left";ctx.fillStyle=TV3_FIA;ctx.font=`800 ${mob?9.5:10.5}px ${TVF}`;ctx.fillText("FIA · COMISSÁRIOS DESPORTIVOS",x+18,y+15);ctx.fillStyle="#FFFFFF";ctx.font=`900 italic ${mob?14:17}px ${TVF}`;ctx.fillText(title,x+18,y+34);
  ctx.font=`700 ${mob?11:12.5}px ${TVF}`;ctx.fillStyle="#D5DBE7";lines.forEach((l,i)=>{ctx.fillText(typeof bcFit==="function"?bcFit(ctx,l,ctx.font,W-34):l,x+18,y+40+lh*(i+.85))});return y+H}})}
(function(){if(typeof stewAdd!=="function")return;const base=stewAdd;globalThis.stewAdd=function(o){const n0=(R&&R.stewQ||[]).length;const r=base(o);try{if(!R||!o||!tvOn())return r;const S=tv3();
  const grew=(R.stewQ||[]).length>n0;if(!grew&&!(R.qMode&&o.kind==="yellow"))return r;const cul=R.cars.find(c=>c.id===o.cul),vic=R.cars.find(c=>c.id===o.vic);if(!cul)return r;
  const imp=cul.isP||(vic&&vic.isP)||R.qMode||pos(cul)<=10||(vic&&pos(vic)<=10);if(!imp||o.kind==="yellow"&&R.qMode)return r;const key=(cul.id)+">"+(vic?vic.id:"")+Math.floor(R.t/10);if(S.inv[key])return r;S.inv[key]=1;
  const cn=typeof nextCorner==="function"&&nextCorner(cul);tv3Stew("INCIDENTE SOB INVESTIGAÇÃO",[`${cul.code}${vic?` × ${vic.code}`:""} · ${TV3_KIND[o.kind]||"incidente"}${cn?` (${cn.n})`:""}`,`Decisão depois da investigação. ${R.qMode?"Na classificação: posições no grid ou volta apagada.":"Possíveis: 5 s, 10 s, drive-through ou nada."}`],2,5)}catch(e){}return r}})();
(function(){if(typeof stewReport!=="function")return;const base=stewReport;globalThis.stewReport=function(c,verdict,why,ev){const r=base(c,verdict,why,ev);try{if(!R||!c||!tvOn())return r;if(!(c.isP||R.qMode||pos(c)<=12||/drive|stop|grid|preta|desclass/i.test(verdict||"")))return r;
  const none=/sem punição|nenhuma/i.test(verdict||"");tv3Stew(none?"DECISÃO: SEM PUNIÇÃO":"DECISÃO DOS COMISSÁRIOS",[`${c.code} · ${verdict}`,`${why}${ev?` · ${ev}`:""}`],none?1:2,6)}catch(e){}return r}})();

// ======================= 6) CAMPEONATO AO VIVO =======================
function tv3Champ(){if(typeof standings!=="function"||!G||!G.drivers)return;const S=tv3();if(!S.st0){const st=standings();S.st0={};st.drivers.forEach((d,i)=>S.st0[d.id]={pts:d.pts,p:i+1});let n=st.drivers.length;R.cars.forEach(c=>{if(!S.st0[c.d.id])S.st0[c.d.id]={pts:0,p:++n}})/* primeira corrida do ano: ninguém tem pontos ainda */}
  const cls=R.order.filter(c=>c.status==="run"||c.status==="fin");const live=Object.keys(S.st0).map(id=>{const c=cls.find(x=>x.d.id===id);const i=c?cls.indexOf(c):99;const add=i<10?POINTS[i]:0;return{id,pts:S.st0[id].pts+add,add,p0:S.st0[id].p}});
  live.sort((a,b)=>b.pts-a.pts||a.p0-b.p0);live.forEach((x,i)=>x.p=i+1);const me=live.find(x=>x.id===G.me);let rows=live.slice(0,6);if(me&&me.p>6)rows=rows.slice(0,5).concat([me]);
  tv3Push({pri:1,dur:8,col:"#FFD400",draw:(ctx,cw,ch,e,mob)=>{const rh=mob?19:21,sl=tv3Slot(cw,mob?340:400,330),W=sl.W,H=40+rows.length*rh+8,x=sl.x,y=sl.y-(1-e)*24;tv3Panel(ctx,x,y,W,H,"#FFD400");
    ctx.textAlign="left";ctx.fillStyle="#FFFFFF";ctx.font=`900 italic ${mob?14:17}px ${TVF}`;ctx.fillText("CAMPEONATO AO VIVO",x+18,y+22);ctx.fillStyle="#9AA3B2";ctx.font=`700 ${mob?9.5:10.5}px ${TVF}`;ctx.fillText("se a corrida terminasse agora",x+18,y+34);
    let yy=y+40;rows.forEach(r=>{const d=G.drivers[r.id],t=teamOf(d.team);if(r.id===G.me){ctx.fillStyle="rgba(255,212,0,.13)";ctx.fillRect(x+8,yy,W-16,rh)}ctx.textAlign="left";ctx.fillStyle="#C9CED8";ctx.font=`800 ${mob?11:13}px ${TVF}`;ctx.fillText(String(r.p),x+18,yy+rh*.72);
      const dv=r.p0-r.p;ctx.fillStyle=dv>0?TV3_GREEN:dv<0?"#FF5A5F":"#6B7380";ctx.font=`800 ${mob?9:10}px ${TVF}`;ctx.fillText(dv>0?`▲${dv}`:dv<0?`▼${-dv}`:"–",x+38,yy+rh*.7);
      ctx.fillStyle=t?t.c:"#888";ctx.fillRect(x+66,yy+4,4,rh-8);ctx.fillStyle="#FFFFFF";ctx.font=`900 ${mob?12:14}px ${TVF}`;ctx.fillText(d.code,x+76,yy+rh*.72);
      ctx.textAlign="right";ctx.fillStyle=TV3_GREEN;ctx.font=`800 ${mob?10:11.5}px ${TVF}`;ctx.fillText(r.add?`+${r.add}`:"",x+W-62,yy+rh*.72);ctx.fillStyle="#FFFFFF";ctx.font=`900 ${mob?12:14}px ${TVF}`;ctx.fillText(`${r.pts}`,x+W-14,yy+rh*.72);yy+=rh});return y+H}})}
function tv3ChampTick(){const S=tv3();if(R.qMode||!R.started||R.sc||R.red||!G||G.mp||!R.L||R.L<6)return;const marks=[Math.round(R.L*.35),Math.round(R.L*.7),R.L-2];const m=marks[S.champN];if(m==null)return;if((R.lead||0)>=m&&!TVX.ban&&!TVX.banQ.length){S.champN++;tv3Champ()}}

// ======================= COMENTARISTA: classificação e mais variedade na corrida =======================
function tv3QComment(){const Q=R.qMode;if(!Q)return null;const n=Q.sess,cut=QKEEP[n];const o=qOrder().filter(c=>Q.pool.includes(c.d.id));const timed=o.filter(c=>qTime(c)!=null);const ops=[];const f=d=>d.toFixed(3).replace(".",",");
  if(Q.phase==="break")return vpick([`Intervalo. ${Q.elim.slice(0,6).map(c=>c.code).join(", ")} ficaram pelo caminho.`,`Os engenheiros correm contra o relógio: poucos minutos para ajustar o carro para o Q${n+1}.`,`No intervalo, as equipes decidem quantos jogos de pneus novos ainda têm para o Q${n+1}.`,`Hora de respirar. O Q${n+1} costuma ser decidido por menos de um décimo.`]);
  if(Q.red)ops.push(`Bandeira vermelha com ${qClock(Q.clock)} no relógio. Quem ainda não marcou tempo está com o coração na mão.`,`O relógio parou em ${qClock(Q.clock)}. Na retomada, todos vão para a pista ao mesmo tempo: tráfego garantido.`);
  if(Q.clock>QDUR[n]-150)ops.push(`Começou o Q${n}. Poucos carros na pista: a borracha ainda não foi depositada.`,`Início do Q${n}: as equipes preferem esperar a pista melhorar.`,`Q${n} em andamento. Quem sair agora ganha pista livre, mas a pista mais lenta.`,`O Q${n} começou com ${R.cars.filter(c=>running(c)&&!c.pit&&c.q&&Q.pool.includes(c.d.id)).length} carros na pista.`);
  if(Q.clock<240&&Q.clock>60)ops.push(`Últimos minutos do Q${n}. Todo mundo vai para a pista e o tráfego pode decidir tudo.`,`${qClock(Q.clock)} no relógio. Agora é a hora da verdade.`,`Reta final do Q${n}. A pista está no melhor momento.`,`Cada décimo vale ouro agora: são ${qClock(Q.clock)} para o fim do Q${n}.`);
  if(cut&&timed.length>cut){const a=o[cut-1],b=o[cut];const ta=qTime(a),tb=qTime(b);if(ta!=null&&tb!=null)ops.push(`A linha de corte está com ${a.code}, P${cut}. ${b.code} está só ${f(tb-ta)} atrás.`,`${b.code} é o primeiro fora: precisa de ${f(tb-ta)} para entrar no Q${n+1}.`,`Briga apertada no P${cut}: ${a.code} dentro, ${b.code} fora, separados por ${f(tb-ta)}.`)}
  if(cut){const big=o.slice(cut).filter(c=>(c.t.tier||0)>=86&&qTime(c)!=null)[0];if(big)ops.push(`Surpresa: ${big.code}, da ${big.t.n}, está na zona de eliminação.`,`A ${big.t.n} está em apuros: ${big.code} está fora do corte.`,`Quem diria: ${big.code} corre risco de cair no Q${n}.`)}
  const no=o.filter(c=>qTime(c)==null);if(no.length&&Q.clock<QDUR[n]-300)ops.push(`${no.slice(0,3).map(c=>c.code).join(", ")} ainda não ${no.length>1?"marcaram":"marcou"} tempo.`,`Atenção para ${no[0].code}: sem tempo até agora, não pode errar.`);
  if(timed.length>=2){const a=timed[0],b=timed[1];ops.push(`${a.code} lidera o Q${n} com ${fmtT(qTime(a))}.`,`${a.code} está ${f(qTime(b)-qTime(a))} à frente de ${b.code}.`,`O melhor tempo do Q${n} é de ${a.code}, da ${a.t.n}.`,`${a.code} na ponta, mas ${b.code} está a apenas ${f(qTime(b)-qTime(a))}.`)}
  const tm={};timed.forEach(c=>(tm[c.t.id]=tm[c.t.id]||[]).push(c));for(const k in tm)if(tm[k].length===2){const[a,b]=tm[k];ops.push(`Duelo interno na ${a.t.n}: ${a.code} está ${f(qTime(b)-qTime(a))} à frente de ${b.code}.`);break}
  if(R.secBest&&R.secBest[1]){const c=R.cars.find(x=>x.id===R.secBest[1].id);if(c)ops.push(`O setor 2 mais rápido do Q${n} é de ${c.code}.`,`${c.code} tem o setor do meio mais rápido até agora: dá para melhorar ainda.`)}
  const me=R.cars.find(c=>c.isP);if(me&&Q.pool.includes(me.d.id)){const p=qPosOf(me);if(p)ops.push(`${me.code} está em P${p}${cut?(p<=cut?", dentro do corte":", fora do corte"):""}.`,`${me.d.n.split(" ").pop()} aparece em P${p} na tabela do Q${n}.`)}
  if(R.w>.2)ops.push("Pista úmida: a classificação vira uma loteria e o tempo pode cair muito na última volta.","Com chuva, sair por último é arriscado: se piorar, quem marcou cedo se salva.");
  ops.push(`Em ${R.C.n}, a volta perfeita depende do último setor e de pneus na temperatura certa.`,`A pista melhora a cada carro que passa. A última tentativa costuma ser a mais rápida.`,`Bateria cheia na linha é obrigação: a volta de saída serve para isso.`,`Tráfego é o grande inimigo da classificação: ninguém quer pegar um carro lento na última curva.`);
  return vpick(ops)}
function tv3RaceComment(){const run=R.order.filter(c=>running(c));if(run.length<4)return null;const ops=[];const left=R.L-R.lead;const me=R.cars.find(c=>c.isP);
  const out=R.cars.filter(c=>c.status==="dnf");if(out.length)ops.push(`${out.length} abandono${out.length>1?"s":""} até agora: ${out.slice(0,3).map(c=>c.code).join(", ")}.`,`Corrida de desgaste: ${out.length} carro${out.length>1?"s":""} já fora.`);
  const stops=run.reduce((a,c)=>a+(c.stops||0),0);if(R.lead>3)ops.push(`${stops} paradas nos boxes até aqui.`,`${run.filter(c=>!c.stops).length} pilotos ainda não pararam.`);
  const lap=run.filter(c=>c.lap<run[0].lap).length;if(lap>2)ops.push(`${lap} carros já levaram volta do líder.`,`O ritmo de ${run[0].code} já colocou ${lap} carros uma volta atrás.`);
  for(let i=1;i<Math.min(10,run.length);i++){const A=run[i-1],B=run[i];if(A.t===B.t){const g=(A.prog-B.prog)*(B.L||90);if(g<2)ops.push(`Os carros da ${A.t.n} andam juntos: ${A.code} e ${B.code} separados por ${g.toFixed(1).replace(".",",")} s.`,`Duelo interno na ${A.t.n}: será que a equipe interfere?`);break}}
  if(R.fast&&R.fast.c)ops.push(`A volta mais rápida é de ${R.fast.c.code}: ${fmtT(R.fast.t)}.`,`${R.fast.c.code} tem a melhor volta da corrida, ${fmtT(R.fast.t)}.`);
  if(left>2&&left<=6)ops.push(`Faltam ${left} voltas. Agora é bateria liberada e ataque total.`,`Reta final: ${left} voltas. Quem tiver pneu vai fazer a diferença.`);
  if(me&&running(me))ops.push(`${me.code} segue em P${pos(me)}.`,`${me.d.n.split(" ").pop()} faz uma corrida ${pos(me)<=10?"de pontos":"de recuperação"} até aqui.`);
  ops.push(`Com o regulamento de 2026, metade da potência vem da parte elétrica: gerenciar bateria virou arte.`,`A asa móvel em todas as retas mudou a forma de defender: é preciso proteger a saída da curva.`,`${R.C.n} castiga ${R.C.wear>1.1?"os pneus traseiros":"os freios"}: os engenheiros estão de olho.`);
  return vpick(ops)}
(function(){const base=tvComment;globalThis.tvComment=function(){if(R&&R.qMode)return tv3QComment();const b=base();return b&&vrnd()<.5?b:(tv3RaceComment()||b)}})();

// ---------- desenho e relógio
(function(){const base=tvOverlay;globalThis.tvOverlay=function(ctx,cw,ch,dt){base(ctx,cw,ch,dt);try{if(!R||!R.qMode||!tvOn())return;if(typeof bcOn==="function"&&!bcOn())return;tv3LapTimer(ctx,cw,ch,performance.now()/1000)}catch(e){}}})();
(function(){const base=tvEvents;globalThis.tvEvents=function(){base();try{if(!R)return;if(R.qMode)tv3QTick();else{tv3BattleTick();tv3ChampTick()}}catch(e){}}})();
