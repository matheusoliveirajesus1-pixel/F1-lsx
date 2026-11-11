// ===================== PATROCINADORES (marcas fictícias do jogo) =====================
// Catálogo único: nome, setor, cores e um símbolo próprio. As 8 primeiras já existiam como patrocinadores pessoais
// (team.js, SPONS); as outras completam o grid para cada carro ter o seu e haver opções para trocar.
// Mais tarde, num campeonato com jogadores, basta trocar nome/cor/símbolo de um item para vender o espaço.
const SPONSOR_CAT=[
  {id:"carga",n:"Carga Express",sec:"logística",c:"#FF8A00",c2:"#1B1B1B",mk:"box"},
  {id:"voltix",n:"Voltix Energy",sec:"bebida energética",c:"#B8FF2E",c2:"#111111",mk:"bolt"},
  {id:"rush",n:"Rush Games",sec:"games e streaming",c:"#9B5DE5",c2:"#FFFFFF",mk:"play"},
  {id:"aeris",n:"Aeris Audio",sec:"fones de ouvido",c:"#00C2FF",c2:"#0B1320",mk:"wave"},
  {id:"brava",n:"Brava",sec:"moda",c:"#F15BB5",c2:"#FFFFFF",mk:"diamond"},
  {id:"solaris",n:"Solaris",sec:"energia solar",c:"#FFC300",c2:"#1B1B1B",mk:"sun"},
  {id:"nimbus",n:"Nimbus Bank",sec:"banco digital",c:"#3A86FF",c2:"#FFFFFF",mk:"cloud"},
  {id:"tempora",n:"Tempora",sec:"relógios de luxo",c:"#C9A227",c2:"#111111",mk:"clock"},
  {id:"petrova",n:"Petrova",sec:"combustível e lubrificantes",c:"#C1121F",c2:"#FFD60A",mk:"drop"},
  {id:"kairo",n:"Kairo Telecom",sec:"telefonia e internet",c:"#7B2CBF",c2:"#FFFFFF",mk:"signal"},
  {id:"orbis",n:"Orbis Cloud",sec:"tecnologia",c:"#00B4D8",c2:"#03045E",mk:"orbit"},
  {id:"ferrox",n:"Ferrox",sec:"aço e metalurgia",c:"#ADB5BD",c2:"#1B1F24",mk:"hex"},
  {id:"atlas",n:"Atlas Seguros",sec:"seguros",c:"#0A9396",c2:"#FFFFFF",mk:"shield"},
  {id:"zenite",n:"Zênite Air",sec:"companhia aérea",c:"#023E8A",c2:"#48CAE4",mk:"plane"},
  {id:"brisa",n:"Brisa Cola",sec:"refrigerante",c:"#D00000",c2:"#FFFFFF",mk:"bubbles"},
  {id:"vortex",n:"Vortex Motors",sec:"carros de rua",c:"#FF5400",c2:"#212529",mk:"swirl"},
  {id:"pixel",n:"Pixel Forge",sec:"software",c:"#3A0CA3",c2:"#4CC9F0",mk:"pixels"},
  {id:"kora",n:"Kora Café",sec:"café",c:"#6F4518",c2:"#FFE8D6",mk:"bean"},
  {id:"halo",n:"Halo Saúde",sec:"saúde",c:"#2EC4B6",c2:"#FFFFFF",mk:"cross"},
  {id:"titan",n:"Titan Ferramentas",sec:"ferramentas",c:"#FCA311",c2:"#14213D",mk:"gear"},
  {id:"mira",n:"Mira Óculos",sec:"óculos",c:"#E5383B",c2:"#FFFFFF",mk:"lens"},
  {id:"equinox",n:"Equinox Viagens",sec:"turismo",c:"#F77F00",c2:"#003049",mk:"horizon"},
  {id:"coral",n:"Coral Cosméticos",sec:"cosméticos",c:"#FF6B6B",c2:"#FFF1E6",mk:"petal"},
  {id:"rota",n:"Rota GPS",sec:"mapas e navegação",c:"#06D6A0",c2:"#073B4C",mk:"pin"}];
