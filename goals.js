// ===================== METAS DA EQUIPE E MELHORES MOMENTOS =====================

// ---------- metas: antes da corrida o engenheiro combina 2 metas do tamanho do seu carro; cumpridas, viram créditos da oficina
// Uma de resultado (companheiro, posições, pontos, pódio) e uma de "corrida limpa" (sem dano, volta melhor que o companheiro, uma parada).
function goalsFor(){if(!W||W.mp||G.mp)return null;if(W.goals)return W.goals;const me=ME(),m=mate();const grid=W.grid?W.grid.indexOf(G.me)+1:expectedPos();const exp=expectedPos();const key=G.season*100+G.round;
  const pickK=(arr,s)=>arr[Math.abs(Math.floor(Math.sin(key*12.9898+s)*43758.5453))%arr.length];// sempre a mesma escolha para a mesma corrida
  const res=[];if(m)res.push({k:"mate",t:`Terminar à frente do ${m.code}`,cr:30});
  if(grid>3){const n=grid>15?4:grid>8?3:2;res.push({k:"gain",n,t:`Ganhar ${n} posições (largando em ${grid}º)`,cr:20+n*5,grid})}
  if(exp<=2)res.push({k:"win",t:"Vencer a corrida",cr:70});else if(exp<=5)res.push({k:"top",n:3,t:"Chegar ao pódio",cr:55});else if(exp<=9)res.push({k:"top",n:Math.max(1,exp-1),t:`Terminar em ${Math.max(1,exp-1)}º ou melhor`,cr:40});else if(exp<=15)res.push({k:"top",n:10,t:"Marcar pontos",cr:40});
  const clean=[{k:"clean",t:"Trazer o carro sem danos",cr:20}];if(m)clean.push({k:"flmate",t:`Fazer volta mais rápida que o ${m.code}`,cr:15});
  const plan=strategyPlans&&strategyPlans().find(p=>p.id==="A");if(plan&&plan.stops&&plan.stops.length===1&&W.laps>=12)clean.push({k:"onestop",t:"Fazer só uma parada",cr:20});
  W.goals=[pickK(res,1),pickK(clean,2)].filter(Boolean);return W.goals}
// situação de uma meta: "ok" garantida/cumprida, "no" perdida, "on" em andamento (ao vivo usa a corrida; no fim usa o resultado)
function goalState(g,fin){const me=R.cars.find(c=>c.isP);if(!me)return"no";const m=R.cars.find(c=>c!==me&&c.t===me.t);const p=pos(me),done=fin||me.status==="fin";const alive=running(me)||me.status==="fin";
  if(!alive)return"no";
  switch(g.k){case"mate":if(!m||!(running(m)||m.status==="fin"))return done?"ok":"on";return p<pos(m)?(done?"ok":"on"):(done?"no":"off");
    case"gain":return g.grid-p>=g.n?(done?"ok":"on"):(done?"no":"off");
    case"win":return p===1?(done?"ok":"on"):(done?"no":"off");
    case"top":return p<=g.n?(done?"ok":"on"):(done?"no":"off");
    case"clean":{const d=me.dmg||{};const hit=(d.wing||0)>=.3||(d.susp||0)>=.3||(d.floor||0)>=.3||(d.rwing||0)>0;return hit?"no":done?"ok":"on"}
    case"flmate":if(!m||!m.best)return me.best?(done?"ok":"on"):"on";return me.best&&me.best<m.best?(done?"ok":"on"):(done?"no":"off");
    case"onestop":return me.stops>1?"no":done&&me.stops===1?"ok":done?"no":"on"}return"on"}
// ao vivo: o engenheiro avisa quando uma meta entra ou sai do alcance (só depois da metade da corrida e no máximo uma vez por meta)
function goalsTick(){if(!R||!R.goals||!R.started||R.over||!R.vox)return;const me=R.cars.find(c=>c.isP);if(!me||me.lap<R.L*.5)return;if(R.t<(R.goalT||0))return;R.goalT=R.t+3;
  for(const g of R.goals){const s=goalState(g,false);if(g.said)continue;if(s==="no"){g.said=1;vox("eng_goal_off",me,{X:g.t.charAt(0).toLowerCase()+g.t.slice(1)},1,"eng")}else if((s==="on")&&R.L-me.lap<=3&&g.k!=="clean"&&g.k!=="onestop"){g.said=1;vox("eng_goal_on",me,{X:g.t.charAt(0).toLowerCase()+g.t.slice(1)},2,"eng")}}}
// fim de corrida: resultado de cada meta e créditos
function goalsPay(){if(!R||!R.goals)return null;const out=R.goals.map(g=>{const ok=goalState(g,true)==="ok";return{t:g.t,ok,cr:ok?g.cr:0}});const tot=out.reduce((s,x)=>s+x.cr,0);if(tot&&typeof shopInit==="function"){const S=shopInit();if(S)S.cr+=tot}return{list:out,tot}}
function goalsHtml(list,live){if(!list||!list.length)return"";return`<div class="goals">${list.map(g=>{const s=live?goalState(g,false):(g.ok?"ok":"no");const ic=s==="ok"?"✅":s==="no"?"❌":s==="off"?"⚠️":"🎯";return`<div class="goal ${s}"><span>${ic}</span><span>${esc(g.t)}</span><b class="num">${live?"+"+g.cr:g.ok?"+"+g.cr:"0"}</b></div>`}).join("")}</div>`}
if(typeof VOX!=="undefined"){VOX.eng_goal_on=["Meta da equipe: {X}. Está no caminho, segura!","Faltam poucas voltas. {X}: está nas suas mãos!","Continua assim! A meta ({X}) está garantida se não errar."];
VOX.eng_goal_off=["A meta ({X}) ficou difícil. Esquece e foca no resultado.","Perdemos a meta: {X}. Vamos buscar o máximo agora.","Não deu pra meta ({X}). Segue firme."];}

