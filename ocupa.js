// ===================== OCUPAÇÃO DO TERRENO EM VOLTA DA PISTA =====================
// Antes, cada tipo de objeto (arquibancada, prédio, árvore, placa, garagem, brita, muro, zebra) olhava só a distância até o
// centro da pista mais próximo, e ninguém olhava os outros: o prédio dos boxes caía em cima de outro trecho da pista, as
// arquibancadas na brita, as árvores dentro dos prédios, o pórtico de largada na pit lane, o muro atravessava a entrada do box.
// Aqui fica um mapa único do terreno (grade de 3 m):
//  - distância até o traçado e qual ponto do traçado está mais perto (para saber de que lado e a que distância lateral)
//  - distância até a pit lane
//  - lista do que já foi colocado (garagens, prédio dos boxes, arquibancadas, prédios, pontos famosos...)
// Cada objeto só entra onde cabe inteiro: fora da pista (de qualquer trecho), fora da pit lane, atrás do muro, fora da brita, da
// água e dos outros objetos. Se não cabe, é afastado da pista ou fica de fora. A ordem de colocação é a de prioridade:
// pista → pit lane e boxes → brita e muros → arquibancadas → placas e postos → pontos famosos → prédios → árvores.
function ocCria(TG,margem){const m=WS,P=TG.path,M=TG.M,bb=TG.bb,C=4*m,MG=(margem||320)*m;
  const X0=bb.x0-MG,Y0=bb.y0-MG,NX=Math.ceil((bb.x1-bb.x0+2*MG)/C)+1,NY=Math.ceil((bb.y1-bb.y0+2*MG)/C)+1,N=NX*NY;
  // distância (até o eixo) e índice do ponto mais perto, por propagação (chanfro) a partir de pontos semeados ao longo do eixo
  const campo=(pts,fech)=>{const D=new Float32Array(N).fill(1e30),I=new Int32Array(N).fill(-1);const sem=(x,y,i)=>{const gx=Math.round((x-X0)/C),gy=Math.round((y-Y0)/C);
      for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const ix=gx+a,iy=gy+b;if(ix<0||iy<0||ix>=NX||iy>=NY)continue;const k=iy*NX+ix,d=Math.hypot(X0+ix*C-x,Y0+iy*C-y);if(d<D[k]){D[k]=d;I[k]=i}}};
    const n=pts.length;for(let i=0;i<(fech?n:n-1);i++){const a=pts[i],b=pts[(i+1)%n];const L=Math.hypot(b.x-a.x,b.y-a.y),s=Math.max(1,Math.ceil(L/(C*.5)));for(let k=0;k<s;k++){const t=k/s;sem(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,i)}}
    if(!fech&&n)sem(pts[n-1].x,pts[n-1].y,n-1);
    // duas passadas (ida e volta) guardando o ponto de origem: a distância é a real até o ponto semeado, não a soma dos passos
    const SX=new Float32Array(N),SY=new Float32Array(N);for(let k=0;k<N;k++){if(I[k]<0)continue;const ix=k%NX,iy=(k/NX)|0;const q=pts[I[k]];SX[k]=q.x;SY[k]=q.y;const dx=X0+ix*C-q.x,dy=Y0+iy*C-q.y;D[k]=dx*dx+dy*dy}
    const viz=[[-1,0],[0,-1],[-1,-1],[1,-1]];for(const ida of[true,false])for(let jj=0;jj<NY;jj++){const iy=ida?jj:NY-1-jj;for(let ii=0;ii<NX;ii++){const ix=ida?ii:NX-1-ii,k=iy*NX+ix;const x=X0+ix*C,y=Y0+iy*C;
      for(const[da,db]of viz){const a=ida?ix+da:ix-da,b=ida?iy+db:iy-db;if(a<0||b<0||a>=NX||b>=NY)continue;const kk=b*NX+a;if(I[kk]<0)continue;const dx=x-SX[kk],dy=y-SY[kk],d=dx*dx+dy*dy;if(d<D[k]){D[k]=d;I[k]=I[kk];SX[k]=SX[kk];SY[k]=SY[kk]}}}}
    return{D,I}};
  const T=campo(P,true);const pit=TG.pit||[];const PH=40*m,ph=new Map();for(let i=0;i<pit.length-1;i++){const a=pit[i],b=pit[i+1];for(const q of[a,b,{x:(a.x+b.x)/2,y:(a.y+b.y)/2}]){const k=Math.floor(q.x/PH)+":"+Math.floor(q.y/PH);let L=ph.get(k);if(!L)ph.set(k,L=new Set());L.add(i)}}const Pp=pit.length>1?{ph}:null;
  const cel=(x,y)=>{const ix=Math.round((x-X0)/C),iy=Math.round((y-Y0)/C);return!(ix>=0&&iy>=0)||ix<0||iy<0||ix>=NX||iy>=NY?-1:iy*NX+ix};
  // distância exata ao eixo do traçado perto do índice achado (o campo dá o ponto; o segmento dá a distância fina)
  const dSeg=(x,y,i)=>{const a=P[(i+M)%M],b=P[(i+1)%M],c=P[(i-1+M)%M];const f=(A,B)=>{const dx=B.x-A.x,dy=B.y-A.y,L=dx*dx+dy*dy||1;let t=((x-A.x)*dx+(y-A.y)*dy)/L;t=Math.max(0,Math.min(1,t));return Math.hypot(A.x+dx*t-x,A.y+dy*t-y)};return Math.min(f(a,b),f(c,a))};
  const oc={C,X0,Y0,NX,NY,T,Pp,objs:[],hash:new Map(),HS:60*m,
    // distância até o eixo da pista (∞ fora da grade) e índice do ponto mais perto
    dPista(x,y){const k=cel(x,y);if(k<0||T.I[k]<0)return 1e9;return dSeg(x,y,T.I[k])},
    idx(x,y){const k=cel(x,y);return k<0?-1:T.I[k]},
    // distância até o eixo da pista sem contar os pontos perto de i0 (outro trecho)
    dOutro(x,y,i0,jan){const k=cel(x,y);if(k<0)return 1e9;const i=T.I[k];if(i<0)return 1e9;let d=Math.abs(i-i0);d=Math.min(d,M-d);if(d>=jan)return dSeg(x,y,i);
      // o mais perto é do próprio trecho: procura em volta um ponto de outro trecho
      let b=1e9;const r=Math.ceil(TW*3/C)+2,gx=k%NX,gy=(k/NX)|0;for(let a=-r;a<=r;a+=1)for(let c=-r;c<=r;c+=1){const ix=gx+a,iy=gy+c;if(ix<0||iy<0||ix>=NX||iy>=NY)continue;const j=T.I[iy*NX+ix];if(j<0)continue;let e=Math.abs(j-i0);e=Math.min(e,M-e);if(e<jan)continue;const dd=dSeg(x,y,j);if(dd<b)b=dd}return b},
    // posição lateral (com sinal: + = esquerda do traçado) em relação ao ponto mais perto
    lat(x,y){const i=this.idx(x,y);if(i<0)return null;const p=P[i],h=TG.heading[i];return{i,L:(x-p.x)*-Math.sin(h)+(y-p.y)*Math.cos(h)}},
    // distância até o eixo da pit lane (busca nos blocos vizinhos; longe da pit lane devolve "longe")
    dPit(x,y){if(!Pp)return 1e9;const gx=Math.floor(x/PH),gy=Math.floor(y/PH);let b=1e9;for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++){const L=ph.get((gx+a)+":"+(gy+c));if(!L)continue;for(const i of L){const d=ocDistSeg(x,y,pit[i],pit[i+1]);if(d<b)b=d}}return b<PH?b:1e9},
    // registro dos objetos colocados (polígono + caixa) num hash espacial
    poe(pts,k){const o={pts,k,bb:ocBB(pts)};this.objs.push(o);for(const key of ocChaves(o.bb,this.HS)){let L=this.hash.get(key);if(!L)this.hash.set(key,L=[]);L.push(o)}return o},
    toca(pts,folga,filtro){const bb=ocBB(pts,folga||0);const vis=new Set();for(const key of ocChaves(bb,this.HS)){const L=this.hash.get(key);if(!L)continue;for(const o of L){if(vis.has(o))continue;vis.add(o);if(filtro&&!filtro(o))continue;
        if(o.bb.x1<bb.x0||o.bb.x0>bb.x1||o.bb.y1<bb.y0||o.bb.y0>bb.y1)continue;if(ocCruza(pts,o.pts,folga||0))return o}}return null}};
  return oc}
