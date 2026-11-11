// ===================== CIRCUITOS DO CALENDÁRIO 2026 =====================
// Os traçados vêm das coordenadas reais (realtrk.js). A descrição "tartaruga" abaixo fica como reserva:
// sN = reta de N metros; lA/R ou rA/R = curva à esquerda/direita de A graus com raio R metros.
// O construtor fecha o traçado e ajusta o comprimento ao oficial. Os tempos de volta são calibrados para ficarem próximos dos reais.
const CIRCUITS=[
 {id:"melbourne",gp:"GP da Austrália",n:"Albert Park",city:"Melbourne",nat:"Austrália",len:5278,laps:58,target:80.2,pit:19.5,wear:.95,rain:.18,ovt:.55,cw:true,
  t:"s620 r70/38 l50/55 s330 r95/24 l55/45 s420 r35/220 s260 r85/38 l55/50 s520 r35/320 s300 r95/32 l85/30 s640 r85/45 s160 r40/70 s240 r105/28 l30/90 s180 r100/34 s90",
  names:["Curva 1 (Jones)","Curva 3","Lauda","Waite","Ascari","Curva 9-10","Curva 11-12 (Whiteford)","Curva 13","Prost"]},
 {id:"shanghai",gp:"GP da China",n:"Xangai",city:"Xangai",nat:"China",len:5451,laps:56,target:93.5,pit:23,wear:1.1,rain:.2,ovt:.65,cw:true,sprint:true,
  t:"s550 r250/28 l70/60 s250 r100/30 s400 r70/120 l60/70 l50/60 s300 r90/40 r90/50 r60/70 s1150 r170/22 s250 l60/40 l60/50 s350",
  names:["Caracol (Curva 1)","Curva 3","Curva 6","Curva 7-8","Curva 11","Curva 13","Grampo (Curva 14)","Curva 16"]},
 {id:"suzuka",gp:"GP do Japão",n:"Suzuka",city:"Suzuka",nat:"Japão",len:5807,laps:53,target:90.5,pit:22.5,wear:1.2,rain:.32,ovt:.35,cw:true,
  t:"s550 r80/120 r40/90 s150 l45/70 r55/70 l60/70 r40/100 s350 l100/55 s250 r70/70 r60/50 s300 l180/16 s450 r30/350 s100 l160/55 s700 l60/230 s450 r60/20 l70/20 s300",
  names:["Curva 1","Os S","Dunlop","Degner","Grampo","Spoon","130R","Chicane Casio"]},
 {id:"miami",gp:"GP de Miami",n:"Miami",city:"Miami",nat:"Estados Unidos",len:5412,laps:57,target:89.5,pit:20,wear:1.05,rain:.18,ovt:.6,cw:false,sprint:true,
  t:"s550 l90/40 r40/60 l60/80 r30/150 l40/120 s250 r50/80 s300 l100/30 s1100 l150/25 s250 r40/40 l40/40 r90/25 s600 l30/200 s700 l100/35 s400 l60/60 s200",
  names:["Curva 1","Curvas 4-6","Curva 7","Curva 11","Chicane 14-15","Curva 17"]},
 {id:"montreal",gp:"GP do Canadá",n:"Gilles Villeneuve",city:"Montreal",nat:"Canadá",len:4361,laps:70,target:73,pit:18.5,wear:.9,rain:.3,ovt:.7,cw:false,sprint:true,
  t:"s450 l60/40 r150/30 s300 l50/60 r60/50 s400 r80/45 l80/45 s500 l20/300 s300 r160/18 s1100 r50/40 l50/40 s250",
  names:["Senna (Curva 1-2)","Chicane 3-4","Curvas 6-7","Curva 8-9","Grampo","Muro dos Campeões"]},
 {id:"monaco",gp:"GP de Mônaco",n:"Mônaco",city:"Monte Carlo",nat:"Mônaco",len:3337,laps:78,target:72.5,pit:24,wear:.55,rain:.15,ovt:.05,cw:true,street:true,
  t:"s250 r90/28 s350 l35/120 r80/30 s200 l60/40 r80/22 s100 r160/10 r90/25 s120 r100/22 s500 r20/200 l50/22 r60/25 s200 r40/45 l70/25 r60/30 l80/20 r70/22 s120 r100/18 s80 r80/25 s100",
  names:["Sainte Dévote","Massenet","Cassino","Mirabeau","Grampo do Fairmont","Portier","Túnel","Nova Chicane","Tabac","Piscina","Rascasse","Anthony Noghès"]},
 {id:"barcelona",gp:"GP de Barcelona-Catalunha",n:"Catalunha",city:"Barcelona",nat:"Espanha",len:4657,laps:66,target:73,pit:21.5,wear:1.3,rain:.08,ovt:.4,cw:true,
  t:"s1000 r90/35 l60/45 r180/95 s250 r90/50 s200 l100/30 s200 l45/80 r60/60 s250 r90/110 s650 l150/22 l30/150 s200 r120/50 s150 r80/60 r40/40 s450",
  names:["Elf (Curva 1)","Renault (Curva 3)","Repsol","Seat","Curva 7","Campsa","La Caixa","Banc Sabadell","Europcar","New Holland"]},
 {id:"spielberg",gp:"GP da Áustria",n:"Spielberg Ring",city:"Spielberg",nat:"Áustria",len:4318,laps:71,target:65.5,pit:20,wear:1,rain:.25,ovt:.75,cw:true,
  t:"s350 r70/60 s600 r110/22 s700 r100/40 s150 l120/40 l60/90 r90/70 s250 r100/80 r80/90 s200",
  names:["Niki Lauda (Curva 1)","Remus (Curva 3)","Schlossgold (Curva 4)","Rauch","Würth","Rindt","Curva 10"]},
 {id:"silverstone",gp:"GP da Grã-Bretanha",n:"Silverstone",city:"Silverstone",nat:"Grã-Bretanha",len:5891,laps:52,target:87,pit:20,wear:1.25,rain:.38,ovt:.6,cw:true,sprint:true,
  t:"s300 r30/250 r60/120 s200 r90/30 l100/30 s750 r120/35 r60/40 s350 r80/170 s300 l40/150 r60/120 l50/120 r40/150 s850 r90/100 s300 l70/40 r60/40 s250 r30/120 s150",
  names:["Abbey","Farm","Village","The Loop","Aintree","Brooklands","Luffield","Copse","Maggotts","Becketts","Chapel","Stowe","Vale","Club"]},
 {id:"spa",gp:"GP da Bélgica",n:"Spa-Francorchamps",city:"Spa",nat:"Bélgica",len:7004,laps:44,target:104.5,pit:19,wear:1.05,rain:.45,ovt:.75,cw:true,
  t:"s250 r160/18 s200 l40/150 r60/120 l35/200 s1350 r60/70 l70/60 r50/80 s300 r160/30 s300 l100/60 r140/80 s500 l60/120 s700 r60/200 s400 l40/40 r60/40 s400 r70/150 s150",
  names:["La Source","Eau Rouge","Raidillon","Reta Kemmel","Les Combes","Bruxelas","Pouhon","Fagnes","Stavelot","Blanchimont","Bus Stop"]},
 {id:"budapest",gp:"GP da Hungria",n:"Hungaroring",city:"Budapeste",nat:"Hungria",len:4381,laps:70,target:77.5,pit:21,wear:1,rain:.15,ovt:.25,cw:true,
  t:"s750 r140/32 s250 l90/50 s350 r100/40 s180 r90/60 s250 l90/35 r90/35 s250 l60/80 r50/80 s300 r90/45 s300 l70/35 r100/40 s200 r100/50 s300",
  names:["Curva 1","Curva 2","Curva 3","Curva 4","Chicane 6-7","Curva 8-9","Curva 11","Curva 12","Curva 13","Curva 14"]},
 {id:"zandvoort",gp:"GP da Holanda",n:"Zandvoort",city:"Zandvoort",nat:"Holanda",len:4259,laps:72,target:71.5,pit:21,wear:1.15,rain:.3,ovt:.25,cw:true,sprint:true,
  t:"s680 r180/38 s150 l40/90 r90/50 s300 l60/90 r70/45 l40/120 r90/90 s250 l60/60 r70/40 s300 r40/120 l30/150 s200 r180/80 s250",
  names:["Tarzan","Gerlach","Hugenholtz","Hunserug","Rob Slotemaker","Scheivlak","Mastersbocht","Bocht 11","Hans Ernst","Arie Luyendyk"]},
 {id:"monza",gp:"GP da Itália",n:"Monza",city:"Monza",nat:"Itália",len:5793,laps:53,target:80.5,pit:24,wear:.85,rain:.15,ovt:.8,cw:true,
  t:"s1100 r80/22 l80/22 s300 r90/190 s450 l50/40 r50/40 s350 r85/90 s150 r70/90 s1000 l40/60 r40/60 l25/250 s950 r180/110 s700",
  names:["Variante del Rettifilo","Curva Grande","Variante della Roggia","Lesmo 1","Lesmo 2","Variante Ascari","Parabolica (Alboreto)"]},
 {id:"madrid",gp:"GP da Espanha",n:"Madring",city:"Madri",nat:"Espanha",len:5474,laps:57,target:92,pit:22,wear:1,rain:.1,ovt:.55,cw:false,street:true,
  t:"s700 l90/40 r60/60 s300 l80/45 s250 r40/90 l120/60 s500 l200/90 s400 r90/35 l70/40 s600 l90/30 r40/80 s450 l60/50 s350 l90/45 s300",
  names:["Curva 1","Curva 3","Curva 5","La Monumental","Curva 13","Curva 15","Curva 18","Curva 20"]},
 {id:"baku",gp:"GP do Azerbaijão",n:"Baku",city:"Baku",nat:"Azerbaijão",len:6003,laps:51,target:103,pit:20,wear:.85,rain:.08,ovt:.75,cw:false,street:true,
  t:"s450 l90/20 s400 l90/22 s300 r90/22 s250 l90/25 l60/60 s250 r90/22 l50/20 r60/20 l90/22 s300 r90/25 s300 l80/40 l30/200 s2200 l20/300 s300",
  names:["Curva 1","Curva 2","Curva 3","Curva 4","Castelo (Curvas 8-10)","Curva 12","Curva 15","Curva 16"]},
 {id:"singapura",gp:"GP de Singapura",n:"Marina Bay",city:"Singapura",nat:"Singapura",len:4940,laps:62,target:91.5,pit:28,wear:1.1,rain:.3,ovt:.25,cw:false,street:true,night:true,sprint:true,
  t:"s500 l80/35 r50/40 l70/30 s450 l60/90 s650 r90/25 s350 l90/30 s250 r90/25 s450 l90/30 s250 r80/30 l90/25 s400 l90/25 s400 l90/30 r60/40 s300 l90/30 s250 l90/40 s400",
  names:["Curva 1-3","Curva 5","Curva 7","Curva 8","Curva 10","Ponte Anderson","Curva 14","Curva 16-17","Curva 19","Curva 23"]},
 {id:"austin",gp:"GP dos Estados Unidos",n:"Circuito das Américas",city:"Austin",nat:"Estados Unidos",len:5513,laps:56,target:94.5,pit:20.5,wear:1.2,rain:.12,ovt:.65,cw:false,
  t:"s650 l140/22 r70/80 l55/90 r55/90 l55/90 r50/90 l70/60 r40/80 s250 l110/35 s1150 l120/28 s300 r60/50 l60/40 r90/45 s200 r150/70 l100/35 s300 l90/45 s400",
  names:["Curva 1","Esses (3-6)","Curva 9","Curva 11","Curva 12","Curvas 13-15","Curvas 16-18","Curva 19","Curva 20"]},
 {id:"mexico",gp:"GP da Cidade do México",n:"Hermanos Rodríguez",city:"Cidade do México",nat:"México",len:4304,laps:71,target:77.5,pit:22,wear:.85,rain:.1,ovt:.55,cw:true,
  t:"s1200 r90/30 l70/30 r40/120 s500 l90/30 r90/30 s200 l60/60 r60/60 l60/60 r60/60 s250 r90/35 s300 r60/40 l90/25 r90/25 r60/80 s400 r60/200 s100",
  names:["Curva 1","Curva 4","Curva 6","Esses (7-11)","Curva 12","Foro Sol","Peraltada"]},
 {id:"interlagos",gp:"GP de São Paulo",n:"Interlagos",city:"São Paulo",nat:"Brasil",len:4309,laps:71,target:70.5,pit:21,wear:1.05,rain:.42,ovt:.75,cw:false,
  t:"s420 l75/40 r55/50 l60/75 l70/140 s650 l55/85 l40/100 s180 r90/85 r55/70 s120 l105/32 s80 r130/24 s90 l75/60 s120 l85/45 l35/400 s350 l25/700 s250",
  names:["S do Senna","Curva do Sol","Reta Oposta","Descida do Lago","Ferradura","Laranjinha","Pinheirinho","Bico de Pato","Mergulho","Junção","Subida dos Boxes"]},
 {id:"lasvegas",gp:"GP de Las Vegas",n:"Las Vegas Strip",city:"Las Vegas",nat:"Estados Unidos",len:6201,laps:50,target:94,pit:20,wear:.8,rain:.03,ovt:.8,cw:false,street:true,night:true,
  t:"s400 l90/25 r60/40 l40/60 s450 l90/40 s300 r40/80 l40/80 s1900 l90/25 r90/25 l90/30 s500 l50/90 s700 l60/120 l40/40 r40/40 s300",
  names:["Curva 1","Curva 4","Curva 5","Sphere","Strip","Curva 12","Curva 14","Chicane 16-17"]},
 {id:"lusail",gp:"GP do Catar",n:"Lusail",city:"Lusail",nat:"Catar",len:5419,laps:57,target:82.5,pit:24,wear:1.35,rain:.02,ovt:.45,cw:true,night:true,
  t:"s1000 r90/60 l40/120 r60/80 l70/90 r90/100 r50/120 l60/90 r100/70 s300 r80/110 l40/200 r100/80 r60/90 s350 r60/150 r90/100 s200",
  names:["Curva 1","Curva 2","Curva 4","Curva 6","Curva 10","Curva 12-14","Curva 16"]},
 {id:"abudhabi",gp:"GP de Abu Dhabi",n:"Yas Marina",city:"Abu Dhabi",nat:"Emirados Árabes",len:5281,laps:58,target:84,pit:21,wear:.95,rain:.02,ovt:.55,cw:false,night:true,
  t:"s400 l90/55 r40/120 l30/150 s250 r100/30 s1100 l90/30 s900 l90/30 r40/60 l90/30 s300 r90/30 l40/60 r90/30 l40/40 r90/30 s200 r60/60 r60/60 l90/45 s300",
  names:["Curva 1","Curva 5","Curva 6-7","Curva 9","Curvas do hotel","Curva 14","Curva 16"]}
];
const CIR=Object.fromEntries(CIRCUITS.map(c=>[c.id,c]));
// nomes das curvas na ordem em que aparecem nos traçados reais (as curvas de alta são contadas quando o traçado pede)
const RNAMES={
 monaco:["Sainte Dévote","Beau Rivage","Massenet","Cassino","Mirabeau","Grampo do Fairmont","Portier","Túnel","Saída do túnel","Nova Chicane","Tabac","Piscina","Saída da Piscina","Rascasse"],
 monza:["Variante del Rettifilo","Curva Grande","Curva Grande","Curva Grande (saída)","Curva Grande (saída)","Variante della Roggia","Lesmo 1","Lesmo 2","Variante Ascari","Saída da Ascari","Parabolica (Alboreto)"],
 spa:["La Source","Eau Rouge","Raidillon","Les Combes","Saída de Les Combes","Bruxelas","Curva 9","Pouhon","Saída da Pouhon","Fagnes","Saída da Fagnes","Stavelot","Paul Frère","Blanchimont","Blanchimont","Saída da Blanchimont","Bus Stop"],
 silverstone:["Abbey","Farm","Village","The Loop","Aintree","Brooklands","Luffield","Saída da Luffield","Woodcote","Copse","Maggotts","Becketts","Chapel","Stowe","Vale","Club"],
 suzuka:["Curva 1-2","Os S (Curva 3)","Os S (Curva 4)","Os S (Curva 5)","Os S (Curva 6)","Dunlop","Saída da Dunlop","Degner 1","Degner 2","Grampo","200R","Saída da 200R","Spoon","Saída da Spoon","Reta oposta","130R","Chicane Casio"],
 montreal:["Senna (Curva 1-2)","Chicane 3-4","Curva 5","Chicane 6-7","Chicane 8-9","Grampo (Curva 10)","Muro dos Campeões"],
 spielberg:["Niki Lauda (Curva 1)","Remus (Curva 3)","Schlossgold (Curva 4)","Rauch (Curva 6)","Würth (Curva 7)","Jochen Rindt (Curva 9)","Curva 10"],
 barcelona:["Elf (Curva 1)","Renault (Curva 3)","Repsol (Curva 4)","Seat (Curva 5)","Curva 6","Würth (Curva 7)","Campsa (Curva 9)","La Caixa (Curva 10)","Curva 11","Banc Sabadell (Curva 12)","Curva 13","New Holland (Curva 14)"],
 budapest:["Curva 1","Saída da Curva 1","Curva 2","Curva 3","Curva 4","Curva 5","Chicane (Curva 6)","Chicane (Curva 7)","Curva 8-9","Curva 10","Curva 11","Curva 12","Curva 13","Curva 14"],
 zandvoort:["Tarzan","Gerlach","Hugenholtz","Hunserug","Rob Slotemaker","Scheivlak","Mastersbocht","Curva 9","Curva 10","Hans Ernst","Curva 13","Arie Luyendyk"],
 interlagos:["S do Senna","Curva do Sol","Descida do Lago","Lago","Ferradura","Laranjinha","Pinheirinho","Bico de Pato","Mergulho","Junção","Subida dos Boxes","Subida dos Boxes","Arquibancadas","Reta dos Boxes"],
 mexico:["Curva 1","Curva 2-3","Curva 4","Curva 5","Curva 6","Esses (Curva 7)","Esses (Curva 9)","Esses (Curva 10-11)","Curva 12","Foro Sol","Foro Sol (saída)","Peraltada"],
 baku:["Curva 1","Curva 2","Curva 3","Curva 4","Curva 5","Curva 6","Castelo (Curva 8)","Castelo (Curva 9-10)","Curva 12","Curva 13","Curva 14","Curva 15","Curva 16","Curva 17","Curva 18","Curva 19"],
 shanghai:["Caracol (Curva 1)","Caracol (Curva 2-3)","Curva 4","Curva 6","Curva 7","Curva 8","Curva 9","Curva 10","Curva 11","Curva 12","Curva 13","Grampo (Curva 14)","Curva 16"],
 austin:["Curva 1","Curva 2","Esses (Curva 3)","Esses (Curva 4)","Esses (Curva 5)","Esses (Curva 6)","Curva 7-9","Curva 11","Curva 12","Curva 13","Curva 15","Curva 16","Curva 17-18","Curva 19","Curva 20"]};
