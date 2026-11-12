// ===================== CENÁRIO DE CADA CIRCUITO =====================
// Chão com textura presa ao mundo (grama cortada, areia, cidade, água), lagos e mar, bosques, prédios com janelas,
// muros e alambrados contínuos nos circuitos de rua, zebras só onde existem e pontos famosos de cada lugar.
// Posições: c = número da curva (na ordem da volta), f = fração da volta, u/v = posição no mapa (0 a 1, norte em cima),
// d = metros para fora (ou para dentro com in:1) da pista.
// FICHA DO CIRCUITO: cada entrada abaixo é a única fonte do que existe em volta da pista daquele lugar.
//   g/pal/tr/td   chão, paleta, tipo e densidade de árvores (td 0 a 1; no máximo ~300 árvores)
//   city/water/lm/hills  moldura de cidade, água, pontos famosos e morros
//   tunel:{de,ate} trecho coberto, da curva "de" à curva "ate" (nomes das curvas do circuito); vale para desenho e som
//   ponte:1       o cruzamento do traçado é uma ponte
//   tapetes:n     quantos tapetes de patrocinadora pintados no chão (padrão 10; 0 = nenhum)
//   faixas:0      sem faixas de patrocinadora no alambrado (circuitos de rua; padrão: com faixas)
const SCN={
  melbourne:{g:"park",tr:"broad",td:.45,water:[{inl:.74}],lm:[{k:"skyline",half:"N",d:650,n:18,h:[60,200]}]},
  shanghai:{g:"park2",tr:"broad",td:.22,cityFar:.3,lm:[{k:"wings",f:.0,d:60}]},
  suzuka:{ponte:1,g:"park",tr:"mixed",td:.6,hills:1,lm:[{k:"wheel",f:.03,stand:1,d:330,r:40}]},
  miami:{g:"tropic",tr:"palm",td:.28,water:[{e:[.2,.52,.06,.04]},{e:[.46,.86,.05,.035]}],lm:[{k:"stadium",u:.72,v:.42,r:105}]},
  montreal:{g:"park",tr:"broad",td:.5,island:165},
  monaco:{tunel:{de:"Portier",ate:"Saída do túnel"},g:"urban",pal:"riviera",tr:"palm",td:.1,city:{dens:.95,h:[14,62]},water:[{seg:[7,13],d:22}],lm:[{k:"yachts",c:12,d:80,n:16},{k:"yachts",c:9,d:120,n:8}]},
  barcelona:{g:"dry",tr:"pine",td:.25,hills:1},
  spielberg:{g:"alpine",tr:"pine",td:.4,mountains:1},
  silverstone:{g:"park",tr:"broad",td:.12},
  spa:{g:"park",tr:"pine",td:.95,hills:1},
  budapest:{g:"dry2",tr:"broad",td:.35,hills:1},
  zandvoort:{g:"dunes",tr:"pine",td:.15,water:[{half:"W",d:360}]},
  monza:{g:"park",tr:"broad",td:.85},
  madrid:{g:"urbanDry",pal:"plain",tr:"broad",td:.12,city:{dens:.45,h:[10,34]},lm:[{k:"halls",c:13,d:170}]},
  baku:{g:"urban",pal:"sand",tr:"palm",td:.1,city:{dens:.85,h:[12,46]},water:[{half:"SE",d:110}],lm:[{k:"flames",c:7,d:360}]},
  singapura:{g:"urban",pal:"glass",tr:"broad",td:.2,city:{dens:.8,h:[25,150]},water:[{half:"E",d:110}],lm:[{k:"mbs",half:"E",d:430},{k:"wheel",f:.012,stand:1,d:150,r:62}]},
  austin:{g:"dry",tr:"broad",td:.2,lm:[{k:"tower",c:13,in:1,d:115}]},
  mexico:{g:"dry2",tr:"broad",td:.25,cityFar:.7,lm:[{k:"bowl",c:10,r:115}]},
  interlagos:{g:"park2",tr:"broad",td:.35,cityFar:.85,water:[{e:[.68,.57,.1,.08]},{e:[.55,.82,.06,.05]}]},
  lasvegas:{g:"desertUrban",pal:"vegas",tr:"palm",td:.12,city:{dens:.4,h:[15,40]},lm:[{k:"strip",seg:[10,11],d:120},{k:"sphere",c:6,d:160}]},
  lusail:{g:"desert",tr:"palm",td:.06},
  baia:{baia:1,g:"tropic",tr:"palm",td:.3,tapetes:6},
  abudhabi:{g:"desert",tr:"palm",td:.2,water:[{e:[.75,.82,.15,.07]},{half:"S",d:220}],lm:[{k:"yas",c:11},{k:"parque",c:5,d:380}]}
};
// cores do chão: [base, faixa da grama cortada, borda perto da pista]
const GROUND={
  park:["#3D7A3B","#478A43","#4E9449"],park2:["#4A7F3A","#55893F","#5C9447"],tropic:["#4F8A3E","#5A9646","#64A04E"],
  dry:["#7E8B4D","#899655","#6F8F45"],dry2:["#6F8646","#7A914E","#679048"],alpine:["#4C8443","#56904B","#5E9A51"],
  dunes:["#C9B98A","#BFAF80","#6E9A4E"],desert:["#C7A774","#BE9D6A","#6F9A4E"],
  urban:["#5A6069","#5A6069","#7F868F"],urbanDry:["#7A7466","#7A7466","#8B8F95"],desertUrban:["#9E8F75","#9E8F75","#868B92"]
};
const BPAL={riviera:["#EBD9B4","#E7C49A","#F2E6CF","#D9A47E","#E9D3A6","#F0EDE4"],plain:["#D8D2C4","#C9C2B2","#B9B4A8","#E0DCD2"],sand:["#D7C29A","#CDB487","#E2D2AE","#BFA77D"],
  glass:["#8FB3C9","#A9C1CF","#7C99AD","#C4D2DA","#6F8EA3"],vegas:["#E9E2D0","#D9C79A","#C8D3DC","#F2EEE6","#B9A06A"],def:["#B7BCC4","#A8AEB7","#C9CDD3","#9AA1AB"]};
const WATER_C="#2F6D96";

// ---------- texturas presas ao mundo
let TEX=null;
function mkTile(n,fn){if(typeof document==="undefined")return null;const c=document.createElement("canvas");c.width=c.height=n;fn(c.getContext("2d"),n);return c}
function texInit(ctx){if(TEX)return TEX;TEX={};const rn=mulberry(7);
  const noise=(g,n,cols,cnt,sz)=>{for(let k=0;k<cnt;k++){g.fillStyle=cols[k%cols.length];const s=sz*(.5+rn());g.fillRect(rn()*n,rn()*n,s,s)}};
  TEX.grass=mkTile(128,(g,n)=>{g.fillStyle="#000";g.globalAlpha=1;g.clearRect(0,0,n,n);noise(g,n,["rgba(0,0,0,.08)","rgba(255,255,255,.06)","rgba(30,60,10,.1)"],900,2.2)});
  TEX.stripe=mkTile(64,(g,n)=>{g.fillStyle="rgba(255,255,255,.055)";g.fillRect(0,0,n,n/2)});
  TEX.asph=mkTile(128,(g,n)=>{g.fillStyle="#3A3F46";g.fillRect(0,0,n,n);noise(g,n,["rgba(0,0,0,.18)","rgba(255,255,255,.07)","rgba(20,20,26,.2)"],1400,1.4);
    g.strokeStyle="rgba(0,0,0,.12)";g.lineWidth=1;for(let k=0;k<6;k++){g.beginPath();const x=rn()*n,y=rn()*n;g.moveTo(x,y);g.lineTo(x+rn()*30-15,y+rn()*30-15);g.stroke()}});
  TEX.gravel=mkTile(64,(g,n)=>{g.fillStyle="#D9C590";g.fillRect(0,0,n,n);noise(g,n,["#BFA874","#E9DCB0","#A8936A","#F3E8C6"],520,1.6)});
  TEX.water=mkTile(128,(g,n)=>{g.fillStyle=WATER_C;g.fillRect(0,0,n,n);g.strokeStyle="rgba(255,255,255,.12)";g.lineWidth=1.2;for(let k=0;k<26;k++){const x=rn()*n,y=rn()*n,l=6+rn()*14;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+l/2,y-2,x+l,y);g.stroke()}
    noise(g,n,["rgba(0,30,60,.12)","rgba(120,180,220,.08)"],300,3)});
  TEX.sand=mkTile(128,(g,n)=>{g.clearRect(0,0,n,n);g.strokeStyle="rgba(120,90,40,.16)";g.lineWidth=2;for(let k=0;k<9;k++){const y=rn()*n;g.beginPath();g.moveTo(0,y);for(let x=0;x<=n;x+=16)g.lineTo(x,y+Math.sin(x/n*Math.PI*2+k)*5);g.stroke()}noise(g,n,["rgba(0,0,0,.06)","rgba(255,255,255,.08)"],500,1.8)});
  TEX.tufts=mkTile(128,(g,n)=>{g.clearRect(0,0,n,n);for(let k=0;k<40;k++){g.fillStyle=k%2?"rgba(96,130,60,.55)":"rgba(120,150,70,.45)";g.beginPath();g.arc(rn()*n,rn()*n,1.5+rn()*3.5,0,7);g.fill()}});
  TEX.city=mkTile(128,(g,n)=>{g.clearRect(0,0,n,n);const r=n*14/90;g.fillStyle="rgba(0,0,0,.28)";g.fillRect(0,0,n,r);g.fillRect(0,0,r,n);// ruas
    g.fillStyle="rgba(255,255,255,.08)";g.fillRect(r,r,n-r,3);g.fillRect(r,r,3,n-r);// calçada
    g.strokeStyle="rgba(255,255,255,.35)";g.setLineDash([4,5]);g.lineWidth=1;g.beginPath();g.moveTo(0,r/2);g.lineTo(n,r/2);g.moveTo(r/2,0);g.lineTo(r/2,n);g.stroke();g.setLineDash([]);
    noise(g,n,["rgba(0,0,0,.05)","rgba(255,255,255,.04)"],300,2)});
  return TEX}
// padrão alinhado ao chão: 'mpx' metros por pixel do ladrilho
const PATC=new WeakMap();
function wpat(ctx,tile,mpx,cw,ch,ox,oy){if(!tile)return null;let m=PATC.get(ctx);if(!m){m=new Map();PATC.set(ctx,m)}let p=m.get(tile);if(!p){p=ctx.createPattern(tile,"repeat");m.set(tile,p)}const Z=CAM.z,k=mpx*WS;
  try{p.setTransform(new DOMMatrix([ISO_C*Z*k,ISO_S*Z*k,-ISO_C*Z*k,ISO_S*Z*k,(-CAM.x+((ox||0)-(oy||0))*ISO_C)*Z+cw/2+CAM.sx,(-CAM.y+((ox||0)+(oy||0))*ISO_S)*Z+ch/2+CAM.sy]))}catch(e){}return p}