function ocBB(pts,f){f=f||0;let x0=1e18,y0=1e18,x1=-1e18,y1=-1e18;for(const q of pts){x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y)}return{x0:x0-f,y0:y0-f,x1:x1+f,y1:y1+f}}
function ocChaves(bb,HS){const o=[];for(let a=Math.floor(bb.x0/HS);a<=Math.floor(bb.x1/HS);a++)for(let b=Math.floor(bb.y0/HS);b<=Math.floor(bb.y1/HS);b++)o.push(a+":"+b);return o}
function ocNoPoly(x,y,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y+1e-9)+a.x)c=!c}return c}
function ocDistSeg(x,y,A,B){const dx=B.x-A.x,dy=B.y-A.y,L=dx*dx+dy*dy||1;let t=((x-A.x)*dx+(y-A.y)*dy)/L;t=Math.max(0,Math.min(1,t));return Math.hypot(A.x+dx*t-x,A.y+dy*t-y)}
// dois polígonos convexos/simples se tocam (com folga): algum vértice dentro do outro, ou contornos mais perto que a folga
function ocCruza(A,B,f){for(const q of A)if(ocNoPoly(q.x,q.y,B))return true;for(const q of B)if(ocNoPoly(q.x,q.y,A))return true;
  const n=A.length,m=B.length;for(let i=0;i<n;i++){const a=A[i],b=A[(i+1)%n];for(let j=0;j<m;j++){const c=B[j],d=B[(j+1)%m];if(ocSegX(a,b,c,d))return true;if(f>0&&(ocDistSeg(c.x,c.y,a,b)<f||ocDistSeg(a.x,a.y,c,d)<f))return true}}return false}