// ---------- melhores momentos: guarda alguns segundos em volta de cada lance importante (o replay da corrida só guarda 14 s)
// e no fim passa os melhores em sequência, com a câmera em cima dos carros envolvidos.
const CLIP_W={crash:4,lead:3,finish:3,start:2,pass:1,contact:1,spin:1,pit:-9};
function clipMark(type,cars,txt,imp){if(!R||!R.clipQ||!R.started&&type!=="start")return;const sc=(imp||1)*2+(CLIP_W[type]||0)+(cars.some(c=>c.isP)?3:0);if(sc<3)return;R.clipQ.push({t:R.t,type,ids:cars.map(c=>c.id).slice(0,2),txt,sc,lap:Math.max(1,R.lead+1),end:R.t+(type==="finish"?2.5:3.5)})}
function clipTick(){if(!R||!R.clipQ||!R.clipQ.length||!R.rb||!R.rb.length)return;const keep=[];
  for(const q of R.clipQ){if(R.t<q.end){keep.push(q);continue}const fr=R.rb.filter(f=>f.t>=q.t-(q.type==="finish"?4:5.5)&&f.t<=q.end);if(fr.length<20)continue;
    const last=R.clips[R.clips.length-1];const c={...q,cars:q.ids,imp:q.sc,t0:fr[0].t,t1:fr[fr.length-1].t,frames:fr};/* cars/imp: formato que o cartão "Assistir" do resultado (tv.js) também usa */
    if(last&&c.t0<last.t1){if(c.sc>last.sc)R.clips[R.clips.length-1]=c;continue}
    R.clips.push(c);if(R.clips.length>9){let lo=0;R.clips.forEach((x,i)=>{if(x.sc<R.clips[lo].sc)lo=i});R.clips.splice(lo,1)}}
  R.clipQ=keep}
// narração de cada momento
function clipLine(c){const a=R.cars.find(x=>x.id===c.ids[0]),b=R.cars.find(x=>x.id===c.ids[1]);const A=a?a.code:"",B=b?b.code:"";
  const L={pass:[`Volta ${c.lap}: ${A} passa ${B}! Que manobra!`,`${A} pra cima de ${B}, e passou!`],crash:[`Volta ${c.lap}: forte acidente de ${A}!`,`${A} no muro! Que pancada!`],spin:[`${A} roda, volta ${c.lap}!`],contact:[`Toque entre ${A} e ${B}!`],
    lead:[`${A} assume a liderança na volta ${c.lap}!`],start:["A largada!"],finish:[`${A} recebe a bandeirada!`]};const arr=L[c.type]||[c.txt||""];return arr[Math.abs(Math.floor(c.t*7))%arr.length]}
// passa os momentos em sequência (tela do fim de semana "Melhores momentos")
const HLR={i:0,t:0,raf:0,last:0};
function momentosStep(){const el=$("#wk");const C=(R.clips||[]).slice().sort((a,b)=>a.t0-b.t0);
  el.innerHTML=`<div class="card"><h3>Melhores momentos</h3><canvas id="mmcv" style="width:100%;border-radius:6px;background:#0E1116"></canvas><div class="mmcap" id="mmcap"></div>
   <div class="row" style="margin-top:8px"><span class="muted num" id="mmidx"></span><button class="btn sm" data-act="hlNext">Próximo lance</button><button class="btn go" data-act="hlEnd">Ver o resultado</button></div></div>`;
  cancelAnimationFrame(HLR.raf);HLR.i=0;HLR.t=C.length?C[0].t0:0;HLR.last=performance.now();if(typeof sndRadio==="function"&&UI.sound)sndRadio(.6);
  const cv=$("#mmcv");const step=now=>{if(W.step!=="momentos"||!document.getElementById("mmcv"))return;const dt=Math.min(.1,(now-HLR.last)/1000);HLR.last=now;const c=C[HLR.i];if(!c){hlEnd();return}
    const slow=(c.type==="crash"||c.type==="contact")&&Math.abs(HLR.t-c.t)<1.6?.45:1;HLR.t+=dt*slow;if(HLR.t>c.t1){HLR.i++;const n=C[HLR.i];if(!n){hlEnd();return}HLR.t=n.t0}
    const cc=C[HLR.i];try{drawReplay(cv,{frames:cc.frames,me:cc.ids[0],other:cc.ids[1],t:cc.t},HLR.t)}catch(e){}
    const cap=$("#mmcap"),txt=clipLine(cc);if(cap&&cap.textContent!==txt){cap.textContent=txt;if(typeof ttsSay==="function")ttsSay("narr",txt,2)}const ix=$("#mmidx");if(ix)ix.textContent=`Lance ${HLR.i+1} de ${C.length}`;
    HLR.raf=requestAnimationFrame(step)};HLR.raf=requestAnimationFrame(step)}
function hlEnd(){cancelAnimationFrame(HLR.raf);if(W.step==="momentos"){W.step="results";render()}}
function hlAction(a){if(a==="hlNext"){const C=(R.clips||[]).slice().sort((x,y)=>x.t0-y.t0);HLR.i++;if(HLR.i>=C.length)return hlEnd();HLR.t=C[HLR.i].t0}else if(a==="hlEnd")hlEnd()}