// ---------- construção do cenário (uma vez por pista)
function sceneBuild(TG){const id=TG.id,th=Object.assign({g:"park",tr:"broad",td:.3},SCN[id]||{}),M=TG.M,P=TG.path,rng=mulberry(hashS(id+":cena"));
  const m=v=>v*WS;// metros → mundo
  const nrm=i=>{const h=TG.heading[(i%M+M)%M];return{x:-Math.sin(h),y:Math.cos(h)}};
  // sentido: lado de dentro do traçado
  let A=0;for(let i=0;i<M;i++){const a=P[i],b=P[(i+1)%M];A+=a.x*b.y-b.x*a.y}const inS=A>0?1:-1;
  let ax=0,ay=0;{let cx=0,cy=0,aa=0;for(let i=0;i<M;i++){const a=P[i],b=P[(i+1)%M],cr=a.x*b.y-b.x*a.y;aa+=cr;cx+=(a.x+b.x)*cr;cy+=(a.y+b.y)*cr}ax=cx/(3*aa);ay=cy/(3*aa)}
  const bb=TG.bb,BW=bb.x1-bb.x0,BH=bb.y1-bb.y0;
  // grade para medir distância até a pista rápido
  const CS=m(60),grid=new Map();const key=(x,y)=>Math.floor(x/CS)+":"+Math.floor(y/CS);
  for(let i=0;i<M;i+=2){const p=P[i],k=key(p.x,p.y);(grid.get(k)||grid.set(k,[]).get(k)).push(p)}
  const extra=[];TG.pit.forEach((p,i)=>{if(i%3===0)extra.push(p)});TG.stands.forEach(s=>extra.push({x:s.x,y:s.y,r:m(30)}));
  const dTrack=(x,y,lim)=>{const r=Math.ceil(lim/CS);const gx=Math.floor(x/CS),gy=Math.floor(y/CS);let best=1e9;
    for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++){const L=grid.get((gx+a)+":"+(gy+b));if(!L)continue;for(const p of L){const d=Math.hypot(p.x-x,p.y-y);if(d<best)best=d}}return best};
  const nearExtra=(x,y,d)=>extra.some(p=>Math.hypot(p.x-x,p.y-y)<d+(p.r||0));
  const ci=c=>{const C=TG.corners[Math.max(0,Math.min(TG.corners.length-1,(c|0)-1))];return C?C.i:0};
  const anchor=s=>{let i=s.c!=null?ci(s.c):Math.round(fr(s.f||0)*M);i=((i+Math.round((s.along||0)/DS))%M+M)%M;const p=P[i],n=nrm(i);
    const sg=s.stand?-TG.side:s.in?inS:-inS;return{x:p.x+n.x*sg*m(s.d||0),y:p.y+n.y*sg*m(s.d||0),h:TG.heading[i],i,sg}};
  const fromUV=(u,v)=>({x:bb.x0+u*BW,y:bb.y0+v*BH});
  const DIR={N:[0,-1],S:[0,1],E:[1,0],W:[-1,0],SE:[.7071,.7071],SW:[-.7071,.7071],NE:[.7071,-.7071],NW:[-.7071,-.7071]};
  const BIG=Math.max(BW,BH)*4+m(4000);
  // água (e, na Baía Serena, o plano do cenário próprio: mar, praia, vila, vinhedo...)
  const BP=th.baia&&typeof baiaPlan==="function"?baiaPlan(TG,m):null;
  const water=BP?BP.water.slice():[];
  for(const w of th.water||[]){let pts=[];
    if(w.inl){for(let i=0;i<M;i+=3){const p=P[i];const wob=1+.03*Math.sin(i*.07)+.02*Math.sin(i*.23);pts.push({x:ax+(p.x-ax)*w.inl*wob,y:ay+(p.y-ay)*w.inl*wob})}}
    else if(w.e){const c=fromUV(w.e[0],w.e[1]),rx=w.e[2]*BW,ry=w.e[3]*BH;for(let k=0;k<48;k++){const a=k/48*Math.PI*2,wb=1+.08*Math.sin(a*3+w.e[0]*9)+.05*Math.sin(a*5);pts.push({x:c.x+Math.cos(a)*rx*wb,y:c.y+Math.sin(a)*ry*wb})}}
    else if(w.half){const D=DIR[w.half];let mx=-1e9;P.forEach(p=>{mx=Math.max(mx,p.x*D[0]+p.y*D[1])});const o=mx+m(w.d||100),Q=[-D[1],D[0]];const c0={x:D[0]*o,y:D[1]*o};
      const n=24;for(let k=0;k<=n;k++){const t=(k/n-.5)*2*BIG,wob=m(18)*Math.sin(k*1.7)+m(10)*Math.sin(k*.6);pts.push({x:c0.x+Q[0]*t+D[0]*wob,y:c0.y+Q[1]*t+D[1]*wob})}
      pts.push({x:c0.x+Q[0]*BIG+D[0]*BIG,y:c0.y+Q[1]*BIG+D[1]*BIG});pts.push({x:c0.x-Q[0]*BIG+D[0]*BIG,y:c0.y-Q[1]*BIG+D[1]*BIG})}
    else if(w.seg){const a=ci(w.seg[0]),b=ci(w.seg[1]);const n=(b-a+M)%M;const sg=-inS;const off=[];for(let k=0;k<=n;k+=2){const i=(a+k)%M,p=P[i],q=nrm(i);off.push({x:p.x+q.x*sg*(TW+m(w.d||20)),y:p.y+q.y*sg*(TW+m(w.d||20)),i})}
      const far=o=>{const q=nrm(o.i);return{x:o.x+q.x*sg*BIG,y:o.y+q.y*sg*BIG}};const mid=off[Math.floor(off.length/2)];
      pts=off.concat([far(off[off.length-1]),far(mid),far(off[0])])}
    if(pts.length>2)water.push(pts)}
  const inPoly=(x,y,pts)=>{let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y+1e-9)+a.x)c=!c}return c};
  const isWater=(x,y,dt)=>{if(th.island&&dt>m(th.island)-m(12))return true;for(const w of water)if(inPoly(x,y,w))return true;return false};
  // árvores (em bosques: um ruído decide onde ficam juntas)
  const trees=[];const tk=th.tr;const nz=(x,y)=>.5+.25*Math.sin(x/m(140)+1.3)*Math.cos(y/m(170)-.7)+.25*Math.sin((x+y)/m(90)+2.1);
  const R0=m(240),maxT=Math.round(110+190*Math.min(1,th.td));/* menos árvores: a pista é a protagonista */
  for(let k=0;k<9000&&trees.length<maxT;k++){const x=bb.x0-R0+rng()*(BW+2*R0),y=bb.y0-R0+rng()*(BH+2*R0);const n=nz(x,y);if(rng()>th.td*(n>.55?1.7:.35)+.04)continue;
    const dt=dTrack(x,y,m(60));if(dt<TW+m(26))continue;if(nearExtra(x,y,m(40)))continue;if(isWater(x,y,dt))continue;if(BP&&BP.avoid(x,y))continue;if(th.city&&rng()<.7)continue;
    const kind=tk==="mixed"?(rng()<.5?"pine":"broad"):tk;trees.push({x,y,s:.75+rng()*.7,k:kind,c:rng()})}
  // prédios
  const bld=[];const pal=BPAL[th.pal||"def"];
  const city=th.city||(th.cityFar?{dens:th.cityFar,h:[10,40],far:1}:null);
  if(city){const B=m(90),R1=city.far?m(620):m(300);/* só uma moldura de cidade junto à pista */const i0=Math.floor((bb.x0-R1)/B),i1=Math.ceil((bb.x1+R1)/B),j0=Math.floor((bb.y0-R1)/B),j1=Math.ceil((bb.y1+R1)/B);
    for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const cx=(i+.5)*B,cy=(j+.5)*B;if(rng()>city.dens*(city.far?.45:.6))continue;const dt=dTrack(cx,cy,m(city.far?400:120));
      if(city.far?dt<m(330):dt<m(62))continue;if(nearExtra(cx,cy,m(70)))continue;if(isWater(cx,cy,dt))continue;
      const inner=m(70),x0=i*B+m(14)+m(3),y0=j*B+m(14)+m(3);const split=rng();const cells=split<.35?[[0,0,1,1]]:split<.7?[[0,0,.5,1],[.5,0,.5,1]]:[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]];
      const near=1-clamp((dt-m(60))/m(500),0,1);
      for(const[a,b,w,d]of cells){const ww=inner*w-m(4),dd=inner*d-m(4);if(ww<m(10)||dd<m(10))continue;let h=city.h[0]+(city.h[1]-city.h[0])*Math.pow(rng(),1.6)*(city.far?.8:.6+near*.6);
        bld.push({x:x0+inner*(a+w/2),y:y0+inner*(b+d/2),w:ww*(.82+rng()*.16),d:dd*(.82+rng()*.16),h:m(h),c:pal[Math.floor(rng()*pal.length)],rf:th.pal==="riviera"&&h<30&&rng()<.6,lit:rng()})}}}
  // pontos famosos
  const lms=[];
  for(const L of th.lm||[]){const o={k:L.k,L};
    if(L.u!=null){Object.assign(o,fromUV(L.u,L.v))}
    else if(L.half){const D=DIR[L.half];let mx=-1e9;P.forEach(p=>{mx=Math.max(mx,p.x*D[0]+p.y*D[1])});const o2=mx+m(L.d||400),cd=ax*D[0]+ay*D[1];o.x=ax+D[0]*(o2-cd);o.y=ay+D[1]*(o2-cd);o.D=D}
    else if(L.seg){o.a=ci(L.seg[0]);o.b=ci(L.seg[1])}
    else Object.assign(o,anchor(L));
    if(L.k==="skyline"){const Q=[-o.D[1],o.D[0]];o.list=[];for(let k=0;k<(L.n||14);k++){const t=(k/(L.n||14)-.5)*m(900)+rng()*m(40);const back=rng()*m(180);
      o.list.push({x:o.x+Q[0]*t+o.D[0]*back,y:o.y+Q[1]*t+o.D[1]*back,w:m(22+rng()*22),d:m(22+rng()*22),h:m(L.h[0]+rng()*(L.h[1]-L.h[0])),c:pick2(rng,BPAL.glass),lit:rng()})}}
    if(L.k==="strip"){o.list=[];const n=(o.b-o.a+M)%M;for(let k=10;k<n-10;k+=Math.round(230/DS)){const i=(o.a+k)%M,p=P[i],q=nrm(i);const sg=-inS;const dd=m(L.d||110)+rng()*m(40);
      o.list.push({x:p.x+q.x*sg*dd,y:p.y+q.y*sg*dd,w:m(55+rng()*30),d:m(40+rng()*25),h:m(90+rng()*90),c:pick2(rng,BPAL.vegas),ang:TG.heading[i],lit:rng(),neon:["#FF3EA5","#3AE0FF","#FFD400","#9B5CFF"][k%4]})}}
    if(L.k==="yachts"){o.list=[];for(let k=0;k<(L.n||10);k++){const a=anchor({c:L.c,d:(L.d||70)+rng()*90,along:(rng()-.5)*260});if(isWater(a.x,a.y,dTrack(a.x,a.y,m(80))))o.list.push({x:a.x,y:a.y,h:a.h+(rng()<.5?0:Math.PI)+(rng()-.5)*.3,l:m(18+rng()*28),ph:rng()*6})}}
    if(L.k==="bowl"){o.list=[];const n=26,r=m(L.r||110);for(let k=0;k<n;k++){const a=k/n*Math.PI*2,x=o.x+Math.cos(a)*r,y=o.y+Math.sin(a)*r;if(dTrack(x,y,m(60))<TW+m(18))continue;o.list.push({x,y,h:a+Math.PI/2,w:2*Math.PI*r/n*.92})}}
    if(L.k==="stadium"){if(dTrack(o.x,o.y,m(200))<m((L.r||100)+30))o.r=m(Math.max(45,dTrack(o.x,o.y,m(200))/WS-35));else o.r=m(L.r||100)}
    lms.push(o)}
  // montanhas e morros ao fundo (do lado de trás da tela)
  const peaks=[];if(th.mountains||th.hills){const mt=!!th.mountains;const n=mt?22:16;for(let k=0;k<n;k++){const a=-Math.PI*.98+k/(n-1)*Math.PI*.96+rng()*.08;// direções voltadas para o fundo da tela
      const dx=Math.cos(a-Math.PI/4),dy=Math.sin(a-Math.PI/4);const R=Math.max(BW,BH)*.42+m(mt?380:260)+rng()*m(mt?420:220);
      const cx=(bb.x0+bb.x1)/2+dx*R,cy=(bb.y0+bb.y1)/2+dy*R;if(cx+cy>(bb.x0+bb.y0+bb.x1+bb.y1)/2-m(100))continue;if(dTrack(cx,cy,m(400))<m(mt?420:300))continue;
      peaks.push({x:cx,y:cy,r:m(mt?380+rng()*320:260+rng()*220),h:m(mt?260+rng()*300:60+rng()*70),snow:mt&&rng()<.7,c:rng()})}
    peaks.sort((p,q)=>(p.x+p.y)-(q.x+q.y))}
  // muros, alambrados e guard-rails contínuos
  const wl={},street=!!TG.geo.C.street;
  for(const sg of[1,-1]){const arr=new Float32Array(M).fill(street?TW+m(2.4):TW+m(th.island?20:24));wl[sg]=arr}
  TG.gravel.forEach(gr=>{const arr=wl[gr.o];if(!arr)return;gr.wl.forEach((L,k)=>{const i=((gr.i0+k)%M+M)%M;arr[i]=Math.max(arr[i],L)})});
  for(const sg of[1,-1]){const a=wl[sg];for(let pass=0;pass<2;pass++){const b=Float32Array.from(a);for(let i=0;i<M;i++)a[i]=Math.max(b[i],(b[(i-1+M)%M]+b[(i+1)%M])/2)}}
  // um muro nunca invade outro trecho da pista: onde dois trechos passam perto (Baku, Suzuka, grampo de Mônaco, Miami, Zandvoort),
  // o muro de cada lado para no meio do caminho entre as duas bordas. A física usa este mesmo muro (sceneWallLat).
  const GI=m(40),gI=new Map();for(let i=0;i<M;i++){const p=P[i],k=Math.floor(p.x/GI)+":"+Math.floor(p.y/GI);(gI.get(k)||gI.set(k,[]).get(k)).push(i)}
  const dOther=(x,y,i0,win,par)=>{const gx=Math.floor(x/GI),gy=Math.floor(y/GI);let best=1e9;for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const L=gI.get((gx+a)+":"+(gy+b));if(!L)continue;for(const j of L){let d=Math.abs(j-i0);d=Math.min(d,M-d);if(d<win)continue;if(par&&Math.abs(Math.cos(TG.heading[i0]-TG.heading[j]))<.6)continue;/* cruzamento em ponte (Suzuka): não corta */const q=P[j],dd=Math.hypot(q.x-x,q.y-y);if(dd<best)best=dd}}return best};
  const clipN=[0,0];for(const sg of[1,-1]){const a=wl[sg];for(let i=0;i<M;i++){const p=P[i],n=nrm(i);const win=Math.max(30,Math.ceil(a[i]*2.2/m(DS)));
      for(let t=TW+m(1);t<=a[i];t+=m(1.5)){const x=p.x+n.x*sg*t,y=p.y+n.y*sg*t;const d=dOther(x,y,i,win,true);if(d<=t+m(.5)){a[i]=Math.max(TW+m(.8),t-m(.75));clipN[sg>0?0:1]++;break}}}
    // sem dentes: o muro cortado desce e sobe aos poucos
    for(let pass=0;pass<3;pass++){const b=Float32Array.from(a);for(let i=0;i<M;i++)a[i]=Math.min(b[i],Math.min(b[(i-1+M)%M],b[(i+1)%M])+m(3))}}
  // brita e barreira de pneus acompanham o muro cortado
  TG.gravel.forEach(gr=>{const o=gr.o,a=wl[o];if(!a)return;const sp=gr.i-gr.i0-2;const P2=(i,L)=>{const ii=((i%M)+M)%M,p=P[ii],n=nrm(ii);return{x:p.x+n.x*L,y:p.y+n.y*L}};
    gr.wl=gr.wl.map((L,k)=>Math.min(L,a[((gr.i0+k)%M+M)%M]));gr.wall=gr.wl.map((L,k)=>P2(gr.i0+k,o*L));
    const pts=[];for(let k=-sp;k<=sp+6;k++){const ii=gr.i+k,lim=a[((ii%M)+M)%M]-m(.6);pts.push(P2(ii,o*Math.min(TW+m(3.5),lim)))}
    for(let k=sp+6;k>=-sp;k--){const ii=gr.i+k,w=Math.abs(k-3)<sp*.6?(street?30:80):(street?26:52);const lim=a[((ii%M)+M)%M]-m(.6);pts.push(P2(ii,o*Math.max(TW+m(.5),Math.min(TW+(w-17)*WS/2.3,lim))))}gr.pts=pts});
  // zebras: por dentro no ápice e por fora na saída
  const kerbs=[];TG.corners.forEach(c=>{const sev=c.sev||.1;if(sev<.1)return;const sp=clamp(Math.round((c.r||60)/DS*.3),5,20);const ins=c.dir;
    kerbs.push({a:c.i-sp,b:c.i+Math.round(sp*.6),s:ins});kerbs.push({a:c.i+Math.round(sp*.3),b:c.i+Math.round(sp*1.3),s:-ins});if(sev>.2)kerbs.push({a:c.i-Math.round(sp*1.6),b:c.i-Math.round(sp*.9),s:-ins})});
  {const kept=[];for(const k of kerbs){let a0=k.a,ok=true;const flush=b=>{if(b-a0>=3)kept.push({a:a0,b,s:k.s})};
      for(let q=k.a;q<k.b;q++){const i=((q%M)+M)%M,p=P[i],n=nrm(i);const x=p.x+n.x*k.s*TW,y=p.y+n.y*k.s*TW;if(dOther(x,y,i,30)<TW+m(1)){if(ok)flush(q);ok=false}else if(!ok){ok=true;a0=q}}if(ok)flush(k.b)}
    kept.sort((x,y)=>x.s-y.s||x.a-y.a);kerbs.length=0;for(const k of kept){const l=kerbs[kerbs.length-1];if(l&&l.s===k.s&&k.a<=l.b)l.b=Math.max(l.b,k.b);else kerbs.push(k)}}
  // sem zebras da pista de baixo debaixo da ponte (Suzuka)
  if(th.ponte&&typeof bridgeCross==="function"){const B=bridgeCross(TG);if(B){const sg0=Math.max(1e-6,Math.hypot(P[1].x-P[0].x,P[1].y-P[0].y));/* pista de baixo: 34 m para cada lado; trecho de cima: onde a mureta ainda está alta (~28 m) */
    for(const[c0,mm]of[[B.lo,34],[B.hi,28]]){const w=Math.ceil(m(mm)/sg0),ta=c0-w,tb=c0+w,out=[];
    for(const k of kerbs){if(k.b<=ta||k.a>=tb){out.push(k);continue}if(k.a<ta-2)out.push({a:k.a,b:ta,s:k.s});if(k.b>tb+2)out.push({a:tb,b:k.b,s:k.s})}kerbs.length=0;kerbs.push(...out)}}}
  // sem zebras dentro do túnel (Mônaco): a pista coberta vai de muro a muro
  {const T=typeof tunnelRange==="function"&&tunnelRange({id:id,corners:TG.corners,N:M});if(T){const ta=Math.round(T.a*M)+2,tb=Math.round(T.b*M)-2,out=[];for(const k of kerbs){if(k.b<=ta||k.a>=tb){out.push(k);continue}if(k.a<ta-2)out.push({a:k.a,b:ta,s:k.s});if(k.b>tb+2)out.push({a:tb,b:k.b,s:k.s})}kerbs.length=0;kerbs.push(...out)}}
  // postes de luz nas corridas noturnas
  const lights=[];if(TG.geo.C.night){for(let i=0;i<M;i+=Math.round(70/DS)){for(const sg of[1,-1]){const L=wl[sg][i]+m(4);const p=P[i],q=nrm(i);lights.push({x:p.x+q.x*sg*L,y:p.y+q.y*sg*L,i})}}}
  // regiões: cada objeto fica no seu bloco; só os blocos perto da câmera são consultados e preparados
  const RC=m(160),cells=new Map();let maxH=0;const put=(o,kd)=>{const k=Math.floor(o.x/RC)+":"+Math.floor(o.y/RC);let c=cells.get(k);if(!c){c={t:[],b:[],l:[],seen:-1e9};cells.set(k,c)}c[kd].push(o)};
  trees.forEach(t=>put(t,"t"));bld.forEach(b=>{put(b,"b");maxH=Math.max(maxH,b.h)});lights.forEach(l=>put(l,"l"));
  // tapetes de patrocinador pintados no chão: por dentro da curva (grama) ou na saída por fora, só onde não pega pista,
  // brita, água, box, muro ou outro objeto. Até 10 por circuito, nas curvas mais fortes.
  const mats=[];if(typeof SPONSOR_CAT!=="undefined"){const SC=SPONSOR_CAT;let hs=0;for(const ch of id)hs=(hs*131+ch.charCodeAt(0))>>>0;
    const Lm=m(40),Wm=m(9),nMat=th.tapetes??10;const inG=(x,y)=>(TG.gravel||[]).some(gr=>gr.pts&&inPoly(x,y,gr.pts));const pitP=(TG.pit||[]).filter((_,k)=>k%3===0);
    const TunM=tunnelRange({id:id,corners:TG.corners,N:M});const ok=(x,y,h,lat,i)=>{if(TunM&&i>=TunM.a*M-40&&i<=TunM.b*M+40)return false;const c=Math.cos(h),sn=Math.sin(h);for(const[u,v]of[[0,0],[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){const px=x+c*u*Lm-sn*v*Wm,py=y+sn*u*Lm+c*v*Wm;const dt=dTrack(px,py,m(40));
        if(dt<TW+m(3))return false;if(isWater(px,py,dt)||inG(px,py))return false;if(pitP.some(q=>Math.hypot(q.x-px,q.y-py)<m(14)))return false}
      const sg=lat>0?1:-1,W=wl[sg]&&wl[sg][i],ac=Math.abs(Math.sin(h-TG.heading[i]))>.5?Lm/2:Wm/2;if(W!=null&&Math.abs(lat)+ac>W-m(1.5))return false;if(nearExtra(x,y,m(14)))return false;
      if(mats.some(o=>Math.hypot(o.x-x,o.y-y)<m(90)))return false;if((TG.stands||[]).some(o=>Math.hypot(o.x-x,o.y-y)<m(34)))return false;return true};
    const cs=TG.corners.filter(c=>(c.sev||0)>=.12).slice().sort((a,b)=>(b.sev||0)-(a.sev||0));
    for(const c of cs){if(mats.length>=nMat)break;const sp=clamp(Math.round((c.r||60)/DS*.3),5,20);
      for(const[di,lat]of[[0,c.dir*(TW+m(14))],[Math.round(sp*1.6),-c.dir*(TW+m(13))],[-Math.round(sp*1.8),-c.dir*(TW+m(13))],[Math.round(sp*3),c.dir*(TW+m(14))]]){const i=((c.i+di)%M+M)%M,h=TG.heading[i];
        const x=P[i].x-Math.sin(h)*lat,y=P[i].y+Math.cos(h)*lat;/* texto sempre deitado na tela: se a pista corre "para baixo", o tapete gira 90° */const ex=(Math.cos(h)-Math.sin(h))*ISO_C,ey=(Math.cos(h)+Math.sin(h))*ISO_S,hm=Math.abs(ey)>Math.abs(ex)*.9?h+Math.PI/2:h;if(ok(x,y,hm,lat,i)){mats.push({x,y,h:hm,L:Lm,sp:SC[(hs+mats.length*5)%SC.length].id});break}}}}
  // circuito de rua: faixas de patrocinador no alambrado dos muros (só nas faces viradas para a câmera, em trechos retos)
  const banners=[];
  if(typeof SPONSOR_CAT!=="undefined"&&th.faixas!==0){const SC=SPONSOR_CAT;let hs=7;for(const ch of id)hs=(hs*37+ch.charCodeAt(0))>>>0;const span=Math.max(3,Math.round(18/DS)),gap=Math.max(span+2,Math.round(85/DS));
    const TunB=tunnelRange({id:id,corners:TG.corners,N:M});
    for(const sg of[1,-1]){const a=wl[sg];if(!a)continue;for(let i=0;i<M;i+=2){const j=(i+span)%M,h=TG.heading[i];if(TunB&&i+span>=TunB.a*M-6&&i<=TunB.b*M+6)continue;if(Math.abs(a[i]-a[j])>m(.8)||a[i]>TW+m(7))continue;
      const nx=Math.sin(h)*sg,ny=-Math.cos(h)*sg;if(nx+ny<.6)continue;/* normal do muro (aponta para a pista) precisa olhar para a câmera */
      let dh=TG.heading[j]-h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));if(Math.abs(dh)>.12)continue;
      banners.push({i,j,sg,sp:SC[(hs+banners.length*3)%SC.length].id});i+=gap}}}
  TG.scn={th,water,trees,bld,lms,peaks,wl,kerbs,mats,banners,lights,inS,ac:{x:ax,y:ay},isWater,cells,RC,maxH,clipN,dOther};if(BP&&typeof baiaBuild==="function")baiaBuild(TG,TG.scn,dTrack);SPR.reset();return TG.scn}