function ocSegX(a,b,c,d){const o=(p,q,r)=>Math.sign((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x));return o(a,b,c)!==o(a,b,d)&&o(c,d,a)!==o(c,d,b)}
function ocRet(x,y,h,w,d){const c=Math.cos(h||0),s=Math.sin(h||0);return[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>({x:x+u*c-v*s,y:y+u*s+v*c}))}
// pontos para testar um polígono contra os campos (contorno e miolo)
function ocAmostra(pts,passo){const o=pts.slice();const bb=ocBB(pts);const st=Math.max(passo,Math.max(bb.x1-bb.x0,bb.y1-bb.y0)/10);
  for(let x=bb.x0+st/2;x<bb.x1;x+=st)for(let y=bb.y0+st/2;y<bb.y1;y+=st)if(ocNoPoly(x,y,pts))o.push({x,y});
  for(let k=0;k<pts.length;k++){const a=pts[k],b=pts[(k+1)%pts.length];const L=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(L/passo));for(let t=1;t<n;t++)o.push({x:a.x+(b.x-a.x)*t/n,y:a.y+(b.y-a.y)*t/n})}return o}
// o polígono cabe ali? r = {pista: folga além da borda (m), pit: folga além da pit lane (m), muro: folga atrás do muro (m; usa wl), brita, agua, objs: folga (m), excl}
function ocCabe(oc,TG,pts,r){const m=WS,S=TG.scn||{},wl=S.wl,PWd=15*U;const am=ocAmostra(pts,3*m);
  for(const q of am){if(r.pista!=null){const d=oc.dPista(q.x,q.y);if(d<TW+r.pista*m)return"pista"}
    if(r.pit!=null&&oc.Pp){const d=oc.dPit(q.x,q.y);if(d<PWd+r.pit*m)return"pit"}
    if(r.muro!=null&&wl){const L=oc.lat(q.x,q.y);if(L){const sg=L.L>=0?1:-1,W=wl[sg]&&wl[sg][L.i];if(W!=null&&isFinite(W)&&Math.abs(L.L)<W+r.muro*m)return"muro"}}
    if(r.agua&&S.isWater&&S.isWater(q.x,q.y,oc.dPista(q.x,q.y)))return"agua";
    if(r.brita)for(const g of TG.gravel||[]){if(!g.pts||g.pts.length<3)continue;const bb=g._bb||(g._bb=ocBB(g.pts));if(q.x<bb.x0||q.x>bb.x1||q.y<bb.y0||q.y>bb.y1)continue;if(ocNoPoly(q.x,q.y,g.pts))return"brita"}}
  if(r.objs!=null&&oc.toca(pts,r.objs*m,r.filtro))return"objeto";return null}
