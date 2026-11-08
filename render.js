// ===================== CIRCUITO ISOMÉTRICO (detalhado) =====================
// (TRACKGEO, ISO_C, ISO_S e WS ficam em data.js: o menu usa antes deste arquivo carregar)
const U=WS/2.3;// escala dos objetos de cenário
const TW=7.4*WS;// meia largura da pista (≈ 15 m de largura)
let FDT=1/60;// duração do último quadro (s), para suavizações
function buildTrack(geo){
  const C=geo.C,rng=mulberry(hashS(geo.id+"v4"));const M=geo.N;
  // contorno levemente suavizado (sem mudar o traçado)
  let path=geo.P.map(p=>({x:(p.x-geo.ctr.x)*WS,y:(p.y-geo.ctr.y)*WS}));
  {const q=path.map(p=>({...p}));for(let i=0;i<M;i++){const a=q[(i-1+M)%M],b=q[i],c=q[(i+1)%M];path[i]={x:(a.x+2*b.x+c.x)/4,y:(a.y+2*b.y+c.y)/4}}}
  const angAt=(P,i)=>{const a=P[(i+M-2)%M],b=P[(i+2)%M];return Math.atan2(b.y-a.y,b.x-a.x)};
  const sc=(P,i)=>{let d=angAt(P,(i+4)%M)-angAt(P,(i+M-4)%M);while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
  let scurv=path.map((_,i)=>sc(path,i));
  const tr={street:C.street};
  const uniq=geo.zones.map(([a,b])=>({s:a,len:(b-a+M)%M})).sort((a,b)=>b.len-a.len);
  const heading=path.map((_,i)=>angAt(path,i));const curv=scurv.map(Math.abs);
  const drs=geo.zones.map(([a,b])=>[a/M,b/M]);const line=Array.from(geo.line,v=>v*WS);
  const ctr={x:path.reduce((a,p)=>a+p.x,0)/M,y:path.reduce((a,p)=>a+p.y,0)/M};
  const nrm=i=>({x:-Math.sin(heading[i]),y:Math.cos(heading[i])});
  if(typeof aiPrep==="function"&&geo.gk)aiPrep(geo);const side=geo.pitSide||(()=>{const p=path[0],n=nrm(0);return((ctr.x-p.x)*n.x+(ctr.y-p.y)*n.y)>0?1:-1})();// lado do pit
  const corners=geo.corners.map(c=>({i:c.i,dir:Math.sign(scurv[c.i])||1,sev:Math.max(curv[c.i],.14),n:c.n,r:c.r}));
  // pit lane: mesma geometria do motor da corrida (entrada antes da linha, saída depois)
  const pl=pitLane(C,geo.len);const iE=Math.round(pl.fe*M),iX=M+Math.round(pl.fx*M);const POFF=TW+19*U,PIN=TW*.55;
  const pit=[];for(let k=iE;k<=iX;k++){const i=k%M,p=path[i],n=nrm(i);const r=Math.min(1,Math.min(k-iE,iX-k)/24);const e=r*r*(3-2*r);const off=PIN+(POFF-PIN)*e;pit.push({x:p.x+n.x*side*off,y:p.y+n.y*side*off})}
  const P=(i,lat)=>{const p=path[(i+M)%M],n=nrm((i+M)%M);return{x:p.x+n.x*lat,y:p.y+n.y*lat}};
  // caixas de brita e muros de pneus por fora das curvas
  const gravel=[];corners.forEach(c=>{const o=-c.dir;const pts=[];const sp=Math.max(10,Math.min(30,Math.round(c.r/DS*.5)));for(let k=-sp;k<=sp+6;k++)pts.push(P(c.i+k,o*(TW+8*U)));for(let k=sp+6;k>=-sp;k--){const w=Math.abs(k-3)<sp*.6?(C.street?30:80):(C.street?26:52);pts.push(P(c.i+k,o*(TW+(w-17)*U)))}
    const wall=[],wl=[];for(let k=-sp-2;k<=sp+8;k++){const L=TW+((Math.abs(k-3)<sp*.6?(C.street?33:86):(C.street?29:58))-17)*U;wl.push(L);wall.push(P(c.i+k,o*L))}const gc=geo.corners.find(x=>x.i===c.i);gravel.push({pts,wall,wl,i0:c.i-sp-2,o,i:c.i,asphalt:gc?gc.ro!=="brita":(tr.street||rng()<.35),ro:gc?gc.ro:"asfalto"})});
  // fiscais (postos com bandeiras)
  const NP=Math.round(geo.len/280);const posts=[];for(let k=0;k<NP;k++){const i=Math.floor(k*M/NP+M/NP/2)%M;const o=Math.abs(scurv[i])>.05?-Math.sign(scurv[i]):-side;const p=P(i,o*(TW+14*U));posts.push({i,f:i/M,x:p.x,y:p.y})}
  // arquibancadas, placas, prédio dos boxes
  const stands=[];for(let k=-7;k<=7;k++){const i=(k*16+M)%M,p=P(i,-side*(TW+46*U));stands.push({x:p.x,y:p.y,h:heading[i],w:60*U,big:true,f:i/M,seed:k*1.7,o:-side})}
  corners.filter(c=>c.sev>.22).slice(0,5).forEach(c=>{const p=P(c.i,-c.dir*(TW+95*U));stands.push({x:p.x,y:p.y,h:heading[c.i],w:70*U,f:c.i/M,seed:c.i*.37,o:-c.dir})});
  {const minD=(x,y)=>{let b=1e9;for(let i=0;i<M;i+=2){const p=path[i];const d=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y);if(d<b)b=d}return Math.sqrt(b)};
    for(let k=stands.length-1;k>=0;k--){const st=stands[k],c=Math.cos(st.h),s2=Math.sin(st.h);const pts=[[0,0],[st.w/2,0],[-st.w/2,0]].map(([u])=>({x:st.x+u*c,y:st.y+u*s2}));if(pts.some(q=>minD(q.x,q.y)<TW+26*U))stands.splice(k,1)}}
  const boards=[];uniq.slice(0,4).forEach(r=>{for(let k=4;k<r.len-4;k+=10){const i=(r.s+k+M)%M;const o=-side;boards.push({...P(i,o*(TW+5*U)),h:heading[i],c:pick(["#E10600","#FFD400","#00A3E0","#FFFFFF","#00B140"])})}});
  const gp=f=>{const pp=pitPosRaw(pit,f);return{pp,n:{x:-Math.sin(pp.h),y:Math.cos(pp.h)}}};
  const garages=[];for(let k=0;k<11;k++){const f=.3+k*.036;const{pp,n}=gp(f);garages.push({x:pp.x+n.x*side*20*U,y:pp.y+n.y*side*20*U,h:pp.h,f})}
  const building={pts:[0,1].map(k=>{const{pp,n}=gp(k?.72:.28);return{x:pp.x+n.x*side*40*U,y:pp.y+n.y*side*40*U,h:pp.h}})};
  // árvores e prédios ao redor
  const trees=[];const near=(x,y,d)=>{for(let i=0;i<M;i+=3){const p=path[i];if(Math.abs(p.x-x)<d&&Math.abs(p.y-y)<d&&Math.hypot(p.x-x,p.y-y)<d)return true}return false};
  let bx0=1e9,bx1=-1e9,by0=1e9,by1=-1e9;path.forEach(p=>{bx0=Math.min(bx0,p.x);bx1=Math.max(bx1,p.x);by0=Math.min(by0,p.y);by1=Math.max(by1,p.y)});
  const nearPit=(x,y,d)=>{for(let i=0;i<pit.length;i+=4){const p=pit[i];if(Math.hypot(p.x-x,p.y-y)<d)return true}return false};
  // câmeras de TV: no lado de fora de cada curva e nas retas longas
  const cams=[];corners.forEach(c=>{const p=P(c.i-8,-c.dir*(TW+70*U));cams.push({i:(c.i-8+M)%M,x:p.x,y:p.y})});
  uniq.forEach(r=>{if(r.len*DS<500)return;const n=Math.floor(r.len*DS/450);for(let k=1;k<=n;k++){const i=(r.s+Math.round(k*r.len/(n+1)))%M;const p=P(i,-side*(TW+60*U));cams.push({i,x:p.x,y:p.y})}});
  cams.sort((a,b)=>a.i-b.i);
  const len=geo.len*WS;TRACKGEO={id:geo.id,geo,line,path,heading,curv,scurv,drs,pit,pl,side,PIN,corners,gravel,posts,stands,boards,garages,building,trees,cams,M,len,ctr,bb:{x0:bx0,x1:bx1,y0:by0,y1:by1},
    outside:f=>{const i=Math.floor(fr(f)*M);const s=scurv[i];return Math.abs(s)>.04?-Math.sign(s):-side}};
  if(typeof sceneBuild==="function")sceneBuild(TRACKGEO);
  return TRACKGEO;
}
function pitPosRaw(P,f){const x=clamp(f,0,1)*(P.length-1),i=Math.floor(x),k=x-i,a=P[i],b=P[Math.min(P.length-1,i+1)],c=P[Math.max(0,i-1)],d=P[Math.min(P.length-1,i+2)];
  const h0=Math.atan2(b.y-c.y,b.x-c.x),h1=Math.atan2(d.y-a.y,d.x-a.x);return{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,h:lerpAng(h0,h1,k)}}