// blocos que cobrem a tela (com folga embaixo para prédios altos cuja base está fora da tela)
function visCells(S,cw,ch,extra){const Z=CAM.z;const inv=(sx,sy)=>{const a=(sx-cw/2-CAM.sx)/Z+CAM.x,b=(sy-ch/2-CAM.sy)/Z+CAM.y;const u=a/ISO_C,v=b/ISO_S;return[(u+v)/2,(v-u)/2]};
  const mg=60+(extra||0)*S.RC*Z,bot=S.maxH*Z+80+(extra||0)*S.RC*Z;const P=[inv(-mg,-mg),inv(cw+mg,-mg),inv(-mg,ch+bot),inv(cw+mg,ch+bot)];
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const[x,y]of P){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
  const out=[];const i0=Math.floor(x0/S.RC),i1=Math.floor(x1/S.RC),j0=Math.floor(y0/S.RC),j1=Math.floor(y1/S.RC);if((i1-i0+1)*(j1-j0+1)>4000)return null;
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const c=S.cells.get(i+":"+j);if(c)out.push(c)}return out}
// ---------- imagens prontas (sprites) de prédios e árvores, por faixa de zoom; preparadas aos poucos e liberadas quando longe
const SPR={n:0,budget:0,trees:new Map(),last:0,bytes:0,live:new Map(),frame:0,reset(){for(const b of[...this.live.keys()])sprDrop(b);this.n=0;this.bytes=0;this.live.clear();this.trees.clear();if(typeof TRACKGEO!=="undefined"&&TRACKGEO&&TRACKGEO.scn)TRACKGEO.scn.bld.forEach(b=>{b._spr=null})}};
// memória das imagens de prédios: cada imagem é um canvas guardado na memória de vídeo. Em pistas de rua (Mônaco, Singapura, Baku, Las Vegas)
// há centenas de prédios; sem limite, isso passava de 900 MB e o navegador do celular fechava a aba e recarregava a página.
// Agora há um teto em bytes: as imagens usadas há mais tempo são liberadas, e se o teto estiver cheio o prédio é desenhado direto.
function sprLow(){if(typeof devLow==="function")return devLow();try{return (navigator.deviceMemory||8)<=4||matchMedia("(pointer:coarse)").matches}catch(e){return false}}
function sprCap(){if(SPR._cap)return SPR._cap;return SPR._cap=(sprLow()?56:150)*1e6}
function sprDprB(){return Math.min(sprLow()?1:1.25,sprDpr())}
function sprBytes(s){let n=0;if(s)for(const c of[s.cv,s.day&&s.day.cv,s.lit&&s.lit.cv])if(c)n+=c.width*c.height*4;return n}
function sprFree(s){if(s)for(const c of[s.cv,s.day&&s.day.cv,s.lit&&s.lit.cv])if(c){c.width=0;c.height=0}}
function sprDrop(b){const s=b._spr;if(s){SPR.bytes-=s.bytes||0;SPR.n--;sprFree(s)}SPR.live.delete(b);b._spr=null}
function sprPut(b,n){sprDrop(b);n.bytes=sprBytes(n);b._spr=n;SPR.bytes+=n.bytes;SPR.n++;SPR.live.set(b,SPR.frame);sprTrim()}
function sprTouch(b){if(SPR.live.has(b)){SPR.live.delete(b);SPR.live.set(b,SPR.frame)}}
// libera as mais antigas até caber; não mexe nas usadas neste quadro
function sprTrim(extra){const cap=sprCap()-(extra||0);for(const[b,f]of SPR.live){if(SPR.bytes<=cap)break;if(f===SPR.frame)break;sprDrop(b)}return SPR.bytes<=cap}
function zBucket(Z){return Math.pow(1.25,Math.round(Math.log(Z)/Math.log(1.25)))}
function sprDpr(){return typeof qDpr==="function"?qDpr():Math.min(2,(typeof window!=="undefined"&&window.devicePixelRatio)||1)}
// desenha algo num canvas próprio com a câmera centrada no ponto (x,y)
function bakeAt(x,y,zb,pts,fn,dd){const sv={x:CAM.x,y:CAM.y,z:CAM.z,sx:CAM.sx,sy:CAM.sy};const[ix,iy]=iso(x,y);CAM.x=ix;CAM.y=iy;CAM.z=zb;CAM.sx=0;CAM.sy=0;
  try{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of pts){const q=toScreen(p[0],p[1],p[2],0,0);x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}
    const pad=4,W=Math.ceil(x1-x0+2*pad),H=Math.ceil(y1-y0+2*pad);if(W<2||H<2||W*H>900000)return null;const d=dd||sprDpr();const cv=document.createElement("canvas");cv.width=Math.ceil(W*d);cv.height=Math.ceil(H*d);
    const c=cv.getContext("2d");c.setTransform(d,0,0,d,0,0);CAM.sx=-x0+pad;CAM.sy=-y0+pad;c.lineJoin="round";c.lineCap="round";fn(c);return{cv,ax:-x0+pad,ay:-y0+pad,w:W,h:H,zb}}
  finally{Object.assign(CAM,sv)}}