// onde fica a linha de largada (metros a partir do início do traçado real), quando ele não começa nela
const RSTART={monaco:2400,silverstone:3150};
for(const c of CIRCUITS)if(typeof REALTRK!=="undefined"&&REALTRK[c.id])c.names=RNAMES[c.id]||[];
const DS=4;// resolução em metros

function parseTurtle(str){return str.trim().split(/\s+/).map(tok=>{const k=tok[0];if(k==="s")return{k:"s",len:+tok.slice(1)};const[a,r]=tok.slice(1).split("/").map(Number);return{k,ang:a,r}})}
// spline Catmull-Rom centrípeta por um ponto de controle (u de 0 a 1 entre P1 e P2)
function crPoint(P0,P1,P2,P3,u){const d=(A,B)=>Math.max(1e-6,Math.sqrt(Math.hypot(B[0]-A[0],B[1]-A[1])));
  const t0=0,t1=d(P0,P1),t2=t1+d(P1,P2),t3=t2+d(P2,P3);const t=t1+(t2-t1)*u;
  const L=(A,B,ta,tb)=>[((tb-t)*A[0]+(t-ta)*B[0])/(tb-ta),((tb-t)*A[1]+(t-ta)*B[1])/(tb-ta)];
  const A1=L(P0,P1,t0,t1),A2=L(P1,P2,t1,t2),A3=L(P2,P3,t2,t3),B1=L(A1,A2,t0,t2),B2=L(A2,A3,t1,t3);return L(B1,B2,t1,t2)}
