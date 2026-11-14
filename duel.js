// ===================== DISPUTA: CURVAS, ESTILO DE ATAQUE, DIREITO À CURVA, VANTAGEM E DEVOLUÇÃO =====================
// Cada curva tem um tipo (grampo, lenta, média, rápida, de alta, chicane) e uma nota de "ponto de ultrapassagem".
// No ápice, quem está por fora tem direito ao espaço se estiver à frente; quem está por dentro, se o eixo dianteiro
// chegar pelo menos ao espelho do outro (diretrizes da FIA). Jogar para fora quem tinha direito dá punição;
// ultrapassar com as quatro rodas fora da pista (ou sob amarela) obriga a devolver a posição ou leva 5 s.
const CTYPE={grampo:"grampo",lenta:"curva lenta",media:"curva média",rapida:"curva rápida",alta:"curva de alta",chicane:"chicane"};
const ASTYLE={auto:"Deixa comigo",in:"Por dentro",out:"Por fora",wait:"Paciência"};
function cornerTypes(geo){const AI=geo.ai,N=geo.N,v=AI.vref,ph=AI.ph,cs=geo.corners;if(!cs.length){AI.nextC=new Int16Array(N).fill(-1);return}
  cs.forEach(c=>{const vA=v[c.i];c.vA=vA;c.type=vA<22?"grampo":vA<33?"lenta":vA<50?"media":vA<67?"rapida":"alta";
    let b=c.i,n=0;while(n<N&&ph[(b-1+N)%N]!==0){b=(b-1+N)%N;n++}let s=b,m=0;while(m<N&&ph[(s-1+N)%N]===0){s=(s-1+N)%N;m++}
    c.brkLen=n*DS;c.str=m*DS;c.vE=v[b]});
  cs.forEach((c,j)=>{const nx=cs[(j+1)%cs.length];if(nx===c)return;const gap=(((nx.i-c.i)+N)%N)*DS;if(gap<95&&nx.dir!==c.dir){c.chic=1;nx.chic=2}});
  cs.forEach(c=>{c.pass=clamp((c.vE-c.vA)/45,0,1)*clamp(c.str/650,0,1)*(c.chic===2?.4:c.chic===1?.85:1)*(c.type==="alta"?.2:c.type==="rapida"?.5:1)});
  const nextC=new Int16Array(N);const ord=cs.map((c,j)=>[c.i,j]);for(let i=0;i<N;i++){let best=0,bd=1e9;for(const[ci,j]of ord){const d=(ci-i+N)%N;if(d<bd){bd=d;best=j}}nextC[i]=best}
  AI.nextC=nextC}
function nextCorner(c){const g=R.geo,AI=g.ai;if(!AI||!AI.nextC)return null;return g.corners[AI.nextC[Math.floor(fr(c.prog)*g.N)%g.N]]||null}
function ctypeName(cn){return cn?CTYPE[cn.chic?"chicane":cn.type]||"":""}
// lado do ataque: o jogador escolhe o estilo pelo rádio; os outros decidem pela curva e pelo jeito de pilotar
function atkSide(c,A,ins){const st=c.atkStyle||"auto";if(st==="in")return ins;if(st==="out")return-ins;
  const cn=nextCorner(c),mid=cn&&(cn.type==="media"||cn.type==="rapida");const covered=Math.abs((A.y||0)-ins*3.3)<2.4;
  if(covered)return(mid&&(c.d.a.cor||75)>=70)||rnd()<.3?-ins:ins;
  return rnd()<(mid?.22:.08)*(.5+aggrEff(c,A))?-ins:ins}
// quanto a chance de atacar muda pelo estilo e pela leitura de corrida (pilotos espertos esperam o lugar certo)
function styleK(c,adv){const cn=nextCorner(c);const good=cn&&cn.pass>.5;let k=1;
  if(c.atkStyle==="wait"){k=good||adv>.45?1.15:.15}
  else{const smart=clamp(((c.d.a.craft||75)-60)/40,0,1);k=1+smart*(good?.25:-.4)}
  return k}