function bakeBuilding(b,zb,night){const cor=boxCorners(b.x,b.y,b.w,b.d,b.ang);const pts=[];for(const p of cor){pts.push([p.x,p.y,0],[p.x,p.y,b.h+4*WS],[p.x+b.h*.45,p.y+b.h*.1,0])}
  const d=sprDprB();if(!sprTrim(2.2e6))return null;// sem espaço: o prédio é desenhado direto neste quadro
  const body=bakeAt(b.x,b.y,zb,pts,c=>drawBuilding(c,0,0,b,zb,true,[]),d);if(!body)return null;
  if(zb>=.45){const w=bakeAt(b.x,b.y,zb,pts,c=>drawWindows(c,0,0,b,zb,!!night),d);if(night)body.lit=w;else body.day=w}body.night=!!night;
  return body}
function drawSprite(ctx,cw,ch,s,x,y,Z){const sc=Z/s.zb;const q=toScreen(x,y,0,cw,ch);ctx.drawImage(s.cv,q[0]-s.ax*sc,q[1]-s.ay*sc,s.w*sc,s.h*sc)}
function treeKey(t,zb){return t.k+"|"+Math.round(t.s*4)+"|"+Math.min(2,Math.floor(t.c*3))+"|"+zb}
function treeSprite(t,zb){const k=treeKey(t,zb);let s=SPR.trees.get(k);if(s!==undefined)return s;if(SPR.budget<=0)return null;SPR.budget--;
  const tt={x:0,y:0,s:Math.round(t.s*4)/4,c:(Math.min(2,Math.floor(t.c*3))+.5)/3,k:t.k};const r=26*WS*tt.s;
  s=bakeAt(0,0,zb,[[-r,-r,0],[r,r,0],[r,-r,0],[-r,r,0],[0,0,26*WS*tt.s]],c=>drawTree(c,0,0,tt,zb));SPR.trees.set(k,s);if(SPR.trees.size>400)SPR.trees.delete(SPR.trees.keys().next().value);return s}