// ---------- pit lane: de que lado e a que distância lateral ela passa em cada ponto do traçado (borda de dentro e de fora)
function ocPitLado(TG,oc){const M=TG.M,P=TG.path,PWd=15*U,pit=TG.pit||[];const ins={1:new Float32Array(M).fill(1e9),"-1":new Float32Array(M).fill(1e9)},out={1:new Float32Array(M).fill(-1),"-1":new Float32Array(M).fill(-1)};
  for(let k=0;k<pit.length;k++){const q=pit[k];const L=oc.lat(q.x,q.y);if(!L)continue;const sg=L.L>=0?1:-1,a=Math.abs(L.L);for(const d of[-2,-1,0,1,2]){const i=((L.i+d)%M+M)%M;ins[sg][i]=Math.min(ins[sg][i],a-PWd);out[sg][i]=Math.max(out[sg][i],a+PWd)}}
  return{ins,out}}
// ---------- boxes: garagens e prédio atrás da pit lane, do tamanho que cabe (Mônaco, Zandvoort: a pit lane fica espremida entre dois trechos)
function ocBoxes(TG,oc,isWater){const m=v=>v*WS,pit=TG.pit||[],sd=TG.side||1;if(pit.length<4)return;
  const livre=(x,y,nx,ny,de,max)=>{for(let t=de;t<=max;t+=m(1)){const X=x+nx*t,Y=y+ny*t;if(oc.dPista(X,Y)<TW+m(5)||(isWater&&isWater(X,Y,oc.dPista(X,Y))))return t-de}return max-de};
  const a0=16*U;let gMax=0;
  for(const ga of TG.garages||[]){const pp=pitPosRaw(pit,ga.f),nx=-Math.sin(pp.h)*sd,ny=Math.cos(pp.h)*sd;let fd=1e9;for(const u of[-13*U,0,13*U]){const x=pp.x+Math.cos(pp.h)*u,y=pp.y+Math.sin(pp.h)*u;fd=Math.min(fd,livre(x,y,nx,ny,a0,a0+m(40)))}
    const gd=Math.max(m(2.5),Math.min(16*U,fd-m(1)));const c=a0+gd/2;ga.x=pp.x+nx*c;ga.y=pp.y+ny*c;ga.h=pp.h;ga.d=gd;ga.w=26*U;ga.ap=fd<m(3.5);gMax=Math.max(gMax,gd);
    ga.pts=ocRet(ga.x,ga.y,ga.h,ga.w,ga.d);oc.poe(ga.pts,"garagem")}
  // prédio dos boxes: atrás das garagens, ao longo de 28% a 72% da pit lane
  const a1=a0+gMax+m(1);let bd=26*U;const F=[];for(let k=0;k<=12;k++){const f=.28+k*(.44/12),pp=pitPosRaw(pit,f);const nx=-Math.sin(pp.h)*sd,ny=Math.cos(pp.h)*sd;bd=Math.min(bd,livre(pp.x,pp.y,nx,ny,a1,a1+26*U+m(2))-m(1));F.push({pp,nx,ny})}
  if(bd<m(6)){TG.building=null;return}
  // em pedaços retos que seguem a curva da pit lane (um bloco único reto encostava nas garagens e na pista onde a pit lane curva)
  const c=a1+bd/2;const Q=F.map(({pp,nx,ny})=>({x:pp.x+nx*c,y:pp.y+ny*c}));const segs=[];
  for(let k=0;k<Q.length-1;k++){const a=Q[k],b=Q[k+1];const L=Math.hypot(b.x-a.x,b.y-a.y),h=Math.atan2(b.y-a.y,b.x-a.x);const poly=ocRet((a.x+b.x)/2,(a.y+b.y)/2,h,L+m(.4),bd);
    if(ocCabe(oc,TG,poly,{pista:3,objs:.2,filtro:o=>o.k!=="prédio dos boxes"}))continue;segs.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,h,L:L+m(.4),d:bd,poly});oc.poe(poly,"prédio dos boxes")}
  if(segs.length<4){TG.building=null;return}TG.building={pts:[{x:Q[0].x,y:Q[0].y,h:F[0].pp.h},{x:Q[Q.length-1].x,y:Q[Q.length-1].y,h:F[F.length-1].pp.h}],d:bd,segs}}
