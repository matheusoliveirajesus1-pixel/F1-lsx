// ===================== FÍSICA DO CARRO (regulamento 2026, simplificado) =====================
// Modelo de ponto de massa: velocidade máxima em curva pela aderência + downforce, aceleração pela potência e arrasto, frenagem pela aderência.
const PH={rho:1.2,g:9.81,mass:770,ice:400e3,ers:350e3,cdaCorner:1.42,cdaStraight:.88,cla:4.2,muBrake:1.04,ratioRpm:11800,gears:[96,132,168,203,238,272,306,346]};
const TYRES={
 S:{n:"Macio",c:"#E8333C",mu:1.70,wear:1.55,opt:105,dry:true},
 M:{n:"Médio",c:"#F2C230",mu:1.655,wear:1,opt:100,dry:true},
 H:{n:"Duro",c:"#EDEDED",mu:1.615,wear:.66,opt:95,dry:true},
 I:{n:"Intermediário",c:"#3CB44B",mu:1.42,wear:.95,opt:70,dry:false},
 W:{n:"Chuva",c:"#2B7BE4",mu:1.30,wear:.85,opt:60,dry:false}};
// aderência efetiva conforme pista molhada (0..1)
function tyreMu(comp,wet,wear,temp){const T=TYRES[comp];let mu=T.mu;
  mu*=1-.12*wet;
  if(T.dry)mu*=1-Math.min(.62,wet*.75);
  else if(comp==="I")mu*=1-Math.abs(wet-.45)*.42;
  else mu*=1-Math.max(0,.65-wet)*.55;
  mu*=1-(wear<.7?wear*.06:.042+(wear-.7)*.45);
  if(temp!=null)mu*=1-Math.min(.12,Math.abs(temp-T.opt)*.0022);
  return mu}
const PCACHE={};
// perfil de velocidade (m/s) ao longo da volta; car={pw,cd,cl,mass}, mu, energia ERS (MJ), gk (aderência do circuito)
function speedProfile(geo,car,mu,ersMJ,gk,out){ersMJ*=PH.ersK||1;const N=geo.N,ds=DS,k=geo.k;const m=car.mass,rho=PH.rho,g=PH.g;
  const kd=.5*rho*PH.cla*car.cl;const vmax=out&&out.vmax||new Float32Array(N);const v=out&&out.v||new Float32Array(N);
  const muE=mu*gk;const zone=geo.zoneMask;
  for(let i=0;i<N;i++){const kap=Math.abs(k[i]);if(kap<1e-5){vmax[i]=110;continue}const den=m*kap-muE*kd;vmax[i]=den<=0?110:Math.min(110,Math.sqrt(muE*m*g/den))}
  const pass=(Pw)=>{// para frente (aceleração) e para trás (frenagem)
    let tpl=0;v[0]=vmax[0];
    for(let it=0;it<2;it++)for(let i=0;i<N;i++){const j=(i+1)%N;const vi=Math.max(5,v[i]);const cda=(zone[i]?PH.cdaStraight:PH.cdaCorner)*car.cd;
      const lat=vi*vi*Math.abs(k[i]),amax=muE*(g+kd*vi*vi/m);const comb=Math.sqrt(Math.max(.04,1-(lat/amax)**2));
      const fp=Pw/vi,ft=amax*m*comb;const pl=fp<ft;const a=(Math.min(fp,ft)-.5*rho*cda*vi*vi)/m;
      let vn=Math.sqrt(Math.max(1,vi*vi+2*a*ds));if(vn>vmax[j])vn=vmax[j];if(it===1)v[j]=vn;else v[j]=vn;if(it===1&&pl)tpl+=ds/vi}
    for(let it=0;it<2;it++)for(let i=N-1;i>=0;i--){const j=(i+1)%N;const vj=v[j];const cda=(zone[i]?PH.cdaStraight:PH.cdaCorner)*car.cd;
      const ab=PH.muBrake*(car.bk||1)*muE*(g+kd*vj*vj/m)+.5*rho*cda*vj*vj/m;const vb=Math.sqrt(vj*vj+2*ab*ds);if(v[i]>vb)v[i]=vb}
    return tpl};
  const iceP=PH.ice*car.pw;let tpl=pass(iceP);
  const need=PH.ers/1e6*tpl;const d=Math.min(1,ersMJ/Math.max(.01,need));
  pass(iceP+PH.ers*d);
  let t=0;for(let i=0;i<N;i++)t+=ds/((v[i]+v[(i+1)%N])/2);
  return{v,vmax,t,deploy:d}}
function prepGeo(geo){const m=new Uint8Array(geo.N);geo.zones.forEach(([a,b])=>{for(let i=a;;i=(i+1)%geo.N){m[i]=1;if(i===b)break}});geo.zoneMask=m}
// calibra a aderência do circuito para o tempo de volta de referência (melhor carro, macio novo, sem combustível)
function calibrate(geo){if(geo.gk)return geo.gk;prepGeo(geo);const car={pw:1.04,cd:.98,cl:1.06,mass:PH.mass+2};const mu=tyreMu("S",0,0,null);
  let lo=.6,hi=2.2;for(let it=0;it<28;it++){const mid=(lo+hi)/2;const t=speedProfile(geo,car,mu,4.2,mid).t;if(t>geo.C.target)lo=mid;else hi=mid}geo.gk=(lo+hi)/2;return geo.gk}
function gearRpm(v){const kmh=v*3.6;let g=0;while(g<7&&kmh>PH.gears[g]*.985)g++;const rpm=Math.min(PH.ratioRpm,Math.max(4200,PH.ratioRpm*kmh/PH.gears[g]));return{gear:g+1,rpm}}
function carPhys(team,driver){const c=team.car;return{pw:1+(c.eng-85)*.0045,cd:1-(c.aero-85)*.0012-(c.chas-85)*.0008,cl:1+(c.aero-85)*.0055+(c.chas-85)*.002,bk:1+((c.brk||85)-85)*.003,mass:PH.mass}}
