// ===================== CORPO INTEIRO: piloto de pé, para as cenas de comemoração =====================
// Proporção de ~7,5 cabeças, ombro estreito, cintura marcada. A cabeça é a mesma do jogo (AV.Rig sem tronco).
(function(GL){
const NS="http://www.w3.org/2000/svg";let AV,tom,luz,esc;const liga=()=>{if(!AV){AV=GL.AV;tom=AV.tom;luz=AV.luz;esc=AV.esc}};
// articulações (coordenadas da cabeça: centro x=0, queixo ~y 500)
const OMB=168,CIN=118,QUA=132,YO=612,YC=1010,YQ=1095,YV=1190,YJ=1560,YT=1975;
const BR1=300,BR2=268,MAO=78;
// poses: [ombro, cotovelo] para cada braço (graus; 0 = para baixo, positivo = para fora), pernas [abertura, joelho]
const POSES={
  pe:{n:"Em pé",e:[8,6],d:[8,6],pe:[3,0]},
  cintura:{n:"Mãos na cintura",e:[42,-112],d:[42,-112],pe:[5,0]},
  cruzados:{n:"Braços cruzados",e:[16,-104],d:[10,-98],pe:[3,0],cruz:1},
  acena:{n:"Acenando",e:[8,6],d:[150,-26],pe:[4,0],acena:1},
  comemora:{n:"Comemorando",e:[150,-8],d:[150,-8],pe:[8,0],punho:1},
  trofeu:{n:"Erguendo o troféu",e:[172,30],d:[172,30],pe:[6,0],trofeu:1},
  joia:{n:"Joinha",e:[8,6],d:[22,-118],pe:[3,0],joia:1}};
const ROUPAS={macacao:"Macacão",cintura:"Macacão na cintura",polo:"Polo da equipe",jaqueta:"Jaqueta"};
function cap(x0,y0,x1,y1,w0,w1){// cápsula afunilada entre dois pontos
  const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;const a=w0/2,b=w1/2;
  return`M${(x0+nx*a).toFixed(1)} ${(y0+ny*a).toFixed(1)} L${(x1+nx*b).toFixed(1)} ${(y1+ny*b).toFixed(1)} A${b} ${b} 0 0 0 ${(x1-nx*b).toFixed(1)} ${(y1-ny*b).toFixed(1)} L${(x0-nx*a).toFixed(1)} ${(y0-ny*a).toFixed(1)} A${a} ${a} 0 0 0 ${(x0+nx*a).toFixed(1)} ${(y0+ny*a).toFixed(1)}Z`}
function Corpo(svg,P,o){liga();o=o||{};this.svg=svg;this.o=o;this.P=P;this.og=document.createElementNS(NS,"g");svg.appendChild(this.og);this.g=document.createElementNS(NS,"g");this.og.appendChild(this.g);
  this.gL=document.createElementNS(NS,"g");this.gT=document.createElementNS(NS,"g");this.gH=document.createElementNS(NS,"g");this.gA=document.createElementNS(NS,"g");
  [this.gL,this.gT,this.gH,this.gA].forEach(x=>this.g.appendChild(x));this.ang={e:[8,6],d:[8,6],pe:[3,0]};this.alvo=POSES.pe;this.t=0;this.monta();if(o.pose)this.pose(o.pose);this.pos(o.x||0,o.y||0,o.s||1)}
// mesma interface do AV.Rig, para as cenas usarem corpo inteiro e rosto do mesmo jeito
const CP=Corpo.prototype;
CP.pos=function(x,y,s){this.x=x;this.y=y;this.s=s;this.og.setAttribute("transform",`translate(${x} ${y}) scale(${s})`)};
CP.emo=function(n){this.rig.emo(n)};CP.olhar=function(a,b,c){this.rig.olhar(a,b,c)};CP.flash=function(k){this.rig.flash(k)};CP.remove=function(){this.og.remove()};
Object.defineProperty(CP,"fala",{get(){return this.rig.fala}});Object.defineProperty(CP,"emoN",{get(){return this.rig.emoN}});
Corpo.prototype.monta=function(){const o=this.o,P=this.P,c1=o.cor,c2=o.cor2,ac=o.acento,pele=AV.PELES[P.pele|0],pS=tom(pele,-.16);
  const r=o.roupa||"macacao";const naPerna=r==="macacao"||r==="cintura";const calca=naPerna?c1:r==="jaqueta"?"#3B5A86":"#2A2D33";const sapato=naPerna?tom(c1,-.5):"#F2F3F5";
  this.cores={pele,pS,c1,c2,ac,calca,sapato,manga:r==="polo"?"curta":r==="cintura"?"camisa":"longa",camisa:r==="cintura"?"#F2F3F5":null,r};
  // cabeça do jogo (sem o tronco antigo)
  if(this.rig)this.rig.remove();this.gH.innerHTML="";this.rig=new AV.Rig(this.gH,P,{...o,semTronco:true,roupa:r==="macacao"||r==="cintura"?"macacao":"polo",x:0,y:0,s:1});
  if(r==="cintura"||r==="jaqueta"||r==="polo"){const col=this.gH.querySelector(".gola");if(col)col.remove()}
  this.desenhaFixo()};
Corpo.prototype.desenhaFixo=function(){const C=this.cores,o=this.o,sp=o.sp||{};const r=C.r;
  // pernas
  const perna=(sg)=>{const xq=sg*62,xt=sg*(70+this.ang.pe[0]*3);return`<path d="${cap(xq,YV-40,xt*0.98,YJ,92,72)}" fill="${C.calca}"/><path d="${cap(xt*0.98,YJ,xt,YT,72,54)}" fill="${C.calca}"/>
    ${r==="macacao"||r==="cintura"?`<path d="M${xq+sg*44} ${YV-30} L${xt+sg*30} ${YT-20}" stroke="${C.ac}" stroke-width="9"/>`:""}
    <path d="M${xt-34} ${YT-10} C${xt-36} ${YT+40} ${xt+sg*90} ${YT+48} ${xt+sg*96} ${YT+30} C${xt+sg*90} ${YT+6} ${xt+sg*40} ${YT-14} ${xt+30} ${YT-14}Z" fill="${C.sapato}"/>
    <path d="M${xt-34} ${YT+30} L${xt+sg*94} ${YT+30}" stroke="${tom(C.sapato,-.4)}" stroke-width="6"/>`};
  this.gL.innerHTML=`<ellipse cx="0" cy="${YT+44}" rx="260" ry="34" fill="#000" opacity=".28"/>`+perna(-1)+perna(1)+
    (r==="macacao"||r==="cintura"?`<text x="${-82}" y="${YJ-40}" transform="rotate(-90 -82 ${YJ-40})" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="800" font-size="30" fill="${luz(C.c1)>.6?"#15171B":"#E9ECEF"}" letter-spacing="2">${esc(String(o.nome||"").split(" ").pop().toUpperCase())}</text>`:"");
  // tronco
  const tor=`M${-OMB+10} ${YO-14} C${-OMB-12} ${YO+30} ${-CIN-28} ${YC-150} ${-CIN} ${YC} L${-QUA} ${YQ} C${-QUA+4} ${YV-30} -60 ${YV+6} 0 ${YV} C60 ${YV+6} ${QUA-4} ${YV-30} ${QUA} ${YQ} L${CIN} ${YC} C${CIN+28} ${YC-150} ${OMB+12} ${YO+30} ${OMB-10} ${YO-14} C110 ${YO-44} 60 ${YO-58} 0 ${YO-58} C-60 ${YO-58} -110 ${YO-44} ${-OMB+10} ${YO-14}Z`;
  let s=`<defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>`;
  if(r==="macacao"){s+=`<path d="${tor}" fill="${C.c1}"/>
      <path d="M${-OMB+6} ${YO-10} C-120 ${YO-40} -70 ${YO-52} -40 ${YO-50} L-48 ${YO+40} C-90 ${YO+30} -140 ${YO+40} ${-OMB+8} ${YO+50}Z" fill="${C.c2}"/><path d="M${OMB-6} ${YO-10} C120 ${YO-40} 70 ${YO-52} 40 ${YO-50} L48 ${YO+40} C90 ${YO+30} 140 ${YO+40} ${OMB-8} ${YO+50}Z" fill="${C.c2}"/>
      <path d="M${-CIN-6} ${YC-180} L${-CIN+2} ${YC}" stroke="${C.ac}" stroke-width="10"/><path d="M${CIN+6} ${YC-180} L${CIN-2} ${YC}" stroke="${C.ac}" stroke-width="10"/>
      <path d="M0 ${YO-40} L0 ${YC}" stroke="${tom(C.c1,-.45)}" stroke-width="5"/>
      <rect x="${-CIN-4}" y="${YC-6}" width="${2*CIN+8}" height="46" rx="10" fill="${tom(C.c1,-.55)}"/><rect x="-26" y="${YC}" width="52" height="34" rx="6" fill="#B9BEC5"/>
      <rect x="${-OMB+18}" y="${YO-30}" width="70" height="20" rx="8" fill="${tom(C.c1,-.4)}" transform="rotate(12 ${-OMB+50} ${YO-20})"/><rect x="${OMB-88}" y="${YO-30}" width="70" height="20" rx="8" fill="${tom(C.c1,-.4)}" transform="rotate(-12 ${OMB-50} ${YO-20})"/>
      ${AV.selo(sp.m,0,800,56,luz(C.c1)>.6?"#15171B":null)}${AV.selo(sp.s,0,920,40,luz(C.c1)>.6?"#15171B":null)}${AV.selo(sp.x,-78,690,22,luz(C.c1)>.6?"#15171B":null)}
      <text x="80" y="712" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="52" fill="${luz(C.c1)>.6?"#15171B":"#F2F3F5"}">${esc(o.num)}</text>
      <path d="${tor}" fill="url(#tg)"/>`}
  else if(r==="cintura"){s+=`<path d="${tor}" fill="${C.camisa}"/><path d="M-40 ${YO-52} L0 ${YO+10} L40 ${YO-52}" stroke="#D4D7DB" stroke-width="6" fill="none"/>
      ${AV.selo(sp.m,0,790,34,"#15171B")}<path d="${tor}" fill="url(#tg)"/>
      <path d="M${-CIN-14} ${YC-20} C-60 ${YC+10} 60 ${YC+10} ${CIN+14} ${YC-20} L${QUA+6} ${YQ+40} C60 ${YQ+70} -60 ${YQ+70} ${-QUA-6} ${YQ+40}Z" fill="${C.c1}"/>
      <path d="M-30 ${YC+20} C-80 ${YC+120} -90 ${YC+230} -70 ${YC+300} L-30 ${YC+290} C-40 ${YC+220} -20 ${YC+120} 10 ${YC+40}Z" fill="${tom(C.c1,-.12)}"/><path d="M30 ${YC+20} C80 ${YC+120} 96 ${YC+220} 84 ${YC+290} L46 ${YC+300} C52 ${YC+220} 30 ${YC+120} -10 ${YC+40}Z" fill="${tom(C.c1,-.2)}"/>
      <circle cx="0" cy="${YC+34}" r="30" fill="${tom(C.c1,-.08)}"/>`}
  else if(r==="polo"){s+=`<path d="${tor}" fill="${C.c1}"/><path d="M-44 ${YO-54} L0 ${YO+20} L44 ${YO-54} L66 ${YO-30} L0 ${YO+56} L-66 ${YO-30}Z" fill="${C.c2}"/><circle cx="0" cy="${YO+70}" r="6" fill="${C.c2}"/><circle cx="0" cy="${YO+110}" r="6" fill="${C.c2}"/>
      ${AV.selo(sp.m,-70,720,24,luz(C.c1)>.6?"#15171B":null)}<text x="80" y="736" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="40" fill="${C.c2}">${esc(String(o.equipe||"").slice(0,1).toUpperCase())}</text>
      <path d="${tor}" fill="url(#tg)"/><rect x="${-CIN-6}" y="${YC+18}" width="${2*CIN+12}" height="30" fill="#1E2024"/>`}
  else{s+=`<path d="${tor}" fill="${C.c1}"/><path d="M${-OMB+10} ${YO+120} C-90 ${YO+150} 90 ${YO+150} ${OMB-10} ${YO+120} L${OMB} ${YO+170} C90 ${YO+200} -90 ${YO+200} ${-OMB} ${YO+170}Z" fill="${C.c2}"/>
      <path d="M0 ${YO-50} L0 ${YQ+20}" stroke="${tom(C.c1,-.45)}" stroke-width="6"/><path d="M-40 ${YO-56} C-30 ${YO-90} 30 ${YO-90} 40 ${YO-56} L52 ${YO-20} C20 ${YO-40} -20 ${YO-40} -52 ${YO-20}Z" fill="${tom(C.c1,-.2)}"/>
      ${AV.selo(sp.m,70,860,22,luz(C.c1)>.6?"#15171B":null)}<path d="${tor}" fill="url(#tg)"/><rect x="${-QUA-8}" y="${YQ-10}" width="${2*QUA+16}" height="40" rx="8" fill="${tom(C.c1,-.25)}"/>`}
  this.gT.innerHTML=s;this.braco()};
Corpo.prototype.braco=function(){const C=this.cores,a=this.ang,sp=this.o.sp||{};let s="";
  // braço em 3 passadas: contorno (uma silhueta só, sem "bolinhas" nas juntas), preenchimento e detalhes que seguem cada segmento
  const um=(lado)=>{const A=a[lado],sg=lado==="d"?1:-1;const x0=sg*(OMB-26),y0=YO+4;const r1=sg*A[0]*Math.PI/180,r2=r1+sg*A[1]*Math.PI/180;
    const ux=Math.sin(r1),uy=Math.cos(r1),vx=Math.sin(r2),vy=Math.cos(r2);
    const ex=x0+ux*BR1,ey=y0+uy*BR1,wx=ex+vx*BR2,wy=ey+vy*BR2,hx=wx+vx*MAO*.55,hy=wy+vy*MAO*.55;
    const mangaSup=C.manga==="camisa"?C.camisa:C.c1,mangaInf=C.manga==="curta"?C.pele:C.manga==="camisa"?C.camisa:C.c1;
    const ln=(x,y)=>`${x.toFixed(1)} ${y.toFixed(1)}`;
    // ponto ao longo de um segmento, deslocado para o lado de fora do braço
    const nU=[uy*sg,-ux*sg],nV=[vy*sg,-vx*sg];const pU=(f,d)=>[x0+ux*BR1*f+nU[0]*d,y0+uy*BR1*f+nU[1]*d],pV=(f,d)=>[ex+vx*BR2*f+nV[0]*d,ey+vy*BR2*f+nV[1]*d];
    const faixa=(f0,f1,seg,w,cor)=>{const P=seg==="u"?pU:pV,ww=seg==="u"?w:w*.82;const q0=P(f0,0),q1=P(f1,0);return`<path d="M${ln(...q0)} L${ln(...q1)}" stroke="${cor}" stroke-width="${ww}" stroke-linecap="butt"/>`};
    const cont=tom(mangaSup,-.5);
    let t=`<g><path d="${cap(x0,y0,ex,ey,82,68)}" fill="${cont}"/><path d="${cap(ex,ey,wx,wy,68,56)}" fill="${C.manga==="curta"?tom(C.pele,-.35):cont}"/>`;
    t+=`<path d="${cap(ex,ey,wx,wy,58,46)}" fill="${mangaInf}"/><path d="${cap(x0,y0,ex,ey,72,58)}" fill="${mangaSup}"/>`;
    if(C.manga==="curta")t+=`<path d="${cap(x0,y0,x0+ux*BR1*.5,y0+uy*BR1*.5,82,76)}" fill="${C.c1}"/>`;
    if(C.r==="macacao"){// listra contínua pelo lado de fora: ombro -> cotovelo -> punho
      const a0=pU(0,22),a1=pU(1,20),a2=pV(1,16);t+=`<path d="M${ln(...a0)} L${ln(...a1)} L${ln(...a2)}" stroke="${C.ac}" stroke-width="7" stroke-linejoin="round" fill="none" opacity=".9"/>`;
      const m=pU(.42,-4);if(lado==="e")t+=`<g transform="translate(${ln(m[0],m[1])}) rotate(${(-r1*57.3).toFixed(1)})"><g transform="translate(-22 -14)">${AV.bandeira(this.o.nat,44,28)}</g></g>`;else if(sp.s)t+=`<g transform="translate(${ln(m[0],m[1])}) rotate(${(-r1*57.3).toFixed(1)})">${AV.selo(sp.s,0,0,18,null)}</g>`;
      t+=faixa(.86,1,"v",50,tom(C.c1,-.35))}
    if(C.r==="jaqueta"){t+=faixa(.40,.57,"u",70,C.c2)+faixa(.84,1,"v",54,C.c2)}
    if(C.r==="cintura")t+=faixa(.9,1,"v",50,"#D4D7DB");
    // mão: dedos seguem o antebraço; no joinha e no troféu, punho fechado em pé
    const pu=this.alvo.joia&&lado==="d",tr=this.alvo.trofeu;
    if(pu||tr||this.alvo.punho){const hx2=wx+vx*30,hy2=wy+vy*30;t+=`<g transform="translate(${ln(hx2,hy2)})"><rect x="-30" y="-28" width="60" height="56" rx="20" fill="${C.pele}" stroke="${tom(C.pele,-.35)}" stroke-width="4"/>`+
        (pu?`<rect x="${-sg*2-11}" y="-80" width="22" height="58" rx="11" fill="${C.pele}" stroke="${tom(C.pele,-.35)}" stroke-width="4"/>`:`<path d="M-22 -8 L22 -8 M-22 8 L22 8" stroke="${C.pS}" stroke-width="4"/>`)+`</g>`}
    else{const ang=Math.atan2(hy-wy,hx-wx)*180/Math.PI;t+=`<g transform="translate(${ln(hx,hy)}) rotate(${(ang-90).toFixed(1)})"><rect x="-24" y="-30" width="48" height="66" rx="22" fill="${C.pele}" stroke="${tom(C.pele,-.35)}" stroke-width="4"/><rect x="${sg>0?14:-30}" y="-22" width="16" height="40" rx="8" fill="${C.pS}" transform="rotate(${sg*-18})"/></g>`}
    this.maos=this.maos||{};this.maos[lado]=[hx,hy];
    return t+"</g>"};
  // braços cruzados: o direito passa por cima do esquerdo
  s+=um("e")+um("d");this.gA.innerHTML=s+(this.alvo.trofeu&&this.extraTrofeu?this.extraTrofeu():"")};
Corpo.prototype.pose=function(k){this.alvo=POSES[k]||POSES.pe;this.poseK=k;this.sujo=true};
Corpo.prototype.extraTrofeu=function(){const m=this.maos||{},e=m.e||[-80,80],d=m.d||[80,80];const x=(e[0]+d[0])/2,y=Math.min(e[1],d[1])-20,o="#E0A92E",c="#FFE38A",b="#9A6A12";
  return`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><rect x="-60" y="-10" width="120" height="34" rx="8" fill="#3A2B12"/><rect x="-16" y="-70" width="32" height="64" fill="${o}"/>
    <path d="M-100 -330 L100 -330 C100 -170 50 -80 0 -66 C-50 -80 -100 -170 -100 -330Z" fill="${o}"/><path d="M-100 -330 L-40 -330 C-46 -200 -20 -110 0 -66 C-50 -80 -100 -170 -100 -330Z" fill="${c}" opacity=".7"/>
    <path d="M-100 -300 C-180 -300 -170 -190 -84 -190 M100 -300 C180 -300 170 -190 84 -190" stroke="${b}" stroke-width="20" fill="none"/></g>`};
Corpo.prototype.tick=function(dt,t){dt=Math.max(0,Math.min(.1,dt||0));const a=this.ang,al=this.alvo,k=1-Math.pow(.003,dt);let mud=false;
  for(const l of["e","d"])for(let i=0;i<2;i++){let v=al[l][i];if(al.acena&&l==="d"&&i===1)v+=Math.sin(t*7)*22;const nv=a[l][i]+(v-a[l][i])*k;if(Math.abs(nv-a[l][i])>.01)mud=true;a[l][i]=nv}
  const resp=Math.sin(t*1.6);if(mud||this.sujo){this.sujo=false;this.braco()}this.gT.setAttribute("transform",`translate(0 ${(resp*1.5).toFixed(2)})`);this.gA.setAttribute("transform",`translate(0 ${(resp*1.5).toFixed(2)})`);
  this.gH.setAttribute("transform",`translate(0 ${(resp*1.8).toFixed(2)})`);this.g.setAttribute("transform",`rotate(${(Math.sin(t*.5)*.6).toFixed(2)} 0 ${YT})`);this.rig.tick(dt,t)};
GL.CORPO={Corpo,POSES,ROUPAS,YT};
})(typeof window!=="undefined"?window:globalThis);
