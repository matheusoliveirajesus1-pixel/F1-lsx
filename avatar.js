// ===================== PERSONAGENS ANIMADOS: rosto, uniforme, expressões e fala =====================
// Desenho vetorial (SVG) leve, feito para rodar liso no celular. Um "boneco" (rig) aceita:
//   rosto (pele, cabelo, barba, olhos, formato), boné ou cabelo à mostra, cores da equipe, patrocinadores, número e bandeira.
// Expressões: neutro, ouvindo, feliz, rindo, serio, confiante, irritado, triste, convencido, pensativo.
// A boca acompanha as letras da fala (visemas), os olhos piscam e apertam com o flash das câmeras.
// Só desenho: não usa o sorteio da física (RNG) do jogo.
(function(GL){
const NS="http://www.w3.org/2000/svg";
const PELES=["#F3CDB0","#E6B08B","#D09872","#B57A53","#8C5A3B","#5E3E2A"];
const CABELOS={preto:"#1C1512",castanhoEsc:"#3A2619",castanho:"#6B4429",loiro:"#C9A15B",ruivo:"#A4502A",grisalho:"#9C9C9C"};
const OLHOS={castanho:"#5A3A22",escuro:"#2A1A10",verde:"#4F7A3A",azul:"#3D6FA8",mel:"#8A6A2E"};
const ESTILOS=["curto","topete","cacheado","raspado","longo"];
const BARBAS=["nenhuma","rala","bigode","cavanhaque","cheia"];
const ROSTOS=["oval","quadrado","fino"];
const NOMES={estilo:{curto:"Curto",topete:"Topete",cacheado:"Cacheado",raspado:"Raspado",longo:"Comprido"},barba:{nenhuma:"Sem barba",rala:"Por fazer",bigode:"Bigode",cavanhaque:"Cavanhaque",cheia:"Cheia"},
  rosto:{oval:"Oval",quadrado:"Quadrado",fino:"Fino"},cabelo:{preto:"Preto",castanhoEsc:"Castanho-escuro",castanho:"Castanho",loiro:"Loiro",ruivo:"Ruivo",grisalho:"Grisalho"},
  olhos:{castanho:"Castanhos",escuro:"Escuros",verde:"Verdes",azul:"Azuis",mel:"Mel"}};
function hsh(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function prng(seed){let a=seed||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hexN(h){h=String(h||"#888");if(h.length===4)h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];return parseInt(h.slice(1,7),16)||0}
function tom(h,k){const n=hexN(h),f=v=>Math.round(k<0?v*(1+k):v+(255-v)*k);return"#"+[n>>16,n>>8&255,n&255].map(v=>Math.max(0,Math.min(255,f(v))).toString(16).padStart(2,"0")).join("")}
function luz(h){const n=hexN(h);return(.299*(n>>16)+.587*(n>>8&255)+.114*(n&255))/255}
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// pele mais provável por nacionalidade (só para variar o grid de pilotos da IA)
const PELE_NAT={JPN:[0,1,1,2],CHN:[0,1,1,2],THA:[1,2,2,3],BRA:[0,1,2,3,4,5],MEX:[1,2,2,3,4],ARG:[0,1,1,2,3],ESP:[0,1,1,2],ITA:[0,1,1,2],POR:[0,1,2,3],
  FRA:[0,0,1,2,4,5],GBR:[0,0,1,2,4,5],USA:[0,1,2,3,4,5],GER:[0,0,0,1],NED:[0,0,0,1,4],FIN:[0,0,0],MON:[0,0,1],AUS:[0,0,1,2],CAN:[0,0,1,2,4],NZL:[0,0,1,3]};
// rosto sorteado (sempre o mesmo para o mesmo piloto)
function rostoDe(d){const r=prng(hsh((d&&(d.id||d.n))||"x")),pk=a=>a[Math.floor(r()*a.length)];const pl=PELE_NAT[d&&d.nat]||[0,1,2,3];const pele=pk(pl);
  const age=(d&&d.age)||25;const cab=age>34&&r()<.35?"grisalho":pele>=4?pk(["preto","preto","castanhoEsc"]):pele>=2?pk(["preto","castanhoEsc","castanhoEsc","castanho"]):pk(["preto","castanhoEsc","castanho","castanho","loiro","loiro","ruivo"]);
  return{v:1,pele,cabelo:cab,estilo:pk(ESTILOS),barba:pk(["nenhuma","nenhuma","nenhuma","rala","rala","bigode","cavanhaque","cheia"]),olhos:pele>=3?pk(["castanho","escuro"]):pk(Object.keys(OLHOS)),rosto:pk(ROSTOS),bone:r()<.6,sobr:+(.85+r()*.4).toFixed(2)}}
// pessoas do paddock (chefes, engenheiros, comissários, diretores): rosto pelo nome, sem boné
function pessoa(nome,o){const P=rostoDe({id:"p:"+nome});const prim=String(nome||"").split(" ")[0];
  const fem=o&&o.fem!=null?o.fem:(/a$/i.test(prim)&&!/^(luca|andrea|nikita|joshua)$/i.test(prim))||/^(sophie|sarah|lena|ingrid|carmen|mei|yuki|chloe|zoe|beatriz|isabel|lauren|kim)$/i.test(prim);
  if(fem){P.fem=true;P.barba="nenhuma";P.estilo=["longo","coque","longo"][hsh(nome)%3];if(P.rosto==="quadrado")P.rosto="fino";P.sobr=Math.min(P.sobr,.9)}
  if(o&&o.idade>45&&hsh(nome)%2)P.cabelo="grisalho";P.bone=!!(o&&o.bone);return P}
// rosto do jogador: o criado no editor ou, enquanto não existir, um sorteado
function rostoJogador(){try{if(typeof G!=="undefined"&&G){if(G.avatar)return G.avatar;const me=G.drivers&&G.drivers[G.me];return rostoDe(me)}}catch(e){}return rostoDe({id:"jogador"})}
function rostoPiloto(d){if(!d)return rostoDe({id:"x"});try{if(typeof G!=="undefined"&&G&&d.id===G.me&&G.avatar)return G.avatar}catch(e){}return rostoDe(d)}

// ---------- bandeiras simplificadas
const FLAGS={ITA:["v","#1F9D55","#FFFFFF","#D62B2B"],FRA:["v","#1E4FA3","#FFFFFF","#D62B2B"],MEX:["v","#1F7A45","#FFFFFF","#C8102E"],GER:["h","#111111","#D62B2B","#FFCC00"],NED:["h","#C8102E","#FFFFFF","#1E4FA3"],
  ARG:["h","#74ACDF","#FFFFFF","#74ACDF"],MON:["h2","#D62B2B","#FFFFFF"],POR:["v2","#1F7A45","#D62B2B"],THA:["h","#C8102E","#FFFFFF","#1E3A8A"]};
function bandeira(nat,w,h){const f=FLAGS[nat];const R=`<rect width="${w}" height="${h}" rx="${h*.12}"`;
  if(nat==="BRA")return`${R} fill="#1F9D55"/><path d="M${w/2} ${h*.12} L${w*.9} ${h/2} L${w/2} ${h*.88} L${w*.1} ${h/2}Z" fill="#FFD43B"/><circle cx="${w/2}" cy="${h/2}" r="${h*.22}" fill="#1E4FA3"/>`;
  if(nat==="JPN")return`${R} fill="#FFFFFF"/><circle cx="${w/2}" cy="${h/2}" r="${h*.28}" fill="#C8102E"/>`;
  if(nat==="CHN")return`${R} fill="#DE2910"/><path d="M${w*.2} ${h*.2} l${h*.07} ${h*.2} h${h*.2} l-${h*.16} ${h*.12} l${h*.06} ${h*.2} l-${h*.17} -${h*.12} l-${h*.17} ${h*.12} l${h*.06} -${h*.2} l-${h*.16} -${h*.12} h${h*.2}Z" fill="#FFDE00"/>`;
  if(nat==="GBR"||nat==="AUS"||nat==="NZL")return`${R} fill="#1F3B8A"/><path d="M0 0 L${w} ${h} M${w} 0 L0 ${h}" stroke="#fff" stroke-width="${h*.18}"/><path d="M${w/2} 0 V${h} M0 ${h/2} H${w}" stroke="#fff" stroke-width="${h*.3}"/><path d="M${w/2} 0 V${h} M0 ${h/2} H${w}" stroke="#C8102E" stroke-width="${h*.16}"/>`;
  if(nat==="USA")return`${R} fill="#FFFFFF"/>${[0,2,4,6].map(i=>`<rect y="${i*h/7}" width="${w}" height="${h/7}" fill="#B22234"/>`).join("")}<rect width="${w*.45}" height="${h*.55}" fill="#3C3B6E"/>`;
  if(nat==="CAN")return`${R} fill="#FFFFFF"/><rect width="${w*.26}" height="${h}" fill="#D52B1E"/><rect x="${w*.74}" width="${w*.26}" height="${h}" fill="#D52B1E"/><path d="M${w/2} ${h*.2} L${w*.58} ${h*.45} L${w*.66} ${h*.4} L${w*.6} ${h*.68} L${w/2} ${h*.62} L${w*.4} ${h*.68} L${w*.34} ${h*.4} L${w*.42} ${h*.45}Z" fill="#D52B1E"/>`;
  if(nat==="FIN")return`${R} fill="#FFFFFF"/><path d="M${w*.36} 0 V${h} M0 ${h/2} H${w}" stroke="#1E4FA3" stroke-width="${h*.26}"/>`;
  if(nat==="ESP")return`${R} fill="#C60B1E"/><rect y="${h*.25}" width="${w}" height="${h*.5}" fill="#FFC400"/>`;
  if(f){if(f[0]==="v")return`${R} fill="${f[2]}"/><rect width="${w/3}" height="${h}" fill="${f[1]}"/><rect x="${w*2/3}" width="${w/3}" height="${h}" fill="${f[3]}"/>`;
    if(f[0]==="h")return`${R} fill="${f[2]}"/><rect width="${w}" height="${h/3}" fill="${f[1]}"/><rect y="${h*2/3}" width="${w}" height="${h/3}" fill="${f[3]}"/>`;
    if(f[0]==="h2")return`${R} fill="${f[2]}"/><rect width="${w}" height="${h/2}" fill="${f[1]}"/>`;
    if(f[0]==="v2")return`${R} fill="${f[2]}"/><rect width="${w*.4}" height="${h}" fill="${f[1]}"/>`}
  return`${R} fill="#3A3F47"/><text x="${w/2}" y="${h*.68}" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="800" font-size="${h*.5}" fill="#fff">${esc(nat||"")}</text>`}

// ---------- selo de patrocinador (quadrado com símbolo + nome)
function selo(sp,x,y,h,corTexto){if(!sp)return"";const nome=String(sp.n).toUpperCase();const w=h*(1.25+nome.length*.36);const mk=(typeof SP_MARK!=="undefined"&&(SP_MARK[sp.mk]||SP_MARK.diamond))||null;
  return`<g transform="translate(${x-w/2} ${y-h/2})"><rect width="${h}" height="${h}" rx="${h*.18}" fill="${sp.c}"/>${mk?`<g transform="scale(${h/24})">${mk(sp.c2)}</g>`:""}<text x="${h*1.18}" y="${h*.72}" font-family="Titillium Web,sans-serif" font-weight="700" font-size="${h*.62}" fill="${corTexto||sp.c}">${esc(nome)}</text></g>`}
function patrociniosDe(t){try{if(typeof carSponsors==="function"&&t){const r=carSponsors(t);if(r&&r.m)return r}}catch(e){}
  const C=typeof SPONSOR_CAT!=="undefined"?SPONSOR_CAT:[];const h=hsh(t&&t.id);return{m:C[h%Math.max(1,C.length)],s:C[(h>>4)%Math.max(1,C.length)]}}

// ---------- formas
const ROSTO_D={oval:"M-92 340 C-92 262 92 262 92 340 C92 420 72 468 38 492 C20 505 -20 505 -38 492 C-72 468 -92 420 -92 340 Z",
  quadrado:"M-95 338 C-95 262 95 262 95 338 C95 428 88 470 58 494 C34 507 -34 507 -58 494 C-88 470 -95 428 -95 338 Z",
  fino:"M-86 340 C-86 264 86 264 86 340 C86 418 64 472 30 495 C14 506 -14 506 -30 495 C-64 472 -86 418 -86 340 Z"};
const LARG={oval:92,quadrado:95,fino:86};
function cabeloTopo(est,c,W){const top=`M${-W-2} 336 C${-W-8} 250 -40 220 0 222 C40 220 ${W+8} 250 ${W+2} 336 C${W-14} 300 60 288 0 290 C-60 288 ${-W+14} 300 ${-W-2} 336Z`;
  if(est==="raspado")return`<path d="${top}" fill="${c}" opacity=".42"/>`;
  if(est==="topete")return`<path d="M${-W-2} 336 C${-W-10} 238 -30 196 24 202 C76 206 ${W+10} 250 ${W+2} 336 C${W-12} 296 50 280 12 288 C-30 278 ${-W+14} 300 ${-W-2} 336Z" fill="${c}"/><path d="M-20 222 C10 206 50 212 70 232" stroke="${tom(c,.25)}" stroke-width="4" fill="none" opacity=".6"/>`;
  if(est==="cacheado"){let s=`<path d="${top}" fill="${c}"/>`;for(let i=0;i<=10;i++){const a=Math.PI*(1.05+i*.09),x=Math.cos(a)*(W+4),y=300+Math.sin(a)*78;s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(20+(i%3)*3)}" fill="${c}"/>`}return s}
  if(est==="coque")return`<circle cx="0" cy="214" r="34" fill="${c}"/><path d="${top}" fill="${c}"/>`;
  if(est==="longo")return`<path d="M${-W-2} 340 C${-W-10} 246 -40 214 0 216 C40 214 ${W+10} 246 ${W+2} 340 C${W-10} 296 40 270 4 282 C-6 268 ${-W+10} 296 ${-W-2} 340Z" fill="${c}"/>`;
  return`<path d="${top}" fill="${c}"/>`}
function cabeloTras(est,c,W,bone){let s=`<path d="M${-W} 330 C${-W} 300 ${-W+12} 282 ${-W+24} 276 L${-W+24} 362 L${-W-2} 362 Z M${W} 330 C${W} 300 ${W-12} 282 ${W-24} 276 L${W-24} 362 L${W+2} 362 Z" fill="${c}"/>`;
  if(est==="longo")s=`<path d="M${-W-8} 300 C${-W-22} 420 ${-W-6} 520 -64 572 L64 572 C${W+6} 520 ${W+22} 420 ${W+8} 300 Z" fill="${c}"/>`+s;
  if(est==="cacheado"&&!bone)s=`<path d="M${-W-14} 320 C${-W-24} 380 ${-W-10} 420 ${-W+4} 430 L${W-4} 430 C${W+10} 420 ${W+24} 380 ${W+14} 320Z" fill="${c}"/>`+s;return s}
function barbaSVG(b,c){if(b==="rala")return`<path d="M-84 410 C-74 455 -52 482 -32 494 C-14 504 14 504 32 494 C52 482 74 455 84 410 C60 440 30 452 0 452 C-30 452 -60 440 -84 410 Z" fill="${c}" opacity=".26"/>`;
  if(b==="cheia")return`<path d="M-90 372 C-90 450 -52 506 0 512 C52 506 90 450 90 372 C80 412 58 436 32 444 C20 432 -20 432 -32 444 C-58 436 -80 412 -90 372Z" fill="${c}"/><path d="M-34 440 C-20 430 -6 432 0 436 C6 432 20 430 34 440 C20 446 8 444 0 442 C-8 444 -20 446 -34 440Z" fill="${c}"/>`;
  if(b==="bigode")return`<path d="M-34 442 C-22 430 -6 432 0 437 C6 432 22 430 34 442 C22 448 8 446 0 443 C-8 446 -22 448 -34 442Z" fill="${c}"/>`;
  if(b==="cavanhaque")return`<path d="M-26 476 C-16 504 16 504 26 476 C14 486 -14 486 -26 476Z" fill="${c}"/><path d="M-30 443 C-20 434 -6 435 0 439 C6 435 20 434 30 443 C20 447 8 446 0 444 C-8 446 -20 447 -30 443Z" fill="${c}" opacity=".9"/>`;return""}


function roupa(o,id,k){const{c1,c2,ac,cE,txtC,sp,pS,nomeEq,fsEq}=k;const r=o.roupa||"macacao";
  const pesc=`<path d="M-48 470 L48 470 L52 572 L-52 572 Z" fill="${pS}"/><path d="M-48 520 C-20 545 20 545 48 520 L50 560 L-50 560 Z" fill="#000" opacity=".18"/>`;
  const corpo=f=>`<path d="M-360 900 C-350 735 -255 650 -110 618 L-58 596 L58 596 L110 618 C255 650 350 735 360 900 Z" fill="${f}"/>`;
  if(r==="polo")return`<g class="tronco">${corpo(`url(#${id}m)`)}
      <path d="M-300 760 C-270 700 -200 660 -120 640" stroke="${c2}" stroke-width="10" fill="none" opacity=".9"/><path d="M300 760 C270 700 200 660 120 640" stroke="${c2}" stroke-width="10" fill="none" opacity=".9"/>
      <path d="M0 600 L0 720" stroke="${tom(c1,-.4)}" stroke-width="4"/><circle cx="0" cy="650" r="5" fill="${c2}"/><circle cx="0" cy="690" r="5" fill="${c2}"/>
      <text x="150" y="720" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="34" fill="${c2}">${esc(nomeEq.slice(0,1))}</text>
      ${sp&&sp.m?selo(sp.m,-150,740,24,luz(c1)>.62?"#15171B":null):""}${o.cracha?`<path d="M-70 600 L-20 820 M70 600 L20 820" stroke="${ac}" stroke-width="7"/><rect x="-34" y="810" width="68" height="84" rx="6" fill="#F2F3F5"/><rect x="-26" y="822" width="52" height="10" fill="${ac}"/>`:""}</g>
    ${pesc}<path d="M-62 560 L0 612 L62 560 L84 600 L0 640 L-84 600Z" fill="${tom(c1,.12)}"/><path d="M-62 560 L-20 600 L-84 600Z M62 560 L20 600 L84 600Z" fill="${c2}" opacity=".85"/>`;
  if(r==="terno"){const tz=o.gravata||ac;return`<g class="tronco">${corpo("#1F2633")}
      <path d="M-70 596 L0 700 L70 596 L52 590 L0 650 L-52 590Z" fill="#F2F3F5"/><path d="M-12 640 L12 640 L18 760 L0 790 L-18 760Z" fill="${tz}"/>
      <path d="M-110 618 L-58 596 L0 700 L-40 900 L-120 900 C-120 820 -140 700 -110 618Z" fill="#273042"/><path d="M110 618 L58 596 L0 700 L40 900 L120 900 C120 820 140 700 110 618Z" fill="#273042"/>
      <rect x="160" y="700" width="70" height="40" rx="4" fill="#E9ECEF"/><rect x="166" y="706" width="58" height="8" fill="${tz}"/></g>${pesc}`}
  // macacão de piloto
  return`<g class="tronco">${corpo(`url(#${id}m)`)}
    <path d="M-295 745 C-255 680 -180 642 -98 622 L-84 650 C-160 668 -220 700 -255 760 Z" fill="${c2}"/><path d="M295 745 C255 680 180 642 98 622 L84 650 C160 668 220 700 255 760 Z" fill="${c2}"/>
    <path d="M-278 760 C-240 700 -175 666 -94 646" stroke="${ac}" stroke-width="7" fill="none"/><path d="M278 760 C240 700 175 666 94 646" stroke="${ac}" stroke-width="7" fill="none"/>
    <path d="M0 606 L0 900" stroke="${tom(c1,-.45)}" stroke-width="5"/><rect x="-8" y="640" width="16" height="30" rx="4" fill="#9AA0A8"/>
    ${selo(sp.m,105,705,30,luz(c1)>.62?"#15171B":null)}${selo(sp.s,-112,760,26,luz(c1)>.62?"#15171B":null)}${o.num!=null?`<text x="135" y="808" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="44" fill="${txtC}">${esc(o.num)}</text>`:""}
    <g transform="translate(-200 690) rotate(-14) translate(-34 -22)">${bandeira(o.nat,68,44)}</g>
  </g>${pesc}
  <rect x="-72" y="548" width="144" height="56" rx="16" fill="${tom(c1,-.42)}"/><rect x="-72" y="548" width="144" height="7" rx="3" fill="${ac}"/>
  <text x="0" y="586" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="${fsEq.toFixed(1)}" fill="#E9ECEF" letter-spacing="1.5">${esc(nomeEq)}</text>`}
// ---------- monta o boneco (coordenadas locais: centro x=0, cabeça em y≈380, peito até y=900)
let NID=0;
function svgDe(P,o){const id="av"+(++NID);const pele=PELES[P.pele|0]||PELES[2],pS=tom(pele,-.16),pE=tom(pele,-.3),cab=CABELOS[P.cabelo]||CABELOS.preto,oc=OLHOS[P.olhos]||OLHOS.castanho;const W=LARG[P.rosto]||92;
  const c1=o.cor||"#3A3E45",c2=o.cor2||"#E9ECEF",ac=o.acento||"#00B4D8",cE=tom(c1,-.32),txtC=luz(c1)>.62?"#15171B":"#F2F3F5";const sp=o.sp||{};
  const sobW=(8.5*(P.sobr||1)).toFixed(1);const nomeEq=String(o.equipe||"").toUpperCase();const fsEq=Math.min(22,170/Math.max(4,nomeEq.length)*1.6);
  const boneD=P.bone!==false&&o.bone!==false;const fem=!!P.fem;const cil=fem?`<path d="M15 -5 L21 -9 M18 -2 L24 -4" stroke="#1B120D" stroke-width="1.8" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`:"";
  return`<defs><linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tom(pele,.05)}"/><stop offset="1" stop-color="${pS}"/></linearGradient>
    <linearGradient id="${id}l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tom(c1,.08)}"/><stop offset="1" stop-color="${cE}"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tom(c1,.06)}"/><stop offset="1" stop-color="${tom(c1,-.3)}"/></linearGradient>
    <clipPath id="${id}oe"><ellipse rx="17" ry="10"/></clipPath><clipPath id="${id}od"><ellipse rx="17" ry="10"/></clipPath><clipPath id="${id}bc"><path class="bocaClip"/></clipPath></defs>
  ${roupa(o,id,{c1,c2,ac,cE,txtC,sp,pS,nomeEq,fsEq})}
  <g class="cabeca">
    ${cabeloTras(P.estilo,cab,W,boneD)}
    <ellipse class="orE" cx="${-W+2}" cy="385" rx="16" ry="27" fill="${pE}"/><ellipse class="orD" cx="${W-2}" cy="385" rx="16" ry="27" fill="${pE}"/>
    <path d="${ROSTO_D[P.rosto]||ROSTO_D.oval}" fill="url(#${id}p)"/><path d="${ROSTO_D[P.rosto]||ROSTO_D.oval}" fill="url(#${id}l)"/>
    <g class="feicoes">
      <ellipse class="bqE" cx="-52" cy="420" rx="22" ry="12" fill="#E0786A" opacity="0"/><ellipse class="bqD" cx="52" cy="420" rx="22" ry="12" fill="#E0786A" opacity="0"/>
      ${fem?"":barbaSVG(P.barba,cab)}
      <g class="olhoE" transform="translate(-38 370)"><g class="esc"><ellipse rx="17" ry="10" fill="#F6F1EA"/><g clip-path="url(#${id}oe)"><g class="iris"><circle r="8.5" fill="${oc}"/><circle r="4.2" fill="#120B07"/><circle cx="-2.6" cy="-2.6" r="1.9" fill="#fff"/></g></g>
        <path d="M-19 1 A19 11 0 0 1 19 1" stroke="#1B120D" stroke-width="3.4" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke"/>${cil?`<g transform="scale(-1 1)">${cil}</g>`:""}</g></g>
      <g class="olhoD" transform="translate(38 370)"><g class="esc"><ellipse rx="17" ry="10" fill="#F6F1EA"/><g clip-path="url(#${id}od)"><g class="iris"><circle r="8.5" fill="${oc}"/><circle r="4.2" fill="#120B07"/><circle cx="-2.6" cy="-2.6" r="1.9" fill="#fff"/></g></g>
        <path d="M-19 1 A19 11 0 0 1 19 1" stroke="#1B120D" stroke-width="3.4" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke"/>${cil}</g></g>
      <g class="sobE" transform="translate(-38 340)"><path d="M-26 5 C-13 -6 11 -8 26 -1" stroke="${tom(cab,-.1)}" stroke-width="${sobW}" fill="none" stroke-linecap="round"/></g>
      <g class="sobD" transform="translate(38 340)"><path d="M26 5 C13 -6 -11 -8 -26 -1" stroke="${tom(cab,-.1)}" stroke-width="${sobW}" fill="none" stroke-linecap="round"/></g>
      <path d="M1 368 C-2 392 -10 410 -13 420 C-6 430 8 430 15 421" stroke="${pE}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path class="viE" d="M-30 418 C-40 432 -40 448 -32 458" stroke="${pE}" stroke-width="2.6" fill="none" opacity="0" stroke-linecap="round"/><path class="viD" d="M30 418 C40 432 40 448 32 458" stroke="${pE}" stroke-width="2.6" fill="none" opacity="0" stroke-linecap="round"/>
      <g class="boca" transform="translate(0 456)"><path class="bocaIn" fill="#4A1C1A"/><g clip-path="url(#${id}bc)"><rect class="dentes" x="-40" y="-20" width="80" height="0" fill="#F3EDE6"/><ellipse class="lingua" cx="0" cy="14" rx="18" ry="8" fill="#B5554B"/></g>
        <path class="labS" stroke="${tom(pele,-.42)}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path class="labI" stroke="${tom(pele,-.3)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></g>
    </g>
    ${boneD?`<g class="bone"><path d="M-98 318 C-100 236 100 236 98 318 Z" fill="url(#${id}b)"/><path d="M0 246 L0 316" stroke="${tom(c1,-.4)}" stroke-width="2" opacity=".6"/><circle cx="0" cy="244" r="6" fill="${ac}"/>
      <g class="logoBone" transform="translate(0 288)"><text x="0" y="12" text-anchor="middle" font-family="Titillium Web,sans-serif" font-weight="900" font-style="italic" font-size="38" fill="${luz(c1)>.62?"#15171B":c2}">${esc(nomeEq.slice(0,1))}</text></g>
      <path d="M-112 318 C-60 298 60 298 112 318 C118 336 -118 336 -112 318 Z" fill="${tom(c1,-.38)}"/><path d="M-106 324 C-55 312 55 312 106 324" stroke="${ac}" stroke-width="3" fill="none"/></g>`:cabeloTopo(P.estilo,cab,W)}
    ${o.fone?`<g><path d="M${-W-14} 380 C${-W-20} 230 ${W+20} 230 ${W+14} 380" stroke="#22252A" stroke-width="12" fill="none"/><rect x="${-W-30}" y="352" width="30" height="58" rx="12" fill="#2A2D33"/><rect x="${W}" y="352" width="30" height="58" rx="12" fill="#2A2D33"/><path d="M${-W-18} 400 C${-W-10} 460 -70 470 -40 466" stroke="#2A2D33" stroke-width="6" fill="none"/><circle cx="-36" cy="466" r="8" fill="#16181C"/></g>`:""}
  </g>`}

const EMO={
  neutro:{bY:0,bA:0,bAs:0,olho:1,cur:2,smirk:0,blush:0,tilt:0,baixa:0,base:0},
  ouvindo:{bY:-3,bA:-2,bAs:0,olho:1,cur:1,smirk:0,blush:0,tilt:2.5,baixa:0,base:0},
  feliz:{bY:-5,bA:-3,bAs:0,olho:.82,cur:11,smirk:0,blush:.22,tilt:2,baixa:0,base:.05},
  rindo:{bY:-8,bA:-4,bAs:0,olho:.42,cur:16,smirk:0,blush:.5,tilt:3,baixa:0,base:.45},
  serio:{bY:3,bA:4,bAs:0,olho:.86,cur:-1,smirk:0,blush:0,tilt:0,baixa:2,base:0},
  confiante:{bY:-1,bA:2,bAs:-4,olho:.88,cur:6,smirk:3,blush:0,tilt:-2,baixa:-3,base:0},
  irritado:{bY:7,bA:11,bAs:0,olho:.72,cur:-6,smirk:0,blush:.12,tilt:-2,baixa:4,base:0},
  triste:{bY:-3,bA:-10,bAs:0,olho:.68,cur:-8,smirk:0,blush:0,tilt:3,baixa:9,base:0},
  convencido:{bY:-2,bA:3,bAs:-9,olho:.78,cur:5,smirk:9,blush:0,tilt:-3,baixa:-2,base:0},
  pensativo:{bY:-2,bA:-2,bAs:-7,olho:.9,cur:-2,smirk:-3,blush:0,tilt:-4,baixa:-1,base:0},
  revira:{bY:-4,bA:-3,bAs:-6,olho:.7,cur:-3,smirk:-5,blush:0,tilt:-3,baixa:-2,base:0}
};
function visema(ch){ch=(ch||" ").toLowerCase();
  if("aáàâã".includes(ch))return[1,1];if("eéê".includes(ch))return[.62,1.14];if("ií".includes(ch))return[.38,1.2];if("oóôõ".includes(ch))return[.8,.74];if("uú".includes(ch))return[.46,.62];
  if("mbp".includes(ch))return[0,.96];if("fv".includes(ch))return[.14,1.02];if(" .,?!…;:\"".includes(ch))return[.04,1];if("wq".includes(ch))return[.35,.7];return[.32,1]}
const lerp=(a,b,k)=>a+(b-a)*k;

// ---------- o boneco animado
function Rig(parent,P,o){o=o||{};this.o=o;this.g=document.createElementNS(NS,"g");this.g.innerHTML=svgDe(P,o);parent.appendChild(this.g);
  const q=s=>this.g.querySelector(s);this.e={cab:q(".cabeca"),tr:q(".tronco"),fe:q(".feicoes"),lb:q(".logoBone"),orE:q(".orE"),orD:q(".orD"),oE:q(".olhoE"),oD:q(".olhoD"),sE:q(".sobE"),sD:q(".sobD"),
    bIn:q(".bocaIn"),bClip:q(".bocaClip"),den:q(".dentes"),lin:q(".lingua"),lS:q(".labS"),lI:q(".labI"),boca:q(".boca"),bqE:q(".bqE"),bqD:q(".bqD"),vE:q(".viE"),vD:q(".viD")};
  this.e.olhos=[this.e.oE,this.e.oD].map(g=>({esc:g.querySelector(".esc"),iris:g.querySelectorAll(".iris")}));
  this.F={...EMO.neutro,gx:0,gy:0,yaw:0,ab:0,lw:1};this.alvo={...EMO.neutro};this.olharA={gx:0,gy:0,yaw:0};this.emoN="neutro";
  this.fala={on:false,txt:"",i:0};this.pisca=1.5+Math.random()*2;this.piscaK=0;this.flashI=0;this.fase=Math.random()*10;this.pos(o.x||0,o.y||0,o.s||1)}
Rig.prototype.pos=function(x,y,s){this.x=x;this.y=y;this.s=s;this.g.setAttribute("transform",`translate(${x} ${y}) scale(${s})`)};
Rig.prototype.emo=function(n){if(!EMO[n])n="neutro";this.emoN=n;this.alvo={...EMO[n]}};
Rig.prototype.olhar=function(gx,gy,yaw){this.olharA={gx,gy,yaw:yaw||0}};
Rig.prototype.flash=function(k){this.flashI=Math.min(1,this.flashI+k)};
Rig.prototype.remove=function(){this.g.remove()};
Rig.prototype.tick=function(dt,t0){dt=Math.max(0,Math.min(.1,dt||0));const F=this.F,e=this.e,t=t0+this.fase;const k=1-Math.pow(.004,dt);for(const key in this.alvo)F[key]=lerp(F[key],this.alvo[key],k);
  const kl=1-Math.pow(.0005,dt);F.gx=lerp(F.gx,this.olharA.gx,kl);F.gy=lerp(F.gy,this.olharA.gy,kl);F.yaw=lerp(F.yaw,this.olharA.yaw,1-Math.pow(.02,dt));
  let ab=0,lw=1;const fa=this.fala;if(fa.on){const v=visema(fa.txt[Math.floor(fa.i+.6)]);ab=v[0]*(.85+.15*Math.sin(t*27));lw=v[1]}
  F.ab=lerp(F.ab,ab,1-Math.pow(1e-20,dt));F.lw=lerp(F.lw,lw,1-Math.pow(1e-18,dt));
  this.pisca-=dt;if(this.pisca<=0){this.piscaK=.16;this.pisca=2.2+Math.random()*3.4}let pis=1;if(this.piscaK>0){this.piscaK-=dt;pis=Math.abs(this.piscaK-.08)/.08}
  this.flashI=Math.max(0,this.flashI-dt*3.2);const sq=1-Math.max(0,F.cur-8)*.012;const abre=Math.max(.06,F.olho*pis*(1-this.flashI*.75))*sq;
  const ri=this.emoN==="rindo"&&fa.on?Math.sin(t*15)*2.2:0,resp=Math.sin(t*1.6)*1.2,nod=fa.on?Math.sin(t*4.3)*1.6:0;
  e.cab.setAttribute("transform",`rotate(${(F.tilt+Math.sin(t*.7)*.8).toFixed(2)} 0 520) translate(${(F.yaw*10).toFixed(2)} ${(F.baixa+resp+nod+ri).toFixed(2)})`);
  e.tr.setAttribute("transform",`translate(0 ${(resp*.6+(this.emoN==="rindo"&&fa.on?Math.abs(Math.sin(t*15))*2:0)).toFixed(2)})`);
  e.fe.setAttribute("transform",`translate(${(F.yaw*14).toFixed(2)} ${(F.baixa*.4).toFixed(2)})`);if(e.lb)e.lb.setAttribute("transform",`translate(${(F.yaw*10).toFixed(2)} 288)`);
  e.orE.setAttribute("rx",(16*(1-F.yaw*.35)).toFixed(2));e.orD.setAttribute("rx",(16*(1+F.yaw*.35)).toFixed(2));
  for(const ol of e.olhos){ol.esc.setAttribute("transform",`scale(1 ${abre.toFixed(3)})`);ol.iris.forEach(i=>i.setAttribute("transform",`translate(${F.gx.toFixed(2)} ${F.gy.toFixed(2)})`))}
  const bfl=this.flashI*4;e.sE.setAttribute("transform",`translate(-38 ${(340+F.bY+bfl+(F.bAs>0?F.bAs:0)*.6).toFixed(2)}) rotate(${F.bA.toFixed(2)})`);
  e.sD.setAttribute("transform",`translate(38 ${(340+F.bY+bfl+(F.bAs<0?F.bAs:0)*.9).toFixed(2)}) rotate(${(-F.bA).toFixed(2)})`);
  const op=(F.ab*17+F.base*14)*(this.emoN==="rindo"?1.15:1),w=(30+Math.max(0,F.cur)*.9)*F.lw,c=F.cur,s=F.smirk;
  const ly=-c+s*.6,ry=-c-s,uy=-c*.3-op*.12,dy=-c*.3+op+2,f=v=>v.toFixed(1);const dentro=`M${f(-w)} ${f(ly)} Q0 ${f(uy*1.6)} ${f(w)} ${f(ry)} Q0 ${f(dy*1.5)} ${f(-w)} ${f(ly)}Z`;
  e.bIn.setAttribute("d",op>1.2?dentro:"M0 0");e.bClip.setAttribute("d",dentro);e.den.setAttribute("y",f(uy*1.2-2));e.den.setAttribute("height",f(Math.min(op*.42,9)+(op>1.2?2:0)));
  e.lin.setAttribute("cy",f(dy*1.1));e.lin.setAttribute("opacity",op>8?.9:0);e.lS.setAttribute("d",`M${f(-w)} ${f(ly)} Q0 ${f(uy*1.6)} ${f(w)} ${f(ry)}`);
  e.lI.setAttribute("d",`M${f(-w*.62)} ${f(ly*.5+dy*.55+3)} Q0 ${f(dy*1.4+4)} ${f(w*.62)} ${f(ry*.5+dy*.55+3)}`);e.boca.setAttribute("transform",`translate(0 ${f(456+op*.12)})`);
  e.bqE.setAttribute("opacity",F.blush.toFixed(2));e.bqD.setAttribute("opacity",F.blush.toFixed(2));const vin=Math.max(0,(F.cur-6)/10)*.8;e.vE.setAttribute("opacity",vin.toFixed(2));e.vD.setAttribute("opacity",vin.toFixed(2))};

// uniforme a partir de um piloto do jogo
function uniformeDe(d){const t=d&&typeof teamOf==="function"?teamOf(d.team):null;const sp=patrociniosDe(t);
  return{cor:t?t.c:"#3A3E45",cor2:t?(t.c2||"#E9ECEF"):"#E9ECEF",acento:sp&&sp.m?sp.m.c:"#00B4D8",sp,equipe:t?t.n:"Paddock",num:d&&d.num,nat:d&&d.nat}}

GL.AV={Rig,pessoa,rostoDe,rostoJogador,rostoPiloto,uniformeDe,patrociniosDe,selo,bandeira,tom,luz,hsh,prng,esc,EMO,PELES,CABELOS,OLHOS,ESTILOS,BARBAS,ROSTOS,NOMES,NS};
})(typeof window!=="undefined"?window:globalThis);