// símbolos (caixa 24×24, cor do símbolo = s)
const SP_MARK={
  box:s=>`<path d="M4 8 L12 4 L20 8 V16 L12 20 L4 16Z M4 8 L12 12 L20 8 M12 12 V20" fill="none" stroke="${s}" stroke-width="2" stroke-linejoin="round"/>`,
  bolt:s=>`<path d="M13.5 2.5 L5.5 13.5 L11 13.5 L9.5 21.5 L18.5 9.5 L12.8 9.5Z" fill="${s}"/>`,
  play:s=>`<path d="M8 5 L19 12 L8 19Z" fill="${s}"/>`,
  wave:s=>`<path d="M3 12 H5 M7 8 V16 M11 5 V19 M15 8 V16 M19 10.5 V13.5" stroke="${s}" stroke-width="2.2" stroke-linecap="round"/>`,
  diamond:s=>`<path d="M12 3 L20 12 L12 21 L4 12Z" fill="none" stroke="${s}" stroke-width="2.2"/><path d="M12 8 L16 12 L12 16 L8 12Z" fill="${s}"/>`,
  sun:s=>`<circle cx="12" cy="12" r="4.5" fill="${s}"/><path d="M12 2.5 V5 M12 19 V21.5 M2.5 12 H5 M19 12 H21.5 M5.3 5.3 L7 7 M17 17 L18.7 18.7 M5.3 18.7 L7 17 M17 7 L18.7 5.3" stroke="${s}" stroke-width="2" stroke-linecap="round"/>`,
  cloud:s=>`<path d="M7 18 H17.5 A4 4 0 0 0 17 10 A5.5 5.5 0 0 0 6.5 11 A3.5 3.5 0 0 0 7 18Z" fill="${s}"/>`,
  clock:s=>`<circle cx="12" cy="12" r="8.5" fill="none" stroke="${s}" stroke-width="2"/><path d="M12 7 V12 L15.5 14" stroke="${s}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  drop:s=>`<path d="M12 3 C15 8 18 10.5 18 14.5 A6 6 0 0 1 6 14.5 C6 10.5 9 8 12 3Z" fill="${s}"/>`,
  signal:s=>`<circle cx="6" cy="18" r="2" fill="${s}"/><path d="M6 12 A6 6 0 0 1 12 18 M6 7 A11 11 0 0 1 17 18" fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round"/>`,
  orbit:s=>`<ellipse cx="12" cy="12" rx="9" ry="4.5" fill="none" stroke="${s}" stroke-width="2" transform="rotate(-25 12 12)"/><circle cx="12" cy="12" r="3" fill="${s}"/>`,
  hex:s=>`<path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5Z" fill="${s}"/><circle cx="12" cy="12" r="3" fill="none" stroke="#1B1F24" stroke-width="2"/>`,
  shield:s=>`<path d="M12 3 L19.5 6 V11 C19.5 16 16 19.5 12 21 C8 19.5 4.5 16 4.5 11 V6Z" fill="${s}"/><path d="M8.5 12 L11 14.5 L15.8 9.5" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  plane:s=>`<path d="M3 13 L21 6 L15 20 L12 14Z" fill="${s}"/><path d="M12 14 L21 6" stroke="#FFFFFF" stroke-width="1.2"/>`,
  bubbles:s=>`<circle cx="9" cy="14" r="5" fill="${s}"/><circle cx="16.5" cy="8" r="3.2" fill="${s}"/><circle cx="18" cy="16" r="2" fill="${s}"/>`,
  swirl:s=>`<path d="M12 12 m-1 0 a1 1 0 0 1 2 0 a3 3 0 0 1 -5 2 a5 5 0 0 1 4 -8 a7 7 0 0 1 7 7 a8 8 0 0 1 -8 8" fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round"/>`,
  pixels:s=>`<rect x="4" y="4" width="6" height="6" fill="${s}"/><rect x="14" y="4" width="6" height="6" fill="${s}" opacity=".6"/><rect x="4" y="14" width="6" height="6" fill="${s}" opacity=".6"/><rect x="14" y="14" width="6" height="6" fill="${s}"/>`,
  bean:s=>`<ellipse cx="12" cy="12" rx="6" ry="8.5" fill="${s}" transform="rotate(25 12 12)"/><path d="M9 5.5 C13 9 11 15 15 18.5" stroke="#FFFFFF" stroke-width="1.6" fill="none"/>`,
  cross:s=>`<path d="M9.5 4 H14.5 V9.5 H20 V14.5 H14.5 V20 H9.5 V14.5 H4 V9.5 H9.5Z" fill="${s}"/>`,
  gear:s=>`<path d="M10.5 2.5 H13.5 L14 5 L16.3 6 L18.4 4.6 L20.4 6.6 L19 8.7 L20 11 L22.5 11.5 V14.5 L20 15 L19 17.3 L20.4 19.4 L18.4 21.4 L16.3 20 L14 21 L13.5 23.5 H10.5 L10 21 L7.7 20 L5.6 21.4 L3.6 19.4 L5 17.3 L4 15 L1.5 14.5 V11.5 L4 11 L5 8.7 L3.6 6.6 L5.6 4.6 L7.7 6 L10 5Z" fill="${s}" transform="scale(.9) translate(1.3 0)"/><circle cx="12" cy="12" r="3.2" fill="#FFFFFF"/>`,
  lens:s=>`<circle cx="7.5" cy="13" r="4" fill="none" stroke="${s}" stroke-width="2.2"/><circle cx="16.5" cy="13" r="4" fill="none" stroke="${s}" stroke-width="2.2"/><path d="M11.5 13 H12.5" stroke="${s}" stroke-width="2.2"/>`,
  horizon:s=>`<path d="M5 15 A7 7 0 0 1 19 15Z" fill="${s}"/><path d="M3 18 H21" stroke="${s}" stroke-width="2.2" stroke-linecap="round"/>`,
  petal:s=>`<path d="M12 3 C16 7 16 11 12 13 C8 11 8 7 12 3Z M12 13 C16 11 20 13 20 17 C16 19 13 17 12 13Z M12 13 C11 17 8 19 4 17 C4 13 8 11 12 13Z" fill="${s}"/>`,
  pin:s=>`<path d="M12 21 C8 15.5 6 12.5 6 9.5 A6 6 0 0 1 18 9.5 C18 12.5 16 15.5 12 21Z" fill="${s}"/><circle cx="12" cy="9.5" r="2.4" fill="#FFFFFF"/>`};