// ---------- no ápice: quem tem direito à curva
function apexRight(c,i){if(!c.alongs||!c.alongs.length||R.sc||R.red)return;const ins=R.geo.ai.insN[i],L=R.geo.len;
  for(const o of c.alongs){if(!running(o)||o.pit||o.vis)continue;let ds=o.fs-c.fs;if(ds>L/2)ds-=L;if(ds<-L/2)ds+=L;if(Math.abs(ds)>CARL*1.3||Math.abs((o.y||0)-(c.y||0))>4.2)continue;
    const cIn=Math.sign((c.y||0)-(o.y||0))===ins;
    if(cIn){c.apexR={o:o.id,inside:true,right:ds<=.7,ds:-ds,t:R.t};// por dentro: eixo dianteiro pelo menos no espelho
      // na saída, quem está por dentro pode abrir a trajetória e espremer quem está por fora (agressivo, rival, ordem de segurar)
      {const disc=(c.d.pers||{}).disc??65;const ps=clamp(.03+(aggrEff(c,o)-.5)*.12+(c.defOrd?.1:0)+feud(c.d.id,o.d.id)*.003-(disc-60)/600,.01,.35);if(rnd()<ps)c.runWide={o:o.id,until:R.t+1.6}}
      // mergulho: quem foi passado pode cruzar a linha e sair melhor; quem mergulhou sai pior da curva
      if(c.apexR.right&&c.att&&c.att.commit&&c.att.id===o.id){c.diveExitT=R.t+2.2;if(!o.hum||o.atkStyle!=="wait")if(rnd()<.35+((o.d.a.craft||75)-70)/60)o.cut={id:c.id,until:R.t+3.2}}}
    else{c.apexR={o:o.id,inside:false,right:-ds>.5,ds:-ds,t:R.t};// por fora: precisa estar à frente
      // atacando por fora, o piloto pode usar "toda a pista e mais um pouco" na saída: quatro rodas fora para completar a manobra
      R.nOutApex=(R.nOutApex||0)+1;if(c.att&&c.att.commit)R.nOutAtk=(R.nOutAtk||0)+1;if(-ds>-CARL&&-ds<=1.5&&!c.pitCall&&rnd()<clamp(.14+(aggrEff(c,o)-.5)*.3+(1.5-(c.d.a.kerb||75)/100)*.15-(((c.d.pers||{}).disc??65)-60)/400,.04,.55))c.wideExit={o:o.id,at:R.t+rr(.4,1.1)}}
    break}}
// espremido contra a borda na saída: quem tinha direito é jogado para fora; quem não tinha tira o pé ou passa por fora da pista
function squeezeOut(c,o,ph){if(!o||c.ex||(c.dyn&&dynCmd(c,"pushOut"))||(c.forcedCd||0)>R.t||R.sc||R.red||c.pitCall||o.pitCall||!R.started)return;if(ph===0&&!((c.exitT||0)>R.t))return;
  const g=R.geo,N=g.N,i=Math.floor(fr(c.prog)*N)%N,ins=g.ai.insN[i],L=g.len;let ds=c.fs-o.fs;if(ds>L/2)ds-=L;if(ds<-L/2)ds+=L;// ds>0: c à frente
  if(Math.abs(ds)>CARL*1.3||Math.abs((c.y||0)-(o.y||0))<1.2)return;if(Math.sign((c.y||0)-(o.y||0))!==-ins)return;// só quem está por fora da curva é jogado para fora
  const ar={right:ds>.5,ds};c.forcedCd=R.t+6;const f=fr(c.prog),out=Math.sign(c.y||1)||1;const cn=cornerAt(g,i),nm=cn?cn.n:"curva";
  if(ar.right){dynError(c,"pushOut",{dir:out,t:1.5});c.offForced=R.t;bubble(c,"Jogado para fora!","bad",3);R.fxq.push({type:"dust",f,lat:out*8,t0:R.t});
    feudAdd(o.d.id,c.d.id,15,"jogou para fora");stEv(c,"hit");crowdEv(f,.6);R.nForced=(R.nForced||0)+1;
    rcMsg(`${o.code} não deixou espaço e jogou ${c.code} para fora na ${nm}. Investigação.`,"warn","direito");
    if(c.hum)radio(c,`${o.code} me jogou para fora! Eu estava na frente no ápice.`,{k:"direito"});if(o.hum)radio(o,`Os comissários estão olhando o lance com ${c.code} na ${nm}.`,{k:"direito"});
    if(c.isP||o.isP||pos(o)<=8){narr(`${o.code} espreme ${c.code} contra a borda na ${nm}!`,2);hlight("contact",[o,c],`${o.code} joga ${c.code} para fora`,2)}
    stewAdd({kind:"forced",cul:o.id,vic:c.id,clear:clamp(ar.ds/2,0,1),nm})}
  else if(rnd()<.2+aggrEff(c,o)*.45){// segue acelerando com as quatro rodas fora da pista
    dynError(c,"pushOut",{dir:out,t:1.3});c.offAt=R.t;c.offRef={o:o.id,t:R.t};R.nKeepOut=(R.nKeepOut||0)+1;if(c.hum)radio(c,`Não tinha espaço na ${nm}, passei por fora da pista.`,{me:1,k:"vantagem"})}}