// libera imagens de blocos que ficaram longe
function sprSweep(S,now){if(now-SPR.last<2)return;SPR.last=now;for(const c of S.cells.values()){if(now-c.seen>8&&c.b.length){for(const b of c.b){if(b._spr)sprDrop(b)}}}}
function pick2(rng,a){return a[Math.floor(rng()*a.length)]}
// lateral do muro (para posicionar batidas)
function sceneWallLat(f,sign){const g=TRACKGEO;if(!g||!g.scn)return null;const i=Math.round(fr(f)*g.M)%g.M;const a=g.scn.wl[sign>0?1:-1];return a?a[i]:null}

// ---------- chão: base, água, faixa de grama/calçada ao redor da pista
// ---------- chão em blocos prontos: cada pedaço da tela vira uma imagem guardada (por faixa de zoom), preparada aos poucos
const GCH={map:new Map(),cap:36,px:384,id:""};
function drawGround(ctx,cw,ch,detail,wet,night){const g=TRACKGEO;
  const main=ctx.canvas&&ctx.canvas.id==="rc";if(!main||typeof document==="undefined"){return drawGroundRaw(ctx,cw,ch,detail,wet,night)}
  if(GCH.id!==g.id){GCH.map.clear();GCH.id=g.id}
  const Z=CAM.z;if(!GCH.zb||Z/GCH.zb>1.32||Z/GCH.zb<.76)GCH.zb=zBucket(Z);const zb=GCH.zb,L=GCH.px/zb,wk=(wet>.3?1:0)+(detail?2:0);const a0=(-cw/2-CAM.sx)/Z+CAM.x,a1=(cw/2-CAM.sx)/Z+CAM.x,b0=(-ch/2-CAM.sy)/Z+CAM.y,b1=(ch/2-CAM.sy)/Z+CAM.y;
  const i0=Math.floor(a0/L),i1=Math.floor(a1/L),j0=Math.floor(b0/L),j1=Math.floor(b1/L);if((i1-i0+1)*(j1-j0+1)>40)return drawGroundRaw(ctx,cw,ch,detail,wet,night);
  let budget=3;const need=[];const got=[];
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=zb+"|"+wk+"|"+i+"|"+j;let c=GCH.map.get(k);if(c){GCH.map.delete(k);GCH.map.set(k,c);got.push([c,i,j])}else need.push([k,i,j])}
  for(const n of need){if(budget<=0||(typeof perfBudget==="function"&&!perfBudget(5)&&got.length))break;budget--;const c=bakeChunk(n[1],n[2],L,zb,wet,detail);if(c){GCH.map.set(n[0],c);got.push([c,n[1],n[2]])}}
  const gcap=typeof mapSimple==="function"&&mapSimple()?10:GCH.cap;while(GCH.map.size>gcap)GCH.map.delete(GCH.map.keys().next().value);
  if(got.length<(i1-i0+1)*(j1-j0+1)){// pedaços que ainda não ficaram prontos: desenha só eles, recortados (o resto vem pronto)
    const have=new Set(got.map(g=>g[1]+":"+g[2]));ctx.save();ctx.beginPath();for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){if(have.has(i+":"+j))continue;const x=Math.floor((i*L-CAM.x)*Z+cw/2+CAM.sx),y=Math.floor((j*L-CAM.y)*Z+ch/2+CAM.sy),w=Math.ceil(L*Z)+1;ctx.rect(x,y,w,w)}ctx.clip();drawGroundRaw(ctx,cw,ch,detail,wet,night,true);ctx.restore()}
  for(const[c,i,j]of got){const x=Math.floor((i*L-CAM.x)*Z+cw/2+CAM.sx),y=Math.floor((j*L-CAM.y)*Z+ch/2+CAM.sy),w=Math.ceil(L*Z)+1;ctx.drawImage(c,x,y,w,w)}
  if(!detail)groundBlobs(ctx,cw,ch,night)}
function bakeChunk(i,j,L,zb,wet,detail){const d=Math.min(1.25,sprDpr()),px=GCH.px;const cv=document.createElement("canvas");cv.width=cv.height=Math.ceil(px*d);const c=cv.getContext("2d");c.setTransform(d,0,0,d,0,0);
  const sv={x:CAM.x,y:CAM.y,z:CAM.z,sx:CAM.sx,sy:CAM.sy};CAM.x=(i+.5)*L;CAM.y=(j+.5)*L;CAM.z=zb;CAM.sx=0;CAM.sy=0;c.lineJoin="round";c.lineCap="round";
  try{drawGroundRaw(c,px,px,detail,wet,false,true)}catch(e){return null}finally{Object.assign(CAM,sv)}return cv}
function drawGroundRaw(ctx,cw,ch,detail,wet,night,noBlobs){const g=TRACKGEO,S=g.scn,th=S.th,T=texInit(ctx),Z=CAM.z;const GC=GROUND[th.g]||GROUND.park;const urban=/urban/i.test(th.g);
  const isl=!!th.island;const now=performance.now()/1000;
  const wetK=wet>.3?.82:1;const col=c=>wetK<1?shade(c,wetK):c;
  ctx.fillStyle=isl?WATER_C:col(GC[0]);ctx.fillRect(0,0,cw,ch);
  const fillPat=(tile,mpx,a,ox,oy)=>{const p=wpat(ctx,tile,mpx,cw,ch,ox,oy);if(!p)return;ctx.save();ctx.globalAlpha=a;ctx.fillStyle=p;ctx.fillRect(0,0,cw,ch);ctx.restore()};
  if(isl){fillPat(T.water,.6,1,now*1.5,0)}
  else if(urban){fillPat(T.city,90/128,.9)}
  else{if(th.g==="dunes"||th.g==="desert"){fillPat(T.sand,.9,1);if(th.g==="dunes")fillPat(T.tufts,.7,1)}else{if(detail)fillPat(T.stripe,12/32,1);fillPat(T.grass,.35,.8)}}
  // morros e montanhas ao fundo
  for(const pk of S.peaks){const s=toScreen(pk.x,pk.y,0,cw,ch);if(s[0]<-pk.r*Z*2||s[0]>cw+pk.r*Z*2||s[1]<-pk.h*Z*2||s[1]>ch+pk.r*Z)continue;
    const L=toScreen(pk.x-pk.r,pk.y,0,cw,ch),Rr=toScreen(pk.x,pk.y-pk.r,0,cw,ch),F=toScreen(pk.x+pk.r*.5,pk.y+pk.r*.5,0,cw,ch),top=toScreen(pk.x,pk.y,pk.h,cw,ch);
    const base=th.mountains?"#56705A":"#4F7E42";ctx.fillStyle=shade(base,.75+pk.c*.1);poly(ctx,[L,top,F]);ctx.fill();ctx.fillStyle=shade(base,.95+pk.c*.1);poly(ctx,[F,top,Rr]);ctx.fill();
    if(pk.snow){const k=.3;const l2=[L[0]+(top[0]-L[0])*(1-k),L[1]+(top[1]-L[1])*(1-k)],f2=[F[0]+(top[0]-F[0])*(1-k),F[1]+(top[1]-F[1])*(1-k)],r2=[Rr[0]+(top[0]-Rr[0])*(1-k),Rr[1]+(top[1]-Rr[1])*(1-k)];
      ctx.fillStyle="#E8EEF2";poly(ctx,[l2,top,f2]);ctx.fill();ctx.fillStyle="#FFFFFF";poly(ctx,[f2,top,r2]);ctx.fill()}}
  // água
  if(!isl)for(const w of S.water){ctx.beginPath();w.forEach((p,i)=>{const s=toScreen(p.x,p.y,0,cw,ch);i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1])});ctx.closePath();
    ctx.fillStyle=WATER_C;ctx.fill();const p=wpat(ctx,T.water,.6,cw,ch,now*1.5,0);if(p){ctx.fillStyle=p;ctx.fill()}ctx.strokeStyle="rgba(230,240,250,.35)";ctx.lineWidth=Math.max(1,2.2*WS*Z);ctx.stroke()}
  if(S.baia&&typeof baiaGround==="function")baiaGround(ctx,cw,ch,Z,detail);
  // ilha / faixa de terra ao redor da pista
  const imx=(th.island+12)*WS*Z+60;if(isl){pathScreen(ctx,g.path,cw,ch,true,0,imx);ctx.strokeStyle="#D8D2B8";ctx.lineWidth=(th.island*2+10)*WS*Z;ctx.stroke();pathScreen(ctx,g.path,cw,ch,true,0,imx);ctx.strokeStyle=col(GC[0]);ctx.lineWidth=th.island*2*WS*Z;ctx.stroke();
    const p=wpat(ctx,T.grass,.35,cw,ch);if(p){pathScreen(ctx,g.path,cw,ch,true,0,imx);ctx.strokeStyle=p;ctx.globalAlpha=.8;ctx.stroke();ctx.globalAlpha=1}}
  // verge: grama mais clara (circuito permanente) ou calçada (rua)
  pathScreen(ctx,g.path,cw,ch,true);ctx.strokeStyle=col(GC[2]);ctx.lineWidth=(TW*2+(urban?16:44)*WS)*Z;ctx.stroke();
  if(!urban&&detail){const p=wpat(ctx,T.grass,.3,cw,ch);if(p){pathScreen(ctx,g.path,cw,ch,true);ctx.strokeStyle=p;ctx.globalAlpha=.7;ctx.stroke();ctx.globalAlpha=1}}
  if(urban&&detail){pathScreen(ctx,g.path,cw,ch,true);ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=(TW*2+16*WS)*Z;ctx.setLineDash([3*WS*Z,3*WS*Z]);ctx.stroke();ctx.setLineDash([])}
  // árvores e prédios vistos de longe (sem detalhe): manchas
  if(!detail&&!noBlobs)groundBlobs(ctx,cw,ch,night)}
