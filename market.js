// ===================== MERCADO DE PILOTOS (A "DANÇA DAS CADEIRAS" ENTRE TEMPORADAS) =====================
// Todo fim de ano os contratos vencem: veteranos se aposentam, as equipes grandes chamam os melhores pilotos livres
// e as pequenas apostam em estreantes. No meio da temporada, a imprensa solta rumores.
function aiMarket(){const out=[];const me=G.drivers[G.me];const pool=[];G.retired=G.retired||[];
  // 1) contratos que vencem (o seu é tratado à parte, pelas propostas)
  for(const t of G.teams)for(const id of t.drivers.slice()){const d=G.drivers[id];if(!d||d.me)continue;d.contract=(d.contract||1)-1;
    if(d.contract<=0){t.drivers=t.drivers.filter(x=>x!==id);d.prevTeam=t.id;pool.push(d)}}
  // 2) aposentadorias
  for(const d of pool.slice()){if((d.age>=36&&rnd()<.55)||(d.age>=33&&ovr(d)<72&&rnd()<.5)){pool.splice(pool.indexOf(d),1);G.retired.push({n:d.n,year:G.year,titles:d.stats.titles,wins:d.stats.wins});out.push(`${d.n} se aposenta${d.stats.wins?` com ${d.stats.wins} vitória${d.stats.wins>1?"s":""}`:""}.`);d.retired=true;d.team=null}}
  // 3) as equipes escolhem por ordem de prestígio: o melhor piloto livre que aceitar a proposta
  const seats=[];G.teams.slice().sort((a,b)=>b.rep-a.rep).forEach(t=>{for(let i=t.drivers.length;i<2;i++)seats.push(t)});
  for(const t of seats){pool.sort((a,b)=>(ovr(b)+rr(-3,3))-(ovr(a)+rr(-3,3)));let d=pool.find(x=>ovr(x)>=66+(t.rep-60)*.3)||null;
    if(d&&t.rep<70&&ovr(d)>86&&rnd()<.6)d=pool.find(x=>x!==d&&ovr(x)<86)||d;// estrela recusa equipe pequena
    if(d&&rnd()<.82){pool.splice(pool.indexOf(d),1);const mv=d.prevTeam!==t.id;d.team=t.id;d.contract=ri(1,3);d.salary=+Math.max(.5,d.salary*(mv?rr(1,1.35):rr(.95,1.15))).toFixed(1);t.drivers.push(d.id);
      out.push(mv?`${d.n} troca a ${teamOf(d.prevTeam)?teamOf(d.prevTeam).n:"equipe anterior"} pela ${t.n} (${d.contract} ano${d.contract>1?"s":""}).`:`${d.n} renova com a ${t.n}.`)}
    else{const r=newDriver({pace:70+rr(0,9)+(t.rep-60)*.08,team:t.id,age:ri(19,22)});r.contract=ri(2,3);G.drivers[r.id]=r;t.drivers.push(r.id);out.push(`Estreante: ${r.n} (${r.age} anos) assina com a ${t.n}.`)}}
  for(const d of pool){G.retired.push({n:d.n,year:G.year,titles:d.stats.titles,wins:d.stats.wins,free:1});d.retired=true;d.team=null}
  for(const d of Object.values(G.drivers))delete d.prevTeam;
  G.lastMarket={year:G.year+1,moves:out};return out}
// rumores no meio do ano (uma vez por temporada, na metade do calendário)
function marketRumors(){if(!G||G.rumorSeason===G.season||G.round<Math.floor(G.calendar.length/2))return;G.rumorSeason=G.season;
  const exp=Object.values(G.drivers).filter(d=>!d.me&&!d.retired&&d.team&&(d.contract||1)<=1).sort((a,b)=>ovr(b)-ovr(a)).slice(0,3);
  exp.forEach(d=>{const big=G.teams.filter(t=>t.id!==d.team&&t.rep>teamOf(d.team).rep).sort((a,b)=>b.rep-a.rep)[0];if(!big)return;
    const j=pick(JOURNOS);post("journo",`Rumor no paddock: o contrato de ${d.n} com a ${teamOf(d.team).n} acaba neste ano e a ${big.n} já fez contato. 👀`,{likes:ri(800,6000),journo:j})});
  if(exp.length)news(`Mercado de pilotos: ${exp.map(d=>d.code).join(", ")} estão com o contrato no fim. A dança das cadeiras começou.`)}
