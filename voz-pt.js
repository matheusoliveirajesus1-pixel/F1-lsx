// ================= VOZ SINTETIZADA EM PORTUGUÊS (sem voz do aparelho) =================
// Sintetizador de formantes, como um motor: fonte glotal + ressonadores do trato vocal + ruídos (s, x, f) + estouros (p, t, k).
// 1) texto -> fonemas do português do Brasil (regras de pronúncia, sílaba tônica, "de" = "dji", "leite" = "leitchi")
// 2) fonemas -> alvos de formantes, com transições suaves entre os sons (coarticulação)
// 3) entonação: declínio da frase, acento na tônica, pergunta sobe no fim, emoção muda tom, faixa e ritmo
// 4) tudo é calculado amostra por amostra num buffer de áudio: toca liso e dá para pôr efeito de rádio por cima
(function(G){
const FS=22050,FR=200,SPF=FS/FR;// 5 ms por quadro de controle
// ---------- 1. texto -> fonemas
const ACENTO=/[áéíóúâêôãõà]/;const VOG="aeiouáéíóúâêôãõàü";const isV=c=>!!c&&VOG.includes(c);
const CLITICOS=new Set(["o","a","os","as","e","de","do","da","dos","das","que","em","no","na","nos","nas","um","se","me","te","lhe","com","por","pra","pro","para","ao","à","mas","nem","ou"]);
// vogal tônica aberta sem acento gráfico (é/ó): lista das palavras mais comuns + famílias
const ABERTA=new Set("quero querem guerra terra perna perto certo festa testa sexo sete velho velha belo bela pedra regra reta seta fera ela elas eles ele mesmo mesma neve febre leve peça peças peste resto sexta fecha".split(" ").concat("sol porta portas bola bolas volta voltas hora horas roda rodas forte fortes nova novo nove posso pode podem obra cobra moda nossa nosso nossos nossas joga jogo jogos foto fora ótimo rosa roxo corre corre-se morte dose global forma formas norte toca toco".split(" ")));
const ABERTA_E=/^(qualquer|mulher|colher|café|pé|fé|até)$/;
// trema perdido (gu/qu com u pronunciado) e x com outros sons
const QU_W=/^(cinquenta|cinquentão|linguiça|frequente|frequência|consequência|tranquilo|tranquila|aguentar|aguenta|aguentou|bilíngue|pinguim|sequência|eloquente)$/;
const X_KS=/^(táxi|taxi|sexo|tóxico|tóxica|fixo|fixa|boxe|axila|nexo|reflexo|complexo|látex|fax|ônix|xerox|oxigênio|anexo)$/,X_S=/^(próximo|próxima|máximo|máxima|auxílio|trouxe|sintaxe|aproximar|aproxima)$/;
const NASAL_EXC={muito:"mũjtu",muita:"mũjta",muitos:"mũjtus",muitas:"mũjtas"};
const DIG=["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove"];
function vbase(c){return{á:"a",à:"a",â:"ɐ",ã:"a",é:"ɛ",ê:"e",í:"i",ó:"ɔ",ô:"o",õ:"o",ú:"u",ü:"u",a:"a",e:"e",i:"i",o:"o",u:"u"}[c]}
const EXC={box:"bóquis",tv:"tevê",ok:"oquei",push:"púxi",drs:"dê érre ésse",f1:"éfe um",fia:"fía",gp:"gêpê",safety:"seifiti",car:"car",pit:"píti",stop:"istópi"};
const LETRA={a:"á",b:"bê",c:"cê",d:"dê",e:"é",f:"éfe",g:"gê",h:"agá",i:"í",j:"jóta",k:"cá",l:"éle",m:"ême",n:"êne",o:"ó",p:"pê",q:"quê",r:"érre",s:"ésse",t:"tê",u:"ú",v:"vê",w:"dáblio",x:"xís",y:"ípsilon",z:"zê"};
function palavraFon(w0){if(EXC[w0.toLowerCase()])return EXC[w0.toLowerCase()].split(" ").flatMap(x=>palavraFon0(x));
  if(/^[A-Z]{2,4}$/.test(w0))return w0.toLowerCase().split("").flatMap(l=>palavraFon0(LETRA[l]));return palavraFon0(w0)}
function palavraFon0(w0){const w=w0.toLowerCase();
  if(w==="muito"||w==="muita"||w==="muitos"||w==="muitas"){return[{p:"m"},{p:"u",v:1,nas:1,ton:1},{p:"j",g:1,nas:1},{p:"t"},{p:w.endsWith("a")||w.endsWith("as")?"ɐ":"u",v:1,ton:0},...(w.endsWith("s")?[{p:"s"}]:[])]}if(/^\d+$/.test(w))return w.split("").flatMap(d=>palavraFon0(DIG[+d]));
  const P=[];let i=0;const L=w.length;const prox=k=>w[k];
  const nasaliza=()=>{for(let k=P.length-1;k>=0;k--){if(P[k].v){P[k].nas=1;return}if(!P[k].g)return}};
  while(i<L){const c=w[i],n=w[i+1],n2=w[i+2];
    if(isV(c)){
      // ditongos nasais e orais
      if((c==="ã"&&n==="o")){P.push({p:"a",v:1,nas:1,ac:1});P.push({p:"w",g:1,nas:1});i+=2;continue}
      if((c==="õ"&&n==="e")){P.push({p:"o",v:1,nas:1,ac:1});P.push({p:"j",g:1,nas:1});i+=2;continue}
      if((c==="ã"&&n==="e")){P.push({p:"a",v:1,nas:1,ac:1});P.push({p:"j",g:1,nas:1});i+=2;continue}
      const ac=ACENTO.test(c)?1:0;P.push({p:vbase(c),v:1,ac,nas:/[ãõ]/.test(c)?1:0,orig:c});
      if((n==="i"||n==="u")&&"aeoáéóâêôãõ".includes(c)&&!isV(n2)&&!(n2==="n"&&w[i+3]==="h")&&!(i+2===L-1&&/[rzl]/.test(n2))&&!(n2==="m"&&i+3>=L)){P.push({p:n==="i"?"j":"w",g:1});i+=2;continue}
      if(n==="i"&&"aeo".includes(c)&&/[aeo]/.test(n2||"")){P.push({p:"j",g:1});i+=2;continue}
      if(c==="i"&&n==="u"&&(i+2>=L||!isV(n2))){P.push({p:"w",g:1});i+=2;continue}
      i++;continue}
    if(c==="h"){i++;continue}
    if(c==="c"){if(n==="h"){P.push({p:"ʃ"});i+=2;continue}P.push({p:/[eiéêí]/.test(n||"")?"s":"k"});i++;continue}
    if(c==="ç"){P.push({p:"s"});i++;continue}
    if(c==="q"){if(n==="u"&&/[eiéêí]/.test(n2||"")){P.push({p:"k"});if(QU_W.test(w))P.push({p:"w",g:1});i+=2;continue}if(n==="u"){P.push({p:"k"});P.push({p:"w",g:1});i+=2;continue}P.push({p:"k"});i++;continue}
    if(c==="g"){if(n==="u"&&/[eiéêí]/.test(n2||"")){P.push({p:"g"});if(QU_W.test(w))P.push({p:"w",g:1});i+=2;continue}
      if(n==="u"&&/[aoáó]/.test(n2||"")){P.push({p:"g"});P.push({p:"w",g:1});i+=2;continue}P.push({p:/[eiéêí]/.test(n||"")?"ʒ":"g"});i++;continue}
    if(c==="j"){P.push({p:"ʒ"});i++;continue}
    if(c==="l"){if(n==="h"){P.push({p:"ʎ"});i+=2;continue}if(!isV(n)){P.push({p:"w",g:1,deL:1});i++;continue}P.push({p:"l"});i++;continue}
    if(c==="n"||c==="m"){if(c==="n"&&n==="h"){P.push({p:"ɲ"});i+=2;continue}
      if(P.length&&(P[P.length-1].v)&&!isV(n)){nasaliza();if(c==="m"&&i===L-1){const vv=P[P.length-1];if(vv.p==="e"||vv.p==="ɛ")P.push({p:"j",g:1,nas:1});else if(vv.p==="a")P.push({p:"w",g:1,nas:1})}i++;continue}
      P.push({p:c});i++;continue}
    if(c==="r"){if(n==="r"){P.push({p:"H"});i+=2;continue}const ant=w[i-1];
      if(i===0||/[nls]/.test(ant||"")){P.push({p:"H"});i++;continue}
      if(!isV(n)&&isV(ant)){P.push({p:"H",fraco:1});i++;continue}P.push({p:"ɾ"});i++;continue}
    if(c==="s"){if(n==="s"){P.push({p:"s"});i+=2;continue}if(n==="c"&&/[eiéêí]/.test(n2||"")){P.push({p:"s"});i+=2;continue}
      P.push({p:isV(w[i-1])&&isV(n)?"z":"s"});i++;continue}
    if(c==="x"){if(X_KS.test(w)){P.push({p:"k"});P.push({p:"s"});i++;continue}if(X_S.test(w)){P.push({p:"s"});i++;continue}
      if(i>0&&/^(e|ê|é)$/.test(w[i-1])&&(i===1||w[i-2]==="h"||i===1)&&isV(n)){P.push({p:"z"});i++;continue}
      if(i>0&&/[eê]/.test(w[i-1])&&n==="c"&&/[eiéêí]/.test(n2||"")){i++;continue}
      P.push({p:"ʃ"});i++;continue}
    if(c==="z"){P.push({p:i===L-1?"s":"z"});i++;continue}
    if(c==="y"){P.push({p:"i",v:1});i++;continue}
    if(c==="w"){P.push({p:"w",g:1});i++;continue}
    if("pbtdfvk".includes(c)){P.push({p:c});i++;continue}
    i++}
  // sílaba tônica
  const nuc=P.map((x,k)=>x.v?k:-1).filter(k=>k>=0);let ton=-1;const acc=nuc.find(k=>P[k].ac&&P[k].orig&&/[áéíóúâêô]/.test(P[k].orig));
  if(acc!=null)ton=acc;else if(nuc.some(k=>P[k].ac))ton=nuc.find(k=>P[k].ac);
  else if(nuc.length){const fim=w.replace(/[^a-zà-ü]/g,"");const pen=/(a|e|o|as|es|os|am|em|ens)$/.test(fim);ton=pen&&nuc.length>1?nuc[nuc.length-2]:nuc[nuc.length-1]}
  if(CLITICOS.has(w))ton=-1;
  nuc.forEach(k=>{P[k].ton=k===ton?1:0});
  // reduções: vogal final átona (e->i, o->u, a->ɐ), e/o abertos só na tônica
  const ult=nuc[nuc.length-1];
  for(const k of nuc){const x=P[k];if(x.ton){if(!x.orig||!/[êô]/.test(x.orig)){if(x.p==="e"&&(ABERTA.has(w)||ABERTA_E.test(w)))x.p="ɛ";if(x.p==="o"&&ABERTA.has(w))x.p="ɔ"}
      // tônica antes de m/n/nh da sílaba seguinte fica nasal (cama, mecânico)
      const nx=P[k+1],nx2=P[k+2];if(nx&&/^(m|n|ɲ)$/.test(nx.p)&&nx2&&(nx2.v||nx2.g)){x.nas=1;if(x.p==="ɐ")x.p="a"}
      if(x.nas&&x.p==="ɛ"&&x.orig==="é"&&k===ult)x.p="e";continue}
    if(x.p==="ɛ")x.p="e";if(x.p==="ɔ")x.p="o";
    const nx=P[k+1];if(nx&&nx.v&&!x.nas){if(x.p==="e")x.p="i";else if(x.p==="o")x.p="u"}
    const resto=P.slice(k+1);const final=k===ult&&resto.every(y=>y.p==="s"||y.p==="j"||y.p==="w");const nasF=x.nas||resto.some(y=>y.nas);const deL=resto.some(y=>y.deL);
    if(final&&!nasF&&!deL){if(x.p==="e")x.p="i";else if(x.p==="o")x.p="u";else if(x.p==="a")x.p="ɐ"}}
  // t, d antes de i viram "tchi", "dji"
  for(let k=0;k<P.length-1;k++){if((P[k].p==="t"||P[k].p==="d")&&(P[k+1].p==="i"||P[k+1].p==="j"&&!P[k+1].nas))P[k].p=P[k].p==="t"?"tʃ":"dʒ"}
  return P}
function textoFon(txt){const out=[];const re=/#[^#]*#|[0-9]+|[A-Za-zÀ-ÿ]+|[.!?…]+|[,;:—–]/g;let m;
  while((m=re.exec(txt))){const t=m[0];
    if(t[0]==="#"){out.push({p:"BIP",dur:Math.max(.22,(t.length-2)*.065),i0:m.index,i1:m.index+t.length});continue}
    if(/^[.!?…]+$/.test(t)){out.push({p:"_",dur:.42,fim:1,perg:t.includes("?"),excl:t.includes("!"),i0:m.index,i1:m.index+t.length});continue}
    if(/^[,;:—–]$/.test(t)){out.push({p:"_",dur:.24,i0:m.index,i1:m.index+1});continue}
    const F=palavraFon(t);F.forEach((x,k)=>{x.i0=m.index+Math.floor(k/F.length*t.length);x.i1=m.index+Math.floor((k+1)/F.length*t.length);x.pal=1});
    const cl=CLITICOS.has(t.toLowerCase());if(F.length){F[0].ini=1;F[F.length-1].ultP=1;F.forEach(x=>{x.cl=cl})}out.push(...F)}
  if(!out.length||out[out.length-1].p!=="_")out.push({p:"_",dur:.25,fim:1,i0:txt.length,i1:txt.length});
  for(let k=out.length-1;k>0;k--){const a=out[k-1],b=out[k];if(b.ini&&a.ultP&&!a.cl){out.splice(k,0,{p:"_",dur:.055,micro:1,i0:b.i0,i1:b.i0})}}
  // depois de ponto final, se ainda houver fala, uma inspiração curta
  for(let k=out.length-2;k>=0;k--){if(out[k].p==="_"&&out[k].fim&&out.slice(k+1).some(x=>x.v)){out.splice(k+1,0,{p:"RESP",dur:.16,i0:out[k].i1,i1:out[k].i1})}}
  for(let k=1;k<out.length;k++){const a=out[k-1],b=out[k];if(!b.ini||!a.ultP)continue;
    if(a.p==="s"&&(b.v||b.g))a.p="z";// "os outros" -> "uzoutrus"
    if(a.v&&!a.ton&&b.v){a.curto=1}// "que ele" -> "kieli": vogal átona encosta na seguinte
    if(a.p==="H"&&(b.v||b.g)){a.p="ɾ"}// "falar alto" -> "falaralto"
  }
  // acentos de altura: nem toda palavra ganha "pico"; frase soa contínua
  let n=0;for(const x of out){if(x.v&&x.ton){x.acc=(n++%2===0)?1:.45}}
  return out}
// ---------- 2. fonemas -> alvos
const V={a:[760,1300,2500],ɐ:[600,1380,2500],ɛ:[610,1850,2550],e:[430,2050,2620],i:[290,2280,2950],ɔ:[600,960,2450],o:[450,880,2400],u:[320,760,2350],j:[290,2200,2950],w:[330,720,2300]};
const LOC={lab:[300,900,2200],alv:[320,1700,2600],vel:[320,1800,2400],pal:[300,2050,2700]};
const C={
  m:{t:"nas",F:[270,1000,2250],loc:"lab"},n:{t:"nas",F:[270,1600,2600],loc:"alv"},ɲ:{t:"nas",F:[270,2100,2800],loc:"pal"},
  l:{t:"lat",F:[360,1150,2600]},ʎ:{t:"lat",F:[300,2050,2800]},ɾ:{t:"tap",F:[420,1450,2350]},
  f:{t:"fri",voz:0,ru:[6500,5000,.22],loc:"lab"},v:{t:"fri",voz:1,ru:[6500,5000,.12],loc:"lab"},
  s:{t:"fri",voz:0,ru:[5600,2600,.62],loc:"alv"},z:{t:"fri",voz:1,ru:[5600,2600,.32],loc:"alv"},
  ʃ:{t:"fri",voz:0,ru:[3100,1900,.62],loc:"pal"},ʒ:{t:"fri",voz:1,ru:[3100,1900,.32],loc:"pal"},
  H:{t:"asp"},
  p:{t:"oc",voz:0,ex:[1300,2200,.32],loc:"lab"},b:{t:"oc",voz:1,ex:[1300,2200,.2],loc:"lab"},t:{t:"oc",voz:0,ex:[4300,3200,.42],loc:"alv"},d:{t:"oc",voz:1,ex:[4300,3200,.26],loc:"alv"},
  k:{t:"oc",voz:0,ex:[2300,1600,.46],loc:"vel"},g:{t:"oc",voz:1,ex:[2300,1600,.28],loc:"vel"},
  "tʃ":{t:"afr",voz:0,ru:[3100,1900,.6],loc:"pal"},"dʒ":{t:"afr",voz:1,ru:[3100,1900,.3],loc:"pal"}};
const BOCA={RESP:" ",a:"a",ɐ:"a",ɛ:"e",e:"e",i:"i",ɔ:"o",o:"o",u:"u",j:"i",w:"u",m:"m",n:"n",ɲ:"n",l:"l",ʎ:"l",ɾ:"r",f:"f",v:"v",s:"s",z:"s",ʃ:"s",ʒ:"s",H:"r",p:"p",b:"b",t:"t",d:"d",k:"k",g:"g","tʃ":"s","dʒ":"s",_:" ",BIP:"t"};
// ---------- 3. síntese
function bpf(F,B){const w=2*Math.PI*Math.min(F,FS*.45)/FS,Q=F/B,al=Math.sin(w)/(2*Q),a0=1+al;return[al/a0,-al/a0,-2*Math.cos(w)/a0,(1-al)/a0]}
function res(F,B){const r=Math.exp(-Math.PI*B/FS);const b=2*r*Math.cos(2*Math.PI*F/FS),c=-r*r;return[1-b-c,b,c]}
function sintetiza(txt,vz,em){const S=textoFon(txt);
  // durações (s) e linha do tempo
  const vel=vz.vel*(1+(em.vel-1)*.6)*.86*(G.VOZ_RITMO||1);let t=0;const segs=[];const nV=S.filter(x=>x.v).length;let kv=0;
  // última tônica de cada frase recebe o acento principal
  let fraseIni=0;for(let k=0;k<S.length;k++){if(S[k].p==="_"&&S[k].fim){for(let j=k-1;j>=fraseIni;j--)if(S[j].v&&S[j].ton){S[j].nuc=1;S[j].perg=S[k].perg;S[j].excl=S[k].excl;break}
      for(let j=k-1;j>=fraseIni;j--)if(S[j].v){S[j].fimFrase=1;S[j].perg=S[k].perg;break}fraseIni=k+1}}
  for(const x of S){let d;const c=C[x.p];
    if(x.p==="_"||x.p==="BIP"||x.p==="RESP")d=x.dur;
    else if(x.v)d=(x.ton?(x.nuc?.17:.145):.088)*(x.nas?1.1:1)*(x.fimFrase?1.35:1)*(x.p==="ɐ"?.9:1)*(x.curto?.6:1)*(x.cl?.85:1)*(x.ultP&&!x.cl?1.15:1);
    else if(x.g)d=.05;
    else if(c.t==="nas")d=.06;else if(c.t==="lat")d=.055;else if(c.t==="tap")d=.03;else if(c.t==="fri")d=x.p==="s"||x.p==="ʃ"?.095:.075;
    else if(c.t==="asp")d=x.fraco?.04:.065;else if(c.t==="oc")d=x.ini?.07:.062;else if(c.t==="afr")d=.1;else d=.07;
    if(!x.v&&x.p!=="_"&&x.p!=="BIP"&&x.p!=="RESP")d*=1.12;
    if(x.p!=="_"&&x.p!=="BIP"&&x.p!=="RESP")d/=vel;else d/=Math.sqrt(vel);segs.push({x,t0:t,d});t+=d}
  const tot=t+.12,nF=Math.ceil(tot*FR)+2;
  // trilhas por quadro: alvos crus
  const A={F1:new Float32Array(nF),F2:new Float32Array(nF),F3:new Float32Array(nF),AV:new Float32Array(nF),AH:new Float32Array(nF),AF:new Float32Array(nF),FC:new Float32Array(nF),BC:new Float32Array(nF),AN:new Float32Array(nF),BIP:new Float32Array(nF),F0:new Float32Array(nF),B1:new Float32Array(nF)};
  const vizV=(k,dir)=>{for(let j=k+dir;j>=0&&j<segs.length;j+=dir){const y=segs[j].x;if(y.v||y.g)return V[y.p];if(y.p==="_")break}return V.ɐ};
  let alvoF=V.ɐ;
  segs.forEach((s,k)=>{const x=s.x,c=C[x.p];const f0=Math.floor(s.t0*FR),f1=Math.max(f0+1,Math.floor((s.t0+s.d)*FR));
    for(let f=f0;f<f1&&f<nF;f++){const u=(f-f0)/(f1-f0);let F=alvoF,AV=0,AH=0,AF=0,FC=4000,BC=2000,AN=0,BIP=0,B1=80;
      if(x.p==="_"){F=alvoF}
      else if(x.p==="BIP"){BIP=1}
      else if(x.p==="RESP"){F=V.ɐ;AH=.16*Math.sin(Math.PI*u);AV=0}
      else if(x.v||x.g){F=V[x.p];AV=x.g?.75:(x.ton?1:.82);if(x.nas){AN=.55;B1=150;AV*=.9}if(x.fimFrase)AV*=1-.55*Math.max(0,u-.5)/.5;AH=em.ar*.4}
      else if(c.t==="nas"){F=c.F;AV=.42;AN=1;B1=120}
      else if(c.t==="lat"){F=c.F;AV=.55}
      else if(c.t==="tap"){F=c.F;AV=u<.3||u>.75?.55:.18}
      else if(c.t==="fri"){F=LOC[c.loc];const env=Math.min(1,u*5,(1-u)*5);AF=c.ru[2]*env;FC=c.ru[0];BC=c.ru[1];AV=c.voz?.32:0}
      else if(c.t==="asp"){F=vizV(k,1);AH=(x.fraco?.35:.6)*Math.min(1,u*4,(1-u)*4);AV=0}
      else if(c.t==="oc"){F=LOC[c.loc];if(x.p==="k"||x.p==="g"){const vv=vizV(k,1);F=[300,vv[1]>1600?2100:1300,2400]}
        if(u<.72){AV=c.voz?.14:0;B1=200;if(c.voz)F=[200,F[1],F[2]]}else if(u<.86){AF=c.ex[2]*1.6;FC=c.ex[0];BC=c.ex[1];AV=c.voz?.3:0}else{AH=c.voz?0:.25;AV=c.voz?.5:0}}
      else if(c.t==="afr"){F=LOC.pal;if(u<.38){AV=c.voz?.14:0}else{const e2=Math.min(1,(u-.38)*12,(1-u)*6);AF=c.ru[2]*e2;FC=c.ru[0];BC=c.ru[1];AV=c.voz?.3:0}}
      A.F1[f]=F[0]*vz.fs;A.F2[f]=F[1]*vz.fs;A.F3[f]=F[2]*vz.fs;A.AV[f]=AV*em.en;A.AH[f]=AH;A.AF[f]=AF*em.en;A.FC[f]=FC*Math.min(1.12,vz.fs);A.BC[f]=BC;A.AN[f]=AN;A.BIP[f]=BIP;A.B1[f]=B1}
    if(x.v||x.g||(c&&(c.t==="nas"||c.t==="lat")))alvoF=x.v||x.g?V[x.p]:c.F});
  for(let f=Math.floor(t*FR);f<nF;f++){A.F1[f]=A.F1[f-1]||500;A.F2[f]=A.F2[f-1]||1500;A.F3[f]=A.F3[f-1]||2500;A.FC[f]=4000;A.BC[f]=2000;A.B1[f]=80}
  // entonação: um ponto de alvo no meio de cada vogal, ligado por linha contínua (atravessa as consoantes)
  const base=vz.f0*em.f;const pts=[];const fim0=t;
  segs.forEach(s=>{const x=s.x;if(!x.v)return;const tm=s.t0+s.d*.5;const prog=Math.min(1,tm/Math.max(.5,fim0));let m=1.06-.16*prog;
    if(x.ton)m*=1+.13*(x.acc||.5)*em.var/.12;
    if(x.nuc){if(x.perg){pts.push([s.t0+s.d*.2,m*base]);m*=1+.38*em.var/.12;pts.push([s.t0+s.d,m*base]);return}
      if(x.excl)m*=1+.18*em.var/.12;pts.push([s.t0+s.d*.25,m*base]);pts.push([s.t0+s.d*.95,m*base*.82]);return}
    if(x.fimFrase&&!x.perg){pts.push([s.t0+s.d*.3,m*base*.9]);pts.push([s.t0+s.d,m*base*.8]);return}
    if(x.fimFrase&&x.perg&&!x.nuc){const ult=pts.length?pts[pts.length-1][1]:m*base;pts.push([s.t0+s.d*.85,ult*1.1]);return}
    pts.push([tm,m*base])});
  if(!pts.length)pts.push([0,base]);
  for(let f=0,j=0;f<nF;f++){const tt=f/FR;while(j<pts.length-1&&pts[j+1][0]<tt)j++;const a0=pts[j],a1=pts[Math.min(j+1,pts.length-1)];
    if(tt<=pts[0][0])A.F0[f]=pts[0][1];else if(a1===a0||tt>=a1[0])A.F0[f]=a0[1];else{const u=(tt-a0[0])/(a1[0]-a0[0]);const s2=u*u*(3-2*u);A.F0[f]=a0[1]+(a1[1]-a0[1])*s2}}
  // suaviza: formantes (coarticulação ~22 ms), amplitudes (~5 ms), f0 (~35 ms)
  const sm=(arr,tau)=>{const k=1-Math.exp(-1/(FR*tau));let y=arr[0];for(let f=0;f<arr.length;f++){y+=(arr[f]-y)*k;arr[f]=y}};
  const smB=(arr,tau)=>{const k=1-Math.exp(-1/(FR*tau));let y=arr[arr.length-1];for(let f=arr.length-1;f>=0;f--){y+=(arr[f]-y)*k;arr[f]=(arr[f]+y)/2}};
  ["F1","F2","F3"].forEach(n=>{sm(A[n],.02);smB(A[n],.006)});sm(A.B1,.02);sm(A.F0,.03);smB(A.F0,.02);{const ka=1-Math.exp(-1/(FR*.009)),kr=1-Math.exp(-1/(FR*.0035));let y=A.AV[0];for(let f=0;f<nF;f++){const k2=A.AV[f]>y?ka:kr;y+=(A.AV[f]-y)*k2;A.AV[f]=y}}sm(A.AF,.003);smB(A.AF,.002);sm(A.AN,.015);sm(A.AH,.006);sm(A.FC,.008);
  // amostras
  const N=Math.ceil(tot*FS),out=new Float32Array(N);let fase=0,T=1/base,jit=1,shim=1,gPrev=0;
  const r=[[0,0],[0,0],[0,0],[0,0],[0,0]],rn=[0,0],rf=[0,0,0],ra=[0,0,0];const KF=G.VOZ_KF||2.2;let co=null,coN=null,coF=null;let hpX=0,hpY=0,dcX=0,dcY=0,bipF=0;
  const F45=[3350*vz.fs,3900*vz.fs];const OQ=vz.oq;
  for(let n=0;n<N;n++){const f=Math.min(nF-1,Math.floor(n/SPF));
    if(n%SPF===0||!co){co=[res(A.F1[f],A.B1[f]),res(A.F2[f],90),res(A.F3[f],150),res(F45[0],250),res(F45[1],320)];coN=res(260,110);coF=bpf(A.FC[f],A.BC[f])}
    const f0=A.F0[f]*(1+.006*Math.sin(n/FS*2*Math.PI*5.2))*jit;fase+=f0/FS;if(fase>=1){fase-=1;jit=1+(Math.random()-.5)*.012;shim=1+(Math.random()-.5)*.06}
    // pulso glotal (Rosenberg) e sua derivada
    const tp=OQ*.66,tn=OQ*.34;let g=0;if(fase<tp)g=.5*(1-Math.cos(Math.PI*fase/tp));else if(fase<OQ)g=Math.cos(Math.PI*(fase-tp)/(2*tn));
    let src=(g-gPrev)*6*A.AV[f]*shim;gPrev=g;
    const ruido=Math.random()*2-1;src+=ruido*(A.AH[f]*.35+A.AV[f]*vz.ar*(fase<OQ?.5:.15));
    // trato vocal em cascata
    let y=src;for(let j=0;j<5;j++){const q=co[j],R=r[j];const v=q[0]*y+q[1]*R[0]+q[2]*R[1];R[1]=R[0];R[0]=v;y=v}
    // ressonância nasal em paralelo
    const vn=coN[0]*src+coN[1]*rn[0]+coN[2]*rn[1];rn[1]=rn[0];rn[0]=vn;y=y*(1-.45*A.AN[f])+vn*A.AN[f]*.9;
    // fricção e estouros
    let vf=coF[0]*ruido+coF[1]*rf[2]-coF[2]*rf[0]-coF[3]*rf[1];rf[2]=ruido;rf[1]=rf[0];rf[0]=vf;
    const vf2=coF[0]*vf+coF[1]*ra[2]-coF[2]*ra[0]-coF[3]*ra[1];ra[2]=vf;ra[1]=ra[0];ra[0]=vf2;y+=vf2*A.AF[f]*KF;
    // bip
    if(A.BIP[f]>0){bipF+=1000/FS;y+=Math.sin(2*Math.PI*bipF)*.16*A.BIP[f]}
    const dc=y-dcX+.995*dcY;dcX=y;dcY=dc;out[n]=dc}
  let mx=0;for(let n=0;n<N;n++)mx=Math.max(mx,Math.abs(out[n]));const k=.85/Math.max(mx,1e-4);for(let n=0;n<N;n++)out[n]*=k;
  // linha do tempo para a boca: letra-boca por fonema
  const boca=segs.map(s=>BOCA[s.x.p]||" ").join("");const tl=segs.map((s,i)=>[s.t0,i,i+1,s.x.p==="BIP"?1:0]);
  return{amostras:out,fs:FS,dur:tot,boca,tl,fon:segs.map(s=>s.x.p).join(" "),segs:segs.map(s=>({p:s.x.p,t0:+s.t0.toFixed(4),d:+s.d.toFixed(4),v:!!s.x.v,g:!!s.x.g,ton:!!s.x.ton,ini:!!s.x.ini,ult:!!s.x.ultP,nas:!!s.x.nas,fim:!!s.x.fim,perg:!!s.x.perg}))}}
// vozes (tom em Hz, escala dos formantes, velocidade, soprosidade, abertura glotal)
const VOZ_PT={piloto:{f0:116,fs:1,vel:1.05,ar:.05,oq:.58},engenheiro:{f0:98,fs:.95,vel:.95,ar:.04,oq:.55},reporter:{f0:205,fs:1.17,vel:1.08,ar:.1,oq:.68},chefe:{f0:182,fs:1.14,vel:.95,ar:.08,oq:.66},rival:{f0:128,fs:1.03,vel:1.12,ar:.06,oq:.58}};
const EMO_PT={neutro:{f:1,var:.12,vel:1,en:1,ar:.05},feliz:{f:1.1,var:.18,vel:1.05,en:1,ar:.06},rindo:{f:1.16,var:.22,vel:1.08,en:1,ar:.1},confiante:{f:1.0,var:.12,vel:.96,en:1,ar:.04},
  serio:{f:.95,var:.08,vel:.94,en:.95,ar:.04},irritado:{f:1.14,var:.2,vel:1.14,en:1,ar:.07},triste:{f:.9,var:.06,vel:.82,en:.8,ar:.12},pensativo:{f:.96,var:.09,vel:.86,en:.9,ar:.08},convencido:{f:1.04,var:.15,vel:.97,en:1,ar:.05}};
G.VOZPT={sintetiza,textoFon,palavraFon,VOZ_PT,EMO_PT,V,C};
})(typeof window!=="undefined"?window:globalThis);