function groundBlobs(ctx,cw,ch,night){const g=TRACKGEO,S=g.scn,th=S.th,Z=CAM.z;const vc=visCells(S,cw,ch);const TL=vc?vc.flatMap(c=>c.t):S.trees,BL=vc?vc.flatMap(c=>c.b):S.bld;ctx.fillStyle=th.tr==="palm"?"rgba(40,90,40,.6)":"rgba(26,70,30,.55)";for(const t of TL){const s=toScreen(t.x,t.y,0,cw,ch);if(s[0]<-4||s[0]>cw+4||s[1]<-4||s[1]>ch+4)continue;ctx.beginPath();ctx.arc(s[0],s[1],Math.max(1.2,8*WS*Z*t.s),0,7);ctx.fill()}
    for(const b of BL){const s=toScreen(b.x,b.y,0,cw,ch);if(s[0]<-10||s[0]>cw+10||s[1]<-10||s[1]>ch+10)continue;const w=Math.max(1.5,b.w*Z*.7);ctx.fillStyle=shade(b.c,.8);ctx.fillRect(s[0]-w/2,s[1]-w/2-Math.min(6,b.h*Z*.15),w,w*.6+Math.min(6,b.h*Z*.15));if(night&&b.lit>.3){S.nl=S.nl||[];S.nl.push([s[0],s[1]-w*.3])}}}

// pista com textura de asfalto
function trackPattern(ctx,cw,ch){const T=texInit(ctx);return wpat(ctx,T.asph,.12,cw,ch)}
function gravelPattern(ctx,cw,ch){const T=texInit(ctx);return wpat(ctx,T.gravel,.18,cw,ch)}

// muros, alambrado, guard-rail e zebras
function drawBarriers(ctx,cw,ch,street){const g=TRACKGEO,S=g.scn,M=g.M,Z=CAM.z;if(Z<.3)return;const step=Z>.8?1:2;
  for(const sg of[1,-1]){const a=S.wl[sg];let run=[];const flush=()=>{if(run.length<2){run=[];return}
      const base=run.map(r=>r[0]),top=run.map(r=>r[1]);
      if(street){ctx.beginPath();base.forEach((s,i)=>i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]));for(let i=top.length-1;i>=0;i--)ctx.lineTo(top[i][0],top[i][1]);ctx.closePath();ctx.fillStyle="rgba(205,215,225,.10)";ctx.fill();
        ctx.beginPath();top.forEach((s,i)=>i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]));ctx.strokeStyle="rgba(170,180,190,.55)";ctx.lineWidth=1;ctx.stroke();
        ctx.beginPath();run.forEach((r,i)=>{if(i%4===0){ctx.moveTo(r[0][0],r[0][1]);ctx.lineTo(r[1][0],r[1][1])}});ctx.strokeStyle="rgba(120,128,138,.6)";ctx.stroke();
        ctx.beginPath();base.forEach((s,i)=>i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]));ctx.strokeStyle="#9AA3AD";ctx.lineWidth=Math.max(2,1.3*WS*Z);ctx.stroke();ctx.strokeStyle="#E1E5EA";ctx.lineWidth=Math.max(1,.5*WS*Z);ctx.stroke()}
      else{ctx.beginPath();base.forEach((s,i)=>i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]));ctx.strokeStyle="#8C949E";ctx.lineWidth=Math.max(1.2,.6*WS*Z);ctx.stroke();
        ctx.beginPath();run.forEach((r,i)=>{if(i%3===0){ctx.moveTo(r[0][0],r[0][1]);ctx.lineTo(r[2][0],r[2][1])}});ctx.strokeStyle="#5E656E";ctx.lineWidth=1;ctx.stroke()}
      run=[]};
    for(let i=0;i<=M;i+=step){const ii=i%M,L=a[ii];const p=g.path[ii],h=g.heading[ii],nx=-Math.sin(h)*sg,ny=Math.cos(h)*sg;const x=p.x+nx*L,y=p.y+ny*L;const s=toScreen(x,y,0,cw,ch);
      if(!onScreen(s,cw,ch,60)){flush();continue}run.push([s,toScreen(x,y,(street?4:0)*WS,cw,ch),toScreen(x,y,.9*WS,cw,ch)])}flush()}
  if(street&&S.banners&&typeof drawBanners==="function")drawBanners(ctx,cw,ch,Z)}
function drawKerbs(ctx,cw,ch,street){const g=TRACKGEO,S=g.scn,M=g.M,Z=CAM.z;const kp=[new Path2D(),new Path2D()];const off=TW-.55*WS;
  for(const k of S.kerbs){for(let q=k.a;q<k.b;q++){const i=(q%M+M)%M,j=(i+1)%M;const p=g.path[i],pp=g.path[j],h=g.heading[i],h2=g.heading[j];
    const a=toScreen(p.x-Math.sin(h)*off*k.s,p.y+Math.cos(h)*off*k.s,0,cw,ch);if(!onScreen(a,cw,ch,30))continue;const b=toScreen(pp.x-Math.sin(h2)*off*k.s,pp.y+Math.cos(h2)*off*k.s,0,cw,ch);const P2=kp[(q>>(street?0:0))%2?1:0];P2.moveTo(a[0],a[1]);P2.lineTo(b[0],b[1])}}
  ctx.lineCap="butt";ctx.lineWidth=1.6*WS*Z;ctx.strokeStyle=street?"#D84040":"#E53935";ctx.stroke(kp[0]);ctx.strokeStyle="#F5F5F5";ctx.stroke(kp[1]);ctx.lineCap="round"}

// ---------- objetos com profundidade
function sceneItems(items,post,ctx,cw,ch,night,now,detail){const g=TRACKGEO,S=g.scn,Z=CAM.z,th=S.th;const m=v=>v*WS;
  const vis=(x,y,r)=>{const s=toScreen(x,y,0,cw,ch);return s[0]>-r*Z-40&&s[0]<cw+r*Z+40&&s[1]>-r*Z*1.6-60&&s[1]<ch+r*Z*.6+40};
  if(!detail){for(const o of S.lms)if(o.k!=="yachts"&&o.k!=="bowl")lmItems(o,items,post,ctx,cw,ch,night,now,vis);if(S.baia&&typeof baiaItems==="function")baiaItems(items,post,ctx,cw,ch,night,now,false);return}
  const vc=visCells(S,cw,ch)||[...S.cells.values()];const tnow=now;const zb=zBucket(Z);const pip=ctx.canvas&&ctx.canvas!==document.getElementById("rc");const simple=typeof mapSimple==="function"&&mapSimple();if(simple&&(SPR.n||SPR.trees.size))SPR.reset();SPR.budget=(pip||simple)?0:6;if(!pip)SPR.frame++;
  const TL=[],BL=[],LL=[];for(const c of vc){c.seen=tnow;for(const t of c.t)TL.push(t);for(const b of c.b)BL.push(b);for(const l of c.l)LL.push(l)}
  const fewTrees=simple||(typeof QL!=="undefined"&&QL.lvl===0);for(const t of TL){if(fewTrees&&((t.x*7+t.y*13)|0)%2)continue;if(!vis(t.x,t.y,m(30)))continue;items.push({d:t.x+t.y,draw:()=>{const sp=treeSprite(t,zb);if(sp)drawSprite(ctx,cw,ch,sp,t.x,t.y,Z);else drawTree(ctx,cw,ch,t,Z)}})}
  for(const b of BL){if(!vis(b.x,b.y,Math.max(b.w,b.h)))continue;items.push({d:b.x+b.y,draw:()=>{let sp=b._spr;const ok=sp&&Z/sp.zb>.66&&Z/sp.zb<1.5;
      if(sp&&sp.night!==!!night){sprDrop(b);sp=null}if(sp)sprTouch(b);
      if((!sp||sp.zb!==zb)&&SPR.budget>0&&Z>=.3&&(typeof perfBudget!=="function"||perfBudget(3))){SPR.budget--;const n=bakeBuilding(b,zb,night);if(n){sprPut(b,n);sp=n}}
      if(sp&&(ok||sp.zb===zb)){drawSprite(ctx,cw,ch,sp,b.x,b.y,Z);const wl=night?sp.lit:sp.day;if(wl&&Z>=.45){if(night)post.push(()=>drawSprite(ctx,cw,ch,wl,b.x,b.y,Z));else drawSprite(ctx,cw,ch,wl,b.x,b.y,Z)}}
      else drawBuilding(ctx,cw,ch,b,Z,night,post,true)}})}
  // prepara os blocos vizinhos (na direção em que a câmera anda) com o que sobrar do orçamento
  if(!pip&&!simple){sprSweep(S,tnow);const ring=visCells(S,cw,ch,1)||[];for(const c of ring){if(SPR.budget<=0)break;c.seen=Math.max(c.seen,tnow-1);for(const b of c.b){if(SPR.budget<=0||(typeof perfBudget==="function"&&!perfBudget(4)))break;if(b._spr&&b._spr.zb===zb)continue;if(SPR.bytes>sprCap()*.8)break;SPR.budget--;const n=bakeBuilding(b,zb,night);if(n)sprPut(b,n)}}}
  for(const L of LL){if(!vis(L.x,L.y,m(20)))continue;items.push({d:L.x+L.y,draw:()=>{const a=toScreen(L.x,L.y,0,cw,ch),b=toScreen(L.x,L.y,m(14),cw,ch);ctx.strokeStyle="#3A4048";ctx.lineWidth=Math.max(1,.5*WS*Z);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
    ctx.fillStyle="#FFF6D8";ctx.fillRect(b[0]-2*Z*WS*.5,b[1]-1,4*Z*WS*.5,2);post.push(()=>{const r=Math.max(6,m(9)*Z);const gr=ctx.createRadialGradient(b[0],b[1],0,b[0],b[1],r);gr.addColorStop(0,"rgba(255,246,216,.55)");gr.addColorStop(1,"rgba(255,246,216,0)");ctx.fillStyle=gr;ctx.beginPath();ctx.arc(b[0],b[1],r,0,7);ctx.fill()})}})}
  for(const o of S.lms)lmItems(o,items,post,ctx,cw,ch,night,now,vis);if(S.baia&&typeof baiaItems==="function")baiaItems(items,post,ctx,cw,ch,night,now,detail)}