function lerpAng(a,b,k){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*k}
// distância lateral do muro/barreira (unidades do mundo) no ponto f, do lado indicado; null fora das áreas de escape
function wallLatAt(f,sign){const g=TRACKGEO;if(g&&g.scn&&typeof sceneWallLat==="function")return sceneWallLat(f,sign);if(!g||!g.gravel)return null;const M=g.M;const i=Math.round(fr(f)*M)%M;for(const gr of g.gravel){if(gr.o!==sign||!gr.wl)continue;const k=((i-gr.i0)%M+M)%M;if(k<gr.wl.length)return gr.wl[k]}return null}
function trackPos(f,lat){const g=TRACKGEO,M=g.M;f=fr(f);const x=f*M,i=Math.floor(x)%M,k=x-Math.floor(x),a=g.path[i],j=(i+1)%M,b=g.path[j];
  const h=lerpAng(g.heading[i],g.heading[j],k);const p={x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,h};if(lat){p.x+=-Math.sin(h)*lat;p.y+=Math.cos(h)*lat}return p}
function pitPos(f){return pitPosRaw(TRACKGEO.pit,f)}
function teamIdx(t){return Math.max(0,G.teams.findIndex(x=>x.id===t.id))}
function lineAt(f){const g=TRACKGEO,M=g.M,x=fr(f)*M,i=Math.floor(x)%M,k=x-Math.floor(x);return g.line[i]+(g.line[(i+1)%M]-g.line[i])*k}
function carWorld(c){// onde o carro está no mundo
  const g=TRACKGEO;
  if(c.pit){const PL=R.pitLane;const p=pitPos(clamp(c.pit.s/PL.D,0,1));c._stopped=c.pit.phase==="stop";c._lat=g.side*g.PIN;c._yaw=0;return p}
  c._stopped=false;
  // posição lateral vem da simulação (cada piloto escolhe sua linha); o carro aponta para onde está indo
  let lat=(c.y!=null?c.y*WS:lineAt(c.prog)),ang=Math.atan2(c.vy||0,Math.max(6,c.v||0));
  ang+=c.yaw||0;
  if(c.vis&&!c.ex){const k=c.vis.t/c.vis.dur;if(c.vis.type==="spin"){ang+=c.vis.dir*Math.min(1,k*1.3)*Math.PI*2.2;lat+=c.vis.dir*5*WS*Math.sin(Math.min(1,k)*Math.PI)}else if(c.vis.type==="slide"){ang+=c.vis.dir*.42*Math.sin(Math.min(1,k)*Math.PI*3)*(1-k)}else if(c.vis.type==="off")lat+=c.vis.dir*14*WS*Math.sin(Math.min(1,k)*Math.PI);else if(c.vis.type==="wide")lat+=c.vis.dir*4.5*WS*Math.sin(Math.min(1,k)*Math.PI)}
  const p=trackPos(c.prog,lat);p.h+=ang;return p}
function scWorld(){if(R.scP==null)return null;const PL=R.pitLane;const f=fr(R.scP);
  if(R.sc&&R.sc.ending){const s=((f-PL.fe)+1)%1*R.geo.len;if(s<PL.D)return pitPos(s/PL.D)}
  return trackPos(R.scP,0)}

// ---------- câmera
const CAM={x:0,y:0,z:1,init:0,userZ:1,sx:0,sy:0,shake:0,flash:0,cut:0};
function iso(x,y,z){return[(x-y)*ISO_C,(x+y)*ISO_S-(z||0)]}
function toScreen(x,y,z,cw,ch){const[a,b]=iso(x,y,z);return[(a-CAM.x)*CAM.z+cw/2+CAM.sx,(b-CAM.y)*CAM.z+ch/2+CAM.sy]}
function fitCamera(cw,ch){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;TRACKGEO.path.forEach(p=>{const[a,b]=iso(p.x,p.y);x0=Math.min(x0,a);x1=Math.max(x1,a);y0=Math.min(y0,b);y1=Math.max(y1,b)});
  CAM.fitZ=Math.min(cw/(x1-x0+160*U),ch/(y1-y0+160*U));CAM.fx=(x0+x1)/2;CAM.fy=(y0+y1)/2}
// move a câmera até o alvo (coordenadas isométricas) com suavização por tempo; corte = troca instantânea
function camTo(dt,tx,ty,tz,tauP,tauZ){if(!CAM.init||CAM.cut){if(CAM.init&&CAM.cut)CAM.flash=1;CAM.x=tx;CAM.y=ty;CAM.z=tz;CAM.init=1;CAM.cut=0;return}
  const kp=1-Math.exp(-dt/tauP),kz=1-Math.exp(-dt/tauZ);CAM.x+=(tx-CAM.x)*kp;CAM.y+=(ty-CAM.y)*kp;CAM.z+=(tz-CAM.z)*kz}
function viewMeters(cw){return cw<640?68:92}
// câmera de perseguição: olha à frente do carro, aproxima nas curvas lentas e abre nas retas
function shotChase(dt,cw,ch,c){const p=c._w||carWorld(c);const v=c.v||0;
  const base=Math.min(cw,ch*1.3)/(WS*viewMeters(cw));const zf=1.3-.42*clamp((v-22)/58,0,1);const z=base*zf*CAM.userZ;
  // antecipa a pista à frente, sem deixar o carro sair do terço central da tela
  const la=Math.min(clamp(v*.45,3,34)*WS,Math.min(cw,ch)*.2/z);const ax=p.x+Math.cos(p.h)*la,ay=p.y+Math.sin(p.h)*la;const[tx,ty]=iso(ax,ay);
  camTo(dt,tx,ty,z,.1,1.1)}
// câmeras de TV na beira da pista: a câmera fica parada e gira acompanhando o carro; corta para a próxima quando o carro passa
const TV={cam:null,subj:null};
function shotTV(dt,cw,ch,c){const g=TRACKGEO,M=g.M;const p=c._w||carWorld(c);const ci=Math.floor(fr(c.prog)*M);
  const ahead=cam=>((cam.i-ci)%M+M)%M;// amostras até a câmera
  if(c.pit){camTo(dt,...iso(p.x,p.y),Math.min(cw,ch*1.3)/(WS*90)*CAM.userZ,.12,.8);TV.cam=null;return}
  if(!TV.cam||TV.subj!==c.id||(ahead(TV.cam)>M-18)){let best=null,bd=1e9;for(const cam of g.cams){const d=ahead(cam);if(d>8&&d<bd){bd=d;best=cam}}if(best&&best!==TV.cam){TV.cam=best;TV.subj=c.id;CAM.cut=1}}
  const cam=TV.cam;if(!cam){shotChase(dt,cw,ch,c);return}
  const dist=Math.hypot(cam.x-p.x,cam.y-p.y)/WS;const base=Math.min(cw,ch*1.3)/(WS*viewMeters(cw));const z=base*(1.05+.75*Math.exp(-dist/80))*CAM.userZ;
  // a câmera fica parada e "gira" acompanhando o carro: o enquadramento puxa para o lado da câmera, mas o carro nunca sai da tela
  const[cx,cy]=iso(p.x,p.y),[kx,ky]=iso(cam.x,cam.y);let ox=(kx-cx)*.35,oy=(ky-cy)*.35;const lim=Math.min(cw,ch)*.26/z,m=Math.hypot(ox,oy);if(m>lim){ox*=lim/m;oy*=lim/m}
  camTo(dt,cx+ox,cy+oy,z,.06,.5)}
function shotAll(dt,cw,ch){fitCamera(cw,ch);let tx=CAM.fx,ty=CAM.fy;if(CAM.pan){tx+=CAM.pan.x;ty+=CAM.pan.y}camTo(dt,tx,ty,CAM.fitZ*CAM.userZ,.15,.4)}
// tremida: zebras, freadas fortes e batidas do carro em foco
function camShake(dt,c){let a=0;if(c&&running(c)&&!c.pit){const g=TRACKGEO;const i=Math.floor(fr(c.prog)*g.M)%g.M;if(Math.abs((c.y||0)*WS)>TW-2.2*WS&&g.curv[i]>.07&&c.v>18)a+=1.4;if(c.acc<-28)a+=.9;if(c.vis&&(c.vis.type==="crash"||c.vis.type==="spin"))a+=4}
  CAM.shake+=(a-CAM.shake)*Math.min(1,dt*8);const t=performance.now()/1000;CAM.sx=Math.sin(t*61)*CAM.shake*.8+Math.sin(t*37)*CAM.shake*.5;CAM.sy=Math.cos(t*53)*CAM.shake*.7;CAM.flash=Math.max(0,CAM.flash-dt*4)}
function onScreen(s,cw,ch,m){return s[0]>-m&&s[0]<cw+m&&s[1]>-m&&s[1]<ch+m}
function poly(ctx,pts){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath()}
function pathScreen(ctx,pts,cw,ch,closed,z,mg){ctx.beginPath();const n=pts.length;
  // caminhos longos: só os trechos perto da tela entram no desenho (o resto é ignorado)
  if(n<120){pts.forEach((p,i)=>{const s=toScreen(p.x,p.y,z||0,cw,ch);i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1])});if(closed)ctx.closePath();return}
  const m=mg||Math.max(160,80*WS*CAM.z);const S=new Array(n),V=new Uint8Array(n);let all=1;
  for(let i=0;i<n;i++){const p=pts[i];const q=toScreen(p.x,p.y,z||0,cw,ch);S[i]=q;V[i]=q[0]>-m&&q[0]<cw+m&&q[1]>-m&&q[1]<ch+m?1:0;if(!V[i])all=0}
  if(all){for(let i=0;i<n;i++)i?ctx.lineTo(S[i][0],S[i][1]):ctx.moveTo(S[i][0],S[i][1]);if(closed)ctx.closePath();return}
  const N=closed?n+1:n;let pen=false;for(let k=0;k<N;k++){const i=k%n;const on=V[i]||V[(i+1)%n]&&(closed||i+1<n)||(k>0&&V[(i-1+n)%n]);if(on){pen?ctx.lineTo(S[i][0],S[i][1]):ctx.moveTo(S[i][0],S[i][1]);pen=true}else pen=false}}