// ---------- vantagem fora da pista e devolução de posição
function advGain(B,A,why){why=why||"fora";if(B.gb||(R.sc&&why!=="sc")||R.red||!running(B)||!running(A))return;const msg=why==="amarela"?"ultrapassou sob bandeira amarela":why==="sc"?"ultrapassou sob safety car":"ganhou a posição fora da pista";
  R.nAdv=(R.nAdv||0)+1;rcMsg(`Direção de prova: ${B.code} ${msg} sobre ${A.code} e deve devolver a posição.`,"warn","vantagem");
  B.gb={to:A.id,why,t:R.t,mode:null,deadline:R.t+32};bubble(B,"Precisa devolver!","order",3);
  if(A.hum)radio(A,`${B.code} ${msg}. Ele tem que devolver a posição.`,{k:"vantagem"});
  // o próprio piloto decide como devolver (brain.js: disciplina, ritmo, voltas restantes e a intenção "Disputas")
  {const k=gbBrain(B,A);if(B.hum)radio(B,k==="gb_keep"?`Vou segurar e abrir mais de 5 s do ${A.code}.`:k==="gb_line"?`Devolvo a posição perto da linha e uso o modo de ultrapassagem.`:`Devolvendo a posição ao ${A.code}.`,{me:1,k:"vantagem"});gbDecide(B,A,k)}}
function gbDecide(B,A,k){const g=B.gb;if(!g)return;g.mode=k==="gb_keep"?"keep":k==="gb_line"?"line":"now";
  if(g.mode==="keep"){stewAdd({kind:"adv",cul:B.id,vic:A.id,why:g.why,at:R.t+rr(14,24)});if(!B.hum)B.mode="attack";B.gb=null;return}
  if(g.mode==="now")B.yieldTo=A.id;
  if(B.hum)radio(B,g.mode==="line"?`Copiado: devolvo a posição perto da linha para pegar o modo de ultrapassagem.`:`Copiado, devolvendo a posição para ${A.code}.`,{me:1,k:"vantagem"})}
// depois de passar por fora da pista: se terminou na frente de quem disputava, ganhou vantagem
function wideExitTick(c){const w=c.wideExit;if(!w||R.t<w.at)return;c.wideExit=null;if(c.ex||(c.dyn&&dynCmd(c,"pushOut"))||!running(c)||R.sc||R.red)return;const o=R.cars.find(x=>x.id===w.o);if(!o||!running(o))return;
  const out=Math.sign(c.y||1)||1;dynError(c,"pushOut",{dir:out,t:1.3});c.offAt=R.t;c.offRef={o:o.id,t:R.t};c.wideBoost=R.t+1.3;if(rnd()<.35)kerbHit(c,.7);R.nKeepOut=(R.nKeepOut||0)+1;R.fxq.push({type:"dust",f:fr(c.prog),lat:out*8,t0:R.t});
  if(c.hum)radio(c,`Fui por fora do ${o.code} e passei das linhas brancas na saída.`,{me:1,k:"vantagem"})}
function offTick(c){wideExitTick(c);const r=c.offRef;if(!r)return;const dt=R.t-r.t;if(dt<1.5)return;const o=R.cars.find(x=>x.id===r.o);
  if(!o||!running(o)||dt>6){c.offRef=null;return}if(c.prog>o.prog+(CARL+1)/R.geo.len&&!o.vis&&!o.ex&&!(o.lose>0)){c.offRef=null;advGain(c,o,"fora")}}
function gbTick(c){offTick(c);const g=c.gb;if(!g)return;const A=R.cars.find(x=>x.id===g.to);
  if(!A||!running(A)||A.pit||(c.prog-A.prog)*c.L>5){c.gb=null;c.yieldTo=null;return}// o outro abandonou, parou ou ficou para trás por conta própria
  if(A.prog>c.prog+.0001&&g.mode){gbDone(c,A);return}
  if(g.mode==="line"&&!c.yieldTo&&fr(c.prog)>.86&&(c.prog-A.prog)*c.L<1.1)c.yieldTo=A.id;
  if(R.t>g.deadline&&g.mode!=="keep"){c.gb=null;c.yieldTo=null;stewAdd({kind:"adv",cul:c.id,vic:A.id,why:g.why,at:R.t+2})}}
function gbDone(B,A){const g=B.gb;B.gb=null;B.yieldTo=null;B.yielded=null;B.gbTo=A.id;B.gbDoneT=R.t;rcMsg(`${B.code} devolveu a posição para ${A.code}.`,"","vantagem");bubble(B,`Devolveu para ${A.code}`,"order",3);
  if(g&&g.mode==="line"){B.gbLine=R.t;if(B.hum)radio(B,"Devolvi perto da linha: vou ganhar o modo de ultrapassagem na próxima volta. Agora é atacar!",{me:1,k:"overtake"})}}