// traçado real: spline suave pelos pontos, reamostrada a cada DS metros e com o comprimento oficial
// (y invertido: na tela o y cresce para o sul, assim o mapa não fica espelhado)
function realPath(raw,len){const n=raw.length/2;const p=i=>{i=((i%n)+n)%n;return[raw[2*i],raw[2*i+1]]};const fine=[];
  for(let i=0;i<n;i++){const p0=p(i-1),p1=p(i),p2=p(i+1),p3=p(i+2);const m=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/1.5));for(let s=0;s<m;s++)fine.push(crPoint(p0,p1,p2,p3,s/m))}
  const M=fine.length,cum=[0];for(let i=1;i<=M;i++){const a=fine[i-1],b=fine[i%M];cum.push(cum[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]))}
  const tot=cum[M],sc=len/tot,N=Math.round(len/DS),P=[];let j=0;
  for(let i=0;i<N;i++){const want=i*tot/N;while(cum[j+1]<want)j++;const a=fine[j],b=fine[(j+1)%M],u=(want-cum[j])/Math.max(1e-9,cum[j+1]-cum[j]);P.push({x:(a[0]+(b[0]-a[0])*u)*sc,y:-(a[1]+(b[1]-a[1])*u)*sc,h:0})}
  const hd=i=>{const a=P[((i-1)%N+N)%N],b=P[(i+1)%N];return Math.atan2(b.y-a.y,b.x-a.x)};const raw2=[];
  for(let i=0;i<N;i++){let dh=hd(i+1)-hd(i-1);while(dh>Math.PI)dh-=2*Math.PI;while(dh<-Math.PI)dh+=2*Math.PI;raw2.push(dh/(2*DS))}
  // suaviza o ruído dos vértices (janela gaussiana de ±20 m)
  const kap=[];for(let i=0;i<N;i++){let s=0,w=0;for(let q=-5;q<=5;q++){const ww=Math.exp(-q*q/12);s+=raw2[((i+q)%N+N)%N]*ww;w+=ww}kap.push(s/w)}
  return{P,kap}}