function shade(hex,f){if(hex[0]!=="#")return hex;const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;return`rgb(${clamp(Math.round(r*f),0,255)},${clamp(Math.round(g*f),0,255)},${clamp(Math.round(b*f),0,255)})`}
function isoBox(ctx,x,y,w,d,h,ang,cTop,cL,cR,cw,ch){const c=Math.cos(ang),s=Math.sin(ang);const cor=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>({x:x+u*c-v*s,y:y+u*s+v*c}));
  const B=cor.map(p=>toScreen(p.x,p.y,0,cw,ch)),T=cor.map(p=>toScreen(p.x,p.y,h,cw,ch));const cY=(B[0][1]+B[2][1])/2,cX=(B[0][0]+B[2][0])/2;
  for(let i=0;i<4;i++){const j=(i+1)%4;if((B[i][1]+B[j][1])/2<cY)continue;ctx.fillStyle=(B[i][0]+B[j][0])/2<cX?cL:cR;poly(ctx,[B[i],B[j],T[j],T[i]]);ctx.fill()}
  ctx.fillStyle=cTop;poly(ctx,T);ctx.fill();return T}

// ---------- cena
function flagState(f){// bandeira mostrada por um posto de fiscais
  if(R.red)return"red";if(R.sc)return R.sc.type;if(R.finishing&&f<.02)return"chk";
  const y=R.yellows.find(y=>inZone(f,y.a-.02,y.b));if(y)return y.dbl?"dbl":"yellow";if(R.greenT>R.t)return"green";return null}
function drawFlag(ctx,s,col,Z,t,col2){const w=Math.max(6,8*Z),h=Math.max(4,5*Z),wave=Math.sin(t*10)*2;ctx.strokeStyle="#222";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(s[0],s[1]);ctx.lineTo(s[0],s[1]-h*3);ctx.stroke();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(s[0],s[1]-h*3);ctx.quadraticCurveTo(s[0]+w/2,s[1]-h*3+wave,s[0]+w,s[1]-h*3);ctx.lineTo(s[0]+w,s[1]-h*2);ctx.quadraticCurveTo(s[0]+w/2,s[1]-h*2+wave,s[0],s[1]-h*2);ctx.closePath();ctx.fill();
  if(col2==="chk"){ctx.fillStyle="#111";for(let a=0;a<3;a++)for(let b=0;b<2;b++)if((a+b)%2)ctx.fillRect(s[0]+a*w/3,s[1]-h*3+b*h/2+wave*.3,w/3,h/2)}}