function drawTree(ctx,cw,ch,t,Z){const s=toScreen(t.x,t.y,0,cw,ch);const q=WS*Z*t.s;
  ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.ellipse(s[0]+4*q,s[1]+1*q,9*q,4*q,0,0,7);ctx.fill();
  if(t.k==="pine"){const top=toScreen(t.x,t.y,22*WS*t.s,cw,ch);ctx.fillStyle="#4A3420";ctx.fillRect(s[0]-.6*q,s[1]-4*q,1.2*q,4*q);
    const c1=t.c<.5?"#1E4D2B":"#24592F",c2=t.c<.5?"#2C6A3A":"#347843";for(let k=0;k<3;k++){const y=s[1]-(3+k*5)*q,w=(8-k*2.2)*q,yt=k===2?top[1]:s[1]-(11+k*5)*q;
      ctx.fillStyle=c1;ctx.beginPath();ctx.moveTo(s[0],yt);ctx.lineTo(s[0]-w,y);ctx.lineTo(s[0],y+1.4*q);ctx.fill();ctx.fillStyle=c2;ctx.beginPath();ctx.moveTo(s[0],yt);ctx.lineTo(s[0]+w,y);ctx.lineTo(s[0],y+1.4*q);ctx.fill()}}
  else if(t.k==="palm"){ctx.strokeStyle="#7A5B3A";ctx.lineWidth=Math.max(1,1.1*q);ctx.beginPath();ctx.moveTo(s[0],s[1]);ctx.quadraticCurveTo(s[0]+2*q,s[1]-8*q,s[0]+1*q,s[1]-15*q);ctx.stroke();
    const hx=s[0]+1*q,hy=s[1]-15*q;ctx.strokeStyle=t.c<.5?"#2F7D3A":"#3C8C43";ctx.lineWidth=Math.max(1,1.3*q);for(let k=0;k<6;k++){const a=k/6*Math.PI*2+t.c*3;ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo(hx+Math.cos(a)*4*q,hy+Math.sin(a)*1.6*q-3*q,hx+Math.cos(a)*7*q,hy+Math.sin(a)*3*q+1.5*q);ctx.stroke()}}
  else{ctx.fillStyle="#5A3F28";ctx.fillRect(s[0]-.7*q,s[1]-5*q,1.4*q,5*q);const c=t.c;const base=c<.33?"#2E6B30":c<.66?"#3A7A35":"#447F2E";
    ctx.fillStyle=shade(base,.72);ctx.beginPath();ctx.arc(s[0]-2.5*q,s[1]-8*q,5*q,0,7);ctx.arc(s[0]+2.8*q,s[1]-8.5*q,5.2*q,0,7);ctx.fill();
    ctx.fillStyle=base;ctx.beginPath();ctx.arc(s[0],s[1]-11*q,5.6*q,0,7);ctx.fill();ctx.fillStyle=shade(base,1.25);ctx.beginPath();ctx.arc(s[0]-1.6*q,s[1]-12.6*q,2.6*q,0,7);ctx.fill()}}