function buildCircuit(id){const C=CIR[id];let P=[],kap=[],first=0,x=0,y=0;
  if(typeof REALTRK!=="undefined"&&REALTRK[id]){const r=realPath(REALTRK[id],C.len);P=r.P;kap=r.kap;x=P[0].x;y=P[0].y;first=RSTART[id]?Math.round(RSTART[id]/DS)%P.length:0}
  else{let segs=parseTurtle(C.t);
  // fechar o ângulo total em ±360°
  const sum=segs.reduce((s,g)=>s+(g.k==="l"?g.ang:g.k==="r"?-g.ang:0),0),want=C.cw?-360:360,res=want-sum,abs=segs.reduce((s,g)=>s+(g.k!=="s"?g.ang:0),0);
  segs=segs.map(g=>g.k==="s"?g:{...g,ang:g.ang+(g.k==="l"?1:-1)*res*g.ang/abs});
  segs.forEach(g=>{if(g.k!=="s"&&g.ang<0){g.k=g.k==="l"?"r":"l";g.ang=-g.ang}});
  // escala para o comprimento oficial
  const raw=segs.reduce((s,g)=>s+(g.k==="s"?g.len:g.ang*Math.PI/180*g.r),0),f=C.len/raw;
  segs.forEach(g=>{if(g.k==="s")g.len*=f;else g.r*=f});
  // integrar
  let h=0;
  for(const g of segs){const L=g.k==="s"?g.len:g.ang*Math.PI/180*g.r;const n=Math.max(1,Math.round(L/DS));const k=g.k==="s"?0:(g.k==="l"?1:-1)/g.r;
    for(let i=0;i<n;i++){P.push({x,y,h});kap.push(k);const d=L/n;if(k===0){x+=Math.cos(h)*d;y+=Math.sin(h)*d}else{const h2=h+k*d;x+=(Math.sin(h2)-Math.sin(h))/k;y+=(-Math.cos(h2)+Math.cos(h))/k;h=h2}}}
  first=segs[0].k==="s"?Math.round(segs[0].len*.55/DS):0}
  // fechar a posição distribuindo o erro
  const N=P.length,ex=x-P[0].x,ey=y-P[0].y;P.forEach((p,i)=>{p.x-=ex*i/N;p.y-=ey*i/N});
  for(let i=0;i<N;i++){const a=P[(i-1+N)%N],b=P[(i+1)%N];P[i].h=Math.atan2(b.y-a.y,b.x-a.x)}
  // curvatura suavizada (±12 m)
  const ks=kap.map((_,i)=>{let s=0;for(let j=-3;j<=3;j++)s+=kap[(i+j+N)%N];return s/7});
  // linha de corrida: por fora na entrada, por dentro no ápice, por fora na saída
  const W=6.2;const absk=ks.map(Math.abs);const line=new Float32Array(N);
  for(let i=0;i<N;i++){let mx=0,sg=0,wsum=0;for(let j=-30;j<=30;j++){const q=(i+j+N)%N;if(absk[q]>mx)mx=absk[q];const w=1-Math.abs(j)/31;sg+=ks[q]*w;wsum+=w}
    if(mx<1/400){line[i]=0;continue}const sm=sg/wsum;const ratio=Math.min(1,absk[i]/mx);line[i]=Math.sign(sm)*W*(2*Math.pow(ratio,.6)-1)*Math.min(1,mx*120)}
  for(let pass=0;pass<3;pass++){const c=Float32Array.from(line);for(let i=0;i<N;i++)line[i]=(c[(i-2+N)%N]+c[(i-1+N)%N]+c[i]*2+c[(i+1)%N]+c[(i+2)%N])/6}
  // linha de corrida otimizada: usa a largura da pista para abrir o raio das curvas (é por ela que o carro calcula a velocidade)
  const kl=new Float32Array(N);{const Wl=6.1,nx=new Float32Array(N),ny=new Float32Array(N);for(let i=0;i<N;i++){nx[i]=-Math.sin(P[i].h);ny[i]=Math.cos(P[i].h)}
    const e=new Float32Array(N),qx=new Float32Array(N),qy=new Float32Array(N);const upd=i=>{qx[i]=P[i].x+nx[i]*e[i];qy[i]=P[i].y+ny[i]*e[i]};for(let i=0;i<N;i++)upd(i);
    // suavização de 4ª ordem (espalha a curvatura): a curva fica com o maior raio possível dentro da pista
    const lx=new Float32Array(N),ly=new Float32Array(N);
    for(const sc of[16,8,4,2])for(let it=0;it<160;it++){for(let i=0;i<N;i++){const a=(i-sc+N)%N,b=(i+sc)%N;lx[i]=(qx[a]+qx[b])/2-qx[i];ly[i]=(qy[a]+qy[b])/2-qy[i]}
      for(let i=0;i<N;i++){const a=(i-sc+N)%N,b=(i+sc)%N;const bx=(lx[a]+lx[b])/2-lx[i],by=(ly[a]+ly[b])/2-ly[i];const d=-(bx*nx[i]+by*ny[i]);e[i]=Math.max(-Wl,Math.min(Wl,e[i]+.35*d));upd(i)}}
    {const e2=Float32Array.from(e);for(let i=0;i<N;i++){let sm=0,w=0;for(let j=-6;j<=6;j++){const ww=Math.exp(-j*j/18);sm+=e2[(i+j+N)%N]*ww;w+=ww}e[i]=Math.max(-Wl,Math.min(Wl,sm/w));upd(i)}}
    const hh=new Float32Array(N);for(let i=0;i<N;i++){const a=(i-1+N)%N,b=(i+1)%N;hh[i]=Math.atan2(qy[b]-qy[a],qx[b]-qx[a])}
    const raw=new Float32Array(N);for(let i=0;i<N;i++){const a=(i-1+N)%N,b=(i+1)%N;let dh=hh[b]-hh[a];while(dh>Math.PI)dh-=2*Math.PI;while(dh<-Math.PI)dh+=2*Math.PI;raw[i]=dh/(Math.hypot(qx[b]-qx[a],qy[b]-qy[a])||2*DS)}
    
    if(typeof REALTRK!=="undefined"&&REALTRK[id])for(let i=0;i<N;i++)line[i]=e[i];
    const KM=+(typeof process!=="undefined"&&process.env&&process.env.KMAX||12);for(let i=0;i<N;i++){let sm=0,w=0;for(let j=-6;j<=6;j++){const ww=Math.exp(-j*j/14);sm+=raw[(i+j+N)%N]*ww;w+=ww}kl[i]=Math.max(-1/KM,Math.min(1/KM,sm/w))}}
  // curvatura da linha que o carro realmente percorre, na mesma curva que o desenho e a dinâmica usam (render.js trackFrame:
  // traçado suavizado ¼-½-¼ e Catmull-Rom, normal pela derivada), com a line interpolada como a pilotagem faz (4 amostras por trecho).
  // O perfil de velocidade é a referência de velocidade segura: não pode supor uma curva mais aberta do que a linha seguida.
  // (o tempo de volta continua calibrado por calibrate())
  {const S=4,ps=P.map((_,i)=>{const a=P[(i-1+N)%N],b=P[i],c=P[(i+1)%N];return{x:(a.x+2*b.x+c.x)/4,y:(a.y+2*b.y+c.y)/4}});
    const qx=new Float32Array(N*S),qy=new Float32Array(N*S);
    for(let i=0;i<N;i++){const j=(i+1)%N,a=ps[i],b=ps[j],pa=ps[(i-1+N)%N],pb=ps[(j+1)%N];const max=(b.x-pa.x)/2,may=(b.y-pa.y)/2,mbx=(pb.x-a.x)/2,mby=(pb.y-a.y)/2;
      for(let q=0;q<S;q++){const k=q/S,k2=k*k,k3=k2*k;const h00=2*k3-3*k2+1,h10=k3-2*k2+k,h01=-2*k3+3*k2,h11=k3-k2,d00=6*k2-6*k,d10=3*k2-4*k+1,d01=-6*k2+6*k,d11=3*k2-2*k;
        const x=h00*a.x+h10*max+h01*b.x+h11*mbx,y=h00*a.y+h10*may+h01*b.y+h11*mby,dx=d00*a.x+d10*max+d01*b.x+d11*mbx,dy=d00*a.y+d10*may+d01*b.y+d11*mby,dl=Math.hypot(dx,dy)||1;
        const yl=line[i]+(line[j]-line[i])*k;qx[i*S+q]=x-dy/dl*yl;qy[i*S+q]=y+dx/dl*yl}}
    const NS=N*S,kr=new Float32Array(NS);for(let n=0;n<NS;n++){const a=(n-1+NS)%NS,b=(n+1)%NS;const h1=Math.atan2(qy[n]-qy[a],qx[n]-qx[a]),h2=Math.atan2(qy[b]-qy[n],qx[b]-qx[n]);let dh=h2-h1;while(dh>Math.PI)dh-=2*Math.PI;while(dh<-Math.PI)dh+=2*Math.PI;kr[n]=dh/((Math.hypot(qx[n]-qx[a],qy[n]-qy[a])+Math.hypot(qx[b]-qx[n],qy[b]-qy[n]))/2||1)}
    const KD=6,SG=+(typeof process!=="undefined"&&process.env&&process.env.KDS||6),W2=Math.ceil(SG*2.5);const ksm=new Float32Array(NS);for(let n=0;n<NS;n++){let sm=0,w=0;for(let j=-W2;j<=W2;j++){const ww=Math.exp(-j*j/(2*SG*SG));sm+=kr[(n+j+NS)%NS]*ww;w+=ww}ksm[n]=sm/w}
    for(let i=0;i<N;i++){let best=0;for(let q=0;q<S;q++){const v=ksm[i*S+q];if(Math.abs(v)>Math.abs(best))best=v}const kd=Math.max(-1/KD,Math.min(1/KD,best));if(Math.abs(kd)>Math.abs(kl[i]))kl[i]=kd}}
  // curvas nomeadas
  const corners=[];for(let i=0;i<N;i++){const k=absk[i];if(k<1/260)continue;let peak=true;for(let j=-25;j<=25;j++){if(!j)continue;const q=absk[(i+j+N)%N];if(q>k||(q===k&&j<0)){peak=false;break}}if(peak&&!(corners.length&&i-corners[corners.length-1].i<20))corners.push({i,dir:Math.sign(ks[i]),r:1/k})}
  corners.forEach((c,j)=>c.n=C.names[j]||`Curva ${j+1}`);
  // zonas de aero ativa (modo reta): retas com mais de 280 m
  const zones=[];let st=-1;for(let k=0;k<N*2;k++){const i=k%N;const flat=absk[i]<1/600;if(flat&&st<0)st=k;if(!flat&&st>=0){if((k-st)*DS>280&&st<N)zones.push([st%N,(k-1)%N]);st=-1}if(k>=N&&st<0)break}
  // linha de largada a 55% da primeira reta
  const rot=(arr)=>{const c=Array.from(arr);return c.slice(first).concat(c.slice(0,first))};
  if(first){const P2=rot(P);P.length=0;P2.forEach(p=>P.push(p));const k2=rot(ks),l2=rot(line),kl2=rot(kl);for(let i=0;i<N;i++){ks[i]=k2[i];line[i]=l2[i];kl[i]=kl2[i]}corners.forEach(c=>c.i=(c.i-first+N)%N);corners.sort((a,b)=>a.i-b.i);corners.forEach((c,j)=>c.n=C.names[j]||`Curva ${j+1}`);for(const z of zones){z[0]=(z[0]-first+N)%N;z[1]=(z[1]-first+N)%N}}
  // área de escape do lado de fora de cada curva: muro nos circuitos de rua, brita ou asfalto nos permanentes
  const GRV={melbourne:.7,suzuka:.85,shanghai:.3,miami:.3,montreal:.45,barcelona:.6,spielberg:.6,silverstone:.55,spa:.7,budapest:.6,zandvoort:.85,monza:.75,austin:.35,mexico:.3,interlagos:.5,lusail:.6,abudhabi:.2};
  corners.forEach((c,j)=>{const h=(hashS(id+":"+j)%1000)/1000;const fastC=c.r>140;c.ro=C.street?(h<.25?"asfalto":"muro"):(h<(GRV[id]??.5)*(fastC?1.15:.85)?"brita":"asfalto")});
  const geo={id,C,P,N,len:N*DS,k:Float32Array.from(kl),kc:Float32Array.from(ks),line,corners,zones,ctr:{x:P.reduce((s,p)=>s+p.x,0)/N,y:P.reduce((s,p)=>s+p.y,0)/N}};
  geo.sectors=[0,Math.floor(N/3),Math.floor(2*N/3)];return geo}
function cornerAt(geo,i){let best=null,bd=1e9;for(const c of geo.corners){let d=(c.i-i+geo.N)%geo.N;if(d>geo.N/2)d-=geo.N;if(Math.abs(d)<bd){bd=Math.abs(d);best=c}}return bd<40?best:null}