// ---------- arquibancadas, placas e postos de fiscal: atrás do muro, fora da pit lane, da brita, da água e dos outros objetos
function ocArquibancadas(TG,oc){const m=v=>v*WS,keep=[];const D=26*U*1.05;
  for(const st of TG.stands||[]){const c=Math.cos(st.h),s=Math.sin(st.h),nx=-s*st.o,ny=c*st.o;let ok=false;
    for(let t=0;t<=m(70);t+=m(5)){const x=st.x+nx*t,y=st.y+ny*t;const pts=[{x:x-c*st.w/2,y:y-s*st.w/2},{x:x+c*st.w/2,y:y+s*st.w/2},{x:x+nx*D+c*st.w/2,y:y+ny*D+s*st.w/2},{x:x+nx*D-c*st.w/2,y:y+ny*D-s*st.w/2}];
      if(!ocCabe(oc,TG,pts,{pista:4,pit:3,muro:2,brita:1,agua:1,objs:3})){st.x=x;st.y=y;st.pts=pts;oc.poe(pts,"arquibancada");ok=true;break}}
    if(ok)keep.push(st)}TG.stands=keep}
function ocPlacas(TG,oc){const m=v=>v*WS,S=TG.scn,M=TG.M,keep=[];
  for(const b of TG.boards||[]){const L=oc.lat(b.x,b.y);if(!L){continue}const sg=L.L>=0?1:-1,W=S.wl[sg][L.i];const Lb=Math.max(TW+5*U,(isFinite(W)?W:TW+5*U)+m(.9));const p=TG.path[L.i],h=TG.heading[L.i];
    const x=p.x-Math.sin(h)*sg*Lb,y=p.y+Math.cos(h)*sg*Lb;const pts=ocRet(x,y,h,22*U,1.2*U);if(ocCabe(oc,TG,pts,{pista:1,pit:1,agua:1,objs:1}))continue;b.x=x;b.y=y;b.h=h;oc.poe(pts,"placa");keep.push(b)}
  TG.boards=keep;
  const pk=[];for(const p of TG.posts||[]){let ok=false;for(const sg0 of[null,1,-1]){const i=p.i;const lat0=oc.lat(p.x,p.y);const sg=sg0==null?(lat0&&lat0.L>=0?1:-1):sg0;const W=S.wl[sg][i];if(!isFinite(W))continue;
      const L=W+m(3.5),q=TG.path[i],h=TG.heading[i];const x=q.x-Math.sin(h)*sg*L,y=q.y+Math.cos(h)*sg*L;const pts=ocRet(x,y,0,7*U,7*U);if(ocCabe(oc,TG,pts,{pista:3,pit:2,muro:1,agua:1,brita:1,objs:1}))continue;p.x=x;p.y=y;oc.poe(pts,"posto");pk.push(p);ok=true;break}}
  TG.posts=pk}
