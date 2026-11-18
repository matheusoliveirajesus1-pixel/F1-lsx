// ===================== SAFETY CAR: UM CARRO DE VERDADE NA PISTA =====================
// Antes, o safety car era só um desenho colocado 60 m à frente do líder a cada quadro (aparecia do nada, atravessava
// curvas sem frear e sumia na linha de chegada). Agora ele é um carro com a mesma física dos F1 (dyn.js): pneus,
// aderência, freada planejada, relevo, pit lane. O que muda é o ritmo (carro de rua, bem mais lento nas curvas).
//  - acionado: espera na saída do pit lane com as luzes ligadas e sai quando o líder se aproxima, para entrar na
//    pista logo à frente dele (enquanto isso, todos já andam no ritmo de safety car)
//  - guia na linha ideal, no ritmo dele, e espera quem vem atrás se a fila ficar longe
//  - o primeiro da fila anda colado nele (~30 m), na velocidade dele: é o safety car que segura o pelotão
//  - luzes apagadas ("entra nesta volta"): ele segue até a entrada dos boxes, entra no pit lane e para na garagem
// O desenho 3D (carro de rua com a barra de luzes piscando) fica em carro3d.js; online, a posição vai para todos (mp.js).
const SCF={RITMO:.62,VMAX:68,DIST:32,ESPERA:380,SAI:420};
// copia um carro do grid como base (as medidas e a física do carro), com estado próprio
function scCopia(tpl){const SHARE={d:1,t:1,plan:1,prof:1,cpBest:1},o={};
  const ehCarro=v=>v&&typeof v==="object"&&v.prog!==undefined&&v.id!==undefined;
  for(const k in tpl){const v=tpl[k];if(v===null||typeof v!=="object"){o[k]=v;continue}if(SHARE[k]){o[k]=v;continue}
    if(ehCarro(v)){o[k]=null;continue}if(Array.isArray(v)){o[k]=v.some(ehCarro)?[]:v.slice();continue}
    let ref=false;for(const kk in v){if(ehCarro(v[kk])){ref=true;break}}if(ref){o[k]=null;continue}
    try{o[k]=structuredClone(v)}catch(e){o[k]=null}}
  return o}
function scNovo(){const tpl=R.cars.find(c=>running(c)&&!c.pit&&c.prof)||R.cars.find(c=>c.prof);if(!tpl)return null;const c=scCopia(tpl);
  Object.assign(c,{id:"SC",code:"SC",num:"",sc:true,isP:false,hum:false,mate:false,peer:null,auto:true,col:"#F2A900",col2:"#151515",
    tyre:{c:"M",wear:.12,temp:88,grain:0,blister:0,punct:false,flat:0,age:4},dmg:{wing:0,rwing:0,floor:0,power:0,gear:0,susp:0,body:0},pd:null,
    dyn:null,ex:null,air:null,pose3d:null,pit:null,pitCall:null,pitExit:null,status:"run",lap:0,laps:[],lose:0,k:1,mode:"normal",batt:100,
    att:null,defend:null,alongs:[],ahead:null,behind:null,aheadO:null,emerg:null,rev:null,squeeze:null,lateBrake:null,coverY:null,stallT:0,hold:false,
    lineK:1,lineN:0,psi:0,vy:0,v:0,y:0,tl:0,_pp:null,_py:null,_ppsi:null,box:null,luzes:true,atras:null});return c}
// distância (m) de b até a frente a (a à frente de b), na volta
function scDist(a,b){return fr(a.prog-b.prog)*R.geo.len}
function scLider(){return R.order.find(c=>running(c)&&!c.pit&&!c.parked)}
// quanto o líder ainda anda até a saída do pit lane (m)
function scAteSaida(){const lid=scLider();if(!lid)return 0;return((R.pitLane.fx-fr(lid.prog))%1+1)%1*R.geo.len}
// acionado: fica parado no fim do pit lane, de luzes ligadas, esperando o líder
function scSai(){const c=scNovo();if(!c)return;const L=R.geo.len,PL=R.pitLane,s0=PL.D*.8;c.prog=Math.floor(R.lead||0)+PL.fe+s0/L;c.box={fase:"espera",s:s0,pA:c.prog-s0/L};c.pit=c.box;
  const yl=pitLatAt(fr(c.prog));c.y=yl!=null?yl:TRK_H+6;c.v=0;R.scCar=c}