function sponsorOf(id){return SPONSOR_CAT.find(s=>s.id===id)||null}
// emblema quadrado (fundo na cor principal, símbolo na segunda cor)
function sponsorMarkSvg(sp,px){if(!sp)return"";const f=SP_MARK[sp.mk]||SP_MARK.diamond;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${px||24}" height="${px||24}"><rect width="24" height="24" rx="5" fill="${sp.c}"/>${f(sp.c2)}</svg>`}
// logotipo completo: símbolo + nome (para placas, menus e a transmissão)
function sponsorLogoSvg(sp,h){if(!sp)return"";h=h||32;const name=String(sp.n).toUpperCase().replace(/[&<>]/g,"");const vw=25+name.length*7.5+5,w=Math.round(h*vw/24);const f=SP_MARK[sp.mk]||SP_MARK.diamond;
  return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} 24" width="${w}" height="${h}"><rect width="${vw}" height="24" rx="4" fill="${sp.c2}"/><g transform="translate(2 2) scale(.8333)"><rect width="24" height="24" rx="5" fill="${sp.c}"/>${f(sp.c2)}</g><text x="25" y="16.6" textLength="${name.length*7.5}" lengthAdjust="spacingAndGlyphs" font-family="'Titillium Web',system-ui,sans-serif" font-weight="900" font-style="italic" font-size="12" fill="${sp.c}">${name}</text></svg>`}
// patrocinadores de cada equipe no carro: [principal (asa traseira e cor do sidepod), secundário (nome no sidepod)]
const TEAM_SPON={mercedes:["orbis","atlas"],ferrari:["petrova","tempora"],redbull:["voltix","zenite"],racingbulls:["pixel","kairo"],mclaren:["vortex","rush"],
  alpine:["coral","equinox"],haas:["titan","ferrox"],audi:["nimbus","halo"],williams:["aeris","rota"],astonmartin:["solaris","kora"],cadillac:["carga","mira"]};
// equipe sem lista (online/personalizada): escolhe pelo nome, sempre o mesmo para a mesma equipe
function carSponsors(t){if(!t)return null;if(t._sp)return t._sp;let ids=(typeof G!=="undefined"&&G&&G.carSpon&&G.carSpon[t.id])||TEAM_SPON[t.id];
  if(!ids){let h=0;for(const ch of String(t.id||t.n||""))h=(h*31+ch.charCodeAt(0))|0;h=Math.abs(h);ids=[SPONSOR_CAT[h%SPONSOR_CAT.length].id,SPONSOR_CAT[(h>>5)%SPONSOR_CAT.length].id]}
  const r={m:sponsorOf(ids[0]),s:sponsorOf(ids[1])};Object.defineProperty(t,"_sp",{value:r,enumerable:false,configurable:true,writable:true});return r}