// ---------- objetos do 3D que ficam junto da pista: placas de frenagem, pórticos de faixa e o pórtico de largada
function ocProps3D(TG,oc,pl){const m=v=>v*WS,M=TG.M,P=TG.path,g=TG,o={frenagem:[],faixas:[],portico:null};const seg=g.len/M;
  // placas de frenagem 150/100/50 m antes das curvas fortes, por fora
  {let ult=-1e9;for(const cn of g.corners||[]){const ci=cn.i;if(ci-ult<260*m(1)/seg){ult=ci;continue}ult=ci;const hb=g.heading[(ci+M)%M],ha=g.heading[((ci-Math.round(m(60)/seg))%M+M)%M];let dh=hb-ha;while(dh>Math.PI)dh-=2*Math.PI;while(dh<-Math.PI)dh+=2*Math.PI;if(Math.abs(dh)<.5)continue;const out=dh>0?-1:1;
    const set=[];for(const[n,dist]of[[0,150],[1,100],[2,50]]){const i=((ci-Math.round(m(dist+40)/seg))%M+M)%M;const p0=P[i],h=g.heading[i],L=TW+m(4.2);const x=p0.x-Math.sin(h)*out*L,y=p0.y+Math.cos(h)*out*L;
      if(pl.ins[out][i]<L+m(2))break;/* a pit lane passa ali */if(ocCabe(oc,TG,ocRet(x,y,h+Math.PI/2,m(1.5),m(.3)),{pista:2,objs:.5}))break;set.push({i,x,y,h,n,out})}
    if(set.length===3)o.frenagem.push(...set)}}
  // pórticos de faixa sobre a pista, em retas: os pilares ficam fora da pit lane e de outros trechos
  {let n=0;for(let i=Math.round(M*.06);i<M&&n<4;i+=Math.round(M*.07)){let reta=true;for(let k=-20;k<=20;k+=5){let d=g.heading[((i+k)%M+M)%M]-g.heading[i];while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;if(Math.abs(d)>.12){reta=false;break}}if(!reta)continue;
    const pon=typeof bridgeCross==="function"&&fichaOf(g.id).ponte?bridgeCross(g):null;if(pon&&Math.min(Math.abs(i-pon.hi),M-Math.abs(i-pon.hi))<60)continue;
    const Ls={};let ok=true;for(const sg of[1,-1]){let L=TW+m(3);if(pl.out[sg][i]>0&&pl.ins[sg][i]<L+m(1))L=Math.max(TW+m(.7),pl.ins[sg][i]-m(.6));/* do lado do box, o pilar fica no muro do pit */const p0=P[i],h=g.heading[i];const x=p0.x-Math.sin(h)*sg*L,y=p0.y+Math.cos(h)*sg*L;
      if(ocCabe(oc,TG,ocRet(x,y,h,m(.6),m(.6)),{pista:.5,pit:.3,objs:.5})){ok=false;break}Ls[sg]=L}
    if(!ok)continue;o.faixas.push({i,La:Ls[1],Lb:Ls[-1]});n++}}
  // pórtico de largada: do lado do box, o pilar fica no muro do pit (entre a pista e a pit lane)
  {const Ls={};for(const sg of[1,-1]){let L=TW+6*U;if(pl.out[sg][0]>0&&pl.ins[sg][0]<L+m(1))L=Math.max(TW+m(.7),pl.ins[sg][0]-m(.6));Ls[sg]=L}o.portico={La:Ls[1],Lb:Ls[-1]};
    for(const sg of[1,-1]){const p0=P[0],h=g.heading[0];const L=Ls[sg];oc.poe(ocRet(p0.x-Math.sin(h)*sg*L,p0.y+Math.cos(h)*sg*L,h,2.2*U,2.2*U),"pórtico")}}
  for(const q of o.frenagem)oc.poe(ocRet(q.x,q.y,q.h+Math.PI/2,m(1.5),m(.3)),"placa de frenagem");
  return o}