// prédio: caixa com sombra, janelas em faixas e telhado
function boxCorners(x,y,w,d,ang){const c=Math.cos(ang||0),s=Math.sin(ang||0);return[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>({x:x+u*c-v*s,y:y+u*s+v*c}))}
function drawBuilding(ctx,cw,ch,b,Z,night,post,noWin){const cor=boxCorners(b.x,b.y,b.w,b.d,b.ang);
  // sombra
  const sx=b.h*.45,sy=b.h*.1;ctx.fillStyle="rgba(0,0,0,.16)";poly(ctx,[cor[0],cor[1],{x:cor[1].x+sx,y:cor[1].y+sy},{x:cor[2].x+sx,y:cor[2].y+sy},{x:cor[3].x+sx,y:cor[3].y+sy},cor[3]].map(p=>toScreen(p.x,p.y,0,cw,ch)));ctx.fill();
  const T=isoBox(ctx,b.x,b.y,b.w,b.d,b.h,b.ang||0,b.rf?"#C0623E":shade(b.c,1.05),shade(b.c,.62),shade(b.c,.8),cw,ch);
  if(b.rf){ctx.strokeStyle="rgba(90,30,10,.35)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo((T[0][0]+T[1][0])/2,(T[0][1]+T[1][1])/2);ctx.lineTo((T[2][0]+T[3][0])/2,(T[2][1]+T[3][1])/2);ctx.stroke()}
  else if(b.h>40*WS&&Z>.35){isoBox(ctx,b.x,b.y,b.w*.3,b.d*.3,b.h+3*WS,b.ang||0,"#9AA1AA","#6E747C","#82888F",cw,ch)}
  if(Z<.45||noWin)return;
  if(night)post.push(()=>drawWindows(ctx,cw,ch,b,Z,true));else drawWindows(ctx,cw,ch,b,Z,false)}
function drawWindows(ctx,cw,ch,b,Z,lit0){const cor=boxCorners(b.x,b.y,b.w,b.d,b.ang);
  // janelas nas duas faces visíveis
  const B=cor.map(p=>toScreen(p.x,p.y,0,cw,ch));const cY=(B[0][1]+B[2][1])/2;const rows=Math.min(18,Math.floor(b.h/(3.6*WS)));const step=b.h/(rows+1);
  const faces=[];for(let i=0;i<4;i++){const j=(i+1)%4;if((B[i][1]+B[j][1])/2>=cY)faces.push([cor[i],cor[j]])}
  const draw=(lit)=>{ctx.lineWidth=Math.max(1,1.4*WS*Z*.6);ctx.setLineDash([Math.max(1.5,1.6*WS*Z),Math.max(1,1.1*WS*Z)]);ctx.beginPath();
    for(const[p,q]of faces)for(let r=1;r<=rows;r++){const z=step*r;const a=toScreen(p.x+(q.x-p.x)*.06,p.y+(q.y-p.y)*.06,z,cw,ch),c=toScreen(q.x+(p.x-q.x)*.06,q.y+(p.y-q.y)*.06,z,cw,ch);ctx.moveTo(a[0],a[1]);ctx.lineTo(c[0],c[1])}
    ctx.strokeStyle=lit?`rgba(255,214,140,${.55+b.lit*.35})`:"rgba(40,55,70,.35)";ctx.stroke();ctx.setLineDash([])};
  draw(lit0)}

// ---------- pontos famosos
function lmItems(o,items,post,ctx,cw,ch,night,now,vis){const Z=CAM.z,m=v=>v*WS,L=o.L;
  switch(o.k){
  case"skyline":case"strip":for(const b of o.list){if(!vis(b.x,b.y,b.h))continue;items.push({d:b.x+b.y,draw:()=>{drawBuilding(ctx,cw,ch,b,Z,night,post);
      if(b.neon){const T=toScreen(b.x,b.y,b.h*.35,cw,ch);const w=b.w*Z*.5;post.push(()=>{ctx.fillStyle=b.neon;ctx.globalAlpha=night?.95:.7;ctx.fillRect(T[0]-w/2,T[1]-3*Z*WS,w,2.6*Z*WS);ctx.globalAlpha=1})}}})}break;
  case"yachts":for(const y of o.list){if(!vis(y.x,y.y,y.l))continue;items.push({d:y.x+y.y,draw:()=>{const bob=Math.sin(now*1.3+y.ph)*.3*WS;const c=Math.cos(y.h),s=Math.sin(y.h);
      const pt=(u,v,z)=>toScreen(y.x+u*c-v*s,y.y+u*s+v*c,z+bob,cw,ch);const l=y.l/2,w=y.l*.16;ctx.fillStyle="rgba(0,20,40,.25)";poly(ctx,[pt(-l,-w,-bob),pt(l*.7,-w,-bob),pt(l,0,-bob),pt(l*.7,w,-bob),pt(-l,w,-bob)]);ctx.fill();
      ctx.fillStyle="#F4F6F8";poly(ctx,[pt(-l,-w,m(1.5)),pt(l*.7,-w,m(1.5)),pt(l,0,m(1.8)),pt(l*.7,w,m(1.5)),pt(-l,w,m(1.5))]);ctx.fill();ctx.fillStyle="#2B3440";poly(ctx,[pt(-l*.5,-w*.6,m(3.2)),pt(l*.3,-w*.6,m(3.2)),pt(l*.3,w*.6,m(3.2)),pt(-l*.5,w*.6,m(3.2))]);ctx.fill()}})}break;
  case"wheel":{if(!vis(o.x,o.y,m(L.r*2.4)))break;items.push({d:o.x+o.y,draw:()=>{const r=m(L.r),H=r+m(8),a=o.h,dx=Math.cos(a),dy=Math.sin(a),px=-dy,py=dx;
      const P=(t,rr)=>toScreen(o.x+dx*Math.cos(t)*(rr??r),o.y+dy*Math.cos(t)*(rr??r),H+Math.sin(t)*(rr??r),cw,ch);const hub=toScreen(o.x,o.y,H,cw,ch);
      ctx.strokeStyle="#C9D1DA";ctx.lineWidth=Math.max(1,.8*WS*Z);for(const sg of[1,-1]){const f=toScreen(o.x+px*sg*r*.35,o.y+py*sg*r*.35,0,cw,ch);ctx.beginPath();ctx.moveTo(f[0],f[1]);ctx.lineTo(hub[0],hub[1]);ctx.stroke()}
      ctx.lineWidth=Math.max(1,1.2*WS*Z);ctx.strokeStyle=night?"#7FD7FF":"#E9EEF3";ctx.beginPath();for(let k=0;k<=48;k++){const s=P(k/48*Math.PI*2);k?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1])}ctx.stroke();
      ctx.lineWidth=Math.max(.6,.4*WS*Z);ctx.beginPath();const rot=now*.05;for(let k=0;k<16;k++){const s=P(rot+k/16*Math.PI*2);ctx.moveTo(hub[0],hub[1]);ctx.lineTo(s[0],s[1])}ctx.stroke();
      for(let k=0;k<20;k++){const s=P(rot+k/20*Math.PI*2);ctx.fillStyle=["#E53935","#FFD54F","#42A5F5","#66BB6A"][k%4];const w=Math.max(2,2.6*WS*Z);ctx.fillRect(s[0]-w/2,s[1]-w*.2,w,w*.9)}}});break}
  case"tower":{if(!vis(o.x,o.y,m(90)))break;items.push({d:o.x+o.y,draw:()=>{const H=m(80);isoBox(ctx,o.x,o.y,m(7),m(7),H,0,"#D9DDE2","#9AA0A8","#B9BEC5",cw,ch);
      const top=toScreen(o.x,o.y,H,cw,ch);ctx.strokeStyle="#D7261E";ctx.lineWidth=Math.max(1,1*WS*Z);for(let k=0;k<12;k++){const a=Math.PI*.15+k/11*Math.PI*.7;const f=toScreen(o.x+Math.cos(a)*m(26),o.y+Math.sin(a)*m(26),0,cw,ch);ctx.beginPath();ctx.moveTo(top[0],top[1]);ctx.quadraticCurveTo((top[0]+f[0])/2+(f[0]-top[0])*.25,(top[1]+f[1])/2,f[0],f[1]);ctx.stroke()}
      const d=toScreen(o.x,o.y,H*.9,cw,ch);ctx.fillStyle="#EEF1F4";ctx.beginPath();ctx.ellipse(d[0],d[1],m(8)*Z,m(4)*Z,0,0,7);ctx.fill()}});break}
  case"sphere":{if(!vis(o.x,o.y,m(130)))break;items.push({d:o.x+o.y,draw:()=>{const r=m(56);const c=toScreen(o.x,o.y,r,cw,ch),b=toScreen(o.x,o.y,0,cw,ch);const R=r*Z*.98;
      ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(b[0]+R*.3,b[1],R,R*.5,0,0,7);ctx.fill();const hue=(now*18)%360;
      const gr=ctx.createRadialGradient(c[0]-R*.35,c[1]-R*.35,R*.1,c[0],c[1],R);gr.addColorStop(0,night?`hsl(${hue},95%,72%)`:"#C9D3DD");gr.addColorStop(.6,night?`hsl(${(hue+60)%360},90%,52%)`:"#8E9AA6");gr.addColorStop(1,night?`hsl(${(hue+140)%360},85%,30%)`:"#55606B");
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(c[0],c[1],R,0,7);ctx.fill();if(night)post.push(()=>{ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=.25;ctx.fillStyle=gr;ctx.beginPath();ctx.arc(c[0],c[1],R*1.15,0,7);ctx.fill();ctx.restore()})}});break}
  case"stadium":{if(!vis(o.x,o.y,o.r*1.6))break;const r=o.r;items.push({d:o.x+o.y-r,draw:()=>{const ell=(k,z,rr)=>{const pts=[];for(let q=0;q<=40;q++){const a=q/40*Math.PI*2;pts.push(toScreen(o.x+Math.cos(a)*rr,o.y+Math.sin(a)*rr*.72,z,cw,ch))}return pts};
      ctx.fillStyle="#3F8A3C";poly(ctx,ell(0,0,r*.55));ctx.fill();ctx.strokeStyle="#FFFFFF88";ctx.lineWidth=1;ctx.stroke();
      const n=28;for(let q=0;q<n;q++){const a=q/n*Math.PI*2;const x=o.x+Math.cos(a)*r*.82,y=o.y+Math.sin(a)*r*.82*.72;isoBox(ctx,x,y,2*Math.PI*r*.82/n,m(16),m(14+6*Math.abs(Math.sin(a))),a+Math.PI/2,"#C8CED6","#7D858F","#9AA2AC",cw,ch)}
      ctx.strokeStyle="#E8ECEF";ctx.lineWidth=Math.max(1.5,1.5*WS*Z);poly(ctx,ell(0,m(26),r*.95));ctx.stroke()}});break}
  case"bowl":for(const s of o.list){if(!vis(s.x,s.y,m(40)))continue;items.push({d:s.x+s.y,draw:()=>{const T=isoBox(ctx,s.x,s.y,s.w,m(18),m(12),s.h,"#B9C0CA","#6E7682","#8C95A1",cw,ch);
      const n=14;for(let k=0;k<n;k++){const u=k/n;const x=T[0][0]+(T[1][0]-T[0][0])*u,y=T[0][1]+(T[1][1]-T[0][1])*u+(T[3][1]-T[0][1])*((k*7)%10)/10;ctx.fillStyle=["#E53935","#FFFFFF","#21A04A"][k%3];ctx.fillRect(x,y-2,Math.max(1,1.4*WS*Z*.6),Math.max(1,1.4*WS*Z*.6))}}})}break;
  case"mbs":{if(!vis(o.x,o.y,m(260)))break;items.push({d:o.x+o.y,draw:()=>{const Q=[-o.D[1],o.D[0]];const H=m(190);for(let k=-1;k<=1;k++){const x=o.x+Q[0]*k*m(70),y=o.y+Q[1]*k*m(70);drawBuilding(ctx,cw,ch,{x,y,w:m(24),d:m(40),h:H,c:"#B8C9D6",lit:.8},Z,night,post)}
      const a=Math.atan2(Q[1],Q[0]);isoBox(ctx,o.x+Q[0]*m(20),o.y+Q[1]*m(20),m(330),m(38),H+m(8),a,"#E6ECF0","#9FAAB3","#BFC8CF",cw,ch)}});break}
  case"flames":{if(!vis(o.x,o.y,m(200)))break;items.push({d:o.x+o.y,draw:()=>{[[-60,0,180],[0,-40,160],[55,10,140]].forEach(([dx,dy,h])=>{const b=toScreen(o.x+m(dx),o.y+m(dy),0,cw,ch),t=toScreen(o.x+m(dx),o.y+m(dy),m(h),cw,ch);const w=m(22)*Z;
      const gr=ctx.createLinearGradient(b[0]-w,0,b[0]+w,0);gr.addColorStop(0,"#2E5D86");gr.addColorStop(.5,"#8EC3E6");gr.addColorStop(1,"#2B4F72");ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(b[0]-w,b[1]);
      ctx.bezierCurveTo(b[0]-w*1.4,b[1]-(b[1]-t[1])*.55,t[0]-w*.2,t[1]+(b[1]-t[1])*.25,t[0]+w*.25,t[1]);ctx.bezierCurveTo(t[0]+w*.5,t[1]+(b[1]-t[1])*.3,b[0]+w*1.3,b[1]-(b[1]-t[1])*.5,b[0]+w,b[1]);ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.25)";ctx.lineWidth=1;ctx.stroke()})}});break}
  case"halls":{for(let k=0;k<4;k++){const x=o.x+Math.cos(o.h)*m((k-1.5)*160),y=o.y+Math.sin(o.h)*m((k-1.5)*160);if(!vis(x,y,m(150)))continue;items.push({d:x+y,draw:()=>{const T=isoBox(ctx,x,y,m(140),m(70),m(18),o.h,"#EEF1F4","#A9B1BA","#C7CDD4",cw,ch);
      ctx.strokeStyle="rgba(120,130,140,.5)";ctx.lineWidth=1;ctx.beginPath();for(let q=1;q<6;q++){const u=q/6;ctx.moveTo(T[0][0]+(T[1][0]-T[0][0])*u,T[0][1]+(T[1][1]-T[0][1])*u);ctx.lineTo(T[3][0]+(T[2][0]-T[3][0])*u,T[3][1]+(T[2][1]-T[3][1])*u)}ctx.stroke()}})}break}
  case"wings":{if(!vis(o.x,o.y,m(200)))break;items.push({d:o.x+o.y+m(30),draw:()=>{for(const sg of[-1,1]){const x=o.x+Math.cos(o.h)*sg*m(90),y=o.y+Math.sin(o.h)*sg*m(90);
      const c=Math.cos(o.h),s=Math.sin(o.h);const pts=[[-80,-22,34],[80,-22,40],[80,22,30],[-80,22,26]].map(([u,v,z])=>toScreen(x+m(u)*c-m(v)*s,y+m(u)*s+m(v)*c,m(z),cw,ch));
      ctx.fillStyle="rgba(240,244,248,.92)";poly(ctx,pts);ctx.fill();ctx.strokeStyle="#9AA6B2";ctx.lineWidth=1;ctx.stroke();
      [[-70,-18],[70,-18]].forEach(([u,v])=>{const a=toScreen(x+m(u)*c-m(v)*s,y+m(u)*s+m(v)*c,0,cw,ch),b=toScreen(x+m(u)*c-m(v)*s,y+m(u)*s+m(v)*c,m(36),cw,ch);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()})}}});break}
  case"parque":{if(!vis(o.x,o.y,m(170)))break;items.push({d:o.x+o.y,draw:()=>{const R0=m(125);const rim=[],top=[];for(let k=0;k<=60;k++){const a=o.h+k/60*Math.PI*2,r=R0*(.78+.22*Math.cos(3*(a-o.h)));rim.push(toScreen(o.x+Math.cos(a)*r,o.y+Math.sin(a)*r,m(4),cw,ch));top.push(toScreen(o.x+Math.cos(a)*r*.55,o.y+Math.sin(a)*r*.55,m(20),cw,ch))}
      const C=toScreen(o.x,o.y,m(26),cw,ch),B=toScreen(o.x,o.y,0,cw,ch);ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(B[0]+R0*Z*.25,B[1],R0*Z*1.05,R0*Z*.55,0,0,7);ctx.fill();
      const gr=ctx.createLinearGradient(C[0]-R0*Z,C[1],C[0]+R0*Z,C[1]+R0*Z*.5);gr.addColorStop(0,"#E2352B");gr.addColorStop(1,"#8E140E");ctx.fillStyle=gr;poly(ctx,rim);ctx.fill();
      ctx.fillStyle="rgba(255,120,100,.25)";poly(ctx,top);ctx.fill();ctx.strokeStyle="rgba(90,10,6,.5)";ctx.lineWidth=1;ctx.beginPath();for(let k=0;k<60;k+=5){ctx.moveTo(C[0],C[1]);ctx.lineTo(rim[k][0],rim[k][1])}ctx.stroke();
      ctx.fillStyle="#FFD400";ctx.beginPath();ctx.ellipse(C[0],C[1],m(9)*Z,m(5)*Z,0,0,7);ctx.fill()}});break}
  case"yas":{const a=anchorAt(o.i);if(!vis(a.x,a.y,m(160)))break;const c=Math.cos(a.h),s=Math.sin(a.h),nx=-s,ny=c;
    for(const sg of[1,-1]){const x=a.x+nx*sg*(TW+m(30)),y=a.y+ny*sg*(TW+m(30));items.push({d:x+y,draw:()=>drawBuilding(ctx,cw,ch,{x,y,w:m(130),d:m(34),h:m(38),c:"#E7ECF0",ang:a.h,lit:.9},Z,night,post)})}
    post.push(()=>{const pts=[];for(let k=0;k<=24;k++){const t=k/24*Math.PI*2;const u=Math.cos(t)*m(80),v=Math.sin(t)*(TW+m(50));pts.push(toScreen(a.x+u*c+v*nx,a.y+u*s+v*ny,m(46)+Math.abs(Math.sin(t))*m(4),cw,ch))}
      const hue=(now*25)%360;ctx.fillStyle=night?`hsla(${hue},80%,60%,.32)`:"rgba(220,232,240,.28)";poly(ctx,pts);ctx.fill();ctx.strokeStyle=night?`hsla(${(hue+40)%360},90%,70%,.85)`:"rgba(160,175,190,.8)";ctx.lineWidth=Math.max(1,.4*WS*Z);ctx.stroke();
      ctx.beginPath();for(let q=-6;q<=6;q++){const u=q*m(12);const A=toScreen(a.x+u*c+(TW+m(45))*nx-m(40)*c,a.y+u*s+(TW+m(45))*ny-m(40)*s,m(47),cw,ch),B=toScreen(a.x+u*c-(TW+m(45))*nx+m(40)*c,a.y+u*s-(TW+m(45))*ny+m(40)*s,m(47),cw,ch);ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1])}
      ctx.strokeStyle=night?`hsla(${(hue+90)%360},90%,70%,.35)`:"rgba(150,165,180,.35)";ctx.stroke()});break}
  }}
function anchorAt(i){const g=TRACKGEO;const p=g.path[i];return{x:p.x,y:p.y,h:g.heading[i]}}

// ficha de um circuito (para os outros arquivos)
function fichaOf(id){return SCN[id]||{}}