// quem está logo atrás dele (o primeiro da fila)
function scFila(c){let best=null,bd=1e9;for(const o of R.cars){if(!running(o)||o.pit||o.parked)continue;const d=scDist(c,o);if(d>0&&d<bd&&d<R.geo.len*.6){bd=d;best=o}}return{car:best,d:bd}}
// passo do safety car (chamado pela corrida a cada passo da física)
function scPasso(dt){if(!R.started||R.qMode){R.scCar=null;R.scP=null;return}
  if(R.red){R.scCar=null;R.scP=null;return}/* bandeira vermelha: todos vão para o pit lane; depois ele sai de novo */
  if(R.sc&&R.sc.type==="sc"&&!R.scCar)scSai();const c=R.scCar;if(!c){R.scP=null;return}
  c.luzes=!!(R.sc&&R.sc.type==="sc"&&!R.sc.ending);c._pp=c.prog;c._py=c.y||0;c._ppsi=c.psi||0;const L=R.geo.len,PL=R.pitLane;
  if(c.box){const B=c.box;let vT=PIT_LIM;
    if(B.fase==="espera"&&!c.luzes){R.scCar=null;R.scP=null;return}/* a pista ficou livre antes de ele sair: nem precisa sair */
    if(B.fase==="espera"){/* sai quando o líder está chegando: entra na pista logo à frente dele */const d=scAteSaida();if(d<SCF.SAI&&d>40||!scLider())B.fase="sai";else{vT=0;c.v=0;R.scP=null;return}}
    if(B.fase==="entra"){const alvo=PL.D*.5,d=alvo-B.s;vT=Math.min(PIT_LIM,Math.sqrt(2*5*Math.max(0,d))+.2);if(d<=.5){R.scCar=null;R.scP=null;return}}/* chegou na garagem dele */
    const yl=pitLatAt(fr(c.prog));dynStep(c,dt,vT,true,false,yl!=null?yl:c.y,{pit:true,amax:B.fase==="sai"?10:8,dmax:24});B.s=(c.prog-B.pA)*L;
    if(B.fase==="sai"&&B.s>=PL.D){c.box=null;c.pit=null;c.pitExit=R.t}}
  else{const f=fr(c.prog),N=R.geo.N,i=Math.floor(f*N)%N;let vT=Math.min(SCF.VMAX,speedAt(c,f)*SCF.RITMO);
    const q=scFila(c);c.atras=q.car;if(q.car&&q.d<90&&c.pegouT==null)c.pegouT=R.t;if(q.car&&q.d>SCF.ESPERA&&c.luzes)vT*=clamp(1-(q.d-SCF.ESPERA)/700,.5,1);/* espera a fila */
    // luzes apagadas: entra nos boxes na entrada do pit lane
    if(!c.luzes&&typeof pitDist==="function"){const d=pitDist(c);if(d<4||d>L-6){c.box={fase:"entra",s:0,pA:c.prog};c.pit=c.box;c.atras=null;R.scP=null;return}
      if(d<260)vT=Math.min(vT,Math.sqrt(PIT_LIM*PIT_LIM+2*12*d))}
    let yT=R.geo.line[i];if(!c.luzes&&typeof pitDist==="function"&&pitDist(c)<400){const yl=pitLatAt(fr(c.prog+pitDist(c)/L+4/L));if(yl!=null)yT=clamp(yl,-TRK_H+1.2,TRK_H-1.2)}/* vai para o lado do pit lane antes da entrada */
    dynStep(c,dt,vT,false,false,yT,{})}
  R.scP=c.box?null:c.prog}
// o safety car só apaga as luzes depois de pegar a fila (o líder colado nele por uns segundos)
function scPronto(){const S=R.scCar;if(!S)return true;return S.pegouT!=null&&R.t-S.pegouT>12}
// o primeiro da fila anda colado no safety car, na velocidade dele (os outros seguem quem está na frente, como antes)
function scSegue(c,v1,f){const S=R.scCar;if(!S||S.box||c!==S.atras)return v1;const gap=scDist(S,c)-CARL;
  const v=Math.max(v1,speedAt(c,f)*(gap>120?.85:.75));/* o limite de ritmo de safety car é o próprio safety car: longe, alcança */const vF=(S.v||0)+clamp((gap-SCF.DIST)*.45,-12,14);return Math.max(0,Math.min(v,vF))}