function drawScene(ctx,cw,ch,opts){opts=opts||{};const g=TRACKGEO,Z=CAM.z,wet=R.w,street=R.C.street,T=opts.T??R.t,now=performance.now()/1000;const detail=Z>.3;const RS=opts.S?Object.fromEntries(opts.S.cars.map(c=>[c.id,c])):null;const night=!!R.C.night;const WP={};
  if(g.scn)drawGround(ctx,cw,ch,detail,wet,night);else{ctx.fillStyle="#3C7440";ctx.fillRect(0,0,cw,ch)}
  ctx.lineJoin="round";ctx.lineCap="round";
  // brita e muros
  g.gravel.forEach(gr=>{const s0=toScreen(g.path[gr.i].x,g.path[gr.i].y,0,cw,ch);if(!onScreen(s0,cw,ch,150*U*Z+60))return;
    poly(ctx,gr.pts.map(p=>toScreen(p.x,p.y,0,cw,ch)));ctx.fillStyle=gr.asphalt?"#5D6874":(wet>.3?"#A8986C":"#D9C590");ctx.fill();if(!gr.asphalt&&detail&&typeof gravelPattern==="function"){const gp=gravelPattern(ctx,cw,ch);if(gp){ctx.fillStyle=gp;ctx.globalAlpha=wet>.3?.6:1;ctx.fill();ctx.globalAlpha=1}}
    if(detail){pathScreen(ctx,gr.wall,cw,ch,false);
      if(street){}
      else{ctx.strokeStyle="#1D1D1D";ctx.lineWidth=Math.max(2.5,7.5*U*Z);ctx.stroke();ctx.strokeStyle="#C62828";ctx.lineWidth=Math.max(1.5,3.6*U*Z);ctx.setLineDash([6*U*Z,6*U*Z]);ctx.stroke();ctx.strokeStyle="#EEE";ctx.lineDashOffset=6*U*Z;ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0}}});// barreira de pneus com a cinta vermelha e branca
  // pit lane e reta
  pathScreen(ctx,g.pit,cw,ch,false);ctx.strokeStyle="#5A6068";ctx.lineWidth=30*U*Z;ctx.stroke();
  if(detail){pathScreen(ctx,g.pit,cw,ch,false);ctx.strokeStyle="#FFFFFF55";ctx.lineWidth=1;ctx.setLineDash([8*Z,8*Z]);ctx.stroke();ctx.setLineDash([])}
  // pista
  pathScreen(ctx,g.path,cw,ch,true);ctx.strokeStyle=street?"#9AA1A9":"#2E7D32";ctx.lineWidth=(TW*2+10*U)*Z;ctx.stroke();
  pathScreen(ctx,g.path,cw,ch,true);ctx.strokeStyle="#F4F4F4";ctx.lineWidth=(TW*2+3*U)*Z;ctx.stroke();
  pathScreen(ctx,g.path,cw,ch,true);{const tp=detail&&typeof trackPattern==="function"?trackPattern(ctx,cw,ch):null;ctx.strokeStyle=tp||"#3A3F46";ctx.lineWidth=TW*2*Z;ctx.stroke();if(wet>.25){ctx.strokeStyle="rgba(20,24,30,.35)";ctx.stroke()}}
  if(g.scn&&typeof drawBarriers==="function")drawBarriers(ctx,cw,ch,street);
  if(detail){if(!g.rpath)g.rpath=Array.from({length:g.M},(_,i)=>{const p=trackPos(i/g.M,g.line[i]);return{x:p.x,y:p.y}});
    const dry=R.drying||0;pathScreen(ctx,g.rpath,cw,ch,true);
    if(dry>.12&&wet>.05){ctx.strokeStyle=`rgba(74,79,88,${.3+dry*.55})`;ctx.lineWidth=TW*.8*Z;ctx.stroke()}// linha secando: o traçado seca antes
    else if(wet>.25){ctx.strokeStyle=`rgba(150,185,235,${.08+(wet-.25)*.3})`;ctx.lineWidth=TW*.7*Z;ctx.stroke()}
    else{ctx.strokeStyle=`rgba(0,0,0,${.1+(R.rubber||0)*.14})`;ctx.lineWidth=TW*.6*Z;ctx.stroke()}// borracha no traçado
    // poças d'água
    const dep=R.puddles&&typeof rainDepth==="function"?rainDepth():0;if(dep>.05)for(const p of R.puddles){const L=R.geo.len,f0=p.f,f1=p.f+p.len/L,pts=[];
      for(let u=0;u<=6;u++){const ff=f0+(f1-f0)*u/6,hw=p.w/2*Math.sin(Math.PI*(.08+.84*u/6));pts.push(toScreen(...Object.values(trackPos(ff,(p.lat+hw)*WS)).slice(0,2),0,cw,ch))}
      for(let u=6;u>=0;u--){const ff=f0+(f1-f0)*u/6,hw=p.w/2*Math.sin(Math.PI*(.08+.84*u/6));pts.push(toScreen(...Object.values(trackPos(ff,(p.lat-hw)*WS)).slice(0,2),0,cw,ch))}
      if(!onScreen(pts[3],cw,ch,200))continue;poly(ctx,pts);ctx.fillStyle=`rgba(95,135,190,${.28+dep*.32})`;ctx.fill();ctx.strokeStyle=`rgba(210,230,255,${.15+dep*.2})`;ctx.lineWidth=1;ctx.stroke()}}
  // zebras
  if(detail&&g.scn)drawKerbs(ctx,cw,ch,street);
  // DRS e setores
  g.drs.forEach(([a,b])=>{const n=a<b?b-a:b+1-a;const pts=[];for(let k=0;k<=40;k++)pts.push(trackPos(a+n*k/40,-(TW-3*U)));pathScreen(ctx,pts,cw,ch,false);ctx.strokeStyle="#2ECC71";ctx.lineWidth=Math.max(1.5,2.4*U*Z);ctx.setLineDash([10*U*Z,8*U*Z]);ctx.stroke();ctx.setLineDash([]);
    if(detail){const s=toScreen(...Object.values(trackPos(a,-(TW+12*U))).slice(0,2),8*U,cw,ch);ctx.fillStyle="#2ECC71";ctx.fillRect(s[0]-15,s[1]-7,30,12);ctx.fillStyle="#08130A";ctx.font="700 9px 'Roboto Mono',monospace";ctx.textAlign="center";ctx.fillText("AERO",s[0],s[1]+2)}});
  [[1/3,"#FFD400","S1"],[2/3,"#B65CFF","S2"]].forEach(([f,c])=>{const a=trackPos(f,-TW),b=trackPos(f,TW);const A=toScreen(a.x,a.y,0,cw,ch),B=toScreen(b.x,b.y,0,cw,ch);ctx.strokeStyle=c;ctx.lineWidth=Math.max(1,2*U*Z);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke()});
  // amarelas sobre a pista
  R.yellows.forEach(y=>{const n=(y.b-y.a+1)%1;const pts=[];for(let k=0;k<=12;k++)pts.push(trackPos(y.a+n*k/12,0));pathScreen(ctx,pts,cw,ch,false);ctx.strokeStyle=`rgba(255,212,0,${.18+.12*Math.sin(now*6)})`;ctx.lineWidth=TW*2.2*Z;ctx.stroke()});
  // largada xadrez e grid
  {const p=g.path[0],h=g.heading[0];for(let k=-8;k<8;k++)for(let r=0;r<2;r++){const lat=(k*2.1+1)*U,lo=(r*2.6-2.6)*U;const x=p.x-Math.sin(h)*lat+Math.cos(h)*lo,y=p.y+Math.cos(h)*lat+Math.sin(h)*lo;const s=toScreen(x,y,0,cw,ch);ctx.fillStyle=(k+r)%2?"#111":"#FFF";ctx.fillRect(s[0]-1.6*U*Z,s[1]-1.1*U*Z,3.2*U*Z,2.2*U*Z)}
    if(detail){const gl=g.geo.len;ctx.strokeStyle="#FFFFFFAA";ctx.lineWidth=Math.max(1,.5*WS*Z);for(let k=0;k<22;k++){const f=-(k*8+4-2.6)/gl,lat=(k%2?-2.6:2.6)*WS;const a=trackPos(f,lat-1.4*WS),b=trackPos(f,lat+1.4*WS);const A=toScreen(a.x,a.y,0,cw,ch),B=toScreen(b.x,b.y,0,cw,ch);if(onScreen(A,cw,ch,10)){ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke()}}}}
  // números das curvas
  if(detail)g.corners.forEach(c=>{const q=trackPos(c.i/g.M,c.dir*(TW+44*U));const s=toScreen(q.x,q.y,0,cw,ch);if(!onScreen(s,cw,ch,20))return;ctx.font="700 10px 'Titillium Web',sans-serif";ctx.textAlign="center";const tw=ctx.measureText(c.n).width+10;ctx.fillStyle="#0E1116D0";ctx.fillRect(s[0]-tw/2,s[1]-8,tw,15);ctx.fillStyle="#FFF";ctx.fillText(c.n,s[0],s[1]+3)});
  // efeitos no chão
  const life=e=>e.type==="skid"?900:e.type==="debris"?60:e.type==="smoke"?40:e.type==="sparks"?1.8:e.type==="parts"?7:e.type==="puff"?1.6:e.type==="tyres"?40:4;if(!RS)R.fxq=R.fxq.filter(e=>T-e.t0<life(e));
  R.fxq.forEach(e=>{if(e.t0>T||T-e.t0>life(e))return;const q=trackPos(e.f,(e.lat||0)*WS);const s=toScreen(q.x,q.y,0,cw,ch);if(!onScreen(s,cw,ch,60*U))return;const age=T-e.t0;
    if(e.type==="skid"){ctx.strokeStyle="rgba(15,15,15,.55)";ctx.lineWidth=Math.max(1,.8*WS*Z);for(const o of[-1.3,1.3]){const pts=[];for(let k=0;k<10;k++){const a=k/9*e.turn;pts.push(trackPos(e.f-24/g.geo.len+k*5/g.geo.len,((e.lat||0)+o+Math.sin(a)*6)*WS))}pathScreen(ctx,pts,cw,ch,false);ctx.stroke()}return}
    if(e.type==="sparks"){const k=age/1.8;for(let j=0;j<16;j++){const a=j*2.39+e.t0,r=(4+k*30*(.5+((j*7)%5)/5))*U*Z;ctx.strokeStyle=`rgba(255,${180+((j*37)%70)},60,${1-k})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(s[0]+Math.cos(a)*r*.6,s[1]-4*Z+Math.sin(a)*r*.35);ctx.lineTo(s[0]+Math.cos(a)*r,s[1]-4*Z+Math.sin(a)*r*.55-k*6*Z);ctx.stroke()}return}
    if(e.type==="parts"){// pedaços de asa voando e caindo na pista
      for(let j=0;j<8;j++){const a=j*2.13+e.t0*7,sp=(7+(j%3)*4)*WS,tt=Math.min(age,1.4),d=sp*tt,z=Math.max(0,(7*tt-4.9*tt*tt))*WS*.8;
        const px=q.x+Math.cos(a)*d,py=q.y+Math.sin(a)*d;const p=toScreen(px,py,z,cw,ch);const sh=toScreen(px,py,0,cw,ch);const r=(1.6+(j%2))*U*Z,rot=age*(6+j)*(j%2?1:-1);
        if(z>0){ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(sh[0],sh[1],r,r*.5,0,0,7);ctx.fill()}
        ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(age<1.4?rot:j);ctx.fillStyle=j%3?e.col:e.col2||"#222";ctx.fillRect(-r*1.6,-r*.5,r*3.2,r);ctx.restore()}return}
    if(e.type==="tyres"){const wl=wallLatAt(e.f,Math.sign(e.lat)||1);const q2=wl!=null?trackPos(e.f,(Math.sign(e.lat)||1)*(wl-.6*WS)):q;q.x=q2.x;q.y=q2.y;for(let j=0;j<7;j++){const a=j*2.4+e.t0,tt=Math.min(age,1.1),d=(4+(j%3)*3)*WS*tt,z=Math.max(0,(5*tt-4.9*tt*tt))*WS*.7;const p=toScreen(q.x+Math.cos(a)*d,q.y+Math.sin(a)*d,z,cw,ch);ctx.fillStyle="#141414";ctx.beginPath();ctx.ellipse(p[0],p[1],2.6*U*Z,1.6*U*Z,a,0,7);ctx.fill();ctx.strokeStyle="#555";ctx.lineWidth=.6;ctx.stroke()}return}
    if(e.type==="puff"){const k=age/1.6;for(let j=0;j<5;j++){const p=toScreen(q.x+Math.cos(j*1.3)*k*4*WS,q.y+Math.sin(j*1.3)*k*4*WS,(1+k*3)*WS,cw,ch);ctx.fillStyle=`rgba(235,235,235,${.45*(1-k)})`;ctx.beginPath();ctx.arc(p[0],p[1],(2+k*7)*U*Z,0,7);ctx.fill()}return}
    if(e.type==="debris"){ctx.fillStyle="#151515";for(let k=0;k<14;k++){const a=k*2.4,r=(6+k*2.3)*U*Z;ctx.fillRect(s[0]+Math.cos(a)*r,s[1]+Math.sin(a)*r*.5,2.2*U*Z,1.3*U*Z)}}
    else if(e.type==="dust"){ctx.fillStyle=`rgba(217,197,144,${Math.max(0,.6-age/6)})`;ctx.beginPath();ctx.ellipse(s[0],s[1]-4*U*Z,(14+age*10)*U*Z,(7+age*5)*U*Z,0,0,7);ctx.fill()}});
  // objetos com profundidade
  const items=[],occl=[];// occl: acidentes que não podem ficar escondidos atrás de arquibancadas
  // destroços na pista
  if(detail&&R.debris&&R.debris.length){const L=R.geo.len;for(const d of R.debris){const p=trackPos(d.fs/L,d.y*WS);const q=toScreen(p.x,p.y,0,cw,ch);if(!onScreen(q,cw,ch,20))continue;const z=WS*Z;
      for(let k=0;k<3;k++){const a=(d.fs*7+k*2.1)%6.28;ctx.fillStyle=k===0?d.col:k===1?d.col2:"#1A1A1A";ctx.save();ctx.translate(q[0]+Math.cos(a)*1.4*z,q[1]+Math.sin(a)*.7*z);ctx.rotate(a);ctx.fillRect(-.9*z,-.35*z,1.8*z,.7*z);ctx.restore()}}}
  const post=[],spost=[];if(g.scn)sceneItems(items,spost,ctx,cw,ch,night,now,detail);
  if(detail){
    g.stands.forEach(st=>{const s=toScreen(st.x,st.y,0,cw,ch);if(!onScreen(s,cw,ch,130*U*Z+20))return;const ex=crowdExc(st.f,T);items.push({d:st.x+st.y,draw:()=>{
      const fade=occl.some(o=>o.d<st.x+st.y&&Math.hypot(o.x-s[0],(o.y-s[1])*1.5)<st.w*Z*.8+34);if(fade)ctx.globalAlpha=.3;// arquibancada fica transparente quando esconde um acidente
      const o=st.o||1,nx=-Math.sin(st.h)*o,ny=Math.cos(st.h)*o,tiers=[0,1,2].map(k=>({k,x:st.x+nx*(k-1)*8*U,y:st.y+ny*(k-1)*8*U})).sort((a,b)=>(a.x+a.y)-(b.x+b.y));
      const tops=[];for(const t of tiers){tops[t.k]=isoBox(ctx,t.x,t.y,st.w,8.4*U,(7+t.k*6)*U,st.h,t.k%2?"#C5CCD5":"#AEB6C0","#646C77","#838C97",cw,ch)}
      const n=Z>.9?18:10,sz=1.6*U*Z+.5;for(let r=0;r<3;r++){const T2=tops[r];for(let k=0;k<n;k++){const u=(k+.5)/n,a=T2[0],b=T2[1],c2=T2[3];const vv=((k*7+r*3)%10)/10*.8+.1;const x=a[0]+(b[0]-a[0])*u+(c2[0]-a[0])*vv;let y=a[1]+(b[1]-a[1])*u+(c2[1]-a[1])*vv;
        const ph=now*(9+(k%5))+k*1.7+r+(st.seed||0);y-=Math.max(0,Math.sin(ph))*ex*3.2*U*Z+Math.sin(ph*.3)*.25*U*Z;ctx.fillStyle=["#E53935","#FFD54F","#42A5F5","#FFFFFF","#66BB6A","#FF8A00"][(k+r)%6];ctx.fillRect(x,y-2*U*Z,sz,sz);
        if(ex>.3&&k%5===0){const fl=Math.sin(now*14+k)*2.2*U*Z;ctx.fillStyle=["#21C55D","#FFD400","#E10600","#3A86FF"][(k+r)%4];ctx.fillRect(x+sz*.4,y-2*U*Z-5*U*Z,3.4*U*Z+fl*.3,2.2*U*Z)}}}
      {const c=Math.cos(st.h),s2=Math.sin(st.h);const rp=[[-st.w/2,4],[st.w/2,4],[st.w/2,16],[-st.w/2,16]].map(([u,v])=>toScreen(st.x+u*c-v*U*s2*o,st.y+u*s2+v*U*c*o,30*U,cw,ch));ctx.fillStyle="rgba(235,239,243,.9)";poly(ctx,rp);ctx.fill();ctx.strokeStyle="#7E8792";ctx.lineWidth=1;ctx.stroke();
        for(const u of[-st.w/2+4*U,st.w/2-4*U]){const A=toScreen(st.x+u*c-14*U*s2*o,st.y+u*s2+14*U*c*o,0,cw,ch),B=toScreen(st.x+u*c-14*U*s2*o,st.y+u*s2+14*U*c*o,30*U,cw,ch);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke()}}
      ctx.globalAlpha=1}})});
    g.boards.forEach(b=>{const s=toScreen(b.x,b.y,0,cw,ch);if(!onScreen(s,cw,ch,40*U))return;items.push({d:b.x+b.y,draw:()=>isoBox(ctx,b.x,b.y,22*U,2*U,5*U,b.h,b.c,shade(b.c,.6),shade(b.c,.8),cw,ch)})});
    g.garages.forEach((ga,i)=>{const t=G.teams[i];const s=toScreen(ga.x,ga.y,0,cw,ch);if(!onScreen(s,cw,ch,80*U))return;items.push({d:ga.x+ga.y,draw:()=>{isoBox(ctx,ga.x,ga.y,26*U,16*U,14*U,ga.h,t?t.c:"#888",shade(t?t.c:"#888888",.5),shade(t?t.c:"#888888",.72),cw,ch)}})});
    g.posts.forEach(p=>{const s=toScreen(p.x,p.y,0,cw,ch);if(!onScreen(s,cw,ch,40*U))return;items.push({d:p.x+p.y,draw:()=>{{const Tp=isoBox(ctx,p.x,p.y,7*U,7*U,7*U,0,"#F57C00","#AEB5BE","#D3D8DE",cw,ch);ctx.fillStyle="#F57C00";poly(ctx,Tp);ctx.fill();ctx.strokeStyle="#8A4400";ctx.lineWidth=1;ctx.stroke()}const fs=flagState(p.f);const top=toScreen(p.x,p.y,10*U,cw,ch);
      if(fs==="red")drawFlag(ctx,top,"#E10600",Z,now);else if(fs==="yellow")drawFlag(ctx,top,"#FFD400",Z,now);else if(fs==="dbl"){drawFlag(ctx,top,"#FFD400",Z,now);drawFlag(ctx,[top[0]-8*Z,top[1]],"#FFD400",Z,now+.3)}
      else if(fs==="sc"||fs==="vsc"){drawFlag(ctx,top,"#FFD400",Z,now);ctx.fillStyle="#111";ctx.fillRect(top[0]-12*Z-8,top[1]-14,16,9);ctx.fillStyle="#FFD400";ctx.font="700 7px 'Roboto Mono',monospace";ctx.textAlign="center";ctx.fillText(fs==="sc"?"SC":"VSC",top[0]-12*Z,top[1]-7)}
      else if(fs==="green")drawFlag(ctx,top,"#21C55D",Z,now);else if(fs==="chk")drawFlag(ctx,top,"#FFF",Z,now,"chk")}})});
    // pórtico de largada
    {const a=trackPos(0,-(TW+6*U)),b=trackPos(0,TW+6*U);items.push({d:(a.x+b.x)/2+(a.y+b.y)/2+30*U,draw:()=>{const A0=toScreen(a.x,a.y,0,cw,ch),A1=toScreen(a.x,a.y,34*U,cw,ch),B0=toScreen(b.x,b.y,0,cw,ch),B1=toScreen(b.x,b.y,34*U,cw,ch);
      ctx.strokeStyle="#2B2F36";ctx.lineWidth=Math.max(2,3*U*Z);ctx.beginPath();ctx.moveTo(A0[0],A0[1]);ctx.lineTo(A1[0],A1[1]);ctx.lineTo(B1[0],B1[1]);ctx.lineTo(B0[0],B0[1]);ctx.stroke();
      const lit=!RS&&!R.started&&R.form&&R.form.phase==="lights"&&R.lightsStart!=null?Math.min(5,Math.max(0,Math.floor(R.t-R.lightsStart)+1)):0;for(let k=0;k<5;k++){const u=.3+k*.1;const x=A1[0]+(B1[0]-A1[0])*u,y=A1[1]+(B1[1]-A1[1])*u;ctx.fillStyle=k<lit?"#FF1A1A":"#3A0000";ctx.beginPath();ctx.arc(x,y+3,Math.max(2,3*U*Z),0,7);ctx.fill();if(k<lit){ctx.fillStyle="rgba(255,40,40,.3)";ctx.beginPath();ctx.arc(x,y+3,Math.max(4,7*U*Z),0,7);ctx.fill()}}}})}
  }
  // carros
  const lead=R.order.find(c=>c.status==="run"&&!c.pit&&!c.parked);
  R.cars.forEach(c=>{let p;if(RS){const r=RS[c.id];if(!r||!r.vis)return;p={x:r.x,y:r.y,h:r.h};c._brake=false}else{if(c.status==="dnf"||c.status==="dsq")return;if(c.status==="fin"&&R.over)return;p=carWorld(c);c._w=p;c._brake=running(c)&&!c.pit&&!c.parked&&(c.acc||0)<-6&&R.started}WP[c.id]=p;if(!RS&&detail&&wet>.28&&(c.v||0)>22&&!c.pit)items.push({d:p.x+p.y-1,draw:()=>drawSpray(ctx,cw,ch,p,c.v,wet)});
    if(!RS&&detail&&!c.pit){const dm=c.dmg||{};const v=c.v||0;const ix=Math.floor(fr(c.prog)*g.M)%g.M;
      const spark=(dm.wing>=.5||dm.floor>.5||(dm.susp||0)>.6||(c.tyre&&c.tyre.punct))&&v>25&&Math.random()<.7||(v>76&&g.geo.ai&&g.geo.ai.ph[Math.floor(fr(c.prog)*g.geo.N)%g.geo.N]===0&&Math.random()<.035);
      if(spark)items.push({d:p.x+p.y+.6,draw:()=>drawSparks(ctx,cw,ch,p,v)});
      if(c.smokeT&&c.smokeT>R.t)items.push({d:p.x+p.y-1.5,draw:()=>drawSmokeTrail(ctx,cw,ch,p,R.t)})}items.push({d:p.x+p.y+.5,draw:()=>drawCar(ctx,cw,ch,c,p,detail,opts)})});
  if(!RS&&typeof carFxAll==="function")carFxAll(items,ctx,cw,ch,WP,detail);
  // carcaças, fiscais e guindaste
  R.wrecks.forEach(w=>{if(RS?(T<w.t0||T>=w.removeAt):w.removed)return;const age=T-w.t0,dur=w.removeAt-w.t0;const sk=clamp(age/(w.slide||.01),0,1),se=1-(1-sk)*(1-sk);const f0=w.f0??w.f,l0=w.lat0??w.lat;
    if(w._lw==null){const wl=w.kind==="crash"?wallLatAt(w.f,Math.sign(w.lat)||1):null;w._lw=wl!=null?Math.sign(w.lat||1)*Math.max(TW/WS+2,wl/WS-1.4):w.lat}// a batida termina encostada na barreira
    const base=trackPos(f0+(w.f-f0)*se,(l0+(w._lw-l0)*se)*WS);let lift=0,dx=0;
    const truckIn=Math.min(1,Math.max(0,(age-dur*.25)/(dur*.25)));const liftK=Math.max(0,(age-dur*.6)/(dur*.4));lift=Math.min(1,liftK)*24*U;
    const s=toScreen(base.x,base.y,0,cw,ch);if(!onScreen(s,cw,ch,200*U*Z+40))return;if(age<25)occl.push({x:s[0],y:s[1],d:base.x+base.y});
    items.push({d:base.x+base.y,draw:()=>{drawCar(ctx,cw,ch,w.real&&w.c?w.c:{col:w.col,col2:w.col2,wreck:true,code:w.code},{x:base.x,y:base.y,h:w.ang+(w.spin||0)*(1-se)},detail,{z:lift});
      if(w.fire&&age>w.slide&&age<18)post.push(()=>{if(age<16)drawFire(ctx,cw,ch,base,age,Z,now);if(age>5)drawExt(ctx,cw,ch,base,age,Z,now)});if(w.kind==="beach"&&age<4){ctx.fillStyle=`rgba(217,197,144,${.5*(1-age/4)})`;const q=toScreen(base.x,base.y,4*U,cw,ch);ctx.beginPath();ctx.ellipse(q[0],q[1],(12+age*6)*U*Z,(6+age*3)*U*Z,0,0,7);ctx.fill()}
      if(age<dur*.9){for(let k=0;k<5;k++){const a=(age*1.3+k*1.7)%3;const q=toScreen(base.x,base.y,(8+a*14)*U,cw,ch);ctx.fillStyle=`rgba(90,90,90,${.35*(1-a/3)})`;ctx.beginPath();ctx.arc(q[0]+Math.sin(k+age)*6*U*Z,q[1],(4+a*5)*U*Z,0,7);ctx.fill()}}
      if(age>6&&detail){const m=U*Z;for(let k=0;k<3;k++){const q=toScreen(base.x+Math.cos(k*2.1)*16*U,base.y+Math.sin(k*2.1)*16*U,0,cw,ch);ctx.fillStyle="#FF8F00";ctx.fillRect(q[0]-1.5*m,q[1]-6*m,3*m,6*m);ctx.fillStyle="#F1C9A5";ctx.beginPath();ctx.arc(q[0],q[1]-7.5*m,1.6*m,0,7);ctx.fill()}}
      if(truckIn>0){const o=Math.sign(w.lat)||1;const tp=trackPos(w.f-150/g.geo.len*(1-truckIn),((w._lw??w.lat)+o*9)*WS);const T3=isoBox(ctx,tp.x,tp.y,26*U,12*U,10*U,tp.h,"#F9A825","#B07400","#D18E00",cw,ch);
        const arm=toScreen(base.x,base.y,30*U+lift,cw,ch),top=toScreen(tp.x,tp.y,34*U,cw,ch);ctx.strokeStyle="#333";ctx.lineWidth=Math.max(1.5,2.5*U*Z);ctx.beginPath();ctx.moveTo(T3[0][0],T3[0][1]);ctx.lineTo(top[0],top[1]);ctx.lineTo(arm[0],arm[1]);ctx.stroke();
        const car=toScreen(base.x,base.y,lift+6*U,cw,ch);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(arm[0],arm[1]);ctx.lineTo(car[0],car[1]);ctx.stroke()}}})});
  // safety car
  const scOn=RS?!!opts.S.sc:(R.sc&&R.sc.type==="sc"&&R.scP!=null);if(scOn){let p;if(RS)p=opts.S.sc;else p=scWorld();
    items.push({d:p.x+p.y,draw:()=>{drawCar(ctx,cw,ch,{col:"#F2A900",col2:"#1B1B1B",sc:true,code:"SC"},p,detail,{});const s=toScreen(p.x,p.y,11*U,cw,ch);if(RS||!R.sc.ending){ctx.fillStyle=Math.floor(now*4)%2?"#FF9800":"#FFEB3B";ctx.fillRect(s[0]-5,s[1]-2,10,3)}
      ctx.font="700 11px 'Titillium Web',sans-serif";ctx.textAlign="center";const lab="SAFETY CAR";const tw=ctx.measureText(lab).width+8;ctx.fillStyle="#F2A900";ctx.fillRect(s[0]-tw/2,s[1]-22,tw,14);ctx.fillStyle="#111";ctx.fillText(lab,s[0],s[1]-11)}})}
  items.sort((a,b)=>a.d-b.d).forEach(i=>i.draw());post.forEach(f=>f());// fogo e extintores por cima de tudo
  if(night){ctx.fillStyle="rgba(6,10,30,.5)";ctx.fillRect(0,0,cw,ch);ctx.save();ctx.globalCompositeOperation="lighter";for(let i=0;i<g.M;i+=24){const q=trackPos(i/g.M,0);const s=toScreen(q.x,q.y,0,cw,ch);if(!onScreen(s,cw,ch,80*U*Z))continue;const r=60*U*Z;const gr=ctx.createRadialGradient(s[0],s[1],0,s[0],s[1],r);gr.addColorStop(0,"rgba(255,236,190,.22)");gr.addColorStop(1,"rgba(255,236,190,0)");ctx.fillStyle=gr;ctx.beginPath();ctx.arc(s[0],s[1],r,0,7);ctx.fill()}
    ctx.restore()}
  spost.forEach(f=>f());if(night&&g.scn&&g.scn.nl){ctx.fillStyle="rgba(255,214,140,.85)";for(const q of g.scn.nl)ctx.fillRect(q[0]-1,q[1]-1,2,2);g.scn.nl.length=0}
  // etiquetas por cima
  const placed=[];const labs=R.cars.filter(c=>WP[c.id]).map(c=>{const s=toScreen(WP[c.id].x,WP[c.id].y,12*CSC,cw,ch);return{c,s}}).sort((a,b)=>(b.c.isP?1:0)-(a.c.isP?1:0)||b.s[1]-a.s[1]);
  const HC=hudCfgR(),lm=HC.labels;const meC=R.cars.find(x=>x.isP),mp=meC?pos(meC):0;const LP={};
  labs.forEach(({c,s})=>{const p=pos(c);const show=c.isP||c.hum||(lm==="all"&&detail&&Z>.5)||(lm==="near"&&detail&&Z>.42&&(Math.abs(p-mp)<=3||p===1));if(!show)return;
    if(!onScreen(s,cw,ch,30))return;const lab=RS?c.code:`P${p} ${c.code}`;ctx.font=`700 ${c.isP?12:10.5}px "Titillium Web",sans-serif`;ctx.textAlign="center";const tw=ctx.measureText(lab).width+10;
    s=[s[0],s[1]];for(let k=0;k<4;k++){const hit=placed.find(q=>Math.abs(q[0]-s[0])<(q[2]+tw)/2&&Math.abs(q[1]-s[1])<16);if(!hit)break;s[1]=hit[1]-17}placed.push([s[0],s[1],tw]);LP[c.id]=[s[0],s[1]-14];
    const hu=c.hum&&!c.isP;ctx.fillStyle=c.isP?"#FFFFFF":hu?"#FFD400":"rgba(12,14,18,.82)";ctx.fillRect(s[0]-tw/2,s[1]-14,tw,15);ctx.fillStyle=c.col;ctx.fillRect(s[0]-tw/2,s[1]-14,3,15);ctx.fillStyle=c.isP||hu?"#0A0C10":"#FFF";ctx.fillText(lab,s[0]+1,s[1]-3);
    if(c.blue&&detail)drawFlag(ctx,[s[0]+tw/2+3,s[1]+2],"#1E88E5",Z,now);
    if(c.vis&&c.vis.type==="spin"){ctx.fillStyle="#FFD400";ctx.font="700 10px 'Titillium Web',sans-serif";ctx.fillText("RODOU!",s[0],s[1]-18)}
    if(c._stopped){ctx.fillStyle="#FFD400";ctx.font="700 10px 'Titillium Web',sans-serif";ctx.fillText("PIT STOP",s[0],s[1]-18)}});
  if(HC.bubbles&&R.bubbles&&!RS&&!opts.pip)drawBubbles(ctx,cw,ch,WP,LP);
}
// configuração da tela (lida pelo desenho)
function hudCfgR(){return(typeof G!=="undefined"&&G&&G.settings&&G.settings.hud)||{labels:"near",bubbles:true}}
const BUB_COL={me:["#FFFFFF","#0A0C10","#FFFFFF"],radio:["#0E1116F0","#FFFFFF","#FFD400"],pass:["#0E1116F0","#FFFFFF","#21C55D"],bad:["#0E1116F0","#FFFFFF","#FF4D4F"],pit:["#0E1116F0","#FFFFFF","#FFD400"],order:["#0E1116F0","#FFFFFF","#B65CFF"],"":["#0E1116F0","#FFFFFF","#8C96A3"]};
function wrapText(ctx,t,maxW){const words=t.split(" "),lines=[];let cur="";for(const w of words){const n=cur?cur+" "+w:w;if(ctx.measureText(n).width>maxW&&cur){lines.push(cur);cur=w}else cur=n}if(cur)lines.push(cur);if(lines.length>2){lines.length=2;lines[1]=lines[1].replace(/.?$/,"…")}return lines}
function drawBubbles(ctx,cw,ch,WP,LP){const last={};for(const b of R.bubbles){if(R.t-b.t<b.dur&&R.t>=b.t)last[b.id]=b}
  for(const id in last){const b=last[id],p=WP[id];if(!p)continue;let a=LP[id];if(!a){const s=toScreen(p.x,p.y,12*CSC,cw,ch);a=[s[0],s[1]-14]}if(!onScreen(a,cw,ch,40))continue;
    const al=Math.min(1,(b.t+b.dur-R.t)/.6,(R.t-b.t)/.2+.2);const[bg,fg,ac]=BUB_COL[b.kind]||BUB_COL[""];ctx.save();ctx.globalAlpha=al;ctx.font="600 12px 'Titillium Web',sans-serif";
    const lines=wrapText(ctx,b.text,Math.min(230,cw*.55));const w=Math.max(...lines.map(l=>ctx.measureText(l).width))+16,h=lines.length*15+8;let x=clamp(a[0]-w/2,4,cw-w-4),y=a[1]-h-10;if(y<4)y=4;
    ctx.fillStyle=bg;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,6);else ctx.rect(x,y,w,h);ctx.fill();ctx.fillStyle=ac;ctx.fillRect(x,y+3,3,h-6);
    ctx.fillStyle=bg;ctx.beginPath();const tx=clamp(a[0],x+10,x+w-10);ctx.moveTo(tx-6,y+h-.5);ctx.lineTo(tx+6,y+h-.5);ctx.lineTo(tx,y+h+7);ctx.fill();
    ctx.fillStyle=fg;ctx.textAlign="left";lines.forEach((l,k)=>ctx.fillText(l,x+9,y+15+k*15));ctx.restore()}}
const CSC=.82;function drawCar(ctx,cw,ch,c,p,detail,o){const Z=CAM.z,h=p.h,co=Math.cos(h),si=Math.sin(h),zb=(o&&o.z)||0;
  const pt=(u,v,z)=>{u*=CSC;v*=CSC;return toScreen(p.x+u*co-v*si,p.y+u*si+v*co,z*CSC+zb,cw,ch)};
  if(!detail||Z<.5){const s=pt(0,0,0);ctx.fillStyle=c.col;ctx.strokeStyle=c.isP?"#FFF":"#0A0C10";ctx.lineWidth=c.isP?2:1.2;ctx.beginPath();ctx.arc(s[0],s[1],c.isP?5:3.8,0,7);ctx.fill();ctx.stroke();return}
  const col=c.col,dark=shade(col,.55),c2=c.col2||"#222";
  ctx.fillStyle="rgba(0,0,0,.35)";poly(ctx,[pt(-12,-5.5,-zb),pt(12,-5.5,-zb),pt(12,5.5,-zb),pt(-12,5.5,-zb)]);ctx.fill();
  // rodas
  const wheel=(u,v)=>{ctx.fillStyle="#111";poly(ctx,[pt(u-2,v-1.4,0),pt(u+2,v-1.4,0),pt(u+2,v-1.4,3.2),pt(u-2,v-1.4,3.2)]);ctx.fill();poly(ctx,[pt(u-2,v-1.4,3.2),pt(u+2,v-1.4,3.2),pt(u+2,v+1.4,3.2),pt(u-2,v+1.4,3.2)]);ctx.fill();
    if(c.tyre&&!c.wreck){ctx.strokeStyle=COMP[c.tyre.c].c;ctx.lineWidth=Math.max(.6,.7*Z);ctx.beginPath();const a=pt(u-1.2,v,3.25),b=pt(u+1.2,v,3.25);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}};
  const dm=c.dmg||{},pun=c.tyre&&c.tyre.punct;
  wheel(-7,-4.8);wheel(-7,4.8);if(!c.wreck){if(pun){ctx.fillStyle="#2A1A1A";poly(ctx,[pt(5,-6,0),pt(9,-6,0),pt(9,-3.2,1.6),pt(5,-3.2,1.6)]);ctx.fill()}else wheel(7,-4.6)}wheel(7,4.6);
  // assoalho e sidepods
  ctx.fillStyle=dark;poly(ctx,[pt(-9,-3.6,1),pt(5,-3.6,1),pt(5,-3.6,2.6),pt(-9,-3.6,2.6)]);ctx.fill();
  ctx.fillStyle=col;poly(ctx,[pt(-9,-3.6,2.6),pt(4,-3.8,2.6),pt(5,3.8,2.6),pt(-9,3.6,2.6)]);ctx.fill();
  // bico
  ctx.fillStyle=col;poly(ctx,[pt(4,-1.6,2.6),pt(12,-.6,1.8),pt(12,.6,1.8),pt(4,1.6,2.6)]);ctx.fill();
  // asa dianteira e traseira
  ctx.fillStyle=c2;if(dm.wing>=.5)poly(ctx,[pt(11,-.6,1),pt(12.6,-.6,1),pt(13.4,3.8,.4),pt(11.6,4.2,.4)]);else if(dm.wing>=.2)poly(ctx,[pt(11,-5.4,1),pt(13,-5.4,1),pt(13,2.4,1),pt(11,2.8,1)]);else poly(ctx,[pt(11,-5.4,1),pt(13,-5.4,1),pt(13,5.4,1),pt(11,5.4,1)]);ctx.fill();
  ctx.fillStyle=dark;poly(ctx,[pt(-12,-4.4,3),pt(-12,4.4,3),pt(-12,4.4,dm.rwing>=.5?4.2:6.4),pt(-12,-4.4,6.4)]);ctx.fill();
  ctx.fillStyle=c2;if(dm.rwing>=.5)poly(ctx,[pt(-13,-4.4,6.4),pt(-10.6,-4.4,6.4),pt(-10.2,3.6,4.2),pt(-12.6,3.6,4.2)]);else poly(ctx,[pt(-13,-4.4,6.4),pt(-10.6,-4.4,6.4),pt(-10.6,4.4,6.4),pt(-13,4.4,6.4)]);ctx.fill();
  // cobertura do motor e faixa
  ctx.fillStyle=shade(col,1.15);poly(ctx,[pt(-9,-1.4,4.4),pt(-1,-1.2,4.4),pt(-1,1.2,4.4),pt(-9,1.4,4.4)]);ctx.fill();
  ctx.fillStyle=c2;poly(ctx,[pt(-1,-.5,2.7),pt(10,-.25,2.1),pt(10,.25,2.1),pt(-1,.5,2.7)]);ctx.fill();
  // cockpit, capacete e halo
  ctx.fillStyle="#0B0B0B";poly(ctx,[pt(-1,-1.3,2.8),pt(3,-1.1,2.8),pt(3,1.1,2.8),pt(-1,1.3,2.8)]);ctx.fill();
  if(!c.sc){const hl=pt(.6,0,4.2);ctx.fillStyle=c.wreck?"#555":"#FFD400";ctx.beginPath();ctx.arc(hl[0],hl[1],Math.max(1,1.3*Z),0,7);ctx.fill();
    ctx.strokeStyle="#111";ctx.lineWidth=Math.max(.8,.9*Z);ctx.beginPath();const a=pt(-1,-1.2,3),b=pt(1.5,0,5),d=pt(-1,1.2,3),e=pt(3.6,0,3);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(d[0],d[1]);ctx.moveTo(b[0],b[1]);ctx.lineTo(e[0],e[1]);ctx.stroke()}
  else{ctx.fillStyle="#1B1B1B";poly(ctx,[pt(-4,-3,5),pt(4,-3,5),pt(4,3,5),pt(-4,3,5)]);ctx.fill()}
  if(c._brake&&!c.wreck){ctx.fillStyle="#FF2A2A";[-2.6,2.6].forEach(v=>{const q=pt(-12.6,v,3.2);ctx.fillRect(q[0]-1.3,q[1]-1.3,2.6,2.6)})}
  if(c.isP&&!c.wreck){const s=pt(0,0,0);ctx.strokeStyle="rgba(255,255,255,.85)";ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(s[0],s[1],15*CSC*Z,8*CSC*Z,0,0,7);ctx.stroke()}
  if(c._stopped&&detail){for(let k=0;k<6;k++){const u=k<2?8:k<4?-8:0,v=k%2?7:-7;const q=pt(u*1.1,v*1.1,0);ctx.fillStyle=c.col;ctx.fillRect(q[0]-1.4*Z,q[1]-5*Z,2.8*Z,5*Z);ctx.fillStyle="#222";ctx.beginPath();ctx.arc(q[0],q[1]-6*Z,1.4*Z,0,7);ctx.fill()}}
}
function drawSparks(ctx,cw,ch,p,v){const co=Math.cos(p.h),si=Math.sin(p.h),Z=CAM.z;const n=3+Math.floor(Math.random()*4);
  for(let j=0;j<n;j++){const u=-(10+Math.random()*6)*CSC,w=(Math.random()-.5)*6*CSC,len=(6+Math.random()*14)*CSC*Math.min(1.4,v/60);
    const a=toScreen(p.x+co*u-si*w,p.y+si*u+co*w,.6,cw,ch),b=toScreen(p.x+co*(u-len)-si*(w*1.6),p.y+si*(u-len)+co*(w*1.6),.4+Math.random()*2,cw,ch);
    ctx.strokeStyle=`rgba(255,${190+Math.floor(Math.random()*60)},${80+Math.floor(Math.random()*80)},${.6+Math.random()*.4})`;ctx.lineWidth=Math.max(1,.7*Z);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}}
function drawSmokeTrail(ctx,cw,ch,p,t){const co=Math.cos(p.h),si=Math.sin(p.h),Z=CAM.z;for(let j=0;j<6;j++){const d=(10+j*9)*CSC,s=toScreen(p.x-co*d,p.y-si*d,(5+j*2)*CSC,cw,ch);ctx.fillStyle=`rgba(140,140,140,${.32-j*.045})`;ctx.beginPath();ctx.arc(s[0]+Math.sin(t*3+j)*2*Z,s[1],(3+j*1.6)*CSC*Z,0,7);ctx.fill()}}
// spray de água atrás do carro na chuva
function drawSpray(ctx,cw,ch,p,v,wet){const co=Math.cos(p.h),si=Math.sin(p.h),Z=CAM.z;const k=clamp((v-22)/50,0,1)*clamp((wet-.28)*2.2,0,1);if(k<=0)return;const t=performance.now()/90;
  for(let j=0;j<5;j++){const d=(14+j*9)*CSC,w=(6+j*4)*CSC;const jit=Math.sin(t+j*1.7)*2*CSC;const s=toScreen(p.x-co*d-si*jit,p.y-si*d+co*jit,(3+j*1.6)*CSC,cw,ch);ctx.fillStyle=`rgba(225,232,242,${(.2-j*.032)*k})`;ctx.beginPath();ctx.ellipse(s[0],s[1],w*Z,w*.55*Z,0,0,7);ctx.fill()}}
let RAIN=[];
function drawRain(ctx,cw,ch,int){if(!int){RAIN=[];return}const n=int===2?280:120;while(RAIN.length<n)RAIN.push({x:Math.random()*cw,y:Math.random()*ch,v:6+Math.random()*6});
  ctx.strokeStyle="rgba(190,210,240,.5)";ctx.lineWidth=1;ctx.beginPath();RAIN.forEach(d=>{d.y+=d.v;d.x-=d.v*.25;if(d.y>ch){d.y=-10;d.x=Math.random()*cw*1.2}ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+3,d.y-12)});ctx.stroke();
  ctx.fillStyle=`rgba(40,50,70,${int===2?.22:.1})`;ctx.fillRect(0,0,cw,ch)}
function drawMinimap(ctx,w,h){const g=TRACKGEO;if(!g)return;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;g.path.forEach(p=>{const[a,b]=iso(p.x,p.y);x0=Math.min(x0,a);x1=Math.max(x1,a);y0=Math.min(y0,b);y1=Math.max(y1,b)});
  const s=Math.min((w-16)/(x1-x0),(h-16)/(y1-y0)),ox=(w-(x1-x0)*s)/2,oy=(h-(y1-y0)*s)/2;const P=(x,y)=>{const[a,b]=iso(x,y);return[(a-x0)*s+ox,(b-y0)*s+oy]};
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#0E1116D9";ctx.fillRect(0,0,w,h);
  ctx.beginPath();g.path.forEach((p,i)=>{const q=P(p.x,p.y);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});ctx.closePath();ctx.strokeStyle="#5B6470";ctx.lineWidth=4;ctx.stroke();
  R.yellows.forEach(y=>{const n=(y.b-y.a+1)%1;ctx.beginPath();for(let k=0;k<=8;k++){const q=trackPos(y.a+n*k/8);const r=P(q.x,q.y);k?ctx.lineTo(r[0],r[1]):ctx.moveTo(r[0],r[1])}ctx.strokeStyle="#FFD400";ctx.lineWidth=5;ctx.stroke()});
  const st=P(g.path[0].x,g.path[0].y);ctx.fillStyle="#FFF";ctx.fillRect(st[0]-1,st[1]-4,2,8);
  R.wrecks.forEach(w0=>{if(w0.removed)return;const q=trackPos(w0.f);const r=P(q.x,q.y);ctx.strokeStyle="#FF4D4F";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r[0]-4,r[1]-4);ctx.lineTo(r[0]+4,r[1]+4);ctx.moveTo(r[0]+4,r[1]-4);ctx.lineTo(r[0]-4,r[1]+4);ctx.stroke()});
  const cars=R.order.slice().reverse();cars.forEach(c=>{if(c.status==="dnf"||c.status==="dsq"||!c._w)return;const r=P(c._w.x,c._w.y);ctx.fillStyle=c.col;ctx.beginPath();ctx.arc(r[0],r[1],c.isP?4.5:3,0,7);ctx.fill();if(c.isP){ctx.strokeStyle="#FFF";ctx.lineWidth=1.5;ctx.stroke()}});
  if(R.sc&&R.sc.type==="sc"){const q=scWorld();if(q){const r=P(q.x,q.y);ctx.fillStyle="#F2A900";ctx.fillRect(r[0]-3,r[1]-3,6,6)}}}
// ---------- pódio
function drawPodium(ctx,cw,ch,t,top){// top: [{name,code,team,col,col2}]
  ctx.fillStyle="#141821";ctx.fillRect(0,0,cw,ch);
  const sc=Math.min(cw/520,ch/380);const cx=cw/2,base=ch*.72;
  // telão / fundo
  ctx.fillStyle="#1E2430";ctx.fillRect(0,0,cw,ch*.45);
  for(let i=0;i<14;i++){ctx.fillStyle=i%2?"#232A38":"#1E2430";ctx.fillRect(i*cw/14,0,cw/14,ch*.45)}
  const steps=[{i:1,dx:-120,h:60},{i:0,dx:0,h:90},{i:2,dx:120,h:40}];
  const box=(x,y,w,d,h,top,l,r)=>{const P=(u,v,z)=>[x+(u-v)*ISO_C*sc,y+(u+v)*ISO_S*sc-z*sc];
    ctx.fillStyle=l;poly(ctx,[P(-w/2,d/2,0),P(w/2,d/2,0),P(w/2,d/2,h),P(-w/2,d/2,h)]);ctx.fill();
    ctx.fillStyle=r;poly(ctx,[P(w/2,-d/2,0),P(w/2,d/2,0),P(w/2,d/2,h),P(w/2,-d/2,h)]);ctx.fill();
    ctx.fillStyle=top;poly(ctx,[P(-w/2,-d/2,h),P(w/2,-d/2,h),P(w/2,d/2,h),P(-w/2,d/2,h)]);ctx.fill();return P(0,0,h)};
  const rise=Math.min(1,t/1.2);
  steps.sort((a,b)=>a.dx-b.dx).forEach(s=>{const h=s.h*rise;const x=cx+s.dx*sc,y=base;const tp=box(x,y,80,70,h,"#E8E8EC","#9CA3AF","#C7CCD4");
    ctx.fillStyle="#1A1E27";ctx.font=`700 ${22*sc}px "Titillium Web",sans-serif`;ctx.textAlign="center";const f=[x+0*sc,y+20*sc-h*sc*.5];ctx.fillText(s.i+1,f[0]-14*sc,f[1]+8*sc);
    const p=top[s.i];if(!p||t<.8+s.i*.3)return;
    // piloto
    const px=tp[0],py=tp[1];const bob=Math.sin(t*6+s.i)*2*sc;
    ctx.fillStyle=p.col;ctx.fillRect(px-7*sc,py-34*sc+bob,14*sc,22*sc);ctx.fillStyle=p.col2||"#222";ctx.fillRect(px-7*sc,py-22*sc+bob,14*sc,4*sc);
    ctx.fillStyle="#2B2B2B";ctx.fillRect(px-6*sc,py-12*sc,5*sc,12*sc);ctx.fillRect(px+1*sc,py-12*sc,5*sc,12*sc);
    ctx.fillStyle="#F1C9A5";ctx.beginPath();ctx.arc(px,py-40*sc+bob,6*sc,0,7);ctx.fill();
    // braços erguidos com troféu/champanhe
    ctx.strokeStyle=p.col;ctx.lineWidth=4*sc;ctx.beginPath();ctx.moveTo(px-7*sc,py-30*sc+bob);ctx.lineTo(px-14*sc,py-46*sc+bob);ctx.moveTo(px+7*sc,py-30*sc+bob);ctx.lineTo(px+14*sc,py-46*sc+bob);ctx.stroke();
    if(s.i===0){ctx.fillStyle="#F2C230";ctx.beginPath();ctx.moveTo(px-20*sc,py-60*sc+bob);ctx.lineTo(px-8*sc,py-60*sc+bob);ctx.lineTo(px-12*sc,py-48*sc+bob);ctx.lineTo(px-16*sc,py-48*sc+bob);ctx.fill()}
    else{ctx.fillStyle="#1F6B3A";ctx.fillRect(px+(s.i===1?12:-16)*sc,py-58*sc+bob,4*sc,12*sc)}
    ctx.font=`700 ${12*sc}px "Titillium Web",sans-serif`;ctx.fillStyle="#FFFFFF";ctx.fillText(p.code,px,py-54*sc+bob-6*sc)});
  // champanhe e confete
  if(!drawPodium.parts||t<.05)drawPodium.parts=[];const P=drawPodium.parts;
  if(t>1.6&&t<6)for(let k=0;k<6;k++){const side=Math.random()<.5?-1:1;P.push({x:cx+side*110*sc,y:base-110*sc,vx:-side*(1+Math.random()*3)*sc,vy:-(2+Math.random()*3)*sc,c:"#FFF4C2",l:60})}
  if(t>1&&Math.random()<.6)P.push({x:Math.random()*cw,y:-5,vx:(Math.random()-.5),vy:1+Math.random()*2,c:pick(["#E8333C","#F2C230","#2ECC71","#3A86FF","#FFFFFF"]),l:200,conf:1});
  for(const q of P){q.x+=q.vx;q.y+=q.vy;q.vy+=q.conf?.01:.12;q.l--;ctx.fillStyle=q.c;ctx.fillRect(q.x,q.y,q.conf?4:2.5,q.conf?6:2.5)}
  drawPodium.parts=P.filter(q=>q.l>0&&q.y<ch+10);
}

// ---------- torcida e incêndio
// empolgação da arquibancada: eventos perto dela (ultrapassagem, batida, liderança) e a bandeirada
function crowdExc(f,T){if(f==null||!R)return .1;let e=.08;for(const v of R.crowd||[]){const age=T-v.t;if(age<0||age>7)continue;let df=Math.abs(fr(f)-v.f);if(df>.5)df=1-df;if(df>.09)continue;e=Math.max(e,v.a*Math.exp(-age/2.2)*(1-df/.09))}
  if(R.finishing&&f<.12||R.finishing&&f>.88)e=Math.max(e,.9);if(!R.started&&R.form&&R.form.phase==="lights")e=Math.max(e,.45);return Math.min(1,e)}
function drawFire(ctx,cw,ch,p,age,Z,now){const k=Math.min(1,(16-age)/4);for(let j=0;j<6;j++){const fl=Math.sin(now*17+j*1.9)*.5+.5;const q=toScreen(p.x+Math.cos(j*1.1+p.h)*2.2*U,p.y+Math.sin(j*1.1+p.h)*2.2*U,(4+fl*7*k)*U,cw,ch);
    ctx.fillStyle=j%2?`rgba(255,${120+((j*40)%100)},0,${.75*k})`:`rgba(255,215,64,${.8*k})`;ctx.beginPath();ctx.moveTo(q[0],q[1]-(6+fl*7)*U*Z*k);ctx.lineTo(q[0]-3.2*U*Z,q[1]+2*U*Z);ctx.lineTo(q[0]+3.2*U*Z,q[1]+2*U*Z);ctx.closePath();ctx.fill()}
  for(let j=0;j<5;j++){const a=((age*1.4+j*.6)%3)/3;const q=toScreen(p.x,p.y,(14+a*40)*U,cw,ch);ctx.fillStyle=`rgba(40,40,40,${.45*(1-a)*k})`;ctx.beginPath();ctx.arc(q[0]+Math.sin(now+j)*6*U*Z,q[1],(5+a*10)*U*Z,0,7);ctx.fill()}}
function drawExt(ctx,cw,ch,p,age,Z,now){const k=Math.min(1,(age-5)/1.5)*Math.min(1,(18-age)/2);for(let j=0;j<2;j++){const ang=p.h+(j?1.3:-1.6);const mx=p.x+Math.cos(ang)*14*U,my=p.y+Math.sin(ang)*14*U;const m=toScreen(mx,my,0,cw,ch);
    ctx.fillStyle="#FF8F00";ctx.fillRect(m[0]-1.5*U*Z,m[1]-6*U*Z,3*U*Z,6*U*Z);for(let i=0;i<6;i++){const t=((now*2+i*.17+j*.5)%1);const q=toScreen(mx+(p.x-mx)*t,my+(p.y-my)*t,4*U,cw,ch);ctx.fillStyle=`rgba(245,245,245,${.55*k*(1-t*.5)})`;ctx.beginPath();ctx.arc(q[0],q[1],(2+t*6)*U*Z,0,7);ctx.fill()}}}