// ---------- comissários durante a corrida (vantagem, jogar para fora, bandeira amarela)
function stewAdd(o){R.stewQ=R.stewQ||[];o.at=o.at||R.t+rr(12,20);
  /* toques seguidos entre os mesmos dois carros (até 8 s) são um incidente só: vale a gravidade do pior, uma punição */
  if(o.kind==="contact"){const same=R.stewQ.find(s=>s.kind==="contact"&&((s.cul===o.cul&&s.vic===o.vic)||(s.cul===o.vic&&s.vic===o.cul))&&R.t-(s.t0??-99)<8);if(same){if((o.clar||0)>(same.clar||0)||(o.S||0)>(same.S||0)){const at=same.at,t0=same.t0;Object.assign(same,o,{at,t0})}return}o.t0=R.t}
  R.stewQ.push(o)}
function stewTick(){if(!R.stewQ||!R.stewQ.length)return;for(let i=R.stewQ.length-1;i>=0;i--){const s=R.stewQ[i];if(R.t<s.at)continue;R.stewQ.splice(i,1);const c=R.cars.find(x=>x.id===s.cul),v=R.cars.find(x=>x.id===s.vic);if(!c)continue;
  if(s.kind==="contact"){stewVerdict(s)}
  else if(s.kind==="adv"){const w=s.why==="amarela"?"ultrapassagem sob bandeira amarela":s.why==="sc"?"ultrapassagem sob safety car":"ganhar vantagem fora da pista";penalize(c,5,w,s.why==="fora"?0:1,`não devolveu a posição para ${v?v.code:"o outro piloto"}`)}
  // jogar para fora: decide pelo quanto a vítima estava à frente no ápice (medido), sem sorteio
  else if(s.kind==="forced"){const ev=`${v?v.code:"o outro"} estava ${(s.clear*2).toFixed(1)} m à frente no ápice`;if(s.clear>=.35)penalize(c,5,`forçar ${v?v.code:"outro piloto"} para fora da pista`,1,ev);else if(s.clear>=.15&&typeof repAdd==="function")repAdd(c,`deixar pouco espaço para ${v?v.code:"outro piloto"} na ${s.nm}`,true);else{rcMsg(`Comissários: lance entre ${c.code} e ${v?v.code:"?"} na ${s.nm} foi incidente de corrida, sem punição.`,"","direito");if(typeof stewReport==="function")stewReport(c,"Sem punição",`lance com ${v?v.code:"?"} na ${s.nm}`,ev);if(c.hum)radio(c,"Sem punição no lance da curva. Seguimos.",{k:"direito"})}}
  // bandeira amarela: só com a velocidade medida na zona (quem não tirou o pé)
  else if(s.kind==="yellow"){const ev=`passou a ${Math.round((s.ratio||1)*100)}% da velocidade normal na zona`;penalize(c,s.dbl?10:5,s.dbl?"não reduzir sob bandeira amarela dupla":"não reduzir sob bandeira amarela",s.dbl?2:1,ev)}}}
function penalize(c,secs,why,lic,ev){if(c.status!=="run"&&c.status!=="fin")return;c.pen+=secs;c.penServe=true;R.nPen=(R.nPen||0)+1;rcMsg(`${c.code}: ${secs} s de punição por ${why}.`,"warn","punicao");
  if(typeof stewReport==="function")stewReport(c,`${secs} s`,why,ev);
  if(c.hum)radio(c,`Punição de ${secs} segundos por ${why}.${c.status==="run"?" Cumprimos parados na próxima parada; se não pararmos mais, entra no tempo final.":""}`,{pause:true,k:"punicao"});
  if(lic&&c.d&&typeof licAdd==="function")licAdd(c.d,lic,why);
  // quem está perto da punição de alguém sabe que basta ficar a menos de 5 s
  for(const o of R.cars){if(!o.hum||o===c||!running(o))continue;const gap=(c.prog-o.prog)*o.L;if(gap>0&&gap<secs+3)radio(o,`${c.code} levou ${secs} s de punição. Se você terminar a menos de ${secs} s dele, fica na frente.`,{k:"punicao"})}}

// ---------- comandos de rádio: estilo de ataque e ordem de defesa
function defTick(c){if(c.defOrd&&R.t-(c.defT||0)>150){c.defOrd=false;if(c.hum)radio(c,"Deixei de segurar a posição a todo custo: os pneus estavam sofrendo.",{me:1,k:"defesa"})}}
